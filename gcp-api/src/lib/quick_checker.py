"""
Provides a fast, lightweight face counter using OpenCV's Haar Cascade classifier.
This checker is dependency-light and initializes quickly.
"""
import cv2
import numpy as np
import os
import logging

log = logging.getLogger(__name__)

class QuickChecker:
    """
    Performs a fast check using OpenCV's Haar Cascade to count faces.
    This method is lightweight and does not use InsightFace.
    """
    def __init__(self):
        """Initializes the Haar Cascade classifier."""
        try:
            # Construct a robust path to the Haar Cascade file
            cv2_base_dir = os.path.dirname(os.path.abspath(cv2.__file__))
            haar_xml = os.path.join(cv2_base_dir, 'data', 'haarcascade_frontalface_default.xml')
            
            log.info(f"Attempting to load Haar Cascade from: {haar_xml}")

            if not os.path.exists(haar_xml):
                log.error(f"Haar Cascade file not found at the constructed path: {haar_xml}")
                # As a fallback, try the original method, though it's less reliable
                haar_xml_fallback = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                if not os.path.exists(haar_xml_fallback):
                     raise FileNotFoundError(f"Haar Cascade file not found at primary path ({haar_xml}) or fallback path ({haar_xml_fallback})")
                log.warning(f"Primary path failed, using fallback path: {haar_xml_fallback}")
                haar_xml = haar_xml_fallback

            self.face_cascade = cv2.CascadeClassifier(haar_xml)

            if self.face_cascade.empty():
                raise IOError(f"Failed to load Haar Cascade classifier from path: {haar_xml}")
            
            log.info("Haar Cascade classifier loaded successfully.")

        except Exception as e:
            log.critical(f"Critical error during QuickChecker initialization: {e}", exc_info=True)
            raise e

    def count_faces(self, image_bgr: np.ndarray) -> int:
        """
        Counts the number of faces in a given image.

        Args:
            image_bgr (numpy.ndarray): Input image in BGR format.

        Returns:
            int: The number of faces detected.
        """
        if image_bgr is None:
            return 0

        # Convert to grayscale for the detector
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)


        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5
        )
        return len(faces) 