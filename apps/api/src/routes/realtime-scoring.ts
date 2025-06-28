import { Request, Response, Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import RealtimeScoringService, {
    ScoreCalculation,
    ScoringFilters
} from '../services/realtime-scoring-service';
import { redisManager } from '../services/redis-client';

const router = Router();

// Initialize service
const scoringService = new RealtimeScoringService(redisManager.getClient());
scoringService.generateMockData();

// =============================================================================
// OVERVIEW & DASHBOARD ROUTES
// =============================================================================

/**
 * GET /overview - Real-time scoring system overview and dashboard
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const rules = scoringService.getScoringRules();
    const activeRules = scoringService.getScoringRules({ isActive: true });
    const profiles = scoringService.getLeadProfiles();
    const metrics = scoringService.getMetrics();
    const healthStatus = await scoringService.healthCheck();

    const overview = {
      system: {
        status: healthStatus.status,
        rulesCount: rules.length,
        activeRulesCount: activeRules.length,
        leadProfilesCount: profiles.length,
        activeCalculationsCount: healthStatus.activeCalculations,
        pendingUpdatesCount: healthStatus.pendingUpdates
      },
      rules: {
        total: rules.length,
        active: activeRules.length,
        byCategory: rules.reduce((acc, rule) => {
          acc[rule.category] = (acc[rule.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        topPerforming: activeRules
          .sort((a, b) => b.metadata.triggerCount - a.metadata.triggerCount)
          .slice(0, 5)
          .map(rule => ({
            id: rule.id,
            name: rule.name,
            category: rule.category,
            triggerCount: rule.metadata.triggerCount,
            priority: rule.priority
          }))
      },
      leadProfiles: {
        total: profiles.length,
        topScoring: profiles
          .sort((a, b) => b.currentScore - a.currentScore)
          .slice(0, 10)
          .map(profile => ({
            leadId: profile.leadId,
            currentScore: profile.currentScore,
            lastUpdated: profile.metadata.lastUpdated,
            totalCalculations: profile.metadata.totalCalculations
          })),
        scoreDistribution: {
          high: profiles.filter(p => p.currentScore >= 80).length,
          medium: profiles.filter(p => p.currentScore >= 50 && p.currentScore < 80).length,
          low: profiles.filter(p => p.currentScore < 50).length
        }
      },
      metrics,
      recentActivity: profiles
        .flatMap(p => p.scoreHistory.slice(-3))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10),
      recommendations: [
        {
          type: 'performance',
          message: 'Consider optimizing rules with low trigger counts',
          priority: 'medium'
        },
        {
          type: 'data_quality',
          message: 'Review leads with low data quality scores',
          priority: 'low'
        }
      ]
    };

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get scoring overview'
    });
  }
});

// =============================================================================
// SCORING RULE MANAGEMENT ROUTES
// =============================================================================

/**
 * GET /rules - List all scoring rules
 */
router.get('/rules', [
  query('category').optional().isIn(['demographic', 'behavioral', 'firmographic', 'engagement', 'intent', 'custom']),
  query('isActive').optional().isBoolean(),
  query('priority').optional().isInt({ min: 1, max: 10 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { category, isActive, priority } = req.query;
    const filters: ScoringFilters = {};

    if (category) filters.category = category as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (priority) filters.priority = parseInt(priority as string);

    const rules = scoringService.getScoringRules(filters);

    const rulesWithStats = rules.map(rule => ({
      ...rule,
      stats: {
        triggerCount: rule.metadata.triggerCount,
        lastTriggered: rule.metadata.lastTriggered,
        crmMappingsCount: rule.crmMappings.length,
        conditionsCount: rule.conditions.length
      }
    }));

    res.json({
      success: true,
      data: rulesWithStats,
      total: rulesWithStats.length,
      filters: filters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get scoring rules'
    });
  }
});

/**
 * POST /rules - Create new scoring rule
 */
router.post('/rules', [
  body('name').notEmpty().withMessage('Rule name is required'),
  body('description').notEmpty().withMessage('Rule description is required'),
  body('category').isIn(['demographic', 'behavioral', 'firmographic', 'engagement', 'intent', 'custom']),
  body('priority').isInt({ min: 1, max: 10 }).withMessage('Priority must be between 1 and 10'),
  body('conditions').isArray().withMessage('Conditions must be an array'),
  body('scoreModifier').isObject().withMessage('Score modifier is required'),
  body('triggers').isArray().withMessage('Triggers must be an array'),
  body('crmMappings').isArray().withMessage('CRM mappings must be an array')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const ruleData = {
      ...req.body,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };

    const newRule = await scoringService.createScoringRule(ruleData);

    res.status(201).json({
      success: true,
      data: newRule,
      message: 'Scoring rule created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create scoring rule'
    });
  }
});

/**
 * GET /rules/:id - Get specific scoring rule
 */
router.get('/rules/:id', [
  param('id').notEmpty().withMessage('Rule ID is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const rule = scoringService.getScoringRule(id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Scoring rule not found'
      });
    }

    // Get rule performance metrics
    const metrics = scoringService.getMetrics();
    const rulePerformance = metrics?.rulePerformance[id];

    res.json({
      success: true,
      data: {
        ...rule,
        performance: rulePerformance || {
          triggerCount: 0,
          averageImpact: 0,
          successRate: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get scoring rule'
    });
  }
});

