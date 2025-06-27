import express from 'express';
import { RevenueAttributionService } from '../services/revenue-attribution-service';

const router = express.Router();
let attributionService: RevenueAttributionService;

// Initialize service
const initializeService = async () => {
  if (!attributionService) {
    attributionService = new RevenueAttributionService();
    await attributionService.initialize();
  }
  return attributionService;
};

/**
 * Universal Revenue Attribution API Routes
 * Tracks and attributes revenue outcomes to predictions for ROI measurement
 * Compatible with all web platforms: React, Vue, Angular, WordPress, Shopify, etc.
 */

/**
 * @route POST /api/v1/attribution/record-revenue
 * @desc Record revenue outcome for attribution tracking
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.post('/record-revenue', async (req, res) => {
  try {
    const service = await initializeService();
    const { predictionId, leadData, originalScore, revenueOutcome, metadata } = req.body;

    // Validate required fields
    if (!predictionId || !leadData || originalScore === undefined || !revenueOutcome) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: predictionId, leadData, originalScore, revenueOutcome'
      });
    }

    const attributionRecord = await service.recordRevenueOutcome(
      predictionId,
      leadData,
      originalScore,
      revenueOutcome,
      metadata || {}
    );

    res.json({
      success: true,
      data: attributionRecord,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recording revenue outcome:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record revenue outcome',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/attribution/dashboard
 * @desc Get comprehensive attribution dashboard
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.get('/dashboard', async (req, res) => {
  try {
    const service = await initializeService();
    const filters = req.query;

    // Parse time range if provided
    let timeRange = undefined;
    if (filters.startDate && filters.endDate) {
      timeRange = {
        start: new Date(filters.startDate as string),
        end: new Date(filters.endDate as string)
      };
    }

    const attributionFilters = {
      timeRange,
      industry: filters.industry as string,
      campaign: filters.campaign as string,
      channel: filters.channel as string,
      modelType: filters.modelType as any
    };

    const dashboard = await service.getAttributionDashboard(attributionFilters);

    // Convert Maps to objects for JSON serialization
    const serializedDashboard = {
      ...dashboard,
      attributionBreakdown: {
        byModel: Object.fromEntries(dashboard.attributionBreakdown.byModel),
        byChannel: Object.fromEntries(dashboard.attributionBreakdown.byChannel),
        byIndustry: Object.fromEntries(dashboard.attributionBreakdown.byIndustry),
        byTimeframe: dashboard.attributionBreakdown.byTimeframe
      },
      touchpointAnalysis: {
        ...dashboard.touchpointAnalysis,
        effectiveness: Object.fromEntries(dashboard.touchpointAnalysis.effectiveness)
      }
    };

    res.json({
      success: true,
      data: serializedDashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting attribution dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get attribution dashboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/attribution/analyze
 * @desc Run attribution modeling analysis
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.post('/analyze', async (req, res) => {
  try {
    const service = await initializeService();
    const { modelType, options } = req.body;

    const analysisResult = await service.runAttributionAnalysis(
      modelType || 'multi-touch',
      options || {}
    );

    res.json({
      success: true,
      data: analysisResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running attribution analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run attribution analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/attribution/roi
 * @desc Get ROI metrics and calculations
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.get('/roi', async (req, res) => {
  try {
    const service = await initializeService();
    const { startDate, endDate } = req.query;

    let timeRange = undefined;
    if (startDate && endDate) {
      timeRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }

    const roiMetrics = await service.getROIMetrics(timeRange);

    res.json({
      success: true,
      data: roiMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting ROI metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ROI metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/attribution/status
 * @desc Get service status and health information
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.get('/status', async (req, res) => {
  try {
    const service = await initializeService();
    const api = service.getUniversalAPIInterface();
    const status = api.getStatus();

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/attribution/export
 * @desc Export attribution data in specified format
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.get('/export', async (req, res) => {
  try {
    const service = await initializeService();
    const api = service.getUniversalAPIInterface();
    const { format = 'json', ...filters } = req.query;

    // Parse filters similar to dashboard endpoint
    let timeRange = undefined;
    if (filters.startDate && filters.endDate) {
      timeRange = {
        start: new Date(filters.startDate as string),
        end: new Date(filters.endDate as string)
      };
    }

    const attributionFilters = {
      timeRange,
      industry: filters.industry as string,
      campaign: filters.campaign as string,
      channel: filters.channel as string,
      modelType: filters.modelType as any
    };

    const exportData = await api.exportData(format as 'json' | 'csv', attributionFilters);

    // Set appropriate content type and headers
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attribution-data-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(exportData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="attribution-data-${new Date().toISOString().split('T')[0]}.json"`);
      res.send(exportData);
    }
  } catch (error) {
    console.error('Error exporting attribution data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export attribution data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/attribution/health
 * @desc Health check endpoint for monitoring systems
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.get('/health', async (req, res) => {
  try {
    const service = await initializeService();
    const api = service.getUniversalAPIInterface();
    const status = api.getStatus();

    const healthCheck = {
      service: 'revenue-attribution',
      status: status.healthStatus,
      uptime: status.uptime,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      checks: {
        initialization: status.isInitialized,
        totalRecords: status.totalAttributionRecords,
        totalRevenue: status.totalRevenue,
        totalDeals: status.totalDeals,
        conversionRate: status.conversionRate
      }
    };

    // Return appropriate HTTP status based on health
    const httpStatus = status.healthStatus === 'healthy' ? 200 :
                      status.healthStatus === 'warning' ? 200 : 503;

    res.status(httpStatus).json(healthCheck);
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(503).json({
      service: 'revenue-attribution',
      status: 'critical',
      error: 'Service unhealthy',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/attribution/docs
 * @desc Get API documentation and usage examples
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.get('/docs', (req, res) => {
  const documentation = {
    title: 'Universal Revenue Attribution API',
    version: '1.0.0',
    description: 'Comprehensive revenue attribution and ROI tracking APIs compatible with all web platforms',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/attribution/record-revenue',
        description: 'Record revenue outcome for attribution tracking',
        body: {
          predictionId: 'string',
          leadData: 'LeadData object',
          originalScore: 'number',
          revenueOutcome: 'RevenueOutcome object',
          metadata: 'optional object'
        }
      },
      {
        method: 'GET',
        path: '/api/v1/attribution/dashboard',
        description: 'Get comprehensive attribution dashboard',
        query: {
          startDate: 'optional ISO date string',
          endDate: 'optional ISO date string',
          industry: 'optional string',
          campaign: 'optional string',
          channel: 'optional string',
          modelType: 'optional: first-touch|last-touch|linear|time-decay|multi-touch'
        }
      },
      {
        method: 'POST',
        path: '/api/v1/attribution/analyze',
        description: 'Run attribution modeling analysis',
        body: {
          modelType: 'optional: first-touch|last-touch|linear|time-decay|multi-touch',
          options: 'optional analysis options object'
        }
      },
      {
        method: 'GET',
        path: '/api/v1/attribution/roi',
        description: 'Get ROI metrics and calculations',
        query: {
          startDate: 'optional ISO date string',
          endDate: 'optional ISO date string'
        }
      },
      {
        method: 'GET',
        path: '/api/v1/attribution/status',
        description: 'Get service status and health information'
      },
      {
        method: 'GET',
        path: '/api/v1/attribution/export',
        description: 'Export attribution data in specified format',
        query: {
          format: 'json|csv (default: json)',
          startDate: 'optional ISO date string',
          endDate: 'optional ISO date string',
          industry: 'optional string',
          campaign: 'optional string',
          channel: 'optional string'
        }
      },
      {
        method: 'GET',
        path: '/api/v1/attribution/health',
        description: 'Health check endpoint for monitoring systems'
      }
    ],
    platformCompatibility: [
      'React (via fetch, axios, or any HTTP client)',
      'Vue.js (via axios, fetch, or HTTP libraries)',
      'Angular (via HttpClient)',
      'WordPress (via wp.ajax, fetch, or jQuery)',
      'Shopify (via fetch or third-party libraries)',
      'Node.js (via any HTTP client library)',
      'PHP (via cURL, Guzzle, or file_get_contents)',
      'Python (via requests, urllib, or HTTP libraries)',
      'Any platform with HTTP request capabilities'
    ],
    examples: {
      javascript: {
        recordRevenue: `
// Record revenue outcome
const response = await fetch('/api/v1/attribution/record-revenue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    predictionId: 'pred_123',
    leadData: {...}, // Your lead data
    originalScore: 85,
    revenueOutcome: {
      dealClosed: true,
      dealSize: 50000,
      closedDate: new Date(),
      acquisitionCost: 5000,
      timeToClose: 45
    },
    metadata: {
      campaign: 'Q4-2024',
      channel: 'organic'
    }
  })
});
const result = await response.json();`,
        getDashboard: `
// Get attribution dashboard
const response = await fetch('/api/v1/attribution/dashboard?industry=saas&startDate=2024-01-01');
const dashboard = await response.json();`,
        getROI: `
// Get ROI metrics
const response = await fetch('/api/v1/attribution/roi?startDate=2024-01-01&endDate=2024-12-31');
const roi = await response.json();`,
        checkHealth: `
// Health check
const response = await fetch('/api/v1/attribution/health');
const health = await response.json();`
      },
      wordpress: {
        recordRevenue: `
// WordPress example using wp.ajax
wp.ajax.post('record_revenue_attribution', {
  predictionId: 'pred_123',
  leadData: {...},
  originalScore: 85,
  revenueOutcome: {
    dealClosed: true,
    dealSize: 50000
  }
}).done(function(response) {
  console.log('Revenue recorded:', response);
});`,
        getDashboard: `
// WordPress dashboard fetch
jQuery.get('/api/v1/attribution/dashboard', {
  industry: 'ecommerce',
  startDate: '2024-01-01'
}).done(function(data) {
  console.log('Attribution dashboard:', data);
});`
      },
      shopify: {
        recordRevenue: `
// Shopify Liquid + JavaScript
fetch('/api/v1/attribution/record-revenue', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': '{{ shop.api_key }}'
  },
  body: JSON.stringify({
    predictionId: '{{ prediction_id }}',
    leadData: {{ lead_data | json }},
    originalScore: {{ score }},
    revenueOutcome: {
      dealClosed: {{ order.financial_status == 'paid' }},
      dealSize: {{ order.total_price | money_without_currency }},
      closedDate: '{{ order.created_at | date: "%Y-%m-%dT%H:%M:%S" }}'
    }
  })
});`
      }
    },
    dataStructures: {
      RevenueOutcome: {
        dealClosed: 'boolean - Whether the deal was closed/won',
        dealSize: 'number - Total deal value in currency',
        closedDate: 'Date - When the deal was closed',
        acquisitionCost: 'number - Cost to acquire this customer',
        timeToClose: 'number - Days from first touch to close',
        ltv: 'number - Customer lifetime value',
        churnDate: 'Date - When customer churned (if applicable)'
      },
      RevenueMetadata: {
        channel: 'string - Marketing channel (organic, paid, social, etc.)',
        campaign: 'string - Campaign identifier',
        source: 'string - Traffic source',
        medium: 'string - Marketing medium',
        userId: 'string - User identifier',
        accountId: 'string - Account identifier'
      }
    }
  };

  res.json(documentation);
});

export default router;
