// ...existing code...
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Star, Filter, Search, X, Loader2, ShoppingCart, Eye, Zap } from 'lucide-react';
import { categories, regions } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { productService, Product } from '@/services/productService';
import { useCart } from '@/contexts/CartContext';

const Marketplace = () => {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [maxPrice, setMaxPrice] = useState<number>(10000);

  // Load real products from backend
  useEffect(() => {
    loadProducts();
  }, []);

  // Calculate max price from products
  useEffect(() => {
    if (products.length > 0) {
      const max = Math.max(...products.map(p => p.price));
      const roundedMax = Math.ceil(max / 100) * 100; // Round up to nearest 100
      setMaxPrice(roundedMax);
      setPriceRange([0, roundedMax]);
    }
  }, [products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading marketplace products...');

      const response: any = await productService.getProducts();
      console.log('✅ Marketplace products response:', response);

      // Handle different response structures
      let productsArray: any[] = [];

      if (Array.isArray(response)) {
        productsArray = response;
      } else if (response.data && Array.isArray(response.data)) {
        productsArray = response.data;
      } else if (
        response.data &&
        response.data.products &&
        Array.isArray(response.data.products)
      ) {
        productsArray = response.data.products;
      } else if (response.products && Array.isArray(response.products)) {
        productsArray = response.products;
      } else {
        console.warn('⚠️ Unexpected response structure:', response);
        productsArray = [];
      }

      console.log('🔄 Extracted products array:', productsArray);
      setProducts(productsArray);
    } catch (error: any) {
      console.error('❌ Failed to load marketplace products:', error);
      toast({
        title: 'Error loading products',
        description: error.message || 'Failed to load products',
        variant: 'destructive',
      });
      setProducts([]); // Ensure products is always an array
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filtered = (Array.isArray(products) ? products : []).filter(
    (product) => {
      if (!product) return false;

      // Check if product is active
      const isActive = product.status === 'ACTIVE' || product.status === 'active';
      if (!isActive) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          product.name?.toLowerCase().includes(query) ||
          product.producerName?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory && product.category !== selectedCategory) return false;

      // Region filter
      if (selectedRegion && product.region !== selectedRegion) return false;

      // Price range filter
      if (product.price < priceRange[0] || product.price > priceRange[1]) return false;

      return true;
    }
  );

  // Sort products
  const filteredProducts = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'newest':
      default:
        return new Date(b.listingDate).getTime() - new Date(a.listingDate).getTime();
    }
  });

  // Helper functions - simplified since backend provides clean data
  const getDisplayImage = (product: Product) => {
    return product.imageUrl || product.images?.url || 'https://via.placeholder.com/300x300?text=Product+Image';
  };

  const getProducerName = (product: Product) => {
    return product.producerName || 'Local Farmer';
  };

  const getDisplayUnit = (unit: string | undefined) => {
    if (!unit) return 'unit';

    const unitLabels: { [key: string]: string } = {
      'kg': 'kg',
      'quintal': 'quintal',
      'g': 'g',
      'ton': 'ton',
      'piece': 'piece',
      'bundle': 'bundle',
      'liter': 'L',
      'dozen': 'dozen',
      'bag': 'bag',
      'box': 'box',
      'unit': 'unit',
    };

    return unitLabels[unit.toLowerCase()] || unit;
  };

  const getRatingDisplay = (rating: number | null | undefined) => {
    const actualRating = rating || 0;
    if (actualRating === 0) {
      return { display: 'No ratings', hasRating: false };
    }
    return { display: actualRating.toFixed(1), hasRating: true };
  };

  const content = (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Marketplace</h1>
        <p className="text-muted-foreground mb-6">
          Browse verified Ethiopian products from local producers
        </p>

        {/* Search Bar - Available to all users */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products by name, producer, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-12 text-base"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5" />
                  <h2 className="font-semibold">Filters</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedCategory || ''}
                      onChange={(e) => setSelectedCategory(e.target.value || null)}
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Region</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedRegion || ''}
                      onChange={(e) => setSelectedRegion(e.target.value || null)}
                    >
                      <option value="">All Regions</option>
                      {regions.map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Price Range: {priceRange[0]} - {priceRange[1]} ETB
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={maxPrice}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full"
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedRegion(null);
                      setPriceRange([0, maxPrice]);
                      setSearchQuery('');
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                {searchQuery && (
                  <span className="ml-2">
                    for "<span className="font-semibold text-foreground">{searchQuery}</span>"
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <select
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="name">Name: A-Z</option>
                </select>

                {(searchQuery || selectedCategory || selectedRegion || priceRange[1] < maxPrice) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                      setSelectedRegion(null);
                      setPriceRange([0, maxPrice]);
                    }}
                    className="text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg mb-4">
                  {products.length === 0 ? 'No products available yet' : 'No products match your filters'}
                </p>
                {(searchQuery || selectedCategory || selectedRegion) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                      setSelectedRegion(null);
                      setPriceRange([0, maxPrice]);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const ratingInfo = getRatingDisplay(product.rating);
                  const displayUnit = getDisplayUnit(product.unit);
                  const stock = product.quantityAvailable || 0;

                  return (
                    <Card
                      key={product.id}
                      className="overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-primary/20"
                    >
                      <Link to={`/products/${product.id}`}>
                        <div className="aspect-square overflow-hidden bg-gray-100">
                          <img
                            src={getDisplayImage(product)}
                            alt={product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
                            }}
                          />
                        </div>
                      </Link>

                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1 line-clamp-2 leading-tight">{product.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">by {getProducerName(product)}</p>
                          </div>

                          {product.verified && (
                            <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Badge variant="secondary" className="capitalize text-xs">
                            {product.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {product.region || 'Local'}
                          </Badge>

                          <div className="flex items-center gap-1 text-sm ml-auto">
                            <Star
                              className={`h-4 w-4 ${ratingInfo.hasRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                }`}
                            />
                            <span className={ratingInfo.hasRating ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                              {ratingInfo.display}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-primary">
                              {product.price} ETB
                            </div>
                            <div className="text-sm text-muted-foreground">
                              /{displayUnit}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Stock:</span>
                            <span className={`font-medium ${stock === 0 ? 'text-destructive' :
                              stock < 5 ? 'text-orange-500' : 'text-green-600'
                              }`}>
                              {stock === 0 ? 'Out of stock' : `${stock} ${displayUnit} available`}
                            </span>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="p-4 pt-0">
                        <div className="w-full space-y-2">
                          {isAuthenticated && user?.role === 'BUYER' ? (
                            <>
                              <div className="grid grid-cols-3 gap-2">
                                {/* Add to Cart Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-10 flex items-center gap-1"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addToCart({
                                      productId: product.id,
                                      name: product.name,
                                      price: product.price,
                                      quantity: 1,
                                      image: getDisplayImage(product),
                                      category: product.category,
                                      region: product.region || 'Local',
                                      unit: product.unit || 'unit',
                                      stock: product.stock || product.quantityAvailable || 0,
                                      producerId: product.producer?.id || '',
                                      producerName: getProducerName(product),
                                    });
                                    toast({
                                      title: "Added to cart",
                                      description: `${product.name} has been added to your cart`,
                                    });
                                  }}
                                  disabled={!stock || stock === 0}
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                  <span className="hidden sm:inline">Cart</span>
                                </Button>

                                {/* Buy Now Button */}
                                <Link to={`/products/${product.id}`} className="block">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="h-10 w-full flex items-center gap-1"
                                  >
                                    <Zap className="h-4 w-4" />
                                    <span className="hidden sm:inline">Buy</span>
                                  </Button>
                                </Link>

                                {/* View Details Button */}
                                <Link to={`/products/${product.id}`} className="block">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-10 w-full flex items-center gap-1"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="hidden sm:inline">Details</span>
                                  </Button>
                                </Link>
                              </div>

                              {/* Stock warning for low stock items */}
                              {stock > 0 && stock < 5 && (
                                <div className="text-xs text-orange-600 text-center font-medium">
                                  Only {stock} left!
                                </div>
                              )}
                            </>
                          ) : isAuthenticated && user?.role === 'PRODUCER' ? (
                            <Link to={`/products/${product.id}`} className="block">
                              <Button variant="default" className="w-full flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                View Product Details
                              </Button>
                            </Link>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {/* Guest/Non-authenticated users */}
                              <Link to={`/products/${product.id}`} className="block">
                                <Button variant="default" className="w-full flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  Details
                                </Button>
                              </Link>
                              <Link to="/login" className="block">
                                <Button variant="secondary" className="w-full">
                                  Login to Buy
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );

  if (isAuthenticated) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="Marketplace" />
            {content}
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {content}
      <Footer />
    </div>
  );
};

export default Marketplace;