// Enhanced webhook configuration helper for different environments
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const getWebhookConfig = () => {
    const environment = process.env.NODE_ENV || 'development';

    const config = {
        development: {
            // For local development - use ngrok or manual testing
            webhookUrl: process.env.LOCAL_WEBHOOK_URL || 'http://localhost:5000/api/payments/webhook/chapa',
            note: 'Use ngrok for local webhook testing: ngrok http 5000'
        },
        production: {
            // For production - use Render URL
            webhookUrl: 'https://ethiotrust-backend.onrender.com/api/payments/webhook/chapa',
            note: 'Production webhook URL for Chapa dashboard'
        }
    };

    return config[environment] || config.development;
};

const displayWebhookInfo = () => {
    const config = getWebhookConfig();
    const environment = process.env.NODE_ENV || 'development';

    console.log('\n🔗 WEBHOOK CONFIGURATION');
    console.log('═══════════════════════════════════════');
    console.log(`Environment: ${environment.toUpperCase()}`);
    console.log(`Webhook URL: ${config.webhookUrl}`);
    console.log(`Note: ${config.note}`);

    if (environment === 'development') {
        console.log('\n💡 FOR LOCAL DEVELOPMENT:');
        console.log('1. Start backend: npm run dev');
        console.log('2. Start ngrok: ngrok http 5000');
        console.log('3. Copy ngrok URL (e.g., https://abc123.ngrok.io)');
        console.log('4. Update Chapa webhook to: https://abc123.ngrok.io/api/payments/webhook/chapa');
        console.log('5. Test payments locally');
        console.log('6. Change back to production URL when done');
        console.log('\n🔧 QUICK COMMANDS:');
        console.log('   Test webhook only: node test-local-payment.js webhook');
        console.log('   Get webhook info:  node webhook-config.js');
        console.log('   Show all commands: node webhook-config.js commands');
    } else {
        console.log('\n💡 FOR PRODUCTION:');
        console.log('Update Chapa dashboard webhook URL to:');
        console.log(config.webhookUrl);
    }
    console.log('═══════════════════════════════════════\n');
};

const getQuickCommands = () => {
    return {
        production: {
            title: '🚀 PRODUCTION SETUP',
            steps: [
                '1. Go to Chapa Dashboard: https://dashboard.chapa.co',
                '2. Navigate to Settings → Webhooks',
                '3. Update webhook URL to: https://ethiotrust-backend.onrender.com/api/payments/webhook/chapa',
                '4. Save changes',
                '5. Test with real payment on live site'
            ]
        },
        development: {
            title: '💻 LOCAL DEVELOPMENT SETUP',
            steps: [
                '1. Start backend: npm run dev',
                '2. Start ngrok: ngrok http 5000',
                '3. Copy ngrok URL (e.g., https://abc123.ngrok.io)',
                '4. Update Chapa webhook to: https://abc123.ngrok.io/api/payments/webhook/chapa',
                '5. Test payments through local frontend',
                '6. When done, change Chapa webhook back to production URL'
            ]
        },
        testing: {
            title: '🧪 QUICK TESTING (NO CHAPA CHANGES)',
            steps: [
                '1. Start backend: npm run dev',
                '2. Test webhook: node test-local-payment.js webhook',
                '3. Test full flow: node test-local-payment.js full',
                '4. Check logs for webhook processing'
            ]
        }
    };
};

module.exports = {
    getWebhookConfig,
    displayWebhookInfo,
    getQuickCommands
};

// If run directly, display webhook info
if (require.main === module) {
    const command = process.argv[2];

    if (command === 'commands') {
        const commands = getQuickCommands();
        console.log('\n📋 WEBHOOK WORKFLOW COMMANDS\n');

        Object.values(commands).forEach(cmd => {
            console.log(cmd.title);
            console.log('═'.repeat(cmd.title.length - 2)); // Subtract emoji length
            cmd.steps.forEach(step => console.log(step));
            console.log('');
        });
    } else {
        displayWebhookInfo();
    }
}