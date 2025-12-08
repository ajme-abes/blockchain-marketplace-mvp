// backend/src/services/authService.js
const jwt = require('jsonwebtoken');
const prisma = require('../config/database'); // FIXED: Import at top level

// Use crypto.randomUUID() instead of uuid package (Node 18+ built-in)
const { randomUUID } = require('crypto');

class AuthService {
  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'blockchain-marketplace',
        subject: user.id
      }
    );
  }

  generateRefreshToken() {
    return randomUUID();
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async createSession(userId, ipAddress = null, userAgent = null) {
    try {
      console.log('🔧 Creating session for user:', userId);


      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true }
      });

      const token = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      console.log('🔧 Session data:', { userId, token: token.substring(0, 20) + '...', refreshToken });

      const session = await prisma.session.create({
        data: {
          userId,
          token,
          refreshToken,
          expiresAt,
          ipAddress,
          userAgent
        }
      });

      console.log('✅ Session created successfully:', session.id);

      return {
        accessToken: token,
        refreshToken,
        expiresAt: session.expiresAt
      };
    } catch (error) {
      console.error('❌ Session creation failed:', error);
      throw error;
    }
  }

  async invalidateSession(token) {
    try {
      await prisma.session.updateMany({
        where: { token },
        data: { isValid: false }
      });
    } catch (error) {
      console.error('❌ Session invalidation failed:', error);
      throw error;
    }
  }

  async invalidateAllUserSessions(userId) {
    try {
      await prisma.session.updateMany({
        where: { userId, isValid: true },
        data: { isValid: false }
      });
    } catch (error) {
      console.error('❌ User sessions invalidation failed:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();