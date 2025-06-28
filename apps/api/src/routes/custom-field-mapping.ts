import { Request, Response, Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import CustomFieldMappingService, {
    FieldMapping,
    MappingFilters
} from '../services/custom-field-mapping-service';
import { redisManager } from '../services/redis-client';

const router = Router();

// Initialize service
const mappingService = new CustomFieldMappingService(redisManager.getClient());
mappingService.generateMockData();

// =============================================================================
// OVERVIEW & DASHBOARD ROUTES
// =============================================================================

/**
 * GET /overview - Custom Field Mapping system overview and dashboard
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const mappings = mappingService.getMappings();
    const activeMappings = mappings.filter(m => m.isActive);
    const metrics = mappingService.getMetrics();
    const healthStatus = await mappingService.healthCheck();
    const recentExecutions = mappingService.getExecutions().slice(0, 10);

    const overview = {
      system: {
        status: healthStatus.status,
        mappingsCount: mappings.length,
        activeMappingsCount: activeMappings.length,
        executionsCount: healthStatus.executions,
        errorRate: healthStatus.errorRate,
        metricsStatus: healthStatus.metricsStatus
      },
      mappings: {
        total: mappings.length,
        active: activeMappings.length,
        inactive: mappings.length - activeMappings.length,
        bySystem: mappings.reduce((acc: Record<string, number>, mapping) => {
          const key = `${mapping.sourceSystem}->${mapping.targetSystem}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {}),
        byDataType: mappings.reduce((acc: Record<string, number>, mapping) => {
          acc[mapping.dataType] = (acc[mapping.dataType] || 0) + 1;
          return acc;
        }, {})
      },
      recentActivity: recentExecutions.map(execution => ({
        id: execution.id,
        mappingId: execution.mappingId,
        status: execution.status,
        executionTime: execution.executionTime,
        timestamp: execution.timestamp,
        hasErrors: execution.errors.length > 0
      })),
      metrics,
      recommendations: [
        {
          type: 'performance',
          message: 'Consider optimizing slow-running mappings',
          priority: healthStatus.errorRate > 10 ? 'high' : 'medium'
        },
        {
          type: 'reliability',
          message: 'Review mappings with high error rates',
          priority: healthStatus.errorRate > 20 ? 'high' : 'low'
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
      error: error instanceof Error ? error.message : 'Failed to get mapping overview'
    });
  }
});

// =============================================================================
// FIELD MAPPING MANAGEMENT ROUTES
// =============================================================================

/**
 * GET /mappings - List all field mappings with optional filtering
 */
router.get('/mappings', [
  query('sourceSystem').optional().isString(),
  query('targetSystem').optional().isString(),
  query('dataType').optional().isIn(['string', 'number', 'boolean', 'date', 'object', 'array']),
  query('isActive').optional().isBoolean(),
  query('isBidirectional').optional().isBoolean(),
  query('createdBy').optional().isString(),
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
      sourceSystem,
      targetSystem,
      dataType,
      isActive,
      isBidirectional,
      createdBy,
      page = 1,
      limit = 20
    } = req.query;

    const filters: MappingFilters = {};
    if (sourceSystem) filters.sourceSystem = sourceSystem as string;
    if (targetSystem) filters.targetSystem = targetSystem as string;
    if (dataType) filters.dataType = dataType as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (isBidirectional !== undefined) filters.isBidirectional = isBidirectional === 'true';
    if (createdBy) filters.createdBy = createdBy as string;

    const allMappings = mappingService.getMappings(filters);
    const totalItems = allMappings.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const mappings = allMappings.slice(startIndex, endIndex);

    // Add execution statistics to each mapping
    const mappingsWithStats = mappings.map(mapping => {
      const executions = mappingService.getExecutions({ mappingId: mapping.id });
      const successfulExecutions = executions.filter(e => e.status === 'success');
      const errorExecutions = executions.filter(e => e.status === 'error');

      return {
        ...mapping,
        stats: {
          totalExecutions: executions.length,
          successfulExecutions: successfulExecutions.length,
          errorExecutions: errorExecutions.length,
          successRate: executions.length > 0 ? (successfulExecutions.length / executions.length) * 100 : 0,
          averageExecutionTime: executions.length > 0
            ? executions.reduce((sum, e) => sum + e.executionTime, 0) / executions.length
            : 0,
          lastExecuted: executions.length > 0 ? executions[0].timestamp : null
        }
      };
    });

    res.json({
      success: true,
      data: mappingsWithStats,
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
      error: error instanceof Error ? error.message : 'Failed to get mappings'
    });
  }
});

