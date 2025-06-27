import { EnterpriseInfrastructureService, defaultEnterpriseConfig } from '../services/enterprise-infrastructure-service';

// Mock the redis-client module before any imports
jest.mock('../services/redis-client', () => ({
  redisManager: {
    getClient: jest.fn(),
    getSubscriber: jest.fn(),
    getPublisher: jest.fn(),
    isHealthy: jest.fn(() => true),
    healthCheck: jest.fn(() => Promise.resolve({ status: 'healthy', latency: 1 })),
    disconnect: jest.fn(() => Promise.resolve()),
  }
}));

import { redisManager } from '../services/redis-client';

describe('EnterpriseInfrastructureService', () => {
  let service: EnterpriseInfrastructureService;
  let mockRedisClient: any;

  beforeEach(() => {
    // Create a mock Redis client for each test
    mockRedisClient = {
      hset: jest.fn().mockResolvedValue('OK'),
      zadd: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      lpush: jest.fn().mockResolvedValue(1),
      ltrim: jest.fn().mockResolvedValue('OK'),
      lrange: jest.fn().mockResolvedValue([]),
      zrange: jest.fn().mockResolvedValue([]),
      hgetall: jest.fn().mockResolvedValue({}),
    };

    // Set up the mock to return our mock client
    (redisManager.getClient as jest.Mock).mockReturnValue(mockRedisClient);

    jest.clearAllMocks();
    service = new EnterpriseInfrastructureService(defaultEnterpriseConfig);
  });

  afterEach(async () => {
    if (service) {
      await service.shutdown();
    }
  });

  describe('Service Initialization', () => {
    it('should initialize successfully with default config', async () => {
      const initSpy = jest.spyOn(service, 'emit');

      await service.initialize();

      expect(initSpy).toHaveBeenCalledWith('infrastructure:initialized');
      expect(mockRedisClient.hset).toHaveBeenCalledWith('infrastructure:monitoring', expect.any(Object));
      expect(mockRedisClient.hset).toHaveBeenCalledWith('infrastructure:scaling', expect.any(Object));
    });

    it('should handle initialization errors gracefully', async () => {
      mockRedisClient.hset.mockRejectedValueOnce(new Error('Redis connection failed'));

      await expect(service.initialize()).rejects.toThrow('Redis connection failed');
    });
  });

  describe('Status Reporting', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return comprehensive infrastructure status', async () => {
      const status = await service.getStatus();

      expect(status).toHaveProperty('overall');
      expect(status).toHaveProperty('instances');
      expect(status).toHaveProperty('metrics');
      expect(status).toHaveProperty('uptime');

      expect(status.overall).toMatch(/^(healthy|degraded|critical)$/);
      expect(status.instances).toHaveProperty('active');
      expect(status.instances).toHaveProperty('healthy');
      expect(status.instances).toHaveProperty('total');
      expect(status.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include A/B testing custom metrics', async () => {
      // Force metrics collection to populate systemMetrics array
      await service.forceMetricsCollection();

      const status = await service.getStatus();

      expect(status.metrics.customMetrics).toHaveProperty('abTestsActive');
      expect(status.metrics.customMetrics).toHaveProperty('psychographicProfiles');
      expect(status.metrics.customMetrics).toHaveProperty('personalizationsPerSecond');
      expect(status.metrics.customMetrics).toHaveProperty('mlModelAccuracy');
    });
  });

  describe('Metrics Collection', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return metrics for different timeframes', async () => {
      // Mock zrange to return some sample metrics data
      const sampleMetrics = JSON.stringify({
        timestamp: new Date().toISOString(),
        cpuUtilization: 45,
        memoryUtilization: 60,
        responseTime: 120,
        errorRate: 0.5,
        throughput: 800,
        activeConnections: 5000,
        customMetrics: {
          abTestsActive: 15,
          psychographicProfiles: 750000,
          personalizationsPerSecond: 5000,
          mlModelAccuracy: 0.95
        }
      });

      mockRedisClient.zrange.mockResolvedValue([sampleMetrics]);

      const hourMetrics = await service.getMetrics('hour');
      const dayMetrics = await service.getMetrics('day');
      const weekMetrics = await service.getMetrics('week');

      expect(Array.isArray(hourMetrics)).toBe(true);
      expect(Array.isArray(dayMetrics)).toBe(true);
      expect(Array.isArray(weekMetrics)).toBe(true);
    });
  });

  describe('Service Lifecycle', () => {
    it('should shutdown gracefully', async () => {
      await service.initialize();
      const shutdownSpy = jest.spyOn(service, 'emit');

      await service.shutdown();

      expect(shutdownSpy).toHaveBeenCalledWith('infrastructure:shutdown');
    });
  });
});

describe('Default Enterprise Configuration', () => {
  it('should have sensible defaults for enterprise scale', () => {
    expect(defaultEnterpriseConfig.scaling.minInstances).toBeGreaterThan(1);
    expect(defaultEnterpriseConfig.scaling.maxInstances).toBeGreaterThan(10);
    expect(defaultEnterpriseConfig.scaling.autoScaling).toBe(true);
  });

  it('should have security compliance enabled', () => {
    expect(defaultEnterpriseConfig.security.compliance.gdprCompliant).toBe(true);
    expect(defaultEnterpriseConfig.security.compliance.hipaaCompliant).toBe(true);
    expect(defaultEnterpriseConfig.security.compliance.auditLogging).toBe(true);
  });
});
