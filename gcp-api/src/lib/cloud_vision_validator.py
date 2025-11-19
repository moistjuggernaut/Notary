"""
Google Cloud Vision API-based photo validation module.
"""

from __future__ import annotations

import logging
import cv2
import numpy as np
from enum import Enum
from typing import Dict, Any, Optional
from types import SimpleNamespace

from google.cloud import vision
from lib.app_config import config

log = logging.getLogger(__name__)


class InitialValidationResult:
    """DTO for the result of the initial validation."""
    def __init__(self, success: bool, face_annotation: Optional[vision.FaceAnnotation] = None, reason: Optional[ValidationReason] = None, details: Optional[str] = None, raw_response_dict: Optional[Dict] = None):
        self.success = success
        self.face_annotation = face_annotation
        self.reason = reason
        self.details = details
        self.raw_response_dict = raw_response_dict


class ValidationReason(str, Enum):
    """Validation status reasons."""
    NO_FACE = "NO_FACE"
    BG = "BG"
    POSE_DIR = "POSE_DIR"
    POSE_CTR = "POSE_CTR"
    EXPR = "EXPR"
    LIGHT = "LIGHT"
    EYES_OBS = "EYES_OBS"
    EYES_CL = "EYES_CL"
    GLS_GLARE = "GLS_GLARE"
    GLS_TINT = "GLS_TINT"
    HD_COVER = "HD_COVER"
    QUAL_BLUR = "QUAL_BLUR"
    QUAL_REDEYE = "QUAL_REDEYE"
    CTRY_DIM = "CTRY_DIM"
    CTRY_SPEC = "CTRY_SPEC"
    ICAO_OTH = "ICAO_OTH"
    INVALID_RESPONSE = "INVALID_RESPONSE"
    PARSE_ERROR = "PARSE_ERROR"
    EMPTY_RESPONSE = "EMPTY_RESPONSE"
    VALIDATION_ERROR = "VALIDATION_ERROR"

    @property
    def description(self) -> str:
        descriptions = {
            ValidationReason.NO_FACE: "No face detected.",
            ValidationReason.BG: "Background invalid.",
            ValidationReason.POSE_DIR: "Head tilt/rotation.",
            ValidationReason.POSE_CTR: "Head not centered.",
            ValidationReason.EXPR: "Expression not neutral.",
            ValidationReason.LIGHT: "Lighting issues.",
            ValidationReason.EYES_OBS: "Eyes obscured.",
            ValidationReason.EYES_CL: "Eyes closed.",
            ValidationReason.GLS_GLARE: "Glasses glare.",
            ValidationReason.GLS_TINT: "Tinted glasses.",
            ValidationReason.HD_COVER: "Head covering.",
            ValidationReason.QUAL_BLUR: "Blurry image.",
            ValidationReason.QUAL_REDEYE: "Red-eye detected.",
            ValidationReason.CTRY_DIM: "Invalid dimensions.",
            ValidationReason.CTRY_SPEC: "Specific rule violation.",
            ValidationReason.ICAO_OTH: "ICAO compliance issue.",
            ValidationReason.INVALID_RESPONSE: "Invalid service response.",
            ValidationReason.PARSE_ERROR: "Response parsing error.",
            ValidationReason.EMPTY_RESPONSE: "Empty response.",
            ValidationReason.VALIDATION_ERROR: "Validation error.",
        }
        return descriptions.get(self, self.value)


