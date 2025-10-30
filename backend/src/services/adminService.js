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
}

module.exports = new AdminService();