import { AdvancedAnalyticsEngine } from '../AdvancedAnalyticsEngine';

describe('AdvancedAnalyticsEngine', () => {
  let engine: AdvancedAnalyticsEngine;

  beforeEach(() => {
    engine = AdvancedAnalyticsEngine.getInstance();
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const engine1 = AdvancedAnalyticsEngine.getInstance();
      const engine2 = AdvancedAnalyticsEngine.getInstance();
      expect(engine1).toBe(engine2);
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration correctly', () => {
      const newConfig = {
        significanceLevel: 0.01,
        confidenceLevel: 0.99,
        maxIterations: 500
      };

      engine.updateConfig(newConfig);
      const config = engine.getConfig();

      expect(config.significanceLevel).toBe(0.01);
      expect(config.confidenceLevel).toBe(0.99);
      expect(config.maxIterations).toBe(500);
    });

    test('should get default configuration', () => {
      const config = engine.getConfig();
      expect(config.significanceLevel).toBe(0.05);
      expect(config.confidenceLevel).toBe(0.95);
      expect(config.maxIterations).toBe(1000);
      expect(config.tolerance).toBe(1e-8);
      expect(config.robustMethods).toBe(true);
    });
  });

  describe('Statistical Testing', () => {
    test('should perform one-sample t-test', () => {
      const sample = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28];
      const result = engine.tTest(sample, undefined, 'one-sample', 15);

      expect(result.name).toBe('One-Sample t-Test');
      expect(result.statistic).toBeDefined();
      expect(result.pValue).toBeGreaterThan(0);
      expect(result.degreesOfFreedom).toBe(9);
      expect(result.interpretation).toContain('t-test result');
    });

    test('should perform two-sample t-test', () => {
      const sample1 = [12, 14, 16, 18, 20];
      const sample2 = [10, 12, 14, 16, 18];
      const result = engine.tTest(sample1, sample2, 'two-sample');

      expect(result.name).toBe('Two-Sample t-Test (Welch)');
      expect(result.statistic).toBeDefined();
      expect(result.pValue).toBeGreaterThan(0);
    });

    test('should perform chi-square test', () => {
      const observed = [10, 15, 12, 8];
      const expected = [11, 14, 13, 7];
      const result = engine.chiSquareTest(observed, expected);

      expect(result.name).toBe('Chi-Square Goodness of Fit Test');
      expect(result.statistic).toBeGreaterThan(0);
      expect(result.degreesOfFreedom).toBe(3);
    });
  });

  describe('Correlation Analysis', () => {
    test('should calculate Pearson correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const result = engine.correlationAnalysis(x, y, 'pearson');

      expect(result.coefficient).toBeCloseTo(1, 2);
      expect(result.method).toBe('pearson');
      expect(result.strength).toBe('very_strong');
      expect(result.direction).toBe('positive');
      expect(result.isSignificant).toBe(true);
    });

    test('should calculate Spearman correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [1, 4, 9, 16, 25];
      const result = engine.correlationAnalysis(x, y, 'spearman');

      expect(result.method).toBe('spearman');
      expect(result.coefficient).toBeCloseTo(1, 1);
    });
  });

  describe('Regression Analysis', () => {
    test('should perform multiple regression', () => {
      const y = [2, 4, 6, 8, 10];
      const X = [[1], [2], [3], [4], [5]];
      const result = engine.multipleRegression(y, X);

      expect(result.type).toBe('multiple');
      expect(result.coefficients).toHaveLength(2);
      expect(result.rSquared).toBeCloseTo(1, 2);
      expect(result.equation).toContain('y =');
    });
  });

  describe('Trend Analysis', () => {
    test('should detect increasing trend', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = engine.trendAnalysis(data);

      expect(result.trend).toBe('increasing');
      expect(result.strength).toBeGreaterThan(0);
      expect(result.forecast.values.length).toBeGreaterThan(0);
    });

    test('should detect anomalies', () => {
      const data = [1, 2, 3, 100, 5, 6, 7, 8, 9, 10];
      const result = engine.trendAnalysis(data);

      expect(result.anomalies.indices.length).toBeGreaterThan(0);
      expect(result.anomalies.indices).toContain(3);
    });
  });

  describe('Automated Insights', () => {
    test('should generate insights from data', () => {
      const data = {
        sales: [100, 110, 120, 130, 140],
        advertising: [10, 11, 12, 13, 14]
      };

      const insights = engine.generateInsights(data);
      expect(insights.length).toBeGreaterThan(0);

      const correlationInsight = insights.find(i => i.type === 'correlation');
      expect(correlationInsight).toBeDefined();
      expect(correlationInsight?.supportingEvidence.length).toBeGreaterThan(0);
      expect(correlationInsight?.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Core Functionality', () => {
    test('should be properly instantiated', () => {
      expect(engine).toBeDefined();
      expect(typeof engine.tTest).toBe('function');
      expect(typeof engine.correlationAnalysis).toBe('function');
      expect(typeof engine.multipleRegression).toBe('function');
      expect(typeof engine.trendAnalysis).toBe('function');
      expect(typeof engine.generateInsights).toBe('function');
    });

    test('should handle method calls without errors', () => {
      expect(() => {
        engine.updateConfig({ significanceLevel: 0.01 });
        engine.getConfig();
      }).not.toThrow();
    });
  });

  describe('Configuration', () => {
    test('should update and get configuration', () => {
      const newConfig = {
        significanceLevel: 0.01,
        confidenceLevel: 0.99
      };

      engine.updateConfig(newConfig);
      const config = engine.getConfig();

      expect(config.significanceLevel).toBe(0.01);
      expect(config.confidenceLevel).toBe(0.99);
    });
  });
});
