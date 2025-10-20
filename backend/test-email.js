const notificationService = require('./src/services/notificationService');

async function testEmail() {
  console.log('📧 Testing email service...');
  
  // You'll need a user ID from your database
  // First, let's check if we can create a test notification
  try {
    // Get any user from database
    const { prisma } = require('./src/config/database');
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('❌ No users found. Please register a user first.');
      return;
    }
    
    console.log(`👤 Testing with user: ${user.name} (${user.email})`);
    
    const result = await notificationService.createNotification(
      user.id,
      '🎉 Test Notification: Email service is working!',
      'GENERAL'
    );
    
    if (result.success) {
      console.log('✅ Notification created successfully');
      console.log('📨 Email should be sent shortly...');
    } else {
      console.log('❌ Notification failed:', result.error);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testEmail();