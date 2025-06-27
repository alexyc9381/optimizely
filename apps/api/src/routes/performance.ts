import { NextFunction, Request, Response, Router } from 'express';
import Redis from 'ioredis';
import PerformanceOptimizer from '../services/performance-optimizer';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      performanceOptimizer?: PerformanceOptimizer;
    }
  }
}

const router = Router();

// Initialize performance optimizer
let performanceOptimizer: PerformanceOptimizer;

const initializePerformanceOptimizer = () => {
  if (!performanceOptimizer) {
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
    });

    performanceOptimizer = new PerformanceOptimizer(redis, {
      performanceTargets: {
        responseTime: 500,
        memoryUsage: 512,
        cacheHitRate: 85,
        errorRate: 1
      }
    });

    performanceOptimizer.initialize().catch(console.error);
  }
  return performanceOptimizer;
};

// Middleware to ensure performance optimizer is initialized
const ensurePerformanceOptimizer = (req: Request, res: Response, next: NextFunction) => {
  req.performanceOptimizer = initializePerformanceOptimizer();
  next();
};

// Apply middleware
router.use(ensurePerformanceOptimizer);

/**
 * @route GET /api/performance/metrics
 * @desc Get current performance metrics
 * @access Public
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const optimizer = req.performanceOptimizer as PerformanceOptimizer;
    const currentMetrics = optimizer.getCurrentMetrics();
    const allMetrics = optimizer.getPerformanceMetrics();

    res.json({
      success: true,
      data: {
        current: currentMetrics,
        history: allMetrics.slice(-20), // Last 20 metrics
        summary: {
          averageResponseTime: allMetrics.length > 0
            ? allMetrics.reduce((sum, m) => sum + m.responseTime, 0) / allMetrics.length
            : 0,
          averageCacheHitRate: allMetrics.length > 0
            ? allMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / allMetrics.length
            : 0,
          totalRequests: allMetrics.length > 0
            ? allMetrics[allMetrics.length - 1].throughput
            : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/performance/config
 * @desc Get current optimization configuration
 * @access Public
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const optimizer = req.performanceOptimizer as PerformanceOptimizer;
    const config = optimizer.getOptimizationConfig();

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route PUT /api/performance/config
 * @desc Update optimization configuration
 * @access Public
 */
router.put('/config', async (req: Request, res: Response) => {
  try {
    const optimizer = req.performanceOptimizer as PerformanceOptimizer;
    const updates = req.body;

    // Validate configuration updates
    if (updates.performanceTargets) {
      const { responseTime, memoryUsage, cacheHitRate, errorRate } = updates.performanceTargets;

      if (responseTime && (responseTime < 100 || responseTime > 5000)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid response time target (must be between 100-5000ms)'
        });
      }

      if (cacheHitRate && (cacheHitRate < 0 || cacheHitRate > 100)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid cache hit rate target (must be between 0-100%)'
        });
      }
    }

    optimizer.updateConfig(updates);

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: optimizer.getOptimizationConfig()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/performance/personalization/optimize
 * @desc Optimize personalization response
 * @access Public
 */
