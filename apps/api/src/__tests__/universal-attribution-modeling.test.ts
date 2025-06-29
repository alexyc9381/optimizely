import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import universalAttributionModelingRoutes from '../routes/universal-attribution-modeling';

// Mock the service
const mockService = {
  trackTouchPoint: jest.fn() as jest.MockedFunction<any>,
  getTouchPoint: jest.fn() as jest.MockedFunction<any>,
  getTouchPointsByUser: jest.fn() as jest.MockedFunction<any>,
  getCustomerJourney: jest.fn() as jest.MockedFunction<any>,
  getCustomerJourneys: jest.fn() as jest.MockedFunction<any>,
  trackConversion: jest.fn() as jest.MockedFunction<any>,
  createAttributionModel: jest.fn() as jest.MockedFunction<any>,
  getAttributionModel: jest.fn() as jest.MockedFunction<any>,
  getAttributionModels: jest.fn() as jest.MockedFunction<any>,
  getAttributionReport: jest.fn() as jest.MockedFunction<any>,
  getAttributionReports: jest.fn() as jest.MockedFunction<any>,
  getDeviceGraph: jest.fn() as jest.MockedFunction<any>,
  getAttributionInsights: jest.fn() as jest.MockedFunction<any>,
  getHealthStatus: jest.fn() as jest.MockedFunction<any>,
};

// Mock Redis manager
jest.mock('../services/redis-client', () => ({
  redisManager: {
    getClient: jest.fn().mockReturnValue({
      setex: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    }),
  },
}));

// Mock the service constructor
jest.mock('../services/universal-attribution-modeling-service', () => {
  return jest.fn().mockImplementation(() => mockService);
});

const app = express();
app.use(express.json());
app.use('/attribution-modeling', universalAttributionModelingRoutes);

