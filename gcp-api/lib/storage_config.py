"""
Configuration for Google Cloud Storage settings.
"""

import os
from typing import Optional


class StorageConfig:
    """Configuration for image storage settings."""

    # GCS Bucket name - can be set via environment variable
    BUCKET_NAME: Optional[str] = os.environ.get("GCS_BUCKET_NAME")

    # GCP Project settings
    GCP_PROJECT_ID: Optional[str] = os.environ.get("GCP_PROJECT_ID")

    # Authentication settings
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = os.environ.get(
        "GOOGLE_APPLICATION_CREDENTIALS"
    )
    USE_SERVICE_ACCOUNT: bool = (
        os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") is not None
    )

    # Image quality settings
    JPEG_QUALITY: int = int(os.environ.get("JPEG_QUALITY", "95"))

    # Signed URL settings
    SIGNED_URL_EXPIRATION: int = int(
        os.environ.get("SIGNED_URL_EXPIRATION", "3600")
    )  # 1 hour default

    @classmethod
    def validate(cls) -> bool:
        """Validate that required configuration is present."""
        if not cls.BUCKET_NAME:
            return False
        return True

    @classmethod
    def get_bucket_name(cls) -> str:
        """Get the bucket name, raising an error if not configured."""
        if not cls.BUCKET_NAME:
            raise ValueError(
                "GCS_BUCKET_NAME environment variable is not set. "
                "Please set it to your Google Cloud Storage bucket name."
            )
        return cls.BUCKET_NAME
