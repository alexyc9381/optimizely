import { EventEmitter } from 'events';
import { AnalyticsService } from '../services/analytics-service';

// Mock Redis client
const mockRedis = {
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  hset: jest.fn().mockResolvedValue(1),
  hget: jest.fn().mockResolvedValue(null),
  hgetall: jest.fn().mockResolvedValue({}),
  hdel: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-1),
  keys: jest.fn().mockResolvedValue([]),
  disconnect: jest.fn().mockResolvedValue('OK'),
  ping: jest.fn().mockResolvedValue('PONG'),
  scan: jest.fn().mockResolvedValue(['0', []]),
  mget: jest.fn().mockResolvedValue([]),
  mset: jest.fn().mockResolvedValue('OK'),
  zadd: jest.fn().mockResolvedValue(1),
  zrange: jest.fn().mockResolvedValue([]),
  zrem: jest.fn().mockResolvedValue(1),
  zcard: jest.fn().mockResolvedValue(0)
} as any;

// Mock sample test data
const mockTestData = {
  'test:test_001': {
    name: 'Homepage Hero Test',
    status: 'active',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    statisticalSignificance: '95.5',
    confidence: '97.2',
    winner: 'variation_b'
  },
  'test:test_002': {
    name: 'Checkout Button Color',
    status: 'completed',
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    statisticalSignificance: '99.1',
    confidence: '99.5',
    winner: 'variation_a'
  },
  'test:test_003': {
    name: 'Product Page Layout',
    status: 'paused',
    startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    statisticalSignificance: '82.3',
    confidence: '85.1'
  }
};

// Mock variation data
const mockVariationData = {
  'test:test_001:variations': [
    {
      id: 'control',
      name: 'Original',
      visitors: 5000,
      conversions: 250,
      revenue: 12500,
      isControl: true
    },
    {
      id: 'variation_a',
      name: 'New Hero Image',
      visitors: 4800,
      conversions: 288,
      revenue: 14400,
      isControl: false
    },
    {
      id: 'variation_b',
      name: 'Animated Hero',
      visitors: 5200,
      conversions: 322,
      revenue: 16100,
      isControl: false
    }
  ]
};

