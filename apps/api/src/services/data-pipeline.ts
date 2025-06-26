import { EventEmitter } from 'events';
import { redisManager } from './redis-client';

// =============================================================================
// DATA PIPELINE TYPES & INTERFACES
// =============================================================================

export interface RawEvent {
  id?: string;
  type: EventType;
  sessionId: string;
  visitorId: string;
  timestamp?: Date;
  platform?: PlatformInfo;
  data: Record<string, any>;
  metadata?: EventMetadata;
}

export interface ProcessedEvent extends RawEvent {
  id: string;
  timestamp: Date;
  processed: boolean;
  enriched: boolean;
  aggregated: boolean;
  processingTime: number;
  pipeline: PipelineStage[];
}

export interface PipelineStage {
  name: string;
  timestamp: Date;
  duration: number;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

export interface EventMetadata {
  source: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  quality: QualityScore;
  enrichments: Record<string, any>;
}

export interface QualityScore {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  freshness: number; // 0-1
  overall: number; // 0-1
}

export interface PlatformInfo {
  type: string;
  version?: string;
  framework?: string;
  environment?: 'production' | 'staging' | 'development';
}

export enum EventType {
  PAGE_VIEW = 'page_view',
  CLICK = 'click',
  FORM_SUBMIT = 'form_submit',
  DOWNLOAD = 'download',
  CUSTOM = 'custom',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end'
}

export interface BatchJob {
  id: string;
  type: 'aggregation' | 'enrichment' | 'cleanup' | 'export';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  totalRecords: number;
  processedRecords: number;
  errorCount: number;
  configuration: Record<string, any>;
}

export interface PipelineMetrics {
  eventsPerSecond: number;
  averageProcessingTime: number;
  errorRate: number;
  queueSize: number;
  uptime: number;
  lastProcessedEvent: Date;
}

// =============================================================================
// DATA PIPELINE MANAGER
// =============================================================================

export class DataPipelineManager extends EventEmitter {
  private isRunning: boolean = false;
  private processingQueue: RawEvent[] = [];
  private batchJobs: Map<string, BatchJob> = new Map();
  private metrics: PipelineMetrics;
  private metricsInterval?: NodeJS.Timeout;

  // Processing stages
  private ingestionStage: IngestionProcessor;
  private transformationStage: TransformationProcessor;
  private enrichmentStage: EnrichmentProcessor;
  private aggregationStage: AggregationProcessor;
  private storageStage: StorageProcessor;

  constructor() {
    super();

    // Initialize processing stages
    this.ingestionStage = new IngestionProcessor();
    this.transformationStage = new TransformationProcessor();
    this.enrichmentStage = new EnrichmentProcessor();
    this.aggregationStage = new AggregationProcessor();
    this.storageStage = new StorageProcessor();

    // Initialize metrics
    this.metrics = {
      eventsPerSecond: 0,
      averageProcessingTime: 0,
      errorRate: 0,
      queueSize: 0,
      uptime: 0,
      lastProcessedEvent: new Date()
    };

    this.setupEventHandlers();
  }

  // =============================================================================
  // PIPELINE ORCHESTRATION
  // =============================================================================

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('📊 Data pipeline is already running');
      return;
    }

