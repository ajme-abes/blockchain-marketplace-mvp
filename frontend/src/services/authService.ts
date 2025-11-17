// src/services/authService.ts - UPDATED VERSION
import api from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'buyer' | 'producer';
  phone?: string;
  region?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  code?: string;
  data?: T;
}
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}
export const authService = {
  // Existing methods
  async login(credentials: LoginData): Promise<{ token: string; user: any }> {
    return api.login(credentials.email, credentials.password);
  },

  async register(userData: RegisterData): Promise<any> {
    return api.register(userData);
  },

  async getCurrentUser(): Promise<any> {
    return api.getCurrentUser();
  },

  // Enhanced Password reset methods
  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      const response = await api.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      
      return {
        message: response.message || 'Reset instructions sent to your email',
        data: response
      };
    } catch (error: any) {
      throw new Error(error.error || error.message || 'Failed to send reset email');
    }
  },

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    try {
      const response = await api.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      
      return {
        message: response.message || 'Password reset successfully',
        data: response
      };
    } catch (error: any) {
      throw new Error(error.error || error.message || 'Failed to reset password');
    }
  },

  async verifyEmail(token: string): Promise<void> {
    return api.verifyEmail(token);
  },

  async resendVerificationEmail(): Promise<void> {
    return api.resendVerificationEmail();
  },
  
  async changePassword(passwordData: ChangePasswordData): Promise<ApiResponse> {
    try {
      const response = await api.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordData),
      });
      
      return {
        message: response.message || 'Password changed successfully',
        data: response
      };
    } catch (error: any) {
      throw new Error(error.error || error.message || 'Failed to change password');
    }
  },
};