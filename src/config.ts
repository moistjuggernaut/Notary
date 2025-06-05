export const config = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    environment: import.meta.env.MODE || 'development',
} as const; 