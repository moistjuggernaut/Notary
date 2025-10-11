"""
Face detection and analysis module using InsightFace.
Handles face detection, landmark extraction, and pose estimation.
This is a heavyweight class that should be lazy-loaded.
"""
import logging
import os
from pathlib import Path

import cv2
import numpy as np
from insightface.app import FaceAnalysis

from lib.app_config import config
from lib.model_provider import model_provider

log = logging.getLogger(__name__)
                

class FaceAnalyzer:
    """
    Handles detailed face analysis using the InsightFace model.
    This includes detection, landmark extraction, and pose estimation.
    """
    def __init__(self, model_name=config.icao.recommended_model_name, providers=None):
        """
        Initializes the FaceAnalyzer by loading the full InsightFace model.
        This is a slow operation and should not be done at application startup.
        """
        log.info(f"Initializing heavyweight FaceAnalyzer with model '{model_name}'...")
        if providers is None:
            providers = ['CPUExecutionProvider']
        
        try:
            log.info("Using model directory '%s' (root: '%s')", model_provider.buffalo_model_dir, model_provider.buffalo_model_root)

            self.app = FaceAnalysis(
                name=model_name,
                root=str(model_provider.buffalo_model_root),
                allowed_modules=['detection', 'landmark_2d_106', 'pose'],
                providers=providers
            )
            self.app.prepare(ctx_id=0, det_size=(640, 640))
            log.info("InsightFace model loaded and prepared successfully.")
        except Exception as e:
            log.critical(f"Failed to initialize InsightFace model: {e}", exc_info=True)
            # Re-raise the exception to ensure the calling process knows
            # that initialization failed.
            raise RuntimeError(f"Could not initialize FaceAnalyzer: {e}") from e

    def analyze_image(self, image_bgr: np.ndarray) -> list:
        """
        Analyzes faces in an image using the full InsightFace model.
        
        Args:
            image_bgr (numpy.ndarray): Input image in BGR format.
            
        Returns:
            list: A list of detected face objects from InsightFace.
                  Returns an empty list if no faces are found.
        """
        if image_bgr is None:
            return []
        
        try:
            # InsightFace expects RGB images
            image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
            faces = self.app.get(image_rgb)
            return faces if faces is not None else []
        except Exception as e:
            log.error(f"Error during InsightFace analysis: {e}", exc_info=True)
            return [] 