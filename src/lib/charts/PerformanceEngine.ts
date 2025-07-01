/**
 * Performance Engine
 * Comprehensive performance optimization system for handling large datasets with
 * virtualization, progressive loading, memory management, and real-time monitoring.
 */

import { EventEmitter } from 'events';

// Performance metrics and monitoring
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  dataProcessingTime: number;
  virtualizedItems: number;
  cacheHitRate: number;
  frameRate: number;
  loadTime: number;
  gcCollections: number;
  timestamp: number;
}

// Virtualization configuration
export interface VirtualizationConfig {
  enabled: boolean;
  itemHeight: number;
  bufferSize: number;
  overscan: number;
  dynamicHeight: boolean;
  estimatedItemHeight: number;
  scrollThreshold: number;
  chunkSize: number;
}

// Progressive loading configuration
export interface ProgressiveLoadingConfig {
  enabled: boolean;
  chunkSize: number;
  loadDelay: number;
  priorityLevels: number;
  loadingStrategy: 'lazy' | 'eager' | 'adaptive';
  retryAttempts: number;
  timeoutMs: number;
}

// Memory management configuration
export interface MemoryConfig {
  maxCacheSize: number;
  maxDataPoints: number;
  gcThreshold: number;
  compressionEnabled: boolean;
  autoCleanup: boolean;
  memoryLimit: number;
}

// Data chunk for virtualization
export interface DataChunk {
  id: string;
  startIndex: number;
  endIndex: number;
  data: any[];
  loadState: 'idle' | 'loading' | 'loaded' | 'error';
  priority: number;
  timestamp: number;
  size: number;
}

// Cache entry
export interface CacheEntry {
  key: string;
  data: any;
  size: number;
  accessCount: number;
  lastAccessed: number;
  createdAt: number;
  expiresAt?: number;
}

// Performance optimization strategies
export interface OptimizationStrategy {
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  priority: number;
}

// Performance configuration
export interface PerformanceConfig {
  virtualization: VirtualizationConfig;
  progressiveLoading: ProgressiveLoadingConfig;
  memory: MemoryConfig;
  strategies: OptimizationStrategy[];
  monitoring: {
    enabled: boolean;
    interval: number;
    historySize: number;
    alertThresholds: {
      memoryUsage: number;
      renderTime: number;
      frameRate: number;
    };
  };
}

// Data provider interface for virtualization
export interface VirtualDataProvider {
  getItemCount(): number;
  getItem(index: number): any;
  getItems(startIndex: number, endIndex: number): Promise<any[]>;
  estimateItemSize(index: number): number;
  invalidateCache(): void;
}

// Performance worker for heavy computations
export interface PerformanceWorker {
  id: string;
  postMessage(data: any): void;
  onMessage(callback: (data: any) => void): void;
  terminate(): void;
}

/**
 * Main Performance Engine Class
 */
export class PerformanceEngine extends EventEmitter {
  private static _instance: PerformanceEngine;
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics[] = [];
  private cache = new Map<string, CacheEntry>();
  private dataChunks = new Map<string, DataChunk>();
  private observers = new Map<string, PerformanceObserver>();
  private workers = new Map<string, PerformanceWorker>();
  private isMonitoring = false;
  private memoryUsageHistory: number[] = [];
  private renderTimeHistory: number[] = [];
  private frameRateMonitor: number | null = null;

  private constructor(config?: Partial<PerformanceConfig>) {
    super();
    this.setMaxListeners(50);

    this.config = {
      virtualization: {
        enabled: true,
        itemHeight: 50,
        bufferSize: 5,
        overscan: 3,
        dynamicHeight: false,
        estimatedItemHeight: 50,
        scrollThreshold: 100,
        chunkSize: 1000
      },
      progressiveLoading: {
        enabled: true,
        chunkSize: 1000,
        loadDelay: 50,
        priorityLevels: 3,
        loadingStrategy: 'adaptive',
        retryAttempts: 3,
        timeoutMs: 10000
      },
      memory: {
        maxCacheSize: 100 * 1024 * 1024, // 100MB
        maxDataPoints: 1000000,
        gcThreshold: 0.8,
        compressionEnabled: true,
        autoCleanup: true,
        memoryLimit: 500 * 1024 * 1024 // 500MB
      },
      strategies: [
        { name: 'webgl-acceleration', enabled: true, config: {}, priority: 1 },
        { name: 'data-sampling', enabled: true, config: { maxPoints: 10000 }, priority: 2 },
        { name: 'level-of-detail', enabled: true, config: { levels: 3 }, priority: 3 },
        { name: 'canvas-pooling', enabled: true, config: { poolSize: 10 }, priority: 4 }
      ],
      monitoring: {
        enabled: true,
        interval: 1000,
        historySize: 100,
        alertThresholds: {
          memoryUsage: 0.8,
          renderTime: 16.67, // 60fps threshold
          frameRate: 30
        }
      },
      ...config
    };

    this.initialize();
  }

