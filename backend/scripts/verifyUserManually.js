// backend/scripts/verifyUserManually.js
// Script to manually verify a user's email

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUser(email) {
    try {
        console.log(`🔍 Looking for user: ${email}`);

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        if (user.emailVerified) {
            console.log('✅ User email is already verified');
            return;
        }

        // Update user to verified
        const updatedUser = await prisma.user.update({
            where: { email: email.toLowerCase().trim() },
            data: {
                emailVerified: true,
                verificationToken: null,
                verificationTokenExpires: null
            }
        });

        console.log('✅ User email verified successfully!');
        console.log('📧 Email:', updatedUser.email);
        console.log('👤 Name:', updatedUser.name);
        console.log('🔐 Status:', updatedUser.emailVerified ? 'VERIFIED' : 'NOT VERIFIED');

    } catch (error) {
        console.error('❌ Error verifying user:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('Usage: node scripts/verifyUserManually.js <email>');
    console.log('Example: node scripts/verifyUserManually.js ajmelabes@gmail.com');
    process.exit(1);
}

verifyUser(email);
