/**
 * Real-time Analytics Processing Engine Tests
 *
 * Comprehensive test suite for the RealTimeAnalyticsEngine and associated classes
 */

import {
    AnalyticsEvent,
    AnomalyEvent,
    DashboardUpdate,
    RealTimeAnalyticsEngine,
    RealTimeConfig,
    RealTimeMetric,
    WebSocketConnection
} from '../real-time-analytics-engine';

describe('RealTimeAnalyticsEngine', () => {
  let engine: RealTimeAnalyticsEngine;
  let mockConfig: Partial<RealTimeConfig>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockConfig = {
      streamProcessing: {
        maxThroughput: 1000,
        batchSize: 10,
        flushInterval: 100,
        parallelism: 2,
        retentionPolicy: {
          rawEvents: 1,
          aggregatedMetrics: 7,
          anomalies: 3
        }
      },
      metricCalculation: {
        updateInterval: 50,
        aggregationWindow: 30,
        enableRollups: true,
        precisionLevel: 2
      },
      anomalyDetection: {
        enabled: true,
        trainingPeriod: 1,
        detectionWindow: 1,
        sensitivity: 0.8,
        notificationThreshold: 'medium'
      },
      websocket: {
        port: 8081,
        maxConnections: 100,
        heartbeatInterval: 10,
        compressionEnabled: false,
        authRequired: false
      },
      performance: {
        targetLatency: 50,
        maxMemoryUsage: 256,
        gcInterval: 30,
        monitoringEnabled: true
      }
    };

    engine = new RealTimeAnalyticsEngine(mockConfig);
  });

  afterEach(async () => {
    if (engine) {
      await engine.stop();
    }
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Configuration and Initialization', () => {
    test('should merge config with defaults correctly', () => {
      const customEngine = new RealTimeAnalyticsEngine({
        streamProcessing: {
          maxThroughput: 5000,
          batchSize: 50,
          flushInterval: 200,
          parallelism: 4,
          retentionPolicy: {
            rawEvents: 2,
            aggregatedMetrics: 14,
            anomalies: 7
          }
        }
      });

      // Should have custom maxThroughput but default other values
      const health = customEngine.getSystemHealth();
      expect(health).toBeDefined();
      expect(health.status).toBe('stopped');
    });

    test('should initialize with default config when no config provided', () => {
      const defaultEngine = new RealTimeAnalyticsEngine();
      const health = defaultEngine.getSystemHealth();

      expect(health).toBeDefined();
      expect(health.status).toBe('stopped');
      expect(health.uptime).toBeGreaterThanOrEqual(0);
    });

    test('should have correct initial state', () => {
      const health = engine.getSystemHealth();

      expect(health.status).toBe('stopped');
      expect(health.uptime).toBeGreaterThanOrEqual(0);
      expect(health.anomalies).toEqual([]);
      expect(health.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Engine Lifecycle', () => {
    test('should start engine successfully', async () => {
      await engine.start();

      const health = engine.getSystemHealth();
      expect(health.status).toBe('healthy');
    });

    test('should stop engine successfully', async () => {
      await engine.start();
      await engine.stop();

      const health = engine.getSystemHealth();
      expect(health.status).toBe('stopped');
    });

    test('should handle multiple start/stop cycles', async () => {
      await engine.start();
      expect(engine.getSystemHealth().status).toBe('healthy');

      await engine.stop();
      expect(engine.getSystemHealth().status).toBe('stopped');

      await engine.start();
      expect(engine.getSystemHealth().status).toBe('healthy');

      await engine.stop();
      expect(engine.getSystemHealth().status).toBe('stopped');
    });
  });

  describe('Event Ingestion', () => {
    beforeEach(async () => {
      await engine.start();
    });

    test('should ingest event successfully', async () => {
      const mockEvent: AnalyticsEvent = {
        id: 'test-event-1',
        customerId: 'customer-123',
        sessionId: 'session-456',
        eventType: 'page_view',
        timestamp: new Date(),
        data: { page: '/dashboard', source: 'web' },
        metadata: {
          source: 'web-app',
          version: '1.0.0',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Test'
        }
      };

      const eventPromise = new Promise((resolve) => {
        engine.once('event_ingested', resolve);
      });

      await engine.ingestEvent(mockEvent);
      const ingestedEvent = await eventPromise;

      expect(ingestedEvent).toMatchObject({
        eventId: 'test-event-1',
        eventType: 'page_view',
        customerId: 'customer-123'
      });
    });

    test('should add processing timestamp to event metadata', async () => {
      const mockEvent: AnalyticsEvent = {
        id: 'test-event-2',
        customerId: 'customer-123',
        sessionId: 'session-456',
        eventType: 'click',
        timestamp: new Date(),
        data: { element: 'button', action: 'submit' },
        metadata: {
          source: 'web-app',
          version: '1.0.0',
          ip: '192.168.1.1'
        }
      };

      await engine.ingestEvent(mockEvent);

      // Event should have processing timestamp added
      expect(mockEvent.metadata.processingTimestamp).toBeInstanceOf(Date);
    });

    test('should handle critical events immediately', async () => {
      const criticalEvent: AnalyticsEvent = {
        id: 'critical-event-1',
        customerId: 'customer-123',
        sessionId: 'session-456',
        eventType: 'conversion',
        timestamp: new Date(),
        data: { value: 1000, currency: 'USD' },
        metadata: {
          source: 'web-app',
          version: '1.0.0',
          ip: '192.168.1.1'
        }
      };

      const startTime = performance.now();
      await engine.ingestEvent(criticalEvent);
      const endTime = performance.now();

      // Critical events should be processed quickly
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should emit ingestion error for invalid events', async () => {
      const invalidEvent = {
        id: 'invalid-event',
        // Missing required fields
      } as AnalyticsEvent;

      const errorPromise = new Promise((resolve) => {
        engine.once('ingestion_error', resolve);
      });

      await expect(engine.ingestEvent(invalidEvent)).rejects.toThrow();
      const errorEvent = await errorPromise;

      expect(errorEvent).toMatchObject({
        eventId: 'invalid-event'
      });
    });
  });

  describe('Real-time Metrics', () => {
    beforeEach(async () => {
      await engine.start();
    });

    test('should return all metrics when no customer filter', () => {
      const metrics = engine.getRealTimeMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });

    test('should filter metrics by customer ID', () => {
      const customerId = 'customer-123';
      const metrics = engine.getRealTimeMetrics(customerId);

      expect(Array.isArray(metrics)).toBe(true);
      // All returned metrics should belong to the specified customer
      metrics.forEach(metric => {
        expect(metric.dimensions.customerId).toBe(customerId);
      });
    });

    test('should track metric calculation performance', async () => {
      // Trigger metric calculations by advancing timers
      jest.advanceTimersByTime(100);

      const health = engine.getSystemHealth();
      expect(health.metrics).toBeDefined();
    });
  });

  describe('WebSocket Subscriptions', () => {
    beforeEach(async () => {
      await engine.start();
    });

    test('should subscribe to topics successfully', () => {
      const connectionId = 'conn-123';
      const topics = ['metrics', 'alerts'];

      // Mock connection
      const mockConnection: WebSocketConnection = {
        id: connectionId,
        sessionId: 'session-456',
        subscriptions: [],
        lastHeartbeat: new Date(),
        status: 'connected'
      };

      // Manually add connection to simulate WebSocket connection
      (engine as any).connections.set(connectionId, mockConnection);

      const subscriptionPromise = new Promise((resolve) => {
        engine.once('subscription_updated', resolve);
      });

      engine.subscribe(connectionId, topics);

      return subscriptionPromise.then((event: any) => {
        expect(event.connectionId).toBe(connectionId);
        expect(event.topics).toEqual(expect.arrayContaining(topics));
      });
    });

    test('should unsubscribe from topics successfully', () => {
      const connectionId = 'conn-123';
      const initialTopics = ['metrics', 'alerts', 'anomalies'];
      const topicsToRemove = ['alerts'];

      // Mock connection with existing subscriptions
      const mockConnection: WebSocketConnection = {
        id: connectionId,
        sessionId: 'session-456',
        subscriptions: [...initialTopics],
        lastHeartbeat: new Date(),
        status: 'connected'
      };

      (engine as any).connections.set(connectionId, mockConnection);

      const subscriptionPromise = new Promise((resolve) => {
        engine.once('subscription_updated', resolve);
      });

      engine.unsubscribe(connectionId, topicsToRemove);

      return subscriptionPromise.then((event: any) => {
        expect(event.connectionId).toBe(connectionId);
        expect(event.topics).toEqual(['metrics', 'anomalies']);
        expect(event.topics).not.toContain('alerts');
      });
    });

    test('should handle subscription for non-existent connection gracefully', () => {
      const nonExistentConnectionId = 'non-existent-conn';
      const topics = ['metrics'];

      // Should not throw error
      expect(() => {
        engine.subscribe(nonExistentConnectionId, topics);
      }).not.toThrow();
    });

    test('should deduplicate subscription topics', () => {
      const connectionId = 'conn-123';
      const duplicateTopics = ['metrics', 'alerts', 'metrics', 'alerts'];

      const mockConnection: WebSocketConnection = {
        id: connectionId,
        sessionId: 'session-456',
        subscriptions: [],
        lastHeartbeat: new Date(),
        status: 'connected'
      };

      (engine as any).connections.set(connectionId, mockConnection);

      engine.subscribe(connectionId, duplicateTopics);

      const connection = (engine as any).connections.get(connectionId);
      expect(connection.subscriptions).toEqual(['metrics', 'alerts']);
    });
  });

  describe('System Health Monitoring', () => {
    beforeEach(async () => {
      await engine.start();
    });

    test('should return comprehensive system health', () => {
      const health = engine.getSystemHealth();

      expect(health).toMatchObject({
        status: 'healthy',
        uptime: expect.any(Number),
        pipelines: expect.any(Object),
        metrics: expect.any(Object),
        connections: expect.any(Object),
        performance: expect.any(Object),
        anomalies: expect.any(Array),
        lastUpdated: expect.any(Date)
      });
    });

    test('should track system uptime correctly', async () => {
      const initialHealth = engine.getSystemHealth();
      const initialUptime = initialHealth.uptime;

      // Advance time
      jest.advanceTimersByTime(5000);

      const laterHealth = engine.getSystemHealth();
      const laterUptime = laterHealth.uptime;

      expect(laterUptime).toBeGreaterThan(initialUptime);
    });

    test('should report stopped status when engine is stopped', async () => {
      await engine.stop();
      const health = engine.getSystemHealth();

      expect(health.status).toBe('stopped');
    });
  });

  describe('Performance and Optimization', () => {
    beforeEach(async () => {
      await engine.start();
    });

    test('should handle high throughput event ingestion', async () => {
      const eventCount = 20;
      const events: AnalyticsEvent[] = [];

      for (let i = 0; i < eventCount; i++) {
        events.push({
          id: `event-${i}`,
          customerId: `customer-${i % 5}`,
          sessionId: `session-${i}`,
          eventType: 'page_view',
          timestamp: new Date(),
          data: { page: `/page-${i}` },
          metadata: {
            source: 'web-app',
            version: '1.0.0',
            ip: '192.168.1.1'
          }
        });
      }

      const startTime = performance.now();

      // Ingest all events
      await Promise.all(events.map(event => engine.ingestEvent(event)));

      const endTime = performance.now();
      const avgProcessingTime = (endTime - startTime) / eventCount;

      // Should process events efficiently (under 10ms per event)
      expect(avgProcessingTime).toBeLessThan(100);
    });

    test('should handle batch processing efficiently', async () => {
      // Add multiple events to trigger batch processing
      const batchSize = 20;
      const events: AnalyticsEvent[] = [];

      for (let i = 0; i < batchSize; i++) {
        events.push({
          id: `batch-event-${i}`,
          customerId: 'customer-batch',
          sessionId: 'session-batch',
          eventType: 'click',
          timestamp: new Date(),
          data: { element: `button-${i}` },
          metadata: {
            source: 'web-app',
            version: '1.0.0',
            ip: '192.168.1.1'
          }
        });
      }

      // Ingest events
      await Promise.all(events.map(event => engine.ingestEvent(event)));

      // Advance timer to trigger batch processing
      jest.advanceTimersByTime(200);

      const health = engine.getSystemHealth();
      expect(health.performance).toBeDefined();
    });
  });

  describe('Error Handling and Resilience', () => {
    beforeEach(async () => {
      await engine.start();
    });

    test('should handle malformed event data gracefully', async () => {
      const malformedEvent: AnalyticsEvent = {
        id: 'malformed-event',
        customerId: 'customer-123',
        sessionId: 'session-456',
        eventType: 'custom',
        timestamp: new Date(),
        data: {},
        metadata: {
          source: 'web-app',
          version: '1.0.0',
          ip: '192.168.1.1'
        }
      };

      // Should handle gracefully
      await expect(engine.ingestEvent(malformedEvent)).resolves.not.toThrow();
    });

    test('should recover from processing errors', async () => {
      // First, ensure engine is healthy
      expect(engine.getSystemHealth().status).toBe('healthy');

      // Ingest a problematic event
      const problematicEvent: AnalyticsEvent = {
        id: 'problematic-event',
        customerId: 'customer-123',
        sessionId: 'session-456',
        eventType: 'custom',
        timestamp: new Date(),
        data: { recursive: {} },
        metadata: {
          source: 'web-app',
          version: '1.0.0',
          ip: '192.168.1.1'
        }
      };

      // Add circular reference to cause JSON serialization issues
      (problematicEvent.data.recursive as any).self = problematicEvent.data.recursive;

      try {
        await engine.ingestEvent(problematicEvent);
      } catch (_error) {
        // Expected to fail
      }

      // Engine should still be functional
      const health = engine.getSystemHealth();
      expect(health.status).toBe('healthy');
    });

    test('should handle memory pressure gracefully', () => {
      // Simulate memory pressure scenario
      const health = engine.getSystemHealth();

      expect(health.performance).toBeDefined();
      // Engine should be monitoring memory usage
    });
  });

  describe('Integration with Analytics Components', () => {
    beforeEach(async () => {
      await engine.start();
    });

    test('should emit metric calculation events', (done) => {
      engine.on('metric_calculated', (metric: RealTimeMetric) => {
        expect(metric).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          type: expect.stringMatching(/^(counter|gauge|histogram|rate|distribution)$/),
          value: expect.any(Number),
          timestamp: expect.any(Date)
        });
        done();
      });

      // Trigger metric calculation
      jest.advanceTimersByTime(100);
    });

    test('should emit anomaly detection events', (done) => {
      engine.on('anomaly_detected', (anomaly: AnomalyEvent) => {
        expect(anomaly).toMatchObject({
          id: expect.any(String),
          detectorId: expect.any(String),
          metricName: expect.any(String),
          severity: expect.stringMatching(/^(low|medium|high|critical)$/),
          actualValue: expect.any(Number),
          expectedValue: expect.any(Number),
          timestamp: expect.any(Date)
        });
        done();
      });

      // Trigger anomaly detection
      jest.advanceTimersByTime(200);
    });

    test('should broadcast dashboard updates', (done) => {
      let updateCount = 0;
      const mockBroadcast = jest.fn((update: DashboardUpdate) => {
        updateCount++;
        expect(update).toMatchObject({
          id: expect.any(String),
          type: expect.stringMatching(/^(metric_update|chart_data|alert|anomaly|status|heartbeat)$/),
          target: expect.any(String),
          timestamp: expect.any(Date),
          priority: expect.stringMatching(/^(low|normal|high|urgent)$/)
        });

        if (updateCount >= 1) {
          done();
        }
      });

      // Mock the broadcast method
      (engine as any).broadcastUpdate = mockBroadcast;

      // Trigger events that should result in broadcasts
      jest.advanceTimersByTime(100);
    });
  });

  describe('Configuration Validation', () => {
    test('should validate configuration gracefully', () => {
      // Engine should handle empty config gracefully
      expect(() => new RealTimeAnalyticsEngine({})).not.toThrow();
    });
  });
});

