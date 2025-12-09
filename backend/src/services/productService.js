// backend/src/services/productService.js
const { prisma } = require('../config/database');

class ProductService {


  // In backend/src/services/productService.js - UPDATE createProduct method

  async createProduct(productData) {
    const { name, description, price, category, quantityAvailable, producerId, imageCids = [], unit, region } = productData;

    console.log('🔧 Creating product with producerId:', producerId);
    console.log('🔧 Image CIDs received:', imageCids);
    console.log('🔧 Product data:', { name, description, price, category, quantityAvailable, unit, region });

    // First, find the producer profile for this user
    const producer = await prisma.producer.findUnique({
      where: { userId: producerId }
    });

    if (!producer) {
      throw new Error('Producer profile not found. User must have a producer profile to create products.');
    }

    console.log('🔧 Found producer profile:', producer.id);

    // ✅ FIXED: Use the first CID to create proper imageUrl
    let primaryImageUrl = null;
    if (imageCids.length > 0) {
      primaryImageUrl = `https://gateway.pinata.cloud/ipfs/${imageCids[0]}`;
      console.log('🖼️ Setting product imageUrl from IPFS:', primaryImageUrl);
    } else {
      console.log('🖼️ No image CIDs provided, imageUrl will be null');
    }

    // ✅ FIXED: Include ALL required fields including quantityAvailable, unit, and region
    const createData = {
      name,
      description: description || '',
      price: parseFloat(price),
      category,
      quantityAvailable: parseInt(quantityAvailable),
      producerId: producer.id,
      imageUrl: primaryImageUrl,
      unit: unit || 'unit',
      region: region || producer.location || 'Local',
    };

    // Only add ipfsFiles connection if there are CIDs
    if (imageCids.length > 0) {
      const ipfsFileIds = await this.getIpfsFileIds(imageCids);
      if (ipfsFileIds.length > 0) {
        createData.ipfsFiles = {
          connect: ipfsFileIds
        };
        console.log('🔗 Connecting IPFS files to product:', ipfsFileIds);
      }
    }

    console.log('🔧 Final create data:', createData);

    // Create product with all required fields
    const product = await prisma.product.create({
      data: createData,
      include: {
        producer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        ipfsFiles: true
      }
    });

    console.log('✅ Product created successfully:', {
      id: product.id,
      imageUrl: product.imageUrl,
      ipfsFilesCount: product.ipfsFiles?.length || 0
    });

    return this.formatProductResponse(product);
  }

  // Helper method to get IPFS file IDs
  async getIpfsFileIds(cids) {
    const files = [];
    for (const cid of cids) {
      const file = await prisma.iPFSMetadata.findUnique({
        where: { cid },
        select: { id: true }
      });
      if (file) {
        files.push({ id: file.id });
      }
    }
    return files;
  }
  async getProducts(filters = {}) {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = 'listingDate',
      sortOrder = 'desc'
    } = filters;

    const where = {
      status: 'ACTIVE',
      quantityAvailable: { gt: 0 }, // ✅ Only show products with stock
      producer: {
        verificationStatus: 'VERIFIED' // ✅ Only show products from verified producers
      }
    };

    // Apply filters - case-insensitive category match
    if (category) {
      where.category = {
        equals: category,
        mode: 'insensitive'
      };
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Define allowed sort fields for security
    const allowedSortFields = ['listingDate', 'price', 'name', 'averageRating'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'listingDate';
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          producer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          reviews: {
            select: {
              rating: true
            }
          },
          ipfsFiles: true
        },
        orderBy: { [sortField]: orderDirection }, // Now dynamic and secure
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    const formattedProducts = products.map(product => this.formatProductResponse(product));

    return {
      products: formattedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    };
  }

