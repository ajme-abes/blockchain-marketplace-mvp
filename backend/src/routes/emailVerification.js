// backend/src/routes/emailVerification.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const emailVerificationService = require('../services/emailVerificationService');
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

// Resend verification email (protected route)
router.post('/resend', authenticateToken, async (req, res) => {
  try {
    const result = await emailVerificationService.resendVerificationEmail(req.user.id);

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
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
      message: 'Failed to resend verification email'
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