// Script to create a sample multi-producer product for testing
// Run with: node create-multi-producer-product.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMultiProducerProduct() {
    try {
        console.log('🔧 Creating multi-producer product...\n');

        // Get three producers (you'll need to replace these IDs with actual producer IDs from your database)
        const producers = await prisma.producer.findMany({
            take: 3,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (producers.length < 3) {
            console.log('❌ Error: Need at least 3 producers in the database');
            console.log(`   Found only ${producers.length} producer(s)`);
            console.log('\n💡 Tip: Create more producer accounts first');
            return;
        }

        console.log('✅ Found producers:');
        producers.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.businessName} (${p.user.email})`);
        });
        console.log('');

        // Create the multi-producer product
        const product = await prisma.product.create({
            data: {
                name: "Ethiopian Coffee Gift Box",
                category: "Coffee",
                price: 1200,
                quantityAvailable: 50,
                description: "Premium Ethiopian coffee gift box - A collaboration of three expert producers",
                imageUrl: "https://example.com/coffee-gift-box.jpg",
                status: "ACTIVE",
                producerId: producers[0].id, // Primary producer
                productProducers: {
                    create: [
                        {
                            producerId: producers[0].id,
                            sharePercentage: 40,
                            role: "Grower"
                        },
                        {
                            producerId: producers[1].id,
                            sharePercentage: 35,
                            role: "Roaster"
                        },
                        {
                            producerId: producers[2].id,
                            sharePercentage: 25,
                            role: "Packager"
                        }
                    ]
                }
            },
            include: {
                producer: {
                    select: {
                        businessName: true
                    }
                },
                productProducers: {
                    include: {
                        producer: {
                            select: {
                                businessName: true
                            }
                        }
                    }
                }
            }
        });

        console.log('✅ Multi-producer product created successfully!\n');
        console.log('📦 Product Details:');
        console.log(`   Name: ${product.name}`);
        console.log(`   Price: ${product.price} ETB`);
        console.log(`   Primary Producer: ${product.producer.businessName}`);
        console.log('');
        console.log('👥 Producer Shares:');
        product.productProducers.forEach(pp => {
            console.log(`   - ${pp.producer.businessName}: ${pp.sharePercentage}% (${pp.role})`);
        });
        console.log('');
        console.log('🎉 Success! You can now:');
        console.log('   1. Place an order with this product');
        console.log('   2. Check the buyer payment success page');
        console.log('   3. Check each producer\'s orders page');
        console.log('');

    } catch (error) {
        console.error('❌ Error creating multi-producer product:', error);
        console.error('\n💡 Make sure:');
        console.error('   1. Database is running');
        console.error('   2. You have at least 3 producers in the database');
        console.error('   3. Prisma schema is up to date (run: npx prisma generate)');
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
createMultiProducerProduct();
