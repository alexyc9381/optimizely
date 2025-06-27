import { EventEmitter } from 'events';
import { Redis } from 'ioredis';

// =============================================================================
// INTERFACES & TYPES
// =============================================================================

export interface Competitor {
  id: string;
  name: string;
  description: string;
  website: string;
  headquarters: string;
  foundedYear: number;
  employeeCount: string;
  revenue: string;
  industries: string[];
  companySizes: string[];
  marketShare: number;
  threatLevel: 'low' | 'medium' | 'high';
  lastUpdate: string;
  keyProducts: string[];
  pricingModel: string;
  targetMarkets: string[];
  competitiveAdvantages: string[];
  weaknesses: string[];
}

export interface CompetitivePosition {
  competitorId: string;
  category: string;
  ranking: number;
  marketShare: number;
  strengthScore: number;
  weaknessScore: number;
  overallScore: number;
  lastUpdated: string;
}

export interface WinLossRecord {
  id: string;
  competitorId: string;
  opportunityId: string;
  dealSize: number;
  industry: string;
  companySize: string;
  outcome: 'won' | 'lost';
  winLossReason: string;
  salesCycle: number;
  lastUpdate: string;
  keyFactors: string[];
}

export interface MarketShareData {
  competitorId: string;
  segment: string;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastUpdate: string;
}

export interface Battlecard {
  id: string;
  competitorId: string;
  competitorName: string;
  lastUpdated: string;
  strengths: string[];
  weaknesses: string[];
  keyMessages: string[];
  objectionHandling: Array<{
    objection: string;
    response: string;
  }>;
  competitiveScenarios: string[];
}

export interface CompetitiveAlert {
  id: string;
  competitorId: string;
  type: 'pricing-change' | 'product-launch' | 'win-loss' | 'funding' | 'partnership';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
  actionRequired: boolean;
  relatedOpportunities: string[];
}

export interface CompetitiveIntelligenceData {
  competitors: Competitor[];
  competitivePositions: CompetitivePosition[];
  winLossRecords: WinLossRecord[];
  marketShareData: MarketShareData[];
  battlecards: Battlecard[];
  alerts: CompetitiveAlert[];
}

export interface CompetitiveFilters {
  competitorIds?: string[];
  industries?: string[];
  sizes?: string[];
  threatLevels?: string[];
  outcomes?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

// =============================================================================
// COMPETITIVE INTELLIGENCE SERVICE
// =============================================================================

export class CompetitiveIntelligenceService extends EventEmitter {
  private redis: Redis;
  private cachePrefix = 'competitive_intelligence';
  private cacheTTL = 600; // 10 minutes

  constructor(redis: Redis) {
    super();
    this.redis = redis;
  }

  /**
   * Get comprehensive competitive intelligence data
   */
  async getCompetitiveIntelligence(filters: CompetitiveFilters = {}): Promise<CompetitiveIntelligenceData> {
    const cacheKey = `${this.cachePrefix}:overview:${JSON.stringify(filters)}`;
    
    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Generate mock data (in production, this would query real data sources)
      const data: CompetitiveIntelligenceData = {
        competitors: await this.getCompetitors(filters),
        competitivePositions: await this.getCompetitivePositions(filters),
        winLossRecords: await this.getWinLossRecords(filters),
        marketShareData: await this.getMarketShareData(filters),
        battlecards: await this.getBattlecards(filters),
        alerts: await this.getCompetitiveAlerts(filters),
      };

      // Cache the result
      await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(data));

      // Emit event for analytics
      this.emit('competitiveIntelligenceUpdate', {
        timestamp: new Date().toISOString(),
        filtersApplied: filters,
        resultCount: {
          competitors: data.competitors.length,
          alerts: data.alerts.length,
          winLossRecords: data.winLossRecords.length,
        },
      });

