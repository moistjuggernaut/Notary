export interface ValidationResult {
  status: 'success' | 'warning' | 'error';
  checks?: {
    name: string;
    description: string;
    status: 'pass' | 'warning' | 'fail';
  }[];
  recommendations?: string[];
  summary: string;
  orderId?: string;
  imageUrl?: string;
} 