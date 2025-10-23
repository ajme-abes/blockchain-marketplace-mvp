// backend/scripts/checkDeliveryStatus.js
const { PrismaClient, DeliveryStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDeliveryStatus() {
  console.log('📋 Available DeliveryStatus values:');
  console.log(Object.values(DeliveryStatus));
  
  // Test creating an order with different statuses
  try {
    console.log('\n🧪 Testing status values:');
    const testStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    
    testStatuses.forEach(status => {
      const isValid = Object.values(DeliveryStatus).includes(status);
      console.log(`- ${status}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    });
  } catch (error) {
    console.log('Error:', error.message);
  }
}

checkDeliveryStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect());