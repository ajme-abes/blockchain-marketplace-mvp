// backend/src/services/emailService.js
// Alternative email service using SendGrid (works better with Render)

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.isConfigured = false;
        this.initTransporter();
    }

    initTransporter() {
        // Check if using SendGrid
        if (process.env.SENDGRID_API_KEY) {
            console.log('📧 Using SendGrid for email...');
            this.transporter = nodemailer.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587,
                secure: false,
                auth: {
                    user: 'apikey',
                    pass: process.env.SENDGRID_API_KEY
                }
            });
            this.verifyTransporter();
            return;
        }

        // Check if using Gmail
        if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
            console.log('📧 Using Gmail for email...');
            this.transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                },
                tls: {
                    rejectUnauthorized: false
                },
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 10000
            });
            this.verifyTransporter();
            return;
        }

        console.log('⚠️  Email not configured - Set SENDGRID_API_KEY or EMAIL_USER/EMAIL_PASSWORD');
    }

    async verifyTransporter() {
        try {
            await this.transporter.verify();
            this.isConfigured = true;
            console.log('✅ Email service ready');
        } catch (error) {
            console.log('❌ Email service error:', error.message);
            this.isConfigured = false;
        }
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.isConfigured) {
            console.log('⚠️  Email not configured - skipping email to:', to);
            return {
                success: false,
                error: 'Email service not configured'
            };
        }

        try {
            const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

            const result = await this.transporter.sendMail({
                from,
                to,
                subject,
                html,
                text: text || this.htmlToText(html)
            });

            console.log(`✅ Email sent to ${to}: ${subject}`);
            return {
                success: true,
                messageId: result.messageId
            };
        } catch (error) {
            console.error('❌ Email send error:', error.message);
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
}

module.exports = new EmailService();
