"""
Core Library for Baby Picture Validator

Contains the main validation logic and processing modules:
- app_config: Centralized Pydantic configuration
- face_analyzer: Face detection and analysis using InsightFace
- image_preprocessor: Image preprocessing and background removal
- photo_validator: ICAO compliance validation rules
- cloud_vision_validator: Cloud Vision API-based validation
"""

from .app_config import config
from .face_analyzer import FaceAnalyzer
from .image_preprocessor import ImagePreprocessor
from .cloud_vision_validator import CloudVisionValidator
from .constants import ComplianceStatus, ReasonCode

__all__ = [
    'config',
    'FaceAnalyzer', 
    'ImagePreprocessor',
    'CloudVisionValidator',
    'ComplianceStatus',
    'ReasonCode'
]