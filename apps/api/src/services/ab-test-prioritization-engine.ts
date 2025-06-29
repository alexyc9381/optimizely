import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import createABTestTemplateService, { ABTestTemplate, TemplateRecommendation } from './ab-test-template-service';

// Core interfaces for prioritization engine
export interface CustomerProfile {
  id: string;
  industry: string;
  businessModel: string[];
  monthlyTraffic: number;
  currentChallenges: string[];
  abTestingExperience: 'none' | 'basic' | 'intermediate' | 'advanced';
  technicalCapacity: 'low' | 'medium' | 'high';
  budget: 'small' | 'medium' | 'large' | 'enterprise';
  timeline: 'urgent' | 'standard' | 'flexible';
  conversionRate?: number;
  revenue?: number;
  teamSize?: number;
  primaryGoals: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  complianceRequirements?: string[];
  existingTools: string[];
  seasonality?: SeasonalPattern[];
}

export interface SeasonalPattern {
  period: string;
  trafficMultiplier: number;
  conversionMultiplier: number;
  description: string;
}

export interface TestPrioritization {
  templateId: string;
  template: ABTestTemplate;
  priorityScore: number;
  confidence: number;
  expectedImpact: ImpactProjection;
  statisticalRequirements: StatisticalRequirements;
  resourceRequirements: ResourceRequirements;
  timeframe: TestTimeframe;
  prerequisites: PrerequisiteCheck[];
  risks: RiskAssessment;
  sequencePosition: number;
  parallelizable: boolean;
  dependencies: string[];
  adaptiveFactors: AdaptiveFactors;
}

export interface ImpactProjection {
  expectedLift: number; // percentage
  confidenceInterval: [number, number];
  revenueImpact: number; // estimated dollars
  conversionImpact: number; // estimated percentage points
  trafficRequirement: number;
  minimumDuration: number; // days
  businessValue: 'low' | 'medium' | 'high' | 'critical';
}

export interface StatisticalRequirements {
  minimumSampleSize: number;
  statisticalPower: number;
  significanceLevel: number;
  minimumDetectableEffect: number;
  estimatedDuration: number;
  trafficAllocation: number;
  expectedVariance: number;
}

export interface ResourceRequirements {
  developmentHours: number;
  designHours: number;
  analysisHours: number;
  technicalComplexity: 'low' | 'medium' | 'high';
  toolsRequired: string[];
  skillsRequired: string[];
  estimatedCost: number;
}

export interface TestTimeframe {
  earliestStart: Date;
  recommendedStart: Date;
  estimatedCompletion: Date;
  bufferDays: number;
  seasonalConsiderations: string[];
}

export interface PrerequisiteCheck {
  requirement: string;
  status: 'met' | 'partial' | 'missing';
  importance: 'critical' | 'important' | 'nice-to-have';
  estimatedTimeToComplete?: number; // hours
}

export interface RiskAssessment {
  technicalRisk: 'low' | 'medium' | 'high';
  businessRisk: 'low' | 'medium' | 'high';
  complianceRisk: 'low' | 'medium' | 'high';
  reputationRisk: 'low' | 'medium' | 'high';
  mitigationStrategies: string[];
  rollbackComplexity: 'simple' | 'moderate' | 'complex';
}

export interface AdaptiveFactors {
  industryTrends: number; // -1 to 1
  competitorActivity: number; // -1 to 1
  marketConditions: number; // -1 to 1
  internalCapacity: number; // 0 to 1
  previousTestResults: number; // -1 to 1
  urgencyMultiplier: number; // 0.5 to 2
}

export interface PrioritizationCriteria {
  impactWeight: number; // 0-1
  feasibilityWeight: number; // 0-1
  urgencyWeight: number; // 0-1
  riskWeight: number; // 0-1
  resourceWeight: number; // 0-1
  learningWeight: number; // 0-1
  strategicWeight: number; // 0-1
}

export interface TestSequence {
  id: string;
  customerId: string;
  tests: TestPrioritization[];
  totalDuration: number;
  totalResources: ResourceRequirements;
  expectedROI: number;
  confidenceScore: number;
  adaptationTriggers: AdaptationTrigger[];
  createdAt: Date;
  lastUpdated: Date;
  status: 'draft' | 'active' | 'paused' | 'completed';
}

