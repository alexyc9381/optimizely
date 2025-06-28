// =============================================================================
// UNIVERSAL SALES ALERT AND NOTIFICATION API ROUTES
// =============================================================================
// A/B Testing Focused Alert and Notification System API

import { Request, Response, Router } from 'express';
import UniversalSalesAlertNotificationService, {
    ABTestAlert,
    ConversionAlert
} from '../services/universal-sales-alert-notification-service';

const router = Router();

// =============================================================================
// A/B TEST ALERT ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/v1/alerts/ab-test:
 *   post:
 *     summary: Generate A/B test alert
 *     description: Create and send alerts for A/B test events like statistical significance or winner detection
 *     tags: [A/B Test Alerts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [testId, type, data]
 *             properties:
 *               testId:
 *                 type: string
 *                 description: A/B test identifier
 *               type:
 *                 type: string
 *                 enum: [statistical_significance, conversion_threshold, traffic_anomaly, test_completion, winner_detected]
 *               data:
 *                 type: object
 *                 properties:
 *                   testName:
 *                     type: string
 *                   variantId:
 *                     type: string
 *                   conversionRate:
 *                     type: number
 *                   confidenceLevel:
 *                     type: number
 *                   sampleSize:
 *                     type: number
 *                   pValue:
 *                     type: number
 *                   liftPercentage:
 *                     type: number
 *                   revenue:
 *                     type: number
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               customMessage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Alert created successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post('/ab-test', async (req: Request, res: Response) => {
  try {
    const { testId, type, data, severity, customMessage, metadata } = req.body;

    if (!testId || !type || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: testId, type, data'
      });
    }

    const alert = await UniversalSalesAlertNotificationService.generateABTestAlert(
      testId,
      type,
      data,
      { severity, customMessage, metadata }
    );

    res.status(201).json({
      success: true,
      data: alert,
      message: 'A/B test alert created and queued for delivery'
    });
  } catch (error) {
    console.error('Error creating A/B test alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create A/B test alert'
    });
  }
});

/**
 * @swagger
 * /api/v1/alerts/conversion:
 *   post:
 *     summary: Generate conversion alert
 *     description: Create alerts for conversion events and goal achievements
 *     tags: [Conversion Alerts]
 */
router.post('/conversion', async (req: Request, res: Response) => {
  try {
    const { goalId, conversionData, threshold, testContext } = req.body;

    if (!goalId || !conversionData || !threshold) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: goalId, conversionData, threshold'
      });
    }

    const alert = await UniversalSalesAlertNotificationService.generateConversionAlert(
      goalId,
      conversionData,
      threshold,
      testContext
    );

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Conversion alert created successfully'
    });
  } catch (error) {
    console.error('Error creating conversion alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversion alert'
    });
  }
});

/**
 * @swagger
 * /api/v1/alerts/statistical-significance:
 *   post:
 *     summary: Check statistical significance
 *     description: Analyze variant data and generate alerts for statistically significant results
 *     tags: [Statistical Analysis]
 */
router.post('/statistical-significance', async (req: Request, res: Response) => {
  try {
    const { testId, variantData } = req.body;

    if (!testId || !variantData || !Array.isArray(variantData)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: testId, variantData (array)'
      });
    }

    await UniversalSalesAlertNotificationService.checkStatisticalSignificance(testId, variantData);

    res.json({
      success: true,
      message: 'Statistical significance analysis completed'
    });
  } catch (error) {
    console.error('Error checking statistical significance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze statistical significance'
    });
  }
});

/**
 * @swagger
 * /api/v1/alerts/winner-detection:
 *   post:
 *     summary: Detect test winner
 *     description: Analyze variant results to detect clear winners
 *     tags: [Winner Detection]
 */
