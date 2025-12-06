import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Check, X, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Testimonial {
    id: string;
    name: string;
    role: string;
    message: string;
    rating: number;
    photo?: string;
    isApproved: boolean;
    isPublished: boolean;
    createdAt: string;
}

export default function TestimonialManagement() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/testimonials', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.status === 'success') {
                setTestimonials(data.data.testimonials || []);
            }
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            toast.error('Failed to load testimonials');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/testimonials/${id}/approve`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.status === 'success') {
                toast.success('Testimonial approved!');
                fetchTestimonials();
            }
        } catch (error) {
            console.error('Error approving testimonial:', error);
            toast.error('Failed to approve testimonial');
        }
    };

    const handleReject = async (id: string) => {
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/testimonials/${id}/reject`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.status === 'success') {
                toast.success('Testimonial rejected');
                fetchTestimonials();
            }
        } catch (error) {
            console.error('Error rejecting testimonial:', error);
            toast.error('Failed to reject testimonial');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this testimonial?')) return;

        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/testimonials/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.status === 'success') {
                toast.success('Testimonial deleted');
                fetchTestimonials();
            }
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            toast.error('Failed to delete testimonial');
        }
    };

    const filteredTestimonials = testimonials.filter(t => {
        if (filter === 'pending') return !t.isApproved;
        if (filter === 'approved') return t.isApproved;
        return true;
    });

    const pendingCount = testimonials.filter(t => !t.isApproved).length;

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col">
                    <PageHeader title="Testimonial Management" />
                    <main className="flex-1 p-6">
                        <div className="mb-6">
                            <p className="text-muted-foreground">Review and manage customer testimonials</p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total</p>
                                            <p className="text-2xl font-bold">{testimonials.length}</p>
                                        </div>
                                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Pending</p>
                                            <p className="text-2xl font-bold">{pendingCount}</p>
                                        </div>
                                        <Badge variant="destructive" className="text-lg px-3 py-1">
                                            {pendingCount}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Approved</p>
                                            <p className="text-2xl font-bold">
                                                {testimonials.filter(t => t.isApproved).length}
                                            </p>
                                        </div>
                                        <Check className="h-8 w-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 mb-6">
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                onClick={() => setFilter('all')}
                            >
                                All ({testimonials.length})
                            </Button>
                            <Button
                                variant={filter === 'pending' ? 'default' : 'outline'}
                                onClick={() => setFilter('pending')}
                            >
                                Pending ({pendingCount})
                            </Button>
                            <Button
                                variant={filter === 'approved' ? 'default' : 'outline'}
                                onClick={() => setFilter('approved')}
                            >
                                Approved ({testimonials.filter(t => t.isApproved).length})
                            </Button>
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}

                        {/* Testimonials List */}
                        {!loading && (
                            <div className="space-y-4">
                                {filteredTestimonials.map((testimonial) => (
                                    <Card key={testimonial.id}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="w-12 h-12">
                                                        <AvatarImage src={testimonial.photo} />
                                                        <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="secondary" className="capitalize">
                                                                {testimonial.role.toLowerCase()}
                                                            </Badge>
                                                            {testimonial.isApproved ? (
                                                                <Badge variant="default" className="bg-green-500">
                                                                    <Check className="h-3 w-3 mr-1" />
                                                                    Approved
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="destructive">
                                                                    Pending Review
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    {!testimonial.isApproved && (
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() => handleApprove(testimonial.id)}
                                                        >
                                                            <Check className="h-4 w-4 mr-1" />
                                                            Approve
                                                        </Button>
                                                    )}
                                                    {testimonial.isApproved && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleReject(testimonial.id)}
                                                        >
                                                            <X className="h-4 w-4 mr-1" />
                                                            Reject
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDelete(testimonial.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex gap-1 mb-3">
                                                {Array.from({ length: testimonial.rating }).map((_, i) => (
                                                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                ))}
                                            </div>
                                            <p className="text-muted-foreground">{testimonial.message}</p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Submitted: {new Date(testimonial.createdAt).toLocaleString()}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}

                                {filteredTestimonials.length === 0 && (
                                    <Card>
                                        <CardContent className="p-12 text-center">
                                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">No testimonials found</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
