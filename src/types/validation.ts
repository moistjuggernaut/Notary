export interface ValidationResult {
  status: 'success' | 'warning' | 'error';
  checks: {
    name: string;
    description: string;
    status: 'pass' | 'warning' | 'fail';
    category: 'photo_quality' | 'face_position' | 'framing' | 'technical';
  }[];
  recommendations?: string[];
  summary: string; // Clear summary message
  // Storage information (when available)
  orderId?: string; // UUID of the stored order
  validatedImageUrl?: string; // Signed URL to access the validated image
} 