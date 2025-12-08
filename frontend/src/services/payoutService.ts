// frontend/src/services/payoutService.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

export interface ProducerPayout {
    id: string;
    producer: {
        id: string;
        businessName: string;
        location?: string;
        verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
        user: {
            id: string;
            name: string;
            email: string;
            phone?: string;
        };
    };
    amount: number;
    commission: number;
    netAmount: number;
    status: 'PENDING' | 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    payoutMethod?: string;
    payoutReference?: string;
    scheduledFor: string;
    paidAt?: string;
    notes?: string;
    orders: Array<{
        orderId: string;
        orderDate: string;
        amount: number;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface ProducerEarnings {
    pending: number;
    completed: number;
    total: number;
}

class PayoutService {
    // ========== ADMIN ENDPOINTS ==========

    /**
     * Get ALL payouts (all statuses)
     */
    async getAllPayouts(): Promise<ProducerPayout[]> {
        console.log('🌐 Fetching all payouts from:', `${API_BASE_URL}/payouts`);
        const headers = getAuthHeaders();

        const response = await fetch(`${API_BASE_URL}/payouts`, {
            headers,
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            throw new Error(`Failed to fetch all payouts: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('📦 Received data:', data);
        return data.payouts || [];
    }

    /**
     * Get all pending/scheduled payouts
     */
    async getPendingPayouts(): Promise<ProducerPayout[]> {
        console.log('🌐 Fetching pending payouts from:', `${API_BASE_URL}/payouts/pending`);
        const headers = getAuthHeaders();
        console.log('🔑 Using headers:', headers);

        const response = await fetch(`${API_BASE_URL}/payouts/pending`, {
            headers,
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            throw new Error(`Failed to fetch pending payouts: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('📦 Received data:', data);
        return data.payouts || [];
    }

    /**
     * Get payouts due for processing
     */
    async getDuePayouts(): Promise<{ payouts: ProducerPayout[]; count: number }> {
        console.log('🌐 Fetching due payouts from:', `${API_BASE_URL}/payouts/due`);
        const headers = getAuthHeaders();
        console.log('🔑 Using headers:', headers);

        const response = await fetch(`${API_BASE_URL}/payouts/due`, {
            headers,
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            throw new Error(`Failed to fetch due payouts: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('📦 Received data:', data);
        return {
            payouts: data.payouts || [],
            count: data.count || 0
        };
    }

    /**
     * Mark payout as processing
     */
    async markPayoutProcessing(payoutId: string): Promise<ProducerPayout> {
        const response = await fetch(`${API_BASE_URL}/payouts/${payoutId}/process`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to mark payout as processing');
        const data = await response.json();
        return data.payout;
    }

    /**
     * Mark payout as completed
     */
    async markPayoutComplete(
        payoutId: string,
        payoutReference: string,
        payoutMethod: string = 'BANK_TRANSFER',
        bankAccountDetails?: {
            bankAccountId?: string;
            bankName?: string;
            accountNumber?: string;
            accountName?: string;
        }
    ): Promise<ProducerPayout> {
        const response = await fetch(`${API_BASE_URL}/payouts/${payoutId}/complete`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                payoutReference,
                payoutMethod,
                bankAccountDetails
            }),
        });
        if (!response.ok) throw new Error('Failed to complete payout');
        const data = await response.json();
        return data.payout;
    }

    /**
     * Mark payout as failed
     */
    async markPayoutFailed(payoutId: string, reason: string): Promise<ProducerPayout> {
        const response = await fetch(`${API_BASE_URL}/payouts/${payoutId}/fail`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ reason }),
        });
        if (!response.ok) throw new Error('Failed to mark payout as failed');
        const data = await response.json();
        return data.payout;
    }

    /**
     * Get specific producer's payout history
     */
    async getProducerPayouts(
        producerId: string,
        page: number = 1,
        limit: number = 20
    ): Promise<{
        payouts: ProducerPayout[];
        pagination: {
            page: number;
            limit: number;
            totalCount: number;
            totalPages: number;
        };
    }> {
        const response = await fetch(
            `${API_BASE_URL}/payouts/producer/${producerId}?page=${page}&limit=${limit}`,
            { headers: getAuthHeaders() }
        );
        if (!response.ok) throw new Error('Failed to fetch producer payouts');
        const data = await response.json();
        return data;
    }

    // ========== PRODUCER ENDPOINTS ==========

    /**
     * Get own payout history
     */
    async getMyPayouts(
        page: number = 1,
        limit: number = 20
    ): Promise<{
        payouts: ProducerPayout[];
        pagination: {
            page: number;
            limit: number;
            totalCount: number;
            totalPages: number;
        };
    }> {
        const response = await fetch(
            `${API_BASE_URL}/payouts/my-payouts?page=${page}&limit=${limit}`,
            { headers: getAuthHeaders() }
        );
        if (!response.ok) throw new Error('Failed to fetch my payouts');
        const data = await response.json();
        return data;
    }

    /**
     * Get own earnings summary
     */
    async getMyEarnings(): Promise<ProducerEarnings> {
        const response = await fetch(`${API_BASE_URL}/payouts/my-earnings`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch earnings');
        const data = await response.json();
        return data.earnings;
    }

    // ========== UTILITY METHODS ==========

    /**
     * Format currency
     */
    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 2,
        }).format(amount);
    }

    /**
     * Format date
     */
    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-ET', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    /**
     * Format date and time
     */
    formatDateTime(dateString: string): string {
        return new Date(dateString).toLocaleString('en-ET', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    /**
     * Get status badge color
     */
    getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
            SCHEDULED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            PROCESSING: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
            COMPLETED: 'bg-green-500/10 text-green-600 border-green-500/20',
            FAILED: 'bg-red-500/10 text-red-600 border-red-500/20',
            CANCELLED: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
        };
        return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
}

export default new PayoutService();
