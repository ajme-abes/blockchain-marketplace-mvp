import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  ShoppingCart, 
  Eye, 
  Download, 
  RefreshCw, 
  MoreVertical,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  DollarSign,
  Calendar,
  User,
  Store,
  BarChart3,
  ArrowUpDown,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types for order data
interface Order {
  id: string;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  deliveryStatus: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  orderDate: string;
  shippingAddress: any;
  blockchainTxHash?: string;
  buyer: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
  };
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      price: number;
      producer: {
        id: string;
        businessName: string;
        user: {
          id: string;
          name: string;
          email: string;
        };
      };
    };
    quantity: number;
    subtotal: number;
  }>;
  itemCount: number;
  latestStatus?: {
    status: string;
    timestamp: string;
    changedBy: {
      name: string;
      email: string;
    };
  };
  paymentConfirmation?: {
    method: string;
    confirmedAt: string;
    isConfirmed: boolean;
  };
  updatedAt: string;
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface OrderStats {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    confirmedOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    recentOrders: number;
    successRate: number;
  };
  statusDistribution: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    orderCount: number;
    producer: string;
  }>;
  topProducers: Array<{
    id: string;
    businessName: string;
    user: {
      name: string;
      email: string;
    };
    totalSales: number;
    productCount: number;
  }>;
  period: {
    type: string;
    startDate: string;
    endDate: string;
  };
}

const OrderManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'cancel' | 'mark_shipped' | 'mark_delivered' | null>(null);
  const [selectedBulkAction, setSelectedBulkAction] = useState<string>('');
  const [actionReason, setActionReason] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const { toast } = useToast();

  // Fetch orders from backend
  const fetchOrders = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
  
      if (search) {
        params.append('search', search);
      }
      if (paymentStatusFilter !== 'all') {
        params.append('paymentStatus', paymentStatusFilter);
      }
      if (deliveryStatusFilter !== 'all') {
        params.append('deliveryStatus', deliveryStatusFilter);
      }
      if (dateRangeFilter !== 'all') {
        const now = new Date();
        let dateFrom = new Date();
        
        switch (dateRangeFilter) {
          case 'today':
            dateFrom.setHours(0, 0, 0, 0);
            break;
          case 'week':
            dateFrom.setDate(now.getDate() - 7);
            break;
          case 'month':
            dateFrom.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            dateFrom.setMonth(now.getMonth() - 3);
            break;
        }
        
        params.append('dateFrom', dateFrom.toISOString());
        params.append('dateTo', now.toISOString());
      }
  
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/orders?${params}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
  
      if (response.ok) {
        const result = await response.json();
        
        console.log('📦 Orders API Response:', result); // Debug log
        
        if (result.status === 'success') {
          // Ensure orders have proper items array
          const safeOrders = (result.data.orders || []).map((order: any) => ({
            ...order,
            items: order.items || [],
            itemCount: order.itemCount || (order.items ? order.items.length : 0)
          }));
          
          setOrders(safeOrders);
          setPagination(result.data.pagination || {
            page: 1,
            limit: 20,
            total: safeOrders.length,
            pages: 1
          });
        } else {
          console.error('API returned error:', result.message);
          toast({
            title: 'Error',
            description: result.message || 'Failed to load orders',
            variant: 'destructive',
          });
        }
      } else {
        console.error('Failed to fetch orders, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        toast({
          title: 'Error',
          description: 'Failed to load orders from server',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch order statistics
  const fetchOrderStats = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/orders/stats?period=monthly', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setStats(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, [paymentStatusFilter, deliveryStatusFilter, dateRangeFilter]);

  // Handle order actions
  const handleOrderAction = async (action: string, orderId: string, reason?: string) => {
    try {
      const token = localStorage.getItem('authToken');
      
      let endpoint = 'status';
      let method = 'PATCH';
      let body: any = {};

      switch (action) {
        case 'cancel':
          endpoint = 'cancel';
          method = 'POST';
          body = { reason: reason || 'Administrative cancellation' };
          break;
        case 'mark_shipped':
          body = { status: 'SHIPPED', reason };
          break;
        case 'mark_delivered':
          body = { status: 'DELIVERED', reason };
          break;
      }

      const url = action === 'cancel' 
        ? `http://localhost:5000/api/admin/orders/${orderId}/${endpoint}`
        : `http://localhost:5000/api/admin/orders/${orderId}/${endpoint}`;

      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: Object.keys(body).length ? JSON.stringify(body) : undefined
      });

      if (response.ok) {
        const actionText = action === 'cancel' ? 'cancelled' : 
                          action === 'mark_shipped' ? 'marked as shipped' :
                          action === 'mark_delivered' ? 'marked as delivered' : 'updated';
        
        toast({
          title: `Order ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
          description: `Order has been ${actionText} successfully.`,
        });
        
        fetchOrders(pagination.page, searchQuery);
        fetchOrderStats();
        setActionDialogOpen(false);
        setOrderDetailOpen(false);
        setSelectedOrders([]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error: any) {
      console.error('Order action error:', error);
      toast({
        title: 'Action Failed',
        description: error.message || 'Failed to perform action',
        variant: 'destructive',
      });
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string, reason?: string) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/orders/bulk-actions', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          orderIds: selectedOrders,
          action,
          reason
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: 'Bulk Action Completed',
          description: result.message || `Bulk action completed successfully`,
        });
        
        fetchOrders(pagination.page, searchQuery);
        fetchOrderStats();
        setBulkActionDialogOpen(false);
        setSelectedOrders([]);
        setSelectedBulkAction('');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast({
        title: 'Bulk Action Failed',
        description: error.message || 'Failed to perform bulk action',
        variant: 'destructive',
      });
    }
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    fetchOrders(1, value);
  };

  // Toggle order selection
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Select all orders on current page
  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.id));
    }
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      CONFIRMED: { variant: 'default' as const, className: 'bg-green-500', label: 'Paid', icon: CheckCircle },
      PENDING: { variant: 'outline' as const, className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', label: 'Pending', icon: Clock },
      FAILED: { variant: 'destructive' as const, className: 'bg-red-500', label: 'Failed', icon: XCircle },
      REFUNDED: { variant: 'outline' as const, className: 'bg-blue-500/10 text-blue-700 border-blue-500/20', label: 'Refunded', icon: DollarSign }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Get delivery status badge
  const getDeliveryStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: 'outline' as const, className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', label: 'Pending', icon: Clock },
      CONFIRMED: { variant: 'outline' as const, className: 'bg-blue-500/10 text-blue-700 border-blue-500/20', label: 'Confirmed', icon: CheckCircle },
      SHIPPED: { variant: 'outline' as const, className: 'bg-purple-500/10 text-purple-700 border-purple-500/20', label: 'Shipped', icon: Truck },
      DELIVERED: { variant: 'default' as const, className: 'bg-green-500', label: 'Delivered', icon: Package },
      CANCELLED: { variant: 'destructive' as const, className: 'bg-red-500', label: 'Cancelled', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get orders that need attention
  const getAttentionOrders = () => {
    return orders.filter(order => 
      order.paymentStatus === 'PENDING' || 
      (order.deliveryStatus === 'CONFIRMED' && 
       new Date(order.orderDate) < new Date(Date.now() - 48 * 60 * 60 * 1000))
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader 
            title="Order Management"
            description="Manage all orders, track deliveries, and handle order operations"
            action={
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    fetchOrders(1, searchQuery);
                    fetchOrderStats();
                  }}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/admin/analytics/revenue')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Revenue Analytics
                </Button>
              </div>
            }
          />

          <main className="flex-1 p-6">
            <div className="space-y-6">
              {/* Statistics Cards */}
              {!statsLoading && stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <ShoppingCart className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.overview.totalOrders}</div>
                          <div className="text-sm text-muted-foreground">Total Orders</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{formatCurrency(stats.overview.totalRevenue)}</div>
                          <div className="text-sm text-muted-foreground">Revenue</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.overview.pendingOrders}</div>
                          <div className="text-sm text-muted-foreground">Pending</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.overview.confirmedOrders}</div>
                          <div className="text-sm text-muted-foreground">Confirmed</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Truck className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.overview.shippedOrders}</div>
                          <div className="text-sm text-muted-foreground">Shipped</div>
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
                          <div className="text-2xl font-bold">{stats.overview.deliveredOrders}</div>
                          <div className="text-sm text-muted-foreground">Delivered</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.overview.cancelledOrders}</div>
                          <div className="text-sm text-muted-foreground">Cancelled</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.overview.successRate.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">Success Rate</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Attention Required Alert */}
              {getAttentionOrders().length > 0 && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <div className="font-medium text-yellow-800">Attention Required</div>
                        <div className="text-sm text-yellow-700">
                          {getAttentionOrders().length} order{getAttentionOrders().length !== 1 ? 's' : ''} need attention
                          {getAttentionOrders().some(o => o.paymentStatus === 'PENDING') && ' • Pending payments'}
                          {getAttentionOrders().some(o => o.deliveryStatus === 'CONFIRMED') && ' • Delayed shipments'}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/admin/orders/attention-required')}
                        className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bulk Actions Bar */}
              {selectedOrders.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="default" className="bg-blue-600">
                          {selectedOrders.length} selected
                        </Badge>
                        <span className="text-sm text-blue-700">
                          {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected for bulk action
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Bulk Actions
                              <MoreVertical className="h-4 w-4 ml-2" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedBulkAction('mark_shipped');
                                setBulkActionDialogOpen(true);
                              }}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Mark as Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedBulkAction('mark_delivered');
                                setBulkActionDialogOpen(true);
                              }}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Mark as Delivered
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedBulkAction('cancel');
                                setBulkActionDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Orders
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedOrders([])}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Filters and Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search orders by ID, customer name, email, or product..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
  {/* Payment Filter */}
  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
    <SelectTrigger className="w-[140px]">
      <Filter className="h-4 w-4 mr-2" />
      <SelectValue placeholder="Payment" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Payments</SelectItem>
      <SelectItem value="PENDING">Pending</SelectItem>
      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
      <SelectItem value="FAILED">Failed</SelectItem>
      <SelectItem value="REFUNDED">Refunded</SelectItem>
    </SelectContent>
  </Select>

  {/* Delivery Filter */}
  <Select value={deliveryStatusFilter} onValueChange={setDeliveryStatusFilter}>
    <SelectTrigger className="w-[150px]">
      <SelectValue placeholder="Delivery" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Delivery</SelectItem>
      <SelectItem value="PENDING">Pending</SelectItem>
      <SelectItem value="SHIPPED">Shipped</SelectItem>
      <SelectItem value="DELIVERED">Delivered</SelectItem>
      <SelectItem value="CANCELLED">Cancelled</SelectItem>
    </SelectContent>
  </Select>

  {/* Date Range Filter */}
  <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
    <SelectTrigger className="w-[140px]">
      <Calendar className="h-4 w-4 mr-2" />
      <SelectValue placeholder="Date Range" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Time</SelectItem>
      <SelectItem value="today">Today</SelectItem>
      <SelectItem value="week">Last 7 Days</SelectItem>
      <SelectItem value="month">Last 30 Days</SelectItem>
      <SelectItem value="quarter">Last 3 Months</SelectItem>
    </SelectContent>
  </Select>

  <Button variant="outline">
    <Download className="h-4 w-4 mr-2" />
    Export
  </Button>
</div>

                  </div>
                </CardContent>
              </Card>

              {/* Orders Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Orders ({pagination.total})
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-green-500/10 text-green-700">
                        {orders.filter(o => o.deliveryStatus === 'DELIVERED').length} Delivered
                      </Badge>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
                        {orders.filter(o => o.paymentStatus === 'PENDING').length} Pending Payment
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading orders...</span>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={selectedOrders.length === orders.length && orders.length > 0}
                                  onCheckedChange={toggleSelectAll}
                                  aria-label="Select all"
                                />
                              </TableHead>
                              <TableHead>Order ID</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Items</TableHead>
                              <TableHead>Payment</TableHead>
                              <TableHead>Delivery</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders.length > 0 ? (
                              orders.map((order) => (
                                <TableRow key={order.id} className="hover:bg-muted/50">
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedOrders.includes(order.id)}
                                      onCheckedChange={() => toggleOrderSelection(order.id)}
                                      aria-label={`Select order ${order.id}`}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-mono text-sm">{order.id.slice(0, 8)}...</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-blue-100 text-blue-600">
                                          {order.buyer.user.name ? order.buyer.user.name[0].toUpperCase() : 'C'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium">{order.buyer.user.name}</div>
                                        <div className="text-sm text-muted-foreground">{order.buyer.user.email}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-bold">{formatCurrency(order.totalAmount)}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                                      </Badge>
                                      {order.items?.slice(0, 2).map((item, index) => (
                                        <div key={index} className="text-xs text-muted-foreground truncate max-w-20">
                                          {item.product.name}
                                        </div>
                                      ))}
                                      {order.items && order.items.length > 2 && (
                                        <div className="text-xs text-muted-foreground">
                                          +{order.items.length - 2} more
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {getPaymentStatusBadge(order.paymentStatus)}
                                  </TableCell>
                                  <TableCell>
                                    {getDeliveryStatusBadge(order.deliveryStatus)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      {formatDate(order.orderDate)}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => {
                                          setSelectedOrder(order);
                                          setOrderDetailOpen(true);
                                        }}
                                        title="View Details"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem 
                                            onClick={() => {
                                              setSelectedOrder(order);
                                              setOrderDetailOpen(true);
                                            }}
                                          >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                          </DropdownMenuItem>
                                          
                                          {order.deliveryStatus === 'CONFIRMED' && (
                                            <DropdownMenuItem 
                                              onClick={() => {
                                                setSelectedOrder(order);
                                                setSelectedAction('mark_shipped');
                                                setActionDialogOpen(true);
                                              }}
                                            >
                                              <Truck className="h-4 w-4 mr-2" />
                                              Mark as Shipped
                                            </DropdownMenuItem>
                                          )}

                                          {order.deliveryStatus === 'SHIPPED' && (
                                            <DropdownMenuItem 
                                              onClick={() => {
                                                setSelectedOrder(order);
                                                setSelectedAction('mark_delivered');
                                                setActionDialogOpen(true);
                                              }}
                                            >
                                              <Package className="h-4 w-4 mr-2" />
                                              Mark as Delivered
                                            </DropdownMenuItem>
                                          )}

                                          {(order.deliveryStatus === 'PENDING' || order.deliveryStatus === 'CONFIRMED') && (
                                            <DropdownMenuItem 
                                              onClick={() => {
                                                setSelectedOrder(order);
                                                setSelectedAction('cancel');
                                                setActionDialogOpen(true);
                                              }}
                                              className="text-red-600"
                                            >
                                              <XCircle className="h-4 w-4 mr-2" />
                                              Cancel Order
                                            </DropdownMenuItem>
                                          )}

                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem 
                                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                                          >
                                            <User className="h-4 w-4 mr-2" />
                                            Full Management
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                  <div>No orders found</div>
                                  {searchQuery && (
                                    <div className="text-sm mt-2">Try adjusting your search or filters</div>
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      {pagination.pages > 1 && (
                        <div className="flex justify-between items-center mt-4">
                          <div className="text-sm text-muted-foreground">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchOrders(pagination.page - 1, searchQuery)}
                              disabled={pagination.page === 1}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchOrders(pagination.page + 1, searchQuery)}
                              disabled={pagination.page === pagination.pages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information about the order, customer, and items.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">Order #{selectedOrder.id.slice(0, 8)}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-mono">
                      {selectedOrder.id}
                    </Badge>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                  {getDeliveryStatusBadge(selectedOrder.deliveryStatus)}
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {selectedOrder.buyer.user.name ? selectedOrder.buyer.user.name[0].toUpperCase() : 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{selectedOrder.buyer.user.name}</div>
                          <div className="text-sm text-muted-foreground">{selectedOrder.buyer.user.email}</div>
                        </div>
                      </div>
                      {selectedOrder.buyer.user.phone && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Phone: </span>
                          {selectedOrder.buyer.user.phone}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Order Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Order Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Date:</span>
                        <span>{formatDate(selectedOrder.orderDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Updated:</span>
                        <span>{formatDate(selectedOrder.updatedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Items:</span>
                        <span>{selectedOrder.itemCount} products</span>
                      </div>
                      {selectedOrder.blockchainTxHash && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Blockchain TX:</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {selectedOrder.blockchainTxHash.slice(0, 8)}...
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Sold by {item.product.producer.businessName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(item.subtotal)}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.quantity} × {formatCurrency(item.price)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="font-bold">Total Amount</div>
                      <div className="font-bold text-lg">{formatCurrency(selectedOrder.totalAmount)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && Object.keys(selectedOrder.shippingAddress).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      {selectedOrder.shippingAddress.street && (
                        <div>{selectedOrder.shippingAddress.street}</div>
                      )}
                      {selectedOrder.shippingAddress.city && selectedOrder.shippingAddress.state && (
                        <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</div>
                      )}
                      {selectedOrder.shippingAddress.zipCode && (
                        <div>{selectedOrder.shippingAddress.zipCode}</div>
                      )}
                      {selectedOrder.shippingAddress.country && (
                        <div>{selectedOrder.shippingAddress.country}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Order Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.deliveryStatus === 'CONFIRMED' && (
                    <Button
                      onClick={() => {
                        setSelectedAction('mark_shipped');
                        setActionDialogOpen(true);
                      }}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Mark as Shipped
                    </Button>
                  )}
                  {selectedOrder.deliveryStatus === 'SHIPPED' && (
                    <Button
                      onClick={() => {
                        setSelectedAction('mark_delivered');
                        setActionDialogOpen(true);
                      }}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Mark as Delivered
                    </Button>
                  )}
                  {(selectedOrder.deliveryStatus === 'PENDING' || selectedOrder.deliveryStatus === 'CONFIRMED') && (
                    <Button
                      onClick={() => {
                        setSelectedAction('cancel');
                        setActionDialogOpen(true);
                      }}
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Single Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAction === 'mark_shipped' && <Truck className="h-5 w-5 text-blue-500" />}
              {selectedAction === 'mark_delivered' && <Package className="h-5 w-5 text-green-500" />}
              {selectedAction === 'cancel' && <XCircle className="h-5 w-5 text-red-500" />}
              {selectedAction === 'mark_shipped' && 'Mark as Shipped'}
              {selectedAction === 'mark_delivered' && 'Mark as Delivered'}
              {selectedAction === 'cancel' && 'Cancel Order'}
            </DialogTitle>
            <DialogDescription>
              {selectedAction === 'mark_shipped' && 'Are you sure you want to mark this order as shipped? This will notify the customer.'}
              {selectedAction === 'mark_delivered' && 'Are you sure you want to mark this order as delivered? This will complete the order.'}
              {selectedAction === 'cancel' && 'Are you sure you want to cancel this order? This action may refund the customer and cannot be easily undone.'}
            </DialogDescription>
          </DialogHeader>

          {(selectedAction === 'cancel') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Textarea
                placeholder="Enter reason for cancellation..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialogOpen(false);
                setActionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={
                selectedAction === 'cancel' ? 'destructive' : 'default'
              }
              onClick={() => {
                if (selectedOrder && selectedAction) {
                  handleOrderAction(selectedAction, selectedOrder.id, actionReason);
                }
              }}
            >
              {selectedAction === 'mark_shipped' && 'Mark as Shipped'}
              {selectedAction === 'mark_delivered' && 'Mark as Delivered'}
              {selectedAction === 'cancel' && 'Cancel Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedBulkAction === 'mark_shipped' && <Truck className="h-5 w-5 text-blue-500" />}
              {selectedBulkAction === 'mark_delivered' && <Package className="h-5 w-5 text-green-500" />}
              {selectedBulkAction === 'cancel' && <XCircle className="h-5 w-5 text-red-500" />}
              Bulk {selectedBulkAction === 'mark_shipped' ? 'Mark as Shipped' : 
                    selectedBulkAction === 'mark_delivered' ? 'Mark as Delivered' : 'Cancel'} Orders
            </DialogTitle>
            <DialogDescription>
              You are about to {selectedBulkAction === 'mark_shipped' ? 'mark as shipped' : 
                              selectedBulkAction === 'mark_delivered' ? 'mark as delivered' : 'cancel'} {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''}. 
              {selectedBulkAction === 'cancel' && ' This action may refund customers and cannot be easily undone.'}
            </DialogDescription>
          </DialogHeader>

          {(selectedBulkAction === 'cancel') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Textarea
                placeholder="Enter reason for cancellation..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkActionDialogOpen(false);
                setActionReason('');
                setSelectedBulkAction('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={
                selectedBulkAction === 'cancel' ? 'destructive' : 'default'
              }
              onClick={() => {
                handleBulkAction(selectedBulkAction, actionReason);
              }}
            >
              {selectedBulkAction === 'mark_shipped' && `Mark ${selectedOrders.length} as Shipped`}
              {selectedBulkAction === 'mark_delivered' && `Mark ${selectedOrders.length} as Delivered`}
              {selectedBulkAction === 'cancel' && `Cancel ${selectedOrders.length} Orders`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>      
    </SidebarProvider>
  );
};

export default OrderManagement;