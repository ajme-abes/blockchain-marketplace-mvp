const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const reviewService = require('../services/reviewService');
const { prisma } = require('../config/database'); // ADD THIS IMPORT
const router = express.Router();

// ==================== CREATE REVIEW ====================
router.post('/', authenticateToken, requireRole(['BUYER']), async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    
    // FIX: Look up buyerId from userId
    const buyer = await prisma.buyer.findUnique({
      where: { userId: req.user.id }
    });

    if (!buyer) {
      return res.status(400).json({
        status: 'error',
        message: 'Buyer profile not found'
      });
    }

    const buyerId = buyer.id;

    if (!productId || !rating) {
      return res.status(400).json({
        status: 'error',
        message: 'Product ID and rating are required'
      });
    }

    const result = await reviewService.createReview(buyerId, productId, rating, comment);

    if (result.success) {
      res.status(201).json({
        status: 'success',
        message: 'Review created successfully',
        data: result.review
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }

  } catch (error) {
    console.error('Create review route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create review'
    });
  }
});

// ==================== GET PRODUCT REVIEWS ====================
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await reviewService.getProductReviews(productId, parseInt(page), parseInt(limit));

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
    console.error('Get product reviews route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get product reviews'
    });
  }
});

// ==================== GET BUYER REVIEWS ====================
router.get('/my-reviews', authenticateToken, requireRole(['BUYER']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // FIX: Look up buyerId from userId
    const buyer = await prisma.buyer.findUnique({
      where: { userId: req.user.id }
    });

    if (!buyer) {
      return res.status(400).json({
        status: 'error',
        message: 'Buyer profile not found'
      });
    }

    const buyerId = buyer.id;

    const result = await reviewService.getBuyerReviews(buyerId, parseInt(page), parseInt(limit));

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
    console.error('Get buyer reviews route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get your reviews'
    });
  }
});

// ==================== UPDATE REVIEW ====================
router.put('/:reviewId', authenticateToken, requireRole(['BUYER']), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    
    // FIX: Look up buyerId from userId
    const buyer = await prisma.buyer.findUnique({
      where: { userId: req.user.id }
    });

    if (!buyer) {
      return res.status(400).json({
        status: 'error',
        message: 'Buyer profile not found'
      });
    }

    const buyerId = buyer.id;

    const result = await reviewService.updateReview(reviewId, buyerId, { rating, comment });

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Review updated successfully',
        data: result.review
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }

  } catch (error) {
    console.error('Update review route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update review'
    });
  }
});

// ==================== DELETE REVIEW ====================
router.delete('/:reviewId', authenticateToken, requireRole(['BUYER']), async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    // FIX: Look up buyerId from userId
    const buyer = await prisma.buyer.findUnique({
      where: { userId: req.user.id }
    });

    if (!buyer) {
      return res.status(400).json({
        status: 'error',
        message: 'Buyer profile not found'
      });
    }

    const buyerId = buyer.id;

    const result = await reviewService.deleteReview(reviewId, buyerId);

    if (result.success) {
      res.json({
        status: 'success',
        message: result.message
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }

  } catch (error) {
    console.error('Delete review route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete review'
    });
  }
});

// ==================== GET REVIEW STATS ====================
router.get('/product/:productId/stats', async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await reviewService.getProductReviewStats(productId);

    if (result.success) {
      res.json({
        status: 'success',
        data: result.stats
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }

  } catch (error) {
    console.error('Get review stats route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get review statistics'
    });
  }
});

module.exports = router;