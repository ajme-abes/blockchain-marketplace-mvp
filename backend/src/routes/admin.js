const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const adminService = require('../services/adminService');
const router = express.Router();

// All admin routes require ADMIN role
router.use(authenticateToken, requireRole(['ADMIN']));

// ==================== DASHBOARD STATISTICS ====================
router.get('/dashboard/stats', async (req, res) => {
  try {
    const result = await adminService.getDashboardStats();

    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get dashboard statistics'
    });
  }
});

// ==================== USER MANAGEMENT ====================
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    const result = await adminService.getAllUsers(
      parseInt(page), 
      parseInt(limit), 
      search
    );

    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get users'
    });
  }
});

// ==================== PRODUCER VERIFICATION ====================
router.patch('/producers/:producerId/verify', async (req, res) => {
  try {
    const { producerId } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be VERIFIED or REJECTED'
      });
    }

    const result = await adminService.updateProducerVerification(
      producerId, 
      status, 
      adminId
    );

    if (result.success) {
      res.json({
        status: 'success',
        message: `Producer verification ${status.toLowerCase()} successfully`,
        data: result.producer
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Admin verify producer error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update producer verification'
    });
  }
});

// ==================== ORDER MANAGEMENT ====================
router.get('/orders', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      paymentStatus, 
      deliveryStatus 
    } = req.query;
    
    const filters = {};
    if (paymentStatus) filters.paymentStatus = paymentStatus;
    if (deliveryStatus) filters.deliveryStatus = deliveryStatus;

    const result = await adminService.getAllOrders(
      parseInt(page), 
      parseInt(limit), 
      filters
    );

    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Admin get orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get orders'
    });
  }
});

// ==================== SYSTEM HEALTH ====================
router.get('/system/health', async (req, res) => {
  try {
    const result = await adminService.getSystemHealth();

    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Admin system health error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system health'
    });
  }
});

// ==================== PRODUCT MANAGEMENT ====================
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'ACTIVE' } = req.query;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      // Get products with producer info
      prisma.product.findMany({
        where: { status },
        include: {
          producer: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          },
          _count: {
            select: {
              reviews: true,
              orderItems: true
            }
          }
        },
        orderBy: { listingDate: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.product.count({ where: { status } })
    ]);

    res.json({
      status: 'success',
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin get products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get products'
    });
  }
});

// ==================== REVIEWS MANAGEMENT ====================
router.get('/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        include: {
          buyer: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          },
          product: {
            select: { name: true }
          }
        },
        orderBy: { reviewDate: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.review.count()
    ]);

    res.json({
      status: 'success',
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin get reviews error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get reviews'
    });
  }
});

// ==================== PAYMENT ANALYTICS ====================
router.get('/analytics/payments', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query; // monthly, weekly, daily
    
    let paymentData;
    if (period === 'monthly') {
      paymentData = await adminService.getMonthlyRevenue(12);
    } else if (period === 'weekly') {
      // Implement weekly analytics
      paymentData = await adminService.getOrderTrends(30);
    }

    // Get payment method distribution
    const paymentMethods = await prisma.paymentConfirmation.groupBy({
      by: ['confirmationMethod'],
      _count: {
        id: true
      }
    });

    res.json({
      status: 'success',
      data: {
        timeline: paymentData,
        paymentMethods,
        summary: {
          totalTransactions: await prisma.paymentConfirmation.count(),
          successRate: await this.getPaymentSuccessRate()
        }
      }
    });
  } catch (error) {
    console.error('Admin payment analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get payment analytics'
    });
  }
});

// Helper function for payment success rate
async function getPaymentSuccessRate() {
  const [successful, total] = await Promise.all([
    prisma.paymentConfirmation.count({
      where: { isConfirmed: true }
    }),
    prisma.paymentConfirmation.count()
  ]);

  return total > 0 ? (successful / total) * 100 : 0;
}

module.exports = router;