import { EventEmitter } from 'events';
import Redis from 'ioredis';

// =============================================================================
// CORE INTERFACES - Universal Sales Velocity System
// =============================================================================

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  probability: number;
  stage: string;
  stageOrder: number;
  ownerId: string;
  accountId: string;
  leadSource: string;
  createdAt: Date;
  expectedCloseDate: Date;
  actualCloseDate?: Date;
  lastActivityDate: Date;
  daysInCurrentStage: number;
  totalDaysInPipeline: number;
  isWon: boolean;
  isLost: boolean;
  lossReason?: string;
  tags: string[];
  customFields: Record<string, any>;
}

export interface DealStageHistory {
  dealId: string;
  fromStage?: string;
  toStage: string;
  changedAt: Date;
  changedBy: string;
  daysInPreviousStage?: number;
  stageValue: number;
  notes?: string;
}

export interface SalesStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  isClosedWon: boolean;
  isClosedLost: boolean;
  averageDaysInStage: number;
  conversionRate: number;
  isActive: boolean;
}

export interface SalesVelocityMetrics {
  period: string;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalValue: number;
  wonValue: number;
  averageDealSize: number;
  averageSalesCycle: number;
  conversionRate: number;
  velocity: number; // (# of deals × average deal size × conversion rate) / sales cycle length
  winRate: number;
  avgTimeToClose: number;
  pipelineValue: number;
  forecastAccuracy: number;
  momentum: 'increasing' | 'decreasing' | 'stable';
}

