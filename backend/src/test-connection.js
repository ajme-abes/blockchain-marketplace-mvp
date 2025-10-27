const { ethers } = require('ethers');

async function testConnection() {
  console.log('🔗 Testing Blockchain Connection...');
  
  try {
    // ethers v5 syntax
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    
    // Test basic connection
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ Connected to blockchain');
    console.log('📦 Current block:', blockNumber);
    
    // Test network info
    const network = await provider.getNetwork();
    console.log('🌐 Network:', network.name, '(Chain ID:', network.chainId + ')');
    
    // Test account balance
    const accounts = await provider.listAccounts();
    console.log('👛 Available accounts:', accounts.length);
    
    if (accounts.length > 0) {
      const balance = await provider.getBalance(accounts[0]);
      console.log('💰 Account #0 balance:', ethers.utils.formatEther(balance), 'ETH');
    }
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('💡 Make sure hardhat node is running: cd blockchain && npx hardhat node');
  }
}

testConnection();