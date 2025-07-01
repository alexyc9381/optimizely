/**
 * Multi-Industry Pipeline Management Service
 *
 * Comprehensive customer journey tracking system across multiple industries
 * with industry-specific lifecycle analytics and universal API.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export enum Industry {
  SAAS = 'saas',
  MANUFACTURING = 'manufacturing',
  HEALTHCARE = 'healthcare',
  FINTECH = 'fintech',
  COLLEGE_CONSULTING = 'college_consulting'
}

export enum PipelineStage {
  // Universal stages
  AWARENESS = 'awareness',
  INTEREST = 'interest',
  CONSIDERATION = 'consideration',
  INTENT = 'intent',
  EVALUATION = 'evaluation',
  PURCHASE = 'purchase',
  ONBOARDING = 'onboarding',
  ADOPTION = 'adoption',
  EXPANSION = 'expansion',
  RETENTION = 'retention',
  RENEWAL = 'renewal',
  ADVOCACY = 'advocacy',

  // SaaS specific
  TRIAL_SIGNUP = 'trial_signup',
  TRIAL_ACTIVATION = 'trial_activation',
  FEATURE_ADOPTION = 'feature_adoption',
  UPGRADE_CONSIDERATION = 'upgrade_consideration',
  PLAN_UPGRADE = 'plan_upgrade',

  // Manufacturing specific
  RFQ_SUBMISSION = 'rfq_submission',
  TECHNICAL_REVIEW = 'technical_review',
  QUOTE_GENERATION = 'quote_generation',
  NEGOTIATION = 'negotiation',
  PROCUREMENT_APPROVAL = 'procurement_approval',

  // Healthcare specific
  PATIENT_REGISTRATION = 'patient_registration',
  INITIAL_CONSULTATION = 'initial_consultation',
  TREATMENT_PLANNING = 'treatment_planning',
  TREATMENT_DELIVERY = 'treatment_delivery',
  OUTCOME_MEASUREMENT = 'outcome_measurement',
  FOLLOW_UP = 'follow_up',

  // FinTech specific
  COMPLIANCE_SCREENING = 'compliance_screening',
  RISK_ASSESSMENT = 'risk_assessment',
  REGULATORY_APPROVAL = 'regulatory_approval',
  ACCOUNT_OPENING = 'account_opening',
  SERVICE_ACTIVATION = 'service_activation',

  // College Consulting specific
  INITIAL_INQUIRY = 'initial_inquiry',
  PARENT_MEETING = 'parent_meeting',
  STUDENT_ASSESSMENT = 'student_assessment',
  SCHOOL_LIST_DEVELOPMENT = 'school_list_development',
  APPLICATION_PREPARATION = 'application_preparation',
  APPLICATION_SUBMISSION = 'application_submission',
  DECISION_RECEIVED = 'decision_received',
  ENROLLMENT_DECISION = 'enrollment_decision'
}

export interface PipelineStageMetrics {
  stage: PipelineStage;
  entryTime: string;
  exitTime?: string;
  duration?: number;
  conversionRate: number;
  dropOffRate: number;
  avgTimeInStage: number;
  industryBenchmark: number;
  customMetrics: Record<string, any>;
}

export interface StakeholderData {
  stakeholderId: string;
  role: string;
  influence: number; // 0-100
  engagement: number; // 0-100
  lastInteraction: string;
  industrySpecificRole?: string;
}

export interface CriticalDate {
  dateType: string;
  date: string;
  urgency: number; // 0-100
  industryContext: string;
  description: string;
}

export interface GeographicData {
  region: string;
  country: string;
  state?: string;
  city?: string;
  timezone: string;
  preferences: string[];
}

export interface FinancialData {
  budgetRange: string;
  financialReadiness: number; // 0-100
  paymentCapability: number; // 0-100
  budgetApprovalStage: string;
  industrySpecificFinancials: Record<string, any>;
}

export interface CustomerJourney {
  customerId: string;
  industry: Industry;
  currentStage: PipelineStage;
  stages: PipelineStageMetrics[];
  journeyStartTime: string;
  lastActivity: string;
  totalJourneyTime: number;
  conversionProbability: number;
  industrySpecificData: Record<string, any>;
  stakeholders: StakeholderData[];
  criticalDates: CriticalDate[];
  geographicData?: GeographicData;
  financialData?: FinancialData;
}

export interface IndustryConfig {
  industry: Industry;
  stages: PipelineStage[];
  avgJourneyTime: number;
  keyMetrics: string[];
  stakeholderTypes: string[];
  criticalDateTypes: string[];
  seasonalFactors: Record<string, number>;
}

export interface PipelineAnalytics {
  conversionRates: Record<string, number>;
  avgStageTime: Record<string, number>;
  dropOffPoints: Array<{stage: PipelineStage; rate: number}>;
  industryBenchmarks: Record<string, number>;
  trendAnalysis: Record<string, any>;
  predictiveMetrics: Record<string, any>;
}

// ============================================================================
// INDUSTRY CONFIGURATIONS
// ============================================================================

const INDUSTRY_CONFIGS: Record<Industry, IndustryConfig> = {
  [Industry.SAAS]: {
    industry: Industry.SAAS,
    stages: [
      PipelineStage.AWARENESS,
      PipelineStage.TRIAL_SIGNUP,
      PipelineStage.TRIAL_ACTIVATION,
      PipelineStage.FEATURE_ADOPTION,
      PipelineStage.UPGRADE_CONSIDERATION,
      PipelineStage.PURCHASE,
      PipelineStage.ONBOARDING,
      PipelineStage.ADOPTION,
      PipelineStage.EXPANSION,
      PipelineStage.RETENTION,
      PipelineStage.RENEWAL,
      PipelineStage.ADVOCACY
    ],
    avgJourneyTime: 30, // days
    keyMetrics: ['trial_conversion_rate', 'feature_adoption_rate', 'churn_rate', 'expansion_revenue'],
    stakeholderTypes: ['end_user', 'decision_maker', 'technical_champion', 'budget_owner'],
    criticalDateTypes: ['trial_expiry', 'contract_renewal', 'feature_launch'],
    seasonalFactors: { 'Q4': 1.2, 'Q1': 0.8, 'Q2': 1.0, 'Q3': 1.1 }
  },

  [Industry.MANUFACTURING]: {
    industry: Industry.MANUFACTURING,
    stages: [
      PipelineStage.AWARENESS,
      PipelineStage.RFQ_SUBMISSION,
      PipelineStage.TECHNICAL_REVIEW,
      PipelineStage.QUOTE_GENERATION,
      PipelineStage.NEGOTIATION,
      PipelineStage.PROCUREMENT_APPROVAL,
      PipelineStage.PURCHASE,
      PipelineStage.ONBOARDING,
      PipelineStage.ADOPTION,
      PipelineStage.RETENTION,
      PipelineStage.EXPANSION
    ],
    avgJourneyTime: 120, // days
    keyMetrics: ['rfq_conversion_rate', 'quote_win_rate', 'order_size', 'repeat_order_rate'],
    stakeholderTypes: ['engineer', 'procurement', 'technical_lead', 'budget_approver'],
    criticalDateTypes: ['rfq_deadline', 'production_schedule', 'budget_cycle'],
    seasonalFactors: { 'Q1': 1.1, 'Q2': 1.2, 'Q3': 0.9, 'Q4': 0.8 }
  },

  [Industry.HEALTHCARE]: {
    industry: Industry.HEALTHCARE,
    stages: [
      PipelineStage.AWARENESS,
      PipelineStage.PATIENT_REGISTRATION,
      PipelineStage.INITIAL_CONSULTATION,
      PipelineStage.TREATMENT_PLANNING,
      PipelineStage.TREATMENT_DELIVERY,
      PipelineStage.OUTCOME_MEASUREMENT,
      PipelineStage.FOLLOW_UP,
      PipelineStage.RETENTION,
      PipelineStage.ADVOCACY
    ],
    avgJourneyTime: 90, // days
    keyMetrics: ['patient_satisfaction', 'treatment_adherence', 'outcome_improvement', 'readmission_rate'],
    stakeholderTypes: ['patient', 'physician', 'care_coordinator', 'administrator'],
    criticalDateTypes: ['appointment_schedule', 'treatment_deadline', 'insurance_coverage'],
    seasonalFactors: { 'Q1': 1.3, 'Q2': 0.9, 'Q3': 0.8, 'Q4': 1.0 }
  },

  [Industry.FINTECH]: {
    industry: Industry.FINTECH,
    stages: [
      PipelineStage.AWARENESS,
      PipelineStage.COMPLIANCE_SCREENING,
      PipelineStage.RISK_ASSESSMENT,
      PipelineStage.REGULATORY_APPROVAL,
      PipelineStage.ACCOUNT_OPENING,
      PipelineStage.SERVICE_ACTIVATION,
      PipelineStage.ADOPTION,
      PipelineStage.EXPANSION,
      PipelineStage.RETENTION,
      PipelineStage.ADVOCACY
    ],
    avgJourneyTime: 60, // days
    keyMetrics: ['compliance_pass_rate', 'account_activation_rate', 'transaction_volume', 'regulatory_adherence'],
    stakeholderTypes: ['compliance_officer', 'risk_manager', 'business_user', 'regulatory_contact'],
    criticalDateTypes: ['compliance_deadline', 'regulatory_update', 'audit_schedule'],
    seasonalFactors: { 'Q1': 1.0, 'Q2': 1.1, 'Q3': 1.0, 'Q4': 1.2 }
  },

  [Industry.COLLEGE_CONSULTING]: {
    industry: Industry.COLLEGE_CONSULTING,
    stages: [
      PipelineStage.INITIAL_INQUIRY,
      PipelineStage.PARENT_MEETING,
      PipelineStage.STUDENT_ASSESSMENT,
      PipelineStage.SCHOOL_LIST_DEVELOPMENT,
      PipelineStage.APPLICATION_PREPARATION,
      PipelineStage.APPLICATION_SUBMISSION,
      PipelineStage.DECISION_RECEIVED,
      PipelineStage.ENROLLMENT_DECISION,
      PipelineStage.ADVOCACY
    ],
    avgJourneyTime: 365, // days (full academic year)
    keyMetrics: ['acceptance_rate', 'enrollment_rate', 'parent_satisfaction', 'scholarship_amount'],
    stakeholderTypes: ['student', 'parent', 'counselor', 'financial_advisor'],
    criticalDateTypes: ['application_deadline', 'decision_date', 'enrollment_deadline', 'financial_aid_deadline'],
    seasonalFactors: { 'Sept-Dec': 1.5, 'Jan-Mar': 1.8, 'Apr-May': 1.3, 'Jun-Aug': 0.4 }
  }
};

export class MultiIndustryPipelineManagementService extends EventEmitter {
  private static instance: MultiIndustryPipelineManagementService;
  private journeys: Map<string, CustomerJourney> = new Map();
  private industryAnalytics: Map<Industry, PipelineAnalytics> = new Map();

  private constructor() {
    super();
    this.initializeAnalytics();
  }

  public static getInstance(): MultiIndustryPipelineManagementService {
    if (!MultiIndustryPipelineManagementService.instance) {
      MultiIndustryPipelineManagementService.instance = new MultiIndustryPipelineManagementService();
    }
    return MultiIndustryPipelineManagementService.instance;
  }

  private initializeAnalytics(): void {
    Object.values(Industry).forEach(industry => {
      this.industryAnalytics.set(industry, {
        conversionRates: {},
        avgStageTime: {},
        dropOffPoints: [],
        industryBenchmarks: {},
        trendAnalysis: {},
        predictiveMetrics: {}
      });
    });
  }

  /**
   * Create a new customer journey
   */
  public async createJourney(
    customerId: string,
    industry: Industry,
    initialData?: Partial<CustomerJourney>
  ): Promise<CustomerJourney> {
    const config = INDUSTRY_CONFIGS[industry];
    const initialStage = config.stages[0];

    const journey: CustomerJourney = {
      customerId,
      industry,
      currentStage: initialStage,
      stages: [{
        stage: initialStage,
        entryTime: new Date().toISOString(),
        conversionRate: 1.0,
        dropOffRate: 0.0,
        avgTimeInStage: 0,
        industryBenchmark: this.getIndustryBenchmark(industry, initialStage),
        customMetrics: {}
      }],
      journeyStartTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      totalJourneyTime: 0,
      conversionProbability: this.calculateInitialConversionProbability(industry),
      industrySpecificData: {},
      stakeholders: [],
      criticalDates: [],
      ...initialData
    };

    this.journeys.set(customerId, journey);
    this.emit('journeyCreated', journey);
    return journey;
  }

  /**
   * Advance customer to next stage
   */
  public async advanceStage(
    customerId: string,
    targetStage: PipelineStage,
    metadata?: Record<string, any>
  ): Promise<CustomerJourney> {
    const journey = this.journeys.get(customerId);
    if (!journey) {
      throw new Error(`Journey not found for customer ${customerId}`);
    }

    const config = INDUSTRY_CONFIGS[journey.industry];
    if (!config.stages.includes(targetStage)) {
      throw new Error(`Invalid stage ${targetStage} for industry ${journey.industry}`);
    }

    const currentTime = new Date().toISOString();
    const currentStageMetrics = journey.stages[journey.stages.length - 1];

    // Complete current stage
    currentStageMetrics.exitTime = currentTime;
    currentStageMetrics.duration = Date.parse(currentTime) - Date.parse(currentStageMetrics.entryTime);

    // Add new stage
    const newStageMetrics: PipelineStageMetrics = {
      stage: targetStage,
      entryTime: currentTime,
      conversionRate: this.calculateStageConversionRate(journey.industry, targetStage),
      dropOffRate: this.calculateStageDropOffRate(journey.industry, targetStage),
      avgTimeInStage: this.getAvgTimeInStage(journey.industry, targetStage),
      industryBenchmark: this.getIndustryBenchmark(journey.industry, targetStage),
      customMetrics: metadata || {}
    };

    journey.stages.push(newStageMetrics);
    journey.currentStage = targetStage;
    journey.lastActivity = currentTime;
    journey.totalJourneyTime = Date.parse(currentTime) - Date.parse(journey.journeyStartTime);
    journey.conversionProbability = this.recalculateConversionProbability(journey);

    await this.updateAnalytics(journey);
    this.emit('stageAdvanced', journey, targetStage);
    return journey;
  }

  /**
   * Add stakeholder to journey
   */
  public async addStakeholder(
    customerId: string,
    stakeholder: StakeholderData
  ): Promise<CustomerJourney> {
    const journey = this.journeys.get(customerId);
    if (!journey) {
      throw new Error(`Journey not found for customer ${customerId}`);
    }

    journey.stakeholders.push(stakeholder);
    journey.lastActivity = new Date().toISOString();

    this.emit('stakeholderAdded', journey, stakeholder);
    return journey;
  }

  /**
   * Add critical date to journey
   */
  public async addCriticalDate(
    customerId: string,
    criticalDate: CriticalDate
  ): Promise<CustomerJourney> {
    const journey = this.journeys.get(customerId);
    if (!journey) {
      throw new Error(`Journey not found for customer ${customerId}`);
    }

    journey.criticalDates.push(criticalDate);
    journey.lastActivity = new Date().toISOString();

    // Recalculate urgency-based metrics
    journey.conversionProbability = this.recalculateConversionProbability(journey);

    this.emit('criticalDateAdded', journey, criticalDate);
    return journey;
  }

  /**
   * Get journey by customer ID
   */
  public getJourney(customerId: string): CustomerJourney | undefined {
    return this.journeys.get(customerId);
  }

  /**
   * Get all journeys for an industry
   */
  public getJourneysByIndustry(industry: Industry): CustomerJourney[] {
    return Array.from(this.journeys.values()).filter(journey => journey.industry === industry);
  }

  /**
   * Get industry analytics
   */
  public getIndustryAnalytics(industry: Industry): PipelineAnalytics | undefined {
    return this.industryAnalytics.get(industry);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private calculateInitialConversionProbability(industry: Industry): number {
    const baseRates = {
      [Industry.SAAS]: 0.15,
      [Industry.MANUFACTURING]: 0.25,
      [Industry.HEALTHCARE]: 0.45,
      [Industry.FINTECH]: 0.20,
      [Industry.COLLEGE_CONSULTING]: 0.35
    };

    return baseRates[industry] || 0.2;
  }

  private recalculateConversionProbability(journey: CustomerJourney): number {
    let probability = this.calculateInitialConversionProbability(journey.industry);

    // Adjust based on stage progression
    const stageProgress = journey.stages.length / INDUSTRY_CONFIGS[journey.industry].stages.length;
    probability *= (1 + stageProgress * 0.5);

    // Adjust based on stakeholder engagement
    const avgStakeholderEngagement = journey.stakeholders.length > 0
      ? journey.stakeholders.reduce((sum, s) => sum + s.engagement, 0) / journey.stakeholders.length / 100
      : 0;
    probability *= (1 + avgStakeholderEngagement * 0.3);

    // Adjust based on critical date urgency
    const maxUrgency = Math.max(...journey.criticalDates.map(d => d.urgency), 0) / 100;
    probability *= (1 + maxUrgency * 0.2);

    return Math.min(probability, 1.0);
  }

    private calculateStageConversionRate(industry: Industry, stage: PipelineStage): number {
    const industryRates = {
      [Industry.SAAS]: {
        [PipelineStage.TRIAL_SIGNUP]: 0.85,
        [PipelineStage.TRIAL_ACTIVATION]: 0.65,
        [PipelineStage.FEATURE_ADOPTION]: 0.45,
        [PipelineStage.PURCHASE]: 0.15
      },
      [Industry.MANUFACTURING]: {
        [PipelineStage.RFQ_SUBMISSION]: 0.60,
        [PipelineStage.TECHNICAL_REVIEW]: 0.75,
        [PipelineStage.QUOTE_GENERATION]: 0.80,
        [PipelineStage.NEGOTIATION]: 0.65,
        [PipelineStage.PROCUREMENT_APPROVAL]: 0.40,
        [PipelineStage.PURCHASE]: 0.25
      },
      [Industry.HEALTHCARE]: {
        [PipelineStage.PATIENT_REGISTRATION]: 0.90,
        [PipelineStage.INITIAL_CONSULTATION]: 0.85,
        [PipelineStage.TREATMENT_PLANNING]: 0.80,
        [PipelineStage.TREATMENT_DELIVERY]: 0.95,
        [PipelineStage.OUTCOME_MEASUREMENT]: 0.75,
        [PipelineStage.FOLLOW_UP]: 0.60
      },
      [Industry.FINTECH]: {
        [PipelineStage.COMPLIANCE_SCREENING]: 0.70,
        [PipelineStage.RISK_ASSESSMENT]: 0.85,
        [PipelineStage.REGULATORY_APPROVAL]: 0.60,
        [PipelineStage.ACCOUNT_OPENING]: 0.80,
        [PipelineStage.SERVICE_ACTIVATION]: 0.90,
        [PipelineStage.ADOPTION]: 0.65
      },
      [Industry.COLLEGE_CONSULTING]: {
        [PipelineStage.PARENT_MEETING]: 0.70,
        [PipelineStage.STUDENT_ASSESSMENT]: 0.80,
        [PipelineStage.SCHOOL_LIST_DEVELOPMENT]: 0.85,
        [PipelineStage.APPLICATION_PREPARATION]: 0.90,
        [PipelineStage.APPLICATION_SUBMISSION]: 0.95,
        [PipelineStage.ENROLLMENT_DECISION]: 0.75
      }
    };

    return (industryRates[industry] as any)?.[stage] || 0.5;
  }

  private calculateStageDropOffRate(industry: Industry, stage: PipelineStage): number {
    return 1 - this.calculateStageConversionRate(industry, stage);
  }

    private getAvgTimeInStage(industry: Industry, stage: PipelineStage): number {
    const avgTimes = {
      [Industry.SAAS]: {
        [PipelineStage.TRIAL_SIGNUP]: 1,
        [PipelineStage.TRIAL_ACTIVATION]: 3,
        [PipelineStage.FEATURE_ADOPTION]: 7,
        [PipelineStage.PURCHASE]: 14
      },
      [Industry.MANUFACTURING]: {
        [PipelineStage.RFQ_SUBMISSION]: 5,
        [PipelineStage.TECHNICAL_REVIEW]: 14,
        [PipelineStage.QUOTE_GENERATION]: 7,
        [PipelineStage.NEGOTIATION]: 21,
        [PipelineStage.PROCUREMENT_APPROVAL]: 30,
        [PipelineStage.PURCHASE]: 14
      },
      [Industry.HEALTHCARE]: {
        [PipelineStage.PATIENT_REGISTRATION]: 2,
        [PipelineStage.INITIAL_CONSULTATION]: 7,
        [PipelineStage.TREATMENT_PLANNING]: 14,
        [PipelineStage.TREATMENT_DELIVERY]: 30,
        [PipelineStage.OUTCOME_MEASUREMENT]: 90,
        [PipelineStage.FOLLOW_UP]: 30
      },
      [Industry.FINTECH]: {
        [PipelineStage.COMPLIANCE_SCREENING]: 10,
        [PipelineStage.RISK_ASSESSMENT]: 7,
        [PipelineStage.REGULATORY_APPROVAL]: 21,
        [PipelineStage.ACCOUNT_OPENING]: 5,
        [PipelineStage.SERVICE_ACTIVATION]: 3,
        [PipelineStage.ADOPTION]: 14
      },
      [Industry.COLLEGE_CONSULTING]: {
        [PipelineStage.PARENT_MEETING]: 7,
        [PipelineStage.STUDENT_ASSESSMENT]: 14,
        [PipelineStage.SCHOOL_LIST_DEVELOPMENT]: 30,
        [PipelineStage.APPLICATION_PREPARATION]: 90,
        [PipelineStage.APPLICATION_SUBMISSION]: 30,
        [PipelineStage.ENROLLMENT_DECISION]: 60
      }
    };

    return (avgTimes[industry] as any)?.[stage] || 7;
  }

  private getIndustryBenchmark(industry: Industry, stage: PipelineStage): number {
    return this.calculateStageConversionRate(industry, stage) * 1.1;
  }

  private async updateAnalytics(journey: CustomerJourney): Promise<void> {
    const analytics = this.industryAnalytics.get(journey.industry)!;

    // Update conversion rates
    const currentStageIndex = journey.stages.length - 1;
    if (currentStageIndex > 0) {
      const previousStage = journey.stages[currentStageIndex - 1].stage;
      const currentStage = journey.stages[currentStageIndex].stage;

      const conversionKey = `${previousStage}_to_${currentStage}`;
      analytics.conversionRates[conversionKey] =
        (analytics.conversionRates[conversionKey] || 0) + 0.1;
    }

    this.industryAnalytics.set(journey.industry, analytics);
  }
}

export default MultiIndustryPipelineManagementService;
