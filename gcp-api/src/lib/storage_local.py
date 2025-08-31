"""
Local storage client for development environments.
Mimics the interface of the GCS StorageClient.
"""

import logging
import cv2
import numpy as np
from typing import Optional, Union
from pathlib import Path

from lib.storage_config import StorageConfig

log = logging.getLogger(__name__)


class StorageClientLocal:
    """Local filesystem storage client for development."""

    def __init__(self, bucket_name: Optional[str] = None):
        """
        Initialize the local storage client.
        The `bucket_name` argument is ignored but kept for interface compatibility.
        """
        self.local_storage_path = Path(StorageConfig.LOCAL_STORAGE_PATH)
        self.local_storage_path.mkdir(parents=True, exist_ok=True)
        log.info(f"Using local storage at: {self.local_storage_path.resolve()}")

    def save_image(
        self,
        image: Union[np.ndarray, bytes],
        blob_name: str,
    ) -> str:
        """
        Save an image to the local filesystem.

        Args:
            image: OpenCV BGR image array or bytes
            blob_name: Name for the file, can include subdirectories

        Returns:
            File URL of the saved image
        """
        if isinstance(image, np.ndarray):
            image_bytes = self._encode_image(image)
        elif isinstance(image, bytes):
            image_bytes = image
        else:
            raise ValueError("Image must be numpy array or bytes")

        # The blob_name might contain slashes for directory structure
        local_path = self.local_storage_path / blob_name
        local_path.parent.mkdir(parents=True, exist_ok=True)

        with open(local_path, "wb") as f:
            f.write(image_bytes)

        file_url = f"file://{local_path.resolve()}"
        log.info(f"Saved image locally: {blob_name} -> {file_url}")
        return file_url

    def get_signed_url(self, blob_name: str, expiration: Optional[int] = None) -> str:
        """
        Generate a file path URL for a locally stored image.
        The `expiration` argument is ignored but kept for interface compatibility.
        """
        local_path = self.local_storage_path / blob_name
        if local_path.exists():
            return f"file://{local_path.resolve()}"
        else:
            log.warning(f"Local file not found for signed URL: {local_path.resolve()}")
            return ""

    def _encode_image(self, image_bgr: np.ndarray) -> bytes:
        """
        Encode OpenCV BGR image to bytes with appropriate compression.
        """
        success, image_bytes = cv2.imencode(
            ".jpg", image_bgr, [cv2.IMWRITE_JPEG_QUALITY, StorageConfig.JPEG_QUALITY]
        )
        if not success:
            raise ValueError("Failed to encode image")

        return image_bytes.tobytes()
