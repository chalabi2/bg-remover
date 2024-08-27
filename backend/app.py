from flask import Flask, request, send_file
from flask_cors import CORS
from PIL import Image
import io
import torch
from transformers import pipeline
import logging
from functools import lru_cache
import math

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

if __name__ == '__main__':
    import os
    if os.environ.get('FLASK_ENV') == 'production':
        # Production
       app.run(host='0.0.0.0', debug=True, port=5000)
    else:
        # Development
        app.run(host='0.0.0.0', debug=True, port=5000)