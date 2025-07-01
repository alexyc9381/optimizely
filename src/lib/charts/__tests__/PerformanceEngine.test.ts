/**
 * Performance Engine Tests
 * Comprehensive test suite for performance optimization features including
 * virtualization, progressive loading, memory management, and monitoring.
 */

import { PerformanceEngine, performanceEngine } from '../PerformanceEngine';

// Mock dependencies
const mockEventEmitter = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  setMaxListeners: jest.fn()
};

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  }
};

// Mock observers
const mockPerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  getEntries: jest.fn(() => [])
}));

const mockResizeObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn()
}));

const mockIntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn()
}));

const mockRequestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

const mockCancelAnimationFrame = jest.fn();

// Mock Worker
const mockWorker = jest.fn().mockImplementation(() => ({
  postMessage: jest.fn(),
  onmessage: jest.fn(),
  terminate: jest.fn()
}));

// Mock URL
const mockURL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
};

// Setup mocks
beforeAll(() => {
  global.performance = mockPerformance as any;
  global.PerformanceObserver = mockPerformanceObserver as any;
  global.ResizeObserver = mockResizeObserver as any;
  global.IntersectionObserver = mockIntersectionObserver as any;
  global.requestAnimationFrame = mockRequestAnimationFrame;
  global.cancelAnimationFrame = mockCancelAnimationFrame;
  global.Worker = mockWorker as any;
  global.URL = mockURL as any;
  global.Blob = jest.fn().mockImplementation(() => ({})) as any;
});

