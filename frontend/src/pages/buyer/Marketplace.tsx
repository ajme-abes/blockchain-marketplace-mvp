import { useState } from 'react';
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
import { ShieldCheck, Star, Filter, Search, X } from 'lucide-react';
import { mockProducts, categories, regions } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const Marketplace = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProducts = mockProducts.filter(product => {
    // Search filter - search in name, producer name, category, and description
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(query) ||
        product.producerName.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
    // Category filter
    if (selectedCategory && product.category !== selectedCategory) return false;
    
    // Region filter
    if (selectedRegion && product.region !== selectedRegion) return false;
    
    // Price range filter
    if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
    
    return true;
  });

  const content = (
    <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Marketplace</h1>
          <p className="text-muted-foreground mb-6">
            Browse verified Ethiopian products from local producers
          </p>
          
          {/* Search Bar - Only show for authenticated users */}
          {isAuthenticated && (
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
          )}
        </div>

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
                      onChange={e => setSelectedCategory(e.target.value || null)}
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Region</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedRegion || ''}
                      onChange={e => setSelectedRegion(e.target.value || null)}
                    >
                      <option value="">All Regions</option>
                      {regions.map(reg => (
                        <option key={reg} value={reg}>{reg}</option>
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
                      max="1000"
                      value={priceRange[1]}
                      onChange={e => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full"
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedRegion(null);
                      setPriceRange([0, 1000]);
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
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                {searchQuery && (
                  <span className="ml-2">
                    for "<span className="font-semibold text-foreground">{searchQuery}</span>"
                  </span>
                )}
              </div>
              {(searchQuery || selectedCategory || selectedRegion || priceRange[1] < 1000) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                    setSelectedRegion(null);
                    setPriceRange([0, 1000]);
                  }}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <Card key={product.id} className="overflow-hidden shadow-card hover:shadow-glow transition-smooth">
                  <Link to={`/products/${product.id}`}>
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-smooth"
                        loading="lazy"
                      />
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">by {product.producerName}</p>
                      </div>
                      {product.verified && (
                        <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">{product.category}</Badge>
                      <Badge variant="outline">{product.region}</Badge>
                      <div className="flex items-center gap-1 text-sm ml-auto">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span>{product.rating}</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {product.price} {t('currency')}/{product.unit}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {product.stock} {product.unit} in stock
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <Link to={`/products/${product.id}`} className="flex-1">
                      <Button variant="default" className="w-full">
                        {t('common.buyNow')}
                      </Button>
                    </Link>
                    <Link to={`/products/${product.id}`}>
                      <Button variant="outline">Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
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
