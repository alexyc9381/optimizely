import { Request, Response, Router } from 'express';
import ContactEnrichmentService, {
    ContactEnrichmentRequest,
    EnrichmentFilters
} from '../services/contact-enrichment-service';

const router = Router();
const contactEnrichmentService = new ContactEnrichmentService();

// =============================================================================
// OVERVIEW & DASHBOARD
// =============================================================================

/**
 * GET /overview
 * Get overview of contact enrichment system status
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const [health, metrics, providers, workflows] = await Promise.all([
      contactEnrichmentService.healthCheck(),
      contactEnrichmentService.getMetrics(),
      contactEnrichmentService.getProviders({ isActive: true }),
      contactEnrichmentService.getWorkflows({ isActive: true })
    ]);

    const recentExecutions = contactEnrichmentService.getExecutions()
      .slice(0, 10)
      .map(execution => ({
        id: execution.id,
        contactId: execution.contactId,
        status: execution.status,
        qualityScore: execution.qualityScore,
        cost: execution.cost,
        startTime: execution.startTime,
        endTime: execution.endTime
      }));

    res.json({
      health,
      metrics,
      providers: {
        total: providers.length,
        byType: providers.reduce((acc, p) => {
          acc[p.type] = (acc[p.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        list: providers.slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          reliability: p.reliability,
          costPerRequest: p.costPerRequest
        }))
      },
      workflows: {
        total: workflows.length,
        active: workflows.filter(w => w.isActive).length,
        list: workflows.slice(0, 5).map(w => ({
          id: w.id,
          name: w.name,
          executionCount: w.executionCount,
          successRate: w.successRate
        }))
      },
      recentActivity: recentExecutions
    });
  } catch (error) {
    console.error('Error getting contact enrichment overview:', error);
    res.status(500).json({
      error: 'Failed to get overview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// PROVIDER MANAGEMENT
// =============================================================================

/**
 * GET /providers
 * Get all enrichment providers with optional filtering
 */
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const { type, isActive, page = '1', limit = '20' } = req.query;

    const filters: { type?: string; isActive?: boolean } = {};
    if (type && typeof type === 'string') filters.type = type;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const providers = contactEnrichmentService.getProviders(filters);

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedProviders = providers.slice(startIndex, endIndex);

    res.json({
      providers: paginatedProviders,
      pagination: {
        total: providers.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(providers.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting providers:', error);
    res.status(500).json({
      error: 'Failed to get providers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /providers/:providerId
 * Get specific provider details
 */
router.get('/providers/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const provider = contactEnrichmentService.getProvider(providerId);

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Get provider metrics if available
    const metrics = contactEnrichmentService.getMetrics();
    const providerMetrics = metrics?.providerMetrics[providerId];

    res.json({
      provider,
      metrics: providerMetrics || null
    });
  } catch (error) {
    console.error('Error getting provider:', error);
    res.status(500).json({
      error: 'Failed to get provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /providers
 * Add a new enrichment provider
 */
router.post('/providers', async (req: Request, res: Response) => {
  try {
    const providerData = req.body;

    // Validate required fields
    const requiredFields = ['name', 'type', 'apiUrl', 'apiKey', 'supportedTypes'];
    for (const field of requiredFields) {
      if (!providerData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const provider = await contactEnrichmentService.addProvider(providerData);
    res.status(201).json({ provider });
  } catch (error) {
    console.error('Error adding provider:', error);
    res.status(500).json({
      error: 'Failed to add provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /providers/:providerId
 * Update an existing provider
 */
router.put('/providers/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const updates = req.body;

    const provider = await contactEnrichmentService.updateProvider(providerId, updates);

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json({ provider });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({
      error: 'Failed to update provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// ENRICHMENT PROCESSING
// =============================================================================

/**
 * POST /enrich
 * Start contact enrichment process
 */
router.post('/enrich', async (req: Request, res: Response) => {
  try {
    const requestData = req.body as ContactEnrichmentRequest;

    // Validate required fields
    const requiredFields: (keyof ContactEnrichmentRequest)[] = ['contactId', 'enrichmentTypes', 'priority', 'sourceSystem', 'targetSystems'];
    for (const field of requiredFields) {
      if (!requestData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Validate enrichment types
    if (!Array.isArray(requestData.enrichmentTypes) || requestData.enrichmentTypes.length === 0) {
      return res.status(400).json({ error: 'At least one enrichment type is required' });
    }

    // Generate request ID if not provided
    if (!requestData.id) {
      requestData.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const execution = await contactEnrichmentService.enrichContact(requestData);
    res.status(201).json({ execution });
  } catch (error) {
    console.error('Error starting enrichment:', error);
    res.status(500).json({
      error: 'Failed to start enrichment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /enrich/batch
 * Start batch contact enrichment
 */
router.post('/enrich/batch', async (req: Request, res: Response) => {
  try {
    const { requests } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ error: 'Requests array is required and cannot be empty' });
    }

    if (requests.length > 100) {
      return res.status(400).json({ error: 'Batch size cannot exceed 100 requests' });
    }

    const executions = [];
    const errors = [];

    for (const [index, requestData] of requests.entries()) {
      try {
        // Generate request ID if not provided
        if (!requestData.id) {
          requestData.id = `batch_req_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
        }

        const execution = await contactEnrichmentService.enrichContact(requestData);
        executions.push(execution);
      } catch (error) {
        errors.push({
          index,
          contactId: requestData.contactId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.status(201).json({
      executions,
      errors,
      summary: {
        total: requests.length,
        successful: executions.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('Error starting batch enrichment:', error);
    res.status(500).json({
      error: 'Failed to start batch enrichment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /executions
 * Get enrichment executions with filtering
 */
router.get('/executions', async (req: Request, res: Response) => {
  try {
    const {
      contactId,
      status,
      providerId,
      startDate,
      endDate,
      minQuality,
      maxCost,
      page = '1',
      limit = '20'
    } = req.query;

    const filters: EnrichmentFilters = {};
    if (contactId && typeof contactId === 'string') filters.contactId = contactId;
    if (status && typeof status === 'string') filters.status = status;
    if (providerId && typeof providerId === 'string') filters.providerId = providerId;
    if (startDate && typeof startDate === 'string') filters.startDate = new Date(startDate);
    if (endDate && typeof endDate === 'string') filters.endDate = new Date(endDate);
    if (minQuality && typeof minQuality === 'string') filters.minQuality = parseFloat(minQuality);
    if (maxCost && typeof maxCost === 'string') filters.maxCost = parseFloat(maxCost);

    const executions = contactEnrichmentService.getExecutions(filters);

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedExecutions = executions.slice(startIndex, endIndex);

    res.json({
      executions: paginatedExecutions,
      pagination: {
        total: executions.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(executions.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting executions:', error);
    res.status(500).json({
      error: 'Failed to get executions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /executions/:executionId
 * Get specific execution details
 */
router.get('/executions/:executionId', async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;
    const execution = contactEnrichmentService.getExecution(executionId);

    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    res.json({ execution });
  } catch (error) {
    console.error('Error getting execution:', error);
    res.status(500).json({
      error: 'Failed to get execution',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// WORKFLOW MANAGEMENT
// =============================================================================

/**
 * GET /workflows
 * Get all enrichment workflows
 */
router.get('/workflows', async (req: Request, res: Response) => {
  try {
    const { isActive, page = '1', limit = '20' } = req.query;

    const filters: { isActive?: boolean } = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const workflows = contactEnrichmentService.getWorkflows(filters);

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedWorkflows = workflows.slice(startIndex, endIndex);

    res.json({
      workflows: paginatedWorkflows,
      pagination: {
        total: workflows.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(workflows.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting workflows:', error);
    res.status(500).json({
      error: 'Failed to get workflows',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /workflows/:workflowId
 * Get specific workflow details
 */
router.get('/workflows/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const workflow = contactEnrichmentService.getWorkflow(workflowId);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Get workflow metrics if available
    const metrics = contactEnrichmentService.getMetrics();
    const workflowMetrics = metrics?.workflowMetrics[workflowId];

    res.json({
      workflow,
      metrics: workflowMetrics || null
    });
  } catch (error) {
    console.error('Error getting workflow:', error);
    res.status(500).json({
      error: 'Failed to get workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /workflows
 * Create a new enrichment workflow
 */
router.post('/workflows', async (req: Request, res: Response) => {
  try {
    const workflowData = req.body;

    // Validate required fields
    const requiredFields = ['name', 'description', 'triggers', 'steps'];
    for (const field of requiredFields) {
      if (!workflowData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Validate triggers and steps arrays
    if (!Array.isArray(workflowData.triggers) || workflowData.triggers.length === 0) {
      return res.status(400).json({ error: 'At least one trigger is required' });
    }

    if (!Array.isArray(workflowData.steps) || workflowData.steps.length === 0) {
      return res.status(400).json({ error: 'At least one step is required' });
    }

    const workflow = await contactEnrichmentService.createWorkflow(workflowData);
    res.status(201).json({ workflow });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      error: 'Failed to create workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /workflows/:workflowId
 * Update an existing workflow
 */
router.put('/workflows/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const updates = req.body;

    const workflow = await contactEnrichmentService.updateWorkflow(workflowId, updates);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({ workflow });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({
      error: 'Failed to update workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /workflows/:workflowId/execute
 * Execute a workflow for a specific contact
 */
router.post('/workflows/:workflowId/execute', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const { contactId, triggerData } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    const execution = await contactEnrichmentService.executeWorkflow(workflowId, contactId, triggerData);
    res.status(201).json({ execution });
  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({
      error: 'Failed to execute workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// QUALITY MANAGEMENT
// =============================================================================

/**
 * POST /quality/assess
 * Assess data quality for a contact
 */
router.post('/quality/assess', async (req: Request, res: Response) => {
  try {
    const { contactId, contactData } = req.body;

    if (!contactId || !contactData) {
      return res.status(400).json({ error: 'Contact ID and contact data are required' });
    }

    const assessment = await contactEnrichmentService.assessDataQuality(contactId, contactData);
    res.json({ assessment });
  } catch (error) {
    console.error('Error assessing data quality:', error);
    res.status(500).json({
      error: 'Failed to assess data quality',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /quality/assessments
 * Get all quality assessments
 */
router.get('/quality/assessments', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;

    const assessments = contactEnrichmentService.getQualityAssessments();

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedAssessments = assessments.slice(startIndex, endIndex);

    res.json({
      assessments: paginatedAssessments,
      pagination: {
        total: assessments.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(assessments.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting quality assessments:', error);
    res.status(500).json({
      error: 'Failed to get quality assessments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /quality/assessments/:contactId
 * Get quality assessment for a specific contact
 */
router.get('/quality/assessments/:contactId', async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;
    const assessment = contactEnrichmentService.getQualityAssessment(contactId);

    if (!assessment) {
      return res.status(404).json({ error: 'Quality assessment not found for this contact' });
    }

    res.json({ assessment });
  } catch (error) {
    console.error('Error getting quality assessment:', error);
    res.status(500).json({
      error: 'Failed to get quality assessment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// METRICS & ANALYTICS
// =============================================================================

/**
 * GET /metrics
 * Get enrichment system metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = contactEnrichmentService.getMetrics();

    if (!metrics) {
      return res.status(404).json({ error: 'Metrics not available yet' });
    }

    res.json({ metrics });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      error: 'Failed to get metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /metrics/providers
 * Get provider-specific metrics
 */
router.get('/metrics/providers', async (req: Request, res: Response) => {
  try {
    const metrics = contactEnrichmentService.getMetrics();

    if (!metrics) {
      return res.status(404).json({ error: 'Metrics not available yet' });
    }

    const providerMetrics = Object.entries(metrics.providerMetrics).map(([providerId, providerMetric]) => {
      const provider = contactEnrichmentService.getProvider(providerId);
      return {
        providerId,
        providerName: provider?.name || 'Unknown',
        providerType: provider?.type || 'Unknown',
        ...providerMetric
      };
    });

    res.json({ providerMetrics });
  } catch (error) {
    console.error('Error getting provider metrics:', error);
    res.status(500).json({
      error: 'Failed to get provider metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /metrics/workflows
 * Get workflow-specific metrics
 */
router.get('/metrics/workflows', async (req: Request, res: Response) => {
  try {
    const metrics = contactEnrichmentService.getMetrics();

    if (!metrics) {
      return res.status(404).json({ error: 'Metrics not available yet' });
    }

    const workflowMetrics = Object.entries(metrics.workflowMetrics).map(([workflowId, workflowMetric]) => {
      const workflow = contactEnrichmentService.getWorkflow(workflowId);
      return {
        workflowId,
        workflowName: workflow?.name || 'Unknown',
        isActive: workflow?.isActive || false,
        ...workflowMetric
      };
    });

    res.json({ workflowMetrics });
  } catch (error) {
    console.error('Error getting workflow metrics:', error);
    res.status(500).json({
      error: 'Failed to get workflow metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /metrics/quality-trends
 * Get data quality trends over time
 */
router.get('/metrics/quality-trends', async (req: Request, res: Response) => {
  try {
    const metrics = contactEnrichmentService.getMetrics();

    if (!metrics) {
      return res.status(404).json({ error: 'Metrics not available yet' });
    }

    res.json({ qualityTrends: metrics.qualityTrends });
  } catch (error) {
    console.error('Error getting quality trends:', error);
    res.status(500).json({
      error: 'Failed to get quality trends',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// HEALTH & MONITORING
// =============================================================================

/**
 * GET /health
 * Get system health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await contactEnrichmentService.healthCheck();

    const statusCode = health.status === 'healthy' ? 200 :
                      health.status === 'degraded' ? 206 : 503;

    res.status(statusCode).json({ health });
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({
      error: 'Failed to get health status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// UTILITY ENDPOINTS
// =============================================================================

/**
 * GET /supported-types
 * Get all supported enrichment types across providers
 */
router.get('/supported-types', async (req: Request, res: Response) => {
  try {
    const providers = contactEnrichmentService.getProviders({ isActive: true });

    const typesByProvider = providers.reduce((acc, provider) => {
      acc[provider.id] = {
        name: provider.name,
        type: provider.type,
        supportedTypes: provider.supportedTypes,
        costPerRequest: provider.costPerRequest,
        reliability: provider.reliability
      };
      return acc;
    }, {} as Record<string, any>);

    const allTypes = [...new Set(providers.flatMap(p => p.supportedTypes))];

    res.json({
      allSupportedTypes: allTypes,
      typesByProvider
    });
  } catch (error) {
    console.error('Error getting supported types:', error);
    res.status(500).json({
      error: 'Failed to get supported types',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /cost-estimate
 * Estimate cost for enrichment request
 */
router.post('/cost-estimate', async (req: Request, res: Response) => {
  try {
    const { enrichmentTypes } = req.body;

    if (!Array.isArray(enrichmentTypes) || enrichmentTypes.length === 0) {
      return res.status(400).json({ error: 'Enrichment types array is required' });
    }

    let totalCost = 0;
    const costBreakdown = [];

    for (const enrichmentType of enrichmentTypes) {
      const provider = contactEnrichmentService.getProvider(enrichmentType.provider);

      if (!provider) {
        return res.status(400).json({
          error: `Provider ${enrichmentType.provider} not found`
        });
      }

      const cost = provider.costPerRequest;
      totalCost += cost;

      costBreakdown.push({
        type: enrichmentType.type,
        provider: provider.name,
        cost: cost
      });
    }

    res.json({
      totalCost,
      costBreakdown,
      currency: 'USD'
    });
  } catch (error) {
    console.error('Error estimating cost:', error);
    res.status(500).json({
      error: 'Failed to estimate cost',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
