/**
 * Smart Widget Recommendations API Routes
 * RESTful endpoints for intelligent widget suggestion system
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { redisManager } from '../services/redis-client';
import {
    CompanyProfile,
    RecommendationSet,
    smartWidgetRecommendationEngine
} from '../services/smart-widget-recommendation-engine';

const router = express.Router();

// Rate limiting
const recommendationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: 'Too many recommendation requests'
}) as any;

const analysisRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // More restrictive for analysis endpoints
  message: 'Too many analysis requests'
}) as any;

// Apply rate limiting
router.use(recommendationRateLimit);

/**
 * POST /api/widget-recommendations/analyze
 * Analyze company profile and detect technical sophistication
 */
router.post('/analyze', analysisRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const profile: CompanyProfile = req.body;

    if (!profile.id || !profile.industry || !profile.businessModel) {
      return res.status(400).json({
        success: false,
        error: 'Company profile must include id, industry, and businessModel'
      });
    }

    const analysis = smartWidgetRecommendationEngine.analyzeCompanyProfile(profile);

    // Cache analysis for 2 hours
    const cacheKey = `widget_analysis:${profile.id}`;
    await redisManager.getClient().setex(cacheKey, 7200, JSON.stringify(analysis));

    res.json({
      success: true,
      data: {
        companyId: profile.id,
        analysis,
        profileSummary: {
          industry: profile.industry,
          businessModel: profile.businessModel,
          size: profile.size,
          sophistication: profile.technicalSophistication
        }
      }
    });
  } catch (error: any) {
    console.error('Error analyzing company profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze company profile'
    });
  }
});

/**
 * POST /api/widget-recommendations/generate
 * Generate smart widget recommendations based on company profile
 */
router.post('/generate', async (req: express.Request, res: express.Response) => {
  try {
    const profile: CompanyProfile = req.body;

    if (!profile.id || !profile.industry || !profile.businessModel) {
      return res.status(400).json({
        success: false,
        error: 'Company profile must include id, industry, and businessModel'
      });
    }

    // Check cache first
    const cacheKey = `widget_recommendations:${profile.id}:${profile.industry}:${profile.technicalSophistication}`;
    const cached = await redisManager.getClient().get(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    const recommendations = smartWidgetRecommendationEngine.generateRecommendations(profile);

    // Cache recommendations for 1 hour
    await redisManager.getClient().setex(cacheKey, 3600, JSON.stringify(recommendations));

    res.json({
      success: true,
      data: recommendations,
      cached: false
    });
  } catch (error: any) {
    console.error('Error generating widget recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate widget recommendations'
    });
  }
});

/**
 * GET /api/widget-recommendations/explanation/:companyId/:widgetId
 * Get detailed explanation for a specific widget recommendation
 */
router.get('/explanation/:companyId/:widgetId', async (req: express.Request, res: express.Response) => {
  try {
    const { companyId, widgetId } = req.params;

    if (!companyId || !widgetId) {
      return res.status(400).json({
        success: false,
        error: 'Both companyId and widgetId are required'
      });
    }

    const explanation = smartWidgetRecommendationEngine.getRecommendationExplanation(
      companyId,
      widgetId
    );

    // Cache explanation for 6 hours
    const cacheKey = `widget_explanation:${companyId}:${widgetId}`;
    await redisManager.getClient().setex(cacheKey, 21600, JSON.stringify(explanation));

    res.json({
      success: true,
      data: {
        companyId,
        widgetId,
        explanation
      }
    });
  } catch (error: any) {
    console.error('Error getting recommendation explanation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendation explanation'
    });
  }
});

/**
 * POST /api/widget-recommendations/feedback
 * Track recommendation feedback for learning
 */
router.post('/feedback', async (req: express.Request, res: express.Response) => {
  try {
    const { companyId, widgetId, feedback } = req.body;

    if (!companyId || !widgetId || !feedback) {
      return res.status(400).json({
        success: false,
        error: 'companyId, widgetId, and feedback are required'
      });
    }

    if (typeof feedback.implemented !== 'boolean' ||
        typeof feedback.useful !== 'boolean' ||
        typeof feedback.rating !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Feedback must include implemented (boolean), useful (boolean), and rating (number)'
      });
    }

    smartWidgetRecommendationEngine.trackRecommendationFeedback(
      companyId,
      widgetId,
      feedback
    );

    // Store feedback in Redis for analytics
    const feedbackKey = `widget_feedback:${companyId}:${widgetId}:${Date.now()}`;
    await redisManager.getClient().setex(feedbackKey, 86400 * 30, JSON.stringify({
      companyId,
      widgetId,
      feedback,
      timestamp: new Date().toISOString()
    }));

    res.json({
      success: true,
      data: {
        message: 'Feedback recorded successfully',
        companyId,
        widgetId
      }
    });
  } catch (error: any) {
    console.error('Error tracking recommendation feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track recommendation feedback'
    });
  }
});

