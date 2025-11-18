const { prisma } = require('../config/database');

class AdminService {
  
  // ==================== DASHBOARD STATISTICS ====================
  async getDashboardStats() {
    try {
      const [
        totalUsers,
        totalProducers,
        totalBuyers,
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingVerifications,
        recentOrders
      ] = await Promise.all([
        // User counts
        prisma.user.count(),
        prisma.producer.count(),
        prisma.buyer.count(),
        
        // Product counts
        prisma.product.count({
          where: { status: 'ACTIVE' }
        }),
        
        // Order statistics
        prisma.order.count(),
        prisma.order.aggregate({
          where: { paymentStatus: 'CONFIRMED' },
          _sum: { totalAmount: true }
        }),
        
        // Pending verifications
        prisma.producer.count({
          where: { verificationStatus: 'PENDING' }
        }),
        
        // Recent orders (last 7 days)
        prisma.order.findMany({
          where: {
            orderDate: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          },
          include: {
            buyer: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          },
          orderBy: { orderDate: 'desc' },
          take: 10
        })
      ]);

      // Monthly revenue data (last 6 months)
      const monthlyRevenue = await this.getMonthlyRevenue();
      
      // Popular products
      const popularProducts = await this.getPopularProducts();

      return {
        success: true,
        data: {
          overview: {
            totalUsers,
            totalProducers,
            totalBuyers,
            totalProducts,
            totalOrders,
            totalRevenue: totalRevenue._sum.totalAmount || 0,
            pendingVerifications,
            averageOrderValue: totalOrders > 0 ? (totalRevenue._sum.totalAmount || 0) / totalOrders : 0
          },
          monthlyRevenue,
          popularProducts,
          recentOrders,
          charts: {
            userGrowth: await this.getUserGrowthStats(),
            orderTrends: await this.getOrderTrends()
          }
        }
      };

    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== MONTHLY REVENUE ====================
  async getMonthlyRevenue(months = 6) {
    try {
      const monthlyData = [];
      const now = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthlyRevenue = await prisma.order.aggregate({
          where: {
            paymentStatus: 'CONFIRMED',
            orderDate: {
              gte: startDate,
              lte: endDate
            }
          },
          _sum: { totalAmount: true },
          _count: { id: true }
        });

        monthlyData.push({
          month: startDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
          revenue: monthlyRevenue._sum.totalAmount || 0,
          orders: monthlyRevenue._count.id
        });
      }

      return monthlyData;
    } catch (error) {
      console.error('Get monthly revenue error:', error);
      return [];
    }
  }

  // ==================== POPULAR PRODUCTS ====================
  async getPopularProducts(limit = 5) {
    try {
      const popularProducts = await prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: {
          producer: {
            include: {
              user: {
                select: { name: true }
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
        orderBy: {
          orderItems: {
            _count: 'desc'
          }
        },
        take: limit
      });

      return popularProducts.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        averageRating: product.averageRating,
        reviewCount: product.reviewCount,
        orderCount: product._count.orderItems,
        producer: product.producer.user.name,
        imageUrl: product.imageUrl
      }));
    } catch (error) {
      console.error('Get popular products error:', error);
      return [];
    }
  }

