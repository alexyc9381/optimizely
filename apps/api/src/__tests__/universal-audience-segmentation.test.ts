import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import universalAudienceSegmentationRoutes from '../routes/universal-audience-segmentation';

// Mock the service
const mockService = {
  createProfile: jest.fn() as jest.MockedFunction<any>,
  getProfile: jest.fn() as jest.MockedFunction<any>,
  updateProfile: jest.fn() as jest.MockedFunction<any>,
  getProfiles: jest.fn() as jest.MockedFunction<any>,
  createSegment: jest.fn() as jest.MockedFunction<any>,
  getSegment: jest.fn() as jest.MockedFunction<any>,
  updateSegment: jest.fn() as jest.MockedFunction<any>,
  getSegments: jest.fn() as jest.MockedFunction<any>,
  processSegmentation: jest.fn() as jest.MockedFunction<any>,
  queueRealTimeUpdate: jest.fn() as jest.MockedFunction<any>,
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
jest.mock('../services/universal-audience-segmentation-engine', () => {
  return jest.fn().mockImplementation(() => mockService);
});

describe('Universal Audience Segmentation Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/audience-segmentation', universalAudienceSegmentationRoutes);
    jest.clearAllMocks();
  });

  describe('Profile Management', () => {
    describe('POST /profiles', () => {
      it('should create a new audience profile', async () => {
        const profileData = {
          userId: 'user123',
          attributes: {
            age: 30,
            location: 'US',
            interests: ['tech', 'sports']
          }
        };

        mockService.createProfile.mockResolvedValue('profile-123');

        const response = await request(app)
          .post('/api/v1/audience-segmentation/profiles')
          .send(profileData)
          .expect(201);

        expect(response.body).toEqual({
          success: true,
          data: { profileId: 'profile-123' },
          message: 'Audience profile created successfully'
        });

        expect(mockService.createProfile).toHaveBeenCalledWith(profileData);
      });

      it('should handle creation errors', async () => {
        mockService.createProfile.mockRejectedValue(new Error('Invalid profile data'));

        const response = await request(app)
          .post('/api/v1/audience-segmentation/profiles')
          .send({})
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: 'Invalid profile data'
        });
      });
    });

    describe('GET /profiles/:profileId', () => {
      it('should retrieve an audience profile', async () => {
        const profile = {
          id: 'profile-123',
          userId: 'user123',
          attributes: { age: 30 },
          segmentIds: ['segment1', 'segment2']
        };

        mockService.getProfile.mockResolvedValue(profile);

        const response = await request(app)
          .get('/api/v1/audience-segmentation/profiles/profile-123')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: { profile }
        });

        expect(mockService.getProfile).toHaveBeenCalledWith('profile-123');
      });

      it('should return 404 for non-existent profile', async () => {
        mockService.getProfile.mockResolvedValue(null);

        const response = await request(app)
          .get('/api/v1/audience-segmentation/profiles/nonexistent')
          .expect(404);

        expect(response.body).toEqual({
          success: false,
          error: 'Profile not found'
        });
      });
    });

    describe('PUT /profiles/:profileId', () => {
      it('should update an audience profile', async () => {
        const updates = {
          attributes: { age: 31 }
        };

        mockService.updateProfile.mockResolvedValue(undefined);

        const response = await request(app)
          .put('/api/v1/audience-segmentation/profiles/profile-123')
          .send(updates)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'Profile updated successfully'
        });

        expect(mockService.updateProfile).toHaveBeenCalledWith('profile-123', updates);
      });
    });

    describe('GET /profiles', () => {
      it('should retrieve multiple profiles with filtering', async () => {
        const profiles = [
          { id: 'profile-1', userId: 'user1' },
          { id: 'profile-2', userId: 'user2' }
        ];

        mockService.getProfiles.mockResolvedValue(profiles);

        const response = await request(app)
          .get('/api/v1/audience-segmentation/profiles?segmentIds=segment1,segment2&limit=10')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: { profiles, count: 2 }
        });

        expect(mockService.getProfiles).toHaveBeenCalledWith({
          segmentIds: ['segment1', 'segment2'],
          userIds: undefined,
          limit: 10,
          offset: undefined
        });
      });
    });
  });

  describe('Segment Management', () => {
    describe('POST /segments', () => {
      it('should create a new audience segment', async () => {
        const segmentData = {
          name: 'Tech Enthusiasts',
          type: 'rule-based',
          rules: {
            conditions: [{ field: 'interests', operator: 'contains', value: 'tech' }]
          }
        };

        mockService.createSegment.mockResolvedValue('segment-123');

        const response = await request(app)
          .post('/api/v1/audience-segmentation/segments')
          .send(segmentData)
          .expect(201);

        expect(response.body).toEqual({
          success: true,
          data: { segmentId: 'segment-123' },
          message: 'Audience segment created successfully'
        });

        expect(mockService.createSegment).toHaveBeenCalledWith(segmentData);
      });
    });

    describe('GET /segments/:segmentId', () => {
      it('should retrieve an audience segment', async () => {
        const segment = {
          id: 'segment-123',
          name: 'Tech Enthusiasts',
          type: 'rule-based',
          audienceSize: 1500
        };

        mockService.getSegment.mockResolvedValue(segment);

        const response = await request(app)
          .get('/api/v1/audience-segmentation/segments/segment-123')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: { segment }
        });

        expect(mockService.getSegment).toHaveBeenCalledWith('segment-123');
      });

      it('should return 404 for non-existent segment', async () => {
        mockService.getSegment.mockResolvedValue(null);

        const response = await request(app)
          .get('/api/v1/audience-segmentation/segments/nonexistent')
          .expect(404);

        expect(response.body).toEqual({
          success: false,
          error: 'Segment not found'
        });
      });
    });

    describe('GET /segments', () => {
      it('should retrieve segments with filtering', async () => {
        const segments = [
          { id: 'segment-1', name: 'Segment 1', type: 'rule-based', isActive: true },
          { id: 'segment-2', name: 'Segment 2', type: 'ml-generated', isActive: true }
        ];

        mockService.getSegments.mockResolvedValue(segments);

        const response = await request(app)
          .get('/api/v1/audience-segmentation/segments?type=rule-based&isActive=true')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: { segments, count: 2 }
        });

        expect(mockService.getSegments).toHaveBeenCalledWith({
          type: 'rule-based',
          isActive: true,
          tags: undefined,
          limit: undefined
        });
      });
    });
  });

  describe('Segmentation Processing', () => {
    describe('POST /segmentation/process', () => {
      it('should process segmentation request', async () => {
        const request_data = {
          profileId: 'profile-123',
          includeProfiles: true
        };

        const result = {
          profileId: 'profile-123',
          segments: ['segment1', 'segment2'],
          matchedProfiles: []
        };

        mockService.processSegmentation.mockResolvedValue(result);

        const response = await request(app)
          .post('/api/v1/audience-segmentation/segmentation/process')
          .send(request_data)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: result
        });

        expect(mockService.processSegmentation).toHaveBeenCalledWith(request_data);
      });
    });
  });

  describe('Real-time Processing', () => {
    describe('POST /realtime/update', () => {
      it('should queue real-time update', async () => {
        const update = {
          profileId: 'profile-123',
          type: 'attribute_change',
          data: { age: 31 }
        };

        mockService.queueRealTimeUpdate.mockResolvedValue(undefined);

        const response = await request(app)
          .post('/api/v1/audience-segmentation/realtime/update')
          .send(update)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'Real-time update queued successfully'
        });

        // Check that timestamp was added
        expect(mockService.queueRealTimeUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            ...update,
            timestamp: expect.any(Date)
          })
        );
      });
    });
  });

  describe('Health Check', () => {
    describe('GET /health', () => {
      it('should return service health status', async () => {
        const healthStatus = {
          status: 'healthy',
          uptime: 3600,
          redis: { connected: true, latency: 5 },
          processing: { queued: 0, processing: 0 }
        };

        mockService.getHealthStatus.mockResolvedValue(healthStatus);

        const response = await request(app)
          .get('/api/v1/audience-segmentation/health')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: healthStatus,
          timestamp: expect.any(String)
        });

        expect(mockService.getHealthStatus).toHaveBeenCalled();
      });

      it('should handle health check errors', async () => {
        mockService.getHealthStatus.mockRejectedValue(new Error('Service unavailable'));

        const response = await request(app)
          .get('/api/v1/audience-segmentation/health')
          .expect(500);

        expect(response.body).toEqual({
          success: false,
          error: 'Service unavailable',
          timestamp: expect.any(String)
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockService.createProfile.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/v1/audience-segmentation/profiles')
        .send({ userId: 'test' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Database connection failed'
      });
    });

    it('should handle unexpected errors', async () => {
      mockService.getProfile.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .get('/api/v1/audience-segmentation/profiles/test')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Unexpected error'
      });
    });
  });
});
