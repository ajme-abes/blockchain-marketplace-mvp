const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { prisma } = require('../config/database');

class IPFSService {
  constructor() {
    // Using Pinata for IPFS pinning (free tier available)
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecret = process.env.PINATA_SECRET_KEY;
    this.pinataJWT = process.env.PINATA_JWT;
  }

  async uploadFile(fileBuffer, fileName, category, userId = null, productId = null) {
    try {
      // For development without Pinata, return mock CID
      if (!this.pinataJWT) {
        console.log('⚠️  IPFS: Using mock mode - set PINATA_JWT for real uploads');
        const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        
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
          message: 'File uploaded to IPFS (mock mode)'
        };
      }

      // Real Pinata upload
      const formData = new FormData();
      formData.append('file', fileBuffer, fileName);

      const metadata = JSON.stringify({
        name: fileName,
        keyvalues: {
          category: category,
          uploadedBy: userId || 'system',
          timestamp: new Date().toISOString()
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
            ...formData.getHeaders()
          }
        }
      );

      const { IpfsHash: cid, PinSize: size } = response.data;

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
        message: 'File uploaded to IPFS successfully'
      };

    } catch (error) {
      console.error('IPFS upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getFile(cid) {
    try {
      const gateway = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud';
      const url = `${gateway}/ipfs/${cid}`;
      
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      
      return {
        success: true,
        data: response.data,
        contentType: response.headers['content-type']
      };
    } catch (error) {
      console.error('IPFS get file error:', error);
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

      return {
        success: true,
        metadata
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
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

module.exports = new IPFSService();