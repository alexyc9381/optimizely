import { Request, Response, Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Redis } from 'ioredis';
import { AnalyticsService } from '../services/analytics-service';
import UniversalAPIService, { PlatformIntegration, SDKConfiguration } from '../services/universal-api-service';

const router = Router();

// Service instance
let universalAPIService: UniversalAPIService;

// Initialize universal API service (called by main app)
export const initializeUniversalAPIService = (redis: Redis, analyticsService: AnalyticsService) => {
  universalAPIService = new UniversalAPIService(redis, analyticsService);
};

/**
 * Register new platform integration
 * POST /api/v1/universal/register
 */
router.post('/register',
  [
    body('clientId').isString().notEmpty().withMessage('Client ID is required'),
    body('platform').isIn(['wordpress', 'shopify', 'react', 'vue', 'angular', 'static', 'custom']).withMessage('Valid platform is required'),
    body('configuration.baseUrl').isURL().withMessage('Valid base URL is required'),
    body('features').isObject().withMessage('Features configuration is required'),
    body('features.personalization').isBoolean().withMessage('Personalization feature flag must be boolean'),
    body('features.abTesting').isBoolean().withMessage('A/B testing feature flag must be boolean'),
    body('features.analytics').isBoolean().withMessage('Analytics feature flag must be boolean'),
    body('features.realtime').isBoolean().withMessage('Realtime feature flag must be boolean'),
    body('features.caching').isBoolean().withMessage('Caching feature flag must be boolean')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation errors',
          details: errors.array()
        });
      }

      const { clientId, platform, version, configuration, features } = req.body;

      const integration: PlatformIntegration = {
        platform,
        version,
        configuration: {
          ...configuration,
          apiKey: '', // Will be generated
          endpoints: {
            personalization: '/api/v1/universal/personalization',
            analytics: '/api/v1/universal/track',
            experiments: '/api/v1/universal/experiments',
            config: '/api/v1/universal/config',
            ...configuration.endpoints
          }
        },
        features
      };

      const result = await universalAPIService.registerIntegration(clientId, integration);
      res.json(result);
    } catch (error) {
      console.error('Error registering integration:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Get personalization data
 * POST /api/v1/universal/personalization
 */
router.post('/personalization',
  [
    body('visitorId').isString().notEmpty().withMessage('Visitor ID is required'),
    body('pageData').optional().isObject()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation errors',
          details: errors.array()
        });
      }

      const apiKey = req.headers['x-api-key'] as string;
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key required'
        });
      }

      const { visitorId, pageData } = req.body;
      const result = await universalAPIService.getPersonalization(apiKey, visitorId, pageData);

      res.json(result);
    } catch (error) {
      console.error('Error getting personalization:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Get active experiments
 * POST /api/v1/universal/experiments
 */
router.post('/experiments',
  [
    body('visitorId').isString().notEmpty().withMessage('Visitor ID is required'),
    body('context').optional().isObject()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation errors',
          details: errors.array()
        });
      }

      const apiKey = req.headers['x-api-key'] as string;
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key required'
        });
      }

      const { visitorId, context } = req.body;
      const result = await universalAPIService.getExperiments(apiKey, visitorId, context);

      res.json(result);
    } catch (error) {
      console.error('Error getting experiments:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Track conversion/event
 * POST /api/v1/universal/track
 */
router.post('/track',
  [
    body('visitorId').isString().notEmpty().withMessage('Visitor ID is required'),
    body('event').isObject().notEmpty().withMessage('Event data is required'),
    body('event.name').isString().notEmpty().withMessage('Event name is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation errors',
          details: errors.array()
        });
      }

      const apiKey = req.headers['x-api-key'] as string;
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key required'
        });
      }

      const { visitorId, event } = req.body;
      const result = await universalAPIService.trackConversion(apiKey, visitorId, event);

      res.json(result);
    } catch (error) {
      console.error('Error tracking event:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Batch track multiple events
 * POST /api/v1/universal/events/batch
 */
router.post('/events/batch',
  [
    body('events').isArray().withMessage('Events array is required'),
    body('events.*.name').isString().notEmpty().withMessage('Event name is required'),
    body('events.*.visitorId').isString().notEmpty().withMessage('Visitor ID is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation errors',
          details: errors.array()
        });
      }

      const apiKey = req.headers['x-api-key'] as string;
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key required'
        });
      }

      const { events } = req.body;
      const results = [];

      for (const event of events) {
        try {
          const result = await universalAPIService.trackConversion(apiKey, event.visitorId, event);
          results.push({ success: true, eventId: event.id || event.name, data: result.data });
        } catch (error) {
          results.push({
            success: false,
            eventId: event.id || event.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        data: { results, processed: events.length }
      });
    } catch (error) {
      console.error('Error batch tracking events:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Get client configuration
 * GET /api/v1/universal/config
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required'
      });
    }

    const result = await universalAPIService.getConfiguration(apiKey);
    res.json(result);
  } catch (error) {
    console.error('Error getting configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Generate SDK for platform
 * POST /api/v1/universal/sdk/generate
 */
router.post('/sdk/generate',
  [
    body('platform').isString().notEmpty().withMessage('Platform is required'),
    body('version').isString().notEmpty().withMessage('Version is required'),
    body('features').isArray().withMessage('Features array is required'),
    body('bundle').isIn(['esm', 'umd', 'cjs']).withMessage('Valid bundle format is required'),
    body('minified').isBoolean().withMessage('Minified flag must be boolean')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation errors',
          details: errors.array()
        });
      }

      const apiKey = req.headers['x-api-key'] as string;
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key required'
        });
      }

      const config: SDKConfiguration = req.body;
      const result = await universalAPIService.generateSDK(apiKey, config);

      res.json(result);
    } catch (error) {
      console.error('Error generating SDK:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Register webhook endpoint
 * POST /api/v1/universal/webhooks
 */
router.post('/webhooks',
  [
    body('endpoint').isURL().withMessage('Valid webhook URL is required'),
    body('events').isArray().withMessage('Events array is required'),
    body('events.*').isString().withMessage('Event names must be strings')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation errors',
          details: errors.array()
        });
      }

      const apiKey = req.headers['x-api-key'] as string;
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key required'
        });
      }

      const { endpoint, events } = req.body;
      const result = await universalAPIService.registerWebhook(apiKey, endpoint, events);

      res.json(result);
    } catch (error) {
      console.error('Error registering webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Get integration analytics
 * GET /api/v1/universal/analytics
 */
router.get('/analytics',
  [
    query('start').optional().isISO8601().withMessage('Start date must be ISO8601 format'),
    query('end').optional().isISO8601().withMessage('End date must be ISO8601 format')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation errors',
          details: errors.array()
        });
      }

      const apiKey = req.headers['x-api-key'] as string;
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key required'
        });
      }

      const timeRange = req.query.start && req.query.end ? {
        start: new Date(req.query.start as string),
        end: new Date(req.query.end as string)
      } : undefined;

      const result = await universalAPIService.getIntegrationAnalytics(apiKey, timeRange);
      res.json(result);
    } catch (error) {
      console.error('Error getting integration analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Generate client-side script
 * GET /api/v1/universal/script/:visitorId
 */
router.get('/script/:visitorId',
  [
    param('visitorId').isString().notEmpty().withMessage('Visitor ID is required'),
    query('platform').optional().isString().withMessage('Platform must be string'),
    query('features').optional().isString().withMessage('Features must be comma-separated string')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation errors',
          details: errors.array()
        });
      }

      const apiKey = req.headers['x-api-key'] as string;
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key required'
        });
      }

      const { visitorId } = req.params;
      const platform = req.query.platform as string || 'universal';
      const features = req.query.features ? (req.query.features as string).split(',') : ['personalization', 'abTesting', 'analytics'];

      const config: SDKConfiguration = {
        platform,
        version: '1.0.0',
        features,
        minified: true,
        bundle: 'umd'
      };

      const result = await universalAPIService.generateSDK(apiKey, config);

      // Return JavaScript content
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(result.data?.sdk || '// SDK generation failed');
    } catch (error) {
      console.error('Error generating script:', error);
      res.setHeader('Content-Type', 'application/javascript');
      res.send('// Error generating SDK script');
    }
  }
);

/**
 * Health check endpoint
 * GET /api/v1/universal/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const stats = await universalAPIService.getIntegrationStats();

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        integrations: stats
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Service unhealthy'
    });
  }
});

/**
 * Get active integrations (admin endpoint)
 * GET /api/v1/universal/admin/integrations
 */
router.get('/admin/integrations', async (req: Request, res: Response) => {
  try {
    // In production, this should have admin authentication
    const integrations = await universalAPIService.getActiveIntegrations();
    const stats = await universalAPIService.getIntegrationStats();

    res.json({
      success: true,
      data: {
        integrations,
        stats
      }
    });
  } catch (error) {
    console.error('Error getting integrations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
