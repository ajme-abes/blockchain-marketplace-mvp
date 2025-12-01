// frontend/src/utils/passwordValidator.ts
// Password validation utility matching backend logic exactly

import { PasswordValidation, PasswordRequirements } from '@/types/auth';

/**
 * Get password strength label based on score
 */
function getPasswordStrength(score: number): PasswordValidation['strength'] {
    if (score >= 5) return 'Very Strong';
    if (score >= 4) return 'Strong';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Fair';
    if (score >= 1) return 'Weak';
    return 'Very Weak';
}

/**
 * Check if password contains common patterns
 */
function hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
        /^123456/,
        /^password/i,
        /^qwerty/i,
        /^abc123/i,
        /^111111/,
        /^admin/i,
        /^letmein/i,
        /^welcome/i,
        /^monkey/i,
        /^dragon/i
    ];

    return commonPatterns.some(pattern => pattern.test(password));
}

/**
 * Check if password contains sequential characters
 */
function hasSequentialCharacters(password: string): boolean {
    return /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password);
}

/**
 * Validate password strength (matches backend logic exactly)
 */
export function validatePasswordStrength(password: string): PasswordValidation {
    if (!password || typeof password !== 'string') {
        return {
            isValid: false,
            score: 0,
            strength: 'Very Weak',
            message: 'Password is required',
            requirements: {
                minLength: false,
                hasUppercase: false,
                hasLowercase: false,
                hasNumber: false,
                hasSpecial: false
            }
        };
    }

    const requirements: PasswordRequirements = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[^A-Za-z0-9]/.test(password)
    };

    // Calculate score (0-5)
    const score = Object.values(requirements).filter(Boolean).length;

    // Password must meet at least 3 criteria including minimum length
    const isValid = requirements.minLength && score >= 3;

    let message = '';
    if (!isValid) {
        const missing: string[] = [];
        if (!requirements.minLength) missing.push('at least 8 characters');
        if (!requirements.hasUppercase) missing.push('uppercase letter');
        if (!requirements.hasLowercase) missing.push('lowercase letter');
        if (!requirements.hasNumber) missing.push('number');
        if (!requirements.hasSpecial) missing.push('special character');

        message = `Password must contain ${missing.slice(0, 3).join(', ')}`;
    }

    return {
        isValid,
        score,
        strength: getPasswordStrength(score),
        message: isValid ? 'Password is strong' : message,
        requirements
    };
}

/**
 * Comprehensive password validation (includes pattern checks)
 */
export function validatePassword(password: string): PasswordValidation {
    const strengthCheck = validatePasswordStrength(password);

    if (!strengthCheck.isValid) {
        return strengthCheck;
    }

    // Check for common patterns
    if (hasCommonPatterns(password)) {
        return {
            ...strengthCheck,
            isValid: false,
            message: 'Password contains common patterns. Please choose a more unique password.'
        };
    }

    // Check for sequential characters
    if (hasSequentialCharacters(password)) {
        return {
            ...strengthCheck,
            isValid: false,
            message: 'Password contains sequential characters. Please choose a more complex password.'
        };
    }

    return strengthCheck;
}

/**
 * Get color class for password strength indicator
 */
export function getStrengthColor(score: number): string {
    if (score >= 5) return 'bg-green-500';
    if (score >= 4) return 'bg-green-500';
    if (score >= 3) return 'bg-amber-500';
    if (score >= 2) return 'bg-yellow-500';
    if (score >= 1) return 'bg-orange-500';
    return 'bg-red-500';
}

/**
 * Get text color class for password strength
 */
export function getStrengthTextColor(score: number): string {
    if (score >= 5) return 'text-green-600 dark:text-green-400';
    if (score >= 4) return 'text-green-600 dark:text-green-400';
    if (score >= 3) return 'text-amber-600 dark:text-amber-400';
    if (score >= 2) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 1) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
}
