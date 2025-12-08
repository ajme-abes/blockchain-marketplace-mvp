// Test script to verify multi-producer blockchain recording
const { prisma } = require('./src/config/database');
const blockchainService = require('./src/services/blockchainService');

async function testMultiProducerBlockchain() {
    try {
        console.log('🧪 Testing Multi-Producer Blockchain Recording...\n');

        // Find an order with multiple producers
        const multiProducerOrder = await prisma.order.findFirst({
            where: {
                blockchainRecorded: true
            },
            include: {
                orderProducers: {
                    include: {
                        producer: {
                            include: {
                                user: {
                                    select: { name: true, email: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!multiProducerOrder) {
            console.log('❌ No blockchain-recorded orders found');
            console.log('💡 Create an order and confirm payment to test');
            return;
        }

        console.log(`📦 Testing Order: ${multiProducerOrder.id}`);
        console.log(`   Producers in database: ${multiProducerOrder.orderProducers.length}`);

        multiProducerOrder.orderProducers.forEach((op, index) => {
            console.log(`   ${index + 1}. ${op.producer.user.name} (${op.producer.businessName})`);
        });

        // Verify on blockchain
        console.log('\n🔗 Verifying on blockchain...');
        const verification = await blockchainService.verifyTransaction(multiProducerOrder.id);

        if (verification.exists) {
            console.log('✅ Order found on blockchain!');
            console.log('\n📊 Blockchain Data:');
            console.log(`   Order ID: ${verification.orderId}`);
            console.log(`   Buyer ID: ${verification.buyerId}`);
            console.log(`   Producer Field: ${verification.producerId}`);
            console.log(`   Is Multi-Producer: ${verification.isMultiProducer ? 'YES' : 'NO'}`);
            console.log(`   Producer Count: ${verification.producerCount}`);

            if (verification.isMultiProducer) {
                console.log(`   All Producers:`);
                verification.producerIds.forEach((id, index) => {
                    console.log(`      ${index + 1}. ${id}`);
                });
            }

            console.log(`   Amount: ${verification.amountETB}`);
            console.log(`   Transaction Hash: ${verification.txHash}`);
            console.log(`   Recorded At: ${verification.timestamp}`);
            console.log(`   Verified: ${verification.isVerified}`);

            // Compare with database
            const dbProducerCount = multiProducerOrder.orderProducers.length;
            const blockchainProducerCount = verification.producerCount;

            console.log('\n✅ VERIFICATION:');
            if (dbProducerCount === blockchainProducerCount) {
                console.log(`🎉 SUCCESS! All ${dbProducerCount} producers are recorded on blockchain`);
            } else {
                console.log(`⚠️ MISMATCH: Database has ${dbProducerCount} producers, blockchain has ${blockchainProducerCount}`);
            }

            console.log('\n🔗 View on Polygonscan:');
            console.log(`   https://amoy.polygonscan.com/tx/${verification.txHash}`);

        } else {
            console.log('❌ Order not found on blockchain');
            console.log(`   Error: ${verification.error}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testMultiProducerBlockchain();