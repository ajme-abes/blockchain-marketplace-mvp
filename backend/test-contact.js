const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testContact() {
    try {
        console.log('Testing contact message creation...\n');

        const message = await prisma.contactMessage.create({
            data: {
                name: 'Test User',
                email: 'test@example.com',
                subject: 'Test Subject',
                message: 'This is a test message',
                status: 'UNREAD'
            }
        });

        console.log('✅ Contact message created:', message);

        const all = await prisma.contactMessage.findMany();
        console.log(`\n📊 Total messages: ${all.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testContact();
