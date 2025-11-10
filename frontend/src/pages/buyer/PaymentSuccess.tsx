import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Package, Shield, Download, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface OrderDetails {
  id: string;
  totalAmount: number;
  paymentStatus: string;
  deliveryStatus: string;
  orderDate: string;
  blockchainTxHash?: string;
  blockchainRecord?: {
    txHash: string;
    status: string;
    timestamp: string;
  };
  items: Array<{
    product: {
      name: string;
      price: number;
    };
    quantity: number;
    subtotal: number;
  }>;
}

const PaymentSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.request(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOnBlockchain = async () => {
    if (!order?.blockchainTxHash) return;
    
    setVerifying(true);
    try {
      const response = await api.request(`/blockchain/verify/${order.blockchainTxHash}`);
      
      if (response.data.verified) {
        toast({
          title: "Verified on Blockchain",
          description: "Transaction confirmed on Polygon network",
          variant: "default",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "Could not verify transaction on blockchain",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Failed to verify transaction",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const openPolygonScan = (txHash: string) => {
    window.open(`https://mumbai.polygonscan.com/tx/${txHash}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <Button onClick={() => navigate('/orders')}>View All Orders</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Success Header */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-green-800 mb-2">Payment Successful!</h1>
            <p className="text-green-600 text-lg mb-4">
              Your order has been confirmed and is being processed
            </p>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Order #{order.id.substring(0, 8).toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {/* Order Summary */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </h2>
              
              <div className="space-y-3 mb-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × {item.product.price} ETB
                      </p>
                    </div>
                    <p className="font-semibold">{item.subtotal} ETB</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-green-600">{order.totalAmount} ETB</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Verification */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Blockchain Verification
              </h2>

              {order.blockchainTxHash ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">Transaction Hash</p>
                      <p className="text-xs font-mono text-blue-600 truncate">
                        {order.blockchainTxHash}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(order.blockchainTxHash!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPolygonScan(order.blockchainTxHash!)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={verifyOnBlockchain}
                    disabled={verifying}
                    className="w-full"
                  >
                    {verifying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      'Verify on Blockchain'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-800">
                    Blockchain recording in progress...
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">
                    This may take a few moments
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">What's Next?</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  <p>You will receive an email confirmation with order details</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  <p>The producer will contact you to confirm delivery details</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs font-bold">3</span>
                  </div>
                  <p>Track your order status in your orders page</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/marketplace">
                Continue Shopping
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link to="/orders">
                View All Orders
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;