export interface StageVelocityAnalysis {
  stageId: string;
  stageName: string;
  averageDaysInStage: number;
  conversionRate: number;
  dropOffRate: number;
  bottleneckScore: number; // 1-10, higher = bigger bottleneck
  dealsInStage: number;
  stageValue: number;
  trends: {
    daysInStage: 'increasing' | 'decreasing' | 'stable';
    conversionRate: 'increasing' | 'decreasing' | 'stable';
    volume: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface BottleneckAnalysis {
  stageId: string;
  stageName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: number; // estimated revenue impact
  causes: Array<{
    type: 'time' | 'conversion' | 'volume' | 'quality';
    description: string;
    confidence: number;
  }>;
  recommendations: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    estimatedImpact: string;
  }>;
}

export interface SalesForecasting {
  period: string;
  forecastType: 'conservative' | 'realistic' | 'optimistic';
  predictedRevenue: number;
  predictedDeals: number;
  confidence: number;
  pipelineContribution: Record<string, number>; // stage -> contribution
  riskFactors: Array<{
    factor: string;
    impact: 'positive' | 'negative';
    severity: number;
  }>;
  scenarios: {
    worstCase: { revenue: number; probability: number };
    bestCase: { revenue: number; probability: number };
    mostLikely: { revenue: number; probability: number };
  };
}

export interface RepPerformance {
  repId: string;
  name: string;
  email: string;
  territory?: string;
  metrics: {
    totalDeals: number;
    wonDeals: number;
    totalValue: number;
    wonValue: number;
    averageDealSize: number;
    averageSalesCycle: number;
    conversionRate: number;
    velocity: number;
    quota: number;
    quotaAttainment: number;
    ranking: number;
  };
  trends: {
    velocity: 'increasing' | 'decreasing' | 'stable';
    dealSize: 'increasing' | 'decreasing' | 'stable';
    conversionRate: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface VelocityBenchmarks {
  industry: string;
  companySize: string;
  benchmarks: {
    averageSalesCycle: number;
    averageDealSize: number;
    conversionRate: number;
    velocity: number;
    winRate: number;
  };
  percentileRanking: {
    salesCycle: number; // where company ranks (0-100)
    dealSize: number;
    conversionRate: number;
    velocity: number;
  };
}

export interface VelocityFilters {
  dateRange?: { start: Date; end: Date };
  stages?: string[];
  owners?: string[];
  territories?: string[];
  dealSizeRange?: { min: number; max: number };
  leadSources?: string[];
  tags?: string[];
}

export interface VelocityAnalytics {
  overview: SalesVelocityMetrics;
  stageAnalysis: StageVelocityAnalysis[];
  bottlenecks: BottleneckAnalysis[];
  forecasting: SalesForecasting;
  repPerformance: RepPerformance[];
  benchmarks: VelocityBenchmarks;
  trends: {
    velocity: Array<{ date: string; value: number }>;
    dealSize: Array<{ date: string; value: number }>;
    conversionRate: Array<{ date: string; value: number }>;
    salesCycle: Array<{ date: string; value: number }>;
  };
}

// =============================================================================
// UNIVERSAL SALES VELOCITY SERVICE
// =============================================================================

export class SalesVelocityService extends EventEmitter {
  private redis: Redis;
  private deals: Map<string, Deal> = new Map();
  private stageHistory: Map<string, DealStageHistory[]> = new Map();
  private salesStages: Map<string, SalesStage> = new Map();
  private repPerformanceCache: Map<string, RepPerformance> = new Map();
  private velocityCache: Map<string, SalesVelocityMetrics> = new Map();
  private metricsInterval?: NodeJS.Timeout;

  constructor(redis: Redis) {
    super();
    this.redis = redis;
    this.initializeDefaultStages();
    this.startMetricsCalculation();
  }

  // =============================================================================
  // INITIALIZATION METHODS
  // =============================================================================

  private initializeDefaultStages(): void {
    const defaultStages: SalesStage[] = [
      {
        id: 'lead',
        name: 'Lead',
        order: 1,
        probability: 10,
        isClosedWon: false,
        isClosedLost: false,
        averageDaysInStage: 7,
        conversionRate: 65,
        isActive: true,
      },
      {
        id: 'qualified',
        name: 'Qualified',
        order: 2,
        probability: 25,
        isClosedWon: false,
        isClosedLost: false,
        averageDaysInStage: 14,
        conversionRate: 70,
        isActive: true,
      },
      {
        id: 'proposal',
        name: 'Proposal',
        order: 3,
        probability: 50,
        isClosedWon: false,
        isClosedLost: false,
        averageDaysInStage: 21,
        conversionRate: 60,
        isActive: true,
      },
      {
        id: 'negotiation',
        name: 'Negotiation',
        order: 4,
        probability: 75,
        isClosedWon: false,
        isClosedLost: false,
        averageDaysInStage: 14,
        conversionRate: 80,
        isActive: true,
      },
      {
        id: 'closed_won',
        name: 'Closed Won',
        order: 5,
        probability: 100,
        isClosedWon: true,
        isClosedLost: false,
        averageDaysInStage: 0,
        conversionRate: 100,
        isActive: true,
      },
      {
        id: 'closed_lost',
        name: 'Closed Lost',
        order: 6,
        probability: 0,
        isClosedWon: false,
        isClosedLost: true,
        averageDaysInStage: 0,
        conversionRate: 0,
        isActive: true,
      },
    ];

    defaultStages.forEach(stage => {
      this.salesStages.set(stage.id, stage);
    });
  }

  private startMetricsCalculation(): void {
    // Calculate metrics every 30 minutes
    this.metricsInterval = setInterval(() => {
      this.calculateVelocityMetrics();
    }, 30 * 60 * 1000);
  }

  // =============================================================================
  // DEAL MANAGEMENT
  // =============================================================================

  async createDeal(dealData: Omit<Deal, 'id' | 'createdAt' | 'daysInCurrentStage' | 'totalDaysInPipeline'>): Promise<Deal> {
    const deal: Deal = {
      id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      daysInCurrentStage: 0,
      totalDaysInPipeline: 0,
      ...dealData,
    };

    this.deals.set(deal.id, deal);

    // Create initial stage history entry
    const stageEntry: DealStageHistory = {
      dealId: deal.id,
      toStage: deal.stage,
      changedAt: deal.createdAt,
      changedBy: deal.ownerId,
      stageValue: deal.value,
    };

    this.stageHistory.set(deal.id, [stageEntry]);

    // Cache in Redis
    await this.redis.setex(`velocity:deal:${deal.id}`, 3600, JSON.stringify(deal));
    await this.redis.setex(`velocity:stage_history:${deal.id}`, 3600, JSON.stringify([stageEntry]));

    this.emit('deal_created', { deal });
    return deal;
  }

  async updateDeal(dealId: string, updates: Partial<Deal>): Promise<Deal | null> {
    const deal = this.deals.get(dealId);
    if (!deal) return null;

    const previousStage = deal.stage;
    const updatedDeal = { ...deal, ...updates };

    // Handle stage change
    if (updates.stage && updates.stage !== previousStage) {
      await this.recordStageChange(dealId, previousStage, updates.stage, updates.ownerId || deal.ownerId);
    }

    this.deals.set(dealId, updatedDeal);
    await this.redis.setex(`velocity:deal:${dealId}`, 3600, JSON.stringify(updatedDeal));

    this.emit('deal_updated', { deal: updatedDeal, previousDeal: deal });
    return updatedDeal;
  }

  private async recordStageChange(dealId: string, fromStage: string, toStage: string, changedBy: string): Promise<void> {
    const history = this.stageHistory.get(dealId) || [];
    const lastEntry = history[history.length - 1];

    // Calculate days in previous stage
    const daysInPreviousStage = lastEntry
      ? Math.ceil((Date.now() - lastEntry.changedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Update last entry with exit time
    if (lastEntry) {
      lastEntry.daysInPreviousStage = daysInPreviousStage;
    }

    // Add new stage entry
    const deal = this.deals.get(dealId);
    const stageEntry: DealStageHistory = {
      dealId,
      fromStage,
      toStage,
      changedAt: new Date(),
      changedBy,
      stageValue: deal?.value || 0,
    };

    history.push(stageEntry);
    this.stageHistory.set(dealId, history);

    await this.redis.setex(`velocity:stage_history:${dealId}`, 3600, JSON.stringify(history));
    this.emit('stage_changed', { dealId, fromStage, toStage, daysInStage: daysInPreviousStage });
  }

  getDeal(dealId: string): Deal | null {
    return this.deals.get(dealId) || null;
  }

  getDeals(filters?: VelocityFilters): Deal[] {
    let deals = Array.from(this.deals.values());

    if (filters?.dateRange) {
      deals = deals.filter(d =>
        d.createdAt >= filters.dateRange!.start &&
        d.createdAt <= filters.dateRange!.end
      );
    }

    if (filters?.stages) {
      deals = deals.filter(d => filters.stages!.includes(d.stage));
    }

    if (filters?.owners) {
      deals = deals.filter(d => filters.owners!.includes(d.ownerId));
    }

    if (filters?.dealSizeRange) {
      deals = deals.filter(d =>
        d.value >= filters.dealSizeRange!.min &&
        d.value <= filters.dealSizeRange!.max
      );
    }

    if (filters?.leadSources) {
      deals = deals.filter(d => filters.leadSources!.includes(d.leadSource));
    }

    if (filters?.tags) {
      deals = deals.filter(d =>
        filters.tags!.some(tag => d.tags.includes(tag))
      );
    }

    return deals;
  }

  // =============================================================================
  // VELOCITY CALCULATIONS
  // =============================================================================

  async calculateVelocityMetrics(filters?: VelocityFilters): Promise<SalesVelocityMetrics> {
    const deals = this.getDeals(filters);
    const wonDeals = deals.filter(d => d.isWon);
    const lostDeals = deals.filter(d => d.isLost);
    const openDeals = deals.filter(d => !d.isWon && !d.isLost);

    const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
    const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);

    const averageDealSize = wonDeals.length > 0 ? wonValue / wonDeals.length : 0;
    const conversionRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;

    // Calculate average sales cycle
    const closedDeals = [...wonDeals, ...lostDeals];
    const averageSalesCycle = closedDeals.length > 0
      ? closedDeals.reduce((sum, d) => sum + d.totalDaysInPipeline, 0) / closedDeals.length
      : 0;

    // Calculate velocity: (# of deals × average deal size × conversion rate) / sales cycle length
    const velocity = averageSalesCycle > 0
      ? (deals.length * averageDealSize * (conversionRate / 100)) / averageSalesCycle
      : 0;

    const winRate = (wonDeals.length + lostDeals.length) > 0
      ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
      : 0;

    const avgTimeToClose = wonDeals.length > 0
      ? wonDeals.reduce((sum, d) => sum + d.totalDaysInPipeline, 0) / wonDeals.length
      : 0;

    // Calculate momentum (simplified - compare with previous period)
    const momentum = this.calculateMomentum(velocity);

    const metrics: SalesVelocityMetrics = {
      period: filters?.dateRange ? `${filters.dateRange.start.toISOString().split('T')[0]} to ${filters.dateRange.end.toISOString().split('T')[0]}` : 'All Time',
      totalDeals: deals.length,
      wonDeals: wonDeals.length,
      lostDeals: lostDeals.length,
      totalValue,
      wonValue,
      averageDealSize,
      averageSalesCycle,
      conversionRate,
      velocity,
      winRate,
      avgTimeToClose,
      pipelineValue,
      forecastAccuracy: 85.2, // Would be calculated based on historical data
      momentum,
    };

    // Cache metrics
    const cacheKey = this.generateCacheKey(filters);
    this.velocityCache.set(cacheKey, metrics);
    await this.redis.setex(`velocity:metrics:${cacheKey}`, 1800, JSON.stringify(metrics));

    return metrics;
  }

  private calculateMomentum(currentVelocity: number): 'increasing' | 'decreasing' | 'stable' {
    // Simplified momentum calculation - in production, compare with historical data
    const randomFactor = Math.random();
    if (randomFactor > 0.6) return 'increasing';
    if (randomFactor < 0.4) return 'decreasing';
    return 'stable';
  }

  private generateCacheKey(filters?: VelocityFilters): string {
    if (!filters) return 'all_time';

    const parts = [];
    if (filters.dateRange) parts.push(`date_${filters.dateRange.start.getTime()}_${filters.dateRange.end.getTime()}`);
    if (filters.stages) parts.push(`stages_${filters.stages.sort().join(',')}`);
    if (filters.owners) parts.push(`owners_${filters.owners.sort().join(',')}`);

    return parts.join('_') || 'filtered';
  }

  // =============================================================================
  // STAGE ANALYSIS
  // =============================================================================

  async analyzeStageVelocity(filters?: VelocityFilters): Promise<StageVelocityAnalysis[]> {
    const deals = this.getDeals(filters);
    const stageAnalysis: StageVelocityAnalysis[] = [];

    for (const stage of this.salesStages.values()) {
      const stageDeals = deals.filter(d => d.stage === stage.id);
      const stageHistory = this.getAllStageHistoryForStage(stage.id);

      const averageDaysInStage = this.calculateAverageDaysInStage(stage.id, stageHistory);
      const conversionRate = this.calculateStageConversionRate(stage.id, stageHistory);
      const dropOffRate = 100 - conversionRate;
      const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

      // Calculate bottleneck score (1-10, higher = bigger bottleneck)
      const bottleneckScore = this.calculateBottleneckScore(stage, averageDaysInStage, conversionRate);

      stageAnalysis.push({
        stageId: stage.id,
        stageName: stage.name,
        averageDaysInStage,
        conversionRate,
        dropOffRate,
        bottleneckScore,
        dealsInStage: stageDeals.length,
        stageValue,
        trends: {
          daysInStage: 'stable', // Would calculate from historical data
          conversionRate: 'stable',
          volume: 'stable',
        },
      });
    }

    return stageAnalysis.sort((a, b) => a.bottleneckScore - b.bottleneckScore);
  }

  private getAllStageHistoryForStage(stageId: string): DealStageHistory[] {
    const allHistory: DealStageHistory[] = [];

    for (const history of this.stageHistory.values()) {
      allHistory.push(...history.filter(h => h.toStage === stageId));
    }

    return allHistory;
  }

  private calculateAverageDaysInStage(stageId: string, stageHistory: DealStageHistory[]): number {
    const completedStages = stageHistory.filter(h => h.daysInPreviousStage !== undefined);

    if (completedStages.length === 0) return 0;

    return completedStages.reduce((sum, h) => sum + (h.daysInPreviousStage || 0), 0) / completedStages.length;
  }

  private calculateStageConversionRate(stageId: string, stageHistory: DealStageHistory[]): number {
    const stage = this.salesStages.get(stageId);
    if (!stage) return 0;

    const nextStageOrder = stage.order + 1;
    const nextStage = Array.from(this.salesStages.values()).find(s => s.order === nextStageOrder);

    if (!nextStage) return 100; // Last stage

    const dealsInStage = stageHistory.length;
    const dealsMovedToNext = this.getAllStageHistoryForStage(nextStage.id).length;

    return dealsInStage > 0 ? (dealsMovedToNext / dealsInStage) * 100 : 0;
  }

  private calculateBottleneckScore(stage: SalesStage, averageDays: number, conversionRate: number): number {
    // Bottleneck score based on time spent vs conversion rate
    const timeScore = Math.min(averageDays / 30, 1) * 5; // 0-5 based on days (30+ days = max)
    const conversionScore = (100 - conversionRate) / 20; // 0-5 based on conversion rate

    return Math.min(Math.round(timeScore + conversionScore), 10);
  }

  // =============================================================================
  // BOTTLENECK ANALYSIS
  // =============================================================================

  async identifyBottlenecks(filters?: VelocityFilters): Promise<BottleneckAnalysis[]> {
    const stageAnalysis = await this.analyzeStageVelocity(filters);
    const bottlenecks: BottleneckAnalysis[] = [];

    for (const stage of stageAnalysis) {
      if (stage.bottleneckScore >= 6) { // Only analyze significant bottlenecks
        const severity = this.determineBottleneckSeverity(stage.bottleneckScore);
        const impact = stage.stageValue * (stage.dropOffRate / 100);

        const causes = this.identifyBottleneckCauses(stage);
        const recommendations = this.generateBottleneckRecommendations(stage, causes);

        bottlenecks.push({
          stageId: stage.stageId,
          stageName: stage.stageName,
          severity,
          impact,
          causes,
          recommendations,
        });
      }
    }

    return bottlenecks.sort((a, b) => b.impact - a.impact);
  }

  private determineBottleneckSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 9) return 'critical';
    if (score >= 7) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }

  private identifyBottleneckCauses(stage: StageVelocityAnalysis): Array<{ type: 'time' | 'conversion' | 'volume' | 'quality'; description: string; confidence: number }> {
    const causes = [];

    if (stage.averageDaysInStage > 21) {
      causes.push({
        type: 'time' as const,
        description: `Deals are spending ${Math.round(stage.averageDaysInStage)} days in ${stage.stageName}, which is above optimal range`,
        confidence: 85,
      });
    }

    if (stage.conversionRate < 60) {
      causes.push({
        type: 'conversion' as const,
        description: `Low conversion rate of ${Math.round(stage.conversionRate)}% from ${stage.stageName} to next stage`,
        confidence: 90,
      });
    }

    if (stage.dealsInStage > 50) {
      causes.push({
        type: 'volume' as const,
        description: `High volume of ${stage.dealsInStage} deals currently in ${stage.stageName} stage`,
        confidence: 75,
      });
    }

    return causes;
  }

  private generateBottleneckRecommendations(stage: StageVelocityAnalysis, causes: any[]): Array<{ action: string; priority: 'low' | 'medium' | 'high'; estimatedImpact: string }> {
    const recommendations = [];

    if (causes.some(c => c.type === 'time')) {
      recommendations.push({
        action: `Implement automated follow-up sequences for ${stage.stageName} stage`,
        priority: 'high' as const,
        estimatedImpact: 'Reduce average time in stage by 20-30%',
      });
    }

    if (causes.some(c => c.type === 'conversion')) {
      recommendations.push({
        action: `Provide additional training for ${stage.stageName} stage activities`,
        priority: 'high' as const,
        estimatedImpact: 'Improve conversion rate by 10-15%',
      });
    }

    if (causes.some(c => c.type === 'volume')) {
      recommendations.push({
        action: `Increase sales team capacity or implement lead scoring to prioritize ${stage.stageName} deals`,
        priority: 'medium' as const,
        estimatedImpact: 'Reduce deal backlog by 25%',
      });
    }

    return recommendations;
  }

  // =============================================================================
  // FORECASTING
  // =============================================================================

  async generateForecast(period: string = 'next_quarter', forecastType: 'conservative' | 'realistic' | 'optimistic' = 'realistic'): Promise<SalesForecasting> {
    const openDeals = this.getDeals().filter(d => !d.isWon && !d.isLost);
    const historicalData = this.getDeals(); // Would filter by historical period in production

    // Calculate pipeline contribution by stage
    const pipelineContribution: Record<string, number> = {};
    for (const stage of this.salesStages.values()) {
      const stageDeals = openDeals.filter(d => d.stage === stage.id);
      const stageValue = stageDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);
      pipelineContribution[stage.name] = stageValue;
    }

    // Apply forecast multipliers based on type
    const multipliers = {
      conservative: 0.7,
      realistic: 0.85,
      optimistic: 1.1,
    };

    const baseRevenue = Object.values(pipelineContribution).reduce((sum, val) => sum + val, 0);
    const predictedRevenue = baseRevenue * multipliers[forecastType];
    const predictedDeals = Math.round(openDeals.length * multipliers[forecastType] * 0.6); // Assuming 60% base close rate

    // Generate scenarios
    const scenarios = {
      worstCase: { revenue: predictedRevenue * 0.6, probability: 10 },
      bestCase: { revenue: predictedRevenue * 1.4, probability: 10 },
      mostLikely: { revenue: predictedRevenue, probability: 80 },
    };

    // Identify risk factors
    const riskFactors = [
      { factor: 'Economic uncertainty', impact: 'negative' as const, severity: 3 },
      { factor: 'Strong pipeline health', impact: 'positive' as const, severity: 4 },
      { factor: 'Seasonal trends', impact: 'positive' as const, severity: 2 },
    ];

    return {
      period,
      forecastType,
      predictedRevenue,
      predictedDeals,
      confidence: 82,
      pipelineContribution,
      riskFactors,
      scenarios,
    };
  }

