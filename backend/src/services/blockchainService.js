const { prisma } = require('../config/database');
const { ethers } = require('ethers');
const systemWalletService = require('./systemWalletService');

class BlockchainService {
  constructor() {
    this.isConnected = false;
    this.provider = null;
    this.contract = null;
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.wallet = null;
    this.init();
  }

  async init() {
    try {
      // Check if we have required environment variables
      if (!this.contractAddress) {
        console.log('❌ No contract address found in environment');
        this.isConnected = false;
        return;
      }
  
      const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology';
      
      if (!privateKey) {
        console.log('❌ No private key found - using mock mode');
        this.isConnected = false;
        return;
      }
  
      console.log('🔗 Initializing blockchain connection...');
      
      // ✅ FIX: Setup provider FIRST
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      // Test provider connection
      try {
        const network = await this.provider.getNetwork();
        const blockNumber = await this.provider.getBlockNumber();
        console.log(`✅ Provider connected: ${network.name} (Block: ${blockNumber})`);
      } catch (providerError) {
        console.log('❌ Provider connection failed:', providerError.message);
        this.isConnected = false;
        return;
      }
  
      // ✅ FIX: Setup wallet AFTER provider
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      // Contract ABI matching your EXACT deployed contract
      const contractABI = [
        "function recordTransaction(string, string, string, address, address, string) external",
        "function getTransaction(string) external view returns (string, string, string, address, address, uint256, string, bool)",
        "function verifyTransaction(string) external view returns (bool)",
        "function getUserTransactions(address) external view returns (string[])",
        "function getProducerTransactions(address) external view returns (string[])",
        "function getTransactionCount() external view returns (uint256)",
        "function owner() external view returns (address)",
        "function transactions(string) public view returns (string, string, string, address, address, uint256, string, bool)",
        "event TransactionRecorded(string indexed orderId, address indexed buyer, address indexed producer, string paymentReference, string amountETB, uint256 timestamp, string txHash)"
      ];
  
      this.contract = new ethers.Contract(this.contractAddress, contractABI, this.wallet);
  
      // ✅ FIX: Get gas prices safely
      let feeData;
      try {
        feeData = await this.provider.getFeeData();
        console.log('⛽ Current network gas prices:', {
          maxFeePerGas: ethers.utils.formatUnits(feeData.maxFeePerGas, 'gwei'),
          maxPriorityFeePerGas: ethers.utils.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')
        });
      } catch (gasError) {
        console.log('⚠️ Could not get gas prices, using defaults:', gasError.message);
        feeData = {
          maxFeePerGas: ethers.utils.parseUnits('35', 'gwei'),
          maxPriorityFeePerGas: ethers.utils.parseUnits('30', 'gwei')
        };
      }
  
      // Store fee data for later use
      this.feeData = feeData;
  
      console.log(`✅ Connected to Polygon Amoy:`);
      console.log(`   📄 Contract: ${this.contractAddress}`);
      console.log(`   👛 Wallet: ${this.wallet.address}`);
      
      this.isConnected = true;
  
    } catch (error) {
      console.log('❌ Blockchain connection failed:', error.message);
      console.log('💡 Check your RPC URL and private key in .env file');
      this.isConnected = false;
    }
  }

