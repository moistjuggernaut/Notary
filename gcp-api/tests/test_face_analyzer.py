"""
Unit tests for the FaceAnalyzer module.
Tests face detection, landmark extraction, and pose estimation functionality.
"""

import unittest
import numpy as np
import cv2
from unittest.mock import Mock, patch, MagicMock
from lib.face_analyzer import FaceAnalyzer


class TestFaceAnalyzer(unittest.TestCase):
    """Test cases for the FaceAnalyzer class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.patcher = patch('gcp-api.lib.face_analyzer.FaceAnalysis')
        self.MockFaceAnalysis = self.patcher.start()
        self.mock_app = self.MockFaceAnalysis.return_value
        self.analyzer = FaceAnalyzer(model_name='buffalo_m')

    def tearDown(self):
        self.patcher.stop()

    def test_initialization_success(self):
        """Test that FaceAnalyzer initializes FaceAnalysis correctly."""
        self.MockFaceAnalysis.assert_called_once_with(
            name='buffalo_m',
            allowed_modules=['detection', 'landmark_2d_106', 'pose'],
            providers=['CPUExecutionProvider']
        )

    def test_initialization_failure(self):
        """Test initialization failure handling."""
        with patch('gcp-api.lib.face_analyzer.FaceAnalysis') as mock_face_analysis:
            mock_face_analysis.side_effect = Exception("Model loading failed")
            
            with self.assertRaises(Exception):
                FaceAnalyzer(model_name='buffalo_m')

    def test_default_providers(self):
        """Test that default providers are set correctly."""
        with patch('gcp-api.lib.face_analyzer.FaceAnalysis') as mock_face_analysis:
            mock_app = Mock()
            mock_face_analysis.return_value = mock_app
            
            FaceAnalyzer(model_name='buffalo_m')  # No providers specified
            
            # Verify default providers were used
            call_args = mock_face_analysis.call_args
            self.assertEqual(call_args[1]['providers'], ['CPUExecutionProvider'])

    def test_analyze_image_success(self):
        """Test successful image analysis."""
        # Create a dummy image
        test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        
        # Mock face detection result
        mock_face = Mock()
        mock_face.bbox = np.array([10, 20, 50, 80])
        self.mock_app.get.return_value = [mock_face]
        
        result = self.analyzer.analyze_image(test_image)
        
        # Verify get was called with RGB image
        self.mock_app.get.assert_called_once()
        call_args = self.mock_app.get.call_args[0][0]
        # Should be RGB (converted from BGR)
        np.testing.assert_array_equal(call_args, cv2.cvtColor(test_image, cv2.COLOR_BGR2RGB))
        
        # Verify result
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0], mock_face)

    def test_analyze_image_none_input(self):
        """Test analyze_image with None input."""
        result = self.analyzer.analyze_image(None)
        self.assertIsNone(result)
        self.mock_app.get.assert_not_called()

    def test_analyze_image_exception(self):
        """Test analyze_image when face analysis throws exception."""
        test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        self.mock_app.get.side_effect = Exception("Analysis failed")
        
        result = self.analyzer.analyze_image(test_image)
        self.assertIsNone(result)

    def test_quick_check_no_downscaling(self):
        """Test quick_check when image is already small enough."""
        # Small image (less than max_dim)
        test_image = np.zeros((200, 200, 3), dtype=np.uint8)
        
        mock_face = Mock()
        self.mock_app.get.return_value = [mock_face]
        
        result = self.analyzer.quick_check(test_image, max_dim=320)
        
        # Should call analyze_image with original image (no resizing)
        self.mock_app.get.assert_called_once()
        call_args = self.mock_app.get.call_args[0][0]
        self.assertEqual(call_args.shape[:2], (200, 200))

    def test_quick_check_with_downscaling(self):
        """Test quick_check when image needs downscaling."""
        # Large image (greater than max_dim)
        test_image = np.zeros((800, 600, 3), dtype=np.uint8)
        
        mock_face = Mock()
        self.mock_app.get.return_value = [mock_face]
        
        result = self.analyzer.quick_check(test_image, max_dim=320)
        
        # Should call analyze_image with resized image
        self.mock_app.get.assert_called_once()
        call_args = self.mock_app.get.call_args[0][0]
        
        # Calculate expected size
        scale = 320 / 800  # max_dim / max(height, width)
        expected_height = int(800 * scale)
        expected_width = int(600 * scale)
        
        self.assertEqual(call_args.shape[:2], (expected_height, expected_width))

    def test_quick_check_landscape_image(self):
        """Test quick_check with landscape orientation."""
        # Wide image
        test_image = np.zeros((300, 900, 3), dtype=np.uint8)
        
        mock_face = Mock()
        self.mock_app.get.return_value = [mock_face]
        
        result = self.analyzer.quick_check(test_image, max_dim=320)
        
        # Scale should be based on width (900) since it's larger
        scale = 320 / 900
        expected_height = int(300 * scale)
        expected_width = int(900 * scale)
        
        call_args = self.mock_app.get.call_args[0][0]
        self.assertEqual(call_args.shape[:2], (expected_height, expected_width))

    def test_analyze_image_color_conversion(self):
        """Test that BGR to RGB conversion is working correctly."""
        # Create an image with distinct colors to test conversion
        test_image = np.zeros((50, 50, 3), dtype=np.uint8)
        test_image[:, :, 0] = 255  # Blue channel in BGR
        test_image[:, :, 1] = 128  # Green channel
        test_image[:, :, 2] = 64   # Red channel in BGR
        
        self.mock_app.get.return_value = []
        
        self.analyzer.analyze_image(test_image)
        
        # Get the image that was passed to the mock
        call_args = self.mock_app.get.call_args[0][0]
        
        # In RGB, the channels should be swapped
        self.assertEqual(call_args[0, 0, 0], 64)   # Red channel (was BGR[2])
        self.assertEqual(call_args[0, 0, 1], 128)  # Green channel (same)
        self.assertEqual(call_args[0, 0, 2], 255)  # Blue channel (was BGR[0])

    def test_multiple_face_detection(self):
        """Test handling of multiple face detection results."""
        test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        
        # Mock multiple faces
        mock_face1 = Mock()
        mock_face1.bbox = np.array([10, 10, 30, 40])
        mock_face2 = Mock()
        mock_face2.bbox = np.array([50, 50, 70, 80])
        
        self.mock_app.get.return_value = [mock_face1, mock_face2]
        
        result = self.analyzer.analyze_image(test_image)
        
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0], mock_face1)
        self.assertEqual(result[1], mock_face2)

    def test_no_face_detection(self):
        """Test when no faces are detected."""
        test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        self.mock_app.get.return_value = []
        
        result = self.analyzer.analyze_image(test_image)
        
        self.assertEqual(len(result), 0)

    @patch('cv2.resize')
    def test_resize_interpolation_method(self, mock_resize):
        """Test that correct interpolation method is used for resizing."""
        test_image = np.zeros((800, 600, 3), dtype=np.uint8)
        mock_resize.return_value = np.zeros((400, 300, 3), dtype=np.uint8)
        self.mock_app.get.return_value = []
        
        self.analyzer.quick_check(test_image, max_dim=320)
        
        # Verify resize was called with INTER_AREA interpolation
        mock_resize.assert_called_once()
        call_args = mock_resize.call_args
        self.assertEqual(call_args[1]['interpolation'], cv2.INTER_AREA)

    def test_initialization_with_custom_providers(self):
        """Test initialization with custom ONNX providers."""
        custom_providers = ['TensorrtExecutionProvider', 'CUDAExecutionProvider']
        FaceAnalyzer(model_name='buffalo_m', providers=custom_providers)
        self.MockFaceAnalysis.assert_called_with(
            name='buffalo_m',
            allowed_modules=['detection', 'landmark_2d_106', 'pose'],
            providers=custom_providers
        )

    def test_analyze_image_with_no_faces(self):
        """Test analysis when the model finds no faces."""
        self.mock_app.get.return_value = []
        faces = self.analyzer.analyze_image(np.zeros((100, 100, 3), dtype=np.uint8))
        self.assertEqual(faces, [])

    def test_analyze_image_with_none_input(self):
        """Test analysis with a None image input."""
        faces = self.analyzer.analyze_image(None)
        self.assertEqual(faces, [])

    @patch('cv2.cvtColor', side_effect=Exception("Color Conversion Error"))
    def test_analyze_image_handles_cv2_error(self, mock_cvt):
        """Test that a CV2 error during analysis is handled gracefully."""
        faces = self.analyzer.analyze_image(np.zeros((100, 100, 3), dtype=np.uint8))
        self.assertEqual(faces, [])


if __name__ == '__main__':
    unittest.main() 