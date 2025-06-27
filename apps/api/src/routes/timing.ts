/**
 * Timing Factor Calculation API Routes
 * Universal API endpoints for optimal sales engagement timing
 */

import { Request, Response, Router } from 'express';
import type {
    TimingData,
    TimingProfile,
    UrgencyIndicators
} from '../services/timing-factor-service';
import { timingFactorService } from '../services/timing-factor-service';

const router = Router();

// =============================================================================
// TIMING DATA INGESTION APIs
// =============================================================================

/**
 * POST /api/v1/timing/record
 * Record timing data for engagement pattern analysis
 */
router.post('/record', async (req: Request, res: Response) => {
  try {
    const timingData: TimingData = req.body;

    if (!timingData.userId || !timingData.timestamp || !timingData.event) {
      return res.status(400).json({
        error: 'userId, timestamp, and event are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Ensure timestamp is a Date object
    timingData.timestamp = new Date(timingData.timestamp);

    await timingFactorService.recordTimingData(timingData);

    res.json({
      success: true,
      message: 'Timing data recorded successfully',
      data: {
        userId: timingData.userId,
        eventType: timingData.event.type,
        timestamp: timingData.timestamp.toISOString()
      }
    });
  } catch (error) {
    console.error('Timing data recording error:', error);
    res.status(500).json({
      error: 'Failed to record timing data',
      code: 'RECORDING_FAILED'
    });
  }
});

/**
 * POST /api/v1/timing/record-batch
 * Record multiple timing data points for batch processing
 */
router.post('/record-batch', async (req: Request, res: Response) => {
  try {
    const { timingData } = req.body;

    if (!timingData || !Array.isArray(timingData)) {
      return res.status(400).json({
        error: 'timingData array is required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    if (timingData.length > 100) {
      return res.status(400).json({
        error: 'Maximum 100 timing data points per batch',
        code: 'BATCH_SIZE_EXCEEDED'
      });
    }

    // Convert timestamps to Date objects
    const processedData = timingData.map((data: any) => ({
      ...data,
      timestamp: new Date(data.timestamp)
    }));

    await timingFactorService.batchRecordTimingData(processedData);

    res.json({
      success: true,
      message: 'Batch timing data recorded successfully',
      data: {
        recordsProcessed: processedData.length,
        uniqueUsers: new Set(processedData.map(d => d.userId)).size,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Batch timing data recording error:', error);
    res.status(500).json({
      error: 'Failed to record batch timing data',
      code: 'BATCH_RECORDING_FAILED'
    });
  }
});

// =============================================================================
// ENGAGEMENT PATTERN ANALYSIS APIs
// =============================================================================

/**
 * GET /api/v1/timing/engagement-pattern/:userId
 * Get engagement pattern analysis for a user
 */
router.get('/engagement-pattern/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const pattern = await timingFactorService.getEngagementPattern(userId);

    if (!pattern) {
      return res.status(404).json({
        error: 'Engagement pattern not found or insufficient data',
        code: 'PATTERN_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        pattern,
        insights: {
          primaryPeakHour: pattern.pattern.peakHours[0],
          primaryPeakDay: pattern.pattern.peakDays[0],
          engagementLevel: pattern.pattern.engagementVelocity > 2 ? 'high' :
                          pattern.pattern.engagementVelocity > 1 ? 'medium' : 'low',
          consistency: pattern.pattern.consistencyScore > 70 ? 'high' :
                      pattern.pattern.consistencyScore > 40 ? 'medium' : 'low'
        }
      }
    });
  } catch (error) {
    console.error('Engagement pattern retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve engagement pattern',
      code: 'RETRIEVAL_FAILED'
    });
  }
});

// =============================================================================
// URGENCY INDICATORS APIs
// =============================================================================

/**
 * GET /api/v1/timing/urgency/:userId
 * Calculate urgency indicators for optimal timing decisions
 */
router.get('/urgency/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const urgency = await timingFactorService.calculateUrgencyIndicators(userId);

    res.json({
      success: true,
      data: {
        urgency,
        interpretation: {
          urgencyLevel: urgency.urgencyScore > 70 ? 'high' :
                       urgency.urgencyScore > 40 ? 'medium' : 'low',
          recommendation: urgency.recommendation,
          keyFactors: getKeyUrgencyFactors(urgency)
        }
      }
    });
  } catch (error) {
    console.error('Urgency calculation error:', error);
    res.status(500).json({
      error: 'Failed to calculate urgency indicators',
      code: 'URGENCY_CALCULATION_FAILED'
    });
  }
});

// =============================================================================
// OPTIMAL TIMING CALCULATION APIs
// =============================================================================

/**
 * POST /api/v1/timing/optimal
 * Calculate optimal contact timing for a user
 */
router.post('/optimal', async (req: Request, res: Response) => {
  try {
    const { userId, industry } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'userId is required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const optimalTiming = await timingFactorService.calculateOptimalTiming(userId, industry);

    res.json({
      success: true,
      data: {
        optimalTiming,
        summary: {
          immediateRecommendation: optimalTiming.recommendations.immediate.score > 70 ? 'contact_now' : 'wait',
          nextBestTime: optimalTiming.recommendations.nextBestTime.timestamp,
          weeklyPattern: `${getDayName(optimalTiming.recommendations.weeklyOptimal.dayOfWeek)} at ${optimalTiming.recommendations.weeklyOptimal.hour}:00`,
          confidence: Math.round((
            optimalTiming.recommendations.immediate.confidence +
            optimalTiming.recommendations.nextBestTime.confidence
          ) / 2)
        }
      }
    });
  } catch (error) {
    console.error('Optimal timing calculation error:', error);
    res.status(500).json({
      error: 'Failed to calculate optimal timing',
      code: 'OPTIMAL_TIMING_FAILED'
    });
  }
});

/**
 * POST /api/v1/timing/batch-optimal
 * Calculate optimal timing for multiple users
 */
router.post('/batch-optimal', async (req: Request, res: Response) => {
  try {
    const { userIds, industry } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        error: 'userIds array is required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    if (userIds.length > 50) {
      return res.status(400).json({
        error: 'Maximum 50 users per batch request',
        code: 'BATCH_SIZE_EXCEEDED'
      });
    }

    const results = await Promise.all(
      userIds.map(async (userId: string) => {
        try {
          const optimalTiming = await timingFactorService.calculateOptimalTiming(userId, industry);
          return { userId, optimalTiming, error: null };
        } catch (error) {
          return { userId, optimalTiming: null, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      })
    );

    const successful = results.filter(r => r.optimalTiming !== null);
    const failed = results.filter(r => r.optimalTiming === null);

    res.json({
      success: true,
      data: {
        results: successful,
        summary: {
          totalRequested: userIds.length,
          successful: successful.length,
          failed: failed.length,
          errors: failed.map(f => ({ userId: f.userId, error: f.error }))
        }
      }
    });
  } catch (error) {
    console.error('Batch optimal timing calculation error:', error);
    res.status(500).json({
      error: 'Failed to calculate batch optimal timing',
      code: 'BATCH_OPTIMAL_TIMING_FAILED'
    });
  }
});

// =============================================================================
// TIMING PROFILE APIs
// =============================================================================

/**
 * GET /api/v1/timing/profile/:userId
 * Get comprehensive timing profile for a user
 */
router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await timingFactorService.getTimingProfile(userId);

    if (!profile) {
      return res.status(404).json({
        error: 'Timing profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        profile,
        insights: {
          profileCompleteness: calculateProfileCompleteness(profile),
          recommendationConfidence: profile.optimalTiming.metadata.dataQuality,
          lastActivity: profile.urgencyIndicators.indicators.timeDecay.daysSinceLastActivity,
          engagementTrend: profile.engagementPattern.trends
        }
      }
    });
  } catch (error) {
    console.error('Timing profile retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve timing profile',
      code: 'PROFILE_RETRIEVAL_FAILED'
    });
  }
});

