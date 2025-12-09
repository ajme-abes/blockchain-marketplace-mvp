const express = require('express');
const multer = require('multer');
const { authenticateToken, checkUserStatus, requireRole } = require('../middleware/auth');
const productService = require('../services/productService');
const ipfsService = require('../services/ipfsService');
const { prisma } = require('../config/database');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all products (Public)
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('🔧 Fetching products with filters:', {
      category, search, minPrice, maxPrice, page, limit
    });

    const products = await productService.getProducts({
      category,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    res.json({
      status: 'success',
      data: products
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔧 Fetching product details:', id);

    const product = await productService.getProductDetail(id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.json({
      status: 'success',
      data: product
    });

  } catch (error) {
    console.error('Get product detail error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create product (PRODUCER only)

router.post(
  '/',
  authenticateToken, checkUserStatus,
  requireRole(['PRODUCER']),
  upload.array('images', 5),
  async (req, res) => {
    // ✅ Define variables at the top
    let ipfsRecords = [];
    let imageCids = [];

    try {
      console.log('🔧 Creating product for user:', req.user.id);
      console.log('🔧 Product data:', req.body);
      console.log(`🔧 Files received: ${req.files?.length || 0}`);

      // ✅ CHECK PRODUCER VERIFICATION STATUS
      const producer = await prisma.producer.findUnique({
        where: { userId: req.user.id },
        select: { verificationStatus: true, rejectionReason: true }
      });

      if (!producer) {
        return res.status(403).json({
          status: 'error',
          message: 'Producer profile not found'
        });
      }

      if (producer.verificationStatus !== 'VERIFIED') {
        return res.status(403).json({
          status: 'error',
          message: producer.verificationStatus === 'REJECTED'
            ? `Your producer account verification was rejected. ${producer.rejectionReason ? `Reason: ${producer.rejectionReason}` : ''} Please contact support to resubmit.`
            : 'Your producer account is pending verification. You cannot list products until verified.',
          verificationStatus: producer.verificationStatus,
          rejectionReason: producer.rejectionReason
        });
      }

      const { name, description, price, category, quantity, unit, region } = req.body;

      // Validate required fields
      if (!name || !price || !category || !quantity) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields: name, price, category, quantity'
        });
      }

      // ✅ UPLOAD IMAGES TO IPFS
      if (req.files && req.files.length > 0) {
        console.log('🔧 Uploading images to IPFS...');
        for (const file of req.files) {
          const uploadResult = await ipfsService.uploadFile(
            file.buffer,
            file.originalname,
            'PRODUCT_IMAGE',
            req.user.id
            // Don't pass productId yet - product doesn't exist
          );

          if (uploadResult.success) {
            imageCids.push(uploadResult.cid);
            ipfsRecords.push(uploadResult.ipfsRecord);
            console.log(`✅ Uploaded: ${file.originalname} → ${uploadResult.cid}`);
          } else {
            console.warn(`⚠️ Failed to upload ${file.originalname}:`, uploadResult.error);
          }
        }
      }

      console.log('🔍 DEBUG - Before product creation:');
      console.log('🔍 imageCids:', imageCids);
      console.log('🔍 ipfsRecords:', ipfsRecords.map(r => ({ id: r.id, cid: r.cid })));

      // ✅ CREATE PRODUCT WITH IMAGE URLS
      const productData = {
        name,
        description: description || '',
        price: parseFloat(price),
        category,
        quantityAvailable: parseInt(quantity), // ✅ Maps to quantityAvailable in service
        producerId: req.user.id,
        imageCids, // ✅ Pass the CIDs to create proper imageUrl
        unit: unit || 'unit', // ✅ Include unit
        region: region || '' // ✅ Include region
      };

      console.log('🔧 Creating product with data:', productData);

      const product = await productService.createProduct(productData);

      // ✅ LINK IPFS RECORDS TO PRODUCT
      if (ipfsRecords.length > 0) {
        console.log('🔗 Linking IPFS files to product:', product.id);

        // Update each IPFS record with the product ID
        await Promise.all(
          ipfsRecords.map(record =>
            prisma.iPFSMetadata.update({
              where: { id: record.id },
              data: {
                product: { connect: { id: product.id } } // ✅ Use relation connection
              }
            })
          )
        );

        // Verify the links were created
        const updatedRecords = await prisma.iPFSMetadata.findMany({
          where: { id: { in: ipfsRecords.map(r => r.id) } },
          select: { id: true, cid: true, productId: true }
        });

        console.log('✅ IPFS records linked to product:', updatedRecords);

        // Also verify the product has the IPFS files connected
        const productWithFiles = await prisma.product.findUnique({
          where: { id: product.id },
          include: { ipfsFiles: true }
        });
        console.log('✅ Product IPFS files after linking:', productWithFiles.ipfsFiles.map(f => f.cid));
      }

      console.log('✅ Product created successfully:', {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        hasImages: !!product.imageUrl
      });

      res.status(201).json({
        status: 'success',
        message: 'Product created successfully',
        data: product
      });

    } catch (error) {
      console.error('Create product error:', error);

      // ✅ CLEANUP: Delete IPFS records if product creation fails
      if (ipfsRecords && ipfsRecords.length > 0) {
        console.log('🧹 Cleaning up IPFS records due to error');
        try {
          await Promise.all(
            ipfsRecords.map(record =>
              prisma.iPFSMetadata.delete({ where: { id: record.id } })
            )
          );
          console.log('✅ Cleanup completed');
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }

      // Handle specific errors
      if (error.code === 'P2002') {
        return res.status(400).json({
          status: 'error',
          message: 'Product with similar details already exists'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to create product',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Update product (Owner only)

router.put('/:id', authenticateToken, checkUserStatus, upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, quantity, unit, region } = req.body;

    console.log('🔧 Updating product:', id);
    console.log('🔧 Update data:', { name, description, price, category, quantity, unit, region });
    console.log('🔧 Files received:', req.files?.length || 0);

    // Check if product exists
    const existingProduct = await productService.getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Check ownership
    const { prisma } = require('../config/database');
    const producer = await prisma.producer.findUnique({
      where: { id: existingProduct.producer.id }
    });

    if (req.user.role !== 'ADMIN' && producer.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own products.'
      });
    }

    let imageCid = null;
    let ipfsRecords = [];

    // ✅ UPLOAD NEW IMAGES TO IPFS IF PROVIDED
    if (req.files && req.files.length > 0) {
      console.log('🔧 Uploading new images to IPFS...');

      for (const file of req.files) {
        const uploadResult = await ipfsService.uploadFile(
          file.buffer,
          file.originalname,
          'PRODUCT_IMAGE',
          req.user.id,
          id // Now we have product ID
        );

        if (uploadResult.success) {
          imageCid = uploadResult.cid; // Use the last uploaded image
          ipfsRecords.push(uploadResult.ipfsRecord);
          console.log('✅ New image uploaded to IPFS:', imageCid);
        } else {
          console.warn('⚠️ Failed to upload image:', uploadResult.error);
        }
      }
    }

    // ✅ PREPARE UPDATE DATA
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (category) updateData.category = category;
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (unit) updateData.unit = unit;
    if (region) updateData.region = region;

    // ✅ SET IMAGE CID FOR SERVICE TO CREATE PROPER IMAGE URL
    if (imageCid) {
      updateData.imageCid = imageCid;
    }

    console.log('🔧 Final update data for service:', updateData);

    const updatedProduct = await productService.updateProduct(id, updateData);

    console.log('✅ Product updated successfully:', {
      id: updatedProduct.id,
      imageUrl: updatedProduct.imageUrl
    });

    res.json({
      status: 'success',
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// Delete product (Owner only)
router.delete('/:id', authenticateToken, checkUserStatus, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔧 Deleting product:', id);

    // Check if product exists
    const existingProduct = await productService.getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Check ownership - we need to compare the producer user ID
    const { prisma } = require('../config/database');
    const producer = await prisma.producer.findUnique({
      where: { id: existingProduct.producer.id }
    });

    if (req.user.role !== 'ADMIN' && producer.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only delete your own products.'
      });
    }

    await productService.deleteProduct(id);

    console.log('✅ Product deleted successfully');

    res.json({
      status: 'success',
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get producer's own products
router.get('/my/products', authenticateToken, checkUserStatus, requireRole(['PRODUCER']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    console.log('🔧 Fetching products for producer:', req.user.id);

    const products = await productService.getProducerProducts(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      status: 'success',
      data: products
    });

  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch your products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// Add this route to your routes/product.js - Status update endpoint
router.patch('/:id/status', authenticateToken, checkUserStatus, requireRole(['PRODUCER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('🔧 Updating product status:', { id, status });

    // Validate status
    const validStatuses = ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be: ACTIVE, INACTIVE, or OUT_OF_STOCK'
      });
    }

    // Check if product exists and belongs to the user
    const existingProduct = await productService.getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Verify ownership
    const { prisma } = require('../config/database');
    const producer = await prisma.producer.findUnique({
      where: { id: existingProduct.producer.id }
    });

    if (req.user.role !== 'ADMIN' && producer.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own products.'
      });
    }

    // Update product status - use the correct status values from your schema
    const updateData = { status: status.toUpperCase() };
    const updatedProduct = await productService.updateProduct(id, updateData);

    console.log('✅ Product status updated successfully');

    res.json({
      status: 'success',
      message: 'Product status updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update product status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// Add this to routes/product.js for testing
router.get('/test/status', (req, res) => {
  res.json({ message: 'Status endpoint is working!' });
});

// PUBLIC ROUTE - Get producer public profile
router.get('/producer/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const { prisma } = require('../config/database');

    const producer = await prisma.producer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            registrationDate: true
          }
        },
        products: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            imageUrl: true,
            unit: true,
            quantityAvailable: true,
            status: true
          },
          orderBy: { listingDate: 'desc' }
        }
      }
    });

    if (!producer) {
      return res.status(404).json({
        status: 'error',
        message: 'Producer not found'
      });
    }

    // Get all product IDs for this producer
    const productIds = producer.products.map(p => p.id);

    // Calculate real ratings from reviews
    let averageRating = 0;
    let totalReviews = 0;

    if (productIds.length > 0) {
      // Get all reviews for this producer's products
      const reviews = await prisma.review.findMany({
        where: {
          productId: {
            in: productIds
          }
        },
        select: {
          rating: true
        }
      });

      totalReviews = reviews.length;

      if (totalReviews > 0) {
        const sumRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
        averageRating = Math.round((sumRatings / totalReviews) * 10) / 10; // Round to 1 decimal
      }

      console.log(`📊 Producer ${producer.businessName} stats:`, {
        productIds: productIds.length,
        totalReviews,
        averageRating
      });
    }

    // Calculate stats
    const stats = {
      totalProducts: producer.products.length,
      activeProducts: producer.products.filter(p => p.status === 'ACTIVE').length,
      averageRating: averageRating,
      totalReviews: totalReviews
    };

    // Format products
    const formattedProducts = producer.products.map(p => ({
      ...p,
      stock: p.quantityAvailable
    }));

    res.json({
      status: 'success',
      data: {
        ...producer,
        products: formattedProducts,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching producer profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch producer profile'
    });
  }
});

module.exports = router;
