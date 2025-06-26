import { EventEmitter } from '../core/EventEmitter';
import {
    CodeSplitPoint,
    CoreWebVitalsObserver,
    CpuProfile,
    LazyLoadModule,
    MemoryLeak,
    MemorySnapshot,
    OptimizationRecommendation,
    PerformanceConfig,
    PerformanceMetrics,
    PerformanceOptimizationModule,
    PerformanceOptimizationReport,
    PerformanceThresholds,
    PerformanceViolation,
    PlatformOptimization,
    QueuedRequest,
    RequestBatch,
    ResourcePriority
} from '../types';
import { isBrowser } from '../utils';

// Helper function for performance timing
const now = (): number => {
  if (isBrowser() && 'performance' in window && performance.now) {
    return performance.now();
  }
  return Date.now();
};

// Utility functions
const generateId = (): string => Math.random().toString(36).substr(2, 9);

/**
 * PerformanceOptimizer - Comprehensive performance optimization module
 * Implements lazy loading, code splitting, memory management, CPU throttling,
 * request batching, Core Web Vitals optimization, and cross-platform performance
 */
export class PerformanceOptimizer extends EventEmitter implements PerformanceOptimizationModule {
  public readonly name: string = 'PerformanceOptimizer';

  private _config: Required<PerformanceConfig>;
  private _metrics: PerformanceMetrics;
  private _thresholds: PerformanceThresholds;
  private _isMonitoring: boolean = false;
  private _initialized: boolean = false;

  // Lazy Loading
  private _lazyModules: Map<string, LazyLoadModule> = new Map();
  private _loadedModules: Set<string> = new Set();
  private _loadingPromises: Map<string, Promise<any>> = new Map();

  // Code Splitting
  private _splitPoints: Map<string, CodeSplitPoint> = new Map();
  private _loadedChunks: Set<string> = new Set();

  // Memory Management
  private _memorySnapshots: MemorySnapshot[] = [];
  private _memoryThresholds: { warning: number; critical: number } = { warning: 50, critical: 75 };
  private _detectedLeaks: MemoryLeak[] = [];

  // CPU Management
  private _cpuProfiles: CpuProfile[] = [];
  private _taskQueue: Array<{ fn: () => void; priority: number }> = [];
  private _isThrottling: boolean = false;
  private _throttleInterval?: number;
  private _currentThrottle: number = 0;

  // Request Batching
  private _requestBatches: Map<string, RequestBatch> = new Map();
  private _pendingRequests: QueuedRequest[] = [];
  private _batchInterval?: number;
  private _lastFlush: number = 0;

  // Core Web Vitals
  private _vitalsObserver?: PerformanceObserver;
  private _coreWebVitals: CoreWebVitalsObserver = {
    lcp: 0,
    fid: 0,
    cls: 0
  };
  private _vitalsHistory: CoreWebVitalsObserver[] = [];

  // Resource Prioritization
  private _resourcePriorities: Map<string, ResourcePriority> = new Map();
  private _criticalResources: Set<string> = new Set();
  private _preloadedResources: Set<string> = new Set();

  // Cross-Platform
  private _platformOptimizations: Map<string, PlatformOptimization> = new Map();
  private _currentPlatform?: string;
  private _currentFramework?: string;

  // Monitoring
  private _monitoringInterval?: number;
  private _performanceObserver?: PerformanceObserver;
  private _resizeObserver?: ResizeObserver;
  private _startTime: number = 0;

  constructor(config: Partial<PerformanceConfig> = {}) {
    super();
    this._config = this._getDefaultConfig(config);
    this._metrics = this._getInitialMetrics();
    this._thresholds = this._getDefaultThresholds();
  }