/**
 * GET /mappings/:id - Get specific field mapping by ID
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
    const mapping = mappingService.getMapping(id);

    if (!mapping) {
      return res.status(404).json({
        success: false,
        error: 'Mapping not found'
      });
    }

    // Add execution history
    const executions = mappingService.getExecutions({ mappingId: id }).slice(0, 50);
    const stats = {
      totalExecutions: executions.length,
      successfulExecutions: executions.filter(e => e.status === 'success').length,
      errorExecutions: executions.filter(e => e.status === 'error').length,
      averageExecutionTime: executions.length > 0
        ? executions.reduce((sum, e) => sum + e.executionTime, 0) / executions.length
        : 0
    };

    res.json({
      success: true,
      data: {
        ...mapping,
        stats,
        recentExecutions: executions.slice(0, 10)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get mapping'
    });
  }
});

/**
 * POST /mappings - Create new field mapping
 */
router.post('/mappings', [
  body('name').notEmpty().withMessage('Mapping name is required'),
  body('sourceSystem').notEmpty().withMessage('Source system is required'),
  body('targetSystem').notEmpty().withMessage('Target system is required'),
  body('sourceField').notEmpty().withMessage('Source field is required'),
  body('targetField').notEmpty().withMessage('Target field is required'),
  body('dataType').isIn(['string', 'number', 'boolean', 'date', 'object', 'array']).withMessage('Invalid data type'),
  body('isActive').optional().isBoolean(),
  body('isBidirectional').optional().isBoolean(),
  body('priority').optional().isInt({ min: 1 }),
  body('transformationRule').optional().isObject(),
  body('validationRules').optional().isArray(),
  body('createdBy').notEmpty().withMessage('Created by is required')
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
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      isBidirectional: req.body.isBidirectional !== undefined ? req.body.isBidirectional : false,
      priority: req.body.priority || 10,
      validationRules: req.body.validationRules || []
    };

    const mapping = await mappingService.createMapping(mappingData);

    res.status(201).json({
      success: true,
      data: mapping,
      message: 'Field mapping created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create mapping'
    });
  }
});

/**
 * PUT /mappings/:id - Update existing field mapping
 */
router.put('/mappings/:id', [
  param('id').notEmpty().withMessage('Mapping ID is required'),
  body('name').optional().notEmpty(),
  body('sourceSystem').optional().notEmpty(),
  body('targetSystem').optional().notEmpty(),
  body('sourceField').optional().notEmpty(),
  body('targetField').optional().notEmpty(),
  body('dataType').optional().isIn(['string', 'number', 'boolean', 'date', 'object', 'array']),
  body('isActive').optional().isBoolean(),
  body('isBidirectional').optional().isBoolean(),
  body('priority').optional().isInt({ min: 1 }),
  body('transformationRule').optional().isObject(),
  body('validationRules').optional().isArray()
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

    const mapping = await mappingService.updateMapping(id, updates);

    if (!mapping) {
      return res.status(404).json({
        success: false,
        error: 'Mapping not found'
      });
    }

    res.json({
      success: true,
      data: mapping,
      message: 'Field mapping updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update mapping'
    });
  }
});

/**
 * DELETE /mappings/:id - Delete field mapping
 */
router.delete('/mappings/:id', [
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
    const deleted = await mappingService.deleteMapping(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Mapping not found'
      });
    }

    res.json({
      success: true,
      message: 'Field mapping deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete mapping'
    });
  }
});

