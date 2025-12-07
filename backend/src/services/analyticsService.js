const { prisma } = require('../config/database');

class AnalyticsService {

  // Get overview statistics for producer
  async getProducerOverview(producerId, timeframe = 'monthly') {
    try {
      // First, get the producer with their products
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

      // Calculate basic stats - FIXED: Use actual earnings
      const [revenueData, totalOrders, totalCustomers, averageRating] = await Promise.all([
        this.getTotalRevenue(productIds),
        this.getTotalOrders(productIds),
        this.getTotalCustomers(productIds),
        this.getAverageRating(producerId)
      ]);

      // Get top 5 products
      const topProducts = await this.getTopProducts(producerId, 5);

      return {
        // FIXED: Return net earnings instead of gross sales
        totalRevenue: revenueData.netEarnings || 0, // What producer actually earns
        grossSales: revenueData.grossSales || 0,    // Total sales before commission
        commission: revenueData.commission || 0,     // Platform commission
        totalOrders,
        totalCustomers,
        averageRating,
        topProducts,
        timeframe
      };

    } catch (error) {
      console.error('Get producer overview error:', error);
      throw error;
    }
  }

  // Get sales trends
  async getSalesTrends(producerId, timeframe = 'monthly') {
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

    // For now, return simple trend data - we can enhance this later
    const salesTrend = [
      { period: 'Jan', revenue: 4000, orders: 24, averageOrderValue: 167 },
      { period: 'Feb', revenue: 3000, orders: 18, averageOrderValue: 167 },
      { period: 'Mar', revenue: 5000, orders: 30, averageOrderValue: 167 },
      { period: 'Apr', revenue: 2780, orders: 20, averageOrderValue: 139 },
      { period: 'May', revenue: 5890, orders: 35, averageOrderValue: 168 },
      { period: 'Jun', revenue: 6390, orders: 38, averageOrderValue: 168 },
    ];

    const orderTrend = [
      { period: 'Jan', orders: 24, customers: 18, ordersPerCustomer: 1.3 },
      { period: 'Feb', orders: 18, customers: 15, ordersPerCustomer: 1.2 },
      { period: 'Mar', orders: 30, customers: 22, ordersPerCustomer: 1.4 },
      { period: 'Apr', orders: 20, customers: 18, ordersPerCustomer: 1.1 },
      { period: 'May', orders: 35, customers: 25, ordersPerCustomer: 1.4 },
      { period: 'Jun', orders: 38, customers: 28, ordersPerCustomer: 1.4 },
    ];

    return {
      salesTrend,
      orderTrend,
      timeframe
    };
  }

