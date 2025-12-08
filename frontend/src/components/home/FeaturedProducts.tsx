import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Star, ShoppingCart, Eye, Loader2, AlertCircle, TrendingUp, Package } from 'lucide-react';
import { categories } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/services/api';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  quantityAvailable: number;
  status: string;
  imageUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  unit?: string; // Added unit field (kg, quintal, piece, etc.)
  producer: {
    id: string;
    businessName: string;
    location: string;
    verificationStatus: string;
    user: {
      name: string;
    };
  };
}

export const FeaturedProducts = () => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'listingDate' | 'price' | 'averageRating'>('listingDate');

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching products with category:', selectedCategory);

      const response = await api.getProducts({
        category: selectedCategory || undefined,
        limit: 6,
        sortBy,
        sortOrder: sortBy === 'price' ? 'asc' : 'desc',
      });

      console.log('📦 Products response:', response);

      if (response.status === 'success' && response.data) {
        setProducts(response.data.products || []);
        console.log('✅ Products loaded:', response.data.products?.length || 0);
      } else {
        setError('Failed to load products');
      }
    } catch (err: any) {
      console.error('❌ Error fetching products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (product: Product) => {
    if (product.imageUrl) {
      return product.imageUrl;
    }
    // Fallback image based on category
    const fallbackImages: Record<string, string> = {
      Coffee: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800',
      Teff: 'https://images.unsplash.com/photo-1556910966-e0a0f6e74e8d?w=800',
      Honey: 'https://images.unsplash.com/photo-1587049352846-4a222e784acc?w=800',
      Sesame: 'https://images.unsplash.com/photo-1613068687893-5e85b4638b56?w=800',
      Spices: 'https://images.unsplash.com/photo-1596040033229-a0b34e2c8cbd?w=800',
      Vegetables: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800',
      Fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800',
      Grains: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800',
    };
    return fallbackImages[product.category] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800';
  };

  return (
    <section className="py-20 bg-gradient-to-b from-background via-muted/10 to-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 bg-gradient-subtle opacity-50" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary rounded-full mb-4 shadow-lg">
            <TrendingUp className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white">Featured Products</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent [-webkit-text-fill-color:transparent] [paint-order:stroke_fill]" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Discover Quality Ethiopian Products
            </span>
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
            Explore authentic products directly from verified Ethiopian producers, secured by blockchain technology
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant={!selectedCategory ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="transition-all"
            >
              All Products
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="transition-all"
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-sm border rounded-md bg-background"
            >
              <option value="listingDate">Newest</option>
              <option value="price">Price</option>
              <option value="averageRating">Rating</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchProducts} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold mb-2">No products found</p>
            <p className="text-muted-foreground mb-4">
              {selectedCategory
                ? `No products available in ${selectedCategory} category`
                : 'No products available at the moment'}
            </p>
            {selectedCategory && (
              <Button onClick={() => setSelectedCategory(null)} variant="outline">
                View All Products
              </Button>
            )}
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <Card
                key={product.id}
                className="group overflow-hidden border border-border/50 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
              >
                {/* Product Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={getImageUrl(product)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800';
                    }}
                  />

                  {/* Stock Badge */}
                  {product.quantityAvailable < 10 && product.quantityAvailable > 0 && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="destructive" className="text-xs">
                        Only {product.quantityAvailable} left
                      </Badge>
                    </div>
                  )}

                  {/* Out of Stock */}
                  {product.quantityAvailable === 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Badge variant="destructive" className="text-sm">
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Header with verification */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        by {product.producer?.businessName || product.producer?.user?.name || 'Unknown'}
                      </p>
                    </div>
                    {product.producer?.verificationStatus === 'VERIFIED' && (
                      <div className="flex-shrink-0">
                        <ShieldCheck className="h-5 w-5 text-primary" title="Verified Producer" />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {product.description}
                  </p>

                  {/* Category and Rating */}
                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {product.category}
                    </Badge>
                    {product.averageRating && (
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold">{product.averageRating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">
                          ({product.reviewCount})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 pt-2 border-t">
                    <span className="text-2xl font-bold text-primary">
                      {product.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t('currency')}/{product.unit || 'unit'}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Link to={`/products/${product.id}`} className="flex-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      disabled={product.quantityAvailable === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {product.quantityAvailable === 0 ? 'Out of Stock' : t('common.buyNow')}
                    </Button>
                  </Link>
                  <Link to={`/products/${product.id}`}>
                    <Button variant="outline" size="sm" className="px-3">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* View All Button */}
        {!loading && !error && products.length > 0 && (
          <div className="text-center mt-12">
            <Link to="/marketplace">
              <Button size="lg" variant="outline" className="group">
                View All Products
                <TrendingUp className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
