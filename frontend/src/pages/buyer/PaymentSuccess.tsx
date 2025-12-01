import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, Shield, Download, Copy, ExternalLink, AlertCircle, Camera, FileDown } from 'lucide-react';
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
      producers?: Array<{
        id: string;
        businessName: string;
        sharePercentage?: number;
      }>;
    };
    quantity: number;
    subtotal: number;
  }>;
}

const PaymentSuccess = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [loadError, setLoadError] = useState<'auth' | 'error' | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Get payment reference from URL params or order data
  const paymentReference = searchParams.get('reference') ||
    searchParams.get('paymentReference') ||
    searchParams.get('tx_ref') ||
    searchParams.get('trx_ref') ||
    '';

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.request(`/orders/${orderId}`);
      setOrder(response.data);
      setLoadError(null);
    } catch (error: any) {
      console.error('Failed to fetch order:', error);
      const message = error?.message || '';
      if (message.toLowerCase().includes('unauthorized') || message.includes('401')) {
        setLoadError('auth');
      } else {
        setLoadError('error');
        toast({
          title: "Error",
          description: "Failed to load order details",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOnBlockchain = async () => {
    if (!order?.blockchainTxHash || !order?.id) return;

    setVerifying(true);
    try {
      // Use order ID for verification (backend expects orderId, not txHash)
      const response = await api.request(`/blockchain/verify/${order.id}`);

      if (response.data.verified) {
        toast({
          title: "✅ Verified on Blockchain",
          description: `Transaction confirmed on Polygon network. Order ID: ${order.id.substring(0, 8)}`,
        });
      } else {
        toast({
          title: "⚠️ Verification Pending",
          description: response.data.message || "Transaction is being recorded on blockchain. Please try again in a moment.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Blockchain verification error:', error);
      toast({
        title: "Verification Error",
        description: error?.response?.data?.message || "Failed to verify transaction. The blockchain service may be temporarily unavailable.",
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
    window.open(`https://amoy.polygonscan.com/tx/${txHash}`, '_blank');
  };

  // Export order details as PDF/Print
  const handleExport = () => {
    window.print();
  };

  // Take screenshot using html2canvas
  const handleScreenshot = async () => {
    if (!contentRef.current) return;

    setIsExporting(true);
    try {
      // Dynamic import to reduce bundle size
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#f9fafb'
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `order-${orderId}-receipt.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast({
            title: "Screenshot Saved",
            description: "Order receipt has been downloaded",
          });
        }
      });
    } catch (error) {
      console.error('Screenshot error:', error);
      toast({
        title: "Error",
        description: "Failed to capture screenshot. Try using browser print instead.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
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
        {/* Export/Screenshot Buttons - Fixed at top */}
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleScreenshot}
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Capturing...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Screenshot
              </>
            )}
          </Button>
        </div>

        {/* Content to be exported/printed */}
        <div ref={contentRef}>
          {/* Success Header */}
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-6 text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h1 className="text-3xl font-bold text-green-800 mb-2">Payment Successful!</h1>
                <p className="text-green-600 text-lg">
                  Your order has been confirmed and is being processed
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Order #{(order?.id || orderId || '').toString().substring(0, 8).toUpperCase()}
              </Badge>

              {/* Payment Reference - Always show */}
              <div className="text-left space-y-2">
                <p className="text-sm font-medium text-green-900">Payment Reference</p>
                <div className="flex items-center justify-between bg-white/70 border border-green-100 rounded-lg px-3 py-2">
                  {paymentReference ? (
                    <>
                      <span className="text-sm font-mono break-all text-green-800">{paymentReference}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(paymentReference)}
                        className="print:hidden"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Reference will be available shortly</span>
                    </div>
                  )}
                </div>

                {/* Order Date */}
                {order && (
                  <div className="pt-2">
                    <p className="text-xs text-green-700">
                      Order Date: {new Date(order.orderDate).toLocaleString('en-ET', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {/* Order Summary */}
            {order ? (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Summary
                  </h2>

                  <div className="space-y-3 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start py-3 border-b">
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>

                          {/* Show producers for multi-producer products */}
                          {item.product.producers && item.product.producers.length > 1 && (
                            <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                              <span className="text-xs text-muted-foreground">Producers:</span>
                              {item.product.producers.map((producer, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {producer.businessName}
                                  {producer.sharePercentage && (
                                    <span className="ml-1 text-blue-600">({producer.sharePercentage}%)</span>
                                  )}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Show single producer */}
                          {item.product.producers && item.product.producers.length === 1 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              By {item.product.producers[0].businessName}
                            </p>
                          )}

                          <p className="text-sm text-muted-foreground mt-1">
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
            ) : (
              <Card>
                <CardContent className="p-6 text-center space-y-3">
                  <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    {loadError === 'auth'
                      ? 'Sign in to view detailed order information.'
                      : 'We could not load the full order details right now.'}
                  </p>
                  <div className="flex flex-col gap-2">
                    {loadError === 'auth' && (
                      <Button onClick={() => navigate('/login')}>
                        Go to Login
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => navigate('/orders')}>
                      View Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Blockchain Verification - Always show */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Blockchain Verification
                </h2>

                {order?.blockchainTxHash ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-blue-900 mb-1">Transaction Hash</p>
                          <p className="text-xs font-mono text-blue-700 break-all">
                            {order.blockchainTxHash}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-2 print:hidden">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(order.blockchainTxHash!)}
                            title="Copy transaction hash"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPolygonScan(order.blockchainTxHash!)}
                            title="View on PolygonScan"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <CheckCircle className="h-4 w-4" />
                        <span>Transaction recorded on Polygon blockchain</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={verifyOnBlockchain}
                        disabled={verifying}
                        className="w-full print:hidden"
                        variant="outline"
                      >
                        {verifying ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Verify on Blockchain
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Click to verify this transaction exists on the Polygon blockchain
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center justify-center gap-2 text-amber-800 mb-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                        <p className="font-medium">Blockchain recording in progress...</p>
                      </div>
                      <p className="text-sm text-amber-700">
                        Your transaction is being recorded on the blockchain. This usually takes 1-2 minutes.
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground text-center">
                      <p>Refresh this page in a moment to see the blockchain transaction hash</p>
                    </div>
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
            <div className="flex gap-4 print:hidden">
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
        {/* End of content to be exported */}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccess;