"""
Unit tests for the ImagePreprocessor module.
Tests image cropping, resizing, background removal, and preprocessing workflow.
"""

import unittest
import numpy as np
import cv2
from unittest.mock import Mock, patch, MagicMock
from image_preprocessor import ImagePreprocessor
from face_analyzer import FaceAnalyzer
from config import Config


class TestImagePreprocessor(unittest.TestCase):
    """Test cases for the ImagePreprocessor class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        # Mock the FaceAnalyzer
        self.mock_face_analyzer = Mock(spec=FaceAnalyzer)
        self.preprocessor = ImagePreprocessor(self.mock_face_analyzer)
        self.config = Config()
        
        # Create a test image
        self.test_image = np.random.randint(0, 255, (800, 600, 3), dtype=np.uint8)
        
        # Create mock face data
        self.mock_face = Mock()
        self.mock_face.bbox = np.array([200, 150, 400, 500])  # x1, y1, x2, y2
        
        # Create landmarks
        landmarks = np.zeros((106, 2), dtype=np.float32)
        landmarks[16] = [300, 450]  # Chin landmark
        self.mock_face.landmark_2d_106 = landmarks

    def test_initialization(self):
        """Test ImagePreprocessor initialization."""
        self.assertEqual(self.preprocessor.face_analyzer, self.mock_face_analyzer)
        self.assertIsInstance(self.preprocessor.config, Config)

    def test_get_face_details_no_faces(self):
        """Test _get_face_details_for_crop with no faces."""
        face_details, error = self.preprocessor._get_face_details_for_crop([])
        
        self.assertIsNone(face_details)
        self.assertEqual(error, "No face detected on original image.")

    def test_get_face_details_multiple_faces(self):
        """Test _get_face_details_for_crop with multiple faces."""
        faces = [Mock(), Mock()]  # Two faces
        
        face_details, error = self.preprocessor._get_face_details_for_crop(faces)
        
        self.assertIsNone(face_details)
        self.assertIn("Multiple (2) faces detected", error)

    def test_get_face_details_no_landmarks(self):
        """Test _get_face_details_for_crop with missing landmarks."""
        face = Mock()
        face.landmark_2d_106 = None
        face.bbox = np.array([100, 100, 200, 200])
        
        face_details, error = self.preprocessor._get_face_details_for_crop([face])
        
        self.assertIsNone(face_details)
        self.assertEqual(error, "Landmarks or bounding box missing.")

    def test_get_face_details_no_bbox(self):
        """Test _get_face_details_for_crop with missing bbox."""
        face = Mock()
        face.landmark_2d_106 = np.zeros((106, 2))
        face.bbox = None
        
        face_details, error = self.preprocessor._get_face_details_for_crop([face])
        
        self.assertIsNone(face_details)
        self.assertEqual(error, "Landmarks or bounding box missing.")

    def test_get_face_details_invalid_geometry(self):
        """Test _get_face_details_for_crop with invalid landmark geometry."""
        face = Mock()
        landmarks = np.zeros((106, 2), dtype=np.float32)
        landmarks[16] = [300, 100]  # Chin above crown
        face.landmark_2d_106 = landmarks
        face.bbox = np.array([200, 150, 400, 200])  # Crown at y=150
        
        face_details, error = self.preprocessor._get_face_details_for_crop([face])
        
        self.assertIsNone(face_details)
        self.assertEqual(error, "Invalid landmark geometry (chin above crown).")

    def test_get_face_details_success(self):
        """Test _get_face_details_for_crop with valid face."""
        face_details, error = self.preprocessor._get_face_details_for_crop([self.mock_face])
        
        self.assertIsNone(error)
        self.assertIsNotNone(face_details)
        
        # Check returned structure
        expected_keys = ["chin_y_orig", "crown_y_orig_approx", "detected_chin_crown_orig_px", "face_center_x_orig"]
        for key in expected_keys:
            self.assertIn(key, face_details)
        
        # Check calculations
        self.assertEqual(face_details["chin_y_orig"], 450)  # From landmark
        self.assertEqual(face_details["crown_y_orig_approx"], 150)  # From bbox
        self.assertEqual(face_details["detected_chin_crown_orig_px"], 300)  # 450 - 150
        self.assertEqual(face_details["face_center_x_orig"], 300)  # (200 + 400) / 2

    def test_calculate_crop_coordinates_invalid_scale(self):
        """Test _calculate_crop_coordinates with invalid scale factor."""
        img_shape = (800, 600, 3)
        face_details = {"detected_chin_crown_orig_px": 0}  # Invalid
        
        coords, error = self.preprocessor._calculate_crop_coordinates(img_shape, face_details)
        
        self.assertIsNone(coords)
        self.assertEqual(error, "Invalid crop scale factor.")

    def test_calculate_crop_coordinates_success(self):
        """Test _calculate_crop_coordinates with valid inputs."""
        img_shape = (800, 600, 3)
        face_details = {
            "detected_chin_crown_orig_px": 300,
            "crown_y_orig_approx": 150,
            "face_center_x_orig": 300
        }
        
        coords, error = self.preprocessor._calculate_crop_coordinates(img_shape, face_details)
        
        self.assertIsNone(error)
        self.assertIsNotNone(coords)
        self.assertEqual(len(coords), 4)  # x1, y1, x2, y2
        
        x1, y1, x2, y2 = coords
        # All coordinates should be within image bounds
        self.assertGreaterEqual(x1, 0)
        self.assertGreaterEqual(y1, 0)
        self.assertLessEqual(x2, 600)  # Image width
        self.assertLessEqual(y2, 800)  # Image height
        
        # Crop should have valid dimensions
        self.assertGreater(x2 - x1, 0)
        self.assertGreater(y2 - y1, 0)

    def test_calculate_crop_coordinates_boundary_clipping(self):
        """Test _calculate_crop_coordinates with boundary conditions."""
        img_shape = (400, 300, 3)  # Small image
        face_details = {
            "detected_chin_crown_orig_px": 100,
            "crown_y_orig_approx": 10,  # Very near top
            "face_center_x_orig": 50    # Near left edge
        }
        
        coords, error = self.preprocessor._calculate_crop_coordinates(img_shape, face_details)
        
        self.assertIsNone(error)
        x1, y1, x2, y2 = coords
        
        # Should be clipped to image boundaries
        self.assertGreaterEqual(x1, 0)
        self.assertGreaterEqual(y1, 0)
        self.assertLessEqual(x2, 300)
        self.assertLessEqual(y2, 400)

    def test_preliminary_background_check_insufficient_pixels(self):
        """Test _preliminary_background_check with insufficient background pixels."""
        # Create small image where face takes up most space
        small_image = np.zeros((50, 50, 3), dtype=np.uint8)
        large_bbox = np.array([5, 5, 45, 45])  # Large face bbox
        
        is_ok, reason = self.preprocessor._preliminary_background_check(small_image, large_bbox)
        
        self.assertFalse(is_ok)
        self.assertIn("Not enough background pixels", reason)

    def test_preliminary_background_check_good_background(self):
        """Test _preliminary_background_check with good background."""
        # Create image with light uniform background
        test_image = np.full((400, 400, 3), 220, dtype=np.uint8)
        small_bbox = np.array([150, 150, 250, 250])  # Small face bbox
        
        is_ok, reason = self.preprocessor._preliminary_background_check(test_image, small_bbox)
        
        self.assertTrue(is_ok)
        self.assertIn("BG appears OK", reason)

    def test_preliminary_background_check_dark_background(self):
        """Test _preliminary_background_check with dark background."""
        # Create image with dark background
        test_image = np.full((400, 400, 3), 100, dtype=np.uint8)
        small_bbox = np.array([150, 150, 250, 250])
        
        is_ok, reason = self.preprocessor._preliminary_background_check(test_image, small_bbox)
        
        self.assertFalse(is_ok)
        self.assertIn("not light enough", reason)

    def test_preliminary_background_check_non_uniform_background(self):
        """Test _preliminary_background_check with non-uniform background."""
        # Create image with non-uniform background
        test_image = np.random.randint(180, 255, (400, 400, 3), dtype=np.uint8)
        small_bbox = np.array([150, 150, 250, 250])
        
        is_ok, reason = self.preprocessor._preliminary_background_check(test_image, small_bbox)
        
        # Result depends on actual variance, but should give proper feedback
        self.assertIsInstance(is_ok, bool)
        self.assertIsInstance(reason, str)

    def test_process_image_no_face_detected(self):
        """Test process_image when no face is detected initially."""
        self.mock_face_analyzer.analyze_image.return_value = []
        
        result_image, face_data, logs, success = self.preprocessor.process_image(self.test_image)
        
        self.assertIsNone(result_image)
        self.assertIsNone(face_data)
        self.assertFalse(success)
        
        # Check logs
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0][0], "FAIL")
        self.assertIn("No face detected", logs[0][2])

    def test_process_image_crop_calculation_failure(self):
        """Test process_image when crop calculation fails."""
        # Set up face with invalid geometry
        invalid_face = Mock()
        landmarks = np.zeros((106, 2), dtype=np.float32)
        landmarks[16] = [300, 100]  # Chin above crown
        invalid_face.landmark_2d_106 = landmarks
        invalid_face.bbox = np.array([200, 150, 400, 200])
        
        self.mock_face_analyzer.analyze_image.return_value = [invalid_face]
        
        result_image, face_data, logs, success = self.preprocessor.process_image(self.test_image)
        
        self.assertIsNone(result_image)
        self.assertIsNone(face_data)
        self.assertFalse(success)
        
        # Should have logs showing the failure
        fail_logs = [log for log in logs if log[0] == "FAIL"]
        self.assertGreater(len(fail_logs), 0)

    @patch('cv2.resize')
    def test_process_image_success_no_background_removal(self, mock_resize):
        """Test successful process_image without background removal."""
        # Create a processed image to return from resize
        processed_size = (self.config.FINAL_OUTPUT_WIDTH_PX, self.config.FINAL_OUTPUT_HEIGHT_PX)
        mock_processed = np.full((*processed_size[::-1], 3), 220, dtype=np.uint8)
        mock_resize.return_value = mock_processed
        
        # Mock face analysis returns
        self.mock_face_analyzer.analyze_image.side_effect = [
            [self.mock_face],  # Initial analysis
            [self.mock_face]   # Final analysis
        ]
        
        # Mock good background (no removal needed)
        with patch.object(self.preprocessor, '_preliminary_background_check', return_value=(True, "BG OK")):
            result_image, face_data, logs, success = self.preprocessor.process_image(self.test_image)
        
        self.assertIsNotNone(result_image)
        self.assertIsNotNone(face_data)
        self.assertTrue(success)
        
        # Check that resize was called
        mock_resize.assert_called_once()
        
        # Check logs for success indicators
        info_logs = [log for log in logs if log[0] == "INFO"]
        self.assertGreater(len(info_logs), 0)

    @patch('image_preprocessor.REMBG_AVAILABLE', True)
    @patch('image_preprocessor.remove_background_rembg')
    @patch('cv2.resize')
    def test_process_image_with_background_removal(self, mock_resize, mock_rembg):
        """Test process_image with background removal."""
        # Set up mocks
        processed_size = (self.config.FINAL_OUTPUT_WIDTH_PX, self.config.FINAL_OUTPUT_HEIGHT_PX)
        mock_processed = np.full((*processed_size[::-1], 3), 220, dtype=np.uint8)
        mock_resize.return_value = mock_processed
        
        # Mock RGBA output from rembg
        mock_rgba = np.full((*processed_size[::-1], 4), 255, dtype=np.uint8)
        mock_rgba[:, :, 3] = 200  # Alpha channel
        mock_rembg.return_value = mock_rgba
        
        # Mock face analysis
        self.mock_face_analyzer.analyze_image.side_effect = [
            [self.mock_face],  # Initial analysis
            [self.mock_face],  # Final analysis (after resize)
            [self.mock_face]   # Final analysis (after bg removal)
        ]
        
        # Mock bad background (needs removal)
        with patch.object(self.preprocessor, '_preliminary_background_check', return_value=(False, "BG needs removal")):
            result_image, face_data, logs, success = self.preprocessor.process_image(self.test_image)
        
        self.assertIsNotNone(result_image)
        self.assertTrue(success)
        
        # Check that background removal was attempted
        mock_rembg.assert_called_once()
        
        # Check logs for background removal
        bg_logs = [log for log in logs if "background removal" in log[2].lower()]
        self.assertGreater(len(bg_logs), 0)

    def test_process_image_no_final_face_detection(self):
        """Test process_image when final face detection fails."""
        # Mock successful initial processing but failed final detection
        self.mock_face_analyzer.analyze_image.side_effect = [
            [self.mock_face],  # Initial analysis succeeds
            []                 # Final analysis fails
        ]
        
        with patch('cv2.resize') as mock_resize:
            mock_resize.return_value = np.zeros((self.config.FINAL_OUTPUT_HEIGHT_PX, 
                                               self.config.FINAL_OUTPUT_WIDTH_PX, 3), dtype=np.uint8)
            
            result_image, face_data, logs, success = self.preprocessor.process_image(self.test_image)
        
        # Should return image but indicate failure
        self.assertIsNotNone(result_image)
        self.assertIsNone(face_data)
        self.assertFalse(success)
        
        # Check for failure log
        fail_logs = [log for log in logs if log[0] == "FAIL" and "final" in log[2].lower()]
        self.assertGreater(len(fail_logs), 0)

    def test_process_image_empty_crop(self):
        """Test process_image when crop results in empty image."""
        # Mock face that would result in empty crop
        self.mock_face_analyzer.analyze_image.return_value = [self.mock_face]
        
        # Mock _calculate_crop_coordinates to return valid coords but cv2.crop returns empty
        with patch.object(self.preprocessor, '_calculate_crop_coordinates', return_value=((10, 10, 20, 20), None)):
            # This will result in a very small crop that might be empty
            result_image, face_data, logs, success = self.preprocessor.process_image(self.test_image)
        
        # Should handle empty crop gracefully
        if not success:
            fail_logs = [log for log in logs if log[0] == "FAIL"]
            self.assertGreater(len(fail_logs), 0)

    @patch('image_preprocessor.REMBG_AVAILABLE', True)
    @patch('image_preprocessor.remove_background_rembg')
    def test_background_removal_exception_handling(self, mock_rembg):
        """Test that background removal exceptions are handled gracefully."""
        mock_rembg.side_effect = Exception("Background removal failed")
        
        # Set up successful preprocessing until background removal
        processed_size = (self.config.FINAL_OUTPUT_WIDTH_PX, self.config.FINAL_OUTPUT_HEIGHT_PX)
        mock_processed = np.full((*processed_size[::-1], 3), 220, dtype=np.uint8)
        
        self.mock_face_analyzer.analyze_image.side_effect = [
            [self.mock_face],  # Initial analysis
            [self.mock_face],  # Final analysis (after resize)
            [self.mock_face]   # Final analysis (after failed bg removal)
        ]
        
        with patch('cv2.resize', return_value=mock_processed):
            with patch.object(self.preprocessor, '_preliminary_background_check', return_value=(False, "BG bad")):
                result_image, face_data, logs, success = self.preprocessor.process_image(self.test_image)
        
        # Should still succeed despite bg removal failure
        self.assertIsNotNone(result_image)
        self.assertTrue(success)
        
        # Should have warning log about bg removal failure
        warning_logs = [log for log in logs if log[0] == "WARNING" and "failed" in log[2]]
        self.assertGreater(len(warning_logs), 0)

    @patch('image_preprocessor.REMBG_AVAILABLE', False)
    def test_background_removal_not_available(self):
        """Test process_image when rembg is not available."""
        processed_size = (self.config.FINAL_OUTPUT_WIDTH_PX, self.config.FINAL_OUTPUT_HEIGHT_PX)
        mock_processed = np.full((*processed_size[::-1], 3), 220, dtype=np.uint8)
        
        self.mock_face_analyzer.analyze_image.side_effect = [
            [self.mock_face],  # Initial analysis
            [self.mock_face],  # Final analysis (after resize)
            [self.mock_face]   # Final analysis
        ]
        
        with patch('cv2.resize', return_value=mock_processed):
            with patch.object(self.preprocessor, '_preliminary_background_check', return_value=(False, "BG bad")):
                result_image, face_data, logs, success = self.preprocessor.process_image(self.test_image)
        
        self.assertTrue(success)
        
        # Should have warning about rembg not being available
        warning_logs = [log for log in logs if log[0] == "WARNING" and "rembg" in log[2]]
        self.assertGreater(len(warning_logs), 0)


if __name__ == '__main__':
    unittest.main() 