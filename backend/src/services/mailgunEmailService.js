// backend/src/services/mailgunEmailService.js
// Email service using Mailgun (reliable and generous free tier)

const formData = require('form-data');
const Mailgun = require('mailgun.js');

class MailgunEmailService {
    constructor() {
        this.isConfigured = false;
        this.initMailgun();
    }

    initMailgun() {
        if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
            console.log('⚠️  Mailgun not configured - Set MAILGUN_API_KEY and MAILGUN_DOMAIN in environment');
            return;
        }

        try {
            const mailgun = new Mailgun(formData);
            this.mg = mailgun.client({
                username: 'api',
                key: process.env.MAILGUN_API_KEY,
                url: 'https://api.mailgun.net' // Use EU endpoint if needed: https://api.eu.mailgun.net
            });

            this.domain = process.env.MAILGUN_DOMAIN;
            this.isConfigured = true;
            console.log('✅ Mailgun email service initialized');
            console.log('🔧 Using domain:', this.domain);
        } catch (error) {
            console.error('❌ Mailgun initialization error:', error.message);
            this.isConfigured = false;
        }
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.isConfigured) {
            console.log('⚠️  Mailgun not configured - skipping email to:', to);
            return {
                success: false,
                error: 'Mailgun not configured',
                note: 'Set MAILGUN_API_KEY and MAILGUN_DOMAIN in environment variables'
            };
        }

        try {
            const from = process.env.EMAIL_FROM || `EthioTrust Marketplace <noreply@${this.domain}>`;

            console.log('🔧 Sending email via Mailgun:', {
                to,
                subject,
                from,
                domain: this.domain
            });

            const messageData = {
                from: from,
                to: to,
                subject: subject,
                html: html,
                text: text || this.htmlToText(html)
            };

            const result = await this.mg.messages.create(this.domain, messageData);

            console.log('🔧 Mailgun API response:', JSON.stringify(result, null, 2));

            if (result.id) {
                console.log(`✅ Email sent via Mailgun to ${to}: ${subject}`);
                console.log('📧 Message ID:', result.id);

                return {
                    success: true,
                    messageId: result.id
                };
            } else {
                console.error('⚠️ Email sent but no message ID returned:', result);
                return {
                    success: true,
                    messageId: 'unknown',
                    warning: 'No message ID in response'
                };
            }
        } catch (error) {
            console.error('❌ Mailgun send error:', error);
            console.error('❌ Error details:', error.message);

            // Handle specific Mailgun errors
            if (error.status === 401) {
                console.error('💡 Check MAILGUN_API_KEY - it might be invalid');
            } else if (error.status === 400) {
                console.error('💡 Check email format and MAILGUN_DOMAIN');
            } else if (error.status === 402) {
                console.error('💡 Mailgun account issue - check billing or limits');
            }

            return {
                success: false,
                error: error.message,
                status: error.status
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
            // Test the configuration by getting domain info
            const domainInfo = await this.mg.domains.get(this.domain);
            console.log('✅ Mailgun configuration verified');
            console.log('🔧 Domain status:', domainInfo.domain?.state);
            return true;
        } catch (error) {
            console.error('❌ Mailgun verification error:', error.message);
            return false;
        }
    }

    async getDomainInfo() {
        if (!this.isConfigured) {
            return { success: false, error: 'Not configured' };
        }

        try {
            const domainInfo = await this.mg.domains.get(this.domain);
            return {
                success: true,
                domain: domainInfo.domain?.name,
                state: domainInfo.domain?.state,
                type: domainInfo.domain?.type
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new MailgunEmailService();