  public static getInstance(config?: Partial<PerformanceConfig>): PerformanceEngine {
    if (!PerformanceEngine._instance) {
      PerformanceEngine._instance = new PerformanceEngine(config);
    }
    return PerformanceEngine._instance;
  }

  private initialize(): void {
    this.setupPerformanceMonitoring();
    this.setupMemoryManagement();
    this.setupWorkers();
    this.emit('engine:initialized');
  }

  /**
   * Data Virtualization
   */
  public createVirtualDataProvider(dataSource: any[], config?: Partial<VirtualizationConfig>): VirtualDataProvider {
    const virtualConfig = { ...this.config.virtualization, ...config };

    return {
      getItemCount: () => dataSource.length,

      getItem: (index: number) => {
        if (index < 0 || index >= dataSource.length) {
          return null;
        }
        return dataSource[index];
      },

      getItems: async (startIndex: number, endIndex: number) => {
        const start = Math.max(0, startIndex);
        const end = Math.min(dataSource.length, endIndex);

        // Create chunk key for caching
        const chunkKey = `chunk_${start}_${end}`;

        // Check cache first
        const cached = this.getCacheEntry(chunkKey);
        if (cached) {
          return cached.data;
        }

        // Load data chunk
        const chunk = dataSource.slice(start, end);

        // Cache the chunk
        this.setCacheEntry(chunkKey, chunk, this.estimateDataSize(chunk));

        return chunk;
      },

      estimateItemSize: (index: number) => {
        return virtualConfig.estimatedItemHeight;
      },

      invalidateCache: () => {
        this.clearCache();
      }
    };
  }

  public virtualizeData(
    data: any[],
    viewport: { start: number; end: number; height: number },
    config?: Partial<VirtualizationConfig>
  ): { items: any[]; totalHeight: number; startIndex: number; endIndex: number } {
    if (!this.config.virtualization.enabled) {
      return {
        items: data,
        totalHeight: data.length * this.config.virtualization.itemHeight,
        startIndex: 0,
        endIndex: data.length - 1
      };
    }

    const virtualConfig = { ...this.config.virtualization, ...config };
    const itemHeight = virtualConfig.itemHeight;
    const overscan = virtualConfig.overscan;
    const bufferSize = virtualConfig.bufferSize;

    // Calculate visible range
    const startIndex = Math.max(0, Math.floor(viewport.start / itemHeight) - overscan);
    const endIndex = Math.min(
      data.length - 1,
      Math.ceil((viewport.start + viewport.height) / itemHeight) + overscan
    );

    // Add buffer
    const bufferedStart = Math.max(0, startIndex - bufferSize);
    const bufferedEnd = Math.min(data.length - 1, endIndex + bufferSize);

    // Extract visible items
    const items = data.slice(bufferedStart, bufferedEnd + 1);

    return {
      items,
      totalHeight: data.length * itemHeight,
      startIndex: bufferedStart,
      endIndex: bufferedEnd
    };
  }

  /**
   * Progressive Loading
   */
  public async loadDataProgressively(
    dataProvider: () => Promise<any[]>,
    config?: Partial<ProgressiveLoadingConfig>
  ): Promise<any[]> {
    const loadingConfig = { ...this.config.progressiveLoading, ...config };
    const allData: any[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const startTime = performance.now();

        // Load chunk
        const chunk = await this.loadDataChunk(dataProvider, offset, loadingConfig.chunkSize);

        if (chunk.length === 0) {
          hasMore = false;
          break;
        }

        allData.push(...chunk);
        offset += chunk.length;

        // Update metrics
        const loadTime = performance.now() - startTime;
        this.updateMetrics({ dataProcessingTime: loadTime });

        // Emit progress
        this.emit('data:progress', {
          loaded: allData.length,
          total: null, // Unknown total for progressive loading
          percentage: null
        });

        // Delay between chunks to prevent blocking
        if (loadingConfig.loadDelay > 0) {
          await this.delay(loadingConfig.loadDelay);
        }

        // Check if we've hit the chunk size (indicating more data available)
        if (chunk.length < loadingConfig.chunkSize) {
          hasMore = false;
        }

      } catch (error) {
        this.emit('data:error', { error, offset });
        break;
      }
    }

