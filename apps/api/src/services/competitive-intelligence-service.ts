import { PrismaClient } from '@prisma/client';
import { LeadData } from './ml-types';

// Competitive Intelligence Types
export interface CompetitorProfile {
  id: string;
  name: string;
  domain: string;
  industry: string;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  pricingTier: 'budget' | 'mid-market' | 'enterprise' | 'premium';
  targetSegments: string[];
  recentNews?: CompetitorNews[];
  fundingStatus?: FundingInfo;
  productFeatures: string[];
  customerCount?: number;
  revenue?: number;
  growthRate?: number;
}

export interface CompetitorNews {
  id: string;
  competitorId: string;
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  publishedAt: Date;
  source: string;
  category: 'funding' | 'product' | 'leadership' | 'partnership' | 'acquisition' | 'regulatory';
}

export interface FundingInfo {
  lastRound: 'seed' | 'series-a' | 'series-b' | 'series-c' | 'ipo' | 'acquired';
  amount: number;
  date: Date;
  investors: string[];
  valuation?: number;
}

export interface MarketPositioning {
  competitorId: string;
  vsOurSolution: {
    featureComparison: { [feature: string]: 'stronger' | 'weaker' | 'equal' };
    pricingAdvantage: 'higher' | 'lower' | 'competitive';
    brandStrength: number; // 0-100
    marketPresence: number; // 0-100
  };
  winProbability: number; // 0-1
  lossRiskFactors: string[];
  competitiveAdvantages: string[];
}

export interface CompetitiveContext {
  industry: string;
  companySize: string;
  budget?: number;
  decisionCriteria: string[];
  competitorsInPlay: string[];
  evaluationStage: 'research' | 'evaluation' | 'negotiation' | 'decision';
  timeframe: string;
}

export interface CompetitiveScoring {
  baseScore: number;
  competitiveAdjustment: number;
  finalScore: number;
  winProbability: number;
  riskFactors: string[];
  recommendations: string[];
  competitorThreat: 'low' | 'medium' | 'high' | 'critical';
  marketAdvantage: number; // -50 to +50 points
}

export interface CompetitiveLandscape {
  totalCompetitors: number;
  directCompetitors: CompetitorProfile[];
  indirectCompetitors: CompetitorProfile[];
  marketLeader: CompetitorProfile;
  emergingThreats: CompetitorProfile[];
  marketTrends: {
    growth: number;
    consolidation: boolean;
    newEntrants: number;
    priceCompression: boolean;
  };
}

export interface WinLossAnalysis {
  wins: {
    count: number;
    commonFactors: string[];
    avgDealSize: number;
    avgCycleTime: number;
    keyAdvantages: string[];
  };
  losses: {
    count: number;
    commonFactors: string[];
    avgDealSize: number;
    avgCycleTime: number;
    mainReasons: string[];
    lostToCompetitors: { [competitorId: string]: number };
  };
  winRate: number;
  insights: string[];
}

class CompetitiveIntelligenceService {
  private prisma: PrismaClient;
  private competitorDatabase: Map<string, CompetitorProfile>;
  private marketPositioning: Map<string, MarketPositioning>;
  private winLossHistory: WinLossAnalysis[];

  constructor() {
    this.prisma = new PrismaClient();
    this.competitorDatabase = new Map();
    this.marketPositioning = new Map();
    this.winLossHistory = [];
    this.initializeCompetitorDatabase();
  }

