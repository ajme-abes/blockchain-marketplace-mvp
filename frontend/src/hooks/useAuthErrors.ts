// frontend/src/hooks/useAuthErrors.ts
// Centralized authentication error handling hook

import { useCallback } from 'react';
import { toast } from 'sonner';
import { formatErrorMessage, calculateMinutesRemaining } from '@/utils/errorMessages';
import {
    AuthError,
    RateLimitError,
    WeakPasswordError,
    AccountLockedError,
    InvalidCredentialsError,
    EmailNotVerifiedError,
    ApiErrorResponse
} from '@/types/auth';

interface ErrorHandlerResult {
    message: string;
    suggestion: string;
    code: string;
    data?: any;
}

/**
 * Custom hook for handling authentication errors
 */
export function useAuthErrors() {
    /**
     * Map API error response to typed error object
     */
    const mapAuthError = useCallback((apiError: ApiErrorResponse): AuthError => {
        return {
            code: apiError.code || 'UNKNOWN_ERROR',
            message: apiError.error || apiError.message || 'An error occurred',
            details: apiError.details || apiError
        };
    }, []);

    /**
     * Handle rate limit errors
     */
    const handleRateLimitError = useCallback((error: any): ErrorHandlerResult => {
        const retryAfter = error.retryAfter || error.details?.retryAfter || 0;
        const minutesRemaining = calculateMinutesRemaining(retryAfter);
        const action = error.details?.action || 'default';

        const { message, suggestion } = formatErrorMessage('RATE_LIMIT_EXCEEDED', {
            retryAfter,
            minutesRemaining,
            action
        });

        return {
            message,
            suggestion,
            code: 'RATE_LIMIT_EXCEEDED',
            data: { retryAfter, minutesRemaining, action }
        };
    }, []);

    /**
     * Handle weak password errors
     */
    const handleWeakPasswordError = useCallback((error: any): ErrorHandlerResult => {
        const details = error.details || {};
        const { message, suggestion } = formatErrorMessage('WEAK_PASSWORD', details);

        return {
            message,
            suggestion,
            code: 'WEAK_PASSWORD',
            data: details
        };
    }, []);

    /**
     * Handle account locked errors
     */
    const handleAccountLockedError = useCallback((error: any): ErrorHandlerResult => {
        const unlockAt = error.unlockAt || error.details?.unlockAt;
        const minutesRemaining = error.minutesRemaining || error.details?.minutesRemaining || 30;

        const { message, suggestion } = formatErrorMessage('ACCOUNT_LOCKED', {
            unlockAt,
            minutesRemaining
        });

        return {
            message,
            suggestion,
            code: 'ACCOUNT_LOCKED',
            data: { unlockAt, minutesRemaining }
        };
    }, []);

    /**
     * Handle invalid credentials errors
     */
    const handleInvalidCredentialsError = useCallback((error: any): ErrorHandlerResult => {
        const attemptsLeft = error.attemptsLeft || error.details?.attemptsLeft;
        const maxAttempts = error.maxAttempts || error.details?.maxAttempts;

        const { message, suggestion } = formatErrorMessage('INVALID_CREDENTIALS', {
            attemptsLeft,
            maxAttempts
        });

        return {
            message,
            suggestion,
            code: 'INVALID_CREDENTIALS',
            data: { attemptsLeft, maxAttempts }
        };
    }, []);

    /**
     * Handle email not verified errors
     */
    const handleEmailNotVerifiedError = useCallback((error: any): ErrorHandlerResult => {
        const { message, suggestion } = formatErrorMessage('EMAIL_NOT_VERIFIED', error.details);

        return {
            message,
            suggestion,
            code: 'EMAIL_NOT_VERIFIED',
            data: error.details
        };
    }, []);

    /**
     * Handle generic errors
     */
    const handleGenericError = useCallback((error: any): ErrorHandlerResult => {
        const { message, suggestion } = formatErrorMessage('GENERIC', {
            message: error.message || error.error
        });

        return {
            message,
            suggestion,
            code: error.code || 'UNKNOWN_ERROR',
            data: error.details
        };
    }, []);

    /**
     * Main error handler - routes to specific handlers based on error code
     */
    const handleAuthError = useCallback((error: any): ErrorHandlerResult => {
        const mappedError = mapAuthError(error);

        switch (mappedError.code) {
            case 'RATE_LIMIT_EXCEEDED':
                return handleRateLimitError(mappedError);

            case 'WEAK_PASSWORD':
                return handleWeakPasswordError(mappedError);

            case 'ACCOUNT_LOCKED':
                return handleAccountLockedError(mappedError);

            case 'INVALID_CREDENTIALS':
                return handleInvalidCredentialsError(mappedError);

            case 'EMAIL_NOT_VERIFIED':
                return handleEmailNotVerifiedError(mappedError);

            default:
                return handleGenericError(mappedError);
        }
    }, [
        mapAuthError,
        handleRateLimitError,
        handleWeakPasswordError,
        handleAccountLockedError,
        handleInvalidCredentialsError,
        handleEmailNotVerifiedError,
        handleGenericError
    ]);

    /**
     * Show error toast with appropriate styling
     */
    const showErrorToast = useCallback((result: ErrorHandlerResult) => {
        const duration = result.code === 'ACCOUNT_LOCKED' || result.code === 'RATE_LIMIT_EXCEEDED'
            ? 10000 // 10 seconds for critical errors
            : 5000; // 5 seconds for other errors

        toast.error(result.message, {
            description: result.suggestion,
            duration
        });
    }, []);

    /**
     * Handle and display authentication error
     */
    const handleAndShowError = useCallback((error: any) => {
        const result = handleAuthError(error);
        showErrorToast(result);
        return result;
    }, [handleAuthError, showErrorToast]);

    return {
        handleAuthError,
        showErrorToast,
        handleAndShowError,
        mapAuthError
    };
}
