import express from 'express';
import { ABTestConfig, IndustryModelService, IndustryType, ModelTrainingConfig } from '../services/industry-model-service';

const router = express.Router();
const industryModelService = new IndustryModelService();

// Industry Classification Endpoints

/**
 * @route POST /api/v1/industry-models/classify
 * @desc Classify company industry based on provided data
 * @access Public
 */
router.post('/classify', async (req, res) => {
  try {
    const companyData = req.body;

    if (!companyData || Object.keys(companyData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Company data is required for classification'
      });
    }

    const classification = await industryModelService.classifyIndustry(companyData);

    res.json({
      success: true,
      data: classification,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to classify industry',
      timestamp: new Date().toISOString()
    });
  }
});

// Model Training Endpoints

/**
 * @route POST /api/v1/industry-models/train
 * @desc Train a new industry-specific model
 * @access Public
 */
router.post('/train', async (req, res) => {
  try {
    const config: ModelTrainingConfig = req.body;

    // Validate required fields
    if (!config.industryType) {
      return res.status(400).json({
        success: false,
        error: 'Industry type is required'
      });
    }

    if (!config.algorithmType) {
      return res.status(400).json({
        success: false,
        error: 'Algorithm type is required'
      });
    }

    // Validate industry type
    const validIndustries: IndustryType[] = [
      'saas', 'consulting', 'manufacturing', 'fintech', 'healthcare',
      'ecommerce', 'education', 'real_estate', 'automotive', 'energy',
      'media', 'nonprofit', 'government', 'retail', 'construction',
      'agriculture', 'transportation', 'hospitality', 'legal', 'insurance'
    ];

    if (!validIndustries.includes(config.industryType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid industry type. Supported industries: ${validIndustries.join(', ')}`
      });
    }

    const model = await industryModelService.trainIndustryModel(config);

    res.status(201).json({
      success: true,
      data: model,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to train model',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/industry-models/models
 * @desc Get all models or filter by industry
 * @access Public
 */
router.get('/models', async (req, res) => {
  try {
    const { industryType } = req.query;

    if (industryType && typeof industryType !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Industry type must be a string'
      });
    }

    const models = await industryModelService.getAllModels(industryType as IndustryType);

    res.json({
      success: true,
      data: models,
      count: models.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve models',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/industry-models/models/:modelId
 * @desc Get specific model details
 * @access Public
 */
router.get('/models/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    const model = await industryModelService.getModel(modelId);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    res.json({
      success: true,
      data: model,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve model',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/industry-models/models/:modelId/deploy
 * @desc Deploy a model with specified traffic allocation
 * @access Public
 */
router.post('/models/:modelId/deploy', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { trafficAllocation = 100 } = req.body;

    if (typeof trafficAllocation !== 'number' || trafficAllocation < 0 || trafficAllocation > 100) {
      return res.status(400).json({
        success: false,
        error: 'Traffic allocation must be a number between 0 and 100'
      });
    }

    await industryModelService.deployModel(modelId, trafficAllocation);

    res.json({
      success: true,
      message: 'Model deployed successfully',
      modelId,
      trafficAllocation,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to deploy model',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/industry-models/models/:modelId/retire
 * @desc Retire a model (stop serving traffic)
 * @access Public
 */
router.post('/models/:modelId/retire', async (req, res) => {
  try {
    const { modelId } = req.params;

    await industryModelService.retireModel(modelId);

    res.json({
      success: true,
      message: 'Model retired successfully',
      modelId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retire model',
      timestamp: new Date().toISOString()
    });
  }
});

// A/B Testing Endpoints

/**
 * @route POST /api/v1/industry-models/ab-tests
 * @desc Create a new A/B test configuration
 * @access Public
 */
router.post('/ab-tests', async (req, res) => {
  try {
    const config: ABTestConfig = req.body;

    // Validate required fields
    if (!config.testId || !config.name || !config.variants || config.variants.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Test ID, name, and at least 2 variants are required'
      });
    }

    // Validate traffic allocation
    const totalAllocation = config.variants.reduce((sum, variant) => sum + variant.trafficAllocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        error: 'Variant traffic allocations must sum to 100%'
      });
    }

    const abTest = await industryModelService.createABTest(config);

    res.status(201).json({
      success: true,
      data: abTest,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create A/B test',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/industry-models/ab-tests
 * @desc Get all A/B tests
 * @access Public
 */
router.get('/ab-tests', async (req, res) => {
  try {
    const abTests = await industryModelService.getAllABTests();

    res.json({
      success: true,
      data: abTests,
      count: abTests.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve A/B tests',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/industry-models/ab-tests/:testId
 * @desc Get specific A/B test details
 * @access Public
 */
router.get('/ab-tests/:testId', async (req, res) => {
  try {
    const { testId } = req.params;

    const abTest = await industryModelService.getABTest(testId);

    if (!abTest) {
      return res.status(404).json({
        success: false,
        error: 'A/B test not found'
      });
    }

    res.json({
      success: true,
      data: abTest,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve A/B test',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/industry-models/ab-tests/:testId/start
 * @desc Start an A/B test
 * @access Public
 */
router.post('/ab-tests/:testId/start', async (req, res) => {
  try {
    const { testId } = req.params;

    await industryModelService.startABTest(testId);

    res.json({
      success: true,
      message: 'A/B test started successfully',
      testId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start A/B test',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/industry-models/ab-tests/:testId/complete
 * @desc Complete an A/B test and get results
 * @access Public
 */
router.post('/ab-tests/:testId/complete', async (req, res) => {
  try {
    const { testId } = req.params;

    const completedTest = await industryModelService.completeABTest(testId);

    res.json({
      success: true,
      data: completedTest,
      message: 'A/B test completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete A/B test',
      timestamp: new Date().toISOString()
    });
  }
});

// Prediction Endpoints

/**
 * @route POST /api/v1/industry-models/predict
 * @desc Generate industry-specific prediction for lead data
 * @access Public
 */
router.post('/predict', async (req, res) => {
  try {
    const leadData = req.body;

    if (!leadData || Object.keys(leadData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lead data is required for prediction'
      });
    }

    // Validate lead data structure
    if (!leadData.firmographic && !leadData.behavioral && !leadData.intent && !leadData.timing) {
      return res.status(400).json({
        success: false,
        error: 'Lead data must contain at least one of: firmographic, behavioral, intent, or timing data'
      });
    }

    const prediction = await industryModelService.generateIndustryPrediction(leadData);

    res.json({
      success: true,
      data: prediction,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate prediction',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/industry-models/predict/batch
 * @desc Generate predictions for multiple leads
 * @access Public
 */
router.post('/predict/batch', async (req, res) => {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array of leads is required'
      });
    }

    if (leads.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 leads allowed per batch request'
      });
    }

    const predictions = await Promise.all(
      leads.map(async (leadData, index) => {
        try {
          const prediction = await industryModelService.generateIndustryPrediction(leadData);
          return { index, success: true, data: prediction };
        } catch (error: any) {
          return { index, success: false, error: error.message };
        }
      })
    );

    const successful = predictions.filter(p => p.success);
    const failed = predictions.filter(p => !p.success);

    res.json({
      success: true,
      data: {
        predictions: successful,
        errors: failed,
        summary: {
          total: leads.length,
          successful: successful.length,
          failed: failed.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate batch predictions',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/industry-models/predict/ml-format
 * @desc Convert prediction to ML format for downstream processing
 * @access Public
 */
router.post('/predict/ml-format', async (req, res) => {
  try {
    const leadData = req.body;

    if (!leadData || Object.keys(leadData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lead data is required for prediction'
      });
    }

    const prediction = await industryModelService.generateIndustryPrediction(leadData);
    const mlFormat = industryModelService.toMLFormat(prediction);

    res.json({
      success: true,
      data: mlFormat,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate ML format prediction',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/industry-models/predict/batch-ml-format
 * @desc Convert batch predictions to ML format
 * @access Public
 */
router.post('/predict/batch-ml-format', async (req, res) => {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array of leads is required'
      });
    }

    if (leads.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 leads allowed per batch request'
      });
    }

    const mlPredictions = await Promise.all(
      leads.map(async (leadData, index) => {
        try {
          const prediction = await industryModelService.generateIndustryPrediction(leadData);
          const mlFormat = industryModelService.toMLFormat(prediction);
          return { index, success: true, data: mlFormat };
        } catch (error: any) {
          return { index, success: false, error: error.message };
        }
      })
    );

    const successful = mlPredictions.filter(p => p.success);
    const failed = mlPredictions.filter(p => !p.success);

    res.json({
      success: true,
      data: {
        predictions: successful.map(p => p.data),
        errors: failed,
        summary: {
          total: leads.length,
          successful: successful.length,
          failed: failed.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate batch ML format predictions',
      timestamp: new Date().toISOString()
    });
  }
});

// Analytics and Insights Endpoints

/**
 * @route GET /api/v1/industry-models/analytics
 * @desc Get analytics and insights about industry models
 * @access Public
 */
router.get('/analytics', async (req, res) => {
  try {
    const models = await industryModelService.getAllModels();
    const abTests = await industryModelService.getAllABTests();

    // Calculate analytics
    const analytics = {
      modelStatistics: {
        total: models.length,
        byIndustry: models.reduce((acc, model) => {
          acc[model.industryType] = (acc[model.industryType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byStatus: models.reduce((acc, model) => {
          acc[model.deployment.status] = (acc[model.deployment.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        averageAccuracy: models.reduce((sum, model) => sum + model.performance.accuracy, 0) / models.length,
        bestPerforming: models.sort((a, b) => b.performance.accuracy - a.performance.accuracy).slice(0, 5)
      },
      abTestStatistics: {
        total: abTests.length,
        byStatus: abTests.reduce((acc, test) => {
          acc[test.status] = (acc[test.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        completedTests: abTests.filter(test => test.status === 'completed').length,
        runningTests: abTests.filter(test => test.status === 'running').length
      },
      performanceMetrics: {
        modelAccuracy: {
          min: Math.min(...models.map(m => m.performance.accuracy)),
          max: Math.max(...models.map(m => m.performance.accuracy)),
          average: models.reduce((sum, m) => sum + m.performance.accuracy, 0) / models.length
        },
        industryBreakdown: models.reduce((acc, model) => {
          if (!acc[model.industryType]) {
            acc[model.industryType] = {
              count: 0,
              averageAccuracy: 0,
              deployedModels: 0
            };
          }
          acc[model.industryType].count++;
          acc[model.industryType].averageAccuracy += model.performance.accuracy;
          if (model.deployment.status === 'deployed') {
            acc[model.industryType].deployedModels++;
          }
          return acc;
        }, {} as Record<string, any>)
      }
    };

    // Calculate average accuracy for each industry
    Object.keys(analytics.performanceMetrics.industryBreakdown).forEach(industry => {
      const breakdown = analytics.performanceMetrics.industryBreakdown[industry];
      breakdown.averageAccuracy = breakdown.averageAccuracy / breakdown.count;
    });

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate analytics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/industry-models/industries
 * @desc Get list of supported industries with their feature configurations
 * @access Public
 */
router.get('/industries', async (req, res) => {
  try {
    const supportedIndustries: IndustryType[] = [
      'saas', 'consulting', 'manufacturing', 'fintech', 'healthcare',
      'ecommerce', 'education', 'real_estate', 'automotive', 'energy',
      'media', 'nonprofit', 'government', 'retail', 'construction',
      'agriculture', 'transportation', 'hospitality', 'legal', 'insurance'
    ];

    const industryInfo = supportedIndustries.map(industry => ({
      type: industry,
      displayName: industry.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Specialized model for ${industry} industry`,
      characteristics: getIndustryCharacteristics(industry)
    }));

    res.json({
      success: true,
      data: industryInfo,
      count: industryInfo.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve industry information',
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function for industry characteristics
function getIndustryCharacteristics(industry: IndustryType): string[] {
  const characteristics: Record<IndustryType, string[]> = {
    'saas': ['High digital engagement', 'Subscription model', 'Technical decision makers'],
    'consulting': ['Relationship-driven', 'Longer sales cycles', 'Expertise-focused'],
    'manufacturing': ['Asset-heavy', 'ROI-focused', 'Complex procurement'],
    'fintech': ['Regulation-sensitive', 'Security-focused', 'Innovation-driven'],
    'healthcare': ['Compliance-critical', 'Evidence-based', 'Long implementation'],
    'ecommerce': ['Volume-driven', 'Price-sensitive', 'Quick decisions'],
    'education': ['Budget-constrained', 'Outcome-focused', 'Stakeholder approval'],
    'real_estate': ['Market-dependent', 'Location-specific', 'Commission-based'],
    'automotive': ['Brand-loyal', 'Feature-driven', 'Seasonal patterns'],
    'energy': ['Capital-intensive', 'Regulatory-heavy', 'Long-term contracts'],
    'media': ['Content-focused', 'Audience-driven', 'Trend-sensitive'],
    'nonprofit': ['Mission-driven', 'Donor-dependent', 'Impact-measured'],
    'government': ['Process-heavy', 'Compliance-focused', 'Budget-cyclical'],
    'retail': ['Margin-sensitive', 'Inventory-focused', 'Customer-centric'],
    'construction': ['Project-based', 'Weather-dependent', 'Equipment-heavy'],
    'agriculture': ['Seasonal-driven', 'Weather-sensitive', 'Commodity-based'],
    'transportation': ['Route-optimized', 'Fuel-sensitive', 'Regulatory-compliance'],
    'hospitality': ['Experience-focused', 'Seasonal-patterns', 'Service-oriented'],
    'legal': ['Billable-hour-focused', 'Expertise-premium', 'Confidentiality-critical'],
    'insurance': ['Risk-assessment-driven', 'Actuarial-based', 'Claims-focused']
  };

  return characteristics[industry] || ['Industry-specific characteristics'];
}

// Service Management Endpoints

/**
 * @route GET /api/v1/industry-models/health
 * @desc Get service health status
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const health = industryModelService.getServiceHealth();

    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check service health',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/industry-models/clear-data
 * @desc Clear all model and test data (development only)
 * @access Public
 */
router.post('/clear-data', async (req, res) => {
  try {
    await industryModelService.clearData();

    res.json({
      success: true,
      message: 'All data cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear data',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware for this router
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Industry Models API Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error in industry models service',
    timestamp: new Date().toISOString()
  });
});

export default router;
