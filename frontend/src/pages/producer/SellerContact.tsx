import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Phone, MapPin, Package, ShieldCheck, Loader2, Star } from 'lucide-react';

interface Producer {
  id: string;
  businessName: string;
  location: string;
  verificationStatus: string;
  businessDescription?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    registrationDate: string;
  };
  products: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
    imageUrl?: string;
    unit: string;
    stock: number;
    status: string;
  }>;
  stats: {
    totalProducts: number;
    activeProducts: number;
    averageRating: number;
    totalReviews: number;
  };
}

const SellerContact = () => {
  const { id } = useParams();
  const [producer, setProducer] = useState<Producer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducer = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products/producer/${id}/profile`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Producer not found');
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return;
        }

        const result = await response.json();
        if (result.status === 'success') {
          setProducer(result.data);
        } else {
          setError(result.message || 'Failed to load producer');
        }
      } catch (err: any) {
        console.error('Error fetching producer:', err);
        setError(err.message || 'Failed to load producer');
      } finally {
        setLoading(false);
      }
    };

    fetchProducer();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading producer profile...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !producer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">{error || 'Producer not found'}</h1>
              <Link to="/marketplace">
                <Button>Back to Marketplace</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-card mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-shrink-0">
                  {producer.user.avatarUrl ? (
                    <img
                      src={producer.user.avatarUrl}
                      alt={producer.user.name}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary">
                      {producer.user.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{producer.businessName || producer.user.name}</h1>
                    {producer.verificationStatus === 'VERIFIED' && (
                      <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline">
                      <MapPin className="h-3 w-3 mr-1" />
                      {producer.location}
                    </Badge>
                    <Badge variant="outline">
                      <Package className="h-3 w-3 mr-1" />
                      {producer.stats.totalProducts} Products
                    </Badge>
                    {producer.stats.averageRating > 0 && (
                      <Badge variant="outline">
                        <Star className="h-3 w-3 mr-1" />
                        {producer.stats.averageRating} ({producer.stats.totalReviews} reviews)
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {producer.businessDescription || `Professional producer specializing in quality products from ${producer.location}.`}
                  </p>
                  <div className="text-sm text-muted-foreground">
                    Member since {new Date(producer.user.registrationDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{producer.user.phone}</div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Link to="/chats" className="flex-1">
                    <Button variant="hero" size="lg" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Chat
                    </Button>
                  </Link>
                  <a href={`tel:${producer.user.phone}`}>
                    <Button variant="outline" size="lg">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-6">Products by {producer.businessName || producer.user.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {producer.products.length > 0 ? (
              producer.products.map(product => (
                <Card key={product.id} className="shadow-card hover:shadow-glow transition-smooth">
                  <Link to={`/products/${product.id}`}>
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-smooth"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{product.category}</Badge>
                      <div className="text-xl font-bold text-primary">
                        {product.price} ETB
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Stock: {product.stock} {product.unit}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No products available from this producer.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SellerContact;