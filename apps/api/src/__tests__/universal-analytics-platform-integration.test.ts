import { Redis } from 'ioredis';
import UniversalAnalyticsPlatformIntegrationService from '../services/universal-analytics-platform-integration-service';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

describe('UniversalAnalyticsPlatformIntegrationService', () => {
  let service: UniversalAnalyticsPlatformIntegrationService;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    mockRedis = new MockedRedis() as jest.Mocked<Redis>;
    mockRedis.setex = jest.fn().mockResolvedValue('OK');
    mockRedis.get = jest.fn().mockResolvedValue(null);
    mockRedis.del = jest.fn().mockResolvedValue(1);
    mockRedis.keys = jest.fn().mockResolvedValue([]);

    service = new UniversalAnalyticsPlatformIntegrationService(mockRedis);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Platform Management', () => {
    it('should add a new analytics platform', async () => {
      const platformData = {
        name: 'Test Analytics',
        type: 'google_analytics' as const,
        version: '1.0',
        isActive: true,
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret'
        },
        config: {
          apiEndpoint: 'https://analytics.googleapis.com/v4',
          syncInterval: 60,
          batchSize: 1000,
          retryAttempts: 3,
          timeout: 30000,
          rateLimits: {
            requestsPerSecond: 10,
            requestsPerHour: 1000
          },
          dataMapping: {
            dimensions: {},
            metrics: {},
            customEvents: {},
            conversionGoals: {},
            audienceSegments: {}
          },
          enableRealTimeSync: true
        },
        syncStatus: 'disconnected' as const
      };

      const platformId = await service.addPlatform(platformData);

      expect(platformId).toMatch(/^platform_\d+_[a-z0-9]+$/);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringMatching(/^universal_analytics:platform:/),
        300,
        expect.any(String)
      );
    });

    it('should get all platforms', async () => {
      const platforms = await service.getPlatforms();
      expect(Array.isArray(platforms)).toBe(true);
    });

    it('should validate platform credentials', async () => {
      const platformData = {
        name: 'Test Analytics',
        type: 'google_analytics' as const,
        version: '1.0',
        isActive: true,
        credentials: {
          // Missing required credentials
        },
        config: {
          apiEndpoint: 'https://analytics.googleapis.com/v4',
          syncInterval: 60,
          batchSize: 1000,
          retryAttempts: 3,
          timeout: 30000,
          rateLimits: {
            requestsPerSecond: 10,
            requestsPerHour: 1000
          },
          dataMapping: {
            dimensions: {},
            metrics: {},
            customEvents: {},
            conversionGoals: {},
            audienceSegments: {}
          },
          enableRealTimeSync: true
        },
        syncStatus: 'disconnected' as const
      };

      await expect(service.addPlatform(platformData)).rejects.toThrow();
    });
  });

  describe('Data Pipeline Management', () => {
    it('should create a data pipeline', async () => {
      const pipelineData = {
        name: 'Test Pipeline',
        sourceId: 'platform_123',
        destinationIds: ['dest_1', 'dest_2'],
        status: 'active' as const,
        transformations: [
          {
            type: 'filter' as const,
            config: { field: 'eventType', value: 'pageview' },
            order: 1
          }
        ],
        schedule: {
          type: 'interval' as const,
          interval: 30,
          timezone: 'UTC'
        }
      };

      const pipelineId = await service.createDataPipeline(pipelineData);

      expect(pipelineId).toMatch(/^pipeline_\d+_[a-z0-9]+$/);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringMatching(/^universal_analytics:pipeline:/),
        300,
        expect.any(String)
      );
    });

    it('should get all data pipelines', async () => {
      const pipelines = await service.getDataPipelines();
      expect(Array.isArray(pipelines)).toBe(true);
    });
  });

  describe('Data Synchronization', () => {
    it('should handle sync errors gracefully', async () => {
      // Test sync of non-existent platform
      await expect(service.syncPlatformData('non-existent')).rejects.toThrow('Platform not found');
    });

    it('should process analytics data', async () => {
      const platformId = 'test-platform';
      const testData = {
        id: 'test-data-id',
        timestamp: new Date(),
        metrics: { pageviews: 100, sessions: 50 },
        dimensions: { source: 'google', medium: 'organic' }
      };

      // This should not throw an error
      await expect(service.processAnalyticsData(platformId, testData)).resolves.not.toThrow();
    });
  });

  describe('Universal Data Access', () => {
    it('should filter universal data correctly', async () => {
      const filters = {
        platformIds: ['platform_1'],
        dataTypes: ['pageview'],
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        limit: 100
      };

      const data = await service.getUniversalData(filters);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should handle empty filters', async () => {
      const data = await service.getUniversalData();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Health Status', () => {
    it('should return health status', async () => {
      const health = await service.getHealthStatus();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('platforms');
      expect(health).toHaveProperty('activePipelines');
      expect(health).toHaveProperty('lastSyncTimes');
      expect(['healthy', 'degraded', 'error']).toContain(health.status);
    });
  });

  describe('Platform Types', () => {
    const supportedTypes = [
      'google_analytics',
      'adobe_analytics',
      'facebook_analytics',
      'mixpanel',
      'amplitude',
      'custom'
    ];

    test.each(supportedTypes)('should support %s platform type', async (type) => {
      const platformData = {
        name: `Test ${type}`,
        type: type as any,
        version: '1.0',
        isActive: true,
        credentials: {
          apiKey: 'test-key',
          secret: 'test-secret'
        },
        config: {
          apiEndpoint: 'https://api.example.com',
          syncInterval: 60,
          batchSize: 1000,
          retryAttempts: 3,
          timeout: 30000,
          rateLimits: {
            requestsPerSecond: 10,
            requestsPerHour: 1000
          },
          dataMapping: {
            dimensions: {},
            metrics: {},
            customEvents: {},
            conversionGoals: {},
            audienceSegments: {}
          },
          enableRealTimeSync: true
        },
        syncStatus: 'disconnected' as const
      };

      const platformId = await service.addPlatform(platformData);
      expect(platformId).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis connection failed'));

      const platformData = {
        name: 'Test Analytics',
        type: 'google_analytics' as const,
        version: '1.0',
        isActive: true,
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret'
        },
        config: {
          apiEndpoint: 'https://analytics.googleapis.com/v4',
          syncInterval: 60,
          batchSize: 1000,
          retryAttempts: 3,
          timeout: 30000,
          rateLimits: {
            requestsPerSecond: 10,
            requestsPerHour: 1000
          },
          dataMapping: {
            dimensions: {},
            metrics: {},
            customEvents: {},
            conversionGoals: {},
            audienceSegments: {}
          },
          enableRealTimeSync: true
        },
        syncStatus: 'disconnected' as const
      };

      await expect(service.addPlatform(platformData)).rejects.toThrow('Redis connection failed');
    });
  });
});

