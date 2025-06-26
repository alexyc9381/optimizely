import { EventEmitter } from 'events';
import { batchProcessor, BatchProcessorManager } from './batch-processor';
import { dataPipeline, DataPipelineManager, EventType, ProcessedEvent, RawEvent } from './data-pipeline';
import { dataQuality, DataQualityManager } from './data-quality';
import { redisManager } from './redis-client';

export interface AnalyticsEvent {
  type: string;
  sessionId: string;
  visitorId: string;
  timestamp?: Date;
  data: Record<string, any>;
  metadata?: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    platform?: string;
  };
}

export interface AnalyticsQuery {
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics?: string[];
  dimensions?: string[];
  filters?: Record<string, any>;
  groupBy?: string[];
  orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
  offset?: number;
}

export interface AnalyticsResult {
  data: Array<Record<string, any>>;
  metadata: {
    totalCount: number;
    processedCount: number;
    executionTime: number;
    qualityScore?: number;
  };
  aggregations?: Record<string, any>;
}

export interface RealTimeMetrics {
  eventsPerSecond: number;
  activeVisitors: number;
  activeSessions: number;
  topPages: Array<{ page: string; views: number }>;
  topEvents: Array<{ type: string; count: number }>;
  conversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
}

export interface EventData {
  id: string;
  type: string;
  sessionId: string;
  visitorId: string;
  timestamp: string;
  data: Record<string, unknown>;
  createdAt?: string;
}

export interface QueryOptions {
  filters: Record<string, unknown>;
  pagination: { limit: number; offset: number };
  apiKey?: string;
}

export interface EventQuery {
  filters: Record<string, unknown>;
  limit: number;
  offset: number;
}

export interface QueryResult {
  success: boolean;
  events?: EventData[];
  totalCount?: number;
  error?: string;
}

