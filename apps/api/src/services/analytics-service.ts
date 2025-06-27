import { EventEmitter } from 'events';
import { Redis } from 'ioredis';

export interface AnalyticsEvent {
  type: string;
  sessionId: string;
  visitorId: string;
  timestamp?: Date;
  data: Record<string, any>;
  metadata?: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    platform?: string;
  };
}

export interface AnalyticsQuery {
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics?: string[];
  dimensions?: string[];
  filters?: Record<string, any>;
  groupBy?: string[];
  orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
  offset?: number;
}

export interface AnalyticsResult {
  data: Array<Record<string, any>>;
  metadata: {
    totalCount: number;
    processedCount: number;
    executionTime: number;
    qualityScore?: number;
  };
  aggregations?: Record<string, any>;
}

export interface RealTimeMetrics {
  eventsPerSecond: number;
  activeVisitors: number;
  activeSessions: number;
  topPages: Array<{ page: string; views: number }>;
  topEvents: Array<{ type: string; count: number }>;
  conversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
}

export interface EventData {
  id: string;
  type: string;
  sessionId: string;
  visitorId: string;
  timestamp: string;
  data: Record<string, unknown>;
  createdAt?: string;
}

export interface QueryOptions {
  filters: Record<string, unknown>;
  pagination: { limit: number; offset: number };
  apiKey?: string;
}

export interface EventQuery {
  filters: Record<string, unknown>;
  limit: number;
  offset: number;
}

export interface QueryResult {
  success: boolean;
  events?: EventData[];
  totalCount?: number;
  error?: string;
}

export interface EventResult {
  success: boolean;
  event?: EventData;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

interface TestMetrics {
  testId: string;
  testName: string;
  status: 'active' | 'completed' | 'paused' | 'draft';
  startDate: Date;
  endDate?: Date;
  variations: VariationMetrics[];
  totalVisitors: number;
  totalConversions: number;
  conversionRate: number;
  statisticalSignificance: number;
  confidence: number;
  winner?: string;
  psychographicBreakdown: PsychographicMetrics[];
  revenueAttribution: RevenueMetrics;
  performance: PerformanceMetrics;
}

interface VariationMetrics {
  id: string;
  name: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  revenuePerVisitor: number;
  confidence: number;
  lift: number;
  isControl: boolean;
  psychographicPerformance: Record<string, {
    visitors: number;
    conversions: number;
    conversionRate: number;
    lift: number;
  }>;
}

interface PsychographicMetrics {
  profile: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  averageRevenue: number;
  preferredVariations: Array<{
    variationId: string;
    preference: number;
    performance: number;
  }>;
  insights: string[];
}

interface RevenueMetrics {
  totalRevenue: number;
  revenuePerVisitor: number;
  revenuePerConversion: number;
  incrementalRevenue: number;
  roi: number;
  projectedAnnualImpact: number;
  costPerAcquisition: number;
  lifetimeValueImpact: number;
}

interface PerformanceMetrics {
  averageLoadTime: number;
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };
  errorRate: number;
  bounceRate: number;
  engagementRate: number;
  pageViews: number;
  sessionDuration: number;
}

interface ExecutiveSummary {
  totalActiveTests: number;
  totalCompletedTests: number;
  overallLift: number;
  totalRevenueImpact: number;
  averageTestDuration: number;
  successRate: number;
  topPerformingSegments: Array<{
    segment: string;
    averageLift: number;
    testCount: number;
  }>;
  keyInsights: string[];
  recommendations: string[];
}

interface DashboardFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  testStatus?: string[];
  psychographicProfiles?: string[];
  revenueThreshold?: number;
  significanceThreshold?: number;
  testTypes?: string[];
}

interface RealTimeAlert {
  id: string;
  type: 'winner_detected' | 'underperforming' | 'significance_achieved' | 'anomaly' | 'budget_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  testId: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  actionRequired: boolean;
  recommendedActions?: string[];
}

export class AnalyticsService extends EventEmitter {
  private redis: Redis;
  private cache: Map<string, any> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes
  private realTimeSubscriptions: Set<string> = new Set();
  private updateInterval: any;
  private alerts: Map<string, RealTimeAlert> = new Map();

