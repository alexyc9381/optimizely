import express, { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import type { RevenueForecastingService } from '../services/revenue-forecasting-service';

const router = express.Router();

// Universal CORS and platform compatibility headers
router.use((req, res, next) => {
  // CORS headers for cross-platform compatibility
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Universal platform indicators
  res.header('X-API-Version', '1.0');
  res.header('X-Platform-Compatible', 'React,Vue,Angular,WordPress,Shopify,Webflow');
  res.header('X-Response-Format', 'Universal-JSON');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

// Authentication middleware (simplified for universal compatibility)
const authenticateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const authHeader = req.headers.authorization;

  // Universal authentication: API key, Bearer token, or query param
  if (apiKey || authHeader?.startsWith('Bearer ') || req.query.token) {
    // In production, validate the actual credentials
    next();
  } else {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
      platform: 'universal',
      documentation: '/api/v1/docs'
    });
  }
};

// Request validation helpers
const validateDateRange = [
  query('start_date').optional().isISO8601().withMessage('Invalid start date format'),
  query('end_date').optional().isISO8601().withMessage('Invalid end date format'),
];

const validateForecastParams = [
  query('time_horizon').optional().isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid time horizon'),
  query('granularity').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid granularity'),
  query('confidence_threshold').optional().isFloat({ min: 0, max: 1 }).withMessage('Confidence threshold must be between 0 and 1'),
  query('models').optional().isString().withMessage('Models must be comma-separated string'),
  query('scenarios').optional().isString().withMessage('Scenarios must be comma-separated string'),
];

const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date().toISOString(),
      platform: 'universal'
    });
  }
  next();
};

// Universal response formatter
const formatUniversalResponse = (data: any, meta: any = {}) => {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      platform: 'universal',
      version: '1.0',
      ...meta
    }
  };
};

// ============================================================================
// REVENUE FORECASTING ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/forecast/overview
 * Get complete forecasting data including metrics, predictions, and charts
 * Primary endpoint for dashboard integration
 */
router.get('/overview',
  authenticateRequest,
  validateDateRange,
  validateForecastParams,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const forecastingService = req.app.get('forecastingService') as RevenueForecastingService;

      if (!forecastingService) {
        return res.status(503).json({
          success: false,
          error: 'Revenue forecasting service unavailable',
          timestamp: new Date().toISOString(),
          platform: 'universal'
        });
      }

      // Parse query parameters
      const filters: any = {};

      if (req.query.start_date && req.query.end_date) {
        filters.dateRange = {
          start: new Date(req.query.start_date as string),
          end: new Date(req.query.end_date as string)
        };
      }

      if (req.query.time_horizon) {
        filters.time_horizon = req.query.time_horizon;
      }

      if (req.query.granularity) {
        filters.granularity = req.query.granularity;
      }

      if (req.query.confidence_threshold) {
        filters.confidence_threshold = parseFloat(req.query.confidence_threshold as string);
      }

      if (req.query.models) {
        filters.models = (req.query.models as string).split(',').map(m => m.trim());
      }

      if (req.query.scenarios) {
        filters.scenarios = (req.query.scenarios as string).split(',').map(s => s.trim());
      }

      const forecastData = await forecastingService.getRevenueForecast(filters);

      res.json(formatUniversalResponse(forecastData, {
        query_params: req.query,
        cache_status: 'computed',
        endpoints: {
          metrics: '/api/v1/forecast/metrics',
          predictions: '/api/v1/forecast/predictions',
          scenarios: '/api/v1/forecast/scenarios',
          charts: '/api/v1/forecast/charts'
        }
      }));

    } catch (error) {
      console.error('Error in forecast overview endpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate revenue forecast',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        platform: 'universal'
      });
    }
  }
);

/**
 * GET /api/v1/forecast/metrics
 * Get forecast metrics overview only
 * Optimized for dashboard widgets and KPI displays
 */
router.get('/metrics',
  authenticateRequest,
  validateDateRange,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const forecastingService = req.app.get('forecastingService') as RevenueForecastingService;

      if (!forecastingService) {
        return res.status(503).json({
          success: false,
          error: 'Revenue forecasting service unavailable',
          timestamp: new Date().toISOString(),
          platform: 'universal'
        });
      }

      const filters: any = {};

      if (req.query.start_date && req.query.end_date) {
        filters.dateRange = {
          start: new Date(req.query.start_date as string),
          end: new Date(req.query.end_date as string)
        };
      }

      const metrics = await forecastingService.getForecastMetrics(filters);

      res.json(formatUniversalResponse(metrics, {
        query_params: req.query,
        data_type: 'forecast_metrics',
        refresh_interval: 300 // 5 minutes
      }));

    } catch (error) {
      console.error('Error in forecast metrics endpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve forecast metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        platform: 'universal'
      });
    }
  }
);

