const express = require('express');
const { authenticateToken, requireRole, checkUserStatus } = require('../middleware/auth');
const adminService = require('../services/adminService');
const router = express.Router();

// All admin routes require ADMIN role
router.use(authenticateToken, checkUserStatus, requireRole(['ADMIN']));

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
    const { status, reason } = req.body;
    const adminId = req.user.id;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be VERIFIED or REJECTED'
      });
    }

    // Get admin user info
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { name: true }
    });

    // TEMPORARY: Update only verificationStatus until backend is restarted
    // The new fields (verifiedAt, verifiedBy) will work after Prisma client regeneration
    const updatedProducer = await prisma.producer.update({
      where: { id: producerId },
      data: {
        verificationStatus: status,
        // Only update rejectionReason as it already exists in the old schema
        ...(status === 'REJECTED' && reason && { rejectionReason: reason })
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    // 🆕 CREATE NOTIFICATION FOR PRODUCER
    const notificationService = require('../services/notificationService');
    let notificationMessage = '';

    if (status === 'VERIFIED') {
      notificationMessage = 'Your producer account has been verified! You can now list products and start selling.';
    } else {
      notificationMessage = `Your producer verification was rejected.${reason ? ` Reason: ${reason}` : ''}`;
    }

    await notificationService.createNotification(
      updatedProducer.userId,
      notificationMessage,
      'SECURITY'
    );

    // 🆕 LOG THE ACTION
    await prisma.auditLog.create({
      data: {
        action: status === 'VERIFIED' ? 'PRODUCER_VERIFIED' : 'PRODUCER_REJECTED',
        entity: 'PRODUCER',
        entityId: producerId,
        userId: adminId,
        newValues: {
          verificationStatus: status,
          ...(reason && { rejectionReason: reason })
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      status: 'success',
      message: `Producer verification ${status.toLowerCase()} successfully`,
      data: { producer: updatedProducer }
    });

  } catch (error) {
    console.error('Admin verify producer error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update producer verification',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// ==================== ENHANCED USER MANAGEMENT ====================
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        producerProfile: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                status: true,
                listingDate: true
              }
            }
          }
        },
        buyerProfile: {
          include: {
            orders: {
              include: {
                orderItems: {
                  include: {
                    product: {
                      select: {
                        name: true,
                        price: true
                      }
                    }
                  }
                }
              },
              orderBy: {
                orderDate: 'desc'
              },
              take: 10
            },
            reviews: {
              include: {
                product: {
                  select: {
                    name: true
                  }
                }
              },
              orderBy: {
                reviewDate: 'desc'
              },
              take: 10
            }
          }
        },
        orders: {
          include: {
            orderItems: {
              include: {
                product: {
                  select: {
                    name: true,
                    price: true
                  }
                }
              }
            }
          },
          orderBy: {
            orderDate: 'desc'
          },
          take: 10 // 🆕 INCREASE THIS
        },
        sessions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        auditLogs: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 10
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // 🆕 CALCULATE RATING FOR PRODUCERS
    let producerRating = { rating: 0, reviewCount: 0 };
    if (user.role === 'PRODUCER' && user.producerProfile) {
      const ratingData = await prisma.review.aggregate({
        where: {
          product: {
            producerId: user.producerProfile.id
          }
        },
        _avg: { rating: true },
        _count: { id: true }
      });

      producerRating = {
        rating: ratingData._avg.rating || 0,
        reviewCount: ratingData._count.id || 0
      };
    }

    // Calculate stats
    const totalOrders = await prisma.order.count({
      where: { buyerId: user.buyerProfile?.id }
    });

    const totalSpent = await prisma.order.aggregate({
      where: {
        buyerId: user.buyerProfile?.id,
        paymentStatus: 'CONFIRMED'
      },
      _sum: { totalAmount: true }
    });

    const totalProducts = await prisma.product.count({
      where: { producerId: user.producerProfile?.id }
    });

    const totalSales = await prisma.order.aggregate({
      where: {
        orderItems: {
          some: {
            product: {
              producerId: user.producerProfile?.id
            }
          }
        },
        paymentStatus: 'CONFIRMED'
      },
      _sum: { totalAmount: true }
    });

    const userWithStats = {
      ...user,
      buyer: user.buyerProfile ? {
        ...user.buyerProfile,
        totalOrders,
        totalSpent: totalSpent._sum.totalAmount || 0,
        averageOrderValue: totalOrders > 0 ? (totalSpent._sum.totalAmount || 0) / totalOrders : 0
      } : null,
      producer: user.producerProfile ? {
        ...user.producerProfile,
        totalProducts,
        totalSales: totalSales._sum.totalAmount || 0,
        ...producerRating // 🆕 ADD RATING DATA
      } : null
    };

    res.json({
      status: 'success',
      data: {
        user: userWithStats
      }
    });

  } catch (error) {
    console.error('Admin get user details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user details'
    });
  }
});

