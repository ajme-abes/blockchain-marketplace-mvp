const express = require('express');
const blockchainService = require('../services/blockchainService');
const router = express.Router();

// Get blockchain status
router.get('/status', async (req, res) => {
  try {
    const status = await blockchainService.getBlockchainStatus();
    res.json({
      status: 'success',
      data: status
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get blockchain status',
      error: error.message
    });
  }
});

// Record transaction on blockchain
router.post('/record-transaction', async (req, res) => {
  try {
    const {
      orderId,
      productId,
      buyerAddress,
      sellerAddress,
      amount,
      paymentMethod = 'chapa',
      status = 'confirmed'
    } = req.body;

    // Validate required fields
    if (!orderId || !productId || !buyerAddress || !sellerAddress || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: orderId, productId, buyerAddress, sellerAddress, amount'
      });
    }

    const result = await blockchainService.recordTransaction({
      orderId,
      productId,
      buyerAddress,
      sellerAddress,
      amount,
      paymentMethod,
      status
    });

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Transaction recorded successfully',
        data: result
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Failed to record transaction',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get transaction from blockchain
router.get('/transaction/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await blockchainService.getTransaction(orderId);
    
    if (result.success) {
      res.json({
        status: 'success',
        data: result
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Failed to get transaction',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;