import { EventEmitter } from 'events';

// Core Interfaces
export interface StatisticalTest {
  name: string;
  statistic: number;
  pValue: number;
  degreesOfFreedom?: number;
  criticalValue?: number;
  isSignificant: boolean;
  interpretation: string;
  confidenceInterval?: [number, number];
}

export interface CorrelationAnalysis {
  coefficient: number;
  pValue: number;
  method: 'pearson' | 'spearman' | 'kendall';
  strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  direction: 'positive' | 'negative' | 'none';
  isSignificant: boolean;
  sampleSize: number;
  confidenceInterval: [number, number];
}

export interface RegressionResult {
  type: 'linear' | 'polynomial' | 'logistic' | 'multiple';
  coefficients: number[];
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  pValue: number;
  standardErrors: number[];
  residuals: number[];
  predictions: number[];
  equation: string;
  isSignificant: boolean;
  outliers: number[];
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable' | 'seasonal' | 'cyclic';
  strength: number;
  seasonality?: {
    period: number;
    amplitude: number;
    phase: number;
  };
  changePoints: number[];
  forecast: {
    values: number[];
    confidenceIntervals: [number, number][];
    periods: number;
  };
  anomalies: {
    indices: number[];
    values: number[];
    scores: number[];
  };
}

export interface AutomatedInsight {
  type: 'correlation' | 'trend' | 'anomaly' | 'distribution' | 'comparison';
  title: string;
  description: string;
  significance: 'high' | 'medium' | 'low';
  confidence: number;
  supportingEvidence: string[];
  recommendations: string[];
  visualization?: {
    chartType: string;
    config: any;
  };
}

export interface AnalyticsConfig {
  significanceLevel: number;
  confidenceLevel: number;
  maxIterations: number;
  tolerance: number;
  robustMethods: boolean;
}

// Advanced Analytics Engine
export class AdvancedAnalyticsEngine extends EventEmitter {
  private static instance: AdvancedAnalyticsEngine;
  private config: AnalyticsConfig;

  private constructor() {
    super();
    this.config = {
      significanceLevel: 0.05,
      confidenceLevel: 0.95,
      maxIterations: 1000,
      tolerance: 1e-8,
      robustMethods: true
    };
  }

  public static getInstance(): AdvancedAnalyticsEngine {
    if (!AdvancedAnalyticsEngine.instance) {
      AdvancedAnalyticsEngine.instance = new AdvancedAnalyticsEngine();
    }
    return AdvancedAnalyticsEngine.instance;
  }

  // Statistical Testing Suite
  public tTest(sample1: number[], sample2?: number[], type: 'one-sample' | 'two-sample' | 'paired' = 'two-sample', hypothesizedMean: number = 0): StatisticalTest {
    if (type === 'one-sample') {
      return this.oneSampleTTest(sample1, hypothesizedMean);
    } else if (type === 'paired') {
      if (!sample2 || sample1.length !== sample2.length) {
        throw new Error('Paired t-test requires two samples of equal length');
      }
      return this.pairedTTest(sample1, sample2);
    } else {
      if (!sample2) {
        throw new Error('Two-sample t-test requires two samples');
      }
      return this.twoSampleTTest(sample1, sample2);
    }
  }

  private oneSampleTTest(sample: number[], hypothesizedMean: number): StatisticalTest {
    const n = sample.length;
    const mean = sample.reduce((sum, x) => sum + x, 0) / n;
    const variance = sample.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
    const standardError = Math.sqrt(variance / n);
    const tStatistic = (mean - hypothesizedMean) / standardError;
    const degreesOfFreedom = n - 1;

    // Critical value for two-tailed test
    const criticalValue = this.tCriticalValue(degreesOfFreedom, this.config.significenceLevel);
    const pValue = this.tPValue(Math.abs(tStatistic), degreesOfFreedom) * 2;
    const isSignificant = pValue < this.config.significanceLevel;

    // Confidence interval
    const marginOfError = criticalValue * standardError;
    const confidenceInterval: [number, number] = [mean - marginOfError, mean + marginOfError];

    return {
      name: 'One-Sample t-Test',
      statistic: tStatistic,
      pValue,
      degreesOfFreedom,
      criticalValue,
      isSignificant,
      interpretation: this.interpretTTest(tStatistic, pValue, isSignificant, 'one-sample'),
      confidenceInterval
    };
  }

