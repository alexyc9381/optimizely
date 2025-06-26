// Import the event manager instance, not the class
import { eventManager } from '../services/event-manager';

// Mock redis client
jest.mock('../services/redis-client', () => ({
  redisManager: {
    isHealthy: jest.fn()
  }
}));

// Mock Redis and other dependencies
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    incr: jest.fn(),
    lpush: jest.fn(),
    rpop: jest.fn(),
    llen: jest.fn(),
    lrange: jest.fn(),
    lindex: jest.fn(),
    hset: jest.fn(),
    hget: jest.fn(),
    hgetall: jest.fn(),
    pipeline: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([])
    }),
    multi: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([])
    }),
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    publish: jest.fn()
  }));
});

jest.mock('../services/analytics-service', () => ({
  analyticsService: {
    recordMetric: jest.fn(),
    updateCounters: jest.fn(),
    processEvent: jest.fn()
  }
}));

jest.mock('../services/integration-service', () => ({
  integrationService: {
    forwardEvent: jest.fn(),
    getEnabledIntegrations: jest.fn().mockResolvedValue([])
  }
}));

// Mock redis manager for health check
jest.mock('../services/redis-client', () => ({
  redisManager: {
    isHealthy: jest.fn().mockReturnValue(true)
  }
}));

describe('UniversalEventManager', () => {
  let mockRedis: jest.Mocked<{
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    exists: jest.Mock;
    expire: jest.Mock;
    incr: jest.Mock;
    lpush: jest.Mock;
    rpop: jest.Mock;
    llen: jest.Mock;
    lrange: jest.Mock;
    lindex: jest.Mock;
    hset: jest.Mock;
    hget: jest.Mock;
    hgetall: jest.Mock;
    pipeline: jest.Mock;
    multi: jest.Mock;
    on: jest.Mock;
    connect: jest.Mock;
    disconnect: jest.Mock;
    subscribe: jest.Mock;
    unsubscribe: jest.Mock;
    publish: jest.Mock;
  }>;

  beforeEach(() => {
    const Redis = jest.requireMock('ioredis');
    mockRedis = new Redis();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Event Publishing and Subscription', () => {
    const testEvent = {
      id: 'test-event-123',
      type: 'visitor_identified' as const,
      timestamp: Date.now(),
      source: 'web_tracker',
      platform: 'desktop',
      data: {
        sessionId: 'session-123',
        companyId: 'company-456',
        companyName: 'Test Company',
        engagementScore: 85
      }
    };

    test('should publish events successfully', async () => {
      await eventManager.publish(testEvent);

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'events:visitor_identified',
        JSON.stringify(testEvent)
      );
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'events:*',
        JSON.stringify(testEvent)
      );
    });

    test('should subscribe to specific event types', async () => {
      const handler = jest.fn();

      await eventManager.subscribe('visitor_identified', handler);

      expect(mockRedis.subscribe).toHaveBeenCalledWith('events:visitor_identified');
    });

    test('should subscribe to all events with wildcard', async () => {
      const handler = jest.fn();

      await eventManager.subscribeToAll(handler);

      expect(mockRedis.subscribe).toHaveBeenCalledWith('events:*');
    });

    test('should unsubscribe from events', async () => {
      const handler = jest.fn();

      await eventManager.subscribe('visitor_identified', handler);
      await eventManager.unsubscribe('visitor_identified', handler);

      expect(mockRedis.unsubscribe).toHaveBeenCalledWith('events:visitor_identified');
    });
  });

  describe('Visitor Event Helpers', () => {
    test('should emit visitor identified events', async () => {
      const sessionId = 'session-123';
      const eventData = {
        companyId: 'company-456',
        companyName: 'Test Company',
        engagementScore: 85
      };

      await eventManager.emitVisitorEvent('visitor_identified', sessionId, eventData, 'desktop');

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'events:visitor_identified',
        expect.stringContaining(sessionId)
      );
    });

    test('should emit high value session events', async () => {
      const sessionId = 'session-456';
      const eventData = {
        leadScore: 95,
        conversionProbability: 0.75
      };

      await eventManager.emitVisitorEvent('high_value_session', sessionId, eventData);

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'events:high_value_session',
        expect.stringContaining(sessionId)
      );
    });

    test('should emit conversion intent events', async () => {
      const sessionId = 'session-789';
      const eventData = {
        conversionProbability: 0.9,
        engagementScore: 100
      };

      await eventManager.emitVisitorEvent('conversion_intent', sessionId, eventData);

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'events:conversion_intent',
        expect.stringContaining(sessionId)
      );
    });
  });

  describe('Revenue Event Helpers', () => {
    test('should emit revenue prediction events', async () => {
      const companyId = 'company-123';
      const eventData = {
        predictedRevenue: 50000,
        probability: 0.8
      };

      await eventManager.emitRevenueEvent('revenue_prediction', companyId, eventData);

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'events:revenue_prediction',
        expect.stringContaining(companyId)
      );
    });

    test('should emit deal scored events', async () => {
      const companyId = 'company-456';
      const eventData = {
        dealValue: 75000,
        probability: 0.65,
        stage: 'proposal'
      };

      await eventManager.emitRevenueEvent('deal_scored', companyId, eventData);

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'events:deal_scored',
        expect.stringContaining(companyId)
      );
    });

    test('should emit pipeline update events', async () => {
      const companyId = 'company-789';
      const eventData = {
        stage: 'closed_won',
        dealValue: 100000
      };

      await eventManager.emitRevenueEvent('pipeline_update', companyId, eventData);

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'events:pipeline_update',
        expect.stringContaining(companyId)
      );
    });
  });

  describe('System Event Helpers', () => {
    test('should emit cache invalidation events', async () => {
      const eventData = {
        component: 'analytics_cache',
        affectedKeys: ['analytics:companies', 'analytics:revenue']
      };

      await eventManager.emitSystemEvent('cache_invalidated', eventData);

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'events:cache_invalidated',
        expect.stringContaining('analytics_cache')
      );
    });

    test('should emit data update events', async () => {
      const eventData = {
        component: 'company_enrichment',
        affectedKeys: ['company:123', 'company:456']
      };

      await eventManager.emitSystemEvent('data_updated', eventData);

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'events:data_updated',
        expect.stringContaining('company_enrichment')
      );
    });

    test('should emit integration error events', async () => {
      const eventData = {
        component: 'salesforce_integration',
        errorCode: 'AUTH_FAILED'
      };

      await eventManager.emitSystemEvent('integration_error', eventData);

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'events:integration_error',
        expect.stringContaining('AUTH_FAILED')
      );
    });
  });

  describe('Event Statistics', () => {
    test('should get recent events', async () => {
      const mockEventStrings = [
        JSON.stringify({
          id: 'event-1',
          type: 'visitor_identified',
          timestamp: Date.now(),
          source: 'web',
          data: { sessionId: 'session-1' }
        }),
        JSON.stringify({
          id: 'event-2',
          type: 'high_value_session',
          timestamp: Date.now(),
          source: 'web',
          data: { sessionId: 'session-2' }
        })
      ];

      mockRedis.lrange.mockResolvedValue(mockEventStrings);

      const recentEvents = await eventManager.getRecentEvents('visitor_identified', 10);

      expect(recentEvents).toHaveLength(2);
      expect(recentEvents[0].type).toBe('visitor_identified');
      expect(mockRedis.lrange).toHaveBeenCalledWith('recent_events:visitor_identified', 0, 9);
    });

    test('should get all recent events when no type specified', async () => {
      mockRedis.lrange.mockResolvedValue([]);

      await eventManager.getRecentEvents(undefined, 50);

      expect(mockRedis.lrange).toHaveBeenCalledWith('recent_events:all', 0, 49);
    });

    test('should get event statistics', async () => {
      mockRedis.get.mockResolvedValue('1000');
      mockRedis.hgetall.mockResolvedValue({
        'visitor_identified': '500',
        'high_value_session': '300',
        'conversion_intent': '200'
      });
      mockRedis.lindex.mockResolvedValue(JSON.stringify({
        type: 'visitor_identified',
        timestamp: Date.now()
      }));

      const stats = await eventManager.getEventStats();

      expect(stats.totalEvents).toBe(1000);
      expect(stats.eventsByType['visitor_identified']).toBe(500);
      expect(stats.recentActivity).toBeDefined();
      expect(Array.isArray(stats.recentActivity)).toBe(true);
    });

    test('should handle statistics errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const stats = await eventManager.getEventStats();

      expect(stats.totalEvents).toBe(0);
      expect(stats.eventsByType).toEqual({});
      expect(stats.recentActivity).toEqual([]);
    });
  });

  describe('Health Check', () => {
    test('should return healthy status when working correctly', async () => {
      const { redisManager } = jest.requireMock('../services/redis-client');
      redisManager.isHealthy.mockReturnValue(true);

      mockRedis.lrange.mockResolvedValue([
        JSON.stringify({
          id: 'recent-event',
          type: 'visitor_identified',
          timestamp: Date.now(),
          source: 'web',
          data: {}
        })
      ]);

      const health = await eventManager.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.activeSubscriptions).toBeDefined();
      expect(typeof health.lastEventTime).toBe('number');
    });

    test('should return unhealthy status when Redis is down', async () => {
      const { redisManager } = jest.requireMock('../services/redis-client');
      redisManager.isHealthy.mockReturnValue(false);

      const health = await eventManager.healthCheck();

      expect(health.status).toBe('unhealthy');
    });

    test('should handle health check errors', async () => {
      mockRedis.lrange.mockRejectedValue(new Error('Connection failed'));

      const health = await eventManager.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.isListening).toBe(false);
      expect(health.activeSubscriptions).toBe(0);
    });
  });

  describe('Event Processing Performance', () => {
    test('should handle rapid event publishing', async () => {
      const events = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        type: 'visitor_identified' as const,
        timestamp: Date.now(),
        source: 'bulk_test',
        data: {
          sessionId: `session-${i}`,
          companyId: `company-${i}`
        }
      }));

      const startTime = Date.now();

      await Promise.all(events.map(event => eventManager.publish(event)));

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
      expect(mockRedis.publish).toHaveBeenCalledTimes(200); // 100 events × 2 channels each
    });

    test('should handle multiple simultaneous subscriptions', async () => {
      const handlers = Array.from({ length: 10 }, () => jest.fn());

      await Promise.all(
        handlers.map(handler => eventManager.subscribe('visitor_identified', handler))
      );

      expect(mockRedis.subscribe).toHaveBeenCalledTimes(1); // Should only subscribe once per channel
    });
  });

  describe('Graceful Shutdown', () => {
    test('should shutdown gracefully', async () => {
      // Subscribe to some events first
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      await eventManager.subscribe('visitor_identified', handler1);
      await eventManager.subscribe('high_value_session', handler2);

      // Then shutdown
      await eventManager.shutdown();

      expect(mockRedis.unsubscribe).toHaveBeenCalledWith('events:visitor_identified');
      expect(mockRedis.unsubscribe).toHaveBeenCalledWith('events:high_value_session');
    });

    test('should handle shutdown errors gracefully', async () => {
      mockRedis.unsubscribe.mockRejectedValue(new Error('Unsubscribe failed'));

      // Should not throw an error
      await expect(eventManager.shutdown()).resolves.toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle Redis connection errors during publish', async () => {
      mockRedis.publish.mockRejectedValue(new Error('Redis connection lost'));

      const testEvent = {
        id: 'test-event',
        type: 'visitor_identified' as const,
        timestamp: Date.now(),
        source: 'test',
        data: { sessionId: 'session-123' }
      };

      // Should not throw an error
      await expect(eventManager.publish(testEvent)).resolves.toBeUndefined();
    });

    test('should handle subscribe errors gracefully', async () => {
      mockRedis.subscribe.mockRejectedValue(new Error('Subscribe failed'));

      const handler = jest.fn();

      // Should not throw an error
      await expect(
        eventManager.subscribe('visitor_identified', handler)
      ).resolves.toBeUndefined();
    });

    test('should handle invalid event data gracefully', async () => {
      // This would cause JSON.stringify to fail in real scenarios
      const circularEvent = {
        id: 'circular-event',
        type: 'visitor_identified' as const,
        timestamp: Date.now(),
        source: 'test',
        data: {} as Record<string, unknown>
      };
      circularEvent.data.circular = circularEvent;

      // Mock JSON.stringify to throw
      const originalStringify = JSON.stringify;
      jest.spyOn(JSON, 'stringify').mockImplementation(() => {
        throw new Error('Converting circular structure to JSON');
      });

      await expect(eventManager.publish(circularEvent as never)).resolves.toBeUndefined();

      // Restore original implementation
      JSON.stringify = originalStringify;
    });
  });
});
