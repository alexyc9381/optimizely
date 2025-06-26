import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { integrationService, IntegrationType } from '../services/integration-service';

const router = express.Router();

// Middleware for authentication (simplified)
interface AuthenticatedRequest extends Request {
  apiKey?: string;
  userId?: string;
}

const authenticateApiKey = (req: AuthenticatedRequest, res: Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  req.apiKey = apiKey;
  next();
};

// Validation middleware
const validateIntegrationRequest = [
  body('name').notEmpty().withMessage('Name is required'),
  body('type').isIn(Object.values(IntegrationType)).withMessage('Invalid integration type'),
  body('enabled').isBoolean().withMessage('Enabled must be boolean'),
  body('authentication.type').isIn(['api_key', 'oauth2', 'jwt', 'basic', 'custom']).withMessage('Invalid authentication type'),
  body('authentication.credentials').isObject().withMessage('Credentials must be an object'),
  body('settings').isObject().withMessage('Settings must be an object')
];

const validateWebhookRequest = [
  body('url').isURL().withMessage('Valid URL is required'),
  body('secret').notEmpty().withMessage('Secret is required'),
  body('events').isArray().withMessage('Events must be an array'),
  body('timeout').isInt({ min: 1000, max: 30000 }).withMessage('Timeout must be between 1000-30000ms'),
  body('retryAttempts').isInt({ min: 0, max: 10 }).withMessage('Retry attempts must be between 0-10'),
  body('retryBackoff').isIn(['linear', 'exponential']).withMessage('Invalid retry backoff strategy'),
  body('signatureMethod').isIn(['hmac-sha256', 'hmac-sha1']).withMessage('Invalid signature method')
];

const validateSyncJobRequest = [
  body('integrationId').notEmpty().withMessage('Integration ID is required'),
  body('type').isIn(['full', 'incremental', 'custom']).withMessage('Invalid sync type'),
  body('direction').isIn(['inbound', 'outbound', 'bidirectional']).withMessage('Invalid sync direction'),
  body('configuration').isObject().withMessage('Configuration must be an object')
];

// =============================================================================
// INTEGRATION ROUTES
// =============================================================================

/**
 * GET /integrations - Get all integrations
 */
router.get('/', authenticateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, enabled } = req.query;

    let integrations = integrationService.getAllIntegrations();

    // Filter by type if specified
    if (type && typeof type === 'string') {
      integrations = integrations.filter(i => i.type === type);
    }

    // Filter by enabled status if specified
    if (enabled !== undefined) {
      const isEnabled = enabled === 'true';
      integrations = integrations.filter(i => i.enabled === isEnabled);
    }

    res.json({
      success: true,
      data: integrations,
      total: integrations.length
    });

  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch integrations'
    });
  }
});

/**
 * GET /integrations/:id - Get specific integration
 */
router.get('/:id', authenticateApiKey, [
  param('id').isUUID().withMessage('Invalid integration ID')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    const integration = integrationService.getIntegration(req.params.id);

    if (!integration) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Integration not found'
      });
    }

    res.json({
      success: true,
      data: integration
    });

  } catch (error) {
    console.error('Error fetching integration:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch integration'
    });
  }
});

/**
 * POST /integrations - Create new integration
 */
router.post('/', authenticateApiKey, validateIntegrationRequest, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    const { name, type, enabled, authentication, settings, rateLimit, dataMapping } = req.body;

    const integration = await integrationService.createIntegration({
      name,
      type,
      enabled,
      authentication,
      settings,
      rateLimit,
      dataMapping
    });

    res.status(201).json({
      success: true,
      data: integration,
      message: 'Integration created successfully'
    });

  } catch (error) {
    console.error('Error creating integration:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unsupported integration type')) {
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
      message: 'Failed to create integration'
    });
  }
});

/**
 * PUT /integrations/:id - Update integration
 */
router.put('/:id', authenticateApiKey, [
  param('id').isUUID().withMessage('Invalid integration ID'),
  ...validateIntegrationRequest
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    const integration = await integrationService.updateIntegration(req.params.id, req.body);

    res.json({
      success: true,
      data: integration,
      message: 'Integration updated successfully'
    });

  } catch (error) {
    console.error('Error updating integration:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'not_found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to update integration'
    });
  }
});

/**
 * DELETE /integrations/:id - Delete integration
 */
router.delete('/:id', authenticateApiKey, [
  param('id').isUUID().withMessage('Invalid integration ID')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    await integrationService.deleteIntegration(req.params.id);

    res.json({
      success: true,
      message: 'Integration deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting integration:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'not_found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to delete integration'
    });
  }
});

/**
 * POST /integrations/:id/test - Test integration connection
 */
