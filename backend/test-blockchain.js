const { ethers } = require('ethers');

async function testConnection() {
  try {
    const provider = new ethers.providers.JsonRpcProvider('https://rpc-amoy.polygon.technology');
    
    console.log('🔗 Testing Polygon Amoy connection...');
    
    // Test basic connection
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ Connected to Polygon Amoy');
    console.log('📦 Current block:', blockNumber);
    
    // Test contract access
    const contractAddress = '0x433325BAd35537A923CB5a5876eFEE1d6727fbFe';
    const contract = new ethers.Contract(contractAddress, [
      "function owner() external view returns (address)"
    ], provider);
    
    const owner = await contract.owner();
    console.log('✅ Contract accessible');
    console.log('👑 Contract owner:', owner);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();