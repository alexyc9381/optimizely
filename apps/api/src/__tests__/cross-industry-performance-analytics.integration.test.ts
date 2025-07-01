/**
 * Cross-Industry Performance Analytics Integration Test
 *
 * Tests the complete system for Task 19.6: Cross-Industry Performance and Success Analytics
 *
 * Covers:
 * - Service functionality (CrossIndustryPerformanceAnalyticsService)
 * - API endpoints (cross-industry-performance-analytics routes)
 * - Data flow and business logic
 * - Performance metrics across all 5 industries
 * - Cross-industry benchmarking and comparisons
 */

import express from 'express';
import request from 'supertest';
import crossIndustryRoutes from '../routes/cross-industry-performance-analytics';
import CrossIndustryPerformanceAnalyticsService, {
    Industry,
    PerformanceLevel,
    PerformanceMetricType
} from '../services/cross-industry-performance-analytics-service';

describe('Cross-Industry Performance Analytics - Task 19.6 Integration', () => {
  let app: express.Application;
  let analyticsService: CrossIndustryPerformanceAnalyticsService;

  beforeAll(() => {
    // Setup test Express app
    app = express();
    app.use(express.json());
    app.use('/api/v1/cross-industry-performance', crossIndustryRoutes);

    // Get service instance
    analyticsService = CrossIndustryPerformanceAnalyticsService.getInstance();
  });

  beforeEach(() => {
    // Clear any existing data for clean tests
    analyticsService['performanceMetrics'].clear();
    analyticsService['performerProfiles'].clear();
    analyticsService['performerMetricsIndex'].clear();
    analyticsService['industryMetricsIndex'].clear();
    analyticsService['metricTypeIndex'].clear();
  });

  describe('Service Layer - Core Functionality', () => {
    it('should record performance metrics for all 5 industries', async () => {
      const industries = [
        Industry.COLLEGE_CONSULTING,
        Industry.SAAS,
        Industry.MANUFACTURING,
        Industry.HEALTHCARE,
        Industry.FINTECH
      ];

      const metrics = [
        PerformanceMetricType.STUDENT_ACCEPTANCE_RATE,
        PerformanceMetricType.SALES_REP_QUOTA_ATTAINMENT,
        PerformanceMetricType.ACCOUNT_MANAGER_REVENUE,
        PerformanceMetricType.CLINICAL_OUTCOME_SCORES,
        PerformanceMetricType.ADVISOR_CLIENT_PORTFOLIO
      ];

      // Record metrics for each industry
      for (let i = 0; i < industries.length; i++) {
        const metric = await analyticsService.recordPerformanceMetric(
          `performer-${i + 1}`,
          industries[i],
          metrics[i],
          85, // value
          75, // target
          {
            performerType: `performer-type-${i + 1}`,
            context: {
              department: `Department ${i + 1}`,
              team: `Team ${i + 1}`
            }
          }
        );

        expect(metric).toBeDefined();
        expect(metric.industry).toBe(industries[i]);
        expect(metric.type).toBe(metrics[i]);
        expect(metric.value).toBe(85);
        expect(metric.targetValue).toBe(75);
      }

      // Verify metrics were recorded
      const totalMetrics = analyticsService.getTotalMetricsCount();
      expect(totalMetrics).toBe(5);
    });

    it('should generate performer profiles with correct performance levels', async () => {
      // Record high-performing metric
      await analyticsService.recordPerformanceMetric(
        'high-performer',
        Industry.SAAS,
        PerformanceMetricType.SALES_REP_QUOTA_ATTAINMENT,
        95, // High value
        80  // Target
      );

      // Record low-performing metric
      await analyticsService.recordPerformanceMetric(
        'low-performer',
        Industry.SAAS,
        PerformanceMetricType.SALES_REP_QUOTA_ATTAINMENT,
        40, // Low value
        80  // Target
      );

      const highPerformer = analyticsService.getPerformerProfile('high-performer');
      const lowPerformer = analyticsService.getPerformerProfile('low-performer');

      expect(highPerformer).toBeDefined();
      expect(lowPerformer).toBeDefined();

      expect(highPerformer!.performanceLevel).toBe(PerformanceLevel.HIGH);
      expect(lowPerformer!.performanceLevel).toBe(PerformanceLevel.POOR);
    });

    it('should calculate industry benchmarks correctly', async () => {
      // Add multiple performers for SaaS industry
      const performers = ['rep-1', 'rep-2', 'rep-3', 'rep-4', 'rep-5'];
      const scores = [95, 85, 75, 65, 55];

      for (let i = 0; i < performers.length; i++) {
        await analyticsService.recordPerformanceMetric(
          performers[i],
          Industry.SAAS,
          PerformanceMetricType.SALES_REP_QUOTA_ATTAINMENT,
          scores[i],
          80
        );
      }

      const benchmarks = analyticsService.getIndustryBenchmarks(Industry.SAAS);

      expect(benchmarks).toBeDefined();
      expect(benchmarks!.totalPerformers).toBe(5);
      expect(benchmarks!.averagePerformanceScore).toBeGreaterThan(0);
      expect(benchmarks!.industry).toBe(Industry.SAAS);
    });

    it('should generate cross-industry comparison data', async () => {
      // Add performers across multiple industries
      const testData = [
        { industry: Industry.COLLEGE_CONSULTING, score: 90 },
        { industry: Industry.SAAS, score: 85 },
        { industry: Industry.MANUFACTURING, score: 80 },
        { industry: Industry.HEALTHCARE, score: 95 },
        { industry: Industry.FINTECH, score: 88 }
      ];

      for (const data of testData) {
        await analyticsService.recordPerformanceMetric(
          `performer-${data.industry}`,
          data.industry,
          PerformanceMetricType.CLIENT_SATISFACTION_SCORE,
          data.score,
          80
        );
      }

      const comparison = analyticsService.generateCrossIndustryComparison();

      expect(comparison).toBeDefined();
      expect(comparison.industries).toHaveLength(5);
      expect(comparison.performanceComparison).toHaveLength(5);
      expect(comparison.insights).toBeDefined();

      // Healthcare should be highest performing (95)
      const topIndustry = comparison.performanceComparison.find(p => p.rank === 1);
      expect(topIndustry?.industry).toBe(Industry.HEALTHCARE);
    });

    it('should filter metrics correctly', async () => {
      // Add metrics with different properties
      await analyticsService.recordPerformanceMetric(
        'performer-1',
        Industry.SAAS,
        PerformanceMetricType.SALES_REP_QUOTA_ATTAINMENT,
        85,
        80
      );

      await analyticsService.recordPerformanceMetric(
        'performer-2',
        Industry.HEALTHCARE,
        PerformanceMetricType.CLINICAL_OUTCOME_SCORES,
        90,
        85
      );

      // Test industry filter
      const saasMetrics = analyticsService.getMetrics({ industry: Industry.SAAS });
      expect(saasMetrics).toHaveLength(1);
      expect(saasMetrics[0].industry).toBe(Industry.SAAS);

      // Test performer filter
      const performer1Metrics = analyticsService.getMetrics({ performerId: 'performer-1' });
      expect(performer1Metrics).toHaveLength(1);
      expect(performer1Metrics[0].performerId).toBe('performer-1');

      // Test metric type filter
      const salesMetrics = analyticsService.getMetrics({
        metricType: PerformanceMetricType.SALES_REP_QUOTA_ATTAINMENT
      });
      expect(salesMetrics).toHaveLength(1);
      expect(salesMetrics[0].type).toBe(PerformanceMetricType.SALES_REP_QUOTA_ATTAINMENT);
    });
  });

  describe('API Layer - Endpoint Testing', () => {
    beforeEach(async () => {
      // Setup test data for API tests
      const testData = [
        {
          performerId: 'test-counselor-1',
          industry: Industry.COLLEGE_CONSULTING,
          metricType: PerformanceMetricType.STUDENT_ACCEPTANCE_RATE,
          value: 90,
          targetValue: 80
        },
        {
          performerId: 'test-rep-1',
          industry: Industry.SAAS,
          metricType: PerformanceMetricType.SALES_REP_QUOTA_ATTAINMENT,
          value: 85,
          targetValue: 75
        },
        {
          performerId: 'test-manager-1',
          industry: Industry.MANUFACTURING,
          metricType: PerformanceMetricType.ACCOUNT_MANAGER_REVENUE,
          value: 95,
          targetValue: 80
        }
      ];

      for (const data of testData) {
        await analyticsService.recordPerformanceMetric(
          data.performerId,
          data.industry,
          data.metricType,
          data.value,
          data.targetValue
        );
      }
    });

    it('should POST new performance metrics', async () => {
      const newMetric = {
        performerId: 'test-advisor-1',
        industry: Industry.FINTECH,
        metricType: PerformanceMetricType.ADVISOR_CLIENT_PORTFOLIO,
        value: 88,
        targetValue: 75,
        performerType: 'Financial Advisor',
        context: {
          department: 'Wealth Management',
          team: 'High Net Worth'
        }
      };

      const response = await request(app)
        .post('/api/v1/cross-industry-performance/metrics')
        .send(newMetric)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metric).toBeDefined();
      expect(response.body.data.metric.industry).toBe(Industry.FINTECH);
    });

    it('should GET metrics with filters', async () => {
      const response = await request(app)
        .get('/api/v1/cross-industry-performance/metrics')
        .query({ industry: Industry.SAAS })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toBeDefined();
      expect(response.body.data.metrics.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.metrics[0].industry).toBe(Industry.SAAS);
    });

    it('should GET performer profile details', async () => {
      const response = await request(app)
        .get('/api/v1/cross-industry-performance/performers/test-counselor-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profile).toBeDefined();
      expect(response.body.data.profile.performerId).toBe('test-counselor-1');
      expect(response.body.data.profile.industry).toBe(Industry.COLLEGE_CONSULTING);
    });

    it('should GET top performers by industry', async () => {
      const response = await request(app)
        .get('/api/v1/cross-industry-performance/performers/top/manufacturing')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.topPerformers).toBeDefined();
      expect(Array.isArray(response.body.data.topPerformers)).toBe(true);
    });

    it('should GET industry benchmarks', async () => {
      const response = await request(app)
        .get('/api/v1/cross-industry-performance/benchmarks/college_consulting')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.benchmarks).toBeDefined();
      expect(response.body.data.benchmarks.industry).toBe(Industry.COLLEGE_CONSULTING);
    });

    it('should GET cross-industry comparison', async () => {
      const response = await request(app)
        .get('/api/v1/cross-industry-performance/comparison')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.industries).toBeDefined();
      expect(response.body.data.performanceComparison).toBeDefined();
      expect(response.body.data.insights).toBeDefined();
    });

    it('should GET dashboard data', async () => {
      const response = await request(app)
        .get('/api/v1/cross-industry-performance/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overallStats).toBeDefined();
      expect(response.body.data.crossIndustryComparison).toBeDefined();

      // Check overall stats structure
      const stats = response.body.data.overallStats;
      expect(stats.totalPerformers).toBeGreaterThanOrEqual(0);
      expect(stats.industriesTracked).toBe(5);
      expect(stats.performanceLevelDistribution).toBeDefined();
    });

    it('should GET dashboard data filtered by industry', async () => {
      const response = await request(app)
        .get('/api/v1/cross-industry-performance/dashboard')
        .query({ industry: Industry.SAAS })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.industryData).toBeDefined();
      expect(response.body.data.industryData.industry).toBe(Industry.SAAS);
    });

    it('should GET metric types with industry filtering', async () => {
      const response = await request(app)
        .get('/api/v1/cross-industry-performance/metric-types')
        .query({ industry: Industry.HEALTHCARE })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metricTypes).toBeDefined();
      expect(response.body.data.industry).toBe(Industry.HEALTHCARE);

      // Should only include healthcare-specific metrics
      const metricTypes = response.body.data.metricTypes;
      const hasHealthcareMetrics = metricTypes.some((metric: string) =>
        metric.includes('clinical_') || metric.includes('patient_') || metric.includes('provider_')
      );
      expect(hasHealthcareMetrics).toBe(true);
    });

    it('should GET health check status', async () => {
      const response = await request(app)
        .get('/api/v1/cross-industry-performance/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.service).toBe('Cross-Industry Performance Analytics');
      expect(response.body.data.supportedIndustries).toBe(5);
    });
  });

  describe('Business Logic - Industry-Specific Performance Tracking', () => {
    it('should track College Consulting counselor effectiveness correctly', async () => {
      await analyticsService.recordPerformanceMetric(
        'counselor-jane',
        Industry.COLLEGE_CONSULTING,
        PerformanceMetricType.STUDENT_ACCEPTANCE_RATE,
        92, // 92% acceptance rate
        85  // Target 85%
      );

      await analyticsService.recordPerformanceMetric(
        'counselor-jane',
        Industry.COLLEGE_CONSULTING,
        PerformanceMetricType.CLIENT_SATISFACTION_SCORE,
        4.8, // 4.8/5 satisfaction
        4.5  // Target 4.5/5
      );

      const profile = analyticsService.getPerformerProfile('counselor-jane');
      expect(profile).toBeDefined();
      expect(profile!.industry).toBe(Industry.COLLEGE_CONSULTING);
      expect(profile!.overallScore).toBeGreaterThan(80); // Should be high performing
    });

    it('should track SaaS sales rep performance correctly', async () => {
      await analyticsService.recordPerformanceMetric(
        'rep-john',
        Industry.SAAS,
        PerformanceMetricType.SALES_REP_QUOTA_ATTAINMENT,
        115, // 115% of quota
        100  // Target 100%
      );

      await analyticsService.recordPerformanceMetric(
        'rep-john',
        Industry.SAAS,
        PerformanceMetricType.LEAD_CONVERSION_RATE,
        25, // 25% conversion rate
        20  // Target 20%
      );

      const profile = analyticsService.getPerformerProfile('rep-john');
      expect(profile).toBeDefined();
      expect(profile!.industry).toBe(Industry.SAAS);
      expect(profile!.performanceLevel).toBe(PerformanceLevel.HIGH);
    });

    it('should track Manufacturing account manager success correctly', async () => {
      await analyticsService.recordPerformanceMetric(
        'manager-bob',
        Industry.MANUFACTURING,
        PerformanceMetricType.ACCOUNT_MANAGER_REVENUE,
        1200000, // $1.2M revenue
        1000000  // Target $1M
      );

      await analyticsService.recordPerformanceMetric(
        'manager-bob',
        Industry.MANUFACTURING,
        PerformanceMetricType.CUSTOMER_RETENTION_RATE,
        95, // 95% retention
        90  // Target 90%
      );

      const profile = analyticsService.getPerformerProfile('manager-bob');
      expect(profile).toBeDefined();
      expect(profile!.industry).toBe(Industry.MANUFACTURING);
      expect(profile!.overallScore).toBeGreaterThan(85);
    });

    it('should track Healthcare clinical outcome tracking correctly', async () => {
      await analyticsService.recordPerformanceMetric(
        'doctor-smith',
        Industry.HEALTHCARE,
        PerformanceMetricType.CLINICAL_OUTCOME_SCORES,
        88, // Clinical outcome score
        80  // Target score
      );

      await analyticsService.recordPerformanceMetric(
        'doctor-smith',
        Industry.HEALTHCARE,
        PerformanceMetricType.PATIENT_SATISFACTION,
        4.7, // Patient satisfaction
        4.3  // Target satisfaction
      );

      const profile = analyticsService.getPerformerProfile('doctor-smith');
      expect(profile).toBeDefined();
      expect(profile!.industry).toBe(Industry.HEALTHCARE);
      expect(profile!.performanceLevel).toBeOneOf([PerformanceLevel.HIGH, PerformanceLevel.EXCEPTIONAL]);
    });

    it('should track FinTech advisor performance correctly', async () => {
      await analyticsService.recordPerformanceMetric(
        'advisor-alice',
        Industry.FINTECH,
        PerformanceMetricType.ADVISOR_CLIENT_PORTFOLIO,
        15000000, // $15M portfolio
        12000000  // Target $12M
      );

      await analyticsService.recordPerformanceMetric(
        'advisor-alice',
        Industry.FINTECH,
        PerformanceMetricType.INVESTMENT_PERFORMANCE,
        12.5, // 12.5% return
        10.0  // Target 10%
      );

      const profile = analyticsService.getPerformerProfile('advisor-alice');
      expect(profile).toBeDefined();
      expect(profile!.industry).toBe(Industry.FINTECH);
      expect(profile!.overallScore).toBeGreaterThan(80);
    });
  });

  describe('Cross-Industry Benchmarking and Optimization', () => {
    beforeEach(async () => {
      // Setup comprehensive cross-industry data
      const testData = [
        // College Consulting
        { industry: Industry.COLLEGE_CONSULTING, performer: 'counselor-1', score: 85 },
        { industry: Industry.COLLEGE_CONSULTING, performer: 'counselor-2', score: 90 },
        { industry: Industry.COLLEGE_CONSULTING, performer: 'counselor-3', score: 78 },

        // SaaS
        { industry: Industry.SAAS, performer: 'rep-1', score: 92 },
        { industry: Industry.SAAS, performer: 'rep-2', score: 88 },
        { industry: Industry.SAAS, performer: 'rep-3', score: 85 },

        // Manufacturing
        { industry: Industry.MANUFACTURING, performer: 'manager-1', score: 87 },
        { industry: Industry.MANUFACTURING, performer: 'manager-2', score: 83 },

        // Healthcare
        { industry: Industry.HEALTHCARE, performer: 'doctor-1', score: 94 },
        { industry: Industry.HEALTHCARE, performer: 'doctor-2', score: 89 },

        // FinTech
        { industry: Industry.FINTECH, performer: 'advisor-1', score: 91 },
        { industry: Industry.FINTECH, performer: 'advisor-2', score: 86 }
      ];

      for (const data of testData) {
        await analyticsService.recordPerformanceMetric(
          data.performer,
          data.industry,
          PerformanceMetricType.CLIENT_SATISFACTION_SCORE,
          data.score,
          80
        );
      }
    });

    it('should rank industries by performance correctly', async () => {
      const comparison = analyticsService.generateCrossIndustryComparison();
      const rankings = comparison.performanceComparison.sort((a, b) => a.rank - b.rank);

      expect(rankings[0].rank).toBe(1); // Top performing industry
      expect(rankings[0].averageScore).toBeGreaterThan(rankings[1].averageScore);
      expect(rankings.every(r => r.rank >= 1 && r.rank <= 5)).toBe(true);
    });

    it('should provide meaningful cross-industry insights', async () => {
      const comparison = analyticsService.generateCrossIndustryComparison();

      expect(comparison.insights.highestPerformingIndustry).toBeDefined();
      expect(comparison.insights.fastestImprovingIndustry).toBeDefined();
      expect(comparison.insights.mostConsistentIndustry).toBeDefined();
      expect(comparison.insights.crossIndustryTrends.length).toBeGreaterThan(0);
      expect(comparison.insights.opportunityAreas.length).toBeGreaterThan(0);
    });

    it('should calculate performance statistics across all industries', async () => {
      const stats = analyticsService.getPerformanceStatistics();

      expect(stats.totalPerformers).toBeGreaterThan(0);
      expect(stats.totalMetrics).toBeGreaterThan(0);
      expect(stats.averagePerformanceScore).toBeGreaterThan(0);
      expect(Object.keys(stats.industryBreakdown)).toHaveLength(5);

      // Each industry should have some data
      Object.values(stats.industryBreakdown).forEach(industryStats => {
        expect(industryStats.performers).toBeGreaterThanOrEqual(0);
        expect(industryStats.metrics).toBeGreaterThanOrEqual(0);
        expect(industryStats.averageScore).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

// Helper assertion for performance levels
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    return {
      message: () => `expected ${received} to be one of [${expected.join(', ')}]`,
      pass,
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}
