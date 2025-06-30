import {
    CustomerIndustryProfile,
    IndustryInsight,
    IndustryMetric,
    IndustrySpecificAnalytics,
    IndustryType
} from '../industry-specific-analytics';

describe('IndustrySpecificAnalytics', () => {
  let analytics: IndustrySpecificAnalytics;
  let mockCustomerProfile: CustomerIndustryProfile;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    analytics = new IndustrySpecificAnalytics({
      industryType: 'saas',
      enablePredictiveAnalytics: true,
      confidenceThreshold: 0.7,
      updateInterval: 300000,
      enableRealTimeProcessing: true,
      benchmarkingEnabled: true
    });

    mockCustomerProfile = {
      customerId: 'customer-123',
      industryType: 'saas',
      companySize: 'medium',
      businessModel: 'B2B SaaS',
      customFields: {
        vertical: 'productivity',
        employees: 150
      }
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Core Functionality', () => {
    test('should initialize with correct default configuration', () => {
      const defaultAnalytics = new IndustrySpecificAnalytics();
      expect(defaultAnalytics).toBeDefined();
    });

    test('should merge custom configuration with defaults', () => {
      const customAnalytics = new IndustrySpecificAnalytics({
        industryType: 'college_consulting',
        confidenceThreshold: 0.8
      });
      expect(customAnalytics).toBeDefined();
    });

    test('should emit periodic update events', () => {
      const listener = jest.fn();
      analytics.on('periodic_update', listener);

      jest.advanceTimersByTime(300000);
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Customer Analysis', () => {
    test('should analyze SaaS customer successfully', async () => {
      const behaviorData = {
        saas: {
          subscriptionMetrics: {
            mrr: 5000,
            churnRate: 0.05,
            ltv: 25000
          },
          usageMetrics: {
            dailyActiveUsers: 150,
            featureUtilization: { analytics: 0.8, reports: 0.6 },
            sessionDuration: 45
          },
          engagementMetrics: {
            supportTickets: 2,
            onboardingCompletion: 0.9
          }
        }
      };

      const insights = await analytics.analyzeCustomer(
        'customer-123',
        mockCustomerProfile,
        behaviorData
      );

      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);

      const firstInsight = insights[0];
      expect(firstInsight).toHaveProperty('id');
      expect(firstInsight).toHaveProperty('industryType', 'saas');
      expect(firstInsight).toHaveProperty('confidence');
      expect(firstInsight.confidence).toBeGreaterThanOrEqual(0.7);
    });

    test('should analyze college consulting customer successfully', async () => {
      const collegeProfile: CustomerIndustryProfile = {
        ...mockCustomerProfile,
        industryType: 'college_consulting'
      };

      const behaviorData = {
        collegeConsulting: {
          pipelineStage: 'consultation',
          parentEngagement: {
            communicationFrequency: 0.8,
            meetingAttendance: 0.9
          },
          academicTimeline: {
            currentPhase: 'application_prep',
            deadlineAdherence: 0.85
          }
        }
      };

      const insights = await analytics.analyzeCustomer(
        'student-456',
        collegeProfile,
        behaviorData
      );

      expect(insights).toBeDefined();
      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0].industryType).toBe('college_consulting');
    });

    test('should handle unsupported industry types gracefully', async () => {
      const unsupportedProfile: CustomerIndustryProfile = {
        ...mockCustomerProfile,
        industryType: 'fintech'
      };

      const insights = await analytics.analyzeCustomer(
        'fintech-customer',
        unsupportedProfile,
        {}
      );

      expect(insights).toBeDefined();
      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0].industryType).toBe('fintech');
      expect(insights[0].title).toContain('General');
    });

    test('should emit analysis completion event', async () => {
      const listener = jest.fn();
      analytics.on('industry_analysis_completed', listener);

      await analytics.analyzeCustomer(
        'customer-123',
        mockCustomerProfile,
        { saas: {} }
      );

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'customer-123',
          industryType: 'saas',
          insightCount: expect.any(Number),
          processingTime: expect.any(Number),
          averageConfidence: expect.any(Number)
        })
      );
    });

    test('should handle analysis errors gracefully', async () => {
      const listener = jest.fn();
      analytics.on('industry_analysis_error', listener);

      await expect(analytics.analyzeCustomer(
        null as unknown as string,
        mockCustomerProfile,
        {}
      )).rejects.toThrow();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Industry Metrics', () => {
    test('should get SaaS-specific metrics', async () => {
      const metrics = await analytics.getIndustryMetrics('customer-123', 'saas');

      expect(metrics).toBeDefined();
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);

      const firstMetric = metrics[0];
      expect(firstMetric).toHaveProperty('id');
      expect(firstMetric).toHaveProperty('name');
      expect(firstMetric).toHaveProperty('value');
      expect(firstMetric).toHaveProperty('industrySpecific', true);
    });

    test('should get college consulting specific metrics', async () => {
      const metrics = await analytics.getIndustryMetrics('student-456', 'college_consulting');

      expect(metrics).toBeDefined();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.some(m => m.name.includes('Pipeline') || m.name.includes('Parent'))).toBe(true);
    });

    test('should cache metrics for performance', async () => {
      const startTime = Date.now();

      await analytics.getIndustryMetrics('customer-123', 'saas');
      const firstCallTime = Date.now() - startTime;

      const cachedStartTime = Date.now();
      await analytics.getIndustryMetrics('customer-123', 'saas');
      const secondCallTime = Date.now() - cachedStartTime;

      expect(secondCallTime).toBeLessThan(firstCallTime);
    });
  });

  describe('Behavioral Patterns', () => {
    test('should detect SaaS behavioral patterns', async () => {
      const behaviorData = {
        usage: { featureA: 0.8, featureB: 0.2 },
        engagement: { sessionLength: 45, frequency: 'daily' }
      };

      const patterns = await analytics.detectIndustryPatterns(
        'customer-123',
        'saas',
        behaviorData
      );

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);

      const firstPattern = patterns[0];
      expect(firstPattern).toHaveProperty('id');
      expect(firstPattern).toHaveProperty('name');
      expect(firstPattern).toHaveProperty('industry', 'saas');
      expect(firstPattern).toHaveProperty('frequency');
      expect(firstPattern).toHaveProperty('significance');
    });
  });

  describe('Industry Benchmarking', () => {
    test('should get industry benchmarks', async () => {
      const benchmarks = await analytics.getIndustryBenchmarks('saas');

      expect(benchmarks).toBeDefined();
      expect(typeof benchmarks).toBe('object');
      expect(Object.keys(benchmarks).length).toBeGreaterThan(0);
    });

    test('should benchmark customer metrics against industry standards', async () => {
      const metrics: IndustryMetric[] = [
        {
          id: 'test-metric',
          name: 'Trial to Paid Conversion',
          value: 0.2,
          unit: 'rate',
          trend: 'increasing',
          confidence: 0.9,
          industrySpecific: true
        }
      ];

      const benchmarkResults = await analytics.benchmarkCustomer(metrics, 'saas');

      expect(benchmarkResults).toBeDefined();
      expect(Array.isArray(benchmarkResults)).toBe(true);

      if (benchmarkResults.length > 0) {
        const firstResult = benchmarkResults[0];
        expect(firstResult).toHaveProperty('metric');
        expect(firstResult).toHaveProperty('performance');
        expect(firstResult).toHaveProperty('percentile');
        expect(['above', 'below', 'average']).toContain(firstResult.performance);
      }
    });
  });

  describe('Recommendations Generation', () => {
    test('should generate SaaS-specific recommendations', async () => {
      const insights: IndustryInsight[] = [
        {
          id: 'test-insight',
          industryType: 'saas',
          category: 'engagement',
          title: 'Low Feature Adoption',
          description: 'Customer shows low adoption of key features',
          recommendation: 'Implement guided onboarding',
          confidence: 0.85,
          priority: 'high',
          impactScore: 0.8,
          timestamp: new Date(),
          metrics: [],
          patterns: []
        }
      ];

      const recommendations = await analytics.generateRecommendations(insights, 'saas');

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);

      const firstRec = recommendations[0];
      expect(firstRec).toHaveProperty('category');
      expect(firstRec).toHaveProperty('action');
      expect(firstRec).toHaveProperty('reasoning');
      expect(firstRec).toHaveProperty('expectedImpact');
      expect(firstRec).toHaveProperty('timeframe');
      expect(firstRec).toHaveProperty('effort');
      expect(['low', 'medium', 'high']).toContain(firstRec.effort);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid customer data gracefully', async () => {
      const invalidProfile = {
        customerId: '',
        industryType: 'invalid_industry' as IndustryType,
        companySize: 'unknown' as unknown as CustomerIndustryProfile['companySize'],
        customFields: {}
      };

      await expect(analytics.analyzeCustomer(
        'invalid-customer',
        invalidProfile,
        {}
      )).rejects.toThrow();
    });

    test('should validate required parameters', async () => {
      await expect(analytics.analyzeCustomer(
        '',
        mockCustomerProfile,
        {}
      )).rejects.toThrow();

      await expect(analytics.getIndustryMetrics(
        '',
        'saas'
      )).rejects.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large datasets efficiently', async () => {
      const largeBehaviorData = {
        saas: {
          subscriptionMetrics: { mrr: 50000, churnRate: 0.02 },
          usageMetrics: {
            dailyActiveUsers: 10000,
            featureUtilization: Object.fromEntries(
              Array.from({ length: 100 }, (_, i) => [`feature_${i}`, Math.random()])
            )
          }
        }
      };

      const startTime = Date.now();
      const insights = await analytics.analyzeCustomer(
        'large-customer',
        mockCustomerProfile,
        largeBehaviorData
      );
      const processingTime = Date.now() - startTime;

      expect(insights).toBeDefined();
      expect(processingTime).toBeLessThan(5000);
    });

    test('should handle concurrent analysis requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        analytics.analyzeCustomer(
          `concurrent-customer-${i}`,
          { ...mockCustomerProfile, customerId: `concurrent-customer-${i}` },
          { saas: {} }
        )
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('Event Emission', () => {
    test('should emit events for major operations', async () => {
      const events: string[] = [];

      analytics.on('industry_analysis_completed', () => events.push('analysis_completed'));
      analytics.on('periodic_update', () => events.push('periodic_update'));

      await analytics.analyzeCustomer('customer-123', mockCustomerProfile, { saas: {} });
      jest.advanceTimersByTime(300000);

      expect(events).toContain('analysis_completed');
      expect(events).toContain('periodic_update');
    });

    test('should provide detailed event data', async () => {
      let eventData: unknown = null;

      analytics.on('industry_analysis_completed', (data) => {
        eventData = data;
      });

      await analytics.analyzeCustomer('customer-123', mockCustomerProfile, { saas: {} });

      expect(eventData).not.toBeNull();
      expect(eventData).toHaveProperty('customerId', 'customer-123');
      expect(eventData).toHaveProperty('industryType', 'saas');
      expect(eventData).toHaveProperty('insightCount');
      expect(eventData).toHaveProperty('processingTime');
      expect(eventData).toHaveProperty('averageConfidence');
    });
  });
});
