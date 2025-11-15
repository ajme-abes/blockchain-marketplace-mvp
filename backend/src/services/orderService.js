// backend/src/services/orderService.js
const { prisma } = require('../config/database');
const { DeliveryStatus } = require('@prisma/client');

class OrderService {
async createOrder(orderData, userId) { // Add userId parameter
  const { items, shippingAddress, totalAmount } = orderData;
  // Get buyer ID from user ID
  const buyer = await prisma.buyer.findUnique({
    where: { userId: userId }
  });
  
  if (!buyer) {
    throw new Error('Buyer profile not found');
  }
  
  const buyerId = buyer.id;

  console.log('🔧 Creating order for buyer:', buyerId);
  console.log('🔧 Order items:', items);

  // Start transaction to ensure data consistency
  const order = await prisma.$transaction(async (tx) => {
    // 1. Verify all products exist and have sufficient quantity
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, quantityAvailable: true, price: true }
      });

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (product.quantityAvailable < item.quantity) {
        throw new Error(`Insufficient quantity for ${product.name}. Available: ${product.quantityAvailable}, Requested: ${item.quantity}`);
      }
    }

    // 2. Create the order
    const newOrder = await tx.order.create({
      data: {
        buyerId,
        totalAmount,
        shippingAddress: shippingAddress || {},
        orderItems: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
          }))
        }
      },
      include: {
        buyer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        orderItems: {
          include: {
            product: {
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
            }
          }
        }
      }
    });

    // 3. Create initial status history record - FIXED
    await tx.orderStatusHistory.create({
      data: {
        orderId: newOrder.id,
        fromStatus: 'PENDING',
        toStatus: 'PENDING',
        changedById: userId, // Use the authenticated user's ID
        reason: 'Order created'
      }
    });

    // 4. Update product quantities
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          quantityAvailable: {
            decrement: item.quantity
          }
        }
      });
    }

    return newOrder;
  });

  return this.formatOrderResponse(order);
}

  async getOrderById(id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        orderItems: {
          include: {
            product: {
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
            }
          }
        },
        paymentConfirmations: true,
        blockchainRecords: true,
        statusHistory: {
          include: {
            changedBy: {
              select: {
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!order) return null;

    return this.formatOrderResponse(order);
  }

  async getBuyerOrders(buyerId, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: { buyerId },
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
          statusHistory: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              changedBy: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { orderDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.order.count({ where: { buyerId } })
    ]);

    const formattedOrders = orders.map(order => this.formatOrderResponse(order));

    return {
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    };
  }

  async getProducerOrders(producerId, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;

    // First get producer's product IDs
    const producer = await prisma.producer.findUnique({
      where: { id: producerId },
      include: {
        products: {
          select: { id: true }
        }
      }
    });

    if (!producer) {
      return {
        orders: [],
        pagination: {
          page,
          limit,
          totalCount: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }

    const productIds = producer.products.map(p => p.id);

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: {
          orderItems: {
            some: {
              productId: { in: productIds }
            }
          }
        },
        include: {
          buyer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          orderItems: {
            where: {
              productId: { in: productIds }
            },
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
          statusHistory: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              changedBy: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { orderDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.order.count({
        where: {
          orderItems: {
            some: {
              productId: { in: productIds }
            }
          }
        }
      })
    ]);

    const formattedOrders = orders.map(order => this.formatOrderResponse(order));

    return {
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    };
  }

  async updateOrderStatus(orderId, status, updatedBy, reason = null) {
    // Get current order first to know the fromStatus
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { deliveryStatus: true }
    });

    if (!currentOrder) {
      throw new Error('Order not found');
    }

    const fromStatus = currentOrder.deliveryStatus;
    const toStatus = this.mapStatusToEnum(status);

    // Update order status and create history in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update order status
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          deliveryStatus: toStatus,
          ...(toStatus === 'DELIVERED' && { paymentStatus: 'CONFIRMED' })
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
          }
        }
      });

      // Create status history record
      await tx.orderStatusHistory.create({
        data: {
          orderId: orderId,
          fromStatus: fromStatus,
          toStatus: toStatus,
          changedById: updatedBy,
          reason: reason || `Status changed from ${fromStatus} to ${toStatus}`
        }
      });

      // Create audit log for status change
      await tx.auditLog.create({
        data: {
          action: 'UPDATE_ORDER_STATUS',
          entity: 'Order',
          entityId: orderId,
          oldValues: { deliveryStatus: fromStatus },
          newValues: { deliveryStatus: toStatus, reason },
          userId: updatedBy,
          ipAddress: 'system'
        }
      });

      return order;
    });

    return this.formatOrderResponse(result);
  }

  async cancelOrder(orderId, userId, reason = "Buyer requested cancellation") {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Only allow cancellation for pending orders
    if (order.deliveryStatus !== 'PENDING') {
      throw new Error('Cannot cancel order that is already being processed');
    }

    const fromStatus = order.deliveryStatus;

    // Cancel order with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Restore product quantities
      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantityAvailable: {
              increment: item.quantity
            }
          }
        });
      }

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          deliveryStatus: 'CANCELLED'
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
          }
        }
      });

      // Create status history for cancellation
      await tx.orderStatusHistory.create({
        data: {
          orderId: orderId,
          fromStatus: fromStatus,
          toStatus: 'CANCELLED',
          changedById: userId,
          reason: reason
        }
      });

      return updatedOrder;
    });

    return this.formatOrderResponse(result);
  }

  // NEW METHOD: Get order status history
  async getOrderStatusHistory(orderId) {
    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId },
      include: {
        changedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return history.map(record => ({
      id: record.id,
      fromStatus: record.fromStatus,
      toStatus: record.toStatus,
      changedBy: record.changedBy,
      reason: record.reason,
      timestamp: record.createdAt
    }));
  }

  // Add to your existing orderService.js
