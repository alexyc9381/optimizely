import express from 'express';
import { query, validationResult } from 'express-validator';
import AnalyticsService from '../services/analytics-service';
import { CompetitiveIntelligenceService } from '../services/competitive-intelligence-service';
import { redisManager } from '../services/redis-client';

const router = express.Router();

// Service initialization
let competitiveIntelligenceService: CompetitiveIntelligenceService;

// Initialize service
export function initializeCompetitiveIntelligenceService(redisClient: any, analyticsService: AnalyticsService) {
  competitiveIntelligenceService = new CompetitiveIntelligenceService(redisClient);
  console.log('🏆 Competitive Intelligence Service initialized');
}

// Lazy initialization fallback
function getService() {
  if (!competitiveIntelligenceService) {
    try {
      const analyticsService = new AnalyticsService(redisManager.getClient());
      competitiveIntelligenceService = new CompetitiveIntelligenceService(redisManager.getClient());
    } catch (error) {
      console.error('Failed to initialize Competitive Intelligence Service:', error);
      throw new Error('Service not available');
    }
  }
  return competitiveIntelligenceService;
}

// Universal CORS headers middleware
router.use((req, res, next) => {
  // Universal platform compatibility headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Platform-Type');
  res.setHeader('X-API-Platform', 'universal');
  res.setHeader('X-Service-Type', 'competitive-intelligence');

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
// COMPETITIVE INTELLIGENCE ROUTES
// =============================================================================

/**
 * GET /api/v1/competitive-intelligence/overview
 * Get comprehensive competitive intelligence overview
 */
router.get(
  '/overview',
  [
    query('competitorIds').optional().isString().withMessage('Competitor IDs must be comma-separated string'),
    query('industries').optional().isString().withMessage('Industries must be comma-separated string'),
    query('sizes').optional().isString().withMessage('Company sizes must be comma-separated string'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  ],
  handleValidationErrors,
  authMiddleware,
  async (req: any, res: any) => {
    try {
      const service = getService();
      const {
        competitorIds,
        industries,
        sizes,
        limit = 10,
        offset = 0,
      } = req.query;

      // Parse filters
      const filters: any = {};
      if (competitorIds) filters.competitorIds = competitorIds.split(',');
      if (industries) filters.industries = industries.split(',');
      if (sizes) filters.sizes = sizes.split(',');

      const data = await service.getCompetitiveIntelligence(filters);

      // Apply pagination to competitors
      const paginatedCompetitors = data.competitors.slice(offset, offset + limit);

      // Calculate summary statistics
      const summary = {
        totalCompetitors: data.competitors.length,
        totalAlerts: data.alerts.length,
        activeThreats: data.competitors.filter(c => c.threatLevel === 'high').length,
        winRate: data.winLossRecords.length > 0
          ? (data.winLossRecords.filter(r => r.outcome === 'won').length / data.winLossRecords.length) * 100
          : 0,
        marketShareCoverage: data.marketShareData.reduce((sum, share) => sum + share.percentage, 0),
      };

      res.json({
        success: true,
        data: {
          ...data,
          competitors: paginatedCompetitors,
          summary,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: data.competitors.length,
            hasMore: offset + limit < data.competitors.length,
          },
        },
        timestamp: new Date().toISOString(),
        platform: 'universal',
      });
    } catch (error) {
      console.error('Error fetching competitive intelligence overview:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch competitive intelligence overview',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/v1/competitive-intelligence/competitors
 * Get detailed competitor information
 */
router.get(
  '/competitors',
  [
    query('competitorIds').optional().isString().withMessage('Competitor IDs must be comma-separated string'),
    query('industries').optional().isString().withMessage('Industries must be comma-separated string'),
    query('sizes').optional().isString().withMessage('Company sizes must be comma-separated string'),
    query('threatLevels').optional().isString().withMessage('Threat levels must be comma-separated string'),
    query('search').optional().isString().withMessage('Search term must be a string'),
    query('sortBy').optional().isIn(['name', 'marketShare', 'threatLevel', 'lastUpdate']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  ],
  handleValidationErrors,
  authMiddleware,
  async (req: any, res: any) => {
    try {
      const service = getService();
      const {
        competitorIds,
        industries,
        sizes,
        threatLevels,
        search,
        sortBy = 'name',
        sortOrder = 'asc',
        limit = 20,
        offset = 0,
      } = req.query;

      // Parse filters
      const filters: any = {};
      if (competitorIds) filters.competitorIds = competitorIds.split(',');
      if (industries) filters.industries = industries.split(',');
      if (sizes) filters.sizes = sizes.split(',');
      if (threatLevels) filters.threatLevels = threatLevels.split(',');

      const competitors = await service.getCompetitors(filters);

      // Apply search filter
      let filteredCompetitors = competitors;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredCompetitors = competitors.filter(competitor =>
          competitor.name.toLowerCase().includes(searchLower) ||
          competitor.description.toLowerCase().includes(searchLower) ||
          competitor.industries.some(industry => industry.toLowerCase().includes(searchLower))
        );
      }

      // Apply sorting
      filteredCompetitors.sort((a, b) => {
        let valueA: any, valueB: any;

        switch (sortBy) {
          case 'name':
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
            break;
          case 'marketShare':
            valueA = a.marketShare;
            valueB = b.marketShare;
            break;
          case 'threatLevel':
            const threatOrder = { 'low': 1, 'medium': 2, 'high': 3 };
            valueA = threatOrder[a.threatLevel as keyof typeof threatOrder];
            valueB = threatOrder[b.threatLevel as keyof typeof threatOrder];
            break;
          case 'lastUpdate':
            valueA = new Date(a.lastUpdate).getTime();
            valueB = new Date(b.lastUpdate).getTime();
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
      const paginatedCompetitors = filteredCompetitors.slice(offset, offset + limit);

      res.json({
        success: true,
        data: paginatedCompetitors,
        meta: {
          total: filteredCompetitors.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + limit < filteredCompetitors.length,
          sortBy,
          sortOrder,
          search: search || null,
        },
        timestamp: new Date().toISOString(),
        platform: 'universal',
      });
    } catch (error) {
      console.error('Error fetching competitors:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch competitors',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/v1/competitive-intelligence/alerts
 * Get competitive intelligence alerts
 */
router.get(
  '/alerts',
  [
    query('types').optional().isString().withMessage('Alert types must be comma-separated string'),
    query('competitorIds').optional().isString().withMessage('Competitor IDs must be comma-separated string'),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
    query('acknowledged').optional().isBoolean().withMessage('Acknowledged must be boolean'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601 date'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  ],
  handleValidationErrors,
  authMiddleware,
  async (req: any, res: any) => {
    try {
      const service = getService();
      const {
        types,
        competitorIds,
        severity,
        acknowledged,
        startDate,
        endDate,
        limit = 20,
        offset = 0,
      } = req.query;

      // Parse filters
      const filters: any = {};
      if (types) filters.types = types.split(',');
      if (competitorIds) filters.competitorIds = competitorIds.split(',');
      if (severity) filters.severity = severity;
      if (acknowledged !== undefined) filters.acknowledged = acknowledged === 'true';
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const alerts = await service.getCompetitiveAlerts(filters);

      // Apply date range filter
      let filteredAlerts = alerts;
      if (startDate || endDate) {
        filteredAlerts = alerts.filter(alert => {
          const alertDate = new Date(alert.timestamp);
          if (startDate && alertDate < new Date(startDate)) return false;
          if (endDate && alertDate > new Date(endDate)) return false;
          return true;
        });
      }

      // Apply pagination
      const paginatedAlerts = filteredAlerts.slice(offset, offset + limit);

      // Calculate alert statistics
      const stats = {
        total: filteredAlerts.length,
        bySeverity: {
          low: filteredAlerts.filter(a => a.severity === 'low').length,
          medium: filteredAlerts.filter(a => a.severity === 'medium').length,
          high: filteredAlerts.filter(a => a.severity === 'high').length,
          critical: filteredAlerts.filter(a => a.severity === 'critical').length,
        },
        byType: {
          'pricing-change': filteredAlerts.filter(a => a.type === 'pricing-change').length,
          'product-launch': filteredAlerts.filter(a => a.type === 'product-launch').length,
          'win-loss': filteredAlerts.filter(a => a.type === 'win-loss').length,
        },
        acknowledged: filteredAlerts.filter(a => a.acknowledged).length,
        unacknowledged: filteredAlerts.filter(a => !a.acknowledged).length,
      };

      res.json({
        success: true,
        data: paginatedAlerts,
        stats,
        meta: {
          total: filteredAlerts.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + limit < filteredAlerts.length,
        },
        timestamp: new Date().toISOString(),
        platform: 'universal',
      });
    } catch (error) {
      console.error('Error fetching competitive alerts:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch competitive alerts',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/v1/competitive-intelligence/battlecards
 * Get competitive battlecards
 */
router.get(
  '/battlecards',
  [
    query('competitorIds').optional().isString().withMessage('Competitor IDs must be comma-separated string'),
    query('scenarios').optional().isString().withMessage('Scenarios must be comma-separated string'),
    query('search').optional().isString().withMessage('Search term must be a string'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  ],
  handleValidationErrors,
  authMiddleware,
  async (req: any, res: any) => {
    try {
      const service = getService();
      const {
        competitorIds,
        scenarios,
        search,
        limit = 10,
        offset = 0,
      } = req.query;

      // Parse filters
      const filters: any = {};
      if (competitorIds) filters.competitorIds = competitorIds.split(',');
      if (scenarios) filters.scenarios = scenarios.split(',');

      const battlecards = await service.getBattlecards(filters);

      // Apply search filter
      let filteredBattlecards = battlecards;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredBattlecards = battlecards.filter(card =>
          card.competitorName.toLowerCase().includes(searchLower) ||
          card.strengths.some(strength => strength.toLowerCase().includes(searchLower)) ||
          card.weaknesses.some(weakness => weakness.toLowerCase().includes(searchLower)) ||
          card.keyMessages.some(message => message.toLowerCase().includes(searchLower))
        );
      }

      // Apply pagination
      const paginatedBattlecards = filteredBattlecards.slice(offset, offset + limit);

      res.json({
        success: true,
        data: paginatedBattlecards,
        meta: {
          total: filteredBattlecards.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + limit < filteredBattlecards.length,
          search: search || null,
        },
        timestamp: new Date().toISOString(),
        platform: 'universal',
      });
    } catch (error) {
      console.error('Error fetching battlecards:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch battlecards',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/v1/competitive-intelligence/health
 * Get service health status
 */
router.get('/health', async (req: any, res: any) => {
  try {
    const service = getService();

    // Basic health check
    const healthStatus = {
      status: 'healthy',
      service: 'competitive-intelligence',
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
      const testData = await service.getCompetitors({ limit: 1 });
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
