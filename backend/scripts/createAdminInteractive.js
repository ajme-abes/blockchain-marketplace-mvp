// backend/scripts/createAdminInteractive.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function questionHidden(query) {
    return new Promise(resolve => {
        const stdin = process.stdin;
        stdin.resume();
        stdin.setRawMode(true);
        stdin.setEncoding('utf8');

        process.stdout.write(query);
        let password = '';

        stdin.on('data', function (char) {
            char = char.toString('utf8');

            switch (char) {
                case '\n':
                case '\r':
                case '\u0004':
                    stdin.setRawMode(false);
                    stdin.pause();
                    process.stdout.write('\n');
                    resolve(password);
                    break;
                case '\u0003':
                    process.exit();
                    break;
                case '\u007f': // Backspace
                    password = password.slice(0, -1);
                    process.stdout.clearLine();
                    process.stdout.cursorTo(0);
                    process.stdout.write(query + '*'.repeat(password.length));
                    break;
                default:
                    password += char;
                    process.stdout.write('*');
                    break;
            }
        });
    });
}

async function createAdminInteractive() {
    try {
        console.log('\n🔐 EthioTrust Admin User Creation\n');
        console.log('This script will create a new admin user for the platform.');
        console.log('Please provide the following information:\n');

        // Get admin details
        const email = await question('Admin Email: ');
        const name = await question('Admin Name: ');
        const phone = await question('Admin Phone (optional): ');
        const password = await questionHidden('Admin Password (hidden): ');
        const confirmPassword = await questionHidden('Confirm Password (hidden): ');

        rl.close();

        console.log('\n🔍 Validating input...\n');

        // Validate email
        if (!email || !email.includes('@')) {
            console.error('❌ Invalid email address');
            process.exit(1);
        }

        // Validate password match
        if (password !== confirmPassword) {
            console.error('❌ Passwords do not match');
            process.exit(1);
        }

        // Validate password strength
        if (password.length < 12) {
            console.error('❌ Password must be at least 12 characters long');
            process.exit(1);
        }

        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) ||
            !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
            console.error('❌ Password must contain:');
            console.error('   - At least one uppercase letter');
            console.error('   - At least one lowercase letter');
            console.error('   - At least one number');
            console.error('   - At least one special character (!@#$%^&*)');
            process.exit(1);
        }

        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            console.error('❌ User with this email already exists');
            process.exit(1);
        }

        // Hash password
        console.log('🔒 Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create admin user
        console.log('👤 Creating admin user...');
        const adminUser = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                name,
                role: 'ADMIN',
                emailVerified: true,
                phone: phone || null,
                status: 'ACTIVE'
            }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'ADMIN_CREATED',
                entity: 'USER',
                entityId: adminUser.id,
                userId: adminUser.id,
                newValues: {
                    email,
                    name,
                    role: 'ADMIN',
                    createdVia: 'interactive-script'
                },
                ipAddress: 'interactive-script',
                userAgent: 'Node.js Script'
            }
        });

        console.log('\n✅ Admin user created successfully!\n');
        console.log('📧 Email:', email);
        console.log('👤 Name:', name);
        console.log('📱 Phone:', phone || 'Not set');
        console.log('\n⚠️  IMPORTANT SECURITY REMINDERS:');
        console.log('1. Enable two-factor authentication (2FA) after first login');
        console.log('2. Never share admin credentials');
        console.log('3. Use a password manager to store credentials');
        console.log('4. Regularly review audit logs for suspicious activity');
        console.log('5. Change password every 90 days\n');

    } catch (error) {
        console.error('\n❌ Failed to create admin user:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminInteractive();
