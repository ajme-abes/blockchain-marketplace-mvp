const express = require('express');
const { authenticateToken, requireRole, checkUserStatus } = require('../middleware/auth');
const { prisma } = require('../config/database');
const router = express.Router();

// All routes require authentication and PRODUCER role
router.use(authenticateToken, checkUserStatus, requireRole(['PRODUCER']));

// Upload verification document
router.post('/documents', async (req, res) => {
    try {
        const { url, filename, type, fileSize, mimeType } = req.body;
        const userId = req.user.id;

        if (!url || !filename || !type) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields: url, filename, type'
            });
        }

        // Get producer profile
        const producer = await prisma.producer.findUnique({
            where: { userId }
        });

        if (!producer) {
            return res.status(404).json({
                status: 'error',
                message: 'Producer profile not found'
            });
        }

        // Create document record
        const document = await prisma.producerDocument.create({
            data: {
                producerId: producer.id,
                type,
                url,
                filename,
                fileSize: fileSize ? parseInt(fileSize) : null,
                mimeType
            }
        });

        // Update producer status to PENDING if it was REJECTED or just to ensure it's pending review
        await prisma.producer.update({
            where: { id: producer.id },
            data: {
                verificationStatus: 'PENDING',
                // Clear rejection reason on new submission
                rejectionReason: null
            }
        });

        // Create notification for admins (optional, but good practice)
        // We could add this later or if there's an admin notification service

        res.status(201).json({
            status: 'success',
            message: 'Document uploaded successfully',
            data: document
        });

    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to upload document',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get my documents
router.get('/documents', async (req, res) => {
    try {
        const userId = req.user.id;

        const producer = await prisma.producer.findUnique({
            where: { userId },
            include: {
                documents: {
                    orderBy: { uploadedAt: 'desc' }
                }
            }
        });

        if (!producer) {
            return res.status(404).json({
                status: 'error',
                message: 'Producer profile not found'
            });
        }

        res.json({
            status: 'success',
            data: producer.documents
        });

    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get documents'
        });
    }
});

// Get producer profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user.id;

        const producer = await prisma.producer.findUnique({
            where: { userId },
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
        });

        if (!producer) {
            return res.status(404).json({
                status: 'error',
                message: 'Producer profile not found'
            });
        }

        res.json({
            status: 'success',
            producer: producer
        });

    } catch (error) {
        console.error('Get producer profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get producer profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update producer profile
router.put('/update-profile', async (req, res) => {
    try {
        const userId = req.user.id;
        const { businessName, location, phone } = req.body;

        // Get producer
        const producer = await prisma.producer.findUnique({
            where: { userId }
        });

        if (!producer) {
            return res.status(404).json({
                status: 'error',
                message: 'Producer profile not found'
            });
        }

        // Update producer and user in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update producer
            const updatedProducer = await tx.producer.update({
                where: { id: producer.id },
                data: {
                    businessName: businessName || producer.businessName,
                    location: location || producer.location
                }
            });

            // Update user phone if provided
            if (phone !== undefined) {
                await tx.user.update({
                    where: { id: userId },
                    data: { phone }
                });
            }

            return updatedProducer;
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE_PRODUCER_PROFILE',
                entity: 'Producer',
                entityId: producer.id,
                userId: userId,
                newValues: {
                    businessName,
                    location,
                    phone
                }
            }
        });

        res.json({
            status: 'success',
            message: 'Profile updated successfully',
            producer: result
        });

    } catch (error) {
        console.error('Update producer profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;


// PUBLIC ROUTE - Get producer public profile (no auth required)
router.get('/:id/profile', async (req, res) => {
    try {
        const { id } = req.params;

        const producer = await prisma.producer.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        registrationDate: true
                    }
                },
                products: {
                    where: { status: 'ACTIVE' },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        category: true,
                        imageUrl: true,
                        unit: true,
                        quantityAvailable: true,
                        status: true
                    },
                    orderBy: { listingDate: 'desc' }
                }
            }
        });

        if (!producer) {
            return res.status(404).json({
                status: 'error',
                message: 'Producer not found'
            });
        }

        // Calculate stats
        const stats = {
            totalProducts: producer.products.length,
            activeProducts: producer.products.filter(p => p.status === 'ACTIVE').length,
            averageRating: 0, // TODO: Calculate from reviews
            totalReviews: 0 // TODO: Count from reviews
        };

        // Format products
        const formattedProducts = producer.products.map(p => ({
            ...p,
            stock: p.quantityAvailable
        }));

        res.json({
            status: 'success',
            data: {
                ...producer,
                products: formattedProducts,
                stats
            }
        });
    } catch (error) {
        console.error('Error fetching producer profile:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch producer profile'
        });
    }
});
