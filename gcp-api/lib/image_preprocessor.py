"""
Image preprocessing module for passport photo validation.
Handles cropping, resizing, and background removal operations.
"""

import cv2
import numpy as np
from .config import Config
from .face_analyzer import FaceAnalyzer

# Custom lightweight background removal using OpenCV
def simple_background_removal(image_bgr, face_bbox):
    """
    Simple background removal using edge detection and flood fill.
    Much lighter than rembg but effective for passport photos with relatively uniform backgrounds.
    
    Args:
        image_bgr (numpy.ndarray): Input image in BGR format
        face_bbox (numpy.ndarray): Face bounding box to protect from removal
        
    Returns:
        numpy.ndarray: Image with background replaced by white
    """
    try:
        # Create a mask for the face area to protect it
        h, w = image_bgr.shape[:2]
        face_mask = np.zeros((h, w), dtype=np.uint8)
        
        # Expand face bbox slightly to protect more area
        x1, y1, x2, y2 = face_bbox.astype(int)
        padding = int(min(x2-x1, y2-y1) * 0.3)  # 30% padding
        x1 = max(0, x1 - padding)
        y1 = max(0, y1 - padding)
        x2 = min(w, x2 + padding)
        y2 = min(h, y2 + padding)
        
        cv2.rectangle(face_mask, (x1, y1), (x2, y2), 255, -1)
        
        # Convert to grayscale for processing
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        
        # Apply GaussianBlur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Create edge detection mask
        edges = cv2.Canny(blurred, 50, 150)
        
        # Dilate edges to close gaps
        kernel = np.ones((3, 3), np.uint8)
        edges = cv2.dilate(edges, kernel, iterations=1)
        
        # Create background mask using flood fill from corners
        bg_mask = np.zeros((h + 2, w + 2), dtype=np.uint8)
        result_image = image_bgr.copy()
        
        # Flood fill from corners to identify background
        corners = [(0, 0), (0, h-1), (w-1, 0), (w-1, h-1)]
        for x, y in corners:
            if bg_mask[y+1, x+1] == 0:  # Not already filled
                cv2.floodFill(gray, bg_mask, (x, y), 255, loDiff=30, upDiff=30, 
                             flags=cv2.FLOODFILL_MASK_ONLY)
        
        # Remove padding from mask
        bg_mask = bg_mask[1:-1, 1:-1]
        
        # Combine with edge information
        bg_mask = cv2.bitwise_and(bg_mask, cv2.bitwise_not(edges))
        
        # Protect face area
        bg_mask = cv2.bitwise_and(bg_mask, cv2.bitwise_not(face_mask))
        
        # Apply morphological operations to clean up mask
        kernel = np.ones((5, 5), np.uint8)
        bg_mask = cv2.morphologyEx(bg_mask, cv2.MORPH_CLOSE, kernel)
        bg_mask = cv2.morphologyEx(bg_mask, cv2.MORPH_OPEN, kernel)
        
        # Smooth the mask edges
        bg_mask = cv2.GaussianBlur(bg_mask, (5, 5), 0)
        
        # Apply mask to create white background
        result_image[bg_mask > 128] = [255, 255, 255]
        
        return result_image
        
    except Exception as e:
        print(f"Simple background removal failed: {e}")
        return image_bgr  # Return original if processing fails