// SUSPEND USER
router.patch('/users/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'USER_SUSPENDED',
        entity: 'USER',
        entityId: id,
        userId: req.user.id,
        oldValues: { status: 'ACTIVE' },
        newValues: { status: 'SUSPENDED', reason },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      status: 'success',
      message: 'User suspended successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Admin suspend user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to suspend user'
    });
  }
});

// ACTIVATE USER
router.patch('/users/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });

    await prisma.auditLog.create({
      data: {
        action: 'USER_ACTIVATED',
        entity: 'USER',
        entityId: id,
        userId: req.user.id,
        oldValues: { status: 'SUSPENDED' },
        newValues: { status: 'ACTIVE' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      status: 'success',
      message: 'User activated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Admin activate user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to activate user'
    });
  }
});

// DELETE USER
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Use transaction to delete related records
    await prisma.$transaction(async (tx) => {
      // Delete user and related records will cascade
      await tx.user.delete({
        where: { id }
      });
    });

    await prisma.auditLog.create({
      data: {
        action: 'USER_DELETED',
        entity: 'USER',
        entityId: id,
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user'
    });
  }
});

// ENHANCED USER LISTING WITH STATS
router.get('/users-with-stats', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role, status, verification } = req.query;

    const skip = (page - 1) * limit;

    // Build where clause with filters
    const whereClause = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role && role !== 'all') {
      whereClause.role = role;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          buyerProfile: {
            select: {
              id: true,
              preferredPaymentMethod: true
            }
          },
          producerProfile: {
            select: {
              id: true,
              businessName: true,
              verificationStatus: true,
              location: true
            }
          }
        },
        orderBy: { registrationDate: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where: whereClause })
    ]);

    // Calculate stats for the cards
    const stats = {
      total: await prisma.user.count(),
      buyers: await prisma.user.count({ where: { role: 'BUYER' } }),
      producers: await prisma.user.count({ where: { role: 'PRODUCER' } }),
      admins: await prisma.user.count({ where: { role: 'ADMIN' } }),
      pendingVerifications: await prisma.producer.count({
        where: { verificationStatus: 'PENDING' }
      }),
      suspended: await prisma.user.count({ where: { status: 'SUSPENDED' } })
    };

    // Transform users to match frontend structure
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      registrationDate: user.registrationDate,
      address: user.address,
      region: user.region,
      status: user.status,
      buyer: user.buyerProfile ? {
        id: user.buyerProfile.id,
        preferredPaymentMethod: user.buyerProfile.preferredPaymentMethod
      } : undefined,
      producer: user.producerProfile ? {
        id: user.producerProfile.id,
        businessName: user.producerProfile.businessName,
        verificationStatus: user.producerProfile.verificationStatus,
        location: user.producerProfile.location
      } : undefined
    }));

    res.json({
      status: 'success',
      data: {
        users: transformedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        stats // This will fix your stats cards!
      }
    });

  } catch (error) {
    console.error('Admin get users with stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get users with stats'
    });
  }
});