  async getProductById(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        producer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        reviews: {
          include: {
            buyer: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: { reviewDate: 'desc' }
        },
        ipfsFiles: true
      }
    });

    if (!product) return null;

    return this.formatProductResponse(product);
  }


  async updateProduct(id, updateData) {
    console.log('🔄 Updating product in service:', { id, updateData });

    // ✅ FIX: Map 'quantity' to 'quantityAvailable' for Prisma
    const prismaUpdateData = { ...updateData };

    // If 'quantity' is provided, map it to 'quantityAvailable'
    if (prismaUpdateData.quantity !== undefined) {
      prismaUpdateData.quantityAvailable = prismaUpdateData.quantity;
      delete prismaUpdateData.quantity; // Remove the invalid field
    }

    // If 'imageCid' is provided, create proper imageUrl
    if (prismaUpdateData.imageCid) {
      prismaUpdateData.imageUrl = `https://gateway.pinata.cloud/ipfs/${prismaUpdateData.imageCid}`;
      delete prismaUpdateData.imageCid; // Remove if not needed
    }

    console.log('🔧 Mapped update data for Prisma:', prismaUpdateData);

    const product = await prisma.product.update({
      where: { id },
      data: prismaUpdateData, // ✅ Now uses correct field names
      include: {
        producer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return this.formatProductResponse(product);
  }
  async deleteProduct(id) {
    // Soft delete by setting status to INACTIVE
    await prisma.product.delete({
      where: { id },
    });
  }
  // Add this to your productService.js if it doesn't exist
  async updateProductStatus(id, status) {
    console.log('🔄 Updating product status in service:', { id, status });

    const product = await prisma.product.update({
      where: { id },
      data: { status },
      include: {
        producer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        ipfsFiles: true
      }
    });

    return this.formatProductResponse(product);
  }
  async getProductDetail(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        producer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        reviews: {
          include: {
            buyer: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          },
          orderBy: { reviewDate: 'desc' }
        },
        ipfsFiles: true,
        // Add order items count for popularity
        _count: {
          select: {
            orderItems: true
          }
        }
      }
    });

    if (!product) return null;

    return this.formatProductDetailResponse(product);
  }

  formatProductDetailResponse(product) {
    const baseProduct = this.formatProductResponse(product);

    // Calculate detailed rating stats
    const reviews = product.reviews || [];
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingCounts[review.rating]++;
      }
    });

    return {
      ...baseProduct,
      // These are now included in baseProduct from formatProductResponse
      stock: product.quantityAvailable,
      popularity: product._count?.orderItems || 0,
      reviews: reviews.length,
      blockchainTxHash: null, // You can populate this from order data
      nameAmh: '', // Add if you have Amharic names

      // Detailed review data
      reviewDetails: {
        total: reviews.length,
        average: baseProduct.averageRating,
        distribution: ratingCounts,
        reviews: reviews.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          date: review.reviewDate,
          buyer: {
            name: review.buyer?.user?.name || 'Anonymous',
            email: review.buyer?.user?.email
          }
        }))
      },

      // Producer contact info
      producerContact: {
        phone: product.producer?.user?.phone,
        email: product.producer?.user?.email
      }
    };
  }

  async getProducerProducts(userId, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;

    // First find the producer profile
    const producer = await prisma.producer.findUnique({
      where: { userId }
    });

    if (!producer) {
      return {
        products: [],
        pagination: {
          page,
          limit,
          totalCount: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: { producerId: producer.id },
        include: {
          producer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          reviews: {
            select: {
              rating: true
            }
          },
          ipfsFiles: true
        },
        orderBy: { listingDate: 'desc' }, // Changed from createdAt to listingDate
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.product.count({ where: { producerId: producer.id } })
    ]);

    const formattedProducts = products.map(product => this.formatProductResponse(product));

    return {
      products: formattedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    };
  }


  formatProductResponse(product) {
    const avgRating = product.reviews && product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : null;

    // ✅ PRIORITIZE imageUrl field first
    let primaryImageUrl = product.imageUrl;

    // If no imageUrl, try to get from IPFS files
    if (!primaryImageUrl && product.ipfsFiles && product.ipfsFiles.length > 0) {
      const firstFile = product.ipfsFiles[0];
      primaryImageUrl = `https://gateway.pinata.cloud/ipfs/${firstFile.cid}`;
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      quantityAvailable: product.quantityAvailable,
      unit: product.unit || 'unit',
      region: product.region || product.producer?.location || 'Local',
      status: product.status,
      verified: product.producer?.verificationStatus === 'VERIFIED',
      // ✅ SIMPLE IMAGE STRUCTURE - frontend can use this directly
      imageUrl: primaryImageUrl,
      images: {
        url: primaryImageUrl,
        ipfsCid: primaryImageUrl ? primaryImageUrl.split('/').pop() : null,
        alternatives: []
      },
      ipfsMetadata: product.ipfsFiles?.map(file => ({
        cid: file.cid,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        category: file.category,
        createdAt: file.createdAt
      })) || [],
      rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      reviewCount: product.reviews ? product.reviews.length : 0,
      producerName: product.producer?.businessName || product.producer?.user?.name || 'Local Farmer',
      producer: product.producer ? {
        id: product.producer.id,
        businessName: product.producer.businessName,
        location: product.producer.location,
        verificationStatus: product.producer.verificationStatus,
        user: product.producer.user
      } : null,
      listingDate: product.listingDate,
      updatedAt: product.updatedAt
    };
  }
}

module.exports = new ProductService();