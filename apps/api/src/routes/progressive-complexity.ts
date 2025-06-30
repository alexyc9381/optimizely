/**
 * Progressive Complexity Management API Routes
 * RESTful endpoints for dynamic feature unlocking and complexity management
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import {
    progressiveComplexityManager
} from '../services/progressive-complexity-manager';
import { redisManager } from '../services/redis-client';

const router = express.Router();

// Rate limiting
const complexityRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many complexity management requests'
}) as any;

const progressionRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // More restrictive for progression endpoints
  message: 'Too many progression requests'
}) as any;

// Apply rate limiting
router.use(complexityRateLimit);

/**
 * GET /api/complexity/profile/:userId
 * Get user complexity profile
 */
router.get('/profile/:userId', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { companyId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Check Redis cache first
    const cacheKey = `complexity_profile:${userId}`;
    try {
      const cached = await redisManager.getClient().get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: JSON.parse(cached),
          cached: true
        });
      }
    } catch (cacheError) {
      console.warn('Redis cache error:', cacheError);
    }

    const profile = progressiveComplexityManager.getUserProfile(userId, companyId as string || '');

    // Cache for 5 minutes
    try {
      await redisManager.getClient().setex(cacheKey, 300, JSON.stringify(profile));
    } catch (cacheError) {
      console.warn('Redis cache set error:', cacheError);
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    console.error('Get complexity profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get complexity profile'
    });
  }
});

/**
 * GET /api/complexity/report/:userId
 * Generate comprehensive complexity report
 */
router.get('/report/:userId', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const report = progressiveComplexityManager.generateComplexityReport(userId);

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('Generate complexity report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate complexity report'
    });
  }
});

/**
 * GET /api/complexity/features/:userId
 * Get available and locked features for user
 */
router.get('/features/:userId', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { type } = req.query; // 'available', 'locked', or 'all'

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    let features: any = {};

    if (type === 'available' || type === 'all' || !type) {
      features.available = progressiveComplexityManager.getAvailableFeatures(userId);
    }

    if (type === 'locked' || type === 'all' || !type) {
      features.locked = progressiveComplexityManager.getLockedFeatures(userId);
    }

    res.json({
      success: true,
      data: features
    });
  } catch (error: any) {
    console.error('Get features error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get features'
    });
  }
});

/**
 * GET /api/complexity/onboarding/:featureId
 * Get onboarding steps for a specific feature
 */
router.get('/onboarding/:featureId', async (req: express.Request, res: express.Response) => {
  try {
    const { featureId } = req.params;

    if (!featureId) {
      return res.status(400).json({
        success: false,
        error: 'Feature ID is required'
      });
    }

    const onboardingSteps = progressiveComplexityManager.getFeatureOnboarding(featureId);

    res.json({
      success: true,
      data: {
        featureId,
        steps: onboardingSteps,
        totalDuration: onboardingSteps.reduce((sum, step) => sum + step.estimatedDuration, 0)
      }
    });
  } catch (error: any) {
    console.error('Get onboarding error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get onboarding steps'
    });
  }
});

/**
 * POST /api/complexity/engagement/:userId
 * Update user engagement metrics
 */
router.post('/engagement/:userId', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const metrics = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Valid metrics object is required'
      });
    }

    progressiveComplexityManager.updateEngagementMetrics(userId, metrics);

    // Clear cache after update
    const cacheKey = `complexity_profile:${userId}`;
    try {
      await redisManager.getClient().del(cacheKey);
    } catch (_cacheError) {
      // Ignore cache errors
    }

    const updatedProfile = progressiveComplexityManager.getUserProfile(userId, '');

    res.json({
      success: true,
      data: {
        message: 'Engagement metrics updated successfully',
        profile: updatedProfile
      }
    });
  } catch (error: any) {
    console.error('Update engagement metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update engagement metrics'
    });
  }
});

/**
 * POST /api/complexity/track/:userId
 * Track feature usage
 */
router.post('/track/:userId', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { featureId, action, metadata } = req.body;

    if (!userId || !featureId || !action) {
      return res.status(400).json({
        success: false,
        error: 'User ID, feature ID, and action are required'
      });
    }

    progressiveComplexityManager.trackFeatureUsage(userId, featureId, action, metadata);

    res.json({
      success: true,
      data: {
        message: 'Feature usage tracked successfully'
      }
    });
  } catch (error: any) {
    console.error('Track feature usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track feature usage'
    });
  }
});

/**
 * GET /api/complexity/progression/:userId
 * Check level progression status
 */
router.get('/progression/:userId', progressionRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const progressionCheck = progressiveComplexityManager.checkLevelProgression(userId);

    res.json({
      success: true,
      data: progressionCheck
    });
  } catch (error: any) {
    console.error('Check progression error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check progression status'
    });
  }
});

/**
 * POST /api/complexity/progress/:userId
 * Progress user to next level
 */
router.post('/progress/:userId', progressionRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const progression = progressiveComplexityManager.progressUserLevel(userId);

    if (!progression.success) {
      return res.status(400).json({
        success: false,
        error: 'User does not meet progression requirements',
        data: progression
      });
    }

    // Clear cache after progression
    const cacheKey = `complexity_profile:${userId}`;
    try {
      await redisManager.getClient().del(cacheKey);
    } catch (_cacheError) {
      // Ignore cache errors
    }

    res.json({
      success: true,
      data: {
        message: 'Successfully progressed to next level',
        ...progression
      }
    });
  } catch (error: any) {
    console.error('Progress user level error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to progress user level'
    });
  }
});

/**
 * POST /api/complexity/milestone/:userId
 * Complete a milestone
 */
router.post('/milestone/:userId', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { milestoneId } = req.body;

    if (!userId || !milestoneId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and milestone ID are required'
      });
    }

    const completion = progressiveComplexityManager.completeMilestone(userId, milestoneId);

    if (!completion.success) {
      return res.status(400).json({
        success: false,
        error: 'Milestone not found or already completed'
      });
    }

    // Clear cache after milestone completion
    const cacheKey = `complexity_profile:${userId}`;
    try {
      await redisManager.getClient().del(cacheKey);
    } catch (_cacheError) {
      // Ignore cache errors
    }

    res.json({
      success: true,
      data: {
        message: 'Milestone completed successfully',
        ...completion
      }
    });
  } catch (error: any) {
    console.error('Complete milestone error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete milestone'
    });
  }
});

/**
 * GET /api/complexity/recommendations/:userId
 * Get feature recommendations
 */
router.get('/recommendations/:userId', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const recommendations = progressiveComplexityManager.getFeatureRecommendations(userId);

    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length
      }
    });
  } catch (error: any) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    });
  }
});

/**
 * GET /api/complexity/health
 * Health check endpoint
 */
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    // Test Redis connection
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
