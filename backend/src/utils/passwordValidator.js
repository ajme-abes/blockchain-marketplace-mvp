// backend/src/utils/passwordValidator.js

/**
 * Validates password strength based on multiple criteria
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with score and requirements
 */
function validatePasswordStrength(password) {
    if (!password || typeof password !== 'string') {
        return {
            isValid: false,
            score: 0,
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

    const requirements = {
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
        const missing = [];
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
        message: isValid ? 'Password is strong' : message,
        requirements,
        strength: getPasswordStrength(score)
    };
}

/**
 * Get password strength label
 * @param {number} score - Password score (0-5)
 * @returns {string} - Strength label
 */
function getPasswordStrength(score) {
    if (score >= 5) return 'Very Strong';
    if (score >= 4) return 'Strong';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Fair';
    if (score >= 1) return 'Weak';
    return 'Very Weak';
}

/**
 * Check if password contains common patterns
 * @param {string} password - The password to check
 * @returns {boolean} - True if password contains common patterns
 */
function hasCommonPatterns(password) {
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
 * Comprehensive password validation
 * @param {string} password - The password to validate
 * @returns {Object} - Complete validation result
 */
function validatePassword(password) {
    const strengthCheck = validatePasswordStrength(password);

    if (!strengthCheck.isValid) {
        return strengthCheck;
    }

    // Check for common patterns
    if (hasCommonPatterns(password)) {
        return {
            isValid: false,
            score: strengthCheck.score,
            message: 'Password contains common patterns. Please choose a more unique password.',
            requirements: strengthCheck.requirements,
            strength: strengthCheck.strength
        };
    }

    // Check for sequential characters
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
        return {
            isValid: false,
            score: strengthCheck.score,
            message: 'Password contains sequential characters. Please choose a more complex password.',
            requirements: strengthCheck.requirements,
            strength: strengthCheck.strength
        };
    }

    return strengthCheck;
}

module.exports = {
    validatePassword,
    validatePasswordStrength,
    getPasswordStrength,
    hasCommonPatterns
};
