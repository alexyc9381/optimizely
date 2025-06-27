import { Redis } from 'ioredis';
import { AnalyticsService } from '../services/analytics-service';
import UniversalAPIService, { PlatformIntegration } from '../services/universal-api-service';

// Mock Redis
const mockRedis = {
  hset: jest.fn().mockResolvedValue(1),
  hget: jest.fn().mockResolvedValue(null),
  hgetall: jest.fn().mockResolvedValue({}),
  hdel: jest.fn().mockResolvedValue(1),
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0)
} as unknown as Redis;

// Mock AnalyticsService with all required methods
const mockAnalyticsService = {
  on: jest.fn(),
  emit: jest.fn(),
  getPersonalizationData: jest.fn().mockResolvedValue({
    personalizations: [
      {
        selector: '.hero-text',
        type: 'text',
        value: 'Welcome, valued customer!'
      }
    ]
  }),
  getActiveExperiments: jest.fn().mockResolvedValue([
    {
      id: 'exp_001',
      name: 'Homepage CTA Test',
      variations: [
        {
          id: 'control',
          name: 'Control',
          color: 'blue',
          text: 'Sign Up Now'
        }
      ]
    }
  ]),
  trackEvent: jest.fn().mockResolvedValue({ success: true }),
  getIntegrationAnalytics: jest.fn().mockResolvedValue({
    totalEvents: 1250,
    uniqueVisitors: 450,
    conversions: 85,
    conversionRate: 0.189,
    revenue: 12750
  })
} as any;

