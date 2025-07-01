/**
 * Real-Time Data Service
 * Handles WebSocket connections, data transformation, throttling, and streaming
 * for real-time chart visualization with performance optimization.
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';

// Data stream interfaces
export interface DataStreamConfig {
  source: string;
  interval: number; // milliseconds
  batchSize?: number;
  transformations?: DataTransformation[];
  filters?: DataFilter[];
  compression?: boolean;
}

export interface DataTransformation {
  type: 'aggregate' | 'smooth' | 'normalize' | 'calculate';
  params: Record<string, any>;
}

export interface DataFilter {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'in' | 'contains';
  value: any;
}

export interface StreamingDataPoint {
  id: string;
  timestamp: number;
  source: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'data' | 'heartbeat' | 'error';
  payload?: any;
  timestamp?: number;
  clientId?: string;
}

export interface ClientSubscription {
  clientId: string;
  subscriptionId: string;
  chartId: string;
  filters: DataFilter[];
  transformations: DataTransformation[];
  isActive: boolean;
  lastUpdate: number;
}

// Mock data generators for different data types
export class MockDataGenerators {
  /**
   * Generate time series data (e.g., metrics, analytics)
   */
  public static generateTimeSeries(options: {
    baseValue?: number;
    volatility?: number;
    trend?: number;
    seasonality?: boolean;
  } = {}): number {
    const {
      baseValue = 100,
      volatility = 0.1,
      trend = 0,
      seasonality = false
    } = options;

    const now = Date.now();
    const randomComponent = (Math.random() - 0.5) * 2 * volatility * baseValue;
    const trendComponent = trend * (now % 3600000) / 3600000; // Hourly trend

    let seasonalComponent = 0;
    if (seasonality) {
      const hourlyPattern = Math.sin((now % 86400000) / 86400000 * 2 * Math.PI) * 0.2;
      seasonalComponent = hourlyPattern * baseValue;
    }

    return baseValue + randomComponent + trendComponent + seasonalComponent;
  }

  /**
   * Generate website analytics data
   */
  public static generateWebAnalytics(): Record<string, any> {
    return {
      pageViews: Math.floor(Math.random() * 1000) + 100,
      uniqueVisitors: Math.floor(Math.random() * 500) + 50,
      bounceRate: Math.random() * 0.3 + 0.2, // 20-50%
      avgSessionDuration: Math.random() * 300 + 120, // 2-7 minutes
      conversionRate: Math.random() * 0.05 + 0.01, // 1-6%
      revenue: Math.random() * 10000 + 1000,
      geography: {
        country: ['US', 'UK', 'DE', 'FR', 'CA'][Math.floor(Math.random() * 5)],
        city: 'Unknown'
      },
      device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
      source: ['organic', 'direct', 'social', 'paid', 'email'][Math.floor(Math.random() * 5)]
    };
  }

  /**
   * Generate A/B test data
   */
  public static generateABTestData(): Record<string, any> {
    const variants = ['A', 'B', 'C'];
    const variant = variants[Math.floor(Math.random() * variants.length)];

    return {
      variant,
      userId: `user_${Math.floor(Math.random() * 10000)}`,
      conversion: Math.random() < 0.15, // 15% conversion rate
      value: Math.random() * 100,
      segmentId: `segment_${Math.floor(Math.random() * 5)}`,
      experimentId: 'exp_001'
    };
  }

  /**
   * Generate system performance metrics
   */
  public static generateSystemMetrics(): Record<string, any> {
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: {
        incoming: Math.random() * 1000,
        outgoing: Math.random() * 800
      },
      activeConnections: Math.floor(Math.random() * 1000) + 100,
      errorRate: Math.random() * 0.05, // 0-5% error rate
      responseTime: Math.random() * 500 + 50 // 50-550ms
    };
  }
}

