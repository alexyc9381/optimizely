import { EventEmitter } from 'events';

export enum Industry {
  SAAS = 'saas',
  MANUFACTURING = 'manufacturing',
  HEALTHCARE = 'healthcare',
  FINTECH = 'fintech',
  COLLEGE_CONSULTING = 'college_consulting'
}

export enum UrgencyType {
  // College Consulting
  APPLICATION_DEADLINE = 'application_deadline',
  FINANCIAL_AID_DEADLINE = 'financial_aid_deadline',
  SCHOLARSHIP_DEADLINE = 'scholarship_deadline',
  EXAM_REGISTRATION = 'exam_registration',
  CAMPUS_VISIT_WINDOW = 'campus_visit_window',

  // SaaS
  CONTRACT_RENEWAL = 'contract_renewal',
  TRIAL_EXPIRY = 'trial_expiry',
  FEATURE_DEPRECATION = 'feature_deprecation',
  COMPLIANCE_AUDIT = 'compliance_audit',
  ONBOARDING_DEADLINE = 'onboarding_deadline',

  // Manufacturing
  PROCUREMENT_CYCLE = 'procurement_cycle',
  PRODUCTION_DEADLINE = 'production_deadline',
  COMPLIANCE_INSPECTION = 'compliance_inspection',
  SUPPLIER_REVIEW = 'supplier_review',
  BUDGET_APPROVAL = 'budget_approval',

  // Healthcare
  REGULATORY_COMPLIANCE = 'regulatory_compliance',
  PATIENT_OUTCOME_REVIEW = 'patient_outcome_review',
  CLINICAL_TRIAL_DEADLINE = 'clinical_trial_deadline',
  ACCREDITATION_RENEWAL = 'accreditation_renewal',
  HIPAA_AUDIT = 'hipaa_audit',

  // FinTech
  REGULATORY_FILING = 'regulatory_filing',
  RISK_ASSESSMENT = 'risk_assessment',
  COMPLIANCE_REVIEW = 'compliance_review',
  AUDIT_PREPARATION = 'audit_preparation',
  LICENSE_RENEWAL = 'license_renewal'
}

export enum UrgencyLevel {
  CRITICAL = 'critical',     // 90-100
  HIGH = 'high',            // 70-89
  MEDIUM = 'medium',        // 40-69
  LOW = 'low',             // 20-39
  MINIMAL = 'minimal'       // 0-19
}

export interface UrgencyEvent {
  id: string;
  customerId: string;
  industry: Industry;
  urgencyType: UrgencyType;
  deadline: string;
  title: string;
  description: string;
  stakeholderIds: string[];

  // Urgency calculation factors
  daysUntilDeadline: number;
  impactScore: number;        // 0-100: Business impact if missed
  preparationTime: number;    // Days typically needed for completion
  complexityScore: number;    // 0-100: How complex the task is
  dependencyCount: number;    // Number of dependent tasks/approvals

  // Calculated scores
  urgencyScore: number;       // 0-100: Overall urgency
  urgencyLevel: UrgencyLevel;
  timelineRisk: number;       // 0-100: Risk of missing deadline

  // Timeline optimization
  recommendedStartDate: string;
  milestones: UrgencyMilestone[];
  criticalPath: string[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  tags: string[];
}

export interface UrgencyMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  daysFromStart: number;
  isCompleted: boolean;
  stakeholderIds: string[];
  dependencies: string[];
}

export interface UrgencyAnalytics {
  industry: Industry;
  totalEvents: number;
  byUrgencyLevel: Record<UrgencyLevel, number>;
  averageUrgencyScore: number;
  timelineRiskDistribution: {
    low: number;      // 0-33
    medium: number;   // 34-66
    high: number;     // 67-100
  };
  completionRates: {
    onTime: number;
    delayed: number;
    missed: number;
  };
  avgPreparationTime: number;
  commonUrgencyTypes: Array<{
    type: UrgencyType;
    count: number;
    avgUrgencyScore: number;
  }>;
}

export interface IndustryUrgencyConfig {
  industry: Industry;
  defaultPreparationTimes: Record<UrgencyType, number>; // Days
  impactWeights: Record<UrgencyType, number>; // 0-100
  complexityFactors: Record<UrgencyType, number>; // 0-100
  seasonalFactors: Record<string, number>; // Month -> multiplier
  stakeholderRequirements: Record<UrgencyType, string[]>; // Required roles
}

class IndustryUrgencyIntelligenceService extends EventEmitter {
  private static _instance: IndustryUrgencyIntelligenceService;
  private urgencyEvents: Map<string, UrgencyEvent> = new Map();
  private customerEvents: Map<string, string[]> = new Map(); // customerId -> eventIds
  private industryAnalytics: Map<Industry, UrgencyAnalytics> = new Map();
  private industryConfigs: Map<Industry, IndustryUrgencyConfig> = new Map();

  private constructor() {
    super();
    this.initializeIndustryConfigs();
    this.initializeAnalytics();
  }

