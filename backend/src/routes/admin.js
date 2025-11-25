const express = require('express');
const { authenticateToken, requireRole, checkUserStatus  } = require('../middleware/auth');
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

    // Update producer verification status
    const producer = await prisma.producer.update({
      where: { id: producerId },
      data: { 
        verificationStatus: status 
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
      producer.userId,
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
      data: { producer }
    });

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

module.exports = router;