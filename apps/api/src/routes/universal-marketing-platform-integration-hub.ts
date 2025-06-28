import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import {
    DataType,
    marketingPlatformHub,
    MarketingPlatformType,
    PlatformCategory
} from '../services/universal-marketing-platform-integration-hub';

const router = express.Router();

// =============================================================================
// MIDDLEWARE
// =============================================================================

interface AuthenticatedRequest extends Request {
  apiKey?: string;
  userId?: string;
}

const authenticateApiKey = (req: AuthenticatedRequest, res: Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'API key required'
    });
  }
  req.apiKey = apiKey;
  next();
};

const addSecurityHeaders = (req: Request, res: Response, next: express.NextFunction) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  next();
};

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

const validatePlatformRequest = [
  body('name').notEmpty().withMessage('Platform name is required'),
  body('type').isIn(Object.values(MarketingPlatformType)).withMessage('Invalid platform type'),
  body('category').isIn(Object.values(PlatformCategory)).withMessage('Invalid platform category'),
  body('enabled').isBoolean().withMessage('Enabled must be boolean'),
  body('authentication.type').isIn(['api_key', 'oauth2', 'jwt', 'basic', 'custom', 'saml']).withMessage('Invalid authentication type'),
  body('authentication.credentials').isObject().withMessage('Credentials must be an object'),
  body('settings.baseUrl').isURL().withMessage('Base URL must be valid'),
  body('settings.timeout').isInt({ min: 1000, max: 300000 }).withMessage('Timeout must be between 1000-300000ms'),
  body('settings.retryAttempts').isInt({ min: 0, max: 10 }).withMessage('Retry attempts must be between 0-10'),
  body('settings.batchSize').isInt({ min: 1, max: 10000 }).withMessage('Batch size must be between 1-10000'),
  body('rateLimit.requestsPerMinute').isInt({ min: 1 }).withMessage('Requests per minute must be positive'),
  body('rateLimit.requestsPerHour').isInt({ min: 1 }).withMessage('Requests per hour must be positive'),
  body('rateLimit.requestsPerDay').isInt({ min: 1 }).withMessage('Requests per day must be positive')
];

const validateSyncConfigRequest = [
  body('platformId').isUUID().withMessage('Platform ID must be valid UUID'),
  body('name').notEmpty().withMessage('Sync configuration name is required'),
  body('enabled').isBoolean().withMessage('Enabled must be boolean'),
  body('direction').isIn(['inbound', 'outbound', 'bidirectional']).withMessage('Invalid sync direction'),
  body('dataType').isIn(Object.values(DataType)).withMessage('Invalid data type'),
  body('schedule.type').isIn(['manual', 'interval', 'cron', 'webhook']).withMessage('Invalid schedule type')
];

const validateSyncJobRequest = [
  body('configurationId').isUUID().withMessage('Configuration ID must be valid UUID'),
  body('type').isIn(['full', 'incremental', 'custom']).withMessage('Invalid sync type')
];

const validateWebhookRequest = [
  body('platformId').isUUID().withMessage('Platform ID must be valid UUID'),
  body('event').notEmpty().withMessage('Event name is required'),
  body('payload').isObject().withMessage('Payload must be an object')
];

// =============================================================================
// PLATFORM MANAGEMENT ROUTES
// =============================================================================

/**
 * GET /platforms - Get all marketing platform integrations
 */
router.get('/platforms', authenticateApiKey, addSecurityHeaders, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, category, enabled, status } = req.query;

    let platforms = marketingPlatformHub.getAllPlatforms();

    // Apply filters
    if (type && typeof type === 'string') {
      platforms = platforms.filter(p => p.type === type);
    }

    if (category && typeof category === 'string') {
      platforms = platforms.filter(p => p.category === category);
    }

    if (enabled !== undefined) {
      const isEnabled = enabled === 'true';
      platforms = platforms.filter(p => p.enabled === isEnabled);
    }

    if (status && typeof status === 'string') {
      platforms = platforms.filter(p => p.status === status);
    }

    res.json({
      success: true,
      data: platforms,
      total: platforms.length,
      filters: { type, category, enabled, status }
    });

  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch platform integrations'
    });
  }
});

