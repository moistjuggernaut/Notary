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
        Initialize the FaceAnalyzer. It will attempt to load the full InsightFace
        model but will not fail if it's unavailable. A lightweight OpenCV
        detector is always initialized for quick checks.
        """
        # Always initialize lightweight OpenCV Haar Cascade for quick checks
        # This is fast and has no heavy dependencies.
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

        self.app = None
        if INSIGHTFACE_AVAILABLE:
            if providers is None:
                providers = ['CPUExecutionProvider']
            try:
                self.app = FaceAnalysis(
                    name=model_name,
                    allowed_modules=['detection', 'landmark_2d_106', 'pose'],
                    providers=providers
                )
                self.app.prepare(ctx_id=0, det_size=(640, 640))
                print("FaceAnalyzer: InsightFace model loaded successfully.")
            except Exception as e:
                print(f"FaceAnalyzer WARNING: Could not initialize InsightFace: {e}")
                print("Full analysis will not be available, but quick_check will work.")
                self.app = None
        else:
            print("FaceAnalyzer INFO: InsightFace library not found.")
            print("Full analysis will not be available, but quick_check will work.")

    def quick_check(self, image_bgr):
        """
        Performs a fast check using OpenCV's Haar Cascade to count faces.
        This method is lightweight and does not use InsightFace.
        
        Args:
            image_bgr (numpy.ndarray): Input image in BGR format.
            
        Returns:
            int: The number of faces detected.
        """
        if image_bgr is None:
            return 0
        
        # Convert to grayscale for the detector
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        
        # Downscale for performance
        h, w = gray.shape
        scale = 480 / max(h, w) # Target ~480px on longest side
        if scale < 1:
            dsize = (int(w * scale), int(h * scale))
            gray_small = cv2.resize(gray, dsize, interpolation=cv2.INTER_AREA)
        else:
            gray_small = gray

        faces = self.face_cascade.detectMultiScale(
            gray_small,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        return len(faces)

    def analyze_image(self, image_bgr):
        """
        Analyzes faces in an image using the full InsightFace model.
        
        Args:
            image_bgr (numpy.ndarray): Input image in BGR format
            
        Returns:
            list: List of detected faces with landmarks and pose information,
                  or raises an exception if the model is not loaded.
        """
        if self.app is None:
            raise RuntimeError("InsightFace model is not available for full analysis.")

        if image_bgr is None:
            return None
        
        try:
            image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
            faces = self.app.get(image_rgb)
            return faces
        except Exception as e:
            print(f"FaceAnalyzer Error: Could not process image with InsightFace: {e}")
            return None 