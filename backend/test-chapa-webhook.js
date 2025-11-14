const axios = require('axios');

async function testChapaWebhook() {
  try {
    console.log('🎯 TESTING CHAPA WEBHOOK WITH BLOCKCHAIN...');
    
    // Use your ACTUAL payment reference from logs
    const webhookData = {
      tx_ref: 'ord-2bfb8088-1763108568433', // From your payment logs
      transaction_id: 'chapa-test-tx-' + Date.now(),
      status: 'success',
      amount: '90',
      currency: 'ETB'
    };

    console.log('📤 Sending Chapa webhook simulation...');
    console.log('📝 Webhook data:', webhookData);
    
    const response = await axios.post(
      'http://localhost:5000/api/payments/webhook/chapa', 
      webhookData,
      { timeout: 30000 }
    );
    
    console.log('✅ CHAPA WEBHOOK TEST SUCCESSFUL!');
    console.log('📊 Full response:', JSON.stringify(response.data, null, 2));

    // Check blockchain specifically
    if (response.data.data && response.data.data.blockchain) {
      const blockchain = response.data.data.blockchain;
      if (blockchain.recorded) {
        console.log('🎉 BLOCKCHAIN RECORDING SUCCESS!');
        console.log('🔗 Transaction Hash:', blockchain.transactionHash);
        console.log('📄 Blockchain Order ID:', blockchain.blockchainOrderId);
        
        // Verify on Polygonscan
        console.log('🔍 Verify on Polygonscan:');
        console.log(`   https://amoy.polygonscan.com/tx/${blockchain.transactionHash}`);
      } else {
        console.log('❌ BLOCKCHAIN RECORDING FAILED:', blockchain.error);
      }
    } else {
      console.log('⚠️ No blockchain data in response');
    }

  } catch (error) {
    console.error('💥 WEBHOOK TEST FAILED:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testChapaWebhook();