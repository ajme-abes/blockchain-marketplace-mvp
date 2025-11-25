// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

// FIX: Import prisma with error handling
let prisma;
try {
  prisma = require('../config/database').prisma;
  console.log('✅ Prisma client loaded in auth middleware');
} catch (error) {
  console.error('❌ Failed to load prisma client in middleware:', error.message);
  // Try direct import
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
    console.log('✅ Prisma client created directly in middleware');
  } catch (err) {
    console.error('❌ Failed to create prisma client in middleware:', err.message);
  }
}

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔧 Auth middleware - Token received:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'MISSING_TOKEN'
    });
  }

  try {
    console.log('🔧 Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!prisma) {
      console.error('❌ Prisma client not available in middleware');
      return res.status(500).json({ 
        error: 'Database connection not available',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    // 🆕 GET USER WITH STATUS INFORMATION
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        status: true, // 🆕 ADD STATUS
        emailVerified: true // 🆕 ADD EMAIL VERIFIED
      }
    });

    if (!user) {
      console.log('❌ User not found for ID:', decoded.userId);
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // 🆕 CHECK USER STATUS IMMEDIATELY
    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      console.log(`🚫 Blocked suspended user during auth: ${user.email} (${user.status})`);
      return res.status(403).json({ 
        error: 'Your account has been suspended. Please contact support.',
        code: 'ACCOUNT_SUSPENDED',
        status: user.status
      });
    }

    console.log('✅ User authenticated:', { email: user.email, role: user.role, status: user.status });
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: 'Invalid token signature',
        code: 'INVALID_TOKEN_SIGNATURE'
      });
    }
    
    return res.status(403).json({ 
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!Array.isArray(roles)) {
      roles = [roles];
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};

const checkUserStatus = async (req, res, next) => {
  // Only check if user is authenticated
  if (req.user && req.user.id) {
    try {
      // Get full user data including status
      const userWithStatus = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          status: true, // 🆕 CHECK STATUS
          emailVerified: true
        }
      });

      if (!userWithStatus) {
        return res.status(401).json({ 
          error: 'User account not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // 🆕 CHECK IF USER IS SUSPENDED OR BANNED
      if (userWithStatus.status === 'SUSPENDED' || userWithStatus.status === 'BANNED') {
        console.log(`🚫 Blocked suspended user access: ${userWithStatus.email} (${userWithStatus.status})`);
        return res.status(403).json({ 
          error: 'Your account has been suspended. Please contact support.',
          code: 'ACCOUNT_SUSPENDED',
          status: userWithStatus.status
        });
      }

      // 🆕 OPTIONAL: Check for inactive users
      if (userWithStatus.status === 'INACTIVE') {
        console.log(`⚠️ Inactive user accessing: ${userWithStatus.email}`);
        // You can choose to block or allow with warning
      }

      // Update req.user with status information
      req.user.status = userWithStatus.status;
      req.user.emailVerified = userWithStatus.emailVerified;

    } catch (error) {
      console.error('❌ Error checking user status:', error);
      // Don't block access if status check fails, but log it
      console.warn('⚠️ Could not verify user status, proceeding with caution');
    }
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (prisma) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, role: true, name: true }
        });
        
        if (user) {
          req.user = user;
        }
      }
    } catch (error) {
      // Silently fail for optional auth
    }
  }
  
  next();
};

module.exports = { 
  authenticateToken, 
  requireRole,
  checkUserStatus, 
  optionalAuth,
  requireVerifiedEmail: require('./requireVerifiedEmail').requireVerifiedEmail 
};