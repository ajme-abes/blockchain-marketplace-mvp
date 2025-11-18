const { prisma } = require('../config/database');
const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.isEmailConfigured = false;
    this.initEmailTransporter();
  }

    // === ADD THIS NEW METHOD RIGHT HERE ===
  async sendEmail(emailData) {
    try {
      const { to, subject, html, text } = emailData;
      
      if (!this.isEmailConfigured) {
        return { 
          success: false, 
          error: 'Email not configured',
          note: 'Set EMAIL_USER and EMAIL_PASSWORD in .env'
        };
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || `"Blockchain Marketplace" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: html,
        text: text || this.htmlToText(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${to}: ${subject}`);
      
      return { 
        success: true, 
        messageId: result.messageId 
      };
    } catch (error) {
      console.error('❌ Email sending error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // === ALSO ADD THIS HELPER METHOD ===
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  initEmailTransporter() {
    // Check if email configuration exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️  Email notifications disabled - EMAIL_USER or EMAIL_PASSWORD not set');
      console.log('💡 Add to .env: EMAIL_USER=your-email@gmail.com, EMAIL_PASSWORD=your-app-password');
      return;
    }

    // Create email transporter with better configuration
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      // Better timeout and error handling
      pool: true,
      maxConnections: 1,
      maxMessages: 5
    });

    // Verify email configuration
    this.verifyEmailConfig();
  }

  async verifyEmailConfig() {
    try {
      await this.transporter.verify();
      this.isEmailConfigured = true;
      console.log('✅ Email transporter ready - Notifications enabled');
    } catch (error) {
      console.log('❌ Email configuration error:', error.message);
      console.log('💡 For Gmail, enable 2FA and use App Password');
      this.isEmailConfigured = false;
    }
  }

  

  // ==================== CORE NOTIFICATION METHODS ====================

  async createNotification(userId, message, type = 'GENERAL') {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          message,
          type,
          status: 'UNREAD'
        }
      });

      console.log(`📢 Notification created: ${type} for user ${userId}`);

      // Send email notification in background (don't await)
      this.sendEmailNotification(userId, message, type).catch(error => {
        console.error('Email notification failed:', error.message);
      });

      return {
        success: true,
        notification
      };
    } catch (error) {
      console.error('❌ Notification creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendEmailNotification(userId, message, type) {
    if (!this.isEmailConfigured) {
      return { success: false, error: 'Email not configured' };
    }

    try {
      // Get user email and preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          email: true, 
          name: true,
          // Add user preferences here if you have them
        }
      });

      if (!user || !user.email) {
        return { success: false, error: 'User email not found' };
      }

      const subject = this.getEmailSubject(type);
      const htmlContent = this.generateEmailTemplate(message, type, user.name);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || `"Blockchain Marketplace" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: subject,
        html: htmlContent,
        // Text fallback for email clients that don't support HTML
        text: this.generatePlainText(message, type, user.name)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${user.email}: ${subject}`);
      
      return { 
        success: true, 
        messageId: result.messageId 
      };
    } catch (error) {
      console.error('❌ Email notification error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // ==================== SPECIFIC NOTIFICATION METHODS ====================

  async sendPaymentConfirmedNotification(orderId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
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
          paymentConfirmations: {
            orderBy: { confirmedAt: 'desc' },
            take: 1
          }
        }
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      const paymentMethod = order.paymentConfirmations[0]?.confirmationMethod || 'CHAPA';
      const message = `Your payment of ${order.totalAmount} ETB for order #${order.id.substring(0, 8)} has been confirmed via ${paymentMethod}. The transaction has been recorded on the blockchain for transparency and security.`;

      return await this.createNotification(
        order.buyer.user.id,
        message,
        'PAYMENT_CONFIRMED'
      );
    } catch (error) {
      console.error('Payment confirmation notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendOrderStatusNotification(orderId, newStatus) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
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
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      const statusMessages = {
        'PENDING': 'Your order has been received and is being processed.',
        'CONFIRMED': 'Your order has been confirmed and payment verified.',
        'SHIPPED': 'Great news! Your order has been shipped and is on its way to you!',
        'DELIVERED': '🎉 Your order has been successfully delivered! Thank you for your purchase.',
        'CANCELLED': 'Your order has been cancelled as requested.'
      };

      const shortOrderId = order.id.substring(0, 8);
      const statusMessage = statusMessages[newStatus] || `Your order status has been updated to: ${newStatus}`;
      const message = `Order #${shortOrderId}: ${statusMessage}`;

      return await this.createNotification(
        order.buyer.user.id,
        message,
        'ORDER_SHIPPED'
      );
    } catch (error) {
      console.error('Order status notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBlockchainVerificationNotification(orderId, txHash) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
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
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      const shortTxHash = txHash.substring(0, 16) + '...';
      const shortOrderId = order.id.substring(0, 8);
      const message = `🔗 Blockchain Verified: Your transaction for order #${shortOrderId} has been permanently recorded on the blockchain. Transaction: ${shortTxHash}. This ensures transparency and prevents tampering.`;

      return await this.createNotification(
        order.buyer.user.id,
        message,
        'SECURITY'
      );
    } catch (error) {
      console.error('Blockchain verification notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendNewOrderNotificationToProducer(orderId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
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

      if (!order || order.orderItems.length === 0) {
        return { success: false, error: 'Order or products not found' };
      }

      // Get unique producers from order items
      const producers = new Map();
      order.orderItems.forEach(item => {
        const producer = item.product.producer;
        if (producer && !producers.has(producer.user.id)) {
          producers.set(producer.user.id, producer);
        }
      });

      // Send notifications to all involved producers
      const results = [];
      for (const [producerUserId, producer] of producers) {
        const message = `🎊 New Order! You have received a new order #${order.id.substring(0, 8)}. Please check your dashboard for details.`;
        
        const result = await this.createNotification(
          producerUserId,
          message,
          'ORDER_CREATED'
        );
        results.push(result);
      }

      return { success: true, results };
    } catch (error) {
      console.error('New order notification to producer error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendDisputeNotification(orderId, raisedByUserId, disputeReason) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          buyer: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Notify the other party (if buyer raised dispute, notify producer and admin, and vice versa)
      const targetUserId = raisedByUserId === order.buyer.userId ? 
        // TODO: Get producer user ID - you might need to adjust this based on your schema
        null : order.buyer.userId;

      if (targetUserId) {
        const message = `⚠️ Dispute Alert: A dispute has been raised for order #${order.id.substring(0, 8)}. Reason: ${disputeReason}`;
        
        return await this.createNotification(
          targetUserId,
          message,
          'DISPUTE_RAISED'
        );
      }

      return { success: false, error: 'Target user not found for dispute notification' };
    } catch (error) {
      console.error('Dispute notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== NOTIFICATION MANAGEMENT ====================

  async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            message: true,
            type: true,
            status: true,
            createdAt: true
          }
        }),
        prisma.notification.count({
          where: { userId }
        }),
        prisma.notification.count({
          where: { 
            userId, 
            status: 'UNREAD' 
          }
        })
      ]);

      return {
        success: true,
        data: {
          notifications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            unreadCount,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get user notifications error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId // Ensure user owns the notification
        },
        data: {
          status: 'READ'
        }
      });

      if (notification.count === 0) {
        return {
          success: false,
          error: 'Notification not found or access denied'
        };
      }

      return {
        success: true,
        message: 'Notification marked as read'
      };
    } catch (error) {
      console.error('Mark as read error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          status: 'UNREAD'
        },
        data: {
          status: 'READ'
        }
      });

      console.log(`✅ Marked ${result.count} notifications as read for user ${userId}`);

      return { 
        success: true,
        markedCount: result.count 
      };
    } catch (error) {
      console.error('Mark all as read error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: { 
          userId, 
          status: 'UNREAD' 
        }
      });

      return {
        success: true,
        count
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== EMAIL TEMPLATES ====================

  getEmailSubject(type) {
    const subjects = {
      'ORDER_CREATED': '🎉 New Order Received - Blockchain Marketplace',
      'PAYMENT_CONFIRMED': '✅ Payment Confirmed - Blockchain Marketplace',
      'ORDER_SHIPPED': '🚚 Your Order is on the Way! - Blockchain Marketplace',
      'DISPUTE_RAISED': '⚠️ Dispute Alert - Action Required - Blockchain Marketplace',
      'SECURITY': '🔒 Transaction Verified on Blockchain - Blockchain Marketplace',
      'GENERAL': '📢 Update from Blockchain Marketplace'
    };
    return subjects[type] || 'Notification from Blockchain Marketplace';
  }

  generateEmailTemplate(message, type, userName) {
    const icons = {
      'ORDER_CREATED': '🎉',
      'PAYMENT_CONFIRMED': '✅',
      'ORDER_SHIPPED': '🚚',
      'DISPUTE_RAISED': '⚠️',
      'SECURITY': '🔒',
      'GENERAL': '📢'
    };

    const icon = icons[type] || '📧';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #2c5aa0, #1e3a8a);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }
          .content { 
            padding: 30px; 
            background: white;
          }
          .message-box {
            background: #f8f9fa;
            border-left: 4px solid #2c5aa0;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            font-size: 12px; 
            color: #666;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
          }
          .button {
            display: inline-block;
            background: #2c5aa0;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${icon} Blockchain Marketplace</h1>
            <p>Transparent & Secure Trading</p>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <div class="message-box">
              <p style="margin: 0; font-size: 16px;">${message}</p>
            </div>
            <p>Thank you for choosing our marketplace for secure and transparent transactions.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/dashboard" class="button">
              View Dashboard
            </a>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>Need help? Contact our support team.</p>
            <p>&copy; 2025 Blockchain Marketplace. All rights reserved.</p>
            <p><small>All transactions are recorded on blockchain for transparency.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generatePlainText(message, type, userName) {
    return `
Hello ${userName},

${message}

Thank you for choosing Blockchain Marketplace for secure and transparent transactions.

View your dashboard: ${process.env.FRONTEND_URL || 'http://localhost:8080'}/dashboard

This is an automated message. Please do not reply to this email.

Need help? Contact our support team.

© 2025 Blockchain Marketplace. All rights reserved.
All transactions are recorded on blockchain for transparency.
    `.trim();
  }

  // ==================== UTILITY METHODS ====================

  async cleanupOldNotifications(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          status: 'READ'
        }
      });

      console.log(`🧹 Cleaned up ${result.count} old notifications`);
      return { success: true, deletedCount: result.count };
    } catch (error) {
      console.error('Cleanup notifications error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();