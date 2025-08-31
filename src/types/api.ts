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