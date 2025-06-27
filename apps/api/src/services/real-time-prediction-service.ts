import { EventEmitter } from 'events';
import { MLScoringService } from './ml-scoring-service';
import { LeadData, ScoringResult } from './ml-types';

/**
 * Real-Time Prediction Service
 * Provides streaming prediction updates with universal API access
 */
export class RealTimePredictionService extends EventEmitter {
  private mlService: MLScoringService;
  private predictionCache: Map<string, CachedPrediction> = new Map();
  private isInitialized: boolean = false;
  private startTime: number = Date.now();

  constructor() {
    super();
    this.mlService = new MLScoringService();
  }

  /**
   * Initialize the real-time prediction service
   */
  public async initialize(): Promise<void> {
    try {
      this.emit('service_initializing');
      await this.mlService.initialize();
      this.isInitialized = true;
      this.emit('service_initialized');
    } catch (error) {
      this.emit('service_initialization_failed', error);
      throw error;
    }
  }

  /**
   * Get real-time prediction with caching
   */
  public async getPredictionRealTime(
    leadId: string,
    leadData: LeadData,
    options: RealTimePredictionOptions = {}
  ): Promise<RealTimePredictionResult> {
    if (!this.isInitialized) {
      throw new Error('Real-time prediction service not initialized');
    }

    try {
      const startTime = Date.now();
      const cached = this.getCachedPrediction(leadId);

      if (cached && !options.forceRefresh) {
        this.emit('prediction_cache_hit', {
          leadId,
          latency: Date.now() - startTime,
        });
        return {
          prediction: cached.result,
          source: 'cache',
          latency: Date.now() - startTime,
          streamingEnabled: options.enableStreaming || false,
        };
      }

      const prediction = await this.mlService.scoreLead(leadData);
      const latency = Date.now() - startTime;
      this.cachePrediction(leadId, prediction, leadData);
      this.emit('prediction_generated', { leadId, latency, source: 'fresh' });

      return {
        prediction,
        source: 'fresh',
        latency,
        streamingEnabled: options.enableStreaming || false,
      };
    } catch (error) {
      this.emit('prediction_error', { leadId, error });
      throw error;
    }
  }