// ==================== VERIFICATION QUEUE ====================
router.get('/producers/verification-queue', async (req, res) => {
  try {
    // Get producers with PENDING verification status
    const producers = await prisma.producer.findMany({
      where: {
        verificationStatus: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            registrationDate: true,
            region: true,
            avatarUrl: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        // 🆕 INCLUDE DOCUMENTS
        documents: {
          select: {
            id: true,
            type: true,
            url: true,
            filename: true,
            uploadedAt: true
          }
        }
      },
      orderBy: {
        user: {
          registrationDate: 'desc'
        }
      }
    });

    // Transform to match frontend interface
    const transformedProducers = producers.map(producer => ({
      id: producer.id,
      userId: producer.userId,
      user: producer.user,
      businessName: producer.businessName,
      businessDescription: producer.businessDescription,
      location: producer.location,
      verificationStatus: producer.verificationStatus,
      verificationSubmittedAt: producer.user.registrationDate,
      // 🆕 NOW INCLUDES REAL DOCUMENTS
      documents: producer.documents.map(doc => ({
        id: doc.id,
        type: doc.type,
        url: doc.url,
        filename: doc.filename,
        uploadedAt: doc.uploadedAt
      })),
      products: producer.products // 🆕 ADD PRODUCTS COUNT
    }));

    res.json({
      status: 'success',
      data: {
        producers: transformedProducers
      }
    });

  } catch (error) {
    console.error('Get verification queue error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get verification queue'
    });
  }
});

// ==================== GET ALL PRODUCERS (All Statuses) ====================
router.get('/producers/all', async (req, res) => {
  try {
    // Get ALL producers regardless of verification status
    const producers = await prisma.producer.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            registrationDate: true,
            region: true,
            avatarUrl: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        documents: {
          select: {
            id: true,
            type: true,
            url: true,
            filename: true,
            uploadedAt: true,
            fileSize: true
          }
        }
      },
      orderBy: {
        user: {
          registrationDate: 'desc'
        }
      }
    });

    // Transform to match frontend interface
    const transformedProducers = producers.map(producer => ({
      id: producer.id,
      userId: producer.userId,
      user: producer.user,
      businessName: producer.businessName,
      businessDescription: producer.businessDescription,
      location: producer.location,
      verificationStatus: producer.verificationStatus,
      verificationSubmittedAt: producer.user.registrationDate,
      businessLicense: producer.businessLicense,
      taxId: producer.taxId,
      rejectionReason: producer.rejectionReason,
      verifiedAt: producer.verifiedAt,
      verifiedBy: producer.verifiedBy,
      documents: producer.documents.map(doc => ({
        id: doc.id,
        type: doc.type,
        url: doc.url,
        filename: doc.filename,
        uploadedAt: doc.uploadedAt,
        fileSize: doc.fileSize
      })),
      products: producer.products
    }));

    res.json({
      status: 'success',
      data: {
        producers: transformedProducers
      }
    });

  } catch (error) {
    console.error('Get all producers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get producers'
    });
  }
});

// ==================== ADMIN OVERVIEW (For Dashboard) ====================
router.get('/overview', async (req, res) => {
  try {
    const { range = 'today' } = req.query;

    const result = await adminService.getEnhancedOverview(range);

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
    console.error('Admin overview error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get admin overview'
    });
  }
});

// ==================== PRODUCT MANAGEMENT ====================

// Get all products with admin filters
router.get('/products', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      search = '',
      producerId,
      verificationStatus,
      minPrice,
      maxPrice,
      sortBy = 'listingDate',
      sortOrder = 'desc'
    } = req.query;

    const result = await adminService.getAdminProducts({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      category,
      search,
      producerId,
      verificationStatus,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sortBy,
      sortOrder
    });

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
    console.error('Admin get products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get products'
    });
  }
});

// Get product statistics
router.get('/products/stats', async (req, res) => {
  try {
    const result = await adminService.getProductStats();

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
    console.error('Admin product stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get product statistics'
    });
  }
});

