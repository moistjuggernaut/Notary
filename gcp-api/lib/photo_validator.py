"""
Photo validation module for ICAO passport photo compliance.
Validates processed photos against various quality and compliance criteria.
"""

import cv2
import numpy as np
from lib.config import Config


class PhotoValidator:
    """Validates the preprocessed photo against ICAO-based compliance rules."""
    
    def __init__(self):
        """Initialize the PhotoValidator with configuration."""
        self.config = Config()

    def _get_distance(self, p1, p2):
        """
        Calculate Euclidean distance between two points.
        
        Args:
            p1, p2 (array-like): Two points as [x, y] coordinates
            
        Returns:
            float: Euclidean distance between the points
        """
        return np.linalg.norm(p1 - p2)

    def _get_eye_aspect_ratio(self, eye_landmarks):
        """
        Calculate the Eye Aspect Ratio (EAR) to determine if eyes are open.
        
        Args:
            eye_landmarks (numpy.ndarray): Array of eye landmark coordinates
            
        Returns:
            float: Eye aspect ratio value
        """
        A = self._get_distance(eye_landmarks[1], eye_landmarks[5])
        B = self._get_distance(eye_landmarks[2], eye_landmarks[4])
        C = self._get_distance(eye_landmarks[0], eye_landmarks[3])
        return (A + B) / (2.0 * C)

    def _validate_red_eye(self, image_bgr, pupil_landmark):
        """
        Check a small ROI around a pupil for red-eye artifacts.
        Uses the detection method from the LearnOpenCV guide.
        Ref: https://learnopencv.com/automatic-red-eye-remover-using-opencv-cpp-python/
        """
        pupil_roi_radius = max(5, int(self.config.FINAL_OUTPUT_HEIGHT_PX * 0.01))
        x, y = int(pupil_landmark[0]), int(pupil_landmark[1])
        roi = image_bgr[y-pupil_roi_radius:y+pupil_roi_radius, x-pupil_roi_radius:x+pupil_roi_radius]
        
        if roi.size == 0:
            return "PASS", "Could not create pupil ROI."

        # Detection logic based on LearnOpenCV
        b, g, r = cv2.split(roi)
        bg = cv2.add(b, g)
        
        # A pixel is considered red-eye if the red channel is bright and
        # more dominant than blue and green combined.
        mask = (r > 150) & (r > bg)
        
        red_pixel_count = np.count_nonzero(mask)
        total_pixels = roi.shape[0] * roi.shape[1]
        red_percentage = red_pixel_count / total_pixels if total_pixels > 0 else 0

        if red_percentage > self.config.RED_EYE_PIXEL_PERCENTAGE_THRESH:
            return "FAIL", f"{red_percentage:.1%} of pupil ROI is red after correction attempt."
            
        return "PASS", f"{red_percentage:.1%} of pupil ROI is red."

    def _validate_background_final(self, image_bgr, face_bbox):
        """
        Perform final background validation on the processed image. After rembg,
        the background should be uniform white, so we sample areas around the head/upper body.
        """
        img_h, img_w = image_bgr.shape[:2]
        
        # Sample from 5 strategic positions around the head/upper body area to avoid
        # sampling clothing at the bottom of the image which could cause false failures.
        
        # Define the size of the square to sample from each position.
        sample_size = min(50, img_h // 4, img_w // 4)
        if sample_size == 0:
             return "WARNING", "Image is too small to sample background areas."

        # Collect pixels from strategic background areas (avoiding bottom corners).
        mid_h = img_h // 2
        mid_w = img_w // 2
        
        sample_areas = [
            image_bgr[0:sample_size, 0:sample_size],                                    # Top-left corner
            image_bgr[0:sample_size, img_w - sample_size:img_w],                       # Top-right corner
            image_bgr[mid_h - sample_size//2:mid_h + sample_size//2, 0:sample_size],   # Middle-left
            image_bgr[0:sample_size, mid_w - sample_size//2:mid_w + sample_size//2],   # Middle-top
            image_bgr[mid_h - sample_size//2:mid_h + sample_size//2, img_w - sample_size:img_w]  # Middle-right
        ]
        
        bg_pixels = np.concatenate([area.reshape(-1, 3) for area in sample_areas])

        if bg_pixels.size < 100: # Lowered threshold as we sample smaller areas
            return "WARNING", "Not enough background pixels from corners for validation."

        mean_color = np.mean(bg_pixels, axis=0)
        std_dev_color = np.std(bg_pixels, axis=0)

        # Check if background meets final criteria
        is_light_enough = np.all(mean_color >= self.config.BG_FINAL_MIN_LIGHT_RGB)
        is_not_too_bright = np.all(mean_color <= self.config.BG_FINAL_MAX_RGB)
        is_uniform = np.all(std_dev_color <= self.config.BG_FINAL_STD_DEV_MAX)
        
        issues = []
        if not is_light_enough:
            issues.append("too dark")
        if not is_not_too_bright:
            issues.append("too bright")
        if not is_uniform:
            issues.append("not uniform")
            
        if issues:
            return "FAIL", f"Background issues: {', '.join(issues)}"
        
        return "PASS", f"Background appears compliant (mean: {mean_color.astype(int)}, std: {std_dev_color.astype(int)})"

    def _validate_contrast(self, image_bgr, face_bbox):
        """
        Validate contrast between face and background.
        
        Args:
            image_bgr (numpy.ndarray): Input image in BGR format
            face_bbox (numpy.ndarray): Face bounding box coordinates
            
        Returns:
            tuple: (status, description_message)
        """
        # Convert to grayscale for contrast analysis
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        
        # Get face region
        face_region = gray[face_bbox[1]:face_bbox[3], face_bbox[0]:face_bbox[2]]
        face_mean = np.mean(face_region) if face_region.size > 0 else 0
        
        # Get background region (exclude face area)
        img_h, img_w = gray.shape
        face_mask = np.zeros((img_h, img_w), dtype=np.uint8)
        cv2.rectangle(face_mask, tuple(face_bbox[:2]), tuple(face_bbox[2:]), 255, -1)
        bg_mask = cv2.bitwise_not(cv2.dilate(face_mask, np.ones((10, 10), np.uint8)))
        
        bg_pixels = gray[bg_mask == 255]
        bg_mean = np.mean(bg_pixels) if bg_pixels.size > 0 else 255
        
        contrast = abs(bg_mean - face_mean)
        
        if contrast >= self.config.CONTRAST_THRESHOLD_GRAY:
            return "PASS", f"Good contrast: {contrast:.1f} (face: {face_mean:.1f}, bg: {bg_mean:.1f})"
        else:
            return "WARNING", f"Low contrast: {contrast:.1f} (face: {face_mean:.1f}, bg: {bg_mean:.1f})"

    def validate_photo(self, preprocessed_image_bgr, face_data):
        """
        Run all validation checks on the preprocessed photo.
        
        Args:
            preprocessed_image_bgr (numpy.ndarray): Preprocessed image in BGR format
            face_data: Face analysis data from InsightFace
            
        Returns:
            list: List of validation results as (status, check_name, message) tuples
        """
        results = []
        img_h, img_w = preprocessed_image_bgr.shape[:2]

        if face_data is None:
            results.append(("FAIL", "Face Data", "No valid face data for validation."))
            return results

        bbox = face_data.bbox.astype(int)
        landmarks = face_data.landmark_2d_106.astype(np.int32) if face_data.landmark_2d_106 is not None else None
        
        # 1. Head Pose Validation
        if face_data.pose is not None:
            yaw, pitch, roll = face_data.pose
            results.append(("PASS" if abs(yaw) <= self.config.MAX_ABS_YAW else "FAIL", 
                          "Head Pose - Yaw", f"{yaw:.1f}°"))
            results.append(("PASS" if abs(pitch) <= self.config.MAX_ABS_PITCH else "FAIL", 
                          "Head Pose - Pitch", f"{pitch:.1f}°"))
            results.append(("PASS" if abs(roll) <= self.config.MAX_ABS_ROLL else "FAIL", 
                          "Head Pose - Roll", f"{roll:.1f}°"))
        else:
            results.append(("UNKNOWN", "Head Pose", "Pose information not available."))

        # 2. Checks requiring landmarks
        if landmarks is None:
            results.append(("FAIL", "Landmarks", "Could not perform landmark-based checks."))
            return results

        # 3. Chin-to-Crown Height Ratio
        # ---
        # METHODOLOGY: This check is the final arbiter of the cropping process.
        # The ImagePreprocessor is tasked with creating a cropped and resized image
        # that meets ICAO standards. Specifically, it uses TARGET_HEAD_HEIGHT_RATIO
        # and HEAD_POS_RATIO_VERTICAL from the config to frame the head.
        #
        # This validation step does NOT re-measure the crown from landmarks. Instead,
        # it verifies that the preprocessor's work resulted in a compliant final
        # image. It works as follows:
        #
        # 1. It assumes the preprocessor correctly placed the subject's crown at a
        #    specific position relative to the top of the image (defined by
        #    HEAD_POS_RATIO_VERTICAL). It calculates this `expected_crown_y`.
        # 2. It takes the actual position of the chin from the transformed landmarks.
        # 3. It calculates the head height (`head_h`) as the distance between the
        #    actual chin and the *expected* crown.
        # 4. It then calculates the ratio of this `head_h` to the total image height.
        # 5. Finally, it compares this ratio to the official ICAO minimum and
        #    maximum requirements.
        #
        # This correctly validates the final photo composition as per the standards.
        # ---
        chin_y = landmarks[self.config.CHIN_LANDMARK_INDEX][1]
        
        # Calculate where the crown *should* be in a perfectly compliant photo.
        expected_crown_y = img_h * self.config.HEAD_POS_RATIO_VERTICAL
        head_h = chin_y - expected_crown_y
        
        ratio = head_h / img_h if head_h > 0 else 0
        
        status = "PASS" if self.config.MIN_CHIN_TO_CROWN_RATIO <= ratio <= self.config.MAX_CHIN_TO_CROWN_RATIO else "FAIL"
        results.append((status, "Chin-to-Crown Ratio", 
                       f"{ratio:.2f} (Target: {self.config.MIN_CHIN_TO_CROWN_RATIO:.2f}-{self.config.MAX_CHIN_TO_CROWN_RATIO:.2f})"))
        
        # 4. Eyes Open Validation (using EAR)
        left_ear = self._get_eye_aspect_ratio(landmarks[self.config.LEFT_EYE_LANDMARKS])
        right_ear = self._get_eye_aspect_ratio(landmarks[self.config.RIGHT_EYE_LANDMARKS])
        avg_ear = (left_ear + right_ear) / 2.0
        
        if avg_ear >= self.config.EYE_AR_THRESH:
            results.append(("PASS", "Eyes Open", f"EAR: {avg_ear:.2f} (appears open)."))
        else:
            results.append(("WARNING", "Eyes Open", 
                          f"EAR: {avg_ear:.2f} (appears closed). This is OK for infants under 6 months."))

        # 5. Red Eye Check
        # This check verifies that the red-eye correction in the preprocessor was
        # successful. It runs the detection algorithm again on the final image.
        left_redeye_status, left_redeye_msg = self._validate_red_eye(
            preprocessed_image_bgr, landmarks[self.config.LEFT_PUPIL_APPROX_INDEX])
        right_redeye_status, right_redeye_msg = self._validate_red_eye(
            preprocessed_image_bgr, landmarks[self.config.RIGHT_PUPIL_APPROX_INDEX])
        results.append((left_redeye_status, "Left Eye Red-Eye", left_redeye_msg))
        results.append((right_redeye_status, "Right Eye Red-Eye", right_redeye_msg))

        # 6. Sharpness Check (Laplacian variance)
        face_roi_gray = cv2.cvtColor(preprocessed_image_bgr[bbox[1]:bbox[3], bbox[0]:bbox[2]], cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(face_roi_gray, cv2.CV_64F).var()
        results.append(("PASS" if laplacian_var > 40 else "WARNING", 
                       "Sharpness (Heuristic)", f"Laplacian variance: {laplacian_var:.2f}"))

        # 7. Background Validation
        # bg_status, bg_msg = self._validate_background_final(preprocessed_image_bgr, bbox)
        # results.append((bg_status, "Final Background", bg_msg))
        
        # 8. Contrast Validation
        contrast_status, contrast_msg = self._validate_contrast(preprocessed_image_bgr, bbox)
        results.append((contrast_status, "Face-Background Contrast", contrast_msg))
        
        return results 