// =============================================================================
// ML INTEGRATION APIs
// =============================================================================

/**
 * POST /api/v1/timing/to-ml-format
 * Convert timing data to ML-compatible format
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

    const mlData = timingFactorService.toMLFormat(userId);

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
      error: 'Failed to convert timing data to ML format',
      code: 'ML_CONVERSION_FAILED'
    });
  }
});

/**
 * POST /api/v1/timing/batch-ml-format
 * Batch convert timing data to ML format
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
      mlData: timingFactorService.toMLFormat(userId)
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
      error: 'Failed to batch convert timing data to ML format',
      code: 'BATCH_ML_CONVERSION_FAILED'
    });
  }
});

// =============================================================================
// ANALYTICS AND INSIGHTS APIs
// =============================================================================

/**
 * GET /api/v1/timing/analytics
 * Get timing analytics and insights across all users
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const {
      timeframe = '7d',
      industry,
      groupBy = 'hour'
    } = req.query;

    const healthStats = await timingFactorService.healthCheck();

    // This would typically aggregate actual data from the database
    const analytics = {
      timeframe,
      industry: industry || 'all',
      groupBy,
      stats: healthStats,
      insights: {
        totalProfiles: healthStats.activeProfiles,
        avgDataPoints: healthStats.avgDataPerUser,
        dataQuality: healthStats.avgDataPerUser > 20 ? 'high' :
                    healthStats.avgDataPerUser > 10 ? 'medium' : 'low'
      },
      // Mock data for demonstration
      patterns: {
        peakContactDays: ['Tuesday', 'Wednesday', 'Thursday'],
        peakContactHours: ['10:00', '14:00', '15:00'],
        averageResponseRate: 0.15,
        bestPerformingTimeframes: [
          { day: 'Tuesday', hour: 10, responseRate: 0.22 },
          { day: 'Wednesday', hour: 14, responseRate: 0.19 },
          { day: 'Thursday', hour: 15, responseRate: 0.18 }
        ]
      }
    };

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Timing analytics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve timing analytics',
      code: 'ANALYTICS_FAILED'
    });
  }
});

/**
 * GET /api/v1/timing/benchmarks
 * Get industry timing benchmarks
 */
