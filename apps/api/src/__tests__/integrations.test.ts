import express from 'express';
import request from 'supertest';

// Mock the integration service
const mockIntegrationService = {
  createIntegration: jest.fn(),
  updateIntegration: jest.fn(),
  deleteIntegration: jest.fn(),
  getIntegration: jest.fn(),
  getAllIntegrations: jest.fn(),
  testConnection: jest.fn(),
  createWebhook: jest.fn(),
  triggerWebhook: jest.fn(),
  createSyncJob: jest.fn(),
  cancelSyncJob: jest.fn(),
  getSyncJobs: jest.fn()
};

// Mock the service module
jest.mock('../services/integration-service', () => ({
  integrationService: mockIntegrationService
}));

// Mock Redis and other dependencies
jest.mock('ioredis');
jest.mock('../middleware/auth', () => ({
  requireApiKey: () => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    (req as unknown as { apiKey: unknown }).apiKey = { id: 'test-key', organizationId: 'test-org' };
    next();
  },
  requireAuth: () => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    (req as unknown as { user: unknown }).user = { id: 'test-user', organizationId: 'test-org' };
    next();
  }
}));

describe('Integrations REST API', () => {
  let app: express.Application;

  beforeEach(() => {
    // Setup Express app with integration routes
    app = express();
    app.use(express.json());

    // Import and setup routes after mocking
    const { default: integrationsRouter } = jest.requireMock('../routes/integrations');
    app.use('/api/v1/integrations', integrationsRouter);

    // Clear all mocks
    jest.clearAllMocks();

    // Setup default mock responses
    mockIntegrationService.getAllIntegrations.mockResolvedValue([]);
    mockIntegrationService.getIntegration.mockResolvedValue(null);
    mockIntegrationService.createIntegration.mockResolvedValue({
      id: 'integration-123',
      name: 'Test Integration',
      type: 'google_analytics',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  describe('GET /api/v1/integrations', () => {
    test('should return all integrations', async () => {
      const mockIntegrations = [
        {
          id: '1',
          name: 'Google Analytics',
          type: 'google_analytics',
          enabled: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          name: 'Mixpanel',
          type: 'mixpanel',
          enabled: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      mockIntegrationService.getAllIntegrations.mockResolvedValue(mockIntegrations);

      const response = await request(app)
        .get('/api/v1/integrations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('Google Analytics');
      expect(response.body.data[1].enabled).toBe(false);
    });

    test('should filter integrations by type', async () => {
      const mockGAIntegrations = [
        {
          id: '1',
          name: 'Google Analytics',
          type: 'google_analytics',
          enabled: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      mockIntegrationService.getAllIntegrations.mockResolvedValue(mockGAIntegrations);

      const response = await request(app)
        .get('/api/v1/integrations?type=google_analytics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('google_analytics');
      expect(mockIntegrationService.getAllIntegrations).toHaveBeenCalledWith({
        type: 'google_analytics'
      });
    });

    test('should filter integrations by enabled status', async () => {
      const mockEnabledIntegrations = [
        {
          id: '1',
          name: 'Google Analytics',
          type: 'google_analytics',
          enabled: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      mockIntegrationService.getAllIntegrations.mockResolvedValue(mockEnabledIntegrations);

      const response = await request(app)
        .get('/api/v1/integrations?enabled=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].enabled).toBe(true);
      expect(mockIntegrationService.getAllIntegrations).toHaveBeenCalledWith({
        enabled: true
      });
    });

    test('should handle service errors gracefully', async () => {
      mockIntegrationService.getAllIntegrations.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/v1/integrations')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to fetch integrations');
    });
  });

  describe('GET /api/v1/integrations/:id', () => {
    test('should return specific integration', async () => {
      const mockIntegration = {
        id: '123',
        name: 'Test Integration',
        type: 'google_analytics',
        enabled: true,
        authentication: {
          type: 'api_key',
          credentials: { api_key: 'masked' }
        },
        configuration: {
          property_id: 'GA-123456'
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockIntegrationService.getIntegration.mockResolvedValue(mockIntegration);

      const response = await request(app)
        .get('/api/v1/integrations/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('123');
      expect(response.body.data.name).toBe('Test Integration');
      expect(mockIntegrationService.getIntegration).toHaveBeenCalledWith('123');
    });

    test('should return 404 for non-existent integration', async () => {
      mockIntegrationService.getIntegration.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/integrations/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Integration not found');
    });
  });

  describe('POST /api/v1/integrations', () => {
    const validIntegrationData = {
      name: 'New Integration',
      type: 'mixpanel',
      enabled: true,
      authentication: {
        type: 'api_key',
        credentials: {
          api_key: 'test-api-key'
        }
      },
      configuration: {
        project_token: 'mixpanel-token'
      },
      settings: {
        batch_size: 100
      }
    };

    test('should create new integration with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/integrations')
        .send(validIntegrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('integration-123');
      expect(response.body.data.name).toBe('Test Integration');
      expect(mockIntegrationService.createIntegration).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Integration',
          type: 'mixpanel',
          enabled: true
        })
      );
    });

    test('should validate required fields', async () => {
      const invalidData = {
        type: 'mixpanel',
        enabled: true
      };

      const response = await request(app)
        .post('/api/v1/integrations')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('validation error');
    });

    test('should validate integration type', async () => {
      const invalidData = {
        ...validIntegrationData,
        type: 'invalid_type'
      };

      const response = await request(app)
        .post('/api/v1/integrations')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid integration type');
    });

    test('should handle service creation errors', async () => {
      mockIntegrationService.createIntegration.mockRejectedValue(
        new Error('Integration with this name already exists')
      );

      const response = await request(app)
        .post('/api/v1/integrations')
        .send(validIntegrationData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('PUT /api/v1/integrations/:id', () => {
    const updateData = {
      name: 'Updated Integration',
      enabled: false,
      configuration: {
        property_id: 'GA-UPDATED'
      }
    };

    test('should update existing integration', async () => {
      const mockUpdatedIntegration = {
        id: '123',
        name: 'Updated Integration',
        type: 'google_analytics',
        enabled: false,
        updatedAt: new Date().toISOString()
      };

      mockIntegrationService.updateIntegration.mockResolvedValue(mockUpdatedIntegration);

      const response = await request(app)
        .put('/api/v1/integrations/123')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Integration');
      expect(response.body.data.enabled).toBe(false);
      expect(mockIntegrationService.updateIntegration).toHaveBeenCalledWith('123', updateData);
    });

    test('should return 404 for non-existent integration', async () => {
      mockIntegrationService.updateIntegration.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/integrations/nonexistent')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Integration not found');
    });
  });

  describe('DELETE /api/v1/integrations/:id', () => {
    test('should delete existing integration', async () => {
      mockIntegrationService.deleteIntegration.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/v1/integrations/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Integration deleted successfully');
      expect(mockIntegrationService.deleteIntegration).toHaveBeenCalledWith('123');
    });

    test('should return 404 for non-existent integration', async () => {
      mockIntegrationService.deleteIntegration.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/v1/integrations/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Integration not found');
    });
  });

  describe('POST /api/v1/integrations/:id/test', () => {
    test('should test integration connection', async () => {
      const mockTestResult = {
        success: true,
        message: 'Connection successful',
        responseTime: 245,
        timestamp: new Date().toISOString()
      };

      mockIntegrationService.testConnection.mockResolvedValue(mockTestResult);

      const response = await request(app)
        .post('/api/v1/integrations/123/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(true);
      expect(response.body.data.message).toBe('Connection successful');
      expect(response.body.data.responseTime).toBe(245);
      expect(mockIntegrationService.testConnection).toHaveBeenCalledWith('123');
    });

    test('should handle failed connection tests', async () => {
      const mockTestResult = {
        success: false,
        error: 'Authentication failed',
        responseTime: 5000,
        timestamp: new Date().toISOString()
      };

      mockIntegrationService.testConnection.mockResolvedValue(mockTestResult);

      const response = await request(app)
        .post('/api/v1/integrations/123/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(false);
      expect(response.body.data.error).toBe('Authentication failed');
    });
  });

  describe('GET /api/v1/integrations/types', () => {
    test('should return available integration types', async () => {
      const response = await request(app)
        .get('/api/v1/integrations/types')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // Check for expected integration types
      const types = response.body.data.map((t: { type: string }) => t.type);
      expect(types).toContain('google_analytics');
      expect(types).toContain('mixpanel');
      expect(types).toContain('segment');
      expect(types).toContain('webhook');
    });
  });

  describe('Webhook Management', () => {
    describe('POST /api/v1/integrations/webhooks', () => {
      const webhookData = {
        integrationId: '123',
        url: 'https://example.com/webhook',
        events: ['event.created', 'event.updated'],
        secret: 'webhook-secret',
        timeout: 5000,
        retryAttempts: 3,
        retryBackoff: 'exponential',
        signatureMethod: 'hmac-sha256'
      };

      test('should create webhook', async () => {
        const mockWebhook = {
          id: 'webhook-123',
          ...webhookData,
          status: 'active',
          createdAt: new Date().toISOString()
        };

        mockIntegrationService.createWebhook.mockResolvedValue(mockWebhook);

        const response = await request(app)
          .post('/api/v1/integrations/webhooks')
          .send(webhookData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe('webhook-123');
        expect(response.body.data.url).toBe(webhookData.url);
        expect(response.body.data.events).toEqual(webhookData.events);
      });

      test('should validate webhook URL', async () => {
        const invalidData = {
          ...webhookData,
          url: 'not-a-valid-url'
        };

        const response = await request(app)
          .post('/api/v1/integrations/webhooks')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid URL');
      });
    });

    describe('POST /api/v1/integrations/webhooks/:id/trigger', () => {
      test('should trigger webhook manually', async () => {
        const mockDelivery = {
          id: 'delivery-123',
          webhookId: 'webhook-123',
          status: 'delivered',
          statusCode: 200,
          responseTime: 150,
          deliveredAt: new Date().toISOString()
        };

        mockIntegrationService.triggerWebhook.mockResolvedValue(mockDelivery);

        const triggerData = {
          event: 'test.event',
          payload: { test: 'data' }
        };

        const response = await request(app)
          .post('/api/v1/integrations/webhooks/webhook-123/trigger')
          .send(triggerData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('delivered');
        expect(response.body.data.statusCode).toBe(200);
        expect(mockIntegrationService.triggerWebhook).toHaveBeenCalledWith(
          'webhook-123',
          'test.event',
          { test: 'data' }
        );
      });
    });
  });

  describe('Sync Jobs Management', () => {
    describe('GET /api/v1/integrations/sync-jobs', () => {
      test('should return sync jobs', async () => {
        const mockSyncJobs = [
          {
            id: 'job-123',
            integrationId: '123',
            type: 'incremental',
            direction: 'export',
            status: 'completed',
            startedAt: '2024-01-01T00:00:00.000Z',
            completedAt: '2024-01-01T00:05:00.000Z'
          }
        ];

        mockIntegrationService.getSyncJobs.mockResolvedValue(mockSyncJobs);

        const response = await request(app)
          .get('/api/v1/integrations/sync-jobs')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].status).toBe('completed');
      });

      test('should filter sync jobs by integration', async () => {
        await request(app)
          .get('/api/v1/integrations/sync-jobs?integrationId=123')
          .expect(200);

        expect(mockIntegrationService.getSyncJobs).toHaveBeenCalledWith({
          integrationId: '123'
        });
      });
    });

    describe('POST /api/v1/integrations/sync-jobs', () => {
      const syncJobData = {
        integrationId: '123',
        type: 'incremental',
        direction: 'export',
        configuration: {
          entities: ['events', 'users'],
          dateRange: {
            start: '2024-01-01',
            end: '2024-01-31'
          }
        }
      };

      test('should create sync job', async () => {
        const mockSyncJob = {
          id: 'job-123',
          ...syncJobData,
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        mockIntegrationService.createSyncJob.mockResolvedValue(mockSyncJob);

        const response = await request(app)
          .post('/api/v1/integrations/sync-jobs')
          .send(syncJobData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe('job-123');
        expect(response.body.data.type).toBe('incremental');
        expect(response.body.data.status).toBe('pending');
      });
    });

    describe('POST /api/v1/integrations/sync-jobs/:id/cancel', () => {
      test('should cancel sync job', async () => {
        mockIntegrationService.cancelSyncJob.mockResolvedValue(true);

        const response = await request(app)
          .post('/api/v1/integrations/sync-jobs/job-123/cancel')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Sync job cancelled successfully');
        expect(mockIntegrationService.cancelSyncJob).toHaveBeenCalledWith('job-123');
      });

      test('should return 404 for non-existent job', async () => {
        mockIntegrationService.cancelSyncJob.mockResolvedValue(false);

        const response = await request(app)
          .post('/api/v1/integrations/sync-jobs/nonexistent/cancel')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Sync job not found');
      });
    });
  });

  describe('Health Check', () => {
    test('should return service health status', async () => {
      const response = await request(app)
        .get('/api/v1/integrations/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.uptime).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/integrations')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid JSON');
    });

    test('should handle large payloads gracefully', async () => {
      const largePayload = {
        name: 'Test',
        type: 'webhook',
        configuration: {
          largeData: 'x'.repeat(10000) // 10KB string
        }
      };

      const response = await request(app)
        .post('/api/v1/integrations')
        .send(largePayload)
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Payload too large');
    });

    test('should include request ID in error responses', async () => {
      mockIntegrationService.getAllIntegrations.mockRejectedValue(
        new Error('Service unavailable')
      );

      const response = await request(app)
        .get('/api/v1/integrations')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.requestId).toBeDefined();
      expect(typeof response.body.requestId).toBe('string');
    });
  });
});
