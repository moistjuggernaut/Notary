"""
Unit tests for the ComplianceChecker module.
Tests the complete orchestration workflow and API functionality.
"""

import unittest
import numpy as np
import cv2
import json
import base64
from unittest.mock import Mock, patch, MagicMock
from compliance_checker import ComplianceChecker
from lib.config import Config


class TestComplianceChecker(unittest.TestCase):
    """Test cases for the ComplianceChecker class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        # Patch the dependencies of ComplianceChecker
        with patch('compliance_checker.FaceAnalyzer') as MockFaceAnalyzer, \
             patch('compliance_checker.ImagePreprocessor') as MockImagePreprocessor, \
             patch('compliance_checker.PhotoValidator') as MockPhotoValidator:
            
            self.checker = ComplianceChecker(model_name='buffalo_m')
            
            # Assign mocks to instance attributes for manipulation in tests
            self.checker.face_analyzer = MockFaceAnalyzer.return_value
            self.checker.preprocessor = MockImagePreprocessor.return_value
            self.checker.validator = MockPhotoValidator.return_value
            
        self.test_image = np.random.randint(0, 255, (800, 600, 3), dtype=np.uint8)

    def test_initialization(self):
        """Test ComplianceChecker initialization."""
        self.assertIsNotNone(self.checker.face_analyzer)
        self.assertIsNotNone(self.checker.preprocessor)
        self.assertIsNotNone(self.checker.validator)
        self.assertIsInstance(self.checker.config, Config)

    def test_get_final_recommendation_pass(self):
        """Test _get_final_recommendation with all passing results."""
        validation_results = [("PASS", "Test 1", "All good")]
        recommendation = self.checker._get_final_recommendation(validation_results)
        self.assertEqual(recommendation, "LOOKS PROMISING: All primary checks passed.")

    def test_get_final_recommendation_warnings(self):
        """Test _get_final_recommendation with warnings."""
        validation_results = [("WARNING", "Test 2", "Minor issue")]
        recommendation = self.checker._get_final_recommendation(validation_results)
        self.assertEqual(recommendation, "NEEDS REVIEW: 1 warning(s) found.")

    def test_get_final_recommendation_failures(self):
        """Test _get_final_recommendation with failures."""
        validation_results = [("FAIL", "Test 3", "Major issue")]
        recommendation = self.checker._get_final_recommendation(validation_results)
        self.assertEqual(recommendation, "REJECTED: 1 critical issue(s) found.")

    @patch('cv2.imread')
    def test_run_check_image_load_failure(self, mock_imread):
        """Test run_check when image cannot be loaded."""
        mock_imread.return_value = None
        
        result = self.checker.run_check("nonexistent.jpg")
        
        self.assertFalse(result["success"])
        self.assertIn("REJECTED", result["recommendation"])
        self.assertIn("Could not load image", result["recommendation"])

    @patch('cv2.imread')
    def test_run_check_no_face_detected(self, mock_imread):
        """Test run_check when no face is detected in quick check."""
        mock_imread.return_value = self.test_image
        self.checker.face_analyzer.quick_check.return_value = []
        
        result = self.checker.run_check("test.jpg")
        
        self.assertFalse(result["success"])
        self.assertIn("No face detected", result["recommendation"])

    @patch('cv2.imread')
    def test_run_check_multiple_faces_detected(self, mock_imread):
        """Test run_check when multiple faces are detected."""
        mock_imread.return_value = self.test_image
        self.checker.face_analyzer.quick_check.return_value = [Mock(), Mock()]
        
        result = self.checker.run_check("test.jpg")
        
        self.assertFalse(result["success"])
        self.assertIn("Multiple faces detected", result["recommendation"])

    @patch('cv2.imread')
    def test_run_check_preprocessing_failure(self, mock_imread):
        """Test run_check when preprocessing fails."""
        mock_imread.return_value = self.test_image
        self.checker.face_analyzer.quick_check.return_value = [Mock()]
        self.checker.preprocessor.process_image.return_value = (None, None, [], False)
        
        result = self.checker.run_check("test.jpg")
        
        self.assertFalse(result["success"])
        self.assertIn("Preprocessing failed", result["recommendation"])

    @patch('cv2.imread')
    @patch('cv2.imwrite')
    def test_run_check_success_with_output(self, mock_imwrite, mock_imread):
        """Test successful run_check with output file saving."""
        mock_imread.return_value = self.test_image
        mock_imwrite.return_value = True
        
        # Mock successful workflow
        self.checker.face_analyzer.quick_check.return_value = [Mock()]
        processed_image = np.zeros((100, 100, 3), dtype=np.uint8)
        self.checker.preprocessor.process_image.return_value = (processed_image, Mock(), [], True)
        self.checker.validator.validate_photo.return_value = [("PASS", "Test", "OK")]
        
        result = self.checker.run_check("test.jpg", "output.jpg")
        
        self.assertTrue(result["success"])
        self.assertIn("LOOKS PROMISING", result["recommendation"])
        self.assertIn("output_path", result)
        mock_imwrite.assert_called_once()

    @patch('cv2.imread')
    def test_run_check_validation_failure(self, mock_imread):
        """Test run_check when validation finds critical issues."""
        mock_imread.return_value = self.test_image
        
        # Mock successful preprocessing but failed validation
        self.checker.face_analyzer.quick_check.return_value = [Mock()]
        processed_image = np.zeros((100, 100, 3), dtype=np.uint8)
        self.checker.preprocessor.process_image.return_value = (processed_image, Mock(), [], True)
        self.checker.validator.validate_photo.return_value = [
            ("FAIL", "Head Pose", "Too much rotation"),
            ("FAIL", "Background", "Too dark")
        ]
        
        result = self.checker.run_check("test.jpg")
        
        self.assertFalse(result["success"])
        self.assertIn("REJECTED: 2 critical issue(s) found", result["recommendation"])

    def test_check_image_array_none_input(self):
        """Test check_image_array with None input."""
        result = self.checker.check_image_array(None)
        
        self.assertFalse(result["success"])
        self.assertIn("Invalid image data", result["recommendation"])
        self.assertIn("error", result)

    def test_check_image_array_no_face(self):
        """Test check_image_array when no face is detected."""
        self.checker.face_analyzer.quick_check.return_value = []
        
        result = self.checker.check_image_array(self.test_image)
        
        self.assertFalse(result["success"])
        self.assertIn("No face detected", result["recommendation"])

    def test_check_image_array_success(self):
        """Test successful check_image_array workflow."""
        # Mock successful workflow
        self.checker.face_analyzer.quick_check.return_value = [Mock()]
        processed_image = np.zeros((100, 100, 3), dtype=np.uint8)
        self.checker.preprocessor.process_image.return_value = (processed_image, Mock(), [], True)
        self.checker.validator.validate_photo.return_value = [("PASS", "Test", "OK")]
        
        result = self.checker.check_image_array(self.test_image)
        
        self.assertTrue(result["success"])
        self.assertIn("LOOKS PROMISING", result["recommendation"])
        self.assertIn("processed_image", result)

    def test_check_image_array_preprocessing_failure(self):
        """Test check_image_array when preprocessing fails."""
        self.checker.face_analyzer.quick_check.return_value = [Mock()]
        self.checker.preprocessor.process_image.return_value = (None, None, [], False)
        
        result = self.checker.check_image_array(self.test_image)

        self.assertFalse(result["success"])
        self.assertIn("Preprocessing failed", result["recommendation"])

    @patch('builtins.print')
    def test_print_summary(self, mock_print):
        """Test _print_summary method (output goes to stdout)."""
        logs = {"preprocessing": [("PASS", "Step1", "OK")], "validation": [("FAIL", "Check1", "Bad")]}
        recommendation = "Test recommendation"
        self.checker._print_summary("test.jpg", logs, recommendation)
        mock_print.assert_called()

    @patch('gcp-api.compliance_checker.FaceAnalyzer')
    def test_check_image_array_multiple_faces(self, MockFaceAnalyzer):
        """Test full check with multiple faces detected."""
        checker = ComplianceChecker(model_name='buffalo_m')

        # Mock the analyzer to return multiple faces
        MockFaceAnalyzer.return_value.quick_check.return_value = [Mock(), Mock()]

        result = checker.check_image_array(self.test_image)

        self.assertFalse(result["success"])
        self.assertIn("Multiple faces detected", result["recommendation"])


class TestComplianceCheckerIntegration(unittest.TestCase):
    """
    Limited integration tests that mock the ML model loading within FaceAnalyzer.
    """
    @patch('lib.face_analyzer.FaceAnalysis')
    def test_end_to_end_workflow_structure(self, mock_face_analysis):
        """
        Test that a complete run produces the expected output structure.
        """
        img = np.full((700, 600, 3), 220, dtype=np.uint8)
        mock_face = Mock()
        mock_face.bbox = np.array([100, 150, 500, 650])
        mock_face.pose = np.array([0, 0, 0])
        landmarks = np.zeros((106, 2)); landmarks[16] = [300, 600]
        mock_face.landmark_2d_106 = landmarks
        mock_face_analysis.return_value.get.return_value = [mock_face]
        
        checker = ComplianceChecker(model_name='buffalo_m')
        result = checker.check_image_array(img)
        
        self.assertIn("success", result)
        self.assertIn("recommendation", result)
        self.assertIn("logs", result)
        self.assertIn("processed_image", result)

    @patch('lib.face_analyzer.FaceAnalysis')
    def test_workflow_logging_structure(self, mock_face_analysis):
        """
        Test that the logs from all modules are correctly aggregated.
        """
        img = np.full((700, 600, 3), 220, dtype=np.uint8)
        mock_face = Mock()
        mock_face.bbox = np.array([100, 150, 500, 650])
        mock_face.pose = np.array([0, 0, 0])
        landmarks = np.zeros((106, 2)); landmarks[16] = [300, 600]
        mock_face.landmark_2d_106 = landmarks
        mock_face_analysis.return_value.get.return_value = [mock_face]
        
        checker = ComplianceChecker(model_name='buffalo_m')
        result = checker.check_image_array(img)
        
        self.assertIn("preprocessing", result["logs"])
        self.assertIn("validation", result["logs"])
        self.assertGreater(len(result["logs"]["validation"]), 0)


if __name__ == '__main__':
    unittest.main() 