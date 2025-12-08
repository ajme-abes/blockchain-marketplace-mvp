const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTestimonials() {
    const testimonials = await prisma.testimonial.findMany();

    console.log('📊 Testimonials Status:\n');
    console.log(`Total: ${testimonials.length}`);
    console.log(`Approved: ${testimonials.filter(t => t.isApproved).length}`);
    console.log(`Published: ${testimonials.filter(t => t.isPublished).length}\n`);

    testimonials.forEach(t => {
        console.log(`- ${t.name} (${t.role}): approved=${t.isApproved}, published=${t.isPublished}`);
    });

    await prisma.$disconnect();
}

checkTestimonials();
