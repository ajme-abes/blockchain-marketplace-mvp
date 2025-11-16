import apiService from './api';

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  reviewDate: string;
  buyer: {
    user: {
      name: string;
    };
  };
  product?: {
    id: string;
    name: string;
    imageUrl?: string;
    producer?: {
      user: {
        name: string;
      };
    };
  };
}

export interface ReviewStats {
  total: number;
  average: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CreateReviewData {
  productId: string;
  rating: number;
  comment?: string;
}

class ReviewService {
  async createReview(reviewData: CreateReviewData): Promise<Review> {
    const response = await apiService.request('/reviews', {
      method: 'POST',
      data: reviewData
    });
    return response.data;
  }

  async getProductReviews(productId: string, page = 1, limit = 10) {
    const response = await apiService.request(`/reviews/product/${productId}`, {
      params: { page, limit }
    });
    return response.data;
  }

  async getMyReviews(page = 1, limit = 10) {
    const response = await apiService.request('/reviews/my-reviews', {
      params: { page, limit }
    });
    return response.data;
  }

  async updateReview(reviewId: string, updates: { rating?: number; comment?: string }) {
    const response = await apiService.request(`/reviews/${reviewId}`, {
      method: 'PUT',
      data: updates
    });
    return response.data;
  }

  async deleteReview(reviewId: string) {
    const response = await apiService.request(`/reviews/${reviewId}`, {
      method: 'DELETE'
    });
    return response;
  }

  async getReviewStats(productId: string): Promise<ReviewStats> {
    const response = await apiService.request(`/reviews/product/${productId}/stats`);
    return response.data;
  }
}

export const reviewService = new ReviewService();