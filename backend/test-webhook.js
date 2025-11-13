// Create a test file: backend/test-webhook.js
const axios = require('axios');

async function testWebhook() {
  try {
    const webhookData = {
      tx_ref: 'ord-3cde1cbf-1763064578763',
      status: 'success',
      transaction_id: 'test-tx-12345',
      currency: 'ETB',
      amount: '200'
    };

    console.log('🔧 Testing webhook endpoint...');
    
    const response = await axios.post('http://localhost:5000/api/payments/webhook/chapa', webhookData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Webhook test successful:', response.data);
  } catch (error) {
    console.error('❌ Webhook test failed:', error.response?.data || error.message);
  }
}

testWebhook();