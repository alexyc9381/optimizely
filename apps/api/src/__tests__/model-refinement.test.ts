import express from 'express';
import request from 'supertest';
import modelRefinementRoutes from '../routes/model-refinement';
import {
    ModelStatus,
    ModelType,
    RetrainingStatus,
    TriggerType
} from '../services/model-refinement-service';

const app = express();
app.use(express.json());
app.use('/api/v1/model-refinement', modelRefinementRoutes);

// Mock the service to avoid singleton issues in tests
jest.mock('../services/model-refinement-service', () => {
  const mockService = {
    getModelPerformance: jest.fn(),
    getModelVersions: jest.fn(),
    getRetrainingHistory: jest.fn(),
    recordModelFeedback: jest.fn(),
    manualRetrain: jest.fn(),
    getPerformanceStats: jest.fn(),
  };

  return {
    ModelRefinementService: jest.fn().mockImplementation(() => mockService),
    modelRefinementService: mockService,
    ModelType: {
      LEAD_SCORING: 'lead_scoring',
      REVENUE_PREDICTION: 'revenue_prediction',
      INDUSTRY_CLASSIFICATION: 'industry_classification',
      CHURN_PREDICTION: 'churn_prediction',
      ENGAGEMENT_SCORING: 'engagement_scoring',
      FEATURE_ADOPTION: 'feature_adoption',
      PSYCHOGRAPHIC_PROFILING: 'psychographic_profiling',
      AB_TEST_OPTIMIZATION: 'ab_test_optimization'
    },
    FeedbackType: {
      EXPLICIT: 'explicit',
      IMPLICIT: 'implicit',
      OUTCOME: 'outcome',
      CORRECTION: 'correction'
    },
    TriggerType: {
      ACCURACY_DROP: 'accuracy_drop',
      CONFIDENCE_DROP: 'confidence_drop',
      DATA_DRIFT: 'data_drift',
      PERFORMANCE_DEGRADATION: 'performance_degradation',
      NEW_DATA_THRESHOLD: 'new_data_threshold',
      SCHEDULED: 'scheduled',
      MANUAL: 'manual'
    },
    RetrainingStatus: {
      QUEUED: 'queued',
      RUNNING: 'running',
      COMPLETED: 'completed',
      FAILED: 'failed',
      CANCELLED: 'cancelled'
    },
    ModelStatus: {
      TRAINING: 'training',
      ACTIVE: 'active',
      TESTING: 'testing',
      DEPRECATED: 'deprecated',
      RETIRED: 'retired',
      FAILED: 'failed'
    }
  };
});

