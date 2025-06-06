// client.ts
import { Document, DocumentResponse, API_ENDPOINTS } from '../types/api';

// 1. Define a variable for the API base URL using Vite's import.meta.env
//    VITE_ prefix is crucial. The '??' operator provides a fallback for local development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // 2. Use the dynamic API_BASE_URL
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json', // Good practice to include
            ...options?.headers,
        },
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            throw new Error(`API error: ${response.status} - ${response.statusText}`);
        }
        throw new Error(`API error (${response.status}): ${errorData.message || response.statusText}`, { cause: errorData });
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