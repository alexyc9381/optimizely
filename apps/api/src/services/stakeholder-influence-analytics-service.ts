/**
 * Stakeholder Influence Analytics Engine
 *
 * Advanced analytics system to track and analyze stakeholder engagement patterns
 * and decision-making influence across multiple industries with real-time scoring
 * and predictive influence modeling.
 */

import { EventEmitter } from 'events';
import { Industry, StakeholderData } from './multi-industry-pipeline-management-service';

// ============================================================================
// ENHANCED TYPES AND INTERFACES
// ============================================================================

export enum StakeholderRole {
  // Universal roles
  DECISION_MAKER = 'decision_maker',
  INFLUENCER = 'influencer',
  USER = 'user',
  CHAMPION = 'champion',
  GATEKEEPER = 'gatekeeper',
  BUDGET_OWNER = 'budget_owner',

  // SaaS specific
  TECHNICAL_CHAMPION = 'technical_champion',
  END_USER = 'end_user',
  IT_ADMINISTRATOR = 'it_administrator',
  PROCUREMENT_LEAD = 'procurement_lead',

  // Manufacturing specific
  ENGINEER = 'engineer',
  PROCUREMENT_OFFICER = 'procurement_officer',
  TECHNICAL_LEAD = 'technical_lead',
  QUALITY_ASSURANCE = 'quality_assurance',
  PRODUCTION_MANAGER = 'production_manager',

  // Healthcare specific
  PATIENT = 'patient',
  PHYSICIAN = 'physician',
  CARE_COORDINATOR = 'care_coordinator',
  ADMINISTRATOR = 'administrator',
  CLINICAL_DIRECTOR = 'clinical_director',
  NURSE = 'nurse',

  // FinTech specific
  COMPLIANCE_OFFICER = 'compliance_officer',
  RISK_MANAGER = 'risk_manager',
  BUSINESS_USER = 'business_user',
  REGULATORY_CONTACT = 'regulatory_contact',
  TREASURY_MANAGER = 'treasury_manager',

  // College Consulting specific
  STUDENT = 'student',
  PARENT = 'parent',
  COUNSELOR = 'counselor',
  FINANCIAL_ADVISOR = 'financial_advisor',
  COLLEGE_ADVISOR = 'college_advisor'
}

export enum EngagementType {
  EMAIL_OPEN = 'email_open',
  EMAIL_CLICK = 'email_click',
  WEBSITE_VISIT = 'website_visit',
  DEMO_ATTENDED = 'demo_attended',
  MEETING_SCHEDULED = 'meeting_scheduled',
  DOCUMENT_DOWNLOADED = 'document_downloaded',
  PROPOSAL_REVIEWED = 'proposal_reviewed',
  TRIAL_STARTED = 'trial_started',
  FEATURE_USED = 'feature_used',
  SUPPORT_TICKET = 'support_ticket',
  PHONE_CALL = 'phone_call',
  VIDEO_CONFERENCE = 'video_conference',
  SITE_VISIT = 'site_visit',
  REFERRAL_MADE = 'referral_made'
}

export enum InfluenceLevel {
  CRITICAL = 'critical',      // 80-100: Can make or break the deal
  HIGH = 'high',             // 60-79: Strong influence on decision
  MEDIUM = 'medium',         // 40-59: Moderate influence
  LOW = 'low',               // 20-39: Limited influence
  MINIMAL = 'minimal'        // 0-19: Very little influence
}

export interface EngagementEvent {
  eventId: string;
  stakeholderId: string;
  type: EngagementType;
  timestamp: string;
  duration?: number; // minutes
  metadata?: Record<string, any>;
  engagementScore: number; // 0-100
  sourceChannel: string;
  location?: string;
}

export interface StakeholderInteraction {
  interactionId: string;
  stakeholderIds: string[];
  type: 'meeting' | 'email_thread' | 'phone_call' | 'collaboration';
  timestamp: string;
  duration?: number;
  outcome: 'positive' | 'neutral' | 'negative';
  influenceTransfer?: number; // -100 to 100
  notes?: string;
}

