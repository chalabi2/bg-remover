from flask import Flask, request, send_file
from flask_cors import CORS
from PIL import Image
import io
import torch
from transformers import pipeline
import logging
from functools import lru_cache
import math
import sys
import os


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["https://rmbg.jchalabi.xyz", "https://api.jchalabi.xyz"]}})

logging.basicConfig(level=logging.INFO)
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

@lru_cache(maxsize=1)
def get_model():
    model = pipeline("image-segmentation", model="briaai/RMBG-1.4", trust_remote_code=True, device=device)
    logger.info(f"Model loaded on device: {model.device}")
    return model

pipe = get_model()

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

@app.before_request
def log_request_info():
    app.logger.info('Headers: %s', request.headers)
    app.logger.info('Body: %s', request.get_data())

@app.route('/', methods=['GET'])
def health_check():
    return 'OK', 200
    
@app.route('/', methods=['POST'])
def remove_background():
    try:
        if 'image' not in request.files:
            return 'No image file', 400
        
        file = request.files['image']
        img = Image.open(file.stream).convert("RGB")
        img = smart_resize(img)
        
        # Process the image
        result = pipe(img)
        
        # Save the result
        img_io = io.BytesIO()
        result.save(img_io, 'PNG', optimize=True, quality=100)
        img_io.seek(0)
        
        return send_file(img_io, mimetype='image/png')
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
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