  /**
   * Initialize competitor database with known competitors across industries
   */
  private initializeCompetitorDatabase(): void {
    const competitors: CompetitorProfile[] = [
      // SaaS Analytics Competitors
      {
        id: 'google-analytics',
        name: 'Google Analytics',
        domain: 'analytics.google.com',
        industry: 'saas',
        marketShare: 0.35,
        strengths: ['Free tier', 'Google ecosystem integration', 'Massive scale'],
        weaknesses: ['Privacy concerns', 'Complex setup', 'Limited customization'],
        pricingTier: 'budget',
        targetSegments: ['SMB', 'Enterprise'],
        productFeatures: ['Web analytics', 'E-commerce tracking', 'Custom reports'],
        customerCount: 30000000,
        revenue: 147000000000,
        growthRate: 0.23
      },
      {
        id: 'adobe-analytics',
        name: 'Adobe Analytics',
        domain: 'business.adobe.com',
        industry: 'saas',
        marketShare: 0.15,
        strengths: ['Enterprise features', 'Attribution modeling', 'Real-time data'],
        weaknesses: ['High cost', 'Steep learning curve', 'Complex implementation'],
        pricingTier: 'enterprise',
        targetSegments: ['Enterprise', 'Large Mid-Market'],
        productFeatures: ['Advanced segmentation', 'Predictive analytics', 'Cross-device tracking'],
        customerCount: 150000,
        revenue: 4260000000,
        growthRate: 0.18
      },
      {
        id: 'mixpanel',
        name: 'Mixpanel',
        domain: 'mixpanel.com',
        industry: 'saas',
        marketShare: 0.08,
        strengths: ['Event tracking', 'User journey analysis', 'Mobile-first'],
        weaknesses: ['Limited marketing attribution', 'Pricing complexity', 'Data retention limits'],
        pricingTier: 'mid-market',
        targetSegments: ['SaaS', 'Mobile Apps', 'Mid-Market'],
        productFeatures: ['Event analytics', 'Cohort analysis', 'A/B testing'],
        customerCount: 26000,
        revenue: 77000000,
        growthRate: 0.32
      },
      {
        id: 'amplitude',
        name: 'Amplitude',
        domain: 'amplitude.com',
        industry: 'saas',
        marketShare: 0.06,
        strengths: ['Product analytics', 'Behavioral cohorts', 'Machine learning'],
        weaknesses: ['Limited marketing features', 'Data governance', 'Enterprise sales cycle'],
        pricingTier: 'mid-market',
        targetSegments: ['Product Teams', 'SaaS', 'Mobile'],
        productFeatures: ['Behavioral analytics', 'Predictive analytics', 'Experimentation'],
        customerCount: 1800,
        revenue: 45000000,
        growthRate: 0.85
      },

      // CRM Competitors
      {
        id: 'salesforce',
        name: 'Salesforce',
        domain: 'salesforce.com',
        industry: 'crm',
        marketShare: 0.23,
        strengths: ['Ecosystem', 'Customization', 'AI features'],
        weaknesses: ['Complexity', 'Cost', 'Learning curve'],
        pricingTier: 'enterprise',
        targetSegments: ['Enterprise', 'Large Mid-Market'],
        productFeatures: ['Sales automation', 'Marketing automation', 'Service cloud'],
        customerCount: 150000,
        revenue: 26492000000,
        growthRate: 0.24
      },
      {
        id: 'hubspot',
        name: 'HubSpot',
        domain: 'hubspot.com',
        industry: 'crm',
        marketShare: 0.12,
        strengths: ['Inbound marketing', 'Free tier', 'All-in-one platform'],
        weaknesses: ['Limited enterprise features', 'Reporting limitations', 'Integration challenges'],
        pricingTier: 'mid-market',
        targetSegments: ['SMB', 'Mid-Market', 'Marketing Teams'],
        productFeatures: ['Inbound marketing', 'Lead scoring', 'Email automation'],
        customerCount: 135000,
        revenue: 1731000000,
        growthRate: 0.32
      },

      // Marketing Automation Competitors
      {
        id: 'marketo',
        name: 'Marketo',
        domain: 'marketo.com',
        industry: 'marketing-automation',
        marketShare: 0.18,
        strengths: ['Lead management', 'Enterprise features', 'Adobe integration'],
        weaknesses: ['User interface', 'Reporting', 'Cost'],
        pricingTier: 'enterprise',
        targetSegments: ['Enterprise', 'B2B'],
        productFeatures: ['Lead nurturing', 'Account-based marketing', 'Revenue attribution'],
        customerCount: 6000,
        revenue: 400000000,
        growthRate: 0.15
      },
      {
        id: 'pardot',
        name: 'Pardot',
        domain: 'pardot.com',
        industry: 'marketing-automation',
        marketShare: 0.14,
        strengths: ['Salesforce integration', 'B2B focus', 'Lead qualification'],
        weaknesses: ['Limited B2C features', 'Complexity', 'Pricing'],
        pricingTier: 'enterprise',
        targetSegments: ['Enterprise B2B', 'Salesforce users'],
        productFeatures: ['Lead scoring', 'Email marketing', 'ROI reporting'],
        customerCount: 4500,
        revenue: 350000000,
        growthRate: 0.12
      }
    ];

    competitors.forEach(competitor => {
      this.competitorDatabase.set(competitor.id, competitor);
    });

    this.initializeMarketPositioning();
  }

