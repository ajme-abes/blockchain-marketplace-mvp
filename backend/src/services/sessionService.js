// backend/src/services/sessionService.js
const { prisma } = require('../config/database');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class SessionService {
    constructor() {
        this.ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
        this.REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    }

    /**
     * Generate access token (short-lived)
     */
    generateAccessToken(user) {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: this.ACCESS_TOKEN_EXPIRY,
                issuer: 'blockchain-marketplace',
                subject: user.id
            }
        );
    }

    /**
     * Generate refresh token (long-lived, random)
     */
    generateRefreshToken() {
        return crypto.randomBytes(40).toString('hex');
    }

    /**
     * Create a new session with access and refresh tokens
     */
    async createSession(userId, ipAddress = null, userAgent = null) {
        try {
            console.log('🔧 Creating session for user:', userId);

            // Get user data
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, role: true, name: true }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Generate tokens
            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken();
            const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY);

            // Store session in database
            const session = await prisma.session.create({
                data: {
                    userId,
                    token: accessToken,
                    refreshToken,
                    expiresAt,
                    ipAddress,
                    userAgent,
                    isValid: true
                }
            });

            console.log('✅ Session created successfully:', session.id);

            return {
                accessToken,
                refreshToken,
                expiresAt,
                sessionId: session.id
            };
        } catch (error) {
            console.error('❌ Session creation failed:', error);
            throw error;
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken) {
        try {
            console.log('🔧 Refreshing access token...');

            // Find valid session with this refresh token
            const session = await prisma.session.findFirst({
                where: {
                    refreshToken,
                    isValid: true,
                    expiresAt: {
                        gt: new Date()
                    }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                            name: true,
                            status: true
                        }
                    }
                }
            });

            if (!session) {
                console.log('❌ Invalid or expired refresh token');
                return {
                    success: false,
                    error: 'Invalid or expired refresh token'
                };
            }

            // Check user status
            if (session.user.status === 'SUSPENDED' || session.user.status === 'BANNED') {
                console.log('❌ User account is suspended/banned');
                await this.invalidateSession(session.id);
                return {
                    success: false,
                    error: 'Account suspended'
                };
            }

            // Generate new access token
            const newAccessToken = this.generateAccessToken(session.user);

            // Update session with new access token
            await prisma.session.update({
                where: { id: session.id },
                data: {
                    token: newAccessToken,
                    updatedAt: new Date()
                }
            });

            console.log('✅ Access token refreshed successfully');

            return {
                success: true,
                accessToken: newAccessToken,
                user: {
                    id: session.user.id,
                    email: session.user.email,
                    role: session.user.role,
                    name: session.user.name
                }
            };
        } catch (error) {
            console.error('❌ Token refresh failed:', error);
            return {
                success: false,
                error: 'Token refresh failed'
            };
        }
    }

    /**
     * Invalidate a specific session
     */
    async invalidateSession(sessionId) {
        try {
            await prisma.session.update({
                where: { id: sessionId },
                data: { isValid: false }
            });
            console.log('✅ Session invalidated:', sessionId);
            return { success: true };
        } catch (error) {
            console.error('❌ Session invalidation failed:', error);
            throw error;
        }
    }

    /**
     * Invalidate session by refresh token
     */
    async invalidateSessionByRefreshToken(refreshToken) {
        try {
            const result = await prisma.session.updateMany({
                where: { refreshToken, isValid: true },
                data: { isValid: false }
            });
            console.log('✅ Session invalidated by refresh token');
            return { success: true, count: result.count };
        } catch (error) {
            console.error('❌ Session invalidation failed:', error);
            throw error;
        }
    }

    /**
     * Invalidate all sessions for a user
     */
    async invalidateAllUserSessions(userId) {
        try {
            const result = await prisma.session.updateMany({
                where: { userId, isValid: true },
                data: { isValid: false }
            });
            console.log(`✅ All sessions invalidated for user: ${userId}`);
            return { success: true, count: result.count };
        } catch (error) {
            console.error('❌ User sessions invalidation failed:', error);
            throw error;
        }
    }

    /**
     * Get all active sessions for a user
     */
    async getUserSessions(userId) {
        try {
            const sessions = await prisma.session.findMany({
                where: {
                    userId,
                    isValid: true,
                    expiresAt: {
                        gt: new Date()
                    }
                },
                select: {
                    id: true,
                    ipAddress: true,
                    userAgent: true,
                    createdAt: true,
                    updatedAt: true,
                    expiresAt: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return sessions;
        } catch (error) {
            console.error('❌ Failed to get user sessions:', error);
            throw error;
        }
    }

    /**
     * Clean up expired sessions (run periodically)
     */
    async cleanupExpiredSessions() {
        try {
            const result = await prisma.session.deleteMany({
                where: {
                    OR: [
                        { expiresAt: { lt: new Date() } },
                        { isValid: false }
                    ]
                }
            });
            console.log(`✅ Cleaned up ${result.count} expired sessions`);
            return { success: true, count: result.count };
        } catch (error) {
            console.error('❌ Session cleanup failed:', error);
            throw error;
        }
    }

    /**
     * Verify access token
     */
    verifyAccessToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('TOKEN_EXPIRED');
            }
            throw new Error('INVALID_TOKEN');
        }
    }
}

module.exports = new SessionService();
