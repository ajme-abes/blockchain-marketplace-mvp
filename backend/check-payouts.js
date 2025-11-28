// backend/check-payouts.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPayouts() {
    try {
        console.log('🔍 Checking payouts in database...\n');

        // Check producer_payouts table
        const payouts = await prisma.producerPayout.findMany({
            include: {
                producer: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                payoutOrderItems: {
                    include: {
                        orderProducer: {
                            include: {
                                order: {
                                    select: {
                                        id: true,
                                        orderDate: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        console.log(`📊 Found ${payouts.length} payouts in database\n`);

        if (payouts.length > 0) {
            payouts.forEach((payout, index) => {
                console.log(`Payout ${index + 1}:`);
                console.log(`  ID: ${payout.id}`);
                console.log(`  Producer: ${payout.producer.user.name} (${payout.producer.businessName})`);
                console.log(`  Amount: ${payout.amount} ETB`);
                console.log(`  Commission: ${payout.commission} ETB`);
                console.log(`  Net Amount: ${payout.netAmount} ETB`);
                console.log(`  Status: ${payout.status}`);
                console.log(`  Scheduled For: ${payout.scheduledFor}`);
                console.log(`  Orders: ${payout.payoutOrderItems.length}`);
                console.log('');
            });
        } else {
            console.log('⚠️ No payouts found in database');
            console.log('💡 Payouts are created when:');
            console.log('   1. An order is created');
            console.log('   2. Payment is confirmed');
            console.log('   3. Payout scheduling runs');
        }

        // Check order_producers
        const orderProducers = await prisma.orderProducer.findMany({
            include: {
                producer: {
                    include: {
                        user: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        console.log(`\n📦 Found ${orderProducers.length} order producer records`);

        if (orderProducers.length > 0) {
            orderProducers.forEach((op, index) => {
                console.log(`\nOrder Producer ${index + 1}:`);
                console.log(`  Producer: ${op.producer.user.name}`);
                console.log(`  Subtotal: ${op.subtotal} ETB`);
                console.log(`  Commission: ${op.marketplaceCommission} ETB`);
                console.log(`  Producer Amount: ${op.producerAmount} ETB`);
                console.log(`  Payout Status: ${op.payoutStatus}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPayouts();
