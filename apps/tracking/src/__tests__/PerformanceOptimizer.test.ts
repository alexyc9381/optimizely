import { PerformanceOptimizer } from '../modules/PerformanceOptimizer';
import type {
    LazyLoadModule,
    PerformanceConfig
} from '../types';

// Mock utilities
jest.mock('../utils', () => ({
  isBrowser: jest.fn(() => true),
}));

// Mock DOM APIs
const mockPerformanceObserver = jest.fn();
const mockDocument = {
  createElement: jest.fn(() => ({
    rel: '',
    href: '',
    onload: null,
    onerror: null,
  })),
  head: {
    appendChild: jest.fn(),
  },
  readyState: 'complete',
  addEventListener: jest.fn(),
};

const mockWindow = {
  performance: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    },
    getEntriesByType: jest.fn(() => [
      { name: 'first-paint', startTime: 100 },
      { name: 'first-contentful-paint', startTime: 200 },
    ]),
  },
  setInterval: jest.fn((callback, ms) => {
    return setTimeout(callback, ms);
  }),
  clearInterval: jest.fn((id) => clearTimeout(id)),
  requestIdleCallback: jest.fn((callback) => setTimeout(callback, 0)),
  navigator: {
    userAgent: 'Mozilla/5.0 (test browser)',
  },
  addEventListener: jest.fn(),
  PerformanceObserver: mockPerformanceObserver,
};

// Set up global mocks
(global as any).window = mockWindow;
(global as any).document = mockDocument;
(global as any).PerformanceObserver = mockPerformanceObserver;

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer;
  let mockConfig: Partial<PerformanceConfig>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      enabled: true,
      lazyLoading: {
        enabled: true,
        threshold: 50 * 1024,
        modules: ['test-module'],
        chunkSize: 100 * 1024,
      },
      memoryManagement: {
        enabled: true,
        maxMemoryUsage: 100,
        gcInterval: 1000,
        leakDetection: true,
        autoCleanup: true,
        memoryThreshold: 80,
      },
    };

    optimizer = new PerformanceOptimizer(mockConfig);
  });

  afterEach(() => {
    if (optimizer) {
      optimizer.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const defaultOptimizer = new PerformanceOptimizer();
      expect(defaultOptimizer.getConfig()).toBeDefined();
      expect(defaultOptimizer.getConfig().enabled).toBe(true);
      defaultOptimizer.destroy();
    });

    it('should initialize with custom config', () => {
      expect(optimizer.getConfig().enabled).toBe(true);
      expect(optimizer.getConfig().lazyLoading?.enabled).toBe(true);
      expect(optimizer.getConfig().memoryManagement?.maxMemoryUsage).toBe(100);
    });

    it('should call init without errors', () => {
      expect(() => optimizer.init()).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should update config', () => {
      const newConfig: Partial<PerformanceConfig> = {
        memoryManagement: {
          enabled: true,
          maxMemoryUsage: 200,
          gcInterval: 2000,
          leakDetection: false,
          autoCleanup: false,
          memoryThreshold: 150,
        },
      };

      optimizer.configure(newConfig);

      const config = optimizer.getConfig();
      expect(config.memoryManagement?.maxMemoryUsage).toBe(200);
      expect(config.memoryManagement?.leakDetection).toBe(false);
    });
  });

  describe('Lazy Loading', () => {
    it('should register lazy modules', () => {
      const module: LazyLoadModule = {
        name: 'test-module',
        size: 1024,
        priority: 'normal',
        dependencies: [],
        loader: jest.fn().mockResolvedValue({}),
        loaded: false,
      };

      expect(() => optimizer.registerLazyModule(module)).not.toThrow();
    });

    it('should load modules', async () => {
      const mockLoader = jest.fn().mockResolvedValue({ data: 'test' });
      const module: LazyLoadModule = {
        name: 'test-module',
        size: 1024,
        priority: 'normal',
        dependencies: [],
        loader: mockLoader,
        loaded: false,
      };

      optimizer.registerLazyModule(module);
      const result = await optimizer.loadModule('test-module');

      expect(mockLoader).toHaveBeenCalled();
      expect(result).toEqual({ data: 'test' });
    });

    it('should handle module loading errors', async () => {
      const mockLoader = jest.fn().mockRejectedValue(new Error('Load failed'));
      const module: LazyLoadModule = {
        name: 'error-module',
        size: 1024,
        priority: 'normal',
        dependencies: [],
        loader: mockLoader,
        loaded: false,
      };

      optimizer.registerLazyModule(module);
      await expect(optimizer.loadModule('error-module')).rejects.toThrow('Load failed');
    });
  });

  describe('Memory Management', () => {
    it('should get memory usage', () => {
      const snapshot = optimizer.getMemoryUsage();

      expect(snapshot).toEqual({
        timestamp: expect.any(Number),
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        external: 50 * 1024 * 1024,
        leaks: expect.any(Array),
      });
    });

    it('should detect memory leaks', () => {
      const leaks = optimizer.detectMemoryLeaks();
      expect(leaks).toBeInstanceOf(Array);
    });

    it('should perform cleanup', () => {
      expect(() => optimizer.cleanup()).not.toThrow();
    });

    it('should force garbage collection', () => {
      expect(() => optimizer.forceGarbageCollection()).not.toThrow();
    });
  });

  describe('Monitoring', () => {
    it('should get performance metrics', () => {
      const metrics = optimizer.getMetrics();

      expect(metrics).toEqual({
        loadTime: expect.any(Number),
        domReady: expect.any(Number),
        firstPaint: expect.any(Number),
        firstContentfulPaint: expect.any(Number),
        largestContentfulPaint: expect.any(Number),
        firstInputDelay: expect.any(Number),
        cumulativeLayoutShift: expect.any(Number),
        totalBlockingTime: expect.any(Number),
        timeToInteractive: expect.any(Number),
        memoryUsage: expect.any(Object),
        cpuUsage: expect.any(Number),
        networkStats: expect.any(Object),
        scriptPerformance: expect.any(Object),
      });
    });

    it('should start and stop monitoring', () => {
      expect(() => optimizer.startMonitoring()).not.toThrow();
      expect(() => optimizer.stopMonitoring()).not.toThrow();
    });

    it('should set and get thresholds', () => {
      const newThresholds = {
        memory: { warning: 60, critical: 80 },
        cpu: { warning: 80, critical: 95 },
      };

      optimizer.setThresholds(newThresholds);
      const thresholds = optimizer.getThresholds();
      expect(thresholds.memory.warning).toBe(60);
      expect(thresholds.cpu.warning).toBe(80);
    });
  });

  describe('Destruction', () => {
    it('should clean up resources on destroy', () => {
      optimizer.init();
      expect(() => optimizer.destroy()).not.toThrow();
    });

    it('should not throw when destroying uninitialized optimizer', () => {
      const newOptimizer = new PerformanceOptimizer();
      expect(() => newOptimizer.destroy()).not.toThrow();
    });
  });
});
