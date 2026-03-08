import type { ValidationRequest, ValidationResponse, RemoveBackgroundRequest, RemoveBackgroundResponse } from '@/types/api';

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
        } catch {
            throw new Error(`API error: ${response.status} - ${response.statusText}`);
        }
        throw new Error(`API error (${response.status}): ${errorData.message || response.statusText}`);
    }

    return response.json();
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
    });
}

export async function validatePhoto(
    file: File,
    country?: string,
    docType?: 'passport' | 'drivers_license'
): Promise<ValidationResponse> {
    const base64Image = await fileToBase64(file);
    const request: ValidationRequest = {
        image: base64Image,
        filename: file.name,
        ...(country && { country }),
        ...(docType && { docType }),
    };

    const response = await fetch(`${API_BASE_URL}/photo/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(request),
    });

    // Both 200 (success) and 422 (validation failure) return a structured ValidationResponse body
    if (response.ok || response.status === 422) {
        return response.json();
    }
    throw new Error(`Server error: ${response.status}`);
}

export async function removeBackground(orderId: string): Promise<RemoveBackgroundResponse> {
    const request: RemoveBackgroundRequest = { orderId };
    return fetchApi<RemoveBackgroundResponse>('/photo/remove-background', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}