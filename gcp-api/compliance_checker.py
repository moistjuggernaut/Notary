"""
Main compliance checker orchestrator.
Coordinates the complete photo validation workflow.
"""
import logging
import base64
import cv2
from threading import Lock

from .lib.config import Config
from .lib.image_preprocessor import ImagePreprocessor
from .lib.photo_validator import PhotoValidator
# FaceAnalyzer is imported dynamically for lazy loading

log = logging.getLogger(__name__)

class ComplianceChecker:
    """
    Orchestrates the full photo validation process by lazy-loading
    a heavyweight analyzer.
    """
    _full_analyzer = None
    _full_analyzer_lock = Lock()
    
    def __init__(self, model_name=Config.RECOMMENDED_MODEL_NAME, providers=None):
        """
        Initializes the ComplianceChecker orchestrator.
        The heavyweight FaceAnalyzer is NOT loaded on initialization.
        """
        log.info("Initializing ComplianceChecker orchestrator...")
        self._model_name = model_name
        self._providers = providers
        self.preprocessor = None
        self.validator = PhotoValidator()
        self.config = Config()
        log.info("ComplianceChecker orchestrator initialized.")

    def _get_full_analyzer(self):
        """
        Lazy-loads the heavyweight FaceAnalyzer on first use.
        This method is thread-safe.
        """
        if self._full_analyzer is None:
            with self._full_analyzer_lock:
                if self._full_analyzer is None:
                    log.info("First use: lazy-loading heavyweight FaceAnalyzer...")
                    from .lib.face_analyzer import FaceAnalyzer
                    self._full_analyzer = FaceAnalyzer(
                        model_name=self._model_name,
                        providers=self._providers
                    )
                    self.preprocessor = ImagePreprocessor(self._full_analyzer)
                    log.info("Heavyweight FaceAnalyzer loaded and ready.")
        return self._full_analyzer

    def _get_final_recommendation(self, validation_results_log):
        """Determines the final recommendation based on all validation checks."""
        fails = sum(1 for status, _, _ in validation_results_log if status == "FAIL")
        warnings = sum(1 for status, _, _ in validation_results_log if status == "WARNING")
        
        if fails > 0:
            return f"REJECTED: {fails} critical issue(s) found."
        if warnings > 0:
            return f"NEEDS REVIEW: {warnings} warning(s) found."
        return "LOOKS PROMISING: All primary checks passed."

    def check_image_array(self, image_bgr):
        """
        Runs the full, heavyweight compliance check on an image array.
        This will trigger the lazy-loading of the InsightFace model on first run.
        """
        all_logs = {"preprocessing": [], "validation": []}
        
        if image_bgr is None:
            return {"success": False, "recommendation": "REJECTED: Invalid image data"}

        try:
            # Step 1: Get the heavyweight analyzer (lazy-loads on first call)
            full_analyzer = self._get_full_analyzer()
            
            # Step 2: Perform high-accuracy face analysis
            log.info("Performing full analysis with InsightFace model...")
            faces = full_analyzer.analyze_image(image_bgr)
            
            if not faces:
                all_logs["preprocessing"].append(("FAIL", "Full Analysis", "No face detected by the analysis model."))
                return {"success": False, "recommendation": "REJECTED: No face detected", "logs": all_logs}
            
            if len(faces) > 1:
                all_logs["preprocessing"].append(("FAIL", "Full Analysis", f"Multiple faces ({len(faces)}) detected."))
                return {"success": False, "recommendation": "REJECTED: Multiple faces detected", "logs": all_logs}
                
            all_logs["preprocessing"].append(("PASS", "Full Analysis", "Single face detected."))
            
            # Step 3: Preprocessing
            processed_bgr, face_data, preprocess_logs, success = self.preprocessor.process_image(image_bgr, faces)
            all_logs["preprocessing"].extend(preprocess_logs)
            
            if not success or processed_bgr is None:
                return {"success": False, "recommendation": "REJECTED: Preprocessing failed", "logs": all_logs}

            # Step 4: Validation
            validation_results = self.validator.validate_photo(processed_bgr, face_data)
            all_logs["validation"].extend(validation_results)
            recommendation = self._get_final_recommendation(validation_results)
        
            # Step 5: Prepare and return final result
            result = {
                "success": "REJECTED" not in recommendation,
                "recommendation": recommendation,
                "logs": all_logs
            }
        
            if result["success"]:
                _, buffer = cv2.imencode('.jpg', processed_bgr)
                processed_base64 = base64.b64encode(buffer).decode('utf-8')
                result["processed_image"] = processed_base64
        
            return result

        except Exception as e:
            log.critical(f"A critical error occurred during full validation: {e}", exc_info=True)
            return {"success": False, "error": f"Internal server error: {e}", "recommendation": "REJECTED: System error"}


def handler(request, response):
    """
    Vercel serverless function to validate passport photos.
    
    Expected request body:
    {
        "image": "base64_string",
        "filename": "optional"
    }
    
    Returns:
    {
        "success": bool,
        "recommendation": str,
        "logs": {...},
        "processed_image": "base64" (if successful),
        "error": str (if error)
    }
    """
    
    # Handle CORS for frontend requests
    response.headers.update({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    })
    
    if request.method == 'OPTIONS':
        return response
    
    if request.method != 'POST':
        response.status_code = 405
        return json.dumps({"error": "Method not allowed"})
    
    try:
        # Parse request body
        body = request.get_json()
        if not body or 'image' not in body:
            response.status_code = 400
            return json.dumps({"error": "Missing 'image' field in request body"})
        
        # Decode base64 image
        try:
            image_data = base64.b64decode(body['image'])
        except Exception as e:
            response.status_code = 400
            return json.dumps({"error": f"Invalid base64 image data: {str(e)}"})
        
        # Convert to OpenCV format
        nparr = np.frombuffer(image_data, np.uint8)
        original_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if original_bgr is None:
            response.status_code = 400
            return json.dumps({"error": "Could not decode image data"})
        
        # Run validation using the orchestrator
        checker = ComplianceChecker(model_name=Config.RECOMMENDED_MODEL_NAME)
        result = checker.check_image_array(original_bgr)
        
        response.status_code = 200
        return json.dumps(result)
        
    except Exception as e:
        response.status_code = 500
        return json.dumps({"error": f"Internal server error: {str(e)}"})


# CLI usage
if __name__ == "__main__":
    input_image_path = "./images/valid1.jpg"  # <--- CHANGE THIS
    output_image_path = "processed_baby_photo.jpg"  # Set to None to disable saving

    try:
        if not os.path.exists(input_image_path):
            print(f"Warning: Test image '{input_image_path}' not found. Creating a dummy image.")
            dummy_h, dummy_w = int(Config.FINAL_OUTPUT_HEIGHT_PX * 1.5), int(Config.FINAL_OUTPUT_WIDTH_PX * 1.5)
            dummy_img = np.full((dummy_h, dummy_w, 3), (225, 225, 225), dtype=np.uint8)
            # Simplified dummy face
            fh, fw = int(dummy_h * 0.6), int(dummy_w * 0.6)
            fy, fx = (dummy_h - fh) // 2, (dummy_w - fw) // 2
            cv2.rectangle(dummy_img, (fx, fy), (fx + fw, fy + fh), (180, 190, 200), -1)
            cv2.circle(dummy_img, (fx + fw // 3, fy + fh // 3), 10, (50, 50, 50), -1)  # "eye"
            cv2.circle(dummy_img, (fx + 2*fw // 3, fy + fh // 3), 10, (50, 50, 50), -1)  # "eye"
            cv2.imwrite("dummy_baby_photo_for_check.jpg", dummy_img)
            input_image_path = "dummy_baby_photo_for_check.jpg"
            
        checker = ComplianceChecker(model_name=Config.RECOMMENDED_MODEL_NAME)
        result = checker.check_image_array(input_image_path)

        if input_image_path == "dummy_baby_photo_for_check.jpg":
            os.remove(input_image_path)

    except Exception as e:
        print(f"A critical error occurred: {e}")
        import traceback
        traceback.print_exc() 