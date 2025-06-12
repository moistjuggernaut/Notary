"""
Unit tests for the PhotoValidator module.
Tests ICAO compliance validation including pose, eye detection, red-eye, and quality checks.
"""

import unittest
import numpy as np
import cv2
from unittest.mock import Mock, patch
from lib.photo_validator import PhotoValidator
from lib.config import Config


class TestPhotoValidator(unittest.TestCase):
    """Test cases for the PhotoValidator class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.validator = PhotoValidator()
        self.config = Config()
        
        # Create a standard test image
        self.test_image = np.zeros((self.config.FINAL_OUTPUT_HEIGHT_PX, 
                                  self.config.FINAL_OUTPUT_WIDTH_PX, 3), dtype=np.uint8)
        self.test_image.fill(220)  # Light gray background
        
        # Create mock face data
        self.mock_face_data = Mock()
        self.mock_face_data.bbox = np.array([200, 150, 600, 700])  # x1, y1, x2, y2
        self.mock_face_data.pose = np.array([2.0, -1.5, 3.0])  # yaw, pitch, roll
        
        # Create mock landmarks (simplified 106-point structure)
        landmarks = np.zeros((106, 2), dtype=np.float32)
        # Set some key landmarks for testing
        landmarks[16] = [400, 650]  # Chin (CHIN_LANDMARK_INDEX = 16)
        landmarks[35] = [350, 300]  # Left pupil approx
        landmarks[74] = [450, 300]  # Right pupil approx
        
        # Set left eye landmarks for EAR calculation
        landmarks[35] = [330, 300]  # Point 0 of left eye
        landmarks[36] = [340, 295]  # Point 1 of left eye  
        landmarks[33] = [350, 300]  # Point 2 of left eye
        landmarks[37] = [340, 305]  # Point 3 of left eye
        landmarks[39] = [345, 295]  # Point 4 of left eye
        landmarks[42] = [345, 305]  # Point 5 of left eye
        
        # Set right eye landmarks for EAR calculation
        landmarks[74] = [470, 300]  # Point 0 of right eye
        landmarks[93] = [460, 295]  # Point 1 of right eye
        landmarks[90] = [450, 300]  # Point 2 of right eye
        landmarks[94] = [460, 305]  # Point 3 of right eye
        landmarks[96] = [455, 295]  # Point 4 of right eye
        landmarks[97] = [455, 305]  # Point 5 of right eye
        
        self.mock_face_data.landmark_2d_106 = landmarks

    def test_initialization(self):
        """Test PhotoValidator initialization."""
        validator = PhotoValidator()
        self.assertIsInstance(validator.config, Config)

    def test_get_distance(self):
        """Test _get_distance helper method."""
        p1 = np.array([0, 0])
        p2 = np.array([3, 4])
        distance = self.validator._get_distance(p1, p2)
        self.assertEqual(distance, 5.0)  # 3-4-5 triangle

    def test_get_eye_aspect_ratio(self):
        """Test _get_eye_aspect_ratio calculation."""
        # Create eye landmarks in a realistic configuration
        eye_landmarks = np.array([
            [100, 200],  # Corner
            [110, 195],  # Top
            [120, 200],  # Corner
            [110, 205],  # Bottom
            [105, 195],  # Top
            [105, 205],  # Bottom
        ], dtype=np.float32)
        
        ear = self.validator._get_eye_aspect_ratio(eye_landmarks)
        self.assertIsInstance(ear, float)
        self.assertGreater(ear, 0)

    def test_validate_photo_no_face_data(self):
        """Test validation when face_data is None."""
        results = self.validator.validate_photo(self.test_image, None)
        
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0][0], "FAIL")
        self.assertEqual(results[0][1], "Face Data")
        self.assertIn("No valid face data", results[0][2])

    def test_validate_photo_no_landmarks(self):
        """Test validation when landmarks are missing."""
        self.mock_face_data.landmark_2d_106 = None
        results = self.validator.validate_photo(self.test_image, self.mock_face_data)
        
        # Should have pose results but fail on landmarks
        has_landmark_fail = any(result[1] == "Landmarks" and result[0] == "FAIL" for result in results)
        self.assertTrue(has_landmark_fail)

    def test_head_pose_validation_pass(self):
        """Test head pose validation with good pose."""
        self.mock_face_data.pose = np.array([5.0, -3.0, 2.0])  # Within tolerances
        results = self.validator.validate_photo(self.test_image, self.mock_face_data)
        
        # Find pose results
        pose_results = [r for r in results if "Head Pose" in r[1]]
        self.assertEqual(len(pose_results), 3)  # Yaw, Pitch, Roll
        
        for result in pose_results:
            self.assertEqual(result[0], "PASS")

    def test_head_pose_validation_fail(self):
        """Test head pose validation with bad pose."""
        self.mock_face_data.pose = np.array([15.0, -12.0, 10.0])  # Outside tolerances
        results = self.validator.validate_photo(self.test_image, self.mock_face_data)
        
        # Find pose results
        pose_results = [r for r in results if "Head Pose" in r[1]]
        self.assertEqual(len(pose_results), 3)
        
        for result in pose_results:
            self.assertEqual(result[0], "FAIL")

    def test_head_pose_no_pose_data(self):
        """Test head pose validation when pose data is missing."""
        self.mock_face_data.pose = None
        results = self.validator.validate_photo(self.test_image, self.mock_face_data)
        
        # Should have one "UNKNOWN" result for pose
        pose_results = [r for r in results if "Head Pose" in r[1]]
        self.assertEqual(len(pose_results), 1)
        self.assertEqual(pose_results[0][0], "UNKNOWN")

    def test_chin_to_crown_ratio_pass(self):
        """Test chin-to-crown ratio validation with good ratio."""
        # Adjust landmarks to create good ratio
        chin_y = 700
        crown_y = 200
        self.mock_face_data.landmark_2d_106[16] = [400, chin_y]  # Chin
        self.mock_face_data.bbox = np.array([200, crown_y, 600, 750])  # Crown at y=200
        
        results = self.validator.validate_photo(self.test_image, self.mock_face_data)
        
        ratio_result = next(r for r in results if "Chin-to-Crown Ratio" in r[1])
        self.assertEqual(ratio_result[0], "PASS")

    def test_chin_to_crown_ratio_fail(self):
        """Test chin-to-crown ratio validation with bad ratio."""
        # Create a ratio that's too small
        chin_y = 300
        crown_y = 250
        self.mock_face_data.landmark_2d_106[16] = [400, chin_y]  # Chin
        self.mock_face_data.bbox = np.array([200, crown_y, 600, 350])  # Crown
        
        results = self.validator.validate_photo(self.test_image, self.mock_face_data)
        
        ratio_result = next(r for r in results if "Chin-to-Crown Ratio" in r[1])
        self.assertEqual(ratio_result[0], "FAIL")

    def test_eyes_open_validation_pass(self):
        """Test eyes open validation when eyes appear open."""
        # Set up landmarks for wide-open eyes (high EAR)
        landmarks = self.mock_face_data.landmark_2d_106.copy()
        
        # Left eye with good EAR
        landmarks[35] = [330, 300]  # Corner
        landmarks[36] = [340, 290]  # Top (wider opening)
        landmarks[33] = [350, 300]  # Corner  
        landmarks[37] = [340, 310]  # Bottom (wider opening)
        landmarks[39] = [345, 290]  # Top
        landmarks[42] = [345, 310]  # Bottom
        
        # Right eye with good EAR
        landmarks[74] = [470, 300]  # Corner
        landmarks[93] = [460, 290]  # Top (wider opening)
        landmarks[90] = [450, 300]  # Corner
        landmarks[94] = [460, 310]  # Bottom (wider opening)
        landmarks[96] = [455, 290]  # Top
        landmarks[97] = [455, 310]  # Bottom
        
        self.mock_face_data.landmark_2d_106 = landmarks
        
        results = self.validator.validate_photo(self.test_image, self.mock_face_data)
        
        eyes_result = next(r for r in results if "Eyes Open" in r[1])
        self.assertEqual(eyes_result[0], "PASS")

    def test_eyes_open_validation_warning(self):
        """Test eyes open validation when eyes appear closed (should be WARNING for babies)."""
        # Set up landmarks for closed eyes (low EAR)
        landmarks = self.mock_face_data.landmark_2d_106.copy()
        
        # Both eyes with very similar top/bottom coordinates (closed)
        for eye_landmarks in [self.config.LEFT_EYE_LANDMARKS, self.config.RIGHT_EYE_LANDMARKS]:
            base_y = 300
            base_x = 340 if eye_landmarks == self.config.LEFT_EYE_LANDMARKS else 460
            
            for i, idx in enumerate(eye_landmarks):
                landmarks[idx] = [base_x + i * 2, base_y]  # All at same height (closed)
        
        self.mock_face_data.landmark_2d_106 = landmarks
        
        results = self.validator.validate_photo(self.test_image, self.mock_face_data)
        
        eyes_result = next(r for r in results if "Eyes Open" in r[1])
        self.assertEqual(eyes_result[0], "WARNING")
        self.assertIn("infants under 6 months", eyes_result[2])

    def test_red_eye_validation_pass(self):
        """Test red-eye validation when no red-eye is detected."""
        # Create image with normal colored pupils
        test_image = self.test_image.copy()
        
        # Add dark pupils at landmark positions
        left_pupil = self.mock_face_data.landmark_2d_106[35].astype(int)
        right_pupil = self.mock_face_data.landmark_2d_106[74].astype(int)
        
        cv2.circle(test_image, tuple(left_pupil), 10, (50, 50, 50), -1)  # Dark pupil
        cv2.circle(test_image, tuple(right_pupil), 10, (50, 50, 50), -1)  # Dark pupil
        
        results = self.validator.validate_photo(test_image, self.mock_face_data)
        
        red_eye_results = [r for r in results if "Red-Eye" in r[1]]
        self.assertEqual(len(red_eye_results), 2)  # Left and right
        
        for result in red_eye_results:
            self.assertEqual(result[0], "PASS")

    def test_red_eye_validation_fail(self):
        """Test red-eye validation when red-eye is detected."""
        # Create image with red pupils
        test_image = self.test_image.copy()
        
        # Add bright red pupils
        left_pupil = self.mock_face_data.landmark_2d_106[35].astype(int)
        right_pupil = self.mock_face_data.landmark_2d_106[74].astype(int)
        
        cv2.circle(test_image, tuple(left_pupil), 15, (0, 0, 255), -1)  # Bright red
        cv2.circle(test_image, tuple(right_pupil), 15, (0, 0, 255), -1)  # Bright red
        
        results = self.validator.validate_photo(test_image, self.mock_face_data)
        
        red_eye_results = [r for r in results if "Red-Eye" in r[1]]
        
        # At least one should fail due to red pixels
        fail_count = sum(1 for r in red_eye_results if r[0] == "FAIL")
        self.assertGreater(fail_count, 0)

    def test_sharpness_validation(self):
        """Test sharpness validation using Laplacian variance."""
        # Create a sharp image with edges
        test_image = np.zeros_like(self.test_image)
        face_bbox = self.mock_face_data.bbox
        face_region = test_image[face_bbox[1]:face_bbox[3], face_bbox[0]:face_bbox[2]]
        
        # Add sharp edges
        face_region[::10, :] = 255  # Horizontal lines for sharpness
        
        results = self.validator.validate_photo(test_image, self.mock_face_data)
        
        sharpness_result = next(r for r in results if "Sharpness" in r[1])
        # With sharp edges, should pass
        self.assertEqual(sharpness_result[0], "PASS")

    def test_background_validation_pass(self):
        """Test background validation with good background."""
        # Create image with uniform light background
        test_image = np.full_like(self.test_image, 200)  # Light uniform background
        
        # Darken face area to create contrast
        face_bbox = self.mock_face_data.bbox
        test_image[face_bbox[1]:face_bbox[3], face_bbox[0]:face_bbox[2]] = 120
        
        results = self.validator.validate_photo(test_image, self.mock_face_data)
        
        bg_result = next(r for r in results if "Final Background" in r[1])
        self.assertEqual(bg_result[0], "PASS")

    def test_background_validation_fail(self):
        """Test background validation with bad background."""
        # Create image with dark background
        test_image = np.full_like(self.test_image, 50)  # Dark background
        
        results = self.validator.validate_photo(test_image, self.mock_face_data)
        
        bg_result = next(r for r in results if "Final Background" in r[1])
        self.assertEqual(bg_result[0], "FAIL")
        self.assertIn("too dark", bg_result[2])

    def test_contrast_validation_good(self):
        """Test contrast validation with good face-background contrast."""
        # Create image with good contrast
        test_image = np.full_like(self.test_image, 200)  # Light background
        
        # Darker face
        face_bbox = self.mock_face_data.bbox
        test_image[face_bbox[1]:face_bbox[3], face_bbox[0]:face_bbox[2]] = 120
        
        results = self.validator.validate_photo(test_image, self.mock_face_data)
        
        contrast_result = next(r for r in results if "Contrast" in r[1])
        self.assertEqual(contrast_result[0], "PASS")

    def test_contrast_validation_poor(self):
        """Test contrast validation with poor face-background contrast."""
        # Create image with poor contrast
        test_image = np.full_like(self.test_image, 150)  # Medium background
        
        # Similar face brightness
        face_bbox = self.mock_face_data.bbox
        test_image[face_bbox[1]:face_bbox[3], face_bbox[0]:face_bbox[2]] = 140
        
        results = self.validator.validate_photo(test_image, self.mock_face_data)
        
        contrast_result = next(r for r in results if "Contrast" in r[1])
        self.assertEqual(contrast_result[0], "WARNING")

    def test_validate_red_eye_invalid_roi(self):
        """Test red-eye validation when ROI cannot be created."""
        # Test with pupil landmark outside image bounds
        invalid_landmark = np.array([self.test_image.shape[1] + 100, self.test_image.shape[0] + 100])
        
        status, message = self.validator._validate_red_eye(self.test_image, invalid_landmark)
        
        self.assertEqual(status, "PASS")
        self.assertIn("Could not create pupil ROI", message)

    def test_validation_results_structure(self):
        """Test that validation results have correct structure."""
        results = self.validator.validate_photo(self.test_image, self.mock_face_data)
        
        # All results should be tuples of (status, check_name, message)
        for result in results:
            self.assertIsInstance(result, tuple)
            self.assertEqual(len(result), 3)
            self.assertIn(result[0], ["PASS", "FAIL", "WARNING", "UNKNOWN", "INFO"])
            self.assertIsInstance(result[1], str)
            self.assertIsInstance(result[2], str)

    def test_complete_validation_workflow(self):
        """Test complete validation workflow with valid face data."""
        results = self.validator.validate_photo(self.test_image, self.mock_face_data)
        
        # Should have results for all checks
        expected_checks = [
            "Head Pose - Yaw", "Head Pose - Pitch", "Head Pose - Roll",
            "Chin-to-Crown Ratio", "Eyes Open", 
            "Left Eye Red-Eye", "Right Eye Red-Eye",
            "Sharpness", "Final Background", "Face-Background Contrast"
        ]
        
        result_checks = [r[1] for r in results]
        
        for expected_check in expected_checks:
            self.assertIn(expected_check, result_checks)


if __name__ == '__main__':
    unittest.main() 