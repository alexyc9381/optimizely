import { NextFunction, Request, Response, Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import RealTimeNotificationService from '../services/real-time-notification-service';
import { redisManager } from '../services/redis-client';

const router = Router();
let notificationService: RealTimeNotificationService;

// Initialize service
const initializeService = async () => {
  if (!notificationService) {
    notificationService = new RealTimeNotificationService(redisManager.getClient());
    notificationService.generateMockData(); // Initialize with mock data
  }
  return notificationService;
};

// Authentication middleware placeholder
const authenticateRequest = (req: Request, res: Response, next: NextFunction) => {
  // In production, implement proper JWT/API key validation
  req.user = { id: 'user_123', role: 'admin' };
  next();
};

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
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
// DASHBOARD AND OVERVIEW ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/notifications/overview
 * @desc Get comprehensive notification system dashboard
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/overview', authenticateRequest, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const [
      analytics,
      healthStatus,
      channels,
      templates,
      rules,
      recentMessages
    ] = await Promise.all([
      service.getAnalytics(),
      service.healthCheck(),
      service.getChannels(),
      service.getTemplates({ isActive: true }),
      service.getRules({ isActive: true }),
      service.getMessages({ statuses: ['sent', 'delivered', 'failed'] })
    ]);

    const overview = {
      summary: {
        totalChannels: channels.length,
        activeChannels: channels.filter(c => c.enabled).length,
        totalTemplates: templates.length,
        activeRules: rules.length,
        queueSize: healthStatus.queueSize,
        systemStatus: healthStatus.status
      },
      analytics,
      healthStatus,
      channels: channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        enabled: channel.enabled,
        priority: channel.priority
      })),
      recentActivity: recentMessages.slice(0, 10).map(msg => ({
        id: msg.id,
        channel: msg.channel,
        recipient: msg.recipient.identifier,
        status: msg.status,
        priority: msg.priority,
        sentAt: msg.sentAt,
        subject: msg.subject?.substring(0, 50) + (msg.subject && msg.subject.length > 50 ? '...' : '')
      }))
    };

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting notification overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification overview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// CHANNEL MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/notifications/channels
 * @desc Get all notification channels
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/channels', [
  authenticateRequest,
  query('type').optional().isString(),
  query('enabled').optional().isBoolean()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const filters: any = {};
    if (req.query.type) filters.type = req.query.type as string;
    if (req.query.enabled !== undefined) filters.enabled = req.query.enabled === 'true';

    const channels = service.getChannels(filters);

    res.json({
      success: true,
      data: {
        channels,
        summary: {
          total: channels.length,
          enabled: channels.filter(c => c.enabled).length,
          byType: channels.reduce((acc, channel) => {
            acc[channel.type] = (acc[channel.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting channels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get channels',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/notifications/channels/:id
 * @desc Get specific notification channel
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/channels/:id', authenticateRequest, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();
    const channel = service.getChannel(req.params.id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found',
        channelId: req.params.id
      });
    }

    res.json({
      success: true,
      data: channel,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting channel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get channel',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/notifications/channels
 * @desc Create new notification channel
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/channels', [
  authenticateRequest,
  body('name').notEmpty().trim(),
  body('type').isIn(['email', 'sms', 'push', 'webhook', 'slack', 'teams', 'in_app', 'custom']),
  body('enabled').isBoolean(),
  body('priority').isIn(['low', 'medium', 'high', 'critical']),
  body('config').isObject(),
  body('rateLimits').isObject(),
  body('retryPolicy').isObject()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const channelData = {
      name: req.body.name,
      type: req.body.type,
      enabled: req.body.enabled,
      config: req.body.config,
      priority: req.body.priority,
      rateLimits: req.body.rateLimits,
      retryPolicy: req.body.retryPolicy,
      deliveryWindows: req.body.deliveryWindows
    };

    const channel = await service.createChannel(channelData);

    res.status(201).json({
      success: true,
      data: channel,
      message: 'Channel created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create channel',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route PUT /api/v1/notifications/channels/:id
 * @desc Update notification channel
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.put('/channels/:id', [
  authenticateRequest,
  body('name').optional().notEmpty().trim(),
  body('enabled').optional().isBoolean(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('config').optional().isObject(),
  body('rateLimits').optional().isObject(),
  body('retryPolicy').optional().isObject()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();
    const channel = await service.updateChannel(req.params.id, req.body);

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found',
        channelId: req.params.id
      });
    }

    res.json({
      success: true,
      data: channel,
      message: 'Channel updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update channel',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// TEMPLATE MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/notifications/templates
 * @desc Get all notification templates
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/templates', [
  authenticateRequest,
  query('channel').optional().isString(),
  query('isActive').optional().isBoolean()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const filters: any = {};
    if (req.query.channel) filters.channel = req.query.channel as string;
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

    const templates = service.getTemplates(filters);

    res.json({
      success: true,
      data: {
        templates,
        summary: {
          total: templates.length,
          active: templates.filter(t => t.isActive).length,
          byChannel: templates.reduce((acc, template) => {
            acc[template.channel] = (acc[template.channel] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/notifications/templates
 * @desc Create new notification template
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/templates', [
  authenticateRequest,
  body('name').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('channel').notEmpty().trim(),
  body('content').notEmpty().trim(),
  body('variables').isArray(),
  body('isActive').isBoolean()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const templateData = {
      name: req.body.name,
      description: req.body.description,
      channel: req.body.channel,
      subject: req.body.subject,
      content: req.body.content,
      variables: req.body.variables,
      metadata: req.body.metadata || {},
      isActive: req.body.isActive
    };

    const template = await service.createTemplate(templateData);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// RULE MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/notifications/rules
 * @desc Get all notification rules
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/rules', [
  authenticateRequest,
  query('isActive').optional().isBoolean(),
  query('event').optional().isString()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const filters: any = {};
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
    if (req.query.event) filters.event = req.query.event as string;

    const rules = service.getRules(filters);

    res.json({
      success: true,
      data: {
        rules,
        summary: {
          total: rules.length,
          active: rules.filter(r => r.isActive).length,
          byEvent: rules.reduce((acc, rule) => {
            acc[rule.trigger.event] = (acc[rule.trigger.event] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rules',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/notifications/rules
 * @desc Create new notification rule
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/rules', [
  authenticateRequest,
  body('name').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('trigger').isObject(),
  body('actions').isArray(),
  body('isActive').isBoolean()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const ruleData = {
      name: req.body.name,
      description: req.body.description,
      trigger: req.body.trigger,
      actions: req.body.actions,
      isActive: req.body.isActive
    };

    const rule = await service.createRule(ruleData);

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Rule created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// RECIPIENT MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/notifications/recipients
 * @desc Get all notification recipients
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/recipients', [
  authenticateRequest,
  query('type').optional().isString()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const filters: any = {};
    if (req.query.type) filters.type = req.query.type as string;

    const recipients = service.getRecipients(filters);

    res.json({
      success: true,
      data: {
        recipients,
        summary: {
          total: recipients.length,
          byType: recipients.reduce((acc, recipient) => {
            acc[recipient.type] = (acc[recipient.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting recipients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recipients',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/notifications/recipients
 * @desc Create new notification recipient
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/recipients', [
  authenticateRequest,
  body('type').isIn(['user', 'group', 'role', 'external']),
  body('identifier').notEmpty().trim(),
  body('preferences').isObject()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const recipientData = {
      type: req.body.type,
      identifier: req.body.identifier,
      preferences: req.body.preferences,
      metadata: req.body.metadata || {}
    };

    const recipient = await service.createRecipient(recipientData);

    res.status(201).json({
      success: true,
      data: recipient,
      message: 'Recipient created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating recipient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create recipient',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// EVENT PROCESSING ENDPOINTS
// =============================================================================

/**
 * @route POST /api/v1/notifications/events
 * @desc Process notification event and trigger rules
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/events', [
  authenticateRequest,
  body('type').notEmpty().trim(),
  body('source').notEmpty().trim(),
  body('data').isObject(),
  body('severity').optional().isIn(['info', 'warning', 'error', 'critical'])
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: req.body.type,
      source: req.body.source,
      data: req.body.data,
      timestamp: new Date(),
      severity: req.body.severity || 'info',
      metadata: req.body.metadata || {}
    };

    await service.processEvent(event);

    res.status(201).json({
      success: true,
      data: {
        eventId: event.id,
        processed: true
      },
      message: 'Event processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// MESSAGE AND DELIVERY ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/notifications/messages
 * @desc Get notification messages with filtering
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/messages', [
  authenticateRequest,
  query('channels').optional().isString(),
  query('statuses').optional().isString(),
  query('priorities').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const filters: any = {};
    if (req.query.channels) filters.channels = (req.query.channels as string).split(',');
    if (req.query.statuses) filters.statuses = (req.query.statuses as string).split(',');
    if (req.query.priorities) filters.priorities = (req.query.priorities as string).split(',');

    const messages = await service.getMessages(filters);

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const paginatedMessages = messages.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        messages: paginatedMessages,
        pagination: {
          total: messages.length,
          limit,
          offset,
          hasMore: offset + limit < messages.length
        },
        summary: {
          total: messages.length,
          byStatus: messages.reduce((acc, msg) => {
            acc[msg.status] = (acc[msg.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          byChannel: messages.reduce((acc, msg) => {
            acc[msg.channel] = (acc[msg.channel] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get messages',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// ANALYTICS ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/notifications/analytics
 * @desc Get comprehensive notification analytics
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/analytics', [
  authenticateRequest,
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('channels').optional().isString()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const filters: any = {};
    if (req.query.startDate && req.query.endDate) {
      filters.dateRange = {
        start: new Date(req.query.startDate as string),
        end: new Date(req.query.endDate as string)
      };
    }
    if (req.query.channels) {
      filters.channels = (req.query.channels as string).split(',');
    }

    const analytics = await service.getAnalytics(filters);

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
      filters
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// HEALTH CHECK ENDPOINT
// =============================================================================

/**
 * @route GET /api/v1/notifications/health
 * @desc Health check endpoint
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const service = await initializeService();
    const health = await service.healthCheck();

    res.json({
      success: true,
      data: health,
      message: 'Real-time notification service is operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// TESTING AND DEMO ENDPOINTS
// =============================================================================

/**
 * @route POST /api/v1/notifications/test
 * @desc Send test notification
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/test', [
  authenticateRequest,
  body('channel').notEmpty().trim(),
  body('recipient').notEmpty().trim(),
  body('message').notEmpty().trim()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    // Create test event
    const testEvent = {
      id: `test_${Date.now()}`,
      type: 'test_notification',
      source: 'api_test',
      data: {
        channel: req.body.channel,
        recipient: req.body.recipient,
        message: req.body.message,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date(),
      severity: 'info' as const,
      metadata: { test: true }
    };

    await service.processEvent(testEvent);

    res.json({
      success: true,
      data: {
        eventId: testEvent.id,
        message: 'Test notification sent successfully'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
