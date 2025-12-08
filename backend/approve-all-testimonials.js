// Quick script to approve all pending testimonials
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function approveAll() {
    try {
        const result = await prisma.testimonial.updateMany({
            where: {
                isApproved: false
            },
            data: {
                isApproved: true,
                isPublished: true
            }
        });

        console.log(`✅ Approved ${result.count} testimonials!`);

        // Show all testimonials
        const all = await prisma.testimonial.findMany();
        console.log('\n📊 All Testimonials:');
        all.forEach(t => {
            console.log(`- ${t.name} (${t.role}): ${t.isApproved ? '✅ Approved' : '⏳ Pending'}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

approveAll();
