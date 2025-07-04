from flask import Flask, request, send_file, abort
from flask_cors import CORS
from PIL import Image
import io
import torch
from transformers import pipeline
import logging
from functools import lru_cache, wraps
import math
import threading
import time

import sys
import os
import zipfile

# Import for HEIC/HEIF support
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
    HEIF_SUPPORTED = True
except ImportError:
    HEIF_SUPPORTED = False

# Configure Flask app with file size limits
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB limit

# Domain-based access control
ALLOWED_DOMAINS = ["rmbg.jchalabi.xyz", "asus-3.duckdns.org", "backend-rmbg.jchalabi.xyz"]

def require_domain(f):
    """Decorator to restrict access to specific domains"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get the origin from the request
        origin = request.headers.get('Origin')
        referer = request.headers.get('Referer')
        
        # Check if the request comes from any of the allowed domains
        allowed = False
        for domain in ALLOWED_DOMAINS:
            if origin and (origin.startswith(f"https://{domain}") or origin.startswith(f"http://{domain}")):
                allowed = True
                break
            elif referer and (referer.startswith(f"https://{domain}") or referer.startswith(f"http://{domain}")):
                allowed = True
                break
        
        if allowed:
            return f(*args, **kwargs)
        else:
            # Log unauthorized access attempts
            logger.warning(f"Unauthorized access attempt from origin: {origin}, referer: {referer}")
            abort(403, description=f"Access denied")
    
    return decorated_function

# CORS configuration - allow your specific domains for background removal
CORS(app, resources={
    r"/remove-background": {
        "origins": [f"https://{domain}" for domain in ALLOWED_DOMAINS] + [f"http://{domain}" for domain in ALLOWED_DOMAINS],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    },
    r"/health": {
        "origins": "*",  # Allow health checks from anywhere
        "methods": ["GET", "OPTIONS"]
    }
})

# Production logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Log HEIF support status
if not HEIF_SUPPORTED:
    logger.warning("pillow-heif not available. HEIC/HEIF formats will not be supported.")

if torch.cuda.is_available():
    device = torch.device("cuda")
    logger.info(f"CUDA is available. Using GPU: {torch.cuda.get_device_name(0)}")
    logger.info(f"CUDA version: {torch.version.cuda}")
    logger.info(f"PyTorch CUDA version: {torch.version.cuda}")
    logger.info(f"Number of GPUs: {torch.cuda.device_count()}")
else:
    device = torch.device("cpu")
    logger.info("CUDA is not available. Using CPU.")

# Global model instance - loaded lazily
_model = None
_model_lock = threading.Lock()

# Simple processing lock for sequential processing
processing_lock = threading.Lock()
is_processing = False

def get_model():
    """Get or initialize the model with thread safety"""
    global _model
    with _model_lock:
        if _model is None:
            logger.info("Initializing model...")
            # Use float32 for consistency to avoid dtype mismatches
            _model = pipeline("image-segmentation", 
                            model="briaai/RMBG-1.4", 
                            trust_remote_code=True, 
                            device=device,
                            torch_dtype=torch.float32)
            logger.info(f"Model loaded on device: {_model.device}")
    return _model

def smart_resize(img, max_size=1920, max_area=2073600):  # 1920x1080 = 2,073,600 pixels
    """
    Resize image while preserving aspect ratio and pixel density.
    Returns both the resized image and the original dimensions for restoration.
    """
    original_size = img.size
    width, height = img.size
    aspect_ratio = width / height
    
    if width * height <= max_area and max(width, height) <= max_size:
        return img, original_size
    
    if aspect_ratio > 1:  # Landscape
        new_width = min(max_size, int(math.sqrt(max_area * aspect_ratio)))
        new_height = int(new_width / aspect_ratio)
    else:  # Portrait or square
        new_height = min(max_size, int(math.sqrt(max_area / aspect_ratio)))
        new_width = int(new_height * aspect_ratio)
    
    resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    return resized_img, original_size

def process_image_safe(file):
    """Process a single image with thread safety and support for various formats including HEIC/HEIF"""
    try:
        # Handle HEIC/HEIF files if supported
        file_extension = file.filename.lower().split('.')[-1] if file.filename else ''
        
        if file_extension in ['heic', 'heif'] and not HEIF_SUPPORTED:
            logger.error(f"HEIC/HEIF file {file.filename} uploaded but pillow-heif not available")
            raise Exception("HEIC/HEIF format not supported on this server")
        
        # Load and prepare image
        img = Image.open(file.stream).convert("RGB")
        original_size = img.size
        
        # Resize for processing while preserving original dimensions
        img_resized, original_dimensions = smart_resize(img)
        
        # Get model and process image with thread safety
        model = get_model()
        with _model_lock:
            result = model(img_resized)
        
        # Restore original dimensions if the image was resized
        if result.size != original_dimensions:
            result = result.resize(original_dimensions, Image.Resampling.LANCZOS)
        
        # Save result with high quality
        img_io = io.BytesIO()
        result.save(img_io, 'PNG', optimize=True, quality=95)
        img_io.seek(0)
        
        logger.info(f"Processed image: {file.filename}, original size: {original_size}, processed size: {result.size}, format: {file_extension}")
        return img_io
        
    except Exception as e:
        logger.error(f"Error processing image {file.filename}: {str(e)}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for production monitoring - accessible from anywhere"""
    with processing_lock:
        currently_processing = is_processing
    
    return {
        'status': 'healthy', 
        'gpu_available': torch.cuda.is_available(),
        'queue_size': 0,  # No queue system, just sequential processing
        'currently_processing': currently_processing
    }, 200

