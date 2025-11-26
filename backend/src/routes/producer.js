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

module.exports = router;
