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

log = logging.getLogger(__name__)
                
MODEL_ENV_VAR = "MODEL_PATH"
DEFAULT_MODEL_SUBDIR = "models"


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
            model_root, resolved_model_dir = self._resolve_model_paths(model_name)

            log.info("Using model directory '%s' (root: '%s')", resolved_model_dir, model_root)

            self.app = FaceAnalysis(
                name=model_name,
                root=str(model_root),
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

    @staticmethod
    def _resolve_model_paths(model_name: str) -> tuple[Path, Path]:
        """Resolve the InsightFace model directory using MODEL_PATH env var.

        Returns:
            tuple[Path, Path]: (root_path, model_directory)

        Raises:
            FileNotFoundError: If the model directory cannot be located.
        """

        def _candidate_paths() -> list[Path]:
            env_value = os.getenv(MODEL_ENV_VAR)
            paths: list[Path] = []

            if env_value:
                env_path = Path(env_value).expanduser()
                if env_path.is_dir():
                    paths.append(env_path)
                else:
                    log.error(
                        "MODEL_PATH '%s' is not a directory. Expected path containing '%s'.",
                        env_path,
                        model_name,
                    )

            # Local development fallback: ./models/<model_name>
            repo_models_dir = Path(__file__).resolve().parents[1] / "models"
            paths.append(repo_models_dir / model_name)

            # Historic fallback: ~/.insightface/models/<model_name>
            paths.append(Path.home() / ".insightface" / "models" / model_name)
            return paths

        for candidate in _candidate_paths():
            candidate_dir = candidate

            if candidate_dir.is_file():
                # If a file (e.g., zip) is provided, we cannot use it directly.
                log.error(
                    "MODEL_PATH '%s' points to a file. Expected an extracted directory containing '%s'.",
                    candidate_dir,
                    model_name,
                )
                continue

            if not candidate_dir.exists():
                continue

            if candidate_dir.name != model_name:
                potential = candidate_dir / model_name
                if potential.exists() and potential.is_dir():
                    candidate_dir = potential
                else:
                    # This path is not the model directory we need.
                    continue

            models_parent = candidate_dir.parent
            if models_parent.name != DEFAULT_MODEL_SUBDIR:
                # InsightFace expects '<root>/models/<model_name>'. If the parent
                # directory is not called "models", we still allow it but only if
                # the expected structure exists one level up.
                models_dir = models_parent / DEFAULT_MODEL_SUBDIR
                if (models_dir / model_name).is_dir():
                    models_parent = models_dir
                else:
                    log.error(
                        "Invalid model directory structure at '%s'. Expected a 'models/%s' hierarchy.",
                        candidate_dir,
                        model_name,
                    )
                    continue

            root_path = models_parent.parent
            if not (models_parent / model_name).is_dir():
                continue

            return root_path, models_parent / model_name

        raise FileNotFoundError(
            "Unable to locate InsightFace model '{model}'. Checked MODEL_PATH and default fallbacks.".format(
                model=model_name
            )
        )

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