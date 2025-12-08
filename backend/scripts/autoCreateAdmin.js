// backend/scripts/autoCreateAdmin.js
// Automatically creates admin account from environment variables if it doesn't exist

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function autoCreateAdmin() {
    try {
        console.log('🔍 Checking if admin account exists...');

        // Check if admin email is set in environment
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminName = process.env.ADMIN_NAME || 'System Administrator';
        const adminPhone = process.env.ADMIN_PHONE || null;

        if (!adminEmail || !adminPassword) {
            console.log('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables');
            console.log('💡 Admin account will not be auto-created');
            return;
        }

        // Check if admin already exists
        const existingAdmin = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: adminEmail.toLowerCase() },
                    { role: 'ADMIN' }
                ]
            }
        });

        if (existingAdmin) {
            console.log('✅ Admin account already exists:', existingAdmin.email);
            return;
        }

        console.log('🔧 Creating admin account from environment variables...');

        // Hash password
        const passwordHash = await bcrypt.hash(adminPassword, 12);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email: adminEmail.toLowerCase(),
                passwordHash: passwordHash,
                name: adminName,
                phone: adminPhone,
                role: 'ADMIN',
                emailVerified: true, // Auto-verify admin
                isActive: true
            }
        });

        console.log('✅ Admin account created successfully!');
        console.log('📧 Email:', admin.email);
        console.log('👤 Name:', admin.name);
        console.log('🔑 Password: [Set from ADMIN_PASSWORD env var]');
        console.log('');
        console.log('⚠️  IMPORTANT: Change the admin password after first login!');

    } catch (error) {
        console.error('❌ Error auto-creating admin:', error.message);
        // Don't throw error - let the app continue even if admin creation fails
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    autoCreateAdmin()
        .then(() => {
            console.log('✅ Auto-create admin script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Auto-create admin script failed:', error);
            process.exit(1);
        });
}

module.exports = { autoCreateAdmin };
