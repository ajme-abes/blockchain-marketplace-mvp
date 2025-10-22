const express = require('express');
const multer = require('multer');
const { authenticateToken, requireRole } = require('../middleware/auth');
const productService = require('../services/productService');
const ipfsService = require('../services/ipfsService');
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

// Get single product (Public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔧 Fetching product:', id);

    const product = await productService.getProductById(id);
    
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
    console.error('Get product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create product (PRODUCER only)
router.post('/', authenticateToken, requireRole(['PRODUCER']), upload.single('image'), async (req, res) => {
  try {
    console.log('🔧 Creating product for user:', req.user.id);
    console.log('🔧 Product data:', req.body);
    console.log('🔧 File received:', req.file ? `Yes (${req.file.originalname})` : 'No');

    const { name, description, price, category, quantity } = req.body;

    // Validate required fields
    if (!name || !price || !category || !quantity) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: name, price, category, quantity'
      });
    }

    // Validate price and quantity
    if (parseFloat(price) <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Price must be greater than 0'
      });
    }

    if (parseInt(quantity) < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Quantity cannot be negative'
      });
    }

    let imageCid = null;
    let ipfsRecord = null;

    // Upload image to IPFS if provided
    if (req.file) {
      console.log('🔧 Uploading image to IPFS...');
      const uploadResult = await ipfsService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        'PRODUCT_IMAGE',
        req.user.id
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
      console.log('✅ Image uploaded to IPFS:', imageCid);
    }

    // Create product
    const productData = {
      name,
      description: description || '',
      price: parseFloat(price),
      category,
      quantity: parseInt(quantity),
      producerId: req.user.id,
      imageCid
    };

    const product = await productService.createProduct(productData);

    console.log('✅ Product created successfully:', product.id);

    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    console.error('Create product error:', error);
    
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
});

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

module.exports = router;