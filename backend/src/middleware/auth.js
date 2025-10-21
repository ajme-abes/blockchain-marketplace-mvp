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
    console.log('🔧 JWT Secret exists:', !!process.env.JWT_SECRET);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔧 Token decoded successfully:', decoded);
    
    // Check if prisma is available
    if (!prisma) {
      console.error('❌ Prisma client not available in middleware');
      return res.status(500).json({ 
        error: 'Database connection not available',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true
      }
    });

    if (!user) {
      console.log('❌ User not found for ID:', decoded.userId);
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    console.log('✅ User authenticated:', user.email);
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
  optionalAuth 
};