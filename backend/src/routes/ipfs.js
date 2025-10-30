// backend/src/routes/ipfs.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const ipfsService = require('../services/ipfsService');
const router = express.Router();

// Get IPFS file metadata
router.get('/metadata/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    
    const result = await ipfsService.getIPFSMetadata(cid);
    
    if (!result.success) {
      return res.status(404).json({
        status: 'error',
        message: 'IPFS metadata not found'
      });
    }

    res.json({
      status: 'success',
      data: result.metadata
    });

  } catch (error) {
    console.error('Get IPFS metadata error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch IPFS metadata'
    });
  }
});

// Get IPFS file content (stream file)
router.get('/file/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    
    const result = await ipfsService.getFile(cid);
    
    if (!result.success) {
      return res.status(404).json({
        status: 'error',
        message: 'File not found on IPFS'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', result.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${cid}"`);
    
    // Send file data
    res.send(result.data);

  } catch (error) {
    console.error('Get IPFS file error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch file from IPFS'
    });
  }
});

// Upload file to IPFS (standalone endpoint)
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    // This would need multer configuration similar to product routes
    // You can reuse the same upload middleware
    
    res.json({
      status: 'success',
      message: 'Use the product creation/update endpoints for file uploads'
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Upload failed'
    });
  }
});

module.exports = router;