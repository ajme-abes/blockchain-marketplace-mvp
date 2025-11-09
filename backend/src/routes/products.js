const express = require('express');
const multer = require('multer');
const { authenticateToken, requireRole } = require('../middleware/auth');
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
  authenticateToken,
  requireRole(['PRODUCER']),
  upload.array('images', 5),
  async (req, res) => {
    try {
      console.log('🔧 Creating product for user:', req.user.id);
      console.log('🔧 Product data:', req.body);
      console.log(`🔧 Files received: ${req.files?.length || 0}`);

      const { name, description, price, category, quantity, region, unit } = req.body;

      // Validate required fields
      if (!name || !price || !category || !quantity) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields: name, price, category, quantity'
        });
      }

      let imageCids = [];
      let ipfsRecords = [];

      // ✅ Upload multiple images to IPFS if provided
      if (req.files && req.files.length > 0) {
        console.log('🔧 Uploading images to IPFS...');
        for (const file of req.files) {
          const uploadResult = await ipfsService.uploadFile(
            file.buffer,
            file.originalname,
            'PRODUCT_IMAGE',
            req.user.id
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

      // ✅ DEBUG: Check current state before product creation
      console.log('🔍 DEBUG - Before product creation:');
      console.log('🔍 imageCids:', imageCids);
      console.log('🔍 ipfsRecords:', ipfsRecords.map(r => ({ id: r.id, cid: r.cid, productId: r.productId })));

      // Check current state of IPFS files in database
      const dbFiles = await prisma.iPFSMetadata.findMany({
        where: { cid: { in: imageCids } },
        select: { id: true, cid: true, productId: true }
      });
      console.log('🔍 Files in database before product creation:', dbFiles);

      // ✅ Create product
      const productData = {
        name,
        description: description || '',
        price: parseFloat(price),
        category,
        quantity: parseInt(quantity),
        producerId: req.user.id,
        imageCids // Pass the CIDs to the service
      };

      const product = await productService.createProduct(productData);

      // ✅ CRITICAL: Update IPFS records with the product ID
      if (ipfsRecords.length > 0) {
        console.log('🔗 Linking IPFS files to product:', product.id);
        
        // Update each IPFS record with the product ID
        await Promise.all(
          ipfsRecords.map(record =>
            prisma.iPFSMetadata.update({
              where: { id: record.id },
              data: { productId: product.id }
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

      console.log('✅ Product created successfully:', product.id);

      res.status(201).json({
        status: 'success',
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      console.error('Create product error:', error);

      // Cleanup: If product creation fails, delete any IPFS records that were created
      if (ipfsRecords && ipfsRecords.length > 0) {
        console.log('🧹 Cleaning up IPFS records due to error');
        try {
          await Promise.all(
            ipfsRecords.map(record =>
              prisma.iPFSMetadata.delete({ where: { id: record.id } })
            )
          );
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }

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
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, quantity } = req.body;

    console.log('🔧 Updating product:', id);
    console.log('🔧 Update data:', { name, description, price, category, quantity });

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
        message: 'Access denied. You can only update your own products.'
      });
    }

    let imageCid = existingProduct.imageCid;
    let ipfsRecord = null;

    // Upload new image to IPFS if provided
    if (req.file) {
      console.log('🔧 Uploading new image to IPFS...');
      const uploadResult = await ipfsService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        'PRODUCT_IMAGE',
        req.user.id,
        id
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          status: 'error',
          message: 'Failed to upload product image',
          error: uploadResult.error
        });
      }

      imageCid = uploadResult.cid;
      ipfsRecord = uploadResult.ipfsRecord;
      console.log('✅ New image uploaded to IPFS:', imageCid);
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (category) updateData.category = category;
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (imageCid) updateData.imageCid = imageCid;

    const updatedProduct = await productService.updateProduct(id, updateData);

    console.log('✅ Product updated successfully');

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
router.delete('/:id', authenticateToken, async (req, res) => {
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
router.get('/my/products', authenticateToken, requireRole(['PRODUCER']), async (req, res) => {
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
router.patch('/:id/status', authenticateToken, requireRole(['PRODUCER']), async (req, res) => {
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

module.exports = router;