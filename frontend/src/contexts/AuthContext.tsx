// src/contexts/AuthContext.tsx - UPDATED
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '@/services/api';

type UserRole = 'BUYER' | 'PRODUCER' | 'ADMIN';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  avatarUrl?: string; // ← ADD THIS FIELD
  region?: string;    // ← ADD THIS FIELD  
  bio?: string;       // ← ADD THIS FIELD
  emailVerified?: boolean;
  registrationDate?: string;
  hasProducerProfile?: boolean;
  hasBuyerProfile?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void; 
  resendVerificationEmail: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  address?: string;
  region?: string;    // ← ADD THIS FIELD
  bio?: string;       // ← ADD THIS FIELD
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        apiService.setToken(token);
        const response = await apiService.getCurrentUser();
        
        // Make sure the user data includes avatarUrl
        console.log('🔧 AuthContext - User data from /me:', response.user);
        
        setUser(response.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  // In AuthContext.tsx - REPLACE the entire login method:

const login = async (email: string, password: string) => {
  try {
    setLoading(true);
    setError(null);
    
    console.log('🔧 Frontend: Starting login for:', email);
    
    const response = await apiService.login(email, password);
    
    // ✅ NEW: Check if login was blocked due to unverified email
    if (response.code === 'EMAIL_NOT_VERIFIED') {
      console.log('🔧 Frontend: Email not verified, redirecting to verification');
      
      // Store user info for verification flow
      const unverifiedUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        requiresVerification: true,
        canResend: response.canResend
      };
      
      // Navigate to verification notice with user info
      navigate('/verify-email-notice', { 
        state: { 
          email: response.user.email,
          user: unverifiedUser,
          fromLogin: true,
          canResend: response.canResend
        } 
      });
      
      // Throw error to stop the login flow
      throw new Error('Please verify your email before logging in');
    }

    // ✅ Normal login flow for verified users
    if (!response) {
      throw new Error('Empty response from server');
    }

    const token = response.token || response.data?.token;
    const userData = response.user || response.data?.user;

    if (token && userData) {
      apiService.setToken(token);
      
      const frontendUser: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: (userData.role as UserRole) || 'BUYER',
        phone: userData.phone,
        address: userData.address,
        avatarUrl: userData.avatarUrl,
        region: userData.region,
        bio: userData.bio,
        emailVerified: userData.emailVerified, // ✅ Include verification status
        registrationDate: userData.registrationDate,
        hasProducerProfile: userData.hasProducerProfile,
        hasBuyerProfile: userData.hasBuyerProfile
      };
      
      setUser(frontendUser);
      localStorage.setItem('authToken', token);
      localStorage.setItem('ethiotrust-user', JSON.stringify(frontendUser));
      
      console.log('🔧 Frontend: Login successful, user:', frontendUser);
    } else {
      console.error('🔧 Frontend: Missing token or user data in response:', response);
      throw new Error('Invalid response from server - missing token or user data');
    }
  } catch (error: any) {
    console.error('🔧 Frontend: Login failed:', error);
    
    // Don't show error for unverified email (we handled it above)
    if (error.message !== 'Please verify your email before logging in') {
      const errorMessage = error.message || 'Login failed. Please try again.';
      setError(errorMessage);
    }
    
    throw error;
  } finally {
    setLoading(false);
  }
};
  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.register(userData);
      
      if (response.data?.token) {
        apiService.setToken(response.data.token);
        setUser(response.data.user);
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('ethiotrust-user', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const resendVerificationEmail = async () => {
    try {
      const response = await apiService.resendVerificationEmail();
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to resend verification email';
      setError(errorMessage);
      throw error;
    }
  };
  const verifyEmail = async (token: string) => {
    try {
      await apiService.verifyEmail(token);
    } catch (error: any) {
      const errorMessage = error.message || 'Email verification failed';
      setError(errorMessage);
      throw error;
    }
  };
  

  // ADD THIS METHOD TO UPDATE USER
  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('ethiotrust-user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    apiService.removeToken();
    localStorage.removeItem('authToken');
    localStorage.removeItem('ethiotrust-user');
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
    error,
    clearError,
    updateUser, 
    resendVerificationEmail,
    verifyEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};