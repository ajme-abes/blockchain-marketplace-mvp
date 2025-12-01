// frontend/src/pages/settings/SecuritySettings.tsx
// Security settings page for managing 2FA and sessions

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Smartphone, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

export function SecuritySettings() {
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [showSetup, setShowSetup] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        check2FAStatus();
    }, []);

    const check2FAStatus = async () => {
        try {
            const response = await authService.get2FAStatus();
            setTwoFactorEnabled(response.enabled);
        } catch (error: any) {
            console.error('Failed to check 2FA status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnable2FA = () => {
        setShowSetup(true);
    };

    const handleDisable2FA = async () => {
        const password = prompt('Enter your password to disable 2FA:');
        if (!password) return;

        try {
            await authService.disable2FA(password);
            setTwoFactorEnabled(false);
            toast.success('Two-factor authentication disabled');
        } catch (error: any) {
            toast.error(error.message || 'Failed to disable 2FA');
        }
    };

    const handleSetupComplete = () => {
        setShowSetup(false);
        setTwoFactorEnabled(true);
        toast.success('Two-factor authentication is now active!');
    };

    const handleSetupCancel = () => {
        setShowSetup(false);
    };

    if (showSetup) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-amber-50 to-green-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-green-900/20 p-4">
                <TwoFactorSetup
                    onComplete={handleSetupComplete}
                    onCancel={handleSetupCancel}
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Security Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Manage your account security and authentication methods
                    </p>
                </div>

                {/* Two-Factor Authentication */}
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
                    <CardHeader>
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
                                <CardDescription>
                                    Add an extra layer of security to your account
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                            </div>
                        ) : (
                            <>
                                {twoFactorEnabled ? (
                                    <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        <AlertTitle className="text-green-900 dark:text-green-100 font-semibold">
                                            2FA is Enabled
                                        </AlertTitle>
                                        <AlertDescription className="text-green-800 dark:text-green-200">
                                            Your account is protected with two-factor authentication
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        <AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold">
                                            2FA is Disabled
                                        </AlertTitle>
                                        <AlertDescription className="text-amber-800 dark:text-amber-200">
                                            Enable two-factor authentication for enhanced security
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-3">
                                    <div className="flex items-start space-x-3">
                                        <Smartphone className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                Authenticator App
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Use an authenticator app like Google Authenticator or Authy to generate verification codes
                                            </p>
                                        </div>
                                    </div>

                                    {twoFactorEnabled ? (
                                        <div className="flex space-x-3">
                                            <Button
                                                variant="outline"
                                                onClick={handleDisable2FA}
                                                className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                Disable 2FA
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    // TODO: Implement regenerate backup codes
                                                    toast.info('Regenerate backup codes feature coming soon');
                                                }}
                                            >
                                                Regenerate Backup Codes
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={handleEnable2FA}
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                                        >
                                            <Shield className="h-4 w-4 mr-2" />
                                            Enable Two-Factor Authentication
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Additional Security Features */}
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
                    <CardHeader>
                        <CardTitle className="text-xl">Additional Security</CardTitle>
                        <CardDescription>
                            More ways to protect your account
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                        Active Sessions
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Manage devices where you're logged in
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        // TODO: Navigate to sessions page
                                        toast.info('Session management feature coming soon');
                                    }}
                                >
                                    Manage
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                        Security Notifications
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Get alerts about account activity
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        // TODO: Navigate to notification settings
                                        toast.info('Notification settings feature coming soon');
                                    }}
                                >
                                    Configure
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