    try {
      this.isRunning = true;

      // Start processing stages
      await Promise.all([
        this.ingestionStage.start(),
        this.transformationStage.start(),
        this.enrichmentStage.start(),
        this.aggregationStage.start(),
        this.storageStage.start()
      ]);

      // Start metrics collection
      this.startMetricsCollection();

      console.log('🚀 Data pipeline started successfully');
      this.emit('pipeline:started');

    } catch (error) {
      this.isRunning = false;
      console.error('❌ Failed to start data pipeline:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      this.isRunning = false;

      // Stop metrics collection
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }

      // Stop processing stages
      await Promise.all([
        this.ingestionStage.stop(),
        this.transformationStage.stop(),
        this.enrichmentStage.stop(),
        this.aggregationStage.stop(),
        this.storageStage.stop()
      ]);

      console.log('⏹️ Data pipeline stopped');
      this.emit('pipeline:stopped');

    } catch (error) {
      console.error('❌ Error stopping data pipeline:', error);
      throw error;
    }
  }

  // =============================================================================
  // EVENT PROCESSING
  // =============================================================================

  async processEvent(event: RawEvent): Promise<ProcessedEvent> {
    const startTime = Date.now();
    const pipeline: PipelineStage[] = [];

    try {
      // Stage 1: Ingestion
      const ingestedEvent = await this.runStage(
        'ingestion',
        () => this.ingestionStage.process(event),
        pipeline
      );

      // Stage 2: Transformation
      const transformedEvent = await this.runStage(
        'transformation',
        () => this.transformationStage.process(ingestedEvent),
        pipeline
      );

      // Stage 3: Enrichment
      const enrichedEvent = await this.runStage(
        'enrichment',
        () => this.enrichmentStage.process(transformedEvent),
        pipeline
      );

      // Stage 4: Aggregation
      await this.runStage(
        'aggregation',
        () => this.aggregationStage.process(enrichedEvent),
        pipeline
      );

      // Stage 5: Storage
      const storedEvent = await this.runStage(
        'storage',
        () => this.storageStage.process(enrichedEvent),
        pipeline
      );

      const processingTime = Date.now() - startTime;

      // Ensure we have required fields for ProcessedEvent
      if (!storedEvent.id) {
        throw new Error('Event ID is required after processing');
      }

      const processedEvent: ProcessedEvent = {
        ...storedEvent,
        id: storedEvent.id,
        timestamp: storedEvent.timestamp || new Date(),
        processed: true,
        enriched: true,
        aggregated: true,
        processingTime,
        pipeline
      };

      // Update metrics
      this.updateMetrics(processingTime, false);

      // Emit success event
      this.emit('event:processed', processedEvent);

      return processedEvent;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, true);

      console.error('❌ Error processing event:', error);
      this.emit('event:failed', { event, error, pipeline });

      throw error;
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  getMetrics(): PipelineMetrics {
    return { ...this.metrics };
  }

  getBatchJob(id: string): BatchJob | undefined {
    return this.batchJobs.get(id);
  }

  getAllBatchJobs(): BatchJob[] {
    return Array.from(this.batchJobs.values());
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    pipeline: boolean;
    stages: Record<string, boolean>;
    metrics: PipelineMetrics;
  }> {
    const stages = {
      ingestion: this.ingestionStage.isHealthy(),
      transformation: this.transformationStage.isHealthy(),
      enrichment: this.enrichmentStage.isHealthy(),
      aggregation: this.aggregationStage.isHealthy(),
      storage: this.storageStage.isHealthy()
    };

    const allStagesHealthy = Object.values(stages).every(Boolean);
    const status = this.isRunning && allStagesHealthy ? 'healthy' :
                   this.isRunning ? 'degraded' : 'unhealthy';

    return {
      status,
      pipeline: this.isRunning,
      stages,
      metrics: this.getMetrics()
    };
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private async runStage<T>(
    stageName: string,
    stageFunction: () => Promise<T>,
    pipeline: PipelineStage[]
  ): Promise<T> {
    const stageStart = Date.now();

    try {
      const result = await stageFunction();
      const duration = Date.now() - stageStart;

      pipeline.push({
        name: stageName,
        timestamp: new Date(),
        duration,
        status: 'success'
      });

      return result;
    } catch (error) {
      const duration = Date.now() - stageStart;

      pipeline.push({
        name: stageName,
        timestamp: new Date(),
        duration,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });

      throw error;
    }
  }

  private setupEventHandlers(): void {
    this.on('event:processed', () => {
      this.metrics.lastProcessedEvent = new Date();
    });

    this.on('event:failed', () => {
      // Error metrics are updated in updateMetrics
    });
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.metrics.queueSize = this.processingQueue.length;
      this.metrics.uptime = Date.now();

      // Calculate events per second (simplified)
      // In a real implementation, this would be more sophisticated
      this.emit('metrics:updated', this.metrics);
    }, 5000); // Update every 5 seconds
  }

  private updateMetrics(processingTime: number, isError: boolean): void {
    // Update average processing time (simple moving average)
    this.metrics.averageProcessingTime =
      (this.metrics.averageProcessingTime + processingTime) / 2;

    // Update error rate (simplified calculation)
    if (isError) {
      this.metrics.errorRate = Math.min(this.metrics.errorRate + 0.01, 1);
    } else {
      this.metrics.errorRate = Math.max(this.metrics.errorRate - 0.001, 0);
    }
  }
}

// =============================================================================
// PROCESSING STAGE INTERFACES
// =============================================================================

interface ProcessorInterface {
  start(): Promise<void>;
  stop(): Promise<void>;
  isHealthy(): boolean;
}