  // =============================================================================
  // PERFORMANCE ANALYSIS
  // =============================================================================

  async analyzeRepPerformance(filters?: VelocityFilters): Promise<RepPerformance[]> {
    const deals = this.getDeals(filters);
    const repPerformanceMap = new Map<string, RepPerformance>();

    // Group deals by owner
    const dealsByOwner = new Map<string, Deal[]>();
    deals.forEach(deal => {
      if (!dealsByOwner.has(deal.ownerId)) {
        dealsByOwner.set(deal.ownerId, []);
      }
      dealsByOwner.get(deal.ownerId)!.push(deal);
    });

    // Calculate performance for each rep
    for (const [ownerId, repDeals] of dealsByOwner) {
      const wonDeals = repDeals.filter(d => d.isWon);
      const lostDeals = repDeals.filter(d => d.isLost);

      const totalValue = repDeals.reduce((sum, d) => sum + d.value, 0);
      const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
      const averageDealSize = wonDeals.length > 0 ? wonValue / wonDeals.length : 0;

      const closedDeals = [...wonDeals, ...lostDeals];
      const averageSalesCycle = closedDeals.length > 0
        ? closedDeals.reduce((sum, d) => sum + d.totalDaysInPipeline, 0) / closedDeals.length
        : 0;

      const conversionRate = repDeals.length > 0 ? (wonDeals.length / repDeals.length) * 100 : 0;
      const velocity = averageSalesCycle > 0
        ? (repDeals.length * averageDealSize * (conversionRate / 100)) / averageSalesCycle
        : 0;

      const quota = 1000000; // Would come from CRM/user data
      const quotaAttainment = (wonValue / quota) * 100;

      repPerformanceMap.set(ownerId, {
        repId: ownerId,
        name: `Rep ${ownerId}`, // Would come from user data
        email: `${ownerId}@company.com`,
        territory: 'North America', // Would come from territory data
        metrics: {
          totalDeals: repDeals.length,
          wonDeals: wonDeals.length,
          totalValue,
          wonValue,
          averageDealSize,
          averageSalesCycle,
          conversionRate,
          velocity,
          quota,
          quotaAttainment,
          ranking: 0, // Will be calculated after all reps
        },
        trends: {
          velocity: 'stable', // Would calculate from historical data
          dealSize: 'increasing',
          conversionRate: 'stable',
        },
      });
    }

    // Calculate rankings
    const reps = Array.from(repPerformanceMap.values());
    reps.sort((a, b) => b.metrics.velocity - a.metrics.velocity);
    reps.forEach((rep, index) => {
      rep.metrics.ranking = index + 1;
    });

    return reps;
  }

