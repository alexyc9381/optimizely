import { Request, Response, Router } from 'express';
import { LeadData } from '../services/ml-types';
import { RealTimePredictionService } from '../services/real-time-prediction-service';

const router = Router();
const predictionService = new RealTimePredictionService();

// Initialize the service
let serviceInitialized = false;
predictionService.initialize().then(() => {
  serviceInitialized = true;
  console.log('Real-time prediction service initialized');
}).catch((error: Error) => {
  console.error('Failed to initialize real-time prediction service:', error);
});

/**
 * Universal API middleware for platform compatibility
 */
router.use((req: Request, res: Response, next) => {
  // Add CORS headers for universal access
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Platform-ID');

  // Add platform identification
  req.headers['x-platform-id'] = req.headers['x-platform-id'] || 'unknown';

  next();
});

/**
 * POST /api/real-time-predictions/predict
 * Get real-time prediction for a lead
 */
router.post('/predict', async (req: Request, res: Response) => {
  try {
    if (!serviceInitialized) {
      return res.status(503).json({
        error: 'Prediction service not yet initialized',
        retry_after: 5
      });
    }

    const { leadData, options = {} } = req.body;

    if (!leadData) {
      return res.status(400).json({
        error: 'Missing required field: leadData',
        required_fields: ['leadData']
      });
    }

    // Validate lead data structure
    const validationError = validateLeadData(leadData);
    if (validationError) {
      return res.status(400).json({
        error: 'Invalid lead data',
        details: validationError
      });
    }

    // Add client metadata
    const enrichedOptions = {
      ...options,
      clientId: req.headers['x-client-id'] as string || generateClientId(req),
      platformId: req.headers['x-platform-id'] as string
    };

    const leadId = generateLeadId(leadData);
    const result = await predictionService.getPredictionRealTime(
      leadId,
      leadData as LeadData,
      enrichedOptions
    );

    // Universal response format
    res.json({
      success: true,
      data: {
        leadId,
        ...result,
        metadata: {
          ...result.prediction.metadata,
          platformId: enrichedOptions.platformId,
          requestId: req.headers['x-request-id'] || generateRequestId()
        }
      },
      timestamp: new Date().toISOString(),
      api_version: '1.0.0'
    });

  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal prediction service error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/real-time-predictions/batch
 * Batch prediction processing
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    if (!serviceInitialized) {
      return res.status(503).json({
        error: 'Prediction service not yet initialized',
        retry_after: 5
      });
    }

    const { requests, options = {} } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        error: 'Invalid requests array',
        details: 'Requests must be a non-empty array'
      });
    }

    // Validate batch size
    if (requests.length > 100) {
      return res.status(400).json({
        error: 'Batch size too large',
        details: 'Maximum 100 requests per batch',
        received: requests.length
      });
    }

    // Process batch requests
    const enrichedRequests = requests.map((req, index) => ({
      leadId: req.leadId || `batch_${index}_${Date.now()}`,
      leadData: req.leadData
    }));

    const result = await predictionService.batchPredict(enrichedRequests, options);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      api_version: '1.0.0'
    });

  } catch (error) {
    console.error('Batch prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Batch prediction service error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/real-time-predictions/stream/start
 * Start real-time prediction streaming
 */
router.post('/stream/start', async (req: Request, res: Response) => {
  try {
    if (!serviceInitialized) {
      return res.status(503).json({
        error: 'Prediction service not yet initialized',
        retry_after: 5
      });
    }

    const { leadId, clientId, options = {} } = req.body;

    if (!leadId || !clientId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required_fields: ['leadId', 'clientId']
      });
    }

    await predictionService.startPredictionStream(leadId, clientId, options);

    res.json({
      success: true,
      data: {
        streamId: clientId,
        leadId,
        websocket_url: `ws://localhost:8081/predictions/${clientId}`,
        status: 'streaming_started'
      },
      timestamp: new Date().toISOString(),
      api_version: '1.0.0'
    });

  } catch (error) {
    console.error('Stream start error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start prediction stream',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/real-time-predictions/model/feedback
 * Submit feedback for incremental learning
 */
router.post('/model/feedback', async (req: Request, res: Response) => {
  try {
    if (!serviceInitialized) {
      return res.status(503).json({
        error: 'Prediction service not yet initialized',
        retry_after: 5
      });
    }

    const { feedback, options = {} } = req.body;

    if (!Array.isArray(feedback) || feedback.length === 0) {
      return res.status(400).json({
        error: 'Invalid feedback array',
        details: 'Feedback must be a non-empty array'
      });
    }

    const result = await predictionService.updateModelIncremental(feedback, options);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      api_version: '1.0.0'
    });

  } catch (error) {
    console.error('Model feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process model feedback',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/real-time-predictions/status
 * Get service status and health
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const api = predictionService.getUniversalAPIInterface();
    const status = api.getStatus();
    const metrics = api.getMetrics();

    res.json({
      success: true,
      data: {
        service: {
          initialized: serviceInitialized,
          ...status
        },
        metrics,
        endpoints: {
          predict: '/api/real-time-predictions/predict',
          batch: '/api/real-time-predictions/batch',
          stream: '/api/real-time-predictions/stream/start',
          feedback: '/api/real-time-predictions/model/feedback',
          status: '/api/real-time-predictions/status'
        }
      },
      timestamp: new Date().toISOString(),
      api_version: '1.0.0'
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service status',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/real-time-predictions/health
 * Health check endpoint for load balancers
 */
router.get('/health', (req: Request, res: Response) => {
  const health = {
    status: serviceInitialized ? 'healthy' : 'initializing',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };

  const statusCode = serviceInitialized ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * GET /api/real-time-predictions/docs
 * API documentation endpoint
 */
router.get('/docs', (req: Request, res: Response) => {
  const docs = {
    title: 'Real-Time Prediction API',
    version: '1.0.0',
    description: 'Universal API for AI revenue prediction with real-time streaming',
    endpoints: {
      predict: {
        method: 'POST',
        path: '/api/real-time-predictions/predict',
        description: 'Get real-time prediction for a lead',
        body: {
          leadData: 'LeadData object (required)',
          options: 'Prediction options (optional)'
        }
      },
      batch: {
        method: 'POST',
        path: '/api/real-time-predictions/batch',
        description: 'Process multiple predictions in batch',
        body: {
          requests: 'Array of prediction requests (required)',
          options: 'Batch processing options (optional)'
        }
      },
      stream: {
        method: 'POST',
        path: '/api/real-time-predictions/stream/start',
        description: 'Start real-time prediction streaming',
        body: {
          leadId: 'Lead identifier (required)',
          clientId: 'Client identifier (required)',
          options: 'Streaming options (optional)'
        }
      },
      feedback: {
        method: 'POST',
        path: '/api/real-time-predictions/model/feedback',
        description: 'Submit feedback for incremental learning',
        body: {
          feedback: 'Array of feedback objects (required)',
          options: 'Learning options (optional)'
        }
      }
    },
    websocket: {
      url: 'ws://localhost:8081/predictions/{clientId}',
      description: 'WebSocket endpoint for real-time updates'
    },
    examples: {
      leadData: {
        firmographic: {
          companySize: 'enterprise',
          industry: 'saas',
          revenue: 50000000,
          employees: 500,
          techStack: ['React', 'Node.js', 'PostgreSQL'],
          companyMaturity: 'growth',
          geolocation: {
            country: 'US',
            region: 'California',
            timezone: 'PST'
          }
        },
        behavioral: {
          sessionCount: 15,
          avgSessionDuration: 450,
          pageViewsPerSession: 8.5,
          contentEngagement: {
            documentsDownloaded: 3,
            videosWatched: 2,
            formsCompleted: 1,
            pricingPageViews: 5,
            featurePageViews: 12
          },
          technicalDepth: {
            integrationDocsViewed: true,
            apiDocsViewed: true,
            technicalResourcesAccessed: 8
          },
          timeOnSite: 3600,
          returnVisitorPattern: 'frequent'
        },
        intent: {
          searchKeywords: ['revenue prediction', 'ml scoring', 'lead scoring'],
          competitorResearch: true,
          buyingStageSignals: {
            awareness: 0.8,
            consideration: 0.9,
            decision: 0.7,
            purchase: 0.3
          },
          contentTopicsEngaged: ['pricing', 'features', 'integrations'],
          urgencyIndicators: {
            fastTrackRequests: false,
            demoRequests: 2,
            contactFormSubmissions: 1,
            salesInquiries: 1
          },
          socialProof: {
            testimonialViews: 3,
            caseStudyDownloads: 2,
            customerSuccessStories: 4
          }
        },
        timing: {
          dayOfWeek: 2,
          hourOfDay: 14,
          monthOfYear: 6,
          quarterOfYear: 2,
          seasonality: 'high',
          recentActivity: true,
          engagementVelocity: 5.2,
          lastVisitDays: 1,
          accountAge: 45
        }
      }
    }
  };

  res.json(docs);
});

// Helper functions
function validateLeadData(leadData: any): string | null {
  if (!leadData.firmographic) return 'Missing firmographic data';
  if (!leadData.behavioral) return 'Missing behavioral data';
  if (!leadData.intent) return 'Missing intent data';
  if (!leadData.timing) return 'Missing timing data';

  // Validate firmographic fields
  if (!leadData.firmographic.companySize) return 'Missing companySize in firmographic data';
  if (!leadData.firmographic.industry) return 'Missing industry in firmographic data';

  return null;
}

function generateClientId(req: Request): string {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const timestamp = Date.now();

  return Buffer.from(`${ip}_${userAgent}_${timestamp}`)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 16);
}

function generateLeadId(leadData: any): string {
  const key = `${leadData.firmographic.industry}_${leadData.firmographic.companySize}_${leadData.behavioral.sessionCount}`;
  return Buffer.from(key).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export default router;
