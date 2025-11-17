const { prisma } = require('../config/database');

class TransactionService {
  // Get buyer transaction history
  async getBuyerTransactions(buyerId, filters = {}) {
    try {
      const { page = 1, limit = 10, startDate, endDate, status } = filters;
      const skip = (page - 1) * limit;

      const where = {
        buyerId,
        ...(startDate && endDate && {
          orderDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }),
        ...(status && { paymentStatus: status })
      };

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            orderItems: {
              include: {
                product: {
                  include: {
                    producer: {
                      include: {
                        user: {
                          select: {
                            name: true,
                            email: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            paymentConfirmations: {
              orderBy: { confirmedAt: 'desc' },
              take: 1
            },
            blockchainRecords: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          },
          orderBy: { orderDate: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.order.count({ where })
      ]);

      // Format transactions
      const transactions = await Promise.all(
        orders.map(async (order) => {
          // Get blockchain status using the same logic as OrderDetail
          const blockchainStatus = await this.getTransactionBlockchainStatus(order.id);
  
          return {
            id: `TXN-${order.id.slice(-8)}`,
            orderId: order.id,
            type: 'purchase',
            amount: order.totalAmount,
            status: order.paymentStatus.toLowerCase(),
            date: order.orderDate,
            items: order.orderItems.map(item => ({
              product: item.product.name,
              producer: item.product.producer.user.name,
              quantity: item.quantity,
              price: item.price
            })),
            paymentMethod: order.paymentConfirmations[0]?.confirmationMethod || 'PENDING',
            // Use the same blockchain data structure as OrderDetail
            blockchainTxHash: order.blockchainTxHash,
            blockchainRecorded: order.blockchainRecorded,
            blockchainStatus: blockchainStatus,
            confirmedAt: order.paymentConfirmations[0]?.confirmedAt
          };
        })
      );
  

      // Calculate statistics
      const stats = {
        totalSpent: orders
          .filter(o => o.paymentStatus === 'CONFIRMED')
          .reduce((sum, o) => sum + o.totalAmount, 0),
        totalOrders: total,
        completedOrders: orders.filter(o => o.paymentStatus === 'CONFIRMED').length,
        pendingOrders: orders.filter(o => o.paymentStatus === 'PENDING').length
      };

      return {
        transactions,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      };

    } catch (error) {
      console.error('Get buyer transactions error:', error);
      throw new Error('Failed to fetch buyer transactions');
    }
  }
  async getBlockchainTransactionDetails(orderId) {
    try {
      console.log('🔗 Fetching blockchain details for order:', orderId);
      
      const blockchainService = require('./blockchainService');
      
      // Get order with blockchain records
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          blockchainRecords: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      });
  
      if (!order || !order.blockchainRecords.length) {
        return {
          success: false,
          error: 'No blockchain record found'
        };
      }
  
      const blockchainRecord = order.blockchainRecords[0];
      
      // Verify the transaction on blockchain
      const verification = await blockchainService.verifyTransaction(blockchainRecord.txHash);
      
      return {
        success: true,
        blockchainRecord,
        verification
      };
  
    } catch (error) {
      console.error('Get blockchain details error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async getTransactionBlockchainStatus(orderId) {
    try {
      console.log('🔗 Checking blockchain status for order:', orderId);
      
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          blockchainTxHash: true,
          blockchainRecorded: true,
          paymentStatus: true
        }
      });
  
      if (!order) {
        return {
          verified: false,
          status: 'order_not_found'
        };
      }
  
      // Use the same logic as OrderDetail
      if (order.blockchainTxHash && order.blockchainRecorded) {
        return {
          verified: true,
          txHash: order.blockchainTxHash,
          status: 'verified',
          explorerUrl: `https://amoy.polygonscan.com/tx/${order.blockchainTxHash}`
        };
      } else if (order.paymentStatus === 'CONFIRMED') {
        return {
          verified: false,
          status: 'pending_verification',
          message: 'Payment confirmed, awaiting blockchain recording'
        };
      } else {
        return {
          verified: false,
          status: 'payment_pending',
          message: 'Awaiting payment confirmation'
        };
      }
  
    } catch (error) {
      console.error('Get blockchain status error:', error);
      return {
        verified: false,
        status: 'error',
        error: error.message
      };
    }
  }
  

  // Get producer sales history
  async getProducerTransactions(producerId, filters = {}) {
    try {
      const { page = 1, limit = 10, startDate, endDate, status } = filters;
      const skip = (page - 1) * limit;

      // Get producer's product IDs
      const producer = await prisma.producer.findUnique({
        where: { id: producerId },
        include: {
          products: {
            select: { id: true }
          }
        }
      });

      if (!producer) {
        throw new Error('Producer not found');
      }

      const productIds = producer.products.map(p => p.id);

      const where = {
        orderItems: {
          some: {
            productId: { in: productIds }
          }
        },
        ...(startDate && endDate && {
          orderDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }),
        ...(status && { paymentStatus: status })
      };

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            buyer: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            },
            orderItems: {
              where: {
                productId: { in: productIds }
              },
              include: {
                product: true
              }
            },
            paymentConfirmations: {
              orderBy: { confirmedAt: 'desc' },
              take: 1
            },
            blockchainRecords: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          },
          orderBy: { orderDate: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.order.count({ where })
      ]);

      // Format sales transactions
      const transactions = await Promise.all(
        orders.map(async (order) => {
          const producerItems = order.orderItems.filter(item => 
            productIds.includes(item.productId)
          );
          
          const totalAmount = producerItems.reduce((sum, item) => sum + item.subtotal, 0);
          
          // Get blockchain status using the same logic as OrderDetail
          const blockchainStatus = await this.getTransactionBlockchainStatus(order.id);
  
          return {
            id: `TXN-${order.id.slice(-8)}`,
            orderId: order.id,
            buyerName: order.buyer.user.name,
            type: 'sale',
            amount: totalAmount,
            status: order.paymentStatus.toLowerCase(),
            date: order.orderDate,
            items: producerItems.map(item => ({
              product: item.product.name,
              quantity: item.quantity,
              price: item.price
            })),
            paymentMethod: order.paymentConfirmations[0]?.confirmationMethod || 'PENDING',
            // Use the same blockchain data structure as OrderDetail
            blockchainTxHash: order.blockchainTxHash,
            blockchainRecorded: order.blockchainRecorded,
            blockchainStatus: blockchainStatus,
            confirmedAt: order.paymentConfirmations[0]?.confirmedAt
          };
        })
      );
  
      // Calculate sales statistics
      const confirmedOrders = orders.filter(o => o.paymentStatus === 'CONFIRMED');
      const stats = {
        totalRevenue: confirmedOrders.reduce((sum, order) => {
          const producerItems = order.orderItems.filter(item => 
            productIds.includes(item.productId)
          );
          return sum + producerItems.reduce((itemSum, item) => itemSum + item.subtotal, 0);
        }, 0),
        totalSales: total,
        completedSales: confirmedOrders.length,
        pendingSales: orders.filter(o => o.paymentStatus === 'PENDING').length
      };

      return {
        transactions,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      };

    } catch (error) {
      console.error('Get producer transactions error:', error);
      throw new Error('Failed to fetch producer transactions');
    }
  }