router.post('/winner-detection', async (req: Request, res: Response) => {
  try {
    const { testId, variantResults } = req.body;

    if (!testId || !variantResults || !Array.isArray(variantResults)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: testId, variantResults (array)'
      });
    }

    await UniversalSalesAlertNotificationService.detectTestWinner(testId, variantResults);

    res.json({
      success: true,
      message: 'Winner detection analysis completed'
    });
  } catch (error) {
    console.error('Error detecting test winner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect test winner'
    });
  }
});

/**
 * @swagger
 * /api/v1/alerts/traffic-anomaly:
 *   post:
 *     summary: Detect traffic anomalies
 *     description: Analyze traffic patterns and detect anomalies
 *     tags: [Anomaly Detection]
 */
router.post('/traffic-anomaly', async (req: Request, res: Response) => {
  try {
    const { testId, currentTraffic, historicalAverage, threshold } = req.body;

    if (!testId || currentTraffic === undefined || historicalAverage === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: testId, currentTraffic, historicalAverage'
      });
    }

    await UniversalSalesAlertNotificationService.detectTrafficAnomalies(
      testId,
      currentTraffic,
      historicalAverage,
      threshold
    );

    res.json({
      success: true,
      message: 'Traffic anomaly detection completed'
    });
  } catch (error) {
    console.error('Error detecting traffic anomalies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect traffic anomalies'
    });
  }
});

// =============================================================================
// ALERT MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/v1/alerts/history:
 *   get:
 *     summary: Get alert history
 *     description: Retrieve historical alerts with filtering options
 *     tags: [Alert Management]
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { testId, type, severity, limit, offset } = req.query;

    const options = {
      testId: testId as string,
      type: type as string,
      severity: severity as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };

    const alerts = await UniversalSalesAlertNotificationService.getAlertHistory(options);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error retrieving alert history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alert history'
    });
  }
});

/**
 * @swagger
 * /api/v1/alerts/{alertId}/acknowledge:
 *   post:
 *     summary: Acknowledge alert
 *     description: Mark an alert as acknowledged by a user
 *     tags: [Alert Management]
 */
router.post('/:alertId/acknowledge', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    await UniversalSalesAlertNotificationService.acknowledgeAlert(alertId, userId);

    res.json({
      success: true,
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert'
    });
  }
});

// =============================================================================
// NOTIFICATION CHANNEL ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/v1/alerts/channels:
 *   post:
 *     summary: Add notification channel
 *     description: Configure a new notification channel for alerts
 *     tags: [Notification Channels]
 */
router.post('/channels', async (req: Request, res: Response) => {
  try {
    const channelData = req.body;

    if (!channelData.type || !channelData.config) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, config'
      });
    }

    await UniversalSalesAlertNotificationService.addNotificationChannel(channelData);

    res.status(201).json({
      success: true,
      message: 'Notification channel added successfully'
    });
  } catch (error) {
    console.error('Error adding notification channel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add notification channel'
    });
  }
});

/**
 * @swagger
 * /api/v1/alerts/channels/{channelType}/test:
 *   post:
 *     summary: Test notification channel
 *     description: Send a test notification through specified channel
 *     tags: [Notification Channels]
 */
router.post('/channels/:channelType/test', async (req: Request, res: Response) => {
  try {
    const { channelType } = req.params;
    const { testMessage } = req.body;

    const success = await UniversalSalesAlertNotificationService.testNotification(
      channelType,
      testMessage || 'This is a test notification from the A/B testing alert system.'
    );

    res.json({
      success,
      message: success ? 'Test notification sent successfully' : 'Test notification failed'
    });
  } catch (error) {
    console.error('Error testing notification channel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test notification channel'
    });
  }
});

