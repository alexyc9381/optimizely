import express, { Request, Response } from 'express';
import { mlScoringService } from '../services/ml-scoring-service';
import { LeadData } from '../services/ml-types';

const router = express.Router();

/**
 * POST /api/v1/ml/score
 * Score a single lead using the ML models
 */
router.post('/score', async (req: Request, res: Response) => {
  try {
    const { leadData }: { leadData: LeadData } = req.body;

    if (!leadData) {
      return res.status(400).json({
        error: 'Lead data is required',
        code: 'MISSING_LEAD_DATA'
      });
    }

    const result = await mlScoringService.scoreLead(leadData);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('ML Scoring Error:', error);
    res.status(500).json({
      error: 'Internal server error during scoring',
      code: 'SCORING_ERROR'
    });
  }
});

/**
 * POST /api/v1/ml/batch-score
 * Score multiple leads in batch
 */
router.post('/batch-score', async (req: Request, res: Response) => {
  try {
    const { leads }: { leads: LeadData[] } = req.body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({
        error: 'Array of leads is required',
        code: 'MISSING_LEADS_ARRAY'
      });
    }

    if (leads.length > 100) {
      return res.status(400).json({
        error: 'Batch size cannot exceed 100 leads',
        code: 'BATCH_SIZE_EXCEEDED'
      });
    }

    const results = await mlScoringService.scoreLeads(leads);

    res.json({
      success: true,
      data: {
        results,
        count: results.length,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Batch ML Scoring Error:', error);
    res.status(500).json({
      error: 'Internal server error during batch scoring',
      code: 'BATCH_SCORING_ERROR'
    });
  }
});

/**
 * GET /api/v1/ml/model-info
 * Get information about the current ML model
 */
router.get('/model-info', (req: Request, res: Response) => {
  try {
    const modelInfo = mlScoringService.getModelInfo();

    res.json({
      success: true,
      data: modelInfo
    });

  } catch (error) {
    console.error('Model Info Error:', error);
    res.status(500).json({
      error: 'Internal server error retrieving model info',
      code: 'MODEL_INFO_ERROR'
    });
  }
});

/**
 * POST /api/v1/ml/initialize
 * Initialize or reinitialize the ML service
 */
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    const { trainingData } = req.body;

    await mlScoringService.initialize(trainingData);

    res.json({
      success: true,
      message: 'ML service initialized successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('ML Initialization Error:', error);
    res.status(500).json({
      error: 'Failed to initialize ML service',
      code: 'INITIALIZATION_ERROR'
    });
  }
});

/**
 * GET /api/v1/ml/health
 * Health check for ML service
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    const modelInfo = mlScoringService.getModelInfo();

    const health = {
      status: modelInfo.isInitialized ? 'healthy' : 'not_initialized',
      initialized: modelInfo.isInitialized,
      modelVersion: modelInfo.modelVersion,
      lastUpdated: modelInfo.lastUpdated,
      timestamp: new Date().toISOString()
    };

    const statusCode = modelInfo.isInitialized ? 200 : 503;

    res.status(statusCode).json({
      success: modelInfo.isInitialized,
      data: health
    });

  } catch (error) {
    console.error('ML Health Check Error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      code: 'HEALTH_CHECK_ERROR'
    });
  }
});

export default router;
