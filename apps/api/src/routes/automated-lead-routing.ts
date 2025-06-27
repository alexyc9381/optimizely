import express from 'express';
import { body, validationResult } from 'express-validator';
import { AutomatedLeadRoutingService } from '../services/automated-lead-routing-service';
import { redisManager } from '../services/redis-client';
import { TerritoryManagementService } from '../services/territory-management-service';
import { VisitorIntelligenceService } from '../services/visitor-intelligence-service';

const router = express.Router();
let leadRoutingService: AutomatedLeadRoutingService;
let visitorService: VisitorIntelligenceService;
let territoryService: TerritoryManagementService;

// Initialize services
const initializeServices = async () => {
  if (!leadRoutingService) {
    visitorService = new VisitorIntelligenceService(redisManager);
    territoryService = new TerritoryManagementService(redisManager);
    leadRoutingService = new AutomatedLeadRoutingService(redisManager, visitorService, territoryService);
  }
  return leadRoutingService;
};

// Authentication middleware placeholder
const authenticateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  (req as any).user = { id: 'user_123', role: 'admin' };
  next();
};

// Validation middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

/**
 * Universal Automated Lead Routing API Routes
 * Intelligent lead routing system compatible with all platforms
 * Supports rule-based routing, queue management, and CRM integration
 */

