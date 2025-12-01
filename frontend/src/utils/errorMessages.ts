// frontend/src/utils/errorMessages.ts
// User-friendly error messages for authentication errors

export const ERROR_MESSAGES = {
    RATE_LIMIT_EXCEEDED: {
        login: (minutes: number) =>
            `Too many login attempts. Please wait ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} and try again.`,
        register: (minutes: number) =>
            `Too many registration attempts. Please wait ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`,
        'reset-password': (minutes: number) =>
            `Too many password reset requests. Please wait ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`,
        default: (minutes: number) =>
            `Too many requests. Please wait ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`
    },

    WEAK_PASSWORD: 'Your password doesn\'t meet the security requirements.',

    ACCOUNT_LOCKED: (minutes: number) =>
        `Your account is temporarily locked due to multiple failed login attempts. Please try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`,

    INVALID_CREDENTIALS: (attemptsLeft?: number) => {
        if (attemptsLeft !== undefined && attemptsLeft > 0) {
            return `Invalid email or password. ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining.`;
        }
        return 'Invalid email or password.';
    },

    EMAIL_NOT_VERIFIED: 'Please verify your email before logging in.',

    GENERIC: 'Something went wrong. Please try again or contact support.'
};

export const ERROR_RECOVERY_SUGGESTIONS = {
    RATE_LIMIT_EXCEEDED: (minutes: number) =>
        `Please wait ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} and try again.`,

    WEAK_PASSWORD: 'Try using a mix of uppercase, lowercase, numbers, and special characters.',

    ACCOUNT_LOCKED: 'Contact support if you need immediate access.',

    INVALID_CREDENTIALS: 'Double-check your email and password, or use "Forgot Password" to reset.',

    EMAIL_NOT_VERIFIED: 'Check your email for the verification link, or request a new one.',

    GENERIC: 'Please try again later or contact support if the problem persists.'
};

/**
 * Format error message based on error code and data
 */
export function formatErrorMessage(
    code: string,
    data?: any
): { message: string; suggestion: string } {
    switch (code) {
        case 'RATE_LIMIT_EXCEEDED': {
            const minutes = data?.minutesRemaining || Math.ceil((data?.retryAfter || 0) / 60);
            const action = data?.action || 'default';
            const messageFunc = ERROR_MESSAGES.RATE_LIMIT_EXCEEDED[action as keyof typeof ERROR_MESSAGES.RATE_LIMIT_EXCEEDED]
                || ERROR_MESSAGES.RATE_LIMIT_EXCEEDED.default;
            return {
                message: messageFunc(minutes),
                suggestion: ERROR_RECOVERY_SUGGESTIONS.RATE_LIMIT_EXCEEDED(minutes)
            };
        }

        case 'WEAK_PASSWORD':
            return {
                message: data?.message || ERROR_MESSAGES.WEAK_PASSWORD,
                suggestion: ERROR_RECOVERY_SUGGESTIONS.WEAK_PASSWORD
            };

        case 'ACCOUNT_LOCKED': {
            const minutes = data?.minutesRemaining || 30;
            return {
                message: ERROR_MESSAGES.ACCOUNT_LOCKED(minutes),
                suggestion: ERROR_RECOVERY_SUGGESTIONS.ACCOUNT_LOCKED
            };
        }

        case 'INVALID_CREDENTIALS':
            return {
                message: ERROR_MESSAGES.INVALID_CREDENTIALS(data?.attemptsLeft),
                suggestion: ERROR_RECOVERY_SUGGESTIONS.INVALID_CREDENTIALS
            };

        case 'EMAIL_NOT_VERIFIED':
            return {
                message: ERROR_MESSAGES.EMAIL_NOT_VERIFIED,
                suggestion: ERROR_RECOVERY_SUGGESTIONS.EMAIL_NOT_VERIFIED
            };

        default:
            return {
                message: data?.message || data?.error || ERROR_MESSAGES.GENERIC,
                suggestion: ERROR_RECOVERY_SUGGESTIONS.GENERIC
            };
    }
}

/**
 * Calculate minutes remaining from seconds
 */
export function calculateMinutesRemaining(seconds: number): number {
    return Math.ceil(seconds / 60);
}

/**
 * Format time remaining in human-readable format
 */
export function formatTimeRemaining(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0 && remainingSeconds > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    } else {
        return `${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`;
    }
}
