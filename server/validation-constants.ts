/**
 * ICAO passport photo validation constants and configuration.
 */

// ICAO Configuration for passport photo dimensions
export const ICAOConfig = {
  // Target Photo Dimensions (mm) and DPI for high-resolution output
  targetPhotoWidthMm: 35,
  targetPhotoHeightMm: 45,
  targetDpi: 600,

  // Calculated target pixel dimensions for the final output image
  get finalOutputHeightPx(): number {
    return Math.floor((this.targetPhotoHeightMm / 25.4) * this.targetDpi)
  },
  get finalOutputWidthPx(): number {
    return Math.floor((this.targetPhotoWidthMm / 25.4) * this.targetDpi)
  },
  get targetAspectRatio(): number {
    return this.targetPhotoWidthMm / this.targetPhotoHeightMm
  },

  aspectRatioTolerance: 0.05,

  // Chin to Crown Height Ratio (of the final photo height) - Baby requirements: 55%-66%
  minChinToCrownRatio: 0.55,
  maxChinToCrownRatio: 0.80,

  // Head Pose Tolerances (degrees)
  maxAbsYaw: 10,
  maxAbsPitch: 10,
  maxAbsRoll: 7,

  // Red-eye detection parameters
  redEyePixelPercentageThresh: 0.1,

  // Face Alignment & Cropping Ratios
  targetHeadHeightRatio: 0.66,
  headPosRatioVertical: 0.12,
} as const

// Cloud Vision Validator thresholds
export const ValidationThresholds = {
  landmarkingConfidence: 0.6,
  detectionConfidence: 0.9,
  backgroundLightRgb: 200,
  backgroundUniformity: 0.6,
  backgroundSecondaryColor: 0.4,
  headCenteringToleranceRatio: 0.05,
  redEyeRgb: 150,
  pupilRoiRadiusRatio: 0.01,
  pupilRoiMinRadius: 5,
  minEyeOpeningPixels: 5,
  lightingUniformity: 0.25,
  lightingSampleRadiusRatio: 0.02,
  lightingSampleMinRadius: 10,
} as const

// High-level status of the compliance check
export const ComplianceStatus = {
  COMPLIANT: 'COMPLIANT',
  REJECTED: 'REJECTED',
} as const

export type ComplianceStatusType = typeof ComplianceStatus[keyof typeof ComplianceStatus]

// Machine-readable reason codes for the final status
export const ReasonCode = {
  // Success
  ALL_CHECKS_PASSED: 'ALL_CHECKS_PASSED',
  // Rejection (Pre-check)
  INVALID_IMAGE_DATA: 'INVALID_IMAGE_DATA',
  NO_FACE_DETECTED: 'NO_FACE_DETECTED',
  MULTIPLE_FACES_DETECTED: 'MULTIPLE_FACES_DETECTED',
  PREPROCESSING_FAILED: 'PREPROCESSING_FAILED',
  // Rejection (Validation)
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  // System
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  UNKNOWN_REASON: 'UNKNOWN_REASON',
} as const

export type ReasonCodeType = typeof ReasonCode[keyof typeof ReasonCode]

