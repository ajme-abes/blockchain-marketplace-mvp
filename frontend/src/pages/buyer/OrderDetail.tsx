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
import { paymentService, PaymentIntent } from '@/services/paymentService';
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
  Calendar,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Upload, X, AlertCircle, Users } from 'lucide-react';
import { disputeService } from '@/services/disputeService';

interface Order {
  id: string;
  totalAmount: number;
  paymentStatus: string;
  deliveryStatus: string;
  orderDate: string;
  shippingAddress: any;
  blockchainTxHash?: string;
  blockchainRecorded?: boolean;
  blockchainRecordedAt?: string;
  blockchainRecords?: Array<{
    id: string;
    txHash: string;
    blockNumber: string;
    timestamp: string;
    status: string;
  }>;
  deliveryProofUrl?: string;
  deliveryProofIpfsCid?: string;
  deliveredAt?: string;
  deliveryNotes?: string;
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
      producers?: Array<{
        id: string;
        businessName: string;
        sharePercentage: number;
        role?: string;
      }>;
    };
    quantity: number;
    subtotal: number;
    producerShare?: number;
  }>;
  producerShare?: number;
  isSharedProduct?: boolean;
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
  dispute?: {
    id: string;
    status: string;
    reason: string;
  };
}

interface PaymentStatus {
  status: string;
  method?: string;
  confirmedAt?: string;
  transactionHash?: string;
}

interface DisputeFormData {
  reason: string;
  description: string;
  desiredResolution: string;
  evidence: File[];
}

interface DisputeReason {
  value: string;
  label: string;
  description: string;
}

// Add these constants after the interfaces
const DISPUTE_REASONS: DisputeReason[] = [
  {
    value: 'NOT_DELIVERED',
    label: 'Order Not Delivered',
    description: 'Order was not delivered within expected timeframe'
  },
  {
    value: 'WRONG_ITEM',
    label: 'Wrong Item Received',
    description: 'Received different product than ordered'
  },
  {
    value: 'DAMAGED',
    label: 'Damaged Product',
    description: 'Product arrived damaged or defective'
  },
  {
    value: 'QUALITY_ISSUE',
    label: 'Quality Issue',
    description: 'Product quality does not match description'
  },
  {
    value: 'QUANTITY_MISMATCH',
    label: 'Quantity Mismatch',
    description: 'Received wrong quantity of items'
  },
  {
    value: 'NO_COMMUNICATION',
    label: 'No Communication',
    description: 'Seller is not responding to messages'
  },
  {
    value: 'OTHER',
    label: 'Other Issue',
    description: 'Other problem with this order'
  }
];