export interface EnhancedStakeholderData extends StakeholderData {
  role: StakeholderRole;
  seniority: 'junior' | 'mid' | 'senior' | 'executive';
  department?: string;
  location?: string;
  decisionMakingPower: number; // 0-100
  budgetInfluence: number; // 0-100
  technicalInfluence: number; // 0-100
  politicalInfluence: number; // 0-100
  overallInfluenceScore: number; // Calculated composite score
  influenceLevel: InfluenceLevel;
  engagementHistory: EngagementEvent[];
  interactionHistory: StakeholderInteraction[];
  relationshipStrength: number; // 0-100
  advocacyLevel: number; // 0-100
  riskScore: number; // 0-100 (risk of being a blocker)
  communicationPreference: 'email' | 'phone' | 'meeting' | 'video' | 'text';
  timezone: string;
  bestContactTime?: string;
  industrySpecificData: Record<string, any>;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  lastEngagementDate: string;
  predictionScore: number; // Predicted likelihood to influence positively
}

export interface StakeholderNetwork {
  customerId: string;
  stakeholders: Map<string, EnhancedStakeholderData>;
  relationships: StakeholderInteraction[];
  influenceMap: Map<string, Map<string, number>>; // stakeholder -> stakeholder -> influence
  decisionCommittee: string[]; // Key decision makers
  champions: string[]; // Internal advocates
  blockers: string[]; // Potential roadblocks
  networkStrength: number; // Overall network engagement
  networkHealth: 'strong' | 'moderate' | 'weak' | 'at_risk';
}

export interface InfluenceAnalytics {
  industryBenchmarks: Record<StakeholderRole, {
    avgInfluence: number;
    avgEngagement: number;
    conversionImpact: number;
  }>;
  roleEffectiveness: Record<StakeholderRole, number>;
  engagementPatterns: Record<EngagementType, {
    frequency: number;
    impact: number;
    optimalTiming: string[];
  }>;
  crossIndustryInsights: Record<Industry, Record<string, any>>;
  predictiveModels: Record<string, any>;
}

export interface StakeholderInsights {
  customerId: string;
  totalStakeholders: number;
  activeStakeholders: number;
  averageInfluence: number;
  networkStrength: number;
  championRatio: number;
  blockerRisk: number;
  engagementScore: number;
  decisionReadiness: number;
  recommendedActions: string[];
  riskFactors: string[];
  opportunities: string[];
  nextBestActions: {
    stakeholderId: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: number;
  }[];
}

// ============================================================================
// INDUSTRY-SPECIFIC STAKEHOLDER CONFIGURATIONS
// ============================================================================

