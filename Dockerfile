FROM python:3.11-slim

# Install system dependencies for weasyprint
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY backend/ .

# Expose port
EXPOSE 8080

# Command to run the application
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8080"]
