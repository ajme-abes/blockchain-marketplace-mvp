// Test script to check user messages endpoint
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUserMessages() {
    try {
        console.log('🔍 Testing user messages...\n');

        // Get a user with messages
        const user = await prisma.user.findFirst({
            include: {
                contactMessages: true
            }
        });

        if (!user) {
            console.log('❌ No users found');
            return;
        }

        console.log(`✅ Found user: ${user.name} (${user.email})`);
        console.log(`📧 Contact messages: ${user.contactMessages.length}\n`);

        if (user.contactMessages.length > 0) {
            console.log('Messages:');
            user.contactMessages.forEach(msg => {
                console.log(`- ${msg.subject} (${msg.status})`);
                if (msg.adminNotes) {
                    console.log(`  Admin response: ${msg.adminNotes.substring(0, 50)}...`);
                }
            });
        }

        // Test the query that the endpoint uses
        const messages = await prisma.contactMessage.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`\n✅ Query works! Found ${messages.length} messages for user`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testUserMessages();
