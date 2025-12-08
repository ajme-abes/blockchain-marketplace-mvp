// backend/src/routes/emailVerification.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const emailVerificationService = require('../services/emailVerificationService');
const { emailVerificationLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// Verify email with token (public route)
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Verification token is required'
      });
    }

    const result = await emailVerificationService.verifyEmail(token);

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }

    res.json({
      status: 'success',
      message: result.message,
      data: {
        user: result.user
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Email verification failed'
    });
  }
});

// Resend verification email (public route - accepts email, with rate limiting)
router.post('/resend', emailVerificationLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const { prisma } = require('../config/database');
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, emailVerified: true }
    });

    if (!user) {
      // Don't reveal if user exists or not (security)
      return res.json({
        status: 'success',
        message: 'If an account exists with this email, a verification link has been sent.'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is already verified',
        code: 'ALREADY_VERIFIED'
      });
    }

    const result = await emailVerificationService.resendVerificationEmail(user.id);

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error,
        code: 'RESEND_FAILED'
      });
    }

    res.json({
      status: 'success',
      message: result.message
    });

  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to resend verification email',
      code: 'RESEND_ERROR'
    });
  }
});

// Check verification status (protected route)
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const { prisma } = require('../config/database');

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        emailVerified: true
      }
    });

    res.json({
      status: 'success',
      data: {
        emailVerified: user.emailVerified,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Check verification status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check verification status'
    });
  }
});

module.exports = router;