// =============================================================================
// FIELD TRANSFORMATION & EXECUTION ROUTES
// =============================================================================

/**
 * POST /mappings/:id/execute - Execute field mapping transformation
 */
router.post('/mappings/:id/execute', [
  param('id').notEmpty().withMessage('Mapping ID is required'),
  body('sourceData').notEmpty().withMessage('Source data is required'),
  body('options').optional().isObject()
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
    const { sourceData, options = {} } = req.body;

    const execution = await mappingService.executeMapping(id, sourceData, options);

    res.json({
      success: true,
      data: execution,
      message: execution.status === 'success' ? 'Mapping executed successfully' : 'Mapping executed with warnings/errors'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute mapping'
    });
  }
});

/**
 * POST /mappings/validate - Validate field mapping configuration
 */
router.post('/mappings/validate', [
  body('mapping').isObject().withMessage('Mapping object is required'),
  body('mapping.sourceField').notEmpty().withMessage('Source field is required'),
  body('mapping.targetField').notEmpty().withMessage('Target field is required'),
  body('mapping.sourceSystem').notEmpty().withMessage('Source system is required'),
  body('mapping.targetSystem').notEmpty().withMessage('Target system is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { mapping } = req.body;

    // Create a temporary mapping for validation
    const tempMapping = {
      id: 'temp_validation',
      name: 'Validation Mapping',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'validation',
      isActive: true,
      isBidirectional: false,
      priority: 1,
      validationRules: [],
      ...mapping
    };

    const validation = await mappingService.validateMapping(tempMapping as FieldMapping);

    res.json({
      success: true,
      data: validation,
      message: validation.isValid ? 'Mapping is valid' : 'Mapping has validation errors'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate mapping'
    });
  }
});

// =============================================================================
// EXECUTION HISTORY & MONITORING ROUTES
// =============================================================================

/**
 * GET /executions - Get mapping execution history
 */
router.get('/executions', [
  query('mappingId').optional().isString(),
  query('status').optional().isIn(['success', 'warning', 'error']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
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
      mappingId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const filters: any = {};
    if (mappingId) filters.mappingId = mappingId as string;
    if (status) filters.status = status as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const allExecutions = mappingService.getExecutions(filters);
    const totalItems = allExecutions.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const executions = allExecutions.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: executions,
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
      error: error instanceof Error ? error.message : 'Failed to get executions'
    });
  }
});

/**
 * GET /metrics - Get field mapping system metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = mappingService.getMetrics();

    if (!metrics) {
      return res.status(503).json({
        success: false,
        error: 'Metrics not available yet'
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
 * GET /health - System health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await mappingService.healthCheck();

    res.status(health.status === 'healthy' ? 200 : health.status === 'degraded' ? 206 : 503).json({
      success: true,
      data: health,
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
 * GET /systems - Get list of supported systems
 */
router.get('/systems', async (req: Request, res: Response) => {
  try {
    const mappings = mappingService.getMappings();
    const sourceSystems = [...new Set(mappings.map(m => m.sourceSystem))];
    const targetSystems = [...new Set(mappings.map(m => m.targetSystem))];

    const systemCompatibility: Record<string, string[]> = {};
    mappings.forEach(mapping => {
      if (!systemCompatibility[mapping.sourceSystem]) {
        systemCompatibility[mapping.sourceSystem] = [];
      }
      if (!systemCompatibility[mapping.sourceSystem].includes(mapping.targetSystem)) {
        systemCompatibility[mapping.sourceSystem].push(mapping.targetSystem);
      }
    });

    res.json({
      success: true,
      data: {
        sourceSystems: sourceSystems.sort(),
        targetSystems: targetSystems.sort(),
        compatibility: systemCompatibility,
        supportedDataTypes: ['string', 'number', 'boolean', 'date', 'object', 'array']
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get systems information'
    });
  }
});

export default router;
