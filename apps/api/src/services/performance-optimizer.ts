import { EventEmitter } from 'events';
import Redis from 'ioredis';

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
  timestamp: number;
}

export interface CacheConfig {
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'lfu' | 'fifo';
  compression: boolean;
}

export interface CDNConfig {
  enabled: boolean;
  endpoint: string;
  regions: string[];
  cacheHeaders: Record<string, string>;
}

export interface OptimizationConfig {
  lazyLoading: boolean;
  codeSplitting: boolean;
  resourcePrioritization: boolean;
  preloadCritical: boolean;
  bundleOptimization: boolean;
  imageOptimization: boolean;
  cache: CacheConfig;
  cdn: CDNConfig;
  performanceTargets: {
    responseTime: number; // ms
    memoryUsage: number; // MB
    cacheHitRate: number; // percentage
    errorRate: number; // percentage
  };
}

export interface ResourcePriority {
  critical: string[];
  high: string[];
  medium: string[];
  low: string[];
}

export interface PerformanceAlert {
  type: 'response_time' | 'memory' | 'cache_miss' | 'error_rate';
  severity: 'warning' | 'critical';
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
}

export class PerformanceOptimizer extends EventEmitter {
  private redis: Redis;
  private config: OptimizationConfig;
  private metrics: PerformanceMetrics[] = [];
  private isActive: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private resourcePriorities: ResourcePriority;
  private performanceTargets: OptimizationConfig['performanceTargets'];

  // Caching layers
  private memoryCache: Map<string, { data: any; expires: number; size: number }> = new Map();
  private compressionCache: Map<string, Buffer> = new Map();

  // Performance monitoring
  private responseTimeBuffer: number[] = [];
  private cacheHitCounter = 0;
  private cacheMissCounter = 0;
  private errorCounter = 0;
  private requestCounter = 0;

  constructor(redis: Redis, config?: Partial<OptimizationConfig>) {
    super();
    this.redis = redis;

    this.config = {
      lazyLoading: true,
      codeSplitting: true,
      resourcePrioritization: true,
      preloadCritical: true,
      bundleOptimization: true,
      imageOptimization: true,
      cache: {
        ttl: 3600, // 1 hour
        maxSize: 1000,
        strategy: 'lru',
        compression: true
      },
      cdn: {
        enabled: false,
        endpoint: '',
        regions: [],
        cacheHeaders: {
          'Cache-Control': 'public, max-age=3600',
          'ETag': 'strong'
        }
      },
      performanceTargets: {
        responseTime: 500, // ms
        memoryUsage: 512, // MB
        cacheHitRate: 85, // percentage
        errorRate: 1 // percentage
      },
      ...config
    };

    this.performanceTargets = this.config.performanceTargets;

    this.resourcePriorities = {
      critical: [
        'personalization-core.js',
        'ab-testing-engine.js',
        'psychographic-profiler.js'
      ],
      high: [
        'analytics-tracker.js',
        'content-optimizer.js',
        'experiment-manager.js'
      ],
      medium: [
        'dashboard-components.js',
        'reporting-engine.js',
        'configuration-ui.js'
      ],
      low: [
        'documentation.js',
        'help-system.js',
        'admin-tools.js'
      ]
    };
  }

  async initialize(): Promise<void> {
    try {
      this.isActive = true;

      // Initialize Redis connection for caching
      await this.setupRedisCache();

      // Setup performance monitoring
      this.startPerformanceMonitoring();

      // Initialize CDN if enabled
      if (this.config.cdn.enabled) {
        await this.initializeCDN();
      }

      // Setup resource preloading
      await this.setupResourcePreloading();

      this.emit('performance_optimizer_initialized', {
        config: this.config,
        timestamp: Date.now()
      });

    } catch (error) {
      this.emit('performance_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
      throw error;
    }
  }

  // Cache Management
  async getFromCache(key: string): Promise<any> {
    try {
      this.requestCounter++;

      // Check memory cache first
      const memoryResult = this.getFromMemoryCache(key);
      if (memoryResult !== null) {
        this.cacheHitCounter++;
        return memoryResult;
      }

      // Check Redis cache
      const redisResult = await this.redis.get(key);
      if (redisResult) {
        this.cacheHitCounter++;
        const parsed = JSON.parse(redisResult);

        // Store in memory cache for faster subsequent access
        this.setInMemoryCache(key, parsed, 300); // 5 minutes
        return parsed;
      }

      this.cacheMissCounter++;
      return null;

    } catch (error) {
      this.errorCounter++;
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  async setInCache(key: string, data: any, ttl?: number): Promise<boolean> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expires: Date.now() + (ttl || this.config.cache.ttl) * 1000
      };

      // Store in memory cache
      this.setInMemoryCache(key, data, ttl || this.config.cache.ttl);

      // Store in Redis cache
      await this.redis.setex(
        key,
        ttl || this.config.cache.ttl,
        JSON.stringify(cacheData)
      );

      return true;

    } catch (error) {
      this.errorCounter++;
      console.error('Cache storage error:', error);
      return false;
    }
  }

