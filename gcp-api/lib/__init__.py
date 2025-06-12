"""
Core Library for Baby Picture Validator

Contains the main validation logic and processing modules:
- config: Configuration constants and calculations
- face_analyzer: Face detection and analysis using InsightFace
- image_preprocessor: Image preprocessing and background removal
- photo_validator: ICAO compliance validation rules
"""

from .config import Config
from .face_analyzer import FaceAnalyzer
from .image_preprocessor import ImagePreprocessor
from .photo_validator import PhotoValidator

__all__ = ['Config', 'FaceAnalyzer', 'ImagePreprocessor', 'PhotoValidator'] 