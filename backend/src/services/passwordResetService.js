// backend/src/services/passwordResetService.js
const crypto = require('crypto');
const { prisma } = require('../config/database');
const userService = require('./userService');
const notificationService = require('./notificationService');

class PasswordResetService {
  
  // Generate secure reset token
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send password reset email
  // In backend/src/services/passwordResetService.js - UPDATE sendResetEmail method
  async sendResetEmail(email) {
    try {
      // ✅ FIX: Email is already normalized from auth route, but ensure consistency
      const normalizedEmail = email.toLowerCase().trim();
      console.log('🔧 Password reset requested for normalized email:', normalizedEmail);
  
      // Find user by normalized email
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });
  
      if (!user) {
        // Don't reveal if user exists for security
        console.log(`Password reset requested for non-existent email: ${normalizedEmail}`);
        return {
          success: true, // Return success even if user doesn't exist for security
          message: 'If an account with this email exists, a reset link has been sent'
        };
      }
  
      // Generate reset token
      const resetToken = this.generateResetToken();
      const tokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
  
      // Save token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpires: tokenExpires
        }
      });
  
      // Create reset URL
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;
      
      // Create email content
      const emailHtml = this.createResetEmailTemplate(user.name, resetUrl);
      const emailText = `Reset your password for Blockchain Marketplace: ${resetUrl}`;
  
      // Send email using notification service
      const emailResult = await notificationService.sendEmail({
        to: user.email, // Use original stored email for sending
        subject: 'Reset Your Password - Blockchain Marketplace',
        html: emailHtml,
        text: emailText
      });
  
      console.log(`✅ Password reset email sent to: ${user.email}`);
  
      return {
        success: true,
        message: 'If an account with this email exists, a reset link has been sent',
        emailSent: emailResult.success
      };
  
    } catch (error) {
      console.error('Send reset email error:', error);
      return {
        success: false,
        error: 'Failed to process password reset request'
      };
    }
  }

  // Validate reset token and reset password
  async resetPassword(token, newPassword) {
    try {
      // Find user with valid reset token
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired reset token'
        };
      }

      // Hash new password using the same method as userService
      const passwordHash = await userService.hashPassword(newPassword);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpires: null
        }
      });

      console.log(`✅ Password reset successful for user: ${user.email}`);

      // Send confirmation email
      await notificationService.sendEmail({
        to: user.email,
        subject: 'Password Reset Successful - Blockchain Marketplace',
        html: this.createPasswordResetConfirmationTemplate(user.name)
      }).catch(err => {
        console.warn('Password reset confirmation email failed:', err.message);
      });

      return {
        success: true,
        message: 'Password reset successfully'
      };

    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: 'Failed to reset password'
      };
    }
  }

  // Email templates
  createResetEmailTemplate(name, resetUrl) {
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
            background: linear-gradient(135deg, #dc2626, #b91c1c);
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
          .alert-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-left: 4px solid #dc2626;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .button {
            display: inline-block;
            background: #dc2626;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            font-size: 12px; 
            color: #666;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
          }
          .warning {
            background: #fffbeb;
            border: 1px solid #fef3c7;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
            <p>Blockchain Marketplace Security</p>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password for your Blockchain Marketplace account.</p>
            
            <div class="alert-box">
              <p style="margin: 0; font-size: 16px; font-weight: 500;">Click the button below to reset your password:</p>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px;">
              <code>${resetUrl}</code>
            </p>
            
            <div class="warning">
              <p><strong>⚠️ Security Notice:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will not change until you click the link above</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated security message. Please do not reply to this email.</p>
            <p>Need help? Contact our support team.</p>
            <p>&copy; 2025 Blockchain Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  createPasswordResetConfirmationTemplate(name) {
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
            background: linear-gradient(135deg, #059669, #047857);
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
          .success-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-left: 4px solid #059669;
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Password Updated</h1>
            <p>Blockchain Marketplace Security</p>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            
            <div class="success-box">
              <p style="margin: 0; font-size: 16px; font-weight: 500;">Your password has been successfully reset!</p>
            </div>
            
            <p>Your Blockchain Marketplace account password was updated on ${new Date().toLocaleString()}.</p>
            
            <p><strong>Security Tips:</strong></p>
            <ul>
              <li>Use a strong, unique password</li>
              <li>Never share your password with anyone</li>
              <li>Enable two-factor authentication if available</li>
              <li>Log out from shared devices</li>
            </ul>
            
            <p>If you did not make this change, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>This is an automated security message. Please do not reply to this email.</p>
            <p>Need help? Contact our support team.</p>
            <p>&copy; 2025 Blockchain Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new PasswordResetService();