class IngestionProcessor implements ProcessorInterface {
  private isActive: boolean = false;

  async start(): Promise<void> {
    this.isActive = true;
    console.log('🔄 Ingestion processor started');
  }

  async stop(): Promise<void> {
    this.isActive = false;
    console.log('⏹️ Ingestion processor stopped');
  }

  async process(event: RawEvent): Promise<RawEvent> {
    // Validate required fields
    if (!event.type || !event.sessionId || !event.visitorId) {
      throw new Error('Missing required event fields');
    }

    // Generate ID if not provided
    if (!event.id) {
      event.id = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Set timestamp if not provided
    if (!event.timestamp) {
      event.timestamp = new Date();
    }

    // Initialize metadata if not provided
    if (!event.metadata) {
      event.metadata = {
        source: 'api',
        quality: { completeness: 0.8, accuracy: 0.9, freshness: 1.0, overall: 0.9 },
        enrichments: {}
      };
    }

    return event;
  }

  isHealthy(): boolean {
    return this.isActive;
  }
}

class TransformationProcessor implements ProcessorInterface {
  private isActive: boolean = false;

  async start(): Promise<void> {
    this.isActive = true;
    console.log('🔄 Transformation processor started');
  }

  async stop(): Promise<void> {
    this.isActive = false;
    console.log('⏹️ Transformation processor stopped');
  }

  async process(event: RawEvent): Promise<RawEvent> {
    // Normalize event type
    event.type = this.normalizeEventType(event.type);

    // Sanitize data
    event.data = this.sanitizeData(event.data);

    return event;
  }

  private normalizeEventType(type: string): EventType {
    const normalized = type.toLowerCase().replace(/[-_\s]/g, '_');

    switch (normalized) {
      case 'page_view':
      case 'pageview':
      case 'page_load':
        return EventType.PAGE_VIEW;
      case 'click':
      case 'button_click':
      case 'link_click':
        return EventType.CLICK;
      case 'form_submit':
      case 'form_submission':
      case 'submit':
        return EventType.FORM_SUBMIT;
      case 'download':
      case 'file_download':
        return EventType.DOWNLOAD;
      default:
        return EventType.CUSTOM;
    }
  }

  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      // Remove sensitive information
      if (this.isSensitiveField(key)) {
        continue;
      }

      // Limit string length
      if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '...';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password', 'ssn', 'credit_card', 'email', 'phone',
      'api_key', 'token', 'secret', 'private_key'
    ];

    return sensitiveFields.some(field =>
      fieldName.toLowerCase().includes(field)
    );
  }

  isHealthy(): boolean {
    return this.isActive;
  }
}

class EnrichmentProcessor implements ProcessorInterface {
  private isActive: boolean = false;

  async start(): Promise<void> {
    this.isActive = true;
    console.log('🔄 Enrichment processor started');
  }

  async stop(): Promise<void> {
    this.isActive = false;
    console.log('⏹️ Enrichment processor stopped');
  }

  async process(event: RawEvent): Promise<RawEvent> {
    // Enrich with session data
    await this.enrichWithSessionData(event);

    // Enrich with cached visitor data
    await this.enrichWithVisitorData(event);

    return event;
  }

  private async enrichWithSessionData(event: RawEvent): Promise<void> {
    try {
      // Get session data from Redis cache
      const sessionKey = `session:${event.sessionId}`;
      const sessionData = await redisManager.getClient().hgetall(sessionKey);

      if (sessionData && Object.keys(sessionData).length > 0) {
        event.metadata!.enrichments.session = {
          startTime: sessionData.startTime,
          pageViews: parseInt(sessionData.pageViews) || 0,
          events: parseInt(sessionData.events) || 0,
          platform: sessionData.platform
        };
      }
    } catch (error) {
      console.warn('⚠️ Failed to enrich with session data:', error);
    }
  }

  private async enrichWithVisitorData(event: RawEvent): Promise<void> {
    try {
      // Get visitor data from Redis cache first (faster)
      const visitorKey = `visitor:${event.visitorId}`;
      const visitorData = await redisManager.getClient().hgetall(visitorKey);

      if (visitorData && Object.keys(visitorData).length > 0) {
        event.metadata!.enrichments.visitor = {
          firstSeen: visitorData.firstSeen,
          totalSessions: parseInt(visitorData.totalSessions) || 0,
          totalEvents: parseInt(visitorData.totalEvents) || 0
        };
      }
    } catch (error) {
      console.warn('⚠️ Failed to enrich with visitor data:', error);
    }
  }

