const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { testConnection } = require('./config/database');
const blockchainRoutes = require('./routes/blockchain'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Database connection test
app.get('/api/db-health', async (req, res) => {
  const isConnected = await testConnection();
  
  if (isConnected) {
    res.status(200).json({
      status: 'success',
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});
app.use('/api/blockchain', blockchainRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Blockchain Marketplace API is running!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use(/.*/, (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});


// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// Start server only if database connects
const startServer = async () => {
  const isDbConnected = await testConnection();
  
  if (isDbConnected) {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📍 DB Health: http://localhost:${PORT}/api/db-health`);
    });
  } else {
    console.error('❌ Failed to start server: Database connection failed');
    process.exit(1);
  }
};

startServer();