  private twoSampleTTest(sample1: number[], sample2: number[]): StatisticalTest {
    const n1 = sample1.length;
    const n2 = sample2.length;
    const mean1 = sample1.reduce((sum, x) => sum + x, 0) / n1;
    const mean2 = sample2.reduce((sum, x) => sum + x, 0) / n2;

    const variance1 = sample1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / (n1 - 1);
    const variance2 = sample2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / (n2 - 1);

    // Welch's t-test (unequal variances)
    const standardError = Math.sqrt(variance1 / n1 + variance2 / n2);
    const tStatistic = (mean1 - mean2) / standardError;

    // Welch-Satterthwaite equation for degrees of freedom
    const degreesOfFreedom = Math.pow(variance1 / n1 + variance2 / n2, 2) /
      (Math.pow(variance1 / n1, 2) / (n1 - 1) + Math.pow(variance2 / n2, 2) / (n2 - 1));

    const criticalValue = this.tCriticalValue(degreesOfFreedom, this.config.significanceLevel);
    const pValue = this.tPValue(Math.abs(tStatistic), degreesOfFreedom) * 2;
    const isSignificant = pValue < this.config.significanceLevel;

    return {
      name: 'Two-Sample t-Test (Welch)',
      statistic: tStatistic,
      pValue,
      degreesOfFreedom,
      criticalValue,
      isSignificant,
      interpretation: this.interpretTTest(tStatistic, pValue, isSignificant, 'two-sample')
    };
  }

  private pairedTTest(sample1: number[], sample2: number[]): StatisticalTest {
    const differences = sample1.map((x, i) => x - sample2[i]);
    return this.oneSampleTTest(differences, 0);
  }

  public chiSquareTest(observed: number[], expected?: number[]): StatisticalTest {
    const n = observed.length;
    const totalObserved = observed.reduce((sum, x) => sum + x, 0);

    const expectedValues = expected || new Array(n).fill(totalObserved / n);

    const chiSquare = observed.reduce((sum, obs, i) => {
      const exp = expectedValues[i];
      return sum + Math.pow(obs - exp, 2) / exp;
    }, 0);

    const degreesOfFreedom = n - 1;
    const pValue = this.chiSquarePValue(chiSquare, degreesOfFreedom);
    const criticalValue = this.chiSquareCriticalValue(degreesOfFreedom, this.config.significanceLevel);
    const isSignificant = pValue < this.config.significanceLevel;

    return {
      name: 'Chi-Square Goodness of Fit Test',
      statistic: chiSquare,
      pValue,
      degreesOfFreedom,
      criticalValue,
      isSignificant,
      interpretation: this.interpretChiSquareTest(chiSquare, pValue, isSignificant)
    };
  }

  // Advanced Correlation Analysis
  public correlationAnalysis(x: number[], y: number[], method: 'pearson' | 'spearman' | 'kendall' = 'pearson'): CorrelationAnalysis {
    if (x.length !== y.length) {
      throw new Error('Arrays must have the same length');
    }

    let coefficient: number;
    let pValue: number;

    switch (method) {
      case 'pearson':
        coefficient = this.pearsonCorrelation(x, y);
        pValue = this.pearsonPValue(coefficient, x.length);
        break;
      case 'spearman':
        coefficient = this.spearmanCorrelation(x, y);
        pValue = this.spearmanPValue(coefficient, x.length);
        break;
      case 'kendall':
        coefficient = this.kendallCorrelation(x, y);
        pValue = this.kendallPValue(coefficient, x.length);
        break;
    }

    const strength = this.classifyCorrelationStrength(Math.abs(coefficient));
    const direction = coefficient > 0 ? 'positive' : coefficient < 0 ? 'negative' : 'none';
    const isSignificant = pValue < this.config.significanceLevel;

    // Fisher's z-transformation for confidence interval
    const confidenceInterval = this.correlationConfidenceInterval(coefficient, x.length, this.config.confidenceLevel);

    return {
      coefficient,
      pValue,
      method,
      strength,
      direction,
      isSignificant,
      sampleSize: x.length,
      confidenceInterval
    };
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;

    for (let i = 0; i < n; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = y[i] - meanY;
      numerator += deltaX * deltaY;
      sumXSquared += deltaX * deltaX;
      sumYSquared += deltaY * deltaY;
    }

    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private spearmanCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const rankX = this.rankArray(x);
    const rankY = this.rankArray(y);

    let sumDSquared = 0;
    for (let i = 0; i < n; i++) {
      sumDSquared += Math.pow(rankX[i] - rankY[i], 2);
    }

    return 1 - (6 * sumDSquared) / (n * (n * n - 1));
  }

