// client.ts
import { API_ENDPOINTS, ValidationRequest, ValidationResponse, RemoveBackgroundRequest, RemoveBackgroundResponse } from '@/types/api';

const API_BASE_URL = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
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

// Photo validation function - uploads and validates in one step
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

export async function removeBackground(orderId: string): Promise<RemoveBackgroundResponse> {
    try {
        const request: RemoveBackgroundRequest = { orderId };
        return await fetchApi<RemoveBackgroundResponse>(API_ENDPOINTS.photo.removeBackground, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    } catch (error) {
        console.error('Remove background error:', error);
        throw error;
    }
}

// Existing document functions...
// ... rest of your existing API functions