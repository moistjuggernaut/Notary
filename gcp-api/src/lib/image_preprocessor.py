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
        Extracts face details using a hybrid approach:
        - 'bounding_poly' for the Crown (includes hair).
        - 'fd_bounding_poly' for the Chin (more accurate for face bottom).
        """
        # 1. Get the "True Crown" from the full bounding poly (includes hair)
        full_poly = face_annotation.bounding_poly
        if not full_poly or not full_poly.vertices:
             return None, "Full bounding polygon not found."
        
        # This is the top of the hair
        true_crown_y = min([v.y for v in full_poly.vertices])

        # 2. Get the "True Chin" from the tight fd_bounding_poly 
        # (This is usually more accurate for the chin position than the full box)
        fd_poly = face_annotation.fd_bounding_poly
        if not fd_poly or not fd_poly.vertices:
            return None, "FD bounding polygon not found."

        fd_y_coords = [v.y for v in fd_poly.vertices]
        fd_x_coords = [v.x for v in fd_poly.vertices]
        
        # Use the tight box for chin and width reference
        chin_y = max(fd_y_coords)
        
        # Create a hybrid bbox:
        # Top: Top of hair (bounding_poly)
        # Bottom: Chin (fd_bounding_poly)
        # Left/Right: Face width (fd_bounding_poly) - typically sufficient for centering
        bbox = np.array([min(fd_x_coords), true_crown_y, max(fd_x_coords), chin_y])

        return {
            "bbox": bbox,
            "chin_y": chin_y,
            "crown_y": true_crown_y # Now accurately represents top of hair
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
        
        # Step 5: Create final face data object with ACCURATE Head Dimensions
        # We must transform the Crown/Chin Y-coordinates to the new resized image space
        # so the validator measures the full head, not just the face features.
        
        crop_h = y2 - y1
        scale_y = final_shape[1] / crop_h
        
        # Transform the original crown/chin to the new coordinate space
        # Note: crop_coords = (x1, y1, x2, y2) from Step 2
        final_crown_y = (face_details["crown_y"] - y1) * scale_y
        final_chin_y = (face_details["chin_y"] - y1) * scale_y
        
        # Use landmarks for width (x-coords), but use the hybrid height for y-coords
        x_coords = transformed_landmarks[:, 0]
        
        final_face_data = SimpleNamespace(
            landmark_2d_106=transformed_landmarks,
            # The BBox is now: [Left_X, Crown_Y, Right_X, Chin_Y]
            # This ensures validation measures the full "ICAO Head Height"
            bbox=np.array([min(x_coords), final_crown_y, max(x_coords), final_chin_y])
        )
        
        logs.append(("PASS", "Preprocessing", "Image preprocessing complete."))
        return processed_bgr, final_face_data, logs, True