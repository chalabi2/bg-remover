from flask import Flask, request, send_file, abort, jsonify
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
import os
import uuid
import json
from datetime import datetime, timedelta
import shutil

import sys
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

# Storage configuration
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
METADATA_FILE = 'image_metadata.json'
CLEANUP_INTERVAL = 24 * 60 * 60  # 24 hours in seconds
MAX_STORAGE_AGE = 7 * 24 * 60 * 60  # 7 days in seconds

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# Load metadata
def load_metadata():
    if os.path.exists(METADATA_FILE):
        try:
            with open(METADATA_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_metadata(metadata):
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)

# Content filtering using NSFW detection
def is_safe_content(image):
    """Basic content filtering - can be enhanced with more sophisticated models"""
    try:
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Basic checks - can be enhanced with NSFW detection models
        # For now, we'll do basic size and format checks
        width, height = image.size
        
        # Reject extremely large images (potential abuse)
        if width * height > 10000 * 10000:  # 100MP limit
            return False, "Image resolution too high"
        
        # Reject images that are too small (likely not photos)
        if width < 50 or height < 50:
            return False, "Image too small"
        
        # Basic color analysis - very simple heuristic
        # This is a placeholder - should be replaced with proper NSFW detection
        pixels = list(image.getdata())
        if len(pixels) > 1000:  # Sample pixels for analysis
            sample_pixels = pixels[::len(pixels)//1000]
            avg_r = sum(p[0] for p in sample_pixels) / len(sample_pixels)
            avg_g = sum(p[1] for p in sample_pixels) / len(sample_pixels)
            avg_b = sum(p[2] for p in sample_pixels) / len(sample_pixels)
            
            # Very basic skin tone detection (this is just a placeholder)
            # In production, use proper NSFW detection models
            if avg_r > 200 and avg_g > 150 and avg_b > 100:
                # This is a very crude check - replace with proper detection
                pass
        
        return True, "Content appears safe"
        
    except Exception as e:
        return False, f"Error analyzing content: {str(e)}"

# Cleanup old files
def cleanup_old_files():
    """Remove files older than MAX_STORAGE_AGE"""
    try:
        metadata = load_metadata()
        current_time = datetime.now()
        files_to_remove = []
        
        for file_id, file_data in metadata.items():
            upload_time = datetime.fromisoformat(file_data['upload_time'])
            if (current_time - upload_time).total_seconds() > MAX_STORAGE_AGE:
                files_to_remove.append(file_id)
        
        for file_id in files_to_remove:
            # Remove original file
            original_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.jpg")
            if os.path.exists(original_path):
                os.remove(original_path)
            
            # Remove processed file
            processed_path = os.path.join(PROCESSED_FOLDER, f"{file_id}.png")
            if os.path.exists(processed_path):
                os.remove(processed_path)
            
            # Remove from metadata
            del metadata[file_id]
        
        if files_to_remove:
            save_metadata(metadata)
            logger.info(f"Cleaned up {len(files_to_remove)} old files")
            
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")

# Schedule cleanup
def schedule_cleanup():
    """Run cleanup every CLEANUP_INTERVAL seconds"""
    while True:
        time.sleep(CLEANUP_INTERVAL)
        cleanup_old_files()

# Start cleanup thread
cleanup_thread = threading.Thread(target=schedule_cleanup, daemon=True)
cleanup_thread.start()

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
    r"/images": {
        "origins": [f"https://{domain}" for domain in ALLOWED_DOMAINS] + [f"http://{domain}" for domain in ALLOWED_DOMAINS],
        "methods": ["GET", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    },
    r"/image/*": {
        "origins": [f"https://{domain}" for domain in ALLOWED_DOMAINS] + [f"http://{domain}" for domain in ALLOWED_DOMAINS],
        "methods": ["GET", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    },
    r"/upload": {
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

@app.route('/upload', methods=['POST'])
@require_domain
def upload_image():
    """Upload and store image with metadata"""
    try:
        if 'image' not in request.files:
            return {'error': 'No image file provided'}, 400
        
        file = request.files['image']
        if file.filename == '':
            return {'error': 'No file selected'}, 400
        
        # Get title from form data
        title = request.form.get('title', file.filename)
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'heic', 'heif', 'tiff', 'tif'}
        if not file.filename.lower().endswith(tuple('.' + ext for ext in allowed_extensions)):
            return {
                'error': f'Unsupported file type: {file.filename}. Please upload a JPEG, PNG, GIF, BMP, WebP, HEIC, HEIF, or TIFF image.'
            }, 400
        
        # Load and validate image
        try:
            img = Image.open(file.stream).convert("RGB")
        except Exception as e:
            return {'error': f'Invalid image file: {str(e)}'}, 400
        
        # Content filtering
        is_safe, safety_message = is_safe_content(img)
        if not is_safe:
            return {'error': f'Content not allowed: {safety_message}'}, 400
        
        # Generate unique ID and save file
        file_id = str(uuid.uuid4())
        original_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.jpg")
        
        # Save original image
        img.save(original_path, 'JPEG', quality=95)
        
        # Save metadata
        metadata = load_metadata()
        metadata[file_id] = {
            'id': file_id,
            'original_filename': file.filename,
            'title': title,
            'upload_time': datetime.now().isoformat(),
            'status': 'uploaded',
            'processed': False
        }
        save_metadata(metadata)
        
        logger.info(f"Uploaded image: {file_id} - {title}")
        return {
            'id': file_id,
            'title': title,
            'message': 'Image uploaded successfully'
        }
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return {'error': 'Upload failed'}, 500

@app.route('/images', methods=['GET'])
@require_domain
def list_images():
    """List all uploaded images"""
    try:
        metadata = load_metadata()
        images = []
        
        for file_id, file_data in metadata.items():
            original_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.jpg")
            processed_path = os.path.join(PROCESSED_FOLDER, f"{file_id}.png")
            
            if os.path.exists(original_path):
                images.append({
                    'id': file_id,
                    'title': file_data.get('title', file_data.get('original_filename', 'Untitled')),
                    'original_filename': file_data.get('original_filename', ''),
                    'upload_time': file_data['upload_time'],
                    'status': file_data.get('status', 'uploaded'),
                    'processed': file_data.get('processed', False),
                    'has_original': os.path.exists(original_path),
                    'has_processed': os.path.exists(processed_path)
                })
        
        # Sort by upload time (newest first)
        images.sort(key=lambda x: x['upload_time'], reverse=True)
        
        return jsonify(images)
        
    except Exception as e:
        logger.error(f"List images error: {str(e)}")
        return {'error': 'Failed to list images'}, 500

@app.route('/image/<file_id>', methods=['GET'])
@require_domain
def get_image(file_id):
    """Get image details"""
    try:
        metadata = load_metadata()
        if file_id not in metadata:
            return {'error': 'Image not found'}, 404
        
        file_data = metadata[file_id]
        original_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.jpg")
        processed_path = os.path.join(PROCESSED_FOLDER, f"{file_id}.png")
        
        return {
            'id': file_id,
            'title': file_data.get('title', file_data.get('original_filename', 'Untitled')),
            'original_filename': file_data.get('original_filename', ''),
            'upload_time': file_data['upload_time'],
            'status': file_data.get('status', 'uploaded'),
            'processed': file_data.get('processed', False),
            'has_original': os.path.exists(original_path),
            'has_processed': os.path.exists(processed_path)
        }
        
    except Exception as e:
        logger.error(f"Get image error: {str(e)}")
        return {'error': 'Failed to get image'}, 500

@app.route('/image/<file_id>/title', methods=['PUT'])
@require_domain
def update_title(file_id):
    """Update image title"""
    try:
        data = request.get_json()
        if not data or 'title' not in data:
            return {'error': 'Title is required'}, 400
        
        title = data['title'].strip()
        if not title:
            return {'error': 'Title cannot be empty'}, 400
        
        metadata = load_metadata()
        if file_id not in metadata:
            return {'error': 'Image not found'}, 404
        
        metadata[file_id]['title'] = title
        save_metadata(metadata)
        
        return {'message': 'Title updated successfully', 'title': title}
        
    except Exception as e:
        logger.error(f"Update title error: {str(e)}")
        return {'error': 'Failed to update title'}, 500

@app.route('/image/<file_id>', methods=['DELETE'])
@require_domain
def delete_image(file_id):
    """Delete image and its files"""
    try:
        metadata = load_metadata()
        if file_id not in metadata:
            return {'error': 'Image not found'}, 404
        
        # Get file data for logging
        file_data = metadata[file_id]
        title = file_data.get('title', file_data.get('original_filename', 'Untitled'))
        
        # Delete files from filesystem
        original_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.jpg")
        processed_path = os.path.join(PROCESSED_FOLDER, f"{file_id}.png")
        
        files_deleted = []
        if os.path.exists(original_path):
            os.remove(original_path)
            files_deleted.append('original')
        
        if os.path.exists(processed_path):
            os.remove(processed_path)
            files_deleted.append('processed')
        
        # Remove from metadata
        del metadata[file_id]
        save_metadata(metadata)
        
        logger.info(f"Deleted image: {file_id} - {title} (files: {', '.join(files_deleted)})")
        return {'message': 'Image deleted successfully', 'files_deleted': files_deleted}
        
    except Exception as e:
        logger.error(f"Delete image error: {str(e)}")
        return {'error': 'Failed to delete image'}, 500

@app.route('/image/<file_id>/original', methods=['GET'])
@require_domain
def get_original_image(file_id):
    """Get original image file"""
    try:
        metadata = load_metadata()
        if file_id not in metadata:
            return {'error': 'Image not found'}, 404
        
        original_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.jpg")
        if not os.path.exists(original_path):
            return {'error': 'Original image not found'}, 404
        
        return send_file(original_path, mimetype='image/jpeg')
        
    except Exception as e:
        logger.error(f"Get original image error: {str(e)}")
        return {'error': 'Failed to get original image'}, 500

@app.route('/image/<file_id>/processed', methods=['GET'])
@require_domain
def get_processed_image(file_id):
    """Get processed image file"""
    try:
        metadata = load_metadata()
        if file_id not in metadata:
            return {'error': 'Image not found'}, 404
        
        processed_path = os.path.join(PROCESSED_FOLDER, f"{file_id}.png")
        if not os.path.exists(processed_path):
            return {'error': 'Processed image not found'}, 404
        
        return send_file(processed_path, mimetype='image/png')
        
    except Exception as e:
        logger.error(f"Get processed image error: {str(e)}")
        return {'error': 'Failed to get processed image'}, 500

@app.route('/remove-background', methods=['POST'])
@require_domain
def remove_background():
    global is_processing
    
    try:
        # Get file ID from request
        data = request.get_json()
        if not data or 'file_id' not in data:
            return {'error': 'File ID is required'}, 400
        
        file_id = data['file_id']
        
        # Check if image exists
        metadata = load_metadata()
        if file_id not in metadata:
            return {'error': 'Image not found'}, 404
        
        file_data = metadata[file_id]
        original_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.jpg")
        
        if not os.path.exists(original_path):
            return {'error': 'Original image not found'}, 404
        
        # Process image
        with processing_lock:
            is_processing = True
            try:
                # Load image
                img = Image.open(original_path).convert("RGB")
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
                
                # Save processed image
                processed_path = os.path.join(PROCESSED_FOLDER, f"{file_id}.png")
                result.save(processed_path, 'PNG', optimize=True, quality=95)
                
                # Update metadata
                file_data['processed'] = True
                file_data['status'] = 'completed'
                file_data['processed_time'] = datetime.now().isoformat()
                metadata[file_id] = file_data
                save_metadata(metadata)
                
                logger.info(f"Processed image: {file_id} - {file_data.get('title', 'Untitled')}")
                return {'message': 'Background removed successfully'}
                
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
