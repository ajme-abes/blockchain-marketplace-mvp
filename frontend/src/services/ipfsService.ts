// src/services/ipfsService.ts - CORRECTED ENV VARIABLE
export interface IPFSUploadResult {
  cid: string;
  url: string;
  filename: string;
  size: number;
  ipfsUrl: string;
  gatewayUrl: string;
}

class IPFSService {
  private pinataJWT: string;
  private gatewayUrl: string;

  constructor() {
    // Use the EXACT names from your .env file
    this.pinataJWT = import.meta.env.VITE_PINATA_JWT || '';
    this.gatewayUrl = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
    
    console.log('🔧 IPFS Service initialized', {
      hasJWT: !!this.pinataJWT,
      jwtLength: this.pinataJWT?.length,
      gateway: this.gatewayUrl
    });
  }

  async uploadFile(file: File, category: string = 'USER_AVATAR'): Promise<IPFSUploadResult> {
    try {
      console.log('🔧 FORCING REAL IPFS UPLOAD...', { 
        filename: file.name, 
        type: file.type, 
        size: file.size 
      });

      // Check if Pinata JWT is configured
      if (!this.pinataJWT) {
        console.error('❌ Pinata JWT not found. Check your VITE_PINATA_JWT in .env file');
        throw new Error('Pinata JWT not configured. Please check your VITE_PINATA_JWT environment variable.');
      }

      // Create form data for Pinata
      const formData = new FormData();
      formData.append('file', file);

      const metadata = JSON.stringify({
        name: `avatar-${Date.now()}-${file.name}`,
        keyvalues: {
          category: category,
          timestamp: Date.now().toString(),
          app: 'marketplace-avatar'
        }
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append('pinataOptions', options);

      // Upload to Pinata using fetch
      console.log('🔧 Uploading to Pinata IPFS...');
      const response = await fetch(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${this.pinataJWT}`
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Pinata upload failed:', response.status, errorText);
        throw new Error(`IPFS upload failed: ${response.status} - Check your Pinata JWT`);
      }

      const data = await response.json();
      const { IpfsHash, PinSize, Timestamp } = data;

      const result: IPFSUploadResult = {
        cid: IpfsHash,
        url: `${this.gatewayUrl}${IpfsHash}`, // PERMANENT IPFS URL
        filename: file.name,
        size: PinSize,
        ipfsUrl: `ipfs://${IpfsHash}`,
        gatewayUrl: `${this.gatewayUrl}${IpfsHash}`
      };

      console.log('✅ File uploaded to Pinata IPFS - PERMANENT URL:', result.url);
      return result;

    } catch (error: any) {
      console.error('❌ REAL IPFS upload failed:', error);
      throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
  }

  async uploadImage(file: File): Promise<IPFSUploadResult> {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid image format. Please use JPEG, PNG, WebP, or GIF.');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Image too large. Please use images smaller than 5MB.');
    }

    return this.uploadFile(file, 'USER_AVATAR');
  }

  isDataUrl(url: string): boolean {
    return url.startsWith('data:');
  }

  getFileUrl(cid: string): string {
    return `${this.gatewayUrl}${cid}`;
  }

  isPermanentIpfsUrl(url: string): boolean {
    return url.includes('ipfs') && !this.isDataUrl(url);
  }
}

export const ipfsService = new IPFSService();