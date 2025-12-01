// frontend/src/components/auth/AccountLockoutMessage.tsx
// Component to display account lockout message with countdown

import { AlertCircle } from 'lucide-react';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AccountLockoutMessageProps {
    unlockAt: string;
    minutesRemaining: number;
    onUnlock?: () => void;
}

export function AccountLockoutMessage({
    unlockAt,
    minutesRemaining,
    onUnlock
}: AccountLockoutMessageProps) {
    const totalSeconds = minutesRemaining * 60;

    return (
        <Alert
            className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
        >
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
            <AlertTitle className="text-red-900 dark:text-red-100 font-bold">
                Account Temporarily Locked
            </AlertTitle>
            <AlertDescription className="space-y-4">
                <p className="text-red-800 dark:text-red-200">
                    Too many failed login attempts. Your account has been temporarily locked for security.
                </p>

                <div
                    className="flex flex-col items-center space-y-2 p-4 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800"
                    aria-label="Account unlock countdown"
                >
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Time remaining:
                    </span>
                    <CountdownTimer
                        seconds={totalSeconds}
                        onComplete={onUnlock}
                        className="text-red-600 dark:text-red-400"
                    />
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Contact support if you need immediate access
                </p>
            </AlertDescription>
        </Alert>
    );
}
