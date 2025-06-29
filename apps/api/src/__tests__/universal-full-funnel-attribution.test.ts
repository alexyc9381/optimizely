import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import universalFullFunnelAttributionRoutes from '../routes/universal-full-funnel-attribution';

// Mock the service
const mockService = {
  trackCrossChannelJourney: jest.fn() as jest.MockedFunction<any>,
  getCrossChannelJourney: jest.fn() as jest.MockedFunction<any>,
  calculateCrossChannelAttribution: jest.fn() as jest.MockedFunction<any>,
  getCrossChannelAttribution: jest.fn() as jest.MockedFunction<any>,
  getFunnelAnalytics: jest.fn() as jest.MockedFunction<any>,
  unifyUserJourneys: jest.fn() as jest.MockedFunction<any>,
  getHealthStatus: jest.fn() as jest.MockedFunction<any>,
};

// Mock Redis manager
jest.mock('../services/redis-client', () => ({
  redisManager: {
    getClient: jest.fn().mockReturnValue({
      setex: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      ping: jest.fn(),
    }),
  },
}));

// Mock the service constructor
jest.mock('../services/universal-full-funnel-attribution-service', () => {
  return jest.fn().mockImplementation(() => mockService);
});

const app = express();
app.use(express.json());
app.use('/full-funnel-attribution', universalFullFunnelAttributionRoutes);

