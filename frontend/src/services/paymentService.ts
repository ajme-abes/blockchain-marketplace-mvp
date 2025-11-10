// src/services/paymentService.ts
import api from './api';

export interface PaymentIntent {
  paymentUrl: string;
  paymentReference: string;
  paymentRecordId: string;
}

export interface CreatePaymentData {
  orderData: {
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
    shippingAddress: {
      fullName: string;
      phone: string;
      email: string;
      address: string;
      city: string;
      region: string;
      additionalInfo?: string;
    };
    totalAmount: number;
  };
  paymentMethod: 'chapa' | 'arifpay';
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface PaymentStatus {
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'NOT_INITIATED';
  amount?: number;
  method?: string;
  confirmedAt?: string;
  transactionHash?: string;
}

export interface CreatePaymentIntentData {
  orderId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

// Add missing interface
interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  region: string;
  additionalInfo?: string;
}

export const paymentService = {
  // Create payment (complete flow: order creation + payment intent)
  async createPayment(paymentData: {
    orderData: {
      items: Array<{
        productId: string;
        quantity: number;
        price: number;
      }>;
      shippingAddress: ShippingAddress;
      totalAmount: number;
    };
    paymentMethod: 'chapa' | 'arifpay';
    customerInfo: {
      name: string;
      email: string;
      phone: string;
    };
  }): Promise<PaymentIntent> {
    try {
      console.log('🔍 DEBUG: Starting payment creation...');

      // 1. First create the order
      console.log('🔍 DEBUG: Calling /api/orders...');
      const orderResponse = await api.request('/orders', {
        method: 'POST',
        body: JSON.stringify(paymentData.orderData),
      });

      console.log('🔍 DEBUG: Order response:', orderResponse);

      if (!orderResponse.data || !orderResponse.data.id) {
        console.error('❌ DEBUG: Order creation failed - no order ID');
        throw new Error('Failed to create order: No order ID returned');
      }

      const orderId = orderResponse.data.id;
      console.log('🔍 DEBUG: Order created with ID:', orderId);

      // 2. Then create payment intent
      console.log('🔍 DEBUG: Calling /api/payments/create-intent...');
      const paymentResponse = await api.request('/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          customerInfo: paymentData.customerInfo,
        }),
      });

      console.log('🔍 DEBUG: Payment intent response:', paymentResponse);

      // ✅ FIXED: The payment data is directly in response.data, not response.data.data
      if (paymentResponse.data) {
        const paymentResult = paymentResponse.data;
        console.log('🔍 DEBUG: Payment result:', paymentResult);

        // Check if all required fields exist
        if (paymentResult.paymentUrl && paymentResult.paymentReference && paymentResult.paymentRecordId) {
          console.log('✅ DEBUG: All payment fields are present!');
          console.log('✅ Payment URL:', paymentResult.paymentUrl);
          return paymentResult;
        } else {
          console.error('❌ DEBUG: Missing required payment fields:', {
            hasPaymentUrl: !!paymentResult.paymentUrl,
            hasPaymentReference: !!paymentResult.paymentReference,
            hasPaymentRecordId: !!paymentResult.paymentRecordId
          });
          throw new Error('Payment response missing required fields');
        }
      }

      console.error('❌ DEBUG: paymentResponse.data is missing');
      throw new Error('Invalid payment response');

    } catch (error: any) {
      console.error('❌ DEBUG: Payment creation failed:', error);
      
      if (error.response) {
        console.error('❌ DEBUG: HTTP Status:', error.response.status);
        console.error('❌ DEBUG: Response data:', error.response.data);
      }
      
      throw new Error(error.message || 'Failed to create payment');
    }
  },

  // Get payment status
  async getPaymentStatus(orderId: string): Promise<PaymentStatus> {
    try {
      const response = await api.request(`/payments/${orderId}/status`);
      
      // ✅ FIXED: Data is directly in response.data
      if (response.data) {
        return response.data;
      }

      throw new Error('Invalid payment status response');

    } catch (error: any) {
      console.error('❌ Get payment status failed:', error);
      throw new Error(error.message || 'Failed to get payment status');
    }
  },

  // Verify payment (for callback handling)
  async verifyPayment(paymentReference: string): Promise<{ verified: boolean; orderId?: string }> {
    try {
      const response = await api.request(`/payments/verify/${paymentReference}`);
      
      // ✅ FIXED: Data is directly in response.data
      if (response.data) {
        return response.data;
      }
      
      return { verified: false };
    } catch (error: any) {
      console.error('❌ Payment verification failed:', error);
      return { verified: false };
    }
  },

  // Create payment intent (when order already exists)
  async createPaymentIntent(paymentData: CreatePaymentIntentData): Promise<PaymentIntent> {
    try {
      console.log('💳 Creating payment intent for order:', paymentData.orderId);

      const response = await api.request('/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({
          orderId: paymentData.orderId,
          customerInfo: paymentData.customerInfo,
        }),
      });

      console.log('✅ Payment intent response:', response);

      // ✅ FIXED: Data is directly in response.data
      if (response.data) {
        const paymentResult = response.data;
        
        if (paymentResult.paymentUrl && paymentResult.paymentReference && paymentResult.paymentRecordId) {
          console.log('✅ Payment intent created successfully');
          console.log('✅ Payment URL:', paymentResult.paymentUrl);
          return paymentResult;
        } else {
          console.error('❌ Missing required payment fields:', paymentResult);
          throw new Error('Payment response missing required fields');
        }
      }

      throw new Error('Invalid payment response');

    } catch (error: any) {
      console.error('❌ Payment intent creation failed:', error);
      
      if (error.response) {
        console.error('❌ HTTP Status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
      }
      
      throw new Error(error.message || 'Failed to create payment intent');
    }
  }
};

export default paymentService;