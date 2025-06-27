import AutonomousABTestService, {
    ABTest,
    OptimizationOpportunity,
    TestGenerationConfig,
    TestHypothesis
} from '../services/autonomous-ab-test-service';

describe('AutonomousABTestService', () => {
  let service: AutonomousABTestService;

  const mockConfig: Partial<TestGenerationConfig> = {
    enabledFeatures: {
      headlineOptimization: true,
      ctaOptimization: true,
      layoutTesting: false,
      colorTesting: true,
      imageOptimization: false,
      formOptimization: true,
      pricingTesting: true,
      socialProofTesting: false
    },
    constraints: {
      maxSimultaneousTests: 3,
      minTrafficPerVariation: 500,
      maxTestDuration: 14,
      requiredConfidenceLevel: 0.90
    },
    priorities: {
      revenueImpactWeight: 0.5,
      confidenceWeight: 0.3,
      implementationComplexityWeight: 0.1,
      psychographicInsightWeight: 0.1
    }
  };

  const mockOpportunity: OptimizationOpportunity = {
    page: '/landing',
    element: 'h1.hero-headline',
    issue: 'Low engagement on primary headline',
    severity: 'high',
    potentialImpact: 0.15,
    confidenceScore: 0.85,
    supportingData: {
      conversionRate: 0.024,
      bounceRate: 0.68,
      timeOnPage: 42,
      clickThroughRate: 0.14
    },
    psychographicInsights: {
      segmentPerformance: {
        analytical: 0.028,
        intuitive: 0.020,
        consensus: 0.025
      },
      behavioralPatterns: ['Quick exit on headline', 'Limited scroll engagement']
    }
  };

  beforeEach(() => {
    service = new AutonomousABTestService(mockConfig);
  });

  afterEach(() => {
    service.destroy();
  });

  describe('Service Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultService = new AutonomousABTestService();
      expect(defaultService).toBeInstanceOf(AutonomousABTestService);

      const analytics = defaultService.getTestAnalytics();
      expect(analytics.summary.activeTests).toBe(0);
      expect(analytics.summary.completedTests).toBe(0);

      defaultService.destroy();
    });

    test('should initialize with custom configuration', () => {
      const analytics = service.getTestAnalytics();
      expect(analytics.summary.activeTests).toBe(0);
      expect(analytics.opportunities.length).toBeGreaterThan(0);
    });

    test('should set up event listeners', (done) => {
      service.on('analysis_completed', (data) => {
        expect(data).toHaveProperty('opportunities');
        expect(data).toHaveProperty('hypotheses');
        expect(data).toHaveProperty('processingTime');
        done();
      });

      service.analyzeOptimizationOpportunities();
    });
  });

  describe('Optimization Analysis', () => {
    test('should analyze optimization opportunities', async () => {
      const opportunities = await service.analyzeOptimizationOpportunities();

      expect(Array.isArray(opportunities)).toBe(true);
      expect(opportunities.length).toBeGreaterThan(0);

      const opportunity = opportunities[0];
      expect(opportunity).toHaveProperty('page');
      expect(opportunity).toHaveProperty('element');
      expect(opportunity).toHaveProperty('severity');
      expect(opportunity).toHaveProperty('potentialImpact');
      expect(opportunity).toHaveProperty('confidenceScore');
      expect(opportunity).toHaveProperty('supportingData');
      expect(opportunity).toHaveProperty('psychographicInsights');
    });

    test('should prioritize opportunities correctly', async () => {
      const opportunities = await service.analyzeOptimizationOpportunities();

      // Check that opportunities are sorted by priority (highest first)
      for (let i = 0; i < opportunities.length - 1; i++) {
        const currentScore = opportunities[i].potentialImpact * 0.5 +
                            opportunities[i].confidenceScore * 0.3;
        const nextScore = opportunities[i + 1].potentialImpact * 0.5 +
                         opportunities[i + 1].confidenceScore * 0.3;
        expect(currentScore).toBeGreaterThanOrEqual(nextScore);
      }
    });

    test('should handle concurrent analysis requests', async () => {
      const analysisPromises = [
        service.analyzeOptimizationOpportunities(),
        service.analyzeOptimizationOpportunities(),
        service.analyzeOptimizationOpportunities()
      ];

      const results = await Promise.all(analysisPromises);

      // All should return the same result (cached during analysis)
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    });
  });

  describe('Hypothesis Generation', () => {
    test('should generate test hypothesis from opportunity', async () => {
      const hypothesis = await service.generateTestHypothesis(mockOpportunity);

      expect(hypothesis).toHaveProperty('element', mockOpportunity.element);
      expect(hypothesis).toHaveProperty('currentPerformance');
      expect(hypothesis).toHaveProperty('proposedChanges');
      expect(hypothesis).toHaveProperty('expectedImpact');
      expect(hypothesis).toHaveProperty('psychographicInsights');
      expect(hypothesis).toHaveProperty('priority');

      expect(hypothesis.currentPerformance.conversionRate).toBe(mockOpportunity.supportingData.conversionRate);
      expect(hypothesis.expectedImpact.conversionLift).toBe(mockOpportunity.potentialImpact);
      expect(hypothesis.proposedChanges.length).toBeGreaterThan(0);
    });

    test('should generate different hypotheses for different opportunity types', async () => {
      const ctaOpportunity: OptimizationOpportunity = {
        ...mockOpportunity,
        element: '.cta-button',
        issue: 'Low click-through rate on CTA button'
      };

      const headlineHypothesis = await service.generateTestHypothesis(mockOpportunity);
      const ctaHypothesis = await service.generateTestHypothesis(ctaOpportunity);

      expect(headlineHypothesis.element).toContain('headline');
      expect(ctaHypothesis.element).toContain('cta');
      expect(headlineHypothesis.proposedChanges).not.toEqual(ctaHypothesis.proposedChanges);
    });

    test('should calculate hypothesis priority correctly', async () => {
      const highImpactOpportunity: OptimizationOpportunity = {
        ...mockOpportunity,
        potentialImpact: 0.30,
        confidenceScore: 0.95,
        severity: 'critical'
      };

      const lowImpactOpportunity: OptimizationOpportunity = {
        ...mockOpportunity,
        potentialImpact: 0.05,
        confidenceScore: 0.60,
        severity: 'low'
      };

      const highHypothesis = await service.generateTestHypothesis(highImpactOpportunity);
      const lowHypothesis = await service.generateTestHypothesis(lowImpactOpportunity);

      expect(highHypothesis.priority).toBeGreaterThan(lowHypothesis.priority);
    });
  });

  describe('A/B Test Creation', () => {
    let testHypothesis: TestHypothesis;

    beforeEach(async () => {
      testHypothesis = await service.generateTestHypothesis(mockOpportunity);
    });

    test('should create A/B test from hypothesis', async () => {
      const abTest = await service.createABTestFromHypothesis(testHypothesis);

      expect(abTest).toHaveProperty('id');
      expect(abTest.name).toContain('Auto-Generated');
      expect(abTest.status).toBe('draft');
      expect(abTest.generatedBy).toBe('ai');
      expect(abTest.variations.length).toBeGreaterThanOrEqual(2);

      // Check control variation exists
      const controlVariation = abTest.variations.find(v => v.isControl);
      expect(controlVariation).toBeDefined();
      expect(controlVariation?.name).toContain('Control');

      // Check test variations exist
      const testVariations = abTest.variations.filter(v => !v.isControl);
      expect(testVariations.length).toBeGreaterThan(0);
    });

    test('should generate unique test IDs', async () => {
      const test1 = await service.createABTestFromHypothesis(testHypothesis);
      const test2 = await service.createABTestFromHypothesis(testHypothesis);

      expect(test1.id).not.toBe(test2.id);
    });

    test('should calculate traffic allocation correctly', async () => {
      const abTest = await service.createABTestFromHypothesis(testHypothesis);

      const totalTraffic = abTest.variations.reduce((sum, v) => sum + v.trafficPercentage, 0);
      expect(totalTraffic).toBeCloseTo(100, 1);

      // Check traffic allocation object
      expect(abTest.trafficAllocation.totalPercentage).toBe(100);
      expect(Object.keys(abTest.trafficAllocation.variationDistribution).length).toBe(abTest.variations.length);
    });

    test('should create appropriate success metrics', async () => {
      const abTest = await service.createABTestFromHypothesis(testHypothesis);

      expect(abTest.successMetrics.length).toBeGreaterThan(0);

      const conversionMetric = abTest.successMetrics.find(m => m.type === 'conversion');
      expect(conversionMetric).toBeDefined();

      const totalWeight = abTest.successMetrics.reduce((sum, m) => sum + m.weight, 0);
      expect(totalWeight).toBeCloseTo(1, 1);
    });

    test('should calculate minimum sample size appropriately', async () => {
      const abTest = await service.createABTestFromHypothesis(testHypothesis);

      expect(abTest.minimumSampleSize).toBeGreaterThan(0);
      expect(abTest.minimumSampleSize).toBeGreaterThanOrEqual(mockConfig.constraints!.minTrafficPerVariation!);
    });
  });

  describe('Test Deployment', () => {
    let abTest: ABTest;

    beforeEach(async () => {
      const hypothesis = await service.generateTestHypothesis(mockOpportunity);
      abTest = await service.createABTestFromHypothesis(hypothesis);
    });

    test('should deploy valid A/B test successfully', async () => {
      const result = await service.deployABTest(abTest.id);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Test deployed successfully');

      const deployedTest = service.getTestDetails(abTest.id);
      expect(deployedTest?.status).toBe('active');
      expect(deployedTest?.startedAt).toBeDefined();
    });

    test('should reject deployment of invalid test', async () => {
      // Create invalid test (no variations)
      const invalidTest = { ...abTest, variations: [] };
      (service as any).activeTests.set(invalidTest.id, invalidTest);

      const result = await service.deployABTest(invalidTest.id);

      expect(result.success).toBe(false);
      expect(result.message).toContain('must have at least 2 variations');
    });

    test('should detect conflicts with running tests', async () => {
      // Deploy first test
      await service.deployABTest(abTest.id);

      // Create conflicting test with same element
      const hypothesis = await service.generateTestHypothesis(mockOpportunity);
      const conflictingTest = await service.createABTestFromHypothesis(hypothesis);

      const result = await service.deployABTest(conflictingTest.id);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Conflicts detected');
    });

    test('should handle deployment failure gracefully', async () => {
      // Mock deployment failure
      const originalExecuteDeployment = (service as any).executeTestDeployment;
      (service as any).executeTestDeployment = jest.fn().mockRejectedValue(new Error('Deployment failed'));

      const result = await service.deployABTest(abTest.id);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Deployment failed');

      // Restore original method
      (service as any).executeTestDeployment = originalExecuteDeployment;
    });
  });

  describe('Test Monitoring', () => {
    let activeTest: ABTest;

    beforeEach(async () => {
      const hypothesis = await service.generateTestHypothesis(mockOpportunity);
      activeTest = await service.createABTestFromHypothesis(hypothesis);
      await service.deployABTest(activeTest.id);
    });

    test('should monitor active tests without errors', async () => {
      await expect(service.monitorActiveTests()).resolves.not.toThrow();
    });

    test('should calculate statistical significance', async () => {
      // Add some test data
      const test = service.getTestDetails(activeTest.id);
      if (test) {
        const control = test.variations.find(v => v.isControl);
        const variation = test.variations.find(v => !v.isControl);

        if (control && variation) {
          control.performanceMetrics.visitors = 1000;
          control.performanceMetrics.conversions = 20;
          control.performanceMetrics.conversionRate = 0.02;

          variation.performanceMetrics.visitors = 1000;
          variation.performanceMetrics.conversions = 30;
          variation.performanceMetrics.conversionRate = 0.03;
        }
      }

      const significance = await (service as any).calculateStatisticalSignificance(test);
      expect(typeof significance).toBe('number');
      expect(significance).toBeGreaterThanOrEqual(0);
      expect(significance).toBeLessThanOrEqual(1);
    });

    test('should detect early winners', async () => {
      const test = service.getTestDetails(activeTest.id);
      if (test) {
        // Set up clear winner scenario
        const control = test.variations.find(v => v.isControl);
        const variation = test.variations.find(v => !v.isControl);

        if (control && variation) {
          control.performanceMetrics.visitors = 2000;
          control.performanceMetrics.conversions = 40;
          control.performanceMetrics.conversionRate = 0.02;

          variation.performanceMetrics.visitors = 2000;
          variation.performanceMetrics.conversions = 100;
          variation.performanceMetrics.conversionRate = 0.05;
        }
      }

      const earlyWinner = await (service as any).detectEarlyWinner(test);
      expect(earlyWinner).toBeDefined();
      expect(earlyWinner?.isControl).toBe(false);
    });

    test('should detect underperforming variations', async () => {
      const test = service.getTestDetails(activeTest.id);
      if (test) {
        const control = test.variations.find(v => v.isControl);
        const variation = test.variations.find(v => !v.isControl);

        if (control && variation) {
          control.performanceMetrics.visitors = 1000;
          control.performanceMetrics.conversions = 50;
          control.performanceMetrics.conversionRate = 0.05;

          // Set variation as clearly underperforming
          variation.performanceMetrics.visitors = 1000;
          variation.performanceMetrics.conversions = 20;
          variation.performanceMetrics.conversionRate = 0.02;
        }
      }

      const underperformers = await (service as any).detectUnderperformingVariations(test);
      expect(Array.isArray(underperformers)).toBe(true);
    });
  });

  describe('Test Prioritization', () => {
    test('should prioritize tests by impact and confidence', async () => {
      const hypothesis1 = await service.generateTestHypothesis(mockOpportunity);
      const hypothesis2 = await service.generateTestHypothesis({
        ...mockOpportunity,
        potentialImpact: 0.05,
        confidenceScore: 0.60
      });

      const test1 = await service.createABTestFromHypothesis(hypothesis1);
      const test2 = await service.createABTestFromHypothesis(hypothesis2);

      const prioritizedTests = service.prioritizeTests([test2, test1]);

      expect(prioritizedTests[0].id).toBe(test1.id);
      expect(prioritizedTests[1].id).toBe(test2.id);
    });

    test('should handle empty test array', () => {
      const result = service.prioritizeTests([]);
      expect(result).toEqual([]);
    });
  });

  describe('Analytics and Reporting', () => {
    test('should provide comprehensive analytics', () => {
      const analytics = service.getTestAnalytics();

      expect(analytics).toHaveProperty('summary');
      expect(analytics).toHaveProperty('activeTests');
      expect(analytics).toHaveProperty('opportunities');
      expect(analytics).toHaveProperty('hypothesesQueue');
      expect(analytics).toHaveProperty('performance');

      expect(analytics.summary).toHaveProperty('activeTests');
      expect(analytics.summary).toHaveProperty('completedTests');
      expect(analytics.summary).toHaveProperty('totalTestsGenerated');
      expect(analytics.summary).toHaveProperty('successRate');
    });

    test('should return null for non-existent test details', () => {
      const result = service.getTestDetails('non-existent-id');
      expect(result).toBeNull();
    });

    test('should track performance metrics correctly', async () => {
      const hypothesis = await service.generateTestHypothesis(mockOpportunity);
      await service.createABTestFromHypothesis(hypothesis);

      const analytics = service.getTestAnalytics();
      expect(analytics.performance.testsGenerated).toBeGreaterThan(0);
    });
  });

  describe('Client Script Generation', () => {
    test('should generate valid JavaScript for client-side testing', async () => {
      const hypothesis = await service.generateTestHypothesis(mockOpportunity);
      const abTest = await service.createABTestFromHypothesis(hypothesis);
      await service.deployABTest(abTest.id);

      const visitorId = 'visitor_123';
      const script = service.generateTestingScript(visitorId);

      expect(typeof script).toBe('string');
      expect(script).toContain('window.OPTIMIZELY_AB_TESTS');
      expect(script).toContain(visitorId);
      expect(script).toContain('assignAndApplyTests');
      expect(script).toContain('trackTestImpression');
      expect(script).toContain('trackConversion');

      // Verify it's valid JavaScript by checking for syntax errors
      expect(() => new Function(script)).not.toThrow();
    });

    test('should include active tests in generated script', async () => {
      const hypothesis = await service.generateTestHypothesis(mockOpportunity);
      const abTest = await service.createABTestFromHypothesis(hypothesis);
      await service.deployABTest(abTest.id);

      const script = service.generateTestingScript('visitor_123');

      expect(script).toContain(abTest.id);
      expect(script).toContain('variations');
      expect(script).toContain('trafficAllocation');
    });

    test('should handle empty active tests gracefully', () => {
      const script = service.generateTestingScript('visitor_123');

      expect(script).toContain('activeTests = []');
      expect(script).not.toThrow;
    });
  });

  describe('Event Handling', () => {
    test('should emit events on test generation', (done) => {
      service.on('test_generated', (data) => {
        expect(data).toHaveProperty('test');
        expect(data).toHaveProperty('hypothesis');
        expect(data.test).toHaveProperty('id');
        done();
      });

      service.generateTestHypothesis(mockOpportunity)
        .then(hypothesis => service.createABTestFromHypothesis(hypothesis));
    });

    test('should emit events on test deployment', (done) => {
      service.on('test_deployed', (data) => {
        expect(data).toHaveProperty('testId');
        expect(data).toHaveProperty('test');
        done();
      });

      service.generateTestHypothesis(mockOpportunity)
        .then(hypothesis => service.createABTestFromHypothesis(hypothesis))
        .then(test => service.deployABTest(test.id));
    });

    test('should emit events on analysis completion', (done) => {
      service.on('analysis_completed', (data) => {
        expect(data).toHaveProperty('opportunities');
        expect(data).toHaveProperty('hypotheses');
        expect(data).toHaveProperty('processingTime');
        done();
      });

      service.analyzeOptimizationOpportunities();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing test ID in deployment', async () => {
      await expect(service.deployABTest('non-existent-id')).rejects.toThrow('Test non-existent-id not found');
    });

    test('should handle malformed opportunities gracefully', async () => {
      const malformedOpportunity = {
        ...mockOpportunity,
        supportingData: null as any
      };

      await expect(service.generateTestHypothesis(malformedOpportunity)).resolves.toBeDefined();
    });

    test('should emit monitoring errors appropriately', (done) => {
      service.on('monitoring_error', (data) => {
        expect(data).toHaveProperty('testId');
        expect(data).toHaveProperty('error');
        done();
      });

      // Mock monitoring error
      const originalCalculateSignificance = (service as any).calculateStatisticalSignificance;
      (service as any).calculateStatisticalSignificance = jest.fn().mockRejectedValue(new Error('Monitoring error'));

      service.generateTestHypothesis(mockOpportunity)
        .then(hypothesis => service.createABTestFromHypothesis(hypothesis))
        .then(test => service.deployABTest(test.id))
        .then(() => service.monitorActiveTests())
        .finally(() => {
          (service as any).calculateStatisticalSignificance = originalCalculateSignificance;
        });
    });
  });

  describe('Service Cleanup', () => {
    test('should clean up resources on destroy', () => {
      const analytics = service.getTestAnalytics();
      expect(analytics.summary.activeTests).toBeGreaterThanOrEqual(0);

      // Should not throw
      expect(() => service.destroy()).not.toThrow();
    });

    test('should clear intervals on destroy', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      service.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    test('should complete full autonomous testing workflow', async () => {
      // 1. Analyze opportunities
      const opportunities = await service.analyzeOptimizationOpportunities();
      expect(opportunities.length).toBeGreaterThan(0);

      // 2. Generate hypothesis from best opportunity
      const bestOpportunity = opportunities[0];
      const hypothesis = await service.generateTestHypothesis(bestOpportunity);
      expect(hypothesis).toBeDefined();

      // 3. Create A/B test
      const abTest = await service.createABTestFromHypothesis(hypothesis);
      expect(abTest.status).toBe('draft');

      // 4. Deploy test
      const deployResult = await service.deployABTest(abTest.id);
      expect(deployResult.success).toBe(true);

      // 5. Verify test is active
      const activeTest = service.getTestDetails(abTest.id);
      expect(activeTest?.status).toBe('active');

      // 6. Monitor test
      await service.monitorActiveTests();

      // 7. Generate client script
      const script = service.generateTestingScript('test_visitor');
      expect(script).toContain(abTest.id);

      // 8. Verify analytics
      const analytics = service.getTestAnalytics();
      expect(analytics.summary.activeTests).toBeGreaterThan(0);
    });

    test('should handle multiple concurrent tests', async () => {
      const opportunities = await service.analyzeOptimizationOpportunities();

      // Create multiple tests from different opportunities
      const testPromises = opportunities.slice(0, 2).map(async (opportunity) => {
        const hypothesis = await service.generateTestHypothesis(opportunity);
        return service.createABTestFromHypothesis(hypothesis);
      });

      const tests = await Promise.all(testPromises);
      expect(tests.length).toBe(2);
      expect(tests[0].id).not.toBe(tests[1].id);

      // Deploy all tests
      const deployPromises = tests.map(test => service.deployABTest(test.id));
      const deployResults = await Promise.all(deployPromises);

      // At least one should succeed (others may fail due to conflicts)
      const successfulDeployments = deployResults.filter(r => r.success);
      expect(successfulDeployments.length).toBeGreaterThan(0);
    });
  });
});
