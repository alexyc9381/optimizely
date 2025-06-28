import express, { Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validationResult } from 'express-validator';
import { Redis } from 'ioredis';
import { z } from 'zod';
import { createUniversalProspectDetectionEngine } from '../services/enterprise-prospect-detection-service';

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

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

const handleAsyncRoute = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const validateRequest = (schema: z.ZodSchema) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    next(error);
  }
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ProspectProfileSchema = z.object({
  companyName: z.string().min(1),
  domain: z.string().url(),
  industry: z.string(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']),
  revenue: z.number().optional(),
  employeeCount: z.number().optional(),
  location: z.object({
    country: z.string(),
    region: z.string(),
    city: z.string().optional(),
  }),
  technographics: z.object({
    technologies: z.array(z.string()),
    platforms: z.array(z.string()),
    integrations: z.array(z.string()),
  }),
  firmographics: z.object({
    foundedYear: z.number().optional(),
    fundingStage: z.string().optional(),
    fundingAmount: z.number().optional(),
    publiclyTraded: z.boolean(),
  }),
  digitalPresence: z.object({
    website: z.string(),
    socialProfiles: z.record(z.string()),
    contentActivity: z.number(),
    seoRanking: z.number().optional(),
  }),
  contactInformation: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
});

const QualificationRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  category: z.enum(['inclusion', 'exclusion', 'scoring']),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in', 'exists']),
    value: z.any(),
    weight: z.number().optional(),
  })),
  action: z.object({
    type: z.enum(['qualify', 'disqualify', 'score', 'tag', 'route']),
    value: z.any(),
  }),
  isActive: z.boolean(),
  priority: z.number(),
  platform: z.string().optional(),
});

const DataSourceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['api', 'webhook', 'csv', 'database', 'scraping', 'integration']),
  config: z.object({
    url: z.string().optional(),
    apiKey: z.string().optional(),
    headers: z.record(z.string()).optional(),
    schedule: z.string().optional(),
    mapping: z.record(z.string()).optional(),
    platform: z.string().optional(),
  }),
  isActive: z.boolean(),
});

const ProspectActivitySchema = z.object({
  prospectId: z.string(),
  type: z.enum(['website_visit', 'content_download', 'email_open', 'demo_request', 'trial_signup', 'custom']),
  details: z.record(z.any()),
  timestamp: z.string().transform((str) => new Date(str)),
  source: z.string(),
  platform: z.string().optional(),
  score: z.number(),
});

const SearchCriteriaSchema = z.object({
  industry: z.string().optional(),
  size: z.string().optional(),
  minScore: z.number().optional(),
  maxScore: z.number().optional(),
  technologies: z.array(z.string()).optional(),
  location: z.string().optional(),
  platform: z.string().optional(),
  limit: z.number().optional(),
});

// =============================================================================
// RATE LIMITING
// =============================================================================

const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================================================
// ROUTER SETUP
// =============================================================================

