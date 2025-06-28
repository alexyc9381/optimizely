import express, { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import { AccountBasedMarketingService } from '../services/account-based-marketing-service';
import { redisManager } from '../services/redis-client';

const router = Router();

// Initialize ABM service
const abmService = new AccountBasedMarketingService(redisManager.getClient());

// Rate limiting
const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

// Validation error handler
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

// Account Management Routes

/**
 * @route POST /api/v1/abm/accounts
 * @desc Create a new account
 * @access Public
 */
router.post('/accounts', [
  standardRateLimit,
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('domain').isURL().withMessage('Valid domain is required'),
  body('industry').notEmpty().withMessage('Industry is required'),
  body('size').isIn(['startup', 'small', 'medium', 'large', 'enterprise']).withMessage('Valid size is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const account = await abmService.createAccount(req.body);
    res.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route GET /api/v1/abm/accounts/:id
 * @desc Get account by ID
 * @access Public
 */
router.get('/accounts/:id', [
  standardRateLimit,
  param('id').notEmpty().withMessage('Account ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const account = await abmService.getAccount(req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }
    res.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route PUT /api/v1/abm/accounts/:id
 * @desc Update account
 * @access Public
 */
router.put('/accounts/:id', [
  standardRateLimit,
  param('id').notEmpty().withMessage('Account ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const account = await abmService.updateAccount(req.params.id, req.body);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }
    res.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/v1/abm/accounts/:id/engagement
 * @desc Track account engagement
 * @access Public
 */
router.post('/accounts/:id/engagement', [
  standardRateLimit,
  param('id').notEmpty().withMessage('Account ID is required'),
  body('type').isIn(['email', 'web', 'social', 'event', 'call', 'demo', 'content', 'ad']).withMessage('Valid engagement type is required'),
  body('channel').notEmpty().withMessage('Channel is required'),
  body('activity').notEmpty().withMessage('Activity is required'),
  body('score').isNumeric().withMessage('Score must be numeric'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    await abmService.trackEngagement({
      accountId: req.params.id,
      ...req.body,
      timestamp: new Date(),
    });
    res.json({
      success: true,
      message: 'Engagement tracked successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Segment Management Routes

/**
 * @route POST /api/v1/abm/segments
 * @desc Create a new segment
 * @access Public
 */
router.post('/segments', [
  standardRateLimit,
  body('name').notEmpty().withMessage('Segment name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('criteria').isArray().withMessage('Criteria must be an array'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Valid priority is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const segment = await abmService.createSegment(req.body);
    res.json({
      success: true,
      data: segment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route GET /api/v1/abm/segments/:id
 * @desc Get segment by ID
 * @access Public
 */
router.get('/segments/:id', [
  standardRateLimit,
  param('id').notEmpty().withMessage('Segment ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const segment = await abmService.getSegment(req.params.id);
    if (!segment) {
      return res.status(404).json({
        success: false,
        message: 'Segment not found',
      });
    }
    res.json({
      success: true,
      data: segment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/v1/abm/accounts/:id/segment
 * @desc Segment an account
 * @access Public
 */
router.post('/accounts/:id/segment', [
  standardRateLimit,
  param('id').notEmpty().withMessage('Account ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const segmentIds = await abmService.segmentAccount(req.params.id);
    res.json({
      success: true,
      data: { segmentIds },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Campaign Management Routes

/**
 * @route POST /api/v1/abm/campaigns
 * @desc Create a new campaign
 * @access Public
 */
router.post('/campaigns', [
  standardRateLimit,
  body('name').notEmpty().withMessage('Campaign name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('segmentIds').isArray().withMessage('Segment IDs must be an array'),
  body('channels').isArray().withMessage('Channels must be an array'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const campaign = await abmService.createCampaign(req.body);
    res.json({
      success: true,
      data: campaign,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route GET /api/v1/abm/campaigns/:id
 * @desc Get campaign by ID
 * @access Public
 */
router.get('/campaigns/:id', [
  standardRateLimit,
  param('id').notEmpty().withMessage('Campaign ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const campaign = await abmService.getCampaign(req.params.id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }
    res.json({
      success: true,
      data: campaign,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/v1/abm/campaigns/:id/execute
 * @desc Execute a campaign
 * @access Public
 */
router.post('/campaigns/:id/execute', [
  strictRateLimit,
  param('id').notEmpty().withMessage('Campaign ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    await abmService.executeCampaign(req.params.id);
    res.json({
      success: true,
      message: 'Campaign execution started',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Workflow Management Routes

/**
 * @route POST /api/v1/abm/workflows
 * @desc Create a new automation workflow
 * @access Public
 */
router.post('/workflows', [
  standardRateLimit,
  body('name').notEmpty().withMessage('Workflow name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('trigger').isObject().withMessage('Trigger must be an object'),
  body('actions').isArray().withMessage('Actions must be an array'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const workflow = await abmService.createWorkflow(req.body);
    res.json({
      success: true,
      data: workflow,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route GET /api/v1/abm/workflows
 * @desc Get all workflows
 * @access Public
 */
router.get('/workflows', [
  standardRateLimit,
], async (req: express.Request, res: express.Response) => {
  try {
    const workflows = await abmService.getAllWorkflows();
    res.json({
      success: true,
      data: workflows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route GET /api/v1/abm/workflows/:id
 * @desc Get workflow by ID
 * @access Public
 */
router.get('/workflows/:id', [
  standardRateLimit,
  param('id').notEmpty().withMessage('Workflow ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const workflow = await abmService.getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }
    res.json({
      success: true,
      data: workflow,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route PUT /api/v1/abm/workflows/:id
 * @desc Update workflow
 * @access Public
 */
router.put('/workflows/:id', [
  standardRateLimit,
  param('id').notEmpty().withMessage('Workflow ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const workflow = await abmService.updateWorkflow(req.params.id, req.body);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }
    res.json({
      success: true,
      data: workflow,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/v1/abm/workflows/:id/execute
 * @desc Execute workflow for specific account
 * @access Public
 */
router.post('/workflows/:id/execute', [
  strictRateLimit,
  param('id').notEmpty().withMessage('Workflow ID is required'),
  body('accountId').notEmpty().withMessage('Account ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    await abmService.executeWorkflow(req.params.id, req.body.accountId);
    res.json({
      success: true,
      message: 'Workflow execution started',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Automation Rules Routes

/**
 * @route POST /api/v1/abm/automation-rules
 * @desc Create a new automation rule
 * @access Public
 */
router.post('/automation-rules', [
  standardRateLimit,
  body('name').notEmpty().withMessage('Rule name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('priority').isNumeric().withMessage('Priority must be numeric'),
  body('conditions').isArray().withMessage('Conditions must be an array'),
  body('actions').isArray().withMessage('Actions must be an array'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const rule = await abmService.createAutomationRule(req.body);
    res.json({
      success: true,
      data: rule,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route GET /api/v1/abm/automation-rules/:id
 * @desc Get automation rule by ID
 * @access Public
 */
router.get('/automation-rules/:id', [
  standardRateLimit,
  param('id').notEmpty().withMessage('Rule ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const rule = await abmService.getAutomationRule(req.params.id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found',
      });
    }
    res.json({
      success: true,
      data: rule,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/v1/abm/accounts/:id/execute-rules
 * @desc Execute automation rules for an account
 * @access Public
 */
router.post('/accounts/:id/execute-rules', [
  strictRateLimit,
  param('id').notEmpty().withMessage('Account ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const account = await abmService.getAccount(req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    await abmService.executeAutomationRules(account);
    res.json({
      success: true,
      message: 'Automation rules executed',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Campaign Orchestration Routes

/**
 * @route POST /api/v1/abm/orchestrations
 * @desc Create a new campaign orchestration
 * @access Public
 */
router.post('/orchestrations', [
  standardRateLimit,
  body('name').notEmpty().withMessage('Orchestration name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('campaigns').isArray().withMessage('Campaigns must be an array'),
  body('sequence').isArray().withMessage('Sequence must be an array'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const orchestration = await abmService.createCampaignOrchestration(req.body);
    res.json({
      success: true,
      data: orchestration,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route GET /api/v1/abm/orchestrations/:id
 * @desc Get orchestration by ID
 * @access Public
 */
router.get('/orchestrations/:id', [
  standardRateLimit,
  param('id').notEmpty().withMessage('Orchestration ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const orchestration = await abmService.getOrchestration(req.params.id);
    if (!orchestration) {
      return res.status(404).json({
        success: false,
        message: 'Orchestration not found',
      });
    }
    res.json({
      success: true,
      data: orchestration,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/v1/abm/orchestrations/:id/execute
 * @desc Execute orchestration for accounts
 * @access Public
 */
router.post('/orchestrations/:id/execute', [
  strictRateLimit,
  param('id').notEmpty().withMessage('Orchestration ID is required'),
  body('accountIds').isArray().withMessage('Account IDs must be an array'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    await abmService.executeOrchestration(req.params.id, req.body.accountIds);
    res.json({
      success: true,
      message: 'Orchestration execution started',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Personalization Routes

/**
 * @route POST /api/v1/abm/personalization/rules
 * @desc Add personalization rule
 * @access Public
 */
router.post('/personalization/rules', [
  standardRateLimit,
  body('id').notEmpty().withMessage('Rule ID is required'),
  body('trigger').notEmpty().withMessage('Trigger is required'),
  body('conditions').isArray().withMessage('Conditions must be an array'),
  body('actions').isArray().withMessage('Actions must be an array'),
  body('priority').isNumeric().withMessage('Priority must be numeric'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    await abmService.addPersonalizationRule(req.body);
    res.json({
      success: true,
      message: 'Personalization rule added',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/v1/abm/personalization/content
 * @desc Add content asset
 * @access Public
 */
router.post('/personalization/content', [
  standardRateLimit,
  body('id').notEmpty().withMessage('Asset ID is required'),
  body('name').notEmpty().withMessage('Asset name is required'),
  body('type').isIn(['text', 'image', 'video', 'document', 'template']).withMessage('Valid type is required'),
  body('content').notEmpty().withMessage('Content is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    await abmService.addContentAsset(req.body);
    res.json({
      success: true,
      message: 'Content asset added',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/v1/abm/personalization/personalize
 * @desc Personalize content for account
 * @access Public
 */
router.post('/personalization/personalize', [
  standardRateLimit,
  body('templateId').notEmpty().withMessage('Template ID is required'),
  body('accountId').notEmpty().withMessage('Account ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const account = await abmService.getAccount(req.body.accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    const personalizedContent = await abmService.personalizeContentForAccount(req.body.templateId, account);
    res.json({
      success: true,
      data: personalizedContent,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Journey Management Routes

/**
 * @route GET /api/v1/abm/accounts/:id/journey
 * @desc Get account journey
 * @access Public
 */
router.get('/accounts/:id/journey', [
  standardRateLimit,
  param('id').notEmpty().withMessage('Account ID is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const journey = await abmService.getAccountJourney(req.params.id);
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Account journey not found',
      });
    }
    res.json({
      success: true,
      data: journey,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Analytics Routes

/**
 * @route GET /api/v1/abm/analytics
 * @desc Get ABM analytics
 * @access Public
 */
router.get('/analytics', [
  standardRateLimit,
  query('timeframe').optional().isIn(['7d', '30d', '90d']).withMessage('Valid timeframe is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const timeframe = (req.query.timeframe as string) || '30d';
    const analytics = await abmService.getABMAnalytics(timeframe);
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route GET /api/v1/abm/analytics/automation
 * @desc Get automation analytics
 * @access Public
 */
router.get('/analytics/automation', [
  standardRateLimit,
], async (req: express.Request, res: express.Response) => {
  try {
    const analytics = await abmService.getAutomationAnalytics();
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route GET /api/v1/abm/analytics/performance
 * @desc Get performance analytics (alias for ABM analytics)
 * @access Public
 */
router.get('/analytics/performance', [
  standardRateLimit,
  query('timeframe').optional().isIn(['7d', '30d', '90d']).withMessage('Valid timeframe is required'),
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const timeframe = (req.query.timeframe as string) || '30d';
    const analytics = await abmService.getABMAnalytics(timeframe);
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Health Check

/**
 * @route GET /api/v1/abm/health
 * @desc Get ABM service health status
 * @access Public
 */
router.get('/health', [
  standardRateLimit,
], async (req: express.Request, res: express.Response) => {
  try {
    const health = await abmService.getHealthStatus();
    res.json({
      success: true,
      data: health,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
