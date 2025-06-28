import { NextFunction, Request, Response, Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import LeadQualificationService from '../services/lead-qualification-service';
import { redisManager } from '../services/redis-client';

const router = Router();
let qualificationService: LeadQualificationService;

// Initialize service
const initializeService = async () => {
  if (!qualificationService) {
    qualificationService = new LeadQualificationService(redisManager.getClient());
    qualificationService.generateMockData(); // Initialize with mock data
  }
  return qualificationService;
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
 * @route GET /api/v1/qualification/overview
 * @desc Get comprehensive lead qualification system dashboard
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/overview', authenticateRequest, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const [
      analytics,
      healthStatus,
      criteria,
      stages,
      workflows,
      qualificationResults
    ] = await Promise.all([
      service.getAnalytics(),
      service.healthCheck(),
      service.getCriteria({ isActive: true }),
      service.getStages({ isActive: true }),
      service.getWorkflows({ isActive: true }),
      service.getQualificationResults({ isQualified: true })
    ]);

    const overview = {
      summary: {
        totalCriteria: criteria.length,
        totalStages: stages.length,
        activeWorkflows: workflows.length,
        activeExecutions: healthStatus.activeExecutions,
        qualifiedLeads: qualificationResults.length,
        systemStatus: healthStatus.status
      },
      analytics,
      healthStatus,
      recentQualifications: qualificationResults.slice(0, 10).map(result => ({
        leadId: result.leadId,
        workflowId: result.workflowId,
        currentStage: result.currentStage,
        isQualified: result.isQualified,
        qualificationDate: result.qualificationDate,
        stagesCompleted: result.stageHistory.length
      })),
      workflowPerformance: workflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        isActive: workflow.isActive,
        stages: workflow.stages.length,
        triggerEvents: workflow.triggerEvents
      }))
    };

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting qualification overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get qualification overview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// CRITERIA MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/qualification/criteria
 * @desc Get all qualification criteria
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/criteria', [
  authenticateRequest,
  query('type').optional().isString(),
  query('isActive').optional().isBoolean()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const filters: any = {};
    if (req.query.type) filters.type = req.query.type as string;
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

    const criteria = service.getCriteria(filters);

    res.json({
      success: true,
      data: {
        criteria,
        summary: {
          total: criteria.length,
          active: criteria.filter(c => c.isActive).length,
          byType: criteria.reduce((acc, criterion) => {
            acc[criterion.type] = (acc[criterion.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting criteria:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get criteria',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/qualification/criteria/:id
 * @desc Get specific qualification criteria
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/criteria/:id', authenticateRequest, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();
    const criteria = service.getCriteriaById(req.params.id);

    if (!criteria) {
      return res.status(404).json({
        success: false,
        error: 'Criteria not found',
        criteriaId: req.params.id
      });
    }

    res.json({
      success: true,
      data: criteria,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting criteria:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get criteria',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/qualification/criteria
 * @desc Create new qualification criteria
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/criteria', [
  authenticateRequest,
  body('name').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('type').isIn(['score_threshold', 'demographic', 'behavioral', 'firmographic', 'engagement', 'custom']),
  body('conditions').isArray(),
  body('isActive').isBoolean(),
  body('priority').isInt({ min: 1 })
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const criteriaData = {
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      conditions: req.body.conditions,
      isActive: req.body.isActive,
      priority: req.body.priority
    };

    const criteria = await service.createCriteria(criteriaData);

    res.status(201).json({
      success: true,
      data: criteria,
      message: 'Criteria created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating criteria:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create criteria',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route PUT /api/v1/qualification/criteria/:id
 * @desc Update qualification criteria
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.put('/criteria/:id', [
  authenticateRequest,
  body('name').optional().notEmpty().trim(),
  body('description').optional().notEmpty().trim(),
  body('conditions').optional().isArray(),
  body('isActive').optional().isBoolean(),
  body('priority').optional().isInt({ min: 1 })
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();
    const criteria = await service.updateCriteria(req.params.id, req.body);

    if (!criteria) {
      return res.status(404).json({
        success: false,
        error: 'Criteria not found',
        criteriaId: req.params.id
      });
    }

    res.json({
      success: true,
      data: criteria,
      message: 'Criteria updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating criteria:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update criteria',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// STAGE MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/qualification/stages
 * @desc Get all qualification stages
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/stages', [
  authenticateRequest,
  query('isActive').optional().isBoolean()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const filters: any = {};
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

    const stages = service.getStages(filters);

    res.json({
      success: true,
      data: {
        stages,
        summary: {
          total: stages.length,
          active: stages.filter(s => s.isActive).length,
          averageActionsPerStage: stages.reduce((sum, stage) => sum + stage.actions.length, 0) / stages.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting stages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stages',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/qualification/stages
 * @desc Create new qualification stage
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/stages', [
  authenticateRequest,
  body('name').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('order').isInt({ min: 1 }),
  body('criteria').isArray(),
  body('requiredScore').isInt({ min: 0 }),
  body('actions').isArray(),
  body('isActive').isBoolean()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const stageData = {
      name: req.body.name,
      description: req.body.description,
      order: req.body.order,
      criteria: req.body.criteria,
      requiredScore: req.body.requiredScore,
      actions: req.body.actions,
      isActive: req.body.isActive
    };

    const stage = await service.createStage(stageData);

    res.status(201).json({
      success: true,
      data: stage,
      message: 'Stage created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating stage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create stage',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// WORKFLOW MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/qualification/workflows
 * @desc Get all qualification workflows
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/workflows', [
  authenticateRequest,
  query('isActive').optional().isBoolean()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const filters: any = {};
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

    const workflows = service.getWorkflows(filters);

    res.json({
      success: true,
      data: {
        workflows,
        summary: {
          total: workflows.length,
          active: workflows.filter(w => w.isActive).length,
          averageStagesPerWorkflow: workflows.reduce((sum, workflow) => sum + workflow.stages.length, 0) / workflows.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting workflows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workflows',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/qualification/workflows/:id
 * @desc Get specific qualification workflow
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/workflows/:id', authenticateRequest, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();
    const workflow = service.getWorkflowById(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
        workflowId: req.params.id
      });
    }

    // Get detailed stage information
    const stageDetails = workflow.stages.map(stageId => service.getStageById(stageId)).filter(Boolean);

    res.json({
      success: true,
      data: {
        workflow,
        stageDetails
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/qualification/workflows
 * @desc Create new qualification workflow
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/workflows', [
  authenticateRequest,
  body('name').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('stages').isArray(),
  body('triggerEvents').isArray(),
  body('isActive').isBoolean()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const workflowData = {
      name: req.body.name,
      description: req.body.description,
      stages: req.body.stages,
      triggerEvents: req.body.triggerEvents,
      isActive: req.body.isActive,
      metadata: req.body.metadata || {}
    };

    const workflow = await service.createWorkflow(workflowData);

    res.status(201).json({
      success: true,
      data: workflow,
      message: 'Workflow created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// LEAD SCORING ENDPOINTS
// =============================================================================

/**
 * @route POST /api/v1/qualification/score-lead
 * @desc Score a lead against qualification criteria
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/score-lead', [
  authenticateRequest,
  body('leadId').notEmpty().trim(),
  body('leadData').isObject()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const leadScore = await service.scoreLead(req.body.leadId, req.body.leadData);

    res.json({
      success: true,
      data: leadScore,
      message: 'Lead scored successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error scoring lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to score lead',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/qualification/scores
 * @desc Get lead scores
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/scores', [
  authenticateRequest,
  query('leadIds').optional().isString()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const leadIds = req.query.leadIds ? (req.query.leadIds as string).split(',') : undefined;
    const scores = service.getLeadScores(leadIds);

    res.json({
      success: true,
      data: {
        scores,
        summary: {
          total: scores.length,
          averageScore: scores.reduce((sum, score) => sum + score.totalScore, 0) / scores.length,
          qualificationBreakdown: scores.reduce((acc, score) => {
            acc[score.qualificationLevel] = (acc[score.qualificationLevel] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scores',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// WORKFLOW EXECUTION ENDPOINTS
// =============================================================================

/**
 * @route POST /api/v1/qualification/execute-workflow
 * @desc Execute qualification workflow for a lead
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.post('/execute-workflow', [
  authenticateRequest,
  body('leadId').notEmpty().trim(),
  body('workflowId').notEmpty().trim(),
  body('triggerEvent').optional().isString()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const execution = await service.executeWorkflow(
      req.body.leadId,
      req.body.workflowId,
      req.body.triggerEvent
    );

    res.status(201).json({
      success: true,
      data: execution,
      message: 'Workflow execution started',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/qualification/results
 * @desc Get qualification results
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/results', [
  authenticateRequest,
  query('workflowIds').optional().isString(),
  query('isQualified').optional().isBoolean(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const filters: any = {};
    if (req.query.workflowIds) filters.workflowIds = (req.query.workflowIds as string).split(',');
    if (req.query.isQualified !== undefined) filters.isQualified = req.query.isQualified === 'true';

    const results = service.getQualificationResults(filters);

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const paginatedResults = results.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        results: paginatedResults,
        pagination: {
          total: results.length,
          limit,
          offset,
          hasMore: offset + limit < results.length
        },
        summary: {
          total: results.length,
          qualified: results.filter(r => r.isQualified).length,
          byWorkflow: results.reduce((acc, result) => {
            acc[result.workflowId] = (acc[result.workflowId] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get results',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// ANALYTICS ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/qualification/analytics
 * @desc Get comprehensive qualification analytics
 * @access Private
 * @platform Universal - All web frameworks and platforms
 */
router.get('/analytics', [
  authenticateRequest,
  query('workflowIds').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const service = await initializeService();

    const filters: any = {};
    if (req.query.workflowIds) {
      filters.workflowIds = (req.query.workflowIds as string).split(',');
    }
    if (req.query.startDate && req.query.endDate) {
      filters.dateRange = {
        start: new Date(req.query.startDate as string),
        end: new Date(req.query.endDate as string)
      };
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
 * @route GET /api/v1/qualification/health
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
      message: 'Lead qualification service is operational',
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

export default router;
