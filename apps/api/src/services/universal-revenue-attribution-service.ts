import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';

// Use the existing redis client type
type RedisClientType = any;

// Core Attribution Interfaces
export interface AttributionTouchpoint {
  id: string;
  sessionId: string;
  visitorId: string;
  accountId?: string;
  timestamp: Date;
  channel: string;
  campaign?: string;
  source: string;
  medium: string;
  content?: string;
  term?: string;
  page: string;
  value: number;
  position: 'first' | 'middle' | 'last' | 'only';
  conversionDistance: number; // Days to conversion
  metadata: Record<string, any>;
}

export interface AttributionModel {
  id: string;
  name: string;
  type: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'data_driven' | 'custom';
  description: string;
  parameters: Record<string, any>;
  weightingRules: AttributionWeightingRule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttributionWeightingRule {
  condition: string;
  weight: number;
  description: string;
}

export interface RevenueEvent {
  id: string;
  visitorId: string;
  accountId?: string;
  sessionId: string;
  type: 'purchase' | 'subscription' | 'upgrade' | 'renewal' | 'custom';
  amount: number;
  currency: string;
  timestamp: Date;
  productId?: string;
  planId?: string;
  metadata: Record<string, any>;
  touchpoints: AttributionTouchpoint[];
}

export interface AttributionReport {
  id: string;
  modelId: string;
  timeframe: {
    start: Date;
    end: Date;
  };
  totalRevenue: number;
  attributedRevenue: number;
  unattributedRevenue: number;
  channelAttribution: ChannelAttribution[];
  campaignAttribution: CampaignAttribution[];
  touchpointAnalysis: TouchpointAnalysis;
  conversionPaths: ConversionPath[];
  roiMetrics: ROIMetrics;
  createdAt: Date;
}

export interface ChannelAttribution {
  channel: string;
  attributedRevenue: number;
  percentage: number;
  touchpoints: number;
  conversions: number;
  averageOrderValue: number;
  costPerAcquisition?: number;
  returnOnAdSpend?: number;
}

export interface CampaignAttribution {
  campaign: string;
  channel: string;
  attributedRevenue: number;
  percentage: number;
  touchpoints: number;
  conversions: number;
  cost?: number;
  roi?: number;
}

export interface TouchpointAnalysis {
  averageTouchpointsToConversion: number;
  averageConversionTime: number;
  mostInfluentialTouchpoints: TouchpointInfluence[];
  conversionPathLength: {
    distribution: Record<number, number>;
    median: number;
    average: number;
  };
}

export interface TouchpointInfluence {
  channel: string;
  position: string;
  influenceScore: number;
  conversionRate: number;
  averageRevenue: number;
}

export interface ConversionPath {
  id: string;
  touchpoints: AttributionTouchpoint[];
  revenue: number;
  conversionTime: number;
  frequency: number;
  percentage: number;
}

export interface ROIMetrics {
  totalROI: number;
  channelROI: Record<string, number>;
  campaignROI: Record<string, number>;
  customerLifetimeValue: number;
  customerAcquisitionCost: number;
  paybackPeriod: number;
  marginMetrics: {
    grossMargin: number;
    netMargin: number;
    contributionMargin: number;
  };
}

export interface AttributionConfiguration {
  defaultModel: string;
  conversionWindow: number; // Days
  viewThroughWindow: number; // Hours
  clickThroughWindow: number; // Hours
  minimumTouchpoints: number;
  excludeDirectTraffic: boolean;
  includeOrganicSearch: boolean;
  customDimensions: string[];
  revenueGoals: RevenueGoal[];
}

export interface RevenueGoal {
  id: string;
  name: string;
  target: number;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  channels?: string[];
  campaigns?: string[];
}

export interface AttributionInsight {
  type: 'channel_performance' | 'campaign_optimization' | 'budget_allocation' | 'conversion_path' | 'customer_journey';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  data: Record<string, any>;
  confidence: number;
}

// Attribution Analytics Interfaces
export interface AttributionAnalytics {
  overview: {
    totalRevenue: number;
    attributedRevenue: number;
    attributionRate: number;
    averageOrderValue: number;
    conversionRate: number;
    customerLifetimeValue: number;
  };
  channelPerformance: ChannelPerformanceMetrics[];
  modelComparison: ModelComparisonMetrics[];
  trendAnalysis: TrendAnalysisData;
  insights: AttributionInsight[];
  recommendations: AttributionRecommendation[];
}

export interface ChannelPerformanceMetrics {
  channel: string;
  revenue: number;
  percentage: number;
  touchpoints: number;
  conversions: number;
  cost?: number;
  roi?: number;
  trend: 'up' | 'down' | 'stable';
  efficiency: number;
}

export interface ModelComparisonMetrics {
  modelId: string;
  modelName: string;
  attributedRevenue: number;
  variance: number;
  accuracy: number;
  confidence: number;
}

export interface TrendAnalysisData {
  revenueOverTime: TimeSeriesData[];
  channelTrends: ChannelTrendData[];
  seasonalityFactors: SeasonalityFactor[];
  forecastData: ForecastData[];
}

export interface TimeSeriesData {
  date: Date;
  value: number;
  channel?: string;
  campaign?: string;
}

export interface ChannelTrendData {
  channel: string;
  trend: number; // Percentage change
  momentum: 'accelerating' | 'decelerating' | 'stable';
  dataPoints: TimeSeriesData[];
}

export interface SeasonalityFactor {
  period: 'hour' | 'day' | 'week' | 'month' | 'quarter';
  factor: number;
  confidence: number;
}

export interface ForecastData {
  date: Date;
  predictedRevenue: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

export interface AttributionRecommendation {
  type: 'budget_reallocation' | 'channel_optimization' | 'campaign_adjustment' | 'model_refinement';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: number;
  implementation: string[];
  metrics: Record<string, number>;
}

// Universal Revenue Attribution Service Implementation
export class UniversalRevenueAttributionService extends EventEmitter {
  private prisma: PrismaClient;
  private redis: RedisClientType;
  private config: AttributionConfiguration;
  private models: Map<string, AttributionModel> = new Map();
  private isInitialized: boolean = false;

