/**
 * Google Cloud Vision API-based photo validation module.
 * Handles face detection, pose analysis, and ICAO compliance checks.
 */

import { ImageAnnotatorClient, protos } from '@google-cloud/vision'
import { getVercelOidcToken } from '@vercel/functions/oidc'
import { ExternalAccountClient } from 'google-auth-library'
import {
  ICAOConfig,
  ValidationThresholds,
  ValidationReason,
  ValidationReasonDescriptions,
  FailLikelihoods,
  LandmarkType,
  type ValidationReasonType,
  type FaceData,
  type InitialValidationResult,
} from './validation-constants.js'

type IFaceAnnotation = protos.google.cloud.vision.v1.IFaceAnnotation
type IAnnotateImageResponse = protos.google.cloud.vision.v1.IAnnotateImageResponse
type ILandmark = protos.google.cloud.vision.v1.FaceAnnotation.ILandmark

let visionClient: ImageAnnotatorClient

function getVisionClient(): ImageAnnotatorClient {
  if (visionClient) return visionClient

  if (process.env.USE_LOCAL_STORAGE !== 'true') {
    const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID
    const GCP_PROJECT_NUMBER = process.env.GCP_PROJECT_NUMBER
    const GCP_SERVICE_ACCOUNT_EMAIL = process.env.GCP_SERVICE_ACCOUNT_EMAIL
    const GCP_WORKLOAD_IDENTITY_POOL_ID = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID
    const GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID

    const authClient = ExternalAccountClient.fromJSON({
      type: 'external_account',
      audience: `//iam.googleapis.com/projects/${GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${GCP_WORKLOAD_IDENTITY_POOL_ID}/providers/${GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID}`,
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      token_url: 'https://sts.googleapis.com/v1/token',
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${GCP_SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
      subject_token_supplier: {
        getSubjectToken: getVercelOidcToken,
      },
    })

    if (!authClient) {
      throw new Error('Failed to initialize External Account Client for Vision API')
    }

    visionClient = new ImageAnnotatorClient({
      authClient: authClient as never,
      projectId: GCP_PROJECT_ID,
    })
  } else {
    // Local development - use default credentials
    visionClient = new ImageAnnotatorClient()
  }

  return visionClient
}

// Helper to get landmarks by type
function getLandmarksByType(face: IFaceAnnotation): Map<string, ILandmark> {
  const map = new Map<string, ILandmark>()
  for (const lm of face.landmarks || []) {
    if (lm.type) {
      map.set(lm.type.toString(), lm)
    }
  }
  return map
}

// Validate eyes are visible and open
function validateEyesVisible(face: IFaceAnnotation): ValidationReasonType | null {
  const landmarks = getLandmarksByType(face)
  const leftPupil = landmarks.get(LandmarkType.LEFT_EYE_PUPIL)
  const rightPupil = landmarks.get(LandmarkType.RIGHT_EYE_PUPIL)

  if (leftPupil && rightPupil) {
    return null
  }

  // Fallback: check eye opening using boundary landmarks
  const leftTop = landmarks.get(LandmarkType.LEFT_EYE_TOP_BOUNDARY)
  const leftBottom = landmarks.get(LandmarkType.LEFT_EYE_BOTTOM_BOUNDARY)
  const rightTop = landmarks.get(LandmarkType.RIGHT_EYE_TOP_BOUNDARY)
  const rightBottom = landmarks.get(LandmarkType.RIGHT_EYE_BOTTOM_BOUNDARY)


  // Check if we have boundary landmarks for at least one eye
  if (!(leftTop && leftBottom) && !(rightTop && rightBottom)) {
    return ValidationReason.EYES_CL
  }

  // Check left eye opening
  if (leftTop && leftBottom && leftTop.position?.y && leftBottom.position?.y) {
    const leftOpening = Math.abs(leftTop.position.y - leftBottom.position.y)
    if (leftOpening < ValidationThresholds.minEyeOpeningPixels) {
      return ValidationReason.EYES_CL
    }
  }

  // Check right eye opening
  if (rightTop && rightBottom && rightTop.position?.y && rightBottom.position?.y) {
    const rightOpening = Math.abs(rightTop.position.y - rightBottom.position.y)
    if (rightOpening < ValidationThresholds.minEyeOpeningPixels) {
      return ValidationReason.EYES_CL
    }
  }

  return null
}

// Validate glasses glare
function validateGlassesGlare(
  response: IAnnotateImageResponse,
  face: IFaceAnnotation
): ValidationReasonType | null {
  const hasGlasses = (response.labelAnnotations || []).some(
    (l) =>
      l.description?.toLowerCase().includes('glasses') ||
      l.description?.toLowerCase().includes('eyeglass')
  )

  if (!hasGlasses) return null

  const landmarks = getLandmarksByType(face)
  if (landmarks.has(LandmarkType.LEFT_EYE) && landmarks.has(LandmarkType.RIGHT_EYE)) {
    return null
  }

  return ValidationReason.GLS_GLARE
}

// Validate cheek centers


// Validate head pose
function validateHeadPose(face: IFaceAnnotation): ValidationReasonType | null {
  const rollAngle = face.rollAngle ?? 0
  const panAngle = face.panAngle ?? 0
  const tiltAngle = face.tiltAngle ?? 0

  if (
    Math.abs(rollAngle) > ICAOConfig.maxAbsRoll ||
    Math.abs(panAngle) > ICAOConfig.maxAbsYaw ||
    Math.abs(tiltAngle) > ICAOConfig.maxAbsPitch
  ) {
    return ValidationReason.POSE_DIR
  }

  return null
}

// Validate expression is neutral
function validateExpression(face: IFaceAnnotation): ValidationReasonType | null {
  const likelihoods = [
    face.joyLikelihood,
    face.sorrowLikelihood,
    face.angerLikelihood,
    face.surpriseLikelihood,
  ]

  if (likelihoods.some((l) => l && FailLikelihoods.has(l.toString()))) {
    return ValidationReason.EXPR
  }

  return null
}

// Validate headwear
function validateHeadwear(face: IFaceAnnotation): ValidationReasonType | null {
  if (face.headwearLikelihood && FailLikelihoods.has(face.headwearLikelihood.toString())) {
    return ValidationReason.HD_COVER
  }
  return null
}

// Validate sunglasses
function validateSunglasses(response: IAnnotateImageResponse): ValidationReasonType | null {
  const hasSunglasses = (response.labelAnnotations || []).some((l) =>
    l.description?.toLowerCase().includes('sunglasses')
  )

  if (hasSunglasses) {
    return ValidationReason.GLS_TINT
  }

  return null
}

// Validate blur
function validateBlur(face: IFaceAnnotation): ValidationReasonType | null {
  if (face.blurredLikelihood && FailLikelihoods.has(face.blurredLikelihood.toString())) {
    return ValidationReason.QUAL_BLUR
  }
  return null
}

// Validate under-exposure
function validateUnderExposure(face: IFaceAnnotation): ValidationReasonType | null {
  if (face.underExposedLikelihood && FailLikelihoods.has(face.underExposedLikelihood.toString())) {
    return ValidationReason.LIGHT
  }
  return null
}

// Validate confidence levels
function validateConfidence(face: IFaceAnnotation): ValidationReasonType | null {
  if ((face.landmarkingConfidence ?? 0) < ValidationThresholds.landmarkingConfidence) {
    return ValidationReason.VALIDATION_ERROR
  }
  if ((face.detectionConfidence ?? 0) < ValidationThresholds.detectionConfidence) {
    return ValidationReason.VALIDATION_ERROR
  }
  return null
}

// Run all initial validation checks
function runInitialChecks(
  response: IAnnotateImageResponse,
  face: IFaceAnnotation
): { success: boolean; reason?: ValidationReasonType } {
  // Confidence checks
  let reason = validateConfidence(face)
  if (reason) return { success: false, reason }

  // Blur check
  reason = validateBlur(face)
  if (reason) return { success: false, reason }

  // Eyes visibility
  reason = validateEyesVisible(face)
  if (reason) return { success: false, reason }

  // Under-exposure
  reason = validateUnderExposure(face)
  if (reason) return { success: false, reason }

  // Head pose
  reason = validateHeadPose(face)
  if (reason) return { success: false, reason }

  // Expression
  reason = validateExpression(face)
  if (reason) return { success: false, reason }

  // Glasses glare
  reason = validateGlassesGlare(response, face)
  if (reason) return { success: false, reason }

  // Sunglasses
  reason = validateSunglasses(response)
  if (reason) return { success: false, reason }

  // Headwear
  reason = validateHeadwear(face)
  if (reason) return { success: false, reason }

  return { success: true }
}

/**
 * Performs initial validation using Cloud Vision API.
 * Checks for face detection, blur, pose, expression, etc.
 */
export async function validateInitial(imageBuffer: Buffer): Promise<InitialValidationResult> {
  try {
    const client = getVisionClient()

    const [result] = await client.annotateImage({
      image: { content: imageBuffer.toString('base64') },
      features: [
        { type: 'FACE_DETECTION', maxResults: 1 },
        { type: 'LABEL_DETECTION', maxResults: 5 },
        { type: 'IMAGE_PROPERTIES' },
      ],
    })

    if (result.error?.message) {
      return {
        success: false,
        reason: ValidationReason.VALIDATION_ERROR,
        details: result.error.message,
      }
    }

    const faceAnnotations = result.faceAnnotations || []

    if (faceAnnotations.length === 0) {
      return {
        success: false,
        reason: ValidationReason.NO_FACE,
      }
    }

    if (faceAnnotations.length > 1) {
      return {
        success: false,
        reason: ValidationReason.ICAO_OTH,
        details: 'Multiple faces detected',
      }
    }

    const face = faceAnnotations[0]
    const checkResult = runInitialChecks(result, face)

    if (!checkResult.success) {
      return {
        success: false,
        reason: checkResult.reason,
        details: checkResult.reason
          ? ValidationReasonDescriptions[checkResult.reason]
          : undefined,
      }
    }

    return {
      success: true,
      faceAnnotation: face,
    }
  } catch (error) {
    console.error('Vision API validation error:', error)
    return {
      success: false,
      reason: ValidationReason.VALIDATION_ERROR,
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Validates final geometry of processed image.
 * Checks dimensions and head centering.
 */
export function validateFinalGeometry(
  imageWidth: number,
  imageHeight: number,
  faceData: FaceData
): { success: boolean; reason?: ValidationReasonType } {
  // Check aspect ratio
  const aspectRatio = imageWidth / imageHeight
  if (Math.abs(aspectRatio - ICAOConfig.targetAspectRatio) > ICAOConfig.aspectRatioTolerance) {
    return { success: false, reason: ValidationReason.CTRY_DIM }
  }

  // Check head height ratio
  const headHeightPx = faceData.bbox[3] - faceData.bbox[1]
  const headHeightRatio = headHeightPx / imageHeight

  if (headHeightRatio < ICAOConfig.minChinToCrownRatio) {
    return { success: false, reason: ValidationReason.CTRY_DIM }
  }
  if (headHeightRatio > ICAOConfig.maxChinToCrownRatio) {
    return { success: false, reason: ValidationReason.CTRY_DIM }
  }

  // Check head centering
  const faceCenterX = (faceData.bbox[0] + faceData.bbox[2]) / 2
  const imageCenterX = imageWidth / 2
  const tolerance = imageWidth * ValidationThresholds.headCenteringToleranceRatio

  if (Math.abs(faceCenterX - imageCenterX) > tolerance) {
    return { success: false, reason: ValidationReason.POSE_CTR }
  }

  return { success: true }
}

/**
 * Extracts face details from Cloud Vision face annotation for preprocessing.
 */
export function extractFaceDetails(
  faceAnnotation: IFaceAnnotation
): { faceDetails: FaceData; error?: string } | { faceDetails?: undefined; error: string } {
  const fullPoly = faceAnnotation.boundingPoly
  if (!fullPoly?.vertices?.length) {
    return { error: 'Full bounding polygon not found.' }
  }

  const trueCrownY = Math.min(...fullPoly.vertices.map((v) => v.y ?? 0))
  const fdPoly = faceAnnotation.fdBoundingPoly

  if (!fdPoly?.vertices?.length) {
    return { error: 'FD bounding polygon not found.' }
  }

  const fdYCoords = fdPoly.vertices.map((v) => v.y ?? 0)
  const fdXCoords = fdPoly.vertices.map((v) => v.x ?? 0)

  const chinY = Math.max(...fdYCoords)
  const bbox: [number, number, number, number] = [
    Math.min(...fdXCoords),
    trueCrownY,
    Math.max(...fdXCoords),
    chinY,
  ]

  const landmarks =
    faceAnnotation.landmarks?.map((lm) => ({
      x: lm.position?.x ?? 0,
      y: lm.position?.y ?? 0,
    })) || []

  return {
    faceDetails: {
      bbox,
      landmarks,
      crownY: trueCrownY,
      chinY,
    },
  }
}

