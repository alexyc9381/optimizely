import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// Core interfaces for A/B testing
export interface Experiment {
  id: string;
  name: string;
  description: string;
  type: ExperimentType;
  status: ExperimentStatus;
  industry?: string;
  targetSegment?: string;
  hypothesis: string;
  successMetrics: string[];
  startDate: string;
  endDate?: string;
  sampleSize: number;
  variants: ExperimentVariant[];
  trafficAllocation: TrafficAllocation;
  statisticalConfig: StatisticalConfig;
  results?: ExperimentResults;
  metadata: ExperimentMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  isControl: boolean;
  allocation: number; // Percentage of traffic (0-100)
  configuration: VariantConfiguration;
  metrics: VariantMetrics;
}

export interface VariantConfiguration {
  type: ConfigurationType;
  changes: ConfigurationChange[];
  featureFlags?: Record<string, boolean>;
  componentOverrides?: Record<string, any>;
  styleChanges?: Record<string, any>;
  contentChanges?: Record<string, string>;
  behaviorChanges?: Record<string, any>;
}

export interface ConfigurationChange {
  path: string;
  type: 'replace' | 'add' | 'remove' | 'modify';
  oldValue?: any;
  newValue?: any;
  description: string;
}

export interface VariantMetrics {
  participantCount: number;
  conversionRate: number;
  conversionCount: number;
  primaryMetricValue: number;
  secondaryMetrics: Record<string, number>;
  bounceRate: number;
  engagementTime: number;
  completionRate: number;
  errorRate: number;
  performanceImpact: PerformanceMetrics;
  industrySpecificMetrics: Record<string, number>;
}

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionLatency: number;
  errorCount: number;
  crashRate: number;
}

export interface TrafficAllocation {
  method: AllocationMethod;
  segments: TrafficSegment[];
  conditions: AllocationCondition[];
  sticky: boolean; // Whether users stay in the same variant
  rolloutPercentage: number; // Overall experiment exposure
}

export interface TrafficSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria;
  allocation: number;
}

export interface SegmentCriteria {
  industry?: string[];
  userType?: string[];
  geography?: string[];
  deviceType?: string[];
  trafficSource?: string[];
  customAttributes?: Record<string, any>;
}

export interface AllocationCondition {
  attribute: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface StatisticalConfig {
  confidenceLevel: number; // 0.95 for 95% confidence
  powerLevel: number; // 0.8 for 80% power
  minimumDetectableEffect: number; // Minimum effect size to detect
  alphaLevel: number; // 0.05 for 5% significance level
  testType: TestType;
  correctionMethod: CorrectionMethod;
  sequentialTesting: boolean;
  earlyStoppingRules: EarlyStoppingRule[];
}

export interface EarlyStoppingRule {
  type: 'futility' | 'superiority' | 'harm';
  threshold: number;
  checkFrequency: number; // Days between checks
  minSampleSize: number;
}

export interface ExperimentResults {
  statisticalSignificance: boolean;
  pValue: number;
  confidenceInterval: ConfidenceInterval;
  effectSize: number;
  winningVariant?: string;
  recommendations: string[];
  industryInsights: IndustryInsight[];
  riskAssessment: RiskAssessment;
  learnings: string[];
  nextSteps: string[];
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  level: number;
}

export interface IndustryInsight {
  industry: string;
  insight: string;
  evidence: string;
  confidence: number;
  applicability: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  factors: RiskFactor[];
  mitigationStrategies: string[];
}

export interface RiskFactor {
  factor: string;
  severity: number;
  probability: number;
  impact: string;
}

export interface ExperimentMetadata {
  owner: string;
  stakeholders: string[];
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number; // Days
  requiredSampleSize: number;
  businessContext: string;
  technicalNotes: string[];
  dependencies: string[];
  rollbackPlan: string;
}

export interface ParticipantAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: string;
  sessionId: string;
  context: AssignmentContext;
}

