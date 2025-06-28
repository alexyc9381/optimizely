/**
 * Universal Performance Tracking and Analytics Dashboard API Routes
 *
 * Provides REST API endpoints for:
 * - Performance metrics collection and retrieval
 * - Workflow and campaign analytics
 * - Real-time system monitoring
 * - Dashboard management
 * - Alert and reporting systems
 *
 * All endpoints are platform-agnostic and support universal CORS headers
 */

import { Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import UniversalPerformanceTrackingService, {
    CampaignPerformanceMetrics,
    WorkflowPerformanceMetrics
} from '../services/universal-performance-tracking-service';

const router = Router();

// Initialize performance tracking service
const performanceService = new UniversalPerformanceTrackingService();

// Rate limiting for performance endpoints
const performanceRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many performance requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes
router.use(performanceRateLimit as any);

// Universal CORS headers for platform compatibility
router.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('X-API-Version', '1.0');
  res.header('X-Service', 'Universal-Performance-Tracking');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Initialize service on first request
let serviceInitialized = false;
const ensureServiceInitialized = async (req: Request, res: Response, next: any) => {
  if (!serviceInitialized) {
    try {
      await performanceService.initialize();
      serviceInitialized = true;
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize performance service',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  next();
};

// Apply service initialization middleware
router.use(ensureServiceInitialized);

// ================================
// PERFORMANCE METRICS ENDPOINTS
// ================================

/**
 * Record a new performance metric
 * POST /api/v1/performance-dashboard/metrics
 */
router.post('/metrics',
  [
    body('name').isString().notEmpty().withMessage('Metric name is required'),
    body('value').isNumeric().withMessage('Metric value must be numeric'),
    body('unit').isString().notEmpty().withMessage('Metric unit is required'),
    body('source').isString().notEmpty().withMessage('Metric source is required'),
    body('category').isIn(['workflow', 'campaign', 'system', 'revenue', 'engagement', 'test'])
      .withMessage('Invalid metric category'),
    body('tags').optional().isObject().withMessage('Tags must be an object')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { name, value, unit, source, category, tags = {}, metadata = {} } = req.body;

      const metricId = await performanceService.recordMetric({
        name,
        value: parseFloat(value),
        unit,
        source,
        category,
        tags,
        metadata
      });

      res.status(201).json({
        success: true,
        data: {
          metricId,
          message: 'Performance metric recorded successfully'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to record performance metric',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get performance metrics with filters
 * GET /api/v1/performance-dashboard/metrics
 */
router.get('/metrics',
  [
    query('category').optional().isIn(['workflow', 'campaign', 'system', 'revenue', 'engagement', 'test'])
      .withMessage('Invalid category filter'),
    query('source').optional().isString().withMessage('Source must be a string'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601 date'),
    query('metrics').optional().isString().withMessage('Metrics filter must be a string'),
    query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { category, source, startDate, endDate, metrics, limit } = req.query;

      const filters: any = {};

      if (category) filters.category = category as string;
      if (source) filters.source = source as string;
      if (limit) filters.limit = parseInt(limit as string);

      if (startDate || endDate) {
        filters.timeframe = {};
        if (startDate) filters.timeframe.start = new Date(startDate as string);
        if (endDate) filters.timeframe.end = new Date(endDate as string);
      }

      if (metrics) {
        filters.metrics = (metrics as string).split(',').map(m => m.trim());
      }

      const performanceMetrics = await performanceService.getMetrics(filters);

      res.json({
        success: true,
        data: {
          metrics: performanceMetrics,
          count: performanceMetrics.length,
          filters: filters
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ================================
// WORKFLOW PERFORMANCE ENDPOINTS
// ================================

/**
 * Record workflow performance metrics
 * POST /api/v1/performance-dashboard/workflows
 */
router.post('/workflows',
  [
    body('workflowId').isString().notEmpty().withMessage('Workflow ID is required'),
    body('workflowName').isString().notEmpty().withMessage('Workflow name is required'),
    body('executionTime').isNumeric().withMessage('Execution time must be numeric'),
    body('successRate').isFloat({ min: 0, max: 100 }).withMessage('Success rate must be between 0 and 100'),
    body('errorRate').isFloat({ min: 0, max: 100 }).withMessage('Error rate must be between 0 and 100'),
    body('throughput').isNumeric().withMessage('Throughput must be numeric'),
    body('latency').isNumeric().withMessage('Latency must be numeric')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const workflowMetrics: WorkflowPerformanceMetrics = req.body;

      await performanceService.recordWorkflowMetrics(workflowMetrics);

      res.status(201).json({
        success: true,
        data: {
          workflowId: workflowMetrics.workflowId,
          message: 'Workflow performance metrics recorded successfully'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to record workflow metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get workflow performance metrics
 * GET /api/v1/performance-dashboard/workflows
 * GET /api/v1/performance-dashboard/workflows/:workflowId
 */
router.get('/workflows/:workflowId?',
  [
    param('workflowId').optional().isString().withMessage('Workflow ID must be a string')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { workflowId } = req.params;

      const workflowMetrics = await performanceService.getWorkflowMetrics(workflowId);

      res.json({
        success: true,
        data: {
          workflows: workflowMetrics,
          count: workflowMetrics.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve workflow metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ================================
// CAMPAIGN PERFORMANCE ENDPOINTS
// ================================

/**
 * Record campaign performance metrics
 * POST /api/v1/performance-dashboard/campaigns
 */
router.post('/campaigns',
  [
    body('campaignId').isString().notEmpty().withMessage('Campaign ID is required'),
    body('campaignName').isString().notEmpty().withMessage('Campaign name is required'),
    body('impressions').isInt({ min: 0 }).withMessage('Impressions must be a non-negative integer'),
    body('clicks').isInt({ min: 0 }).withMessage('Clicks must be a non-negative integer'),
    body('conversions').isInt({ min: 0 }).withMessage('Conversions must be a non-negative integer'),
    body('revenue').isFloat({ min: 0 }).withMessage('Revenue must be non-negative'),
    body('cost').isFloat({ min: 0 }).withMessage('Cost must be non-negative')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const campaignMetrics: CampaignPerformanceMetrics = req.body;

      await performanceService.recordCampaignMetrics(campaignMetrics);

      res.status(201).json({
        success: true,
        data: {
          campaignId: campaignMetrics.campaignId,
          message: 'Campaign performance metrics recorded successfully'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to record campaign metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get campaign performance metrics
 * GET /api/v1/performance-dashboard/campaigns
 * GET /api/v1/performance-dashboard/campaigns/:campaignId
 */
router.get('/campaigns/:campaignId?',
  [
    param('campaignId').optional().isString().withMessage('Campaign ID must be a string')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;

      const campaignMetrics = await performanceService.getCampaignMetrics(campaignId);

      res.json({
        success: true,
        data: {
          campaigns: campaignMetrics,
          count: campaignMetrics.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve campaign metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ================================
// REAL-TIME ANALYTICS ENDPOINTS
// ================================

/**
 * Get real-time performance metrics
 * GET /api/v1/performance-dashboard/realtime
 */
router.get('/realtime',
  async (req: Request, res: Response) => {
    try {
      const realTimeMetrics = await performanceService.getRealTimeMetrics();

      res.json({
        success: true,
        data: realTimeMetrics,
        timestamp: new Date()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve real-time metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Generate performance trends
 * GET /api/v1/performance-dashboard/trends/:metric
 */
router.get('/trends/:metric',
  [
    param('metric').isString().notEmpty().withMessage('Metric name is required'),
    query('timeframe').isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid timeframe')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { metric } = req.params;
      const { timeframe = 'day' } = req.query;

      const trend = await performanceService.generateTrends(
        metric,
        timeframe as 'hour' | 'day' | 'week' | 'month'
      );

      res.json({
        success: true,
        data: {
          trend,
          metric,
          timeframe
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate performance trends',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ================================
// DASHBOARD MANAGEMENT ENDPOINTS
// ================================

/**
 * Create a new dashboard
 * POST /api/v1/performance-dashboard/dashboards
 */
router.post('/dashboards',
  [
    body('name').isString().notEmpty().withMessage('Dashboard name is required'),
    body('widgets').isArray().withMessage('Widgets must be an array'),
    body('layout').isObject().withMessage('Layout must be an object'),
    body('refreshInterval').optional().isInt({ min: 1000 }).withMessage('Refresh interval must be at least 1000ms')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const dashboardData = {
        ...req.body,
        filters: req.body.filters || [],
        refreshInterval: req.body.refreshInterval || 30000
      };

      const dashboardId = await performanceService.createDashboard(dashboardData);

      res.status(201).json({
        success: true,
        data: {
          dashboardId,
          message: 'Dashboard created successfully'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create dashboard',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get dashboard by ID
 * GET /api/v1/performance-dashboard/dashboards/:id
 */
router.get('/dashboards/:id',
  [
    param('id').isString().notEmpty().withMessage('Dashboard ID is required')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const dashboard = await performanceService.getDashboard(id);

      if (!dashboard) {
        return res.status(404).json({
          success: false,
          error: 'Dashboard not found'
        });
      }

      res.json({
        success: true,
        data: {
          dashboard
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * List all dashboards
 * GET /api/v1/performance-dashboard/dashboards
 */
router.get('/dashboards',
  async (req: Request, res: Response) => {
    try {
      const dashboards = await performanceService.listDashboards();

      res.json({
        success: true,
        data: {
          dashboards,
          count: dashboards.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to list dashboards',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ================================
// ALERTS AND REPORTING ENDPOINTS
// ================================

/**
 * Get performance alerts
 * GET /api/v1/performance-dashboard/alerts
 */
router.get('/alerts',
  [
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
    query('resolved').optional().isBoolean().withMessage('Resolved must be boolean'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601 date')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { severity, resolved, startDate, endDate } = req.query;

      const filters: any = {};
      if (severity) filters.severity = severity as string;
      if (resolved !== undefined) filters.resolved = resolved === 'true';

      if (startDate || endDate) {
        filters.timeframe = {};
        if (startDate) filters.timeframe.start = new Date(startDate as string);
        if (endDate) filters.timeframe.end = new Date(endDate as string);
      }

      const alerts = await performanceService.getAlerts(filters);

      res.json({
        success: true,
        data: {
          alerts,
          count: alerts.length,
          filters
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance alerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Generate performance report
 * POST /api/v1/performance-dashboard/reports
 */
router.post('/reports',
  [
    body('title').isString().notEmpty().withMessage('Report title is required'),
    body('description').isString().notEmpty().withMessage('Report description is required'),
    body('startDate').isISO8601().withMessage('Start date must be valid ISO 8601 date'),
    body('endDate').isISO8601().withMessage('End date must be valid ISO 8601 date'),
    body('includeWorkflows').optional().isBoolean().withMessage('Include workflows must be boolean'),
    body('includeCampaigns').optional().isBoolean().withMessage('Include campaigns must be boolean'),
    body('includeSystem').optional().isBoolean().withMessage('Include system must be boolean'),
    body('includeTrends').optional().isBoolean().withMessage('Include trends must be boolean'),
    body('includeAlerts').optional().isBoolean().withMessage('Include alerts must be boolean')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const {
        title,
        description,
        startDate,
        endDate,
        includeWorkflows = true,
        includeCampaigns = true,
        includeSystem = true,
        includeTrends = true,
        includeAlerts = true
      } = req.body;

      const reportConfig = {
        title,
        description,
        timeframe: {
          start: new Date(startDate),
          end: new Date(endDate)
        },
        includeWorkflows,
        includeCampaigns,
        includeSystem,
        includeTrends,
        includeAlerts
      };

      const report = await performanceService.generateReport(reportConfig);

      res.status(201).json({
        success: true,
        data: {
          report,
          message: 'Performance report generated successfully'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate performance report',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ================================
// HEALTH AND STATUS ENDPOINTS
// ================================

/**
 * Get service health status
 * GET /api/v1/performance-dashboard/health
 */
router.get('/health',
  async (req: Request, res: Response) => {
    try {
      const healthStatus = await performanceService.getHealthStatus();

      const statusCode = healthStatus.status === 'healthy' ? 200 :
                        healthStatus.status === 'warning' ? 200 : 503;

      res.status(statusCode).json({
        success: true,
        data: healthStatus
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get API documentation
 * GET /api/v1/performance-dashboard/docs
 */
router.get('/docs',
  (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        service: 'Universal Performance Tracking and Analytics Dashboard API',
        version: '1.0.0',
        description: 'Enterprise-grade performance tracking system providing real-time metrics, analytics, and dashboards',
        endpoints: {
          metrics: {
            'POST /metrics': 'Record performance metrics',
            'GET /metrics': 'Retrieve performance metrics with filters'
          },
          workflows: {
            'POST /workflows': 'Record workflow performance metrics',
            'GET /workflows': 'Retrieve workflow metrics',
            'GET /workflows/:id': 'Get specific workflow metrics'
          },
          campaigns: {
            'POST /campaigns': 'Record campaign performance metrics',
            'GET /campaigns': 'Retrieve campaign metrics',
            'GET /campaigns/:id': 'Get specific campaign metrics'
          },
          analytics: {
            'GET /realtime': 'Get real-time metrics',
            'GET /trends/:metric': 'Generate performance trends'
          },
          dashboards: {
            'POST /dashboards': 'Create performance dashboard',
            'GET /dashboards': 'List all dashboards',
            'GET /dashboards/:id': 'Get specific dashboard'
          },
          alerts: {
            'GET /alerts': 'Retrieve performance alerts'
          },
          reports: {
            'POST /reports': 'Generate performance reports'
          },
          health: {
            'GET /health': 'Service health status',
            'GET /docs': 'API documentation'
          }
        },
        features: [
          'Real-time metrics collection',
          'Workflow and campaign analytics',
          'System performance monitoring',
          'Interactive dashboards',
          'Automated alerting',
          'Performance reporting',
          'Trend analysis',
          'Universal platform compatibility'
        ]
      }
    });
  }
);

export default router;