  private _getDefaultConfig(config: Partial<PerformanceConfig>): Required<PerformanceConfig> {
    return {
      enabled: config.enabled ?? true,
      lazyLoading: {
        enabled: config.lazyLoading?.enabled ?? true,
        threshold: config.lazyLoading?.threshold ?? 50 * 1024, // 50KB
        modules: config.lazyLoading?.modules ?? [],
        chunkSize: config.lazyLoading?.chunkSize ?? 100 * 1024, // 100KB
      },
      codesplitting: {
        enabled: config.codesplitting?.enabled ?? true,
        splitPoints: config.codesplitting?.splitPoints ?? [],
        dynamicImports: config.codesplitting?.dynamicImports ?? true,
        preloadCritical: config.codesplitting?.preloadCritical ?? true,
      },
      memoryManagement: {
        enabled: config.memoryManagement?.enabled ?? true,
        maxMemoryUsage: config.memoryManagement?.maxMemoryUsage ?? 100, // 100MB
        gcInterval: config.memoryManagement?.gcInterval ?? 30000, // 30s
        leakDetection: config.memoryManagement?.leakDetection ?? true,
        autoCleanup: config.memoryManagement?.autoCleanup ?? true,
        memoryThreshold: config.memoryManagement?.memoryThreshold ?? 80, // 80MB
      },
      cpuThrottling: {
        enabled: config.cpuThrottling?.enabled ?? true,
        maxCpuUsage: config.cpuThrottling?.maxCpuUsage ?? 70, // 70%
        throttleInterval: config.cpuThrottling?.throttleInterval ?? 100, // 100ms
        adaptiveThrottling: config.cpuThrottling?.adaptiveThrottling ?? true,
        priorityQueue: config.cpuThrottling?.priorityQueue ?? true,
      },
      requestBatching: {
        enabled: config.requestBatching?.enabled ?? true,
        batchSize: config.requestBatching?.batchSize ?? 10,
        flushInterval: config.requestBatching?.flushInterval ?? 5000, // 5s
        maxBatchAge: config.requestBatching?.maxBatchAge ?? 30000, // 30s
        priorityBatching: config.requestBatching?.priorityBatching ?? true,
        compression: config.requestBatching?.compression ?? true,
      },
      coreWebVitals: {
        enabled: config.coreWebVitals?.enabled ?? true,
        lcpThreshold: config.coreWebVitals?.lcpThreshold ?? 2500, // 2.5s
        fidThreshold: config.coreWebVitals?.fidThreshold ?? 100, // 100ms
        clsThreshold: config.coreWebVitals?.clsThreshold ?? 0.1,
        monitoring: config.coreWebVitals?.monitoring ?? true,
        optimization: config.coreWebVitals?.optimization ?? true,
      },
      resourcePrioritization: {
        enabled: config.resourcePrioritization?.enabled ?? true,
        criticalResources: config.resourcePrioritization?.criticalResources ?? [],
        preloadThreshold: config.resourcePrioritization?.preloadThreshold ?? 1000, // 1s
        deferNonCritical: config.resourcePrioritization?.deferNonCritical ?? true,
        adaptivePriority: config.resourcePrioritization?.adaptivePriority ?? true,
      },
      crossPlatform: {
        enabled: config.crossPlatform?.enabled ?? true,
        frameworkOptimizations: config.crossPlatform?.frameworkOptimizations ?? {},
        universalPolyfills: config.crossPlatform?.universalPolyfills ?? true,
        adaptiveLoading: config.crossPlatform?.adaptiveLoading ?? true,
      },
    };
  }

  private _getInitialMetrics(): PerformanceMetrics {
    return {
      loadTime: 0,
      domReady: 0,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      totalBlockingTime: 0,
      timeToInteractive: 0,
      memoryUsage: {
        used: 0,
        total: 0,
        limit: this._config.memoryManagement.maxMemoryUsage * 1024 * 1024,
      },
      cpuUsage: 0,
      networkStats: {
        requests: 0,
        bytesTransferred: 0,
        averageLatency: 0,
      },
      scriptPerformance: {
        initTime: 0,
        executionTime: 0,
        moduleLoadTimes: {},
      },
    };
  }

  private _getDefaultThresholds(): PerformanceThresholds {
    return {
      memory: {
        warning: this._config.memoryManagement.memoryThreshold,
        critical: this._config.memoryManagement.maxMemoryUsage,
      },
      cpu: {
        warning: this._config.cpuThrottling.maxCpuUsage * 0.8,
        critical: this._config.cpuThrottling.maxCpuUsage,
      },
      network: {
        latency: 500, // 500ms
        bandwidth: 1024 * 1024, // 1MB/s
      },
      coreWebVitals: {
        lcp: this._config.coreWebVitals.lcpThreshold,
        fid: this._config.coreWebVitals.fidThreshold,
        cls: this._config.coreWebVitals.clsThreshold,
      },
    };
  }

