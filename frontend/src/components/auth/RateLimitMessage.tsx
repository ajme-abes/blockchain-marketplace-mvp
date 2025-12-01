// frontend/src/components/auth/RateLimitMessage.tsx
// Component to display rate limit message with retry time

import { Clock } from 'lucide-react';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RateLimitMessageProps {
    retryAfter: number; // seconds
    action: 'login' | 'register' | 'reset-password' | 'default';
    onRetryAvailable?: () => void;
}

export function RateLimitMessage({
    retryAfter,
    action,
    onRetryAvailable
}: RateLimitMessageProps) {
    const actionText = {
        login: 'login attempts',
        register: 'registration attempts',
        'reset-password': 'password reset requests',
        default: 'requests'
    };

    const minutes = Math.ceil(retryAfter / 60);

    return (
        <Alert
            className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
        >
            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" aria-hidden="true" />
            <AlertTitle className="text-orange-900 dark:text-orange-100 font-bold">
                Too Many {actionText[action] || actionText.default}
            </AlertTitle>
            <AlertDescription className="space-y-4">
                <p className="text-orange-800 dark:text-orange-200">
                    For security reasons, please wait before trying again.
                </p>

                <div className="flex flex-col items-center space-y-2 p-4 bg-white dark:bg-gray-900 rounded-lg border border-orange-200 dark:border-orange-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Retry available in:
                    </span>
                    <CountdownTimer
                        seconds={retryAfter}
                        onComplete={onRetryAvailable}
                        className="text-orange-600 dark:text-orange-400"
                    />
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Please wait {minutes} {minutes === 1 ? 'minute' : 'minutes'} and try again
                </p>
            </AlertDescription>
        </Alert>
    );
}
