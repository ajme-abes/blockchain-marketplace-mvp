// src/services/disputeService.ts
import apiService from './api'; // Import your API service

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
    formData: FormData, 
    onProgress?: (progress: number) => void
  ): Promise<CreateDisputeResponse> {
    try {
      console.log('🔄 [FRONTEND] Starting dispute creation...');
      
      // Extract data from FormData for the main dispute creation
      const disputeData = {
        orderId: formData.get('orderId') as string,
        reason: formData.get('reason') as string,
        description: formData.get('description') as string,
      };

      console.log('📦 [FRONTEND] Dispute data to send:', disputeData);

      // First create the dispute using your API service
      console.log('🔄 [FRONTEND] Sending to backend...');
      
      // Use your API service with 'data' property
      const disputeResponse = await apiService.request('/disputes', {
        method: 'POST',
        data: disputeData, // Use 'data' instead of 'body'
      });

      console.log('✅ [FRONTEND] Backend response:', disputeResponse);

      // Extract the dispute from response based on your API structure
      const dispute = disputeResponse.data || disputeResponse;
      console.log('🎉 [FRONTEND] Dispute created with ID:', dispute?.id);

      // Then upload evidence files if any
      const evidenceFiles = formData.getAll('evidence') as File[];
      if (evidenceFiles.length > 0 && dispute?.id) {
        console.log(`📎 [FRONTEND] Uploading ${evidenceFiles.length} evidence files...`);
        
        for (const file of evidenceFiles) {
          await this.addEvidence(dispute.id, file, 'OTHER', '', onProgress);
        }
      }

      return {
        status: 'success',
        message: 'Dispute created successfully',
        data: dispute
      };

    } catch (error: any) {
      console.error('❌ [FRONTEND] Create dispute error:', error);
      
      const errorMessage = error.message || 'Failed to create dispute';

      return {
        status: 'error',
        message: errorMessage
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
    try {
      console.log('🔄 Adding evidence to dispute:', disputeId);

      // For file uploads, we need to use FormData directly
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (description) formData.append('description', description);

      const response = await fetch(`/api/disputes/${disputeId}/evidence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Evidence added successfully');
      return result;

    } catch (error: any) {
      console.error('❌ Add evidence error:', error);
      
      return {
        status: 'error',
        message: error.message || 'Failed to add evidence'
      };
    }
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
}

export const disputeService = new DisputeService();