  init(): void {
    if (this._initialized || !this._config.enabled) return;

    try {
      if (this._config.lazyLoading.enabled) {
        this._initLazyLoading();
      }

      if (this._config.codesplitting.enabled) {
        this._initCodeSplitting();
      }

      if (this._config.memoryManagement.enabled) {
        this._initMemoryManagement();
      }

      if (this._config.cpuThrottling.enabled) {
        this._initCpuThrottling();
      }

      if (this._config.requestBatching.enabled) {
        this._initRequestBatching();
      }

      if (this._config.coreWebVitals.enabled) {
        this._initCoreWebVitals();
      }

      if (this._config.resourcePrioritization.enabled) {
        this._initResourcePrioritization();
      }

      if (this._config.crossPlatform.enabled) {
        this._initCrossPlatform();
      }

      this._detectPlatform();
      this._measureInitialMetrics();

      this._initialized = true;
      this.emit('performance:initialized', { config: this._config });

    } catch (error) {
      console.error('PerformanceOptimizer initialization failed:', error);
      this.emit('performance:error', error);
    }
  }

  destroy(): void {
    this.stopMonitoring();

    // Clear intervals
    if (this._throttleInterval) clearInterval(this._throttleInterval);
    if (this._batchInterval) clearInterval(this._batchInterval);
    if (this._monitoringInterval) clearInterval(this._monitoringInterval);

    // Clear observers
    if (this._vitalsObserver) this._vitalsObserver.disconnect();
    if (this._performanceObserver) this._performanceObserver.disconnect();
    if (this._resizeObserver) this._resizeObserver.disconnect();

    // Clear data
    this._lazyModules.clear();
    this._loadedModules.clear();
    this._loadingPromises.clear();
    this._splitPoints.clear();
    this._loadedChunks.clear();
    this._memorySnapshots = [];
    this._detectedLeaks = [];
    this._cpuProfiles = [];
    this._taskQueue = [];
    this._requestBatches.clear();
    this._pendingRequests = [];
    this._resourcePriorities.clear();
    this._criticalResources.clear();
    this._preloadedResources.clear();
    this._platformOptimizations.clear();

    this._initialized = false;
    this.emit('performance:destroyed');
  }

  // Configuration methods
  configure(config: Partial<PerformanceConfig>): void {
    this._config = { ...this._config, ...config };
    this._thresholds = this._getDefaultThresholds();

    if (this._initialized) {
      this.destroy();
      this.init();
    }

    this.emit('performance:configured', { config: this._config });
  }

  getConfig(): PerformanceConfig {
    return { ...this._config };
  }

  // Lazy Loading Implementation
  private _initLazyLoading(): void {
    // Pre-register common modules for lazy loading
    const commonModules = this._config.lazyLoading.modules;
    commonModules.forEach(moduleName => {
      this.registerLazyModule({
        name: moduleName,
        size: 0, // Will be calculated on load
        priority: 'normal',
        dependencies: [],
        loader: async () => {
          return import(/* webpackChunkName: "[request]" */ moduleName);
        },
        loaded: false,
      });
    });
  }

  registerLazyModule(module: LazyLoadModule): void {
    this._lazyModules.set(module.name, module);
    this.emit('performance:module_registered', { module: module.name });
  }

  async loadModule(name: string): Promise<any> {
    const module = this._lazyModules.get(name);
    if (!module) {
      throw new Error(`Module '${name}' not registered for lazy loading`);
    }

    if (module.loaded) {
      return module;
    }

    // Check if already loading
    const existingPromise = this._loadingPromises.get(name);
    if (existingPromise) {
      return existingPromise;
    }

    const startTime = now();
    const loadPromise = this._loadModuleWithDependencies(module);
    this._loadingPromises.set(name, loadPromise);

    try {
      const result = await loadPromise;
      const loadTime = now() - startTime;

      module.loaded = true;
      module.loadTime = loadTime;
      this._loadedModules.add(name);
      this._loadingPromises.delete(name);

      // Update metrics
      if (this._metrics.scriptPerformance) {
        this._metrics.scriptPerformance.moduleLoadTimes[name] = loadTime;
      }

      this.emit('performance:module_loaded', {
        module: name,
        loadTime,
        size: module.size
      });

      return result;
    } catch (error) {
      this._loadingPromises.delete(name);
      this.emit('performance:module_error', { module: name, error });
      throw error;
    }
  }

  private async _loadModuleWithDependencies(module: LazyLoadModule): Promise<any> {
    // Load dependencies first
    for (const dep of module.dependencies) {
      if (!this._loadedModules.has(dep)) {
        await this.loadModule(dep);
      }
    }

    // Load the module
    return module.loader();
  }

  async preloadModules(names: string[]): Promise<void> {
    const loadPromises = names.map(name => this.loadModule(name));
    await Promise.all(loadPromises);
    this.emit('performance:modules_preloaded', { modules: names });
  }