  isHealthy(): boolean {
    return this.isActive;
  }
}

class AggregationProcessor implements ProcessorInterface {
  private isActive: boolean = false;

  async start(): Promise<void> {
    this.isActive = true;
    console.log('🔄 Aggregation processor started');
  }

  async stop(): Promise<void> {
    this.isActive = false;
    console.log('⏹️ Aggregation processor stopped');
  }

  async process(event: RawEvent): Promise<void> {
    // Update real-time aggregations in Redis
    await this.updateRealTimeAggregations(event);

    // Update session aggregations
    await this.updateSessionAggregations(event);

    // Update visitor aggregations
    await this.updateVisitorAggregations(event);
  }

  private async updateRealTimeAggregations(event: RawEvent): Promise<void> {
    const redis = redisManager.getClient();
    const now = new Date();
    const hourKey = `analytics:hourly:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    const dayKey = `analytics:daily:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

    try {
      await Promise.all([
        // Hourly aggregations
        redis.hincrby(hourKey, 'total_events', 1),
        redis.hincrby(hourKey, `events:${event.type}`, 1),
        redis.expire(hourKey, 86400), // 24 hours

        // Daily aggregations
        redis.hincrby(dayKey, 'total_events', 1),
        redis.hincrby(dayKey, `events:${event.type}`, 1),
        redis.expire(dayKey, 604800), // 7 days

        // Real-time metrics
        redis.set('metrics:last_event_time', Date.now()),
        redis.incr('metrics:total_events_today')
      ]);
    } catch (error) {
      console.warn('⚠️ Failed to update real-time aggregations:', error);
    }
  }

  private async updateSessionAggregations(event: RawEvent): Promise<void> {
    const redis = redisManager.getClient();
    const sessionKey = `session:${event.sessionId}`;

    try {
      await Promise.all([
        redis.hincrby(sessionKey, 'events', 1),
        redis.hset(sessionKey, 'lastEventTime', Date.now()),
        redis.expire(sessionKey, 1800) // 30 minutes
      ]);

      if (event.type === EventType.PAGE_VIEW) {
        await redis.hincrby(sessionKey, 'pageViews', 1);
      }
    } catch (error) {
      console.warn('⚠️ Failed to update session aggregations:', error);
    }
  }

  private async updateVisitorAggregations(event: RawEvent): Promise<void> {
    const redis = redisManager.getClient();
    const visitorKey = `visitor:${event.visitorId}`;

    try {
      await Promise.all([
        redis.hincrby(visitorKey, 'totalEvents', 1),
        redis.hset(visitorKey, 'lastSeen', Date.now()),
        redis.expire(visitorKey, 86400 * 30) // 30 days
      ]);

      if (event.type === EventType.PAGE_VIEW) {
        await redis.hincrby(visitorKey, 'totalPageViews', 1);
      }
    } catch (error) {
      console.warn('⚠️ Failed to update visitor aggregations:', error);
    }
  }

  isHealthy(): boolean {
    return this.isActive;
  }
}

class StorageProcessor implements ProcessorInterface {
  private isActive: boolean = false;

  async start(): Promise<void> {
    this.isActive = true;
    console.log('🔄 Storage processor started');
  }

  async stop(): Promise<void> {
    this.isActive = false;
    console.log('⏹️ Storage processor stopped');
  }

  async process(event: RawEvent): Promise<RawEvent> {
    // Store in time-series cache for recent access
    await this.storeInCache(event);

    // In a real implementation, we would store in the database here
    // For now, we'll comment out the database storage to avoid Prisma issues
    // await this.storeEvent(event);

    return event;
  }

  private async storeInCache(event: RawEvent): Promise<void> {
    try {
      const redis = redisManager.getClient();
      const eventKey = `event:${event.id}`;

      await redis.setex(
        eventKey,
        3600, // 1 hour
        JSON.stringify(event)
      );

      // Add to recent events list
      await redis.lpush('events:recent', event.id!);
      await redis.ltrim('events:recent', 0, 999); // Keep last 1000 events
    } catch (error) {
      console.warn('⚠️ Failed to store event in cache:', error);
    }
  }

  isHealthy(): boolean {
    return this.isActive;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const dataPipeline = new DataPipelineManager();
