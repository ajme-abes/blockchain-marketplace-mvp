const userService = require('./services/userService');

const testDatabaseOperations = async () => {
  try {
    console.log('🧪 Testing database operations...');
    
    // Test creating a user
    const testUser = await userService.createUser({
      email: 'test@example.com',
      password: 'testpassword123',
      name: 'Test User',
      phone: '+251911223344',
      role: 'BUYER',
      address: 'Addis Ababa, Ethiopia'
    });
    
    console.log('✅ User created:', testUser);
    
    // Test finding user by email
    const foundUser = await userService.findUserByEmail('test@example.com');
    console.log('✅ User found by email:', foundUser);
    
    console.log('🎉 All database tests passed!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
};

testDatabaseOperations();