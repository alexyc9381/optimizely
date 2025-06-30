import { createMocks } from 'node-mocks-http';
import { IndustrySpecificAnalytics } from '../../../../lib/services/industry-specific-analytics';
import handler from '../index';

// Mock the analytics service
jest.mock('../../../../lib/services/industry-specific-analytics');
jest.mock('../../../../lib/middleware/api-auth', () => ({
  validateApiKey: jest.fn(),
  rateLimitCheck: jest.fn()
}));

const mockAnalytics = IndustrySpecificAnalytics as jest.MockedClass<typeof IndustrySpecificAnalytics>;
const { validateApiKey, rateLimitCheck } = require('../../../../lib/middleware/api-auth');

describe('/api/customer-analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    validateApiKey.mockResolvedValue({
      valid: true,
      clientId: 'test_client',
      apiKey: 'test_key_123'
    });

    rateLimitCheck.mockResolvedValue({
      allowed: true,
      remainingRequests: 99,
      resetTime: Date.now() + 60000
    });

    // Mock analytics methods
    mockAnalytics.prototype.analyzeCustomer = jest.fn().mockResolvedValue([
      {
        id: 'insight_1',
        industryType: 'saas',
        category: 'engagement',
        title: 'High Engagement Detected',
        description: 'Customer showing strong engagement patterns',
        recommendation: 'Continue current engagement strategy',
        confidence: 0.85,
        priority: 'high',
        impactScore: 8.5,
        timestamp: new Date(),
        metrics: [],
        patterns: []
      }
    ]);

    mockAnalytics.prototype.getIndustryMetrics = jest.fn().mockResolvedValue([
      {
        id: 'metric_1',
        name: 'Engagement Score',
        value: 75,
        unit: 'percentage',
        trend: 'increasing',
        benchmark: 65,
        percentile: 80,
        confidence: 0.9,
        industrySpecific: true
      }
    ]);

    mockAnalytics.prototype.generateRecommendations = jest.fn().mockResolvedValue([
      {
        category: 'engagement',
        action: 'Increase content personalization',
        reasoning: 'Customer responds well to personalized content',
        expectedImpact: 'Increase engagement by 15%',
        timeframe: '2-4 weeks',
        effort: 'medium'
      }
    ]);
  });

  describe('GET requests', () => {
    it('should return customer analytics for valid request', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          customerId: 'cust_123',
          industry: 'saas'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      expect(data).toMatchObject({
        customerId: 'cust_123',
        profile: {
          customerId: 'cust_123',
          industryType: 'saas',
          companySize: 'medium'
        },
        insights: expect.any(Array),
        recommendations: expect.any(Array),
        metadata: {
          industry: 'saas',
          metricsRequested: 'all'
        }
      });

      expect(mockAnalytics.prototype.analyzeCustomer).toHaveBeenCalledWith(
        'cust_123',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should return 400 when customerId is missing', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {}
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('customerId is required');
    });

    it('should return industry-specific metrics when industry is provided', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          customerId: 'cust_123',
          industry: 'college_consulting'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      expect(mockAnalytics.prototype.getIndustryMetrics).toHaveBeenCalledWith(
        'cust_123',
        'college_consulting'
      );
      expect(data.industryAnalytics).toBeDefined();
    });

    it('should handle analytics service errors gracefully', async () => {
      mockAnalytics.prototype.analyzeCustomer.mockRejectedValue(new Error('Analytics service error'));

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          customerId: 'cust_123'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Failed to retrieve analytics');
    });
  });

  describe('POST requests', () => {
    it('should process customer events successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          customerId: 'cust_123',
          events: [
            {
              type: 'page_view',
              properties: {
                page: '/pricing',
                timestamp: new Date().toISOString()
              }
            },
            {
              type: 'conversion',
              properties: {
                value: 100,
                timestamp: new Date().toISOString()
              }
            }
          ],
          industry: 'saas'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      expect(data).toMatchObject({
        success: true,
        customerId: 'cust_123',
        eventsProcessed: 2,
        insights: expect.any(Array)
      });

      expect(mockAnalytics.prototype.analyzeCustomer).toHaveBeenCalledWith(
        'cust_123',
        expect.objectContaining({
          industryType: 'saas'
        }),
        expect.objectContaining({
          conversionEvents: 1
        })
      );
    });

    it('should return 400 when customerId is missing in POST request', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          events: []
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('customerId is required');
    });

    it('should handle empty events array', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          customerId: 'cust_123',
          events: []
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.eventsProcessed).toBe(0);
    });
  });

  describe('Authentication and Rate Limiting', () => {
    it('should return 401 for invalid API key', async () => {
      validateApiKey.mockResolvedValue({
        valid: false,
        clientId: '',
        apiKey: 'invalid_key'
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { customerId: 'cust_123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Invalid API key');
    });

    it('should return 429 when rate limit is exceeded', async () => {
      rateLimitCheck.mockResolvedValue({
        allowed: false,
        resetTime: Date.now() + 60000,
        remainingRequests: 0
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { customerId: 'cust_123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(429);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Rate limit exceeded');
      expect(data.resetTime).toBeDefined();
    });

    it('should pass API key validation and rate limiting', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { customerId: 'cust_123' },
        headers: {
          authorization: 'Bearer test_key_123'
        }
      });

      await handler(req, res);

      expect(validateApiKey).toHaveBeenCalledWith(req);
      expect(rateLimitCheck).toHaveBeenCalledWith(req, 'test_client');
      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('HTTP Methods', () => {
    it('should return 405 for unsupported methods', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { customerId: 'cust_123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Method DELETE not allowed');
      expect(res._getHeaders()).toMatchObject({
        allow: ['GET', 'POST']
      });
    });

    it('should handle PUT method as unsupported', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { customerId: 'cust_123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      validateApiKey.mockRejectedValue(new Error('Auth service error'));

      const { req, res } = createMocks({
        method: 'GET',
        query: { customerId: 'cust_123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Internal server error');
    });

    it('should handle rate limiting errors gracefully', async () => {
      rateLimitCheck.mockRejectedValue(new Error('Rate limit service error'));

      const { req, res } = createMocks({
        method: 'GET',
        query: { customerId: 'cust_123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });

    it('should handle analytics constructor errors', async () => {
      mockAnalytics.mockImplementation(() => {
        throw new Error('Analytics initialization error');
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { customerId: 'cust_123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });
  });

  describe('Data Validation', () => {
    it('should handle malformed request body in POST', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          customerId: 'cust_123',
          events: 'invalid_array'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200); // Should still process with fallback behavior
      const data = JSON.parse(res._getData());
      expect(data.eventsProcessed).toBe(0);
    });

    it('should handle special characters in customerId', async () => {
      const customerId = 'cust_123!@#$%^&*()';
      const { req, res } = createMocks({
        method: 'GET',
        query: { customerId }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.customerId).toBe(customerId);
    });

    it('should handle very long customerId', async () => {
      const customerId = 'a'.repeat(1000);
      const { req, res } = createMocks({
        method: 'GET',
        query: { customerId }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockAnalytics.prototype.analyzeCustomer).toHaveBeenCalledWith(
        customerId,
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('Industry-Specific Behavior', () => {
    it('should handle college_consulting industry correctly', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          customerId: 'cust_123',
          industry: 'college_consulting'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.metadata.industry).toBe('college_consulting');
    });

    it('should handle ecommerce industry correctly', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          customerId: 'cust_123',
          industry: 'ecommerce'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockAnalytics.prototype.getIndustryMetrics).toHaveBeenCalledWith(
        'cust_123',
        'ecommerce'
      );
    });

    it('should default to generic when no industry provided', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          customerId: 'cust_123'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.metadata.industry).toBe('generic');
      expect(data.industryAnalytics).toBeNull();
    });
  });

  describe('Performance Tests', () => {
    it('should complete request within reasonable time', async () => {
      const startTime = Date.now();

      const { req, res } = createMocks({
        method: 'GET',
        query: { customerId: 'cust_123' }
      });

      await handler(req, res);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(res._getStatusCode()).toBe(200);
    });

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(10).fill(null).map(() =>
        createMocks({
          method: 'GET',
          query: { customerId: `cust_${Math.random()}` }
        })
      );

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(({ req, res }) => handler(req, res))
      );
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // All 10 requests within 2 seconds
      results.forEach((_, index) => {
        expect(requests[index].res._getStatusCode()).toBe(200);
      });
    });
  });
});
