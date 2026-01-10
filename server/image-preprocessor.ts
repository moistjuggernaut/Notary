/**
 * Image preprocessing module for passport photo validation.
 * Handles cropping and resizing using Sharp for ICAO-compliant output.
 */

import sharp from 'sharp'
import { ICAOConfig, type FaceData } from './validation-constants.js'

interface CropCoordinates {
  x: number
  y: number
  width: number
  height: number
}

interface ProcessingResult {
  success: boolean
  processedImage?: Buffer
  faceData?: FaceData
  error?: string
}

/**
 * Calculates crop coordinates based on face details and ICAO requirements.
 */
function calculateCropCoordinates(
  imageWidth: number,
  imageHeight: number,
  faceDetails: FaceData
): CropCoordinates | null {
  const { chinY, crownY, bbox } = faceDetails

  let headHeightPx = chinY - crownY
  if (headHeightPx <= 0) {
    headHeightPx = bbox[3] - bbox[1]
  }

  if (headHeightPx <= 0) {
    return null
  }

  // Calculate target crop dimensions based on head height ratio
  const targetCropH = headHeightPx / ICAOConfig.targetHeadHeightRatio
  const targetCropW = targetCropH * ICAOConfig.targetAspectRatio

  // Center crop horizontally on face
  const faceCenterX = (bbox[0] + bbox[2]) / 2
  let cropX1 = faceCenterX - targetCropW / 2
  let cropX2 = cropX1 + targetCropW

  // Position crop vertically with space above head
  const spaceAboveHead = targetCropH * ICAOConfig.headPosRatioVertical
  let cropY1 = crownY - spaceAboveHead
  let cropY2 = cropY1 + targetCropH

  // Clamp to image bounds
  cropX1 = Math.max(0, Math.floor(cropX1))
  cropY1 = Math.max(0, Math.floor(cropY1))
  cropX2 = Math.min(imageWidth, Math.floor(cropX2))
  cropY2 = Math.min(imageHeight, Math.floor(cropY2))

  const width = cropX2 - cropX1
  const height = cropY2 - cropY1

  if (width <= 0 || height <= 0) {
    return null
  }

  return {
    x: cropX1,
    y: cropY1,
    width,
    height,
  }
}

/**
 * Transforms landmarks from original image coordinates to final image coordinates.
 */
function transformLandmarks(
  landmarks: Array<{ x: number; y: number }>,
  cropCoords: CropCoordinates,
  finalWidth: number,
  finalHeight: number
): Array<{ x: number; y: number }> {
  if (cropCoords.width === 0 || cropCoords.height === 0) {
    return landmarks
  }

  const scaleX = finalWidth / cropCoords.width
  const scaleY = finalHeight / cropCoords.height

  return landmarks.map((lm) => ({
    x: (lm.x - cropCoords.x) * scaleX,
    y: (lm.y - cropCoords.y) * scaleY,
  }))
}

/**
 * Processes an image for passport photo validation.
 * Pipeline: Extract metadata → Crop → Resize → Transform landmarks
 */
export async function processImage(
  imageBuffer: Buffer,
  faceDetails: FaceData
): Promise<ProcessingResult> {
  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata()
    const imageWidth = metadata.width
    const imageHeight = metadata.height

    if (!imageWidth || !imageHeight) {
      return { success: false, error: 'Could not read image dimensions' }
    }

    // Calculate crop coordinates
    const cropCoords = calculateCropCoordinates(imageWidth, imageHeight, faceDetails)
    if (!cropCoords) {
      return { success: false, error: 'Failed to calculate crop coordinates' }
    }

    // Final output dimensions
    const finalWidth = ICAOConfig.finalOutputWidthPx
    const finalHeight = ICAOConfig.finalOutputHeightPx

    // Crop and resize image
    const processedImage = await sharp(imageBuffer)
      .extract({
        left: cropCoords.x,
        top: cropCoords.y,
        width: cropCoords.width,
        height: cropCoords.height,
      })
      .resize(finalWidth, finalHeight, {
        fit: 'fill',
        kernel: 'lanczos3', // High-quality downsampling
      })
      .jpeg()
      .toBuffer()

    // Transform landmarks to new coordinates
    const transformedLandmarks = transformLandmarks(
      faceDetails.landmarks,
      cropCoords,
      finalWidth,
      finalHeight
    )

    // Calculate final face data
    const scaleY = finalHeight / cropCoords.height
    const finalCrownY = (faceDetails.crownY - cropCoords.y) * scaleY
    const finalChinY = (faceDetails.chinY - cropCoords.y) * scaleY

    // Calculate bbox from transformed landmarks
    const xCoords = transformedLandmarks.map((lm) => lm.x)
    const minX = xCoords.length > 0 ? Math.min(...xCoords) : 0
    const maxX = xCoords.length > 0 ? Math.max(...xCoords) : finalWidth

    const finalFaceData: FaceData = {
      bbox: [minX, finalCrownY, maxX, finalChinY],
      landmarks: transformedLandmarks,
      crownY: finalCrownY,
      chinY: finalChinY,
    }

    return {
      success: true,
      processedImage,
      faceData: finalFaceData,
    }
  } catch (error) {
    console.error('Image preprocessing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Preprocessing failed',
    }
  }
}

/**
 * Converts a base64 image string to a Buffer.
 */
export function base64ToBuffer(base64Image: string): Buffer {
  // Remove data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

/**
 * Converts a Buffer to a base64 string.
 */
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64')
}
