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
import hashlib

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
METADATA_FOLDER = 'metadata'
CLEANUP_INTERVAL = 24 * 60 * 60  # 24 hours in seconds
MAX_STORAGE_AGE = 7 * 24 * 60 * 60  # 7 days in seconds

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)
os.makedirs(METADATA_FOLDER, exist_ok=True)

# User authentication helper
def get_user_id():
    """Get user ID from request headers"""
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return None
    # Hash the user ID to create a safe filename
    return hashlib.sha256(user_id.encode()).hexdigest()[:16]

def require_user_auth(f):
    """Decorator to require user authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = get_user_id()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_user_paths(user_id):
    """Get user-specific paths for storage"""
    user_upload_folder = os.path.join(UPLOAD_FOLDER, user_id)
    user_processed_folder = os.path.join(PROCESSED_FOLDER, user_id)
    user_metadata_file = os.path.join(METADATA_FOLDER, f'{user_id}.json')
    
    # Create user directories if they don't exist
    os.makedirs(user_upload_folder, exist_ok=True)
    os.makedirs(user_processed_folder, exist_ok=True)
    
    return user_upload_folder, user_processed_folder, user_metadata_file

# Load user-specific metadata
def load_user_metadata(user_id):
    """Load metadata for a specific user"""
    _, _, metadata_file = get_user_paths(user_id)
    if os.path.exists(metadata_file):
        try:
            with open(metadata_file, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

# Save user-specific metadata
def save_user_metadata(user_id, metadata):
    """Save metadata for a specific user"""
    _, _, metadata_file = get_user_paths(user_id)
    with open(metadata_file, 'w') as f:
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

# Cleanup old files for all users
def cleanup_old_files():
    """Remove old files and metadata for all users"""
    logger.info("Starting cleanup of old files")
    current_time = datetime.now()
    
    # Clean up user metadata files
    for metadata_file in os.listdir(METADATA_FOLDER):
        if metadata_file.endswith('.json'):
            user_id = metadata_file[:-5]  # Remove .json extension
            try:
                user_upload_folder, user_processed_folder, user_metadata_file = get_user_paths(user_id)
                
                # Load user metadata
                metadata = load_user_metadata(user_id)
                
                # Check each image in user's metadata
                files_to_remove = []
                for file_id, file_data in metadata.items():
                    upload_time = datetime.fromisoformat(file_data['upload_time'])
                    if (current_time - upload_time).total_seconds() > MAX_STORAGE_AGE:
                        files_to_remove.append(file_id)
                
                # Remove old files
                for file_id in files_to_remove:
                    try:
                        # Remove original file
                        original_path = os.path.join(user_upload_folder, f"{file_id}.jpg")
                        if os.path.exists(original_path):
                            os.remove(original_path)
                        
                        # Remove processed file
                        processed_path = os.path.join(user_processed_folder, f"{file_id}.png")
                        if os.path.exists(processed_path):
                            os.remove(processed_path)
                        
                        # Remove from metadata
                        del metadata[file_id]
                        
                        logger.info(f"Cleaned up old file: {file_id} for user {user_id}")
                    except Exception as e:
                        logger.error(f"Error cleaning up file {file_id}: {str(e)}")
                
                # Save updated metadata
                if files_to_remove:
                    save_user_metadata(user_id, metadata)
                    
            except Exception as e:
                logger.error(f"Error during cleanup for user {user_id}: {str(e)}")
    
    logger.info("Cleanup completed")

def schedule_cleanup():
    """Schedule periodic cleanup"""
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
        "allow_headers": ["Content-Type", "X-User-ID"]
    },
    r"/images": {
        "origins": [f"https://{domain}" for domain in ALLOWED_DOMAINS] + [f"http://{domain}" for domain in ALLOWED_DOMAINS],
        "methods": ["GET", "OPTIONS"],
        "allow_headers": ["Content-Type", "X-User-ID"]
    },
    r"/image/*": {
        "origins": [f"https://{domain}" for domain in ALLOWED_DOMAINS] + [f"http://{domain}" for domain in ALLOWED_DOMAINS],
        "methods": ["GET", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "X-User-ID"]
    },
    r"/upload": {
        "origins": [f"https://{domain}" for domain in ALLOWED_DOMAINS] + [f"http://{domain}" for domain in ALLOWED_DOMAINS],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "X-User-ID"]
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

# Keep track of processing status globally
is_processing = False
processing_lock = threading.Lock()

@lru_cache(maxsize=1)
def get_model():
    """Load and cache the background removal model"""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                logger.info("Loading background removal model...")
                _model = pipeline(
                    "image-segmentation",
                    model="briaai/RMBG-1.4",
                    trust_remote_code=True,
                    device=device
                )
                logger.info("Background removal model loaded successfully")
    return _model

# Optimized image resizing
def smart_resize(image, max_size=1024):
    """Resize image intelligently to optimize processing speed while maintaining quality"""
    width, height = image.size
    
    # If image is already small, don't resize
    if max(width, height) <= max_size:
        return image, image.size
    
    # Calculate new dimensions
    if width > height:
        new_width = max_size
        new_height = int(height * max_size / width)
    else:
        new_height = max_size
        new_width = int(width * max_size / height)
    
    # Resize using high-quality resampling
    resized = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    return resized, (width, height)

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

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'healthy',
        'gpu_available': torch.cuda.is_available(),
        'queue_size': 0,
        'currently_processing': is_processing
    })

@app.route('/upload', methods=['POST'])
@require_domain
@require_user_auth
def upload_image():
    """Upload and store image with metadata"""
    try:
        user_id = get_user_id()
        user_upload_folder, user_processed_folder, user_metadata_file = get_user_paths(user_id)
        
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
        original_path = os.path.join(user_upload_folder, f"{file_id}.jpg")
        
        # Save original image
        img.save(original_path, 'JPEG', quality=95)
        
        # Save metadata
        metadata = load_user_metadata(user_id)
        metadata[file_id] = {
            'id': file_id,
            'original_filename': file.filename,
            'title': title,
            'upload_time': datetime.now().isoformat(),
            'status': 'uploaded',
            'processed': False
        }
        save_user_metadata(user_id, metadata)
        
        logger.info(f"Uploaded image: {file_id} - {title} for user {user_id}")
        
        return {
            'id': file_id,
            'title': title,
            'status': 'uploaded',
            'processed': False,
            'upload_time': metadata[file_id]['upload_time']
        }, 201
        
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        return {'error': f'Upload failed: {str(e)}'}, 500

@app.route('/images', methods=['GET'])
@require_domain
@require_user_auth
def list_images():
    """List all images for the current user"""
    try:
        user_id = get_user_id()
        metadata = load_user_metadata(user_id)
        
        # Convert metadata to list format
        images = []
        for file_id, file_data in metadata.items():
            images.append({
                'id': file_id,
                'title': file_data['title'],
                'original_filename': file_data['original_filename'],
                'upload_time': file_data['upload_time'],
                'status': file_data['status'],
                'processed': file_data['processed']
            })
        
        # Sort by upload time (newest first)
        images.sort(key=lambda x: x['upload_time'], reverse=True)
        
        logger.info(f"Listed {len(images)} images for user {user_id}")
        return jsonify(images)
        
    except Exception as e:
        logger.error(f"Error listing images: {str(e)}")
        return {'error': f'Failed to list images: {str(e)}'}, 500

@app.route('/image/<file_id>', methods=['GET'])
@require_domain
@require_user_auth
def get_image_info(file_id):
    """Get information about a specific image"""
    try:
        user_id = get_user_id()
        metadata = load_user_metadata(user_id)
        
        if file_id not in metadata:
            return {'error': 'Image not found'}, 404
        
        file_data = metadata[file_id]
        return jsonify({
            'id': file_id,
            'title': file_data['title'],
            'original_filename': file_data['original_filename'],
            'upload_time': file_data['upload_time'],
            'status': file_data['status'],
            'processed': file_data['processed']
        })
        
    except Exception as e:
        logger.error(f"Error getting image info: {str(e)}")
        return {'error': f'Failed to get image info: {str(e)}'}, 500

@app.route('/image/<file_id>/title', methods=['PUT'])
@require_domain
@require_user_auth
def update_image_title(file_id):
    """Update the title of an image"""
    try:
        user_id = get_user_id()
        metadata = load_user_metadata(user_id)
        
        if file_id not in metadata:
            return {'error': 'Image not found'}, 404
        
        data = request.get_json()
        if not data or 'title' not in data:
            return {'error': 'Title is required'}, 400
        
        # Update title
        metadata[file_id]['title'] = data['title']
        save_user_metadata(user_id, metadata)
        
        logger.info(f"Updated title for image {file_id} to '{data['title']}' for user {user_id}")
        
        return jsonify({
            'id': file_id,
            'title': data['title'],
            'message': 'Title updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating image title: {str(e)}")
        return {'error': f'Failed to update title: {str(e)}'}, 500

@app.route('/image/<file_id>', methods=['DELETE'])
@require_domain
@require_user_auth
def delete_image(file_id):
    """Delete an image and its processed version"""
    try:
        user_id = get_user_id()
        user_upload_folder, user_processed_folder, user_metadata_file = get_user_paths(user_id)
        metadata = load_user_metadata(user_id)
        
        if file_id not in metadata:
            return {'error': 'Image not found'}, 404
        
        # Remove files
        original_path = os.path.join(user_upload_folder, f"{file_id}.jpg")
        processed_path = os.path.join(user_processed_folder, f"{file_id}.png")
        
        if os.path.exists(original_path):
            os.remove(original_path)
            logger.info(f"Removed original file: {original_path}")
        
        if os.path.exists(processed_path):
            os.remove(processed_path)
            logger.info(f"Removed processed file: {processed_path}")
        
        # Remove from metadata
        del metadata[file_id]
        save_user_metadata(user_id, metadata)
        
        logger.info(f"Deleted image {file_id} for user {user_id}")
        
        return jsonify({
            'id': file_id,
            'message': 'Image deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Error deleting image: {str(e)}")
        return {'error': f'Failed to delete image: {str(e)}'}, 500

@app.route('/image/<file_id>/original', methods=['GET'])
@require_domain
@require_user_auth
def get_original_image(file_id):
    """Get the original uploaded image"""
    try:
        user_id = get_user_id()
        user_upload_folder, user_processed_folder, user_metadata_file = get_user_paths(user_id)
        metadata = load_user_metadata(user_id)
        
        if file_id not in metadata:
            return {'error': 'Image not found'}, 404
        
        original_path = os.path.join(user_upload_folder, f"{file_id}.jpg")
        
        if not os.path.exists(original_path):
            return {'error': 'Original image not found'}, 404
        
        return send_file(original_path, mimetype='image/jpeg')
        
    except Exception as e:
        logger.error(f"Error getting original image: {str(e)}")
        return {'error': f'Failed to get original image: {str(e)}'}, 500

@app.route('/image/<file_id>/processed', methods=['GET'])
@require_domain
@require_user_auth
def get_processed_image(file_id):
    """Get the processed image with background removed"""
    try:
        user_id = get_user_id()
        user_upload_folder, user_processed_folder, user_metadata_file = get_user_paths(user_id)
        metadata = load_user_metadata(user_id)
        
        if file_id not in metadata:
            return {'error': 'Image not found'}, 404
        
        processed_path = os.path.join(user_processed_folder, f"{file_id}.png")
        
        if not os.path.exists(processed_path):
            return {'error': 'Processed image not found'}, 404
        
        return send_file(processed_path, mimetype='image/png')
        
    except Exception as e:
        logger.error(f"Error getting processed image: {str(e)}")
        return {'error': f'Failed to get processed image: {str(e)}'}, 500

@app.route('/remove-background', methods=['POST'])
@require_domain
@require_user_auth
def remove_background():
    global is_processing
    
    try:
        user_id = get_user_id()
        user_upload_folder, user_processed_folder, user_metadata_file = get_user_paths(user_id)
        
        # Get file ID from request
        data = request.get_json()
        if not data or 'file_id' not in data:
            return {'error': 'File ID is required'}, 400
        
        file_id = data['file_id']
        
        # Check if image exists
        metadata = load_user_metadata(user_id)
        if file_id not in metadata:
            return {'error': 'Image not found'}, 404
        
        file_data = metadata[file_id]
        original_path = os.path.join(user_upload_folder, f"{file_id}.jpg")
        
        if not os.path.exists(original_path):
            return {'error': 'Original image not found'}, 404
        
        # Process image
        with processing_lock:
            is_processing = True
            
            # Update status to processing
            metadata[file_id]['status'] = 'processing'
            save_user_metadata(user_id, metadata)
            
            try:
                # Load and process image
                with open(original_path, 'rb') as f:
                    # Create a file-like object for processing
                    class FileWrapper:
                        def __init__(self, file_path):
                            self.filename = os.path.basename(file_path)
                            self.stream = open(file_path, 'rb')
                    
                    file_wrapper = FileWrapper(original_path)
                    result_io = process_image_safe(file_wrapper)
                    file_wrapper.stream.close()
                
                # Save processed image
                processed_path = os.path.join(user_processed_folder, f"{file_id}.png")
                with open(processed_path, 'wb') as f:
                    f.write(result_io.getvalue())
                
                # Update metadata
                metadata[file_id]['status'] = 'completed'
                metadata[file_id]['processed'] = True
                save_user_metadata(user_id, metadata)
                
                logger.info(f"Background removed for image {file_id} for user {user_id}")
                
                return {
                    'id': file_id,
                    'status': 'completed',
                    'processed': True,
                    'message': 'Background removed successfully'
                }
                
            except Exception as e:
                # Update status to error
                metadata[file_id]['status'] = 'error'
                save_user_metadata(user_id, metadata)
                logger.error(f"Error processing image {file_id}: {str(e)}")
                raise
            
            finally:
                is_processing = False
        
    except Exception as e:
        logger.error(f"Error removing background: {str(e)}")
        return {'error': f'Background removal failed: {str(e)}'}, 500

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)