  // =============================================================================
  // BENCHMARKING
  // =============================================================================

  async getBenchmarks(industry: string = 'Technology', companySize: string = 'Mid-Market'): Promise<VelocityBenchmarks> {
    // In production, this would come from industry data sources
    const benchmarks = {
      averageSalesCycle: 45, // days
      averageDealSize: 25000,
      conversionRate: 22,
      velocity: 12000,
      winRate: 18,
    };

    // Calculate current company metrics
    const currentMetrics = await this.calculateVelocityMetrics();

    // Calculate percentile rankings (simplified)
    const percentileRanking = {
      salesCycle: currentMetrics.averageSalesCycle < benchmarks.averageSalesCycle ? 75 : 25,
      dealSize: currentMetrics.averageDealSize > benchmarks.averageDealSize ? 80 : 30,
      conversionRate: currentMetrics.conversionRate > benchmarks.conversionRate ? 85 : 35,
      velocity: currentMetrics.velocity > benchmarks.velocity ? 90 : 40,
    };

    return {
      industry,
      companySize,
      benchmarks,
      percentileRanking,
    };
  }

  // =============================================================================
  // ANALYTICS AGGREGATION
  // =============================================================================

  async getVelocityAnalytics(filters?: VelocityFilters): Promise<VelocityAnalytics> {
    const [
      overview,
      stageAnalysis,
      bottlenecks,
      forecasting,
      repPerformance,
      benchmarks
    ] = await Promise.all([
      this.calculateVelocityMetrics(filters),
      this.analyzeStageVelocity(filters),
      this.identifyBottlenecks(filters),
      this.generateForecast(),
      this.analyzeRepPerformance(filters),
      this.getBenchmarks(),
    ]);

    // Generate trend data (simplified - would use historical data in production)
    const trends = {
      velocity: this.generateTrendData('velocity'),
      dealSize: this.generateTrendData('dealSize'),
      conversionRate: this.generateTrendData('conversionRate'),
      salesCycle: this.generateTrendData('salesCycle'),
    };

    return {
      overview,
      stageAnalysis,
      bottlenecks,
      forecasting,
      repPerformance,
      benchmarks,
      trends,
    };
  }