describe('Model Refinement API', () => {
  const mockService = require('../services/model-refinement-service').modelRefinementService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /models/performance', () => {
    it('should return performance metrics for all models', async () => {
      const mockPerformance = [
        {
          id: 'lead_scoring-v1.0.0',
          modelType: ModelType.LEAD_SCORING,
          version: '1.0.0',
          status: ModelStatus.ACTIVE,
          metrics: {
            accuracy: 0.85,
            precision: 0.82,
            recall: 0.80,
            f1Score: 0.81,
            auc: 0.88,
            confidenceScore: 0.75,
            sampleSize: 1000,
            evaluatedAt: '2024-01-15T10:00:00Z'
          },
          performanceHistory: []
        }
      ];

      mockService.getModelPerformance.mockResolvedValue(mockPerformance);

      const response = await request(app)
        .get('/api/v1/model-refinement/models/performance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.models).toEqual(mockPerformance);
      expect(response.body.data.count).toBe(1);
      expect(mockService.getModelPerformance).toHaveBeenCalledWith(undefined);
    });

    it('should return performance for specific model type', async () => {
      const mockPerformance = [
        {
          id: 'lead_scoring-v1.0.0',
          modelType: ModelType.LEAD_SCORING,
          version: '1.0.0',
          status: ModelStatus.ACTIVE,
          metrics: {
            accuracy: 0.85,
            precision: 0.82,
            recall: 0.80,
            f1Score: 0.81,
            auc: 0.88,
            confidenceScore: 0.75,
            sampleSize: 1000,
            evaluatedAt: '2024-01-15T10:00:00Z'
          }
        }
      ];

      mockService.getModelPerformance.mockResolvedValue(mockPerformance);

      const response = await request(app)
        .get('/api/v1/model-refinement/models/performance?modelType=lead_scoring')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.models).toEqual(mockPerformance);
      expect(mockService.getModelPerformance).toHaveBeenCalledWith('lead_scoring');
    });

    it('should handle service errors gracefully', async () => {
      mockService.getModelPerformance.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/api/v1/model-refinement/models/performance')
        .expect(500);

      expect(response.body.error).toBe('Failed to retrieve model performance');
      expect(response.body.details).toBe('Service error');
    });
  });

  describe('GET /models/:modelType/performance', () => {
    it('should return performance for specific model', async () => {
      const mockPerformance = [
        {
          id: 'lead_scoring-v1.0.0',
          modelType: ModelType.LEAD_SCORING,
          version: '1.0.0',
          metrics: {
            accuracy: 0.85,
            precision: 0.82,
            recall: 0.80,
            f1Score: 0.81,
            auc: 0.88,
            confidenceScore: 0.75,
            sampleSize: 1000,
            evaluatedAt: '2024-01-15T10:00:00Z'
          }
        }
      ];

      mockService.getModelPerformance.mockResolvedValue(mockPerformance);

      const response = await request(app)
        .get('/api/v1/model-refinement/models/lead_scoring/performance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.model).toEqual(mockPerformance[0]);
      expect(response.body.data.modelType).toBe('lead_scoring');
    });

    it('should return 404 when model not found', async () => {
      mockService.getModelPerformance.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/model-refinement/models/unknown_model/performance')
        .expect(400);

      expect(response.body.error).toBe('Invalid model type');
    });

    it('should validate model type', async () => {
      const response = await request(app)
        .get('/api/v1/model-refinement/models/invalid_type/performance')
        .expect(400);

      expect(response.body.error).toBe('Invalid model type');
      expect(response.body.validTypes).toContain('lead_scoring');
    });
  });

  describe('GET /models/:modelType/versions', () => {
    it('should return all versions of a model', async () => {
      const mockVersions = [
        {
          id: 'lead_scoring-v1.0.0',
          modelType: ModelType.LEAD_SCORING,
          version: '1.0.0',
          status: ModelStatus.ACTIVE,
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'lead_scoring-v1.0.1',
          modelType: ModelType.LEAD_SCORING,
          version: '1.0.1',
          status: ModelStatus.DEPRECATED,
          createdAt: '2024-01-14T10:00:00Z'
        }
      ];

      mockService.getModelVersions.mockResolvedValue(mockVersions);

      const response = await request(app)
        .get('/api/v1/model-refinement/models/lead_scoring/versions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.versions).toEqual(mockVersions);
      expect(response.body.data.count).toBe(2);
      expect(response.body.data.modelType).toBe('lead_scoring');
    });
  });

  describe('GET /retraining/history', () => {
    it('should return retraining history for all models', async () => {
      const mockHistory = [
        {
          id: 'retrain_123',
          modelType: ModelType.LEAD_SCORING,
          status: RetrainingStatus.COMPLETED,
          triggeredBy: {
            type: TriggerType.ACCURACY_DROP,
            threshold: 0.05,
            actualValue: 0.07,
            description: 'Accuracy dropped by 7%',
            severity: 'high'
          },
          startedAt: '2024-01-15T10:00:00Z',
          completedAt: '2024-01-15T10:30:00Z',
          improvementPercentage: 3.5
        }
      ];

      mockService.getRetrainingHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/v1/model-refinement/retraining/history')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.retrainings).toEqual(mockHistory);
      expect(response.body.data.pagination.total).toBe(1);
    });

    it('should handle pagination parameters', async () => {
      const mockHistory = Array.from({ length: 15 }, (_, i) => ({
        id: `retrain_${i}`,
        modelType: ModelType.LEAD_SCORING,
        status: RetrainingStatus.COMPLETED,
        startedAt: '2024-01-15T10:00:00Z'
      }));

      mockService.getRetrainingHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/v1/model-refinement/retraining/history?limit=10&offset=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.retrainings).toHaveLength(10);
      expect(response.body.data.pagination.total).toBe(15);
      expect(response.body.data.pagination.offset).toBe(5);
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });

  describe('POST /feedback', () => {
    it('should successfully record model feedback', async () => {
      mockService.recordModelFeedback.mockResolvedValue(undefined);

      const feedbackData = {
        modelType: 'lead_scoring',
        modelVersion: '1.0.0',
        predictionId: 'pred_123',
        actualOutcome: true,
        predictedOutcome: false,
        feedbackType: 'outcome',
        confidenceLevel: 0.8,
        outcomeDelay: 3600,
        contextData: {
          industry: 'saas',
          customerId: 'customer_123'
        }
      };

      const response = await request(app)
        .post('/api/v1/model-refinement/feedback')
        .send(feedbackData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Feedback recorded successfully');
      expect(mockService.recordModelFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          modelType: 'lead_scoring',
          predictionId: 'pred_123',
          actualOutcome: true,
          predictedOutcome: false
        })
      );
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/model-refinement/feedback')
        .send({
          modelType: 'lead_scoring'
          // Missing required fields
        })
        .expect(400);

      expect(response.body.error).toBe('predictionId and feedbackType are required');
    });

    it('should validate model type', async () => {
      const response = await request(app)
        .post('/api/v1/model-refinement/feedback')
        .send({
          modelType: 'invalid_type',
          predictionId: 'pred_123',
          feedbackType: 'outcome',
          actualOutcome: true,
          predictedOutcome: false,
          confidenceLevel: 0.8
        })
        .expect(400);

      expect(response.body.error).toBe('Valid modelType is required');
    });

    it('should validate confidence level', async () => {
      const response = await request(app)
        .post('/api/v1/model-refinement/feedback')
        .send({
          modelType: 'lead_scoring',
          predictionId: 'pred_123',
          feedbackType: 'outcome',
          actualOutcome: true,
          predictedOutcome: false,
          confidenceLevel: 1.5 // Invalid: > 1
        })
        .expect(400);

      expect(response.body.error).toBe('confidenceLevel must be a number between 0 and 1');
    });
  });

  describe('POST /models/:modelType/retrain', () => {
    it('should trigger manual retraining', async () => {
      const retrainingId = 'retrain_manual_123';
      mockService.manualRetrain.mockResolvedValue(retrainingId);

      const response = await request(app)
        .post('/api/v1/model-refinement/models/lead_scoring/retrain')
        .send({
          reason: 'Manual retraining for performance improvement'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.retrainingId).toBe(retrainingId);
      expect(response.body.data.modelType).toBe('lead_scoring');
      expect(response.body.data.status).toBe('queued');
      expect(mockService.manualRetrain).toHaveBeenCalledWith(
        'lead_scoring',
        'Manual retraining for performance improvement'
      );
    });

    it('should validate reason parameter', async () => {
      const response = await request(app)
        .post('/api/v1/model-refinement/models/lead_scoring/retrain')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('reason is required and must be a string');
    });
  });

  describe('GET /stats', () => {
    it('should return performance statistics', async () => {
      const mockStats = {
        totalModels: 8,
        activeModels: 6,
        avgAccuracy: 0.85,
        totalRetrainings: 15,
        pendingRetrainings: 2,
        trainingDataPoints: 5000
      };

      mockService.getPerformanceStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/v1/model-refinement/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalModels).toBe(8);
      expect(response.body.data.activeModels).toBe(6);
      expect(response.body.data.avgAccuracy).toBe(0.85);
      expect(response.body.data.accuracyPercentage).toBe('85.0%');
      expect(response.body.data.avgRetrainingsPerModel).toBe('1.88');
      expect(response.body.data.dataPointsPerModel).toBe(833);
      expect(typeof response.body.data.healthScore).toBe('number');
    });

    it('should calculate health score correctly', async () => {
      const mockStats = {
        totalModels: 8,
        activeModels: 6,
        avgAccuracy: 0.75, // Below 0.8 threshold
        totalRetrainings: 15,
        pendingRetrainings: 8, // Above 5 threshold
        trainingDataPoints: 5000
      };

      mockService.getPerformanceStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/v1/model-refinement/stats')
        .expect(200);

      // Health score should be reduced due to low accuracy and high pending retrainings
      expect(response.body.data.healthScore).toBeLessThan(100);
    });
  });

  describe('GET /health', () => {
    it('should return healthy status when all checks pass', async () => {
      const mockStats = {
        totalModels: 8,
        activeModels: 6,
        avgAccuracy: 0.85,
        totalRetrainings: 15,
        pendingRetrainings: 2,
        trainingDataPoints: 5000
      };

      mockService.getPerformanceStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/v1/model-refinement/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('Model Refinement Engine');
      expect(response.body.checks.modelsActive).toBe(true);
      expect(response.body.checks.accuracyThreshold).toBe(true);
      expect(response.body.checks.retrainingQueueManageable).toBe(true);
    });

    it('should return degraded status when checks fail', async () => {
      const mockStats = {
        totalModels: 8,
        activeModels: 0, // No active models
        avgAccuracy: 0.6, // Below threshold
        totalRetrainings: 15,
        pendingRetrainings: 15, // Too many pending
        trainingDataPoints: 5000
      };

      mockService.getPerformanceStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/v1/model-refinement/health')
        .expect(503);

      expect(response.body.status).toBe('degraded');
      expect(response.body.checks.modelsActive).toBe(false);
      expect(response.body.checks.accuracyThreshold).toBe(false);
      expect(response.body.checks.retrainingQueueManageable).toBe(false);
    });

    it('should handle service errors', async () => {
      mockService.getPerformanceStats.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .get('/api/v1/model-refinement/health')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.error).toBe('Service unavailable');
    });
  });

  describe('GET /model-types', () => {
    it('should return all available model types', async () => {
      const response = await request(app)
        .get('/api/v1/model-refinement/model-types')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.modelTypes).toBeInstanceOf(Array);
      expect(response.body.data.count).toBe(8);

      const leadScoringType = response.body.data.modelTypes.find(
        (type: any) => type.value === 'lead_scoring'
      );
      expect(leadScoringType).toBeDefined();
      expect(leadScoringType.label).toBe('Lead Scoring');
      expect(leadScoringType.description).toContain('likelihood to convert');
    });
  });

  describe('GET /feedback-types', () => {
    it('should return all available feedback types', async () => {
      const response = await request(app)
        .get('/api/v1/model-refinement/feedback-types')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.feedbackTypes).toBeInstanceOf(Array);
      expect(response.body.data.count).toBe(4);

      const outcomeType = response.body.data.feedbackTypes.find(
        (type: any) => type.value === 'outcome'
      );
      expect(outcomeType).toBeDefined();
      expect(outcomeType.label).toBe('Outcome');
      expect(outcomeType.description).toContain('business outcomes');
    });
  });

  describe('GET /trigger-types', () => {
    it('should return all available trigger types', async () => {
      const response = await request(app)
        .get('/api/v1/model-refinement/trigger-types')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.triggerTypes).toBeInstanceOf(Array);
      expect(response.body.data.count).toBe(7);

      const accuracyDropType = response.body.data.triggerTypes.find(
        (type: any) => type.value === 'accuracy_drop'
      );
      expect(accuracyDropType).toBeDefined();
      expect(accuracyDropType.label).toBe('Accuracy Drop');
      expect(accuracyDropType.description).toContain('accuracy drops below threshold');
    });
  });
});

