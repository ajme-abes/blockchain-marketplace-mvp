// src/pages/auth/ResetPassword.tsx - UPDATED WITH ETHIOPIAN COLORS
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  if (!password || typeof password !== 'string') {
    return null;
  }

  const getStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) score++;
    if (pass.match(/\d/)) score++;
    if (pass.match(/[^a-zA-Z\d]/)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`h-2 flex-1 rounded-full transition-all duration-500 ${
              index <= strength ? strengthColors[strength] : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${
        strength === 0 ? 'text-destructive' :
        strength === 1 ? 'text-orange-500' :
        strength === 2 ? 'text-yellow-500' :
        strength === 3 ? 'text-blue-500' : 'text-primary'
      }`}>
        Password strength: {strengthLabels[strength]}
      </p>
    </div>
  );
};

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string>('');
  const [serverError, setServerError] = useState<string>('');
  const { toast } = useToast();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>();
  const password = watch('password', '');

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setTokenError('Invalid or missing reset token');
      toast({
        title: "❌ Invalid reset link",
        description: "Please use the link from your email",
        variant: "destructive",
      });
      navigate('/forgot-password');
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams, navigate, toast]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;

    setIsSubmitting(true);
    setServerError('');
    
    try {
      const result = await authService.resetPassword(token, data.password);
      setIsSuccess(true);
      toast({
        title: "✅ Password reset successfully!",
        description: result.message || "You can now login with your new password",
        duration: 5000,
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Password reset failed:', error);
      setServerError(error.message);
      toast({
        title: "❌ Error resetting password",
        description: error.message || "The reset link may have expired",
        variant: "destructive",
        duration: 5000,
      });
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
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 shadow-card border-0 bg-card">
          <CardContent className="pt-6 pb-6 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Invalid Reset Link</h2>
            <p className="text-muted-foreground mb-6">{tokenError}</p>
            <Button 
              onClick={() => navigate('/forgot-password')} 
              className="bg-primary hover:bg-primary/90 shadow-glow text-primary-foreground"
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
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validating reset token...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <main className="container mx-auto px-4 py-16 flex items-center justify-center">
          <motion.div
            className="w-full max-w-md"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <Card className="shadow-card border-0 bg-card text-center">
              <CardContent className="pt-8 pb-8">
                <div className="relative inline-block mb-4">
                  <CheckCircle className="h-20 w-20 text-primary" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-primary">
                  Password Reset Successfully!
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Your password has been updated securely. Redirecting to login page...
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate('/login')}
                    className="w-full bg-primary hover:bg-primary/90 shadow-glow text-primary-foreground"
                  >
                    Go to Login
                  </Button>
                  <p className="text-sm text-muted-foreground">
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
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[80vh]">
        <motion.div
          className="w-full max-w-md"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <Card className="shadow-card border-0 bg-card">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center gap-3 justify-center">
                <KeyRound className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl font-bold text-primary">
                  Reset Password
                </CardTitle>
              </div>
              <CardDescription className="text-center text-base text-muted-foreground">
                Create a new strong password for your account
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <AnimatePresence>
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4"
                  >
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {serverError}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    New Password
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      className="pl-10 pr-10 h-12 border-2 focus:border-primary transition-colors"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        },
                        validate: {
                          hasNumber: value => /\d/.test(value) || 'Should contain at least one number',
                          hasUpperCase: value => /[A-Z]/.test(value) || 'Should contain at least one uppercase letter',
                        }
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <PasswordStrengthIndicator password={password} />
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-destructive text-sm flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {errors.password.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      className="pl-10 pr-10 h-12 border-2 focus:border-primary transition-colors"
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <AnimatePresence>
                    {errors.confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-destructive text-sm flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {errors.confirmPassword.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-glow text-primary-foreground"
                    disabled={isSubmitting}
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
                    className="text-primary hover:text-primary/80 font-medium"
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