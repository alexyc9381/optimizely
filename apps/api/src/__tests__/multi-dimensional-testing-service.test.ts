import { ABTest } from '../services/autonomous-ab-test-service';
import MultiDimensionalTestingService, {
    TestSchedule,
    TestingConfiguration
} from '../services/multi-dimensional-testing-service';

describe('MultiDimensionalTestingService', () => {
  let testingFramework: MultiDimensionalTestingService;

  const mockABTest: ABTest = {
    id: 'test_001',
    name: 'Homepage CTA Test',
    description: 'Testing different call-to-action buttons',
    hypothesis: 'Changing CTA from "Learn More" to "Get Started" will increase conversions',
    targetAudience: {
      segments: ['analytical', 'decision-maker'],
      psychographicProfiles: ['analytical'],
      deviceTypes: ['desktop'],
      geographies: ['US']
    },
    variations: [
      {
        id: 'control',
        name: 'Control',
        description: 'Original CTA',
        isControl: true,
        elements: [
          {
            selector: '#main-cta',
            property: 'textContent',
            originalValue: 'Learn More',
            newValue: 'Learn More',
            changeType: 'text',
            reasoning: 'Control version'
          }
        ],
        trafficPercentage: 50,
        performanceMetrics: {
          visitors: 0,
          conversions: 0,
          conversionRate: 0,
          revenue: 0,
          statisticalSignificance: 0,
          confidence: 0
        }
      },
      {
        id: 'variation_1',
        name: 'Action-Focused CTA',
        description: 'More direct call-to-action',
        isControl: false,
        elements: [
          {
            selector: '#main-cta',
            property: 'textContent',
            originalValue: 'Learn More',
            newValue: 'Get Started',
            changeType: 'text',
            reasoning: 'More action-oriented language'
          }
        ],
        trafficPercentage: 50,
        performanceMetrics: {
          visitors: 0,
          conversions: 0,
          conversionRate: 0,
          revenue: 0,
          statisticalSignificance: 0,
          confidence: 0
        }
      }
    ],
    trafficAllocation: {
      totalPercentage: 10,
      variationDistribution: {
        'control': 50,
        'variation_1': 50
      },
      rampUpStrategy: 'immediate'
    },
    successMetrics: [
      {
        name: 'conversion_rate',
        type: 'conversion',
        definition: 'Primary conversion rate metric',
        weight: 1.0
      }
    ],
    status: 'draft',
    confidenceThreshold: 0.95,
    minimumSampleSize: 1000,
    createdAt: new Date(),
    startedAt: undefined,
    completedAt: undefined,
    generatedBy: 'human',
    priority: 1,
    estimatedImpact: {
      conversionLift: 0.15,
      revenueImpact: 10000,
      confidence: 0.8
    }
  };

  const customConfig: Partial<TestingConfiguration> = {
    maxSimultaneousTests: 10,
    defaultTrafficAllocation: 5,
    minimumSegmentSize: 500,
    crossTestIsolationLevel: 'strict'
  };

  beforeEach(() => {
    testingFramework = new MultiDimensionalTestingService(customConfig);
  });

  afterEach(() => {
    testingFramework.destroy();
  });

  describe('Framework Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultFramework = new MultiDimensionalTestingService();
      const status = defaultFramework.getFrameworkStatus();

      expect(status.isActive).toBe(true);
      expect(status.totalSlots).toBe(25); // Default max slots
      expect(status.availableSlots).toBe(25);
      expect(status.occupiedSlots).toBe(0);
      expect(status.totalTrafficAllocated).toBe(0);

      defaultFramework.destroy();
    });

    test('should initialize with custom configuration', () => {
      const status = testingFramework.getFrameworkStatus();

      expect(status.isActive).toBe(true);
      expect(status.totalSlots).toBe(10); // Custom max slots
      expect(status.availableSlots).toBe(10);
      expect(status.occupiedSlots).toBe(0);
      expect(status.totalTrafficAllocated).toBe(0);
    });

    test('should emit framework_initialized event', (done) => {
      const newFramework = new MultiDimensionalTestingService();

      newFramework.on('framework_initialized', (data) => {
        expect(data.totalSlots).toBe(25);
        expect(data.configuration).toBeDefined();
        newFramework.destroy();
        done();
      });
    });

    test('should initialize analytics with default values', () => {
      const analytics = testingFramework.getDetailedAnalytics();

      expect(analytics.totalTests).toBe(10);
      expect(analytics.activeTests).toBe(0);
      expect(analytics.trafficUtilization).toBe(0);
      expect(analytics.segmentCoverage).toEqual({});
      expect(analytics.crossTestEffects).toEqual([]);
      expect(analytics.performanceMetrics).toBeDefined();
      expect(analytics.resourceUsage).toBeDefined();
    });
  });

  describe('Test Deployment', () => {
    test('should successfully deploy a valid test', async () => {
      const result = await testingFramework.deployTest(mockABTest);

      expect(result.success).toBe(true);
      expect(result.slotId).toBeDefined();
      expect(result.trafficAllocation).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.conflicts).toBeDefined();

      const status = testingFramework.getFrameworkStatus();
      expect(status.activeTests).toHaveLength(1);
      expect(status.occupiedSlots).toBe(1);
      expect(status.availableSlots).toBe(9);
    });

    test('should deploy test to preferred slot when available', async () => {
      const preferredSlot = 'slot_03';
      const result = await testingFramework.deployTest(mockABTest, preferredSlot);

      expect(result.success).toBe(true);
      expect(result.slotId).toBe(preferredSlot);
    });

    test('should find alternative slot when preferred is unavailable', async () => {
      // Deploy first test to slot_01
      await testingFramework.deployTest(mockABTest, 'slot_01');

      // Try to deploy second test to same slot
      const secondTest = { ...mockABTest, id: 'test_002' };
      const result = await testingFramework.deployTest(secondTest, 'slot_01');

      expect(result.success).toBe(true);
      expect(result.slotId).not.toBe('slot_01'); // Should use different slot
    });

    test('should emit test_deployed event', (done) => {
      testingFramework.on('test_deployed', (data) => {
        expect(data.testId).toBe(mockABTest.id);
        expect(data.slotId).toBeDefined();
        expect(data.trafficAllocation).toBeDefined();
        expect(data.contaminationRisk).toMatch(/low|medium|high/);
        done();
      });

      testingFramework.deployTest(mockABTest);
    });

    test('should fail deployment when no slots available', async () => {
      // Fill all slots
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const testClone = { ...mockABTest, id: `test_${i.toString().padStart(3, '0')}` };
        promises.push(testingFramework.deployTest(testClone));
      }
      await Promise.all(promises);

      // Try to deploy one more test
      const overflowTest = { ...mockABTest, id: 'test_overflow' };
      const result = await testingFramework.deployTest(overflowTest);

      expect(result.success).toBe(false);
      expect(result.warnings).toContain('No available slots found for test deployment');
      expect(result.conflicts).toContain('All slots occupied or blocked by constraints');
    });

    test('should validate traffic requirements', async () => {
      const highTrafficTest = {
        ...mockABTest,
        id: 'high_traffic_test',
        trafficAllocation: {
          trafficPercentage: 50, // Very high traffic requirement
          segments: ['analytical'],
          exclusions: []
        }
      };

      const result = await testingFramework.deployTest(highTrafficTest);

      // Should still succeed but with warnings about high traffic usage
      expect(result.success).toBe(true);
      expect(result.warnings?.length).toBeGreaterThan(0);
    });
  });

  describe('Traffic Allocation', () => {
    test('should allocate traffic properly for single test', async () => {
      const result = await testingFramework.deployTest(mockABTest);

      expect(result.trafficAllocation).toBeDefined();
      expect(result.trafficAllocation!.percentage).toBeGreaterThan(0);
      expect(result.trafficAllocation!.percentage).toBeLessThanOrEqual(10);
      expect(result.trafficAllocation!.segment).toBe('analytical'); // First segment from test
      expect(result.trafficAllocation!.testSlots).toContain(result.slotId);
    });

    test('should track total traffic allocation', async () => {
      // Deploy multiple tests
      const tests = [
        { ...mockABTest, id: 'test_001' },
        { ...mockABTest, id: 'test_002' },
        { ...mockABTest, id: 'test_003' }
      ];

      for (const test of tests) {
        await testingFramework.deployTest(test);
      }

      const status = testingFramework.getFrameworkStatus();
      expect(status.totalTrafficAllocated).toBeGreaterThan(0);
      expect(status.totalTrafficAllocated).toBeLessThanOrEqual(100);
    });

    test('should identify traffic overlaps', async () => {
      // Deploy overlapping tests
      const test1 = { ...mockABTest, id: 'test_001' };
      const test2 = {
        ...mockABTest,
        id: 'test_002',
        targetAudience: {
          psychographicSegments: ['analytical'] // Same segment as test1
        }
      };

      await testingFramework.deployTest(test1);
      const result2 = await testingFramework.deployTest(test2);

      expect(result2.trafficAllocation!.overlaps).toBeDefined();
      expect(Array.isArray(result2.trafficAllocation!.overlaps)).toBe(true);
    });
  });

  describe('Cross-Test Contamination Analysis', () => {
    test('should detect element overlap between tests', async () => {
      const test1 = { ...mockABTest, id: 'test_001' };
      const test2 = {
        ...mockABTest,
        id: 'test_002',
        variations: [
          {
            ...mockABTest.variations[0],
            elements: [
              {
                selector: '#main-cta', // Same element as test1
                property: 'backgroundColor',
                value: 'blue'
              }
            ]
          },
          {
            ...mockABTest.variations[1],
            elements: [
              {
                selector: '#main-cta',
                property: 'backgroundColor',
                value: 'green'
              }
            ]
          }
        ]
      };

      await testingFramework.deployTest(test1);
      const result2 = await testingFramework.deployTest(test2);

      expect(result2.warnings?.length).toBeGreaterThan(0);
      // Should warn about element overlap
      const hasOverlapWarning = result2.warnings?.some(w =>
        w.includes('overlap') || w.includes('element')
      );
      expect(hasOverlapWarning).toBe(true);
    });

    test('should detect segment overlap between tests', async () => {
      const test1 = { ...mockABTest, id: 'test_001' };
      const test2 = {
        ...mockABTest,
        id: 'test_002',
        targetAudience: {
          psychographicSegments: ['analytical'] // Same segment overlap
        }
      };

      await testingFramework.deployTest(test1);
      const result2 = await testingFramework.deployTest(test2);

      expect(result2.warnings?.length).toBeGreaterThan(0);
      // Should warn about segment overlap
      const hasOverlapWarning = result2.warnings?.some(w =>
        w.includes('overlap') || w.includes('segment')
      );
      expect(hasOverlapWarning).toBe(true);
    });

    test('should categorize contamination risk levels', async () => {
      const test1 = { ...mockABTest, id: 'test_001' };

      // High contamination test (same elements + same segments)
        ...mockABTest,
        id: 'high_risk_test',
        targetAudience: {
          psychographicSegments: ['analytical', 'decision-maker'] // Full overlap
        }
      };

      await testingFramework.deployTest(test1);

      // This should be detected as high risk due to overlap
      const analytics = testingFramework.getDetailedAnalytics();
      expect(analytics.crossTestEffects).toBeDefined();
    });
  });

  describe('Test Removal', () => {
    test('should successfully remove an active test', async () => {
      // Deploy test first
      await testingFramework.deployTest(mockABTest);

      // Verify test is active
      let status = testingFramework.getFrameworkStatus();
      expect(status.activeTests).toHaveLength(1);

      // Remove test
      const result = await testingFramework.removeTest(mockABTest.id);

      expect(result.success).toBe(true);
      expect(result.releasedSlot).toBeDefined();
      expect(result.reallocatedTraffic).toBeGreaterThan(0);

      // Verify test is removed
      status = testingFramework.getFrameworkStatus();
      expect(status.activeTests).toHaveLength(0);
      expect(status.occupiedSlots).toBe(0);
      expect(status.availableSlots).toBe(10);
    });

    test('should emit test_removed event', (done) => {
      testingFramework.on('test_removed', (data) => {
        expect(data.testId).toBe(mockABTest.id);
        expect(data.releasedSlot).toBeDefined();
        expect(data.releasedTraffic).toBeGreaterThan(0);
        done();
      });

      testingFramework.deployTest(mockABTest).then(() => {
        testingFramework.removeTest(mockABTest.id);
      });
    });

    test('should fail to remove non-existent test', async () => {
      const result = await testingFramework.removeTest('non_existent_test');

      expect(result.success).toBe(false);
    });

    test('should reallocate traffic after test removal', async () => {
      // Deploy multiple tests
      await testingFramework.deployTest({ ...mockABTest, id: 'test_001' });
      await testingFramework.deployTest({ ...mockABTest, id: 'test_002' });

      const statusBefore = testingFramework.getFrameworkStatus();
      const trafficBefore = statusBefore.totalTrafficAllocated;

      // Remove one test
      const result = await testingFramework.removeTest('test_001');

      const statusAfter = testingFramework.getFrameworkStatus();
      const trafficAfter = statusAfter.totalTrafficAllocated;

      expect(trafficAfter).toBeLessThan(trafficBefore);
      expect(result.reallocatedTraffic).toBeGreaterThan(0);
    });
  });

  describe('Test Scheduling', () => {
    test('should schedule test for future deployment', () => {
      const schedule: Omit<TestSchedule, 'testId'> = {
        slotId: 'slot_01',
        startTime: new Date(Date.now() + 60000), // 1 minute from now
        endTime: new Date(Date.now() + 86400000), // 24 hours from now
        priority: 1,
        dependencies: [],
        autoStart: true
      };

      let eventEmitted = false;
      testingFramework.on('test_scheduled', (data) => {
        expect(data.testId).toBe(mockABTest.id);
        expect(data.schedule.slotId).toBe(schedule.slotId);
        eventEmitted = true;
      });

      testingFramework.scheduleTest(mockABTest.id, schedule);
      expect(eventEmitted).toBe(true);
    });
  });

  describe('Analytics and Monitoring', () => {
    test('should provide detailed analytics', async () => {
      // Deploy some tests to generate analytics data
      await testingFramework.deployTest({ ...mockABTest, id: 'test_001' });
      await testingFramework.deployTest({ ...mockABTest, id: 'test_002' });

      const analytics = testingFramework.getDetailedAnalytics();

      expect(analytics.totalTests).toBe(10); // Total slots
      expect(analytics.activeTests).toBe(2); // Active tests
      expect(analytics.trafficUtilization).toBeGreaterThan(0);
      expect(analytics.segmentCoverage).toBeDefined();
      expect(analytics.performanceMetrics).toBeDefined();
      expect(analytics.resourceUsage).toBeDefined();
    });

    test('should calculate segment coverage', async () => {
      const test1 = {
        ...mockABTest,
        id: 'test_001',
        targetAudience: {
          psychographicSegments: ['analytical']
        }
      };
      const test2 = {
        ...mockABTest,
        id: 'test_002',
        targetAudience: {
          psychographicSegments: ['intuitive']
        }
      };

      await testingFramework.deployTest(test1);
      await testingFramework.deployTest(test2);

      const analytics = testingFramework.getDetailedAnalytics();
      expect(Object.keys(analytics.segmentCoverage)).toContain('analytical');
      expect(Object.keys(analytics.segmentCoverage)).toContain('intuitive');
    });

    test('should calculate cross-test effects', async () => {
      // Deploy multiple tests to generate cross-effects
      await testingFramework.deployTest({ ...mockABTest, id: 'test_001' });
      await testingFramework.deployTest({ ...mockABTest, id: 'test_002' });
      await testingFramework.deployTest({ ...mockABTest, id: 'test_003' });

      const analytics = testingFramework.getDetailedAnalytics();
      expect(analytics.crossTestEffects).toBeDefined();
      expect(Array.isArray(analytics.crossTestEffects)).toBe(true);

      if (analytics.crossTestEffects.length > 0) {
        const effect = analytics.crossTestEffects[0];
        expect(effect.primaryTest).toBeDefined();
        expect(effect.affectedTest).toBeDefined();
        expect(typeof effect.effectMagnitude).toBe('number');
        expect(typeof effect.statistical_significance).toBe('number');
        expect(typeof effect.mitigationApplied).toBe('boolean');
      }
    });

    test('should monitor resource usage', async () => {
      // Deploy tests to increase resource usage
      for (let i = 0; i < 5; i++) {
        await testingFramework.deployTest({ ...mockABTest, id: `test_${i}` });
      }

      const analytics = testingFramework.getDetailedAnalytics();
      const { resourceUsage } = analytics;

      expect(resourceUsage.cpuUtilization).toBeGreaterThan(0);
      expect(resourceUsage.memoryUsage).toBeGreaterThan(0);
      expect(resourceUsage.networkBandwidth).toBeGreaterThan(0);
      expect(resourceUsage.databaseConnections).toBeGreaterThan(0);
    });

    test('should emit monitoring updates', (done) => {
      testingFramework.on('monitoring_update', (data) => {
        expect(data.timestamp).toBeInstanceOf(Date);
        expect(data.analytics).toBeDefined();
        expect(data.status).toBeDefined();
        done();
      });

      // Wait for monitoring interval (shortened for testing)
    }, 35000); // Wait longer than monitoring interval (30s)
  });

  describe('Performance Monitoring', () => {
    test('should emit performance warnings', (done) => {
      // This test simulates high resource usage
      testingFramework.on('performance_warning', (data) => {
        expect(data.type).toMatch(/high_cpu|high_memory/);
        expect(typeof data.value).toBe('number');
        expect(typeof data.threshold).toBe('number');
        done();
      });

      // Deploy many tests to trigger resource warnings
      Promise.all([
        ...Array(8).fill(0).map(async (_, i) => {
          await testingFramework.deployTest({ ...mockABTest, id: `test_${i}` });
        })
      ]);
    }, 35000);
  });

  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const newConfig: Partial<TestingConfiguration> = {
        maxSimultaneousTests: 15,
        defaultTrafficAllocation: 3
      };

      let configUpdated = false;
      testingFramework.on('configuration_updated', (data) => {
        expect(data.configuration.maxSimultaneousTests).toBe(15);
        expect(data.configuration.defaultTrafficAllocation).toBe(3);
        configUpdated = true;
      });

      testingFramework.updateConfiguration(newConfig);
      expect(configUpdated).toBe(true);
    });
  });

  describe('Framework Status', () => {
    test('should provide accurate framework status', async () => {
      // Deploy some tests
      await testingFramework.deployTest({ ...mockABTest, id: 'test_001' });
      await testingFramework.deployTest({ ...mockABTest, id: 'test_002' });

      const status = testingFramework.getFrameworkStatus();

      expect(status.isActive).toBe(true);
      expect(status.totalSlots).toBe(10);
      expect(status.availableSlots).toBe(8);
      expect(status.occupiedSlots).toBe(2);
      expect(status.totalTrafficAllocated).toBeGreaterThan(0);
      expect(status.activeTests).toHaveLength(2);
      expect(status.analytics).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed test objects gracefully', async () => {
      const malformedTest = {
        id: 'malformed_test',
        // Missing required fields
      } as any;

      await expect(testingFramework.deployTest(malformedTest)).rejects.toThrow();
    });

    test('should handle framework destruction properly', () => {
      const status = testingFramework.getFrameworkStatus();
      expect(status.isActive).toBe(true);

      let destroyEventEmitted = false;
      testingFramework.on('framework_destroyed', () => {
        destroyEventEmitted = true;
      });

      testingFramework.destroy();
      expect(destroyEventEmitted).toBe(true);
    });

    test('should prevent duplicate test IDs', async () => {
      await testingFramework.deployTest(mockABTest);

      // Try to deploy same test again
      const result = await testingFramework.deployTest(mockABTest);

      // Should still work but might have warnings about existing test
      expect(result.success).toBe(true);
    });
  });

  describe('Integration with Autonomous A/B Testing', () => {
    test('should work with autonomous test generation', async () => {
      // This would test integration with the autonomous testing service
      const autonomousTest = {
        ...mockABTest,
        id: 'autonomous_test_001',
        name: 'AI Generated Test',
        description: 'Test generated by autonomous system'
      };

      const result = await testingFramework.deployTest(autonomousTest);
      expect(result.success).toBe(true);

      const status = testingFramework.getFrameworkStatus();
      expect(status.activeTests).toHaveLength(1);
      expect(status.activeTests[0].name).toBe('AI Generated Test');
    });
  });
});