class ImagePreprocessor:
    """Handles image cropping, resizing, and conditional background removal."""
    
    def __init__(self, face_analyzer: FaceAnalyzer):
        """
        Initialize the ImagePreprocessor.
        
        Args:
            face_analyzer (FaceAnalyzer): Initialized face analyzer instance
        """
        self.face_analyzer = face_analyzer
        self.config = Config()

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
        
        # Extract landmarks if available
        landmarks = getattr(face, 'kps', None)
        if landmarks is None or len(landmarks) < 5:
            return None, "Could not extract sufficient facial landmarks."
        
        # For MediaPipe compatibility, we need to map landmarks differently
        # MediaPipe provides 468 landmarks, we'll use specific ones for key features
        if len(landmarks) > 100:  # MediaPipe format
            # Map MediaPipe landmarks to our expected format
            # These indices correspond to key facial features in MediaPipe's 468-point model
            try:
                chin_point = landmarks[152]  # Chin center
                nose_tip = landmarks[1]      # Nose tip
                left_eye = landmarks[33]     # Left eye center
                right_eye = landmarks[263]   # Right eye center
                forehead_top = landmarks[10] # Forehead top
                
                mapped_landmarks = np.array([
                    left_eye, right_eye, nose_tip, 
                    [landmarks[61][0], landmarks[61][1]],  # Left mouth corner
                    [landmarks[291][0], landmarks[291][1]]  # Right mouth corner
                ])
            except (IndexError, KeyError):
                # Fallback to first 5 landmarks if mapping fails
                mapped_landmarks = landmarks[:5]
        else:
            # Assume already in expected format
            mapped_landmarks = landmarks[:5] if len(landmarks) >= 5 else landmarks
        
        return {
            "bbox": bbox,
            "landmarks": mapped_landmarks,
            "chin_y": bbox[3],  # Bottom of bounding box as chin approximation
            "crown_y": bbox[1]  # Top of bounding box as crown approximation
        }, None

    def _calculate_crop_coordinates(self, original_shape, face_details):
        """
        Calculate crop coordinates to achieve target aspect ratio and face positioning.
        
        Args:
            original_shape (tuple): Shape of original image (h, w, c)
            face_details (dict): Face information from _get_face_details_for_crop
            
        Returns:
            tuple: (crop_coordinates, error_message) where crop_coordinates is (x1, y1, x2, y2)
        """
        orig_h, orig_w = original_shape[:2]
        bbox = face_details["bbox"]
        
        # Face dimensions and center
        face_center_x = (bbox[0] + bbox[2]) / 2
        face_center_y = (bbox[1] + bbox[3]) / 2
        face_height = bbox[3] - bbox[1]
        
        # Calculate target dimensions maintaining aspect ratio
        target_height = int(orig_w / self.config.TARGET_ASPECT_RATIO)
        target_width = orig_w
        
        if target_height > orig_h:
            # If calculated height exceeds image, use image height and adjust width
            target_height = orig_h
            target_width = int(orig_h * self.config.TARGET_ASPECT_RATIO)
        
        # Position face according to ICAO standards
        # Face should be positioned so chin-to-crown is appropriate ratio of total height
        desired_face_height_in_crop = target_height * self.config.CROP_TARGET_CHIN_TO_CROWN_RATIO
        scale_factor = desired_face_height_in_crop / face_height
        
        # Calculate where the top of the crop should be
        # Crown should be TOP_MARGIN_FINAL_PX from top of crop
        crown_y_in_original = bbox[1]  # Approximate crown as top of face bbox
        target_crown_y_in_crop = self.config.TOP_MARGIN_FINAL_PX / target_height * orig_h
        
        crop_top = crown_y_in_original - target_crown_y_in_crop
        crop_bottom = crop_top + target_height
        
        # Center horizontally on face
        crop_left = face_center_x - target_width / 2
        crop_right = crop_left + target_width
        
        # Ensure crop stays within image boundaries
        if crop_left < 0:
            crop_right -= crop_left
            crop_left = 0
        if crop_right > orig_w:
            crop_left -= (crop_right - orig_w)
            crop_right = orig_w
        if crop_top < 0:
            crop_bottom -= crop_top
            crop_top = 0
        if crop_bottom > orig_h:
            crop_top -= (crop_bottom - orig_h)
            crop_bottom = orig_h
        
        # Final boundary checks
        crop_left = max(0, crop_left)
        crop_right = min(orig_w, crop_right)
        crop_top = max(0, crop_top)
        crop_bottom = min(orig_h, crop_bottom)
        
        return (int(crop_left), int(crop_top), int(crop_right), int(crop_bottom)), None

    def _preliminary_background_check(self, image_bgr, face_bbox):
        """
        Quick check if background is light and uniform, or needs removal.
        
        Args:
            image_bgr (numpy.ndarray): Input image in BGR format
            face_bbox (numpy.ndarray): Face bounding box coordinates
            
        Returns:
            tuple: (is_background_ok, reason_message)
        """
        img_h, img_w = image_bgr.shape[:2]
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

    def process_image(self, original_image_bgr, faces):
        """
        Processes the image for validation: aligns, crops, and handles background.
        
        Args:
            original_image_bgr (numpy.ndarray): Original input image in BGR format
            faces (list): List of detected faces
            
        Returns:
            tuple: (processed_image, face_data, logs, success_flag)
        """
        logs = []
        
        # We now receive the faces from the compliance checker
        if not faces:
            logs.append(("FAIL", "Face Detection", "No face data provided to preprocessor."))
            return None, None, logs, False

        face_details, error = self._get_face_details_for_crop(faces)
        if error:
            logs.append(("FAIL", "Face Details", error))
            return None, None, logs, False
        logs.append(("INFO", "Preprocessing", "Face details extracted from original image."))

        # 2. Calculate crop box
        crop_coords, err = self._calculate_crop_coordinates(original_image_bgr.shape, face_details)
        if err:
            logs.append(("FAIL", "Preprocessing", f"Crop calculation failed: {err}"))
            return None, None, logs, False
        
        # 3. Crop and resize
        x1_c, y1_c, x2_c, y2_c = crop_coords
        cropped_bgr = original_image_bgr[y1_c:y2_c, x1_c:x2_c]
        if cropped_bgr.size == 0:
            logs.append(("FAIL", "Preprocessing", "Cropped image is empty."))
            return None, None, logs, False
            
        final_bgr = cv2.resize(
            cropped_bgr, 
            (self.config.FINAL_OUTPUT_WIDTH_PX, self.config.FINAL_OUTPUT_HEIGHT_PX), 
            interpolation=cv2.INTER_AREA
        )
        logs.append(("INFO", "Preprocessing", f"Cropped and resized to {self.config.FINAL_OUTPUT_WIDTH_PX}x{self.config.FINAL_OUTPUT_HEIGHT_PX}px."))

        # 4. Conditional Background Removal
        faces_final = self.face_analyzer.analyze_image(final_bgr)
        if faces_final:
            is_bg_ok, reason = self._preliminary_background_check(final_bgr, faces_final[0].bbox.astype(int))
            logs.append(("INFO", "Preprocessing", f"Preliminary BG check: {reason}"))
            
            if not is_bg_ok:
                logs.append(("INFO", "Preprocessing", "Attempting simple background removal."))
                try:
                    final_bgr = simple_background_removal(final_bgr, faces_final[0].bbox)
                    logs.append(("INFO", "Preprocessing", "Simple background removal applied."))
                except Exception as e:
                    logs.append(("WARNING", "Preprocessing", f"Background removal failed: {e}."))
        
        # 5. Re-analyze final image for validation
        face_analysis_on_final = self.face_analyzer.analyze_image(final_bgr)
        if not face_analysis_on_final:
            logs.append(("FAIL", "Preprocessing", "No face detected on the final preprocessed image."))
            return final_bgr, None, logs, False

        logs.append(("INFO", "Preprocessing", "Face analysis complete on final image."))
        return final_bgr, face_analysis_on_final[0], logs, True 