  /**
   * Initialize market positioning data for our solution vs competitors
   */
  private initializeMarketPositioning(): void {
    const positioning: MarketPositioning[] = [
      {
        competitorId: 'google-analytics',
        vsOurSolution: {
          featureComparison: {
            'real-time-insights': 'stronger',
            'ai-powered-predictions': 'stronger',
            'revenue-attribution': 'stronger',
            'ease-of-use': 'stronger',
            'customization': 'stronger',
            'scale': 'weaker',
            'brand-recognition': 'weaker',
            'pricing': 'weaker'
          },
          pricingAdvantage: 'higher',
          brandStrength: 25,
          marketPresence: 15
        },
        winProbability: 0.72,
        lossRiskFactors: ['Brand recognition', 'Free tier availability', 'Google ecosystem lock-in'],
        competitiveAdvantages: ['AI-powered insights', 'Revenue focus', 'Ease of implementation', 'Real-time predictions']
      },
      {
        competitorId: 'adobe-analytics',
        vsOurSolution: {
          featureComparison: {
            'ease-of-use': 'stronger',
            'implementation-speed': 'stronger',
            'ai-predictions': 'stronger',
            'pricing': 'stronger',
            'enterprise-features': 'weaker',
            'data-processing': 'weaker',
            'attribution-modeling': 'equal'
          },
          pricingAdvantage: 'lower',
          brandStrength: 45,
          marketPresence: 35
        },
        winProbability: 0.68,
        lossRiskFactors: ['Enterprise feature depth', 'Implementation complexity preference', 'Adobe ecosystem'],
        competitiveAdvantages: ['Cost effectiveness', 'Faster implementation', 'Intuitive interface', 'AI-first approach']
      },
      {
        competitorId: 'mixpanel',
        vsOurSolution: {
          featureComparison: {
            'revenue-attribution': 'stronger',
            'business-intelligence': 'stronger',
            'lead-scoring': 'stronger',
            'event-tracking': 'weaker',
            'mobile-analytics': 'weaker',
            'real-time-data': 'equal'
          },
          pricingAdvantage: 'competitive',
          brandStrength: 65,
          marketPresence: 55
        },
        winProbability: 0.75,
        lossRiskFactors: ['Mobile-first requirements', 'Event tracking focus'],
        competitiveAdvantages: ['Revenue focus', 'Business intelligence', 'Lead scoring', 'Competitive pricing']
      },
      {
        competitorId: 'amplitude',
        vsOurSolution: {
          featureComparison: {
            'revenue-predictions': 'stronger',
            'sales-intelligence': 'stronger',
            'business-metrics': 'stronger',
            'product-analytics': 'weaker',
            'behavioral-cohorts': 'weaker',
            'experimentation': 'equal'
          },
          pricingAdvantage: 'competitive',
          brandStrength: 60,
          marketPresence: 50
        },
        winProbability: 0.78,
        lossRiskFactors: ['Product team focus', 'Behavioral analysis depth'],
        competitiveAdvantages: ['Revenue focus', 'Sales intelligence', 'Business outcomes', 'Implementation ease']
      },
      {
        competitorId: 'salesforce',
        vsOurSolution: {
          featureComparison: {
            'ease-of-use': 'stronger',
            'implementation-speed': 'stronger',
            'ai-insights': 'stronger',
            'pricing': 'stronger',
            'ecosystem': 'weaker',
            'customization': 'weaker',
            'enterprise-features': 'weaker'
          },
          pricingAdvantage: 'lower',
          brandStrength: 20,
          marketPresence: 10
        },
        winProbability: 0.42,
        lossRiskFactors: ['Ecosystem lock-in', 'Enterprise requirements', 'Brand preference', 'Existing investment'],
        competitiveAdvantages: ['Cost effectiveness', 'Ease of use', 'Quick implementation', 'AI-first design']
      },
      {
        competitorId: 'hubspot',
        vsOurSolution: {
          featureComparison: {
            'revenue-intelligence': 'stronger',
            'ai-predictions': 'stronger',
            'advanced-analytics': 'stronger',
            'inbound-marketing': 'weaker',
            'all-in-one': 'weaker',
            'content-management': 'weaker'
          },
          pricingAdvantage: 'competitive',
          brandStrength: 40,
          marketPresence: 30
        },
        winProbability: 0.65,
        lossRiskFactors: ['All-in-one preference', 'Inbound marketing focus', 'Free tier'],
        competitiveAdvantages: ['Advanced analytics', 'Revenue intelligence', 'AI predictions', 'Specialized focus']
      }
    ];

    positioning.forEach(pos => {
      this.marketPositioning.set(pos.competitorId, pos);
    });
  }

