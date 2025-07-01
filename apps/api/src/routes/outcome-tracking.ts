import { Request, Response, Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import OutcomeTrackingService from '../services/outcome-tracking-service';

const router = Router();
const outcomeService = OutcomeTrackingService.getInstance();

/**
 * Track a user outcome event
 * POST /api/v1/outcome-tracking/track
 */
router.post('/track',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('companyId').notEmpty().withMessage('Company ID is required'),
    body('industry').isIn(['saas', 'manufacturing', 'healthcare', 'fintech', 'college-consulting'])
      .withMessage('Invalid industry'),
    body('configurationId').notEmpty().withMessage('Configuration ID is required'),
    body('outcomeType').isIn(['conversion', 'engagement', 'feature_adoption', 'business_result', 'churn', 'upsell'])
      .withMessage('Invalid outcome type'),
    body('outcome.event').notEmpty().withMessage('Outcome event is required'),
    body('context.sessionId').notEmpty().withMessage('Session ID is required'),
    body('context.source').notEmpty().withMessage('Source is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const outcomeId = await outcomeService.trackOutcome(req.body);

      res.status(201).json({
        success: true,
        message: 'Outcome tracked successfully',
        data: {
          outcomeId,
        },
      });
    } catch (error) {
      console.error('Error tracking outcome:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track outcome',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Track a business outcome
 * POST /api/v1/outcome-tracking/business
 */
router.post('/business',
  [
    body('companyId').notEmpty().withMessage('Company ID is required'),
    body('industry').notEmpty().withMessage('Industry is required'),
    body('configurationId').notEmpty().withMessage('Configuration ID is required'),
    body('outcomeType').isIn(['revenue_increase', 'cost_reduction', 'efficiency_gain', 'customer_satisfaction', 'retention_improvement'])
      .withMessage('Invalid business outcome type'),
    body('value').isNumeric().withMessage('Value must be numeric'),
    body('baseline').isNumeric().withMessage('Baseline must be numeric'),
    body('improvement').isNumeric().withMessage('Improvement must be numeric'),
    body('measurementPeriod.start').isISO8601().withMessage('Invalid start date'),
    body('measurementPeriod.end').isISO8601().withMessage('Invalid end date'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      // Convert date strings to Date objects
      req.body.measurementPeriod.start = new Date(req.body.measurementPeriod.start);
      req.body.measurementPeriod.end = new Date(req.body.measurementPeriod.end);

      // Calculate improvement percentage if not provided
      if (!req.body.improvementPercentage) {
        req.body.improvementPercentage = ((req.body.improvement / req.body.baseline) * 100);
      }

      const outcomeId = await outcomeService.trackBusinessOutcome(req.body);

      res.status(201).json({
        success: true,
        message: 'Business outcome tracked successfully',
        data: {
          outcomeId,
        },
      });
    } catch (error) {
      console.error('Error tracking business outcome:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track business outcome',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Get industry metrics
 * GET /api/v1/outcome-tracking/metrics/:industry
 */
router.get('/metrics/:industry',
  async (req: Request, res: Response) => {
    try {
      const { industry } = req.params;

      if (!['saas', 'manufacturing', 'healthcare', 'fintech', 'college-consulting'].includes(industry)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid industry',
        });
      }

      const metrics = await outcomeService.getIndustryMetrics(industry);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error('Error getting industry metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get industry metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Get conversion funnel
 * GET /api/v1/outcome-tracking/funnel/:industry
 */
router.get('/funnel/:industry',
  [
    query('configurationId').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { industry } = req.params;
      const { configurationId } = req.query;

      if (!['saas', 'manufacturing', 'healthcare', 'fintech', 'college-consulting'].includes(industry)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid industry',
        });
      }

      const funnel = await outcomeService.getConversionFunnel(industry, configurationId as string);

      res.json({
        success: true,
        data: funnel,
      });
    } catch (error) {
      console.error('Error getting conversion funnel:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get conversion funnel',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Get feature adoption metrics
 * GET /api/v1/outcome-tracking/features/:feature
 */
router.get('/features/:feature',
  [
    query('industry').optional().isIn(['saas', 'manufacturing', 'healthcare', 'fintech', 'college-consulting']),
  ],
  async (req: Request, res: Response) => {
    try {
      const { feature } = req.params;
      const { industry } = req.query;

      const metrics = await outcomeService.getFeatureAdoptionMetrics(feature, industry as string);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error('Error getting feature adoption metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feature adoption metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Get business outcomes
 * GET /api/v1/outcome-tracking/business-outcomes
 */
router.get('/business-outcomes',
  [
    query('industry').optional().isIn(['saas', 'manufacturing', 'healthcare', 'fintech', 'college-consulting']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { industry, startDate, endDate } = req.query;

      const outcomes = await outcomeService.getBusinessOutcomes(
        industry as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: outcomes,
      });
    } catch (error) {
      console.error('Error getting business outcomes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get business outcomes',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Get user outcomes
 * GET /api/v1/outcome-tracking/user-outcomes
 */
router.get('/user-outcomes',
  [
    query('userId').optional().isString(),
    query('companyId').optional().isString(),
    query('industry').optional().isIn(['saas', 'manufacturing', 'healthcare', 'fintech', 'college-consulting']),
    query('outcomeType').optional().isIn(['conversion', 'engagement', 'feature_adoption', 'business_result', 'churn', 'upsell']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const filters = {
        userId: req.query.userId as string,
        companyId: req.query.companyId as string,
        industry: req.query.industry as string,
        outcomeType: req.query.outcomeType as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const outcomes = await outcomeService.getUserOutcomes(filters);

      res.json({
        success: true,
        data: outcomes,
        count: outcomes.length,
      });
    } catch (error) {
      console.error('Error getting user outcomes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user outcomes',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Get cross-industry performance comparison
 * GET /api/v1/outcome-tracking/cross-industry-comparison
 */
router.get('/cross-industry-comparison',
  async (req: Request, res: Response) => {
    try {
      const comparison = await outcomeService.getCrossIndustryComparison();

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      console.error('Error getting cross-industry comparison:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cross-industry comparison',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Health check endpoint
 * GET /api/v1/outcome-tracking/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Outcome tracking service is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