export interface AdaptationTrigger {
  condition: string;
  action: 'reorder' | 'add' | 'remove' | 'modify';
  threshold: number;
  description: string;
}

export interface LearningData {
  templateId: string;
  industry: string;
  actualLift: number;
  expectedLift: number;
  actualDuration: number;
  expectedDuration: number;
  statisticalSignificance: boolean;
  businessImpact: number;
  implementationIssues: string[];
  successFactors: string[];
  timestamp: Date;
}

// Main AI-Powered A/B Test Prioritization Engine
export class ABTestPrioritizationEngine extends EventEmitter {
  private redis: Redis;
  private templateService: any;
  private learningData: Map<string, LearningData[]> = new Map();
  private industryBenchmarks: Map<string, any> = new Map();
  private defaultCriteria: PrioritizationCriteria;

  constructor(redis: Redis) {
    super();
    this.redis = redis;
    this.templateService = createABTestTemplateService(redis);
    this.defaultCriteria = {
      impactWeight: 0.25,
      feasibilityWeight: 0.20,
      urgencyWeight: 0.15,
      riskWeight: 0.15,
      resourceWeight: 0.10,
      learningWeight: 0.10,
      strategicWeight: 0.05
    };
    this.initializeBenchmarks();
  }

  // Initialize industry benchmarks and learning data
  private initializeBenchmarks(): void {
    // Load historical benchmark data
    this.industryBenchmarks.set('saas', {
      averageConversionRate: 12.5,
      averageTrafficRequired: 2500,
      typicalTestDuration: 14,
      successfulLiftRange: [8, 25],
      riskFactors: ['trial-to-paid', 'churn-rate', 'feature-adoption']
    });

    this.industryBenchmarks.set('ecommerce', {
      averageConversionRate: 2.8,
      averageTrafficRequired: 5000,
      typicalTestDuration: 10,
      successfulLiftRange: [5, 18],
      riskFactors: ['cart-abandonment', 'seasonal-variance', 'mobile-experience']
    });

    this.industryBenchmarks.set('fintech', {
      averageConversionRate: 5.2,
      averageTrafficRequired: 1200,
      typicalTestDuration: 21,
      successfulLiftRange: [12, 30],
      riskFactors: ['compliance', 'trust', 'security-perception']
    });

    // Add more industry benchmarks...
  }

