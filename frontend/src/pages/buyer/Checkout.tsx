// src/pages/buyer/Checkout.tsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  MapPin, 
  User,
  Phone,
  Mail,
  ShoppingCart,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { paymentService } from '@/services/paymentService';

interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  region: string;
  additionalInfo?: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { state: cartState, clearCart } = useCart();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'chapa' | 'arifpay'>('chapa');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    city: '',
    region: '',
    additionalInfo: ''
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (cartState.items.length === 0 && isAuthenticated) {
      toast({
        title: "Cart is empty",
        description: "Add some products to your cart before checkout",
        variant: "destructive",
      });
      navigate('/cart');
    }
  }, [cartState.items.length, isAuthenticated, navigate, toast]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to proceed with checkout",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [isAuthenticated, navigate, toast]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Redirecting...</span>
      </div>
    );
  }

  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button onClick={() => navigate('/marketplace')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const subtotal = cartState.total;
  const shippingCost = 50; // Fixed shipping for Ethiopia
  const tax = subtotal * 0.15; // 15% VAT
  const finalTotal = subtotal + shippingCost + tax;

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof ShippingAddress)[] = ['fullName', 'phone', 'email', 'address', 'city', 'region'];
    
    for (const field of requiredFields) {
      if (!shippingAddress[field]?.trim()) {
        toast({
          title: "Missing information",
          description: `Please fill in your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          variant: "destructive",
        });
        return false;
      }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingAddress.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    // Basic phone validation (Ethiopian format)
    const phoneRegex = /^(\+251|0)(9|7)\d{8}$/;
    if (!phoneRegex.test(shippingAddress.phone.replace(/\s/g, ''))) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid Ethiopian phone number",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      console.log('🔍 DEBUG: Starting checkout process...');

      // 1. Prepare order data
      const orderData = {
        items: cartState.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress,
        totalAmount: finalTotal
      };

      console.log('🔍 DEBUG: Order data prepared:', orderData);

      // 2. Create order using your paymentService (which will call the backend)
      console.log('🔍 DEBUG: Creating payment intent with order data...');
      
      // FIXED: Use the correct service method with proper parameters
      const paymentResult = await paymentService.createPayment({
        orderData, // Send the full order data
        paymentMethod, // Include payment method
        customerInfo: {
          name: shippingAddress.fullName,
          email: shippingAddress.email,
          phone: shippingAddress.phone
        }
      });

      console.log('🔍 DEBUG: Payment result:', paymentResult);

      if (paymentResult?.paymentUrl) {
        // Clear cart before redirecting to payment
        clearCart();
        window.location.href = paymentResult.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }

    } catch (error: any) {
      console.error('❌ DEBUG: Checkout failed:', error);
      toast({
        title: "Checkout failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-4">
            {cartState.itemCount} {cartState.itemCount === 1 ? 'item' : 'items'}
          </Badge>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Checkout
          </h1>
          <p className="text-muted-foreground text-lg">
            Complete your purchase securely
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Shipping & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Shipping Information
                </CardTitle>
                <CardDescription>
                  Enter your delivery details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      value={shippingAddress.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      value={shippingAddress.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+251 9XX XXX XXX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </Label>
                    <Input
                    id="email"
                    type="email"
                    value={shippingAddress.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address *</Label>
                  <Input
                    id="address"
                    value={shippingAddress.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Street address, building, floor"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="e.g., Addis Ababa"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="region">Region *</Label>
                    <Input
                      id="region"
                      value={shippingAddress.region}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                      placeholder="e.g., Oromia"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                  <Input
                    id="additionalInfo"
                    value={shippingAddress.additionalInfo}
                    onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                    placeholder="Delivery instructions, landmarks, etc."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </CardTitle>
                <CardDescription>
                  Choose how you want to pay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'chapa' 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentMethod('chapa')}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Chapa Payment</div>
                      <div className="text-sm text-muted-foreground">
                        Credit/Debit Cards, Mobile Money, Bank Transfer
                      </div>
                    </div>
                    {paymentMethod === 'chapa' && (
                      <Badge variant="default" className="bg-green-500">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>

                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'arifpay' 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentMethod('arifpay')}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                      <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">ArifPay</div>
                      <div className="text-sm text-muted-foreground">
                        Fast and secure payments
                      </div>
                    </div>
                    {paymentMethod === 'arifpay' && (
                      <Badge variant="default" className="bg-green-500">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="shadow-xl border-0 sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cartState.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 pb-3 border-b">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.quantity} × {item.price} ETB
                        </div>
                      </div>
                      <div className="font-semibold text-sm">
                        {item.price * item.quantity} ETB
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)} ETB</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Truck className="h-3 w-3" />
                      Shipping
                    </span>
                    <span>{shippingCost.toFixed(2)} ETB</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Tax (15%)</span>
                    <span>{tax.toFixed(2)} ETB</span>
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">{finalTotal.toFixed(2)} ETB</span>
                    </div>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary font-medium">
                    Secure payment • Blockchain verified
                  </span>
                </div>

                {/* Checkout Button */}
                <Button
                  variant="default"
                  size="lg"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-amber-200 dark:hover:shadow-amber-800 transition-all duration-300"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${finalTotal.toFixed(2)} ETB`
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By completing your purchase, you agree to our terms of service and privacy policy
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