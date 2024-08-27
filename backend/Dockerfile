FROM --platform=linux/amd64 python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY dynamic_conf.toml /etc/traefik/dynamic_conf/dynamic_conf.toml
COPY traefik.yaml /etc/traefik/traefik.yaml
EXPOSE 5000
CMD ["python", "app.py"]