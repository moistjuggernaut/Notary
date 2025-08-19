"""
Generic Google Cloud Storage utilities.
Handles client initialization, image storage, and signed URL generation.
"""

import logging
from typing import Optional, Union
import cv2
import numpy as np
import google.auth
from google.cloud import storage

from lib.storage_config import StorageConfig

log = logging.getLogger(__name__)


class StorageClient:
    """Generic Google Cloud Storage client for image operations."""

    def __init__(self, bucket_name: Optional[str] = None):
        """
        Initialize the storage client.

        Args:
            bucket_name: GCS bucket name. If None, uses StorageConfig.BUCKET_NAME

        Raises:
            ValueError: If storage configuration is invalid
        """
        # Validate storage configuration first
        if not StorageConfig.validate():
            raise ValueError(
                "Storage configuration invalid. GCS_BUCKET_NAME environment variable is required."
            )

        self.bucket_name = bucket_name or StorageConfig.get_bucket_name()

        # Initialize storage client based on authentication method
        if StorageConfig.USE_SERVICE_ACCOUNT:
            log.info(
                f"Using service account authentication from {StorageConfig.GOOGLE_APPLICATION_CREDENTIALS}"
            )
            self.client = storage.Client.from_service_account_json(
                StorageConfig.GOOGLE_APPLICATION_CREDENTIALS
            )
        elif StorageConfig.GCP_PROJECT_ID:
            log.info(
                f"Using application default credentials for project {StorageConfig.GCP_PROJECT_ID}"
            )
            self.client = storage.Client(project=StorageConfig.GCP_PROJECT_ID)
        else:
            log.info("Using application default credentials")
            self.client = storage.Client()

        self.bucket = self.client.bucket(self.bucket_name)

    def save_image(
        self,
        image: Union[np.ndarray, bytes],
        blob_name: str,
    ) -> str:
        """
        Save an image to Google Cloud Storage.

        Args:
            image: OpenCV BGR image array or bytes
            blob_name: Name for the blob in storage

        Returns:
            GCS URL of the saved image
        """
        # Handle different input types
        if isinstance(image, np.ndarray):
            # Encode numpy array to bytes
            image_bytes = self._encode_image(image)
        elif isinstance(image, bytes):
            image_bytes = image
        else:
            raise ValueError("Image must be numpy array or bytes")

        # Create blob and upload
        blob = self.bucket.blob(blob_name)
        blob.content_type = "image/jpeg"
        blob.upload_from_string(image_bytes, content_type="image/jpeg")

        gcs_url = f"gs://{self.bucket_name}/{blob_name}"
        log.info(f"Saved image: {blob_name} -> {gcs_url}")

        return gcs_url

    def get_signed_url(self, blob_name: str, expiration: Optional[int] = None) -> str:
        """
        Generate a signed URL for accessing a stored image.

        Args:
            blob_name: Name of the blob in the bucket
            expiration: URL expiration time in seconds (default: from StorageConfig)

        Returns:
            Signed URL for accessing the image
        """
        if expiration is None:
            expiration = StorageConfig.SIGNED_URL_EXPIRATION

        blob = self.bucket.blob(blob_name)
        if StorageConfig.USE_SERVICE_ACCOUNT:
            return blob.generate_signed_url(
                version="v4",
                expiration=expiration,
                method="GET",
            )
        else:
            try:
                credentials, _ = google.auth.default()
                credentials.refresh(google.auth.transport.requests.Request())
                try:
                    signed_url = blob.generate_signed_url(
                        version="v4", 
                        expiration=expiration,
                        method="GET",
                        service_account_email=credentials.service_account_email,
                        access_token=credentials.token,
                    )
                except Exception as e:
                    log.error(f"Failed to generate signed URL: {e}")
                    raise e
            except Exception as e:
                log.error(f"Failed to get service account information: {e}")

            return signed_url

    def _encode_image(self, image_bgr: np.ndarray) -> bytes:
        """
        Encode OpenCV BGR image to bytes with appropriate compression.

        Args:
            image_bgr: OpenCV BGR image array

        Returns:
            Encoded image bytes
        """
        success, image_bytes = cv2.imencode(
            ".jpg", image_bgr, [cv2.IMWRITE_JPEG_QUALITY, StorageConfig.JPEG_QUALITY]
        )
        if not success:
            raise ValueError("Failed to encode image")

        return image_bytes.tobytes()
