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
from compliance_checker import ComplianceChecker, handler
from config import Config


class TestComplianceChecker(unittest.TestCase):
    """Test cases for the ComplianceChecker class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        # Mock all components to avoid loading actual models
        with patch('compliance_checker.FaceAnalyzer'), \
             patch('compliance_checker.ImagePreprocessor'), \
             patch('compliance_checker.PhotoValidator'):
            
            self.checker = ComplianceChecker(model_name='buffalo_l')
            
            # Set up mocks
            self.checker.face_analyzer = Mock()
            self.checker.preprocessor = Mock()
            self.checker.validator = Mock()
            
        # Create test image
        self.test_image = np.random.randint(0, 255, (800, 600, 3), dtype=np.uint8)

    def test_initialization(self):
        """Test ComplianceChecker initialization."""
        self.assertIsNotNone(self.checker.face_analyzer)
        self.assertIsNotNone(self.checker.preprocessor)
        self.assertIsNotNone(self.checker.validator)
        self.assertIsInstance(self.checker.config, Config)

    def test_get_final_recommendation_pass(self):
        """Test _get_final_recommendation with all passing results."""
        validation_results = [
            ("PASS", "Test 1", "All good"),
            ("PASS", "Test 2", "All good"),
            ("PASS", "Test 3", "All good")
        ]
        
        recommendation = self.checker._get_final_recommendation(validation_results)
        self.assertEqual(recommendation, "LOOKS PROMISING: All primary checks passed.")

    def test_get_final_recommendation_warnings(self):
        """Test _get_final_recommendation with warnings."""
        validation_results = [
            ("PASS", "Test 1", "All good"),
            ("WARNING", "Test 2", "Minor issue"),
            ("PASS", "Test 3", "All good")
        ]
        
        recommendation = self.checker._get_final_recommendation(validation_results)
        self.assertEqual(recommendation, "NEEDS REVIEW: 1 warning(s) found.")

    def test_get_final_recommendation_failures(self):
        """Test _get_final_recommendation with failures."""
        validation_results = [
            ("PASS", "Test 1", "All good"),
            ("FAIL", "Test 2", "Major issue"),
            ("FAIL", "Test 3", "Another issue")
        ]
        
        recommendation = self.checker._get_final_recommendation(validation_results)
        self.assertEqual(recommendation, "REJECTED: 2 critical issue(s) found.")

    def test_get_final_recommendation_mixed(self):
        """Test _get_final_recommendation with mixed results (failures take precedence)."""
        validation_results = [
            ("PASS", "Test 1", "All good"),
            ("WARNING", "Test 2", "Minor issue"),
            ("FAIL", "Test 3", "Major issue")
        ]
        
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

    def test_print_summary(self):
        """Test _print_summary method (output goes to stdout)."""
        logs = {
            "preprocessing": [("INFO", "Step1", "Message1")],
            "validation": [("PASS", "Check1", "Result1")]
        }
        recommendation = "Test recommendation"
        
        # Just verify it doesn't crash - output goes to stdout
        try:
            self.checker._print_summary("test.jpg", logs, recommendation)
        except Exception as e:
            self.fail(f"_print_summary raised an exception: {e}")


class TestComplianceCheckerHandler(unittest.TestCase):
    """Test cases for the serverless handler function."""

    def setUp(self):
        """Set up test fixtures for handler tests."""
        # Create mock request and response objects
        self.mock_request = Mock()
        self.mock_response = Mock()
        self.mock_response.headers = {}
        
        # Create test image data
        test_image = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        _, buffer = cv2.imencode('.jpg', test_image)
        self.test_image_b64 = base64.b64encode(buffer).decode('utf-8')

    def test_handler_options_request(self):
        """Test handler with OPTIONS request (CORS preflight)."""
        self.mock_request.method = 'OPTIONS'
        
        result = handler(self.mock_request, self.mock_response)
        
        # Should return the response object for OPTIONS
        self.assertEqual(result, self.mock_response)
        
        # Should set CORS headers
        expected_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
        for key, value in expected_headers.items():
            self.assertIn(key, self.mock_response.headers)
            self.assertEqual(self.mock_response.headers[key], value)

    def test_handler_invalid_method(self):
        """Test handler with invalid HTTP method."""
        self.mock_request.method = 'GET'
        
        result = handler(self.mock_request, self.mock_response)
        
        self.assertEqual(self.mock_response.status_code, 405)
        result_data = json.loads(result)
        self.assertIn("Method not allowed", result_data["error"])

    def test_handler_missing_image_field(self):
        """Test handler with missing image field in request body."""
        self.mock_request.method = 'POST'
        self.mock_request.get_json.return_value = {"filename": "test.jpg"}  # Missing 'image'
        
        result = handler(self.mock_request, self.mock_response)
        
        self.assertEqual(self.mock_response.status_code, 400)
        result_data = json.loads(result)
        self.assertIn("Missing 'image' field", result_data["error"])

    def test_handler_invalid_json(self):
        """Test handler with invalid JSON in request body."""
        self.mock_request.method = 'POST'
        self.mock_request.get_json.return_value = None
        
        result = handler(self.mock_request, self.mock_response)
        
        self.assertEqual(self.mock_response.status_code, 400)
        result_data = json.loads(result)
        self.assertIn("Missing 'image' field", result_data["error"])

    def test_handler_invalid_base64(self):
        """Test handler with invalid base64 image data."""
        self.mock_request.method = 'POST'
        self.mock_request.get_json.return_value = {"image": "invalid_base64!@#"}
        
        result = handler(self.mock_request, self.mock_response)
        
        self.assertEqual(self.mock_response.status_code, 400)
        result_data = json.loads(result)
        self.assertIn("Invalid base64 image data", result_data["error"])

    def test_handler_invalid_image_data(self):
        """Test handler with base64 data that doesn't decode to valid image."""
        self.mock_request.method = 'POST'
        # Valid base64 but not valid image data
        invalid_image_b64 = base64.b64encode(b"not an image").decode('utf-8')
        self.mock_request.get_json.return_value = {"image": invalid_image_b64}
        
        result = handler(self.mock_request, self.mock_response)
        
        self.assertEqual(self.mock_response.status_code, 400)
        result_data = json.loads(result)
        self.assertIn("Could not decode image data", result_data["error"])

    @patch('compliance_checker.ComplianceChecker')
    def test_handler_success(self, mock_compliance_checker_class):
        """Test successful handler execution."""
        self.mock_request.method = 'POST'
        self.mock_request.get_json.return_value = {"image": self.test_image_b64}
        
        # Mock ComplianceChecker
        mock_checker = Mock()
        mock_compliance_checker_class.return_value = mock_checker
        mock_checker.check_image_array.return_value = {
            "success": True,
            "recommendation": "LOOKS PROMISING",
            "logs": {"preprocessing": [], "validation": []},
            "processed_image": "base64_processed_image_data"
        }
        
        result = handler(self.mock_request, self.mock_response)
        
        self.assertEqual(self.mock_response.status_code, 200)
        result_data = json.loads(result)
        
        self.assertTrue(result_data["success"])
        self.assertEqual(result_data["recommendation"], "LOOKS PROMISING")
        self.assertIn("logs", result_data)
        self.assertIn("processed_image", result_data)

    @patch('compliance_checker.ComplianceChecker')
    def test_handler_validation_failure(self, mock_compliance_checker_class):
        """Test handler when validation fails."""
        self.mock_request.method = 'POST'
        self.mock_request.get_json.return_value = {"image": self.test_image_b64}
        
        # Mock ComplianceChecker with failure
        mock_checker = Mock()
        mock_compliance_checker_class.return_value = mock_checker
        mock_checker.check_image_array.return_value = {
            "success": False,
            "recommendation": "REJECTED: 1 critical issue(s) found.",
            "logs": {"preprocessing": [], "validation": [("FAIL", "Test", "Failed")]}
        }
        
        result = handler(self.mock_request, self.mock_response)
        
        self.assertEqual(self.mock_response.status_code, 200)
        result_data = json.loads(result)
        
        self.assertFalse(result_data["success"])
        self.assertIn("REJECTED", result_data["recommendation"])

    @patch('compliance_checker.ComplianceChecker')
    def test_handler_internal_error(self, mock_compliance_checker_class):
        """Test handler when internal error occurs."""
        self.mock_request.method = 'POST'
        self.mock_request.get_json.return_value = {"image": self.test_image_b64}
        
        # Mock ComplianceChecker to raise exception
        mock_compliance_checker_class.side_effect = Exception("Internal error")
        
        result = handler(self.mock_request, self.mock_response)
        
        self.assertEqual(self.mock_response.status_code, 500)
        result_data = json.loads(result)
        self.assertIn("Internal server error", result_data["error"])

    def test_handler_cors_headers_always_set(self):
        """Test that CORS headers are always set regardless of request type."""
        self.mock_request.method = 'POST'
        self.mock_request.get_json.return_value = {}  # Will cause 400 error
        
        handler(self.mock_request, self.mock_response)
        
        # CORS headers should be set even on error
        expected_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
        for key, value in expected_headers.items():
            self.assertIn(key, self.mock_response.headers)