@app.route('/remove-background', methods=['POST'])
@require_domain
def remove_background():
    global is_processing
    
    try:
        # Enhanced debugging for mobile issues
        logger.info(f"Request files keys: {list(request.files.keys())}")
        logger.info(f"Request form keys: {list(request.form.keys())}")
        logger.info(f"Request headers: {dict(request.headers)}")
        
        if 'image' not in request.files:
            logger.warning('No image file provided in request')
            return {'error': 'No image file provided'}, 400
        
        # Handle both single file and multiple files
        files = request.files.getlist('image')
        logger.info(f"Files received: {len(files)}")
        for i, file in enumerate(files):
            logger.info(f"File {i}: filename={file.filename}, content_type={file.content_type}, size={len(file.read())} bytes")
            file.seek(0)  # Reset file pointer after reading for size
        
        if not files or files[0].filename == '':
            logger.warning('No file selected in request')
            return {'error': 'No file selected'}, 400
        
        # Validate file types - Added support for iPhone formats
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'heic', 'heif', 'tiff', 'tif'}
        for file in files:
            if not file.filename.lower().endswith(tuple('.' + ext for ext in allowed_extensions)):
                logger.warning(f'Invalid file type: {file.filename}')
                return {
                    'error': f'Unsupported file type: {file.filename}. Please upload a JPEG, PNG, GIF, BMP, WebP, HEIC, HEIF, or TIFF image.'
                }, 400
        
        # Process images sequentially with lock
        with processing_lock:
            is_processing = True
            try:
                results = []
                for file in files:
                    try:
                        result = process_image_safe(file)
                        results.append(result)
                    except Exception as e:
                        logger.error(f"Failed to process {file.filename}: {str(e)}")
                        error_message = str(e)
                        
                        # Provide more specific error messages
                        if "HEIC/HEIF format not supported" in error_message:
                            return {
                                'error': f'HEIC/HEIF format not supported for {file.filename}. Please convert to JPEG or PNG first.'
                            }, 400
                        elif "memory" in error_message.lower():
                            return {
                                'error': f'Image too large to process: {file.filename}. Please try a smaller image.'
                            }, 413
                        else:
                            return {
                                'error': f'Failed to process {file.filename}: {error_message}'
                            }, 500
                
                # Return results
                if len(results) == 1:
                    logger.info(f"Returning single processed image: {files[0].filename}")
                    return send_file(results[0], mimetype='image/png')
                else:
                    # If multiple images, zip them
                    zip_io = io.BytesIO()
                    with zipfile.ZipFile(zip_io, 'w') as zip_file:
                        for i, result in enumerate(results):
                            zip_file.writestr(f'image_{i}.png', result.getvalue())
                    zip_io.seek(0)
                    logger.info(f"Returning ZIP with {len(results)} images.")
                    return send_file(zip_io, mimetype='application/zip', as_attachment=True, download_name='processed_images.zip')
            
            finally:
                is_processing = False
    
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        error_message = str(e)
        
        # Provide user-friendly error messages
        if "413" in error_message or "too large" in error_message.lower():
            return {'error': 'File size too large for processing. Please try a smaller image.'}, 413
        elif "memory" in error_message.lower():
            return {'error': 'Image too large to process. Please try a smaller image.'}, 413
        elif "format" in error_message.lower():
            return {'error': 'Unsupported image format. Please upload a JPEG, PNG, GIF, BMP, WebP, HEIC, HEIF, or TIFF image.'}, 400
        else:
            return {'error': 'An error occurred while processing your image. Please try again.'}, 500

if __name__ == '__main__':
    # Development mode
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    
    app.run(debug=debug_mode, host=host, port=port)
