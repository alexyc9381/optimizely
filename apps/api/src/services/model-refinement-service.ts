import { EventEmitter } from 'events';

// Core interfaces for model refinement
export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  mse?: number; // For regression models
  mae?: number; // For regression models
  confidenceScore: number;
  sampleSize: number;
  evaluatedAt: string;
}

export interface ModelVersion {
  id: string;
  modelType: ModelType;
  version: string;
  status: ModelStatus;
  createdAt: string;
  deployedAt?: string;
  retiredAt?: string;
  metrics: ModelMetrics;
  trainingData: {
    sampleSize: number;
    features: string[];
    targetVariable: string;
    trainingDuration: number;
  };
  hyperparameters: Record<string, any>;
  performanceHistory: ModelPerformancePoint[];
  industrySpecific?: string[];
}

export interface ModelPerformancePoint {
  timestamp: string;
  metrics: ModelMetrics;
  contextData: {
    industry?: string;
    customerSegment?: string;
    featureFlags?: string[];
    trafficVolume: number;
  };
}

export interface TrainingData {
  features: Record<string, any>;
  target: any;
  outcome: any;
  metadata: {
    industry: string;
    customerId: string;
    timestamp: string;
    confidenceLevel: number;
    outcomeType: string;
  };
}

export interface ModelRetraining {
  id: string;
  modelType: ModelType;
  triggeredBy: RetrainingTrigger;
  status: RetrainingStatus;
  startedAt: string;
  completedAt?: string;
  newVersion?: string;
  improvementPercentage?: number;
  performanceComparison: {
    before: ModelMetrics;
    after?: ModelMetrics;
  };
  trainingMetadata: {
    sampleSize: number;
    newDataPoints: number;
    trainingDuration?: number;
    algorithmUsed: string;
  };
}

export interface ModelFeedback {
  id: string;
  modelType: ModelType;
  modelVersion: string;
  predictionId: string;
  actualOutcome: any;
  predictedOutcome: any;
  feedbackType: FeedbackType;
  confidenceLevel: number;
  outcomeDelay: number; // Time between prediction and outcome
  contextData: Record<string, any>;
  submittedAt: string;
}

export interface RetrainingTrigger {
  type: TriggerType;
  threshold: number;
  actualValue: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export enum ModelType {
  LEAD_SCORING = 'lead_scoring',
  REVENUE_PREDICTION = 'revenue_prediction',
  INDUSTRY_CLASSIFICATION = 'industry_classification',
  CHURN_PREDICTION = 'churn_prediction',
  ENGAGEMENT_SCORING = 'engagement_scoring',
  FEATURE_ADOPTION = 'feature_adoption',
  PSYCHOGRAPHIC_PROFILING = 'psychographic_profiling',
  AB_TEST_OPTIMIZATION = 'ab_test_optimization'
}

export enum ModelStatus {
  TRAINING = 'training',
  ACTIVE = 'active',
  TESTING = 'testing',
  DEPRECATED = 'deprecated',
  RETIRED = 'retired',
  FAILED = 'failed'
}

export enum RetrainingStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum FeedbackType {
  EXPLICIT = 'explicit', // Direct user feedback
  IMPLICIT = 'implicit', // Inferred from behavior
  OUTCOME = 'outcome', // Actual business outcome
  CORRECTION = 'correction' // Manual correction
}

export enum TriggerType {
  ACCURACY_DROP = 'accuracy_drop',
  CONFIDENCE_DROP = 'confidence_drop',
  DATA_DRIFT = 'data_drift',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  NEW_DATA_THRESHOLD = 'new_data_threshold',
  SCHEDULED = 'scheduled',
  MANUAL = 'manual'
}

export class ModelRefinementService extends EventEmitter {
  private static instance: ModelRefinementService;
  private models: Map<string, ModelVersion> = new Map();
  private retrainingQueue: ModelRetraining[] = [];
  private feedbackBuffer: ModelFeedback[] = [];
  private trainingDataCache: Map<string, TrainingData[]> = new Map();
  private performanceMonitors: Map<string, NodeJS.Timeout> = new Map();

