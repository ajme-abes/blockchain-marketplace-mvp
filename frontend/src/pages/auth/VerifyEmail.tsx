// src/pages/auth/VerifyEmail.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verifyToken = async () => {
      try {
        console.log('🔧 Starting email verification with token:', token);
        const result = await verifyEmail(token);
        console.log('✅ Verification result:', result);

        setStatus('success');
        setMessage('Email verified successfully! You can now login.');
        toast.success('Email verified successfully!');
      } catch (error: any) {
        console.error('❌ Verification error:', error);
        setStatus('error');
        setMessage(error.message || error.error || 'Verification failed. The link may be invalid or expired.');
        toast.error(error.message || 'Email verification failed');
      }
    };

    verifyToken();
  }, [searchParams, verifyEmail]);

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-amber-50 to-green-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-green-900/20 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="flex justify-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg ${status === 'loading' ? 'bg-gray-400' :
                status === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}>
              {status === 'loading' && <Loader className="h-7 w-7 text-white animate-spin" />}
              {status === 'success' && <CheckCircle className="h-7 w-7 text-white" />}
              {status === 'error' && <XCircle className="h-7 w-7 text-white" />}
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {status === 'loading' && 'Verifying Email...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
              {message}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'success' && (
            <Button
              onClick={handleNavigateToLogin}
              className="w-full h-10 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
            >
              Continue to Login
            </Button>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/resend-verification')}
                className="w-full h-10 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
              >
                Resend Verification Email
              </Button>
              <Button
                variant="outline"
                onClick={handleNavigateToLogin}
                className="w-full h-9 text-sm rounded-xl"
              >
                Back to Login
              </Button>
            </div>
          )}

          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center text-xs text-gray-500 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              ← Return home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;