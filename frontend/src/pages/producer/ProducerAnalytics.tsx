// src/pages/producer/ProducerAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Package, Star, Calendar, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Types for analytics data
interface AnalyticsOverview {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageRating: { average: number; count: number };
  revenueTrend: Array<{ period: string; revenue: number; date: string }>;
  topProducts: Array<{ id: string; name: string; salesCount: number; totalRevenue: number; imageUrl: string }>;
  timeframe: string;
}

interface SalesTrends {
  salesTrend: Array<{ period: string; revenue: number; orders: number; averageOrderValue: number }>;
  orderTrend: Array<{ period: string; orders: number; customers: number; ordersPerCustomer: number }>;
  timeframe: string;
}

interface ProductPerformance {
  id: string;
  name: string;
  category: string;
  price: number;
  totalRevenue: number;
  totalSales: number;
  orderCount: number;
  reviewCount: number;
  averageRating: number;
  stockLevel: number;
  status: string;
}

interface CustomerInsights {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
  regionDistribution: Array<{ region: string; count: number; percentage: number }>;
}

const ProducerAnalytics = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState('monthly');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrends | null>(null);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // FIX: Use 'authToken' instead of 'token'
      const token = localStorage.getItem('authToken');
      console.log('🔐 DEBUG - Token from localStorage:', token);
      console.log('🔐 DEBUG - Token exists:', !!token);
      console.log('🔐 DEBUG - Token length:', token?.length);
      console.log('👤 DEBUG - User from context:', user);
      console.log('👤 DEBUG - User role:', user?.role);
      
      const BACKEND_URL = 'http://localhost:5000';
      
      const [overviewRes, salesRes, productsRes, customersRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/analytics/overview?timeframe=${timeframe}`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }),
        fetch(`${BACKEND_URL}/api/analytics/sales-trends?timeframe=${timeframe}`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }),
        fetch(`${BACKEND_URL}/api/analytics/product-performance?timeframe=${timeframe}`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }),
        fetch(`${BACKEND_URL}/api/analytics/customer-insights?timeframe=${timeframe}`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
      ]);
  
      console.log('📊 Backend responses:', {
        overview: { status: overviewRes.status, ok: overviewRes.ok },
        sales: { status: salesRes.status, ok: salesRes.ok },
        products: { status: productsRes.status, ok: productsRes.ok },
        customers: { status: customersRes.status, ok: customersRes.ok }
      });
  
      // Check response bodies for error messages
      if (!overviewRes.ok) {
        const errorText = await overviewRes.text();
        console.error('❌ Overview error response:', errorText);
      }
      if (!salesRes.ok) {
        const errorText = await salesRes.text();
        console.error('❌ Sales error response:', errorText);
      }
  
      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data.data);
      }
      if (salesRes.ok) {
        const data = await salesRes.json();
        setSalesTrends(data.data);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProductPerformance(data.data);
      }
      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomerInsights(data.data);
      }
  
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
  };

  // Stats cards data
  const stats = overview ? [
    { 
      label: 'Total Revenue', 
      value: `ETB ${overview.totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      change: '+12%' // You can calculate this from trend data
    },
    { 
      label: 'Total Orders', 
      value: overview.totalOrders.toString(), 
      icon: Package, 
      change: '+8%' 
    },
    { 
      label: 'Customers', 
      value: overview.totalCustomers.toString(), 
      icon: Users, 
      change: '+15%' 
    },
    { 
      label: 'Avg Rating', 
      value: `${overview.averageRating.average.toFixed(1)}/5`, 
      icon: Star, 
      change: `from ${overview.averageRating.count} reviews` 
    },
  ] : [];

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-16 border-b border-border flex items-center px-4 bg-background sticky top-0 z-10">
              <SidebarTrigger />
              <h1 className="text-xl font-bold ml-4">Business Analytics</h1>
            </header>
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading analytics data...</p>
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
          <header className="h-16 border-b border-border flex items-center justify-between px-4 bg-background sticky top-0 z-10">
            <div className="flex items-center">
              <SidebarTrigger />
              <h1 className="text-xl font-bold ml-4">Business Analytics</h1>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-32">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
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
          </header>

          <main className="flex-1 p-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-green-600 flex items-center mt-1">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {stat.change}
                        </p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <stat.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Sales Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesTrends?.salesTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`ETB ${value}`, 'Revenue']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Orders Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Orders Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesTrends?.orderTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#82ca9d" name="Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Product Performance */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Product Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Products Pie Chart */}
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={overview?.topProducts?.slice(0, 5) || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, totalRevenue }) => `${name}: ETB ${totalRevenue}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalRevenue"
                      >
                        {(overview?.topProducts?.slice(0, 5) || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`ETB ${value}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Product Performance List */}
                  <div className="space-y-4">
                    {productPerformance.slice(0, 5).map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index] }}
                          />
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">ETB {product.totalRevenue.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.totalSales} sales • {product.averageRating}⭐
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Insights */}
            {customerInsights && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{customerInsights.totalCustomers}</div>
                      <div className="text-sm text-muted-foreground">Total Customers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{customerInsights.repeatCustomers}</div>
                      <div className="text-sm text-muted-foreground">Repeat Customers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{customerInsights.repeatRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Repeat Rate</div>
                    </div>
                  </div>
                  
                  {/* Region Distribution */}
                  {customerInsights.regionDistribution.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-4">Customer Distribution by Region</h4>
                      <div className="space-y-2">
                        {customerInsights.regionDistribution.map((region, index) => (
                          <div key={region.region} className="flex items-center justify-between">
                            <span>{region.region}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${region.percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground w-12">
                                {region.count} ({region.percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ProducerAnalytics;