const express = require('express');
const { prisma } = require('../config/database');
const router = express.Router();

// Get public statistics for hero section
router.get('/hero', async (req, res) => {
    try {
        const [
            totalProducers,
            verifiedProducers,
            totalUsers,
            totalOrders,
            completedOrders
        ] = await Promise.all([
            prisma.producer.count(),
            prisma.producer.count({ where: { verificationStatus: 'VERIFIED' } }),
            prisma.user.count(),
            prisma.order.count(),
            prisma.order.count({ where: { deliveryStatus: 'DELIVERED' } })
        ]);

        // Calculate satisfaction rate (completed orders / total orders)
        const satisfactionRate = totalOrders > 0
            ? Math.round((completedOrders / totalOrders) * 100)
            : 98; // Default fallback

        res.json({
            status: 'success',
            data: {
                verifiedProducers,
                totalProducers,
                totalUsers,
                totalOrders,
                completedOrders,
                satisfactionRate
            }
        });
    } catch (error) {
        console.error('Get hero stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch statistics'
        });
    }
});

module.exports = router;

// Get detailed statistics for about section
router.get('/about', async (req, res) => {
    try {
        const [
            activeProducers,
            totalOrders,
            completedOrders,
            uniqueRegions
        ] = await Promise.all([
            // Active producers (verified and have at least one product)
            prisma.producer.count({
                where: {
                    verificationStatus: 'VERIFIED',
                    products: {
                        some: {
                            status: 'ACTIVE'
                        }
                    }
                }
            }),
            // Total orders
            prisma.order.count(),
            // Completed orders for satisfaction rate
            prisma.order.count({ where: { deliveryStatus: 'DELIVERED' } }),
            // Count unique regions from producers
            prisma.producer.findMany({
                where: { verificationStatus: 'VERIFIED' },
                select: { location: true },
                distinct: ['location']
            })
        ]);

        // Calculate satisfaction rate
        const satisfactionRate = totalOrders > 0
            ? Math.round((completedOrders / totalOrders) * 100)
            : 98;

        res.json({
            status: 'success',
            data: {
                activeProducers,
                totalTransactions: totalOrders,
                satisfactionRate,
                regionsServed: uniqueRegions.length || 1 // At least 1 region
            }
        });
    } catch (error) {
        console.error('Get about stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch statistics'
        });
    }
});
