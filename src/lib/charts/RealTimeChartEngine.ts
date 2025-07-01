/**
 * Real-Time Chart Engine
 * Provides real-time data streaming, WebSocket integration, efficient chart updates,
 * data throttling, and performance optimization for live analytics dashboards.
 */

import { EventEmitter } from 'events';

// Core interfaces for real-time data streaming
export interface RealTimeDataPoint {
  timestamp: number;
  value: number | string;
  metadata?: Record<string, any>;
  category?: string;
  series?: string;
}

export interface RealTimeStreamConfig {
  maxDataPoints: number;
  updateInterval: number; // milliseconds
  throttleDelay: number; // milliseconds
  bufferSize: number;
  aggregationWindow?: number; // milliseconds
  autoScale?: boolean;
  compression?: boolean;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  authentication?: {
    token?: string;
    headers?: Record<string, string>;
  };
}

export interface ChartSubscription {
  id: string;
  chartId: string;
  dataTypes: string[];
  filters?: Record<string, any>;
  transform?: (data: RealTimeDataPoint) => RealTimeDataPoint;
}

export interface PerformanceMetrics {
  updateRate: number; // updates per second
  averageLatency: number; // milliseconds
  bufferUtilization: number; // percentage
  droppedFrames: number;
  memoryUsage: number; // MB
  lastUpdate: number;
}

export interface DataBuffer {
  data: RealTimeDataPoint[];
  maxSize: number;
  overflow: boolean;
}

// Real-time chart engine with advanced streaming capabilities
export class RealTimeChartEngine extends EventEmitter {
  private static instance: RealTimeChartEngine | null = null;

  private wsConnection: WebSocket | null = null;
  private wsConfig: WebSocketConfig | null = null;
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  private charts = new Map<string, RealTimeStreamConfig>();
  private subscriptions = new Map<string, ChartSubscription>();
  private dataBuffers = new Map<string, DataBuffer>();
  private updateTimers = new Map<string, NodeJS.Timeout>();

  private performanceMetrics: PerformanceMetrics = {
    updateRate: 0,
    averageLatency: 0,
    bufferUtilization: 0,
    droppedFrames: 0,
    memoryUsage: 0,
    lastUpdate: Date.now()
  };

  private isActive = false;
  private metricsTimer: NodeJS.Timeout | null = null;
  private compressionEnabled = false;

  // Singleton pattern
  public static getInstance(): RealTimeChartEngine {
    if (!RealTimeChartEngine.instance) {
      RealTimeChartEngine.instance = new RealTimeChartEngine();
    }
    return RealTimeChartEngine.instance;
  }

  constructor() {
    super();
    this.setMaxListeners(100); // Support many chart subscriptions
  }

  /**
   * Initialize the real-time chart engine with WebSocket configuration
   */
  public async initialize(wsConfig: WebSocketConfig): Promise<void> {
    try {
      this.wsConfig = wsConfig;
      await this.connectWebSocket();
      this.startPerformanceMonitoring();
      this.isActive = true;

      this.emit('engine:initialized', { success: true });
    } catch (error) {
      this.emit('engine:error', { error: error.message, type: 'initialization' });
      throw error;
    }
  }

  /**
   * Register a chart for real-time updates
   */
  public registerChart(chartId: string, config: RealTimeStreamConfig): void {
    this.charts.set(chartId, config);
    this.dataBuffers.set(chartId, {
      data: [],
      maxSize: config.maxDataPoints,
      overflow: false
    });

    // Set up throttled update timer
    if (this.updateTimers.has(chartId)) {
      clearInterval(this.updateTimers.get(chartId)!);
    }

    const timer = setInterval(() => {
      this.processBufferedData(chartId);
    }, config.updateInterval);

    this.updateTimers.set(chartId, timer);

    this.emit('chart:registered', { chartId, config });
  }

