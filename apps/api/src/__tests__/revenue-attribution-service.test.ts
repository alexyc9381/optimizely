import { LeadData } from '../services/ml-types';
import { RevenueAttributionService } from '../services/revenue-attribution-service';

describe('RevenueAttributionService', () => {
  let service: RevenueAttributionService;
  let mockLeadData: LeadData;
  let mockRevenueOutcome: any;

  beforeEach(async () => {
    service = new RevenueAttributionService();

    // Mock lead data for testing
    mockLeadData = {
      firmographic: {
        companySize: 'mid_market',
        industry: 'saas',
        revenue: 5000000,
        employees: 100,
        techStack: ['React', 'Node.js'],
        companyMaturity: 'growth',
        geolocation: {
          country: 'US',
          region: 'North America',
          timezone: 'EST'
        }
      },
      behavioral: {
        sessionCount: 15,
        avgSessionDuration: 420,
        pageViewsPerSession: 8,
        contentEngagement: {
          documentsDownloaded: 3,
          videosWatched: 2,
          formsCompleted: 1,
          pricingPageViews: 5,
          featurePageViews: 10
        },
        technicalDepth: {
          integrationDocsViewed: true,
          apiDocsViewed: true,
          technicalResourcesAccessed: 7
        },
        timeOnSite: 3600,
        returnVisitorPattern: 'frequent'
      },
      intent: {
        searchKeywords: ['CRM integration', 'API documentation'],
        competitorResearch: true,
        buyingStageSignals: {
          awareness: 0.9,
          consideration: 0.8,
          decision: 0.6,
          purchase: 0.3
        },
        contentTopicsEngaged: ['integrations', 'pricing', 'enterprise'],
        urgencyIndicators: {
          fastTrackRequests: true,
          demoRequests: 2,
          contactFormSubmissions: 1,
          salesInquiries: 1
        },
        socialProof: {
          testimonialViews: 3,
          caseStudyDownloads: 2,
          customerSuccessStories: 1
        }
      },
      timing: {
        dayOfWeek: 2,
        hourOfDay: 14,
        monthOfYear: 6,
        quarterOfYear: 2,
        seasonality: 'high',
        recentActivity: true,
        engagementVelocity: 3.5,
        lastVisitDays: 1,
        accountAge: 30
      }
    };

    // Mock revenue outcome
    mockRevenueOutcome = {
      dealClosed: true,
      dealSize: 50000,
      closedDate: new Date(),
      acquisitionCost: 5000,
      timeToClose: 45,
      ltv: 150000
    };

    await service.initialize();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    test('should initialize successfully', async () => {
      const newService = new RevenueAttributionService();
      await expect(newService.initialize()).resolves.not.toThrow();
    });

    test('should emit initialization events', async () => {
      const newService = new RevenueAttributionService();
      const initializingSpy = jest.fn();
      const initializedSpy = jest.fn();

      newService.on('service_initializing', initializingSpy);
      newService.on('service_initialized', initializedSpy);

      await newService.initialize();

      expect(initializingSpy).toHaveBeenCalledTimes(1);
      expect(initializedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Record Revenue Outcome', () => {
    test('should record successful revenue outcome', async () => {
      const predictionId = 'test_prediction_123';
      const originalScore = 85;

      const attributionRecord = await service.recordRevenueOutcome(
        predictionId,
        mockLeadData,
        originalScore,
        mockRevenueOutcome,
        {}
      );

      expect(attributionRecord).toBeDefined();
      expect(attributionRecord.predictionId).toBe(predictionId);
      expect(attributionRecord.originalScore).toBe(originalScore);
      expect(attributionRecord.revenueOutcome).toEqual(mockRevenueOutcome);
      expect(attributionRecord.attributionId).toBeTruthy();
      expect(attributionRecord.recordedAt).toBeInstanceOf(Date);
    });

    test('should handle failed deals', async () => {
      const failedOutcome = {
        ...mockRevenueOutcome,
        dealClosed: false,
        dealSize: 0
      };

      const attributionRecord = await service.recordRevenueOutcome(
        'test_prediction_124',
        mockLeadData,
        75,
        failedOutcome,
        {}
      );

      expect(attributionRecord.revenueOutcome.dealClosed).toBe(false);
      expect(attributionRecord.revenueOutcome.dealSize).toBe(0);
    });

    test('should throw error if service not initialized', async () => {
      const uninitializedService = new RevenueAttributionService();

      await expect(
        uninitializedService.recordRevenueOutcome(
          'test_prediction_125',
          mockLeadData,
          85,
          mockRevenueOutcome,
          {}
        )
      ).rejects.toThrow('Revenue attribution service not initialized');
    });
  });

  describe('Attribution Dashboard', () => {
    test('should generate comprehensive dashboard', async () => {
      // First record some revenue outcomes
      await service.recordRevenueOutcome(
        'test_pred_1',
        mockLeadData,
        85,
        mockRevenueOutcome,
        { campaign: 'Q4-2024' }
      );

      const dashboard = await service.getAttributionDashboard();

      expect(dashboard).toBeDefined();
      expect(dashboard.overview).toBeDefined();
      expect(dashboard.attributionBreakdown).toBeDefined();
      expect(dashboard.modelROI).toBeDefined();
      expect(dashboard.touchpointAnalysis).toBeDefined();
      expect(dashboard.revenueForecasting).toBeDefined();
      expect(dashboard.campaignAttribution).toBeDefined();
      expect(dashboard.industryPerformance).toBeDefined();
      expect(dashboard.recommendations).toBeDefined();
      expect(dashboard.generatedAt).toBeInstanceOf(Date);
    });

    test('should handle dashboard filters', async () => {
      const filters = {
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        industry: 'saas',
        campaign: 'Q4-2024'
      };

      const dashboard = await service.getAttributionDashboard(filters);
      expect(dashboard.filters).toEqual(filters);
    });
  });

  describe('Attribution Analysis', () => {
    test('should run multi-touch attribution analysis', async () => {
      const analysisResult = await service.runAttributionAnalysis('multi-touch');

      expect(analysisResult).toBeDefined();
      expect(analysisResult.modelType).toBe('multi-touch');
      expect(analysisResult.analysisId).toBeTruthy();
      expect(analysisResult.startedAt).toBeInstanceOf(Date);
      expect(analysisResult.completedAt).toBeInstanceOf(Date);
      expect(analysisResult.attributionResults).toBeDefined();
      expect(analysisResult.revenueImpact).toBeDefined();
      expect(analysisResult.insights).toBeDefined();
      expect(analysisResult.recommendations).toBeDefined();
    });

    test('should handle different attribution models', async () => {
      const models = ['first-touch', 'last-touch', 'linear', 'time-decay'];

      for (const model of models) {
        const result = await service.runAttributionAnalysis(model as any);
        expect(result.modelType).toBe(model);
      }
    });

    test('should throw error for invalid model type', async () => {
      await expect(
        service.runAttributionAnalysis('invalid-model' as any)
      ).rejects.toThrow('Attribution model invalid-model not found');
    });
  });

  describe('ROI Metrics', () => {
    test('should calculate ROI metrics', async () => {
      // Record some revenue first
      await service.recordRevenueOutcome(
        'test_roi_1',
        mockLeadData,
        85,
        mockRevenueOutcome,
        {}
      );

      const roiMetrics = await service.getROIMetrics();

      expect(roiMetrics).toBeDefined();
      expect(roiMetrics.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(roiMetrics.totalCosts).toBeGreaterThanOrEqual(0);
      expect(roiMetrics.netRevenue).toBeDefined();
      expect(roiMetrics.roi).toBeDefined();
      expect(roiMetrics.deals).toBeGreaterThanOrEqual(0);
      expect(roiMetrics.timeRange).toBeDefined();
      expect(roiMetrics.calculatedAt).toBeInstanceOf(Date);
    });

    test('should handle custom time range for ROI', async () => {
      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-06-30')
      };

      const roiMetrics = await service.getROIMetrics(timeRange);
      expect(roiMetrics.timeRange).toEqual(timeRange);
    });
  });

  describe('Universal API Interface', () => {
    test('should provide universal API interface', () => {
      const api = service.getUniversalAPIInterface();

      expect(api).toBeDefined();
      expect(typeof api.recordRevenue).toBe('function');
      expect(typeof api.getDashboard).toBe('function');
      expect(typeof api.runAnalysis).toBe('function');
      expect(typeof api.getROI).toBe('function');
      expect(typeof api.getStatus).toBe('function');
      expect(typeof api.exportData).toBe('function');
    });

    test('should export data in different formats', async () => {
      // Record some data first
      await service.recordRevenueOutcome(
        'test_export_1',
        mockLeadData,
        85,
        mockRevenueOutcome,
        {}
      );

      const api = service.getUniversalAPIInterface();

      // Test JSON export
      const jsonData = await api.exportData('json');
      expect(typeof jsonData).toBe('string');
      expect(() => JSON.parse(jsonData)).not.toThrow();

      // Test CSV export
      const csvData = await api.exportData('csv');
      expect(typeof csvData).toBe('string');
      expect(csvData).toContain('attributionId,predictionId');
    });

    test('should provide service status', () => {
      const api = service.getUniversalAPIInterface();
      const status = api.getStatus();

      expect(status).toBeDefined();
      expect(status.isInitialized).toBe(true);
      expect(status.uptime).toBeGreaterThan(0);
      expect(status.totalAttributionRecords).toBeGreaterThanOrEqual(0);
      expect(status.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(status.totalDeals).toBeGreaterThanOrEqual(0);
      expect(status.conversionRate).toBeGreaterThanOrEqual(0);
      expect(['healthy', 'warning', 'critical']).toContain(status.healthStatus);
      expect(status.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Event Emission', () => {
    test('should emit revenue outcome recorded event', async () => {
      const eventSpy = jest.fn();
      service.on('revenue_outcome_recorded', eventSpy);

      await service.recordRevenueOutcome(
        'test_event_1',
        mockLeadData,
        85,
        mockRevenueOutcome,
        {}
      );

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0]).toHaveProperty('attributionId');
    });

    test('should emit dashboard generated event', async () => {
      const eventSpy = jest.fn();
      service.on('attribution_dashboard_generated', eventSpy);

      await service.getAttributionDashboard();

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0]).toHaveProperty('overview');
    });

    test('should emit analysis events', async () => {
      const startSpy = jest.fn();
      const completeSpy = jest.fn();

      service.on('attribution_analysis_started', startSpy);
      service.on('attribution_analysis_completed', completeSpy);

      await service.runAttributionAnalysis('linear');

      expect(startSpy).toHaveBeenCalledTimes(1);
      expect(completeSpy).toHaveBeenCalledTimes(1);
    });
  });
});