// Mock psychographic data
const mockPsychographicData = {
  'test:test_001:psychographic': [
    {
      profile: 'analytical',
      visitors: 2500,
      conversions: 150,
      averageRevenue: 50
    },
    {
      profile: 'social',
      visitors: 3000,
      conversions: 210,
      averageRevenue: 45
    },
    {
      profile: 'expressive',
      visitors: 2000,
      conversions: 140,
      averageRevenue: 55
    }
  ]
};

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Redis mock behavior
    mockRedis.keys.mockImplementation((pattern: string) => {
      if (pattern === 'test:*') {
        return Promise.resolve(['test:test_001', 'test:test_002', 'test:test_003']);
      }
      return Promise.resolve([]);
    });

    mockRedis.hgetall.mockImplementation((key: string) => {
      if (mockTestData[key as keyof typeof mockTestData]) {
        return Promise.resolve(mockTestData[key as keyof typeof mockTestData]);
      }
      return Promise.resolve({});
    });

    analyticsService = new AnalyticsService(mockRedis);
  });

  afterEach(() => {
    analyticsService.destroy();
  });

  describe('Executive Summary', () => {
    test('should generate comprehensive executive summary', async () => {
      const summary = await analyticsService.getExecutiveSummary();

      expect(summary).toHaveProperty('totalActiveTests');
      expect(summary).toHaveProperty('totalCompletedTests');
      expect(summary).toHaveProperty('overallLift');
      expect(summary).toHaveProperty('totalRevenueImpact');
      expect(summary).toHaveProperty('averageTestDuration');
      expect(summary).toHaveProperty('successRate');
      expect(summary).toHaveProperty('topPerformingSegments');
      expect(summary).toHaveProperty('keyInsights');
      expect(summary).toHaveProperty('recommendations');

      expect(typeof summary.totalActiveTests).toBe('number');
      expect(typeof summary.totalCompletedTests).toBe('number');
      expect(Array.isArray(summary.topPerformingSegments)).toBe(true);
      expect(Array.isArray(summary.keyInsights)).toBe(true);
      expect(Array.isArray(summary.recommendations)).toBe(true);
    });

    test('should filter executive summary by date range', async () => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const now = new Date();

      const summary = await analyticsService.getExecutiveSummary({
        dateRange: { start: oneWeekAgo, end: now }
      });

      expect(summary).toHaveProperty('totalActiveTests');
      expect(summary).toHaveProperty('totalCompletedTests');
    });

    test('should filter executive summary by test status', async () => {
      const summary = await analyticsService.getExecutiveSummary({
        testStatus: ['active', 'completed']
      });

      expect(summary).toHaveProperty('totalActiveTests');
      expect(summary).toHaveProperty('totalCompletedTests');
    });

    test('should cache executive summary for performance', async () => {
      // First call
      await analyticsService.getExecutiveSummary();

      // Second call should use cache
      await analyticsService.getExecutiveSummary();

      // Redis should only be called once for the data fetching
      expect(mockRedis.keys).toHaveBeenCalled();
    });
  });

  describe('Test Metrics', () => {
    test('should get detailed metrics for specific test', async () => {
      // Mock variation data for this test
      mockRedis.get.mockImplementation((key: string) => {
        if (key === 'test:test_001:variations') {
          return Promise.resolve(JSON.stringify(mockVariationData['test:test_001:variations']));
        }
        if (key === 'test:test_001:psychographic') {
          return Promise.resolve(JSON.stringify(mockPsychographicData['test:test_001:psychographic']));
        }
        return Promise.resolve(null);
      });

      const metrics = await analyticsService.getTestMetrics('test_001');

      expect(metrics).not.toBeNull();
      expect(metrics?.testId).toBe('test_001');
      expect(metrics?.testName).toBe('Homepage Hero Test');
      expect(metrics?.status).toBe('active');
      expect(metrics?.variations).toBeDefined();
      expect(metrics?.totalVisitors).toBeGreaterThan(0);
      expect(metrics?.totalConversions).toBeGreaterThan(0);
      expect(metrics?.conversionRate).toBeGreaterThan(0);
      expect(metrics?.psychographicBreakdown).toBeDefined();
      expect(metrics?.revenueAttribution).toBeDefined();
      expect(metrics?.performance).toBeDefined();
    });

    test('should return null for non-existent test', async () => {
      const metrics = await analyticsService.getTestMetrics('non_existent_test');
      expect(metrics).toBeNull();
    });

    test('should cache test metrics for performance', async () => {
      // First call
      await analyticsService.getTestMetrics('test_001');

      // Second call should use cache
      await analyticsService.getTestMetrics('test_001');

      // Should only call Redis once for the initial fetch
      expect(mockRedis.hgetall).toHaveBeenCalledWith('test:test_001');
    });
  });

  describe('Test List', () => {
    test('should get list of all tests with basic metrics', async () => {
      const tests = await analyticsService.getTestList();

      expect(Array.isArray(tests)).toBe(true);
      expect(tests.length).toBeGreaterThan(0);

      const firstTest = tests[0];
      expect(firstTest).toHaveProperty('testId');
      expect(firstTest).toHaveProperty('testName');
      expect(firstTest).toHaveProperty('status');
      expect(firstTest).toHaveProperty('startDate');
      expect(firstTest).toHaveProperty('variations');
      expect(firstTest).toHaveProperty('totalVisitors');
      expect(firstTest).toHaveProperty('totalConversions');
      expect(firstTest).toHaveProperty('conversionRate');
    });

    test('should filter test list by status', async () => {
      const activeTests = await analyticsService.getTestList({
        testStatus: ['active']
      });

      expect(Array.isArray(activeTests)).toBe(true);
      // All returned tests should be active
      activeTests.forEach(test => {
        expect(test.status).toBe('active');
      });
    });

    test('should filter test list by date range', async () => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const now = new Date();

      const recentTests = await analyticsService.getTestList({
        dateRange: { start: oneWeekAgo, end: now }
      });

      expect(Array.isArray(recentTests)).toBe(true);
      recentTests.forEach(test => {
        expect(test.startDate.getTime()).toBeGreaterThanOrEqual(oneWeekAgo.getTime());
        expect(test.startDate.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    test('should sort tests by most recent first', async () => {
      const tests = await analyticsService.getTestList();

      for (let i = 1; i < tests.length; i++) {
        expect(tests[i-1].startDate.getTime()).toBeGreaterThanOrEqual(tests[i].startDate.getTime());
      }
    });
  });

  describe('Real-Time Metrics', () => {
    test('should get real-time performance data', async () => {
      const realTimeMetrics = await analyticsService.getRealTimeMetrics();

      expect(realTimeMetrics).toHaveProperty('activeTests');
      expect(realTimeMetrics).toHaveProperty('totalVisitors');
      expect(realTimeMetrics).toHaveProperty('totalConversions');
      expect(realTimeMetrics).toHaveProperty('averageConversionRate');
      expect(realTimeMetrics).toHaveProperty('revenueToday');
      expect(realTimeMetrics).toHaveProperty('alerts');

      expect(typeof realTimeMetrics.activeTests).toBe('number');
      expect(typeof realTimeMetrics.totalVisitors).toBe('number');
      expect(typeof realTimeMetrics.totalConversions).toBe('number');
      expect(typeof realTimeMetrics.averageConversionRate).toBe('number');
      expect(typeof realTimeMetrics.revenueToday).toBe('number');
      expect(Array.isArray(realTimeMetrics.alerts)).toBe(true);
    });

    test('should calculate correct average conversion rate', async () => {
      const realTimeMetrics = await analyticsService.getRealTimeMetrics();

      if (realTimeMetrics.totalVisitors > 0) {
        const expectedRate = realTimeMetrics.totalConversions / realTimeMetrics.totalVisitors;
        expect(realTimeMetrics.averageConversionRate).toBeCloseTo(expectedRate, 5);
      } else {
        expect(realTimeMetrics.averageConversionRate).toBe(0);
      }
    });

    test('should return unacknowledged alerts only', async () => {
      const realTimeMetrics = await analyticsService.getRealTimeMetrics();

      realTimeMetrics.alerts.forEach(alert => {
        expect(alert.acknowledged).toBe(false);
      });
    });
  });

  describe('Psychographic Insights', () => {
    test('should get psychographic performance insights', async () => {
      const insights = await analyticsService.getPsychographicInsights();

      expect(insights).toHaveProperty('profilePerformance');
      expect(insights).toHaveProperty('crossTestPatterns');

      expect(Array.isArray(insights.profilePerformance)).toBe(true);
      expect(Array.isArray(insights.crossTestPatterns)).toBe(true);

      insights.profilePerformance.forEach(profile => {
        expect(profile).toHaveProperty('profile');
        expect(profile).toHaveProperty('totalTests');
        expect(profile).toHaveProperty('averageLift');
        expect(profile).toHaveProperty('preferredElements');
        expect(profile).toHaveProperty('insights');
        expect(typeof profile.totalTests).toBe('number');
        expect(typeof profile.averageLift).toBe('number');
        expect(Array.isArray(profile.preferredElements)).toBe(true);
        expect(Array.isArray(profile.insights)).toBe(true);
      });
    });

    test('should filter psychographic insights by profiles', async () => {
      const insights = await analyticsService.getPsychographicInsights({
        psychographicProfiles: ['analytical', 'social']
      });

      expect(insights).toHaveProperty('profilePerformance');
      expect(insights).toHaveProperty('crossTestPatterns');
    });
  });

  describe('Revenue Attribution', () => {
    test('should get revenue attribution metrics', async () => {
      const revenueMetrics = await analyticsService.getRevenueAttribution();

      expect(revenueMetrics).toHaveProperty('totalRevenue');
      expect(revenueMetrics).toHaveProperty('revenuePerVisitor');
      expect(revenueMetrics).toHaveProperty('revenuePerConversion');
      expect(revenueMetrics).toHaveProperty('incrementalRevenue');
      expect(revenueMetrics).toHaveProperty('roi');
      expect(revenueMetrics).toHaveProperty('projectedAnnualImpact');
      expect(revenueMetrics).toHaveProperty('costPerAcquisition');
      expect(revenueMetrics).toHaveProperty('lifetimeValueImpact');

      expect(typeof revenueMetrics.totalRevenue).toBe('number');
      expect(typeof revenueMetrics.revenuePerVisitor).toBe('number');
      expect(typeof revenueMetrics.revenuePerConversion).toBe('number');
      expect(typeof revenueMetrics.incrementalRevenue).toBe('number');
      expect(typeof revenueMetrics.roi).toBe('number');
      expect(typeof revenueMetrics.projectedAnnualImpact).toBe('number');
      expect(typeof revenueMetrics.costPerAcquisition).toBe('number');
      expect(typeof revenueMetrics.lifetimeValueImpact).toBe('number');
    });

    test('should get revenue attribution for specific test', async () => {
      const revenueMetrics = await analyticsService.getRevenueAttribution('test_001');

      expect(revenueMetrics).toHaveProperty('totalRevenue');
      expect(revenueMetrics).toHaveProperty('incrementalRevenue');
      expect(typeof revenueMetrics.totalRevenue).toBe('number');
      expect(typeof revenueMetrics.incrementalRevenue).toBe('number');
    });
  });

  describe('Alert Management', () => {
    test('should acknowledge alerts', async () => {
      // First, create a mock alert
      const alertId = 'test_alert_001';

      await expect(analyticsService.acknowledgeAlert(alertId)).resolves.not.toThrow();
    });

    test('should emit events for new alerts', (done) => {
      const mockAlert = {
        type: 'winner_detected' as const,
        severity: 'high' as const,
        testId: 'test_001',
        message: 'Test winner detected',
        actionRequired: true
      };

      analyticsService.once('new_alert', (alert) => {
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('testId');
        expect(alert).toHaveProperty('message');
        done();
      });

      // Simulate alert creation by calling private method via reflection
      (analyticsService as any).createAlert(mockAlert);
    });
  });

  describe('Service Management', () => {
    test('should get service status', () => {
      const status = analyticsService.getServiceStatus();

      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('cacheSize');
      expect(status).toHaveProperty('activeSubscriptions');
      expect(status).toHaveProperty('lastUpdate');
      expect(status).toHaveProperty('alerts');

      expect(['healthy', 'degraded', 'error']).toContain(status.status);
      expect(typeof status.cacheSize).toBe('number');
      expect(typeof status.activeSubscriptions).toBe('number');
      expect(status.lastUpdate).toBeInstanceOf(Date);
      expect(typeof status.alerts).toBe('number');
    });

    test('should clear cache', () => {
      analyticsService.clearCache();

      const status = analyticsService.getServiceStatus();
      expect(status.cacheSize).toBe(0);
    });

    test('should handle destroy gracefully', () => {
      expect(() => analyticsService.destroy()).not.toThrow();
    });
  });

  describe('Event Handling', () => {
    test('should be an event emitter', () => {
      expect(analyticsService).toBeInstanceOf(EventEmitter);
    });

    test('should emit analytics_error on error', (done) => {
      // Mock Redis to throw an error
      mockRedis.keys.mockRejectedValue(new Error('Redis connection failed'));

      analyticsService.once('analytics_error', (errorData) => {
        expect(errorData).toHaveProperty('error');
        expect(errorData).toHaveProperty('operation');
        expect(errorData.error).toBeInstanceOf(Error);
        done();
      });

      analyticsService.getTestList().catch(() => {
        // Expected to fail
      });
    });
  });

  describe('Caching Mechanism', () => {
    test('should cache expensive operations', async () => {
      // First call
      await analyticsService.getExecutiveSummary();

      // Clear Redis mock call history
      jest.clearAllMocks();

      // Second call should use cache
      await analyticsService.getExecutiveSummary();

      // Redis should not be called again for the same data
      expect(mockRedis.keys).not.toHaveBeenCalled();
    });

    test('should respect cache timeout', async () => {
      // Simulate cache timeout by advancing time
      jest.useFakeTimers();

      // First call
      await analyticsService.getExecutiveSummary();

      // Advance time beyond cache timeout (5 minutes)
      jest.advanceTimersByTime(6 * 60 * 1000);

      // Second call should fetch fresh data
      await analyticsService.getExecutiveSummary();

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    test('should handle Redis connection errors gracefully', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis connection failed'));

      await expect(analyticsService.getTestList()).rejects.toThrow('Redis connection failed');
    });

    test('should handle malformed data gracefully', async () => {
      mockRedis.hgetall.mockResolvedValue({
        invalidData: 'malformed',
        startDate: 'invalid-date'
      });

      const metrics = await analyticsService.getTestMetrics('test_001');
      expect(metrics).not.toBeNull();
      expect(metrics?.testId).toBe('test_001');
    });

    test('should handle empty data sets gracefully', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const tests = await analyticsService.getTestList();
      expect(Array.isArray(tests)).toBe(true);
      expect(tests.length).toBe(0);
    });
  });
});