      return data;
    } catch (error) {
      console.error('Error fetching competitive intelligence:', error);
      throw error;
    }
  }

  /**
   * Get competitor information
   */
  async getCompetitors(filters: CompetitiveFilters = {}): Promise<Competitor[]> {
    const cacheKey = `${this.cachePrefix}:competitors:${JSON.stringify(filters)}`;
    
    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Mock competitor data
      const allCompetitors: Competitor[] = [
        {
          id: 'comp_001',
          name: 'TechRival Corp',
          description: 'Leading competitor in A/B testing and optimization platforms',
          website: 'https://techrival.com',
          headquarters: 'San Francisco, CA',
          foundedYear: 2018,
          employeeCount: '200-500',
          revenue: '$50M-$100M',
          industries: ['Technology', 'SaaS', 'E-commerce'],
          companySizes: ['Enterprise', 'Mid-Market'],
          marketShare: 25.3,
          threatLevel: 'high',
          lastUpdate: new Date().toISOString(),
          keyProducts: ['TechTest Pro', 'OptimizeMax', 'ConversionAI'],
          pricingModel: 'Usage-based with enterprise tiers',
          targetMarkets: ['E-commerce', 'SaaS', 'Media'],
          competitiveAdvantages: [
            'Strong AI-powered testing capabilities',
            'Comprehensive analytics dashboard',
            'Enterprise-grade security',
            'Excellent customer support'
          ],
          weaknesses: [
            'Higher pricing than alternatives',
            'Complex setup for smaller teams',
            'Limited integration options'
          ]
        },
        {
          id: 'comp_002',
          name: 'OptimizeNow',
          description: 'Fast-growing optimization platform with focus on ease of use',
          website: 'https://optimizenow.io',
          headquarters: 'Austin, TX',
          foundedYear: 2020,
          employeeCount: '50-200',
          revenue: '$10M-$50M',
          industries: ['Technology', 'E-commerce', 'Marketing'],
          companySizes: ['SMB', 'Mid-Market'],
          marketShare: 18.7,
          threatLevel: 'medium',
          lastUpdate: new Date().toISOString(),
          keyProducts: ['QuickTest', 'EasyOptimize', 'Growth Suite'],
          pricingModel: 'Freemium with paid tiers',
          targetMarkets: ['SMB', 'Startups', 'Mid-Market'],
          competitiveAdvantages: [
            'User-friendly interface',
            'Quick setup and deployment',
            'Competitive pricing',
            'Strong community support'
          ],
          weaknesses: [
            'Limited enterprise features',
            'Fewer advanced analytics',
            'Smaller development team'
          ]
        },
        {
          id: 'comp_003',
          name: 'DataDriven Solutions',
          description: 'Enterprise-focused testing platform with advanced analytics',
          website: 'https://datadrivensolutions.com',
          headquarters: 'New York, NY',
          foundedYear: 2016,
          employeeCount: '500-1000',
          revenue: '$100M+',
          industries: ['Technology', 'Financial Services', 'Healthcare'],
          companySizes: ['Enterprise'],
          marketShare: 31.2,
          threatLevel: 'high',
          lastUpdate: new Date().toISOString(),
          keyProducts: ['Enterprise Test Suite', 'Analytics Pro', 'Compliance Manager'],
          pricingModel: 'Enterprise licensing with custom pricing',
          targetMarkets: ['Fortune 500', 'Financial Services', 'Healthcare'],
          competitiveAdvantages: [
            'Robust enterprise features',
            'Advanced compliance capabilities',
            'Proven at scale',
            'Strong technical support'
          ],
          weaknesses: [
            'Very high pricing',
            'Complex implementation',
            'Slow feature releases'
          ]
        }
      ];

      // Apply filters
      let filteredCompetitors = allCompetitors;

      if (filters.competitorIds) {
        filteredCompetitors = filteredCompetitors.filter(comp => 
          filters.competitorIds!.includes(comp.id)
        );
      }

      if (filters.industries) {
        filteredCompetitors = filteredCompetitors.filter(comp =>
          comp.industries.some(industry => filters.industries!.includes(industry))
        );
      }

      if (filters.sizes) {
        filteredCompetitors = filteredCompetitors.filter(comp =>
          comp.companySizes.some(size => filters.sizes!.includes(size))
        );
      }

      if (filters.threatLevels) {
        filteredCompetitors = filteredCompetitors.filter(comp =>
          filters.threatLevels!.includes(comp.threatLevel)
        );
      }

      // Cache the result
      await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(filteredCompetitors));

      return filteredCompetitors;
    } catch (error) {
      console.error('Error fetching competitors:', error);
      throw error;
    }
  }

  /**
   * Get competitive positions
   */
  async getCompetitivePositions(filters: CompetitiveFilters = {}): Promise<CompetitivePosition[]> {
    // Mock competitive position data
    const positions: CompetitivePosition[] = [
      {
        competitorId: 'comp_001',
        category: 'Feature Completeness',
        ranking: 2,
        marketShare: 25.3,
        strengthScore: 8.5,
        weaknessScore: 3.2,
        overallScore: 7.8,
        lastUpdated: new Date().toISOString(),
      },
      {
        competitorId: 'comp_002',
        category: 'Ease of Use',
        ranking: 1,
        marketShare: 18.7,
        strengthScore: 9.2,
        weaknessScore: 2.1,
        overallScore: 8.3,
        lastUpdated: new Date().toISOString(),
      },
      {
        competitorId: 'comp_003',
        category: 'Enterprise Features',
        ranking: 1,
        marketShare: 31.2,
        strengthScore: 9.5,
        weaknessScore: 4.1,
        overallScore: 8.7,
        lastUpdated: new Date().toISOString(),
      },
    ];

    return positions;
  }

  /**
   * Get win/loss records
   */
  async getWinLossRecords(filters: CompetitiveFilters = {}): Promise<WinLossRecord[]> {
    // Mock win/loss data
    const records: WinLossRecord[] = [];
    
    // Generate 50 mock records
    for (let i = 1; i <= 50; i++) {
      const competitorIds = ['comp_001', 'comp_002', 'comp_003'];
      const outcomes: ('won' | 'lost')[] = ['won', 'lost'];
      const industries = ['Technology', 'E-commerce', 'Healthcare', 'Financial Services'];
      const companySizes = ['SMB', 'Mid-Market', 'Enterprise'];
      
      records.push({
        id: `wl_${i.toString().padStart(3, '0')}`,
        competitorId: competitorIds[Math.floor(Math.random() * competitorIds.length)],
        opportunityId: `opp_${i.toString().padStart(3, '0')}`,
        dealSize: Math.floor(Math.random() * 500000) + 10000,
        industry: industries[Math.floor(Math.random() * industries.length)],
        companySize: companySizes[Math.floor(Math.random() * companySizes.length)],
        outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
        winLossReason: Math.random() > 0.5 ? 'Better pricing and features' : 'Competitor had stronger enterprise support',
        salesCycle: Math.floor(Math.random() * 180) + 30,
        lastUpdate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        keyFactors: ['Pricing', 'Features', 'Support', 'Implementation'].slice(0, Math.floor(Math.random() * 3) + 1),
      });
    }

    // Apply outcome filter
    if (filters.outcomes) {
      return records.filter(record => filters.outcomes!.includes(record.outcome));
    }

    return records;
  }

  /**
   * Get market share data
   */
  async getMarketShareData(filters: CompetitiveFilters = {}): Promise<MarketShareData[]> {
    // Mock market share data
    const marketShare: MarketShareData[] = [
      {
        competitorId: 'comp_001',
        segment: 'E-commerce',
        percentage: 28.5,
        trend: 'increasing',
        lastUpdate: new Date().toISOString(),
      },
      {
        competitorId: 'comp_002',
        segment: 'SMB',
        percentage: 35.2,
        trend: 'stable',
        lastUpdate: new Date().toISOString(),
      },
      {
        competitorId: 'comp_003',
        segment: 'Enterprise',
        percentage: 42.1,
        trend: 'decreasing',
        lastUpdate: new Date().toISOString(),
      },
    ];

    return marketShare;
  }

  /**
   * Get battlecards
   */
  async getBattlecards(filters: CompetitiveFilters = {}): Promise<Battlecard[]> {
    // Mock battlecard data
    const battlecards: Battlecard[] = [
      {
        id: 'bc_001',
        competitorId: 'comp_001',
        competitorName: 'TechRival Corp',
        lastUpdated: new Date().toISOString(),
        strengths: [
          'Advanced AI-powered testing algorithms',
          'Comprehensive analytics and reporting',
          'Strong enterprise security features',
          'Proven scalability for high-traffic sites'
        ],
        weaknesses: [
          'Higher price point than alternatives',
          'Complex setup process',
          'Limited integration options',
          'Steep learning curve for new users'
        ],
        keyMessages: [
          'While TechRival offers robust features, our platform provides better value with easier implementation',
          'Our superior customer support and faster time-to-value give us a competitive edge',
          'We offer more flexible pricing options suitable for growing businesses'
        ],
        objectionHandling: [
          {
            objection: 'TechRival has more advanced AI features',
            response: 'Our AI is specifically optimized for practical business outcomes, not just technical complexity'
          },
          {
            objection: 'They have better enterprise security',
            response: 'We meet the same security standards with additional compliance certifications'
          }
        ],
        competitiveScenarios: ['Enterprise RFP', 'Technical evaluation', 'Price-sensitive prospects']
      },
      {
        id: 'bc_002',
        competitorId: 'comp_002',
        competitorName: 'OptimizeNow',
        lastUpdated: new Date().toISOString(),
        strengths: [
          'User-friendly interface',
          'Quick implementation',
          'Competitive pricing',
          'Good for small to medium businesses'
        ],
        weaknesses: [
          'Limited enterprise features',
          'Basic analytics capabilities',
          'Smaller development team',
          'Less proven at scale'
        ],
        keyMessages: [
          'While OptimizeNow is easy to use, we provide enterprise-grade capabilities they cannot match',
          'Our advanced analytics give you deeper insights into user behavior',
          'We offer better long-term value as your business grows'
        ],
        objectionHandling: [
          {
            objection: 'OptimizeNow is easier to set up',
            response: 'Our setup process is streamlined, and we provide dedicated onboarding support'
          },
          {
            objection: 'They have better pricing for small businesses',
            response: 'Our pricing scales with your growth, providing better long-term value'
          }
        ],
        competitiveScenarios: ['SMB prospects', 'Budget-conscious customers', 'Quick deployment needs']
      }
    ];

    // Apply competitorIds filter
    if (filters.competitorIds) {
      return battlecards.filter(card => filters.competitorIds!.includes(card.competitorId));
    }

    return battlecards;
  }

  /**
   * Get competitive alerts
   */
  async getCompetitiveAlerts(filters: CompetitiveFilters = {}): Promise<CompetitiveAlert[]> {
    // Mock alert data
    const alerts: CompetitiveAlert[] = [
      {
        id: 'alert_001',
        competitorId: 'comp_001',
        type: 'pricing-change',
        severity: 'high',
        title: 'TechRival Corp reduces enterprise pricing by 15%',
        description: 'Significant price reduction on enterprise plans, may impact our competitive position',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        acknowledged: false,
        actionRequired: true,
        relatedOpportunities: ['opp_123', 'opp_456']
      },
      {
        id: 'alert_002',
        competitorId: 'comp_002',
        type: 'product-launch',
        severity: 'medium',
        title: 'OptimizeNow launches new AI features',
        description: 'New machine learning capabilities for automatic test optimization',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        acknowledged: true,
        actionRequired: false,
        relatedOpportunities: []
      },
      {
        id: 'alert_003',
        competitorId: 'comp_003',
        type: 'win-loss',
        severity: 'critical',
        title: 'Lost major enterprise deal to DataDriven Solutions',
        description: 'Lost $2M annual contract due to superior compliance features',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        acknowledged: false,
        actionRequired: true,
        relatedOpportunities: ['opp_789']
      }
    ];

    // Apply filters
    let filteredAlerts = alerts;

    if (filters.competitorIds) {
      filteredAlerts = filteredAlerts.filter(alert => 
        filters.competitorIds!.includes(alert.competitorId)
      );
    }

    return filteredAlerts;
  }

  /**
   * Analyze competitive threats
   */
  async analyzeCompetitiveThreats(): Promise<any> {
    const competitors = await this.getCompetitors();
    const winLossRecords = await this.getWinLossRecords();
    
    const analysis = {
      highThreatCompetitors: competitors.filter(c => c.threatLevel === 'high'),
      recentLosses: winLossRecords.filter(r => 
        r.outcome === 'lost' && 
        new Date(r.lastUpdate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ),
      marketShareTrends: await this.getMarketShareData(),
    };

    this.emit('threatAnalysis', analysis);
    return analysis;
  }

  /**
   * Get competitive insights
   */
  async getCompetitiveInsights(): Promise<any> {
    const data = await this.getCompetitiveIntelligence();
    
    const insights = {
      totalCompetitors: data.competitors.length,
      highThreatCount: data.competitors.filter(c => c.threatLevel === 'high').length,
      winRate: data.winLossRecords.length > 0 
        ? (data.winLossRecords.filter(r => r.outcome === 'won').length / data.winLossRecords.length) * 100
        : 0,
      activeAlerts: data.alerts.filter(a => !a.acknowledged).length,
      marketCoverage: data.marketShareData.reduce((sum, share) => sum + share.percentage, 0),
    };

    return insights;
  }
}

export default CompetitiveIntelligenceService;
