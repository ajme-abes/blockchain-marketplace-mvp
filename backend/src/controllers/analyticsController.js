const analyticsService = require('../services/analyticsService');

class AnalyticsController {
  
  // Get producer overview analytics
  async getProducerOverview(req, res) {
    try {
      const { timeframe = 'monthly' } = req.query;
      const producerId = req.user.producerId;

      console.log('📊 Fetching overview for producer:', producerId);

      if (!producerId) {
        return res.status(400).json({
          status: 'error',
          message: 'Producer profile not found'
        });
      }

      const analytics = await analyticsService.getProducerOverview(producerId, timeframe);

      res.json({
        status: 'success',
        data: analytics
      });

    } catch (error) {
      console.error('Get producer overview error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch analytics overview',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get sales trends
  async getSalesTrends(req, res) {
    try {
      const { timeframe = 'monthly' } = req.query;
      const producerId = req.user.producerId;

      console.log('📊 Fetching sales trends for producer:', producerId);

      if (!producerId) {
        return res.status(400).json({
          status: 'error',
          message: 'Producer profile not found'
        });
      }

      const trends = await analyticsService.getSalesTrends(producerId, timeframe);

      res.json({
        status: 'success',
        data: trends
      });

    } catch (error) {
      console.error('Get sales trends error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch sales trends',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get product performance
  async getProductPerformance(req, res) {
    try {
      const { timeframe = 'monthly' } = req.query;
      const producerId = req.user.producerId;

      console.log('📊 Fetching product performance for producer:', producerId);

      if (!producerId) {
        return res.status(400).json({
          status: 'error',
          message: 'Producer profile not found'
        });
      }

      const performance = await analyticsService.getProductPerformance(producerId, timeframe);

      res.json({
        status: 'success',
        data: performance
      });

    } catch (error) {
      console.error('Get product performance error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch product performance',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get customer insights
  async getCustomerInsights(req, res) {
    try {
      const { timeframe = 'monthly' } = req.query;
      const producerId = req.user.producerId;

      console.log('📊 Fetching customer insights for producer:', producerId);

      if (!producerId) {
        return res.status(400).json({
          status: 'error',
          message: 'Producer profile not found'
        });
      }

      const insights = await analyticsService.getCustomerInsights(producerId, timeframe);

      res.json({
        status: 'success',
        data: insights
      });

    } catch (error) {
      console.error('Get customer insights error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch customer insights',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new AnalyticsController();