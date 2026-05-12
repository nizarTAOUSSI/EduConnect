FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Install system dependencies for MySQL and basic functionality
RUN apt-get update && apt-get install -y \
    gcc \
    pkg-config \
    libmariadb-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

# Expose port
EXPOSE 8080

# Run the app
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8080"]
