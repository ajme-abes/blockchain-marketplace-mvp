// Production Database Health Check Script
const { prisma } = require('./src/config/database');

async function checkDatabaseHealth() {
    try {
        console.log('🔍 Checking Production Database Health...\n');

        // 1. Check total records
        const [users, orders, products, producers] = await Promise.all([
            prisma.user.count(),
            prisma.order.count(),
            prisma.product.count(),
            prisma.producer.count()
        ]);

        console.log('📊 RECORD COUNTS:');
        console.log(`Users: ${users}`);
        console.log(`Orders: ${orders}`);
        console.log(`Products: ${products}`);
        console.log(`Producers: ${producers}\n`);

        // 2. Check user status breakdown
        const usersByStatus = await prisma.user.groupBy({
            by: ['status', 'role'],
            _count: { id: true }
        });

        console.log('👥 USER BREAKDOWN:');
        usersByStatus.forEach(group => {
            console.log(`${group.role} - ${group.status}: ${group._count.id}`);
        });
        console.log();

        // 3. Check order status
        const ordersByStatus = await prisma.order.groupBy({
            by: ['paymentStatus'],
            _count: { id: true }
        });

        console.log('🛒 ORDER STATUS:');
        ordersByStatus.forEach(group => {
            console.log(`${group.paymentStatus}: ${group._count.id}`);
        });
        console.log();

        // 4. Check recent activity (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const recentActivity = await Promise.all([
            prisma.user.count({
                where: { registrationDate: { gte: weekAgo } }
            }),
            prisma.order.count({
                where: { orderDate: { gte: weekAgo } }
            }),
            prisma.product.count({
                where: { listingDate: { gte: weekAgo } }
            })
        ]);

        console.log('📈 RECENT ACTIVITY (Last 7 days):');
        console.log(`New Users: ${recentActivity[0]}`);
        console.log(`New Orders: ${recentActivity[1]}`);
        console.log(`New Products: ${recentActivity[2]}\n`);

        // 5. Check payout status
        const payoutStatus = await prisma.orderProducer.groupBy({
            by: ['payoutStatus'],
            _count: { id: true },
            _sum: { producerAmount: true }
        });

        console.log('💰 PAYOUT STATUS:');
        payoutStatus.forEach(group => {
            console.log(`${group.payoutStatus}: ${group._count.id} orders, ${group._sum.producerAmount || 0} ETB`);
        });
        console.log();

        // 6. Check for any issues
        const issues = [];

        // Check for unverified users older than 24 hours
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        const unverifiedUsers = await prisma.user.count({
            where: {
                emailVerified: false,
                registrationDate: { lt: dayAgo }
            }
        });

        if (unverifiedUsers > 0) {
            issues.push(`${unverifiedUsers} users unverified for >24h`);
        }

        // Check for pending orders older than 7 days
        const pendingOrders = await prisma.order.count({
            where: {
                paymentStatus: 'PENDING',
                orderDate: { lt: weekAgo }
            }
        });

        if (pendingOrders > 0) {
            issues.push(`${pendingOrders} orders pending for >7 days`);
        }

        console.log('⚠️ POTENTIAL ISSUES:');
        if (issues.length > 0) {
            issues.forEach(issue => console.log(`- ${issue}`));
        } else {
            console.log('✅ No issues detected');
        }

        console.log('\n🎉 Database health check completed!');

    } catch (error) {
        console.error('❌ Database health check failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the health check
checkDatabaseHealth();