class CloudVisionValidator:
    """Validates photos using Cloud Vision API."""
    
    # Validation thresholds
    LANDMARKING_CONFIDENCE_THRESHOLD = 0.6
    BACKGROUND_LIGHT_RGB_THRESHOLD = 200
    BACKGROUND_UNIFORMITY_THRESHOLD = 0.6
    BACKGROUND_SECONDARY_COLOR_THRESHOLD = 0.4
    HEAD_CENTERING_TOLERANCE_RATIO = 0.05
    RED_EYE_RGB_THRESHOLD = 150
    PUPIL_ROI_RADIUS_RATIO = 0.01
    PUPIL_ROI_MIN_RADIUS = 5
    
    def __init__(self):
        self.client = vision.ImageAnnotatorClient()
        self.config = config.icao
        
        self.FAIL_LIKELIHOODS = {
            vision.Likelihood.POSSIBLE,
            vision.Likelihood.LIKELY,
            vision.Likelihood.VERY_LIKELY,
        }
        
    def _encode_image(self, image_bgr: np.ndarray) -> bytes:
        success, buffer = cv2.imencode('.jpg', image_bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])
        if not success:
            raise ValueError("Failed to encode image as JPEG")
        return buffer.tobytes()

    def _validate_dimensions(self, face_data: SimpleNamespace, image_bgr: np.ndarray) -> Optional[ValidationReason]:
        img_h, img_w = image_bgr.shape[:2]
        aspect_ratio = img_w / img_h if img_h > 0 else 0
        target_ratio = self.config.target_aspect_ratio
        
        if abs(aspect_ratio - target_ratio) > self.config.aspect_ratio_tolerance:
            return ValidationReason.CTRY_DIM
        
        if not hasattr(face_data, 'bbox'):
            return None
        
        bbox = face_data.bbox
        head_height_px = bbox[3] - bbox[1]
        head_height_ratio = head_height_px / img_h if img_h > 0 else 0
        
        if head_height_ratio < self.config.min_chin_to_crown_ratio:
            return ValidationReason.CTRY_DIM
        if head_height_ratio > self.config.max_chin_to_crown_ratio:
            return ValidationReason.CTRY_DIM
        
        return None

    def _validate_red_eye(self, image_bgr: np.ndarray, face: vision.FaceAnnotation) -> Optional[ValidationReason]:
        landmarks_by_type = {lm.type_: lm for lm in face.landmarks}
        left_pupil = landmarks_by_type.get(vision.FaceAnnotation.Landmark.Type.LEFT_EYE_PUPIL)
        right_pupil = landmarks_by_type.get(vision.FaceAnnotation.Landmark.Type.RIGHT_EYE_PUPIL)

        if not left_pupil or not right_pupil:
            return None

        pupil_roi_radius = max(self.PUPIL_ROI_MIN_RADIUS, int(image_bgr.shape[0] * self.PUPIL_ROI_RADIUS_RATIO))
        
        for _, pupil_landmark in [("left", left_pupil), ("right", right_pupil)]:
            x, y = int(pupil_landmark.position.x), int(pupil_landmark.position.y)
            roi = image_bgr[max(0, y - pupil_roi_radius):min(image_bgr.shape[0], y + pupil_roi_radius),
                           max(0, x - pupil_roi_radius):min(image_bgr.shape[1], x + pupil_roi_radius)]
            
            if roi.size == 0: continue
            
            b, g, r = cv2.split(roi)
            bg = cv2.add(b, g)
            mask = (r > self.RED_EYE_RGB_THRESHOLD) & (r > bg)
            
            if np.count_nonzero(mask) / (roi.shape[0] * roi.shape[1]) > self.config.red_eye_pixel_percentage_thresh:
                return ValidationReason.QUAL_REDEYE
        
        return None

    def _validate_background_dominant_colors(self, response: vision.AnnotateImageResponse) -> Optional[ValidationReason]:
        if not response.image_properties_annotation or not response.image_properties_annotation.dominant_colors:
            return None
        
        colors = response.image_properties_annotation.dominant_colors.colors
        if not colors: return None
        
        top_color = colors[0]
        rgb = top_color.color
        
        if not (rgb.red > self.BACKGROUND_LIGHT_RGB_THRESHOLD and 
                rgb.green > self.BACKGROUND_LIGHT_RGB_THRESHOLD and 
                rgb.blue > self.BACKGROUND_LIGHT_RGB_THRESHOLD):
            return ValidationReason.BG
        
        if top_color.pixel_fraction <= self.BACKGROUND_UNIFORMITY_THRESHOLD:
            return ValidationReason.BG
        
        if len(colors) > 1 and colors[1].pixel_fraction > self.BACKGROUND_SECONDARY_COLOR_THRESHOLD:
            return ValidationReason.BG
        
        return None

    def _validate_head_centered(self, face_data: SimpleNamespace, image_bgr: np.ndarray) -> Optional[ValidationReason]:
        if not hasattr(face_data, 'bbox'): return None
        
        img_w = image_bgr.shape[1]
        bbox = face_data.bbox
        face_center_x = (bbox[0] + bbox[2]) / 2
        
        if abs(face_center_x - (img_w / 2)) > (img_w * self.HEAD_CENTERING_TOLERANCE_RATIO):
            return ValidationReason.POSE_CTR
        
        return None

    def _validate_eyes_visible(self, face: vision.FaceAnnotation) -> Optional[ValidationReason]:
        if face.landmarking_confidence < self.LANDMARKING_CONFIDENCE_THRESHOLD:
            return ValidationReason.EYES_OBS
        return None

    def _validate_glasses_glare(self, response: vision.AnnotateImageResponse, face: vision.FaceAnnotation) -> Optional[ValidationReason]:
        has_glasses = any("glasses" in l.description.lower() or "eyeglass" in l.description.lower() 
                         for l in (response.label_annotations or []))
        
        if not has_glasses: return None
        
        landmarks = {lm.type_: lm for lm in face.landmarks}
        if vision.FaceAnnotation.Landmark.Type.LEFT_EYE in landmarks and \
           vision.FaceAnnotation.Landmark.Type.RIGHT_EYE in landmarks:
            return None
            
        return ValidationReason.GLS_GLARE

    def _build_response(self, status: str, reason: Optional[ValidationReason] = None, raw_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if status == "COMPLIANT":
            return {"success": True, "status": "COMPLIANT", "validation_response": raw_data or {}}
        
        reason_enum = reason or ValidationReason.VALIDATION_ERROR
        return {
            "success": False,
            "status": "ERROR" if status == "ERROR" else "NON_COMPLIANT",
            "status_reason": reason_enum.value,
            "status_reason_description": reason_enum.description,
            "error": reason_enum.description if status == "ERROR" else None,
            "validation_response": raw_data or {}
        }

    def _run_initial_checks(self, response: vision.AnnotateImageResponse, image_bgr: np.ndarray) -> Dict[str, Any]:
        face = response.face_annotations[0]

        if face.blurred_likelihood in self.FAIL_LIKELIHOODS:
            return self._build_response("NON_COMPLIANT", ValidationReason.QUAL_BLUR)
        
        if (reason := self._validate_red_eye(image_bgr, face)):
            return self._build_response("NON_COMPLIANT", reason)
        
        if face.under_exposed_likelihood in self.FAIL_LIKELIHOODS:
            return self._build_response("NON_COMPLIANT", ValidationReason.LIGHT)
        
        if abs(face.roll_angle) > self.config.max_abs_roll or \
           abs(face.pan_angle) > self.config.max_abs_yaw or \
           abs(face.tilt_angle) > self.config.max_abs_pitch:
            return self._build_response("NON_COMPLIANT", ValidationReason.POSE_DIR)

        if any(l in self.FAIL_LIKELIHOODS for l in [face.joy_likelihood, face.sorrow_likelihood, face.anger_likelihood]):
            return self._build_response("NON_COMPLIANT", ValidationReason.EXPR)
        
        if (reason := self._validate_eyes_visible(face)):
            return self._build_response("NON_COMPLIANT", reason)
        
        if (reason := self._validate_glasses_glare(response, face)):
            return self._build_response("NON_COMPLIANT", reason)
        
        if any("sunglasses" in l.description.lower() for l in (response.label_annotations or [])):
            return self._build_response("NON_COMPLIANT", ValidationReason.GLS_TINT)
            
        if face.headwear_likelihood in self.FAIL_LIKELIHOODS:
             return self._build_response("NON_COMPLIANT", ValidationReason.HD_COVER)

        return self._build_response("COMPLIANT")

    def validate_initial(self, image_bgr: np.ndarray) -> InitialValidationResult:
        try:
            image_bytes = self._encode_image(image_bgr)
            image = vision.Image(content=image_bytes)
            
            features = [
                vision.Feature(type_=vision.Feature.Type.FACE_DETECTION, max_results=1),
                vision.Feature(type_=vision.Feature.Type.LABEL_DETECTION, max_results=5),
                vision.Feature(type_=vision.Feature.Type.IMAGE_PROPERTIES),
                vision.Feature(type_=vision.Feature.Type.OBJECT_LOCALIZATION),
            ]
            
            response = self.client.annotate_image(request=vision.AnnotateImageRequest(image=image, features=features))
            raw_response = vision.AnnotateImageResponse.to_dict(response)
            
            if response.error.message:
                return InitialValidationResult(success=False, reason=ValidationReason.VALIDATION_ERROR, details=response.error.message, raw_response_dict=raw_response)
            
            if not response.face_annotations:
                return InitialValidationResult(success=False, reason=ValidationReason.NO_FACE, raw_response_dict=raw_response)

            if len(response.face_annotations) > 1:
                return InitialValidationResult(success=False, reason=ValidationReason.ICAO_OTH, details="Multiple faces", raw_response_dict=raw_response)

            result = self._run_initial_checks(response, image_bgr)
            
            if not result["success"]:
                return InitialValidationResult(
                    success=False,
                    reason=ValidationReason(result.get("status_reason")),
                    details=result.get("validation_response", {}).get("details"),
                    raw_response_dict=raw_response
                )

            return InitialValidationResult(success=True, face_annotation=response.face_annotations[0], raw_response_dict=raw_response)

        except Exception as e:
            log.error(f"Validation error: {e}", exc_info=True)
            return InitialValidationResult(success=False, reason=ValidationReason.VALIDATION_ERROR, details=str(e))

    def validate_final_geometry(self, processed_bgr: np.ndarray, final_face_data: SimpleNamespace) -> Dict[str, Any]:
        if (reason := self._validate_dimensions(final_face_data, processed_bgr)):
            return self._build_response("NON_COMPLIANT", reason)
        
        if (reason := self._validate_head_centered(final_face_data, processed_bgr)):
            return self._build_response("NON_COMPLIANT", reason)
            
        return self._build_response("COMPLIANT")