/**
 * PUT /rules/:id - Update scoring rule
 */
router.put('/rules/:id', [
  param('id').notEmpty().withMessage('Rule ID is required'),
  body('name').optional().notEmpty(),
  body('description').optional().notEmpty(),
  body('category').optional().isIn(['demographic', 'behavioral', 'firmographic', 'engagement', 'intent', 'custom']),
  body('priority').optional().isInt({ min: 1, max: 10 }),
  body('isActive').optional().isBoolean()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updates = req.body;

    const updatedRule = await scoringService.updateScoringRule(id, updates);

    if (!updatedRule) {
      return res.status(404).json({
        success: false,
        error: 'Scoring rule not found'
      });
    }

    res.json({
      success: true,
      data: updatedRule,
      message: 'Scoring rule updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update scoring rule'
    });
  }
});

/**
 * DELETE /rules/:id - Delete scoring rule
 */
router.delete('/rules/:id', [
  param('id').notEmpty().withMessage('Rule ID is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const deleted = await scoringService.deleteScoringRule(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Scoring rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Scoring rule deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete scoring rule'
    });
  }
});

// =============================================================================
// SCORE CALCULATION ROUTES
// =============================================================================

/**
 * POST /calculate - Calculate score for a lead
 */
router.post('/calculate', [
  body('leadId').notEmpty().withMessage('Lead ID is required'),
  body('triggerSource').optional().isString(),
  body('leadData').optional().isObject()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { leadId, triggerSource = 'manual', leadData } = req.body;

    const calculation = await scoringService.calculateScore(leadId, triggerSource, leadData);

    res.json({
      success: true,
      data: calculation,
      message: 'Score calculated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate score'
    });
  }
});

/**
 * POST /calculate/batch - Calculate scores for multiple leads
 */
router.post('/calculate/batch', [
  body('leadIds').isArray().withMessage('Lead IDs must be an array'),
  body('triggerSource').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { leadIds, triggerSource = 'batch' } = req.body;

    const calculations = await Promise.allSettled(
      leadIds.map((leadId: string) =>
        scoringService.calculateScore(leadId, triggerSource)
      )
    );

    const successful = calculations
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<ScoreCalculation>).value);

    const failed = calculations
      .filter(result => result.status === 'rejected')
      .map((result, index) => ({
        leadId: leadIds[index],
        error: (result as PromiseRejectedResult).reason
      }));

    res.json({
      success: true,
      data: {
        successful,
        failed,
        summary: {
          total: leadIds.length,
          successful: successful.length,
          failed: failed.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate batch scores'
    });
  }
});

// =============================================================================
// LEAD PROFILE ROUTES
// =============================================================================

/**
 * GET /profiles - List lead profiles
 */
router.get('/profiles', [
  query('leadId').optional().isString(),
  query('minScore').optional().isInt({ min: 0, max: 100 }),
  query('maxScore').optional().isInt({ min: 0, max: 100 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { leadId, minScore, maxScore, limit = 20, offset = 0 } = req.query;
    const filters: ScoringFilters = {};

    if (leadId) filters.leadId = leadId as string;

    let profiles = scoringService.getLeadProfiles(filters);

    // Apply score filtering
    if (minScore !== undefined) {
      profiles = profiles.filter(p => p.currentScore >= parseInt(minScore as string));
    }
    if (maxScore !== undefined) {
      profiles = profiles.filter(p => p.currentScore <= parseInt(maxScore as string));
    }

    // Apply pagination
    const total = profiles.length;
    const paginatedProfiles = profiles.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string)
    );

    res.json({
      success: true,
      data: paginatedProfiles,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get lead profiles'
    });
  }
});

/**
 * GET /profiles/:leadId - Get specific lead profile
 */
router.get('/profiles/:leadId', [
  param('leadId').notEmpty().withMessage('Lead ID is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { leadId } = req.params;
    const profile = scoringService.getLeadProfile(leadId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Lead profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get lead profile'
    });
  }
});

