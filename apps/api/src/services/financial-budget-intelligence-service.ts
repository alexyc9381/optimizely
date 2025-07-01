import { EventEmitter } from 'events';

export enum Industry {
  SAAS = 'saas',
  MANUFACTURING = 'manufacturing',
  HEALTHCARE = 'healthcare',
  FINTECH = 'fintech',
  COLLEGE_CONSULTING = 'college_consulting'
}

export enum FinancialIndicatorType {
  // College Consulting
  FAMILY_INCOME = 'family_income',
  FINANCIAL_AID_ELIGIBILITY = 'financial_aid_eligibility',
  SCHOLARSHIP_POTENTIAL = 'scholarship_potential',
  TUITION_AFFORDABILITY = 'tuition_affordability',
  LOAN_CAPACITY = 'loan_capacity',
  PAYMENT_PLAN_ELIGIBILITY = 'payment_plan_eligibility',

  // SaaS
  ANNUAL_CONTRACT_VALUE = 'annual_contract_value',
  BUDGET_APPROVAL_CYCLE = 'budget_approval_cycle',
  PAYMENT_TERMS_PREFERENCE = 'payment_terms_preference',
  PROCUREMENT_AUTHORITY = 'procurement_authority',
  RENEWAL_BUDGET_STATUS = 'renewal_budget_status',
  EXPANSION_BUDGET = 'expansion_budget',

  // Manufacturing
  CAPITAL_EXPENDITURE_BUDGET = 'capital_expenditure_budget',
  PROCUREMENT_CYCLE_TIMING = 'procurement_cycle_timing',
  SUPPLIER_PAYMENT_TERMS = 'supplier_payment_terms',
  CREDIT_RATING = 'credit_rating',
  CASH_FLOW_STATUS = 'cash_flow_status',
  INVESTMENT_APPROVAL_PROCESS = 'investment_approval_process',

  // Healthcare
  REIMBURSEMENT_CAPABILITY = 'reimbursement_capability',
  BUDGET_ALLOCATION = 'budget_allocation',
  ROI_REQUIREMENTS = 'roi_requirements',
  PAYMENT_PROCESSING_CAPABILITY = 'payment_processing_capability',
  INSURANCE_COVERAGE = 'insurance_coverage',
  COMPLIANCE_BUDGET = 'compliance_budget',

  // FinTech
  INVESTMENT_READINESS = 'investment_readiness',
  REGULATORY_CAPITAL = 'regulatory_capital',
  OPERATIONAL_BUDGET = 'operational_budget',
  TECHNOLOGY_INVESTMENT = 'technology_investment',
  COMPLIANCE_SPEND = 'compliance_spend',
  GROWTH_CAPITAL = 'growth_capital'
}

export enum FinancialHealthStatus {
  EXCELLENT = 'excellent',      // 90-100
  GOOD = 'good',               // 70-89
  FAIR = 'fair',               // 50-69
  POOR = 'poor',               // 30-49
  CRITICAL = 'critical'        // 0-29
}

export enum PaymentCapability {
  IMMEDIATE = 'immediate',
  SHORT_TERM = 'short_term',    // 1-30 days
  MEDIUM_TERM = 'medium_term',  // 31-90 days
  LONG_TERM = 'long_term',      // 91+ days
  FINANCING_REQUIRED = 'financing_required'
}

