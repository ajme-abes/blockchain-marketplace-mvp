// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Package, AlertCircle, DollarSign, TrendingUp, 
  ShoppingCart, ShieldCheck, RefreshCw, Eye, ArrowUp, 
  ArrowDown, BarChart3, Activity, Settings, Download,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Types for admin data
interface AdminOverview {
  totalUsers: number;
  verifiedProducers: number;
  activeProducts: number;
  ordersToday: number;
  openDisputes: number;
  pendingPayments: number;
  systemAlerts: number;
  totalRevenue: number;
  userGrowth: number;
  revenueGrowth: number;
  recentActivity: Array<{
    id: string;
    action: string;
    user: string;
    entityId: string;
    timestamp: string;
    type: 'USER_REGISTERED' | 'PRODUCT_APPROVED' | 'DISPUTE_RESOLVED' | 'PAYMENT_VERIFIED' | 'ORDER_CREATED';
  }>;
  systemAlertsList: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    timestamp: string;
  }>;
  charts?: {
    userGrowth: Array<{ month: string; users: number }>;
    orderTrends: Array<{ date: string; orders: number }>;
    monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
  };
  insights?: {
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
  };
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('today');

  // Fetch admin overview data
  // UPDATE THIS FUNCTION IN YOUR AdminDashboard.tsx
  const fetchAdminOverview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      console.log('🔐 Fetching admin data with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`http://localhost:5000/api/admin/overview?range=${timeRange}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
  
      console.log('📊 Response status:', response.status);
      console.log('📊 Response ok:', response.ok);
  
      if (response.ok) {
        const result = await response.json();
        console.log('✅ REAL Admin data received:', result);
        
        if (result.status === 'success') {
          setOverview(result.data);
        } else {
          console.error('❌ Backend error:', result.message);
          // Fallback to mock data only if backend fails
          setOverview(getFallbackData());
        }
      } else {
        // Handle different error cases
        if (response.status === 403) {
          console.error('❌ Access denied - Check admin permissions');
        } else if (response.status === 401) {
          console.error('❌ Unauthorized - Token may be invalid');
        } else {
          console.error('❌ Server error:', response.status);
        }
        setOverview(getFallbackData());
      }
    } catch (error) {
      console.error('🚨 Network error fetching admin data:', error);
      setOverview(getFallbackData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fallback data function (only used when backend fails)
  const getFallbackData = () => {
    console.warn('⚠️ Using fallback data - Backend connection failed');
    return {
      totalUsers: 0,
      verifiedProducers: 0,
      activeProducts: 0,
      ordersToday: 0,
      openDisputes: 0,
      pendingPayments: 0,
      systemAlerts: 1,
      totalRevenue: 0,
      userGrowth: 0,
      revenueGrowth: 0,
      recentActivity: [
        { 
          id: 'fallback-1', 
          action: 'Backend Connection Required', 
          user: 'System', 
          entityId: 'connection', 
          timestamp: new Date().toISOString(), 
          type: 'USER_REGISTERED' 
        }
      ],
      systemAlertsList: [
        { 
          id: 'connection-alert', 
          title: 'Backend Connection Required', 
          description: 'Connect to backend to see real data', 
          severity: 'HIGH', 
          timestamp: new Date().toISOString() 
        }
      ]
    };
  };

  useEffect(() => {
    fetchAdminOverview();
  }, [timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdminOverview();
  };

  const handleExportData = () => {
    // Implement data export functionality
    console.log('Exporting admin data...');
    // This would typically generate a CSV or PDF report
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'users':
        navigate('/admin/users');
        break;
      case 'products':
        navigate('/admin/products');
        break;
      case 'disputes':
        navigate('/admin/disputes');
        break;
      case 'analytics':
        navigate('/admin/analytics');
        break;
      default:
        break;
    }
  };

  // KPI data from real backend or fallback to mock
  const kpis = overview ? [
    { 
      title: 'Total Users', 
      value: overview.totalUsers.toLocaleString(), 
      change: `${overview.userGrowth > 0 ? '+' : ''}${overview.userGrowth}%`, 
      icon: Users, 
      color: 'text-blue-600',
      trend: overview.userGrowth > 0 ? 'up' : 'down',
      description: 'Registered platform users'
    },
    { 
      title: 'Verified Producers', 
      value: overview.verifiedProducers.toString(), 
      change: '+5%', 
      icon: ShieldCheck, 
      color: 'text-green-600',
      trend: 'up',
      description: 'Approved business accounts'
    },
    { 
      title: 'Active Listings', 
      value: overview.activeProducts.toLocaleString(), 
      change: '+18%', 
      icon: Package, 
      color: 'text-purple-600',
      trend: 'up',
      description: 'Products available for sale'
    },
    { 
      title: 'Orders Today', 
      value: overview.ordersToday.toString(), 
      change: '+23%', 
      icon: ShoppingCart, 
      color: 'text-orange-600',
      trend: 'up',
      description: 'Transactions in last 24h'
    },
    { 
      title: 'Open Disputes', 
      value: overview.openDisputes.toString(), 
      change: '-2', 
      icon: AlertCircle, 
      color: 'text-red-600',
      trend: 'down',
      description: 'Requiring resolution'
    },
    { 
      title: 'Pending Payments', 
      value: overview.pendingPayments.toString(), 
      change: '+4', 
      icon: DollarSign, 
      color: 'text-yellow-600',
      trend: 'up',
      description: 'Awaiting confirmation'
    },
    { 
      title: 'System Alerts', 
      value: overview.systemAlerts.toString(), 
      change: '0', 
      icon: AlertCircle, 
      color: overview.systemAlerts > 0 ? 'text-red-600' : 'text-gray-600',
      trend: 'neutral',
      description: 'Active system notifications'
    },
    { 
      title: 'Transaction Volume', 
      value: `ETB ${(overview.totalRevenue / 1000000).toFixed(1)}M`, 
      change: `${overview.revenueGrowth > 0 ? '+' : ''}${overview.revenueGrowth}%`, 
      icon: TrendingUp, 
      color: 'text-emerald-600',
      trend: overview.revenueGrowth > 0 ? 'up' : 'down',
      description: 'Total marketplace transactions'
    },
  ] : [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 border-red-500/30 text-red-700';
      case 'HIGH': return 'bg-orange-500/20 border-orange-500/30 text-orange-700';
      case 'MEDIUM': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-700';
      case 'LOW': return 'bg-blue-500/20 border-blue-500/30 text-blue-700';
      default: return 'bg-gray-500/20 border-gray-500/30 text-gray-700';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'USER_REGISTERED': return <Users className="h-4 w-4 text-blue-600" />;
      case 'PRODUCT_APPROVED': return <Package className="h-4 w-4 text-purple-600" />;
      case 'DISPUTE_RESOLVED': return <ShieldCheck className="h-4 w-4 text-green-600" />;
      case 'PAYMENT_VERIFIED': return <DollarSign className="h-4 w-4 text-emerald-600" />;
      case 'ORDER_CREATED': return <ShoppingCart className="h-4 w-4 text-orange-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="Admin Dashboard" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading admin dashboard...</p>
                <p className="text-sm text-muted-foreground mt-2">Fetching real-time platform data</p>
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
            title="Admin Dashboard" 
            action={
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            }
          />

          <main className="flex-1 p-6">
            {/* Header with Time Range Selector */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">Welcome, {user?.name || 'Administrator'} 👋</h2>
                <p className="text-muted-foreground max-w-2xl">
                  {overview ? 
                    `Managing ${overview.totalUsers.toLocaleString()} users, ${overview.activeProducts.toLocaleString()} products, and ${formatCurrency(overview.totalRevenue)} in transaction volume` :
                    'Comprehensive overview of the EthioTrust marketplace platform'
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                {['today', 'week', 'month', 'quarter'].map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className="capitalize text-xs"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {range}
                  </Button>
                ))}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activity
                </TabsTrigger>
                <TabsTrigger value="alerts" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Alerts
                  {overview?.systemAlertsList && overview.systemAlertsList.length > 0 && (
                    <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                      {overview.systemAlertsList.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Insights
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {kpis.map((kpi, index) => (
                    <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-current">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {kpi.title}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                          {kpi.trend === 'up' && <ArrowUp className="h-3 w-3 text-green-600" />}
                          {kpi.trend === 'down' && <ArrowDown className="h-3 w-3 text-red-600" />}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{kpi.value}</div>
                        <p className={`text-xs mt-1 ${
                          kpi.trend === 'up' ? 'text-green-600' : 
                          kpi.trend === 'down' ? 'text-red-600' : 
                          'text-muted-foreground'
                        }`}>
                          {kpi.change} from last period
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">{kpi.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Quick Actions & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Quick Actions */}
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          variant="outline" 
                          className="h-20 flex-col gap-2 hover:bg-blue-50 hover:border-blue-200"
                          onClick={() => handleQuickAction('users')}
                        >
                          <Users className="h-6 w-6 text-blue-600" />
                          <span className="text-sm font-medium">Manage Users</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-20 flex-col gap-2 hover:bg-purple-50 hover:border-purple-200"
                          onClick={() => handleQuickAction('products')}
                        >
                          <Package className="h-6 w-6 text-purple-600" />
                          <span className="text-sm font-medium">Products</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-20 flex-col gap-2 hover:bg-red-50 hover:border-red-200"
                          onClick={() => handleQuickAction('disputes')}
                        >
                          <AlertCircle className="h-6 w-6 text-red-600" />
                          <span className="text-sm font-medium">Disputes</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-20 flex-col gap-2 hover:bg-green-50 hover:border-green-200"
                          onClick={() => handleQuickAction('analytics')}
                        >
                          <TrendingUp className="h-6 w-6 text-green-600" />
                          <span className="text-sm font-medium">Analytics</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Recent Activity</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        Live Updates
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {overview?.recentActivity?.map((activity) => (
                          <div 
                            key={activity.id} 
                            className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex-shrink-0 mt-1">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm group-hover:text-primary transition-colors">
                                {activity.action}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">{activity.user}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(activity.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center py-8 text-muted-foreground">
                            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">No recent activity</p>
                            <p className="text-sm">Platform activity will appear here</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>System Alerts & Notifications</CardTitle>
                    {overview?.systemAlertsList && overview.systemAlertsList.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {overview.systemAlertsList.length} Active Alerts
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {overview?.systemAlertsList?.map((alert) => (
                        <div 
                          key={alert.id} 
                          className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${getSeverityColor(alert.severity)}`}
                        >
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-6 w-6 mt-0.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-semibold text-base">{alert.title}</p>
                              <Badge 
                                variant="outline" 
                                className={`text-xs capitalize ${
                                  alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                  alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                  alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {alert.severity.toLowerCase()}
                              </Badge>
                            </div>
                            <p className="text-sm opacity-90 mb-2">{alert.description}</p>
                            <div className="flex items-center justify-between text-xs opacity-70">
                              <span>Alert ID: {alert.id}</span>
                              <span>{new Date(alert.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="flex-shrink-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      )) || (
                        <div className="text-center py-12 text-muted-foreground">
                          <ShieldCheck className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium text-foreground">All Systems Operational</p>
                          <p className="text-sm">No active alerts or issues detected</p>
                          <p className="text-xs mt-2">Last checked: {new Date().toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Platform Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <div>
              <span className="font-medium">Revenue Growth</span>
              <p className="text-sm text-muted-foreground">This month vs last month</p>
            </div>
            <Badge variant={overview?.insights?.revenueGrowth >= 0 ? "default" : "destructive"}>
              {overview?.insights?.revenueGrowth >= 0 ? '+' : ''}{overview?.insights?.revenueGrowth || 0}%
            </Badge>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <div>
              <span className="font-medium">Order Growth</span>
              <p className="text-sm text-muted-foreground">This month vs last month</p>
            </div>
            <Badge variant={overview?.insights?.orderGrowth >= 0 ? "default" : "destructive"}>
              {overview?.insights?.orderGrowth >= 0 ? '+' : ''}{overview?.insights?.orderGrowth || 0}%
            </Badge>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
            <div>
              <span className="font-medium">Average Order Value</span>
              <p className="text-sm text-muted-foreground">Current month average</p>
            </div>
            <Badge variant="default">
              {overview?.insights ? formatCurrency(overview.insights.averageOrderValue) : 'ETB 0'}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
            <div>
              <span className="font-medium">Payment Success Rate</span>
              <p className="text-sm text-muted-foreground">Successful transactions</p>
            </div>
            <Badge variant="default">
              {overview?.insights?.paymentSuccessRate || 0}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>User & Product Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
            <div>
              <span className="font-medium">New Users This Month</span>
              <p className="text-sm text-muted-foreground">Current month registrations</p>
            </div>
            <Badge variant="default">
              {overview?.insights?.newUsersThisMonth || 0}
            </Badge>
          </div>
          
          {/* Top Products */}
          <div>
            <h4 className="font-medium mb-3">Top Performing Products</h4>
            <div className="space-y-2">
              {overview?.insights?.topProducts?.slice(0, 3).map((product, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span className="text-sm truncate flex-1 mr-2">{product.name}</span>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline">{product.orders} orders</Badge>
                    <Badge variant="secondary">{formatCurrency(product.revenue)}</Badge>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No product data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</TabsContent>
            </Tabs>

            {/* Platform Summary Footer */}
            <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">EthioTrust Platform Summary</h3>
                    <p className="text-muted-foreground text-sm">
                      Real-time monitoring of marketplace health and performance metrics
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-2xl text-blue-600">{overview?.totalUsers || 0}</div>
                      <div className="text-muted-foreground">Total Users</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-2xl text-green-600">{overview?.ordersToday || 0}</div>
                      <div className="text-muted-foreground">Today's Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-2xl text-purple-600">
                        {overview ? formatCurrency(overview.totalRevenue) : 'ETB 0'}
                      </div>
                      <div className="text-muted-foreground">Total Revenue</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;