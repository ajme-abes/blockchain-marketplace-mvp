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

      const contractABI = [
        "function recordTransaction(string, string, string, string, string, string) external",
        "function getTransaction(string) external view returns (string, string, string, string, string, uint256, string, bool)",
        "function verifyTransaction(string) external view returns (bool)",
        "function getUserTransactions(string) external view returns (string[])",
        "function getProducerTransactions(string) external view returns (string[])",
        "function getTransactionCount() external view returns (uint256)",
        "function owner() external view returns (address)",
        "function transactions(string) public view returns (string, string, string, string, string, uint256, string, bool)",
        "event TransactionRecorded(string indexed orderId, string indexed buyerId, string indexed producerId, string paymentReference, string amountETB, uint256 timestamp, string txHash)"
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

      // ✅ UPDATED: Log user identifiers instead of addresses
      console.log('👥 Using user identifiers:', {
        buyer,
        producer,
        orderId,
        paymentReference
      });

      // ✅ UPDATED: Use high gas prices to ensure transaction success
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
        buyer,          // ✅ Now shows user identifier string
        producer,       // ✅ Now shows user identifier string
        uniqueTxHash
      });

      // ✅ UPDATED: Call contract with string parameters (no address validation)
      const tx = await this.contract.recordTransaction(
        orderId,
        paymentReference,
        `${amountETB} ETB`,
        buyer,           // ✅ Now passes string identifier
        producer,        // ✅ Now passes string identifier
        uniqueTxHash,
        {
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
  /**
   * Helper method for exponential backoff delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Record order transaction with retry logic
   */
  async recordOrderTransactionWithRetry(orderId, paymentData, maxRetries = 3) {
    console.log(`🔄 Starting blockchain recording with retry (max ${maxRetries} attempts)`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📝 Attempt ${attempt}/${maxRetries} for order: ${orderId}`);

        const result = await this.recordOrderTransaction(orderId, paymentData);

        if (result.success) {
          console.log(`✅ Blockchain recording succeeded on attempt ${attempt}`);
          return result;
        }

        // If not successful and not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delayMs = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
          console.log(`⏳ Waiting ${delayMs}ms before retry...`);
          await this.delay(delayMs);
        }

      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          console.error(`❌ All ${maxRetries} attempts failed for order: ${orderId}`);
          throw error;
        }

        // Wait before retrying
        const delayMs = attempt * 2000;
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await this.delay(delayMs);
      }
    }

    // Should never reach here, but just in case
    return {
      success: false,
      error: 'All retry attempts exhausted'
    };
  }

  async recordOrderTransaction(orderId, paymentData) {
    try {
      console.log('🔗 Starting blockchain recording for order:', orderId);

      // ✅ UPDATED: Check if order already exists on blockchain
      const existingTx = await this.verifyTransaction(orderId);
      if (existingTx.exists) {
        console.log('✅ Order already recorded on blockchain:', orderId);
        console.log('📊 Existing transaction details:', {
          transactionHash: existingTx.txHash,
          recordedAt: existingTx.timestamp,
          paymentReference: existingTx.paymentReference,
          amount: existingTx.amountETB,
          buyerId: existingTx.buyerId,        // ✅ UPDATED field name
          producerId: existingTx.producerId,  // ✅ UPDATED field name
          verified: existingTx.isVerified
        });

        // Update database to reflect it's already recorded
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: orderId },
            data: {
              blockchainTxHash: existingTx.txHash,
              blockchainRecorded: true,
              blockchainError: null,
              updatedAt: new Date()
            }
          });

          // ✅ NEW: Create BlockchainRecord if it doesn't exist
          const existingRecord = await tx.blockchainRecord.findUnique({
            where: { txHash: existingTx.txHash }
          });

          if (!existingRecord) {
            await tx.blockchainRecord.create({
              data: {
                orderId: orderId,
                txHash: existingTx.txHash,
                blockNumber: existingTx.blockNumber?.toString() || null,
                timestamp: existingTx.timestamp || new Date(),
                status: existingTx.isMock ? 'mock' : 'confirmed'
              }
            });
            console.log('✅ Created missing BlockchainRecord entry');
          }
        });

        console.log('✅ Updated database with existing blockchain record');

        return {
          success: true,
          message: 'Order already recorded on blockchain',
          blockchainTxHash: existingTx.txHash,
          contractTxHash: existingTx.txHash,
          blockNumber: existingTx.blockNumber,
          alreadyRecorded: true,
          isMock: existingTx.isMock || false
        };
      }

      // ✅ PROCEED WITH NEW ORDER RECORDING
      console.log('🆕 Order not found on blockchain, proceeding with new recording...');

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
        console.error('❌ Order not found in database:', orderId);
        return { success: false, error: 'Order not found' };
      }

      // ✅ FIXED: VALIDATE USER IDS AND HANDLE MULTI-PRODUCER ORDERS
      const buyerUserId = order.buyer.user.id;

      if (!buyerUserId) {
        console.error('❌ Buyer user ID is missing');
        return { success: false, error: 'Buyer user ID is required' };
      }

      // ✅ NEW: Validate buyer exists in database
      const buyerUser = await prisma.user.findUnique({
        where: { id: buyerUserId },
        select: { id: true, name: true, email: true }
      });

      if (!buyerUser) {
        console.error('❌ Buyer user not found in database:', buyerUserId);
        return {
          success: false,
          error: `Buyer user not found: ${buyerUserId}`
        };
      }

      console.log('✅ Buyer validation passed:', buyerUser.name);

      // ✅ NEW: Extract all unique producers from order items
      const producerMap = new Map();
      for (const item of order.orderItems) {
        const producerId = item.product.producer.id;
        const producerUserId = item.product.producer.user.id;

        if (!producerMap.has(producerId)) {
          producerMap.set(producerId, {
            producerId: producerId,
            producerUserId: producerUserId,
            producerName: item.product.producer.user.name,
            productIds: [],
            subtotal: 0
          });
        }

        const producerData = producerMap.get(producerId);
        producerData.productIds.push(item.productId);
        producerData.subtotal += item.subtotal;
      }

      const producers = Array.from(producerMap.values());

      console.log(`📦 Order has ${producers.length} producer(s):`,
        producers.map(p => ({ name: p.producerName, products: p.productIds.length, subtotal: p.subtotal }))
      );

      if (producers.length === 0) {
        console.error('❌ No producers found in order');
        return { success: false, error: 'No producers found in order' };
      }

      // ✅ FIXED: Validate all producers exist in database
      const producerValidations = await Promise.all(
        producers.map(async (p) => {
          const user = await prisma.user.findUnique({
            where: { id: p.producerUserId },
            select: { id: true, name: true, email: true }
          });
          return { producerData: p, user };
        })
      );

      // Check for invalid producers
      const invalidProducers = producerValidations.filter(v => !v.user);
      if (invalidProducers.length > 0) {
        const invalidIds = invalidProducers.map(v => v.producerData.producerUserId);
        console.error('❌ Some producers not found in database:', invalidIds);
        return {
          success: false,
          error: `Producer users not found: ${invalidIds.join(', ')}`
        };
      }

      console.log('✅ All producer validations passed:', {
        buyer: buyerUser.name,
        producers: producerValidations.map(v => v.user.name)
      });

      // ✅ Store OrderProducer records for multi-producer tracking
      await prisma.$transaction(
        producers.map(p =>
          prisma.orderProducer.upsert({
            where: {
              orderId_producerId: {
                orderId: orderId,
                producerId: p.producerId
              }
            },
            create: {
              orderId: orderId,
              producerId: p.producerId,
              productIds: p.productIds,
              subtotal: p.subtotal
            },
            update: {
              productIds: p.productIds,
              subtotal: p.subtotal
            }
          })
        )
      );

      console.log('✅ Stored OrderProducer records for all producers');

      // ✅ UPDATED: USE USER IDENTIFIERS (NOW ASYNC AND STORED IN DB)
      const buyerIdentifier = await systemWalletService.getBuyerIdentifier(buyerUserId);

      // ✅ OPTION A: Record ALL producers on blockchain (comma-separated)
      const allProducerIds = await Promise.all(
        producers.map(p => systemWalletService.getProducerIdentifier(p.producerUserId))
      );
      const producerIdentifier = allProducerIds.join(','); // Store as comma-separated

      console.log('👥 User identifiers for blockchain recording:', {
        buyer: buyerIdentifier,
        producer: producerIdentifier,
        allProducers: allProducerIds,
        buyerUserId: buyerUserId,
        totalProducers: producers.length,
        note: producers.length > 1
          ? `Multi-producer order (${producers.length} producers) - ALL recorded on blockchain`
          : 'Single producer order'
      });

      // Prepare transaction data matching your NEW contract
      const transactionData = {
        orderId: orderId,
        paymentReference: paymentData.paymentReference || `payref-${orderId}`,
        amountETB: order.totalAmount.toString(),
        buyer: buyerIdentifier,        // ✅ Now uses user identifier string
        producer: producerIdentifier   // ✅ Now uses user identifier string
      };

      console.log('🔗 Recording new order transaction:', transactionData);

      // Call recordTransaction for NEW order
      const result = await this.recordTransaction(transactionData);

      if (result.success) {
        console.log('✅ Successfully recorded new order on blockchain');

        // ✅ FIXED: Use transaction to update both Order and create BlockchainRecord
        await prisma.$transaction(async (tx) => {
          // Update order with blockchain info
          await tx.order.update({
            where: { id: orderId },
            data: {
              blockchainTxHash: result.transactionHash,
              blockchainRecorded: true,
              blockchainError: null,
              updatedAt: new Date()
            }
          });

          // ✅ FIXED: Create BlockchainRecord entry for audit trail
          // Check if record already exists to prevent duplicates
          const existingRecord = await tx.blockchainRecord.findUnique({
            where: { txHash: result.transactionHash }
          });

          if (!existingRecord) {
            await tx.blockchainRecord.create({
              data: {
                orderId: orderId,
                txHash: result.transactionHash,
                blockNumber: result.blockNumber?.toString() || null,
                timestamp: new Date(),
                status: result.isMock ? 'mock' : 'confirmed'
              }
            });
            console.log('✅ Created BlockchainRecord entry for audit trail');
          } else {
            console.log('ℹ️ BlockchainRecord already exists, skipping creation');
          }
        });

        console.log('✅ Updated database with new blockchain record');

        return {
          success: true,
          message: 'Order recorded on blockchain',
          blockchainTxHash: result.transactionHash,
          contractTxHash: result.contractTxHash,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed,
          isMock: result.isMock || false
        };
      } else {
        console.error('❌ Failed to record new order on blockchain:', result.error);

        // Update order with error
        await prisma.order.update({
          where: { id: orderId },
          data: {
            blockchainError: result.error,
            blockchainRecorded: false,
            updatedAt: new Date()
          }
        });

        return {
          success: false,
          error: result.error,
          transactionHash: result.transactionHash // Include failed transaction hash if available
        };
      }

    } catch (error) {
      console.error('❌ Order blockchain recording failed:', error);

      // Update order with general error
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            blockchainError: error.message,
            blockchainRecorded: false,
            updatedAt: new Date()
          }
        });
      } catch (dbError) {
        console.error('❌ Failed to update database with error:', dbError);
      }

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

      // ✅ Parse producer field - can be single or comma-separated multiple producers
      const producerField = transaction[4];
      const producerIds = producerField.includes(',')
        ? producerField.split(',').map(id => id.trim())
        : [producerField];

      return {
        exists: true,
        orderId: transaction[0],
        paymentReference: transaction[1],
        amountETB: transaction[2],
        buyerId: transaction[3],
        producerId: producerField, // Original field (may contain multiple)
        producerIds: producerIds,   // ✅ NEW: Array of producer IDs
        isMultiProducer: producerIds.length > 1, // ✅ NEW: Flag for multi-producer
        producerCount: producerIds.length, // ✅ NEW: Count of producers
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

  async checkContractState(orderId) {
    try {
      if (!this.isConnected) return { connected: false };
      // Check if order exists
      const exists = await this.verifyTransaction(orderId);
      // Get contract owner
      const owner = await this.contract.owner();
      // Get transaction count
      const txCount = await this.contract.getTransactionCount();

      return {
        connected: true,
        orderExists: exists.exists,
        contractOwner: owner,
        isCallerOwner: owner.toLowerCase() === this.wallet.address.toLowerCase(),
        totalTransactions: txCount.toString(),
        message: exists.exists ? 'Order already recorded' : 'Order not found'
      };

    } catch (error) {
      return { connected: false, error: error.message };
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