class TestComplianceCheckerIntegration(unittest.TestCase):
    """Integration tests for ComplianceChecker (more realistic scenarios)."""
    
    def test_end_to_end_workflow_structure(self):
        """Test that the end-to-end workflow follows the expected structure."""
        # This test verifies the workflow structure without mocking everything
        with patch('compliance_checker.FaceAnalyzer'), \
             patch('compliance_checker.ImagePreprocessor'), \
             patch('compliance_checker.PhotoValidator'):
            
            checker = ComplianceChecker()
            
            # Verify all components are initialized
            self.assertIsNotNone(checker.face_analyzer)
            self.assertIsNotNone(checker.preprocessor)
            self.assertIsNotNone(checker.validator)
            self.assertIsNotNone(checker.config)
    
    def test_workflow_logging_structure(self):
        """Test that workflow produces properly structured logs."""
        with patch('compliance_checker.FaceAnalyzer'), \
             patch('compliance_checker.ImagePreprocessor'), \
             patch('compliance_checker.PhotoValidator'):
            
            checker = ComplianceChecker()
            
            # Mock components for successful workflow
            checker.face_analyzer.quick_check.return_value = [Mock()]
            checker.preprocessor.process_image.return_value = (
                np.zeros((100, 100, 3), dtype=np.uint8), 
                Mock(), 
                [("INFO", "Preprocessing", "Test message")], 
                True
            )
            checker.validator.validate_photo.return_value = [
                ("PASS", "Test Check", "Passed")
            ]
            
            # Test with dummy image
            test_image = np.zeros((100, 100, 3), dtype=np.uint8)
            result = checker.check_image_array(test_image)
            
            # Verify log structure
            self.assertIn("logs", result)
            self.assertIn("preprocessing", result["logs"])
            self.assertIn("validation", result["logs"])
            
            # Verify all log entries have proper structure
            for log_type in ["preprocessing", "validation"]:
                for log_entry in result["logs"][log_type]:
                    self.assertIsInstance(log_entry, tuple)
                    self.assertEqual(len(log_entry), 3)
                    self.assertIsInstance(log_entry[0], str)  # Status
                    self.assertIsInstance(log_entry[1], str)  # Step/Check name
                    self.assertIsInstance(log_entry[2], str)  # Message


if __name__ == '__main__':
    unittest.main() 