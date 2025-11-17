import api from './api';

export interface BlockchainStatus {
  verified: boolean;
  txHash?: string;
  status: 'verified' | 'pending_verification' | 'payment_pending' | 'error';
  message?: string;
  explorerUrl?: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  type: 'sale' | 'purchase';
  amount: number;
  status: string;
  date: string;
  items: Array<{
    product: string;
    producer?: string;
    quantity: number;
    price: number;
  }>;
  buyerName?: string;
  paymentMethod?: string;
  blockchainTxHash?: string;
  blockchainRecorded?: boolean;
  blockchainStatus: BlockchainStatus; // ADD THIS
  confirmedAt?: string;
}

export interface TransactionStats {
  totalRevenue?: number;
  totalSpent?: number;
  totalSales?: number;
  totalOrders?: number;
  completedSales?: number;
  completedOrders?: number;
  pendingSales?: number;
  pendingOrders?: number;
}

export interface SalesAnalytics {
  revenueData: Array<{ date: string; revenue: number }>;
  productPerformance: Array<{ product: string; revenue: number; quantity: number }>;
  totalRevenue: number;
  totalOrders: number;
}

class TransactionService {
  async getBuyerTransactions(filters?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    const response = await api.request('/transactions/buyer', {
      params: filters
    });
    return response.data;
  }

  async getProducerTransactions(filters?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    const response = await api.request('/transactions/producer', {
      params: filters
    });
    return response.data;
  }

  async getSalesAnalytics(period: string = 'month') {
    const response = await api.request('/transactions/analytics/sales', {
      params: { period }
    });
    return response.data;
  }
}

export const transactionService = new TransactionService();