const INDUSTRY_STAKEHOLDER_CONFIGS = {
  [Industry.SAAS]: {
    primaryRoles: [
      StakeholderRole.TECHNICAL_CHAMPION,
      StakeholderRole.DECISION_MAKER,
      StakeholderRole.END_USER,
      StakeholderRole.BUDGET_OWNER
    ],
    roleWeights: {
      [StakeholderRole.TECHNICAL_CHAMPION]: 0.35,
      [StakeholderRole.DECISION_MAKER]: 0.30,
      [StakeholderRole.BUDGET_OWNER]: 0.25,
      [StakeholderRole.END_USER]: 0.10
    },
    criticalEngagements: [
      EngagementType.DEMO_ATTENDED,
      EngagementType.TRIAL_STARTED,
      EngagementType.FEATURE_USED,
      EngagementType.PROPOSAL_REVIEWED
    ],
    avgDecisionCommitteeSize: 4,
    avgSalesVelocity: 30 // days
  },

  [Industry.MANUFACTURING]: {
    primaryRoles: [
      StakeholderRole.ENGINEER,
      StakeholderRole.PROCUREMENT_OFFICER,
      StakeholderRole.TECHNICAL_LEAD,
      StakeholderRole.BUDGET_OWNER
    ],
    roleWeights: {
      [StakeholderRole.TECHNICAL_LEAD]: 0.35,
      [StakeholderRole.PROCUREMENT_OFFICER]: 0.30,
      [StakeholderRole.ENGINEER]: 0.20,
      [StakeholderRole.BUDGET_OWNER]: 0.15
    },
    criticalEngagements: [
      EngagementType.SITE_VISIT,
      EngagementType.PROPOSAL_REVIEWED,
      EngagementType.DEMO_ATTENDED,
      EngagementType.DOCUMENT_DOWNLOADED
    ],
    avgDecisionCommitteeSize: 6,
    avgSalesVelocity: 120 // days
  },

  [Industry.HEALTHCARE]: {
    primaryRoles: [
      StakeholderRole.PHYSICIAN,
      StakeholderRole.ADMINISTRATOR,
      StakeholderRole.CARE_COORDINATOR,
      StakeholderRole.CLINICAL_DIRECTOR
    ],
    roleWeights: {
      [StakeholderRole.PHYSICIAN]: 0.40,
      [StakeholderRole.CLINICAL_DIRECTOR]: 0.25,
      [StakeholderRole.ADMINISTRATOR]: 0.20,
      [StakeholderRole.CARE_COORDINATOR]: 0.15
    },
    criticalEngagements: [
      EngagementType.DEMO_ATTENDED,
      EngagementType.MEETING_SCHEDULED,
      EngagementType.DOCUMENT_DOWNLOADED,
      EngagementType.REFERRAL_MADE
    ],
    avgDecisionCommitteeSize: 5,
    avgSalesVelocity: 90 // days
  },

  [Industry.FINTECH]: {
    primaryRoles: [
      StakeholderRole.COMPLIANCE_OFFICER,
      StakeholderRole.RISK_MANAGER,
      StakeholderRole.BUSINESS_USER,
      StakeholderRole.REGULATORY_CONTACT
    ],
    roleWeights: {
      [StakeholderRole.COMPLIANCE_OFFICER]: 0.35,
      [StakeholderRole.RISK_MANAGER]: 0.30,
      [StakeholderRole.BUSINESS_USER]: 0.20,
      [StakeholderRole.REGULATORY_CONTACT]: 0.15
    },
    criticalEngagements: [
      EngagementType.PROPOSAL_REVIEWED,
      EngagementType.MEETING_SCHEDULED,
      EngagementType.DOCUMENT_DOWNLOADED,
      EngagementType.DEMO_ATTENDED
    ],
    avgDecisionCommitteeSize: 5,
    avgSalesVelocity: 60 // days
  },

  [Industry.COLLEGE_CONSULTING]: {
    primaryRoles: [
      StakeholderRole.PARENT,
      StakeholderRole.STUDENT,
      StakeholderRole.COUNSELOR,
      StakeholderRole.FINANCIAL_ADVISOR
    ],
    roleWeights: {
      [StakeholderRole.PARENT]: 0.50,
      [StakeholderRole.STUDENT]: 0.30,
      [StakeholderRole.COUNSELOR]: 0.15,
      [StakeholderRole.FINANCIAL_ADVISOR]: 0.05
    },
    criticalEngagements: [
      EngagementType.MEETING_SCHEDULED,
      EngagementType.DOCUMENT_DOWNLOADED,
      EngagementType.EMAIL_CLICK,
      EngagementType.PHONE_CALL
    ],
    avgDecisionCommitteeSize: 3,
    avgSalesVelocity: 365 // days
  }
};

// ============================================================================
// STAKEHOLDER INFLUENCE ANALYTICS ENGINE
// ============================================================================

export class StakeholderInfluenceAnalyticsService extends EventEmitter {
  private static instance: StakeholderInfluenceAnalyticsService;
  private stakeholderNetworks: Map<string, StakeholderNetwork> = new Map();
  private influenceAnalytics: Map<Industry, InfluenceAnalytics> = new Map();
  private engagementPatterns: Map<string, EngagementEvent[]> = new Map();

  private constructor() {
    super();
    this.initializeAnalytics();
  }

  public static getInstance(): StakeholderInfluenceAnalyticsService {
    if (!StakeholderInfluenceAnalyticsService.instance) {
      StakeholderInfluenceAnalyticsService.instance = new StakeholderInfluenceAnalyticsService();
    }
    return StakeholderInfluenceAnalyticsService.instance;
  }

  private initializeAnalytics(): void {
    Object.values(Industry).forEach(industry => {
      this.influenceAnalytics.set(industry, {
        industryBenchmarks: {} as any,
        roleEffectiveness: {} as any,
        engagementPatterns: {} as any,
        crossIndustryInsights: {} as any,
        predictiveModels: {}
      });
    });
  }

  /**
   * Initialize or update stakeholder network for a customer
   */
  public async initializeStakeholderNetwork(
    customerId: string,
    industry: Industry,
    initialStakeholders?: EnhancedStakeholderData[]
  ): Promise<StakeholderNetwork> {
    const network: StakeholderNetwork = {
      customerId,
      stakeholders: new Map(),
      relationships: [],
      influenceMap: new Map(),
      decisionCommittee: [],
      champions: [],
      blockers: [],
      networkStrength: 0,
      networkHealth: 'weak'
    };

    if (initialStakeholders) {
      initialStakeholders.forEach(stakeholder => {
        network.stakeholders.set(stakeholder.stakeholderId, stakeholder);
      });
      await this.analyzeNetworkHealth(network, industry);
    }

    this.stakeholderNetworks.set(customerId, network);
    this.emit('networkInitialized', network);
    return network;
  }

