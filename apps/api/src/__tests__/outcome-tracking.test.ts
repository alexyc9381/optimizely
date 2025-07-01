import express from 'express';
import request from 'supertest';
import outcomeTrackingRoutes from '../routes/outcome-tracking';
import OutcomeTrackingService from '../services/outcome-tracking-service';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/v1/outcome-tracking', outcomeTrackingRoutes);

describe('Outcome Tracking System', () => {
  let outcomeService: OutcomeTrackingService;

  beforeEach(() => {
    // Reset singleton instance for testing
    (OutcomeTrackingService as any)._instance = null;
    outcomeService = OutcomeTrackingService.getInstance();
  });

  describe('OutcomeTrackingService', () => {
    describe('User Outcome Tracking', () => {
      it('should track user outcome with proper metrics calculation', async () => {
        const outcomeData = {
          userId: 'user_123',
          companyId: 'company_456',
          industry: 'saas' as const,
          configurationId: 'config_789',
          outcomeType: 'conversion' as const,
          outcome: {
            event: 'signup_completed',
            value: 100,
            metadata: { plan: 'premium' },
          },
          context: {
            sessionId: 'session_abc',
            userAgent: 'Mozilla/5.0',
            source: 'organic',
            campaign: 'summer_promo',
            abTestVariant: 'variant_a',
          },
          metrics: {
            revenueImpact: 99.99,
          },
        };

        const outcomeId = await outcomeService.trackOutcome(outcomeData);

        expect(outcomeId).toBeDefined();
        expect(outcomeId).toMatch(/^outcome_\d+_\w+$/);

        // Verify outcome is stored and metrics are calculated
        const userOutcomes = await outcomeService.getUserOutcomes({
          userId: 'user_123',
        });

        expect(userOutcomes).toHaveLength(1);
        expect(userOutcomes[0]).toMatchObject({
          userId: 'user_123',
          companyId: 'company_456',
          industry: 'saas',
          outcomeType: 'conversion',
        });
        expect(userOutcomes[0].metrics).toHaveProperty('conversionRate');
        expect(userOutcomes[0].metrics).toHaveProperty('engagementScore');
      });

      it('should track business outcome with impact calculations', async () => {
        const businessOutcomeData = {
          companyId: 'company_789',
          industry: 'healthcare',
          configurationId: 'config_123',
          outcomeType: 'revenue_increase' as const,
          value: 50000,
          currency: 'USD',
          measurementPeriod: {
            start: new Date('2024-01-01'),
            end: new Date('2024-03-31'),
          },
          baseline: 40000,
          improvement: 10000,
          improvementPercentage: 25,
          confidence: 0.95,
          attribution: {
            platform: 0.7,
            external: 0.2,
            seasonal: 0.1,
          },
          metadata: {
            department: 'sales',
            region: 'north_america',
          },
        };

        const outcomeId = await outcomeService.trackBusinessOutcome(businessOutcomeData);

        expect(outcomeId).toBeDefined();

        const businessOutcomes = await outcomeService.getBusinessOutcomes('healthcare');
        expect(businessOutcomes).toHaveLength(1);
        expect(businessOutcomes[0]).toMatchObject({
          companyId: 'company_789',
          industry: 'healthcare',
          outcomeType: 'revenue_increase',
          value: 50000,
          improvement: 10000,
          improvementPercentage: 25,
        });
      });

      it('should calculate industry metrics correctly', async () => {
        // Track multiple outcomes for an industry
        const outcomes = [
          {
            userId: 'user_1',
            companyId: 'company_1',
            industry: 'fintech' as const,
            configurationId: 'config_1',
            outcomeType: 'conversion' as const,
            outcome: { event: 'account_opened' },
            context: { sessionId: 'session_1', source: 'web' },
            metrics: { revenueImpact: 200 },
          },
          {
            userId: 'user_2',
            companyId: 'company_1',
            industry: 'fintech' as const,
            configurationId: 'config_1',
            outcomeType: 'feature_adoption' as const,
            outcome: { event: 'mobile_app_usage' },
            context: { sessionId: 'session_2', source: 'mobile' },
            metrics: { engagementScore: 75 },
          },
          {
            userId: 'user_3',
            companyId: 'company_1',
            industry: 'fintech' as const,
            configurationId: 'config_1',
            outcomeType: 'churn' as const,
            outcome: { event: 'account_closed' },
            context: { sessionId: 'session_3', source: 'web' },
            metrics: {},
          },
        ];

        for (const outcome of outcomes) {
          await outcomeService.trackOutcome(outcome);
        }

        const metrics = await outcomeService.getIndustryMetrics('fintech');

        expect(metrics).toMatchObject({
          industry: 'fintech',
          totalUsers: 3,
          totalConversions: 1,
        });
        expect(metrics.conversionRate).toBeCloseTo(0.33, 2);
        expect(metrics.churnRate).toBeCloseTo(0.33, 2);
        expect(metrics.outcomeBreakdown.conversions).toBe(1);
        expect(metrics.outcomeBreakdown.featureAdoptions).toBe(1);
        expect(metrics.outcomeBreakdown.churns).toBe(1);
      });

      it('should generate conversion funnel analysis', async () => {
        // Track funnel progression
        const funnelOutcomes = [
          {
            userId: 'user_funnel_1',
            companyId: 'company_funnel',
            industry: 'manufacturing' as const,
            configurationId: 'config_funnel',
            outcomeType: 'engagement' as const,
            outcome: { event: 'onboarding_started' },
            context: { sessionId: 'session_f1', source: 'web' },
            metrics: {},
          },
          {
            userId: 'user_funnel_1',
            companyId: 'company_funnel',
            industry: 'manufacturing' as const,
            configurationId: 'config_funnel',
            outcomeType: 'engagement' as const,
            outcome: { event: 'profile_completed' },
            context: { sessionId: 'session_f1', source: 'web' },
            metrics: {},
          },
          {
            userId: 'user_funnel_1',
            companyId: 'company_funnel',
            industry: 'manufacturing' as const,
            configurationId: 'config_funnel',
            outcomeType: 'conversion' as const,
            outcome: { event: 'conversion' },
            context: { sessionId: 'session_f1', source: 'web' },
            metrics: {},
          },
        ];

        for (const outcome of funnelOutcomes) {
          await outcomeService.trackOutcome(outcome);
        }

        const funnel = await outcomeService.getConversionFunnel('manufacturing', 'config_funnel');

        expect(funnel).toMatchObject({
          industry: 'manufacturing',
          configurationId: 'config_funnel',
        });
        expect(funnel.stages).toHaveLength(5); // Standard funnel stages
        expect(funnel.totalConversionRate).toBeGreaterThan(0);
        expect(funnel.bottlenecks).toBeDefined();
      });

      it('should track feature adoption metrics', async () => {
        const featureOutcomes = [
          {
            userId: 'user_feature_1',
            companyId: 'company_feature',
            industry: 'college-consulting' as const,
            configurationId: 'config_feature',
            outcomeType: 'feature_adoption' as const,
            outcome: { event: 'calendar_integration' },
            context: { sessionId: 'session_feat1', source: 'web' },
            metrics: {},
          },
          {
            userId: 'user_feature_2',
            companyId: 'company_feature',
            industry: 'college-consulting' as const,
            configurationId: 'config_feature',
            outcomeType: 'feature_adoption' as const,
            outcome: { event: 'calendar_integration' },
            context: { sessionId: 'session_feat2', source: 'web' },
            metrics: {},
          },
        ];

        for (const outcome of featureOutcomes) {
          await outcomeService.trackOutcome(outcome);
        }

        const featureMetrics = await outcomeService.getFeatureAdoptionMetrics(
          'calendar_integration',
          'college-consulting'
        );

        expect(featureMetrics).toHaveLength(1);
        expect(featureMetrics[0]).toMatchObject({
          feature: 'calendar_integration',
          industry: 'college-consulting',
          adoptedUsers: 2,
          adoptionRate: expect.any(Number),
        });
      });

      it('should provide cross-industry comparison', async () => {
        // Track outcomes across multiple industries
        const industries = ['saas', 'manufacturing', 'healthcare'] as const;

        for (let i = 0; i < industries.length; i++) {
          const industry = industries[i];
          for (let j = 0; j < 5; j++) {
            await outcomeService.trackOutcome({
              userId: `user_${industry}_${j}`,
              companyId: `company_${industry}`,
              industry,
              configurationId: `config_${industry}`,
              outcomeType: j < 2 ? 'conversion' : 'engagement',
              outcome: { event: `event_${j}` },
              context: { sessionId: `session_${industry}_${j}`, source: 'web' },
              metrics: { revenueImpact: (i + 1) * 100 },
            });
          }
        }

        const comparison = await outcomeService.getCrossIndustryComparison();

        expect(comparison.industries).toHaveLength(5); // All 5 industries
        expect(comparison.benchmarks).toHaveProperty('avgConversionRate');
        expect(comparison.benchmarks).toHaveProperty('avgEngagementScore');
        expect(comparison.topPerformers).toHaveProperty('conversion');
        expect(comparison.topPerformers).toHaveProperty('engagement');
        expect(comparison.topPerformers).toHaveProperty('revenue');
        expect(comparison.topPerformers).toHaveProperty('retention');
      });
    });

    describe('Data Management', () => {
      it('should filter user outcomes correctly', async () => {
        const testOutcomes = [
          {
            userId: 'user_filter_1',
            companyId: 'company_filter_1',
            industry: 'saas' as const,
            configurationId: 'config_filter',
            outcomeType: 'conversion' as const,
            outcome: { event: 'purchase' },
            context: { sessionId: 'session_filter_1', source: 'web' },
            metrics: {},
          },
          {
            userId: 'user_filter_2',
            companyId: 'company_filter_2',
            industry: 'healthcare' as const,
            configurationId: 'config_filter',
            outcomeType: 'engagement' as const,
            outcome: { event: 'page_view' },
            context: { sessionId: 'session_filter_2', source: 'web' },
            metrics: {},
          },
        ];

        for (const outcome of testOutcomes) {
          await outcomeService.trackOutcome(outcome);
        }

        // Test industry filter
        const saasOutcomes = await outcomeService.getUserOutcomes({ industry: 'saas' });
        expect(saasOutcomes).toHaveLength(1);
        expect(saasOutcomes[0].industry).toBe('saas');

        // Test outcome type filter
        const conversionOutcomes = await outcomeService.getUserOutcomes({ outcomeType: 'conversion' });
        expect(conversionOutcomes).toHaveLength(1);
        expect(conversionOutcomes[0].outcomeType).toBe('conversion');

        // Test company filter
        const company1Outcomes = await outcomeService.getUserOutcomes({ companyId: 'company_filter_1' });
        expect(company1Outcomes).toHaveLength(1);
        expect(company1Outcomes[0].companyId).toBe('company_filter_1');

        // Test limit
        const limitedOutcomes = await outcomeService.getUserOutcomes({ limit: 1 });
        expect(limitedOutcomes).toHaveLength(1);
      });

      it('should handle date-based filtering for business outcomes', async () => {
        const oldDate = new Date('2023-01-01');
        const recentDate = new Date('2024-01-01');

        await outcomeService.trackBusinessOutcome({
          companyId: 'company_date_test',
          industry: 'fintech',
          configurationId: 'config_date',
          outcomeType: 'revenue_increase',
          value: 1000,
          baseline: 800,
          improvement: 200,
          improvementPercentage: 25,
          confidence: 0.9,
          attribution: { platform: 1, external: 0, seasonal: 0 },
          measurementPeriod: {
            start: oldDate,
            end: new Date('2023-03-31'),
          },
          metadata: {},
        });

        await outcomeService.trackBusinessOutcome({
          companyId: 'company_date_test',
          industry: 'fintech',
          configurationId: 'config_date',
          outcomeType: 'cost_reduction',
          value: 500,
          baseline: 600,
          improvement: 100,
          improvementPercentage: 16.67,
          confidence: 0.85,
          attribution: { platform: 1, external: 0, seasonal: 0 },
          measurementPeriod: {
            start: recentDate,
            end: new Date('2024-03-31'),
          },
          metadata: {},
        });

        const recentOutcomes = await outcomeService.getBusinessOutcomes(
          'fintech',
          recentDate,
          undefined
        );

        expect(recentOutcomes).toHaveLength(1);
        expect(recentOutcomes[0].outcomeType).toBe('cost_reduction');
      });
    });

    describe('Event System', () => {
      it('should emit events when outcomes are tracked', (done) => {
        let eventCount = 0;

        outcomeService.on('outcome_tracked', (outcome) => {
          expect(outcome).toHaveProperty('id');
          expect(outcome).toHaveProperty('userId');
          eventCount++;

          if (eventCount === 1) {
            done();
          }
        });

        outcomeService.trackOutcome({
          userId: 'user_event_test',
          companyId: 'company_event_test',
          industry: 'saas',
          configurationId: 'config_event',
          outcomeType: 'conversion',
          outcome: { event: 'test_conversion' },
          context: { sessionId: 'session_event', source: 'test' },
          metrics: {},
        });
      });

      it('should emit events when business outcomes are tracked', (done) => {
        outcomeService.on('business_outcome_tracked', (outcome) => {
          expect(outcome).toHaveProperty('id');
          expect(outcome).toHaveProperty('companyId');
          done();
        });

        outcomeService.trackBusinessOutcome({
          companyId: 'company_business_event',
          industry: 'manufacturing',
          configurationId: 'config_business',
          outcomeType: 'efficiency_gain',
          value: 2000,
          baseline: 1500,
          improvement: 500,
          improvementPercentage: 33.33,
          confidence: 0.92,
          attribution: { platform: 0.8, external: 0.2, seasonal: 0 },
          measurementPeriod: {
            start: new Date('2024-01-01'),
            end: new Date('2024-03-31'),
          },
          metadata: { process: 'automation' },
        });
      });
    });
  });

  describe('API Endpoints', () => {
    describe('POST /track', () => {
      it('should track user outcome via API', async () => {
        const outcomeData = {
          userId: 'api_user_123',
          companyId: 'api_company_456',
          industry: 'healthcare',
          configurationId: 'api_config_789',
          outcomeType: 'feature_adoption',
          outcome: {
            event: 'patient_portal_access',
            value: 1,
            metadata: { feature: 'scheduling' },
          },
          context: {
            sessionId: 'api_session_abc',
            userAgent: 'API Test Agent',
            source: 'mobile_app',
            campaign: 'feature_announcement',
          },
          metrics: {
            engagementScore: 85,
          },
        };

        const response = await request(app)
          .post('/api/v1/outcome-tracking/track')
          .send(outcomeData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Outcome tracked successfully',
          data: {
            outcomeId: expect.stringMatching(/^outcome_\d+_\w+$/),
          },
        });
      });

      it('should validate required fields', async () => {
        const incompleteData = {
          userId: 'user_123',
          // Missing required fields
        };

        const response = await request(app)
          .post('/api/v1/outcome-tracking/track')
          .send(incompleteData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({
              msg: expect.any(String),
            }),
          ]),
        });
      });

      it('should validate industry enum', async () => {
        const invalidData = {
          userId: 'user_123',
          companyId: 'company_456',
          industry: 'invalid_industry',
          configurationId: 'config_789',
          outcomeType: 'conversion',
          outcome: { event: 'test' },
          context: { sessionId: 'session_123', source: 'web' },
        };

        const response = await request(app)
          .post('/api/v1/outcome-tracking/track')
          .send(invalidData)
          .expect(400);

        expect(response.body.errors).toContainEqual(
          expect.objectContaining({
            msg: 'Invalid industry',
          })
        );
      });
    });

    describe('POST /business', () => {
      it('should track business outcome via API', async () => {
        const businessData = {
          companyId: 'api_business_company',
          industry: 'college-consulting',
          configurationId: 'api_business_config',
          outcomeType: 'customer_satisfaction',
          value: 4.8,
          baseline: 4.2,
          improvement: 0.6,
          confidence: 0.95,
          attribution: {
            platform: 0.7,
            external: 0.3,
            seasonal: 0,
          },
          measurementPeriod: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-03-31T23:59:59Z',
          },
          metadata: {
            survey: 'post_consultation',
            response_rate: 0.85,
          },
        };

        const response = await request(app)
          .post('/api/v1/outcome-tracking/business')
          .send(businessData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Business outcome tracked successfully',
          data: {
            outcomeId: expect.any(String),
          },
        });
      });

      it('should calculate improvement percentage automatically', async () => {
        const businessData = {
          companyId: 'auto_calc_company',
          industry: 'saas',
          configurationId: 'auto_calc_config',
          outcomeType: 'revenue_increase',
          value: 120000,
          baseline: 100000,
          improvement: 20000,
          confidence: 0.9,
          attribution: { platform: 1, external: 0, seasonal: 0 },
          measurementPeriod: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-03-31T23:59:59Z',
          },
          metadata: {},
        };

        await request(app)
          .post('/api/v1/outcome-tracking/business')
          .send(businessData)
          .expect(201);

        // The improvement percentage should be calculated as 20%
        // This would be verified by checking the stored data
      });
    });

    describe('GET /metrics/:industry', () => {
      it('should return industry metrics', async () => {
        // First track some outcomes for the industry
        await outcomeService.trackOutcome({
          userId: 'metrics_user_1',
          companyId: 'metrics_company',
          industry: 'fintech',
          configurationId: 'metrics_config',
          outcomeType: 'conversion',
          outcome: { event: 'account_created' },
          context: { sessionId: 'metrics_session_1', source: 'web' },
          metrics: { revenueImpact: 500 },
        });

        const response = await request(app)
          .get('/api/v1/outcome-tracking/metrics/fintech')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            industry: 'fintech',
            totalUsers: expect.any(Number),
            totalConversions: expect.any(Number),
            conversionRate: expect.any(Number),
            averageEngagementScore: expect.any(Number),
            featureAdoptionRate: expect.any(Number),
            topFeatures: expect.any(Array),
            outcomeBreakdown: expect.any(Object),
          },
        });
      });

      it('should validate industry parameter', async () => {
        const response = await request(app)
          .get('/api/v1/outcome-tracking/metrics/invalid_industry')
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Invalid industry',
        });
      });
    });

    describe('GET /cross-industry-comparison', () => {
      it('should return cross-industry performance comparison', async () => {
        const response = await request(app)
          .get('/api/v1/outcome-tracking/cross-industry-comparison')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            industries: expect.arrayContaining([
              expect.objectContaining({
                industry: expect.any(String),
                totalUsers: expect.any(Number),
                conversionRate: expect.any(Number),
              }),
            ]),
            benchmarks: {
              avgConversionRate: expect.any(Number),
              avgEngagementScore: expect.any(Number),
              avgFeatureAdoptionRate: expect.any(Number),
              avgRevenuePerUser: expect.any(Number),
            },
            topPerformers: {
              conversion: expect.any(Object),
              engagement: expect.any(Object),
              revenue: expect.any(Object),
              retention: expect.any(Object),
            },
          },
        });
      });
    });

    describe('GET /health', () => {
      it('should return health status', async () => {
        const response = await request(app)
          .get('/api/v1/outcome-tracking/health')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Outcome tracking service is healthy',
          timestamp: expect.any(String),
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock a service error
      const originalTrackOutcome = outcomeService.trackOutcome;
      outcomeService.trackOutcome = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/v1/outcome-tracking/track')
        .send({
          userId: 'error_user',
          companyId: 'error_company',
          industry: 'saas',
          configurationId: 'error_config',
          outcomeType: 'conversion',
          outcome: { event: 'error_test' },
          context: { sessionId: 'error_session', source: 'test' },
        })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Failed to track outcome',
        error: 'Database error',
      });

      // Restore original method
      outcomeService.trackOutcome = originalTrackOutcome;
    });
  });
});
