import { Request, Response, Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { redisManager } from '../services/redis-client';
import SalesVelocityService, { Deal, VelocityFilters } from '../services/sales-velocity-service';

const router = Router();

// Initialize service
const salesVelocityService = new SalesVelocityService(redisManager.getClient());
salesVelocityService.generateMockData();

// =============================================================================
// MIDDLEWARE
// =============================================================================

const handleValidationErrors = (req: Request, res: Response, next: Function) => {
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

const parseFilters = (req: Request): VelocityFilters => {
  const filters: VelocityFilters = {};

  if (req.query.startDate && req.query.endDate) {
    filters.dateRange = {
      start: new Date(req.query.startDate as string),
      end: new Date(req.query.endDate as string)
    };
  }

  if (req.query.stages) {
    filters.stages = (req.query.stages as string).split(',');
  }

  if (req.query.owners) {
    filters.owners = (req.query.owners as string).split(',');
  }

  if (req.query.territories) {
    filters.territories = (req.query.territories as string).split(',');
  }

  if (req.query.minDealSize || req.query.maxDealSize) {
    filters.dealSizeRange = {
      min: req.query.minDealSize ? parseInt(req.query.minDealSize as string) : 0,
      max: req.query.maxDealSize ? parseInt(req.query.maxDealSize as string) : Number.MAX_SAFE_INTEGER
    };
  }

  if (req.query.leadSources) {
    filters.leadSources = (req.query.leadSources as string).split(',');
  }

  if (req.query.tags) {
    filters.tags = (req.query.tags as string).split(',');
  }

  return filters;
};

// =============================================================================
// SALES VELOCITY OVERVIEW
// =============================================================================

/**
 * @route GET /api/v1/sales-velocity/overview
 * @desc Get comprehensive sales velocity dashboard with analytics
 * @access Private
 */
router.get('/overview', [
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601 date'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601 date'),
  query('stages').optional().isString().withMessage('Stages must be comma-separated string'),
  query('owners').optional().isString().withMessage('Owners must be comma-separated string'),
  query('territories').optional().isString().withMessage('Territories must be comma-separated string'),
  query('minDealSize').optional().isInt({ min: 0 }).withMessage('Min deal size must be positive integer'),
  query('maxDealSize').optional().isInt({ min: 0 }).withMessage('Max deal size must be positive integer'),
  query('leadSources').optional().isString().withMessage('Lead sources must be comma-separated string'),
  query('tags').optional().isString().withMessage('Tags must be comma-separated string'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const filters = parseFilters(req);
    const analytics = await salesVelocityService.getVelocityAnalytics(filters);

    res.json({
      success: true,
      data: {
        overview: analytics.overview,
        stageAnalysis: analytics.stageAnalysis,
        bottlenecks: analytics.bottlenecks.slice(0, 5), // Top 5 bottlenecks
        forecasting: analytics.forecasting,
        topPerformers: analytics.repPerformance.slice(0, 10), // Top 10 performers
        benchmarks: analytics.benchmarks,
        trends: analytics.trends,
        summary: {
          totalDeals: analytics.overview.totalDeals,
          totalValue: analytics.overview.totalValue,
          velocity: analytics.overview.velocity,
          momentum: analytics.overview.momentum,
          criticalBottlenecks: analytics.bottlenecks.filter(b => b.severity === 'critical').length,
          forecastConfidence: analytics.forecasting.confidence
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sales velocity overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sales velocity overview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// VELOCITY METRICS
// =============================================================================

/**
 * @route GET /api/v1/sales-velocity/metrics
 * @desc Get detailed velocity metrics with filtering
 * @access Private
 */
router.get('/metrics', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('stages').optional().isString(),
  query('owners').optional().isString(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const filters = parseFilters(req);
    const metrics = await salesVelocityService.calculateVelocityMetrics(filters);

    res.json({
      success: true,
      data: {
        metrics,
        insights: {
          velocityCategory: metrics.velocity > 10000 ? 'high' : metrics.velocity > 5000 ? 'medium' : 'low',
          salesCycleCategory: metrics.averageSalesCycle < 30 ? 'fast' : metrics.averageSalesCycle < 60 ? 'medium' : 'slow',
          conversionCategory: metrics.conversionRate > 25 ? 'excellent' : metrics.conversionRate > 15 ? 'good' : 'needs_improvement',
          recommendations: generateMetricsRecommendations(metrics)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Velocity metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate velocity metrics'
    });
  }
});

function generateMetricsRecommendations(metrics: any): string[] {
  const recommendations = [];

  if (metrics.velocity < 5000) {
    recommendations.push('Consider implementing sales automation tools to improve velocity');
  }

  if (metrics.averageSalesCycle > 60) {
    recommendations.push('Focus on reducing sales cycle length through better lead qualification');
  }

  if (metrics.conversionRate < 15) {
    recommendations.push('Invest in sales training to improve conversion rates');
  }

  return recommendations;
}

// =============================================================================
// STAGE ANALYSIS
// =============================================================================

/**
 * @route GET /api/v1/sales-velocity/stages
 * @desc Get stage velocity analysis and bottleneck identification
 * @access Private
 */
router.get('/stages', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const filters = parseFilters(req);
    const stageAnalysis = await salesVelocityService.analyzeStageVelocity(filters);

    res.json({
      success: true,
      data: {
        stages: stageAnalysis,
        summary: {
          totalStages: stageAnalysis.length,
          bottleneckStages: stageAnalysis.filter(s => s.bottleneckScore >= 7).length,
          averageConversionRate: stageAnalysis.reduce((sum, s) => sum + s.conversionRate, 0) / stageAnalysis.length,
          slowestStage: stageAnalysis.reduce((max, s) => s.averageDaysInStage > max.averageDaysInStage ? s : max),
          lowestConversionStage: stageAnalysis.reduce((min, s) => s.conversionRate < min.conversionRate ? s : min)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stage analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze stage velocity'
    });
  }
});

// =============================================================================
// BOTTLENECK ANALYSIS
// =============================================================================

/**
 * @route GET /api/v1/sales-velocity/bottlenecks
 * @desc Get detailed bottleneck analysis with recommendations
 * @access Private
 */
router.get('/bottlenecks', [
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  query('minImpact').optional().isFloat({ min: 0 }).withMessage('Min impact must be positive number'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const filters = parseFilters(req);
    let bottlenecks = await salesVelocityService.identifyBottlenecks(filters);

    // Apply additional filters
    if (req.query.severity) {
      bottlenecks = bottlenecks.filter(b => b.severity === req.query.severity);
    }

    if (req.query.minImpact) {
      const minImpact = parseFloat(req.query.minImpact as string);
      bottlenecks = bottlenecks.filter(b => b.impact >= minImpact);
    }

    res.json({
      success: true,
      data: {
        bottlenecks,
        summary: {
          totalBottlenecks: bottlenecks.length,
          criticalBottlenecks: bottlenecks.filter(b => b.severity === 'critical').length,
          totalImpact: bottlenecks.reduce((sum, b) => sum + b.impact, 0),
          topRecommendations: bottlenecks
            .flatMap(b => b.recommendations)
            .filter(r => r.priority === 'high')
            .slice(0, 5)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bottleneck analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze bottlenecks'
    });
  }
});

// =============================================================================
// FORECASTING
// =============================================================================

/**
 * @route GET /api/v1/sales-velocity/forecast
 * @desc Generate sales forecasting with scenarios
 * @access Private
 */
router.get('/forecast', [
  query('period').optional().isIn(['next_month', 'next_quarter', 'next_half', 'next_year']).withMessage('Invalid period'),
  query('type').optional().isIn(['conservative', 'realistic', 'optimistic']).withMessage('Invalid forecast type'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || 'next_quarter';
    const forecastType = req.query.type as 'conservative' | 'realistic' | 'optimistic' || 'realistic';

    const forecasting = await salesVelocityService.generateForecast(period, forecastType);

    res.json({
      success: true,
      data: {
        forecasting,
        insights: {
          confidenceLevel: forecasting.confidence > 80 ? 'high' : forecasting.confidence > 60 ? 'medium' : 'low',
          riskLevel: forecasting.riskFactors.filter(r => r.impact === 'negative').length > 2 ? 'high' : 'medium',
          topRisks: forecasting.riskFactors.filter(r => r.impact === 'negative').slice(0, 3),
          topOpportunities: forecasting.riskFactors.filter(r => r.impact === 'positive').slice(0, 3)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Forecasting error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate forecast'
    });
  }
});

// =============================================================================
// PERFORMANCE ANALYSIS
// =============================================================================

/**
 * @route GET /api/v1/sales-velocity/performance
 * @desc Get sales rep performance analysis
 * @access Private
 */
router.get('/performance', [
  query('sortBy').optional().isIn(['velocity', 'conversionRate', 'dealSize', 'quotaAttainment']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const filters = parseFilters(req);
    let repPerformance = await salesVelocityService.analyzeRepPerformance(filters);

    // Apply sorting
    const sortBy = req.query.sortBy as string || 'velocity';
    const sortOrder = req.query.sortOrder as string || 'desc';

    repPerformance.sort((a, b) => {
      const aValue = a.metrics[sortBy as keyof typeof a.metrics] as number;
      const bValue = b.metrics[sortBy as keyof typeof b.metrics] as number;
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    // Apply limit
    const limit = req.query.limit ? parseInt(req.query.limit as string) : repPerformance.length;
    repPerformance = repPerformance.slice(0, limit);

    res.json({
      success: true,
      data: {
        performance: repPerformance,
        summary: {
          totalReps: repPerformance.length,
          averageVelocity: repPerformance.reduce((sum, r) => sum + r.metrics.velocity, 0) / repPerformance.length,
          averageQuotaAttainment: repPerformance.reduce((sum, r) => sum + r.metrics.quotaAttainment, 0) / repPerformance.length,
          topPerformer: repPerformance[0],
          improvementOpportunities: repPerformance.filter(r => r.metrics.quotaAttainment < 80).length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Performance analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze performance'
    });
  }
});

// =============================================================================
// BENCHMARKING
// =============================================================================

/**
 * @route GET /api/v1/sales-velocity/benchmarks
 * @desc Get industry benchmarks and company comparison
 * @access Private
 */
router.get('/benchmarks', [
  query('industry').optional().isString().withMessage('Industry must be string'),
  query('companySize').optional().isString().withMessage('Company size must be string'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const industry = req.query.industry as string || 'Technology';
    const companySize = req.query.companySize as string || 'Mid-Market';

    const benchmarks = await salesVelocityService.getBenchmarks(industry, companySize);
    const currentMetrics = await salesVelocityService.calculateVelocityMetrics();

    res.json({
      success: true,
      data: {
        benchmarks,
        comparison: {
          salesCycle: {
            current: currentMetrics.averageSalesCycle,
            benchmark: benchmarks.benchmarks.averageSalesCycle,
            performance: currentMetrics.averageSalesCycle < benchmarks.benchmarks.averageSalesCycle ? 'above' : 'below',
            percentile: benchmarks.percentileRanking.salesCycle
          },
          dealSize: {
            current: currentMetrics.averageDealSize,
            benchmark: benchmarks.benchmarks.averageDealSize,
            performance: currentMetrics.averageDealSize > benchmarks.benchmarks.averageDealSize ? 'above' : 'below',
            percentile: benchmarks.percentileRanking.dealSize
          },
          conversionRate: {
            current: currentMetrics.conversionRate,
            benchmark: benchmarks.benchmarks.conversionRate,
            performance: currentMetrics.conversionRate > benchmarks.benchmarks.conversionRate ? 'above' : 'below',
            percentile: benchmarks.percentileRanking.conversionRate
          },
          velocity: {
            current: currentMetrics.velocity,
            benchmark: benchmarks.benchmarks.velocity,
            performance: currentMetrics.velocity > benchmarks.benchmarks.velocity ? 'above' : 'below',
            percentile: benchmarks.percentileRanking.velocity
          }
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Benchmarks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve benchmarks'
    });
  }
});

// =============================================================================
// DEAL MANAGEMENT
// =============================================================================

/**
 * @route GET /api/v1/sales-velocity/deals
 * @desc Get deals with velocity tracking information
 * @access Private
 */
router.get('/deals', [
  query('stage').optional().isString(),
  query('owner').optional().isString(),
  query('sortBy').optional().isIn(['value', 'probability', 'daysInStage', 'totalDaysInPipeline', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const filters = parseFilters(req);
    let deals = salesVelocityService.getDeals(filters);

    // Apply sorting
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    deals.sort((a, b) => {
      const aValue = a[sortBy as keyof Deal] as any;
      const bValue = b[sortBy as keyof Deal] as any;

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'desc' ? bValue.getTime() - aValue.getTime() : aValue.getTime() - bValue.getTime();
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    // Apply pagination
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedDeals = deals.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        deals: paginatedDeals,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(deals.length / limit),
          totalDeals: deals.length,
          hasNextPage: endIndex < deals.length,
          hasPrevPage: page > 1
        },
        summary: {
          totalValue: deals.reduce((sum, d) => sum + d.value, 0),
          averageValue: deals.length > 0 ? deals.reduce((sum, d) => sum + d.value, 0) / deals.length : 0,
          stageDistribution: getStageDistribution(deals)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Deals retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve deals'
    });
  }
});

function getStageDistribution(deals: Deal[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  deals.forEach(deal => {
    distribution[deal.stage] = (distribution[deal.stage] || 0) + 1;
  });
  return distribution;
}

/**
 * @route GET /api/v1/sales-velocity/deals/:id
 * @desc Get specific deal with velocity details
 * @access Private
 */
router.get('/deals/:id', [
  param('id').isString().notEmpty().withMessage('Deal ID is required'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const deal = salesVelocityService.getDeal(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    res.json({
      success: true,
      data: {
        deal,
        velocityInsights: {
          stageVelocity: deal.daysInCurrentStage > 30 ? 'slow' : deal.daysInCurrentStage > 14 ? 'normal' : 'fast',
          pipelineVelocity: deal.totalDaysInPipeline > 90 ? 'slow' : deal.totalDaysInPipeline > 45 ? 'normal' : 'fast',
          probabilityTrend: deal.probability > 75 ? 'high' : deal.probability > 50 ? 'medium' : 'low',
          riskFactors: generateDealRiskFactors(deal)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Deal retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve deal'
    });
  }
});

function generateDealRiskFactors(deal: Deal): string[] {
  const risks = [];

  if (deal.daysInCurrentStage > 30) {
    risks.push('Deal has been in current stage for over 30 days');
  }

  if (deal.totalDaysInPipeline > 90) {
    risks.push('Deal has been in pipeline for over 90 days');
  }

  if (deal.probability < 25) {
    risks.push('Low probability of closing');
  }

  const daysSinceActivity = Math.floor((Date.now() - deal.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceActivity > 7) {
    risks.push('No recent activity on deal');
  }

  return risks;
}

/**
 * @route POST /api/v1/sales-velocity/deals
 * @desc Create new deal with velocity tracking
 * @access Private
 */
router.post('/deals', [
  body('title').isString().notEmpty().withMessage('Title is required'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be positive number'),
  body('currency').isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3-letter code'),
  body('probability').isInt({ min: 0, max: 100 }).withMessage('Probability must be between 0 and 100'),
  body('stage').isString().notEmpty().withMessage('Stage is required'),
  body('stageOrder').isInt({ min: 1 }).withMessage('Stage order must be positive integer'),
  body('ownerId').isString().notEmpty().withMessage('Owner ID is required'),
  body('accountId').isString().notEmpty().withMessage('Account ID is required'),
  body('leadSource').isString().notEmpty().withMessage('Lead source is required'),
  body('expectedCloseDate').isISO8601().withMessage('Expected close date must be valid date'),
  body('tags').optional().isArray().withMessage('Tags must be array'),
  body('customFields').optional().isObject().withMessage('Custom fields must be object'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const dealData = {
      ...req.body,
      expectedCloseDate: new Date(req.body.expectedCloseDate),
      lastActivityDate: new Date(),
      isWon: false,
      isLost: false,
      tags: req.body.tags || [],
      customFields: req.body.customFields || {}
    };

    const deal = await salesVelocityService.createDeal(dealData);

    res.status(201).json({
      success: true,
      data: { deal },
      message: 'Deal created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Deal creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create deal'
    });
  }
});

/**
 * @route PUT /api/v1/sales-velocity/deals/:id
 * @desc Update deal with velocity tracking
 * @access Private
 */
router.put('/deals/:id', [
  param('id').isString().notEmpty().withMessage('Deal ID is required'),
  body('title').optional().isString(),
  body('value').optional().isFloat({ min: 0 }),
  body('probability').optional().isInt({ min: 0, max: 100 }),
  body('stage').optional().isString(),
  body('expectedCloseDate').optional().isISO8601(),
  body('actualCloseDate').optional().isISO8601(),
  body('isWon').optional().isBoolean(),
  body('isLost').optional().isBoolean(),
  body('lossReason').optional().isString(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const updates: any = { ...req.body };

    if (updates.expectedCloseDate) {
      updates.expectedCloseDate = new Date(updates.expectedCloseDate);
    }

    if (updates.actualCloseDate) {
      updates.actualCloseDate = new Date(updates.actualCloseDate);
    }

    const deal = await salesVelocityService.updateDeal(req.params.id, updates);

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    res.json({
      success: true,
      data: { deal },
      message: 'Deal updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Deal update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update deal'
    });
  }
});

// =============================================================================
// TRENDS AND ANALYTICS
// =============================================================================

/**
 * @route GET /api/v1/sales-velocity/trends
 * @desc Get velocity trends over time
 * @access Private
 */
router.get('/trends', [
  query('metric').optional().isIn(['velocity', 'dealSize', 'conversionRate', 'salesCycle']).withMessage('Invalid metric'),
  query('period').optional().isInt({ min: 7, max: 365 }).withMessage('Period must be between 7 and 365 days'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const filters = parseFilters(req);
    const analytics = await salesVelocityService.getVelocityAnalytics(filters);

    const metric = req.query.metric as string || 'velocity';
    const period = req.query.period ? parseInt(req.query.period as string) : 30;

    const trendData = analytics.trends[metric as keyof typeof analytics.trends].slice(-period);

    res.json({
      success: true,
      data: {
        metric,
        period,
        trends: trendData,
        analysis: {
          currentValue: trendData[trendData.length - 1]?.value || 0,
          previousValue: trendData[trendData.length - 2]?.value || 0,
          change: calculatePercentageChange(
            trendData[trendData.length - 2]?.value || 0,
            trendData[trendData.length - 1]?.value || 0
          ),
          trend: determineTrend(trendData),
          volatility: calculateVolatility(trendData)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve trends'
    });
  }
});

function calculatePercentageChange(previous: number, current: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function determineTrend(data: Array<{ date: string; value: number }>): 'increasing' | 'decreasing' | 'stable' {
  if (data.length < 2) return 'stable';

  const recentValues = data.slice(-5).map(d => d.value);
  const slope = calculateSlope(recentValues);

  if (slope > 0.1) return 'increasing';
  if (slope < -0.1) return 'decreasing';
  return 'stable';
}

function calculateSlope(values: number[]): number {
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
  const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

  return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
}

function calculateVolatility(data: Array<{ date: string; value: number }>): number {
  if (data.length < 2) return 0;

  const values = data.map(d => d.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

  return Math.sqrt(variance) / mean * 100; // Coefficient of variation as percentage
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * @route GET /api/v1/sales-velocity/health
 * @desc Get sales velocity service health status
 * @access Private
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await salesVelocityService.healthCheck();

    res.json({
      success: true,
      data: {
        service: 'Sales Velocity Service',
        status: health.status,
        details: {
          deals: health.deals,
          stages: health.stages,
          activeReps: health.activeReps,
          metricsCalculation: health.metricsStatus,
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export default router;
