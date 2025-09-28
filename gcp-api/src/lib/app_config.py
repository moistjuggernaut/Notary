"""
Centralized application configuration using Pydantic.
All configuration values are managed here for consistency and validation.
"""
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class StorageConfig(BaseSettings):
    """Configuration for Google Cloud Storage settings."""

    # GCS Settings
    bucket_name: str = Field(default="local-bucket", alias="GCS_BUCKET_NAME")

    # Local Development Settings
    storage_emulator_host: Optional[str] = Field(
        default="http://localhost:4443",
        alias="STORAGE_EMULATOR_HOST",
        description="Host for GCS emulator (e.g., 'http://localhost:4443')"
    )

    # Common Settings
    jpeg_quality: int = Field(default=95, alias="JPEG_QUALITY")

    class Config:
        env_prefix = ""  # No prefix for storage config


class ServerConfig(BaseSettings):
    """Configuration for server settings."""

    port: int = Field(default=8080, alias="PORT")

    class Config:
        env_prefix = ""


class ICAOConfig(BaseSettings):
    """Configuration constants for ICAO passport photo validation."""

    # Model Configuration
    recommended_model_name: str = "buffalo_l"

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

    # Background Check Parameters
    bg_prelim_min_light_rgb: int = 220
    bg_prelim_std_dev_max: int = 15
    bg_final_min_light_rgb: tuple = (220, 220, 220)
    bg_final_max_rgb: tuple = (255, 255, 255)
    bg_final_std_dev_max: int = 25
    contrast_threshold_gray: int = 35

    # Face Detection Confidence
    min_detection_score: float = 0.6

    # Infant-Specific Crop Logic
    infant_crown_estimation_multiplier: float = 2.0

    # Eye Aspect Ratio (EAR) threshold for detecting closed eyes
    eye_ar_thresh: float = 0.35

    # Eye level positioning requirements (mm from bottom edge of photo)
    eye_level_min_from_bottom_mm: int = 18
    eye_level_max_from_bottom_mm: int = 29

    @property
    def eye_level_min_from_bottom_px(self) -> int:
        return int((self.eye_level_min_from_bottom_mm / 25.4) * self.target_dpi)

    @property
    def eye_level_max_from_bottom_px(self) -> int:
        return int((self.eye_level_max_from_bottom_mm / 25.4) * self.target_dpi)

    # Red-eye detection parameters
    red_eye_pixel_percentage_thresh: float = 0.1

    # Landmark Indices (106-point model)
    chin_landmark_index: int = 16
    left_eye_landmarks: List[int] = [35, 36, 33, 37, 39, 42]
    right_eye_landmarks: List[int] = [74, 93, 90, 94, 96, 97]
    left_pupil_approx_index: int = 35
    right_pupil_approx_index: int = 74

    # Face Alignment & Cropping Ratios
    target_head_height_ratio: float = 0.66
    head_pos_ratio_vertical: float = 0.12

    class Config:
        env_prefix = ""


class AppConfig(BaseSettings):
    """Main application configuration combining all sub-configurations."""

    storage: StorageConfig = StorageConfig()
    server: ServerConfig = ServerConfig()
    icao: ICAOConfig = ICAOConfig()

    class Config:
        env_prefix = ""  # No global prefix


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