  constructor(redisClient: Redis) {
    super();
    this.redis = redisClient;
    this.startRealTimeUpdates();
  }

  /**
   * Get comprehensive executive summary for dashboard overview
   */
  async getExecutiveSummary(filters?: DashboardFilters): Promise<ExecutiveSummary> {
    const cacheKey = `executive_summary_${JSON.stringify(filters || {})}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const tests = await this.getTestList(filters);
      const activeTests = tests.filter(t => t.status === 'active');
      const completedTests = tests.filter(t => t.status === 'completed');

      // Calculate overall metrics
      const overallLift = this.calculateOverallLift(completedTests);
      const totalRevenueImpact = completedTests.reduce((sum, test) =>
        sum + test.revenueAttribution.incrementalRevenue, 0);

      const averageTestDuration = this.calculateAverageTestDuration(completedTests);
      const successRate = this.calculateSuccessRate(completedTests);

      // Identify top performing segments
      const segmentPerformance = await this.analyzeSegmentPerformance(tests);
      const topPerformingSegments = segmentPerformance
        .sort((a, b) => b.averageLift - a.averageLift)
        .slice(0, 5);

      // Generate insights and recommendations
      const keyInsights = await this.generateKeyInsights(tests);
      const recommendations = await this.generateRecommendations(tests, segmentPerformance);

      const summary: ExecutiveSummary = {
        totalActiveTests: activeTests.length,
        totalCompletedTests: completedTests.length,
        overallLift,
        totalRevenueImpact,
        averageTestDuration,
        successRate,
        topPerformingSegments,
        keyInsights,
        recommendations
      };

      this.setCache(cacheKey, summary);
      return summary;
    } catch (error) {
      this.emit('analytics_error', { error, operation: 'getExecutiveSummary' });
      throw error;
    }
  }

  /**
   * Get detailed metrics for a specific test
   */
  async getTestMetrics(testId: string): Promise<TestMetrics | null> {
    const cacheKey = `test_metrics_${testId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const testData = await this.redis.hgetall(`test:${testId}`);
      if (!testData || Object.keys(testData).length === 0) {
        return null;
      }

      const variations = await this.getVariationMetrics(testId);
      const psychographicBreakdown = await this.getPsychographicBreakdown(testId);
      const revenueAttribution = await this.getRevenueAttribution(testId);
      const performance = await this.getPerformanceMetrics(testId);

      const totalVisitors = variations.reduce((sum, v) => sum + v.visitors, 0);
      const totalConversions = variations.reduce((sum, v) => sum + v.conversions, 0);
      const conversionRate = totalVisitors > 0 ? totalConversions / totalVisitors : 0;

      const metrics: TestMetrics = {
        testId,
        testName: testData.name || 'Unknown Test',
        status: testData.status as any || 'draft',
        startDate: new Date(testData.startDate || Date.now()),
        endDate: testData.endDate ? new Date(testData.endDate) : undefined,
        variations,
        totalVisitors,
        totalConversions,
        conversionRate,
        statisticalSignificance: parseFloat(testData.statisticalSignificance || '0'),
        confidence: parseFloat(testData.confidence || '0'),
        winner: testData.winner,
        psychographicBreakdown,
        revenueAttribution,
        performance
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      this.emit('analytics_error', { error, operation: 'getTestMetrics', testId });
      throw error;
    }
  }

  /**
   * Get list of all tests with basic metrics
   */
  async getTestList(filters?: DashboardFilters): Promise<TestMetrics[]> {
    const cacheKey = `test_list_${JSON.stringify(filters || {})}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const testKeys = await this.redis.keys('test:*');
      const tests: TestMetrics[] = [];

      for (const key of testKeys) {
        const testId = key.replace('test:', '');
        const metrics = await this.getTestMetrics(testId);
        if (metrics && this.matchesFilters(metrics, filters)) {
          tests.push(metrics);
        }
      }

      // Sort by most recent first
      tests.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

      this.setCache(cacheKey, tests);
      return tests;
    } catch (error) {
      this.emit('analytics_error', { error, operation: 'getTestList' });
      throw error;
    }
  }

  /**
   * Get real-time performance data for active tests
   */
  async getRealTimeMetrics(): Promise<{
    activeTests: number;
    totalVisitors: number;
    totalConversions: number;
    averageConversionRate: number;
    revenueToday: number;
    alerts: RealTimeAlert[];
  }> {
    try {
      const activeTests = await this.getTestList({ testStatus: ['active'] });

      const totalVisitors = activeTests.reduce((sum, test) => sum + test.totalVisitors, 0);
      const totalConversions = activeTests.reduce((sum, test) => sum + test.totalConversions, 0);
      const averageConversionRate = totalVisitors > 0 ? totalConversions / totalVisitors : 0;

      // Get today's revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const revenueToday = await this.getRevenueForDate(today);

      // Get active alerts
      const alerts = Array.from(this.alerts.values())
        .filter(alert => !alert.acknowledged)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return {
        activeTests: activeTests.length,
        totalVisitors,
        totalConversions,
        averageConversionRate,
        revenueToday,
        alerts
      };
    } catch (error) {
      this.emit('analytics_error', { error, operation: 'getRealTimeMetrics' });
      throw error;
    }
  }

  /**
   * Get psychographic insights across all tests
   */
  async getPsychographicInsights(filters?: DashboardFilters): Promise<{
    profilePerformance: Array<{
      profile: string;
      totalTests: number;
      averageLift: number;
      preferredElements: string[];
      insights: string[];
    }>;
    crossTestPatterns: Array<{
      pattern: string;
      frequency: number;
      averageImpact: number;
      recommendation: string;
    }>;
  }> {
    const cacheKey = `psychographic_insights_${JSON.stringify(filters || {})}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const tests = await this.getTestList(filters);
      const profileAnalysis = new Map<string, {
        tests: TestMetrics[];
        totalLift: number;
        elements: string[];
      }>();

      // Analyze each psychographic profile
      for (const test of tests) {
        for (const breakdown of test.psychographicBreakdown) {
          if (!profileAnalysis.has(breakdown.profile)) {
            profileAnalysis.set(breakdown.profile, {
              tests: [],
              totalLift: 0,
              elements: []
            });
          }

          const profile = profileAnalysis.get(breakdown.profile)!;
          profile.tests.push(test);

          // Calculate lift for this profile
          const controlVariation = test.variations.find(v => v.isControl);
          const bestVariation = test.variations
            .filter(v => !v.isControl)
            .sort((a, b) => b.conversionRate - a.conversionRate)[0];

          if (controlVariation && bestVariation) {
            const lift = (bestVariation.conversionRate - controlVariation.conversionRate) / controlVariation.conversionRate;
            profile.totalLift += lift;
          }
        }
      }

      // Generate profile performance summary
      const profilePerformance = Array.from(profileAnalysis.entries()).map(([profile, data]) => ({
        profile,
        totalTests: data.tests.length,
        averageLift: data.totalLift / data.tests.length,
        preferredElements: this.extractPreferredElements(data.tests),
        insights: this.generateProfileInsights(profile, data.tests)
      }));

      // Identify cross-test patterns
      const crossTestPatterns = this.identifyPatterns(tests);

      const result = {
        profilePerformance,
        crossTestPatterns
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.emit('analytics_error', { error, operation: 'getPsychographicInsights' });
      throw error;
    }
  }

  /**
   * Get revenue attribution analysis
   */
  async getRevenueAttribution(testId?: string): Promise<RevenueMetrics> {
    const cacheKey = `revenue_attribution_${testId || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      let tests: TestMetrics[];
      if (testId) {
        const test = await this.getTestMetrics(testId);
        tests = test ? [test] : [];
      } else {
        tests = await this.getTestList({ testStatus: ['active', 'completed'] });
      }

      const totalRevenue = tests.reduce((sum, test) => sum + test.revenueAttribution.totalRevenue, 0);
      const totalVisitors = tests.reduce((sum, test) => sum + test.totalVisitors, 0);
      const totalConversions = tests.reduce((sum, test) => sum + test.totalConversions, 0);
      const incrementalRevenue = tests.reduce((sum, test) => sum + test.revenueAttribution.incrementalRevenue, 0);

      const revenuePerVisitor = totalVisitors > 0 ? totalRevenue / totalVisitors : 0;
      const revenuePerConversion = totalConversions > 0 ? totalRevenue / totalConversions : 0;
      const roi = this.calculateROI(tests);
      const projectedAnnualImpact = this.calculateProjectedAnnualImpact(tests);
      const costPerAcquisition = this.calculateCostPerAcquisition(tests);
      const lifetimeValueImpact = this.calculateLifetimeValueImpact(tests);

      const metrics: RevenueMetrics = {
        totalRevenue,
        revenuePerVisitor,
        revenuePerConversion,
        incrementalRevenue,
        roi,
        projectedAnnualImpact,
        costPerAcquisition,
        lifetimeValueImpact
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      this.emit('analytics_error', { error, operation: 'getRevenueAttribution', testId });
      throw error;
    }
  }

  /**
   * Start real-time updates for dashboard
   */
  private startRealTimeUpdates(): void {
    this.updateInterval = setInterval(async () => {
      try {
        await this.checkForAlerts();
        await this.updateRealTimeMetrics();
        this.emit('metrics_updated');
      } catch (error) {
        this.emit('analytics_error', { error, operation: 'realTimeUpdates' });
      }
    }, 30000); // Update every 30 seconds
  }

  /**
   * Check for new alerts and anomalies
   */
  private async checkForAlerts(): Promise<void> {
    const activeTests = await this.getTestList({ testStatus: ['active'] });

    for (const test of activeTests) {
      // Check for statistical significance
      if (test.statisticalSignificance >= 0.95 && !test.winner) {
        this.createAlert({
          type: 'significance_achieved',
          severity: 'medium',
          testId: test.testId,
          message: `Test "${test.testName}" has achieved statistical significance`,
          actionRequired: true,
          recommendedActions: ['Review results', 'Consider ending test', 'Implement winning variation']
        });
      }

      // Check for clear winner
      const bestVariation = test.variations
        .filter(v => !v.isControl)
        .sort((a, b) => b.conversionRate - a.conversionRate)[0];

      if (bestVariation && bestVariation.lift > 0.20) {
        this.createAlert({
          type: 'winner_detected',
          severity: 'high',
          testId: test.testId,
          message: `Strong winner detected in "${test.testName}" with ${(bestVariation.lift * 100).toFixed(1)}% lift`,
          actionRequired: true,
          recommendedActions: ['End test early', 'Implement winning variation']
        });
      }

      // Check for underperforming variations
      const underperforming = test.variations.filter(v => !v.isControl && v.lift < -0.10);
      if (underperforming.length > 0) {
        this.createAlert({
          type: 'underperforming',
          severity: 'medium',
          testId: test.testId,
          message: `${underperforming.length} underperforming variation(s) in "${test.testName}"`,
          actionRequired: true,
          recommendedActions: ['Remove underperforming variations', 'Reallocate traffic']
        });
      }
    }
  }

  /**
   * Create new alert
   */
  private createAlert(alertData: Omit<RealTimeAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const alert: RealTimeAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.set(alert.id, alert);
    this.emit('new_alert', alert);
  }

  /**
   * Update real-time metrics cache
   */
  private async updateRealTimeMetrics(): Promise<void> {
    const metrics = await this.getRealTimeMetrics();
    this.setCache('real_time_metrics', metrics);
    this.emit('real_time_update', metrics);
  }

  // Helper methods
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private async getVariationMetrics(testId: string): Promise<VariationMetrics[]> {
    const variationKeys = await this.redis.keys(`test:${testId}:variation:*`);
    const variations: VariationMetrics[] = [];

    for (const key of variationKeys) {
      const variationData = await this.redis.hgetall(key);
      const variationId = key.split(':').pop()!;

      variations.push({
        id: variationId,
        name: variationData.name || `Variation ${variationId}`,
        visitors: parseInt(variationData.visitors || '0'),
        conversions: parseInt(variationData.conversions || '0'),
        conversionRate: parseFloat(variationData.conversionRate || '0'),
        revenue: parseFloat(variationData.revenue || '0'),
        revenuePerVisitor: parseFloat(variationData.revenuePerVisitor || '0'),
        confidence: parseFloat(variationData.confidence || '0'),
        lift: parseFloat(variationData.lift || '0'),
        isControl: variationData.isControl === 'true',
        psychographicPerformance: JSON.parse(variationData.psychographicPerformance || '{}')
      });
    }

    return variations;
  }

  private async getPsychographicBreakdown(testId: string): Promise<PsychographicMetrics[]> {
    const psychographicData = await this.redis.hgetall(`test:${testId}:psychographic`);
    const breakdown: PsychographicMetrics[] = [];

    for (const [profile, data] of Object.entries(psychographicData)) {
      try {
        const parsed = JSON.parse(data);
        breakdown.push({
          profile,
          visitors: parsed.visitors || 0,
          conversions: parsed.conversions || 0,
          conversionRate: parsed.conversionRate || 0,
          averageRevenue: parsed.averageRevenue || 0,
          preferredVariations: parsed.preferredVariations || [],
          insights: parsed.insights || []
        });
      } catch (error) {
        // Skip invalid data
        continue;
      }
    }

    return breakdown;
  }

  private async getPerformanceMetrics(testId: string): Promise<PerformanceMetrics> {
    const performanceData = await this.redis.hgetall(`test:${testId}:performance`);

    return {
      averageLoadTime: parseFloat(performanceData.averageLoadTime || '0'),
      coreWebVitals: {
        lcp: parseFloat(performanceData.lcp || '0'),
        fid: parseFloat(performanceData.fid || '0'),
        cls: parseFloat(performanceData.cls || '0')
      },
      errorRate: parseFloat(performanceData.errorRate || '0'),
      bounceRate: parseFloat(performanceData.bounceRate || '0'),
      engagementRate: parseFloat(performanceData.engagementRate || '0'),
      pageViews: parseInt(performanceData.pageViews || '0'),
      sessionDuration: parseFloat(performanceData.sessionDuration || '0')
    };
  }

  private matchesFilters(test: TestMetrics, filters?: DashboardFilters): boolean {
    if (!filters) return true;

    if (filters.dateRange) {
      if (test.startDate < filters.dateRange.start || test.startDate > filters.dateRange.end) {
        return false;
      }
    }

    if (filters.testStatus && !filters.testStatus.includes(test.status)) {
      return false;
    }

    if (filters.revenueThreshold && test.revenueAttribution.totalRevenue < filters.revenueThreshold) {
      return false;
    }

    if (filters.significanceThreshold && test.statisticalSignificance < filters.significanceThreshold) {
      return false;
    }

    return true;
  }

  private calculateOverallLift(tests: TestMetrics[]): number {
    if (tests.length === 0) return 0;

    const totalLift = tests.reduce((sum, test) => {
      const controlVariation = test.variations.find(v => v.isControl);
      const bestVariation = test.variations
        .filter(v => !v.isControl)
        .sort((a, b) => b.conversionRate - a.conversionRate)[0];

      if (controlVariation && bestVariation && controlVariation.conversionRate > 0) {
        return sum + ((bestVariation.conversionRate - controlVariation.conversionRate) / controlVariation.conversionRate);
      }
      return sum;
    }, 0);

    return totalLift / tests.length;
  }

  private calculateAverageTestDuration(tests: TestMetrics[]): number {
    const completedTests = tests.filter(t => t.endDate);
    if (completedTests.length === 0) return 0;

    const totalDuration = completedTests.reduce((sum, test) => {
      return sum + (test.endDate!.getTime() - test.startDate.getTime());
    }, 0);

    return totalDuration / completedTests.length / (1000 * 60 * 60 * 24); // Convert to days
  }

  private calculateSuccessRate(tests: TestMetrics[]): number {
    if (tests.length === 0) return 0;

    const successfulTests = tests.filter(test => {
      return test.statisticalSignificance >= 0.95 && test.winner;
    });

    return successfulTests.length / tests.length;
  }

  private async analyzeSegmentPerformance(tests: TestMetrics[]): Promise<Array<{
    segment: string;
    averageLift: number;
    testCount: number;
  }>> {
    const segmentMap = new Map<string, { totalLift: number; testCount: number }>();

    for (const test of tests) {
      for (const breakdown of test.psychographicBreakdown) {
        if (!segmentMap.has(breakdown.profile)) {
          segmentMap.set(breakdown.profile, { totalLift: 0, testCount: 0 });
        }

        const segment = segmentMap.get(breakdown.profile)!;

        // Calculate lift for this segment
        const controlVariation = test.variations.find(v => v.isControl);
        if (controlVariation && controlVariation.psychographicPerformance[breakdown.profile]) {
          const controlRate = controlVariation.psychographicPerformance[breakdown.profile].conversionRate;
          const lift = (breakdown.conversionRate - controlRate) / controlRate;
          segment.totalLift += lift;
          segment.testCount += 1;
        }
      }
    }

    return Array.from(segmentMap.entries()).map(([segment, data]) => ({
      segment,
      averageLift: data.totalLift / data.testCount,
      testCount: data.testCount
    }));
  }

  private async generateKeyInsights(tests: TestMetrics[]): Promise<string[]> {
    const insights: string[] = [];

    // Analyze overall performance
    const completedTests = tests.filter(t => t.status === 'completed');
    if (completedTests.length > 0) {
      const successRate = this.calculateSuccessRate(completedTests);
      if (successRate > 0.7) {
        insights.push(`High success rate of ${(successRate * 100).toFixed(1)}% across completed tests`);
      }

      const overallLift = this.calculateOverallLift(completedTests);
      if (overallLift > 0.1) {
        insights.push(`Strong average lift of ${(overallLift * 100).toFixed(1)}% across all tests`);
      }
    }

    // Analyze psychographic patterns
    const psychographicPerformance = new Map<string, number[]>();
    for (const test of tests) {
      for (const breakdown of test.psychographicBreakdown) {
        if (!psychographicPerformance.has(breakdown.profile)) {
          psychographicPerformance.set(breakdown.profile, []);
        }
        psychographicPerformance.get(breakdown.profile)!.push(breakdown.conversionRate);
      }
    }

    // Find best performing segments
    let bestSegment = '';
    let bestRate = 0;
    for (const [profile, rates] of psychographicPerformance.entries()) {
      const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      if (avgRate > bestRate) {
        bestRate = avgRate;
        bestSegment = profile;
      }
    }

    if (bestSegment) {
      insights.push(`${bestSegment} segment shows highest conversion rate at ${(bestRate * 100).toFixed(1)}%`);
    }

    return insights;
  }

  private async generateRecommendations(tests: TestMetrics[], segmentPerformance: any[]): Promise<string[]> {
    const recommendations: string[] = [];

    // Test duration recommendations
    const avgDuration = this.calculateAverageTestDuration(tests.filter(t => t.status === 'completed'));
    if (avgDuration > 30) {
      recommendations.push('Consider reducing test duration - current average of ' + avgDuration.toFixed(1) + ' days may be too long');
    }

    // Segment targeting recommendations
    const topSegment = segmentPerformance.sort((a, b) => b.averageLift - a.averageLift)[0];
    if (topSegment && topSegment.averageLift > 0.15) {
      recommendations.push(`Focus more tests on ${topSegment.segment} segment - showing ${(topSegment.averageLift * 100).toFixed(1)}% average lift`);
    }

    // Statistical significance recommendations
    const lowSignificanceTests = tests.filter(t => t.status === 'active' && t.statisticalSignificance < 0.8);
    if (lowSignificanceTests.length > 0) {
      recommendations.push(`${lowSignificanceTests.length} active tests need more traffic to reach statistical significance`);
    }

    return recommendations;
  }

  private extractPreferredElements(tests: TestMetrics[]): string[] {
    const elementCount = new Map<string, number>();

    for (const test of tests) {
      const winningVariation = test.variations
        .filter(v => !v.isControl)
        .sort((a, b) => b.conversionRate - a.conversionRate)[0];

      if (winningVariation && winningVariation.lift > 0) {
        // Extract elements from test name or variations
        const elements = test.testName.toLowerCase().split(' ');
        for (const element of elements) {
          elementCount.set(element, (elementCount.get(element) || 0) + 1);
        }
      }
    }

    return Array.from(elementCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([element]) => element);
  }

  private generateProfileInsights(profile: string, tests: TestMetrics[]): string[] {
    const insights: string[] = [];

    const avgConversionRate = tests.reduce((sum, test) => {
      const breakdown = test.psychographicBreakdown.find(p => p.profile === profile);
      return sum + (breakdown?.conversionRate || 0);
    }, 0) / tests.length;

    if (avgConversionRate > 0.05) {
      insights.push(`High engagement with ${(avgConversionRate * 100).toFixed(1)}% average conversion rate`);
    }

    // Add more profile-specific insights based on test patterns
    const successfulTests = tests.filter(test => {
      const breakdown = test.psychographicBreakdown.find(p => p.profile === profile);
      return breakdown && breakdown.conversionRate > 0.03;
    });

    if (successfulTests.length > tests.length * 0.7) {
      insights.push('Responds well to most test variations');
    }

    return insights;
  }

  private identifyPatterns(tests: TestMetrics[]): Array<{
    pattern: string;
    frequency: number;
    averageImpact: number;
    recommendation: string;
  }> {
    const patterns: Array<{
      pattern: string;
      frequency: number;
      averageImpact: number;
      recommendation: string;
    }> = [];

    // Analyze common winning elements
    const winningElements = new Map<string, { count: number; totalLift: number }>();

    for (const test of tests) {
      const winningVariation = test.variations
        .filter(v => !v.isControl)
        .sort((a, b) => b.conversionRate - a.conversionRate)[0];

      if (winningVariation && winningVariation.lift > 0) {
        const elements = ['headline', 'cta', 'color', 'layout', 'pricing'].filter(element =>
          test.testName.toLowerCase().includes(element)
        );

        for (const element of elements) {
          if (!winningElements.has(element)) {
            winningElements.set(element, { count: 0, totalLift: 0 });
          }
          const data = winningElements.get(element)!;
          data.count += 1;
          data.totalLift += winningVariation.lift;
        }
      }
    }

    // Convert to patterns
    for (const [element, data] of winningElements.entries()) {
      if (data.count >= 3) { // Need at least 3 occurrences to identify a pattern
        patterns.push({
          pattern: `${element} optimization`,
          frequency: data.count,
          averageImpact: data.totalLift / data.count,
          recommendation: `Continue testing ${element} variations - showing consistent positive results`
        });
      }
    }

    return patterns.sort((a, b) => b.averageImpact - a.averageImpact);
  }

  private async getRevenueForDate(date: Date): Promise<number> {
    const dateKey = date.toISOString().split('T')[0];
    const revenue = await this.redis.get(`revenue:${dateKey}`);
    return parseFloat(revenue || '0');
  }

  private calculateROI(tests: TestMetrics[]): number {
    const totalRevenue = tests.reduce((sum, test) => sum + test.revenueAttribution.totalRevenue, 0);
    const totalCost = tests.length * 1000; // Assume $1000 per test cost
    return totalCost > 0 ? (totalRevenue - totalCost) / totalCost : 0;
  }

  private calculateProjectedAnnualImpact(tests: TestMetrics[]): number {
    const totalIncrementalRevenue = tests.reduce((sum, test) => sum + test.revenueAttribution.incrementalRevenue, 0);
    const avgTestDuration = this.calculateAverageTestDuration(tests);
    const testsPerYear = 365 / (avgTestDuration || 30);
    return totalIncrementalRevenue * testsPerYear;
  }

  private calculateCostPerAcquisition(tests: TestMetrics[]): number {
    const totalCost = tests.length * 1000; // Assume $1000 per test
    const totalConversions = tests.reduce((sum, test) => sum + test.totalConversions, 0);
    return totalConversions > 0 ? totalCost / totalConversions : 0;
  }

  private calculateLifetimeValueImpact(tests: TestMetrics[]): number {
    const avgLift = this.calculateOverallLift(tests);
    const avgLTV = 500; // Assume $500 average LTV
    return avgLift * avgLTV;
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alert_acknowledged', alert);
    }
  }

  /**
   * Get analytics service status
   */
  getServiceStatus(): {
    status: 'healthy' | 'degraded' | 'error';
    cacheSize: number;
    activeSubscriptions: number;
    lastUpdate: Date;
    alerts: number;
  } {
    return {
      status: 'healthy',
      cacheSize: this.cache.size,
      activeSubscriptions: this.realTimeSubscriptions.size,
      lastUpdate: new Date(),
      alerts: Array.from(this.alerts.values()).filter(a => !a.acknowledged).length
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.emit('cache_cleared');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.cache.clear();
    this.alerts.clear();
    this.realTimeSubscriptions.clear();
    this.removeAllListeners();
  }
}

export default AnalyticsService;
