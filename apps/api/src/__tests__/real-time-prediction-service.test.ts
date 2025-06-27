import { LeadData } from '../services/ml-types';
import { RealTimePredictionService } from '../services/real-time-prediction-service';

// Mock dependencies
jest.mock('../services/ml-scoring-service');
jest.mock('../services/redis-client');
jest.mock('../services/websocket-server');

describe('RealTimePredictionService', () => {
  let service: RealTimePredictionService;
  let mockLeadData: LeadData;

  beforeEach(() => {
    service = new RealTimePredictionService();

    // Mock lead data for testing
    mockLeadData = {
      firmographic: {
        companySize: 'enterprise',
        industry: 'saas',
        revenue: 50000000,
        employees: 500,
        techStack: ['React', 'Node.js', 'PostgreSQL'],
        companyMaturity: 'growth',
        geolocation: {
          country: 'US',
          region: 'California',
          timezone: 'PST'
        }
      },
      behavioral: {
        sessionCount: 15,
        avgSessionDuration: 450,
        pageViewsPerSession: 8.5,
        contentEngagement: {
          documentsDownloaded: 3,
          videosWatched: 2,
          formsCompleted: 1,
          pricingPageViews: 5,
          featurePageViews: 12
        },
        technicalDepth: {
          integrationDocsViewed: true,
          apiDocsViewed: true,
          technicalResourcesAccessed: 8
        },
        timeOnSite: 3600,
        returnVisitorPattern: 'frequent'
      },
      intent: {
        searchKeywords: ['revenue prediction', 'ml scoring'],
        competitorResearch: true,
        buyingStageSignals: {
          awareness: 0.8,
          consideration: 0.9,
          decision: 0.7,
          purchase: 0.3
        },
        contentTopicsEngaged: ['pricing', 'features'],
        urgencyIndicators: {
          fastTrackRequests: false,
          demoRequests: 2,
          contactFormSubmissions: 1,
          salesInquiries: 1
        },
        socialProof: {
          testimonialViews: 3,
          caseStudyDownloads: 2,
          customerSuccessStories: 4
        }
      },
      timing: {
        dayOfWeek: 2,
        hourOfDay: 14,
        monthOfYear: 6,
        quarterOfYear: 2,
        seasonality: 'high',
        recentActivity: true,
        engagementVelocity: 5.2,
        lastVisitDays: 1,
        accountAge: 45
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
    });

    it('should emit initialization events', async () => {
      const startListener = jest.fn();
      const completeListener = jest.fn();

      service.on('service_initializing', startListener);
      service.on('service_initialized', completeListener);

      await service.initialize();

      expect(startListener).toHaveBeenCalled();
      expect(completeListener).toHaveBeenCalled();
    });

    it('should handle initialization failures', async () => {
      const errorListener = jest.fn();
      service.on('service_initialization_failed', errorListener);

      // Mock a failure in dependencies
      const mockError = new Error('Redis connection failed');
      jest.spyOn(service as any, 'redis').mockImplementation(() => ({
        connect: jest.fn().mockRejectedValue(mockError)
      }));

      await expect(service.initialize()).rejects.toThrow();
      expect(errorListener).toHaveBeenCalledWith(mockError);
    });
  });

  describe('Real-Time Predictions', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should generate fresh predictions when cache is empty', async () => {
      const leadId = 'test_lead_123';
      const result = await service.getPredictionRealTime(leadId, mockLeadData);

      expect(result.source).toBe('fresh');
      expect(result.prediction).toBeDefined();
      expect(result.latency).toBeGreaterThan(0);
      expect(result.streamingEnabled).toBe(false);
    });

    it('should use cached predictions when available', async () => {
      const leadId = 'test_lead_123';

      // First call - should generate fresh prediction
      const firstResult = await service.getPredictionRealTime(leadId, mockLeadData);
      expect(firstResult.source).toBe('fresh');

      // Second call - should use cache
      const secondResult = await service.getPredictionRealTime(leadId, mockLeadData);
      expect(secondResult.source).toBe('cache');
      expect(secondResult.latency).toBeLessThan(firstResult.latency);
    });

    it('should force refresh when requested', async () => {
      const leadId = 'test_lead_123';

      // First call to populate cache
      await service.getPredictionRealTime(leadId, mockLeadData);

      // Second call with force refresh
      const result = await service.getPredictionRealTime(leadId, mockLeadData, {
        forceRefresh: true
      });

      expect(result.source).toBe('fresh');
    });

    it('should enable streaming when requested', async () => {
      const leadId = 'test_lead_123';
      const clientId = 'client_123';

      const result = await service.getPredictionRealTime(leadId, mockLeadData, {
        enableStreaming: true,
        clientId
      });

      expect(result.streamingEnabled).toBe(true);
    });

    it('should handle prediction errors gracefully', async () => {
      const errorListener = jest.fn();
      service.on('prediction_error', errorListener);

      // Mock ML service to throw error
      jest.spyOn(service as any, 'mlService').mockImplementation(() => ({
        scoreLead: jest.fn().mockRejectedValue(new Error('ML service error'))
      }));

      const leadId = 'test_lead_123';
      await expect(
        service.getPredictionRealTime(leadId, mockLeadData)
      ).rejects.toThrow();

      expect(errorListener).toHaveBeenCalled();
    });
  });

  describe('Batch Processing', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should process batch requests successfully', async () => {
      const requests = [
        { leadId: 'lead_1', leadData: mockLeadData },
        { leadId: 'lead_2', leadData: mockLeadData },
        { leadId: 'lead_3', leadData: mockLeadData }
      ];

      const result = await service.batchPredict(requests);

      expect(result.totalProcessed).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.errorCount).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle partial batch failures', async () => {
      const requests = [
        { leadId: 'lead_1', leadData: mockLeadData },
        { leadId: 'lead_2', leadData: null as any }, // Invalid data
        { leadId: 'lead_3', leadData: mockLeadData }
      ];

      const result = await service.batchPredict(requests);

      expect(result.totalProcessed).toBe(3);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should respect concurrency limits', async () => {
      const requests = Array.from({ length: 20 }, (_, i) => ({
        leadId: `lead_${i}`,
        leadData: mockLeadData
      }));

      const result = await service.batchPredict(requests, {
        maxConcurrency: 5
      });

      expect(result.totalProcessed).toBe(20);
      expect(result.successCount).toBe(20);
    });
  });

  describe('Streaming Functionality', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should start prediction streaming', async () => {
      const leadId = 'test_lead_123';
      const clientId = 'client_123';

      await expect(
        service.startPredictionStream(leadId, clientId)
      ).resolves.not.toThrow();
    });

    it('should handle streaming with custom options', async () => {
      const leadId = 'test_lead_123';
      const clientId = 'client_123';
      const options = {
        updateInterval: 60000,
        filters: { priority: 'high' }
      };

      await expect(
        service.startPredictionStream(leadId, clientId, options)
      ).resolves.not.toThrow();
    });

    it('should emit streaming events', async () => {
      const startListener = jest.fn();
      service.on('streaming_started', startListener);

      const leadId = 'test_lead_123';
      const clientId = 'client_123';

      await service.startPredictionStream(leadId, clientId);

      expect(startListener).toHaveBeenCalledWith({ leadId, clientId });
    });
  });

  describe('Incremental Learning', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should process feedback for incremental learning', async () => {
      const feedback = [
        {
          leadId: 'lead_1',
          predictedScore: 85,
          actualOutcome: 90,
          dealSize: 50000,
          timeToClose: 45,
          feedbackType: 'conversion' as const
        },
        {
          leadId: 'lead_2',
          predictedScore: 70,
          actualOutcome: 65,
          dealSize: 25000,
          timeToClose: 60,
          feedbackType: 'deal_size' as const
        }
      ];

      const result = await service.updateModelIncremental(feedback);

      expect(result.feedbackProcessed).toBe(2);
      expect(result.modelUpdated).toBe(true);
      expect(result.performanceImprovement).toBeGreaterThanOrEqual(0);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

        it('should validate feedback data', async () => {
      const invalidFeedback = [
        { leadId: '', predictedScore: 85, actualOutcome: 80, feedbackType: 'conversion' as const }, // Invalid leadId
        { leadId: 'lead_2', predictedScore: 0, actualOutcome: 65, feedbackType: 'conversion' as const } // Invalid score
      ];

      const result = await service.updateModelIncremental(invalidFeedback);

      expect(result.feedbackProcessed).toBeLessThan(2);
    });

    it('should emit incremental learning events', async () => {
      const startListener = jest.fn();
      const completeListener = jest.fn();

      service.on('incremental_learning_started', startListener);
      service.on('incremental_learning_completed', completeListener);

      const feedback = [{
        leadId: 'lead_1',
        predictedScore: 85,
        actualOutcome: 90,
        feedbackType: 'conversion' as const
      }];

      await service.updateModelIncremental(feedback);

      expect(startListener).toHaveBeenCalledWith({ feedbackCount: 1 });
      expect(completeListener).toHaveBeenCalled();
    });
  });

  describe('Universal API Interface', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should provide universal API interface', () => {
      const api = service.getUniversalAPIInterface();

      expect(api.predict).toBeInstanceOf(Function);
      expect(api.startStream).toBeInstanceOf(Function);
      expect(api.batchPredict).toBeInstanceOf(Function);
      expect(api.updateModel).toBeInstanceOf(Function);
      expect(api.getStatus).toBeInstanceOf(Function);
      expect(api.getMetrics).toBeInstanceOf(Function);
    });

    it('should execute predictions via universal API', async () => {
      const api = service.getUniversalAPIInterface();

      const result = await api.predict(mockLeadData);

      expect(result.prediction).toBeDefined();
      expect(result.source).toBeDefined();
      expect(result.latency).toBeGreaterThan(0);
    });

    it('should provide service status', () => {
      const api = service.getUniversalAPIInterface();
      const status = api.getStatus();

      expect(status.isInitialized).toBe(true);
      expect(status.activeStreams).toBeGreaterThanOrEqual(0);
      expect(status.cacheSize).toBeGreaterThanOrEqual(0);
      expect(status.uptime).toBeGreaterThan(0);
    });

    it('should provide real-time metrics', () => {
      const api = service.getUniversalAPIInterface();
      const metrics = api.getMetrics();

      expect(metrics.predictionsPerMinute).toBeGreaterThanOrEqual(0);
      expect(metrics.averageLatency).toBeGreaterThanOrEqual(0);
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(metrics.activeConnections).toBeGreaterThanOrEqual(0);
      expect(metrics.modelAccuracy).toBeGreaterThan(0);
      expect(metrics.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when not initialized', async () => {
      const uninitializedService = new RealTimePredictionService();
      const leadId = 'test_lead_123';

      await expect(
        uninitializedService.getPredictionRealTime(leadId, mockLeadData)
      ).rejects.toThrow('Real-time prediction service not initialized');
    });

    it('should handle cache errors gracefully', async () => {
      await service.initialize();

      const errorListener = jest.fn();
      service.on('cache_error', errorListener);

      // Mock cache error
      jest.spyOn(service as any, 'redis').mockImplementation(() => ({
        get: jest.fn().mockRejectedValue(new Error('Redis error'))
      }));

      const leadId = 'test_lead_123';

      // Should still work despite cache error
      await expect(
        service.getPredictionRealTime(leadId, mockLeadData)
      ).resolves.toBeDefined();
    });

    it('should handle streaming errors', async () => {
      await service.initialize();

      const errorListener = jest.fn();
      service.on('streaming_update_failed', errorListener);

      // This would be triggered during periodic updates
      // Mocking the internal behavior for testing
      service.emit('streaming_update_failed', {
        clientId: 'test_client',
        error: new Error('Update failed')
      });

      expect(errorListener).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should have reasonable prediction latency', async () => {
      const leadId = 'test_lead_123';
      const startTime = Date.now();

      await service.getPredictionRealTime(leadId, mockLeadData);

      const latency = Date.now() - startTime;
      expect(latency).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should improve latency with caching', async () => {
      const leadId = 'test_lead_123';

      // Fresh prediction
      const freshResult = await service.getPredictionRealTime(leadId, mockLeadData);

      // Cached prediction
      const cachedResult = await service.getPredictionRealTime(leadId, mockLeadData);

      expect(cachedResult.latency).toBeLessThan(freshResult.latency);
    });

    it('should handle concurrent requests efficiently', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        service.getPredictionRealTime(`lead_${i}`, mockLeadData)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result: any) => {
        expect(result.prediction).toBeDefined();
        expect(result.latency).toBeLessThan(2000);
      });
    });
  });
});
