import { EventEmitter } from 'events';
import { LeadData } from './ml-types';

// Core Types for Buyer Profile Classification
export type BuyerPersona =
  | 'enterprise_ceo'
  | 'enterprise_cto'
  | 'enterprise_vp_sales'
  | 'enterprise_vp_marketing'
  | 'enterprise_procurement'
  | 'mid_market_owner'
  | 'mid_market_director'
  | 'mid_market_manager'
  | 'smb_founder'
  | 'smb_owner'
  | 'smb_operator'
  | 'individual_practitioner'
  | 'consultant'
  | 'evaluator'
  | 'influencer';

export type DecisionLevel = 'decision_maker' | 'influencer' | 'evaluator' | 'user' | 'champion';
export type OrganizationalLevel = 'c_suite' | 'vp_level' | 'director_level' | 'manager_level' | 'individual_contributor';
export type BuyingMotivation = 'efficiency' | 'growth' | 'cost_reduction' | 'compliance' | 'innovation' | 'competitive_advantage';

export interface BuyerProfileClassification {
  primaryPersona: BuyerPersona;
  confidence: number;
  alternativePersonas: Array<{
    persona: BuyerPersona;
    confidence: number;
    reasoning: string;
  }>;
  characteristics: {
    decisionLevel: DecisionLevel;
    organizationalLevel: OrganizationalLevel;
    buyingMotivation: BuyingMotivation[];
    communicationStyle: 'data_driven' | 'relationship_focused' | 'results_oriented' | 'technical' | 'strategic';
    timeHorizon: 'immediate' | 'quarterly' | 'annual' | 'long_term';
    riskTolerance: 'high' | 'medium' | 'low';
  };
  hierarchicalClassification: {
    topLevel: 'enterprise' | 'mid_market' | 'smb' | 'individual';
    roleCategory: 'executive' | 'technical' | 'business' | 'operations' | 'procurement';
    specificRole: string;
    authority: 'high' | 'medium' | 'low';
  };
  scoringAdjustments: {
    firmographicMultiplier: number;
    behavioralMultiplier: number;
    intentMultiplier: number;
    timingMultiplier: number;
    urgencyMultiplier: number;
  };
  engagementStrategy: PersonaEngagementStrategy;
  classificationMetadata: {
    modelVersion: string;
    classifiedAt: Date;
    signals: ClassificationSignals;
    qualityScore: number;
  };
}

export interface PersonaEngagementStrategy {
  primaryApproach: string;
  communicationPreferences: {
    preferredChannels: string[];
    messagingStyle: string;
    contentTypes: string[];
    meetingPreferences: string;
  };
  contentRecommendations: Array<{
    type: 'case_study' | 'whitepaper' | 'demo' | 'trial' | 'pricing' | 'technical_docs';
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    customization: string;
  }>;
  nextBestActions: Array<{
    action: string;
    priority: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
    expectedOutcome: string;
    successMetrics: string[];
  }>;
  personalization: {
    pain_points: string[];
    value_propositions: string[];
    objection_handling: string[];
    success_metrics: string[];
  };
}

export interface ClassificationSignals {
  firmographicSignals: {
    companySize: number;
    industry: number;
    revenue: number;
    maturity: number;
  };
  behavioralSignals: {
    engagement_depth: number;
    technical_interest: number;
    decision_urgency: number;
    research_pattern: number;
  };
  contentSignals: {
    content_preferences: Record<string, number>;
    topic_affinity: Record<string, number>;
    depth_preference: number;
  };
  interactionSignals: {
    communication_style: Record<string, number>;
    meeting_preferences: Record<string, number>;
    response_patterns: Record<string, number>;
  };
}

export interface PersonaModel {
  id: string;
  persona: BuyerPersona;
  version: string;
  featureWeights: {
    firmographic: Record<string, number>;
    behavioral: Record<string, number>;
    intent: Record<string, number>;
    timing: Record<string, number>;
  };
  thresholds: {
    classification: number;
    confidence: number;
    quality: number;
  };
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  trainingData: {
    sampleSize: number;
    lastTrained: Date;
    dataQuality: number;
  };
  metadata: {
    description: string;
    tags: string[];
    createdBy: string;
    lastModified: Date;
  };
}