  // Code Splitting Implementation
  private _initCodeSplitting(): void {
    if (this._config.codesplitting.preloadCritical) {
      this.preloadCritical();
    }
  }

  registerSplitPoint(splitPoint: CodeSplitPoint): void {
    this._splitPoints.set(splitPoint.name, splitPoint);

    if (splitPoint.critical) {
      this._criticalResources.add(splitPoint.name);
    }

    this.emit('performance:split_point_registered', { splitPoint: splitPoint.name });
  }

  async splitCode(): Promise<void> {
    const splitPromises: Promise<void>[] = [];

    Array.from(this._splitPoints.entries()).forEach(([name, splitPoint]) => {
      if (this._loadedChunks.has(name)) return;

      if (splitPoint.condition()) {
        const splitPromise = this._loadSplitPoint(splitPoint);
        splitPromises.push(splitPromise);
      }
    });

    await Promise.all(splitPromises);
    this.emit('performance:code_split_complete');
  }

  private async _loadSplitPoint(splitPoint: CodeSplitPoint): Promise<void> {
    const startTime = now();

    try {
      // Load modules in the split point
      const modulePromises = splitPoint.modules.map(module => this.loadModule(module));
      await Promise.all(modulePromises);

      this._loadedChunks.add(splitPoint.name);
      const loadTime = now() - startTime;

      this.emit('performance:split_point_loaded', {
        splitPoint: splitPoint.name,
        loadTime,
        modules: splitPoint.modules
      });
    } catch (error) {
      this.emit('performance:split_point_error', {
        splitPoint: splitPoint.name,
        error
      });
      throw error;
    }
  }

  async preloadCritical(): Promise<void> {
    const criticalSplitPoints = Array.from(this._splitPoints.values())
      .filter(sp => sp.critical || sp.preload);

    const loadPromises = criticalSplitPoints.map(sp => this._loadSplitPoint(sp));
    await Promise.all(loadPromises);

    this.emit('performance:critical_preloaded', {
      count: criticalSplitPoints.length
    });
  }

  // Memory Management Implementation
  private _initMemoryManagement(): void {
    if (this._config.memoryManagement.autoCleanup) {
      this._gcInterval = window.setInterval(() => {
        this._performGarbageCollection();
      }, this._config.memoryManagement.gcInterval);
    }

    if (this._config.memoryManagement.leakDetection) {
      this._startMemoryLeakDetection();
    }
  }

  getMemoryUsage(): MemorySnapshot {
    const snapshot: MemorySnapshot = {
      timestamp: now(),
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
    };

    if (isBrowser() && 'memory' in performance) {
      const memory = (performance as any).memory;
      snapshot.heapUsed = memory.usedJSHeapSize || 0;
      snapshot.heapTotal = memory.totalJSHeapSize || 0;
      snapshot.external = memory.totalJSHeapSize - memory.usedJSHeapSize || 0;
    }

    if (this._config.memoryManagement.leakDetection) {
      snapshot.leaks = this.detectMemoryLeaks();
    }

    this._memorySnapshots.push(snapshot);

    // Keep only last 100 snapshots
    if (this._memorySnapshots.length > 100) {
      this._memorySnapshots = this._memorySnapshots.slice(-100);
    }

    return snapshot;
  }

  detectMemoryLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    if (this._memorySnapshots.length < 5) return leaks;

    // Simple leak detection: consistently growing memory
    const recent = this._memorySnapshots.slice(-5);
    const isGrowing = recent.every((snapshot, i) =>
      i === 0 || snapshot.heapUsed > recent[i - 1].heapUsed
    );

    if (isGrowing) {
      const growth = recent[recent.length - 1].heapUsed - recent[0].heapUsed;
      if (growth > 10 * 1024 * 1024) { // 10MB growth
        leaks.push({
          type: 'memory_growth',
          size: growth,
          location: 'heap',
          timestamp: now(),
          stack: new Error().stack || 'No stack trace available',
        });
      }
    }

