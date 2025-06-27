/**
 * Statistical Monitoring API Routes
 *
 * Provides REST endpoints for:
 * - Starting/stopping statistical monitoring
 * - Real-time test analysis
 * - Alert management
 * - Configuration management
 * - Performance analytics
 *
 * Universal Platform Integration: Supports all web platforms
 */

import { Request, Response, Router } from 'express';
import StatisticalMonitoringService, {
    MonitoringAlert,
    StatisticalConfig,
    TestMetrics
} from '../services/statistical-monitoring-service';

const router = Router();

// Service instance with default configuration
const statisticalService = new StatisticalMonitoringService();

// Store connected SSE clients for real-time updates
const sseClients = new Set<Response>();

// Set up event listeners for real-time notifications
statisticalService.on('analysis_complete', (data) => {
  broadcast('analysis_complete', data);
});

statisticalService.on('alert', (alert: MonitoringAlert) => {
  broadcast('alert', alert);
});

statisticalService.on('monitoring_started', (data) => {
  broadcast('monitoring_started', data);
});

statisticalService.on('monitoring_stopped', (data) => {
  broadcast('monitoring_stopped', data);
});

function broadcast(event: string, data: any) {
  const message = `data: ${JSON.stringify({ event, data })}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      sseClients.delete(client);
    }
  });
}

/**
 * @route POST /api/statistical-monitoring/start
 * @description Start monitoring a test for statistical significance
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const testMetrics: TestMetrics = req.body;

    // Validation
    if (!testMetrics.testId || !testMetrics.variations || testMetrics.variations.length < 2) {
      return res.status(400).json({
        error: 'Invalid test metrics',
        message: 'testId and at least 2 variations are required'
      });
    }

    // Validate each variation
    for (const variation of testMetrics.variations) {
      if (!variation._variationId || typeof variation.visitors !== 'number' || typeof variation.conversions !== 'number') {
        return res.status(400).json({
          error: 'Invalid variation data',
          message: 'Each variation must have variationId, visitors, and conversions'
        });
      }
    }

    // Calculate derived fields
    testMetrics.totalVisitors = testMetrics.variations.reduce((sum, v) => sum + v.visitors, 0);
    testMetrics.totalConversions = testMetrics.variations.reduce((sum, v) => sum + v.conversions, 0);
    testMetrics.overallConversionRate = testMetrics.totalVisitors > 0 ?
      testMetrics.totalConversions / testMetrics.totalVisitors : 0;

    // Ensure dates are properly formatted
    testMetrics.startTime = new Date(testMetrics.startTime);
    testMetrics.lastUpdated = new Date();

    // Calculate conversion rates for each variation
    testMetrics.variations.forEach(variation => {
      variation.conversionRate = variation.visitors > 0 ? variation.conversions / variation.visitors : 0;
    });

    statisticalService.startMonitoring(testMetrics);

    res.json({
      success: true,
      message: `Statistical monitoring started for test ${testMetrics.testId}`,
      testId: testMetrics.testId,
      monitoringInterval: statisticalService.getConfiguration().monitoringInterval
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to start monitoring',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/statistical-monitoring/stop/:testId
 * @description Stop monitoring a specific test
 */
router.post('/stop/:testId', async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({
        error: 'Test ID is required'
      });
    }

    statisticalService.stopMonitoring(testId);

    res.json({
      success: true,
      message: `Monitoring stopped for test ${testId}`,
      testId
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to stop monitoring',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route PUT /api/statistical-monitoring/update
 * @description Update test metrics and trigger immediate analysis
 */
router.put('/update', async (req: Request, res: Response) => {
  try {
    const testMetrics: TestMetrics = req.body;

    if (!testMetrics.testId) {
      return res.status(400).json({
        error: 'Test ID is required'
      });
    }

    // Update calculated fields
    testMetrics.totalVisitors = testMetrics.variations.reduce((sum, v) => sum + v.visitors, 0);
    testMetrics.totalConversions = testMetrics.variations.reduce((sum, v) => sum + v.conversions, 0);
    testMetrics.overallConversionRate = testMetrics.totalVisitors > 0 ?
      testMetrics.totalConversions / testMetrics.totalVisitors : 0;

    testMetrics.variations.forEach(variation => {
      variation.conversionRate = variation.visitors > 0 ? variation.conversions / variation.visitors : 0;
    });

    statisticalService.updateTestMetrics(testMetrics);

    res.json({
      success: true,
      message: `Test metrics updated for ${testMetrics.testId}`,
      testId: testMetrics.testId,
      totalVisitors: testMetrics.totalVisitors,
      overallConversionRate: testMetrics.overallConversionRate
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to update test metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/statistical-monitoring/analyze/:testId
 * @description Manually trigger analysis for a specific test
 */
router.post('/analyze/:testId', async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({
        error: 'Test ID is required'
      });
    }

    await statisticalService.triggerAnalysis(testId);

    res.json({
      success: true,
      message: `Analysis triggered for test ${testId}`,
      testId
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to trigger analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/statistical-monitoring/results/:testId
 * @description Get statistical analysis results for a test
 */
router.get('/results/:testId', async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const { limit = '50' } = req.query;

    if (!testId) {
      return res.status(400).json({
        error: 'Test ID is required'
      });
    }

    const results = statisticalService.getTestResults(testId);
    const limitedResults = results.slice(-parseInt(limit as string));

    res.json({
      success: true,
      testId,
      resultsCount: results.length,
      results: limitedResults,
      latestResult: results[results.length - 1] || null
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get test results',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/statistical-monitoring/anomalies/:testId
 * @description Get anomaly detection history for a test
 */
router.get('/anomalies/:testId', async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const { limit = '20' } = req.query;

    if (!testId) {
      return res.status(400).json({
        error: 'Test ID is required'
      });
    }

    const anomalies = statisticalService.getAnomalyHistory(testId);
    const limitedAnomalies = anomalies.slice(-parseInt(limit as string));

    res.json({
      success: true,
      testId,
      anomaliesCount: anomalies.length,
      anomalies: limitedAnomalies,
      latestAnomaly: anomalies[anomalies.length - 1] || null
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get anomaly history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/statistical-monitoring/status
 * @description Get monitoring status for all active tests
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const activeTests = statisticalService.getActiveTests();
    const monitoringStatus = statisticalService.getMonitoringStatus();
    const config = statisticalService.getConfiguration();

    res.json({
      success: true,
      activeTestCount: activeTests.length,
      activeTests,
      monitoringStatus,
      configuration: config,
      timestamp: new Date()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get monitoring status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route PUT /api/statistical-monitoring/config
 * @description Update statistical monitoring configuration
 */
router.put('/config', async (req: Request, res: Response) => {
  try {
    const newConfig: Partial<StatisticalConfig> = req.body;

    // Validate configuration values
    if (newConfig.significanceLevel && (newConfig.significanceLevel <= 0 || newConfig.significanceLevel >= 1)) {
      return res.status(400).json({
        error: 'Invalid significance level',
        message: 'Significance level must be between 0 and 1'
      });
    }

    if (newConfig.powerLevel && (newConfig.powerLevel <= 0 || newConfig.powerLevel >= 1)) {
      return res.status(400).json({
        error: 'Invalid power level',
        message: 'Power level must be between 0 and 1'
      });
    }

    if (newConfig.minimumSampleSize && newConfig.minimumSampleSize < 1) {
      return res.status(400).json({
        error: 'Invalid minimum sample size',
        message: 'Minimum sample size must be at least 1'
      });
    }

    if (newConfig.monitoringInterval && newConfig.monitoringInterval < 60000) {
      return res.status(400).json({
        error: 'Invalid monitoring interval',
        message: 'Monitoring interval must be at least 60 seconds (60000ms)'
      });
    }

    statisticalService.updateConfiguration(newConfig);
    const updatedConfig = statisticalService.getConfiguration();

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      configuration: updatedConfig
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to update configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/statistical-monitoring/config
 * @description Get current statistical monitoring configuration
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = statisticalService.getConfiguration();

    res.json({
      success: true,
      configuration: config
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/statistical-monitoring/events
 * @description Server-Sent Events endpoint for real-time monitoring
 */
router.get('/events', (req: Request, res: Response) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Add client to the set
  sseClients.add(res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    event: 'connected',
    data: {
      message: 'Connected to statistical monitoring events',
      timestamp: new Date(),
      activeTests: statisticalService.getActiveTests()
    }
  })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    sseClients.delete(res);
  });

  req.on('error', () => {
    sseClients.delete(res);
  });
});

/**
 * @route GET /api/statistical-monitoring/dashboard
 * @description Get comprehensive dashboard data
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const activeTests = statisticalService.getActiveTests();
    const monitoringStatus = statisticalService.getMonitoringStatus();
    const config = statisticalService.getConfiguration();

    // Get latest results for each active test
    const testSummaries = activeTests.map(testId => {
      const results = statisticalService.getTestResults(testId);
      const anomalies = statisticalService.getAnomalyHistory(testId);
      const latestResult = results[results.length - 1];
      const latestAnomaly = anomalies[anomalies.length - 1];

      return {
        testId,
        latestResult,
        latestAnomaly,
        totalResults: results.length,
        totalAnomalies: anomalies.length,
        isActive: monitoringStatus.find(s => s.testId === testId)?.isActive || false
      };
    });

    // Calculate summary statistics
    const totalActiveTests = activeTests.length;
    const significantTests = testSummaries.filter(t =>
      t.latestResult?.isSignificant).length;
    const testsWithAnomalies = testSummaries.filter(t =>
      t.latestAnomaly?.riskLevel && t.latestAnomaly.riskLevel !== 'low').length;

    res.json({
      success: true,
      summary: {
        totalActiveTests,
        significantTests,
        testsWithAnomalies,
        lastUpdated: new Date()
      },
      testSummaries,
      configuration: config,
      connectedClients: sseClients.size
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/statistical-monitoring/shutdown
 * @description Shutdown the monitoring service (for admin use)
 */
router.post('/shutdown', async (req: Request, res: Response) => {
  try {
    const activeTests = statisticalService.getActiveTests();

    statisticalService.shutdown();

    // Close all SSE connections
    sseClients.forEach(client => {
      try {
        client.end();
      } catch (error) {
        // Client already closed
      }
    });
    sseClients.clear();

    res.json({
      success: true,
      message: 'Statistical monitoring service shutdown complete',
      stoppedTests: activeTests.length
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to shutdown service',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/statistical-monitoring/health
 * @description Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const activeTests = statisticalService.getActiveTests();
    const config = statisticalService.getConfiguration();

    res.json({
      status: 'healthy',
      service: 'statistical-monitoring',
      activeTests: activeTests.length,
      connectedClients: sseClients.size,
      configuration: {
        monitoringInterval: config.monitoringInterval,
        bayesianEnabled: config.bayesianEnabled,
        earlyStoppingEnabled: config.earlyStoppingEnabled
      },
      timestamp: new Date()
    });

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }
});

export default router;
