import { Request, Response, Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { redisManager } from '../services/redis-client';
import { VisitorIntelligenceService } from '../services/visitor-intelligence-service';

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
const visitorIntelligenceService = new VisitorIntelligenceService(redisManager);

// GET /api/v1/visitor-intelligence/overview - Get comprehensive visitor intelligence dashboard data
router.get('/overview', [
  query('status').optional().isString().withMessage('Status must be a string'),
  query('leadScoreMin').optional().isFloat({ min: 0, max: 100 }).withMessage('Lead score min must be between 0 and 100'),
  query('leadScoreMax').optional().isFloat({ min: 0, max: 100 }).withMessage('Lead score max must be between 0 and 100'),
  query('intentScoreMin').optional().isFloat({ min: 0, max: 100 }).withMessage('Intent score min must be between 0 and 100'),
  query('intentScoreMax').optional().isFloat({ min: 0, max: 100 }).withMessage('Intent score max must be between 0 and 100'),
  query('countries').optional().isString().withMessage('Countries must be a string'),
  query('companies').optional().isString().withMessage('Companies must be a string'),
  query('sources').optional().isString().withMessage('Sources must be a string'),
  query('deviceTypes').optional().isString().withMessage('Device types must be a string'),
  query('dateStart').optional().isISO8601().withMessage('Date start must be a valid ISO 8601 date'),
  query('dateEnd').optional().isISO8601().withMessage('Date end must be a valid ISO 8601 date'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isIn(['leadScore', 'intentScore', 'engagementScore', 'lastSeen', 'sessions']).withMessage('Invalid sort field'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const {
      status,
      leadScoreMin,
      leadScoreMax,
      intentScoreMin,
      intentScoreMax,
      countries,
      companies,
      sources,
      deviceTypes,
      dateStart,
      dateEnd,
      page = 1,
      limit = 50,
      sort = 'leadScore',
      order = 'desc'
    } = req.query;

    // Parse filter parameters
    const filters: any = {};

    if (status) {
      filters.status = (status as string).split(',').map(s => s.trim());
    }

    if (leadScoreMin !== undefined || leadScoreMax !== undefined) {
      filters.leadScoreRange = {
        min: leadScoreMin ? parseFloat(leadScoreMin as string) : 0,
        max: leadScoreMax ? parseFloat(leadScoreMax as string) : 100
      };
    }

    if (intentScoreMin !== undefined || intentScoreMax !== undefined) {
      filters.intentScoreRange = {
        min: intentScoreMin ? parseFloat(intentScoreMin as string) : 0,
        max: intentScoreMax ? parseFloat(intentScoreMax as string) : 100
      };
    }

    if (countries) {
      filters.countries = (countries as string).split(',').map(s => s.trim());
    }

    if (companies) {
      filters.companies = (companies as string).split(',').map(s => s.trim());
    }

    if (sources) {
      filters.sources = (sources as string).split(',').map(s => s.trim());
    }

    if (deviceTypes) {
      filters.deviceTypes = (deviceTypes as string).split(',').map(s => s.trim());
    }

    if (dateStart || dateEnd) {
      filters.timeRange = {
        start: dateStart ? new Date(dateStart as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: dateEnd ? new Date(dateEnd as string) : new Date()
      };
    }

    // Get visitor intelligence data
    const data = await visitorIntelligenceService.getVisitorIntelligenceData(filters);

    // Apply sorting
    if (sort) {
      data.visitors.sort((a, b) => {
        let aVal: any, bVal: any;

        switch (sort) {
          case 'leadScore':
            aVal = a.leadScore;
            bVal = b.leadScore;
            break;
          case 'intentScore':
            aVal = a.intentScore;
            bVal = b.intentScore;
            break;
          case 'engagementScore':
            aVal = a.engagementScore;
            bVal = b.engagementScore;
            break;
          case 'lastSeen':
            aVal = a.lastSeen.getTime();
            bVal = b.lastSeen.getTime();
            break;
          case 'sessions':
            aVal = a.totalSessions;
            bVal = b.totalSessions;
            break;
          default:
            aVal = a.leadScore;
            bVal = b.leadScore;
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
    const paginatedVisitors = data.visitors.slice(startIndex, endIndex);

    // Calculate pagination metadata
    const totalPages = Math.ceil(data.totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Calculate aggregate metrics for current page
    const currentPageMetrics = {
      totalVisitors: paginatedVisitors.length,
      averageLeadScore: paginatedVisitors.reduce((sum, visitor) => sum + visitor.leadScore, 0) / paginatedVisitors.length || 0,
      averageIntentScore: paginatedVisitors.reduce((sum, visitor) => sum + visitor.intentScore, 0) / paginatedVisitors.length || 0,
      identifiedCount: paginatedVisitors.filter(visitor => visitor.status !== 'anonymous').length,
      qualifiedCount: paginatedVisitors.filter(visitor => visitor.status === 'qualified' || visitor.status === 'converted').length
    };

    res.json({
      success: true,
      data: {
        visitors: paginatedVisitors,
        analytics: data.analytics,
        leaderboard: data.leaderboard,
        currentPageMetrics,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: data.totalCount,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPrevPage
        },
        filters: data.filters
      }
    });

  } catch (error) {
    console.error('Error getting visitor intelligence overview:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/visitor-intelligence/visitors - Get filtered visitors list
router.get('/visitors', [
  query('status').optional().isString().withMessage('Status must be a string'),
  query('leadScoreMin').optional().isFloat({ min: 0, max: 100 }).withMessage('Lead score min must be between 0 and 100'),
  query('leadScoreMax').optional().isFloat({ min: 0, max: 100 }).withMessage('Lead score max must be between 0 and 100'),
  query('countries').optional().isString().withMessage('Countries must be a string'),
  query('companies').optional().isString().withMessage('Companies must be a string'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isIn(['leadScore', 'intentScore', 'engagementScore', 'lastSeen', 'sessions', 'companyName']).withMessage('Invalid sort field'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  query('search').optional().isString().withMessage('Search must be a string')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const {
      status,
      leadScoreMin,
      leadScoreMax,
      countries,
      companies,
      page = 1,
      limit = 50,
      sort = 'leadScore',
      order = 'desc',
      search
    } = req.query;

    // Parse filter parameters
    const filters: any = {};

    if (status) {
      filters.status = (status as string).split(',').map(s => s.trim());
    }

    if (leadScoreMin !== undefined || leadScoreMax !== undefined) {
      filters.leadScoreRange = {
        min: leadScoreMin ? parseFloat(leadScoreMin as string) : 0,
        max: leadScoreMax ? parseFloat(leadScoreMax as string) : 100
      };
    }

    if (countries) {
      filters.countries = (countries as string).split(',').map(s => s.trim());
    }

    if (companies) {
      filters.companies = (companies as string).split(',').map(s => s.trim());
    }

    // Get visitors
    let visitors = await visitorIntelligenceService.getVisitors(filters);

    // Apply search filter
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      visitors = visitors.filter(visitor =>
        (visitor.companyName && visitor.companyName.toLowerCase().includes(searchTerm)) ||
        (visitor.identifiedEmail && visitor.identifiedEmail.toLowerCase().includes(searchTerm)) ||
        (visitor.domain && visitor.domain.toLowerCase().includes(searchTerm)) ||
        visitor.location.country.toLowerCase().includes(searchTerm) ||
        visitor.utm.source?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    visitors.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sort) {
        case 'leadScore':
          aVal = a.leadScore;
          bVal = b.leadScore;
          break;
        case 'intentScore':
          aVal = a.intentScore;
          bVal = b.intentScore;
          break;
        case 'engagementScore':
          aVal = a.engagementScore;
          bVal = b.engagementScore;
          break;
        case 'lastSeen':
          aVal = a.lastSeen.getTime();
          bVal = b.lastSeen.getTime();
          break;
        case 'sessions':
          aVal = a.totalSessions;
          bVal = b.totalSessions;
          break;
        case 'companyName':
          aVal = (a.companyName || '').toLowerCase();
          bVal = (b.companyName || '').toLowerCase();
          break;
        default:
          aVal = a.leadScore;
          bVal = b.leadScore;
      }

      if (order === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedVisitors = visitors.slice(startIndex, endIndex);

    // Calculate summary statistics
    const summaryStats = {
      totalVisitors: visitors.length,
      averageLeadScore: visitors.reduce((sum, v) => sum + v.leadScore, 0) / visitors.length || 0,
      averageIntentScore: visitors.reduce((sum, v) => sum + v.intentScore, 0) / visitors.length || 0,
      identifiedPercentage: visitors.length > 0 ? (visitors.filter(v => v.status !== 'anonymous').length / visitors.length) * 100 : 0,
      topCompanies: getTopCompanies(visitors),
      topSources: getTopSources(visitors)
    };

    res.json({
      success: true,
      data: {
        visitors: paginatedVisitors,
        summary: summaryStats,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(visitors.length / limitNum),
          totalItems: visitors.length,
          itemsPerPage: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Error getting visitors:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/visitor-intelligence/visitors/:id - Get specific visitor details
router.get('/visitors/:id', [
  query('includeSessions').optional().isBoolean().withMessage('Include sessions must be boolean')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { includeSessions = 'true' } = req.query;

    const visitor = await visitorIntelligenceService.getVisitorDetails(id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found'
      });
    }

    let sessions = null;
    if (includeSessions === 'true') {
      sessions = await visitorIntelligenceService.getVisitorSessions(id);
    }

    res.json({
      success: true,
      data: {
        visitor,
        sessions
      }
    });

  } catch (error) {
    console.error('Error getting visitor details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/v1/visitor-intelligence/visitors/:id/identify - Identify a visitor
router.post('/visitors/:id/identify', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('additionalData').optional().isObject().withMessage('Additional data must be an object')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, additionalData } = req.body;

    await visitorIntelligenceService.identifyVisitor(id, email, additionalData);

    res.json({
      success: true,
      message: 'Visitor identified successfully',
      data: {
        visitorId: id,
        email
      }
    });

  } catch (error) {
    console.error('Error identifying visitor:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/visitor-intelligence/events - Track visitor event
router.post('/events', [
  body('visitorId').notEmpty().withMessage('Visitor ID is required'),
  body('sessionId').notEmpty().withMessage('Session ID is required'),
  body('type').isIn([
    'click', 'form_submit', 'download', 'video_play', 'scroll', 'hover', 'search', 'custom'
  ]).withMessage('Invalid event type'),
  body('element').notEmpty().withMessage('Element is required'),
  body('value').optional().isString(),
  body('url').isURL().withMessage('Valid URL is required'),
  body('properties').optional().isObject().withMessage('Properties must be an object')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const {
      visitorId,
      sessionId,
      type,
      element,
      value,
      url,
      properties = {}
    } = req.body;

    await visitorIntelligenceService.trackVisitorEvent({
      visitorId,
      sessionId,
      type,
      element,
      value,
      url,
      timestamp: new Date(),
      properties
    });

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking visitor event:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/visitor-intelligence/visitors/:id/report - Generate lead report for visitor
router.get('/visitors/:id/report', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const report = await visitorIntelligenceService.generateLeadReport(id);

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error generating lead report:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/visitor-intelligence/analytics - Get visitor analytics summary
router.get('/analytics', [
  query('dateStart').optional().isISO8601().withMessage('Date start must be a valid ISO 8601 date'),
  query('dateEnd').optional().isISO8601().withMessage('Date end must be a valid ISO 8601 date'),
  query('countries').optional().isString().withMessage('Countries must be a string'),
  query('sources').optional().isString().withMessage('Sources must be a string')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const {
      dateStart,
      dateEnd,
      countries,
      sources
    } = req.query;

    const filters: any = {};

    if (dateStart || dateEnd) {
      filters.timeRange = {
        start: dateStart ? new Date(dateStart as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: dateEnd ? new Date(dateEnd as string) : new Date()
      };
    }

    if (countries) {
      filters.countries = (countries as string).split(',').map(s => s.trim());
    }

    if (sources) {
      filters.sources = (sources as string).split(',').map(s => s.trim());
    }

    const data = await visitorIntelligenceService.getVisitorIntelligenceData(filters);

    res.json({
      success: true,
      data: {
        analytics: data.analytics,
        leaderboard: data.leaderboard,
        summary: {
          totalVisitors: data.totalCount,
          dateRange: filters.timeRange || 'All time',
          appliedFilters: filters
        }
      }
    });

  } catch (error) {
    console.error('Error getting visitor analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/visitor-intelligence/health - Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check Redis connection
    const redisHealth = await redisManager.healthCheck();
    const redisHealthy = redisHealth.status === 'healthy';

    // Check service functionality
    const serviceHealthy = await visitorIntelligenceService.getVisitors().then(() => true).catch(() => false);

    const health = {
      status: redisHealthy && serviceHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisHealthy ? 'connected' : 'disconnected',
        visitorIntelligenceService: serviceHealthy ? 'operational' : 'error'
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

// Helper methods
function getTopCompanies(visitors: any[]) {
  const companyCount: Record<string, number> = {};
  visitors.forEach(visitor => {
    if (visitor.companyName) {
      companyCount[visitor.companyName] = (companyCount[visitor.companyName] || 0) + 1;
    }
  });
  return Object.entries(companyCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([company, count]) => ({ company, count }));
}

function getTopSources(visitors: any[]) {
  const sourceCount: Record<string, number> = {};
  visitors.forEach(visitor => {
    const source = visitor.utm.source || 'direct';
    sourceCount[source] = (sourceCount[source] || 0) + 1;
  });
  return Object.entries(sourceCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));
}

export default router;
