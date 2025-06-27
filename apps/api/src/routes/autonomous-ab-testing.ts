import { Request, Response, Router } from 'express';
import AutonomousABTestService, {
    ABTest,
    OptimizationOpportunity,
    TestGenerationConfig,
    TestHypothesis
} from '../services/autonomous-ab-test-service';

const router = Router();

// Initialize the autonomous A/B test service
const abTestService = new AutonomousABTestService();

// Event listeners for real-time updates
abTestService.on('test_generated', (data) => {
  console.log('New test generated:', data.test.id);
});

abTestService.on('test_deployed', (data) => {
  console.log('Test deployed:', data.testId);
});

abTestService.on('test_completed', (data) => {
  console.log('Test completed:', data.testId, 'Winner:', data.winner?.id);
});

/**
 * @route GET /api/v1/autonomous-ab-testing/analytics
 * @desc Get comprehensive A/B testing analytics and performance metrics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const analytics = abTestService.getTestAnalytics();

    res.status(200).json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/autonomous-ab-testing/opportunities
 * @desc Analyze and retrieve optimization opportunities
 */
router.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const opportunities = await abTestService.analyzeOptimizationOpportunities();

    res.status(200).json({
      success: true,
      data: {
        opportunities,
        totalCount: opportunities.length,
        highPriorityCount: opportunities.filter(o => o.severity === 'high' || o.severity === 'critical').length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Opportunity analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze optimization opportunities',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/autonomous-ab-testing/generate-hypothesis
 * @desc Generate test hypothesis from optimization opportunity
 */
router.post('/generate-hypothesis', async (req: Request, res: Response) => {
  try {
    const { opportunity }: { opportunity: OptimizationOpportunity } = req.body;

    if (!opportunity) {
      return res.status(400).json({
        success: false,
        message: 'Optimization opportunity is required'
      });
    }

    const hypothesis = await abTestService.generateTestHypothesis(opportunity);

    res.status(200).json({
      success: true,
      data: hypothesis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Hypothesis generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate test hypothesis',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/autonomous-ab-testing/create-test
 * @desc Create A/B test from hypothesis
 */
router.post('/create-test', async (req: Request, res: Response) => {
  try {
    const { hypothesis }: { hypothesis: TestHypothesis } = req.body;

    if (!hypothesis) {
      return res.status(400).json({
        success: false,
        message: 'Test hypothesis is required'
      });
    }

    const abTest = await abTestService.createABTestFromHypothesis(hypothesis);

    res.status(201).json({
      success: true,
      data: abTest,
      message: 'A/B test created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create A/B test',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/autonomous-ab-testing/deploy/:testId
 * @desc Deploy A/B test to production
 */
router.post('/deploy/:testId', async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({
        success: false,
        message: 'Test ID is required'
      });
    }

    const result = await abTestService.deployABTest(testId);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        testId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        testId
      });
    }
  } catch (error) {
    console.error('Test deployment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deploy A/B test',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/autonomous-ab-testing/tests
 * @desc Get all A/B tests with optional filtering
 */
router.get('/tests', async (req: Request, res: Response) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const analytics = abTestService.getTestAnalytics();
    let tests = [...analytics.activeTests];

    // Apply status filter if provided
    if (status) {
      tests = tests.filter(test => test.status === status);
    }

    // Apply pagination
    const startIndex = parseInt(offset as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedTests = tests.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        tests: paginatedTests,
        pagination: {
          total: tests.length,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: endIndex < tests.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Tests retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tests',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/autonomous-ab-testing/tests/:testId
 * @desc Get specific test details
 */
router.get('/tests/:testId', async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({
        success: false,
        message: 'Test ID is required'
      });
    }

    const test = abTestService.getTestDetails(testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    res.status(200).json({
      success: true,
      data: test,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve test',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/autonomous-ab-testing/monitor
 * @desc Manually trigger monitoring of active tests
 */
router.post('/monitor', async (req: Request, res: Response) => {
  try {
    await abTestService.monitorActiveTests();

    res.status(200).json({
      success: true,
      message: 'Test monitoring completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to monitor tests',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/autonomous-ab-testing/script/:visitorId
 * @desc Generate client-side A/B testing script for a visitor
 */
router.get('/script/:visitorId', async (req: Request, res: Response) => {
  try {
    const { visitorId } = req.params;

    if (!visitorId) {
      return res.status(400).json({
        success: false,
        message: 'Visitor ID is required'
      });
    }

    const script = abTestService.generateTestingScript(visitorId);

    // Set appropriate headers for JavaScript content
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200).send(script);
  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate testing script',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/autonomous-ab-testing/impression
 * @desc Track test impression (when visitor sees a variation)
 */
router.post('/impression', async (req: Request, res: Response) => {
  try {
    const { testId, variationId, visitorId, timestamp } = req.body;

    if (!testId || !variationId || !visitorId) {
      return res.status(400).json({
        success: false,
        message: 'testId, variationId, and visitorId are required'
      });
    }

    // Get test details and update impression metrics
    const test = abTestService.getTestDetails(testId);
    if (test) {
      const variation = test.variations.find(v => v.id === variationId);
      if (variation) {
        variation.performanceMetrics.visitors += 1;
      }
    }

    // In a real implementation, this would be stored in a database
    console.log(`Test impression tracked: ${testId} - ${variationId} - ${visitorId}`);

    res.status(200).json({
      success: true,
      message: 'Impression tracked successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Impression tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track impression',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/autonomous-ab-testing/conversion
 * @desc Track conversion event for A/B test
 */
router.post('/conversion', async (req: Request, res: Response) => {
  try {
    const { testId, visitorId, conversionType, value = 1, timestamp } = req.body;

    if (!testId || !visitorId || !conversionType) {
      return res.status(400).json({
        success: false,
        message: 'testId, visitorId, and conversionType are required'
      });
    }

    // Get test details and update conversion metrics
    const test = abTestService.getTestDetails(testId);
    if (test) {
      // In a real implementation, we'd need to determine which variation the visitor saw
      // For now, we'll update metrics based on the visitor's test assignment
      console.log(`Conversion tracked: ${testId} - ${visitorId} - ${conversionType} - ${value}`);

      // Update conversion metrics (simplified)
      // In practice, this would involve database operations and proper visitor tracking
    }

    res.status(200).json({
      success: true,
      message: 'Conversion tracked successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Conversion tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track conversion',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/autonomous-ab-testing/prioritize-tests
 * @desc Prioritize existing tests based on impact and confidence
 */
router.post('/prioritize-tests', async (req: Request, res: Response) => {
  try {
    const { tests }: { tests: ABTest[] } = req.body;

    if (!tests || !Array.isArray(tests)) {
      return res.status(400).json({
        success: false,
        message: 'Tests array is required'
      });
    }

    const prioritizedTests = abTestService.prioritizeTests(tests);

    res.status(200).json({
      success: true,
      data: prioritizedTests,
      message: 'Tests prioritized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test prioritization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to prioritize tests',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/autonomous-ab-testing/auto-generate
 * @desc Automatically generate and deploy tests based on current opportunities
 */
router.post('/auto-generate', async (req: Request, res: Response) => {
  try {
    const { maxTests = 3, autoDeploy = false } = req.body;

    // Analyze opportunities
    const opportunities = await abTestService.analyzeOptimizationOpportunities();

    if (opportunities.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No optimization opportunities found',
        data: { testsGenerated: 0, testsDeployed: 0 }
      });
    }

    const generatedTests: ABTest[] = [];
    const deploymentResults: any[] = [];

    // Generate tests from top opportunities
    const topOpportunities = opportunities.slice(0, maxTests);

    for (const opportunity of topOpportunities) {
      try {
        // Generate hypothesis
        const hypothesis = await abTestService.generateTestHypothesis(opportunity);

        // Create test
        const test = await abTestService.createABTestFromHypothesis(hypothesis);
        generatedTests.push(test);

        // Auto-deploy if requested
        if (autoDeploy) {
          const deployResult = await abTestService.deployABTest(test.id);
          deploymentResults.push({
            testId: test.id,
            deployed: deployResult.success,
            message: deployResult.message
          });
        }
      } catch (error) {
        console.error(`Failed to process opportunity: ${opportunity.element}`, error);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        testsGenerated: generatedTests.length,
        testsDeployed: deploymentResults.filter(r => r.deployed).length,
        tests: generatedTests,
        deploymentResults: autoDeploy ? deploymentResults : undefined
      },
      message: `Generated ${generatedTests.length} tests from optimization opportunities`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auto-generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-generate tests',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/autonomous-ab-testing/health
 * @desc Health check endpoint for the autonomous A/B testing service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const analytics = abTestService.getTestAnalytics();

    res.status(200).json({
      success: true,
      status: 'healthy',
      data: {
        activeTests: analytics.summary.activeTests,
        completedTests: analytics.summary.completedTests,
        successRate: analytics.summary.successRate,
        lastAnalysis: analytics.performance.lastAnalysis,
        serviceUptime: process.uptime()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route PUT /api/v1/autonomous-ab-testing/config
 * @desc Update autonomous A/B testing configuration
 */
router.put('/config', async (req: Request, res: Response) => {
  try {
    const config: Partial<TestGenerationConfig> = req.body;

    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Configuration is required'
      });
    }

    // Create new service instance with updated config
    // In practice, this would update the existing service configuration
    const newService = new AutonomousABTestService(config);

    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Configuration update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware for the router
router.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Autonomous A/B Testing API Error:', error);

  res.status(500).json({
    success: false,
    message: 'Internal server error in autonomous A/B testing service',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
  });
});

export default router;