  private kendallCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    let concordant = 0;
    let discordant = 0;

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const signX = Math.sign(x[j] - x[i]);
        const signY = Math.sign(y[j] - y[i]);

        if (signX * signY > 0) concordant++;
        else if (signX * signY < 0) discordant++;
      }
    }

    return (concordant - discordant) / (n * (n - 1) / 2);
  }

  // Multiple Regression Analysis
  public multipleRegression(y: number[], X: number[][]): RegressionResult {
    // Add intercept column to X matrix
    const XWithIntercept = X.map(row => [1, ...row]);

    // Calculate coefficients using normal equation: β = (X'X)^(-1)X'y
    const XT = this.transpose(XWithIntercept);
    const XTX = this.matrixMultiply(XT, XWithIntercept);
    const XTXInverse = this.matrixInverse(XTX);
    const XTy = this.matrixVectorMultiply(XT, y);
    const coefficients = this.matrixVectorMultiply(XTXInverse, XTy);

    // Calculate predictions and residuals
    const predictions = XWithIntercept.map(row =>
      row.reduce((sum, x, i) => sum + x * coefficients[i], 0)
    );
    const residuals = y.map((yi, i) => yi - predictions[i]);

    // Calculate R-squared and adjusted R-squared
    const meanY = y.reduce((sum, yi) => sum + yi, 0) / y.length;
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
    const residualSumSquares = residuals.reduce((sum, r) => sum + r * r, 0);
    const rSquared = 1 - residualSumSquares / totalSumSquares;

    const n = y.length;
    const p = X[0].length; // number of predictors (excluding intercept)
    const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - p - 1);

    // Calculate F-statistic
    const meanSquareRegression = (totalSumSquares - residualSumSquares) / p;
    const meanSquareError = residualSumSquares / (n - p - 1);
    const fStatistic = meanSquareRegression / meanSquareError;

    // Calculate p-value for F-statistic
    const fPValue = this.fPValue(fStatistic, p, n - p - 1);

    // Calculate standard errors
    const meanSquareErrorMatrix = meanSquareError;
    const standardErrors = coefficients.map((_, i) =>
      Math.sqrt(meanSquareErrorMatrix * XTXInverse[i][i])
    );

    // Detect outliers using standardized residuals
    const standardizedResiduals = residuals.map(r => Math.abs(r) / Math.sqrt(meanSquareError));
    const outliers = standardizedResiduals
      .map((sr, i) => ({ index: i, value: sr }))
      .filter(item => item.value > 2.5)
      .map(item => item.index);

    // Generate equation string
    const equation = this.generateRegressionEquation(coefficients);

    return {
      type: 'multiple',
      coefficients,
      rSquared,
      adjustedRSquared,
      fStatistic,
      pValue: fPValue,
      standardErrors,
      residuals,
      predictions,
      equation,
      isSignificant: fPValue < this.config.significanceLevel,
      outliers
    };
  }

  // Trend Analysis and Forecasting
  public trendAnalysis(data: number[], timestamps?: number[]): TrendAnalysis {
    const n = data.length;
    const x = timestamps || Array.from({ length: n }, (_, i) => i);

    // Linear trend analysis
    const linearRegression = this.simpleLinearRegression(x, data);
    const slope = linearRegression.coefficients[1];

    let trend: TrendAnalysis['trend'];
    if (Math.abs(slope) < 0.001) {
      trend = 'stable';
    } else if (slope > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    // Seasonality detection using autocorrelation
    const seasonality = this.detectSeasonality(data);
    if (seasonality.period > 0) {
      trend = 'seasonal';
    }

    // Change point detection
    const changePoints = this.detectChangePoints(data);

    // Anomaly detection
    const anomalies = this.detectAnomalies(data);

    // Simple forecasting using linear trend
    const forecastPeriods = Math.min(12, Math.floor(n * 0.2)); // Forecast 20% of data length, max 12 periods
    const forecast = this.generateForecast(data, x, forecastPeriods);

    return {
      trend,
      strength: Math.abs(slope),
      seasonality: seasonality.period > 0 ? seasonality : undefined,
      changePoints,
      forecast,
      anomalies
    };
  }

  // Automated Insight Generation
  public generateInsights(data: { [key: string]: number[] }): AutomatedInsight[] {
    const insights: AutomatedInsight[] = [];
    const variables = Object.keys(data);

    // Correlation insights
    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const varX = variables[i];
        const varY = variables[j];
        const correlation = this.correlationAnalysis(data[varX], data[varY]);

        if (correlation.isSignificant && Math.abs(correlation.coefficient) > 0.3) {
          insights.push({
            type: 'correlation',
            title: `${correlation.strength.toUpperCase()} ${correlation.direction} correlation between ${varX} and ${varY}`,
            description: `There is a ${correlation.strength} ${correlation.direction} correlation (r = ${correlation.coefficient.toFixed(3)}) between ${varX} and ${varY}, which is statistically significant (p < ${this.config.significanceLevel}).`,
            significance: Math.abs(correlation.coefficient) > 0.7 ? 'high' : Math.abs(correlation.coefficient) > 0.5 ? 'medium' : 'low',
            confidence: 1 - correlation.pValue,
            supportingEvidence: [
              `Correlation coefficient: ${correlation.coefficient.toFixed(3)}`,
              `P-value: ${correlation.pValue.toFixed(4)}`,
              `Sample size: ${correlation.sampleSize}`
            ],
            recommendations: this.generateCorrelationRecommendations(correlation, varX, varY)
          });
        }
      }
    }

    // Trend insights for each variable
    variables.forEach(variable => {
      const trendAnalysis = this.trendAnalysis(data[variable]);

      if (trendAnalysis.trend !== 'stable') {
        insights.push({
          type: 'trend',
          title: `${variable} shows ${trendAnalysis.trend} trend`,
          description: `The variable ${variable} exhibits a ${trendAnalysis.trend} pattern with strength ${trendAnalysis.strength.toFixed(3)}.`,
          significance: trendAnalysis.strength > 0.1 ? 'high' : trendAnalysis.strength > 0.05 ? 'medium' : 'low',
          confidence: Math.min(0.95, trendAnalysis.strength * 10),
          supportingEvidence: [
            `Trend type: ${trendAnalysis.trend}`,
            `Trend strength: ${trendAnalysis.strength.toFixed(3)}`,
            `Change points detected: ${trendAnalysis.changePoints.length}`
          ],
          recommendations: this.generateTrendRecommendations(trendAnalysis, variable)
        });
      }

      // Anomaly insights
      if (trendAnalysis.anomalies.indices.length > 0) {
        insights.push({
          type: 'anomaly',
          title: `Anomalies detected in ${variable}`,
          description: `${trendAnalysis.anomalies.indices.length} anomalies were detected in ${variable}, representing ${(trendAnalysis.anomalies.indices.length / data[variable].length * 100).toFixed(1)}% of the data.`,
          significance: trendAnalysis.anomalies.indices.length > data[variable].length * 0.1 ? 'high' : 'medium',
          confidence: 0.85,
          supportingEvidence: [
            `Number of anomalies: ${trendAnalysis.anomalies.indices.length}`,
            `Anomaly rate: ${(trendAnalysis.anomalies.indices.length / data[variable].length * 100).toFixed(1)}%`,
            `Max anomaly score: ${Math.max(...trendAnalysis.anomalies.scores).toFixed(2)}`
          ],
          recommendations: [
            'Investigate the identified anomalies for data quality issues',
            'Consider external factors that might explain these outliers',
            'Review data collection processes around anomaly periods'
          ]
        });
      }
    });

    return insights.sort((a, b) => {
      const significanceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return significanceOrder[b.significance] - significanceOrder[a.significance];
    });
  }

  // Helper Methods
  private interpretTTest(tStatistic: number, pValue: number, isSignificant: boolean, type: string): string {
    const interpretation = isSignificant
      ? `The test is statistically significant (p = ${pValue.toFixed(4)}). We reject the null hypothesis.`
      : `The test is not statistically significant (p = ${pValue.toFixed(4)}). We fail to reject the null hypothesis.`;

    return `${type} t-test result: t = ${tStatistic.toFixed(3)}, ${interpretation}`;
  }

  private interpretChiSquareTest(chiSquare: number, pValue: number, isSignificant: boolean): string {
    const interpretation = isSignificant
      ? `The test is statistically significant (p = ${pValue.toFixed(4)}). The observed frequencies differ significantly from expected.`
      : `The test is not statistically significant (p = ${pValue.toFixed(4)}). The observed frequencies do not differ significantly from expected.`;

    return `Chi-square test result: χ² = ${chiSquare.toFixed(3)}, ${interpretation}`;
  }

  private classifyCorrelationStrength(absCorrelation: number): 'weak' | 'moderate' | 'strong' | 'very_strong' {
    if (absCorrelation < 0.3) return 'weak';
    if (absCorrelation < 0.5) return 'moderate';
    if (absCorrelation < 0.7) return 'strong';
    return 'very_strong';
  }

  private generateCorrelationRecommendations(correlation: CorrelationAnalysis, varX: string, varY: string): string[] {
    const recommendations = [];

    if (correlation.strength === 'strong' || correlation.strength === 'very_strong') {
      recommendations.push(`Consider using ${varX} as a predictor for ${varY} in regression models`);
      recommendations.push(`Monitor both variables together as they show strong relationship`);
    }

    if (correlation.direction === 'negative') {
      recommendations.push(`Investigate the inverse relationship between ${varX} and ${varY}`);
    }

    recommendations.push(`Collect more data to validate this relationship`);
    return recommendations;
  }

  private generateTrendRecommendations(trendAnalysis: TrendAnalysis, variable: string): string[] {
    const recommendations = [];

    switch (trendAnalysis.trend) {
      case 'increasing':
        recommendations.push(`Monitor the upward trend in ${variable} for sustainability`);
        recommendations.push(`Plan for continued growth based on trend projection`);
        break;
      case 'decreasing':
        recommendations.push(`Investigate causes of declining trend in ${variable}`);
        recommendations.push(`Implement corrective measures to reverse the trend`);
        break;
      case 'seasonal':
        recommendations.push(`Plan resources based on seasonal patterns in ${variable}`);
        recommendations.push(`Use seasonal forecasting for better predictions`);
        break;
    }

    if (trendAnalysis.changePoints.length > 0) {
      recommendations.push(`Analyze events around change points for insights`);
    }

    return recommendations;
  }

  // Mathematical utility functions (simplified implementations)
  private tCriticalValue(df: number, alpha: number): number {
    // Simplified approximation - in production, use proper statistical tables
    return 1.96 + df * 0.01; // Placeholder
  }

  private tPValue(t: number, df: number): number {
    // Simplified approximation - in production, use proper statistical functions
    return Math.exp(-t * t / 2) / Math.sqrt(2 * Math.PI); // Placeholder
  }

  private chiSquareCriticalValue(df: number, alpha: number): number {
    // Simplified approximation
    return df + 1.96 * Math.sqrt(2 * df); // Placeholder
  }

  private chiSquarePValue(chiSquare: number, df: number): number {
    // Simplified approximation
    return Math.exp(-chiSquare / 2); // Placeholder
  }

  private fPValue(f: number, df1: number, df2: number): number {
    // Simplified approximation
    return Math.exp(-f); // Placeholder
  }

  private pearsonPValue(r: number, n: number): number {
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    return this.tPValue(Math.abs(t), n - 2) * 2;
  }

  private spearmanPValue(rho: number, n: number): number {
    // For large n, Spearman's rho approximates normal distribution
    const z = rho * Math.sqrt(n - 1);
    return 2 * (1 - this.normalCDF(Math.abs(z)));
  }

  private kendallPValue(tau: number, n: number): number {
    // Approximate p-value for Kendall's tau
    const variance = (2 * (2 * n + 5)) / (9 * n * (n - 1));
    const z = tau / Math.sqrt(variance);
    return 2 * (1 - this.normalCDF(Math.abs(z)));
  }

  private normalCDF(z: number): number {
    // Approximation of normal cumulative distribution function
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private correlationConfidenceInterval(r: number, n: number, confidenceLevel: number): [number, number] {
    // Fisher's z-transformation
    const z = 0.5 * Math.log((1 + r) / (1 - r));
    const se = 1 / Math.sqrt(n - 3);
    const zCrit = this.normalInverse((1 + confidenceLevel) / 2);

    const zLower = z - zCrit * se;
    const zUpper = z + zCrit * se;

    // Transform back to correlation scale
    const rLower = (Math.exp(2 * zLower) - 1) / (Math.exp(2 * zLower) + 1);
    const rUpper = (Math.exp(2 * zUpper) - 1) / (Math.exp(2 * zUpper) + 1);

    return [rLower, rUpper];
  }

  private normalInverse(p: number): number {
    // Approximation of inverse normal distribution
    if (p <= 0 || p >= 1) throw new Error('p must be between 0 and 1');

    // Beasley-Springer-Moro algorithm (simplified)
    const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];

    if (p < 0.5) {
      const q = Math.sqrt(-2 * Math.log(p));
      return -(((((a[6] * q + a[5]) * q + a[4]) * q + a[3]) * q + a[2]) * q + a[1]) * q + a[0]) /
             ((((b[5] * q + b[4]) * q + b[3]) * q + b[2]) * q + b[1]) * q + 1);
    } else {
      const q = Math.sqrt(-2 * Math.log(1 - p));
      return (((((a[6] * q + a[5]) * q + a[4]) * q + a[3]) * q + a[2]) * q + a[1]) * q + a[0]) /
             ((((b[5] * q + b[4]) * q + b[3]) * q + b[2]) * q + b[1]) * q + 1);
    }
  }

  private rankArray(arr: number[]): number[] {
    const sorted = arr.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
    const ranks = new Array(arr.length);

    for (let i = 0; i < sorted.length; i++) {
      ranks[sorted[i].index] = i + 1;
    }

    return ranks;
  }

  private simpleLinearRegression(x: number[], y: number[]): RegressionResult {
    const n = x.length;
    const meanX = x.reduce((sum, xi) => sum + xi, 0) / n;
    const meanY = y.reduce((sum, yi) => sum + yi, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (y[i] - meanY);
      denominator += (x[i] - meanX) * (x[i] - meanX);
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = meanY - slope * meanX;

    const predictions = x.map(xi => slope * xi + intercept);
    const residuals = y.map((yi, i) => yi - predictions[i]);

    // Calculate R-squared
    let totalSumSquares = 0;
    let residualSumSquares = 0;

    for (let i = 0; i < n; i++) {
      totalSumSquares += (y[i] - meanY) * (y[i] - meanY);
      residualSumSquares += residuals[i] * residuals[i];
    }

    const rSquared = totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);
    const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - 2);

    // F-statistic for simple linear regression
    const meanSquareRegression = totalSumSquares - residualSumSquares;
    const meanSquareError = residualSumSquares / (n - 2);
    const fStatistic = meanSquareRegression / meanSquareError;
    const fPValue = this.fPValue(fStatistic, 1, n - 2);

    return {
      type: 'linear',
      coefficients: [intercept, slope],
      rSquared,
      adjustedRSquared,
      fStatistic,
      pValue: fPValue,
      standardErrors: [0, 0], // Simplified
      residuals,
      predictions,
      equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
      isSignificant: fPValue < this.config.significanceLevel,
      outliers: []
    };
  }

  private detectSeasonality(data: number[]): { period: number; amplitude: number; phase: number } {
    // Simplified seasonality detection using autocorrelation
    const n = data.length;
    const maxLag = Math.min(n / 2, 24); // Check up to 24 periods

    let bestPeriod = 0;
    let maxCorrelation = 0;

    for (let lag = 2; lag <= maxLag; lag++) {
      const correlation = this.autocorrelation(data, lag);
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = lag;
      }
    }

    // If correlation is significant, we have seasonality
    const threshold = 0.3;
    if (maxCorrelation > threshold) {
      return {
        period: bestPeriod,
        amplitude: maxCorrelation,
        phase: 0 // Simplified
      };
    }

    return { period: 0, amplitude: 0, phase: 0 };
  }

  private autocorrelation(data: number[], lag: number): number {
    const n = data.length;
    if (lag >= n) return 0;

    const mean = data.reduce((sum, x) => sum + x, 0) / n;
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n - lag; i++) {
      numerator += (data[i] - mean) * (data[i + lag] - mean);
    }

    for (let i = 0; i < n; i++) {
      denominator += (data[i] - mean) * (data[i] - mean);
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private detectChangePoints(data: number[]): number[] {
    // Simplified change point detection using variance test
    const changePoints: number[] = [];
    const windowSize = Math.max(5, Math.floor(data.length / 10));

    for (let i = windowSize; i < data.length - windowSize; i++) {
      const before = data.slice(i - windowSize, i);
      const after = data.slice(i, i + windowSize);

      const meanBefore = before.reduce((sum, x) => sum + x, 0) / before.length;
      const meanAfter = after.reduce((sum, x) => sum + x, 0) / after.length;

      // Simple threshold-based detection
      if (Math.abs(meanAfter - meanBefore) > 2 * this.standardDeviation(data)) {
        changePoints.push(i);
      }
    }

    return changePoints;
  }

  private detectAnomalies(data: number[]): { indices: number[]; values: number[]; scores: number[] } {
    const mean = data.reduce((sum, x) => sum + x, 0) / data.length;
    const std = this.standardDeviation(data);

    const indices: number[] = [];
    const values: number[] = [];
    const scores: number[] = [];

    data.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / std);
      if (zScore > 2.5) { // 2.5 standard deviations threshold
        indices.push(index);
        values.push(value);
        scores.push(zScore);
      }
    });

    return { indices, values, scores };
  }

  private standardDeviation(data: number[]): number {
    const mean = data.reduce((sum, x) => sum + x, 0) / data.length;
    const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  private generateForecast(data: number[], x: number[], periods: number): { values: number[]; confidenceIntervals: [number, number][] } {
    // Simple linear trend extrapolation
    const regression = this.simpleLinearRegression(x, data);
    const lastX = x[x.length - 1];

    const values: number[] = [];
    const confidenceIntervals: [number, number][] = [];

    for (let i = 1; i <= periods; i++) {
      const futureX = lastX + i;
      const prediction = regression.coefficients[0] + regression.coefficients[1] * futureX;

      // Simple confidence interval (±2 standard deviations of residuals)
      const residualStd = this.standardDeviation(regression.residuals);
      const margin = 2 * residualStd;

      values.push(prediction);
      confidenceIntervals.push([prediction - margin, prediction + margin]);
    }

    return { values, confidenceIntervals };
  }

  // Matrix operations for multiple regression
  private transpose(matrix: number[][]): number[][] {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }

  private matrixMultiply(a: number[][], b: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < a.length; i++) {
      result[i] = [];
      for (let j = 0; j < b[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < b.length; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  private matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => row.reduce((sum, val, i) => sum + val * vector[i], 0));
  }

  private matrixInverse(matrix: number[][]): number[][] {
    // Simplified 2x2 matrix inverse for demo - in production, use proper algorithms
    const n = matrix.length;
    if (n === 2) {
      const [[a, b], [c, d]] = matrix;
      const det = a * d - b * c;
      if (Math.abs(det) < 1e-10) throw new Error('Matrix is singular');
      return [[d / det, -b / det], [-c / det, a / det]];
    }

    // For larger matrices, implement Gaussian elimination or use a library
    throw new Error('Matrix inverse not implemented for this size');
  }

  private generateRegressionEquation(coefficients: number[]): string {
    const terms = coefficients.map((coef, i) => {
      if (i === 0) return coef.toFixed(4); // Intercept
      return `${coef >= 0 ? '+' : ''}${coef.toFixed(4)}x${i}`;
    });
    return `y = ${terms.join(' ')}`;
  }

  // Configuration
  public updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): AnalyticsConfig {
    return { ...this.config };
  }
}

export default AdvancedAnalyticsEngine;
