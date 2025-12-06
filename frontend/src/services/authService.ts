// src/services/authService.ts - ENHANCED ERROR HANDLING
import api from './api';
import { ApiErrorResponse } from '@/types/auth';

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

export interface SessionInfo {
  id: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  otpauthUrl: string;
}

/**
 * Enhanced error handler for authentication operations
 */
function handleAuthError(error: any): never {
  // Preserve the original error structure for our error handling hooks
  const authError = {
    code: error.code || error.response?.data?.code || 'UNKNOWN_ERROR',
    message: error.message || error.error || error.response?.data?.error || 'An error occurred',
    details: error.details || error.response?.data?.details || error.response?.data,
    // Preserve additional fields for specific error types
    retryAfter: error.retryAfter || error.response?.data?.retryAfter,
    attemptsLeft: error.attemptsLeft || error.response?.data?.attemptsLeft,
    maxAttempts: error.maxAttempts || error.response?.data?.maxAttempts,
    unlockAt: error.unlockAt || error.response?.data?.unlockAt,
    minutesRemaining: error.minutesRemaining || error.response?.data?.minutesRemaining
  };

  throw authError;
}

export const authService = {
  // Enhanced methods with proper error handling
  async login(credentials: LoginData): Promise<{ token: string; refreshToken?: string; user: any; requires2FA?: boolean; userId?: string }> {
    try {
      return await api.login(credentials.email, credentials.password);
    } catch (error: any) {
      handleAuthError(error);
    }
  },

  async register(userData: RegisterData): Promise<any> {
    try {
      return await api.register(userData);
    } catch (error: any) {
      handleAuthError(error);
    }
  },

  async getCurrentUser(): Promise<any> {
    try {
      return await api.getCurrentUser();
    } catch (error: any) {
      handleAuthError(error);
    }
  },

  // Enhanced Password reset methods with proper error handling
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
      handleAuthError(error);
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
      handleAuthError(error);
    }
  },

  async verifyEmail(token: string): Promise<void> {
    try {
      return await api.verifyEmail(token);
    } catch (error: any) {
      handleAuthError(error);
    }
  },

  async resendVerificationEmail(email?: string): Promise<void> {
    try {
      return await api.resendVerificationEmail(email);
    } catch (error: any) {
      handleAuthError(error);
    }
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
      handleAuthError(error);
    }
  },

  // ========== SESSION MANAGEMENT ==========

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; user: any }> {
    try {
      const response = await api.request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      return {
        accessToken: response.accessToken,
        user: response.user
      };
    } catch (error: any) {
      throw new Error(error.error || error.message || 'Failed to refresh token');
    }
  },

  async getSessions(): Promise<SessionInfo[]> {
    try {
      const response = await api.request('/auth/sessions', {
        method: 'GET',
      });

      return response.sessions || [];
    } catch (error: any) {
      throw new Error(error.error || error.message || 'Failed to get sessions');
    }
  },

  async revokeSession(sessionId: string): Promise<void> {
    try {
      await api.request(`/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      throw new Error(error.error || error.message || 'Failed to revoke session');
    }
  },

  async revokeAllSessions(): Promise<void> {
    try {
      await api.request('/auth/sessions/revoke-all', {
        method: 'POST',
      });
    } catch (error: any) {
      throw new Error(error.error || error.message || 'Failed to revoke all sessions');
    }
  },

  // ========== TWO-FACTOR AUTHENTICATION ==========

  async setup2FA(): Promise<TwoFactorSetup> {
    try {
      const response = await api.request('/auth/2fa/setup', {
        method: 'POST',
      });

      return {
        secret: response.secret,
        qrCode: response.qrCode,
        otpauthUrl: response.otpauthUrl
      };
    } catch (error: any) {
      throw new Error(error.error || error.message || 'Failed to setup 2FA');
    }
  },

  async enable2FA(secret: string, token: string): Promise<{ backupCodes: string[] }> {
    try {
      const response = await api.request('/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ secret, token }),
      });

      return {
        backupCodes: response.backupCodes
      };
    } catch (error: any) {
      throw new Error(error.error || error.message || 'Failed to enable 2FA');
    }
  },

  async disable2FA(password: string): Promise<void> {
    try {
      await api.request('/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
    } catch (error: any) {
      throw new Error(error.error || error.message || 'Failed to disable 2FA');
    }
  },

  async verify2FA(userId: string, token: string): Promise<{ success: boolean; method: string }> {
    try {
      const response = await api.request('/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ userId, token }),
      });

      return {
        success: response.success,
        method: response.method
      };
    } catch (error: any) {
      throw new Error(error.error || error.message || 'Failed to verify 2FA');
    }
  },

  async regenerateBackupCodes(): Promise<{ backupCodes: string[] }> {
    try {
      const response = await api.request('/auth/2fa/backup-codes/regenerate', {
        method: 'POST',
      });

      return {
        backupCodes: response.backupCodes
      };
    } catch (error: any) {
      throw new Error(error.error || error.message || 'Failed to regenerate backup codes');
    }
  },

  async get2FAStatus(): Promise<{ enabled: boolean }> {
    try {
      const response = await api.request('/auth/2fa/status', {
        method: 'GET',
      });

      return {
        enabled: response.enabled
      };
    } catch (error: any) {
      throw new Error(error.error || error.message || 'Failed to get 2FA status');
    }
  },
};