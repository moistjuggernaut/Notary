/**
 * Main photo validation orchestrator.
 * Combines Cloud Vision validation with image preprocessing.
 */

import {
  ComplianceStatus,
  ReasonCode,
  ValidationReasonDescriptions,
  ICAOConfig,
  type ValidationResponse,
  type ValidationReasonType,
} from './validation-constants.js'
import {
  validateInitial,
  validateFinalGeometry,
  extractFaceDetails,
} from './cloud-vision-validator.js'
import { processImage } from './image-preprocessor.js'
import sharp from 'sharp'

/**
 * Main entry point for photo validation.
 * Runs the complete compliance check pipeline:
 * 1. Cloud Vision API initial validation
 * 2. Image preprocessing (crop, resize)
 * 3. Final geometry validation
 *
 * @param imageBuffer - The image as a Buffer
 * @returns ValidationResponse with success status and processed image if valid
 */
export async function validatePhoto(imageBuffer: Buffer): Promise<ValidationResponse> {
  if (!imageBuffer || imageBuffer.length === 0) {
    return {
      success: false,
      status: ComplianceStatus.REJECTED,
      reason_code: ReasonCode.INVALID_IMAGE_DATA,
    }
  }

  try {
    // Normalize EXIF orientation
    const normalizedBuffer = await sharp(imageBuffer)
      .rotate()
      .toBuffer()

    // 1. Initial Validation with Cloud Vision API
    console.log('Starting initial validation...')
    const initialResult = await validateInitial(normalizedBuffer)

    if (!initialResult.success) {
      console.log(`Initial validation failed: ${initialResult.reason}`)
      return {
        success: false,
        status: ComplianceStatus.REJECTED,
        reason_code: ReasonCode.VALIDATION_FAILED,
        details: {
          validator_reason_code: initialResult.reason,
          validator_reason_description:
            initialResult.details ||
            (initialResult.reason ? ValidationReasonDescriptions[initialResult.reason] : undefined),
        },
      }
    }

    if (!initialResult.faceAnnotation) {
      return {
        success: false,
        status: ComplianceStatus.REJECTED,
        reason_code: ReasonCode.NO_FACE_DETECTED,
      }
    }

    // Extract face details for preprocessing
    const extractResult = extractFaceDetails(initialResult.faceAnnotation)
    if (extractResult.error || !extractResult.faceDetails) {
      console.log(`Face details extraction failed: ${extractResult.error}`)
      return {
        success: false,
        status: ComplianceStatus.REJECTED,
        reason_code: ReasonCode.PREPROCESSING_FAILED,
        details: {
          validator_reason_description: extractResult.error,
        },
      }
    }

    // 2. Image Preprocessing (crop and resize)
    console.log('Processing image...')
    const processingResult = await processImage(normalizedBuffer, extractResult.faceDetails)

    if (!processingResult.success || !processingResult.processedImage || !processingResult.faceData) {
      console.log(`Image preprocessing failed: ${processingResult.error}`)
      return {
        success: false,
        status: ComplianceStatus.REJECTED,
        reason_code: ReasonCode.PREPROCESSING_FAILED,
        details: {
          validator_reason_description: processingResult.error,
        },
      }
    }

    // 3. Final Geometry Validation
    console.log('Validating final geometry...')
    const geometryResult = validateFinalGeometry(
      ICAOConfig.finalOutputWidthPx,
      ICAOConfig.finalOutputHeightPx,
      processingResult.faceData
    )

    if (!geometryResult.success) {
      console.log(`Final geometry validation failed: ${geometryResult.reason}`)
      return {
        success: false,
        status: ComplianceStatus.REJECTED,
        reason_code: ReasonCode.VALIDATION_FAILED,
        details: {
          validator_reason_code: geometryResult.reason,
          validator_reason_description: geometryResult.reason
            ? ValidationReasonDescriptions[geometryResult.reason]
            : undefined,
        },
      }
    }

    // Success!
    console.log('Photo validation passed')
    return {
      success: true,
      status: ComplianceStatus.COMPLIANT,
      reason_code: ReasonCode.ALL_CHECKS_PASSED,
      processedImage: processingResult.processedImage,
    }
  } catch (error) {
    console.error('Validation error:', error)
    return {
      success: false,
      status: ComplianceStatus.REJECTED,
      reason_code: ReasonCode.INTERNAL_SERVER_ERROR,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Validates a base64-encoded image.
 * Convenience wrapper around validatePhoto.
 *
 * @param base64Image - The image as a base64 string
 * @returns ValidationResponse with success status and processed image if valid
 */
export async function validatePhotoBase64(base64Image: string): Promise<ValidationResponse> {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
  const imageBuffer = Buffer.from(base64Data, 'base64')
  return validatePhoto(imageBuffer)
}