    this._detectedLeaks = leaks;
    return leaks;
  }

  cleanup(): void {
    // Clean up large objects and references
    this._memorySnapshots = this._memorySnapshots.slice(-10); // Keep only 10 recent
    this._cpuProfiles = this._cpuProfiles.slice(-10);
    this._vitalsHistory = this._vitalsHistory.slice(-10);

    // Clear completed batches
    for (const [id, batch] of this._requestBatches) {
      if (batch.createdAt < now() - this._config.requestBatching.maxBatchAge) {
        this._requestBatches.delete(id);
      }
    }

    this.emit('performance:cleanup_complete');
  }

  forceGarbageCollection(): void {
    this._performGarbageCollection();
  }

  private _performGarbageCollection(): void {
    const beforeSnapshot = this.getMemoryUsage();

    // Cleanup internal structures
    this.cleanup();

    // Trigger browser GC if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }

    const afterSnapshot = this.getMemoryUsage();
    const freed = beforeSnapshot.heapUsed - afterSnapshot.heapUsed;

    this._lastGC = now();
    this.emit('performance:gc_performed', { freed, before: beforeSnapshot, after: afterSnapshot });
  }

  private _startMemoryLeakDetection(): void {
    setInterval(() => {
      const usage = this.getMemoryUsage();
      const threshold = this._thresholds.memory.warning * 1024 * 1024;

      if (usage.heapUsed > threshold) {
        this.emit('performance:memory_warning', {
          usage: usage.heapUsed,
          threshold,
          leaks: usage.leaks
        });
      }
    }, 10000); // Check every 10 seconds
  }

  // CPU Management Implementation
  private _initCpuThrottling(): void {
    if (this._config.cpuThrottling.priorityQueue) {
      this._startTaskQueue();
    }

    if (this._config.cpuThrottling.adaptiveThrottling) {
      this._startCpuMonitoring();
    }
  }

  getCpuUsage(): CpuProfile {
    const profile: CpuProfile = {
      timestamp: now(),
      usage: 0,
      tasks: [],
      throttled: this._isThrottling,
    };

    // Basic CPU usage estimation based on task queue
    if (this._taskQueue.length > 0) {
      profile.usage = Math.min(this._taskQueue.length * 10, 100);
    }

    this._cpuProfiles.push(profile);
    if (this._cpuProfiles.length > 50) {
      this._cpuProfiles = this._cpuProfiles.slice(-50);
    }

    return profile;
  }

  throttleCpu(enabled: boolean): void {
    this._isThrottling = enabled;

    if (enabled && !this._throttleInterval) {
      this._throttleInterval = window.setInterval(() => {
        this._processTaskQueue();
      }, this._config.cpuThrottling.throttleInterval);
    } else if (!enabled && this._throttleInterval) {
      clearInterval(this._throttleInterval);
      this._throttleInterval = undefined;
    }

    this.emit('performance:cpu_throttling_changed', { enabled });
  }

  queueTask(task: Function, priority: 'low' | 'normal' | 'high' | 'critical'): void {
    this._taskQueue.push({ fn: task, priority });

    // Sort by priority
    this._taskQueue.sort((a, b) => {
      const priorities = { critical: 4, high: 3, normal: 2, low: 1 };
      return priorities[b.priority] - priorities[a.priority];
    });

    this.emit('performance:task_queued', { priority, queueSize: this._taskQueue.length });
  }

  private _startTaskQueue(): void {
    this.throttleCpu(true);
  }

  private _startCpuMonitoring(): void {
    setInterval(() => {
      const profile = this.getCpuUsage();
      const threshold = this._thresholds.cpu.warning;

      if (profile.usage > threshold && !this._isThrottling) {
        this.throttleCpu(true);
        this.emit('performance:cpu_throttling_activated', { usage: profile.usage, threshold });
      } else if (profile.usage < threshold * 0.5 && this._isThrottling) {
        this.throttleCpu(false);
        this.emit('performance:cpu_throttling_deactivated', { usage: profile.usage });
      }
    }, 5000); // Check every 5 seconds
  }

  private _processTaskQueue(): void {
    if (this._taskQueue.length === 0) return;

    const batchSize = this._isThrottling ? 2 : 5;
    const tasksToProcess = this._taskQueue.splice(0, batchSize);

    tasksToProcess.forEach(({ fn }) => {
      try {
        fn();
      } catch (error) {
        this.emit('performance:task_error', { error });
      }
    });
  }

  // Request Batching Implementation
  private _initRequestBatching(): void {
    this._batchInterval = window.setInterval(() => {
      this._flushOldBatches();
    }, this._config.requestBatching.flushInterval);
  }

  addRequest(request: Omit<QueuedRequest, 'id' | 'timestamp'>): string {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: generateId(),
      timestamp: now(),
    };

    this._pendingRequests.push(queuedRequest);
    this._createOrUpdateBatch(queuedRequest);

    this.emit('performance:request_queued', { requestId: queuedRequest.id });
    return queuedRequest.id;
  }

  private _createOrUpdateBatch(request: QueuedRequest): void {
    // Find existing batch with same priority and space
    let targetBatch: RequestBatch | undefined;

    for (const batch of this._requestBatches.values()) {
      if (batch.priority === request.priority &&
          batch.requests.length < this._config.requestBatching.batchSize) {
        targetBatch = batch;
        break;
      }
    }

    if (!targetBatch) {
      targetBatch = {
        id: generateId(),
        requests: [],
        size: 0,
        priority: request.priority,
        createdAt: now(),
        flushAt: now() + this._config.requestBatching.flushInterval,
        compressed: this._config.requestBatching.compression,
      };
      this._requestBatches.set(targetBatch.id, targetBatch);
    }

    targetBatch.requests.push(request);
    targetBatch.size += JSON.stringify(request.data).length;

    if (targetBatch.requests.length >= this._config.requestBatching.batchSize) {
      this.flushBatch(targetBatch.id);
    }
  }

  async flushBatch(batchId?: string): Promise<void> {
    if (batchId) {
      const batch = this._requestBatches.get(batchId);
      if (batch) {
        await this._sendBatch(batch);
        this._requestBatches.delete(batchId);
      }
    } else {
      // Flush all batches
      const flushPromises = Array.from(this._requestBatches.values())
        .map(batch => this._sendBatch(batch));

      await Promise.all(flushPromises);
      this._requestBatches.clear();
    }

    this._lastFlush = now();
  }

  private async _sendBatch(batch: RequestBatch): Promise<void> {
    try {
      // Simulate batch sending (in real implementation, this would use fetch)
      this.emit('performance:batch_sent', {
        batchId: batch.id,
        requestCount: batch.requests.length,
        size: batch.size
      });
    } catch (error) {
      this.emit('performance:batch_error', { batchId: batch.id, error });
    }
  }

  private _flushOldBatches(): void {
    const currentTime = now();
    for (const [id, batch] of this._requestBatches) {
      if (currentTime >= batch.flushAt) {
        this.flushBatch(id);
      }
    }
  }

  getBatchStatus(): RequestBatch[] {
    return Array.from(this._requestBatches.values());
  }

  // Core Web Vitals Implementation
  private _initCoreWebVitals(): void {
    if (!isBrowser() || !this._config.coreWebVitals.monitoring) return;

    this._observeCoreWebVitals();
  }

  private _observeCoreWebVitals(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      // Observe LCP
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this._coreWebVitals.lcp = lastEntry.startTime;
          this._updateCoreWebVitals();
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch {
        // Fallback for browsers that don't support LCP
      }

      // Observe FID
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.processingStart - entry.startTime > 0) {
              this._coreWebVitals.fid = entry.processingStart - entry.startTime;
              this._updateCoreWebVitals();
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch {
        // Fallback for browsers that don't support FID
      }

      // Observe CLS
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this._coreWebVitals.cls = clsValue;
          this._updateCoreWebVitals();
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch {
        // Fallback for browsers that don't support CLS
      }
    }
  }

  private _updateCoreWebVitals(): void {
    this._vitalsHistory.push({ ...this._coreWebVitals });
    if (this._vitalsHistory.length > 50) {
      this._vitalsHistory = this._vitalsHistory.slice(-50);
    }

    this.emit('performance:core_web_vitals_updated', this._coreWebVitals);
  }

  async measureCoreWebVitals(): Promise<CoreWebVitalsObserver> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ...this._coreWebVitals });
      }, 100); // Small delay to ensure measurements are captured
    });
  }

  optimizeCoreWebVitals(): void {
    // LCP optimization
    if (this._coreWebVitals.lcp && this._coreWebVitals.lcp > this._thresholds.coreWebVitals.lcp) {
      this.preloadCriticalResources();
      this.emit('performance:lcp_optimization_applied');
    }

    // FID optimization
    if (this._coreWebVitals.fid && this._coreWebVitals.fid > this._thresholds.coreWebVitals.fid) {
      this.throttleCpu(true);
      this.emit('performance:fid_optimization_applied');
    }

    // CLS optimization
    if (this._coreWebVitals.cls && this._coreWebVitals.cls > this._thresholds.coreWebVitals.cls) {
      this.deferNonCriticalResources();
      this.emit('performance:cls_optimization_applied');
    }
  }

  getCoreWebVitalsReport(): CoreWebVitalsObserver {
    return { ...this._coreWebVitals };
  }

  // Resource Prioritization Implementation
  private _initResourcePrioritization(): void {
    // Register critical resources
    this._config.resourcePrioritization.criticalResources.forEach(resource => {
      this.prioritizeResource({
        resource,
        priority: 'critical',
        timing: 'preload',
      });
    });
  }

  prioritizeResource(resource: ResourcePriority): void {
    this._resourcePriorities.set(resource.resource, resource);

    if (resource.priority === 'critical') {
      this._criticalResources.add(resource.resource);
    }

    if (resource.timing === 'defer' || resource.timing === 'lazy') {
      this._preloadedResources.add(resource.resource);
    }

    this.emit('performance:resource_prioritized', { resource: resource.resource, priority: resource.priority });
  }

  async preloadCriticalResources(): Promise<void> {
    if (!isBrowser()) return;

    const preloadPromises: Promise<void>[] = [];

    for (const resource of this._criticalResources) {
      const priority = this._resourcePriorities.get(resource);
      if (priority?.timing === 'preload') {
        preloadPromises.push(this._preloadResource(resource));
      }
    }

    await Promise.all(preloadPromises);
    this.emit('performance:critical_resources_preloaded', { count: preloadPromises.length });
  }

  private async _preloadResource(resource: string): Promise<void> {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.onload = () => resolve();
      link.onerror = () => resolve(); // Don't fail on error
      document.head.appendChild(link);
    });
  }

  deferNonCriticalResources(): void {
    if (!isBrowser()) return;

    this._preloadedResources.forEach(resource => {
      const priority = this._resourcePriorities.get(resource);
      if (priority?.condition && !priority.condition()) {
        // Resource condition not met, keep deferred
        return;
      }

      // Load deferred resource
      this._loadDeferredResource(resource);
    });

    this.emit('performance:non_critical_resources_deferred');
  }

  private _loadDeferredResource(resource: string): void {
    // Simulate deferred loading
    requestIdleCallback(() => {
      this.emit('performance:deferred_resource_loaded', { resource });
    });
  }

  // Cross-Platform Implementation
  private _initCrossPlatform(): void {
    if (this._config.crossPlatform.universalPolyfills) {
      this.enableUniversalPolyfills();
    }
  }

  optimizeForPlatform(platform: string, framework?: string): void {
    this._currentPlatform = platform;
    this._currentFramework = framework;

    const optimization: PlatformOptimization = {
      platform,
      framework,
      optimizations: this._config.crossPlatform.frameworkOptimizations[platform] || {},
      polyfills: [],
      fallbacks: [],
    };

    this._platformOptimizations.set(platform, optimization);
    this.emit('performance:platform_optimized', { platform, framework });
  }

  enableUniversalPolyfills(): void {
    if (!isBrowser()) return;

    // Add common polyfills for universal compatibility
    const polyfills = [
      'requestIdleCallback',
      'IntersectionObserver',
      'PerformanceObserver',
      'ResizeObserver',
    ];

    polyfills.forEach(polyfill => {
      if (!(polyfill in window)) {
        this._addPolyfill(polyfill);
      }
    });

    this.emit('performance:universal_polyfills_enabled');
  }

  private _addPolyfill(name: string): void {
    switch (name) {
      case 'requestIdleCallback':
        if (!('requestIdleCallback' in window)) {
          (window as any).requestIdleCallback = (callback: Function) => {
            return setTimeout(callback, 0);
          };
        }
        break;
      // Add other polyfills as needed
    }
  }

  // Platform Detection
  private _detectPlatform(): void {
    if (!isBrowser()) {
      this._currentPlatform = 'server';
      return;
    }

    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('react')) {
      this._currentPlatform = 'react';
    } else if (userAgent.includes('vue')) {
      this._currentPlatform = 'vue';
    } else if (userAgent.includes('angular')) {
      this._currentPlatform = 'angular';
    } else {
      this._currentPlatform = 'vanilla';
    }

    this.optimizeForPlatform(this._currentPlatform);
  }

  private _measureInitialMetrics(): void {
    if (!isBrowser()) return;

    const startTime = now();

    // Measure DOM ready time
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this._metrics.domReady = now() - startTime;
      });
    } else {
      this._metrics.domReady = 0; // Already loaded
    }

    // Measure load time
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        this._metrics.loadTime = now() - startTime;
      });
    }

    // Use Performance API if available
    if ('performance' in window && performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry: any) => {
        if (entry.name === 'first-paint') {
          this._metrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          this._metrics.firstContentfulPaint = entry.startTime;
        }
      });
    }
  }

  // Monitoring Implementation
  startMonitoring(): void {
    if (this._isMonitoring) return;

    this._isMonitoring = true;
    this._monitoringInterval = window.setInterval(() => {
      this._collectMetrics();
    }, 5000); // Collect metrics every 5 seconds

    this.emit('performance:monitoring_started');
  }

  stopMonitoring(): void {
    if (!this._isMonitoring) return;

    this._isMonitoring = false;
    if (this._monitoringInterval) {
      clearInterval(this._monitoringInterval);
      this._monitoringInterval = undefined;
    }

    this.emit('performance:monitoring_stopped');
  }

  private _collectMetrics(): void {
    // Update memory usage
    const memorySnapshot = this.getMemoryUsage();
    if (this._metrics.memoryUsage) {
      this._metrics.memoryUsage.used = memorySnapshot.heapUsed;
      this._metrics.memoryUsage.total = memorySnapshot.heapTotal;
    }

    // Update CPU usage
    const cpuProfile = this.getCpuUsage();
    this._metrics.cpuUsage = cpuProfile.usage;

    // Emit metrics update
    this.emit('performance:metrics_updated', this._metrics);
  }

  getMetrics(): PerformanceMetrics {
    return { ...this._metrics };
  }

  getThresholds(): PerformanceThresholds {
    return { ...this._thresholds };
  }

  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this._thresholds = { ...this._thresholds, ...thresholds };
    this.emit('performance:thresholds_updated', this._thresholds);
  }

  getOptimizationReport(): PerformanceOptimizationReport {
    const violations = this._detectViolations();
    const recommendations = this._generateRecommendations();
    const score = this._calculatePerformanceScore();
    const grade = this._getPerformanceGrade(score);

    return {
      timestamp: now(),
      metrics: this._metrics,
      thresholds: this._thresholds,
      violations,
      optimizations: recommendations,
      score,
      grade,
    };
  }

  private _detectViolations(): PerformanceViolation[] {
    const violations: PerformanceViolation[] = [];

    // Memory violations
    if (this._metrics.memoryUsage && this._metrics.memoryUsage.used > this._thresholds.memory.critical * 1024 * 1024) {
      violations.push({
        type: 'memory',
        severity: 'critical',
        message: 'Memory usage exceeds critical threshold',
        value: this._metrics.memoryUsage.used,
        threshold: this._thresholds.memory.critical * 1024 * 1024,
        timestamp: now(),
      });
    }

    // CPU violations
    if (this._metrics.cpuUsage && this._metrics.cpuUsage > this._thresholds.cpu.critical) {
      violations.push({
        type: 'cpu',
        severity: 'critical',
        message: 'CPU usage exceeds critical threshold',
        value: this._metrics.cpuUsage,
        threshold: this._thresholds.cpu.critical,
        timestamp: now(),
      });
    }

    // Core Web Vitals violations
    if (this._coreWebVitals.lcp && this._coreWebVitals.lcp > this._thresholds.coreWebVitals.lcp) {
      violations.push({
        type: 'core-web-vitals',
        severity: 'high',
        message: 'Largest Contentful Paint exceeds threshold',
        value: this._coreWebVitals.lcp,
        threshold: this._thresholds.coreWebVitals.lcp,
        timestamp: now(),
      });
    }

    return violations;
  }

  private _generateRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Memory recommendations
    if (this._detectedLeaks.length > 0) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'Memory leaks detected - enable garbage collection',
        impact: 'high',
        effort: 'low',
        action: () => this.forceGarbageCollection(),
      });
    }

    // Lazy loading recommendations
    if (this._loadedModules.size < this._lazyModules.size / 2) {
      recommendations.push({
        type: 'lazy-loading',
        priority: 'medium',
        message: 'Enable lazy loading for better performance',
        impact: 'medium',
        effort: 'low',
        action: () => this.preloadModules(Array.from(this._lazyModules.keys())),
      });
    }

    return recommendations;
  }

  private _calculatePerformanceScore(): number {
    let score = 100;

    // Deduct points for violations
    const violations = this._detectViolations();
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical': score -= 20; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    // Deduct points for poor metrics
    if (this._coreWebVitals.lcp && this._coreWebVitals.lcp > 4000) score -= 10;
    if (this._coreWebVitals.fid && this._coreWebVitals.fid > 300) score -= 10;
    if (this._coreWebVitals.cls && this._coreWebVitals.cls > 0.25) score -= 10;

    return Math.max(0, score);
  }

  private _getPerformanceGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}
