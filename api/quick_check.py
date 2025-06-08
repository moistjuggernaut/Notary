"""
Quick face detection endpoint for fast validation.
Provides a lightweight check to detect if a face is present in the image.
"""

import os
import json
import base64
import cv2
import numpy as np
from .lib.face_analyzer import FaceAnalyzer


def handler(request, response):
    """
    Vercel serverless function for quick face detection.
    
    Expected request body:
    {
        "image": "base64_string"
    }
    
    Returns:
    {
        "success": bool,
        "face_detected": bool,
        "face_count": int,
        "message": str,
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
        
        # Initialize face analyzer and run quick check
        face_analyzer = FaceAnalyzer(model_name='buffalo_l')
        faces = face_analyzer.quick_check(original_bgr)
        
        # Prepare response
        face_count = len(faces)
        face_detected = face_count > 0
        
        if face_count == 0:
            message = "No face detected"
        elif face_count == 1:
            message = "Single face detected"
        else:
            message = f"Multiple faces detected ({face_count})"
        
        result = {
            "success": True,
            "face_detected": face_detected,
            "face_count": face_count,
            "message": message
        }
        
        response.status_code = 200
        return json.dumps(result)
        
    except Exception as e:
        response.status_code = 500
        return json.dumps({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        })


# CLI usage for testing
if __name__ == "__main__":
    # Test with a sample image
    test_image_path = "./images/valid1.jpg" if os.path.exists("./images/valid1.jpg") else None
    
    if test_image_path:
        try:
            # Load and encode test image
            with open(test_image_path, 'rb') as f:
                image_data = f.read()
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            # Simulate request
            class MockRequest:
                def __init__(self, data):
                    self.data = data
                    self.method = 'POST'
                def get_json(self):
                    return self.data
            
            class MockResponse:
                def __init__(self):
                    self.headers = {}
                    self.status_code = 200
            
            # Test the handler
            mock_req = MockRequest({"image": image_base64})
            mock_res = MockResponse()
            
            result = handler(mock_req, mock_res)
            print("Quick check test result:")
            print(result)
            
        except Exception as e:
            print(f"Test failed: {e}")
    else:
        print("No test image found at ./images/valid1.jpg") 