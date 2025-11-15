// src/pages/producer/ProducerOrders.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Truck, CheckCircle, MessageCircle, Eye, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { orderService } from '@/services/orderService';

interface Order {
  id: string;
  totalAmount: number;
  paymentStatus: string;
  deliveryStatus: string;
  orderDate: string;
  buyer: {
    user: {
      name: string;
      email: string;
    };
  };
  items: Array<{
    product: {
      name: string;
      price: number;
    };
    quantity: number;
  }>;
}

const ProducerOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'new' | 'shipping' | 'completed'>('new');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchProducerOrders();
  }, []);

  useEffect(() => {
    filterOrdersByTab();
  }, [orders, activeTab]);

  const fetchProducerOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getProducerOrders();
      console.log('🔧 Producer orders response:', response);
      
      const ordersData = response?.orders || response?.data?.orders || [];
      setOrders(ordersData);
    } catch (error: any) {
      console.error('Failed to fetch producer orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrdersByTab = () => {
    let filtered: Order[] = [];
    
    switch (activeTab) {
      case 'new':
        filtered = orders.filter(order => 
          ['PENDING', 'CONFIRMED'].includes(order.deliveryStatus)
        );
        break;
      case 'shipping':
        filtered = orders.filter(order => 
          order.deliveryStatus === 'SHIPPED'
        );
        break;
      case 'completed':
        filtered = orders.filter(order => 
          ['DELIVERED', 'CANCELLED'].includes(order.deliveryStatus)
        );
        break;
      default:
        filtered = orders;
    }
    
    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await orderService.updateOrderStatus(orderId, newStatus);
      
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });
      
      // Refresh orders
      await fetchProducerOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Package className="h-4 w-4" />;
      case 'CONFIRMED': return <Package className="h-4 w-4" />;
      case 'SHIPPED': return <Truck className="h-4 w-4" />;
      case 'DELIVERED': return <CheckCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (amount: number) => {
    return `${amount.toFixed(2)} ETB`;
  };

  const getMainProductName = (order: Order) => {
    if (order.items.length === 0) return 'No products';
    if (order.items.length === 1) return order.items[0].product.name;
    return `${order.items[0].product.name} +${order.items.length - 1} more`;
  };

  const getTotalQuantity = (order: Order) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const tabConfig = [
    { 
      key: 'new' as const, 
      label: 'New Orders', 
      icon: Package, 
      count: orders.filter(order => ['PENDING', 'CONFIRMED'].includes(order.deliveryStatus)).length 
    },
    { 
      key: 'shipping' as const, 
      label: 'To Ship', 
      icon: Truck, 
      count: orders.filter(order => order.deliveryStatus === 'SHIPPED').length 
    },
    { 
      key: 'completed' as const, 
      label: 'Completed', 
      icon: CheckCircle, 
      count: orders.filter(order => ['DELIVERED', 'CANCELLED'].includes(order.deliveryStatus)).length 
    },
  ];

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="Order Management" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading orders...</p>
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
            title="Order Management" 
            description="Manage and track your customer orders"
          />

          <main className="flex-1 p-6">
            {/* Order Tabs */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex space-x-1">
                  {tabConfig.map((tab) => (
                    <Button
                      key={tab.key}
                      variant={activeTab === tab.key ? "default" : "ghost"}
                      className="flex-1 justify-start"
                      onClick={() => setActiveTab(tab.key)}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.label}
                      <Badge variant="secondary" className="ml-2">
                        {tab.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === 'new' && 'New Orders - Ready for Processing'}
                  {activeTab === 'shipping' && 'Orders in Transit'}
                  {activeTab === 'completed' && 'Completed Orders'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          #{order.id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.buyer.user.name}</div>
                            <div className="text-xs text-muted-foreground">{order.buyer.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getMainProductName(order)}</TableCell>
                        <TableCell>{getTotalQuantity(order)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatPrice(order.totalAmount)}
                        </TableCell>
                        <TableCell>{formatDate(order.orderDate)}</TableCell>
                        <TableCell>
                          <Badge variant={order.paymentStatus === 'CONFIRMED' ? 'default' : 'secondary'}>
                            {order.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.deliveryStatus)}>
                            {getStatusIcon(order.deliveryStatus)}
                            <span className="ml-1">{order.deliveryStatus}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            
                            {/* Status Update Buttons */}
                            {activeTab === 'new' && order.deliveryStatus === 'PENDING' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                                disabled={updatingStatus === order.id}
                              >
                                {updatingStatus === order.id ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Package className="h-3 w-3 mr-1" />
                                )}
                                Confirm
                              </Button>
                            )}
                            
                            {activeTab === 'new' && order.deliveryStatus === 'CONFIRMED' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateOrderStatus(order.id, 'SHIPPED')}
                                disabled={updatingStatus === order.id}
                              >
                                {updatingStatus === order.id ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Truck className="h-3 w-3 mr-1" />
                                )}
                                Ship
                              </Button>
                            )}
                            
                            {activeTab === 'shipping' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                                disabled={updatingStatus === order.id}
                              >
                                {updatingStatus === order.id ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                Deliver
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredOrders.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                    <p className="text-muted-foreground mb-4">
                      {activeTab === 'new' && 'You have no new orders waiting for processing.'}
                      {activeTab === 'shipping' && 'No orders are currently in transit.'}
                      {activeTab === 'completed' && 'No completed orders yet.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ProducerOrders;