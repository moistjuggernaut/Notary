// client.ts
import { API_ENDPOINTS } from '../types/api';

// 1. Define a variable for the API base URL using Vite's import.meta.env
//    VITE_ prefix is crucial. The '??' operator provides a fallback for local development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- New photo API functions ---
export async function validatePhoto(file: File): Promise<boolean> {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.photo.validate}`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('Validation failed');
    const data = await res.json();
    return data.valid;
}

export async function preprocessPhoto(file: File): Promise<Blob> {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.photo.preprocess}`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('Preprocessing failed');
    return await res.blob();
};