import { Request, Response, Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import SyncEngineService from '../services/sync-engine-service';

const router = Router();
const syncEngineService = new SyncEngineService();

/**
 * GET /overview - Get sync engine overview dashboard
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const metrics = syncEngineService.getMetrics();
    const healthStatus = await syncEngineService.getHealthStatus();
    const recentJobs = syncEngineService.getSyncJobs({ status: 'running' });
    const pendingConflicts = syncEngineService.getConflicts({ status: 'pending' });

    res.json({
      success: true,
      data: {
        metrics,
        healthStatus,
        recentJobs: recentJobs.slice(0, 5),
        pendingConflicts: pendingConflicts.slice(0, 10),
        summary: {
          totalJobs: metrics?.totalJobs || 0,
          activeJobs: metrics?.activeJobs || 0,
          pendingConflicts: metrics?.pendingConflicts || 0,
          systemHealth: metrics?.systemHealth || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get overview'
    });
  }
});

/**
 * GET /jobs - List sync jobs with filtering
 */
router.get('/jobs', [
  query('status').optional().isIn(['idle', 'running', 'completed', 'failed', 'paused']),
  query('sourceSystem').optional().isString(),
  query('targetSystem').optional().isString(),
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

    const { status, sourceSystem, targetSystem, page = 1, limit = 20 } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (sourceSystem) filters.sourceSystem = sourceSystem;
    if (targetSystem) filters.targetSystem = targetSystem;

    const allJobs = syncEngineService.getSyncJobs(filters);

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedJobs = allJobs.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedJobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: allJobs.length,
        totalPages: Math.ceil(allJobs.length / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sync jobs'
    });
  }
});

/**
 * POST /jobs - Create a new sync job
 */
router.post('/jobs', [
  body('name').notEmpty().withMessage('Job name is required'),
  body('sourceSystem').notEmpty().withMessage('Source system is required'),
  body('targetSystem').notEmpty().withMessage('Target system is required'),
  body('entityTypes').isArray().withMessage('Entity types must be an array'),
  body('syncMode').isIn(['full', 'incremental', 'delta']).withMessage('Invalid sync mode'),
  body('direction').isIn(['bidirectional', 'source_to_target', 'target_to_source']).withMessage('Invalid direction'),
  body('isActive').optional().isBoolean()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const jobData = {
      ...req.body,
      status: 'idle' as const
    };

    const newJob = await syncEngineService.createSyncJob(jobData);

    res.status(201).json({
      success: true,
      data: newJob
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create sync job'
    });
  }
});

/**
 * GET /jobs/:id - Get specific sync job
 */
router.get('/jobs/:id', [
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
    const job = syncEngineService.getSyncJob(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Sync job not found'
      });
    }

    const executions = syncEngineService.getExecutions({ jobId: id });

    res.json({
      success: true,
      data: {
        ...job,
        recentExecutions: executions.slice(0, 5)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sync job'
    });
  }
});

/**
 * PUT /jobs/:id - Update sync job
 */
router.put('/jobs/:id', [
  param('id').notEmpty().withMessage('Job ID is required'),
  body('name').optional().notEmpty(),
  body('entityTypes').optional().isArray(),
  body('syncMode').optional().isIn(['full', 'incremental', 'delta']),
  body('direction').optional().isIn(['bidirectional', 'source_to_target', 'target_to_source']),
  body('isActive').optional().isBoolean()
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

    const updatedJob = await syncEngineService.updateSyncJob(id, updates);

    if (!updatedJob) {
      return res.status(404).json({
        success: false,
        error: 'Sync job not found'
      });
    }

    res.json({
      success: true,
      data: updatedJob
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update sync job'
    });
  }
});

/**
 * DELETE /jobs/:id - Delete sync job
 */
router.delete('/jobs/:id', [
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
    const deleted = await syncEngineService.deleteSyncJob(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Sync job not found'
      });
    }

    res.json({
      success: true,
      message: 'Sync job deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete sync job'
    });
  }
});

/**
 * POST /jobs/:id/execute - Execute sync job
 */
router.post('/jobs/:id/execute', [
  param('id').notEmpty().withMessage('Job ID is required'),
  body('syncMode').optional().isIn(['full', 'incremental', 'delta']),
  body('direction').optional().isIn(['bidirectional', 'source_to_target', 'target_to_source'])
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
    const { syncMode, direction } = req.body;

    const execution = await syncEngineService.executeSyncJob(id, {
      syncMode,
      direction
    });

    res.json({
      success: true,
      data: execution,
      message: 'Sync job execution started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute sync job'
    });
  }
});

/**
 * GET /executions - List sync executions
 */
router.get('/executions', [
  query('jobId').optional().isString(),
  query('status').optional().isIn(['running', 'completed', 'failed', 'cancelled']),
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

    const { jobId, status, page = 1, limit = 20 } = req.query;

    const filters: any = {};
    if (jobId) filters.jobId = jobId;
    if (status) filters.status = status;

    const allExecutions = syncEngineService.getExecutions(filters);

    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedExecutions = allExecutions.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedExecutions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: allExecutions.length,
        totalPages: Math.ceil(allExecutions.length / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get executions'
    });
  }
});

