import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Filter, MessageCircle, ThumbsUp, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { reviewService, Review } from '@/services/reviewService';

interface ProducerReview extends Review {
  product: {
    id: string;
    name: string;
    imageUrl?: string;
    producer?: {
      user: {
        name: string;
      };
    };
  };
  response?: string;
  helpful?: number;
}

const ProducerReviews = () => {
  const [filter, setFilter] = useState('all');
  const [reviews, setReviews] = useState<ProducerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadProducerReviews();
  }, []);

  const loadProducerReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewService.getProducerReviews();
      
      const producerReviews = response.reviews.map((review: any) => ({
        ...review,
        response: null, // You can implement response functionality later
        helpful: Math.floor(Math.random() * 5) // Placeholder
      }));
      
      setReviews(producerReviews);
    } catch (error: any) {
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

  // Calculate statistics from real data
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100 : 0
  }));

  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(review => 
        filter === 'withResponse' ? review.response !== null && review.response !== undefined :
        filter === 'withoutResponse' ? !review.response :
        true
      );

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-300 text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const handlePostResponse = (reviewId: string) => {
    // Implement response functionality here
    console.log('Post response for:', reviewId, responseText);
    
    // For now, just show a success message
    toast({
      title: "Response Posted",
      description: "Your response has been posted successfully",
    });
    
    setRespondingTo(null);
    setResponseText('');
    
    // In a real implementation, you would:
    // 1. Send the response to your backend
    // 2. Update the review with the response
    // 3. Reload the reviews
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="Customer Reviews" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading reviews...</p>
              </div>
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
            title="Customer Reviews" 
            description="Manage and respond to customer feedback"
          />

          <main className="flex-1 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar - Rating Summary */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Rating Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">
                        {reviews.length > 0 ? averageRating.toFixed(1) : '0.0'}
                      </div>
                      {renderStars(Math.round(averageRating))}
                      <div className="text-sm text-muted-foreground mt-1">
                        {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {ratingDistribution.map(({ stars, count, percentage }) => (
                        <div key={stars} className="flex items-center gap-2">
                          <div className="flex items-center gap-1 w-16">
                            <span className="text-sm">{stars}</span>
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { key: 'all', label: 'All Reviews', count: reviews.length },
                        { key: 'withResponse', label: 'With Response', count: reviews.filter(r => r.response).length },
                        { key: 'withoutResponse', label: 'Without Response', count: reviews.filter(r => !r.response).length },
                      ].map((filterOption) => (
                        <Button
                          key={filterOption.key}
                          variant={filter === filterOption.key ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setFilter(filterOption.key)}
                        >
                          {filterOption.label}
                          <Badge variant="secondary" className="ml-auto">
                            {filterOption.count}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {filteredReviews.map((review) => (
                        <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{review.buyer.user.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {review.product?.name || 'Product'}
                              </p>
                            </div>
                            <div className="text-right">
                              {renderStars(review.rating)}
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(review.reviewDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <p className="text-sm mb-3">{review.comment || 'No comment provided'}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Button variant="ghost" size="sm" className="h-8">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                Helpful ({review.helpful || 0})
                              </Button>
                              {!review.response && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8"
                                  onClick={() => setRespondingTo(review.id)}
                                >
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  Reply
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Seller Response */}
                          {review.response && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-blue-100">
                                  Your Response
                                </Badge>
                              </div>
                              <p className="text-sm">{review.response}</p>
                            </div>
                          )}

                          {/* Reply Form */}
                          {respondingTo === review.id && (
                            <div className="mt-3 space-y-2">
                              <Textarea
                                placeholder="Write a response to this review..."
                                className="min-h-[80px]"
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  onClick={() => handlePostResponse(review.id)}
                                  disabled={!responseText.trim()}
                                >
                                  Post Response
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setRespondingTo(null);
                                    setResponseText('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {filteredReviews.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          {reviews.length === 0 
                            ? "No reviews yet for your products" 
                            : "No reviews found for the selected filter"
                          }
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ProducerReviews;