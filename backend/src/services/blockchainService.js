const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

class BlockchainService {
  constructor() {
    this.isConnected = false;
    this.provider = null;
    this.contract = null;
    this.contractAddress = null;
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
      
      // Contract ABI (ethers v5 syntax)
      const contractABI = [
        "function recordTransaction(string orderId, string paymentReference, string txHash) external",
        "function getTransaction(string orderId) external view returns (string orderId, string paymentReference, uint256 timestamp, string txHash)",
        "function verifyTransaction(string orderId) external view returns (bool)",
        "function getTransactionCount() external view returns (uint256)",
        "function transactions(string) public view returns (string orderId, string paymentReference, uint256 timestamp, string txHash)"
      ];

      this.contract = new ethers.Contract(this.contractAddress, contractABI, this.wallet);

      // Test connection
      await this.provider.getBlockNumber();
      this.isConnected = true;
      
      console.log(`✅ Connected to blockchain: ${rpcUrl}`);
      console.log(`📄 Contract: ${this.contractAddress}`);
      console.log(`👛 Wallet: ${this.wallet.address}`);

    } catch (error) {
      console.log('❌ Blockchain connection failed:', error.message);
      console.log('💡 Make sure:');
      console.log('   1. Hardhat node is running: cd blockchain && npx hardhat node');
      console.log('   2. Contract is deployed: cd blockchain && npx hardhat run scripts/deploy.js --network localhost');
      console.log('   3. Private key in .env matches hardhat account');
      this.isConnected = false;
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
          balance: ethers.utils.formatEther(walletBalance) // v5 syntax
        },
        contractDeployed: !!this.contractAddress,
        contractAddress: this.contractAddress
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
    const { orderId, paymentReference, txHash } = transactionData;

    // Validate inputs
    if (!orderId || !paymentReference || !txHash) {
      return {
        success: false,
        error: 'Missing required fields: orderId, paymentReference, txHash'
      };
    }

    // If not connected, return mock response
    if (!this.isConnected || !this.contract) {
      console.log('🔗 [MOCK] Recording transaction:', { orderId, paymentReference, txHash });
      return {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 1000000).toString(),
        isMock: true,
        message: 'Transaction recorded (mock mode - blockchain not connected)'
      };
    }

    try {
      console.log('🔗 Recording transaction on blockchain:', { orderId, paymentReference, txHash });
      
      // Call the actual smart contract (ethers v5 syntax)
      const tx = await this.contract.recordTransaction(orderId, paymentReference, txHash);
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
      return {
        success: false,
        error: error.message,
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
      const [storedOrderId, paymentReference, timestamp, txHash] = await this.contract.getTransaction(orderId);
      
      return {
        exists: true,
        orderId: storedOrderId,
        paymentReference: paymentReference,
        timestamp: new Date(Number(timestamp) * 1000),
        txHash: txHash,
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
        data: verification
      };
    } else {
      return {
        success: false,
        error: verification.error
      };
    }
  }
}

module.exports = new BlockchainService();