export interface FinancialProfile {
  id: string;
  customerId: string;
  industry: Industry;
  financialHealthScore: number; // 0-100
  financialHealthStatus: FinancialHealthStatus;
  paymentCapability: PaymentCapability;
  budgetCycle: {
    cycleType: 'monthly' | 'quarterly' | 'annual' | 'project_based';
    nextBudgetPeriod: string;
    currentBudgetUtilization: number; // 0-100%
    remainingBudget: number;
    totalBudget: number;
  };
  indicators: FinancialIndicator[];
  industrySpecificData: {
    // College Consulting
    expectedFamilyContribution?: number;
    financialAidAmount?: number;
    scholarshipTotal?: number;

    // SaaS
    contractValue?: number;
    paymentTerms?: number; // days
    budgetApprovalLevel?: 'individual' | 'team' | 'department' | 'executive';

    // Manufacturing
    creditScore?: number;
    annualRevenue?: number;
    capitalExpenditureRatio?: number;

    // Healthcare
    averageReimbursementRate?: number;
    patientVolumeCapacity?: number;
    insuranceContracts?: number;

    // FinTech
    fundingRounds?: number;
    regulatoryCapitalRatio?: number;
    monthlyBurnRate?: number;
  };
  riskFactors: string[];
  opportunities: string[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
    timeframe: string;
    costEstimate?: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface FinancialIndicator {
  id: string;
  type: FinancialIndicatorType;
  value: number;
  currency: string;
  confidence: number; // 0-100
  source: 'declared' | 'inferred' | 'third_party' | 'behavioral';
  lastUpdated: string;
  trendData?: {
    direction: 'increasing' | 'stable' | 'decreasing';
    percentChange: number;
    timeframe: string;
  };
}

export interface BudgetApprovalPrediction {
  customerId: string;
  industry: Industry;
  proposalAmount: number;
  currency: string;
  approvalProbability: number; // 0-100
  expectedTimeToApproval: number; // days
  requiredApprovers: string[];
  optimizationSuggestions: {
    adjustedAmount?: number;
    adjustedTerms?: string[];
    timingRecommendations?: string;
  };
  riskFactors: string[];
}

class FinancialBudgetIntelligenceService extends EventEmitter {
  private static _instance: FinancialBudgetIntelligenceService;
  private financialProfiles: Map<string, FinancialProfile> = new Map();
  private customerProfilesIndex: Map<string, string> = new Map();
  private industryProfilesIndex: Map<Industry, string[]> = new Map();

  private constructor() {
    super();
    this.initializeIndustryConfigurations();
  }

  static getInstance(): FinancialBudgetIntelligenceService {
    if (!FinancialBudgetIntelligenceService._instance) {
      FinancialBudgetIntelligenceService._instance = new FinancialBudgetIntelligenceService();
    }
    return FinancialBudgetIntelligenceService._instance;
  }

  private initializeIndustryConfigurations(): void {
    Object.values(Industry).forEach(industry => {
      this.industryProfilesIndex.set(industry, []);
    });
  }

  async createFinancialProfile(
    customerId: string,
    industry: Industry,
    indicators: Partial<FinancialIndicator>[],
    options: {
      budgetCycle?: FinancialProfile['budgetCycle'];
      industrySpecificData?: FinancialProfile['industrySpecificData'];
    } = {}
  ): Promise<FinancialProfile> {
    if (!customerId?.trim()) {
      throw new Error('Customer ID is required');
    }

    if (!Object.values(Industry).includes(industry)) {
      throw new Error(`Invalid industry: ${industry}`);
    }

    const profileId = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Process and validate indicators
    const processedIndicators = await this.processIndicators(indicators, industry);

    // Calculate financial health score
    const financialHealthScore = this.calculateFinancialHealthScore(processedIndicators, industry);
    const financialHealthStatus = this.getFinancialHealthStatus(financialHealthScore);

    // Determine payment capability
    const paymentCapability = this.determinePaymentCapability(processedIndicators, financialHealthScore, industry);

    // Set default budget cycle based on industry
    const defaultBudgetCycle = this.getDefaultBudgetCycle(industry);
    const budgetCycle = options.budgetCycle || defaultBudgetCycle;

    const now = new Date().toISOString();

    const profile: FinancialProfile = {
      id: profileId,
      customerId,
      industry,
      financialHealthScore,
      financialHealthStatus,
      paymentCapability,
      budgetCycle,
      indicators: processedIndicators,
      industrySpecificData: options.industrySpecificData || {},
      riskFactors: this.identifyRiskFactors(processedIndicators, industry),
      opportunities: this.identifyOpportunities(processedIndicators, industry),
      recommendations: this.generateRecommendations(processedIndicators, industry, financialHealthScore),
      createdAt: now,
      updatedAt: now
    };

    // Store profile
    this.financialProfiles.set(profileId, profile);
    this.customerProfilesIndex.set(customerId, profileId);

    const industryProfiles = this.industryProfilesIndex.get(industry) || [];
    industryProfiles.push(profileId);
    this.industryProfilesIndex.set(industry, industryProfiles);

    // Emit event
    this.emit('financialProfileCreated', {
      profile,
      customerId,
      industry
    });

    return profile;
  }

  private async processIndicators(indicators: Partial<FinancialIndicator>[], industry: Industry): Promise<FinancialIndicator[]> {
    return indicators.map((indicator, index) => {
      const id = indicator.id || `fi_${Date.now()}_${index}`;

      if (!indicator.type || !Object.values(FinancialIndicatorType).includes(indicator.type)) {
        throw new Error(`Invalid financial indicator type: ${indicator.type}`);
      }

      return {
        id,
        type: indicator.type,
        value: indicator.value || 0,
        currency: indicator.currency || 'USD',
        confidence: indicator.confidence || 80,
        source: indicator.source || 'declared',
        lastUpdated: new Date().toISOString(),
        trendData: indicator.trendData
      } as FinancialIndicator;
    });
  }

  private calculateFinancialHealthScore(indicators: FinancialIndicator[], industry: Industry): number {
    if (indicators.length === 0) return 50; // Default score

    let totalScore = 0;
    let weightSum = 0;

    // Industry-specific weighting
    const industryWeights: Record<Industry, Record<FinancialIndicatorType, number>> = {
      [Industry.COLLEGE_CONSULTING]: {
        [FinancialIndicatorType.FAMILY_INCOME]: 0.3,
        [FinancialIndicatorType.FINANCIAL_AID_ELIGIBILITY]: 0.25,
        [FinancialIndicatorType.SCHOLARSHIP_POTENTIAL]: 0.2,
        [FinancialIndicatorType.TUITION_AFFORDABILITY]: 0.15,
        [FinancialIndicatorType.LOAN_CAPACITY]: 0.1,
      } as any,
      [Industry.SAAS]: {
        [FinancialIndicatorType.ANNUAL_CONTRACT_VALUE]: 0.35,
        [FinancialIndicatorType.BUDGET_APPROVAL_CYCLE]: 0.2,
        [FinancialIndicatorType.PROCUREMENT_AUTHORITY]: 0.25,
        [FinancialIndicatorType.RENEWAL_BUDGET_STATUS]: 0.2,
      } as any,
      [Industry.MANUFACTURING]: {
        [FinancialIndicatorType.CAPITAL_EXPENDITURE_BUDGET]: 0.3,
        [FinancialIndicatorType.CREDIT_RATING]: 0.25,
        [FinancialIndicatorType.CASH_FLOW_STATUS]: 0.25,
        [FinancialIndicatorType.PROCUREMENT_CYCLE_TIMING]: 0.2,
      } as any,
      [Industry.HEALTHCARE]: {
        [FinancialIndicatorType.REIMBURSEMENT_CAPABILITY]: 0.3,
        [FinancialIndicatorType.BUDGET_ALLOCATION]: 0.25,
        [FinancialIndicatorType.ROI_REQUIREMENTS]: 0.25,
        [FinancialIndicatorType.INSURANCE_COVERAGE]: 0.2,
      } as any,
      [Industry.FINTECH]: {
        [FinancialIndicatorType.INVESTMENT_READINESS]: 0.3,
        [FinancialIndicatorType.REGULATORY_CAPITAL]: 0.25,
        [FinancialIndicatorType.OPERATIONAL_BUDGET]: 0.25,
        [FinancialIndicatorType.TECHNOLOGY_INVESTMENT]: 0.2,
      } as any
    };

    indicators.forEach(indicator => {
      const weight = industryWeights[industry][indicator.type] || 0.1;
      const normalizedValue = this.normalizeIndicatorValue(indicator, industry);
      const confidenceAdjustedValue = normalizedValue * (indicator.confidence / 100);

      totalScore += confidenceAdjustedValue * weight;
      weightSum += weight;
    });

    return weightSum > 0 ? Math.min(Math.max(Math.round(totalScore / weightSum * 100), 0), 100) : 50;
  }

  private normalizeIndicatorValue(indicator: FinancialIndicator, industry: Industry): number {
    // Normalize indicator values to 0-1 scale based on industry benchmarks
    // This is simplified - in production, you'd use actual market data
    const value = indicator.value;

    switch (indicator.type) {
      case FinancialIndicatorType.FAMILY_INCOME:
        return Math.min(value / 200000, 1); // Max at $200k
      case FinancialIndicatorType.ANNUAL_CONTRACT_VALUE:
        return Math.min(value / 1000000, 1); // Max at $1M
      case FinancialIndicatorType.CAPITAL_EXPENDITURE_BUDGET:
        return Math.min(value / 10000000, 1); // Max at $10M
      case FinancialIndicatorType.CREDIT_RATING:
        return value / 850; // Credit score out of 850
      default:
        return Math.min(value / 100, 1); // Default normalization
    }
  }

  private getFinancialHealthStatus(score: number): FinancialHealthStatus {
    if (score >= 90) return FinancialHealthStatus.EXCELLENT;
    if (score >= 70) return FinancialHealthStatus.GOOD;
    if (score >= 50) return FinancialHealthStatus.FAIR;
    if (score >= 30) return FinancialHealthStatus.POOR;
    return FinancialHealthStatus.CRITICAL;
  }

  private determinePaymentCapability(indicators: FinancialIndicator[], healthScore: number, industry: Industry): PaymentCapability {
    // Simplified logic based on health score and industry patterns
    if (healthScore >= 90) return PaymentCapability.IMMEDIATE;
    if (healthScore >= 70) return PaymentCapability.SHORT_TERM;
    if (healthScore >= 50) return PaymentCapability.MEDIUM_TERM;
    if (healthScore >= 30) return PaymentCapability.LONG_TERM;
    return PaymentCapability.FINANCING_REQUIRED;
  }

  private getDefaultBudgetCycle(industry: Industry): FinancialProfile['budgetCycle'] {
    const now = new Date();
    const nextQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 1);

    const cycleTypes = {
      [Industry.COLLEGE_CONSULTING]: 'annual' as const,
      [Industry.SAAS]: 'quarterly' as const,
      [Industry.MANUFACTURING]: 'quarterly' as const,
      [Industry.HEALTHCARE]: 'annual' as const,
      [Industry.FINTECH]: 'quarterly' as const
    };

    return {
      cycleType: cycleTypes[industry],
      nextBudgetPeriod: nextQuarter.toISOString().split('T')[0],
      currentBudgetUtilization: 65,
      remainingBudget: 100000,
      totalBudget: 300000
    };
  }

  private identifyRiskFactors(indicators: FinancialIndicator[], industry: Industry): string[] {
    const factors: string[] = [];

    const lowConfidenceIndicators = indicators.filter(i => i.confidence < 60);
    if (lowConfidenceIndicators.length > indicators.length * 0.3) {
      factors.push('High uncertainty in financial data quality');
    }

    // Industry-specific risk factors
    switch (industry) {
      case Industry.COLLEGE_CONSULTING:
        const incomeIndicator = indicators.find(i => i.type === FinancialIndicatorType.FAMILY_INCOME);
        if (incomeIndicator && incomeIndicator.value < 50000) {
          factors.push('Low family income may limit college options');
        }
        break;
      case Industry.SAAS:
        const contractIndicator = indicators.find(i => i.type === FinancialIndicatorType.ANNUAL_CONTRACT_VALUE);
        if (contractIndicator && contractIndicator.value < 10000) {
          factors.push('Small contract size may indicate budget constraints');
        }
        break;
    }

    return factors;
  }

  private identifyOpportunities(indicators: FinancialIndicator[], industry: Industry): string[] {
    const opportunities: string[] = [];

    const strongIndicators = indicators.filter(i => i.confidence > 80 && i.value > 0);
    if (strongIndicators.length > indicators.length * 0.6) {
      opportunities.push('Strong financial indicators suggest growth potential');
    }

    return opportunities;
  }

  private generateRecommendations(indicators: FinancialIndicator[], industry: Industry, healthScore: number): FinancialProfile['recommendations'] {
    const recommendations: FinancialProfile['recommendations'] = [];

    if (healthScore < 50) {
      recommendations.push({
        priority: 'high',
        action: 'Improve financial health metrics',
        expectedImpact: 'Enhanced approval probability and better terms',
        timeframe: '1-3 months',
        costEstimate: 5000
      });
    }

    if (healthScore >= 80) {
      recommendations.push({
        priority: 'medium',
        action: 'Consider premium service tiers',
        expectedImpact: 'Access to enhanced features and priority support',
        timeframe: '2-4 weeks'
      });
    }

    return recommendations;
  }

  async updateFinancialProfile(
    profileId: string,
    updates: Partial<FinancialProfile>
  ): Promise<FinancialProfile> {
    const profile = this.financialProfiles.get(profileId);

    if (!profile) {
      throw new Error(`Financial profile not found: ${profileId}`);
    }

    const updatedProfile: FinancialProfile = {
      ...profile,
      ...updates,
      id: profileId,
      updatedAt: new Date().toISOString()
    };

    // Recalculate scores if indicators changed
    if (updates.indicators) {
      updatedProfile.financialHealthScore = this.calculateFinancialHealthScore(updates.indicators, profile.industry);
      updatedProfile.financialHealthStatus = this.getFinancialHealthStatus(updatedProfile.financialHealthScore);
      updatedProfile.paymentCapability = this.determinePaymentCapability(updates.indicators, updatedProfile.financialHealthScore, profile.industry);
    }

    this.financialProfiles.set(profileId, updatedProfile);

    this.emit('financialProfileUpdated', {
      profile: updatedProfile,
      previousProfile: profile,
      changes: updates
    });

    return updatedProfile;
  }

  getFinancialProfile(customerId: string): FinancialProfile | undefined {
    const profileId = this.customerProfilesIndex.get(customerId);
    return profileId ? this.financialProfiles.get(profileId) : undefined;
  }

  async predictBudgetApproval(
    customerId: string,
    proposalAmount: number,
    currency: string = 'USD'
  ): Promise<BudgetApprovalPrediction> {
    const profile = this.getFinancialProfile(customerId);

    if (!profile) {
      throw new Error(`Financial profile not found for customer: ${customerId}`);
    }

    const approvalProbability = this.calculateApprovalProbability(profile, proposalAmount);
    const expectedTimeToApproval = this.estimateApprovalTime(profile, proposalAmount);

    return {
      customerId,
      industry: profile.industry,
      proposalAmount,
      currency,
      approvalProbability,
      expectedTimeToApproval,
      requiredApprovers: this.getRequiredApprovers(profile, proposalAmount),
      optimizationSuggestions: this.generateOptimizationSuggestions(profile, proposalAmount),
      riskFactors: profile.riskFactors
    };
  }

  private calculateApprovalProbability(profile: FinancialProfile, amount: number): number {
    let probability = profile.financialHealthScore;

    // Adjust based on amount relative to budget
    const budgetRatio = amount / profile.budgetCycle.totalBudget;
    if (budgetRatio > 0.5) probability *= 0.7; // Large budget impact
    else if (budgetRatio > 0.2) probability *= 0.9; // Moderate impact

    // Industry-specific adjustments
    const industryMultipliers = {
      [Industry.HEALTHCARE]: 1.1, // Generally more budget available
      [Industry.FINTECH]: 1.05,
      [Industry.SAAS]: 1.0,
      [Industry.MANUFACTURING]: 0.95,
      [Industry.COLLEGE_CONSULTING]: 0.9 // Often budget-constrained
    };

    probability *= industryMultipliers[profile.industry];

    return Math.min(Math.max(Math.round(probability), 0), 100);
  }

  private estimateApprovalTime(profile: FinancialProfile, amount: number): number {
    let baseDays = 14; // Default 2 weeks

    // Adjust based on budget cycle
    if (profile.budgetCycle.cycleType === 'annual') baseDays += 7;
    if (profile.budgetCycle.cycleType === 'project_based') baseDays += 14;

    // Adjust based on amount
    if (amount > 100000) baseDays += 14;
    else if (amount > 50000) baseDays += 7;

    // Industry adjustments
    const industryDayAdjustments = {
      [Industry.HEALTHCARE]: 10, // Longer approval cycles
      [Industry.MANUFACTURING]: 7,
      [Industry.FINTECH]: 5,
      [Industry.SAAS]: 0,
      [Industry.COLLEGE_CONSULTING]: -3 // Often quicker decisions
    };

    baseDays += industryDayAdjustments[profile.industry];

    return Math.max(baseDays, 1);
  }

  private getRequiredApprovers(profile: FinancialProfile, amount: number): string[] {
    const approvers: string[] = ['Budget Manager'];

    if (amount > 50000) approvers.push('Department Head');
    if (amount > 100000) approvers.push('CFO');
    if (amount > 500000) approvers.push('CEO');

    // Industry-specific approvers
    switch (profile.industry) {
      case Industry.HEALTHCARE:
        if (amount > 25000) approvers.push('Clinical Director');
        break;
      case Industry.FINTECH:
        if (amount > 10000) approvers.push('Compliance Officer');
        break;
    }

    return [...new Set(approvers)];
  }

  private generateOptimizationSuggestions(profile: FinancialProfile, amount: number): BudgetApprovalPrediction['optimizationSuggestions'] {
    const suggestions: BudgetApprovalPrediction['optimizationSuggestions'] = {};

    // Amount optimization
    if (amount > profile.budgetCycle.remainingBudget) {
      suggestions.adjustedAmount = Math.floor(profile.budgetCycle.remainingBudget * 0.9);
    }

    // Terms optimization
    if (profile.paymentCapability !== PaymentCapability.IMMEDIATE) {
      suggestions.adjustedTerms = ['Extended payment terms', 'Phased implementation', 'Volume discounts'];
    }

    // Timing recommendations
    const nextBudgetDate = new Date(profile.budgetCycle.nextBudgetPeriod);
    const daysToNextBudget = Math.ceil((nextBudgetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (daysToNextBudget < 60) {
      suggestions.timingRecommendations = `Consider waiting ${daysToNextBudget} days for new budget cycle`;
    }

    return suggestions;
  }

  getIndustryFinancialAnalytics(industry: Industry) {
    const industryProfileIds = this.industryProfilesIndex.get(industry) || [];
    const profiles = industryProfileIds
      .map(id => this.financialProfiles.get(id))
      .filter((p): p is FinancialProfile => !!p);

    if (profiles.length === 0) {
      return null;
    }

    const averageHealthScore = profiles.reduce((sum, p) => sum + p.financialHealthScore, 0) / profiles.length;

    const healthDistribution = {
      excellent: profiles.filter(p => p.financialHealthStatus === FinancialHealthStatus.EXCELLENT).length,
      good: profiles.filter(p => p.financialHealthStatus === FinancialHealthStatus.GOOD).length,
      fair: profiles.filter(p => p.financialHealthStatus === FinancialHealthStatus.FAIR).length,
      poor: profiles.filter(p => p.financialHealthStatus === FinancialHealthStatus.POOR).length,
      critical: profiles.filter(p => p.financialHealthStatus === FinancialHealthStatus.CRITICAL).length
    };

    return {
      industry,
      totalProfiles: profiles.length,
      averageHealthScore: Math.round(averageHealthScore),
      healthDistribution,
      paymentCapabilityBreakdown: this.calculatePaymentCapabilityBreakdown(profiles),
      commonRiskFactors: this.getCommonRiskFactors(profiles),
      lastAnalyzed: new Date().toISOString()
    };
  }

  private calculatePaymentCapabilityBreakdown(profiles: FinancialProfile[]) {
    return {
      immediate: profiles.filter(p => p.paymentCapability === PaymentCapability.IMMEDIATE).length,
      shortTerm: profiles.filter(p => p.paymentCapability === PaymentCapability.SHORT_TERM).length,
      mediumTerm: profiles.filter(p => p.paymentCapability === PaymentCapability.MEDIUM_TERM).length,
      longTerm: profiles.filter(p => p.paymentCapability === PaymentCapability.LONG_TERM).length,
      financingRequired: profiles.filter(p => p.paymentCapability === PaymentCapability.FINANCING_REQUIRED).length
    };
  }

  private getCommonRiskFactors(profiles: FinancialProfile[]): string[] {
    const riskFactorCounts = new Map<string, number>();

    profiles.forEach(profile => {
      profile.riskFactors.forEach(factor => {
        riskFactorCounts.set(factor, (riskFactorCounts.get(factor) || 0) + 1);
      });
    });

    return Array.from(riskFactorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor]) => factor);
  }
}

export default FinancialBudgetIntelligenceService;