router.post('/personalization/optimize', async (req: Request, res: Response) => {
  try {
    const optimizer = req.performanceOptimizer as PerformanceOptimizer;
    const { userId, profileData } = req.body;

    if (!userId || !profileData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId and profileData'
      });
    }

    const result = await optimizer.optimizePersonalizationResponse(userId, profileData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to optimize personalization response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/performance/resource-script/:platform
 * @desc Generate optimized resource loading script for platform
 * @access Public
 */
router.get('/resource-script/:platform', async (req: Request, res: Response) => {
  try {
    const optimizer = req.performanceOptimizer as PerformanceOptimizer;
    const { platform } = req.params;

    const supportedPlatforms = ['wordpress', 'shopify', 'react', 'vue', 'angular', 'static'];

    if (!supportedPlatforms.includes(platform.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Unsupported platform. Supported platforms: ${supportedPlatforms.join(', ')}`
      });
    }

    const script = optimizer.generateResourceLoadingScript(platform);

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('X-Platform', platform);

    res.send(script);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate resource loading script',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/performance/cache/stats
 * @desc Get cache performance statistics
 * @access Public
 */
router.get('/cache/stats', async (req: Request, res: Response) => {
  try {
    const optimizer = req.performanceOptimizer as PerformanceOptimizer;
    const metrics = optimizer.getCurrentMetrics();
    const config = optimizer.getOptimizationConfig();

    res.json({
      success: true,
      data: {
        hitRate: metrics?.cacheHitRate || 0,
        configuration: config.cache,
        performance: {
          averageResponseTime: metrics?.responseTime || 0,
          memoryUsage: metrics?.memoryUsage || 0,
          lastUpdated: metrics?.timestamp || Date.now()
        },
        targets: config.performanceTargets
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/performance/cache/clear
 * @desc Clear all performance caches
 * @access Public
 */
router.post('/cache/clear', async (req: Request, res: Response) => {
  try {
    const optimizer = req.performanceOptimizer as PerformanceOptimizer;
    await optimizer.clearCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/performance/health
 * @desc Get performance health status
 * @access Public
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const optimizer = req.performanceOptimizer as PerformanceOptimizer;
    const metrics = optimizer.getCurrentMetrics();
    const config = optimizer.getOptimizationConfig();
    const targets = config.performanceTargets;

    if (!metrics) {
      return res.status(503).json({
        success: false,
        error: 'Performance metrics not available'
      });
    }

    const health = {
      status: 'healthy' as 'healthy' | 'warning' | 'critical',
      checks: {
        responseTime: {
          value: metrics.responseTime,
          target: targets.responseTime,
          status: metrics.responseTime <= targets.responseTime ? 'pass' :
                 metrics.responseTime <= targets.responseTime * 1.5 ? 'warning' : 'fail'
        },
        cacheHitRate: {
          value: metrics.cacheHitRate,
          target: targets.cacheHitRate,
          status: metrics.cacheHitRate >= targets.cacheHitRate ? 'pass' :
                 metrics.cacheHitRate >= targets.cacheHitRate * 0.8 ? 'warning' : 'fail'
        },
        memoryUsage: {
          value: metrics.memoryUsage,
          target: targets.memoryUsage,
          status: metrics.memoryUsage <= targets.memoryUsage ? 'pass' :
                 metrics.memoryUsage <= targets.memoryUsage * 1.2 ? 'warning' : 'fail'
        },
        errorRate: {
          value: metrics.errorRate,
          target: targets.errorRate,
          status: metrics.errorRate <= targets.errorRate ? 'pass' :
                 metrics.errorRate <= targets.errorRate * 2 ? 'warning' : 'fail'
        }
      },
      timestamp: metrics.timestamp
    };

    // Determine overall health status
    const failedChecks = Object.values(health.checks).filter(check => check.status === 'fail');
    const warningChecks = Object.values(health.checks).filter(check => check.status === 'warning');

    if (failedChecks.length > 0) {
      health.status = 'critical';
    } else if (warningChecks.length > 0) {
      health.status = 'warning';
    }

    const statusCode = health.status === 'critical' ? 503 :
                      health.status === 'warning' ? 200 : 200;

    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve health status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/performance/optimization-report
 * @desc Generate comprehensive optimization report
 * @access Public
 */
router.get('/optimization-report', async (req: Request, res: Response) => {
  try {
    const optimizer = req.performanceOptimizer as PerformanceOptimizer;
    const metrics = optimizer.getPerformanceMetrics();
    const config = optimizer.getOptimizationConfig();
    const current = optimizer.getCurrentMetrics();

    if (metrics.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No performance data available'
      });
    }

    // Calculate trends
    const recentMetrics = metrics.slice(-20);
    const olderMetrics = metrics.slice(-40, -20);

    const trends = {
      responseTime: {
        current: current?.responseTime || 0,
        average: recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length,
        trend: olderMetrics.length > 0
          ? ((recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length) -
             (olderMetrics.reduce((sum, m) => sum + m.responseTime, 0) / olderMetrics.length))
          : 0
      },
      cacheHitRate: {
        current: current?.cacheHitRate || 0,
        average: recentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / recentMetrics.length,
        trend: olderMetrics.length > 0
          ? ((recentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / recentMetrics.length) -
             (olderMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / olderMetrics.length))
          : 0
      }
    };

    // Generate recommendations
    const recommendations = [];

    if (trends.responseTime.current > config.performanceTargets.responseTime) {
      recommendations.push({
        type: 'response_time',
        priority: 'high',
        message: 'Consider enabling more aggressive caching or CDN',
        impact: 'High performance improvement expected'
      });
    }

    if (trends.cacheHitRate.current < config.performanceTargets.cacheHitRate) {
      recommendations.push({
        type: 'cache_optimization',
        priority: 'medium',
        message: 'Review cache TTL settings and cache key strategies',
        impact: 'Medium performance improvement expected'
      });
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalMetricsCollected: metrics.length,
          currentStatus: current,
          configuredTargets: config.performanceTargets,
          optimizationsEnabled: {
            lazyLoading: config.lazyLoading,
            codeSplitting: config.codeSplitting,
            resourcePrioritization: config.resourcePrioritization,
            caching: config.cache,
            cdn: config.cdn.enabled
          }
        },
        trends,
        recommendations,
        generatedAt: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate optimization report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
