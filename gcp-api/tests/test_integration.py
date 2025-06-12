"""
Integration tests for the passport photo validation system.
These tests use actual image files and test the complete workflow end-to-end.
"""

import unittest
import os
import numpy as np
import cv2
from unittest.mock import patch, Mock
from api.compliance_checker import ComplianceChecker
from api.lib.config import Config


class TestIntegrationWithRealImages(unittest.TestCase):
    """Integration tests using real image files."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.config = Config()
        self.images_dir = os.path.join(os.path.dirname(__file__), 'images')
        self.test_image_path = os.path.join(self.images_dir, 'valid1.jpg')
        
        # Verify test image exists
        if not os.path.exists(self.test_image_path):
            self.skipTest(f"Test image not found: {self.test_image_path}")

    def test_image_loading_and_basic_properties(self):
        """Test that we can load the test image and it has expected properties."""
        # Load the image
        image = cv2.imread(self.test_image_path)
        
        self.assertIsNotNone(image, "Failed to load test image")
        self.assertEqual(len(image.shape), 3, "Image should have 3 dimensions (height, width, channels)")
        self.assertEqual(image.shape[2], 3, "Image should have 3 color channels")
        
        # Check that image is not empty
        self.assertGreater(image.shape[0], 0, "Image height should be greater than 0")
        self.assertGreater(image.shape[1], 0, "Image width should be greater than 0")
        
        # Check that image has reasonable size (not too small)
        self.assertGreater(image.shape[0], 100, "Image should be at least 100 pixels tall")
        self.assertGreater(image.shape[1], 100, "Image should be at least 100 pixels wide")

    def test_image_array_processing_workflow(self):
        """Test the complete workflow using image array (without file I/O)."""
        # Load the image
        image = cv2.imread(self.test_image_path)
        self.assertIsNotNone(image, "Failed to load test image")
        
        # Mock the components to avoid loading actual ML models
        with patch('compliance_checker.FaceAnalyzer') as mock_face_analyzer_class, \
             patch('compliance_checker.ImagePreprocessor') as mock_preprocessor_class, \
             patch('compliance_checker.PhotoValidator') as mock_validator_class:
            
            # Set up mocks
            mock_face_analyzer = Mock()
            mock_preprocessor = Mock()
            mock_validator = Mock()
            
            mock_face_analyzer_class.return_value = mock_face_analyzer
            mock_preprocessor_class.return_value = mock_preprocessor
            mock_validator_class.return_value = mock_validator
            
            # Mock successful face detection
            mock_face = Mock()
            mock_face.bbox = np.array([100, 100, 300, 400])  # Reasonable face bbox
            mock_face_analyzer.quick_check.return_value = [mock_face]
            
            # Mock successful preprocessing
            processed_image = np.zeros((self.config.FINAL_OUTPUT_HEIGHT_PX, 
                                      self.config.FINAL_OUTPUT_WIDTH_PX, 3), dtype=np.uint8)
            mock_face_data = Mock()
            preprocessing_logs = [("INFO", "Preprocessing", "Successfully processed image")]
            mock_preprocessor.process_image.return_value = (processed_image, mock_face_data, preprocessing_logs, True)
            
            # Mock successful validation
            validation_results = [
                ("PASS", "Head Pose", "Within acceptable range"),
                ("PASS", "Background", "Uniform and light"),
                ("PASS", "Face Size", "Appropriate size")
            ]
            mock_validator.validate_photo.return_value = validation_results
            
            # Create checker and run test
            checker = ComplianceChecker(model_name='buffalo_l')
            result = checker.check_image_array(image)
            
            # Verify result structure
            self.assertIsInstance(result, dict, "Result should be a dictionary")
            self.assertIn("success", result, "Result should contain 'success' field")
            self.assertIn("recommendation", result, "Result should contain 'recommendation' field")
            self.assertIn("logs", result, "Result should contain 'logs' field")
            
            # Verify successful processing
            self.assertTrue(result["success"], "Processing should be successful with mocked components")
            self.assertIn("LOOKS PROMISING", result["recommendation"], "Should get positive recommendation")
            
            # Verify logs structure
            self.assertIn("preprocessing", result["logs"], "Logs should contain preprocessing section")
            self.assertIn("validation", result["logs"], "Logs should contain validation section")
            
            # Verify that components were called with the actual image
            mock_face_analyzer.quick_check.assert_called_once()
            mock_preprocessor.process_image.assert_called_once()
            mock_validator.validate_photo.assert_called_once()

    def test_file_based_processing_workflow(self):
        """Test the complete workflow using file-based processing."""
        # Mock the components to avoid loading actual ML models
        with patch('compliance_checker.FaceAnalyzer') as mock_face_analyzer_class, \
             patch('compliance_checker.ImagePreprocessor') as mock_preprocessor_class, \
             patch('compliance_checker.PhotoValidator') as mock_validator_class:
            
            # Set up mocks similar to previous test
            mock_face_analyzer = Mock()
            mock_preprocessor = Mock()
            mock_validator = Mock()
            
            mock_face_analyzer_class.return_value = mock_face_analyzer
            mock_preprocessor_class.return_value = mock_preprocessor
            mock_validator_class.return_value = mock_validator
            
            # Mock successful workflow
            mock_face = Mock()
            mock_face.bbox = np.array([100, 100, 300, 400])
            mock_face_analyzer.quick_check.return_value = [mock_face]
            
            processed_image = np.zeros((self.config.FINAL_OUTPUT_HEIGHT_PX, 
                                      self.config.FINAL_OUTPUT_WIDTH_PX, 3), dtype=np.uint8)
            mock_face_data = Mock()
            preprocessing_logs = [("INFO", "Preprocessing", "Successfully processed image")]
            mock_preprocessor.process_image.return_value = (processed_image, mock_face_data, preprocessing_logs, True)
            
            validation_results = [("PASS", "Test", "All good")]
            mock_validator.validate_photo.return_value = validation_results
            
            # Create checker and run file-based test
            checker = ComplianceChecker(model_name='buffalo_l')
            result = checker.run_check(self.test_image_path)
            
            # Verify result structure
            self.assertIsInstance(result, dict, "Result should be a dictionary")
            self.assertIn("success", result, "Result should contain 'success' field")
            self.assertIn("recommendation", result, "Result should contain 'recommendation' field")
            self.assertIn("logs", result, "Result should contain 'logs' field")
            
            # Verify successful processing
            self.assertTrue(result["success"], "File-based processing should be successful")
            self.assertIn("LOOKS PROMISING", result["recommendation"], "Should get positive recommendation")

    def test_multiple_face_detection_scenario(self):
        """Test scenario where multiple faces are detected in the image."""
        image = cv2.imread(self.test_image_path)
        self.assertIsNotNone(image, "Failed to load test image")
        
        with patch('compliance_checker.FaceAnalyzer') as mock_face_analyzer_class, \
             patch('compliance_checker.ImagePreprocessor') as mock_preprocessor_class, \
             patch('compliance_checker.PhotoValidator') as mock_validator_class:
            
            mock_face_analyzer = Mock()
            mock_face_analyzer_class.return_value = mock_face_analyzer
            
            # Mock multiple faces detected
            mock_face1 = Mock()
            mock_face1.bbox = np.array([100, 100, 200, 200])
            mock_face2 = Mock()
            mock_face2.bbox = np.array([300, 300, 400, 400])
            mock_face_analyzer.quick_check.return_value = [mock_face1, mock_face2]
            
            checker = ComplianceChecker(model_name='buffalo_l')
            result = checker.check_image_array(image)
            
            # Should fail due to multiple faces
            self.assertFalse(result["success"], "Should fail when multiple faces detected")
            self.assertIn("Multiple faces detected", result["recommendation"], 
                         "Should indicate multiple faces in recommendation")

    def test_no_face_detection_scenario(self):
        """Test scenario where no face is detected in the image."""
        image = cv2.imread(self.test_image_path)
        self.assertIsNotNone(image, "Failed to load test image")
        
        with patch('compliance_checker.FaceAnalyzer') as mock_face_analyzer_class, \
             patch('compliance_checker.ImagePreprocessor') as mock_preprocessor_class, \
             patch('compliance_checker.PhotoValidator') as mock_validator_class:
            
            mock_face_analyzer = Mock()
            mock_face_analyzer_class.return_value = mock_face_analyzer
            
            # Mock no faces detected
            mock_face_analyzer.quick_check.return_value = []
            
            checker = ComplianceChecker(model_name='buffalo_l')
            result = checker.check_image_array(image)
            
            # Should fail due to no face
            self.assertFalse(result["success"], "Should fail when no face detected")
            self.assertIn("No face detected", result["recommendation"], 
                         "Should indicate no face in recommendation")

    def test_preprocessing_failure_scenario(self):
        """Test scenario where preprocessing fails."""
        image = cv2.imread(self.test_image_path)
        self.assertIsNotNone(image, "Failed to load test image")
        
        with patch('compliance_checker.FaceAnalyzer') as mock_face_analyzer_class, \
             patch('compliance_checker.ImagePreprocessor') as mock_preprocessor_class, \
             patch('compliance_checker.PhotoValidator') as mock_validator_class:
            
            mock_face_analyzer = Mock()
            mock_preprocessor = Mock()
            
            mock_face_analyzer_class.return_value = mock_face_analyzer
            mock_preprocessor_class.return_value = mock_preprocessor
            
            # Mock successful face detection but failed preprocessing
            mock_face = Mock()
            mock_face.bbox = np.array([100, 100, 300, 400])
            mock_face_analyzer.quick_check.return_value = [mock_face]
            
            # Mock preprocessing failure
            mock_preprocessor.process_image.return_value = (None, None, 
                                                          [("FAIL", "Preprocessing", "Failed to process")], False)
            
            checker = ComplianceChecker(model_name='buffalo_l')
            result = checker.check_image_array(image)
            
            # Should fail due to preprocessing failure
            self.assertFalse(result["success"], "Should fail when preprocessing fails")
            self.assertIn("Preprocessing failed", result["recommendation"], 
                         "Should indicate preprocessing failure in recommendation")

    def test_validation_failure_scenario(self):
        """Test scenario where validation finds critical issues."""
        image = cv2.imread(self.test_image_path)
        self.assertIsNotNone(image, "Failed to load test image")
        
        with patch('compliance_checker.FaceAnalyzer') as mock_face_analyzer_class, \
             patch('compliance_checker.ImagePreprocessor') as mock_preprocessor_class, \
             patch('compliance_checker.PhotoValidator') as mock_validator_class:
            
            mock_face_analyzer = Mock()
            mock_preprocessor = Mock()
            mock_validator = Mock()
            
            mock_face_analyzer_class.return_value = mock_face_analyzer
            mock_preprocessor_class.return_value = mock_preprocessor
            mock_validator_class.return_value = mock_validator
            
            # Mock successful face detection and preprocessing
            mock_face = Mock()
            mock_face.bbox = np.array([100, 100, 300, 400])
            mock_face_analyzer.quick_check.return_value = [mock_face]
            
            processed_image = np.zeros((self.config.FINAL_OUTPUT_HEIGHT_PX, 
                                      self.config.FINAL_OUTPUT_WIDTH_PX, 3), dtype=np.uint8)
            mock_face_data = Mock()
            preprocessing_logs = [("INFO", "Preprocessing", "Successfully processed image")]
            mock_preprocessor.process_image.return_value = (processed_image, mock_face_data, preprocessing_logs, True)
            
            # Mock validation failure
            validation_results = [
                ("FAIL", "Head Pose", "Too much rotation"),
                ("FAIL", "Background", "Too dark"),
                ("PASS", "Face Size", "Appropriate size")
            ]
            mock_validator.validate_photo.return_value = validation_results
            
            checker = ComplianceChecker(model_name='buffalo_l')
            result = checker.check_image_array(image)
            
            # Should fail due to validation issues
            self.assertFalse(result["success"], "Should fail when validation finds critical issues")
            self.assertIn("REJECTED: 2 critical issue(s) found", result["recommendation"], 
                         "Should indicate specific number of critical issues")

    def test_image_dimensions_and_config_consistency(self):
        """Test that the real image dimensions work with our configuration."""
        image = cv2.imread(self.test_image_path)
        self.assertIsNotNone(image, "Failed to load test image")
        
        height, width = image.shape[:2]
        
        # Test that image is large enough for processing
        self.assertGreater(height, self.config.FINAL_OUTPUT_HEIGHT_PX // 2, 
                          "Image should be large enough for processing")
        self.assertGreater(width, self.config.FINAL_OUTPUT_WIDTH_PX // 2, 
                          "Image should be large enough for processing")
        
        # Test aspect ratio calculations
        image_aspect_ratio = width / height
        target_aspect_ratio = self.config.TARGET_ASPECT_RATIO
        
        # The image doesn't need to match exactly, but should be reasonable
        self.assertGreater(image_aspect_ratio, 0.3, "Image aspect ratio should be reasonable")
        self.assertLess(image_aspect_ratio, 3.0, "Image aspect ratio should be reasonable")


if __name__ == '__main__':
    unittest.main() 