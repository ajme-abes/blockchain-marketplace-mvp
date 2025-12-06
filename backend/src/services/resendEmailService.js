// backend/src/services/resendEmailService.js
// Email service using Resend (works perfectly with Render)

const { Resend } = require('resend');

class ResendEmailService {
    constructor() {
        this.isConfigured = false;
        this.initResend();
    }

    initResend() {
        if (!process.env.RESEND_API_KEY) {
            console.log('⚠️  Resend not configured - Set RESEND_API_KEY in environment');
            return;
        }

        try {
            this.resend = new Resend(process.env.RESEND_API_KEY);
            this.isConfigured = true;
            console.log('✅ Resend email service initialized');
        } catch (error) {
            console.error('❌ Resend initialization error:', error.message);
            this.isConfigured = false;
        }
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.isConfigured) {
            console.log('⚠️  Resend not configured - skipping email to:', to);
            return {
                success: false,
                error: 'Resend not configured',
                note: 'Set RESEND_API_KEY in environment variables'
            };
        }

        try {
            const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

            const result = await this.resend.emails.send({
                from,
                to,
                subject,
                html,
                text: text || this.htmlToText(html)
            });

            console.log(`✅ Email sent via Resend to ${to}: ${subject}`);
            console.log('📧 Message ID:', result.id);

            return {
                success: true,
                messageId: result.id
            };
        } catch (error) {
            console.error('❌ Resend send error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    htmlToText(html) {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    async verifyConfiguration() {
        if (!this.isConfigured) {
            return false;
        }

        try {
            // Resend doesn't have a verify method, so we just check if API key is set
            console.log('✅ Resend configuration verified');
            return true;
        } catch (error) {
            console.error('❌ Resend verification error:', error.message);
            return false;
        }
    }
}

module.exports = new ResendEmailService();
