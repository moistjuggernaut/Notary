export interface ValidationResult {
  status: 'success' | 'warning' | 'error';
  score: number;
  checks: {
    name: string;
    description: string;
    score: number;
    status: 'pass' | 'warning' | 'fail';
  }[];
  recommendations?: string[];
  processedImage?: string; // Base64 encoded processed image
} 