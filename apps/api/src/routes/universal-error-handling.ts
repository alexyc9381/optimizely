import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import UniversalErrorHandlingService from '../services/universal-error-handling-service';

const router = express.Router();
const errorHandlingService = new UniversalErrorHandlingService();

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

const handleValidationErrors = (req: Request, res: Response, next: any) => {
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
// ERROR RECORDING & MANAGEMENT
// =============================================================================

/**
 * POST /errors - Record a new error
 */
router.post('/errors', [
  body('error').notEmpty().withMessage('Error message or object is required'),
  body('context.service').notEmpty().withMessage('Service name is required'),
  body('context.operation').notEmpty().withMessage('Operation name is required'),
  body('classification').optional().isObject(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { error, context, classification } = req.body;
    const errorId = await errorHandlingService.recordError(error, context, classification);

    res.status(201).json({
      success: true,
      data: { errorId, message: 'Error recorded successfully' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record error'
    });
  }
});

/**
 * GET /errors - Get error records with optional filtering
 */
router.get('/errors', [
  query('status').optional().isIn(['active', 'retrying', 'resolved', 'failed', 'ignored']),
  query('category').optional().isString(),
  query('service').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { status, category, service, limit = 50, offset = 0 } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (service) filters.service = service;

    let errors = errorHandlingService.getErrorRecords(filters);
    const total = errors.length;
    const paginatedErrors = errors.slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      success: true,
      data: {
        errors: paginatedErrors,
        pagination: { total, limit: Number(limit), offset: Number(offset) }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve errors'
    });
  }
});

/**
 * GET /errors/:errorId - Get specific error details
 */
router.get('/errors/:errorId', [
  param('errorId').notEmpty().withMessage('Error ID is required'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { errorId } = req.params;
    const errors = errorHandlingService.getErrorRecords();
    const error = errors.find(e => e.id === errorId);

    if (!error) {
      return res.status(404).json({
        success: false,
        error: 'Error record not found'
      });
    }

    res.json({
      success: true,
      data: error
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve error'
    });
  }
});

/**
 * POST /errors/:errorId/resolve - Resolve an error
 */
router.post('/errors/:errorId/resolve', [
  param('errorId').notEmpty().withMessage('Error ID is required'),
  body('resolution').notEmpty().withMessage('Resolution description is required'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { errorId } = req.params;
    const { resolution } = req.body;

    const success = await errorHandlingService.resolveError(errorId, resolution);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Error record not found' });
    }

    res.json({
      success: true,
      data: { message: 'Error resolved successfully', errorId, resolution }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resolve error'
    });
  }
});

/**
 * POST /errors/:errorId/retry - Manually trigger error retry
 */