// Data transformation utilities
export class DataTransformationUtils {
  /**
   * Apply aggregation transformation
   */
  public static aggregate(
    data: StreamingDataPoint[],
    groupBy: string,
    aggregateField: string,
    operation: 'sum' | 'avg' | 'min' | 'max' | 'count'
  ): Record<string, number> {
    const groups: Record<string, number[]> = {};

    for (const point of data) {
      const groupKey = point.data[groupBy] || 'unknown';
      const value = Number(point.data[aggregateField]) || 0;

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(value);
    }

    const result: Record<string, number> = {};

    for (const [key, values] of Object.entries(groups)) {
      switch (operation) {
        case 'sum':
          result[key] = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          result[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
          break;
        case 'min':
          result[key] = Math.min(...values);
          break;
        case 'max':
          result[key] = Math.max(...values);
          break;
        case 'count':
          result[key] = values.length;
          break;
      }
    }

    return result;
  }

  /**
   * Apply smoothing transformation (moving average)
   */
  public static smooth(values: number[], windowSize: number = 5): number[] {
    if (values.length < windowSize) return values;

    const smoothed: number[] = [];

    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(values.length, start + windowSize);
      const window = values.slice(start, end);
      const average = window.reduce((sum, val) => sum + val, 0) / window.length;
      smoothed.push(average);
    }

    return smoothed;
  }

  /**
   * Normalize data to 0-1 range
   */
  public static normalize(values: number[]): number[] {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    if (range === 0) return values.map(() => 0);

    return values.map(val => (val - min) / range);
  }

  /**
   * Calculate derivative (rate of change)
   */
  public static calculateDerivative(values: number[], timestamps?: number[]): number[] {
    if (values.length < 2) return [];

    const derivatives: number[] = [];

    for (let i = 1; i < values.length; i++) {
      const deltaValue = values[i] - values[i - 1];
      const deltaTime = timestamps ? timestamps[i] - timestamps[i - 1] : 1;
      derivatives.push(deltaValue / deltaTime);
    }

    return derivatives;
  }
}

// Main real-time data service
export class RealTimeDataService extends EventEmitter {
  private static instance: RealTimeDataService | null = null;

  private wsServer: WebSocket.Server | null = null;
  private clients = new Map<string, WebSocket>();
  private subscriptions = new Map<string, ClientSubscription>();
  private dataStreams = new Map<string, NodeJS.Timeout>();
  private dataBuffer = new Map<string, StreamingDataPoint[]>();

  private config = {
    port: 8080,
    heartbeatInterval: 30000,
    maxBufferSize: 10000,
    compressionEnabled: true
  };

  // Singleton pattern
  public static getInstance(): RealTimeDataService {
    if (!RealTimeDataService.instance) {
      RealTimeDataService.instance = new RealTimeDataService();
    }
    return RealTimeDataService.instance;
  }

  /**
   * Initialize the WebSocket server
   */
  public async initialize(port: number = 8080): Promise<void> {
    try {
      this.config.port = port;
      this.wsServer = new WebSocket.Server({ port });

      this.wsServer.on('connection', (ws: WebSocket, request) => {
        this.handleClientConnection(ws, request);
      });

      // Start data streams
      this.startMockDataStreams();

      console.log(`Real-time data service started on port ${port}`);
      this.emit('service:started', { port });

    } catch (error) {
      console.error('Failed to initialize real-time data service:', error);
      throw error;
    }
  }

  /**
   * Handle new client connection
   */
  private handleClientConnection(ws: WebSocket, request: any): void {
    const clientId = this.generateClientId();
    this.clients.set(clientId, ws);

    console.log(`Client connected: ${clientId}`);

    // Send welcome message
    this.sendMessage(ws, {
      type: 'heartbeat',
      payload: { clientId, message: 'Connected to real-time data service' },
      timestamp: Date.now()
    });

    // Handle messages from client
    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleClientMessage(clientId, message);
      } catch (error) {
        console.error('Error parsing client message:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log(`Client disconnected: ${clientId}`);
      this.handleClientDisconnect(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`Client error (${clientId}):`, error);
      this.handleClientDisconnect(clientId);
    });

