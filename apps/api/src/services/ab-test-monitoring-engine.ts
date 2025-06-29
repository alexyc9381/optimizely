import { Redis } from 'ioredis';
import { ABTestPrioritizationEngine } from './ab-test-prioritization-engine';
import { StatisticalAnalysisEngine, StatisticalSignificance, VariationMetrics } from './statistical-analysis-engine';

// Core interfaces for the monitoring system
export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'stopped';
  startDate: Date;
  endDate?: Date;
  variations: TestVariation[];
  targetMetric: string;
  trafficAllocation: number;
  minimumSampleSize: number;
  confidenceLevel: number;
  currentSampleSize: number;
  statisticalPower?: number;
  isEarlyStoppingEnabled: boolean;
  metadata?: Record<string, any>;
}

export interface TestVariation {
  id: string;
  name: string;
  description: string;
  trafficAllocation: number;
  conversionRate: number;
  conversions: number;
  visitors: number;
  revenue?: number;
  isControl: boolean;
}

export interface TestPerformanceMetrics {
  testId: string;
  variations: VariationMetrics[];
  overallMetrics: {
    totalVisitors: number;
    totalConversions: number;
    averageConversionRate: number;
    totalRevenue?: number;
    testDuration: number;
    samplesPerDay: number;
    projectedEndDate?: Date;
  };
  statisticalSignificance: StatisticalSignificance;
  recommendations: TestRecommendation[];
  riskAssessment: RiskAssessment;
}

export interface TestRecommendation {
  type: 'stop_early' | 'extend_test' | 'adjust_traffic' | 'add_variation' | 'focus_segment';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number;
  confidence: number;
  actionItems: string[];
  estimatedLift?: number;
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  mitigationStrategies: string[];
  falsePositiveRisk: number;
  opportunityCost: number;
}

export interface MonitoringAlert {
  id: string;
  testId: string;
  type: 'performance_drop' | 'significance_achieved' | 'sample_size_warning' | 'outlier_detected';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  isResolved: boolean;
  metadata?: Record<string, any>;
}

export interface OptimizationSuggestion {
  id: string;
  testId: string;
  type: 'variation_modification' | 'traffic_reallocation' | 'targeting_adjustment' | 'duration_extension';
  title: string;
  description: string;
  expectedImpact: number;
  implementationEffort: 'low' | 'medium' | 'high';
  estimatedLift: number;
  confidenceScore: number;
  actionPlan: string[];
}

