import { Request, Response, Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import DuplicateDetectionService, {
    DuplicateFilters
} from '../services/duplicate-detection-service';
import { redisManager } from '../services/redis-client';

const router = Router();

// Initialize service
const duplicateService = new DuplicateDetectionService(redisManager.getClient());
duplicateService.generateMockData();

// =============================================================================
// OVERVIEW & DASHBOARD ROUTES
// =============================================================================

/**
 * GET /overview - Duplicate Detection system overview and dashboard
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const duplicates = duplicateService.getDuplicates();
    const workflows = duplicateService.getWorkflows();
    const batchJobs = duplicateService.getBatchJobs();
    const metrics = duplicateService.getMetrics();
    const healthStatus = await duplicateService.healthCheck();

    const overview = {
      system: {
        status: healthStatus.status,
        duplicatesCount: healthStatus.duplicates,
        pendingWorkflows: healthStatus.pendingWorkflows,
        activeBatchJobs: healthStatus.activeBatchJobs,
        metricsStatus: healthStatus.metricsStatus,
        averageDetectionTime: healthStatus.averageDetectionTime,
        errorRate: healthStatus.errorRate
      },
      duplicates: {
        total: duplicates.length,
        pending: duplicates.filter(d => d.status === 'pending').length,
        reviewed: duplicates.filter(d => d.status === 'reviewed').length,
        merged: duplicates.filter(d => d.status === 'merged').length,
        ignored: duplicates.filter(d => d.status === 'ignored').length,
        falsePositives: duplicates.filter(d => d.status === 'false_positive').length,
        byType: duplicates.reduce((acc: Record<string, number>, dup) => {
          acc[dup.recordType] = (acc[dup.recordType] || 0) + 1;
          return acc;
        }, {}),
        bySystem: duplicates.reduce((acc: Record<string, number>, dup) => {
          const key = `${dup.sourceSystem}->${dup.duplicateSystem}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {}),
        byConfidence: {
          veryHigh: duplicates.filter(d => d.confidenceScore >= 90).length,
          high: duplicates.filter(d => d.confidenceScore >= 75 && d.confidenceScore < 90).length,
          medium: duplicates.filter(d => d.confidenceScore >= 50 && d.confidenceScore < 75).length,
          low: duplicates.filter(d => d.confidenceScore < 50).length
        }
      },
      workflows: {
        total: workflows.length,
        pending: workflows.filter(w => w.status === 'pending').length,
        inProgress: workflows.filter(w => w.status === 'in_progress').length,
        completed: workflows.filter(w => w.status === 'completed').length,
        failed: workflows.filter(w => w.status === 'failed').length
      },
      batchJobs: {
        total: batchJobs.length,
        queued: batchJobs.filter(j => j.status === 'queued').length,
        running: batchJobs.filter(j => j.status === 'running').length,
        completed: batchJobs.filter(j => j.status === 'completed').length,
        failed: batchJobs.filter(j => j.status === 'failed').length
      },
      recentActivity: duplicates
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10)
        .map(dup => ({
          id: dup.id,
          recordType: dup.recordType,
          confidenceScore: dup.confidenceScore,
          status: dup.status,
          sourceSystem: dup.sourceSystem,
          duplicateSystem: dup.duplicateSystem,
          createdAt: dup.createdAt
        })),
      metrics,
      recommendations: [
        {
          type: 'performance',
          message: 'Review high-confidence duplicates for auto-merge opportunities',
          priority: duplicates.filter(d => d.confidenceScore >= 90 && d.status === 'pending').length > 5 ? 'high' : 'medium',
          count: duplicates.filter(d => d.confidenceScore >= 90 && d.status === 'pending').length
        },
        {
          type: 'accuracy',
          message: 'Investigate low-confidence duplicates that may be false positives',
          priority: duplicates.filter(d => d.confidenceScore < 60 && d.status === 'pending').length > 10 ? 'high' : 'low',
          count: duplicates.filter(d => d.confidenceScore < 60 && d.status === 'pending').length
        },
        {
          type: 'workflow',
          message: 'Complete pending manual review workflows',
          priority: workflows.filter(w => w.status === 'pending' || w.status === 'in_progress').length > 5 ? 'high' : 'medium',
          count: workflows.filter(w => w.status === 'pending' || w.status === 'in_progress').length
        }
      ]
    };

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get duplicate detection overview'
    });
  }
});

// =============================================================================
// DUPLICATE DETECTION ROUTES
// =============================================================================

/**
 * POST /detect - Detect duplicates for a single record
 */
router.post('/detect', [
  body('recordData').isObject().withMessage('Record data is required'),
  body('recordType').isString().notEmpty().withMessage('Record type is required'),
  body('sourceSystem').isString().notEmpty().withMessage('Source system is required'),
  body('options.ruleId').optional().isString(),
  body('options.realTime').optional().isBoolean(),
  body('options.autoMerge').optional().isBoolean(),
  body('options.skipCache').optional().isBoolean()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { recordData, recordType, sourceSystem, options = {} } = req.body;

    const duplicates = await duplicateService.detectDuplicates(
      recordData,
      recordType,
      sourceSystem,
      options
    );

    res.json({
      success: true,
      data: {
        duplicatesFound: duplicates.length,
        duplicates: duplicates.map(dup => ({
          id: dup.id,
          duplicateRecordId: dup.duplicateRecordId,
          confidenceScore: dup.confidenceScore,
          status: dup.status,
          detectionMethod: dup.detectionMethod,
          matchedFields: dup.matchedFields,
          recommendation: dup.metadata.recommendation,
          createdAt: dup.createdAt
        })),
        summary: {
          highConfidence: duplicates.filter(d => d.confidenceScore >= 90).length,
          mediumConfidence: duplicates.filter(d => d.confidenceScore >= 70 && d.confidenceScore < 90).length,
          lowConfidence: duplicates.filter(d => d.confidenceScore < 70).length,
          autoMergeRecommended: duplicates.filter(d => d.metadata.recommendation === 'auto_merge').length,
          reviewRecommended: duplicates.filter(d => d.metadata.recommendation === 'review').length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to detect duplicates'
    });
  }
});

/**
 * GET /duplicates - List all detected duplicates with filtering
 */
router.get('/duplicates', [
  query('recordType').optional().isString(),
  query('sourceSystem').optional().isString(),
  query('status').optional().isIn(['pending', 'reviewed', 'merged', 'ignored', 'false_positive']),
  query('confidenceMin').optional().isFloat({ min: 0, max: 100 }),
  query('confidenceMax').optional().isFloat({ min: 0, max: 100 }),
  query('detectionMethod').optional().isIn(['fuzzy', 'exact', 'phonetic', 'semantic', 'hybrid']),
  query('requiresReview').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      recordType,
      sourceSystem,
      status,
      confidenceMin,
      confidenceMax,
      detectionMethod,
      requiresReview,
      page = 1,
      limit = 20
    } = req.query;

    const filters: DuplicateFilters = {};
    if (recordType) filters.recordType = recordType as string;
    if (sourceSystem) filters.sourceSystem = sourceSystem as string;
    if (status) filters.status = status as string;
    if (confidenceMin !== undefined) filters.confidenceMin = Number(confidenceMin);
    if (confidenceMax !== undefined) filters.confidenceMax = Number(confidenceMax);
    if (detectionMethod) filters.detectionMethod = detectionMethod as string;
    if (requiresReview !== undefined) filters.requiresReview = requiresReview === 'true';

    const allDuplicates = duplicateService.getDuplicates(filters);
    const totalItems = allDuplicates.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const duplicates = allDuplicates.slice(startIndex, endIndex);

    const duplicatesWithDetails = duplicates.map(duplicate => ({
      ...duplicate,
      summary: {
        totalMatchedFields: duplicate.matchedFields.length,
        exactMatches: duplicate.matchedFields.filter(f => f.isExactMatch).length,
        strongMatches: duplicate.matchedFields.filter(f => f.similarity >= 0.8).length,
        averageSimilarity: duplicate.matchedFields.length > 0
          ? duplicate.matchedFields.reduce((sum, f) => sum + f.similarity, 0) / duplicate.matchedFields.length
          : 0
      }
    }));

    res.json({
      success: true,
      data: duplicatesWithDetails,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / Number(limit)),
        hasNext: endIndex < totalItems,
        hasPrev: Number(page) > 1
      },
      summary: {
        totalDuplicates: totalItems,
        averageConfidence: allDuplicates.length > 0
          ? allDuplicates.reduce((sum, d) => sum + d.confidenceScore, 0) / allDuplicates.length
          : 0,
        statusDistribution: allDuplicates.reduce((acc: Record<string, number>, dup) => {
          acc[dup.status] = (acc[dup.status] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get duplicates'
    });
  }
});

/**
 * GET /duplicates/:id - Get specific duplicate by ID
 */
router.get('/duplicates/:id', [
  param('id').notEmpty().withMessage('Duplicate ID is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const duplicate = duplicateService.getDuplicate(id);

    if (!duplicate) {
      return res.status(404).json({
        success: false,
        error: 'Duplicate not found'
      });
    }

    // Get related workflows
    const workflows = duplicateService.getWorkflows().filter(w => w.duplicateId === id);

    res.json({
      success: true,
      data: {
        duplicate,
        workflows,
        analysis: {
          totalMatchedFields: duplicate.matchedFields.length,
          exactMatches: duplicate.matchedFields.filter(f => f.isExactMatch).length,
          strongMatches: duplicate.matchedFields.filter(f => f.similarity >= 0.8).length,
          weakMatches: duplicate.matchedFields.filter(f => f.similarity < 0.6).length,
          averageSimilarity: duplicate.matchedFields.length > 0
            ? duplicate.matchedFields.reduce((sum, f) => sum + f.similarity, 0) / duplicate.matchedFields.length
            : 0,
          fieldBreakdown: duplicate.matchedFields.map(field => ({
            fieldName: field.fieldName,
            similarity: field.similarity,
            weight: field.weight,
            contribution: (field.similarity * field.weight) / 100,
            algorithm: field.algorithm,
            isExactMatch: field.isExactMatch
          }))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get duplicate'
    });
  }
});

/**
 * PUT /duplicates/:id/status - Update duplicate status
 */
router.put('/duplicates/:id/status', [
  param('id').notEmpty().withMessage('Duplicate ID is required'),
  body('status').isIn(['pending', 'reviewed', 'merged', 'ignored', 'false_positive']).withMessage('Valid status is required'),
  body('reviewedBy').optional().isString(),
  body('notes').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, reviewedBy, notes } = req.body;

    const duplicate = duplicateService.getDuplicate(id);
    if (!duplicate) {
      return res.status(404).json({
        success: false,
        error: 'Duplicate not found'
      });
    }

    // Update duplicate status
    duplicate.status = status;
    duplicate.reviewedBy = reviewedBy;
    duplicate.reviewedAt = new Date();
    duplicate.updatedAt = new Date();

    if (notes) {
      duplicate.metadata.reviewNotes = notes;
    }

    res.json({
      success: true,
      data: duplicate,
      message: `Duplicate status updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update duplicate status'
    });
  }
});

/**
 * POST /duplicates/:id/merge - Auto-merge a duplicate
 */
router.post('/duplicates/:id/merge', [
  param('id').notEmpty().withMessage('Duplicate ID is required'),
  body('strategy').optional().isString(),
  body('preserveBackup').optional().isBoolean()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { strategy, preserveBackup } = req.body;

    const duplicate = duplicateService.getDuplicate(id);
    if (!duplicate) {
      return res.status(404).json({
        success: false,
        error: 'Duplicate not found'
      });
    }

    if (duplicate.status === 'merged') {
      return res.status(400).json({
        success: false,
        error: 'Duplicate has already been merged'
      });
    }

    const mergeResult = await duplicateService.autoMergeDuplicate(id);

    if (mergeResult) {
      res.json({
        success: true,
        data: {
          duplicate: duplicateService.getDuplicate(id),
          mergeResult
        },
        message: 'Duplicate successfully merged'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to merge duplicate'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to merge duplicate'
    });
  }
});

// =============================================================================
// WORKFLOW MANAGEMENT ROUTES
// =============================================================================

/**
 * GET /workflows - List resolution workflows
 */
router.get('/workflows', [
  query('status').optional().isIn(['pending', 'in_progress', 'completed', 'failed', 'cancelled']),
  query('assignedTo').optional().isString(),
  query('workflowType').optional().isIn(['automatic', 'manual', 'hybrid']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      status,
      assignedTo,
      workflowType,
      priority,
      page = 1,
      limit = 20
    } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (assignedTo) filters.assignedTo = assignedTo;

    let workflows = duplicateService.getWorkflows(filters);

    // Additional filtering
    if (workflowType) {
      workflows = workflows.filter(w => w.workflowType === workflowType);
    }
    if (priority) {
      workflows = workflows.filter(w => w.priority === priority);
    }

    const totalItems = workflows.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedWorkflows = workflows.slice(startIndex, endIndex);

    const workflowsWithDetails = paginatedWorkflows.map(workflow => {
      const duplicate = duplicateService.getDuplicate(workflow.duplicateId);
      return {
        ...workflow,
        duplicate: duplicate ? {
          id: duplicate.id,
          recordType: duplicate.recordType,
          confidenceScore: duplicate.confidenceScore,
          sourceSystem: duplicate.sourceSystem,
          duplicateSystem: duplicate.duplicateSystem
        } : null,
        progress: {
          completedSteps: workflow.steps.filter(s => s.status === 'completed').length,
          totalSteps: workflow.steps.length,
          currentStepDescription: workflow.steps[workflow.currentStep]?.description || 'Workflow completed'
        }
      };
    });

    res.json({
      success: true,
      data: workflowsWithDetails,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / Number(limit)),
        hasNext: endIndex < totalItems,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get workflows'
    });
  }
});

/**
 * POST /workflows - Create a new resolution workflow
 */
router.post('/workflows', [
  body('duplicateId').isString().notEmpty().withMessage('Duplicate ID is required'),
  body('workflowType').isIn(['automatic', 'manual', 'hybrid']).withMessage('Valid workflow type is required'),
  body('assignTo').optional().isString(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional().isISO8601()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { duplicateId, workflowType, assignTo, priority, dueDate } = req.body;

    const duplicate = duplicateService.getDuplicate(duplicateId);
    if (!duplicate) {
      return res.status(404).json({
        success: false,
        error: 'Duplicate not found'
      });
    }

    const workflow = await duplicateService.createResolutionWorkflow(
      duplicateId,
      workflowType,
      {
        assignTo,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined
      }
    );

    res.status(201).json({
      success: true,
      data: workflow,
      message: 'Resolution workflow created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create workflow'
    });
  }
});

/**
 * PUT /workflows/:id/advance - Advance workflow to next step
 */
router.put('/workflows/:id/advance', [
  param('id').notEmpty().withMessage('Workflow ID is required'),
  body('stepResult').optional(),
  body('notes').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { stepResult, notes } = req.body;

    const result = await duplicateService.advanceWorkflow(id, {
      result: stepResult,
      notes
    });

    if (result) {
      const workflow = duplicateService.getWorkflows().find(w => w.id === id);
      res.json({
        success: true,
        data: workflow,
        message: 'Workflow advanced successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Workflow not found or cannot be advanced'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to advance workflow'
    });
  }
});

// =============================================================================
// BATCH PROCESSING ROUTES
// =============================================================================

/**
 * POST /batch/detect - Start batch duplicate detection
 */
router.post('/batch/detect', [
  body('recordType').isString().notEmpty().withMessage('Record type is required'),
  body('sourceSystem').isString().notEmpty().withMessage('Source system is required'),
  body('options.batchSize').optional().isInt({ min: 1, max: 1000 }),
  body('options.maxConcurrency').optional().isInt({ min: 1, max: 10 }),
  body('options.autoMergeThreshold').optional().isFloat({ min: 0, max: 100 }),
  body('options.filters').optional().isObject()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { recordType, sourceSystem, options = {} } = req.body;

    const job = await duplicateService.startBatchDetection(
      recordType,
      sourceSystem,
      options
    );

    res.status(201).json({
      success: true,
      data: job,
      message: 'Batch detection job started successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start batch detection'
    });
  }
});

/**
 * GET /batch/jobs - List batch detection jobs
 */
router.get('/batch/jobs', [
  query('status').optional().isIn(['queued', 'running', 'completed', 'failed', 'cancelled']),
  query('recordType').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      status,
      recordType,
      page = 1,
      limit = 20
    } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (recordType) filters.recordType = recordType;

    const allJobs = duplicateService.getBatchJobs(filters);
    const totalItems = allJobs.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const jobs = allJobs.slice(startIndex, endIndex);

    const jobsWithProgress = jobs.map(job => ({
      ...job,
      progressPercentage: job.progress.totalRecords > 0
        ? (job.progress.processedRecords / job.progress.totalRecords) * 100
        : 0,
      estimatedTimeRemaining: job.status === 'running' && job.progress.processedRecords > 0
        ? ((Date.now() - job.progress.startTime.getTime()) / job.progress.processedRecords)
          * (job.progress.totalRecords - job.progress.processedRecords)
        : null
    }));

    res.json({
      success: true,
      data: jobsWithProgress,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / Number(limit)),
        hasNext: endIndex < totalItems,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get batch jobs'
    });
  }
});

/**
 * GET /batch/jobs/:id - Get specific batch job details
 */
router.get('/batch/jobs/:id', [
  param('id').notEmpty().withMessage('Job ID is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const job = duplicateService.getBatchJobs().find(j => j.id === id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Batch job not found'
      });
    }

    const progressPercentage = job.progress.totalRecords > 0
      ? (job.progress.processedRecords / job.progress.totalRecords) * 100
      : 0;

    const estimatedTimeRemaining = job.status === 'running' && job.progress.processedRecords > 0
      ? ((Date.now() - job.progress.startTime.getTime()) / job.progress.processedRecords)
        * (job.progress.totalRecords - job.progress.processedRecords)
      : null;

    res.json({
      success: true,
      data: {
        ...job,
        progressPercentage,
        estimatedTimeRemaining,
        performance: job.results ? {
          ...job.results.performance,
          recordsPerSecond: job.results.performance.recordsPerSecond.toFixed(2),
          averageTimePerRecord: `${job.results.performance.averageTimePerRecord.toFixed(2)}ms`
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get batch job'
    });
  }
});

// =============================================================================
// CONFIGURATION ROUTES
// =============================================================================

/**
 * GET /rules - Get matching rules
 */
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const rules = duplicateService.getMatchingRules();

    const rulesWithStats = rules.map(rule => {
      const duplicates = duplicateService.getDuplicates({ recordType: rule.recordType });
      return {
        ...rule,
        stats: {
          totalDuplicates: duplicates.length,
          averageConfidence: duplicates.length > 0
            ? duplicates.reduce((sum, d) => sum + d.confidenceScore, 0) / duplicates.length
            : 0,
          autoMergeCount: duplicates.filter(d => d.confidenceScore >= rule.thresholds.autoMerge).length,
          reviewCount: duplicates.filter(d =>
            d.confidenceScore >= rule.thresholds.humanReview &&
            d.confidenceScore < rule.thresholds.autoMerge
          ).length
        }
      };
    });

    res.json({
      success: true,
      data: rulesWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get matching rules'
    });
  }
});

/**
 * PUT /rules/:id - Update matching rule
 */
router.put('/rules/:id', [
  param('id').notEmpty().withMessage('Rule ID is required'),
  body('name').optional().isString(),
  body('isActive').optional().isBoolean(),
  body('thresholds').optional().isObject(),
  body('fields').optional().isArray()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updates = req.body;

    const updatedRule = await duplicateService.updateMatchingRule(id, updates);

    if (updatedRule) {
      res.json({
        success: true,
        data: updatedRule,
        message: 'Matching rule updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Matching rule not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update matching rule'
    });
  }
});

/**
 * GET /strategies - Get deduplication strategies
 */
router.get('/strategies', async (req: Request, res: Response) => {
  try {
    const strategies = duplicateService.getDeduplicationStrategies();
    res.json({
      success: true,
      data: strategies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get deduplication strategies'
    });
  }
});

// =============================================================================
// METRICS AND ANALYTICS ROUTES
// =============================================================================

/**
 * GET /metrics - Get duplicate detection metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = duplicateService.getMetrics();

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'Metrics not available'
      });
    }

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get metrics'
    });
  }
});

/**
 * GET /health - Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await duplicateService.healthCheck();

    const statusCode = health.status === 'healthy' ? 200 :
                      health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    });
  }
});

export default router;
