"""
Image preprocessing module for passport photo validation.
Handles cropping, resizing, and background removal operations.
"""

import cv2
import numpy as np
from google.cloud import vision
from lib.app_config import config
from types import SimpleNamespace

class ImagePreprocessor:
    """Handles image cropping and resizing for passport photo validation."""
    
    def __init__(self):
        """Initialize the ImagePreprocessor."""
        self.config = config.icao

    def _get_face_details_for_crop(self, face_annotation: vision.FaceAnnotation):
        """
        Extracts face details for cropping using the head's bounding polygon
        from the Google Vision API response, as per official recommendation.
        
        Args:
            face_annotation (vision.FaceAnnotation): Face annotation from Vision API.
            
        Returns:
            tuple: (face_details_dict, error_message)
        """
        # Per Google's recommendation, fd_bounding_poly is preferred for the full head.
        poly = face_annotation.fd_bounding_poly
        
    
        if not poly or not poly.vertices:
            return None, "Bounding polygon not found in face annotation."

        y_coords = [vertex.y for vertex in poly.vertices]
        x_coords = [vertex.x for vertex in poly.vertices]

        if not y_coords or not x_coords:
             return None, "Bounding polygon vertices are empty."

        crown_y = min(y_coords)
        chin_y = max(y_coords)
        
        bbox = np.array([min(x_coords), crown_y, max(x_coords), chin_y])

        return {
            "bbox": bbox,
            "chin_y": chin_y,
            "crown_y": crown_y
        }, None

    def _calculate_crop_coordinates(self, original_shape, face_details):
        """
        Calculates a robust crop box around the face based on ICAO standards.
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
        target_crop_h = head_height_px / self.config.target_head_height_ratio
        
        # Calculate target width based on the passport aspect ratio
        target_crop_w = target_crop_h * self.config.target_aspect_ratio

        # Center the crop box horizontally on the face center.
        face_cx = (bbox[0] + bbox[2]) / 2
        
        crop_x1 = face_cx - (target_crop_w / 2)
        crop_x2 = crop_x1 + target_crop_w
        
        # Position the crop vertically. ICAO mandates space above the head.
        # We use a ratio of the final image height to position the crown correctly
        # from the top of the frame.
        space_above_head = target_crop_h * self.config.head_pos_ratio_vertical
        crop_y1 = crown_y - space_above_head
        crop_y2 = crop_y1 + target_crop_h
        
        x1, y1, x2, y2 = map(int, [crop_x1, crop_y1, crop_x2, crop_y2])
        
        # Clip coordinates to the image dimensions
        x1, y1, x2, y2 = max(0, x1), max(0, y1), min(orig_w, x2), min(orig_h, y2)

        return (x1, y1, x2, y2)

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

    def process_image(self, original_image_bgr, face_annotation: vision.FaceAnnotation):
        """
        Processes the image for validation using Cloud Vision API response.
        Pipeline: Extract face details → Crop → Resize → Transform landmarks
        
        Args:
            original_image_bgr: Original image in BGR format
            face_annotation: Face annotation from Cloud Vision API
            
        Returns:
            tuple: (processed_bgr, face_data, logs, success)
        """
        logs = []
        
        # Step 1: Extract face details from Cloud Vision API response
        face_details, error = self._get_face_details_for_crop(face_annotation)
        if error:
            logs.append(("FAIL", "Preprocessing", error))
            return None, None, logs, False
        
        # Extract original landmarks from Cloud Vision API annotation
        original_landmarks = np.array([[lm.position.x, lm.position.y] for lm in face_annotation.landmarks])
        logs.append(("INFO", "Preprocessing", "Face details extracted from Cloud Vision API."))

        # Step 2: Calculate and apply crop using fdBoundingPoly
        crop_coords = self._calculate_crop_coordinates(original_image_bgr.shape, face_details)
        logs.append(("INFO", "Preprocessing", "Crop box calculated from fdBoundingPoly."))
        if not crop_coords:
            logs.append(("FAIL", "Preprocessing", "Crop calculation failed."))
            return None, None, logs, False

        x1, y1, x2, y2 = crop_coords
        cropped_bgr = original_image_bgr[y1:y2, x1:x2]
        if cropped_bgr.size == 0:
            logs.append(("FAIL", "Preprocessing", "Cropped image is empty."))
            return None, None, logs, False
        logs.append(("INFO", "Preprocessing", "Image cropped to ICAO standards."))

        # Step 3: Resize to final dimensions
        final_shape = (self.config.final_output_width_px, self.config.final_output_height_px)
        processed_bgr = cv2.resize(cropped_bgr, final_shape, interpolation=cv2.INTER_AREA)
        logs.append(("INFO", "Preprocessing", "Image resized to final dimensions."))

        # Step 4: Transform landmarks to final coordinate space
        transformed_landmarks = self._transform_landmarks(original_landmarks, crop_coords, final_shape)
        if transformed_landmarks is None:
            logs.append(("FAIL", "Preprocessing", "Landmark transformation failed."))
            return processed_bgr, None, logs, False
        
        # Step 5: Create final face data object for geometry validation
        final_face_data = SimpleNamespace(
            landmark_2d_106=transformed_landmarks
        )
        x_coords, y_coords = transformed_landmarks[:, 0], transformed_landmarks[:, 1]
        final_face_data.bbox = np.array([min(x_coords), min(y_coords), max(x_coords), max(y_coords)])
        
        logs.append(("PASS", "Preprocessing", "Image preprocessing complete."))
        return processed_bgr, final_face_data, logs, True 