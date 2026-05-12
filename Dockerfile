FROM python:3.13-slim

# Install system dependencies for weasyprint and MySQL
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    libmariadb-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend
COPY backend/ .

# Expose the port Railway expects
EXPOSE 8080

# Run the application
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8080"]
