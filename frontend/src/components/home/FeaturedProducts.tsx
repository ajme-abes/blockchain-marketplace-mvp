import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Star, ShoppingCart, Eye } from 'lucide-react';
import { mockProducts, categories } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';

export const FeaturedProducts = () => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = selectedCategory
    ? mockProducts.filter(p => p.category === selectedCategory)
    : mockProducts.slice(0, 6);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          {t('featured.title')}
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Discover high-quality products directly from Ethiopian producers, verified on the blockchain
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <Button
            variant={!selectedCategory ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
              {/* Product Image */}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              
              <CardContent className="p-4 space-y-3">
                {/* Header with verification */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">by {product.producerName}</p>
                  </div>
                  {product.verified && (
                    <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                  )}
                </div>

                {/* Category and Rating */}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {product.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{product.rating}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-lg font-bold text-primary">
                  {product.price} {t('currency')}
                  <span className="text-sm text-muted-foreground font-normal">/{product.unit}</span>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0 flex gap-2">
                <Link to={`/products/${product.id}`} className="flex-1">
                  <Button variant="default" size="sm" className="w-full text-sm h-9">
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {t('common.buyNow')}
                  </Button>
                </Link>
                <Link to={`/products/${product.id}`}>
                  <Button variant="outline" size="sm" className="h-9 px-3">
                    <Eye className="h-3 w-3" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};