  /**
   * Analyze competitive landscape for a given lead
   */
  async analyzeCompetitiveLandscape(leadData: LeadData, context?: CompetitiveContext): Promise<CompetitiveLandscape> {
    const industry = leadData.firmographic?.industry || context?.industry || 'technology';
    const companySize = this.determineCompanySize(leadData);

    // Get relevant competitors
    const allCompetitors = Array.from(this.competitorDatabase.values());
    const directCompetitors = allCompetitors.filter(comp =>
      comp.industry === industry || comp.targetSegments.includes(companySize)
    );
    const indirectCompetitors = allCompetitors.filter(comp =>
      comp.industry !== industry && !comp.targetSegments.includes(companySize)
    ).slice(0, 3);

    // Determine market leader
    const marketLeader = directCompetitors.reduce((leader, comp) =>
      comp.marketShare > leader.marketShare ? comp : leader
    );

    // Identify emerging threats (high growth rate)
    const emergingThreats = directCompetitors
      .filter(comp => (comp.growthRate || 0) > 0.5)
      .sort((a, b) => (b.growthRate || 0) - (a.growthRate || 0))
      .slice(0, 2);

    return {
      totalCompetitors: allCompetitors.length,
      directCompetitors,
      indirectCompetitors,
      marketLeader,
      emergingThreats,
      marketTrends: {
        growth: this.calculateMarketGrowth(directCompetitors),
        consolidation: this.detectMarketConsolidation(directCompetitors),
        newEntrants: this.countNewEntrants(directCompetitors),
        priceCompression: this.detectPriceCompression(directCompetitors)
      }
    };
  }

  /**
   * Calculate competitive scoring adjustment for lead scoring
   */
  async calculateCompetitiveScoring(
    baseScore: number,
    leadData: LeadData,
    context?: CompetitiveContext
  ): Promise<CompetitiveScoring> {
    const landscape = await this.analyzeCompetitiveLandscape(leadData, context);
    const competitorsInPlay = context?.competitorsInPlay || [];

    let competitiveAdjustment = 0;
    let winProbability = 0.75; // Default win probability
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // Analyze each competitor in play
    for (const competitorId of competitorsInPlay) {
      const competitor = this.competitorDatabase.get(competitorId);
      const positioning = this.marketPositioning.get(competitorId);

      if (competitor && positioning) {
        // Adjust win probability based on competitor strength
        const competitorThreatLevel = this.assessCompetitorThreat(competitor, leadData);
        winProbability *= positioning.winProbability;

        // Competitive adjustment based on market positioning
        const marketAdvantage = this.calculateMarketAdvantage(positioning, leadData);
        competitiveAdjustment += marketAdvantage;

        // Add risk factors
        riskFactors.push(...positioning.lossRiskFactors);

        // Add recommendations
        recommendations.push(...this.generateCompetitiveRecommendations(competitor, positioning, leadData));
      }
    }

    // Market leader penalty if not us
    if (landscape.marketLeader && !competitorsInPlay.includes(landscape.marketLeader.id)) {
      competitiveAdjustment -= 5; // Market leader presence reduces our advantage
      riskFactors.push('Market leader presence');
    }

    // Emerging threat adjustment
    if (landscape.emergingThreats.some(threat => competitorsInPlay.includes(threat.id))) {
      competitiveAdjustment -= 3;
      riskFactors.push('Emerging competitor threat');
    }

    // Price compression market adjustment
    if (landscape.marketTrends.priceCompression) {
      competitiveAdjustment -= 2;
      riskFactors.push('Market price compression');
    }

    // Cap competitive adjustment
    competitiveAdjustment = Math.max(-20, Math.min(20, competitiveAdjustment));
    const finalScore = Math.max(0, Math.min(100, baseScore + competitiveAdjustment));

    const competitorThreat = this.determineCompetitorThreat(competitiveAdjustment, winProbability);

    return {
      baseScore,
      competitiveAdjustment,
      finalScore,
      winProbability,
      riskFactors: [...new Set(riskFactors)], // Remove duplicates
      recommendations: [...new Set(recommendations)],
      competitorThreat,
      marketAdvantage: competitiveAdjustment
    };
  }

