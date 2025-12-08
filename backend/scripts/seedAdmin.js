// backend/scripts/seedAdmin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    console.log('🌱 Seeding admin user...');
    const adminEmail = '';
    const adminPassword = ''; 
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        emailVerified: true,
        phone: '+251936451761'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!');

  } catch (error) {
    console.error('❌ Failed to seed admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;