/**
 * GET /profiles/:leadId/history - Get lead score history
 */
router.get('/profiles/:leadId/history', [
  param('leadId').notEmpty().withMessage('Lead ID is required'),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { leadId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const profile = scoringService.getLeadProfile(leadId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Lead profile not found'
      });
    }

    const history = profile.scoreHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string));

    res.json({
      success: true,
      data: {
        leadId,
        history,
        summary: {
          totalEntries: profile.scoreHistory.length,
          currentScore: profile.currentScore,
          highestScore: Math.max(...profile.scoreHistory.map(h => h.score)),
          lowestScore: Math.min(...profile.scoreHistory.map(h => h.score)),
          averageChange: profile.scoreHistory.length > 0
            ? profile.scoreHistory.reduce((sum, h) => sum + Math.abs(h.change), 0) / profile.scoreHistory.length
            : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get lead score history'
    });
  }
});

// =============================================================================
// METRICS & ANALYTICS ROUTES
// =============================================================================

/**
 * GET /metrics - Get scoring system metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = scoringService.getMetrics();

    if (!metrics) {
      return res.status(503).json({
        success: false,
        error: 'Metrics not available'
      });
    }

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get metrics'
    });
  }
});

/**
 * GET /metrics/rules - Get rule performance metrics
 */
router.get('/metrics/rules', [
  query('ruleId').optional().isString(),
  query('category').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const { ruleId, category } = req.query;
    const metrics = scoringService.getMetrics();

    if (!metrics) {
      return res.status(503).json({
        success: false,
        error: 'Metrics not available'
      });
    }

    let rulePerformance = metrics.rulePerformance;

    // Filter by specific rule
    if (ruleId) {
      const performance = rulePerformance[ruleId as string];
      if (!performance) {
        return res.status(404).json({
          success: false,
          error: 'Rule performance data not found'
        });
      }
      rulePerformance = { [ruleId as string]: performance };
    }

    // Filter by category
    if (category) {
      const rules = scoringService.getScoringRules({ category: category as string });
      const filteredPerformance: Record<string, any> = {};

      rules.forEach(rule => {
        if (rulePerformance[rule.id]) {
          filteredPerformance[rule.id] = rulePerformance[rule.id];
        }
      });

      rulePerformance = filteredPerformance;
    }

    res.json({
      success: true,
      data: rulePerformance,
      summary: {
        totalRules: Object.keys(rulePerformance).length,
        averageTriggerCount: Object.values(rulePerformance).reduce((sum: number, perf: any) => sum + perf.triggerCount, 0) / Object.keys(rulePerformance).length,
        averageImpact: Object.values(rulePerformance).reduce((sum: number, perf: any) => sum + perf.averageImpact, 0) / Object.keys(rulePerformance).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get rule metrics'
    });
  }
});

/**
 * GET /health - Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await scoringService.healthCheck();

    const status = health.status === 'healthy' ? 200 :
                  health.status === 'degraded' ? 200 : 503;

    res.status(status).json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    });
  }
});

// =============================================================================
// TRIGGER & EVENT ROUTES
// =============================================================================

/**
 * POST /trigger/manual - Manually trigger score calculation for a lead
 */
router.post('/trigger/manual', [
  body('leadId').notEmpty().withMessage('Lead ID is required'),
  body('reason').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { leadId, reason = 'Manual trigger' } = req.body;

    const calculation = await scoringService.calculateScore(leadId, `manual: ${reason}`);

    res.json({
      success: true,
      data: calculation,
      message: 'Manual score calculation triggered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger manual calculation'
    });
  }
});

/**
 * POST /trigger/event - Trigger score calculation based on event
 */
router.post('/trigger/event', [
  body('eventType').notEmpty().withMessage('Event type is required'),
  body('leadId').notEmpty().withMessage('Lead ID is required'),
  body('eventData').optional().isObject()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { eventType, leadId, eventData } = req.body;

    // Find rules that should trigger on this event
    const rules = scoringService.getScoringRules({ isActive: true });
    const triggerableRules = rules.filter(rule =>
      rule.triggers.some(trigger =>
        trigger.type === 'event' &&
        trigger.eventType === eventType &&
        trigger.isActive
      )
    );

    if (triggerableRules.length === 0) {
      return res.json({
        success: true,
        message: 'No rules configured to trigger on this event type',
        data: {
          eventType,
          leadId,
          triggeredRules: 0
        }
      });
    }

    const calculation = await scoringService.calculateScore(
      leadId,
      `event: ${eventType}`,
      eventData
    );

    res.json({
      success: true,
      data: calculation,
      message: `Event-based score calculation completed for ${triggerableRules.length} rules`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process event trigger'
    });
  }
});

export default router;
