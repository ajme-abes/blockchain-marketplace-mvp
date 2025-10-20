const { prisma } = require('../config/database');
const nodemailer = require('nodemailer');

class NotificationService {
constructor() {
  // Email transporter (using Gmail as example)
  this.transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}


  async createNotification(userId, message, type = 'GENERAL') {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          message,
          type
        }
      });

      // Send email if user has email notifications enabled
      await this.sendEmailNotification(userId, message, type);

      return {
        success: true,
        notification
      };
    } catch (error) {
      console.error('Notification creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendEmailNotification(userId, message, type) {
    try {
      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });

      if (!user || !user.email) {
        return { success: false, error: 'User email not found' };
      }

      const subject = this.getEmailSubject(type);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@marketplace.com',
        to: user.email,
        subject: subject,
        html: this.generateEmailTemplate(message, type, user.name)
      };

      // Only send if email is configured
      if (process.env.EMAIL_USER) {
        await this.transporter.sendMail(mailOptions);
      }

      return { success: true };
    } catch (error) {
      console.error('Email notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.notification.count({
          where: { userId }
        })
      ]);

      return {
        success: true,
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
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

      return {
        success: true,
        notification
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async markAllAsRead(userId) {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          status: 'UNREAD'
        },
        data: {
          status: 'READ'
        }
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  getEmailSubject(type) {
    const subjects = {
      'ORDER_CREATED': '🎉 Order Confirmed - Blockchain Marketplace',
      'PAYMENT_CONFIRMED': '✅ Payment Received - Blockchain Marketplace',
      'ORDER_SHIPPED': '🚚 Your Order is on the Way!',
      'DISPUTE_RAISED': '⚠️ Dispute Alert - Action Required',
      'SECURITY': '🔒 Security Notice - Blockchain Marketplace',
      'GENERAL': '📢 Update from Blockchain Marketplace'
    };
    return subjects[type] || 'Notification from Blockchain Marketplace';
  }

  generateEmailTemplate(message, type, userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔗 Blockchain Marketplace</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>${message}</p>
            <p>Thank you for using our marketplace!</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2025 Blockchain Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new NotificationService();