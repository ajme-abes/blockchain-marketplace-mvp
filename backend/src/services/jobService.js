const { prisma } = require('../config/database');
const notificationService = require('./notificationService');

class JobService {
  constructor() {
    this.jobs = new Map();
  }

  // Clean expired sessions (run daily)
  async cleanExpiredSessions() {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isValid: false }
          ]
        }
      });

      console.log(`🧹 Cleaned ${result.count} expired sessions`);
      
      return {
        success: true,
        cleanedCount: result.count
      };
    } catch (error) {
      console.error('Session cleanup error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send daily summary to admins
  async sendDailySummary() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [newUsers, newOrders, totalRevenue] = await Promise.all([
        // New users today
        prisma.user.count({
          where: {
            registrationDate: {
              gte: today
            }
          }
        }),
        
        // New orders today
        prisma.order.count({
          where: {
            orderDate: {
              gte: today
            }
          }
        }),
        
        // Revenue today
        prisma.order.aggregate({
          where: {
            orderDate: {
              gte: today
            },
            paymentStatus: 'CONFIRMED'
          },
          _sum: {
            totalAmount: true
          }
        })
      ]);

      const revenue = totalRevenue._sum.totalAmount || 0;
      
      // Get admin users
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });

      // Send notifications to all admins
      const message = `📊 Daily Summary: ${newUsers} new users, ${newOrders} new orders, Revenue: ETB ${revenue.toFixed(2)}`;
      
      for (const admin of admins) {
        await notificationService.createNotification(
          admin.id,
          message,
          'SYSTEM'
        );
      }

      console.log(`📨 Sent daily summary to ${admins.length} admins`);
      
      return {
        success: true,
        summary: { newUsers, newOrders, revenue }
      };
    } catch (error) {
      console.error('Daily summary error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update product status based on inventory
  async updateProductStatuses() {
    try {
      // Mark out of stock products
      const outOfStockResult = await prisma.product.updateMany({
        where: {
          quantityAvailable: 0,
          status: { not: 'OUT_OF_STOCK' }
        },
        data: {
          status: 'OUT_OF_STOCK'
        }
      });

      // Reactivate products with inventory
      const reactivatedResult = await prisma.product.updateMany({
        where: {
          quantityAvailable: { gt: 0 },
          status: 'OUT_OF_STOCK'
        },
        data: {
          status: 'ACTIVE'
        }
      });

      console.log(`🔄 Updated ${outOfStockResult.count} to OUT_OF_STOCK, ${reactivatedResult.count} to ACTIVE`);
      
      return {
        success: true,
        outOfStock: outOfStockResult.count,
        reactivated: reactivatedResult.count
      };
    } catch (error) {
      console.error('Product status update error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Start background jobs
  startJobs() {
    // Clean expired sessions every hour
    this.jobs.set('sessionCleanup', setInterval(() => {
      this.cleanExpiredSessions();
    }, 60 * 60 * 1000)); // 1 hour

    // Send daily summary at 8 AM
    this.jobs.set('dailySummary', setInterval(() => {
      const now = new Date();
      if (now.getHours() === 8 && now.getMinutes() === 0) {
        this.sendDailySummary();
      }
    }, 60 * 1000)); // Check every minute

    // Update product status every 30 minutes
    this.jobs.set('productStatus', setInterval(() => {
      this.updateProductStatuses();
    }, 30 * 60 * 1000)); // 30 minutes

    console.log('🚀 Background jobs started');
  }

  // Stop all jobs
  stopJobs() {
    this.jobs.forEach((interval, name) => {
      clearInterval(interval);
      console.log(`🛑 Stopped job: ${name}`);
    });
    this.jobs.clear();
  }
}

module.exports = new JobService();