// backend/src/routes/payments.js
const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const paymentService = require('../services/paymentService');
const router = express.Router();

// Create payment intent (BUYER only)
router.post('/create-intent', authenticateToken, requireRole(['BUYER']), async (req, res) => {
  try {
    const { orderId, customerInfo = {} } = req.body;

    console.log('💳 Creating payment intent for order:', orderId);

    if (!orderId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID is required'
      });
    }

    // Get order details to verify ownership and amount
    const { prisma } = require('../config/database');
    const buyer = await prisma.buyer.findUnique({
      where: { userId: req.user.id },
      include: {
        orders: {
          where: { id: orderId },
          select: { id: true, totalAmount: true, paymentStatus: true }
        }
      }
    });

    if (!buyer || buyer.orders.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or access denied'
      });
    }

    const order = buyer.orders[0];

    if (order.paymentStatus !== 'PENDING') {
      return res.status(400).json({
        status: 'error',
        message: `Order payment already ${order.paymentStatus.toLowerCase()}`
      });
    }

    const paymentIntent = await paymentService.createPaymentIntent(
      orderId,
      order.totalAmount,
      customerInfo
    );

    res.json({
      status: 'success',
      message: 'Payment intent created successfully',
      data: paymentIntent
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create payment intent',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Chapa webhook handler (no authentication - called by Chapa)
router.post('/webhook/chapa', express.json(), async (req, res) => {
  try {
    console.log('🔄 Received Chapa webhook:', req.body);

    // Process the webhook
    const result = await paymentService.handlePaymentWebhook(req.body);

    // Always return 200 to Chapa to acknowledge receipt
    res.status(200).json({ 
      status: 'success', 
      message: 'Webhook processed successfully',
      data: result
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Still return 200 to Chapa, but log the error
    res.status(200).json({
      status: 'error',
      message: 'Webhook processing failed internally'
    });
  }
});

// Get payment status
router.get('/:orderId/status', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log('🔍 Getting payment status for order:', orderId);

    // Verify order access
    const { prisma } = require('../config/database');
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          select: { userId: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if user has access to this order
    if (req.user.role !== 'ADMIN' && order.buyer.userId !== req.user.id) {
      const producer = await prisma.producer.findUnique({
        where: { userId: req.user.id },
        include: {
          products: {
            select: { id: true }
          }
        }
      });

      if (!producer) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied to this order'
        });
      }

      const orderItems = await prisma.orderItem.findMany({
        where: { 
          orderId,
          productId: { in: producer.products.map(p => p.id) }
        }
      });

      if (orderItems.length === 0) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied to this order'
        });
      }
    }

    const paymentStatus = await paymentService.getPaymentStatus(orderId);

    res.json({
      status: 'success',
      data: paymentStatus
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;