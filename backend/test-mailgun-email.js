// Test script for Mailgun email service
require('dotenv').config();
const formData = require('form-data');
const Mailgun = require('mailgun.js');

async function testMailgunEmail() {
    console.log('🧪 Testing Mailgun Email Service\n');

    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('  MAILGUN_API_KEY:', process.env.MAILGUN_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('  MAILGUN_DOMAIN:', process.env.MAILGUN_DOMAIN || '❌ Not set');
    console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || '❌ Not set');
    console.log('');

    if (!process.env.MAILGUN_API_KEY) {
        console.error('❌ MAILGUN_API_KEY not set in environment');
        console.log('\n💡 Get it from Mailgun dashboard:');
        console.log('   1. Go to https://app.mailgun.com/mg/dashboard');
        console.log('   2. Click "API Keys" in sidebar');
        console.log('   3. Copy "Private API key"');
        console.log('   4. Set MAILGUN_API_KEY=key-your_api_key_here');
        return;
    }

    if (!process.env.MAILGUN_DOMAIN) {
        console.error('❌ MAILGUN_DOMAIN not set in environment');
        console.log('\n💡 Get it from Mailgun dashboard:');
        console.log('   1. Go to https://app.mailgun.com/mg/dashboard');
        console.log('   2. Click "Sending" → "Domains"');
        console.log('   3. Copy sandbox domain (e.g., sandbox123abc.mailgun.org)');
        console.log('   4. Set MAILGUN_DOMAIN=sandbox123abc.mailgun.org');
        return;
    }

    try {
        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({
            username: 'api',
            key: process.env.MAILGUN_API_KEY,
            url: 'https://api.mailgun.net'
        });

        const domain = process.env.MAILGUN_DOMAIN;
        const from = process.env.EMAIL_FROM || `EthioTrust Test <noreply@${domain}>`;

        // First, test domain info
        console.log('🔧 Testing domain configuration...');
        try {
            const domainInfo = await mg.domains.get(domain);
            console.log('✅ Domain found:', domainInfo.domain?.name);
            console.log('📊 Domain state:', domainInfo.domain?.state);
            console.log('📝 Domain type:', domainInfo.domain?.type);
            console.log('');
        } catch (domainError) {
            console.error('❌ Domain error:', domainError.message);
            if (domainError.status === 404) {
                console.log('💡 Domain not found. Check MAILGUN_DOMAIN is correct.');
            }
            console.log('');
        }

        // Test email sending
        const testEmail = {
            from: from,
            to: 'haajisemir@gmail.com', // Test email from logs
            subject: 'Test Email from EthioTrust Marketplace (Mailgun)',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 Mailgun Test Email</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>This is a test email from EthioTrust Marketplace to verify that Mailgun email service is working correctly.</p>
              <p><strong>Test Details:</strong></p>
              <ul>
                <li>Service: Mailgun</li>
                <li>Domain: ${domain}</li>
                <li>From: ${from}</li>
                <li>Time: ${new Date().toISOString()}</li>
              </ul>
              <p>If you received this email, Mailgun is working! ✅</p>
            </div>
            <div class="footer">
              <p>This is a test email from EthioTrust Marketplace</p>
              <p>&copy; 2025 EthioTrust Marketplace</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: 'This is a test email from EthioTrust Marketplace using Mailgun. If you received this, the email service is working!'
        };

        console.log('📧 Sending test email...');
        console.log('  From:', testEmail.from);
        console.log('  To:', testEmail.to);
        console.log('  Subject:', testEmail.subject);
        console.log('  Domain:', domain);
        console.log('');

        const result = await mg.messages.create(domain, testEmail);

        console.log('🔧 Mailgun API Response:');
        console.log(JSON.stringify(result, null, 2));
        console.log('');

        if (result.id) {
            console.log('✅ Email sent successfully via Mailgun!');
            console.log('📧 Message ID:', result.id);
            console.log('📧 Message:', result.message);
            console.log('');
            console.log('💡 Check your inbox at:', testEmail.to);
            console.log('💡 Also check spam/junk folder');
            console.log('💡 Sandbox domains can only send to authorized recipients');
        } else {
            console.log('⚠️ Unexpected response format:', result);
        }

    } catch (error) {
        console.error('❌ Test failed with error:');
        console.error('Error:', error.message);
        console.error('Status:', error.status);
        console.error('');

        if (error.status === 401) {
            console.log('💡 Authentication Error (401):');
            console.log('   1. Check MAILGUN_API_KEY is correct');
            console.log('   2. Make sure it starts with "key-"');
            console.log('   3. Get new key from: https://app.mailgun.com/mg/dashboard');
        } else if (error.status === 400) {
            console.log('💡 Bad Request Error (400):');
            console.log('   1. Check MAILGUN_DOMAIN is correct');
            console.log('   2. Check email addresses are valid');
            console.log('   3. For sandbox, recipient must be authorized');
        } else if (error.status === 402) {
            console.log('💡 Payment Required (402):');
            console.log('   1. Check Mailgun account billing');
            console.log('   2. You might have exceeded free tier limits');
            console.log('   3. Add payment method or upgrade plan');
        }
    }
}

// Run test
testMailgunEmail();