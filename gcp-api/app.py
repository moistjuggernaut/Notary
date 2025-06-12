"""
Flask application for GCP Cloud Run deployment.
Wraps the existing compliance_checker and quick_check modules.
"""

import os
import json
import base64
import cv2
import numpy as np
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import our existing API modules using clean, absolute paths
# This works because of the `ENV PYTHONPATH /app` in the Dockerfile.
from compliance_checker import ComplianceChecker
from lib.face_analyzer import FaceAnalyzer

# --- Global Initialization ---
# This is the most important optimization. We load the models once when the
# application container starts, not on every request.
# This single `compliance_checker` instance will be reused across all requests.
logging.basicConfig(level=logging.INFO)

compliance_checker = None
try:
    logging.info("Global scope: Initializing ComplianceChecker and loading ML models...")
    compliance_checker = ComplianceChecker(model_name='buffalo_l')
    logging.info("Global scope: ML models loaded successfully.")
except Exception as e:
    # If model loading fails, the container will likely fail to start,
    # which is the desired behavior. We log this critical error.
    logging.critical(f"FATAL: Could not initialize ComplianceChecker on startup: {e}", exc_info=True)
# --- End Global Initialization ---

app = Flask(__name__)

# Configure CORS for Vercel frontend
CORS(app, origins=[
    "https://*.vercel.app",
    "http://localhost:3000",  # Local development
    os.environ.get('CORS_ORIGINS', '*')
])

@app.before_request
def check_model_loaded():
    """
    A request hook that runs before every request.
    It checks if the global model failed to load and returns an error.
    This prevents the app from trying to handle requests in a broken state.
    """
    if compliance_checker is None and request.endpoint not in ('health_check', 'static'):
        # Return a "Service Unavailable" status code
        return jsonify({"error": "ML model not loaded, the service is unavailable."}), 503

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for GCP Cloud Run.
    Reports as unhealthy if the main checker failed to initialize.
    """
    is_healthy = compliance_checker is not None
    status_code = 200 if is_healthy else 503
    return jsonify({
        "status": "healthy" if is_healthy else "unhealthy",
        "service": "baby-picture-validator-api",
        "version": "1.0.0",
        "model_loaded": is_healthy
    }), status_code

@app.route('/api/quick_check', methods=['POST', 'OPTIONS'])
def quick_check():
    """Fast face detection endpoint using the globally loaded model."""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        body = request.get_json()
        if not body or 'image' not in body:
            return jsonify({"error": "Missing 'image' field in request body"}), 400
        
        image_data = base64.b64decode(body['image'])
        nparr = np.frombuffer(image_data, np.uint8)
        original_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if original_bgr is None:
            return jsonify({"error": "Could not decode image data"}), 400
        
        # Use the globally loaded analyzer via the compliance_checker instance
        faces = compliance_checker.face_analyzer.quick_check(original_bgr)
        
        face_count = len(faces) if faces else 0
        face_detected = face_count > 0
        
        if face_count == 0: message = "No face detected"
        elif face_count == 1: message = "Single face detected"
        else: message = f"Multiple faces detected ({face_count})"
        
        return jsonify({
            "success": True,
            "face_detected": face_detected,
            "face_count": face_count,
            "message": message
        }), 200
        
    except Exception as e:
        logging.error(f"Error in /api/quick_check: {e}", exc_info=True)
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500

@app.route('/api/validate_photo', methods=['POST', 'OPTIONS'])
def validate_photo():
    """Full ICAO compliance validation using the globally loaded model."""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        body = request.get_json()
        if not body or 'image' not in body:
            return jsonify({"error": "Missing 'image' field in request body"}), 400
        
        image_data = base64.b64decode(body['image'])
        nparr = np.frombuffer(image_data, np.uint8)
        original_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if original_bgr is None:
            return jsonify({"error": "Could not decode image data"}), 400
        
        # Use the globally loaded checker instance
        result = compliance_checker.check_image_array(original_bgr)
        
        return jsonify(result), 200
        
    except Exception as e:
        logging.error(f"Error in /api/validate_photo: {e}", exc_info=True)
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    logging.error(f"Caught unhandled exception: {error}", exc_info=True)
    return jsonify({"error": "An unexpected internal server error occurred"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False) 