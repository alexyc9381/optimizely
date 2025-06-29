import express from 'express';
import request from 'supertest';
import prioritizationRoutes from '../routes/ab-test-prioritization';

// Mock Redis client
jest.mock('../services/redis-client', () => ({
  redisManager: {
    getClient: jest.fn(() => ({
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
    })),
  },
}));

const app = express();
app.use(express.json());
app.use('/ab-test-prioritization', prioritizationRoutes);

describe('A/B Test Prioritization Engine', () => {
  describe('POST /ab-test-prioritization/prioritize', () => {
    const validCustomerProfile = {
      customerProfile: {
        id: 'customer-123',
        industry: 'ecommerce',
        businessModel: ['b2c'],
        monthlyTraffic: 50000,
        currentChallenges: ['low-conversion-rate'],
        abTestingExperience: 'intermediate',
        technicalCapacity: 'high',
        budget: 'medium',
        timeline: 'standard',
        primaryGoals: ['increase-conversion'],
        riskTolerance: 'moderate',
        existingTools: ['google-analytics']
      }
    };

    it('should generate test prioritization sequence', async () => {
      const response = await request(app)
        .post('/ab-test-prioritization/prioritize')
        .send(validCustomerProfile)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sequence');
      expect(response.body.data.sequence).toHaveProperty('id');
      expect(response.body.data.sequence).toHaveProperty('customerId');
      expect(response.body.data.sequence).toHaveProperty('tests');
      expect(Array.isArray(response.body.data.sequence.tests)).toBe(true);
    });
  });

  describe('GET /ab-test-prioritization/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/ab-test-prioritization/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe('AB Test Prioritization Engine');
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('GET /ab-test-prioritization/benchmark/:industry', () => {
    it('should return ecommerce benchmark data', async () => {
      const response = await request(app)
        .get('/ab-test-prioritization/benchmark/ecommerce')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.industry).toBe('ecommerce');
      expect(response.body.data).toHaveProperty('averageConversionRate');
    });
  });
});
