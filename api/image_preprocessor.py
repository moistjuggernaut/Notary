"""
Image preprocessing module for passport photo validation.
Handles cropping, resizing, and background removal operations.
"""

import cv2
import numpy as np
from .config import Config
from .face_analyzer import FaceAnalyzer

try:
    from rembg import remove as remove_background_rembg
    REMBG_AVAILABLE = True  
except ImportError:
    REMBG_AVAILABLE = False
    print("Warning: 'rembg' library not found. Background removal feature will be disabled.")
    print("Install it with: pip install rembg[cv2]")


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

    def _get_face_details_for_crop(self, faces_on_original):
        """
        Extract face details needed for cropping calculations.
        
        Args:
            faces_on_original (list): List of detected faces on original image
            
        Returns:
            tuple: (face_details dict, error_message)
        """
        if not faces_on_original or len(faces_on_original) == 0:
            return None, "No face detected on original image."
        
        if len(faces_on_original) > 1:
            return None, f"Multiple ({len(faces_on_original)}) faces detected."
        
        face = faces_on_original[0]
        if face.landmark_2d_106 is None or face.bbox is None:
            return None, "Landmarks or bounding box missing."

        landmarks = face.landmark_2d_106.astype(np.int32)
        bbox = face.bbox.astype(np.int32)

        chin_y = landmarks[self.config.CHIN_LANDMARK_INDEX][1]
        crown_y = bbox[1]  # Using top of bbox as crown proxy
        
        if chin_y <= crown_y:
            return None, "Invalid landmark geometry (chin above crown)."

        return {
            "chin_y_orig": chin_y,
            "crown_y_orig_approx": crown_y,
            "detected_chin_crown_orig_px": chin_y - crown_y,
            "face_center_x_orig": (bbox[0] + bbox[2]) / 2
        }, None

    def _calculate_crop_coordinates(self, img_shape, face_details):
        """
        Calculate precise crop coordinates on the original image.
        
        Args:
            img_shape (tuple): Shape of the original image (height, width, channels)
            face_details (dict): Face details from _get_face_details_for_crop
            
        Returns:
            tuple: (crop_coordinates, error_message)
        """
        img_h, img_w = img_shape[:2]

        target_chin_crown_px = self.config.CROP_TARGET_CHIN_TO_CROWN_RATIO * self.config.FINAL_OUTPUT_HEIGHT_PX
        scale = target_chin_crown_px / face_details["detected_chin_crown_orig_px"]
        
        if scale <= 0:
            return None, "Invalid crop scale factor."

        crop_h_orig = self.config.FINAL_OUTPUT_HEIGHT_PX / scale
        crop_w_orig = self.config.FINAL_OUTPUT_WIDTH_PX / scale

        top_margin_orig = self.config.TOP_MARGIN_FINAL_PX / scale
        
        y1 = int(face_details["crown_y_orig_approx"] - top_margin_orig)
        y2 = int(y1 + crop_h_orig)
        x1 = int(face_details["face_center_x_orig"] - (crop_w_orig / 2))
        x2 = int(x1 + crop_w_orig)

        # Boundary checks
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(img_w, x2), min(img_h, y2)

        if (y2 - y1) <= 0 or (x2 - x1) <= 0:
            return None, "Calculated crop dimensions are invalid."

        return (x1, y1, x2, y2), None

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

        is_light = np.all(mean_color >= self.config.BG_PRELIM_MIN_LIGHT_RGB)
        is_uniform = np.all(std_dev_color <= self.config.BG_PRELIM_STD_DEV_MAX)
        
        reason = []
        if not is_light:
            reason.append("not light enough")
        if not is_uniform:
            reason.append("not uniform")
            
        return is_light and is_uniform, f"BG check failed: {', '.join(reason)}." if reason else "BG appears OK."

    def process_image(self, original_image_bgr):
        """
        Main preprocessing function that crops, resizes, and optionally removes background.
        
        Args:
            original_image_bgr (numpy.ndarray): Original input image in BGR format
            
        Returns:
            tuple: (processed_image, face_data, logs, success_flag)
        """
        logs = []
        
        # 1. Analyze face on original image
        faces = self.face_analyzer.analyze_image(original_image_bgr)
        face_details, err = self._get_face_details_for_crop(faces)
        if err:
            logs.append(("FAIL", "Preprocessing", err))
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
                if REMBG_AVAILABLE:
                    logs.append(("INFO", "Preprocessing", "Attempting background removal."))
                    try:
                        output_rgba = remove_background_rembg(cv2.cvtColor(final_bgr, cv2.COLOR_BGR2RGB))
                        alpha = output_rgba[:, :, 3:4] / 255.0
                        white_bg = np.full(final_bgr.shape, 255, dtype=np.uint8)
                        final_bgr = (cv2.cvtColor(output_rgba, cv2.COLOR_RGBA_BGR) * alpha + white_bg * (1 - alpha)).astype(np.uint8)
                        logs.append(("INFO", "Preprocessing", "Background removal applied."))
                    except Exception as e:
                        logs.append(("WARNING", "Preprocessing", f"Background removal failed: {e}."))
                else:
                    logs.append(("WARNING", "Preprocessing", "Background may need removal, but 'rembg' is not available."))
        
        # 5. Re-analyze final image for validation
        face_analysis_on_final = self.face_analyzer.analyze_image(final_bgr)
        if not face_analysis_on_final:
            logs.append(("FAIL", "Preprocessing", "No face detected on the final preprocessed image."))
            return final_bgr, None, logs, False

        logs.append(("INFO", "Preprocessing", "Face analysis complete on final image."))
        return final_bgr, face_analysis_on_final[0], logs, True 