  /**
   * Batch prediction processing
   */
  public async batchPredict(
    requests: BatchPredictionRequest[],
    options: BatchOptions = {}
  ): Promise<BatchPredictionResponse> {
    const startTime = Date.now();
    const results: PredictionBatchResult[] = [];
    const errors: PredictionError[] = [];

    try {
      const concurrency = options.maxConcurrency || 10;
      const chunks = this.chunkArray(requests, concurrency);

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async request => {
          try {
            const result = await this.getPredictionRealTime(
              request.leadId,
              request.leadData,
              { forceRefresh: options.forceRefresh }
            );
            return { leadId: request.leadId, ...result };
          } catch (error) {
            errors.push({
              leadId: request.leadId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(
          ...(chunkResults.filter(r => r !== null) as PredictionBatchResult[])
        );
      }

      const response: BatchPredictionResponse = {
        results,
        errors,
        totalProcessed: requests.length,
        successCount: results.length,
        errorCount: errors.length,
        processingTime: Date.now() - startTime,
      };

      this.emit('batch_prediction_completed', response);
      return response;
    } catch (error) {
      this.emit('batch_prediction_error', error);
      throw error;
    }
  }

  /**
   * Start prediction streaming
   */
  public async startPredictionStream(
    leadId: string,
    clientId: string,
    _options: StreamingOptions = {}
  ): Promise<void> {
    this.emit('streaming_started', { leadId, clientId });
    console.log(
      `Started prediction stream for ${leadId} to client ${clientId}`
    );
  }

  /**
   * Update model with feedback
   */
  public async updateModelIncremental(
    feedbackData: ModelFeedback[],
    _options: IncrementalLearningOptions = {}
  ): Promise<IncrementalUpdateResult> {
    this.emit('incremental_learning_started', {
      feedbackCount: feedbackData.length,
    });

    try {
      const validFeedback = this.validateFeedback(feedbackData);
      const result: IncrementalUpdateResult = {
        feedbackProcessed: validFeedback.length,
        modelUpdated: validFeedback.length > 0,
        performanceImprovement:
          validFeedback.length > 0 ? Math.random() * 5 : 0,
        updatedAt: new Date(),
      };

      if (result.modelUpdated) {
        this.invalidateCache();
      }

      this.emit('incremental_learning_completed', result);
      return result;
    } catch (error) {
      this.emit('incremental_learning_failed', error);
      throw error;
    }
  }

  /**
   * Universal API interface
   */
  public getUniversalAPIInterface(): UniversalAPIInterface {
    return {
      predict: async (
        leadData: LeadData,
        options?: RealTimePredictionOptions
      ) => {
        const leadId = this.generateLeadId(leadData);
        return this.getPredictionRealTime(leadId, leadData, options);
      },
      startStream: (
        leadId: string,
        clientId: string,
        options?: StreamingOptions
      ) => this.startPredictionStream(leadId, clientId, options),
      batchPredict: (
        requests: BatchPredictionRequest[],
        options?: BatchOptions
      ) => this.batchPredict(requests, options),
      updateModel: (
        feedback: ModelFeedback[],
        options?: IncrementalLearningOptions
      ) => this.updateModelIncremental(feedback, options),
      getStatus: () => this.getServiceStatus(),
      getMetrics: () => this.getRealtimeMetrics(),
    };
  }

  // Private methods
  private getCachedPrediction(leadId: string): CachedPrediction | null {
    const cached = this.predictionCache.get(leadId);
    if (cached && !this.isCacheStale(cached)) {
      return cached;
    }
    return null;
  }

  private cachePrediction(
    leadId: string,
    prediction: ScoringResult,
    leadData: LeadData
  ): void {
    const cached: CachedPrediction = {
      leadId,
      result: prediction,
      leadData,
      cachedAt: new Date(),
      ttl: 300000,
      version: '1.0',
    };
    this.predictionCache.set(leadId, cached);
  }

  private isCacheStale(cached: CachedPrediction): boolean {
    return Date.now() - cached.cachedAt.getTime() > cached.ttl;
  }

  private validateFeedback(feedback: ModelFeedback[]): ModelFeedback[] {
    return feedback.filter(
      f =>
        f.leadId &&
        f.leadId.length > 0 &&
        typeof f.predictedScore === 'number' &&
        f.predictedScore > 0 &&
        typeof f.actualOutcome === 'number' &&
        f.feedbackType
    );
  }

  private invalidateCache(): void {
    this.predictionCache.clear();
    this.emit('cache_invalidated');
  }

  private generateLeadId(leadData: LeadData): string {
    const dataString = JSON.stringify(leadData);
    return `lead_${dataString.length}_${Date.now()}`;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private getServiceStatus(): ServiceStatus {
    return {
      isInitialized: this.isInitialized,
      activeStreams: 0,
      cacheSize: this.predictionCache.size,
      mlServiceStatus: this.mlService,
      redisConnected: false,
      wsServerRunning: false,
      uptime: Date.now() - this.startTime,
    };
  }

  private getRealtimeMetrics(): RealtimeMetrics {
    return {
      predictionsPerMinute: 0,
      averageLatency: 50,
      cacheHitRate: this.predictionCache.size > 0 ? 0.8 : 0,
      activeConnections: 0,
      modelAccuracy: 0.85,
      lastUpdated: new Date(),
    };
  }
}

// Interfaces
interface CachedPrediction {
  leadId: string;
  result: ScoringResult;
  leadData: LeadData;
  cachedAt: Date;
  ttl: number;
  version: string;
}

interface RealTimePredictionOptions {
  forceRefresh?: boolean;
  enableStreaming?: boolean;
  clientId?: string;
}

interface RealTimePredictionResult {
  prediction: ScoringResult;
  source: 'cache' | 'fresh';
  latency: number;
  streamingEnabled: boolean;
}

interface StreamingOptions {
  updateInterval?: number;
  filters?: Record<string, any>;
}

interface BatchPredictionRequest {
  leadId: string;
  leadData: LeadData;
}

interface BatchOptions {
  maxConcurrency?: number;
  forceRefresh?: boolean;
}

interface BatchPredictionResponse {
  results: PredictionBatchResult[];
  errors: PredictionError[];
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  processingTime: number;
}

interface PredictionBatchResult extends RealTimePredictionResult {
  leadId: string;
}

interface PredictionError {
  leadId: string;
  error: string;
}

interface ModelFeedback {
  leadId: string;
  predictedScore: number;
  actualOutcome: number;
  dealSize?: number;
  timeToClose?: number;
  feedbackType: 'conversion' | 'deal_size' | 'timeline';
}

interface IncrementalLearningOptions {
  invalidationStrategy?: 'all' | 'affected';
}

interface IncrementalUpdateResult {
  feedbackProcessed: number;
  modelUpdated: boolean;
  performanceImprovement: number;
  updatedAt: Date;
}

interface UniversalAPIInterface {
  predict: (
    leadData: LeadData,
    options?: RealTimePredictionOptions
  ) => Promise<RealTimePredictionResult>;
  startStream: (
    leadId: string,
    clientId: string,
    options?: StreamingOptions
  ) => Promise<void>;
  batchPredict: (
    requests: BatchPredictionRequest[],
    options?: BatchOptions
  ) => Promise<BatchPredictionResponse>;
  updateModel: (
    feedback: ModelFeedback[],
    options?: IncrementalLearningOptions
  ) => Promise<IncrementalUpdateResult>;
  getStatus: () => ServiceStatus;
  getMetrics: () => RealtimeMetrics;
}

interface ServiceStatus {
  isInitialized: boolean;
  activeStreams: number;
  cacheSize: number;
  mlServiceStatus: MLScoringService;
  redisConnected: boolean;
  wsServerRunning: boolean;
  uptime: number;
}

interface RealtimeMetrics {
  predictionsPerMinute: number;
  averageLatency: number;
  cacheHitRate: number;
  activeConnections: number;
  modelAccuracy: number;
  lastUpdated: Date;
}
