// frontend/src/components/auth/TwoFactorVerification.tsx
// Component for 2FA verification during login

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, AlertCircle, KeyRound } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TwoFactorVerificationProps {
    userId: string;
    onVerify: (token: string) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

export function TwoFactorVerification({
    userId,
    onVerify,
    onCancel,
    loading = false
}: TwoFactorVerificationProps) {
    const [token, setToken] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (token.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }

        setIsSubmitting(true);
        try {
            await onVerify(token);
        } catch (error: any) {
            setError(error.message || 'Invalid verification code');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTokenChange = (value: string) => {
        // Only allow numbers and limit to 6 digits
        const sanitized = value.replace(/\D/g, '').slice(0, 6);
        setToken(sanitized);
        if (error) setError(null);
    };

    return (
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl">
            <CardHeader className="text-center space-y-4 pb-4">
                <div className="flex justify-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg">
                        <Shield className="h-7 w-7 text-white" />
                    </div>
                </div>
                <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                        Two-Factor Authentication
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                        Enter the 6-digit code from your authenticator app
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {error && (
                    <Alert
                        className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                        role="alert"
                        aria-live="assertive"
                    >
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
                        <AlertDescription className="text-red-800 dark:text-red-200">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="token" className="text-sm font-medium flex items-center space-x-1">
                            <KeyRound className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            <span>Verification Code</span>
                        </Label>
                        <Input
                            id="token"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="000000"
                            value={token}
                            onChange={(e) => handleTokenChange(e.target.value)}
                            disabled={isSubmitting || loading}
                            className="h-12 text-center text-2xl font-mono tracking-widest border-2 focus:border-blue-400 dark:focus:border-blue-600 transition-colors rounded-xl bg-white dark:bg-gray-800"
                            maxLength={6}
                            autoComplete="one-time-code"
                            autoFocus
                            aria-label="Enter 6-digit verification code"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            Enter the code from your authenticator app
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Button
                            type="submit"
                            className="w-full h-10 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all duration-300"
                            disabled={token.length !== 6 || isSubmitting || loading}
                        >
                            {isSubmitting || loading ? (
                                <div className="flex items-center space-x-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Verifying...</span>
                                </div>
                            ) : (
                                'Verify Code'
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-10 text-sm font-medium rounded-xl border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={onCancel}
                            disabled={isSubmitting || loading}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        Don't have access to your authenticator app?{' '}
                        <button
                            type="button"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            onClick={() => {
                                // TODO: Implement backup code flow
                                setError('Backup code feature coming soon');
                            }}
                        >
                            Use backup code
                        </button>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
