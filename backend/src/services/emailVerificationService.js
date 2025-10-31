// backend/src/services/emailVerificationService.js
const crypto = require('crypto');
const { prisma } = require('../config/database');
const notificationService = require('./notificationService');

class EmailVerificationService {
  
  // Generate secure verification token
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create and send verification email
// In emailVerificationService.js - Enhanced version
async sendVerificationEmail(user) {
  try {
    // Generate verification token
    const verificationToken = this.generateVerificationToken();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpires: tokenExpires
      }
    });

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const emailHtml = this.createVerificationEmailTemplate(user.name, verificationUrl);
    const emailText = `Verify your email for Blockchain Marketplace: ${verificationUrl}`;

    // Try to send email using notification service
    let emailSent = false;
    let emailResult = null;
    
    try {
      console.log('🔧 Attempting to send verification email...');
      const notificationService = require('./notificationService');
      
      // Try generic sendEmail method first
      if (typeof notificationService.sendEmail === 'function') {
        console.log('🔧 Using sendEmail method...');
        emailResult = await notificationService.sendEmail({
          to: user.email,
          subject: 'Verify Your Email - Blockchain Marketplace',
          html: emailHtml,
          text: emailText
        });
      } 
      // Fallback to sendEmailNotification
      else if (typeof notificationService.sendEmailNotification === 'function') {
        console.log('🔧 Using sendEmailNotification method...');
        emailResult = await notificationService.sendEmailNotification(
          user.id,
          `Please verify your email address to complete your registration. Verification URL: ${verificationUrl}`,
          'SECURITY'
        );
      } 
      // No email method available
      else {
        console.warn('⚠️ No email sending method available in notification service');
        emailResult = { 
          success: false, 
          error: 'Email service not configured' 
        };
      }
      
      emailSent = emailResult ? emailResult.success : false;
      console.log('🔧 Email sending result:', { emailSent, error: emailResult?.error });
      
    } catch (emailError) {
      console.warn('⚠️ Email service error:', emailError.message);
      emailResult = { 
        success: false, 
        error: emailError.message 
      };
      emailSent = false;
    }

    console.log(`✅ Verification process completed for: ${user.email}`);
    
    // Return appropriate response
    const response = {
      success: emailSent,
      message: emailSent ? 'Verification email sent successfully' : 'Email service not available',
      token: verificationToken,
      verificationUrl: verificationUrl
    };

    if (!emailSent && emailResult) {
      response.error = emailResult.error;
      response.note = 'Check server logs for manual verification URL';
    }

    return response;
    
  } catch (error) {
    console.error('Send verification email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

  // Verify email with token
  async verifyEmail(token) {
    try {
      // Find user with valid token
      const user = await prisma.user.findFirst({
        where: {
          verificationToken: token,
          verificationTokenExpires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        return { 
          success: false, 
          error: 'Invalid or expired verification token' 
        };
      }

      // Mark email as verified and clear token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpires: null
        }
      });

      console.log(`✅ Email verified for user: ${user.email}`);

      // Send welcome email
      await notificationService.sendEmail({
        to: user.email,
        subject: 'Welcome to Blockchain Marketplace!',
        html: this.createWelcomeEmailTemplate(user.name)
      });

      return { 
        success: true, 
        message: 'Email verified successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      };

    } catch (error) {
      console.error('Verify email error:', error);
      return { success: false, error: error.message };
    }
  }

  // Resend verification email
  async resendVerificationEmail(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (user.emailVerified) {
        return { success: false, error: 'Email already verified' };
      }

      return await this.sendVerificationEmail(user);

    } catch (error) {
      console.error('Resend verification email error:', error);
      return { success: false, error: error.message };
    }
  }

  // Email templates
  createVerificationEmailTemplate(name, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2E8B57; color: white; padding: 20px; text-align: center; }
          .button { background: #2E8B57; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Blockchain Marketplace</h1>
          </div>
          <h2>Verify Your Email Address</h2>
          <p>Hello ${name},</p>
          <p>Welcome to Blockchain Marketplace! Please verify your email address to complete your registration and start using all features.</p>
          <p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p><code>${verificationUrl}</code></p>
          <p>This verification link will expire in 24 hours.</p>
          <div class="footer">
            <p>If you didn't create an account, please ignore this email.</p>
            <p>&copy; 2024 Blockchain Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  createWelcomeEmailTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2E8B57; color: white; padding: 20px; text-align: center; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Blockchain Marketplace!</h1>
          </div>
          <h2>Email Verified Successfully</h2>
          <p>Hello ${name},</p>
          <p>Your email has been successfully verified! You now have full access to all features of our marketplace.</p>
          <p>You can:</p>
          <ul>
            <li>Browse and purchase products</li>
            <li>List your own products (if you're a producer)</li>
            <li>Track your orders</li>
            <li>Leave reviews and ratings</li>
          </ul>
          <p>Thank you for joining our community of producers and buyers!</p>
          <div class="footer">
            <p>&copy; 2024 Blockchain Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailVerificationService();