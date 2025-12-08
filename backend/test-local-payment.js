// Test local payment processing without real Chapa webhooks
require('dotenv').config();
const axios = require('axios');

async function testLocalPayment() {
    console.log('🧪 Testing Local Payment Processing\n');

    const localApiUrl = 'http://localhost:5000/api';

    // Step 1: Create a test order first (you'll need to do this through the UI or API)
    console.log('📝 Step 1: Create an order through your frontend first');
    console.log('   - Go to: http://localhost:8080');
    console.log('   - Add items to cart');
    console.log('   - Proceed to checkout');
    console.log('   - Note the order ID from the response\n');

    // Step 2: Simulate payment initiation
    const testOrderId = 'your-order-id-here'; // Replace with actual order ID
    const testPaymentData = {
        orderId: testOrderId,
        amount: 100,
        currency: 'ETB',
        paymentMethod: 'chapa'
    };

    try {
        console.log('💳 Step 2: Initiating payment...');
        console.log('📝 Payment data:', testPaymentData);

        // This would normally be done through your frontend
        const paymentResponse = await axios.post(`${localApiUrl}/payments/initiate`, testPaymentData, {
            headers: {
                'Content-Type': 'application/json',
                // Add authorization header if needed
                // 'Authorization': 'Bearer your-jwt-token'
            }
        });

        console.log('✅ Payment initiated successfully');
        console.log('📊 Response:', paymentResponse.data);

        const paymentReference = paymentResponse.data.reference;

        // Step 3: Simulate successful webhook
        console.log('\n🔄 Step 3: Simulating Chapa webhook...');

        const webhookData = {
            event: 'charge.success',
            data: {
                id: 'chapa_' + Date.now(),
                tx_ref: paymentReference,
                amount: testPaymentData.amount,
                currency: testPaymentData.currency,
                status: 'success',
                reference: paymentReference,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                customer: {
                    email: 'test@example.com',
                    name: 'Test User'
                }
            }
        };

        const webhookResponse = await axios.post(`${localApiUrl}/payments/webhook/chapa`, webhookData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Webhook processed successfully');
        console.log('📊 Webhook response:', webhookResponse.data);

        console.log('\n🎉 LOCAL PAYMENT TEST COMPLETED!');
        console.log('💡 Check your database to see if payment was confirmed');

    } catch (error) {
        console.error('❌ Test failed:', error.message);

        if (error.response) {
            console.error('📊 Response status:', error.response.status);
            console.error('📊 Response data:', error.response.data);
        }

        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure backend is running: npm run dev');
        console.log('2. Make sure you have a valid order ID');
        console.log('3. Check if you need authentication headers');
        console.log('4. Verify the API endpoints exist');
    }
}

// Helper function to test just the webhook endpoint
async function testWebhookOnly() {
    console.log('🔄 Testing webhook endpoint only...\n');

    const webhookData = {
        event: 'charge.success',
        data: {
            id: 'test_payment_' + Date.now(),
            tx_ref: 'test_ref_' + Date.now(),
            amount: 100,
            currency: 'ETB',
            status: 'success',
            reference: 'test_reference_' + Date.now(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    };

    try {
        const response = await axios.post('http://localhost:5000/api/payments/webhook/chapa', webhookData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Webhook test successful');
        console.log('📊 Response:', response.data);

    } catch (error) {
        console.error('❌ Webhook test failed:', error.message);
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📊 Data:', error.response.data);
        }
    }
}

// Command line interface
const command = process.argv[2];

if (command === 'webhook') {
    testWebhookOnly();
} else if (command === 'full') {
    testLocalPayment();
} else {
    console.log('🧪 Local Payment Testing Tool\n');
    console.log('Usage:');
    console.log('  node test-local-payment.js webhook  # Test webhook only');
    console.log('  node test-local-payment.js full     # Test full payment flow');
    console.log('\nFor full testing:');
    console.log('1. Start your backend: npm run dev');
    console.log('2. Create an order through frontend');
    console.log('3. Run: node test-local-payment.js full');
}