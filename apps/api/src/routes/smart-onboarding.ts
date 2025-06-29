import express from 'express';
import rateLimit from 'express-rate-limit';
import { redisManager } from '../services/redis-client';
import createSmartOnboardingService, {
    CustomerProfile
} from '../services/smart-onboarding-service';

const router = express.Router();

// Initialize service
const service = createSmartOnboardingService(redisManager.getClient());

// Rate limiting
const onboardingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many onboarding requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

const questionnaireRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many questionnaire requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

// =============================================================================
// QUESTIONNAIRE MANAGEMENT
// =============================================================================

// Start a new questionnaire session
router.post('/questionnaire/start', onboardingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { source = 'web' } = req.body;

    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await service.startQuestionnaire(sessionId, source);

    res.status(200).json({
      success: true,
      message: 'Questionnaire session started successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error starting questionnaire:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start questionnaire session',
      details: error.message
    });
  }
});

// Submit an answer to the questionnaire
router.post('/questionnaire/:sessionId/answer', questionnaireRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId } = req.params;
    const { questionId, answer } = req.body;

    if (!questionId || answer === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: questionId, answer'
      });
    }

    const result = await service.submitAnswer(sessionId, questionId, answer);

    if (result.completed) {
      res.status(200).json({
        success: true,
        message: 'Questionnaire completed successfully',
        data: {
          completed: true,
          customerProfile: result.customerProfile,
          abTestRecommendations: result.abTestRecommendations
        }
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Answer submitted successfully',
        data: {
          completed: false,
          nextQuestion: result.nextQuestion
        }
      });
    }
  } catch (error: any) {
    console.error('Error submitting answer:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to submit answer'
    });
  }
});

// Get questionnaire progress
router.get('/questionnaire/:sessionId/progress', questionnaireRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId } = req.params;

    const progress = await service.getQuestionnaireProgress(sessionId);

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error: any) {
    console.error('Error getting questionnaire progress:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'Questionnaire session not found'
    });
  }
});

// =============================================================================
// CUSTOMER PROFILE MANAGEMENT
// =============================================================================

// Get customer profile by ID
router.get('/profile/:profileId', onboardingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { profileId } = req.params;

    const profile = await service.getCustomerProfile(profileId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Customer profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    console.error('Error getting customer profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve customer profile',
      details: error.message
    });
  }
});

// Update customer profile (for manual adjustments)
router.put('/profile/:profileId', onboardingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { profileId } = req.params;
    const updates = req.body;

    // Get existing profile
    const existingProfile = await service.getCustomerProfile(profileId);
    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        error: 'Customer profile not found'
      });
    }

    // Merge updates with existing profile
    const updatedProfile: CustomerProfile = {
      ...existingProfile,
      ...updates,
      metadata: {
        ...existingProfile.metadata,
        updatedAt: new Date()
      }
    };

    // Store updated profile
    await redisManager.getClient().setex(
      `customer-profile:${profileId}`,
      86400 * 30, // 30 days
      JSON.stringify(updatedProfile)
    );

    res.status(200).json({
      success: true,
      message: 'Customer profile updated successfully',
      data: updatedProfile
    });
  } catch (error: any) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update customer profile',
      details: error.message
    });
  }
});

// =============================================================================
// A/B TEST RECOMMENDATIONS
// =============================================================================

// Get A/B test recommendations for a customer profile
router.get('/profile/:profileId/recommendations', onboardingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { profileId } = req.params;
    const { refreshCache = false } = req.query;

    // Check cache first unless refresh is requested
    if (!refreshCache) {
      const cachedRecommendations = await redisManager.getClient().get(`recommendations:${profileId}`);
      if (cachedRecommendations) {
        return res.status(200).json({
          success: true,
          data: JSON.parse(cachedRecommendations),
          cached: true
        });
      }
    }

    // Get customer profile
    const profile = await service.getCustomerProfile(profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Customer profile not found'
      });
    }

    // Generate fresh recommendations
    const recommendations = await (service as any).generateABTestRecommendations(profile);

    // Cache recommendations for 24 hours
    await redisManager.getClient().setex(
      `recommendations:${profileId}`,
      86400,
      JSON.stringify(recommendations)
    );

    res.status(200).json({
      success: true,
      data: recommendations,
      cached: false
    });
  } catch (error: any) {
    console.error('Error getting A/B test recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get A/B test recommendations',
      details: error.message
    });
  }
});

// =============================================================================
// ANALYTICS & INSIGHTS
// =============================================================================

