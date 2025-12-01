// backend/src/routes/bankAccounts.js
const express = require('express');
const { authenticateToken, checkUserStatus, requireRole } = require('../middleware/auth');
const { prisma } = require('../config/database');
const router = express.Router();

// Ethiopian banks list
const ETHIOPIAN_BANKS = [
    'Awash Bank',
    'Commercial Bank of Ethiopia (CBE)',
    'Bank of Abyssinia',
    'Dashen Bank',
    'Abay Bank',
    'Wegagen Bank',
    'United Bank',
    'Nib International Bank',
    'Cooperative Bank of Oromia',
    'Lion International Bank',
    'Oromia International Bank',
    'Zemen Bank',
    'Bunna International Bank',
    'Berhan International Bank',
    'Addis International Bank',
    'Debub Global Bank',
    'Enat Bank',
    'Telebirr',
    'M-Pesa Ethiopia',
    'Other'
];

// Get producer's bank accounts
router.get('/my-accounts', authenticateToken, checkUserStatus, requireRole(['PRODUCER']), async (req, res) => {
    try {
        const producer = await prisma.producer.findUnique({
            where: { userId: req.user.id },
            include: {
                bankAccounts: {
                    orderBy: [
                        { isPrimary: 'desc' },
                        { createdAt: 'desc' }
                    ]
                }
            }
        });

        if (!producer) {
            return res.status(404).json({
                status: 'error',
                message: 'Producer profile not found'
            });
        }

        res.json({
            status: 'success',
            accounts: producer.bankAccounts
        });

    } catch (error) {
        console.error('Get bank accounts error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch bank accounts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Add new bank account
router.post('/add', authenticateToken, checkUserStatus, requireRole(['PRODUCER']), async (req, res) => {
    try {
        const { bankName, accountNumber, accountName, branchName, swiftCode, accountType, isPrimary } = req.body;

        // Validation
        if (!bankName || !accountNumber || !accountName) {
            return res.status(400).json({
                status: 'error',
                message: 'Bank name, account number, and account name are required'
            });
        }

        // Get producer
        const producer = await prisma.producer.findUnique({
            where: { userId: req.user.id }
        });

        if (!producer) {
            return res.status(404).json({
                status: 'error',
                message: 'Producer profile not found'
            });
        }

        // If setting as primary, unset other primary accounts
        if (isPrimary) {
            await prisma.producerBankAccount.updateMany({
                where: {
                    producerId: producer.id,
                    isPrimary: true
                },
                data: { isPrimary: false }
            });
        }

        // Create bank account
        const bankAccount = await prisma.producerBankAccount.create({
            data: {
                producerId: producer.id,
                bankName,
                accountNumber,
                accountName,
                branchName: branchName || null,
                swiftCode: swiftCode || null,
                accountType: accountType || 'SAVINGS',
                isPrimary: isPrimary || false,
                isVerified: false
            }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'ADD_BANK_ACCOUNT',
                entity: 'ProducerBankAccount',
                entityId: bankAccount.id,
                userId: req.user.id,
                newValues: {
                    bankName,
                    accountNumber: `***${accountNumber.slice(-4)}`, // Mask account number
                    isPrimary
                }
            }
        });

        res.status(201).json({
            status: 'success',
            message: 'Bank account added successfully',
            account: bankAccount
        });

    } catch (error) {
        console.error('Add bank account error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to add bank account',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update bank account
router.put('/:accountId', authenticateToken, checkUserStatus, requireRole(['PRODUCER']), async (req, res) => {
    try {
        const { accountId } = req.params;
        const { bankName, accountNumber, accountName, branchName, swiftCode, accountType, isPrimary } = req.body;

        // Get producer
        const producer = await prisma.producer.findUnique({
            where: { userId: req.user.id }
        });

        if (!producer) {
            return res.status(404).json({
                status: 'error',
                message: 'Producer profile not found'
            });
        }

        // Check if account belongs to producer
        const existingAccount = await prisma.producerBankAccount.findFirst({
            where: {
                id: accountId,
                producerId: producer.id
            }
        });

        if (!existingAccount) {
            return res.status(404).json({
                status: 'error',
                message: 'Bank account not found'
            });
        }

        // If setting as primary, unset other primary accounts
        if (isPrimary && !existingAccount.isPrimary) {
            await prisma.producerBankAccount.updateMany({
                where: {
                    producerId: producer.id,
                    isPrimary: true,
                    id: { not: accountId }
                },
                data: { isPrimary: false }
            });
        }

        // Update bank account
        const updatedAccount = await prisma.producerBankAccount.update({
            where: { id: accountId },
            data: {
                bankName: bankName || existingAccount.bankName,
                accountNumber: accountNumber || existingAccount.accountNumber,
                accountName: accountName || existingAccount.accountName,
                branchName: branchName !== undefined ? branchName : existingAccount.branchName,
                swiftCode: swiftCode !== undefined ? swiftCode : existingAccount.swiftCode,
                accountType: accountType || existingAccount.accountType,
                isPrimary: isPrimary !== undefined ? isPrimary : existingAccount.isPrimary
            }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE_BANK_ACCOUNT',
                entity: 'ProducerBankAccount',
                entityId: accountId,
                userId: req.user.id,
                oldValues: {
                    bankName: existingAccount.bankName,
                    isPrimary: existingAccount.isPrimary
                },
                newValues: {
                    bankName: updatedAccount.bankName,
                    isPrimary: updatedAccount.isPrimary
                }
            }
        });

        res.json({
            status: 'success',
            message: 'Bank account updated successfully',
            account: updatedAccount
        });

    } catch (error) {
        console.error('Update bank account error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update bank account',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete bank account
router.delete('/:accountId', authenticateToken, checkUserStatus, requireRole(['PRODUCER']), async (req, res) => {
    try {
        const { accountId } = req.params;

        // Get producer
        const producer = await prisma.producer.findUnique({
            where: { userId: req.user.id }
        });

        if (!producer) {
            return res.status(404).json({
                status: 'error',
                message: 'Producer profile not found'
            });
        }

        // Check if account belongs to producer
        const existingAccount = await prisma.producerBankAccount.findFirst({
            where: {
                id: accountId,
                producerId: producer.id
            }
        });

        if (!existingAccount) {
            return res.status(404).json({
                status: 'error',
                message: 'Bank account not found'
            });
        }

        // Delete bank account
        await prisma.producerBankAccount.delete({
            where: { id: accountId }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'DELETE_BANK_ACCOUNT',
                entity: 'ProducerBankAccount',
                entityId: accountId,
                userId: req.user.id,
                oldValues: {
                    bankName: existingAccount.bankName,
                    accountNumber: `***${existingAccount.accountNumber.slice(-4)}`
                }
            }
        });

        res.json({
            status: 'success',
            message: 'Bank account deleted successfully'
        });

    } catch (error) {
        console.error('Delete bank account error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete bank account',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Set primary account
router.put('/:accountId/set-primary', authenticateToken, checkUserStatus, requireRole(['PRODUCER']), async (req, res) => {
    try {
        const { accountId } = req.params;

        // Get producer
        const producer = await prisma.producer.findUnique({
            where: { userId: req.user.id }
        });

        if (!producer) {
            return res.status(404).json({
                status: 'error',
                message: 'Producer profile not found'
            });
        }

        // Check if account belongs to producer
        const existingAccount = await prisma.producerBankAccount.findFirst({
            where: {
                id: accountId,
                producerId: producer.id
            }
        });

        if (!existingAccount) {
            return res.status(404).json({
                status: 'error',
                message: 'Bank account not found'
            });
        }

        // Unset all primary accounts
        await prisma.producerBankAccount.updateMany({
            where: {
                producerId: producer.id,
                isPrimary: true
            },
            data: { isPrimary: false }
        });

        // Set this account as primary
        const updatedAccount = await prisma.producerBankAccount.update({
            where: { id: accountId },
            data: { isPrimary: true }
        });

        res.json({
            status: 'success',
            message: 'Primary account updated successfully',
            account: updatedAccount
        });

    } catch (error) {
        console.error('Set primary account error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to set primary account',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get list of Ethiopian banks
router.get('/banks/list', (req, res) => {
    res.json({
        status: 'success',
        banks: ETHIOPIAN_BANKS
    });
});

// ========== ADMIN ENDPOINTS ==========

// Get producer's bank accounts (Admin only)
router.get('/admin/producer/:producerId/bank-accounts', authenticateToken, checkUserStatus, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { producerId } = req.params;

        const accounts = await prisma.producerBankAccount.findMany({
            where: { producerId },
            orderBy: [
                { isPrimary: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        res.json({
            status: 'success',
            accounts
        });

    } catch (error) {
        console.error('Get producer bank accounts error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch bank accounts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
