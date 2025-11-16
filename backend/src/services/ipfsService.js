// backend/src/services/ipfsService.js - FINAL FIXED VERSION
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

  

  async uploadFile(buffer, filename, category, userId, productId = null) {
    try {
      console.log('🌐 Uploading to Pinata IPFS...');
      
      const uploadResult = await this.uploadToPinata(buffer, filename);
      
      if (!uploadResult.success) {
        return uploadResult;
      }
  
      const { cid, pinataUrl } = uploadResult;
  
      console.log(`✅ Successfully pinned to IPFS: ${cid}`);
  
      // ✅ FIXED: Remove updatedAt field
      const validCategory = category || 'PRODUCT_IMAGE';
      
      const updateData = {
        name: filename,
        mimeType: this.getMimeType(filename),
        size: buffer.length,
        category: validCategory,
        // ❌ REMOVED: updatedAt: new Date() - This field doesn't exist in your schema
      };
  
      const createData = {
        cid,
        name: filename,
        mimeType: this.getMimeType(filename),
        size: buffer.length,
        category: validCategory,
      };
  
      // ✅ FIXED: Use relation connection
      if (userId) {
        updateData.user = { connect: { id: userId } };
        createData.user = { connect: { id: userId } };
      }
  
      if (productId) {
        updateData.product = { connect: { id: productId } };
        createData.product = { connect: { id: productId } };
      }
  
      const ipfsRecord = await prisma.iPFSMetadata.upsert({
        where: { cid },
        update: updateData,
        create: createData
      });
  
      console.log(`✅ IPFS record created/updated:`, ipfsRecord.id);
  
      return {
        success: true,
        cid,
        pinataUrl,
        ipfsRecord
      };
  
    } catch (error) {
      console.error('❌ IPFS upload error:', error);
      
      if (error.code === 'P2002') {
        console.log('⚠️ CID already exists, finding existing record...');
        
        const existingRecord = await prisma.iPFSMetadata.findUnique({
          where: { cid: error.meta?.target?.[0] }
        });
        
        if (existingRecord) {
          return {
            success: true,
            cid: existingRecord.cid,
            pinataUrl: `https://gateway.pinata.cloud/ipfs/${existingRecord.cid}`,
            ipfsRecord: existingRecord,
            note: 'Using existing IPFS record'
          };
        }
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ FIXED: uploadToPinata only handles Pinata API, not database
  async uploadToPinata(buffer, filename) {
    try {
      if (!this.pinataJWT) {
        return {
          success: false,
          error: 'Pinata JWT not configured'
        };
      }

      const formData = new FormData();
      formData.append('file', buffer, filename);

      const metadata = JSON.stringify({
        name: filename,
        keyvalues: {
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
          timeout: 30000
        }
      );

      const { IpfsHash: cid, PinSize: size, Timestamp: pinTimestamp } = response.data;

      console.log(`✅ Pinata upload successful: ${cid}`);

      return {
        success: true,
        cid,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
        size,
        pinTimestamp
      };

    } catch (error) {
      console.error('❌ Pinata upload error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Remove the duplicate createMockUpload method since we don't need it
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

  getStatus() {
    return {
      configured: this.isConfigured,
      gateway: this.ipfsGateway,
      service: this.isConfigured ? 'Pinata' : 'Not Configured'
    };
  }
}

module.exports = new IPFSService(); 