export interface AssignmentContext {
  industry: string;
  userSegment: string;
  deviceType: string;
  geography: string;
  trafficSource: string;
  customAttributes: Record<string, any>;
}

export interface ConversionEvent {
  id: string;
  experimentId: string;
  variantId: string;
  userId: string;
  eventType: string;
  value: number;
  timestamp: string;
  metadata: Record<string, any>;
}

export enum ExperimentType {
  DASHBOARD_CONFIG = 'dashboard_config',
  ONBOARDING_FLOW = 'onboarding_flow',
  FEATURE_RECOMMENDATION = 'feature_recommendation',
  UI_COMPONENT = 'ui_component',
  CONTENT_VARIATION = 'content_variation',
  WORKFLOW_OPTIMIZATION = 'workflow_optimization',
  PRICING_STRATEGY = 'pricing_strategy',
  NOTIFICATION_STRATEGY = 'notification_strategy'
}

export enum ConfigurationType {
  FEATURE_FLAG = 'feature_flag',
  COMPONENT_OVERRIDE = 'component_override',
  STYLE_CHANGE = 'style_change',
  CONTENT_CHANGE = 'content_change',
  BEHAVIOR_CHANGE = 'behavior_change',
  LAYOUT_CHANGE = 'layout_change',
  FLOW_CHANGE = 'flow_change'
}

export enum ExperimentStatus {
  DRAFT = 'draft',
  READY = 'ready',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  STOPPED = 'stopped',
  ARCHIVED = 'archived'
}

export enum AllocationMethod {
  RANDOM = 'random',
  HASH_BASED = 'hash_based',
  WEIGHTED = 'weighted',
  SEGMENT_BASED = 'segment_based'
}

export enum TestType {
  TWO_SIDED = 'two_sided',
  ONE_SIDED_GREATER = 'one_sided_greater',
  ONE_SIDED_LESS = 'one_sided_less'
}

export enum CorrectionMethod {
  NONE = 'none',
  BONFERRONI = 'bonferroni',
  BENJAMINI_HOCHBERG = 'benjamini_hochberg',
  HOLM = 'holm'
}

export class ABTestingService extends EventEmitter {
  private static instance: ABTestingService;
  private experiments: Map<string, Experiment> = new Map();
  private assignments: Map<string, ParticipantAssignment[]> = new Map();
  private conversionEvents: ConversionEvent[] = [];
  private activeMonitors: Map<string, NodeJS.Timeout> = new Map();

  // Industry-specific default configurations
  private readonly industryDefaults = {
    saas: {
      primaryMetrics: ['trial_conversion', 'feature_adoption', 'user_engagement'],
      secondaryMetrics: ['time_to_value', 'support_tickets', 'churn_risk'],
      typicalDuration: 14, // days
      minSampleSize: 1000,
      confidenceLevel: 0.95
    },
    manufacturing: {
      primaryMetrics: ['process_efficiency', 'error_reduction', 'time_savings'],
      secondaryMetrics: ['user_satisfaction', 'training_time', 'adoption_rate'],
      typicalDuration: 21, // days
      minSampleSize: 500,
      confidenceLevel: 0.90
    },
    healthcare: {
      primaryMetrics: ['patient_outcomes', 'workflow_efficiency', 'error_reduction'],
      secondaryMetrics: ['user_adoption', 'training_requirements', 'compliance_score'],
      typicalDuration: 30, // days
      minSampleSize: 300,
      confidenceLevel: 0.95
    },
    fintech: {
      primaryMetrics: ['transaction_completion', 'security_compliance', 'user_trust'],
      secondaryMetrics: ['abandonment_rate', 'support_inquiries', 'feature_usage'],
      typicalDuration: 10, // days
      minSampleSize: 2000,
      confidenceLevel: 0.99
    },
    college_consulting: {
      primaryMetrics: ['student_engagement', 'completion_rate', 'satisfaction_score'],
      secondaryMetrics: ['time_on_platform', 'resource_usage', 'goal_achievement'],
      typicalDuration: 28, // days
      minSampleSize: 200,
      confidenceLevel: 0.90
    }
  };

