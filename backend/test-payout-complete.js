// Test script to verify payout complete functionality
// Run with: node test-payout-complete.js

const { PrismaClient } = require('@prisma/client');
const payoutService = require('./src/services/payoutService');

const prisma = new PrismaClient();

async function testPayoutComplete() {
    try {
        console.log('🧪 Testing Payout Complete Functionality\n');

        // 1. Find a processing or scheduled payout
        const pendingPayout = await prisma.producerPayout.findFirst({
            where: {
                status: {
                    in: ['PENDING', 'PROCESSING', 'SCHEDULED']
                }
            },
            include: {
                payoutOrderItems: {
                    include: {
                        orderProducer: true
                    }
                },
                producer: {
                    select: {
                        businessName: true
                    }
                }
            }
        });

        if (!pendingPayout) {
            console.log('❌ No pending/processing/scheduled payouts found');
            console.log('💡 Create some orders first, then generate payouts');
            return;
        }

        console.log('📋 Found pending payout:');
        console.log(`   ID: ${pendingPayout.id}`);
        console.log(`   Producer: ${pendingPayout.producer.businessName}`);
        console.log(`   Amount: ${pendingPayout.netAmount} ETB`);
        console.log(`   PayoutOrderItems: ${pendingPayout.payoutOrderItems.length}`);
        console.log('');

        // 2. Check current OrderProducer statuses
        console.log('📊 Current OrderProducer statuses:');
        for (const item of pendingPayout.payoutOrderItems) {
            if (item.orderProducer) {
                console.log(`   Order ${item.orderProducer.orderId}: ${item.orderProducer.payoutStatus}`);
            } else {
                console.log(`   ⚠️ PayoutOrderItem ${item.id} has no OrderProducer`);
            }
        }
        console.log('');

        // 3. Mark payout as complete
        console.log('🔄 Marking payout as complete...');
        const testReference = `TEST-${Date.now()}`;

        const result = await payoutService.markPayoutComplete(
            pendingPayout.id,
            testReference,
            'BANK_TRANSFER'
        );

        if (result.success) {
            console.log('✅ Payout marked as complete successfully!');
            console.log(`   Reference: ${testReference}`);
        } else {
            console.log('❌ Failed to mark payout as complete:');
            console.log(`   Error: ${result.message}`);
            return;
        }
        console.log('');

        // 4. Verify OrderProducer records were updated
        console.log('🔍 Verifying OrderProducer updates...');

        for (const item of pendingPayout.payoutOrderItems) {
            if (item.orderProducerId) {
                const updatedOrderProducer = await prisma.orderProducer.findUnique({
                    where: { id: item.orderProducerId }
                });

                if (updatedOrderProducer) {
                    console.log(`   Order ${updatedOrderProducer.orderId}:`);
                    console.log(`     Status: ${updatedOrderProducer.payoutStatus}`);
                    console.log(`     Paid At: ${updatedOrderProducer.paidAt}`);
                    console.log(`     Reference: ${updatedOrderProducer.payoutReference}`);

                    if (updatedOrderProducer.payoutStatus === 'COMPLETED') {
                        console.log('     ✅ Successfully updated!');
                    } else {
                        console.log('     ❌ Status not updated!');
                    }
                } else {
                    console.log(`   ❌ OrderProducer ${item.orderProducerId} not found`);
                }
            }
        }
        console.log('');

        // 5. Test producer orders API
        console.log('🔍 Testing Producer Orders API...');
        const orderService = require('./src/services/orderService');

        const producerOrders = await orderService.getProducerOrders(pendingPayout.producerId);

        console.log(`   Found ${producerOrders.orders.length} orders for producer`);

        const updatedOrders = producerOrders.orders.filter(order =>
            order.payoutStatus === 'COMPLETED'
        );

        console.log(`   ${updatedOrders.length} orders show COMPLETED payout status`);

        if (updatedOrders.length > 0) {
            console.log('   ✅ Producer Orders API returning correct payout status!');
        } else {
            console.log('   ⚠️ No orders showing COMPLETED status - check API');
        }

        console.log('');
        console.log('🎉 Test completed!');
        console.log('');
        console.log('💡 Next steps:');
        console.log('   1. Check producer orders page in frontend');
        console.log('   2. Verify payout status shows as "Paid"');
        console.log('   3. Check transaction history only shows completed payouts');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testPayoutComplete();
