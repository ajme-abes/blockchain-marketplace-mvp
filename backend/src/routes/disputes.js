// backend/src/routes/disputes.js
const express = require('express');
const multer = require('multer');
const { authenticateToken, requireRole } = require('../middleware/auth');
const disputeService = require('../services/disputeService');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for evidence
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and videos
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'video/mp4', 'video/quicktime'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, PDF, Word, text, videos'), false);
    }
  }
});

// Create a new dispute
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { orderId, reason, description } = req.body;
    const raisedById = req.user.id;

    console.log('🔧 Creating dispute for order:', orderId);

    // Validate required fields
    if (!orderId || !reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID and reason are required'
      });
    }

    const result = await disputeService.createDispute({
      orderId,
      raisedById,
      reason,
      description
    });

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Dispute created successfully',
      data: result.dispute
    });

  } catch (error) {
    console.error('Create dispute route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create dispute',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add evidence to dispute
router.post('/:id/evidence', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { type, description } = req.body;

    console.log('🔧 Adding evidence to dispute:', id);

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Evidence file is required'
      });
    }

    const result = await disputeService.addEvidence(
      id,
      { type, description },
      req.file.buffer,
      req.file.originalname,
      userId
    );

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Evidence added successfully',
      data: result.evidence
    });

  } catch (error) {
    console.error('Add evidence route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add evidence',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add message to dispute
router.post('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { content, type, isInternal } = req.body;

    console.log('🔧 Adding message to dispute:', id);

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Message content is required'
      });
    }

    const result = await disputeService.addMessage(
      id,
      { content: content.trim(), type, isInternal },
      userId
    );

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Message added successfully',
      data: result.message
    });

  } catch (error) {
    console.error('Add message route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update dispute status (Admin only)
router.patch('/:id/status', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { status, resolution, refundAmount } = req.body;

    console.log('🔧 Updating dispute status:', id, status);

    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status is required'
      });
    }

    const validStatuses = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CANCELLED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await disputeService.updateDisputeStatus(
      id,
      { status, resolution, refundAmount },
      adminId
    );

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }

    res.json({
      status: 'success',
      message: 'Dispute status updated successfully',
      data: result.dispute
    });

  } catch (error) {
    console.error('Update dispute status route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update dispute status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's disputes
router.get('/my-disputes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    console.log('🔧 Getting disputes for user:', userId);

    const result = await disputeService.getUserDisputes(userId, {
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }

    res.json({
      status: 'success',
      data: result.data
    });

  } catch (error) {
    console.error('Get user disputes route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch disputes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get dispute details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('🔧 Getting dispute details:', id);

    const result = await disputeService.getDisputeDetails(id, userId);

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }

    res.json({
      status: 'success',
      data: result.data
    });

  } catch (error) {
    console.error('Get dispute details route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dispute details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all disputes (Admin only)
router.get('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    console.log('🔧 Getting all disputes (Admin)');

    const { prisma } = require('../config/database');

    const where = status ? { status } : {};

    const [disputes, totalCount] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          order: {
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
              }
            }
          },
          raisedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              evidence: true,
              messages: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.dispute.count({ where })
    ]);

    const formattedDisputes = disputes.map(dispute => ({
      id: dispute.id,
      orderId: dispute.orderId,
      reason: dispute.reason,
      status: dispute.status,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
      raisedBy: dispute.raisedBy,
      order: {
        id: dispute.order.id,
        totalAmount: dispute.order.totalAmount,
        buyer: dispute.order.buyer.user
      },
      evidenceCount: dispute._count.evidence,
      messageCount: dispute._count.messages
    }));

    res.json({
      status: 'success',
      data: {
        disputes: formattedDisputes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all disputes route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch disputes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get dispute statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    console.log('🔧 Getting dispute statistics');

    const { prisma } = require('../config/database');

    const [
      totalDisputes,
      openDisputes,
      underReviewDisputes,
      resolvedDisputes,
      recentDisputes
    ] = await Promise.all([
      prisma.dispute.count(),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      prisma.dispute.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.dispute.count({ where: { status: { in: ['RESOLVED', 'REFUNDED'] } } }),
      prisma.dispute.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    res.json({
      status: 'success',
      data: {
        total: totalDisputes,
        open: openDisputes,
        underReview: underReviewDisputes,
        resolved: resolvedDisputes,
        recent: recentDisputes,
        resolutionRate: totalDisputes > 0 ? (resolvedDisputes / totalDisputes) * 100 : 0
      }
    });

  } catch (error) {
    console.error('Get dispute stats route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dispute statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;