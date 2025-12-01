// frontend/src/components/ui/CountdownTimer.tsx
// Reusable countdown timer component

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
    seconds: number;
    onComplete?: () => void;
    showIcon?: boolean;
    className?: string;
}

export function CountdownTimer({
    seconds,
    onComplete,
    showIcon = true,
    className = ''
}: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState(seconds);

    useEffect(() => {
        setTimeLeft(seconds);
    }, [seconds]);

    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete?.();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                const newTime = Math.max(0, prev - 1);
                if (newTime === 0) {
                    onComplete?.();
                }
                return newTime;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, onComplete]);

    const formatTime = (totalSeconds: number): string => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        if (minutes > 0) {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${seconds}s`;
    };

    return (
        <div
            className={`flex items-center justify-center space-x-2 ${className}`}
            role="timer"
            aria-live="polite"
            aria-atomic="true"
            aria-label={`Time remaining: ${formatTime(timeLeft)}`}
        >
            {showIcon && <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />}
            <span className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100">
                {formatTime(timeLeft)}
            </span>
        </div>
    );
}
