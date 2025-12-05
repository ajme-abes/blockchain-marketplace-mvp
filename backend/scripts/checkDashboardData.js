// backend/scripts/checkDashboardData.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDashboardData() {
    try {
        console.log('\n📊 Checking Dashboard Data...\n');

        // Check users
        const totalUsers = await prisma.user.count();
        console.log('👥 Total Users:', totalUsers);

        const buyers = await prisma.user.count({ where: { role: 'BUYER' } });
        console.log('🛒 Buyers:', buyers);

        const producers = await prisma.user.count({ where: { role: 'PRODUCER' } });
        console.log('🏭 Producers:', producers);

        const verifiedProducers = await prisma.producer.count({
            where: { verificationStatus: 'VERIFIED' }
        });
        console.log('✅ Verified Producers:', verifiedProducers);

        // Check products
        const totalProducts = await prisma.product.count();
        console.log('\n📦 Total Products:', totalProducts);

        const activeProducts = await prisma.product.count({
            where: { status: 'ACTIVE' }
        });
        console.log('✅ Active Products:', activeProducts);

        // Check orders
        const totalOrders = await prisma.order.count();
        console.log('\n📋 Total Orders:', totalOrders);

        const confirmedOrders = await prisma.order.count({
            where: { paymentStatus: 'CONFIRMED' }
        });
        console.log('✅ Confirmed Orders:', confirmedOrders);

        const pendingOrders = await prisma.order.count({
            where: { paymentStatus: 'PENDING' }
        });
        console.log('⏳ Pending Orders:', pendingOrders);

        // Check revenue
        const revenue = await prisma.order.aggregate({
            where: { paymentStatus: 'CONFIRMED' },
            _sum: { totalAmount: true }
        });

        const totalRevenue = revenue._sum.totalAmount || 0;
        console.log('\n💰 Total Revenue:', totalRevenue.toLocaleString(), 'ETB');

        if (totalRevenue >= 1000000) {
            console.log('   Display:', `ETB ${(totalRevenue / 1000000).toFixed(1)}M`);
        } else if (totalRevenue >= 1000) {
            console.log('   Display:', `ETB ${(totalRevenue / 1000).toFixed(1)}K`);
        } else {
            console.log('   Display:', `ETB ${totalRevenue.toLocaleString()}`);
        }

        // Check disputes
        const openDisputes = await prisma.dispute.count({
            where: { status: 'OPEN' }
        });
        console.log('\n⚠️  Open Disputes:', openDisputes);

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 DASHBOARD SUMMARY');
        console.log('='.repeat(50));

        if (totalUsers === 0) {
            console.log('⚠️  No users found - Database might be empty');
            console.log('💡 Run: npm run seed:admin to create admin user');
        } else if (totalOrders === 0) {
            console.log('⚠️  No orders found - No transaction data yet');
            console.log('💡 Create test orders through the frontend');
        } else if (confirmedOrders === 0) {
            console.log('⚠️  No confirmed orders - All orders are pending');
            console.log('💡 Confirm payments to see revenue data');
        } else {
            console.log('✅ Dashboard has data!');
            console.log(`   ${totalUsers} users, ${totalOrders} orders, ${totalRevenue.toLocaleString()} ETB revenue`);
        }

        console.log('='.repeat(50) + '\n');

    } catch (error) {
        console.error('❌ Error checking dashboard data:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    checkDashboardData();
}

module.exports = checkDashboardData;
