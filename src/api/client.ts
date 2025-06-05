import { Document, DocumentResponse, API_ENDPOINTS } from '../types/api';
import { config } from '../config';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
}

export const api = {
    documents: {
        list: () => fetchApi<DocumentResponse[]>(API_ENDPOINTS.documents.list),
        create: (document: Document) => 
            fetchApi<DocumentResponse>(API_ENDPOINTS.documents.create, {
                method: 'POST',
                body: JSON.stringify(document),
            }),
        get: (id: string) => 
            fetchApi<DocumentResponse>(API_ENDPOINTS.documents.get(id)),
    },
}; 