router.get('/benchmarks', async (req: Request, res: Response) => {
  try {
    const { industry = 'technology' } = req.query;

    // This would typically come from historical performance data
    const benchmarks = {
      industry,
      responseRates: {
        byDay: {
          monday: 0.14,
          tuesday: 0.18,
          wednesday: 0.19,
          thursday: 0.17,
          friday: 0.12,
          saturday: 0.06,
          sunday: 0.04
        },
        byHour: {
          morning: { '8': 0.12, '9': 0.16, '10': 0.19, '11': 0.17 },
          afternoon: { '13': 0.14, '14': 0.18, '15': 0.16, '16': 0.13 },
          evening: { '17': 0.09, '18': 0.06, '19': 0.04 }
        }
      },
      optimalTiming: {
        bestDays: ['Tuesday', 'Wednesday'],
        bestHours: ['10:00-11:00', '14:00-15:00'],
        worstTiming: ['Friday evening', 'Weekend', 'Early morning'],
        seasonalFactors: {
          q1: 1.1, // January-March: Budget planning season
          q2: 0.9, // April-June: Implementation focus
          q3: 0.8, // July-September: Summer slowdown
          q4: 1.2  // October-December: Year-end rush
        }
      },
      metadata: {
        sampleSize: 10000,
        dataSourcePeriod: '12 months',
        lastUpdated: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      data: benchmarks
    });
  } catch (error) {
    console.error('Timing benchmarks error:', error);
    res.status(500).json({
      error: 'Failed to retrieve timing benchmarks',
      code: 'BENCHMARKS_FAILED'
    });
  }
});

// =============================================================================
// HEALTH CHECK AND UTILITIES
// =============================================================================

/**
 * GET /api/v1/timing/health
 * Health check endpoint for timing factor service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await timingFactorService.healthCheck();

    res.json({
      success: true,
      service: 'timing-factor-calculation',
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Timing health check error:', error);
    res.status(503).json({
      success: false,
      service: 'timing-factor-calculation',
      error: 'Health check failed',
      code: 'HEALTH_CHECK_FAILED'
    });
  }
});

/**
 * POST /api/v1/timing/clear-data
 * Clear all timing data (development only)
 */
router.post('/clear-data', async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Data clearing not allowed in production',
        code: 'PRODUCTION_FORBIDDEN'
      });
    }

    timingFactorService.clearData();

    res.json({
      success: true,
      message: 'All timing data cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Timing data clearing error:', error);
    res.status(500).json({
      error: 'Failed to clear timing data',
      code: 'CLEAR_FAILED'
    });
  }
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getKeyUrgencyFactors(urgency: UrgencyIndicators): string[] {
  const factors: string[] = [];

  if (urgency.indicators.recentActivitySpike.detected) {
    factors.push(`Activity spike detected (${urgency.indicators.recentActivitySpike.magnitude}x normal)`);
  }

  if (urgency.indicators.competitiveSignals.detected) {
    factors.push(`Competitive research activity (${urgency.indicators.competitiveSignals.competitorMentions} mentions)`);
  }

  if (urgency.indicators.buyingSignals.demoRequests > 0) {
    factors.push(`${urgency.indicators.buyingSignals.demoRequests} demo request(s)`);
  }

  if (urgency.indicators.buyingSignals.pricingPageViews > 2) {
    factors.push(`${urgency.indicators.buyingSignals.pricingPageViews} pricing page views`);
  }

  if (urgency.indicators.timeDecay.engagementTrend === 'increasing') {
    factors.push('Increasing engagement trend');
  }

  return factors.length > 0 ? factors : ['No significant urgency factors detected'];
}

function calculateProfileCompleteness(profile: TimingProfile): number {
  let score = 0;

  // Engagement pattern completeness (0-40 points)
  if (profile.engagementPattern.pattern.consistencyScore > 50) score += 20;
  if (profile.engagementPattern.pattern.engagementVelocity > 1) score += 20;

  // Urgency data completeness (0-30 points)
  if (profile.urgencyIndicators.urgencyScore > 20) score += 15;
  if (profile.urgencyIndicators.confidence > 60) score += 15;

  // Timing calculation completeness (0-30 points)
  if (profile.optimalTiming.metadata.dataQuality > 50) score += 15;
  if (profile.optimalTiming.metadata.sampleSize > 20) score += 15;

  return Math.min(100, score);
}

function getDayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || 'Unknown';
}

export default router;