  /**
   * Subscribe to real-time data for a specific chart
   */
  public subscribe(subscription: ChartSubscription): void {
    this.subscriptions.set(subscription.id, subscription);

    // Send subscription message via WebSocket
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'subscribe',
        subscription
      }));
    }

    this.emit('subscription:created', { subscription });
  }

  /**
   * Unsubscribe from real-time data
   */
  public unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.subscriptions.delete(subscriptionId);

      // Send unsubscribe message via WebSocket
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          type: 'unsubscribe',
          subscriptionId
        }));
      }

      this.emit('subscription:removed', { subscriptionId });
    }
  }

  /**
   * Manually add data point (for testing or alternative data sources)
   */
  public addDataPoint(chartId: string, dataPoint: RealTimeDataPoint): void {
    const buffer = this.dataBuffers.get(chartId);
    if (!buffer) {
      console.warn(`Chart ${chartId} not registered`);
      return;
    }

    // Apply timestamp if not provided
    if (!dataPoint.timestamp) {
      dataPoint.timestamp = Date.now();
    }

    // Add to buffer
    this.addToBuffer(chartId, dataPoint);
  }

  /**
   * Get current data for a chart
   */
  public getChartData(chartId: string): RealTimeDataPoint[] {
    const buffer = this.dataBuffers.get(chartId);
    return buffer ? [...buffer.data] : [];
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Enable/disable data compression
   */
  public setCompressionEnabled(enabled: boolean): void {
    this.compressionEnabled = enabled;
    this.emit('compression:toggled', { enabled });
  }

  /**
   * Clear all data for a chart
   */
  public clearChartData(chartId: string): void {
    const buffer = this.dataBuffers.get(chartId);
    if (buffer) {
      buffer.data = [];
      buffer.overflow = false;
      this.emit('chart:cleared', { chartId });
    }
  }

  /**
   * Destroy chart and clean up resources
   */
  public destroyChart(chartId: string): void {
    // Clear timers
    const timer = this.updateTimers.get(chartId);
    if (timer) {
      clearInterval(timer);
      this.updateTimers.delete(chartId);
    }

    // Clean up data
    this.charts.delete(chartId);
    this.dataBuffers.delete(chartId);

    // Remove related subscriptions
    for (const [id, subscription] of this.subscriptions.entries()) {
      if (subscription.chartId === chartId) {
        this.unsubscribe(id);
      }
    }

    this.emit('chart:destroyed', { chartId });
  }

  /**
   * Shutdown the engine and clean up all resources
   */
  public shutdown(): void {
    this.isActive = false;

    // Clear all timers
    for (const timer of this.updateTimers.values()) {
      clearInterval(timer);
    }
    this.updateTimers.clear();

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Close WebSocket connection
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }

    // Clear all data
    this.charts.clear();
    this.subscriptions.clear();
    this.dataBuffers.clear();

    this.emit('engine:shutdown');
  }

  // Private methods

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.wsConfig) {
        reject(new Error('WebSocket configuration not provided'));
        return;
      }

      try {
        this.wsConnection = new WebSocket(this.wsConfig.url);

        this.wsConnection.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('websocket:connected');
          resolve();
        };

        this.wsConnection.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };

        this.wsConnection.onclose = () => {
          console.log('WebSocket disconnected');
          this.emit('websocket:disconnected');
          this.attemptReconnect();
        };

        this.wsConnection.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('websocket:error', { error });
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'data':
          this.handleDataMessage(message);
          break;
        case 'heartbeat':
          this.handleHeartbeat();
          break;
        case 'error':
          this.emit('websocket:message_error', message);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.performanceMetrics.droppedFrames++;
    }
  }

  private handleDataMessage(message: any): void {
    const { chartId, data, subscriptionId } = message;

    if (!chartId || !data) {
      console.warn('Invalid data message format');
      return;
    }

    // Apply transformation if subscription has one
    let processedData = data;
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription && subscription.transform) {
      processedData = subscription.transform(data);
    }

    // Add to buffer
    this.addToBuffer(chartId, processedData);
  }

  private addToBuffer(chartId: string, dataPoint: RealTimeDataPoint): void {
    const buffer = this.dataBuffers.get(chartId);
    const config = this.charts.get(chartId);

    if (!buffer || !config) {
      return;
    }

    // Add to buffer
    buffer.data.push(dataPoint);

    // Check buffer size and maintain max points
    if (buffer.data.length > buffer.maxSize) {
      const excess = buffer.data.length - buffer.maxSize;
      buffer.data.splice(0, excess);
      buffer.overflow = true;
    }

    // Update performance metrics
    this.updatePerformanceMetrics();
  }

  private processBufferedData(chartId: string): void {
    const buffer = this.dataBuffers.get(chartId);
    const config = this.charts.get(chartId);

    if (!buffer || !config || buffer.data.length === 0) {
      return;
    }

    // Apply data compression if enabled
    let processedData = buffer.data;
    if (this.compressionEnabled && config.compression) {
      processedData = this.compressData(buffer.data, config);
    }

    // Apply aggregation if configured
    if (config.aggregationWindow) {
      processedData = this.aggregateData(processedData, config.aggregationWindow);
    }

    // Emit chart update
    this.emit('chart:update', {
      chartId,
      data: processedData,
      metadata: {
        bufferSize: buffer.data.length,
        overflow: buffer.overflow,
        timestamp: Date.now()
      }
    });
  }

  private compressData(data: RealTimeDataPoint[], config: RealTimeStreamConfig): RealTimeDataPoint[] {
    // Simple compression: remove duplicate consecutive values
    if (data.length <= 1) return data;

    const compressed: RealTimeDataPoint[] = [data[0]];

    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];

      // Keep point if value changed significantly or time gap is large
      const valueChanged = current.value !== previous.value;
      const timeGap = current.timestamp - previous.timestamp > config.updateInterval * 2;

      if (valueChanged || timeGap) {
        compressed.push(current);
      }
    }

    return compressed;
  }

  private aggregateData(data: RealTimeDataPoint[], windowMs: number): RealTimeDataPoint[] {
    if (data.length === 0) return data;

    const aggregated: RealTimeDataPoint[] = [];
    const now = Date.now();
    const windowStart = now - windowMs;

    // Group data by time windows
    const windows = new Map<number, RealTimeDataPoint[]>();

    for (const point of data) {
      if (point.timestamp >= windowStart) {
        const windowKey = Math.floor(point.timestamp / windowMs) * windowMs;
        if (!windows.has(windowKey)) {
          windows.set(windowKey, []);
        }
        windows.get(windowKey)!.push(point);
      }
    }

    // Aggregate each window
    for (const [windowKey, points] of windows.entries()) {
      if (points.length === 0) continue;

      const numericValues = points
        .map(p => p.value)
        .filter(v => typeof v === 'number') as number[];

      if (numericValues.length > 0) {
        const avgValue = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;

        aggregated.push({
          timestamp: windowKey,
          value: avgValue,
          metadata: {
            aggregated: true,
            pointCount: points.length,
            originalValues: numericValues
          }
        });
      }
    }

    return aggregated;
  }

  private attemptReconnect(): void {
    if (!this.wsConfig || !this.isActive) return;

    const maxAttempts = this.wsConfig.maxReconnectAttempts || 5;
    const interval = this.wsConfig.reconnectInterval || 5000;

    if (this.reconnectAttempts < maxAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${maxAttempts})...`);

      setTimeout(() => {
        this.connectWebSocket().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, interval);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('websocket:max_reconnect_attempts');
    }
  }

  private startHeartbeat(): void {
    if (!this.wsConfig) return;

    const interval = this.wsConfig.heartbeatInterval || 30000;

    this.heartbeatTimer = setInterval(() => {
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, interval);
  }

  private handleHeartbeat(): void {
    // Heartbeat received, connection is alive
    this.emit('websocket:heartbeat');
  }

  private startPerformanceMonitoring(): void {
    this.metricsTimer = setInterval(() => {
      this.calculatePerformanceMetrics();
    }, 1000); // Update metrics every second
  }

  private calculatePerformanceMetrics(): void {
    const now = Date.now();
    const timeDelta = now - this.performanceMetrics.lastUpdate;

    // Calculate buffer utilization
    let totalBufferUsage = 0;
    let totalBufferCapacity = 0;

    for (const [chartId, buffer] of this.dataBuffers.entries()) {
      const config = this.charts.get(chartId);
      if (config) {
        totalBufferUsage += buffer.data.length;
        totalBufferCapacity += config.maxDataPoints;
      }
    }

    this.performanceMetrics.bufferUtilization =
      totalBufferCapacity > 0 ? (totalBufferUsage / totalBufferCapacity) * 100 : 0;

    // Estimate memory usage (rough calculation)
    this.performanceMetrics.memoryUsage = this.estimateMemoryUsage();

    this.performanceMetrics.lastUpdate = now;

    // Emit metrics update
    this.emit('metrics:update', this.performanceMetrics);
  }

  private updatePerformanceMetrics(): void {
    const now = Date.now();
    const timeDelta = now - this.performanceMetrics.lastUpdate;

    if (timeDelta > 0) {
      // Update rate calculation (simplified)
      this.performanceMetrics.updateRate = 1000 / timeDelta;
    }
  }

  private estimateMemoryUsage(): number {
    let totalPoints = 0;
    for (const buffer of this.dataBuffers.values()) {
      totalPoints += buffer.data.length;
    }

    // Rough estimate: ~100 bytes per data point
    return (totalPoints * 100) / (1024 * 1024); // Convert to MB
  }
}

// Utility functions for real-time data handling
export class RealTimeDataUtils {
  /**
   * Create a mock data stream for testing
   */
  public static createMockDataStream(
    chartId: string,
    interval: number = 1000,
    engine: RealTimeChartEngine
  ): () => void {
    const intervalId = setInterval(() => {
      const dataPoint: RealTimeDataPoint = {
        timestamp: Date.now(),
        value: Math.random() * 100,
        metadata: {
          source: 'mock',
          chartId
        }
      };

      engine.addDataPoint(chartId, dataPoint);
    }, interval);

    return () => clearInterval(intervalId);
  }

  /**
   * Format data for specific chart types
   */
  public static formatForChartType(
    data: RealTimeDataPoint[],
    chartType: 'line' | 'bar' | 'area' | 'scatter'
  ): any[] {
    switch (chartType) {
      case 'line':
      case 'area':
        return data.map(point => ({
          x: point.timestamp,
          y: point.value,
          timestamp: point.timestamp
        }));

      case 'bar':
        return data.map((point, index) => ({
          name: point.category || `Point ${index}`,
          value: point.value,
          timestamp: point.timestamp
        }));

      case 'scatter':
        return data.map(point => ({
          x: point.timestamp,
          y: point.value,
          size: point.metadata?.size || 5
        }));

      default:
        return data;
    }
  }

  /**
   * Calculate data trends in real-time
   */
  public static calculateTrend(data: RealTimeDataPoint[]): {
    direction: 'up' | 'down' | 'stable';
    strength: number;
    change: number;
  } {
    if (data.length < 2) {
      return { direction: 'stable', strength: 0, change: 0 };
    }

    const recent = data.slice(-10); // Last 10 points
    const numericValues = recent
      .map(p => p.value)
      .filter(v => typeof v === 'number') as number[];

    if (numericValues.length < 2) {
      return { direction: 'stable', strength: 0, change: 0 };
    }

    const first = numericValues[0];
    const last = numericValues[numericValues.length - 1];
    const change = last - first;
    const changePercent = Math.abs(change / first) * 100;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(change) > 0.01) { // Threshold for stability
      direction = change > 0 ? 'up' : 'down';
    }

    return {
      direction,
      strength: changePercent,
      change
    };
  }
}

// Export singleton instance
export const realTimeChartEngine = RealTimeChartEngine.getInstance();
