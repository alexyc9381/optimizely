import { Request, Response, Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { Redis } from 'ioredis';
import { AnalyticsService } from '../services/analytics-service';
import { RevenueAttributionService } from '../services/revenue-attribution-service';
import { createVisualizationService } from '../services/visualization-service';
import { createPipelineVisualizationService, PipelineFilters } from '../services/pipeline-visualization-service';

const router = Router();

// Service instances
let analyticsService: AnalyticsService;
let revenueService: RevenueAttributionService;
let visualizationService: any;
let pipelineService: any;

// Initialize pipeline visualization service (called by main app)
export const initializePipelineVisualizationService = (redis: Redis) => {
  analyticsService = new AnalyticsService(redis);
  revenueService = new RevenueAttributionService(redis);
  visualizationService = createVisualizationService(analyticsService);
  pipelineService = createPipelineVisualizationService(visualizationService, analyticsService, revenueService);
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

// CORS headers for universal platform compatibility
const setCORSHeaders = (req: Request, res: Response, next: any) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
};

router.use(setCORSHeaders);

/**
 * GET /api/v1/pipeline/overview
 * Get complete pipeline visualization data for executive dashboard
 * Universal compatibility: React, Vue, Angular, WordPress, Shopify, Webflow
 */
router.get(
  '/overview',
  requireAuth,
  [
    query('startDate').optional().isISO8601().withMessage('Valid start date required'),
    query('endDate').optional().isISO8601().withMessage('Valid end date required'),
    query('stages').optional().isString().withMessage('Stages must be comma-separated string'),
    query('sources').optional().isString().withMessage('Sources must be comma-separated string'),
    query('minDealSize').optional().isNumeric().withMessage('Min deal size must be numeric'),
    query('maxDealSize').optional().isNumeric().withMessage('Max deal size must be numeric'),
    query('minProbability').optional().isNumeric().withMessage('Min probability must be numeric'),
    query('maxProbability').optional().isNumeric().withMessage('Max probability must be numeric')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      // Parse filters from query parameters
      const filters: PipelineFilters = {};

      if (req.query.startDate && req.query.endDate) {
        filters.dateRange = {
          start: new Date(req.query.startDate as string),
          end: new Date(req.query.endDate as string)
        };
      }

      if (req.query.stages) {
        filters.stages = (req.query.stages as string).split(',').map(s => s.trim());
      }

      if (req.query.sources) {
        filters.sources = (req.query.sources as string).split(',').map(s => s.trim());
      }

      if (req.query.minDealSize || req.query.maxDealSize) {
        filters.dealSizeRange = {
          min: req.query.minDealSize ? parseFloat(req.query.minDealSize as string) : 0,
          max: req.query.maxDealSize ? parseFloat(req.query.maxDealSize as string) : Number.MAX_SAFE_INTEGER
        };
      }

      if (req.query.minProbability || req.query.maxProbability) {
        filters.probability = {
          min: req.query.minProbability ? parseFloat(req.query.minProbability as string) : 0,
          max: req.query.maxProbability ? parseFloat(req.query.maxProbability as string) : 100
        };
      }

      const pipelineData = await pipelineService.getPipelineVisualization(filters);

      res.json({
        success: true,
        data: pipelineData,
        timestamp: new Date().toISOString(),
        platform: 'universal',
        version: '1.0.0'
      });

    } catch (error) {
      console.error('Pipeline overview error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/v1/pipeline/metrics
 * Get pipeline overview metrics only
 */
router.get(
  '/metrics',
  requireAuth,
  [
    query('startDate').optional().isISO8601().withMessage('Valid start date required'),
    query('endDate').optional().isISO8601().withMessage('Valid end date required')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const filters: PipelineFilters = {};

      if (req.query.startDate && req.query.endDate) {
        filters.dateRange = {
          start: new Date(req.query.startDate as string),
          end: new Date(req.query.endDate as string)
        };
      }

      const metrics = await pipelineService.getPipelineMetrics(filters);

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Pipeline metrics error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/v1/pipeline/health
 * Health check endpoint for load balancers
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'pipeline-visualization',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
