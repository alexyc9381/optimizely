import express, { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import { redisManager } from '../services/redis-client';
import UniversalRevenueAttributionService from '../services/universal-revenue-attribution-service';

const router = Router();

// Initialize Revenue Attribution service
const attributionService = new UniversalRevenueAttributionService(redisManager.getClient());

// Rate limiting with proper typing
const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // stricter limit for intensive operations
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

// Validation error handler
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array(),
    });
  }
  next();
};

// CORS headers for universal platform compatibility
router.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Platform-Type, X-Platform-Version');
  res.header('X-API-Version', '1.0');
  res.header('X-Service', 'Universal Revenue Attribution');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Touchpoint Management Routes

/**
 * @route POST /api/v1/attribution/touchpoints
 * @desc Record a marketing touchpoint
 * @access Public
 */
router.post('/touchpoints', [
  standardRateLimit,
  body('sessionId').notEmpty().withMessage('Session ID is required'),
  body('visitorId').notEmpty().withMessage('Visitor ID is required'),
  body('channel').notEmpty().withMessage('Channel is required'),
  body('source').notEmpty().withMessage('Source is required'),
  body('medium').notEmpty().withMessage('Medium is required'),
  body('page').notEmpty().withMessage('Page is required'),
  body('value').isNumeric().withMessage('Value must be a number'),
  body('timestamp').isISO8601().withMessage('Valid timestamp is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const touchpoint = await attributionService.recordTouchpoint({
      ...req.body,
      timestamp: new Date(req.body.timestamp),
    });

    res.json({
      success: true,
      data: touchpoint,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record touchpoint',
    });
  }
});

/**
 * @route GET /api/v1/attribution/touchpoints/:id
 * @desc Get touchpoint details
 * @access Public
 */
router.get('/touchpoints/:id', [
  standardRateLimit,
  param('id').notEmpty().withMessage('Touchpoint ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const touchpoint = await attributionService.getTouchpoint(req.params.id);

    if (!touchpoint) {
      return res.status(404).json({
        success: false,
        message: 'Touchpoint not found',
      });
    }

    res.json({
      success: true,
      data: touchpoint,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get touchpoint',
    });
  }
});

/**
 * @route GET /api/v1/attribution/visitors/:visitorId/touchpoints
 * @desc Get all touchpoints for a visitor
 * @access Public
 */
router.get('/visitors/:visitorId/touchpoints', [
  standardRateLimit,
  param('visitorId').notEmpty().withMessage('Visitor ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const touchpoints = await attributionService.getVisitorTouchpoints(req.params.visitorId);

    res.json({
      success: true,
      data: touchpoints,
      count: touchpoints.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get visitor touchpoints',
    });
  }
});

// Revenue Event Management Routes

/**
 * @route POST /api/v1/attribution/revenue-events
 * @desc Record a revenue event
 * @access Public
 */
router.post('/revenue-events', [
  standardRateLimit,
  body('visitorId').notEmpty().withMessage('Visitor ID is required'),
  body('sessionId').notEmpty().withMessage('Session ID is required'),
  body('type').isIn(['purchase', 'subscription', 'upgrade', 'renewal', 'custom']).withMessage('Valid type is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('timestamp').isISO8601().withMessage('Valid timestamp is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const revenueEvent = await attributionService.recordRevenueEvent({
      ...req.body,
      timestamp: new Date(req.body.timestamp),
    });

    res.json({
      success: true,
      data: revenueEvent,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record revenue event',
    });
  }
});

// Attribution Model Management Routes

/**
 * @route POST /api/v1/attribution/models
 * @desc Create a new attribution model
 * @access Public
 */
router.post('/models', [
  standardRateLimit,
  body('name').notEmpty().withMessage('Model name is required'),
  body('type').isIn(['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based', 'data_driven', 'custom']).withMessage('Valid model type is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('parameters').isObject().withMessage('Parameters must be an object'),
  body('weightingRules').isArray().withMessage('Weighting rules must be an array'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const model = await attributionService.createAttributionModel(req.body);

    res.json({
      success: true,
      data: model,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create attribution model',
    });
  }
});

/**
 * @route GET /api/v1/attribution/models
 * @desc Get all attribution models
 * @access Public
 */
router.get('/models', [
  standardRateLimit,
], async (req: express.Request, res: express.Response) => {
  try {
    const models = await attributionService.getAllAttributionModels();

    res.json({
      success: true,
      data: models,
      count: models.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get attribution models',
    });
  }
});

/**
 * @route GET /api/v1/attribution/models/:id
 * @desc Get attribution model details
 * @access Public
 */
router.get('/models/:id', [
  standardRateLimit,
  param('id').notEmpty().withMessage('Model ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const model = await attributionService.getAttributionModel(req.params.id);

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Attribution model not found',
      });
    }

    res.json({
      success: true,
      data: model,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get attribution model',
    });
  }
});

