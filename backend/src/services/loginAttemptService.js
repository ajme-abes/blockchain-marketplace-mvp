// backend/src/services/loginAttemptService.js
const { prisma } = require('../config/database');

class LoginAttemptService {
    constructor() {
        this.MAX_ATTEMPTS = 5;
        this.LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
        this.ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes window
    }

    /**
     * Record a failed login attempt
     * @param {string} email - User email
     * @param {string} ipAddress - IP address of the attempt
     * @returns {Promise<Object>} - Attempt info with lockout status
     */
    async recordFailedAttempt(email, ipAddress = null) {
        try {
            const normalizedEmail = email.toLowerCase().trim();
            const now = new Date();
            const windowStart = new Date(now.getTime() - this.ATTEMPT_WINDOW);

            // Count recent failed attempts
            const recentAttempts = await prisma.auditLog.count({
                where: {
                    action: 'LOGIN_FAILED',
                    entity: 'User',
                    entityId: normalizedEmail,
                    timestamp: {
                        gte: windowStart
                    }
                }
            });

            // Log this attempt
            await prisma.auditLog.create({
                data: {
                    action: 'LOGIN_FAILED',
                    entity: 'User',
                    entityId: normalizedEmail,
                    ipAddress,
                    oldValues: { attemptNumber: recentAttempts + 1 },
                    timestamp: now
                }
            });

            const attemptsLeft = this.MAX_ATTEMPTS - (recentAttempts + 1);
            const isLocked = attemptsLeft <= 0;

            console.log(`🔒 Failed login attempt for ${normalizedEmail}: ${recentAttempts + 1}/${this.MAX_ATTEMPTS}`);

            return {
                attempts: recentAttempts + 1,
                maxAttempts: this.MAX_ATTEMPTS,
                attemptsLeft: Math.max(0, attemptsLeft),
                isLocked,
                lockoutDuration: this.LOCKOUT_DURATION / 60000, // in minutes
                unlockAt: isLocked ? new Date(now.getTime() + this.LOCKOUT_DURATION) : null
            };
        } catch (error) {
            console.error('❌ Error recording failed attempt:', error);
            // Don't block login on logging error
            return {
                attempts: 0,
                maxAttempts: this.MAX_ATTEMPTS,
                attemptsLeft: this.MAX_ATTEMPTS,
                isLocked: false
            };
        }
    }

    /**
     * Check if an account is locked
     * @param {string} email - User email
     * @returns {Promise<Object>} - Lockout status
     */
    async isAccountLocked(email) {
        try {
            const normalizedEmail = email.toLowerCase().trim();
            const now = new Date();
            const windowStart = new Date(now.getTime() - this.ATTEMPT_WINDOW);

            // Count recent failed attempts
            const recentAttempts = await prisma.auditLog.count({
                where: {
                    action: 'LOGIN_FAILED',
                    entity: 'User',
                    entityId: normalizedEmail,
                    timestamp: {
                        gte: windowStart
                    }
                }
            });

            const isLocked = recentAttempts >= this.MAX_ATTEMPTS;
            const attemptsLeft = Math.max(0, this.MAX_ATTEMPTS - recentAttempts);

            if (isLocked) {
                // Find the oldest attempt in the window to calculate unlock time
                const oldestAttempt = await prisma.auditLog.findFirst({
                    where: {
                        action: 'LOGIN_FAILED',
                        entity: 'User',
                        entityId: normalizedEmail,
                        timestamp: {
                            gte: windowStart
                        }
                    },
                    orderBy: {
                        timestamp: 'asc'
                    }
                });

                const unlockAt = oldestAttempt
                    ? new Date(oldestAttempt.timestamp.getTime() + this.ATTEMPT_WINDOW)
                    : new Date(now.getTime() + this.LOCKOUT_DURATION);

                console.log(`🔒 Account locked: ${normalizedEmail} until ${unlockAt.toISOString()}`);

                return {
                    isLocked: true,
                    attempts: recentAttempts,
                    maxAttempts: this.MAX_ATTEMPTS,
                    attemptsLeft: 0,
                    unlockAt,
                    minutesRemaining: Math.ceil((unlockAt - now) / 60000)
                };
            }

            return {
                isLocked: false,
                attempts: recentAttempts,
                maxAttempts: this.MAX_ATTEMPTS,
                attemptsLeft,
                unlockAt: null
            };
        } catch (error) {
            console.error('❌ Error checking account lock:', error);
            // Don't block login on checking error
            return {
                isLocked: false,
                attempts: 0,
                maxAttempts: this.MAX_ATTEMPTS,
                attemptsLeft: this.MAX_ATTEMPTS
            };
        }
    }

    /**
     * Clear failed attempts after successful login
     * @param {string} email - User email
     */
    async clearFailedAttempts(email) {
        try {
            const normalizedEmail = email.toLowerCase().trim();
            const now = new Date();
            const windowStart = new Date(now.getTime() - this.ATTEMPT_WINDOW);

            // Delete recent failed attempts
            await prisma.auditLog.deleteMany({
                where: {
                    action: 'LOGIN_FAILED',
                    entity: 'User',
                    entityId: normalizedEmail,
                    timestamp: {
                        gte: windowStart
                    }
                }
            });

            // Log successful login
            await prisma.auditLog.create({
                data: {
                    action: 'LOGIN_SUCCESS',
                    entity: 'User',
                    entityId: normalizedEmail,
                    timestamp: now
                }
            });

            console.log(`✅ Cleared failed attempts for ${normalizedEmail}`);
        } catch (error) {
            console.error('❌ Error clearing failed attempts:', error);
            // Don't block login on clearing error
        }
    }

    /**
     * Manually unlock an account (admin function)
     * @param {string} email - User email
     */
    async unlockAccount(email) {
        try {
            const normalizedEmail = email.toLowerCase().trim();

            await prisma.auditLog.deleteMany({
                where: {
                    action: 'LOGIN_FAILED',
                    entity: 'User',
                    entityId: normalizedEmail
                }
            });

            await prisma.auditLog.create({
                data: {
                    action: 'ACCOUNT_UNLOCKED',
                    entity: 'User',
                    entityId: normalizedEmail,
                    timestamp: new Date()
                }
            });

            console.log(`🔓 Account manually unlocked: ${normalizedEmail}`);
            return { success: true, message: 'Account unlocked successfully' };
        } catch (error) {
            console.error('❌ Error unlocking account:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new LoginAttemptService();
