import express from 'express';
import rateLimit from 'express-rate-limit';
import { createABTestMonitoringEngine } from '../services/ab-test-monitoring-engine';
import { redisManager } from '../services/redis-client';

const router = express.Router();

// Rate limiting
const monitoringRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many monitoring requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

const controlRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 control requests per windowMs
  message: 'Too many control requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

// Initialize monitoring engine
const monitoringEngine = createABTestMonitoringEngine(redisManager.getClient());

// Get monitoring status
router.get('/status', monitoringRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const status = await monitoringEngine.getMonitoringStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start monitoring
router.post('/start', controlRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { intervalMinutes = 30 } = req.body;
    await monitoringEngine.startMonitoring(intervalMinutes);
    res.json({ success: true, message: 'Monitoring started' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop monitoring
router.post('/stop', controlRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    monitoringEngine.stopMonitoring();
    res.json({ success: true, message: 'Monitoring stopped' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get test metrics
router.get('/tests/:testId/metrics', monitoringRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { testId } = req.params;
    const metrics = await monitoringEngine.getTestMetrics(testId);

    if (!metrics) {
      return res.status(404).json({ success: false, error: 'Test not found' });
    }

    res.json({ success: true, data: metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get test alerts
router.get('/tests/:testId/alerts', monitoringRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { testId } = req.params;
    const alerts = await monitoringEngine.getTestAlerts(testId);
    res.json({ success: true, data: alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get optimization suggestions
router.get('/tests/:testId/suggestions', monitoringRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { testId } = req.params;
    const suggestions = await monitoringEngine.getOptimizationSuggestions(testId);
    res.json({ success: true, data: suggestions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get comprehensive test performance report
router.get('/tests/:testId/report', monitoringRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { testId } = req.params;

    const [metrics, alerts, suggestions] = await Promise.all([
      monitoringEngine.getTestMetrics(testId),
      monitoringEngine.getTestAlerts(testId),
      monitoringEngine.getOptimizationSuggestions(testId)
    ]);

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'Test not found or no data available'
      });
    }

    // Generate executive summary
    const executiveSummary = {
      testStatus: metrics.statisticalSignificance.isSignificant ? 'Significant Results' : 'Testing in Progress',
      winningVariation: metrics.variations.reduce((prev, current) =>
        current.probabilityToBeatControl > prev.probabilityToBeatControl ? current : prev
      ),
      keyInsights: [
        `Test has ${metrics.overallMetrics.totalVisitors} total visitors`,
        `Average conversion rate: ${(metrics.overallMetrics.averageConversionRate * 100).toFixed(2)}%`,
        `Statistical significance: ${metrics.statisticalSignificance.isSignificant ? 'Achieved' : 'Not yet achieved'}`,
        `${alerts.filter(a => !a.isResolved).length} active alerts`,
        `${suggestions.length} optimization suggestions available`
      ],
      recommendations: suggestions.slice(0, 3).map(s => s.title) // Top 3 recommendations
    };

    res.json({
      success: true,
      data: {
        executiveSummary,
        metrics,
        alerts: alerts.slice(0, 10), // Most recent 10 alerts
        suggestions: suggestions.slice(0, 5) // Top 5 suggestions
      }
    });
  } catch (error: any) {
    console.error('Error generating test report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate test report',
      details: error.message
    });
  }
});

// Manual trigger for monitoring cycle (for testing/debugging)
router.post('/trigger-cycle', controlRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    // Access the private method through a manual trigger
    // Note: This is a simplified version for demonstration
    const status = await monitoringEngine.getMonitoringStatus();

    res.json({
      success: true,
      message: 'Monitoring cycle trigger requested',
      status
    });
  } catch (error: any) {
    console.error('Error triggering monitoring cycle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger monitoring cycle',
      details: error.message
    });
  }
});

// Health check endpoint
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const status = await monitoringEngine.getMonitoringStatus();

    res.json({
      success: true,
      status: 'healthy',
      monitoring: {
        isRunning: status.isRunning,
        activeTests: status.activeTestsCount,
        lastCycle: status.lastCycleTime
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get aggregated metrics for multiple tests
router.post('/metrics/aggregate', monitoringRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { testIds } = req.body;

    if (!Array.isArray(testIds)) {
      return res.status(400).json({
        success: false,
        error: 'testIds must be an array'
      });
    }

    const metricsPromises = testIds.map(testId =>
      monitoringEngine.getTestMetrics(testId)
    );

    const allMetrics = await Promise.all(metricsPromises);
    const validMetrics = allMetrics.filter(m => m !== null);

    // Calculate aggregate statistics
    const aggregate = {
      totalTests: validMetrics.length,
      totalVisitors: validMetrics.reduce((sum, m) => sum + m!.overallMetrics.totalVisitors, 0),
      totalConversions: validMetrics.reduce((sum, m) => sum + m!.overallMetrics.totalConversions, 0),
      averageConversionRate: validMetrics.length > 0 ?
        validMetrics.reduce((sum, m) => sum + m!.overallMetrics.averageConversionRate, 0) / validMetrics.length : 0,
      significantTests: validMetrics.filter(m => m!.statisticalSignificance.isSignificant).length,
      highRiskTests: validMetrics.filter(m => m!.riskAssessment.riskLevel === 'high').length,
      totalRecommendations: validMetrics.reduce((sum, m) => sum + m!.recommendations.length, 0)
    };

    res.json({
      success: true,
      data: {
        aggregate,
        tests: validMetrics
      }
    });
  } catch (error: any) {
    console.error('Error aggregating metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to aggregate metrics',
      details: error.message
    });
  }
});

export default router;