// =============================================================================
// ANALYTICS AND MONITORING ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/v1/alerts/analytics:
 *   get:
 *     summary: Get alert analytics
 *     description: Retrieve analytics and metrics for alert system performance
 *     tags: [Analytics]
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const timeRange = {
      start: startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate as string) : new Date()
    };

    // For now, return health status as analytics
    const healthStatus = UniversalSalesAlertNotificationService.getHealthStatus();

    res.json({
      success: true,
      data: {
        timeRange,
        ...healthStatus,
        summary: {
          totalAlerts: healthStatus.metrics.alertsProcessed,
          successfulDeliveries: healthStatus.metrics.alertsDelivered,
          failedDeliveries: healthStatus.metrics.alertsFailed,
          averageProcessingTime: healthStatus.metrics.averageProcessingTime
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics'
    });
  }
});

/**
 * @swagger
 * /api/v1/alerts/health:
 *   get:
 *     summary: Get system health
 *     description: Check the health status of the alert notification system
 *     tags: [Health]
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthStatus = UniversalSalesAlertNotificationService.getHealthStatus();

    res.json({
      success: true,
      data: healthStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking health status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check health status'
    });
  }
});

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * @swagger
 * /api/v1/alerts/bulk/statistical-analysis:
 *   post:
 *     summary: Bulk statistical analysis
 *     description: Analyze multiple tests for statistical significance
 *     tags: [Bulk Operations]
 */
router.post('/bulk/statistical-analysis', async (req: Request, res: Response) => {
  try {
    const { tests } = req.body;

    if (!tests || !Array.isArray(tests)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: tests (array)'
      });
    }

    const results = [];
    for (const test of tests) {
      try {
        await UniversalSalesAlertNotificationService.checkStatisticalSignificance(
          test.testId,
          test.variantData
        );
        results.push({ testId: test.testId, status: 'success' });
      } catch (error: any) {
        results.push({ testId: test.testId, status: 'error', error: error.message });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Processed ${tests.length} tests for statistical analysis`
    });
  } catch (error) {
    console.error('Error in bulk statistical analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk statistical analysis'
    });
  }
});

/**
 * @swagger
 * /api/v1/alerts/bulk/winner-detection:
 *   post:
 *     summary: Bulk winner detection
 *     description: Detect winners across multiple A/B tests
 *     tags: [Bulk Operations]
 */
router.post('/bulk/winner-detection', async (req: Request, res: Response) => {
  try {
    const { tests } = req.body;

    if (!tests || !Array.isArray(tests)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: tests (array)'
      });
    }

    const results = [];
    for (const test of tests) {
      try {
        await UniversalSalesAlertNotificationService.detectTestWinner(
          test.testId,
          test.variantResults
        );
        results.push({ testId: test.testId, status: 'success' });
      } catch (error: any) {
        results.push({ testId: test.testId, status: 'error', error: error.message });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Processed ${tests.length} tests for winner detection`
    });
  } catch (error) {
    console.error('Error in bulk winner detection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk winner detection'
    });
  }
});

// =============================================================================
// REAL-TIME ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/v1/alerts/stream:
 *   get:
 *     summary: Real-time alert stream
 *     description: Server-sent events stream for real-time alerts
 *     tags: [Real-time]
 */
router.get('/stream', (req: Request, res: Response) => {
  // Set headers for Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  res.write('data: {"type":"connected","message":"Alert stream connected"}\n\n');

  // Listen for new alerts
  const alertHandler = (alert: ABTestAlert) => {
    res.write(`data: ${JSON.stringify({ type: 'alert', data: alert })}\n\n`);
  };

  const conversionHandler = (alert: ConversionAlert) => {
    res.write(`data: ${JSON.stringify({ type: 'conversion_alert', data: alert })}\n\n`);
  };

  UniversalSalesAlertNotificationService.on('alertGenerated', alertHandler);
  UniversalSalesAlertNotificationService.on('conversionAlert', conversionHandler);

  // Handle client disconnect
  req.on('close', () => {
    UniversalSalesAlertNotificationService.off('alertGenerated', alertHandler);
    UniversalSalesAlertNotificationService.off('conversionAlert', conversionHandler);
  });
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

router.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Alert API Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error in alert system',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

export default router;