async validateOrderForDispute(orderId, userId) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          include: {
            user: true
          }
        },
        orderItems: {
          include: {
            product: {
              include: {
                producer: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      return { valid: false, error: 'Order not found' };
    }

    // Check if user is involved in the order
    const isBuyer = order.buyer.userId === userId;
    const isProducer = order.orderItems.some(item => 
      item.product.producer.userId === userId
    );

    if (!isBuyer && !isProducer) {
      return { valid: false, error: 'You are not authorized to raise a dispute for this order' };
    }

    // Check if order is in a state that allows disputes
    const allowedStatuses = ['CONFIRMED', 'SHIPPED', 'DELIVERED'];
    if (!allowedStatuses.includes(order.deliveryStatus)) {
      return { valid: false, error: 'Disputes can only be raised for confirmed, shipped, or delivered orders' };
    }

    // Check if dispute already exists
    const existingDispute = await prisma.dispute.findUnique({
      where: { orderId }
    });

    if (existingDispute) {
      return { valid: false, error: 'A dispute already exists for this order' };
    }

    return { valid: true, order };

  } catch (error) {
    console.error('Validate order for dispute error:', error);
    return { valid: false, error: error.message };
  }
}

  // Helper function to map string status to Prisma enum
  mapStatusToEnum(status) {
    const upper = status.toUpperCase();

    if (!Object.values(DeliveryStatus).includes(upper)) {
      throw new Error(`Invalid delivery status: ${status}`);
    }

    return DeliveryStatus[upper]; 
  }

  formatOrderResponse(order) {
    return {
      id: order.id,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus,
      orderDate: order.orderDate,
      shippingAddress: order.shippingAddress,
      blockchainTxHash: order.blockchainTxHash,
      buyer: order.buyer ? {
        id: order.buyer.id,
        user: order.buyer.user
      } : null,
      items: order.orderItems ? order.orderItems.map(item => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.price,
          producer: item.product.producer ? {
            id: item.product.producer.id,
            businessName: item.product.producer.businessName,
            user: item.product.producer.user
          } : null
        },
        quantity: item.quantity,
        subtotal: item.subtotal
      })) : [],
      statusHistory: order.statusHistory ? order.statusHistory.map(history => ({
        id: history.id,
        fromStatus: history.fromStatus,
        toStatus: history.toStatus,
        changedBy: history.changedBy,
        reason: history.reason,
        timestamp: history.createdAt
      })) : [],
      createdAt: order.orderDate,
      updatedAt: order.updatedAt
    };
  }
}

module.exports = new OrderService();