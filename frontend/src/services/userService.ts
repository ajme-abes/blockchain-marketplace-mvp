// src/services/userService.ts - UPDATED WITH DEBUGGING
import api from './api';
import { ipfsService } from './ipfsService';

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  address?: string;
  languagePreference?: string;
  region?: string;
  bio?: string;
}

export const userService = {
  async getUserProfile(userId: string) {
    try {
      console.log('🔧 Fetching user profile:', userId);
      const response = await api.request(`/users/${userId}`);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch user profile:', error);
      throw new Error(error.message || 'Failed to fetch user profile');
    }
  },

  async updateProfile(profileData: UpdateProfileData) {
    try {
      console.log('🔧 Updating profile with backend fields:', profileData);
      const response = await api.request('/users/profile', {
        method: 'PUT',
        data: profileData,
      });
      return response;
    } catch (error: any) {
      console.error('❌ Failed to update profile:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  // In userService.ts - update the uploadAvatar method
  async uploadAvatar(file: File) {
    try {
      console.log('🔧 Starting avatar upload process...');

      // This will now use REAL IPFS uploads automatically!
      const ipfsResult = await ipfsService.uploadImage(file);

      console.log('✅ File processed:', ipfsResult.url);

      // Send URL to backend
      const response = await api.request('/users/avatar', {
        method: 'PUT',
        data: { avatarUrl: ipfsResult.url },
      });

      console.log('✅ Avatar URL saved to backend');

      return {
        ...response,
        ipfsResult,
        isTemporary: ipfsService.isDataUrl(ipfsResult.url) // This will now be false for real IPFS uploads
      };
    } catch (error: any) {
      console.error('❌ Failed to upload avatar:', error);
      throw new Error(error.message || 'Failed to upload avatar');
    }
  },

  async uploadVerificationDocument(file: File, type: string) {
    try {
      console.log('🔧 Starting document upload process...', { type, filename: file.name });

      // Upload to IPFS
      const ipfsResult = await ipfsService.uploadFile(file, 'DOCUMENT');
      console.log('✅ Document uploaded to IPFS:', ipfsResult.url);

      // Send metadata to backend
      const response = await api.request('/producers/documents', {
        method: 'POST',
        data: {
          url: ipfsResult.url,
          filename: file.name,
          type: type, // e.g., 'LICENSE', 'ID', etc.
          fileSize: file.size,
          mimeType: file.type
        }
      });

      console.log('✅ Document metadata saved to backend');
      return response;
    } catch (error: any) {
      console.error('❌ Failed to upload verification document:', error);
      throw new Error(error.message || 'Failed to upload verification document');
    }
  },

  async getProducerDocuments() {
    try {
      console.log('🔧 Fetching producer verification documents...');
      const response = await api.request('/producers/documents');
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch verification documents:', error);
      throw new Error(error.message || 'Failed to fetch verification documents');
    }
  },
};