export interface Document {
    id?: string;
    title: string;
    content: string;
    created_at: string;
    status: string;
}

export interface DocumentResponse {
    id: string;
    title: string;
    content: string;
    created_at: string;
    status: string;
}

// Photo validation types for the serverless API
export interface ValidationRequest {
    orderId: string; // UUID from quick check response
}

export interface ValidationLogEntry {
    status: 'PASS' | 'FAIL' | 'WARNING' | 'INFO' | 'UNKNOWN';
    step: string;
    message: string;
}

export interface ValidationResponse {
    success: boolean;
    recommendation: string;
    logs: {
        preprocessing: ValidationLogEntry[];
        validation: ValidationLogEntry[];
    };
    orderId?: string; // UUID of the stored order
    imageUrl?: string; // Signed URL to access the validated image
    error?: string; // Error message if validation failed or storage failed
}

export const API_ENDPOINTS = {
    documents: {
        list: '/documents',
        create: '/documents',
        get: (id: string) => `/documents/${id}`,
    },
    photo: {
        validate: '/photo/validate',
        quickCheck: '/photo/quick-check',
    },
} as const;

// --- Quick Check ---
export interface QuickCheckRequest {
    image: string; // base64 encoded image
    filename?: string;
}

export interface QuickCheckResponse {
    success: boolean;
    faceCount: number;
    message: string;
    imageUrl?: string;
    orderId?: string;
}

// --- Order Management ---

export interface ShippingInfo {
    first_name: string
    last_name: string
    address_1: string
    address_2?: string
    city: string
    postal_or_zip_code: string
    state?: string
    country_code: string
    email?: string
    phone?: string
}

export interface Order {
  id: string
  status: string
  familinkId?: string
  shipping?: ShippingInfo
  stripePaymentIntentId?: string
  stripeSessionId?: string
  createdAt: string
  updatedAt: string
  rejectionReason?: string
  imageUrl?: string | null
}

export interface OrdersResponse {
    success: boolean
    orders: Order[]
    error?: string
}

export interface OrderActionResponse {
    success: boolean
    message?: string
    error?: string
}

export const REJECTION_REASONS = [
    'Background incorrect or not uniform',
    'Face too small or poorly positioned',
    'Eyes not visible or closed',
    'Poor lighting or shadows on face',
    'Glasses with glare or tinted lenses',
    'Head covering obscuring face',
    'Image quality too low',
    'Non neutral expression (smiling, frowning, etc.)',
    'Other violation'
] as const 