  /**
   * Add enhanced stakeholder with advanced analytics
   */
  public async addEnhancedStakeholder(
    customerId: string,
    stakeholder: Partial<EnhancedStakeholderData>,
    industry: Industry
  ): Promise<EnhancedStakeholderData> {
    const network = this.stakeholderNetworks.get(customerId);
    if (!network) {
      throw new Error(`Stakeholder network not found for customer ${customerId}`);
    }

    const enhancedStakeholder: EnhancedStakeholderData = {
      stakeholderId: stakeholder.stakeholderId || `stakeholder_${Date.now()}`,
      role: stakeholder.role || StakeholderRole.USER,
      influence: stakeholder.influence || 50,
      engagement: stakeholder.engagement || 0,
      lastInteraction: stakeholder.lastInteraction || new Date().toISOString(),
      seniority: stakeholder.seniority || 'mid',
      department: stakeholder.department,
      location: stakeholder.location,
      decisionMakingPower: stakeholder.decisionMakingPower || this.calculateDecisionMakingPower(stakeholder.role!, industry),
      budgetInfluence: stakeholder.budgetInfluence || this.calculateBudgetInfluence(stakeholder.role!, industry),
      technicalInfluence: stakeholder.technicalInfluence || this.calculateTechnicalInfluence(stakeholder.role!, industry),
      politicalInfluence: stakeholder.politicalInfluence || this.calculatePoliticalInfluence(stakeholder.role!, industry),
      overallInfluenceScore: 0, // Will be calculated
      influenceLevel: InfluenceLevel.MEDIUM, // Will be calculated
      engagementHistory: stakeholder.engagementHistory || [],
      interactionHistory: stakeholder.interactionHistory || [],
      relationshipStrength: stakeholder.relationshipStrength || 0,
      advocacyLevel: stakeholder.advocacyLevel || 0,
      riskScore: stakeholder.riskScore || this.calculateRiskScore(stakeholder.role!, industry),
      communicationPreference: stakeholder.communicationPreference || 'email',
      timezone: stakeholder.timezone || 'UTC',
      bestContactTime: stakeholder.bestContactTime,
      industrySpecificData: stakeholder.industrySpecificData || {},
      engagementTrend: stakeholder.engagementTrend || 'stable',
      lastEngagementDate: stakeholder.lastEngagementDate || new Date().toISOString(),
      predictionScore: 0 // Will be calculated
    };

    // Calculate composite scores
    enhancedStakeholder.overallInfluenceScore = this.calculateOverallInfluenceScore(enhancedStakeholder, industry);
    enhancedStakeholder.influenceLevel = this.determineInfluenceLevel(enhancedStakeholder.overallInfluenceScore);
    enhancedStakeholder.predictionScore = this.calculatePredictionScore(enhancedStakeholder, industry);

    network.stakeholders.set(enhancedStakeholder.stakeholderId, enhancedStakeholder);

    // Update network analysis
    await this.analyzeNetworkHealth(network, industry);
    await this.updateInfluenceMap(network, industry);

    this.emit('stakeholderAdded', customerId, enhancedStakeholder);
    return enhancedStakeholder;
  }

  /**
   * Record engagement event and update analytics
   */
  public async recordEngagement(
    customerId: string,
    stakeholderId: string,
    engagement: Partial<EngagementEvent>,
    industry: Industry
  ): Promise<void> {
    const network = this.stakeholderNetworks.get(customerId);
    if (!network) {
      throw new Error(`Stakeholder network not found for customer ${customerId}`);
    }

    const stakeholder = network.stakeholders.get(stakeholderId);
    if (!stakeholder) {
      throw new Error(`Stakeholder not found: ${stakeholderId}`);
    }

    const engagementEvent: EngagementEvent = {
      eventId: engagement.eventId || `event_${Date.now()}`,
      stakeholderId,
      type: engagement.type || EngagementType.EMAIL_OPEN,
      timestamp: engagement.timestamp || new Date().toISOString(),
      duration: engagement.duration,
      metadata: engagement.metadata || {},
      engagementScore: engagement.engagementScore || this.calculateEngagementScore(engagement.type!, industry),
      sourceChannel: engagement.sourceChannel || 'unknown',
      location: engagement.location
    };

    stakeholder.engagementHistory.push(engagementEvent);
    stakeholder.lastEngagementDate = engagementEvent.timestamp;
    stakeholder.lastInteraction = engagementEvent.timestamp;

    // Update engagement score
    stakeholder.engagement = this.recalculateEngagementScore(stakeholder);
    stakeholder.engagementTrend = this.analyzeEngagementTrend(stakeholder);

    // Update prediction score
    stakeholder.predictionScore = this.calculatePredictionScore(stakeholder, industry);

    // Store in patterns for analytics
    const patternKey = `${industry}_${stakeholder.role}`;
    if (!this.engagementPatterns.has(patternKey)) {
      this.engagementPatterns.set(patternKey, []);
    }
    this.engagementPatterns.get(patternKey)!.push(engagementEvent);

    await this.analyzeNetworkHealth(network, industry);
    this.emit('engagementRecorded', customerId, stakeholderId, engagementEvent);
  }

