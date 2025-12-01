// backend/src/services/securityNotificationService.js
const notificationService = require('./notificationService');

class SecurityNotificationService {
    /**
     * Send email notification for account lockout
     */
    async notifyAccountLockout(user, unlockAt) {
        try {
            const minutesRemaining = Math.ceil((new Date(unlockAt) - new Date()) / 60000);

            const emailHtml = this.createLockoutEmailTemplate(user.name, minutesRemaining, unlockAt);

            await notificationService.sendEmail({
                to: user.email,
                subject: '🔒 Account Temporarily Locked - EthioTrust',
                html: emailHtml
            });

            console.log(`✅ Lockout notification sent to: ${user.email}`);
        } catch (error) {
            console.error('❌ Failed to send lockout notification:', error);
        }
    }

    /**
     * Send email notification for new device login
     */
    async notifyNewDeviceLogin(user, ipAddress, userAgent, location = 'Unknown') {
        try {
            const emailHtml = this.createNewDeviceEmailTemplate(
                user.name,
                ipAddress,
                userAgent,
                location,
                new Date()
            );

            await notificationService.sendEmail({
                to: user.email,
                subject: '🔐 New Device Login Detected - EthioTrust',
                html: emailHtml
            });

            console.log(`✅ New device notification sent to: ${user.email}`);
        } catch (error) {
            console.error('❌ Failed to send new device notification:', error);
        }
    }

    /**
     * Send email notification for password change
     */
    async notifyPasswordChange(user) {
        try {
            const emailHtml = this.createPasswordChangeEmailTemplate(user.name, new Date());

            await notificationService.sendEmail({
                to: user.email,
                subject: '✅ Password Changed Successfully - EthioTrust',
                html: emailHtml
            });

            console.log(`✅ Password change notification sent to: ${user.email}`);
        } catch (error) {
            console.error('❌ Failed to send password change notification:', error);
        }
    }

    /**
     * Send email notification for 2FA enabled
     */
    async notify2FAEnabled(user) {
        try {
            const emailHtml = this.create2FAEnabledEmailTemplate(user.name, new Date());

            await notificationService.sendEmail({
                to: user.email,
                subject: '🔐 Two-Factor Authentication Enabled - EthioTrust',
                html: emailHtml
            });

            console.log(`✅ 2FA enabled notification sent to: ${user.email}`);
        } catch (error) {
            console.error('❌ Failed to send 2FA enabled notification:', error);
        }
    }

    /**
     * Send email notification for 2FA disabled
     */
    async notify2FADisabled(user) {
        try {
            const emailHtml = this.create2FADisabledEmailTemplate(user.name, new Date());

            await notificationService.sendEmail({
                to: user.email,
                subject: '⚠️ Two-Factor Authentication Disabled - EthioTrust',
                html: emailHtml
            });

            console.log(`✅ 2FA disabled notification sent to: ${user.email}`);
        } catch (error) {
            console.error('❌ Failed to send 2FA disabled notification:', error);
        }
    }

    /**
     * Send weekly security summary
     */
    async sendSecuritySummary(user, summary) {
        try {
            const emailHtml = this.createSecuritySummaryEmailTemplate(
                user.name,
                summary.loginCount,
                summary.failedAttempts,
                summary.newDevices,
                summary.passwordChanges
            );

            await notificationService.sendEmail({
                to: user.email,
                subject: '📊 Weekly Security Summary - EthioTrust',
                html: emailHtml
            });

            console.log(`✅ Security summary sent to: ${user.email}`);
        } catch (error) {
            console.error('❌ Failed to send security summary:', error);
        }
    }

    // ========== EMAIL TEMPLATES ==========