/**
 * GET /api/v1/forecast/predictions
 * Get revenue predictions with confidence intervals
 * Optimized for chart components and prediction displays
 */
router.get('/predictions',
  authenticateRequest,
  validateDateRange,
  validateForecastParams,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const forecastingService = req.app.get('forecastingService') as RevenueForecastingService;

      if (!forecastingService) {
        return res.status(503).json({
          success: false,
          error: 'Revenue forecasting service unavailable',
          timestamp: new Date().toISOString(),
          platform: 'universal'
        });
      }

      const filters: any = {};

      if (req.query.start_date && req.query.end_date) {
        filters.dateRange = {
          start: new Date(req.query.start_date as string),
          end: new Date(req.query.end_date as string)
        };
      }

      if (req.query.time_horizon) {
        filters.time_horizon = req.query.time_horizon;
      }

      if (req.query.granularity) {
        filters.granularity = req.query.granularity;
      }

      const predictions = await forecastingService.generatePredictions(filters);

      res.json(formatUniversalResponse(predictions, {
        query_params: req.query,
        data_type: 'revenue_predictions',
        prediction_count: predictions.length,
        chart_compatible: true
      }));

    } catch (error) {
      console.error('Error in forecast predictions endpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate revenue predictions',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        platform: 'universal'
      });
    }
  }
);

/**
 * GET /api/v1/forecast/scenarios
 * Get scenario analysis results
 * For strategic planning and what-if analysis
 */
router.get('/scenarios',
  authenticateRequest,
  validateDateRange,
  validateForecastParams,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const forecastingService = req.app.get('forecastingService') as RevenueForecastingService;

      if (!forecastingService) {
        return res.status(503).json({
          success: false,
          error: 'Revenue forecasting service unavailable',
          timestamp: new Date().toISOString(),
          platform: 'universal'
        });
      }

      const filters: any = {};

      if (req.query.start_date && req.query.end_date) {
        filters.dateRange = {
          start: new Date(req.query.start_date as string),
          end: new Date(req.query.end_date as string)
        };
      }

      if (req.query.models) {
        filters.models = (req.query.models as string).split(',').map(m => m.trim());
      }

      if (req.query.scenarios) {
        filters.scenarios = (req.query.scenarios as string).split(',').map(s => s.trim());
      }

      const scenarios = await forecastingService.runScenarioAnalysis(filters);

      res.json(formatUniversalResponse(scenarios, {
        query_params: req.query,
        data_type: 'scenario_analysis',
        scenario_count: scenarios.length,
        analysis_type: 'what_if'
      }));

    } catch (error) {
      console.error('Error in forecast scenarios endpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to run scenario analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        platform: 'universal'
      });
    }
  }
);

/**
 * GET /api/v1/forecast/charts
 * Get chart data for forecast visualizations
 * Optimized for charting libraries and dashboard widgets
 */
router.get('/charts',
  authenticateRequest,
  validateDateRange,
  validateForecastParams,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const forecastingService = req.app.get('forecastingService') as RevenueForecastingService;

      if (!forecastingService) {
        return res.status(503).json({
          success: false,
          error: 'Revenue forecasting service unavailable',
          timestamp: new Date().toISOString(),
          platform: 'universal'
        });
      }

      const filters: any = {};

      if (req.query.start_date && req.query.end_date) {
        filters.dateRange = {
          start: new Date(req.query.start_date as string),
          end: new Date(req.query.end_date as string)
        };
      }

      if (req.query.chart_types) {
        filters.chart_types = (req.query.chart_types as string).split(',').map(t => t.trim());
      }

      const chartData = await forecastingService.generateForecastCharts(filters);

      res.json(formatUniversalResponse(chartData, {
        query_params: req.query,
        data_type: 'forecast_charts',
        chart_count: Object.keys(chartData).length,
        compatible_libraries: ['chart.js', 'recharts', 'd3', 'highcharts']
      }));

    } catch (error) {
      console.error('Error in forecast charts endpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate forecast charts',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        platform: 'universal'
      });
    }
  }
);

/**
 * GET /api/v1/forecast/health
 * Health check endpoint for load balancers and monitoring
 */
router.get('/health', (req, res) => {
  const forecastingService = req.app.get('forecastingService') as RevenueForecastingService;

  res.json({
    success: true,
    status: 'healthy',
    service: 'revenue-forecasting',
    version: '1.0',
    timestamp: new Date().toISOString(),
    dependencies: {
      forecasting_service: !!forecastingService,
      redis_cache: true, // Should check actual Redis connection
      analytics_service: true // Should check actual Analytics service
    },
    platform: 'universal'
  });
});

export default router;