describe('UniversalAPIService', () => {
  let universalAPIService: UniversalAPIService;

  beforeEach(() => {
    jest.clearAllMocks();
    universalAPIService = new UniversalAPIService(mockRedis, mockAnalyticsService);
  });

  afterEach(() => {
    if (universalAPIService) {
      // Cleanup any listeners
      universalAPIService.removeAllListeners();
    }
  });

  describe('Platform Integration Registration', () => {
    it('should register a new WordPress integration successfully', async () => {
      const integration: PlatformIntegration = {
        platform: 'wordpress',
        version: '6.3.0',
        configuration: {
          apiKey: '',
          baseUrl: 'https://mystore.com',
          endpoints: {
            personalization: '/wp-json/optimizely/v1/personalization',
            analytics: '/wp-json/optimizely/v1/track',
            experiments: '/wp-json/optimizely/v1/experiments',
            config: '/wp-json/optimizely/v1/config'
          }
        },
        features: {
          personalization: true,
          abTesting: true,
          analytics: true,
          realtime: false,
          caching: true
        }
      };

      const result = await universalAPIService.registerIntegration('client_wp_001', integration);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('apiKey');
      expect(result.data).toHaveProperty('clientId', 'client_wp_001');
      expect(result.data?.features).toEqual(integration.features);
      expect(mockRedis.hset).toHaveBeenCalledWith('integrations', 'client_wp_001', expect.any(String));
      expect(mockRedis.hset).toHaveBeenCalledWith('api_keys', expect.any(String), expect.any(String));
    });

    it('should register a new Shopify integration successfully', async () => {
      const integration: PlatformIntegration = {
        platform: 'shopify',
        version: '2.0',
        configuration: {
          apiKey: '',
          baseUrl: 'https://mystore.shopify.com',
          endpoints: {
            personalization: '/apps/optimizely/personalization',
            analytics: '/apps/optimizely/track',
            experiments: '/apps/optimizely/experiments',
            config: '/apps/optimizely/config'
          },
          realtime: {
            websocket: 'wss://mystore.shopify.com/ws',
            polling: {
              interval: 30000,
              endpoint: '/apps/optimizely/poll'
            }
          }
        },
        features: {
          personalization: true,
          abTesting: true,
          analytics: true,
          realtime: true,
          caching: true
        }
      };

      const result = await universalAPIService.registerIntegration('client_shopify_001', integration);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('apiKey');
      expect(result.data?.features.realtime).toBe(true);
    });

    it('should fail to register integration with invalid configuration', async () => {
      const invalidIntegration = {
        platform: 'wordpress', // Use valid platform but invalid config
        configuration: {}, // Missing required fields
        features: {}
      } as unknown as PlatformIntegration;

      const result = await universalAPIService.registerIntegration('client_invalid', invalidIntegration);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid integration configuration');
    });
  });

  describe('Personalization API', () => {
    let apiKey: string;

    beforeEach(async () => {
      // Register an integration first to get an API key
      const integration: PlatformIntegration = {
        platform: 'react',
        configuration: {
          apiKey: '',
          baseUrl: 'https://myapp.com',
          endpoints: {
            personalization: '/api/personalization',
            analytics: '/api/track',
            experiments: '/api/experiments',
            config: '/api/config'
          }
        },
        features: {
          personalization: true,
          abTesting: true,
          analytics: true,
          realtime: false,
          caching: false
        }
      };

      const result = await universalAPIService.registerIntegration('client_react_001', integration);
      apiKey = result.data?.apiKey || '';
    });

    it('should get personalization data for a visitor', async () => {
      const result = await universalAPIService.getPersonalization(apiKey, 'visitor_123', {
        page: 'homepage',
        category: 'electronics'
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('personalizations');
      expect(mockAnalyticsService.getPersonalizationData).toHaveBeenCalledWith(
        'visitor_123',
        { page: 'homepage', category: 'electronics' }
      );
    });

    it('should fail to get personalization with invalid API key', async () => {
      const result = await universalAPIService.getPersonalization('invalid_key', 'visitor_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('should fail to get personalization when feature is disabled', async () => {
      // Register integration without personalization
      const integration: PlatformIntegration = {
        platform: 'vue',
        configuration: {
          apiKey: '',
          baseUrl: 'https://vueapp.com',
          endpoints: {
            personalization: '/api/personalization',
            analytics: '/api/track',
            experiments: '/api/experiments',
            config: '/api/config'
          }
        },
        features: {
          personalization: false,
          abTesting: true,
          analytics: true,
          realtime: false,
          caching: false
        }
      };

      const regResult = await universalAPIService.registerIntegration('client_vue_001', integration);
      const vueApiKey = regResult.data?.apiKey || '';

      const result = await universalAPIService.getPersonalization(vueApiKey, 'visitor_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Personalization not enabled for this integration');
    });
  });

  describe('A/B Testing API', () => {
    let apiKey: string;

    beforeEach(async () => {
      const integration: PlatformIntegration = {
        platform: 'angular',
        configuration: {
          apiKey: '',
          baseUrl: 'https://angularapp.com',
          endpoints: {
            personalization: '/api/personalization',
            analytics: '/api/track',
            experiments: '/api/experiments',
            config: '/api/config'
          }
        },
        features: {
          personalization: false,
          abTesting: true,
          analytics: true,
          realtime: false,
          caching: false
        }
      };

      const result = await universalAPIService.registerIntegration('client_angular_001', integration);
      apiKey = result.data?.apiKey || '';
    });

    it('should get active experiments for a visitor', async () => {
      const result = await universalAPIService.getExperiments(apiKey, 'visitor_456', {
        userAgent: 'Mozilla/5.0...',
        viewport: { width: 1920, height: 1080 }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'exp_001',
            name: 'Homepage CTA Test'
          })
        ])
      );
      expect(mockAnalyticsService.getActiveExperiments).toHaveBeenCalledWith(
        'visitor_456',
        { userAgent: 'Mozilla/5.0...', viewport: { width: 1920, height: 1080 } }
      );
    });

    it('should fail when A/B testing is disabled', async () => {
      // Register integration without A/B testing
      const integration: PlatformIntegration = {
        platform: 'static',
        configuration: {
          apiKey: '',
          baseUrl: 'https://staticsite.com',
          endpoints: {
            personalization: '/api/personalization',
            analytics: '/api/track',
            experiments: '/api/experiments',
            config: '/api/config'
          }
        },
        features: {
          personalization: true,
          abTesting: false,
          analytics: true,
          realtime: false,
          caching: false
        }
      };

      const regResult = await universalAPIService.registerIntegration('client_static_001', integration);
      const staticApiKey = regResult.data?.apiKey || '';

      const result = await universalAPIService.getExperiments(staticApiKey, 'visitor_456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('A/B testing not enabled for this integration');
    });
  });

  describe('Analytics Tracking API', () => {
    let apiKey: string;

    beforeEach(async () => {
      const integration: PlatformIntegration = {
        platform: 'custom',
        configuration: {
          apiKey: '',
          baseUrl: 'https://customapp.com',
          endpoints: {
            personalization: '/api/personalization',
            analytics: '/api/track',
            experiments: '/api/experiments',
            config: '/api/config'
          }
        },
        features: {
          personalization: true,
          abTesting: true,
          analytics: true,
          realtime: false,
          caching: false
        }
      };

      const result = await universalAPIService.registerIntegration('client_custom_001', integration);
      apiKey = result.data?.apiKey || '';
    });

    it('should track conversion events successfully', async () => {
      const event = {
        name: 'purchase',
        value: 99.99,
        currency: 'USD',
        orderId: 'order_12345',
        items: [
          { id: 'item_001', quantity: 2, price: 49.99 }
        ]
      };

      const result = await universalAPIService.trackConversion(apiKey, 'visitor_789', event);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('tracked', true);
      expect(result.data).toHaveProperty('eventId');
      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith(
        'visitor_789',
        event,
        expect.objectContaining({
          clientId: 'client_custom_001',
          platform: 'custom'
        })
      );
    });

    it('should fail to track when analytics is disabled', async () => {
      // Register integration without analytics
      const integration: PlatformIntegration = {
        platform: 'wordpress',
        configuration: {
          apiKey: '',
          baseUrl: 'https://wpsite.com',
          endpoints: {
            personalization: '/api/personalization',
            analytics: '/api/track',
            experiments: '/api/experiments',
            config: '/api/config'
          }
        },
        features: {
          personalization: true,
          abTesting: true,
          analytics: false,
          realtime: false,
          caching: false
        }
      };

      const regResult = await universalAPIService.registerIntegration('client_wp_noanalytics', integration);
      const wpApiKey = regResult.data?.apiKey || '';

      const event = { name: 'click', element: 'button' };
      const result = await universalAPIService.trackConversion(wpApiKey, 'visitor_789', event);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Analytics not enabled for this integration');
    });
  });

  describe('Configuration API', () => {
    let apiKey: string;

    beforeEach(async () => {
      const integration: PlatformIntegration = {
        platform: 'shopify',
        version: '2.0',
        configuration: {
          apiKey: '',
          baseUrl: 'https://shopifystore.com',
          endpoints: {
            personalization: '/apps/optimizely/personalization',
            analytics: '/apps/optimizely/track',
            experiments: '/apps/optimizely/experiments',
            config: '/apps/optimizely/config'
          },
          realtime: {
            websocket: 'wss://shopifystore.com/ws'
          }
        },
        features: {
          personalization: true,
          abTesting: true,
          analytics: true,
          realtime: true,
          caching: true
        }
      };

      const result = await universalAPIService.registerIntegration('client_shopify_config', integration);
      apiKey = result.data?.apiKey || '';
    });

    it('should get configuration for a client', async () => {
      const result = await universalAPIService.getConfiguration(apiKey);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        platform: 'shopify',
        features: {
          personalization: true,
          abTesting: true,
          analytics: true,
          realtime: true,
          caching: true
        },
        endpoints: {
          personalization: '/apps/optimizely/personalization',
          analytics: '/apps/optimizely/track',
          experiments: '/apps/optimizely/experiments',
          config: '/apps/optimizely/config'
        },
        realtime: {
          websocket: 'wss://shopifystore.com/ws'
        }
      });
    });
  });

  describe('Rate Limiting', () => {
    let apiKey: string;

    beforeEach(async () => {
      const integration: PlatformIntegration = {
        platform: 'react',
        configuration: {
          apiKey: '',
          baseUrl: 'https://reactapp.com',
          endpoints: {
            personalization: '/api/personalization',
            analytics: '/api/track',
            experiments: '/api/experiments',
            config: '/api/config'
          }
        },
        features: {
          personalization: true,
          abTesting: true,
          analytics: true,
          realtime: false,
          caching: false
        }
      };

      const result = await universalAPIService.registerIntegration('client_rate_limit_test', integration);
      apiKey = result.data?.apiKey || '';
    });

    it('should allow requests within rate limit', async () => {
      // Make multiple requests within the limit
      for (let i = 0; i < 5; i++) {
        const result = await universalAPIService.getConfiguration(apiKey);
        expect(result.success).toBe(true);
        expect(result.metadata?.rateLimit).toBeDefined();
        expect(result.metadata?.rateLimit?.remaining).toBeGreaterThan(0);
      }
    });

    it('should track API usage events', (done) => {
      // Listen for API usage events
      universalAPIService.on('api_usage', (data) => {
        expect(data).toEqual({
          clientId: 'client_rate_limit_test',
          platform: 'react',
          endpoint: 'config',
          timestamp: expect.any(Date)
        });
        done();
      });

      // Make a request to trigger the event
      universalAPIService.getConfiguration(apiKey);
    });
  });

  describe('Integration Analytics', () => {
    let apiKey: string;

    beforeEach(async () => {
      const integration: PlatformIntegration = {
        platform: 'vue',
        configuration: {
          apiKey: '',
          baseUrl: 'https://vueapp.com',
          endpoints: {
            personalization: '/api/personalization',
            analytics: '/api/track',
            experiments: '/api/experiments',
            config: '/api/config'
          }
        },
        features: {
          personalization: true,
          abTesting: true,
          analytics: true,
          realtime: false,
          caching: false
        }
      };

      const result = await universalAPIService.registerIntegration('client_analytics_test', integration);
      apiKey = result.data?.apiKey || '';
    });

    it('should get integration analytics data', async () => {
      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const result = await universalAPIService.getIntegrationAnalytics(apiKey, timeRange);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalEvents: 1250,
        uniqueVisitors: 450,
        conversions: 85,
        conversionRate: 0.189,
        revenue: 12750
      });
      expect(mockAnalyticsService.getIntegrationAnalytics).toHaveBeenCalledWith(
        'client_analytics_test',
        timeRange
      );
    });
  });

  describe('Service Statistics', () => {
    beforeEach(async () => {
      // Register multiple integrations for testing
      const integrations = [
        { clientId: 'client_wp_1', platform: 'wordpress' as const, features: { personalization: true, abTesting: true, analytics: true, realtime: false, caching: true } },
        { clientId: 'client_wp_2', platform: 'wordpress' as const, features: { personalization: true, abTesting: false, analytics: true, realtime: false, caching: false } },
        { clientId: 'client_shopify_1', platform: 'shopify' as const, features: { personalization: true, abTesting: true, analytics: true, realtime: true, caching: true } },
        { clientId: 'client_react_1', platform: 'react' as const, features: { personalization: false, abTesting: true, analytics: true, realtime: false, caching: false } }
      ];

      for (const integ of integrations) {
        const integration: PlatformIntegration = {
          platform: integ.platform,
          configuration: {
            apiKey: '',
            baseUrl: `https://${integ.clientId}.com`,
            endpoints: {
              personalization: '/api/personalization',
              analytics: '/api/track',
              experiments: '/api/experiments',
              config: '/api/config'
            }
          },
          features: integ.features
        };

        await universalAPIService.registerIntegration(integ.clientId, integration);
      }
    });

    it('should get correct integration statistics', async () => {
      const stats = await universalAPIService.getIntegrationStats();

      expect(stats).toEqual({
        total: 4,
        byPlatform: {
          wordpress: 2,
          shopify: 1,
          react: 1
        },
        features: {
          personalization: 3,
          abTesting: 3,
          analytics: 4,
          realtime: 1,
          caching: 2
        }
      });
    });

    it('should get active integrations list', async () => {
      const integrations = await universalAPIService.getActiveIntegrations();

      expect(integrations).toHaveLength(4);
      expect(integrations[0]).toHaveProperty('platform');
      expect(integrations[0]).toHaveProperty('configuration');
      expect(integrations[0]).toHaveProperty('features');
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // Mock Redis to throw an error
      const failingRedis = {
        hset: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
        hget: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
        hgetall: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
        hdel: jest.fn().mockRejectedValue(new Error('Redis connection failed'))
      } as unknown as Redis;

      const failingService = new UniversalAPIService(failingRedis, mockAnalyticsService);

      const integration: PlatformIntegration = {
        platform: 'wordpress',
        configuration: {
          apiKey: '',
          baseUrl: 'https://wpsite.com',
          endpoints: {
            personalization: '/api/personalization',
            analytics: '/api/track',
            experiments: '/api/experiments',
            config: '/api/config'
          }
        },
        features: {
          personalization: true,
          abTesting: true,
          analytics: true,
          realtime: false,
          caching: false
        }
      };

      const result = await failingService.registerIntegration('client_failing', integration);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to register integration');
    });

    it('should handle analytics service errors gracefully', async () => {
      // Mock analytics service to throw an error
      const failingAnalytics = {
        ...mockAnalyticsService,
        getPersonalizationData: jest.fn().mockRejectedValue(new Error('Analytics service failed'))
      } as unknown as AnalyticsService;

      const failingService = new UniversalAPIService(mockRedis, failingAnalytics);

      // Register integration first
      const integration: PlatformIntegration = {
        platform: 'react',
        configuration: {
          apiKey: '',
          baseUrl: 'https://reactapp.com',
          endpoints: {
            personalization: '/api/personalization',
            analytics: '/api/track',
            experiments: '/api/experiments',
            config: '/api/config'
          }
        },
        features: {
          personalization: true,
          abTesting: true,
          analytics: true,
          realtime: false,
          caching: false
        }
      };

      const regResult = await failingService.registerIntegration('client_failing_analytics', integration);
      const apiKey = regResult.data?.apiKey || '';

      const result = await failingService.getPersonalization(apiKey, 'visitor_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get personalization data');
    });
  });
});
