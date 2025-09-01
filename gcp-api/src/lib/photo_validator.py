"""
Photo validation module for ICAO passport photo compliance.
Validates processed photos against various quality and compliance criteria.
"""

import cv2
import numpy as np
from lib.app_config import config


class PhotoValidator:
    """Validates the preprocessed photo against ICAO-based compliance rules."""
    
    def __init__(self):
        """Initialize the PhotoValidator with configuration."""
        self.config = config.icao

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
        pupil_roi_radius = max(5, int(self.config.final_output_height_px * 0.01))
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

        if red_percentage > self.config.red_eye_pixel_percentage_thresh:
            return "FAIL", f"{red_percentage:.1%} of pupil ROI is red after correction attempt."
            
        return "PASS", f"{red_percentage:.1%} of pupil ROI is red."

    def _validate_background_final(self, image_bgr, face_bbox, rembg_mask=None):
        """
        Perform final background validation on the processed image. After rembg,
        the background should be uniform white.
        """
        img_h, img_w = image_bgr.shape[:2]

        if rembg_mask is not None and np.any(rembg_mask):
            # Method 1: Use the precise rembg mask to sample the background.
            # This is the most accurate method.
            bg_mask = ~rembg_mask
            bg_pixels = image_bgr[bg_mask]
        else:
            # Method 2: Fallback to sampling strategic corners if no mask is available.
            # This is less accurate as it might sample clothing.
            sample_size = min(50, img_h // 4, img_w // 4)
            if sample_size == 0:
                return "WARNING", "Image is too small to sample background areas."

            mid_h = img_h // 2
            mid_w = img_w // 2
            
            sample_areas = [
                image_bgr[0:sample_size, 0:sample_size],
                image_bgr[0:sample_size, img_w - sample_size:img_w],
                image_bgr[mid_h - sample_size//2:mid_h + sample_size//2, 0:sample_size],
                image_bgr[0:sample_size, mid_w - sample_size//2:mid_w + sample_size//2],
                image_bgr[mid_h - sample_size//2:mid_h + sample_size//2, img_w - sample_size:img_w]
            ]
            bg_pixels = np.concatenate([area.reshape(-1, 3) for area in sample_areas])

        if bg_pixels.size < 100:
            return "WARNING", "Not enough background pixels for final validation."

        mean_color = np.mean(bg_pixels, axis=0)
        std_dev_color = np.std(bg_pixels, axis=0)

        # Check if background meets final criteria
        is_light_enough = np.all(mean_color >= self.config.bg_final_min_light_rgb)
        is_not_too_bright = np.all(mean_color <= self.config.bg_final_max_rgb)
        is_uniform = np.all(std_dev_color <= self.config.bg_final_std_dev_max)
        
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

    def _validate_contrast(self, image_bgr, face_bbox, rembg_mask=None):
        """
        Validate contrast between face and background.
        
        Args:
            image_bgr (numpy.ndarray): Input image in BGR format
            face_bbox (numpy.ndarray): Face bounding box coordinates
            rembg_mask (numpy.ndarray, optional): Binary mask from rembg (subject=True, background=False)
            
        Returns:
            tuple: (status, description_message)
        """
        # Convert to grayscale for contrast analysis
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        
        # Get face region
        face_region = gray[face_bbox[1]:face_bbox[3], face_bbox[0]:face_bbox[2]]
        face_mean = np.mean(face_region) if face_region.size > 0 else 0
        
        # Get background region - use rembg mask if available for more accurate separation
        if rembg_mask is not None:
            bg_mask = ~rembg_mask  # Invert to get background only
            bg_pixels = gray[bg_mask]
        else:
            # Fallback to face bbox method
            img_h, img_w = gray.shape
            face_mask = np.zeros((img_h, img_w), dtype=np.uint8)
            cv2.rectangle(face_mask, tuple(face_bbox[:2]), tuple(face_bbox[2:]), 255, -1)
            bg_mask = cv2.bitwise_not(cv2.dilate(face_mask, np.ones((10, 10), np.uint8)))
            bg_pixels = gray[bg_mask == 255]
        
        bg_mean = np.mean(bg_pixels) if bg_pixels.size > 0 else 255
        
        contrast = abs(bg_mean - face_mean)
        
        if contrast >= self.config.contrast_threshold_gray:
            return "PASS", f"Good contrast: {contrast:.1f} (face: {face_mean:.1f}, bg: {bg_mean:.1f})"
        else:
            return "WARNING", f"Low contrast: {contrast:.1f} (face: {face_mean:.1f}, bg: {bg_mean:.1f})"

    def _validate_eye_level_positioning(self, landmarks, img_h):
        """
        Validate that eye level is positioned correctly from the bottom edge of the photo.
        For baby photos, eyes should be 18-29mm from the bottom edge.
        
        Args:
            landmarks (numpy.ndarray): Facial landmarks
            img_h (int): Image height in pixels
            
        Returns:
            tuple: (status, description_message)
        """
        # Get average eye level from landmarks
        eye_indices = np.concatenate([
            self.config.left_eye_landmarks,
            self.config.right_eye_landmarks
        ])
        avg_eye_y = np.mean(landmarks[eye_indices, 1])
        
        # Calculate distance from bottom edge (in pixels)
        distance_from_bottom_px = img_h - avg_eye_y
        
        # Check if within acceptable range
        if self.config.eye_level_min_from_bottom_px <= distance_from_bottom_px <= self.config.eye_level_max_from_bottom_px:
            # Convert back to mm for display
            distance_mm = (distance_from_bottom_px / self.config.target_dpi) * 25.4
            return "PASS", f"Eye level: {distance_mm:.1f}mm from bottom (Target: {self.config.eye_level_min_from_bottom_mm}-{self.config.eye_level_max_from_bottom_mm}mm)"
        else:
            distance_mm = (distance_from_bottom_px / self.config.target_dpi) * 25.4
            return "FAIL", f"Eye level: {distance_mm:.1f}mm from bottom (Target: {self.config.eye_level_min_from_bottom_mm}-{self.config.eye_level_max_from_bottom_mm}mm)"

    def validate_photo(self, preprocessed_image_bgr, face_data, rembg_mask=None):
        """
        Run all validation checks on the preprocessed photo.
        
        Args:
            preprocessed_image_bgr (numpy.ndarray): Preprocessed image in BGR format
            face_data: Face analysis data from InsightFace
            rembg_mask (numpy.ndarray, optional): Binary mask from rembg (subject=True, background=False)
            
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
            results.append(("PASS" if abs(yaw) <= self.config.max_abs_yaw else "FAIL", 
                          "Head Pose - Yaw", f"{yaw:.1f}°"))
            results.append(("PASS" if abs(pitch) <= self.config.max_abs_pitch else "FAIL", 
                          "Head Pose - Pitch", f"{pitch:.1f}°"))
            results.append(("PASS" if abs(roll) <= self.config.max_abs_roll else "FAIL", 
                          "Head Pose - Roll", f"{roll:.1f}°"))
        else:
            results.append(("UNKNOWN", "Head Pose", "Pose information not available."))

        # 2. Checks requiring landmarks
        if landmarks is None:
            results.append(("FAIL", "Landmarks", "Could not perform landmark-based checks."))
            return results

        # 3. Chin-to-Crown Height Ratio
        # ---
        # METHODOLOGY: This check uses a hybrid approach for maximum accuracy.
        # 1. REMBG MASK FOR CROWN: If a `rembg_mask` is available, it is used
        #    to find the true top of the head (crown), which accurately
        #    accounts for hair volume. This is more reliable than geometric
        #    estimations or landmark points near the hairline.
        # 2. LANDMARKS FOR CHIN: Facial landmarks are highly accurate for
        #    locating the chin, so we continue to use them for the bottom
        #    of the head measurement.
        # 3. FALLBACK: If no rembg_mask is available, it reverts to the
        #    original method of validating the crop box based on expected
        #    head position ratios.
        # ---
        if rembg_mask is not None and np.any(rembg_mask):
            # Hybrid approach: rembg for crown, landmarks for chin
            subject_pixels_y = np.where(rembg_mask)[0]
            crown_y = np.min(subject_pixels_y)
            chin_y = landmarks[self.config.chin_landmark_index][1]
            head_h = chin_y - crown_y
            
            # Add a log for which method was used
            method_log = " (Method: rembg+landmarks)"
        else:
            # Fallback to validating the preprocessor's crop logic
            chin_y = landmarks[self.config.chin_landmark_index][1]
            expected_crown_y = img_h * self.config.head_pos_ratio_vertical
            head_h = chin_y - expected_crown_y
            method_log = " (Method: crop-box validation)"

        ratio = head_h / img_h if head_h > 0 else 0
        
        status = "PASS" if self.config.min_chin_to_crown_ratio <= ratio <= self.config.max_chin_to_crown_ratio else "FAIL"
        results.append((status, "Chin-to-Crown Ratio", 
                       f"{ratio:.2f} (Target: {self.config.min_chin_to_crown_ratio:.2f}-{self.config.max_chin_to_crown_ratio:.2f}){method_log}"))
        
        # 4. Eyes Open Validation (using EAR)
        left_ear = self._get_eye_aspect_ratio(landmarks[self.config.left_eye_landmarks])
        right_ear = self._get_eye_aspect_ratio(landmarks[self.config.right_eye_landmarks])
        avg_ear = (left_ear + right_ear) / 2.0
        
        if avg_ear >= self.config.eye_ar_thresh:
            results.append(("PASS", "Eyes Open", f"EAR: {avg_ear:.2f} (appears open)."))
        else:
            results.append(("WARNING", "Eyes Open", 
                          f"EAR: {avg_ear:.2f} (appears closed). This is OK for infants under 6 months."))

        # 5. Red Eye Check
        # This check verifies that the red-eye correction in the preprocessor was
        # successful. It runs the detection algorithm again on the final image.
        left_redeye_status, left_redeye_msg = self._validate_red_eye(
            preprocessed_image_bgr, landmarks[self.config.left_pupil_approx_index])
        right_redeye_status, right_redeye_msg = self._validate_red_eye(
            preprocessed_image_bgr, landmarks[self.config.right_pupil_approx_index])
        results.append((left_redeye_status, "Left Eye Red-Eye", left_redeye_msg))
        results.append((right_redeye_status, "Right Eye Red-Eye", right_redeye_msg))

        # 6. Sharpness Check (Laplacian variance)
        face_roi_gray = cv2.cvtColor(preprocessed_image_bgr[bbox[1]:bbox[3], bbox[0]:bbox[2]], cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(face_roi_gray, cv2.CV_64F).var()
        results.append(("PASS" if laplacian_var > 40 else "WARNING", 
                       "Sharpness (Heuristic)", f"Laplacian variance: {laplacian_var:.2f}"))

        # 7. Background Validation
        bg_status, bg_msg = self._validate_background_final(preprocessed_image_bgr, bbox, rembg_mask)
        results.append((bg_status, "Final Background", bg_msg))
        
        # 8. Contrast Validation
        contrast_status, contrast_msg = self._validate_contrast(preprocessed_image_bgr, bbox, rembg_mask)
        results.append((contrast_status, "Face-Background Contrast", contrast_msg))
        
        # 9. Eye Level Positioning Validation
        eye_level_status, eye_level_msg = self._validate_eye_level_positioning(landmarks, img_h)
        results.append((eye_level_status, "Eye Level Positioning", eye_level_msg))
        
        return results 