const express = require('express');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
const morgan = require('morgan');
const dbModule = require('./config/database');
const blockchainRoutes = require('./routes/blockchain');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth'); // NEW
const securityMiddleware = require('./middleware/security');
const jobService = require('./services/jobService');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const ipfsRoutes = require('./routes/ipfs');
const emailVerificationRoutes = require('./routes/emailVerification');
const disputeRoutes = require('./routes/disputes');
const chatRoutes = require('./routes/chat');
const socketService = require('./services/socketService');
const analyticsRoutes = require('./routes/analytics');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Ensure a Prisma (or DB) client is available to services that expect it.
// If config/database exported a client (dbModule.prisma), reuse it.
// Otherwise, try to create a PrismaClient fallback (if @prisma/client is installed).
if (dbModule.prisma) {
  global.prisma = dbModule.prisma;
} else {
  try {
    const { PrismaClient } = require('@prisma/client');
    // Only create a global instance once (helps with hot-reload / dev)
    if (!global.prisma) global.prisma = new PrismaClient();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Prisma client not available from config/database and @prisma/client cannot be loaded. Some services may fail if they expect a Prisma client.', e?.message || e);
    global.prisma = global.prisma || undefined;
  }
}

// If chatService (or other services) exposes an initializer, pass the client so internal prisma references won't be undefined.
try {
  const chatService = require('./services/chatService');
  if (chatService) {
    if (typeof chatService.initialize === 'function') {
      chatService.initialize(global.prisma);
    } else if (typeof chatService.setPrisma === 'function') {
      chatService.setPrisma(global.prisma);
    } else if (typeof chatService.init === 'function') {
      chatService.init(global.prisma);
    }
  }
} catch (e) {
  // Not fatal here; just log so we can see if chatService couldn't be initialized.
  console.warn('Unable to automatically initialize chatService with prisma client:', e?.message || e);
}

// ===== Add testConnection fallback so routes and startup can call it =====
const testConnection = dbModule.testConnection
  || dbModule.test_connection
  || (async () => {
    // If a Prisma client is available, run a lightweight query to verify connection.
    if (global.prisma && typeof global.prisma.$queryRaw === 'function') {
      try {
        // eslint-disable-next-line no-unused-vars
        await global.prisma.$queryRaw`SELECT 1`;
        return true;
      } catch (err) {
        console.warn('DB health check failed:', err?.message || err);
        return false;
      }
    }
    // No explicit test function and no prisma client -> treat as not connected.
    return false;
  });
// =======================================================================

// ==================== MIDDLEWARE (Order Matters!) ====================

// 1. Security Middleware (First line of defense)
app.use(securityMiddleware.securityHeaders);
app.use(securityMiddleware.limiter);
app.use(securityMiddleware.auditMiddleware);

socketService.initialize(server);

// 2. Core Express Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false // Allow external resources
}));
app.use(cors({
  origin: function (origin, callback) {
    // Get allowed origins from environment variable or use defaults
    const envOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [];

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      ...envOrigins // Add production origins from environment
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}. Allowed origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 3. Input Sanitization & Security
app.use(securityMiddleware.sanitizeInput);
app.use(securityMiddleware.xssProtection);
app.use(securityMiddleware.preventParameterPollution);

// ==================== HEALTH & STATUS ENDPOINTS ====================

// Database health check
app.get('/api/db-health', async (req, res) => {
  const isConnected = await testConnection();

  if (isConnected) {
    res.status(200).json({
      status: 'success',
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL',
      orm: 'Prisma'
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// System health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Blockchain Marketplace API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'Connected',
      blockchain: 'Integrated',
      security: 'Enabled',
      notifications: 'Ready',
      authentication: 'JWT Enabled',
      websocket: 'Active'
    }
  });
});

// System info endpoint
app.get('/api/system-info', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      system: 'Blockchain Marketplace Backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: [
        'User Management',
        'Product Catalog',
        'Order System',
        'Blockchain Integration',
        'IPFS File Storage',
        'Email Notifications',
        'Audit Logging',
        'Background Jobs',
        'JWT Authentication' // UPDATED
      ],
      security: [
        'Rate Limiting',
        'XSS Protection',
        'SQL Injection Prevention',
        'CORS Enabled',
        'Helmet Security Headers',
        'JWT Token Authentication' // UPDATED
      ]
    }
  });
});