router.post('/:id/test', authenticateApiKey, [
  param('id').isUUID().withMessage('Invalid integration ID')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    const integration = integrationService.getIntegration(req.params.id);
    if (!integration) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Integration not found'
      });
    }

    // Create test event
    const testEvent = {
      id: 'test-' + Date.now(),
      type: 'page_view' as any,
      sessionId: 'test-session',
      visitorId: 'test-visitor',
      timestamp: new Date(),
      processed: true,
      enriched: true,
      aggregated: false,
      processingTime: 0,
      pipeline: [],
      data: {
        page: '/test',
        title: 'Test Page',
        source: 'integration-test'
      }
    };

    // Send test event
    await integrationService.forwardEvent(testEvent);

    res.json({
      success: true,
      message: 'Test event sent successfully',
      testEvent: {
        id: testEvent.id,
        type: testEvent.type,
        timestamp: testEvent.timestamp
      }
    });

  } catch (error) {
    console.error('Error testing integration:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to test integration'
    });
  }
});

// =============================================================================
// WEBHOOK ROUTES
// =============================================================================

/**
 * POST /integrations/webhooks - Create webhook
 */
router.post('/webhooks', authenticateApiKey, validateWebhookRequest, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    const webhookId = await integrationService.createWebhook(req.body);

    res.status(201).json({
      success: true,
      data: { id: webhookId },
      message: 'Webhook created successfully'
    });

  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to create webhook'
    });
  }
});

/**
 * POST /integrations/webhooks/:id/trigger - Trigger webhook manually
 */
router.post('/webhooks/:id/trigger', authenticateApiKey, [
  param('id').isUUID().withMessage('Invalid webhook ID'),
  body('event').notEmpty().withMessage('Event name is required'),
  body('payload').isObject().withMessage('Payload must be an object')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    const { event, payload } = req.body;
    const delivery = await integrationService.triggerWebhook(req.params.id, event, payload);

    res.json({
      success: true,
      data: delivery,
      message: 'Webhook triggered successfully'
    });

  } catch (error) {
    console.error('Error triggering webhook:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'not_found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to trigger webhook'
    });
  }
});

// =============================================================================
// SYNC JOB ROUTES
// =============================================================================

/**
 * GET /integrations/sync-jobs - Get all sync jobs
 */
router.get('/sync-jobs', authenticateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { integrationId, status } = req.query;

    let syncJobs = integrationService.getAllSyncJobs();

    // Filter by integration if specified
    if (integrationId && typeof integrationId === 'string') {
      syncJobs = syncJobs.filter(job => job.integrationId === integrationId);
    }

    // Filter by status if specified
    if (status && typeof status === 'string') {
      syncJobs = syncJobs.filter(job => job.status === status);
    }

    res.json({
      success: true,
      data: syncJobs,
      total: syncJobs.length
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
 * GET /integrations/sync-jobs/:id - Get specific sync job
 */
router.get('/sync-jobs/:id', authenticateApiKey, [
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

    const syncJob = integrationService.getSyncJob(req.params.id);

    if (!syncJob) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Sync job not found'
      });
    }

    res.json({
      success: true,
      data: syncJob
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
 * POST /integrations/sync-jobs - Create new sync job
 */
router.post('/sync-jobs', authenticateApiKey, validateSyncJobRequest, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_error',
        details: errors.array()
      });
    }

    const syncJob = await integrationService.createSyncJob(req.body);

    res.status(201).json({
      success: true,
      data: syncJob,
      message: 'Sync job created successfully'
    });

  } catch (error) {
    console.error('Error creating sync job:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'integration_not_found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to create sync job'
    });
  }
});

/**
 * POST /integrations/sync-jobs/:id/cancel - Cancel sync job
 */
router.post('/sync-jobs/:id/cancel', authenticateApiKey, [
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

    await integrationService.cancelSyncJob(req.params.id);

    res.json({
      success: true,
      message: 'Sync job cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling sync job:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'not_found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to cancel sync job'
    });
  }
});

// =============================================================================
// INTEGRATION TYPES ROUTE
// =============================================================================

/**
 * GET /integrations/types - Get available integration types
 */
router.get('/types', authenticateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const types = Object.values(IntegrationType).map(type => ({
      type,
      name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      category: getIntegrationCategory(type)
    }));

    res.json({
      success: true,
      data: types
    });

  } catch (error) {
    console.error('Error fetching integration types:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch integration types'
    });
  }
});

// Helper function to categorize integrations
function getIntegrationCategory(type: IntegrationType): string {
  switch (type) {
    case IntegrationType.GOOGLE_ANALYTICS:
    case IntegrationType.ADOBE_ANALYTICS:
    case IntegrationType.MIXPANEL:
    case IntegrationType.SEGMENT:
      return 'analytics';
    case IntegrationType.HUBSPOT:
    case IntegrationType.SALESFORCE:
      return 'crm';
    case IntegrationType.SLACK:
      return 'communication';
    case IntegrationType.WEBHOOK:
      return 'webhook';
    case IntegrationType.CUSTOM:
      return 'custom';
    default:
      return 'other';
  }
}

// =============================================================================
// HEALTH CHECK ROUTE
// =============================================================================

/**
 * GET /integrations/health - Get integration service health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const integrations = integrationService.getAllIntegrations();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      integrations: {
        total: integrations.length,
        enabled: integrations.filter(i => i.enabled).length,
        byType: integrations.reduce((acc, i) => {
          acc[i.type] = (acc[i.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    res.json(health);

  } catch (error) {
    console.error('Error checking integration service health:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

export default router;
