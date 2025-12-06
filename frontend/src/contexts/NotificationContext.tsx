// src/contexts/NotificationContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Notification {
    id: string;
    message: string;
    type: string; // Backend types: ORDER_CREATED, PAYMENT_CONFIRMED, ORDER_SHIPPED, DISPUTE_RAISED, GENERAL, SECURITY, SYSTEM
    isRead: boolean;
    createdAt: string;
    status?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications?limit=20', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                console.log('📬 Notifications Response:', result);

                if (result.status === 'success') {
                    // Handle double nesting: result.data.data contains the actual notifications
                    const notificationData = result.data?.data || result.data;
                    const notificationsList = notificationData?.notifications || [];
                    const unreadCountValue = notificationData?.pagination?.unreadCount || notificationData?.unreadCount || 0;

                    console.log('📬 Notification Data:', notificationData);
                    console.log('📬 Notifications List:', notificationsList);
                    console.log('📬 Unread Count:', unreadCountValue);

                    // Map backend notifications to frontend format
                    const mappedNotifications = notificationsList.map((notif: any) => ({
                        id: notif.id,
                        message: notif.message,
                        type: notif.type,
                        isRead: notif.status === 'READ',
                        createdAt: notif.createdAt,
                        status: notif.status
                    }));

                    setNotifications(mappedNotifications);
                    setUnreadCount(unreadCountValue);

                    console.log(`📬 Loaded ${mappedNotifications.length} notifications, ${unreadCountValue} unread`);
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                // Update local state
                setNotifications(prev =>
                    prev.map(notif =>
                        notif.id === id ? { ...notif, isRead: true } : notif
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/read-all', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                // Update local state
                setNotifications(prev =>
                    prev.map(notif => ({ ...notif, isRead: true }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Fetch notifications when user logs in
    useEffect(() => {
        if (user) {
            fetchNotifications();

            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                fetchNotifications,
                markAsRead,
                markAllAsRead
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
