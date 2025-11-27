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
      // Send notification to producer
      try {
        const notificationService = require('../services/notificationService');

        // Get product and producer info
        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: {
            producer: {
              include: {
                user: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        });

        if (product && product.producer) {
          const stars = '⭐'.repeat(rating);
          const message = `${stars} New ${rating}-star review on your product "${product.name}"${comment ? ': "' + comment.substring(0, 50) + (comment.length > 50 ? '..."' : '"') : ''}`;

          await notificationService.createNotification(
            product.producer.userId,
            message,
            'REVIEW_RECEIVED'
          );

          console.log(`📢 Review notification sent to producer ${product.producer.userId}`);
        }
      } catch (notifError) {
        console.error('Failed to send review notification:', notifError);
        // Don't fail the review creation if notification fails
      }

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
// ==================== GET PRODUCER REVIEWS ====================
router.get('/producer/my-reviews', authenticateToken, requireRole(['PRODUCER']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Get producer profile
    const producer = await prisma.producer.findUnique({
      where: { userId: req.user.id },
      include: {
        products: {
          select: { id: true }
        }
      }
    });

    if (!producer) {
      return res.status(400).json({
        status: 'error',
        message: 'Producer profile not found'
      });
    }

    // Get product IDs for this producer
    const productIds = producer.products.map(p => p.id);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId: { in: productIds }
        },
        include: {
          buyer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              category: true
            }
          }
        },
        orderBy: { reviewDate: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.review.count({
        where: {
          productId: { in: productIds }
        }
      })
    ]);

    // Calculate statistics
    const stats = {
      total: total,
      average: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      stats.average = Math.round((totalRating / reviews.length) * 10) / 10;

      // Calculate distribution
      reviews.forEach(review => {
        stats.distribution[review.rating]++;
      });
    }

    res.json({
      status: 'success',
      data: {
        reviews,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get producer reviews route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get producer reviews'
    });
  }
});

module.exports = router;