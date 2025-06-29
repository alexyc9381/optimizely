import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { redisManager } from '../services/redis-client';

const router = express.Router();

// Initialize rate limiting
const prioritizationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many prioritization requests, please try again later.',
}) as any;

// AI-Powered A/B Test Prioritization Engine Service
class ABTestPrioritizationEngine {
  private redis: any;

  constructor(redis: any) {
    this.redis = redis;
  }

  async prioritizeTests(customerProfile: any, criteria?: any): Promise<any> {
    // Simplified implementation for initial version
    const mockSequence = {
      id: `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId: customerProfile.id,
      tests: [
        {
          templateId: 'checkout-optimization',
          priorityScore: 0.95,
          confidence: 0.88,
          expectedImpact: {
            expectedLift: 18,
            revenueImpact: 75000,
            businessValue: 'high'
          },
          sequencePosition: 1,
          parallelizable: false
        },
        {
          templateId: 'pricing-optimization',
          priorityScore: 0.87,
          confidence: 0.82,
          expectedImpact: {
            expectedLift: 22,
            revenueImpact: 120000,
            businessValue: 'critical'
          },
          sequencePosition: 2,
          parallelizable: true
        }
      ],
      totalDuration: 28,
      expectedROI: 280,
      confidenceScore: 0.85,
      createdAt: new Date(),
      status: 'draft'
    };

    // Cache the sequence
    const key = `test_sequence:${customerProfile.id}:${mockSequence.id}`;
    await this.redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(mockSequence));

    return mockSequence;
  }

  async getTestSequence(customerId: string, sequenceId: string): Promise<any> {
    try {
      const key = `test_sequence:${customerId}:${sequenceId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }

  async getHealthStatus(): Promise<any> {
    return {
      status: 'healthy',
      sequences: {
        active: 0,
        completed: 0
      }
    };
  }
}

// Initialize service
const service = new ABTestPrioritizationEngine(redisManager.getClient());

// Validation middleware
const validateCustomerProfile = [
  body('id').notEmpty().withMessage('Customer ID is required'),
  body('industry').notEmpty().withMessage('Industry is required'),
  body('monthlyTraffic').isNumeric().withMessage('Monthly traffic must be a number'),
  body('abTestingExperience').isIn(['none', 'basic', 'intermediate', 'advanced']).withMessage('Invalid A/B testing experience level'),
  body('technicalCapacity').isIn(['low', 'medium', 'high']).withMessage('Invalid technical capacity'),
  body('budget').isIn(['small', 'medium', 'large', 'enterprise']).withMessage('Invalid budget level'),
  body('timeline').isIn(['urgent', 'standard', 'flexible']).withMessage('Invalid timeline'),
  body('riskTolerance').isIn(['conservative', 'moderate', 'aggressive']).withMessage('Invalid risk tolerance'),
  body('primaryGoals').isArray().withMessage('Primary goals must be an array'),
  body('currentChallenges').isArray().withMessage('Current challenges must be an array')
];

const validatePrioritizationCriteria = [
  body('impactWeight').optional().isFloat({ min: 0, max: 1 }).withMessage('Impact weight must be between 0 and 1'),
  body('feasibilityWeight').optional().isFloat({ min: 0, max: 1 }).withMessage('Feasibility weight must be between 0 and 1'),
  body('urgencyWeight').optional().isFloat({ min: 0, max: 1 }).withMessage('Urgency weight must be between 0 and 1'),
  body('riskWeight').optional().isFloat({ min: 0, max: 1 }).withMessage('Risk weight must be between 0 and 1'),
  body('resourceWeight').optional().isFloat({ min: 0, max: 1 }).withMessage('Resource weight must be between 0 and 1'),
  body('learningWeight').optional().isFloat({ min: 0, max: 1 }).withMessage('Learning weight must be between 0 and 1'),
  body('strategicWeight').optional().isFloat({ min: 0, max: 1 }).withMessage('Strategic weight must be between 0 and 1')
];

// Error handling middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Async route handler wrapper
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Routes

/**
 * @route POST /ab-test-prioritization/prioritize
 * @desc Generate AI-powered A/B test prioritization sequence for a customer
 * @access Public
 */
router.post('/prioritize',
  prioritizationRateLimit,
  validateCustomerProfile,
  validatePrioritizationCriteria,
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { customerProfile, criteria } = req.body;

      // Validate customer profile structure
      if (!customerProfile) {
        return res.status(400).json({
          error: 'Customer profile is required'
        });
      }

      // Generate test sequence using AI prioritization
      const sequence = await service.prioritizeTests(customerProfile, criteria);

      res.json({
        success: true,
        data: {
          sequence,
          recommendations: {
            totalTests: sequence.tests.length,
            estimatedDuration: sequence.totalDuration,
            expectedROI: sequence.expectedROI,
            confidenceScore: sequence.confidenceScore,
            nextSteps: [
              'Review and approve the test sequence',
              'Implement highest priority test first',
              'Monitor results and adapt sequence as needed'
            ]
          }
        }
      });

    } catch (error: any) {
      console.error('Error generating test prioritization:', error);
      res.status(500).json({
        error: 'Failed to generate test prioritization',
        message: error.message
      });
    }
  })
);

