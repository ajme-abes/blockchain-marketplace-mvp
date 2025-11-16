import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { StarRating } from '@/components/reviews/StarRating';
import { reviewService, Review } from '@/services/reviewService';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MyReviews() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadReviews();
  }, [isAuthenticated, navigate]);

  const loadReviews = async () => {
    try {
      const data = await reviewService.getMyReviews();
      setReviews(data.reviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load your reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await reviewService.deleteReview(reviewId);
      toast({
        title: "Review Deleted",
        description: "Your review has been deleted",
      });
      loadReviews(); // Refresh list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="My Reviews" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader 
            title="My Reviews" 
            description="Manage your product reviews and feedback"
          />

          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        {review.product?.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <StarRating rating={review.rating} showNumber />
                        <span>
                          {new Date(review.reviewDate).toLocaleDateString()}
                        </span>
                        {review.product?.producer && (
                          <span>Seller: {review.product.producer.user.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteReview(review.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  {review.comment && (
                    <p className="text-muted-foreground border-t pt-4">
                      {review.comment}
                    </p>
                  )}
                </Card>
              ))}

              {reviews.length === 0 && (
                <Card className="p-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't reviewed any products yet. Your reviews will appear here.
                  </p>
                  <Button onClick={() => navigate('/orders')}>
                    View Your Orders
                  </Button>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}