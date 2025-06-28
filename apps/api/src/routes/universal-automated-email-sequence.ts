import cors from 'cors';
import express, { Request, Response, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { redisManager } from '../services/redis-client';
import UniversalAutomatedEmailSequenceEngine from '../services/universal-automated-email-sequence-engine';

const router = Router();

// Initialize service
const emailSequenceEngine = new UniversalAutomatedEmailSequenceEngine(redisManager.getClient());

// Initialize the engine when routes are loaded
emailSequenceEngine.initialize().catch(console.error);

// Security middleware
router.use(helmet());
router.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Rate limiting
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
}) as any;

const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Higher limit for read operations
  message: 'Too many requests from this IP, please try again later.'
}) as any;

// =============================================================================
// Template Management Routes
// =============================================================================

// Create email template
router.post('/templates', createLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const template = await emailSequenceEngine.createTemplate(req.body);
    res.status(201).json({
      success: true,
      data: template,
      message: 'Email template created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to create email template'
    });
  }
});

// Get email template by ID
router.get('/templates/:id', readLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const template = await emailSequenceEngine.getTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }
    res.json({
      success: true,
      data: template
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get email template'
    });
  }
});

// Update email template
router.put('/templates/:id', createLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const template = await emailSequenceEngine.updateTemplate(req.params.id, req.body);
    res.json({
      success: true,
      data: template,
      message: 'Email template updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to update email template'
    });
  }
});

// Delete email template
router.delete('/templates/:id', createLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const deleted = await emailSequenceEngine.deleteTemplate(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }
    res.json({
      success: true,
      message: 'Email template deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to delete email template'
    });
  }
});

// List email templates with filtering
router.get('/templates', readLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const filters = {
      type: req.query.type as string,
      status: req.query.status as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      search: req.query.search as string
    };

    const templates = await emailSequenceEngine.listTemplates(filters);
    res.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to list email templates'
    });
  }
});

// Create A/B test for template
router.post('/templates/:id/ab-test', createLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const variants = await emailSequenceEngine.createTemplateABTest(req.params.id, req.body.variants);
    res.status(201).json({
      success: true,
      data: variants,
      message: 'A/B test created successfully for template'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to create A/B test for template'
    });
  }
});

// =============================================================================
// Email Sequence Management Routes
// =============================================================================

// Create email sequence
router.post('/sequences', createLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const sequence = await emailSequenceEngine.createSequence(req.body);
    res.status(201).json({
      success: true,
      data: sequence,
      message: 'Email sequence created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to create email sequence'
    });
  }
});

// Get email sequence by ID
router.get('/sequences/:id', readLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const sequence = await emailSequenceEngine.getSequence(req.params.id);
    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Email sequence not found'
      });
    }
    res.json({
      success: true,
      data: sequence
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get email sequence'
    });
  }
});

// Update email sequence
router.put('/sequences/:id', createLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const sequence = await emailSequenceEngine.updateSequence(req.params.id, req.body);
    res.json({
      success: true,
      data: sequence,
      message: 'Email sequence updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to update email sequence'
    });
  }
});

// Delete email sequence
router.delete('/sequences/:id', createLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const deleted = await emailSequenceEngine.deleteSequence(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Email sequence not found'
      });
    }
    res.json({
      success: true,
      message: 'Email sequence deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to delete email sequence'
    });
  }
});

// =============================================================================
// Contact Management Routes
// =============================================================================

// Add contact to sequence
router.post('/sequences/:sequenceId/contacts/:contactId', createLimiter, async (req: express.Request, res: express.Response) => {
  try {
    await emailSequenceEngine.addContactToSequence(req.params.contactId, req.params.sequenceId);
    res.status(201).json({
      success: true,
      message: 'Contact added to sequence successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to add contact to sequence'
    });
  }
});

// Remove contact from sequence
router.delete('/sequences/:sequenceId/contacts/:contactId', createLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const removed = await emailSequenceEngine.removeContactFromSequence(req.params.sequenceId, req.params.contactId);
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found in sequence'
      });
    }
    res.json({
      success: true,
      message: 'Contact removed from sequence successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to remove contact from sequence'
    });
  }
});

// =============================================================================
// Behavioral Trigger Routes
// =============================================================================

// Create behavioral trigger
router.post('/triggers', createLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const trigger = await emailSequenceEngine.createBehavioralTrigger(req.body);
    res.status(201).json({
      success: true,
      data: trigger,
      message: 'Behavioral trigger created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to create behavioral trigger'
    });
  }
});