/**
 * GET /platforms/:id - Get specific platform integration
 */
router.get('/platforms/:id', authenticateApiKey, addSecurityHeaders, [
  param('id').isUUID().withMessage('Invalid platform ID')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    const platform = marketingPlatformHub.getPlatform(req.params.id);

    if (!platform) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Platform integration not found'
      });
    }

    res.json({
      success: true,
      data: platform
    });

  } catch (error) {
    console.error('Error fetching platform:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch platform integration'
    });
  }
});

/**
 * POST /platforms - Create new platform integration
 */
router.post('/platforms', authenticateApiKey, addSecurityHeaders, validatePlatformRequest, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    const platformConfig = req.body;
    const platform = await marketingPlatformHub.createPlatform(platformConfig);

    res.status(201).json({
      success: true,
      data: platform,
      message: 'Platform integration created successfully'
    });

  } catch (error) {
    console.error('Error creating platform:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unsupported platform type')) {
        return res.status(400).json({
          error: 'unsupported_type',
          message: error.message
        });
      }

      if (error.message.includes('Invalid configuration')) {
        return res.status(400).json({
          error: 'invalid_configuration',
          message: error.message
        });
      }

      if (error.message.includes('Authentication failed')) {
        return res.status(401).json({
          error: 'authentication_failed',
          message: error.message
        });
      }
    }

    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to create platform integration'
    });
  }
});

/**
 * PUT /platforms/:id - Update platform integration
 */
router.put('/platforms/:id', authenticateApiKey, addSecurityHeaders, [
  param('id').isUUID().withMessage('Invalid platform ID'),
  ...validatePlatformRequest
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    const platform = await marketingPlatformHub.updatePlatform(req.params.id, req.body);

    res.json({
      success: true,
      data: platform,
      message: 'Platform integration updated successfully'
    });

  } catch (error) {
    console.error('Error updating platform:', error);

    if (error instanceof Error) {
      if (error.message.includes('Platform not found')) {
        return res.status(404).json({
          error: 'not_found',
          message: error.message
        });
      }

      if (error.message.includes('Invalid configuration')) {
        return res.status(400).json({
          error: 'invalid_configuration',
          message: error.message
        });
      }

      if (error.message.includes('Authentication failed')) {
        return res.status(401).json({
          error: 'authentication_failed',
          message: error.message
        });
      }
    }

    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to update platform integration'
    });
  }
});

/**
 * DELETE /platforms/:id - Delete platform integration
 */
router.delete('/platforms/:id', authenticateApiKey, addSecurityHeaders, [
  param('id').isUUID().withMessage('Invalid platform ID')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    await marketingPlatformHub.deletePlatform(req.params.id);

    res.json({
      success: true,
      message: 'Platform integration deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting platform:', error);

    if (error instanceof Error && error.message.includes('Platform not found')) {
      return res.status(404).json({
        error: 'not_found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to delete platform integration'
    });
  }
});

/**
 * POST /platforms/:id/test - Test platform connection
 */
router.post('/platforms/:id/test', authenticateApiKey, addSecurityHeaders, [
  param('id').isUUID().withMessage('Invalid platform ID')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    const platform = marketingPlatformHub.getPlatform(req.params.id);
    if (!platform) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Platform integration not found'
      });
    }

    const adapter = marketingPlatformHub.getAdapter(platform.type);
    if (!adapter) {
      return res.status(400).json({
        error: 'adapter_not_found',
        message: 'Platform adapter not available'
      });
    }

    const healthResult = await adapter.healthCheck(platform);

    res.json({
      success: true,
      data: healthResult,
      message: healthResult.healthy ? 'Platform connection successful' : 'Platform connection failed'
    });

  } catch (error) {
    console.error('Error testing platform connection:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to test platform connection'
    });
  }
});

