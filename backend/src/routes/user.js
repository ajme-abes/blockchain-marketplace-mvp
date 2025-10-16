const express = require('express');
const userService = require('../services/userService');
const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request body:', req.body); // Debug log
    
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
        received: { email, name, role } // Show what was received
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

    // Create user
    const user = await userService.createUser({
      email,
      password,
      name,
      phone,
      role,
      address
    });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: user
    });

  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during registration',
      error: error.message
    });
  }
});


// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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
      error: error.message
    });
  }
});

// Get all users (for testing)
router.get('/', async (req, res) => {
  try {
    const { prisma } = require('../config/database');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        address: true,
        registrationDate: true
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
      error: error.message
    });
  }
});

module.exports = router;