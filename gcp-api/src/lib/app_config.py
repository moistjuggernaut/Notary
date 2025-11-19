"""
Centralized application configuration using Pydantic.
All configuration values are managed here for consistency and validation.
"""
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class StorageConfig(BaseSettings):
    """Configuration for Google Cloud Storage settings."""
    model_config = SettingsConfigDict(env_prefix="")

    # GCS Settings
    bucket_name: str = Field(default="local-bucket", alias="GCS_BUCKET_NAME")

    # Local Development Settings
    storage_emulator_host: Optional[str] = Field(
        default=None,
        alias="STORAGE_EMULATOR_HOST",
        description="If set, use EmulatorStorageClient; if None, use GCSStorageClient for production."
    )

    # Common Settings
    jpeg_quality: int = Field(default=95, alias="JPEG_QUALITY")


class ServerConfig(BaseSettings):
    """Configuration for server settings."""
    model_config = SettingsConfigDict(env_prefix="")

    port: int = Field(default=8080, alias="PORT")


class ICAOConfig(BaseSettings):
    """Configuration constants for ICAO passport photo validation."""
    model_config = SettingsConfigDict(env_prefix="")

    # Target Photo Dimensions (mm) and DPI for high-resolution output
    target_photo_width_mm: float = 35
    target_photo_height_mm: float = 45
    target_dpi: int = 600

    # Calculated target pixel dimensions for the final output image
    @property
    def final_output_height_px(self) -> int:
        return int((self.target_photo_height_mm / 25.4) * self.target_dpi)

    @property
    def final_output_width_px(self) -> int:
        return int((self.target_photo_width_mm / 25.4) * self.target_dpi)

    @property
    def target_aspect_ratio(self) -> float:
        return self.target_photo_width_mm / self.target_photo_height_mm

    aspect_ratio_tolerance: float = 0.05

    # Chin to Crown Height Ratio (of the final photo height) - Baby requirements: 55%-66%
    min_chin_to_crown_ratio: float = 0.55
    max_chin_to_crown_ratio: float = 0.80

    # Head Pose Tolerances (degrees)
    max_abs_yaw: int = 10
    max_abs_pitch: int = 10
    max_abs_roll: int = 7

    # Red-eye detection parameters
    red_eye_pixel_percentage_thresh: float = 0.1

    # Face Alignment & Cropping Ratios
    target_head_height_ratio: float = 0.66
    head_pos_ratio_vertical: float = 0.12


class AppConfig(BaseSettings):
    """Main application configuration combining all sub-configurations."""
    model_config = SettingsConfigDict(env_prefix="")

    storage: StorageConfig = StorageConfig()
    server: ServerConfig = ServerConfig()
    icao: ICAOConfig = ICAOConfig()


# Global configuration instance
config = AppConfig()


# Backward compatibility functions
def get_bucket_name() -> str:
    """Get the bucket name, raising an error if not configured."""
    if not config.storage.bucket_name:
        raise ValueError(
            "GCS_BUCKET_NAME environment variable is not set. "
            "Please set it to your Google Cloud Storage bucket name."
        )
    return config.storage.bucket_name
