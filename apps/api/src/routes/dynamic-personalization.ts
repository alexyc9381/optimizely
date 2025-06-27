import express from 'express';
import DynamicPersonalizationService, {
    PersonalizationRequest,
    PersonalizationRule
} from '../services/dynamic-personalization-service';
import { PsychographicProfilingService } from '../services/psychographic-profiling-service';

const router = express.Router();
const personalizationService = new DynamicPersonalizationService();
const psychographicService = new PsychographicProfilingService();

/**
 * GET /api/v1/personalization/content
 * Get personalized content for a visitor
 */
router.post('/content', async (req, res) => {
  try {
    const {
      visitorId,
      url,
      userAgent,
      referrer,
      context
    } = req.body;

    if (!visitorId || !url) {
      return res.status(400).json({
        error: 'Missing required fields: visitorId, url',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Get psychographic profile for the visitor
    const psychographicProfile = await psychographicService.getProfile(visitorId);

    const personalizationRequest: PersonalizationRequest = {
      visitorId,
      url,
      userAgent,
      referrer,
      timestamp: new Date(),
      psychographicProfile: psychographicProfile || undefined,
      context: context || {
        device: 'unknown',
        browser: 'unknown',
        viewport: { width: 1920, height: 1080 }
      }
    };

    const personalization = await personalizationService.getPersonalizedContent(personalizationRequest);

    res.json({
      success: true,
      data: personalization,
      meta: {
        hasProfile: !!psychographicProfile,
        profileConfidence: psychographicProfile?.confidence || 0,
        processingTime: personalization.processingTime
      }
    });

  } catch (error) {
    console.error('Personalization content error:', error);
    res.status(500).json({
      error: 'Failed to get personalized content',
      code: 'PERSONALIZATION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/personalization/script/:visitorId
 * Get client-side personalization script
 */
router.get('/script/:visitorId', (req, res) => {
  try {
    const { visitorId } = req.params;

    if (!visitorId) {
      return res.status(400).json({
        error: 'Missing visitorId parameter',
        code: 'MISSING_VISITOR_ID'
      });
    }

    const script = personalizationService.generateClientSideScript(visitorId);

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
    res.send(script);

  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).json({
      error: 'Failed to generate personalization script',
      code: 'SCRIPT_GENERATION_ERROR'
    });
  }
});

/**
 * POST /api/v1/personalization/conversion
 * Track conversion for personalized content
 */
router.post('/conversion', async (req, res) => {
  try {
    const { visitorId, conversionType, value } = req.body;

    if (!visitorId || !conversionType) {
      return res.status(400).json({
        error: 'Missing required fields: visitorId, conversionType',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    await personalizationService.trackConversion(visitorId, conversionType, value);

    res.json({
      success: true,
      message: 'Conversion tracked successfully',
      data: {
        visitorId,
        conversionType,
        value,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Conversion tracking error:', error);
    res.status(500).json({
      error: 'Failed to track conversion',
      code: 'CONVERSION_TRACKING_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/personalization/rules
 * Get all personalization rules
 */
router.get('/rules', (req, res) => {
  try {
    const rules = personalizationService.getAllPersonalizationRules();

    res.json({
      success: true,
      data: rules,
      meta: {
        total: rules.length,
        active: rules.filter(r => r.status === 'active').length,
        testing: rules.filter(r => r.status === 'testing').length,
        inactive: rules.filter(r => r.status === 'inactive').length
      }
    });

  } catch (error) {
    console.error('Get rules error:', error);
    res.status(500).json({
      error: 'Failed to get personalization rules',
      code: 'GET_RULES_ERROR'
    });
  }
});

/**
 * GET /api/v1/personalization/rules/:id
 * Get specific personalization rule
 */
router.get('/rules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const rule = personalizationService.getPersonalizationRule(id);

    if (!rule) {
      return res.status(404).json({
        error: 'Personalization rule not found',
        code: 'RULE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: rule
    });

  } catch (error) {
    console.error('Get rule error:', error);
    res.status(500).json({
      error: 'Failed to get personalization rule',
      code: 'GET_RULE_ERROR'
    });
  }
});

/**
 * POST /api/v1/personalization/rules
 * Create new personalization rule
 */
router.post('/rules', async (req, res) => {
  try {
    const {
      name,
      description,
      targetSegments,
      element,
      property,
      variations,
      conditions,
      priority,
      status
    } = req.body;

    // Validation
    if (!name || !element || !property || !variations || !Array.isArray(variations)) {
      return res.status(400).json({
        error: 'Missing required fields: name, element, property, variations',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate variations structure
    for (const variation of variations) {
      if (!variation.id || !variation.name || variation.value === undefined) {
        return res.status(400).json({
          error: 'Invalid variation structure: each variation must have id, name, and value',
          code: 'INVALID_VARIATION_STRUCTURE'
        });
      }
    }

    const ruleData = {
      name,
      description: description || '',
      targetSegments: targetSegments || [],
      element,
      property,
      variations: variations.map((v: any) => ({
        ...v,
        performanceMetrics: {
          impressions: 0,
          conversions: 0,
          conversionRate: 0,
          confidence: 0
        }
      })),
      conditions: conditions || [],
      priority: priority || 1,
      status: (status || 'active') as 'active' | 'inactive' | 'testing'
    };

    const rule = await personalizationService.createPersonalizationRule(ruleData);

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Personalization rule created successfully'
    });

  } catch (error) {
    console.error('Create rule error:', error);
    res.status(500).json({
      error: 'Failed to create personalization rule',
      code: 'CREATE_RULE_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/v1/personalization/rules/:id
 * Update personalization rule
 */
router.put('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedRule = await personalizationService.updatePersonalizationRule(id, updates);

    if (!updatedRule) {
      return res.status(404).json({
        error: 'Personalization rule not found',
        code: 'RULE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: updatedRule,
      message: 'Personalization rule updated successfully'
    });

  } catch (error) {
    console.error('Update rule error:', error);
    res.status(500).json({
      error: 'Failed to update personalization rule',
      code: 'UPDATE_RULE_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/v1/personalization/rules/:id
 * Delete personalization rule
 */
router.delete('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await personalizationService.deletePersonalizationRule(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Personalization rule not found',
        code: 'RULE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Personalization rule deleted successfully',
      data: { id }
    });

  } catch (error) {
    console.error('Delete rule error:', error);
    res.status(500).json({
      error: 'Failed to delete personalization rule',
      code: 'DELETE_RULE_ERROR'
    });
  }
});

/**
 * GET /api/v1/personalization/analytics
 * Get personalization analytics
 */
router.get('/analytics', (req, res) => {
  try {
    const { ruleId } = req.query;

    const analytics = personalizationService.getPersonalizationAnalytics(ruleId as string);

    res.json({
      success: true,
      data: analytics,
      meta: {
        ruleId: ruleId || 'all',
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      error: 'Failed to get personalization analytics',
      code: 'GET_ANALYTICS_ERROR'
    });
  }
});

/**
 * GET /api/v1/personalization/performance
 * Get personalization performance metrics
 */
router.get('/performance', (req, res) => {
  try {
    const metrics = personalizationService.getPerformanceMetrics();

    res.json({
      success: true,
      data: metrics,
      meta: {
        timestamp: new Date(),
        healthy: metrics.averageResponseTime < 500 && metrics.errorRate < 0.05
      }
    });

  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({
      error: 'Failed to get performance metrics',
      code: 'GET_PERFORMANCE_ERROR'
    });
  }
});

/**
 * GET /api/v1/personalization/status
 * Get service status and health check
 */
router.get('/status', (req, res) => {
  try {
    const status = personalizationService.getServiceStatus();

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      error: 'Failed to get service status',
      code: 'GET_STATUS_ERROR'
    });
  }
});

/**
 * POST /api/v1/personalization/rules/quick-setup
 * Quick setup endpoint for common personalization scenarios
 */
router.post('/rules/quick-setup', async (req, res) => {
  try {
    const { scenario, targetUrl, priority } = req.body;

    if (!scenario) {
      return res.status(400).json({
        error: 'Missing scenario parameter',
        code: 'MISSING_SCENARIO'
      });
    }

    let ruleTemplate: Omit<PersonalizationRule, 'id' | 'createdAt' | 'updatedAt'>;

    switch (scenario) {
      case 'headline-psychology':
        ruleTemplate = {
          name: 'Psychographic Headline Personalization',
          description: 'Personalize headlines based on visitor decision-making style',
          targetSegments: ['all'],
          element: 'h1, .headline, .hero-title',
          property: 'textContent',
          variations: [
            {
              id: 'analytical',
              name: 'Analytical Headlines',
              value: 'Increase ROI by 40% with Data-Driven Solutions',
              psychographicMatch: { decisionMaking: ['analytical'] },
              weight: 1,
              performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
            },
            {
              id: 'intuitive',
              name: 'Intuitive Headlines',
              value: 'Transform Your Business with Innovative Solutions',
              psychographicMatch: { decisionMaking: ['intuitive'] },
              weight: 1,
              performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
            },
            {
              id: 'consensus',
              name: 'Consensus Headlines',
              value: 'Join 10,000+ Companies Improving Their Performance',
              psychographicMatch: { decisionMaking: ['consensus'] },
              weight: 1,
              performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
            },
            {
              id: 'authoritative',
              name: 'Authoritative Headlines',
              value: 'The Industry-Leading Solution Executives Choose',
              psychographicMatch: { decisionMaking: ['authoritative'] },
              weight: 1,
              performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
            }
          ],
          conditions: [],
          priority: priority || 5,
          status: 'active'
        };
        break;

      case 'cta-risk-tolerance':
        ruleTemplate = {
          name: 'Risk-Based CTA Personalization',
          description: 'Personalize call-to-action buttons based on visitor risk tolerance',
          targetSegments: ['all'],
          element: '.cta-button, .btn-primary, button[type="submit"]',
          property: 'textContent',
          variations: [
            {
              id: 'low-risk',
              name: 'Low Risk CTA',
              value: 'Start Free Trial',
              psychographicMatch: { riskTolerance: ['low'] },
              weight: 1,
              performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
            },
            {
              id: 'moderate-risk',
              name: 'Moderate Risk CTA',
              value: 'Get Started Today',
              psychographicMatch: { riskTolerance: ['moderate'] },
              weight: 1,
              performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
            },
            {
              id: 'high-risk',
              name: 'High Risk CTA',
              value: 'Buy Now',
              psychographicMatch: { riskTolerance: ['high'] },
              weight: 1,
              performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
            }
          ],
          conditions: [],
          priority: priority || 3,
          status: 'active'
        };
        break;

      case 'value-perception-pricing':
        ruleTemplate = {
          name: 'Value Perception Pricing Display',
          description: 'Personalize pricing display based on visitor value perception',
          targetSegments: ['all'],
          element: '.pricing-display, .price, .cost',
          property: 'innerHTML',
          variations: [
            {
              id: 'price-sensitive',
              name: 'Price Sensitive Display',
              value: '<span class="highlight">$99/mo</span> <small>(Save $300/year)</small>',
              psychographicMatch: { valuePerception: ['price_sensitive'] },
              weight: 1,
              performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
            },
            {
              id: 'quality-focused',
              name: 'Quality Focused Display',
              value: '<span class="premium">$99/mo</span> <small>Premium Features Included</small>',
              psychographicMatch: { valuePerception: ['quality_focused'] },
              weight: 1,
              performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
            },
            {
              id: 'convenience-oriented',
              name: 'Convenience Display',
              value: '<span class="simple">$99/mo</span> <small>Setup in 5 minutes</small>',
              psychographicMatch: { valuePerception: ['convenience_oriented'] },
              weight: 1,
              performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
            }
          ],
          conditions: [],
          priority: priority || 4,
          status: 'active'
        };
        break;

      default:
        return res.status(400).json({
          error: 'Unknown scenario. Available: headline-psychology, cta-risk-tolerance, value-perception-pricing',
          code: 'UNKNOWN_SCENARIO'
        });
    }

    const rule = await personalizationService.createPersonalizationRule(ruleTemplate);

    res.status(201).json({
      success: true,
      data: rule,
      message: `${scenario} personalization rule created successfully`
    });

  } catch (error) {
    console.error('Quick setup error:', error);
    res.status(500).json({
      error: 'Failed to create quick setup rule',
      code: 'QUICK_SETUP_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/personalization/visitor/:visitorId
 * Get personalization history for a specific visitor
 */
router.get('/visitor/:visitorId', (req, res) => {
  try {
    const { visitorId } = req.params;

    // This would get visitor personalization history
    // For now, return basic structure
    res.json({
      success: true,
      data: {
        visitorId,
        message: 'Visitor personalization history endpoint - implementation pending'
      }
    });

  } catch (error) {
    console.error('Get visitor error:', error);
    res.status(500).json({
      error: 'Failed to get visitor data',
      code: 'GET_VISITOR_ERROR'
    });
  }
});

// Error handling middleware for personalization routes
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Personalization route error:', error);

  res.status(500).json({
    error: 'Internal personalization service error',
    code: 'PERSONALIZATION_SERVICE_ERROR',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

export default router;
