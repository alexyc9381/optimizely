import { BehavioralMetricsAnalyticsEngine } from '../behavioral-metrics-analytics-engine';

describe('BehavioralMetricsAnalyticsEngine', () => {
  let engine: BehavioralMetricsAnalyticsEngine;

  beforeEach(() => {
    // Reset singleton instance for testing
    (
      BehavioralMetricsAnalyticsEngine as unknown as {
        _instance: BehavioralMetricsAnalyticsEngine | null;
      }
    )._instance = null;
    engine = BehavioralMetricsAnalyticsEngine.getInstance();
  });

  afterEach(() => {
    engine.clearAnalyticsData();
  });

  describe('Initialization', () => {
    it('should return singleton instance', () => {
      const instance1 = BehavioralMetricsAnalyticsEngine.getInstance();
      const instance2 = BehavioralMetricsAnalyticsEngine.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with empty data stores', async () => {
      const health = await engine.healthCheck();
      expect(health.metrics.activeFlows).toBe(0);
      expect(health.metrics.contentItems).toBe(0);
      expect(health.metrics.patterns).toBe(0);
      expect(health.metrics.sessions).toBe(0);
    });
  });

  describe('Page Flow Analysis', () => {
    it('should analyze page flow correctly', async () => {
      const sessionId = 'test-session-1';
      const pageViews = [
        {
          url: '/home',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          duration: 30000,
        },
        {
          url: '/features',
          timestamp: new Date('2024-01-01T10:00:30Z'),
          duration: 45000,
        },
        {
          url: '/pricing',
          timestamp: new Date('2024-01-01T10:01:15Z'),
          duration: 60000,
        },
        {
          url: '/signup',
          timestamp: new Date('2024-01-01T10:02:15Z'),
          duration: 120000,
        },
      ];

      const flow = await engine.analyzePageFlow(sessionId, pageViews);

      expect(flow.sessionId).toBe(sessionId);
      expect(flow.path).toEqual(['/home', '/features', '/pricing', '/signup']);
      expect(flow.conversionPoints).toContain('/pricing');
      expect(flow.conversionPoints).toContain('/signup');
      expect(flow.flowScore).toBeGreaterThan(50); // Should have good score due to conversion points
    });

    it('should identify bounce points correctly', async () => {
      const sessionId = 'bounce-session';
      const pageViews = [
        { url: '/blog/article', timestamp: new Date(), duration: 5000 }, // Very short duration
        { url: '/404', timestamp: new Date(), duration: 2000 }, // Error page
      ];

      const flow = await engine.analyzePageFlow(sessionId, pageViews);

      expect(flow.bouncePoints.length).toBeGreaterThan(0);
      expect(flow.flowScore).toBeLessThan(50); // Should have low score due to bounces
    });

    it('should get flow patterns with time range', async () => {
      // Add multiple flows
      await engine.analyzePageFlow('session1', [
        {
          url: '/home',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          duration: 30000,
        },
        {
          url: '/pricing',
          timestamp: new Date('2024-01-01T10:00:30Z'),
          duration: 60000,
        },
      ]);

      await engine.analyzePageFlow('session2', [
        {
          url: '/home',
          timestamp: new Date('2024-01-01T11:00:00Z'),
          duration: 25000,
        },
        {
          url: '/features',
          timestamp: new Date('2024-01-01T11:00:25Z'),
          duration: 40000,
        },
        {
          url: '/pricing',
          timestamp: new Date('2024-01-01T11:01:05Z'),
          duration: 55000,
        },
      ]);

      const patterns = await engine.getFlowPatterns({
        start: new Date('2024-01-01T09:00:00Z'),
        end: new Date('2024-01-01T12:00:00Z'),
      });

      expect(patterns.commonPaths.length).toBeGreaterThan(0);
      expect(patterns.conversionFunnels.length).toBeGreaterThan(0);
    });
  });

  describe('Content Engagement Analysis', () => {
    it('should analyze content engagement correctly', async () => {
      const contentId = '/blog/test-article';
      const interactions = [
        {
          userId: 'user1',
          sessionId: 'session1',
          timeOnPage: 120000, // 2 minutes
          scrollDepth: 85,
          clicks: 3,
          shares: 1,
          downloads: 0,
          formSubmissions: 0,
          returnVisit: false,
        },
        {
          userId: 'user2',
          sessionId: 'session2',
          timeOnPage: 180000, // 3 minutes
          scrollDepth: 100,
          clicks: 5,
          shares: 0,
          downloads: 1,
          formSubmissions: 1,
          returnVisit: true,
        },
      ];

      const engagement = await engine.analyzeContentEngagement(
        contentId,
        interactions
      );

      expect(engagement.contentId).toBe(contentId);
      expect(engagement.contentType).toBe('blog');
      expect(engagement.timeMetrics.avgTimeOnPage).toBe(150000); // Average of 120000 and 180000
      expect(engagement.interactionMetrics.scrollDepth).toBe(92.5); // Average of 85 and 100
      expect(engagement.performanceMetrics.engagementScore).toBeGreaterThan(0);
    });

    it('should get top performing content', async () => {
      // Add multiple content pieces
      await engine.analyzeContentEngagement('/blog/article1', [
        {
          sessionId: 'session1',
          timeOnPage: 300000,
          scrollDepth: 100,
          clicks: 5,
          shares: 2,
          downloads: 1,
          formSubmissions: 1,
          returnVisit: true,
        },
      ]);

      await engine.analyzeContentEngagement('/blog/article2', [
        {
          sessionId: 'session2',
          timeOnPage: 60000,
          scrollDepth: 30,
          clicks: 1,
          shares: 0,
          downloads: 0,
          formSubmissions: 0,
          returnVisit: false,
        },
      ]);

      const topContent = await engine.getTopPerformingContent(5);

      expect(topContent.length).toBe(2);
      expect(topContent[0].performanceMetrics.engagementScore).toBeGreaterThan(
        topContent[1].performanceMetrics.engagementScore
      );
    });

    it('should compare content performance', async () => {
      // Add content pieces
      await engine.analyzeContentEngagement('/blog/article1', [
        {
          sessionId: 'session1',
          timeOnPage: 300000,
          scrollDepth: 100,
          clicks: 5,
          shares: 2,
          downloads: 1,
          formSubmissions: 1,
          returnVisit: true,
        },
      ]);

      await engine.analyzeContentEngagement('/blog/article2', [
        {
          sessionId: 'session2',
          timeOnPage: 60000,
          scrollDepth: 30,
          clicks: 1,
          shares: 0,
          downloads: 0,
          formSubmissions: 0,
          returnVisit: false,
        },
      ]);

      const comparison = await engine.compareContentPerformance([
        '/blog/article1',
        '/blog/article2',
      ]);

      expect(comparison.comparison.length).toBe(2);
      expect(comparison.comparison[0].rank).toBe(1);
      expect(comparison.comparison[1].rank).toBe(2);
      expect(comparison.insights.length).toBeGreaterThan(0);
    });
  });

  describe('Interaction Pattern Recognition', () => {
    it('should analyze interaction patterns correctly', async () => {
      const sessionData = {
        userId: 'user123',
        sessionId: 'session123',
        pageViews: [
          { url: '/home', timestamp: new Date(), duration: 30000 },
          { url: '/features', timestamp: new Date(), duration: 45000 },
          { url: '/docs/api', timestamp: new Date(), duration: 120000 },
          { url: '/pricing', timestamp: new Date(), duration: 60000 },
          { url: '/demo', timestamp: new Date(), duration: 90000 },
        ],
        interactions: [
          { type: 'click', timestamp: new Date(), elementId: 'nav-features' },
          { type: 'scroll', timestamp: new Date() },
          {
            type: 'form_submit',
            timestamp: new Date(),
            elementId: 'demo-request',
          },
        ],
        deviceType: 'desktop' as const,
        timeOfDay: 14, // 2 PM
        dayOfWeek: 2, // Tuesday
      };

      const pattern = await engine.analyzeInteractionPattern(sessionData);

      expect(pattern.sessionId).toBe('session123');
      expect(pattern.behaviorType).toBe('technical'); // Due to /docs/api visit
      expect(pattern.intentLevel).toBe('high'); // Due to /pricing and /demo
      expect(pattern.metrics.devicePreference).toBe('desktop');
      expect(pattern.metrics.timePattern).toBe('afternoon');
      expect(pattern.metrics.dayPattern).toBe('weekday');
      expect(pattern.indicators.technicalInterest).toBe(true);
      expect(pattern.indicators.priceConsciousness).toBe(true);
      expect(pattern.confidence).toBeGreaterThan(70);
    });

    it('should classify different behavior types', async () => {
      // Test researcher pattern
      const researcherData = {
        sessionId: 'researcher',
        pageViews: Array(10)
          .fill(null)
          .map((_, i) => ({
            url: `/article-${i}`,
            timestamp: new Date(),
            duration: 90000, // 1.5 minutes each
          })),
        interactions: [],
        deviceType: 'desktop' as const,
        timeOfDay: 10,
        dayOfWeek: 1,
      };

      const researcherPattern =
        await engine.analyzeInteractionPattern(researcherData);
      expect(researcherPattern.behaviorType).toBe('researcher');

      // Test buyer pattern
      const buyerData = {
        sessionId: 'buyer',
        pageViews: [
          { url: '/pricing', timestamp: new Date(), duration: 60000 },
          { url: '/signup', timestamp: new Date(), duration: 30000 },
        ],
        interactions: [{ type: 'form_submit', timestamp: new Date() }],
        deviceType: 'mobile' as const,
        timeOfDay: 19,
        dayOfWeek: 5,
      };

      const buyerPattern = await engine.analyzeInteractionPattern(buyerData);
      expect(buyerPattern.behaviorType).toBe('buyer');
    });
  });

  describe('Session Quality Metrics', () => {
    it('should calculate session quality correctly', async () => {
      const sessionData = {
        sessionId: 'quality-session',
        userId: 'user123',
        duration: 300000, // 5 minutes
        pageViews: [
          { url: '/home', duration: 60000 },
          { url: '/features', duration: 90000 },
          { url: '/pricing', duration: 80000 },
          { url: '/demo', duration: 70000 },
        ],
        interactions: [
          { type: 'click', value: null },
          { type: 'scroll', value: null },
          { type: 'form_submit', value: 'demo_request' },
          { type: 'download', value: 'whitepaper.pdf' },
        ],
        conversionEvents: ['demo_request', 'whitepaper_download'],
        exitPage: '/demo',
      };

      const quality = await engine.calculateSessionQuality(sessionData);

      expect(quality.sessionId).toBe('quality-session');
      expect(quality.quality.overall).toBeGreaterThan(60); // Should be high quality
      expect(quality.quality.engagement).toBeGreaterThan(50);
      expect(quality.quality.intent).toBeGreaterThan(50);
      expect(quality.outcomes.goalCompleted).toBe(true);
      expect(quality.outcomes.conversionValue).toBeGreaterThan(0);
      expect(quality.outcomes.leadQuality).toMatch(/hot|warm/);
    });

    it('should handle low quality sessions', async () => {
      const lowQualityData = {
        sessionId: 'low-quality',
        duration: 15000, // 15 seconds
        pageViews: [{ url: '/home', duration: 15000 }],
        interactions: [],
        conversionEvents: [],
        exitPage: '/home',
      };

      const quality = await engine.calculateSessionQuality(lowQualityData);

      expect(quality.quality.overall).toBeLessThan(50);
      expect(quality.outcomes.goalCompleted).toBe(false);
      expect(quality.outcomes.leadQuality).toBe('unqualified');
    });
  });

  describe('Analytics Reporting', () => {
    it('should generate comprehensive analytics report', async () => {
      const timeRange = {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-02T00:00:00Z'),
      };

      // Add some test data
      await engine.analyzePageFlow('session1', [
        {
          url: '/home',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          duration: 30000,
        },
        {
          url: '/pricing',
          timestamp: new Date('2024-01-01T10:00:30Z'),
          duration: 60000,
        },
      ]);

      await engine.calculateSessionQuality({
        sessionId: 'session1',
        duration: 90000,
        pageViews: [
          { url: '/home', duration: 30000 },
          { url: '/pricing', duration: 60000 },
        ],
        interactions: [{ type: 'click' }],
        conversionEvents: ['pricing_view'],
        exitPage: '/pricing',
      });

      const report = await engine.generateAnalyticsReport(timeRange);

      expect(report.reportId).toBeDefined();
      expect(report.timeRange).toEqual(timeRange);
      expect(report.summary.totalSessions).toBeGreaterThanOrEqual(0);
      expect(report.insights).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations.contentOptimization)).toBe(
        true
      );
      expect(
        Array.isArray(report.recommendations.userExperienceImprovements)
      ).toBe(true);
      expect(Array.isArray(report.recommendations.conversionOptimization)).toBe(
        true
      );
      expect(Array.isArray(report.recommendations.technicalImprovements)).toBe(
        true
      );
    });
  });

  describe('Health Monitoring', () => {
    it('should return health status', async () => {
      const health = await engine.healthCheck();

      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(health.metrics).toBeDefined();
      expect(health.metrics.activeFlows).toBeGreaterThanOrEqual(0);
      expect(health.metrics.contentItems).toBeGreaterThanOrEqual(0);
      expect(health.metrics.patterns).toBeGreaterThanOrEqual(0);
      expect(health.metrics.sessions).toBeGreaterThanOrEqual(0);
      expect(health.metrics.anomalies).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(health.issues)).toBe(true);
      expect(health.lastAnalysis).toBeInstanceOf(Date);
    });

    it('should get analytics summary', async () => {
      const summary = await engine.getAnalyticsSummary();

      expect(summary.totalSessions).toBeGreaterThanOrEqual(0);
      expect(summary.avgSessionQuality).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(summary.topContent)).toBe(true);
      expect(summary.recentAnomalies).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(summary.dominantBehaviors)).toBe(true);
    });
  });

  describe('Data Management', () => {
    it('should clear all analytics data', async () => {
      // Add some data first
      await engine.analyzePageFlow('test-session', [
        { url: '/test', timestamp: new Date(), duration: 30000 },
      ]);

      await engine.analyzeContentEngagement('/test-content', [
        {
          sessionId: 'test-session',
          timeOnPage: 30000,
          scrollDepth: 50,
          clicks: 1,
          shares: 0,
          downloads: 0,
          formSubmissions: 0,
          returnVisit: false,
        },
      ]);

      // Verify data exists
      const healthBefore = await engine.healthCheck();
      expect(healthBefore.metrics.activeFlows).toBeGreaterThan(0);

      // Clear data
      engine.clearAnalyticsData();

      // Verify data is cleared
      const healthAfter = await engine.healthCheck();
      expect(healthAfter.metrics.activeFlows).toBe(0);
      expect(healthAfter.metrics.contentItems).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid page flow data', async () => {
      await expect(engine.analyzePageFlow('', [])).rejects.toThrow();
    });

    it('should handle invalid content engagement data', async () => {
      await expect(engine.analyzeContentEngagement('', [])).rejects.toThrow();
    });

    it('should handle invalid session data for quality calculation', async () => {
      const invalidData = {
        sessionId: '',
        duration: -1,
        pageViews: [],
        interactions: [],
        conversionEvents: [],
        exitPage: '',
      };

      await expect(
        engine.calculateSessionQuality(invalidData)
      ).rejects.toThrow();
    });
  });

  describe('Event Emission', () => {
    it('should emit events for successful operations', done => {
      let eventCount = 0;
      const expectedEvents = 4;

      const checkCompletion = () => {
        eventCount++;
        if (eventCount === expectedEvents) {
          done();
        }
      };

      engine.on('page_flow_analyzed', checkCompletion);
      engine.on('content_engagement_analyzed', checkCompletion);
      engine.on('interaction_pattern_identified', checkCompletion);
      engine.on('session_quality_calculated', checkCompletion);

      // Trigger events
      engine.analyzePageFlow('event-session', [
        { url: '/test', timestamp: new Date(), duration: 30000 },
      ]);

      engine.analyzeContentEngagement('/test-content', [
        {
          sessionId: 'event-session',
          timeOnPage: 30000,
          scrollDepth: 50,
          clicks: 1,
          shares: 0,
          downloads: 0,
          formSubmissions: 0,
          returnVisit: false,
        },
      ]);

      engine.analyzeInteractionPattern({
        sessionId: 'event-session',
        pageViews: [{ url: '/test', timestamp: new Date(), duration: 30000 }],
        interactions: [{ type: 'click', timestamp: new Date() }],
        deviceType: 'desktop',
        timeOfDay: 14,
        dayOfWeek: 2,
      });

      engine.calculateSessionQuality({
        sessionId: 'event-session',
        duration: 30000,
        pageViews: [{ url: '/test', duration: 30000 }],
        interactions: [{ type: 'click' }],
        conversionEvents: [],
        exitPage: '/test',
      });
    });
  });
});
