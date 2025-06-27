import MultiDimensionalTestingService from '../services/multi-dimensional-testing-service';

describe('MultiDimensionalTestingService - Core Functionality', () => {
  let testingFramework: MultiDimensionalTestingService;

  beforeEach(() => {
    testingFramework = new MultiDimensionalTestingService({
      maxSimultaneousTests: 5,
      defaultTrafficAllocation: 10
    });
  });

  afterEach(() => {
    testingFramework.destroy();
  });

  describe('Framework Initialization', () => {
    test('should initialize with correct configuration', () => {
      const status = testingFramework.getFrameworkStatus();

      expect(status.isActive).toBe(true);
      expect(status.totalSlots).toBe(5);
      expect(status.availableSlots).toBe(5);
      expect(status.occupiedSlots).toBe(0);
      expect(status.totalTrafficAllocated).toBe(0);
      expect(status.activeTests).toHaveLength(0);
    });

    test('should provide detailed analytics', () => {
      const analytics = testingFramework.getDetailedAnalytics();

      expect(analytics.totalTests).toBe(5);
      expect(analytics.activeTests).toBe(0);
      expect(analytics.trafficUtilization).toBe(0);
      expect(analytics.segmentCoverage).toEqual({});
      expect(analytics.crossTestEffects).toEqual([]);
      expect(analytics.performanceMetrics).toBeDefined();
      expect(analytics.resourceUsage).toBeDefined();
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration', () => {
      let configUpdated = false;
      testingFramework.on('configuration_updated', (data) => {
        expect(data.configuration.maxSimultaneousTests).toBe(10);
        configUpdated = true;
      });

      testingFramework.updateConfiguration({
        maxSimultaneousTests: 10
      });

      expect(configUpdated).toBe(true);
    });
  });

  describe('Event Handling', () => {
    test('should emit framework_initialized event', (done) => {
      const newFramework = new MultiDimensionalTestingService();

      newFramework.on('framework_initialized', (data) => {
        expect(data.totalSlots).toBe(25);
        expect(data.configuration).toBeDefined();
        newFramework.destroy();
        done();
      });
    });

    test('should emit monitoring updates', (done) => {
      testingFramework.on('monitoring_update', (data) => {
        expect(data.timestamp).toBeInstanceOf(Date);
        expect(data.analytics).toBeDefined();
        expect(data.status).toBeDefined();
        done();
      });
    }, 35000);
  });

  describe('Framework Destruction', () => {
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
  });

  describe('Test Scheduling', () => {
    test('should schedule test for future deployment', () => {
      const schedule = {
        slotId: 'slot_01',
        startTime: new Date(Date.now() + 60000),
        endTime: new Date(Date.now() + 86400000),
        priority: 1,
        dependencies: [],
        autoStart: true
      };

      let eventEmitted = false;
      testingFramework.on('test_scheduled', (data) => {
        expect(data.testId).toBe('test_001');
        expect(data.schedule.slotId).toBe(schedule.slotId);
        eventEmitted = true;
      });

      testingFramework.scheduleTest('test_001', schedule);
      expect(eventEmitted).toBe(true);
    });
  });

  describe('Analytics Calculation', () => {
    test('should calculate resource usage properly', () => {
      const analytics = testingFramework.getDetailedAnalytics();
      const { resourceUsage } = analytics;

      expect(typeof resourceUsage.cpuUtilization).toBe('number');
      expect(typeof resourceUsage.memoryUsage).toBe('number');
      expect(typeof resourceUsage.networkBandwidth).toBe('number');
      expect(typeof resourceUsage.databaseConnections).toBe('number');

      expect(resourceUsage.cpuUtilization).toBeGreaterThanOrEqual(0);
      expect(resourceUsage.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(resourceUsage.networkBandwidth).toBeGreaterThanOrEqual(0);
      expect(resourceUsage.databaseConnections).toBeGreaterThanOrEqual(0);
    });

    test('should provide performance metrics', () => {
      const analytics = testingFramework.getDetailedAnalytics();
      const { performanceMetrics } = analytics;

      expect(typeof performanceMetrics.averageConversionLift).toBe('number');
      expect(typeof performanceMetrics.cumulativeRevenue).toBe('number');
      expect(typeof performanceMetrics.testSuccessRate).toBe('number');
      expect(typeof performanceMetrics.averageTestDuration).toBe('number');
      expect(typeof performanceMetrics.significanceAchievementRate).toBe('number');
    });
  });

  describe('Framework State Management', () => {
    test('should track framework state correctly', () => {
      // Initial state
      let status = testingFramework.getFrameworkStatus();
      expect(status.totalSlots).toBe(5);
      expect(status.availableSlots).toBe(5);
      expect(status.occupiedSlots).toBe(0);

      // Framework should be initialized
      expect(status.isActive).toBe(true);
      expect(status.analytics).toBeDefined();
    });

    test('should maintain consistent analytics', () => {
      const analytics1 = testingFramework.getDetailedAnalytics();
      const analytics2 = testingFramework.getDetailedAnalytics();

      // Basic structure should be consistent
      expect(analytics1.totalTests).toBe(analytics2.totalTests);
      expect(analytics1.activeTests).toBe(analytics2.activeTests);
      expect(analytics1.trafficUtilization).toBe(analytics2.trafficUtilization);
    });
  });

  describe('Edge Cases', () => {
    test('should handle multiple configuration updates', () => {
      let updateCount = 0;
      testingFramework.on('configuration_updated', () => {
        updateCount++;
      });

      testingFramework.updateConfiguration({ maxSimultaneousTests: 10 });
      testingFramework.updateConfiguration({ defaultTrafficAllocation: 5 });
      testingFramework.updateConfiguration({ crossTestIsolationLevel: 'strict' });

      expect(updateCount).toBe(3);
    });

    test('should handle rapid framework creation and destruction', () => {
      const frameworks = [];

      // Create multiple frameworks
      for (let i = 0; i < 3; i++) {
        frameworks.push(new MultiDimensionalTestingService({
          maxSimultaneousTests: 2
        }));
      }

      // All should be active
      frameworks.forEach(framework => {
        const status = framework.getFrameworkStatus();
        expect(status.isActive).toBe(true);
        expect(status.totalSlots).toBe(2);
      });

      // Destroy all
      frameworks.forEach(framework => {
        framework.destroy();
      });

      // Test completed without errors
      expect(frameworks.length).toBe(3);
    });
  });
});