  public static getInstance(): IndustryUrgencyIntelligenceService {
    if (!IndustryUrgencyIntelligenceService._instance) {
      IndustryUrgencyIntelligenceService._instance = new IndustryUrgencyIntelligenceService();
    }
    return IndustryUrgencyIntelligenceService._instance;
  }

  private initializeIndustryConfigs(): void {
    // College Consulting Configuration
    this.industryConfigs.set(Industry.COLLEGE_CONSULTING, {
      industry: Industry.COLLEGE_CONSULTING,
      defaultPreparationTimes: {
        [UrgencyType.APPLICATION_DEADLINE]: 90, // 3 months
        [UrgencyType.FINANCIAL_AID_DEADLINE]: 60, // 2 months
        [UrgencyType.SCHOLARSHIP_DEADLINE]: 45, // 1.5 months
        [UrgencyType.EXAM_REGISTRATION]: 14, // 2 weeks
        [UrgencyType.CAMPUS_VISIT_WINDOW]: 21, // 3 weeks
        [UrgencyType.CONTRACT_RENEWAL]: 30,
        [UrgencyType.TRIAL_EXPIRY]: 30,
        [UrgencyType.FEATURE_DEPRECATION]: 30,
        [UrgencyType.COMPLIANCE_AUDIT]: 30,
        [UrgencyType.ONBOARDING_DEADLINE]: 30,
        [UrgencyType.PROCUREMENT_CYCLE]: 30,
        [UrgencyType.PRODUCTION_DEADLINE]: 30,
        [UrgencyType.COMPLIANCE_INSPECTION]: 30,
        [UrgencyType.SUPPLIER_REVIEW]: 30,
        [UrgencyType.BUDGET_APPROVAL]: 30,
        [UrgencyType.REGULATORY_COMPLIANCE]: 30,
        [UrgencyType.PATIENT_OUTCOME_REVIEW]: 30,
        [UrgencyType.CLINICAL_TRIAL_DEADLINE]: 30,
        [UrgencyType.ACCREDITATION_RENEWAL]: 30,
        [UrgencyType.HIPAA_AUDIT]: 30,
        [UrgencyType.REGULATORY_FILING]: 30,
        [UrgencyType.RISK_ASSESSMENT]: 30,
        [UrgencyType.COMPLIANCE_REVIEW]: 30,
        [UrgencyType.AUDIT_PREPARATION]: 30,
        [UrgencyType.LICENSE_RENEWAL]: 30
      },
      impactWeights: {
        [UrgencyType.APPLICATION_DEADLINE]: 95, // Critical for student
        [UrgencyType.FINANCIAL_AID_DEADLINE]: 90,
        [UrgencyType.SCHOLARSHIP_DEADLINE]: 85,
        [UrgencyType.EXAM_REGISTRATION]: 80,
        [UrgencyType.CAMPUS_VISIT_WINDOW]: 70,
        [UrgencyType.CONTRACT_RENEWAL]: 50,
        [UrgencyType.TRIAL_EXPIRY]: 50,
        [UrgencyType.FEATURE_DEPRECATION]: 50,
        [UrgencyType.COMPLIANCE_AUDIT]: 50,
        [UrgencyType.ONBOARDING_DEADLINE]: 50,
        [UrgencyType.PROCUREMENT_CYCLE]: 50,
        [UrgencyType.PRODUCTION_DEADLINE]: 50,
        [UrgencyType.COMPLIANCE_INSPECTION]: 50,
        [UrgencyType.SUPPLIER_REVIEW]: 50,
        [UrgencyType.BUDGET_APPROVAL]: 50,
        [UrgencyType.REGULATORY_COMPLIANCE]: 50,
        [UrgencyType.PATIENT_OUTCOME_REVIEW]: 50,
        [UrgencyType.CLINICAL_TRIAL_DEADLINE]: 50,
        [UrgencyType.ACCREDITATION_RENEWAL]: 50,
        [UrgencyType.HIPAA_AUDIT]: 50,
        [UrgencyType.REGULATORY_FILING]: 50,
        [UrgencyType.RISK_ASSESSMENT]: 50,
        [UrgencyType.COMPLIANCE_REVIEW]: 50,
        [UrgencyType.AUDIT_PREPARATION]: 50,
        [UrgencyType.LICENSE_RENEWAL]: 50
      },
      complexityFactors: {
        [UrgencyType.APPLICATION_DEADLINE]: 85, // High complexity
        [UrgencyType.FINANCIAL_AID_DEADLINE]: 75,
        [UrgencyType.SCHOLARSHIP_DEADLINE]: 70,
        [UrgencyType.EXAM_REGISTRATION]: 40,
        [UrgencyType.CAMPUS_VISIT_WINDOW]: 50,
        [UrgencyType.CONTRACT_RENEWAL]: 50,
        [UrgencyType.TRIAL_EXPIRY]: 50,
        [UrgencyType.FEATURE_DEPRECATION]: 50,
        [UrgencyType.COMPLIANCE_AUDIT]: 50,
        [UrgencyType.ONBOARDING_DEADLINE]: 50,
        [UrgencyType.PROCUREMENT_CYCLE]: 50,
        [UrgencyType.PRODUCTION_DEADLINE]: 50,
        [UrgencyType.COMPLIANCE_INSPECTION]: 50,
        [UrgencyType.SUPPLIER_REVIEW]: 50,
        [UrgencyType.BUDGET_APPROVAL]: 50,
        [UrgencyType.REGULATORY_COMPLIANCE]: 50,
        [UrgencyType.PATIENT_OUTCOME_REVIEW]: 50,
        [UrgencyType.CLINICAL_TRIAL_DEADLINE]: 50,
        [UrgencyType.ACCREDITATION_RENEWAL]: 50,
        [UrgencyType.HIPAA_AUDIT]: 50,
        [UrgencyType.REGULATORY_FILING]: 50,
        [UrgencyType.RISK_ASSESSMENT]: 50,
        [UrgencyType.COMPLIANCE_REVIEW]: 50,
        [UrgencyType.AUDIT_PREPARATION]: 50,
        [UrgencyType.LICENSE_RENEWAL]: 50
      },
      seasonalFactors: {
        '09': 1.5, // September - application season
        '10': 1.8, // October - peak deadlines
        '11': 2.0, // November - critical month
        '12': 1.9, // December - year-end deadlines
        '01': 1.7, // January - final deadlines
        '02': 1.3, // February - late applications
        '03': 1.0, // March - decisions
        '04': 0.8, // April - decisions
        '05': 0.6, // May - quiet period
        '06': 0.5, // June - summer prep
        '07': 0.7, // July - summer programs
        '08': 1.1  // August - prep for season
      },
      stakeholderRequirements: {
        [UrgencyType.APPLICATION_DEADLINE]: ['student', 'parent', 'counselor'],
        [UrgencyType.FINANCIAL_AID_DEADLINE]: ['parent', 'student', 'financial_advisor'],
        [UrgencyType.SCHOLARSHIP_DEADLINE]: ['student', 'counselor'],
        [UrgencyType.EXAM_REGISTRATION]: ['student', 'parent'],
        [UrgencyType.CAMPUS_VISIT_WINDOW]: ['student', 'parent'],
        [UrgencyType.CONTRACT_RENEWAL]: [],
        [UrgencyType.TRIAL_EXPIRY]: [],
        [UrgencyType.FEATURE_DEPRECATION]: [],
        [UrgencyType.COMPLIANCE_AUDIT]: [],
        [UrgencyType.ONBOARDING_DEADLINE]: [],
        [UrgencyType.PROCUREMENT_CYCLE]: [],
        [UrgencyType.PRODUCTION_DEADLINE]: [],
        [UrgencyType.COMPLIANCE_INSPECTION]: [],
        [UrgencyType.SUPPLIER_REVIEW]: [],
        [UrgencyType.BUDGET_APPROVAL]: [],
        [UrgencyType.REGULATORY_COMPLIANCE]: [],
        [UrgencyType.PATIENT_OUTCOME_REVIEW]: [],
        [UrgencyType.CLINICAL_TRIAL_DEADLINE]: [],
        [UrgencyType.ACCREDITATION_RENEWAL]: [],
        [UrgencyType.HIPAA_AUDIT]: [],
        [UrgencyType.REGULATORY_FILING]: [],
        [UrgencyType.RISK_ASSESSMENT]: [],
        [UrgencyType.COMPLIANCE_REVIEW]: [],
        [UrgencyType.AUDIT_PREPARATION]: [],
        [UrgencyType.LICENSE_RENEWAL]: []
      }
    });

    // SaaS Configuration
    this.industryConfigs.set(Industry.SAAS, {
      industry: Industry.SAAS,
      defaultPreparationTimes: {
        [UrgencyType.CONTRACT_RENEWAL]: 45, // 1.5 months
        [UrgencyType.TRIAL_EXPIRY]: 7, // 1 week
        [UrgencyType.FEATURE_DEPRECATION]: 30, // 1 month
        [UrgencyType.COMPLIANCE_AUDIT]: 21, // 3 weeks
        [UrgencyType.ONBOARDING_DEADLINE]: 14, // 2 weeks
        [UrgencyType.APPLICATION_DEADLINE]: 30,
        [UrgencyType.FINANCIAL_AID_DEADLINE]: 30,
        [UrgencyType.SCHOLARSHIP_DEADLINE]: 30,
        [UrgencyType.EXAM_REGISTRATION]: 30,
        [UrgencyType.CAMPUS_VISIT_WINDOW]: 30,
        [UrgencyType.PROCUREMENT_CYCLE]: 30,
        [UrgencyType.PRODUCTION_DEADLINE]: 30,
        [UrgencyType.COMPLIANCE_INSPECTION]: 30,
        [UrgencyType.SUPPLIER_REVIEW]: 30,
        [UrgencyType.BUDGET_APPROVAL]: 30,
        [UrgencyType.REGULATORY_COMPLIANCE]: 30,
        [UrgencyType.PATIENT_OUTCOME_REVIEW]: 30,
        [UrgencyType.CLINICAL_TRIAL_DEADLINE]: 30,
        [UrgencyType.ACCREDITATION_RENEWAL]: 30,
        [UrgencyType.HIPAA_AUDIT]: 30,
        [UrgencyType.REGULATORY_FILING]: 30,
        [UrgencyType.RISK_ASSESSMENT]: 30,
        [UrgencyType.COMPLIANCE_REVIEW]: 30,
        [UrgencyType.AUDIT_PREPARATION]: 30,
        [UrgencyType.LICENSE_RENEWAL]: 30
      },
      impactWeights: {
        [UrgencyType.CONTRACT_RENEWAL]: 90, // High revenue impact
        [UrgencyType.TRIAL_EXPIRY]: 85, // Critical conversion point
        [UrgencyType.FEATURE_DEPRECATION]: 70,
        [UrgencyType.COMPLIANCE_AUDIT]: 80,
        [UrgencyType.ONBOARDING_DEADLINE]: 75,
        [UrgencyType.APPLICATION_DEADLINE]: 50,
        [UrgencyType.FINANCIAL_AID_DEADLINE]: 50,
        [UrgencyType.SCHOLARSHIP_DEADLINE]: 50,
        [UrgencyType.EXAM_REGISTRATION]: 50,
        [UrgencyType.CAMPUS_VISIT_WINDOW]: 50,
        [UrgencyType.PROCUREMENT_CYCLE]: 50,
        [UrgencyType.PRODUCTION_DEADLINE]: 50,
        [UrgencyType.COMPLIANCE_INSPECTION]: 50,
        [UrgencyType.SUPPLIER_REVIEW]: 50,
        [UrgencyType.BUDGET_APPROVAL]: 50,
        [UrgencyType.REGULATORY_COMPLIANCE]: 50,
        [UrgencyType.PATIENT_OUTCOME_REVIEW]: 50,
        [UrgencyType.CLINICAL_TRIAL_DEADLINE]: 50,
        [UrgencyType.ACCREDITATION_RENEWAL]: 50,
        [UrgencyType.HIPAA_AUDIT]: 50,
        [UrgencyType.REGULATORY_FILING]: 50,
        [UrgencyType.RISK_ASSESSMENT]: 50,
        [UrgencyType.COMPLIANCE_REVIEW]: 50,
        [UrgencyType.AUDIT_PREPARATION]: 50,
        [UrgencyType.LICENSE_RENEWAL]: 50
      },
      complexityFactors: {
        [UrgencyType.CONTRACT_RENEWAL]: 60, // Medium complexity
        [UrgencyType.TRIAL_EXPIRY]: 40, // Lower complexity
        [UrgencyType.FEATURE_DEPRECATION]: 70,
        [UrgencyType.COMPLIANCE_AUDIT]: 80,
        [UrgencyType.ONBOARDING_DEADLINE]: 50,
        [UrgencyType.APPLICATION_DEADLINE]: 50,
        [UrgencyType.FINANCIAL_AID_DEADLINE]: 50,
        [UrgencyType.SCHOLARSHIP_DEADLINE]: 50,
        [UrgencyType.EXAM_REGISTRATION]: 50,
        [UrgencyType.CAMPUS_VISIT_WINDOW]: 50,
        [UrgencyType.PROCUREMENT_CYCLE]: 50,
        [UrgencyType.PRODUCTION_DEADLINE]: 50,
        [UrgencyType.COMPLIANCE_INSPECTION]: 50,
        [UrgencyType.SUPPLIER_REVIEW]: 50,
        [UrgencyType.BUDGET_APPROVAL]: 50,
        [UrgencyType.REGULATORY_COMPLIANCE]: 50,
        [UrgencyType.PATIENT_OUTCOME_REVIEW]: 50,
        [UrgencyType.CLINICAL_TRIAL_DEADLINE]: 50,
        [UrgencyType.ACCREDITATION_RENEWAL]: 50,
        [UrgencyType.HIPAA_AUDIT]: 50,
        [UrgencyType.REGULATORY_FILING]: 50,
        [UrgencyType.RISK_ASSESSMENT]: 50,
        [UrgencyType.COMPLIANCE_REVIEW]: 50,
        [UrgencyType.AUDIT_PREPARATION]: 50,
        [UrgencyType.LICENSE_RENEWAL]: 50
      },
      seasonalFactors: {
        '01': 1.2, // January - budget cycles
        '02': 1.0,
        '03': 1.1, // March - Q1 end
        '04': 1.3, // April - new quarter
        '05': 1.0,
        '06': 1.2, // June - Q2 end
        '07': 1.4, // July - mid-year
        '08': 1.0,
        '09': 1.2, // September - Q3 end
        '10': 1.5, // October - budget planning
        '11': 1.6, // November - year-end push
        '12': 1.8  // December - critical renewals
      },
      stakeholderRequirements: {
        [UrgencyType.CONTRACT_RENEWAL]: ['decision_maker', 'procurement', 'legal'],
        [UrgencyType.TRIAL_EXPIRY]: ['user', 'decision_maker'],
        [UrgencyType.FEATURE_DEPRECATION]: ['technical_champion', 'user'],
        [UrgencyType.COMPLIANCE_AUDIT]: ['compliance_officer', 'legal'],
        [UrgencyType.ONBOARDING_DEADLINE]: ['user', 'admin'],
        [UrgencyType.APPLICATION_DEADLINE]: [],
        [UrgencyType.FINANCIAL_AID_DEADLINE]: [],
        [UrgencyType.SCHOLARSHIP_DEADLINE]: [],
        [UrgencyType.EXAM_REGISTRATION]: [],
        [UrgencyType.CAMPUS_VISIT_WINDOW]: [],
        [UrgencyType.PROCUREMENT_CYCLE]: [],
        [UrgencyType.PRODUCTION_DEADLINE]: [],
        [UrgencyType.COMPLIANCE_INSPECTION]: [],
        [UrgencyType.SUPPLIER_REVIEW]: [],
        [UrgencyType.BUDGET_APPROVAL]: [],
        [UrgencyType.REGULATORY_COMPLIANCE]: [],
        [UrgencyType.PATIENT_OUTCOME_REVIEW]: [],
        [UrgencyType.CLINICAL_TRIAL_DEADLINE]: [],
        [UrgencyType.ACCREDITATION_RENEWAL]: [],
        [UrgencyType.HIPAA_AUDIT]: [],
        [UrgencyType.REGULATORY_FILING]: [],
        [UrgencyType.RISK_ASSESSMENT]: [],
        [UrgencyType.COMPLIANCE_REVIEW]: [],
        [UrgencyType.AUDIT_PREPARATION]: [],
        [UrgencyType.LICENSE_RENEWAL]: []
      }
    });

    // Similar configurations for Manufacturing, Healthcare, and FinTech...
    // (Truncated for brevity - would include all 5 industries)
  }