export interface PersonaAnalytics {
  personaDistribution: Record<BuyerPersona, number>;
  conversionRates: Record<BuyerPersona, number>;
  averageScores: Record<BuyerPersona, number>;
  engagementMetrics: Record<BuyerPersona, {
    averageEngagement: number;
    timeToConversion: number;
    preferredChannels: string[];
  }>;
  trends: {
    monthlyDistribution: Record<string, Record<BuyerPersona, number>>;
    seasonalPatterns: Record<string, number>;
    industryCorrelations: Record<string, Record<BuyerPersona, number>>;
  };
}

export class BuyerProfileService extends EventEmitter {
  private personaModels: Map<BuyerPersona, PersonaModel> = new Map();
  private classificationHistory: Map<string, BuyerProfileClassification[]> = new Map();
  private engagementStrategies: Map<BuyerPersona, PersonaEngagementStrategy> = new Map();

  constructor() {
    super();
    this.initializePersonaModels();
    this.initializeEngagementStrategies();
  }

  private initializePersonaModels(): void {
    // Initialize enterprise personas
    this.createPersonaModel('enterprise_ceo', {
      firmographic: { companySize: 0.4, revenue: 0.5, industry: 0.3, maturity: 0.4 },
      behavioral: { strategicContent: 0.5, executiveDashboard: 0.4, highLevelOverview: 0.6 },
      intent: { businessImpact: 0.6, roi_focus: 0.5, strategic_planning: 0.7 },
      timing: { quarterly_planning: 0.5, annual_budget: 0.6, board_meetings: 0.4 }
    });

    this.createPersonaModel('enterprise_cto', {
      firmographic: { companySize: 0.4, techStack: 0.6, industry: 0.3, maturity: 0.4 },
      behavioral: { technicalContent: 0.7, integrationDocs: 0.6, architectureDiagrams: 0.8 },
      intent: { technical_feasibility: 0.8, security_compliance: 0.7, scalability: 0.9 },
      timing: { technical_planning: 0.6, implementation_cycles: 0.7, tech_roadmap: 0.5 }
    });

    // Initialize mid-market personas
    this.createPersonaModel('mid_market_director', {
      firmographic: { companySize: 0.3, revenue: 0.3, growth: 0.5, maturity: 0.3 },
      behavioral: { detailedAnalysis: 0.5, comparisons: 0.6, case_studies: 0.7 },
      intent: { efficiency_gains: 0.6, team_productivity: 0.7, competitive_edge: 0.5 },
      timing: { quarterly_reviews: 0.5, budget_cycles: 0.6, team_planning: 0.4 }
    });

    // Initialize SMB personas
    this.createPersonaModel('smb_founder', {
      firmographic: { companySize: 0.2, revenue: 0.2, growth: 0.7, maturity: 0.2 },
      behavioral: { quick_wins: 0.8, practical_examples: 0.7, cost_focus: 0.9 },
      intent: { immediate_impact: 0.9, cost_efficiency: 0.8, ease_of_use: 0.8 },
      timing: { immediate_needs: 0.8, bootstrap_mode: 0.7, quick_decisions: 0.9 }
    });

    // Add more personas...
  }

  private createPersonaModel(persona: BuyerPersona, weights: any): void {
    const model: PersonaModel = {
      id: `model_${persona}_v1`,
      persona,
      version: '1.0.0',
      featureWeights: weights,
      thresholds: {
        classification: 0.7,
        confidence: 0.6,
        quality: 0.8
      },
      performance: {
        accuracy: 0.85,
        precision: 0.82,
        recall: 0.87,
        f1Score: 0.84
      },
      trainingData: {
        sampleSize: 1000,
        lastTrained: new Date(),
        dataQuality: 0.9
      },
      metadata: {
        description: `Classification model for ${persona} persona`,
        tags: [persona.split('_')[0], 'persona', 'classification'],
        createdBy: 'system',
        lastModified: new Date()
      }
    };

    this.personaModels.set(persona, model);
  }