export function createEnterpriseProspectDetectionRouter(redisClient: Redis): Router {
  const router = Router();
  const prospectEngine = createUniversalProspectDetectionEngine(redisClient);

  // Initialize the engine
  prospectEngine.initialize().catch(error => {
    console.error('Failed to initialize Prospect Detection Engine:', error);
  });

  // =============================================================================
  // PROSPECT MANAGEMENT ENDPOINTS
  // =============================================================================

  /**
   * @route   GET /api/v1/prospects
   * @desc    Get all prospects with optional filtering
   * @access  Public
   */
  router.get(
    '/prospects',
    standardRateLimit as any,
    handleAsyncRoute(async (req: Request, res: Response) => {
      const { platform } = req.query;

      let prospects;
      if (platform && typeof platform === 'string') {
        prospects = prospectEngine.getProspectsByPlatform(platform);
      } else {
        prospects = prospectEngine.getAllProspects();
      }

      // Include scores for each prospect
      const prospectsWithScores = prospects.map(prospect => ({
        ...prospect,
        score: prospectEngine.getProspectScore(prospect.id),
      }));

      res.json({
        success: true,
        data: prospectsWithScores,
        count: prospectsWithScores.length,
      });
    })
  );

  /**
   * @route   POST /api/v1/prospects
   * @desc    Add a new prospect
   * @access  Public
   */
  router.post(
    '/prospects',
    standardRateLimit as any,
    validateRequest(ProspectProfileSchema),
    handleAsyncRoute(async (req: Request, res: Response) => {
      const prospectData = req.body;
      const prospect = await prospectEngine.addProspect(prospectData);

      res.status(201).json({
        success: true,
        data: {
          ...prospect,
          score: prospectEngine.getProspectScore(prospect.id),
        },
      });
    })
  );

  /**
   * @route   GET /api/v1/prospects/:id
   * @desc    Get a specific prospect by ID
   * @access  Public
   */
  router.get(
    '/prospects/:id',
    standardRateLimit as any,
    handleAsyncRoute(async (req: Request, res: Response) => {
      const { id } = req.params;
      const prospect = prospectEngine.getProspect(id);

      if (!prospect) {
        return res.status(404).json({
          success: false,
          message: 'Prospect not found',
        });
      }

      const score = prospectEngine.getProspectScore(id);
      const activities = prospectEngine.getProspectActivities(id);

      res.json({
        success: true,
        data: {
          ...prospect,
          score,
          activities,
        },
      });
    })
  );

  /**
   * @route   PUT /api/v1/prospects/:id
   * @desc    Update a prospect
   * @access  Public
   */
  router.put(
    '/prospects/:id',
    standardRateLimit as any,
    validateRequest(ProspectProfileSchema.partial()),
    handleAsyncRoute(async (req: Request, res: Response) => {
      const { id } = req.params;
      const updates = req.body;

      try {
        const prospect = await prospectEngine.updateProspect(id, updates);

        res.json({
          success: true,
          data: {
            ...prospect,
            score: prospectEngine.getProspectScore(prospect.id),
          },
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          message: error instanceof Error ? error.message : 'Prospect not found',
        });
      }
    })
  );

  /**
   * @route   DELETE /api/v1/prospects/:id
   * @desc    Delete a prospect
   * @access  Public
   */
  router.delete(
    '/prospects/:id',
    strictRateLimit as any,
    handleAsyncRoute(async (req: Request, res: Response) => {
      const { id } = req.params;

      try {
        await prospectEngine.deleteProspect(id);

        res.json({
          success: true,
          message: 'Prospect deleted successfully',
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          message: error instanceof Error ? error.message : 'Prospect not found',
        });
      }
    })
  );

  // =============================================================================
  // PROSPECT SEARCH & FILTERING
  // =============================================================================

  /**
   * @route   POST /api/v1/prospects/search
   * @desc    Search prospects with advanced criteria
   * @access  Public
   */
  router.post(
    '/prospects/search',
    standardRateLimit as any,
    validateRequest(SearchCriteriaSchema),
    handleAsyncRoute(async (req: Request, res: Response) => {
      const criteria = req.body;
      const prospects = prospectEngine.searchProspects(criteria);

      // Include scores for each prospect
      const prospectsWithScores = prospects.map(prospect => ({
        ...prospect,
        score: prospectEngine.getProspectScore(prospect.id),
      }));

      res.json({
        success: true,
        data: prospectsWithScores,
        count: prospectsWithScores.length,
        criteria,
      });
    })
  );

  // =============================================================================
  // PROSPECT SCORING
  // =============================================================================

  /**
   * @route   POST /api/v1/prospects/:id/score
   * @desc    Recalculate prospect score
   * @access  Public
   */
  router.post(
    '/prospects/:id/score',
    standardRateLimit as any,
    handleAsyncRoute(async (req: Request, res: Response) => {
      const { id } = req.params;

      try {
        const score = await prospectEngine.calculateProspectScore(id);

        res.json({
          success: true,
          data: score,
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          message: error instanceof Error ? error.message : 'Prospect not found',
        });
      }
    })
  );

  /**
   * @route   GET /api/v1/prospects/:id/score
   * @desc    Get prospect score
   * @access  Public
   */
  router.get(
    '/prospects/:id/score',
    standardRateLimit as any,
    handleAsyncRoute(async (req: Request, res: Response) => {
      const { id } = req.params;
      const score = prospectEngine.getProspectScore(id);

      if (!score) {
        return res.status(404).json({
          success: false,
          message: 'Score not found for this prospect',
        });
      }

      res.json({
        success: true,
        data: score,
      });
    })
  );

  // =============================================================================
  // QUALIFICATION RULES
  // =============================================================================

  /**
   * @route   GET /api/v1/qualification-rules
   * @desc    Get all qualification rules
   * @access  Public
   */
  router.get(
    '/qualification-rules',
    standardRateLimit as any,
    handleAsyncRoute(async (req: Request, res: Response) => {
      const rules = prospectEngine.getAllQualificationRules();

      res.json({
        success: true,
        data: rules,
        count: rules.length,
      });
    })
  );

  /**
   * @route   POST /api/v1/qualification-rules
   * @desc    Add a new qualification rule
   * @access  Public
   */
  router.post(
    '/qualification-rules',
    standardRateLimit as any,
    validateRequest(QualificationRuleSchema),
    handleAsyncRoute(async (req: Request, res: Response) => {
      const ruleData = req.body;
      const rule = await prospectEngine.addQualificationRule(ruleData);

      res.status(201).json({
        success: true,
        data: rule,
      });
    })
  );

  /**
   * @route   GET /api/v1/qualification-rules/:id
   * @desc    Get a specific qualification rule
   * @access  Public
   */
  router.get(
    '/qualification-rules/:id',
    standardRateLimit as any,
    handleAsyncRoute(async (req: Request, res: Response) => {
      const { id } = req.params;
      const rule = prospectEngine.getQualificationRule(id);

      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Qualification rule not found',
        });
      }

      res.json({
        success: true,
        data: rule,
      });
    })
  );

  /**
   * @route   PUT /api/v1/qualification-rules/:id
   * @desc    Update a qualification rule
   * @access  Public
   */
  router.put(
    '/qualification-rules/:id',
    standardRateLimit as any,
    validateRequest(QualificationRuleSchema.partial()),
    handleAsyncRoute(async (req: Request, res: Response) => {
      const { id } = req.params;
      const updates = req.body;

      try {
        const rule = await prospectEngine.updateQualificationRule(id, updates);

        res.json({
          success: true,
          data: rule,
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          message: error instanceof Error ? error.message : 'Qualification rule not found',
        });
      }
    })
  );

  /**
   * @route   DELETE /api/v1/qualification-rules/:id
   * @desc    Delete a qualification rule
   * @access  Public
   */
  router.delete(
    '/qualification-rules/:id',
    strictRateLimit as any,
    handleAsyncRoute(async (req: Request, res: Response) => {
      const { id } = req.params;

      try {
        await prospectEngine.deleteQualificationRule(id);

        res.json({
          success: true,
          message: 'Qualification rule deleted successfully',
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          message: error instanceof Error ? error.message : 'Qualification rule not found',
        });
      }
    })
  );

  // =============================================================================
  // PROSPECT ACTIVITIES
  // =============================================================================

  /**
   * @route   GET /api/v1/prospects/:id/activities
   * @desc    Get activities for a specific prospect
   * @access  Public
   */
  router.get(
    '/prospects/:id/activities',
    standardRateLimit as any,
    handleAsyncRoute(async (req: Request, res: Response) => {
      const { id } = req.params;
      const activities = prospectEngine.getProspectActivities(id);

      res.json({
        success: true,
        data: activities,
        count: activities.length,
      });
    })
  );

  /**
   * @route   POST /api/v1/prospects/:id/activities
   * @desc    Add an activity for a prospect
   * @access  Public
   */
  router.post(
    '/prospects/:id/activities',
    standardRateLimit as any,
    validateRequest(ProspectActivitySchema.omit({ prospectId: true })),
    handleAsyncRoute(async (req: Request, res: Response) => {
      const { id } = req.params;
      const activityData = { ...req.body, prospectId: id };

      const activity = await prospectEngine.addProspectActivity(activityData);

      res.status(201).json({
        success: true,
        data: activity,
      });
    })
  );

  // =============================================================================
  // ANALYTICS & METRICS
  // =============================================================================

  /**
   * @route   GET /api/v1/prospects/analytics/metrics
   * @desc    Get comprehensive prospect detection metrics
   * @access  Public
   */
  router.get(
    '/analytics/metrics',
    standardRateLimit as any,
    handleAsyncRoute(async (req: Request, res: Response) => {
      const metrics = await prospectEngine.getMetrics();

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      });
    })
  );

  /**
   * @route   GET /api/v1/prospects/analytics/top-prospects
   * @desc    Get top-scoring prospects
   * @access  Public
   */
  router.get(
    '/analytics/top-prospects',
    standardRateLimit as any,
    handleAsyncRoute(async (req: Request, res: Response) => {
      const { limit = 10 } = req.query;

      const prospects = prospectEngine.searchProspects({
        minScore: 70,
        limit: parseInt(limit as string),
      });

      const prospectsWithScores = prospects.map(prospect => ({
        ...prospect,
        score: prospectEngine.getProspectScore(prospect.id),
      }));

      res.json({
        success: true,
        data: prospectsWithScores,
        count: prospectsWithScores.length,
      });
    })
  );

  /**
   * @route   GET /api/v1/prospects/analytics/trends
   * @desc    Get prospect detection trends and patterns
   * @access  Public
   */
  router.get(
    '/analytics/trends',
    strictRateLimit as any,
    handleAsyncRoute(async (req: Request, res: Response) => {
      const { timeframe = '30d' } = req.query;

      const metrics = await prospectEngine.getMetrics();

      // Calculate trends (simplified for demo)
      const trends = {
        prospectGrowth: {
          current: metrics.totalProspects,
          previous: Math.floor(metrics.totalProspects * 0.85), // Mock previous period
          growthRate: 15.0,
        },
        qualificationRate: {
          current: metrics.qualifiedProspects / metrics.totalProspects,
          trend: 'improving',
        },
        averageScore: {
          current: metrics.averageScore,
          trend: metrics.averageScore > 60 ? 'improving' : 'declining',
        },
        topPerformingSources: metrics.topSources.slice(0, 3),
        industryGrowth: Object.entries(metrics.industryBreakdown)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5),
      };

      res.json({
        success: true,
        data: trends,
        timeframe,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // =============================================================================
  // HEALTH CHECK & STATUS
  // =============================================================================

  /**
   * @route   GET /api/v1/prospects/health
   * @desc    Get prospect detection engine health status
   * @access  Public
   */
  router.get(
    '/health',
    standardRateLimit as any,
    handleAsyncRoute(async (req: Request, res: Response) => {
      const health = await prospectEngine.healthCheck();

      res.status(health.status === 'healthy' ? 200 : 503).json({
        success: health.status === 'healthy',
        ...health,
        timestamp: new Date().toISOString(),
      });
    })
  );

  // =============================================================================
  // ERROR HANDLING
  // =============================================================================

  router.use((error: any, req: Request, res: Response, next: any) => {
    console.error('Prospect Detection API Error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error in prospect detection system',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  });

  return router;
}

export default createEnterpriseProspectDetectionRouter;
