const express = require('express');
const { authenticateToken, checkUserStatus, requireRole } = require('../middleware/auth');
const contactService = require('../services/contactService');
const { prisma } = require('../config/database');
const router = express.Router();

// Submit contact message (Public or Authenticated)
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                status: 'error',
                message: 'All fields are required'
            });
        }

        const contactMessage = await contactService.createMessage({
            name,
            email,
            subject,
            message,
            userId: req.user?.id || null
        });

        res.status(201).json({
            status: 'success',
            message: 'Message sent successfully. We will get back to you soon!',
            data: contactMessage
        });
    } catch (error) {
        console.error('Create contact message error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to send message'
        });
    }
});

// Get user's own messages (Authenticated users)
router.get('/my-messages', authenticateToken, checkUserStatus, async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;

        // Get messages where userId matches OR email matches (for messages sent before login)
        const messages = await prisma.contactMessage.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { email: userEmail }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            status: 'success',
            data: messages.map(m => ({
                id: m.id,
                subject: m.subject,
                message: m.message,
                status: m.status,
                adminNotes: m.adminNotes,
                respondedAt: m.respondedAt,
                createdAt: m.createdAt
            }))
        });
    } catch (error) {
        console.error('Get my messages error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch messages'
        });
    }
});

// Get all messages (Admin only)
router.get('/', authenticateToken, checkUserStatus, requireRole(['ADMIN']), async (req, res) => {
    try {
        const filters = req.query;
        const result = await contactService.getAllMessages(filters);

        res.json({
            status: 'success',
            data: result
        });
    } catch (error) {
        console.error('Get contact messages error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch messages'
        });
    }
});

// Get unread count (Admin only)
router.get('/unread-count', authenticateToken, checkUserStatus, requireRole(['ADMIN']), async (req, res) => {
    try {
        const count = await contactService.getUnreadCount();

        res.json({
            status: 'success',
            data: { count }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch unread count'
        });
    }
});

// Get message by ID (Admin only)
router.get('/:id', authenticateToken, checkUserStatus, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const message = await contactService.getMessageById(id);

        if (!message) {
            return res.status(404).json({
                status: 'error',
                message: 'Message not found'
            });
        }

        res.json({
            status: 'success',
            data: message
        });
    } catch (error) {
        console.error('Get contact message error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch message'
        });
    }
});

// Update message status (Admin only)
router.patch('/:id/status', authenticateToken, checkUserStatus, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;

        const validStatuses = ['UNREAD', 'READ', 'RESPONDED', 'ARCHIVED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid status'
            });
        }

        const message = await contactService.updateMessageStatus(id, status, adminNotes);

        res.json({
            status: 'success',
            message: 'Message status updated',
            data: message
        });
    } catch (error) {
        console.error('Update message status error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update message status'
        });
    }
});

// Delete message (Admin only)
router.delete('/:id', authenticateToken, checkUserStatus, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        await contactService.deleteMessage(id);

        res.json({
            status: 'success',
            message: 'Message deleted'
        });
    } catch (error) {
        console.error('Delete contact message error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete message'
        });
    }
});

module.exports = router;
