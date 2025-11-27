// src/services/adminService.ts
import api from './api';

export interface AdminStats {
  totalUsers: number;
  totalProducers: number;
  totalBuyers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingVerifications: number;
  averageOrderValue: number;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  verification?: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
  producerId?: string;
  verificationStatus?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  paymentStatus?: string;
  deliveryStatus?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  buyerId?: string;
  producerId?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: string;
}

export const adminService = {
  // ==================== DASHBOARD & OVERVIEW ====================
  async getDashboardStats() {
    try {
      console.log('🔧 Fetching admin dashboard stats...');
      const response = await api.request('/admin/dashboard/stats');
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch dashboard stats:', error);
      throw new Error(error.message || 'Failed to fetch dashboard stats');
    }
  },

  async getEnhancedOverview(range: string = 'today') {
    try {
      console.log('🔧 Fetching enhanced admin overview...', { range });
      const response = await api.request(`/admin/overview?range=${range}`);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch enhanced overview:', error);
      throw new Error(error.message || 'Failed to fetch enhanced overview');
    }
  },

  // ==================== USER MANAGEMENT ====================
  async getAllUsers(filters: UserFilters = {}) {
    try {
      console.log('🔧 Fetching users with filters:', filters);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.request(`/admin/users?${queryParams}`);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch users:', error);
      throw new Error(error.message || 'Failed to fetch users');
    }
  },

  async getUsersWithStats(filters: UserFilters = {}) {
    try {
      console.log('🔧 Fetching users with stats:', filters);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.request(`/admin/users-with-stats?${queryParams}`);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch users with stats:', error);
      throw new Error(error.message || 'Failed to fetch users with stats');
    }
  },

  async getUserDetail(userId: string) {
    try {
      console.log('🔧 Fetching user details:', userId);
      const response = await api.request(`/admin/users/${userId}`);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch user details:', error);
      throw new Error(error.message || 'Failed to fetch user details');
    }
  },

  async suspendUser(userId: string, reason: string) {
    try {
      console.log('🔧 Suspending user:', userId);
      const response = await api.request(`/admin/users/${userId}/suspend`, {
        method: 'PATCH',
        data: { reason }
      });
      return response;
    } catch (error: any) {
      console.error('❌ Failed to suspend user:', error);
      throw new Error(error.message || 'Failed to suspend user');
    }
  },

  async activateUser(userId: string) {
    try {
      console.log('🔧 Activating user:', userId);
      const response = await api.request(`/admin/users/${userId}/activate`, {
        method: 'PATCH'
      });
      return response;
    } catch (error: any) {
      console.error('❌ Failed to activate user:', error);
      throw new Error(error.message || 'Failed to activate user');
    }
  },

  async deleteUser(userId: string) {
    try {
      console.log('🔧 Deleting user:', userId);
      const response = await api.request(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error: any) {
      console.error('❌ Failed to delete user:', error);
      throw new Error(error.message || 'Failed to delete user');
    }
  },

  // ==================== PRODUCER VERIFICATION ====================
  async getVerificationQueue() {
    try {
      console.log('🔧 Fetching verification queue...');
      const response = await api.request('/admin/producers/verification-queue');
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch verification queue:', error);
      throw new Error(error.message || 'Failed to fetch verification queue');
    }
  },

  async verifyProducer(producerId: string, status: 'VERIFIED' | 'REJECTED', reason?: string) {
    try {
      console.log('🔧 Verifying producer:', { producerId, status, reason });
      const response = await api.request(`/admin/producers/${producerId}/verify`, {
        method: 'PATCH',
        data: { status, reason }
      });
      return response;
    } catch (error: any) {
      console.error('❌ Failed to verify producer:', error);
      throw new Error(error.message || 'Failed to verify producer');
    }
  },

  // ==================== PRODUCT MANAGEMENT ====================
  async getAdminProducts(filters: ProductFilters = {}) {
    try {
      console.log('🔧 Fetching admin products with filters:', filters);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.request(`/admin/products?${queryParams}`);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch admin products:', error);
      throw new Error(error.message || 'Failed to fetch admin products');
    }
  },

  async getProductStats() {
    try {
      console.log('🔧 Fetching product statistics...');
      const response = await api.request('/admin/products/stats');
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch product stats:', error);
      throw new Error(error.message || 'Failed to fetch product stats');
    }
  },

  async getProductDetail(productId: string) {
    try {
      console.log('🔧 Fetching product detail:', productId);
      const response = await api.request(`/admin/products/${productId}`);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch product detail:', error);
      throw new Error(error.message || 'Failed to fetch product detail');
    }
  },

  async updateProductStatus(productId: string, status: string, reason?: string) {
    try {
      console.log('🔧 Updating product status:', { productId, status, reason });
      const response = await api.request(`/admin/products/${productId}/status`, {
        method: 'PATCH',
        data: { status, reason }
      });
      return response;
    } catch (error: any) {
      console.error('❌ Failed to update product status:', error);
      throw new Error(error.message || 'Failed to update product status');
    }
  },

  async deleteProduct(productId: string) {
    try {
      console.log('🔧 Deleting product:', productId);
      const response = await api.request(`/admin/products/${productId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error: any) {
      console.error('❌ Failed to delete product:', error);
      throw new Error(error.message || 'Failed to delete product');
    }
  },

  async bulkProductActions(productIds: string[], action: string, reason?: string) {
    try {
      console.log('🔧 Performing bulk product actions:', { productIds, action, reason });
      const response = await api.request('/admin/products/bulk-actions', {
        method: 'POST',
        data: { productIds, action, reason }
      });
      return response;
    } catch (error: any) {
      console.error('❌ Failed to perform bulk product actions:', error);
      throw new Error(error.message || 'Failed to perform bulk product actions');
    }
  },

  async getPendingReviewProducts(page: number = 1, limit: number = 20) {
    try {
      console.log('🔧 Fetching pending review products...');
      const response = await api.request(`/admin/products/pending-review?page=${page}&limit=${limit}`);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch pending review products:', error);
      throw new Error(error.message || 'Failed to fetch pending review products');
    }
  },

  // ==================== ORDER MANAGEMENT ====================
  async getAdminOrders(filters: OrderFilters = {}) {
    try {
      console.log('🔧 Fetching admin orders with filters:', filters);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.request(`/admin/orders?${queryParams}`);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch admin orders:', error);
      throw new Error(error.message || 'Failed to fetch admin orders');
    }
  },

  async getOrderStats(period: string = 'monthly') {
    try {
      console.log('🔧 Fetching order statistics...', { period });
      const response = await api.request(`/admin/orders/stats?period=${period}`);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch order stats:', error);
      throw new Error(error.message || 'Failed to fetch order stats');
    }
  },

  async getOrderDetail(orderId: string) {
    try {
      console.log('🔧 Fetching order detail:', orderId);
      const response = await api.request(`/admin/orders/${orderId}`);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch order detail:', error);
      throw new Error(error.message || 'Failed to fetch order detail');
    }
  },

  async updateOrderStatus(orderId: string, status: string, reason?: string) {
    try {
      console.log('🔧 Updating order status:', { orderId, status, reason });
      const response = await api.request(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        data: { status, reason }
      });
      return response;
    } catch (error: any) {
      console.error('❌ Failed to update order status:', error);
      throw new Error(error.message || 'Failed to update order status');
    }
  },

  async cancelOrder(orderId: string, reason: string) {
    try {
      console.log('🔧 Cancelling order:', { orderId, reason });
      const response = await api.request(`/admin/orders/${orderId}/cancel`, {
        method: 'POST',
        data: { reason }
      });
      return response;
    } catch (error: any) {
      console.error('❌ Failed to cancel order:', error);
      throw new Error(error.message || 'Failed to cancel order');
    }
  },

  async bulkOrderActions(orderIds: string[], action: string, reason?: string) {
    try {
      console.log('🔧 Performing bulk order actions:', { orderIds, action, reason });
      const response = await api.request('/admin/orders/bulk-actions', {
        method: 'POST',
        data: { orderIds, action, reason }
      });
      return response;
    } catch (error: any) {
      console.error('❌ Failed to perform bulk order actions:', error);
      throw new Error(error.message || 'Failed to perform bulk order actions');
    }
  },

  async getOrdersRequiringAttention() {
    try {
      console.log('🔧 Fetching orders requiring attention...');
      const response = await api.request('/admin/orders/attention-required');
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch orders requiring attention:', error);
      throw new Error(error.message || 'Failed to fetch orders requiring attention');
    }
  },

  // ==================== ANALYTICS & REPORTS ====================
  async getRevenueAnalytics(period: string = 'monthly', months: number = 12) {
    try {
      console.log('🔧 Fetching revenue analytics...', { period, months });
      const response = await api.request(`/admin/analytics/revenue?period=${period}&months=${months}`);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch revenue analytics:', error);
      throw new Error(error.message || 'Failed to fetch revenue analytics');
    }
  },

  async getPaymentAnalytics(period: string = 'monthly') {
    try {
      console.log('🔧 Fetching payment analytics...', { period });
      const response = await api.request(`/admin/analytics/payments?period=${period}`);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch payment analytics:', error);
      throw new Error(error.message || 'Failed to fetch payment analytics');
    }
  },

  // ==================== SYSTEM MANAGEMENT ====================
  async getSystemHealth() {
    try {
      console.log('🔧 Fetching system health...');
      const response = await api.request('/admin/system/health');
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch system health:', error);
      throw new Error(error.message || 'Failed to fetch system health');
    }
  },

  async getSystemAlerts() {
    try {
      console.log('🔧 Fetching system alerts...');
      // This uses the enhanced system alerts from adminService
      const response = await api.request('/admin/dashboard/stats');
      return response.data?.systemAlertsList || [];
    } catch (error: any) {
      console.error('❌ Failed to fetch system alerts:', error);
      throw new Error(error.message || 'Failed to fetch system alerts');
    }
  }
};