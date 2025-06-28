import express from 'express';
import rateLimit from 'express-rate-limit';
import { redisManager } from '../services/redis-client';
import UniversalAnalyticsPlatformIntegrationService from '../services/universal-analytics-platform-integration-service';

const router = express.Router();

// Initialize service
const service = new UniversalAnalyticsPlatformIntegrationService(redisManager.getClient());

// Rate limiting
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP'
}) as any;

const strictLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many requests for this endpoint'
}) as any;

// =============================================================================
// PLATFORM MANAGEMENT ROUTES
// =============================================================================

/**
 * @route GET /api/universal-analytics/platforms
 * @desc Get all connected analytics platforms
 */
router.get('/platforms', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const platforms = await service.getPlatforms();
    res.json({
      success: true,
      data: platforms,
      count: platforms.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/universal-analytics/platforms/:id
 * @desc Get specific analytics platform
 */
router.get('/platforms/:id', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const platform = await service.getPlatform(req.params.id);
    if (!platform) {
      return res.status(404).json({
        success: false,
        error: 'Platform not found'
      });
    }
    res.json({
      success: true,
      data: platform
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/universal-analytics/platforms
 * @desc Add new analytics platform
 */
router.post('/platforms', strictLimit, async (req: express.Request, res: express.Response) => {
  try {
    const {
      name,
      type,
      version,
      isActive,
      credentials,
      config
    } = req.body;

    // Validation
    if (!name || !type || !credentials || !config) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, credentials, config'
      });
    }

    const supportedTypes = ['google_analytics', 'adobe_analytics', 'facebook_analytics', 'mixpanel', 'amplitude', 'custom'];
    if (!supportedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported platform type. Supported types: ${supportedTypes.join(', ')}`
      });
    }

    const platformId = await service.addPlatform({
      name,
      type,
      version: version || '1.0',
      isActive: isActive !== false,
      credentials,
      config,
      syncStatus: 'disconnected'
    });

    res.status(201).json({
      success: true,
      data: {
        platformId,
        message: 'Platform added successfully'
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route PUT /api/universal-analytics/platforms/:id
 * @desc Update analytics platform
 */
router.put('/platforms/:id', strictLimit, async (req: express.Request, res: express.Response) => {
  try {
    await service.updatePlatform(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Platform updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/universal-analytics/platforms/:id
 * @desc Remove analytics platform
 */
router.delete('/platforms/:id', strictLimit, async (req: express.Request, res: express.Response) => {
  try {
    await service.removePlatform(req.params.id);
    res.json({
      success: true,
      message: 'Platform removed successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// DATA PIPELINE ROUTES
// =============================================================================

/**
 * @route GET /api/universal-analytics/pipelines
 * @desc Get all data pipelines
 */
router.get('/pipelines', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const pipelines = await service.getDataPipelines();
    res.json({
      success: true,
      data: pipelines,
      count: pipelines.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/universal-analytics/pipelines
 * @desc Create new data pipeline
 */
router.post('/pipelines', strictLimit, async (req: express.Request, res: express.Response) => {
  try {
    const {
      name,
      sourceId,
      destinationIds,
      transformations,
      schedule
    } = req.body;

    // Validation
    if (!name || !sourceId || !destinationIds || !schedule) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, sourceId, destinationIds, schedule'
      });
    }

    if (!Array.isArray(destinationIds) || destinationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'destinationIds must be a non-empty array'
      });
    }

    const pipelineId = await service.createDataPipeline({
      name,
      sourceId,
      destinationIds,
      status: 'active',
      transformations: transformations || [],
      schedule
    });

    res.status(201).json({
      success: true,
      data: {
        pipelineId,
        message: 'Pipeline created successfully'
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route PUT /api/universal-analytics/pipelines/:id
 * @desc Update data pipeline
 */
router.put('/pipelines/:id', strictLimit, async (req: express.Request, res: express.Response) => {
  try {
    await service.updateDataPipeline(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Pipeline updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// DATA SYNCHRONIZATION ROUTES
// =============================================================================

/**
 * @route POST /api/universal-analytics/sync/:platformId
 * @desc Trigger manual sync for specific platform
 */
router.post('/sync/:platformId', strictLimit, async (req: express.Request, res: express.Response) => {
  try {
    const result = await service.syncPlatformData(req.params.platformId);
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/universal-analytics/sync
 * @desc Trigger sync for all active platforms
 */
router.post('/sync', strictLimit, async (req: express.Request, res: express.Response) => {
  try {
    const platforms = await service.getPlatforms();
    const activePlatforms = platforms.filter(p => p.isActive && p.syncStatus === 'connected');

    const syncPromises = activePlatforms.map(platform =>
      service.syncPlatformData(platform.id)
        .catch(error => ({ platformId: platform.id, error: error.message }))
    );

    const results = await Promise.all(syncPromises);

    res.json({
      success: true,
      data: {
        totalPlatforms: activePlatforms.length,
        results
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// DATA ACCESS ROUTES
// =============================================================================

/**
 * @route GET /api/universal-analytics/data
 * @desc Get universal analytics data with filtering
 */
router.get('/data', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const {
      platformIds,
      dataTypes,
      startDate,
      endDate,
      limit
    } = req.query;

    const filters: any = {};

    if (platformIds) {
      filters.platformIds = Array.isArray(platformIds) ? platformIds : [platformIds];
    }

    if (dataTypes) {
      filters.dataTypes = Array.isArray(dataTypes) ? dataTypes : [dataTypes];
    }

    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }

    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    if (limit) {
      filters.limit = parseInt(limit as string, 10);
    }

    const data = await service.getUniversalData(filters);

    res.json({
      success: true,
      data,
      count: data.length,
      filters
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/universal-analytics/data/realtime
 * @desc Get real-time analytics data
 */
router.get('/data/realtime', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const filters = {
      startDate: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
      limit: 1000
    };

    const data = await service.getUniversalData(filters);

    // Group by platform for real-time overview
    const platformSummary = data.reduce((acc: any, item) => {
      if (!acc[item.platformId]) {
        acc[item.platformId] = {
          platformId: item.platformId,
          totalEvents: 0,
          latestTimestamp: item.timestamp,
          dataTypes: new Set()
        };
      }

      acc[item.platformId].totalEvents++;
      acc[item.platformId].dataTypes.add(item.dataType);

      if (item.timestamp > acc[item.platformId].latestTimestamp) {
        acc[item.platformId].latestTimestamp = item.timestamp;
      }

      return acc;
    }, {});

    // Convert Set to Array for JSON serialization
    Object.values(platformSummary).forEach((summary: any) => {
      summary.dataTypes = Array.from(summary.dataTypes);
    });

    res.json({
      success: true,
      data: {
        realtimeData: data,
        platformSummary: Object.values(platformSummary),
        totalEvents: data.length,
        timeRange: filters
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// ANALYTICS & REPORTING ROUTES
// =============================================================================

/**
 * @route GET /api/universal-analytics/analytics/summary
 * @desc Get analytics summary across all platforms
 */
router.get('/analytics/summary', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Default: last 7 days
      endDate = new Date().toISOString()
    } = req.query;

    const data = await service.getUniversalData({
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string)
    });

    // Calculate summary metrics
    const summary = {
      totalEvents: data.length,
      platformsActive: new Set(data.map(d => d.platformId)).size,
      dataTypeBreakdown: data.reduce((acc: any, item) => {
        acc[item.dataType] = (acc[item.dataType] || 0) + 1;
        return acc;
      }, {}),
      hourlyTrends: data.reduce((acc: any, item) => {
        const hour = new Date(item.timestamp).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {}),
      platformBreakdown: data.reduce((acc: any, item) => {
        acc[item.platformId] = (acc[item.platformId] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: summary,
      period: {
        startDate,
        endDate
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// HEALTH & STATUS ROUTES
// =============================================================================

/**
 * @route GET /api/universal-analytics/health
 * @desc Get service health status
 */
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const health = await service.getHealthStatus();
    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/universal-analytics/status
 * @desc Get detailed service status
 */
router.get('/status', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const platforms = await service.getPlatforms();
    const pipelines = await service.getDataPipelines();
    const health = await service.getHealthStatus();

    const status = {
      service: {
        status: health.status,
        uptime: process.uptime(),
        version: '1.0.0',
        timestamp: new Date()
      },
      platforms: {
        total: platforms.length,
        active: platforms.filter(p => p.isActive).length,
        connected: platforms.filter(p => p.syncStatus === 'connected').length,
        error: platforms.filter(p => p.syncStatus === 'error').length,
        breakdown: platforms.reduce((acc: any, p) => {
          acc[p.type] = (acc[p.type] || 0) + 1;
          return acc;
        }, {})
      },
      pipelines: {
        total: pipelines.length,
        active: pipelines.filter(p => p.status === 'active').length,
        error: pipelines.filter(p => p.status === 'error').length,
        totalProcessedRecords: pipelines.reduce((sum, p) => sum + p.processedRecords, 0),
        totalErrors: pipelines.reduce((sum, p) => sum + p.errorCount, 0)
      }
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