    createLockoutEmailTemplate(name, minutesRemaining, unlockAt) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .alert { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Account Temporarily Locked</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <div class="alert">
              <strong>Your account has been temporarily locked due to multiple failed login attempts.</strong>
            </div>
            <p><strong>Unlock Time:</strong> ${new Date(unlockAt).toLocaleString()}</p>
            <p><strong>Time Remaining:</strong> ${minutesRemaining} minutes</p>
            <p><strong>What happened?</strong></p>
            <p>We detected 5 failed login attempts on your account. As a security measure, we've temporarily locked your account to protect it from unauthorized access.</p>
            <p><strong>What should you do?</strong></p>
            <ul>
              <li>Wait ${minutesRemaining} minutes for automatic unlock</li>
              <li>If this wasn't you, change your password immediately after unlock</li>
              <li>Enable Two-Factor Authentication for extra security</li>
              <li>Contact support if you need immediate access</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated security notification from EthioTrust Marketplace.</p>
            <p>&copy; 2025 EthioTrust. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    createNewDeviceEmailTemplate(name, ipAddress, userAgent, location, timestamp) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #ddd; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 New Device Login Detected</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>We detected a login to your account from a new device or location.</p>
            <div class="info-box">
              <p><strong>Login Details:</strong></p>
              <p>📅 <strong>Time:</strong> ${timestamp.toLocaleString()}</p>
              <p>🌍 <strong>Location:</strong> ${location}</p>
              <p>📱 <strong>Device:</strong> ${userAgent}</p>
              <p>🔢 <strong>IP Address:</strong> ${ipAddress}</p>
            </div>
            <p><strong>Was this you?</strong></p>
            <p>If you recognize this activity, you can ignore this email.</p>
            <p><strong>Wasn't you?</strong></p>
            <ul>
              <li>Change your password immediately</li>
              <li>Review your active sessions and logout unknown devices</li>
              <li>Enable Two-Factor Authentication</li>
              <li>Contact our support team</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated security notification from EthioTrust Marketplace.</p>
            <p>&copy; 2025 EthioTrust. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    createPasswordChangeEmailTemplate(name, timestamp) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .success { background: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 15px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Password Changed Successfully</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <div class="success">
              <strong>Your password was changed successfully on ${timestamp.toLocaleString()}</strong>
            </div>
            <p><strong>Wasn't you?</strong></p>
            <p>If you didn't make this change, your account may be compromised. Please:</p>
            <ul>
              <li>Contact our support team immediately</li>
              <li>Try to reset your password if you still have access</li>
              <li>Review your account activity</li>
            </ul>
            <p><strong>Security Tips:</strong></p>
            <ul>
              <li>Use a strong, unique password</li>
              <li>Never share your password</li>
              <li>Enable Two-Factor Authentication</li>
              <li>Logout from shared devices</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated security notification from EthioTrust Marketplace.</p>
            <p>&copy; 2025 EthioTrust. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    create2FAEnabledEmailTemplate(name, timestamp) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .success { background: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 15px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Two-Factor Authentication Enabled</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <div class="success">
              <strong>Two-Factor Authentication was enabled on your account on ${timestamp.toLocaleString()}</strong>
            </div>
            <p>Your account is now more secure! From now on, you'll need to enter a verification code from your authenticator app when logging in.</p>
            <p><strong>Important:</strong></p>
            <ul>
              <li>Keep your backup codes in a safe place</li>
              <li>Don't share your authenticator app with anyone</li>
              <li>You can disable 2FA anytime from your settings</li>
            </ul>
            <p><strong>Wasn't you?</strong></p>
            <p>If you didn't enable 2FA, please contact support immediately.</p>
          </div>
          <div class="footer">
            <p>This is an automated security notification from EthioTrust Marketplace.</p>
            <p>&copy; 2025 EthioTrust. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    create2FADisabledEmailTemplate(name, timestamp) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Two-Factor Authentication Disabled</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <div class="warning">
              <strong>Two-Factor Authentication was disabled on your account on ${timestamp.toLocaleString()}</strong>
            </div>
            <p>Your account security has been reduced. We recommend keeping 2FA enabled for maximum protection.</p>
            <p><strong>Wasn't you?</strong></p>
            <p>If you didn't disable 2FA, your account may be compromised. Please:</p>
            <ul>
              <li>Change your password immediately</li>
              <li>Re-enable Two-Factor Authentication</li>
              <li>Review your account activity</li>
              <li>Contact support if needed</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated security notification from EthioTrust Marketplace.</p>
            <p>&copy; 2025 EthioTrust. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    createSecuritySummaryEmailTemplate(name, loginCount, failedAttempts, newDevices, passwordChanges) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .stat-box { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #2563eb; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Weekly Security Summary</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Here's your security activity summary for the past week:</p>
            
            <div class="stat-box">
              <h3>✅ Successful Logins</h3>
              <p style="font-size: 24px; margin: 0;">${loginCount}</p>
            </div>
            
            <div class="stat-box">
              <h3>❌ Failed Login Attempts</h3>
              <p style="font-size: 24px; margin: 0;">${failedAttempts}</p>
            </div>
            
            <div class="stat-box">
              <h3>📱 New Devices</h3>
              <p style="font-size: 24px; margin: 0;">${newDevices}</p>
            </div>
            
            <div class="stat-box">
              <h3>🔑 Password Changes</h3>
              <p style="font-size: 24px; margin: 0;">${passwordChanges}</p>
            </div>
            
            ${failedAttempts > 5 ? `
              <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0;">
                <strong>⚠️ High number of failed login attempts detected!</strong>
                <p>Consider enabling Two-Factor Authentication for better security.</p>
              </div>
            ` : ''}
            
            <p><strong>Security Recommendations:</strong></p>
            <ul>
              <li>Review your active sessions regularly</li>
              <li>Enable Two-Factor Authentication if not already enabled</li>
              <li>Use a strong, unique password</li>
              <li>Logout from devices you don't recognize</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated weekly summary from EthioTrust Marketplace.</p>
            <p>&copy; 2025 EthioTrust. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
}

module.exports = new SecurityNotificationService();
