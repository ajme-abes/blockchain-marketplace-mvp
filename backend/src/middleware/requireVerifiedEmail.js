// backend/src/middleware/requireVerifiedEmail.js
const { prisma } = require('../config/database');

const requireVerifiedEmail = (options = {}) => {
  return async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { 
          id: true,
          email: true,
          emailVerified: true,
          name: true
        }
      });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      if (!user.emailVerified) {
        return res.status(403).json({
          status: 'error',
          message: 'Email verification required',
          code: 'EMAIL_VERIFICATION_REQUIRED',
          data: {
            emailVerified: false,
            email: user.email,
            name: user.name,
            message: 'Please verify your email address to access this feature'
          }
        });
      }

      next();
    } catch (error) {
      console.error('Email verification middleware error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  };
};

module.exports = { requireVerifiedEmail };