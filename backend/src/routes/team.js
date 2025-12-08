const express = require('express');
const multer = require('multer');
const { authenticateToken, checkUserStatus, requireRole } = require('../middleware/auth');
const teamService = require('../services/teamService');
const ipfsService = require('../services/ipfsService');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get active team members (Public)
router.get('/active', async (req, res) => {
    try {
        const members = await teamService.getActiveTeamMembers();

        res.json({
            status: 'success',
            data: members
        });
    } catch (error) {
        console.error('Get active team members error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch team members'
        });
    }
});

// Get all team members (Admin only)
router.get('/', authenticateToken, checkUserStatus, requireRole(['ADMIN']), async (req, res) => {
    try {
        const members = await teamService.getAllTeamMembers();

        res.json({
            status: 'success',
            data: members
        });
    } catch (error) {
        console.error('Get all team members error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch team members'
        });
    }
});

// Get single team member
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const member = await teamService.getTeamMember(id);

        res.json({
            status: 'success',
            data: member
        });
    } catch (error) {
        console.error('Get team member error:', error);
        res.status(404).json({
            status: 'error',
            message: error.message || 'Team member not found'
        });
    }
});

// Create team member (Admin only)
router.post('/', authenticateToken, checkUserStatus, requireRole(['ADMIN']), upload.single('image'), async (req, res) => {
    try {
        const { name, role, bio, email, linkedin, twitter, order } = req.body;

        if (!name || !role) {
            return res.status(400).json({
                status: 'error',
                message: 'Name and role are required'
            });
        }

        let imageUrl = null;

        // Upload image to IPFS if provided
        if (req.file) {
            try {
                const uploadResult = await ipfsService.uploadFile(req.file.buffer, req.file.originalname, 'USER_AVATAR');
                
                if (!uploadResult.success) {
                    return res.status(500).json({
                        status: 'error',
                        message: uploadResult.error || 'Failed to upload image'
                    });
                }
                
                imageUrl = `https://gateway.pinata.cloud/ipfs/${uploadResult.cid}`;
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                return res.status(500).json({
                    status: 'error',
                    message: 'Failed to upload image'
                });
            }
        }

        const member = await teamService.createTeamMember({
            name,
            role,
            bio,
            imageUrl,
            email,
            linkedin,
            twitter,
            order: order ? parseInt(order, 10) : 0
        });

        res.status(201).json({
            status: 'success',
            message: 'Team member created successfully',
            data: member
        });
    } catch (error) {
        console.error('Create team member error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create team member'
        });
    }
});

// Update team member (Admin only)
router.put('/:id', authenticateToken, checkUserStatus, requireRole(['ADMIN']), upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Convert order to integer if provided
        if (updateData.order) {
            updateData.order = parseInt(updateData.order, 10);
        }

        // Upload new image to IPFS if provided
        if (req.file) {
            try {
                const uploadResult = await ipfsService.uploadFile(req.file.buffer, req.file.originalname, 'USER_AVATAR');
                
                if (!uploadResult.success) {
                    return res.status(500).json({
                        status: 'error',
                        message: uploadResult.error || 'Failed to upload image'
                    });
                }
                
                updateData.imageUrl = `https://gateway.pinata.cloud/ipfs/${uploadResult.cid}`;
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                return res.status(500).json({
                    status: 'error',
                    message: 'Failed to upload image'
                });
            }
        }

        const member = await teamService.updateTeamMember(id, updateData);

        res.json({
            status: 'success',
            message: 'Team member updated successfully',
            data: member
        });
    } catch (error) {
        console.error('Update team member error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update team member'
        });
    }
});

// Toggle active status (Admin only)
router.patch('/:id/toggle-active', authenticateToken, checkUserStatus, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const member = await teamService.toggleActiveStatus(id);

        res.json({
            status: 'success',
            message: 'Team member status updated',
            data: member
        });
    } catch (error) {
        console.error('Toggle active status error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update status'
        });
    }
});

// Delete team member (Admin only)
router.delete('/:id', authenticateToken, checkUserStatus, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        await teamService.deleteTeamMember(id);

        res.json({
            status: 'success',
            message: 'Team member deleted successfully'
        });
    } catch (error) {
        console.error('Delete team member error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete team member'
        });
    }
});

// Reorder team members (Admin only)
router.post('/reorder', authenticateToken, checkUserStatus, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { orderData } = req.body;

        if (!Array.isArray(orderData)) {
            return res.status(400).json({
                status: 'error',
                message: 'Order data must be an array'
            });
        }

        await teamService.reorderTeamMembers(orderData);

        res.json({
            status: 'success',
            message: 'Team members reordered successfully'
        });
    } catch (error) {
        console.error('Reorder team members error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to reorder team members'
        });
    }
});

module.exports = router;
