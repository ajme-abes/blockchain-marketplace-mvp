// backend/scripts/createAdminFromEnv.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdminFromEnv() {
    try {
        console.log('🔐 Creating admin user from environment variables...\n');

        // Get credentials from environment
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminName = process.env.ADMIN_NAME || 'System Administrator';
        const adminPhone = process.env.ADMIN_PHONE;

        // Validate required environment variables
        if (!adminEmail) {
            console.error('❌ ADMIN_EMAIL environment variable is required');
            console.log('💡 Set it with: export ADMIN_EMAIL=admin@yourdomain.com');
            process.exit(1);
        }

        if (!adminPassword) {
            console.error('❌ ADMIN_PASSWORD environment variable is required');
            console.log('💡 Set it with: export ADMIN_PASSWORD=YourSecurePassword123!');
            process.exit(1);
        }

        // Validate password strength
        if (adminPassword.length < 12) {
            console.error('❌ Admin password must be at least 12 characters long');
            process.exit(1);
        }

        if (!/[A-Z]/.test(adminPassword) || !/[a-z]/.test(adminPassword) ||
            !/[0-9]/.test(adminPassword) || !/[!@#$%^&*]/.test(adminPassword)) {
            console.error('❌ Admin password must contain uppercase, lowercase, number, and special character');
            process.exit(1);
        }

        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists with email:', adminEmail);
            console.log('ℹ️  If you need to reset the password, delete the user first or use password reset.');
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 12);

        // Create admin user
        const adminUser = await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash: hashedPassword,
                name: adminName,
                role: 'ADMIN',
                emailVerified: true,
                phone: adminPhone || null,
                status: 'ACTIVE'
            }
        });

        console.log('✅ Admin user created successfully!\n');
        console.log('📧 Email:', adminEmail);
        console.log('👤 Name:', adminName);
        console.log('🔑 Password: [HIDDEN - Use the one you set in ADMIN_PASSWORD]');
        console.log('📱 Phone:', adminPhone || 'Not set');
        console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
        console.log('1. Change the admin password immediately after first login');
        console.log('2. Enable two-factor authentication (2FA)');
        console.log('3. Never share admin credentials');
        console.log('4. Use a password manager');
        console.log('5. Regularly audit admin actions in the audit log\n');

        // Create audit log entry
        await prisma.auditLog.create({
            data: {
                action: 'ADMIN_CREATED',
                entity: 'USER',
                entityId: adminUser.id,
                userId: adminUser.id,
                newValues: {
                    email: adminEmail,
                    name: adminName,
                    role: 'ADMIN',
                    createdVia: 'deployment-script'
                },
                ipAddress: 'deployment-script',
                userAgent: 'Node.js Script'
            }
        });

        console.log('📝 Audit log entry created');

    } catch (error) {
        console.error('❌ Failed to create admin user:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    createAdminFromEnv();
}

module.exports = createAdminFromEnv;
