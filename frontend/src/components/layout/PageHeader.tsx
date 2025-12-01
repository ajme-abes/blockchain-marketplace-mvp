import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { ShoppingCart, Bell, Package, CreditCard, Shield, AlertTriangle, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export const PageHeader = ({ title, description, action }: PageHeaderProps) => {
  const { user } = useAuth();
  const { state: cartState } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    // Handle backend notification types
    if (type.includes('ORDER')) return <Package className="h-4 w-4" />;
    if (type.includes('PAYMENT')) return <CreditCard className="h-4 w-4" />;
    if (type.includes('SECURITY')) return <Shield className="h-4 w-4" />;
    if (type.includes('REVIEW')) return <Star className="h-4 w-4" />;
    if (type.includes('DISPUTE')) return <AlertTriangle className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-4 bg-background sticky top-0 z-10">
      <div className="flex items-center">
        <SidebarTrigger />
        <div className="ml-4">
          <h1 className="text-xl font-bold">{title}</h1>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {action && <div className="mr-2">{action}</div>}
        {/* Notifications - For all authenticated users */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Notifications</h4>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-y-auto space-y-1">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`flex flex-col items-start p-3 cursor-pointer hover:bg-accent ${!notification.isRead ? 'bg-blue-50' : ''
                          }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="text-blue-600">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium line-clamp-2">
                              {notification.message}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(notification.createdAt)}
                            </div>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No notifications yet
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <Link to="/notifications" className="block">
                      <Button variant="ghost" className="w-full justify-center text-sm">
                        View all notifications
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Cart - Only for buyers */}
        {user && user.role === 'BUYER' && (
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartState.itemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartState.itemCount}
                </Badge>
              )}
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

