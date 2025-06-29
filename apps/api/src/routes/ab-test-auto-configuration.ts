import express from 'express';
import rateLimit from 'express-rate-limit';
import { createABTestAutoConfigurationService } from '../services/ab-test-auto-configuration-service';
import { redisManager } from '../services/redis-client';

const router = express.Router();

// Rate limiting
const autoConfigRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many auto-configuration requests, please try again later'
}) as any;

// Initialize service
const service = createABTestAutoConfigurationService(redisManager.getClient());

// POST /ab-test-auto-configuration/configure
// Automatically configure an A/B test for a customer
router.post('/configure', autoConfigRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { customerId, templateId, options = {} } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const autoTest = await service.autoConfigureTest(customerId, templateId, options);

    res.json({
      success: true,
      data: autoTest,
      message: 'Test configured successfully'
    });
  } catch (error: any) {
    console.error('Error configuring auto test:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to configure test'
    });
  }
});

// POST /ab-test-auto-configuration/launch/:testId
// Launch a configured test
router.post('/launch/:testId', autoConfigRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({
        success: false,
        error: 'Test ID is required'
      });
    }

    const result = await service.launchTest(testId);

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Test launched successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
        warnings: result.warnings,
        errors: result.errors
      });
    }
  } catch (error: any) {
    console.error('Error launching test:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to launch test'
    });
  }
});

// POST /ab-test-auto-configuration/rollback/:testId
// Rollback a test
router.post('/rollback/:testId', autoConfigRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { testId } = req.params;
    const { reason = 'Manual rollback' } = req.body;

    if (!testId) {
      return res.status(400).json({
        success: false,
        error: 'Test ID is required'
      });
    }

    const result = await service.rollbackTest(testId, reason);

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Test rolled back successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error: any) {
    console.error('Error rolling back test:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to rollback test'
    });
  }
});

// GET /ab-test-auto-configuration/customer/:customerId/tests
// Get all auto-configured tests for a customer
router.get('/customer/:customerId/tests', async (req: express.Request, res: express.Response) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const tests = await service.getCustomerTests(customerId);

    res.json({
      success: true,
      data: {
        tests,
        count: tests.length
      },
      message: 'Tests retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting customer tests:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get customer tests'
    });
  }
});

// POST /ab-test-auto-configuration/configure-and-launch
// Combined endpoint to configure and immediately launch a test
router.post('/configure-and-launch', autoConfigRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { customerId, templateId, options = {} } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    // Configure with auto-launch enabled
    const configOptions = { ...options, autoLaunch: true };
    const autoTest = await service.autoConfigureTest(customerId, templateId, configOptions);

    res.json({
      success: true,
      data: autoTest,
      message: 'Test configured and launched successfully'
    });
  } catch (error: any) {
    console.error('Error configuring and launching test:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to configure and launch test'
    });
  }
});

// GET /ab-test-auto-configuration/test/:testId
// Get details of a specific auto-configured test
router.get('/test/:testId', async (req: express.Request, res: express.Response) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({
        success: false,
        error: 'Test ID is required'
      });
    }

    // Access private method through service instance
    const test = await (service as any).getAutoConfiguredTest(testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    res.json({
      success: true,
      data: test,
      message: 'Test details retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting test details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get test details'
    });
  }
});

// GET /ab-test-auto-configuration/health
// Health check endpoint
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    // Basic health check
    const redisStatus = redisManager.getClient().status;

    res.json({
      success: true,
      data: {
        service: 'AB Test Auto Configuration',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        redis: redisStatus
      },
      message: 'Service is healthy'
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Service health check failed',
      details: error.message
    });
  }
});

export default router;
