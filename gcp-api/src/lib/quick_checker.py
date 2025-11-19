"""
Fast, lightweight face counter using OpenCV's Haar Cascade classifier.
"""
import cv2
import numpy as np
import os
import logging

log = logging.getLogger(__name__)

class QuickChecker:
    """Performs a fast check using OpenCV's Haar Cascade to count faces."""
    
    def __init__(self):
        try:
            cv2_base_dir = os.path.dirname(os.path.abspath(cv2.__file__))
            haar_xml = os.path.join(cv2_base_dir, 'data', 'haarcascade_frontalface_default.xml')
            
            if not os.path.exists(haar_xml):
                haar_xml = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                if not os.path.exists(haar_xml):
                     raise FileNotFoundError("Haar Cascade file not found")

            self.face_cascade = cv2.CascadeClassifier(haar_xml)
            if self.face_cascade.empty():
                raise IOError(f"Failed to load Haar Cascade from {haar_xml}")
            
        except Exception as e:
            log.critical(f"QuickChecker init failed: {e}", exc_info=True)
            raise e

    def count_faces(self, image_bgr: np.ndarray) -> int:
        if image_bgr is None: return 0

        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape
        scale = 480 / max(h, w)
        
        if scale < 1:
            gray = cv2.resize(gray, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=7,
            minSize=(30, 30)
        )
        return len(faces)
