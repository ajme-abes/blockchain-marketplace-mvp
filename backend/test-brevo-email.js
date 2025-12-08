// Test script for Brevo email service
require('dotenv').config();
const axios = require('axios');

async function testBrevoEmail() {
    console.log('🧪 Testing Brevo Email Service\n');

    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('  BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || '❌ Not set');
    console.log('');

    if (!process.env.BREVO_API_KEY) {
        console.error('❌ BREVO_API_KEY not set in environment');
        console.log('\n💡 Get it from Brevo dashboard:');
        console.log('   1. Go to https://app.brevo.com');
        console.log('   2. Sign up for free account');
        console.log('   3. Go to "SMTP & API" → "API Keys"');
        console.log('   4. Create new API key');
        console.log('   5. Set BREVO_API_KEY=xkeysib-your_api_key_here');
        return;
    }

    try {
        const apiKey = process.env.BREVO_API_KEY;
        const baseURL = 'https://api.brevo.com/v3';

        // First, test account info
        console.log('🔧 Testing Brevo account configuration...');
        try {
            const accountResponse = await axios.get(
                `${baseURL}/account`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'api-key': apiKey
                    }
                }
            );

            console.log('✅ Account verified:', accountResponse.data?.email);
            console.log('📊 Plan type:', accountResponse.data?.plan?.type);
            console.log('📧 Credits left:', accountResponse.data?.plan?.creditsLeft);
            console.log('');
        } catch (accountError) {
            console.error('❌ Account error:', accountError.response?.status, accountError.response?.data);
            if (accountError.response?.status === 401) {
                console.log('💡 API key is invalid. Get a new one from Brevo dashboard.');
            }
            console.log('');
        }

        // Test email sending
        const from = process.env.EMAIL_FROM || 'EthioTrust Test <noreply@ethiotrust.com>';

        // Parse the from address
        let fromEmail, fromName;
        if (from.includes('<') && from.includes('>')) {
            const match = from.match(/^(.*?)\s*<(.+)>$/);
            if (match) {
                fromName = match[1].trim();
                fromEmail = match[2].trim();
            } else {
                fromEmail = from;
                fromName = 'EthioTrust Test';
            }
        } else {
            fromEmail = from;
            fromName = 'EthioTrust Test';
        }

        const testEmail = {
            sender: {
                name: fromName,
                email: fromEmail
            },
            to: [
                {
                    email: 'ajmeabes@gmail.com', // Test email from logs
                    name: 'Test User'
                }
            ],
            subject: 'Test Email from EthioTrust Marketplace (Brevo)',
            htmlContent: `
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
              <h1>🧪 Brevo Test Email</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>This is a test email from EthioTrust Marketplace to verify that Brevo email service is working correctly.</p>
              <p><strong>Test Details:</strong></p>
              <ul>
                <li>Service: Brevo (Sendinblue)</li>
                <li>From: ${fromName} &lt;${fromEmail}&gt;</li>
                <li>Time: ${new Date().toISOString()}</li>
                <li>Method: HTTP API (not SMTP)</li>
              </ul>
              <p>If you received this email, Brevo is working! ✅</p>
              <p>Brevo works perfectly with Render because it uses HTTP API instead of SMTP.</p>
            </div>
            <div class="footer">
              <p>This is a test email from EthioTrust Marketplace</p>
              <p>&copy; 2025 EthioTrust Marketplace</p>
            </div>
          </div>
        </body>
        </html>
      `,
            textContent: 'This is a test email from EthioTrust Marketplace using Brevo. If you received this, the email service is working!'
        };

        console.log('📧 Sending test email...');
        console.log('  From:', `${fromName} <${fromEmail}>`);
        console.log('  To:', testEmail.to[0].email);
        console.log('  Subject:', testEmail.subject);
        console.log('');

        const response = await axios.post(
            `${baseURL}/smtp/email`,
            testEmail,
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'api-key': apiKey
                }
            }
        );

        console.log('🔧 Brevo API Response:');
        console.log('Status:', response.status, response.statusText);
        console.log('Data:', JSON.stringify(response.data, null, 2));
        console.log('');

        if (response.status === 201) {
            console.log('✅ Email sent successfully via Brevo!');
            console.log('📧 Message ID:', response.data?.messageId || 'N/A');
            console.log('');
            console.log('💡 Check your inbox at:', testEmail.to[0].email);
            console.log('💡 Also check spam/junk folder');
            console.log('💡 Brevo has excellent deliverability rates');
        } else {
            console.log('⚠️ Unexpected response:', response.status, response.data);
        }

    } catch (error) {
        console.error('❌ Test failed with error:');
        console.error('Error:', error.message);

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('');

            if (error.response.status === 401) {
                console.log('💡 Authentication Error (401):');
                console.log('   1. Check BREVO_API_KEY is correct');
                console.log('   2. Make sure it starts with "xkeysib-"');
                console.log('   3. Get new key from: https://app.brevo.com');
            } else if (error.response.status === 400) {
                console.log('💡 Bad Request Error (400):');
                console.log('   1. Check email addresses are valid');
                console.log('   2. Check sender email is verified');
                console.log('   3. Check email content format');
            } else if (error.response.status === 402) {
                console.log('💡 Payment Required (402):');
                console.log('   1. Check Brevo account limits');
                console.log('   2. You might have exceeded free tier (300 emails/day)');
                console.log('   3. Upgrade plan if needed');
            }
        }
    }
}

// Run test
testBrevoEmail();