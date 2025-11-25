const express = require('express');
const { authenticateToken, checkUserStatus } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, checkUserStatus, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const result = await notificationService.getUserNotifications(
      req.user.id, 
      parseInt(page), 
      parseInt(limit)
    );

    if (result.success) {
      res.json({
        status: 'success',
        data: result
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get notifications'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, checkUserStatus, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await notificationService.markAsRead(id, req.user.id);

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Notification marked as read'
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, checkUserStatus, async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);

    if (result.success) {
      res.json({
        status: 'success',
        message: 'All notifications marked as read'
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notifications as read'
    });
  }
});

module.exports = router;