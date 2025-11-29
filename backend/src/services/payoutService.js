// backend/src/services/payoutService.js
const { prisma } = require('../config/database');

class PayoutService {
    constructor() {
        // Marketplace commission rate (10%)
        this.COMMISSION_RATE = parseFloat(process.env.MARKETPLACE_COMMISSION_RATE || '0.10');
        console.log(`💰 Payout Service initialized with ${this.COMMISSION_RATE * 100}% commission rate`);
    }

    /**
     * Calculate producer amounts and create OrderProducer records
     * Called when order is created
     */
    async calculateProducerSplits(orderId, orderItems) {
        try {
            console.log(`💰 Calculating producer splits for order: ${orderId}`);

            // Group items by producer
            const producerMap = new Map();

            for (const item of orderItems) {
                const producerId = item.product.producer.id;
                const producerUserId = item.product.producer.user.id;
                const producerName = item.product.producer.businessName;

                if (!producerMap.has(producerId)) {
                    producerMap.set(producerId, {
                        producerId: producerId,
                        producerUserId: producerUserId,
                        producerName: producerName,
                        productIds: [],
                        subtotal: 0
                    });
                }

                const producerData = producerMap.get(producerId);
                producerData.productIds.push(item.productId);
                producerData.subtotal += item.subtotal;
            }

            const producers = Array.from(producerMap.values());
            console.log(`📦 Order has ${producers.length} producer(s)`);

            // Create OrderProducer records with payout calculations
            const orderProducers = [];

            for (const producer of producers) {
                const commission = producer.subtotal * this.COMMISSION_RATE;
                const producerAmount = producer.subtotal - commission;

                const orderProducer = await prisma.orderProducer.upsert({
                    where: {
                        orderId_producerId: {
                            orderId: orderId,
                            producerId: producer.producerId
                        }
                    },
                    create: {
                        orderId: orderId,
                        producerId: producer.producerId,
                        productIds: producer.productIds,
                        subtotal: producer.subtotal,
                        marketplaceCommission: commission,
                        producerAmount: producerAmount,
                        payoutStatus: 'PENDING'
                    },
                    update: {
                        productIds: producer.productIds,
                        subtotal: producer.subtotal,
                        marketplaceCommission: commission,
                        producerAmount: producerAmount
                    }
                });

                orderProducers.push(orderProducer);

                console.log(`✅ ${producer.producerName}:`, {
                    subtotal: producer.subtotal,
                    commission: commission,
                    producerAmount: producerAmount
                });
            }

            return {
                success: true,
                producers: orderProducers,
                totalCommission: orderProducers.reduce((sum, op) => sum + op.marketplaceCommission, 0)
            };

        } catch (error) {
            console.error('❌ Error calculating producer splits:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Schedule payouts for an order
     * Called after payment is confirmed
     */
    async scheduleProducerPayouts(orderId) {
        try {
            console.log(`📅 Scheduling payouts for order: ${orderId}`);

            // Get all producers for this order
            const orderProducers = await prisma.orderProducer.findMany({
                where: {
                    orderId: orderId,
                    payoutStatus: 'PENDING'
                },
                include: {
                    producer: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    }
                }
            });

            if (orderProducers.length === 0) {
                console.log('⚠️ No pending payouts found for this order');
                return { success: true, message: 'No pending payouts' };
            }

            const scheduledPayouts = [];

            // Schedule payout for each producer
            for (const op of orderProducers) {
                // Check if there's already a pending/scheduled payout for this producer
                const nextPayoutDate = this.getNextPayoutDate();

                let payout = await prisma.producerPayout.findFirst({
                    where: {
                        producerId: op.producerId,
                        status: { in: ['PENDING', 'SCHEDULED'] },
                        scheduledFor: nextPayoutDate
                    }
                });

                if (!payout) {
                    // Create new payout batch
                    payout = await prisma.producerPayout.create({
                        data: {
                            producerId: op.producerId,
                            amount: op.subtotal,
                            commission: op.marketplaceCommission,
                            netAmount: op.producerAmount,
                            status: 'SCHEDULED',
                            scheduledFor: nextPayoutDate
                        }
                    });

                    console.log(`✅ Created payout batch for ${op.producer.user.name}: ${op.producerAmount} ETB`);
                } else {
                    // Add to existing payout batch
                    await prisma.producerPayout.update({
                        where: { id: payout.id },
                        data: {
                            amount: { increment: op.subtotal },
                            commission: { increment: op.marketplaceCommission },
                            netAmount: { increment: op.producerAmount }
                        }
                    });

                    console.log(`✅ Added to existing payout batch for ${op.producer.user.name}`);
                }

                // Link this order to the payout
                await prisma.payoutOrderItem.create({
                    data: {
                        payoutId: payout.id,
                        orderProducerId: op.id,
                        amount: op.producerAmount
                    }
                });

                // Update OrderProducer status
                await prisma.orderProducer.update({
                    where: { id: op.id },
                    data: { payoutStatus: 'SCHEDULED' }
                });

                scheduledPayouts.push({
                    producer: op.producer.user.name,
                    amount: op.producerAmount,
                    scheduledFor: nextPayoutDate
                });
            }

            return {
                success: true,
                payouts: scheduledPayouts,
                nextPayoutDate: this.getNextPayoutDate()
            };

        } catch (error) {
            console.error('❌ Error scheduling payouts:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get next payout date (every Friday at noon)
     */
    getNextPayoutDate() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7; // If today is Friday, schedule for next Friday
        const nextFriday = new Date(today);
        nextFriday.setDate(today.getDate() + daysUntilFriday);
        nextFriday.setHours(12, 0, 0, 0); // Noon
        return nextFriday;
    }

    /**
     * Get ALL payouts (all statuses)
     */
    async getAllPayouts() {
        try {
            const payouts = await prisma.producerPayout.findMany({
                include: {
                    producer: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    phone: true
                                }
                            }
                        }
                    },
                    payoutOrderItems: {
                        include: {
                            orderProducer: {
                                include: {
                                    order: {
                                        select: {
                                            id: true,
                                            orderDate: true,
                                            totalAmount: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: [
                    { status: 'asc' },
                    { scheduledFor: 'asc' }
                ]
            });

            return {
                success: true,
                payouts: payouts.map(p => this.formatPayoutResponse(p))
            };

        } catch (error) {
            console.error('❌ Error getting all payouts:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all pending/scheduled payouts
     */
    async getPendingPayouts() {
        try {
            const payouts = await prisma.producerPayout.findMany({
                where: {
                    status: { in: ['PENDING', 'SCHEDULED'] }
                },
                include: {
                    producer: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    phone: true
                                }
                            }
                        }
                    },
                    payoutOrderItems: {
                        include: {
                            orderProducer: {
                                include: {
                                    order: {
                                        select: {
                                            id: true,
                                            orderDate: true,
                                            totalAmount: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { scheduledFor: 'asc' }
            });

            return {
                success: true,
                payouts: payouts.map(p => this.formatPayoutResponse(p))
            };

        } catch (error) {
            console.error('❌ Error getting pending payouts:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get payouts due for processing (scheduled for today or earlier)
     */
    async getDuePayouts() {
        try {
            const payouts = await prisma.producerPayout.findMany({
                where: {
                    status: { in: ['PENDING', 'SCHEDULED'] },
                    scheduledFor: {
                        lte: new Date()
                    }
                },
                include: {
                    producer: {
                        include: {
                            user: true
                        }
                    },
                    payoutOrderItems: {
                        include: {
                            orderProducer: {
                                include: {
                                    order: true
                                }
                            }
                        }
                    }
                },
                orderBy: { scheduledFor: 'asc' }
            });

            return {
                success: true,
                payouts: payouts.map(p => this.formatPayoutResponse(p)),
                count: payouts.length
            };

        } catch (error) {
            console.error('❌ Error getting due payouts:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Mark payout as processing
     */
    async markPayoutProcessing(payoutId) {
        try {
            const payout = await prisma.producerPayout.update({
                where: { id: payoutId },
                data: {
                    status: 'PROCESSING',
                    updatedAt: new Date()
                },
                include: {
                    producer: {
                        include: { user: true }
                    }
                }
            });

            console.log(`🔄 Payout ${payoutId} marked as PROCESSING`);

            return {
                success: true,
                payout: this.formatPayoutResponse(payout)
            };

        } catch (error) {
            console.error('❌ Error marking payout as processing:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Mark payout as completed
     */
    async markPayoutComplete(payoutId, payoutReference, payoutMethod = 'BANK_TRANSFER') {
        try {
            console.log(`✅ Marking payout ${payoutId} as complete`);

            const result = await prisma.$transaction(async (tx) => {
                // Update payout status
                const payout = await tx.producerPayout.update({
                    where: { id: payoutId },
                    data: {
                        status: 'COMPLETED',
                        paidAt: new Date(),
                        payoutReference: payoutReference,
                        payoutMethod: payoutMethod,
                        updatedAt: new Date()
                    },
                    include: {
                        producer: {
                            include: { user: true }
                        }
                    }
                });

                // Update all related OrderProducer records
                const payoutItems = await tx.payoutOrderItem.findMany({
                    where: { payoutId: payoutId }
                });

                for (const item of payoutItems) {
                    await tx.orderProducer.update({
                        where: { id: item.orderProducerId },
                        data: {
                            payoutStatus: 'COMPLETED',
                            paidAt: new Date(),
                            payoutReference: payoutReference
                        }
                    });
                }

                console.log(`✅ Updated ${payoutItems.length} order producer records`);

                return payout;
            });

            // TODO: Send notification to producer
            console.log(`📧 TODO: Send payout notification to ${result.producer.user.email}`);

            return {
                success: true,
                payout: this.formatPayoutResponse(result),
                message: `Payout completed for ${result.producer.user.name}`
            };

        } catch (error) {
            console.error('❌ Error marking payout as complete:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Mark payout as failed
     */
    async markPayoutFailed(payoutId, reason) {
        try {
            const payout = await prisma.producerPayout.update({
                where: { id: payoutId },
                data: {
                    status: 'FAILED',
                    notes: reason,
                    updatedAt: new Date()
                },
                include: {
                    producer: {
                        include: { user: true }
                    }
                }
            });

            console.log(`❌ Payout ${payoutId} marked as FAILED: ${reason}`);

            return {
                success: true,
                payout: this.formatPayoutResponse(payout)
            };

        } catch (error) {
            console.error('❌ Error marking payout as failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get producer payout history
     */
    async getProducerPayouts(producerId, pagination = {}) {
        try {
            const { page = 1, limit = 20 } = pagination;

            const [payouts, totalCount] = await Promise.all([
                prisma.producerPayout.findMany({
                    where: { producerId },
                    include: {
                        payoutOrderItems: {
                            include: {
                                orderProducer: {
                                    include: {
                                        order: {
                                            select: {
                                                id: true,
                                                orderDate: true,
                                                totalAmount: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit
                }),
                prisma.producerPayout.count({ where: { producerId } })
            ]);

            return {
                success: true,
                payouts: payouts.map(p => this.formatPayoutResponse(p)),
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit)
                }
            };

        } catch (error) {
            console.error('❌ Error getting producer payouts:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get producer earnings summary
     */
    async getProducerEarnings(producerId) {
        try {
            const [pending, completed, total] = await Promise.all([
                // Pending earnings
                prisma.orderProducer.aggregate({
                    where: {
                        producerId,
                        payoutStatus: { in: ['PENDING', 'SCHEDULED'] }
                    },
                    _sum: { producerAmount: true }
                }),
                // Completed payouts
                prisma.producerPayout.aggregate({
                    where: {
                        producerId,
                        status: 'COMPLETED'
                    },
                    _sum: { netAmount: true }
                }),
                // Total earnings (all time)
                prisma.orderProducer.aggregate({
                    where: { producerId },
                    _sum: { producerAmount: true }
                })
            ]);

            return {
                success: true,
                earnings: {
                    pending: pending._sum.producerAmount || 0,
                    completed: completed._sum.netAmount || 0,
                    total: total._sum.producerAmount || 0
                }
            };

        } catch (error) {
            console.error('❌ Error getting producer earnings:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Format payout response
     */
    formatPayoutResponse(payout) {
        return {
            id: payout.id,
            producer: payout.producer ? {
                id: payout.producer.id,
                businessName: payout.producer.businessName,
                location: payout.producer.location,
                verificationStatus: payout.producer.verificationStatus,
                user: payout.producer.user
            } : null,
            amount: payout.amount,
            commission: payout.commission,
            netAmount: payout.netAmount,
            status: payout.status,
            payoutMethod: payout.payoutMethod,
            payoutReference: payout.payoutReference,
            scheduledFor: payout.scheduledFor,
            paidAt: payout.paidAt,
            notes: payout.notes,
            orders: payout.payoutOrderItems ? payout.payoutOrderItems.map(item => ({
                orderId: item.orderProducer.order.id,
                orderDate: item.orderProducer.order.orderDate,
                amount: item.amount
            })) : [],
            createdAt: payout.createdAt,
            updatedAt: payout.updatedAt
        };
    }
}

module.exports = new PayoutService();