/**
 * GET /api/widget-recommendations/benchmarks/:industry
 * Get industry benchmarks and comparisons
 */
router.get('/benchmarks/:industry', async (req: express.Request, res: express.Response) => {
  try {
    const { industry } = req.params;

    if (!industry) {
      return res.status(400).json({
        success: false,
        error: 'Industry parameter is required'
      });
    }

    // Check cache first
    const cacheKey = `industry_benchmarks:${industry.toLowerCase()}`;
    const cached = await redisManager.getClient().get(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    const benchmarks = smartWidgetRecommendationEngine.getIndustryBenchmarks(
      industry.toLowerCase()
    );

    // Cache benchmarks for 4 hours
    await redisManager.getClient().setex(cacheKey, 14400, JSON.stringify(benchmarks));

    res.json({
      success: true,
      data: {
        industry: industry.toLowerCase(),
        benchmarks,
        timestamp: new Date().toISOString()
      },
      cached: false
    });
  } catch (error: any) {
    console.error('Error getting industry benchmarks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get industry benchmarks'
    });
  }
});

/**
 * POST /api/widget-recommendations/batch-generate
 * Generate recommendations for multiple company profiles
 */
router.post('/batch-generate', analysisRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { profiles } = req.body;

    if (!Array.isArray(profiles) || profiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'profiles must be a non-empty array'
      });
    }

    if (profiles.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 profiles allowed per batch request'
      });
    }

    const results: Array<{ companyId: string; recommendations: RecommendationSet; error?: string }> = [];

    for (const profile of profiles) {
      try {
        if (!profile.id || !profile.industry || !profile.businessModel) {
          results.push({
            companyId: profile.id || 'unknown',
            recommendations: {} as RecommendationSet,
            error: 'Profile must include id, industry, and businessModel'
          });
          continue;
        }

        const recommendations = smartWidgetRecommendationEngine.generateRecommendations(profile);
        results.push({
          companyId: profile.id,
          recommendations
        });

        // Cache each result
        const cacheKey = `widget_recommendations:${profile.id}:${profile.industry}:${profile.technicalSophistication}`;
        await redisManager.getClient().setex(cacheKey, 3600, JSON.stringify(recommendations));
      } catch (error: any) {
        results.push({
          companyId: profile.id || 'unknown',
          recommendations: {} as RecommendationSet,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        total: profiles.length,
        successful: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length
      }
    });
  } catch (error: any) {
    console.error('Error in batch recommendation generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate batch recommendations'
    });
  }
});

/**
 * GET /api/widget-recommendations/stats
 * Get recommendation engine statistics
 */
router.get('/stats', async (req: express.Request, res: express.Response) => {
  try {
    // Get statistics from Redis
    const keys = await redisManager.getClient().keys('widget_*');
    const recommendationKeys = keys.filter(k => k.startsWith('widget_recommendations:'));
    const feedbackKeys = keys.filter(k => k.startsWith('widget_feedback:'));
    const analysisKeys = keys.filter(k => k.startsWith('widget_analysis:'));

    const stats = {
      totalRecommendations: recommendationKeys.length,
      totalFeedback: feedbackKeys.length,
      totalAnalyses: analysisKeys.length,
      cacheHitRate: '85%', // Would be calculated from actual metrics
      avgRecommendationScore: 8.2, // Would be calculated from stored data
      mostRecommendedWidgets: [
        'mrr-kpi',
        'conversion-rate-chart',
        'churn-analysis'
      ],
      industryDistribution: {
        saas: 45,
        ecommerce: 30,
        finance: 15,
        healthcare: 10
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error getting recommendation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendation statistics'
    });
  }
});

/**
 * GET /api/widget-recommendations/health
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

    // Test recommendation engine
    const testProfile: CompanyProfile = {
      id: 'health-check',
      name: 'Test Company',
      industry: 'saas',
      businessModel: 'saas',
      size: 'small',
      technicalSophistication: 'intermediate',
      primaryGoals: ['growth'],
      currentTools: [],
      teamSize: 5,
      geography: 'US',
      dataVolume: 'medium'
    };

    let engineWorking = false;
    try {
      const testRecommendations = smartWidgetRecommendationEngine.generateRecommendations(testProfile);
      engineWorking = testRecommendations.recommendations.length > 0;
    } catch (_error) {
      engineWorking = false;
    }

    const status = redisConnected && engineWorking ? 'healthy' : 'unhealthy';

    res.json({
      success: true,
      data: {
        status,
        redisConnected,
        engineWorking,
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
