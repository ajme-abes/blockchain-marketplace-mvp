// backend/src/routes/payouts.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const payoutService = require('../services/payoutService');

// ========== ADMIN ROUTES ==========

/**
 * GET /api/payouts/pending
 * Get all pending/scheduled payouts (Admin only)
 */
router.get('/pending', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const result = await payoutService.getPendingPayouts();

        if (result.success) {
            res.json({
                success: true,
                payouts: result.payouts
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get pending payouts error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/payouts/due
 * Get payouts due for processing (Admin only)
 */
router.get('/due', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const result = await payoutService.getDuePayouts();

        if (result.success) {
            res.json({
                success: true,
                payouts: result.payouts,
                count: result.count
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get due payouts error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/payouts/:payoutId/process
 * Mark payout as processing (Admin only)
 */
router.post('/:payoutId/process', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { payoutId } = req.params;

        const result = await payoutService.markPayoutProcessing(payoutId);

        if (result.success) {
            res.json({
                success: true,
                message: 'Payout marked as processing',
                payout: result.payout
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Process payout error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/payouts/:payoutId/complete
 * Mark payout as completed (Admin only)
 */
router.post('/:payoutId/complete', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { payoutId } = req.params;
        const { payoutReference, payoutMethod } = req.body;

        if (!payoutReference) {
            return res.status(400).json({
                success: false,
                error: 'Payout reference is required'
            });
        }

        const result = await payoutService.markPayoutComplete(payoutId, payoutReference, payoutMethod);

        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                payout: result.payout
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Complete payout error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/payouts/:payoutId/fail
 * Mark payout as failed (Admin only)
 */
router.post('/:payoutId/fail', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { payoutId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                error: 'Failure reason is required'
            });
        }

        const result = await payoutService.markPayoutFailed(payoutId, reason);

        if (result.success) {
            res.json({
                success: true,
                message: 'Payout marked as failed',
                payout: result.payout
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Fail payout error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========== PRODUCER ROUTES ==========

/**
 * GET /api/payouts/my-payouts
 * Get producer's own payout history
 */
router.get('/my-payouts', authenticateToken, requireRole('PRODUCER'), async (req, res) => {
    try {
        const userId = req.user.id;

        // Get producer profile
        const { prisma } = require('../config/database');
        const producer = await prisma.producer.findUnique({
            where: { userId: userId }
        });

        if (!producer) {
            return res.status(404).json({
                success: false,
                error: 'Producer profile not found'
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await payoutService.getProducerPayouts(producer.id, { page, limit });

        if (result.success) {
            res.json({
                success: true,
                payouts: result.payouts,
                pagination: result.pagination
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get my payouts error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/payouts/my-earnings
 * Get producer's earnings summary
 */
router.get('/my-earnings', authenticateToken, requireRole('PRODUCER'), async (req, res) => {
    try {
        const userId = req.user.id;

        // Get producer profile
        const { prisma } = require('../config/database');
        const producer = await prisma.producer.findUnique({
            where: { userId: userId }
        });

        if (!producer) {
            return res.status(404).json({
                success: false,
                error: 'Producer profile not found'
            });
        }

        const result = await payoutService.getProducerEarnings(producer.id);

        if (result.success) {
            res.json({
                success: true,
                earnings: result.earnings
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get my earnings error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/payouts/producer/:producerId
 * Get specific producer's payout history (Admin only)
 */
router.get('/producer/:producerId', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { producerId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await payoutService.getProducerPayouts(producerId, { page, limit });

        if (result.success) {
            res.json({
                success: true,
                payouts: result.payouts,
                pagination: result.pagination
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get producer payouts error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
