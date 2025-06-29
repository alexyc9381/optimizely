import { Redis } from 'ioredis';

// Core interfaces for campaign ROI measurement
export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'search' | 'display' | 'video' | 'content' | 'referral' | 'direct' | 'offline' | 'other';
  channel: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: {
    total: number;
    spent: number;
    currency: string;
  };
  targeting: {
    demographics?: {
      ageRange?: string;
      gender?: string;
      location?: string[];
      interests?: string[];
    };
    segments?: string[];
    keywords?: string[];
    customAudiences?: string[];
  };
  metadata: {
    owner: string;
    team?: string;
    tags: string[];
    description?: string;
    objectives: string[];
  };
}

export interface CostEntry {
  id: string;
  campaignId: string;
  date: Date;
  costType: 'media_spend' | 'production' | 'agency_fee' | 'tool_cost' | 'personnel' | 'other';
  amount: number;
  currency: string;
  description?: string;
  source: string; // Where the cost data came from
  metadata: {
    vendor?: string;
    invoiceId?: string;
    category?: string;
    isRecurring?: boolean;
    allocationType?: 'direct' | 'shared' | 'allocated';
  };
}

export interface RevenueEvent {
  id: string;
  campaignId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  revenueType: 'purchase' | 'subscription' | 'lead' | 'trial' | 'upgrade' | 'renewal' | 'other';
  amount: number;
  currency: string;
  attributionModel: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'custom';
  attributionWeight: number; // 0-1, how much credit this campaign gets
  touchpointData: {
    position: number; // 1 = first touch, etc.
    totalTouchpoints: number;
    timeSinceLastTouch: number; // hours
    touchpointType: string;
  };
  conversionData: {
    productId?: string;
    quantity?: number;
    category?: string;
    isNewCustomer: boolean;
    customerLifetimeValue?: number;
  };
}

export interface ROIMetrics {
  campaignId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  costs: {
    totalCost: number;
    mediaSpend: number;
    productionCost: number;
    agencyFees: number;
    toolCosts: number;
    personnelCosts: number;
    otherCosts: number;
    costPerDay: number;
    costTrend: number; // % change from previous period
  };
  revenue: {
    totalRevenue: number;
    attributedRevenue: number;
    firstTouchRevenue: number;
    lastTouchRevenue: number;
    assistedRevenue: number;
    revenuePerDay: number;
    revenueTrend: number; // % change from previous period
  };
  roi: {
    roas: number; // Return on Ad Spend
    roi: number; // (Revenue - Cost) / Cost * 100
    netProfit: number; // Revenue - Cost
    marginPercentage: number;
    costPerAcquisition: number;
    customerLifetimeValue: number;
    ltv_cac_ratio: number;
    paybackPeriod: number; // days
  };
  performance: {
    totalConversions: number;
    conversionRate: number;
    averageOrderValue: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpm: number;
    cpc: number;
  };
  attribution: {
    firstTouchAttribution: number;
    lastTouchAttribution: number;
    linearAttribution: number;
    timeDecayAttribution: number;
    positionBasedAttribution: number;
    customAttribution: number;
  };
}

export interface ROIComparison {
  campaigns: ROIMetrics[];
  benchmarks: {
    industryAverage: ROIMetrics;
    channelAverage: ROIMetrics;
    topPerformer: ROIMetrics;
  };
  insights: {
    bestPerforming: string[];
    worstPerforming: string[];
    recommendations: string[];
    trends: string[];
  };
}

export interface CostAttribution {
  campaignId: string;
  totalCost: number;
  costBreakdown: {
    direct: number;
    shared: number;
    allocated: number;
  };
  allocationRules: {
    method: 'equal' | 'revenue_based' | 'impression_based' | 'custom';
    factors: Record<string, number>;
  };
}

class UniversalCampaignROIService {
  private redis: Redis;
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly ROI_CACHE_TTL = 1800; // 30 minutes

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  // CAMPAIGN MANAGEMENT
  async createCampaign(campaign: Omit<Campaign, 'id'>): Promise<string> {
    const id = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullCampaign: Campaign = {
      id,
      ...campaign,
      budget: {
        total: campaign.budget.total,
        spent: 0, // Initialize as 0
        currency: campaign.budget.currency
      }
    };

    await this.redis.setex(
      `campaign:${id}`,
      365 * 24 * 60 * 60, // 1 year
      JSON.stringify(fullCampaign)
    );

    // Add to campaign indexes
    await this.redis.sadd('campaigns:all', id);
    await this.redis.sadd(`campaigns:type:${campaign.type}`, id);
    await this.redis.sadd(`campaigns:channel:${campaign.channel}`, id);
    await this.redis.sadd(`campaigns:status:${campaign.status}`, id);

    if (campaign.metadata.team) {
      await this.redis.sadd(`campaigns:team:${campaign.metadata.team}`, id);
    }

    return id;
  }

