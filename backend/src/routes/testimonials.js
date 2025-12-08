const express = require('express');
const { authenticateToken, checkUserStatus, requireRole } = require('../middleware/auth');
const testimonialService = require('../services/testimonialService');
const router = express.Router();

// Get published testimonials (Public)
router.get('/published', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const testimonials = await testimonialService.getPublishedTestimonials(parseInt(limit));

        res.json({
            status: 'success',
            data: testimonials
        });
    } catch (error) {
        console.error('Get testimonials error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch testimonials'
        });
    }
});

// Get all testimonials (Admin only)
router.get('/', authenticateToken, checkUserStatus, requireRole(['ADMIN']), async (req, res) => {
    try {
        const filters = req.query;
        const result = await testimonialService.getAllTestimonials(filters);

        res.json({
            status: 'success',
            data: result
        });
    } catch (error) {
        console.error('Get all testimonials error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch testimonials'
        });
    }
});

// Create testimonial (Authenticated users only)
router.post('/', authenticateToken, checkUserStatus, async (req, res) => {
    try {
        const { message, rating } = req.body;

        if (!message) {
            return res.status(400).json({
                status: 'error',
                message: 'Message is required'
            });
        }

        // Use authenticated user's data from their profile
        const testimonial = await testimonialService.createTestimonial({
            name: req.user.name,
            role: req.user.role,
            message,
            rating: rating || 5,
            userId: req.user.id
        });

        res.status(201).json({
            status: 'success',
            message: 'Testimonial submitted successfully. It will be published after review.',
            data: testimonial
        });
    } catch (error) {
        console.error('Create testimonial error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to submit testimonial'
        });
    }
});

// Approve testimonial (Admin only)
router.patch('/:id/approve', authenticateToken, checkUserStatus, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const testimonial = await testimonialService.approveTestimonial(id);

        res.json({
            status: 'success',
            message: 'Testimonial approved',
            data: testimonial
        });
    } catch (error) {
        console.error('Approve testimonial error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to approve testimonial'
        });
    }
});

// Reject testimonial (Admin only)
router.patch('/:id/reject', authenticateToken, checkUserStatus, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const testimonial = await testimonialService.rejectTestimonial(id);

        res.json({
            status: 'success',
            message: 'Testimonial rejected',
            data: testimonial
        });
    } catch (error) {
        console.error('Reject testimonial error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to reject testimonial'
        });
    }
});

// Delete testimonial (Admin only)
router.delete('/:id', authenticateToken, checkUserStatus, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        await testimonialService.deleteTestimonial(id);

        res.json({
            status: 'success',
            message: 'Testimonial deleted'
        });
    } catch (error) {
        console.error('Delete testimonial error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete testimonial'
        });
    }
});

module.exports = router;
