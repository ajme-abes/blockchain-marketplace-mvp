// src/services/disputeService.ts - FIXED VERSION
import apiService from './api';

export interface Dispute {
  id: string;
  orderId: string;
  reason: string;
  description: string;
  status: string;
  resolution?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
  raisedBy: {
    id: string;
    name: string;
    email: string;
  };
  resolvedBy?: {
    id: string;
    name: string;
    email: string;
  };
  order?: {
    id: string;
    totalAmount: number;
    buyer: any;
    orderItems: any[];
  };
  evidenceCount: number;
  messageCount: number;
  latestMessage?: {
    content: string;
    createdAt: string;
    senderName: string;
  };
}

export interface DisputeEvidence {
  id: string;
  type: string;
  url: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
  };
}

export interface DisputeMessage {
  id: string;
  content: string;
  type: string;
  isInternal: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface CreateDisputeData {
  orderId: string;
  reason: string;
  description: string;
  desiredResolution?: string;
}

export interface CreateDisputeResponse {
  status: string;
  message: string;
  data?: Dispute;
  error?: string;
}

export interface DisputesResponse {
  status: string;
  data?: {
    disputes: Dispute[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    };
  };
  error?: string;
}

class DisputeService {
  async createDispute(
    disputeData: CreateDisputeData
  ): Promise<CreateDisputeResponse> {
    try {
      console.log('🔄 [FRONTEND] Starting dispute creation with data:', disputeData);

      const disputeResponse = await apiService.request('/disputes', {
        method: 'POST',
        data: disputeData,
      });

      console.log('✅ [FRONTEND] Backend response:', disputeResponse);

      const dispute = disputeResponse.data || disputeResponse;
      
      if (!dispute || !dispute.id) {
        throw new Error('Failed to create dispute - no dispute ID returned');
      }

      console.log('🎉 [FRONTEND] Dispute created with ID:', dispute.id);

      return {
        status: 'success',
        message: 'Dispute created successfully',
        data: dispute
      };

    } catch (error: any) {
      console.error('❌ [FRONTEND] Create dispute error:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to create dispute'
      };
    }
  }

  async uploadEvidence(disputeId: string, file: File, description: string = '') {
    try {
      console.log('🔄 [FRONTEND] Uploading evidence to dispute:', disputeId);
      console.log('📎 [FRONTEND] File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Create FormData properly
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      formData.append('type', 'OTHER');

      console.log('🔄 [FRONTEND] Sending FormData to backend...');

      // Use fetch directly for FormData to avoid apiService issues
      const response = await fetch(`http://localhost:5000/api/disputes/${disputeId}/evidence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          // Don't set Content-Type - let browser set it with boundary
        },
        body: formData,
      });

      console.log('🔧 [FRONTEND] Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [FRONTEND] Upload failed:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [FRONTEND] Evidence upload successful:', result);
      return result;

    } catch (error: any) {
      console.error('❌ [FRONTEND] Upload evidence error:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to upload evidence'
      };
    }
  }

  async addEvidence(
    disputeId: string,
    file: File,
    type: string = 'OTHER',
    description?: string,
    onProgress?: (progress: number) => void
  ) {
    // Simply call uploadEvidence to avoid duplication
    return this.uploadEvidence(disputeId, file, description || '');
  }

  async getUserDisputes(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<DisputesResponse> {
    try {
      console.log('🔄 Fetching user disputes...');

      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = queryString ? `/disputes/my-disputes?${queryString}` : '/disputes/my-disputes';

      const response = await apiService.request(endpoint, {
        method: 'GET',
      });

      console.log('✅ User disputes fetched successfully');
      return response;

    } catch (error: any) {
      console.error('❌ Get user disputes error:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to fetch disputes'
      };
    }
  }

  async getDisputeDetails(disputeId: string) {
    try {
      console.log('🔄 Fetching dispute details:', disputeId);
      const response = await apiService.request(`/disputes/${disputeId}`, {
        method: 'GET',
      });
      console.log('✅ Dispute details fetched successfully');
      return response;
    } catch (error: any) {
      console.error('❌ Get dispute details error:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to fetch dispute details'
      };
    }
  }

  async addMessage(
    disputeId: string,
    content: string,
    type: string = 'MESSAGE',
    isInternal: boolean = false
  ) {
    try {
      console.log('🔄 Adding message to dispute:', disputeId);
      const response = await apiService.request(`/disputes/${disputeId}/messages`, {
        method: 'POST',
        data: {
          content,
          type,
          isInternal
        },
      });
      console.log('✅ Message added successfully');
      return response;
    } catch (error: any) {
      console.error('❌ Add message error:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to add message'
      };
    }
  }

  async updateDisputeStatus(
    disputeId: string,
    status: string,
    resolution?: string,
    refundAmount?: number
  ) {
    try {
      console.log('🔄 Updating dispute status:', disputeId, status);
      const response = await apiService.request(`/disputes/${disputeId}/status`, {
        method: 'PATCH',
        data: {
          status,
          resolution,
          refundAmount
        },
      });
      console.log('✅ Dispute status updated successfully');
      return response;
    } catch (error: any) {
      console.error('❌ Update dispute status error:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to update dispute status'
      };
    }
  }

  async getAllDisputes(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      console.log('🔄 Fetching all disputes (Admin)');
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = queryString ? `/disputes?${queryString}` : '/disputes';

      const response = await apiService.request(endpoint, {
        method: 'GET',
      });
      console.log('✅ All disputes fetched successfully');
      return response;
    } catch (error: any) {
      console.error('❌ Get all disputes error:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to fetch disputes'
      };
    }
  }

  async getDisputeEvidence(disputeId: string) {
    try {
      const response = await apiService.request(`/disputes/${disputeId}/evidence`, {
        method: 'GET',
      });
      return response;
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'Failed to fetch evidence'
      };
    }
  }

  async getDisputeMessages(disputeId: string) {
    try {
      const response = await apiService.request(`/disputes/${disputeId}/messages`, {
        method: 'GET',
      });
      return response;
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'Failed to fetch messages'
      };
    }
  }

  async getDisputeStats() {
    try {
      console.log('🔄 Fetching dispute statistics');
      const response = await apiService.request('/disputes/stats/overview', {
        method: 'GET',
      });
      console.log('✅ Dispute stats fetched successfully');
      return response;
    } catch (error: any) {
      console.error('❌ Get dispute stats error:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to fetch dispute statistics'
      };
    }
  }

  async resolveDispute(
    disputeId: string,
    resolution: string
  ) {
    try {
      console.log('🔄 [FRONTEND] Resolving dispute:', disputeId);
  
      const response = await apiService.request(`/disputes/${disputeId}/resolve`, {
        method: 'PATCH',
        data: {
          resolution
        },
      });
  
      console.log('✅ [FRONTEND] Dispute resolved successfully');
      return response;
  
    } catch (error: any) {
      console.error('❌ Resolve dispute error:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to resolve dispute'
      };
    }
  }
}

export const disputeService = new DisputeService();