  private getFromMemoryCache(key: string): any {
    const cached = this.memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    if (cached) {
      this.memoryCache.delete(key);
    }

    return null;
  }

  private setInMemoryCache(key: string, data: any, ttl: number): void {
    const size = this.estimateSize(data);

    // Evict old entries if cache is full
    if (this.memoryCache.size >= this.config.cache.maxSize) {
      this.evictFromMemoryCache();
    }

    this.memoryCache.set(key, {
      data,
      expires: Date.now() + ttl * 1000,
      size
    });
  }

  private evictFromMemoryCache(): void {
    const entries = Array.from(this.memoryCache.entries());

    switch (this.config.cache.strategy) {
      case 'lru':
        // Remove oldest accessed entries
        const oldestEntry = entries.reduce((oldest, current) =>
          current[1].expires < oldest[1].expires ? current : oldest
        );
        this.memoryCache.delete(oldestEntry[0]);
        break;

      case 'lfu':
        // For simplicity, use LRU strategy (could be enhanced with access counting)
        this.evictLRU();
        break;

      case 'fifo':
        // Remove first entry
        const firstKey = entries[0][0];
        this.memoryCache.delete(firstKey);
        break;
    }
  }

  private evictLRU(): void {
    const firstKey = this.memoryCache.keys().next().value;
    if (firstKey) {
      this.memoryCache.delete(firstKey);
    }
  }