/**
 * GET /executions/:id - Get specific execution
 */
router.get('/executions/:id', [
  param('id').notEmpty().withMessage('Execution ID is required')
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
    const execution = syncEngineService.getExecution(id);

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }

    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get execution'
    });
  }
});

/**
 * POST /executions/:id/cancel - Cancel execution
 */
router.post('/executions/:id/cancel', [
  param('id').notEmpty().withMessage('Execution ID is required')
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
    const cancelled = await syncEngineService.cancelExecution(id);

    if (!cancelled) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found or cannot be cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Execution cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel execution'
    });
  }
});

/**
 * GET /mappings - List sync mappings
 */
router.get('/mappings', [
  query('sourceSystem').optional().isString(),
  query('targetSystem').optional().isString(),
  query('entityType').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { sourceSystem, targetSystem, entityType } = req.query;

    const mappings = syncEngineService.getSyncMappings(
      sourceSystem as string,
      targetSystem as string,
      entityType as string
    );

    res.json({
      success: true,
      data: mappings,
      total: mappings.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sync mappings'
    });
  }
});

/**
 * POST /mappings - Create sync mapping
 */
router.post('/mappings', [
  body('sourceSystem').notEmpty().withMessage('Source system is required'),
  body('targetSystem').notEmpty().withMessage('Target system is required'),
  body('entityType').notEmpty().withMessage('Entity type is required'),
  body('fieldMappings').isArray().withMessage('Field mappings must be an array'),
  body('transformations').optional().isArray(),
  body('isActive').optional().isBoolean(),
  body('priority').optional().isInt({ min: 1, max: 10 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const mappingData = {
      ...req.body,
      transformations: req.body.transformations || [],
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      priority: req.body.priority || 5
    };

    const newMapping = await syncEngineService.createSyncMapping(mappingData);

    res.status(201).json({
      success: true,
      data: newMapping
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create sync mapping'
    });
  }
});

/**
 * GET /mappings/:id - Get specific sync mapping
 */
router.get('/mappings/:id', [
  param('id').notEmpty().withMessage('Mapping ID is required')
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
    const mapping = syncEngineService.getSyncMapping(id);

    if (!mapping) {
      return res.status(404).json({
        success: false,
        error: 'Sync mapping not found'
      });
    }

    res.json({
      success: true,
      data: mapping
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sync mapping'
    });
  }
});

/**
 * GET /conflicts - List sync conflicts
 */
router.get('/conflicts', [
  query('status').optional().isIn(['pending', 'resolved', 'ignored']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('entityType').optional().isString(),
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

    const { status, priority, entityType, page = 1, limit = 20 } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (entityType) filters.entityType = entityType;

    const allConflicts = syncEngineService.getConflicts(filters);

    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedConflicts = allConflicts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedConflicts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: allConflicts.length,
        totalPages: Math.ceil(allConflicts.length / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get conflicts'
    });
  }
});

/**
 * GET /conflicts/:id - Get specific conflict
 */
router.get('/conflicts/:id', [
  param('id').notEmpty().withMessage('Conflict ID is required')
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
    const conflict = syncEngineService.getConflict(id);

    if (!conflict) {
      return res.status(404).json({
        success: false,
        error: 'Conflict not found'
      });
    }

    res.json({
      success: true,
      data: conflict
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get conflict'
    });
  }
});

/**
 * GET /metrics - Get sync engine metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = syncEngineService.getMetrics();

    if (!metrics) {
      return res.status(503).json({
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
 * GET /health - Get system health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthStatus = await syncEngineService.getHealthStatus();

    res.json({
      success: true,
      data: healthStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get health status'
    });
  }
});

/**
 * GET /systems - Get available CRM systems
 */
router.get('/systems', async (req: Request, res: Response) => {
  try {
    const systems = [
      {
        id: 'salesforce',
        name: 'Salesforce',
        type: 'crm',
        supportsOAuth: true,
        supportedEntities: ['contact', 'company', 'deal', 'task', 'note'],
        isActive: true
      },
      {
        id: 'hubspot',
        name: 'HubSpot',
        type: 'crm',
        supportsOAuth: true,
        supportedEntities: ['contact', 'company', 'deal', 'task', 'note'],
        isActive: true
      },
      {
        id: 'pipedrive',
        name: 'Pipedrive',
        type: 'crm',
        supportsOAuth: true,
        supportedEntities: ['contact', 'company', 'deal', 'task'],
        isActive: true
      },
      {
        id: 'zoho',
        name: 'Zoho CRM',
        type: 'crm',
        supportsOAuth: true,
        supportedEntities: ['contact', 'company', 'deal', 'task', 'note'],
        isActive: false
      }
    ];

    res.json({
      success: true,
      data: systems,
      total: systems.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get systems'
    });
  }
});

export default router;