describe('Universal Attribution Modeling Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /touchpoints', () => {
    it('should track a touchpoint successfully', async () => {
      const touchPointData = {
        userId: 'user123',
        sessionId: 'session456',
        deviceId: 'device789',
        channel: 'google-ads',
        eventType: 'click'
      };

      mockService.trackTouchPoint.mockResolvedValue('tp_123456789');

      const response = await request(app)
        .post('/attribution-modeling/touchpoints')
        .send(touchPointData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.touchPointId).toBe('tp_123456789');
      expect(mockService.trackTouchPoint).toHaveBeenCalledWith(touchPointData);
    });

    it('should handle touchpoint tracking errors', async () => {
      mockService.trackTouchPoint.mockRejectedValue(new Error('Tracking failed'));

      const response = await request(app)
        .post('/attribution-modeling/touchpoints')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Tracking failed');
    });
  });

  describe('GET /touchpoints/:id', () => {
    it('should get a touchpoint by ID', async () => {
      const mockTouchPoint = {
        id: 'tp_123456789',
        userId: 'user123',
        channel: 'google-ads',
        timestamp: new Date()
      };

      mockService.getTouchPoint.mockResolvedValue(mockTouchPoint);

      const response = await request(app)
        .get('/attribution-modeling/touchpoints/tp_123456789');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTouchPoint);
      expect(mockService.getTouchPoint).toHaveBeenCalledWith('tp_123456789');
    });

    it('should return 404 for non-existent touchpoint', async () => {
      mockService.getTouchPoint.mockResolvedValue(null);

      const response = await request(app)
        .get('/attribution-modeling/touchpoints/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Touchpoint not found');
    });
  });

  describe('GET /users/:userId/touchpoints', () => {
    it('should get user touchpoints with filters', async () => {
      const mockTouchPoints = [
        { id: 'tp_1', channel: 'google-ads' },
        { id: 'tp_2', channel: 'facebook' }
      ];

      mockService.getTouchPointsByUser.mockResolvedValue(mockTouchPoints);

      const response = await request(app)
        .get('/attribution-modeling/users/user123/touchpoints')
        .query({
          channel: 'google-ads',
          limit: '10'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTouchPoints);
      expect(response.body.count).toBe(2);
      expect(mockService.getTouchPointsByUser).toHaveBeenCalledWith('user123', {
        channel: 'google-ads',
        limit: 10
      });
    });
  });

  describe('POST /conversions', () => {
    it('should track a conversion successfully', async () => {
      const conversionData = {
        userId: 'user123',
        value: 100,
        type: 'purchase'
      };

      mockService.trackConversion.mockResolvedValue('conv_123456789');

      const response = await request(app)
        .post('/attribution-modeling/conversions')
        .send(conversionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.conversionId).toBe('conv_123456789');
      expect(mockService.trackConversion).toHaveBeenCalledWith(conversionData);
    });
  });

  describe('POST /models', () => {
    it('should create an attribution model successfully', async () => {
      const modelData = {
        name: 'Custom Model',
        type: 'custom',
        description: 'A custom attribution model',
        rules: [],
        isActive: true
      };

      mockService.createAttributionModel.mockResolvedValue('model_123456789');

      const response = await request(app)
        .post('/attribution-modeling/models')
        .send(modelData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.modelId).toBe('model_123456789');
      expect(mockService.createAttributionModel).toHaveBeenCalledWith(modelData);
    });
  });

  describe('GET /models/:modelId', () => {
    it('should get an attribution model by ID', async () => {
      const mockModel = {
        id: 'model_123456789',
        name: 'First Touch',
        type: 'first-touch',
        isActive: true
      };

      mockService.getAttributionModel.mockResolvedValue(mockModel);

      const response = await request(app)
        .get('/attribution-modeling/models/model_123456789');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockModel);
      expect(mockService.getAttributionModel).toHaveBeenCalledWith('model_123456789');
    });

    it('should return 404 for non-existent model', async () => {
      mockService.getAttributionModel.mockResolvedValue(null);

      const response = await request(app)
        .get('/attribution-modeling/models/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Attribution model not found');
    });
  });

  describe('GET /models', () => {
    it('should get all attribution models', async () => {
      const mockModels = [
        { id: 'model_1', name: 'First Touch' },
        { id: 'model_2', name: 'Last Touch' }
      ];

      mockService.getAttributionModels.mockResolvedValue(mockModels);

      const response = await request(app)
        .get('/attribution-modeling/models');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockModels);
      expect(response.body.count).toBe(2);
    });
  });

  describe('GET /journeys/:journeyId', () => {
    it('should get a customer journey by ID', async () => {
      const mockJourney = {
        id: 'journey_123456789',
        userId: 'user123',
        touchPoints: [],
        conversions: []
      };

      mockService.getCustomerJourney.mockResolvedValue(mockJourney);

      const response = await request(app)
        .get('/attribution-modeling/journeys/journey_123456789');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockJourney);
      expect(mockService.getCustomerJourney).toHaveBeenCalledWith('journey_123456789');
    });
  });

  describe('GET /users/:userId/journeys', () => {
    it('should get user journeys with date filters', async () => {
      const mockJourneys = [
        { id: 'journey_1', userId: 'user123' },
        { id: 'journey_2', userId: 'user123' }
      ];

      mockService.getCustomerJourneys.mockResolvedValue(mockJourneys);

      const response = await request(app)
        .get('/attribution-modeling/users/user123/journeys')
        .query({
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          limit: '5'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockJourneys);
      expect(mockService.getCustomerJourneys).toHaveBeenCalledWith('user123', {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        limit: 5
      });
    });
  });

  describe('GET /reports/:conversionId', () => {
    it('should get an attribution report by conversion ID', async () => {
      const mockReport = {
        journeyId: 'journey_123456789',
        userId: 'user123',
        conversionId: 'conv_123456789',
        totalValue: 100,
        modelResults: {}
      };

      mockService.getAttributionReport.mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/attribution-modeling/reports/conv_123456789');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReport);
      expect(mockService.getAttributionReport).toHaveBeenCalledWith('conv_123456789');
    });
  });

  describe('GET /users/:userId/device-graph', () => {
    it('should get device graph for user', async () => {
      const mockDeviceGraph = {
        primaryUserId: 'user123',
        deviceIds: ['device1', 'device2'],
        linkageConfidence: { device1: 1.0, device2: 0.8 }
      };

      mockService.getDeviceGraph.mockResolvedValue(mockDeviceGraph);

      const response = await request(app)
        .get('/attribution-modeling/users/user123/device-graph');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockDeviceGraph);
      expect(mockService.getDeviceGraph).toHaveBeenCalledWith('user123');
    });
  });

  describe('GET /insights', () => {
    it('should get attribution insights with filters', async () => {
      const mockInsights = {
        topChannels: [{ channel: 'google-ads', attribution: 0.4, value: 1000 }],
        channelEfficiency: { 'google-ads': 0.8 },
        averageJourneyLength: 3.5,
        averageTimeTοConversion: 604800000,
        crossDeviceJourneys: 0.25,
        attributionComparison: { 'first-touch': 0.6, 'last-touch': 0.4 }
      };

      mockService.getAttributionInsights.mockResolvedValue(mockInsights);

      const response = await request(app)
        .get('/attribution-modeling/insights')
        .query({
          startDate: '2023-01-01',
          models: 'first-touch,last-touch'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockInsights);
      expect(mockService.getAttributionInsights).toHaveBeenCalledWith({
        startDate: new Date('2023-01-01'),
        models: ['first-touch', 'last-touch']
      });
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const mockHealth = {
        status: 'healthy',
        uptime: 120000,
        attribution: {
          modelsLoaded: 5,
          activeModels: 3,
          totalTouchPoints: 1000,
          totalJourneys: 250,
          totalConversions: 50
        },
        redis: {
          connected: true,
          latency: 2
        },
        deviceGraph: {
          totalUsers: 100,
          crossDeviceUsers: 25
        }
      };

      mockService.getHealthStatus.mockResolvedValue(mockHealth);

      const response = await request(app)
        .get('/attribution-modeling/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockHealth);
    });

    it('should handle health check errors', async () => {
      mockService.getHealthStatus.mockRejectedValue(new Error('Health check failed'));

      const response = await request(app)
        .get('/attribution-modeling/health');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.error).toBe('Health check failed');
    });
  });
});