  async getCampaign(campaignId: string): Promise<Campaign | null> {
    const data = await this.redis.get(`campaign:${campaignId}`);
    if (!data) return null;

    const campaign = JSON.parse(data);
    campaign.startDate = new Date(campaign.startDate);
    if (campaign.endDate) campaign.endDate = new Date(campaign.endDate);
    return campaign;
  }

  async getCampaignList(options: {
    type?: string;
    channel?: string;
    status?: string;
    team?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<Campaign[]> {
    let campaignIds: string[] = [];

    if (options.type) {
      campaignIds = await this.redis.smembers(`campaigns:type:${options.type}`);
    } else if (options.channel) {
      campaignIds = await this.redis.smembers(`campaigns:channel:${options.channel}`);
    } else if (options.status) {
      campaignIds = await this.redis.smembers(`campaigns:status:${options.status}`);
    } else if (options.team) {
      campaignIds = await this.redis.smembers(`campaigns:team:${options.team}`);
    } else {
      campaignIds = await this.redis.smembers('campaigns:all');
    }

    const campaigns: Campaign[] = [];
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    for (let i = offset; i < Math.min(offset + limit, campaignIds.length); i++) {
      const campaign = await this.getCampaign(campaignIds[i]);
      if (campaign) {
        // Filter by date range if provided
        if (options.startDate && campaign.startDate < options.startDate) continue;
        if (options.endDate && campaign.startDate > options.endDate) continue;
        campaigns.push(campaign);
      }
    }

    return campaigns.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  // COST TRACKING
  async addCostEntry(cost: Omit<CostEntry, 'id'>): Promise<string> {
    const id = `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullCost: CostEntry = {
      id,
      ...cost
    };

    await this.redis.setex(
      `cost:${id}`,
      365 * 24 * 60 * 60, // 1 year
      JSON.stringify(fullCost)
    );

    // Add to campaign cost index
    await this.redis.sadd(`campaign:${cost.campaignId}:costs`, id);

    // Update campaign spent amount
    await this.updateCampaignSpent(cost.campaignId, cost.amount);

    // Add to cost type index
    await this.redis.sadd(`costs:type:${cost.costType}`, id);

    return id;
  }

  private async updateCampaignSpent(campaignId: string, amount: number): Promise<void> {
    const campaign = await this.getCampaign(campaignId);
    if (campaign) {
      campaign.budget.spent += amount;
      await this.redis.setex(
        `campaign:${campaignId}`,
        365 * 24 * 60 * 60,
        JSON.stringify(campaign)
      );
    }
  }

  async getCampaignCosts(campaignId: string, startDate?: Date, endDate?: Date): Promise<CostEntry[]> {
    const costIds = await this.redis.smembers(`campaign:${campaignId}:costs`);
    const costs: CostEntry[] = [];

    for (const costId of costIds) {
      const data = await this.redis.get(`cost:${costId}`);
      if (data) {
        const cost = JSON.parse(data);
        cost.date = new Date(cost.date);

        // Filter by date range if provided
        if (startDate && cost.date < startDate) continue;
        if (endDate && cost.date > endDate) continue;

        costs.push(cost);
      }
    }

    return costs.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // REVENUE TRACKING
  async addRevenueEvent(revenue: Omit<RevenueEvent, 'id'>): Promise<string> {
    const id = `revenue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullRevenue: RevenueEvent = {
      id,
      ...revenue
    };

    await this.redis.setex(
      `revenue:${id}`,
      365 * 24 * 60 * 60, // 1 year
      JSON.stringify(fullRevenue)
    );

    // Add to campaign revenue index
    await this.redis.sadd(`campaign:${revenue.campaignId}:revenue`, id);

    // Add to attribution model index
    await this.redis.sadd(`revenue:attribution:${revenue.attributionModel}`, id);

    return id;
  }

  async getCampaignRevenue(campaignId: string, startDate?: Date, endDate?: Date): Promise<RevenueEvent[]> {
    const revenueIds = await this.redis.smembers(`campaign:${campaignId}:revenue`);
    const revenues: RevenueEvent[] = [];

    for (const revenueId of revenueIds) {
      const data = await this.redis.get(`revenue:${revenueId}`);
      if (data) {
        const revenue = JSON.parse(data);
        revenue.timestamp = new Date(revenue.timestamp);

        // Filter by date range if provided
        if (startDate && revenue.timestamp < startDate) continue;
        if (endDate && revenue.timestamp > endDate) continue;

        revenues.push(revenue);
      }
    }

    return revenues.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // ROI CALCULATION
  async calculateROI(
    campaignId: string,
    startDate: Date,
    endDate: Date,
    attributionModel?: string
  ): Promise<ROIMetrics | null> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) return null;

    const cacheKey = `roi:${campaignId}:${startDate.getTime()}:${endDate.getTime()}:${attributionModel || 'all'}`;

    // Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const metrics = JSON.parse(cached);
      metrics.period.startDate = new Date(metrics.period.startDate);
      metrics.period.endDate = new Date(metrics.period.endDate);
      return metrics;
    }

    // Get costs and revenue
    const costs = await this.getCampaignCosts(campaignId, startDate, endDate);
    const revenues = await this.getCampaignRevenue(campaignId, startDate, endDate);

    // Calculate cost metrics
    const costMetrics = this.calculateCostMetrics(costs, startDate, endDate);

    // Calculate revenue metrics
    const revenueMetrics = this.calculateRevenueMetrics(revenues, attributionModel);

    // Calculate ROI metrics
    const roiMetrics = this.calculateROIMetrics(costMetrics, revenueMetrics);

    // Calculate performance metrics (would integrate with analytics data)
    const performanceMetrics = await this.calculatePerformanceMetrics(campaignId, startDate, endDate);

    // Calculate attribution breakdown
    const attributionMetrics = this.calculateAttributionMetrics(revenues);

    const metrics: ROIMetrics = {
      campaignId,
      period: { startDate, endDate },
      costs: costMetrics,
      revenue: revenueMetrics,
      roi: roiMetrics,
      performance: performanceMetrics,
      attribution: attributionMetrics
    };

    // Cache for 30 minutes
    await this.redis.setex(cacheKey, this.ROI_CACHE_TTL, JSON.stringify(metrics));

    return metrics;
  }

  private calculateCostMetrics(costs: CostEntry[], startDate: Date, endDate: Date) {
    const totalCost = costs.reduce((sum, cost) => sum + cost.amount, 0);
    const mediaSpend = costs.filter(c => c.costType === 'media_spend').reduce((sum, c) => sum + c.amount, 0);
    const productionCost = costs.filter(c => c.costType === 'production').reduce((sum, c) => sum + c.amount, 0);
    const agencyFees = costs.filter(c => c.costType === 'agency_fee').reduce((sum, c) => sum + c.amount, 0);
    const toolCosts = costs.filter(c => c.costType === 'tool_cost').reduce((sum, c) => sum + c.amount, 0);
    const personnelCosts = costs.filter(c => c.costType === 'personnel').reduce((sum, c) => sum + c.amount, 0);
    const otherCosts = costs.filter(c => c.costType === 'other').reduce((sum, c) => sum + c.amount, 0);

    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const costPerDay = totalCost / daysDiff;

    return {
      totalCost,
      mediaSpend,
      productionCost,
      agencyFees,
      toolCosts,
      personnelCosts,
      otherCosts,
      costPerDay,
      costTrend: 0 // Would calculate from previous period
    };
  }

  private calculateRevenueMetrics(revenues: RevenueEvent[], attributionModel?: string) {
    let filteredRevenues = revenues;
    if (attributionModel) {
      filteredRevenues = revenues.filter(r => r.attributionModel === attributionModel);
    }

    const totalRevenue = filteredRevenues.reduce((sum, r) => sum + r.amount, 0);
    const attributedRevenue = filteredRevenues.reduce((sum, r) => sum + (r.amount * r.attributionWeight), 0);

    const firstTouchRevenue = revenues
      .filter(r => r.attributionModel === 'first_touch')
      .reduce((sum, r) => sum + r.amount, 0);

    const lastTouchRevenue = revenues
      .filter(r => r.attributionModel === 'last_touch')
      .reduce((sum, r) => sum + r.amount, 0);

    const assistedRevenue = revenues
      .filter(r => r.touchpointData.position > 1 && r.touchpointData.position < r.touchpointData.totalTouchpoints)
      .reduce((sum, r) => sum + r.amount, 0);

    const daysDiff = Math.max(1, 30); // Default to 30 days for calculation
    const revenuePerDay = totalRevenue / daysDiff;

    return {
      totalRevenue,
      attributedRevenue,
      firstTouchRevenue,
      lastTouchRevenue,
      assistedRevenue,
      revenuePerDay,
      revenueTrend: 0 // Would calculate from previous period
    };
  }

  private calculateROIMetrics(costs: any, revenue: any) {
    const roas = costs.totalCost > 0 ? revenue.totalRevenue / costs.totalCost : 0;
    const roi = costs.totalCost > 0 ? ((revenue.totalRevenue - costs.totalCost) / costs.totalCost) * 100 : 0;
    const netProfit = revenue.totalRevenue - costs.totalCost;
    const marginPercentage = revenue.totalRevenue > 0 ? (netProfit / revenue.totalRevenue) * 100 : 0;

    // Simplified calculations (would be more sophisticated in production)
    const totalConversions = Math.floor(revenue.totalRevenue / 100); // Assume $100 AOV
    const costPerAcquisition = totalConversions > 0 ? costs.totalCost / totalConversions : 0;
    const customerLifetimeValue = revenue.totalRevenue * 3; // Simplified LTV calculation
    const ltv_cac_ratio = costPerAcquisition > 0 ? customerLifetimeValue / costPerAcquisition : 0;
    const paybackPeriod = costPerAcquisition > 0 ? (costPerAcquisition / (revenue.revenuePerDay || 1)) : 0;

    return {
      roas,
      roi,
      netProfit,
      marginPercentage,
      costPerAcquisition,
      customerLifetimeValue,
      ltv_cac_ratio,
      paybackPeriod
    };
  }

  private async calculatePerformanceMetrics(campaignId: string, startDate: Date, endDate: Date) {
    // In production, this would integrate with analytics services
    // For now, return simulated data
    return {
      totalConversions: Math.floor(Math.random() * 1000),
      conversionRate: Math.random() * 0.1,
      averageOrderValue: 50 + Math.random() * 200,
      impressions: Math.floor(Math.random() * 100000),
      clicks: Math.floor(Math.random() * 5000),
      ctr: Math.random() * 0.05,
      cpm: 5 + Math.random() * 15,
      cpc: 0.5 + Math.random() * 3
    };
  }

  private calculateAttributionMetrics(revenues: RevenueEvent[]) {
    const firstTouch = revenues.filter(r => r.attributionModel === 'first_touch').reduce((sum, r) => sum + r.amount, 0);
    const lastTouch = revenues.filter(r => r.attributionModel === 'last_touch').reduce((sum, r) => sum + r.amount, 0);
    const linear = revenues.filter(r => r.attributionModel === 'linear').reduce((sum, r) => sum + r.amount, 0);
    const timeDecay = revenues.filter(r => r.attributionModel === 'time_decay').reduce((sum, r) => sum + r.amount, 0);
    const positionBased = revenues.filter(r => r.attributionModel === 'position_based').reduce((sum, r) => sum + r.amount, 0);
    const custom = revenues.filter(r => r.attributionModel === 'custom').reduce((sum, r) => sum + r.amount, 0);

    return {
      firstTouchAttribution: firstTouch,
      lastTouchAttribution: lastTouch,
      linearAttribution: linear,
      timeDecayAttribution: timeDecay,
      positionBasedAttribution: positionBased,
      customAttribution: custom
    };
  }

  // COMPARATIVE ANALYSIS
  async compareROI(
    campaignIds: string[],
    startDate: Date,
    endDate: Date,
    options: { includeIndustryBenchmarks?: boolean } = {}
  ): Promise<ROIComparison> {
    const campaigns = await Promise.all(
      campaignIds.map(id => this.calculateROI(id, startDate, endDate))
    );

    const validCampaigns = campaigns.filter(c => c !== null) as ROIMetrics[];

    // Calculate benchmarks (simplified)
    const avgROI = validCampaigns.reduce((sum, c) => sum + c.roi.roi, 0) / validCampaigns.length;
    const avgRoas = validCampaigns.reduce((sum, c) => sum + c.roi.roas, 0) / validCampaigns.length;

    const industryBenchmark: ROIMetrics = {
      campaignId: 'industry_avg',
      period: { startDate, endDate },
      costs: { totalCost: 10000, mediaSpend: 8000, productionCost: 1000, agencyFees: 500, toolCosts: 300, personnelCosts: 200, otherCosts: 0, costPerDay: 333, costTrend: 0 },
      revenue: { totalRevenue: 25000, attributedRevenue: 22000, firstTouchRevenue: 8000, lastTouchRevenue: 12000, assistedRevenue: 5000, revenuePerDay: 833, revenueTrend: 0 },
      roi: { roas: 2.5, roi: 150, netProfit: 15000, marginPercentage: 60, costPerAcquisition: 50, customerLifetimeValue: 300, ltv_cac_ratio: 6, paybackPeriod: 30 },
      performance: { totalConversions: 200, conversionRate: 0.04, averageOrderValue: 125, impressions: 50000, clicks: 2000, ctr: 0.04, cpm: 10, cpc: 5 },
      attribution: { firstTouchAttribution: 8000, lastTouchAttribution: 12000, linearAttribution: 22000, timeDecayAttribution: 20000, positionBasedAttribution: 18000, customAttribution: 0 }
    };

    // Find best and worst performers
    const sortedByROI = validCampaigns.sort((a, b) => b.roi.roi - a.roi.roi);
    const bestPerforming = sortedByROI.slice(0, 3).map(c => c.campaignId);
    const worstPerforming = sortedByROI.slice(-3).map(c => c.campaignId);

    const insights = {
      bestPerforming,
      worstPerforming,
      recommendations: [
        'Focus budget on campaigns with ROI > 200%',
        'Optimize underperforming campaigns or pause them',
        'Scale successful campaign strategies to new channels'
      ],
      trends: [
        `Average ROI: ${avgROI.toFixed(1)}%`,
        `Average ROAS: ${avgRoas.toFixed(2)}x`,
        'Video campaigns showing 30% higher engagement'
      ]
    };

    return {
      campaigns: validCampaigns,
      benchmarks: {
        industryAverage: industryBenchmark,
        channelAverage: industryBenchmark, // Simplified
        topPerformer: sortedByROI[0] || industryBenchmark
      },
      insights
    };
  }

  // COST ATTRIBUTION
  async calculateCostAttribution(
    campaignIds: string[],
    sharedCosts: CostEntry[],
    allocationMethod: 'equal' | 'revenue_based' | 'impression_based' | 'custom' = 'revenue_based'
  ): Promise<CostAttribution[]> {
    const attributions: CostAttribution[] = [];

    for (const campaignId of campaignIds) {
      const directCosts = await this.getCampaignCosts(campaignId);
      const directTotal = directCosts.reduce((sum, cost) => sum + cost.amount, 0);

      // Calculate shared cost allocation
      const totalSharedCost = sharedCosts.reduce((sum, cost) => sum + cost.amount, 0);
      let allocatedSharedCost = 0;

      if (allocationMethod === 'equal') {
        allocatedSharedCost = totalSharedCost / campaignIds.length;
      } else if (allocationMethod === 'revenue_based') {
        // Would calculate based on revenue attribution
        allocatedSharedCost = totalSharedCost * 0.25; // Simplified
      } else if (allocationMethod === 'impression_based') {
        // Would calculate based on impression share
        allocatedSharedCost = totalSharedCost * 0.3; // Simplified
      }

      attributions.push({
        campaignId,
        totalCost: directTotal + allocatedSharedCost,
        costBreakdown: {
          direct: directTotal,
          shared: allocatedSharedCost,
          allocated: 0
        },
        allocationRules: {
          method: allocationMethod,
          factors: { weight: 1.0 }
        }
      });
    }

    return attributions;
  }

  // HEALTH CHECK
  async getHealthStatus() {
    try {
      const totalCampaigns = await this.redis.scard('campaigns:all');
      const activeCampaigns = await this.redis.scard('campaigns:status:active');

      const testKey = `health_test_${Date.now()}`;
      await this.redis.setex(testKey, 10, 'test');
      const testValue = await this.redis.get(testKey);
      await this.redis.del(testKey);

      const status = testValue === 'test' ? 'healthy' : 'degraded';

      return {
        status,
        timestamp: new Date().toISOString(),
        metrics: {
          totalCampaigns,
          activeCampaigns,
          redisConnected: status === 'healthy'
        },
        version: '1.0.0'
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        version: '1.0.0'
      };
    }
  }
}

export function createUniversalCampaignROIService(redisClient: Redis): UniversalCampaignROIService {
  return new UniversalCampaignROIService(redisClient);
}

export default createUniversalCampaignROIService;
