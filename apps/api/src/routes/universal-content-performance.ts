import express from 'express';
import rateLimit from 'express-rate-limit';
import { redisManager } from '../services/redis-client';
import createUniversalContentPerformanceService from '../services/universal-content-performance-service';

const router = express.Router();

// Initialize service
const service = createUniversalContentPerformanceService(redisManager.getClient());

// Rate limiting
const contentPerformanceRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many content performance requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

const analyticsRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // limit analytics requests
  message: 'Too many analytics requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

// CONTENT MANAGEMENT ENDPOINTS

// Create new content
router.post('/content', contentPerformanceRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { title, type, url, authorId, category, tags, wordCount, readTime, metadata } = req.body;

    if (!title || !type || !url || !authorId || !category) {
      return res.status(400).json({
        error: 'Missing required fields: title, type, url, authorId, category'
      });
    }

    const contentId = await service.createContent({
      title,
      type,
      url,
      publishedAt: new Date(),
      authorId,
      category,
      tags: tags || [],
      wordCount,
      readTime,
      metadata: metadata || {}
    });

    res.status(201).json({
      success: true,
      contentId,
      message: 'Content created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create content',
      details: error.message
    });
  }
});

// Get content by ID
router.get('/content/:id', contentPerformanceRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const content = await service.getContent(req.params.id);

    if (!content) {
      return res.status(404).json({
        error: 'Content not found'
      });
    }

    res.json({
      success: true,
      content
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve content',
      details: error.message
    });
  }
});

// List content with filtering
router.get('/content', contentPerformanceRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { type, category, funnelStage, authorId, limit, offset } = req.query;

    const contents = await service.getContentList({
      type: type as string,
      category: category as string,
      funnelStage: funnelStage as string,
      authorId: authorId as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      contents,
      count: contents.length
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve content list',
      details: error.message
    });
  }
});

// ENGAGEMENT TRACKING ENDPOINTS

// Track content engagement
router.post('/engagement', contentPerformanceRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const {
      contentId,
      userId,
      sessionId,
      engagementType,
      value,
      sourceChannel,
      deviceType,
      location,
      referrer,
      campaignSource
    } = req.body;

    if (!contentId || !sessionId || !engagementType || !sourceChannel || !deviceType) {
      return res.status(400).json({
        error: 'Missing required fields: contentId, sessionId, engagementType, sourceChannel, deviceType'
      });
    }

    const engagementId = await service.trackEngagement({
      contentId,
      userId,
      sessionId,
      engagementType,
      value,
      sourceChannel,
      deviceType,
      location: location || {},
      referrer,
      campaignSource
    });

    res.status(201).json({
      success: true,
      engagementId,
      message: 'Engagement tracked successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to track engagement',
      details: error.message
    });
  }
});

// PERFORMANCE ANALYTICS ENDPOINTS

// Get content performance metrics
router.get('/performance/:contentId', analyticsRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { contentId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required query parameters: startDate, endDate'
      });
    }

    const performance = await service.calculateContentPerformance(
      contentId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    if (!performance) {
      return res.status(404).json({
        error: 'Content not found or no data available'
      });
    }

    res.json({
      success: true,
      performance
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to calculate performance metrics',
      details: error.message
    });
  }
});

// Get comprehensive content analytics
router.get('/analytics', analyticsRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate, contentType, category, limit } = req.query;

    const analytics = await service.getContentAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      contentType: contentType as string,
      category: category as string,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      analytics
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to generate analytics',
      details: error.message
    });
  }
});

// Get top performing content
router.get('/analytics/top-performers', analyticsRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate, limit = '10' } = req.query;

    const analytics = await service.getContentAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      topPerformers: analytics.topPerformingContent,
      totalContent: analytics.totalContent,
      averageScore: analytics.averagePerformanceScore
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve top performers',
      details: error.message
    });
  }
});

// Get content recommendations
router.get('/recommendations', analyticsRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate, contentType, category } = req.query;

    const analytics = await service.getContentAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      contentType: contentType as string,
      category: category as string
    });

    res.json({
      success: true,
      recommendations: analytics.recommendations,
      totalRecommendations: analytics.recommendations.length
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to generate recommendations',
      details: error.message
    });
  }
});

// ANALYTICS INSIGHTS ENDPOINTS

// Get content type breakdown
router.get('/analytics/content-types', analyticsRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate } = req.query;

    const analytics = await service.getContentAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json({
      success: true,
      contentByType: analytics.contentByType,
      contentByStage: analytics.contentByStage,
      totalContent: analytics.totalContent,
      activeContent: analytics.activeContent
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve content type analytics',
      details: error.message
    });
  }
});

// Get revenue attribution
router.get('/analytics/revenue', analyticsRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate, contentType } = req.query;

    const analytics = await service.getContentAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      contentType: contentType as string
    });

    // Calculate additional revenue metrics
    const topRevenueContent = analytics.topPerformingContent
      .sort((a, b) => b.attribution.totalRevenue - a.attribution.totalRevenue)
      .slice(0, 10);

    const revenueByContentType = analytics.topPerformingContent.reduce((acc, content) => {
      // Get content details to determine type
      const contentType = 'unknown'; // Would need to fetch content details
      acc[contentType] = (acc[contentType] || 0) + content.attribution.totalRevenue;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      totalRevenue: analytics.totalRevenue,
      totalConversions: analytics.totalConversions,
      averageOrderValue: analytics.totalConversions > 0
        ? analytics.totalRevenue / analytics.totalConversions
        : 0,
      topRevenueContent,
      revenueByContentType
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve revenue analytics',
      details: error.message
    });
  }
});

// BATCH OPERATIONS

// Bulk track engagements
router.post('/engagement/bulk', contentPerformanceRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { engagements } = req.body;

    if (!Array.isArray(engagements)) {
      return res.status(400).json({
        error: 'Engagements must be an array'
      });
    }

    const results = [];
    for (const engagement of engagements) {
      try {
        const engagementId = await service.trackEngagement(engagement);
        results.push({ success: true, engagementId });
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `Processed ${engagements.length} engagements, ${successCount} successful`,
      results,
      successCount,
      totalCount: engagements.length
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to process bulk engagements',
      details: error.message
    });
  }
});

// Bulk performance calculation
router.post('/performance/bulk', analyticsRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { contentIds, startDate, endDate } = req.body;

    if (!Array.isArray(contentIds) || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required fields: contentIds (array), startDate, endDate'
      });
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    const performanceResults = await Promise.all(
      contentIds.map(async (contentId: string) => {
        try {
          const performance = await service.calculateContentPerformance(
            contentId,
            startDateTime,
            endDateTime
          );
          return { contentId, success: true, performance };
        } catch (error: any) {
          return { contentId, success: false, error: error.message };
        }
      })
    );

    const successCount = performanceResults.filter(r => r.success).length;

    res.json({
      success: true,
      message: `Calculated performance for ${contentIds.length} content items, ${successCount} successful`,
      results: performanceResults,
      successCount,
      totalCount: contentIds.length
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to calculate bulk performance',
      details: error.message
    });
  }
});

// HEALTH AND STATUS

// Service health check
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const health = await service.getHealthStatus();

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      service: 'Universal Content Performance Analysis',
      status: health.status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      health
    });
  } catch (error: any) {
    res.status(503).json({
      service: 'Universal Content Performance Analysis',
      status: 'error',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: error.message
    });
  }
});

export default router;
