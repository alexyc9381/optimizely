import express from 'express';
import rateLimit from 'express-rate-limit';
import createABTestTemplateService from '../services/ab-test-template-service';
import { redisManager } from '../services/redis-client';

const router = express.Router();

// Initialize service
const service = createABTestTemplateService(redisManager.getClient());

// Rate limiting
const templateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many A/B test template requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

const searchRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit search requests
  message: 'Too many template search requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

/**
 * @route GET /api/v1/ab-test-templates
 * @desc Get all A/B test templates with optional filtering
 * @access Public
 */
router.get('/', templateRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const {
      industry,
      businessModel,
      category,
      difficulty,
      testType,
      minTraffic,
      maxDuration,
      expectedImpact,
      tags
    } = req.query;

    const filter: any = {};

    if (industry) {
      filter.industry = Array.isArray(industry) ? industry : [industry];
    }
    if (businessModel) {
      filter.businessModel = Array.isArray(businessModel) ? businessModel : [businessModel];
    }
    if (category) {
      filter.category = Array.isArray(category) ? category : [category];
    }
    if (difficulty) {
      filter.difficulty = Array.isArray(difficulty) ? difficulty : [difficulty];
    }
    if (testType) {
      filter.testType = Array.isArray(testType) ? testType : [testType];
    }
    if (minTraffic) {
      filter.minTraffic = parseInt(minTraffic as string);
    }
    if (maxDuration) {
      filter.maxDuration = parseInt(maxDuration as string);
    }
    if (expectedImpact) {
      filter.expectedImpact = Array.isArray(expectedImpact) ? expectedImpact : [expectedImpact];
    }
    if (tags) {
      filter.tags = Array.isArray(tags) ? tags : [tags];
    }

    const templates = await service.getTemplates(filter);

    res.json({
      success: true,
      data: templates,
      count: templates.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve templates',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/ab-test-templates/:id
 * @desc Get specific A/B test template by ID
 * @access Public
 */
router.get('/:id', templateRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const template = await service.getTemplate(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve template',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/ab-test-templates/recommendations
 * @desc Get recommended templates based on customer profile
 * @access Public
 */
router.post('/recommendations', templateRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const customerProfile = req.body;

    if (!customerProfile || !customerProfile.industry) {
      return res.status(400).json({
        success: false,
        error: 'Customer profile with industry is required',
        timestamp: new Date().toISOString()
      });
    }

    const recommendations = await service.getRecommendedTemplates(customerProfile);

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get template recommendations',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/ab-test-templates/industry/:industry
 * @desc Get templates for specific industry
 * @access Public
 */
router.get('/industry/:industry', templateRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { industry } = req.params;
    const templates = await service.getTemplatesByIndustry(industry as any);

    res.json({
      success: true,
      data: templates,
      count: templates.length,
      industry: industry,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve industry templates',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/ab-test-templates/category/:category
 * @desc Get templates for specific category
 * @access Public
 */
router.get('/category/:category', templateRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { category } = req.params;
    const templates = await service.getTemplatesByCategory(category as any);

    res.json({
      success: true,
      data: templates,
      count: templates.length,
      category: category,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve category templates',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/ab-test-templates/search
 * @desc Search templates by query
 * @access Public
 */
router.get('/search', searchRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required',
        timestamp: new Date().toISOString()
      });
    }

    const templates = await service.searchTemplates(q);

    res.json({
      success: true,
      data: templates,
      count: templates.length,
      query: q,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search templates',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/ab-test-templates/health
 * @desc Get service health status and template statistics
 * @access Public
 */
router.get('/health', templateRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const health = await service.getHealthStatus();

    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get health status',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * API Documentation
 */
router.get('/docs', templateRateLimit, async (req: express.Request, res: express.Response) => {
  res.json({
    name: 'A/B Test Template Service',
    version: '1.0.0',
    description: 'Industry-specific A/B test template library with pre-configured experiments optimized for different business models and use cases',
    endpoints: {
      'GET /': 'Get all templates with optional filtering',
      'GET /:id': 'Get specific template by ID',
      'POST /recommendations': 'Get template recommendations based on customer profile',
      'GET /industry/:industry': 'Get templates for specific industry',
      'GET /category/:category': 'Get templates for specific category',
      'GET /search': 'Search templates by query',
      'GET /health': 'Service health and statistics'
    },
    filters: {
      industry: ['saas', 'ecommerce', 'manufacturing', 'healthcare', 'fintech', 'education', 'government', 'consulting', 'real-estate', 'travel', 'media', 'nonprofit', 'retail', 'automotive', 'energy', 'logistics'],
      businessModel: ['b2b', 'b2c', 'b2b2c', 'marketplace', 'subscription', 'transactional', 'freemium', 'enterprise', 'self-serve'],
      category: ['conversion-optimization', 'user-experience', 'pricing', 'onboarding', 'checkout', 'landing-page', 'email', 'navigation', 'trust-building', 'mobile-optimization', 'feature-adoption', 'retention', 'revenue-optimization'],
      difficulty: ['beginner', 'intermediate', 'advanced', 'expert'],
      testType: ['simple-ab', 'multivariate', 'split-url', 'feature-flag', 'personalization', 'targeting', 'behavioral'],
      expectedImpact: ['low', 'medium', 'high']
    },
    examples: {
      'Get SaaS templates': 'GET /api/v1/ab-test-templates?industry=saas',
      'Get beginner templates': 'GET /api/v1/ab-test-templates?difficulty=beginner',
      'Get high-impact conversion templates': 'GET /api/v1/ab-test-templates?category=conversion-optimization&expectedImpact=high',
      'Search for checkout templates': 'GET /api/v1/ab-test-templates/search?q=checkout',
      'Get recommendations': 'POST /api/v1/ab-test-templates/recommendations with customer profile'
    }
  });
});

export default router;
