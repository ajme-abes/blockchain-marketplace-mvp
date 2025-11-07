import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, CreditCard } from 'lucide-react';
import { mockProducts } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const Checkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const product = mockProducts.find(p => p.id === id);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'chapa' | 'arifpay'>('chapa');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
        </div>
      </div>
    );
  }

  const total = product.price * quantity;

  const handleCheckout = async () => {
    setIsProcessing(true);
    // Mock payment initiation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockTxHash = '0x' + Math.random().toString(36).substring(2, 15);
    const mockPaymentRef = 'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    toast.success(`Payment initiated! Reference: ${mockPaymentRef}`);
    
    // Mock payment confirmation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(`Payment confirmed! Blockchain Tx: ${mockTxHash}`);
    setIsProcessing(false);
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">by {product.producerName}</p>
                    <div className="text-lg font-bold text-primary">
                      {product.price} {t('currency')}/{product.unit}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="quantity">Quantity ({product.unit})</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Available: {product.stock} {product.unit}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-smooth ${
                    paymentMethod === 'chapa' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => setPaymentMethod('chapa')}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <div>
                      <div className="font-semibold">Chapa</div>
                      <div className="text-sm text-muted-foreground">
                        Pay with Chapa - Cards, Bank Transfer, Mobile Money
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-smooth ${
                    paymentMethod === 'arifpay' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => setPaymentMethod('arifpay')}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <div>
                      <div className="font-semibold">ArifPay</div>
                      <div className="text-sm text-muted-foreground">
                        Pay with ArifPay - Fast & Secure
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="shadow-card sticky top-20">
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{total} {t('currency')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span className="font-semibold">50 {t('currency')}</span>
                </div>
                <div className="border-t pt-4 flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary">{total + 50} {t('currency')}</span>
                </div>

                {product.blockchainTxHash && (
                  <div className="bg-primary/5 rounded-lg p-3 flex items-start gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-semibold mb-1">Blockchain Verified</div>
                      <div className="text-muted-foreground">
                        This transaction will be recorded on the blockchain for transparency
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : `Pay ${total + 50} ${t('currency')}`}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By completing this purchase, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
