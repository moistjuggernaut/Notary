"""
Main compliance checker orchestrator and Vercel serverless handler.
Coordinates the complete photo validation workflow.
"""

import os
import json
import base64
import tempfile
import cv2
import numpy as np
from .config import Config
from .face_analyzer import FaceAnalyzer
from .image_preprocessor import ImagePreprocessor
from .photo_validator import PhotoValidator


class ComplianceChecker:
    """Orchestrates the photo checking process."""
    
    def __init__(self, model_name='buffalo_l', providers=None):
        """
        Initialize the ComplianceChecker with all required components.
        
        Args:
            model_name (str): InsightFace model name
            providers (list): ONNX providers for inference
        """
        self.face_analyzer = FaceAnalyzer(model_name, providers)
        self.preprocessor = ImagePreprocessor(self.face_analyzer)
        self.validator = PhotoValidator()
        self.config = Config()

    def _get_final_recommendation(self, validation_results_log):
        """
        Determine final recommendation based on validation results.
        
        Args:
            validation_results_log (list): List of validation result tuples
            
        Returns:
            str: Final recommendation message
        """
        fails = sum(1 for status, _, _ in validation_results_log if status == "FAIL")
        warnings = sum(1 for status, _, _ in validation_results_log if status == "WARNING")
        
        if fails > 0:
            return f"REJECTED: {fails} critical issue(s) found."
        if warnings > 0:
            return f"NEEDS REVIEW: {warnings} warning(s) found."
        return "LOOKS PROMISING: All primary checks passed."

    def _print_summary(self, image_path, all_logs, recommendation):
        """
        Print a detailed summary of the compliance check results.
        
        Args:
            image_path (str): Path to the input image
            all_logs (dict): Dictionary containing preprocessing and validation logs
            recommendation (str): Final recommendation
        """
        print(f"\n--- Compliance Check Summary for: {image_path} ---")
        print("\n** Preprocessing Log **")
        for status, step, message in all_logs.get("preprocessing", []):
            print(f"  [{status}] {step}: {message}")
        print("\n** Validation Log **")
        for status, check, msg in all_logs.get("validation", []):
            print(f"  [{status}] {check}: {msg}")
        print(f"\nOverall Recommendation: {recommendation}")
        print("\n" + "="*70)
        print("DISCLAIMER: This is a heuristic tool, not an official compliance checker.")
        print("Always refer to official guidelines. Cannot detect hands, toys, or hats.")
        print("="*70)

    def run_check(self, image_path, output_path=None):
        """
        Run complete compliance check on an image file.
        
        Args:
            image_path (str): Path to input image
            output_path (str, optional): Path to save processed image
            
        Returns:
            dict: Complete results including logs and recommendation
        """
        all_logs = {"preprocessing": [], "validation": []}
        
        original_bgr = cv2.imread(image_path)
        if original_bgr is None:
            all_logs["preprocessing"].append(("FAIL", "Image Load", f"Could not read: {image_path}"))
            recommendation = "REJECTED: Could not load image"
            self._print_summary(image_path, all_logs, recommendation)
            return {"success": False, "recommendation": recommendation, "logs": all_logs}

        # Step 1: Quick Check
        quick_check_faces = self.face_analyzer.quick_check(original_bgr)
        if not quick_check_faces:
            all_logs["preprocessing"].append(("FAIL", "Quick Check", "No face detected in initial quick check."))
            recommendation = "REJECTED: No face detected"
            self._print_summary(image_path, all_logs, recommendation)
            return {"success": False, "recommendation": recommendation, "logs": all_logs}
            
        if len(quick_check_faces) > 1:
            all_logs["preprocessing"].append(("FAIL", "Quick Check", "Multiple faces detected in initial quick check."))
            recommendation = "REJECTED: Multiple faces detected"
            self._print_summary(image_path, all_logs, recommendation)
            return {"success": False, "recommendation": recommendation, "logs": all_logs}
            
        all_logs["preprocessing"].append(("PASS", "Quick Check", "Single face detected."))

        # Step 2: Preprocessing
        processed_bgr, face_data, preprocess_logs, success = self.preprocessor.process_image(original_bgr)
        all_logs["preprocessing"].extend(preprocess_logs)

        if not success or processed_bgr is None:
            recommendation = "REJECTED: Preprocessing failed"
            self._print_summary(image_path, all_logs, recommendation)
            return {"success": False, "recommendation": recommendation, "logs": all_logs}

        # Step 3: Validation
        validation_results = self.validator.validate_photo(processed_bgr, face_data)
        all_logs["validation"].extend(validation_results)
        
        # Step 4: Final Recommendation
        recommendation = self._get_final_recommendation(validation_results)
        self._print_summary(image_path, all_logs, recommendation)

        # Step 5: Save processed image if requested
        result = {
            "success": "REJECTED" not in recommendation,
            "recommendation": recommendation,
            "logs": all_logs
        }
        
        if output_path and "REJECTED" not in recommendation:
            try:
                cv2.imwrite(output_path, processed_bgr)
                print(f"Compliant processed image saved to: {output_path}")
                result["output_path"] = output_path
            except Exception as e:
                print(f"Error saving processed image: {e}")
        elif output_path:
            # Save even failed images for debugging
            debug_path = output_path.replace(".jpg", "_failed.jpg")
            try:
                cv2.imwrite(debug_path, processed_bgr)
                print(f"Failed processed image saved for debugging to: {debug_path}")
                result["debug_path"] = debug_path
            except Exception as e:
                print(f"Error saving debug image: {e}")
        
        return result

    def check_image_array(self, image_bgr):
        """
        Run compliance check on an image array (for API usage).
        
        Args:
            image_bgr (numpy.ndarray): Input image in BGR format
            
        Returns:
            dict: Complete results including logs, recommendation, and processed image
        """
        all_logs = {"preprocessing": [], "validation": []}
        
        if image_bgr is None:
            return {
                "success": False,
                "recommendation": "REJECTED: Invalid image data",
                "logs": all_logs,
                "error": "Could not decode image"
            }

        # Step 1: Quick Check
        quick_check_faces = self.face_analyzer.quick_check(image_bgr)
        if not quick_check_faces:
            all_logs["preprocessing"].append(("FAIL", "Quick Check", "No face detected"))
            return {
                "success": False,
                "recommendation": "REJECTED: No face detected",
                "logs": all_logs
            }
        elif len(quick_check_faces) > 1:
            all_logs["preprocessing"].append(("FAIL", "Quick Check", "Multiple faces detected"))
            return {
                "success": False,
                "recommendation": "REJECTED: Multiple faces detected",
                "logs": all_logs
            }
        else:
            all_logs["preprocessing"].append(("PASS", "Quick Check", "Single face detected"))
            
            # Step 2: Preprocessing
            processed_bgr, face_data, preprocess_logs, success = self.preprocessor.process_image(image_bgr)
            all_logs["preprocessing"].extend(preprocess_logs)
            
            if not success or processed_bgr is None:
                return {
                    "success": False,
                    "recommendation": "REJECTED: Preprocessing failed",
                    "logs": all_logs
                }
            else:
                # Step 3: Validation
                validation_results = self.validator.validate_photo(processed_bgr, face_data)
                all_logs["validation"].extend(validation_results)
                recommendation = self._get_final_recommendation(validation_results)
        
        # Prepare response
        result = {
            "success": "REJECTED" not in recommendation,
            "recommendation": recommendation,
            "logs": all_logs
        }
        
        # Include processed image if successful
        if result["success"] and 'processed_bgr' in locals():
            _, buffer = cv2.imencode('.jpg', processed_bgr)
            processed_base64 = base64.b64encode(buffer).decode('utf-8')
            result["processed_image"] = processed_base64
        
        return result


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
        checker = ComplianceChecker(model_name='buffalo_l')
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
            
        checker = ComplianceChecker(model_name='buffalo_l')
        result = checker.run_check(input_image_path, output_image_path)

        if input_image_path == "dummy_baby_photo_for_check.jpg":
            os.remove(input_image_path)

    except Exception as e:
        print(f"A critical error occurred: {e}")
        import traceback
        traceback.print_exc() 