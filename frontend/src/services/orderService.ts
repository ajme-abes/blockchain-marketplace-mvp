// src/services/orderService.ts - UPDATED ENDPOINTS
import api from './api';

export const orderService = {
    async createOrder(orderData: any) {
        try {
          console.log('🔧 Creating order with data:', orderData);
          const response = await api.request('/orders', {
            method: 'POST',
            body: orderData, // This will now be properly stringified
          });
          console.log('✅ Order creation response:', response);
          return response;
        } catch (error: any) {
          console.error('❌ Order creation failed:', error);
          throw new Error(error.message || 'Failed to create order');
        }
      },

  async getOrder(orderId: string) {
    try {
      console.log('🔧 Fetching order:', orderId);
      const response = await api.request(`/orders/${orderId}`);
      console.log('✅ Order fetch response:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Order fetch failed:', error);
      throw new Error(error.message || 'Failed to fetch order');
    }
  },

  async getUserOrders() {
    try {
      console.log('🔧 Fetching user orders');
      const response = await api.request('/orders/my/orders');
      console.log('✅ User orders response:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ User orders fetch failed:', error);
      throw new Error(error.message || 'Failed to fetch user orders');
    }
  },

  async updateOrderStatus(orderId: string, status: string) {
    try {
      console.log('🔧 Updating order status:', { orderId, status });
      const response = await api.request(`/orders/${orderId}/status`, {
        method: 'PUT', 
        body: { status },
      });
      console.log('✅ Status update response:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Status update failed:', error);
      throw new Error(error.message || 'Failed to update order status');
    }
  },
  async getProducerOrders() {
    try {
      console.log('🔧 Fetching producer orders');
      const response = await api.request('/orders/producer/orders');
      console.log('✅ Producer orders response:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Producer orders fetch failed:', error);
      throw new Error(error.message || 'Failed to fetch producer orders');
    }
  },

  async getProducerProducts() {
    try {
      console.log('🔧 Fetching producer products');
      const response = await api.request('/products/my/products'); 
      console.log('✅ Producer products response:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Producer products fetch failed:', error);
      throw new Error(error.message || 'Failed to fetch producer products');
    }
  }
};