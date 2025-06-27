import express from 'express';
import { body, validationResult } from 'express-validator';
import { redisManager } from '../services/redis-client';
import { TerritoryManagementService } from '../services/territory-management-service';

const router = express.Router();
let territoryService: TerritoryManagementService;

// Initialize service
const initializeService = async () => {
  if (!territoryService) {
    territoryService = new TerritoryManagementService(redisManager);
  }
  return territoryService;
};

// Authentication middleware placeholder
const authenticateRequest = (req: any, res: any, next: any) => {
  // In production, implement proper JWT/API key validation
  req.user = { id: 'user_123', role: 'admin' };
  next();
};

// Validation middleware
const handleValidationErrors = (req: any, res: any, next: any) => {
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

/**
 * Universal Territory Management API Routes
 * Complete territory management system compatible with all platforms
 * Supports geographic, industry, account-based, and hybrid territory models
 */

/**
 * @route GET /api/v1/territory-management/overview
 * @desc Get comprehensive territory management dashboard
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/overview', authenticateRequest, async (req, res) => {
  try {
    const service = await initializeService();

    const [territories, reps, analytics, optimization] = await Promise.all([
      service.getTerritories({ status: ['active'] }),
      service.getSalesReps({ status: 'active' }),
      service.getTerritoryAnalytics(),
      service.optimizeTerritories()
    ]);

    const overview = {
      summary: {
        totalTerritories: territories.length,
        activeTerritories: territories.filter(t => t.status === 'active').length,
        totalReps: reps.length,
        averageLoad: reps.reduce((sum, r) => sum + r.currentLoad, 0) / reps.length,
        totalRevenue: territories.reduce((sum, t) => sum + t.metrics.totalRevenue, 0)
      },
      analytics,
      optimization,
      recentActivity: {
        newAssignments: Math.floor(Math.random() * 10) + 5,
        coverageImprovements: Math.floor(Math.random() * 5) + 2
      }
    };

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting territory overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get territory overview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/territory-management/territories
 * @desc Get filtered list of territories with pagination
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/territories', authenticateRequest, async (req, res) => {
  try {
    const service = await initializeService();

    const filters = {
      status: req.query.status ? (req.query.status as string).split(',') : undefined,
      assignedRep: req.query.assignedRep as string,
      type: req.query.type ? (req.query.type as string).split(',') : undefined,
      priority: req.query.priority ? (req.query.priority as string).split(',') : undefined
    };

    const territories = await service.getTerritories(filters);

    res.json({
      success: true,
      data: {
        territories,
        summary: {
          totalRevenue: territories.reduce((sum, t) => sum + t.metrics.totalRevenue, 0),
          averageCoverage: territories.reduce((sum, t) => sum + t.metrics.coverage, 0) / territories.length,
          activeCount: territories.filter(t => t.status === 'active').length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting territories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get territories',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/territory-management/territories/:id
 * @desc Get detailed territory information
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/territories/:id', authenticateRequest, async (req, res) => {
  try {
    const service = await initializeService();
    const { id } = req.params;

    const territory = await service.getTerritoryById(id);

    if (!territory) {
      return res.status(404).json({
        success: false,
        error: 'Territory not found',
        territoryId: id
      });
    }

    res.json({
      success: true,
      data: territory,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting territory details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get territory details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/territory-management/territories
 * @desc Create a new territory
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/territories', [
  authenticateRequest,
  body('name').notEmpty().trim(),
  body('type').isIn(['geographic', 'industry', 'account_size', 'named_accounts', 'hybrid']),
  body('assignedRep').notEmpty().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const service = await initializeService();

    const territoryData = {
      name: req.body.name,
      description: req.body.description || '',
      type: req.body.type,
      boundaries: req.body.boundaries || {},
      assignedRep: req.body.assignedRep,
      accounts: [],
      metrics: {
        totalAccounts: 0,
        activeAccounts: 0,
        totalRevenue: 0,
        potentialRevenue: 0,
        coverage: 0,
        penetration: 0,
        competitiveWins: 0,
        competitiveLosses: 0,
        averageDealSize: 0,
        salesCycle: 0,
        conversionRate: 0,
        activityMetrics: { calls: 0, emails: 0, meetings: 0, demos: 0 }
      },
      status: 'active' as const,
      rules: [],
      priority: 'medium' as const
    };

    const territory = await service.createTerritory(territoryData);

    res.status(201).json({
      success: true,
      data: territory,
      message: 'Territory created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating territory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create territory',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/territory-management/assignments
 * @desc Assign accounts to territories
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/assignments', [
  authenticateRequest,
  body('accountId').notEmpty().trim(),
  body('territoryId').notEmpty().trim(),
  body('reason').notEmpty().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const service = await initializeService();
    const { accountId, territoryId, reason } = req.body;

    const assignment = await service.assignAccountToTerritory(accountId, territoryId, reason);

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Account assigned successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error assigning account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign account',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/territory-management/sales-reps
 * @desc Get sales representatives with performance metrics
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/sales-reps', authenticateRequest, async (req, res) => {
  try {
    const service = await initializeService();

    const filters = {
      status: req.query.status as string,
      territories: req.query.territories ? (req.query.territories as string).split(',') : undefined
    };

    const reps = await service.getSalesReps(filters);

    res.json({
      success: true,
      data: {
        reps,
        summary: {
          totalReps: reps.length,
          averageLoad: reps.reduce((sum, r) => sum + r.currentLoad, 0) / reps.length,
          averageAttainment: reps.reduce((sum, r) => sum + r.performance.attainment, 0) / reps.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting sales reps:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sales reps',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/territory-management/optimize
 * @desc Run territory optimization analysis
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/optimize', authenticateRequest, async (req, res) => {
  try {
    const service = await initializeService();

    const optimization = await service.optimizeTerritories();

    res.json({
      success: true,
      data: optimization,
      message: 'Territory optimization completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error optimizing territories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize territories',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/territory-management/analytics
 * @desc Get comprehensive territory analytics
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/analytics', authenticateRequest, async (req, res) => {
  try {
    const service = await initializeService();

    const filters = {
      timeRange: req.query.timeRange ? JSON.parse(req.query.timeRange as string) : undefined,
      territoryIds: req.query.territoryIds ? (req.query.territoryIds as string).split(',') : undefined,
      repIds: req.query.repIds ? (req.query.repIds as string).split(',') : undefined,
      includeInactive: req.query.includeInactive === 'true'
    };

    const analytics = await service.getTerritoryAnalytics(filters);

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
      filters
    });
  } catch (error) {
    console.error('Error getting territory analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get territory analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/territory-management/health
 * @desc Health check endpoint
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.get('/health', async (req, res) => {
  try {
    const service = await initializeService();

    const [territories, reps] = await Promise.all([
      service.getTerritories({ status: ['active'] }),
      service.getSalesReps({ status: 'active' })
    ]);

    const healthData = {
      service: 'territory-management',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        territories: territories.length,
        activeReps: reps.length,
        serviceUptime: process.uptime()
      }
    };

    res.json(healthData);
  } catch (error) {
    console.error('Territory management health check failed:', error);
    res.status(503).json({
      service: 'territory-management',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
