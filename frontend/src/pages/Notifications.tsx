// src/pages/Notifications.tsx
import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications } from '@/contexts/NotificationContext';
import {
    Bell,
    Package,
    CreditCard,
    Shield,
    AlertTriangle,
    Star,
    CheckCircle,
    RefreshCw,
    Trash2
} from 'lucide-react';

const Notifications = () => {
    const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
    const [activeTab, setActiveTab] = useState('all');

    // Get icon for notification type
    const getNotificationIcon = (type: string) => {
        // Handle backend notification types
        if (type.includes('ORDER')) return <Package className="h-5 w-5 text-blue-600" />;
        if (type.includes('PAYMENT')) return <CreditCard className="h-5 w-5 text-green-600" />;
        if (type.includes('SECURITY')) return <Shield className="h-5 w-5 text-purple-600" />;
        if (type.includes('REVIEW')) return <Star className="h-5 w-5 text-yellow-600" />;
        if (type.includes('DISPUTE')) return <AlertTriangle className="h-5 w-5 text-red-600" />;
        return <Bell className="h-5 w-5 text-gray-600" />;
    };

    // Format time ago
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter notifications by tab
    const filteredNotifications = notifications.filter(notif => {
        if (activeTab === 'all') return true;
        if (activeTab === 'unread') return !notif.isRead;
        // Handle backend types like ORDER_CREATED, PAYMENT_CONFIRMED, etc.
        return notif.type.includes(activeTab.toUpperCase());
    });

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col">
                    <PageHeader
                        title="Notifications"
                        description="Stay updated with your marketplace activities"
                        action={
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={fetchNotifications}
                                    disabled={loading}
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                                {unreadCount > 0 && (
                                    <Button onClick={markAllAsRead}>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Mark All as Read
                                    </Button>
                                )}
                            </div>
                        }
                    />

                    <main className="flex-1 p-6">
                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Bell className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold">{notifications.length}</div>
                                                <div className="text-sm text-muted-foreground">Total</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-100 rounded-lg">
                                                <AlertTriangle className="h-6 w-6 text-amber-600" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold">{unreadCount}</div>
                                                <div className="text-sm text-muted-foreground">Unread</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <Package className="h-6 w-6 text-green-600" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold">
                                                    {notifications.filter(n => n.type.includes('ORDER')).length}
                                                </div>
                                                <div className="text-sm text-muted-foreground">Orders</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <CreditCard className="h-6 w-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold">
                                                    {notifications.filter(n => n.type.includes('PAYMENT')).length}
                                                </div>
                                                <div className="text-sm text-muted-foreground">Payments</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Notifications List */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Bell className="h-5 w-5" />
                                        All Notifications
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                                        <TabsList className="grid w-full grid-cols-6">
                                            <TabsTrigger value="all">All</TabsTrigger>
                                            <TabsTrigger value="unread">
                                                Unread {unreadCount > 0 && `(${unreadCount})`}
                                            </TabsTrigger>
                                            <TabsTrigger value="order">Orders</TabsTrigger>
                                            <TabsTrigger value="payment">Payments</TabsTrigger>
                                            <TabsTrigger value="security">Security</TabsTrigger>
                                            <TabsTrigger value="review">Reviews</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value={activeTab} className="mt-6">
                                            {loading ? (
                                                <div className="flex justify-center py-12">
                                                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                                </div>
                                            ) : filteredNotifications.length > 0 ? (
                                                <div className="space-y-3">
                                                    {filteredNotifications.map((notification) => (
                                                        <div
                                                            key={notification.id}
                                                            className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${!notification.isRead
                                                                ? 'bg-blue-50 border-blue-200'
                                                                : 'bg-background hover:bg-muted/50'
                                                                }`}
                                                        >
                                                            <div className="mt-1">
                                                                {getNotificationIcon(notification.type)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <p className="text-sm font-medium">
                                                                        {notification.message}
                                                                    </p>
                                                                    {!notification.isRead && (
                                                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0"></div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-4 mt-2">
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {formatTimeAgo(notification.createdAt)}
                                                                    </span>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {notification.type}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                {!notification.isRead && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => markAsRead(notification.id)}
                                                                        title="Mark as read"
                                                                    >
                                                                        <CheckCircle className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12">
                                                    <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                                                    <p className="text-muted-foreground">
                                                        {activeTab === 'unread'
                                                            ? 'No unread notifications'
                                                            : 'No notifications yet'}
                                                    </p>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
};

export default Notifications;
