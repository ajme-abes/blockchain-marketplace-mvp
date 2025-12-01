// frontend/src/hooks/usePasswordStrength.ts
// Custom hook for password strength validation with debouncing

import { useState, useEffect } from 'react';
import { validatePassword } from '@/utils/passwordValidator';
import { PasswordValidation } from '@/types/auth';

/**
 * Hook for real-time password strength validation with debouncing
 * @param password - The password to validate
 * @param debounceMs - Debounce delay in milliseconds (default: 300ms)
 * @returns Password validation result or null if password is empty
 */
export function usePasswordStrength(
    password: string,
    debounceMs: number = 300
): PasswordValidation | null {
    const [validation, setValidation] = useState<PasswordValidation | null>(null);

    useEffect(() => {
        if (!password) {
            setValidation(null);
            return;
        }

        // Debounce validation to avoid excessive computation
        const timer = setTimeout(() => {
            const result = validatePassword(password);
            setValidation(result);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [password, debounceMs]);

    return validation;
}
