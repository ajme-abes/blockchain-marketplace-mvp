// backend/scripts/testChapa.js
require('dotenv').config({ path: './.env' }); // 👈 add this line
const axios = require('axios');

async function testChapaConnection() {
  const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
  const baseURL = 'https://api.chapa.co/v1';
  
  console.log('🔐 Testing Chapa connection...');
  console.log('Secret Key (first 10 chars):', chapaSecretKey ? chapaSecretKey.substring(0, 10) + '...' : 'MISSING');
  
  try {
    const response = await axios.get(`${baseURL}/banks`, {
      headers: {
        'Authorization': `Bearer ${chapaSecretKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Chapa connection successful!');
    console.log('Available banks:', response.data.data.length);
    
  } catch (error) {
    console.log('❌ Chapa connection failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    console.log('Message:', error.message);
  }
}

testChapaConnection();