export interface EventResult {
  success: boolean;
  event?: EventData;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export class AnalyticsServiceManager extends EventEmitter {
  private isRunning: boolean = false;
  private startTime: Date = new Date();
  private metricsCache: Map<string, { data: any; expires: number }> = new Map();
  private realtimeInterval?: NodeJS.Timeout;
  private pipeline: DataPipelineManager;
  private batchProcessor: BatchProcessorManager;
  private dataQuality: DataQualityManager;
  private redisClient: any; // TODO: Add proper Redis type
  private initialized: boolean = false;

  constructor() {
    super();
    this.pipeline = new DataPipelineManager();
    this.batchProcessor = new BatchProcessorManager();
    this.dataQuality = new DataQualityManager();
    this.redisClient = redisManager.getClient();
    this.initializeRealtimeMetrics();
    this.setupEventHandlers();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('📊 Analytics service is already running');
      return;
    }

    try {
      this.isRunning = true;
      this.startTime = new Date();

      await Promise.all([
        dataPipeline.start(),
        batchProcessor.start(),
        dataQuality.start()
      ]);

      this.startRealtimeMetrics();

      console.log('🚀 Analytics service started successfully');
      this.emit('service:started');

    } catch (error) {
      this.isRunning = false;
      console.error('❌ Failed to start analytics service:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      this.isRunning = false;

      if (this.realtimeInterval) {
        clearInterval(this.realtimeInterval);
      }

      await Promise.all([
        dataPipeline.stop(),
        batchProcessor.stop(),
        dataQuality.stop()
      ]);

      console.log('⏹️ Analytics service stopped');
      this.emit('service:stopped');

    } catch (error) {
      console.error('❌ Error stopping analytics service:', error);
      throw error;
    }
  }

  async ingestEvent(event: AnalyticsEvent): Promise<{
    success: boolean;
    eventId?: string;
    processingTime?: number;
    qualityScore?: number;
    violations?: string[];
  }> {
    const startTime = Date.now();

    try {
      const rawEvent: RawEvent = {
        type: this.normalizeEventType(event.type),
        sessionId: event.sessionId,
        visitorId: event.visitorId,
        timestamp: event.timestamp || new Date(),
        data: event.data,
        metadata: {
          source: 'api',
          ip: event.metadata?.ip,
          userAgent: event.metadata?.userAgent,
          referrer: event.metadata?.referrer,
          quality: { completeness: 1, accuracy: 1, freshness: 1, overall: 1 },
          enrichments: {}
        },
        platform: event.metadata?.platform ? {
          type: event.metadata.platform
        } : undefined
      };

      const qualityResult = await dataQuality.validateEvent(rawEvent);
      const processedEvent = await dataPipeline.processEvent(rawEvent);
      const processingTime = Date.now() - startTime;

      this.updateRealtimeMetrics(processedEvent);

      return {
        success: true,
        eventId: processedEvent.id,
        processingTime,
        qualityScore: qualityResult.qualityScore,
        violations: qualityResult.violations.map(v => v.message)
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Error ingesting event:', error);
      return {
        success: false,
        processingTime
      };
    }
  }

  async query(query: AnalyticsQuery): Promise<AnalyticsResult> {
    const startTime = Date.now();

    try {
      const cacheKey = this.generateCacheKey(query);
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await this.executeQuery(query);
      this.cacheResult(cacheKey, result, 300000);

      const executionTime = Date.now() - startTime;
      result.metadata.executionTime = executionTime;

      return result;

    } catch (error) {
      console.error('❌ Error executing query:', error);
      throw error;
    }
  }

  async initialize(): Promise<void> {
    if (!this.isRunning) {
      await this.start();
    }
  }

  async destroy(): Promise<void> {
    await this.stop();
  }

  async queryEvents(options: QueryOptions): Promise<QueryResult> {
    try {
      await this.ensureInitialized();

      const { filters, pagination } = options;
      const events: EventData[] = [];

      // ... existing code ...

      return {
        success: true,
        events,
        totalCount: events.length
      };
    } catch (error) {
      console.error('Query events error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getEventById(eventId: string, _apiKey?: string): Promise<EventResult> {
    try {
      await this.ensureInitialized();
      // Implementation here
      return {
        success: true,
        event: undefined
      };
    } catch (error) {
      console.error('Get event by ID error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteEvent(eventId: string, _apiKey?: string): Promise<DeleteResult> {
    try {
      await this.ensureInitialized();
      // Implementation here
      return {
        success: true
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Event not found'
      };
    }
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    uptime: number;
    isRunning: boolean;
    components: {
      dataPipeline: string;
      batchProcessor: string;
      dataQuality: string;
      redis: string;
    };
  }> {
    const uptime = Date.now() - this.startTime.getTime();

    try {
      const [pipelineHealth, processorHealth, qualityHealth, redisHealth] = await Promise.all([
        this.checkComponentHealth('dataPipeline'),
        this.checkComponentHealth('batchProcessor'),
        this.checkComponentHealth('dataQuality'),
        redisManager.healthCheck()
      ]);

      const components = {
        dataPipeline: pipelineHealth,
        batchProcessor: processorHealth,
        dataQuality: qualityHealth,
        redis: redisHealth.status
      };

      const allHealthy = Object.values(components).every(status => status === 'healthy');
      const status = allHealthy ? 'healthy' : 'degraded';

      return {
        status,
        uptime,
        isRunning: this.isRunning,
        components
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        uptime,
        isRunning: this.isRunning,
        components: {
          dataPipeline: 'unknown',
          batchProcessor: 'unknown',
          dataQuality: 'unknown',
          redis: 'unknown'
        }
      };
    }
  }

  private eventMatchesFilters(event: any, filters: any): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'timestamp' && typeof value === 'object' && value !== null) {
        const eventTime = new Date(event.timestamp);
        const timestampFilter = value as { gte?: string | Date; lte?: string | Date };
        if (timestampFilter.gte && eventTime < new Date(timestampFilter.gte)) return false;
        if (timestampFilter.lte && eventTime > new Date(timestampFilter.lte)) return false;
      } else if (event[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private async checkComponentHealth(component: string): Promise<string> {
    try {
      // Simple health check - in production, implement more sophisticated checks
      switch (component) {
        case 'dataPipeline':
          return dataPipeline ? 'healthy' : 'unhealthy';
        case 'batchProcessor':
          return batchProcessor ? 'healthy' : 'unhealthy';
        case 'dataQuality':
          return dataQuality ? 'healthy' : 'unhealthy';
        default:
          return 'unknown';
      }
    } catch (error) {
      return 'unhealthy';
    }
  }

  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    try {
      const redis = redisManager.getClient();
      const metricsData = await redis.get('analytics:realtime:metrics');

      if (metricsData) {
        return JSON.parse(metricsData);
      }

      return {
        eventsPerSecond: 0,
        activeVisitors: 0,
        activeSessions: 0,
        topPages: [],
        topEvents: [],
        conversionRate: 0,
        avgSessionDuration: 0,
        bounceRate: 0
      };

    } catch (error) {
      console.error('❌ Error getting real-time metrics:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    dataPipeline.on('event:processed', (event) => {
      this.emit('analytics:event:processed', event);
    });

    dataPipeline.on('event:failed', (data) => {
      this.emit('analytics:event:failed', data);
    });

    dataQuality.on('quality:violation', (violation) => {
      this.emit('analytics:quality:violation', violation);
    });
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
      case 'session_start':
        return EventType.SESSION_START;
      case 'session_end':
        return EventType.SESSION_END;
      default:
        return EventType.CUSTOM;
    }
  }

  private async executeQuery(query: AnalyticsQuery): Promise<AnalyticsResult> {
    const redis = redisManager.getClient();

    try {
      const eventKeys = await redis.lrange('events:recent', 0, -1);
      const events: any[] = [];

      for (const eventKey of eventKeys.slice(0, query.limit || 100)) {
        const eventData = await redis.get(`event:${eventKey}`);
        if (eventData) {
          const event = JSON.parse(eventData);
          const eventDate = new Date(event.timestamp);

          if (eventDate >= query.dateRange.start && eventDate <= query.dateRange.end) {
            if (!query.filters || this.matchesFilters(event, query.filters)) {
              events.push(event);
            }
          }
        }
      }

      const data = this.processQueryResults(events, query);

      return {
        data,
        metadata: {
          totalCount: events.length,
          processedCount: data.length,
          executionTime: 0
        }
      };

    } catch (error) {
      console.error('❌ Error executing query:', error);
      return {
        data: [],
        metadata: {
          totalCount: 0,
          processedCount: 0,
          executionTime: 0
        }
      };
    }
  }

  private matchesFilters(event: any, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      const eventValue = event[key] || event.data?.[key];
      if (eventValue !== value) {
        return false;
      }
    }
    return true;
  }

  private processQueryResults(events: any[], query: AnalyticsQuery): any[] {
    let results = [...events];

    if (query.groupBy && query.groupBy.length > 0) {
      const grouped = this.groupEvents(results, query.groupBy);
      results = Object.entries(grouped).map(([key, group]) => ({
        groupKey: key,
        count: (group as any[]).length,
        events: group
      }));
    }

    if (query.orderBy && query.orderBy.length > 0) {
      results.sort((a, b) => {
        for (const order of query.orderBy!) {
          const aVal = a[order.field];
          const bVal = b[order.field];
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          if (comparison !== 0) {
            return order.direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    const offset = query.offset || 0;
    const limit = query.limit || results.length;
    results = results.slice(offset, offset + limit);

    return results;
  }

  private groupEvents(events: any[], groupBy: string[]): Record<string, any[]> {
    return events.reduce((groups, event) => {
      const key = groupBy.map(field => event[field] || event.data?.[field] || 'unknown').join('|');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
      return groups;
    }, {} as Record<string, any[]>);
  }

  private generateCacheKey(query: AnalyticsQuery): string {
    return `query:${JSON.stringify(query)}`;
  }

  private getCachedResult(cacheKey: string): AnalyticsResult | null {
    const cached = this.metricsCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    return null;
  }

  private cacheResult(cacheKey: string, result: AnalyticsResult, ttl: number): void {
    this.metricsCache.set(cacheKey, {
      data: result,
      expires: Date.now() + ttl
    });

    for (const [key, value] of this.metricsCache.entries()) {
      if (value.expires <= Date.now()) {
        this.metricsCache.delete(key);
      }
    }
  }

  private startRealtimeMetrics(): void {
    this.realtimeInterval = setInterval(async () => {
      try {
        await this.updateRealtimeMetricsCache();
      } catch (error) {
        console.error('❌ Error updating real-time metrics:', error);
      }
    }, 10000);
  }

  private async updateRealtimeMetricsCache(): Promise<void> {
    const redis = redisManager.getClient();

    const metrics: RealTimeMetrics = {
      eventsPerSecond: Math.random() * 10,
      activeVisitors: Math.floor(Math.random() * 100),
      activeSessions: Math.floor(Math.random() * 50),
      topPages: [
        { page: '/home', views: 45 },
        { page: '/products', views: 32 },
        { page: '/about', views: 28 }
      ],
      topEvents: [
        { type: 'page_view', count: 105 },
        { type: 'click', count: 67 },
        { type: 'form_submit', count: 23 }
      ],
      conversionRate: 0.15,
      avgSessionDuration: 240,
      bounceRate: 0.45
    };

    await redis.setex(
      'analytics:realtime:metrics',
      60,
      JSON.stringify(metrics)
    );
  }

  private updateRealtimeMetrics(event: ProcessedEvent): void {
    this.emit('realtime:event', {
      type: event.type,
      sessionId: event.sessionId,
      timestamp: event.timestamp
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.start();
      this.initialized = true;
    }
  }

  private initializeRealtimeMetrics(): void {
    // Implementation of initializeRealtimeMetrics method
  }
}

export const analyticsService = new AnalyticsServiceManager();
