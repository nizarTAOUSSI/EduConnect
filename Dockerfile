FROM ubuntu:22.04

# Set non-interactive mode
ENV DEBIAN_FRONTEND=noninteractive

# Update and install basic packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    libmariadb-dev \
    pkg-config \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/ .

# Expose port
EXPOSE 8080

# Run the app
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8080"]
