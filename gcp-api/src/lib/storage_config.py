"""
Configuration for Google Cloud Storage settings.
"""
import os
from typing import Optional

class StorageConfig:
    """Configuration for image storage settings."""

    # --- GCS Settings ---
    # In production, this is the real GCS bucket name.
    # In development, this is the name of the bucket to create in the emulator.
    BUCKET_NAME: Optional[str] = os.environ.get("GCS_BUCKET_NAME", "local-bucket")
    GCP_PROJECT_ID: Optional[str] = os.environ.get("GCP_PROJECT_ID")
    
    # --- Local Development Settings ---
    # This variable is used by the google-cloud-storage library to automatically
    # connect to a local emulator instead of the real GCS API.
    # It should be set to, e.g., 'http://localhost:4443' or 'http://gcs-emulator:4443'
    STORAGE_EMULATOR_HOST: Optional[str] = os.environ.get("STORAGE_EMULATOR_HOST")
    # The public URL for the emulator, used for constructing direct URLs.
    GCS_EMULATOR_PUBLIC_HOST: str = os.environ.get("GCS_EMULATOR_PUBLIC_HOST", "http://localhost:4443")

    # --- Common Settings ---
    JPEG_QUALITY: int = int(os.environ.get("JPEG_QUALITY", "95"))
    SIGNED_URL_EXPIRATION: int = int(
        os.environ.get("SIGNED_URL_EXPIRATION", "3600")
    )  # 1 hour default

    @classmethod
    def get_bucket_name(cls) -> str:
        """Get the bucket name, raising an error if not configured."""
        if not cls.BUCKET_NAME:
            raise ValueError(
                "GCS_BUCKET_NAME environment variable is not set. "
                "Please set it to your Google Cloud Storage bucket name."
            )
        return cls.BUCKET_NAME