  async recordTransaction(transactionData) {
    const { orderId, paymentReference, amountETB, buyer, producer } = transactionData;
  
    // If not connected, return mock response
    if (!this.isConnected || !this.contract) {
      console.log('🔗 [MOCK] Recording transaction on blockchain');
      return {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        isMock: true,
        message: 'Transaction recorded (mock mode)'
      };
    }
  
    try {
      console.log('🔗 Recording transaction on Polygon Amoy...');
      
      // ✅ FIXED: Use high gas prices to ensure transaction success
      let txOptions = {};
      
      // Get current network gas prices
      let feeData;
      try {
        feeData = await this.provider.getFeeData();
        console.log('⛽ Current network gas prices:', {
          maxFeePerGas: ethers.utils.formatUnits(feeData.maxFeePerGas, 'gwei'),
          maxPriorityFeePerGas: ethers.utils.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')
        });
      } catch (gasError) {
        console.log('⚠️ Could not get gas prices, using defaults:', gasError.message);
        feeData = null;
      }
  
      // Use much higher gas prices to ensure success
      if (feeData && feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        // Use network prices but add significant buffer
        txOptions = {
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas.add(ethers.utils.parseUnits('25', 'gwei')), // +25 Gwei buffer
          maxFeePerGas: feeData.maxFeePerGas.add(ethers.utils.parseUnits('35', 'gwei')), // +35 Gwei buffer
          gasLimit: 3000000
        };
      } else {
        // High fixed prices as fallback (should definitely work)
        txOptions = {
          maxPriorityFeePerGas: ethers.utils.parseUnits('30', 'gwei'),  // 30 Gwei tip
          maxFeePerGas: ethers.utils.parseUnits('50', 'gwei'),          // 50 Gwei max fee
          gasLimit: 3000000
        };
      }
  
      console.log('⛽ Using gas options:', {
        maxPriorityFeePerGas: ethers.utils.formatUnits(txOptions.maxPriorityFeePerGas, 'gwei') + ' gwei',
        maxFeePerGas: ethers.utils.formatUnits(txOptions.maxFeePerGas, 'gwei') + ' gwei',
        gasLimit: txOptions.gasLimit
      });
  
      // Generate unique transaction hash
      const uniqueTxHash = `0x${Buffer.from(`${orderId}-${Date.now()}`).toString('hex').substring(0, 64)}`;
      
      console.log('📝 Calling smart contract with parameters:', {
        orderId,
        paymentReference,
        amountETB: `${amountETB} ETB`,
        buyer,
        producer,
        uniqueTxHash
      });
  
      // Call the smart contract with proper gas options
      const tx = await this.contract.recordTransaction(
        orderId,
        paymentReference,  
        `${amountETB} ETB`,
        buyer,
        producer,
        uniqueTxHash,               // ✅ Last parameter matching ABI
        {                          // ✅ Transaction options as separate object
          maxPriorityFeePerGas: txOptions.maxPriorityFeePerGas,
          maxFeePerGas: txOptions.maxFeePerGas,
          gasLimit: txOptions.gasLimit
        }
      );
      
      console.log('📝 Transaction sent:', tx.hash);
      
      // Wait for confirmation
      console.log('⏳ Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      
      console.log('✅ Transaction confirmed on Polygon Amoy!');
      console.log('📊 Transaction details:', {
        blockNumber: receipt.blockNumber,
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'Success' : 'Failed'
      });
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        contractTxHash: uniqueTxHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        isMock: false,
        message: 'Recorded on Polygon Amoy'
      };
      
    } catch (error) {
      console.error('❌ Blockchain recording failed:', error);
      
      // Log specific gas-related errors
      if (error.message && error.message.includes('gas price below minimum')) {
        console.error('💡 GAS PRICE ISSUE: Transaction failed due to insufficient gas price');
        console.error('💡 Solution: Increase maxPriorityFeePerGas and maxFeePerGas values');
      }
      
      if (error.message && error.message.includes('insufficient funds')) {
        console.error('💡 BALANCE ISSUE: Wallet has insufficient MATIC for gas');
        console.error('💡 Solution: Add MATIC to wallet:', this.wallet.address);
      }
      
      if (error.message && error.message.includes('nonce')) {
        console.error('💡 NONCE ISSUE: Transaction nonce conflict');
        console.error('💡 Solution: Wait for previous transactions to confirm');
      }
      
      return {
        success: false,
        error: error.message,
        isMock: false,
        transactionHash: error.transactionHash // Include failed transaction hash if available
      };
    }
  }
  async recordOrderTransaction(orderId, paymentData) {
    try {
      // Get order from database
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          buyer: {
            include: { 
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          orderItems: {
            include: {
              product: {
                include: {
                  producer: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // ✅ USE YOUR SYSTEM WALLET SERVICE - NO CONFLICTS!
      const buyerAddress = systemWalletService.getUserWalletAddress(order.buyer.user.id, 'BUYER');
      
      // Get producer address from the first product (or use system default)
      const producerAddress = order.orderItems.length > 0 
        ? systemWalletService.getUserWalletAddress(order.orderItems[0].product.producer.user.id, 'PRODUCER')
        : systemWalletService.getSystemProducerAddress();

      console.log('👥 Wallet addresses:', {
        buyer: buyerAddress,
        producer: producerAddress,
        buyerUserId: order.buyer.user.id,
        producerUserId: order.orderItems[0]?.product.producer.user.id
      });

      // Prepare transaction data matching your contract
      const transactionData = {
        orderId: orderId,
        paymentReference: paymentData.paymentReference || `payref-${orderId}`,
        amountETB: order.totalAmount.toString(),
        buyer: buyerAddress,
        producer: producerAddress
      };

      console.log('🔗 Recording order transaction:', transactionData);

      // Call recordTransaction
      const result = await this.recordTransaction(transactionData);

      if (result.success) {
        // Update order with blockchain info
        await prisma.order.update({
          where: { id: orderId },
          data: {
            blockchainTxHash: result.transactionHash,
            blockchainRecorded: true,
            blockchainError: null
          }
        });

        return {
          success: true,
          message: 'Order recorded on blockchain',
          blockchainTxHash: result.transactionHash,
          contractTxHash: result.contractTxHash
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
      console.error('❌ Order blockchain recording failed:', error);
      return {
        success: false,
        error: error.message
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
      const transaction = await this.contract.getTransaction(orderId);
      return {
        exists: true,
        orderId: transaction[0],
        paymentReference: transaction[1],
        amountETB: transaction[2],
        buyer: transaction[3],
        producer: transaction[4],
        timestamp: new Date(Number(transaction[5]) * 1000),
        txHash: transaction[6],
        isVerified: transaction[7],
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

  async getBlockchainStatus() {
    if (!this.isConnected) {
      return {
        connected: false,
        message: 'Blockchain not connected to Polygon Amoy',
        contractAddress: this.contractAddress
      };
    }

    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const walletBalance = await this.provider.getBalance(this.wallet.address);
      
      return {
        connected: true,
        message: `Connected to Polygon Amoy`,
        network: {
          name: network.name,
          chainId: network.chainId
        },
        blockNumber: blockNumber,
        wallet: {
          address: this.wallet.address,
          balance: ethers.utils.formatEther(walletBalance),
          isContractOwner: await this.isContractOwner()
        },
        contractAddress: this.contractAddress
      };
    } catch (error) {
      return {
        connected: false,
        message: `Connection error: ${error.message}`,
        contractAddress: this.contractAddress
      };
    }
  }
  async verifyContractOwnership() {
    if (!this.isConnected) {
      console.log('❌ Blockchain not connected - cannot verify ownership');
      return false;
    }
  
    try {
      const owner = await this.contract.owner();
      const isOwner = owner.toLowerCase() === this.wallet.address.toLowerCase();
      
      console.log('🔑 Contract Ownership Check:');
      console.log(`   Contract Owner: ${owner}`);
      console.log(`   Our Wallet: ${this.wallet.address}`);
      console.log(`   Is Owner: ${isOwner}`);
      
      if (!isOwner) {
        console.log('❌ CRITICAL: Our wallet is NOT the contract owner!');
        console.log('💡 Solution: Deploy contract with wallet: ' + this.wallet.address);
      }
      
      return isOwner;
    } catch (error) {
      console.error('❌ Ownership verification failed:', error);
      return false;
    }
  }

  async isContractOwner() {
    if (!this.isConnected || !this.contract) return false;
    try {
      const owner = await this.contract.owner();
      return owner.toLowerCase() === this.wallet.address.toLowerCase();
    } catch (error) {
      return false;
    }
  }
}

module.exports = new BlockchainService();