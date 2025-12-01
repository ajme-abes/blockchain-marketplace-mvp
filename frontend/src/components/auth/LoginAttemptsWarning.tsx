// frontend/src/components/auth/LoginAttemptsWarning.tsx
// Component to display remaining login attempts warning

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginAttemptsWarningProps {
    attemptsLeft: number;
    maxAttempts: number;
}

export function LoginAttemptsWarning({
    attemptsLeft,
    maxAttempts
}: LoginAttemptsWarningProps) {
    const isUrgent = attemptsLeft <= 2;
    const isCritical = attemptsLeft === 1;

    return (
        <Alert
            className={`${isCritical
                ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                : isUrgent
                    ? 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                }`}
            role="alert"
            aria-live="polite"
            aria-atomic="true"
        >
            <AlertTriangle
                className={`h-4 w-4 ${isCritical
                    ? 'text-red-600 dark:text-red-400'
                    : isUrgent
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}
                aria-hidden="true"
            />
            <AlertDescription>
                <div className="flex flex-col space-y-1">
                    <span
                        className={`font-semibold ${isCritical
                            ? 'text-red-900 dark:text-red-100'
                            : isUrgent
                                ? 'text-orange-900 dark:text-orange-100'
                                : 'text-yellow-900 dark:text-yellow-100'
                            }`}
                    >
                        {attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining
                    </span>

                    {isUrgent && (
                        <span
                            className={`text-sm ${isCritical
                                ? 'text-red-700 dark:text-red-300'
                                : 'text-orange-700 dark:text-orange-300'
                                }`}
                        >
                            {isCritical
                                ? '⚠️ Last attempt! Your account will be locked after this.'
                                : `Your account will be locked after ${attemptsLeft} more failed ${attemptsLeft === 1 ? 'attempt' : 'attempts'}.`
                            }
                        </span>
                    )}
                </div>
            </AlertDescription>
        </Alert>
    );
}