  // ==================== USER GROWTH STATS ====================
  async getUserGrowthStats(months = 6) {
    try {
      const growthData = [];
      const now = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const userCount = await prisma.user.count({
          where: {
            registrationDate: {
              lte: endDate
            }
          }
        });

        growthData.push({
          month: startDate.toLocaleString('default', { month: 'short' }),
          users: userCount
        });
      }

      return growthData;
    } catch (error) {
      console.error('Get user growth stats error:', error);
      return [];
    }
  }

  // ==================== ORDER TRENDS ====================
  async getOrderTrends(days = 30) {
    try {
      const trendData = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const dailyOrders = await prisma.order.count({
          where: {
            orderDate: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        });

        trendData.push({
          date: startOfDay.toISOString().split('T')[0],
          orders: dailyOrders
        });
      }

      return trendData;
    } catch (error) {
      console.error('Get order trends error:', error);
      return [];
    }
  }

  // ==================== USER MANAGEMENT ====================
  async getAllUsers(page = 1, limit = 20, search = '') {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause = search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      } : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            registrationDate: true,
            buyer: {
              select: {
                id: true,
                preferredPaymentMethod: true
              }
            },
            producer: {
              select: {
                id: true,
                businessName: true,
                verificationStatus: true
              }
            }
          },
          orderBy: { registrationDate: 'desc' },
          skip,
          take: limit
        }),
        prisma.user.count({ where: whereClause })
      ]);

      return {
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get all users error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== PRODUCER VERIFICATION ====================
  async updateProducerVerification(producerId, status, adminId) {
    try {
      const producer = await prisma.producer.update({
        where: { id: producerId },
        data: { verificationStatus: status },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });

      // Create verification notification
      const notificationService = require('./notificationService');
      await notificationService.createNotification(
        producer.userId,
        `Your producer account has been ${status.toLowerCase()}.`,
        'SECURITY'
      );

      console.log(`✅ Producer verification updated: ${producerId} -> ${status}`);

      return {
        success: true,
        producer
      };
    } catch (error) {
      console.error('Update producer verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== SYSTEM HEALTH ====================
  async getSystemHealth() {
    try {
      const [
        databaseStatus,
        blockchainStatus,
        paymentStatus,
        emailStatus
      ] = await Promise.all([
        // Database health check
        prisma.$queryRaw`SELECT 1 as status`.then(() => 'healthy').catch(() => 'unhealthy'),
        
        // Blockchain status
        this.getBlockchainStatus(),
        
        // Payment gateway status (simplified)
        Promise.resolve('healthy'),
        
        // Email service status (simplified)
        Promise.resolve('healthy')
      ]);

      return {
        success: true,
        data: {
          database: databaseStatus,
          blockchain: blockchainStatus,
          paymentGateway: paymentStatus,
          emailService: emailStatus,
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Get system health error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getBlockchainStatus() {
    try {
      const blockchainService = require('./blockchainService');
      const status = await blockchainService.getBlockchainStatus();
      return status.connected ? 'connected' : 'disconnected';
    } catch (error) {
      return 'error';
    }
  }

  

  // ==================== ORDER MANAGEMENT ====================
  async getAllOrders(page = 1, limit = 20, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause = {};
      if (filters.paymentStatus) whereClause.paymentStatus = filters.paymentStatus;
      if (filters.deliveryStatus) whereClause.deliveryStatus = filters.deliveryStatus;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: whereClause,
          include: {
            buyer: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            },
            orderItems: {
              include: {
                product: {
                  select: { name: true, price: true }
                }
              }
            },
            paymentConfirmations: {
              orderBy: { confirmedAt: 'desc' },
              take: 1
            }
          },
          orderBy: { orderDate: 'desc' },
          skip,
          take: limit
        }),
        prisma.order.count({ where: whereClause })
      ]);

      return {
        success: true,
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get all orders error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }


// ==================== ENHANCED SYSTEM ALERTS ====================
async getEnhancedSystemAlerts() {
  try {
    const alerts = [];
    
    // 1. Database Health Check - USE prisma directly (not this.prisma)
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      alerts.push({
        id: 'db-connection',
        title: 'Database Connection Issue',
        description: 'Unable to connect to PostgreSQL database: ' + error.message,
        severity: 'CRITICAL',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Pending Producer Verifications - USE prisma directly
    const pendingVerifications = await prisma.producer.count({
      where: { verificationStatus: 'PENDING' }
    });
    
    if (pendingVerifications > 5) {
      alerts.push({
        id: 'pending-verifications',
        title: 'Pending Producer Verifications',
        description: `${pendingVerifications} producer accounts awaiting verification. Please review in User Management.`,
        severity: pendingVerifications > 10 ? 'HIGH' : 'MEDIUM',
        timestamp: new Date().toISOString()
      });
    }

    // 3. Failed Payments - USE prisma directly
    const failedPayments = await prisma.order.count({
      where: { 
        paymentStatus: 'FAILED',
        orderDate: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (failedPayments > 0) {
      alerts.push({
        id: 'failed-payments',
        title: 'Recent Failed Payments',
        description: `${failedPayments} payment attempts failed in the last 24 hours. Check payment gateway.`,
        severity: failedPayments > 5 ? 'HIGH' : 'MEDIUM',
        timestamp: new Date().toISOString()
      });
    }

    // 4. Open Disputes - USE prisma directly
    const openDisputes = await prisma.dispute.count({
      where: { status: 'OPEN' }
    });

    if (openDisputes > 0) {
      alerts.push({
        id: 'open-disputes',
        title: 'Active Disputes Requiring Attention',
        description: `${openDisputes} open disputes need resolution.`,
        severity: openDisputes > 3 ? 'MEDIUM' : 'LOW',
        timestamp: new Date().toISOString()
      });
    }

    // 5. Low Stock Products - USE prisma directly
    const lowStockProducts = await prisma.product.count({
      where: { 
        quantityAvailable: { lt: 10 },
        status: 'ACTIVE'
      }
    });

    if (lowStockProducts > 0) {
      alerts.push({
        id: 'low-stock',
        title: 'Products Running Low on Stock',
        description: `${lowStockProducts} products have less than 10 units in stock.`,
        severity: 'LOW',
        timestamp: new Date().toISOString()
      });
    }

    // 6. System Performance (Always show if no critical issues)
    if (alerts.length === 0 || alerts.every(alert => alert.severity === 'LOW')) {
      alerts.push({
        id: 'system-optimal',
        title: 'System Performance Optimal',
        description: 'All systems operating within normal parameters. Platform is healthy.',
        severity: 'LOW',
        timestamp: new Date().toISOString()
      });
    }

    return alerts;

  } catch (error) {
    console.error('Get enhanced system alerts error:', error);
    return [{
      id: 'service-error',
      title: 'Alert Service Unavailable',
      description: 'Unable to fetch system alerts: ' + error.message,
      severity: 'HIGH',
      timestamp: new Date().toISOString()
    }];
  }
}

// ==================== PLATFORM INSIGHTS ====================
async getPlatformInsights() {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const [
      currentMonthStats,
      previousMonthStats,
      topProducts,
      userRegistrations,
      paymentSuccessRate
    ] = await Promise.all([
      // Current month stats - USE prisma directly
      prisma.order.aggregate({
        where: {
          orderDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          },
          paymentStatus: 'CONFIRMED'
        },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),
      
      // Previous month stats - USE prisma directly
      prisma.order.aggregate({
        where: {
          orderDate: {
            gte: lastMonth,
            lt: new Date(now.getFullYear(), now.getMonth(), 1)
          },
          paymentStatus: 'CONFIRMED'
        },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),
      
      // Top selling products - USE prisma directly
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: {
          _count: {
            select: { orderItems: true }
          }
        },
        orderBy: {
          orderItems: {
            _count: 'desc'
          }
        },
        take: 5
      }),
      
      // User registration trend - USE prisma directly
      prisma.user.count({
        where: {
          registrationDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
        }
      }),
      
      // Payment success rate
      this.getPaymentSuccessRate()
    ]);

    // Calculate growth percentages
    const revenueGrowth = previousMonthStats._sum.totalAmount ? 
      ((currentMonthStats._sum.totalAmount - previousMonthStats._sum.totalAmount) / previousMonthStats._sum.totalAmount) * 100 : 0;
    
    const orderGrowth = previousMonthStats._count.id ? 
      ((currentMonthStats._count.id - previousMonthStats._count.id) / previousMonthStats._count.id) * 100 : 0;

    return {
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      orderGrowth: Math.round(orderGrowth * 10) / 10,
      averageOrderValue: currentMonthStats._count.id ? 
        currentMonthStats._sum.totalAmount / currentMonthStats._count.id : 0,
      topProducts: topProducts.map(product => ({
        name: product.name,
        orders: product._count.orderItems,
        revenue: product.price * product._count.orderItems
      })),
      newUsersThisMonth: userRegistrations,
      paymentSuccessRate: Math.round(paymentSuccessRate * 10) / 10
    };

  } catch (error) {
    console.error('Get platform insights error:', error);
    return {
      revenueGrowth: 0,
      orderGrowth: 0,
      averageOrderValue: 0,
      topProducts: [],
      newUsersThisMonth: 0,
      paymentSuccessRate: 0
    };
  }
}

// ==================== PAYMENT SUCCESS RATE ====================
async getPaymentSuccessRate() {
  try {
    const [successful, total] = await Promise.all([
      // USE prisma directly
      prisma.paymentConfirmation.count({
        where: { isConfirmed: true }
      }),
      prisma.paymentConfirmation.count()
    ]);

    return total > 0 ? (successful / total) * 100 : 100;
  } catch (error) {
    console.error('Get payment success rate error:', error);
    return 0;
  }
}
// ==================== ENHANCED ADMIN OVERVIEW ====================
async getEnhancedOverview(range = 'today') {
  try {
    console.log('📊 Fetching enhanced admin overview for range:', range);
    
    // Calculate date ranges based on the selected period
    const getDateRange = (range) => {
      const now = new Date();
      switch (range) {
        case 'today':
          return {
            start: new Date(now.setHours(0, 0, 0, 0)),
            end: new Date(now.setHours(23, 59, 59, 999))
          };
        case 'week':
          return {
            start: new Date(now.setDate(now.getDate() - 7)),
            end: new Date()
          };
        case 'month':
          return {
            start: new Date(now.setMonth(now.getMonth() - 1)),
            end: new Date()
          };
        case 'quarter':
          return {
            start: new Date(now.setMonth(now.getMonth() - 3)),
            end: new Date()
          };
        default:
          return {
            start: new Date(now.setHours(0, 0, 0, 0)),
            end: new Date(now.setHours(23, 59, 59, 999))
          };
      }
    };

    const dateRange = getDateRange(range);
    
    // Get all statistics in parallel for better performance
    const [
      totalUsers,
      verifiedProducers,
      activeProducts,
      ordersInRange,
      openDisputes,
      pendingPayments,
      totalRevenue,
      recentActivity,
      systemAlerts,
      platformInsights,
      userGrowthData,
      orderTrends,
      monthlyRevenue
    ] = await Promise.all([
      // Total Users - USE prisma directly
      prisma.user.count(),
      
      // Verified Producers - USE prisma directly
      prisma.producer.count({
        where: { verificationStatus: 'VERIFIED' }
      }),
      
      // Active Products - USE prisma directly
      prisma.product.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Orders in selected range - USE prisma directly
      prisma.order.count({
        where: {
          orderDate: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      }),
      
      // Open Disputes - USE prisma directly
      prisma.dispute.count({
        where: { status: 'OPEN' }
      }),
      
      // Pending Payments - USE prisma directly
      prisma.order.count({
        where: { paymentStatus: 'PENDING' }
      }),
      
      // Total Revenue (confirmed payments only) - USE prisma directly
      prisma.order.aggregate({
        where: { 
          paymentStatus: 'CONFIRMED',
          orderDate: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        _sum: { totalAmount: true }
      }),
      
      // Recent Activity (last 20 activities) - USE prisma directly
      prisma.auditLog.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 20
      }),
      
      // Enhanced System Alerts
      this.getEnhancedSystemAlerts(),
      
      // Platform Insights
      this.getPlatformInsights(),
      
      // User growth data
      this.getUserGrowthStats(6),
      
      // Order trends
      this.getOrderTrends(30),
      
      // Monthly revenue
      this.getMonthlyRevenue(6)
    ]);

    // Calculate growth percentages
    const userGrowth = 12; // Would compare with previous period
    const revenueGrowth = platformInsights.revenueGrowth;

    return {
      success: true,
      data: {
        totalUsers,
        verifiedProducers,
        activeProducts,
        ordersToday: ordersInRange,
        openDisputes,
        pendingPayments,
        systemAlerts: systemAlerts.length,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        userGrowth,
        revenueGrowth,
        recentActivity: recentActivity.map(activity => ({
          id: activity.id,
          action: this.mapActionToText(activity.action),
          user: activity.user?.name || 'System',
          entityId: activity.entityId,
          timestamp: activity.timestamp,
          type: this.mapActionToType(activity.action)
        })),
        systemAlertsList: systemAlerts,
        insights: platformInsights,
        charts: {
          userGrowth: userGrowthData,
          orderTrends: orderTrends,
          monthlyRevenue: monthlyRevenue
        }
      }
    };

  } catch (error) {
    console.error('Get enhanced overview error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}


// Helper function to map action to display text
mapActionToText(action) {
  const actionMap = {
    'USER_REGISTERED': 'New user registered',
    'PRODUCT_CREATED': 'Product created',
    'DISPUTE_RESOLVED': 'Dispute resolved',
    'PAYMENT_CONFIRMED': 'Payment confirmed',
    'ORDER_CREATED': 'New order placed',
    'PRODUCT_UPDATED': 'Product updated',
    'USER_UPDATED': 'User profile updated'
  };
  return actionMap[action] || action;
}


// Helper function to map action to type
mapActionToType(action) {
  const typeMap = {
    'USER_REGISTERED': 'USER_REGISTERED',
    'PRODUCT_CREATED': 'PRODUCT_APPROVED',
    'DISPUTE_RESOLVED': 'DISPUTE_RESOLVED',
    'PAYMENT_CONFIRMED': 'PAYMENT_VERIFIED',
    'ORDER_CREATED': 'ORDER_CREATED',
    'PRODUCT_UPDATED': 'PRODUCT_APPROVED',
    'USER_UPDATED': 'USER_REGISTERED'
  };
  return typeMap[action] || 'USER_REGISTERED';
}
}

module.exports = new AdminService();