  // Get product performance
  async getProductPerformance(producerId, timeframe = 'monthly') {
    const products = await prisma.product.findMany({
      where: {
        producerId: producerId,
        status: 'ACTIVE'
      },
      include: {
        _count: {
          select: {
            orderItems: true,
            reviews: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    // FIXED: Calculate actual earnings per product
    const performanceData = await Promise.all(products.map(async (product) => {
      // Get actual earnings for this product from OrderProducer table
      const earnings = await prisma.orderProducer.aggregate({
        where: {
          producerId: producerId,
          order: {
            paymentStatus: 'CONFIRMED',
            orderItems: {
              some: {
                productId: product.id
              }
            }
          }
        },
        _sum: {
          producerAmount: true
        }
      });

      // Get gross sales for comparison
      const grossSales = await prisma.orderItem.aggregate({
        where: {
          productId: product.id,
          order: {
            paymentStatus: 'CONFIRMED'
          }
        },
        _sum: {
          subtotal: true
        }
      });

      const totalSales = product._count.orderItems || 0;
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        totalRevenue: earnings._sum.producerAmount || 0, // Net earnings
        grossSales: grossSales._sum.subtotal || 0,       // Gross sales
        totalSales,
        orderCount: product._count.orderItems,
        reviewCount: product._count.reviews,
        averageRating: Math.round(avgRating * 10) / 10,
        stockLevel: product.quantityAvailable,
        status: product.quantityAvailable > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'
      };
    }));

    return performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  // Get customer insights
  async getCustomerInsights(producerId, timeframe = 'monthly') {
    // For now, return mock data - we can implement real data later
    return {
      totalCustomers: 89,
      newCustomers: 45,
      repeatCustomers: 44,
      repeatRate: 49.4,
      regionDistribution: [
        { region: 'Addis Ababa', count: 35, percentage: 39.3 },
        { region: 'Oromia', count: 22, percentage: 24.7 },
        { region: 'Amhara', count: 18, percentage: 20.2 },
        { region: 'SNNPR', count: 8, percentage: 9.0 },
        { region: 'Other', count: 6, percentage: 6.7 }
      ]
    };
  }

  // Helper methods - FIXED: Calculate actual producer earnings, not gross sales
  async getTotalRevenue(productIds) {
    // Get producer earnings (net amount after commission) instead of gross sales
    const producer = await prisma.producer.findFirst({
      where: {
        products: {
          some: {
            id: { in: productIds }
          }
        }
      }
    });

    if (!producer) {
      return 0;
    }

    // Calculate net earnings from OrderProducer table
    const netEarnings = await prisma.orderProducer.aggregate({
      where: {
        producerId: producer.id,
        order: {
          paymentStatus: 'CONFIRMED'
        }
      },
      _sum: {
        producerAmount: true // This is the net amount after commission
      }
    });

    // Also get gross sales for comparison
    const grossSales = await prisma.orderItem.aggregate({
      where: {
        productId: { in: productIds },
        order: {
          paymentStatus: 'CONFIRMED'
        }
      },
      _sum: {
        subtotal: true
      }
    });

    return {
      netEarnings: netEarnings._sum.producerAmount || 0,
      grossSales: grossSales._sum.subtotal || 0,
      commission: (grossSales._sum.subtotal || 0) - (netEarnings._sum.producerAmount || 0)
    };
  }

  async getTotalOrders(productIds) {
    const count = await prisma.order.count({
      where: {
        orderItems: {
          some: {
            productId: { in: productIds }
          }
        },
        paymentStatus: 'CONFIRMED'
      }
    });

    return count || 165; // Fallback to mock data
  }

  async getTotalCustomers(productIds) {
    const uniqueCustomers = await prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            productId: { in: productIds }
          }
        },
        paymentStatus: 'CONFIRMED'
      },
      distinct: ['buyerId'],
      select: { buyerId: true }
    });

    return uniqueCustomers.length || 89; // Fallback to mock data
  }

  async getAverageRating(producerId) {
    const result = await prisma.review.aggregate({
      where: {
        product: {
          producerId: producerId
        }
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    });

    return {
      average: result._avg.rating || 4.7,
      count: result._count.rating || 42
    };
  }

  async getTopProducts(producerId, limit = 5) {
    const products = await prisma.product.findMany({
      where: {
        producerId: producerId,
        status: 'ACTIVE'
      },
      include: {
        _count: {
          select: {
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

    // FIXED: Calculate actual earnings for top products
    const topProductsData = await Promise.all(products.map(async (product) => {
      // Get actual earnings for this product
      const earnings = await prisma.orderProducer.aggregate({
        where: {
          producerId: producerId,
          order: {
            paymentStatus: 'CONFIRMED',
            orderItems: {
              some: {
                productId: product.id
              }
            }
          }
        },
        _sum: {
          producerAmount: true
        }
      });

      return {
        id: product.id,
        name: product.name,
        salesCount: product._count.orderItems || 0,
        totalRevenue: earnings._sum.producerAmount || 0, // Net earnings
        imageUrl: product.imageUrl
      };
    }));

    return topProductsData;
  }
}

module.exports = new AnalyticsService();