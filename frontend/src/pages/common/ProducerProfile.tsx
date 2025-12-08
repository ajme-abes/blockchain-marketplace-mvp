// Enhanced Producer Profile Page
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    ShieldCheck,
    Star,
    MapPin,
    Calendar,
    Package,
    MessageSquare,
    Phone,
    Mail,
    Loader2,
    Store,
    User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface Producer {
    id: string;
    businessName: string;
    location: string;
    verificationStatus: string;
    user: {
        id: string;
        name: string;
        email: string;
        phone?: string;
        avatarUrl?: string;
        registrationDate: string;
    };
    products?: Array<{
        id: string;
        name: string;
        price: number;
        category: string;
        imageUrl?: string;
        unit: string;
        stock: number;
        status: string;
    }>;
    stats?: {
        totalProducts: number;
        activeProducts: number;
        averageRating: number;
        totalReviews: number;
    };
}

const ProducerProfile = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { createProductChat, loading: chatLoading } = useChat();
    const { toast } = useToast();

    const [producer, setProducer] = useState<Producer | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('products');

    useEffect(() => {
        if (id) {
            loadProducerProfile();
        }
    }, [id]);

    const loadProducerProfile = async () => {
        try {
            setLoading(true);
            const response = await api.request(`/products/producer/${id}/profile`);
            if (response.data) {
                setProducer(response.data);
            }
        } catch (error: any) {
            toast({
                title: 'Error loading profile',
                description: error.message || 'Failed to load producer profile',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleMessage = async () => {
        if (!producer || !producer.products || producer.products.length === 0) {
            toast({
                title: 'No products available',
                description: 'This producer has no products to discuss',
                variant: 'destructive',
            });
            return;
        }

        try {
            // Use the first product to create a chat
            const firstProduct = producer.products[0];
            const chat = await createProductChat(firstProduct.id);

            toast({
                title: 'Chat opened!',
                description: `You can now message ${producer.businessName} about ${firstProduct.name}`,
            });

            setTimeout(() => navigate(`/chats?chat=${chat.id}`), 1000);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to open chat',
                variant: 'destructive',
            });
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const isOwnProfile = isAuthenticated && user?.id === producer?.user.id;
    const canMessage = isAuthenticated && !isOwnProfile;

    // Loading state
    if (loading) {
        const LoadingContent = (
            <div className="container mx-auto px-4 py-20 flex justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading producer profile...</p>
                </div>
            </div>
        );

        if (isAuthenticated) {
            return (
                <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                        <AppSidebar />
                        <div className="flex-1 flex flex-col">
                            <PageHeader title="Producer Profile" />
                            {LoadingContent}
                        </div>
                    </div>
                </SidebarProvider>
            );
        }

        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                {LoadingContent}
                <Footer />
            </div>
        );
    }

    // Not found state
    if (!producer) {
        const NotFoundContent = (
            <div className="container mx-auto px-4 py-20 text-center">
                <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-4">Producer not found</h1>
                <p className="text-muted-foreground mb-6">The producer you're looking for doesn't exist.</p>
                <Link to="/marketplace">
                    <Button>Back to Marketplace</Button>
                </Link>
            </div>
        );

        if (isAuthenticated) {
            return (
                <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                        <AppSidebar />
                        <div className="flex-1 flex flex-col">
                            <PageHeader title="Producer Profile" />
                            {NotFoundContent}
                        </div>
                    </div>
                </SidebarProvider>
            );
        }

        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                {NotFoundContent}
                <Footer />
            </div>
        );
    }

    // Main content
    const MainContent = (
        <main className="container mx-auto px-4 py-8">
            {/* Producer Header Card */}
            <Card className="mb-8">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <Avatar className="w-32 h-32">
                                <AvatarImage src={producer.user.avatarUrl} alt={producer.businessName} />
                                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                    {getInitials(producer.businessName)}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        {/* Producer Info */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">{producer.businessName}</h1>
                                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-2">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            <span>{producer.location}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                Member since{' '}
                                                {new Date(producer.user.registrationDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    {producer.verificationStatus === 'VERIFIED' && (
                                        <div className="flex items-center gap-2 mb-3">
                                            <ShieldCheck className="h-5 w-5 text-primary" />
                                            <span className="text-primary font-medium">Verified Producer</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            {producer.stats && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold">{producer.stats.totalProducts}</div>
                                        <div className="text-sm text-muted-foreground">Products</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold">{producer.stats.activeProducts}</div>
                                        <div className="text-sm text-muted-foreground">Active</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                                            {producer.stats.averageRating > 0 ? (
                                                <>
                                                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                                    {producer.stats.averageRating.toFixed(1)}
                                                </>
                                            ) : (
                                                'N/A'
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Rating</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold">{producer.stats.totalReviews}</div>
                                        <div className="text-sm text-muted-foreground">Reviews</div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 flex-wrap">
                                {canMessage && (
                                    <Button onClick={handleMessage} disabled={chatLoading}>
                                        {chatLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                        )}
                                        Message Producer
                                    </Button>
                                )}

                                {isOwnProfile && (
                                    <Link to="/my-products">
                                        <Button variant="outline">
                                            <Package className="h-4 w-4 mr-2" />
                                            Manage Products
                                        </Button>
                                    </Link>
                                )}

                                {!isAuthenticated && (
                                    <Link to="/login">
                                        <Button>
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Login to Message
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs Section */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="products">
                        Products ({producer.products?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                </TabsList>

                {/* Products Tab */}
                <TabsContent value="products" className="mt-6">
                    {producer.products && producer.products.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {producer.products
                                .filter((p) => p.status === 'ACTIVE')
                                .map((product) => (
                                    <Link key={product.id} to={`/products/${product.id}`}>
                                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                                            <div className="aspect-square overflow-hidden bg-gray-100">
                                                <img
                                                    src={product.imageUrl || 'https://via.placeholder.com/300x300?text=Product'}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Product';
                                                    }}
                                                />
                                            </div>
                                            <CardContent className="p-4">
                                                <h3 className="font-semibold mb-1 line-clamp-2">{product.name}</h3>
                                                <Badge variant="secondary" className="mb-2 text-xs capitalize">
                                                    {product.category}
                                                </Badge>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-lg font-bold text-primary">
                                                        {product.price} ETB
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">/{product.unit}</div>
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    {product.stock > 0 ? (
                                                        <span className="text-green-600">In Stock</span>
                                                    ) : (
                                                        <span className="text-destructive">Out of Stock</span>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No products available yet</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* About Tab */}
                <TabsContent value="about" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>About {producer.businessName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Business Name</p>
                                        <p className="font-medium">{producer.businessName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        <p className="font-medium">{producer.location}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Verification Status</p>
                                        <div className="flex items-center gap-2">
                                            {producer.verificationStatus === 'VERIFIED' ? (
                                                <>
                                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                                    <span className="font-medium text-primary">Verified</span>
                                                </>
                                            ) : (
                                                <span className="font-medium text-muted-foreground">Pending</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Member Since</p>
                                        <p className="font-medium">
                                            {new Date(producer.user.registrationDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Contact Tab */}
                <TabsContent value="contact" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {isAuthenticated ? (
                                    <>
                                        {producer.user.email && (
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Email</p>
                                                    <a
                                                        href={`mailto:${producer.user.email}`}
                                                        className="font-medium hover:text-primary"
                                                    >
                                                        {producer.user.email}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        {producer.user.phone && (
                                            <div className="flex items-center gap-3">
                                                <Phone className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Phone</p>
                                                    <a
                                                        href={`tel:${producer.user.phone}`}
                                                        className="font-medium hover:text-primary"
                                                    >
                                                        {producer.user.phone}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <MapPin className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Location</p>
                                                <p className="font-medium">{producer.location}</p>
                                            </div>
                                        </div>

                                        {canMessage && (
                                            <div className="pt-4">
                                                <Button onClick={handleMessage} disabled={chatLoading} className="w-full">
                                                    {chatLoading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    ) : (
                                                        <MessageSquare className="h-4 w-4 mr-2" />
                                                    )}
                                                    Send Message
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground mb-4">
                                            Please log in to view contact information
                                        </p>
                                        <Link to="/login">
                                            <Button>Login to View Contact</Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    );

    // Render with or without sidebar based on authentication
    if (isAuthenticated) {
        return (
            <SidebarProvider>
                <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col">
                        <PageHeader
                            title={producer.businessName}
                            description={`${producer.location} • ${producer.verificationStatus === 'VERIFIED' ? '✓ Verified' : 'Pending Verification'}`}
                        />
                        {MainContent}
                    </div>
                </div>
            </SidebarProvider>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            {MainContent}
            <Footer />
        </div>
    );
};

export default ProducerProfile;
