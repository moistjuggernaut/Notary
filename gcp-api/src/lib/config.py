"""
Configuration constants for ICAO passport photo validation.
Contains all tunable parameters for face detection, validation, and processing.
"""

class Config:
    """Stores all configuration values for easy tuning."""
    
    # --- Model Configuration ---
    # The name of the InsightFace model to be used.
    # 'buffalo_l' is recommended as it provides pose and 106 landmarks
    RECOMMENDED_MODEL_NAME = 'buffalo_l'
    
    # Target Photo Dimensions (mm) and DPI for high-resolution output
    TARGET_PHOTO_WIDTH_MM = 35
    TARGET_PHOTO_HEIGHT_MM = 45
    TARGET_DPI = 600

    # Calculated target pixel dimensions for the final output image
    FINAL_OUTPUT_HEIGHT_PX = int((TARGET_PHOTO_HEIGHT_MM / 25.4) * TARGET_DPI)  # Approx 1063
    FINAL_OUTPUT_WIDTH_PX = int((TARGET_PHOTO_WIDTH_MM / 25.4) * TARGET_DPI)    # Approx 827
    
    TARGET_ASPECT_RATIO = TARGET_PHOTO_WIDTH_MM / TARGET_PHOTO_HEIGHT_MM
    ASPECT_RATIO_TOLERANCE = 0.05

    # Chin to Crown Height Ratio (of the final photo height) - Baby requirements: 55%-66%
    MIN_CHIN_TO_CROWN_RATIO = 0.55
    MAX_CHIN_TO_CROWN_RATIO = 0.80

    # Head Pose Tolerances (degrees)
    MAX_ABS_YAW = 10
    MAX_ABS_PITCH = 10
    MAX_ABS_ROLL = 7

    # Background Check Parameters
    BG_PRELIM_MIN_LIGHT_RGB = 220  # Minimum RGB for preliminary background check
    BG_PRELIM_STD_DEV_MAX = 15     # Maximum standard deviation for background uniformity
    BG_FINAL_MIN_LIGHT_RGB = (220, 220, 220)   # Minimum RGB for final validation
    BG_FINAL_MAX_RGB = (255, 255, 255)
    BG_FINAL_STD_DEV_MAX = 25
    CONTRAST_THRESHOLD_GRAY = 35     # Min brightness difference between face and BG

    # Face Detection Confidence
    MIN_DETECTION_SCORE = 0.6
    
    # --- Infant-Specific Crop Logic ---
    # When estimating an infant's crown position, we multiply the eye-to-chin
    # distance by this value. A larger value creates more space.
    INFANT_CROWN_ESTIMATION_MULTIPLIER = 2.0
    
    # Eye Aspect Ratio (EAR) threshold for detecting closed eyes.
    EYE_AR_THRESH = 0.35

    # Eye level positioning requirements (mm from bottom edge of photo)
    EYE_LEVEL_MIN_FROM_BOTTOM_MM = 18
    EYE_LEVEL_MAX_FROM_BOTTOM_MM = 29
    # Convert to pixels at target DPI
    EYE_LEVEL_MIN_FROM_BOTTOM_PX = int((EYE_LEVEL_MIN_FROM_BOTTOM_MM / 25.4) * TARGET_DPI)  # Approx 425
    EYE_LEVEL_MAX_FROM_BOTTOM_PX = int((EYE_LEVEL_MAX_FROM_BOTTOM_MM / 25.4) * TARGET_DPI)  # Approx 685

    # Red-eye detection parameters
    RED_EYE_PIXEL_PERCENTAGE_THRESH = 0.1

    # --- Landmark Indices (106-point model) ---
    CHIN_LANDMARK_INDEX = 16
    # Left eye landmarks for EAR calculation
    LEFT_EYE_LANDMARKS = [35, 36, 33, 37, 39, 42]
    # Right eye landmarks for EAR calculation
    RIGHT_EYE_LANDMARKS = [74, 93, 90, 94, 96, 97]
    # Pupil approximations for red-eye correction
    LEFT_PUPIL_APPROX_INDEX = 35
    RIGHT_PUPIL_APPROX_INDEX = 74

    # --- Face Alignment & Cropping Ratios ---
    # Target head height as a ratio of image height (Baby requirements: 66%)
    TARGET_HEAD_HEIGHT_RATIO = 0.66
    # Target space above the head as a ratio of total image height
    HEAD_POS_RATIO_VERTICAL = 0.12 