// backend/scripts/createTestData.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createTestData() {
    try {
        console.log('\n🌱 Creating Test Data for Dashboard...\n');

        // 1. Create test buyer
        console.log('👤 Creating test buyer...');
        const buyerPassword = await bcrypt.hash('Buyer123!', 12);

        let buyer = await prisma.user.findUnique({
            where: { email: 'buyer@test.com' }
        });

        if (!buyer) {
            buyer = await prisma.user.create({
                data: {
                    email: 'buyer@test.com',
                    passwordHash: buyerPassword,
                    name: 'Test Buyer',
                    role: 'BUYER',
                    emailVerified: true,
                    status: 'ACTIVE',
                    buyerProfile: {
                        create: {
                            preferredPaymentMethod: 'CHAPA'
                        }
                    }
                },
                include: { buyerProfile: true }
            });
            console.log('✅ Test buyer created:', buyer.email);
        } else {
            console.log('ℹ️  Test buyer already exists');
        }

        // 2. Create test producer
        console.log('\n🏭 Creating test producer...');
        const producerPassword = await bcrypt.hash('Producer123!', 12);

        let producer = await prisma.user.findUnique({
            where: { email: 'producer@test.com' }
        });

        if (!producer) {
            producer = await prisma.user.create({
                data: {
                    email: 'producer@test.com',
                    passwordHash: producerPassword,
                    name: 'Test Producer',
                    role: 'PRODUCER',
                    emailVerified: true,
                    status: 'ACTIVE',
                    producerProfile: {
                        create: {
                            businessName: 'Test Farm',
                            location: 'Addis Ababa',
                            verificationStatus: 'VERIFIED'
                        }
                    }
                },
                include: { producerProfile: true }
            });
            console.log('✅ Test producer created:', producer.email);
        } else {
            console.log('ℹ️  Test producer already exists');
            producer = await prisma.user.findUnique({
                where: { email: 'producer@test.com' },
                include: { producerProfile: true }
            });
        }

        // 3. Create test products
        console.log('\n📦 Creating test products...');
        const products = [
            { name: 'Ethiopian Coffee', price: 500, quantity: 100, category: 'Coffee' },
            { name: 'Organic Honey', price: 350, quantity: 50, category: 'Honey' },
            { name: 'Teff Grain', price: 200, quantity: 200, category: 'Grains' },
            { name: 'Spice Mix', price: 150, quantity: 75, category: 'Spices' },
            { name: 'Handmade Basket', price: 800, quantity: 30, category: 'Crafts' }
        ];

        const createdProducts = [];
        for (const productData of products) {
            const existing = await prisma.product.findFirst({
                where: {
                    name: productData.name,
                    producerId: producer.producerProfile.id
                }
            });

            if (!existing) {
                const product = await prisma.product.create({
                    data: {
                        name: productData.name,
                        price: productData.price,
                        quantityAvailable: productData.quantity,
                        category: productData.category,
                        description: `High quality ${productData.name.toLowerCase()} from Ethiopia`,
                        status: 'ACTIVE',
                        producerId: producer.producerProfile.id
                    }
                });
                createdProducts.push(product);
                console.log(`✅ Created: ${product.name} - ${product.price} ETB`);
            } else {
                createdProducts.push(existing);
                console.log(`ℹ️  Already exists: ${productData.name}`);
            }
        }

        // 4. Create test orders
        console.log('\n📋 Creating test orders...');
        const orderCount = 10;
        let totalRevenue = 0;

        for (let i = 0; i < orderCount; i++) {
            // Random products for each order
            const orderProducts = [];
            const numProducts = Math.floor(Math.random() * 3) + 1; // 1-3 products per order

            for (let j = 0; j < numProducts; j++) {
                const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
                const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
                orderProducts.push({
                    productId: product.id,
                    quantity: quantity,
                    price: product.price,
                    subtotal: product.price * quantity
                });
            }

            const orderTotal = orderProducts.reduce((sum, item) => sum + item.subtotal, 0);
            totalRevenue += orderTotal;

            // Create order
            const order = await prisma.order.create({
                data: {
                    buyerId: buyer.buyerProfile.id,
                    userId: buyer.id,
                    totalAmount: orderTotal,
                    paymentStatus: i < 8 ? 'CONFIRMED' : 'PENDING', // 8 confirmed, 2 pending
                    deliveryStatus: i < 6 ? 'DELIVERED' : i < 8 ? 'SHIPPED' : 'PENDING',
                    orderDate: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Spread over last 10 days
                    orderItems: {
                        create: orderProducts
                    }
                }
            });

            // Create status history
            await prisma.orderStatusHistory.create({
                data: {
                    orderId: order.id,
                    fromStatus: 'PENDING',
                    toStatus: order.deliveryStatus,
                    changedById: buyer.id,
                    reason: 'Order created'
                }
            });

            console.log(`✅ Order ${i + 1}: ${orderTotal} ETB (${order.paymentStatus})`);
        }

        // 5. Create some reviews
        console.log('\n⭐ Creating test reviews...');
        for (let i = 0; i < 5; i++) {
            const product = createdProducts[i];
            await prisma.review.create({
                data: {
                    buyerId: buyer.buyerProfile.id,
                    productId: product.id,
                    rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
                    comment: 'Great product! Highly recommended.'
                }
            });
            console.log(`✅ Review for: ${product.name}`);
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('✅ TEST DATA CREATED SUCCESSFULLY!');
        console.log('='.repeat(50));
        console.log(`👥 Users: 1 buyer, 1 producer`);
        console.log(`📦 Products: ${createdProducts.length}`);
        console.log(`📋 Orders: ${orderCount} (8 confirmed, 2 pending)`);
        console.log(`💰 Total Revenue: ${totalRevenue.toLocaleString()} ETB`);
        console.log(`⭐ Reviews: 5`);
        console.log('='.repeat(50));
        console.log('\n📝 Test Accounts:');
        console.log('   Buyer: buyer@test.com / Buyer123!');
        console.log('   Producer: producer@test.com / Producer123!');
        console.log('\n🎯 Now refresh your admin dashboard to see the data!\n');

    } catch (error) {
        console.error('❌ Error creating test data:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    createTestData();
}

module.exports = createTestData;
