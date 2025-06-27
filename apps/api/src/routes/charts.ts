import { Request, Response, Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { Redis } from 'ioredis';
import { AnalyticsService } from '../services/analytics-service';
import { createVisualizationService } from '../services/visualization-service';

const router = Router();

// Charts service instance
let analyticsService: AnalyticsService;
let visualizationService: any;

// Initialize charts service (called by main app)
export const initializeChartsService = (redis: Redis) => {
  analyticsService = new AnalyticsService(redis);
  visualizationService = createVisualizationService(analyticsService);
};

// Validation middleware
const validateRequest = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }
  next();
};

// Authentication middleware (placeholder - would use actual auth)
const requireAuth = (req: Request, res: Response, next: any) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  // TODO: Validate API key against database
  next();
};

// ============================================================================
// CHART DATA ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/charts/timeseries
 * Generate time series chart data
 */
router.get(
  '/timeseries',
  requireAuth,
  [
    query('metric').notEmpty().withMessage('Metric is required'),
    query('startDate').isISO8601().withMessage('Valid start date is required'),
    query('endDate').isISO8601().withMessage('Valid end date is required'),
    query('granularity').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid granularity')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { metric, startDate, endDate, granularity = 'day' } = req.query;
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};

      const dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };

      const chartData = await visualizationService.getTimeSeriesData(
        metric as string,
        dateRange,
        granularity as any,
        filters
      );

      res.json({
        success: true,
        data: chartData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Time series chart error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/v1/charts/funnel
 * Generate funnel chart data
 */
router.get(
  '/funnel',
  requireAuth,
  [
    query('steps').notEmpty().withMessage('Steps are required'),
    query('startDate').isISO8601().withMessage('Valid start date is required'),
    query('endDate').isISO8601().withMessage('Valid end date is required')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { steps, startDate, endDate } = req.query;
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};

      const stepsArray = Array.isArray(steps) ? steps as string[] : (steps as string).split(',');
      const dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };

      const chartData = await visualizationService.getFunnelData(
        stepsArray,
        dateRange,
        filters
      );

      res.json({
        success: true,
        data: chartData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Funnel chart error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/v1/charts/distribution
 * Generate distribution chart data (pie, donut)
 */
router.get(
  '/distribution',
  requireAuth,
  [
    query('dimension').notEmpty().withMessage('Dimension is required'),
    query('metric').notEmpty().withMessage('Metric is required'),
    query('startDate').isISO8601().withMessage('Valid start date is required'),
    query('endDate').isISO8601().withMessage('Valid end date is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { dimension, metric, startDate, endDate, limit = '10' } = req.query;
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};

      const dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };

      const chartData = await visualizationService.getDistributionData(
        dimension as string,
        metric as string,
        dateRange,
        parseInt(limit as string),
        filters
      );

      res.json({
        success: true,
        data: chartData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Distribution chart error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/v1/charts/comparison
 * Generate comparison chart data (multiple metrics)
 */
router.get(
  '/comparison',
  requireAuth,
  [
    query('metrics').notEmpty().withMessage('Metrics are required'),
    query('dimension').notEmpty().withMessage('Dimension is required'),
    query('startDate').isISO8601().withMessage('Valid start date is required'),
    query('endDate').isISO8601().withMessage('Valid end date is required')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { metrics, dimension, startDate, endDate } = req.query;
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};

      const metricsArray = Array.isArray(metrics) ? metrics as string[] : (metrics as string).split(',');
      const dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };

      const chartData = await visualizationService.getComparisonData(
        metricsArray,
        dimension as string,
        dateRange,
        filters
      );

      res.json({
        success: true,
        data: chartData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Comparison chart error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ============================================================================
// WIDGET DATA ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/charts/widgets/:type
 * Get widget data by type
 */
router.get(
  '/widgets/:type',
  requireAuth,
  [
    query('config').notEmpty().withMessage('Widget configuration is required')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const config = JSON.parse(req.query.config as string);

      let dateRange;
      if (req.query.startDate && req.query.endDate) {
        dateRange = {
          start: new Date(req.query.startDate as string),
          end: new Date(req.query.endDate as string)
        };
      }

      const widgetData = await visualizationService.getWidgetData(type, config, dateRange);

      res.json({
        success: true,
        data: widgetData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Widget data error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/v1/charts/dashboard
 * Get multiple widget data for dashboard
 */
router.post(
  '/dashboard',
  requireAuth,
  [
    body('widgets').isArray().withMessage('Widgets must be an array'),
    body('widgets.*.type').notEmpty().withMessage('Widget type is required'),
    body('widgets.*.config').isObject().withMessage('Widget config must be an object')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { widgets } = req.body;

      let dateRange;
      if (req.body.startDate && req.body.endDate) {
        dateRange = {
          start: new Date(req.body.startDate),
          end: new Date(req.body.endDate)
        };
      }

      const dashboardData = await visualizationService.getDashboardData(widgets, dateRange);

      res.json({
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Dashboard data error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ============================================================================
// EXPORT ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/charts/export
 * Export chart data in various formats
 */
router.post(
  '/export',
  requireAuth,
  [
    body('chartData').isObject().withMessage('Chart data is required'),
    body('options.format').isIn(['csv', 'json', 'excel', 'pdf']).withMessage('Invalid export format')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { chartData, options } = req.body;

      const exportResult = await visualizationService.exportChartData(chartData, options);

      res.setHeader('Content-Type', exportResult.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);

      if (typeof exportResult.data === 'string') {
        res.send(exportResult.data);
      } else {
        res.send(exportResult.data);
      }

    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/charts/health
 * Health check for charts service
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'charts-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * GET /api/v1/charts/metrics
 * Get available metrics
 */
router.get('/metrics', requireAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      metrics: [
        'pageViews', 'sessions', 'visitors', 'events', 'bounceRate',
        'sessionDuration', 'conversionRate', 'totalVisitors', 'totalSessions'
      ],
      dimensions: [
        'url', 'country', 'device', 'browser', 'referrer', 'platform', 'timestamp'
      ],
      chartTypes: [
        'line', 'bar', 'pie', 'donut', 'area', 'scatter', 'funnel', 'heatmap'
      ],
      widgetTypes: [
        'metric', 'chart', 'table', 'progress', 'gauge'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