  // Configuration
  private readonly config = {
    retraining: {
      accuracyThreshold: 0.05, // Retrain if accuracy drops by 5%
      confidenceThreshold: 0.10, // Retrain if confidence drops by 10%
      minDataPoints: 100, // Minimum new data points before retraining
      maxRetrainingFrequency: 24 * 60 * 60 * 1000, // Max once per day
      batchSize: 1000, // Training batch size
    },
    monitoring: {
      checkInterval: 60 * 60 * 1000, // Check every hour
      metricsRetentionDays: 90,
      feedbackRetentionDays: 180,
    },
    validation: {
      testSplitRatio: 0.2,
      validationSplitRatio: 0.1,
      minValidationSamples: 50,
    }
  };

  private constructor() {
    super();
    this.initializeModels();
    this.startPerformanceMonitoring();
  }

  public static getInstance(): ModelRefinementService {
    if (!ModelRefinementService.instance) {
      ModelRefinementService.instance = new ModelRefinementService();
    }
    return ModelRefinementService.instance;
  }

  // Initialize models with default configurations
  private initializeModels(): void {
    const modelTypes = Object.values(ModelType);

    modelTypes.forEach(modelType => {
      const modelVersion: ModelVersion = {
        id: `${modelType}-v1.0.0`,
        modelType,
        version: '1.0.0',
        status: ModelStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        deployedAt: new Date().toISOString(),
        metrics: {
          accuracy: 0.85,
          precision: 0.82,
          recall: 0.80,
          f1Score: 0.81,
          auc: 0.88,
          confidenceScore: 0.75,
          sampleSize: 1000,
          evaluatedAt: new Date().toISOString()
        },
        trainingData: {
          sampleSize: 1000,
          features: ['behavioral_score', 'firmographic_data', 'engagement_metrics'],
          targetVariable: 'conversion_probability',
          trainingDuration: 300000 // 5 minutes
        },
        hyperparameters: {
          learningRate: 0.001,
          batchSize: 32,
          epochs: 100,
          regularization: 0.01
        },
        performanceHistory: [],
        industrySpecific: ['saas', 'manufacturing', 'healthcare', 'fintech', 'college-consulting']
      };

      this.models.set(`${modelType}-current`, modelVersion);
      this.trainingDataCache.set(modelType, []);
    });

    console.log(`Initialized ${modelTypes.length} models for refinement tracking`);
  }

  // Start continuous performance monitoring
  private startPerformanceMonitoring(): void {
    const monitor = setInterval(() => {
      this.checkModelPerformance();
      this.processRetrainingQueue();
      this.processFeedbackBuffer();
      this.cleanupOldData();
    }, this.config.monitoring.checkInterval);

    this.performanceMonitors.set('main', monitor);
    console.log('Model performance monitoring started');
  }

  // Record model feedback for continuous learning
  public async recordModelFeedback(feedback: Omit<ModelFeedback, 'id' | 'submittedAt'>): Promise<void> {
    const modelFeedback: ModelFeedback = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      submittedAt: new Date().toISOString(),
      ...feedback
    };

    this.feedbackBuffer.push(modelFeedback);

    // Add to training data if it's an outcome feedback
    if (modelFeedback.feedbackType === FeedbackType.OUTCOME) {
      await this.addTrainingData(modelFeedback);
    }

    // Check if immediate retraining is needed
    await this.evaluateRetrainingNeed(feedback.modelType);

    this.emit('feedbackRecorded', modelFeedback);
  }

  // Add new training data from feedback
  private async addTrainingData(feedback: ModelFeedback): Promise<void> {
    const trainingData: TrainingData = {
      features: feedback.contextData,
      target: feedback.predictedOutcome,
      outcome: feedback.actualOutcome,
      metadata: {
        industry: feedback.contextData.industry || 'unknown',
        customerId: feedback.contextData.customerId || 'unknown',
        timestamp: feedback.submittedAt,
        confidenceLevel: feedback.confidenceLevel,
        outcomeType: feedback.feedbackType
      }
    };

    const modelType = feedback.modelType;
    const existingData = this.trainingDataCache.get(modelType) || [];
    existingData.push(trainingData);
    this.trainingDataCache.set(modelType, existingData);

    // Check if we have enough new data for retraining
    if (existingData.length >= this.config.retraining.minDataPoints) {
      await this.triggerRetraining(modelType, {
        type: TriggerType.NEW_DATA_THRESHOLD,
        threshold: this.config.retraining.minDataPoints,
        actualValue: existingData.length,
        description: `Accumulated ${existingData.length} new training samples`,
        severity: 'medium'
      });
    }
  }