const RESOLUTION_OPTIONS = [
  'Full Refund',
  'Partial Refund',
  'Replacement',
  'Store Credit',
  'Other Resolution'
];

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
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [creatingDispute, setCreatingDispute] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [creatingPaymentLink, setCreatingPaymentLink] = useState(false);
  const [disputeForm, setDisputeForm] = useState<DisputeFormData>({
    reason: '',
    description: '',
    desiredResolution: '',
    evidence: []
  });
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [checkingDispute, setCheckingDispute] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState(false);
  const [deliveryProofFile, setDeliveryProofFile] = useState<File | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showDeliveryProofModal, setShowDeliveryProofModal] = useState(false);

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

  const handleMarkAsDelivered = () => {
    setShowDeliveryProofModal(true);
  };

  const handleDeliveryProofUpload = async () => {
    if (!orderId || !deliveryProofFile) {
      toast({
        title: "Missing information",
        description: "Please select a delivery proof image",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingProof(true);

      const formData = new FormData();
      formData.append('deliveryProof', deliveryProofFile);
      formData.append('status', 'DELIVERED');
      formData.append('deliveryNotes', deliveryNotes);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}/status-with-proof`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Failed to upload delivery proof');
      }

      toast({
        title: "Success!",
        description: "Order marked as delivered with proof uploaded to IPFS",
      });

      setShowDeliveryProofModal(false);
      setDeliveryProofFile(null);
      setDeliveryNotes('');
      fetchOrderDetails();

    } catch (error: any) {
      console.error('Failed to upload delivery proof:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload delivery proof",
        variant: "destructive",
      });
    } finally {
      setUploadingProof(false);
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

  const handleDisputeChat = async () => {
    if (!orderId || !order?.dispute) return;

    try {
      setCheckingDispute(true);

      // First, get the dispute details to find the dispute chat
      const disputeResult = await disputeService.getDisputeDetails(order.dispute.id);

      if (disputeResult.status === 'success' && disputeResult.data) {
        // Navigate to dispute management page with the dispute ID
        navigate(`/disputes/${order.dispute.id}`);
      } else {
        throw new Error('Could not access dispute details');
      }

    } catch (error: any) {
      console.error('Failed to open dispute chat:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open dispute chat",
        variant: "destructive",
      });
    } finally {
      setCheckingDispute(false);
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

  const copyTxHash = async (txHash: string) => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopiedTxHash(true);
      toast({
        title: "Copied!",
        description: "Transaction hash copied to clipboard",
      });
      setTimeout(() => setCopiedTxHash(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const handleOpenDisputeModal = () => {
    if (!order) return;

    // Check if dispute can be raised (order must be confirmed/delivered and not already disputed)
    if (order.deliveryStatus === 'PENDING') {
      toast({
        title: "Cannot Raise Dispute",
        description: "You can only raise disputes for confirmed or delivered orders",
        variant: "destructive",
      });
      return;
    }

    // Check if dispute already exists
    if (order.dispute) {
      toast({
        title: "Dispute Already Exists",
        description: "A dispute has already been raised for this order",
        variant: "destructive",
      });
      return;
    }

    setShowDisputeModal(true);
  };

  const handleEvidenceUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit

      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: "Please upload images or PDF files only",
          variant: "destructive",
        });
      }
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: "Please upload files smaller than 10MB",
          variant: "destructive",
        });
      }

      return isValidType && isValidSize;
    });

    setDisputeForm(prev => ({
      ...prev,
      evidence: [...prev.evidence, ...validFiles]
    }));
  };

  const removeEvidence = (index: number) => {
    setDisputeForm(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  const handleCreateDispute = async () => {
    if (!orderId || !disputeForm.reason || !disputeForm.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreatingDispute(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('reason', disputeForm.reason);
      formData.append('description', disputeForm.description);
      formData.append('desiredResolution', disputeForm.desiredResolution);

      // Add evidence files
      disputeForm.evidence.forEach((file, index) => {
        formData.append(`evidence`, file);
      });

      const result = await disputeService.createDispute(formData, (progress) => {
        setUploadProgress(progress);
      });

      if (result.status === 'error') {
        throw new Error(result.message);
      }

      toast({
        title: "Dispute Raised Successfully",
        description: "Your dispute has been submitted and will be reviewed shortly",
      });

      setShowDisputeModal(false);
      setDisputeForm({
        reason: '',
        description: '',
        desiredResolution: '',
        evidence: []
      });

      // Refresh order details to show the new dispute
      fetchOrderDetails();

    } catch (error: any) {
      console.error('Failed to create dispute:', error);
      toast({
        title: "Failed to Raise Dispute",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setCreatingDispute(false);
      setUploadProgress(0);
    }
  };

  const selectedReason = DISPUTE_REASONS.find(r => r.value === disputeForm.reason);
  const isProducer = user?.role === 'PRODUCER';
  const isBuyer = user?.role === 'BUYER';
  const canUpdateStatus = isProducer || user?.role === 'ADMIN';
  const hasActiveDispute = order?.dispute && order.dispute.status !== 'RESOLVED' && order.dispute.status !== 'CANCELLED';

  const handleCreatePaymentLink = async () => {
    if (!order || !isBuyer) return;

    try {
      setCreatingPaymentLink(true);
      const intent = await paymentService.createPaymentIntent({
        orderId: order.id,
        customerInfo: {
          name: order.shippingAddress?.fullName || user?.name || 'Customer',
          email: order.shippingAddress?.email || user?.email || '',
          phone: order.shippingAddress?.phone || user?.phone || ''
        }
      });
      setPaymentIntent(intent);
      toast({
        title: 'Payment link created',
        description: 'Use the link below to complete your payment.'
      });
    } catch (error: any) {
      console.error('Failed to create payment intent:', error);
      toast({
        title: 'Unable to create payment link',
        description: error.message || 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setCreatingPaymentLink(false);
    }
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
                      {hasActiveDispute && (
                        <Badge variant="destructive" className="ml-2">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Dispute: {order.dispute?.status}
                        </Badge>
                      )}
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
                              onClick={handleMarkAsDelivered}
                              disabled={updatingStatus}
                            >
                              Mark as Delivered
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Multi-Producer Warning */}
                    {canUpdateStatus && order.items.some(item => item.product.producers && item.product.producers.length > 1) && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-amber-800">
                            <p className="font-medium mb-1">Multi-Producer Order</p>
                            <p>This order contains products from multiple producers. Updating the status will affect the entire order for all producers. Please coordinate with co-producers before marking as shipped or delivered.</p>
                          </div>
                        </div>
                      </div>
                    )}

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

                {/* Delivery Tracking Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Delivery Tracking
                    </CardTitle>
                    <CardDescription>
                      Track your order from confirmation to delivery
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Delivery Steps */}
                      <div className="relative">
                        {/* Vertical Line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>

                        {/* Step 1: Order Confirmed */}
                        <div className="relative flex items-start gap-4 pb-8">
                          <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.deliveryStatus)
                            ? 'bg-green-500 border-green-500'
                            : 'bg-background border-border'
                            }`}>
                            {['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.deliveryStatus) ? (
                              <CheckCircle className="h-4 w-4 text-white" />
                            ) : (
                              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <h4 className={`font-semibold ${['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.deliveryStatus)
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                              }`}>
                              Order Confirmed
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {order.statusHistory?.find(h => h.toStatus === 'CONFIRMED')
                                ? formatDate(order.statusHistory.find(h => h.toStatus === 'CONFIRMED')!.timestamp)
                                : order.deliveryStatus === 'CONFIRMED' || order.deliveryStatus === 'SHIPPED' || order.deliveryStatus === 'DELIVERED'
                                  ? 'Confirmed'
                                  : 'Awaiting confirmation'}
                            </p>
                          </div>
                        </div>

                        {/* Step 2: Shipped */}
                        <div className="relative flex items-start gap-4 pb-8">
                          <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${['SHIPPED', 'DELIVERED'].includes(order.deliveryStatus)
                            ? 'bg-blue-500 border-blue-500'
                            : order.deliveryStatus === 'CONFIRMED'
                              ? 'bg-yellow-500 border-yellow-500 animate-pulse'
                              : 'bg-background border-border'
                            }`}>
                            {['SHIPPED', 'DELIVERED'].includes(order.deliveryStatus) ? (
                              <Truck className="h-4 w-4 text-white" />
                            ) : order.deliveryStatus === 'CONFIRMED' ? (
                              <Clock className="h-4 w-4 text-white" />
                            ) : (
                              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <h4 className={`font-semibold ${['SHIPPED', 'DELIVERED'].includes(order.deliveryStatus)
                              ? 'text-foreground'
                              : order.deliveryStatus === 'CONFIRMED'
                                ? 'text-yellow-600'
                                : 'text-muted-foreground'
                              }`}>
                              Shipped
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {order.statusHistory?.find(h => h.toStatus === 'SHIPPED')
                                ? formatDate(order.statusHistory.find(h => h.toStatus === 'SHIPPED')!.timestamp)
                                : order.deliveryStatus === 'SHIPPED' || order.deliveryStatus === 'DELIVERED'
                                  ? 'In transit'
                                  : order.deliveryStatus === 'CONFIRMED'
                                    ? 'Preparing for shipment'
                                    : 'Not yet shipped'}
                            </p>
                          </div>
                        </div>

                        {/* Step 3: Out for Delivery */}
                        <div className="relative flex items-start gap-4 pb-8">
                          <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${order.deliveryStatus === 'DELIVERED'
                            ? 'bg-purple-500 border-purple-500'
                            : order.deliveryStatus === 'SHIPPED'
                              ? 'bg-yellow-500 border-yellow-500 animate-pulse'
                              : 'bg-background border-border'
                            }`}>
                            {order.deliveryStatus === 'DELIVERED' ? (
                              <Package className="h-4 w-4 text-white" />
                            ) : order.deliveryStatus === 'SHIPPED' ? (
                              <Clock className="h-4 w-4 text-white" />
                            ) : (
                              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <h4 className={`font-semibold ${order.deliveryStatus === 'DELIVERED'
                              ? 'text-foreground'
                              : order.deliveryStatus === 'SHIPPED'
                                ? 'text-yellow-600'
                                : 'text-muted-foreground'
                              }`}>
                              Out for Delivery
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {order.deliveryStatus === 'DELIVERED'
                                ? 'Package was out for delivery'
                                : order.deliveryStatus === 'SHIPPED'
                                  ? 'Package will be out for delivery soon'
                                  : 'Awaiting shipment'}
                            </p>
                          </div>
                        </div>

                        {/* Step 4: Delivered */}
                        <div className="relative flex items-start gap-4">
                          <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${order.deliveryStatus === 'DELIVERED'
                            ? 'bg-green-500 border-green-500'
                            : 'bg-background border-border'
                            }`}>
                            {order.deliveryStatus === 'DELIVERED' ? (
                              <CheckCircle className="h-4 w-4 text-white" />
                            ) : (
                              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <h4 className={`font-semibold ${order.deliveryStatus === 'DELIVERED'
                              ? 'text-green-600'
                              : 'text-muted-foreground'
                              }`}>
                              Delivered
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {order.statusHistory?.find(h => h.toStatus === 'DELIVERED')
                                ? formatDate(order.statusHistory.find(h => h.toStatus === 'DELIVERED')!.timestamp)
                                : order.deliveryStatus === 'DELIVERED'
                                  ? 'Successfully delivered'
                                  : 'Not yet delivered'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Estimated Delivery (if not delivered) */}
                      {order.deliveryStatus !== 'DELIVERED' && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-blue-900 mb-1">Estimated Delivery</h4>
                              <p className="text-sm text-blue-700">
                                {order.deliveryStatus === 'PENDING'
                                  ? 'Delivery date will be confirmed after order confirmation'
                                  : order.deliveryStatus === 'CONFIRMED'
                                    ? 'Estimated 3-5 business days after shipment'
                                    : order.deliveryStatus === 'SHIPPED'
                                      ? 'Expected within 2-3 business days'
                                      : 'To be confirmed'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Delivery Success Message */}
                      {order.deliveryStatus === 'DELIVERED' && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-green-900 mb-1">Order Delivered Successfully!</h4>
                              <p className="text-sm text-green-700">
                                Your order has been delivered. Thank you for shopping with us!
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Proof Card */}
                {order.deliveryProofUrl && (
                  <Card className="border-green-200 bg-green-50/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Delivery Proof
                      </CardTitle>
                      <CardDescription>
                        Photo evidence of delivery uploaded by seller
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Delivery Photo */}
                      <div className="relative rounded-lg overflow-hidden border-2 border-green-200">
                        <img
                          src={order.deliveryProofUrl}
                          alt="Delivery Proof"
                          className="w-full h-auto max-h-96 object-contain bg-white"
                        />
                      </div>

                      {/* Delivery Details */}
                      <div className="space-y-2">
                        {order.deliveredAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Delivered on:</span>
                            <span className="font-medium">{formatDate(order.deliveredAt)}</span>
                          </div>
                        )}

                        {order.deliveryNotes && (
                          <div className="p-3 bg-white border border-green-200 rounded-lg">
                            <p className="text-sm font-medium text-green-900 mb-1">Delivery Notes:</p>
                            <p className="text-sm text-green-700">{order.deliveryNotes}</p>
                          </div>
                        )}

                        {order.deliveryProofIpfsCid && (
                          <div className="flex items-center gap-2 p-3 bg-white border border-green-200 rounded-lg">
                            <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-green-900 mb-1">Stored on IPFS</p>
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {order.deliveryProofIpfsCid}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`https://ipfs.io/ipfs/${order.deliveryProofIpfsCid}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <img
                            src={item.product.imageUrl || '/placeholder-product.jpg'}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{item.product.name}</h4>

                            {/* Show single producer or multi-producer info */}
                            {!item.product.producers || item.product.producers.length <= 1 ? (
                              <p className="text-sm text-muted-foreground mt-1">
                                Seller: {item.product.producer?.businessName || 'Unknown Seller'}
                              </p>
                            ) : (
                              <div className="space-y-2 mt-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    <Users className="h-3 w-3 mr-1" />
                                    Shared Product
                                  </Badge>
                                </div>
                                <div className="text-sm space-y-1">
                                  <p className="font-medium text-muted-foreground">Producers:</p>
                                  {item.product.producers.map((producer) => {
                                    const isCurrentUser = user?.role === 'PRODUCER' &&
                                      order.items.some(i => i.product.producer?.user?.email === user.email);
                                    const isThisProducer = producer.businessName === item.product.producer?.businessName;

                                    return (
                                      <div key={producer.id} className="flex items-center gap-2 text-xs">
                                        <span className={isThisProducer && isCurrentUser ? 'font-bold text-blue-600' : 'text-muted-foreground'}>
                                          • {producer.businessName} ({producer.sharePercentage}%)
                                          {producer.role && ` - ${producer.role}`}
                                          {isThisProducer && isCurrentUser && ' - You'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm">Qty: {item.quantity}</span>
                              <span className="text-sm">Price: {formatPrice(item.product.price)}</span>
                            </div>

                            {/* Show producer's earnings if available */}
                            {item.producerShare !== undefined && user?.role === 'PRODUCER' && (
                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                                <p className="text-green-700">
                                  <span className="font-medium">Your Earnings:</span> {formatPrice(item.producerShare)}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
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

                    {/* Producer Earnings Summary */}
                    {user?.role === 'PRODUCER' && order.producerShare !== undefined && order.isSharedProduct && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Your Earnings Summary
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-700">Order Total:</span>
                            <span className="text-blue-900 font-medium">{formatPrice(order.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Your Share (before commission):</span>
                            <span className="text-blue-900 font-medium">{formatPrice(order.producerShare / 0.9)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Platform Commission (10%):</span>
                            <span className="text-red-600 font-medium">-{formatPrice((order.producerShare / 0.9) * 0.1)}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-bold">
                            <span className="text-blue-900">Your Net Earnings:</span>
                            <span className="text-green-600 text-lg">{formatPrice(order.producerShare)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-blue-600 mt-3">
                          This is a shared product. The order total is split among all producers based on their share percentages.
                        </p>
                      </div>
                    )}
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

                {/* Payment Link */}
                {isBuyer && order.paymentStatus !== 'CONFIRMED' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ExternalLink className="h-5 w-5" />
                        Payment Link
                      </CardTitle>
                      <CardDescription>Generate a secure payment link to complete this order</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {paymentIntent ? (
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Payment Reference</p>
                            <p className="font-mono text-sm break-all">{paymentIntent.paymentReference}</p>
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => window.open(paymentIntent.paymentUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Payment Portal
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Share this link with the buyer or open it to pay using your preferred method.
                          </p>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleCreatePaymentLink}
                          disabled={creatingPaymentLink}
                        >
                          {creatingPaymentLink ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Generating Link...
                            </>
                          ) : (
                            'Generate Payment Link'
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Blockchain Verification */}
                <Card className={order.blockchainTxHash ? "border-green-200 bg-green-50/30" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Blockchain Verification
                    </CardTitle>
                    <CardDescription>
                      Immutable record on Polygon Amoy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {order.blockchainTxHash ? (
                      <>
                        {/* Verification Status */}
                        <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-700 mb-1">Verified on Blockchain</p>
                            <p className="text-xs text-green-600">Permanently recorded and immutable</p>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        {/* Transaction Details */}
                        <div className="space-y-3">
                          {/* Transaction Hash */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground block">Transaction Hash</label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted p-3 rounded-md text-xs font-mono break-all">
                                {order.blockchainTxHash}
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                className="flex-shrink-0 h-10 w-10"
                                onClick={() => copyTxHash(order.blockchainTxHash!)}
                                title="Copy transaction hash"
                              >
                                {copiedTxHash ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Block Number & Timestamp */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground block">Block Number</label>
                              <p className="text-sm font-semibold">
                                {order.blockchainRecords && order.blockchainRecords.length > 0 && order.blockchainRecords[0].blockNumber
                                  ? `#${order.blockchainRecords[0].blockNumber}`
                                  : 'Confirming...'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground block">Recorded</label>
                              <p className="text-sm font-semibold">
                                {order.blockchainRecordedAt
                                  ? new Date(order.blockchainRecordedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                  : order.blockchainRecords && order.blockchainRecords.length > 0
                                    ? new Date(order.blockchainRecords[0].timestamp).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                    : 'Recently'}
                              </p>
                            </div>
                          </div>

                          {/* Multi-Producer Info */}
                          {order.items.some(item => item.product.producers && item.product.producers.length > 1) && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">Multi-Producer Order</span>
                              </div>
                              <p className="text-xs text-blue-700">
                                All {order.items[0].product.producers?.length || 0} producers are recorded on blockchain
                              </p>
                            </div>
                          )}

                          {/* Immutable Badge */}
                          <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg mt-2">
                            <Shield className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-bold text-green-700 tracking-wide">IMMUTABLE RECORD</span>
                          </div>
                        </div>

                        {/* View on Explorer Button */}
                        <Button
                          variant="default"
                          size="default"
                          className="w-full mt-4"
                          onClick={() => window.open(getPolygonscanUrl(order.blockchainTxHash!), '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on Polygonscan Explorer
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-center">
                        <Clock className="h-8 w-8 text-yellow-600 mb-2 animate-pulse" />
                        <p className="text-sm font-medium text-yellow-700">Pending Blockchain Recording</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your order will be recorded on blockchain shortly
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact Information */}

                <Card>
                  <CardHeader>
                    <CardTitle>Contact & Support</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isProducer && order?.buyer ? (
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

                        {/* Show Dispute Chat if dispute exists */}
                        {order.dispute && (
                          <>
                            <Separator className="my-2" />
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                              onClick={handleDisputeChat}
                              disabled={checkingDispute}
                            >
                              {checkingDispute ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <AlertCircle className="h-4 w-4 mr-2" />
                              )}
                              Dispute Chat ({order.dispute.status})
                            </Button>
                          </>
                        )}
                      </>
                    ) : order?.items[0]?.product.producer && (
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

                        {/* Regular Contact Button - ALWAYS SHOW */}
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

                        {/* SIMPLIFIED DISPUTE BUTTON LOGIC */}
                        <Separator className="my-2" />

                        {/* Show Dispute Chat if dispute exists */}
                        {order.dispute ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                            onClick={handleDisputeChat}
                            disabled={checkingDispute}
                          >
                            {checkingDispute ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <AlertCircle className="h-4 w-4 mr-2" />
                            )}
                            Dispute Chat ({order.dispute.status})
                          </Button>
                        ) : (
                          /* Show Raise Dispute button if no dispute exists */
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={handleOpenDisputeModal}
                            disabled={order.deliveryStatus === 'PENDING'}
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Raise Dispute
                            {order.deliveryStatus === 'PENDING' && (
                              <span className="ml-1 text-xs">(Available after confirmation)</span>
                            )}
                          </Button>
                        )}

                        {/* Show info text if order is pending */}
                        {order.deliveryStatus === 'PENDING' && !order.dispute && (
                          <p className="text-xs text-muted-foreground text-center mt-1">
                            Disputes can be raised after order is confirmed
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Delivery Proof Upload Modal */}
      {showDeliveryProofModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Mark as Delivered
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeliveryProofModal(false)}
                  disabled={uploadingProof}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Upload proof of delivery to complete this order
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Delivery Proof Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Delivery Photo *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDeliveryProofFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="delivery-proof-upload"
                    disabled={uploadingProof}
                  />
                  <label htmlFor="delivery-proof-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload delivery photo
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum 10MB • JPG, PNG, WEBP
                    </p>
                  </label>
                </div>

                {deliveryProofFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                          {deliveryProofFile.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeliveryProofFile(null)}
                        disabled={uploadingProof}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      {(deliveryProofFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>

              {/* Delivery Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Delivery Notes (Optional)
                </label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Add any notes about the delivery (e.g., handed to customer, left at door, etc.)"
                  className="w-full p-2 border rounded-md min-h-[80px]"
                  disabled={uploadingProof}
                />
              </div>

              {/* Info Box */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">Secure Storage</p>
                    <p>Your delivery proof will be stored on IPFS (decentralized storage) and linked to the blockchain record for permanent verification.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeliveryProofModal(false)}
                disabled={uploadingProof}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeliveryProofUpload}
                disabled={uploadingProof || !deliveryProofFile}
                className="bg-green-600 hover:bg-green-700"
              >
                {uploadingProof ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading to IPFS...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Delivered
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Creation Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Raise Dispute
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDisputeModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Order #{order?.id.slice(-8)} - {order?.items[0]?.product.name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Dispute Reason */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Reason for Dispute *
                </label>
                <select
                  value={disputeForm.reason}
                  onChange={(e) => setDisputeForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select a reason</option>
                  {DISPUTE_REASONS.map(reason => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
                {selectedReason && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedReason.description}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Detailed Description *
                </label>
                <textarea
                  value={disputeForm.description}
                  onChange={(e) => setDisputeForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please describe the issue in detail..."
                  className="w-full p-2 border rounded-md min-h-[100px]"
                  required
                />
              </div>

              {/* Desired Resolution */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Desired Resolution
                </label>
                <select
                  value={disputeForm.desiredResolution}
                  onChange={(e) => setDisputeForm(prev => ({ ...prev, desiredResolution: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select desired resolution</option>
                  {RESOLUTION_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Evidence Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Supporting Evidence
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => handleEvidenceUpload(e.target.files)}
                    className="hidden"
                    id="evidence-upload"
                  />
                  <label htmlFor="evidence-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload evidence (images, PDFs)
                    </p>
                    <p className="text-xs text-gray-500">
                      Maximum 10MB per file
                    </p>
                  </label>
                </div>

                {/* Uploaded Files Preview */}
                {disputeForm.evidence.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium">Uploaded Files:</p>
                    {disputeForm.evidence.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEvidence(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {creatingDispute && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading evidence...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDisputeModal(false)}
                disabled={creatingDispute}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateDispute}
                disabled={creatingDispute || !disputeForm.reason || !disputeForm.description}
                className="bg-red-600 hover:bg-red-700"
              >
                {creatingDispute ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting Dispute...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Submit Dispute
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
};

export default OrderDetail;