import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
  };
  orderId?: string;
  onReviewSubmitted: () => void;
}

export function ReviewModal({ isOpen, onClose, product, orderId, onReviewSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { reviewService } = await import('@/services/reviewService');
      await reviewService.createReview({
        productId: product.id,
        rating,
        comment: comment.trim() || undefined
      });

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      onReviewSubmitted();
      handleClose();
    } catch (error: any) {
      console.error('Submit review error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setHoverRating(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review {product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Your Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {rating === 0 ? 'Select a rating' : `${rating} star${rating !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-3">
            <label htmlFor="comment" className="text-sm font-medium">
              Your Review (Optional)
            </label>
            <Textarea
              id="comment"
              placeholder="Share your experience with this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}