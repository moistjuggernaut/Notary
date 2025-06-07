"""
Unit tests for the Config module.
Tests that all configuration constants are properly defined and within expected ranges.
"""

import unittest
from config import Config


class TestConfig(unittest.TestCase):
    """Test cases for the Config class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.config = Config()

    def test_photo_dimensions(self):
        """Test that photo dimensions are properly defined."""
        self.assertEqual(self.config.TARGET_PHOTO_WIDTH_MM, 35)
        self.assertEqual(self.config.TARGET_PHOTO_HEIGHT_MM, 45)
        self.assertEqual(self.config.TARGET_DPI, 600)
        
        # Test calculated pixel dimensions
        expected_height = int((45 / 25.4) * 600)  # Should be ~1063
        expected_width = int((35 / 25.4) * 600)   # Should be ~827
        self.assertEqual(self.config.FINAL_OUTPUT_HEIGHT_PX, expected_height)
        self.assertEqual(self.config.FINAL_OUTPUT_WIDTH_PX, expected_width)

    def test_aspect_ratio(self):
        """Test aspect ratio calculations."""
        expected_ratio = 35 / 45  # ~0.778
        self.assertAlmostEqual(self.config.TARGET_ASPECT_RATIO, expected_ratio, places=3)
        self.assertEqual(self.config.ASPECT_RATIO_TOLERANCE, 0.05)

    def test_chin_to_crown_ratios(self):
        """Test chin-to-crown height ratios are valid."""
        self.assertAlmostEqual(self.config.MIN_CHIN_TO_CROWN_RATIO, 31/45, places=3)
        self.assertAlmostEqual(self.config.MAX_CHIN_TO_CROWN_RATIO, 36/45, places=3)
        
        # Test that min < max
        self.assertLess(self.config.MIN_CHIN_TO_CROWN_RATIO, self.config.MAX_CHIN_TO_CROWN_RATIO)
        
        # Test target ratio is between min and max
        self.assertGreaterEqual(self.config.CROP_TARGET_CHIN_TO_CROWN_RATIO, self.config.MIN_CHIN_TO_CROWN_RATIO)
        self.assertLessEqual(self.config.CROP_TARGET_CHIN_TO_CROWN_RATIO, self.config.MAX_CHIN_TO_CROWN_RATIO)

    def test_margin_calculations(self):
        """Test top margin calculations."""
        self.assertEqual(self.config.TOP_MARGIN_MM, 3)
        expected_margin_px = int((3 / 25.4) * 600)  # Should be ~71
        self.assertEqual(self.config.TOP_MARGIN_FINAL_PX, expected_margin_px)

    def test_pose_tolerances(self):
        """Test head pose tolerance values are reasonable."""
        self.assertEqual(self.config.MAX_ABS_YAW, 10)
        self.assertEqual(self.config.MAX_ABS_PITCH, 10)
        self.assertEqual(self.config.MAX_ABS_ROLL, 7)
        
        # All should be positive values
        self.assertGreater(self.config.MAX_ABS_YAW, 0)
        self.assertGreater(self.config.MAX_ABS_PITCH, 0)
        self.assertGreater(self.config.MAX_ABS_ROLL, 0)

    def test_baby_mouth_ratios(self):
        """Test baby mouth opening ratios."""
        self.assertEqual(self.config.BABY_MOUTH_OPENING_PASS_RATIO, 0.10)
        self.assertEqual(self.config.BABY_MOUTH_OPENING_WARN_RATIO, 0.15)
        
        # Warning threshold should be higher than pass threshold
        self.assertGreater(self.config.BABY_MOUTH_OPENING_WARN_RATIO, self.config.BABY_MOUTH_OPENING_PASS_RATIO)

    def test_background_parameters(self):
        """Test background check parameters."""
        # Preliminary background check
        self.assertEqual(self.config.BG_PRELIM_MIN_LIGHT_RGB, (200, 200, 200))
        self.assertEqual(self.config.BG_PRELIM_STD_DEV_MAX, 30)
        
        # Final background check
        self.assertEqual(self.config.BG_FINAL_MIN_LIGHT_RGB, (180, 180, 180))
        self.assertEqual(self.config.BG_FINAL_MAX_RGB, (255, 255, 255))
        self.assertEqual(self.config.BG_FINAL_STD_DEV_MAX, 25)
        
        # Final min should be less than or equal to preliminary min
        for i in range(3):
            self.assertLessEqual(self.config.BG_FINAL_MIN_LIGHT_RGB[i], self.config.BG_PRELIM_MIN_LIGHT_RGB[i])

    def test_contrast_threshold(self):
        """Test contrast threshold value."""
        self.assertEqual(self.config.CONTRAST_THRESHOLD_GRAY, 35)
        self.assertGreater(self.config.CONTRAST_THRESHOLD_GRAY, 0)

    def test_detection_confidence(self):
        """Test face detection confidence threshold."""
        self.assertEqual(self.config.MIN_DETECTION_SCORE, 0.6)
        self.assertGreaterEqual(self.config.MIN_DETECTION_SCORE, 0.0)
        self.assertLessEqual(self.config.MIN_DETECTION_SCORE, 1.0)

    def test_eye_aspect_ratio_threshold(self):
        """Test eye aspect ratio threshold."""
        self.assertEqual(self.config.EYE_AR_THRESH, 0.18)
        self.assertGreater(self.config.EYE_AR_THRESH, 0)

    def test_red_eye_parameters(self):
        """Test red-eye detection parameters."""
        self.assertEqual(self.config.RED_EYE_HUE_LOWER, 160)
        self.assertEqual(self.config.RED_EYE_HUE_UPPER, 10)
        self.assertEqual(self.config.RED_EYE_SATURATION_MIN, 100)
        self.assertEqual(self.config.RED_EYE_VALUE_MIN, 100)
        self.assertEqual(self.config.RED_EYE_PIXEL_PERCENTAGE_THRESH, 0.15)
        
        # HSV ranges should be valid
        self.assertGreaterEqual(self.config.RED_EYE_HUE_LOWER, 0)
        self.assertLessEqual(self.config.RED_EYE_HUE_LOWER, 179)
        self.assertGreaterEqual(self.config.RED_EYE_HUE_UPPER, 0)
        self.assertLessEqual(self.config.RED_EYE_HUE_UPPER, 179)

    def test_landmark_indices(self):
        """Test landmark indices are valid."""
        self.assertEqual(self.config.CHIN_LANDMARK_INDEX, 16)
        
        # Test eye landmark arrays
        self.assertEqual(len(self.config.LEFT_EYE_LANDMARKS), 6)
        self.assertEqual(len(self.config.RIGHT_EYE_LANDMARKS), 6)
        self.assertEqual(self.config.LEFT_EYE_LANDMARKS, [35, 36, 33, 37, 39, 42])
        self.assertEqual(self.config.RIGHT_EYE_LANDMARKS, [74, 93, 90, 94, 96, 97])
        
        # Test pupil indices
        self.assertEqual(self.config.LEFT_PUPIL_APPROX_INDEX, 35)
        self.assertEqual(self.config.RIGHT_PUPIL_APPROX_INDEX, 74)
        
        # All landmark indices should be non-negative
        self.assertGreaterEqual(self.config.CHIN_LANDMARK_INDEX, 0)
        self.assertGreaterEqual(self.config.LEFT_PUPIL_APPROX_INDEX, 0)
        self.assertGreaterEqual(self.config.RIGHT_PUPIL_APPROX_INDEX, 0)
        
        for idx in self.config.LEFT_EYE_LANDMARKS + self.config.RIGHT_EYE_LANDMARKS:
            self.assertGreaterEqual(idx, 0)

    def test_config_immutability(self):
        """Test that config values are consistent between instances."""
        config2 = Config()
        
        # Test a few key values to ensure consistency
        self.assertEqual(self.config.TARGET_PHOTO_WIDTH_MM, config2.TARGET_PHOTO_WIDTH_MM)
        self.assertEqual(self.config.FINAL_OUTPUT_HEIGHT_PX, config2.FINAL_OUTPUT_HEIGHT_PX)
        self.assertEqual(self.config.MIN_CHIN_TO_CROWN_RATIO, config2.MIN_CHIN_TO_CROWN_RATIO)


if __name__ == '__main__':
    unittest.main() 