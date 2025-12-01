// backend/test-payout-api.js
const axios = require('axios');

async function testPayoutAPI() {
    try {
        console.log('🧪 Testing Payout API Endpoints...\n');

        // You'll need to replace this with a valid admin token
        const token = process.env.ADMIN_TOKEN || 'YOUR_ADMIN_TOKEN_HERE';

        console.log('1️⃣ Testing GET /api/payouts/pending');
        try {
            const response = await axios.get('http://localhost:5000/api/payouts/pending', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('✅ Success!');
            console.log('Response:', JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.log('❌ Error:', error.response?.data || error.message);
        }

        console.log('\n2️⃣ Testing GET /api/payouts/due');
        try {
            const response = await axios.get('http://localhost:5000/api/payouts/due', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('✅ Success!');
            console.log('Response:', JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.log('❌ Error:', error.response?.data || error.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testPayoutAPI();
