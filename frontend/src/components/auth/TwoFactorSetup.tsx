// frontend/src/components/auth/TwoFactorSetup.tsx
// Component for setting up 2FA with QR code

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, AlertCircle, CheckCircle, Copy, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

interface TwoFactorSetupProps {
    onComplete: () => void;
    onCancel: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
    const [step, setStep] = useState<'loading' | 'qr' | 'verify' | 'backup'>('loading');
    const [qrCode, setQrCode] = useState<string>('');
    const [secret, setSecret] = useState<string>('');
    const [token, setToken] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setupTwoFactor();
    }, []);

    const setupTwoFactor = async () => {
        try {
            const response = await authService.setup2FA();
            setQrCode(response.qrCode);
            setSecret(response.secret);
            setStep('qr');
        } catch (error: any) {
            setError(error.message || 'Failed to setup 2FA');
            toast.error('Failed to setup 2FA');
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (token.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await authService.enable2FA(secret, token);
            setBackupCodes(response.backupCodes);
            setStep('backup');
            toast.success('Two-factor authentication enabled successfully!');
        } catch (error: any) {
            setError(error.message || 'Invalid verification code');
            toast.error('Invalid verification code');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTokenChange = (value: string) => {
        const sanitized = value.replace(/\D/g, '').slice(0, 6);
        setToken(sanitized);
        if (error) setError(null);
    };

    const copySecret = () => {
        navigator.clipboard.writeText(secret);
        toast.success('Secret key copied to clipboard');
    };

    const downloadBackupCodes = () => {
        const content = `EthioTrust 2FA Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes safe! Each code can only be used once.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ethiotrust-backup-codes.txt';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Backup codes downloaded');
    };

    const copyBackupCodes = () => {
        navigator.clipboard.writeText(backupCodes.join('\n'));
        toast.success('Backup codes copied to clipboard');
    };

    if (step === 'loading') {
        return (
            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Setting up two-factor authentication...</p>
                </CardContent>
            </Card>
        );
    }

    if (step === 'qr') {
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
                            Setup Two-Factor Authentication
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                            Scan the QR code with your authenticator app
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && (
                        <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <AlertDescription className="text-red-800 dark:text-red-200">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4">
                        {/* QR Code */}
                        <div className="flex justify-center p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                            <img
                                src={qrCode}
                                alt="2FA QR Code"
                                className="w-48 h-48"
                                aria-label="Scan this QR code with your authenticator app"
                            />
                        </div>

                        {/* Manual Entry */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Or enter this code manually:
                            </Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    value={secret}
                                    readOnly
                                    className="font-mono text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                                    aria-label="Secret key for manual entry"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={copySecret}
                                    className="flex-shrink-0"
                                    aria-label="Copy secret key"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Instructions */}
                        <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <AlertTitle className="text-blue-900 dark:text-blue-100 font-semibold text-sm">
                                Recommended Apps
                            </AlertTitle>
                            <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs space-y-1">
                                <p>• Google Authenticator</p>
                                <p>• Microsoft Authenticator</p>
                                <p>• Authy</p>
                            </AlertDescription>
                        </Alert>
                    </div>

                    <div className="space-y-2">
                        <Button
                            onClick={() => setStep('verify')}
                            className="w-full h-10 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                        >
                            Continue to Verification
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-10 text-sm font-medium rounded-xl"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (step === 'verify') {
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
                            Verify Setup
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                            Enter the 6-digit code from your authenticator app
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && (
                        <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <AlertDescription className="text-red-800 dark:text-red-200">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="verify-token" className="text-sm font-medium">
                                Verification Code
                            </Label>
                            <Input
                                id="verify-token"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="000000"
                                value={token}
                                onChange={(e) => handleTokenChange(e.target.value)}
                                disabled={isSubmitting}
                                className="h-12 text-center text-2xl font-mono tracking-widest border-2 focus:border-blue-400 dark:focus:border-blue-600 rounded-xl"
                                maxLength={6}
                                autoComplete="one-time-code"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Button
                                type="submit"
                                className="w-full h-10 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                                disabled={token.length !== 6 || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center space-x-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Verifying...</span>
                                    </div>
                                ) : (
                                    'Enable 2FA'
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-10 text-sm font-medium rounded-xl"
                                onClick={() => setStep('qr')}
                                disabled={isSubmitting}
                            >
                                Back to QR Code
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        );
    }

    if (step === 'backup') {
        return (
            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl">
                <CardHeader className="text-center space-y-4 pb-4">
                    <div className="flex justify-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
                            <CheckCircle className="h-7 w-7 text-white" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                            Save Backup Codes
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                            Store these codes safely. Each can only be used once.
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold text-sm">
                            Important!
                        </AlertTitle>
                        <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
                            Save these backup codes in a secure location. You'll need them if you lose access to your authenticator app.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                            {backupCodes.map((code, index) => (
                                <div
                                    key={index}
                                    className="font-mono text-sm text-center py-2 px-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600"
                                >
                                    {code}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-10 text-sm font-medium rounded-xl"
                            onClick={downloadBackupCodes}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-10 text-sm font-medium rounded-xl"
                            onClick={copyBackupCodes}
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                        </Button>
                    </div>

                    <Button
                        onClick={onComplete}
                        className="w-full h-10 text-sm font-semibold rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
                    >
                        Complete Setup
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return null;
}