    this.emit('client:connected', { clientId });
  }

  /**
   * Handle messages from clients
   */
  private handleClientMessage(clientId: string, message: WebSocketMessage): void {
    const ws = this.clients.get(clientId);
    if (!ws) return;

    switch (message.type) {
      case 'subscribe':
        this.handleSubscription(clientId, message.payload);
        break;

      case 'unsubscribe':
        this.handleUnsubscription(clientId, message.payload);
        break;

      case 'heartbeat':
        this.sendMessage(ws, {
          type: 'heartbeat',
          timestamp: Date.now()
        });
        break;

      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle client subscription
   */
  private handleSubscription(clientId: string, payload: any): void {
    const subscription: ClientSubscription = {
      clientId,
      subscriptionId: payload.subscription.id,
      chartId: payload.subscription.chartId,
      filters: payload.subscription.filters || [],
      transformations: payload.subscription.transformations || [],
      isActive: true,
      lastUpdate: Date.now()
    };

    this.subscriptions.set(subscription.subscriptionId, subscription);

    console.log(`Client ${clientId} subscribed to ${subscription.chartId}`);
    this.emit('subscription:created', { subscription });
  }

  /**
   * Handle client unsubscription
   */
  private handleUnsubscription(clientId: string, payload: any): void {
    const subscriptionId = payload.subscriptionId;
    const subscription = this.subscriptions.get(subscriptionId);

    if (subscription && subscription.clientId === clientId) {
      this.subscriptions.delete(subscriptionId);
      console.log(`Client ${clientId} unsubscribed from ${subscriptionId}`);
      this.emit('subscription:removed', { subscriptionId });
    }
  }

  /**
   * Handle client disconnect
   */
  private handleClientDisconnect(clientId: string): void {
    this.clients.delete(clientId);

    // Remove client subscriptions
    for (const [id, subscription] of this.subscriptions.entries()) {
      if (subscription.clientId === clientId) {
        this.subscriptions.delete(id);
      }
    }

    this.emit('client:disconnected', { clientId });
  }

  /**
   * Start mock data streams for testing
   */
  private startMockDataStreams(): void {
    // Analytics stream
    this.startDataStream('analytics', 2000, () => {
      return {
        id: this.generateDataId(),
        timestamp: Date.now(),
        source: 'analytics',
        data: MockDataGenerators.generateWebAnalytics()
      };
    });

    // A/B testing stream
    this.startDataStream('ab-testing', 1500, () => {
      return {
        id: this.generateDataId(),
        timestamp: Date.now(),
        source: 'ab-testing',
        data: MockDataGenerators.generateABTestData()
      };
    });

    // System metrics stream
    this.startDataStream('system-metrics', 1000, () => {
      return {
        id: this.generateDataId(),
        timestamp: Date.now(),
        source: 'system-metrics',
        data: MockDataGenerators.generateSystemMetrics()
      };
    });

    // Time series stream
    this.startDataStream('time-series', 500, () => {
      return {
        id: this.generateDataId(),
        timestamp: Date.now(),
        source: 'time-series',
        data: {
          value: MockDataGenerators.generateTimeSeries({
            baseValue: 100,
            volatility: 0.2,
            trend: 0.1,
            seasonality: true
          })
        }
      };
    });
  }

  /**
   * Start a data stream
   */
  private startDataStream(
    streamId: string,
    interval: number,
    generator: () => StreamingDataPoint
  ): void {
    const timer = setInterval(() => {
      const dataPoint = generator();
      this.addToBuffer(streamId, dataPoint);
      this.broadcastToSubscribers(streamId, dataPoint);
    }, interval);

    this.dataStreams.set(streamId, timer);
    console.log(`Started data stream: ${streamId} (${interval}ms interval)`);
  }

  /**
   * Add data to buffer
   */
  private addToBuffer(streamId: string, dataPoint: StreamingDataPoint): void {
    if (!this.dataBuffer.has(streamId)) {
      this.dataBuffer.set(streamId, []);
    }

    const buffer = this.dataBuffer.get(streamId)!;
    buffer.push(dataPoint);

    // Maintain buffer size
    if (buffer.length > this.config.maxBufferSize) {
      const excess = buffer.length - this.config.maxBufferSize;
      buffer.splice(0, excess);
    }
  }

  /**
   * Broadcast data to subscribers
   */
  private broadcastToSubscribers(streamId: string, dataPoint: StreamingDataPoint): void {
    for (const subscription of this.subscriptions.values()) {
      if (!subscription.isActive) continue;

      // Check if subscription matches stream
      const chartMatches = this.checkChartMatch(subscription.chartId, streamId, dataPoint);
      if (!chartMatches) continue;

      // Apply filters
      if (!this.applyFilters(dataPoint, subscription.filters)) continue;

      // Apply transformations
      const transformedData = this.applyTransformations(dataPoint, subscription.transformations);

      // Send to client
      const client = this.clients.get(subscription.clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        this.sendMessage(client, {
          type: 'data',
          payload: {
            chartId: subscription.chartId,
            subscriptionId: subscription.subscriptionId,
            data: transformedData
          },
          timestamp: Date.now()
        });

        subscription.lastUpdate = Date.now();
      }
    }
  }

  /**
   * Check if chart subscription matches data stream
   */
  private checkChartMatch(chartId: string, streamId: string, dataPoint: StreamingDataPoint): boolean {
    // Simple matching based on chart ID and stream source
    return chartId.includes(streamId) || streamId.includes(chartId) ||
           dataPoint.source === streamId;
  }

  /**
   * Apply filters to data point
   */
  private applyFilters(dataPoint: StreamingDataPoint, filters: DataFilter[]): boolean {
    for (const filter of filters) {
      const fieldValue = dataPoint.data[filter.field];

      switch (filter.operator) {
        case 'gt':
          if (!(fieldValue > filter.value)) return false;
          break;
        case 'lt':
          if (!(fieldValue < filter.value)) return false;
          break;
        case 'eq':
          if (fieldValue !== filter.value) return false;
          break;
        case 'ne':
          if (fieldValue === filter.value) return false;
          break;
        case 'in':
          if (!Array.isArray(filter.value) || !filter.value.includes(fieldValue)) return false;
          break;
        case 'contains':
          if (typeof fieldValue !== 'string' || !fieldValue.includes(filter.value)) return false;
          break;
      }
    }

    return true;
  }

  /**
   * Apply transformations to data point
   */
  private applyTransformations(
    dataPoint: StreamingDataPoint,
    transformations: DataTransformation[]
  ): StreamingDataPoint {
    let result = { ...dataPoint };

    for (const transformation of transformations) {
      switch (transformation.type) {
        case 'normalize':
          // Apply normalization if applicable
          break;
        case 'calculate':
          // Apply calculations
          if (transformation.params.field && transformation.params.operation) {
            const value = result.data[transformation.params.field];
            if (typeof value === 'number') {
              switch (transformation.params.operation) {
                case 'multiply':
                  result.data[transformation.params.field] = value * transformation.params.factor;
                  break;
                case 'add':
                  result.data[transformation.params.field] = value + transformation.params.offset;
                  break;
              }
            }
          }
          break;
      }
    }

    return result;
  }

  /**
   * Send message to client
   */
  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message to client:', error);
    }
  }

  /**
   * Send error to client
   */
  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: 'error',
      payload: { error },
      timestamp: Date.now()
    });
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique data ID
   */
  private generateDataId(): string {
    return `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get service statistics
   */
  public getStats(): {
    connectedClients: number;
    activeSubscriptions: number;
    dataStreams: number;
    bufferSizes: Record<string, number>;
  } {
    const bufferSizes: Record<string, number> = {};
    for (const [streamId, buffer] of this.dataBuffer.entries()) {
      bufferSizes[streamId] = buffer.length;
    }

    return {
      connectedClients: this.clients.size,
      activeSubscriptions: this.subscriptions.size,
      dataStreams: this.dataStreams.size,
      bufferSizes
    };
  }

  /**
   * Shutdown the service
   */
  public shutdown(): void {
    // Clear all data streams
    for (const timer of this.dataStreams.values()) {
      clearInterval(timer);
    }
    this.dataStreams.clear();

    // Close all client connections
    for (const ws of this.clients.values()) {
      ws.close();
    }
    this.clients.clear();

    // Close WebSocket server
    if (this.wsServer) {
      this.wsServer.close();
      this.wsServer = null;
    }

    // Clear data
    this.subscriptions.clear();
    this.dataBuffer.clear();

    console.log('Real-time data service shut down');
    this.emit('service:shutdown');
  }
}

// Export singleton instance
export const realTimeDataService = RealTimeDataService.getInstance();