  private constructor() {
    super();
    this.startExperimentMonitoring();
  }

  public static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService();
    }
    return ABTestingService.instance;
  }

  // Experiment Management
  public async createExperiment(experimentData: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const experiment: Experiment = {
      ...experimentData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Apply industry defaults if not specified
    if (experiment.industry) {
      const defaults = this.industryDefaults[experiment.industry as keyof typeof this.industryDefaults];
      if (defaults) {
        experiment.metadata.estimatedDuration = experiment.metadata.estimatedDuration || defaults.typicalDuration;
        experiment.metadata.requiredSampleSize = experiment.metadata.requiredSampleSize || defaults.minSampleSize;
        experiment.statisticalConfig.confidenceLevel = experiment.statisticalConfig.confidenceLevel || defaults.confidenceLevel;
      }
    }

    // Validate experiment configuration
    await this.validateExperiment(experiment);

    // Calculate required sample size if not specified
    if (!experiment.metadata.requiredSampleSize) {
      experiment.metadata.requiredSampleSize = this.calculateRequiredSampleSize(experiment.statisticalConfig);
    }

    this.experiments.set(experiment.id, experiment);
    this.assignments.set(experiment.id, []);

    this.emit('experimentCreated', experiment);

    return experiment.id;
  }

  public async updateExperiment(experimentId: string, updates: Partial<Experiment>): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status === ExperimentStatus.RUNNING) {
      throw new Error('Cannot update running experiment');
    }

    const updatedExperiment = {
      ...experiment,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.validateExperiment(updatedExperiment);
    this.experiments.set(experimentId, updatedExperiment);

    this.emit('experimentUpdated', updatedExperiment);
  }

  public async startExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== ExperimentStatus.READY) {
      throw new Error(`Experiment must be in READY status to start. Current status: ${experiment.status}`);
    }

    // Final validation before starting
    await this.validateExperiment(experiment);

    experiment.status = ExperimentStatus.RUNNING;
    experiment.startDate = new Date().toISOString();
    experiment.updatedAt = new Date().toISOString();

    // Initialize variant metrics
    experiment.variants.forEach(variant => {
      variant.metrics = {
        participantCount: 0,
        conversionRate: 0,
        conversionCount: 0,
        primaryMetricValue: 0,
        secondaryMetrics: {},
        bounceRate: 0,
        engagementTime: 0,
        completionRate: 0,
        errorRate: 0,
        performanceImpact: {
          loadTime: 0,
          renderTime: 0,
          interactionLatency: 0,
          errorCount: 0,
          crashRate: 0
        },
        industrySpecificMetrics: {}
      };
    });

    this.experiments.set(experimentId, experiment);
    this.startExperimentMonitoring(experimentId);

    this.emit('experimentStarted', experiment);
  }

  public async stopExperiment(experimentId: string, reason: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    experiment.status = ExperimentStatus.STOPPED;
    experiment.endDate = new Date().toISOString();
    experiment.updatedAt = new Date().toISOString();

    // Calculate final results
    experiment.results = await this.calculateExperimentResults(experiment);

    this.experiments.set(experimentId, experiment);
    this.stopExperimentMonitoring(experimentId);

    this.emit('experimentStopped', { experiment, reason });
  }

  // Participant Assignment
  public async assignParticipant(userId: string, experimentId: string, context: AssignmentContext): Promise<string> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== ExperimentStatus.RUNNING) {
      throw new Error(`Experiment ${experimentId} is not running`);
    }

    // Check if user is already assigned
    const existingAssignments = this.assignments.get(experimentId) || [];
    const existingAssignment = existingAssignments.find(a => a.userId === userId);

    if (existingAssignment && experiment.trafficAllocation.sticky) {
      return existingAssignment.variantId;
    }

    // Determine if user should be included in experiment
    if (!this.shouldIncludeUser(experiment, context)) {
      throw new Error('User does not meet experiment criteria');
    }

    // Assign variant based on allocation method
    const variantId = this.assignVariant(experiment, userId, context);

    const assignment: ParticipantAssignment = {
      userId,
      experimentId,
      variantId,
      assignedAt: new Date().toISOString(),
      sessionId: uuidv4(),
      context
    };

    existingAssignments.push(assignment);
    this.assignments.set(experimentId, existingAssignments);

    // Update participant count
    const variant = experiment.variants.find(v => v.id === variantId);
    if (variant) {
      variant.metrics.participantCount++;
    }

    this.emit('participantAssigned', assignment);

    return variantId;
  }

  public async recordConversion(
    experimentId: string,
    userId: string,
    eventType: string,
    value: number = 1,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const assignments = this.assignments.get(experimentId) || [];
    const assignment = assignments.find(a => a.userId === userId);

    if (!assignment) {
      throw new Error(`User ${userId} not assigned to experiment ${experimentId}`);
    }

    const conversionEvent: ConversionEvent = {
      id: uuidv4(),
      experimentId,
      variantId: assignment.variantId,
      userId,
      eventType,
      value,
      timestamp: new Date().toISOString(),
      metadata
    };

    this.conversionEvents.push(conversionEvent);

    // Update variant metrics
    const variant = experiment.variants.find(v => v.id === assignment.variantId);
    if (variant) {
      variant.metrics.conversionCount++;
      variant.metrics.conversionRate = variant.metrics.conversionCount / variant.metrics.participantCount;

      if (eventType === 'primary_metric') {
        variant.metrics.primaryMetricValue += value;
      } else {
        variant.metrics.secondaryMetrics[eventType] = (variant.metrics.secondaryMetrics[eventType] || 0) + value;
      }
    }

    this.emit('conversionRecorded', conversionEvent);
  }

  // Statistical Analysis
  private async calculateExperimentResults(experiment: Experiment): Promise<ExperimentResults> {
    const controlVariant = experiment.variants.find(v => v.isControl);
    const testVariants = experiment.variants.filter(v => !v.isControl);

    if (!controlVariant) {
      throw new Error('No control variant found');
    }

    let winningVariant: string | undefined;
    let maxImprovement = 0;
    const results: ExperimentResults = {
      statisticalSignificance: false,
      pValue: 1,
      confidenceInterval: { lower: 0, upper: 0, level: experiment.statisticalConfig.confidenceLevel },
      effectSize: 0,
      recommendations: [],
      industryInsights: [],
      riskAssessment: {
        overallRisk: 'low',
        factors: [],
        mitigationStrategies: []
      },
      learnings: [],
      nextSteps: []
    };

    // Calculate statistical significance for each test variant vs control
    for (const testVariant of testVariants) {
      const testResult = this.performStatisticalTest(
        controlVariant.metrics,
        testVariant.metrics,
        experiment.statisticalConfig
      );

      if (testResult.significant && testResult.improvement > maxImprovement) {
        maxImprovement = testResult.improvement;
        winningVariant = testVariant.id;
        results.statisticalSignificance = true;
        results.pValue = testResult.pValue;
        results.effectSize = testResult.effectSize;
        results.confidenceInterval = testResult.confidenceInterval;
      }
    }

    results.winningVariant = winningVariant;

    // Generate recommendations
    results.recommendations = this.generateRecommendations(experiment, results);

    // Generate industry insights
    results.industryInsights = this.generateIndustryInsights(experiment, results);

    // Assess risks
    results.riskAssessment = this.assessRisks(experiment, results);

    // Extract learnings
    results.learnings = this.extractLearnings(experiment, results);

    // Generate next steps
    results.nextSteps = this.generateNextSteps(experiment, results);

    return results;
  }

  private performStatisticalTest(
    controlMetrics: VariantMetrics,
    testMetrics: VariantMetrics,
    config: StatisticalConfig
  ): {
    significant: boolean;
    pValue: number;
    improvement: number;
    effectSize: number;
    confidenceInterval: ConfidenceInterval;
  } {
    // Z-test for conversion rates (simplified implementation)
    const p1 = controlMetrics.conversionRate;
    const n1 = controlMetrics.participantCount;
    const p2 = testMetrics.conversionRate;
    const n2 = testMetrics.participantCount;

    if (n1 === 0 || n2 === 0) {
      return {
        significant: false,
        pValue: 1,
        improvement: 0,
        effectSize: 0,
        confidenceInterval: { lower: 0, upper: 0, level: config.confidenceLevel }
      };
    }

    const pooledP = (controlMetrics.conversionCount + testMetrics.conversionCount) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));

    const zScore = (p2 - p1) / se;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    const improvement = (p2 - p1) / p1 * 100;
    const effectSize = (p2 - p1) / Math.sqrt(pooledP * (1 - pooledP));

    // Calculate confidence interval
    const seCI = Math.sqrt(p2 * (1 - p2) / n2 + p1 * (1 - p1) / n1);
    const criticalValue = this.getInverseNormalCDF((1 + config.confidenceLevel) / 2);
    const margin = criticalValue * seCI;

    return {
      significant: pValue < config.alphaLevel,
      pValue,
      improvement,
      effectSize,
      confidenceInterval: {
        lower: (p2 - p1) - margin,
        upper: (p2 - p1) + margin,
        level: config.confidenceLevel
      }
    };
  }

  // Utility Methods
  private calculateRequiredSampleSize(config: StatisticalConfig): number {
    // Simplified sample size calculation for conversion rate tests
    const { powerLevel, alphaLevel, minimumDetectableEffect } = config;

    const zAlpha = this.getInverseNormalCDF(1 - alphaLevel / 2);
    const zBeta = this.getInverseNormalCDF(powerLevel);

    // Assuming baseline conversion rate of 5%
    const p1 = 0.05;
    const p2 = p1 * (1 + minimumDetectableEffect);

    const n = Math.pow(zAlpha + zBeta, 2) * (p1 * (1 - p1) + p2 * (1 - p2)) / Math.pow(p2 - p1, 2);

    return Math.ceil(n * 2); // Multiply by 2 for two groups
  }

  private shouldIncludeUser(experiment: Experiment, context: AssignmentContext): boolean {
    // Check rollout percentage
    if (Math.random() > experiment.trafficAllocation.rolloutPercentage / 100) {
      return false;
    }

    // Check allocation conditions
    for (const condition of experiment.trafficAllocation.conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }

    // Check segment criteria
    for (const segment of experiment.trafficAllocation.segments) {
      if (this.matchesSegment(segment.criteria, context)) {
        return Math.random() < segment.allocation / 100;
      }
    }

    return true;
  }

  private assignVariant(experiment: Experiment, userId: string, context: AssignmentContext): string {
    switch (experiment.trafficAllocation.method) {
      case AllocationMethod.HASH_BASED:
        return this.hashBasedAssignment(experiment, userId);
      case AllocationMethod.WEIGHTED:
        return this.weightedAssignment(experiment);
      case AllocationMethod.SEGMENT_BASED:
        return this.segmentBasedAssignment(experiment, context);
      default:
        return this.randomAssignment(experiment);
    }
  }

  private hashBasedAssignment(experiment: Experiment, userId: string): string {
    // Simple hash-based assignment for consistent allocation
    const hash = this.simpleHash(userId + experiment.id);
    const bucket = hash % 100;

    let cumulative = 0;
    for (const variant of experiment.variants) {
      cumulative += variant.allocation;
      if (bucket < cumulative) {
        return variant.id;
      }
    }

    return experiment.variants[0].id;
  }

  private weightedAssignment(experiment: Experiment): string {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of experiment.variants) {
      cumulative += variant.allocation;
      if (random < cumulative) {
        return variant.id;
      }
    }

    return experiment.variants[0].id;
  }

  private segmentBasedAssignment(experiment: Experiment, context: AssignmentContext): string {
    // Find matching segment and use its allocation
    for (const segment of experiment.trafficAllocation.segments) {
      if (this.matchesSegment(segment.criteria, context)) {
        return this.weightedAssignment(experiment);
      }
    }

    return this.weightedAssignment(experiment);
  }

  private randomAssignment(experiment: Experiment): string {
    return this.weightedAssignment(experiment);
  }

  private matchesSegment(criteria: SegmentCriteria, context: AssignmentContext): boolean {
    if (criteria.industry && !criteria.industry.includes(context.industry)) {
      return false;
    }

    if (criteria.userType && !criteria.userType.includes(context.userSegment)) {
      return false;
    }

    if (criteria.geography && !criteria.geography.includes(context.geography)) {
      return false;
    }

    if (criteria.deviceType && !criteria.deviceType.includes(context.deviceType)) {
      return false;
    }

    if (criteria.trafficSource && !criteria.trafficSource.includes(context.trafficSource)) {
      return false;
    }

    if (criteria.customAttributes) {
      for (const [key, value] of Object.entries(criteria.customAttributes)) {
        if (context.customAttributes[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  private evaluateCondition(condition: AllocationCondition, context: AssignmentContext): boolean {
    const contextValue = (context as any)[condition.attribute] || context.customAttributes[condition.attribute];

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'not_equals':
        return contextValue !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(contextValue);
      case 'greater_than':
        return Number(contextValue) > Number(condition.value);
      case 'less_than':
        return Number(contextValue) < Number(condition.value);
      case 'contains':
        return String(contextValue).includes(String(condition.value));
      default:
        return false;
    }
  }

  private async validateExperiment(experiment: Experiment): Promise<void> {
    // Validate variant allocations sum to 100%
    const totalAllocation = experiment.variants.reduce((sum, variant) => sum + variant.allocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error(`Variant allocations must sum to 100%. Current sum: ${totalAllocation}%`);
    }

    // Validate at least one control variant
    const hasControl = experiment.variants.some(variant => variant.isControl);
    if (!hasControl) {
      throw new Error('Experiment must have at least one control variant');
    }

    // Validate statistical configuration
    if (experiment.statisticalConfig.confidenceLevel <= 0 || experiment.statisticalConfig.confidenceLevel >= 1) {
      throw new Error('Confidence level must be between 0 and 1');
    }

    if (experiment.statisticalConfig.powerLevel <= 0 || experiment.statisticalConfig.powerLevel >= 1) {
      throw new Error('Power level must be between 0 and 1');
    }

    // Validate traffic allocation
    if (experiment.trafficAllocation.rolloutPercentage < 0 || experiment.trafficAllocation.rolloutPercentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }
  }

  private generateRecommendations(experiment: Experiment, results: ExperimentResults): string[] {
    const recommendations: string[] = [];

    if (results.statisticalSignificance) {
      recommendations.push(`Implement winning variant ${results.winningVariant} with ${results.effectSize.toFixed(2)} effect size`);
      recommendations.push(`Monitor performance for ${experiment.metadata.estimatedDuration} days post-implementation`);
    } else {
      recommendations.push('Continue experiment or increase sample size for statistical significance');
      recommendations.push('Consider adjusting variant configurations based on preliminary trends');
    }

    if (experiment.industry) {
      const industryDefaults = this.industryDefaults[experiment.industry as keyof typeof this.industryDefaults];
      if (industryDefaults) {
        recommendations.push(`Consider industry-specific metrics: ${industryDefaults.primaryMetrics.join(', ')}`);
      }
    }

    return recommendations;
  }

  private generateIndustryInsights(experiment: Experiment, results: ExperimentResults): IndustryInsight[] {
    const insights: IndustryInsight[] = [];

    if (experiment.industry) {
      insights.push({
        industry: experiment.industry,
        insight: `${experiment.type} optimization shows ${results.effectSize > 0 ? 'positive' : 'negative'} impact`,
        evidence: `Effect size: ${results.effectSize.toFixed(3)}, P-value: ${results.pValue.toFixed(4)}`,
        confidence: results.statisticalSignificance ? 0.9 : 0.5,
        applicability: [experiment.industry]
      });
    }

    return insights;
  }

  private assessRisks(experiment: Experiment, results: ExperimentResults): RiskAssessment {
    const factors: RiskFactor[] = [];

    if (!results.statisticalSignificance) {
      factors.push({
        factor: 'Insufficient statistical evidence',
        severity: 7,
        probability: 0.8,
        impact: 'May lead to incorrect decisions'
      });
    }

    if (results.effectSize < 0) {
      factors.push({
        factor: 'Negative performance impact',
        severity: 8,
        probability: 1.0,
        impact: 'Could harm business metrics'
      });
    }

    const avgRisk = factors.length > 0 ? factors.reduce((sum, f) => sum + f.severity, 0) / factors.length : 3;

    return {
      overallRisk: avgRisk < 4 ? 'low' : avgRisk < 7 ? 'medium' : 'high',
      factors,
      mitigationStrategies: [
        'Implement gradual rollout',
        'Monitor key metrics closely',
        'Prepare rollback strategy'
      ]
    };
  }

  private extractLearnings(experiment: Experiment, results: ExperimentResults): string[] {
    const learnings: string[] = [];

    learnings.push(`${experiment.type} experiments in ${experiment.industry} require ${experiment.metadata.requiredSampleSize} participants`);
    learnings.push(`Statistical significance achieved: ${results.statisticalSignificance}`);

    if (results.effectSize !== 0) {
      learnings.push(`Effect size of ${results.effectSize.toFixed(3)} indicates ${Math.abs(results.effectSize) > 0.2 ? 'large' : 'small'} practical significance`);
    }

    return learnings;
  }

  private generateNextSteps(experiment: Experiment, results: ExperimentResults): string[] {
    const nextSteps: string[] = [];

    if (results.statisticalSignificance && results.winningVariant) {
      nextSteps.push(`Implement winning variant ${results.winningVariant} across all traffic`);
      nextSteps.push('Document learnings for future experiment design');
      nextSteps.push('Plan follow-up experiments to optimize further');
    } else {
      nextSteps.push('Extend experiment duration or increase sample size');
      nextSteps.push('Analyze secondary metrics for insights');
      nextSteps.push('Consider modifying variant configurations');
    }

    return nextSteps;
  }

  // Mathematical utility functions
  private normalCDF(x: number): number {
    // Approximation of normal cumulative distribution function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  private getInverseNormalCDF(p: number): number {
    // Simplified inverse normal CDF approximation
    if (p <= 0 || p >= 1) {
      throw new Error('Probability must be between 0 and 1');
    }

    // Beasley-Springer-Moro algorithm (simplified)
    const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];

    let r = p;
    if (p > 0.5) {
      r = 1 - p;
    }

    r = Math.sqrt(-Math.log(r));

    let x = (((((a[6] * r + a[5]) * r + a[4]) * r + a[3]) * r + a[2]) * r + a[1]) * r + a[0];
    x /= ((((b[5] * r + b[4]) * r + b[3]) * r + b[2]) * r + b[1]) * r + 1;

    if (p < 0.5) {
      x = -x;
    }

    return x;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Monitoring
  private startExperimentMonitoring(experimentId?: string): void {
    const checkInterval = 60 * 60 * 1000; // Check every hour

    if (experimentId) {
      const monitor = setInterval(() => {
        this.monitorExperiment(experimentId);
      }, checkInterval);

      this.activeMonitors.set(experimentId, monitor);
    } else {
      // Monitor all running experiments
      setInterval(() => {
        this.experiments.forEach((experiment) => {
          if (experiment.status === ExperimentStatus.RUNNING) {
            this.monitorExperiment(experiment.id);
          }
        });
      }, checkInterval);
    }
  }

  private stopExperimentMonitoring(experimentId: string): void {
    const monitor = this.activeMonitors.get(experimentId);
    if (monitor) {
      clearInterval(monitor);
      this.activeMonitors.delete(experimentId);
    }
  }

  private async monitorExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== ExperimentStatus.RUNNING) {
      return;
    }

    // Check for early stopping conditions
    if (experiment.statisticalConfig.sequentialTesting) {
      const preliminaryResults = await this.calculateExperimentResults(experiment);

      for (const rule of experiment.statisticalConfig.earlyStoppingRules) {
        if (this.shouldStopEarly(experiment, preliminaryResults, rule)) {
          await this.stopExperiment(experimentId, `Early stopping rule triggered: ${rule.type}`);
          return;
        }
      }
    }

    // Check if experiment duration has been reached
    if (experiment.endDate && new Date() > new Date(experiment.endDate)) {
      await this.stopExperiment(experimentId, 'Experiment duration reached');
    }
  }

  private shouldStopEarly(experiment: Experiment, results: ExperimentResults, rule: EarlyStoppingRule): boolean {
    const totalParticipants = experiment.variants.reduce((sum, v) => sum + v.metrics.participantCount, 0);

    if (totalParticipants < rule.minSampleSize) {
      return false;
    }

    switch (rule.type) {
      case 'superiority':
        return results.statisticalSignificance && results.effectSize > rule.threshold;
      case 'futility':
        return results.pValue > (1 - rule.threshold);
      case 'harm':
        return results.effectSize < -rule.threshold;
      default:
        return false;
    }
  }

  // Public API Methods
  public async getExperiments(filters?: {
    status?: ExperimentStatus;
    industry?: string;
    type?: ExperimentType;
  }): Promise<Experiment[]> {
    let experiments = Array.from(this.experiments.values());

    if (filters) {
      if (filters.status) {
        experiments = experiments.filter(e => e.status === filters.status);
      }
      if (filters.industry) {
        experiments = experiments.filter(e => e.industry === filters.industry);
      }
      if (filters.type) {
        experiments = experiments.filter(e => e.type === filters.type);
      }
    }

    return experiments;
  }

  public async getExperiment(experimentId: string): Promise<Experiment | null> {
    return this.experiments.get(experimentId) || null;
  }

  public async getExperimentAssignments(experimentId: string): Promise<ParticipantAssignment[]> {
    return this.assignments.get(experimentId) || [];
  }

  public async getConversionEvents(experimentId: string): Promise<ConversionEvent[]> {
    return this.conversionEvents.filter(e => e.experimentId === experimentId);
  }

  public async getExperimentStats(): Promise<{
    totalExperiments: number;
    runningExperiments: number;
    completedExperiments: number;
    totalParticipants: number;
    totalConversions: number;
    avgExperimentDuration: number;
  }> {
    const experiments = Array.from(this.experiments.values());

    return {
      totalExperiments: experiments.length,
      runningExperiments: experiments.filter(e => e.status === ExperimentStatus.RUNNING).length,
      completedExperiments: experiments.filter(e => e.status === ExperimentStatus.COMPLETED).length,
      totalParticipants: Array.from(this.assignments.values()).flat().length,
      totalConversions: this.conversionEvents.length,
      avgExperimentDuration: experiments.reduce((sum, e) => sum + e.metadata.estimatedDuration, 0) / experiments.length || 0
    };
  }

  public shutdown(): void {
    // Clear all monitoring intervals
    this.activeMonitors.forEach(monitor => clearInterval(monitor));
    this.activeMonitors.clear();

    // Remove all event listeners
    this.removeAllListeners();
  }
}

export default ABTestingService;