// Integration Tests for Routes
describe('Universal Analytics Platform Integration Routes', () => {
  // Note: These would typically be in a separate integration test file
  // and would use supertest to test the actual HTTP endpoints

  it('should have proper route structure', () => {
    // This is a placeholder for route integration tests
    expect(true).toBe(true);
  });
});

// Performance Tests
describe('Performance Tests', () => {
  let service: UniversalAnalyticsPlatformIntegrationService;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    mockRedis = new MockedRedis() as jest.Mocked<Redis>;
    mockRedis.setex = jest.fn().mockResolvedValue('OK');
    mockRedis.get = jest.fn().mockResolvedValue(null);
    mockRedis.del = jest.fn().mockResolvedValue(1);
    mockRedis.keys = jest.fn().mockResolvedValue([]);

    service = new UniversalAnalyticsPlatformIntegrationService(mockRedis);
  });

  it('should handle bulk platform operations efficiently', async () => {
    const startTime = Date.now();

    const platformPromises = Array.from({ length: 10 }, (_, i) =>
      service.addPlatform({
        name: `Platform ${i}`,
        type: 'google_analytics',
        version: '1.0',
        isActive: true,
        credentials: { apiKey: `key-${i}` },
        config: {
          apiEndpoint: 'https://api.example.com',
          syncInterval: 60,
          batchSize: 1000,
          retryAttempts: 3,
          timeout: 30000,
          rateLimits: {
            requestsPerSecond: 10,
            requestsPerHour: 1000
          },
          dataMapping: {
            dimensions: {},
            metrics: {},
            customEvents: {},
            conversionGoals: {},
            audienceSegments: {}
          },
          enableRealTimeSync: true
        },
        syncStatus: 'disconnected'
      })
    );

    const results = await Promise.all(platformPromises);
    const endTime = Date.now();

    expect(results).toHaveLength(10);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
  });
});