export class ABTestMonitoringEngine {
  private redis: Redis;
  private statisticalEngine: StatisticalAnalysisEngine;
  private prioritizationEngine: ABTestPrioritizationEngine;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
    this.statisticalEngine = new StatisticalAnalysisEngine();
    this.prioritizationEngine = new ABTestPrioritizationEngine(redisClient);
  }

  // Start continuous monitoring of all active tests
  async startMonitoring(intervalMinutes: number = 30): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performMonitoringCycle();
      } catch (error) {
        console.error('Error in monitoring cycle:', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Run initial monitoring cycle
    await this.performMonitoringCycle();
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Main monitoring cycle
  private async performMonitoringCycle(): Promise<void> {
    const activeTests = await this.getActiveTests();

    for (const test of activeTests) {
      try {
        // Get current performance metrics
        const metrics = await this.calculateTestMetrics(test);

        // Store metrics for historical tracking
        await this.storeMetrics(test.id, metrics);

        // Check for alerts
        const alerts = await this.checkForAlerts(test, metrics);
        for (const alert of alerts) {
          await this.createAlert(alert);
        }

        // Generate optimization suggestions
        const suggestions = await this.generateOptimizationSuggestions(test, metrics);
        await this.storeOptimizationSuggestions(test.id, suggestions);

        // Auto-execute high-confidence recommendations
        await this.executeAutomaticOptimizations(test, metrics);

      } catch (error) {
        console.error(`Error monitoring test ${test.id}:`, error);
      }
    }

    // Update last monitoring cycle timestamp
    await this.redis.set('last_monitoring_cycle', new Date().toISOString());
  }

  // Calculate comprehensive test performance metrics
  async calculateTestMetrics(test: ABTest): Promise<TestPerformanceMetrics> {
    const variationMetrics: VariationMetrics[] = [];

    // Calculate metrics for each variation
    for (const variation of test.variations) {
      const metrics = await this.calculateVariationMetrics(variation, test);
      variationMetrics.push(metrics);
    }

    // Calculate overall test metrics
    const overallMetrics = this.calculateOverallMetrics(test, variationMetrics);

    // Perform statistical analysis
    const statisticalSignificance = await this.statisticalEngine.calculateSignificance(
      variationMetrics,
      test.confidenceLevel
    );

    // Generate recommendations
    const recommendations = await this.generateRecommendations(test, variationMetrics, statisticalSignificance);

    // Assess risks
    const riskAssessment = this.assessTestRisks(test, variationMetrics, statisticalSignificance);

    return {
      testId: test.id,
      variations: variationMetrics,
      overallMetrics,
      statisticalSignificance,
      recommendations,
      riskAssessment
    };
  }

  // Calculate metrics for individual variation
  private async calculateVariationMetrics(variation: TestVariation, test: ABTest): Promise<VariationMetrics> {
    const conversionRate = variation.visitors > 0 ? variation.conversions / variation.visitors : 0;
    const revenuePerVisitor = variation.revenue && variation.visitors > 0 ? variation.revenue / variation.visitors : 0;

    // Calculate confidence interval
    const confidenceInterval = this.statisticalEngine.calculateConfidenceInterval(
      conversionRate,
      variation.visitors,
      test.confidenceLevel
    );

    // Calculate probability to beat control
    const controlVariation = test.variations.find(v => v.isControl);
    let probabilityToBeatControl = 0.5;
    let expectedLoss = 0;

    if (controlVariation && !variation.isControl) {
      const controlRate = controlVariation.visitors > 0 ? controlVariation.conversions / controlVariation.visitors : 0;
      probabilityToBeatControl = this.statisticalEngine.calculateProbabilityToBeatControl(
        conversionRate,
        variation.visitors,
        controlRate,
        controlVariation.visitors
      );
      expectedLoss = this.statisticalEngine.calculateExpectedLoss(
        conversionRate,
        controlRate,
        variation.visitors
      );
    }

    return {
      variationId: variation.id,
      visitors: variation.visitors,
      conversions: variation.conversions,
      conversionRate,
      revenue: variation.revenue,
      revenuePerVisitor,
      confidenceInterval,
      probabilityToBeatControl,
      expectedLoss
    };
  }

  // Calculate overall test metrics
  private calculateOverallMetrics(test: ABTest, variationMetrics: VariationMetrics[]): TestPerformanceMetrics['overallMetrics'] {
    const totalVisitors = variationMetrics.reduce((sum, v) => sum + v.visitors, 0);
    const totalConversions = variationMetrics.reduce((sum, v) => sum + v.conversions, 0);
    const totalRevenue = variationMetrics.reduce((sum, v) => sum + (v.revenue || 0), 0);
    const averageConversionRate = totalVisitors > 0 ? totalConversions / totalVisitors : 0;

    const testDuration = Date.now() - test.startDate.getTime();
    const samplesPerDay = totalVisitors / (testDuration / (24 * 60 * 60 * 1000));

    // Project end date based on current sampling rate
    let projectedEndDate: Date | undefined;
    if (samplesPerDay > 0 && test.minimumSampleSize > totalVisitors) {
      const remainingSamples = test.minimumSampleSize - totalVisitors;
      const daysRemaining = remainingSamples / samplesPerDay;
      projectedEndDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
    }

    return {
      totalVisitors,
      totalConversions,
      averageConversionRate,
      totalRevenue: totalRevenue > 0 ? totalRevenue : undefined,
      testDuration,
      samplesPerDay,
      projectedEndDate
    };
  }

  // Generate actionable recommendations
  private async generateRecommendations(
    test: ABTest,
    variationMetrics: VariationMetrics[],
    significance: StatisticalSignificance
  ): Promise<TestRecommendation[]> {
    const recommendations: TestRecommendation[] = [];

    // Early stopping recommendation
    if (test.isEarlyStoppingEnabled && significance.isSignificant) {
      const winningVariation = variationMetrics.reduce((prev, current) =>
        current.conversionRate > prev.conversionRate ? current : prev
      );

      if (winningVariation.probabilityToBeatControl > 0.95) {
        recommendations.push({
          type: 'stop_early',
          priority: 'high',
          title: 'Stop Test Early - Clear Winner Identified',
          description: `Variation ${winningVariation.variationId} shows statistically significant improvement with ${(winningVariation.probabilityToBeatControl * 100).toFixed(1)}% confidence.`,
          impact: winningVariation.conversionRate,
          confidence: winningVariation.probabilityToBeatControl,
          actionItems: [
            'Review test results',
            'Implement winning variation',
            'Document learnings'
          ],
          estimatedLift: this.calculateEstimatedLift(variationMetrics, winningVariation)
        });
      }
    }

    // Underpowered test recommendation
    if (significance.powerAnalysis.isUnderpowered) {
      recommendations.push({
        type: 'extend_test',
        priority: 'medium',
        title: 'Extend Test Duration - Insufficient Sample Size',
        description: `Test needs ${significance.powerAnalysis.requiredSampleSize - test.currentSampleSize} more samples to reach statistical power.`,
        impact: 0.8,
        confidence: 0.9,
        actionItems: [
          `Run test for ${Math.ceil(significance.powerAnalysis.daysToCompletion)} more days`,
          'Consider increasing traffic allocation',
          'Monitor daily sample rate'
        ]
      });
    }

    // Traffic reallocation recommendation
    const poorPerformingVariations = variationMetrics.filter(v =>
      v.probabilityToBeatControl < 0.1 && v.expectedLoss > 0.02
    );

    if (poorPerformingVariations.length > 0) {
      recommendations.push({
        type: 'adjust_traffic',
        priority: 'medium',
        title: 'Reallocate Traffic from Poor Performers',
        description: 'Some variations show consistently poor performance and high expected loss.',
        impact: 0.6,
        confidence: 0.8,
        actionItems: [
          'Reduce traffic to underperforming variations',
          'Increase traffic to promising variations',
          'Consider stopping poor performers entirely'
        ]
      });
    }

    return recommendations;
  }

  private calculateEstimatedLift(variationMetrics: VariationMetrics[], winningVariation: VariationMetrics): number {
    const controlVariation = variationMetrics.find(v => v.variationId.includes('control')) || variationMetrics[0];
    if (controlVariation.conversionRate === 0) return 0;
    return ((winningVariation.conversionRate / controlVariation.conversionRate) - 1) * 100;
  }

  // Assess test risks
  private assessTestRisks(
    test: ABTest,
    variationMetrics: VariationMetrics[],
    significance: StatisticalSignificance
  ): RiskAssessment {
    const riskFactors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check for high expected loss
    const highLossVariations = variationMetrics.filter(v => v.expectedLoss > 0.05);
    if (highLossVariations.length > 0) {
      riskFactors.push('High expected loss from some variations');
      riskLevel = 'medium';
    }

    // Check for low statistical power
    if (significance.powerAnalysis.isUnderpowered) {
      riskFactors.push('Insufficient statistical power');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Check for multiple testing concerns
    if (test.variations.length > 4) {
      riskFactors.push('Multiple comparisons increase false positive risk');
      riskLevel = 'high';
    }

    // Calculate false positive risk
    const falsePositiveRisk = 1 - Math.pow(1 - (1 - test.confidenceLevel), test.variations.length - 1);

    // Calculate opportunity cost
    const bestVariation = variationMetrics.reduce((prev, current) =>
      current.conversionRate > prev.conversionRate ? current : prev
    );
    const controlVariation = variationMetrics.find(v =>
      v.variationId === test.variations.find(tv => tv.isControl)?.id
    );
    const opportunityCost = controlVariation ?
      (bestVariation.conversionRate - controlVariation.conversionRate) * controlVariation.visitors : 0;

    return {
      riskLevel,
      riskFactors,
      mitigationStrategies: [
        'Use Bayesian analysis for better decision making',
        'Implement early stopping rules',
        'Monitor test performance continuously'
      ],
      falsePositiveRisk,
      opportunityCost
    };
  }

  // Check for monitoring alerts
  private async checkForAlerts(test: ABTest, metrics: TestPerformanceMetrics): Promise<MonitoringAlert[]> {
    const alerts: MonitoringAlert[] = [];

    // Performance drop alert
    const historicalMetrics = await this.getHistoricalMetrics(test.id, 7); // Last 7 days
    if (historicalMetrics.length > 0) {
      const recentAvgConversion = metrics.overallMetrics.averageConversionRate;
      const historicalAvgConversion = historicalMetrics.reduce((sum, m) => sum + m.overallMetrics.averageConversionRate, 0) / historicalMetrics.length;

      if (recentAvgConversion < historicalAvgConversion * 0.9) {
        alerts.push({
          id: `perf_drop_${test.id}_${Date.now()}`,
          testId: test.id,
          type: 'performance_drop',
          severity: 'warning',
          message: `Conversion rate dropped ${((1 - recentAvgConversion/historicalAvgConversion) * 100).toFixed(1)}% compared to recent average`,
          timestamp: new Date(),
          isResolved: false
        });
      }
    }

    // Statistical significance achieved
    if (metrics.statisticalSignificance.isSignificant) {
      alerts.push({
        id: `significance_${test.id}_${Date.now()}`,
        testId: test.id,
        type: 'significance_achieved',
        severity: 'info',
        message: `Test achieved statistical significance (p=${metrics.statisticalSignificance.pValue.toFixed(4)})`,
        timestamp: new Date(),
        isResolved: false
      });
    }

    // Sample size warning
    if (metrics.statisticalSignificance.powerAnalysis.isUnderpowered) {
      alerts.push({
        id: `sample_size_${test.id}_${Date.now()}`,
        testId: test.id,
        type: 'sample_size_warning',
        severity: 'warning',
        message: `Test is underpowered (current power: ${(metrics.statisticalSignificance.powerAnalysis.currentPower * 100).toFixed(1)}%)`,
        timestamp: new Date(),
        isResolved: false
      });
    }

    return alerts;
  }

  // Generate optimization suggestions
  async generateOptimizationSuggestions(test: ABTest, metrics: TestPerformanceMetrics): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Traffic reallocation suggestion
    const bestVariation = metrics.variations.reduce((prev, current) =>
      current.probabilityToBeatControl > prev.probabilityToBeatControl ? current : prev
    );

    if (bestVariation.probabilityToBeatControl > 0.8) {
      suggestions.push({
        id: `traffic_realloc_${test.id}_${Date.now()}`,
        testId: test.id,
        type: 'traffic_reallocation',
        title: 'Increase Traffic to Best Performing Variation',
        description: `Variation ${bestVariation.variationId} shows strong performance with ${(bestVariation.probabilityToBeatControl * 100).toFixed(1)}% probability to beat control`,
        expectedImpact: 0.7,
        implementationEffort: 'low',
        estimatedLift: this.calculateEstimatedLift(metrics.variations, bestVariation),
        confidenceScore: bestVariation.probabilityToBeatControl,
        actionPlan: [
          'Increase traffic allocation to best variation from current to 60%',
          'Reduce traffic to underperforming variations',
          'Monitor for 3-5 days to confirm improvement'
        ]
      });
    }

    // Duration extension suggestion
    if (metrics.statisticalSignificance.powerAnalysis.isUnderpowered) {
      suggestions.push({
        id: `duration_ext_${test.id}_${Date.now()}`,
        testId: test.id,
        type: 'duration_extension',
        title: 'Extend Test Duration for Statistical Power',
        description: `Test needs ${Math.ceil(metrics.statisticalSignificance.powerAnalysis.daysToCompletion)} more days to reach adequate statistical power`,
        expectedImpact: 0.9,
        implementationEffort: 'low',
        estimatedLift: 0,
        confidenceScore: 0.9,
        actionPlan: [
          `Extend test runtime by ${Math.ceil(metrics.statisticalSignificance.powerAnalysis.daysToCompletion)} days`,
          'Monitor daily sample acquisition rate',
          'Set alert for when minimum sample size is reached'
        ]
      });
    }

    return suggestions;
  }

  // Execute automatic optimizations for high-confidence recommendations
  private async executeAutomaticOptimizations(test: ABTest, metrics: TestPerformanceMetrics): Promise<void> {
    // Only execute if auto-optimization is enabled for the test
    if (!test.metadata?.autoOptimizationEnabled) return;

    // Early stopping for clear winners
    const winningVariation = metrics.variations.reduce((prev, current) =>
      current.probabilityToBeatControl > prev.probabilityToBeatControl ? current : prev
    );

    if (winningVariation.probabilityToBeatControl > 0.99 &&
        metrics.statisticalSignificance.isSignificant &&
        test.currentSampleSize >= test.minimumSampleSize) {

      await this.stopTestEarly(test.id, winningVariation.variationId, 'Clear winner identified with 99%+ confidence');
    }

    // Auto traffic reallocation for poor performers
    const poorPerformers = metrics.variations.filter(v =>
      v.probabilityToBeatControl < 0.05 && v.expectedLoss > 0.03
    );

    if (poorPerformers.length > 0) {
      await this.adjustTrafficAllocation(test.id, poorPerformers.map(v => v.variationId));
    }
  }

  // Utility methods for data management
  private async getActiveTests(): Promise<ABTest[]> {
    const testIds = await this.redis.smembers('active_ab_tests');
    const tests: ABTest[] = [];

    for (const testId of testIds) {
      const testData = await this.redis.hgetall(`ab_test:${testId}`);
      if (testData && testData.status === 'running') {
        tests.push(this.deserializeTest(testData));
      }
    }

    return tests;
  }

  private async storeMetrics(testId: string, metrics: TestPerformanceMetrics): Promise<void> {
    const key = `ab_test_metrics:${testId}:${Date.now()}`;
    await this.redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(metrics)); // Store for 30 days
    await this.redis.zadd(`ab_test_metrics_timeline:${testId}`, Date.now(), key);
  }

  private async getHistoricalMetrics(testId: string, days: number): Promise<TestPerformanceMetrics[]> {
    const since = Date.now() - (days * 24 * 60 * 60 * 1000);
    const keys = await this.redis.zrangebyscore(`ab_test_metrics_timeline:${testId}`, since, Date.now());

    const metrics: TestPerformanceMetrics[] = [];
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        metrics.push(JSON.parse(data));
      }
    }

    return metrics;
  }

  private async createAlert(alert: MonitoringAlert): Promise<void> {
    await this.redis.hset(`ab_test_alert:${alert.id}`, {
      ...alert,
      timestamp: alert.timestamp.toISOString()
    });
    await this.redis.sadd(`ab_test_alerts:${alert.testId}`, alert.id);
  }

  private async storeOptimizationSuggestions(testId: string, suggestions: OptimizationSuggestion[]): Promise<void> {
    for (const suggestion of suggestions) {
      await this.redis.hset(`ab_test_suggestion:${suggestion.id}`, suggestion);
      await this.redis.sadd(`ab_test_suggestions:${testId}`, suggestion.id);
    }
  }

  private async stopTestEarly(testId: string, winningVariationId: string, reason: string): Promise<void> {
    await this.redis.hset(`ab_test:${testId}`, {
      status: 'completed',
      endDate: new Date().toISOString(),
      winningVariation: winningVariationId,
      completionReason: reason
    });
    await this.redis.srem('active_ab_tests', testId);
  }

  private async adjustTrafficAllocation(testId: string, poorPerformingVariationIds: string[]): Promise<void> {
    // Reduce traffic to poor performers by 50%
    for (const variationId of poorPerformingVariationIds) {
      const currentAllocation = await this.redis.hget(`ab_test_variation:${testId}:${variationId}`, 'trafficAllocation');
      if (currentAllocation) {
        const newAllocation = Math.max(5, parseFloat(currentAllocation) * 0.5); // Minimum 5% allocation
        await this.redis.hset(`ab_test_variation:${testId}:${variationId}`, 'trafficAllocation', newAllocation.toString());
      }
    }
  }

  private deserializeTest(testData: Record<string, string>): ABTest {
    return {
      id: testData.id,
      name: testData.name,
      description: testData.description,
      status: testData.status as ABTest['status'],
      startDate: new Date(testData.startDate),
      endDate: testData.endDate ? new Date(testData.endDate) : undefined,
      variations: JSON.parse(testData.variations || '[]'),
      targetMetric: testData.targetMetric,
      trafficAllocation: parseFloat(testData.trafficAllocation || '100'),
      minimumSampleSize: parseInt(testData.minimumSampleSize || '1000'),
      confidenceLevel: parseFloat(testData.confidenceLevel || '0.95'),
      currentSampleSize: parseInt(testData.currentSampleSize || '0'),
      statisticalPower: testData.statisticalPower ? parseFloat(testData.statisticalPower) : undefined,
      isEarlyStoppingEnabled: testData.isEarlyStoppingEnabled === 'true',
      metadata: testData.metadata ? JSON.parse(testData.metadata) : undefined
    };
  }

  // Public API methods
  async getTestMetrics(testId: string): Promise<TestPerformanceMetrics | null> {
    const testData = await this.redis.hgetall(`ab_test:${testId}`);
    if (!testData || !testData.id) return null;

    const test = this.deserializeTest(testData);
    return await this.calculateTestMetrics(test);
  }

  async getTestAlerts(testId: string): Promise<MonitoringAlert[]> {
    const alertIds = await this.redis.smembers(`ab_test_alerts:${testId}`);
    const alerts: MonitoringAlert[] = [];

    for (const alertId of alertIds) {
      const alertData = await this.redis.hgetall(`ab_test_alert:${alertId}`);
      if (alertData && alertData.id) {
        alerts.push({
          ...alertData as any,
          timestamp: new Date(alertData.timestamp)
        });
      }
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getOptimizationSuggestions(testId: string): Promise<OptimizationSuggestion[]> {
    const suggestionIds = await this.redis.smembers(`ab_test_suggestions:${testId}`);
    const suggestions: OptimizationSuggestion[] = [];

    for (const suggestionId of suggestionIds) {
      const suggestionData = await this.redis.hgetall(`ab_test_suggestion:${suggestionId}`);
      if (suggestionData && suggestionData.id) {
        suggestions.push(suggestionData as any);
      }
    }

    return suggestions.sort((a, b) => b.expectedImpact - a.expectedImpact);
  }

  async getMonitoringStatus(): Promise<{
    isRunning: boolean;
    activeTestsCount: number;
    lastCycleTime?: Date;
    totalAlertsCount: number;
  }> {
    const activeTestsCount = await this.redis.scard('active_ab_tests');
    const lastCycleTime = await this.redis.get('last_monitoring_cycle');

    // Count total unresolved alerts
    const testIds = await this.redis.smembers('active_ab_tests');
    let totalAlertsCount = 0;
    for (const testId of testIds) {
      const alertIds = await this.redis.smembers(`ab_test_alerts:${testId}`);
      totalAlertsCount += alertIds.length;
    }

    return {
      isRunning: this.monitoringInterval !== null,
      activeTestsCount,
      lastCycleTime: lastCycleTime ? new Date(lastCycleTime) : undefined,
      totalAlertsCount
    };
  }
}

// Factory function
export function createABTestMonitoringEngine(redisClient: Redis): ABTestMonitoringEngine {
  return new ABTestMonitoringEngine(redisClient);
}