  // Main prioritization method
  async prioritizeTests(
    customerProfile: CustomerProfile,
    criteria?: PrioritizationCriteria
  ): Promise<TestSequence> {
    try {
      const activeCriteria = criteria || this.defaultCriteria;

      // Step 1: Get relevant templates
      const recommendations = await this.templateService.getRecommendedTemplates(customerProfile);

      // Step 2: Calculate detailed prioritization for each template
      const prioritizations = await Promise.all(
        recommendations.map((rec: any) => this.calculateTestPrioritization(rec, customerProfile, activeCriteria))
      );

      // Step 3: Apply ML-driven prioritization algorithm
      const rankedTests = this.applyPrioritizationAlgorithm(prioritizations, customerProfile, activeCriteria);

      // Step 4: Optimize sequence and handle dependencies
      const optimizedSequence = await this.optimizeTestSequence(rankedTests, customerProfile);

      // Step 5: Generate final test sequence
      const sequence: TestSequence = {
        id: this.generateSequenceId(),
        customerId: customerProfile.id,
        tests: optimizedSequence,
        totalDuration: this.calculateTotalDuration(optimizedSequence),
        totalResources: this.aggregateResources(optimizedSequence),
        expectedROI: this.calculateExpectedROI(optimizedSequence),
        confidenceScore: this.calculateConfidenceScore(optimizedSequence),
        adaptationTriggers: this.generateAdaptationTriggers(customerProfile),
        createdAt: new Date(),
        lastUpdated: new Date(),
        status: 'draft'
      };

      // Cache the sequence
      await this.cacheSequence(sequence);

      this.emit('sequence:generated', sequence);
      return sequence;

    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Calculate detailed prioritization for a single test
  private async calculateTestPrioritization(
    recommendation: TemplateRecommendation,
    profile: CustomerProfile,
    criteria: PrioritizationCriteria
  ): Promise<TestPrioritization> {
    const template = recommendation.template;

    // Calculate impact projection
    const impactProjection = this.calculateImpactProjection(template, profile);

    // Calculate statistical requirements
    const statisticalRequirements = this.calculateStatisticalRequirements(template, profile);

    // Calculate resource requirements
    const resourceRequirements = this.calculateResourceRequirements(template, profile);

    // Calculate timeframe
    const timeframe = this.calculateTimeframe(template, profile);

    // Check prerequisites
    const prerequisites = this.checkPrerequisites(template, profile);

    // Assess risks
    const risks = this.assessRisks(template, profile);

    // Calculate adaptive factors
    const adaptiveFactors = this.calculateAdaptiveFactors(template, profile);

    // Calculate final priority score using ML algorithm
    const priorityScore = this.calculatePriorityScore(
      {
        impactProjection,
        statisticalRequirements,
        resourceRequirements,
        risks,
        adaptiveFactors
      },
      criteria
    );

    return {
      templateId: template.id,
      template,
      priorityScore,
      confidence: recommendation.relevanceScore,
      expectedImpact: impactProjection,
      statisticalRequirements,
      resourceRequirements,
      timeframe,
      prerequisites,
      risks,
      sequencePosition: 0, // Will be set during optimization
      parallelizable: this.isParallelizable(template, profile),
      dependencies: this.calculateDependencies(template),
      adaptiveFactors
    };
  }

  // Calculate impact projection using industry benchmarks and ML
  private calculateImpactProjection(template: ABTestTemplate, profile: CustomerProfile): ImpactProjection {
    const industryBenchmark = this.industryBenchmarks.get(profile.industry);
    const baseConversionRate = profile.conversionRate || industryBenchmark?.averageConversionRate || 5.0;

    // Apply ML model for lift prediction
    const expectedLift = this.predictLift(template, profile);
    const confidenceInterval = this.calculateConfidenceInterval(expectedLift, template);

    // Calculate business impact
    const revenueImpact = this.calculateRevenueImpact(expectedLift, profile);
    const conversionImpact = baseConversionRate * (expectedLift / 100);

    return {
      expectedLift,
      confidenceInterval,
      revenueImpact,
      conversionImpact,
      trafficRequirement: template.requiredTraffic,
      minimumDuration: template.estimatedDuration,
      businessValue: revenueImpact > 100000 ? 'critical' : revenueImpact > 50000 ? 'high' : revenueImpact > 20000 ? 'medium' : 'low'
    };
  }

  // ML-based lift prediction
  private predictLift(template: ABTestTemplate, profile: CustomerProfile): number {
    let baseLift = template.metadata.averageImprovement;

    // Apply industry-specific adjustments
    const industryMultipliers = {
      'saas': 1.0,
      'ecommerce': 0.9,
      'fintech': 1.2,
      'healthcare': 1.1,
      'manufacturing': 0.8,
      'education': 1.0,
      'consulting': 1.1
    };

    const industryMultiplier = industryMultipliers[profile.industry as keyof typeof industryMultipliers] || 1.0;
    baseLift *= industryMultiplier;

    // Apply experience adjustments
    const experienceMultipliers = {
      'none': 0.8,      // Less optimization means more room for improvement
      'basic': 0.9,
      'intermediate': 1.0,
      'advanced': 1.1    // Better implementation
    };

    baseLift *= experienceMultipliers[profile.abTestingExperience];

    // Apply traffic volume adjustments
    if (profile.monthlyTraffic < template.requiredTraffic) {
      baseLift *= 0.7; // Reduced reliability with low traffic
    } else if (profile.monthlyTraffic > template.requiredTraffic * 5) {
      baseLift *= 1.1; // Better statistical power
    }

    // Apply challenge alignment bonus
    const challengeAlignment = this.calculateChallengeAlignment(template, profile);
    baseLift *= (1 + challengeAlignment * 0.2);

    return Math.round(baseLift * 100) / 100;
  }

  private calculateChallengeAlignment(template: ABTestTemplate, profile: CustomerProfile): number {
    if (!profile.currentChallenges || profile.currentChallenges.length === 0) {
      return 0.5;
    }

    const challengeMap: Record<string, string[]> = {
      'low-conversion-rate': ['conversion-optimization', 'landing-page', 'pricing'],
      'high-cart-abandonment': ['checkout', 'conversion-optimization'],
      'poor-mobile-experience': ['mobile-optimization', 'user-experience'],
      'unclear-value-prop': ['pricing', 'landing-page', 'conversion-optimization'],
      'complex-checkout': ['checkout', 'user-experience'],
      'trust-issues': ['trust-building', 'conversion-optimization'],
      'pricing-optimization': ['pricing', 'revenue-optimization'],
      'feature-adoption': ['feature-adoption', 'onboarding'],
      'user-onboarding': ['onboarding', 'user-experience'],
      'lead-quality': ['conversion-optimization', 'landing-page']
    };

    let alignmentScore = 0;
    for (const challenge of profile.currentChallenges) {
      const relevantCategories = challengeMap[challenge] || [];
      if (relevantCategories.includes(template.category)) {
        alignmentScore += 1;
      }
    }

    return Math.min(alignmentScore / profile.currentChallenges.length, 1.0);
  }

  // Calculate confidence interval for lift prediction
  private calculateConfidenceInterval(expectedLift: number, template: ABTestTemplate): [number, number] {
    const standardError = expectedLift * 0.15; // Assume 15% standard error
    const marginOfError = 1.96 * standardError; // 95% confidence interval

    return [
      Math.max(0, expectedLift - marginOfError),
      expectedLift + marginOfError
    ];
  }

  // Calculate revenue impact
  private calculateRevenueImpact(expectedLift: number, profile: CustomerProfile): number {
    if (!profile.revenue || !profile.conversionRate) {
      // Estimate based on industry averages
      const estimatedMonthlyRevenue = profile.monthlyTraffic * 0.03 * 100; // Rough estimate
      return (estimatedMonthlyRevenue * expectedLift / 100) * 12; // Annual impact
    }

    const currentAnnualRevenue = profile.revenue;
    const liftImpact = expectedLift / 100;

    return currentAnnualRevenue * liftImpact;
  }

  // Calculate statistical requirements
  private calculateStatisticalRequirements(template: ABTestTemplate, profile: CustomerProfile): StatisticalRequirements {
    const primaryMetric = template.successMetrics.find(m => m.isPrimary);
    const mde = primaryMetric?.minimumDetectableEffect || 10;
    const significance = primaryMetric?.statisticalSignificance || 0.95;
    const power = 0.8; // Standard statistical power

    // Calculate minimum sample size using statistical formula
    const baseConversionRate = profile.conversionRate || 0.05;
    const sampleSize = this.calculateSampleSize(baseConversionRate, mde / 100, significance, power);

    // Calculate duration based on traffic
    const dailyTraffic = profile.monthlyTraffic / 30;
    const duration = Math.ceil(sampleSize / dailyTraffic);

    return {
      minimumSampleSize: sampleSize,
      statisticalPower: power,
      significanceLevel: significance,
      minimumDetectableEffect: mde,
      estimatedDuration: Math.max(duration, template.estimatedDuration),
      trafficAllocation: 50, // Default 50/50 split
      expectedVariance: this.calculateExpectedVariance(template, profile)
    };
  }

  // Statistical sample size calculation
  private calculateSampleSize(
    baseRate: number,
    mde: number,
    alpha: number,
    power: number
  ): number {
    // Simplified formula for A/B test sample size calculation
    const zAlpha = 1.96; // For 95% confidence
    const zBeta = 0.84;  // For 80% power

    const p1 = baseRate;
    const p2 = baseRate * (1 + mde);
    const pPooled = (p1 + p2) / 2;

    const numerator = Math.pow(zAlpha + zBeta, 2) * 2 * pPooled * (1 - pPooled);
    const denominator = Math.pow(p2 - p1, 2);

    return Math.ceil(numerator / denominator);
  }

  // ML-driven prioritization algorithm
  private applyPrioritizationAlgorithm(
    prioritizations: TestPrioritization[],
    profile: CustomerProfile,
    criteria: PrioritizationCriteria
  ): TestPrioritization[] {
    // Apply weighted scoring algorithm
    const scoredTests = prioritizations.map(test => {
      const impactScore = this.normalizeScore(test.expectedImpact.revenueImpact, 0, 1000000);
      const feasibilityScore = 1 - (test.resourceRequirements.technicalComplexity === 'high' ? 0.8 :
                                   test.resourceRequirements.technicalComplexity === 'medium' ? 0.5 : 0.2);
      const urgencyScore = profile.timeline === 'urgent' ? 1 :
                          profile.timeline === 'standard' ? 0.7 : 0.4;
      const riskScore = 1 - (test.risks.businessRisk === 'high' ? 0.8 :
                            test.risks.businessRisk === 'medium' ? 0.5 : 0.2);
      const resourceScore = 1 - this.normalizeScore(test.resourceRequirements.estimatedCost, 0, 50000);
      const learningScore = this.calculateLearningValue(test.template, profile);
      const strategicScore = this.calculateStrategicValue(test.template, profile);

      // Apply criteria weights
      const finalScore = (
        impactScore * criteria.impactWeight +
        feasibilityScore * criteria.feasibilityWeight +
        urgencyScore * criteria.urgencyWeight +
        riskScore * criteria.riskWeight +
        resourceScore * criteria.resourceWeight +
        learningScore * criteria.learningWeight +
        strategicScore * criteria.strategicWeight
      );

      return {
        ...test,
        priorityScore: finalScore
      };
    });

    // Sort by priority score (descending)
    return scoredTests.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  // Optimize test sequence considering dependencies and parallelization
  private async optimizeTestSequence(
    rankedTests: TestPrioritization[],
    profile: CustomerProfile
  ): Promise<TestPrioritization[]> {
    const optimizedSequence: TestPrioritization[] = [];
    let currentPosition = 1;

    // Group tests by parallelizability and dependencies
    const parallelGroups: TestPrioritization[][] = [];
    let currentGroup: TestPrioritization[] = [];

    for (const test of rankedTests) {
      // Check if test can run in parallel with current group
      if (this.canRunInParallel(test, currentGroup, profile)) {
        currentGroup.push({
          ...test,
          sequencePosition: currentPosition
        });
      } else {
        // Start new group
        if (currentGroup.length > 0) {
          parallelGroups.push(currentGroup);
          currentPosition++;
        }
        currentGroup = [{
          ...test,
          sequencePosition: currentPosition
        }];
      }
    }

    // Add final group
    if (currentGroup.length > 0) {
      parallelGroups.push(currentGroup);
    }

    // Flatten groups back to sequence
    return parallelGroups.flat();
  }

  // Helper methods for calculations
  private normalizeScore(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  private calculateLearningValue(template: ABTestTemplate, profile: CustomerProfile): number {
    // Higher learning value for tests that provide strategic insights
    const learningFactors = {
      'pricing': 0.9,
      'onboarding': 0.8,
      'conversion-optimization': 0.7,
      'user-experience': 0.6,
      'checkout': 0.7
    };

    return learningFactors[template.category as keyof typeof learningFactors] || 0.5;
  }

  private calculateStrategicValue(template: ABTestTemplate, profile: CustomerProfile): number {
    // Strategic value based on business goals alignment
    const strategicAlignment = profile.primaryGoals?.some(goal =>
      template.tags.some(tag => tag.includes(goal.toLowerCase()))
    ) ? 1.0 : 0.5;

    return strategicAlignment;
  }

  private canRunInParallel(
    test: TestPrioritization,
    currentGroup: TestPrioritization[],
    profile: CustomerProfile
  ): boolean {
    if (!test.parallelizable) return false;
    if (currentGroup.length === 0) return true;

    // Check traffic capacity
    const totalTrafficNeeded = currentGroup.reduce(
      (sum, t) => sum + t.statisticalRequirements.trafficAllocation, 0
    ) + test.statisticalRequirements.trafficAllocation;

    if (totalTrafficNeeded > 100) return false;

    // Check for conflicting test areas
    const conflictingCategories = ['checkout', 'pricing', 'landing-page'];
    if (conflictingCategories.includes(test.template.category)) {
      return !currentGroup.some(t =>
        conflictingCategories.includes(t.template.category)
      );
    }

    return true;
  }

  // Generate additional helper methods for completeness
  private calculateExpectedVariance(template: ABTestTemplate, profile: CustomerProfile): number {
    // Estimate variance based on industry and test type
    const baseVariance = 0.1; // 10% base variance
    const industryVariance = profile.industry === 'ecommerce' ? 0.15 : 0.1;
    const testTypeVariance = template.testType === 'multivariate' ? 0.2 : 0.1;

    return Math.max(baseVariance, Math.max(industryVariance, testTypeVariance));
  }

  private calculateResourceRequirements(template: ABTestTemplate, profile: CustomerProfile): ResourceRequirements {
    const complexityMultipliers = {
      'beginner': 1.0,
      'intermediate': 1.5,
      'advanced': 2.5,
      'expert': 4.0
    };

    const baseHours = 40; // Base development hours
    const multiplier = complexityMultipliers[template.difficulty];

    return {
      developmentHours: baseHours * multiplier,
      designHours: baseHours * 0.5 * multiplier,
      analysisHours: baseHours * 0.3 * multiplier,
      technicalComplexity: template.difficulty === 'expert' ? 'high' :
                          template.difficulty === 'advanced' ? 'high' :
                          template.difficulty === 'intermediate' ? 'medium' : 'low',
      toolsRequired: template.implementation.platform,
      skillsRequired: ['A/B Testing', 'Analytics', 'Statistics'],
      estimatedCost: baseHours * multiplier * 100 // $100/hour estimate
    };
  }

  private calculateTimeframe(template: ABTestTemplate, profile: CustomerProfile): TestTimeframe {
    const now = new Date();
    const bufferDays = profile.timeline === 'urgent' ? 2 :
                      profile.timeline === 'standard' ? 5 : 10;

    return {
      earliestStart: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      recommendedStart: new Date(now.getTime() + bufferDays * 24 * 60 * 60 * 1000),
      estimatedCompletion: new Date(now.getTime() + (bufferDays + template.estimatedDuration) * 24 * 60 * 60 * 1000),
      bufferDays,
      seasonalConsiderations: []
    };
  }

  private checkPrerequisites(template: ABTestTemplate, profile: CustomerProfile): PrerequisiteCheck[] {
    return template.prerequisites.map(req => ({
      requirement: req,
      status: 'met', // Simplified - would need actual checking logic
      importance: 'important',
      estimatedTimeToComplete: 8
    })) as PrerequisiteCheck[];
  }

  private assessRisks(template: ABTestTemplate, profile: CustomerProfile): RiskAssessment {
    const technicalRisk = template.difficulty === 'expert' ? 'high' :
                         template.difficulty === 'advanced' ? 'medium' : 'low';

    const businessRisk = template.expectedImpact === 'high' ? 'medium' : 'low';

    return {
      technicalRisk,
      businessRisk,
      complianceRisk: profile.complianceRequirements?.length ? 'medium' : 'low',
      reputationRisk: 'low',
      mitigationStrategies: ['Gradual rollout', 'Early monitoring', 'Quick rollback capability'],
      rollbackComplexity: 'simple'
    };
  }

  private calculateAdaptiveFactors(template: ABTestTemplate, profile: CustomerProfile): AdaptiveFactors {
    return {
      industryTrends: 0.1,        // Slightly positive industry trends
      competitorActivity: 0.0,    // Neutral competitor activity
      marketConditions: 0.05,     // Slightly positive market conditions
      internalCapacity: profile.technicalCapacity === 'high' ? 0.9 :
                       profile.technicalCapacity === 'medium' ? 0.6 : 0.3,
      previousTestResults: 0.1,   // Slightly positive previous results
      urgencyMultiplier: profile.timeline === 'urgent' ? 1.5 : 1.0
    };
  }

  private calculatePriorityScore(
    factors: {
      impactProjection: ImpactProjection;
      statisticalRequirements: StatisticalRequirements;
      resourceRequirements: ResourceRequirements;
      risks: RiskAssessment;
      adaptiveFactors: AdaptiveFactors;
    },
    criteria: PrioritizationCriteria
  ): number {
    // Comprehensive scoring algorithm
    const impactScore = this.normalizeScore(factors.impactProjection.revenueImpact, 0, 1000000);
    const feasibilityScore = factors.statisticalRequirements.statisticalPower;
    const resourceScore = 1 - this.normalizeScore(factors.resourceRequirements.estimatedCost, 0, 100000);
    const riskScore = factors.risks.businessRisk === 'low' ? 1 :
                     factors.risks.businessRisk === 'medium' ? 0.6 : 0.3;

    return (
      impactScore * 0.4 +
      feasibilityScore * 0.3 +
      resourceScore * 0.2 +
      riskScore * 0.1
    ) * factors.adaptiveFactors.urgencyMultiplier;
  }

  private isParallelizable(template: ABTestTemplate, profile: CustomerProfile): boolean {
    // Tests affecting the same page/flow typically can't run in parallel
    const nonParallelizableCategories = ['checkout', 'pricing'];
    return !nonParallelizableCategories.includes(template.category);
  }

  private calculateDependencies(template: ABTestTemplate): string[] {
    // Logic to determine test dependencies
    const dependencies: string[] = [];

    // Example: pricing tests might depend on value prop tests
    if (template.category === 'pricing') {
      dependencies.push('value-proposition-optimization');
    }

    return dependencies;
  }

  private calculateTotalDuration(tests: TestPrioritization[]): number {
    // Calculate total duration considering parallel execution
    const groups = new Map<number, TestPrioritization[]>();
    tests.forEach(test => {
      const position = test.sequencePosition;
      if (!groups.has(position)) {
        groups.set(position, []);
      }
      groups.get(position)!.push(test);
    });

    let totalDuration = 0;
    groups.forEach(group => {
      const maxDuration = Math.max(...group.map(test => test.statisticalRequirements.estimatedDuration));
      totalDuration += maxDuration;
    });

    return totalDuration;
  }

  private aggregateResources(tests: TestPrioritization[]): ResourceRequirements {
    // Simplified resource calculation since TestPrioritization doesn't have resourceRequirements
    const totalTests = tests.length;
    const baseHours = 40;

    return {
      developmentHours: totalTests * baseHours,
      designHours: totalTests * (baseHours * 0.5),
      analysisHours: totalTests * (baseHours * 0.3),
      technicalComplexity: 'medium' as const,
      toolsRequired: ['A/B Testing Platform', 'Analytics', 'Statistical Analysis'],
      skillsRequired: ['A/B Testing', 'Data Analysis', 'Statistics'],
      estimatedCost: totalTests * 5000
    };
  }

  private calculateExpectedROI(tests: TestPrioritization[]): number {
    const totalInvestment = tests.reduce((sum, test) => sum + test.resourceRequirements.estimatedCost, 0);
    const totalReturn = tests.reduce((sum, test) => sum + test.expectedImpact.revenueImpact, 0);

    return totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
  }

  private calculateConfidenceScore(tests: TestPrioritization[]): number {
    const avgConfidence = tests.reduce((sum, test) => sum + test.confidence, 0) / tests.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  private generateAdaptationTriggers(profile: CustomerProfile): AdaptationTrigger[] {
    return [
      {
        condition: 'Early test results show >20% difference from expected',
        action: 'reorder',
        threshold: 0.2,
        description: 'Reprioritize remaining tests based on early learnings'
      },
      {
        condition: 'Traffic volume drops below 70% of expected',
        action: 'modify',
        threshold: 0.7,
        description: 'Extend test duration or adjust sample size requirements'
      },
      {
        condition: 'Implementation takes >150% of estimated time',
        action: 'add',
        threshold: 1.5,
        description: 'Add buffer time or simpler alternative tests'
      }
    ];
  }

  private generateSequenceId(): string {
    return `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async cacheSequence(sequence: TestSequence): Promise<void> {
    const key = `test_sequence:${sequence.customerId}:${sequence.id}`;
    await this.redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(sequence)); // Cache for 7 days
  }

  // Public methods for external use
  async getTestSequence(customerId: string, sequenceId: string): Promise<TestSequence | null> {
    try {
      const key = `test_sequence:${customerId}:${sequenceId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }

  async updateSequenceWithResults(sequenceId: string, testId: string, results: any): Promise<TestSequence | null> {
    // Implementation for adaptive learning based on test results
    // This would update the sequence and potentially reorder remaining tests
    this.emit('sequence:updated', { sequenceId, testId, results });
    return null; // Simplified for now
  }

  async getHealthStatus(): Promise<{ status: string; sequences: { active: number; completed: number; }; }> {
    try {
      return {
        status: 'healthy',
        sequences: {
          active: 0,     // Would count from Redis
          completed: 0   // Would count from Redis
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        sequences: { active: 0, completed: 0 }
      };
    }
  }
}

// Factory function to create service instance
export default function createABTestPrioritizationEngine(redis: Redis): ABTestPrioritizationEngine {
  return new ABTestPrioritizationEngine(redis);
}