  // Check model performance and trigger retraining if needed
  private async checkModelPerformance(): Promise<void> {
    for (const [modelKey, model] of this.models.entries()) {
      if (model.status !== ModelStatus.ACTIVE) continue;

      // Simulate performance evaluation (in real implementation, this would call actual ML evaluation)
      const currentMetrics = await this.evaluateModelPerformance(model);

      // Compare with historical performance
      const performanceHistory = model.performanceHistory.slice(-10); // Last 10 measurements
      if (performanceHistory.length === 0) {
        // First measurement, just record it
        model.performanceHistory.push({
          timestamp: new Date().toISOString(),
          metrics: currentMetrics,
          contextData: {
            trafficVolume: Math.floor(Math.random() * 1000) + 500
          }
        });
        continue;
      }

      const avgHistoricalAccuracy = performanceHistory.reduce((sum, point) => sum + point.metrics.accuracy, 0) / performanceHistory.length;
      const accuracyDrop = avgHistoricalAccuracy - currentMetrics.accuracy;

      // Check for performance degradation
      if (accuracyDrop > this.config.retraining.accuracyThreshold) {
        await this.triggerRetraining(model.modelType, {
          type: TriggerType.ACCURACY_DROP,
          threshold: this.config.retraining.accuracyThreshold,
          actualValue: accuracyDrop,
          description: `Accuracy dropped by ${(accuracyDrop * 100).toFixed(2)}%`,
          severity: accuracyDrop > 0.10 ? 'critical' : 'high'
        });
      }

      // Record current performance
      model.performanceHistory.push({
        timestamp: new Date().toISOString(),
        metrics: currentMetrics,
        contextData: {
          trafficVolume: Math.floor(Math.random() * 1000) + 500
        }
      });

      // Emit performance update event
      this.emit('performanceUpdated', {
        modelType: model.modelType,
        metrics: currentMetrics,
        trend: accuracyDrop > 0 ? 'declining' : 'stable'
      });
    }
  }

  // Simulate model performance evaluation
  private async evaluateModelPerformance(model: ModelVersion): Promise<ModelMetrics> {
    // In a real implementation, this would:
    // 1. Take a validation dataset
    // 2. Run predictions through the model
    // 3. Compare with actual outcomes
    // 4. Calculate metrics

    // For simulation, add some realistic variance
    const baseAccuracy = model.metrics.accuracy;
    const variance = (Math.random() - 0.5) * 0.1; // ±5% variance

    return {
      accuracy: Math.max(0.1, Math.min(1.0, baseAccuracy + variance)),
      precision: Math.max(0.1, Math.min(1.0, model.metrics.precision + variance * 0.8)),
      recall: Math.max(0.1, Math.min(1.0, model.metrics.recall + variance * 0.8)),
      f1Score: Math.max(0.1, Math.min(1.0, model.metrics.f1Score + variance * 0.8)),
      auc: Math.max(0.1, Math.min(1.0, model.metrics.auc + variance * 0.6)),
      confidenceScore: Math.max(0.1, Math.min(1.0, model.metrics.confidenceScore + variance * 0.5)),
      sampleSize: Math.floor(Math.random() * 500) + 200,
      evaluatedAt: new Date().toISOString()
    };
  }