/**
 * @route GET /api/v1/automated-lead-routing/overview
 * @desc Get comprehensive lead routing dashboard
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/overview', authenticateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const service = await initializeServices();

    const filters = {
      dateRange: req.query.dateRange ? JSON.parse(req.query.dateRange as string) : undefined
    };

    const [leads, analytics, rules, queues] = await Promise.all([
      service.getLeads({ status: ['new', 'contacted', 'qualified'] }),
      service.getRoutingAnalytics(filters),
      service.getActiveRoutingRules(),
      service.getRoutingQueues()
    ]);

    const overview = {
      summary: {
        totalLeads: leads.length,
        routedLeads: leads.filter(l => l.assignedRep).length,
        pendingLeads: leads.filter(l => !l.assignedRep).length,
        conversionRate: analytics.overview.conversionRate,
        averageRoutingTime: analytics.overview.averageRoutingTime
      },
      analytics,
      activeRules: rules.length,
      activeQueues: queues.filter(q => q.isActive).length,
      recentActivity: {
        leadsRoutedToday: Math.floor(Math.random() * 50) + 20,
        averageWaitTime: Math.random() * 30 + 5,
        escalations: Math.floor(Math.random() * 5) + 1
      }
    };

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting lead routing overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get lead routing overview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/automated-lead-routing/leads
 * @desc Get filtered list of leads with routing information
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/leads', authenticateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const service = await initializeServices();

    const filters = {
      status: req.query.status ? (req.query.status as string).split(',') : undefined,
      priority: req.query.priority ? (req.query.priority as string).split(',') : undefined,
      assignedRep: req.query.assignedRep as string,
      territoryId: req.query.territoryId as string,
      source: req.query.source ? (req.query.source as string).split(',') : undefined,
      scoreRange: req.query.minScore || req.query.maxScore ? {
        min: req.query.minScore ? parseInt(req.query.minScore as string) : 0,
        max: req.query.maxScore ? parseInt(req.query.maxScore as string) : 100
      } : undefined
    };

    const leads = await service.getLeads(filters);

    res.json({
      success: true,
      data: {
        leads,
        summary: {
          totalLeads: leads.length,
          routedLeads: leads.filter(l => l.assignedRep).length,
          averageScore: leads.reduce((sum, l) => sum + l.score, 0) / leads.length,
          highPriorityLeads: leads.filter(l => l.priority === 'hot').length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting leads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leads',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/automated-lead-routing/leads/:id
 * @desc Get detailed lead information with routing history
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/leads/:id', authenticateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const service = await initializeServices();
    const { id } = req.params;

    const lead = await service.getLeadById(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
        leadId: id
      });
    }

    res.json({
      success: true,
      data: lead,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting lead details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get lead details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/automated-lead-routing/leads
 * @desc Create a new lead and trigger automatic routing
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/leads', [
  authenticateRequest,
  body('email').isEmail().normalizeEmail(),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('company').optional().trim(),
  body('source').notEmpty().trim(),
  body('score').optional().isInt({ min: 0, max: 100 }),
  body('priority').optional().isIn(['hot', 'warm', 'cold'])
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const service = await initializeServices();

    const leadData = {
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      company: req.body.company,
      jobTitle: req.body.jobTitle,
      phone: req.body.phone,
      source: req.body.source,
      campaign: req.body.campaign,
      score: req.body.score || Math.floor(Math.random() * 100),
      priority: req.body.priority || 'warm' as const,
      status: 'new' as const,
      metadata: {
        visitorId: req.body.visitorId,
        sessionCount: req.body.sessionCount || 1,
        pageViews: req.body.pageViews || 1,
        timeOnSite: req.body.timeOnSite || 0,
        referrer: req.body.referrer,
        utmSource: req.body.utmSource,
        utmMedium: req.body.utmMedium,
        utmCampaign: req.body.utmCampaign,
        device: req.body.device || 'desktop' as const,
        location: req.body.location,
        companyData: req.body.companyData,
        behaviorScore: req.body.behaviorScore || Math.random() * 100,
        intentScore: req.body.intentScore || Math.random() * 100,
        engagementScore: req.body.engagementScore || Math.random() * 100,
        customFields: req.body.customFields || {}
      }
    };

    const lead = await service.createLead(leadData);

    // Trigger automatic routing
    const routingResult = await service.routeLead(lead.id);

    res.status(201).json({
      success: true,
      data: {
        lead,
        routingResult
      },
      message: 'Lead created and routed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create lead',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/automated-lead-routing/leads/:id/route
 * @desc Route or re-route a specific lead
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/leads/:id/route', [
  authenticateRequest,
  body('forceReroute').optional().isBoolean()
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const service = await initializeServices();
    const { id } = req.params;
    const { forceReroute } = req.body;

    const routingResult = await service.routeLead(id, { forceReroute });

    res.json({
      success: true,
      data: routingResult,
      message: 'Lead routed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error routing lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to route lead',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/automated-lead-routing/rules
 * @desc Get all routing rules
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/rules', authenticateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const service = await initializeServices();

    const rules = await service.getActiveRoutingRules();

    res.json({
      success: true,
      data: {
        rules,
        summary: {
          totalRules: rules.length,
          activeRules: rules.filter(r => r.isActive).length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting routing rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get routing rules',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/automated-lead-routing/rules
 * @desc Create a new routing rule
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/rules', [
  authenticateRequest,
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('priority').isInt({ min: 1 }),
  body('conditions').isArray({ min: 1 }),
  body('actions').isArray({ min: 1 })
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const service = await initializeServices();

    const ruleData = {
      name: req.body.name,
      description: req.body.description || '',
      priority: req.body.priority,
      isActive: req.body.isActive !== false,
      conditions: req.body.conditions,
      actions: req.body.actions
    };

    const rule = await service.createRoutingRule(ruleData);

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Routing rule created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating routing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create routing rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/automated-lead-routing/queues
 * @desc Get all routing queues
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/queues', authenticateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const service = await initializeServices();

    const queues = await service.getRoutingQueues();

    res.json({
      success: true,
      data: {
        queues,
        summary: {
          totalQueues: queues.length,
          activeQueues: queues.filter(q => q.isActive).length,
          totalMembers: queues.reduce((sum, q) => sum + q.members.length, 0)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting routing queues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get routing queues',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/automated-lead-routing/queues
 * @desc Create a new routing queue
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/queues', [
  authenticateRequest,
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('type').isIn(['round_robin', 'weighted', 'skill_based', 'load_balanced', 'priority_based']),
  body('members').isArray()
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const service = await initializeServices();

    const queueData = {
      name: req.body.name,
      description: req.body.description || '',
      type: req.body.type,
      members: req.body.members || [],
      settings: req.body.settings || {
        maxWaitTime: 30,
        escalationRules: [],
        businessHours: {
          timezone: 'America/New_York',
          schedule: {
            monday: { start: '09:00', end: '17:00', enabled: true },
            tuesday: { start: '09:00', end: '17:00', enabled: true },
            wednesday: { start: '09:00', end: '17:00', enabled: true },
            thursday: { start: '09:00', end: '17:00', enabled: true },
            friday: { start: '09:00', end: '17:00', enabled: true },
            saturday: { start: '09:00', end: '17:00', enabled: false },
            sunday: { start: '09:00', end: '17:00', enabled: false }
          },
          holidays: []
        },
        notificationSettings: {
          email: true,
          slack: false,
          webhook: false,
          sms: false,
          channels: {}
        }
      },
      isActive: req.body.isActive !== false
    };

    const queue = await service.createRoutingQueue(queueData);

    res.status(201).json({
      success: true,
      data: queue,
      message: 'Routing queue created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating routing queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create routing queue',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/automated-lead-routing/analytics
 * @desc Get comprehensive lead routing analytics
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/analytics', authenticateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const service = await initializeServices();

    const filters = {
      dateRange: req.query.dateRange ? JSON.parse(req.query.dateRange as string) : undefined
    };

    const analytics = await service.getRoutingAnalytics(filters);

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
      filters
    });
  } catch (error) {
    console.error('Error getting routing analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get routing analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/automated-lead-routing/health
 * @desc Health check endpoint for monitoring systems
 * @access Public
 * @platform Universal - All web frameworks and platforms
 */
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const service = await initializeServices();

    const [leads, rules, queues] = await Promise.all([
      service.getLeads({ status: ['new'] }),
      service.getActiveRoutingRules(),
      service.getRoutingQueues()
    ]);

    const healthData = {
      service: 'automated-lead-routing',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        pendingLeads: leads.length,
        activeRules: rules.length,
        activeQueues: queues.filter(q => q.isActive).length,
        serviceUptime: process.uptime()
      }
    };

    res.json(healthData);
  } catch (error) {
    console.error('Lead routing health check failed:', error);
    res.status(503).json({
      service: 'automated-lead-routing',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
