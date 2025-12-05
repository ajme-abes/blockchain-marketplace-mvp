// frontend/src/contexts/DisputeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { disputeService } from '@/services/disputeService';

interface DisputeContextType {
    activeDisputeCount: number;
    loading: boolean;
    refreshDisputeCount: () => Promise<void>;
}

const DisputeContext = createContext<DisputeContextType | undefined>(undefined);

export const useDispute = () => {
    const context = useContext(DisputeContext);
    if (!context) {
        throw new Error('useDispute must be used within a DisputeProvider');
    }
    return context;
};

interface DisputeProviderProps {
    children: ReactNode;
}

export const DisputeProvider: React.FC<DisputeProviderProps> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [activeDisputeCount, setActiveDisputeCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const refreshDisputeCount = async () => {
        if (!isAuthenticated || !user) {
            setActiveDisputeCount(0);
            return;
        }

        try {
            setLoading(true);

            // Fetch disputes with OPEN and UNDER_REVIEW status
            const [openResponse, underReviewResponse] = await Promise.all([
                disputeService.getUserDisputes({ status: 'OPEN', limit: 1 }),
                disputeService.getUserDisputes({ status: 'UNDER_REVIEW', limit: 1 })
            ]);

            let count = 0;

            if (openResponse.status === 'success' && openResponse.data?.pagination) {
                count += openResponse.data.pagination.totalCount || 0;
            }

            if (underReviewResponse.status === 'success' && underReviewResponse.data?.pagination) {
                count += underReviewResponse.data.pagination.totalCount || 0;
            }

            setActiveDisputeCount(count);
            console.log('✅ Active dispute count updated:', count);

        } catch (error) {
            console.error('❌ Failed to fetch dispute count:', error);
            setActiveDisputeCount(0);
        } finally {
            setLoading(false);
        }
    };

    // Load dispute count when authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            refreshDisputeCount();

            // Refresh every 2 minutes
            const interval = setInterval(refreshDisputeCount, 120000);
            return () => clearInterval(interval);
        } else {
            setActiveDisputeCount(0);
        }
    }, [isAuthenticated, user]);

    const value: DisputeContextType = {
        activeDisputeCount,
        loading,
        refreshDisputeCount
    };

    return (
        <DisputeContext.Provider value={value}>
            {children}
        </DisputeContext.Provider>
    );
};
