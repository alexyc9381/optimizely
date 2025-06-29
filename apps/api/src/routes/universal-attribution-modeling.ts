import express from 'express';
import rateLimit from 'express-rate-limit';
import { redisManager } from '../services/redis-client';
import UniversalAttributionModelingService from '../services/universal-attribution-modeling-service';

const router = express.Router();

// Initialize service
const service = new UniversalAttributionModelingService(redisManager.getClient());

// Rate limiting
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP'
}) as any;

const strictLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many requests for this endpoint'
}) as any;

// Track touchpoint
router.post('/touchpoints', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const touchPointData = req.body;
    const touchPointId = await service.trackTouchPoint(touchPointData);
    
    res.status(201).json({
      success: true,
      data: { touchPointId },
      message: 'Touchpoint tracked successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get touchpoint
router.get('/touchpoints/:id', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const touchPoint = await service.getTouchPoint(req.params.id);
    
    if (!touchPoint) {
      return res.status(404).json({
        success: false,
        error: 'Touchpoint not found'
      });
    }
    
    res.json({
      success: true,
      data: touchPoint
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user touchpoints
router.get('/users/:userId/touchpoints', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, channel, limit } = req.query;
    
    const options: any = {};
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);
    if (channel) options.channel = channel as string;
    if (limit) options.limit = parseInt(limit as string);
    
    const touchPoints = await service.getTouchPointsByUser(userId, options);
    
    res.json({
      success: true,
      data: touchPoints,
      count: touchPoints.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get customer journey
router.get('/journeys/:journeyId', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const journey = await service.getCustomerJourney(req.params.journeyId);
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        error: 'Journey not found'
      });
    }
    
    res.json({
      success: true,
      data: journey
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user journeys
router.get('/users/:userId/journeys', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, limit } = req.query;
    
    const options: any = {};
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);
    if (limit) options.limit = parseInt(limit as string);
    
    const journeys = await service.getCustomerJourneys(userId, options);
    
    res.json({
      success: true,
      data: journeys,
      count: journeys.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Track conversion
router.post('/conversions', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const conversionData = req.body;
    const conversionId = await service.trackConversion(conversionData);
    
    res.status(201).json({
      success: true,
      data: { conversionId },
      message: 'Conversion tracked successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create attribution model
router.post('/models', strictLimit, async (req: express.Request, res: express.Response) => {
  try {
    const modelData = req.body;
    const modelId = await service.createAttributionModel(modelData);
    
    res.status(201).json({
      success: true,
      data: { modelId },
      message: 'Attribution model created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get attribution model
router.get('/models/:modelId', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const model = await service.getAttributionModel(req.params.modelId);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Attribution model not found'
      });
    }
    
    res.json({
      success: true,
      data: model
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all attribution models
router.get('/models', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const models = await service.getAttributionModels();
    
    res.json({
      success: true,
      data: models,
      count: models.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get attribution report
router.get('/reports/:conversionId', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const report = await service.getAttributionReport(req.params.conversionId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Attribution report not found'
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user attribution reports
router.get('/users/:userId/reports', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, limit } = req.query;
    
    const options: any = {};
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);
    if (limit) options.limit = parseInt(limit as string);
    
    const reports = await service.getAttributionReports(userId, options);
    
    res.json({
      success: true,
      data: reports,
      count: reports.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get device graph
router.get('/users/:userId/device-graph', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const deviceGraph = await service.getDeviceGraph(req.params.userId);
    
    if (!deviceGraph) {
      return res.status(404).json({
        success: false,
        error: 'Device graph not found'
      });
    }
    
    res.json({
      success: true,
      data: deviceGraph
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get attribution insights
router.get('/insights', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate, models } = req.query;
    
    const options: any = {};
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);
    if (models) options.models = (models as string).split(',');
    
    const insights = await service.getAttributionInsights(options);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const health = await service.getHealthStatus();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

export default router;
