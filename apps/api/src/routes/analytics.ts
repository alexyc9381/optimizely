import { Request, Response, Router } from 'express';
import { Redis } from 'ioredis';
import AnalyticsService from '../services/analytics-service';

const router = Router();

// Initialize analytics service with Redis client
let analyticsService: AnalyticsService;
let redisClient: Redis;

// Initialize service (called by main app)
export const initializeAnalyticsService = (redis: Redis) => {
  redisClient = redis;
  analyticsService = new AnalyticsService(redis);
};

/**
 * @swagger
 * /api/v1/analytics/executive-summary:
 *   get:
 *     summary: Get executive dashboard summary
 *     description: Retrieve high-level metrics and insights for executive dashboard
 *     parameters:
 *       - in: query
 *         name: dateStart
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (ISO string)
 *       - in: query
 *         name: dateEnd
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (ISO string)
 *       - in: query
 *         name: testStatus
 *         schema:
 *           type: string
 *         description: Comma-separated test statuses to filter by
 *       - in: query
 *         name: revenueThreshold
 *         schema:
 *           type: number
 *         description: Minimum revenue threshold for filtering tests
 *     responses:
 *       200:
 *         description: Executive summary data
 *       500:
 *         description: Server error
 */
router.get('/executive-summary', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    // Parse date range
    if (req.query.dateStart && req.query.dateEnd) {
      filters.dateRange = {
        start: new Date(req.query.dateStart as string),
        end: new Date(req.query.dateEnd as string)
      };
    }

    // Parse test status filter
    if (req.query.testStatus) {
      filters.testStatus = (req.query.testStatus as string).split(',');
    }

    // Parse revenue threshold
    if (req.query.revenueThreshold) {
      filters.revenueThreshold = parseFloat(req.query.revenueThreshold as string);
    }

    // Parse significance threshold
    if (req.query.significanceThreshold) {
      filters.significanceThreshold = parseFloat(req.query.significanceThreshold as string);
    }

    const summary = await analyticsService.getExecutiveSummary(filters);

    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting executive summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve executive summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/tests:
 *   get:
 *     summary: Get list of all tests with metrics
 *     description: Retrieve comprehensive list of A/B tests with their metrics
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by test status (active, completed, paused, draft)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of tests to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of tests to skip for pagination
 *     responses:
 *       200:
 *         description: List of tests with metrics
 *       500:
 *         description: Server error
 */
router.get('/tests', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    // Parse filters
    if (req.query.status) {
      filters.testStatus = [req.query.status as string];
    }

    if (req.query.dateStart && req.query.dateEnd) {
      filters.dateRange = {
        start: new Date(req.query.dateStart as string),
        end: new Date(req.query.dateEnd as string)
      };
    }

    const tests = await analyticsService.getTestList(filters);

    // Apply pagination
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const paginatedTests = tests.slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginatedTests,
      pagination: {
        total: tests.length,
        limit,
        offset,
        hasMore: offset + limit < tests.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting test list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve test list',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/tests/{testId}:
 *   get:
 *     summary: Get detailed metrics for specific test
 *     description: Retrieve comprehensive metrics and analytics for a single A/B test
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier for the test
 *     responses:
 *       200:
 *         description: Detailed test metrics
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error
 */
router.get('/tests/:testId', async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const testMetrics = await analyticsService.getTestMetrics(testId);

    if (!testMetrics) {
      return res.status(404).json({
        success: false,
        error: 'Test not found',
        testId
      });
    }

    res.json({
      success: true,
      data: testMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting test metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve test metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/real-time:
 *   get:
 *     summary: Get real-time dashboard metrics
 *     description: Retrieve current real-time metrics for active tests and overall performance
 *     responses:
 *       200:
 *         description: Real-time metrics data
 *       500:
 *         description: Server error
 */
router.get('/real-time', async (req: Request, res: Response) => {
  try {
    const realTimeMetrics = await analyticsService.getRealTimeMetrics();

    res.json({
      success: true,
      data: realTimeMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting real-time metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve real-time metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/psychographic-insights:
 *   get:
 *     summary: Get psychographic performance insights
 *     description: Retrieve insights about psychographic segment performance across tests
 *     parameters:
 *       - in: query
 *         name: profiles
 *         schema:
 *           type: string
 *         description: Comma-separated psychographic profiles to filter by
 *     responses:
 *       200:
 *         description: Psychographic insights data
 *       500:
 *         description: Server error
 */
router.get('/psychographic-insights', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.profiles) {
      filters.psychographicProfiles = (req.query.profiles as string).split(',');
    }

    if (req.query.dateStart && req.query.dateEnd) {
      filters.dateRange = {
        start: new Date(req.query.dateStart as string),
        end: new Date(req.query.dateEnd as string)
      };
    }

    const insights = await analyticsService.getPsychographicInsights(filters);

    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting psychographic insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve psychographic insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/revenue-attribution:
 *   get:
 *     summary: Get revenue attribution analysis
 *     description: Retrieve revenue attribution metrics for tests
 *     parameters:
 *       - in: query
 *         name: testId
 *         schema:
 *           type: string
 *         description: Specific test ID for attribution analysis
 *     responses:
 *       200:
 *         description: Revenue attribution data
 *       500:
 *         description: Server error
 */
router.get('/revenue-attribution', async (req: Request, res: Response) => {
  try {
    const testId = req.query.testId as string;
    const revenueMetrics = await analyticsService.getRevenueAttribution(testId);

    res.json({
      success: true,
      data: revenueMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting revenue attribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve revenue attribution',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/alerts:
 *   get:
 *     summary: Get active alerts
 *     description: Retrieve list of active alerts and notifications
 *     responses:
 *       200:
 *         description: List of active alerts
 *       500:
 *         description: Server error
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const realTimeData = await analyticsService.getRealTimeMetrics();

    res.json({
      success: true,
      data: {
        alerts: realTimeData.alerts,
        totalCount: realTimeData.alerts.length,
        unacknowledged: realTimeData.alerts.filter(a => !a.acknowledged).length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/alerts/{alertId}/acknowledge:
 *   post:
 *     summary: Acknowledge an alert
 *     description: Mark a specific alert as acknowledged
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier for the alert
 *     responses:
 *       200:
 *         description: Alert acknowledged successfully
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Server error
 */
router.post('/alerts/:alertId/acknowledge', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    await analyticsService.acknowledgeAlert(alertId);

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      alertId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/dashboard-data:
 *   get:
 *     summary: Get comprehensive dashboard data
 *     description: Retrieve all necessary data for the main analytics dashboard in a single request
 *     parameters:
 *       - in: query
 *         name: dateStart
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: dateEnd
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Comprehensive dashboard data
 *       500:
 *         description: Server error
 */
router.get('/dashboard-data', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.dateStart && req.query.dateEnd) {
      filters.dateRange = {
        start: new Date(req.query.dateStart as string),
        end: new Date(req.query.dateEnd as string)
      };
    }

    // Get all dashboard data in parallel for better performance
    const [
      executiveSummary,
      realTimeMetrics,
      psychographicInsights,
      revenueAttribution
    ] = await Promise.all([
      analyticsService.getExecutiveSummary(filters),
      analyticsService.getRealTimeMetrics(),
      analyticsService.getPsychographicInsights(filters),
      analyticsService.getRevenueAttribution()
    ]);

    res.json({
      success: true,
      data: {
        executive: executiveSummary,
        realTime: realTimeMetrics,
        psychographic: psychographicInsights,
        revenue: revenueAttribution
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/export:
 *   get:
 *     summary: Export analytics data
 *     description: Export analytics data in various formats (CSV, JSON, Excel)
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json, excel]
 *         description: Export format
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [tests, insights, revenue]
 *         description: Type of data to export
 *       - in: query
 *         name: dateStart
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for data export
 *       - in: query
 *         name: dateEnd
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for data export
 *     responses:
 *       200:
 *         description: Exported data file
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const format = req.query.format as string || 'json';
    const exportType = req.query.type as string || 'tests';

    const filters: any = {};
    if (req.query.dateStart && req.query.dateEnd) {
      filters.dateRange = {
        start: new Date(req.query.dateStart as string),
        end: new Date(req.query.dateEnd as string)
      };
    }

    let data: any;
    let filename: string;

    switch (exportType) {
      case 'tests':
        data = await analyticsService.getTestList(filters);
        filename = `test-analytics-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'insights':
        data = await analyticsService.getPsychographicInsights(filters);
        filename = `psychographic-insights-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'revenue':
        data = await analyticsService.getRevenueAttribution();
        filename = `revenue-attribution-${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid export type',
          validTypes: ['tests', 'insights', 'revenue']
        });
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json({
        success: true,
        data,
        exportedAt: new Date().toISOString(),
        type: exportType
      });
    } else if (format === 'csv') {
      // Basic CSV export implementation
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);

      const csvData = convertToCSV(data);
      res.send(csvData);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Unsupported format',
        supportedFormats: ['json', 'csv']
      });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/status:
 *   get:
 *     summary: Get analytics service status
 *     description: Retrieve current status and health of the analytics service
 *     responses:
 *       200:
 *         description: Service status information
 *       500:
 *         description: Server error
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = analyticsService.getServiceStatus();

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve service status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/cache/clear:
 *   post:
 *     summary: Clear analytics cache
 *     description: Clear all cached analytics data to force fresh data retrieval
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *       500:
 *         description: Server error
 */
router.post('/cache/clear', async (req: Request, res: Response) => {
  try {
    analyticsService.clearCache();

    res.json({
      success: true,
      message: 'Analytics cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Server-Sent Events endpoint for real-time updates
router.get('/events', (req: Request, res: Response) => {
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date() })}\n\n`);

  // Set up real-time event listeners
  const handleMetricsUpdate = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'metrics_update', data })}\n\n`);
  };

  const handleNewAlert = (alert: any) => {
    res.write(`data: ${JSON.stringify({ type: 'new_alert', data: alert })}\n\n`);
  };

  const handleAlertAcknowledged = (alert: any) => {
    res.write(`data: ${JSON.stringify({ type: 'alert_acknowledged', data: alert })}\n\n`);
  };

  // Subscribe to analytics service events
  analyticsService.on('real_time_update', handleMetricsUpdate);
  analyticsService.on('new_alert', handleNewAlert);
  analyticsService.on('alert_acknowledged', handleAlertAcknowledged);

  // Send periodic heartbeat
  const heartbeatInterval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date() })}\n\n`);
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    analyticsService.removeListener('real_time_update', handleMetricsUpdate);
    analyticsService.removeListener('new_alert', handleNewAlert);
    analyticsService.removeListener('alert_acknowledged', handleAlertAcknowledged);
  });
});

// Helper function to convert data to CSV format
function convertToCSV(data: any[]): string {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export { initializeAnalyticsService };
export default router;
