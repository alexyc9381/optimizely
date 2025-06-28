import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import { redisManager } from '../services/redis-client.js';
import {
    createUniversalCompetitiveIntelligenceEngine
} from '../services/universal-competitive-intelligence-service.js';

const router = express.Router();

// Initialize service
const service = createUniversalCompetitiveIntelligenceEngine(redisManager.getClient());
service.initialize().catch(console.error);

// Rate limiting
const competitiveIntelligenceRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many competitive intelligence requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// ============================================================================
// COMPETITOR MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/competitive-intelligence/competitors
 * @desc Get all competitors with optional filtering
 * @access Public
 */
router.get('/competitors', [
  query('status').optional().isIn(['active', 'inactive', 'monitoring', 'archived']),
  query('industry').optional().isString().trim(),
  query('size').optional().isIn(['startup', 'small', 'medium', 'large', 'enterprise']),
  query('tags').optional().isString(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { status, industry, size, tags } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (industry) filters.industry = industry;
    if (size) filters.size = size;
    if (tags) filters.tags = (tags as string).split(',').map(tag => tag.trim());

    const competitors = await service.listCompetitors(Object.keys(filters).length > 0 ? filters : undefined);

    res.json({
      success: true,
      data: competitors,
      count: competitors.length,
    });
  } catch (error) {
    console.error('Error fetching competitors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch competitors',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/v1/competitive-intelligence/competitors/:id
 * @desc Get a specific competitor
 * @access Public
 */
router.get('/competitors/:id', [
  param('id').isString().notEmpty(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const competitor = await service.getCompetitor(req.params.id);

    if (!competitor) {
      return res.status(404).json({
        success: false,
        message: 'Competitor not found',
      });
    }

    res.json({
      success: true,
      data: competitor,
    });
  } catch (error) {
    console.error('Error fetching competitor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch competitor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route POST /api/v1/competitive-intelligence/competitors
 * @desc Create a new competitor
 * @access Public
 */
router.post('/competitors', [
  body('name').isString().notEmpty().trim(),
  body('domain').isString().notEmpty().trim(),
  body('industry').isString().notEmpty().trim(),
  body('size').isIn(['startup', 'small', 'medium', 'large', 'enterprise']),
  body('description').optional().isString().trim(),
  body('headquarters').optional().isString().trim(),
  body('founded').optional().isInt({ min: 1800, max: new Date().getFullYear() }),
  body('employees').optional().isInt({ min: 1 }),
  body('revenue').optional().isNumeric(),
  body('fundingStage').optional().isString().trim(),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['active', 'inactive', 'monitoring', 'archived']),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const competitorData = {
      ...req.body,
      status: req.body.status || 'active',
      tags: req.body.tags || [],
      metadata: req.body.metadata || {},
    };

    const competitor = await service.createCompetitor(competitorData);

    res.status(201).json({
      success: true,
      data: competitor,
      message: 'Competitor created successfully',
    });
  } catch (error) {
    console.error('Error creating competitor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create competitor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route PUT /api/v1/competitive-intelligence/competitors/:id
 * @desc Update a competitor
 * @access Public
 */
router.put('/competitors/:id', [
  param('id').isString().notEmpty(),
  body('name').optional().isString().notEmpty().trim(),
  body('domain').optional().isString().notEmpty().trim(),
  body('industry').optional().isString().notEmpty().trim(),
  body('size').optional().isIn(['startup', 'small', 'medium', 'large', 'enterprise']),
  body('description').optional().isString().trim(),
  body('headquarters').optional().isString().trim(),
  body('founded').optional().isInt({ min: 1800, max: new Date().getFullYear() }),
  body('employees').optional().isInt({ min: 1 }),
  body('revenue').optional().isNumeric(),
  body('fundingStage').optional().isString().trim(),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['active', 'inactive', 'monitoring', 'archived']),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const competitor = await service.updateCompetitor(req.params.id, req.body);

    if (!competitor) {
      return res.status(404).json({
        success: false,
        message: 'Competitor not found',
      });
    }

    res.json({
      success: true,
      data: competitor,
      message: 'Competitor updated successfully',
    });
  } catch (error) {
    console.error('Error updating competitor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update competitor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route DELETE /api/v1/competitive-intelligence/competitors/:id
 * @desc Delete a competitor
 * @access Public
 */
router.delete('/competitors/:id', [
  param('id').isString().notEmpty(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    await service.deleteCompetitor(req.params.id);

    res.json({
      success: true,
      message: 'Competitor deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting competitor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete competitor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// INTELLIGENCE DATA ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/competitive-intelligence/intelligence
 * @desc Query intelligence data with advanced filtering
 * @access Public
 */
router.get('/intelligence', [
  query('competitorId').optional().isString(),
  query('category').optional().isArray(),
  query('type').optional().isArray(),
  query('severity').optional().isArray(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('tags').optional().isArray(),
  query('platform').optional().isString(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const query = {
      ...req.query,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const result = await service.queryIntelligence(query);

    // Since queryIntelligence returns an array directly, we need to handle pagination manually
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = result.length;
    const paginatedResults = result.slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error querying intelligence data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to query intelligence data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/v1/competitive-intelligence/intelligence/:id
 * @desc Get specific intelligence data
 * @access Public
 */
router.get('/intelligence/:id', [
  param('id').isString().notEmpty(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const intelligence = await service.getIntelligenceData(req.params.id);

    if (!intelligence) {
      return res.status(404).json({
        success: false,
        message: 'Intelligence data not found',
      });
    }

    res.json({
      success: true,
      data: intelligence,
    });
  } catch (error) {
    console.error('Error fetching intelligence data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch intelligence data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route POST /api/v1/competitive-intelligence/intelligence
 * @desc Add new intelligence data
 * @access Public
 */
router.post('/intelligence', [
  body('competitorId').isString().notEmpty(),
  body('type').isIn(['news', 'pricing', 'feature', 'funding', 'personnel', 'strategy', 'partnership', 'acquisition', 'product_launch', 'market_move', 'financial', 'legal', 'social_media', 'review', 'patent', 'other']),
  body('title').isString().notEmpty().trim(),
  body('content').isString().notEmpty().trim(),
  body('source').isString().notEmpty().trim(),
  body('sourceUrl').optional().isURL(),
  body('publishedAt').optional().isISO8601(),
  body('importance').isIn(['low', 'medium', 'high', 'critical']),
  body('sentiment').optional().isIn(['positive', 'negative', 'neutral']),
  body('tags').optional().isArray(),
  body('metadata').optional().isObject(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const intelligenceData = {
      ...req.body,
      publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : new Date(),
      tags: req.body.tags || [],
      metadata: req.body.metadata || {},
    };

    const intelligence = await service.addIntelligenceData(intelligenceData);

    res.status(201).json({
      success: true,
      data: intelligence,
      message: 'Intelligence data added successfully',
    });
  } catch (error) {
    console.error('Error adding intelligence data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add intelligence data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// COMPETITIVE SCORING ENDPOINTS
// ============================================================================

/**
 * @route POST /api/v1/competitive-intelligence/scoring/calculate
 * @desc Calculate competitive score for a competitor
 * @access Public
 */
router.post('/scoring/calculate', [
  body('competitorId').isString().notEmpty(),
  body('metrics').optional().isObject(),
  body('forceRecalculation').optional().isBoolean(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { competitorId, metrics = {}, forceRecalculation = false } = req.body;

    const score = await service.calculateCompetitiveScore(competitorId);

    res.json({
      success: true,
      data: {
        competitorId,
        score,
        calculatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error calculating competitive score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate competitive score',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/v1/competitive-intelligence/scoring/:competitorId
 * @desc Get competitive score for a competitor
 * @access Public
 */
router.get('/scoring/:competitorId', [
  param('competitorId').isString().notEmpty(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const score = await service.getCompetitiveScore(req.params.competitorId);

    res.json({
      success: true,
      data: score,
    });
  } catch (error) {
    console.error('Error fetching competitive score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch competitive score',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// ALERTS ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/competitive-intelligence/alerts
 * @desc Get competitive intelligence alerts
 * @access Public
 */
router.get('/alerts', [
  query('competitorId').optional().isString(),
  query('type').optional().isArray(),
  query('severity').optional().isArray(),
  query('status').optional().isIn(['active', 'acknowledged', 'resolved']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const active = req.query.status === 'active' ? true : undefined;
    const alerts = await service.listAlerts(active);

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// DATA SOURCES ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/competitive-intelligence/data-sources
 * @desc Get all intelligence data sources
 * @access Public
 */
router.get('/data-sources', [
  query('type').optional().isArray(),
  query('status').optional().isIn(['active', 'inactive', 'error']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const active = req.query.active === 'true' ? true : undefined;
    const dataSources = await service.listDataSources(active);

    res.json({
      success: true,
      data: dataSources,
    });
  } catch (error) {
    console.error('Error fetching data sources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data sources',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/v1/competitive-intelligence/data-sources/:id
 * @desc Get a specific data source
 * @access Public
 */
router.get('/data-sources/:id', [
  param('id').isString().notEmpty(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const dataSource = await service.getDataSource(req.params.id);

    if (!dataSource) {
      return res.status(404).json({
        success: false,
        message: 'Data source not found',
      });
    }

    res.json({
      success: true,
      data: dataSource,
    });
  } catch (error) {
    console.error('Error fetching data source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data source',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route POST /api/v1/competitive-intelligence/data-sources
 * @desc Create a new data source
 * @access Public
 */
router.post('/data-sources', [
  body('name').isString().notEmpty().trim(),
  body('type').isIn(['rss', 'api', 'webhook', 'manual', 'scraper', 'social_media', 'news_api', 'patent_api', 'financial_api']),
  body('config').isObject(),
  body('description').optional().isString().trim(),
  body('frequency').optional().isIn(['realtime', 'hourly', 'daily', 'weekly', 'monthly']),
  body('status').optional().isIn(['active', 'inactive', 'error']),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const dataSourceData = {
      ...req.body,
      status: req.body.status || 'active',
      frequency: req.body.frequency || 'daily',
    };

    const dataSource = await service.createDataSource(dataSourceData);

    res.status(201).json({
      success: true,
      data: dataSource,
      message: 'Data source created successfully',
    });
  } catch (error) {
    console.error('Error creating data source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create data source',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/competitive-intelligence/analytics/trends
 * @desc Get competitive intelligence trends
 * @access Public
 */
router.get('/analytics/trends', [
  query('competitorIds').optional().isArray(),
  query('metrics').optional().isArray(),
  query('period').isIn(['7d', '30d', '90d', '1y']),
  query('granularity').optional().isIn(['hour', 'day', 'week', 'month']),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { competitorIds, metrics, period, granularity } = req.query;

    // Get analytics data (this would be implemented in the service)
    const trendsData = await service.getTrends({
      competitorIds: competitorIds as string[],
      timeframe: period as string,
      limit: 50
    });

    res.json({
      success: true,
      data: trendsData,
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trends',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/v1/competitive-intelligence/analytics/insights
 * @desc Get AI-generated competitive insights
 * @access Public
 */
router.get('/analytics/insights', [
  query('competitorId').optional().isString(),
  query('timeframe').optional().isIn(['week', 'month', 'quarter', 'year']),
  query('types').optional().isArray(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const insights = await service.generateInsights(req.query);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// REPORTS ENDPOINTS
// ============================================================================

/**
 * @route POST /api/v1/competitive-intelligence/reports/generate
 * @desc Generate competitive intelligence report
 * @access Public
 */
router.post('/reports/generate', [
  body('type').isIn(['competitor_analysis', 'market_overview', 'trend_analysis', 'threat_assessment']),
  body('competitorIds').optional().isArray(),
  body('dateRange').optional().isObject(),
  body('format').optional().isIn(['json', 'pdf', 'csv']),
  body('sections').optional().isArray(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const reportConfig = req.body;

    // Convert date strings to Date objects if present
    if (reportConfig.dateRange) {
      if (reportConfig.dateRange.start) reportConfig.dateRange.start = new Date(reportConfig.dateRange.start);
      if (reportConfig.dateRange.end) reportConfig.dateRange.end = new Date(reportConfig.dateRange.end);
    }

    const report = await service.generateReport(reportConfig);

    res.json({
      success: true,
      data: report,
      message: 'Report generated successfully',
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * @route GET /api/v1/competitive-intelligence/health
 * @desc Health check for competitive intelligence service
 * @access Public
 */
router.get('/health', competitiveIntelligenceRateLimit as any, async (req: express.Request, res: express.Response) => {
  try {
    const healthStatus = await service.getHealthStatus();

    res.json({
      success: true,
      data: healthStatus,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
