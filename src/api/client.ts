// client.ts
import { API_ENDPOINTS, ValidationRequest, ValidationResponse, QuickCheckRequest, QuickCheckResponse } from '../types/api';

// 1. Define a variable for the API base URL using Vite's import.meta.env
//    VITE_ prefix is crucial. The '??' operator provides a fallback for local development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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
        throw new Error(`API error (${response.status}): ${errorData.message || response.statusText}`);
    }

    return response.json();
}

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
    });
}

// Quick check function
export async function quickCheckPhoto(file: File): Promise<QuickCheckResponse> {
    try {
        const base64Image = await fileToBase64(file);
        const request: QuickCheckRequest = {
            image: base64Image,
            filename: file.name
        };

        return await fetchApi<QuickCheckResponse>(API_ENDPOINTS.photo.quickCheck, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    } catch (error) {
        console.error('Quick check failed:', error);
        throw error;
    }
}

// Photo validation function
export async function validatePhoto(file: File): Promise<ValidationResponse> {
    try {
        const base64Image = await fileToBase64(file);
        const request: ValidationRequest = {
            image: base64Image,
            filename: file.name
        };

        return await fetchApi<ValidationResponse>(API_ENDPOINTS.photo.validate, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    } catch (error) {
        console.error('Photo validation error:', error);
        throw error;
    }
}

export async function preprocessPhoto(file: File): Promise<Blob> {
    // This would be implemented similar to validatePhoto
    // For now, just return the original file as a blob
    return new Blob([file], { type: file.type });
}

// Existing document functions...
// ... rest of your existing API functions