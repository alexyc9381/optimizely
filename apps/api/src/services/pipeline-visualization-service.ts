import { EventEmitter } from 'events';
import { AnalyticsService } from './analytics-service';
import { redisManager } from './redis-client';
import { RevenueAttributionService } from './revenue-attribution-service';
import { ChartData, ChartSeries, VisualizationService } from './visualization-service';

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  averageDuration: number; // days
  color: string;
}

export interface DealCard {
  id: string;
  title: string;
  value: number;
  probability: number;
  stage: string;
  stageId: string;
  lastActivity: string;
  daysInStage: number;
  companyName: string;
  contactName: string;
  source: string;
  predictedCloseDate: string;
  healthScore: number; // 0-100
  status: 'on-track' | 'at-risk' | 'stalled' | 'accelerating';
  activities: number;
  stakeholders: number;
}

export interface PipelineMetrics {
  totalValue: number;
  weightedValue: number;
  dealCount: number;
  averageDealSize: number;
  averageSalesCycle: number;
  conversionRate: number;
  velocity: number; // deals per month
  forecastAccuracy: number;
  stageDistribution: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    value: number;
    deals: number;
    conversion: number;
  }>;
}

export interface PipelineVisualizationData {
  overview: PipelineMetrics;
  stages: PipelineStage[];
  deals: DealCard[];
  funnel: ChartData;
  velocity: ChartData;
  forecast: ChartData;
  heatmap: ChartData;
  realTimeUpdates: {
    lastUpdated: string;
    changesLast24h: number;
    newDeals: number;
    closedDeals: number;
    lostDeals: number;
  };
}

export interface PipelineFilters {
  dateRange?: { start: Date; end: Date };
  stages?: string[];
  sources?: string[];
  teams?: string[];
  regions?: string[];
  dealSizeRange?: { min: number; max: number };
  probability?: { min: number; max: number };
  riskLevel?: ('low' | 'medium' | 'high')[];
}

export class PipelineVisualizationService extends EventEmitter {
  private visualizationService: VisualizationService;
  private analyticsService: AnalyticsService;
  private revenueService: RevenueAttributionService;
  private redisClient: any;
  private cachePrefix = 'pipeline:';
  private cacheTTL = 180; // 3 minutes for real-time data

  // Default pipeline stages (configurable per customer)
  private defaultStages: PipelineStage[] = [
    { id: 'lead', name: 'Lead', order: 1, probability: 10, averageDuration: 7, color: '#6B7280' },
    { id: 'qualified', name: 'Qualified', order: 2, probability: 25, averageDuration: 14, color: '#3B82F6' },
    { id: 'needs-analysis', name: 'Needs Analysis', order: 3, probability: 40, averageDuration: 21, color: '#8B5CF6' },
    { id: 'proposal', name: 'Proposal', order: 4, probability: 60, averageDuration: 14, color: '#F59E0B' },
    { id: 'negotiation', name: 'Negotiation', order: 5, probability: 80, averageDuration: 10, color: '#10B981' },
    { id: 'closed-won', name: 'Closed Won', order: 6, probability: 100, averageDuration: 0, color: '#059669' },
    { id: 'closed-lost', name: 'Closed Lost', order: 7, probability: 0, averageDuration: 0, color: '#DC2626' }
  ];

  constructor(
    visualizationService: VisualizationService,
    analyticsService: AnalyticsService,
    revenueService: RevenueAttributionService
  ) {
    super();
    this.visualizationService = visualizationService;
    this.analyticsService = analyticsService;
    this.revenueService = revenueService;
    this.redisClient = redisManager.getClient();
  }

  // ============================================================================
  // MAIN PIPELINE VISUALIZATION API
  // ============================================================================

