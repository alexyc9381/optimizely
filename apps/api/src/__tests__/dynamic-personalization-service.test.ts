import DynamicPersonalizationService, {
    PersonalizationRequest,
    PersonalizationRule
} from '../services/dynamic-personalization-service';
import {
    PsychographicProfile
} from '../services/psychographic-profiling-service';

describe('DynamicPersonalizationService', () => {
  let service: DynamicPersonalizationService;
  let mockPsychographicProfile: PsychographicProfile;

  beforeEach(() => {
    service = new DynamicPersonalizationService();

    mockPsychographicProfile = {
      sessionId: 'test-session',
      userId: 'test-user',
      decisionMakingStyle: {
        primary: 'analytical',
        confidence: 0.85,
        indicators: ['data-driven', 'methodical']
      },
      riskTolerance: {
        level: 'moderate',
        confidence: 0.80,
        indicators: ['measured-approach']
      },
      valuePerception: {
        primary: 'quality_focused',
        confidence: 0.90,
        indicators: ['premium-content-engagement']
      },
      communicationPreference: {
        style: 'detailed',
        confidence: 0.75,
        indicators: ['long-content-engagement']
      },
      buyingJourneyStage: {
        stage: 'consideration',
        confidence: 0.85,
        indicators: ['comparison-behavior']
      },
      confidence: 0.85,
      lastUpdated: new Date(),
      behaviorSegments: ['analytical', 'quality-focused']
    };

    // Clear any global timers
    jest.clearAllTimers();
  });

  afterEach(() => {
    // Clean up event listeners
    service.removeAllListeners();
  });

  describe('Service Initialization', () => {
    it('should initialize with default templates', () => {
      const status = service.getServiceStatus();
      expect(status.status).toBe('healthy');
      expect(status.templates).toBeGreaterThan(0);
      expect(status.features).toContain('Real-time personalization');
      expect(status.features).toContain('Universal platform support');
    });

    it('should start performance monitoring', (done) => {
      service.on('performance_metrics', (metrics) => {
        expect(metrics).toHaveProperty('averageResponseTime');
        expect(metrics).toHaveProperty('totalRequests');
        expect(metrics).toHaveProperty('cacheHitRate');
        expect(metrics).toHaveProperty('errorRate');
        done();
      });

      // Trigger performance metrics emission
      setTimeout(() => {
        service.emit('performance_metrics', service.getPerformanceMetrics());
      }, 100);
    });
  });

  describe('Personalization Rule Management', () => {
    it('should create a personalization rule', async () => {
      const ruleData = {
        name: 'Test Headline Rule',
        description: 'Test rule for headlines',
        targetSegments: ['all'],
        element: 'h1',
        property: 'textContent',
        variations: [
          {
            id: 'analytical',
            name: 'Analytical Variation',
            value: 'Data-Driven Solutions',
            psychographicMatch: { decisionMaking: ['analytical'] },
            weight: 1,
            performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
          }
        ],
        conditions: [],
        priority: 5,
        status: 'active' as const
      };

      const rule = await service.createPersonalizationRule(ruleData);

      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('Test Headline Rule');
      expect(rule.status).toBe('active');
      expect(rule.createdAt).toBeInstanceOf(Date);
      expect(rule.updatedAt).toBeInstanceOf(Date);
    });

    it('should get all personalization rules', async () => {
      const ruleData = {
        name: 'Test Rule',
        description: 'Test description',
        targetSegments: ['all'],
        element: 'h1',
        property: 'textContent',
        variations: [{
          id: 'test',
          name: 'Test Variation',
          value: 'Test Value',
          psychographicMatch: {},
          weight: 1,
          performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
        }],
        conditions: [],
        priority: 1,
        status: 'active' as const
      };

      await service.createPersonalizationRule(ruleData);
      const rules = service.getAllPersonalizationRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('Test Rule');
    });

    it('should update a personalization rule', async () => {
      const rule = await service.createPersonalizationRule({
        name: 'Original Name',
        description: 'Original description',
        targetSegments: ['all'],
        element: 'h1',
        property: 'textContent',
        variations: [{
          id: 'test',
          name: 'Test Variation',
          value: 'Test Value',
          psychographicMatch: {},
          weight: 1,
          performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
        }],
        conditions: [],
        priority: 1,
        status: 'active' as const
      });

      const updatedRule = await service.updatePersonalizationRule(rule.id, {
        name: 'Updated Name',
        description: 'Updated description'
      });

      expect(updatedRule).toBeTruthy();
      expect(updatedRule?.name).toBe('Updated Name');
      expect(updatedRule?.description).toBe('Updated description');
      expect(updatedRule?.updatedAt.getTime()).toBeGreaterThan(rule.createdAt.getTime());
    });

    it('should delete a personalization rule', async () => {
      const rule = await service.createPersonalizationRule({
        name: 'To Delete',
        description: 'Will be deleted',
        targetSegments: ['all'],
        element: 'h1',
        property: 'textContent',
        variations: [{
          id: 'test',
          name: 'Test Variation',
          value: 'Test Value',
          psychographicMatch: {},
          weight: 1,
          performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
        }],
        conditions: [],
        priority: 1,
        status: 'active' as const
      });

      const deleted = await service.deletePersonalizationRule(rule.id);
      expect(deleted).toBe(true);

      const retrievedRule = service.getPersonalizationRule(rule.id);
      expect(retrievedRule).toBeNull();
    });
  });

  describe('Real-time Personalization', () => {
    let testRule: PersonalizationRule;

    beforeEach(async () => {
      testRule = await service.createPersonalizationRule({
        name: 'Psychographic Headlines',
        description: 'Personalize headlines based on decision-making style',
        targetSegments: ['all'],
        element: 'h1, .headline',
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
          }
        ],
        conditions: [],
        priority: 5,
        status: 'active'
      });
    });

    it('should get personalized content for analytical visitor', async () => {
      const request: PersonalizationRequest = {
        visitorId: 'test-visitor',
        url: 'https://example.com',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(),
        psychographicProfile: mockPsychographicProfile,
        context: {
          device: 'desktop',
          browser: 'chrome',
          viewport: { width: 1920, height: 1080 }
        }
      };

      const response = await service.getPersonalizedContent(request);

      expect(response.visitorId).toBe('test-visitor');
      expect(response.personalizations).toHaveLength(1);
      expect(response.personalizations[0].personalizedValue).toBe('Increase ROI by 40% with Data-Driven Solutions');
      expect(response.personalizations[0].variationId).toBe('analytical');
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.processingTime).toBeLessThan(500); // Performance requirement
    });

    it('should handle visitor without psychographic profile', async () => {
      const request: PersonalizationRequest = {
        visitorId: 'no-profile-visitor',
        url: 'https://example.com',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(),
        context: {
          device: 'desktop',
          browser: 'chrome',
          viewport: { width: 1920, height: 1080 }
        }
      };

      const response = await service.getPersonalizedContent(request);

      expect(response.visitorId).toBe('no-profile-visitor');
      expect(response.personalizations).toHaveLength(0);
      expect(response.confidence).toBe(0);
    });

    it('should use cache for subsequent requests', async () => {
      const request: PersonalizationRequest = {
        visitorId: 'cache-test-visitor',
        url: 'https://example.com',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(),
        psychographicProfile: mockPsychographicProfile,
        context: {
          device: 'desktop',
          browser: 'chrome',
          viewport: { width: 1920, height: 1080 }
        }
      };

      // First request
      const response1 = await service.getPersonalizedContent(request);
      const firstResponseTime = response1.processingTime;

      // Second request (should use cache)
      const response2 = await service.getPersonalizedContent(request);
      const secondResponseTime = response2.processingTime;

      expect(response2.cacheKey).toBe(response1.cacheKey);
      expect(secondResponseTime).toBeLessThan(firstResponseTime);
    });

    it('should emit personalization events', (done) => {
      service.on('personalization_applied', (event) => {
        expect(event.visitorId).toBe('event-test-visitor');
        expect(event.personalizations).toBeGreaterThan(0);
        expect(event.processingTime).toBeDefined();
        expect(event.confidence).toBeDefined();
        done();
      });

      const request: PersonalizationRequest = {
        visitorId: 'event-test-visitor',
        url: 'https://example.com',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(),
        psychographicProfile: mockPsychographicProfile,
        context: {
          device: 'desktop',
          browser: 'chrome',
          viewport: { width: 1920, height: 1080 }
        }
      };

      service.getPersonalizedContent(request);
    });
  });

  describe('Universal Platform Support', () => {
    it('should generate client-side script', () => {
      const script = service.generateClientSideScript('test-visitor-123');

      expect(script).toContain('test-visitor-123');
      expect(script).toContain('PERSONALIZATION_API');
      expect(script).toContain('applyPersonalizations');
      expect(script).toContain('fetch');

      // Check for universal DOM manipulation
      expect(script).toContain('textContent');
      expect(script).toContain('innerHTML');
      expect(script).toContain('style.');
      expect(script).toContain('setAttribute');
    });

    it('should detect mobile vs desktop context', async () => {
      const mobileRequest: PersonalizationRequest = {
        visitorId: 'mobile-visitor',
        url: 'https://example.com',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        timestamp: new Date(),
        psychographicProfile: mockPsychographicProfile,
        context: {
          device: 'mobile',
          browser: 'safari',
          viewport: { width: 375, height: 667 }
        }
      };

      const desktopRequest: PersonalizationRequest = {
        visitorId: 'desktop-visitor',
        url: 'https://example.com',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(),
        psychographicProfile: mockPsychographicProfile,
        context: {
          device: 'desktop',
          browser: 'chrome',
          viewport: { width: 1920, height: 1080 }
        }
      };

      const mobileResponse = await service.getPersonalizedContent(mobileRequest);
      const desktopResponse = await service.getPersonalizedContent(desktopRequest);

      expect(mobileResponse.cacheKey).not.toBe(desktopResponse.cacheKey);
      expect(mobileResponse.cacheKey).toContain('mobile');
      expect(desktopResponse.cacheKey).toContain('desktop');
    });
  });

  describe('Performance and Analytics', () => {
    it('should track performance metrics', async () => {
      const request: PersonalizationRequest = {
        visitorId: 'perf-test-visitor',
        url: 'https://example.com',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(),
        psychographicProfile: mockPsychographicProfile,
        context: {
          device: 'desktop',
          browser: 'chrome',
          viewport: { width: 1920, height: 1080 }
        }
      };

      await service.getPersonalizedContent(request);

      const metrics = service.getPerformanceMetrics();

      expect(metrics.totalRequests).toBeGreaterThan(0);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
    });

    it('should track conversion and update analytics', async () => {
      // First, get personalization to establish a baseline
      const request: PersonalizationRequest = {
        visitorId: 'conversion-test-visitor',
        url: 'https://example.com',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(),
        psychographicProfile: mockPsychographicProfile,
        context: {
          device: 'desktop',
          browser: 'chrome',
          viewport: { width: 1920, height: 1080 }
        }
      };

      await service.getPersonalizedContent(request);

      // Track conversion
      await service.trackConversion('conversion-test-visitor', 'purchase', 99.99);

      // Verify conversion was tracked
      const analytics = service.getPersonalizationAnalytics();
      expect(Array.isArray(analytics)).toBe(true);
    });

    it('should emit performance warning on slow responses', (done) => {
      service.on('performance_warning', (warning) => {
        expect(warning.responseTime).toBeGreaterThan(500);
        expect(warning.maxResponseTime).toBe(500);
        done();
      });

      // Simulate slow response by manually calling performance metric update
      (service as any).updatePerformanceMetrics(600, false);
    });
  });

  describe('Psychographic Matching', () => {
    let multiVariationRule: PersonalizationRule;

    beforeEach(async () => {
      multiVariationRule = await service.createPersonalizationRule({
        name: 'Multi-Psychology CTA',
        description: 'CTAs for different psychological profiles',
        targetSegments: ['all'],
        element: '.cta-button',
        property: 'textContent',
        variations: [
          {
            id: 'analytical-low-risk',
            name: 'Analytical Low Risk',
            value: 'Try Free for 30 Days',
            psychographicMatch: {
              decisionMaking: ['analytical'],
              riskTolerance: ['low']
            },
            weight: 1,
            performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
          },
          {
            id: 'intuitive-high-risk',
            name: 'Intuitive High Risk',
            value: 'Buy Now',
            psychographicMatch: {
              decisionMaking: ['intuitive'],
              riskTolerance: ['high']
            },
            weight: 1,
            performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
          },
          {
            id: 'consensus-moderate',
            name: 'Consensus Moderate',
            value: 'Join Thousands of Happy Customers',
            psychographicMatch: {
              decisionMaking: ['consensus'],
              riskTolerance: ['moderate']
            },
            weight: 1,
            performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
          }
        ],
        conditions: [],
        priority: 5,
        status: 'active'
      });
    });

    it('should match analytical low-risk profile correctly', async () => {
      const analyticalProfile: PsychographicProfile = {
        ...mockPsychographicProfile,
        decisionMakingStyle: {
          primary: 'analytical',
          confidence: 0.85,
          indicators: ['data-driven']
        },
        riskTolerance: {
          level: 'low',
          confidence: 0.80,
          indicators: ['conservative']
        }
      };

      const request: PersonalizationRequest = {
        visitorId: 'analytical-visitor',
        url: 'https://example.com',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(),
        psychographicProfile: analyticalProfile,
        context: {
          device: 'desktop',
          browser: 'chrome',
          viewport: { width: 1920, height: 1080 }
        }
      };

      const response = await service.getPersonalizedContent(request);

      expect(response.personalizations).toHaveLength(1);
      expect(response.personalizations[0].personalizedValue).toBe('Try Free for 30 Days');
      expect(response.personalizations[0].variationId).toBe('analytical-low-risk');
    });

    it('should match intuitive high-risk profile correctly', async () => {
      const intuitiveProfile: PsychographicProfile = {
        ...mockPsychographicProfile,
        decisionMakingStyle: {
          primary: 'intuitive',
          confidence: 0.85,
          indicators: ['instinctive']
        },
        riskTolerance: {
          level: 'high',
          confidence: 0.80,
          indicators: ['aggressive']
        }
      };

      const request: PersonalizationRequest = {
        visitorId: 'intuitive-visitor',
        url: 'https://example.com',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(),
        psychographicProfile: intuitiveProfile,
        context: {
          device: 'desktop',
          browser: 'chrome',
          viewport: { width: 1920, height: 1080 }
        }
      };

      const response = await service.getPersonalizedContent(request);

      expect(response.personalizations).toHaveLength(1);
      expect(response.personalizations[0].personalizedValue).toBe('Buy Now');
      expect(response.personalizations[0].variationId).toBe('intuitive-high-risk');
    });

    it('should calculate confidence based on profile match quality', async () => {
      // Perfect match profile
      const perfectMatch: PsychographicProfile = {
        ...mockPsychographicProfile,
        decisionMakingStyle: {
          primary: 'analytical',
          confidence: 0.95,
          indicators: ['data-driven']
        },
        riskTolerance: {
          level: 'low',
          confidence: 0.90,
          indicators: ['conservative']
        },
        confidence: 0.95
      };

      // Partial match profile
      const partialMatch: PsychographicProfile = {
        ...mockPsychographicProfile,
        decisionMakingStyle: {
          primary: 'analytical',
          confidence: 0.85,
          indicators: ['data-driven']
        },
        riskTolerance: {
          level: 'high', // Doesn't match low-risk variation
          confidence: 0.80,
          indicators: ['aggressive']
        },
        confidence: 0.7
      };

      const perfectRequest: PersonalizationRequest = {
        visitorId: 'perfect-match',
        url: 'https://example.com',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        psychographicProfile: perfectMatch,
        context: { device: 'desktop', browser: 'chrome', viewport: { width: 1920, height: 1080 } }
      };

      const partialRequest: PersonalizationRequest = {
        visitorId: 'partial-match',
        url: 'https://example.com',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        psychographicProfile: partialMatch,
        context: { device: 'desktop', browser: 'chrome', viewport: { width: 1920, height: 1080 } }
      };

      const perfectResponse = await service.getPersonalizedContent(perfectRequest);
      const partialResponse = await service.getPersonalizedContent(partialRequest);

      expect(perfectResponse.confidence).toBeGreaterThan(partialResponse.confidence);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully and emit error events', (done) => {
      service.on('personalization_error', (event) => {
        expect(event.error).toBeDefined();
        expect(event.request).toBeDefined();
        done();
      });

      // Create invalid request to trigger error
      const invalidRequest = {
        visitorId: null,
        url: null,
        userAgent: null,
        timestamp: new Date()
      } as any;

      service.getPersonalizedContent(invalidRequest).catch(() => {
        // Expected to fail
      });
    });

    it('should update error rate in performance metrics', async () => {
      const initialMetrics = service.getPerformanceMetrics();
      const initialErrorRate = initialMetrics.errorRate;

      // Trigger error by simulating it
      (service as any).updatePerformanceMetrics(100, false, true);

      const updatedMetrics = service.getPerformanceMetrics();
      expect(updatedMetrics.errorRate).toBeGreaterThanOrEqual(initialErrorRate);
    });
  });

  describe('Service Status and Health', () => {
    it('should return comprehensive service status', () => {
      const status = service.getServiceStatus();

      expect(status.status).toBe('healthy');
      expect(status.version).toBe('1.0.0');
      expect(status.uptime).toBeGreaterThanOrEqual(0);
      expect(status.performance).toBeDefined();
      expect(status.rules).toBeDefined();
      expect(status.templates).toBeGreaterThan(0);
      expect(status.features).toContain('Real-time personalization');
      expect(status.features).toContain('Psychographic profiling');
      expect(status.features).toContain('Universal platform support');
    });

    it('should track active vs inactive rules', async () => {
      await service.createPersonalizationRule({
        name: 'Active Rule',
        description: 'Active test rule',
        targetSegments: ['all'],
        element: 'h1',
        property: 'textContent',
        variations: [{
          id: 'test',
          name: 'Test',
          value: 'Test',
          psychographicMatch: {},
          weight: 1,
          performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
        }],
        conditions: [],
        priority: 1,
        status: 'active'
      });

      await service.createPersonalizationRule({
        name: 'Inactive Rule',
        description: 'Inactive test rule',
        targetSegments: ['all'],
        element: 'h2',
        property: 'textContent',
        variations: [{
          id: 'test2',
          name: 'Test2',
          value: 'Test2',
          psychographicMatch: {},
          weight: 1,
          performanceMetrics: { impressions: 0, conversions: 0, conversionRate: 0, confidence: 0 }
        }],
        conditions: [],
        priority: 1,
        status: 'inactive'
      });

      const status = service.getServiceStatus();
      expect(status.rules.total).toBe(2);
      expect(status.rules.active).toBe(1);
      expect(status.rules.testing).toBe(0);
    });
  });
});
