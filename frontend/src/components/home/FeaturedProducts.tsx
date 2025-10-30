import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Star } from 'lucide-react';
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
            <Card key={product.id} className="overflow-hidden shadow-card hover:shadow-glow transition-smooth">
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-smooth"
                  loading="lazy"
                />
              </div>
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
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span>{product.rating}</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {product.price} {t('currency')}/{product.unit}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Link to={`/products/${product.id}`} className="flex-1">
                  <Button variant="default" className="w-full">
                    {t('common.buyNow')}
                  </Button>
                </Link>
                <Link to={`/products/${product.id}`}>
                  <Button variant="outline">
                    {t('common.learnMore')}
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