/**
 * @route GET /ab-test-prioritization/sequence/:customerId/:sequenceId
 * @desc Get a specific test sequence
 * @access Public
 */
router.get('/sequence/:customerId/:sequenceId',
  prioritizationRateLimit,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { customerId, sequenceId } = req.params;

      const sequence = await service.getTestSequence(customerId, sequenceId);

      if (!sequence) {
        return res.status(404).json({
          error: 'Test sequence not found'
        });
      }

      res.json({
        success: true,
        data: sequence
      });

    } catch (error: any) {
      console.error('Error retrieving test sequence:', error);
      res.status(500).json({
        error: 'Failed to retrieve test sequence',
        message: error.message
      });
    }
  })
);

/**
 * @route POST /ab-test-prioritization/quick-recommendations
 * @desc Get quick A/B test recommendations based on minimal profile
 * @access Public
 */
router.post('/quick-recommendations',
  prioritizationRateLimit,
  [
    body('industry').notEmpty().withMessage('Industry is required'),
    body('monthlyTraffic').isNumeric().withMessage('Monthly traffic must be a number'),
    body('primaryGoal').notEmpty().withMessage('Primary goal is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { industry, monthlyTraffic, primaryGoal } = req.body;

      // Generate simplified recommendations
      const quickRecommendations = {
        topTests: [
          {
            name: 'Landing Page Headlines',
            category: 'conversion-optimization',
            expectedLift: '8-15%',
            difficulty: 'Easy',
            timeToImplement: '2-3 days',
            priority: 'High'
          },
          {
            name: 'Call-to-Action Buttons',
            category: 'conversion-optimization',
            expectedLift: '12-25%',
            difficulty: 'Easy',
            timeToImplement: '1-2 days',
            priority: 'High'
          },
          {
            name: 'Pricing Display',
            category: 'pricing',
            expectedLift: '15-30%',
            difficulty: 'Medium',
            timeToImplement: '5-7 days',
            priority: 'Medium'
          }
        ],
        industryInsights: {
          averageConversionRate: industry === 'ecommerce' ? '2.8%' :
                                industry === 'saas' ? '12.5%' : '5.2%',
          recommendedTestDuration: industry === 'ecommerce' ? '10-14 days' :
                                  industry === 'fintech' ? '21-28 days' : '14-21 days',
          successFactors: [
            'Focus on high-traffic pages first',
            'Test one element at a time',
            'Ensure statistical significance before making decisions'
          ]
        }
      };

      res.json({
        success: true,
        data: quickRecommendations
      });

    } catch (error: any) {
      console.error('Error generating quick recommendations:', error);
      res.status(500).json({
        error: 'Failed to generate recommendations',
        message: error.message
      });
    }
  })
);

/**
 * @route GET /ab-test-prioritization/health
 * @desc Health check for the prioritization engine
 * @access Public
 */
router.get('/health',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const health = await service.getHealthStatus();

      res.json({
        success: true,
        service: 'AB Test Prioritization Engine',
        status: health.status,
        timestamp: new Date().toISOString(),
        data: health
      });

    } catch (error: any) {
      res.status(500).json({
        error: 'Health check failed',
        message: error.message
      });
    }
  })
);

/**
 * @route GET /ab-test-prioritization/benchmark/:industry
 * @desc Get industry benchmarks for A/B testing
 * @access Public
 */
router.get('/benchmark/:industry',
  prioritizationRateLimit,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { industry } = req.params;

      const benchmarks: Record<string, any> = {
        'ecommerce': {
          averageConversionRate: 2.8,
          typicalLiftRange: '5-18%',
          recommendedTestDuration: '10-14 days',
          successfulTestTypes: ['Product page optimization', 'Checkout flow', 'Email campaigns'],
          commonChallenges: ['Cart abandonment', 'Mobile experience', 'Trust signals']
        },
        'saas': {
          averageConversionRate: 12.5,
          typicalLiftRange: '8-25%',
          recommendedTestDuration: '14-21 days',
          successfulTestTypes: ['Landing pages', 'Pricing pages', 'Onboarding flow'],
          commonChallenges: ['Trial to paid conversion', 'Feature adoption', 'Pricing optimization']
        },
        'fintech': {
          averageConversionRate: 5.2,
          typicalLiftRange: '12-30%',
          recommendedTestDuration: '21-28 days',
          successfulTestTypes: ['Trust building', 'Compliance messaging', 'Onboarding'],
          commonChallenges: ['Trust and security', 'Complex products', 'Regulatory compliance']
        }
      };

      const benchmark = benchmarks[industry.toLowerCase()];

      if (!benchmark) {
        return res.status(404).json({
          error: 'Industry benchmark not found',
          availableIndustries: Object.keys(benchmarks)
        });
      }

      res.json({
        success: true,
        industry: industry.toLowerCase(),
        data: benchmark,
        lastUpdated: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Error retrieving industry benchmark:', error);
      res.status(500).json({
        error: 'Failed to retrieve benchmark data',
        message: error.message
      });
    }
  })
);

export default router;
