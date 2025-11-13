"""
Google Cloud Vision API-based photo validation module.
Validates processed photos against ICAO and country-specific requirements
using Google's specialized Cloud Vision API.
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
    """Data Transfer Object for the result of the initial validation."""
    def __init__(self, success: bool, face_annotation: Optional[vision.FaceAnnotation] = None, reason: Optional[GeminiStatusReason] = None, details: Optional[str] = None, raw_response_dict: Optional[Dict] = None):
        self.success = success
        self.face_annotation = face_annotation
        self.reason = reason
        self.details = details
        self.raw_response_dict = raw_response_dict


class GeminiStatusReason(str, Enum):
    """Enumeration of possible validation status reasons."""
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
        """Return a human-readable description for each status reason."""
        descriptions = {
            GeminiStatusReason.NO_FACE: "No face detected.",
            GeminiStatusReason.BG: "Background is not compliant with requirements.",
            GeminiStatusReason.POSE_DIR: "Head is not facing the camera directly.",
            GeminiStatusReason.POSE_CTR: "Head is not centered in the frame.",
            GeminiStatusReason.EXPR: "Expression is not neutral.",
            GeminiStatusReason.LIGHT: "Lighting issues detected (shadows, over/under exposure).",
            GeminiStatusReason.EYES_OBS: "Eyes are obscured.",
            GeminiStatusReason.EYES_CL: "Eyes appear closed.",
            GeminiStatusReason.GLS_GLARE: "Glare detected on glasses.",
            GeminiStatusReason.GLS_TINT: "Tinted glasses detected.",
            GeminiStatusReason.HD_COVER: "Head covering obscures portions of the face.",
            GeminiStatusReason.QUAL_BLUR: "Image is blurry or out of focus.",
            GeminiStatusReason.QUAL_REDEYE: "Red-eye effect detected.",
            GeminiStatusReason.CTRY_DIM: "Dimensions do not meet country-specific requirements.",
            GeminiStatusReason.CTRY_SPEC: "Does not meet country-specific requirements.",
            GeminiStatusReason.ICAO_OTH: "Other ICAO compliance issues detected.",
            GeminiStatusReason.INVALID_RESPONSE: "Invalid response from validation service.",
            GeminiStatusReason.PARSE_ERROR: "Error parsing validation response.",
            GeminiStatusReason.EMPTY_RESPONSE: "Empty response from validation service.",
            GeminiStatusReason.VALIDATION_ERROR: "An error occurred during validation.",
        }
        return descriptions.get(self, self.value)


class CloudVisionValidator:
    """Validates photos using Cloud Vision API for ICAO compliance checking."""
    
    # Validation thresholds
    LANDMARKING_CONFIDENCE_THRESHOLD = 0.6
    BACKGROUND_LIGHT_RGB_THRESHOLD = 200
    BACKGROUND_UNIFORMITY_THRESHOLD = 0.6
    BACKGROUND_SECONDARY_COLOR_THRESHOLD = 0.4
    HEAD_CENTERING_TOLERANCE_RATIO = 0.05
    SHOULDER_EXTENSION_THRESHOLD = 0.1
    RED_EYE_RGB_THRESHOLD = 150
    PUPIL_ROI_RADIUS_RATIO = 0.01
    PUPIL_ROI_MIN_RADIUS = 5
    EYE_LEVEL_RATIO = 1 / 3
    EYE_HORIZONTAL_OFFSET_RATIO = 0.15
    
    def __init__(self):
        """Initialize the CloudVisionValidator with configuration."""
        self.client = vision.ImageAnnotatorClient()
        self.config = config.icao
        
        # Likelihoods from Vision API that indicate failure.
        # Anything 'POSSIBLE' or higher is considered a failure.
        self.FAIL_LIKELIHOODS = {
            vision.Likelihood.POSSIBLE,
            vision.Likelihood.LIKELY,
            vision.Likelihood.VERY_LIKELY,
        }
        
    def _encode_image(self, image_bgr: np.ndarray) -> bytes:
        """Encode numpy array to JPEG bytes for the API."""
        success, buffer = cv2.imencode('.jpg', image_bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])
        if not success:
            raise ValueError("Failed to encode image as JPEG")
        return buffer.tobytes()

    # --- Validation Helper Methods ---

    def _validate_dimensions(self, face_data: SimpleNamespace, image_bgr: np.ndarray) -> Optional[GeminiStatusReason]:
        """
        Validate size and dimensions (CTRY_DIM).
        Checks aspect ratio and head height ratio (70-80% of image height).
        """
        img_h, img_w = image_bgr.shape[:2]
        
        # Check aspect ratio (35mm/45mm ≈ 0.778)
        aspect_ratio = img_w / img_h if img_h > 0 else 0
        target_ratio = self.config.target_aspect_ratio
        ratio_tolerance = self.config.aspect_ratio_tolerance
        
        if abs(aspect_ratio - target_ratio) > ratio_tolerance:
            log.warning(f"Aspect ratio mismatch: {aspect_ratio:.3f} vs target {target_ratio:.3f}")
            return GeminiStatusReason.CTRY_DIM
        
        # Extract head height from the bounding box in final_face_data
        if not hasattr(face_data, 'bbox'):
            log.warning("Could not get bounding box for dimension check")
            return None  # Don't fail if we can't check
        
        bbox = face_data.bbox
        head_height_px = bbox[3] - bbox[1] # y_max - y_min
        head_height_ratio = head_height_px / img_h if img_h > 0 else 0
        
        # Check if head height is between 70-80% (using config values)
        if head_height_ratio < self.config.min_chin_to_crown_ratio:
            log.warning(f"Head too small: {head_height_ratio:.2%} < {self.config.min_chin_to_crown_ratio:.2%}")
            return GeminiStatusReason.CTRY_DIM
        if head_height_ratio > self.config.max_chin_to_crown_ratio:
            log.warning(f"Head too large: {head_height_ratio:.2%} > {self.config.max_chin_to_crown_ratio:.2%}")
            return GeminiStatusReason.CTRY_DIM
        
        return None  # Pass

    def _validate_red_eye(self, image_bgr: np.ndarray, face: vision.FaceAnnotation) -> Optional[GeminiStatusReason]:
        """
        Validates for red-eye by inspecting the pupil regions, identified using
        precise landmarks from the Vision API.
        """
        # Get pupil landmarks from the API response
        landmarks_by_type = {lm.type_: lm for lm in face.landmarks}
        left_pupil = landmarks_by_type.get(vision.FaceAnnotation.Landmark.Type.LEFT_EYE_PUPIL)
        right_pupil = landmarks_by_type.get(vision.FaceAnnotation.Landmark.Type.RIGHT_EYE_PUPIL)

        if not left_pupil or not right_pupil:
            log.warning("Could not find pupil landmarks; skipping red-eye check.")
            return None  # Skip check if landmarks are not available

        # Calculate pupil ROI radius for red-eye detection
        pupil_roi_radius = max(self.PUPIL_ROI_MIN_RADIUS, int(image_bgr.shape[0] * self.PUPIL_ROI_RADIUS_RATIO))
        
        for eye_name, pupil_landmark in [("left", left_pupil), ("right", right_pupil)]:
            x, y = int(pupil_landmark.position.x), int(pupil_landmark.position.y)
            
            roi = image_bgr[max(0, y - pupil_roi_radius):min(image_bgr.shape[0], y + pupil_roi_radius),
                           max(0, x - pupil_roi_radius):min(image_bgr.shape[1], x + pupil_roi_radius)]
            
            if roi.size == 0:
                continue
            
            # Detection logic based on LearnOpenCV
            b, g, r = cv2.split(roi)
            # Use `cv2.add` to prevent overflow with uint8 arrays
            bg = cv2.add(b, g)
            
            # A pixel is considered red-eye if the red channel is bright and
            # more dominant than blue and green combined.
            mask = (r > self.RED_EYE_RGB_THRESHOLD) & (r > bg)
            
            red_pixel_count = np.count_nonzero(mask)
            total_pixels = roi.shape[0] * roi.shape[1]
            red_percentage = red_pixel_count / total_pixels if total_pixels > 0 else 0
            
            if red_percentage > self.config.red_eye_pixel_percentage_thresh:
                log.warning(f"Red-eye detected in {eye_name} eye: {red_percentage:.1%}")
                return GeminiStatusReason.QUAL_REDEYE
        
        return None  # Pass

    def _validate_background_dominant_colors(self, response: vision.AnnotateImageResponse) -> Optional[GeminiStatusReason]:
        """
        Validate background using image_properties.dominant_colors (BG).
        Checks if top color is light and uniform.
        """
        if not response.image_properties_annotation or not response.image_properties_annotation.dominant_colors:
            log.warning("No dominant colors available from API")
            return None  # Don't fail if data unavailable
        
        colors = response.image_properties_annotation.dominant_colors.colors
        
        if not colors or len(colors) == 0:
            log.warning("Empty dominant colors list")
            return None
        
        # Check top color: RGB values should be above threshold (light)
        top_color = colors[0]
        color_rgb = top_color.color
        if not hasattr(color_rgb, 'red') or not hasattr(color_rgb, 'green') or not hasattr(color_rgb, 'blue'):
            log.warning("Color RGB values not available")
            return None
        
        is_light = (color_rgb.red > self.BACKGROUND_LIGHT_RGB_THRESHOLD and 
                   color_rgb.green > self.BACKGROUND_LIGHT_RGB_THRESHOLD and 
                   color_rgb.blue > self.BACKGROUND_LIGHT_RGB_THRESHOLD)
        
        # Check pixel_fraction for uniformity
        is_uniform = top_color.pixel_fraction > self.BACKGROUND_UNIFORMITY_THRESHOLD
        
        if not is_light:
            log.warning(f"Background color not light enough: RGB({color_rgb.red}, {color_rgb.green}, {color_rgb.blue})")
            return GeminiStatusReason.BG
        
        if not is_uniform:
            log.warning(f"Background not uniform: top color fraction {top_color.pixel_fraction:.2%}")
            return GeminiStatusReason.BG
        
        # Check if multiple colors have high fractions
        if len(colors) > 1 and colors[1].pixel_fraction > self.BACKGROUND_SECONDARY_COLOR_THRESHOLD:
            log.warning(f"Multiple dominant colors detected: top={colors[0].pixel_fraction:.2%}, second={colors[1].pixel_fraction:.2%}")
            return GeminiStatusReason.BG
        
        return None  # Pass

    def _validate_head_centered(self, face_data: SimpleNamespace, image_bgr: np.ndarray) -> Optional[GeminiStatusReason]:
        """
        Validate head is centered horizontally (POSE_CTR).
        Checks if the face center is within an acceptable tolerance of the image center.
        """
        if not hasattr(face_data, 'bbox'):
            log.warning("Could not get bounding box for centering check")
            return None
        
        img_w = image_bgr.shape[1]
        image_center_x = img_w / 2
        
        bbox = face_data.bbox
        face_left = bbox[0]
        face_right = bbox[2]
        face_center_x = (face_left + face_right) / 2
        
        # Check if face is centered within tolerance ratio
        offset_px = abs(face_center_x - image_center_x)
        offset_threshold = img_w * self.HEAD_CENTERING_TOLERANCE_RATIO
        
        if offset_px > offset_threshold:
            log.warning(f"Head not centered: offset {offset_px:.1f}px > threshold {offset_threshold:.1f}px")
            return GeminiStatusReason.POSE_CTR
        
        return None  # Pass

    def _validate_shoulders_visible(self, face: vision.FaceAnnotation) -> Optional[GeminiStatusReason]:
        """
        Validates that shoulders are likely visible by checking for the presence
        of shoulder landmarks in the API response.
        """
        landmarks_by_type = {lm.type_: lm for lm in face.landmarks}
        
        has_left_shoulder = vision.FaceAnnotation.Landmark.Type.LEFT_SHOULDER in landmarks_by_type
        has_right_shoulder = vision.FaceAnnotation.Landmark.Type.RIGHT_SHOULDER in landmarks_by_type

        if has_left_shoulder and has_right_shoulder:
            return None  # Pass: Both shoulders are detected.
        
        log.warning("Shoulder landmarks not detected; shoulders may not be visible.")
        return GeminiStatusReason.ICAO_OTH

    def _validate_eyes_visible(self, face: vision.FaceAnnotation) -> Optional[GeminiStatusReason]:
        """
        Validate eyes are clearly visible (EYES_OBS).
        Checks landmarking_confidence - low confidence suggests obscured eyes.
        """
        if hasattr(face, 'landmarking_confidence'):
            if face.landmarking_confidence < self.LANDMARKING_CONFIDENCE_THRESHOLD:
                log.warning(f"Low landmarking confidence: {face.landmarking_confidence:.2f} - eyes may be obscured")
                return GeminiStatusReason.EYES_OBS
        
        return None  # Pass

    def _validate_glasses_glare(self, response: vision.AnnotateImageResponse, face: vision.FaceAnnotation) -> Optional[GeminiStatusReason]:
        """
        Validates for glasses glare. This is a heuristic check.
        If glasses are detected but the primary eye landmarks are missing,
        it suggests they are obscured, possibly by glare.
        """
        # First, check if glasses are detected via label annotations
        has_glasses = False
        if response.label_annotations:
            for label in response.label_annotations:
                if "glasses" in label.description.lower() or "eyeglass" in label.description.lower():
                    has_glasses = True
                    break
        
        if not has_glasses:
            return None  # No glasses, no glare to check for.
        
        # If glasses are present, check for the main eye landmarks.
        # Their absence is a strong indicator of obscuration/glare.
        landmarks_by_type = {lm.type_: lm for lm in face.landmarks}
        has_left_eye = vision.FaceAnnotation.Landmark.Type.LEFT_EYE in landmarks_by_type
        has_right_eye = vision.FaceAnnotation.Landmark.Type.RIGHT_EYE in landmarks_by_type
        
        if has_left_eye and has_right_eye:
            return None  # Pass: Both eyes are clearly landmarked.
            
        log.warning("Glasses detected, but eye landmarks are missing. Possible glare.")
        return GeminiStatusReason.GLS_GLARE

    def _build_response(self, status: str, reason: Optional[GeminiStatusReason] = None, raw_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Build a standardized response dictionary for validation results.
        
        Args:
            status: One of "COMPLIANT", "NON_COMPLIANT", or "ERROR"
            reason: Optional reason code for non-compliant or error status
            raw_data: Optional additional data to include in validation_response
            
        Returns:
            Standardized response dictionary
        """
        if status == "COMPLIANT":
            return {
                "success": True,
                "status": "COMPLIANT",
                "validation_response": raw_data or {}
            }
        
        # Handle ERROR and NON_COMPLIANT
        reason_enum = reason or GeminiStatusReason.VALIDATION_ERROR
        return {
            "success": False,
            "status": "ERROR" if status == "ERROR" else "NON_COMPLIANT",
            "status_reason": reason_enum.value,
            "status_reason_description": reason_enum.description,
            "error": reason_enum.description if status == "ERROR" else None,
            "validation_response": raw_data or {}
        }

    def _run_initial_checks(self, response: vision.AnnotateImageResponse, image_bgr: np.ndarray) -> Dict[str, Any]:
        """
        Orchestrates all non-geometric ICAO validation checks on the Cloud Vision API response.
        """
        face = response.face_annotations[0]

        # 1. QUAL_BLUR: Image is blurry
        if face.blurred_likelihood in self.FAIL_LIKELIHOODS:
            return self._build_response("NON_COMPLIANT", GeminiStatusReason.QUAL_BLUR, {"details": "Image appears blurry"})
        
        # 2. QUAL_REDEYE: Red-eye detection
        redeye_reason = self._validate_red_eye(image_bgr, face)
        if redeye_reason:
            return self._build_response("NON_COMPLIANT", redeye_reason, {"details": "Red-eye detected"})
        
        # 3. LIGHT: Uneven lighting, shadows, under-exposed
        if face.under_exposed_likelihood in self.FAIL_LIKELIHOODS:
            return self._build_response("NON_COMPLIANT", GeminiStatusReason.LIGHT, {"details": "Image appears under-exposed"})
        
        # 4. POSE_DIR: Head is tilted, rotated, or not facing camera
        if abs(face.roll_angle) > self.config.max_abs_roll:
            return self._build_response("NON_COMPLIANT", GeminiStatusReason.POSE_DIR, {"details": f"Roll angle: {face.roll_angle:.1f}°"})
        if abs(face.pan_angle) > self.config.max_abs_yaw:
            return self._build_response("NON_COMPLIANT", GeminiStatusReason.POSE_DIR, {"details": f"Pan angle (yaw): {face.pan_angle:.1f}°"})
        if abs(face.tilt_angle) > self.config.max_abs_pitch:
             return self._build_response("NON_COMPLIANT", GeminiStatusReason.POSE_DIR, {"details": f"Tilt angle (pitch): {face.tilt_angle:.1f}°"})

        # 5. EXPR: Non-neutral expression
        if face.joy_likelihood in self.FAIL_LIKELIHOODS:
            return self._build_response("NON_COMPLIANT", GeminiStatusReason.EXPR, {"details": "Joy detected"})
        if face.sorrow_likelihood in self.FAIL_LIKELIHOODS:
            return self._build_response("NON_COMPLIANT", GeminiStatusReason.EXPR, {"details": "Sorrow detected"})
        if face.anger_likelihood in self.FAIL_LIKELIHOODS:
            return self._build_response("NON_COMPLIANT", GeminiStatusReason.EXPR, {"details": "Anger detected"})
        
        # 6. EYES_OBS: Eyes clearly visible
        eyes_obs_reason = self._validate_eyes_visible(face)
        if eyes_obs_reason:
            return self._build_response("NON_COMPLIANT", eyes_obs_reason, {"details": "Eyes may be obscured"})
        
        # 7. GLS_GLARE: Glasses glare (heuristic)
        glare_reason = self._validate_glasses_glare(response, face)
        if glare_reason:
            return self._build_response("NON_COMPLIANT", glare_reason, {"details": "Possible glare on glasses"})
        
        # 8. GLS_TINT: Tinted glasses (using Label Detection)
        if response.label_annotations:
            for label in response.label_annotations:
                if "sunglasses" in label.description.lower():
                     return self._build_response("NON_COMPLIANT", GeminiStatusReason.GLS_TINT, {"details": "Sunglasses detected"})
                     
        # 9. HD_COVER: Head covering
        if face.headwear_likelihood in self.FAIL_LIKELIHOODS:
             return self._build_response("NON_COMPLIANT", GeminiStatusReason.HD_COVER, {"details": "Headwear detected"})

        # If all checks passed:
        return self._build_response("COMPLIANT")

    def validate_initial(self, image_bgr: np.ndarray) -> InitialValidationResult:
        """
        Performs the initial validation on the original, unprocessed image.
        This includes a single API call and all non-geometric checks.
        """
        try:
            log.info("Starting initial Cloud Vision validation...")
            
            image_bytes = self._encode_image(image_bgr)
            image = vision.Image(content=image_bytes)
            
            features = [
                vision.Feature(type_=vision.Feature.Type.FACE_DETECTION, max_results=1),
                vision.Feature(type_=vision.Feature.Type.LABEL_DETECTION, max_results=5),
                vision.Feature(type_=vision.Feature.Type.IMAGE_PROPERTIES),
                vision.Feature(type_=vision.Feature.Type.OBJECT_LOCALIZATION),
            ]
            
            request = vision.AnnotateImageRequest(image=image, features=features)
            
            log.info("Calling Cloud Vision API for initial validation...")
            response = self.client.annotate_image(request=request)
            log.info(f"Cloud Vision API response: {response}")
            raw_response_dict = vision.AnnotateImageResponse.to_dict(response)
            
            if response.error.message:
                log.error(f"Cloud Vision API error: {response.error.message}")
                return InitialValidationResult(success=False, reason=GeminiStatusReason.VALIDATION_ERROR, details=response.error.message, raw_response_dict=raw_response_dict)
            
            if not response.face_annotations:
                log.warning("No face detected in initial validation.")
                return InitialValidationResult(success=False, reason=GeminiStatusReason.NO_FACE, raw_response_dict=raw_response_dict)

            if len(response.face_annotations) > 1:
                log.warning(f"Multiple faces ({len(response.face_annotations)}) detected in initial validation.")
                return InitialValidationResult(success=False, reason=GeminiStatusReason.ICAO_OTH, details=f"Multiple faces detected: {len(response.face_annotations)}", raw_response_dict=raw_response_dict)

            initial_check_result = self._run_initial_checks(response, image_bgr)
            
            if not initial_check_result["success"]:
                log.warning(f"Initial validation failed: {initial_check_result.get('status_reason')}")
                return InitialValidationResult(
                    success=False,
                    reason=GeminiStatusReason(initial_check_result.get("status_reason")),
                    details=initial_check_result.get("validation_response", {}).get("details"),
                    raw_response_dict=raw_response_dict
                )

            log.info("Initial validation passed.")
            return InitialValidationResult(success=True, face_annotation=response.face_annotations[0], raw_response_dict=raw_response_dict)

        except Exception as e:
            log.error(f"Error during initial Cloud Vision validation: {e}", exc_info=True)
            return InitialValidationResult(success=False, reason=GeminiStatusReason.VALIDATION_ERROR, details=str(e))

    def validate_final_geometry(self, processed_bgr: np.ndarray, final_face_data: SimpleNamespace) -> Dict[str, Any]:
        """
        Performs the final geometric checks on the processed and cropped image.
        This method does NOT make any API calls.
        """
        log.info("Starting final geometry validation...")

        # 1. CTRY_DIM: Size & Dimensions (aspect ratio and head height ratio)
        dim_reason = self._validate_dimensions(final_face_data, processed_bgr)
        if dim_reason:
            return self._build_response("NON_COMPLIANT", dim_reason, {"details": "Final image size/dimension requirements not met"})
        
        # 2. POSE_CTR: Head centered horizontally
        ctr_reason = self._validate_head_centered(final_face_data, processed_bgr)
        if ctr_reason:
            return self._build_response("NON_COMPLIANT", ctr_reason, {"details": "Head not centered in final image"})
            
        log.info("Final geometry validation passed.")
        return self._build_response("COMPLIANT")