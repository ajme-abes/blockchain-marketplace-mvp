import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Star, ExternalLink, MessageSquare, Phone } from 'lucide-react';
import { mockProducts, mockProducers } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const product = mockProducts.find(p => p.id === id);
  const producer = mockProducers.find(p => p.id === product?.producerId);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link to="/marketplace">
            <Button>Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="aspect-square overflow-hidden rounded-lg shadow-card mb-4">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge variant="secondary" className="mb-2">{product.category}</Badge>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
                <p className="text-muted-foreground">{product.nameAmh}</p>
              </div>
              {product.verified && (
                <ShieldCheck className="h-8 w-8 text-primary flex-shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-accent text-accent" />
                <span className="font-semibold">{product.rating}</span>
                <span className="text-muted-foreground">({product.reviews} reviews)</span>
              </div>
              <Badge variant="outline">{product.region}</Badge>
            </div>

            <div className="text-4xl font-bold text-primary mb-6">
              {product.price} {t('currency')}/{product.unit}
            </div>

            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Producer</span>
                  <Link to={`/profile/${product.producerId}`} className="text-primary hover:underline">
                    View Profile
                  </Link>
                </div>
                <div className="font-semibold mb-1">{product.producerName}</div>
                <div className="text-sm text-muted-foreground">{product.region}</div>
              </CardContent>
            </Card>

            {product.blockchainTxHash && (
              <Card className="mb-6 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold mb-1">Blockchain Verified</div>
                      <div className="text-sm text-muted-foreground break-all">
                        Tx: {product.blockchainTxHash}
                      </div>
                      <Button variant="link" size="sm" className="p-0 h-auto mt-1">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View on Explorer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button
                variant="hero"
                size="lg"
                className="flex-1"
                onClick={() => navigate(`/checkout/${product.id}`)}
              >
                Buy Now
              </Button>
              <Link to={`/sellers/${product.producerId}/contact`}>
                <Button variant="outline" size="lg">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              {product.stock} {product.unit} available in stock
            </div>
          </div>
        </div>

        <Tabs defaultValue="description" className="mb-8">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.reviews})</TabsTrigger>
            <TabsTrigger value="delivery">Delivery Info</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reviews" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Reviews will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="delivery" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  Delivery information and shipping details will be provided by the producer.
                  Contact the seller for specific delivery arrangements.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
