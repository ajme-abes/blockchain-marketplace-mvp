// src/pages/auth/ForgotPassword.tsx - UPDATED WITH ETHIOPIAN COLORS
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, CheckCircle, Loader2, Shield, AlertCircle } from 'lucide-react';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

interface ForgotPasswordForm {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string>('');
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ForgotPasswordForm>();
  const email = watch('email');

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsSubmitting(true);
    setServerError('');
    
    try {
      const result = await authService.forgotPassword(data.email);
      setIsSubmitted(true);
      toast({
        title: "✅ Reset email sent!",
        description: result.message || "Check your email for password reset instructions",
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Password reset request failed:', error);
      setServerError(error.message);
      toast({
        title: "❌ Error sending reset email",
        description: error.message || "Please check your email and try again",
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

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5
      }
    }
  };

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
              <motion.div variants={itemVariants} className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl font-bold text-primary">
                    Forgot Password
                  </CardTitle>
                </div>
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardDescription className="text-base text-muted-foreground">
                  {isSubmitted 
                    ? "📧 Check your email for reset instructions" 
                    : "Enter your email address and we'll send you a reset link"
                  }
                </CardDescription>
              </motion.div>
            </CardHeader>
            
            <CardContent className="pb-8">
              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center space-y-6 py-4"
                  >
                    <div className="relative">
                      <CheckCircle className="h-20 w-20 text-primary mx-auto mb-4" />
                      <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping"></div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">
                        Check Your Email
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        We've sent password reset instructions to <strong>{email}</strong>. 
                        The link will expire in <strong>1 hour</strong> for security.
                      </p>
                    </div>
                    <div className="space-y-3 pt-2">
                      <Link to="/login">
                        <Button variant="outline" className="w-full border-2">
                          ← Back to Login
                        </Button>
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        Didn't receive the email?{' '}
                        <Button 
                          variant="link" 
                          className="p-0 h-auto font-semibold text-primary hover:text-primary/80" 
                          onClick={() => setIsSubmitted(false)}
                        >
                          Try again
                        </Button>
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    {serverError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {serverError}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          className="pl-10 pr-4 h-12 border-2 focus:border-primary transition-colors"
                          {...register('email', {
                            required: 'Email is required',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Please enter a valid email address'
                            }
                          })}
                        />
                      </div>
                      <AnimatePresence>
                        {errors.email && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-destructive text-sm flex items-center gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            {errors.email.message}
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
                            Sending Reset Link...
                          </>
                        ) : (
                          'Send Reset Instructions'
                        )}
                      </Button>
                    </motion.div>

                    <div className="text-center pt-2">
                      <Link to="/login">
                        <Button variant="link" className="text-primary hover:text-primary/80 font-medium">
                          ← Remember your password? Sign in
                        </Button>
                      </Link>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;