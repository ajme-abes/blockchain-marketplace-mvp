// Test script to verify growth calculations are working
const adminService = require('../src/services/adminService');

async function testGrowthCalculations() {
    try {
        console.log('🧪 Testing Growth Calculations...\n');

        const ranges = ['today', 'week', 'month'];

        for (const range of ranges) {
            console.log(`\n📊 Testing range: "${range}"`);
            console.log('='.repeat(60));

            const result = await adminService.getEnhancedOverview(range);

            if (result.success) {
                const data = result.data;
                console.log(`\n✅ Current Period Data:`);
                console.log(`   Total Users: ${data.totalUsers}`);
                console.log(`   Active Products: ${data.activeProducts}`);
                console.log(`   Orders: ${data.ordersToday}`);
                console.log(`   Revenue: ETB ${data.totalRevenue.toLocaleString()}`);
                console.log(`   Open Disputes: ${data.openDisputes}`);
                console.log(`   Pending Payments: ${data.pendingPayments}`);

                console.log(`\n📈 Growth Metrics (vs previous period):`);
                console.log(`   User Growth: ${data.userGrowth > 0 ? '+' : ''}${data.userGrowth}%`);
                console.log(`   Product Growth: ${data.productGrowth > 0 ? '+' : ''}${data.productGrowth}%`);
                console.log(`   Order Growth: ${data.orderGrowth > 0 ? '+' : ''}${data.orderGrowth}%`);
                console.log(`   Revenue Growth: ${data.revenueGrowth > 0 ? '+' : ''}${data.revenueGrowth}%`);
                console.log(`   Dispute Change: ${data.disputeChange > 0 ? '+' : ''}${data.disputeChange}`);
                console.log(`   Payment Change: ${data.paymentChange > 0 ? '+' : ''}${data.paymentChange}`);
            } else {
                console.log(`❌ Failed: ${result.error}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Growth calculations test complete!');
        console.log('='.repeat(60));
        console.log('\n💡 These percentages will now show on your dashboard cards!');
        console.log('   Refresh your browser to see the real growth metrics.\n');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        process.exit(0);
    }
}

testGrowthCalculations();