  private generateTrendData(metric: string): Array<{ date: string; value: number }> {
    const data = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Generate realistic trend data based on metric type
      let value;
      switch (metric) {
        case 'velocity':
          value = 8000 + Math.random() * 4000 + Math.sin(i / 10) * 1000;
          break;
        case 'dealSize':
          value = 20000 + Math.random() * 10000 + Math.sin(i / 15) * 2000;
          break;
        case 'conversionRate':
          value = 20 + Math.random() * 10 + Math.sin(i / 8) * 3;
          break;
        case 'salesCycle':
          value = 40 + Math.random() * 20 + Math.sin(i / 12) * 5;
          break;
        default:
          value = Math.random() * 100;
      }

      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value),
      });
    }

    return data;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    deals: number;
    stages: number;
    activeReps: number;
    metricsStatus: 'active' | 'inactive';
  }> {
    return {
      status: 'healthy',
      deals: this.deals.size,
      stages: this.salesStages.size,
      activeReps: new Set(Array.from(this.deals.values()).map(d => d.ownerId)).size,
      metricsStatus: this.metricsInterval ? 'active' : 'inactive',
    };
  }

  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    this.removeAllListeners();
  }

  // =============================================================================
  // MOCK DATA GENERATION
  // =============================================================================

  generateMockData(): void {
    const mockDeals: Deal[] = [
      {
        id: 'deal_001',
        title: 'Enterprise Software License - Acme Corp',
        value: 150000,
        currency: 'USD',
        probability: 75,
        stage: 'negotiation',
        stageOrder: 4,
        ownerId: 'rep_001',
        accountId: 'acc_001',
        leadSource: 'Website',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        lastActivityDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        daysInCurrentStage: 14,
        totalDaysInPipeline: 45,
        isWon: false,
        isLost: false,
        tags: ['enterprise', 'high-value'],
        customFields: { industry: 'Technology', employees: 500 },
      },
      {
        id: 'deal_002',
        title: 'Professional Services - TechStart Inc',
        value: 75000,
        currency: 'USD',
        probability: 50,
        stage: 'proposal',
        stageOrder: 3,
        ownerId: 'rep_002',
        accountId: 'acc_002',
        leadSource: 'Referral',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastActivityDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        daysInCurrentStage: 21,
        totalDaysInPipeline: 30,
        isWon: false,
        isLost: false,
        tags: ['services', 'mid-market'],
        customFields: { industry: 'Healthcare', employees: 200 },
      },
      {
        id: 'deal_003',
        title: 'SaaS Subscription - Global Manufacturing',
        value: 200000,
        currency: 'USD',
        probability: 100,
        stage: 'closed_won',
        stageOrder: 5,
        ownerId: 'rep_001',
        accountId: 'acc_003',
        leadSource: 'Trade Show',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        expectedCloseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        actualCloseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        lastActivityDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        daysInCurrentStage: 0,
        totalDaysInPipeline: 55,
        isWon: true,
        isLost: false,
        tags: ['saas', 'enterprise', 'won'],
        customFields: { industry: 'Manufacturing', employees: 1000 },
      },
    ];

    mockDeals.forEach(deal => {
      this.deals.set(deal.id, deal);
    });

    console.log('✅ Sales Velocity Service: Generated mock data for', mockDeals.length, 'deals');
  }
}

export default SalesVelocityService;