  /**
   * Record stakeholder interaction
   */
  public async recordInteraction(
    customerId: string,
    interaction: Partial<StakeholderInteraction>,
    industry: Industry
  ): Promise<void> {
    const network = this.stakeholderNetworks.get(customerId);
    if (!network) {
      throw new Error(`Stakeholder network not found for customer ${customerId}`);
    }

    const stakeholderInteraction: StakeholderInteraction = {
      interactionId: interaction.interactionId || `interaction_${Date.now()}`,
      stakeholderIds: interaction.stakeholderIds || [],
      type: interaction.type || 'meeting',
      timestamp: interaction.timestamp || new Date().toISOString(),
      duration: interaction.duration,
      outcome: interaction.outcome || 'neutral',
      influenceTransfer: interaction.influenceTransfer || 0,
      notes: interaction.notes
    };

    network.relationships.push(stakeholderInteraction);

    // Update stakeholder interaction histories
    stakeholderInteraction.stakeholderIds.forEach(stakeholderId => {
      const stakeholder = network.stakeholders.get(stakeholderId);
      if (stakeholder) {
        stakeholder.interactionHistory.push(stakeholderInteraction);
        stakeholder.lastInteraction = stakeholderInteraction.timestamp;

        // Update relationship strength based on interaction outcome
        if (stakeholderInteraction.outcome === 'positive') {
          stakeholder.relationshipStrength = Math.min(stakeholder.relationshipStrength + 5, 100);
          stakeholder.advocacyLevel = Math.min(stakeholder.advocacyLevel + 3, 100);
        } else if (stakeholderInteraction.outcome === 'negative') {
          stakeholder.relationshipStrength = Math.max(stakeholder.relationshipStrength - 10, 0);
          stakeholder.riskScore = Math.min(stakeholder.riskScore + 5, 100);
        }
      }
    });

    await this.updateInfluenceMap(network, industry);
    this.emit('interactionRecorded', customerId, stakeholderInteraction);
  }

  /**
   * Get comprehensive stakeholder insights for a customer
   */
  public async getStakeholderInsights(customerId: string, industry: Industry): Promise<StakeholderInsights> {
    const network = this.stakeholderNetworks.get(customerId);
    if (!network) {
      throw new Error(`Stakeholder network not found for customer ${customerId}`);
    }

    const stakeholders = Array.from(network.stakeholders.values());
    const activeStakeholders = stakeholders.filter(s =>
      Date.parse(s.lastEngagementDate) > Date.now() - (30 * 24 * 60 * 60 * 1000) // Active in last 30 days
    );

    const insights: StakeholderInsights = {
      customerId,
      totalStakeholders: stakeholders.length,
      activeStakeholders: activeStakeholders.length,
      averageInfluence: stakeholders.reduce((sum, s) => sum + s.overallInfluenceScore, 0) / stakeholders.length,
      networkStrength: network.networkStrength,
      championRatio: network.champions.length / stakeholders.length,
      blockerRisk: network.blockers.length / stakeholders.length,
      engagementScore: stakeholders.reduce((sum, s) => sum + s.engagement, 0) / stakeholders.length,
      decisionReadiness: this.calculateDecisionReadiness(network, industry),
      recommendedActions: this.generateRecommendedActions(network, industry),
      riskFactors: this.identifyRiskFactors(network, industry),
      opportunities: this.identifyOpportunities(network, industry),
      nextBestActions: this.generateNextBestActions(network, industry)
    };

    return insights;
  }

