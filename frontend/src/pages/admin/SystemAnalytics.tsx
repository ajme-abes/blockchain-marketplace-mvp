// src/pages/admin/SystemAnalytics.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Store,
  CreditCard,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types for analytics data
interface RevenueData {
  period: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

interface PaymentMethodData {
  method: string;
  count: number;
}

interface RevenueAnalytics {
  timeline: RevenueData[];
  paymentMethods: PaymentMethodData[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
}

interface PlatformInsights {
  revenueGrowth: number;
  orderGrowth: number;
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  newUsersThisMonth: number;
  paymentSuccessRate: number;
}

interface AnalyticsResponse {
  data: RevenueAnalytics;
}

const SystemAnalytics = () => {
  const navigate = useNavigate();
  const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
  const [platformInsights, setPlatformInsights] = useState<PlatformInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('monthly');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { toast } = useToast();

  // Fetch revenue analytics
  const fetchRevenueAnalytics = async (period: string = 'monthly') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:5000/api/admin/analytics/revenue?period=${period}&months=12`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setRevenueData(result.data);
        }
      } else {
        console.error('Failed to fetch revenue analytics');
        toast({
          title: 'Error',
          description: 'Failed to load revenue analytics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load revenue analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch platform insights from dashboard stats
  const fetchPlatformInsights = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Dashboard Stats Response:', result); // Debug log

        if (result.status === 'success') {
          // Get new users count
          const newUsersCount = await getNewUsersThisMonth();
          const paymentSuccess = await calculatePaymentSuccessRate();

          console.log('👥 New Users This Month:', newUsersCount);
          console.log('💳 Payment Success Rate:', paymentSuccess);

          // Extract insights from dashboard data with proper fallbacks
          const insights: PlatformInsights = {
            revenueGrowth: result.data?.insights?.revenueGrowth ||
              result.data?.charts?.revenueGrowth?.[0]?.growth || 0,
            orderGrowth: result.data?.insights?.orderGrowth ||
              result.data?.charts?.orderTrends?.[0]?.growth || 0,
            averageOrderValue: result.data?.overview?.averageOrderValue || 0,
            topProducts: result.data?.popularProducts?.map((product: any) => ({
              name: product.name,
              orders: product.orderCount || 0,
              revenue: (product.price || 0) * (product.orderCount || 0)
            })) || [],
            newUsersThisMonth: newUsersCount,
            paymentSuccessRate: paymentSuccess
          };

          console.log('✅ Platform Insights Set:', insights);
          setPlatformInsights(insights);
        }
      }
    } catch (error) {
      console.error('Error fetching platform insights:', error);
    }
  };

  // Add these helper functions for fallback data
  const getNewUsersThisMonth = async (): Promise<number> => {
    try {
      const token = localStorage.getItem('authToken');

      // Get all users and filter by registration date
      const response = await fetch('http://localhost:5000/api/admin/users?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();

        if (result.status === 'success' && result.data?.users) {
          // Calculate users registered this month
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

          const newUsers = result.data.users.filter((user: any) => {
            const regDate = new Date(user.registrationDate);
            return regDate >= startOfMonth;
          });

          console.log('📅 New users this month:', newUsers.length);
          return newUsers.length;
        }
      }
    } catch (error) {
      console.error('Error fetching new users:', error);
    }
    return 0;
  };

  const calculatePaymentSuccessRate = async (): Promise<number> => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/admin/orders/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          const total = result.data.overview.totalOrders;
          const successful = result.data.overview.deliveredOrders;
          return total > 0 ? (successful / total) * 100 : 0;
        }
      }
    } catch (error) {
      console.error('Error calculating payment success rate:', error);
    }
    return 0;
  };

  const calculateHealthScore = (insights: PlatformInsights): number => {
    let score = 0;

    // Payment success rate (max 40 points)
    score += Math.min((insights.paymentSuccessRate / 100) * 40, 40);

    // Revenue growth (max 20 points)
    if (insights.revenueGrowth > 0) {
      score += Math.min(insights.revenueGrowth * 2, 20);
    }

    // Order growth (max 20 points)
    if (insights.orderGrowth > 0) {
      score += Math.min(insights.orderGrowth * 2, 20);
    }

    // New users (max 10 points)
    score += Math.min(insights.newUsersThisMonth / 10, 10);

    // Average order value health (max 10 points)
    if (insights.averageOrderValue > 500) { // Assuming 500 ETB is healthy
      score += 10;
    } else if (insights.averageOrderValue > 200) {
      score += 5;
    }

    return Math.round(score);
  };

  useEffect(() => {
    fetchRevenueAnalytics(timeRange);
    fetchPlatformInsights();
  }, [timeRange]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Get growth badge
  const getGrowthBadge = (value: number) => {
    if (value > 0) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
          <ArrowUp className="h-3 w-3 mr-1" />
          {formatPercentage(value)}
        </Badge>
      );
    } else if (value < 0) {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
          <ArrowDown className="h-3 w-3 mr-1" />
          {formatPercentage(value)}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-500/10 text-gray-700 border-gray-500/20">
        {formatPercentage(value)}
      </Badge>
    );
  };

  // Calculate chart data for revenue trends
  const getChartData = () => {
    if (!revenueData) return [];

    return revenueData.timeline.map(item => ({
      period: item.period,
      revenue: item.revenue,
      orders: item.orders,
      aov: item.averageOrderValue
    }));
  };

  // Export functions
  const exportToPDF = () => {
    toast({
      title: 'Export Started',
      description: 'Generating PDF report...',
    });

    // Create a simple text-based report
    const reportData = {
      title: 'System Analytics Report',
      date: new Date().toLocaleDateString(),
      timeRange: timeRange,
      metrics: {
        totalRevenue: revenueData?.summary.totalRevenue || 0,
        totalOrders: revenueData?.summary.totalOrders || 0,
        averageOrderValue: revenueData?.summary.averageOrderValue || 0,
        paymentSuccessRate: platformInsights?.paymentSuccessRate || 0,
        newUsersThisMonth: platformInsights?.newUsersThisMonth || 0,
      }
    };

    // For now, download as JSON (you can integrate a PDF library like jsPDF later)
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Report downloaded successfully',
    });
  };

  const exportToExcel = () => {
    toast({
      title: 'Export Started',
      description: 'Generating Excel report...',
    });

    if (!revenueData) {
      toast({
        title: 'No Data',
        description: 'No data available to export',
        variant: 'destructive',
      });
      return;
    }

    // Create CSV format
    let csv = 'Period,Revenue,Orders,Average Order Value\n';
    revenueData.timeline.forEach(item => {
      csv += `${item.period},${item.revenue},${item.orders},${item.averageOrderValue}\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Data exported to CSV successfully',
    });
  };

  // Simple bar chart component (you can replace with a proper chart library)
  const SimpleBarChart = ({ data, height = 200 }: { data: any[], height?: number }) => {
    if (!data.length) return <div className="flex items-center justify-center h-48 text-muted-foreground">No data available</div>;

    const maxValue = Math.max(...data.map(item => item.revenue));

    return (
      <div className="flex items-end justify-between gap-2 h-48 pt-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-pointer"
              style={{
                height: `${(item.revenue / maxValue) * 150}px`,
                minHeight: '4px'
              }}
              title={`${item.period}: ${formatCurrency(item.revenue)}`}
            />
            <div className="text-xs text-muted-foreground mt-2 text-center">
              {item.period.split(' ')[0]}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader
            title="System Analytics"
            description="Comprehensive analytics and insights for your marketplace"
            action={
              <div className="flex gap-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[140px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    fetchRevenueAnalytics(timeRange);
                    fetchPlatformInsights();
                  }}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" onClick={exportToPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            }
          />

          <main className="flex-1 p-6">
            <div className="space-y-6">
              {/* Key Metrics Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">
                          {revenueData ? formatCurrency(revenueData.summary.totalRevenue) : '0 ETB'}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                      </div>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    {platformInsights && (
                      <div className="mt-2">
                        {getGrowthBadge(platformInsights.revenueGrowth)}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">
                          {revenueData ? revenueData.summary.totalOrders.toLocaleString() : '0'}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Orders</div>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ShoppingCart className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    {platformInsights && (
                      <div className="mt-2">
                        {getGrowthBadge(platformInsights.orderGrowth)}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">
                          {revenueData ? formatCurrency(revenueData.summary.averageOrderValue) : '0 ETB'}
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Order Value</div>
                      </div>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">
                          {platformInsights ? `${platformInsights.paymentSuccessRate.toFixed(1)}%` : '0%'}
                        </div>
                        <div className="text-sm text-muted-foreground">Payment Success</div>
                      </div>
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <CreditCard className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Analytics Content */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="revenue">Revenue</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Trend Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Revenue Trend
                        </CardTitle>
                        <CardDescription>
                          Revenue performance over time
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="flex justify-center items-center h-48">
                            <RefreshCw className="h-8 w-8 animate-spin" />
                          </div>
                        ) : (
                          <SimpleBarChart data={getChartData()} />
                        )}
                      </CardContent>
                    </Card>

                    {/* Payment Methods */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Payment Methods
                        </CardTitle>
                        <CardDescription>
                          Distribution of payment methods
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="flex justify-center items-center h-48">
                            <RefreshCw className="h-8 w-8 animate-spin" />
                          </div>
                        ) : revenueData && revenueData.paymentMethods.length > 0 ? (
                          <div className="space-y-4">
                            {revenueData.paymentMethods.map((method, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                  <span className="font-medium capitalize">{method.method.toLowerCase()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {method.count} transactions
                                  </span>
                                  <Badge variant="outline">
                                    {((method.count / revenueData.paymentMethods.reduce((sum, m) => sum + m.count, 0)) * 100).toFixed(1)}%
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-48 text-muted-foreground">
                            No payment data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Platform Insights */}
                  {platformInsights && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-blue-600" />
                            <div>
                              <div className="text-2xl font-bold">{platformInsights.newUsersThisMonth}</div>
                              <div className="text-sm text-muted-foreground">New Users This Month</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Store className="h-8 w-8 text-green-600" />
                            <div>
                              <div className="text-2xl font-bold">
                                {platformInsights.topProducts.length}
                              </div>
                              <div className="text-sm text-muted-foreground">Top Products Tracked</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Package className="h-8 w-8 text-purple-600" />
                            <div>
                              <div className="text-2xl font-bold">
                                {platformInsights.topProducts.reduce((sum, product) => sum + product.orders, 0)}
                              </div>
                              <div className="text-sm text-muted-foreground">Total Product Orders</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <BarChart3 className="h-8 w-8 text-orange-600" />
                            <div>
                              <div className="text-2xl font-bold">
                                {platformInsights.paymentSuccessRate.toFixed(1)}%
                              </div>
                              <div className="text-sm text-muted-foreground">Success Rate</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                {/* Revenue Tab */}
                <TabsContent value="revenue" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle>Detailed Revenue Analysis</CardTitle>
                        <CardDescription>
                          Monthly breakdown of revenue and orders
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="flex justify-center items-center h-48">
                            <RefreshCw className="h-8 w-8 animate-spin" />
                          </div>
                        ) : revenueData ? (
                          <div className="space-y-4">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2">Period</th>
                                    <th className="text-right py-2">Revenue</th>
                                    <th className="text-right py-2">Orders</th>
                                    <th className="text-right py-2">Avg. Order</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {revenueData.timeline.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-muted/50">
                                      <td className="py-2">{item.period}</td>
                                      <td className="text-right py-2 font-medium">
                                        {formatCurrency(item.revenue)}
                                      </td>
                                      <td className="text-right py-2">{item.orders}</td>
                                      <td className="text-right py-2">
                                        {formatCurrency(item.averageOrderValue)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-48 text-muted-foreground">
                            No revenue data available
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {revenueData ? (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Total Revenue:</span>
                              <span className="font-bold">{formatCurrency(revenueData.summary.totalRevenue)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Total Orders:</span>
                              <span className="font-bold">{revenueData.summary.totalOrders.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Avg Order Value:</span>
                              <span className="font-bold">{formatCurrency(revenueData.summary.averageOrderValue)}</span>
                            </div>
                            <div className="pt-4 border-t">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate('/admin/orders')}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View All Orders
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-32 text-muted-foreground">
                            No summary data
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Products Tab */}
                <TabsContent value="products">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Products</CardTitle>
                      <CardDescription>
                        Best-selling products by revenue and orders
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex justify-center items-center h-48">
                          <RefreshCw className="h-8 w-8 animate-spin" />
                        </div>
                      ) : platformInsights && platformInsights.topProducts.length > 0 ? (
                        <div className="space-y-4">
                          {platformInsights.topProducts.map((product, index) => (
                            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Package className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {product.orders} orders
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{formatCurrency(product.revenue)}</div>
                                <div className="text-sm text-muted-foreground">
                                  {product.orders} sold
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-48 text-muted-foreground">
                          No product data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Platform Performance Metrics</CardTitle>
                        <CardDescription>
                          Real-time performance indicators and system health
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Payment Success Rate */}
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-green-600" />
                              <span>Payment Success Rate</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={platformInsights?.paymentSuccessRate && platformInsights.paymentSuccessRate > 90 ? "default" : "secondary"}>
                                {platformInsights ? `${platformInsights.paymentSuccessRate.toFixed(1)}%` : '0%'}
                              </Badge>
                              {platformInsights?.paymentSuccessRate && platformInsights.paymentSuccessRate > 90 ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                              )}
                            </div>
                          </div>

                          {/* Revenue Growth */}
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-blue-600" />
                              <span>Revenue Growth</span>
                            </div>
                            {platformInsights && getGrowthBadge(platformInsights.revenueGrowth)}
                          </div>

                          {/* Order Growth */}
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4 text-purple-600" />
                              <span>Order Growth</span>
                            </div>
                            {platformInsights && getGrowthBadge(platformInsights.orderGrowth)}
                          </div>

                          {/* New User Acquisition */}
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-orange-600" />
                              <span>New User Acquisition</span>
                            </div>
                            <Badge variant="outline">
                              {platformInsights ? platformInsights.newUsersThisMonth : 0} this month
                            </Badge>
                          </div>

                          {/* Average Order Value */}
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-emerald-600" />
                              <span>Average Order Value</span>
                            </div>
                            <span className="font-medium">
                              {platformInsights ? formatCurrency(platformInsights.averageOrderValue) : '0 ETB'}
                            </span>
                          </div>

                          {/* Platform Health Score */}
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">Platform Health Score</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="bg-blue-600">
                                {platformInsights ? calculateHealthScore(platformInsights) : 0}/100
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Performance Insights</CardTitle>
                        <CardDescription>
                          Analysis and recommendations based on current metrics
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Performance Summary */}
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-semibold mb-2">Performance Summary</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {platformInsights && platformInsights.paymentSuccessRate > 95 && (
                                <p>✅ Payment processing is excellent</p>
                              )}
                              {platformInsights && platformInsights.paymentSuccessRate < 80 && (
                                <p>⚠️ Payment success rate needs improvement</p>
                              )}
                              {platformInsights && platformInsights.revenueGrowth > 0 && (
                                <p>📈 Revenue is growing positively</p>
                              )}
                              {platformInsights && platformInsights.newUsersThisMonth > 50 && (
                                <p>👥 Strong user acquisition this month</p>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="space-y-3">
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => navigate('/admin/orders')}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Manage Orders
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => navigate('/admin/products')}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Manage Products
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => navigate('/admin/users')}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Manage Users
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => navigate('/admin/monitor')}
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              System Monitor
                            </Button>
                          </div>

                          {/* Export Options */}
                          <div className="pt-4 border-t">
                            <h4 className="font-semibold mb-3">Export Reports</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" size="sm" onClick={exportToPDF}>
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                              </Button>
                              <Button variant="outline" size="sm" onClick={exportToExcel}>
                                <Download className="h-4 w-4 mr-2" />
                                Excel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SystemAnalytics;