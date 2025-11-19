"""
Main compliance checker orchestrator.
"""
from __future__ import annotations

import logging

from lib.app_config import config
from lib.image_preprocessor import ImagePreprocessor
from lib.constants import ComplianceStatus, ReasonCode 
from lib.cloud_vision_validator import CloudVisionValidator

log = logging.getLogger(__name__)

class ComplianceChecker:
    """
    Orchestrates the full photo validation process.
    """
    
    def __init__(self):
        log.info("Initializing ComplianceChecker...")
        self.validator = CloudVisionValidator()
        self.preprocessor = ImagePreprocessor()
        self.config = config.icao

    def _get_final_status(self, validation_result: dict) -> dict:
        """Determines the final status based on validation result."""
        if validation_result.get("status") == "COMPLIANT":
            return {
                "success": True,
                "status": ComplianceStatus.COMPLIANT,
                "reason_code": ReasonCode.ALL_CHECKS_PASSED
            }

        validator_reason = validation_result.get("status_reason", ReasonCode.UNKNOWN_REASON)
        reason_desc = (
            validation_result.get("status_reason_description") or 
            validation_result.get("error") or 
            "Unknown validation failure"
        )

        return {
            "success": False,
            "status": ComplianceStatus.REJECTED,
            "reason_code": ReasonCode.VALIDATION_FAILED,
            "details": {
                "validator_reason_code": validator_reason,
                "validator_reason_description": reason_desc
            }
        }

    def check_image_array(self, image_bgr) -> tuple[dict, object]:
        """
        Runs the compliance check:
        1. Cloud Vision API & Initial Checks
        2. Preprocessing (Crop, Resize, BG Removal)
        3. Final Geometry Validation
        """
        if image_bgr is None:
            return {"success": False, "status": ComplianceStatus.REJECTED, "reason_code": ReasonCode.INVALID_IMAGE_DATA}, None

        try:
            # 1. Initial Validation
            log.info("Validating initial image...")
            initial_result = self.validator.validate_initial(image_bgr)
            
            if not initial_result.success:
                log.info(f"Initial validation failed: {initial_result.reason}")
                return {
                    "success": False,
                    "status": ComplianceStatus.REJECTED,
                    "reason_code": ReasonCode.VALIDATION_FAILED,
                    "details": {
                        "validator_reason_code": initial_result.reason.value,
                        "validator_reason_description": initial_result.details or initial_result.reason.description
                    }
                }, None
            
            # 2. Preprocessing
            log.info("Processing image...")
            processed_bgr, face_data, _, success = self.preprocessor.process_image(
                image_bgr, 
                initial_result.face_annotation
            )
            
            if not success or processed_bgr is None:
                log.warning("Image preprocessing failed")
                return {
                    "success": False,
                    "status": ComplianceStatus.REJECTED,
                    "reason_code": ReasonCode.PREPROCESSING_FAILED
                }, None
            
            # 3. Final Geometry Validation
            log.info("Validating final geometry...")
            geometry_result = self.validator.validate_final_geometry(processed_bgr, face_data)
            
            return self._get_final_status(geometry_result), processed_bgr

        except Exception as e:
            log.error(f"Validation error: {e}", exc_info=True)
            return {"success": False, "status": ComplianceStatus.REJECTED, "reason_code": ReasonCode.INTERNAL_SERVER_ERROR, "details": {"error": str(e)}}, None
