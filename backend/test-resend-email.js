// Test script for Resend email service
require('dotenv').config();
const { Resend } = require('resend');

async function testResendEmail() {
    console.log('🧪 Testing Resend Email Service\n');

    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || '❌ Not set');
    console.log('');

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY not set in environment');
        console.log('\n💡 Set it in .env file:');
        console.log('   RESEND_API_KEY=re_your_api_key_here');
        return;
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const testEmail = {
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: 'haajisemir@gmail.com', // Test email from logs
            subject: 'Test Email from EthioTrust Marketplace',
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
              <h1>🧪 Test Email</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>This is a test email from EthioTrust Marketplace to verify that Resend email service is working correctly.</p>
              <p><strong>Test Details:</strong></p>
              <ul>
                <li>Service: Resend</li>
                <li>From: ${process.env.EMAIL_FROM || 'onboarding@resend.dev'}</li>
                <li>Time: ${new Date().toISOString()}</li>
              </ul>
              <p>If you received this email, the email service is working! ✅</p>
            </div>
            <div class="footer">
              <p>This is a test email from EthioTrust Marketplace</p>
              <p>&copy; 2025 EthioTrust Marketplace</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: 'This is a test email from EthioTrust Marketplace. If you received this, the email service is working!'
        };

        console.log('📧 Sending test email...');
        console.log('  From:', testEmail.from);
        console.log('  To:', testEmail.to);
        console.log('  Subject:', testEmail.subject);
        console.log('');

        const result = await resend.emails.send(testEmail);

        console.log('🔧 Resend API Response:');
        console.log(JSON.stringify(result, null, 2));
        console.log('');

        if (result.data && result.data.id) {
            console.log('✅ Email sent successfully!');
            console.log('📧 Message ID:', result.data.id);
            console.log('');
            console.log('💡 Check your inbox at:', testEmail.to);
            console.log('💡 Also check spam/junk folder');
        } else if (result.error) {
            console.error('❌ Email sending failed!');
            console.error('Error:', result.error);
            console.log('');

            if (result.error.message && result.error.message.includes('domain')) {
                console.log('💡 Domain Issue Detected:');
                console.log('   Resend requires a verified domain for the "from" address');
                console.log('   Current from address:', testEmail.from);
                console.log('');
                console.log('   Solutions:');
                console.log('   1. Use onboarding@resend.dev (Resend\'s test domain)');
                console.log('   2. Verify your own domain in Resend dashboard');
                console.log('   3. Update EMAIL_FROM in environment variables');
            }
        } else {
            console.log('⚠️ Unexpected response format:', result);
        }

    } catch (error) {
        console.error('❌ Test failed with error:');
        console.error('Error:', error.message);
        console.error('');

        if (error.message.includes('API key')) {
            console.log('💡 API Key Issue:');
            console.log('   1. Check that RESEND_API_KEY is correct');
            console.log('   2. Get your API key from: https://resend.com/api-keys');
            console.log('   3. Make sure the key starts with "re_"');
        }
    }
}

// Run test
testResendEmail();
