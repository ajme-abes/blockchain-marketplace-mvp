// backend/scripts/testAdminEndpoint.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAdminEndpoint() {
    try {
        console.log('\n🧪 Testing Admin Dashboard Endpoint...\n');

        // 1. Check if admin user exists
        console.log('1️⃣ Checking for admin user...');
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!admin) {
            console.log('❌ No admin user found!');
            console.log('💡 Run: npm run create:admin');
            return;
        }

        console.log('✅ Admin user found:', admin.email);

        // 2. Check database has data
        console.log('\n2️⃣ Checking database data...');
        const [totalUsers, totalOrders, totalRevenue] = await Promise.all([
            prisma.user.count(),
            prisma.order.count(),
            prisma.order.aggregate({
                where: { paymentStatus: 'CONFIRMED' },
                _sum: { totalAmount: true }
            })
        ]);

        console.log('✅ Total Users:', totalUsers);
        console.log('✅ Total Orders:', totalOrders);
        console.log('✅ Total Revenue:', totalRevenue._sum.totalAmount || 0, 'ETB');

        // 3. Test the service method directly
        console.log('\n3️⃣ Testing adminService.getEnhancedOverview()...');
        const adminService = require('../src/services/adminService');
        const result = await adminService.getEnhancedOverview('today');

        if (result.success) {
            console.log('✅ Service method works!');
            console.log('📊 Data returned:');
            console.log('   - Total Users:', result.data.totalUsers);
            console.log('   - Total Revenue:', result.data.totalRevenue, 'ETB');
            console.log('   - Orders Today:', result.data.ordersToday);
            console.log('   - Verified Producers:', result.data.verifiedProducers);
            console.log('   - Active Products:', result.data.activeProducts);
        } else {
            console.log('❌ Service method failed:', result.error);
        }

        // 4. Instructions for testing API
        console.log('\n4️⃣ To test the API endpoint:');
        console.log('   1. Make sure backend is running: npm run dev');
        console.log('   2. Login as admin in browser: http://localhost:8080/login');
        console.log('   3. Open browser console (F12)');
        console.log('   4. Copy your token: localStorage.getItem("authToken")');
        console.log('   5. Test API with curl:');
        console.log('\n   curl -H "Authorization: Bearer YOUR_TOKEN" \\');
        console.log('        http://localhost:5000/api/admin/overview?range=today');

        console.log('\n' + '='.repeat(60));
        console.log('✅ Backend data is ready!');
        console.log('📊 Revenue: ' + (totalRevenue._sum.totalAmount || 0).toLocaleString() + ' ETB');
        console.log('='.repeat(60));
        console.log('\n💡 If dashboard still shows ETB 0:');
        console.log('   1. Check you are logged in as ADMIN (not buyer/producer)');
        console.log('   2. Check browser console (F12) for errors');
        console.log('   3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
        console.log('   4. Clear browser cache and login again\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    testAdminEndpoint();
}

module.exports = testAdminEndpoint;
