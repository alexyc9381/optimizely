import { Request, Response, Router } from 'express';
import { FeedbackType, modelRefinementService, ModelType, TriggerType } from '../services/model-refinement-service';

const router = Router();

// Validation middleware
const validateModelType = (req: Request, res: Response, next: any) => {
  const { modelType } = req.params;
  if (modelType && !Object.values(ModelType).includes(modelType as ModelType)) {
    return res.status(400).json({
      error: 'Invalid model type',
      validTypes: Object.values(ModelType)
    });
  }
  next();
};

const validateFeedbackType = (req: Request, res: Response, next: any) => {
  const { feedbackType } = req.body;
  if (feedbackType && !Object.values(FeedbackType).includes(feedbackType)) {
    return res.status(400).json({
      error: 'Invalid feedback type',
      validTypes: Object.values(FeedbackType)
    });
  }
  next();
};

// GET /models/performance - Get performance metrics for all models or specific model
router.get('/models/performance', async (req: Request, res: Response) => {
  try {
    const { modelType } = req.query;

    const modelPerformance = await modelRefinementService.getModelPerformance(
      modelType as ModelType
    );

    res.json({
      success: true,
      data: {
        models: modelPerformance,
        count: modelPerformance.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting model performance:', error);
    res.status(500).json({
      error: 'Failed to retrieve model performance',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /models/:modelType/performance - Get performance for specific model type
router.get('/models/:modelType/performance', validateModelType, async (req: Request, res: Response) => {
  try {
    const { modelType } = req.params;

    const modelPerformance = await modelRefinementService.getModelPerformance(
      modelType as ModelType
    );

    if (modelPerformance.length === 0) {
      return res.status(404).json({
        error: 'Model not found',
        modelType
      });
    }

    res.json({
      success: true,
      data: {
        model: modelPerformance[0],
        modelType,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting model performance:', error);
    res.status(500).json({
      error: 'Failed to retrieve model performance',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /models/:modelType/versions - Get all versions of a specific model
router.get('/models/:modelType/versions', validateModelType, async (req: Request, res: Response) => {
  try {
    const { modelType } = req.params;

    const modelVersions = await modelRefinementService.getModelVersions(
      modelType as ModelType
    );

    res.json({
      success: true,
      data: {
        versions: modelVersions,
        count: modelVersions.length,
        modelType,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting model versions:', error);
    res.status(500).json({
      error: 'Failed to retrieve model versions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /retraining/history - Get retraining history for all models or specific model
router.get('/retraining/history', async (req: Request, res: Response) => {
  try {
    const { modelType, limit, offset } = req.query;

    let retrainingHistory = await modelRefinementService.getRetrainingHistory(
      modelType as ModelType
    );

    // Apply pagination if requested
    const limitNum = limit ? parseInt(limit as string) : undefined;
    const offsetNum = offset ? parseInt(offset as string) : 0;

    const total = retrainingHistory.length;

    if (limitNum) {
      retrainingHistory = retrainingHistory.slice(offsetNum, offsetNum + limitNum);
    }

    res.json({
      success: true,
      data: {
        retrainings: retrainingHistory,
        pagination: {
          total,
          count: retrainingHistory.length,
          offset: offsetNum,
          limit: limitNum
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting retraining history:', error);
    res.status(500).json({
      error: 'Failed to retrieve retraining history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /models/:modelType/retraining/history - Get retraining history for specific model
router.get('/models/:modelType/retraining/history', validateModelType, async (req: Request, res: Response) => {
  try {
    const { modelType } = req.params;
    const { limit, offset } = req.query;

    let retrainingHistory = await modelRefinementService.getRetrainingHistory(
      modelType as ModelType
    );

    // Apply pagination if requested
    const limitNum = limit ? parseInt(limit as string) : undefined;
    const offsetNum = offset ? parseInt(offset as string) : 0;

    const total = retrainingHistory.length;

    if (limitNum) {
      retrainingHistory = retrainingHistory.slice(offsetNum, offsetNum + limitNum);
    }

    res.json({
      success: true,
      data: {
        retrainings: retrainingHistory,
        modelType,
        pagination: {
          total,
          count: retrainingHistory.length,
          offset: offsetNum,
          limit: limitNum
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting retraining history:', error);
    res.status(500).json({
      error: 'Failed to retrieve retraining history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /feedback - Submit model feedback for continuous learning
router.post('/feedback', validateFeedbackType, async (req: Request, res: Response) => {
  try {
    const {
      modelType,
      modelVersion,
      predictionId,
      actualOutcome,
      predictedOutcome,
      feedbackType,
      confidenceLevel,
      outcomeDelay,
      contextData
    } = req.body;

    // Validation
    if (!modelType || !Object.values(ModelType).includes(modelType)) {
      return res.status(400).json({
        error: 'Valid modelType is required',
        validTypes: Object.values(ModelType)
      });
    }

    if (!predictionId || !feedbackType) {
      return res.status(400).json({
        error: 'predictionId and feedbackType are required'
      });
    }

    if (actualOutcome === undefined || predictedOutcome === undefined) {
      return res.status(400).json({
        error: 'actualOutcome and predictedOutcome are required'
      });
    }

    if (typeof confidenceLevel !== 'number' || confidenceLevel < 0 || confidenceLevel > 1) {
      return res.status(400).json({
        error: 'confidenceLevel must be a number between 0 and 1'
      });
    }

    await modelRefinementService.recordModelFeedback({
      modelType,
      modelVersion: modelVersion || '1.0.0',
      predictionId,
      actualOutcome,
      predictedOutcome,
      feedbackType,
      confidenceLevel,
      outcomeDelay: outcomeDelay || 0,
      contextData: contextData || {}
    });

    res.json({
      success: true,
      message: 'Feedback recorded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({
      error: 'Failed to record feedback',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /models/:modelType/retrain - Manually trigger model retraining
router.post('/models/:modelType/retrain', validateModelType, async (req: Request, res: Response) => {
  try {
    const { modelType } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({
        error: 'reason is required and must be a string'
      });
    }

    const retrainingId = await modelRefinementService.manualRetrain(
      modelType as ModelType,
      reason
    );

    res.json({
      success: true,
      data: {
        retrainingId,
        modelType,
        reason,
        status: 'queued'
      },
      message: 'Manual retraining triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering manual retraining:', error);
    res.status(500).json({
      error: 'Failed to trigger retraining',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /stats - Get overall performance statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await modelRefinementService.getPerformanceStats();

    // Add some computed metrics
    const computedStats = {
      ...stats,
      avgRetrainingsPerModel: stats.totalModels > 0 ?
        (stats.totalRetrainings / stats.totalModels).toFixed(2) : '0',
      dataPointsPerModel: stats.activeModels > 0 ?
        Math.floor(stats.trainingDataPoints / stats.activeModels) : 0,
      accuracyPercentage: `${(stats.avgAccuracy * 100).toFixed(1)}%`,
      healthScore: (() => {
        // Simple health score calculation
        let score = 100;
        if (stats.avgAccuracy < 0.8) score -= 20;
        if (stats.pendingRetrainings > 5) score -= 15;
        if (stats.activeModels < stats.totalModels * 0.8) score -= 10;
        return Math.max(0, score);
      })()
    };

    res.json({
      success: true,
      data: computedStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting performance stats:', error);
    res.status(500).json({
      error: 'Failed to retrieve performance statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /health - Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const stats = await modelRefinementService.getPerformanceStats();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Model Refinement Engine',
      version: '1.0.0',
      metrics: {
        activeModels: stats.activeModels,
        avgAccuracy: stats.avgAccuracy,
        pendingRetrainings: stats.pendingRetrainings,
        trainingDataPoints: stats.trainingDataPoints
      },
      checks: {
        modelsActive: stats.activeModels > 0,
        accuracyThreshold: stats.avgAccuracy > 0.7,
        retrainingQueueManageable: stats.pendingRetrainings < 10
      }
    };

    // Determine overall health status
    const allChecksPass = Object.values(health.checks).every(check => check === true);
    health.status = allChecksPass ? 'healthy' : 'degraded';

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'Model Refinement Engine',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /model-types - Get all available model types
router.get('/model-types', (req: Request, res: Response) => {
  try {
    const modelTypes = Object.values(ModelType).map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: getModelTypeDescription(type)
    }));

    res.json({
      success: true,
      data: {
        modelTypes,
        count: modelTypes.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting model types:', error);
    res.status(500).json({
      error: 'Failed to retrieve model types',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to get model type descriptions
function getModelTypeDescription(modelType: ModelType): string {
  const descriptions = {
    [ModelType.LEAD_SCORING]: 'Evaluates and scores potential customers based on their likelihood to convert',
    [ModelType.REVENUE_PREDICTION]: 'Predicts potential revenue from leads and existing customers',
    [ModelType.INDUSTRY_CLASSIFICATION]: 'Automatically classifies companies and prospects by industry',
    [ModelType.CHURN_PREDICTION]: 'Identifies customers at risk of churning or discontinuing service',
    [ModelType.ENGAGEMENT_SCORING]: 'Measures and scores customer engagement levels across touchpoints',
    [ModelType.FEATURE_ADOPTION]: 'Tracks and predicts adoption of product features by customers',
    [ModelType.PSYCHOGRAPHIC_PROFILING]: 'Analyzes customer psychological characteristics and behavioral patterns',
    [ModelType.AB_TEST_OPTIMIZATION]: 'Optimizes A/B testing strategies and experiment configurations'
  };

  return descriptions[modelType] || 'AI model for business intelligence and optimization';
}

// GET /feedback-types - Get all available feedback types
router.get('/feedback-types', (req: Request, res: Response) => {
  try {
    const feedbackTypes = Object.values(FeedbackType).map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: getFeedbackTypeDescription(type)
    }));

    res.json({
      success: true,
      data: {
        feedbackTypes,
        count: feedbackTypes.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting feedback types:', error);
    res.status(500).json({
      error: 'Failed to retrieve feedback types',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to get feedback type descriptions
function getFeedbackTypeDescription(feedbackType: FeedbackType): string {
  const descriptions = {
    [FeedbackType.EXPLICIT]: 'Direct user feedback provided intentionally',
    [FeedbackType.IMPLICIT]: 'Feedback inferred from user behavior and actions',
    [FeedbackType.OUTCOME]: 'Actual business outcomes and results',
    [FeedbackType.CORRECTION]: 'Manual corrections to model predictions'
  };

  return descriptions[feedbackType] || 'Feedback type for model improvement';
}

// GET /trigger-types - Get all available retraining trigger types
router.get('/trigger-types', (req: Request, res: Response) => {
  try {
    const triggerTypes = Object.values(TriggerType).map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: getTriggerTypeDescription(type)
    }));

    res.json({
      success: true,
      data: {
        triggerTypes,
        count: triggerTypes.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting trigger types:', error);
    res.status(500).json({
      error: 'Failed to retrieve trigger types',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to get trigger type descriptions
function getTriggerTypeDescription(triggerType: TriggerType): string {
  const descriptions = {
    [TriggerType.ACCURACY_DROP]: 'Triggered when model accuracy drops below threshold',
    [TriggerType.CONFIDENCE_DROP]: 'Triggered when model confidence drops significantly',
    [TriggerType.DATA_DRIFT]: 'Triggered when input data characteristics change over time',
    [TriggerType.PERFORMANCE_DEGRADATION]: 'Triggered when overall model performance degrades',
    [TriggerType.NEW_DATA_THRESHOLD]: 'Triggered when sufficient new training data is accumulated',
    [TriggerType.SCHEDULED]: 'Triggered on a predetermined schedule',
    [TriggerType.MANUAL]: 'Manually triggered by user request'
  };

  return descriptions[triggerType] || 'Trigger condition for model retraining';
}

export default router;
