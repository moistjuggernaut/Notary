export interface ValidationResult {
  status: 'success' | 'warning' | 'error';
  checks: {
    name: string;
    description: string;
    status: 'pass' | 'warning' | 'fail';
    category: 'photo_quality' | 'face_position' | 'framing' | 'technical';
  }[];
  recommendations?: string[];
  processedImage?: string; // Base64 encoded processed image
  summary: string; // Clear summary message
} 