import express from 'express';
import { AccuracyTrackingService } from '../services/accuracy-tracking-service';

const router = express.Router();
let accuracyService: AccuracyTrackingService;

// Initialize service
const initializeService = async () => {
  if (!accuracyService) {
    accuracyService = new AccuracyTrackingService();
    await accuracyService.initialize();
  }
  return accuracyService;
};

/**
 * Universal Accuracy Tracking API Routes
 * Provides comprehensive ML model monitoring and validation endpoints
 * Compatible with all web platforms: React, Vue, Angular, WordPress, Shopify, etc.
 */

/**
 * @route POST /api/v1/accuracy/record-outcome
 * @desc Record actual outcome for a prediction to track accuracy
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.post('/record-outcome', async (req, res) => {
  try {
    const service = await initializeService();
    const { predictionId, leadData, predictedScore, actualOutcome, metadata } =
      req.body;

    // Validate required fields
    if (
      !predictionId ||
      !leadData ||
      predictedScore === undefined ||
      !actualOutcome
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required fields: predictionId, leadData, predictedScore, actualOutcome',
      });
    }

    const accuracyRecord = await service.recordPredictionOutcome(
      predictionId,
      leadData,
      predictedScore,
      actualOutcome,
      metadata || {}
    );

    res.json({
      success: true,
      data: accuracyRecord,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error recording prediction outcome:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record prediction outcome',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/v1/accuracy/dashboard
 * @desc Get comprehensive accuracy dashboard data
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
        end: new Date(filters.endDate as string),
      };
    }

    const dashboardFilters = {
      timeRange,
      industry: filters.industry as string,
      modelVersion: filters.modelVersion as string,
      confidenceRange:
        filters.minConfidence && filters.maxConfidence
          ? {
              min: parseFloat(filters.minConfidence as string),
              max: parseFloat(filters.maxConfidence as string),
            }
          : undefined,
    };

    const dashboard = await service.getAccuracyDashboard(dashboardFilters);

    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting accuracy dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get accuracy dashboard',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route POST /api/v1/accuracy/validate
 * @desc Run model validation pipeline
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.post('/validate', async (req, res) => {
  try {
    const service = await initializeService();
    const { validationType, options } = req.body;

    const validationResult = await service.runValidationPipeline(
      validationType || 'comprehensive',
      options || {}
    );

    res.json({
      success: true,
      data: validationResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error running validation pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run validation pipeline',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/v1/accuracy/drift-analysis
 * @desc Get drift detection analysis and alerts
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.get('/drift-analysis', async (req, res) => {
  try {
    const service = await initializeService();
    const { startDate, endDate } = req.query;

    let timeRange = undefined;
    if (startDate && endDate) {
      timeRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };
    }

    const driftAnalysis = await service.getDriftDetectionAnalysis(timeRange);

    res.json({
      success: true,
      data: driftAnalysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting drift analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get drift analysis',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/v1/accuracy/performance-metrics
 * @desc Get real-time performance metrics
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.get('/performance-metrics', async (req, res) => {
  try {
    const service = await initializeService();
    const { startDate, endDate } = req.query;

    let timeRange = undefined;
    if (startDate && endDate) {
      timeRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };
    }

    const performanceMetrics = await service.getPerformanceMetrics(timeRange);

    // Convert Map to object for JSON serialization
    const serializedMetrics = {
      ...performanceMetrics,
      industrySpecific: Object.fromEntries(performanceMetrics.industrySpecific),
    };

    res.json({
      success: true,
      data: serializedMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/v1/accuracy/status
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/v1/accuracy/alerts
 * @desc Get active alerts and warnings
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.get('/alerts', async (req, res) => {
  try {
    const service = await initializeService();
    const api = service.getUniversalAPIInterface();
    const alerts = api.getAlerts();

    res.json({
      success: true,
      data: alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route POST /api/v1/accuracy/alerts/:alertId/acknowledge
 * @desc Acknowledge a specific alert
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.post('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const service = await initializeService();
    const api = service.getUniversalAPIInterface();
    const { alertId } = req.params;

    const acknowledged = await api.acknowledgeAlert(alertId);

    if (acknowledged) {
      res.json({
        success: true,
        message: 'Alert acknowledged successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert not found or already acknowledged',
      });
    }
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/v1/accuracy/export
 * @desc Export accuracy data in specified format
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
        end: new Date(filters.endDate as string),
      };
    }

    const dashboardFilters = {
      timeRange,
      industry: filters.industry as string,
      modelVersion: filters.modelVersion as string,
      confidenceRange:
        filters.minConfidence && filters.maxConfidence
          ? {
              min: parseFloat(filters.minConfidence as string),
              max: parseFloat(filters.maxConfidence as string),
            }
          : undefined,
    };

    const exportData = await api.exportData(
      format as 'json' | 'csv',
      dashboardFilters
    );

    // Set appropriate content type and headers
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="accuracy-data-${new Date().toISOString().split('T')[0]}.csv"`
      );
      res.send(exportData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="accuracy-data-${new Date().toISOString().split('T')[0]}.json"`
      );
      res.send(exportData);
    }
  } catch (error) {
    console.error('Error exporting accuracy data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export accuracy data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/v1/accuracy/health
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
      service: 'accuracy-tracking',
      status: status.healthStatus,
      uptime: status.uptime,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      checks: {
        initialization: status.isInitialized,
        modelVersion: status.modelVersion,
        totalPredictions: status.totalPredictions,
        overallAccuracy: status.overallAccuracy,
        activeDriftAlerts: status.activeDriftAlerts,
      },
    };

    // Return appropriate HTTP status based on health
    const httpStatus =
      status.healthStatus === 'healthy'
        ? 200
        : status.healthStatus === 'warning'
          ? 200
          : 503;

    res.status(httpStatus).json(healthCheck);
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(503).json({
      service: 'accuracy-tracking',
      status: 'critical',
      error: 'Service unhealthy',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/v1/accuracy/docs
 * @desc Get API documentation and usage examples
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.get('/docs', (req, res) => {
  const documentation = {
    title: 'Universal Accuracy Tracking API',
    version: '1.0.0',
    description:
      'Comprehensive ML model monitoring and validation APIs compatible with all web platforms',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/accuracy/record-outcome',
        description: 'Record actual outcome for a prediction to track accuracy',
        body: {
          predictionId: 'string',
          leadData: 'LeadData object',
          predictedScore: 'number',
          actualOutcome: 'ActualOutcome object',
          metadata: 'optional object',
        },
      },
      {
        method: 'GET',
        path: '/api/v1/accuracy/dashboard',
        description: 'Get comprehensive accuracy dashboard data',
        query: {
          startDate: 'optional ISO date string',
          endDate: 'optional ISO date string',
          industry: 'optional string',
          modelVersion: 'optional string',
          minConfidence: 'optional number',
          maxConfidence: 'optional number',
        },
      },
      {
        method: 'POST',
        path: '/api/v1/accuracy/validate',
        description: 'Run model validation pipeline',
        body: {
          validationType: 'optional: comprehensive|accuracy|performance|drift',
          options: 'optional ValidationOptions object',
        },
      },
      {
        method: 'GET',
        path: '/api/v1/accuracy/drift-analysis',
        description: 'Get drift detection analysis and alerts',
        query: {
          startDate: 'optional ISO date string',
          endDate: 'optional ISO date string',
        },
      },
      {
        method: 'GET',
        path: '/api/v1/accuracy/performance-metrics',
        description: 'Get real-time performance metrics',
        query: {
          startDate: 'optional ISO date string',
          endDate: 'optional ISO date string',
        },
      },
      {
        method: 'GET',
        path: '/api/v1/accuracy/status',
        description: 'Get service status and health information',
      },
      {
        method: 'GET',
        path: '/api/v1/accuracy/alerts',
        description: 'Get active alerts and warnings',
      },
      {
        method: 'POST',
        path: '/api/v1/accuracy/alerts/:alertId/acknowledge',
        description: 'Acknowledge a specific alert',
      },
      {
        method: 'GET',
        path: '/api/v1/accuracy/export',
        description: 'Export accuracy data in specified format',
        query: {
          format: 'json|csv (default: json)',
          startDate: 'optional ISO date string',
          endDate: 'optional ISO date string',
          industry: 'optional string',
          modelVersion: 'optional string',
        },
      },
      {
        method: 'GET',
        path: '/api/v1/accuracy/health',
        description: 'Health check endpoint for monitoring systems',
      },
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
      'Any platform with HTTP request capabilities',
    ],
    examples: {
      javascript: {
        recordOutcome: `
// Record prediction outcome
const response = await fetch('/api/v1/accuracy/record-outcome', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    predictionId: 'pred_123',
    leadData: {...}, // Your lead data
    predictedScore: 85,
    actualOutcome: {
      converted: true,
      dealSize: 50000,
      timeToClose: 45
    }
  })
});
const result = await response.json();`,
        getDashboard: `
// Get accuracy dashboard
const response = await fetch('/api/v1/accuracy/dashboard?industry=saas&startDate=2024-01-01');
const dashboard = await response.json();`,
        checkHealth: `
// Health check
const response = await fetch('/api/v1/accuracy/health');
const health = await response.json();`,
      },
    },
  };

  res.json(documentation);
});

export default router;
