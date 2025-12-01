// frontend/src/components/auth/TwoFactorManagement.tsx
// Component for managing two-factor authentication settings

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, ShieldCheck, ShieldX, Key, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { authService } from '@/services/authService';
import { TwoFactorSetup } from './TwoFactorSetup';
import { toast } from 'sonner';

interface TwoFactorManagementProps {
    className?: string;
}

export function TwoFactorManagement({ className = '' }: TwoFactorManagementProps) {
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showSetup, setShowSetup] = useState(false);
    const [showDisableDialog, setShowDisableDialog] = useState(false);
    const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
    const [disablePassword, setDisablePassword] = useState('');
    const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        checkTwoFactorStatus();
    }, []);

    const checkTwoFactorStatus = async () => {
        try {
            const status = await authService.get2FAStatus();
            setIs2FAEnabled(status.enabled);
        } catch (error: any) {
            console.error('Failed to check 2FA status:', error);
            toast.error('Failed to load 2FA status');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (!disablePassword) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await authService.disable2FA(disablePassword);
            setIs2FAEnabled(false);
            setShowDisableDialog(false);
            setDisablePassword('');
            toast.success('Two-factor authentication disabled');
        } catch (error: any) {
            setError(error.message || 'Failed to disable 2FA');
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateBackupCodes = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await authService.regenerateBackupCodes();
            setNewBackupCodes(result.backupCodes);
            setShowBackupCodesDialog(true);
            toast.success('New backup codes generated');
        } catch (error: any) {
            setError(error.message || 'Failed to regenerate backup codes');
            toast.error('Failed to regenerate backup codes');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyBackupCodes = () => {
        const codesText = newBackupCodes.join('\n');
        navigator.clipboard.writeText(codesText);
        toast.success('Backup codes copied to clipboard');
    };

    const handleSetupComplete = () => {
        setShowSetup(false);
        setIs2FAEnabled(true);
        checkTwoFactorStatus();
    };

    if (loading && !showSetup) {
        return (
            <div className={`space-y-4 ${className}`}>
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 animate-pulse" />
                    <span>Loading 2FA status...</span>
                </div>
            </div>
        );
    }

    if (showSetup) {
        return (
            <div className={className}>
                <TwoFactorSetup
                    onSetupComplete={handleSetupComplete}
                    onCancel={() => setShowSetup(false)}
                />
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* 2FA Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                    {is2FAEnabled ? (
                        <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                        <ShieldX className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                    <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {is2FAEnabled
                                ? 'Your account is protected with 2FA'
                                : 'Add an extra layer of security to your account'
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={is2FAEnabled ? 'default' : 'secondary'}>
                        {is2FAEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    {!is2FAEnabled && (
                        <Button onClick={() => setShowSetup(true)} size="sm">
                            Enable 2FA
                        </Button>
                    )}
                </div>
            </div>

            {/* 2FA Management Options */}
            {is2FAEnabled && (
                <div className="space-y-3">
                    <Alert>
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription>
                            Two-factor authentication is active on your account. You'll need your authenticator app to sign in.
                        </AlertDescription>
                    </Alert>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleRegenerateBackupCodes}
                            disabled={loading}
                            className="flex-1"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Generate New Backup Codes
                        </Button>

                        <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                            <DialogTrigger asChild>
                                <Button variant="destructive" className="flex-1">
                                    <ShieldX className="h-4 w-4 mr-2" />
                                    Disable 2FA
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        Disable Two-Factor Authentication
                                    </DialogTitle>
                                    <DialogDescription>
                                        This will remove the extra security layer from your account. You'll only need your password to sign in.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        <AlertDescription className="text-red-800 dark:text-red-200">
                                            <strong>Warning:</strong> Disabling 2FA will make your account less secure.
                                        </AlertDescription>
                                    </Alert>

                                    <div>
                                        <Label htmlFor="disable-password">Enter your password to confirm:</Label>
                                        <Input
                                            id="disable-password"
                                            type="password"
                                            value={disablePassword}
                                            onChange={(e) => setDisablePassword(e.target.value)}
                                            placeholder="Your current password"
                                        />
                                    </div>

                                    {error && (
                                        <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                            <AlertDescription className="text-red-800 dark:text-red-200">
                                                {error}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            variant="destructive"
                                            onClick={handleDisable2FA}
                                            disabled={loading || !disablePassword}
                                            className="flex-1"
                                        >
                                            {loading ? 'Disabling...' : 'Disable 2FA'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowDisableDialog(false);
                                                setDisablePassword('');
                                                setError('');
                                            }}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            )}

            {/* Backup Codes Dialog */}
            <Dialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            New Backup Codes
                        </DialogTitle>
                        <DialogDescription>
                            Save these new backup codes in a safe place. Your old backup codes are no longer valid.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Alert>
                            <Key className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Important:</strong> These codes can only be used once each. Store them securely.
                            </AlertDescription>
                        </Alert>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="grid grid-cols-1 gap-2 font-mono text-sm">
                                {newBackupCodes.map((code, index) => (
                                    <div key={index} className="text-center">
                                        <Badge variant="outline" className="font-mono">
                                            {code}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCopyBackupCodes} className="flex-1">
                                Copy Codes
                            </Button>
                            <Button
                                onClick={() => setShowBackupCodesDialog(false)}
                                className="flex-1"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}