  private readonly CACHE_TTL = {
    TOUCHPOINT: 3600, // 1 hour
    REVENUE_EVENT: 7200, // 2 hours
    ATTRIBUTION_REPORT: 1800, // 30 minutes
    ANALYTICS: 900, // 15 minutes
    MODEL: 86400, // 24 hours
  };

  constructor(redis: RedisClientType) {
    super();
    this.redis = redis;
    this.prisma = new PrismaClient();
    this.config = this.getDefaultConfiguration();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadAttributionModels();
      await this.setupDefaultModels();
      this.isInitialized = true;
      console.log('✅ Universal Revenue Attribution Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Revenue Attribution service:', error);
      throw error;
    }
  }

  // Touchpoint Management
  async recordTouchpoint(touchpointData: Omit<AttributionTouchpoint, 'id' | 'position' | 'conversionDistance'>): Promise<AttributionTouchpoint> {
    const touchpoint: AttributionTouchpoint = {
      id: `touchpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...touchpointData,
      position: await this.determineTouchpointPosition(touchpointData.sessionId, touchpointData.visitorId),
      conversionDistance: 0, // Will be calculated when revenue event occurs
    };

    await this.redis.setex(
      `attribution:touchpoint:${touchpoint.id}`,
      this.CACHE_TTL.TOUCHPOINT,
      JSON.stringify(touchpoint)
    );

    // Add to visitor's touchpoint sequence
    await this.addToVisitorTouchpointSequence(touchpoint.visitorId, touchpoint);

    this.emit('touchpoint:recorded', touchpoint);
    return touchpoint;
  }

  async getTouchpoint(touchpointId: string): Promise<AttributionTouchpoint | null> {
    const cached = await this.redis.get(`attribution:touchpoint:${touchpointId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  private async determineTouchpointPosition(sessionId: string, visitorId: string): Promise<'first' | 'middle' | 'last' | 'only'> {
    const touchpoints = await this.getVisitorTouchpoints(visitorId);

    if (touchpoints.length === 0) {
      return 'first';
    }

    // This will be updated to 'last' when conversion occurs
    return 'middle';
  }

  private async addToVisitorTouchpointSequence(visitorId: string, touchpoint: AttributionTouchpoint): Promise<void> {
    const sequenceKey = `attribution:visitor:${visitorId}:touchpoints`;
    await this.redis.lpush(sequenceKey, JSON.stringify(touchpoint));
    await this.redis.expire(sequenceKey, this.config.conversionWindow * 24 * 3600); // Expire after conversion window
  }

  async getVisitorTouchpoints(visitorId: string): Promise<AttributionTouchpoint[]> {
    const sequenceKey = `attribution:visitor:${visitorId}:touchpoints`;
    const touchpointData = await this.redis.lrange(sequenceKey, 0, -1);
    return touchpointData.map((data: string) => JSON.parse(data));
  }

  // Revenue Event Management
  async recordRevenueEvent(revenueData: Omit<RevenueEvent, 'id' | 'touchpoints'>): Promise<RevenueEvent> {
    const touchpoints = await this.getVisitorTouchpoints(revenueData.visitorId);

    // Calculate conversion distances and update positions
    const updatedTouchpoints = await this.calculateConversionDistances(touchpoints, revenueData.timestamp);

    const revenueEvent: RevenueEvent = {
      id: `revenue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...revenueData,
      touchpoints: updatedTouchpoints,
    };

    await this.redis.setex(
      `attribution:revenue:${revenueEvent.id}`,
      this.CACHE_TTL.REVENUE_EVENT,
      JSON.stringify(revenueEvent)
    );

    // Process attribution for all active models
    await this.processAttributionForEvent(revenueEvent);

    this.emit('revenue:recorded', revenueEvent);
    return revenueEvent;
  }

  private async calculateConversionDistances(touchpoints: AttributionTouchpoint[], conversionTime: Date): Promise<AttributionTouchpoint[]> {
    return touchpoints.map((touchpoint, index) => {
      const distance = Math.floor((conversionTime.getTime() - touchpoint.timestamp.getTime()) / (24 * 60 * 60 * 1000));

      let position: 'first' | 'middle' | 'last' | 'only' = touchpoint.position;
      if (touchpoints.length === 1) {
        position = 'only';
      } else if (index === 0) {
        position = 'first';
      } else if (index === touchpoints.length - 1) {
        position = 'last';
      } else {
        position = 'middle';
      }

      return {
        ...touchpoint,
        conversionDistance: distance,
        position
      };
    });
  }

  // Attribution Model Management
  async createAttributionModel(modelData: Omit<AttributionModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<AttributionModel> {
    const model: AttributionModel = {
      id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...modelData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.models.set(model.id, model);

    await this.redis.setex(
      `attribution:model:${model.id}`,
      this.CACHE_TTL.MODEL,
      JSON.stringify(model)
    );

    this.emit('model:created', model);
    return model;
  }

  async getAttributionModel(modelId: string): Promise<AttributionModel | null> {
    const cached = await this.redis.get(`attribution:model:${modelId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return this.models.get(modelId) || null;
  }

  async getAllAttributionModels(): Promise<AttributionModel[]> {
    const keys = await this.redis.keys('attribution:model:*');
    const models: AttributionModel[] = [];

    for (const key of keys) {
      const modelData = await this.redis.get(key);
      if (modelData) {
        models.push(JSON.parse(modelData));
      }
    }

    return models;
  }

  // Attribution Processing
  private async processAttributionForEvent(revenueEvent: RevenueEvent): Promise<void> {
    const activeModels = await this.getActiveModels();

    for (const model of activeModels) {
      const attribution = await this.calculateAttribution(revenueEvent, model);
      await this.storeAttribution(attribution, model.id);
    }
  }

  private async getActiveModels(): Promise<AttributionModel[]> {
    const allModels = await this.getAllAttributionModels();
    return allModels.filter(model => model.isActive);
  }

  private async calculateAttribution(revenueEvent: RevenueEvent, model: AttributionModel): Promise<Record<string, number>> {
    const touchpoints = revenueEvent.touchpoints;
    let attribution: Record<string, number> = {};

    if (touchpoints.length === 0) {
      return attribution;
    }

    switch (model.type) {
      case 'first_touch':
        attribution[touchpoints[0].channel] = revenueEvent.amount;
        break;

      case 'last_touch':
        attribution[touchpoints[touchpoints.length - 1].channel] = revenueEvent.amount;
        break;

      case 'linear':
        const equalWeight = revenueEvent.amount / touchpoints.length;
        touchpoints.forEach(tp => {
          attribution[tp.channel] = (attribution[tp.channel] || 0) + equalWeight;
        });
        break;

      case 'time_decay':
        attribution = this.calculateTimeDecayAttribution(touchpoints, revenueEvent.amount, model.parameters);
        break;

      case 'position_based':
        attribution = this.calculatePositionBasedAttribution(touchpoints, revenueEvent.amount, model.parameters);
        break;

      case 'data_driven':
        attribution = await this.calculateDataDrivenAttribution(touchpoints, revenueEvent.amount);
        break;

      case 'custom':
        attribution = await this.calculateCustomAttribution(touchpoints, revenueEvent.amount, model);
        break;
    }

    return attribution;
  }

  private calculateTimeDecayAttribution(touchpoints: AttributionTouchpoint[], revenue: number, parameters: Record<string, any>): Record<string, number> {
    const halfLife = parameters.halfLife || 7; // Days
    const attribution: Record<string, number> = {};
    let totalWeight = 0;

    // Calculate weights based on time decay
    const weights = touchpoints.map(tp => {
      const weight = Math.pow(0.5, tp.conversionDistance / halfLife);
      totalWeight += weight;
      return weight;
    });

    // Distribute revenue based on weights
    touchpoints.forEach((tp, index) => {
      const attributedRevenue = (weights[index] / totalWeight) * revenue;
      attribution[tp.channel] = (attribution[tp.channel] || 0) + attributedRevenue;
    });

    return attribution;
  }

  private calculatePositionBasedAttribution(touchpoints: AttributionTouchpoint[], revenue: number, parameters: Record<string, any>): Record<string, number> {
    const firstTouchWeight = parameters.firstTouchWeight || 0.4;
    const lastTouchWeight = parameters.lastTouchWeight || 0.4;
    const middleTouchWeight = parameters.middleTouchWeight || 0.2;

    const attribution: Record<string, number> = {};

    if (touchpoints.length === 1) {
      attribution[touchpoints[0].channel] = revenue;
      return attribution;
    }

    // First touch
    attribution[touchpoints[0].channel] = revenue * firstTouchWeight;

    // Last touch
    const lastIndex = touchpoints.length - 1;
    attribution[touchpoints[lastIndex].channel] = (attribution[touchpoints[lastIndex].channel] || 0) + (revenue * lastTouchWeight);

    // Middle touches
    if (touchpoints.length > 2) {
      const middleRevenue = revenue * middleTouchWeight;
      const middleTouchpoints = touchpoints.slice(1, -1);
      const perMiddleTouch = middleRevenue / middleTouchpoints.length;

      middleTouchpoints.forEach(tp => {
        attribution[tp.channel] = (attribution[tp.channel] || 0) + perMiddleTouch;
      });
    }

    return attribution;
  }

  private async calculateDataDrivenAttribution(touchpoints: AttributionTouchpoint[], revenue: number): Promise<Record<string, number>> {
    // Simplified data-driven attribution using conversion probability
    // In a real implementation, this would use machine learning models
    const attribution: Record<string, number> = {};

    const channelConversionRates = await this.getChannelConversionRates();
    let totalWeight = 0;

    const weights = touchpoints.map(tp => {
      const conversionRate = channelConversionRates[tp.channel] || 0.01;
      const positionMultiplier = this.getPositionMultiplier(tp.position);
      const weight = conversionRate * positionMultiplier;
      totalWeight += weight;
      return weight;
    });

    touchpoints.forEach((tp, index) => {
      const attributedRevenue = (weights[index] / totalWeight) * revenue;
      attribution[tp.channel] = (attribution[tp.channel] || 0) + attributedRevenue;
    });

    return attribution;
  }

  private async calculateCustomAttribution(touchpoints: AttributionTouchpoint[], revenue: number, model: AttributionModel): Promise<Record<string, number>> {
    const attribution: Record<string, number> = {};

    // Apply custom weighting rules
    for (const rule of model.weightingRules) {
      const matchingTouchpoints = touchpoints.filter(tp => this.evaluateCondition(rule.condition, tp));
      const totalWeight = matchingTouchpoints.reduce((sum, tp) => sum + rule.weight, 0);

      matchingTouchpoints.forEach(tp => {
        const attributedRevenue = (rule.weight / totalWeight) * revenue;
        attribution[tp.channel] = (attribution[tp.channel] || 0) + attributedRevenue;
      });
    }

    return attribution;
  }

  private getPositionMultiplier(position: string): number {
    switch (position) {
      case 'first': return 1.2;
      case 'last': return 1.5;
      case 'only': return 2.0;
      case 'middle': return 0.8;
      default: return 1.0;
    }
  }

  private evaluateCondition(condition: string, touchpoint: AttributionTouchpoint): boolean {
    // Simple condition evaluation - in production, use a proper expression parser
    try {
      const conditionFunction = new Function('touchpoint', `return ${condition}`);
      return conditionFunction(touchpoint);
    } catch {
      return false;
    }
  }

  private async getChannelConversionRates(): Promise<Record<string, number>> {
    const cacheKey = 'attribution:channel:conversion_rates';
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Calculate conversion rates from historical data
    const rates = await this.calculateChannelConversionRates();
    await this.redis.setex(cacheKey, 3600, JSON.stringify(rates));

    return rates;
  }

  private async calculateChannelConversionRates(): Promise<Record<string, number>> {
    // Simplified calculation - in production, analyze historical data
    return {
      'paid_search': 0.05,
      'organic_search': 0.03,
      'social': 0.02,
      'email': 0.08,
      'direct': 0.04,
      'referral': 0.025,
      'display': 0.015,
    };
  }

  private async storeAttribution(attribution: Record<string, number>, modelId: string): Promise<void> {
    const attributionKey = `attribution:results:${modelId}:${Date.now()}`;
    await this.redis.setex(attributionKey, this.CACHE_TTL.ATTRIBUTION_REPORT, JSON.stringify(attribution));
  }

  // Analytics and Reporting
  async generateAttributionReport(modelId: string, timeframe: { start: Date; end: Date }): Promise<AttributionReport> {
    const cacheKey = `attribution:report:${modelId}:${timeframe.start.getTime()}:${timeframe.end.getTime()}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const report = await this.calculateAttributionReport(modelId, timeframe);
    await this.redis.setex(cacheKey, this.CACHE_TTL.ATTRIBUTION_REPORT, JSON.stringify(report));

    return report;
  }

  private async calculateAttributionReport(modelId: string, timeframe: { start: Date; end: Date }): Promise<AttributionReport> {
    const revenueEvents = await this.getRevenueEventsInTimeframe(timeframe);
    const model = await this.getAttributionModel(modelId);

    if (!model) {
      throw new Error(`Attribution model ${modelId} not found`);
    }

    let totalRevenue = 0;
    let attributedRevenue = 0;
    const channelRevenue: Record<string, number> = {};
    const campaignRevenue: Record<string, Record<string, number>> = {};
    const conversionPaths: ConversionPath[] = [];

    for (const event of revenueEvents) {
      totalRevenue += event.amount;

      const attribution = await this.calculateAttribution(event, model);
      const eventAttributedRevenue = Object.values(attribution).reduce((sum, value) => sum + value, 0);
      attributedRevenue += eventAttributedRevenue;

      // Aggregate by channel
      Object.entries(attribution).forEach(([channel, revenue]) => {
        channelRevenue[channel] = (channelRevenue[channel] || 0) + revenue;
      });

      // Aggregate by campaign
      event.touchpoints.forEach(tp => {
        if (tp.campaign) {
          if (!campaignRevenue[tp.campaign]) {
            campaignRevenue[tp.campaign] = {};
          }
          const campaignAttribution = attribution[tp.channel] || 0;
          campaignRevenue[tp.campaign][tp.channel] = (campaignRevenue[tp.campaign][tp.channel] || 0) + campaignAttribution;
        }
      });

      // Add to conversion paths
      conversionPaths.push(this.createConversionPath(event));
    }

    const report: AttributionReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      modelId,
      timeframe,
      totalRevenue,
      attributedRevenue,
      unattributedRevenue: totalRevenue - attributedRevenue,
      channelAttribution: this.createChannelAttribution(channelRevenue, revenueEvents),
      campaignAttribution: this.createCampaignAttribution(campaignRevenue),
      touchpointAnalysis: this.createTouchpointAnalysis(revenueEvents),
      conversionPaths: this.aggregateConversionPaths(conversionPaths),
      roiMetrics: await this.calculateROIMetrics(channelRevenue, campaignRevenue),
      createdAt: new Date(),
    };

    return report;
  }

  private async getRevenueEventsInTimeframe(timeframe: { start: Date; end: Date }): Promise<RevenueEvent[]> {
    const keys = await this.redis.keys('attribution:revenue:*');
    const events: RevenueEvent[] = [];

    for (const key of keys) {
      const eventData = await this.redis.get(key);
      if (eventData) {
        const event: RevenueEvent = JSON.parse(eventData);
        const eventTime = new Date(event.timestamp);
        if (eventTime >= timeframe.start && eventTime <= timeframe.end) {
          events.push(event);
        }
      }
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  private createChannelAttribution(channelRevenue: Record<string, number>, revenueEvents: RevenueEvent[]): ChannelAttribution[] {
    const totalRevenue = Object.values(channelRevenue).reduce((sum, value) => sum + value, 0);

    return Object.entries(channelRevenue).map(([channel, revenue]) => {
      const channelEvents = revenueEvents.filter(event =>
        event.touchpoints.some(tp => tp.channel === channel)
      );

      const touchpoints = channelEvents.reduce((sum, event) =>
        sum + event.touchpoints.filter(tp => tp.channel === channel).length, 0
      );

      const conversions = channelEvents.length;
      const averageOrderValue = conversions > 0 ? revenue / conversions : 0;

      return {
        channel,
        attributedRevenue: revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
        touchpoints,
        conversions,
        averageOrderValue,
      };
    }).sort((a, b) => b.attributedRevenue - a.attributedRevenue);
  }

  private createCampaignAttribution(campaignRevenue: Record<string, Record<string, number>>): CampaignAttribution[] {
    const campaigns: CampaignAttribution[] = [];

    Object.entries(campaignRevenue).forEach(([campaign, channels]) => {
      Object.entries(channels).forEach(([channel, revenue]) => {
        campaigns.push({
          campaign,
          channel,
          attributedRevenue: revenue,
          percentage: 0, // Will be calculated relative to total
          touchpoints: 0, // Would need additional data
          conversions: 0, // Would need additional data
        });
      });
    });

    const totalRevenue = campaigns.reduce((sum, campaign) => sum + campaign.attributedRevenue, 0);
    campaigns.forEach(campaign => {
      campaign.percentage = totalRevenue > 0 ? (campaign.attributedRevenue / totalRevenue) * 100 : 0;
    });

    return campaigns.sort((a, b) => b.attributedRevenue - a.attributedRevenue);
  }

  private createTouchpointAnalysis(revenueEvents: RevenueEvent[]): TouchpointAnalysis {
    const touchpointCounts = revenueEvents.map(event => event.touchpoints.length);
    const conversionTimes = revenueEvents.map(event => {
      if (event.touchpoints.length === 0) return 0;
      const firstTouch = Math.min(...event.touchpoints.map(tp => tp.timestamp.getTime()));
      return (event.timestamp.getTime() - firstTouch) / (24 * 60 * 60 * 1000); // Days
    });

    const averageTouchpointsToConversion = touchpointCounts.reduce((sum, count) => sum + count, 0) / touchpointCounts.length || 0;
    const averageConversionTime = conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length || 0;

    // Create touchpoint length distribution
    const distribution: Record<number, number> = {};
    touchpointCounts.forEach(count => {
      distribution[count] = (distribution[count] || 0) + 1;
    });

    const sortedCounts = touchpointCounts.sort((a, b) => a - b);
    const median = sortedCounts[Math.floor(sortedCounts.length / 2)] || 0;

    return {
      averageTouchpointsToConversion,
      averageConversionTime,
      mostInfluentialTouchpoints: [], // Would need additional analysis
      conversionPathLength: {
        distribution,
        median,
        average: averageTouchpointsToConversion,
      },
    };
  }

  private createConversionPath(event: RevenueEvent): ConversionPath {
    const conversionTime = event.touchpoints.length > 0
      ? (event.timestamp.getTime() - Math.min(...event.touchpoints.map(tp => tp.timestamp.getTime()))) / (24 * 60 * 60 * 1000)
      : 0;

    return {
      id: `path_${event.id}`,
      touchpoints: event.touchpoints,
      revenue: event.amount,
      conversionTime,
      frequency: 1,
      percentage: 0, // Will be calculated when aggregating
    };
  }

  private aggregateConversionPaths(paths: ConversionPath[]): ConversionPath[] {
    const pathSignatures = new Map<string, ConversionPath>();

    paths.forEach(path => {
      const signature = path.touchpoints.map(tp => tp.channel).join(' -> ');

      if (pathSignatures.has(signature)) {
        const existing = pathSignatures.get(signature)!;
        existing.frequency += 1;
        existing.revenue += path.revenue;
        existing.conversionTime = (existing.conversionTime + path.conversionTime) / 2;
      } else {
        pathSignatures.set(signature, { ...path });
      }
    });

    const aggregatedPaths = Array.from(pathSignatures.values());
    const totalPaths = aggregatedPaths.reduce((sum, path) => sum + path.frequency, 0);

    aggregatedPaths.forEach(path => {
      path.percentage = totalPaths > 0 ? (path.frequency / totalPaths) * 100 : 0;
    });

    return aggregatedPaths.sort((a, b) => b.frequency - a.frequency).slice(0, 20); // Top 20 paths
  }

  private async calculateROIMetrics(channelRevenue: Record<string, number>, campaignRevenue: Record<string, Record<string, number>>): Promise<ROIMetrics> {
    // Simplified ROI calculation - in production, integrate with cost data
    const totalRevenue = Object.values(channelRevenue).reduce((sum, value) => sum + value, 0);
    const estimatedCost = totalRevenue * 0.3; // Assume 30% cost ratio

    return {
      totalROI: estimatedCost > 0 ? ((totalRevenue - estimatedCost) / estimatedCost) * 100 : 0,
      channelROI: {}, // Would need cost data per channel
      campaignROI: {}, // Would need cost data per campaign
      customerLifetimeValue: 0, // Would need historical customer data
      customerAcquisitionCost: 0, // Would need cost and acquisition data
      paybackPeriod: 0, // Would need subscription/retention data
      marginMetrics: {
        grossMargin: 0.7, // 70% assumed gross margin
        netMargin: 0.2, // 20% assumed net margin
        contributionMargin: 0.5, // 50% assumed contribution margin
      },
    };
  }

  async getAttributionAnalytics(timeframe: { start: Date; end: Date }): Promise<AttributionAnalytics> {
    const cacheKey = `attribution:analytics:${timeframe.start.getTime()}:${timeframe.end.getTime()}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const analytics = await this.calculateAttributionAnalytics(timeframe);
    await this.redis.setex(cacheKey, this.CACHE_TTL.ANALYTICS, JSON.stringify(analytics));

    return analytics;
  }

  private async calculateAttributionAnalytics(timeframe: { start: Date; end: Date }): Promise<AttributionAnalytics> {
    const defaultModel = await this.getAttributionModel(this.config.defaultModel);
    if (!defaultModel) {
      throw new Error('Default attribution model not found');
    }

    const report = await this.generateAttributionReport(defaultModel.id, timeframe);
    const allModels = await this.getActiveModels();

    const overview = {
      totalRevenue: report.totalRevenue,
      attributedRevenue: report.attributedRevenue,
      attributionRate: report.totalRevenue > 0 ? (report.attributedRevenue / report.totalRevenue) * 100 : 0,
      averageOrderValue: report.channelAttribution.reduce((sum, channel) => sum + channel.averageOrderValue, 0) / report.channelAttribution.length || 0,
      conversionRate: 0, // Would need impression/visit data
      customerLifetimeValue: report.roiMetrics.customerLifetimeValue,
    };

    const channelPerformance: ChannelPerformanceMetrics[] = report.channelAttribution.map(channel => ({
      channel: channel.channel,
      revenue: channel.attributedRevenue,
      percentage: channel.percentage,
      touchpoints: channel.touchpoints,
      conversions: channel.conversions,
      cost: channel.costPerAcquisition ? channel.costPerAcquisition * channel.conversions : undefined,
      roi: channel.returnOnAdSpend,
      trend: 'stable', // Would need historical data
      efficiency: channel.averageOrderValue / (channel.costPerAcquisition || 1),
    }));

    const modelComparison: ModelComparisonMetrics[] = await Promise.all(
      allModels.map(async model => {
        const modelReport = await this.generateAttributionReport(model.id, timeframe);
        return {
          modelId: model.id,
          modelName: model.name,
          attributedRevenue: modelReport.attributedRevenue,
          variance: Math.abs(modelReport.attributedRevenue - report.attributedRevenue) / report.attributedRevenue * 100,
          accuracy: 85, // Would need validation data
          confidence: 90, // Would need statistical analysis
        };
      })
    );

    const insights = await this.generateAttributionInsights(report);
    const recommendations = await this.generateAttributionRecommendations(report);

    return {
      overview,
      channelPerformance,
      modelComparison,
      trendAnalysis: {
        revenueOverTime: [],
        channelTrends: [],
        seasonalityFactors: [],
        forecastData: [],
      },
      insights,
      recommendations,
    };
  }

  private async generateAttributionInsights(report: AttributionReport): Promise<AttributionInsight[]> {
    const insights: AttributionInsight[] = [];

    // Top performing channel insight
    const topChannel = report.channelAttribution[0];
    if (topChannel) {
      insights.push({
        type: 'channel_performance',
        title: `${topChannel.channel} is your top revenue driver`,
        description: `${topChannel.channel} accounts for ${topChannel.percentage.toFixed(1)}% of attributed revenue (${topChannel.attributedRevenue.toLocaleString()})`,
        impact: 'high',
        recommendation: `Consider increasing investment in ${topChannel.channel} campaigns`,
        data: { channel: topChannel.channel, revenue: topChannel.attributedRevenue, percentage: topChannel.percentage },
        confidence: 95,
      });
    }

    // Attribution rate insight
    const attributionRate = (report.attributedRevenue / report.totalRevenue) * 100;
    if (attributionRate < 80) {
      insights.push({
        type: 'conversion_path',
        title: 'Low attribution rate detected',
        description: `Only ${attributionRate.toFixed(1)}% of revenue is being attributed to marketing touchpoints`,
        impact: 'medium',
        recommendation: 'Review tracking implementation and consider expanding attribution windows',
        data: { attributionRate, unattributedRevenue: report.unattributedRevenue },
        confidence: 85,
      });
    }

    return insights;
  }

  private async generateAttributionRecommendations(report: AttributionReport): Promise<AttributionRecommendation[]> {
    const recommendations: AttributionRecommendation[] = [];

    // Budget reallocation recommendation
    const underperformingChannels = report.channelAttribution.filter(channel =>
      channel.percentage < 5 && channel.conversions > 0
    );

    if (underperformingChannels.length > 0) {
      recommendations.push({
        type: 'budget_reallocation',
        priority: 'medium',
        title: 'Optimize budget allocation across channels',
        description: 'Some channels are underperforming and may benefit from budget reallocation',
        expectedImpact: 15,
        implementation: [
          'Analyze cost per acquisition for each channel',
          'Reallocate budget from low-performing to high-performing channels',
          'Monitor results over 30-day period'
        ],
        metrics: {
          potentialRevenueLift: report.totalRevenue * 0.15,
          channelsToOptimize: underperformingChannels.length,
        },
      });
    }

    return recommendations;
  }

  // Configuration and Setup
  private async loadAttributionModels(): Promise<void> {
    const keys = await this.redis.keys('attribution:model:*');

    for (const key of keys) {
      const modelData = await this.redis.get(key);
      if (modelData) {
        const model: AttributionModel = JSON.parse(modelData);
        this.models.set(model.id, model);
      }
    }
  }

  private async setupDefaultModels(): Promise<void> {
    const defaultModels: Omit<AttributionModel, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'First Touch',
        type: 'first_touch',
        description: 'Attributes 100% of revenue to the first marketing touchpoint',
        parameters: {},
        weightingRules: [],
        isActive: true,
      },
      {
        name: 'Last Touch',
        type: 'last_touch',
        description: 'Attributes 100% of revenue to the last marketing touchpoint',
        parameters: {},
        weightingRules: [],
        isActive: true,
      },
      {
        name: 'Linear',
        type: 'linear',
        description: 'Distributes revenue equally across all touchpoints',
        parameters: {},
        weightingRules: [],
        isActive: true,
      },
      {
        name: 'Time Decay',
        type: 'time_decay',
        description: 'Gives more credit to touchpoints closer to conversion',
        parameters: { halfLife: 7 },
        weightingRules: [],
        isActive: false,
      },
      {
        name: 'Position Based (40/20/40)',
        type: 'position_based',
        description: 'Gives 40% credit to first and last touch, 20% to middle touches',
        parameters: { firstTouchWeight: 0.4, lastTouchWeight: 0.4, middleTouchWeight: 0.2 },
        weightingRules: [],
        isActive: false,
      },
    ];

    for (const modelData of defaultModels) {
      const existingModel = Array.from(this.models.values()).find(m => m.name === modelData.name);
      if (!existingModel) {
        await this.createAttributionModel(modelData);
      }
    }

    // Set first touch as default if no default is set
    if (!this.config.defaultModel) {
      const firstTouchModel = Array.from(this.models.values()).find(m => m.type === 'first_touch');
      if (firstTouchModel) {
        this.config.defaultModel = firstTouchModel.id;
      }
    }
  }

  private getDefaultConfiguration(): AttributionConfiguration {
    return {
      defaultModel: '',
      conversionWindow: 30,
      viewThroughWindow: 24,
      clickThroughWindow: 168, // 7 days
      minimumTouchpoints: 1,
      excludeDirectTraffic: false,
      includeOrganicSearch: true,
      customDimensions: [],
      revenueGoals: [],
    };
  }

  // Health and Status
  async getHealthStatus(): Promise<Record<string, any>> {
    try {
      const redisHealth = await this.redis.ping();
      const modelsCount = this.models.size;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        redis: redisHealth === 'PONG' ? 'connected' : 'disconnected',
        models: {
          loaded: modelsCount,
          active: Array.from(this.models.values()).filter(m => m.isActive).length,
        },
        configuration: {
          defaultModel: this.config.defaultModel,
          conversionWindow: this.config.conversionWindow,
        },
        isInitialized: this.isInitialized,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        isInitialized: this.isInitialized,
      };
    }
  }
}

export default UniversalRevenueAttributionService;