  /**
   * Get competitive intelligence for specific competitors
   */
  async getCompetitorIntelligence(competitorIds: string[]): Promise<CompetitorProfile[]> {
    return competitorIds
      .map(id => this.competitorDatabase.get(id))
      .filter(Boolean) as CompetitorProfile[];
  }

  /**
   * Update competitive data from external sources
   */
  async updateCompetitiveData(competitorId: string, updates: Partial<CompetitorProfile>): Promise<void> {
    const existing = this.competitorDatabase.get(competitorId);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.competitorDatabase.set(competitorId, updated);
    }
  }

  /**
   * Add new competitor to database
   */
  async addCompetitor(competitor: CompetitorProfile): Promise<void> {
    this.competitorDatabase.set(competitor.id, competitor);
  }

  /**
   * Get win/loss analysis
   */
  async getWinLossAnalysis(industry?: string, timeframe?: string): Promise<WinLossAnalysis> {
    // This would typically query historical deal data
    // For now, return mock data based on competitive intelligence
    return {
      wins: {
        count: 127,
        commonFactors: ['Superior AI capabilities', 'Faster implementation', 'Better ROI demonstration', 'Responsive support'],
        avgDealSize: 125000,
        avgCycleTime: 45,
        keyAdvantages: ['Revenue intelligence', 'Ease of use', 'Quick time to value', 'Predictive insights']
      },
      losses: {
        count: 43,
        commonFactors: ['Brand preference', 'Existing vendor relationship', 'Budget constraints', 'Feature gaps'],
        avgDealSize: 95000,
        avgCycleTime: 67,
        mainReasons: ['Incumbent advantage', 'Price sensitivity', 'Enterprise feature requirements', 'Ecosystem lock-in'],
        lostToCompetitors: {
          'google-analytics': 15,
          'salesforce': 12,
          'adobe-analytics': 8,
          'hubspot': 5,
          'mixpanel': 3
        }
      },
      winRate: 0.747,
      insights: [
        'Strong win rate against mid-market competitors',
        'Struggle against enterprise incumbents',
        'AI capabilities are key differentiator',
        'Implementation speed wins deals',
        'Price sensitivity in SMB segment'
      ]
    };
  }

  /**
   * Monitor competitor news and updates
   */
  async monitorCompetitorNews(): Promise<CompetitorNews[]> {
    // This would integrate with news APIs and monitoring services
    // Return mock competitor news for demonstration
    return [
      {
        id: 'news-1',
        competitorId: 'mixpanel',
        title: 'Mixpanel raises $200M Series C',
        summary: 'Mixpanel announced a $200M Series C funding round led by Sequoia Capital to expand international presence and enterprise features.',
        sentiment: 'negative',
        impact: 'high',
        publishedAt: new Date('2024-01-15'),
        source: 'TechCrunch',
        category: 'funding'
      },
      {
        id: 'news-2',
        competitorId: 'amplitude',
        title: 'Amplitude launches new AI features',
        summary: 'Amplitude announced AI-powered behavioral predictions and automated insights in their latest product update.',
        sentiment: 'negative',
        impact: 'medium',
        publishedAt: new Date('2024-01-10'),
        source: 'Product Hunt',
        category: 'product'
      }
    ];
  }

  // Private helper methods

  private determineCompanySize(leadData: LeadData): string {
    const employees = leadData.firmographic?.employees || 0;
    if (employees < 50) return 'SMB';
    if (employees < 500) return 'Mid-Market';
    return 'Enterprise';
  }

  private calculateMarketGrowth(competitors: CompetitorProfile[]): number {
    const avgGrowth = competitors.reduce((sum, comp) => sum + (comp.growthRate || 0), 0) / competitors.length;
    return avgGrowth;
  }

  private detectMarketConsolidation(competitors: CompetitorProfile[]): boolean {
    // Simple heuristic: if top 3 competitors have >60% market share
    const topThree = competitors
      .sort((a, b) => b.marketShare - a.marketShare)
      .slice(0, 3);
    const topThreeShare = topThree.reduce((sum, comp) => sum + comp.marketShare, 0);
    return topThreeShare > 0.6;
  }

  private countNewEntrants(competitors: CompetitorProfile[]): number {
    // Mock calculation - would look at founding dates, funding rounds, etc.
    return Math.floor(competitors.length * 0.15);
  }

  private detectPriceCompression(competitors: CompetitorProfile[]): boolean {
    // Simple heuristic based on budget tier competitors
    const budgetCompetitors = competitors.filter(comp => comp.pricingTier === 'budget');
    return budgetCompetitors.length > competitors.length * 0.3;
  }

  private assessCompetitorThreat(competitor: CompetitorProfile, leadData: LeadData): 'low' | 'medium' | 'high' | 'critical' {
    const companySize = this.determineCompanySize(leadData);
    const isTargetSegment = competitor.targetSegments.includes(companySize);
    const marketShare = competitor.marketShare;
    const growth = competitor.growthRate || 0;

    if (marketShare > 0.2 && isTargetSegment) return 'critical';
    if (marketShare > 0.1 && isTargetSegment) return 'high';
    if (growth > 0.5 || isTargetSegment) return 'medium';
    return 'low';
  }

  private calculateMarketAdvantage(positioning: MarketPositioning, leadData: LeadData): number {
    let advantage = 0;

    // Feature comparison advantage
    const features = Object.values(positioning.vsOurSolution.featureComparison);
    const stronger = features.filter(f => f === 'stronger').length;
    const weaker = features.filter(f => f === 'weaker').length;
    advantage += (stronger - weaker) * 2;

    // Pricing advantage
    if (positioning.vsOurSolution.pricingAdvantage === 'lower') advantage += 3;
    if (positioning.vsOurSolution.pricingAdvantage === 'higher') advantage -= 2;

    // Brand and market presence penalty
    const brandPenalty = (100 - positioning.vsOurSolution.brandStrength) / 20;
    advantage -= brandPenalty;

    return Math.round(advantage);
  }

  private generateCompetitiveRecommendations(
    competitor: CompetitorProfile,
    positioning: MarketPositioning,
    leadData: LeadData
  ): string[] {
    const recommendations: string[] = [];
    const companySize = this.determineCompanySize(leadData);

    // Pricing recommendations
    if (positioning.vsOurSolution.pricingAdvantage === 'higher') {
      recommendations.push(`Emphasize ROI and value over ${competitor.name}'s lower cost`);
    }

    // Feature recommendations
    if (positioning.vsOurSolution.featureComparison['ai-powered-predictions'] === 'stronger') {
      recommendations.push(`Highlight AI prediction capabilities vs ${competitor.name}`);
    }

    // Target segment recommendations
    if (competitor.targetSegments.includes(companySize)) {
      recommendations.push(`Address ${competitor.name}'s ${companySize} market presence`);
    }

    // Competitive advantages
    recommendations.push(...positioning.competitiveAdvantages.map(adv =>
      `Leverage ${adv} advantage against ${competitor.name}`
    ));

    return recommendations;
  }

  private determineCompetitorThreat(adjustment: number, winProbability: number): 'low' | 'medium' | 'high' | 'critical' {
    if (adjustment < -10 || winProbability < 0.4) return 'critical';
    if (adjustment < -5 || winProbability < 0.6) return 'high';
    if (adjustment < 0 || winProbability < 0.8) return 'medium';
    return 'low';
  }

  /**
   * Get competitive insights for dashboard display
   */
  async getCompetitiveInsights(leadData: LeadData): Promise<{
    threats: string[];
    opportunities: string[];
    recommendations: string[];
    winProbability: number;
  }> {
    const landscape = await this.analyzeCompetitiveLandscape(leadData);
    const scoring = await this.calculateCompetitiveScoring(75, leadData); // Use 75 as base score

    return {
      threats: scoring.riskFactors,
      opportunities: [
        'AI-powered insights advantage',
        'Faster implementation vs competitors',
        'Revenue-focused analytics',
        'Cost-effective enterprise features'
      ],
      recommendations: scoring.recommendations,
      winProbability: scoring.winProbability
    };
  }
}

export default CompetitiveIntelligenceService;
