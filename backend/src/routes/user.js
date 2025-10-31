const express = require('express');
const userService = require('../services/userService');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Try to import authService with error handling
let authService;
try {
  authService = require('../services/authService');
  console.log('✅ authService loaded successfully');
} catch (error) {
  console.error('❌ Failed to load authService:', error.message);
  authService = null;
}

// Register new user (with authService check)
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    
    const { email, password, name, phone, role, address } = req.body;

    // Check if body exists
    if (!req.body) {
      return res.status(400).json({
        status: 'error',
        message: 'Request body is missing'
      });
    }

    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: email, password, name, role',
        received: { email, name, role }
      });
    }

    // Validate role
    const validRoles = ['BUYER', 'PRODUCER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be: BUYER, PRODUCER, or ADMIN'
      });
    }

    // Check if user already exists
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }

    // Create user using the UPDATED createUser method (with email verification)
    const user = await userService.createUser({
      email,
      password,
      name,
      phone,
      role,
      address
    });

    // Check if authService is available
    if (!authService) {
      console.log('⚠️ authService not available, returning user without token');
      
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        registrationDate: user.registrationDate,
        emailVerified: user.emailVerified || false, // ADD THIS
        verificationEmailSent: user.verificationEmailSent || false // ADD THIS
      };

      return res.status(201).json({
        status: 'success',
        message: 'User registered successfully (JWT disabled - authService not available)',
        data: {
          user: userResponse
        }
      });
    }

    // If authService is available, generate token (skip session creation for now)
    console.log('🔧 Generating JWT token (session creation disabled)...');
    const token = authService.generateAccessToken(user);
    
    console.log('✅ Token generated successfully');

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      address: user.address,
      registrationDate: user.registrationDate,
      emailVerified: user.emailVerified || false, // ADD THIS
      verificationEmailSent: user.verificationEmailSent || false // ADD THIS
    };

    // Customize success message based on email verification status
    let successMessage = 'User registered successfully with JWT token (session creation disabled)';
    if (user.verificationEmailSent) {
      successMessage = 'User registered successfully. Please check your email for verification.';
    } else if (user.note) {
      successMessage = `User registered successfully. ${user.note}`;
    }

    res.status(201).json({
      status: 'success',
      message: successMessage,
      data: {
        user: userResponse,
        token: token,
        note: user.note || "Session creation temporarily disabled - database migration needed"
      }
    });

  } catch (error) {
    console.error('User registration error:', error);
    
    // Handle specific errors
    if (error.code === 'P2002') {
      return res.status(409).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user by ID (Protected)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Users can only access their own data unless they're ADMIN
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only access your own profile.'
      });
    }
    
    const user = await userService.getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all users (Protected - Admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Only ADMIN can list all users
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const { prisma } = require('../config/database');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        address: true,
        registrationDate: true,
        producerProfile: {
          select: {
            businessName: true,
            verificationStatus: true
          }
        },
        buyerProfile: {
          select: {
            preferredPaymentMethod: true
          }
        }
      }
    });

    res.json({
      status: 'success',
      data: users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// UPDATE USER PROFILE
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address, languagePreference } = req.body;

    console.log('🔧 Updating profile for user:', req.user.id);
    console.log('🔧 Update data:', { name, phone, address, languagePreference });

    // Validate at least one field is provided
    if (!name && !phone && !address && !languagePreference) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one field must be provided for update'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (languagePreference) updateData.languagePreference = languagePreference;

    const { prisma } = require('../config/database');
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        address: true,
        languagePreference: true,
        registrationDate: true,
        producerProfile: {
          select: {
            businessName: true,
            location: true,
            verificationStatus: true
          }
        },
        buyerProfile: {
          select: {
            preferredPaymentMethod: true
          }
        }
      }
    });

    console.log('✅ Profile updated successfully');

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;