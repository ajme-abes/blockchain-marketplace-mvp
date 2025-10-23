// backend/src/routes/orders.js
const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const orderService = require('../services/orderService');
const router = express.Router();

function validateOrderStatusTransition(currentStatus, newStatus, userRole) {
  const validTransitions = {
    BUYER: {
      'PENDING': ['CANCELLED']
    },
    PRODUCER: {
      'PENDING': ['CONFIRMED', 'SHIPPED', 'CANCELLED'],
      'CONFIRMED': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED']
    },
    ADMIN: {
      'PENDING': ['CONFIRMED', 'SHIPPED', 'CANCELLED'],
      'CONFIRMED': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED'],
      'CANCELLED': ['PENDING']
    }
  };

  const roleTransitions = validTransitions[userRole] || {};
  return roleTransitions[currentStatus]?.includes(newStatus) || false;
}

// Create order (BUYER only)
router.post('/', authenticateToken, requireRole(['BUYER']), async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    console.log('🔧 Creating order for buyer:', req.user.id);
    console.log('🔧 Order items:', items);

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Order must contain at least one item'
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        return res.status(400).json({
          status: 'error',
          message: 'Each item must have productId, quantity, and price'
        });
      }

      if (item.quantity <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Quantity must be greater than 0'
        });
      }

      if (item.price <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Price must be greater than 0'
        });
      }

      const subtotal = item.price * item.quantity;
      totalAmount += subtotal;

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        subtotal: subtotal
      });
    }

    // Get buyer profile
    const { prisma } = require('../config/database');
    const buyer = await prisma.buyer.findUnique({
      where: { userId: req.user.id }
    });

    if (!buyer) {
      return res.status(400).json({
        status: 'error',
        message: 'Buyer profile not found'
      });
    }

    const orderData = {
      buyerId: buyer.id,
      items: validatedItems,
      shippingAddress: shippingAddress || {},
      totalAmount: totalAmount
    };

    const order = await orderService.createOrder(orderData, req.user.id);

    console.log('✅ Order created successfully:', order.id);

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔧 Fetching order:', id);

    const order = await orderService.getOrderById(id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if user has access to this order
    const canAccess = await checkOrderAccess(req.user, order);
    if (!canAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this order'
      });
    }

    res.json({
      status: 'success',
      data: order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get order status history
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔧 Fetching order history:', id);

    const order = await orderService.getOrderById(id);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if user has access to this order
    const canAccess = await checkOrderAccess(req.user, order);
    if (!canAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this order'
      });
    }

    const history = await orderService.getOrderStatusHistory(id);

    res.json({
      status: 'success',
      data: history
    });

  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get buyer's orders
router.get('/my/orders', authenticateToken, requireRole(['BUYER']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    console.log('🔧 Fetching orders for buyer user:', req.user.id);

    // Get buyer profile
    const { prisma } = require('../config/database');
    const buyer = await prisma.buyer.findUnique({
      where: { userId: req.user.id }
    });

    if (!buyer) {
      return res.status(400).json({
        status: 'error',
        message: 'Buyer profile not found'
      });
    }

    const orders = await orderService.getBuyerOrders(buyer.id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      status: 'success',
      data: orders
    });

  } catch (error) {
    console.error('Get buyer orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch your orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get producer's orders
router.get('/producer/orders', authenticateToken, requireRole(['PRODUCER']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    console.log('🔧 Fetching orders for producer user:', req.user.id);

    // Get producer profile
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

    const orders = await orderService.getProducerOrders(producer.id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      status: 'success',
      data: orders
    });

  } catch (error) {
    console.error('Get producer orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch producer orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update order status (PRODUCER or ADMIN only)
router.put('/:id/status', authenticateToken, requireRole(['PRODUCER', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    console.log('🔧 Updating order status:', { orderId: id, status, reason });

    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Get current order first to validate transition
    const currentOrder = await orderService.getOrderById(id);
    if (!currentOrder) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Validate status transition
    const isValidTransition = validateOrderStatusTransition(
      currentOrder.deliveryStatus, 
      status, 
      req.user.role
    );

    if (!isValidTransition) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status transition from ${currentOrder.deliveryStatus} to ${status} for ${req.user.role} role`
      });
    }

    const order = await orderService.updateOrderStatus(id, status, req.user.id, reason);

    res.json({
      status: 'success',
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update order status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Cancel order (BUYER only)
router.post('/:id/cancel', authenticateToken, requireRole(['BUYER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    console.log('🔧 Cancelling order:', id);

    // Get current order first to validate
    const currentOrder = await orderService.getOrderById(id);
    if (!currentOrder) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Validate that buyer owns this order
    const { prisma } = require('../config/database');
    const buyer = await prisma.buyer.findUnique({
      where: { userId: req.user.id }
    });

    if (!buyer || currentOrder.buyer.id !== buyer.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this order'
      });
    }

    const order = await orderService.cancelOrder(id, req.user.id, reason);

    res.json({
      status: 'success',
      message: 'Order cancelled successfully',
      data: order
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to check order access
async function checkOrderAccess(user, order) {
  if (user.role === 'ADMIN') return true;

  const { prisma } = require('../config/database');

  if (user.role === 'BUYER') {
    const buyer = await prisma.buyer.findUnique({
      where: { userId: user.id }
    });
    return buyer && order.buyer && order.buyer.id === buyer.id;
  }

  if (user.role === 'PRODUCER') {
    const producer = await prisma.producer.findUnique({
      where: { userId: user.id },
      include: {
        products: {
          select: { id: true }
        }
      }
    });

    if (!producer) return false;

    // Check if any order item belongs to producer's products
    const producerProductIds = producer.products.map(p => p.id);
    return order.items.some(item => 
      producerProductIds.includes(item.product.id)
    );
  }

  return false;
}

module.exports = router;