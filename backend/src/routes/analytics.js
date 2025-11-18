const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');
const router = express.Router();

// Middleware to get producer ID
const getProducerId = async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    const producer = await prisma.producer.findUnique({
      where: { userId: req.user.id }
    });

    if (!producer) {
      return res.status(400).json({
        status: 'error',
        message: 'Producer profile not found'
      });
    }

    req.user.producerId = producer.id;
    next();
  } catch (error) {
    console.error('Get producer ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get producer profile'
    });
  }
};

router.get('/test-auth', authenticateToken, (req, res) => {
    console.log('✅ Auth test successful - User:', req.user);
    res.json({
      status: 'success',
      message: 'Authentication is working!',
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    });
  });
// All analytics routes require producer role
router.use(authenticateToken, requireRole(['PRODUCER']), getProducerId);

// Get overview analytics
router.get('/overview', analyticsController.getProducerOverview);

// Get sales trends
router.get('/sales-trends', analyticsController.getSalesTrends);

// Get product performance
router.get('/product-performance', analyticsController.getProductPerformance);

// Get customer insights
router.get('/customer-insights', analyticsController.getCustomerInsights);

module.exports = router;