  // Trigger model retraining
  private async triggerRetraining(modelType: ModelType, trigger: RetrainingTrigger): Promise<string> {
    const model = this.models.get(`${modelType}-current`);
    if (!model) {
      throw new Error(`Model not found: ${modelType}`);
    }

    // Check if retraining is already in progress
    const existingRetraining = this.retrainingQueue.find(
      r => r.modelType === modelType && r.status === RetrainingStatus.RUNNING
    );
    if (existingRetraining) {
      console.log(`Retraining already in progress for ${modelType}`);
      return existingRetraining.id;
    }

    const retrainingId = `retrain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const retraining: ModelRetraining = {
      id: retrainingId,
      modelType,
      triggeredBy: trigger,
      status: RetrainingStatus.QUEUED,
      startedAt: new Date().toISOString(),
      performanceComparison: {
        before: model.metrics
      },
      trainingMetadata: {
        sampleSize: this.trainingDataCache.get(modelType)?.length || 0,
        newDataPoints: this.trainingDataCache.get(modelType)?.length || 0,
        algorithmUsed: 'gradient_boosting'
      }
    };

    this.retrainingQueue.push(retraining);
    this.emit('retrainingTriggered', retraining);

    console.log(`Retraining triggered for ${modelType}: ${trigger.description}`);
    return retrainingId;
  }

  // Process the retraining queue
  private async processRetrainingQueue(): Promise<void> {
    const queuedRetraining = this.retrainingQueue.filter(r => r.status === RetrainingStatus.QUEUED);

    // Process one retraining at a time (in real implementation, could be parallel with resource management)
    for (const retraining of queuedRetraining.slice(0, 1)) {
      await this.executeRetraining(retraining);
    }
  }

  // Execute model retraining
  private async executeRetraining(retraining: ModelRetraining): Promise<void> {
    try {
      retraining.status = RetrainingStatus.RUNNING;

      // Get training data
      const trainingData = this.trainingDataCache.get(retraining.modelType) || [];
      if (trainingData.length === 0) {
        throw new Error('No training data available');
      }

      // Simulate training process
      const trainingStart = Date.now();

      // In real implementation, this would:
      // 1. Prepare training/validation/test splits
      // 2. Train the model with new data
      // 3. Validate performance
      // 4. Compare with existing model

      // Simulate training time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));

      const trainingDuration = Date.now() - trainingStart;

      // Simulate improved metrics (70% chance of improvement)
      const willImprove = Math.random() < 0.7;
      const currentModel = this.models.get(`${retraining.modelType}-current`)!;

      const newMetrics: ModelMetrics = {
        accuracy: willImprove ?
          Math.min(0.98, currentModel.metrics.accuracy + Math.random() * 0.05) :
          Math.max(0.60, currentModel.metrics.accuracy - Math.random() * 0.02),
        precision: willImprove ?
          Math.min(0.98, currentModel.metrics.precision + Math.random() * 0.04) :
          Math.max(0.60, currentModel.metrics.precision - Math.random() * 0.02),
        recall: willImprove ?
          Math.min(0.98, currentModel.metrics.recall + Math.random() * 0.04) :
          Math.max(0.60, currentModel.metrics.recall - Math.random() * 0.02),
        f1Score: 0, // Will be calculated
        auc: willImprove ?
          Math.min(0.98, currentModel.metrics.auc + Math.random() * 0.03) :
          Math.max(0.60, currentModel.metrics.auc - Math.random() * 0.02),
        confidenceScore: willImprove ?
          Math.min(0.95, currentModel.metrics.confidenceScore + Math.random() * 0.05) :
          Math.max(0.50, currentModel.metrics.confidenceScore - Math.random() * 0.03),
        sampleSize: trainingData.length,
        evaluatedAt: new Date().toISOString()
      };

      // Calculate F1 score
      newMetrics.f1Score = 2 * (newMetrics.precision * newMetrics.recall) / (newMetrics.precision + newMetrics.recall);

      // Update retraining record
      retraining.completedAt = new Date().toISOString();
      retraining.performanceComparison.after = newMetrics;
      retraining.trainingMetadata.trainingDuration = trainingDuration;

      // Calculate improvement
      const accuracyImprovement = newMetrics.accuracy - currentModel.metrics.accuracy;
      retraining.improvementPercentage = (accuracyImprovement / currentModel.metrics.accuracy) * 100;

      // Only deploy if there's significant improvement
      if (accuracyImprovement > 0.01) { // 1% improvement threshold
        await this.deployNewModelVersion(retraining.modelType, newMetrics, retraining);
        retraining.status = RetrainingStatus.COMPLETED;
        console.log(`Model ${retraining.modelType} successfully retrained with ${retraining.improvementPercentage?.toFixed(2)}% improvement`);
      } else {
        retraining.status = RetrainingStatus.COMPLETED;
        console.log(`Model ${retraining.modelType} retrained but no significant improvement, keeping current version`);
      }

      // Clear training data cache for this model type
      this.trainingDataCache.set(retraining.modelType, []);

      this.emit('retrainingCompleted', retraining);

    } catch (error) {
      retraining.status = RetrainingStatus.FAILED;
      console.error(`Retraining failed for ${retraining.modelType}:`, error);
      this.emit('retrainingFailed', { retraining, error });
    }
  }

  // Deploy a new model version
  private async deployNewModelVersion(modelType: ModelType, metrics: ModelMetrics, retraining: ModelRetraining): Promise<void> {
    const currentModel = this.models.get(`${modelType}-current`)!;

    // Create new version
    const newVersion = this.incrementVersion(currentModel.version);
    const newModel: ModelVersion = {
      ...currentModel,
      id: `${modelType}-${newVersion}`,
      version: newVersion,
      metrics,
      createdAt: new Date().toISOString(),
      deployedAt: new Date().toISOString(),
      performanceHistory: [],
      trainingData: {
        ...currentModel.trainingData,
        sampleSize: retraining.trainingMetadata.sampleSize,
        trainingDuration: retraining.trainingMetadata.trainingDuration || 0
      }
    };

    // Archive old model
    currentModel.status = ModelStatus.DEPRECATED;
    currentModel.retiredAt = new Date().toISOString();

    // Deploy new model
    this.models.set(`${modelType}-current`, newModel);
    this.models.set(`${modelType}-${newVersion}`, newModel);

    retraining.newVersion = newVersion;

    this.emit('modelDeployed', {
      modelType,
      newVersion,
      previousVersion: currentModel.version,
      improvement: retraining.improvementPercentage
    });
  }

  // Increment version number
  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    parts[2]++; // Increment patch version
    return parts.join('.');
  }

  // Process feedback buffer
  private processFeedbackBuffer(): void {
    // Group feedback by model type and process in batches
    const feedbackByModel = new Map<ModelType, ModelFeedback[]>();

    this.feedbackBuffer.forEach(feedback => {
      if (!feedbackByModel.has(feedback.modelType)) {
        feedbackByModel.set(feedback.modelType, []);
      }
      feedbackByModel.get(feedback.modelType)!.push(feedback);
    });

    // Process feedback for model performance insights
    feedbackByModel.forEach((feedbacks, modelType) => {
      if (feedbacks.length > 0) {
        this.analyzeFeedbackPatterns(modelType, feedbacks);
      }
    });

    // Clear processed feedback
    this.feedbackBuffer = [];
  }

  // Analyze feedback patterns for insights
  private analyzeFeedbackPatterns(modelType: ModelType, feedbacks: ModelFeedback[]): void {
    const outcomes = feedbacks.filter(f => f.feedbackType === FeedbackType.OUTCOME);
    if (outcomes.length === 0) return;

    // Calculate accuracy from actual outcomes
    const correctPredictions = outcomes.filter(f => {
      if (typeof f.actualOutcome === 'boolean' && typeof f.predictedOutcome === 'boolean') {
        return f.actualOutcome === f.predictedOutcome;
      }
      if (typeof f.actualOutcome === 'number' && typeof f.predictedOutcome === 'number') {
        return Math.abs(f.actualOutcome - f.predictedOutcome) / f.actualOutcome < 0.1; // Within 10%
      }
      return false;
    });

    const realWorldAccuracy = correctPredictions.length / outcomes.length;
    const model = this.models.get(`${modelType}-current`);

    if (model && realWorldAccuracy < model.metrics.accuracy - this.config.retraining.accuracyThreshold) {
      console.log(`Real-world accuracy (${realWorldAccuracy.toFixed(3)}) significantly lower than model accuracy (${model.metrics.accuracy.toFixed(3)}) for ${modelType}`);

      // This could trigger additional analysis or immediate retraining
      this.emit('performanceDrift', {
        modelType,
        modelAccuracy: model.metrics.accuracy,
        realWorldAccuracy,
        drift: model.metrics.accuracy - realWorldAccuracy
      });
    }
  }

  // Evaluate if retraining is needed
  private async evaluateRetrainingNeed(modelType: ModelType): Promise<void> {
    const trainingData = this.trainingDataCache.get(modelType) || [];
    const model = this.models.get(`${modelType}-current`);

    if (!model || trainingData.length === 0) return;

    // Check various conditions for retraining need
    const recentFeedback = this.feedbackBuffer.filter(f =>
      f.modelType === modelType &&
      Date.now() - new Date(f.submittedAt).getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    // Analyze recent feedback for patterns that might indicate model drift
    if (recentFeedback.length > 10) {
      const errorRate = recentFeedback.filter(f =>
        f.feedbackType === FeedbackType.CORRECTION ||
        (f.feedbackType === FeedbackType.OUTCOME && f.actualOutcome !== f.predictedOutcome)
      ).length / recentFeedback.length;

      if (errorRate > 0.3) { // High error rate threshold
        await this.triggerRetraining(modelType, {
          type: TriggerType.PERFORMANCE_DEGRADATION,
          threshold: 0.3,
          actualValue: errorRate,
          description: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
          severity: 'high'
        });
      }
    }
  }

  // Clean up old data
  private cleanupOldData(): void {
    const now = Date.now();
    const metricsRetention = this.config.monitoring.metricsRetentionDays * 24 * 60 * 60 * 1000;
    const feedbackRetention = this.config.monitoring.feedbackRetentionDays * 24 * 60 * 60 * 1000;

    // Clean up performance history
    this.models.forEach(model => {
      model.performanceHistory = model.performanceHistory.filter(point =>
        now - new Date(point.timestamp).getTime() < metricsRetention
      );
    });

    // Clean up old feedback
    this.feedbackBuffer = this.feedbackBuffer.filter(feedback =>
      now - new Date(feedback.submittedAt).getTime() < feedbackRetention
    );

    // Clean up completed retraining records
    this.retrainingQueue = this.retrainingQueue.filter(retraining => {
      if (retraining.status === RetrainingStatus.COMPLETED || retraining.status === RetrainingStatus.FAILED) {
        return now - new Date(retraining.startedAt).getTime() < metricsRetention;
      }
      return true;
    });
  }

  // Public API methods

  public async getModelPerformance(modelType?: ModelType): Promise<ModelVersion[]> {
    if (modelType) {
      const model = this.models.get(`${modelType}-current`);
      return model ? [model] : [];
    }

    return Array.from(this.models.values()).filter(model => model.status === ModelStatus.ACTIVE);
  }

  public async getRetrainingHistory(modelType?: ModelType): Promise<ModelRetraining[]> {
    if (modelType) {
      return this.retrainingQueue.filter(r => r.modelType === modelType);
    }
    return [...this.retrainingQueue];
  }

  public async getModelVersions(modelType: ModelType): Promise<ModelVersion[]> {
    return Array.from(this.models.values()).filter(model => model.modelType === modelType);
  }

  public async manualRetrain(modelType: ModelType, reason: string): Promise<string> {
    return this.triggerRetraining(modelType, {
      type: TriggerType.MANUAL,
      threshold: 0,
      actualValue: 0,
      description: reason,
      severity: 'medium'
    });
  }

  public async getPerformanceStats(): Promise<{
    totalModels: number;
    activeModels: number;
    avgAccuracy: number;
    totalRetrainings: number;
    pendingRetrainings: number;
    trainingDataPoints: number;
  }> {
    const activeModels = Array.from(this.models.values()).filter(m => m.status === ModelStatus.ACTIVE);
    const avgAccuracy = activeModels.reduce((sum, m) => sum + m.metrics.accuracy, 0) / activeModels.length;
    const totalTrainingDataPoints = Array.from(this.trainingDataCache.values()).reduce((sum, data) => sum + data.length, 0);

    return {
      totalModels: this.models.size,
      activeModels: activeModels.length,
      avgAccuracy,
      totalRetrainings: this.retrainingQueue.length,
      pendingRetrainings: this.retrainingQueue.filter(r => r.status === RetrainingStatus.QUEUED || r.status === RetrainingStatus.RUNNING).length,
      trainingDataPoints: totalTrainingDataPoints
    };
  }

  // Cleanup
  public shutdown(): void {
    this.performanceMonitors.forEach(monitor => clearInterval(monitor));
    this.performanceMonitors.clear();
    console.log('Model Refinement Service shut down');
  }
}

// Export singleton instance
export const modelRefinementService = ModelRefinementService.getInstance();
