import { Request, Response, Router } from 'express';
import ABTestingService, {
    AssignmentContext,
    ConfigurationType,
    Experiment,
    ExperimentStatus,
    ExperimentType
} from '../services/ab-testing-service';

const router = Router();
const abTestingService = ABTestingService.getInstance();

// Input validation helpers
const validateExperimentType = (type: string): ExperimentType => {
  if (!Object.values(ExperimentType).includes(type as ExperimentType)) {
    throw new Error(`Invalid experiment type: ${type}. Valid types: ${Object.values(ExperimentType).join(', ')}`);
  }
  return type as ExperimentType;
};

const validateExperimentStatus = (status: string): ExperimentStatus => {
  if (!Object.values(ExperimentStatus).includes(status as ExperimentStatus)) {
    throw new Error(`Invalid experiment status: ${status}. Valid statuses: ${Object.values(ExperimentStatus).join(', ')}`);
  }
  return status as ExperimentStatus;
};

const validateIndustry = (industry?: string): string | undefined => {
  if (!industry) return undefined;

  const validIndustries = ['saas', 'manufacturing', 'healthcare', 'fintech', 'college_consulting'];
  if (!validIndustries.includes(industry.toLowerCase())) {
    throw new Error(`Invalid industry: ${industry}. Valid industries: ${validIndustries.join(', ')}`);
  }
  return industry.toLowerCase();
};

