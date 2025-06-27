import { AccuracyTrackingService } from '../services/accuracy-tracking-service';
import { LeadData } from '../services/ml-types';

// Mock dependencies
jest.mock('../services/ml-scoring-service');
jest.mock('../services/confidence-scoring-service', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    calculateConfidenceMetrics: jest.fn().mockResolvedValue({
      overallConfidence: 0.85,
    }),
  })),
}));

describe('AccuracyTrackingService', () => {
  let service: AccuracyTrackingService;
  let mockLeadData: LeadData;

  beforeEach(async () => {
    service = new AccuracyTrackingService();

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
          timezone: 'EST',
        },
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
          featurePageViews: 10,
        },
        technicalDepth: {
          integrationDocsViewed: true,
          apiDocsViewed: true,
          technicalResourcesAccessed: 7,
        },
        timeOnSite: 3600,
        returnVisitorPattern: 'frequent',
      },
      intent: {
        searchKeywords: ['CRM integration', 'API documentation'],
        competitorResearch: true,
        buyingStageSignals: {
          awareness: 0.9,
          consideration: 0.8,
          decision: 0.6,
          purchase: 0.3,
        },
        contentTopicsEngaged: ['integrations', 'pricing', 'enterprise'],
        urgencyIndicators: {
          fastTrackRequests: true,
          demoRequests: 2,
          contactFormSubmissions: 1,
          salesInquiries: 1,
        },
        socialProof: {
          testimonialViews: 3,
          caseStudyDownloads: 2,
          customerSuccessStories: 1,
        },
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
        accountAge: 30,
      },
    };

    await service.initialize();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    test('should initialize successfully', async () => {
      const newService = new AccuracyTrackingService();
      await expect(newService.initialize()).resolves.not.toThrow();
    });

    test('should emit initialization events', async () => {
      const newService = new AccuracyTrackingService();
      const initializingSpy = jest.fn();
      const initializedSpy = jest.fn();

      newService.on('service_initializing', initializingSpy);
      newService.on('service_initialized', initializedSpy);

      await newService.initialize();

      expect(initializingSpy).toHaveBeenCalledTimes(1);
      expect(initializedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Record Prediction Outcome', () => {
    test('should record successful prediction outcome', async () => {
      const predictionId = 'test_prediction_123';
      const predictedScore = 85;
      const actualOutcome = {
        converted: true,
        dealSize: 50000,
        timeToClose: 45,
        conversionDate: new Date(),
        ltv: 150000,
      };

      const result = await service.recordPredictionOutcome(
        predictionId,
        mockLeadData,
        predictedScore,
        actualOutcome,
        {}
      );

      expect(result).toBeDefined();
      expect(result.predictionId).toBe(predictionId);
      expect(result.predictedScore).toBe(predictedScore);
      expect(result.actualOutcome).toEqual(actualOutcome);
    });
  });

  describe('Universal API Interface', () => {
    test('should provide universal API interface', () => {
      const api = service.getUniversalAPIInterface();

      expect(api).toBeDefined();
      expect(typeof api.recordOutcome).toBe('function');
      expect(typeof api.getDashboard).toBe('function');
      expect(typeof api.getStatus).toBe('function');
    });
  });
});
