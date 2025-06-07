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
    image: string; // Base64 encoded image data
    filename?: string;
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
    processed_image?: string; // Base64 encoded processed image (if successful)
    error?: string;
}

export const API_ENDPOINTS = {
    documents: {
        list: '/documents',
        create: '/documents',
        get: (id: string) => `/documents/${id}`,
    },
    photo: {
        validate: '/api/validate_photo',
        preprocess: '/api/preprocess_photo',
    },
} as const; 