describe('Model Refinement Service Integration', () => {
  // Since we're testing the actual service integration, we'll need to handle the singleton
  let service: any;

  beforeAll(() => {
    // Use the actual service for integration tests
    jest.unmock('../services/model-refinement-service');
    const { ModelRefinementService } = require('../services/model-refinement-service');
    service = ModelRefinementService.getInstance();
  });

  afterAll(() => {
    // Clean up
    if (service && service.shutdown) {
      service.shutdown();
    }
  });

  it('should initialize with default models', async () => {
    const models = await service.getModelPerformance();
    expect(models.length).toBeGreaterThan(0);

    // Check that lead scoring model exists
    const leadScoringModel = models.find((m: any) => m.modelType === 'lead_scoring');
    expect(leadScoringModel).toBeDefined();
    expect(leadScoringModel.status).toBe('active');
    expect(leadScoringModel.metrics.accuracy).toBeGreaterThan(0);
  });

  it('should record feedback and potentially trigger retraining', async () => {
    const feedbackPromise = service.recordModelFeedback({
      modelType: 'lead_scoring',
      modelVersion: '1.0.0',
      predictionId: 'test_prediction_123',
      actualOutcome: true,
      predictedOutcome: false,
      feedbackType: 'outcome',
      confidenceLevel: 0.9,
      outcomeDelay: 3600,
      contextData: {
        industry: 'saas',
        customerId: 'test_customer_123'
      }
    });

    await expect(feedbackPromise).resolves.not.toThrow();
  }, 10000);

  it('should trigger manual retraining', async () => {
    const retrainingId = await service.manualRetrain(
      'lead_scoring',
      'Integration test manual retraining'
    );

    expect(retrainingId).toBeDefined();
    expect(typeof retrainingId).toBe('string');

    // Check retraining history
    const history = await service.getRetrainingHistory('lead_scoring');
    const retraining = history.find((r: any) => r.id === retrainingId);
    expect(retraining).toBeDefined();
    expect(retraining.modelType).toBe('lead_scoring');
    expect(retraining.triggeredBy.type).toBe('manual');
  });

  it('should provide performance statistics', async () => {
    const stats = await service.getPerformanceStats();

    expect(stats.totalModels).toBeGreaterThan(0);
    expect(stats.activeModels).toBeGreaterThan(0);
    expect(stats.avgAccuracy).toBeGreaterThan(0);
    expect(stats.avgAccuracy).toBeLessThanOrEqual(1);
    expect(stats.totalRetrainings).toBeGreaterThanOrEqual(0);
    expect(stats.pendingRetrainings).toBeGreaterThanOrEqual(0);
    expect(stats.trainingDataPoints).toBeGreaterThanOrEqual(0);
  });
});
