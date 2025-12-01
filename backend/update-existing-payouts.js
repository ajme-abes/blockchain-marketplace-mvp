// backend/update-existing-payouts.js
// Script to update existing order_producers records with calculated amounts

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COMMISSION_RATE = parseFloat(process.env.MARKETPLACE_COMMISSION_RATE || '0.10');

async function updateExistingPayouts() {
    try {
        console.log('🔄 Updating existing order_producers records...');
        console.log(`💰 Using commission rate: ${COMMISSION_RATE * 100}%`);

        // Get all order_producers records
        const orderProducers = await prisma.orderProducer.findMany({
            where: {
                OR: [
                    { producerAmount: 0 },
                    { marketplaceCommission: 0 }
                ]
            }
        });

        console.log(`📦 Found ${orderProducers.length} records to update`);

        if (orderProducers.length === 0) {
            console.log('✅ No records need updating');
            return;
        }

        let updated = 0;
        for (const op of orderProducers) {
            const commission = op.subtotal * COMMISSION_RATE;
            const producerAmount = op.subtotal - commission;

            await prisma.orderProducer.update({
                where: { id: op.id },
                data: {
                    marketplaceCommission: commission,
                    producerAmount: producerAmount
                }
            });

            console.log(`✅ Updated order ${op.orderId}: subtotal=${op.subtotal}, commission=${commission.toFixed(2)}, producerAmount=${producerAmount.toFixed(2)}`);
            updated++;
        }

        console.log(`\n✅ Successfully updated ${updated} records!`);
        console.log('\n📊 Summary:');

        const summary = await prisma.orderProducer.aggregate({
            _sum: {
                subtotal: true,
                marketplaceCommission: true,
                producerAmount: true
            },
            _count: true
        });

        console.log(`Total records: ${summary._count}`);
        console.log(`Total subtotal: ${summary._sum.subtotal?.toFixed(2) || 0} ETB`);
        console.log(`Total commission: ${summary._sum.marketplaceCommission?.toFixed(2) || 0} ETB`);
        console.log(`Total producer amount: ${summary._sum.producerAmount?.toFixed(2) || 0} ETB`);

    } catch (error) {
        console.error('❌ Error updating records:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the update
updateExistingPayouts()
    .then(() => {
        console.log('\n✅ Update complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Update failed:', error);
        process.exit(1);
    });
