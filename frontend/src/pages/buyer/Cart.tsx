// src/pages/buyer/Cart.tsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowLeft,
  Truck,
  Shield,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { productService } from '@/services/productService';

const Cart: React.FC = () => {
  const { state, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Validate stock on cart load
  useEffect(() => {
    const validateStock = async () => {
      if (state.items.length === 0) return;

      for (const item of state.items) {
        try {
          const product = await productService.getProductById(item.productId);
          const currentStock = product.quantityAvailable || product.stock || 0;

          if (currentStock === 0) {
            toast({
              title: "Item out of stock",
              description: `${item.name} is no longer available and has been removed`,
              variant: "destructive"
            });
            removeFromCart(item.id);
          } else if (item.quantity > currentStock) {
            toast({
              title: "Stock updated",
              description: `${item.name} quantity adjusted to ${currentStock} (available stock)`,
            });
            updateQuantity(item.id, currentStock);
          }
        } catch (error) {
          console.error('Failed to validate stock for item:', item.id, error);
        }
      }
    };

    validateStock();
  }, []); // Run once on mount

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleRemoveItem = (id: string, name: string) => {
    removeFromCart(id);
    toast({
      title: "Item removed",
      description: `${name} has been removed from your cart`,
    });
  };

  const handleClearCart = () => {
    if (state.items.length > 0) {
      clearCart();
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to proceed with checkout",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  // Calculate totals
  const subtotal = state.total;
  const shippingCost = subtotal > 0 ? 50 : 0; // Fixed shipping for demo
  const tax = subtotal * 0.15; // 15% tax for demo
  const finalTotal = subtotal + shippingCost + tax;

  if (state.items.length === 0) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="Shopping Cart" description="Your cart is empty" />
            <main className="flex-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="relative mb-8">
                <ShoppingCart className="h-24 w-24 text-muted-foreground" />
                <div className="absolute -top-2 -right-2">
                  <Badge variant="secondary" className="px-2 py-1 text-xs">
                    0
                  </Badge>
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Your Cart is Empty
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-md">
                Discover amazing local products from Ethiopian producers and fill your cart with quality goods!
              </p>
              <div className="flex gap-4">
                <Link to="/marketplace">
                  <Button size="lg" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Explore Marketplace
                  </Button>
                </Link>
                <Link to="/products">
                  <Button variant="outline" size="lg" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Continue Shopping
                  </Button>
                </Link>
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
            title="Shopping Cart"
            description={`${state.itemCount} ${state.itemCount === 1 ? 'item' : 'items'} in your cart`}
          />
          <main className="flex-1 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                {/* Cart Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Your Items</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCart}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                </div>

                {/* Cart Items List */}
                <Card className="shadow-lg border-0">
                  <CardContent className="p-0 divide-y divide-border">
                    {state.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-6 p-6 hover:bg-muted/50 transition-colors">
                        {/* Product Image */}
                        <Link to={`/products/${item.productId}`} className="flex-shrink-0">
                          <img
                            src={item.image || '/placeholder-product.jpg'}
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded-lg shadow-md hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        </Link>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <Link to={`/products/${item.productId}`}>
                              <h3 className="font-semibold text-lg leading-tight hover:text-primary transition-colors cursor-pointer">{item.name}</h3>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">{item.region}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-2xl font-bold text-primary">
                              {item.price} ETB
                            </div>
                            <div className="text-sm text-muted-foreground">
                              per {item.unit}
                            </div>
                          </div>

                          {/* Stock Info */}
                          <div className="text-sm">
                            {item.quantity >= item.stock ? (
                              <span className="text-destructive font-medium">
                                Only {item.stock} left in stock
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                {item.stock} available
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="h-8 w-8"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              className="w-16 text-center h-8"
                              type="number"
                              min="1"
                              max={item.stock}
                              value={item.quantity}
                              onChange={(e) => {
                                const newQuantity = parseInt(e.target.value) || 1;
                                const validQuantity = Math.min(Math.max(newQuantity, 1), item.stock);
                                handleQuantityChange(item.id, validQuantity);
                              }}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="h-8 w-8"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Item Total */}
                          <div className="text-right min-w-24">
                            <div className="text-lg font-semibold">
                              {item.price * item.quantity} ETB
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.quantity} × {item.price}
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id, item.name)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24 shadow-xl border-0 bg-gradient-to-br from-background to-muted/30">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Order Summary
                    </CardTitle>
                    <CardDescription>
                      Review your order details
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Price Breakdown */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal ({state.itemCount} items)</span>
                        <span className="font-medium">{subtotal.toFixed(2)} ETB</span>
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

                      <div className="border-t pt-3">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span className="text-primary">{finalTotal.toFixed(2)} ETB</span>
                        </div>
                      </div>
                    </div>

                    {/* Security Badge */}
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm text-primary font-medium">Secure checkout</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Link to="/checkout" className="block">
                        <Button
                          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-amber-200 dark:hover:shadow-amber-800 transition-all duration-300"
                          size="lg"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Proceed to Checkout
                        </Button>
                      </Link>

                      <Link to="/marketplace" className="block">
                        <Button variant="outline" className="w-full" size="lg">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Continue Shopping
                        </Button>
                      </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div className="pt-4 border-t text-center">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>🔒 Secure payment processing</p>
                        <p>🚚 Fast delivery across Ethiopia</p>
                        <p>⭐ Blockchain-verified transactions</p>
                      </div>
                    </div>
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

export default Cart;