// Update product status (approve, reject, activate, deactivate)
router.patch('/products/:productId/status', async (req, res) => {
  try {
    const { productId } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user.id;

    const validStatuses = ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'PENDING_REVIEW', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await adminService.updateProductStatus(productId, status, adminId, reason);

    if (result.success) {
      res.json({
        status: 'success',
        message: `Product ${status.toLowerCase()} successfully`,
        data: result.data
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Admin update product status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update product status'
    });
  }
});

// Bulk product actions
router.post('/products/bulk-actions', async (req, res) => {
  try {
    const { productIds, action, reason } = req.body;
    const adminId = req.user.id;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Product IDs are required and must be an array'
      });
    }

    const validActions = ['activate', 'deactivate', 'approve', 'reject', 'delete'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid action. Must be one of: ${validActions.join(', ')}`
      });
    }

    const result = await adminService.bulkProductActions(productIds, action, adminId, reason);

    if (result.success) {
      res.json({
        status: 'success',
        message: `Bulk action completed: ${result.data.processed} products ${action}ed`,
        data: result.data
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Admin bulk product actions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to perform bulk actions'
    });
  }
});

// Get product detail for admin
router.get('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await adminService.getAdminProductDetail(productId);

    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Admin get product detail error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get product details'
    });
  }
});

// ==================== DELETE PRODUCT ====================
router.delete('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const adminId = req.user.id;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        producer: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        orderItems: {
          select: { id: true }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Check if product has orders
    if (product.orderItems && product.orderItems.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete product with existing orders. Please deactivate the product instead.',
        data: {
          orderCount: product.orderItems.length
        }
      });
    }

    // Use transaction to safely delete related records
    await prisma.$transaction(async (tx) => {
      // Delete IPFS file associations first
      await tx.iPFSMetadata.updateMany({
        where: { productId },
        data: { productId: null }
      });

      // Delete the product
      await tx.product.delete({
        where: { id: productId }
      });
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'PRODUCT_DELETED',
        entity: 'PRODUCT',
        entityId: productId,
        userId: adminId,
        oldValues: {
          name: product.name,
          price: product.price,
          status: product.status
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // Create notification for producer
    const notificationService = require('./notificationService');
    await notificationService.createNotification(
      product.producer.userId,
      `Your product "${product.name}" has been deleted by an administrator.`,
      'SYSTEM'
    );

    res.json({
      status: 'success',
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Admin delete product error:', error);

    res.status(500).json({
      status: 'error',
      message: 'Failed to delete product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get products needing review (pending approval)
router.get('/products/pending-review', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await adminService.getPendingReviewProducts(
      parseInt(page),
      parseInt(limit)
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
    console.error('Admin get pending review products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get pending review products'
    });
  }
});

// ==================== ORDER MANAGEMENT ====================

// Get all orders with admin filters
router.get('/orders', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      paymentStatus,
      deliveryStatus,
      search = '',
      dateFrom,
      dateTo,
      buyerId,
      producerId,
      minAmount,
      maxAmount,
      sortBy = 'orderDate',
      sortOrder = 'desc'
    } = req.query;

    const result = await adminService.getAdminOrders({
      page: parseInt(page),
      limit: parseInt(limit),
      paymentStatus,
      deliveryStatus,
      search,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      buyerId,
      producerId,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      sortBy,
      sortOrder
    });

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

// Get order statistics
router.get('/orders/stats', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query; // daily, weekly, monthly, yearly

    const result = await adminService.getOrderStats(period);

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
    console.error('Admin order stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get order statistics'
    });
  }
});

// Get order detail for admin
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await adminService.getAdminOrderDetail(orderId);

    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Admin get order detail error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get order details'
    });
  }
});

// Update order status (admin override)
router.patch('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user.id;

    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await adminService.updateOrderStatus(orderId, status, adminId, reason);

    if (result.success) {
      res.json({
        status: 'success',
        message: `Order status updated to ${status}`,
        data: result.data
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Admin update order status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update order status'
    });
  }
});

// Cancel order (admin override)
router.post('/orders/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const result = await adminService.cancelOrder(orderId, adminId, reason);

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Order cancelled successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Admin cancel order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel order'
    });
  }
});

// Bulk order actions
router.post('/orders/bulk-actions', async (req, res) => {
  try {
    const { orderIds, action, reason } = req.body;
    const adminId = req.user.id;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Order IDs are required and must be an array'
      });
    }

    const validActions = ['cancel', 'mark_shipped', 'mark_delivered'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid action. Must be one of: ${validActions.join(', ')}`
      });
    }

    const result = await adminService.bulkOrderActions(orderIds, action, adminId, reason);

    if (result.success) {
      res.json({
        status: 'success',
        message: `Bulk action completed: ${result.data.processed} orders processed`,
        data: result.data
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Admin bulk order actions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to perform bulk actions'
    });
  }
});

// Get revenue analytics
router.get('/analytics/revenue', async (req, res) => {
  try {
    const { period = 'monthly', months = 12 } = req.query;

    const result = await adminService.getRevenueAnalytics(period, parseInt(months));

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
    console.error('Admin revenue analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get revenue analytics'
    });
  }
});

// Get orders requiring attention
router.get('/orders/attention-required', async (req, res) => {
  try {
    const result = await adminService.getOrdersRequiringAttention();

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
    console.error('Admin get attention required orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get orders requiring attention'
    });
  }
});

