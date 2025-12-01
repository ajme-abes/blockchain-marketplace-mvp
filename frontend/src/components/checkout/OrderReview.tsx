// src/components/checkout/OrderReview.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import {
    MapPin,
    CreditCard,
    ShoppingCart,
    Edit,
    Truck,
    ShieldCheck
} from 'lucide-react';

interface ShippingAddress {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    region: string;
    additionalInfo?: string;
}

interface OrderReviewProps {
    shippingAddress: ShippingAddress;
    paymentMethod: 'chapa' | 'arifpay';
    onConfirm: () => void;
    onEdit: () => void;
    isProcessing: boolean;
}

export const OrderReview: React.FC<OrderReviewProps> = ({
    shippingAddress,
    paymentMethod,
    onConfirm,
    onEdit,
    isProcessing
}) => {
    const { state } = useCart();

    const subtotal = state.total;
    const shippingCost = 50;
    const tax = subtotal * 0.15;
    const finalTotal = subtotal + shippingCost + tax;

    return (
        <div className="space-y-6">
            <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            Review Your Order
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={onEdit}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Shipping Address */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold">Shipping Address</h3>
                        </div>
                        <div className="text-sm space-y-1 ml-6">
                            <p className="font-medium">{shippingAddress.fullName}</p>
                            <p className="text-muted-foreground">{shippingAddress.phone}</p>
                            <p className="text-muted-foreground">{shippingAddress.email}</p>
                            <p className="text-muted-foreground">{shippingAddress.address}</p>
                            <p className="text-muted-foreground">
                                {shippingAddress.city}, {shippingAddress.region}
                            </p>
                            {shippingAddress.additionalInfo && (
                                <p className="text-muted-foreground italic">
                                    Note: {shippingAddress.additionalInfo}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold">Payment Method</h3>
                        </div>
                        <div className="ml-6">
                            <Badge variant="secondary" className="capitalize">
                                {paymentMethod === 'chapa' ? 'Chapa Payment' : 'ArifPay'}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-2">
                                {paymentMethod === 'chapa'
                                    ? 'Credit/Debit Cards, Mobile Money, Bank Transfer'
                                    : 'Fast and secure payments'}
                            </p>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Order Items ({state.itemCount})
                        </h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {state.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                                >
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-16 h-16 object-cover rounded-lg"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">{item.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.quantity} {item.unit} × {item.price} ETB
                                        </div>
                                        <Badge variant="outline" className="text-xs mt-1">
                                            {item.category}
                                        </Badge>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">
                                            {(item.price * item.quantity).toFixed(2)} ETB
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Price Summary */}
                    <div className="border-t pt-4 space-y-2">
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

                        <div className="border-t pt-3 mt-3">
                            <div className="flex justify-between font-bold text-xl">
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

                    {/* Confirm Button */}
                    <Button
                        onClick={onConfirm}
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-amber-200 dark:hover:shadow-amber-800 transition-all duration-300"
                        size="lg"
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Processing...' : `Confirm and Pay ${finalTotal.toFixed(2)} ETB`}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        By confirming, you agree to our terms of service and privacy policy
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
