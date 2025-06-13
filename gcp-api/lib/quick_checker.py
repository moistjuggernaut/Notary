"""
Provides a fast, lightweight face counter using OpenCV's Haar Cascade classifier.
This checker is dependency-light and initializes quickly.
"""
import cv2
import numpy as np

class QuickChecker:
    """
    Performs a fast check using OpenCV's Haar Cascade to count faces.
    This method is lightweight and does not use InsightFace.
    """
    def __init__(self):
        """Initializes the Haar Cascade classifier."""
        # This is fast and has no heavy dependencies.
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )

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

        # Downscale for performance. Target ~480px on the longest side.
        h, w = gray.shape
        scale = 480 / max(h, w)
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