app.get('/api/socket-test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Socket.io server is running',
    websocket: 'Enabled',
    timestamp: new Date().toISOString()
  });
});

// ==================== API ROUTES ====================

// Blockchain routes
app.use('/api/blockchain', blockchainRoutes);

// User routes
app.use('/api/users', userRoutes);

// Auth routes - NEW
app.use('/api/auth', authRoutes);

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payouts', require('./routes/payouts')); // ✅ NEW: Payout routes
app.use('/api/bank-accounts', require('./routes/bankAccounts')); // ✅ NEW: Bank account routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/email-verification', emailVerificationRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/transactions', require('./routes/transactions'));
// Chat routes (single registration)
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/producers', require('./routes/producer'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/team', require('./routes/team'));

// ==================== UPLOAD / MULTER ERROR HANDLER ====================
// Handle common multer / busboy errors so they don't bubble as 500s with obscure stack traces
app.use((err, req, res, next) => {
  // Identify multer/busboy related errors by code or message patterns
  const isMulterError = err && (
    err.code === 'LIMIT_FILE_SIZE' ||
    err.code === 'LIMIT_FIELD_VALUE' ||
    err.code === 'LIMIT_FIELD_COUNT' ||
    err.code === 'LIMIT_UNEXPECTED_FILE' ||
    /Unexpected end of multipart data/i.test(err.message || '') ||
    /Multipart: boundary not found/i.test(err.message || '') ||
    /busboy/i.test(err.stack || '') ||
    /write after end/i.test(err.message || '')
  );

  if (isMulterError) {
    console.warn('🔧 File upload error:', { message: err.message, code: err.code, path: req.path, method: req.method });
    return res.status(400).json({
      status: 'error',
      message: err.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file is too large' : (err.message || 'Invalid file upload'),
      timestamp: new Date().toISOString()
    });
  }

  // Not a multer/busboy error — pass along to the global error handler
  return next(err);
});

// ==================== ERROR HANDLING ====================

// 404 handler - Catch undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler - Catch all errors
app.use((error, req, res, next) => {
  console.error('🚨 Server Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    status: 'error',
    message: isProduction ? 'Internal server error' : error.message,
    ...(isProduction ? {} : { stack: error.stack }),
    timestamp: new Date().toISOString()
  });
});

// ==================== SERVER STARTUP ====================

const startServer = async () => {
  try {
    const isDbConnected = await testConnection();

    if (!isDbConnected) {
      console.error('❌ Failed to start server: Database connection failed');
      process.exit(1);
    }

    // Start background jobs
    jobService.startJobs();
    console.log('✅ Background jobs initialized');

    // Auto-create admin from environment variables
    try {
      const { autoCreateAdmin } = require('./utils/autoCreateAdmin');
      await autoCreateAdmin();
    } catch (error) {
      console.warn('⚠️  Auto-create admin skipped:', error.message);
    }

    // ✅ FIX: Use server.listen instead of app.listen
    server.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 BLOCKCHAIN MARKETPLACE BACKEND STARTED SUCCESSFULLY!');
      console.log('='.repeat(60));
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: PostgreSQL + Prisma ORM`);
      console.log(`⛓️  Blockchain: Integrated (Polygon Mumbai ready)`);
      console.log(`🔐 Authentication: JWT Enabled`);
      console.log(`💬 WebSocket: Real-time chat enabled`); // ADD THIS
      console.log(`🛡️  Security: Enhanced protection enabled`);
      console.log('='.repeat(60));
      console.log('\n📋 Available Endpoints:');
      console.log(`   GET  /api/health           - System health check`);
      console.log(`   GET  /api/db-health        - Database status`);
      console.log(`   GET  /api/system-info      - System information`);
      console.log(`   POST /api/auth/login       - User login`);
      console.log(`   POST /api/auth/register    - User registration`);
      console.log(`   GET  /api/auth/me          - Get current user`);
      console.log(`   POST /api/auth/logout      - User logout`);
      console.log(`   GET  /api/users            - List all users (Admin)`);
      console.log(`   GET  /api/blockchain/status - Blockchain status`);
      console.log(`   💬  WebSocket             - Real-time chat`); // ADD THIS
      console.log('='.repeat(60) + '\n');
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      jobService.stopJobs();
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      jobService.stopJobs();
      process.exit(0);
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();