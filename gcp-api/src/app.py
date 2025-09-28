"""
Flask application for GCP Cloud Run deployment.
Wraps the checker modules.
"""

import os
import logging
from flask import Flask, request, jsonify

from compliance_checker import ComplianceChecker
from lib.print_processor import PrintProcessor
from lib.quick_checker import QuickChecker
from lib.app_config import config
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
    compliance_checker = ComplianceChecker(model_name=config.icao.recommended_model_name)
    logging.info("ComplianceChecker orchestrator initialized.")
except Exception as e:
    logging.critical(f"FATAL: Could not initialize ComplianceChecker: {e}", exc_info=True)
    compliance_checker = None

try:
    logging.info("Initializing PrintProcessor...")
    print_processor = PrintProcessor()
    logging.info("PrintProcessor initialized.")
except Exception as e:
    logging.critical(f"FATAL: Could not initialize PrintProcessor: {e}", exc_info=True)
    print_processor = None
# --- End Global Initialization ---

app = Flask(__name__)

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

@app.route('/quick-check', methods=['GET'])
def quick_check():
    """Fast face detection endpoint using the lightweight QuickChecker service."""
    try:
        order_id = request.args.get('orderId')
        # Download image from GCP storage URL
        image_bgr = OrderStorage.get_order_image_original(order_id)
        
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

@app.route('/validate-photo', methods=['GET'])
def validate_photo():
    """
    Full ICAO compliance validation.
    This will trigger the lazy-loading of the heavyweight model on the first call.
    """
    try:
        # Get the UUID from the URL
        order_id = request.args.get('orderId')
        
        # Download image from GCP storage URL
        original_bgr = OrderStorage.get_order_image_original(order_id)
        # Use the globally loaded checker instance. This call will now handle
        # the lazy-loading of the full analyzer if it hasn't happened yet.
        result, validated_bgr = compliance_checker.check_image_array(original_bgr)
        
        # Handle storage if validation was successful
        if result.get("success", False):
            try:
                print_canvas, _ = print_processor.create_print_layout(validated_bgr)
                storage_info = OrderStorage.store_validated_order(
                    order_id, print_canvas
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
    # No special logic needed here anymore, global init is sufficient and fast.
    app.run(host='0.0.0.0', port=server_config.port, debug=False) 