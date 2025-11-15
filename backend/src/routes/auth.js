// backend/src/routes/auth.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const authService = require('../services/authService');
const userService = require('../services/userService');

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

    // Find user with related profiles
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        producerProfile: true,
        buyerProfile: true
      }
    });

    console.log('🔧 User found:', user ? user.id : 'NOT FOUND');

    if (!user) {
      console.log('❌ User not found for email:', email);
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

    // Generate token
    console.log('🔧 Login successful, generating token...');
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