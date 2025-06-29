import request from 'supertest';
import express from 'express';
import { Redis } from 'ioredis';
import universalContentPerformanceRoutes from '../routes/universal-content-performance';
import createUniversalContentPerformanceService from '../services/universal-content-performance-service';

// Mock Redis
const mockRedis = {
  setex: jest.fn(),
  get: jest.fn(),
  sadd: jest.fn(),
  smembers: jest.fn(),
  hincrby: jest.fn(),
  hincrbyfloat: jest.fn(),
  expire: jest.fn(),
  scard: jest.fn(),
  keys: jest.fn(),
  ping: jest.fn(),
  del: jest.fn(),
} as unknown as Redis;

// Mock redis manager
jest.mock('../services/redis-client', () => ({
  redisManager: {
    getClient: () => mockRedis,
  },
}));

describe('Universal Content Performance Analysis', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/content-performance', universalContentPerformanceRoutes);
    jest.clearAllMocks();
  });

  describe('Content Management', () => {
    describe('POST /content', () => {
      it('should create new content successfully', async () => {
        const contentData = {
          title: 'Test Blog Post',
          type: 'blog',
          url: 'https://example.com/blog/test-post',
          authorId: 'author123',
          category: 'technology',
          tags: ['javascript', 'testing'],
          wordCount: 1500,
          readTime: 7,
          metadata: {
            funnelStage: 'awareness',
            language: 'en'
          }
        };

        mockRedis.setex = jest.fn().mockResolvedValue('OK');
        mockRedis.sadd = jest.fn().mockResolvedValue(1);

        const response = await request(app)
          .post('/api/v1/content-performance/content')
          .send(contentData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.contentId).toBeDefined();
        expect(response.body.message).toBe('Content created successfully');
      });

      it('should return 400 for missing required fields', async () => {
        const incompleteData = {
          title: 'Test Post',
        };

        const response = await request(app)
          .post('/api/v1/content-performance/content')
          .send(incompleteData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required fields: title, type, url, authorId, category');
      });
    });

    describe('GET /content/:id', () => {
      it('should retrieve content by ID', async () => {
        const contentId = 'content_123';
        const mockContent = {
          id: contentId,
          title: 'Test Content',
          type: 'blog',
          publishedAt: new Date().toISOString(),
          authorId: 'author123',
          category: 'technology',
          tags: ['test'],
          metadata: {}
        };

        mockRedis.get = jest.fn().mockResolvedValue(JSON.stringify(mockContent));

        const response = await request(app)
          .get(`/api/v1/content-performance/content/${contentId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.content.id).toBe(contentId);
      });

      it('should return 404 for non-existent content', async () => {
        mockRedis.get = jest.fn().mockResolvedValue(null);

        const response = await request(app)
          .get('/api/v1/content-performance/content/nonexistent');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Content not found');
      });
    });
  });

  describe('Engagement Tracking', () => {
    describe('POST /engagement', () => {
      it('should track engagement successfully', async () => {
        const engagementData = {
          contentId: 'content_123',
          userId: 'user_456',
          sessionId: 'session_789',
          engagementType: 'view',
          sourceChannel: 'organic',
          deviceType: 'desktop',
          location: {
            country: 'US',
            region: 'CA'
          }
        };

        mockRedis.setex = jest.fn().mockResolvedValue('OK');
        mockRedis.sadd = jest.fn().mockResolvedValue(1);
        mockRedis.hincrby = jest.fn().mockResolvedValue(1);
        mockRedis.expire = jest.fn().mockResolvedValue(1);

        const response = await request(app)
          .post('/api/v1/content-performance/engagement')
          .send(engagementData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.engagementId).toBeDefined();
        expect(response.body.message).toBe('Engagement tracked successfully');
      });

      it('should return 400 for missing required fields', async () => {
        const incompleteData = {
          contentId: 'content_123',
        };

        const response = await request(app)
          .post('/api/v1/content-performance/engagement')
          .send(incompleteData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required fields: contentId, sessionId, engagementType, sourceChannel, deviceType');
      });
    });
  });

  describe('Performance Analytics', () => {
    describe('GET /performance/:contentId', () => {
      it('should return 400 for missing date parameters', async () => {
        const response = await request(app)
          .get('/api/v1/content-performance/performance/content_123');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required query parameters: startDate, endDate');
      });
    });

    describe('GET /analytics', () => {
      it('should return comprehensive analytics', async () => {
        const mockAnalytics = {
          totalContent: 10,
          activeContent: 8,
          topPerformingContent: [],
          lowPerformingContent: [],
          contentByType: { blog: 5, video: 3, whitepaper: 2 },
          contentByStage: { awareness: 4, consideration: 3, decision: 3 },
          averagePerformanceScore: 72.5,
          totalRevenue: 15000,
          totalConversions: 25,
          recommendations: []
        };

        mockRedis.get = jest.fn().mockResolvedValue(JSON.stringify(mockAnalytics));

        const response = await request(app)
          .get('/api/v1/content-performance/analytics?startDate=2024-01-01&endDate=2024-01-31');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.analytics.totalContent).toBe(10);
        expect(response.body.analytics.activeContent).toBe(8);
        expect(response.body.analytics.averagePerformanceScore).toBe(72.5);
      });
    });
  });

  describe('Health Check', () => {
    describe('GET /health', () => {
      it('should return healthy status', async () => {
        mockRedis.ping = jest.fn().mockResolvedValue('PONG');
        mockRedis.scard = jest.fn().mockResolvedValue(50);
        mockRedis.keys = jest.fn().mockResolvedValue(['engagement_1', 'engagement_2']);

        const response = await request(app)
          .get('/api/v1/content-performance/health');

        expect(response.status).toBe(200);
        expect(response.body.service).toBe('Universal Content Performance Analysis');
        expect(response.body.status).toBe('healthy');
      });

      it('should return unhealthy status on Redis failure', async () => {
        mockRedis.ping = jest.fn().mockRejectedValue(new Error('Redis connection failed'));

        const response = await request(app)
          .get('/api/v1/content-performance/health');

        expect(response.status).toBe(503);
        expect(response.body.status).toBe('error');
      });
    });
  });
});
