// src/components/Register.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, MapPin, Lock, Sparkles, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    role: 'BUYER' as 'BUYER' | 'PRODUCER',
  });
  
  const { register, loading, error, clearError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
          
          if (formData.role === 'PRODUCER') {
            navigate('/producer/dashboard');
          } else {
            navigate('/buyer/dashboard');
          }
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Registration failed. Please try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) clearError();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-amber-50 to-green-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-green-900/20 p-4">
      <div className="absolute top-4 right-4">
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
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Join EthioTrust
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
              Create your account and start your trusted journey today
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center space-x-2 animate-pulse">
              <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full"></div>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-3">
              {/* Name Field */}
              <div className="space-y-1">
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
                  className="h-9 text-sm border border-gray-300 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-600 transition-colors rounded-xl px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-1">
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
                  className="h-9 text-sm border border-gray-300 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-600 transition-colors rounded-xl px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Phone Field */}
              <div className="space-y-1">
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
                  className="h-9 text-sm border border-gray-300 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-600 transition-colors rounded-xl px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Address Field */}
              <div className="space-y-1">
                <Label htmlFor="address" className="text-xs font-medium flex items-center space-x-1">
                  <MapPin className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span>Address</span>
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Your complete address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={loading}
                  className="h-9 text-sm border border-gray-300 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-600 transition-colors rounded-xl px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-medium flex items-center space-x-1">
                    <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    <span>Password</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    disabled={loading}
                    className="h-9 text-sm border border-gray-300 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-600 transition-colors rounded-xl px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium flex items-center space-x-1">
                    <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    <span>Confirm</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    disabled={loading}
                    className="h-9 text-sm border border-gray-300 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-600 transition-colors rounded-xl px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <Label htmlFor="role" className="text-xs font-medium flex items-center space-x-1">
                  <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span>Register as</span>
                </Label>
                <select
                  id="role"
                  className="flex h-9 w-full text-sm rounded-xl border border-gray-300 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 transition-colors cursor-pointer"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  disabled={loading}
                >
                  <option value="BUYER" className="py-2">👤 Buyer</option>
                  <option value="PRODUCER" className="py-2">🏭 Producer</option>
                </select>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-10 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-amber-200 dark:hover:shadow-amber-800 transition-all duration-300 mt-2"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Get Started 🚀'
              )}
            </Button>
          </form>

          <div className="space-y-2 pt-2">
            <div className="text-center text-xs">
              <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
              <Link 
                to="/login" 
                className="text-amber-600 dark:text-amber-400 font-semibold hover:text-amber-700 dark:hover:text-amber-300 transition-colors hover:underline"
              >
                Sign in here
              </Link>
            </div>
            
            <div className="text-center">
              <Link 
                to="/" 
                className="inline-flex items-center text-xs text-gray-500 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                ← Return home
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;