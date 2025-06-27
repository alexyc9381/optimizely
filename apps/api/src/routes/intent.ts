/**
 * Intent Signal Detection API Routes
 * Universal API endpoints for intent detection and analysis
 */

import { Request, Response, Router } from 'express';
import type {
    IntentSignal,
    ThirdPartyIntentData
} from '../services/intent-detection-service';
import { intentDetectionService } from '../services/intent-detection-service';

const router = Router();

// =============================================================================
// CONTENT ANALYSIS APIs
// =============================================================================

/**
 * POST /api/v1/intent/analyze-content
 * Analyze content for intent signals using NLP and keyword detection
 */
router.post('/analyze-content', async (req: Request, res: Response) => {
  try {
    const { userId, content, context = {} } = req.body;

    if (!userId || !content) {
      return res.status(400).json({
        error: 'userId and content are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const signals = await intentDetectionService.detectIntentFromContent(
      userId,
      content,
      {
        url: context.url,
        platform: context.platform || 'web',
        sessionId: context.sessionId
      }
    );

    res.json({
      success: true,
      data: {
        signals,
        signalCount: signals.length,
        analysis: {
          contentLength: content.length,
          processingTime: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Intent content analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze content for intent signals',
      code: 'ANALYSIS_FAILED'
    });
  }
});

// =============================================================================
// BEHAVIORAL TRACKING APIs
// =============================================================================

/**
 * POST /api/v1/intent/track-behavior
 * Track and analyze user behavior for intent signals
 */
router.post('/track-behavior', async (req: Request, res: Response) => {
  try {
    const { userId, behavior, context = {} } = req.body;

    if (!userId || !behavior) {
      return res.status(400).json({
        error: 'userId and behavior are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const signals = await intentDetectionService.detectIntentFromBehavior(
      userId,
      behavior,
      {
        sessionId: context.sessionId,
        platform: context.platform || 'web'
      }
    );

    res.json({
      success: true,
      data: {
        signals,
        signalCount: signals.length,
        behavior: {
          action: behavior.action,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Intent behavior tracking error:', error);
    res.status(500).json({
      error: 'Failed to track behavior for intent signals',
      code: 'TRACKING_FAILED'
    });
  }
});

// =============================================================================
// THIRD-PARTY INTEGRATION APIs
// =============================================================================

/**
 * POST /api/v1/intent/ingest-third-party
 * Process third-party intent data from external providers
 */
router.post('/ingest-third-party', async (req: Request, res: Response) => {
  try {
    const intentData: ThirdPartyIntentData = req.body;

    if (!intentData.provider || !intentData.signals) {
      return res.status(400).json({
        error: 'provider and signals are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const signals = await intentDetectionService.processThirdPartyIntent(intentData);

    res.json({
      success: true,
      data: {
        signals,
        signalCount: signals.length,
        provider: intentData.provider,
        topicsProcessed: intentData.signals.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Third-party intent processing error:', error);
    res.status(500).json({
      error: 'Failed to process third-party intent data',
      code: 'PROCESSING_FAILED'
    });
  }
});

// =============================================================================
// PROFILE & SIGNALS APIs
// =============================================================================

/**
 * GET /api/v1/intent/profile/:userId
 * Get comprehensive intent profile for a user
 */
router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await intentDetectionService.getIntentProfile(userId);

    if (!profile) {
      return res.status(404).json({
        error: 'Intent profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        profile,
        lastUpdated: profile.lastUpdated,
        signalCount: profile.signals.length
      }
    });
  } catch (error) {
    console.error('Intent profile retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve intent profile',
      code: 'RETRIEVAL_FAILED'
    });
  }
});

/**
 * GET /api/v1/intent/signals/:userId
 * Get intent signals for a user with filtering options
 */
router.get('/signals/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const {
      category,
      type,
      limit = '50',
      minStrength = '0'
    } = req.query;

    const options = {
      category: category as IntentSignal['category'],
      type: type as IntentSignal['type'],
      limit: parseInt(limit as string, 10),
      minStrength: parseInt(minStrength as string, 10)
    };

    const signals = await intentDetectionService.getIntentSignals(userId, options);

    res.json({
      success: true,
      data: {
        signals,
        count: signals.length,
        filters: {
          category: options.category || 'all',
          type: options.type || 'all',
          limit: options.limit,
          minStrength: options.minStrength
        }
      }
    });
  } catch (error) {
    console.error('Intent signals retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve intent signals',
      code: 'RETRIEVAL_FAILED'
    });
  }
});

// =============================================================================
// ML INTEGRATION APIs
// =============================================================================

/**
 * POST /api/v1/intent/to-ml-format
 * Convert intent data to ML-compatible format for revenue prediction
 */
router.post('/to-ml-format', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'userId is required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const mlData = intentDetectionService.toMLFormat(userId);

    res.json({
      success: true,
      data: {
        mlData,
        format: 'ml_compatible',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('ML format conversion error:', error);
    res.status(500).json({
      error: 'Failed to convert intent data to ML format',
      code: 'CONVERSION_FAILED'
    });
  }
});

/**
 * POST /api/v1/intent/batch-ml-format
 * Batch convert multiple users' intent data to ML format
 */
router.post('/batch-ml-format', async (req: Request, res: Response) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        error: 'userIds array is required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    if (userIds.length > 100) {
      return res.status(400).json({
        error: 'Maximum 100 users per batch request',
        code: 'BATCH_SIZE_EXCEEDED'
      });
    }

    const results = userIds.map(userId => ({
      userId,
      mlData: intentDetectionService.toMLFormat(userId)
    }));

    res.json({
      success: true,
      data: {
        results,
        count: results.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Batch ML format conversion error:', error);
    res.status(500).json({
      error: 'Failed to batch convert intent data to ML format',
      code: 'BATCH_CONVERSION_FAILED'
    });
  }
});

// =============================================================================
// MONITORING & ANALYTICS APIs
// =============================================================================

/**
 * GET /api/v1/intent/analytics
 * Get intent detection analytics and insights
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const {
      timeframe = '24h',
      groupBy = 'category'
    } = req.query;

    // This would typically aggregate data from a database
    // For now, we'll provide basic statistics
    const healthStats = await intentDetectionService.healthCheck();

    res.json({
      success: true,
      data: {
        timeframe,
        groupBy,
        stats: healthStats,
        analytics: {
          totalSignalsGenerated: healthStats.totalSignals,
          activeProfiles: healthStats.activeProfiles,
          systemHealth: healthStats.status
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Intent analytics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve intent analytics',
      code: 'ANALYTICS_FAILED'
    });
  }
});

/**
 * GET /api/v1/intent/health
 * Health check endpoint for intent detection service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await intentDetectionService.healthCheck();

    res.json({
      success: true,
      service: 'intent-detection',
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Intent health check error:', error);
    res.status(503).json({
      success: false,
      service: 'intent-detection',
      error: 'Health check failed',
      code: 'HEALTH_CHECK_FAILED'
    });
  }
});

// =============================================================================
// DEVELOPMENT & TESTING APIs
// =============================================================================

/**
 * POST /api/v1/intent/clear-data
 * Clear all intent data (development only)
 */
router.post('/clear-data', async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Data clearing not allowed in production',
        code: 'PRODUCTION_FORBIDDEN'
      });
    }

    intentDetectionService.clearData();

    res.json({
      success: true,
      message: 'All intent data cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Intent data clearing error:', error);
    res.status(500).json({
      error: 'Failed to clear intent data',
      code: 'CLEAR_FAILED'
    });
  }
});

export default router;
