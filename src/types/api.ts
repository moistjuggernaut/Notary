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

export const API_ENDPOINTS = {
    documents: {
        list: '/documents',
        create: '/documents',
        get: (id: string) => `/documents/${id}`,
    },
    photo: {
        validate: '/validate-photo',
        preprocess: '/preprocess-photo',
    },
} as const; 