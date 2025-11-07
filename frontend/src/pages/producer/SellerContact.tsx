import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Phone, MapPin, Package, ShieldCheck } from 'lucide-react';
import { mockProducers, mockProducts } from '@/lib/mockData';

const SellerContact = () => {
  const { id } = useParams();
  const producer = mockProducers.find(p => p.id === id);
  const producerProducts = mockProducts.filter(p => p.producerId === id);

  if (!producer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Producer not found</h1>
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
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-card mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary">
                    {producer.name[0]}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{producer.name}</h1>
                    {producer.verified && (
                      <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline">
                      <MapPin className="h-3 w-3 mr-1" />
                      {producer.region}
                    </Badge>
                    <Badge variant="outline">
                      <Package className="h-3 w-3 mr-1" />
                      {producer.totalProducts} Products
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">{producer.bio}</p>
                  <div className="text-sm text-muted-foreground">
                    Member since {new Date(producer.memberSince).toLocaleDateString('en-US', { 
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
                    <div className="font-medium">{producer.phone}</div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Link to="/chats" className="flex-1">
                    <Button variant="hero" size="lg" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Chat
                    </Button>
                  </Link>
                  <a href={`tel:${producer.phone}`}>
                    <Button variant="outline" size="lg">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-6">Products by {producer.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {producerProducts.map(product => (
              <Card key={product.id} className="shadow-card hover:shadow-glow transition-smooth">
                <Link to={`/products/${product.id}`}>
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-smooth"
                    />
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SellerContact;
