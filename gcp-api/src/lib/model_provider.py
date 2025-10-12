import logging
import os
from pathlib import Path
from typing import Optional

log = logging.getLogger(__name__)

MODELS_DIR_ENV_VAR = "MODELS_DIR"
DEFAULT_MODELS_SUBDIR = "models"


class ModelProvider:
    """
    A centralized provider for resolving paths to all machine learning models.
    This class is intended to be instantiated once at application startup.
    """

    def __init__(self):
        """
        Initializes the provider and resolves the root model path.
        """
        log.info("Initializing ModelProvider...")
        self._model_root_path = self._resolve_model_root()
        self.buffalo_model_dir = self._resolve_model_path("buffalo_l")
        self.u2net_model_path = self._resolve_model_path("u2net.onnx")
        if self.u2net_model_path:
            log.info(f"U2Net model found at: {self.u2net_model_path}")
        
        # Validation: Ensure critical models were found
        if not self.buffalo_model_dir or not self.u2net_model_path:
            log.critical(
                "CRITICAL: Required ML models not found! "
                f"Buffalo: {self.buffalo_model_dir}, U2Net: {self.u2net_model_path}. "
                f"Verify MODELS_DIR environment variable is set correctly."
            )
        log.info("ModelProvider initialized.")

    def _resolve_model_root(self) -> Path:
        """
        Resolves the root directory where all models are stored.
        It can be overridden by the MODELS_DIR environment variable.
        """
        env_value = os.getenv(MODELS_DIR_ENV_VAR)
        if env_value:
            path = Path(env_value).expanduser()
            log.info(f"Using models directory from env var: {path}")
            return path

        # Fallback for local dev: gcp-api/models
        fallback_path = Path(__file__).resolve().parents[1] / DEFAULT_MODELS_SUBDIR
        log.info(f"MODELS_DIR not set, using default fallback: {fallback_path}")
        return fallback_path

    def _resolve_model_path(self, model_name: str) -> Optional[Path]:
        """
        Resolves the path to a specific model file or directory.
        """
        if not self._model_root_path:
            return None

        path = self._model_root_path / model_name
        if not path.exists():
            log.warning(f"Model not found at '{path}'. Features requiring this model will be disabled.")
            return None

        log.info(f"Found model '{model_name}' at '{path}'")
        return path

    @property
    def buffalo_model_root(self) -> Optional[Path]:
        """
        Returns the parent directory of the 'models' directory.
        This is required for InsightFace's quirky API, which expects a '<root>/models/<name>' structure.
        
        InsightFace's FaceAnalysis(name="buffalo_l", root="/path") will look for:
          /path/models/buffalo_l/
        
        So if our buffalo_model_dir is /gcs/models/buffalo_l, we return /gcs as the root.
        """
        if self._model_root_path and self._model_root_path.name == DEFAULT_MODELS_SUBDIR:
            return self._model_root_path.parent
        return None


# Global instance to be imported by other modules.
model_provider = ModelProvider()

