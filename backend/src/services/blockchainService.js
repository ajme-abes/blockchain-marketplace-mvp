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

      // Setup provider and wallet for Polygon Amoy
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
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

      // Test connection
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      console.log(`✅ Connected to Polygon Amoy:`);
      console.log(`   📄 Contract: ${this.contractAddress}`);
      console.log(`   👛 Wallet: ${this.wallet.address}`);
      console.log(`   🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
      console.log(`   📦 Block: ${blockNumber}`);
      
      // Verify we're the contract owner
      const owner = await this.contract.owner();
      const isOwner = owner.toLowerCase() === this.wallet.address.toLowerCase();
      console.log(`   👑 Contract Owner: ${isOwner ? 'YES ✅' : 'NO ❌'}`);
      
      this.isConnected = true;

    } catch (error) {
      console.log('❌ Blockchain connection failed:', error.message);
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
      
      // Generate unique transaction hash for the contract
      const uniqueTxHash = `0x${Buffer.from(`${orderId}-${Date.now()}`).toString('hex').substring(0, 64)}`;
      
      // Call the smart contract - EXACT parameters matching your contract
      const tx = await this.contract.recordTransaction(
        orderId,                    // string _orderId
        paymentReference,           // string _paymentReference  
        `${amountETB} ETB`,         // string _amountETB
        buyer,                      // address _buyer
        producer,                   // address _producer
        uniqueTxHash                // string _txHash
      );
      
      console.log('📝 Transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed on Polygon Amoy!');
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        contractTxHash: uniqueTxHash,
        blockNumber: receipt.blockNumber,
        isMock: false,
        message: 'Recorded on Polygon Amoy'
      };
      
    } catch (error) {
      console.error('❌ Blockchain recording failed:', error);
      return {
        success: false,
        error: error.message,
        isMock: false
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