  // Get sales analytics for producer
  async getSalesAnalytics(producerId, period = 'month') {
    try {
      // Get producer's product IDs
      const producer = await prisma.producer.findUnique({
        where: { id: producerId },
        include: {
          products: {
            select: { id: true }
          }
        }
      });

      if (!producer) {
        throw new Error('Producer not found');
      }

      const productIds = producer.products.map(p => p.id);

      // Calculate date range based on period
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(now.setMonth(now.getMonth() - 1));
      }

      const orders = await prisma.order.findMany({
        where: {
          orderItems: {
            some: {
              productId: { in: productIds }
            }
          },
          paymentStatus: 'CONFIRMED',
          orderDate: {
            gte: startDate
          }
        },
        include: {
          orderItems: {
            where: {
              productId: { in: productIds }
            },
            include: {
              product: true
            }
          }
        },
        orderBy: { orderDate: 'asc' }
      });

      // Calculate daily/weekly/monthly revenue
      const revenueData = {};
      orders.forEach(order => {
        const date = new Date(order.orderDate);
        let key;
        
        switch (period) {
          case 'week':
            key = date.toISOString().split('T')[0]; // Daily for week
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // Monthly
            break;
          case 'year':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // Monthly for year
            break;
          default:
            key = date.toISOString().split('T')[0];
        }

        const orderRevenue = order.orderItems.reduce((sum, item) => sum + item.subtotal, 0);
        
        if (!revenueData[key]) {
          revenueData[key] = 0;
        }
        revenueData[key] += orderRevenue;
      });

      // Product performance
      const productPerformance = {};
      orders.forEach(order => {
        order.orderItems.forEach(item => {
          if (!productPerformance[item.product.name]) {
            productPerformance[item.product.name] = {
              revenue: 0,
              quantity: 0
            };
          }
          productPerformance[item.product.name].revenue += item.subtotal;
          productPerformance[item.product.name].quantity += item.quantity;
        });
      });

      return {
        revenueData: Object.entries(revenueData).map(([date, revenue]) => ({ date, revenue })),
        productPerformance: Object.entries(productPerformance)
          .map(([product, data]) => ({
            product,
            revenue: data.revenue,
            quantity: data.quantity
          }))
          .sort((a, b) => b.revenue - a.revenue),
        totalRevenue: Object.values(revenueData).reduce((sum, revenue) => sum + revenue, 0),
        totalOrders: orders.length
      };

    } catch (error) {
      console.error('Get sales analytics error:', error);
      throw new Error('Failed to fetch sales analytics');
    }
  }
}

module.exports = new TransactionService();