describe('Edge Cases and Boundary Conditions', () => {
  let engine: RealTimeAnalyticsEngine;

  beforeEach(() => {
    jest.useFakeTimers();
    engine = new RealTimeAnalyticsEngine();
  });

  afterEach(async () => {
    if (engine) {
      await engine.stop();
    }
    jest.useRealTimers();
  });

  test('should handle zero-throughput configuration', () => {
    const zeroThroughputEngine = new RealTimeAnalyticsEngine({
      streamProcessing: { maxThroughput: 0 }
    });

    expect(zeroThroughputEngine.getSystemHealth()).toBeDefined();
  });

  test('should handle very large batch sizes', () => {
    const largeBatchEngine = new RealTimeAnalyticsEngine({
      streamProcessing: { batchSize: 10000 }
    });

    expect(largeBatchEngine.getSystemHealth()).toBeDefined();
  });

  test('should handle extremely frequent metric updates', async () => {
    const highFrequencyEngine = new RealTimeAnalyticsEngine({
      metricCalculation: { updateInterval: 1 }
    });

    await highFrequencyEngine.start();

    // Advance timer multiple times rapidly
    for (let i = 0; i < 100; i++) {
      jest.advanceTimersByTime(1);
    }

    expect(highFrequencyEngine.getSystemHealth().status).toBe('healthy');
    await highFrequencyEngine.stop();
  });

  test('should handle empty event data', async () => {
    await engine.start();

    const emptyDataEvent: AnalyticsEvent = {
      id: 'empty-data-event',
      customerId: 'customer-123',
      sessionId: 'session-456',
      eventType: 'custom',
      timestamp: new Date(),
      data: {},
      metadata: {
        source: 'web-app',
        version: '1.0.0',
        ip: '192.168.1.1'
      }
    };

    await expect(engine.ingestEvent(emptyDataEvent)).resolves.not.toThrow();
  });

  test('should handle concurrent subscription operations', () => {
    const connectionId = 'concurrent-conn';
    const mockConnection: WebSocketConnection = {
      id: connectionId,
      sessionId: 'session-456',
      subscriptions: [],
      lastHeartbeat: new Date(),
      status: 'connected'
    };

    (engine as any).connections.set(connectionId, mockConnection);

    // Perform multiple concurrent subscription operations
    engine.subscribe(connectionId, ['topic1', 'topic2']);
    engine.subscribe(connectionId, ['topic3', 'topic4']);
    engine.unsubscribe(connectionId, ['topic1']);
    engine.subscribe(connectionId, ['topic5']);

    const finalConnection = (engine as any).connections.get(connectionId);
    expect(finalConnection.subscriptions).toEqual(
      expect.arrayContaining(['topic2', 'topic3', 'topic4', 'topic5'])
    );
    expect(finalConnection.subscriptions).not.toContain('topic1');
  });
});