// GET /experiments - List experiments with filtering
router.get('/experiments', async (req: Request, res: Response) => {
  try {
    const { status, industry, type, page = '1', limit = '20' } = req.query;

    const filters: any = {};

    if (status) {
      filters.status = validateExperimentStatus(status as string);
    }

    if (industry) {
      filters.industry = validateIndustry(industry as string);
    }

    if (type) {
      filters.type = validateExperimentType(type as string);
    }

    const experiments = await abTestingService.getExperiments(filters);

    // Apply pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedExperiments = experiments.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        experiments: paginatedExperiments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: experiments.length,
          totalPages: Math.ceil(experiments.length / limitNum),
          hasNext: endIndex < experiments.length,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to fetch experiments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /experiments/:id - Get specific experiment
router.get('/experiments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { includeAssignments = 'false', includeEvents = 'false' } = req.query;

    const experiment = await abTestingService.getExperiment(id);

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    const response: any = { experiment };

    if (includeAssignments === 'true') {
      response.assignments = await abTestingService.getExperimentAssignments(id);
    }

    if (includeEvents === 'true') {
      response.conversionEvents = await abTestingService.getConversionEvents(id);
    }

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch experiment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /experiments - Create new experiment
router.post('/experiments', async (req: Request, res: Response) => {
  try {
    const experimentData = req.body;

    // Validate required fields
    const requiredFields = ['name', 'description', 'type', 'hypothesis', 'successMetrics', 'variants', 'trafficAllocation', 'statisticalConfig', 'metadata'];
    for (const field of requiredFields) {
      if (!experimentData[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    // Validate experiment type
    experimentData.type = validateExperimentType(experimentData.type);

    // Validate industry if provided
    if (experimentData.industry) {
      experimentData.industry = validateIndustry(experimentData.industry);
    }

    // Set default status
    experimentData.status = ExperimentStatus.DRAFT;

    // Set default sample size if not provided
    if (!experimentData.sampleSize) {
      experimentData.sampleSize = 0; // Will be calculated based on statistical config
    }

    // Validate variants
    if (!Array.isArray(experimentData.variants) || experimentData.variants.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 variants are required'
      });
    }

    // Ensure one control variant exists
    const hasControl = experimentData.variants.some((v: any) => v.isControl === true);
    if (!hasControl) {
      return res.status(400).json({
        success: false,
        error: 'At least one variant must be marked as control'
      });
    }

    // Validate statistical config
    const { confidenceLevel, powerLevel, alphaLevel } = experimentData.statisticalConfig;
    if (confidenceLevel <= 0 || confidenceLevel >= 1) {
      return res.status(400).json({
        success: false,
        error: 'Confidence level must be between 0 and 1'
      });
    }
    if (powerLevel <= 0 || powerLevel >= 1) {
      return res.status(400).json({
        success: false,
        error: 'Power level must be between 0 and 1'
      });
    }
    if (alphaLevel <= 0 || alphaLevel >= 1) {
      return res.status(400).json({
        success: false,
        error: 'Alpha level must be between 0 and 1'
      });
    }

    const experimentId = await abTestingService.createExperiment(experimentData);

    res.status(201).json({
      success: true,
      data: {
        experimentId,
        message: 'Experiment created successfully'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create experiment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /experiments/:id - Update experiment
router.put('/experiments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate type if being updated
    if (updates.type) {
      updates.type = validateExperimentType(updates.type);
    }

    // Validate industry if being updated
    if (updates.industry) {
      updates.industry = validateIndustry(updates.industry);
    }

    // Validate status if being updated
    if (updates.status) {
      updates.status = validateExperimentStatus(updates.status);
    }

    await abTestingService.updateExperiment(id, updates);

    res.json({
      success: true,
      data: {
        message: 'Experiment updated successfully'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update experiment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /experiments/:id/start - Start experiment
router.post('/experiments/:id/start', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await abTestingService.startExperiment(id);

    res.json({
      success: true,
      data: {
        message: 'Experiment started successfully'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to start experiment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /experiments/:id/stop - Stop experiment
router.post('/experiments/:id/stop', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason = 'Manual stop' } = req.body;

    await abTestingService.stopExperiment(id, reason);

    res.json({
      success: true,
      data: {
        message: 'Experiment stopped successfully'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to stop experiment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /experiments/:id/assign - Assign participant to experiment
router.post('/experiments/:id/assign', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, context } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!context) {
      return res.status(400).json({
        success: false,
        error: 'Assignment context is required'
      });
    }

    // Validate context fields
    const requiredContextFields = ['industry', 'userSegment', 'deviceType', 'geography', 'trafficSource'];
    for (const field of requiredContextFields) {
      if (!context[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required context field: ${field}`
        });
      }
    }

    const variantId = await abTestingService.assignParticipant(userId, id, context as AssignmentContext);

    res.json({
      success: true,
      data: {
        variantId,
        message: 'Participant assigned successfully'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to assign participant',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /experiments/:id/conversions - Record conversion event
router.post('/experiments/:id/conversions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, eventType, value = 1, metadata = {} } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'Event type is required'
      });
    }

    // Validate value is a number
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      return res.status(400).json({
        success: false,
        error: 'Value must be a number'
      });
    }

    await abTestingService.recordConversion(id, userId, eventType, numericValue, metadata);

    res.json({
      success: true,
      data: {
        message: 'Conversion recorded successfully'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to record conversion',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /experiments/:id/assignments - Get experiment assignments
router.get('/experiments/:id/assignments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50', variant, userId } = req.query;

    let assignments = await abTestingService.getExperimentAssignments(id);

    // Filter by variant if specified
    if (variant) {
      assignments = assignments.filter(a => a.variantId === variant);
    }

    // Filter by user ID if specified
    if (userId) {
      assignments = assignments.filter(a => a.userId === userId);
    }

    // Apply pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedAssignments = assignments.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        assignments: paginatedAssignments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: assignments.length,
          totalPages: Math.ceil(assignments.length / limitNum),
          hasNext: endIndex < assignments.length,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assignments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /experiments/:id/events - Get conversion events
router.get('/experiments/:id/events', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50', eventType, variant, userId } = req.query;

    let events = await abTestingService.getConversionEvents(id);

    // Filter by event type if specified
    if (eventType) {
      events = events.filter(e => e.eventType === eventType);
    }

    // Filter by variant if specified
    if (variant) {
      events = events.filter(e => e.variantId === variant);
    }

    // Filter by user ID if specified
    if (userId) {
      events = events.filter(e => e.userId === userId);
    }

    // Apply pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedEvents = events.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        events: paginatedEvents,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: events.length,
          totalPages: Math.ceil(events.length / limitNum),
          hasNext: endIndex < events.length,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversion events',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /stats - Get overall A/B testing statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await abTestingService.getExperimentStats();

    // Calculate additional metrics
    const experiments = await abTestingService.getExperiments();
    const runningExperiments = experiments.filter(e => e.status === ExperimentStatus.RUNNING);
    const completedExperiments = experiments.filter(e => e.status === ExperimentStatus.COMPLETED);

    // Calculate success rate (experiments with significant results)
    const successfulExperiments = completedExperiments.filter(e =>
      e.results && e.results.statisticalSignificance
    );

    const successRate = completedExperiments.length > 0
      ? (successfulExperiments.length / completedExperiments.length) * 100
      : 0;

    // Calculate average effect size for successful experiments
    const avgEffectSize = successfulExperiments.length > 0
      ? successfulExperiments.reduce((sum, e) => sum + (e.results?.effectSize || 0), 0) / successfulExperiments.length
      : 0;

    res.json({
      success: true,
      data: {
        ...stats,
        successRate: Number(successRate.toFixed(2)),
        avgEffectSize: Number(avgEffectSize.toFixed(4)),
        healthScore: calculateHealthScore(stats, successRate),
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /health - Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const stats = await abTestingService.getExperimentStats();
    const experiments = await abTestingService.getExperiments();

    const runningExperiments = experiments.filter(e => e.status === ExperimentStatus.RUNNING);
    const healthStatus = determineHealthStatus(stats, runningExperiments);

    res.json({
      success: true,
      data: {
        status: healthStatus.status,
        message: healthStatus.message,
        metrics: {
          totalExperiments: stats.totalExperiments,
          runningExperiments: stats.runningExperiments,
          totalParticipants: stats.totalParticipants,
          totalConversions: stats.totalConversions
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /templates - Get experiment templates by industry/type
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { industry, type } = req.query;

    const templates = getExperimentTemplates();

    let filteredTemplates = templates;

    if (industry) {
      const validatedIndustry = validateIndustry(industry as string);
      filteredTemplates = filteredTemplates.filter((t: any) =>
        !t.industries || t.industries.includes(validatedIndustry!)
      );
    }

    if (type) {
      const validatedType = validateExperimentType(type as string);
      filteredTemplates = filteredTemplates.filter((t: any) => t.type === validatedType);
    }

    res.json({
      success: true,
      data: {
        templates: filteredTemplates
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to fetch templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper method to calculate health score
function calculateHealthScore(stats: any, successRate: number): number {
  let score = 100;

  // Reduce score if no experiments are running
  if (stats.runningExperiments === 0) {
    score -= 20;
  }

  // Reduce score based on success rate
  if (successRate < 30) {
    score -= 30;
  } else if (successRate < 50) {
    score -= 15;
  }

  // Reduce score if very few participants
  if (stats.totalParticipants < 100) {
    score -= 25;
  } else if (stats.totalParticipants < 500) {
    score -= 10;
  }

  // Reduce score if very few conversions
  if (stats.totalConversions < 10) {
    score -= 15;
  }

  return Math.max(0, score);
}

// Helper method to determine health status
function determineHealthStatus(stats: any, runningExperiments: Experiment[]): { status: string; message: string } {
  if (stats.totalExperiments === 0) {
    return {
      status: 'warning',
      message: 'No experiments created yet'
    };
  }

  if (stats.runningExperiments === 0) {
    return {
      status: 'warning',
      message: 'No experiments currently running'
    };
  }

  if (stats.totalParticipants < 50) {
    return {
      status: 'warning',
      message: 'Low participant count across experiments'
    };
  }

  const avgParticipantsPerExperiment = stats.totalParticipants / stats.totalExperiments;
  if (avgParticipantsPerExperiment < 20) {
    return {
      status: 'degraded',
      message: 'Experiments may be underpowered'
    };
  }

  return {
    status: 'healthy',
    message: 'A/B testing system operating normally'
  };
}

// Helper method to get experiment templates
function getExperimentTemplates() {
  return [
    {
      id: 'dashboard-layout-optimization',
      name: 'Dashboard Layout Optimization',
      type: ExperimentType.DASHBOARD_CONFIG,
      description: 'Test different dashboard layouts for improved user engagement',
      industries: ['saas', 'fintech', 'healthcare'],
      template: {
        hypothesis: 'A simplified dashboard layout will increase user engagement and time on platform',
        successMetrics: ['engagement_time', 'feature_adoption', 'user_satisfaction'],
        variants: [
          {
            name: 'Control - Current Layout',
            isControl: true,
            allocation: 50,
            configuration: {
              type: ConfigurationType.LAYOUT_CHANGE,
              changes: []
            }
          },
          {
            name: 'Simplified Layout',
            isControl: false,
            allocation: 50,
            configuration: {
              type: ConfigurationType.LAYOUT_CHANGE,
              changes: [
                {
                  path: 'dashboard.layout',
                  type: 'replace',
                  newValue: 'simplified',
                  description: 'Use simplified dashboard layout with fewer widgets'
                }
              ]
            }
          }
        ],
        estimatedDuration: 14
      }
    },
    {
      id: 'onboarding-flow-optimization',
      name: 'Onboarding Flow Optimization',
      type: ExperimentType.ONBOARDING_FLOW,
      description: 'Test different onboarding sequences for improved completion rates',
      industries: ['saas', 'college_consulting'],
      template: {
        hypothesis: 'A progressive onboarding flow will increase completion rates and user activation',
        successMetrics: ['completion_rate', 'time_to_activation', 'user_retention'],
        variants: [
          {
            name: 'Control - Standard Flow',
            isControl: true,
            allocation: 50,
            configuration: {
              type: ConfigurationType.FLOW_CHANGE,
              changes: []
            }
          },
          {
            name: 'Progressive Flow',
            isControl: false,
            allocation: 50,
            configuration: {
              type: ConfigurationType.FLOW_CHANGE,
              changes: [
                {
                  path: 'onboarding.flow',
                  type: 'replace',
                  newValue: 'progressive',
                  description: 'Use progressive disclosure in onboarding'
                }
              ]
            }
          }
        ],
        estimatedDuration: 21
      }
    },
    {
      id: 'feature-recommendation-test',
      name: 'Feature Recommendation Test',
      type: ExperimentType.FEATURE_RECOMMENDATION,
      description: 'Test AI-powered vs manual feature recommendations',
      industries: ['saas', 'manufacturing', 'healthcare'],
      template: {
        hypothesis: 'AI-powered feature recommendations will increase feature adoption and user satisfaction',
        successMetrics: ['feature_adoption', 'user_engagement', 'recommendation_accuracy'],
        variants: [
          {
            name: 'Control - Manual Recommendations',
            isControl: true,
            allocation: 50,
            configuration: {
              type: ConfigurationType.FEATURE_FLAG,
              changes: [
                {
                  path: 'features.aiRecommendations',
                  type: 'replace',
                  newValue: false,
                  description: 'Use manual feature recommendations'
                }
              ]
            }
          },
          {
            name: 'AI-Powered Recommendations',
            isControl: false,
            allocation: 50,
            configuration: {
              type: ConfigurationType.FEATURE_FLAG,
              changes: [
                {
                  path: 'features.aiRecommendations',
                  type: 'replace',
                  newValue: true,
                  description: 'Use AI-powered feature recommendations'
                }
              ]
            }
          }
        ],
        estimatedDuration: 28
      }
    }
  ];
}

export default router;
