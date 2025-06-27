import { Request, Response, Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { HotAccountsService } from '../services/hot-accounts-service';
import { redisManager } from '../services/redis-client';

const router = Router();

// Middleware to handle validation errors
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// CORS headers for universal platform compatibility
router.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Authentication middleware (placeholder - implement according to your auth strategy)
const authenticateRequest = (req: Request, res: Response, next: any) => {
  // In a real implementation, verify JWT token or API key
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Mock authentication - in production, validate the token properly
  if (authHeader === 'Bearer invalid-token') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }

  next();
};

// Apply authentication to all routes
router.use(authenticateRequest);

// Initialize service using the imported redisManager
const hotAccountsService = new HotAccountsService(redisManager);

// GET /api/v1/hot-accounts/overview - Get comprehensive hot accounts dashboard data
router.get('/overview', [
  query('industries').optional().isString().withMessage('Industries must be a string'),
  query('sizes').optional().isString().withMessage('Sizes must be a string'),
  query('priorities').optional().isString().withMessage('Priorities must be a string'),
  query('statuses').optional().isString().withMessage('Statuses must be a string'),
  query('minScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Min score must be between 0 and 100'),
  query('maxScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Max score must be between 0 and 100'),
  query('assignedReps').optional().isString().withMessage('Assigned reps must be a string'),
  query('technologies').optional().isString().withMessage('Technologies must be a string'),
  query('locations').optional().isString().withMessage('Locations must be a string'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isIn(['score', 'engagement', 'revenue', 'name', 'lastActivity']).withMessage('Invalid sort field'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const {
      industries,
      sizes,
      priorities,
      statuses,
      minScore,
      maxScore,
      assignedReps,
      technologies,
      locations,
      page = 1,
      limit = 50,
      sort = 'score',
      order = 'desc'
    } = req.query;

    // Parse filter parameters
    const filters: any = {};

    if (industries) {
      filters.industries = (industries as string).split(',').map(s => s.trim());
    }
    if (sizes) {
      filters.sizes = (sizes as string).split(',').map(s => s.trim());
    }
    if (priorities) {
      filters.priorities = (priorities as string).split(',').map(s => s.trim());
    }
    if (statuses) {
      filters.statuses = (statuses as string).split(',').map(s => s.trim());
    }
    if (assignedReps) {
      filters.assignedReps = (assignedReps as string).split(',').map(s => s.trim());
    }
    if (technologies) {
      filters.technologies = (technologies as string).split(',').map(s => s.trim());
    }
    if (locations) {
      filters.locations = (locations as string).split(',').map(s => s.trim());
    }
    if (minScore !== undefined || maxScore !== undefined) {
      filters.scoreRange = {
        min: minScore ? parseFloat(minScore as string) : 0,
        max: maxScore ? parseFloat(maxScore as string) : 100
      };
    }

    // Get hot accounts data
    const data = await hotAccountsService.getHotAccountsData(filters);

    // Apply sorting
    if (sort) {
      data.accounts.sort((a, b) => {
        let aVal: any, bVal: any;

        switch (sort) {
          case 'score':
            aVal = a.overallScore;
            bVal = b.overallScore;
            break;
          case 'engagement':
            aVal = a.engagementScore;
            bVal = b.engagementScore;
            break;
          case 'revenue':
            aVal = a.revenue || 0;
            bVal = b.revenue || 0;
            break;
          case 'name':
            aVal = a.companyName.toLowerCase();
            bVal = b.companyName.toLowerCase();
            break;
          case 'lastActivity':
            aVal = a.lastEngagement ? new Date(a.lastEngagement).getTime() : 0;
            bVal = b.lastEngagement ? new Date(b.lastEngagement).getTime() : 0;
            break;
          default:
            aVal = a.overallScore;
            bVal = b.overallScore;
        }

        if (order === 'desc') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
      });
    }

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedAccounts = data.accounts.slice(startIndex, endIndex);

    // Calculate pagination metadata
    const totalPages = Math.ceil(data.totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Calculate aggregate metrics for current page
    const currentPageMetrics = {
      totalAccounts: paginatedAccounts.length,
      averageScore: paginatedAccounts.reduce((sum, acc) => sum + acc.overallScore, 0) / paginatedAccounts.length || 0,
      highPriorityCount: paginatedAccounts.filter(acc => acc.priority === 'high' || acc.priority === 'critical').length,
      criticalPriorityCount: paginatedAccounts.filter(acc => acc.priority === 'critical').length
    };

    res.json({
      success: true,
      data: {
        accounts: paginatedAccounts,
        summary: data.summary,
        scoringFactors: data.scoringFactors,
        currentPageMetrics,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: data.totalCount,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPrevPage,
          startIndex: startIndex + 1,
          endIndex: Math.min(endIndex, data.totalCount)
        },
        filters: data.filters,
        sort: { field: sort, order }
      }
    });

  } catch (error) {
    console.error('Error getting hot accounts overview:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/v1/hot-accounts/accounts - Get filtered hot accounts list
router.get('/accounts', [
  query('industries').optional().isString(),
  query('sizes').optional().isString(),
  query('priorities').optional().isString(),
  query('statuses').optional().isString(),
  query('minScore').optional().isFloat({ min: 0, max: 100 }),
  query('maxScore').optional().isFloat({ min: 0, max: 100 }),
  query('assignedReps').optional().isString(),
  query('technologies').optional().isString(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const {
      industries,
      sizes,
      priorities,
      statuses,
      minScore,
      maxScore,
      assignedReps,
      technologies,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // Parse filters
    const filters: any = {};
    if (industries) filters.industries = (industries as string).split(',');
    if (sizes) filters.sizes = (sizes as string).split(',');
    if (priorities) filters.priorities = (priorities as string).split(',');
    if (statuses) filters.statuses = (statuses as string).split(',');
    if (assignedReps) filters.assignedReps = (assignedReps as string).split(',');
    if (technologies) filters.technologies = (technologies as string).split(',');
    if (minScore !== undefined || maxScore !== undefined) {
      filters.scoreRange = {
        min: minScore ? parseFloat(minScore as string) : 0,
        max: maxScore ? parseFloat(maxScore as string) : 100
      };
    }

    let accounts = await hotAccountsService.getHotAccounts(filters);

    // Apply search filter
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      accounts = accounts.filter(account =>
        account.companyName.toLowerCase().includes(searchTerm) ||
        account.domain.toLowerCase().includes(searchTerm) ||
        account.industry.toLowerCase().includes(searchTerm) ||
        account.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedAccounts = accounts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        accounts: paginatedAccounts,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(accounts.length / limitNum),
          totalItems: accounts.length,
          itemsPerPage: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Error getting hot accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/hot-accounts/accounts/:id - Get specific account details
router.get('/accounts/:id', [
  query('includeEngagement').optional().isBoolean().withMessage('Include engagement must be boolean')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { includeEngagement = 'true' } = req.query;

    const account = await hotAccountsService.getAccountDetails(id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    let engagement = null;
    if (includeEngagement === 'true') {
      engagement = await hotAccountsService.getAccountEngagementMetrics(id);
    }

    res.json({
      success: true,
      data: {
        account,
        engagement
      }
    });

  } catch (error) {
    console.error('Error getting account details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/v1/hot-accounts/accounts/:id/score - Update account score
router.put('/accounts/:id/score', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const newScore = await hotAccountsService.updateAccountScore(id);

    res.json({
      success: true,
      data: {
        accountId: id,
        newScore,
        message: 'Account score updated successfully'
      }
    });

  } catch (error) {
    console.error('Error updating account score:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/hot-accounts/engagement - Add engagement activity
router.post('/engagement', [
  body('accountId').notEmpty().withMessage('Account ID is required'),
  body('type').isIn([
    'website_visit', 'content_download', 'email_open', 'email_click',
    'demo_request', 'pricing_view', 'support_ticket', 'social_engagement'
  ]).withMessage('Invalid engagement type'),
  body('description').notEmpty().withMessage('Description is required'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('source').notEmpty().withMessage('Source is required'),
  body('contactId').optional().isString(),
  body('metadata').optional().isObject()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const {
      accountId,
      contactId,
      type,
      description,
      value,
      source,
      metadata = {}
    } = req.body;

    await hotAccountsService.addEngagementActivity({
      accountId,
      contactId,
      type,
      description,
      timestamp: new Date(),
      value: parseFloat(value),
      source,
      metadata
    });

    res.json({
      success: true,
      message: 'Engagement activity added successfully'
    });

  } catch (error) {
    console.error('Error adding engagement activity:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/hot-accounts/metrics/summary - Get summary metrics
router.get('/metrics/summary', async (req: Request, res: Response) => {
  try {
    const data = await hotAccountsService.getHotAccountsData();

    const metrics = {
      totalAccounts: data.totalCount,
      averageScore: data.summary.averageScore,
      highPriorityCount: data.summary.highPriorityCount,
      recentEngagementCount: data.summary.recentEngagementCount,
      conversionRate: data.summary.conversionRate,
      topIndustries: data.summary.topIndustries,
      topTechnologies: data.summary.topTechnologies,
      scoringFactors: data.scoringFactors
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error getting summary metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/hot-accounts/health - Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check Redis connection
    const redisHealth = await redisManager.healthCheck();
    const redisHealthy = redisHealth.status === 'healthy';

    // Check service functionality
    const serviceHealthy = await hotAccountsService.getHotAccounts().then(() => true).catch(() => false);

    const health = {
      status: redisHealthy && serviceHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisHealthy ? 'connected' : 'disconnected',
        hotAccountsService: serviceHealthy ? 'operational' : 'error'
      },
      details: {
        redis: redisHealth
      }
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      }
    });
  }
});

export default router;
