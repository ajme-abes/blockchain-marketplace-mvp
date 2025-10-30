import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Plus, Edit, Trash2, Eye } from 'lucide-react';

const MyProducts = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
    if (user?.role !== 'producer') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  if (!user || user.role !== 'producer') return null;

  const mockProducts = [
    {
      id: '1',
      name: 'Premium Coffee Beans',
      category: 'Coffee',
      price: '350 ETB/kg',
      stock: 100,
      status: 'published',
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e',
    },
    {
      id: '2',
      name: 'Organic Honey',
      category: 'Honey',
      price: '250 ETB/kg',
      stock: 50,
      status: 'published',
      image: 'https://images.unsplash.com/photo-1587049352846-4a222e784422',
    },
    {
      id: '3',
      name: 'Fresh Teff',
      category: 'Grains',
      price: '110 ETB/kg',
      stock: 200,
      status: 'draft',
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b',
    },
  ];

  const getStatusColor = (status: string) => {
    return status === 'published'
      ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
      : 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20';
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border flex items-center justify-between px-4 bg-background sticky top-0 z-10">
            <div className="flex items-center">
              <SidebarTrigger />
              <h1 className="text-xl font-bold ml-4">My Products</h1>
            </div>
            <Button onClick={() => navigate('/dashboard')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </header>

          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockProducts.map((product) => (
                  <Card key={product.id} className="shadow-card overflow-hidden">
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      <Badge
                        variant="outline"
                        className={`absolute top-2 right-2 ${getStatusColor(product.status)}`}
                      >
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      </Badge>
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="font-bold text-primary">{product.price}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Stock</p>
                          <p className="font-medium">{product.stock} kg</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {mockProducts.length === 0 && (
                <Card className="shadow-card">
                  <CardContent className="p-12 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first product listing to start selling.
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Product
                    </Button>
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

export default MyProducts;
