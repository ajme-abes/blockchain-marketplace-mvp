// backend/src/services/ipfsService.js - Enhanced version
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { prisma } = require('../config/database');

class IPFSService {
  constructor() {
    this.pinataJWT = process.env.PINATA_JWT;
    this.ipfsGateway = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    this.isConfigured = !!this.pinataJWT;
  }

  async uploadFile(fileBuffer, fileName, category, userId = null, productId = null) {
    try {
      // Use real Pinata if configured, otherwise use enhanced mock
      if (this.isConfigured) {
        return await this.uploadToPinata(fileBuffer, fileName, category, userId, productId);
      } else {
        return await this.createMockUpload(fileBuffer, fileName, category, userId, productId);
      }

    } catch (error) {
      console.error('IPFS upload error:', error);
      return {
        success: false,
        error: error.message,
        isMock: !this.isConfigured
      };
    }
  }

  async uploadToPinata(fileBuffer, fileName, category, userId, productId) {
    console.log('🌐 Uploading to Pinata IPFS...');
    
    const formData = new FormData();
    formData.append('file', fileBuffer, fileName);

    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        category: category,
        uploadedBy: userId || 'system',
        productId: productId || 'none',
        timestamp: new Date().toISOString(),
        app: 'blockchain-marketplace'
      }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${this.pinataJWT}`,
          ...formData.getHeaders(),
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    const { IpfsHash: cid, PinSize: size, Timestamp: pinTimestamp } = response.data;

    console.log(`✅ Successfully pinned to IPFS: ${cid}`);

    // Save to database
    const ipfsRecord = await prisma.iPFSMetadata.create({
      data: {
        cid,
        name: fileName,
        mimeType: this.getMimeType(fileName),
        size,
        category,
        userId,
        productId
      }
    });

    return {
      success: true,
      cid,
      ipfsRecord,
      isMock: false,
      message: 'File uploaded to IPFS via Pinata',
      gatewayUrl: `${this.ipfsGateway}${cid}`,
      pinTimestamp
    };
  }

  async createMockUpload(fileBuffer, fileName, category, userId, productId) {
    console.log('⚠️ IPFS: Using enhanced mock mode - set PINATA_JWT for real IPFS uploads');
    
    // Generate realistic mock CID (v0 format)
    const generateMockCid = () => {
      const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      let cid = 'Qm';
      for (let i = 0; i < 42; i++) {
        cid += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return cid;
    };

    const mockCid = generateMockCid();
    
    const ipfsRecord = await prisma.iPFSMetadata.create({
      data: {
        cid: mockCid,
        name: fileName,
        mimeType: this.getMimeType(fileName),
        size: fileBuffer.length,
        category,
        userId,
        productId
      }
    });

    return {
      success: true,
      cid: mockCid,
      ipfsRecord,
      isMock: true,
      message: 'File uploaded to IPFS (mock mode) - Set PINATA_JWT for real IPFS',
      gatewayUrl: `https://ipfs.io/ipfs/${mockCid}`,
      note: 'This is a mock CID for development'
    };
  }

  // Your existing getFile, getIPFSMetadata, and getMimeType methods remain the same
  async getFile(cid) {
    try {
      const url = `${this.ipfsGateway}${cid}`;
      console.log(`🌐 Fetching from IPFS: ${url}`);
      
      const response = await axios.get(url, { 
        responseType: 'arraybuffer',
        timeout: 15000 
      });
      
      return {
        success: true,
        data: response.data,
        contentType: response.headers['content-type'],
        size: response.headers['content-length']
      };
    } catch (error) {
      console.error('IPFS get file error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getIPFSMetadata(cid) {
    try {
      const metadata = await prisma.iPFSMetadata.findUnique({
        where: { cid },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          product: {
            select: { id: true, name: true }
          }
        }
      });

      if (!metadata) {
        return {
          success: false,
          error: 'IPFS metadata not found'
        };
      }

      return {
        success: true,
        metadata: {
          ...metadata,
          gatewayUrl: `${this.ipfsGateway}${cid}`,
          viewUrl: `https://ipfs.io/ipfs/${cid}`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Check if IPFS is properly configured
  getStatus() {
    return {
      configured: this.isConfigured,
      gateway: this.ipfsGateway,
      service: this.isConfigured ? 'Pinata' : 'Mock Mode'
    };
  }
}

module.exports = new IPFSService();