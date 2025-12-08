// src/pages/producer/ProducerOrders.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Truck, CheckCircle, MessageCircle, Eye, Loader2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { orderService } from '@/services/orderService';

interface Order {
  id: string;
  totalAmount: number;
  producerShare?: number; // Producer's actual earnings from this order
  isSharedProduct?: boolean; // Whether this product has multiple producers
  paymentStatus: string;
  deliveryStatus: string;
  orderDate: string;
  payoutStatus?: string; // Producer's payout status (PENDING, COMPLETED, etc.)
  paidAt?: string; // When producer received payout
  payoutReference?: string; // Payout reference number
  payoutScheduledFor?: string; // When payout is scheduled
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
      producers?: Array<{
        id: string;
        businessName: string;
        sharePercentage?: number;
        shareAmount?: number;
      }>;
    };
    quantity: number;
    producerShare?: number; // Producer's share for this item
  }>;
  allProducers?: Array<{
    id: string;
    businessName: string;
    sharePercentage: number;
    shareAmount: number;
    role?: string;
  }>;
}

const ProducerOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'new' | 'shipping' | 'shipped' | 'completed'>('new');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
          order.deliveryStatus === 'PENDING'
        );
        break;
      case 'shipping':
        filtered = orders.filter(order =>
          order.deliveryStatus === 'CONFIRMED'
        );
        break;
      case 'shipped':
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

  const getPayoutStatusColor = (status?: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
      case 'SCHEDULED': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'PROCESSING': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      case 'COMPLETED': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'FAILED': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-amber-500/10 text-amber-700 border-amber-500/20'; // Default to pending
    }
  };

  const getPayoutStatusLabel = (order: Order) => {
    const status = order.payoutStatus || 'PENDING';

    switch (status) {
      case 'PENDING':
        return order.payoutScheduledFor
          ? `⏳ Due ${formatDate(order.payoutScheduledFor)}`
          : '⏳ Pending';
      case 'SCHEDULED':
        return `📅 Scheduled`;
      case 'PROCESSING':
        return '⚙️ Processing';
      case 'COMPLETED':
        return order.paidAt
          ? `✅ Paid ${formatDate(order.paidAt)}`
          : '✅ Paid';
      case 'FAILED':
        return '❌ Failed';
      default:
        return '⏳ Pending';
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
      count: orders.filter(order => order.deliveryStatus === 'PENDING').length
    },
    {
      key: 'shipping' as const,
      label: 'Ready to Ship',
      icon: Truck,
      count: orders.filter(order => order.deliveryStatus === 'CONFIRMED').length
    },
    {
      key: 'shipped' as const,
      label: 'Shipped',
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
                      <TableHead>Your Payout</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Payout Status</TableHead>
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{getMainProductName(order)}</span>
                            {order.isSharedProduct && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                <Users className="h-3 w-3 mr-1" />
                                Shared
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getTotalQuantity(order)}</TableCell>
                        <TableCell className="font-semibold">
                          {/* Show producer's share if available, otherwise show total */}
                          {order.producerShare !== undefined ? (
                            <div>
                              <div className="font-bold text-green-600">
                                {formatPrice(order.producerShare)}
                              </div>
                              {order.isSharedProduct && (
                                <div className="text-xs text-muted-foreground">
                                  of {formatPrice(order.totalAmount)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="font-bold">
                              {formatPrice(order.totalAmount)}
                            </div>
                          )}
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
                          <Badge variant="outline" className={getPayoutStatusColor(order.payoutStatus)}>
                            {getPayoutStatusLabel(order)}
                          </Badge>
                          {order.payoutReference && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Ref: {order.payoutReference}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrderDetail(order);
                                setShowDetailModal(true);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>

                            {/* Status Update Buttons */}
                            {order.deliveryStatus === 'PENDING' && (
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
                                Confirm Order
                              </Button>
                            )}

                            {order.deliveryStatus === 'CONFIRMED' && (
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
                                Mark as Shipped
                              </Button>
                            )}

                            {order.deliveryStatus === 'SHIPPED' && (
                              <Button
                                size="sm"
                                onClick={() => navigate(`/orders/${order.id}?uploadProof=true`)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Upload Proof & Deliver
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

      {/* Order Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this order
            </DialogDescription>
          </DialogHeader>

          {selectedOrderDetail && (
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Order ID</p>
                      <p className="font-mono text-sm">#{selectedOrderDetail.id.slice(-8)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Order Date</p>
                      <p className="text-sm">{formatDate(selectedOrderDetail.orderDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Status</p>
                      <Badge variant={selectedOrderDetail.paymentStatus === 'CONFIRMED' ? 'default' : 'secondary'}>
                        {selectedOrderDetail.paymentStatus}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Delivery Status</p>
                      <Badge className={getStatusColor(selectedOrderDetail.deliveryStatus)}>
                        {selectedOrderDetail.deliveryStatus}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Buyer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Buyer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="text-sm font-medium">{selectedOrderDetail.buyer.user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm font-medium">{selectedOrderDetail.buyer.user.email}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Co-Producers Information (if shared product) */}
              {selectedOrderDetail.isSharedProduct && selectedOrderDetail.allProducers && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-900">Co-Producers on This Order</span>
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      This is a shared product with multiple producers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedOrderDetail.allProducers.map((producer) => (
                        <div key={producer.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100">
                          <div>
                            <p className="font-medium text-sm text-blue-900">{producer.businessName}</p>
                            {producer.role && (
                              <p className="text-xs text-blue-600">{producer.role}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-blue-900">{producer.sharePercentage}%</p>
                            <p className="text-xs text-blue-600">
                              {formatPrice(producer.shareAmount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrderDetail.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product.name}</p>

                          {/* Show producers for this item if available */}
                          {item.product.producers && item.product.producers.length > 1 && (
                            <div className="mt-1 flex flex-wrap gap-1 items-center">
                              <span className="text-xs text-muted-foreground">Producers:</span>
                              {item.product.producers.map((producer, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {producer.businessName}
                                  {producer.sharePercentage && ` (${producer.sharePercentage}%)`}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground mt-1">
                            {item.quantity} × {formatPrice(item.product.price)}
                          </p>

                          {/* Show producer's share for this item */}
                          {item.producerShare !== undefined && (
                            <p className="text-xs text-green-600 font-medium mt-1">
                              Your share: {formatPrice(item.producerShare)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{formatPrice(item.quantity * item.product.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Earnings Summary */}
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-sm text-green-900">Your Earnings from This Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">Order Total:</span>
                      <span className="text-sm font-medium text-green-900">
                        {formatPrice(selectedOrderDetail.totalAmount)}
                      </span>
                    </div>
                    {selectedOrderDetail.producerShare !== undefined && (
                      <>
                        {selectedOrderDetail.isSharedProduct && (
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Your Share:</span>
                            <span className="text-sm font-medium text-green-900">
                              {formatPrice(selectedOrderDetail.producerShare / 0.9)} (before commission)
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700">Platform Commission (10%):</span>
                          <span className="text-sm font-medium text-red-600">
                            -{formatPrice((selectedOrderDetail.producerShare / 0.9) * 0.1)}
                          </span>
                        </div>
                        <div className="border-t border-green-200 pt-2 flex justify-between">
                          <span className="font-semibold text-green-900">Your Net Earnings:</span>
                          <span className="font-bold text-lg text-green-600">
                            {formatPrice(selectedOrderDetail.producerShare)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowDetailModal(false);
              navigate(`/orders/${selectedOrderDetail?.id}`);
            }}>
              View Full Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default ProducerOrders;