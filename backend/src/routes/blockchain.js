const { prisma } = require('../config/database');
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

// Record transaction on blockchain - UPDATED
router.post('/record-transaction', async (req, res) => {
  try {
    const {
      orderId,
      paymentReference,
      amountETB,
      buyer,
      producer,
      txHash
    } = req.body;

    // Validate required fields for NEW contract
    if (!orderId || !paymentReference || !amountETB || !buyer || !producer || !txHash) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: orderId, paymentReference, amountETB, buyer, producer, txHash'
      });
    }

    // Validate Ethereum addresses
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(buyer)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid buyer address format'
      });
    }
    if (!ethAddressRegex.test(producer)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid producer address format'
      });
    }

    const result = await blockchainService.recordTransaction({
      orderId,
      paymentReference,
      amountETB,
      buyer,
      producer,
      txHash
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
      res.status(404).json({
        status: 'error',
        message: 'Transaction not found',
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

    console.log('🔍 Verifying transaction for order:', orderId);

    const verification = await blockchainService.verifyTransaction(orderId);

    console.log('✅ Verification result:', verification);

    // Handle mock/disconnected blockchain
    if (verification.isMock) {
      return res.json({
        status: 'success',
        data: {
          verified: false,
          transaction: null,
          message: 'Blockchain service is not connected. Transaction recording is in progress.',
          isMock: true
        }
      });
    }

    res.json({
      status: 'success',
      data: {
        verified: verification.exists,
        transaction: verification.exists ? {
          orderId: verification.orderId,
          txHash: verification.txHash,
          timestamp: verification.timestamp,
          isVerified: verification.isVerified
        } : null,
        message: verification.exists
          ? 'Transaction verified on Polygon blockchain'
          : verification.error || 'Transaction not found on blockchain. It may still be processing.'
      }
    });
  } catch (error) {
    console.error('❌ Blockchain verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Verification service temporarily unavailable'
    });
  }
});

// Get user transactions - NEW
router.get('/user/:address/transactions', async (req, res) => {
  try {
    const { address } = req.params;

    // Validate Ethereum address
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(address)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Ethereum address format'
      });
    }

    const result = await blockchainService.getUserTransactions(address);

    if (result.success) {
      res.json({
        status: 'success',
        data: result
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Failed to get user transactions',
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

// Get producer transactions - NEW
router.get('/producer/:address/transactions', async (req, res) => {
  try {
    const { address } = req.params;

    // Validate Ethereum address
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(address)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Ethereum address format'
      });
    }

    const result = await blockchainService.getProducerTransactions(address);

    if (result.success) {
      res.json({
        status: 'success',
        data: result
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Failed to get producer transactions',
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

// Get transaction count - NEW
router.get('/stats/count', async (req, res) => {
  try {
    const result = await blockchainService.getTransactionCount();

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get transaction count',
      error: error.message
    });
  }
});

// Get contract owner info - NEW
router.get('/contract/owner', async (req, res) => {
  try {
    const isOwner = await blockchainService.isContractOwner();
    const status = await blockchainService.getBlockchainStatus();

    res.json({
      status: 'success',
      data: {
        isOwner: isOwner,
        contractOwner: status.contractOwner,
        connectedWallet: status.wallet?.address
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get contract owner info',
      error: error.message
    });
  }
});

// TEST ROUTES - Updated for new contract
router.post('/test/record-mock', async (req, res) => {
  try {
    const {
      orderId,
      paymentReference,
      amountETB,
      buyer,
      producer,
      txHash
    } = req.body;

    const result = await blockchainService.recordTransaction({
      orderId: orderId || 'test-order-' + Date.now(),
      paymentReference: paymentReference || 'test-ref-' + Math.random().toString(36).substring(7),
      amountETB: amountETB || '100.50 ETB',
      buyer: buyer || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Hardhat account 1
      producer: producer || '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Hardhat account 2
      txHash: txHash || '0x' + Math.random().toString(16).substr(2, 64)
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

// Test get user transactions - NEW
router.get('/test/user/:address/transactions', async (req, res) => {
  try {
    const { address } = req.params;
    const result = await blockchainService.getUserTransactions(address);

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

// Test get producer transactions - NEW
router.get('/test/producer/:address/transactions', async (req, res) => {
  try {
    const { address } = req.params;
    const result = await blockchainService.getProducerTransactions(address);

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
// Add this new endpoint
router.post('/order/:orderId/record', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentReference, txHash } = req.body;

    const result = await blockchainService.recordOrderTransaction(orderId, {
      reference: paymentReference,
      txHash: txHash
    });

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Order recorded on blockchain',
        data: {
          blockchainTxHash: result.blockchainTxHash,
          blockchainOrderId: result.blockchainOrderId
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Failed to record order on blockchain',
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

// Add endpoint to check blockchain status
router.get('/order/:orderId/blockchain-status', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        blockchainRecorded: true,
        blockchainTxHash: true,
        blockchainOrderId: true,
        blockchainError: true
      }
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        blockchainRecorded: order.blockchainRecorded,
        blockchainTxHash: order.blockchainTxHash,
        blockchainOrderId: order.blockchainOrderId,
        hasError: !!order.blockchainError,
        error: order.blockchainError
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;