import { EventEmitter } from 'events';

export enum Industry {
  SAAS = 'saas',
  MANUFACTURING = 'manufacturing',
  HEALTHCARE = 'healthcare',
  FINTECH = 'fintech',
  COLLEGE_CONSULTING = 'college_consulting'
}

export enum PerformanceMetricType {
  // College Consulting
  STUDENT_ACCEPTANCE_RATE = 'student_acceptance_rate',
  COUNSELOR_CLIENT_LOAD = 'counselor_client_load',
  APPLICATION_SUCCESS_RATE = 'application_success_rate',
  SCHOLARSHIP_AWARD_RATE = 'scholarship_award_rate',
  CLIENT_SATISFACTION_SCORE = 'client_satisfaction_score',
  COUNSELING_SESSION_EFFECTIVENESS = 'counseling_session_effectiveness',

  // SaaS
  SALES_REP_QUOTA_ATTAINMENT = 'sales_rep_quota_attainment',
  LEAD_CONVERSION_RATE = 'lead_conversion_rate',
  CUSTOMER_LIFETIME_VALUE = 'customer_lifetime_value',
  CHURN_RATE = 'churn_rate',
  UPSELL_SUCCESS_RATE = 'upsell_success_rate',
  CUSTOMER_ACQUISITION_COST = 'customer_acquisition_cost',

  // Manufacturing
  ACCOUNT_MANAGER_REVENUE = 'account_manager_revenue',
  PRODUCTION_EFFICIENCY = 'production_efficiency',
  QUALITY_METRICS = 'quality_metrics',
  SUPPLIER_PERFORMANCE = 'supplier_performance',
  ORDER_FULFILLMENT_RATE = 'order_fulfillment_rate',
  CUSTOMER_RETENTION_RATE = 'customer_retention_rate',

  // Healthcare
  CLINICAL_OUTCOME_SCORES = 'clinical_outcome_scores',
  PATIENT_SATISFACTION = 'patient_satisfaction',
  PROVIDER_EFFICIENCY = 'provider_efficiency',
  TREATMENT_SUCCESS_RATE = 'treatment_success_rate',
  READMISSION_RATE = 'readmission_rate',
  COST_PER_PATIENT = 'cost_per_patient',

  // FinTech
  ADVISOR_CLIENT_PORTFOLIO = 'advisor_client_portfolio',
  INVESTMENT_PERFORMANCE = 'investment_performance',
  COMPLIANCE_SCORE = 'compliance_score',
  CLIENT_ACQUISITION_RATE = 'client_acquisition_rate',
  RISK_MANAGEMENT_SCORE = 'risk_management_score',
  REGULATORY_ADHERENCE = 'regulatory_adherence'
}

export enum PerformanceLevel {
  EXCEPTIONAL = 'exceptional',    // 90-100
  HIGH = 'high',                 // 75-89
  AVERAGE = 'average',           // 50-74
  BELOW_AVERAGE = 'below_average', // 25-49
  POOR = 'poor'                  // 0-24
}

