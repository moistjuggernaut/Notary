"""
Main compliance checker orchestrator.
Coordinates the complete photo validation workflow.
"""
import logging

import numpy as np
from threading import Lock

from lib.app_config import config
from lib.image_preprocessor import ImagePreprocessor
from lib.gemini_validator import GeminiValidator

log = logging.getLogger(__name__)

class ComplianceChecker:
    """
    Orchestrates the full photo validation process by lazy-loading
    a heavyweight analyzer.
    """
    _full_analyzer = None
    _full_analyzer_lock = Lock()
    _rembg_remove_func = None
    
    def __init__(self, model_name=config.icao.recommended_model_name, providers=None):
        """
        Initializes the ComplianceChecker orchestrator.
        The heavyweight FaceAnalyzer is NOT loaded on initialization.
        """
        log.info("Initializing ComplianceChecker orchestrator...")
        self._model_name = model_name
        self._providers = providers
        self.preprocessor = None
        self.validator = GeminiValidator()
        self.config = config.icao
        log.info("ComplianceChecker orchestrator initialized.")

    def _get_full_analyzer(self):
        """
        Lazy-loads the heavyweight FaceAnalyzer on first use.
        This method is thread-safe.
        """
        if ComplianceChecker._full_analyzer is None:
            with ComplianceChecker._full_analyzer_lock:
                if ComplianceChecker._full_analyzer is None:
                    log.info("First use: lazy-loading heavyweight models...")
                    
                    # Lazy-load FaceAnalyzer. This also triggers the ModelProvider to resolve paths.
                    from lib.face_analyzer import FaceAnalyzer
                    ComplianceChecker._full_analyzer = FaceAnalyzer(
                        model_name=self._model_name,
                        providers=self._providers
                    )
                    
                    # Lazy-load rembg. The ModelProvider has already prepared the symlink.
                    try:
                        from rembg import remove as rembg_remove
                        ComplianceChecker._rembg_remove_func = rembg_remove
                        log.info("rembg library loaded successfully.")
                    except ImportError:
                        log.warning("rembg library not found. Background removal will be skipped.")

        # Inject dependencies into the preprocessor (idempotent)
        if self.preprocessor is None:
            self.preprocessor = ImagePreprocessor(
                ComplianceChecker._full_analyzer,
                rembg_func=ComplianceChecker._rembg_remove_func
            )
            log.debug("ImagePreprocessor initialized with shared analyzer.")
        return ComplianceChecker._full_analyzer

    def _get_final_recommendation(self, validation_result: dict) -> str:
        """Determines the final recommendation based on the Gemini result."""
        status = validation_result.get("status")

        if status == "COMPLIANT":
            return "LOOKS PROMISING: All primary checks passed."

        reason = (
            validation_result.get("status_reason_description")
            or validation_result.get("status_reason")
            or validation_result.get("error")
        )
        reason_str = reason or "UNKNOWN_REASON"
        return f"REJECTED: Gemini detected issue ({reason_str})."

    def check_image_array(self, image_bgr) -> tuple[dict, np.ndarray]:
        """
        Runs the full, heavyweight compliance check on an image array.
        This will trigger the lazy-loading of the InsightFace model on first run.
        """
        all_logs = {"preprocessing": [], "validation": []}
        
        if image_bgr is None:
            return {"success": False, "recommendation": "REJECTED: Invalid image data"}, None

        try:
            # Step 1: Get the heavyweight analyzer (lazy-loads on first call)
            full_analyzer = self._get_full_analyzer()
            
            # Step 2: Perform high-accuracy face analysis
            log.info("Performing full analysis with InsightFace model...")
            faces = full_analyzer.analyze_image(image_bgr)
            
            if not faces:
                all_logs["preprocessing"].append(("FAIL", "Full Analysis", "No face detected by the analysis model."))
                return {"success": False, "recommendation": "REJECTED: No face detected", "logs": all_logs}, None
            
            if len(faces) > 1:
                all_logs["preprocessing"].append(("FAIL", "Full Analysis", f"Multiple faces ({len(faces)}) detected."))
                return {"success": False, "recommendation": "REJECTED: Multiple faces detected", "logs": all_logs}, None
                
            all_logs["preprocessing"].append(("PASS", "Full Analysis", "Single face detected."))
            
            # Step 3: Preprocessing
            log.info("Starting image preprocessing...")
            processed_bgr, face_data, preprocess_logs, success, rembg_mask = self.preprocessor.process_image(image_bgr, faces)
            all_logs["preprocessing"].extend(preprocess_logs)
            log.info("Image preprocessing finished.")
            
            if not success or processed_bgr is None:
                log.warning("Preprocessing failed. Aborting validation.")
                return {"success": False, "recommendation": "REJECTED: Preprocessing failed", "logs": all_logs}, None

            # Step 4: Validation
            log.info("Starting photo validation...")
            validation_result = self.validator.validate(processed_bgr)

            if validation_result.get("success"):
                gemini_log = (
                    "PASS",
                    "Gemini Validation",
                    "Gemini reports the photo is compliant."
                )
            else:
                failure_message = (
                    validation_result.get("status_reason_description")
                    or validation_result.get("status_reason")
                    or validation_result.get("error")
                    or "Gemini reported a validation error."
                )
                gemini_log = (
                    "FAIL",
                    "Gemini Validation",
                    failure_message
                )

            all_logs["validation"].append(gemini_log)
            recommendation = self._get_final_recommendation(validation_result)
            log.info("Photo validation finished.")
        
            # Step 5: Prepare and return final result
            result = {
                "success": "REJECTED" not in recommendation,
                "recommendation": recommendation,
                "logs": all_logs,
                "gemini_validation": validation_result
            }
            log.debug(f"Final logs: {all_logs}")
        
            return result, processed_bgr

        except Exception as e:
            log.critical(f"A critical error occurred during full validation: {e}", exc_info=True)
            return {"success": False, "error": f"Internal server error: {e}", "recommendation": "REJECTED: System error"}, None
