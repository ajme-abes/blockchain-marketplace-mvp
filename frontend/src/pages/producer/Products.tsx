import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { productService, Product } from '@/services/productService';

const Products = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'PRODUCER') {
      navigate('/dashboard');
      return;
    }
    loadProducts();
  }, [isAuthenticated, user, navigate]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading products from backend...');
      
      const response = await fetch('http://localhost:5000/api/products/my/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Backend products response:', data);
      
      // Extract products from the nested structure
      const productsData = data.data?.products || data.data || [];
      console.log('🔄 Products data extracted:', productsData);
      
      setProducts(productsData);
    } catch (error: any) {
      console.error('❌ Failed to load products:', error);
      toast({
        title: "Error loading products",
        description: error.message || "Failed to load your products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    navigate('/products/add');
  };

  const handleEditProduct = (productId: string) => {
    navigate(`/products/edit/${productId}`);
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  // In Products.tsx - Update handleDeleteProduct function
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product? It will be hidden from buyers but kept in your records.')) {
      return;
    }
  
    try {
      setDeletingId(productId);
      console.log('🗑️ Soft deleting product:', productId);
      
      await productService.deleteProduct(productId);
      
      toast({
        title: "Product deleted",
        description: "Product has been hidden from buyers",
      });
      
      // Update local state - mark as inactive instead of removing
      setProducts(prev => 
        prev.map(product => 
          product.id === productId ? { ...product, status: 'inactive' } : product
        )
      );
      
    } catch (error: any) {
      console.error('❌ Failed to delete product:', error);
      toast({
        title: "Error deleting product",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const updateProductStatus = async (productId: string, status: 'ACTIVE' | 'INACTIVE') => {
    try {
      setUpdatingStatus(productId);
      console.log('🔄 Updating product status:', productId, status);
      
      // Call the actual product service with correct status values
      const response = await fetch(`http://localhost:5000/api/products/${productId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
  
      const result = await response.json();
      console.log('✅ Status update response:', result);
      
      // Update local state immediately for better UX
      setProducts(prev => 
        prev.map(product => 
          product.id === productId ? { ...product, status: status.toLowerCase() } : product
        )
      );
      
      toast({
        title: "Status updated!",
        description: `Product is now ${status === 'ACTIVE' ? 'visible to buyers' : 'hidden from buyers'}`,
      });
      
    } catch (error: any) {
      console.error('❌ Failed to update status:', error);
      toast({
        title: "Error updating status",
        description: error.message || "Failed to update product status",
        variant: "destructive",
      });
      
      // Reload products to reset any incorrect state
      await loadProducts();
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-600 hover:bg-green-500/20';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20';
      case 'out_of_quantity':
        return 'bg-red-500/10 text-red-600 hover:bg-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'out_of_quantity':
        return 'Out of Stock';
      default:
        return status;
    }
  };

  const formatPrice = (price: number) => {
    return `${price} ETB`;
  };

  const getDisplayImage = (product: any) => {
    // ✅ SIMPLE: Use imageUrl first
    if (product.imageUrl) {
      return product.imageUrl;
    }

    // Fallback to images.url
    if (product.images?.url) {
      return product.images.url;
    }

    // Fallback to IPFS CID
    if (product.images?.ipfsCid) {
      return `https://gateway.pinata.cloud/ipfs/${product.images.ipfsCid}`;
    }

    return null;
  };

  // Transform backend product data to match frontend interface
  const transformProduct = (product: any): Product => {
    return {
      id: product.id,
      name: product.name || 'Unnamed Product',
      description: product.description || '',
      price: product.price || 0,
      category: product.category || 'other',
      region: product.region || 'Unknown',
      images: product.images || product.imageCids || [],
      producerName: product.producer?.businessName || product.producerName || 'Unknown Producer',
      producerId: product.producerId,
      verified: product.verified || false,
      rating: product.averageRating || product.rating || 0,
      quantity: product.quantityAvailable || product.quantity || 0,
      unit: product.unit || 'piece',
      status: product.status || 'active',
      createdAt: product.createdAt || product.listingDate || new Date().toISOString(),
      updatedAt: product.updatedAt || new Date().toISOString(),
      ipfsMetadata: product.ipfsMetadata,
      imageCids: product.imageCids
    };
  };

  if (!user || user.role !== 'PRODUCER') return null;

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="My Products" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading your products...</p>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Transform products for display
  const displayProducts = products.map(transformProduct);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader 
            title="My Products" 
            description="Manage your product listings and inventory"
          />

          <main className="flex-1 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  My Products ({displayProducts.length})
                </h2>
                <p className="text-muted-foreground">
                  Manage your product listings and inventory
                </p>
              </div>
              <Button onClick={handleAddProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            <div className="max-w-6xl mx-auto space-y-6">
              {displayProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayProducts.map((product) => {
                    const displayImage = getDisplayImage(product);
                    const stock = product.quantity || 0;
                    const isUpdating = updatingStatus === product.id;

                    return (
                      <Card key={product.id} className="shadow-card overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-video relative overflow-hidden">
                          {displayImage ? (
                            <img
                              src={displayImage}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Package className="h-12 w-12 text-muted-foreground" />
                              <span className="sr-only">No image available</span>
                            </div>
                          )}
                          <Badge
                            variant="outline"
                            className={`absolute top-2 right-2 ${getStatusColor(product.status)}`}
                          >
                            {getStatusDisplay(product.status)}
                          </Badge>
                          {stock === 0 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Badge variant="destructive" className="text-sm">
                                Out of Stock
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
                            {product.rating > 0 && (
                              <div className="flex items-center text-sm">
                                <span className="text-yellow-500">★</span>
                                <span className="ml-1">{product.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Price</p>
                              <p className="font-bold text-primary">{formatPrice(product.price)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Stock</p>
                              <p className="font-medium">
                                {stock} {product.unit || 'units'}
                              </p>
                            </div>
                          </div>
                          
                          {/* ✅ FIXED: Real Active/Inactive buttons */}
<div className="flex gap-1 mb-3">
  <Button
    variant={product.status === 'active' ? 'default' : 'outline'}
    size="sm"
    className="flex-1 text-xs"
    onClick={() => updateProductStatus(product.id, 'ACTIVE')}
    disabled={isUpdating || stock === 0}
  >
    {isUpdating && product.status !== 'active' ? (
      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
    ) : null}
    Active
  </Button>
  <Button
    variant={product.status === 'inactive' ? 'default' : 'outline'}
    size="sm"
    className="flex-1 text-xs"
    onClick={() => updateProductStatus(product.id, 'INACTIVE')}
    disabled={isUpdating}
  >
    {isUpdating && product.status !== 'inactive' ? (
      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
    ) : null}
    Inactive
  </Button>
</div>

                          <div className="flex gap-2">
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
disabled={deletingId === product.id}
>
{deletingId === product.id ? (
  <Loader2 className="h-3 w-3 animate-spin" />
) : (
  <Trash2 className="h-3 w-3" />
)}
</Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="shadow-card">
                  <CardContent className="p-12 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first product listing to start selling on the marketplace.
                    </p>
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