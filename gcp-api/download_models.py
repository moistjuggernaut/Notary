"""
This script is executed during the Docker build process to download and cache
the necessary machine learning models from InsightFace.
"""
import logging
from insightface.app import FaceAnalysis

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

def download_and_cache_models():
    """
    Initializes FaceAnalysis to trigger the download of the specified model
    and its dependencies, caching them in the filesystem.
    """
    log.info("Starting model download and caching for 'buffalo_m'...")
    try:
        # Specifying the model name and providers will trigger the download
        # to the default cache directory (~/.insightface/models)
        _ = FaceAnalysis(
            name='buffalo_m',
            allowed_modules=['detection', 'landmark_2d_106', 'pose'],
            providers=['CPUExecutionProvider']
        )
        log.info("Successfully downloaded and cached 'buffalo_m' model.")
    except Exception as e:
        log.error(f"Failed to download models: {e}", exc_info=True)
        # Exit with a non-zero status code to fail the Docker build
        # if models can't be downloaded.
        exit(1)

if __name__ == '__main__':
    download_and_cache_models() 