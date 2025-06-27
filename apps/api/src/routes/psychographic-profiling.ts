import express from 'express';
import {
  PsychographicProfilingService,
  VisitorBehaviorData,
} from '../services/psychographic-profiling-service';

const router = express.Router();
let profilingService: PsychographicProfilingService;

// Initialize service
async function initializeService(): Promise<PsychographicProfilingService> {
  if (!profilingService) {
    profilingService = new PsychographicProfilingService();
  }
  return profilingService;
}

/**
 * POST /api/v1/psychographic/analyze
 * Analyze visitor behavior and generate psychographic profile
 */
router.post('/analyze', async (req, res) => {
  try {
    const service = await initializeService();
    const behaviorData: VisitorBehaviorData = req.body;

    // Validate required fields
    if (
      !behaviorData.sessionId ||
      !behaviorData.pageViews ||
      !behaviorData.interactions
    ) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, pageViews, interactions',
      });
    }

    const result = await service.analyzeVisitorBehavior(behaviorData);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error analyzing visitor behavior:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze visitor behavior',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/psychographic/profile/:sessionId
 * Get existing psychographic profile by session ID
 */
router.get('/profile/:sessionId', async (req, res) => {
  try {
    const service = await initializeService();
    const { sessionId } = req.params;

    const profile = service.getProfile(sessionId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found for session ID',
      });
    }

    res.json({
      success: true,
      data: profile,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/v1/psychographic/profile/:sessionId
 * Update existing profile with new behavioral data
 */
router.put('/profile/:sessionId', async (req, res) => {
  try {
    const service = await initializeService();
    const { sessionId } = req.params;
    const newBehaviorData = req.body;

    const updatedProfile = await service.updateProfile(
      sessionId,
      newBehaviorData
    );

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        error: 'Session not found for update',
      });
    }

    res.json({
      success: true,
      data: updatedProfile,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/psychographic/segments/:segment
 * Get profiles by behavior segment
 */
router.get('/segments/:segment', async (req, res) => {
  try {
    const service = await initializeService();
    const { segment } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const profiles = service.getProfilesBySegment(segment);

    // Apply pagination
    const startIndex = parseInt(offset as string);
    const limitNum = parseInt(limit as string);
    const paginatedProfiles = profiles.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: {
        profiles: paginatedProfiles,
        total: profiles.length,
        segment,
        pagination: {
          offset: startIndex,
          limit: limitNum,
          hasMore: startIndex + limitNum < profiles.length,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting profiles by segment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profiles by segment',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/psychographic/analytics
 * Get profiling analytics and insights
 */
router.get('/analytics', async (req, res) => {
  try {
    const service = await initializeService();
    const analytics = service.getAnalytics();

    // Convert Maps to objects for JSON serialization
    const serializedAnalytics = {
      ...analytics,
      segmentDistribution: Object.fromEntries(analytics.segmentDistribution),
      conversionRates: Object.fromEntries(analytics.conversionRates),
      accuracyMetrics: {
        ...analytics.accuracyMetrics,
        bySegment: Object.fromEntries(analytics.accuracyMetrics.bySegment),
        byStage: Object.fromEntries(analytics.accuracyMetrics.byStage),
      },
    };

    res.json({
      success: true,
      data: serializedAnalytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/psychographic/status
 * Get service status and health information
 */
router.get('/status', async (req, res) => {
  try {
    const service = await initializeService();
    const status = service.getStatus();

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/psychographic/export
 * Export psychographic profiles data
 */
router.get('/export', async (req, res) => {
  try {
    const service = await initializeService();
    const { format = 'json' } = req.query;

    const exportData = service.exportProfiles(format as 'json' | 'csv');

    // Set appropriate content type and headers
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="psychographic-profiles-${new Date().toISOString().split('T')[0]}.csv"`
      );
      res.send(exportData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="psychographic-profiles-${new Date().toISOString().split('T')[0]}.json"`
      );
      res.send(exportData);
    }
  } catch (error) {
    console.error('Error exporting profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export profiles',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/psychographic/health
 * Health check endpoint for monitoring systems
 */
router.get('/health', async (req, res) => {
  try {
    const service = await initializeService();
    const status = service.getStatus();

    const healthCheck = {
      status: status.healthStatus,
      timestamp: new Date().toISOString(),
      service: 'psychographic-profiling',
      version: '1.0.0',
      metrics: {
        totalProfiles: status.totalProfiles,
        averageAccuracy: status.averageAccuracy,
        activeModels: status.activeModels,
      },
    };

    // Return appropriate HTTP status based on health
    const httpStatus =
      status.healthStatus === 'healthy'
        ? 200
        : status.healthStatus === 'warning'
          ? 200
          : 503;

    res.status(httpStatus).json(healthCheck);
  } catch (error) {
    console.error('Error checking service health:', error);
    res.status(503).json({
      status: 'critical',
      error: 'Service unhealthy',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/psychographic/docs
 * API documentation endpoint
 */
router.get('/docs', (req, res) => {
  const documentation = {
    title: 'Universal Psychographic Profiling API',
    version: '1.0.0',
    description:
      'AI-powered real-time visitor behavior analysis and psychographic classification for personalized A/B testing',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/psychographic/analyze',
        description:
          'Analyze visitor behavior and generate psychographic profile',
        body: {
          sessionId: 'string',
          userId: 'optional string',
          pageViews: 'PageViewData[]',
          interactions: 'InteractionData[]',
          contentEngagement: 'ContentEngagementData object',
          navigationPatterns: 'NavigationPattern[]',
          timeSpent: 'TimeSpentMetrics object',
          deviceInfo: 'DeviceInfo object',
          referralSource: 'string',
        },
      },
      {
        method: 'GET',
        path: '/api/v1/psychographic/profile/:sessionId',
        description: 'Get existing psychographic profile by session ID',
      },
      {
        method: 'PUT',
        path: '/api/v1/psychographic/profile/:sessionId',
        description: 'Update existing profile with new behavioral data',
        body: {
          newBehaviorData: 'Partial<VisitorBehaviorData>',
        },
      },
      {
        method: 'GET',
        path: '/api/v1/psychographic/segments/:segment',
        description: 'Get profiles by behavior segment',
        query: {
          limit: 'optional number (default: 100)',
          offset: 'optional number (default: 0)',
        },
      },
      {
        method: 'GET',
        path: '/api/v1/psychographic/analytics',
        description: 'Get profiling analytics and insights',
      },
      {
        method: 'GET',
        path: '/api/v1/psychographic/status',
        description: 'Get service status and health information',
      },
      {
        method: 'GET',
        path: '/api/v1/psychographic/export',
        description: 'Export psychographic profiles data',
        query: {
          format: 'optional: json|csv (default: json)',
        },
      },
      {
        method: 'GET',
        path: '/api/v1/psychographic/health',
        description: 'Health check endpoint for monitoring systems',
      },
    ],
    psychographicTypes: {
      decisionMakingStyle: [
        'analytical',
        'intuitive',
        'consensus',
        'authoritative',
      ],
      riskTolerance: ['low', 'moderate', 'high'],
      valuePerception: [
        'price_sensitive',
        'quality_focused',
        'convenience_oriented',
        'status_conscious',
      ],
      communicationPreference: [
        'detailed',
        'concise',
        'visual',
        'social_proof',
      ],
      buyingJourneyStage: [
        'awareness',
        'consideration',
        'evaluation',
        'decision',
        'retention',
      ],
    },
    platformCompatibility: [
      'React (via fetch, axios, or HTTP client)',
      'Vue.js (via axios, fetch, or HTTP client)',
      'Angular (via HttpClient or HTTP client)',
      'WordPress (via wp_remote_get/wp_remote_post)',
      'Shopify (via fetch or HTTP client)',
      'Static sites (via fetch or XMLHttpRequest)',
      'Node.js (via axios, fetch, or HTTP client)',
      'PHP (via cURL, Guzzle, or file_get_contents)',
      'Python (via requests, urllib, or HTTP libraries)',
      'Any platform with HTTP request capabilities',
    ],
    examples: {
      javascript: `
// Analyze visitor behavior
const behaviorData = {
  sessionId: 'session_123',
  pageViews: [{
    url: '/pricing',
    title: 'Pricing',
    timeOnPage: 120,
    scrollDepth: 0.8,
    timestamp: new Date()
  }],
  interactions: [{
    type: 'click',
    element: 'cta-button',
    elementType: 'button',
    position: { x: 100, y: 200 },
    timestamp: new Date()
  }],
  contentEngagement: {
    articlesRead: 2,
    videosWatched: 1,
    formsCompleted: 0,
    engagementDepth: 'moderate'
  },
  // ... other required fields
};

const response = await fetch('/api/v1/psychographic/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(behaviorData)
});

const result = await response.json();
// result.data.profile contains psychographic classification

// Get profile by session
const profileResponse = await fetch('/api/v1/psychographic/profile/session_123');
const profile = await profileResponse.json();

// Get analytics
const analyticsResponse = await fetch('/api/v1/psychographic/analytics');
const analytics = await analyticsResponse.json();`,
    },
  };

  res.json(documentation);
});

export default router;
