import express from 'express';
import { behavioralAnalysisService } from '../services/behavioral-analysis-service';

const router = express.Router();

// =============================================================================
// BEHAVIORAL TRACKING ENDPOINTS - Universal Event Processing
// =============================================================================

/**
 * POST /api/v1/behavioral/track
 * Track a single behavioral event
 */
router.post('/track', async (req, res) => {
  try {
    const event = req.body;

    if (!event.url) {
      return res.status(400).json({
        error: 'Missing required field: url',
        message: 'Event URL is required for tracking'
      });
    }

    const trackedEvent = await behavioralAnalysisService.trackEvent(event);

    res.json({
      success: true,
      data: trackedEvent
    });
  } catch (error) {
    res.status(500).json({
      error: 'Event tracking failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/behavioral/track-batch
 * Track multiple behavioral events
 */
router.post('/track-batch', async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Events array is required and must not be empty'
      });
    }

    if (events.length > 100) {
      return res.status(400).json({
        error: 'Batch size too large',
        message: 'Maximum 100 events per batch'
      });
    }

    const trackedEvents = await behavioralAnalysisService.trackBatch(events);

    res.json({
      success: true,
      data: {
        processed: trackedEvents.length,
        events: trackedEvents
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Batch tracking failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// BEHAVIORAL SCORING ENDPOINTS - AI-Powered Analysis
// =============================================================================

/**
 * POST /api/v1/behavioral/score
 * Calculate behavioral score for a user
 */
router.post('/score', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required field: userId',
        message: 'User ID is required for behavioral scoring'
      });
    }

    const score = await behavioralAnalysisService.calculateBehavioralScore(userId);

    res.json({
      success: true,
      data: score
    });
  } catch (error) {
    res.status(500).json({
      error: 'Behavioral scoring failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/behavioral/to-ml-format
 * Convert behavioral data to ML scoring format
 */
router.post('/to-ml-format', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required field: userId',
        message: 'User ID is required for ML format conversion'
      });
    }

    const mlData = behavioralAnalysisService.toMLFormat(userId);

    res.json({
      success: true,
      data: mlData
    });
  } catch (error) {
    res.status(500).json({
      error: 'ML format conversion failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// UTILITY ENDPOINTS - Service Management
// =============================================================================

/**
 * GET /api/v1/behavioral/health
 * Get behavioral analysis service health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = await behavioralAnalysisService.healthCheck();

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/behavioral/clear-data
 * Clear all behavioral data (development/testing only)
 */
router.post('/clear-data', async (req, res) => {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Operation not allowed',
        message: 'Data clearing is not allowed in production'
      });
    }

    behavioralAnalysisService.clearData();

    res.json({
      success: true,
      message: 'All behavioral data cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Data clearing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
