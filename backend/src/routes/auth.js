// backend/src/routes/auth.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const authService = require('../services/authService');
const userService = require('../services/userService');
const emailVerificationService = require('../services/emailVerificationService');
const passwordResetService = require('../services/passwordResetService');
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

// Login
router.post('/login', async (req, res) => {
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
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password using userService
    console.log('🔧 Verifying password...');
    const isValidPassword = await userService.validatePassword(password, user.passwordHash);
    console.log('🔧 Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', user.id);
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
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

    // Generate token
    console.log('🔧 Generating token for verified user...');
    const token = authService.generateAccessToken(user);
    
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
      token: token
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

// Logout - SIMPLE VERSION (session system disabled)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Logout requested for user:', req.user.id);
    
    // Simple success response - client should delete the token locally
    // Since session system is disabled, we can't invalidate server-side sessions
    res.json({ 
      message: 'Logout successful. Please delete the token on the client side.',
      note: 'Full session-based logout will be enabled when session system is implemented'
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

// Resend Verification Email Endpoint
router.post('/resend-verification', authenticateToken, async (req, res) => {
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

// Forgot Password Endpoint (Basic Implementation)
router.post('/forgot-password', async (req, res) => {
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
// Reset Password Endpoint (Basic Implementation)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: 'Token and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

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

// Refresh token - DISABLED (session system disabled)
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔧 Refresh token requested (disabled)');

    res.status(501).json({
      error: 'Token refresh not available',
      code: 'REFRESH_DISABLED',
      message: 'Token refresh system is temporarily disabled. Please login again to get a new token.',
      note: 'This feature will be enabled when session management is implemented'
    });

  } catch (error) {
    console.error('❌ Refresh token error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      code: 'REFRESH_FAILED'
    });
  }
});

module.exports = router;