describe('Universal Full-Funnel Attribution Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /journeys/track', () => {
    it('should track cross-channel journey successfully', async () => {
      const trackData = {
        userId: 'user123',
        touchPoint: {
          sessionId: 'session456',
          deviceId: 'device789',
          channel: 'google-ads',
          eventType: 'click',
          campaign: 'summer-sale'
        }
      };

      mockService.trackCrossChannelJourney.mockResolvedValue('ccj_123456789');

      const response = await request(app)
        .post('/full-funnel-attribution/journeys/track')
        .send(trackData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.journeyId).toBe('ccj_123456789');
      expect(mockService.trackCrossChannelJourney).toHaveBeenCalledWith(
        trackData.userId,
        trackData.touchPoint
      );
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/full-funnel-attribution/journeys/track')
        .send({ userId: 'user123' }); // missing touchPoint

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('userId and touchPoint are required');
    });

    it('should handle tracking errors', async () => {
      mockService.trackCrossChannelJourney.mockRejectedValue(new Error('Tracking failed'));

      const response = await request(app)
        .post('/full-funnel-attribution/journeys/track')
        .send({
          userId: 'user123',
          touchPoint: { channel: 'test' }
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Tracking failed');
    });
  });

  describe('GET /journeys/:journeyId', () => {
    it('should get cross-channel journey by ID', async () => {
      const mockJourney = {
        id: 'ccj_123456789',
        userId: 'user123',
        stages: [],
        channels: [],
        totalTouchpoints: 5,
        funnelProgress: 0.6
      };

      mockService.getCrossChannelJourney.mockResolvedValue(mockJourney);

      const response = await request(app)
        .get('/full-funnel-attribution/journeys/ccj_123456789');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockJourney);
      expect(mockService.getCrossChannelJourney).toHaveBeenCalledWith('ccj_123456789');
    });

    it('should return 404 for non-existent journey', async () => {
      mockService.getCrossChannelJourney.mockResolvedValue(null);

      const response = await request(app)
        .get('/full-funnel-attribution/journeys/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cross-channel journey not found');
    });
  });

  describe('POST /journeys/:journeyId/attribution', () => {
    it('should calculate cross-channel attribution', async () => {
      const mockAttribution = {
        journeyId: 'ccj_123456789',
        userId: 'user123',
        totalValue: 500,
        channelContributions: [
          {
            channel: 'google-ads',
            touchpoints: 3,
            attribution: { 'first-touch': 1.0, 'last-touch': 0.0 }
          }
        ],
        modelComparisons: {
          'first-touch': 0.4,
          'last-touch': 0.3,
          'linear': 0.3
        }
      };

      mockService.calculateCrossChannelAttribution.mockResolvedValue(mockAttribution);

      const response = await request(app)
        .post('/full-funnel-attribution/journeys/ccj_123456789/attribution');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAttribution);
      expect(mockService.calculateCrossChannelAttribution).toHaveBeenCalledWith('ccj_123456789');
    });

    it('should handle attribution calculation errors', async () => {
      mockService.calculateCrossChannelAttribution.mockRejectedValue(new Error('Journey not found'));

      const response = await request(app)
        .post('/full-funnel-attribution/journeys/invalid/attribution');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Journey not found');
    });
  });

  describe('GET /journeys/:journeyId/attribution', () => {
    it('should get cross-channel attribution', async () => {
      const mockAttribution = {
        journeyId: 'ccj_123456789',
        totalValue: 500,
        channelContributions: []
      };

      mockService.getCrossChannelAttribution.mockResolvedValue(mockAttribution);

      const response = await request(app)
        .get('/full-funnel-attribution/journeys/ccj_123456789/attribution');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAttribution);
      expect(mockService.getCrossChannelAttribution).toHaveBeenCalledWith('ccj_123456789');
    });

    it('should return 404 for non-existent attribution', async () => {
      mockService.getCrossChannelAttribution.mockResolvedValue(null);

      const response = await request(app)
        .get('/full-funnel-attribution/journeys/nonexistent/attribution');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cross-channel attribution not found');
    });
  });

  describe('GET /analytics/funnel', () => {
    it('should get funnel analytics with filters', async () => {
      const mockAnalytics = {
        totalJourneys: 1000,
        completedJourneys: 150,
        conversionRate: 0.15,
        averageJourneyLength: 4.5,
        stageAnalytics: [
          {
            stageId: 'awareness',
            stageName: 'Awareness',
            entries: 1000,
            conversionRate: 0.7
          }
        ],
        channelPerformance: [
          {
            channel: 'google-ads',
            journeys: 500,
            conversionRate: 0.16
          }
        ],
        deviceAnalytics: {
          totalDevices: 1500,
          crossDeviceJourneys: 300
        },
        dropoffPoints: []
      };

      mockService.getFunnelAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/full-funnel-attribution/analytics/funnel')
        .query({
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          channels: 'google-ads,facebook'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnalytics);
      expect(mockService.getFunnelAnalytics).toHaveBeenCalledWith({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        channels: ['google-ads', 'facebook']
      });
    });
  });

  describe('POST /users/:userId/unify', () => {
    it('should unify user journeys successfully', async () => {
      const unifyData = {
        secondaryUserId: 'user456',
        confidence: 0.9
      };

      mockService.unifyUserJourneys.mockResolvedValue(true);

      const response = await request(app)
        .post('/full-funnel-attribution/users/user123/unify')
        .send(unifyData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.unified).toBe(true);
      expect(mockService.unifyUserJourneys).toHaveBeenCalledWith(
        'user123',
        'user456',
        0.9
      );
    });

    it('should return 400 for missing secondaryUserId', async () => {
      const response = await request(app)
        .post('/full-funnel-attribution/users/user123/unify')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('secondaryUserId is required');
    });

    it('should handle unification errors', async () => {
      mockService.unifyUserJourneys.mockRejectedValue(new Error('Confidence too low'));

      const response = await request(app)
        .post('/full-funnel-attribution/users/user123/unify')
        .send({ secondaryUserId: 'user456', confidence: 0.3 });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Confidence too low');
    });
  });

  describe('GET /analytics/channels', () => {
    it('should get channel performance analytics', async () => {
      const mockAnalytics = {
        channelPerformance: [
          {
            channel: 'google-ads',
            journeys: 500,
            conversions: 80,
            conversionRate: 0.16
          }
        ],
        deviceAnalytics: {
          totalDevices: 1500,
          crossDeviceJourneys: 300
        }
      };

      mockService.getFunnelAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/full-funnel-attribution/analytics/channels');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.channelPerformance).toEqual(mockAnalytics.channelPerformance);
      expect(response.body.data.deviceAnalytics).toEqual(mockAnalytics.deviceAnalytics);
    });
  });

  describe('GET /analytics/stages', () => {
    it('should get funnel stage analytics', async () => {
      const mockAnalytics = {
        stageAnalytics: [
          {
            stageId: 'awareness',
            stageName: 'Awareness',
            entries: 1000,
            conversionRate: 0.7
          }
        ],
        dropoffPoints: [
          {
            stageId: 'consideration',
            dropoffRate: 0.4
          }
        ],
        conversionRate: 0.15,
        averageJourneyLength: 4.5
      };

      mockService.getFunnelAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/full-funnel-attribution/analytics/stages');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stageAnalytics).toEqual(mockAnalytics.stageAnalytics);
      expect(response.body.data.dropoffPoints).toEqual(mockAnalytics.dropoffPoints);
      expect(response.body.data.conversionRate).toBe(0.15);
    });
  });

  describe('GET /analytics/cross-device', () => {
    it('should get cross-device analytics', async () => {
      const mockAnalytics = {
        totalJourneys: 1000,
        conversionRate: 0.15,
        deviceAnalytics: {
          totalDevices: 1500,
          crossDeviceJourneys: 300,
          crossDeviceConversionRate: 0.2
        }
      };

      mockService.getFunnelAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/full-funnel-attribution/analytics/cross-device');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deviceAnalytics).toEqual(mockAnalytics.deviceAnalytics);
      expect(response.body.data.crossDeviceInsights.totalJourneys).toBe(1000);
      expect(response.body.data.crossDeviceInsights.crossDeviceRate).toBe(0.3);
    });
  });

  describe('GET /analytics/attribution-comparison', () => {
    it('should get attribution model comparison', async () => {
      const mockAttribution = {
        journeyId: 'ccj_123456789',
        totalValue: 500,
        modelComparisons: {
          'first-touch': 0.4,
          'last-touch': 0.35,
          'linear': 0.25
        },
        channelContributions: [
          { channel: 'google-ads', attribution: { 'first-touch': 1.0 } }
        ]
      };

      mockService.getCrossChannelAttribution.mockResolvedValue(mockAttribution);

      const response = await request(app)
        .get('/full-funnel-attribution/analytics/attribution-comparison')
        .query({ journeyId: 'ccj_123456789' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.journeyId).toBe('ccj_123456789');
      expect(response.body.data.recommendedModel).toBe('first-touch');
      expect(mockService.getCrossChannelAttribution).toHaveBeenCalledWith('ccj_123456789');
    });

    it('should return 400 for missing journeyId', async () => {
      const response = await request(app)
        .get('/full-funnel-attribution/analytics/attribution-comparison');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('journeyId query parameter is required');
    });

    it('should return 404 for non-existent attribution data', async () => {
      mockService.getCrossChannelAttribution.mockResolvedValue(null);

      const response = await request(app)
        .get('/full-funnel-attribution/analytics/attribution-comparison')
        .query({ journeyId: 'nonexistent' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Attribution data not found for this journey');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const mockHealth = {
        status: 'healthy',
        uptime: 120000,
        funnelTracking: {
          totalJourneys: 1000,
          activeJourneys: 50,
          funnelStages: 5,
          unificationRules: 3
        },
        crossChannel: {
          totalChannels: 8,
          crossChannelJourneys: 300,
          crossDeviceJourneys: 150
        },
        attribution: {
          calculatedAttributions: 500,
          averageAttributionLatency: 150
        },
        redis: {
          connected: true,
          latency: 2
        }
      };

      mockService.getHealthStatus.mockResolvedValue(mockHealth);

      const response = await request(app)
        .get('/full-funnel-attribution/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockHealth);
    });

    it('should handle health check errors', async () => {
      mockService.getHealthStatus.mockRejectedValue(new Error('Health check failed'));

      const response = await request(app)
        .get('/full-funnel-attribution/health');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.error).toBe('Health check failed');
    });
  });
});
