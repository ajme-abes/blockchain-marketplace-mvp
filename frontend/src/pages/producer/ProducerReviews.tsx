// src/pages/producer/ProducerReviews.tsx
import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Filter, MessageCircle, ThumbsUp } from 'lucide-react';

const ProducerReviews = () => {
  const [filter, setFilter] = useState('all');

  const reviews = [
    {
      id: '1',
      buyerName: 'John Doe',
      product: 'Premium Coffee Beans',
      rating: 5,
      comment: 'Excellent quality coffee! Fast shipping and great packaging.',
      date: '2024-01-15',
      helpful: 3,
      response: null
    },
    {
      id: '2',
      buyerName: 'Sarah Smith',
      product: 'Organic Honey',
      rating: 4,
      comment: 'Good honey, but delivery was a bit slow.',
      date: '2024-01-14',
      helpful: 1,
      response: 'Thank you for your feedback! We are working on improving our delivery times.'
    },
    {
      id: '3',
      buyerName: 'Mike Johnson',
      product: 'Fresh Teff',
      rating: 3,
      comment: 'Product was okay, but some grains were broken.',
      date: '2024-01-13',
      helpful: 0,
      response: null
    }
  ];

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: (reviews.filter(r => r.rating === stars).length / reviews.length) * 100
  }));

  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(review => 
        filter === 'withResponse' ? review.response !== null :
        filter === 'withoutResponse' ? review.response === null :
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader title="Customer Reviews" />

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
                        {averageRating.toFixed(1)}
                      </div>
                      {renderStars(Math.round(averageRating))}
                      <div className="text-sm text-muted-foreground mt-1">
                        {reviews.length} reviews
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
                              <h3 className="font-semibold">{review.buyerName}</h3>
                              <p className="text-sm text-muted-foreground">{review.product}</p>
                            </div>
                            <div className="text-right">
                              {renderStars(review.rating)}
                              <p className="text-sm text-muted-foreground mt-1">{review.date}</p>
                            </div>
                          </div>

                          <p className="text-sm mb-3">{review.comment}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Button variant="ghost" size="sm" className="h-8">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                Helpful ({review.helpful})
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Reply
                              </Button>
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

                          {/* Reply Form (would be conditional) */}
                          {!review.response && (
                            <div className="mt-3 space-y-2">
                              <Textarea
                                placeholder="Write a response to this review..."
                                className="min-h-[80px]"
                              />
                              <div className="flex gap-2">
                                <Button size="sm">Post Response</Button>
                                <Button variant="outline" size="sm">Cancel</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {filteredReviews.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No reviews found for the selected filter
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