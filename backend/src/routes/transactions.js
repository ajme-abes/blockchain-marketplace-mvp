const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const transactionService = require('../services/transactionService');
const router = express.Router();

// Get buyer transaction history
router.get('/buyer', authenticateToken, requireRole(['BUYER']), async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, status } = req.query;
    
    const buyer = await require('../config/database').prisma.buyer.findUnique({
      where: { userId: req.user.id }
    });

    if (!buyer) {
      return res.status(400).json({
        status: 'error',
        message: 'Buyer profile not found'
      });
    }

    const result = await transactionService.getBuyerTransactions(buyer.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate,
      status
    });

    res.json({
      status: 'success',
      data: result
    });

  } catch (error) {
    console.error('Get buyer transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transaction history'
    });
  }
});

// Get producer transaction history
router.get('/producer', authenticateToken, requireRole(['PRODUCER']), async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, status } = req.query;
    
    const producer = await require('../config/database').prisma.producer.findUnique({
      where: { userId: req.user.id }
    });

    if (!producer) {
      return res.status(400).json({
        status: 'error',
        message: 'Producer profile not found'
      });
    }

    const result = await transactionService.getProducerTransactions(producer.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate,
      status
    });

    res.json({
      status: 'success',
      data: result
    });

  } catch (error) {
    console.error('Get producer transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch sales history'
    });
  }
});

// Get sales analytics for producer
router.get('/analytics/sales', authenticateToken, requireRole(['PRODUCER']), async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const producer = await require('../config/database').prisma.producer.findUnique({
      where: { userId: req.user.id }
    });

    if (!producer) {
      return res.status(400).json({
        status: 'error',
        message: 'Producer profile not found'
      });
    }

    const analytics = await transactionService.getSalesAnalytics(producer.id, period);

    res.json({
      status: 'success',
      data: analytics
    });

  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch sales analytics'
    });
  }
});

module.exports = router;