router.post('/errors/:errorId/retry', [
  param('errorId').notEmpty().withMessage('Error ID is required'),
  body('strategy').optional().isObject(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { errorId } = req.params;
    const { strategy } = req.body;

    const errors = errorHandlingService.getErrorRecords();
    const error = errors.find(e => e.id === errorId);

    if (!error) {
      return res.status(404).json({
        success: false,
        error: 'Error record not found'
      });
    }

    if (error.status === 'resolved') {
      return res.status(400).json({
        success: false,
        error: 'Cannot retry resolved error'
      });
    }

    await errorHandlingService.scheduleRetry(error, strategy);

    res.json({
      success: true,
      data: {
        message: 'Error retry scheduled successfully',
        errorId,
        nextRetryAt: error.nextRetryAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to schedule retry'
    });
  }
});

// =============================================================================
// CIRCUIT BREAKER MANAGEMENT
// =============================================================================

/**
 * GET /circuit-breakers - Get all circuit breaker states
 */
router.get('/circuit-breakers', async (req: Request, res: Response) => {
  try {
    const circuitBreakers = errorHandlingService.getCircuitBreakerStates();

    res.json({
      success: true,
      data: {
        circuitBreakers,
        summary: {
          total: circuitBreakers.length,
          open: circuitBreakers.filter(cb => cb.state === 'open').length,
          halfOpen: circuitBreakers.filter(cb => cb.state === 'half_open').length,
          closed: circuitBreakers.filter(cb => cb.state === 'closed').length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve circuit breakers'
    });
  }
});

/**
 * GET /circuit-breakers/:service/:operation - Get specific circuit breaker state
 */
router.get('/circuit-breakers/:service/:operation', [
  param('service').notEmpty().withMessage('Service name is required'),
  param('operation').notEmpty().withMessage('Operation name is required'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { service, operation } = req.params;
    const circuitBreakers = errorHandlingService.getCircuitBreakerStates();
    const circuitBreaker = circuitBreakers.find(cb => cb.service === service && cb.operation === operation);

    if (!circuitBreaker) {
      return res.status(404).json({
        success: false,
        error: 'Circuit breaker not found'
      });
    }

    res.json({
      success: true,
      data: circuitBreaker
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve circuit breaker'
    });
  }
});

/**
 * POST /circuit-breakers/:service/:operation/test - Test circuit breaker
 */
router.post('/circuit-breakers/:service/:operation/test', [
  param('service').notEmpty().withMessage('Service name is required'),
  param('operation').notEmpty().withMessage('Operation name is required'),
  body('shouldFail').optional().isBoolean(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { service, operation } = req.params;
    const { shouldFail = false } = req.body;

    const testFunction = async () => {
      if (shouldFail) throw new Error('Test failure');
      return { success: true, timestamp: new Date() };
    };

    try {
      const result = await errorHandlingService.executeWithCircuitBreaker(service, operation, testFunction);
      res.json({ success: true, data: { result, message: 'Circuit breaker test executed successfully' } });
    } catch (circuitBreakerError) {
      res.status(503).json({
        success: false,
        error: circuitBreakerError instanceof Error ? circuitBreakerError.message : 'Circuit breaker error',
        circuitBreakerTriggered: true
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test circuit breaker'
    });
  }
});

// =============================================================================
// FALLBACK STRATEGY MANAGEMENT
// =============================================================================

/**
 * POST /fallback-strategies - Add a new fallback strategy
 */
router.post('/fallback-strategies', [
  body('id').notEmpty().withMessage('Strategy ID is required'),
  body('service').notEmpty().withMessage('Service name is required'),
  body('operation').notEmpty().withMessage('Operation name is required'),
  body('type').isIn(['cache', 'default_value', 'alternative_service', 'queue_for_later', 'graceful_degradation']),
  body('config').isObject().withMessage('Configuration object is required'),
  body('priority').isInt({ min: 1 }).withMessage('Priority must be a positive integer'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const strategy = {
      ...req.body,
      isActive: req.body.isActive !== false // Default to true
    };

    await errorHandlingService.addFallbackStrategy(strategy);

    res.status(201).json({
      success: true,
      data: {
        message: 'Fallback strategy added successfully',
        strategy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add fallback strategy'
    });
  }
});

/**
 * POST /fallback-strategies/:service/:operation/execute - Execute fallback for service/operation
 */
router.post('/fallback-strategies/:service/:operation/execute', [
  param('service').notEmpty().withMessage('Service name is required'),
  param('operation').notEmpty().withMessage('Operation name is required'),
  body('originalError').optional().isObject(),
  body('data').optional(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { service, operation } = req.params;
    const { originalError, data } = req.body;

    // Create a mock error record if not provided
    const mockErrorRecord = originalError || {
      id: 'test_error',
      classification: { category: 'system', severity: 'medium' },
      context: { service, operation }
    };

    const result = await errorHandlingService.executeFallback(
      service,
      operation,
      mockErrorRecord,
      data
    );

    res.json({
      success: true,
      data: {
        result,
        message: 'Fallback executed successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute fallback'
    });
  }
});

// =============================================================================
// RECOVERY WORKFLOW MANAGEMENT
// =============================================================================

/**
 * POST /recovery-workflows - Add a new recovery workflow
 */
router.post('/recovery-workflows', [
  body('id').notEmpty().withMessage('Workflow ID is required'),
  body('name').notEmpty().withMessage('Workflow name is required'),
  body('errorCategories').isArray().withMessage('Error categories must be an array'),
  body('steps').isArray().withMessage('Steps must be an array'),
  body('priority').isInt({ min: 1 }).withMessage('Priority must be a positive integer'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const workflow = {
      ...req.body,
      isActive: req.body.isActive !== false, // Default to true
      autoExecute: req.body.autoExecute !== false, // Default to true
    };

    await errorHandlingService.addRecoveryWorkflow(workflow);

    res.status(201).json({
      success: true,
      data: {
        message: 'Recovery workflow added successfully',
        workflow
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add recovery workflow'
    });
  }
});

// =============================================================================
// METRICS & MONITORING
// =============================================================================

/**
 * GET /metrics - Get error handling metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await errorHandlingService.calculateMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate metrics'
    });
  }
});

/**
 * GET /metrics/summary - Get error handling summary
 */
router.get('/metrics/summary', async (req: Request, res: Response) => {
  try {
    const metrics = errorHandlingService.getMetrics();
    const circuitBreakers = errorHandlingService.getCircuitBreakerStates();
    const errors = errorHandlingService.getErrorRecords();

    const summary = {
      overview: {
        totalErrors: metrics?.totalErrors || 0,
        activeErrors: metrics?.activeErrors || 0,
        resolvedErrors: metrics?.resolvedErrors || 0,
        errorRate: metrics?.errorRate || 0
      },
      circuitBreakers: {
        total: circuitBreakers.length,
        open: circuitBreakers.filter(cb => cb.state === 'open').length,
        halfOpen: circuitBreakers.filter(cb => cb.state === 'half_open').length,
        closed: circuitBreakers.filter(cb => cb.state === 'closed').length
      },
      recentErrors: errors.slice(0, 10).map(error => ({
        id: error.id,
        service: error.context.service,
        operation: error.context.operation,
        category: error.classification.category,
        severity: error.classification.severity,
        status: error.status,
        timestamp: error.timestamp
      })),
      errorsByCategory: metrics?.errorsByCategory || {},
      errorsBySeverity: metrics?.errorsBySeverity || {},
      errorsByService: metrics?.errorsByService || {},
      lastCalculated: metrics?.lastCalculated || new Date()
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate summary'
    });
  }
});

/**
 * GET /health - Get service health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthStatus = await errorHandlingService.getHealthStatus();
    const statusCode = healthStatus.status === 'healthy' ? 200 : healthStatus.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({ success: true, data: healthStatus });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get health status'
    });
  }
});

// =============================================================================
// CONFIGURATION & TESTING
// =============================================================================

/**
 * GET /configuration - Get current error handling configuration
 */
router.get('/configuration', async (req: Request, res: Response) => {
  try {
    const circuitBreakers = errorHandlingService.getCircuitBreakerStates();

    const configuration = {
      circuitBreakers: circuitBreakers.map(cb => ({
        id: cb.id,
        service: cb.service,
        operation: cb.operation,
        state: cb.state,
        config: cb.config
      })),
      defaultRetryStrategy: {
        type: 'exponential',
        baseDelay: 1000,
        maxDelay: 60000,
        multiplier: 2,
        jitter: true,
        maxRetries: 5
      },
      defaultCircuitBreakerConfig: {
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 60000,
        monitoringPeriod: 300000,
        halfOpenMaxCalls: 3
      }
    };

    res.json({
      success: true,
      data: configuration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get configuration'
    });
  }
});

/**
 * POST /test/error-simulation - Simulate errors for testing
 */
router.post('/test/error-simulation', [
  body('errorType').isIn(['network', 'authentication', 'rate_limit', 'server_error', 'validation', 'timeout']),
  body('service').notEmpty().withMessage('Service name is required'),
  body('operation').notEmpty().withMessage('Operation name is required'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { errorType, service, operation, severity = 'medium' } = req.body;

    let mockError: Error;
    switch (errorType) {
      case 'network': mockError = new Error('Connection timeout - ETIMEDOUT'); break;
      case 'authentication': mockError = new Error('Unauthorized - Invalid token'); break;
      case 'rate_limit': mockError = new Error('Rate limit exceeded - 429'); break;
      case 'server_error': mockError = new Error('Internal server error - 500'); break;
      case 'validation': mockError = new Error('Validation failed - Invalid data format'); break;
      case 'timeout': mockError = new Error('Request timeout'); break;
      default: mockError = new Error('Unknown error');
    }

    const context = {
      service,
      operation,
      entityType: 'test',
      sessionId: `test_session_${Date.now()}`,
      metadata: { simulation: true, errorType }
    };

    const errorId = await errorHandlingService.recordError(mockError, context, { severity: severity as any });

    res.json({
      success: true,
      data: { message: 'Error simulation completed', errorId, errorType, service, operation }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to simulate error'
    });
  }
});

/**
 * GET /test/mock-data - Get mock data for testing and development
 */
router.get('/test/mock-data', async (req: Request, res: Response) => {
  try {
    const mockData = {
      sampleErrors: [
        {
          error: 'Connection timeout',
          context: { service: 'crm-sync', operation: 'sync_contacts', crmType: 'salesforce' },
          classification: { category: 'network', severity: 'medium' }
        },
        {
          error: 'Rate limit exceeded',
          context: { service: 'webhook-processing', operation: 'process_webhook', crmType: 'hubspot' },
          classification: { category: 'rate_limit', severity: 'medium' }
        },
        {
          error: 'Invalid authentication token',
          context: { service: 'oauth', operation: 'refresh_token', crmType: 'pipedrive' },
          classification: { category: 'authentication', severity: 'high' }
        }
      ],
      sampleFallbackStrategy: {
        id: 'sample_cache_fallback',
        service: 'data-service',
        operation: 'get_data',
        type: 'cache',
        config: {
          cacheKey: 'fallback_data',
          cacheTtl: 3600
        },
        isActive: true,
        priority: 1
      },
      sampleRecoveryWorkflow: {
        id: 'sample_network_recovery',
        name: 'Network Error Recovery',
        errorCategories: ['network', 'timeout'],
        steps: [
          {
            id: 'step_1',
            name: 'Retry with backoff',
            type: 'retry',
            parameters: { strategy: 'exponential' },
            timeout: 30000
          },
          {
            id: 'step_2',
            name: 'Use cache fallback',
            type: 'fallback',
            parameters: { type: 'cache' },
            timeout: 5000
          }
        ],
        isActive: true,
        autoExecute: true,
        priority: 1
      }
    };

    res.json({
      success: true,
      data: mockData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate mock data'
    });
  }
});

export default router;