export interface PerformanceMetric {
  id: string;
  type: PerformanceMetricType;
  value: number;
  targetValue: number;
  industry: Industry;
  performerId: string; // Employee/Advisor/Rep ID
  performerType: string; // role type
  period: {
    startDate: string;
    endDate: string;
    periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  context: {
    department?: string;
    team?: string;
    region?: string;
    productLine?: string;
  };
  metadata: {
    source: 'system' | 'manual' | 'integration' | 'survey';
    confidence: number; // 0-100
    sampleSize?: number;
    methodology?: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PerformerProfile {
  id: string;
  performerId: string;
  industry: Industry;
  performerType: string;
  name: string;
  department: string;
  team?: string;
  region?: string;
  hireDate: string;
  currentMetrics: PerformanceMetric[];
  overallScore: number; // 0-100
  performanceLevel: PerformanceLevel;
  trends: {
    trending: 'up' | 'down' | 'stable';
    changePercent: number;
    timeframe: string;
  };
  strengths: string[];
  improvementAreas: string[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
    timeframe: string;
  }[];
  benchmarks: {
    industryAverage: number;
    departmentAverage: number;
    teamAverage: number;
    percentileRank: number; // 0-100
  };
  createdAt: string;
  updatedAt: string;
}

export interface IndustryBenchmarks {
  industry: Industry;
  totalPerformers: number;
  averagePerformanceScore: number;
  performanceLevelDistribution: {
    [level in PerformanceLevel]: number;
  };
  topMetrics: {
    metricType: PerformanceMetricType;
    averageValue: number;
    bestPerformers: number;
    improvementOpportunity: number;
  }[];
  industrySpecificInsights: {
    keySuccessFactors: string[];
    commonChallenges: string[];
    emergingTrends: string[];
    bestPractices: string[];
  };
  competitiveAnalysis: {
    marketPosition: 'leader' | 'challenger' | 'follower';
    strengthAreas: string[];
    improvementAreas: string[];
  };
  lastAnalyzed: string;
}

export interface CrossIndustryComparison {
  industries: Industry[];
  comparisonPeriod: {
    startDate: string;
    endDate: string;
  };
  performanceComparison: {
    industry: Industry;
    averageScore: number;
    performerCount: number;
    topPerformingMetrics: PerformanceMetricType[];
    rank: number;
  }[];
  insights: {
    highestPerformingIndustry: Industry;
    fastestImprovingIndustry: Industry;
    mostConsistentIndustry: Industry;
    crossIndustryTrends: string[];
    opportunityAreas: string[];
  };
  recommendedBestPractices: {
    sourceIndustry: Industry;
    applicableIndustries: Industry[];
    practice: string;
    expectedImpact: string;
  }[];
}

class CrossIndustryPerformanceAnalyticsService extends EventEmitter {
  private static _instance: CrossIndustryPerformanceAnalyticsService;
  private performanceMetrics: Map<string, PerformanceMetric> = new Map();
  private performerProfiles: Map<string, PerformerProfile> = new Map();
  private industryBenchmarks: Map<Industry, IndustryBenchmarks> = new Map();
  private performerMetricsIndex: Map<string, string[]> = new Map();
  private industryMetricsIndex: Map<Industry, string[]> = new Map();
  private metricTypeIndex: Map<PerformanceMetricType, string[]> = new Map();

  private constructor() {
    super();
    this.initializeIndustryConfigurations();
  }

  static getInstance(): CrossIndustryPerformanceAnalyticsService {
    if (!CrossIndustryPerformanceAnalyticsService._instance) {
      CrossIndustryPerformanceAnalyticsService._instance = new CrossIndustryPerformanceAnalyticsService();
    }
    return CrossIndustryPerformanceAnalyticsService._instance;
  }

  private initializeIndustryConfigurations(): void {
    Object.values(Industry).forEach(industry => {
      this.industryMetricsIndex.set(industry, []);
      this.industryBenchmarks.set(industry, this.createDefaultBenchmarks(industry));
    });

    Object.values(PerformanceMetricType).forEach(metricType => {
      this.metricTypeIndex.set(metricType, []);
    });
  }

  private createDefaultBenchmarks(industry: Industry): IndustryBenchmarks {
    return {
      industry,
      totalPerformers: 0,
      averagePerformanceScore: 0,
      performanceLevelDistribution: {
        [PerformanceLevel.EXCEPTIONAL]: 0,
        [PerformanceLevel.HIGH]: 0,
        [PerformanceLevel.AVERAGE]: 0,
        [PerformanceLevel.BELOW_AVERAGE]: 0,
        [PerformanceLevel.POOR]: 0
      },
      topMetrics: [],
      industrySpecificInsights: {
        keySuccessFactors: this.getIndustrySuccessFactors(industry),
        commonChallenges: this.getIndustryChallenges(industry),
        emergingTrends: this.getIndustryTrends(industry),
        bestPractices: this.getIndustryBestPractices(industry)
      },
      competitiveAnalysis: {
        marketPosition: 'challenger',
        strengthAreas: [],
        improvementAreas: []
      },
      lastAnalyzed: new Date().toISOString()
    };
  }

  private getIndustrySuccessFactors(industry: Industry): string[] {
    const factorsMap = {
      [Industry.COLLEGE_CONSULTING]: [
        'Strong student-counselor relationships',
        'Data-driven college matching',
        'Early application planning',
        'Comprehensive portfolio development'
      ],
      [Industry.SAAS]: [
        'Product-market fit optimization',
        'Customer success focus',
        'Scalable sales processes',
        'Continuous product innovation'
      ],
      [Industry.MANUFACTURING]: [
        'Lean production processes',
        'Quality management systems',
        'Supply chain optimization',
        'Technology integration'
      ],
      [Industry.HEALTHCARE]: [
        'Patient-centered care',
        'Evidence-based treatment',
        'Operational efficiency',
        'Clinical outcome optimization'
      ],
      [Industry.FINTECH]: [
        'Regulatory compliance excellence',
        'Risk management frameworks',
        'Technology innovation',
        'Customer trust and security'
      ]
    };
    return factorsMap[industry];
  }

  private getIndustryChallenges(industry: Industry): string[] {
    const challengesMap = {
      [Industry.COLLEGE_CONSULTING]: [
        'Increasing college costs',
        'Competitive admission landscape',
        'Changing college preferences',
        'Economic uncertainty impact'
      ],
      [Industry.SAAS]: [
        'Customer acquisition costs',
        'Market saturation',
        'Feature complexity',
        'Customer churn management'
      ],
      [Industry.MANUFACTURING]: [
        'Supply chain disruptions',
        'Labor shortages',
        'Environmental regulations',
        'Technology adoption costs'
      ],
      [Industry.HEALTHCARE]: [
        'Rising healthcare costs',
        'Regulatory compliance',
        'Staff burnout',
        'Technology integration challenges'
      ],
      [Industry.FINTECH]: [
        'Regulatory complexity',
        'Cybersecurity threats',
        'Customer trust issues',
        'Compliance costs'
      ]
    };
    return challengesMap[industry];
  }

  private getIndustryTrends(industry: Industry): string[] {
    const trendsMap = {
      [Industry.COLLEGE_CONSULTING]: [
        'AI-powered college matching',
        'Virtual campus visits',
        'Test-optional admissions',
        'Career-focused program selection'
      ],
      [Industry.SAAS]: [
        'Product-led growth',
        'AI/ML integration',
        'API-first development',
        'Customer success automation'
      ],
      [Industry.MANUFACTURING]: [
        'Industry 4.0 adoption',
        'Sustainable manufacturing',
        'Predictive maintenance',
        'Digital twin technology'
      ],
      [Industry.HEALTHCARE]: [
        'Telemedicine expansion',
        'AI diagnostics',
        'Value-based care',
        'Digital health integration'
      ],
      [Industry.FINTECH]: [
        'DeFi integration',
        'Open banking APIs',
        'AI fraud detection',
        'Embedded finance'
      ]
    };
    return trendsMap[industry];
  }

  private getIndustryBestPractices(industry: Industry): string[] {
    const practicesMap = {
      [Industry.COLLEGE_CONSULTING]: [
        'Early engagement with families',
        'Comprehensive student assessment',
        'Regular progress tracking',
        'Post-admission support'
      ],
      [Industry.SAAS]: [
        'Customer onboarding optimization',
        'Feature usage analytics',
        'Proactive customer success',
        'Continuous product feedback'
      ],
      [Industry.MANUFACTURING]: [
        'Continuous improvement culture',
        'Cross-functional collaboration',
        'Supplier relationship management',
        'Data-driven decision making'
      ],
      [Industry.HEALTHCARE]: [
        'Multidisciplinary care teams',
        'Patient engagement strategies',
        'Quality improvement programs',
        'Technology-enabled care'
      ],
      [Industry.FINTECH]: [
        'Robust risk management',
        'Regular compliance audits',
        'Customer education programs',
        'Transparent communication'
      ]
    };
    return practicesMap[industry];
  }

  async recordPerformanceMetric(
    performerId: string,
    industry: Industry,
    metricType: PerformanceMetricType,
    value: number,
    targetValue: number,
    options: {
      performerType?: string;
      period?: PerformanceMetric['period'];
      context?: PerformanceMetric['context'];
      metadata?: Partial<PerformanceMetric['metadata']>;
    } = {}
  ): Promise<PerformanceMetric> {
    // Validation
    if (!performerId?.trim()) {
      throw new Error('Performer ID is required');
    }

    if (!Object.values(Industry).includes(industry)) {
      throw new Error(`Invalid industry: ${industry}`);
    }

    if (!Object.values(PerformanceMetricType).includes(metricType)) {
      throw new Error(`Invalid metric type: ${metricType}`);
    }

    if (typeof value !== 'number' || value < 0) {
      throw new Error('Valid metric value is required');
    }

    if (typeof targetValue !== 'number' || targetValue < 0) {
      throw new Error('Valid target value is required');
    }

    const metricId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Default period - current month
    const defaultPeriod: PerformanceMetric['period'] = {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      periodType: 'monthly'
    };

    const metric: PerformanceMetric = {
      id: metricId,
      type: metricType,
      value,
      targetValue,
      industry,
      performerId,
      performerType: options.performerType || this.getDefaultPerformerType(industry),
      period: options.period || defaultPeriod,
      context: options.context || {},
      metadata: {
        source: 'system',
        confidence: 90,
        ...options.metadata
      },
      createdAt: now,
      updatedAt: now
    };

    // Store metric
    this.performanceMetrics.set(metricId, metric);

    // Update indexes
    this.updateMetricIndexes(metric);

    // Update or create performer profile
    await this.updatePerformerProfile(performerId, industry);

    // Update industry benchmarks
    this.updateIndustryBenchmarks(industry);

    // Emit event
    this.emit('performanceMetricRecorded', {
      metric,
      performerId,
      industry,
      metricType
    });

    return metric;
  }

  private getDefaultPerformerType(industry: Industry): string {
    const typeMap = {
      [Industry.COLLEGE_CONSULTING]: 'counselor',
      [Industry.SAAS]: 'sales_rep',
      [Industry.MANUFACTURING]: 'account_manager',
      [Industry.HEALTHCARE]: 'provider',
      [Industry.FINTECH]: 'advisor'
    };
    return typeMap[industry];
  }

  private updateMetricIndexes(metric: PerformanceMetric): void {
    const { id, performerId, industry, type } = metric;

    // Performer index
    if (!this.performerMetricsIndex.has(performerId)) {
      this.performerMetricsIndex.set(performerId, []);
    }
    this.performerMetricsIndex.get(performerId)!.push(id);

    // Industry index
    const industryMetrics = this.industryMetricsIndex.get(industry) || [];
    industryMetrics.push(id);
    this.industryMetricsIndex.set(industry, industryMetrics);

    // Metric type index
    const typeMetrics = this.metricTypeIndex.get(type) || [];
    typeMetrics.push(id);
    this.metricTypeIndex.set(type, typeMetrics);
  }

  private async updatePerformerProfile(performerId: string, industry: Industry): Promise<void> {
    const performerMetrics = this.getPerformerMetrics(performerId);

    if (performerMetrics.length === 0) return;

    // Calculate overall performance score
    const overallScore = this.calculateOverallPerformanceScore(performerMetrics, industry);
    const performanceLevel = this.getPerformanceLevel(overallScore);

    // Calculate trends
    const trends = this.calculatePerformanceTrends(performerMetrics);

    // Generate insights
    const strengths = this.identifyStrengths(performerMetrics, industry);
    const improvementAreas = this.identifyImprovementAreas(performerMetrics, industry);
    const recommendations = this.generateRecommendations(performerMetrics, industry, overallScore);

    // Calculate benchmarks
    const benchmarks = this.calculatePerformerBenchmarks(performerId, industry, overallScore);

    const profile: PerformerProfile = {
      id: `pp_${performerId}`,
      performerId,
      industry,
      performerType: performerMetrics[0].performerType,
      name: `Performer ${performerId}`,
      department: performerMetrics[0].context.department || 'General',
      team: performerMetrics[0].context.team,
      region: performerMetrics[0].context.region,
      hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currentMetrics: performerMetrics.slice(0, 10), // Most recent 10
      overallScore,
      performanceLevel,
      trends,
      strengths,
      improvementAreas,
      recommendations,
      benchmarks,
      createdAt: this.performerProfiles.has(performerId) ? this.performerProfiles.get(performerId)!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.performerProfiles.set(performerId, profile);

    this.emit('performerProfileUpdated', {
      profile,
      performerId,
      industry
    });
  }

  private calculateOverallPerformanceScore(metrics: PerformanceMetric[], industry: Industry): number {
    if (metrics.length === 0) return 50;

    // Industry-specific metric weights
    const metricWeights = this.getIndustryMetricWeights(industry);

    let totalScore = 0;
    let totalWeight = 0;

    metrics.forEach(metric => {
      const weight = metricWeights[metric.type] || 1;
      const achievementRate = Math.min((metric.value / metric.targetValue) * 100, 100);
      const confidenceAdjustedScore = achievementRate * (metric.metadata.confidence / 100);

      totalScore += confidenceAdjustedScore * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.min(Math.max(Math.round(totalScore / totalWeight), 0), 100) : 50;
  }

  private getIndustryMetricWeights(industry: Industry): Record<PerformanceMetricType, number> {
    // Simplified weights - in production, these would be more sophisticated
    const weights: Partial<Record<PerformanceMetricType, number>> = {};

    switch (industry) {
      case Industry.COLLEGE_CONSULTING:
        weights[PerformanceMetricType.STUDENT_ACCEPTANCE_RATE] = 3;
        weights[PerformanceMetricType.APPLICATION_SUCCESS_RATE] = 2.5;
        weights[PerformanceMetricType.CLIENT_SATISFACTION_SCORE] = 2;
        weights[PerformanceMetricType.SCHOLARSHIP_AWARD_RATE] = 2;
        break;
      case Industry.SAAS:
        weights[PerformanceMetricType.SALES_REP_QUOTA_ATTAINMENT] = 3;
        weights[PerformanceMetricType.LEAD_CONVERSION_RATE] = 2.5;
        weights[PerformanceMetricType.CUSTOMER_LIFETIME_VALUE] = 2;
        weights[PerformanceMetricType.CHURN_RATE] = 2;
        break;
      case Industry.MANUFACTURING:
        weights[PerformanceMetricType.ACCOUNT_MANAGER_REVENUE] = 3;
        weights[PerformanceMetricType.PRODUCTION_EFFICIENCY] = 2.5;
        weights[PerformanceMetricType.QUALITY_METRICS] = 2;
        weights[PerformanceMetricType.ORDER_FULFILLMENT_RATE] = 2;
        break;
      case Industry.HEALTHCARE:
        weights[PerformanceMetricType.CLINICAL_OUTCOME_SCORES] = 3;
        weights[PerformanceMetricType.PATIENT_SATISFACTION] = 2.5;
        weights[PerformanceMetricType.TREATMENT_SUCCESS_RATE] = 2.5;
        weights[PerformanceMetricType.PROVIDER_EFFICIENCY] = 2;
        break;
      case Industry.FINTECH:
        weights[PerformanceMetricType.INVESTMENT_PERFORMANCE] = 3;
        weights[PerformanceMetricType.COMPLIANCE_SCORE] = 2.5;
        weights[PerformanceMetricType.CLIENT_ACQUISITION_RATE] = 2;
        weights[PerformanceMetricType.RISK_MANAGEMENT_SCORE] = 2.5;
        break;
    }

    return weights as Record<PerformanceMetricType, number>;
  }

  private getPerformanceLevel(score: number): PerformanceLevel {
    if (score >= 90) return PerformanceLevel.EXCEPTIONAL;
    if (score >= 75) return PerformanceLevel.HIGH;
    if (score >= 50) return PerformanceLevel.AVERAGE;
    if (score >= 25) return PerformanceLevel.BELOW_AVERAGE;
    return PerformanceLevel.POOR;
  }

  private calculatePerformanceTrends(metrics: PerformanceMetric[]) {
    if (metrics.length < 2) {
      return {
        trending: 'stable' as const,
        changePercent: 0,
        timeframe: '30 days'
      };
    }

    // Sort by date and calculate trend
    const sortedMetrics = metrics.sort((a, b) =>
      new Date(a.period.endDate).getTime() - new Date(b.period.endDate).getTime()
    );

    const recentMetrics = sortedMetrics.slice(-5); // Last 5 metrics
    const firstScore = (recentMetrics[0].value / recentMetrics[0].targetValue) * 100;
    const lastScore = (recentMetrics[recentMetrics.length - 1].value / recentMetrics[recentMetrics.length - 1].targetValue) * 100;

    const changePercent = ((lastScore - firstScore) / firstScore) * 100;

    let trending: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 5) {
      trending = changePercent > 0 ? 'up' : 'down';
    }

    return {
      trending,
      changePercent: Math.round(changePercent * 10) / 10,
      timeframe: '30 days'
    };
  }

  private identifyStrengths(metrics: PerformanceMetric[], industry: Industry): string[] {
    const strengths: string[] = [];

    // Find metrics where performance exceeds target by 10%+
    const strongMetrics = metrics.filter(m => (m.value / m.targetValue) >= 1.1);

    strongMetrics.forEach(metric => {
      const metricName = metric.type.replace(/_/g, ' ').toLowerCase();
      strengths.push(`Exceeds expectations in ${metricName}`);
    });

    // Industry-specific strength patterns
    if (strengths.length === 0) {
      strengths.push('Consistent performance across key metrics');
    }

    return strengths.slice(0, 3); // Top 3 strengths
  }

  private identifyImprovementAreas(metrics: PerformanceMetric[], industry: Industry): string[] {
    const areas: string[] = [];

    // Find metrics where performance is below target by 10%+
    const weakMetrics = metrics.filter(m => (m.value / m.targetValue) <= 0.9);

    weakMetrics.forEach(metric => {
      const metricName = metric.type.replace(/_/g, ' ').toLowerCase();
      areas.push(`Improvement needed in ${metricName}`);
    });

    if (areas.length === 0) {
      areas.push('Focus on maintaining current performance levels');
    }

    return areas.slice(0, 3); // Top 3 areas
  }

  private generateRecommendations(metrics: PerformanceMetric[], industry: Industry, overallScore: number): PerformerProfile['recommendations'] {
    const recommendations: PerformerProfile['recommendations'] = [];

    if (overallScore < 50) {
      recommendations.push({
        priority: 'high',
        action: 'Comprehensive performance improvement plan',
        expectedImpact: 'Significant performance boost across key metrics',
        timeframe: '3-6 months'
      });
    } else if (overallScore < 75) {
      recommendations.push({
        priority: 'medium',
        action: 'Focus on specific skill development',
        expectedImpact: 'Targeted improvement in underperforming areas',
        timeframe: '1-3 months'
      });
    } else {
      recommendations.push({
        priority: 'low',
        action: 'Advanced training for continued excellence',
        expectedImpact: 'Maintain high performance and develop leadership skills',
        timeframe: '3-12 months'
      });
    }

    // Industry-specific recommendations
    const industryRecommendations = this.getIndustrySpecificRecommendations(industry, overallScore);
    recommendations.push(...industryRecommendations);

    return recommendations.slice(0, 3);
  }

  private getIndustrySpecificRecommendations(industry: Industry, score: number): PerformerProfile['recommendations'] {
    const recommendations: PerformerProfile['recommendations'] = [];

    switch (industry) {
      case Industry.COLLEGE_CONSULTING:
        if (score < 75) {
          recommendations.push({
            priority: 'medium',
            action: 'Enhance college research and matching skills',
            expectedImpact: 'Improved student placement outcomes',
            timeframe: '2-4 months'
          });
        }
        break;
      case Industry.SAAS:
        if (score < 75) {
          recommendations.push({
            priority: 'medium',
            action: 'Sales process optimization training',
            expectedImpact: 'Higher conversion rates and quota attainment',
            timeframe: '1-2 months'
          });
        }
        break;
    }

    return recommendations;
  }

  private calculatePerformerBenchmarks(performerId: string, industry: Industry, overallScore: number): PerformerProfile['benchmarks'] {
    const industryBenchmark = this.industryBenchmarks.get(industry);
    const allPerformers = Array.from(this.performerProfiles.values()).filter(p => p.industry === industry);

    const industryAverage = industryBenchmark?.averagePerformanceScore || 65;
    const departmentAverage = 70; // Simplified
    const teamAverage = 68; // Simplified

    // Calculate percentile rank
    const scoresLowerThanPerformer = allPerformers.filter(p => p.overallScore < overallScore).length;
    const percentileRank = allPerformers.length > 0 ? (scoresLowerThanPerformer / allPerformers.length) * 100 : 50;

    return {
      industryAverage,
      departmentAverage,
      teamAverage,
      percentileRank: Math.round(percentileRank)
    };
  }

  private updateIndustryBenchmarks(industry: Industry): void {
    const industryMetricIds = this.industryMetricsIndex.get(industry) || [];
    const industryMetrics = industryMetricIds
      .map(id => this.performanceMetrics.get(id))
      .filter((m): m is PerformanceMetric => !!m);

    const industryPerformers = Array.from(this.performerProfiles.values())
      .filter(p => p.industry === industry);

    if (industryPerformers.length === 0) return;

    const averageScore = industryPerformers.reduce((sum, p) => sum + p.overallScore, 0) / industryPerformers.length;

    const distribution = {
      [PerformanceLevel.EXCEPTIONAL]: industryPerformers.filter(p => p.performanceLevel === PerformanceLevel.EXCEPTIONAL).length,
      [PerformanceLevel.HIGH]: industryPerformers.filter(p => p.performanceLevel === PerformanceLevel.HIGH).length,
      [PerformanceLevel.AVERAGE]: industryPerformers.filter(p => p.performanceLevel === PerformanceLevel.AVERAGE).length,
      [PerformanceLevel.BELOW_AVERAGE]: industryPerformers.filter(p => p.performanceLevel === PerformanceLevel.BELOW_AVERAGE).length,
      [PerformanceLevel.POOR]: industryPerformers.filter(p => p.performanceLevel === PerformanceLevel.POOR).length
    };

    const topMetrics = this.calculateTopMetrics(industryMetrics);

    const benchmark: IndustryBenchmarks = {
      ...this.industryBenchmarks.get(industry)!,
      totalPerformers: industryPerformers.length,
      averagePerformanceScore: Math.round(averageScore),
      performanceLevelDistribution: distribution,
      topMetrics,
      lastAnalyzed: new Date().toISOString()
    };

    this.industryBenchmarks.set(industry, benchmark);
  }

  private calculateTopMetrics(metrics: PerformanceMetric[]) {
    const metricStats = new Map<PerformanceMetricType, { total: number, count: number, targets: number }>();

    metrics.forEach(metric => {
      if (!metricStats.has(metric.type)) {
        metricStats.set(metric.type, { total: 0, count: 0, targets: 0 });
      }
      const stats = metricStats.get(metric.type)!;
      stats.total += metric.value;
      stats.targets += metric.targetValue;
      stats.count += 1;
    });

    return Array.from(metricStats.entries())
      .map(([type, stats]) => ({
        metricType: type,
        averageValue: stats.count > 0 ? stats.total / stats.count : 0,
        bestPerformers: metrics.filter(m => m.type === type && (m.value / m.targetValue) >= 1.1).length,
        improvementOpportunity: metrics.filter(m => m.type === type && (m.value / m.targetValue) < 0.9).length
      }))
      .sort((a, b) => b.averageValue - a.averageValue)
      .slice(0, 5);
  }

  getPerformerMetrics(performerId: string): PerformanceMetric[] {
    const metricIds = this.performerMetricsIndex.get(performerId) || [];
    return metricIds
      .map(id => this.performanceMetrics.get(id))
      .filter((m): m is PerformanceMetric => !!m)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getPerformerProfile(performerId: string): PerformerProfile | undefined {
    return this.performerProfiles.get(performerId);
  }

  getIndustryBenchmarks(industry: Industry): IndustryBenchmarks | undefined {
    return this.industryBenchmarks.get(industry);
  }

  generateCrossIndustryComparison(industries?: Industry[]): CrossIndustryComparison {
    const compareIndustries = industries || Object.values(Industry);
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const performanceComparison = compareIndustries
      .map(industry => {
        const benchmark = this.industryBenchmarks.get(industry);
        const performers = Array.from(this.performerProfiles.values()).filter(p => p.industry === industry);

        return {
          industry,
          averageScore: benchmark?.averagePerformanceScore || 0,
          performerCount: performers.length,
          topPerformingMetrics: this.getTopPerformingMetrics(industry),
          rank: 0 // Will be calculated after sorting
        };
      })
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    const insights = {
      highestPerformingIndustry: performanceComparison[0]?.industry || Industry.SAAS,
      fastestImprovingIndustry: this.identifyFastestImprovingIndustry(compareIndustries),
      mostConsistentIndustry: this.identifyMostConsistentIndustry(compareIndustries),
      crossIndustryTrends: [
        'Increased focus on customer satisfaction',
        'Technology-driven efficiency improvements',
        'Data-driven decision making adoption'
      ],
      opportunityAreas: [
        'Cross-industry best practice sharing',
        'Technology standardization',
        'Performance metric alignment'
      ]
    };

    const recommendedBestPractices = this.generateCrossIndustryBestPractices(compareIndustries);

    return {
      industries: compareIndustries,
      comparisonPeriod: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      },
      performanceComparison,
      insights,
      recommendedBestPractices
    };
  }

  private getTopPerformingMetrics(industry: Industry): PerformanceMetricType[] {
    const benchmark = this.industryBenchmarks.get(industry);
    return benchmark?.topMetrics.slice(0, 3).map(m => m.metricType) || [];
  }

  private identifyFastestImprovingIndustry(industries: Industry[]): Industry {
    // Simplified - would need historical data for real implementation
    return industries[Math.floor(Math.random() * industries.length)];
  }

  private identifyMostConsistentIndustry(industries: Industry[]): Industry {
    // Simplified - would analyze variance in performance scores
    return industries[0];
  }

  private generateCrossIndustryBestPractices(industries: Industry[]) {
    return [
      {
        sourceIndustry: Industry.HEALTHCARE,
        applicableIndustries: [Industry.SAAS, Industry.FINTECH],
        practice: 'Patient-centered approach to customer service',
        expectedImpact: 'Improved customer satisfaction and retention'
      },
      {
        sourceIndustry: Industry.MANUFACTURING,
        applicableIndustries: [Industry.SAAS, Industry.HEALTHCARE],
        practice: 'Lean process optimization methodologies',
        expectedImpact: 'Increased operational efficiency and reduced waste'
      },
      {
        sourceIndustry: Industry.FINTECH,
        applicableIndustries: [Industry.HEALTHCARE, Industry.COLLEGE_CONSULTING],
        practice: 'Comprehensive compliance and risk management',
        expectedImpact: 'Enhanced regulatory adherence and risk mitigation'
      }
    ];
  }

  // Additional utility methods
  getTopPerformers(industry: Industry, limit: number = 10): PerformerProfile[] {
    return Array.from(this.performerProfiles.values())
      .filter(p => p.industry === industry)
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, limit);
  }

  searchPerformers(criteria: {
    industry?: Industry;
    performanceLevel?: PerformanceLevel;
    department?: string;
    minScore?: number;
    maxScore?: number;
  }): PerformerProfile[] {
    return Array.from(this.performerProfiles.values())
      .filter(performer => {
        if (criteria.industry && performer.industry !== criteria.industry) return false;
        if (criteria.performanceLevel && performer.performanceLevel !== criteria.performanceLevel) return false;
        if (criteria.department && performer.department !== criteria.department) return false;
        if (criteria.minScore && performer.overallScore < criteria.minScore) return false;
        if (criteria.maxScore && performer.overallScore > criteria.maxScore) return false;
        return true;
      })
      .sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Get filtered performance metrics
   */
  getMetrics(filters: {
    industry?: Industry;
    performerId?: string;
    metricType?: PerformanceMetricType;
    startDate?: Date;
    endDate?: Date;
  } = {}): PerformanceMetric[] {
    return Array.from(this.performanceMetrics.values())
      .filter(metric => {
        if (filters.industry && metric.industry !== filters.industry) return false;
        if (filters.performerId && metric.performerId !== filters.performerId) return false;
        if (filters.metricType && metric.type !== filters.metricType) return false;

        if (filters.startDate) {
          const metricDate = new Date(metric.createdAt);
          if (metricDate < filters.startDate) return false;
        }

        if (filters.endDate) {
          const metricDate = new Date(metric.createdAt);
          if (metricDate > filters.endDate) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get all performer profiles
   */
  getAllPerformerProfiles(): PerformerProfile[] {
    return Array.from(this.performerProfiles.values())
      .sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Get total metrics count
   */
  getTotalMetricsCount(): number {
    return this.performanceMetrics.size;
  }

  /**
   * Get metrics count by industry
   */
  getMetricsCountByIndustry(): Record<Industry, number> {
    const counts: Partial<Record<Industry, number>> = {};

    Object.values(Industry).forEach(industry => {
      const industryMetricIds = this.industryMetricsIndex.get(industry) || [];
      counts[industry] = industryMetricIds.length;
    });

    return counts as Record<Industry, number>;
  }

  /**
   * Get performer count by industry
   */
  getPerformerCountByIndustry(): Record<Industry, number> {
    const counts: Partial<Record<Industry, number>> = {};

    Object.values(Industry).forEach(industry => {
      const performers = Array.from(this.performerProfiles.values())
        .filter(p => p.industry === industry);
      counts[industry] = performers.length;
    });

    return counts as Record<Industry, number>;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStatistics(): {
    totalPerformers: number;
    totalMetrics: number;
    averagePerformanceScore: number;
    industryBreakdown: Record<Industry, {
      performers: number;
      metrics: number;
      averageScore: number;
    }>;
  } {
    const allProfiles = this.getAllPerformerProfiles();
    const totalPerformers = allProfiles.length;
    const totalMetrics = this.getTotalMetricsCount();
    const averagePerformanceScore = totalPerformers > 0
      ? allProfiles.reduce((sum, p) => sum + p.overallScore, 0) / totalPerformers
      : 0;

    const industryBreakdown: Partial<Record<Industry, any>> = {};

    Object.values(Industry).forEach(industry => {
      const industryPerformers = allProfiles.filter(p => p.industry === industry);
      const industryMetricsCount = (this.industryMetricsIndex.get(industry) || []).length;
      const industryAverageScore = industryPerformers.length > 0
        ? industryPerformers.reduce((sum, p) => sum + p.overallScore, 0) / industryPerformers.length
        : 0;

      industryBreakdown[industry] = {
        performers: industryPerformers.length,
        metrics: industryMetricsCount,
        averageScore: Math.round(industryAverageScore)
      };
    });

    return {
      totalPerformers,
      totalMetrics,
      averagePerformanceScore: Math.round(averagePerformanceScore),
      industryBreakdown: industryBreakdown as Record<Industry, any>
    };
  }
}

export default CrossIndustryPerformanceAnalyticsService;
