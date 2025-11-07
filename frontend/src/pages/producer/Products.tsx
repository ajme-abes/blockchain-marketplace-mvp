import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Plus, Edit, Trash2, Eye } from 'lucide-react';

const Products = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
    if (user?.role !== 'PRODUCER') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  if (!user || user.role !== 'PRODUCER') return null;

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

  // FIX: Add product navigation handler
  const handleAddProduct = () => {
    navigate('/products/add'); // Fixed route path
  };

  // FIX: Edit product navigation handler
  const handleEditProduct = (productId: string) => {
    navigate(`/products/edit/${productId}`); // Fixed route path
  };

  // FIX: View product handler
  const handleViewProduct = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  // FIX: Delete product handler
  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      console.log('Deleting product:', productId);
      // TODO: Implement actual delete functionality
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader title="My Products" />

          <main className="flex-1 p-6">
            <div className="flex justify-end mb-4">
              {/* FIX: Added onClick handler */}
              <Button onClick={handleAddProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
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
                        {/* FIX: Added onClick handlers to all buttons */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleViewProduct(product.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEditProduct(product.id)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
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
                    {/* FIX: Added onClick handler to empty state button */}
                    <Button onClick={handleAddProduct}>
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

export default Products;