describe('PerformanceEngine', () => {
  let engine: PerformanceEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create new instance for each test
    (PerformanceEngine as any)._instance = null;
    engine = PerformanceEngine.getInstance();
  });

  afterEach(() => {
    engine.shutdown();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PerformanceEngine.getInstance();
      const instance2 = PerformanceEngine.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should initialize with default configuration', () => {
      const config = engine.getConfig();

      expect(config.virtualization.enabled).toBe(true);
      expect(config.progressiveLoading.enabled).toBe(true);
      expect(config.memory.maxCacheSize).toBe(100 * 1024 * 1024);
      expect(config.monitoring.enabled).toBe(true);
    });

    it('should accept custom configuration', () => {
      (PerformanceEngine as any)._instance = null;
      const customEngine = PerformanceEngine.getInstance({
        virtualization: { enabled: false },
        memory: { maxCacheSize: 50 * 1024 * 1024 }
      });

      const config = customEngine.getConfig();
      expect(config.virtualization.enabled).toBe(false);
      expect(config.memory.maxCacheSize).toBe(50 * 1024 * 1024);

      customEngine.shutdown();
    });
  });

  describe('Data Virtualization', () => {
    const sampleData = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      x: i,
      y: Math.sin(i * 0.1) * 100,
      value: Math.random() * 1000
    }));

    it('should create virtual data provider', () => {
      const provider = engine.createVirtualDataProvider(sampleData);

      expect(provider.getItemCount()).toBe(10000);
      expect(provider.getItem(0)).toEqual(sampleData[0]);
      expect(provider.getItem(9999)).toEqual(sampleData[9999]);
      expect(provider.getItem(-1)).toBeNull();
      expect(provider.getItem(10000)).toBeNull();
    });

    it('should virtualize data correctly', () => {
      const viewport = { start: 100, end: 200, height: 100 };
      const result = engine.virtualizeData(sampleData, viewport, {
        itemHeight: 10,
        overscan: 2
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.totalHeight).toBe(100000); // 10000 items * 10 height
      expect(result.startIndex).toBeGreaterThanOrEqual(0);
      expect(result.endIndex).toBeLessThan(sampleData.length);
    });

    it('should handle empty data virtualization', () => {
      const result = engine.virtualizeData([], { start: 0, end: 100, height: 100 });

      expect(result.items).toEqual([]);
      expect(result.totalHeight).toBe(0);
      expect(result.startIndex).toBe(0);
      expect(result.endIndex).toBe(-1);
    });

    it('should return all data when virtualization is disabled', () => {
      const result = engine.virtualizeData(sampleData.slice(0, 100),
        { start: 0, end: 100, height: 100 },
        { enabled: false }
      );

      expect(result.items).toEqual(sampleData.slice(0, 100));
      expect(result.startIndex).toBe(0);
      expect(result.endIndex).toBe(99);
    });
  });

  describe('Progressive Loading', () => {
    it('should load data progressively', async () => {
      let callCount = 0;
      const mockDataProvider = jest.fn(async () => {
        callCount++;
        if (callCount <= 3) {
          return Array.from({ length: 100 }, (_, i) => ({
            id: (callCount - 1) * 100 + i,
            value: Math.random()
          }));
        }
        return [];
      });

      const result = await engine.loadDataProgressively(mockDataProvider, {
        chunkSize: 100,
        loadDelay: 0
      });

      expect(result.length).toBe(300);
      expect(mockDataProvider).toHaveBeenCalledTimes(4); // 3 chunks + 1 empty
    });

    it('should handle progressive loading errors', async () => {
      const mockDataProvider = jest.fn(async () => {
        throw new Error('Network error');
      });

      const result = await engine.loadDataProgressively(mockDataProvider);

      expect(result).toEqual([]);
      expect(mockDataProvider).toHaveBeenCalledTimes(1);
    });

    it('should emit progress events', async () => {
      const progressSpy = jest.fn();
      engine.on('data:progress', progressSpy);

      const mockDataProvider = jest.fn(async () => [{ id: 1 }]);
      await engine.loadDataProgressively(mockDataProvider, { chunkSize: 1 });

      expect(progressSpy).toHaveBeenCalled();
    });
  });

  describe('Memory Management', () => {
    it('should manage memory within thresholds', () => {
      // Set up memory usage to exceed threshold
      jest.spyOn(engine as any, 'getCurrentMemoryUsage').mockReturnValue(0.9);

      const gcSpy = jest.spyOn(engine as any, 'performGarbageCollection');
      engine.manageMemory();

      expect(gcSpy).toHaveBeenCalled();
    });

    it('should not trigger GC when under threshold', () => {
      jest.spyOn(engine as any, 'getCurrentMemoryUsage').mockReturnValue(0.5);

      const gcSpy = jest.spyOn(engine as any, 'performGarbageCollection');
      engine.manageMemory();

      expect(gcSpy).not.toHaveBeenCalled();
    });

    it('should evict LRU cache entries', () => {
      // Add some cache entries
      engine.setCacheEntry('key1', { data: 'value1' }, 100);
      engine.setCacheEntry('key2', { data: 'value2' }, 100);
      engine.setCacheEntry('key3', { data: 'value3' }, 100);

      // Access key1 to make it more recently used
      engine.getCacheEntry('key1');

      // Force eviction
      (engine as any).evictLRUCacheEntries(0.5); // Remove 50%

      // key1 should still exist (most recently used)
      expect(engine.getCacheEntry('key1')).toBeTruthy();
    });

    it('should clear old data chunks', () => {
      const oldChunk = {
        id: 'old-chunk',
        startIndex: 0,
        endIndex: 99,
        data: [],
        loadState: 'loaded' as const,
        priority: 1,
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
        size: 1000
      };

      (engine as any).dataChunks.set('old-chunk', oldChunk);
      (engine as any).clearOldDataChunks();

      expect((engine as any).dataChunks.has('old-chunk')).toBe(false);
    });
  });

  describe('Caching System', () => {
    it('should set and get cache entries', () => {
      const data = { test: 'data' };
      engine.setCacheEntry('test-key', data, 100);

      const entry = engine.getCacheEntry('test-key');
      expect(entry).toBeTruthy();
      expect(entry?.data).toEqual(data);
      expect(entry?.size).toBe(100);
      expect(entry?.accessCount).toBe(2); // 1 for set, 1 for get
    });

    it('should handle cache expiration', () => {
      const data = { test: 'data' };
      engine.setCacheEntry('expiring-key', data, 100, 1); // 1ms TTL

      // Wait for expiration
      setTimeout(() => {
        const entry = engine.getCacheEntry('expiring-key');
        expect(entry).toBeNull();
      }, 10);
    });

    it('should return null for non-existent keys', () => {
      const entry = engine.getCacheEntry('non-existent');
      expect(entry).toBeNull();
    });

    it('should update access information on get', () => {
      engine.setCacheEntry('access-test', { data: 'test' }, 100);

      const entry1 = engine.getCacheEntry('access-test');
      const entry2 = engine.getCacheEntry('access-test');

      expect(entry2?.accessCount).toBe(entry1!.accessCount + 1);
      expect(entry2?.lastAccessed).toBeGreaterThanOrEqual(entry1!.lastAccessed);
    });

    it('should enforce cache size limits', () => {
      // Mock cache size calculation
      jest.spyOn(engine as any, 'enforceCacheLimit').mockImplementation(() => {
        // Simulate removing entries when limit exceeded
      });

      const largeData = { data: 'x'.repeat(1000000) }; // Large data
      engine.setCacheEntry('large-key', largeData, 1000000);

      expect((engine as any).enforceCacheLimit).toHaveBeenCalled();
    });
  });

  describe('Optimization Strategies', () => {
    const testData = Array.from({ length: 20000 }, (_, i) => ({
      id: i,
      x: i,
      y: Math.sin(i * 0.1) * 100,
      value: Math.random() * 1000
    }));

    it('should apply data sampling optimization', () => {
      const optimized = engine.applyOptimizations(testData, 'line');

      expect(optimized.length).toBeLessThan(testData.length);
      expect(optimized.length).toBeLessThanOrEqual(10000); // Max points from strategy
    });

    it('should apply level of detail optimization', () => {
      engine.updateConfig({
        strategies: [
          { name: 'level-of-detail', enabled: true, config: { levels: 2 }, priority: 1 }
        ]
      });

      const optimized = engine.applyOptimizations(testData, 'line');

      expect(optimized.length).toBeLessThan(testData.length);
    });

    it('should not optimize when strategies are disabled', () => {
      engine.updateConfig({
        strategies: [
          { name: 'data-sampling', enabled: false, config: {}, priority: 1 }
        ]
      });

      const optimized = engine.applyOptimizations(testData, 'line');

      expect(optimized).toEqual(testData);
    });

    it('should apply multiple strategies in priority order', () => {
      engine.updateConfig({
        strategies: [
          { name: 'data-sampling', enabled: true, config: { maxPoints: 5000 }, priority: 1 },
          { name: 'level-of-detail', enabled: true, config: { levels: 2 }, priority: 2 }
        ]
      });

      const optimized = engine.applyOptimizations(testData, 'line');

      expect(optimized.length).toBeLessThan(testData.length);
    });
  });

  describe('Performance Monitoring', () => {
    it('should collect performance metrics', () => {
      const metricsSpy = jest.fn();
      engine.on('metrics:collected', metricsSpy);

      // Trigger metrics collection
      (engine as any).collectMetrics();

      expect(metricsSpy).toHaveBeenCalled();

      const metrics = engine.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should emit alerts when thresholds are exceeded', () => {
      const memorySpy = jest.fn();
      const renderSpy = jest.fn();
      const frameSpy = jest.fn();

      engine.on('alert:memory', memorySpy);
      engine.on('alert:render-time', renderSpy);
      engine.on('alert:frame-rate', frameSpy);

      // Mock metrics that exceed thresholds
      const badMetrics = {
        renderTime: 100, // > 16.67ms threshold
        memoryUsage: 0.9, // > 0.8 threshold
        frameRate: 20, // < 30fps threshold
        dataProcessingTime: 0,
        virtualizedItems: 0,
        cacheHitRate: 0,
        loadTime: 0,
        gcCollections: 0,
        timestamp: Date.now()
      };

      (engine as any).checkAlertThresholds(badMetrics);

      expect(memorySpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();
      expect(frameSpy).toHaveBeenCalled();
    });

    it('should not emit alerts when within thresholds', () => {
      const memorySpy = jest.fn();
      engine.on('alert:memory', memorySpy);

      const goodMetrics = {
        renderTime: 10,
        memoryUsage: 0.5,
        frameRate: 60,
        dataProcessingTime: 0,
        virtualizedItems: 0,
        cacheHitRate: 0,
        loadTime: 0,
        gcCollections: 0,
        timestamp: Date.now()
      };

      (engine as any).checkAlertThresholds(goodMetrics);

      expect(memorySpy).not.toHaveBeenCalled();
    });

    it('should maintain metrics history limit', () => {
      const historySize = engine.getConfig().monitoring.historySize;

      // Add more metrics than history size
      for (let i = 0; i < historySize + 50; i++) {
        (engine as any).metrics.push({
          renderTime: i,
          memoryUsage: 0.5,
          frameRate: 60,
          dataProcessingTime: 0,
          virtualizedItems: 0,
          cacheHitRate: 0,
          loadTime: 0,
          gcCollections: 0,
          timestamp: Date.now()
        });
      }

      const metrics = engine.getMetrics();
      expect(metrics.length).toBeLessThanOrEqual(historySize);
    });
  });

  describe('Worker Management', () => {
    it('should create performance workers', () => {
      expect(mockWorker).toHaveBeenCalled();
      expect(mockURL.createObjectURL).toHaveBeenCalled();
    });

    it('should generate appropriate worker code', () => {
      const dataProcessingCode = (engine as any).generateWorkerCode('data-processing');
      const virtualizationCode = (engine as any).generateWorkerCode('virtualization');

      expect(dataProcessingCode).toContain('sample');
      expect(dataProcessingCode).toContain('aggregate');
      expect(virtualizationCode).toContain('virtualize');
    });

    it('should handle worker creation failures', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock Worker constructor to throw
      global.Worker = jest.fn().mockImplementation(() => {
        throw new Error('Worker creation failed');
      });

      (engine as any).setupWorkers();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create worker'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        virtualization: { enabled: false },
        memory: { maxCacheSize: 200 * 1024 * 1024 }
      };

      engine.updateConfig(newConfig);

      const config = engine.getConfig();
      expect(config.virtualization.enabled).toBe(false);
      expect(config.memory.maxCacheSize).toBe(200 * 1024 * 1024);
    });

    it('should emit config update events', () => {
      const configSpy = jest.fn();
      engine.on('config:updated', configSpy);

      engine.updateConfig({ virtualization: { enabled: false } });

      expect(configSpy).toHaveBeenCalled();
    });
  });

  describe('Cleanup and Shutdown', () => {
    it('should clean up resources on shutdown', () => {
      engine.shutdown();

      expect(mockCancelAnimationFrame).toHaveBeenCalled();
      expect(mockPerformanceObserver.mock.results[0].value.disconnect).toHaveBeenCalled();
    });

    it('should clear cache and data chunks', () => {
      engine.setCacheEntry('test', { data: 'test' }, 100);

      engine.clearCache();
      expect(engine.getCacheEntry('test')).toBeNull();

      engine.clearDataChunks();
      expect((engine as any).dataChunks.size).toBe(0);
    });

    it('should emit shutdown events', () => {
      const shutdownSpy = jest.fn();
      engine.on('engine:shutdown', shutdownSpy);

      engine.shutdown();

      expect(shutdownSpy).toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    it('should estimate data size correctly', () => {
      const data = { test: 'data', number: 123 };
      const size = (engine as any).estimateDataSize(data);

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should get current memory usage', () => {
      const usage = (engine as any).getCurrentMemoryUsage();

      expect(usage).toBe(0.5); // 1MB / 2MB from mock
    });

    it('should calculate average metrics', () => {
      // Add some test metrics
      (engine as any).metrics = [
        { renderTime: 10 },
        { renderTime: 20 },
        { renderTime: 30 }
      ];

      const avgRenderTime = (engine as any).getAverageRenderTime();
      expect(avgRenderTime).toBe(20);
    });

    it('should handle delay function', async () => {
      const startTime = Date.now();
      await (engine as any).delay(100);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(90); // Allow some variance
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty datasets gracefully', () => {
      const provider = engine.createVirtualDataProvider([]);
      expect(provider.getItemCount()).toBe(0);

      const result = engine.virtualizeData([], { start: 0, end: 100, height: 100 });
      expect(result.items).toEqual([]);
    });

    it('should handle invalid viewport parameters', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({ id: i, value: i }));

      const result = engine.virtualizeData(data, { start: -100, end: -50, height: 100 });
      expect(result.items).toBeDefined();
      expect(result.startIndex).toBeGreaterThanOrEqual(0);
    });

    it('should handle memory calculation when performance.memory is unavailable', () => {
      const originalMemory = (global.performance as any).memory;
      delete (global.performance as any).memory;

      const usage = (engine as any).getCurrentMemoryUsage();
      expect(usage).toBe(0);

      (global.performance as any).memory = originalMemory;
    });

    it('should handle performance observer setup failures', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock PerformanceObserver to throw
      global.PerformanceObserver = jest.fn().mockImplementation(() => {
        throw new Error('Observer setup failed');
      });

      (engine as any).setupPerformanceObservers();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to setup performance observer'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});

// Integration tests
describe('PerformanceEngine Integration', () => {
  it('should handle complete virtualization workflow', async () => {
    const engine = performanceEngine;
    const largeData = Array.from({ length: 100000 }, (_, i) => ({
      id: i,
      x: i,
      y: Math.sin(i * 0.1) * 100,
      value: Math.random() * 1000
    }));

    // Create virtual provider
    const provider = engine.createVirtualDataProvider(largeData);

    // Test data access
    expect(provider.getItemCount()).toBe(100000);

    // Test chunk loading
    const chunk = await provider.getItems(0, 1000);
    expect(chunk.length).toBe(1000);

    // Test virtualization
    const viewport = { start: 5000, end: 6000, height: 1000 };
    const virtual = engine.virtualizeData(largeData, viewport);
    expect(virtual.items.length).toBeGreaterThan(0);
    expect(virtual.items.length).toBeLessThan(largeData.length);
  });

  it('should handle complete progressive loading workflow', async () => {
    const engine = performanceEngine;
    let chunkCount = 0;

    const dataProvider = async () => {
      chunkCount++;
      if (chunkCount <= 5) {
        return Array.from({ length: 1000 }, (_, i) => ({
          id: (chunkCount - 1) * 1000 + i,
          value: Math.random()
        }));
      }
      return [];
    };

    const data = await engine.loadDataProgressively(dataProvider, {
      chunkSize: 1000,
      loadDelay: 10
    });

    expect(data.length).toBe(5000);
    expect(chunkCount).toBe(6); // 5 chunks + 1 empty
  });
});
