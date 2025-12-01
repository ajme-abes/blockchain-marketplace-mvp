// Test script to check what categories exist in the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
    try {
        console.log('🔍 Checking categories in database...\n');

        // Get all unique categories
        const products = await prisma.product.findMany({
            select: {
                category: true,
                name: true,
                status: true
            }
        });

        console.log(`📦 Total products: ${products.length}\n`);

        // Group by category
        const categoryMap = {};
        products.forEach(product => {
            const cat = product.category;
            if (!categoryMap[cat]) {
                categoryMap[cat] = {
                    count: 0,
                    active: 0,
                    products: []
                };
            }
            categoryMap[cat].count++;
            if (product.status === 'ACTIVE') {
                categoryMap[cat].active++;
            }
            categoryMap[cat].products.push(product.name);
        });

        console.log('📊 Categories found:');
        console.log('='.repeat(60));
        Object.entries(categoryMap).forEach(([category, data]) => {
            console.log(`\n${category}:`);
            console.log(`  Total: ${data.count} products`);
            console.log(`  Active: ${data.active} products`);
            console.log(`  Products: ${data.products.join(', ')}`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ Category check complete!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCategories();
