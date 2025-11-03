// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '@/services/api'; // Your API service

type UserRole = 'BUYER' | 'PRODUCER' | 'ADMIN'; // Updated to match backend

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
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
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  address?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        apiService.setToken(token);
        const response = await apiService.getCurrentUser();
        setUser(response.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Token might be expired, remove it
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
  try {
    setLoading(true);
    setError(null);
    
    console.log('🔧 Frontend: Starting login for:', email);
    
    const response = await apiService.login(email, password);
    
    console.log('🔧 Frontend: Full login response:', response);
    
    // Handle case where response might be empty or different structure
    if (!response) {
      throw new Error('Empty response from server');
    }

    // Try different response structures
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
        emailVerified: userData.emailVerified,
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
    const errorMessage = error.message || 'Login failed. Please try again.';
    setError(errorMessage);
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