  /**
   * Get stakeholder network for a customer
   */
  public getStakeholderNetwork(customerId: string): StakeholderNetwork | undefined {
    return this.stakeholderNetworks.get(customerId);
  }

  /**
   * Get industry analytics
   */
  public getIndustryAnalytics(industry: Industry): InfluenceAnalytics | undefined {
    return this.influenceAnalytics.get(industry);
  }

  // ============================================================================
  // PRIVATE CALCULATION METHODS
  // ============================================================================

  private calculateDecisionMakingPower(role: StakeholderRole, industry: Industry): number {
    const industryConfig = INDUSTRY_STAKEHOLDER_CONFIGS[industry];
    const roleWeight = (industryConfig.roleWeights as any)[role] || 0.1;
    return Math.min(roleWeight * 200, 100); // Scale to 0-100
  }

  private calculateBudgetInfluence(role: StakeholderRole, industry: Industry): number {
    const budgetRoles = [
      StakeholderRole.BUDGET_OWNER,
      StakeholderRole.DECISION_MAKER,
      StakeholderRole.PROCUREMENT_OFFICER,
      StakeholderRole.ADMINISTRATOR
    ];
    return budgetRoles.includes(role) ? 80 : 20;
  }

  private calculateTechnicalInfluence(role: StakeholderRole, industry: Industry): number {
    const technicalRoles = [
      StakeholderRole.TECHNICAL_CHAMPION,
      StakeholderRole.ENGINEER,
      StakeholderRole.TECHNICAL_LEAD,
      StakeholderRole.IT_ADMINISTRATOR
    ];
    return technicalRoles.includes(role) ? 90 : 30;
  }

  private calculatePoliticalInfluence(role: StakeholderRole, industry: Industry): number {
    const politicalRoles = [
      StakeholderRole.DECISION_MAKER,
      StakeholderRole.GATEKEEPER,
      StakeholderRole.ADMINISTRATOR,
      StakeholderRole.CLINICAL_DIRECTOR
    ];
    return politicalRoles.includes(role) ? 85 : 40;
  }

  private calculateRiskScore(role: StakeholderRole, industry: Industry): number {
    const riskRoles = [
      StakeholderRole.GATEKEEPER,
      StakeholderRole.COMPLIANCE_OFFICER,
      StakeholderRole.RISK_MANAGER
    ];
    return riskRoles.includes(role) ? 70 : 30;
  }

  private calculateOverallInfluenceScore(stakeholder: EnhancedStakeholderData, industry: Industry): number {
    const weights = {
      decisionMaking: 0.35,
      budget: 0.25,
      technical: 0.20,
      political: 0.20
    };

    return Math.round(
      (stakeholder.decisionMakingPower * weights.decisionMaking) +
      (stakeholder.budgetInfluence * weights.budget) +
      (stakeholder.technicalInfluence * weights.technical) +
      (stakeholder.politicalInfluence * weights.political)
    );
  }

  private determineInfluenceLevel(score: number): InfluenceLevel {
    if (score >= 80) return InfluenceLevel.CRITICAL;
    if (score >= 60) return InfluenceLevel.HIGH;
    if (score >= 40) return InfluenceLevel.MEDIUM;
    if (score >= 20) return InfluenceLevel.LOW;
    return InfluenceLevel.MINIMAL;
  }

  private calculatePredictionScore(stakeholder: EnhancedStakeholderData, industry: Industry): number {
    const factors = {
      influence: stakeholder.overallInfluenceScore * 0.3,
      engagement: stakeholder.engagement * 0.25,
      relationship: stakeholder.relationshipStrength * 0.2,
      advocacy: stakeholder.advocacyLevel * 0.15,
      risk: (100 - stakeholder.riskScore) * 0.1
    };

    return Math.round(
      Object.values(factors).reduce((sum, factor) => sum + factor, 0)
    );
  }

  private calculateEngagementScore(type: EngagementType, industry: Industry): number {
    const scores = {
      [EngagementType.EMAIL_OPEN]: 5,
      [EngagementType.EMAIL_CLICK]: 10,
      [EngagementType.WEBSITE_VISIT]: 15,
      [EngagementType.DEMO_ATTENDED]: 40,
      [EngagementType.MEETING_SCHEDULED]: 35,
      [EngagementType.DOCUMENT_DOWNLOADED]: 20,
      [EngagementType.PROPOSAL_REVIEWED]: 50,
      [EngagementType.TRIAL_STARTED]: 60,
      [EngagementType.FEATURE_USED]: 45,
      [EngagementType.SUPPORT_TICKET]: 25,
      [EngagementType.PHONE_CALL]: 30,
      [EngagementType.VIDEO_CONFERENCE]: 35,
      [EngagementType.SITE_VISIT]: 70,
      [EngagementType.REFERRAL_MADE]: 80
    };

    return scores[type] || 10;
  }

