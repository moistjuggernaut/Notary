import unittest
import numpy as np
import cv2
from unittest.mock import Mock
from lib.image_preprocessor import ImagePreprocessor
from lib.photo_validator import PhotoValidator
from lib.config import Config

class TestCoreImageProcessing(unittest.TestCase):
    """
    A focused test suite for the most critical image processing functions
    that are currently failing.
    """

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.mock_face_analyzer = Mock()
        self.preprocessor = ImagePreprocessor(self.mock_face_analyzer)
        self.validator = PhotoValidator()
        self.config = Config()

    def test_calculate_crop_coordinates_with_assertions(self):
        """
        Test the crop calculation with precise assertions on the output,
        ensuring the crop box has the correct ICAO aspect ratio.
        """
        img_h, img_w = 1000, 800
        img_shape = (img_h, img_w, 3)
        face_bbox = np.array([300, 400, 500, 600]) # x1, y1, x2, y2
        face_details = {"bbox": face_bbox}

        coords, error = self.preprocessor._calculate_crop_coordinates(img_shape, face_details)
        self.assertIsNone(error)
        self.assertIsNotNone(coords)

        x1, y1, x2, y2 = coords
        crop_w = x2 - x1
        crop_h = y2 - y1

        self.assertGreater(crop_w, 0)
        self.assertGreater(crop_h, 0)

        actual_aspect_ratio = crop_w / crop_h
        target_aspect_ratio = self.config.TARGET_ASPECT_RATIO
        
        self.assertAlmostEqual(
            actual_aspect_ratio,
            target_aspect_ratio,
            delta=0.01,
            msg=f"Crop aspect ratio is wrong. Expected: {target_aspect_ratio:.2f}, Got: {actual_aspect_ratio:.2f}"
        )

if __name__ == '__main__':
    unittest.main(argv=['first-arg-is-ignored'], exit=False) 