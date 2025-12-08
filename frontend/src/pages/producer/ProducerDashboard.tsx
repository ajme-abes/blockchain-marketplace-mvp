// src/pages/producer/ProducerDashboard.tsx
import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, DollarSign, TrendingUp, Eye, Plus, Loader2, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalProducts: number;
  pendingOrders: number;
  totalEarnings: number;
  growthPercentage: number;
}

interface RecentOrder {
  id: string;
  totalAmount: number;
  deliveryStatus: string;
  orderDate: string;
  buyer: {
    user: {
      name: string;
    };
  };
  items: Array<{
    product: {
      name: string;
    };
    quantity: number;
  }>;
}

const ProducerDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    growthPercentage: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch producer orders, products, and earnings in parallel
      const [ordersResponse, productsResponse, earningsResponse] = await Promise.all([
        orderService.getProducerOrders(),
        orderService.getProducerProducts(), // Use orderService since we moved the method
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payouts/my-earnings`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }).then(res => res.json()).catch(() => ({ earnings: { total: 0 } }))
      ]);

      console.log('🔧 Orders response:', ordersResponse);
      console.log('🔧 Products response:', productsResponse);
      console.log('🔧 Earnings response:', earningsResponse);

      // Extract data based on your backend response structure
      const orders = ordersResponse?.orders || ordersResponse?.data?.orders || [];
      const products = productsResponse?.products || productsResponse?.data?.products || [];
      const earnings = earningsResponse?.earnings || { total: 0, pending: 0, completed: 0 };

      console.log('🔧 Extracted orders:', orders);
      console.log('🔧 Extracted products:', products);
      console.log('🔧 Extracted earnings:', earnings);

      // Calculate stats
      const pendingOrders = orders.filter(order =>
        ['PENDING', 'CONFIRMED'].includes(order.deliveryStatus)
      ).length;

      // FIXED: Use actual producer earnings from backend
      const totalEarnings = earnings.total || 0;

      const growthPercentage = orders.length > 0 ? 12 : 0;

      setStats({
        totalProducts: products.length,
        pendingOrders,
        totalEarnings,
        growthPercentage,
        // Add additional earnings info for transparency
        pendingEarnings: earnings.pending || 0,
        completedEarnings: earnings.completed || 0
      });

      // Get recent orders (last 5)
      setRecentOrders(orders.slice(0, 5));

    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: t('common.error'),
        description: t('producer.dashboard.errorLoading'),
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

  const statCards = [
    {
      title: t('producer.dashboard.totalProducts'),
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'text-blue-600',
      description: t('producer.dashboard.activeListings')
    },
    {
      title: t('producer.dashboard.pendingOrders'),
      value: stats.pendingOrders.toString(),
      icon: ShoppingCart,
      color: 'text-orange-600',
      description: t('producer.dashboard.awaitingProcessing')
    },
    {
      title: 'Paid Earnings',
      value: formatPrice(stats.totalEarnings),
      icon: DollarSign,
      color: 'text-green-600',
      description: 'Only when admin pays out'
    },
    {
      title: t('producer.dashboard.growth'),
      value: `${stats.growthPercentage}%`,
      icon: TrendingUp,
      color: stats.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600',
      description: t('producer.dashboard.thisMonth')
    },
  ];

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title={t('producer.dashboard.title')} />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>{t('producer.dashboard.loadingDashboard')}</p>
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
            title={t('producer.dashboard.title')}
            description={t('producer.dashboard.subtitle')}
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/producer/orders')}>
                  <Eye className="h-4 w-4 mr-2" />
                  {t('producer.dashboard.viewAllOrders')}
                </Button>
                <Button onClick={() => navigate('/producer/add-product')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('producer.dashboard.addProduct')}
                </Button>
              </div>
            }
          />

          <main className="flex-1 p-6">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {t('producer.dashboard.welcome')}, {user?.name}!
              </h2>
              <p className="text-muted-foreground text-lg">
                {t('producer.dashboard.todayActivity')}
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
                    <CardTitle>{t('producer.dashboard.recentOrders')}</CardTitle>
                    <CardDescription>{t('producer.dashboard.latestCustomerOrders')}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/producer/orders')}>
                    {t('common.viewAll')}
                  </Button>
                </CardHeader>
                <CardContent>
                  {recentOrders.length > 0 ? (
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {order.items[0]?.product.name}
                                {order.items.length > 1 && ` +${order.items.length - 1} ${t('producer.dashboard.moreItems')}`}
                              </span>
                              <Badge variant="outline" className={getStatusColor(order.deliveryStatus)}>
                                {order.deliveryStatus}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {order.buyer.user.name} • {formatDate(order.orderDate)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">{formatPrice(order.totalAmount)}</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              {t('common.view')}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">{t('producer.dashboard.noOrdersYet')}</p>
                      <Button onClick={() => navigate('/marketplace')}>
                        {t('producer.dashboard.promoteProducts')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>{t('producer.dashboard.quickActions')}</CardTitle>
                  <CardDescription>{t('producer.dashboard.manageBusiness')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-20 flex-col"
                      onClick={() => navigate('/my-products')}
                    >
                      <Package className="h-6 w-6 mb-2" />
                      <span>{t('producer.dashboard.manageProducts')}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col"
                      onClick={() => navigate('/producer/orders')}
                    >
                      <ShoppingCart className="h-6 w-6 mb-2" />
                      <span>{t('producer.dashboard.viewOrders')}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col"
                      onClick={() => navigate('/producer/analytics')}
                    >
                      <TrendingUp className="h-6 w-6 mb-2" />
                      <span>{t('producer.dashboard.analytics')}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col"
                      onClick={() => navigate('/producer/transactionhistory')}
                    >
                      <DollarSign className="h-6 w-6 mb-2" />
                      <span>{t('producer.dashboard.transactions')}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col"
                      onClick={() => navigate('/producer/store-settings')}
                    >
                      <CreditCard className="h-6 w-6 mb-2" />
                      <span>{t('producer.dashboard.bankAccounts')}</span>
                    </Button>
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

export default ProducerDashboard;