import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Eye } from 'lucide-react';

const Orders = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  const isProducer = user.role === 'PRODUCER';

  // Different mock data for buyers vs producers
  const mockOrders = isProducer ? [
    {
      id: '1',
      productName: 'Premium Coffee Beans',
      quantity: '10 kg',
      totalPrice: '3,500 ETB',
      status: 'delivered',
      date: '2024-03-15',
      buyer: 'John Doe',
    },
    {
      id: '2',
      productName: 'Organic Honey',
      quantity: '5 kg',
      totalPrice: '1,250 ETB',
      status: 'shipped',
      date: '2024-03-18',
      buyer: 'Sarah Smith',
    },
    {
      id: '3',
      productName: 'Fresh Teff',
      quantity: '25 kg',
      totalPrice: '2,750 ETB',
      status: 'processing',
      date: '2024-03-20',
      buyer: 'Mike Johnson',
    },
  ] : [
    {
      id: '1',
      productName: 'Premium Coffee Beans',
      quantity: '10 kg',
      totalPrice: '3,500 ETB',
      status: 'delivered',
      date: '2024-03-15',
      seller: 'Abebe Farms',
    },
    {
      id: '2',
      productName: 'Organic Honey',
      quantity: '5 kg',
      totalPrice: '1,250 ETB',
      status: 'shipped',
      date: '2024-03-18',
      seller: 'Tigist Bee Farm',
    },
    {
      id: '3',
      productName: 'Fresh Teff',
      quantity: '25 kg',
      totalPrice: '2,750 ETB',
      status: 'processing',
      date: '2024-03-20',
      seller: 'Kebede Agricultural',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500/10 text-green-600 hover:bg-green-500/20';
      case 'shipped':
        return 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20';
      case 'processing':
        return 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader title={isProducer ? 'My Sales Orders' : 'My Orders'} />

          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {mockOrders.map((order) => (
                <Card key={order.id} className="shadow-card">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{order.productName}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Order #{order.id} • {order.date}
                        </p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {isProducer ? 'Buyer' : 'Seller'}
                        </p>
                        <p className="font-medium">
                          {isProducer ? (order as any).buyer : (order as any).seller}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <p className="font-medium">{order.quantity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Price</p>
                        <p className="font-medium text-primary">{order.totalPrice}</p>
                      </div>
                      <div className="flex items-end">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {mockOrders.length === 0 && (
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
    </SidebarProvider>
  );
};

export default Orders;
