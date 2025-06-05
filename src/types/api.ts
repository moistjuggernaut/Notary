export interface Document {
    id?: string;
    title: string;
    content: string;
    created_at: string; // ISO date string
    status: string;
}

export interface DocumentResponse {
    id: string;
    title: string;
    content: string;
    created_at: string; // ISO date string
    status: string;
}

// API endpoints
export const API_ENDPOINTS = {
    documents: {
        list: '/api/documents',
        create: '/api/documents',
        get: (id: string) => `/api/documents/${id}`,
    },
} as const; 