// Attribution Reporting Routes

/**
 * @route POST /api/v1/attribution/reports
 * @desc Generate attribution report
 * @access Public
 */
router.post('/reports', [
  strictRateLimit,
  body('modelId').notEmpty().withMessage('Model ID is required'),
  body('timeframe.start').isISO8601().withMessage('Valid start date is required'),
  body('timeframe.end').isISO8601().withMessage('Valid end date is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { modelId, timeframe } = req.body;

    const report = await attributionService.generateAttributionReport(modelId, {
      start: new Date(timeframe.start),
      end: new Date(timeframe.end),
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate attribution report',
    });
  }
});

/**
 * @route GET /api/v1/attribution/analytics
 * @desc Get attribution analytics
 * @access Public
 */
router.get('/analytics', [
  standardRateLimit,
  query('start').isISO8601().withMessage('Valid start date is required'),
  query('end').isISO8601().withMessage('Valid end date is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { start, end } = req.query;

    const analytics = await attributionService.getAttributionAnalytics({
      start: new Date(start as string),
      end: new Date(end as string),
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get attribution analytics',
    });
  }
});

/**
 * @route GET /api/v1/attribution/analytics/channels
 * @desc Get channel performance analytics
 * @access Public
 */
router.get('/analytics/channels', [
  standardRateLimit,
  query('start').isISO8601().withMessage('Valid start date is required'),
  query('end').isISO8601().withMessage('Valid end date is required'),
  query('modelId').optional().isString(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { start, end, modelId } = req.query;

    const analytics = await attributionService.getAttributionAnalytics({
      start: new Date(start as string),
      end: new Date(end as string),
    });

    res.json({
      success: true,
      data: {
        channels: analytics.channelPerformance,
        overview: analytics.overview,
        insights: analytics.insights.filter(insight => insight.type === 'channel_performance'),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get channel analytics',
    });
  }
});

/**
 * @route GET /api/v1/attribution/analytics/campaigns
 * @desc Get campaign performance analytics
 * @access Public
 */
router.get('/analytics/campaigns', [
  standardRateLimit,
  query('start').isISO8601().withMessage('Valid start date is required'),
  query('end').isISO8601().withMessage('Valid end date is required'),
  query('channel').optional().isString(),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { start, end, channel } = req.query;

    // For now, use default model - in production, allow model selection
    const models = await attributionService.getAllAttributionModels();
    const defaultModel = models.find(m => m.isActive) || models[0];

    if (!defaultModel) {
      return res.status(400).json({
        success: false,
        message: 'No attribution model available',
      });
    }

    const report = await attributionService.generateAttributionReport(defaultModel.id, {
      start: new Date(start as string),
      end: new Date(end as string),
    });

    let campaignData = report.campaignAttribution;
    if (channel) {
      campaignData = campaignData.filter(campaign => campaign.channel === channel);
    }

    res.json({
      success: true,
      data: {
        campaigns: campaignData,
        summary: {
          totalCampaigns: campaignData.length,
          totalRevenue: campaignData.reduce((sum, campaign) => sum + campaign.attributedRevenue, 0),
          averageRevenue: campaignData.length > 0 ? campaignData.reduce((sum, campaign) => sum + campaign.attributedRevenue, 0) / campaignData.length : 0,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get campaign analytics',
    });
  }
});

/**
 * @route GET /api/v1/attribution/analytics/conversion-paths
 * @desc Get conversion path analysis
 * @access Public
 */
router.get('/analytics/conversion-paths', [
  standardRateLimit,
  query('start').isISO8601().withMessage('Valid start date is required'),
  query('end').isISO8601().withMessage('Valid end date is required'),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { start, end, limit = 20 } = req.query;

    const models = await attributionService.getAllAttributionModels();
    const defaultModel = models.find(m => m.isActive) || models[0];

    if (!defaultModel) {
      return res.status(400).json({
        success: false,
        message: 'No attribution model available',
      });
    }

    const report = await attributionService.generateAttributionReport(defaultModel.id, {
      start: new Date(start as string),
      end: new Date(end as string),
    });

    const topPaths = report.conversionPaths.slice(0, parseInt(limit as string));

    res.json({
      success: true,
      data: {
        conversionPaths: topPaths,
        touchpointAnalysis: report.touchpointAnalysis,
        summary: {
          totalPaths: report.conversionPaths.length,
          averagePathLength: report.touchpointAnalysis.averageTouchpointsToConversion,
          averageConversionTime: report.touchpointAnalysis.averageConversionTime,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get conversion path analysis',
    });
  }
});

/**
 * @route GET /api/v1/attribution/analytics/roi
 * @desc Get ROI and financial metrics
 * @access Public
 */
router.get('/analytics/roi', [
  standardRateLimit,
  query('start').isISO8601().withMessage('Valid start date is required'),
  query('end').isISO8601().withMessage('Valid end date is required'),
  query('breakdown').optional().isIn(['channel', 'campaign', 'both']),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { start, end, breakdown = 'channel' } = req.query;

    const models = await attributionService.getAllAttributionModels();
    const defaultModel = models.find(m => m.isActive) || models[0];

    if (!defaultModel) {
      return res.status(400).json({
        success: false,
        message: 'No attribution model available',
      });
    }

    const report = await attributionService.generateAttributionReport(defaultModel.id, {
      start: new Date(start as string),
      end: new Date(end as string),
    });

    const roiData: any = {
      overview: report.roiMetrics,
      totalRevenue: report.totalRevenue,
      attributedRevenue: report.attributedRevenue,
      attributionRate: (report.attributedRevenue / report.totalRevenue) * 100,
    };

    if (breakdown === 'channel' || breakdown === 'both') {
      roiData.channelROI = report.channelAttribution.map(channel => ({
        channel: channel.channel,
        revenue: channel.attributedRevenue,
        percentage: channel.percentage,
        roi: channel.returnOnAdSpend || 0,
        efficiency: channel.averageOrderValue / (channel.costPerAcquisition || 1),
      }));
    }

    if (breakdown === 'campaign' || breakdown === 'both') {
      roiData.campaignROI = report.campaignAttribution.map(campaign => ({
        campaign: campaign.campaign,
        channel: campaign.channel,
        revenue: campaign.attributedRevenue,
        percentage: campaign.percentage,
        roi: campaign.roi || 0,
      }));
    }

    res.json({
      success: true,
      data: roiData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get ROI analytics',
    });
  }
});

/**
 * @route GET /api/v1/attribution/analytics/insights
 * @desc Get attribution insights and recommendations
 * @access Public
 */
router.get('/analytics/insights', [
  standardRateLimit,
  query('start').isISO8601().withMessage('Valid start date is required'),
  query('end').isISO8601().withMessage('Valid end date is required'),
  query('type').optional().isIn(['channel_performance', 'campaign_optimization', 'budget_allocation', 'conversion_path', 'customer_journey']),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { start, end, type } = req.query;

    const analytics = await attributionService.getAttributionAnalytics({
      start: new Date(start as string),
      end: new Date(end as string),
    });

    let insights = analytics.insights;
    if (type) {
      insights = insights.filter(insight => insight.type === type);
    }

    res.json({
      success: true,
      data: {
        insights,
        recommendations: analytics.recommendations,
        summary: {
          totalInsights: insights.length,
          highImpactInsights: insights.filter(insight => insight.impact === 'high').length,
          averageConfidence: insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length || 0,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get attribution insights',
    });
  }
});

/**
 * @route GET /api/v1/attribution/analytics/model-comparison
 * @desc Compare different attribution models
 * @access Public
 */
router.get('/analytics/model-comparison', [
  strictRateLimit,
  query('start').isISO8601().withMessage('Valid start date is required'),
  query('end').isISO8601().withMessage('Valid end date is required'),
  query('models').optional().isString(), // Comma-separated model IDs
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { start, end, models: modelIds } = req.query;

    const analytics = await attributionService.getAttributionAnalytics({
      start: new Date(start as string),
      end: new Date(end as string),
    });

    let modelComparison = analytics.modelComparison;

    if (modelIds) {
      const requestedModels = (modelIds as string).split(',');
      modelComparison = modelComparison.filter(model => requestedModels.includes(model.modelId));
    }

    res.json({
      success: true,
      data: {
        modelComparison,
        summary: {
          modelsCompared: modelComparison.length,
          revenueRange: {
            min: Math.min(...modelComparison.map(m => m.attributedRevenue)),
            max: Math.max(...modelComparison.map(m => m.attributedRevenue)),
          },
          averageVariance: modelComparison.reduce((sum, model) => sum + model.variance, 0) / modelComparison.length || 0,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get model comparison',
    });
  }
});

/**
 * @route GET /api/v1/attribution/health
 * @desc Get service health status
 * @access Public
 */
router.get('/health', [
  standardRateLimit,
], async (req: express.Request, res: express.Response) => {
  try {
    const health = await attributionService.getHealthStatus();

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health,
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      message: error.message || 'Health check failed',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