  private initializeAnalytics(): void {
    Object.values(Industry).forEach(industry => {
      this.industryAnalytics.set(industry, {
        industry,
        totalEvents: 0,
        byUrgencyLevel: {
          [UrgencyLevel.CRITICAL]: 0,
          [UrgencyLevel.HIGH]: 0,
          [UrgencyLevel.MEDIUM]: 0,
          [UrgencyLevel.LOW]: 0,
          [UrgencyLevel.MINIMAL]: 0
        },
        averageUrgencyScore: 0,
        timelineRiskDistribution: {
          low: 0,
          medium: 0,
          high: 0
        },
        completionRates: {
          onTime: 0,
          delayed: 0,
          missed: 0
        },
        avgPreparationTime: 0,
        commonUrgencyTypes: []
      });
    });
  }

  // Core Methods
  public async createUrgencyEvent(
    customerId: string,
    industry: Industry,
    urgencyType: UrgencyType,
    deadline: string,
    eventData: Partial<UrgencyEvent> = {}
  ): Promise<UrgencyEvent> {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const eventId = `urgency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const config = this.industryConfigs.get(industry);

    if (!config) {
      throw new Error(`Industry configuration not found for ${industry}`);
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const preparationTime = config.defaultPreparationTimes[urgencyType] || 30;
    const impactScore = config.impactWeights[urgencyType] || 50;
    const complexityScore = config.complexityFactors[urgencyType] || 50;

    // Calculate urgency score
    const urgencyScore = this.calculateUrgencyScore({
      daysUntilDeadline,
      impactScore,
      preparationTime,
      complexityScore,
      dependencyCount: eventData.dependencyCount || 0,
      industry,
      urgencyType
    });

    const timelineRisk = this.calculateTimelineRisk(daysUntilDeadline, preparationTime, complexityScore);
    const urgencyLevel = this.determineUrgencyLevel(urgencyScore);

    // Generate milestones and critical path
    const milestones = this.generateMilestones(urgencyType, preparationTime, deadline);
    const criticalPath = this.generateCriticalPath(urgencyType, milestones);
    const recommendedStartDate = new Date(deadlineDate.getTime() - (preparationTime * 24 * 60 * 60 * 1000)).toISOString();

    const urgencyEvent: UrgencyEvent = {
      id: eventId,
      customerId,
      industry,
      urgencyType,
      deadline,
      title: eventData.title || this.generateDefaultTitle(urgencyType),
      description: eventData.description || this.generateDefaultDescription(urgencyType, deadline),
      stakeholderIds: eventData.stakeholderIds || config.stakeholderRequirements[urgencyType] || [],
      daysUntilDeadline,
      impactScore,
      preparationTime,
      complexityScore,
      dependencyCount: eventData.dependencyCount || 0,
      urgencyScore,
      urgencyLevel,
      timelineRisk,
      recommendedStartDate,
      milestones,
      criticalPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      tags: eventData.tags || [],
      ...eventData
    };

    // Store the event
    this.urgencyEvents.set(eventId, urgencyEvent);

    // Update customer mapping
    if (!this.customerEvents.has(customerId)) {
      this.customerEvents.set(customerId, []);
    }
    this.customerEvents.get(customerId)!.push(eventId);

    // Update analytics
    this.updateAnalytics(industry, urgencyEvent);

    // Emit event
    this.emit('urgencyEventCreated', urgencyEvent);

    return urgencyEvent;
  }

  public getUrgencyEvent(eventId: string): UrgencyEvent | undefined {
    return this.urgencyEvents.get(eventId);
  }

  public getCustomerUrgencyEvents(customerId: string): UrgencyEvent[] {
    const eventIds = this.customerEvents.get(customerId) || [];
    return eventIds
      .map(id => this.urgencyEvents.get(id))
      .filter((event): event is UrgencyEvent => event !== undefined && event.isActive);
  }

  public getIndustryUrgencyEvents(industry: Industry): UrgencyEvent[] {
    return Array.from(this.urgencyEvents.values())
      .filter(event => event.industry === industry && event.isActive);
  }

  public getCriticalUrgencyEvents(): UrgencyEvent[] {
    return Array.from(this.urgencyEvents.values())
      .filter(event => event.urgencyLevel === UrgencyLevel.CRITICAL && event.isActive)
      .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);
  }

  public async updateUrgencyEvent(eventId: string, updates: Partial<UrgencyEvent>): Promise<UrgencyEvent> {
    const event = this.urgencyEvents.get(eventId);
    if (!event) {
      throw new Error(`Urgency event not found: ${eventId}`);
    }

    const updatedEvent: UrgencyEvent = {
      ...event,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Recalculate scores if relevant fields changed
    if (updates.deadline || updates.impactScore || updates.complexityScore || updates.dependencyCount) {
      const deadlineDate = new Date(updatedEvent.deadline);
      const now = new Date();
      updatedEvent.daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      updatedEvent.urgencyScore = this.calculateUrgencyScore({
        daysUntilDeadline: updatedEvent.daysUntilDeadline,
        impactScore: updatedEvent.impactScore,
        preparationTime: updatedEvent.preparationTime,
        complexityScore: updatedEvent.complexityScore,
        dependencyCount: updatedEvent.dependencyCount,
        industry: updatedEvent.industry,
        urgencyType: updatedEvent.urgencyType
      });

      updatedEvent.timelineRisk = this.calculateTimelineRisk(
        updatedEvent.daysUntilDeadline,
        updatedEvent.preparationTime,
        updatedEvent.complexityScore
      );

      updatedEvent.urgencyLevel = this.determineUrgencyLevel(updatedEvent.urgencyScore);
    }

    this.urgencyEvents.set(eventId, updatedEvent);
    this.emit('urgencyEventUpdated', updatedEvent);

    return updatedEvent;
  }

  public async completeUrgencyEvent(eventId: string, completionData: {
    completedOnTime: boolean;
    actualCompletionDate: string;
    notes?: string;
  }): Promise<UrgencyEvent> {
    const event = await this.updateUrgencyEvent(eventId, {
      isActive: false,
      tags: [...(this.urgencyEvents.get(eventId)?.tags || []), 'completed']
    });

    // Update completion analytics
    const analytics = this.industryAnalytics.get(event.industry);
    if (analytics) {
      if (completionData.completedOnTime) {
        analytics.completionRates.onTime++;
      } else {
        const deadlineDate = new Date(event.deadline);
        const completionDate = new Date(completionData.actualCompletionDate);

        if (completionDate > deadlineDate) {
          analytics.completionRates.missed++;
        } else {
          analytics.completionRates.delayed++;
        }
      }
    }

    this.emit('urgencyEventCompleted', event, completionData);
    return event;
  }

  public getIndustryAnalytics(industry: Industry): UrgencyAnalytics | undefined {
    return this.industryAnalytics.get(industry);
  }

  public getUrgencyInsights(customerId: string): {
    upcomingDeadlines: UrgencyEvent[];
    criticalEvents: UrgencyEvent[];
    timelineConflicts: UrgencyEvent[];
    recommendations: string[];
  } {
    const customerEvents = this.getCustomerUrgencyEvents(customerId);
    const now = new Date();

    const upcomingDeadlines = customerEvents
      .filter(event => {
        const deadline = new Date(event.deadline);
        const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 30 && daysUntil > 0;
      })
      .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);

    const criticalEvents = customerEvents
      .filter(event => event.urgencyLevel === UrgencyLevel.CRITICAL)
      .sort((a, b) => b.urgencyScore - a.urgencyScore);

    const timelineConflicts = this.detectTimelineConflicts(customerEvents);
    const recommendations = this.generateRecommendations(customerEvents);

    return {
      upcomingDeadlines,
      criticalEvents,
      timelineConflicts,
      recommendations
    };
  }

  // Helper Methods
  private calculateUrgencyScore(params: {
    daysUntilDeadline: number;
    impactScore: number;
    preparationTime: number;
    complexityScore: number;
    dependencyCount: number;
    industry: Industry;
    urgencyType: UrgencyType;
  }): number {
    const { daysUntilDeadline, impactScore, preparationTime, complexityScore, dependencyCount, industry, urgencyType } = params;

    // Base urgency from time pressure
    let timeUrgency = 0;
    if (daysUntilDeadline <= 0) {
      timeUrgency = 100; // Overdue
    } else if (daysUntilDeadline <= preparationTime * 0.5) {
      timeUrgency = 90; // Very urgent
    } else if (daysUntilDeadline <= preparationTime) {
      timeUrgency = 70; // Urgent
    } else if (daysUntilDeadline <= preparationTime * 1.5) {
      timeUrgency = 50; // Moderate
    } else {
      timeUrgency = Math.max(10, 50 - (daysUntilDeadline - preparationTime) * 2);
    }

    // Apply impact and complexity weights
    const impactWeight = impactScore / 100;
    const complexityWeight = complexityScore / 100;
    const dependencyPenalty = Math.min(dependencyCount * 5, 20); // Max 20 point penalty

    // Apply seasonal factors
    const config = this.industryConfigs.get(industry);
    const seasonalMultiplier = config?.seasonalFactors[new Date().getMonth().toString().padStart(2, '0')] || 1.0;

    const finalScore = Math.min(100, Math.max(0,
      (timeUrgency * 0.4 + impactScore * 0.3 + complexityScore * 0.2 + dependencyPenalty * 0.1) * seasonalMultiplier
    ));

    return Math.round(finalScore);
  }

  private calculateTimelineRisk(daysUntilDeadline: number, preparationTime: number, complexityScore: number): number {
    const timeBuffer = daysUntilDeadline - preparationTime;
    const complexityFactor = complexityScore / 100;

    let riskScore = 0;

    if (timeBuffer < 0) {
      riskScore = 100; // Already past recommended start
    } else if (timeBuffer < preparationTime * 0.1) {
      riskScore = 85; // Very high risk
    } else if (timeBuffer < preparationTime * 0.25) {
      riskScore = 70; // High risk
    } else if (timeBuffer < preparationTime * 0.5) {
      riskScore = 50; // Medium risk
    } else {
      riskScore = 25; // Low risk
    }

    // Adjust for complexity
    riskScore = Math.min(100, riskScore + (complexityFactor * 15));

    return Math.round(riskScore);
  }

  private determineUrgencyLevel(urgencyScore: number): UrgencyLevel {
    if (urgencyScore >= 90) return UrgencyLevel.CRITICAL;
    if (urgencyScore >= 70) return UrgencyLevel.HIGH;
    if (urgencyScore >= 40) return UrgencyLevel.MEDIUM;
    if (urgencyScore >= 20) return UrgencyLevel.LOW;
    return UrgencyLevel.MINIMAL;
  }

  private generateMilestones(urgencyType: UrgencyType, preparationTime: number, deadline: string): UrgencyMilestone[] {
    const deadlineDate = new Date(deadline);
    const milestones: UrgencyMilestone[] = [];

    // Generate industry-specific milestones based on urgency type
    const milestoneTemplates = this.getMilestoneTemplates(urgencyType);

    milestoneTemplates.forEach((template, index) => {
      const daysFromEnd = Math.floor((preparationTime * template.percentage) / 100);
      const targetDate = new Date(deadlineDate.getTime() - (daysFromEnd * 24 * 60 * 60 * 1000));

      milestones.push({
        id: `milestone_${index + 1}`,
        title: template.title,
        description: template.description,
        targetDate: targetDate.toISOString(),
        daysFromStart: preparationTime - daysFromEnd,
        isCompleted: false,
        stakeholderIds: template.stakeholderIds || [],
        dependencies: template.dependencies || []
      });
    });

    return milestones.sort((a, b) => a.daysFromStart - b.daysFromStart);
  }

  private getMilestoneTemplates(urgencyType: UrgencyType): Array<{
    title: string;
    description: string;
    percentage: number;
    stakeholderIds?: string[];
    dependencies?: string[];
  }> {
    const templates: Record<UrgencyType, Array<any>> = {
      [UrgencyType.APPLICATION_DEADLINE]: [
        { title: 'Document Collection', description: 'Gather all required documents', percentage: 80 },
        { title: 'Essay Completion', description: 'Complete all application essays', percentage: 60 },
        { title: 'Recommendation Letters', description: 'Secure recommendation letters', percentage: 40 },
        { title: 'Application Review', description: 'Final review and submission', percentage: 10 }
      ],
      [UrgencyType.CONTRACT_RENEWAL]: [
        { title: 'Usage Analysis', description: 'Analyze current usage and needs', percentage: 70 },
        { title: 'Negotiation Prep', description: 'Prepare negotiation strategy', percentage: 50 },
        { title: 'Stakeholder Approval', description: 'Get internal approvals', percentage: 30 },
        { title: 'Contract Execution', description: 'Finalize and execute contract', percentage: 10 }
      ],
      // ... other urgency types would have their specific templates
    } as any;

    return templates[urgencyType] || [
      { title: 'Planning Phase', description: 'Initial planning and preparation', percentage: 75 },
      { title: 'Execution Phase', description: 'Main implementation work', percentage: 50 },
      { title: 'Review Phase', description: 'Review and refinement', percentage: 25 },
      { title: 'Completion Phase', description: 'Final completion and submission', percentage: 5 }
    ];
  }

  private generateCriticalPath(urgencyType: UrgencyType, milestones: UrgencyMilestone[]): string[] {
    // Return the milestone IDs in dependency order
    return milestones.map(m => m.id);
  }

  private generateDefaultTitle(urgencyType: UrgencyType): string {
    const titles: Record<UrgencyType, string> = {
      [UrgencyType.APPLICATION_DEADLINE]: 'College Application Deadline',
      [UrgencyType.CONTRACT_RENEWAL]: 'SaaS Contract Renewal',
      [UrgencyType.PROCUREMENT_CYCLE]: 'Manufacturing Procurement Deadline',
      [UrgencyType.REGULATORY_COMPLIANCE]: 'Healthcare Compliance Deadline',
      [UrgencyType.REGULATORY_FILING]: 'FinTech Regulatory Filing',
      // ... other mappings
    } as any;

    return titles[urgencyType] || 'Important Deadline';
  }

  private generateDefaultDescription(urgencyType: UrgencyType, deadline: string): string {
    const deadlineDate = new Date(deadline).toLocaleDateString();
    return `Important ${urgencyType.replace(/_/g, ' ')} deadline on ${deadlineDate}`;
  }

  private detectTimelineConflicts(events: UrgencyEvent[]): UrgencyEvent[] {
    // Detect events with overlapping critical periods
    const conflicts: UrgencyEvent[] = [];

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        const start1 = new Date(event1.recommendedStartDate);
        const end1 = new Date(event1.deadline);
        const start2 = new Date(event2.recommendedStartDate);
        const end2 = new Date(event2.deadline);

        // Check for overlap
        if ((start1 <= end2 && end1 >= start2) &&
            (event1.urgencyLevel === UrgencyLevel.CRITICAL || event2.urgencyLevel === UrgencyLevel.CRITICAL)) {
          if (!conflicts.includes(event1)) conflicts.push(event1);
          if (!conflicts.includes(event2)) conflicts.push(event2);
        }
      }
    }

    return conflicts;
  }

  private generateRecommendations(events: UrgencyEvent[]): string[] {
    const recommendations: string[] = [];

    const criticalEvents = events.filter(e => e.urgencyLevel === UrgencyLevel.CRITICAL);
    const highRiskEvents = events.filter(e => e.timelineRisk > 70);

    if (criticalEvents.length > 0) {
      recommendations.push(`Focus immediately on ${criticalEvents.length} critical deadline${criticalEvents.length > 1 ? 's' : ''}`);
    }

    if (highRiskEvents.length > 0) {
      recommendations.push(`Review timeline for ${highRiskEvents.length} high-risk event${highRiskEvents.length > 1 ? 's' : ''}`);
    }

    const conflicts = this.detectTimelineConflicts(events);
    if (conflicts.length > 0) {
      recommendations.push(`Resolve timeline conflicts between ${conflicts.length} overlapping deadlines`);
    }

    return recommendations;
  }

  private updateAnalytics(industry: Industry, event: UrgencyEvent): void {
    const analytics = this.industryAnalytics.get(industry);
    if (!analytics) return;

    analytics.totalEvents++;
    analytics.byUrgencyLevel[event.urgencyLevel]++;

    // Update average urgency score
    const totalScore = analytics.averageUrgencyScore * (analytics.totalEvents - 1) + event.urgencyScore;
    analytics.averageUrgencyScore = totalScore / analytics.totalEvents;

    // Update timeline risk distribution
    if (event.timelineRisk <= 33) {
      analytics.timelineRiskDistribution.low++;
    } else if (event.timelineRisk <= 66) {
      analytics.timelineRiskDistribution.medium++;
    } else {
      analytics.timelineRiskDistribution.high++;
    }

    // Update common urgency types
    const existingType = analytics.commonUrgencyTypes.find(t => t.type === event.urgencyType);
    if (existingType) {
      existingType.count++;
      existingType.avgUrgencyScore = ((existingType.avgUrgencyScore * (existingType.count - 1)) + event.urgencyScore) / existingType.count;
    } else {
      analytics.commonUrgencyTypes.push({
        type: event.urgencyType,
        count: 1,
        avgUrgencyScore: event.urgencyScore
      });
    }

    // Sort by count
    analytics.commonUrgencyTypes.sort((a, b) => b.count - a.count);
  }
}

export default IndustryUrgencyIntelligenceService;