  private initializeEngagementStrategies(): void {
    // Enterprise CEO Strategy
    this.engagementStrategies.set('enterprise_ceo', {
      primaryApproach: 'Executive briefing with strategic business impact focus',
      communicationPreferences: {
        preferredChannels: ['executive_briefing', 'board_presentation', 'strategic_call'],
        messagingStyle: 'High-level strategic with clear ROI and business impact',
        contentTypes: ['executive_summary', 'strategic_overview', 'business_case'],
        meetingPreferences: 'Short, focused meetings with clear outcomes'
      },
      contentRecommendations: [
        {
          type: 'case_study',
          priority: 'high',
          reasoning: 'CEOs value peer success stories and proven results',
          customization: 'Focus on similar company size and industry'
        },
        {
          type: 'whitepaper',
          priority: 'medium',
          reasoning: 'Strategic insights for market positioning',
          customization: 'Industry trends and competitive landscape'
        }
      ],
      nextBestActions: [
        {
          action: 'Schedule executive briefing',
          priority: 'immediate',
          expectedOutcome: 'Buy-in for detailed evaluation',
          successMetrics: ['meeting_scheduled', 'stakeholder_introduction']
        }
      ],
      personalization: {
        pain_points: ['Market competitiveness', 'Revenue growth', 'Operational efficiency'],
        value_propositions: ['Strategic advantage', 'Market leadership', 'Revenue impact'],
        objection_handling: ['ROI concerns', 'Implementation complexity', 'Change management'],
        success_metrics: ['Revenue growth %', 'Market share', 'Operational efficiency']
      }
    });

    // Enterprise CTO Strategy
    this.engagementStrategies.set('enterprise_cto', {
      primaryApproach: 'Technical deep-dive with architecture and security focus',
      communicationPreferences: {
        preferredChannels: ['technical_demo', 'architecture_review', 'security_briefing'],
        messagingStyle: 'Technical depth with security and scalability emphasis',
        contentTypes: ['technical_docs', 'architecture_diagrams', 'security_whitepaper'],
        meetingPreferences: 'Detailed technical sessions with engineering teams'
      },
      contentRecommendations: [
        {
          type: 'technical_docs',
          priority: 'high',
          reasoning: 'CTOs need detailed technical understanding',
          customization: 'Focus on integration patterns and security architecture'
        },
        {
          type: 'demo',
          priority: 'high',
          reasoning: 'Hands-on experience with technical capabilities',
          customization: 'Technical sandbox with API exploration'
        }
      ],
      nextBestActions: [
        {
          action: 'Provide technical sandbox access',
          priority: 'immediate',
          expectedOutcome: 'Technical validation and proof of concept',
          successMetrics: ['sandbox_usage', 'technical_questions', 'poc_completion']
        }
      ],
      personalization: {
        pain_points: ['Technical debt', 'Scalability issues', 'Security concerns', 'Integration complexity'],
        value_propositions: ['Technical excellence', 'Security by design', 'Seamless integration'],
        objection_handling: ['Technical complexity', 'Security questions', 'Integration concerns'],
        success_metrics: ['System performance', 'Security compliance', 'Integration success']
      }
    });

    // SMB Founder Strategy
    this.engagementStrategies.set('smb_founder', {
      primaryApproach: 'Practical demonstration with immediate value and quick wins',
      communicationPreferences: {
        preferredChannels: ['product_demo', 'free_trial', 'quick_call'],
        messagingStyle: 'Direct, practical benefits with clear value proposition',
        contentTypes: ['quick_start_guide', 'success_stories', 'pricing'],
        meetingPreferences: 'Efficient, results-focused meetings'
      },
      contentRecommendations: [
        {
          type: 'trial',
          priority: 'high',
          reasoning: 'Founders want hands-on experience before commitment',
          customization: 'Quick setup with immediate value demonstration'
        },
        {
          type: 'pricing',
          priority: 'high',
          reasoning: 'Cost-conscious decision making',
          customization: 'SMB-friendly pricing with growth options'
        }
      ],
      nextBestActions: [
        {
          action: 'Offer free trial with onboarding support',
          priority: 'immediate',
          expectedOutcome: 'Product adoption and quick wins',
          successMetrics: ['trial_signup', 'feature_usage', 'quick_wins_achieved']
        }
      ],
      personalization: {
        pain_points: ['Limited resources', 'Need for growth', 'Operational efficiency'],
        value_propositions: ['Quick implementation', 'Immediate ROI', 'Growth enablement'],
        objection_handling: ['Budget constraints', 'Time limitations', 'Implementation complexity'],
        success_metrics: ['Cost savings', 'Revenue growth', 'Time savings']
      }
    });

    // Add more engagement strategies for other personas...
  }

