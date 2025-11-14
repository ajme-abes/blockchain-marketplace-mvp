const blockchainService = require('./services/blockchainService');

async function testBlockchainStatus() {
  try {
    console.log('🔗 Testing blockchain service status...');
    
    const status = await blockchainService.getBlockchainStatus();
    console.log('📊 Blockchain status:', JSON.stringify(status, null, 2));
    
    // Test if we can connect to contract
    if (status.connected) {
      console.log('✅ Blockchain connected successfully');
      console.log('👛 Wallet:', status.wallet.address);
      console.log('📄 Contract:', status.contractAddress);
      console.log('👑 Is Owner:', status.wallet.isContractOwner);
    } else {
      console.log('❌ Blockchain not connected:', status.message);
    }
    
  } catch (error) {
    console.error('💥 Blockchain status test failed:', error);
  }
}

testBlockchainStatus();