// Get onboarding analytics
router.get('/analytics', onboardingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Get questionnaire statistics
    const activeKeys = await redisManager.getClient().keys('questionnaire:*');
    const completedKeys = await redisManager.getClient().keys('questionnaire:completed:*');
    const profileKeys = await redisManager.getClient().keys('customer-profile:*');

    // Industry distribution (sample - in production would scan actual profiles)
    const industryDistribution = {
      'saas': 35,
      'ecommerce': 25,
      'fintech': 15,
      'healthcare': 10,
      'education': 8,
      'consulting': 7
    };

    // Completion rates
    const totalStarted = activeKeys.length + completedKeys.length;
    const completionRate = totalStarted > 0 ? (completedKeys.length / totalStarted) * 100 : 0;

    // Average completion time (simulated)
    const avgCompletionTime = 8.5; // minutes

    res.status(200).json({
      success: true,
      data: {
        questionnaires: {
          active: activeKeys.length,
          completed: completedKeys.length,
          total: totalStarted,
          completionRate: Math.round(completionRate * 100) / 100
        },
        customerProfiles: {
          total: profileKeys.length,
          industryDistribution
        },
        metrics: {
          avgCompletionTime,
          popularIndustries: Object.entries(industryDistribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([industry, count]) => ({ industry, count }))
        },
        period: {
          startDate: startDate || 'N/A',
          endDate: endDate || 'N/A'
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting onboarding analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get onboarding analytics',
      details: error.message
    });
  }
});

// Get industry-specific insights
router.get('/analytics/industry/:industry', onboardingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { industry } = req.params;

    // Industry-specific analytics (simulated - in production would analyze actual data)
    const industryInsights = {
      'saas': {
        commonChallenges: ['feature-adoption', 'user-onboarding', 'pricing-optimization'],
        popularGoals: ['trial-signup', 'purchase', 'demo-request'],
        avgTrafficVolume: 'medium',
        recommendedTests: ['trial-signup-optimization', 'pricing-page-optimization', 'onboarding-flow'],
        benchmarks: {
          conversionRate: 12.5,
          trialToPayment: 18.2,
          churnRate: 5.8
        }
      },
      'ecommerce': {
        commonChallenges: ['high-cart-abandonment', 'poor-mobile-experience', 'low-conversion-rate'],
        popularGoals: ['purchase', 'email-signup', 'contact-form'],
        avgTrafficVolume: 'high',
        recommendedTests: ['checkout-optimization', 'product-page-optimization', 'mobile-optimization'],
        benchmarks: {
          conversionRate: 2.8,
          cartAbandonmentRate: 68.2,
          mobileConversionRate: 1.9
        }
      }
    };

    const insights = industryInsights[industry as keyof typeof industryInsights] || {
      commonChallenges: ['low-conversion-rate', 'unclear-value-prop'],
      popularGoals: ['lead-generation', 'contact-form'],
      avgTrafficVolume: 'medium',
      recommendedTests: ['general-conversion-optimization'],
      benchmarks: {
        conversionRate: 5.2
      }
    };

    res.status(200).json({
      success: true,
      data: {
        industry,
        insights,
        profileCount: Math.floor(Math.random() * 100) + 20 // Simulated
      }
    });
  } catch (error: any) {
    console.error('Error getting industry insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get industry insights',
      details: error.message
    });
  }
});

// =============================================================================
// UTILITY ENDPOINTS
// =============================================================================

// Get available question types and options (for UI building)
router.get('/questionnaire/schema', onboardingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const schema = {
      industries: [
        'saas', 'ecommerce', 'manufacturing', 'healthcare', 'fintech',
        'education', 'government', 'consulting', 'real-estate', 'travel',
        'media', 'nonprofit', 'retail', 'automotive', 'energy', 'logistics'
      ],
      businessModels: [
        'b2b', 'b2c', 'b2b2c', 'marketplace', 'subscription',
        'transactional', 'freemium', 'enterprise', 'self-serve'
      ],
      companySizes: ['startup', 'small', 'medium', 'enterprise', 'fortune500'],
      conversionGoals: [
        'trial-signup', 'purchase', 'lead-generation', 'demo-request',
        'consultation-booking', 'email-signup', 'download',
        'quote-request', 'contact-form', 'phone-call'
      ],
      businessChallenges: [
        'low-conversion-rate', 'high-cart-abandonment', 'poor-mobile-experience',
        'unclear-value-prop', 'complex-checkout', 'trust-issues',
        'pricing-optimization', 'feature-adoption', 'user-onboarding',
        'lead-quality', 'sales-funnel-leaks', 'seasonal-fluctuations'
      ],
      trafficVolumes: ['low', 'medium', 'high', 'very-high'],
      abTestingExperience: ['none', 'basic', 'intermediate', 'advanced']
    };

    res.status(200).json({
      success: true,
      data: schema
    });
  } catch (error: any) {
    console.error('Error getting questionnaire schema:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get questionnaire schema',
      details: error.message
    });
  }
});

// Health check endpoint
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const health = await service.getHealthStatus();

    res.status(200).json({
      success: true,
      service: 'Smart Onboarding System',
      status: health.status,
      timestamp: new Date().toISOString(),
      health
    });
  } catch (error: any) {
    console.error('Error getting health status:', error);
    res.status(500).json({
      success: false,
      service: 'Smart Onboarding System',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;
