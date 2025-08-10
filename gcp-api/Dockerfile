# Use Python 3.12 slim image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080
ENV PYTHONPATH=/app
# Tell insightface to not check for the latest version
ENV INSIGHTFACE_ROUTING_SILENT=1

# Create and set the working directory
WORKDIR /app

# Install system dependencies
# wget and unzip are for manually downloading and extracting the model.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    wget \
    unzip \
    libgomp1 \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install dependencies first to leverage caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Manually Cache ML Model by Copying ---
# Copy the pre-downloaded model from the build context. This is more robust
# than downloading it during the build.
COPY models/buffalo_l.zip /tmp/buffalo_l.zip
RUN mkdir -p /root/.insightface/models/buffalo_l && \
    unzip -j /tmp/buffalo_l.zip -d /root/.insightface/models/buffalo_l && \
    rm /tmp/buffalo_l.zip

# Copy the rest of the application code
COPY . .

# Run the application with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--timeout", "120", "--max-requests", "1000", "app:app"] 