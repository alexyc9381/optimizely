import express from 'express';
import { redisManager } from '../services/redis-client';
import { cacheService } from '../services/cache-service';
import { sessionManager } from '../services/session-manager';
import { eventManager } from '../services/event-manager';

const router = express.Router();

/**
 * Redis Cache Statistics
 * GET /api/v1/redis/cache/stats
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = await cacheService.getCacheStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        memoryUsageMB: Math.round(stats.memoryUsage / 1024 / 1024 * 100) / 100
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Clear Cache by Tags
 * DELETE /api/v1/redis/cache/tags
 */
router.delete('/cache/tags', async (req, res) => {
  try {
    const { tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        error: 'Tags array is required'
      });
    }
    
    await cacheService.invalidateByTags(tags);
    
    res.json({
      success: true,
      message: `Cache invalidated for tags: ${tags.join(', ')}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Session Analytics
 * GET /api/v1/redis/sessions/analytics
 */
router.get('/sessions/analytics', async (req, res) => {
  try {
    const analytics = await sessionManager.getSessionAnalytics();
    
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get session analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Active B2B Sessions
 * GET /api/v1/redis/sessions/b2b/active
 */
router.get('/sessions/b2b/active', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const sessions = await sessionManager.getActiveB2BSessions(limit);
    
    res.json({
      success: true,
      data: sessions,
      count: sessions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get active B2B sessions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Session Details by ID
 * GET /api/v1/redis/sessions/:sessionId
 */
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionManager.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      data: session,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Event Statistics
 * GET /api/v1/redis/events/stats
 */
router.get('/events/stats', async (req, res) => {
  try {
    const stats = await eventManager.getEventStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get event statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Recent Events
 * GET /api/v1/redis/events/recent
 */
router.get('/events/recent', async (req, res) => {
  try {
    const eventType = req.query.type as string;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const events = await eventManager.getRecentEvents(eventType, limit);
    
    res.json({
      success: true,
      data: events,
      count: events.length,
      filters: {
        type: eventType || 'all',
        limit
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get recent events',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Redis Health Check
 * GET /api/v1/redis/health
 */
router.get('/health', async (req, res) => {
  try {
    const [redisHealth, eventHealth] = await Promise.all([
      redisManager.healthCheck(),
      eventManager.healthCheck()
    ]);
    
    const isHealthy = redisHealth.status === 'healthy' && eventHealth.status === 'healthy';
    
    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'degraded',
      services: {
        redis: redisHealth,
        events: eventHealth
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Cache Cleanup
 * POST /api/v1/redis/cache/cleanup
 */
router.post('/cache/cleanup', async (req, res) => {
  try {
    await Promise.all([
      cacheService.cleanupExpiredCache(),
      sessionManager.cleanupExpiredSessions()
    ]);
    
    res.json({
      success: true,
      message: 'Cache cleanup completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Cache cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 