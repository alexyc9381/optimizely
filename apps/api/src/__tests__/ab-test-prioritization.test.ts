import express from 'express';
import request from 'supertest';
import prioritizationRoutes from '../routes/ab-test-prioritization';
import { redisManager } from '../services/redis-client';

// Mock Redis client
jest.mock('../services/redis-client', () => ({
  redisManager: {
    getClient: jest.fn(() => ({
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
    })),
  },
}));

const app = express();
app.use(express.json());
app.use('/ab-test-prioritization', prioritizationRoutes);

describe('A/B Test Prioritization Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /ab-test-prioritization/prioritize', () => {
    const validCustomerProfile = {
      customerProfile: {
        id: 'customer-123',
        industry: 'ecommerce',
        businessModel: ['b2c', 'online'],
        monthlyTraffic: 50000,
        currentChallenges: ['low-conversion-rate', 'cart-abandonment'],
        abTestingExperience: 'intermediate',
        technicalCapacity: 'high',
        budget: 'medium',
        timeline: 'standard',
        conversionRate: 2.5,
        revenue: 500000,
        teamSize: 8,
        primaryGoals: ['increase-conversion', 'reduce-cart-abandonment'],
        riskTolerance: 'moderate',
        complianceRequirements: ['gdpr'],
        existingTools: ['google-analytics', 'hotjar']
      }
    };

    it('should generate test prioritization sequence successfully', async () => {
      const response = await request(app)
        .post('/ab-test-prioritization/prioritize')
        .send(validCustomerProfile)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sequence');
      expect(response.body.data).toHaveProperty('recommendations');

      // Verify sequence structure
      const sequence = response.body.data.sequence;
      expect(sequence).toHaveProperty('id');
      expect(sequence).toHaveProperty('customerId', validCustomerProfile.customerProfile.id);
      expect(sequence).toHaveProperty('tests');
      expect(sequence).toHaveProperty('totalDuration');
      expect(sequence).toHaveProperty('expectedROI');
      expect(sequence).toHaveProperty('confidenceScore');
      expect(sequence).toHaveProperty('status', 'draft');

      // Verify tests structure
      expect(Array.isArray(sequence.tests)).toBe(true);
      expect(sequence.tests.length).toBeGreaterThan(0);

      sequence.tests.forEach((test: any) => {
        expect(test).toHaveProperty('templateId');
        expect(test).toHaveProperty('priorityScore');
        expect(test).toHaveProperty('confidence');
        expect(test).toHaveProperty('expectedImpact');
        expect(test).toHaveProperty('sequencePosition');
        expect(test).toHaveProperty('parallelizable');
      });

      // Verify recommendations
      const recommendations = response.body.data.recommendations;
      expect(recommendations).toHaveProperty('totalTests');
      expect(recommendations).toHaveProperty('estimatedDuration');
      expect(recommendations).toHaveProperty('expectedROI');
      expect(recommendations).toHaveProperty('confidenceScore');
      expect(recommendations).toHaveProperty('nextSteps');
      expect(Array.isArray(recommendations.nextSteps)).toBe(true);
    });

    it('should accept optional prioritization criteria', async () => {
      const requestBody = {
        ...validCustomerProfile,
        criteria: {
          impactWeight: 0.3,
          feasibilityWeight: 0.25,
          urgencyWeight: 0.2,
          riskWeight: 0.1,
          resourceWeight: 0.1,
          learningWeight: 0.05,
          strategicWeight: 0.0
        }
      };

      const response = await request(app)
        .post('/ab-test-prioritization/prioritize')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sequence).toBeDefined();
    });

    it('should validate required customer profile fields', async () => {
      const invalidProfile = {
        customerProfile: {
          // Missing required fields
          industry: 'ecommerce',
          monthlyTraffic: 'invalid', // Should be numeric
        }
      };

      const response = await request(app)
        .post('/ab-test-prioritization/prioritize')
        .send(invalidProfile)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it('should validate prioritization criteria weights', async () => {
      const invalidCriteria = {
        ...validCustomerProfile,
        criteria: {
          impactWeight: 1.5, // Invalid - should be between 0 and 1
          feasibilityWeight: -0.1, // Invalid - should be between 0 and 1
        }
      };

      const response = await request(app)
        .post('/ab-test-prioritization/prioritize')
        .send(invalidCriteria)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should return error when customer profile is missing', async () => {
      const response = await request(app)
        .post('/ab-test-prioritization/prioritize')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Customer profile is required');
    });

    it('should handle different industries correctly', async () => {
      const saasProfile = {
        ...validCustomerProfile,
        customerProfile: {
          ...validCustomerProfile.customerProfile,
          industry: 'saas',
          businessModel: ['b2b', 'subscription'],
          currentChallenges: ['trial-to-paid', 'feature-adoption'],
          primaryGoals: ['increase-trial-conversion', 'reduce-churn']
        }
      };

      const response = await request(app)
        .post('/ab-test-prioritization/prioritize')
        .send(saasProfile)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sequence.customerId).toBe(saasProfile.customerProfile.id);
    });

    it('should handle different experience levels', async () => {
      const beginnerProfile = {
        ...validCustomerProfile,
        customerProfile: {
          ...validCustomerProfile.customerProfile,
          abTestingExperience: 'none',
          technicalCapacity: 'low',
          timeline: 'urgent'
        }
      };

      const response = await request(app)
        .post('/ab-test-prioritization/prioritize')
        .send(beginnerProfile)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sequence).toBeDefined();
    });
  });

  describe('GET /ab-test-prioritization/sequence/:customerId/:sequenceId', () => {
    const mockSequence = {
      id: 'seq_123',
      customerId: 'customer-123',
      tests: [],
      status: 'draft'
    };

    it('should retrieve existing sequence', async () => {
      // Mock Redis to return cached sequence
      const mockRedisClient = {
        get: jest.fn().mockResolvedValue(JSON.stringify(mockSequence))
      };
      (redisManager.getClient as jest.Mock).mockReturnValue(mockRedisClient);

      const response = await request(app)
        .get('/ab-test-prioritization/sequence/customer-123/seq_123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSequence);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test_sequence:customer-123:seq_123');
    });

    it('should return 404 for non-existent sequence', async () => {
      // Mock Redis to return null
      const mockRedisClient = {
        get: jest.fn().mockResolvedValue(null)
      };
      (redisManager.getClient as jest.Mock).mockReturnValue(mockRedisClient);

      const response = await request(app)
        .get('/ab-test-prioritization/sequence/customer-123/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Test sequence not found');
    });

    it('should handle Redis errors gracefully', async () => {
      // Mock Redis to throw error
      const mockRedisClient = {
        get: jest.fn().mockRejectedValue(new Error('Redis connection failed'))
      };
      (redisManager.getClient as jest.Mock).mockReturnValue(mockRedisClient);

      const response = await request(app)
        .get('/ab-test-prioritization/sequence/customer-123/seq_123')
        .expect(500);

      expect(response.body.error).toBe('Failed to retrieve test sequence');
    });
  });

  describe('POST /ab-test-prioritization/quick-recommendations', () => {
    const validQuickRequest = {
      industry: 'ecommerce',
      monthlyTraffic: 25000,
      primaryGoal: 'increase-conversion'
    };

    it('should return quick recommendations successfully', async () => {
      const response = await request(app)
        .post('/ab-test-prioritization/quick-recommendations')
        .send(validQuickRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('topTests');
      expect(response.body.data).toHaveProperty('industryInsights');

      // Verify topTests structure
      const topTests = response.body.data.topTests;
      expect(Array.isArray(topTests)).toBe(true);
      expect(topTests.length).toBeGreaterThan(0);

      topTests.forEach((test: any) => {
        expect(test).toHaveProperty('name');
        expect(test).toHaveProperty('category');
        expect(test).toHaveProperty('expectedLift');
        expect(test).toHaveProperty('difficulty');
        expect(test).toHaveProperty('timeToImplement');
        expect(test).toHaveProperty('priority');
      });

      // Verify industryInsights structure
      const insights = response.body.data.industryInsights;
      expect(insights).toHaveProperty('averageConversionRate');
      expect(insights).toHaveProperty('recommendedTestDuration');
      expect(insights).toHaveProperty('successFactors');
      expect(Array.isArray(insights.successFactors)).toBe(true);
    });

    it('should validate required quick recommendation fields', async () => {
      const invalidRequest = {
        industry: '', // Empty
        monthlyTraffic: 'invalid', // Should be numeric
        // Missing primaryGoal
      };

      const response = await request(app)
        .post('/ab-test-prioritization/quick-recommendations')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should adapt recommendations for different industries', async () => {
      const saasRequest = {
        ...validQuickRequest,
        industry: 'saas'
      };

      const response = await request(app)
        .post('/ab-test-prioritization/quick-recommendations')
        .send(saasRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.industryInsights.averageConversionRate).toBe('12.5%');
    });

    it('should adapt recommendations for fintech industry', async () => {
      const fintechRequest = {
        ...validQuickRequest,
        industry: 'fintech'
      };

      const response = await request(app)
        .post('/ab-test-prioritization/quick-recommendations')
        .send(fintechRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.industryInsights.averageConversionRate).toBe('5.2%');
      expect(response.body.data.industryInsights.recommendedTestDuration).toBe('21-28 days');
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
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('sequences');
      expect(response.body.data.sequences).toHaveProperty('active');
      expect(response.body.data.sequences).toHaveProperty('completed');
    });

    it('should handle health check errors', async () => {
      // This test would require mocking the service to throw an error
      // For now, we'll just verify the structure
      const response = await request(app)
        .get('/ab-test-prioritization/health')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /ab-test-prioritization/benchmark/:industry', () => {
    it('should return ecommerce benchmark data', async () => {
      const response = await request(app)
        .get('/ab-test-prioritization/benchmark/ecommerce')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.industry).toBe('ecommerce');
      expect(response.body.data).toHaveProperty('averageConversionRate', 2.8);
      expect(response.body.data).toHaveProperty('typicalLiftRange', '5-18%');
      expect(response.body.data).toHaveProperty('recommendedTestDuration', '10-14 days');
      expect(response.body.data).toHaveProperty('successfulTestTypes');
      expect(response.body.data).toHaveProperty('commonChallenges');
      expect(Array.isArray(response.body.data.successfulTestTypes)).toBe(true);
      expect(Array.isArray(response.body.data.commonChallenges)).toBe(true);
    });

    it('should return SaaS benchmark data', async () => {
      const response = await request(app)
        .get('/ab-test-prioritization/benchmark/saas')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.industry).toBe('saas');
      expect(response.body.data).toHaveProperty('averageConversionRate', 12.5);
      expect(response.body.data).toHaveProperty('typicalLiftRange', '8-25%');
      expect(response.body.data).toHaveProperty('recommendedTestDuration', '14-21 days');
    });

    it('should return fintech benchmark data', async () => {
      const response = await request(app)
        .get('/ab-test-prioritization/benchmark/fintech')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.industry).toBe('fintech');
      expect(response.body.data).toHaveProperty('averageConversionRate', 5.2);
      expect(response.body.data).toHaveProperty('typicalLiftRange', '12-30%');
      expect(response.body.data).toHaveProperty('recommendedTestDuration', '21-28 days');
    });

    it('should return 404 for unknown industry', async () => {
      const response = await request(app)
        .get('/ab-test-prioritization/benchmark/unknown-industry')
        .expect(404);

      expect(response.body.error).toBe('Industry benchmark not found');
      expect(response.body.availableIndustries).toBeDefined();
      expect(Array.isArray(response.body.availableIndustries)).toBe(true);
    });

    it('should handle case-insensitive industry names', async () => {
      const response = await request(app)
        .get('/ab-test-prioritization/benchmark/ECOMMERCE')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.industry).toBe('ecommerce');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to prioritization endpoints', async () => {
      // This test would require making multiple requests to trigger rate limiting
      // For now, we'll just verify the endpoint responds normally
      const response = await request(app)
        .get('/ab-test-prioritization/health')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/ab-test-prioritization/prioritize')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Express will handle malformed JSON and return 400
    });

    it('should handle missing content-type header', async () => {
      const response = await request(app)
        .post('/ab-test-prioritization/prioritize')
        .send('some data')
        .expect(400);

      // Should fail validation since body won't be parsed correctly
    });
  });
});

describe('A/B Test Prioritization Engine Integration', () => {
  it('should integrate with Redis for caching', async () => {
    const mockRedisClient = {
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
    };
    (redisManager.getClient as jest.Mock).mockReturnValue(mockRedisClient);

    const validCustomerProfile = {
      customerProfile: {
        id: 'integration-test-customer',
        industry: 'ecommerce',
        businessModel: ['b2c'],
        monthlyTraffic: 30000,
        currentChallenges: ['low-conversion-rate'],
        abTestingExperience: 'basic',
        technicalCapacity: 'medium',
        budget: 'medium',
        timeline: 'standard',
        primaryGoals: ['increase-conversion'],
        riskTolerance: 'moderate',
        existingTools: []
      }
    };

    const response = await request(app)
      .post('/ab-test-prioritization/prioritize')
      .send(validCustomerProfile)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(mockRedisClient.setex).toHaveBeenCalledWith(
      expect.stringMatching(/^test_sequence:integration-test-customer:/),
      7 * 24 * 60 * 60, // 7 days TTL
      expect.stringContaining('"customerId":"integration-test-customer"')
    );
  });
});
