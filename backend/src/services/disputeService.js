// backend/src/services/disputeService.js
const { prisma } = require('../config/database');
const notificationService = require('./notificationService');
const ipfsService = require('./ipfsService');

class DisputeService {
  async createDispute(disputeData) {
    try {
      const { orderId, raisedById, reason, description } = disputeData;

      console.log('🔧 Creating dispute for order:', orderId);

      // Validate order exists and user has access
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
        throw new Error('Order not found');
      }

      // Check if user is involved in the order
      const isBuyer = order.buyer.userId === raisedById;
      const isProducer = order.orderItems.some(item => 
        item.product.producer.userId === raisedById
      );

      if (!isBuyer && !isProducer) {
        throw new Error('You are not authorized to raise a dispute for this order');
      }

      // Check if dispute already exists for this order
      const existingDispute = await prisma.dispute.findUnique({
        where: { orderId }
      });

      if (existingDispute) {
        throw new Error('A dispute already exists for this order');
      }

      // Create dispute
      const dispute = await prisma.dispute.create({
        data: {
          orderId,
          raisedById,
          reason,
          description,
          status: 'OPEN'
        },
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
          }
        }
      });

      console.log('✅ Dispute created:', dispute.id);

      // Notify the other party and admin
      await this.notifyDisputeParties(dispute, order);

      return {
        success: true,
        dispute: this.formatDisputeResponse(dispute)
      };

    } catch (error) {
      console.error('❌ Create dispute error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

// In disputeService.js - Update the addEvidence method around line 85-105

async addEvidence(disputeId, evidenceData, fileBuffer, fileName, userId) {
  try {
    console.log('🔧 Adding evidence to dispute:', disputeId);

    // Verify dispute exists and user has access
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        raisedBy: true,
        order: {
          include: {
            buyer: true,
            orderItems: {
              include: {
                product: {
                  include: {
                    producer: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    // Check if user is involved in the dispute
    const isInvolved = this.isUserInvolvedInDispute(dispute, userId);
    if (!isInvolved) {
      throw new Error('You are not authorized to add evidence to this dispute');
    }

    // Upload file to IPFS - FIX: Don't pass productId for dispute evidence
    const uploadResult = await ipfsService.uploadFile(
      fileBuffer,
      fileName,
      'DOCUMENT', // Using existing IPFS category
      userId
      // Remove productId parameter since we're uploading for dispute, not product
    );

    if (!uploadResult.success) {
      throw new Error(`Failed to upload evidence: ${uploadResult.error}`);
    }

    // Create evidence record
    const evidence = await prisma.disputeEvidence.create({
      data: {
        disputeId,
        type: evidenceData.type || 'OTHER',
        url: uploadResult.gatewayUrl,
        filename: fileName,
        fileSize: fileBuffer.length,
        mimeType: ipfsService.getMimeType(fileName),
        uploadedById: userId,
        description: evidenceData.description
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('✅ Evidence added:', evidence.id);

    // Add system message about new evidence
    await prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: userId,
        content: `Added evidence: ${fileName}`,
        type: 'MESSAGE'
      }
    });

    // Notify other parties
    await this.notifyNewEvidence(dispute, evidence, userId);

    return {
      success: true,
      evidence: this.formatEvidenceResponse(evidence)
    };

  } catch (error) {
    console.error('❌ Add evidence error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
  async addMessage(disputeId, messageData, userId) {
    try {
      const { content, type = 'MESSAGE', isInternal = false } = messageData;

      console.log('🔧 Adding message to dispute:', disputeId);

      // Verify dispute exists and user has access
      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          raisedBy: true,
          order: {
            include: {
              buyer: true,
              orderItems: {
                include: {
                  product: {
                    include: {
                      producer: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!dispute) {
        throw new Error('Dispute not found');
      }

      // For internal notes, only admin can add
      if (isInternal) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });

        if (user.role !== 'ADMIN') {
          throw new Error('Only admins can add internal notes');
        }
      } else {
        // For regular messages, check if user is involved
        const isInvolved = this.isUserInvolvedInDispute(dispute, userId);
        if (!isInvolved) {
          throw new Error('You are not authorized to message in this dispute');
        }
      }

      // Create message
      const message = await prisma.disputeMessage.create({
        data: {
          disputeId,
          senderId: userId,
          content,
          type,
          isInternal
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      console.log('✅ Message added:', message.id);

      // Notify other parties (if not internal note)
      if (!isInternal) {
        await this.notifyNewMessage(dispute, message, userId);
      }

      return {
        success: true,
        message: this.formatMessageResponse(message)
      };

    } catch (error) {
      console.error('❌ Add message error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateDisputeStatus(disputeId, statusData, adminId) {
    try {
      const { status, resolution, refundAmount } = statusData;

      console.log('🔧 Updating dispute status:', disputeId, status);

      // Verify admin role
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { role: true }
      });

      if (admin.role !== 'ADMIN') {
        throw new Error('Only admins can update dispute status');
      }

      // Update dispute
      const updateData = {
        status,
        resolvedById: adminId,
        resolvedAt: new Date()
      };

      if (resolution) updateData.resolution = resolution;
      if (refundAmount !== undefined) updateData.refundAmount = refundAmount;

      const dispute = await prisma.dispute.update({
        where: { id: disputeId },
        data: updateData,
        include: {
          order: {
            include: {
              buyer: {
                include: {
                  user: true
                }
              }
            }
          },
          raisedBy: true,
          resolvedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      console.log('✅ Dispute status updated:', dispute.id, status);

      // Add system message about status change
      await prisma.disputeMessage.create({
        data: {
          disputeId,
          senderId: adminId,
          content: `Dispute status changed to: ${status}` + (resolution ? ` - ${resolution}` : ''),
          type: 'STATUS_CHANGE'
        }
      });

      // Notify parties about resolution
      await this.notifyDisputeResolution(dispute);

      return {
        success: true,
        dispute: this.formatDisputeResponse(dispute)
      };

    } catch (error) {
      console.error('❌ Update dispute status error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUserDisputes(userId, filters = {}) {
    try {
      const { status, page = 1, limit = 10 } = filters;

      const where = await this.buildDisputeWhereClause(userId, status);

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
            evidence: {
              take: 1, // Just get count for preview
              select: { id: true }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1, // Latest message for preview
              select: {
                content: true,
                createdAt: true,
                sender: {
                  select: {
                    name: true
                  }
                }
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
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.dispute.count({ where })
      ]);

      return {
        success: true,
        data: {
          disputes: disputes.map(dispute => this.formatDisputeResponse(dispute)),
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        }
      };

    } catch (error) {
      console.error('❌ Get user disputes error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getDisputeDetails(disputeId, userId) {
    try {
      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          order: {
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
                              email: true,
                              phone: true
                            }
                          }
                        }
                      }
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
              email: true,
              phone: true
            }
          },
          resolvedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          evidence: {
            include: {
              uploadedBy: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { uploadedAt: 'asc' }
          },
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
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

      if (!dispute) {
        throw new Error('Dispute not found');
      }

      // Check if user has access to this dispute
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      const hasAccess = user.role === 'ADMIN' || this.isUserInvolvedInDispute(dispute, userId);
      if (!hasAccess) {
        throw new Error('Access denied to this dispute');
      }

      return {
        success: true,
        data: this.formatDisputeResponse(dispute)
      };

    } catch (error) {
      console.error('❌ Get dispute details error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== HELPER METHODS ====================

  isUserInvolvedInDispute(dispute, userId) {
    // Check if user is the one who raised the dispute
    if (dispute.raisedById === userId) return true;

    // Check if user is the buyer in the order
    if (dispute.order.buyer.userId === userId) return true;

    // Check if user is a producer in the order
    const isProducer = dispute.order.orderItems.some(item => 
      item.product.producer.userId === userId
    );
    
    return isProducer;
  }

  async buildDisputeWhereClause(userId, status) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user.role === 'ADMIN') {
      // Admin can see all disputes
      return status ? { status } : {};
    }

    // Regular users can only see disputes they're involved in
    const involvedDisputeIds = await this.getUserInvolvedDisputeIds(userId);
    
    const where = {
      id: { in: involvedDisputeIds }
    };

    if (status) {
      where.status = status;
    }

    return where;
  }

  async getUserInvolvedDisputeIds(userId) {
    // Get disputes where user is involved as raiser, buyer, or producer
    const disputes = await prisma.dispute.findMany({
      where: {
        OR: [
          { raisedById: userId },
          { 
            order: { 
              buyer: { userId: userId } 
            } 
          },
          {
            order: {
              orderItems: {
                some: {
                  product: {
                    producer: { userId: userId }
                  }
                }
              }
            }
          }
        ]
      },
      select: { id: true }
    });

    return disputes.map(d => d.id);
  }

  async notifyDisputeParties(dispute, order) {
    try {
      const involvedUsers = new Set();

      // Add dispute raiser
      involvedUsers.add(dispute.raisedById);

      // Add buyer
      involvedUsers.add(order.buyer.userId);

      // Add all producers in the order
      order.orderItems.forEach(item => {
        involvedUsers.add(item.product.producer.userId);
      });

      // Remove the user who raised the dispute from notification
      involvedUsers.delete(dispute.raisedById);

      // Notify each involved user
      for (const userId of involvedUsers) {
        await notificationService.createNotification(
          userId,
          `⚠️ A dispute has been raised for order #${order.id.substring(0, 8)}. Reason: ${dispute.reason}`,
          'DISPUTE_RAISED'
        );
      }

      // Notify admins
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });

      for (const admin of admins) {
        await notificationService.createNotification(
          admin.id,
          `🚨 New dispute raised for order #${order.id.substring(0, 8)}. Please review.`,
          'DISPUTE_RAISED'
        );
      }

    } catch (error) {
      console.error('Dispute notification error:', error);
    }
  }

  async notifyNewEvidence(dispute, evidence, uploadedById) {
    try {
      const involvedUsers = await this.getInvolvedUsers(dispute.id);
      
      // Notify all involved users except the one who uploaded
      for (const userId of involvedUsers) {
        if (userId !== uploadedById) {
          await notificationService.createNotification(
            userId,
            `📎 New evidence added to dispute for order #${dispute.orderId.substring(0, 8)}`,
            'DISPUTE_RAISED'
          );
        }
      }
    } catch (error) {
      console.error('New evidence notification error:', error);
    }
  }

  async notifyNewMessage(dispute, message, senderId) {
    try {
      const involvedUsers = await this.getInvolvedUsers(dispute.id);
      
      // Notify all involved users except the sender
      for (const userId of involvedUsers) {
        if (userId !== senderId) {
          await notificationService.createNotification(
            userId,
            `💬 New message in dispute for order #${dispute.orderId.substring(0, 8)}`,
            'DISPUTE_RAISED'
          );
        }
      }
    } catch (error) {
      console.error('New message notification error:', error);
    }
  }

  async notifyDisputeResolution(dispute) {
    try {
      const involvedUsers = await this.getInvolvedUsers(dispute.id);
      
      for (const userId of involvedUsers) {
        await notificationService.createNotification(
          userId,
          `✅ Dispute resolved for order #${dispute.orderId.substring(0, 8)}. Status: ${dispute.status}`,
          'DISPUTE_RAISED'
        );
      }
    } catch (error) {
      console.error('Dispute resolution notification error:', error);
    }
  }

  async getInvolvedUsers(disputeId) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        raisedBy: { select: { id: true } },
        order: {
          include: {
            buyer: { select: { userId: true } },
            orderItems: {
              include: {
                product: {
                  include: {
                    producer: { select: { userId: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    const users = new Set();
    users.add(dispute.raisedBy.id);
    users.add(dispute.order.buyer.userId);
    
    dispute.order.orderItems.forEach(item => {
      users.add(item.product.producer.userId);
    });

    return Array.from(users);
  }

  // ==================== RESPONSE FORMATTERS ====================

  formatDisputeResponse(dispute) {
    return {
      id: dispute.id,
      orderId: dispute.orderId,
      reason: dispute.reason,
      description: dispute.description,
      status: dispute.status,
      resolution: dispute.resolution,
      refundAmount: dispute.refundAmount,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
      raisedBy: dispute.raisedBy,
      resolvedBy: dispute.resolvedBy,
      resolvedAt: dispute.resolvedAt,
      order: dispute.order ? {
        id: dispute.order.id,
        totalAmount: dispute.order.totalAmount,
        buyer: dispute.order.buyer,
        orderItems: dispute.order.orderItems
      } : null,
      evidenceCount: dispute.evidence ? dispute.evidence.length : dispute._count?.evidence || 0,
      messageCount: dispute.messages ? dispute.messages.length : dispute._count?.messages || 0,
      latestMessage: dispute.messages && dispute.messages.length > 0 ? {
        content: dispute.messages[0].content,
        createdAt: dispute.messages[0].createdAt,
        senderName: dispute.messages[0].sender.name
      } : null
    };
  }

  formatEvidenceResponse(evidence) {
    return {
      id: evidence.id,
      type: evidence.type,
      url: evidence.url,
      filename: evidence.filename,
      fileSize: evidence.fileSize,
      mimeType: evidence.mimeType,
      description: evidence.description,
      uploadedAt: evidence.uploadedAt,
      uploadedBy: evidence.uploadedBy
    };
  }

  formatMessageResponse(message) {
    return {
      id: message.id,
      content: message.content,
      type: message.type,
      isInternal: message.isInternal,
      createdAt: message.createdAt,
      sender: message.sender
    };
  }
}

module.exports = new DisputeService();