// Helper function to map action to display text
function mapActionToText(action) {
  const actionMap = {
    'USER_REGISTERED': 'New user registered',
    'PRODUCT_CREATED': 'Product created',
    'DISPUTE_RESOLVED': 'Dispute resolved',
    'PAYMENT_CONFIRMED': 'Payment confirmed',
    'ORDER_CREATED': 'New order placed'
  };
  return actionMap[action] || action;
}

// Helper function to map action to type
function mapActionToType(action) {
  const typeMap = {
    'USER_REGISTERED': 'USER_REGISTERED',
    'PRODUCT_CREATED': 'PRODUCT_APPROVED',
    'DISPUTE_RESOLVED': 'DISPUTE_RESOLVED',
    'PAYMENT_CONFIRMED': 'PAYMENT_VERIFIED',
    'ORDER_CREATED': 'ORDER_CREATED'
  };
  return typeMap[action] || 'USER_REGISTERED';
}

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

// ==================== PAYOUT SCHEDULING ====================

// Schedule a payout
router.put('/payouts/:payoutId/schedule', async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { scheduledFor } = req.body;

    if (!scheduledFor) {
      return res.status(400).json({
        status: 'error',
        message: 'Schedule date is required'
      });
    }

    const payout = await prisma.producerPayout.update({
      where: { id: payoutId },
      data: {
        scheduledFor: new Date(scheduledFor),
        status: 'SCHEDULED',
        updatedAt: new Date()
      },
      include: {
        producer: {
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
    });

    // Create notification for producer
    await prisma.notification.create({
      data: {
        userId: payout.producer.user.id,
        type: 'GENERAL',
        message: `Your payout of ${payout.netAmount} ETB has been scheduled for ${new Date(scheduledFor).toLocaleDateString()}.`,
        status: 'UNREAD'
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'SCHEDULE_PAYOUT',
        entity: 'ProducerPayout',
        entityId: payoutId,
        userId: req.user.id,
        newValues: {
          scheduledFor: scheduledFor,
          status: 'SCHEDULED',
          producerName: payout.producer.user.name,
          amount: payout.netAmount
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Payout scheduled successfully',
      payout
    });

  } catch (error) {
    console.error('Schedule payout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to schedule payout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== BANK ACCOUNT MANAGEMENT ====================

// Get producer bank accounts (for admin to view)
router.get('/producer/:producerId/bank-accounts', async (req, res) => {
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
      message: 'Failed to get bank accounts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify producer bank account
router.put('/bank-accounts/:accountId/verify', async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await prisma.producerBankAccount.update({
      where: { id: accountId },
      data: {
        isVerified: true,
        updatedAt: new Date()
      },
      include: {
        producer: {
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
    });

    // Create notification for producer
    await prisma.notification.create({
      data: {
        userId: account.producer.user.id,
        type: 'GENERAL',
        message: `Your ${account.bankName} account has been verified and is ready for payouts.`,
        status: 'UNREAD'
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'VERIFY_BANK_ACCOUNT',
        entity: 'ProducerBankAccount',
        entityId: accountId,
        userId: req.user.id,
        newValues: {
          isVerified: true,
          bankName: account.bankName,
          producerName: account.producer.user.name
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Bank account verified successfully',
      account
    });

  } catch (error) {
    console.error('Verify bank account error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify bank account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Reject producer bank account
router.put('/bank-accounts/:accountId/reject', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Rejection reason is required'
      });
    }

    const account = await prisma.producerBankAccount.update({
      where: { id: accountId },
      data: {
        isVerified: false,
        updatedAt: new Date()
      },
      include: {
        producer: {
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
    });

    // Create notification for producer
    await prisma.notification.create({
      data: {
        userId: account.producer.user.id,
        type: 'GENERAL',
        message: `Your ${account.bankName} account verification was rejected. Reason: ${reason}`,
        status: 'UNREAD'
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'REJECT_BANK_ACCOUNT',
        entity: 'ProducerBankAccount',
        entityId: accountId,
        userId: req.user.id,
        newValues: {
          isVerified: false,
          reason: reason,
          bankName: account.bankName,
          producerName: account.producer.user.name
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Bank account rejected',
      account
    });

  } catch (error) {
    console.error('Reject bank account error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject bank account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;