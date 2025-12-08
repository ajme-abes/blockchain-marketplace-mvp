// Test script to verify admin overview returns data for "month" range
const { prisma } = require('../src/config/database');
const adminService = require('../src/services/adminService');

async function testMonthRange() {
    try {
        console.log('🧪 Testing Admin Overview with "month" range...\n');

        // Test with different ranges
        const ranges = ['today', 'week', 'month'];

        for (const range of ranges) {
            console.log(`\n📊 Testing range: "${range}"`);
            console.log('='.repeat(50));

            const result = await adminService.getEnhancedOverview(range);

            if (result.success) {
                const data = result.data;
                console.log(`✅ Success!`);
                console.log(`   Total Users: ${data.totalUsers}`);
                console.log(`   Orders: ${data.ordersToday}`);
                console.log(`   Revenue: ETB ${data.totalRevenue.toLocaleString()}`);
                console.log(`   Active Products: ${data.activeProducts}`);
                console.log(`   Verified Producers: ${data.verifiedProducers}`);
                console.log(`   Open Disputes: ${data.openDisputes}`);
                console.log(`   Pending Payments: ${data.pendingPayments}`);
            } else {
                console.log(`❌ Failed: ${result.error}`);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('📋 SUMMARY');
        console.log('='.repeat(50));

        // Get total orders and revenue (all time)
        const [totalOrders, totalRevenue] = await Promise.all([
            prisma.order.count(),
            prisma.order.aggregate({
                where: { paymentStatus: 'CONFIRMED' },
                _sum: { totalAmount: true }
            })
        ]);

        console.log(`\n📊 Database Totals (All Time):`);
        console.log(`   Total Orders: ${totalOrders}`);
        console.log(`   Total Revenue: ETB ${(totalRevenue._sum.totalAmount || 0).toLocaleString()}`);

        console.log(`\n💡 RECOMMENDATION:`);
        console.log(`   If "today" shows 0 but "month" shows data,`);
        console.log(`   it means your orders are from previous days.`);
        console.log(`   The dashboard default is now set to "month".`);
        console.log(`\n✅ Refresh your browser to see the updated dashboard!`);

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testMonthRange();
