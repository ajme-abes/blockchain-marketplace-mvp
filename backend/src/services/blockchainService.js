const { prisma } = require('../config/database');
const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');
const systemWalletService = require('./systemWalletService');

class BlockchainService {
  constructor() {
    this.isConnected = false;
    this.provider = null;
    this.contract = null;
    this.contractAddress = null;
    this.wallet = null;
    this.init();
  }

  async init() {
    try {
      // Load contract info from root
      const contractInfo = this.loadContractInfo();
      this.contractAddress = contractInfo?.address;
      
      if (!this.contractAddress) {
        console.log('❌ No contract address found - using mock mode');
        this.isConnected = false;
        return;
      }

      // Setup provider and wallet (ethers v5 syntax)
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
      const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
      
      if (!privateKey) {
        console.log('❌ No private key found - using mock mode');
        this.isConnected = false;
        return;
      }

      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      // Contract ABI - UPDATED for new contract (ethers v5 syntax)
      const contractABI = [
        // Owner and constructor
        "function owner() external view returns (address)",
        
        // Transaction functions
        "function recordTransaction(string, string, string, address, address, string) external",
        "function getTransaction(string) external view returns (string, string, string, address, address, uint256, string, bool)",
        "function verifyTransaction(string) external view returns (bool)",
        "function getTransactionCount() external view returns (uint256)",
        
        // User/producer functions - NEW
        "function getUserTransactions(address) external view returns (string[])",
        "function getProducerTransactions(address) external view returns (string[])",
        
        // Mappings and arrays
        "function transactions(string) public view returns (string orderId, string paymentReference, string amountETB, address buyer, address producer, uint256 timestamp, string txHash, bool isVerified)",
        "function userTransactions(address, uint256) public view returns (string)",
        "function producerTransactions(address, uint256) public view returns (string)",
        "function allTransactionIds(uint256) public view returns (string)",
        
        // Events
        "event TransactionRecorded(string indexed orderId, address indexed buyer, address indexed producer, string paymentReference, string amountETB, uint256 timestamp, string txHash)"
      ];

      this.contract = new ethers.Contract(this.contractAddress, contractABI, this.wallet);

      // Test connection and check if we're the owner
      await this.provider.getBlockNumber();
      
      // Check if our wallet is the contract owner
      const owner = await this.contract.owner();
      const isOwner = (owner.toLowerCase() === this.wallet.address.toLowerCase());
      
      console.log(`✅ Connected to blockchain: ${rpcUrl}`);
      console.log(`📄 Contract: ${this.contractAddress}`);
      console.log(`👛 Wallet: ${this.wallet.address}`);
      console.log(`👑 Contract Owner: ${owner}`);
      console.log(`🔐 We are owner: ${isOwner}`);
      
      if (!isOwner) {
        console.log('⚠️  Warning: Connected wallet is not contract owner - recordTransaction will fail!');
      }
      
      this.isConnected = true;

    } catch (error) {
      console.log('❌ Blockchain connection failed:', error.message);
      console.log('💡 Make sure:');
      console.log('   1. Hardhat node is running: cd blockchain && npx hardhat node');
      console.log('   2. Contract is deployed: cd blockchain && npx hardhat run scripts/deploy.js --network localhost');
      console.log('   3. Private key in .env matches hardhat account');
      this.isConnected = false;
    }
  }

// Add this method to your existing BlockchainService class
async recordOrderTransaction(orderId, paymentData) {
  try {
    // Get order from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          include: { user: true }
        },
        user: true,
        // Add any other relations you need
      }
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found'
      };
    }

    // Generate blockchain order ID if not exists
    const blockchainOrderId = order.blockchainOrderId || `order-${order.id}-${Date.now()}`;

    // Get system-managed wallet addresses
    const buyerAddress = systemWalletService.getSystemBuyerAddress();
    const producerAddress = systemWalletService.getSystemProducerAddress();

    // Prepare transaction data for blockchain
    const transactionData = {
      orderId: blockchainOrderId,
      paymentReference: paymentData.reference || `payref-${order.id}`,
      amountETB: `${order.totalAmount} ETB`,
      buyer: buyerAddress,
      producer: producerAddress,
      txHash: paymentData.txHash || `tx-${order.id}-${Date.now()}`
    };

    console.log('🔗 Recording transaction on blockchain:', transactionData);

    // Call your existing recordTransaction method
    const result = await this.recordTransaction(transactionData);

    if (result.success) {
      // Update order with blockchain info
      await prisma.order.update({
        where: { id: orderId },
        data: {
          blockchainOrderId: blockchainOrderId,
          blockchainRecorded: true,
          blockchainTxHash: result.transactionHash,
          blockchainError: null
        }
      });

      return {
        success: true,
        message: 'Order recorded on blockchain',
        blockchainTxHash: result.transactionHash,
        blockchainOrderId: blockchainOrderId
      };
    } else {
      // Update order with error
      await prisma.order.update({
        where: { id: orderId },
        data: {
          blockchainError: result.error,
          blockchainRecorded: false
        }
      });

      return {
        success: false,
        error: result.error
      };
    }

  } catch (error) {
    console.error('❌ Blockchain recording failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
 }

  loadContractInfo() {
    const possiblePaths = [
      path.join(__dirname, '..', '..', '..', 'contract-info.json'), // Project root
      path.join(__dirname, '..', '..', 'contract-info.json'), // Backend root
      '/app/contract-info.json', // Docker
      path.join(process.cwd(), 'contract-info.json') // Current directory
    ];

    for (const contractPath of possiblePaths) {
      try {
        if (fs.existsSync(contractPath)) {
          const contractInfo = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
          console.log(`📄 Loaded contract from: ${contractPath}`);
          return contractInfo;
        }
      } catch (e) {
        // Continue to next path
      }
    }
    return null;
  }

  async getBlockchainStatus() {
    if (!this.isConnected) {
      return {
        connected: false,
        message: this.contractAddress ? 
          'Contract deployed but blockchain not connected' : 
          'Blockchain not connected',
        contractDeployed: !!this.contractAddress,
        contractAddress: this.contractAddress,
        network: null,
        blockNumber: null
      };
    }

    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const walletBalance = await this.provider.getBalance(this.wallet.address);
      const owner = await this.contract.owner();
      const isOwner = (owner.toLowerCase() === this.wallet.address.toLowerCase());
      
      return {
        connected: true,
        message: `Connected to ${network.name}`,
        network: {
          name: network.name,
          chainId: network.chainId
        },
        blockNumber: blockNumber,
        wallet: {
          address: this.wallet.address,
          balance: ethers.utils.formatEther(walletBalance), // v5 syntax
          isContractOwner: isOwner
        },
        contractDeployed: !!this.contractAddress,
        contractAddress: this.contractAddress,
        contractOwner: owner
      };
    } catch (error) {
      return {
        connected: false,
        message: `Connection error: ${error.message}`,
        contractDeployed: !!this.contractAddress,
        contractAddress: this.contractAddress,
        network: null,
        blockNumber: null
      };
    }
  }

  async recordTransaction(transactionData) {
    const { orderId, paymentReference, amountETB, buyer, producer, txHash } = transactionData;

    // Validate inputs for new contract structure
    if (!orderId || !paymentReference || !amountETB || !buyer || !producer || !txHash) {
      return {
        success: false,
        error: 'Missing required fields: orderId, paymentReference, amountETB, buyer, producer, txHash'
      };
    }

    // Validate Ethereum addresses
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(buyer)) {
      return {
        success: false,
        error: 'Invalid buyer address format'
      };
    }
    if (!ethAddressRegex.test(producer)) {
      return {
        success: false,
        error: 'Invalid producer address format'
      };
    }

    // If not connected, return mock response
    if (!this.isConnected || !this.contract) {
      console.log('🔗 [MOCK] Recording transaction:', { 
        orderId, 
        paymentReference, 
        amountETB, 
        buyer, 
        producer, 
        txHash 
      });
      return {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 1000000).toString(),
        isMock: true,
        message: 'Transaction recorded (mock mode - blockchain not connected)'
      };
    }

    try {
      console.log('🔗 Recording transaction on blockchain:', { 
        orderId, 
        paymentReference, 
        amountETB, 
        buyer, 
        producer, 
        txHash 
      });
      
      // Call the updated smart contract function with new parameters
      const tx = await this.contract.recordTransaction(
        orderId, 
        paymentReference, 
        amountETB, 
        buyer, 
        producer, 
        txHash
      );
      const receipt = await tx.wait();
      
      console.log('✅ Transaction mined:', {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        isMock: false,
        message: 'Transaction recorded on blockchain'
      };
    } catch (error) {
      console.error('❌ Blockchain recording failed:', error);
      
      // Handle specific contract errors
      let errorMessage = error.message;
      if (error.message.includes("Transaction already recorded")) {
        errorMessage = "This order ID has already been recorded on blockchain";
      } else if (error.message.includes("Only owner can call this function")) {
        errorMessage = "Unauthorized: Only contract owner can record transactions";
      } else if (error.message.includes("Invalid buyer address") || error.message.includes("Invalid producer address")) {
        errorMessage = "Invalid Ethereum address provided";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fee";
      }
      
      return {
        success: false,
        error: errorMessage,
        isMock: false
      };
    }
  }

  async verifyTransaction(orderId) {
    if (!this.isConnected || !this.contract) {
      return { 
        exists: false, 
        error: 'Blockchain not connected',
        isMock: true 
      };
    }

    try {
      // Updated to match new return structure (8 values)
      const [
        storedOrderId, 
        paymentReference, 
        amountETB, 
        buyer, 
        producer, 
        timestamp, 
        txHash, 
        isVerified
      ] = await this.contract.getTransaction(orderId);
      
      return {
        exists: true,
        orderId: storedOrderId,
        paymentReference: paymentReference,
        amountETB: amountETB,
        buyer: buyer,
        producer: producer,
        timestamp: new Date(Number(timestamp) * 1000),
        txHash: txHash,
        isVerified: isVerified,
        isMock: false
      };
    } catch (error) {
      return { 
        exists: false, 
        error: 'Transaction not found on blockchain',
        isMock: false 
      };
    }
  }

  async getTransaction(orderId) {
    const verification = await this.verifyTransaction(orderId);
    
    if (verification.exists) {
      return {
        success: true,
        data: {
          orderId: verification.orderId,
          paymentReference: verification.paymentReference,
          amountETB: verification.amountETB,
          buyer: verification.buyer,
          producer: verification.producer,
          timestamp: verification.timestamp,
          txHash: verification.txHash,
          isVerified: verification.isVerified
        }
      };
    } else {
      return {
        success: false,
        error: verification.error
      };
    }
  }

  async getUserTransactions(userAddress) {
    if (!this.isConnected || !this.contract) {
      return { 
        success: false, 
        error: 'Blockchain not connected',
        isMock: true 
      };
    }

    // Validate Ethereum address
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(userAddress)) {
      return {
        success: false,
        error: 'Invalid user address format'
      };
    }

    try {
      const orderIds = await this.contract.getUserTransactions(userAddress);
      return {
        success: true,
        orderIds: orderIds,
        count: orderIds.length,
        isMock: false
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        isMock: false
      };
    }
  }

  async getProducerTransactions(producerAddress) {
    if (!this.isConnected || !this.contract) {
      return { 
        success: false, 
        error: 'Blockchain not connected',
        isMock: true 
      };
    }

    // Validate Ethereum address
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(producerAddress)) {
      return {
        success: false,
        error: 'Invalid producer address format'
      };
    }

    try {
      const orderIds = await this.contract.getProducerTransactions(producerAddress);
      return {
        success: true,
        orderIds: orderIds,
        count: orderIds.length,
        isMock: false
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        isMock: false
      };
    }
  }

  async getTransactionCount() {
    if (!this.isConnected || !this.contract) {
      return { 
        count: 0,
        isMock: true 
      };
    }

    try {
      const count = await this.contract.getTransactionCount();
      return {
        count: count.toNumber(),
        isMock: false
      };
    } catch (error) {
      return {
        count: 0,
        error: error.message,
        isMock: false
      };
    }
  }

  async isContractOwner() {
    if (!this.isConnected || !this.contract) {
      return false;
    }

    try {
      const owner = await this.contract.owner();
      return owner.toLowerCase() === this.wallet.address.toLowerCase();
    } catch (error) {
      console.error('Error checking contract ownership:', error);
      return false;
    }
  }
}

module.exports = new BlockchainService();