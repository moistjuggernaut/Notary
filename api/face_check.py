"""
DEPRECATED: This file has been split into modular components.
For new usage, import from the individual modules:
- config.py: Configuration constants
- face_analyzer.py: Face detection and analysis
- image_preprocessor.py: Image preprocessing and background removal
- photo_validator.py: Photo validation against ICAO standards
- compliance_checker.py: Main orchestrator and serverless handler

This file is kept for backward compatibility but should be migrated to use the new modular structure.
"""

# Re-export the main classes for backward compatibility
from .config import Config
from .face_analyzer import FaceAnalyzer
from .image_preprocessor import ImagePreprocessor
from .photo_validator import PhotoValidator
from .compliance_checker import ComplianceChecker, handler

# For CLI usage, redirect to the new compliance_checker module
if __name__ == "__main__":
    print("WARNING: This file is deprecated. Please use 'python -m api.compliance_checker' instead.")
    print("Or import ComplianceChecker from api.compliance_checker for programmatic usage.")
    
    # Run the original main logic for backward compatibility
    import os
    import cv2
    import numpy as np
    
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

