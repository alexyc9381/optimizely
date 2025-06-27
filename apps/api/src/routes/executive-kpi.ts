import express, { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { ExecutiveKPIService } from '../services/executive-kpi-service';
import { redisManager } from '../services/redis-client';

const router = express.Router();

// Service initialization
let executiveKPIService: ExecutiveKPIService;

// Initialize service
export function initializeExecutiveKPIService(redisClient: any) {
  executiveKPIService = new ExecutiveKPIService(redisClient);
  console.log('📊 Executive KPI Service initialized');
}

// Lazy initialization fallback
function getService() {
  if (!executiveKPIService) {
    try {
      executiveKPIService = new ExecutiveKPIService(redisManager.getClient());
    } catch (error) {
      console.error('Failed to initialize Executive KPI Service:', error);
      throw new Error('Service not available');
    }
  }
  return executiveKPIService;
}

// Universal CORS headers middleware
router.use((req, res, next) => {
  // Universal platform compatibility headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Platform-Type');
  res.setHeader('X-API-Platform', 'universal');
  res.setHeader('X-Service-Type', 'executive-kpi');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
});

// Authentication middleware (placeholder for actual implementation)
const authMiddleware = (req: any, res: any, next: any) => {
  // In production, implement proper authentication
  // For now, allow all requests for development
  next();
};

// Validation error handler
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

// =============================================================================
// EXECUTIVE KPI ROUTES
// =============================================================================

/**
 * GET /api/v1/executive-kpi/overview
 * Get comprehensive executive KPI dashboard overview
 */
router.get(
  '/overview',
  [
    query('categories').optional().isString().withMessage('Categories must be comma-separated string'),
    query('departments').optional().isString().withMessage('Departments must be comma-separated string'),
    query('periods').optional().isString().withMessage('Periods must be comma-separated string'),
    query('status').optional().isString().withMessage('Status must be comma-separated string'),
    query('urgency').optional().isString().withMessage('Urgency must be comma-separated string'),
    query('kpiIds').optional().isString().withMessage('KPI IDs must be comma-separated string'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601 date'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  ],
  handleValidationErrors,
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const service = getService();
      const {
        categories,
        departments,
        periods,
        status,
        urgency,
        kpiIds,
        startDate,
        endDate,
        limit = 20,
        offset = 0,
      } = req.query;

      // Parse filters
      const filters: any = {};
      if (categories) filters.categories = (categories as string).split(',');
      if (departments) filters.departments = (departments as string).split(',');
      if (periods) filters.periods = (periods as string).split(',');
      if (status) filters.status = (status as string).split(',');
      if (urgency) filters.urgency = (urgency as string).split(',');
      if (kpiIds) filters.kpiIds = (kpiIds as string).split(',');
      if (startDate && endDate) {
        filters.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }
      filters.limit = parseInt(limit as string);
      filters.offset = parseInt(offset as string);

      const data = await service.getExecutiveKPIData(filters);

      // Apply pagination to KPIs
      const paginatedKPIs = data.kpis.slice(Number(offset), Number(offset) + Number(limit));

      // Calculate summary statistics
      const summary = {
        totalKPIs: data.kpis.length,
        onTrackKPIs: data.kpis.filter(kpi => kpi.status === 'on-track').length,
        atRiskKPIs: data.kpis.filter(kpi => kpi.status === 'at-risk').length,
        offTrackKPIs: data.kpis.filter(kpi => kpi.status === 'off-track').length,
        exceededKPIs: data.kpis.filter(kpi => kpi.status === 'exceeded').length,
        criticalAlerts: data.alerts.filter(alert => alert.level === 'critical').length,
        warningAlerts: data.alerts.filter(alert => alert.level === 'warning').length,
        overallHealthScore: data.executiveSummary.overallHealthScore,
        avgConfidence: data.kpis.reduce((sum, kpi) => sum + kpi.confidence, 0) / data.kpis.length,
        trendingUp: data.kpis.filter(kpi => kpi.trend === 'up').length,
        trendingDown: data.kpis.filter(kpi => kpi.trend === 'down').length,
      };

      res.json({
        success: true,
        data: {
          ...data,
          kpis: paginatedKPIs,
          summary,
          pagination: {
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            total: data.kpis.length,
            hasMore: Number(offset) + Number(limit) < data.kpis.length,
          },
        },
        timestamp: new Date().toISOString(),
        platform: 'universal',
      });
    } catch (error) {
      console.error('Error fetching executive KPI overview:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch executive KPI overview',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/v1/executive-kpi/kpis
 * Get executive KPI metrics with filtering and sorting
 */
router.get(
  '/kpis',
  [
    query('categories').optional().isString().withMessage('Categories must be comma-separated string'),
    query('status').optional().isString().withMessage('Status must be comma-separated string'),
    query('urgency').optional().isString().withMessage('Urgency must be comma-separated string'),
    query('kpiIds').optional().isString().withMessage('KPI IDs must be comma-separated string'),
    query('sortBy').optional().isIn(['name', 'value', 'trend', 'status', 'urgency', 'confidence']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('search').optional().isString().withMessage('Search term must be a string'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  ],
  handleValidationErrors,
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const service = getService();
      const {
        categories,
        status,
        urgency,
        kpiIds,
        sortBy = 'name',
        sortOrder = 'asc',
        search,
        limit = 20,
        offset = 0,
      } = req.query;

      // Parse filters
      const filters: any = {};
      if (categories) filters.categories = (categories as string).split(',');
      if (status) filters.status = (status as string).split(',');
      if (urgency) filters.urgency = (urgency as string).split(',');
      if (kpiIds) filters.kpiIds = (kpiIds as string).split(',');

      const kpis = await service.getExecutiveKPIs(filters);

      // Apply search filter
      let filteredKPIs = kpis;
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredKPIs = filteredKPIs.filter(kpi =>
          kpi.name.toLowerCase().includes(searchLower) ||
          kpi.description.toLowerCase().includes(searchLower) ||
          kpi.category.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      filteredKPIs.sort((a, b) => {
        let valueA: any, valueB: any;

        switch (sortBy) {
          case 'name':
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
            break;
          case 'value':
            valueA = a.value;
            valueB = b.value;
            break;
          case 'trend':
            valueA = a.trendPercentage;
            valueB = b.trendPercentage;
            break;
          case 'status':
            valueA = a.status;
            valueB = b.status;
            break;
          case 'urgency':
            const urgencyOrder = { low: 1, medium: 2, high: 3, critical: 4 };
            valueA = urgencyOrder[a.urgency as keyof typeof urgencyOrder];
            valueB = urgencyOrder[b.urgency as keyof typeof urgencyOrder];
            break;
          case 'confidence':
            valueA = a.confidence;
            valueB = b.confidence;
            break;
          default:
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
        }

        if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      // Apply pagination
      const paginatedKPIs = filteredKPIs.slice(Number(offset), Number(offset) + Number(limit));

      // Calculate aggregate metrics
      const aggregateMetrics = {
        totalKPIs: filteredKPIs.length,
        averageValue: filteredKPIs.reduce((sum, kpi) => sum + kpi.value, 0) / filteredKPIs.length,
        averageConfidence: filteredKPIs.reduce((sum, kpi) => sum + kpi.confidence, 0) / filteredKPIs.length,
        targetAchievement: filteredKPIs.reduce((sum, kpi) => sum + ((kpi.value / kpi.target) * 100), 0) / filteredKPIs.length,
        statusBreakdown: {
          onTrack: filteredKPIs.filter(kpi => kpi.status === 'on-track').length,
          atRisk: filteredKPIs.filter(kpi => kpi.status === 'at-risk').length,
          offTrack: filteredKPIs.filter(kpi => kpi.status === 'off-track').length,
          exceeded: filteredKPIs.filter(kpi => kpi.status === 'exceeded').length,
        },
        urgencyBreakdown: {
          low: filteredKPIs.filter(kpi => kpi.urgency === 'low').length,
          medium: filteredKPIs.filter(kpi => kpi.urgency === 'medium').length,
          high: filteredKPIs.filter(kpi => kpi.urgency === 'high').length,
          critical: filteredKPIs.filter(kpi => kpi.urgency === 'critical').length,
        },
        categoryBreakdown: filteredKPIs.reduce((acc, kpi) => {
          acc[kpi.category] = (acc[kpi.category] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number }),
      };

      res.json({
        success: true,
        data: paginatedKPIs,
        aggregateMetrics,
        meta: {
          total: filteredKPIs.length,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: Number(offset) + Number(limit) < filteredKPIs.length,
          sortBy,
          sortOrder,
          search: search || null,
        },
        timestamp: new Date().toISOString(),
        platform: 'universal',
      });
    } catch (error) {
      console.error('Error fetching executive KPIs:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch executive KPIs',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/v1/executive-kpi/goals
 * Get goal progress tracking and milestones
 */
router.get(
  '/goals',
  [
    query('categories').optional().isString().withMessage('Categories must be comma-separated string'),
    query('departments').optional().isString().withMessage('Departments must be comma-separated string'),
    query('status').optional().isString().withMessage('Status must be comma-separated string'),
    query('owners').optional().isString().withMessage('Owners must be comma-separated string'),
    query('sortBy').optional().isIn(['name', 'progress', 'deadline', 'currentValue', 'status']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  ],
  handleValidationErrors,
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const service = getService();
      const {
        categories,
        departments,
        status,
        owners,
        sortBy = 'name',
        sortOrder = 'asc',
        limit = 20,
        offset = 0,
      } = req.query;

      // Parse filters
      const filters: any = {};
      if (categories) filters.categories = (categories as string).split(',');
      if (departments) filters.departments = (departments as string).split(',');
      if (status) filters.status = (status as string).split(',');

      const goals = await service.getGoalProgress(filters);

      // Apply additional filters
      let filteredGoals = goals;

      if (owners) {
        const ownerList = (owners as string).split(',');
        filteredGoals = filteredGoals.filter(goal =>
          ownerList.includes(goal.owner)
        );
      }

      // Apply sorting
      filteredGoals.sort((a, b) => {
        let valueA: any, valueB: any;

        switch (sortBy) {
          case 'name':
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
            break;
          case 'progress':
            valueA = a.progress;
            valueB = b.progress;
            break;
          case 'deadline':
            valueA = new Date(a.deadline).getTime();
            valueB = new Date(b.deadline).getTime();
            break;
          case 'currentValue':
            valueA = a.currentValue;
            valueB = b.currentValue;
            break;
          case 'status':
            valueA = a.status;
            valueB = b.status;
            break;
          default:
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
        }

        if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      // Apply pagination
      const paginatedGoals = filteredGoals.slice(Number(offset), Number(offset) + Number(limit));

      // Calculate summary metrics
      const summaryMetrics = {
        totalGoals: filteredGoals.length,
        averageProgress: filteredGoals.reduce((sum, goal) => sum + goal.progress, 0) / filteredGoals.length,
        completedGoals: filteredGoals.filter(goal => goal.status === 'completed').length,
        atRiskGoals: filteredGoals.filter(goal => goal.status === 'at-risk').length,
        totalMilestones: filteredGoals.reduce((sum, goal) => sum + goal.milestones.length, 0),
        completedMilestones: filteredGoals.reduce((sum, goal) =>
          sum + goal.milestones.filter(m => m.completed).length, 0),
        upcomingDeadlines: filteredGoals.filter(goal => {
          const deadline = new Date(goal.deadline);
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          return deadline <= thirtyDaysFromNow && goal.status !== 'completed';
        }).length,
      };

      res.json({
        success: true,
        data: paginatedGoals,
        summaryMetrics,
        meta: {
          total: filteredGoals.length,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: Number(offset) + Number(limit) < filteredGoals.length,
          sortBy,
          sortOrder,
        },
        timestamp: new Date().toISOString(),
        platform: 'universal',
      });
    } catch (error) {
      console.error('Error fetching goal progress:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch goal progress',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/v1/executive-kpi/executive-summary
 * Get executive summary with key highlights and actions
 */
router.get('/executive-summary', authMiddleware, async (req: Request, res: Response) => {
  try {
    const service = getService();

    const filters: any = {};
    const executiveSummary = await service.getExecutiveSummary(filters);

    res.json({
      success: true,
      data: executiveSummary,
      timestamp: new Date().toISOString(),
      platform: 'universal',
    });
  } catch (error) {
    console.error('Error fetching executive summary:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch executive summary',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/v1/executive-kpi/health
 * Get service health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const service = getService();

    // Basic health check
    const healthStatus = {
      status: 'healthy',
      service: 'executive-kpi',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      checks: {
        service: true,
        redis: false,
        data: false,
      },
    };

    // Check Redis connection
    try {
      await redisManager.getClient().ping();
      healthStatus.checks.redis = true;
    } catch (error) {
      console.warn('Redis health check failed:', error);
    }

    // Check data availability
    try {
      const testData = await service.getExecutiveKPIs({ limit: 1 });
      healthStatus.checks.data = Array.isArray(testData) && testData.length >= 0;
    } catch (error) {
      console.warn('Data health check failed:', error);
    }

    // Determine overall health
    const allChecksPass = Object.values(healthStatus.checks).every(check => check === true);
    if (!allChecksPass) {
      healthStatus.status = 'degraded';
    }

    res.status(healthStatus.status === 'healthy' ? 200 : 503).json({
      success: true,
      data: healthStatus,
      timestamp: new Date().toISOString(),
      platform: 'universal',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
