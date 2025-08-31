"""
S3-compatible storage utilities using boto3.
Handles client initialization, image storage, and signed URL generation
for Google Cloud Storage (in interoperability mode) and MinIO.
"""

import logging
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from typing import Optional, Union
import cv2
import numpy as np

from lib.storage_config import StorageConfig

log = logging.getLogger(__name__)


class StorageClient:
    """S3-compatible client for GCS and MinIO."""

    def __init__(self, bucket_name: Optional[str] = None):
        """Initialize the Boto3 client."""
        self.bucket_name = bucket_name or StorageConfig.get_bucket_name()

        if StorageConfig.STORAGE_PROVIDER == "MINIO":
            # Configuration for MinIO
            log.info(f"Using MinIO storage provider at endpoint: {StorageConfig.MINIO_ENDPOINT}")
            self.client = boto3.client(
                "s3",
                endpoint_url=StorageConfig.MINIO_ENDPOINT,
                aws_access_key_id=StorageConfig.MINIO_ACCESS_KEY,
                aws_secret_access_key=StorageConfig.MINIO_SECRET_KEY,
                config=Config(signature_version="s3v4"),
            )
        else:
            # Default configuration for Google Cloud Storage (S3 Interoperability)
            # For this to work, you must generate HMAC keys in the GCS console
            # and provide them as AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_key env vars.
            log.info("Using GCS storage provider (S3 Interoperability Mode)")
            self.client = boto3.client(
                "s3",
                endpoint_url="https://storage.googleapis.com",
                config=Config(signature_version="s3v4"),
            )
        
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Create the bucket if it does not already exist."""
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
            log.info(f"Bucket '{self.bucket_name}' already exists.")
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                log.info(f"Bucket '{self.bucket_name}' not found. Creating it...")
                # GCS requires a location constraint. MinIO ignores it.
                self.client.create_bucket(Bucket=self.bucket_name)
                log.info(f"Bucket '{self.bucket_name}' created.")
            else:
                log.error(f"Error checking for bucket: {e}")
                raise

    def save_image(
        self,
        image: Union[np.ndarray, bytes],
        blob_name: str,
    ) -> str:
        """Save an image to S3-compatible storage."""
        if isinstance(image, np.ndarray):
            image_bytes = self._encode_image(image)
        elif isinstance(image, bytes):
            image_bytes = image
        else:
            raise ValueError("Image must be numpy array or bytes")

        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=blob_name,
                Body=image_bytes,
                ContentType="image/jpeg",
            )
            storage_url = f"s3://{self.bucket_name}/{blob_name}"
            log.info(f"Saved image: {blob_name} -> {storage_url}")
            return storage_url
        except ClientError as e:
            log.error(f"Failed to save image to S3-compatible storage: {e}")
            raise

    def get_signed_url(self, blob_name: str, expiration: Optional[int] = None) -> str:
        """Generate a presigned URL for accessing a stored image."""
        if expiration is None:
            expiration = StorageConfig.SIGNED_URL_EXPIRATION

        try:
            url = self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": blob_name},
                ExpiresIn=expiration,
            )
            
            # For MinIO in dev, replace the internal Docker hostname with the public one
            if StorageConfig.STORAGE_PROVIDER == "MINIO" and StorageConfig.MINIO_PUBLIC_ENDPOINT:
                url = url.replace(StorageConfig.MINIO_ENDPOINT, StorageConfig.MINIO_PUBLIC_ENDPOINT)

            return url
        except ClientError as e:
            log.error(f"Failed to generate signed URL: {e}")
            raise

    def _encode_image(self, image_bgr: np.ndarray) -> bytes:
        """Encode OpenCV BGR image to bytes."""
        success, image_bytes = cv2.imencode(
            ".jpg", image_bgr, [cv2.IMWRITE_JPEG_QUALITY, StorageConfig.JPEG_QUALITY]
        )
        if not success:
            raise ValueError("Failed to encode image")
        return image_bytes.tobytes()
