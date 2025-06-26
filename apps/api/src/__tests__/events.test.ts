import express from 'express';
import request from 'supertest';

// Mock analytics service before importing the router
jest.mock('../services/analytics-service', () => ({
  AnalyticsServiceManager: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    ingestEvent: jest.fn().mockResolvedValue({
      success: true,
      eventId: 'event-123'
    }),
    queryEvents: jest.fn().mockResolvedValue({
      success: true,
      events: [],
      totalCount: 0
    })
  }))
}));

// Mock data quality service
jest.mock('../services/data-quality', () => ({
  DataQualityManager: jest.fn().mockImplementation(() => ({
    validateEvent: jest.fn().mockResolvedValue({
      isValid: true,
      violations: []
    })
  }))
}));

const mockAnalyticsService = jest.requireMock('../services/analytics-service').AnalyticsServiceManager;
const mockDataQuality = jest.requireMock('../services/data-quality').DataQualityManager;

describe('Events REST API', () => {
  let app: express.Application;
  let analyticsServiceInstance: jest.Mocked<{
    initialize: jest.Mock;
    ingestEvent: jest.Mock;
    queryEvents: jest.Mock;
  }>;
  let dataQualityInstance: jest.Mocked<{
    validateEvent: jest.Mock;
  }>;

  beforeEach(() => {
    // Setup Express app with events routes
    app = express();
    app.use(express.json());

    // Import and setup routes after mocking
    const { default: eventsRouter } = jest.requireMock('../routes/events');
    app.use('/api/v1/events', eventsRouter);

    // Get mock instances
    analyticsServiceInstance = new mockAnalyticsService();
    dataQualityInstance = new mockDataQuality();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/v1/events', () => {
    const validEventData = {
      type: 'page_view',
      sessionId: 'session-123',
      visitorId: 'visitor-456',
      timestamp: '2024-01-01T00:00:00.000Z',
      data: {
        page: '/home',
        title: 'Home Page',
        url: 'https://example.com/home'
      }
    };

    test('should track event with valid data and API key', async () => {
      const response = await request(app)
        .post('/api/v1/events')
        .set('X-API-Key', 'test-api-key')
        .send(validEventData)
        .expect(201);

      expect(response.body.id).toBe('event-123');
      expect(response.body.status).toBe('tracked');
      expect(response.body.timestamp).toBeDefined();
      expect(analyticsServiceInstance.ingestEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'page_view',
          sessionId: 'session-123',
          visitorId: 'visitor-456'
        })
      );
    });

    test('should track event with Bearer token authentication', async () => {
      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', 'Bearer test-bearer-token')
        .send(validEventData)
        .expect(201);

      expect(response.body.status).toBe('tracked');
      expect(analyticsServiceInstance.ingestEvent).toHaveBeenCalled();
    });

    test('should reject requests without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/events')
        .send(validEventData)
        .expect(401);

      expect(response.body.error).toBe('unauthorized');
      expect(response.body.message).toContain('API key or Bearer token required');
    });

    test('should validate required fields', async () => {
      const invalidData = {
        type: 'page_view',
        sessionId: 'session-123'
        // Missing visitorId
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('X-API-Key', 'test-api-key')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('validation_error');
      expect(response.body.message).toContain('Missing required fields');
    });

    test('should validate event type', async () => {
      const invalidData = {
        ...validEventData,
        type: 'invalid_event_type'
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('X-API-Key', 'test-api-key')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('validation_error');
      expect(response.body.message).toContain('Invalid event type');
    });

    test('should validate timestamp format', async () => {
      const invalidData = {
        ...validEventData,
        timestamp: 'invalid-timestamp'
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('X-API-Key', 'test-api-key')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('validation_error');
      expect(response.body.message).toContain('Invalid timestamp format');
    });

    test('should handle data quality validation failure', async () => {
      // Mock data quality validation failure
      dataQualityInstance.validateEvent.mockResolvedValueOnce({
        isValid: false,
        violations: ['Invalid data format', 'Missing required fields']
      });

      const response = await request(app)
        .post('/api/v1/events')
        .set('X-API-Key', 'test-api-key')
        .send(validEventData)
        .expect(400);

      expect(response.body.error).toBe('quality_validation_failed');
      expect(response.body.violations).toEqual(['Invalid data format', 'Missing required fields']);
    });

    test('should handle analytics service failure', async () => {
      // Mock analytics service failure
      analyticsServiceInstance.ingestEvent.mockResolvedValueOnce({
        success: false
      });

      const response = await request(app)
        .post('/api/v1/events')
        .set('X-API-Key', 'test-api-key')
        .send(validEventData)
        .expect(500);

      expect(response.body.error).toBe('processing_failed');
      expect(response.body.message).toBe('Failed to process event');
    });

    test('should handle different event types', async () => {
      const eventTypes = ['page_view', 'click', 'form_submit', 'download', 'custom'];

      for (const eventType of eventTypes) {
        const eventData = {
          ...validEventData,
          type: eventType
        };

        const response = await request(app)
          .post('/api/v1/events')
          .set('X-API-Key', 'test-api-key')
          .send(eventData)
          .expect(201);

        expect(response.body.status).toBe('tracked');
      }
    });

    test('should include metadata in event object', async () => {
      await request(app)
        .post('/api/v1/events')
        .set('X-API-Key', 'test-api-key')
        .set('User-Agent', 'Test Browser')
        .send(validEventData)
        .expect(201);

      expect(analyticsServiceInstance.ingestEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test-api-key',
          userAgent: 'Test Browser',
          ip: expect.any(String)
        })
      );
    });
  });

  describe('GET /api/v1/events', () => {
    const mockEvents = [
      {
        id: 'event-1',
        type: 'page_view',
        sessionId: 'session-123',
        visitorId: 'visitor-456',
        timestamp: '2024-01-01T00:00:00.000Z',
        data: { page: '/home' }
      },
      {
        id: 'event-2',
        type: 'click',
        sessionId: 'session-123',
        visitorId: 'visitor-456',
        timestamp: '2024-01-01T00:01:00.000Z',
        data: { element: 'button' }
      }
    ];

    test('should retrieve events with authentication', async () => {
      analyticsServiceInstance.queryEvents.mockResolvedValueOnce({
        success: true,
        events: mockEvents,
        totalCount: 2
      });

      const response = await request(app)
        .get('/api/v1/events')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body.events).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.headers['x-total-count']).toBe('2');
    });

    test('should require authentication for event retrieval', async () => {
      const response = await request(app)
        .get('/api/v1/events')
        .expect(401);

      expect(response.body.error).toBe('unauthorized');
    });

    test('should handle pagination parameters', async () => {
      await request(app)
        .get('/api/v1/events?limit=10&offset=20')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(analyticsServiceInstance.queryEvents).toHaveBeenCalledWith({
        filters: {},
        pagination: { limit: 10, offset: 20 },
        apiKey: 'test-api-key'
      });
    });

    test('should handle event type filtering', async () => {
      await request(app)
        .get('/api/v1/events?type=page_view')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(analyticsServiceInstance.queryEvents).toHaveBeenCalledWith({
        filters: { type: 'page_view' },
        pagination: { limit: 50, offset: 0 },
        apiKey: 'test-api-key'
      });
    });

    test('should handle session filtering', async () => {
      await request(app)
        .get('/api/v1/events?sessionId=session-123')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(analyticsServiceInstance.queryEvents).toHaveBeenCalledWith({
        filters: { sessionId: 'session-123' },
        pagination: { limit: 50, offset: 0 },
        apiKey: 'test-api-key'
      });
    });

    test('should handle visitor filtering', async () => {
      await request(app)
        .get('/api/v1/events?visitorId=visitor-456')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(analyticsServiceInstance.queryEvents).toHaveBeenCalledWith({
        filters: { visitorId: 'visitor-456' },
        pagination: { limit: 50, offset: 0 },
        apiKey: 'test-api-key'
      });
    });

    test('should handle date range filtering', async () => {
      await request(app)
        .get('/api/v1/events?startDate=2024-01-01&endDate=2024-01-31')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(analyticsServiceInstance.queryEvents).toHaveBeenCalledWith({
        filters: {
          timestamp: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31')
          }
        },
        pagination: { limit: 50, offset: 0 },
        apiKey: 'test-api-key'
      });
    });

    test('should enforce maximum limit', async () => {
      await request(app)
        .get('/api/v1/events?limit=2000')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(analyticsServiceInstance.queryEvents).toHaveBeenCalledWith({
        filters: {},
        pagination: { limit: 1000, offset: 0 }, // Should be capped at 1000
        apiKey: 'test-api-key'
      });
    });

    test('should handle combined filters', async () => {
      await request(app)
        .get('/api/v1/events?type=click&sessionId=session-123&limit=25&offset=50')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(analyticsServiceInstance.queryEvents).toHaveBeenCalledWith({
        filters: {
          type: 'click',
          sessionId: 'session-123'
        },
        pagination: { limit: 25, offset: 50 },
        apiKey: 'test-api-key'
      });
    });

    test('should handle analytics service query failure', async () => {
      analyticsServiceInstance.queryEvents.mockResolvedValueOnce({
        success: false,
        error: 'Database connection failed'
      });

      const response = await request(app)
        .get('/api/v1/events')
        .set('X-API-Key', 'test-api-key')
        .expect(500);

      expect(response.body.error).toBe('query_failed');
    });

    test('should handle service initialization', async () => {
      // Test that services are initialized before processing
      await request(app)
        .get('/api/v1/events')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(analyticsServiceInstance.initialize).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle service initialization failure', async () => {
      analyticsServiceInstance.initialize.mockRejectedValueOnce(new Error('Service init failed'));

      const response = await request(app)
        .post('/api/v1/events')
        .set('X-API-Key', 'test-api-key')
        .send({
          type: 'page_view',
          sessionId: 'session-123',
          visitorId: 'visitor-456'
        })
        .expect(500);

      expect(response.body.error).toBe('internal_error');
    });

    test('should handle unexpected service errors', async () => {
      analyticsServiceInstance.ingestEvent.mockRejectedValueOnce(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/v1/events')
        .set('X-API-Key', 'test-api-key')
        .send({
          type: 'page_view',
          sessionId: 'session-123',
          visitorId: 'visitor-456'
        })
        .expect(500);

      expect(response.body.error).toBe('internal_error');
      expect(response.body.message).toBe('Internal server error occurred');
    });
  });

  describe('Performance & Load Considerations', () => {
    test('should handle rapid event submissions', async () => {
      const eventPromises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/v1/events')
          .set('X-API-Key', 'test-api-key')
          .send({
            type: 'page_view',
            sessionId: `session-${i}`,
            visitorId: `visitor-${i}`
          })
      );

      const responses = await Promise.all(eventPromises);

      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      expect(analyticsServiceInstance.ingestEvent).toHaveBeenCalledTimes(10);
    });

    test('should handle large event data payloads', async () => {
      const largeData = {
        type: 'custom',
        sessionId: 'session-123',
        visitorId: 'visitor-456',
        data: {
          // Simulate large payload
          properties: Array.from({ length: 100 }, (_, i) => ({
            key: `property_${i}`,
            value: `value_${i}`.repeat(10)
          }))
        }
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('X-API-Key', 'test-api-key')
        .send(largeData)
        .expect(201);

      expect(response.body.status).toBe('tracked');
    });
  });
});
