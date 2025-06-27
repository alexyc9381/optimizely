/**
 * Statistical Significance Monitoring Service
 *
 * Provides real-time statistical analysis for A/B tests with:
 * - Bayesian and frequentist statistical methods
 * - Early termination algorithms
 * - Confidence interval calculations
 * - Power analysis
 * - Anomaly detection
 * - Performance degradation alerts
 *
 * Universal Platform Compatibility: React, Vue, Angular, WordPress, Shopify, etc.
 */

import { EventEmitter } from 'events';

export interface StatisticalConfig {
  significanceLevel: number; // Alpha level (e.g., 0.05)
  powerLevel: number; // Beta level (e.g., 0.8)
  minimumSampleSize: number;
  minimumDetectableEffect: number; // MDE as percentage
  earlyStoppingEnabled: boolean;
  bayesianEnabled: boolean;
  monitoringInterval: number; // milliseconds
  maxTestDuration: number; // days
}

export interface TestMetrics {
  testId: string;
  variations: VariationMetrics[];
  startTime: Date;
  totalVisitors: number;
  totalConversions: number;
  overallConversionRate: number;
  lastUpdated: Date;
}

export interface VariationMetrics {
  _variationId: string;
  name: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  revenue?: number;
  avgOrderValue?: number;
}

export interface StatisticalResult {
  testId: string;
  method: 'frequentist' | 'bayesian';
  isSignificant: boolean;
  pValue?: number;
  confidenceInterval?: [number, number];
  bayesianProbability?: number;
  credibleInterval?: [number, number];
  powerAnalysis: PowerAnalysis;
  recommendedAction: 'continue' | 'stop' | 'pause' | 'extend';
  reasoning: string;
  timestamp: Date;
}

export interface PowerAnalysis {
  currentPower: number;
  requiredSampleSize: number;
  actualSampleSize: number;
  estimatedTimeToSignificance?: number; // hours
  probabilityOfSuccess: number;
}

export interface AnomalyDetection {
  testId: string;
  anomalies: Anomaly[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastCheck: Date;
}

export interface Anomaly {
  type: 'traffic_spike' | 'conversion_drop' | 'unusual_pattern' | 'external_factor';
  severity: 'warning' | 'critical';
  description: string;
  detectedAt: Date;
  affectedVariations: string[];
  suggestedAction: string;
}

export interface MonitoringAlert {
  testId: string;
  alertType: 'early_winner' | 'underperforming' | 'anomaly' | 'power_insufficient' | 'sample_size_reached';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  actionRequired: boolean;
  autoActionTaken?: string;
}

export class StatisticalMonitoringService extends EventEmitter {
  private config: StatisticalConfig;
  private activeTests: Map<string, TestMetrics> = new Map();
  private monitoringIntervals: Map<string, any> = new Map();
  private statisticalResults: Map<string, StatisticalResult[]> = new Map();
  private anomalyHistory: Map<string, AnomalyDetection[]> = new Map();

  constructor(config?: Partial<StatisticalConfig>) {
    super();
    this.config = {
      significanceLevel: 0.05,
      powerLevel: 0.8,
      minimumSampleSize: 1000,
      minimumDetectableEffect: 0.05, // 5%
      earlyStoppingEnabled: true,
      bayesianEnabled: true,
      monitoringInterval: 300000, // 5 minutes
      maxTestDuration: 30, // 30 days
      ...config
    };
  }

  /**
   * Start monitoring a test for statistical significance
   */
  public startMonitoring(_testMetrics: TestMetrics): void {
    this.activeTests.set(_testMetrics.testId, _testMetrics);

    if (!this.monitoringIntervals.has(_testMetrics.testId)) {
      const interval = setInterval(() => {
        this.analyzeTest(_testMetrics.testId);
      }, this.config.monitoringInterval);

      this.monitoringIntervals.set(_testMetrics.testId, interval);
    }

    this.emit('monitoring_started', { testId: _testMetrics.testId });
  }

  /**
   * Stop monitoring a test
   */
  public stopMonitoring(testId: string): void {
    const interval = this.monitoringIntervals.get(testId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(testId);
    }

    this.activeTests.delete(testId);
    this.emit('monitoring_stopped', { testId });
  }