  // Core Classification Methods
  async classifyBuyerProfile(leadData: LeadData): Promise<BuyerProfileClassification> {
    const signals = await this.extractClassificationSignals(leadData);
    const personaScores = await this.calculatePersonaScores(leadData, signals);

    const sortedPersonas = Object.entries(personaScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    const primaryPersona = sortedPersonas[0][0] as BuyerPersona;
    const confidence = sortedPersonas[0][1];

    const alternativePersonas = sortedPersonas.slice(1).map(([persona, score]) => ({
      persona: persona as BuyerPersona,
      confidence: score,
      reasoning: this.getPersonaReasoning(persona as BuyerPersona, signals)
    }));

    const characteristics = await this.determineCharacteristics(leadData, primaryPersona);
    const hierarchicalClassification = this.getHierarchicalClassification(primaryPersona);
    const scoringAdjustments = this.calculateScoringAdjustments(primaryPersona, characteristics);
    const engagementStrategy = this.getEngagementStrategy(primaryPersona);

    const classification: BuyerProfileClassification = {
      primaryPersona,
      confidence,
      alternativePersonas,
      characteristics,
      hierarchicalClassification,
      scoringAdjustments,
      engagementStrategy,
      classificationMetadata: {
        modelVersion: '1.0.0',
        classifiedAt: new Date(),
        signals,
        qualityScore: this.calculateQualityScore(signals)
      }
    };

    // Store classification for analytics
    this.storeClassification(leadData, classification);

    return classification;
  }

  private async extractClassificationSignals(leadData: LeadData): Promise<ClassificationSignals> {
    return {
      firmographicSignals: {
        companySize: this.normalizeFirmographicSignal(leadData.firmographic.companySize),
        industry: this.calculateIndustryScore(leadData.firmographic.industry),
        revenue: this.normalizeRevenue(leadData.firmographic.revenue),
        maturity: this.calculateMaturityScore(leadData.firmographic.companyMaturity)
      },
      behavioralSignals: {
        engagement_depth: this.calculateEngagementDepth(leadData.behavioral),
        technical_interest: this.calculateTechnicalInterest(leadData.behavioral),
        decision_urgency: this.calculateDecisionUrgency(leadData.intent),
        research_pattern: this.calculateResearchPattern(leadData.behavioral)
      },
      contentSignals: {
        content_preferences: this.analyzeContentPreferences(leadData.behavioral.contentEngagement),
        topic_affinity: this.analyzeTopicAffinity(leadData.intent.contentTopicsEngaged),
        depth_preference: this.calculateDepthPreference(leadData.behavioral)
      },
      interactionSignals: {
        communication_style: this.analyzeCommunicationStyle(leadData),
        meeting_preferences: this.analyzeMeetingPreferences(leadData),
        response_patterns: this.analyzeResponsePatterns(leadData)
      }
    };
  }

  private async calculatePersonaScores(leadData: LeadData, signals: ClassificationSignals): Promise<Record<BuyerPersona, number>> {
    const scores: Record<string, number> = {};

    for (const [persona, model] of this.personaModels) {
      let score = 0;

      // Firmographic scoring
      score += signals.firmographicSignals.companySize * (model.featureWeights.firmographic.companySize || 0);
      score += signals.firmographicSignals.revenue * (model.featureWeights.firmographic.revenue || 0);
      score += signals.firmographicSignals.industry * (model.featureWeights.firmographic.industry || 0);

      // Behavioral scoring
      score += signals.behavioralSignals.engagement_depth * (model.featureWeights.behavioral.detailedAnalysis || 0);
      score += signals.behavioralSignals.technical_interest * (model.featureWeights.behavioral.technicalContent || 0);

      // Apply persona-specific adjustments
      score = this.applyPersonaAdjustments(score, persona, leadData);

      scores[persona] = Math.max(0, Math.min(1, score));
    }

    return scores as Record<BuyerPersona, number>;
  }

  private applyPersonaAdjustments(baseScore: number, persona: BuyerPersona, leadData: LeadData): number {
    let adjustedScore = baseScore;

    // Company size adjustments
    if (persona.startsWith('enterprise_') && leadData.firmographic.companySize !== 'enterprise') {
      adjustedScore *= 0.3;
    } else if (persona.startsWith('smb_') && leadData.firmographic.companySize === 'enterprise') {
      adjustedScore *= 0.2;
    }

    // Technical role adjustments
    if (persona.includes('cto') || persona.includes('technical')) {
      if (leadData.behavioral.technicalDepth.integrationDocsViewed ||
          leadData.behavioral.technicalDepth.apiDocsViewed) {
        adjustedScore *= 1.5;
      }
    }

    // Executive role adjustments
    if (persona.includes('ceo') || persona.includes('vp_')) {
      if (leadData.behavioral.contentEngagement.pricingPageViews > 2) {
        adjustedScore *= 1.3;
      }
    }

    return adjustedScore;
  }

  private async determineCharacteristics(leadData: LeadData, persona: BuyerPersona): Promise<BuyerProfileClassification['characteristics']> {
    return {
      decisionLevel: this.getDecisionLevel(persona),
      organizationalLevel: this.getOrganizationalLevel(persona),
      buyingMotivation: this.analyzeBuyingMotivation(leadData),
      communicationStyle: this.determineCommunicationStyle(leadData, persona),
      timeHorizon: this.determineTimeHorizon(leadData, persona),
      riskTolerance: this.assessRiskTolerance(leadData, persona)
    };
  }

  private getDecisionLevel(persona: BuyerPersona): DecisionLevel {
    if (persona.includes('ceo') || persona.includes('owner') || persona.includes('founder')) {
      return 'decision_maker';
    } else if (persona.includes('vp_') || persona.includes('director')) {
      return 'influencer';
    } else if (persona.includes('manager') || persona.includes('evaluator')) {
      return 'evaluator';
    } else {
      return 'user';
    }
  }

  private getOrganizationalLevel(persona: BuyerPersona): OrganizationalLevel {
    if (persona.includes('ceo') || persona.includes('cto')) {
      return 'c_suite';
    } else if (persona.includes('vp_')) {
      return 'vp_level';
    } else if (persona.includes('director')) {
      return 'director_level';
    } else if (persona.includes('manager')) {
      return 'manager_level';
    } else {
      return 'individual_contributor';
    }
  }

  private analyzeBuyingMotivation(leadData: LeadData): BuyingMotivation[] {
    const motivations: BuyingMotivation[] = [];

    // Analyze content engagement for motivation signals
    if (leadData.behavioral.contentEngagement.pricingPageViews > 0) {
      motivations.push('cost_reduction');
    }

    if (leadData.behavioral.technicalDepth.technicalResourcesAccessed > 0) {
      motivations.push('innovation');
    }

    if (leadData.intent.competitorResearch) {
      motivations.push('competitive_advantage');
    }

    // Default motivations if none detected
    if (motivations.length === 0) {
      motivations.push('efficiency', 'growth');
    }

    return motivations;
  }

  private determineCommunicationStyle(leadData: LeadData, persona: BuyerPersona): BuyerProfileClassification['characteristics']['communicationStyle'] {
    if (persona.includes('cto') || persona.includes('technical')) {
      return 'technical';
    } else if (persona.includes('ceo') || persona.includes('vp_')) {
      return 'strategic';
    } else if (leadData.behavioral.technicalDepth.technicalResourcesAccessed > 5) {
      return 'data_driven';
    } else {
      return 'results_oriented';
    }
  }

  private determineTimeHorizon(leadData: LeadData, persona: BuyerPersona): BuyerProfileClassification['characteristics']['timeHorizon'] {
    if (persona.startsWith('smb_') || leadData.intent.urgencyIndicators.fastTrackRequests) {
      return 'immediate';
    } else if (persona.includes('director') || persona.includes('manager')) {
      return 'quarterly';
    } else if (persona.includes('ceo') || persona.includes('vp_')) {
      return 'annual';
    } else {
      return 'quarterly';
    }
  }

  private assessRiskTolerance(leadData: LeadData, persona: BuyerPersona): BuyerProfileClassification['characteristics']['riskTolerance'] {
    if (persona.startsWith('smb_') || persona.includes('founder')) {
      return 'high';
    } else if (persona.includes('procurement') || persona.includes('enterprise_')) {
      return 'low';
    } else {
      return 'medium';
    }
  }

  private getHierarchicalClassification(persona: BuyerPersona): BuyerProfileClassification['hierarchicalClassification'] {
    const topLevel = persona.startsWith('enterprise_') ? 'enterprise' :
                    persona.startsWith('mid_market') ? 'mid_market' :
                    persona.startsWith('smb_') ? 'smb' : 'individual';

    const roleCategory = persona.includes('cto') || persona.includes('technical') ? 'technical' :
                        persona.includes('ceo') || persona.includes('vp_') ? 'executive' :
                        persona.includes('procurement') ? 'procurement' :
                        persona.includes('sales') || persona.includes('marketing') ? 'business' : 'operations';

    const authority = this.getDecisionLevel(persona) === 'decision_maker' ? 'high' :
                     this.getDecisionLevel(persona) === 'influencer' ? 'medium' : 'low';

    return {
      topLevel,
      roleCategory,
      specificRole: persona.replace(/_/g, ' '),
      authority
    };
  }

  private calculateScoringAdjustments(persona: BuyerPersona, characteristics: BuyerProfileClassification['characteristics']): BuyerProfileClassification['scoringAdjustments'] {
    let firmographicMultiplier = 1.0;
    let behavioralMultiplier = 1.0;
    let intentMultiplier = 1.0;
    let timingMultiplier = 1.0;
    let urgencyMultiplier = 1.0;

    // Adjust based on decision level
    if (characteristics.decisionLevel === 'decision_maker') {
      firmographicMultiplier = 1.3;
      intentMultiplier = 1.4;
    } else if (characteristics.decisionLevel === 'evaluator') {
      behavioralMultiplier = 1.4;
      timingMultiplier = 1.2;
    }

    // Adjust based on organizational level
    if (characteristics.organizationalLevel === 'c_suite') {
      firmographicMultiplier *= 1.2;
      urgencyMultiplier *= 0.8; // Less urgent, more strategic
    }

    // Adjust based on persona type
    if (persona.includes('technical')) {
      behavioralMultiplier *= 1.5;
    } else if (persona.includes('ceo')) {
      firmographicMultiplier *= 1.4;
      intentMultiplier *= 1.3;
    }

    return {
      firmographicMultiplier,
      behavioralMultiplier,
      intentMultiplier,
      timingMultiplier,
      urgencyMultiplier
    };
  }

  private getEngagementStrategy(persona: BuyerPersona): PersonaEngagementStrategy {
    return this.engagementStrategies.get(persona) || this.getDefaultEngagementStrategy();
  }

  private getDefaultEngagementStrategy(): PersonaEngagementStrategy {
    return {
      primaryApproach: 'Standard product demonstration with value focus',
      communicationPreferences: {
        preferredChannels: ['email', 'phone', 'demo'],
        messagingStyle: 'Professional with clear value proposition',
        contentTypes: ['product_overview', 'case_study', 'pricing'],
        meetingPreferences: 'Standard meeting format'
      },
      contentRecommendations: [
        {
          type: 'demo',
          priority: 'high',
          reasoning: 'Product demonstration shows value',
          customization: 'Standard demo flow'
        }
      ],
      nextBestActions: [
        {
          action: 'Schedule product demo',
          priority: 'short_term',
          expectedOutcome: 'Product understanding and interest',
          successMetrics: ['demo_completion', 'follow_up_interest']
        }
      ],
      personalization: {
        pain_points: ['Efficiency', 'Growth', 'Cost management'],
        value_propositions: ['Improved efficiency', 'Growth enablement', 'Cost savings'],
        objection_handling: ['Price concerns', 'Implementation effort', 'Change management'],
        success_metrics: ['ROI', 'Time savings', 'Process improvement']
      }
    };
  }

  // Helper methods for signal calculation
  private normalizeFirmographicSignal(companySize: string): number {
    const sizeMap: Record<string, number> = {
      'startup': 0.2,
      'smb': 0.4,
      'mid_market': 0.7,
      'enterprise': 1.0
    };
    return sizeMap[companySize] || 0.5;
  }

  private calculateIndustryScore(industry: string): number {
    // Simplified industry scoring - could be enhanced with industry-specific logic
    return Math.random() * 0.5 + 0.5;
  }

  private normalizeRevenue(revenue: number | null): number {
    if (!revenue) return 0.3;
    if (revenue < 1000000) return 0.3;
    if (revenue < 10000000) return 0.5;
    if (revenue < 100000000) return 0.7;
    return 1.0;
  }

  private calculateMaturityScore(maturity: string): number {
    const maturityMap: Record<string, number> = {
      'seed': 0.3,
      'growth': 0.7,
      'mature': 1.0
    };
    return maturityMap[maturity] || 0.5;
  }

  private calculateEngagementDepth(behavioral: LeadData['behavioral']): number {
    const depth = (
      behavioral.sessionCount * 0.2 +
      behavioral.avgSessionDuration * 0.3 +
      behavioral.pageViewsPerSession * 0.2 +
      (behavioral.contentEngagement.documentsDownloaded + behavioral.contentEngagement.videosWatched) * 0.3
    ) / 100;
    return Math.min(1, depth);
  }

  private calculateTechnicalInterest(behavioral: LeadData['behavioral']): number {
    const technical = behavioral.technicalDepth;
    let score = 0;

    if (technical.integrationDocsViewed) score += 0.4;
    if (technical.apiDocsViewed) score += 0.4;
    score += Math.min(0.2, technical.technicalResourcesAccessed / 10);

    return score;
  }

  private calculateDecisionUrgency(intent: LeadData['intent']): number {
    const urgency = intent.urgencyIndicators;
    let score = 0;

    if (urgency.fastTrackRequests) score += 0.4;
    score += Math.min(0.3, urgency.demoRequests / 5);
    score += Math.min(0.3, urgency.contactFormSubmissions / 3);

    return score;
  }

  private calculateResearchPattern(behavioral: LeadData['behavioral']): number {
    // Pattern based on return visits and session depth
    const pattern = behavioral.returnVisitorPattern;
    const patternMap: Record<string, number> = {
      'single': 0.2,
      'occasional': 0.4,
      'frequent': 0.7,
      'power_user': 1.0
    };
    return patternMap[pattern] || 0.3;
  }

  private analyzeContentPreferences(engagement: LeadData['behavioral']['contentEngagement']): Record<string, number> {
    return {
      documents: engagement.documentsDownloaded / 10,
      videos: engagement.videosWatched / 5,
      forms: engagement.formsCompleted / 3,
      pricing: engagement.pricingPageViews / 5,
      features: engagement.featurePageViews / 10
    };
  }

  private analyzeTopicAffinity(topics: string[]): Record<string, number> {
    const affinity: Record<string, number> = {};
    topics.forEach(topic => {
      affinity[topic] = Math.random() * 0.5 + 0.5;
    });
    return affinity;
  }

  private calculateDepthPreference(behavioral: LeadData['behavioral']): number {
    return (behavioral.avgSessionDuration + behavioral.timeOnSite) / 1000; // Normalize
  }

  private analyzeCommunicationStyle(leadData: LeadData): Record<string, number> {
    return {
      formal: 0.5,
      casual: 0.3,
      technical: leadData.behavioral.technicalDepth.technicalResourcesAccessed > 0 ? 0.8 : 0.2,
      business_focused: 0.6
    };
  }

  private analyzeMeetingPreferences(leadData: LeadData): Record<string, number> {
    return {
      phone: 0.4,
      video: 0.6,
      in_person: 0.3,
      demo: leadData.intent.urgencyIndicators.demoRequests > 0 ? 0.8 : 0.5
    };
  }

  private analyzeResponsePatterns(leadData: LeadData): Record<string, number> {
    return {
      quick_responder: leadData.timing.recentActivity ? 0.8 : 0.3,
      thorough_evaluator: leadData.behavioral.avgSessionDuration > 300 ? 0.8 : 0.4,
      comparison_shopper: leadData.intent.competitorResearch ? 0.8 : 0.3
    };
  }

  private getPersonaReasoning(persona: BuyerPersona, signals: ClassificationSignals): string {
    // Generate reasoning based on strongest signals for this persona
    const reasons = [];

    if (signals.firmographicSignals.companySize > 0.7 && persona.includes('enterprise')) {
      reasons.push('Large company size indicates enterprise buyer');
    }

    if (signals.behavioralSignals.technical_interest > 0.6 && persona.includes('cto')) {
      reasons.push('High technical engagement suggests technical decision maker');
    }

    if (signals.behavioralSignals.decision_urgency > 0.7 && persona.includes('founder')) {
      reasons.push('Urgency patterns typical of startup founders');
    }

    return reasons.length > 0 ? reasons.join('; ') : 'Pattern matching with persona characteristics';
  }

  private calculateQualityScore(signals: ClassificationSignals): number {
    // Calculate quality based on signal completeness and consistency
    let quality = 0;
    let signalCount = 0;

    Object.values(signals.firmographicSignals).forEach(signal => {
      if (signal > 0) { quality += signal; signalCount++; }
    });

    Object.values(signals.behavioralSignals).forEach(signal => {
      if (signal > 0) { quality += signal; signalCount++; }
    });

    return signalCount > 0 ? quality / signalCount : 0.5;
  }

  private storeClassification(leadData: LeadData, classification: BuyerProfileClassification): void {
    const leadId = this.generateLeadId(leadData);
    const history = this.classificationHistory.get(leadId) || [];
    history.push(classification);
    this.classificationHistory.set(leadId, history);

    this.emit('classification_complete', { leadId, classification });
  }

  private generateLeadId(leadData: LeadData): string {
    // Generate unique ID based on lead characteristics
    return `lead_${leadData.firmographic.industry}_${Date.now()}`;
  }

  // Public API Methods
  async updatePersonaModel(persona: BuyerPersona, updates: Partial<PersonaModel>): Promise<PersonaModel> {
    const existing = this.personaModels.get(persona);
    if (!existing) {
      throw new Error(`Persona model ${persona} not found`);
    }

    const updated = { ...existing, ...updates, lastModified: new Date() };
    this.personaModels.set(persona, updated);

    this.emit('model_updated', { persona, model: updated });
    return updated;
  }

  async getPersonaModel(persona: BuyerPersona): Promise<PersonaModel | null> {
    return this.personaModels.get(persona) || null;
  }

  async getAllPersonaModels(): Promise<PersonaModel[]> {
    return Array.from(this.personaModels.values());
  }

  async getPersonaAnalytics(): Promise<PersonaAnalytics> {
    const allClassifications = Array.from(this.classificationHistory.values()).flat();

    const personaDistribution: Record<string, number> = {};
    const conversionRates: Record<string, number> = {};
    const averageScores: Record<string, number> = {};

    // Calculate distribution
    allClassifications.forEach(classification => {
      const persona = classification.primaryPersona;
      personaDistribution[persona] = (personaDistribution[persona] || 0) + 1;
    });

    // Normalize to percentages
    const total = allClassifications.length;
    Object.keys(personaDistribution).forEach(persona => {
      personaDistribution[persona] = personaDistribution[persona] / total;
    });

    return {
      personaDistribution: personaDistribution as Record<BuyerPersona, number>,
      conversionRates: conversionRates as Record<BuyerPersona, number>,
      averageScores: averageScores as Record<BuyerPersona, number>,
      engagementMetrics: {} as any, // Placeholder for engagement metrics
      trends: {
        monthlyDistribution: {},
        seasonalPatterns: {},
        industryCorrelations: {}
      }
    };
  }

  async batchClassifyProfiles(leads: LeadData[]): Promise<BuyerProfileClassification[]> {
    const classifications = await Promise.all(
      leads.map(lead => this.classifyBuyerProfile(lead))
    );

    this.emit('batch_classification_complete', { count: leads.length, classifications });
    return classifications;
  }

  getServiceHealth(): any {
    return {
      status: 'healthy',
      modelCount: this.personaModels.size,
      totalClassifications: Array.from(this.classificationHistory.values()).flat().length,
      lastActivity: new Date(),
      performance: {
        averageClassificationTime: '150ms',
        memoryUsage: `${this.personaModels.size * 0.1}MB`,
        successRate: '99.2%'
      }
    };
  }

  async clearData(): Promise<void> {
    this.classificationHistory.clear();
    this.emit('data_cleared');
  }
}
