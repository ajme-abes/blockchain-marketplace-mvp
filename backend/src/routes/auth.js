// backend/src/routes/auth.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const authService = require('../services/authService');
const userService = require('../services/userService');
const emailVerificationService = require('../services/emailVerificationService');
const passwordResetService = require('../services/passwordResetService');
const loginAttemptService = require('../services/loginAttemptService');
const sessionService = require('../services/sessionService');
const twoFactorService = require('../services/twoFactorService');
const {
  loginLimiter,
  passwordResetLimiter,
  emailVerificationLimiter
} = require('../middleware/rateLimiter');
// FIX: Check the correct path to database config
let prisma;
try {
  prisma = require('../config/database').prisma;
  console.log('✅ Prisma client loaded in auth route');
} catch (error) {
  console.error('❌ Failed to load prisma client:', error.message);
  // Try alternative path
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
    console.log('✅ Prisma client created directly');
  } catch (err) {
    console.error('❌ Failed to create prisma client:', err.message);
  }
}

const router = express.Router();

// Login (with rate limiting)
router.post('/login', loginLimiter, async (req, res) => {
  try {
    // Check if prisma is available
    if (!prisma) {
      return res.status(500).json({
        error: 'Database connection not available',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    const { email, password } = req.body;

    console.log('🔧 Login attempt for email:', email);

    // Validation
    if (!email || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // ✅ FIX: Normalize email to lowercase for consistent querying
    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔧 Normalized login email:', { original: email, normalized: normalizedEmail });

    // ✅ CHECK IF ACCOUNT IS LOCKED
    const lockStatus = await loginAttemptService.isAccountLocked(normalizedEmail);
    if (lockStatus.isLocked) {
      console.log('🔒 Login blocked - account locked:', normalizedEmail);
      return res.status(423).json({
        error: `Account temporarily locked due to too many failed login attempts. Please try again in ${lockStatus.minutesRemaining} minutes.`,
        code: 'ACCOUNT_LOCKED',
        unlockAt: lockStatus.unlockAt,
        minutesRemaining: lockStatus.minutesRemaining,
        attempts: lockStatus.attempts,
        maxAttempts: lockStatus.maxAttempts
      });
    }

    // Find user with related profiles (using normalized email)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }, // Query with normalized email
      include: {
        producerProfile: true,
        buyerProfile: true
      }
    });

    console.log('🔧 User found:', user ? user.id : 'NOT FOUND');

    if (!user) {
      console.log('❌ User not found for email:', normalizedEmail);

      // Record failed attempt
      const attemptInfo = await loginAttemptService.recordFailedAttempt(normalizedEmail, req.ip);

      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        attemptsLeft: attemptInfo.attemptsLeft,
        maxAttempts: attemptInfo.maxAttempts
      });
    }

    // Verify password using userService
    console.log('🔧 Verifying password...');
    const isValidPassword = await userService.validatePassword(password, user.passwordHash);
    console.log('🔧 Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', user.id);

      // Record failed attempt
      const attemptInfo = await loginAttemptService.recordFailedAttempt(normalizedEmail, req.ip);

      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        attemptsLeft: attemptInfo.attemptsLeft,
        maxAttempts: attemptInfo.maxAttempts,
        ...(attemptInfo.isLocked && {
          accountLocked: true,
          unlockAt: attemptInfo.unlockAt
        })
      });
    }

    // ✅ NEW: CHECK EMAIL VERIFICATION STATUS
    if (!user.emailVerified) {
      console.log('❌ Login blocked - email not verified:', user.email);

      // Check if verification token is expired
      const isTokenExpired = user.verificationTokenExpires &&
        new Date() > user.verificationTokenExpires;

      return res.status(403).json({
        error: 'Please verify your email before logging in',
        code: 'EMAIL_NOT_VERIFIED',
        requiresVerification: true,
        canResend: isTokenExpired || !user.verificationToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    }

    // ✅ User is verified, proceed with login
    console.log('✅ Login successful for verified user:', user.email);

    // Clear failed login attempts
    await loginAttemptService.clearFailedAttempts(normalizedEmail);

    // Create session with access and refresh tokens
    console.log('🔧 Creating session for verified user...');
    const sessionData = await sessionService.createSession(
      user.id,
      req.ip,
      req.headers['user-agent']
    );

    console.log('✅ Login successful for user:', user.id);

    // Prepare user response
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      address: user.address,
      avatarUrl: user.avatarUrl,
      region: user.region,
      bio: user.bio,
      languagePreference: user.languagePreference,
      emailVerified: user.emailVerified, // ✅ Include verification status
      hasProducerProfile: !!user.producerProfile,
      hasBuyerProfile: !!user.buyerProfile
    };

    res.json({
      message: 'Login successful',
      user: userResponse,
      token: sessionData.accessToken,
      refreshToken: sessionData.refreshToken,
      expiresAt: sessionData.expiresAt
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// In backend/src/routes/auth.js - UPDATE THE /me ENDPOINT
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        avatarUrl: true, // ← ADD THIS
        region: true,    // ← ADD THIS
        bio: true,       // ← ADD THIS
        languagePreference: true,
        registrationDate: true,
        producerProfile: {
          select: {
            id: true,
            businessName: true,
            location: true,
            verificationStatus: true
          }
        },
        buyerProfile: {
          select: {
            id: true,
            preferredPaymentMethod: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    console.log('🔧 /me endpoint - User data:', {
      id: user.id,
      hasAvatar: !!user.avatarUrl,
      avatarUrl: user.avatarUrl
    });

    res.json({ user });
  } catch (error) {
    console.error('❌ /me endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch user profile',
      code: 'PROFILE_FETCH_FAILED'
    });
  }
});

// Logout - Invalidate session
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Logout requested for user:', req.user.id);

    const { refreshToken } = req.body;

    if (refreshToken) {
      // Invalidate specific session by refresh token
      await sessionService.invalidateSessionByRefreshToken(refreshToken);
      console.log('✅ Session invalidated successfully');
    } else {
      console.log('⚠️ No refresh token provided, client-side logout only');
    }

    res.json({
      message: 'Logout successful',
      success: true
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Verification token is required',
        code: 'MISSING_TOKEN'
      });
    }

    const result = await emailVerificationService.verifyEmail(token);

    if (result.success) {
      res.json({
        message: result.message,
        user: result.user
      });
    } else {
      res.status(400).json({
        error: result.error,
        code: 'VERIFICATION_FAILED'
      });
    }

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      error: 'Email verification failed',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Resend Verification Email Endpoint (with rate limiting)
router.post('/resend-verification', authenticateToken, emailVerificationLimiter, async (req, res) => {
  try {
    const result = await emailVerificationService.resendVerificationEmail(req.user.id);

    if (result.success) {
      res.json({
        message: result.message,
        verificationUrl: result.verificationUrl // For manual testing
      });
    } else {
      res.status(400).json({
        error: result.error,
        code: 'RESEND_FAILED'
      });
    }

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      error: 'Failed to resend verification email',
      code: 'RESEND_ERROR'
    });
  }
});

