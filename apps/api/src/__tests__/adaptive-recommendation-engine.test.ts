import express from 'express';
import request from 'supertest';
import adaptiveRecommendationRoutes from '../routes/adaptive-recommendation';
import AdaptiveRecommendationEngine, {
    ActionType,
    UserBehavior
} from '../services/adaptive-recommendation-engine';

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/v1/adaptive-recommendation', adaptiveRecommendationRoutes);

describe('Adaptive Recommendation Engine Tests', () => {
  let engine: AdaptiveRecommendationEngine;
  let testUserId: string;
  let testBehavior: UserBehavior;

  beforeAll(() => {
    // Reset singleton instance for testing
    (AdaptiveRecommendationEngine as any)._instance = null;
    engine = AdaptiveRecommendationEngine.getInstance();
    testUserId = 'test-user-123';
  });

  beforeEach(() => {
    testBehavior = {
      userId: testUserId,
      sessionId: 'session-456',
      timestamp: new Date().toISOString(),
      action: {
        type: ActionType.DASHBOARD_INTERACTION,
        target: 'analytics-widget',
        data: { widgetType: 'chart', action: 'view' },
        duration: 30000
      },
      context: {
        industry: 'saas',
        userRole: 'manager',
        companySize: 'medium',
        experienceLevel: 'intermediate',
        currentGoals: ['increase-conversion'],
        sessionLength: 1800000,
        deviceType: 'desktop'
      },
      satisfaction: 4
    };
  });

  describe('Service Layer Tests', () => {
    it('should maintain singleton pattern', () => {
      const instance1 = AdaptiveRecommendationEngine.getInstance();
      const instance2 = AdaptiveRecommendationEngine.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should record user behavior successfully', async () => {
      await expect(engine.recordUserBehavior(testBehavior)).resolves.not.toThrow();
    });

    it('should generate recommendations for users', async () => {
      const recommendations = await engine.generateRecommendations('new-user-456');

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);

      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('id');
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('confidence');
        expect(rec.priority).toBeGreaterThanOrEqual(1);
        expect(rec.priority).toBeLessThanOrEqual(10);
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should provide engine statistics', () => {
      const stats = engine.getEngineStats();

      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('totalBehaviors');
      expect(stats).toHaveProperty('avgAdaptationScore');
      expect(typeof stats.totalUsers).toBe('number');
      expect(typeof stats.totalBehaviors).toBe('number');
      expect(typeof stats.avgAdaptationScore).toBe('number');
    });
  });

  describe('API Endpoint Tests', () => {
    it('should record behavior via API', async () => {
      const response = await request(app)
        .post('/api/v1/adaptive-recommendation/behavior')
        .send(testBehavior)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Behavior recorded successfully');
      expect(response.body.behaviorId).toBeDefined();
    });

    it('should get recommendations via API', async () => {
      const response = await request(app)
        .get(`/api/v1/adaptive-recommendation/recommendations/${testUserId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(testUserId);
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
      expect(response.body.data.count).toBeGreaterThanOrEqual(0);
      expect(response.body.data.generatedAt).toBeDefined();
    });

    it('should return engine statistics via API', async () => {
      const response = await request(app)
        .get('/api/v1/adaptive-recommendation/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUsers).toBeGreaterThanOrEqual(0);
      expect(response.body.data.totalBehaviors).toBeGreaterThanOrEqual(0);
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.uptime).toBeGreaterThan(0);
      expect(response.body.data.memoryUsage).toBeDefined();
    });

    it('should return health status via API', async () => {
      const response = await request(app)
        .get('/api/v1/adaptive-recommendation/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.engine).toBe('adaptive-recommendation');
      expect(response.body.stats).toBeDefined();
    });

    it('should validate behavior data', async () => {
      const invalidBehavior = { ...testBehavior, userId: '' };

      const response = await request(app)
        .post('/api/v1/adaptive-recommendation/behavior')
        .send(invalidBehavior)
        .expect(400);

      expect(response.body.error).toBe('Invalid behavior data');
    });

    it('should handle batch behavior recording', async () => {
      const behaviors = [
        testBehavior,
        {
          ...testBehavior,
          userId: 'user-2',
          sessionId: 'session-2',
          timestamp: new Date().toISOString()
        }
      ];

      const response = await request(app)
        .post('/api/v1/adaptive-recommendation/behavior/batch')
        .send({ behaviors })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.processed).toBe(2);
      expect(response.body.invalid).toBe(0);
      expect(response.body.total).toBe(2);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full user journey', async () => {
      const journeyUserId = 'journey-user';

      // 1. Record behavior
      const behavior = { ...testBehavior, userId: journeyUserId };
      await request(app)
        .post('/api/v1/adaptive-recommendation/behavior')
        .send(behavior)
        .expect(201);

      // 2. Get recommendations
      const recResponse = await request(app)
        .get(`/api/v1/adaptive-recommendation/recommendations/${journeyUserId}`)
        .expect(200);

      const recommendations = recResponse.body.data.recommendations;
      expect(recommendations.length).toBeGreaterThan(0);

      // 3. Track interaction if recommendations exist
      if (recommendations.length > 0) {
        const interaction = {
          recommendationId: recommendations[0].id,
          action: 'accepted',
          timestamp: new Date().toISOString(),
          satisfaction: 5
        };

        await request(app)
          .post(`/api/v1/adaptive-recommendation/recommendations/${journeyUserId}/interactions`)
          .send(interaction)
          .expect(201);
      }

      // 4. Check profile was updated
      const profileResponse = await request(app)
        .get(`/api/v1/adaptive-recommendation/profile/${journeyUserId}`)
        .expect(200);

      const profile = profileResponse.body.data.profile;
      expect(profile.userId).toBe(journeyUserId);
      expect(profile.adaptationScore).toBeGreaterThan(0);
    });
  });
});
