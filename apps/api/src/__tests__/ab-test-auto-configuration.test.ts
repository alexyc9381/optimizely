import { Redis } from 'ioredis';
import { createABTestAutoConfigurationService } from '../services/ab-test-auto-configuration-service';

// Mock Redis client with all required methods
const mockRedis = {
  hgetall: jest.fn(),
  hset: jest.fn(),
  sadd: jest.fn(),
  smembers: jest.fn(),
  setex: jest.fn(),
  lpush: jest.fn(),
  expire: jest.fn(),
  lrange: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
} as jest.Mocked<Partial<Redis>>;

describe('ABTestAutoConfigurationService', () => {
  let service: any;

  beforeEach(() => {
    service = createABTestAutoConfigurationService(mockRedis as Redis);

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock values for all Redis methods
    (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({});
    (mockRedis.hset as jest.MockedFunction<any>).mockResolvedValue(1);
    (mockRedis.sadd as jest.MockedFunction<any>).mockResolvedValue(1);
    (mockRedis.smembers as jest.MockedFunction<any>).mockResolvedValue([]);
    (mockRedis.setex as jest.MockedFunction<any>).mockResolvedValue('OK');
    (mockRedis.lpush as jest.MockedFunction<any>).mockResolvedValue(1);
    (mockRedis.expire as jest.MockedFunction<any>).mockResolvedValue(1);
    (mockRedis.lrange as jest.MockedFunction<any>).mockResolvedValue([]);
    (mockRedis.get as jest.MockedFunction<any>).mockResolvedValue(null);
    (mockRedis.del as jest.MockedFunction<any>).mockResolvedValue(1);
  });

  describe('autoConfigureTest', () => {
    it('should successfully configure an A/B test for a customer', async () => {
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

      const result = await service.autoConfigureTest('customer_123', undefined, {
        autoLaunch: true,
        skipSafetyChecks: true
      });

      expect(result.status).toBe('launched');
      expect(result.launchedAt).toBeDefined();
    });
  });

  describe('launchTest', () => {
    it('should successfully launch a configured test', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'auto_customer_123_1234567890',
        status: 'configured',
        customerId: 'customer_123',
        configuration: JSON.stringify({
          trafficAllocation: 50,
          trafficSplit: { control: 50, variation_1: 50 },
          duration: 14
        }),
        variations: JSON.stringify([
          { id: 'control', name: 'Control', isControl: true },
          { id: 'variation_1', name: 'Variation 1', isControl: false }
        ]),
        createdAt: new Date().toISOString()
      });

      const result = await service.launchTest('auto_customer_123_1234567890');

      expect(result.success).toBe(true);
      expect(result.testId).toBe('auto_customer_123_1234567890');
    });

    it('should fail to launch non-existent test', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({});

      const result = await service.launchTest('non_existent_test');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Test not found: non_existent_test');
    });
  });

  describe('rollbackTest', () => {
    it('should successfully rollback a test', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'auto_customer_123_1234567890',
        status: 'launched',
        customerId: 'customer_123',
        configuration: JSON.stringify({}),
        variations: JSON.stringify([]),
        createdAt: new Date().toISOString(),
        launchedAt: new Date().toISOString()
      });

      const result = await service.rollbackTest('auto_customer_123_1234567890', 'Performance issues');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Performance issues');
    });

    it('should fail to rollback non-existent test', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({});

      const result = await service.rollbackTest('non_existent_test', 'Test reason');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Rollback failed');
    });
  });

  describe('getCustomerTests', () => {
    it('should retrieve all tests for a customer', async () => {
      (mockRedis.smembers as jest.MockedFunction<any>).mockResolvedValue(['test1', 'test2']);
      (mockRedis.hgetall as jest.MockedFunction<any>)
        .mockResolvedValueOnce({
          id: 'test1',
          customerId: 'customer_123',
          configuration: JSON.stringify({}),
          variations: JSON.stringify([]),
          createdAt: new Date().toISOString()
        })
        .mockResolvedValueOnce({
          id: 'test2',
          customerId: 'customer_123',
          configuration: JSON.stringify({}),
          variations: JSON.stringify([]),
          createdAt: new Date().toISOString()
        });

      const tests = await service.getCustomerTests('customer_123');

      expect(tests).toHaveLength(2);
      expect(tests[0].id).toBe('test1');
      expect(tests[1].id).toBe('test2');
    });

    it('should return empty array for customer with no tests', async () => {
      (mockRedis.smembers as jest.MockedFunction<any>).mockResolvedValue([]);

      const tests = await service.getCustomerTests('customer_123');

      expect(tests).toHaveLength(0);
    });
  });

  describe('configuration calculations', () => {
    it('should calculate appropriate sample size based on customer profile', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'Test Company',
        industry: 'saas',
        businessModel: 'b2b',
        currentConversionRate: '0.08',
        monthlyTraffic: '75000',
        primaryGoals: '["conversion"]',
        riskTolerance: 'moderate',
        questionnaire: '{}'
      });

      const result = await service.autoConfigureTest('customer_123');

      expect(result.configuration.minimumSampleSize).toBeDefined();
      expect(result.configuration.minimumSampleSize).toBeGreaterThan(1000);
    });

    it('should adjust configuration for aggressive risk tolerance', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'Test Company',
        industry: 'saas',
        businessModel: 'b2b',
        currentConversionRate: '0.05',
        monthlyTraffic: '50000',
        primaryGoals: '["conversion"]',
        riskTolerance: 'aggressive',
        questionnaire: '{}'
      });

      const result = await service.autoConfigureTest('customer_123');

      expect(result.configuration.trafficAllocation).toBe(80);
      expect(result.configuration.confidenceLevel).toBe(0.90);
    });
  });

  describe('template selection', () => {
    it('should select appropriate template based on industry', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'E-commerce Store',
        industry: 'ecommerce',
        businessModel: 'b2c',
        currentConversionRate: '0.03',
        monthlyTraffic: '100000',
        primaryGoals: '["conversion"]',
        riskTolerance: 'moderate',
        questionnaire: '{}'
      });

      const result = await service.autoConfigureTest('customer_123');

      expect(result.templateId).toBeDefined();
      expect(typeof result.templateId).toBe('string');
    });

    it('should use default template for unknown industry', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'Unknown Industry Company',
        industry: 'unknown',
        businessModel: 'b2b',
        currentConversionRate: '0.05',
        monthlyTraffic: '25000',
        primaryGoals: '["conversion"]',
        riskTolerance: 'moderate',
        questionnaire: '{}'
      });

      const result = await service.autoConfigureTest('customer_123');

      expect(result.templateId).toBeDefined();
      expect(typeof result.templateId).toBe('string');
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
        businessModel: 'b2b',
        currentConversionRate: 'invalid_number',
        monthlyTraffic: 'invalid_number',
        primaryGoals: 'invalid_json',
        riskTolerance: 'moderate',
        questionnaire: 'invalid_json'
      });

      await expect(service.autoConfigureTest('customer_123'))
        .rejects.toThrow('Customer profile not found: customer_123');
    });
  });

  describe('variation generation', () => {
    it('should generate appropriate variations for the customer profile', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'Healthcare Provider',
        industry: 'healthcare',
        businessModel: 'b2b',
        currentConversionRate: '0.05',
        monthlyTraffic: '30000',
        primaryGoals: '["conversion", "trust"]',
        riskTolerance: 'conservative',
        questionnaire: '{}'
      });

      const result = await service.autoConfigureTest('customer_123');

      expect(result.variations).toHaveLength(2);
      expect(result.variations[0].isControl).toBe(true);
      expect(result.variations[1].isControl).toBe(false);
      expect(result.variations[1].description).toContain('healthcare');
    });
  });

  describe('Enhanced Safety Features', () => {
    it('should perform comprehensive safety validation before launch', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>)
        .mockResolvedValueOnce({
          id: 'customer_123',
          companyName: 'Test Company',
          industry: 'saas',
          businessModel: 'b2b',
          currentConversionRate: '0.05',
          monthlyTraffic: '50000',
          primaryGoals: '["conversion"]',
          riskTolerance: 'moderate',
          questionnaire: '{}'
        })
        .mockResolvedValueOnce({
          id: 'test_123',
          customerId: 'customer_123',
          configuration: JSON.stringify({
            minimumSampleSize: 2000,
            duration: 14,
            trafficAllocation: 50
          }),
          variations: JSON.stringify([]),
          createdAt: new Date().toISOString()
        })
        .mockResolvedValue({
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

      const result = await service.autoConfigureTest('customer_123', undefined, {
        autoLaunch: false
      });

      const validation = await service.validateTestSafety(result.id);

      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.safetyChecks).toBeDefined();
      expect(validation.safetyChecks.length).toBeGreaterThan(0);
    });

    it('should block launch when safety checks fail', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_low_traffic',
        companyName: 'Low Traffic Company',
        industry: 'saas',
        businessModel: 'b2b',
        currentConversionRate: '0.05',
        monthlyTraffic: '100',
        primaryGoals: '["conversion"]',
        riskTolerance: 'moderate',
        questionnaire: '{}'
      });

      await expect(service.autoConfigureTest('customer_low_traffic', undefined, {
        autoLaunch: true,
        skipSafetyChecks: false
      })).rejects.toThrow(/Launch blocked due to safety issues/);
    });

    it('should allow launch when safety checks are skipped', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_low_traffic',
        companyName: 'Low Traffic Company',
        industry: 'saas',
        businessModel: 'b2b',
        currentConversionRate: '0.05',
        monthlyTraffic: '100',
        primaryGoals: '["conversion"]',
        riskTolerance: 'moderate',
        questionnaire: '{}'
      });

      const result = await service.autoConfigureTest('customer_low_traffic', undefined, {
        autoLaunch: true,
        skipSafetyChecks: true
      });

      expect(result.status).toBe('launched');
      expect(result.launchedAt).toBeDefined();
    });

    it('should detect test conflicts when too many tests are running', async () => {
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

      (mockRedis.smembers as jest.MockedFunction<any>).mockResolvedValue(['test1', 'test2', 'test3', 'test4']);
      (mockRedis.hgetall as jest.MockedFunction<any>)
        .mockResolvedValueOnce({
          id: 'customer_123',
          companyName: 'Test Company',
          industry: 'saas',
          businessModel: 'b2b',
          currentConversionRate: '0.05',
          monthlyTraffic: '50000',
          primaryGoals: '["conversion"]',
          riskTolerance: 'moderate',
          questionnaire: '{}'
        })
        .mockResolvedValue({
          id: 'test1',
          status: 'running',
          customerId: 'customer_123',
          configuration: JSON.stringify({}),
          variations: JSON.stringify([]),
          createdAt: new Date().toISOString()
        });

      await expect(service.autoConfigureTest('customer_123', undefined, {
        autoLaunch: true,
        skipSafetyChecks: false
      })).rejects.toThrow(/Too many concurrent tests/);
    });

    it('should setup automated monitoring after launch', async () => {
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

      const result = await service.autoConfigureTest('customer_123', undefined, {
        autoLaunch: true,
        skipSafetyChecks: true
      });

      expect(result.status).toBe('launched');
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('monitoring:'),
        7 * 24 * 60 * 60,
        expect.any(String)
      );
    });

    it('should store rollback metadata with enhanced rollback', async () => {
      const testId = 'test_123';
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: testId,
        status: 'launched',
        customerId: 'customer_123',
        configuration: JSON.stringify({}),
        variations: JSON.stringify([]),
        createdAt: new Date().toISOString(),
        launchedAt: new Date().toISOString()
      });

      const result = await service.rollbackTestWithSafety(testId, 'Performance issues detected', true);

      expect(result.success).toBe(true);
      expect(result.message).toContain('automatic');
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `rollback:${testId}`,
        30 * 24 * 60 * 60,
        expect.any(String)
      );
      expect(mockRedis.del).toHaveBeenCalledWith(`monitoring:${testId}`);
    });

    it('should log safety warnings when they exist', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'Test Company',
        industry: 'healthcare',
        businessModel: 'b2b',
        currentConversionRate: '0.05',
        monthlyTraffic: '25000',
        primaryGoals: '["conversion"]',
        riskTolerance: 'aggressive',
        questionnaire: '{}'
      });

      const result = await service.autoConfigureTest('customer_123', undefined, {
        autoLaunch: true,
        skipSafetyChecks: false
      });

      expect(result.status).toBe('launched');
      expect(mockRedis.lpush).toHaveBeenCalledWith(
        expect.stringContaining('safety_warnings:'),
        expect.any(String)
      );
      expect(mockRedis.expire).toHaveBeenCalledWith(
        expect.stringContaining('safety_warnings:'),
        30 * 24 * 60 * 60
      );
    });

    it('should retrieve safety warnings for a test', async () => {
      const testId = 'test_123';
      const mockWarnings = [
        JSON.stringify({
          testId,
          warnings: ['High traffic allocation may impact user experience'],
          timestamp: new Date().toISOString()
        })
      ];

      (mockRedis.lrange as jest.MockedFunction<any>).mockResolvedValue(mockWarnings);

      const warnings = await service.getSafetyWarnings(testId);

      expect(warnings).toHaveLength(1);
      expect(warnings[0].testId).toBe(testId);
      expect(warnings[0].warnings).toContain('High traffic allocation may impact user experience');
    });

    it('should retrieve monitoring status for a test', async () => {
      const testId = 'test_123';
      const mockMonitoring = {
        testId,
        checkInterval: 3600,
        enabled: true,
        alertThresholds: {
          maxErrorRate: 0.05,
          minConversionRate: 0.001,
          maxPerformanceImpact: 0.15
        },
        createdAt: new Date().toISOString()
      };

      (mockRedis.get as jest.MockedFunction<any>).mockResolvedValue(JSON.stringify(mockMonitoring));

      const monitoring = await service.getMonitoringStatus(testId);

      expect(monitoring).toBeDefined();
      expect(monitoring.testId).toBe(testId);
      expect(monitoring.enabled).toBe(true);
      expect(monitoring.alertThresholds).toBeDefined();
    });

    it('should use enhanced template selection with template service integration', async () => {
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: 'customer_123',
        companyName: 'Test Company',
        industry: 'fintech',
        businessModel: 'b2b',
        currentConversionRate: '0.03',
        monthlyTraffic: '75000',
        primaryGoals: '["conversion", "trust"]',
        riskTolerance: 'conservative',
        questionnaire: '{"compliance": true}'
      });

      const result = await service.autoConfigureTest('customer_123');

      expect(result.templateId).toBeDefined();
      expect(typeof result.templateId).toBe('string');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility for launchTest method', async () => {
      const testId = 'test_123';
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: testId,
        status: 'configured',
        customerId: 'customer_123',
        configuration: JSON.stringify({}),
        variations: JSON.stringify([]),
        createdAt: new Date().toISOString()
      });

      const result = await service.launchTest(testId);

      expect(result.success).toBe(true);
      expect(result.testId).toBe(testId);
      expect(result.message).toContain('safety monitoring enabled');
    });

    it('should maintain backward compatibility for rollbackTest method', async () => {
      const testId = 'test_123';
      (mockRedis.hgetall as jest.MockedFunction<any>).mockResolvedValue({
        id: testId,
        status: 'launched',
        customerId: 'customer_123',
        configuration: JSON.stringify({}),
        variations: JSON.stringify([]),
        createdAt: new Date().toISOString(),
        launchedAt: new Date().toISOString()
      });

      const result = await service.rollbackTest(testId, 'Manual rollback');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Manual rollback');
      expect(result.message).not.toContain('automatic');
    });
  });
});

describe('Factory Function', () => {
  it('should create ABTestAutoConfigurationService instance', () => {
    const redis = mockRedis as Redis;
    const service = createABTestAutoConfigurationService(redis);

    expect(service).toBeDefined();
    expect(typeof service.autoConfigureTest).toBe('function');
  });
});
