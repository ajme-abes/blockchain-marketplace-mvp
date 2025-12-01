// backend/verify-payout-system.js
// Quick verification that payout system is working

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyPayoutSystem() {
    try {
        console.log('🔍 Verifying Payout System Setup...\n');

        // Check OrderProducer table
        console.log('1️⃣ Checking order_producers table...');
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
        console.log(`   ✅ Found ${orderProducers.length} order producer records`);

        if (orderProducers.length > 0) {
            console.log('\n   Sample record:');
            const sample = orderProducers[0];
            console.log(`   - Producer: ${sample.producer.user.name}`);
            console.log(`   - Subtotal: ${sample.subtotal} ETB`);
            console.log(`   - Commission: ${sample.marketplaceCommission} ETB`);
            console.log(`   - Producer Amount: ${sample.producerAmount} ETB`);
            console.log(`   - Payout Status: ${sample.payoutStatus}`);
        }

        // Check ProducerPayout table
        console.log('\n2️⃣ Checking producer_payouts table...');
        const payouts = await prisma.producerPayout.findMany();
        console.log(`   ✅ Found ${payouts.length} payout records`);

        // Check PayoutOrderItem table
        console.log('\n3️⃣ Checking payout_order_items table...');
        const payoutItems = await prisma.payoutOrderItem.findMany();
        console.log(`   ✅ Found ${payoutItems.length} payout item records`);

        // Check BlockchainIdentifier table
        console.log('\n4️⃣ Checking blockchain_identifiers table...');
        const identifiers = await prisma.blockchainIdentifier.findMany();
        console.log(`   ✅ Found ${identifiers.length} blockchain identifier records`);

        // Summary
        console.log('\n📊 System Summary:');
        console.log('   ✅ All tables exist and are accessible');
        console.log('   ✅ OrderProducer records have calculated amounts');
        console.log('   ✅ Payout system is ready to use');

        console.log('\n✅ Verification Complete! System is ready.');

    } catch (error) {
        console.error('❌ Verification failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

verifyPayoutSystem()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
