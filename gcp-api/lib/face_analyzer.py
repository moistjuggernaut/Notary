"""
Face detection and analysis module using InsightFace.
Handles face detection, landmark extraction, and pose estimation.
"""

import cv2
import numpy as np
try:
    from insightface import FaceAnalysis
    INSIGHTFACE_AVAILABLE = True
except ImportError:
    INSIGHTFACE_AVAILABLE = False
    print("InsightFace not available. Face analysis will be disabled.")
    # Create a dummy FaceAnalysis class for testing
    class FaceAnalysis:
        def __init__(self, **kwargs):
            pass

                
class FaceAnalyzer:
    """Handles face detection and landmark extraction using InsightFace."""
    
    def __init__(self, model_name='buffalo_l', providers=None):
        """
        Initialize the FaceAnalyzer with InsightFace model.
        
        Args:
            model_name (str): InsightFace model name (e.g., 'buffalo_l')
            providers (list): ONNX providers for inference (e.g., ['CPUExecutionProvider'])
        """
        if not INSIGHTFACE_AVAILABLE:
            raise ImportError("InsightFace is required for face analysis. Install with: pip install insightface")
        
        if providers is None:
            providers = ['CPUExecutionProvider']
        
        try:
            # Initialize InsightFace
            self.app = FaceAnalysis(
                name=model_name,
                allowed_modules=['detection', 'landmark_2d_106', 'pose'],
                providers=providers
            )
            
            # Prepare the model
            self.app.prepare(ctx_id=0, det_size=(640, 640))
            
            print(f"FaceAnalyzer: InsightFace model '{model_name}' loaded successfully.")
        except Exception as e:
            print(f"FaceAnalyzer Error: Initializing InsightFace failed: {e}")
            raise

    def analyze_image(self, image_bgr):
        """
        Analyzes faces in an image.
        
        Args:
            image_bgr (numpy.ndarray): Input image in BGR format
            
        Returns:
            list: List of detected faces with landmarks and pose information,
                  or None if analysis fails
        """
        if image_bgr is None:
            return None
        
        try:
            # Convert BGR to RGB for InsightFace
            image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
            
            # Run face detection and analysis
            faces = self.app.get(image_rgb)
            
            return faces
            
        except Exception as e:
            print(f"FaceAnalyzer Error: Could not process image: {e}")
            return None

    def quick_check(self, image_bgr, max_dim=320):
        """
        Performs a fast check on a downscaled image to find faces.
        
        Args:
            image_bgr (numpy.ndarray): Input image in BGR format
            max_dim (int): Maximum dimension for downscaling
            
        Returns:
            list: List of detected faces on the downscaled image
        """
        h, w = image_bgr.shape[:2]
        scale = max_dim / max(h, w)
        
        if scale < 1:
            # Downscale the image for faster processing
            dsize = (int(w * scale), int(h * scale))
            image_small = cv2.resize(image_bgr, dsize, interpolation=cv2.INTER_AREA)
        else:
            image_small = image_bgr
        
        return self.analyze_image(image_small) 