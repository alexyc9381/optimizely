import { AnalyticsService } from '../services/analytics-service';
import { PipelineFilters, PipelineVisualizationService } from '../services/pipeline-visualization-service';
import { RevenueAttributionService } from '../services/revenue-attribution-service';
import { VisualizationService } from '../services/visualization-service';

// Mock dependencies
jest.mock('../services/redis-client', () => ({
  redisManager: {
    getClient: jest.fn(() => ({
      get: jest.fn(),
      setex: jest.fn(),
      hset: jest.fn(),
      hget: jest.fn(),
      del: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG'),
    })),
  },
}));

jest.mock('../services/analytics-service');
jest.mock('../services/revenue-attribution-service');
jest.mock('../services/visualization-service');

describe('PipelineVisualizationService', () => {
  let pipelineService: PipelineVisualizationService;
  let mockAnalyticsService: jest.Mocked<AnalyticsService>;
  let mockRevenueService: jest.Mocked<RevenueAttributionService>;
  let mockVisualizationService: jest.Mocked<VisualizationService>;

  const mockDealsData = [
    {
      id: 'deal1',
      dealValue: 50000,
      stage: 'qualified',
      source: 'website',
      closeDate: '2024-02-15',
      companyName: 'Acme Corp',
      contactName: 'John Smith',
      lastActivity: '2024-01-15',
      stageEnteredDate: '2024-01-10',
      activities: 5,
      stakeholders: 3
    },
    {
      id: 'deal2',
      dealValue: 75000,
      stage: 'proposal',
      source: 'referral',
      closeDate: '2024-03-01',
      companyName: 'TechCorp',
      contactName: 'Jane Doe',
      lastActivity: '2024-01-20',
      stageEnteredDate: '2024-01-18',
      activities: 8,
      stakeholders: 5
    },
    {
      id: 'deal3',
      dealValue: 100000,
      stage: 'closed-won',
      source: 'direct',
      closeDate: '2024-01-30',
      companyName: 'Enterprise Ltd',
      contactName: 'Bob Johnson',
      lastActivity: '2024-01-30',
      stageEnteredDate: '2024-01-25',
      activities: 12,
      stakeholders: 8
    }
  ];

  beforeEach(() => {
    // Create mocks
    mockAnalyticsService = {
      query: jest.fn(),
    } as any;

    mockRevenueService = {} as any;

    mockVisualizationService = {
      getFunnelData: jest.fn(),
      getTimeSeriesData: jest.fn(),
    } as any;

    // Initialize service
    pipelineService = new PipelineVisualizationService(
      mockVisualizationService,
      mockAnalyticsService,
      mockRevenueService
    );

    // Mock analytics service responses
    mockAnalyticsService.query.mockResolvedValue({
      data: mockDealsData,
      metadata: {
        totalCount: mockDealsData.length,
        processedCount: mockDealsData.length,
        executionTime: 50,
        qualityScore: 0.95
      },
      aggregations: {}
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPipelineMetrics', () => {
    it('should calculate pipeline metrics correctly', async () => {
      const filters: PipelineFilters = {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      };

      const metrics = await pipelineService.getPipelineMetrics(filters);

      expect(metrics).toEqual({
        totalValue: 225000, // Sum of all deal values
        weightedValue: expect.any(Number), // Probability-adjusted value
        dealCount: 3,
        averageDealSize: 75000, // 225000 / 3
        averageSalesCycle: expect.any(Number),
        conversionRate: expect.any(Number), // Percentage of won deals
        velocity: expect.any(Number), // Deals per month
        forecastAccuracy: 85,
        stageDistribution: expect.any(Object),
        monthlyTrend: expect.any(Array),
      });

      expect(mockAnalyticsService.query).toHaveBeenCalledWith({
        dateRange: filters.dateRange,
        metrics: ['dealValue', 'dealCount', 'stageDuration', 'conversionRate'],
        dimensions: ['stage', 'source', 'closeDate'],
        filters: {},
      });
    });

    it('should handle empty results gracefully', async () => {
      mockAnalyticsService.query.mockResolvedValue({
        data: [],
        metadata: {
          totalCount: 0,
          processedCount: 0,
          executionTime: 10,
          qualityScore: 1.0
        },
        aggregations: {}
      });

      const metrics = await pipelineService.getPipelineMetrics();

      expect(metrics).toEqual({
        totalValue: 0,
        weightedValue: 0,
        dealCount: 0,
        averageDealSize: 0,
        averageSalesCycle: 0,
        conversionRate: 0,
        velocity: 0,
        forecastAccuracy: 85,
        stageDistribution: expect.any(Object),
        monthlyTrend: [],
      });
    });
  });

  describe('getDeals', () => {
    it('should transform deal data correctly', async () => {
      const deals = await pipelineService.getDeals();

      expect(deals).toHaveLength(3);
      expect(deals[0]).toMatchObject({
        id: 'deal1',
        title: expect.any(String),
        value: 50000,
        stage: 'qualified',
        companyName: 'Acme Corp',
        contactName: 'John Smith',
        healthScore: expect.any(Number),
        status: expect.stringMatching(/^(on-track|at-risk|stalled|accelerating)$/),
        daysInStage: expect.any(Number),
        activities: 5,
        stakeholders: 3
      });
    });

    it('should apply filters correctly', async () => {
      const filters: PipelineFilters = {
        stages: ['qualified', 'proposal'],
        sources: ['website'],
        dealSizeRange: { min: 30000, max: 100000 },
      };

      await pipelineService.getDeals(filters);

      expect(mockAnalyticsService.query).toHaveBeenCalledWith({
        dateRange: expect.any(Object),
        metrics: ['dealValue', 'activities', 'stakeholders', 'engagementScore'],
        dimensions: ['dealId', 'stage', 'companyName', 'contactName', 'source', 'lastActivity'],
        filters: {
          stage: { $in: ['qualified', 'proposal'] },
          source: { $in: ['website'] },
          dealValue: { $gte: 30000, $lte: 100000 },
        },
        limit: 100,
      });
    });
  });

  describe('getPipelineVisualization', () => {
    beforeEach(() => {
      // Mock visualization service responses
      mockVisualizationService.getFunnelData.mockResolvedValue({
        config: { type: 'funnel', title: 'Pipeline Funnel' },
        series: [{ name: 'Pipeline', data: [] }],
        metadata: { totalDataPoints: 0, dateRange: { start: '', end: '' }, queryTime: 0 },
      });

      mockVisualizationService.getTimeSeriesData.mockResolvedValue({
        config: { type: 'line', title: 'Velocity Chart' },
        series: [{ name: 'Velocity', data: [] }],
        metadata: { totalDataPoints: 0, dateRange: { start: '', end: '' }, queryTime: 0 },
      });
    });

    it('should return complete pipeline visualization data', async () => {
      const result = await pipelineService.getPipelineVisualization();

      expect(result).toEqual({
        overview: expect.any(Object),
        stages: expect.any(Array),
        deals: expect.any(Array),
        funnel: expect.any(Object),
        velocity: expect.any(Object),
        forecast: expect.any(Object),
        heatmap: expect.any(Object),
        realTimeUpdates: expect.any(Object),
      });

      // Verify all methods were called
      expect(mockAnalyticsService.query).toHaveBeenCalledTimes(3); // metrics, deals, and real-time updates
      expect(mockVisualizationService.getFunnelData).toHaveBeenCalledTimes(1);
      expect(mockVisualizationService.getTimeSeriesData).toHaveBeenCalledTimes(2); // velocity and forecast
    });

    it('should emit pipeline update event', async () => {
      const eventSpy = jest.fn();
      pipelineService.on('pipelineUpdated', eventSpy);

      await pipelineService.getPipelineVisualization();

      expect(eventSpy).toHaveBeenCalledWith({
        timestamp: expect.any(String),
        metrics: expect.any(Object),
        dealCount: expect.any(Number),
        totalValue: expect.any(Number),
      });
    });

    it('should handle errors gracefully', async () => {
      mockAnalyticsService.query.mockRejectedValue(new Error('Analytics error'));

      await expect(pipelineService.getPipelineVisualization()).rejects.toThrow(
        'Failed to generate pipeline visualization'
      );
    });
  });

  describe('Health Score Calculation', () => {
    it('should calculate health score correctly', async () => {
      const deals = await pipelineService.getDeals();

      // Check that health scores are within valid range
      deals.forEach(deal => {
        expect(deal.healthScore).toBeGreaterThanOrEqual(0);
        expect(deal.healthScore).toBeLessThanOrEqual(100);
      });

      // Deal with high activity should have higher health score
      const highActivityDeal = deals.find(d => d.activities && d.activities > 8);
      if (highActivityDeal) {
        expect(highActivityDeal.healthScore).toBeGreaterThan(70);
      }
    });
  });

  describe('Deal Status Assessment', () => {
    it('should assess deal status correctly', async () => {
      const deals = await pipelineService.getDeals();

      deals.forEach(deal => {
        expect(['on-track', 'at-risk', 'stalled', 'accelerating']).toContain(deal.status);
      });
    });
  });

  describe('Real-Time Updates', () => {
    it('should return real-time updates', async () => {
      // Mock last 24h data
      mockAnalyticsService.query.mockResolvedValue({
        data: [
          { action: 'created', dealCount: 1 },
          { action: 'won', dealCount: 1 },
          { action: 'lost', dealCount: 0 },
        ],
        metadata: {
          totalCount: 2,
          processedCount: 2,
          executionTime: 25,
          qualityScore: 0.9
        },
        aggregations: {}
      });

      const updates = await pipelineService.getRealTimeUpdates();

      expect(updates).toEqual({
        lastUpdated: expect.any(String),
        changesLast24h: 2,
        newDeals: 1,
        closedDeals: 1,
        lostDeals: 0,
      });
    });

    it('should handle errors in real-time updates gracefully', async () => {
      mockAnalyticsService.query.mockRejectedValue(new Error('Analytics error'));

      const updates = await pipelineService.getRealTimeUpdates();

      expect(updates).toEqual({
        lastUpdated: expect.any(String),
        changesLast24h: 0,
        newDeals: 0,
        closedDeals: 0,
        lostDeals: 0,
      });
    });
  });

  describe('Caching', () => {
    it('should cache pipeline visualization data', async () => {
      const mockRedisClient = {
        get: jest.fn().mockResolvedValue(null),
        setex: jest.fn(),
      };

      // Mock the redis client in the service
      (pipelineService as any).redisClient = mockRedisClient;

      await pipelineService.getPipelineVisualization();

      expect(mockRedisClient.setex).toHaveBeenCalled();
    });
  });

  describe('Forecast Generation', () => {
    it('should generate forecast data from historical data', async () => {
      const historicalData = [
        { label: '2024-01', value: 100000, timestamp: '2024-01-01T00:00:00Z' },
        { label: '2024-02', value: 120000, timestamp: '2024-02-01T00:00:00Z' },
        { label: '2024-03', value: 150000, timestamp: '2024-03-01T00:00:00Z' },
      ];

      mockVisualizationService.getTimeSeriesData.mockResolvedValue({
        config: { type: 'line', title: 'Revenue' },
        series: [{ name: 'Historical', data: historicalData }],
        metadata: { totalDataPoints: 3, dateRange: { start: '', end: '' }, queryTime: 0 },
      });

      const forecast = await pipelineService.getForecastChart();

      expect(forecast.series).toHaveLength(2); // Historical + Forecast
      expect(forecast.series[1].name).toBe('Forecast');
      expect(forecast.series[1].data.length).toBeGreaterThan(0);
    });
  });
});
