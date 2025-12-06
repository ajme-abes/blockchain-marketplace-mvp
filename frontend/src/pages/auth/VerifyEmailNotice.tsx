// COMPLETE VerifyEmailNotice.tsx - REPLACE entire file:
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle, ArrowLeft, RefreshCw, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { authService } from '@/services/authService';

const VerifyEmailNotice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  // Simple client-side email validation
  const isValidEmail = (e: string) => {
    if (!e) return false;
    const trimmed = e.trim();
    if (trimmed === 'your email') return false;
    // Basic RFC-like pattern (not exhaustive)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  };
  const validEmail = isValidEmail(email);

  // Get state from location
  const fromLogin = location.state?.fromLogin;
  const canResend = location.state?.canResend ?? true;
  const loginUser = location.state?.user;
  const emailFailed = location.state?.emailFailed;
  const verificationUrl = location.state?.verificationUrl;

  useEffect(() => {
    // Get email from various sources
    const locationEmail = location.state?.email;
    const authEmail = user?.email;
    const loginEmail = loginUser?.email;

    setEmail(locationEmail || loginEmail || authEmail || 'your email');
  }, [location.state, user, loginUser]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendVerification = async () => {
    if (cooldown > 0 || !canResend) return;
    if (!validEmail) {
      toast.error('Unable to resend: invalid or missing email address.');
      return;
    }

    try {
      setIsResending(true);

      // Pass the email to the resend endpoint (no authentication required)
      await authService.resendVerificationEmail(email);

      setResendCount(prev => prev + 1);
      setCooldown(60); // 60 second cooldown
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const getMainMessage = () => {
    if (fromLogin) {
      return 'Email verification required to login';
    }
    return 'Almost there! Check your inbox to complete registration';
  };

  const getDescription = () => {
    if (fromLogin) {
      return 'Please verify your email address to access your account';
    }
    return 'Check your inbox to complete registration';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-amber-50 to-green-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-green-900/20 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="flex justify-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg ${fromLogin ? 'bg-amber-500' : 'bg-gradient-to-br from-amber-400 to-orange-500'
              }`}>
              <Mail className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {fromLogin ? 'Verification Required' : 'Verify Your Email'}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
              {getDescription()}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Warning for login block */}
          {fromLogin && (
            <div className="flex items-start space-x-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
              <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Login Restricted
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  You must verify your email before you can access your account
                </p>
              </div>
            </div>
          )}

          {/* Email Service Failure Warning */}
          {emailFailed && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  Email Service Not Available
                </p>
                <p className="text-xs text-red-700 dark:text-red-400">
                  The email service is not configured. You can verify manually using the link below.
                </p>
                {verificationUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-red-700 dark:text-red-400 mb-1">Manual verification link:</p>
                    <a
                      href={verificationUrl}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {verificationUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {!emailFailed ? (
              <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Verification Email Sent
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    We've sent a verification link to <strong>{email}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl">
                <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                    Email Verification Required
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-400">
                    Please use the manual verification link above or contact support.
                  </p>
                </div>
              </div>
            )}

            {/* Steps */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">1</span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Check your email inbox
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">2</span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Click the verification link
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">3</span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {fromLogin ? 'Return to login' : 'Start using EthioTrust!'}
                </span>
              </div>
            </div>

            {/* Tips */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> Can't find the email? Check your spam folder or try resending.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleResendVerification}
              disabled={isResending || cooldown > 0 || !canResend || !validEmail || emailFailed}
              className="w-full h-10 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {emailFailed ? (
                'Email service not available'
              ) : !canResend ? (
                'Verification email sent recently'
              ) : isResending ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Sending...</span>
                </div>
              ) : cooldown > 0 ? (
                `Resend available in ${cooldown}s`
              ) : (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-3 w-3" />
                  <span>Resend Verification Email</span>
                </div>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(fromLogin ? '/login' : '/register')}
                className="h-9 text-sm rounded-xl border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                {fromLogin ? 'Back to Login' : 'Back to Register'}
              </Button>

              <Button
                variant="outline"
                onClick={handleGoHome}
                className="h-9 text-sm rounded-xl border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Home className="h-3 w-3 mr-1" />
                Go Home
              </Button>
            </div>
          </div>

          {/* Success Message after resend */}
          {resendCount > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-xs text-green-700 dark:text-green-300">
                Verification email sent {resendCount} time{resendCount > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Support Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Need help?{' '}
              <Link
                to="/contact"
                className="text-amber-600 dark:text-amber-400 font-semibold hover:text-amber-700 dark:hover:text-amber-300 transition-colors hover:underline"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailNotice;