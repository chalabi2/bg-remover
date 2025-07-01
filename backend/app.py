from flask import Flask, request, send_file, abort
from flask_cors import CORS
from PIL import Image
import io
import torch
from transformers import pipeline
import logging
from functools import lru_cache, wraps
import math
<<<<<<< Updated upstream
import sys
import os
from concurrent.futures import ThreadPoolExecutor
import zipfile

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["https://rmbg.jchalabi.xyz", "https://api.jchalabi.xyz"]}})
=======
import os

app = Flask(__name__)
>>>>>>> Stashed changes

# Domain-based access control
ALLOWED_DOMAINS = ["rmbg.jchalabi.xyz", "asus-3.duckdns.org"]

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
            abort(403, description=f"Access denied. Only requests from {', '.join(ALLOWED_DOMAINS)} are allowed.")
    
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

if torch.cuda.is_available():
    device = torch.device("cuda")
    logger.info(f"CUDA is available. Using GPU: {torch.cuda.get_device_name(0)}")
    logger.info(f"CUDA version: {torch.version.cuda}")
    logger.info(f"PyTorch CUDA version: {torch.version.cuda}")
    logger.info(f"Number of GPUs: {torch.cuda.device_count()}")
else:
    device = torch.device("cpu")
    logger.info("CUDA is not available. Using CPU.")

# Determine the number of workers based on available CPU cores
num_workers = os.cpu_count() or 1
logger.info(f"Number of workers: {num_workers}")
@lru_cache(maxsize=1)
def get_model():
    model = pipeline("image-segmentation", 
                     model="briaai/RMBG-1.4", 
                     trust_remote_code=True, 
                     device=device,
                     torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32)
    logger.info(f"Model loaded on device: {model.device}")
    return model

pipe = get_model()

# Create a thread pool for parallel processing
executor = ThreadPoolExecutor(max_workers=num_workers)

def smart_resize(img, max_size=1920, max_area=2073600):  # 1920x1080 = 2,073,600 pixels
    width, height = img.size
    aspect_ratio = width / height
    if width * height <= max_area and max(width, height) <= max_size:
        return img  
    if aspect_ratio > 1:  # Landscape
        new_width = min(max_size, int(math.sqrt(max_area * aspect_ratio)))
        new_height = int(new_width / aspect_ratio)
    else:  # Portrait or square
        new_height = min(max_size, int(math.sqrt(max_area / aspect_ratio)))
        new_width = int(new_height * aspect_ratio)
    return img.resize((new_width, new_height), Image.LANCZOS)

<<<<<<< Updated upstream
@app.before_request
def log_request_info():
    app.logger.info('Headers: %s', request.headers)
    app.logger.info('Body: %s', request.get_data())

@app.route('/', methods=['GET'])
def health_check():
    return 'OK', 200
    
@app.route('/', methods=['POST'])
=======
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for production monitoring - accessible from anywhere"""
    return {'status': 'healthy', 'gpu_available': torch.cuda.is_available()}, 200

@app.route('/remove-background', methods=['POST'])
@require_domain
>>>>>>> Stashed changes
def remove_background():
    try:
        if 'image' not in request.files:
            return {'error': 'No image file provided'}, 400
        
<<<<<<< Updated upstream
        files = request.files.getlist('image')
=======
        file = request.files['image']
        if file.filename == '':
            return {'error': 'No file selected'}, 400
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
        if not file.filename.lower().endswith(tuple('.' + ext for ext in allowed_extensions)):
            return {'error': 'Invalid file type. Please upload an image.'}, 400
        
        img = Image.open(file.stream).convert("RGB")
        img = smart_resize(img)
>>>>>>> Stashed changes
        
        def process_image(file):
            img = Image.open(file.stream).convert("RGB")
            img = smart_resize(img)
            result = pipe(img)
            img_io = io.BytesIO()
            result.save(img_io, 'PNG', optimize=True, quality=95)
            img_io.seek(0)
            return img_io
        
        # Process images in parallel
        results = list(executor.map(process_image, files))
        
        if len(results) == 1:
            return send_file(results[0], mimetype='image/png')
        else:
            # If multiple images, zip them
            zip_io = io.BytesIO()
            with zipfile.ZipFile(zip_io, 'w') as zip_file:
                for i, result in enumerate(results):
                    zip_file.writestr(f'image_{i}.png', result.getvalue())
            zip_io.seek(0)
            return send_file(zip_io, mimetype='application/zip', as_attachment=True, download_name='processed_images.zip')
    
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
<<<<<<< Updated upstream
        return 'Error processing image', 500
    
app.debug = False

def run_dev_server():
    app.run(host='0.0.0.0', debug=True, port=5000)

def run_gunicorn_server(workers=4):
    import gunicorn.app.base

    class StandaloneApplication(gunicorn.app.base.BaseApplication):
        def __init__(self, app, options=None):
            self.options = options or {}
            self.application = app
            super().__init__()

        def load_config(self):
            for key, value in self.options.items():
                if key in self.cfg.settings and value is not None:
                    self.cfg.set(key.lower(), value)

        def load(self):
            return self.application

    options = {
        'bind': '0.0.0.0:5000',
        'workers': workers,
        'worker_class': 'gevent'
    }
    StandaloneApplication(app, options).run()

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Run the Flask app')
    parser.add_argument('--mode', choices=['dev', 'local', 'production'], default='dev',
                        help='Run mode: dev (default), local (Gunicorn), or production')
    args = parser.parse_args()

    if sys.platform.startswith('win'):
        # On Windows, always use the development server
        logger.info("Running on Windows. Using development server.")
        run_dev_server()
    else:
        if args.mode == 'dev':
            run_dev_server()
        elif args.mode in ['local', 'production']:
            workers = 4 if args.mode == 'local' else os.cpu_count() * 2 + 1
            run_gunicorn_server(workers)
=======
        return {'error': 'Error processing image'}, 500

if __name__ == '__main__':
    # Development mode
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    
    app.run(debug=debug_mode, host=host, port=port)
>>>>>>> Stashed changes