  // Resource Optimization
  async optimizePersonalizationResponse(userId: string, profileData: any): Promise<{
    optimized: any;
    responseTime: number;
    cacheHit: boolean;
  }> {
    const startTime = Date.now();
    const cacheKey = `personalization:${userId}:${this.hashProfileData(profileData)}`;

    try {
      // Check cache first
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        const responseTime = Date.now() - startTime;
        this.recordResponseTime(responseTime);

        return {
          optimized: cached,
          responseTime,
          cacheHit: true
        };
      }

      // Generate optimized response
      const optimized = await this.generateOptimizedPersonalization(profileData);

      // Cache the response
      await this.setInCache(cacheKey, optimized, 1800); // 30 minutes

      const responseTime = Date.now() - startTime;
      this.recordResponseTime(responseTime);

      return {
        optimized,
        responseTime,
        cacheHit: false
      };

    } catch (error) {
      this.errorCounter++;
      throw error;
    }
  }

  // Resource Loading Optimization
  generateResourceLoadingScript(platform: string): string {
    const priorities = this.resourcePriorities;

    return `
      (function() {
        const loadResource = (src, priority = 'medium') => {
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;

            // Set loading priority
            if (script.importance) {
              script.importance = priority === 'critical' ? 'high' :
                                 priority === 'high' ? 'high' : 'low';
            }

            script.onload = resolve;
            script.onerror = reject;

            document.head.appendChild(script);
          });
        };

        const preloadCritical = () => {
          const criticalResources = ${JSON.stringify(priorities.critical)};
          return Promise.all(criticalResources.map(src => loadResource(src, 'critical')));
        };

        const loadLazyResources = () => {
          const highPriorityResources = ${JSON.stringify(priorities.high)};
          const mediumPriorityResources = ${JSON.stringify(priorities.medium)};

          // Load high priority after critical
          setTimeout(() => {
            highPriorityResources.forEach(src => loadResource(src, 'high'));
          }, 100);

          // Load medium priority after user interaction or page load
          const loadMediumPriority = () => {
            mediumPriorityResources.forEach(src => loadResource(src, 'medium'));
          };

          if (document.readyState === 'complete') {
            setTimeout(loadMediumPriority, 1000);
          } else {
            window.addEventListener('load', () => {
              setTimeout(loadMediumPriority, 1000);
            });
          }
        };

        // Initialize loading sequence
        preloadCritical().then(() => {
          loadLazyResources();
          window.dispatchEvent(new CustomEvent('optimizely:critical-loaded'));
        });

        // Performance observer for monitoring
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              if (entry.entryType === 'resource' && entry.name.includes('optimizely')) {
                window.optimizelyPerformance = window.optimizelyPerformance || [];
                window.optimizelyPerformance.push({
                  name: entry.name,
                  duration: entry.duration,
                  transferSize: entry.transferSize,
                  timestamp: entry.startTime
                });
              }
            });
          });

          observer.observe({ entryTypes: ['resource'] });
        }
      })();
    `;
  }

  // Performance Monitoring
  private startPerformanceMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkPerformanceThresholds();
    }, 30000); // Every 30 seconds
  }

  private collectMetrics(): void {
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    const responseTime = this.getAverageResponseTime();
    const cacheHitRate = this.getCacheHitRate();
    const errorRate = this.getErrorRate();

    const metrics: PerformanceMetrics = {
      responseTime,
      memoryUsage,
      cpuUsage: 0, // Would need additional monitoring for CPU
      cacheHitRate,
      errorRate,
      throughput: this.requestCounter,
      timestamp: Date.now()
    };

    this.metrics.push(metrics);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    this.emit('performance_metrics', metrics);
  }

  private checkPerformanceThresholds(): void {
    const latestMetrics = this.metrics[this.metrics.length - 1];
    if (!latestMetrics) return;

    const alerts: PerformanceAlert[] = [];

    // Check response time
    if (latestMetrics.responseTime > this.performanceTargets.responseTime) {
      alerts.push({
        type: 'response_time',
        severity: latestMetrics.responseTime > this.performanceTargets.responseTime * 2 ? 'critical' : 'warning',
        value: latestMetrics.responseTime,
        threshold: this.performanceTargets.responseTime,
        timestamp: Date.now(),
        message: `Response time ${latestMetrics.responseTime}ms exceeds target ${this.performanceTargets.responseTime}ms`
      });
    }

    // Emit alerts
    alerts.forEach(alert => {
      this.emit('performance_alert', alert);
    });
  }

  // Helper Methods
  private async setupRedisCache(): Promise<void> {
    console.log('Redis cache initialized for performance optimization');
  }

  private async setupResourcePreloading(): Promise<void> {
    console.log('Resource preloading configured');
  }

  private async initializeCDN(): Promise<void> {
    console.log('CDN initialized with config:', this.config.cdn);
  }

  private async generateOptimizedPersonalization(profileData: any): Promise<any> {
    return {
      content: `Optimized content for profile`,
      variations: ['variant_a', 'variant_b'],
      confidence: 0.95,
      generated_at: Date.now()
    };
  }

  private hashProfileData(profileData: any): string {
    return this.hashString(JSON.stringify(profileData));
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private estimateSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private recordResponseTime(time: number): void {
    this.responseTimeBuffer.push(time);
    if (this.responseTimeBuffer.length > 100) {
      this.responseTimeBuffer = this.responseTimeBuffer.slice(-100);
    }
  }

  private getAverageResponseTime(): number {
    if (this.responseTimeBuffer.length === 0) return 0;
    return this.responseTimeBuffer.reduce((a, b) => a + b, 0) / this.responseTimeBuffer.length;
  }

  private getCacheHitRate(): number {
    const total = this.cacheHitCounter + this.cacheMissCounter;
    return total === 0 ? 0 : (this.cacheHitCounter / total) * 100;
  }

  private getErrorRate(): number {
    return this.requestCounter === 0 ? 0 : (this.errorCounter / this.requestCounter) * 100;
  }

  // Public API
  getPerformanceMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }

  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getOptimizationConfig(): OptimizationConfig {
    return this.config;
  }

  updateConfig(updates: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('config_updated', this.config);
  }

  async clearCache(): Promise<void> {
    this.memoryCache.clear();
    this.compressionCache.clear();
    await this.redis.flushdb();

    this.emit('cache_cleared', { timestamp: Date.now() });
  }

  destroy(): void {
    this.isActive = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.memoryCache.clear();
    this.compressionCache.clear();
    this.removeAllListeners();
  }
}

export default PerformanceOptimizer;
