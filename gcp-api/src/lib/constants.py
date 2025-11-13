# lib/constants.py
from enum import Enum

class ComplianceStatus(str, Enum):
    """High-level status of the check."""
    COMPLIANT = "COMPLIANT"
    REJECTED = "REJECTED"

class ReasonCode(str, Enum):
    """Machine-readable reason codes for the final status."""
    
    # Success
    ALL_CHECKS_PASSED = "ALL_CHECKS_PASSED"
    
    # Rejection (Pre-check)
    INVALID_IMAGE_DATA = "INVALID_IMAGE_DATA"
    NO_FACE_DETECTED = "NO_FACE_DETECTED"
    MULTIPLE_FACES_DETECTED = "MULTIPLE_FACES_DETECTED"
    PREPROCESSING_FAILED = "PREPROCESSING_FAILED"
    
    # Rejection (Validation)
    VALIDATION_FAILED = "VALIDATION_FAILED"
    
    # System
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    UNKNOWN_REASON = "UNKNOWN_REASON"