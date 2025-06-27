/**
 * Statistical Monitoring Service Test Suite
 *
 * Comprehensive tests for:
 * - Frequentist statistical analysis
 * - Bayesian statistical analysis
 * - Power analysis calculations
 * - Anomaly detection algorithms
 * - Real-time monitoring capabilities
 * - Event-driven architecture
 * - Configuration management
 */

import StatisticalMonitoringService, {
    StatisticalConfig,
    TestMetrics,
    VariationMetrics
} from '../services/statistical-monitoring-service';

describe('StatisticalMonitoringService', () => {
  let service: StatisticalMonitoringService;
  let mockTestMetrics: TestMetrics;

  beforeEach(() => {
    service = new StatisticalMonitoringService({
      significanceLevel: 0.05,
      powerLevel: 0.8,
      minimumSampleSize: 100,
      minimumDetectableEffect: 0.05,
      earlyStoppingEnabled: true,
      bayesianEnabled: true,
      monitoringInterval: 5000, // 5 seconds for testing
      maxTestDuration: 7 // 7 days
    });

    // Create mock test metrics with realistic data
    const controlVariation: VariationMetrics = {
      _variationId: 'control',
      name: 'Control',
      visitors: 1000,
      conversions: 100,
      conversionRate: 0.10,
      revenue: 10000,
      avgOrderValue: 100
    };

    const treatmentVariation: VariationMetrics = {
      _variationId: 'treatment',
      name: 'Treatment',
      visitors: 1000,
      conversions: 120,
      conversionRate: 0.12,
      revenue: 12000,
      avgOrderValue: 100
    };

    mockTestMetrics = {
      testId: 'test-001',
      variations: [controlVariation, treatmentVariation],
      startTime: new Date(Date.now() - 86400000), // 1 day ago
      totalVisitors: 2000,
      totalConversions: 220,
      overallConversionRate: 0.11,
      lastUpdated: new Date()
    };
  });

  afterEach(() => {
    service.shutdown();
  });

  describe('Configuration Management', () => {
    test('should initialize with default configuration', () => {
      const defaultService = new StatisticalMonitoringService();
      const config = defaultService.getConfiguration();

      expect(config.significanceLevel).toBe(0.05);
      expect(config.powerLevel).toBe(0.8);
      expect(config.minimumSampleSize).toBe(1000);
      expect(config.earlyStoppingEnabled).toBe(true);
      expect(config.bayesianEnabled).toBe(true);

      defaultService.shutdown();
    });

    test('should accept custom configuration', () => {
      const customConfig: Partial<StatisticalConfig> = {
        significanceLevel: 0.01,
        powerLevel: 0.9,
        bayesianEnabled: false
      };

      const customService = new StatisticalMonitoringService(customConfig);
      const config = customService.getConfiguration();

      expect(config.significanceLevel).toBe(0.01);
      expect(config.powerLevel).toBe(0.9);
      expect(config.bayesianEnabled).toBe(false);

      customService.shutdown();
    });

    test('should update configuration dynamically', () => {
      const newConfig: Partial<StatisticalConfig> = {
        significanceLevel: 0.01,
        monitoringInterval: 10000
      };

      service.updateConfiguration(newConfig);
      const config = service.getConfiguration();

      expect(config.significanceLevel).toBe(0.01);
      expect(config.monitoringInterval).toBe(10000);
    });

    test('should emit config update event', (done) => {
      service.on('config_updated', (config) => {
        expect(config.significanceLevel).toBe(0.01);
        done();
      });

      service.updateConfiguration({ significanceLevel: 0.01 });
    });
  });

  describe('Test Monitoring Management', () => {
    test('should start monitoring a test', () => {
      const startSpy = jest.fn();
      service.on('monitoring_started', startSpy);

      service.startMonitoring(mockTestMetrics);

      expect(service.getActiveTests()).toContain('test-001');
      expect(startSpy).toHaveBeenCalledWith({ testId: 'test-001' });
    });

    test('should stop monitoring a test', () => {
      const stopSpy = jest.fn();
      service.on('monitoring_stopped', stopSpy);

      service.startMonitoring(mockTestMetrics);
      service.stopMonitoring('test-001');

      expect(service.getActiveTests()).not.toContain('test-001');
      expect(stopSpy).toHaveBeenCalledWith({ testId: 'test-001' });
    });

    test('should update test metrics', () => {
      service.startMonitoring(mockTestMetrics);

      const updatedMetrics = {
        ...mockTestMetrics,
        variations: [
          { ...mockTestMetrics.variations[0], conversions: 110 },
          { ...mockTestMetrics.variations[1], conversions: 130 }
        ]
      };

      service.updateTestMetrics(updatedMetrics);

      // Service should have updated metrics internally
      expect(service.getActiveTests()).toContain('test-001');
    });

    test('should get monitoring status', () => {
      service.startMonitoring(mockTestMetrics);
      const status = service.getMonitoringStatus();

      expect(status).toHaveLength(1);
      expect(status[0].testId).toBe('test-001');
      expect(status[0].isActive).toBe(true);
      expect(status[0].lastAnalysis).toBeDefined();
    });
  });

  describe('Frequentist Statistical Analysis', () => {
    test('should perform frequentist analysis with significant difference', async () => {
      // Create data with clear significant difference
      const significantMetrics: TestMetrics = {
        ...mockTestMetrics,
        variations: [
          {
            _variationId: 'control',
            name: 'Control',
            visitors: 1000,
            conversions: 100,
            conversionRate: 0.10
          },
          {
            _variationId: 'treatment',
            name: 'Treatment',
            visitors: 1000,
            conversions: 150, // 50% increase - should be significant
            conversionRate: 0.15
          }
        ]
      };

      const analysisSpy = jest.fn();
      service.on('analysis_complete', analysisSpy);

      service.startMonitoring(significantMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(analysisSpy).toHaveBeenCalled();
      const analysisData = analysisSpy.mock.calls[0][0];
      expect(analysisData.frequentistResult.isSignificant).toBe(true);
      expect(analysisData.frequentistResult.pValue).toBeLessThan(0.05);
    });

    test('should perform frequentist analysis with non-significant difference', async () => {
      // Create data with minimal difference
      const nonSignificantMetrics: TestMetrics = {
        ...mockTestMetrics,
        variations: [
          {
            _variationId: 'control',
            name: 'Control',
            visitors: 100,
            conversions: 10,
            conversionRate: 0.10
          },
          {
            _variationId: 'treatment',
            name: 'Treatment',
            visitors: 100,
            conversions: 11, // Small difference with low sample size
            conversionRate: 0.11
          }
        ]
      };

      const analysisSpy = jest.fn();
      service.on('analysis_complete', analysisSpy);

      service.startMonitoring(nonSignificantMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(analysisSpy).toHaveBeenCalled();
      const analysisData = analysisSpy.mock.calls[0][0];
      expect(analysisData.frequentistResult.isSignificant).toBe(false);
      expect(analysisData.frequentistResult.pValue).toBeGreaterThan(0.05);
    });

    test('should calculate confidence intervals', async () => {
      const analysisSpy = jest.fn();
      service.on('analysis_complete', analysisSpy);

      service.startMonitoring(mockTestMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const analysisData = analysisSpy.mock.calls[0][0];
      const confidenceInterval = analysisData.frequentistResult.confidenceInterval;

      expect(confidenceInterval).toHaveLength(2);
      expect(confidenceInterval[0]).toBeLessThan(confidenceInterval[1]);
      expect(typeof confidenceInterval[0]).toBe('number');
      expect(typeof confidenceInterval[1]).toBe('number');
    });
  });

  describe('Bayesian Statistical Analysis', () => {
    test('should perform Bayesian analysis when enabled', async () => {
      const analysisSpy = jest.fn();
      service.on('analysis_complete', analysisSpy);

      service.startMonitoring(mockTestMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(analysisSpy).toHaveBeenCalled();
      const analysisData = analysisSpy.mock.calls[0][0];

      expect(analysisData.bayesianResult).toBeDefined();
      expect(analysisData.bayesianResult.method).toBe('bayesian');
      expect(analysisData.bayesianResult.bayesianProbability).toBeGreaterThan(0);
      expect(analysisData.bayesianResult.bayesianProbability).toBeLessThanOrEqual(1);
    });

    test('should skip Bayesian analysis when disabled', async () => {
      service.updateConfiguration({ bayesianEnabled: false });

      const analysisSpy = jest.fn();
      service.on('analysis_complete', analysisSpy);

      service.startMonitoring(mockTestMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const analysisData = analysisSpy.mock.calls[0][0];
      expect(analysisData.bayesianResult).toBeNull();
    });

    test('should calculate credible intervals', async () => {
      const analysisSpy = jest.fn();
      service.on('analysis_complete', analysisSpy);

      service.startMonitoring(mockTestMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const analysisData = analysisSpy.mock.calls[0][0];
      const credibleInterval = analysisData.bayesianResult.credibleInterval;

      expect(credibleInterval).toHaveLength(2);
      expect(credibleInterval[0]).toBeLessThan(credibleInterval[1]);
      expect(typeof credibleInterval[0]).toBe('number');
      expect(typeof credibleInterval[1]).toBe('number');
    });
  });

  describe('Power Analysis', () => {
    test('should calculate current power correctly', async () => {
      const analysisSpy = jest.fn();
      service.on('analysis_complete', analysisSpy);

      service.startMonitoring(mockTestMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const analysisData = analysisSpy.mock.calls[0][0];
      const powerAnalysis = analysisData.frequentistResult.powerAnalysis;

      expect(powerAnalysis.currentPower).toBeGreaterThanOrEqual(0);
      expect(powerAnalysis.currentPower).toBeLessThanOrEqual(1);
      expect(powerAnalysis.actualSampleSize).toBe(1000); // Control group size
      expect(powerAnalysis.requiredSampleSize).toBeGreaterThan(0);
    });

    test('should estimate time to significance', async () => {
      const analysisSpy = jest.fn();
      service.on('analysis_complete', analysisSpy);

      service.startMonitoring(mockTestMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const analysisData = analysisSpy.mock.calls[0][0];
      const powerAnalysis = analysisData.frequentistResult.powerAnalysis;

      expect(powerAnalysis.probabilityOfSuccess).toBeGreaterThanOrEqual(0);
      expect(powerAnalysis.probabilityOfSuccess).toBeLessThanOrEqual(1);
    });

    test('should handle low power scenarios', async () => {
      // Create metrics with very small sample size
      const lowPowerMetrics: TestMetrics = {
        ...mockTestMetrics,
        variations: [
          {
            _variationId: 'control',
            name: 'Control',
            visitors: 50,
            conversions: 5,
            conversionRate: 0.10
          },
          {
            _variationId: 'treatment',
            name: 'Treatment',
            visitors: 50,
            conversions: 6,
            conversionRate: 0.12
          }
        ]
      };

      const analysisSpy = jest.fn();
      service.on('analysis_complete', analysisSpy);

      service.startMonitoring(lowPowerMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const analysisData = analysisSpy.mock.calls[0][0];
      const powerAnalysis = analysisData.frequentistResult.powerAnalysis;

      expect(powerAnalysis.currentPower).toBeLessThan(0.8); // Should be underpowered
    });
  });

  describe('Anomaly Detection', () => {
    test('should detect traffic spike anomalies', async () => {
      // Create metrics that simulate a traffic spike
      const spikeMetrics: TestMetrics = {
        ...mockTestMetrics,
        variations: [
          {
            _variationId: 'control',
            name: 'Control',
            visitors: 5000, // Much higher than normal
            conversions: 500,
            conversionRate: 0.10
          },
          {
            _variationId: 'treatment',
            name: 'Treatment',
            visitors: 5000,
            conversions: 600,
            conversionRate: 0.12
          }
        ],
        totalVisitors: 10000
      };

      const analysisSpy = jest.fn();
      service.on('analysis_complete', analysisSpy);

      service.startMonitoring(spikeMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const analysisData = analysisSpy.mock.calls[0][0];
      const anomalies = analysisData.anomalies;

      // Should detect traffic spike anomaly
      const hasTrafficSpike = anomalies.anomalies.some((a: any) => a.type === 'traffic_spike');
      expect(hasTrafficSpike).toBe(true);
    });

    test('should detect unusual variance patterns', async () => {
      // Create metrics with high variance between variations
      const highVarianceMetrics: TestMetrics = {
        ...mockTestMetrics,
        variations: [
          {
            _variationId: 'control',
            name: 'Control',
            visitors: 1000,
            conversions: 50, // 5% conversion rate
            conversionRate: 0.05
          },
          {
            _variationId: 'treatment',
            name: 'Treatment',
            visitors: 1000,
            conversions: 200, // 20% conversion rate - very high variance
            conversionRate: 0.20
          }
        ]
      };

      const analysisSpy = jest.fn();
      service.on('analysis_complete', analysisSpy);

      service.startMonitoring(highVarianceMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const analysisData = analysisSpy.mock.calls[0][0];
      const anomalies = analysisData.anomalies;

      // Should detect unusual pattern due to high variance
      const hasUnusualPattern = anomalies.anomalies.some((a: any) => a.type === 'unusual_pattern');
      expect(hasUnusualPattern).toBe(true);
    });

    test('should categorize risk levels correctly', async () => {
      const analysisSpy = jest.fn();
      service.on('analysis_complete', analysisSpy);

      service.startMonitoring(mockTestMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const analysisData = analysisSpy.mock.calls[0][0];
      const anomalies = analysisData.anomalies;

      expect(['low', 'medium', 'high', 'critical']).toContain(anomalies.riskLevel);
    });

    test('should store anomaly history', async () => {
      service.startMonitoring(mockTestMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const anomalyHistory = service.getAnomalyHistory('test-001');
      expect(anomalyHistory.length).toBeGreaterThan(0);
      expect(anomalyHistory[0].testId).toBe('test-001');
    });
  });

  describe('Alert System', () => {
    test('should emit alerts for early winners', async () => {
      // Create highly significant test data
      const significantMetrics: TestMetrics = {
        ...mockTestMetrics,
        variations: [
          {
            _variationId: 'control',
            name: 'Control',
            visitors: 2000,
            conversions: 200,
            conversionRate: 0.10
          },
          {
            _variationId: 'treatment',
            name: 'Treatment',
            visitors: 2000,
            conversions: 320, // 60% improvement - highly significant
            conversionRate: 0.16
          }
        ]
      };

      const alertSpy = jest.fn();
      service.on('alert', alertSpy);

      service.startMonitoring(significantMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should emit early winner alert
      const earlyWinnerAlert = alertSpy.mock.calls.find(call =>
        call[0].alertType === 'early_winner'
      );
      expect(earlyWinnerAlert).toBeDefined();
    });

    test('should emit alerts for insufficient power', async () => {
      // Create underpowered test
      const lowPowerMetrics: TestMetrics = {
        ...mockTestMetrics,
        variations: [
          {
            _variationId: 'control',
            name: 'Control',
            visitors: 20, // Very small sample
            conversions: 2,
            conversionRate: 0.10
          },
          {
            _variationId: 'treatment',
            name: 'Treatment',
            visitors: 20,
            conversions: 2,
            conversionRate: 0.10
          }
        ]
      };

      const alertSpy = jest.fn();
      service.on('alert', alertSpy);

      service.startMonitoring(lowPowerMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should emit power insufficient alert
      const powerAlert = alertSpy.mock.calls.find(call =>
        call[0].alertType === 'power_insufficient'
      );
      expect(powerAlert).toBeDefined();
    });

    test('should emit alerts for anomalies', async () => {
      // Create metrics with traffic spike
      const anomalyMetrics: TestMetrics = {
        ...mockTestMetrics,
        variations: [
          {
            _variationId: 'control',
            name: 'Control',
            visitors: 10000, // Large traffic spike
            conversions: 1000,
            conversionRate: 0.10
          },
          {
            _variationId: 'treatment',
            name: 'Treatment',
            visitors: 10000,
            conversions: 1200,
            conversionRate: 0.12
          }
        ]
      };

      const alertSpy = jest.fn();
      service.on('alert', alertSpy);

      service.startMonitoring(anomalyMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should emit anomaly alert
      const anomalyAlert = alertSpy.mock.calls.find(call =>
        call[0].alertType === 'anomaly'
      );
      expect(anomalyAlert).toBeDefined();
    });
  });

  describe('Data Management', () => {
    test('should store and retrieve test results', async () => {
      service.startMonitoring(mockTestMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const results = service.getTestResults('test-001');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].testId).toBe('test-001');
      expect(results[0].timestamp).toBeInstanceOf(Date);
    });

    test('should handle multiple analyses for same test', async () => {
      service.startMonitoring(mockTestMetrics);

      // Trigger multiple analyses
      await service.triggerAnalysis('test-001');
      await new Promise(resolve => setTimeout(resolve, 50));
      await service.triggerAnalysis('test-001');
      await new Promise(resolve => setTimeout(resolve, 50));

      const results = service.getTestResults('test-001');
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    test('should clean up on shutdown', () => {
      service.startMonitoring(mockTestMetrics);
      expect(service.getActiveTests()).toContain('test-001');

      service.shutdown();
      expect(service.getActiveTests()).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle analysis errors gracefully', async () => {
      const errorSpy = jest.fn();
      service.on('analysis_error', errorSpy);

      // Create invalid test metrics
      const invalidMetrics: TestMetrics = {
        ...mockTestMetrics,
        variations: [mockTestMetrics.variations[0]] // Only one variation - should cause error
      };

      service.startMonitoring(invalidMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for error to be emitted
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy.mock.calls[0][0].testId).toBe('test-001');
    });

    test('should handle missing test data', async () => {
      // Try to analyze non-existent test
      await expect(service.triggerAnalysis('non-existent')).resolves.not.toThrow();
    });
  });

  describe('Recommended Actions', () => {
    test('should recommend stopping for significant results', async () => {
      const significantMetrics: TestMetrics = {
        ...mockTestMetrics,
        variations: [
          {
            _variationId: 'control',
            name: 'Control',
            visitors: 2000,
            conversions: 200,
            conversionRate: 0.10
          },
          {
            _variationId: 'treatment',
            name: 'Treatment',
            visitors: 2000,
            conversions: 300,
            conversionRate: 0.15
          }
        ]
      };

      const analysisSpy = jest.fn();
      service.on('analysis_complete', analysisSpy);

      service.startMonitoring(significantMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const analysisData = analysisSpy.mock.calls[0][0];
      expect(analysisData.recommendedAction).toBe('stop');
    });

    test('should recommend continuing for non-significant results', async () => {
      const nonSignificantMetrics: TestMetrics = {
        ...mockTestMetrics,
        variations: [
          {
            _variationId: 'control',
            name: 'Control',
            visitors: 100,
            conversions: 10,
            conversionRate: 0.10
          },
          {
            _variationId: 'treatment',
            name: 'Treatment',
            visitors: 100,
            conversions: 11,
            conversionRate: 0.11
          }
        ]
      };

      const analysisSpy = jest.fn();
      service.on('analysis_complete', analysisSpy);

      service.startMonitoring(nonSignificantMetrics);
      await service.triggerAnalysis('test-001');

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const analysisData = analysisSpy.mock.calls[0][0];
      expect(analysisData.recommendedAction).toBe('continue');
    });
  });


});

describe('Statistical Utility Functions', () => {
  let service: StatisticalMonitoringService;

  beforeAll(() => {
    service = new StatisticalMonitoringService();
  });

  afterAll(() => {
    service.shutdown();
  });

  test('should handle edge cases in statistical calculations', () => {
    // Test with zero conversions
    const zeroConversionsMetrics: TestMetrics = {
      testId: 'test-edge-case',
      variations: [
        {
          _variationId: 'control',
          name: 'Control',
          visitors: 100,
          conversions: 0,
          conversionRate: 0
        },
        {
          _variationId: 'treatment',
          name: 'Treatment',
          visitors: 100,
          conversions: 1,
          conversionRate: 0.01
        }
      ],
      startTime: new Date(),
      totalVisitors: 200,
      totalConversions: 1,
      overallConversionRate: 0.005,
      lastUpdated: new Date()
    };

    expect(() => {
      service.updateTestMetrics(zeroConversionsMetrics);
    }).not.toThrow();
  });

  test('should handle very small sample sizes', () => {
    const smallSampleMetrics: TestMetrics = {
      testId: 'test-small-sample',
      variations: [
        {
          _variationId: 'control',
          name: 'Control',
          visitors: 5,
          conversions: 1,
          conversionRate: 0.2
        },
        {
          _variationId: 'treatment',
          name: 'Treatment',
          visitors: 5,
          conversions: 2,
          conversionRate: 0.4
        }
      ],
      startTime: new Date(),
      totalVisitors: 10,
      totalConversions: 3,
      overallConversionRate: 0.3,
      lastUpdated: new Date()
    };

    expect(() => {
      service.updateTestMetrics(smallSampleMetrics);
    }).not.toThrow();
  });
});
