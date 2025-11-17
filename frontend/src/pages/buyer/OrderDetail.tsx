import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { orderService } from '@/services/orderService';
import { paymentService } from '@/services/paymentService';
import { useChat } from '@/contexts/ChatContext';
import { MessageSquare, Loader2 } from 'lucide-react';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  ExternalLink,
  MapPin,
  User,
  Phone,
  Mail,
  Shield,
  FileText,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  totalAmount: number;
  paymentStatus: string;
  deliveryStatus: string;
  orderDate: string;
  shippingAddress: any;
  blockchainTxHash?: string;
  blockchainRecorded?: boolean;
  buyer?: {
    id: string;
    user: {
      name: string;
      email: string;
      phone: string;
    };
  };
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      price: number;
      imageUrl?: string;
      producer?: {
        businessName: string;
        user: {
          name: string;
          email: string;
        };
      };
    };
    quantity: number;
    subtotal: number;
  }>;
  statusHistory?: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    changedBy: {
      name: string;
      role: string;
    };
    reason?: string;
    timestamp: string;
  }>;
}

interface PaymentStatus {
  status: string;
  method?: string;
  confirmedAt?: string;
  transactionHash?: string;
}

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { createOrderChat, loading: chatLoading } = useChat();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (orderId) {
      fetchOrderDetails();
    }
  }, [isAuthenticated, navigate, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await orderService.getOrder(orderId!);
      setOrder(orderData);

      // Fetch payment status
      const paymentData = await paymentService.getPaymentStatus(orderId!);
      setPaymentStatus(paymentData);
    } catch (error: any) {
      console.error('Failed to fetch order details:', error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!orderId) return;

    try {
      setUpdatingStatus(true);
      await orderService.updateOrderStatus(orderId, newStatus);
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });
      fetchOrderDetails(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500 text-white';
      case 'shipped':
        return 'bg-blue-500 text-white';
      case 'confirmed':
        return 'bg-yellow-500 text-white';
      case 'pending':
        return 'bg-gray-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  const handleContactSeller = async () => {
    if (!orderId) return;
  
    try {
      const chat = await createOrderChat(orderId);
      
      toast({
        title: "Chat opened successfully!",
        description: "Redirecting to messages...",
      });
  
      // Small delay for better UX
      setTimeout(() => {
        navigate(`/chats?chat=${chat.id}`);
      }, 1000);
      
    } catch (error: any) {
      console.error('Failed to create order chat:', error);
      toast({
        title: "Error opening chat",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };
  
  const handleSendMessage = async () => {
    if (!orderId) return;
  
    try {
      const chat = await createOrderChat(orderId);
      
      toast({
        title: "Chat opened",
        description: "You can now message the buyer",
      });
  
      // Navigate to the chat
      navigate(`/chats?chat=${chat.id}`);
      
    } catch (error: any) {
      console.error('Failed to create order chat:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open chat",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (amount: number) => {
    return `${amount.toFixed(2)} ETB`;
  };

  const getPolygonscanUrl = (txHash: string) => {
    return `https://amoy.polygonscan.com/tx/${txHash}`;
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="Order Details" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading order details...</p>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!order) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="Order Not Found" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
                <p className="text-muted-foreground mb-4">The order you're looking for doesn't exist.</p>
                <Button onClick={() => navigate('/orders')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
                </Button>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const isProducer = user?.role === 'PRODUCER';
  const canUpdateStatus = isProducer || user?.role === 'ADMIN';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader 
            title={`Order #${order.id.slice(-8)}`}
            description={`Placed on ${formatDate(order.orderDate)}`}
            action={
              <Button variant="outline" onClick={() => navigate('/orders')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
            }
          />

          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Order Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Status Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(order.deliveryStatus)}>
                          {getStatusIcon(order.deliveryStatus)}
                          <span className="ml-1">{order.deliveryStatus}</span>
                        </Badge>
                        <Badge variant="outline">
                          Payment: {order.paymentStatus}
                        </Badge>
                      </div>
                      
                      {canUpdateStatus && (
                        <div className="flex gap-2">
                          {order.deliveryStatus === 'PENDING' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateOrderStatus('CONFIRMED')}
                              disabled={updatingStatus}
                            >
                              Confirm Order
                            </Button>
                          )}
                          {order.deliveryStatus === 'CONFIRMED' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateOrderStatus('SHIPPED')}
                              disabled={updatingStatus}
                            >
                              Mark as Shipped
                            </Button>
                          )}
                          {order.deliveryStatus === 'SHIPPED' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateOrderStatus('DELIVERED')}
                              disabled={updatingStatus}
                            >
                              Mark as Delivered
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Status Timeline */}
                    {order.statusHistory && order.statusHistory.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Status History</h4>
                        <div className="space-y-2">
                          {order.statusHistory.map((history, index) => (
                            <div key={history.id} className="flex items-start gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                                {index < order.statusHistory!.length - 1 && (
                                  <div className="w-0.5 h-8 bg-border flex-1"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {history.toStatus}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(history.timestamp)}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  By {history.changedBy.name} ({history.changedBy.role})
                                  {history.reason && ` • ${history.reason}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <img 
                            src={item.product.imageUrl || '/placeholder-product.jpg'} 
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.product.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Seller: {item.product.producer?.businessName || 'Unknown Seller'}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm">Qty: {item.quantity}</span>
                              <span className="text-sm">Price: {formatPrice(item.product.price)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(item.subtotal)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatPrice(order.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>50.00 ETB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (15%)</span>
                        <span>{formatPrice(order.totalAmount * 0.15)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>{formatPrice(order.totalAmount + 50 + (order.totalAmount * 0.15))}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {order.shippingAddress ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-semibold flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {order.shippingAddress.fullName}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            <Phone className="h-3 w-3 inline mr-1" />
                            {order.shippingAddress.phone}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 inline mr-1" />
                            {order.shippingAddress.email}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">{order.shippingAddress.address}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.shippingAddress.city}, {order.shippingAddress.region}
                          </p>
                          {order.shippingAddress.additionalInfo && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Note: {order.shippingAddress.additionalInfo}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No shipping information available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Payment & Blockchain */}
              <div className="space-y-6">
                {/* Payment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Status</span>
                      <Badge variant={order.paymentStatus === 'CONFIRMED' ? 'default' : 'secondary'}>
                        {order.paymentStatus}
                      </Badge>
                    </div>
                    {paymentStatus?.method && (
                      <div className="flex justify-between">
                        <span className="text-sm">Method</span>
                        <span className="text-sm font-medium">{paymentStatus.method}</span>
                      </div>
                    )}
                    {paymentStatus?.confirmedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm">Paid On</span>
                        <span className="text-sm">{formatDate(paymentStatus.confirmedAt)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Blockchain Verification */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Blockchain Verification
                    </CardTitle>
                    <CardDescription>
                      Transaction recorded on Polygon Amoy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {order.blockchainTxHash ? (
                      <>
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Verified on Blockchain</span>
                        </div>
                        <div className="text-xs bg-muted p-2 rounded break-all">
                          {order.blockchainTxHash}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => window.open(getPolygonscanUrl(order.blockchainTxHash!), '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-2" />
                          View on Polygonscan
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Pending blockchain verification</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact Information */}
<Card>
<CardHeader>
  <CardTitle>Contact Information</CardTitle>
</CardHeader>
<CardContent className="space-y-3">
  {isProducer && order.buyer ? (
    <>
      <div>
        <p className="font-semibold">{order.buyer.user.name}</p>
        <p className="text-sm text-muted-foreground">{order.buyer.user.email}</p>
        <p className="text-sm text-muted-foreground">{order.buyer.user.phone}</p>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full"
        onClick={handleSendMessage}
        disabled={chatLoading}
      >
        {chatLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <MessageSquare className="h-4 w-4 mr-2" />
        )}
        Send Message
      </Button>
    </>
  ) : order.items[0]?.product.producer && (
    <>
      <div>
        <p className="font-semibold">{order.items[0].product.producer.businessName}</p>
        <p className="text-sm text-muted-foreground">
          Contact: {order.items[0].product.producer.user.name}
        </p>
        <p className="text-sm text-muted-foreground">
          {order.items[0].product.producer.user.email}
        </p>
      </div>
<Button 
  variant="outline" 
  size="sm" 
  className="w-full"
  onClick={handleContactSeller}
  disabled={chatLoading}
>
  {chatLoading ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin mr-2" />
      Opening Chat...
    </>
  ) : (
    <>
      <MessageSquare className="h-4 w-4 mr-2" />
      Contact Seller
    </>
  )}
</Button>
    </>
  )}
</CardContent>
</Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default OrderDetail;