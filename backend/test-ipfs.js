const ipfsService = require('./src/services/ipfsService');
const fs = require('fs');

async function testIPFS() {
  console.log('🌐 Testing IPFS service...');
  
  // Test 1: Upload a simple text file
  const testContent = 'Hello from Blockchain Marketplace! 🚀';
  const fileBuffer = Buffer.from(testContent, 'utf-8');
  
  console.log('📤 Uploading test file to IPFS...');
  
  const result = await ipfsService.uploadFile(
    fileBuffer,
    'test-file.txt',
    'DOCUMENT'
  );
  
  if (result.success) {
    console.log('✅ File uploaded to IPFS!');
    console.log(`📄 CID: ${result.cid}`);
    console.log(`🔗 View at: https://gateway.pinata.cloud/ipfs/${result.cid}`);
    console.log(`💾 Mock mode: ${result.isMock}`);
    
    // Test 2: Retrieve file info
    console.log('\n📥 Retrieving file metadata...');
    const metadata = await ipfsService.getIPFSMetadata(result.cid);
    
    if (metadata.success) {
      console.log('✅ Metadata retrieved:', metadata.metadata);
    }
  } else {
    console.log('❌ IPFS upload failed:', result.error);
  }
}

testIPFS();
