import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Redis } from 'ioredis';
import {
    ABTestAutoConfigurationService,
    createABTestAutoConfigurationService,
    CustomerProfile
} from '../services/ab-test-auto-configuration-service';

// Mock Redis client
const mockRedis = {
  hgetall: jest.fn(),
  hset: jest.fn(),
  sadd: jest.fn(),
  smembers: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  status: 'ready'
} as unknown as Redis;

describe('ABTestAutoConfigurationService', () => {
  let service: ABTestAutoConfigurationService;
  let mockCustomerProfile: CustomerProfile;

  beforeEach(() => {
    service = createABTestAutoConfigurationService(mockRedis);

    mockCustomerProfile = {
      id: 'customer_123',
      companyName: 'Test Company',
      industry: 'saas',
      businessModel: 'b2b',
      currentConversionRate: 0.05,
      monthlyTraffic: 50000,
      primaryGoals: ['conversion', 'revenue'],
      riskTolerance: 'moderate',
      questionnaire: {
        primaryGoal: 'increase_signups',
        currentChallenges: ['low_conversion', 'user_experience']
      }
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('autoConfigureTest', () => {
    it('should successfully configure an A/B test for a customer', async () => {
      // Mock customer profile retrieval
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'Test Company',
        industry: 'saas',
        businessModel: 'b2b',
        currentConversionRate: '0.05',
        monthlyTraffic: '50000',
        primaryGoals: '["conversion", "revenue"]',
        riskTolerance: 'moderate',
        questionnaire: '{"primaryGoal": "increase_signups"}'
      });

      // Mock Redis operations for storing test
      (mockRedis.hset as jest.MockedFunction<any>).mockResolvedValue(1);
      (mockRedis.sadd as jest.MockedFunction<any>).mockResolvedValue(1);

      const result = await service.autoConfigureTest('customer_123');

      expect(result).toBeDefined();
      expect(result.customerId).toBe('customer_123');
      expect(result.name).toContain('Test Company');
      expect(result.status).toBe('configured');
      expect(result.configuration).toBeDefined();
      expect(result.variations).toHaveLength(2);
      expect(result.variations[0].isControl).toBe(true);
      expect(result.variations[1].isControl).toBe(false);
    });

    it('should throw error when customer profile is not found', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({});

      await expect(service.autoConfigureTest('nonexistent_customer'))
        .rejects.toThrow('Customer profile not found: nonexistent_customer');
    });

    it('should configure test with specific template when provided', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'Test Company',
        industry: 'ecommerce',
        businessModel: 'b2c',
        currentConversionRate: '0.03',
        monthlyTraffic: '100000',
        primaryGoals: '["conversion"]',
        riskTolerance: 'aggressive',
        questionnaire: '{}'
      });

      (mockRedis.hset as jest.MockedFunction<any>).mockResolvedValue(1);
      (mockRedis.sadd as jest.MockedFunction<any>).mockResolvedValue(1);

      const result = await service.autoConfigureTest('customer_123', 'custom_template_123');

      expect(result.templateId).toBe('custom_template_123');
    });

    it('should auto-launch test when option is enabled', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'Test Company',
        industry: 'saas',
        businessModel: 'b2b',
        currentConversionRate: '0.05',
        monthlyTraffic: '50000',
        primaryGoals: '["conversion"]',
        riskTolerance: 'moderate',
        questionnaire: '{}'
      });

      (mockRedis.hset as jest.MockedFunction<any>).mockResolvedValue(1);
      (mockRedis.sadd as jest.MockedFunction<any>).mockResolvedValue(1);

      const result = await service.autoConfigureTest('customer_123', undefined, {
        autoLaunch: true
      });

      expect(result.status).toBe('launched');
      expect(result.launchedAt).toBeDefined();
    });
  });

  describe('launchTest', () => {
    it('should successfully launch a configured test', async () => {
      const mockTest = {
        id: 'auto_customer_123_1234567890',
        name: 'Test Auto Config',
        description: 'Auto-configured test',
        templateId: 'saas_trial_conversion',
        customerId: 'customer_123',
        configuration: {
          trafficAllocation: 50,
          trafficSplit: { control: 50, variation_1: 50 },
          duration: 14,
          minimumSampleSize: 1000,
          confidenceLevel: 0.95,
          targetMetrics: []
        },
        variations: [],
        status: 'configured',
        createdAt: '2024-01-01T00:00:00.000Z',
        launchedAt: ''
      };

      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue(mockTest);
      (mockRedis.hset as jest.MockedFunction<any>).mockResolvedValue(1);

      const result = await service.launchTest('auto_customer_123_1234567890');

      expect(result.success).toBe(true);
      expect(result.testId).toBe('auto_customer_123_1234567890');
    });

    it('should fail to launch non-existent test', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({});

      const result = await service.launchTest('nonexistent_test');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Test not found');
    });
  });

  describe('rollbackTest', () => {
    it('should successfully rollback a test', async () => {
      const mockTest = {
        id: 'auto_customer_123_1234567890',
        status: 'launched',
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue(mockTest);
      (mockRedis.hset as jest.MockedFunction<any>).mockResolvedValue(1);

      const result = await service.rollbackTest('auto_customer_123_1234567890', 'Performance issues');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Performance issues');
    });

    it('should fail to rollback non-existent test', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({});

      const result = await service.rollbackTest('nonexistent_test', 'Test reason');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Test not found');
    });
  });

  describe('getCustomerTests', () => {
    it('should retrieve all tests for a customer', async () => {
      const testIds = ['test_1', 'test_2'];
      const mockTest1 = {
        id: 'test_1',
        customerId: 'customer_123',
        name: 'Test 1',
        status: 'launched',
        configuration: '{}',
        variations: '[]',
        createdAt: '2024-01-01T00:00:00.000Z',
        launchedAt: '2024-01-01T01:00:00.000Z'
      };
      const mockTest2 = {
        id: 'test_2',
        customerId: 'customer_123',
        name: 'Test 2',
        status: 'configured',
        configuration: '{}',
        variations: '[]',
        createdAt: '2024-01-02T00:00:00.000Z',
        launchedAt: ''
      };

      (mockRedis.smembers as jest.MockedFunction<any>).mockResolvedValue(testIds);
      (mockRedis.hgetall as jest.MockedFunction<any>)
        .mockResolvedValueOnce(mockTest1)
        .mockResolvedValueOnce(mockTest2);

      const result = await service.getCustomerTests('customer_123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test_2'); // More recent first
      expect(result[1].id).toBe('test_1');
    });

    it('should return empty array for customer with no tests', async () => {
      (mockRedis.smembers as jest.MockedFunction<any>).mockResolvedValue([]);

      const result = await service.getCustomerTests('customer_123');

      expect(result).toHaveLength(0);
    });
  });

  describe('configuration calculations', () => {
    it('should calculate appropriate sample size based on customer profile', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'Test Company',
        industry: 'saas',
        businessModel: 'b2b',
        currentConversionRate: '0.02', // Low conversion rate
        monthlyTraffic: '10000', // Low traffic
        primaryGoals: '["conversion"]',
        riskTolerance: 'conservative',
        questionnaire: '{}'
      });

      (mockRedis.hset as jest.MockedFunction<any>).mockResolvedValue(1);
      (mockRedis.sadd as jest.MockedFunction<any>).mockResolvedValue(1);

      const result = await service.autoConfigureTest('customer_123');

      expect(result.configuration.minimumSampleSize).toBeGreaterThanOrEqual(1000);
      expect(result.configuration.trafficAllocation).toBe(20); // Conservative
      expect(result.configuration.confidenceLevel).toBe(0.99); // Conservative
    });

    it('should adjust configuration for aggressive risk tolerance', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'Test Company',
        industry: 'saas',
        businessModel: 'b2b',
        currentConversionRate: '0.08',
        monthlyTraffic: '200000',
        primaryGoals: '["conversion"]',
        riskTolerance: 'aggressive',
        questionnaire: '{}'
      });

      (mockRedis.hset as jest.MockedFunction<any>).mockResolvedValue(1);
      (mockRedis.sadd as jest.MockedFunction<any>).mockResolvedValue(1);

      const result = await service.autoConfigureTest('customer_123');

      expect(result.configuration.trafficAllocation).toBe(80); // Aggressive
      expect(result.configuration.confidenceLevel).toBe(0.90); // Aggressive
    });
  });

  describe('template selection', () => {
    it('should select appropriate template based on industry', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'Test Company',
        industry: 'ecommerce',
        businessModel: 'b2c',
        currentConversionRate: '0.05',
        monthlyTraffic: '50000',
        primaryGoals: '["conversion"]',
        riskTolerance: 'moderate',
        questionnaire: '{}'
      });

      (mockRedis.hset as jest.MockedFunction<any>).mockResolvedValue(1);
      (mockRedis.sadd as jest.MockedFunction<any>).mockResolvedValue(1);

      const result = await service.autoConfigureTest('customer_123');

      expect(result.templateId).toBe('ecommerce_checkout_optimization');
    });

    it('should use default template for unknown industry', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'Test Company',
        industry: 'unknown_industry',
        businessModel: 'b2b',
        currentConversionRate: '0.05',
        monthlyTraffic: '50000',
        primaryGoals: '["conversion"]',
        riskTolerance: 'moderate',
        questionnaire: '{}'
      });

      (mockRedis.hset as jest.MockedFunction<any>).mockResolvedValue(1);
      (mockRedis.sadd as jest.MockedFunction<any>).mockResolvedValue(1);

      const result = await service.autoConfigureTest('customer_123');

      expect(result.templateId).toBe('default_conversion_optimization');
    });
  });

  describe('error handling', () => {
    it('should handle Redis errors gracefully', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockRejectedValue(new Error('Redis connection failed'));

      await expect(service.autoConfigureTest('customer_123'))
        .rejects.toThrow('Customer profile not found: customer_123');
    });

    it('should handle malformed customer data', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'Test Company',
        industry: 'saas',
        currentConversionRate: 'invalid_number',
        monthlyTraffic: 'invalid_number',
        primaryGoals: 'invalid_json',
        riskTolerance: 'moderate',
        questionnaire: 'invalid_json'
      });

      (mockRedis.hset as jest.MockedFunction<any>).mockResolvedValue(1);
      (mockRedis.sadd as jest.MockedFunction<any>).mockResolvedValue(1);

      const result = await service.autoConfigureTest('customer_123');

      // Should use default values for invalid data
      expect(result.configuration.minimumSampleSize).toBeGreaterThanOrEqual(1000);
      expect(result.variations).toHaveLength(2);
    });
  });

  describe('variation generation', () => {
    it('should generate appropriate variations for the customer profile', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'Test Company',
        industry: 'fintech',
        businessModel: 'b2b',
        currentConversionRate: '0.05',
        monthlyTraffic: '50000',
        primaryGoals: '["conversion"]',
        riskTolerance: 'moderate',
        questionnaire: '{}'
      });

      (mockRedis.hset as jest.MockedFunction<any>).mockResolvedValue(1);
      (mockRedis.sadd as jest.MockedFunction<any>).mockResolvedValue(1);

      const result = await service.autoConfigureTest('customer_123');

      expect(result.variations).toHaveLength(2);

      const control = result.variations.find(v => v.isControl);
      const variation = result.variations.find(v => !v.isControl);

      expect(control).toBeDefined();
      expect(control!.name).toBe('Control (Original)');
      expect(control!.trafficAllocation).toBe(50);
      expect(control!.expectedLift).toBe(0);

      expect(variation).toBeDefined();
      expect(variation!.name).toBe('Optimized Version');
      expect(variation!.description).toContain('fintech');
      expect(variation!.trafficAllocation).toBe(50);
      expect(variation!.expectedLift).toBe(15);
    });
  });
});

describe('Factory Function', () => {
  it('should create ABTestAutoConfigurationService instance', () => {
    const service = createABTestAutoConfigurationService(mockRedis);
    expect(service).toBeInstanceOf(ABTestAutoConfigurationService);
  });
});
