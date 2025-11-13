export const errorMessages: Record<string, { summary: string; description: string; recommendations: string[] }> = {
  NO_FACE_DETECTED: {
    summary: 'No face was detected in the photo. Please ensure your face is clearly visible.',
    description: 'No face could be detected in the image',
    recommendations: [
      'Ensure your face is clearly visible and centered in the frame',
      'Make sure the photo is not too dark or overexposed',
      'Remove any objects that might obstruct your face'
    ]
  },
  MULTIPLE_FACES_DETECTED: {
    summary: 'Multiple faces detected. Only one person should be in the photo.',
    description: 'Multiple faces were detected in the image',
    recommendations: [
      'Take a photo with only one person in the frame',
      'Ensure no other people are visible in the background'
    ]
  },
  PREPROCESSING_FAILED: {
    summary: 'Image processing failed. The photo may not meet technical requirements.',
    description: 'Failed to process the image to passport photo standards',
    recommendations: [
      'Ensure the photo is clear and in focus',
      'Use a plain, light-colored background',
      'Make sure your face is properly positioned and visible'
    ]
  },
  VALIDATION_FAILED: {
    summary: 'Photo does not meet EU biometric requirements.',
    description: 'Photo does not meet biometric standards',
    recommendations: [
      'Review the specific issue mentioned above',
      'Ensure proper lighting without shadows',
      'Maintain a neutral expression with eyes open',
      'Use a plain light background'
    ]
  },
  INVALID_IMAGE_DATA: {
    summary: 'Invalid image data. Please upload a valid photo file.',
    description: 'The uploaded file could not be processed',
    recommendations: [
      'Upload a valid image file (JPEG, PNG)',
      'Ensure the file is not corrupted',
      'Try taking a new photo'
    ]
  },
  INTERNAL_SERVER_ERROR: {
    summary: 'A technical error occurred during validation. Please try again.',
    description: 'Internal server error occurred',
    recommendations: [
      'Please try validating your photo again',
      'If the problem persists, contact support'
    ]
  }
};
