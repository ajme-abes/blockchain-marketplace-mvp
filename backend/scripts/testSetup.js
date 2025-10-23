// backend/scripts/testSetup.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupTestData() {
  console.log('🧪 Setting up test data...');

  try {
    // Clean up existing test data first
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany({ where: { name: { in: ['Test Tomatoes', 'Test Potatoes'] } } });
    await prisma.buyer.deleteMany({ where: { user: { email: 'testbuyer@example.com' } } });
    await prisma.producer.deleteMany({ where: { user: { email: 'testproducer@example.com' } } });
    await prisma.user.deleteMany({ where: { email: { in: ['testbuyer@example.com', 'testproducer@example.com'] } } });

    // Create test users
    const buyerUser = await prisma.user.create({
      data: {
        email: 'testbuyer@example.com',
        passwordHash: '$2b$10$exampleHashForTesting123456789012',
        name: 'Test Buyer',
        phone: '+251911223344',
        role: 'BUYER',
        buyerProfile: {
          create: {
            preferredPaymentMethod: 'CHAPA'
          }
        }
      }
    });

    const producerUser = await prisma.user.create({
      data: {
        email: 'testproducer@example.com',
        passwordHash: '$2b$10$exampleHashForTesting123456789012',
        name: 'Test Producer',
        phone: '+251922334455',
        role: 'PRODUCER',
        producerProfile: {
          create: {
            businessName: 'Test Farm',
            location: 'Addis Ababa',
            verificationStatus: 'VERIFIED'
          }
        }
      }
    });

    // Get producer ID
    const producer = await prisma.producer.findUnique({
      where: { userId: producerUser.id }
    });

    if (!producer) {
      throw new Error('Producer profile not created');
    }

    // Create test products using create (not upsert)
    const tomatoProduct = await prisma.product.create({
      data: {
        name: 'Test Tomatoes',
        category: 'Vegetables',
        price: 25.50,
        quantityAvailable: 100,
        description: 'Fresh organic tomatoes',
        producerId: producer.id,
        status: 'ACTIVE'
      }
    });

    const potatoProduct = await prisma.product.create({
      data: {
        name: 'Test Potatoes',
        category: 'Vegetables',
        price: 15.75,
        quantityAvailable: 50,
        description: 'Fresh potatoes from local farm',
        producerId: producer.id,
        status: 'ACTIVE'
      }
    });

    console.log('✅ Test data setup complete!');
    console.log('📧 Buyer Email:', buyerUser.email);
    console.log('📧 Producer Email:', producerUser.email);
    console.log('🆔 Buyer User ID:', buyerUser.id);
    console.log('🆔 Producer User ID:', producerUser.id);
    console.log('🛒 Products Created:');
    console.log('  -', tomatoProduct.name, `(ID: ${tomatoProduct.id})`);
    console.log('  -', potatoProduct.name, `(ID: ${potatoProduct.id})`);

    return { 
      buyerUser, 
      producerUser, 
      products: [tomatoProduct, potatoProduct] 
    };

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  }
}

setupTestData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());