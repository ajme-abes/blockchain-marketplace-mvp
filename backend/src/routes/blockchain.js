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
      paymentMethod = 'CHAPA',
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

// Verify transaction on blockchain
router.get('/verify/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const verification = await blockchainService.verifyTransaction(orderId);
    
    res.json({
      status: 'success',
      data: {
        verified: verification.exists,
        transaction: verification.exists ? verification : null,
        message: verification.exists 
          ? 'Transaction verified on blockchain' 
          : 'Transaction not found on blockchain'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify transaction',
      error: error.message
    });
  }
});
// TEST ROUTES - Remove these after testing
router.post('/test/record-mock', async (req, res) => {
  try {
    const { orderId, paymentReference, txHash } = req.body;
    
    const result = await blockchainService.recordTransaction({
      orderId: orderId || 'test-order-' + Date.now(),
      paymentReference: paymentReference || 'test-ref-' + Math.random(),
      txHash: txHash || 'test-tx-' + Math.random()
    });

    res.json({
      status: 'success',
      message: 'Mock transaction recorded',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

router.get('/test/verify/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await blockchainService.verifyTransaction(orderId);
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});
module.exports = router;