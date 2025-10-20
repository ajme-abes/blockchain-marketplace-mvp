const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { testConnection } = require('./config/database');
const blockchainRoutes = require('./routes/blockchain');
const userRoutes = require('./routes/user');
const securityMiddleware = require('./middleware/security');
const jobService = require('./services/jobService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE (Order Matters!) ====================

// 1. Security Middleware (First line of defense)
app.use(securityMiddleware.securityHeaders);
app.use(securityMiddleware.limiter);
app.use(securityMiddleware.auditMiddleware);

// 2. Core Express Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false // Allow external resources
}));
app.use(cors(securityMiddleware.corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
      notifications: 'Ready'
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
        'Background Jobs'
      ],
      security: [
        'Rate Limiting',
        'XSS Protection',
        'SQL Injection Prevention',
        'CORS Enabled',
        'Helmet Security Headers'
      ]
    }
  });
});

// ==================== API ROUTES ====================

// Blockchain routes
app.use('/api/blockchain', blockchainRoutes);

// User routes
app.use('/api/users', userRoutes);

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

    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 BLOCKCHAIN MARKETPLACE BACKEND STARTED SUCCESSFULLY!');
      console.log('='.repeat(60));
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: PostgreSQL + Prisma ORM`);
      console.log(`⛓️  Blockchain: Integrated (Polygon Mumbai ready)`);
      console.log(`🛡️  Security: Enhanced protection enabled`);
      console.log('='.repeat(60));
      console.log('\n📋 Available Endpoints:');
      console.log(`   GET  /api/health           - System health check`);
      console.log(`   GET  /api/db-health        - Database status`);
      console.log(`   GET  /api/system-info      - System information`);
      console.log(`   POST /api/users/register   - User registration`);
      console.log(`   GET  /api/users            - List all users`);
      console.log(`   GET  /api/blockchain/status - Blockchain status`);
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