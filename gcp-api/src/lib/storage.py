"""
Native Google Cloud Storage utilities.
Handles client initialization, image storage, and signed URL generation.
This module provides a factory to get the correct client for the environment.
"""
import logging
import os
from typing import Optional, Union
import cv2
import numpy as np
from google.cloud import storage
from google.cloud.exceptions import NotFound

from lib.app_config import config
from lib.storage_base import BaseStorageClient

log = logging.getLogger(__name__)

class GCSStorageClient(BaseStorageClient):
    """
    Production Google Cloud Storage client for image operations.
    Connects to the real GCS and generates signed URLs.
    """
    def __init__(self, bucket_name: str):
        self.bucket_name = bucket_name
        self.client = storage.Client()
        self.bucket = self._ensure_bucket_exists()

    def _ensure_bucket_exists(self) -> storage.Bucket:
        try:
            return self.client.get_bucket(self.bucket_name)
        except NotFound:
            log.info(f"Bucket '{self.bucket_name}' not found. Creating it...")
            return self.client.create_bucket(self.bucket_name)

    def save_image(self, image: Union[np.ndarray, bytes], blob_name: str) -> str:
        blob = self.bucket.blob(blob_name)
        blob.upload_from_string(self._encode_image(image), content_type="image/jpeg")
        return f"gs://{self.bucket_name}/{blob_name}"

    def get_signed_url(self, blob_name: str, expiration: int) -> str:
        blob = self.bucket.blob(blob_name)
        return blob.generate_signed_url(expiration=expiration)

    def get_image(self, blob_name: str) -> np.ndarray:
        """
        Get an image from Google Cloud Storage.
        """
        blob = self.bucket.blob(blob_name)
        image_bytes = blob.download_as_bytes()
        return self._decode_image(image_bytes)

    def _encode_image(self, image_bgr: np.ndarray) -> bytes:
        success, buf = cv2.imencode(".jpg", image_bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])
        if not success:
            raise ValueError("Failed to encode image")
        return buf.tobytes()

    def _decode_image(self, image_bytes: bytes) -> np.ndarray:
        """
        Decode image bytes to OpenCV BGR image array.
        """
        return cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)

class EmulatorStorageClient(BaseStorageClient):
    """
    Local development storage client for the GCS emulator.
    The GCS client automatically detects and uses the STORAGE_EMULATOR_HOST environment variable.
    """
    def __init__(self, bucket_name: str, emulator_host: str):
        self.bucket_name = bucket_name
        self.emulator_host = emulator_host
        self.client = storage.Client(project="local-dev")
        self.bucket = self._ensure_bucket_exists()

    def _ensure_bucket_exists(self) -> storage.Bucket:
        try:
            return self.client.get_bucket(self.bucket_name)
        except NotFound:
            log.info(f"Emulator bucket '{self.bucket_name}' not found. Creating...")
            return self.client.create_bucket(self.bucket_name)

    def save_image(self, image: Union[np.ndarray, bytes], blob_name: str) -> str:
        blob = self.bucket.blob(blob_name)
        blob.upload_from_string(self._encode_image(image), content_type="image/jpeg")
        return f"gs://{self.bucket_name}/{blob_name}"

    def get_signed_url(self, blob_name: str, expiration: int) -> str:
        return f"{self.emulator_host}/storage/v1/b/{self.bucket_name}/o/{blob_name}?alt=media"

    def get_image(self, blob_name: str) -> np.ndarray:
        """
        Get an image from Google Cloud Storage.
        """
        blob = self.bucket.blob(blob_name)
        image_bytes = blob.download_as_bytes()
        return self._decode_image(image_bytes)

    def _encode_image(self, image_bgr: np.ndarray) -> bytes:
        success, buf = cv2.imencode(".jpg", image_bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])
        if not success:
            raise ValueError("Failed to encode image")
        return buf.tobytes()

    def _decode_image(self, image_bytes: bytes) -> np.ndarray:
        """
        Decode image bytes to OpenCV BGR image array.
        """
        return cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)

# Module-level singleton to cache the storage client
_storage_client: Optional[BaseStorageClient] = None

def get_storage_client() -> BaseStorageClient:
    """
    Factory function to get the appropriate storage client based on the environment.
    Uses a singleton pattern to reuse the same client instance per worker process.
    
    The client type is determined by checking if STORAGE_EMULATOR_HOST is set in the environment.
    """
    global _storage_client
    
    if _storage_client is None:
        bucket_name = config.storage.bucket_name
        if config.storage.storage_emulator_host:
            log.info("Initializing EmulatorStorageClient for local development.")
            _storage_client = EmulatorStorageClient(bucket_name=bucket_name, emulator_host=config.storage.storage_emulator_host)
        else:
            log.info("Initializing GCSStorageClient for production.")
            _storage_client = GCSStorageClient(bucket_name=bucket_name)
    
    return _storage_client
