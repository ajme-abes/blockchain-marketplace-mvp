// src/pages/auth/ResetPassword.tsx - UPDATED WITH ENHANCED VALIDATION
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, CheckCircle, Loader2, Eye, EyeOff, Shield, AlertCircle, KeyRound } from 'lucide-react';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { usePasswordStrength } from '@/hooks/usePasswordStrength';
import { useAuthErrors } from '@/hooks/useAuthErrors';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { RateLimitMessage } from '@/components/auth/RateLimitMessage';
import { toast } from 'sonner';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string>('');
  const [formData, setFormData] = useState<ResetPasswordForm>({
    password: '',
    confirmPassword: ''
  });
  const [authErrorData, setAuthErrorData] = useState<any>(null);

  const passwordValidation = usePasswordStrength(formData.password);
  const { handleAndShowError } = useAuthErrors();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setTokenError('Invalid or missing reset token');
      toast.error('Invalid reset link. Please use the link from your email.');
      navigate('/forgot-password');
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams, navigate]);

  const handleInputChange = (field: keyof ResetPasswordForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (authErrorData) setAuthErrorData(null);
  };

  const getPasswordMatchStatus = () => {
    if (!formData.confirmPassword) return 'neutral';
    return formData.password === formData.confirmPassword ? 'match' : 'mismatch';
  };

  const passwordMatchStatus = getPasswordMatchStatus();
  const canSubmit = passwordValidation?.isValid && passwordMatchStatus === 'match' && !isSubmitting;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !canSubmit) return;

    setIsSubmitting(true);
    setAuthErrorData(null);

    try {
      const result = await authService.resetPassword(token, formData.password);
      setIsSuccess(true);
      toast.success('Password reset successfully! You can now login with your new password.');

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Password reset failed:', error);
      const errorResult = handleAndShowError(error);
      setAuthErrorData(errorResult);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50 to-green-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-green-900/20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 shadow-2xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl">
          <CardContent className="pt-6 pb-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Invalid Reset Link</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{tokenError}</p>
            <Button
              onClick={() => navigate('/forgot-password')}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50 to-green-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-green-900/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 dark:text-amber-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Validating reset token...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50 to-green-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-green-900/20">
        <Navbar />
        <main className="container mx-auto px-4 py-16 flex items-center justify-center">
          <motion.div
            className="w-full max-w-md"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <Card className="shadow-2xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl text-center">
              <CardContent className="pt-8 pb-8">
                <div className="relative inline-block mb-4">
                  <CheckCircle className="h-20 w-20 text-green-600 dark:text-green-400" />
                  <div className="absolute inset-0 bg-green-600/20 dark:bg-green-400/20 rounded-full animate-ping"></div>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-green-600 dark:text-green-400">
                  Password Reset Successfully!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Your password has been updated securely. Redirecting to login page...
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                  >
                    Go to Login
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatic redirect in 3 seconds...
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50 to-green-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-green-900/20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[80vh]">
        <motion.div
          className="w-full max-w-md"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <Card className="shadow-2xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center gap-3 justify-center">
                <KeyRound className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Reset Password
                </CardTitle>
              </div>
              <CardDescription className="text-center text-base text-gray-600 dark:text-gray-400">
                Create a new strong password for your account
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Rate Limit Message */}
              {authErrorData?.code === 'RATE_LIMIT_EXCEEDED' && (
                <RateLimitMessage
                  retryAfter={authErrorData.data?.retryAfter || 300}
                  action="reset-password"
                  onRetryAvailable={() => {
                    setAuthErrorData(null);
                    toast.info('You can try resetting your password again.');
                  }}
                />
              )}

              {/* Generic Error Display */}
              {authErrorData && authErrorData.code !== 'RATE_LIMIT_EXCEEDED' && (
                <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {authErrorData.message}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    New Password
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      disabled={isSubmitting || authErrorData?.code === 'RATE_LIMIT_EXCEEDED'}
                      className="pl-10 pr-10 h-12 border-2 focus:border-amber-400 dark:focus:border-amber-600 transition-colors rounded-xl bg-white dark:bg-gray-800"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Enhanced Password Strength Indicator */}
                {formData.password && (
                  <PasswordStrengthIndicator validation={passwordValidation} />
                )}

                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      disabled={isSubmitting || authErrorData?.code === 'RATE_LIMIT_EXCEEDED'}
                      className="pl-10 pr-10 h-12 border-2 focus:border-amber-400 dark:focus:border-amber-600 transition-colors rounded-xl bg-white dark:bg-gray-800"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div className={`flex items-center justify-center space-x-2 p-2 rounded-lg text-xs ${passwordMatchStatus === 'match'
                      ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}>
                    {passwordMatchStatus === 'match' ? (
                      <CheckCircle className="h-3 w-3 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    )}
                    <span>
                      {passwordMatchStatus === 'match'
                        ? 'Passwords match!'
                        : 'Passwords do not match'
                      }
                    </span>
                  </div>
                )}

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                    disabled={!canSubmit || authErrorData?.code === 'RATE_LIMIT_EXCEEDED'}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </motion.div>

                <div className="text-center pt-2">
                  <Button
                    variant="link"
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
                    onClick={() => navigate('/login')}
                  >
                    ← Back to Login
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;