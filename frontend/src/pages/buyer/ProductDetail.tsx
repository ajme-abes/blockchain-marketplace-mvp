import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldCheck,
  Star,
  ExternalLink,
  MessageSquare,
  Phone,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useToast } from '@/hooks/use-toast';
import { productService } from '@/services/productService';

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: string;
  imageUrl?: string;
  images: {
    url?: string;
    ipfsCid?: string;
    alternatives: any[];
  };
  producer?: {
    id: string;
    businessName: string;
    location: string;
    verificationStatus: string;
    user: {
      name: string;
      email: string;
      phone?: string;
    };
  };
  unit: string;
  region: string;
  verified: boolean;
  rating?: number;
  reviews: number;
  blockchainTxHash?: string;
  nameAmh?: string;
  stock: number;
  averageRating?: number;
  reviewCount: number;
  reviewDetails?: {
    total: number;
    average: number;
    distribution: { [key: number]: number };
    reviews: Array<{
      id: string;
      rating: number;
      comment?: string;
      date: string;
      buyer: {
        name: string;
        email: string;
      };
    }>;
  };
  producerContact?: {
    phone?: string;
    email?: string;
  };
  ipfsMetadata?: Array<{
    cid: string;
    name?: string;
    mimeType?: string;
    size?: number;
    category: string;
    createdAt: string;
  }>;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const { createProductChat, loading: chatLoading } = useChat();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    loadProductDetail();
  }, [id]);

  const loadProductDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      console.log('🔄 Loading product details:', id);

      const response = await productService.getProductById(id);
      console.log('✅ Product detail response:', response);

      setProduct(response as any);
    } catch (error: any) {
      console.error('❌ Failed to load product details:', error);
      toast({
        title: 'Error loading product',
        description: error.message || 'Failed to load product details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  const handleProductChat = async () => {
    if (!product?.id) return;

    try {
      const chat = await createProductChat(product.id);

      toast({
        title: "Chat opened!",
        description: "You can now message the producer",
      });

      setTimeout(() => {
        navigate(`/chats?chat=${chat.id}`);
      }, 1000);

    } catch (error: any) {
      console.error('Failed to create product chat:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open chat",
        variant: "destructive",
      });
    }
  };
  // Get all available images from the product
  const getAllImages = (product: ProductDetail): string[] => {
    const images: string[] = [];

    // 1. Primary image URL
    if (product.imageUrl) {
      images.push(product.imageUrl);
    }

    // 2. Images from images object
    if (product.images?.url) {
      images.push(product.images.url);
    }

    // 3. Images from IPFS metadata
    if (product.ipfsMetadata && product.ipfsMetadata.length > 0) {
      product.ipfsMetadata.forEach(metadata => {
        if (metadata.cid) {
          images.push(`https://gateway.pinata.cloud/ipfs/${metadata.cid}`);
        }
      });
    }

    // 4. Remove duplicates and return
    return [...new Set(images)].filter(url => url && url.trim() !== '');
  };

  const getDisplayImage = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('ipfs://')) return `https://gateway.pinata.cloud/ipfs/${imageUrl.replace('ipfs://', '')}`;
    return imageUrl;
  };

  const getProducerName = (product: ProductDetail) => {
    return product.producer?.businessName || product.producer?.user?.name || 'Local Producer';
  };

  const nextImage = () => {
    const images = getAllImages(product!);
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = getAllImages(product!);
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex justify-center items-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading product details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex justify-center items-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product not found</h1>
            <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
            <Link to="/marketplace">
              <Button>Back to Marketplace</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const allImages = getAllImages(product);
  const currentImage = allImages[selectedImageIndex];
  const hasMultipleImages = allImages.length > 1;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images - ENHANCED WITH MULTIPLE IMAGE SUPPORT */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-lg shadow-card mb-4">
              <img
                src={getDisplayImage(currentImage)}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDYwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNGM0Y0RjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Q0EwQUYiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj5Qcm9kdWN0IEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                }}
              />

              {/* Navigation Arrows for Multiple Images */}
              {hasMultipleImages && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Image Counter */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                    {selectedImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Image Thumbnails */}
            {hasMultipleImages && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${index === selectedImageIndex ? 'border-primary' : 'border-transparent'
                      }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={getDisplayImage(image)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNGM0Y0RjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Q0EwQUYiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj5JbWFnZTwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Image Info */}
            <div className="text-sm text-muted-foreground mt-2">
              {allImages.length} {allImages.length === 1 ? 'image' : 'images'} available
              {product.ipfsMetadata && product.ipfsMetadata.length > 0 && (
                <span className="ml-2">• Stored on IPFS</span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge variant="secondary" className="mb-2 capitalize">
                  {product.category}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
                {product.nameAmh && (
                  <p className="text-muted-foreground">{product.nameAmh}</p>
                )}
              </div>
              {product.verified && (
                <ShieldCheck className="h-8 w-8 text-primary flex-shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <Star className={`h-5 w-5 ${product.averageRating ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                <span className="font-semibold">
                  {product.averageRating ? product.averageRating.toFixed(1) : 'No ratings'}
                </span>
                <span className="text-muted-foreground">
                  ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              <Badge variant="outline">{product.region}</Badge>
            </div>

            <div className="text-4xl font-bold text-primary mb-6">
              {product.price} ETB/{product.unit}
            </div>

            {/* Producer Card */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Producer</span>
                  <Link
                    to={`/producers/${product.producer?.id}`}
                    className="text-primary hover:underline text-sm"
                  >
                    View Profile
                  </Link>
                </div>
                <div className="font-semibold mb-1">{getProducerName(product)}</div>
                <div className="text-sm text-muted-foreground">{product.region}</div>
                {product.producer?.verificationStatus === 'VERIFIED' && (
                  <div className="flex items-center gap-1 mt-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-xs text-primary">Verified Producer</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blockchain Verification */}
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

            {/* Action Buttons */}
            <div className="flex gap-3 mb-4 flex-wrap">
              {isAuthenticated && user?.role === 'BUYER' ? (
                <>
                  <Button
                    variant="hero"
                    size="lg"
                    className="flex-1 min-w-[140px]"
                    onClick={() => {
                      if (!product.stock || product.stock === 0) {
                        toast({
                          title: "Out of stock",
                          description: "This product is currently unavailable",
                          variant: "destructive"
                        });
                        return;
                      }
                      // Add to cart and go to checkout
                      addToCart({
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        image: getDisplayImage(currentImage),
                        category: product.category,
                        region: product.region,
                        unit: product.unit,
                        stock: product.stock,
                        producerId: product.producer?.id || '',
                        producerName: getProducerName(product),
                      });
                      navigate('/checkout');
                    }}
                    disabled={!product.stock || product.stock === 0}
                  >
                    {!product.stock || product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      if (!product.stock || product.stock === 0) {
                        toast({
                          title: "Out of stock",
                          description: "This product is currently unavailable",
                          variant: "destructive"
                        });
                        return;
                      }
                      addToCart({
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        image: getDisplayImage(currentImage),
                        category: product.category,
                        region: product.region,
                        unit: product.unit,
                        stock: product.stock,
                        producerId: product.producer?.id || '',
                        producerName: getProducerName(product),
                      });
                      toast({
                        title: "Added to cart",
                        description: `${product.name} has been added to your cart`,
                      });
                    }}
                    disabled={!product.stock || product.stock === 0}
                    className="min-w-[140px]"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </>
              ) : !isAuthenticated ? (
                <Link to="/login" className="flex-1">
                  <Button variant="hero" size="lg" className="w-full">
                    Login to Purchase
                  </Button>
                </Link>
              ) : null}

              {/* Contact button - goes to producer profile */}
              <Link to={`/producers/${product.producer?.id}`}>
                <Button variant="outline" size="lg" className="min-w-[140px]">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact
                </Button>
              </Link>

              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="lg"
                  className="min-w-[140px]"
                  onClick={handleProductChat}
                  disabled={chatLoading}
                >
                  {chatLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Chat
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {product.stock} {product.unit} available in stock
              {product.stock < 10 && product.stock > 0 && (
                <span className="text-warning ml-2">• Low stock</span>
              )}
              {product.stock === 0 && (
                <span className="text-destructive ml-2">• Out of stock</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({product.reviewCount})
            </TabsTrigger>
            <TabsTrigger value="delivery">Delivery Info</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.description || 'No description available for this product.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <Card>
              <CardContent className="p-6">
                {product.reviewDetails && product.reviewDetails.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {/* Rating Summary */}
                    <div className="flex items-center gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{product.reviewDetails.average.toFixed(1)}</div>
                        <div className="flex items-center justify-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= Math.round(product.reviewDetails.average)
                                ? 'fill-accent text-accent'
                                : 'text-muted-foreground'
                                }`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {product.reviewDetails.total} reviews
                        </div>
                      </div>
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-4">
                      {product.reviewDetails.reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${star <= review.rating
                                    ? 'fill-accent text-accent'
                                    : 'text-muted-foreground'
                                    }`}
                                />
                              ))}
                            </div>
                            <span className="font-medium">{review.buyer.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.date).toLocaleDateString()}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No reviews yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Be the first to review this product!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  Delivery information and shipping details will be provided by the producer.
                  Contact the seller for specific delivery arrangements and pricing.
                </p>
                {product.producerContact && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Contact Producer</h4>
                    {product.producerContact.phone && (
                      <p className="text-sm">Phone: {product.producerContact.phone}</p>
                    )}
                    {product.producerContact.email && (
                      <p className="text-sm">Email: {product.producerContact.email}</p>
                    )}
                  </div>
                )}
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