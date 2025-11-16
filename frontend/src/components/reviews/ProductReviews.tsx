import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from './StarRating';
import { reviewService, Review } from '@/services/reviewService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ReviewModal } from './ReviewModal';

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, product: null });
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [productId]);

  const loadReviews = async () => {
    try {
      const data = await reviewService.getProductReviews(productId);
      setReviews(data.reviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await reviewService.getReviewStats(productId);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load review stats:', error);
    }
  };

  const handleReviewSubmitted = () => {
    loadReviews();
    loadStats();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-center">
          <p>Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      {stats && (
        <div className="flex items-center gap-6 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.average.toFixed(1)}</div>
            <StarRating rating={stats.average} />
            <div className="text-sm text-muted-foreground mt-1">
              {stats.total} review{stats.total !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-4">{rating}</span>
                <StarRating rating={1} size="sm" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ 
                      width: `${stats.total > 0 ? (stats.distribution[rating] / stats.total) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="w-8 text-right">
                  {stats.distribution[rating]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write Review Button - Only for authenticated buyers */}
      {isAuthenticated && user?.role === 'BUYER' && (
        <div className="flex justify-end">
          <Button 
            onClick={() => setReviewModal({ isOpen: true, product: { id: productId, name: 'this product' } })}
          >
            Write a Review
          </Button>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              No reviews yet. Be the first to review this product!
            </div>
            {isAuthenticated && user?.role === 'BUYER' && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setReviewModal({ isOpen: true, product: { id: productId, name: 'this product' } })}
              >
                Be the First to Review
              </Button>
            )}
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-0">
              <div className="flex items-center gap-4 mb-2">
                <StarRating rating={review.rating} />
                <span className="font-medium">{review.buyer.user.name}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(review.reviewDate).toLocaleDateString()}
                </span>
              </div>
              {review.comment && (
                <p className="text-muted-foreground mt-2">
                  {review.comment}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <ReviewModal
          isOpen={reviewModal.isOpen}
          onClose={() => setReviewModal({ isOpen: false, product: null })}
          product={reviewModal.product}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}