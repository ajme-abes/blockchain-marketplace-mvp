// src/pages/buyer/BuyerDashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, DollarSign, TrendingUp, Eye, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { orderService } from '@/services/orderService';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalSpent: number;
  favoriteProducts: number;
}

interface RecentOrder {
  id: string;
  totalAmount: number;
  paymentStatus: string;
  deliveryStatus: string;
  orderDate: string;
  items: Array<{
    product: {
      name: string;
      imageUrl?: string;
      producer?: {
        businessName: string;
      };
    };
    quantity: number;
  }>;
}

const BuyerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
    favoriteProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch buyer orders
      const ordersResponse = await orderService.getUserOrders();
      const orders = ordersResponse?.orders || [];

      console.log('🔧 Buyer orders:', orders);

      // Calculate stats
      const pendingOrders = orders.filter(order => 
        ['PENDING', 'CONFIRMED', 'SHIPPED'].includes(order.deliveryStatus)
      ).length;

      const totalSpent = orders
        .filter(order => order.paymentStatus === 'CONFIRMED')
        .reduce((sum, order) => sum + order.totalAmount, 0);

      // Mock favorite products count (you can replace with real data)
      const favoriteProducts = orders.reduce((count, order) => 
        count + order.items.length, 0
      );

      setStats({
        totalOrders: orders.length,
        pendingOrders,
        totalSpent,
        favoriteProducts
      });

      // Get recent orders (last 5)
      setRecentOrders(orders.slice(0, 5));

    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-600';
      case 'CONFIRMED': return 'bg-blue-500/10 text-blue-600';
      case 'SHIPPED': return 'bg-purple-500/10 text-purple-600';
      case 'DELIVERED': return 'bg-green-500/10 text-green-600';
      case 'CANCELLED': return 'bg-red-500/10 text-red-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (amount: number) => {
    return `${amount.toFixed(2)} ETB`;
  };

  const getOrderTitle = (order: RecentOrder) => {
    if (order.items.length === 0) return 'No products';
    if (order.items.length === 1) return order.items[0].product.name;
    return `${order.items[0].product.name} + ${order.items.length - 1} more`;
  };

  const statCards = [
    { 
      title: 'Total Orders', 
      value: stats.totalOrders.toString(), 
      icon: ShoppingCart, 
      color: 'text-blue-600',
      description: 'All time purchases'
    },
    { 
      title: 'Pending', 
      value: stats.pendingOrders.toString(), 
      icon: Package, 
      color: 'text-orange-600',
      description: 'Active orders'
    },
    { 
      title: 'Total Spent', 
      value: formatPrice(stats.totalSpent), 
      icon: DollarSign, 
      color: 'text-green-600',
      description: 'All time spending'
    },
    { 
      title: 'Products Bought', 
      value: stats.favoriteProducts.toString(), 
      icon: TrendingUp, 
      color: 'text-purple-600',
      description: 'Unique items purchased'
    },
  ];

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="Buyer Dashboard" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading dashboard...</p>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader 
            title="Buyer Dashboard" 
            description="Track your orders and shopping activity"
          />

          <main className="flex-1 p-6">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Welcome back, {user?.name}!
              </h2>
              <p className="text-muted-foreground text-lg">
                Here's your shopping activity and order updates.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat, index) => (
                <Card key={index} className="shadow-card hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Your latest purchases</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/my-orders')}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {recentOrders.length > 0 ? (
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {getOrderTitle(order)}
                              </span>
                              <Badge variant="outline" className={getStatusColor(order.deliveryStatus)}>
                                {order.deliveryStatus}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {order.items[0]?.product.producer?.businessName || 'Seller'} • {formatDate(order.orderDate)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">{formatPrice(order.totalAmount)}</div>
                            <div className="flex gap-1 mt-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs"
                                onClick={() => navigate(`/orders/${order.id}`)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              {order.deliveryStatus === 'DELIVERED' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-6 text-xs"
                                  onClick={() => navigate(`/my-orders/${order.id}/review`)}
                                >
                                  Review
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No orders yet</p>
                      <Button onClick={() => navigate('/marketplace')}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Start Shopping
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions & Recommendations */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your shopping experience</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <Button 
                      variant="outline" 
                      className="h-16 flex-col"
                      onClick={() => navigate('/marketplace')}
                    >
                      <Sparkles className="h-5 w-5 mb-2" />
                      <span>Browse Products</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 flex-col"
                      onClick={() => navigate('/my-orders')}
                    >
                      <ShoppingCart className="h-5 w-5 mb-2" />
                      <span>My Orders</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 flex-col"
                      onClick={() => navigate('/profile')}
                    >
                      <TrendingUp className="h-5 w-5 mb-2" />
                      <span>Profile</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 flex-col"
                      onClick={() => navigate('/cart')}
                    >
                      <Package className="h-5 w-5 mb-2" />
                      <span>Cart</span>
                    </Button>
                  </div>

                  {/* Recommendations Section */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Shopping Tips</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Check product reviews before purchasing</p>
                      <p>• Verify seller ratings and transaction history</p>
                      <p>• All transactions are blockchain-verified</p>
                      <p>• Contact sellers directly for product questions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default BuyerDashboard;