// src/services/authService.ts
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

  // Password reset methods
  async forgotPassword(email: string): Promise<void> {
    return api.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    return api.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  async verifyEmail(token: string): Promise<void> {
    return api.verifyEmail(token);
  },

  async resendVerificationEmail(): Promise<void> {
    return api.resendVerificationEmail();
  },
};