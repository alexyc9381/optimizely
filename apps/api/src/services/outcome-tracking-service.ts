import { EventEmitter } from 'events';

export interface UserOutcome {
  id: string;
  userId: string;
  companyId: string;
  industry: 'saas' | 'manufacturing' | 'healthcare' | 'fintech' | 'college-consulting';
  configurationId: string;
  timestamp: Date;
  outcomeType: 'conversion' | 'engagement' | 'feature_adoption' | 'business_result' | 'churn' | 'upsell';
  outcome: {
    event: string;
    value?: number;
    metadata?: Record<string, any>;
  };
  context: {
    sessionId: string;
    userAgent?: string;
    source: string;
    campaign?: string;
    abTestVariant?: string;
  };
  metrics: {
    conversionRate?: number;
    engagementScore?: number;
    featureUsageCount?: number;
    revenueImpact?: number;
    timeToConversion?: number;
    customerLifetimeValue?: number;
  };
}

export interface IndustryMetrics {
  industry: string;
  totalUsers: number;
  totalConversions: number;
  conversionRate: number;
  averageEngagementScore: number;
  featureAdoptionRate: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  churnRate: number;
  upsellRate: number;
  timeToValue: number;
  topFeatures: Array<{
    feature: string;
    adoptionRate: number;
    impactScore: number;
  }>;
  outcomeBreakdown: {
    conversions: number;
    engagements: number;
    featureAdoptions: number;
    businessResults: number;
    churns: number;
    upsells: number;
  };
}

export interface BusinessOutcome {
  id: string;
  companyId: string;
  industry: string;
  configurationId: string;
  outcomeType: 'revenue_increase' | 'cost_reduction' | 'efficiency_gain' | 'customer_satisfaction' | 'retention_improvement';
  value: number;
  currency?: string;
  measurementPeriod: {
    start: Date;
    end: Date;
  };
  baseline: number;
  improvement: number;
  improvementPercentage: number;
  confidence: number;
  attribution: {
    platform: number;
    external: number;
    seasonal: number;
  };
  metadata: Record<string, any>;
}