// Process behavioral event
router.post('/events/:eventType/contacts/:contactId', createLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const result = await emailSequenceEngine.processBehavioralEvent(
      req.params.eventType,
      req.params.contactId,
      req.body
    );
    res.json({
      success: true,
      data: result,
      message: 'Behavioral event processed successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to process behavioral event'
    });
  }
});

// =============================================================================
// Email Sending Routes
// =============================================================================

// Send individual email
router.post('/emails/send', createLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const result = await emailSequenceEngine.sendEmail(req.body);
    res.json({
      success: true,
      data: result,
      message: 'Email sent successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send email'
    });
  }
});

// =============================================================================
// Deliverability Management Routes
// =============================================================================

// Update deliverability settings
router.put('/deliverability/settings', createLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const settings = await emailSequenceEngine.updateDeliverabilitySettings(req.body);
    res.json({
      success: true,
      data: settings,
      message: 'Deliverability settings updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to update deliverability settings'
    });
  }
});

// Get deliverability metrics
router.get('/deliverability/metrics', readLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const metrics = await emailSequenceEngine.getDeliverabilityMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get deliverability metrics'
    });
  }
});

// =============================================================================
// Analytics and Reporting Routes
// =============================================================================

// Get email analytics
router.get('/analytics', readLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const analytics = await emailSequenceEngine.getEmailAnalytics({
      start: startDate,
      end: endDate
    });
    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get email analytics'
    });
  }
});

// =============================================================================
// Health Check Route
// =============================================================================

// Health check
router.get('/health', readLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const health = await emailSequenceEngine.getHealth();
    const statusCode = health.status === 'healthy' ? 200 :
                      health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: health.status !== 'unhealthy',
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      error: error.message,
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// =============================================================================
// Comprehensive API Documentation Route
// =============================================================================

router.get('/docs', (req: Request, res: Response) => {
  const documentation = {
    service: 'Universal Automated Email Sequence Engine',
    version: '1.0.0',
    description: 'Complete email automation platform with template management, sequence automation, behavioral triggers, A/B testing, and deliverability optimization',
    baseUrl: '/api/v1/email-automation',
    endpoints: {
      templates: {
        'POST /templates': 'Create email template',
        'GET /templates/:id': 'Get email template by ID',
        'PUT /templates/:id': 'Update email template',
        'DELETE /templates/:id': 'Delete email template',
        'GET /templates': 'List email templates with filtering',
        'POST /templates/:id/ab-test': 'Create A/B test for template'
      },
      sequences: {
        'POST /sequences': 'Create email sequence',
        'GET /sequences/:id': 'Get email sequence by ID',
        'PUT /sequences/:id': 'Update email sequence',
        'DELETE /sequences/:id': 'Delete email sequence'
      },
      contacts: {
        'POST /sequences/:sequenceId/contacts/:contactId': 'Add contact to sequence',
        'DELETE /sequences/:sequenceId/contacts/:contactId': 'Remove contact from sequence'
      },
      triggers: {
        'POST /triggers': 'Create behavioral trigger',
        'POST /events/:eventType/contacts/:contactId': 'Process behavioral event'
      },
      emails: {
        'POST /emails/send': 'Send email'
      },
      deliverability: {
        'PUT /deliverability/settings': 'Update deliverability settings',
        'GET /deliverability/metrics': 'Get deliverability metrics'
      },
      analytics: {
        'GET /analytics': 'Get email analytics (with date range parameters)'
      },
      system: {
        'GET /health': 'Service health check',
        'GET /docs': 'API documentation'
      }
    },
    features: {
      'Template Management': 'CRUD operations for email templates with A/B testing',
      'Sequence Automation': 'Multi-step email sequences with conditional logic',
      'Behavioral Triggers': 'Event-driven email automation based on user behavior',
      'Contact Management': 'Enroll and manage contacts in sequences',
      'A/B Testing': 'Template and sequence variant testing',
      'Deliverability Optimization': 'Email deliverability monitoring and optimization',
      'Analytics': 'Comprehensive email performance analytics',
      'Real-time Processing': 'Event-driven architecture with real-time processing',
      'Universal Platform Support': 'Platform-agnostic design with universal CORS',
      'Enterprise Scale': 'Redis-based persistence for high-performance operations'
    },
    rateLimits: {
      'Create/Update/Delete Operations': '100 requests per 15 minutes',
      'Read Operations': '500 requests per 15 minutes'
    },
    authentication: 'API supports standard authentication headers',
    cors: 'Universal CORS enabled for all platforms'
  };

  res.json(documentation);
});

export default router;
