// backend/src/utils/autoCreateAdmin.js
// Automatically creates admin user from environment variables on startup

const bcrypt = require('bcryptjs');

async function autoCreateAdmin() {
    try {
        // Use global prisma client
        const prisma = global.prisma;

        if (!prisma) {
            console.log('⚠️  Prisma client not available - skipping auto admin creation');
            return;
        }

        // Check if admin environment variables are set
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminName = process.env.ADMIN_NAME || 'System Administrator';
        const adminPhone = process.env.ADMIN_PHONE || null;

        // Skip if no admin credentials provided
        if (!adminEmail || !adminPassword) {
            console.log('ℹ️  No ADMIN_EMAIL or ADMIN_PASSWORD set - skipping auto admin creation');
            return;
        }

        console.log('🔍 Checking if admin exists:', adminEmail);

        // Check if admin already exists
        const existingAdmin = await prisma.user.findFirst({
            where: {
                email: adminEmail.toLowerCase().trim(),
                role: 'ADMIN'
            }
        });

        if (existingAdmin) {
            console.log('✅ Admin already exists:', adminEmail);
            return;
        }

        console.log('🔧 Creating admin user from environment variables...');

        // Hash password
        const passwordHash = await bcrypt.hash(adminPassword, 12);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email: adminEmail.toLowerCase().trim(),
                passwordHash,
                name: adminName,
                phone: adminPhone,
                role: 'ADMIN',
                emailVerified: true, // Auto-verify admin
                isActive: true
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('📧 Email:', admin.email);
        console.log('👤 Name:', admin.name);
        console.log('🔑 Password: [Set from ADMIN_PASSWORD env var]');
        console.log('');
        console.log('⚠️  IMPORTANT: Change admin password after first login!');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        // Don't throw error - let server start anyway
    }
}

module.exports = { autoCreateAdmin };
