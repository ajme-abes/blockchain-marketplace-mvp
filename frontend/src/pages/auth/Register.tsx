// src/components/Register.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Lock, Sparkles, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';

const checkPasswordStrength = (password: string) => {
  let score = 0;
  const requirements = {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  };

  if (password.length >= 8) {
    score += 1;
    requirements.length = true;
  }
  if (/[A-Z]/.test(password)) {
    score += 1;
    requirements.uppercase = true;
  }
  if (/[a-z]/.test(password)) {
    score += 1;
    requirements.lowercase = true;
  }
  if (/[0-9]/.test(password)) {
    score += 1;
    requirements.number = true;
  }
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
    requirements.special = true;
  }

  let strength = 'Very Weak';
  let color = 'bg-red-500';
  
  if (score >= 4) {
    strength = 'Strong';
    color = 'bg-green-500';
  } else if (score >= 3) {
    strength = 'Good';
    color = 'bg-amber-500';
  } else if (score >= 2) {
    strength = 'Fair';
    color = 'bg-yellow-500';
  } else if (score >= 1) {
    strength = 'Weak';
    color = 'bg-orange-500';
  }

  return { score, strength, color, requirements };
};

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
  const [passwordStrength, setPasswordStrength] = useState({ 
    score: 0, 
    strength: 'Very Weak', 
    color: 'bg-red-500', 
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  });

  const { register, loading, error, clearError } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password));
    } else {
      setPasswordStrength({ 
        score: 0, 
        strength: 'Very Weak', 
        color: 'bg-red-500', 
        requirements: {
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false
        }
      });
    }
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
  
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
  
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (passwordStrength.score < 2) {
      toast.error('Please use a stronger password');
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
      if (error?.code === 'EMAIL_EXISTS') {
        toast.error('This email is already registered. Please use a different email or login.');
      } else if (error?.code === 'PHONE_EXISTS') {
        toast.error('This phone number is already registered. Please use a different phone number.');
      } else {
        toast.error(error?.message || 'Registration failed. Please try again.');
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) clearError();
  };

  const getPasswordMatchStatus = () => {
    if (!formData.confirmPassword) return 'neutral';
    return formData.password === formData.confirmPassword ? 'match' : 'mismatch';
  };

  const passwordMatchStatus = getPasswordMatchStatus();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-amber-50 to-green-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-green-900/20 p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-3xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
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
          {error && (
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                  <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span>I want to</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange('role', 'BUYER')}
                    className={`h-9 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                      formData.role === 'BUYER'
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-600'
                    }`}
                  >
                    👤 Buy Products
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('role', 'PRODUCER')}
                    className={`h-9 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                      formData.role === 'PRODUCER'
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-600'
                    }`}
                  >
                    🏭 Sell Products
                  </button>
                </div>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-2 p-3 bg-gradient-to-r from-gray-50 to-amber-50 dark:from-gray-800/50 dark:to-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Password Strength
                  </span>
                  <span className={`text-xs font-bold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                    {passwordStrength.strength}
                  </span>
                </div>
                
                {/* Strength Bar */}
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        index <= passwordStrength.score 
                          ? passwordStrength.color 
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>

                {/* Compact Requirements */}
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {[
                    { key: 'length', text: '8+ chars' },
                    { key: 'uppercase', text: 'A-Z' },
                    { key: 'lowercase', text: 'a-z' },
                    { key: 'number', text: '0-9' },
                    { key: 'special', text: '!@#$' },
                  ].map((req) => (
                    <div key={req.key} className="flex items-center space-x-1">
                      {passwordStrength.requirements[req.key as keyof typeof passwordStrength.requirements] ? (
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      )}
                      <span className={
                        passwordStrength.requirements[req.key as keyof typeof passwordStrength.requirements]
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <div className={`flex items-center justify-center space-x-2 p-2 rounded-lg text-xs ${
                passwordMatchStatus === 'match' 
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
              disabled={loading || passwordStrength.score < 2 || passwordMatchStatus === 'mismatch'}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
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