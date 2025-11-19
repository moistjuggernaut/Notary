"""
Flask application for GCP Cloud Run deployment.
Wraps the checker modules.
"""

import logging
from flask import Flask, request, jsonify

from compliance_checker import ComplianceChecker
from lib.print_processor import PrintProcessor
from lib.quick_checker import QuickChecker
from lib.app_config import config
from lib.order_storage import OrderStorage

# Initialize services
logging.basicConfig(level=logging.INFO)
quick_checker = None
compliance_checker = None
print_processor = None

try:
    quick_checker = QuickChecker()
    compliance_checker = ComplianceChecker()
    print_processor = PrintProcessor()
except Exception as e:
    logging.critical(f"FATAL: Initialization failed: {e}", exc_info=True)

app = Flask(__name__)

@app.before_request
def check_services():
    """Checks if services are initialized."""
    if quick_checker is None or compliance_checker is None or print_processor is None:
        return jsonify({"error": "Service unavailable"}), 503

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    healthy = quick_checker and compliance_checker
    return jsonify({
        "status": "healthy" if healthy else "unhealthy",
        "version": "1.3.0"
    }), 200 if healthy else 503

@app.route('/quick-check', methods=['GET'])
def quick_check():
    """Fast face detection endpoint."""
    try:
        order_id = request.args.get('orderId')
        image_bgr = OrderStorage.get_order_image_original(order_id)
        
        face_count = quick_checker.count_faces(image_bgr)
        
        if face_count == 1:
            return jsonify({"success": True, "face_count": 1, "message": "Face detected"}), 200
        
        return jsonify({
            "success": False, 
            "face_count": face_count, 
            "message": "No face" if face_count == 0 else f"Multiple faces ({face_count})"
        }), 422
        
    except Exception as e:
        logging.error(f"Quick check error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/validate-photo', methods=['GET'])
def validate_photo():
    """Full ICAO compliance validation."""
    try:
        order_id = request.args.get('orderId')
        original_bgr = OrderStorage.get_order_image_original(order_id)
        
        result, validated_bgr = compliance_checker.check_image_array(original_bgr)
        
        if result.get("success", False):
            try:
                print_canvas, _ = print_processor.create_print_layout(validated_bgr)
                OrderStorage.store_validated_order(order_id, print_canvas)
            except Exception as e:
                logging.error(f"Storage error: {e}")
                return jsonify({"success": False, "error": "Storage failed"}), 500 
        
        return jsonify(result), 200
        
    except Exception as e:
        logging.error(f"Validation error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    logging.error(f"Unhandled exception: {error}", exc_info=True)
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=config.server.port, debug=False)
