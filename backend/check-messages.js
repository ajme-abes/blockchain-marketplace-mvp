const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMessages() {
    const messages = await prisma.contactMessage.findMany();
    console.log('Total messages:', messages.length);
    messages.forEach(msg => {
        console.log(`- ${msg.subject}`);
        console.log(`  From: ${msg.name} (${msg.email})`);
        console.log(`  UserId: ${msg.userId || 'Not logged in'}`);
        console.log(`  Status: ${msg.status}`);
        if (msg.adminNotes) {
            console.log(`  Admin Response: ${msg.adminNotes.substring(0, 50)}...`);
        }
        console.log('');
    });
    await prisma.$disconnect();
}

checkMessages();
