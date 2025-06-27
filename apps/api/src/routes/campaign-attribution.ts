import express, { Request, Response } from 'express';
import { query, body, validationResult } from 'express-validator';
import { CampaignAttributionService } from '../services/campaign-attribution-service';
import { redisManager } from '../services/redis-client';

const router = express.Router();

// Service initialization
let campaignAttributionService: CampaignAttributionService;

// Initialize service
export function initializeCampaignAttributionService(redisClient: any) {
  campaignAttributionService = new CampaignAttributionService(redisClient);
  console.log('📊 Campaign Attribution Service initialized');
}

// Lazy initialization fallback
function getService() {
  if (!campaignAttributionService) {
    try {
      campaignAttributionService = new CampaignAttributionService(redisManager.getClient());
    } catch (error) {
      console.error('Failed to initialize Campaign Attribution Service:', error);
      throw new Error('Service not available');
    }
  }
  return campaignAttributionService;
}

// Universal CORS headers middleware
router.use((req, res, next) => {
  // Universal platform compatibility headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Platform-Type');
  res.setHeader('X-API-Platform', 'universal');
  res.setHeader('X-Service-Type', 'campaign-attribution');

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
// CAMPAIGN ATTRIBUTION ROUTES
// =============================================================================

/**
 * GET /api/v1/campaign-attribution/overview
 * Get comprehensive campaign attribution overview
 */
router.get(
  '/overview',
  [
    query('campaignIds').optional().isString().withMessage('Campaign IDs must be comma-separated string'),
    query('channelIds').optional().isString().withMessage('Channel IDs must be comma-separated string'),
    query('attributionModels').optional().isString().withMessage('Attribution models must be comma-separated string'),
    query('conversionTypes').optional().isString().withMessage('Conversion types must be comma-separated string'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601 date'),
    query('minConversionValue').optional().isFloat({ min: 0 }).withMessage('Min conversion value must be non-negative'),
    query('maxConversionValue').optional().isFloat({ min: 0 }).withMessage('Max conversion value must be non-negative'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  ],
  handleValidationErrors,
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const service = getService();
      const {
        campaignIds,
        channelIds,
        attributionModels,
        conversionTypes,
        startDate,
        endDate,
        minConversionValue,
        maxConversionValue,
        limit = 10,
        offset = 0,
      } = req.query;

      // Parse filters
      const filters: any = {};
      if (campaignIds) filters.campaignIds = (campaignIds as string).split(',');
      if (channelIds) filters.channelIds = (channelIds as string).split(',');
      if (attributionModels) filters.attributionModels = (attributionModels as string).split(',');
      if (conversionTypes) filters.conversionTypes = (conversionTypes as string).split(',');
      if (startDate && endDate) {
        filters.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }
      if (minConversionValue) filters.minConversionValue = parseFloat(minConversionValue as string);
      if (maxConversionValue) filters.maxConversionValue = parseFloat(maxConversionValue as string);

      const data = await service.getCampaignAttributionData(filters);

      // Apply pagination to campaigns
      const paginatedCampaigns = data.campaigns.slice(Number(offset), Number(offset) + Number(limit));

      // Calculate summary statistics
      const summary = {
        totalCampaigns: data.campaigns.length,
        activeCampaigns: data.campaigns.filter(c => c.status === 'active').length,
        totalChannels: data.channels.length,
        activeChannels: data.channels.filter(c => c.isActive).length,
        totalConversions: data.conversions.length,
        totalConversionValue: data.conversions.reduce((sum, conv) => sum + conv.conversionValue, 0),
        averageConversionValue: data.conversions.length > 0 
          ? data.conversions.reduce((sum, conv) => sum + conv.conversionValue, 0) / data.conversions.length 
          : 0,
        totalROI: data.roiAnalysis.totalROI,
        totalInvestment: data.roiAnalysis.totalInvestment,
        totalRevenue: data.roiAnalysis.totalRevenue,
        paybackPeriod: data.roiAnalysis.paybackPeriod,
        overallConversionRate: data.conversionFunnel.overallConversionRate,
      };

      res.json({
        success: true,
        data: {
          ...data,
          campaigns: paginatedCampaigns,
          summary,
          pagination: {
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            total: data.campaigns.length,
            hasMore: Number(offset) + Number(limit) < data.campaigns.length,
          },
        },
        timestamp: new Date().toISOString(),
        platform: 'universal',
      });
    } catch (error) {
      console.error('Error fetching campaign attribution overview:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch campaign attribution overview',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/v1/campaign-attribution/campaigns
 * Get detailed campaign information and performance
 */
router.get(
  '/campaigns',
  [
    query('campaignIds').optional().isString().withMessage('Campaign IDs must be comma-separated string'),
    query('channelIds').optional().isString().withMessage('Channel IDs must be comma-separated string'),
    query('status').optional().isIn(['active', 'paused', 'completed', 'draft']).withMessage('Invalid campaign status'),
    query('campaignType').optional().isString().withMessage('Campaign type must be a string'),
    query('search').optional().isString().withMessage('Search term must be a string'),
    query('sortBy').optional().isIn(['name', 'budget', 'spendToDate', 'roas', 'conversions', 'lastUpdated']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
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
        campaignIds,
        channelIds,
        status,
        campaignType,
        search,
        sortBy = 'name',
        sortOrder = 'asc',
        startDate,
        endDate,
        limit = 20,
        offset = 0,
      } = req.query;

      // Parse filters
      const filters: any = {};
      if (campaignIds) filters.campaignIds = (campaignIds as string).split(',');
      if (channelIds) filters.channelIds = (channelIds as string).split(',');
      if (startDate && endDate) {
        filters.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }

      const campaigns = await service.getCampaigns(filters);
      const campaignPerformance = await service.getCampaignPerformance(filters);

      // Merge campaign data with performance metrics
      const enrichedCampaigns = campaigns.map(campaign => {
        const performance = campaignPerformance.find(p => p.campaignId === campaign.id);
        return {
          ...campaign,
          performance: performance?.metrics || null,
          attributedMetrics: performance?.attributedMetrics || null,
          trends: performance?.trends || null,
        };
      });

      // Apply additional filters
      let filteredCampaigns = enrichedCampaigns;
      
      if (status) {
        filteredCampaigns = filteredCampaigns.filter(campaign => campaign.status === status);
      }

      if (campaignType) {
        filteredCampaigns = filteredCampaigns.filter(campaign => 
          campaign.campaignType === campaignType
        );
      }

      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredCampaigns = filteredCampaigns.filter(campaign =>
          campaign.name.toLowerCase().includes(searchLower) ||
          campaign.description.toLowerCase().includes(searchLower) ||
          campaign.channelName.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      filteredCampaigns.sort((a, b) => {
        let valueA: any, valueB: any;

        switch (sortBy) {
          case 'name':
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
            break;
          case 'budget':
            valueA = a.budget;
            valueB = b.budget;
            break;
          case 'spendToDate':
            valueA = a.spendToDate;
            valueB = b.spendToDate;
            break;
          case 'roas':
            valueA = a.performance?.roas || 0;
            valueB = b.performance?.roas || 0;
            break;
          case 'conversions':
            valueA = a.performance?.conversions || 0;
            valueB = b.performance?.conversions || 0;
            break;
          case 'lastUpdated':
            valueA = new Date(a.lastUpdated).getTime();
            valueB = new Date(b.lastUpdated).getTime();
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
      const paginatedCampaigns = filteredCampaigns.slice(Number(offset), Number(offset) + Number(limit));

      // Calculate aggregate metrics
      const aggregateMetrics = {
        totalCampaigns: filteredCampaigns.length,
        activeCampaigns: filteredCampaigns.filter(c => c.status === 'active').length,
        totalBudget: filteredCampaigns.reduce((sum, c) => sum + c.budget, 0),
        totalSpend: filteredCampaigns.reduce((sum, c) => sum + c.spendToDate, 0),
        totalConversions: filteredCampaigns.reduce((sum, c) => sum + (c.performance?.conversions || 0), 0),
        totalRevenue: filteredCampaigns.reduce((sum, c) => sum + (c.performance?.conversionValue || 0), 0),
        averageROAS: filteredCampaigns.length > 0 
          ? filteredCampaigns.reduce((sum, c) => sum + (c.performance?.roas || 0), 0) / filteredCampaigns.length 
          : 0,
      };

      res.json({
        success: true,
        data: paginatedCampaigns,
        aggregateMetrics,
        meta: {
          total: filteredCampaigns.length,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: Number(offset) + Number(limit) < filteredCampaigns.length,
          sortBy,
          sortOrder,
          search: search || null,
        },
        timestamp: new Date().toISOString(),
        platform: 'universal',
      });
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch campaigns',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/v1/campaign-attribution/health
 * Get service health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const service = getService();

    // Basic health check
    const healthStatus = {
      status: 'healthy',
      service: 'campaign-attribution',
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
      const testData = await service.getCampaigns({ limit: 1 });
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
