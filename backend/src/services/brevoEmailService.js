// backend/src/services/brevoEmailService.js
// Email service using Brevo (Sendinblue) HTTP API - Works perfectly with Render

const axios = require('axios');

class BrevoEmailService {
    constructor() {
        this.isConfigured = false;
        this.initBrevo();
    }

    initBrevo() {
        if (!process.env.BREVO_API_KEY) {
            console.log('⚠️  Brevo not configured - Set BREVO_API_KEY in environment');
            return;
        }

        try {
            this.apiKey = process.env.BREVO_API_KEY;
            this.baseURL = 'https://api.brevo.com/v3';
            this.isConfigured = true;
            console.log('✅ Brevo email service initialized');
        } catch (error) {
            console.error('❌ Brevo initialization error:', error.message);
            this.isConfigured = false;
        }
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.isConfigured) {
            console.log('⚠️  Brevo not configured - skipping email to:', to);
            return {
                success: false,
                error: 'Brevo not configured',
                note: 'Set BREVO_API_KEY in environment variables'
            };
        }

        try {
            const from = process.env.EMAIL_FROM || 'EthioTrust Marketplace <noreply@ethiotrust.com>';

            // Parse the from address
            let fromEmail, fromName;
            if (from.includes('<') && from.includes('>')) {
                const match = from.match(/^(.*?)\s*<(.+)>$/);
                if (match) {
                    fromName = match[1].trim();
                    fromEmail = match[2].trim();
                } else {
                    fromEmail = from;
                    fromName = 'EthioTrust Marketplace';
                }
            } else {
                fromEmail = from;
                fromName = 'EthioTrust Marketplace';
            }

            console.log('🔧 Sending email via Brevo:', {
                to,
                subject,
                fromEmail,
                fromName
            });

            const emailData = {
                sender: {
                    name: fromName,
                    email: fromEmail
                },
                to: [
                    {
                        email: to,
                        name: to.split('@')[0] // Use email prefix as name
                    }
                ],
                subject: subject,
                htmlContent: html,
                textContent: text || this.htmlToText(html)
            };

            const response = await axios.post(
                `${this.baseURL}/smtp/email`,
                emailData,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'api-key': this.apiKey
                    }
                }
            );

            console.log('🔧 Brevo API response:', response.status, response.statusText);
            console.log('🔧 Response data:', JSON.stringify(response.data, null, 2));

            if (response.status === 201) {
                const messageId = response.data?.messageId || 'brevo-' + Date.now();
                console.log(`✅ Email sent via Brevo to ${to}: ${subject}`);
                console.log('📧 Message ID:', messageId);

                return {
                    success: true,
                    messageId: messageId
                };
            } else {
                console.error('⚠️ Unexpected Brevo response:', response.status, response.data);
                return {
                    success: false,
                    error: `Unexpected response: ${response.status}`,
                    details: response.data
                };
            }
        } catch (error) {
            console.error('❌ Brevo send error:', error);

            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response data:', error.response.data);

                // Handle specific Brevo errors
                if (error.response.status === 401) {
                    console.error('💡 Check BREVO_API_KEY - it might be invalid');
                } else if (error.response.status === 400) {
                    console.error('💡 Check email format and sender configuration');
                } else if (error.response.status === 402) {
                    console.error('💡 Brevo account issue - check billing or limits');
                }

                return {
                    success: false,
                    error: error.response.data?.message || error.message,
                    status: error.response.status
                };
            } else {
                console.error('❌ Network error:', error.message);
                return {
                    success: false,
                    error: error.message
                };
            }
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
            // Test the configuration by getting account info
            const response = await axios.get(
                `${this.baseURL}/account`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'api-key': this.apiKey
                    }
                }
            );

            console.log('✅ Brevo configuration verified');
            console.log('🔧 Account email:', response.data?.email);
            console.log('🔧 Plan type:', response.data?.plan?.type);
            return true;
        } catch (error) {
            console.error('❌ Brevo verification error:', error.message);
            return false;
        }
    }

    async getAccountInfo() {
        if (!this.isConfigured) {
            return { success: false, error: 'Not configured' };
        }

        try {
            const response = await axios.get(
                `${this.baseURL}/account`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'api-key': this.apiKey
                    }
                }
            );

            return {
                success: true,
                email: response.data?.email,
                plan: response.data?.plan?.type,
                credits: response.data?.plan?.creditsLeft
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new BrevoEmailService();