// Detailed validation reasons from Cloud Vision checks
export const ValidationReason = {
  NO_FACE: 'NO_FACE',
  BG: 'BG',
  POSE_DIR: 'POSE_DIR',
  POSE_CTR: 'POSE_CTR',
  EXPR: 'EXPR',
  LIGHT: 'LIGHT',
  EYES_OBS: 'EYES_OBS',
  EYES_CL: 'EYES_CL',
  GLS_GLARE: 'GLS_GLARE',
  GLS_TINT: 'GLS_TINT',
  HD_COVER: 'HD_COVER',
  QUAL_BLUR: 'QUAL_BLUR',
  QUAL_REDEYE: 'QUAL_REDEYE',
  CTRY_DIM: 'CTRY_DIM',
  CTRY_SPEC: 'CTRY_SPEC',
  ICAO_OTH: 'ICAO_OTH',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  PARSE_ERROR: 'PARSE_ERROR',
  EMPTY_RESPONSE: 'EMPTY_RESPONSE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const

export type ValidationReasonType = typeof ValidationReason[keyof typeof ValidationReason]

// Human-readable descriptions for validation reasons
export const ValidationReasonDescriptions: Record<ValidationReasonType, string> = {
  [ValidationReason.NO_FACE]: 'No face detected.',
  [ValidationReason.BG]: 'Background invalid.',
  [ValidationReason.POSE_DIR]: 'Head tilt/rotation.',
  [ValidationReason.POSE_CTR]: 'Head not centered.',
  [ValidationReason.EXPR]: 'Expression not neutral.',
  [ValidationReason.LIGHT]: 'Lighting issues.',
  [ValidationReason.EYES_OBS]: 'Eyes obscured.',
  [ValidationReason.EYES_CL]: 'Eyes closed.',
  [ValidationReason.GLS_GLARE]: 'Glasses glare.',
  [ValidationReason.GLS_TINT]: 'Tinted glasses.',
  [ValidationReason.HD_COVER]: 'Head covering.',
  [ValidationReason.QUAL_BLUR]: 'Blurry image.',
  [ValidationReason.QUAL_REDEYE]: 'Red-eye detected.',
  [ValidationReason.CTRY_DIM]: 'Invalid dimensions.',
  [ValidationReason.CTRY_SPEC]: 'Specific rule violation.',
  [ValidationReason.ICAO_OTH]: 'ICAO compliance issue.',
  [ValidationReason.INVALID_RESPONSE]: 'Invalid service response.',
  [ValidationReason.PARSE_ERROR]: 'Response parsing error.',
  [ValidationReason.EMPTY_RESPONSE]: 'Empty response.',
  [ValidationReason.VALIDATION_ERROR]: 'Validation error.',
}

// Likelihood values from Cloud Vision API that indicate failure
export const FailLikelihoods = new Set([
  'POSSIBLE',
  'LIKELY', 
  'VERY_LIKELY',
])

export const LandmarkType = {
  UNKNOWN_LANDMARK: 'UNKNOWN_LANDMARK'  ,
  LEFT_EYE: 'LEFT_EYE',
  RIGHT_EYE: 'RIGHT_EYE',
  LEFT_OF_LEFT_EYEBROW: 'LEFT_OF_LEFT_EYEBROW',
  RIGHT_OF_LEFT_EYEBROW: 'RIGHT_OF_LEFT_EYEBROW',
  LEFT_OF_RIGHT_EYEBROW: 'LEFT_OF_RIGHT_EYEBROW',
  RIGHT_OF_RIGHT_EYEBROW: 'RIGHT_OF_RIGHT_EYEBROW',
  MIDPOINT_BETWEEN_EYES: 'MIDPOINT_BETWEEN_EYES',
  NOSE_TIP: 'NOSE_TIP',
  UPPER_LIP: 'UPPER_LIP',
  LOWER_LIP: 'LOWER_LIP',
  MOUTH_LEFT: 'MOUTH_LEFT',
  MOUTH_RIGHT: 'MOUTH_RIGHT',
  MOUTH_CENTER: 'MOUTH_CENTER',
  NOSE_BOTTOM_RIGHT: 'NOSE_BOTTOM_RIGHT',
  NOSE_BOTTOM_LEFT: 'NOSE_BOTTOM_LEFT',
  NOSE_BOTTOM_CENTER: 'NOSE_BOTTOM_CENTER',
  LEFT_EYE_TOP_BOUNDARY: 'LEFT_EYE_TOP_BOUNDARY',
  LEFT_EYE_RIGHT_CORNER: 'LEFT_EYE_RIGHT_CORNER',
  LEFT_EYE_BOTTOM_BOUNDARY: 'LEFT_EYE_BOTTOM_BOUNDARY',
  LEFT_EYE_LEFT_CORNER: 'LEFT_EYE_LEFT_CORNER',
  RIGHT_EYE_TOP_BOUNDARY: 'RIGHT_EYE_TOP_BOUNDARY',
  RIGHT_EYE_RIGHT_CORNER: 'RIGHT_EYE_RIGHT_CORNER',
  RIGHT_EYE_BOTTOM_BOUNDARY: 'RIGHT_EYE_BOTTOM_BOUNDARY',
  RIGHT_EYE_LEFT_CORNER: 'RIGHT_EYE_LEFT_CORNER',
  LEFT_EYEBROW_UPPER_MIDPOINT: 'LEFT_EYEBROW_UPPER_MIDPOINT',
  RIGHT_EYEBROW_UPPER_MIDPOINT: 'RIGHT_EYEBROW_UPPER_MIDPOINT',
  LEFT_EAR_TRAGION: 'LEFT_EAR_TRAGION',
  RIGHT_EAR_TRAGION: 'RIGHT_EAR_TRAGION',
  LEFT_EYE_PUPIL: 'LEFT_EYE_PUPIL',
  RIGHT_EYE_PUPIL: 'RIGHT_EYE_PUPIL',
  FOREHEAD_GLABELLA: 'FOREHEAD_GLABELLA',
  CHIN_GNATHION: 'CHIN_GNATHION',
  CHIN_LEFT_GONION: 'CHIN_LEFT_GONION',
  CHIN_RIGHT_GONION: 'CHIN_RIGHT_GONION',
  LEFT_CHEEK_CENTER: 'LEFT_CHEEK_CENTER',
  RIGHT_CHEEK_CENTER: 'RIGHT_CHEEK_CENTER',
} as const;

// Types for face data used in preprocessing
export interface FaceData {
  bbox: [number, number, number, number] // [x1, y1, x2, y2]
  landmarks: Array<{ x: number; y: number }>
  crownY: number
  chinY: number
}

// Initial validation result type
// FaceAnnotation type is imported from @google-cloud/vision in the validator
export interface InitialValidationResult {
  success: boolean
  faceAnnotation?: unknown // Typed properly in cloud-vision-validator.ts
  reason?: ValidationReasonType
  details?: string
}

// Final validation response matching the API contract
export interface ValidationResponse {
  success: boolean
  status: ComplianceStatusType
  reason_code: ReasonCodeType
  details?: {
    validator_reason_code?: string
    validator_reason_description?: string
    error?: string
  }
  processedImage?: Buffer
}

