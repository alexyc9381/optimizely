import { EventEmitter } from 'events';

export enum Industry {
  SAAS = 'saas',
  MANUFACTURING = 'manufacturing',
  HEALTHCARE = 'healthcare',
  FINTECH = 'fintech',
  COLLEGE_CONSULTING = 'college_consulting'
}

export enum MarketType {
  // College Consulting
  COLLEGE_REGION = 'college_region',
  ACADEMIC_TIER = 'academic_tier',
  SCHOOL_SIZE = 'school_size',
  LOCATION_TYPE = 'location_type',
  CLIMATE_PREFERENCE = 'climate_preference',
  COST_TIER = 'cost_tier',

  // SaaS
  DEPLOYMENT_REGION = 'deployment_region',
  DATA_RESIDENCY = 'data_residency',
  COMPLIANCE_JURISDICTION = 'compliance_jurisdiction',
  CLOUD_PROVIDER = 'cloud_provider',
  MARKET_SEGMENT = 'market_segment',
  INTEGRATION_ECOSYSTEM = 'integration_ecosystem',

  // Manufacturing
  SUPPLIER_REGION = 'supplier_region',
  LOGISTICS_HUB = 'logistics_hub',
  REGULATORY_ZONE = 'regulatory_zone',
  TRADE_CORRIDOR = 'trade_corridor',
  MANUFACTURING_CLUSTER = 'manufacturing_cluster',
  SUPPLY_CHAIN_TIER = 'supply_chain_tier',

  // Healthcare
  PROVIDER_NETWORK = 'provider_network',
  REGULATORY_FRAMEWORK = 'regulatory_framework',
  PATIENT_DEMOGRAPHICS = 'patient_demographics',
  TREATMENT_SPECIALIZATION = 'treatment_specialization',
  PAYER_LANDSCAPE = 'payer_landscape',
  CARE_DELIVERY_MODEL = 'care_delivery_model',

  // FinTech
  REGULATORY_JURISDICTION = 'regulatory_jurisdiction',
  BANKING_INFRASTRUCTURE = 'banking_infrastructure',
  PAYMENT_ECOSYSTEM = 'payment_ecosystem',
  CURRENCY_ZONE = 'currency_zone',
  RISK_PROFILE_REGION = 'risk_profile_region',
  FINANCIAL_LITERACY_LEVEL = 'financial_literacy_level'
}

export enum PreferenceStrength {
  VERY_STRONG = 'very_strong',      // 90-100
  STRONG = 'strong',                // 70-89
  MODERATE = 'moderate',            // 50-69
  WEAK = 'weak',                    // 30-49
  VERY_WEAK = 'very_weak'           // 0-29
}

export interface GeographicLocation {
  country: string;
  region: string;
  state?: string;
  city?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
  marketSize: 'large' | 'medium' | 'small' | 'emerging';
  economicIndicators: {
    gdpPerCapita?: number;
    marketMaturity: 'mature' | 'developing' | 'emerging';
    regulatoryComplexity: 'high' | 'medium' | 'low';
  };
}

