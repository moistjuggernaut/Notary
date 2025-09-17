"""
Native Google Cloud Storage utilities.
Handles client initialization, image storage, and signed URL generation.
This module provides a factory to get the correct client for the environment.
"""
import logging
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
    Connects to the emulator and generates simple, direct URLs.
    """
    def __init__(self, bucket_name: str, public_host: str):
        self.bucket_name = bucket_name
        self.public_host = public_host
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
        return f"{self.public_host}/storage/v1/b/{self.bucket_name}/o/{blob_name}?alt=media"

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

def get_storage_client() -> BaseStorageClient:
    """
    Factory function to get the appropriate storage client based on the environment.
    """
    bucket_name = config.storage.bucket_name
    if config.storage.storage_emulator_host:
        log.info("Using EmulatorStorageClient for local development.")
        return EmulatorStorageClient(
            bucket_name=bucket_name,
            public_host=config.storage.gcs_emulator_public_host,
        )
    else:
        log.info("Using GCSStorageClient for production.")
        return GCSStorageClient(bucket_name=bucket_name)
