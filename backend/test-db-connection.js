// Test database connection
const { Client } = require('pg');

// Replace this with your actual DATABASE_URL from Render
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://marketplace_user:password@host:5432/database';

async function testConnection() {
    console.log('🔍 Testing database connection...\n');

    // Parse the URL to show what we're connecting to
    try {
        const url = new URL(DATABASE_URL);
        console.log('📋 Connection Details:');
        console.log(`Host: ${url.hostname}`);
        console.log(`Port: ${url.port || 5432}`);
        console.log(`Database: ${url.pathname.slice(1)}`);
        console.log(`Username: ${url.username}`);
        console.log(`Password: ${url.password ? '***' + url.password.slice(-4) : 'NOT SET'}\n`);
    } catch (error) {
        console.error('❌ Invalid DATABASE_URL format');
        return;
    }

    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔌 Attempting to connect...');
        await client.connect();
        console.log('✅ Connection successful!\n');

        // Test a simple query
        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
        console.log('📊 Database Info:');
        console.log(`Current Time: ${result.rows[0].current_time}`);
        console.log(`PostgreSQL Version: ${result.rows[0].pg_version.split(',')[0]}\n`);

        // Check if tables exist
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log('📋 Available Tables:');
        tables.rows.forEach(row => console.log(`  - ${row.table_name}`));

        console.log('\n🎉 Database connection test completed successfully!');
        console.log('\n📝 Use these details in pgAdmin:');
        const url = new URL(DATABASE_URL);
        console.log(`Host: ${url.hostname}`);
        console.log(`Port: ${url.port || 5432}`);
        console.log(`Database: ${url.pathname.slice(1)}`);
        console.log(`Username: ${url.username}`);
        console.log(`Password: [copy from Render dashboard]`);
        console.log(`SSL Mode: Require`);

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('\n💡 Troubleshooting:');
        console.error('1. Check if DATABASE_URL is correct in your .env file');
        console.error('2. Verify the host address includes the full domain');
        console.error('3. Make sure your IP is not blocked by Render');
        console.error('4. Check if the database service is running on Render');
    } finally {
        await client.end();
    }
}

testConnection();