export interface MarketPreference {
  id: string;
  customerId: string;
  industry: Industry;
  marketType: MarketType;
  preferenceValue: string;
  preferenceScore: number; // 0-100
  preferenceStrength: PreferenceStrength;
  geographicLocation?: GeographicLocation;
  metadata: {
    source: 'explicit' | 'inferred' | 'behavioral';
    confidence: number; // 0-100
    lastUpdated: string;
    dataPoints: number;
    reasonCodes: string[];
  };
  industrySpecificData?: {
    // College Consulting
    acceptanceRate?: number;
    averageSAT?: number;
    tuitionRange?: { min: number; max: number };
    campusSize?: number;

    // SaaS
    deploymentModel?: 'cloud' | 'hybrid' | 'on-premise';
    scalabilityRequirements?: 'high' | 'medium' | 'low';
    integrationComplexity?: 'high' | 'medium' | 'low';

    // Manufacturing
    supplierReliability?: number; // 0-100
    logisticsCost?: number;
    qualityStandards?: string[];

    // Healthcare
    patientVolume?: number;
    specialtyFocus?: string[];
    payerMix?: { [payer: string]: number };

    // FinTech
    regulatoryCompliance?: string[];
    transactionVolume?: number;
    riskTolerance?: 'high' | 'medium' | 'low';
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MarketInsights {
  customerId: string;
  industry: Industry;
  topPreferences: MarketPreference[];
  geographicClusters: {
    region: string;
    preferenceCount: number;
    averageScore: number;
    dominantMarketTypes: MarketType[];
  }[];
  predictionModel: {
    likelyMarkets: {
      marketType: MarketType;
      value: string;
      probability: number;
      reasoning: string[];
    }[];
    riskFactors: string[];
    opportunities: string[];
  };
  benchmarks: {
    industryAverage: number;
    regionAverage: number;
    peerComparison: 'above' | 'average' | 'below';
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
    timeframe: string;
  }[];
}

export interface IndustryMarketAnalytics {
  industry: Industry;
  totalCustomers: number;
  totalPreferences: number;
  averagePreferenceScore: number;
  topMarketTypes: {
    marketType: MarketType;
    customerCount: number;
    averageScore: number;
    growthRate?: number;
  }[];
  geographicDistribution: {
    [region: string]: {
      customerCount: number;
      averageScore: number;
      topMarketTypes: MarketType[];
    };
  };
  trendAnalysis: {
    emergingMarkets: string[];
    decliningMarkets: string[];
    stableMarkets: string[];
    seasonalPatterns?: {
      quarter: string;
      preferenceShift: number;
    }[];
  };
  lastAnalyzed: string;
}

class GeographicMarketPreferenceAnalyticsService extends EventEmitter {
  private static _instance: GeographicMarketPreferenceAnalyticsService;
  private preferences: Map<string, MarketPreference> = new Map();
  private customerPreferencesIndex: Map<string, string[]> = new Map();
  private industryPreferencesIndex: Map<Industry, string[]> = new Map();
  private marketTypeIndex: Map<MarketType, string[]> = new Map();
  private geographicIndex: Map<string, string[]> = new Map();
  private analytics: Map<Industry, IndustryMarketAnalytics> = new Map();

  private constructor() {
    super();
    this.initializeIndustryConfigurations();
  }

  static getInstance(): GeographicMarketPreferenceAnalyticsService {
    if (!GeographicMarketPreferenceAnalyticsService._instance) {
      GeographicMarketPreferenceAnalyticsService._instance = new GeographicMarketPreferenceAnalyticsService();
    }
    return GeographicMarketPreferenceAnalyticsService._instance;
  }

  private initializeIndustryConfigurations(): void {
    // Initialize analytics for each industry
    Object.values(Industry).forEach(industry => {
      this.analytics.set(industry, {
        industry,
        totalCustomers: 0,
        totalPreferences: 0,
        averagePreferenceScore: 0,
        topMarketTypes: [],
        geographicDistribution: {},
        trendAnalysis: {
          emergingMarkets: [],
          decliningMarkets: [],
          stableMarkets: []
        },
        lastAnalyzed: new Date().toISOString()
      });
    });
  }

  async createMarketPreference(
    customerId: string,
    industry: Industry,
    marketType: MarketType,
    preferenceValue: string,
    options: {
      explicitScore?: number;
      geographicLocation?: GeographicLocation;
      source?: 'explicit' | 'inferred' | 'behavioral';
      metadata?: Partial<MarketPreference['metadata']>;
      industrySpecificData?: MarketPreference['industrySpecificData'];
      tags?: string[];
    } = {}
  ): Promise<MarketPreference> {
    // Validation
    if (!customerId?.trim()) {
      throw new Error('Customer ID is required');
    }

    if (!Object.values(Industry).includes(industry)) {
      throw new Error(`Invalid industry: ${industry}`);
    }

    if (!Object.values(MarketType).includes(marketType)) {
      throw new Error(`Invalid market type: ${marketType}`);
    }

    if (!preferenceValue?.trim()) {
      throw new Error('Preference value is required');
    }

    const preferenceId = `mp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate preference score if not explicitly provided
    const preferenceScore = options.explicitScore ??
      this.calculatePreferenceScore(industry, marketType, preferenceValue, options);

    const preferenceStrength = this.getPreferenceStrength(preferenceScore);

    const now = new Date().toISOString();

    const preference: MarketPreference = {
      id: preferenceId,
      customerId,
      industry,
      marketType,
      preferenceValue,
      preferenceScore,
      preferenceStrength,
      geographicLocation: options.geographicLocation,
      metadata: {
        source: options.source || 'explicit',
        confidence: options.metadata?.confidence || 85,
        lastUpdated: now,
        dataPoints: options.metadata?.dataPoints || 1,
        reasonCodes: options.metadata?.reasonCodes || []
      },
      industrySpecificData: options.industrySpecificData,
      tags: options.tags || [],
      createdAt: now,
      updatedAt: now
    };

    // Store preference
    this.preferences.set(preferenceId, preference);

    // Update indexes
    this.updateIndexes(preference);

    // Update analytics
    this.updateAnalytics(industry);

    // Emit event
    this.emit('marketPreferenceCreated', {
      preference,
      customerId,
      industry,
      marketType
    });

    return preference;
  }

  private calculatePreferenceScore(
    industry: Industry,
    marketType: MarketType,
    preferenceValue: string,
    options: any
  ): number {
    let baseScore = 75; // Default base score

    // Industry-specific scoring
    const industryMultipliers: Record<Industry, number> = {
      [Industry.HEALTHCARE]: 1.2,
      [Industry.FINTECH]: 1.15,
      [Industry.MANUFACTURING]: 1.1,
      [Industry.SAAS]: 1.05,
      [Industry.COLLEGE_CONSULTING]: 1.0
    };

    baseScore *= industryMultipliers[industry];

    // Market type importance
    const marketTypeWeights: Partial<Record<MarketType, number>> = {
      [MarketType.REGULATORY_JURISDICTION]: 1.3,
      [MarketType.COMPLIANCE_JURISDICTION]: 1.25,
      [MarketType.DATA_RESIDENCY]: 1.2,
      [MarketType.PROVIDER_NETWORK]: 1.2,
      [MarketType.COLLEGE_REGION]: 1.15,
      [MarketType.SUPPLIER_REGION]: 1.1
    };

    const weight = marketTypeWeights[marketType] || 1.0;
    baseScore *= weight;

    // Geographic location bonus
    if (options.geographicLocation) {
      const { marketSize, economicIndicators } = options.geographicLocation;

      if (marketSize === 'large') baseScore += 10;
      else if (marketSize === 'medium') baseScore += 5;
      else if (marketSize === 'emerging') baseScore += 15;

      if (economicIndicators.marketMaturity === 'mature') baseScore += 5;
      else if (economicIndicators.marketMaturity === 'emerging') baseScore += 10;
    }

    // Industry-specific data adjustments
    if (options.industrySpecificData) {
      const data = options.industrySpecificData;

      switch (industry) {
        case Industry.COLLEGE_CONSULTING:
          if (data.acceptanceRate && data.acceptanceRate < 0.2) baseScore += 15;
          if (data.averageSAT && data.averageSAT > 1400) baseScore += 10;
          break;
        case Industry.MANUFACTURING:
          if (data.supplierReliability && data.supplierReliability > 90) baseScore += 10;
          break;
        case Industry.HEALTHCARE:
          if (data.patientVolume && data.patientVolume > 10000) baseScore += 8;
          break;
        case Industry.FINTECH:
          if (data.riskTolerance === 'low') baseScore += 12;
          break;
        case Industry.SAAS:
          if (data.scalabilityRequirements === 'high') baseScore += 8;
          break;
      }
    }

    // Source confidence adjustment
    if (options.source === 'behavioral') baseScore *= 0.9;
    else if (options.source === 'inferred') baseScore *= 0.85;

    return Math.min(Math.max(Math.round(baseScore), 0), 100);
  }

  private getPreferenceStrength(score: number): PreferenceStrength {
    if (score >= 90) return PreferenceStrength.VERY_STRONG;
    if (score >= 70) return PreferenceStrength.STRONG;
    if (score >= 50) return PreferenceStrength.MODERATE;
    if (score >= 30) return PreferenceStrength.WEAK;
    return PreferenceStrength.VERY_WEAK;
  }

  private updateIndexes(preference: MarketPreference): void {
    const { id, customerId, industry, marketType, geographicLocation } = preference;

    // Customer index
    if (!this.customerPreferencesIndex.has(customerId)) {
      this.customerPreferencesIndex.set(customerId, []);
    }
    this.customerPreferencesIndex.get(customerId)!.push(id);

    // Industry index
    if (!this.industryPreferencesIndex.has(industry)) {
      this.industryPreferencesIndex.set(industry, []);
    }
    this.industryPreferencesIndex.get(industry)!.push(id);

    // Market type index
    if (!this.marketTypeIndex.has(marketType)) {
      this.marketTypeIndex.set(marketType, []);
    }
    this.marketTypeIndex.get(marketType)!.push(id);

    // Geographic index
    if (geographicLocation) {
      const geoKey = `${geographicLocation.country}_${geographicLocation.region}`;
      if (!this.geographicIndex.has(geoKey)) {
        this.geographicIndex.set(geoKey, []);
      }
      this.geographicIndex.get(geoKey)!.push(id);
    }
  }

  async updateMarketPreference(
    preferenceId: string,
    updates: Partial<MarketPreference>
  ): Promise<MarketPreference> {
    const preference = this.preferences.get(preferenceId);

    if (!preference) {
      throw new Error(`Market preference not found: ${preferenceId}`);
    }

    // Create updated preference
    const updatedPreference: MarketPreference = {
      ...preference,
      ...updates,
      id: preferenceId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
      metadata: {
        ...preference.metadata,
        ...updates.metadata,
        lastUpdated: new Date().toISOString()
      }
    };

    // Recalculate score if preference value changed
    if (updates.preferenceValue && updates.preferenceValue !== preference.preferenceValue) {
      updatedPreference.preferenceScore = this.calculatePreferenceScore(
        updatedPreference.industry,
        updatedPreference.marketType,
        updatedPreference.preferenceValue,
        updatedPreference
      );
      updatedPreference.preferenceStrength = this.getPreferenceStrength(updatedPreference.preferenceScore);
    }

    this.preferences.set(preferenceId, updatedPreference);
    this.updateAnalytics(updatedPreference.industry);

    this.emit('marketPreferenceUpdated', {
      preference: updatedPreference,
      previousPreference: preference,
      changes: updates
    });

    return updatedPreference;
  }

  getCustomerMarketPreferences(customerId: string): MarketPreference[] {
    const preferenceIds = this.customerPreferencesIndex.get(customerId) || [];
    return preferenceIds
      .map(id => this.preferences.get(id))
      .filter((p): p is MarketPreference => !!p)
      .sort((a, b) => b.preferenceScore - a.preferenceScore);
  }

  getIndustryMarketPreferences(industry: Industry): MarketPreference[] {
    const preferenceIds = this.industryPreferencesIndex.get(industry) || [];
    return preferenceIds
      .map(id => this.preferences.get(id))
      .filter((p): p is MarketPreference => !!p)
      .sort((a, b) => b.preferenceScore - a.preferenceScore);
  }

  getMarketPreference(preferenceId: string): MarketPreference | undefined {
    return this.preferences.get(preferenceId);
  }

  generateMarketInsights(customerId: string, industry?: Industry): MarketInsights {
    let customerPreferences = this.getCustomerMarketPreferences(customerId);

    if (industry) {
      customerPreferences = customerPreferences.filter(p => p.industry === industry);
    }

    if (customerPreferences.length === 0) {
      throw new Error(`No market preferences found for customer: ${customerId}`);
    }

    const primaryIndustry = industry || customerPreferences[0].industry;

    // Top preferences (highest scoring)
    const topPreferences = customerPreferences
      .filter(p => p.preferenceScore >= 70)
      .slice(0, 10);

    // Geographic clustering
    const geographicClusters = this.analyzeGeographicClusters(customerPreferences);

    // Prediction model
    const predictionModel = this.generatePredictionModel(customerPreferences, primaryIndustry);

    // Benchmarks
    const benchmarks = this.calculateBenchmarks(customerPreferences, primaryIndustry);

    // Recommendations
    const recommendations = this.generateRecommendations(customerPreferences, primaryIndustry);

    return {
      customerId,
      industry: primaryIndustry,
      topPreferences,
      geographicClusters,
      predictionModel,
      benchmarks,
      recommendations
    };
  }

  private analyzeGeographicClusters(preferences: MarketPreference[]) {
    const clusters = new Map<string, { preferences: MarketPreference[], totalScore: number }>();

    preferences.forEach(pref => {
      if (pref.geographicLocation) {
        const region = `${pref.geographicLocation.country}_${pref.geographicLocation.region}`;
        if (!clusters.has(region)) {
          clusters.set(region, { preferences: [], totalScore: 0 });
        }
        const cluster = clusters.get(region)!;
        cluster.preferences.push(pref);
        cluster.totalScore += pref.preferenceScore;
      }
    });

    return Array.from(clusters.entries())
      .map(([region, data]) => ({
        region,
        preferenceCount: data.preferences.length,
        averageScore: data.totalScore / data.preferences.length,
        dominantMarketTypes: this.getDominantMarketTypes(data.preferences)
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);
  }

  private getDominantMarketTypes(preferences: MarketPreference[]): MarketType[] {
    const typeCount = new Map<MarketType, number>();
    preferences.forEach(pref => {
      typeCount.set(pref.marketType, (typeCount.get(pref.marketType) || 0) + 1);
    });

    return Array.from(typeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
  }

  private generatePredictionModel(preferences: MarketPreference[], industry: Industry) {
    const marketTypeScores = new Map<MarketType, { total: number, count: number }>();

    preferences.forEach(pref => {
      if (!marketTypeScores.has(pref.marketType)) {
        marketTypeScores.set(pref.marketType, { total: 0, count: 0 });
      }
      const score = marketTypeScores.get(pref.marketType)!;
      score.total += pref.preferenceScore;
      score.count += 1;
    });

    const likelyMarkets = Array.from(marketTypeScores.entries())
      .map(([marketType, score]) => ({
        marketType,
        value: 'Predicted',
        probability: Math.min((score.total / score.count) / 100, 1),
        reasoning: [`Based on ${score.count} similar preferences`, `Average score: ${Math.round(score.total / score.count)}`]
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);

    return {
      likelyMarkets,
      riskFactors: this.identifyRiskFactors(preferences, industry),
      opportunities: this.identifyOpportunities(preferences, industry)
    };
  }

  private identifyRiskFactors(preferences: MarketPreference[], industry: Industry): string[] {
    const factors: string[] = [];

    const lowScorePrefs = preferences.filter(p => p.preferenceScore < 50);
    if (lowScorePrefs.length > preferences.length * 0.3) {
      factors.push('High percentage of weak preferences indicates market uncertainty');
    }

    const geographicDiversity = new Set(preferences.map(p =>
      p.geographicLocation ? `${p.geographicLocation.country}_${p.geographicLocation.region}` : 'unknown'
    )).size;

    if (geographicDiversity < 2) {
      factors.push('Limited geographic diversity may indicate market concentration risk');
    }

    return factors;
  }

  private identifyOpportunities(preferences: MarketPreference[], industry: Industry): string[] {
    const opportunities: string[] = [];

    const strongPrefs = preferences.filter(p => p.preferenceScore >= 80);
    if (strongPrefs.length > 0) {
      opportunities.push(`${strongPrefs.length} strong preferences indicate clear market direction`);
    }

    const emergingMarkets = preferences.filter(p =>
      p.geographicLocation?.economicIndicators.marketMaturity === 'emerging'
    );
    if (emergingMarkets.length > 0) {
      opportunities.push('Exposure to emerging markets provides growth potential');
    }

    return opportunities;
  }

  private calculateBenchmarks(preferences: MarketPreference[], industry: Industry) {
    const industryPrefs = this.getIndustryMarketPreferences(industry);
    const customerAvg = preferences.reduce((sum, p) => sum + p.preferenceScore, 0) / preferences.length;
    const industryAvg = industryPrefs.reduce((sum, p) => sum + p.preferenceScore, 0) / industryPrefs.length;

    let peerComparison: 'above' | 'average' | 'below' = 'average';
    if (customerAvg > industryAvg * 1.1) peerComparison = 'above';
    else if (customerAvg < industryAvg * 0.9) peerComparison = 'below';

    return {
      industryAverage: Math.round(industryAvg),
      regionAverage: Math.round(customerAvg), // Simplified
      peerComparison
    };
  }

  private generateRecommendations(preferences: MarketPreference[], industry: Industry) {
    const recommendations: MarketInsights['recommendations'] = [];

    // Low score recommendations
    const lowScorePrefs = preferences.filter(p => p.preferenceScore < 60);
    if (lowScorePrefs.length > 0) {
      recommendations.push({
        priority: 'high',
        action: `Review and strengthen ${lowScorePrefs.length} weak market preferences`,
        expectedImpact: 'Improved market positioning and selection accuracy',
        timeframe: '2-4 weeks'
      });
    }

    // Geographic expansion
    const geographicDiversity = new Set(preferences.map(p =>
      p.geographicLocation?.region
    )).size;

    if (geographicDiversity < 3) {
      recommendations.push({
        priority: 'medium',
        action: 'Consider expanding geographic market presence',
        expectedImpact: 'Reduced concentration risk and new growth opportunities',
        timeframe: '1-3 months'
      });
    }

    return recommendations;
  }

  private updateAnalytics(industry: Industry): void {
    const industryPrefs = this.getIndustryMarketPreferences(industry);
    const uniqueCustomers = new Set(industryPrefs.map(p => p.customerId)).size;

    const analytics: IndustryMarketAnalytics = {
      industry,
      totalCustomers: uniqueCustomers,
      totalPreferences: industryPrefs.length,
      averagePreferenceScore: industryPrefs.length > 0
        ? industryPrefs.reduce((sum, p) => sum + p.preferenceScore, 0) / industryPrefs.length
        : 0,
      topMarketTypes: this.calculateTopMarketTypes(industryPrefs),
      geographicDistribution: this.calculateGeographicDistribution(industryPrefs),
      trendAnalysis: {
        emergingMarkets: ['AI-powered regions', 'Sustainable markets'],
        decliningMarkets: ['Legacy infrastructure'],
        stableMarkets: ['Established enterprise markets']
      },
      lastAnalyzed: new Date().toISOString()
    };

    this.analytics.set(industry, analytics);
  }

  private calculateTopMarketTypes(preferences: MarketPreference[]) {
    const typeStats = new Map<MarketType, { count: number, totalScore: number }>();

    preferences.forEach(pref => {
      if (!typeStats.has(pref.marketType)) {
        typeStats.set(pref.marketType, { count: 0, totalScore: 0 });
      }
      const stats = typeStats.get(pref.marketType)!;
      stats.count += 1;
      stats.totalScore += pref.preferenceScore;
    });

    return Array.from(typeStats.entries())
      .map(([marketType, stats]) => ({
        marketType,
        customerCount: stats.count,
        averageScore: stats.totalScore / stats.count
      }))
      .sort((a, b) => b.customerCount - a.customerCount)
      .slice(0, 10);
  }

  private calculateGeographicDistribution(preferences: MarketPreference[]) {
    const distribution: IndustryMarketAnalytics['geographicDistribution'] = {};

    preferences.forEach(pref => {
      if (pref.geographicLocation) {
        const region = pref.geographicLocation.region;
        if (!distribution[region]) {
          distribution[region] = {
            customerCount: 0,
            averageScore: 0,
            topMarketTypes: []
          };
        }
        // Simplified calculation
        distribution[region].customerCount += 1;
      }
    });

    return distribution;
  }

  getIndustryAnalytics(industry: Industry): IndustryMarketAnalytics | undefined {
    return this.analytics.get(industry);
  }

  // Additional utility methods
  deleteMarketPreference(preferenceId: string): boolean {
    const preference = this.preferences.get(preferenceId);
    if (!preference) {
      return false;
    }

    // Remove from main storage
    this.preferences.delete(preferenceId);

    // Remove from indexes
    this.removeFromIndexes(preference);

    // Update analytics
    this.updateAnalytics(preference.industry);

    this.emit('marketPreferenceDeleted', {
      preferenceId,
      preference
    });

    return true;
  }

  private removeFromIndexes(preference: MarketPreference): void {
    const { id, customerId, industry, marketType, geographicLocation } = preference;

    // Customer index
    const customerIds = this.customerPreferencesIndex.get(customerId);
    if (customerIds) {
      const index = customerIds.indexOf(id);
      if (index > -1) customerIds.splice(index, 1);
    }

    // Industry index
    const industryIds = this.industryPreferencesIndex.get(industry);
    if (industryIds) {
      const index = industryIds.indexOf(id);
      if (index > -1) industryIds.splice(index, 1);
    }

    // Market type index
    const marketTypeIds = this.marketTypeIndex.get(marketType);
    if (marketTypeIds) {
      const index = marketTypeIds.indexOf(id);
      if (index > -1) marketTypeIds.splice(index, 1);
    }

    // Geographic index
    if (geographicLocation) {
      const geoKey = `${geographicLocation.country}_${geographicLocation.region}`;
      const geoIds = this.geographicIndex.get(geoKey);
      if (geoIds) {
        const index = geoIds.indexOf(id);
        if (index > -1) geoIds.splice(index, 1);
      }
    }
  }

  searchMarketPreferences(criteria: {
    industry?: Industry;
    marketType?: MarketType;
    minScore?: number;
    maxScore?: number;
    region?: string;
    preferenceStrength?: PreferenceStrength;
    tags?: string[];
  }): MarketPreference[] {
    return Array.from(this.preferences.values())
      .filter(pref => {
        if (criteria.industry && pref.industry !== criteria.industry) return false;
        if (criteria.marketType && pref.marketType !== criteria.marketType) return false;
        if (criteria.minScore && pref.preferenceScore < criteria.minScore) return false;
        if (criteria.maxScore && pref.preferenceScore > criteria.maxScore) return false;
        if (criteria.preferenceStrength && pref.preferenceStrength !== criteria.preferenceStrength) return false;
        if (criteria.region && pref.geographicLocation?.region !== criteria.region) return false;
        if (criteria.tags && !criteria.tags.some(tag => pref.tags.includes(tag))) return false;
        return true;
      })
      .sort((a, b) => b.preferenceScore - a.preferenceScore);
  }
}

export default GeographicMarketPreferenceAnalyticsService;
