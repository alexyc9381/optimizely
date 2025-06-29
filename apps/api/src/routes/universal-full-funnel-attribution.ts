import express from 'express';
import rateLimit from 'express-rate-limit';
import { redisManager } from '../services/redis-client';
import createUniversalFullFunnelAttributionService from '../services/universal-full-funnel-attribution-service';

const router = express.Router();

// Initialize service using the factory function
const service = createUniversalFullFunnelAttributionService(redisManager.getClient());

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

// Track cross-channel journey
router.post('/journeys/track', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { userId, touchPoint } = req.body;

    if (!userId || !touchPoint) {
      return res.status(400).json({
        success: false,
        error: 'userId and touchPoint are required'
      });
    }

    const journeyId = await service.trackCrossChannelJourney(userId, touchPoint);

    res.status(201).json({
      success: true,
      data: { journeyId },
      message: 'Cross-channel journey tracked successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get cross-channel journey
router.get('/journeys/:journeyId', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const journey = await service.getCrossChannelJourney(req.params.journeyId);

    if (!journey) {
      return res.status(404).json({
        success: false,
        error: 'Cross-channel journey not found'
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

// Calculate cross-channel attribution
router.post('/journeys/:journeyId/attribution', strictLimit, async (req: express.Request, res: express.Response) => {
  try {
    const attribution = await service.calculateCrossChannelAttribution(req.params.journeyId);

    res.json({
      success: true,
      data: attribution,
      message: 'Cross-channel attribution calculated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get cross-channel attribution
router.get('/journeys/:journeyId/attribution', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const attribution = await service.getCrossChannelAttribution(req.params.journeyId);

    if (!attribution) {
      return res.status(404).json({
        success: false,
        error: 'Cross-channel attribution not found'
      });
    }

    res.json({
      success: true,
      data: attribution
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get funnel analytics
router.get('/analytics/funnel', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate, channels } = req.query;

    const options: any = {};
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);
    if (channels) options.channels = (channels as string).split(',');

    const analytics = await service.getFunnelAnalytics(options);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Unify user journeys
router.post('/users/:userId/unify', strictLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { secondaryUserId, confidence } = req.body;

    if (!secondaryUserId) {
      return res.status(400).json({
        success: false,
        error: 'secondaryUserId is required'
      });
    }

    const result = await service.unifyUserJourneys(
      userId,
      secondaryUserId,
      confidence || 0.8
    );

    res.json({
      success: true,
      data: { unified: result },
      message: 'User journeys unified successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get channel performance analytics
router.get('/analytics/channels', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate, channels } = req.query;

    const options: any = {};
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);
    if (channels) options.channels = (channels as string).split(',');

    const analytics = await service.getFunnelAnalytics(options);

    res.json({
      success: true,
      data: {
        channelPerformance: analytics.channelPerformance,
        deviceAnalytics: analytics.deviceAnalytics
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get funnel stage analytics
router.get('/analytics/stages', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate } = req.query;

    const options: any = {};
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);

    const analytics = await service.getFunnelAnalytics(options);

    res.json({
      success: true,
      data: {
        stageAnalytics: analytics.stageAnalytics,
        dropoffPoints: analytics.dropoffPoints,
        conversionRate: analytics.conversionRate,
        averageJourneyLength: analytics.averageJourneyLength
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get cross-device analytics
router.get('/analytics/cross-device', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate } = req.query;

    const options: any = {};
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);

    const analytics = await service.getFunnelAnalytics(options);

    res.json({
      success: true,
      data: {
        deviceAnalytics: analytics.deviceAnalytics,
        crossDeviceInsights: {
          totalJourneys: analytics.totalJourneys,
          crossDeviceJourneys: analytics.deviceAnalytics.crossDeviceJourneys,
          crossDeviceRate: analytics.deviceAnalytics.crossDeviceJourneys / analytics.totalJourneys,
          conversionLift: analytics.deviceAnalytics.crossDeviceConversionRate - analytics.conversionRate
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get attribution model comparison
router.get('/analytics/attribution-comparison', generalLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { journeyId } = req.query;

    if (!journeyId) {
      return res.status(400).json({
        success: false,
        error: 'journeyId query parameter is required'
      });
    }

    const attribution = await service.getCrossChannelAttribution(journeyId as string);

    if (!attribution) {
      return res.status(404).json({
        success: false,
        error: 'Attribution data not found for this journey'
      });
    }

    res.json({
      success: true,
      data: {
        journeyId: attribution.journeyId,
        totalValue: attribution.totalValue,
        modelComparisons: attribution.modelComparisons,
        channelContributions: attribution.channelContributions,
        recommendedModel: Object.entries(attribution.modelComparisons)
          .sort(([,a], [,b]) => (b as number) - (a as number))[0][0]
      }
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
