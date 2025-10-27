const { prisma } = require('../config/database');

class ReviewService {
  // ==================== CREATE REVIEW ====================
async createReview(buyerId, productId, rating, comment = null) {
  try {
    // Validate rating
    if (rating < 1 || rating > 5) {
      return {
        success: false,
        error: 'Rating must be between 1 and 5 stars'
      };
    }

    // Check if buyer purchased this product
    const hasPurchased = await this.hasPurchasedProduct(buyerId, productId);
    if (!hasPurchased) {
      return {
        success: false,
        error: 'You can only review products you have purchased'
      };
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: {
        buyerId_productId: {
          buyerId,
          productId
        }
      }
    });

    if (existingReview) {
      return {
        success: false,
        error: 'You have already reviewed this product'
      };
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        buyerId,
        productId,
        rating,
        comment,
        reviewDate: new Date()
      },
      include: {
        buyer: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        product: {
          select: {
            name: true,
            producer: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Update product average rating
    await this.updateProductRating(productId);

    console.log(`⭐ Review created: ${rating} stars for product ${productId} by buyer ${buyerId}`);

    return {
      success: true,
      review
    };

  } catch (error) {
    console.error('❌ Create review error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

  // ==================== CHECK PURCHASE HISTORY ====================
async hasPurchasedProduct(buyerId, productId) {
  try {
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        productId: productId,
        order: {
          buyerId: buyerId, // Make sure this uses buyerId, not userId
          paymentStatus: 'CONFIRMED'
        }
      },
      include: {
        order: {
          select: {
            paymentStatus: true
          }
        }
      }
    });

    return !!orderItem;
  } catch (error) {
    console.error('Check purchase history error:', error);
    return false;
  }
}

  // ==================== UPDATE PRODUCT RATING ====================
  async updateProductRating(productId) {
    try {
      const reviews = await prisma.review.findMany({
        where: { productId },
        select: { rating: true }
      });

      if (reviews.length === 0) {
        // No reviews, set default values
        await prisma.product.update({
          where: { id: productId },
          data: {
            averageRating: 0,
            reviewCount: 0
          }
        });
        return;
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      const reviewCount = reviews.length;

      // Update product with new rating (we need to add these fields to Product model)
      await prisma.product.update({
        where: { id: productId },
        data: {
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          reviewCount: reviewCount
        }
      });

      console.log(`📊 Updated product ${productId} rating: ${averageRating.toFixed(1)} (${reviewCount} reviews)`);

    } catch (error) {
      console.error('Update product rating error:', error);
    }
  }

  // ==================== GET PRODUCT REVIEWS ====================
  async getProductReviews(productId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [reviews, total, product] = await Promise.all([
        prisma.review.findMany({
          where: { productId },
          include: {
            buyer: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: { reviewDate: 'desc' },
          skip,
          take: limit
        }),
        prisma.review.count({
          where: { productId }
        }),
        prisma.product.findUnique({
          where: { id: productId },
          select: {
            averageRating: true,
            reviewCount: true
          }
        })
      ]);

      return {
        success: true,
        data: {
          reviews,
          productStats: product || { averageRating: 0, reviewCount: 0 },
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };

    } catch (error) {
      console.error('Get product reviews error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== GET BUYER REVIEWS ====================
  async getBuyerReviews(buyerId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { buyerId },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                producer: {
                  include: {
                    user: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { reviewDate: 'desc' },
          skip,
          take: limit
        }),
        prisma.review.count({
          where: { buyerId }
        })
      ]);

      return {
        success: true,
        data: {
          reviews,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };

    } catch (error) {
      console.error('Get buyer reviews error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== UPDATE REVIEW ====================
  async updateReview(reviewId, buyerId, updates) {
    try {
      const { rating, comment } = updates;

      // Validate rating if provided
      if (rating && (rating < 1 || rating > 5)) {
        return {
          success: false,
          error: 'Rating must be between 1 and 5 stars'
        };
      }

      // Check if review exists and belongs to buyer
      const existingReview = await prisma.review.findFirst({
        where: {
          id: reviewId,
          buyerId
        }
      });

      if (!existingReview) {
        return {
          success: false,
          error: 'Review not found or access denied'
        };
      }

      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: {
          ...(rating && { rating }),
          ...(comment !== undefined && { comment }),
          reviewDate: new Date() // Update review date
        },
        include: {
          buyer: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          product: {
            select: {
              name: true
            }
          }
        }
      });

      // Update product average rating
      await this.updateProductRating(existingReview.productId);

      console.log(`✏️ Review updated: ${reviewId}`);

      return {
        success: true,
        review: updatedReview
      };

    } catch (error) {
      console.error('Update review error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== DELETE REVIEW ====================
  async deleteReview(reviewId, buyerId) {
    try {
      // Check if review exists and belongs to buyer
      const existingReview = await prisma.review.findFirst({
        where: {
          id: reviewId,
          buyerId
        }
      });

      if (!existingReview) {
        return {
          success: false,
          error: 'Review not found or access denied'
        };
      }

      const productId = existingReview.productId;

      // Delete the review
      await prisma.review.delete({
        where: { id: reviewId }
      });

      // Update product average rating
      await this.updateProductRating(productId);

      console.log(`🗑️ Review deleted: ${reviewId}`);

      return {
        success: true,
        message: 'Review deleted successfully'
      };

    } catch (error) {
      console.error('Delete review error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== GET REVIEW STATS ====================
  async getProductReviewStats(productId) {
    try {
      const reviews = await prisma.review.findMany({
        where: { productId },
        select: { rating: true }
      });

      const stats = {
        total: reviews.length,
        average: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };

      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        stats.average = Math.round((totalRating / reviews.length) * 10) / 10;

        // Calculate distribution
        reviews.forEach(review => {
          stats.distribution[review.rating]++;
        });
      }

      return {
        success: true,
        stats
      };

    } catch (error) {
      console.error('Get review stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ReviewService();