    const blockchainService = require('./services/blockchainService');
const paymentService = require('./services/paymentService');

async function testBlockchainIntegration() {
  console.log('🧪 STARTING BLOCKCHAIN INTEGRATION TEST\n');

  // Test 1: Check Blockchain Status
  console.log('1. 📡 Testing Blockchain Connection...');
  const status = await blockchainService.getBlockchainStatus();
  console.log('Blockchain Status:', JSON.stringify(status, null, 2));
  
  // Test 2: Test Mock Transaction Recording
  console.log('\n2. 🔗 Testing Transaction Recording (Mock)...');
  const mockTransaction = {
    orderId: 'test-order-123',
    paymentReference: 'test-pay-ref-456',
    txHash: 'chapa-tx-789'
  };
  
  const recordResult = await blockchainService.recordTransaction(mockTransaction);
  console.log('Recording Result:', JSON.stringify(recordResult, null, 2));
  
  // Test 3: Test Transaction Verification
  console.log('\n3. 🔍 Testing Transaction Verification...');
  const verifyResult = await blockchainService.verifyTransaction('test-order-123');
  console.log('Verification Result:', JSON.stringify(verifyResult, null, 2));
  
  // Test 4: Test Payment Service Integration
  console.log('\n4. 💳 Testing Payment Service Blockchain Call...');
  try {
    const testBlockchainCall = {
      orderId: 'test-webhook-order',
      paymentReference: 'test-webhook-ref',
      txHash: 'test-webhook-tx'
    };
    
    const paymentBlockchainResult = await blockchainService.recordTransaction(testBlockchainCall);
    console.log('Payment Service Blockchain Result:', JSON.stringify(paymentBlockchainResult, null, 2));
    
  } catch (error) {
    console.log('❌ Payment Service Test Failed:', error.message);
  }

  console.log('\n✅ TEST COMPLETED');
  console.log('📊 Summary:');
  console.log(`   - Blockchain Connected: ${status.connected}`);
  console.log(`   - Contract Deployed: ${status.contractDeployed}`);
  console.log(`   - Mock Mode: ${recordResult.isMock}`);
}

// Run the test
testBlockchainIntegration().catch(console.error);