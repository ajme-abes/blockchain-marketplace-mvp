// Seed script to add initial testimonials
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const testimonials = [
    {
        name: 'Mekdes Alemu',
        role: 'BUYER',
        message: 'The quality of products here is exceptional! I can directly connect with farmers and know exactly where my food comes from. The blockchain verification gives me complete confidence in every purchase.',
        rating: 5,
        isApproved: true,
        isPublished: true
    },
    {
        name: 'Getachew Tadesse',
        role: 'PRODUCER',
        message: 'This platform has transformed my business. I can reach buyers directly and get fair prices for my coffee. The payment system is fast and transparent.',
        rating: 5,
        isApproved: true,
        isPublished: true
    },
    {
        name: 'Sara Mohammed',
        role: 'BUYER',
        message: 'Love the blockchain verification! I can trust every transaction and the payment process is seamless. Supporting local producers has never been easier.',
        rating: 5,
        isApproved: true,
        isPublished: true
    },
    {
        name: 'Alemayehu Bekele',
        role: 'PRODUCER',
        message: 'As a coffee farmer, this marketplace has opened up new opportunities. The direct connection with buyers means better prices and faster payments.',
        rating: 5,
        isApproved: true,
        isPublished: true
    },
    {
        name: 'Tigist Haile',
        role: 'BUYER',
        message: 'Fresh products delivered directly from producers. The quality is outstanding and I love supporting Ethiopian farmers directly.',
        rating: 5,
        isApproved: true,
        isPublished: true
    },
    {
        name: 'Dawit Tesfaye',
        role: 'PRODUCER',
        message: 'The platform is easy to use and the support team is very helpful. My honey sales have increased significantly since joining.',
        rating: 5,
        isApproved: true,
        isPublished: true
    }
];

async function seedTestimonials() {
    try {
        console.log('🌱 Seeding testimonials...\n');

        for (const testimonial of testimonials) {
            const created = await prisma.testimonial.create({
                data: testimonial
            });
            console.log(`✅ Created testimonial from ${created.name} (${created.role})`);
        }

        console.log(`\n✅ Successfully seeded ${testimonials.length} testimonials!`);
    } catch (error) {
        console.error('❌ Error seeding testimonials:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedTestimonials();
