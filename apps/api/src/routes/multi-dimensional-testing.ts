import { Request, Response, Router } from 'express';
import { ABTest } from '../services/autonomous-ab-test-service';
import MultiDimensionalTestingService, {
    TestSlot
} from '../services/multi-dimensional-testing-service';

const router = Router();

// Initialize the multi-dimensional testing service
const testingFramework = new MultiDimensionalTestingService();

// Event listeners for real-time updates
testingFramework.on('framework_initialized', (data) => {
  console.log('Testing framework initialized:', data.totalSlots, 'slots created');
});

testingFramework.on('test_deployed', (data) => {
  console.log('Test deployed:', data.testId, 'to slot:', data.slotId);
});

testingFramework.on('test_removed', (data) => {
  console.log('Test removed:', data.testId, 'released slot:', data.releasedSlot);
});

testingFramework.on('performance_warning', (data) => {
  console.warn('Performance warning:', data.type, data.value, 'threshold:', data.threshold);
});

/**
 * @route GET /framework/status
 * @desc Get current framework status and overview
 * @access Public
 */
router.get('/framework/status', async (req: Request, res: Response) => {
  try {
    const status = testingFramework.getFrameworkStatus();

    res.json({
      success: true,
      data: status,
      timestamp: new Date()
    });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route GET /framework/analytics
 * @desc Get detailed analytics for all active tests
 * @access Public
 */
router.get('/framework/analytics', async (req: Request, res: Response) => {
  try {
    const analytics = testingFramework.getDetailedAnalytics();

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date()
    });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route POST /deploy
 * @desc Deploy a test to the framework
 * @access Public
 */
router.post('/deploy', async (req: Request, res: Response) => {
  try {
    const { test, preferredSlot } = req.body;

    if (!test || !test.id) {
      return res.status(400).json({
        success: false,
        error: 'Valid test object with ID is required'
      });
    }

    const result = await testingFramework.deployTest(test as ABTest, preferredSlot);

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: `Test ${test.id} deployed successfully to slot ${result._slotId}`
      });
    } else {
      res.status(400).json({
        success: false,
        data: result,
        error: 'Failed to deploy test'
      });
    }
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route DELETE /remove/:testId
 * @desc Remove a test from the framework
 * @access Public
 */
router.delete('/remove/:testId', async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;

    const result = await testingFramework.removeTest(testId);

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: `Test ${testId} removed successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Test ${testId} not found in framework`
      });
    }
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route GET /slots
 * @desc Get all test slots with their current status
 * @access Public
 */
router.get('/slots', async (req: Request, res: Response) => {
  try {
    const status = testingFramework.getFrameworkStatus();
    const slots: TestSlot[] = [];

    // Extract slot information from the framework status
    // Note: This is a simplified representation since the slots are private
    // In a real implementation, you'd add a public method to get slots
    for (let i = 1; i <= status.totalSlots; i++) {
      const slotId = `slot_${i.toString().padStart(2, '0')}`;
      const isOccupied = i <= status.occupiedSlots;

      slots.push({
        id: slotId,
        name: `Test Slot ${i}`,
        priority: i <= 5 ? 1 : i <= 15 ? 2 : 3,
        allocatedTraffic: 4,
        status: isOccupied ? 'occupied' : 'available',
        constraints: {
          maxDuration: 30 * 24 * 60 * 60 * 1000,
          minTrafficPercent: 2,
          maxTrafficPercent: 10,
          allowedSegments: ['all'],
          blockedElements: [],
          exclusionRules: []
        },
        createdAt: new Date()
      });
    }

    res.json({
      success: true,
      data: {
        slots,
        summary: {
          total: status.totalSlots,
          available: status.availableSlots,
          occupied: status.occupiedSlots
        }
      }
    });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route GET /traffic-allocation
 * @desc Get current traffic allocation across all tests
 * @access Public
 */
router.get('/traffic-allocation', async (req: Request, res: Response) => {
  try {
    const status = testingFramework.getFrameworkStatus();
    const analytics = testingFramework.getDetailedAnalytics();

    res.json({
      success: true,
      data: {
        totalAllocated: status.totalTrafficAllocated,
        available: 100 - status.totalTrafficAllocated,
        segmentCoverage: analytics.segmentCoverage,
        utilizationPercentage: analytics.trafficUtilization,
        recommendations: generateTrafficRecommendations(status.totalTrafficAllocated)
      }
    });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route POST /schedule
 * @desc Schedule a test for future deployment
 * @access Public
 */
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const { testId, schedule } = req.body;

    if (!testId || !schedule) {
      return res.status(400).json({
        success: false,
        error: 'Test ID and schedule are required'
      });
    }

    const { slotId, startTime, endTime, priority, dependencies, autoStart } = schedule;

    if (!slotId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'slotId, startTime, and endTime are required'
      });
    }

    const testSchedule = {
      _slotId: slotId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      priority: priority || 1,
      dependencies: dependencies || [],
      autoStart: autoStart !== false
    };

    testingFramework.scheduleTest(testId, testSchedule);

    res.json({
      success: true,
      message: `Test ${testId} scheduled successfully`,
      data: { testId, schedule: testSchedule }
    });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route GET /cross-test-effects
 * @desc Get analysis of cross-test contamination and effects
 * @access Public
 */
router.get('/cross-test-effects', async (req: Request, res: Response) => {
  try {
    const analytics = testingFramework.getDetailedAnalytics();
    const crossTestEffects = analytics.crossTestEffects;

    // Categorize effects by severity
    const severe = crossTestEffects.filter(effect => effect.effectMagnitude > 0.05);
    const moderate = crossTestEffects.filter(effect => effect.effectMagnitude > 0.02 && effect.effectMagnitude <= 0.05);
    const mild = crossTestEffects.filter(effect => effect.effectMagnitude <= 0.02);

    res.json({
      success: true,
      data: {
        total: crossTestEffects.length,
        categorized: {
          severe: { count: severe.length, effects: severe },
          moderate: { count: moderate.length, effects: moderate },
          mild: { count: mild.length, effects: mild }
        },
        summary: {
          averageEffect: crossTestEffects.reduce((sum, e) => sum + e.effectMagnitude, 0) / crossTestEffects.length || 0,
          mitigatedCount: crossTestEffects.filter(e => e.mitigationApplied).length,
          recommendations: generateContaminationRecommendations(crossTestEffects)
        }
      }
    });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route GET /performance-metrics
 * @desc Get framework performance and resource usage metrics
 * @access Public
 */
router.get('/performance-metrics', async (req: Request, res: Response) => {
  try {
    const analytics = testingFramework.getDetailedAnalytics();
    const { performanceMetrics, resourceUsage } = analytics;

    res.json({
      success: true,
      data: {
        performance: performanceMetrics,
        resources: resourceUsage,
        status: determineFrameworkHealth(resourceUsage),
        alerts: generatePerformanceAlerts(resourceUsage)
      }
    });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route PUT /configuration
 * @desc Update framework configuration
 * @access Public
 */
router.put('/configuration', async (req: Request, res: Response) => {
  try {
    const { configuration } = req.body;

    if (!configuration) {
      return res.status(400).json({
        success: false,
        error: 'Configuration object is required'
      });
    }

    testingFramework.updateConfiguration(configuration);

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: { updatedFields: Object.keys(configuration) }
    });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route GET /simulation
 * @desc Simulate test deployment scenarios
 * @access Public
 */
router.get('/simulation', async (req: Request, res: Response) => {
  try {
    const { testCount = 5, trafficPerTest = 4 } = req.query;

    const status = testingFramework.getFrameworkStatus();
    const totalTraffic = Number(testCount) * Number(trafficPerTest);
    const availableSlots = status.availableSlots;

    const simulation = {
      scenario: {
        testsToAdd: Number(testCount),
        trafficPerTest: Number(trafficPerTest),
        totalTrafficRequired: totalTraffic
      },
      feasibility: {
        canAccommodate: availableSlots >= Number(testCount) && totalTraffic <= (100 - status.totalTrafficAllocated),
        availableSlots,
        availableTraffic: 100 - status.totalTrafficAllocated,
        utilizationAfter: status.totalTrafficAllocated + totalTraffic
      },
      recommendations: generateSimulationRecommendations(
        Number(testCount),
        Number(trafficPerTest),
        availableSlots,
        100 - status.totalTrafficAllocated
      )
    };

    res.json({
      success: true,
      data: simulation
    });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * @route POST /bulk-deploy
 * @desc Deploy multiple tests simultaneously
 * @access Public
 */
router.post('/bulk-deploy', async (req: Request, res: Response) => {
  try {
    const { tests } = req.body;

    if (!Array.isArray(tests) || tests.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array of tests is required'
      });
    }

    const results = [];

    for (const test of tests) {
      try {
        const result = await testingFramework.deployTest(test);
        results.push({
          testId: test.id,
          success: result.success,
          slotId: result._slotId,
          warnings: result.warnings || []
        });
      } catch (testError: unknown) {
        results.push({
          testId: test.id,
          success: false,
          error: testError instanceof Error ? testError.message : 'Unknown deployment error'
        });
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: failed.length === 0,
      data: {
        deployed: successful.length,
        failed: failed.length,
        results
      },
      message: `Bulk deployment completed: ${successful.length}/${tests.length} tests deployed`
    });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Helper functions
function generateTrafficRecommendations(currentAllocation: number): string[] {
  const recommendations = [];

  if (currentAllocation > 80) {
    recommendations.push('High traffic utilization - consider consolidating or removing underperforming tests');
  } else if (currentAllocation < 20) {
    recommendations.push('Low traffic utilization - opportunity to run more tests');
  }

  if (currentAllocation > 90) {
    recommendations.push('Critical: Traffic allocation near maximum - new tests may be blocked');
  }

  return recommendations;
}

function generateContaminationRecommendations(effects: any[]): string[] {
  const recommendations = [];
  const severeEffects = effects.filter(e => e.effectMagnitude > 0.05);

  if (severeEffects.length > 0) {
    recommendations.push('Severe cross-test contamination detected - consider test isolation');
  }

  if (effects.length > 10) {
    recommendations.push('High number of cross-test effects - review test element conflicts');
  }

  return recommendations;
}

function determineFrameworkHealth(resourceUsage: any): 'healthy' | 'warning' | 'critical' {
  const maxUsage = Math.max(
    resourceUsage.cpuUtilization,
    resourceUsage.memoryUsage,
    resourceUsage.networkBandwidth
  );

  if (maxUsage > 90) return 'critical';
  if (maxUsage > 70) return 'warning';
  return 'healthy';
}

function generatePerformanceAlerts(resourceUsage: any): string[] {
  const alerts = [];

  if (resourceUsage.cpuUtilization > 80) {
    alerts.push(`High CPU utilization: ${resourceUsage.cpuUtilization}%`);
  }

  if (resourceUsage.memoryUsage > 80) {
    alerts.push(`High memory usage: ${resourceUsage.memoryUsage}%`);
  }

  if (resourceUsage.databaseConnections > 50) {
    alerts.push(`High database connection count: ${resourceUsage.databaseConnections}`);
  }

  return alerts;
}

function generateSimulationRecommendations(
  testCount: number,
  trafficPerTest: number,
  availableSlots: number,
  availableTraffic: number
): string[] {
  const recommendations = [];

  if (testCount > availableSlots) {
    recommendations.push(`Reduce test count to ${availableSlots} or remove existing tests`);
  }

  const totalTraffic = testCount * trafficPerTest;
  if (totalTraffic > availableTraffic) {
    const maxTrafficPerTest = Math.floor(availableTraffic / testCount);
    recommendations.push(`Reduce traffic per test to ${maxTrafficPerTest}% or fewer total tests`);
  }

  if (totalTraffic > 60) {
    recommendations.push('High traffic allocation may impact test sensitivity');
  }

  return recommendations;
}

export default router;
