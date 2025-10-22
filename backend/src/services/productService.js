// backend/src/services/productService.js
const { prisma } = require('../config/database');

class ProductService {
  async createProduct(productData) {
    const { name, description, price, category, quantity, producerId, imageCid } = productData;

    console.log('🔧 Creating product with producerId:', producerId);

    // First, find the producer profile for this user
    const producer = await prisma.producer.findUnique({
      where: { userId: producerId }
    });

    if (!producer) {
      throw new Error('Producer profile not found. User must have a producer profile to create products.');
    }

    console.log('🔧 Found producer profile:', producer.id);

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        category,
        quantityAvailable: quantity,
        producerId: producer.id, // Use the producer.id, not user.id
        imageUrl: imageCid ? `ipfs://${imageCid}` : null,
      },
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

async getProducts(filters = {}) {
  const { 
    category, 
    search, 
    minPrice, 
    maxPrice, 
    page = 1, 
    limit = 10
  } = filters;

  const where = {
    status: 'ACTIVE'
  };

  // Apply filters
  if (category) where.category = category;
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
      orderBy: { listingDate: 'desc' }, // HARDCODED - remove dynamic [sortBy]
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
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        ...(updateData.imageCid && { imageUrl: `ipfs://${updateData.imageCid}` })
      },
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
    await prisma.product.update({
      where: { id },
      data: { status: 'INACTIVE' }
    });
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

  // Get IPFS CID from ipfsFiles relationship or from imageUrl
  const ipfsFile = product.ipfsFiles && product.ipfsFiles[0];
  const imageCid = ipfsFile ? ipfsFile.cid : (product.imageUrl ? product.imageUrl.replace('ipfs://', '') : null);

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    quantityAvailable: product.quantityAvailable,
    status: product.status,
    imageUrl: product.imageUrl,
    imageCid: imageCid,
    averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    reviewCount: product.reviews ? product.reviews.length : 0,
    producer: product.producer ? {
      id: product.producer.id,
      businessName: product.producer.businessName,
      location: product.producer.location,
      verificationStatus: product.producer.verificationStatus,
      user: product.producer.user
    } : null,
    listingDate: product.listingDate, // Changed from createdAt
    updatedAt: product.updatedAt
  };
}
}

module.exports = new ProductService();