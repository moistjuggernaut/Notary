export const debug = {
    getApiBaseUrl: () => {
        return window.__ENV__?.VITE_API_BASE_URL || 'http://localhost:8000';
    },
    getEnvironment: () => {
        return window.__ENV__?.MODE || 'development';
    },
    showAll: () => {
        console.log('API Base URL:', debug.getApiBaseUrl());
        console.log('Environment:', debug.getEnvironment());
    }
};

// Make it available globally for debugging
declare global {
    interface Window {
        __ENV__: {
            VITE_API_BASE_URL: string;
            MODE: string;
        };
    }
}

// Store environment variables in window for debugging
window.__ENV__ = {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    MODE: import.meta.env.MODE
}; 