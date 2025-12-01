// Check current payout status in the system
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPayoutStatus() {
    try {
        console.log('🔍 Checking Payout System Status\n');

        // Check all payouts
        const allPayouts = await prisma.producerPayout.findMany({
            include: {
                producer: {
                    select: {
                        businessName: true
                    }
                },
                payoutOrderItems: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`📊 Total Payouts: ${allPayouts.length}\n`);

        if (allPayouts.length === 0) {
            console.log('❌ No payouts found in the system');
            console.log('💡 You need to:');
            console.log('   1. Create some orders');
            console.log('   2. Mark orders as delivered');
            console.log('   3. Generate payouts from admin panel\n');
            return;
        }

        // Group by status
        const byStatus = allPayouts.reduce((acc, payout) => {
            acc[payout.status] = (acc[payout.status] || 0) + 1;
            return acc;
        }, {});

        console.log('📈 Payouts by Status:');
        Object.entries(byStatus).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });
        console.log('');

        // Show recent payouts
        console.log('📋 Recent Payouts:');
        allPayouts.slice(0, 5).forEach(payout => {
            console.log(`\n   ID: ${payout.id}`);
            console.log(`   Producer: ${payout.producer.businessName}`);
            console.log(`   Status: ${payout.status}`);
            console.log(`   Amount: ${payout.netAmount} ETB`);
            console.log(`   Items: ${payout.payoutOrderItems.length}`);
            console.log(`   Created: ${payout.createdAt.toLocaleDateString()}`);
            if (payout.completedAt) {
                console.log(`   Completed: ${payout.completedAt.toLocaleDateString()}`);
            }
        });

        console.log('\n');

        // Check OrderProducer records
        const orderProducers = await prisma.orderProducer.findMany({
            take: 10,
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`📦 Recent OrderProducer Records: ${orderProducers.length}`);
        orderProducers.forEach(op => {
            console.log(`   Order ${op.orderId}: ${op.payoutStatus} ${op.paidAt ? '(Paid)' : '(Unpaid)'}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPayoutStatus();