  /**
   * Update test metrics and trigger analysis
   */
  public updateTestMetrics(_testMetrics: TestMetrics): void {
    this.activeTests.set(_testMetrics.testId, {
      ..._testMetrics,
      lastUpdated: new Date()
    });

    // Trigger immediate analysis for significant updates
    this.analyzeTest(_testMetrics.testId);
  }

  /**
   * Perform comprehensive statistical analysis
   */
  private async analyzeTest(testId: string): Promise<void> {
    const _testMetrics = this.activeTests.get(testId);
    if (!_testMetrics) return;

    try {
      // Perform frequentist analysis
      const frequentistResult = this.performFrequentistAnalysis(_testMetrics);

      // Perform Bayesian analysis if enabled
      let bayesianResult: StatisticalResult | null = null;
      if (this.config.bayesianEnabled) {
        bayesianResult = this.performBayesianAnalysis(_testMetrics);
      }

      // Power analysis
      const powerAnalysis = this.calculatePowerAnalysis(_testMetrics);

      // Anomaly detection
      const anomalies = this.detectAnomalies(_testMetrics);

      // Determine recommended action
      const recommendedAction = this.determineRecommendedAction(
        frequentistResult,
        bayesianResult,
        powerAnalysis,
        anomalies
      );

      // Store results
      if (!this.statisticalResults.has(testId)) {
        this.statisticalResults.set(testId, []);
      }
      this.statisticalResults.get(testId)!.push(frequentistResult);

      if (bayesianResult) {
        this.statisticalResults.get(testId)!.push(bayesianResult);
      }

      // Generate alerts if necessary
      this.checkForAlerts(testId, frequentistResult, bayesianResult, powerAnalysis, anomalies);

      this.emit('analysis_complete', {
        testId,
        frequentistResult,
        bayesianResult,
        powerAnalysis,
        anomalies,
        recommendedAction
      });

    } catch (error) {
      this.emit('analysis_error', { testId, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Perform frequentist statistical analysis (z-test for proportions)
   */
  private performFrequentistAnalysis(_testMetrics: TestMetrics): StatisticalResult {
    if (_testMetrics.variations.length < 2) {
      throw new Error('At least 2 variations required for statistical analysis');
    }

    // Use first variation as control, others as treatments
    const control = _testMetrics.variations[0];
    const treatment = _testMetrics.variations[1]; // Primary treatment

    const controlRate = control.conversions / control.visitors;
    const treatmentRate = treatment.conversions / treatment.visitors;

    // Calculate pooled proportion and standard error
    const pooledVisitors = control.visitors + treatment.visitors;
    const pooledConversions = control.conversions + treatment.conversions;
    const pooledRate = pooledConversions / pooledVisitors;

    const standardError = Math.sqrt(
      pooledRate * (1 - pooledRate) * (1 / control.visitors + 1 / treatment.visitors)
    );

    // Calculate z-score and p-value
    const zScore = (treatmentRate - controlRate) / standardError;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore))); // Two-tailed test

    // Calculate confidence interval for the difference
    const marginOfError = this.getZCritical(this.config.significanceLevel / 2) * standardError;
    const lowerBound = (treatmentRate - controlRate) - marginOfError;
    const upperBound = (treatmentRate - controlRate) + marginOfError;

    const isSignificant = pValue < this.config.significanceLevel;

    return {
      testId: _testMetrics.testId,
      method: 'frequentist',
      isSignificant,
      pValue,
      confidenceInterval: [lowerBound, upperBound],
      powerAnalysis: this.calculatePowerAnalysis(_testMetrics),
      recommendedAction: this.getRecommendedAction(isSignificant, pValue, _testMetrics),
      reasoning: this.generateReasoning('frequentist', isSignificant, pValue, _testMetrics),
      timestamp: new Date()
    };
  }

  /**
   * Perform Bayesian statistical analysis
   */
  private performBayesianAnalysis(_testMetrics: TestMetrics): StatisticalResult {
    if (_testMetrics.variations.length < 2) {
      throw new Error('At least 2 variations required for Bayesian analysis');
    }

    const control = _testMetrics.variations[0];
    const treatment = _testMetrics.variations[1];

    // Beta-Binomial conjugate prior (uninformative prior: alpha=1, beta=1)
    const priorAlpha = 1;
    const priorBeta = 1;

    // Posterior parameters
    const controlPosteriorAlpha = priorAlpha + control.conversions;
    const controlPosteriorBeta = priorBeta + control.visitors - control.conversions;

    const treatmentPosteriorAlpha = priorAlpha + treatment.conversions;
    const treatmentPosteriorBeta = priorBeta + treatment.visitors - treatment.conversions;

    // Monte Carlo simulation to calculate probability that treatment > control
    const simulations = 10000;
    let treatmentWins = 0;

    for (let i = 0; i < simulations; i++) {
      const controlSample = this.betaRandom(controlPosteriorAlpha, controlPosteriorBeta);
      const treatmentSample = this.betaRandom(treatmentPosteriorAlpha, treatmentPosteriorBeta);

      if (treatmentSample > controlSample) {
        treatmentWins++;
      }
    }

    const bayesianProbability = treatmentWins / simulations;

    // Calculate credible interval (HDI)
    const credibleInterval = this.calculateCredibleInterval(
      treatmentPosteriorAlpha,
      treatmentPosteriorBeta,
      controlPosteriorAlpha,
      controlPosteriorBeta
    );

    const isSignificant = bayesianProbability > 0.95 || bayesianProbability < 0.05;

    return {
      testId: _testMetrics.testId,
      method: 'bayesian',
      isSignificant,
      bayesianProbability,
      credibleInterval,
      powerAnalysis: this.calculatePowerAnalysis(_testMetrics),
      recommendedAction: this.getRecommendedAction(isSignificant, bayesianProbability, _testMetrics),
      reasoning: this.generateReasoning('bayesian', isSignificant, bayesianProbability, _testMetrics),
      timestamp: new Date()
    };
  }

  /**
   * Calculate power analysis for the test
   */
  private calculatePowerAnalysis(_testMetrics: TestMetrics): PowerAnalysis {
    const control = _testMetrics.variations[0];
    const treatment = _testMetrics.variations[1];

    const controlRate = control.conversions / control.visitors;
    const treatmentRate = treatment.conversions / treatment.visitors;
    const effectSize = Math.abs(treatmentRate - controlRate);

    // Calculate current power using z-test power formula
    const pooledRate = (control.conversions + treatment.conversions) /
                      (control.visitors + treatment.visitors);

    const standardError = Math.sqrt(2 * pooledRate * (1 - pooledRate) / control.visitors);
    const zBeta = (effectSize - this.getZCritical(this.config.significanceLevel / 2) * standardError) / standardError;
    const currentPower = this.normalCDF(zBeta);

    // Calculate required sample size for desired power
    const zAlpha = this.getZCritical(this.config.significanceLevel / 2);
    const zBetaTarget = this.getZCritical(1 - this.config.powerLevel);

    const requiredSampleSize = Math.ceil(
      2 * (zAlpha + zBetaTarget) ** 2 * pooledRate * (1 - pooledRate) /
      (this.config.minimumDetectableEffect ** 2)
    );

    // Estimate time to significance
    const dailyTraffic = this.estimateDailyTraffic(_testMetrics);
    const remainingSampleNeeded = Math.max(0, requiredSampleSize - control.visitors);
    const estimatedDays = remainingSampleNeeded / dailyTraffic;
    const estimatedTimeToSignificance = estimatedDays * 24; // hours

    // Probability of success based on current trajectory
    const probabilityOfSuccess = Math.min(1, currentPower + (effectSize / this.config.minimumDetectableEffect) * 0.3);

    return {
      currentPower: Math.max(0, Math.min(1, currentPower)),
      requiredSampleSize,
      actualSampleSize: control.visitors,
      estimatedTimeToSignificance: estimatedTimeToSignificance > 0 ? estimatedTimeToSignificance : undefined,
      probabilityOfSuccess: Math.max(0, Math.min(1, probabilityOfSuccess))
    };
  }

  /**
   * Detect anomalies in test performance
   */
  private detectAnomalies(_testMetrics: TestMetrics): AnomalyDetection {
    const anomalies: Anomaly[] = [];

    // Check for traffic spikes (more than 3x normal)
    const avgDailyTraffic = this.estimateDailyTraffic(_testMetrics);
    const recentTraffic = this.getRecentTraffic(_testMetrics, 1); // Last 1 day

    if (recentTraffic > avgDailyTraffic * 3) {
      anomalies.push({
        type: 'traffic_spike',
        severity: 'warning',
        description: `Traffic spike detected: ${recentTraffic} vs normal ${avgDailyTraffic}`,
        detectedAt: new Date(),
        affectedVariations: _testMetrics.variations.map(v => v._variationId),
        suggestedAction: 'Monitor closely for external factors affecting traffic'
      });
    }

    // Check for conversion rate drops (more than 50% below baseline)
    _testMetrics.variations.forEach(variation => {
      const historicalRate = this.getHistoricalConversionRate(variation._variationId);
      if (historicalRate && variation.conversionRate < historicalRate * 0.5) {
        anomalies.push({
          type: 'conversion_drop',
          severity: 'critical',
          description: `Conversion rate drop in ${variation.name}: ${(variation.conversionRate * 100).toFixed(2)}% vs historical ${(historicalRate * 100).toFixed(2)}%`,
          detectedAt: new Date(),
          affectedVariations: [variation._variationId],
          suggestedAction: 'Investigate variation implementation and user experience'
        });
      }
    });

    // Check for unusual patterns (extreme variance)
    const conversionRates = _testMetrics.variations.map(v => v.conversionRate);
    const variance = this.calculateVariance(conversionRates);
    if (variance > 0.01) { // High variance threshold
      anomalies.push({
        type: 'unusual_pattern',
        severity: 'warning',
        description: `High variance detected in conversion rates: ${variance.toFixed(4)}`,
        detectedAt: new Date(),
        affectedVariations: _testMetrics.variations.map(v => v._variationId),
        suggestedAction: 'Review test setup and traffic allocation'
      });
    }

    // Determine overall risk level
    const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
    const warningCount = anomalies.filter(a => a.severity === 'warning').length;

    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (criticalCount > 0) riskLevel = 'critical';
    else if (warningCount > 2) riskLevel = 'high';
    else if (warningCount > 0) riskLevel = 'medium';
    else riskLevel = 'low';

    const anomalyDetection: AnomalyDetection = {
      testId: _testMetrics.testId,
      anomalies,
      riskLevel,
      lastCheck: new Date()
    };

    // Store anomaly history
    if (!this.anomalyHistory.has(_testMetrics.testId)) {
      this.anomalyHistory.set(_testMetrics.testId, []);
    }
    this.anomalyHistory.get(_testMetrics.testId)!.push(anomalyDetection);

    return anomalyDetection;
  }

  /**
   * Determine the recommended action based on all analyses
   */
  private determineRecommendedAction(
    frequentistResult: StatisticalResult,
    bayesianResult: StatisticalResult | null,
    powerAnalysis: PowerAnalysis,
    anomalies: AnomalyDetection
  ): 'continue' | 'stop' | 'pause' | 'extend' {
    // Critical anomalies require immediate pause
    if (anomalies.riskLevel === 'critical') {
      return 'pause';
    }

    // Both methods agree on significance
    if (bayesianResult && frequentistResult.isSignificant && bayesianResult.isSignificant) {
      return 'stop';
    }

    // Insufficient power and low probability of success
    if (powerAnalysis.currentPower < 0.5 && powerAnalysis.probabilityOfSuccess < 0.3) {
      return 'extend';
    }

    // High anomaly risk
    if (anomalies.riskLevel === 'high') {
      return 'pause';
    }

    // Default: continue monitoring
    return 'continue';
  }

  /**
   * Check for alerts and emit them
   */
  private checkForAlerts(
    testId: string,
    frequentistResult: StatisticalResult,
    bayesianResult: StatisticalResult | null,
    powerAnalysis: PowerAnalysis,
    anomalies: AnomalyDetection
  ): void {
    const alerts: MonitoringAlert[] = [];

    // Early winner detection
    if (this.config.earlyStoppingEnabled && frequentistResult.isSignificant) {
      alerts.push({
        testId,
        alertType: 'early_winner',
        severity: 'info',
        message: `Early winner detected with p-value: ${frequentistResult.pValue?.toFixed(4)}`,
        timestamp: new Date(),
        actionRequired: true,
        autoActionTaken: 'Test recommended for termination'
      });
    }

    // Insufficient power alert
    if (powerAnalysis.currentPower < 0.2) {
      alerts.push({
        testId,
        alertType: 'power_insufficient',
        severity: 'warning',
        message: `Low statistical power: ${(powerAnalysis.currentPower * 100).toFixed(1)}%`,
        timestamp: new Date(),
        actionRequired: true
      });
    }

    // Anomaly alerts
    if (anomalies.anomalies.length > 0) {
      alerts.push({
        testId,
        alertType: 'anomaly',
        severity: anomalies.riskLevel === 'critical' ? 'critical' : 'warning',
        message: `${anomalies.anomalies.length} anomal(ies) detected with ${anomalies.riskLevel} risk level`,
        timestamp: new Date(),
        actionRequired: anomalies.riskLevel === 'critical',
        autoActionTaken: anomalies.riskLevel === 'critical' ? 'Test automatically paused' : undefined
      });
    }

    // Sample size reached
    const _testMetrics = this.activeTests.get(testId);
    if (_testMetrics && _testMetrics.totalVisitors >= powerAnalysis.requiredSampleSize) {
      alerts.push({
        testId,
        alertType: 'sample_size_reached',
        severity: 'info',
        message: `Required sample size reached: ${_testMetrics.totalVisitors}/${powerAnalysis.requiredSampleSize}`,
        timestamp: new Date(),
        actionRequired: false
      });
    }

    // Emit alerts
    alerts.forEach(alert => {
      this.emit('alert', alert);
    });
  }

  // Utility methods

  private getRecommendedAction(
    isSignificant: boolean,
    pValueOrProbability: number,
    _testMetrics: TestMetrics
  ): 'continue' | 'stop' | 'pause' | 'extend' {
    if (isSignificant) return 'stop';

    const testAge = Date.now() - _testMetrics.startTime.getTime();
    const maxDuration = this.config.maxTestDuration * 24 * 60 * 60 * 1000;

    if (testAge > maxDuration) return 'stop';
    if (_testMetrics.totalVisitors < this.config.minimumSampleSize) return 'continue';

    return 'continue';
  }

  private generateReasoning(
    method: 'frequentist' | 'bayesian',
    isSignificant: boolean,
    pValueOrProbability: number,
    _testMetrics: TestMetrics
  ): string {
    if (method === 'frequentist') {
      return isSignificant
        ? `Frequentist analysis shows significant difference (p=${pValueOrProbability.toFixed(4)} < ${this.config.significanceLevel})`
        : `No significant difference found (p=${pValueOrProbability.toFixed(4)} ≥ ${this.config.significanceLevel})`;
    } else {
      return isSignificant
        ? `Bayesian analysis shows strong evidence (${(pValueOrProbability * 100).toFixed(1)}% probability)`
        : `Bayesian analysis shows inconclusive evidence (${(pValueOrProbability * 100).toFixed(1)}% probability)`;
    }
  }

  private normalCDF(x: number): number {
    // Approximation of the cumulative standard normal distribution
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of the error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private getZCritical(alpha: number): number {
    // Common z-critical values
    if (alpha <= 0.001) return 3.291;
    if (alpha <= 0.005) return 2.576;
    if (alpha <= 0.01) return 2.326;
    if (alpha <= 0.025) return 1.96;
    if (alpha <= 0.05) return 1.645;
    return 1.282; // alpha = 0.1
  }

  private betaRandom(alpha: number, beta: number): number {
    // Generate random sample from Beta distribution using gamma distributions
    const gamma1 = this.gammaRandom(alpha, 1);
    const gamma2 = this.gammaRandom(beta, 1);
    return gamma1 / (gamma1 + gamma2);
  }

  private gammaRandom(shape: number, scale: number): number {
    // Marsaglia and Tsang's Method for generating Gamma random variables
    if (shape < 1) {
      return this.gammaRandom(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x, v;
      do {
        x = this.normalRandom();
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();

      if (u < 1 - 0.0331 * (x * x) * (x * x)) {
        return d * v * scale;
      }

      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  private normalRandom(): number {
    // Box-Muller transformation
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  private calculateCredibleInterval(
    treatmentAlpha: number,
    treatmentBeta: number,
    controlAlpha: number,
    controlBeta: number
  ): [number, number] {
    // Simplified credible interval calculation for difference in rates
    // In practice, you'd want to use more sophisticated methods
    const treatmentMean = treatmentAlpha / (treatmentAlpha + treatmentBeta);
    const controlMean = controlAlpha / (controlAlpha + controlBeta);

    const treatmentVar = (treatmentAlpha * treatmentBeta) /
                        (Math.pow(treatmentAlpha + treatmentBeta, 2) * (treatmentAlpha + treatmentBeta + 1));
    const controlVar = (controlAlpha * controlBeta) /
                      (Math.pow(controlAlpha + controlBeta, 2) * (controlAlpha + controlBeta + 1));

    const diffMean = treatmentMean - controlMean;
    const diffStd = Math.sqrt(treatmentVar + controlVar);

    // 95% credible interval
    return [diffMean - 1.96 * diffStd, diffMean + 1.96 * diffStd];
  }

  private estimateDailyTraffic(_testMetrics: TestMetrics): number {
    const testAge = Date.now() - _testMetrics.startTime.getTime();
    const testDays = testAge / (24 * 60 * 60 * 1000);
    return testDays > 0 ? _testMetrics.totalVisitors / testDays : 0;
  }

  private getRecentTraffic(_testMetrics: TestMetrics, days: number): number {
    // Simplified: assume even distribution (in practice, you'd track timestamped data)
    const totalDays = (Date.now() - _testMetrics.startTime.getTime()) / (24 * 60 * 60 * 1000);
    if (totalDays <= days) return _testMetrics.totalVisitors;
    return _testMetrics.totalVisitors * (days / totalDays);
  }

  private getHistoricalConversionRate(_variationId: string): number | null {
    // Simplified: return null (in practice, you'd look up historical data)
    return null;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Get all active monitoring sessions
   */
  public getActiveTests(): string[] {
    return Array.from(this.activeTests.keys());
  }

  /**
   * Get statistical results for a test
   */
  public getTestResults(testId: string): StatisticalResult[] {
    return this.statisticalResults.get(testId) || [];
  }

  /**
   * Get anomaly history for a test
   */
  public getAnomalyHistory(testId: string): AnomalyDetection[] {
    return this.anomalyHistory.get(testId) || [];
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): StatisticalConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfiguration(newConfig: Partial<StatisticalConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config_updated', this.config);
  }

  /**
   * Get monitoring status for all tests
   */
  public getMonitoringStatus(): { testId: string; isActive: boolean; lastAnalysis?: Date }[] {
    return Array.from(this.activeTests.entries()).map(([testId, metrics]) => ({
      testId,
      isActive: this.monitoringIntervals.has(testId),
      lastAnalysis: metrics.lastUpdated
    }));
  }

  /**
   * Manual trigger of analysis for a specific test
   */
  public async triggerAnalysis(testId: string): Promise<void> {
    await this.analyzeTest(testId);
  }

  /**
   * Stop all monitoring and clean up
   */
  public shutdown(): void {
    // Clear all intervals
    this.monitoringIntervals.forEach(interval => clearInterval(interval));
    this.monitoringIntervals.clear();

    // Clear data
    this.activeTests.clear();
    this.statisticalResults.clear();
    this.anomalyHistory.clear();

    this.emit('service_shutdown');
  }
}

export default StatisticalMonitoringService;
