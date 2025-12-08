// Test script for email-based rate limiting
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testRegistrationRateLimit() {
    console.log('🧪 Testing Registration Rate Limiting by Email\n');

    const testEmail = `test${Date.now()}@example.com`;

    console.log(`📧 Testing with email: ${testEmail}\n`);

    // Try to register 6 times with the same email (limit is 5)
    for (let i = 1; i <= 6; i++) {
        try {
            console.log(`Attempt ${i}...`);
            const response = await axios.post(`${API_URL}/user/register`, {
                email: testEmail,
                password: 'Test123!',
                name: `Test User ${i}`,
                phone: `+25191123456${i}`,
                role: 'BUYER'
            });

            console.log(`✅ Attempt ${i}: Success (${response.status})`);
            console.log(`   Message: ${response.data.message}\n`);

        } catch (error) {
            if (error.response) {
                console.log(`❌ Attempt ${i}: Failed (${error.response.status})`);
                console.log(`   Error: ${error.response.data.error}`);
                console.log(`   Code: ${error.response.data.code}`);
                if (error.response.data.attemptsLeft !== undefined) {
                    console.log(`   Attempts Left: ${error.response.data.attemptsLeft}/${error.response.data.maxAttempts}`);
                }
                if (error.response.data.retryAfter) {
                    console.log(`   Retry After: ${error.response.data.retryAfter} seconds`);
                }
                console.log('');
            } else {
                console.log(`❌ Attempt ${i}: Network error - ${error.message}\n`);
            }
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n🧪 Testing with different email (should work)...\n');

    // Try with a different email (should work)
    const differentEmail = `different${Date.now()}@example.com`;
    try {
        const response = await axios.post(`${API_URL}/user/register`, {
            email: differentEmail,
            password: 'Test123!',
            name: 'Different User',
            phone: '+251911234999',
            role: 'BUYER'
        });

        console.log(`✅ Different email registration: Success (${response.status})`);
        console.log(`   Message: ${response.data.message}\n`);

    } catch (error) {
        if (error.response) {
            console.log(`❌ Different email registration: Failed (${error.response.status})`);
            console.log(`   Error: ${error.response.data.error}\n`);
        } else {
            console.log(`❌ Network error: ${error.message}\n`);
        }
    }
}

async function testLoginRateLimit() {
    console.log('\n🧪 Testing Login Rate Limiting by Email\n');

    const testEmail = 'nonexistent@example.com';

    console.log(`📧 Testing with email: ${testEmail}\n`);

    // Try to login 6 times with wrong password (limit is 5)
    for (let i = 1; i <= 6; i++) {
        try {
            console.log(`Login attempt ${i}...`);
            const response = await axios.post(`${API_URL}/auth/login`, {
                email: testEmail,
                password: 'WrongPassword123!'
            });

            console.log(`✅ Login attempt ${i}: Success (${response.status})\n`);

        } catch (error) {
            if (error.response) {
                console.log(`❌ Login attempt ${i}: Failed (${error.response.status})`);
                console.log(`   Error: ${error.response.data.error}`);
                console.log(`   Code: ${error.response.data.code}`);
                if (error.response.data.attemptsLeft !== undefined) {
                    console.log(`   Attempts Left: ${error.response.data.attemptsLeft}/${error.response.data.maxAttempts}`);
                }
                if (error.response.data.retryAfter) {
                    console.log(`   Retry After: ${error.response.data.retryAfter} seconds`);
                }
                console.log('');
            } else {
                console.log(`❌ Login attempt ${i}: Network error - ${error.message}\n`);
            }
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

async function runTests() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  EMAIL-BASED RATE LIMITING TEST');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
        await testRegistrationRateLimit();
        await testLoginRateLimit();

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('  ✅ ALL TESTS COMPLETED');
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Test suite error:', error.message);
    }
}

// Run tests
runTests();
