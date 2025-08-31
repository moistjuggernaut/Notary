"""
Configuration for Google Cloud Storage settings.
"""

import os
from typing import Optional


class StorageConfig:
    """Configuration for image storage settings."""

    # --- Environment and Provider ---
    APP_ENV: str = os.environ.get("APP_ENV", "production")
    IS_DEVELOPMENT: bool = APP_ENV in ("development", "dev")
    
    # Provider can be 'GCS' or 'MINIO'
    STORAGE_PROVIDER: str = os.environ.get("STORAGE_PROVIDER", "GCS")

    # --- MinIO/S3-Compatible Settings (for development) ---
    MINIO_ENDPOINT: Optional[str] = os.environ.get("MINIO_ENDPOINT")
    MINIO_PUBLIC_ENDPOINT: Optional[str] = os.environ.get("MINIO_PUBLIC_ENDPOINT")
    MINIO_ACCESS_KEY: Optional[str] = os.environ.get("MINIO_ACCESS_KEY")
    MINIO_SECRET_KEY: Optional[str] = os.environ.get("MINIO_SECRET_KEY")
    MINIO_BUCKET: Optional[str] = os.environ.get("MINIO_BUCKET")

    # --- GCS Settings (for production) ---
    BUCKET_NAME: Optional[str] = os.environ.get("GCS_BUCKET_NAME")
    GCP_PROJECT_ID: Optional[str] = os.environ.get("GCP_PROJECT_ID")
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = os.environ.get(
        "GOOGLE_APPLICATION_CREDENTIALS"
    )

    # --- Common Settings ---
    JPEG_QUALITY: int = int(os.environ.get("JPEG_QUALITY", "95"))
    SIGNED_URL_EXPIRATION: int = int(
        os.environ.get("SIGNED_URL_EXPIRATION", "3600")
    )  # 1 hour default

    @classmethod
    def validate(cls) -> bool:
        """Validate that required configuration is present."""
        # In development, GCS bucket is not required
        if cls.IS_DEVELOPMENT:
            return True
        
        if not cls.BUCKET_NAME:
            return False
        return True

    @classmethod
    def get_bucket_name(cls) -> str:
        """Get the bucket name for the configured provider."""
        if cls.STORAGE_PROVIDER == "MINIO":
            bucket = cls.MINIO_BUCKET
            if not bucket:
                raise ValueError("MINIO_BUCKET is not set for MinIO storage provider.")
            return bucket
        else: # Default to GCS
            bucket = cls.BUCKET_NAME
            if not bucket:
                raise ValueError("GCS_BUCKET_NAME is not set for GCS storage provider.")
            return bucket
