// Test script to verify production webhook endpoint
const axios = require('axios');

async function testProductionWebhook() {
    console.log('🧪 Testing Production Webhook Endpoint\n');

    const webhookUrl = 'https://ethiotrust-backend.onrender.com/api/payments/webhook/chapa';

    // Sample webhook data (similar to what Chapa sends)
    const testWebhookData = {
        event: 'charge.success',
        data: {
            id: 'test_payment_id',
            tx_ref: 'test_tx_ref_' + Date.now(),
            amount: 100,
            currency: 'ETB',
            status: 'success',
            reference: 'test_reference',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    };

    try {
        console.log('📤 Sending test webhook to production...');
        console.log('🔗 URL:', webhookUrl);
        console.log('📝 Data:', JSON.stringify(testWebhookData, null, 2));
        console.log('');

        const response = await axios.post(webhookUrl, testWebhookData, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Chapa-Webhook-Test/1.0'
            },
            timeout: 30000 // 30 seconds timeout
        });

        console.log('✅ Webhook endpoint is accessible!');
        console.log('📊 Response status:', response.status);
        console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
        console.log('');

        if (response.status === 200) {
            console.log('🎉 SUCCESS: Production webhook endpoint is working!');
            console.log('💡 You can now update Chapa dashboard with this URL:');
            console.log('   ', webhookUrl);
        } else {
            console.log('⚠️ Unexpected response status:', response.status);
        }

    } catch (error) {
        console.error('❌ Webhook test failed!');

        if (error.response) {
            console.error('📊 Response status:', error.response.status);
            console.error('📊 Response data:', error.response.data);

            if (error.response.status === 404) {
                console.log('💡 404 Error: Webhook endpoint not found');
                console.log('   Check if the route is correctly configured');
            } else if (error.response.status === 500) {
                console.log('💡 500 Error: Server error processing webhook');
                console.log('   Check server logs for more details');
            }
        } else if (error.code === 'ECONNREFUSED') {
            console.error('💡 Connection refused: Server might be sleeping');
            console.log('   Try accessing the main site first to wake it up:');
            console.log('   https://ethiotrust-backend.onrender.com');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('💡 Timeout: Server took too long to respond');
            console.log('   This might happen if Render is starting up');
        } else {
            console.error('💡 Network error:', error.message);
        }

        console.log('');
        console.log('🔧 Troubleshooting steps:');
        console.log('1. Check if backend is running: https://ethiotrust-backend.onrender.com');
        console.log('2. Check Render logs for errors');
        console.log('3. Verify webhook route exists in payments.js');
        console.log('4. Test with a simple GET request first');
    }
}

// Also test if the server is awake
async function testServerHealth() {
    console.log('🏥 Testing server health...');

    try {
        const response = await axios.get('https://ethiotrust-backend.onrender.com/api/health', {
            timeout: 10000
        });

        console.log('✅ Server is awake and responding');
        return true;
    } catch (error) {
        console.log('⚠️ Server health check failed:', error.message);
        console.log('💡 Server might be sleeping. Trying to wake it up...');

        try {
            // Try the main endpoint to wake up the server
            await axios.get('https://ethiotrust-backend.onrender.com', {
                timeout: 30000
            });
            console.log('✅ Server wake-up request sent');
            return false; // Need to wait a bit
        } catch (wakeError) {
            console.log('❌ Failed to wake up server:', wakeError.message);
            return false;
        }
    }
}

async function runTest() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  PRODUCTION WEBHOOK ENDPOINT TEST');
    console.log('═══════════════════════════════════════════════════════\n');

    // First check if server is awake
    const isAwake = await testServerHealth();

    if (!isAwake) {
        console.log('\n⏳ Waiting 30 seconds for server to wake up...');
        await new Promise(resolve => setTimeout(resolve, 30000));
    }

    console.log('');
    await testProductionWebhook();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  TEST COMPLETED');
    console.log('═══════════════════════════════════════════════════════');
}

runTest();