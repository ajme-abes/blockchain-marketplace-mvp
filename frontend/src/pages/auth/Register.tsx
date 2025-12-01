// src/components/Register.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Lock, Sparkles, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { usePasswordStrength } from '@/hooks/usePasswordStrength';
import { useAuthErrors } from '@/hooks/useAuthErrors';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { RateLimitMessage } from '@/components/auth/RateLimitMessage';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'BUYER' as 'BUYER' | 'PRODUCER',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authErrorData, setAuthErrorData] = useState<any>(null);

  const { register, loading, error, clearError } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const passwordValidation = usePasswordStrength(formData.password);
  const { handleAndShowError } = useAuthErrors();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setAuthErrorData(null);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Use new password validation (requires score >= 3)
    if (!passwordValidation?.isValid) {
      toast.error(passwordValidation?.message || 'Please use a stronger password');
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await register(registerData);

      if (response?.status === 'success') {
        if (response.data?.user?.verificationEmailSent) {
          toast.success('Registration successful! Please check your email for verification.');
          navigate('/verify-email-notice', {
            state: { email: formData.email }
          });
        } else {
          toast.success('Registration successful! Welcome to EthioTrust.');
          navigate(formData.role === 'PRODUCER' ? '/producer/dashboard' : '/buyer/dashboard');
        }
      }
    } catch (error: any) {
      // Handle specific authentication errors
      const errorResult = handleAndShowError(error);
      setAuthErrorData(errorResult);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) clearError();
    if (authErrorData) setAuthErrorData(null);
  };

  const getPasswordMatchStatus = () => {
    if (!formData.confirmPassword) return 'neutral';
    return formData.password === formData.confirmPassword ? 'match' : 'mismatch';
  };

  const passwordMatchStatus = getPasswordMatchStatus();
  const canSubmit = passwordValidation?.isValid && passwordMatchStatus === 'match' && !loading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-amber-50 to-green-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-green-900/20 p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-3xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Join EthioTrust
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
              Create your account in seconds
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Rate Limit Message */}
          {authErrorData?.code === 'RATE_LIMIT_EXCEEDED' && (
            <RateLimitMessage
              retryAfter={authErrorData.data?.retryAfter || 300}
              action="register"
              onRetryAvailable={() => {
                setAuthErrorData(null);
                toast.info('You can try registering again.');
              }}
            />
          )}

          {/* Generic Error Display */}
          {error && !authErrorData && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full"></div>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Compact Form Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Name */}
              <div className="space-y-1 col-span-2">
                <Label htmlFor="name" className="text-xs font-medium flex items-center space-x-1">
                  <User className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span>Full Name</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  disabled={loading || authErrorData?.code === 'RATE_LIMIT_EXCEEDED'}
                  className="h-9 text-sm border border-gray-300 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-600 transition-colors rounded-xl bg-white dark:bg-gray-800"
                />
              </div>

              {/* Email */}
              <div className="space-y-1 col-span-2 md:col-span-1">
                <Label htmlFor="email" className="text-xs font-medium flex items-center space-x-1">
                  <Mail className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span>Email</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  disabled={loading || authErrorData?.code === 'RATE_LIMIT_EXCEEDED'}
                  className="h-9 text-sm border border-gray-300 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-600 transition-colors rounded-xl bg-white dark:bg-gray-800"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1 col-span-2 md:col-span-1">
                <Label htmlFor="phone" className="text-xs font-medium flex items-center space-x-1">
                  <Phone className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span>Phone</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+251911234567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                  disabled={loading || authErrorData?.code === 'RATE_LIMIT_EXCEEDED'}
                  className="h-9 text-sm border border-gray-300 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-600 transition-colors rounded-xl bg-white dark:bg-gray-800"
                />
              </div>

              {/* Password */}
              <div className="space-y-1 col-span-2 md:col-span-1">
                <Label htmlFor="password" className="text-xs font-medium flex items-center space-x-1">
                  <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span>Password</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    disabled={loading || authErrorData?.code === 'RATE_LIMIT_EXCEEDED'}
                    className="h-9 text-sm border border-gray-300 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-600 transition-colors rounded-xl pr-10 bg-white dark:bg-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1 col-span-2 md:col-span-1">
                <Label htmlFor="confirmPassword" className="text-xs font-medium flex items-center space-x-1">
                  <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span>Confirm</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    disabled={loading || authErrorData?.code === 'RATE_LIMIT_EXCEEDED'}
                    className="h-9 text-sm border border-gray-300 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-600 transition-colors rounded-xl pr-10 bg-white dark:bg-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1 col-span-2">
                <Label htmlFor="role" className="text-xs font-medium flex items-center space-x-1">
                  <span>I want to</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange('role', 'BUYER')}
                    disabled={loading || authErrorData?.code === 'RATE_LIMIT_EXCEEDED'}
                    className={`h-9 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${formData.role === 'BUYER'
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-600'
                      }`}
                  >
                    👤 Buy Products
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('role', 'PRODUCER')}
                    disabled={loading || authErrorData?.code === 'RATE_LIMIT_EXCEEDED'}
                    className={`h-9 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${formData.role === 'PRODUCER'
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-600'
                      }`}
                  >
                    🏭 Sell Products
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Password Strength Indicator */}
            {formData.password && (
              <PasswordStrengthIndicator validation={passwordValidation} />
            )}

            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <div className={`flex items-center justify-center space-x-2 p-2 rounded-lg text-xs ${passwordMatchStatus === 'match'
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                {passwordMatchStatus === 'match' ? (
                  <CheckCircle className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 flex-shrink-0" />
                )}
                <span>
                  {passwordMatchStatus === 'match'
                    ? 'Passwords match!'
                    : 'Passwords do not match'
                  }
                </span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-10 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-amber-200 dark:hover:shadow-amber-800 transition-all duration-300"
              disabled={!canSubmit || authErrorData?.code === 'RATE_LIMIT_EXCEEDED'}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Create Account</span>
                </div>
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="text-center space-y-2 pt-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-amber-600 dark:text-amber-400 font-semibold hover:text-amber-700 dark:hover:text-amber-300 transition-colors hover:underline"
              >
                Sign in
              </Link>
            </div>

            <div>
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

export default Register;