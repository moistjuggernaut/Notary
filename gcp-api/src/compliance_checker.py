"""
Main compliance checker orchestrator.
Coordinates the complete photo validation workflow.
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
    Orchestrates the full photo validation process using Google Cloud Vision.
    
    Validation Flow:
    1. Call Cloud Vision API
    2. Perform initial checks (non-geometric)
    3. Process image using Cloud Vision response
    4. Perform final geometry validation
    5. Prepare and return final result
    """
    
    def __init__(self):
        """Initializes the ComplianceChecker orchestrator."""
        log.info("Initializing ComplianceChecker orchestrator...")
        self.validator = CloudVisionValidator()
        self.preprocessor = ImagePreprocessor()
        self.config = config.icao
        log.info("ComplianceChecker orchestrator initialized.")

    def _get_final_status(self, validation_result: dict) -> dict:
        """
        Determines the final status data based on a validation result dictionary.
        This can be used for both initial and final geometry validation results.
        """
        if validation_result.get("status") == "COMPLIANT":
            return {
                "success": True,
                "status": ComplianceStatus.COMPLIANT,
                "reason_code": ReasonCode.ALL_CHECKS_PASSED
            }

        # Get a machine-readable code from the validator if available
        validator_reason_code = validation_result.get("status_reason", ReasonCode.UNKNOWN_REASON)
        reason_details = (
            validation_result.get("status_reason_description")
            or validation_result.get("error")
            or "Unknown validation failure"
        )

        return {
            "success": False,
            "status": ComplianceStatus.REJECTED,
            "reason_code": ReasonCode.VALIDATION_FAILED,
            "details": {
                "validator_reason_code": validator_reason_code,
                "validator_reason_description": reason_details
            }
        }

    def check_image_array(self, image_bgr) -> tuple[dict, object]:
        """
        Runs the full compliance check using Cloud Vision API.
        
        Flow:
        1. Call Cloud Vision API
        2. Perform initial checks (non-geometric)
        3. Process image using Cloud Vision response
        4. Perform final geometry validation
        5. Prepare and return final result
        """
        if image_bgr is None:
            return {"success": False, "status": ComplianceStatus.REJECTED, "reason_code": ReasonCode.INVALID_IMAGE_DATA}, None

        try:
            # ===== STEP 1: Call Cloud Vision API =====
            log.info("Step 1: Calling Cloud Vision API...")
            initial_result = self.validator.validate_initial(image_bgr)
            
            # ===== STEP 2: Perform initial checks (non-geometric) =====
            log.info("Step 2: Performing initial validation checks...")
            if not initial_result.success:
                log.warning(f"Initial validation failed: {initial_result.reason.value} - {initial_result.details}")
                return {
                    "success": False,
                    "status": ComplianceStatus.REJECTED,
                    "reason_code": ReasonCode.VALIDATION_FAILED,
                    "details": {
                        "validator_reason_code": initial_result.reason.value,
                        "validator_reason_description": initial_result.details or initial_result.reason.description
                    }
                }, None
            
            log.info("Initial validation passed.")

            # ===== STEP 3: Process image using Cloud Vision response =====
            log.info("Step 3: Processing image using Cloud Vision API response...")
            processed_bgr, face_data, preprocess_logs, success = self.preprocessor.process_image(
                image_bgr, 
                initial_result.face_annotation
            )
            
            if not success or processed_bgr is None:
                log.warning("Image preprocessing failed.")
                return {
                    "success": False,
                    "status": ComplianceStatus.REJECTED,
                    "reason_code": ReasonCode.PREPROCESSING_FAILED
                }, None
            
            log.info("Image preprocessing complete.")

            # ===== STEP 4: Perform final geometry validation =====
            log.info("Step 4: Performing final geometry validation...")
            geometry_result = self.validator.validate_final_geometry(processed_bgr, face_data)
            
            final_status = self._get_final_status(geometry_result)
            
            log.info("Final geometry validation complete.")

            # ===== STEP 5: Prepare and return final result =====
            log.info("Step 5: Preparing final result...")
            return final_status, processed_bgr

        except Exception as e:
            log.critical(f"A critical error occurred during validation: {e}", exc_info=True)
            return {"success": False, "status": ComplianceStatus.REJECTED, "reason_code": ReasonCode.INTERNAL_SERVER_ERROR, "details": {"error": str(e)}}, None