  private recalculateEngagementScore(stakeholder: EnhancedStakeholderData): number {
    if (stakeholder.engagementHistory.length === 0) return 0;

    const recent = stakeholder.engagementHistory.filter(e =>
      Date.parse(e.timestamp) > Date.now() - (30 * 24 * 60 * 60 * 1000)
    );

    const totalScore = recent.reduce((sum, e) => sum + e.engagementScore, 0);
    const avgScore = totalScore / recent.length;
    const frequencyBonus = Math.min(recent.length * 2, 20);

    return Math.min(Math.round(avgScore + frequencyBonus), 100);
  }

  private analyzeEngagementTrend(stakeholder: EnhancedStakeholderData): 'increasing' | 'stable' | 'decreasing' {
    if (stakeholder.engagementHistory.length < 3) return 'stable';

    const recent = stakeholder.engagementHistory.slice(-6); // Last 6 engagements
    const firstHalf = recent.slice(0, 3);
    const secondHalf = recent.slice(3);

    const firstHalfAvg = firstHalf.reduce((sum, e) => sum + e.engagementScore, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, e) => sum + e.engagementScore, 0) / secondHalf.length;

    if (secondHalfAvg > firstHalfAvg * 1.1) return 'increasing';
    if (secondHalfAvg < firstHalfAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  private async analyzeNetworkHealth(network: StakeholderNetwork, industry: Industry): Promise<void> {
    const stakeholders = Array.from(network.stakeholders.values());
    const config = INDUSTRY_STAKEHOLDER_CONFIGS[industry];

    // Identify decision committee
    network.decisionCommittee = stakeholders
      .filter(s => s.overallInfluenceScore >= 60)
      .sort((a, b) => b.overallInfluenceScore - a.overallInfluenceScore)
      .slice(0, config.avgDecisionCommitteeSize)
      .map(s => s.stakeholderId);

    // Identify champions
    network.champions = stakeholders
      .filter(s => s.advocacyLevel >= 60 && s.relationshipStrength >= 70)
      .map(s => s.stakeholderId);

    // Identify blockers
    network.blockers = stakeholders
      .filter(s => s.riskScore >= 60 || s.relationshipStrength <= 30)
      .map(s => s.stakeholderId);

    // Calculate network strength
    const avgInfluence = stakeholders.reduce((sum, s) => sum + s.overallInfluenceScore, 0) / stakeholders.length;
    const avgEngagement = stakeholders.reduce((sum, s) => sum + s.engagement, 0) / stakeholders.length;
    const championRatio = network.champions.length / stakeholders.length;

    network.networkStrength = Math.round((avgInfluence * 0.4) + (avgEngagement * 0.4) + (championRatio * 100 * 0.2));

    // Determine network health
    if (network.networkStrength >= 75) network.networkHealth = 'strong';
    else if (network.networkStrength >= 50) network.networkHealth = 'moderate';
    else if (network.networkStrength >= 30) network.networkHealth = 'weak';
    else network.networkHealth = 'at_risk';
  }

  private async updateInfluenceMap(network: StakeholderNetwork, industry: Industry): Promise<void> {
    network.influenceMap.clear();

    network.relationships.forEach(interaction => {
      interaction.stakeholderIds.forEach(stakeholderId => {
        if (!network.influenceMap.has(stakeholderId)) {
          network.influenceMap.set(stakeholderId, new Map());
        }

        interaction.stakeholderIds.forEach(otherId => {
          if (stakeholderId !== otherId) {
            const currentInfluence = network.influenceMap.get(stakeholderId)!.get(otherId) || 0;
            const influenceChange = interaction.influenceTransfer || 0;
            network.influenceMap.get(stakeholderId)!.set(otherId, currentInfluence + influenceChange);
          }
        });
      });
    });
  }

  private calculateDecisionReadiness(network: StakeholderNetwork, industry: Industry): number {
    const decisionMakers = network.decisionCommittee.map(id => network.stakeholders.get(id)!);
    const avgInfluence = decisionMakers.reduce((sum, s) => sum + s.overallInfluenceScore, 0) / decisionMakers.length;
    const avgEngagement = decisionMakers.reduce((sum, s) => sum + s.engagement, 0) / decisionMakers.length;
    const championPresence = network.champions.some(id => network.decisionCommittee.includes(id)) ? 20 : 0;
    const blockerRisk = network.blockers.some(id => network.decisionCommittee.includes(id)) ? -30 : 0;

    return Math.max(0, Math.min(100, Math.round((avgInfluence * 0.4) + (avgEngagement * 0.4) + championPresence + blockerRisk)));
  }

  private generateRecommendedActions(network: StakeholderNetwork, industry: Industry): string[] {
    const actions: string[] = [];
    const stakeholders = Array.from(network.stakeholders.values());

    if (network.champions.length === 0) {
      actions.push('Identify and cultivate internal champions');
    }

    if (network.blockers.length > 0) {
      actions.push('Address concerns from potential blockers');
    }

    const lowEngagement = stakeholders.filter(s => s.engagement < 30);
    if (lowEngagement.length > 0) {
      actions.push(`Re-engage ${lowEngagement.length} low-engagement stakeholders`);
    }

    if (network.networkStrength < 50) {
      actions.push('Strengthen overall stakeholder relationships');
    }

    return actions;
  }

  private identifyRiskFactors(network: StakeholderNetwork, industry: Industry): string[] {
    const risks: string[] = [];

    if (network.blockers.length > network.champions.length) {
      risks.push('More blockers than champions in the network');
    }

    if (network.networkHealth === 'at_risk') {
      risks.push('Overall network health is at risk');
    }

    const activeStakeholders = Array.from(network.stakeholders.values()).filter(s =>
      Date.parse(s.lastEngagementDate) > Date.now() - (14 * 24 * 60 * 60 * 1000)
    );

    if (activeStakeholders.length < network.stakeholders.size * 0.5) {
      risks.push('More than 50% of stakeholders are inactive');
    }

    return risks;
  }

  private identifyOpportunities(network: StakeholderNetwork, industry: Industry): string[] {
    const opportunities: string[] = [];
    const stakeholders = Array.from(network.stakeholders.values());

    const highInfluenceLowEngagement = stakeholders.filter(s =>
      s.overallInfluenceScore >= 70 && s.engagement <= 40
    );

    if (highInfluenceLowEngagement.length > 0) {
      opportunities.push(`${highInfluenceLowEngagement.length} high-influence stakeholders with low engagement`);
    }

    const growingEngagement = stakeholders.filter(s => s.engagementTrend === 'increasing');
    if (growingEngagement.length > 0) {
      opportunities.push(`${growingEngagement.length} stakeholders with increasing engagement`);
    }

    if (network.champions.length > 0) {
      opportunities.push('Leverage existing champions for expansion');
    }

    return opportunities;
  }

  private generateNextBestActions(network: StakeholderNetwork, industry: Industry): Array<{
    stakeholderId: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: number;
  }> {
    const actions: Array<{
      stakeholderId: string;
      action: string;
      priority: 'high' | 'medium' | 'low';
      expectedImpact: number;
    }> = [];
    const stakeholders = Array.from(network.stakeholders.values());

    // High-priority actions for high-influence, low-engagement stakeholders
    stakeholders
      .filter(s => s.overallInfluenceScore >= 70 && s.engagement <= 40)
      .forEach(stakeholder => {
        actions.push({
          stakeholderId: stakeholder.stakeholderId,
          action: `Schedule high-touch engagement session`,
          priority: 'high' as const,
          expectedImpact: 85
        });
      });

    // Medium-priority actions for growing engagement
    stakeholders
      .filter(s => s.engagementTrend === 'increasing' && s.overallInfluenceScore >= 50)
      .forEach(stakeholder => {
        actions.push({
          stakeholderId: stakeholder.stakeholderId,
          action: `Maintain engagement momentum`,
          priority: 'medium' as const,
          expectedImpact: 70
        });
      });

    // Low-priority actions for low-risk maintenance
    stakeholders
      .filter(s => s.engagement >= 60 && s.relationshipStrength >= 70)
      .forEach(stakeholder => {
        actions.push({
          stakeholderId: stakeholder.stakeholderId,
          action: `Regular check-in and update`,
          priority: 'low' as const,
          expectedImpact: 50
        });
      });

    return actions.slice(0, 10); // Return top 10 actions
  }
}

export default StakeholderInfluenceAnalyticsService;