// =============================================================================
// PLATFORM DISCOVERY ROUTES
// =============================================================================

/**
 * GET /platforms/types - Get supported platform types
 */
router.get('/platforms/types', authenticateApiKey, addSecurityHeaders, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supportedTypes = marketingPlatformHub.getSupportedPlatformTypes();
    const adapters = marketingPlatformHub.getAllAdapters();

    const typeInfo = supportedTypes.map(type => {
      const adapter = adapters.find(a => a.type === type);
      return {
        type,
        name: adapter?.name || type,
        category: adapter?.category || 'custom',
        version: adapter?.version || '1.0.0',
        capabilities: adapter?.getCapabilities() || null
      };
    });

    res.json({
      success: true,
      data: typeInfo,
      total: typeInfo.length
    });

  } catch (error) {
    console.error('Error fetching platform types:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch platform types'
    });
  }
});

/**
 * GET /platforms/categories - Get platform categories
 */
router.get('/platforms/categories', authenticateApiKey, addSecurityHeaders, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = Object.values(PlatformCategory);
    const platforms = marketingPlatformHub.getAllPlatforms();

    const categoryInfo = categories.map(category => {
      const categoryPlatforms = platforms.filter(p => p.category === category);
      return {
        category,
        platformCount: categoryPlatforms.length,
        activePlatforms: categoryPlatforms.filter(p => p.enabled && p.status === 'active').length
      };
    });

    res.json({
      success: true,
      data: categoryInfo,
      total: categoryInfo.length
    });

  } catch (error) {
    console.error('Error fetching platform categories:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch platform categories'
    });
  }
});

// =============================================================================
// SYNC CONFIGURATION ROUTES
// =============================================================================

/**
 * GET /sync-configurations - Get all sync configurations
 */
router.get('/sync-configurations', authenticateApiKey, addSecurityHeaders, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { platformId, enabled, dataType } = req.query;

    // Note: Implementation would filter from service
    res.json({
      success: true,
      data: [],
      total: 0,
      message: 'Sync configurations endpoint - implementation pending'
    });

  } catch (error) {
    console.error('Error fetching sync configurations:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch sync configurations'
    });
  }
});

/**
 * POST /sync-configurations - Create sync configuration
 */
router.post('/sync-configurations', authenticateApiKey, addSecurityHeaders, validateSyncConfigRequest, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    // Note: Implementation would create sync configuration
    res.status(201).json({
      success: true,
      data: req.body,
      message: 'Sync configuration created successfully - implementation pending'
    });

  } catch (error) {
    console.error('Error creating sync configuration:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to create sync configuration'
    });
  }
});

// =============================================================================
// SYNC JOB ROUTES
// =============================================================================

/**
 * GET /sync-jobs - Get all sync jobs
 */
router.get('/sync-jobs', authenticateApiKey, addSecurityHeaders, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, platformId, configurationId } = req.query;

    // Note: Implementation would filter from service
    res.json({
      success: true,
      data: [],
      total: 0,
      message: 'Sync jobs endpoint - implementation pending'
    });

  } catch (error) {
    console.error('Error fetching sync jobs:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch sync jobs'
    });
  }
});

/**
 * POST /sync-jobs - Create and start sync job
 */
router.post('/sync-jobs', authenticateApiKey, addSecurityHeaders, validateSyncJobRequest, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    // Note: Implementation would create and start sync job
    res.status(201).json({
      success: true,
      data: req.body,
      message: 'Sync job created and started - implementation pending'
    });

  } catch (error) {
    console.error('Error creating sync job:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to create sync job'
    });
  }
});

/**
 * GET /sync-jobs/:id - Get sync job status
 */
router.get('/sync-jobs/:id', authenticateApiKey, addSecurityHeaders, [
  param('id').isUUID().withMessage('Invalid sync job ID')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    // Note: Implementation would get sync job status
    res.json({
      success: true,
      data: { id: req.params.id, status: 'pending' },
      message: 'Sync job status endpoint - implementation pending'
    });

  } catch (error) {
    console.error('Error fetching sync job:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch sync job'
    });
  }
});

