#!/bin/bash

# Production startup script for Background Remover API

# Activate virtual environment
source venv/bin/activate

# Set production environment variables
export FLASK_ENV=production
export PORT=5000
export HOST=0.0.0.0

# Start Gunicorn with production configuration
echo "Starting Background Remover API in production mode..."
echo "GPU Available: $(python -c 'import torch; print(torch.cuda.is_available())')"
echo "Server will be available at: http://0.0.0.0:5000"

gunicorn -c gunicorn.conf.py app:app 