  /**
   * Get complete pipeline visualization data for executive dashboard
   */
  async getPipelineVisualization(filters: PipelineFilters = {}): Promise<PipelineVisualizationData> {
    const cacheKey = this.generateCacheKey('complete', filters);

    try {
      // Check cache first
      const cached = await this.getCachedData(cacheKey);
      if (cached) return cached;

      // Parallel execution for performance
      const [overview, deals, funnel, velocity, forecast, heatmap, realTimeUpdates] = await Promise.all([
        this.getPipelineMetrics(filters),
        this.getDeals(filters),
        this.getPipelineFunnel(filters),
        this.getVelocityChart(filters),
        this.getForecastChart(filters),
        this.getPipelineHeatmap(filters),
        this.getRealTimeUpdates()
      ]);

      const result: PipelineVisualizationData = {
        overview,
        stages: this.defaultStages.filter(s => s.id !== 'closed-lost'), // Exclude lost deals from main view
        deals,
        funnel,
        velocity,
        forecast,
        heatmap,
        realTimeUpdates
      };

      // Cache the result
      await this.cacheData(cacheKey, result);

      // Emit event for real-time updates
      this.emit('pipelineUpdated', {
        timestamp: new Date().toISOString(),
        metrics: overview,
        dealCount: deals.length,
        totalValue: overview.totalValue
      });

      return result;

    } catch (error) {
      console.error('Error generating pipeline visualization:', error);
      throw new Error(`Failed to generate pipeline visualization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get pipeline overview metrics
   */
  async getPipelineMetrics(filters: PipelineFilters = {}): Promise<PipelineMetrics> {
    const dateRange = filters.dateRange || this.getDefaultDateRange();

    try {
      // Build analytics query
      const query = {
        dateRange,
        metrics: ['dealValue', 'dealCount', 'stageDuration', 'conversionRate'],
        dimensions: ['stage', 'source', 'closeDate'],
        filters: this.buildAnalyticsFilters(filters)
      };

      const result = await this.analyticsService.query(query);
      const deals = result.data;

      // Calculate metrics
      const totalValue = deals.reduce((sum, deal) => sum + (deal.dealValue || 0), 0);
      const dealCount = deals.length;
      const averageDealSize = dealCount > 0 ? totalValue / dealCount : 0;

      // Calculate weighted value (probability-adjusted)
      const weightedValue = deals.reduce((sum, deal) => {
        const stage = this.defaultStages.find(s => s.id === deal.stage);
        const probability = stage ? stage.probability / 100 : 0.5;
        return sum + (deal.dealValue || 0) * probability;
      }, 0);

      // Calculate conversion rate
      const wonDeals = deals.filter(d => d.stage === 'closed-won').length;
      const conversionRate = dealCount > 0 ? (wonDeals / dealCount) * 100 : 0;

      // Calculate average sales cycle
      const closedDeals = deals.filter(d => d.stage === 'closed-won' || d.stage === 'closed-lost');
      const averageSalesCycle = this.calculateAverageSalesCycle(closedDeals);

      // Calculate velocity (deals closed per month)
      const monthsInRange = this.getMonthsInRange(dateRange);
      const velocity = monthsInRange > 0 ? wonDeals / monthsInRange : 0;

      // Stage distribution
      const stageDistribution: Record<string, number> = {};
      this.defaultStages.forEach(stage => {
        stageDistribution[stage.name] = deals.filter(d => d.stage === stage.id).length;
      });

      // Monthly trend
      const monthlyTrend = this.calculateMonthlyTrend(deals, dateRange);

      // Forecast accuracy (placeholder - would require historical data)
      const forecastAccuracy = 85; // TODO: Calculate based on historical predictions vs actual

      return {
        totalValue,
        weightedValue,
        dealCount,
        averageDealSize,
        averageSalesCycle,
        conversionRate,
        velocity,
        forecastAccuracy,
        stageDistribution,
        monthlyTrend
      };

    } catch (error) {
      console.error('Error calculating pipeline metrics:', error);
      throw new Error('Failed to calculate pipeline metrics');
    }
  }

  /**
   * Get pipeline deals with enhanced data
   */
  async getDeals(filters: PipelineFilters = {}, limit: number = 100): Promise<DealCard[]> {
    try {
      const query = {
        dateRange: filters.dateRange || this.getDefaultDateRange(),
        metrics: ['dealValue', 'activities', 'stakeholders', 'engagementScore'],
        dimensions: ['dealId', 'stage', 'companyName', 'contactName', 'source', 'lastActivity'],
        filters: this.buildAnalyticsFilters(filters),
        limit
      };

      const result = await this.analyticsService.query(query);
      const deals = result.data;

      return deals.map(deal => this.transformDealData(deal));

    } catch (error) {
      console.error('Error fetching deals:', error);
      throw new Error('Failed to fetch pipeline deals');
    }
  }

  /**
   * Get pipeline funnel visualization
   */
  async getPipelineFunnel(filters: PipelineFilters = {}): Promise<ChartData> {
    try {
      const stages = this.defaultStages.filter(s => s.id !== 'closed-lost');
      const stageIds = stages.map(s => s.id);

      return await this.visualizationService.getFunnelData(
        stageIds,
        filters.dateRange || this.getDefaultDateRange(),
        this.buildAnalyticsFilters(filters)
      );

    } catch (error) {
      console.error('Error generating pipeline funnel:', error);
      throw new Error('Failed to generate pipeline funnel');
    }
  }

  /**
   * Get sales velocity chart
   */
  async getVelocityChart(filters: PipelineFilters = {}): Promise<ChartData> {
    try {
      return await this.visualizationService.getTimeSeriesData(
        'dealVelocity',
        filters.dateRange || this.getDefaultDateRange(),
        'week',
        this.buildAnalyticsFilters(filters)
      );

    } catch (error) {
      console.error('Error generating velocity chart:', error);
      throw new Error('Failed to generate velocity chart');
    }
  }

  /**
   * Get revenue forecast chart
   */
  async getForecastChart(filters: PipelineFilters = {}): Promise<ChartData> {
    try {
      const dateRange = filters.dateRange || this.getDefaultDateRange();

      // Get historical data and generate forecast
      const historicalData = await this.visualizationService.getTimeSeriesData(
        'revenue',
        dateRange,
        'month',
        this.buildAnalyticsFilters(filters)
      );

      // Add forecast series (simplified - would use ML model in production)
      const forecastSeries: ChartSeries = {
        name: 'Forecast',
        data: this.generateForecastData(historicalData.series[0]?.data || []),
        color: '#F59E0B',
        type: 'line'
      };

      return {
        ...historicalData,
        config: {
          ...historicalData.config,
          title: 'Revenue Forecast',
          colors: ['#3B82F6', '#F59E0B']
        },
        series: [...historicalData.series, forecastSeries]
      };

    } catch (error) {
      console.error('Error generating forecast chart:', error);
      throw new Error('Failed to generate forecast chart');
    }
  }

  /**
   * Get pipeline heatmap for deal activity
   */
  async getPipelineHeatmap(filters: PipelineFilters = {}): Promise<ChartData> {
    try {
      // Generate heatmap data showing deal activity by stage and time
      const dateRange = filters.dateRange || this.getDefaultDateRange();
      const stages = this.defaultStages.filter(s => s.id !== 'closed-lost');

      const series: ChartSeries[] = stages.map(stage => ({
        name: stage.name,
        data: this.generateHeatmapData(stage.id, dateRange),
        color: stage.color
      }));

      return {
        config: {
          type: 'heatmap',
          title: 'Pipeline Activity Heatmap',
          xAxis: { title: 'Time' },
          yAxis: { title: 'Pipeline Stage' },
          responsive: true
        },
        series,
        metadata: {
          totalDataPoints: series.reduce((sum, s) => sum + s.data.length, 0),
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          },
          queryTime: 0
        }
      };

    } catch (error) {
      console.error('Error generating pipeline heatmap:', error);
      throw new Error('Failed to generate pipeline heatmap');
    }
  }

  /**
   * Get real-time updates for the pipeline
   */
  async getRealTimeUpdates(): Promise<PipelineVisualizationData['realTimeUpdates']> {
    try {
      const last24h = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const query = {
        dateRange: last24h,
        metrics: ['dealCount'],
        dimensions: ['action', 'stage'],
        filters: {}
      };

      const result = await this.analyticsService.query(query);
      const activities = result.data;

      const newDeals = activities.filter(a => a.action === 'created').length;
      const closedDeals = activities.filter(a => a.action === 'won').length;
      const lostDeals = activities.filter(a => a.action === 'lost').length;

      return {
        lastUpdated: new Date().toISOString(),
        changesLast24h: activities.length,
        newDeals,
        closedDeals,
        lostDeals
      };

    } catch (error) {
      console.error('Error getting real-time updates:', error);
      return {
        lastUpdated: new Date().toISOString(),
        changesLast24h: 0,
        newDeals: 0,
        closedDeals: 0,
        lostDeals: 0
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private transformDealData(deal: any): DealCard {
    const stage = this.defaultStages.find(s => s.id === deal.stage);
    const daysInStage = this.calculateDaysInStage(deal.stageEnteredDate);
    const healthScore = this.calculateHealthScore(deal);
    const status = this.getDealStatus(deal, daysInStage, stage);

    return {
      id: deal.dealId || deal.id,
      title: deal.title || `${deal.companyName} Deal`,
      value: deal.dealValue || 0,
      probability: stage ? stage.probability : 50,
      stage: stage ? stage.name : 'Unknown',
      stageId: deal.stage,
      lastActivity: deal.lastActivity || new Date().toISOString(),
      daysInStage,
      companyName: deal.companyName || 'Unknown Company',
      contactName: deal.contactName || 'Unknown Contact',
      source: deal.source || 'Direct',
      predictedCloseDate: this.calculatePredictedCloseDate(deal, stage),
      healthScore,
      status,
      activities: deal.activities || 0,
      stakeholders: deal.stakeholders || 1
    };
  }

  private calculateDaysInStage(stageEnteredDate?: string): number {
    if (!stageEnteredDate) return 0;
    const entered = new Date(stageEnteredDate);
    const now = new Date();
    return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateHealthScore(deal: any): number {
    // Simplified health score calculation
    let score = 70; // Base score

    // Activity score (0-20 points)
    const activityScore = Math.min((deal.activities || 0) * 2, 20);
    score += activityScore;

    // Engagement score (0-10 points)
    const engagementScore = Math.min((deal.engagementScore || 0) / 10, 10);
    score += engagementScore;

    // Stakeholder count (-5 to +15 points)
    const stakeholderScore = Math.min((deal.stakeholders || 1) * 5 - 5, 15);
    score += stakeholderScore;

    return Math.max(0, Math.min(100, score));
  }

  private getDealStatus(deal: any, daysInStage: number, stage?: PipelineStage): DealCard['status'] {
    if (!stage) return 'stalled';

    const averageDuration = stage.averageDuration;

    if (daysInStage > averageDuration * 1.5) return 'stalled';
    if (daysInStage > averageDuration) return 'at-risk';
    if (deal.activities > 5 && daysInStage < averageDuration * 0.7) return 'accelerating';

    return 'on-track';
  }

  private calculatePredictedCloseDate(deal: any, stage?: PipelineStage): string {
    if (!stage) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Estimate remaining days based on stage progression
    const remainingStages = this.defaultStages.filter(s => s.order > stage.order && s.id !== 'closed-lost');
    const remainingDays = remainingStages.reduce((sum, s) => sum + s.averageDuration, 0);

    return new Date(Date.now() + remainingDays * 24 * 60 * 60 * 1000).toISOString();
  }

  private calculateAverageSalesCycle(closedDeals: any[]): number {
    if (closedDeals.length === 0) return 0;

    const totalDays = closedDeals.reduce((sum, deal) => {
      const created = new Date(deal.createdDate || deal.timestamp);
      const closed = new Date(deal.closedDate || deal.timestamp);
      return sum + Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);

    return totalDays / closedDeals.length;
  }

  private getMonthsInRange(dateRange: { start: Date; end: Date }): number {
    const months = (dateRange.end.getFullYear() - dateRange.start.getFullYear()) * 12 +
                  (dateRange.end.getMonth() - dateRange.start.getMonth());
    return Math.max(1, months);
  }

  private calculateMonthlyTrend(deals: any[], _dateRange: { start: Date; end: Date }): PipelineMetrics['monthlyTrend'] {
    const months: Record<string, { value: number; deals: number; won: number }> = {};

    deals.forEach(deal => {
      const date = new Date(deal.closeDate || deal.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!months[monthKey]) {
        months[monthKey] = { value: 0, deals: 0, won: 0 };
      }

      months[monthKey].value += deal.dealValue || 0;
      months[monthKey].deals += 1;
      if (deal.stage === 'closed-won') {
        months[monthKey].won += 1;
      }
    });

    return Object.entries(months).map(([month, data]) => ({
      month,
      value: data.value,
      deals: data.deals,
      conversion: data.deals > 0 ? (data.won / data.deals) * 100 : 0
    })).sort((a, b) => a.month.localeCompare(b.month));
  }

  private generateForecastData(historicalData: any[]): any[] {
    if (historicalData.length < 3) return [];

    // Simple linear regression forecast (would use proper ML in production)
    const values = historicalData.map(d => d.value);
    const trend = values.slice(-3).reduce((sum, val, idx) => sum + val * (idx + 1), 0) / 6;

    const forecastMonths = 6;
    const forecast = [];
    const lastValue = values[values.length - 1] || 0;

    for (let i = 1; i <= forecastMonths; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);

      forecast.push({
        label: futureDate.toISOString().substring(0, 7),
        value: Math.max(0, lastValue + (trend * i)),
        timestamp: futureDate.toISOString()
      });
    }

    return forecast;
  }

  private generateHeatmapData(stageId: string, dateRange: { start: Date; end: Date }): any[] {
    // Generate mock heatmap data (would query actual activity data in production)
    const data = [];
    const days = Math.floor((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < days; i++) {
      const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      const activity = Math.floor(Math.random() * 10) + 1; // Mock activity level

      data.push({
        label: date.toISOString().substring(0, 10),
        value: activity,
        timestamp: date.toISOString()
      });
    }

    return data;
  }

  private buildAnalyticsFilters(filters: PipelineFilters): Record<string, any> {
    const analyticsFilters: Record<string, any> = {};

    if (filters.stages?.length) {
      analyticsFilters.stage = { $in: filters.stages };
    }

    if (filters.sources?.length) {
      analyticsFilters.source = { $in: filters.sources };
    }

    if (filters.dealSizeRange) {
      analyticsFilters.dealValue = {
        $gte: filters.dealSizeRange.min,
        $lte: filters.dealSizeRange.max
      };
    }

    if (filters.probability) {
      analyticsFilters.probability = {
        $gte: filters.probability.min,
        $lte: filters.probability.max
      };
    }

    return analyticsFilters;
  }

  private generateCacheKey(type: string, filters: PipelineFilters): string {
    const filterHash = JSON.stringify(filters);
    return `${this.cachePrefix}${type}:${Buffer.from(filterHash).toString('base64')}`;
  }

  private async getCachedData(key: string): Promise<any | null> {
    try {
      const cached = await this.redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Cache retrieval error:', error);
      return null;
    }
  }

  private async cacheData(key: string, data: any): Promise<void> {
    try {
      await this.redisClient.setex(key, this.cacheTTL, JSON.stringify(data));
    } catch (error) {
      console.warn('Cache storage error:', error);
    }
  }

  private getDefaultDateRange(): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3); // Last 3 months
    return { start, end };
  }
}

export const createPipelineVisualizationService = (
  visualizationService: VisualizationService,
  analyticsService: AnalyticsService,
  revenueService: RevenueAttributionService
): PipelineVisualizationService => {
  return new PipelineVisualizationService(visualizationService, analyticsService, revenueService);
};
