"""
Image preprocessing module for passport photo validation.
Handles cropping, resizing, and background removal operations.
"""

import cv2
import numpy as np
from lib.config import Config
from lib.face_analyzer import FaceAnalyzer
from types import SimpleNamespace

class ImagePreprocessor:
    """Handles image cropping, resizing, and conditional background removal."""
    
    def __init__(self, face_analyzer: FaceAnalyzer, rembg_func=None):
        """
        Initialize the ImagePreprocessor.
        
        Args:
            face_analyzer (FaceAnalyzer): Initialized face analyzer instance.
            rembg_func (function, optional): The 'remove' function from the rembg
                                             library. Defaults to None.
        """
        self.face_analyzer = face_analyzer
        self.config = Config()
        self.rembg_func = rembg_func

    def _get_face_details_for_crop(self, faces):
        """
        Extract face details needed for cropping calculations.
        
        Args:
            faces (list): List of detected faces
            
        Returns:
            tuple: (face_details_dict, error_message)
        """
        if not faces:
            return None, "No face detected in the image."
        
        if len(faces) > 1:
            return None, "Multiple faces detected. Please use a photo with only one person."
        
        face = faces[0]
        
        # Extract bounding box
        bbox = face.bbox
        if bbox is None:
            return None, "Could not determine face bounding box."
        
        # Initialize final vertical coordinates with bbox as a safe fallback
        chin_y_final = bbox[3]
        crown_y_final = bbox[1]
        
        landmarks = getattr(face, 'landmark_2d_106', None)
        
        # If we have the 106-point landmarks, use them for a more accurate crop.
        # For infants, we use a simple but robust geometric estimation.
        if landmarks is not None and len(landmarks) == 106:
            # The bbox can be too tight. We estimate crown position based on facial geometry.
            chin_y = landmarks[self.config.CHIN_LANDMARK_INDEX][1]
            
            # Get the average vertical position of the eyes.
            eye_indices = np.concatenate([
                self.config.LEFT_EYE_LANDMARKS,
                self.config.RIGHT_EYE_LANDMARKS
            ])
            avg_eye_y = np.mean(landmarks[eye_indices, 1])
            
            # For subjects like infants with different head proportions, a direct
            # measurement from chin to the top of the head in the landmarks can be
            # unreliable. Instead, we use a robust geometric estimation. We mirror
            # the distance from the eyes to the chin upwards, applying a multiplier
            # to generously estimate where the crown should be. This provides
            # ample space and avoids cropping too tightly.
            eye_to_chin_dist = chin_y - avg_eye_y
            crown_y = avg_eye_y - (eye_to_chin_dist * self.config.INFANT_CROWN_ESTIMATION_MULTIPLIER)

            # Only use the landmark values if they are valid.
            if crown_y < chin_y:
                chin_y_final = chin_y
                crown_y_final = crown_y
            
        # Final sanity check: if crown is somehow still below chin, revert to bbox.
        if crown_y_final >= chin_y_final:
            crown_y_final, chin_y_final = bbox[1], bbox[3]

        return {
            "bbox": bbox,
            "chin_y": chin_y_final,
            "crown_y": crown_y_final
        }, None

    def _calculate_crop_coordinates(self, original_shape, face_details, subject_mask=None):
        """
        Calculates a robust crop box around the face based on ICAO standards.
        It uses the subject mask for centering if available for higher accuracy.
        """
        orig_h, orig_w = original_shape[:2]
        bbox = face_details["bbox"]
        
        chin_y, crown_y = face_details["chin_y"], face_details["crown_y"]
        
        head_height_px = chin_y - crown_y
        if head_height_px <= 0:
            # Fallback to bbox height if landmark/mask calculation is invalid
            head_height_px = bbox[3] - bbox[1]

        # ICAO spec: head height should be a specific ratio of the photo height.
        # We calculate the target crop height to satisfy this requirement.
        target_crop_h = head_height_px / self.config.TARGET_HEAD_HEIGHT_RATIO
        
        # Calculate target width based on the passport aspect ratio
        target_crop_w = target_crop_h * self.config.TARGET_ASPECT_RATIO

        # Center the crop box horizontally on the face center.
        # For passport photos, we want to center on the face/head, not the entire subject extent.
        face_cx = (bbox[0] + bbox[2]) / 2
        subject_cx = face_cx
        method_log = " (Center: face bbox)"
        
        crop_x1 = subject_cx - (target_crop_w / 2)
        crop_x2 = crop_x1 + target_crop_w
        
        # Position the crop vertically. ICAO mandates space above the head.
        # We use a ratio of the final image height to position the crown correctly
        # from the top of the frame.
        space_above_head = target_crop_h * self.config.HEAD_POS_RATIO_VERTICAL
        crop_y1 = crown_y - space_above_head
        crop_y2 = crop_y1 + target_crop_h
        
        x1, y1, x2, y2 = map(int, [crop_x1, crop_y1, crop_x2, crop_y2])
        
        # Clip coordinates to the image dimensions
        x1, y1, x2, y2 = max(0, x1), max(0, y1), min(orig_w, x2), min(orig_h, y2)

        return (x1, y1, x2, y2), method_log

    def _preliminary_background_check(self, image_bgr, face_bbox, rembg_mask=None):
        """
        Quick check if background is light and uniform, or needs removal.
        
        Args:
            image_bgr (numpy.ndarray): Input image in BGR format
            face_bbox (numpy.ndarray, optional): Face bounding box coordinates
            rembg_mask (numpy.ndarray, optional): Binary mask from rembg (subject=True, background=False)
            
        Returns:
            tuple: (is_background_ok, reason_message)
        """
        img_h, img_w = image_bgr.shape[:2]
        
        # Use rembg mask if available for more accurate background sampling
        if rembg_mask is not None:
            bg_mask = ~rembg_mask  # Invert to get background only
            bg_pixels = image_bgr[bg_mask]
        else:
            # Fallback to face bbox method
            face_mask = np.zeros((img_h, img_w), dtype=np.uint8)
            cv2.rectangle(face_mask, tuple(face_bbox[:2]), tuple(face_bbox[2:]), 255, -1)
            bg_mask = cv2.bitwise_not(cv2.dilate(face_mask, np.ones((10, 10), np.uint8)))
            bg_pixels = image_bgr[bg_mask == 255]

        if bg_pixels.size < 1000:
            return False, "Not enough background pixels to check."

        mean_color = np.mean(bg_pixels, axis=0)
        std_dev_color = np.std(bg_pixels, axis=0)

        is_light_enough = np.all(mean_color >= self.config.BG_PRELIM_MIN_LIGHT_RGB)
        is_uniform = np.all(std_dev_color <= self.config.BG_PRELIM_STD_DEV_MAX)
        
        if is_light_enough and is_uniform:
            return True, "Background appears light and uniform."
        
        reasons = []
        if not is_light_enough: reasons.append("not light enough")
        if not is_uniform: reasons.append("not uniform")
        return False, f"Background issues: {', '.join(reasons)}."

    def _transform_landmarks(self, landmarks, crop_box, final_shape):
        """
        Transforms landmark coordinates from the original image space to the final
        processed image space.
        
        Args:
            landmarks (numpy.ndarray): The original landmarks.
            crop_box (tuple): The (x1, y1, x2, y2) crop box from the original image.
            final_shape (tuple): The (width, height) of the final processed image.
            
        Returns:
            numpy.ndarray: The landmarks transformed to the new coordinate space.
        """
        x1_c, y1_c, x2_c, y2_c = crop_box
        
        crop_w = x2_c - x1_c
        crop_h = y2_c - y1_c
        
        if crop_w == 0 or crop_h == 0:
            return None

        final_w, final_h = final_shape

        shifted_landmarks = landmarks - [x1_c, y1_c]
        
        scale_x = final_w / crop_w
        scale_y = final_h / crop_h
        
        transformed_landmarks = shifted_landmarks * [scale_x, scale_y]
        
        return transformed_landmarks

    def _correct_red_eye(self, image_bgr, landmarks):
        """
        Detects and corrects red-eye in a given image using pupil landmarks.
        The logic is based on the LearnOpenCV guide.
        Ref: https://learnopencv.com/automatic-red-eye-remover-using-opencv-cpp-python/
        
        Args:
            image_bgr (numpy.ndarray): The image to correct.
            landmarks (numpy.ndarray): Facial landmarks.
            
        Returns:
            tuple: (corrected_image, logs)
        """
        logs = []
        corrected_image = image_bgr.copy()
        
        # Define eye regions using landmarks
        eye_indices = [
            ("Left", self.config.LEFT_PUPIL_APPROX_INDEX),
            ("Right", self.config.RIGHT_PUPIL_APPROX_INDEX)
        ]

        for eye_name, pupil_index in eye_indices:
            pupil_landmark = landmarks[pupil_index]
            
            # Create a bounding box for the eye ROI
            roi_radius = max(10, int(image_bgr.shape[0] * 0.02)) # 2% of image height
            x, y = int(pupil_landmark[0]), int(pupil_landmark[1])
            
            # Ensure ROI is within image bounds
            y1, y2 = max(0, y - roi_radius), min(image_bgr.shape[0], y + roi_radius)
            x1, x2 = max(0, x - roi_radius), min(image_bgr.shape[1], x + roi_radius)
            
            eye_roi = corrected_image[y1:y2, x1:x2]
            if eye_roi.size == 0:
                continue

            # Detection logic from LearnOpenCV
            b, g, r = cv2.split(eye_roi)
            bg = cv2.add(b, g)
            mask = (r > 150) & (r > bg)
            mask = mask.astype(np.uint8) * 255
            
            # Check if any red-eye was detected
            if np.sum(mask) > 0:
                logs.append(("INFO", "Red-Eye Correction", f"Red-eye detected in {eye_name} eye."))

                # Clean up mask by filling holes and dilating
                h, w = mask.shape[:2]
                mask_floodfill = mask.copy()
                mask_temp = np.zeros((h + 2, w + 2), np.uint8)
                cv2.floodFill(mask_floodfill, mask_temp, (0, 0), 255)
                mask2 = cv2.bitwise_not(mask_floodfill)
                mask = mask2 | mask
                mask = cv2.dilate(mask, None, anchor=(-1, -1), iterations=3, borderType=1, borderValue=1)

                # Correction logic from LearnOpenCV
                mean_channel = cv2.divide(bg, 2)
                
                # Apply the fix
                for i in range(3): # B, G, R channels
                    eye_roi[:,:,i] = cv2.bitwise_and(eye_roi[:,:,i], 255-mask) + cv2.bitwise_and(mean_channel, mask)
                
                logs.append(("INFO", "Red-Eye Correction", f"Applied correction to {eye_name} eye."))

        return corrected_image, logs

    def _create_subject_mask(self, image_bgr, logs):
        """Runs rembg on an image to get a precise subject mask."""
        if not self.rembg_func:
            logs.append(("INFO", "Preprocessing", "rembg not available, skipping mask creation."))
            return None
        try:
            logs.append(("INFO", "Preprocessing", "Running rembg to create subject mask..."))
            output_rgba = self.rembg_func(cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB))
            mask = (output_rgba[:, :, 3] > 128)
            logs.append(("INFO", "Preprocessing", "Subject mask created successfully."))
            return mask
        except Exception as e:
            logs.append(("WARNING", "Preprocessing", f"rembg failed: {e}"))
            return None

    def _apply_background_removal(self, image_bgr, mask):
        """Applies a white background to an image using a subject mask."""
        white_bg = np.full(image_bgr.shape, 255, dtype=np.uint8)
        mask_3d = mask[..., np.newaxis]
        return np.where(mask_3d, image_bgr, white_bg)

    def process_image(self, original_image_bgr, faces):
        """
        Processes the image for validation by performing a single, robust analysis,
        then transforming the results through the processing pipeline in the correct order:
        Crop -> Background Removal -> Resize.
        """
        logs = []
        
        # Step 1: Get initial face data
        face_details, error = self._get_face_details_for_crop(faces)
        if error:
            logs.append(("FAIL", "Preprocessing", error))
            return None, None, logs, False, None
        
        original_face_data = faces[0]
        original_landmarks = original_face_data.landmark_2d_106
        logs.append(("INFO", "Preprocessing", "Initial face details extracted."))

        # Step 2: Create a precise subject mask from the original image
        original_rembg_mask = self._create_subject_mask(original_image_bgr, logs)

        # Step 3: Refine crop details with the mask
        if original_rembg_mask is not None and np.any(original_rembg_mask):
            subject_pixels_y = np.where(original_rembg_mask)[0]
            face_details["crown_y"] = np.min(subject_pixels_y)
            logs.append(("INFO", "Preprocessing", "Updated crown position using rembg mask."))

        # Step 4: Calculate and apply crop
        crop_coords, crop_log = self._calculate_crop_coordinates(original_image_bgr.shape, face_details, original_rembg_mask)
        logs.append(("INFO", "Preprocessing", f"Crop box calculated{crop_log}"))
        if not crop_coords:
            logs.append(("FAIL", "Preprocessing", "Crop calculation failed."))
            return None, None, logs, False, None

        x1, y1, x2, y2 = crop_coords
        cropped_bgr = original_image_bgr[y1:y2, x1:x2]
        if cropped_bgr.size == 0:
            logs.append(("FAIL", "Preprocessing", "Cropped image is empty."))
            return None, None, logs, False, None
        logs.append(("INFO", "Preprocessing", "Image cropped to ICAO standards."))

        # Step 5: Process background on the cropped image
        cropped_rembg_mask = original_rembg_mask[y1:y2, x1:x2] if original_rembg_mask is not None else None
        
        is_bg_ok, reason = self._preliminary_background_check(cropped_bgr, None, cropped_rembg_mask)
        logs.append(("INFO", "Preprocessing", f"Preliminary BG check: {reason}"))
        
        if not is_bg_ok:
            if cropped_rembg_mask is None:
                cropped_rembg_mask = self._create_subject_mask(cropped_bgr, logs)
            
            if cropped_rembg_mask is not None:
                cropped_bgr = self._apply_background_removal(cropped_bgr, cropped_rembg_mask)
                logs.append(("INFO", "Preprocessing", "Background removal applied."))
        
        # Step 6: Resize to final dimensions
        final_shape = (self.config.FINAL_OUTPUT_WIDTH_PX, self.config.FINAL_OUTPUT_HEIGHT_PX)
        processed_bgr = cv2.resize(cropped_bgr, final_shape, interpolation=cv2.INTER_AREA)
        logs.append(("INFO", "Preprocessing", "Image resized to final dimensions."))

        # Step 7: Transform artifacts to the final coordinate space
        transformed_landmarks = self._transform_landmarks(original_landmarks, crop_coords, final_shape)
        if transformed_landmarks is None:
            logs.append(("FAIL", "Preprocessing", "Landmark transformation failed."))
            return processed_bgr, None, logs, False, None
        
        final_rembg_mask = None
        if cropped_rembg_mask is not None:
            final_rembg_mask = cv2.resize(cropped_rembg_mask.astype(np.uint8), final_shape, interpolation=cv2.INTER_NEAREST).astype(bool)
        
        # Step 8: Create final face data object
        final_face_data = SimpleNamespace(
            pose=original_face_data.pose,
            landmark_2d_106=transformed_landmarks
        )
        x_coords, y_coords = transformed_landmarks[:, 0], transformed_landmarks[:, 1]
        final_face_data.bbox = np.array([min(x_coords), min(y_coords), max(x_coords), max(y_coords)])
        
        # Step 9: Perform final corrections
        processed_bgr, red_eye_logs = self._correct_red_eye(processed_bgr, transformed_landmarks)
        logs.extend(red_eye_logs)

        # Step 10: Return final results
        logs.append(("PASS", "Preprocessing", "Image fully preprocessed and ready for validation."))
        return processed_bgr, final_face_data, logs, True, final_rembg_mask 