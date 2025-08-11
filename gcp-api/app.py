"""
Flask application for GCP Cloud Run deployment.
Wraps the checker modules.
"""

import os
import json
import base64
import re
import cv2
import numpy as np
import logging
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS

from compliance_checker import ComplianceChecker
from lib.quick_checker import QuickChecker
from lib.config import Config
from lib.order_storage import OrderStorage

# --- Global Initialization ---
# Initialize services. Both are lightweight at startup.
# The heavy ML model is lazy-loaded by the ComplianceChecker.
logging.basicConfig(level=logging.INFO)

try:
    logging.info("Initializing lightweight QuickChecker service...")
    quick_checker = QuickChecker()
    logging.info("QuickChecker service initialized.")
except Exception as e:
    logging.critical(f"FATAL: Could not initialize QuickChecker: {e}", exc_info=True)
    quick_checker = None

try:
    logging.info("Initializing ComplianceChecker orchestrator...")
    compliance_checker = ComplianceChecker(model_name=Config.RECOMMENDED_MODEL_NAME)
    logging.info("ComplianceChecker orchestrator initialized.")
except Exception as e:
    logging.critical(f"FATAL: Could not initialize ComplianceChecker: {e}", exc_info=True)
    compliance_checker = None
# --- End Global Initialization ---

app = Flask(__name__)
# Limit request size to ~10MB
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024

# Configure CORS for Vercel frontend
allowed_origins = [
    "https://passport-validator.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
]
# Allow env override (comma-separated list)
extra_origins = os.environ.get('CORS_ORIGINS')
if extra_origins:
    allowed_origins.extend([o.strip() for o in extra_origins.split(',') if o.strip()])
# Enable wildcard subdomains for Vercel via regex (anchor for safety)
CORS(app, origins=allowed_origins + [r"^https://.*\.vercel\.app$"])

@app.before_request
def check_services_initialized():
    """Checks if the essential global services were initialized."""
    if quick_checker is None or compliance_checker is None:
        # Check the specific endpoint to allow health checks to pass
        # if only one of the two services failed.
        if request.endpoint == 'quick_check' and quick_checker is None:
            return jsonify({"error": "QuickCheck service is unavailable.", "message": "QuickCheck service is unavailable."}), 503
        if request.endpoint == 'validate_photo' and compliance_checker is None:
             return jsonify({"error": "Validation service is unavailable.", "message": "Validation service is unavailable."}), 503

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for GCP Cloud Run.
    Reports on the status of all initialized services.
    """
    quick_checker_healthy = quick_checker is not None
    compliance_checker_healthy = compliance_checker is not None
    is_fully_healthy = quick_checker_healthy and compliance_checker_healthy
    
    status_code = 200 if is_fully_healthy else 503

    return jsonify({
        "status": "healthy" if is_fully_healthy else "unhealthy",
        "service": "baby-picture-validator-api",
        "version": "1.2.0", # Version bumped to reflect architecture change
        "services": {
            "quick_checker": "ok" if quick_checker_healthy else "failed",
            "compliance_checker": "ok" if compliance_checker_healthy else "failed"
        },
        "heavy_model_lazy_loaded": compliance_checker._full_analyzer is not None if compliance_checker_healthy else False
    }), status_code

@app.route('/api/quick_check', methods=['POST'])
def quick_check():
    """Fast face detection endpoint using the lightweight QuickChecker service."""
    try:
        body = request.get_json()
        if not body or 'image' not in body:
            return jsonify({"error": "Missing 'image' field in request body", "message": "Missing 'image' field in request body"}), 400
        
        try:
            image_data = base64.b64decode(body['image'])
        except Exception as e:
            return jsonify({"error": f"Invalid base64 image data: {str(e)}", "message": f"Invalid base64 image data: {str(e)}"}), 400
        nparr = np.frombuffer(image_data, np.uint8)
        image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image_bgr is None:
            return jsonify({"error": "Could not decode image data", "message": "Could not decode image data"}), 400
        
        # Use the dedicated quick_checker service
        face_count = quick_checker.count_faces(image_bgr)
        
        if face_count == 0:
            message = "No face detected in the image."
            success = False
        elif face_count == 1:
            message = "A single face was detected."
            success = True
        else:
            message = f"Multiple faces ({face_count}) were detected."
            success = False
        
        return jsonify({
            "success": success,
            "face_count": face_count,
            "message": message
        }), 200
        
    except Exception as e:
        logging.error(f"Error in /api/quick_check: {e}", exc_info=True)
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}", "message": f"Internal server error: {str(e)}"}), 500

@app.route('/api/validate_photo', methods=['POST'])
def validate_photo():
    """
    Full ICAO compliance validation.
    This will trigger the lazy-loading of the heavyweight model on the first call.
    """
    try:
        body = request.get_json()
        if not body or 'image' not in body:
            return jsonify({"error": "Missing 'image' field in request body", "message": "Missing 'image' field in request body"}), 400
        
        try:
            image_data = base64.b64decode(body['image'])
        except Exception as e:
            return jsonify({"error": f"Invalid base64 image data: {str(e)}", "message": f"Invalid base64 image data: {str(e)}"}), 400
        nparr = np.frombuffer(image_data, np.uint8)
        original_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if original_bgr is None:
            return jsonify({"error": "Could not decode image data", "message": "Could not decode image data"}), 400
        
        # Use the globally loaded checker instance. This call will now handle
        # the lazy-loading of the full analyzer if it hasn't happened yet.
        result, processed_bgr = compliance_checker.check_image_array(original_bgr)
        
        # Handle storage if validation was successful
        if result.get("success", False):
            order_id = str(uuid.uuid4())
            try:
                storage_info = OrderStorage.store_validated_order(
                    order_id, original_bgr, processed_bgr
                )
                result.update(storage_info)
            except Exception as e:
                return jsonify({"success": False, "error": "Failed to store images", "message": "Failed to store images"}), 500 
        
        return jsonify(result), 200
        
    except Exception as e:
        logging.error(f"Error in /api/validate_photo: {e}", exc_info=True)
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}", "message": f"Internal server error: {str(e)}"}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found", "message": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    logging.error(f"Caught unhandled exception: {error}", exc_info=True)
    return jsonify({"error": "An unexpected internal server error occurred", "message": "An unexpected internal server error occurred"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    # No special logic needed here anymore, global init is sufficient and fast.
    app.run(host='0.0.0.0', port=port, debug=False) 