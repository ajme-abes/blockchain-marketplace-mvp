import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Star } from 'lucide-react';
import { ReviewModal } from '@/components/reviews/ReviewModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { orderService } from '@/services/orderService';
import { Package, Eye, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  totalAmount: number;
  paymentStatus: string;
  deliveryStatus: string;
  orderDate: string;
  shippingAddress: any;
  blockchainTxHash?: string;
  buyer?: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      price: number;
      producer?: {
        businessName: string;
        user: {
          name: string;
        };
      };
    };
    quantity: number;
    subtotal: number;
  }>;
}

const Orders = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    product: { id: string; name: string } | null;
    orderId: string | null;
  }>({
    isOpen: false,
    product: null,
    orderId: null
  });
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getUserOrders();
      setOrders(response.orders || []);
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: "Error",
        description: "Failed to load your orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isProducer = user.role === 'PRODUCER';

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500/10 text-green-600 hover:bg-green-500/20';
      case 'shipped':
        return 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20';
      case 'confirmed':
        return 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20';
      case 'pending':
        return 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 hover:bg-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  const handleOpenReview = (product: { id: string; name: string }, orderId: string) => {
    setReviewModal({
      isOpen: true,
      product,
      orderId
    });
  };
  
  // Add this function to refresh orders after review
  const handleReviewSubmitted = () => {
    fetchOrders(); // Refresh orders to show updated state
  };
  
  // Add this helper function to check if order can be reviewed
  const canReviewOrder = (order: Order) => {
    return order.deliveryStatus === 'DELIVERED' && 
           order.paymentStatus === 'CONFIRMED';
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

  const getOrderTitle = (order: Order) => {
    if (order.items.length === 1) {
      return order.items[0].product.name;
    }
    return `${order.items[0].product.name} + ${order.items.length - 1} more items`;
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title={isProducer ? 'My Sales Orders' : 'My Orders'} />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading your orders...</p>
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
            title={isProducer ? 'My Sales Orders' : 'My Orders'} 
            description={isProducer 
              ? 'Manage and track your product orders' 
              : 'View your order history and track deliveries'
            }
          />

          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="shadow-card hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getOrderTitle(order)}
                          {order.blockchainTxHash && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Order #{order.id.slice(-8)} • {formatDate(order.orderDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(order.deliveryStatus)}>
                          {order.deliveryStatus.charAt(0).toUpperCase() + order.deliveryStatus.slice(1).toLowerCase()}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {order.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {isProducer ? 'Buyer' : 'Seller'}
                        </p>
                        <p className="font-medium">
                          {isProducer 
                            ? order.buyer?.user.name || 'Unknown Buyer'
                            : order.items[0]?.product.producer?.businessName || 'Unknown Seller'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Items</p>
                        <p className="font-medium">{order.items.length} products</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="font-medium text-primary">{formatPrice(order.totalAmount)}</p>
                      </div>
<div className="flex items-end gap-2">
{!isProducer && canReviewOrder(order) && (
  <Button 
    variant="default" 
    size="sm"
    onClick={() => handleOpenReview(order.items[0].product, order.id)}
  >
    <Star className="h-4 w-4 mr-2" />
    Review
  </Button>
)}
<Button 
  variant="outline" 
  size="sm" 
  className={!isProducer && canReviewOrder(order) ? "flex-1" : "w-full"}
  onClick={() => navigate(`/orders/${order.id}`)}
>
  <Eye className="h-4 w-4 mr-2" />
  View Details
</Button>
</div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {orders.length === 0 && (
                <Card className="shadow-card">
                  <CardContent className="p-12 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      {isProducer 
                        ? 'You haven\'t received any orders yet. Your sales will appear here.'
                        : 'Start shopping to see your orders here.'}
                    </p>
                    {!isProducer && (
                      <Button onClick={() => navigate('/marketplace')}>
                        Browse Marketplace
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
      {reviewModal.isOpen && reviewModal.product && (
  <ReviewModal
    isOpen={reviewModal.isOpen}
    onClose={() => setReviewModal({ isOpen: false, product: null, orderId: null })}
    product={reviewModal.product}
    orderId={reviewModal.orderId}
    onReviewSubmitted={handleReviewSubmitted}
  />
)}
    </SidebarProvider>
  );
};

export default Orders;