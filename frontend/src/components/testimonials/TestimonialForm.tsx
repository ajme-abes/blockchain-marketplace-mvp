import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import api from '@/services/api';

export const TestimonialForm = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    rating: 5
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      toast.error('Please write your testimonial message');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to submit a testimonial');
      return;
    }

    try {
      setSubmitting(true);
      
      // Submit with user's actual data from profile
      const response = await api.createTestimonial({
        name: user.name,
        role: user.role,
        message: formData.message,
        rating: formData.rating
      });

      if (response.status === 'success') {
        toast.success('Thank you for sharing your experience! Your testimonial will be published after admin review.');
        setFormData({ message: '', rating: 5 });
      }
    } catch (error: any) {
      console.error('Error submitting testimonial:', error);
      toast.error(error.message || 'Failed to submit testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="shadow-card border-2 border-primary/20">
      <CardHeader className="gradient-subtle">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Share Your Experience</CardTitle>
            <CardDescription>
              Help others discover our marketplace
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Info Display */}
          <div className="p-4 bg-muted/50 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground mb-1">Posting as:</p>
            <p className="font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating })}
                  className="transition-all hover:scale-125 active:scale-95"
                >
                  <Star
                    className={`h-7 w-7 transition-all ${
                      rating <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg'
                        : 'text-gray-300 hover:text-yellow-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {formData.rating === 5 && '⭐ Excellent!'}
              {formData.rating === 4 && '👍 Very Good'}
              {formData.rating === 3 && '😊 Good'}
              {formData.rating === 2 && '😐 Fair'}
              {formData.rating === 1 && '😞 Poor'}
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your Testimonial</label>
            <Textarea
              placeholder="Share your experience with our marketplace... What did you like? How has it helped you?"
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              rows={5}
              required
              className="resize-none transition-smooth focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">
              {formData.message.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full gradient-primary shadow-glow hover:shadow-glow-secondary"
            disabled={submitting || !formData.message.trim()}
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Testimonial
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Your testimonial will be reviewed by our team before being published
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