// Forgot Password Endpoint (with rate limiting)
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    // ✅ FIX: Normalize email for password reset
    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔧 Forgot password for normalized email:', normalizedEmail);

    const result = await passwordResetService.sendResetEmail(normalizedEmail);

    if (result.success) {
      res.json({
        message: result.message,
        emailSent: result.emailSent
      });
    } else {
      res.status(400).json({
        error: result.error,
        code: 'RESET_REQUEST_FAILED'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Password reset request failed',
      code: 'RESET_REQUEST_FAILED'
    });
  }
});
// Reset Password Endpoint (with rate limiting)
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: 'Token and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Password validation is now handled in passwordResetService
    const result = await passwordResetService.resetPassword(token, password);

    if (result.success) {
      res.json({
        message: result.message
      });
    } else {
      res.status(400).json({
        error: result.error,
        code: 'RESET_FAILED'
      });
    }

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      code: 'RESET_FAILED'
    });
  }
});

router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    console.log('🔐 CHANGE PASSWORD REQUEST:', {
      userId: req.user.id,
      email: req.user.email
    });

    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'New password must be at least 6 characters',
        code: 'WEAK_PASSWORD'
      });
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, passwordHash: true, email: true }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    console.log('🔧 Verifying current password for user:', user.email);

    // ✅ FIX: Use userService.validatePassword instead of authService
    const isCurrentPasswordValid = await userService.validatePassword(currentPassword, user.passwordHash);

    console.log('🔧 Current password valid:', isCurrentPasswordValid);

    if (!isCurrentPasswordValid) {
      console.log('❌ Current password invalid for user:', user.email);
      return res.status(400).json({
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    console.log('🔧 Hashing new password...');

    // ✅ FIX: Use userService.hashPassword
    const newPasswordHash = await userService.hashPassword(newPassword);

    console.log('🔧 Updating password in database...');

    // Update in database
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash }
    });

    console.log('✅ PASSWORD CHANGED SUCCESSFULLY for user:', user.email);

    res.json({
      message: 'Password changed successfully',
      success: true
    });

  } catch (error) {
    console.error('❌ CHANGE PASSWORD ERROR:', error);
    res.status(500).json({
      error: 'Failed to change password',
      code: 'CHANGE_PASSWORD_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Refresh token - Get new access token
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔧 Refresh token requested');

    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    const result = await sessionService.refreshAccessToken(refreshToken);

    if (!result.success) {
      return res.status(401).json({
        error: result.error || 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    res.json({
      message: 'Token refreshed successfully',
      accessToken: result.accessToken,
      user: result.user
    });

  } catch (error) {
    console.error('❌ Refresh token error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      code: 'REFRESH_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's active sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Fetching sessions for user:', req.user.id);

    const sessions = await sessionService.getUserSessions(req.user.id);

    res.json({
      message: 'Sessions retrieved successfully',
      sessions,
      count: sessions.length
    });

  } catch (error) {
    console.error('❌ Get sessions error:', error);
    res.status(500).json({
      error: 'Failed to retrieve sessions',
      code: 'GET_SESSIONS_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Revoke a specific session
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('🔧 Revoking session:', sessionId);

    // Verify session belongs to user
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    await sessionService.invalidateSession(sessionId);

    res.json({
      message: 'Session revoked successfully',
      success: true
    });

  } catch (error) {
    console.error('❌ Revoke session error:', error);
    res.status(500).json({
      error: 'Failed to revoke session',
      code: 'REVOKE_SESSION_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Revoke all sessions (logout from all devices)
router.post('/sessions/revoke-all', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Revoking all sessions for user:', req.user.id);

    const result = await sessionService.invalidateAllUserSessions(req.user.id);

    res.json({
      message: 'All sessions revoked successfully',
      success: true,
      count: result.count
    });

  } catch (error) {
    console.error('❌ Revoke all sessions error:', error);
    res.status(500).json({
      error: 'Failed to revoke all sessions',
      code: 'REVOKE_ALL_SESSIONS_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========== 2FA ENDPOINTS ==========

// Setup 2FA - Generate secret and QR code
router.post('/2fa/setup', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 2FA setup requested for user:', req.user.id);

    // Check if 2FA is already enabled
    const is2FAEnabled = await twoFactorService.is2FAEnabled(req.user.id);
    if (is2FAEnabled) {
      return res.status(400).json({
        error: '2FA is already enabled',
        code: '2FA_ALREADY_ENABLED'
      });
    }

    // Generate secret
    const { secret, otpauthUrl } = await twoFactorService.generateSecret(req.user.id);

    // Generate QR code
    const qrCode = await twoFactorService.generateQRCode(otpauthUrl);

    res.json({
      message: '2FA setup initiated',
      secret,
      qrCode,
      otpauthUrl
    });

  } catch (error) {
    console.error('❌ 2FA setup error:', error);
    res.status(500).json({
      error: 'Failed to setup 2FA',
      code: '2FA_SETUP_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enable 2FA - Verify token and enable
router.post('/2fa/enable', authenticateToken, async (req, res) => {
  try {
    const { secret, token } = req.body;

    if (!secret || !token) {
      return res.status(400).json({
        error: 'Secret and token are required',
        code: 'MISSING_FIELDS'
      });
    }

    const result = await twoFactorService.enable2FA(req.user.id, secret, token);

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        code: '2FA_ENABLE_FAILED'
      });
    }

    res.json({
      message: '2FA enabled successfully',
      backupCodes: result.backupCodes,
      success: true
    });

  } catch (error) {
    console.error('❌ 2FA enable error:', error);
    res.status(500).json({
      error: 'Failed to enable 2FA',
      code: '2FA_ENABLE_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Disable 2FA
router.post('/2fa/disable', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Password is required',
        code: 'MISSING_PASSWORD'
      });
    }

    const result = await twoFactorService.disable2FA(req.user.id, password);

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        code: '2FA_DISABLE_FAILED'
      });
    }

    res.json({
      message: result.message,
      success: true
    });

  } catch (error) {
    console.error('❌ 2FA disable error:', error);
    res.status(500).json({
      error: 'Failed to disable 2FA',
      code: '2FA_DISABLE_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify 2FA token during login
router.post('/2fa/verify', async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        error: 'User ID and token are required',
        code: 'MISSING_FIELDS'
      });
    }

    const result = await twoFactorService.verify2FALogin(userId, token);

    if (!result.success) {
      return res.status(401).json({
        error: result.error,
        code: '2FA_VERIFICATION_FAILED'
      });
    }

    res.json({
      message: '2FA verified successfully',
      success: true,
      method: result.method,
      remainingBackupCodes: result.remainingBackupCodes
    });

  } catch (error) {
    console.error('❌ 2FA verification error:', error);
    res.status(500).json({
      error: 'Failed to verify 2FA',
      code: '2FA_VERIFICATION_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Regenerate backup codes
router.post('/2fa/backup-codes/regenerate', authenticateToken, async (req, res) => {
  try {
    const result = await twoFactorService.regenerateBackupCodes(req.user.id);

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        code: 'BACKUP_CODES_REGENERATE_FAILED'
      });
    }

    res.json({
      message: 'Backup codes regenerated successfully',
      backupCodes: result.backupCodes,
      success: true
    });

  } catch (error) {
    console.error('❌ Backup codes regeneration error:', error);
    res.status(500).json({
      error: 'Failed to regenerate backup codes',
      code: 'BACKUP_CODES_REGENERATE_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Check 2FA status
router.get('/2fa/status', authenticateToken, async (req, res) => {
  try {
    const isEnabled = await twoFactorService.is2FAEnabled(req.user.id);

    res.json({
      enabled: isEnabled
    });

  } catch (error) {
    console.error('❌ 2FA status check error:', error);
    res.status(500).json({
      error: 'Failed to check 2FA status',
      code: '2FA_STATUS_CHECK_FAILED'
    });
  }
});

module.exports = router;