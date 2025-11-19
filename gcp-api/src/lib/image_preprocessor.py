"""
Image preprocessing module for passport photo validation.
Handles cropping, resizing, and background removal.
"""

import cv2
import numpy as np
import logging
from google.cloud import vision
from rembg import remove, new_session
from lib.app_config import config
from types import SimpleNamespace

log = logging.getLogger(__name__)

class ImagePreprocessor:
    """Handles image cropping and resizing for passport photo validation."""
    
    def __init__(self):
        self.config = config.icao
        self.rembg_session = new_session("u2net_human_seg")

    def _get_face_details_for_crop(self, face_annotation: vision.FaceAnnotation):
        full_poly = face_annotation.bounding_poly
        if not full_poly or not full_poly.vertices:
             return None, "Full bounding polygon not found."
        
        true_crown_y = min([v.y for v in full_poly.vertices])
        fd_poly = face_annotation.fd_bounding_poly
        
        if not fd_poly or not fd_poly.vertices:
            return None, "FD bounding polygon not found."

        fd_y_coords = [v.y for v in fd_poly.vertices]
        fd_x_coords = [v.x for v in fd_poly.vertices]
        
        chin_y = max(fd_y_coords)
        bbox = np.array([min(fd_x_coords), true_crown_y, max(fd_x_coords), chin_y])

        return {
            "bbox": bbox,
            "chin_y": chin_y,
            "crown_y": true_crown_y
        }, None

    def _calculate_crop_coordinates(self, original_shape, face_details):
        orig_h, orig_w = original_shape[:2]
        bbox = face_details["bbox"]
        
        chin_y, crown_y = face_details["chin_y"], face_details["crown_y"]
        head_height_px = chin_y - crown_y
        
        if head_height_px <= 0:
            head_height_px = bbox[3] - bbox[1]

        target_crop_h = head_height_px / self.config.target_head_height_ratio
        target_crop_w = target_crop_h * self.config.target_aspect_ratio

        face_cx = (bbox[0] + bbox[2]) / 2
        
        crop_x1 = face_cx - (target_crop_w / 2)
        crop_x2 = crop_x1 + target_crop_w
        
        space_above_head = target_crop_h * self.config.head_pos_ratio_vertical
        crop_y1 = crown_y - space_above_head
        crop_y2 = crop_y1 + target_crop_h
        
        x1, y1, x2, y2 = map(int, [crop_x1, crop_y1, crop_x2, crop_y2])
        x1, y1, x2, y2 = max(0, x1), max(0, y1), min(orig_w, x2), min(orig_h, y2)

        return (x1, y1, x2, y2)

    def _transform_landmarks(self, landmarks, crop_box, final_shape):
        x1_c, y1_c, x2_c, y2_c = crop_box
        crop_w, crop_h = x2_c - x1_c, y2_c - y1_c
        
        if crop_w == 0 or crop_h == 0: return None

        final_w, final_h = final_shape
        shifted_landmarks = landmarks - [x1_c, y1_c]
        scale_x, scale_y = final_w / crop_w, final_h / crop_h
        
        return shifted_landmarks * [scale_x, scale_y]

    def _remove_background(self, image_bgr: np.ndarray) -> np.ndarray:
        output_rgba = remove(image_bgr, session=self.rembg_session, alpha_matting=True)
        white_background = np.ones_like(image_bgr) * 255
        alpha = output_rgba[:, :, 3:4] / 255.0
        
        return (output_rgba[:, :, :3] * alpha + white_background * (1 - alpha)).astype(np.uint8)

    def process_image(self, original_image_bgr, face_annotation: vision.FaceAnnotation):
        """
        Processes the image for validation.
        Pipeline: Extract details → Crop → Remove background → Resize → Transform landmarks
        """
        face_details, error = self._get_face_details_for_crop(face_annotation)
        if error:
            log.error(f"Preprocessing failed: {error}")
            return None, None, [], False
        
        original_landmarks = np.array([[lm.position.x, lm.position.y] for lm in face_annotation.landmarks])
        crop_coords = self._calculate_crop_coordinates(original_image_bgr.shape, face_details)
        
        if not crop_coords:
            log.error("Crop calculation failed")
            return None, None, [], False

        x1, y1, x2, y2 = crop_coords
        cropped_bgr = original_image_bgr[y1:y2, x1:x2]
        
        if cropped_bgr.size == 0:
            log.error("Cropped image is empty")
            return None, None, [], False

        try:
            cropped_bgr = self._remove_background(cropped_bgr)
        except Exception as e:
            log.warning(f"Background removal failed: {e}")

        final_shape = (self.config.final_output_width_px, self.config.final_output_height_px)
        processed_bgr = cv2.resize(cropped_bgr, final_shape, interpolation=cv2.INTER_AREA)

        transformed_landmarks = self._transform_landmarks(original_landmarks, crop_coords, final_shape)
        if transformed_landmarks is None:
            return processed_bgr, None, [], False
        
        crop_h = y2 - y1
        scale_y = final_shape[1] / crop_h
        
        final_crown_y = (face_details["crown_y"] - y1) * scale_y
        final_chin_y = (face_details["chin_y"] - y1) * scale_y
        
        x_coords = transformed_landmarks[:, 0]
        
        final_face_data = SimpleNamespace(
            landmark_2d_106=transformed_landmarks,
            bbox=np.array([min(x_coords), final_crown_y, max(x_coords), final_chin_y])
        )
        
        return processed_bgr, final_face_data, [], True