/**
 * POST /sync-jobs/:id/cancel - Cancel sync job
 */
router.post('/sync-jobs/:id/cancel', authenticateApiKey, addSecurityHeaders, [
  param('id').isUUID().withMessage('Invalid sync job ID')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    // Note: Implementation would cancel sync job
    res.json({
      success: true,
      message: 'Sync job cancelled successfully - implementation pending'
    });

  } catch (error) {
    console.error('Error cancelling sync job:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to cancel sync job'
    });
  }
});

// =============================================================================
// WEBHOOK ROUTES
// =============================================================================

/**
 * POST /webhooks - Process incoming webhook
 */
router.post('/webhooks', addSecurityHeaders, validateWebhookRequest, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    const { platformId, event, payload } = req.body;
    const headers = req.headers as Record<string, string>;

    // Note: Implementation would process webhook
    res.json({
      success: true,
      data: { platformId, event, processed: true },
      message: 'Webhook processed successfully - implementation pending'
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to process webhook'
    });
  }
});

/**
 * GET /webhooks/events - Get webhook events
 */
router.get('/webhooks/events', authenticateApiKey, addSecurityHeaders, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { platformId, event, processed } = req.query;

    // Note: Implementation would filter webhook events
    res.json({
      success: true,
      data: [],
      total: 0,
      message: 'Webhook events endpoint - implementation pending'
    });

  } catch (error) {
    console.error('Error fetching webhook events:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch webhook events'
    });
  }
});

// =============================================================================
// ANALYTICS & MONITORING ROUTES
// =============================================================================

/**
 * GET /analytics/overview - Get integration analytics overview
 */
router.get('/analytics/overview', authenticateApiKey, addSecurityHeaders, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const platforms = marketingPlatformHub.getAllPlatforms();

        const overview = {
      totalPlatforms: platforms.length,
      activePlatforms: platforms.filter(p => p.enabled && p.status === 'active').length,
      inactivePlatforms: platforms.filter(p => !p.enabled || p.status !== 'active').length,
      platformsByCategory: {} as Record<string, number>,
      platformsByType: {} as Record<string, number>,
      lastUpdated: new Date()
    };

    // Group by category
    platforms.forEach(platform => {
      overview.platformsByCategory[platform.category] =
        (overview.platformsByCategory[platform.category] || 0) + 1;
    });

    // Group by type
    platforms.forEach(platform => {
      overview.platformsByType[platform.type] =
        (overview.platformsByType[platform.type] || 0) + 1;
    });

    res.json({
      success: true,
      data: overview
    });

  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch analytics overview'
    });
  }
});

/**
 * GET /analytics/platforms/:id - Get platform-specific analytics
 */
router.get('/analytics/platforms/:id', authenticateApiKey, addSecurityHeaders, [
  param('id').isUUID().withMessage('Invalid platform ID')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    const platform = marketingPlatformHub.getPlatform(req.params.id);
    if (!platform) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Platform integration not found'
      });
    }

    // Note: Implementation would get platform-specific analytics
    res.json({
      success: true,
      data: {
        platformId: req.params.id,
        platformName: platform.name,
        status: platform.status,
        analytics: 'Platform analytics - implementation pending'
      }
    });

  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch platform analytics'
    });
  }
});

// =============================================================================
// HEALTH CHECK ROUTE
// =============================================================================

/**
 * GET /health - Hub health check
 */
router.get('/health', addSecurityHeaders, async (req: Request, res: Response) => {
  try {
    const platforms = marketingPlatformHub.getAllPlatforms();
    const activePlatforms = platforms.filter(p => p.enabled && p.status === 'active');

    const health = {
      status: 'healthy',
      timestamp: new Date(),
      totalPlatforms: platforms.length,
      activePlatforms: activePlatforms.length,
      version: '1.0.0',
      uptime: process.uptime()
    };

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Health check failed'
    });
  }
});

export default router;
