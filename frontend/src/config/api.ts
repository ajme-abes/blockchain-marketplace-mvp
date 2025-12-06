// frontend/src/config/api.ts
// Centralized API configuration for all services

/**
 * Get the API base URL from environment variables
 * Falls back to localhost for development
 */
export const getApiUrl = (): string => {
    return import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}';
};

/**
 * Get the backend base URL (without /api suffix)
 * Used for direct fetch calls
 */
export const getBackendUrl = (): string => {
    const apiUrl = import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}';
    // Remove /api suffix if present
    return apiUrl.replace(/\/api$/, '');
};

/**
 * Get auth headers with token
 */
export const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

/**
 * Get auth headers without Content-Type (for FormData)
 */
export const getAuthHeadersWithoutContentType = (): HeadersInit => {
    const token = localStorage.getItem('authToken');
    return {
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

// Export constants
export const API_BASE_URL = getApiUrl();
export const BACKEND_URL = getBackendUrl();
