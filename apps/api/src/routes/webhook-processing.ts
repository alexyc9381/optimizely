import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import WebhookProcessingService from '../services/webhook-processing-service';

const router = express.Router();
const webhookProcessingService = new WebhookProcessingService();

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

const handleValidationErrors = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// =============================================================================
// WEBHOOK ENDPOINT MANAGEMENT
// =============================================================================

/**
 * GET /endpoints - Get all webhook endpoints
 */
router.get('/endpoints', [
  query('crmType').optional().isIn(['salesforce', 'hubspot', 'pipedrive', 'zoho', 'custom']),
  query('active').optional().isBoolean(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { crmType, active } = req.query;

    let endpoints = webhookProcessingService.getEndpoints(crmType as string);

    if (active !== undefined) {
      const isActive = active === 'true';
      endpoints = endpoints.filter(e => e.isActive === isActive);
    }

    res.json({
      success: true,
      data: endpoints,
      total: endpoints.length,
      summary: {
        totalEndpoints: endpoints.length,
        activeEndpoints: endpoints.filter(e => e.isActive).length,
        crmTypes: [...new Set(endpoints.map(e => e.crmType))]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get webhook endpoints'
    });
  }
});

/**
 * POST /endpoints - Create a new webhook endpoint
 */
router.post('/endpoints', [
  body('name').notEmpty().withMessage('Name is required'),
  body('crmType').isIn(['salesforce', 'hubspot', 'pipedrive', 'zoho', 'custom']).withMessage('Invalid CRM type'),
  body('crmInstanceId').notEmpty().withMessage('CRM instance ID is required'),
  body('events').isArray().withMessage('Events must be an array'),
  body('events.*').notEmpty().withMessage('Event names cannot be empty'),
  body('isActive').optional().isBoolean(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { name, crmType, crmInstanceId, events, isActive } = req.body;

    const endpointId = await webhookProcessingService.createEndpoint({
      name,
      crmType,
      crmInstanceId,
      events,
      isActive
    });

    const endpoint = webhookProcessingService.getEndpoint(endpointId);

    res.status(201).json({
      success: true,
      data: {
        endpointId,
        endpoint,
        webhookUrl: `/api/v1/webhook-processing/receive/${endpointId}`,
        secret: endpoint?.secret
      },
      message: 'Webhook endpoint created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create webhook endpoint'
    });
  }
});

/**
 * GET /endpoints/:endpointId - Get specific webhook endpoint
 */
router.get('/endpoints/:endpointId', [
  param('endpointId').notEmpty().withMessage('Endpoint ID is required'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { endpointId } = req.params;
    const endpoint = webhookProcessingService.getEndpoint(endpointId);

    if (!endpoint) {
      return res.status(404).json({
        success: false,
        error: 'Webhook endpoint not found'
      });
    }

    res.json({
      success: true,
      data: endpoint,
      webhookUrl: `/api/v1/webhook-processing/receive/${endpointId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get webhook endpoint'
    });
  }
});

/**
 * PUT /endpoints/:endpointId - Update webhook endpoint
 */
router.put('/endpoints/:endpointId', [
  param('endpointId').notEmpty().withMessage('Endpoint ID is required'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('events').optional().isArray().withMessage('Events must be an array'),
  body('isActive').optional().isBoolean(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { endpointId } = req.params;
    const updates = req.body;

    const success = await webhookProcessingService.updateEndpoint(endpointId, updates);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Webhook endpoint not found'
      });
    }

    const updatedEndpoint = webhookProcessingService.getEndpoint(endpointId);

    res.json({
      success: true,
      data: updatedEndpoint,
      message: 'Webhook endpoint updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update webhook endpoint'
    });
  }
});

/**
 * DELETE /endpoints/:endpointId - Delete webhook endpoint
 */
router.delete('/endpoints/:endpointId', [
  param('endpointId').notEmpty().withMessage('Endpoint ID is required'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { endpointId } = req.params;
    const success = await webhookProcessingService.deleteEndpoint(endpointId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Webhook endpoint not found'
      });
    }

    res.json({
      success: true,
      message: 'Webhook endpoint deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete webhook endpoint'
    });
  }
});

// =============================================================================
// WEBHOOK RECEIVING
// =============================================================================

/**
 * POST /receive/:endpointId - Receive webhook from CRM platform
 */
router.post('/receive/:endpointId', [
  param('endpointId').notEmpty().withMessage('Endpoint ID is required'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { endpointId } = req.params;
    const payload = req.body;
    const headers = req.headers as Record<string, string>;

    const webhookId = await webhookProcessingService.processIncomingWebhook(
      endpointId,
      payload,
      headers
    );

    res.status(200).json({
      success: true,
      data: {
        webhookId,
        status: 'received',
        message: 'Webhook received and queued for processing'
      }
    });
  } catch (error) {
    console.error('Webhook processing error:', error);

    // Return appropriate status codes based on error type
    let statusCode = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) statusCode = 404;
      else if (error.message.includes('inactive')) statusCode = 403;
      else if (error.message.includes('Rate limit')) statusCode = 429;
      else if (error.message.includes('signature')) statusCode = 401;
      else if (error.message.includes('queue is full')) statusCode = 503;
    }

    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process webhook'
    });
  }
});

// =============================================================================
// WEBHOOK MONITORING & STATUS
// =============================================================================

/**
 * GET /webhooks - Get webhook processing history
 */
router.get('/webhooks', [
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'retrying']),
  query('endpointId').optional().notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { status, endpointId, limit = 50, offset = 0 } = req.query;
    const queue = webhookProcessingService.getWebhookQueue();

    let allWebhooks = [
      ...queue.pending,
      ...queue.processing,
      ...queue.failed,
      ...queue.completed
    ];

    // Filter by status
    if (status) {
      allWebhooks = allWebhooks.filter(w => w.status === status);
    }

    // Filter by endpoint
    if (endpointId) {
      allWebhooks = allWebhooks.filter(w => w.endpointId === endpointId);
    }

    // Sort by timestamp (newest first)
    allWebhooks.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Pagination
    const total = allWebhooks.length;
    const webhooks = allWebhooks.slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      success: true,
      data: webhooks,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < total
      },
      summary: {
        pending: queue.pending.length,
        processing: queue.processing.length,
        completed: queue.completed.length,
        failed: queue.failed.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get webhooks'
    });
  }
});

/**
 * GET /webhooks/:webhookId - Get specific webhook details
 */
router.get('/webhooks/:webhookId', [
  param('webhookId').notEmpty().withMessage('Webhook ID is required'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const webhook = webhookProcessingService.getWebhook(webhookId);

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      });
    }

    const endpoint = webhookProcessingService.getEndpoint(webhook.endpointId);

    res.json({
      success: true,
      data: {
        webhook,
        endpoint: endpoint ? {
          id: endpoint.id,
          name: endpoint.name,
          crmType: endpoint.crmType,
          crmInstanceId: endpoint.crmInstanceId
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get webhook'
    });
  }
});

/**
 * GET /queue - Get current webhook queue status
 */
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const queue = webhookProcessingService.getWebhookQueue();
    const metrics = webhookProcessingService.getMetrics();

    res.json({
      success: true,
      data: {
        queue: {
          pending: queue.pending.length,
          processing: queue.processing.length,
          completed: queue.completed.length,
          failed: queue.failed.length
        },
        capacity: {
          maxConcurrentProcessing: metrics?.processingCapacity || 0,
          currentProcessing: queue.processing.length,
          maxQueueSize: 1000,
          currentQueueSize: queue.pending.length + queue.processing.length
        },
        recentWebhooks: {
          pending: queue.pending.slice(0, 5),
          processing: queue.processing.slice(0, 5),
          recentCompleted: queue.completed
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 5),
          recentFailed: queue.failed
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 5)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get queue status'
    });
  }
});

// =============================================================================
// METRICS & ANALYTICS
// =============================================================================

/**
 * GET /metrics - Get webhook processing metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await webhookProcessingService.calculateMetrics();

    res.json({
      success: true,
      data: metrics,
      insights: {
        healthStatus: metrics.errorRate < 0.1 ? 'healthy' : metrics.errorRate < 0.3 ? 'warning' : 'critical',
        queueUtilization: (metrics.queueSize / 1000) * 100, // Percentage of max queue size
        processingUtilization: (metrics.queueSize / metrics.processingCapacity) * 100,
        recommendations: generateRecommendations(metrics)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get metrics'
    });
  }
});

/**
 * GET /metrics/endpoints - Get per-endpoint metrics
 */
router.get('/metrics/endpoints', async (req: Request, res: Response) => {
  try {
    const endpoints = webhookProcessingService.getEndpoints();

    const endpointMetrics = endpoints.map(endpoint => ({
      id: endpoint.id,
      name: endpoint.name,
      crmType: endpoint.crmType,
      isActive: endpoint.isActive,
      stats: endpoint.stats,
      performance: {
        successRate: endpoint.stats.totalReceived > 0
          ? (endpoint.stats.totalProcessed / endpoint.stats.totalReceived) * 100
          : 0,
        failureRate: endpoint.stats.errorRate * 100,
        avgProcessingTime: endpoint.stats.averageProcessingTime
      }
    }));

    // Sort by total received (most active first)
    endpointMetrics.sort((a, b) => b.stats.totalReceived - a.stats.totalReceived);

    res.json({
      success: true,
      data: endpointMetrics,
      summary: {
        totalEndpoints: endpoints.length,
        activeEndpoints: endpoints.filter(e => e.isActive).length,
        totalWebhooksReceived: endpoints.reduce((sum, e) => sum + e.stats.totalReceived, 0),
        averageSuccessRate: endpointMetrics.length > 0
          ? endpointMetrics.reduce((sum, e) => sum + e.performance.successRate, 0) / endpointMetrics.length
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get endpoint metrics'
    });
  }
});

/**
 * GET /health - Get webhook processing service health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await webhookProcessingService.getHealthStatus();
    const metrics = webhookProcessingService.getMetrics();

    res.json({
      success: true,
      data: {
        status: health.status,
        details: health.details,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        metrics: metrics ? {
          totalEndpoints: metrics.totalEndpoints,
          activeEndpoints: metrics.activeEndpoints,
          queueSize: metrics.queueSize,
          errorRate: metrics.errorRate,
          averageProcessingTime: metrics.averageProcessingTime
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get health status'
    });
  }
});

// =============================================================================
// WEBHOOK PROCESSING MANAGEMENT
// =============================================================================

/**
 * POST /webhooks/:webhookId/retry - Retry failed webhook processing
 */
router.post('/webhooks/:webhookId/retry', [
  param('webhookId').notEmpty().withMessage('Webhook ID is required'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const webhook = webhookProcessingService.getWebhook(webhookId);

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      });
    }

    if (webhook.status !== 'failed') {
      return res.status(400).json({
        success: false,
        error: 'Only failed webhooks can be retried'
      });
    }

    // Reset webhook status and add back to pending queue
    webhook.status = 'pending';
    webhook.error = undefined;

    const queue = webhookProcessingService.getWebhookQueue();

    // Remove from failed queue
    const failedIndex = queue.failed.findIndex(w => w.id === webhookId);
    if (failedIndex !== -1) {
      queue.failed.splice(failedIndex, 1);
    }

    // Add to pending queue
    queue.pending.push(webhook);

    res.json({
      success: true,
      data: webhook,
      message: 'Webhook queued for retry'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retry webhook'
    });
  }
});

/**
 * POST /process - Manually trigger webhook queue processing
 */
router.post('/process', async (req: Request, res: Response) => {
  try {
    await webhookProcessingService.processWebhookQueue();
    const queue = webhookProcessingService.getWebhookQueue();

    res.json({
      success: true,
      data: {
        pending: queue.pending.length,
        processing: queue.processing.length,
        message: 'Webhook queue processing triggered'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process webhook queue'
    });
  }
});

// =============================================================================
// CONFIGURATION & SETTINGS
// =============================================================================

/**
 * GET /processors - Get available webhook processors
 */
router.get('/processors', async (req: Request, res: Response) => {
  try {
    // This would access the processors from the service
    // For now, return the built-in processor information
    const processors = [
      {
        id: 'crm_sync_processor',
        name: 'CRM Data Sync Processor',
        description: 'Processes CRM data changes and triggers sync operations',
        eventTypes: ['contact.created', 'contact.updated', 'contact.deleted', 'company.created', 'company.updated', 'company.deleted', 'deal.created', 'deal.updated', 'deal.deleted'],
        crmTypes: ['salesforce', 'hubspot', 'pipedrive', 'zoho', 'custom'],
        priority: 1,
        isActive: true
      },
      {
        id: 'contact_enrichment_processor',
        name: 'Contact Enrichment Processor',
        description: 'Enriches contact data when contacts are created or updated',
        eventTypes: ['contact.created', 'contact.updated'],
        crmTypes: ['salesforce', 'hubspot', 'pipedrive', 'zoho', 'custom'],
        priority: 2,
        isActive: true
      },
      {
        id: 'lead_scoring_processor',
        name: 'Lead Scoring Processor',
        description: 'Updates lead scores when contacts or deals change',
        eventTypes: ['contact.created', 'contact.updated', 'deal.created', 'deal.updated'],
        crmTypes: ['salesforce', 'hubspot', 'pipedrive', 'zoho', 'custom'],
        priority: 3,
        isActive: true
      },
      {
        id: 'duplicate_detection_processor',
        name: 'Duplicate Detection Processor',
        description: 'Detects duplicate records when new contacts or companies are created',
        eventTypes: ['contact.created', 'company.created'],
        crmTypes: ['salesforce', 'hubspot', 'pipedrive', 'zoho', 'custom'],
        priority: 4,
        isActive: true
      }
    ];

    res.json({
      success: true,
      data: processors,
      total: processors.length,
      summary: {
        activeProcessors: processors.filter(p => p.isActive).length,
        supportedCrmTypes: [...new Set(processors.flatMap(p => p.crmTypes))],
        supportedEventTypes: [...new Set(processors.flatMap(p => p.eventTypes))]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get processors'
    });
  }
});

/**
 * GET /events - Get supported webhook events by CRM type
 */
router.get('/events', [
  query('crmType').optional().isIn(['salesforce', 'hubspot', 'pipedrive', 'zoho', 'custom']),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { crmType } = req.query;

    const eventsByType = {
      salesforce: [
        'contact.created', 'contact.updated', 'contact.deleted',
        'account.created', 'account.updated', 'account.deleted',
        'opportunity.created', 'opportunity.updated', 'opportunity.deleted',
        'lead.created', 'lead.updated', 'lead.deleted',
        'task.created', 'task.updated', 'task.deleted'
      ],
      hubspot: [
        'contact.creation', 'contact.property_change', 'contact.deletion',
        'company.creation', 'company.property_change', 'company.deletion',
        'deal.creation', 'deal.property_change', 'deal.deletion',
        'ticket.creation', 'ticket.property_change', 'ticket.deletion'
      ],
      pipedrive: [
        'person.added', 'person.updated', 'person.deleted',
        'organization.added', 'organization.updated', 'organization.deleted',
        'deal.added', 'deal.updated', 'deal.deleted',
        'activity.added', 'activity.updated', 'activity.deleted'
      ],
      zoho: [
        'contact.created', 'contact.updated', 'contact.deleted',
        'account.created', 'account.updated', 'account.deleted',
        'deal.created', 'deal.updated', 'deal.deleted',
        'lead.created', 'lead.updated', 'lead.deleted'
      ],
      custom: [
        'contact.created', 'contact.updated', 'contact.deleted',
        'company.created', 'company.updated', 'company.deleted',
        'deal.created', 'deal.updated', 'deal.deleted',
        'lead.created', 'lead.updated', 'lead.deleted',
        'task.created', 'task.updated', 'task.deleted',
        'note.created', 'note.updated', 'note.deleted'
      ]
    };

    const result = crmType
      ? { [crmType as string]: eventsByType[crmType as keyof typeof eventsByType] }
      : eventsByType;

    res.json({
      success: true,
      data: result,
      summary: {
        totalCrmTypes: Object.keys(result).length,
        totalEvents: Object.values(result).flat().length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get supported events'
    });
  }
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];

  if (metrics.errorRate > 0.1) {
    recommendations.push('High error rate detected. Review failed webhooks and endpoint configurations.');
  }

  if (metrics.queueSize > 500) {
    recommendations.push('Large queue size detected. Consider increasing processing capacity.');
  }

  if (metrics.averageProcessingTime > 5000) {
    recommendations.push('High average processing time. Review processor efficiency and payload sizes.');
  }

  if (metrics.activeEndpoints < metrics.totalEndpoints * 0.5) {
    recommendations.push('Many inactive endpoints detected. Review and clean up unused endpoints.');
  }

  if (recommendations.length === 0) {
    recommendations.push('System is operating within normal parameters.');
  }

  return recommendations;
}

export default router;
