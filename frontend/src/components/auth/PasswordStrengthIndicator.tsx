// frontend/src/components/auth/PasswordStrengthIndicator.tsx
// Enhanced password strength indicator matching backend validation

import { CheckCircle, XCircle } from 'lucide-react';
import { PasswordValidation } from '@/types/auth';
import { getStrengthColor, getStrengthTextColor } from '@/utils/passwordValidator';

interface PasswordStrengthIndicatorProps {
    validation: PasswordValidation | null;
    showRequirements?: boolean;
}

export function PasswordStrengthIndicator({
    validation,
    showRequirements = true
}: PasswordStrengthIndicatorProps) {
    if (!validation) {
        return null;
    }

    const { score, strength, requirements, message } = validation;
    const strengthColor = getStrengthColor(score);
    const textColor = getStrengthTextColor(score);

    return (
        <div className="space-y-2 p-3 bg-gradient-to-r from-gray-50 to-amber-50 dark:from-gray-800/50 dark:to-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Password Strength
                </span>
                <span className={`text-xs font-bold ${textColor}`}>
                    {strength}
                </span>
            </div>

            {/* Strength Bar */}
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((index) => (
                    <div
                        key={index}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${index <= score
                                ? strengthColor
                                : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                    />
                ))}
            </div>

            {/* Requirements Checklist */}
            {showRequirements && (
                <div className="grid grid-cols-2 gap-1 text-xs pt-1">
                    <RequirementItem
                        met={requirements.minLength}
                        text="8+ characters"
                    />
                    <RequirementItem
                        met={requirements.hasUppercase}
                        text="Uppercase (A-Z)"
                    />
                    <RequirementItem
                        met={requirements.hasLowercase}
                        text="Lowercase (a-z)"
                    />
                    <RequirementItem
                        met={requirements.hasNumber}
                        text="Number (0-9)"
                    />
                    <RequirementItem
                        met={requirements.hasSpecial}
                        text="Special (!@#$)"
                        className="col-span-2"
                    />
                </div>
            )}

            {/* Validation Message */}
            {message && !validation.isValid && (
                <div className="text-xs text-red-600 dark:text-red-400 pt-1 border-t border-amber-200 dark:border-amber-800/30">
                    {message}
                </div>
            )}

            {/* Success Message */}
            {validation.isValid && score >= 3 && (
                <div className="text-xs text-green-600 dark:text-green-400 pt-1 border-t border-amber-200 dark:border-amber-800/30 flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Password meets security requirements</span>
                </div>
            )}
        </div>
    );
}

interface RequirementItemProps {
    met: boolean;
    text: string;
    className?: string;
}

function RequirementItem({ met, text, className = '' }: RequirementItemProps) {
    return (
        <div className={`flex items-center space-x-1 ${className}`}>
            {met ? (
                <CheckCircle className="h-3 w-3 text-green-500 dark:text-green-400 flex-shrink-0" />
            ) : (
                <XCircle className="h-3 w-3 text-gray-400 dark:text-gray-600 flex-shrink-0" />
            )}
            <span className={
                met
                    ? 'text-green-600 dark:text-green-400 font-medium'
                    : 'text-gray-500 dark:text-gray-400'
            }>
                {text}
            </span>
        </div>
    );
}
