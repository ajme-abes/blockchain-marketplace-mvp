const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test database connection
const testConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

module.exports = { prisma, testConnection };