/**
 * Adaptive Layout API Routes
 * RESTful endpoints for dynamic dashboard layout management
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { adaptiveLayoutEngine, LayoutGrid } from '../services/adaptive-layout-engine';
import { redisManager } from '../services/redis-client';

const router = express.Router();

// Rate limiting
const layoutRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests to layout endpoints'
}) as any;

const optimizationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // More restrictive for AI-powered optimization
  message: 'Too many optimization requests'
}) as any;

// Apply rate limiting
router.use(layoutRateLimit);

/**
 * GET /api/layouts/recommendations
 * Get layout template recommendations based on industry and user role
 */
router.get('/recommendations', async (req: express.Request, res: express.Response) => {
  try {
    const { industry, businessModel, userRole } = req.query;

    if (!industry || typeof industry !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Industry parameter is required'
      });
    }

    const recommendations = adaptiveLayoutEngine.getLayoutRecommendations(
      industry.toLowerCase()
    );

    // Cache recommendations for 1 hour
    const cacheKey = `layout_recommendations:${industry}:${businessModel || 'any'}:${userRole || 'any'}`;
    await redisManager.getClient().setex(cacheKey, 3600, JSON.stringify(recommendations));

    res.json({
      success: true,
      data: {
        industry,
        businessModel,
        userRole,
        recommendations,
        count: recommendations.length
      }
    });
  } catch (error: any) {
    console.error('Error getting layout recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get layout recommendations'
    });
  }
});

/**
 * POST /api/layouts/generate
 * Generate a custom layout based on industry and preferences
 */
router.post('/generate', async (req: express.Request, res: express.Response) => {
  try {
    const { industry, businessModel, userRole, preferences } = req.body;

    if (!industry) {
      return res.status(400).json({
        success: false,
        error: 'Industry is required'
      });
    }

    const customLayout = adaptiveLayoutEngine.generateCustomLayout(
      industry.toLowerCase(),
      businessModel,
      userRole,
      preferences
    );

    res.json({
      success: true,
      data: customLayout
    });
  } catch (error: any) {
    console.error('Error generating custom layout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate custom layout'
    });
  }
});

/**
 * GET /api/layouts/widgets
 * Get available widgets for an industry
 */
router.get('/widgets', async (req: express.Request, res: express.Response) => {
  try {
    const { industry, businessModel, userRole } = req.query;

    if (!industry || typeof industry !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Industry parameter is required'
      });
    }

    const widgets = adaptiveLayoutEngine.getAvailableWidgets(
      industry.toLowerCase(),
      businessModel as string,
      userRole as string
    );

    // Cache widgets for 2 hours
    const cacheKey = `layout_widgets:${industry}:${businessModel || 'any'}:${userRole || 'any'}`;
    await redisManager.getClient().setex(cacheKey, 7200, JSON.stringify(widgets));

    res.json({
      success: true,
      data: {
        industry,
        businessModel,
        userRole,
        widgets,
        count: widgets.length
      }
    });
  } catch (error: any) {
    console.error('Error getting available widgets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available widgets'
    });
  }
});

/**
 * GET /api/layouts/templates
 * Get all available layout templates
 */
router.get('/templates', async (req: express.Request, res: express.Response) => {
  try {
    const templates = adaptiveLayoutEngine.getAllTemplates();

    // Cache templates for 1 hour
    const cacheKey = 'layout_templates:all';
    await redisManager.getClient().setex(cacheKey, 3600, JSON.stringify(templates));

    res.json({
      success: true,
      data: {
        templates,
        count: templates.length
      }
    });
  } catch (error: any) {
    console.error('Error getting layout templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get layout templates'
    });
  }
});

/**
 * POST /api/layouts/save
 * Save a custom layout
 */
router.post('/save', async (req: express.Request, res: express.Response) => {
  try {
    const layout: LayoutGrid = req.body;

    if (!layout.id || !layout.name || !layout.industry) {
      return res.status(400).json({
        success: false,
        error: 'Layout must have id, name, and industry'
      });
    }

    adaptiveLayoutEngine.saveLayout(layout);

    // Clear related caches
    const pattern = `layout_*:${layout.industry}:*`;
    const keys = await redisManager.getClient().keys(pattern);
    if (keys.length > 0) {
      await redisManager.getClient().del(...keys);
    }

    res.json({
      success: true,
      data: {
        message: 'Layout saved successfully',
        layoutId: layout.id
      }
    });
  } catch (error: any) {
    console.error('Error saving layout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save layout'
    });
  }
});

/**
 * POST /api/layouts/track-behavior
 * Track user behavior for layout optimization
 */
router.post('/track-behavior', async (req: express.Request, res: express.Response) => {
  try {
    const { userId, industry, action, widgetId, data } = req.body;

    if (!userId || !industry || !action || !widgetId) {
      return res.status(400).json({
        success: false,
        error: 'userId, industry, action, and widgetId are required'
      });
    }

    adaptiveLayoutEngine.trackUserBehavior(userId, industry, action, widgetId, data);

    res.json({
      success: true,
      data: {
        message: 'Behavior tracked successfully'
      }
    });
  } catch (error: any) {
    console.error('Error tracking user behavior:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track user behavior'
    });
  }
});

/**
 * POST /api/layouts/optimize
 * Optimize layout based on user behavior
 */
router.post('/optimize', optimizationRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { userId, currentLayout } = req.body;

    if (!userId || !currentLayout) {
      return res.status(400).json({
        success: false,
        error: 'userId and currentLayout are required'
      });
    }

    const optimization = adaptiveLayoutEngine.optimizeLayout(userId, currentLayout);

    // Cache optimization results for 30 minutes
    const cacheKey = `layout_optimization:${userId}:${currentLayout.id}`;
    await redisManager.getClient().setex(cacheKey, 1800, JSON.stringify(optimization));

    res.json({
      success: true,
      data: optimization
    });
  } catch (error: any) {
    console.error('Error optimizing layout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize layout'
    });
  }
});

/**
 * GET /api/layouts/health
 * Health check endpoint
 */
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const templateCount = adaptiveLayoutEngine.getAllTemplates().length;

    // Test Redis connection with a simple operation
    let redisConnected = false;
    try {
      await redisManager.getClient().ping();
      redisConnected = true;
    } catch (_error) {
      redisConnected = false;
    }

    res.json({
      success: true,
      data: {
        status: 'healthy',
        templateCount,
        redisConnected,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export default router;