    return allData;
  }

  private async loadDataChunk(
    dataProvider: () => Promise<any[]>,
    offset: number,
    chunkSize: number
  ): Promise<any[]> {
    const chunkId = `chunk_${offset}_${chunkSize}`;

    // Check if chunk is already loading or loaded
    const existingChunk = this.dataChunks.get(chunkId);
    if (existingChunk) {
      if (existingChunk.loadState === 'loaded') {
        return existingChunk.data;
      }
      if (existingChunk.loadState === 'loading') {
        // Wait for loading to complete
        return new Promise((resolve, reject) => {
          const checkState = () => {
            const chunk = this.dataChunks.get(chunkId);
            if (chunk?.loadState === 'loaded') {
              resolve(chunk.data);
            } else if (chunk?.loadState === 'error') {
              reject(new Error('Chunk loading failed'));
            } else {
              setTimeout(checkState, 100);
            }
          };
          checkState();
        });
      }
    }

    // Create new chunk entry
    const chunk: DataChunk = {
      id: chunkId,
      startIndex: offset,
      endIndex: offset + chunkSize - 1,
      data: [],
      loadState: 'loading',
      priority: 1,
      timestamp: Date.now(),
      size: 0
    };

    this.dataChunks.set(chunkId, chunk);

    try {
      const data = await dataProvider();
      const chunkData = data.slice(offset, offset + chunkSize);

      chunk.data = chunkData;
      chunk.loadState = 'loaded';
      chunk.size = this.estimateDataSize(chunkData);

      return chunkData;
    } catch (error) {
      chunk.loadState = 'error';
      throw error;
    }
  }

  /**
   * Memory Management
   */
  public manageMemory(): void {
    const memoryUsage = this.getCurrentMemoryUsage();
    const threshold = this.config.memory.gcThreshold;

    if (memoryUsage > threshold) {
      this.performGarbageCollection();
    }

    // Clean up old cache entries
    this.cleanupCache();

    // Clean up old data chunks
    this.cleanupDataChunks();

    this.emit('memory:managed', { memoryUsage, threshold });
  }

  private performGarbageCollection(): void {
    const before = this.getCurrentMemoryUsage();

    // Clear least recently used cache entries
    this.evictLRUCacheEntries(0.3); // Remove 30% of cache

    // Clear old data chunks
    this.clearOldDataChunks();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const after = this.getCurrentMemoryUsage();
    const freed = before - after;

    this.emit('memory:gc', { before, after, freed });
  }

  private evictLRUCacheEntries(percentage: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    const toRemove = Math.floor(entries.length * percentage);

    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  private clearOldDataChunks(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [key, chunk] of this.dataChunks) {
      if (now - chunk.timestamp > maxAge) {
        this.dataChunks.delete(key);
      }
    }
  }

  /**
   * Performance Monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (!this.config.monitoring.enabled) return;

    // Start frame rate monitoring
    this.startFrameRateMonitoring();

    // Start memory monitoring
    setInterval(() => {
      this.collectMetrics();
    }, this.config.monitoring.interval);

    // Setup performance observers
    this.setupPerformanceObservers();
  }

  private startFrameRateMonitoring(): void {
    let lastTime = performance.now();
    let frameCount = 0;

    const measureFrameRate = () => {
      const now = performance.now();
      frameCount++;

      if (now - lastTime >= 1000) {
        const fps = (frameCount * 1000) / (now - lastTime);
        this.updateMetrics({ frameRate: fps });

        frameCount = 0;
        lastTime = now;
      }

      this.frameRateMonitor = requestAnimationFrame(measureFrameRate);
    };

    this.frameRateMonitor = requestAnimationFrame(measureFrameRate);
  }

  private collectMetrics(): void {
    const metrics: PerformanceMetrics = {
      renderTime: this.getAverageRenderTime(),
      memoryUsage: this.getCurrentMemoryUsage(),
      dataProcessingTime: this.getAverageDataProcessingTime(),
      virtualizedItems: this.getVirtualizedItemCount(),
      cacheHitRate: this.getCacheHitRate(),
      frameRate: this.getCurrentFrameRate(),
      loadTime: this.getAverageLoadTime(),
      gcCollections: this.getGCCollectionCount(),
      timestamp: Date.now()
    };

    this.metrics.push(metrics);

    // Keep only recent metrics
    if (this.metrics.length > this.config.monitoring.historySize) {
      this.metrics.shift();
    }

    // Check alert thresholds
    this.checkAlertThresholds(metrics);

    this.emit('metrics:collected', metrics);
  }

  private checkAlertThresholds(metrics: PerformanceMetrics): void {
    const thresholds = this.config.monitoring.alertThresholds;

    if (metrics.memoryUsage > thresholds.memoryUsage) {
      this.emit('alert:memory', { current: metrics.memoryUsage, threshold: thresholds.memoryUsage });
    }

    if (metrics.renderTime > thresholds.renderTime) {
      this.emit('alert:render-time', { current: metrics.renderTime, threshold: thresholds.renderTime });
    }

    if (metrics.frameRate < thresholds.frameRate) {
      this.emit('alert:frame-rate', { current: metrics.frameRate, threshold: thresholds.frameRate });
    }
  }

  /**
   * Caching System
   */
  public setCacheEntry(key: string, data: any, size: number, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry = {
      key,
      data,
      size,
      accessCount: 1,
      lastAccessed: now,
      createdAt: now,
      expiresAt: ttl ? now + ttl : undefined
    };

    this.cache.set(key, entry);

    // Check cache size limit
    this.enforceCacheLimit();
  }

  public getCacheEntry(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry;
  }

  private enforceCacheLimit(): void {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);

    if (totalSize > this.config.memory.maxCacheSize) {
      this.evictLRUCacheEntries(0.2); // Remove 20% of cache
    }
  }

  private cleanupCache(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Optimization Strategies
   */
  public applyOptimizations(data: any[], chartType: string): any[] {
    let optimizedData = data;

    for (const strategy of this.config.strategies.filter(s => s.enabled)) {
      optimizedData = this.applyStrategy(optimizedData, strategy, chartType);
    }

    return optimizedData;
  }

  private applyStrategy(data: any[], strategy: OptimizationStrategy, chartType: string): any[] {
    switch (strategy.name) {
      case 'data-sampling':
        return this.applySampling(data, strategy.config);

      case 'level-of-detail':
        return this.applyLevelOfDetail(data, strategy.config);

      default:
        return data;
    }
  }

  private applySampling(data: any[], config: any): any[] {
    const maxPoints = config.maxPoints || 10000;

    if (data.length <= maxPoints) {
      return data;
    }

    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, index) => index % step === 0);
  }

  private applyLevelOfDetail(data: any[], config: any): any[] {
    // Implement level-of-detail reduction
    // This is a simplified version - in practice, you'd implement more sophisticated LOD
    const levels = config.levels || 3;
    const targetSize = Math.floor(data.length / levels);

    if (data.length <= targetSize) {
      return data;
    }

    const step = Math.ceil(data.length / targetSize);
    return data.filter((_, index) => index % step === 0);
  }

  /**
   * Worker Management
   */
  private setupWorkers(): void {
    // Setup web workers for heavy computations
    if (typeof Worker !== 'undefined') {
      this.createPerformanceWorker('data-processing');
      this.createPerformanceWorker('virtualization');
    }
  }

  private createPerformanceWorker(type: string): void {
    if (typeof Worker === 'undefined') return;

    try {
      const workerCode = this.generateWorkerCode(type);
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl) as any;

      const performanceWorker: PerformanceWorker = {
        id: type,
        postMessage: (data: any) => worker.postMessage(data),
        onMessage: (callback: (data: any) => void) => {
          worker.onmessage = (event: MessageEvent) => callback(event.data);
        },
        terminate: () => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
        }
      };

      this.workers.set(type, performanceWorker);
    } catch (error) {
      console.warn(`Failed to create worker for ${type}:`, error);
    }
  }

  private generateWorkerCode(type: string): string {
    switch (type) {
      case 'data-processing':
        return `
          self.onmessage = function(e) {
            const { data, operation } = e.data;

            switch (operation) {
              case 'sample':
                const sampled = data.filter((_, i) => i % e.data.step === 0);
                self.postMessage({ result: sampled, operation });
                break;

              case 'aggregate':
                // Implement data aggregation
                const aggregated = data.reduce((acc, item, i) => {
                  const chunkIndex = Math.floor(i / e.data.chunkSize);
                  if (!acc[chunkIndex]) acc[chunkIndex] = [];
                  acc[chunkIndex].push(item);
                  return acc;
                }, []);
                self.postMessage({ result: aggregated, operation });
                break;
            }
          };
        `;

      case 'virtualization':
        return `
          self.onmessage = function(e) {
            const { data, viewport, itemHeight } = e.data;

            const startIndex = Math.floor(viewport.start / itemHeight);
            const endIndex = Math.ceil((viewport.start + viewport.height) / itemHeight);

            const visibleData = data.slice(startIndex, endIndex);

            self.postMessage({
              result: visibleData,
              startIndex,
              endIndex,
              operation: 'virtualize'
            });
          };
        `;

      default:
        return 'self.onmessage = function(e) { self.postMessage(e.data); };';
    }
  }

  /**
   * Utility Methods
   */
  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / (performance as any).memory.totalJSHeapSize;
    }
    return 0;
  }

  private estimateDataSize(data: any): number {
    // Rough estimation of data size in bytes
    return JSON.stringify(data).length * 2; // UTF-16 encoding
  }

  private getAverageRenderTime(): number {
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length === 0) return 0;
    return recentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / recentMetrics.length;
  }

  private getAverageDataProcessingTime(): number {
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length === 0) return 0;
    return recentMetrics.reduce((sum, m) => sum + m.dataProcessingTime, 0) / recentMetrics.length;
  }

  private getVirtualizedItemCount(): number {
    return Array.from(this.dataChunks.values())
      .filter(chunk => chunk.loadState === 'loaded')
      .reduce((sum, chunk) => sum + chunk.data.length, 0);
  }

  private getCacheHitRate(): number {
    // Implementation would track cache hits/misses
    return 0.85; // Placeholder
  }

  private getCurrentFrameRate(): number {
    const recentMetrics = this.metrics.slice(-5);
    if (recentMetrics.length === 0) return 60;
    return recentMetrics.reduce((sum, m) => sum + m.frameRate, 0) / recentMetrics.length;
  }

  private getAverageLoadTime(): number {
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length === 0) return 0;
    return recentMetrics.reduce((sum, m) => sum + m.loadTime, 0) / recentMetrics.length;
  }

  private getGCCollectionCount(): number {
    // Implementation would track GC collections
    return 0; // Placeholder
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateMetrics(partial: Partial<PerformanceMetrics>): void {
    // Update current metrics with partial data
    if (this.metrics.length > 0) {
      const lastMetrics = this.metrics[this.metrics.length - 1];
      Object.assign(lastMetrics, partial);
    }
  }

  private setupPerformanceObservers(): void {
    // Setup various performance observers for detailed monitoring
    if (typeof PerformanceObserver !== 'undefined') {
      // Measure resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure') {
            this.updateMetrics({ renderTime: entry.duration });
          }
        });
      });

      try {
        resourceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (error) {
        console.warn('Failed to setup performance observer:', error);
      }
    }
  }

  public clearCache(): void {
    this.cache.clear();
    this.emit('cache:cleared');
  }

  public clearDataChunks(): void {
    this.dataChunks.clear();
    this.emit('chunks:cleared');
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('config:updated', this.config);
  }

  public shutdown(): void {
    // Clean up frame rate monitoring
    if (this.frameRateMonitor) {
      cancelAnimationFrame(this.frameRateMonitor);
      this.frameRateMonitor = null;
    }

    // Disconnect performance observers
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();

    // Terminate workers
    for (const worker of this.workers.values()) {
      worker.terminate();
    }
    this.workers.clear();

    // Clear caches
    this.clearCache();
    this.clearDataChunks();

    this.emit('engine:shutdown');
  }
}

// Export singleton instance
export const performanceEngine = PerformanceEngine.getInstance();

// Export utility functions
export const createVirtualList = (
  data: any[],
  config: VirtualizationConfig
) => performanceEngine.createVirtualDataProvider(data, config);

export const optimizeData = (
  data: any[],
  chartType: string
) => performanceEngine.applyOptimizations(data, chartType);

export const monitorPerformance = () => performanceEngine.getMetrics();

// Default export
export default performanceEngine;
