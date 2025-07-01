# Gunicorn configuration for production deployment
import multiprocessing
import os

# Server socket
bind = "0.0.0.0:5000"
backlog = 2048

# Worker processes
workers = 1  # Use 1 worker for GPU workloads to avoid memory conflicts
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
preload_app = True

# Timeout settings
timeout = 120  # Increased timeout for image processing
keepalive = 2
graceful_timeout = 30

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "bg-remover-api"

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Environment variables
raw_env = [
    "FLASK_ENV=production",
]

# SSL (uncomment if using HTTPS)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile" 