export interface ConversionFunnel {
  industry: string;
  configurationId: string;
  stages: Array<{
    name: string;
    users: number;
    conversionRate: number;
    averageTimeInStage: number;
    dropoffReasons?: string[];
  }>;
  totalConversionRate: number;
  averageConversionTime: number;
  bottlenecks: Array<{
    stage: string;
    dropoffRate: number;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export interface FeatureAdoptionMetrics {
  feature: string;
  industry: string;
  totalUsers: number;
  adoptedUsers: number;
  adoptionRate: number;
  timeToAdoption: number;
  usageFrequency: number;
  retentionRate: number;
  businessImpact: {
    revenueIncrease: number;
    engagementIncrease: number;
    satisfactionIncrease: number;
  };
  correlatedFeatures: Array<{
    feature: string;
    correlation: number;
  }>;
}

export class OutcomeTrackingService extends EventEmitter {
  private static instance: OutcomeTrackingService;
  private outcomes: Map<string, UserOutcome> = new Map();
  private businessOutcomes: Map<string, BusinessOutcome> = new Map();
  private industryMetricsCache: Map<string, IndustryMetrics> = new Map();
  private conversionFunnels: Map<string, ConversionFunnel> = new Map();
  private featureMetrics: Map<string, FeatureAdoptionMetrics> = new Map();

  private constructor() {
    super();
    this.initializeTracking();
  }

  public static getInstance(): OutcomeTrackingService {
    if (!OutcomeTrackingService.instance) {
      OutcomeTrackingService.instance = new OutcomeTrackingService();
    }
    return OutcomeTrackingService.instance;
  }

  private initializeTracking(): void {
    // Set up periodic cache refresh
    setInterval(() => {
      this.refreshMetricsCache();
    }, 60000); // Refresh every minute

    // Set up data cleanup for old entries
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  /**
   * Track a user outcome event
   */
  public async trackOutcome(outcome: Omit<UserOutcome, 'id' | 'timestamp'>): Promise<string> {
    try {
      const outcomeRecord: UserOutcome = {
        ...outcome,
        id: this.generateId(),
        timestamp: new Date(),
      };

      // Calculate derived metrics
      await this.calculateDerivedMetrics(outcomeRecord);

      // Store the outcome
      this.outcomes.set(outcomeRecord.id, outcomeRecord);

      // Update industry metrics cache
      await this.updateIndustryMetrics(outcomeRecord.industry);

      // Update conversion funnel
      await this.updateConversionFunnel(outcomeRecord);

      // Update feature adoption metrics
      if (outcomeRecord.outcomeType === 'feature_adoption') {
        await this.updateFeatureMetrics(outcomeRecord);
      }

      // Emit event for real-time processing
      this.emit('outcome_tracked', outcomeRecord);

      return outcomeRecord.id;
    } catch (error) {
      console.error('Error tracking outcome:', error);
      throw error;
    }
  }

  /**
   * Track a business outcome
   */
  public async trackBusinessOutcome(outcome: Omit<BusinessOutcome, 'id'>): Promise<string> {
    try {
      const businessOutcome: BusinessOutcome = {
        ...outcome,
        id: this.generateId(),
      };

      this.businessOutcomes.set(businessOutcome.id, businessOutcome);

      // Update industry metrics
      await this.updateIndustryMetrics(businessOutcome.industry);

      this.emit('business_outcome_tracked', businessOutcome);

      return businessOutcome.id;
    } catch (error) {
      console.error('Error tracking business outcome:', error);
      throw error;
    }
  }

  /**
   * Get metrics for a specific industry
   */
  public async getIndustryMetrics(industry: string): Promise<IndustryMetrics> {
    try {
      let metrics = this.industryMetricsCache.get(industry);

      if (!metrics) {
        metrics = await this.calculateIndustryMetrics(industry);
        this.industryMetricsCache.set(industry, metrics);
      }

      return metrics;
    } catch (error) {
      console.error('Error getting industry metrics:', error);
      throw error;
    }
  }

  /**
   * Get conversion funnel for industry and configuration
   */
  public async getConversionFunnel(industry: string, configurationId?: string): Promise<ConversionFunnel> {
    try {
      const key = `${industry}-${configurationId || 'all'}`;
      let funnel = this.conversionFunnels.get(key);

      if (!funnel) {
        funnel = await this.calculateConversionFunnel(industry, configurationId);
        this.conversionFunnels.set(key, funnel);
      }

      return funnel;
    } catch (error) {
      console.error('Error getting conversion funnel:', error);
      throw error;
    }
  }

  /**
   * Get feature adoption metrics
   */
  public async getFeatureAdoptionMetrics(feature: string, industry?: string): Promise<FeatureAdoptionMetrics[]> {
    try {
      const results: FeatureAdoptionMetrics[] = [];

      for (const [key, metrics] of this.featureMetrics.entries()) {
        if (metrics.feature === feature && (!industry || metrics.industry === industry)) {
          results.push(metrics);
        }
      }

      if (results.length === 0) {
        // Calculate metrics if not cached
        const industries = industry ? [industry] : ['saas', 'manufacturing', 'healthcare', 'fintech', 'college-consulting'];

        for (const ind of industries) {
          const metrics = await this.calculateFeatureAdoptionMetrics(feature, ind);
          if (metrics) {
            results.push(metrics);
            this.featureMetrics.set(`${feature}-${ind}`, metrics);
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error getting feature adoption metrics:', error);
      throw error;
    }
  }

  /**
   * Get business outcomes by industry and time period
   */
  public async getBusinessOutcomes(
    industry?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<BusinessOutcome[]> {
    try {
      const results: BusinessOutcome[] = [];

      for (const outcome of this.businessOutcomes.values()) {
        if (industry && outcome.industry !== industry) continue;

        if (startDate && outcome.measurementPeriod.start < startDate) continue;
        if (endDate && outcome.measurementPeriod.end > endDate) continue;

        results.push(outcome);
      }

      return results.sort((a, b) => b.measurementPeriod.end.getTime() - a.measurementPeriod.end.getTime());
    } catch (error) {
      console.error('Error getting business outcomes:', error);
      throw error;
    }
  }

  /**
   * Get user outcomes by filters
   */
  public async getUserOutcomes(filters: {
    userId?: string;
    companyId?: string;
    industry?: string;
    outcomeType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<UserOutcome[]> {
    try {
      const results: UserOutcome[] = [];

      for (const outcome of this.outcomes.values()) {
        if (filters.userId && outcome.userId !== filters.userId) continue;
        if (filters.companyId && outcome.companyId !== filters.companyId) continue;
        if (filters.industry && outcome.industry !== filters.industry) continue;
        if (filters.outcomeType && outcome.outcomeType !== filters.outcomeType) continue;
        if (filters.startDate && outcome.timestamp < filters.startDate) continue;
        if (filters.endDate && outcome.timestamp > filters.endDate) continue;

        results.push(outcome);
      }

      // Sort by timestamp descending
      results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply limit
      if (filters.limit) {
        return results.slice(0, filters.limit);
      }

      return results;
    } catch (error) {
      console.error('Error getting user outcomes:', error);
      throw error;
    }
  }

  /**
   * Get cross-industry performance comparison
   */
  public async getCrossIndustryComparison(): Promise<{
    industries: IndustryMetrics[];
    benchmarks: {
      avgConversionRate: number;
      avgEngagementScore: number;
      avgFeatureAdoptionRate: number;
      avgRevenuePerUser: number;
    };
    topPerformers: {
      conversion: IndustryMetrics;
      engagement: IndustryMetrics;
      revenue: IndustryMetrics;
      retention: IndustryMetrics;
    };
  }> {
    try {
      const industries = await Promise.all([
        this.getIndustryMetrics('saas'),
        this.getIndustryMetrics('manufacturing'),
        this.getIndustryMetrics('healthcare'),
        this.getIndustryMetrics('fintech'),
        this.getIndustryMetrics('college-consulting'),
      ]);

      const benchmarks = {
        avgConversionRate: industries.reduce((sum, ind) => sum + ind.conversionRate, 0) / industries.length,
        avgEngagementScore: industries.reduce((sum, ind) => sum + ind.averageEngagementScore, 0) / industries.length,
        avgFeatureAdoptionRate: industries.reduce((sum, ind) => sum + ind.featureAdoptionRate, 0) / industries.length,
        avgRevenuePerUser: industries.reduce((sum, ind) => sum + ind.averageRevenuePerUser, 0) / industries.length,
      };

      const topPerformers = {
        conversion: industries.reduce((max, ind) => ind.conversionRate > max.conversionRate ? ind : max),
        engagement: industries.reduce((max, ind) => ind.averageEngagementScore > max.averageEngagementScore ? ind : max),
        revenue: industries.reduce((max, ind) => ind.averageRevenuePerUser > max.averageRevenuePerUser ? ind : max),
        retention: industries.reduce((max, ind) => (1 - ind.churnRate) > (1 - max.churnRate) ? ind : max),
      };

      return {
        industries,
        benchmarks,
        topPerformers,
      };
    } catch (error) {
      console.error('Error getting cross-industry comparison:', error);
      throw error;
    }
  }

  /**
   * Calculate derived metrics for an outcome
   */
  private async calculateDerivedMetrics(outcome: UserOutcome): Promise<void> {
    try {
      // Calculate conversion rate for this user's journey
      const userOutcomes = await this.getUserOutcomes({
        userId: outcome.userId,
        limit: 100,
      });

      const conversions = userOutcomes.filter(o => o.outcomeType === 'conversion').length;
      const totalEvents = userOutcomes.length;

      if (!outcome.metrics.conversionRate && totalEvents > 0) {
        outcome.metrics.conversionRate = conversions / totalEvents;
      }

      // Calculate engagement score based on recent activity
      const recentOutcomes = userOutcomes.filter(o => {
        const daysDiff = (Date.now() - o.timestamp.getTime()) / (24 * 60 * 60 * 1000);
        return daysDiff <= 30; // Last 30 days
      });

      if (!outcome.metrics.engagementScore) {
        outcome.metrics.engagementScore = Math.min(recentOutcomes.length * 10, 100);
      }

      // Calculate feature usage count
      const featureUsages = userOutcomes.filter(o => o.outcomeType === 'feature_adoption').length;
      if (!outcome.metrics.featureUsageCount) {
        outcome.metrics.featureUsageCount = featureUsages;
      }

      // Calculate time to conversion if this is a conversion event
      if (outcome.outcomeType === 'conversion' && !outcome.metrics.timeToConversion) {
        const firstOutcome = userOutcomes[userOutcomes.length - 1];
        if (firstOutcome) {
          outcome.metrics.timeToConversion = outcome.timestamp.getTime() - firstOutcome.timestamp.getTime();
        }
      }
    } catch (error) {
      console.error('Error calculating derived metrics:', error);
    }
  }

  /**
   * Calculate industry metrics
   */
  private async calculateIndustryMetrics(industry: string): Promise<IndustryMetrics> {
    try {
      const industryOutcomes = await this.getUserOutcomes({ industry });

      const uniqueUsers = new Set(industryOutcomes.map(o => o.userId)).size;
      const conversions = industryOutcomes.filter(o => o.outcomeType === 'conversion').length;
      const conversionRate = uniqueUsers > 0 ? conversions / uniqueUsers : 0;

      const engagementScores = industryOutcomes
        .map(o => o.metrics.engagementScore)
        .filter(score => score !== undefined) as number[];
      const averageEngagementScore = engagementScores.length > 0
        ? engagementScores.reduce((sum, score) => sum + score, 0) / engagementScores.length
        : 0;

      const featureAdoptions = industryOutcomes.filter(o => o.outcomeType === 'feature_adoption').length;
      const featureAdoptionRate = uniqueUsers > 0 ? featureAdoptions / uniqueUsers : 0;

      const revenueValues = industryOutcomes
        .map(o => o.metrics.revenueImpact)
        .filter(revenue => revenue !== undefined) as number[];
      const averageRevenuePerUser = revenueValues.length > 0
        ? revenueValues.reduce((sum, revenue) => sum + revenue, 0) / uniqueUsers
        : 0;

      const churnEvents = industryOutcomes.filter(o => o.outcomeType === 'churn').length;
      const churnRate = uniqueUsers > 0 ? churnEvents / uniqueUsers : 0;

      const upsellEvents = industryOutcomes.filter(o => o.outcomeType === 'upsell').length;
      const upsellRate = uniqueUsers > 0 ? upsellEvents / uniqueUsers : 0;

      // Calculate feature popularity
      const featureMap = new Map<string, number>();
      industryOutcomes
        .filter(o => o.outcomeType === 'feature_adoption')
        .forEach(o => {
          const feature = o.outcome.event;
          featureMap.set(feature, (featureMap.get(feature) || 0) + 1);
        });

      const topFeatures = Array.from(featureMap.entries())
        .map(([feature, count]) => ({
          feature,
          adoptionRate: count / uniqueUsers,
          impactScore: Math.random() * 100, // Placeholder - would be calculated based on business impact
        }))
        .sort((a, b) => b.adoptionRate - a.adoptionRate)
        .slice(0, 10);

      return {
        industry,
        totalUsers: uniqueUsers,
        totalConversions: conversions,
        conversionRate,
        averageEngagementScore,
        featureAdoptionRate,
        averageRevenuePerUser,
        customerLifetimeValue: averageRevenuePerUser * 24, // Assuming 24 month LTV
        churnRate,
        upsellRate,
        timeToValue: 0, // Would calculate based on first value event
        topFeatures,
        outcomeBreakdown: {
          conversions: industryOutcomes.filter(o => o.outcomeType === 'conversion').length,
          engagements: industryOutcomes.filter(o => o.outcomeType === 'engagement').length,
          featureAdoptions: industryOutcomes.filter(o => o.outcomeType === 'feature_adoption').length,
          businessResults: industryOutcomes.filter(o => o.outcomeType === 'business_result').length,
          churns: industryOutcomes.filter(o => o.outcomeType === 'churn').length,
          upsells: industryOutcomes.filter(o => o.outcomeType === 'upsell').length,
        },
      };
    } catch (error) {
      console.error('Error calculating industry metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate conversion funnel
   */
  private async calculateConversionFunnel(industry: string, configurationId?: string): Promise<ConversionFunnel> {
    try {
      const filters: any = { industry };
      if (configurationId) {
        filters.configurationId = configurationId;
      }

      const outcomes = await this.getUserOutcomes(filters);

      // Define standard funnel stages
      const stages = [
        'onboarding_started',
        'profile_completed',
        'first_feature_used',
        'value_realized',
        'conversion'
      ];

      const funnelStages = stages.map(stageName => {
        const stageOutcomes = outcomes.filter(o =>
          o.outcome.event === stageName ||
          (stageName === 'conversion' && o.outcomeType === 'conversion')
        );

        const uniqueUsers = new Set(stageOutcomes.map(o => o.userId)).size;
        const totalUsers = new Set(outcomes.map(o => o.userId)).size;

        return {
          name: stageName,
          users: uniqueUsers,
          conversionRate: totalUsers > 0 ? uniqueUsers / totalUsers : 0,
          averageTimeInStage: 0, // Would calculate based on time between stages
          dropoffReasons: [], // Would analyze from user feedback/behavior
        };
      });

      const totalConversionRate = funnelStages[funnelStages.length - 1]?.conversionRate || 0;

      // Identify bottlenecks
      const bottlenecks = funnelStages
        .map((stage, index) => {
          const dropoffRate = index > 0
            ? funnelStages[index - 1].conversionRate - stage.conversionRate
            : 1 - stage.conversionRate;

          return {
            stage: stage.name,
            dropoffRate,
            impact: dropoffRate > 0.3 ? 'high' : dropoffRate > 0.15 ? 'medium' : 'low' as 'high' | 'medium' | 'low',
          };
        })
        .filter(bottleneck => bottleneck.dropoffRate > 0.1);

      return {
        industry,
        configurationId: configurationId || 'all',
        stages: funnelStages,
        totalConversionRate,
        averageConversionTime: 0, // Would calculate from user journey data
        bottlenecks,
      };
    } catch (error) {
      console.error('Error calculating conversion funnel:', error);
      throw error;
    }
  }

  /**
   * Calculate feature adoption metrics
   */
  private async calculateFeatureAdoptionMetrics(feature: string, industry: string): Promise<FeatureAdoptionMetrics | null> {
    try {
      const industryOutcomes = await this.getUserOutcomes({ industry });
      const featureOutcomes = industryOutcomes.filter(o =>
        o.outcomeType === 'feature_adoption' && o.outcome.event === feature
      );

      if (featureOutcomes.length === 0) return null;

      const totalUsers = new Set(industryOutcomes.map(o => o.userId)).size;
      const adoptedUsers = new Set(featureOutcomes.map(o => o.userId)).size;
      const adoptionRate = totalUsers > 0 ? adoptedUsers / totalUsers : 0;

      return {
        feature,
        industry,
        totalUsers,
        adoptedUsers,
        adoptionRate,
        timeToAdoption: 0, // Would calculate from user journey
        usageFrequency: featureOutcomes.length / adoptedUsers,
        retentionRate: 0.8, // Placeholder - would calculate from continued usage
        businessImpact: {
          revenueIncrease: 0, // Would calculate from correlated revenue outcomes
          engagementIncrease: 0, // Would calculate from engagement score changes
          satisfactionIncrease: 0, // Would calculate from satisfaction surveys
        },
        correlatedFeatures: [], // Would calculate from co-adoption patterns
      };
    } catch (error) {
      console.error('Error calculating feature adoption metrics:', error);
      return null;
    }
  }

  /**
   * Update industry metrics cache
   */
  private async updateIndustryMetrics(industry: string): Promise<void> {
    try {
      const metrics = await this.calculateIndustryMetrics(industry);
      this.industryMetricsCache.set(industry, metrics);
    } catch (error) {
      console.error('Error updating industry metrics:', error);
    }
  }

  /**
   * Update conversion funnel
   */
  private async updateConversionFunnel(outcome: UserOutcome): Promise<void> {
    try {
      const key = `${outcome.industry}-${outcome.configurationId}`;
      const funnel = await this.calculateConversionFunnel(outcome.industry, outcome.configurationId);
      this.conversionFunnels.set(key, funnel);
    } catch (error) {
      console.error('Error updating conversion funnel:', error);
    }
  }

  /**
   * Update feature metrics
   */
  private async updateFeatureMetrics(outcome: UserOutcome): Promise<void> {
    try {
      const feature = outcome.outcome.event;
      const key = `${feature}-${outcome.industry}`;
      const metrics = await this.calculateFeatureAdoptionMetrics(feature, outcome.industry);

      if (metrics) {
        this.featureMetrics.set(key, metrics);
      }
    } catch (error) {
      console.error('Error updating feature metrics:', error);
    }
  }

  /**
   * Refresh metrics cache
   */
  private async refreshMetricsCache(): Promise<void> {
    try {
      const industries = ['saas', 'manufacturing', 'healthcare', 'fintech', 'college-consulting'];

      for (const industry of industries) {
        await this.updateIndustryMetrics(industry);
      }
    } catch (error) {
      console.error('Error refreshing metrics cache:', error);
    }
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days of data

      for (const [id, outcome] of this.outcomes.entries()) {
        if (outcome.timestamp < cutoffDate) {
          this.outcomes.delete(id);
        }
      }

      for (const [id, outcome] of this.businessOutcomes.entries()) {
        if (outcome.measurementPeriod.end < cutoffDate) {
          this.businessOutcomes.delete(id);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `outcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default OutcomeTrackingService;
