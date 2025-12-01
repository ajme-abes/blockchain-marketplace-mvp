// backend/src/services/twoFactorService.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { prisma } = require('../config/database');

class TwoFactorService {
    /**
     * Generate 2FA secret for a user
     */
    async generateSecret(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, name: true }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Generate secret
            const secret = speakeasy.generateSecret({
                name: `EthioTrust (${user.email})`,
                issuer: 'EthioTrust Marketplace',
                length: 32
            });

            console.log('✅ 2FA secret generated for user:', userId);

            return {
                secret: secret.base32,
                otpauthUrl: secret.otpauth_url
            };
        } catch (error) {
            console.error('❌ Failed to generate 2FA secret:', error);
            throw error;
        }
    }

    /**
     * Generate QR code for 2FA setup
     */
    async generateQRCode(otpauthUrl) {
        try {
            const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
            return qrCodeDataUrl;
        } catch (error) {
            console.error('❌ Failed to generate QR code:', error);
            throw error;
        }
    }

    /**
     * Verify 2FA token
     */
    verifyToken(secret, token) {
        try {
            const verified = speakeasy.totp.verify({
                secret,
                encoding: 'base32',
                token,
                window: 2 // Allow 2 time steps before/after for clock drift
            });

            return verified;
        } catch (error) {
            console.error('❌ Failed to verify 2FA token:', error);
            return false;
        }
    }

    /**
     * Enable 2FA for a user
     */
    async enable2FA(userId, secret, token) {
        try {
            // Verify the token first
            const isValid = this.verifyToken(secret, token);

            if (!isValid) {
                return {
                    success: false,
                    error: 'Invalid verification code'
                };
            }

            // Generate backup codes
            const backupCodes = this.generateBackupCodes();

            // Store 2FA secret and backup codes in database
            await prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorSecret: secret,
                    twoFactorEnabled: true,
                    twoFactorBackupCodes: JSON.stringify(backupCodes)
                }
            });

            console.log('✅ 2FA enabled for user:', userId);

            return {
                success: true,
                backupCodes
            };
        } catch (error) {
            console.error('❌ Failed to enable 2FA:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Disable 2FA for a user
     */
    async disable2FA(userId, password) {
        try {
            // Verify password before disabling
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { passwordHash: true }
            });

            const userService = require('./userService');
            const isValidPassword = await userService.validatePassword(password, user.passwordHash);

            if (!isValidPassword) {
                return {
                    success: false,
                    error: 'Invalid password'
                };
            }

            // Disable 2FA
            await prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorSecret: null,
                    twoFactorEnabled: false,
                    twoFactorBackupCodes: null
                }
            });

            console.log('✅ 2FA disabled for user:', userId);

            return {
                success: true,
                message: '2FA disabled successfully'
            };
        } catch (error) {
            console.error('❌ Failed to disable 2FA:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify 2FA during login
     */
    async verify2FALogin(userId, token) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    twoFactorSecret: true,
                    twoFactorEnabled: true,
                    twoFactorBackupCodes: true
                }
            });

            if (!user || !user.twoFactorEnabled) {
                return {
                    success: false,
                    error: '2FA not enabled for this user'
                };
            }

            // Try to verify with TOTP token
            const isValidToken = this.verifyToken(user.twoFactorSecret, token);

            if (isValidToken) {
                console.log('✅ 2FA token verified for user:', userId);
                return {
                    success: true,
                    method: 'totp'
                };
            }

            // Try backup codes if TOTP fails
            if (user.twoFactorBackupCodes) {
                const backupCodes = JSON.parse(user.twoFactorBackupCodes);
                const codeIndex = backupCodes.indexOf(token);

                if (codeIndex !== -1) {
                    // Remove used backup code
                    backupCodes.splice(codeIndex, 1);
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            twoFactorBackupCodes: JSON.stringify(backupCodes)
                        }
                    });

                    console.log('✅ 2FA backup code verified for user:', userId);
                    return {
                        success: true,
                        method: 'backup',
                        remainingBackupCodes: backupCodes.length
                    };
                }
            }

            console.log('❌ Invalid 2FA code for user:', userId);
            return {
                success: false,
                error: 'Invalid verification code'
            };
        } catch (error) {
            console.error('❌ Failed to verify 2FA login:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate backup codes
     */
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            // Generate 8-character alphanumeric code
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            codes.push(code);
        }
        return codes;
    }

    /**
     * Regenerate backup codes
     */
    async regenerateBackupCodes(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { twoFactorEnabled: true }
            });

            if (!user || !user.twoFactorEnabled) {
                return {
                    success: false,
                    error: '2FA not enabled'
                };
            }

            const newBackupCodes = this.generateBackupCodes();

            await prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorBackupCodes: JSON.stringify(newBackupCodes)
                }
            });

            console.log('✅ Backup codes regenerated for user:', userId);

            return {
                success: true,
                backupCodes: newBackupCodes
            };
        } catch (error) {
            console.error('❌ Failed to regenerate backup codes:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if user has 2FA enabled
     */
    async is2FAEnabled(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { twoFactorEnabled: true }
            });

            return user?.twoFactorEnabled || false;
        } catch (error) {
            console.error('❌ Failed to check 2FA status:', error);
            return false;
        }
    }
}

module.exports = new TwoFactorService();
