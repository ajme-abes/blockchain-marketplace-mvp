// frontend/src/types/auth.ts
// Enhanced authentication types for error handling and validation

export interface AuthError {
    code: string;
    message: string;
    details?: any;
}

export interface RateLimitError extends AuthError {
    code: 'RATE_LIMIT_EXCEEDED';
    retryAfter: number; // seconds
    minutesRemaining?: number;
}

export interface WeakPasswordError extends AuthError {
    code: 'WEAK_PASSWORD';
    details: {
        score: number;
        strength: string;
        requirements: {
            minLength: boolean;
            hasUppercase: boolean;
            hasLowercase: boolean;
            hasNumber: boolean;
            hasSpecial: boolean;
        };
    };
}

export interface AccountLockedError extends AuthError {
    code: 'ACCOUNT_LOCKED';
    unlockAt: string; // ISO timestamp
    minutesRemaining: number;
    attempts: number;
    maxAttempts: number;
}

export interface InvalidCredentialsError extends AuthError {
    code: 'INVALID_CREDENTIALS';
    attemptsLeft?: number;
    maxAttempts?: number;
    accountLocked?: boolean;
}

export interface EmailNotVerifiedError extends AuthError {
    code: 'EMAIL_NOT_VERIFIED';
    email?: string;
    canResend?: boolean;
}

// Password validation types
export interface PasswordRequirements {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
}

export interface PasswordValidation {
    isValid: boolean;
    score: number; // 0-5
    strength: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
    requirements: PasswordRequirements;
    message?: string;
}

// API response types
export interface ApiErrorResponse {
    error?: string;
    message?: string;
    code?: string;
    details?: any;
    retryAfter?: number;
    attemptsLeft?: number;
    maxAttempts?: number;
    unlockAt?: string;
}
