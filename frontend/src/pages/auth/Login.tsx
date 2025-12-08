// src/components/Login.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, Key, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { toast } from 'sonner';
import { useAuthErrors } from '@/hooks/useAuthErrors';
import { AccountLockoutMessage } from '@/components/auth/AccountLockoutMessage';
import { LoginAttemptsWarning } from '@/components/auth/LoginAttemptsWarning';
import { RateLimitMessage } from '@/components/auth/RateLimitMessage';
import { TwoFactorVerification } from '@/components/auth/TwoFactorVerification';
import { authService } from '@/services/authService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [authErrorData, setAuthErrorData] = useState<any>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const { user, login, loading, error, clearError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { handleAndShowError } = useAuthErrors();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setAuthErrorData(null);

    try {
      const response = await login(email, password);

      // Check if 2FA is required
      if (response?.requires2FA) {
        setRequires2FA(true);
        setUserId(response.userId || '');
        toast.info('Please enter your 2FA code');
        return;
      }

      toast.success(t('login.success'));

      // Redirect based on user role
      if (user?.role === 'ADMIN') {
        navigate('/admin'); // Admin dashboard route
      } else {
        navigate('/dashboard'); // Dashboard component handles buyer/producer routing
      }
    } catch (error: any) {
      // Handle specific authentication errors
      const errorResult = handleAndShowError(error);
      setAuthErrorData(errorResult);
    }
  };

  const handle2FAVerify = async (token: string) => {
    try {
      const response = await authService.verify2FA(userId, token);

      if (response.success) {
        toast.success('2FA verification successful!');

        // Complete login and redirect
        if (user?.role === 'ADMIN') {
          navigate('/admin'); // Admin dashboard route
        } else {
          navigate('/dashboard'); // Dashboard component handles buyer/producer routing
        }
      }
    } catch (error: any) {
      throw new Error(error.message || 'Invalid 2FA code');
    }
  };

  const handle2FACancel = () => {
    setRequires2FA(false);
    setUserId('');
    setEmail('');
    setPassword('');
    toast.info('Login cancelled');
  };

  const handleInputChange = () => {
    if (error) clearError();
    if (authErrorData) setAuthErrorData(null);
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  // Show 2FA verification if required
  if (requires2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-amber-50 to-green-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-green-900/20 p-4">
        <div className="absolute top-4 right-4 flex gap-2">
          <LanguageSelector />
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/50"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>

        <TwoFactorVerification
          userId={userId}
          onVerify={handle2FAVerify}
          onCancel={handle2FACancel}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-amber-50 to-green-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-green-900/20 p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <LanguageSelector />
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/50"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {t('login.welcomeBack')}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
              {t('login.signInToAccount')}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Account Lockout Message */}
          {authErrorData?.code === 'ACCOUNT_LOCKED' && (
            <AccountLockoutMessage
              unlockAt={authErrorData.data?.unlockAt}
              minutesRemaining={authErrorData.data?.minutesRemaining || 30}
              onUnlock={() => {
                setAuthErrorData(null);
                toast.info('Account unlocked. You can try logging in again.');
              }}
            />
          )}

          {/* Rate Limit Message */}
          {authErrorData?.code === 'RATE_LIMIT_EXCEEDED' && (
            <RateLimitMessage
              retryAfter={authErrorData.data?.retryAfter || 300}
              action="login"
              onRetryAvailable={() => {
                setAuthErrorData(null);
                toast.info('You can try logging in again.');
              }}
            />
          )}

          {/* Login Attempts Warning */}
          {authErrorData?.code === 'INVALID_CREDENTIALS' && authErrorData.data?.attemptsLeft && (
            <LoginAttemptsWarning
              attemptsLeft={authErrorData.data.attemptsLeft}
              maxAttempts={authErrorData.data.maxAttempts || 5}
            />
          )}

          {/* Generic Error Display */}
          {error && !authErrorData && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center space-x-2 animate-pulse">
              <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full"></div>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email Field */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-medium flex items-center space-x-1">
                <Mail className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                <span>{t('login.emailLabel')}</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  handleInputChange();
                }}
                required
                disabled={loading}
                className="h-9 text-sm border border-gray-300 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-600 transition-colors rounded-xl px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-medium flex items-center space-x-1">
                <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                <span>{t('login.passwordLabel')}</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    handleInputChange();
                  }}
                  required
                  disabled={loading}
                  className="h-9 text-sm border border-gray-300 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-600 transition-colors rounded-xl px-3 pr-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3 h-3 text-amber-600 dark:text-amber-400 border-gray-300 dark:border-gray-700 rounded focus:ring-amber-500 dark:focus:ring-amber-600 bg-white dark:bg-gray-800"
                />
                <span className="text-gray-600 dark:text-gray-400">{t('login.rememberMe')}</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center space-x-1 transition-colors group"
              >
                <Key className="h-3 w-3 transition-transform group-hover:scale-110" />
                <span className="group-hover:underline">{t('login.forgotPassword')}</span>
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-10 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-amber-200 dark:hover:shadow-amber-800 transition-all duration-300 mt-2"
              disabled={
                loading ||
                authErrorData?.code === 'ACCOUNT_LOCKED' ||
                authErrorData?.code === 'RATE_LIMIT_EXCEEDED'
              }
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('login.signingIn')}</span>
                </div>
              ) : (
                t('login.signIn')
              )}
            </Button>
          </form>

          {/* Additional Links */}
          <div className="space-y-2 pt-2">
            <div className="text-center text-xs">
              <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
              <Link
                to="/register"
                className="text-amber-600 dark:text-amber-400 font-semibold hover:text-amber-700 dark:hover:text-amber-300 transition-colors hover:underline"
              >
                Join now
              </Link>
            </div>

            <div className="text-center">
              <Link
                to="/"
                className="inline-flex items-center text-xs text-gray-500 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;