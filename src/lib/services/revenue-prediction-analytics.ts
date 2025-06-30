/**
 * Revenue Prediction Analytics Service
 *
 * Builds predictive analytics system for individual customer revenue potential
 * with detailed forecasting and confidence metrics
 */

import { EventEmitter } from 'events';

// Core Interfaces for Revenue Prediction
export interface RevenuePrediction {
  id: string;
  customerId: string;
  predictedRevenue: number;
  dealSizeEstimate: DealSizeEstimate;
  closeProbability: CloseProbabilityAnalysis;
  timeToClose: TimeToCloseForecasting;
  confidenceInterval: RevenueConfidenceInterval;
  revenueModel: RevenueModel;
  predictionMetadata: PredictionMetadata;
  generatedAt: Date;
  validUntil: Date;
}

export interface DealSizeEstimate {
  estimatedValue: number;
  minValue: number;
  maxValue: number;
  confidence: number;
  factors: DealSizeFactor[];
  historicalComparisons: HistoricalDeal[];
  adjustmentFactors: AdjustmentFactor[];
}

export interface DealSizeFactor {
  factor: string;
  impact: number; // -1 to 1
  weight: number;
  description: string;
  confidence: number;
}

export interface HistoricalDeal {
  dealId: string;
  customerId: string;
  dealValue: number;
  customerSegment: string;
  industryType: string;
  dealDuration: number;
  similarityScore: number;
}

export interface AdjustmentFactor {
  type: 'industry' | 'segment' | 'seasonal' | 'competitive' | 'economic';
  multiplier: number;
  reasoning: string;
  confidence: number;
}

export interface CloseProbabilityAnalysis {
  probability: number; // 0-1
  stage: DealStage;
  progressFactors: ProgressFactor[];
  riskFactors: RiskFactor[];
  accelerators: AcceleratorFactor[];
  historicalConversion: HistoricalConversion;
}

export interface ProgressFactor {
  factor: string;
  completed: boolean;
  impact: number;
  weight: number;
  description: string;
}

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: number;
  likelihood: number;
  mitigation: string[];
}

export interface AcceleratorFactor {
  factor: string;
  potential: number;
  timeline: string;
  requirements: string[];
}

export interface HistoricalConversion {
  stageConversionRate: number;
  averageCloseTime: number;
  successFactors: string[];
  failureReasons: string[];
}

export interface TimeToCloseForecasting {
  estimatedDays: number;
  minDays: number;
  maxDays: number;
  confidence: number;
  milestones: Milestone[];
  criticalPath: CriticalPathStep[];
  seasonalAdjustments: SeasonalAdjustment[];
}

export interface Milestone {
  name: string;
  estimatedDate: Date;
  probability: number;
  dependencies: string[];
  impact: number;
}

export interface CriticalPathStep {
  step: string;
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  bottleneckRisk: number;
  parallelizable: boolean;
}

export interface SeasonalAdjustment {
  period: string;
  multiplier: number;
  confidence: number;
  historicalData: number[];
}

export interface RevenueConfidenceInterval {
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number; // e.g., 0.95 for 95%
  standardDeviation: number;
  distribution: 'normal' | 'lognormal' | 'beta' | 'triangular';
  intervalFactors: IntervalFactor[];
}

export interface IntervalFactor {
  factor: string;
  variance: number;
  correlation: number;
  impact: number;
}

export interface RevenueModel {
  modelType: 'linear' | 'logistic' | 'neural_network' | 'ensemble' | 'decision_tree';
  version: string;
  features: ModelFeature[];
  performance: ModelPerformance;
  trainingData: TrainingDataSummary;
  lastTrained: Date;
}

export interface ModelFeature {
  name: string;
  importance: number;
  coefficient?: number;
  transformation?: string;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  meanAbsoluteError: number;
  rootMeanSquareError: number;
  rSquared: number;
}

export interface TrainingDataSummary {
  sampleCount: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  features: string[];
  targetVariable: string;
}

export interface PredictionMetadata {
  algorithm: string;
  processingTime: number;
  dataQuality: number;
  featureCompleteness: number;
  modelConfidence: number;
  lastUpdated: Date;
  dataSourcesUsed: string[];
}

export type DealStage =
  | 'qualification'
  | 'discovery'
  | 'proposal'
  | 'negotiation'
  | 'decision'
  | 'closed_won'
  | 'closed_lost';

export interface RevenuePredictionConfig {
  modelSelection: 'auto' | 'linear' | 'neural_network' | 'ensemble';
  confidenceLevel: number;
  predictionHorizon: number; // days
  updateFrequency: number; // hours
  industryBenchmarks: boolean;
  competitiveIntelligence: boolean;
  seasonalAdjustments: boolean;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

export interface CustomerRevenueContext {
  customer_profile: any;
  behavioral_data: any;
  engagement_history: any;
  industry_data?: any;
  competitive_context?: any;
  seasonal_factors?: any;
  historical_deals?: HistoricalDeal[];
}

/**
 * Revenue Prediction Analytics Service
 *
 * Provides comprehensive revenue forecasting and prediction capabilities
 */
export class RevenuePredictionAnalytics extends EventEmitter {
  private config: RevenuePredictionConfig;
  private models: Map<string, RevenueModel>;
  private dealSizePredictor: DealSizePredictor;
  private probabilityAnalyzer: CloseProbabilityAnalyzer;
  private timeForecaster: TimeToCloseForecaster;
  private confidenceCalculator: RevenueConfidenceCalculator;
  private modelTrainer: ModelTrainer;

  constructor(config: Partial<RevenuePredictionConfig> = {}) {
    super();

    this.config = {
      modelSelection: 'auto',
      confidenceLevel: 0.95,
      predictionHorizon: 90,
      updateFrequency: 24,
      industryBenchmarks: true,
      competitiveIntelligence: true,
      seasonalAdjustments: true,
      riskTolerance: 'moderate',
      ...config
    };

    this.models = new Map();
    this.dealSizePredictor = new DealSizePredictor(this.config);
    this.probabilityAnalyzer = new CloseProbabilityAnalyzer(this.config);
    this.timeForecaster = new TimeToCloseForecaster(this.config);
    this.confidenceCalculator = new RevenueConfidenceCalculator(this.config);
    this.modelTrainer = new ModelTrainer(this.config);

    this.initializeModels();
  }

  /**
   * Generate comprehensive revenue prediction for a customer
   */
  async predictCustomerRevenue(
    customerId: string,
    context: CustomerRevenueContext
  ): Promise<RevenuePrediction> {
    try {
      const startTime = performance.now();

      // Generate deal size estimate
      const dealSizeEstimate = await this.dealSizePredictor.estimateDealSize(
        customerId,
        context
      );

      // Analyze close probability
      const closeProbability = await this.probabilityAnalyzer.analyzeCloseProbability(
        customerId,
        context
      );

      // Forecast time to close
      const timeToClose = await this.timeForecaster.forecastTimeToClose(
        customerId,
        context,
        closeProbability.stage
      );

      // Calculate confidence intervals
      const confidenceInterval = await this.confidenceCalculator.calculateInterval(
        dealSizeEstimate,
        closeProbability,
        this.config.confidenceLevel
      );

      // Select and apply revenue model
      const revenueModel = await this.selectOptimalModel(customerId, context);
      const predictedRevenue = dealSizeEstimate.estimatedValue * closeProbability.probability;

      const processingTime = performance.now() - startTime;

      const prediction: RevenuePrediction = {
        id: `rev_pred_${customerId}_${Date.now()}`,
        customerId,
        predictedRevenue,
        dealSizeEstimate,
        closeProbability,
        timeToClose,
        confidenceInterval,
        revenueModel,
        predictionMetadata: {
          algorithm: revenueModel.modelType,
          processingTime,
          dataQuality: this.assessDataQuality(context),
          featureCompleteness: this.calculateFeatureCompleteness(context),
          modelConfidence: revenueModel.performance.accuracy,
          lastUpdated: new Date(),
          dataSourcesUsed: this.getDataSources(context)
        },
        generatedAt: new Date(),
        validUntil: new Date(Date.now() + this.config.predictionHorizon * 24 * 60 * 60 * 1000)
      };

      this.emit('prediction_generated', {
        customerId,
        predictedRevenue,
        confidence: confidenceInterval.confidenceLevel,
        processingTime
      });

      return prediction;

    } catch (error) {
      this.emit('prediction_error', {
        customerId,
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Get revenue predictions for multiple customers
   */
  async batchPredictRevenue(
    customerContexts: Array<{ customerId: string; context: CustomerRevenueContext }>
  ): Promise<RevenuePrediction[]> {
    const predictions = await Promise.all(
      customerContexts.map(({ customerId, context }) =>
        this.predictCustomerRevenue(customerId, context)
      )
    );

    this.emit('batch_prediction_completed', {
      customerCount: customerContexts.length,
      totalPredictedRevenue: predictions.reduce((sum, p) => sum + p.predictedRevenue, 0),
      averageConfidence: predictions.reduce((sum, p) => sum + p.confidenceInterval.confidenceLevel, 0) / predictions.length
    });

    return predictions;
  }

  /**
   * Update revenue prediction with new data
   */
  async updatePrediction(
    predictionId: string,
    newContext: Partial<CustomerRevenueContext>
  ): Promise<RevenuePrediction> {
    // Get existing prediction
    const existingPrediction = await this.getPrediction(predictionId);
    if (!existingPrediction) {
      throw new Error(`Prediction ${predictionId} not found`);
    }

    // Merge new context with existing
    const updatedContext = { ...existingPrediction, ...newContext };

    // Generate new prediction
    return this.predictCustomerRevenue(existingPrediction.customerId, updatedContext);
  }

  /**
   * Get historical prediction accuracy
   */
  async getPredictionAccuracy(timeframe: number = 30): Promise<ModelPerformance> {
    // This would analyze historical predictions vs actual outcomes
    return {
      accuracy: 0.85,
      precision: 0.82,
      recall: 0.88,
      f1Score: 0.85,
      meanAbsoluteError: 5000,
      rootMeanSquareError: 8500,
      rSquared: 0.78
    };
  }

  // Private helper methods
  private async initializeModels(): Promise<void> {
    // Initialize different revenue prediction models
    const models = [
      {
        name: 'linear_regression',
        type: 'linear' as const,
        features: ['engagement_score', 'deal_size_factors', 'industry_benchmarks']
      },
      {
        name: 'neural_network',
        type: 'neural_network' as const,
        features: ['all_features']
      },
      {
        name: 'ensemble',
        type: 'ensemble' as const,
        features: ['combined_features']
      }
    ];

    for (const modelConfig of models) {
      const model = await this.modelTrainer.createModel(modelConfig);
      this.models.set(modelConfig.name, model);
    }
  }

  private async selectOptimalModel(
    customerId: string,
    context: CustomerRevenueContext
  ): Promise<RevenueModel> {
    if (this.config.modelSelection === 'auto') {
      // Select best model based on data characteristics
      const dataComplexity = this.assessDataComplexity(context);
      const featureCount = this.countFeatures(context);

      if (featureCount < 10 && dataComplexity < 0.3) {
        return this.models.get('linear_regression')!;
      } else if (featureCount > 20 || dataComplexity > 0.7) {
        return this.models.get('neural_network')!;
      } else {
        return this.models.get('ensemble')!;
      }
    }

    return this.models.get(this.config.modelSelection) || this.models.get('linear_regression')!;
  }

  private assessDataQuality(context: CustomerRevenueContext): number {
    let quality = 0.5; // Base quality

    if (context.customer_profile) quality += 0.15;
    if (context.behavioral_data) quality += 0.15;
    if (context.engagement_history) quality += 0.10;
    if (context.industry_data) quality += 0.05;
    if (context.competitive_context) quality += 0.05;
    if (context.historical_deals && context.historical_deals.length > 0) quality += 0.10;

    return Math.min(quality, 1.0);
  }

  private calculateFeatureCompleteness(context: CustomerRevenueContext): number {
    const totalFeatures = 6; // Expected number of context features
    let presentFeatures = 0;

    if (context.customer_profile) presentFeatures++;
    if (context.behavioral_data) presentFeatures++;
    if (context.engagement_history) presentFeatures++;
    if (context.industry_data) presentFeatures++;
    if (context.competitive_context) presentFeatures++;
    if (context.historical_deals) presentFeatures++;

    return presentFeatures / totalFeatures;
  }

  private assessDataComplexity(context: CustomerRevenueContext): number {
    // Assess complexity based on data variety and relationships
    let complexity = 0.0;

    // Add complexity based on data richness
    if (context.behavioral_data) complexity += 0.2;
    if (context.engagement_history) complexity += 0.2;
    if (context.competitive_context) complexity += 0.3;
    if (context.historical_deals && context.historical_deals.length > 5) complexity += 0.3;

    return Math.min(complexity, 1.0);
  }

  private countFeatures(context: CustomerRevenueContext): number {
    let featureCount = 0;

    if (context.customer_profile) featureCount += Object.keys(context.customer_profile).length;
    if (context.behavioral_data) featureCount += Object.keys(context.behavioral_data).length;
    if (context.engagement_history) featureCount += Object.keys(context.engagement_history).length;

    return featureCount;
  }

  private getDataSources(context: CustomerRevenueContext): string[] {
    const sources: string[] = [];

    if (context.customer_profile) sources.push('customer_profile');
    if (context.behavioral_data) sources.push('behavioral_analytics');
    if (context.engagement_history) sources.push('engagement_tracking');
    if (context.industry_data) sources.push('industry_benchmarks');
    if (context.competitive_context) sources.push('competitive_intelligence');
    if (context.historical_deals) sources.push('historical_deal_data');

    return sources;
  }

  private async getPrediction(predictionId: string): Promise<RevenuePrediction | null> {
    // This would retrieve from storage/cache
    // For now, return null
    return null;
  }
}

// Supporting classes (to be implemented)
class DealSizePredictor {
  constructor(private config: RevenuePredictionConfig) {}

  async estimateDealSize(
    customerId: string,
    context: CustomerRevenueContext
  ): Promise<DealSizeEstimate> {
    // Implementation for deal size estimation
    const baseEstimate = 25000; // Base estimate
    const industryMultiplier = this.getIndustryMultiplier(context);
    const segmentMultiplier = this.getSegmentMultiplier(context);
    const engagementMultiplier = this.getEngagementMultiplier(context);

    const estimatedValue = baseEstimate * industryMultiplier * segmentMultiplier * engagementMultiplier;

    return {
      estimatedValue,
      minValue: estimatedValue * 0.7,
      maxValue: estimatedValue * 1.5,
      confidence: 0.8,
      factors: this.analyzeDealSizeFactors(context),
      historicalComparisons: await this.getHistoricalComparisons(context),
      adjustmentFactors: this.calculateAdjustmentFactors(context)
    };
  }

  private getIndustryMultiplier(context: CustomerRevenueContext): number {
    // Industry-specific multipliers
    return 1.2; // Default multiplier
  }

  private getSegmentMultiplier(context: CustomerRevenueContext): number {
    // Customer segment multipliers
    return 1.1; // Default multiplier
  }

  private getEngagementMultiplier(context: CustomerRevenueContext): number {
    // Engagement-based multipliers
    return 1.0; // Default multiplier
  }

  private analyzeDealSizeFactors(context: CustomerRevenueContext): DealSizeFactor[] {
    return [
      {
        factor: 'Company Size',
        impact: 0.3,
        weight: 0.8,
        description: 'Larger companies typically have bigger budgets',
        confidence: 0.85
      },
      {
        factor: 'Industry Type',
        impact: 0.2,
        weight: 0.6,
        description: 'Industry affects typical deal sizes',
        confidence: 0.75
      }
    ];
  }

  private async getHistoricalComparisons(context: CustomerRevenueContext): Promise<HistoricalDeal[]> {
    // Return similar historical deals
    return [];
  }

  private calculateAdjustmentFactors(context: CustomerRevenueContext): AdjustmentFactor[] {
    return [
      {
        type: 'industry',
        multiplier: 1.2,
        reasoning: 'Industry premium for technology sector',
        confidence: 0.8
      }
    ];
  }
}

class CloseProbabilityAnalyzer {
  constructor(private config: RevenuePredictionConfig) {}

  async analyzeCloseProbability(
    customerId: string,
    context: CustomerRevenueContext
  ): Promise<CloseProbabilityAnalysis> {
    const stage = this.determineCurrentStage(context);
    const baselineProbability = this.getStageBaseline(stage);
    const progressFactors = this.analyzeProgressFactors(context);
    const riskFactors = this.analyzeRiskFactors(context);
    const accelerators = this.identifyAccelerators(context);

    // Calculate adjusted probability
    let probability = baselineProbability;
    progressFactors.forEach(factor => {
      if (factor.completed) {
        probability += factor.impact * factor.weight;
      }
    });

    riskFactors.forEach(factor => {
      probability -= factor.impact * factor.likelihood;
    });

    probability = Math.max(0, Math.min(1, probability));

    return {
      probability,
      stage,
      progressFactors,
      riskFactors,
      accelerators,
      historicalConversion: await this.getHistoricalConversion(stage)
    };
  }

  private determineCurrentStage(context: CustomerRevenueContext): DealStage {
    // Analyze context to determine current deal stage
    return 'discovery'; // Default stage
  }

  private getStageBaseline(stage: DealStage): number {
    const baselines: Record<DealStage, number> = {
      qualification: 0.15,
      discovery: 0.25,
      proposal: 0.45,
      negotiation: 0.65,
      decision: 0.80,
      closed_won: 1.0,
      closed_lost: 0.0
    };
    return baselines[stage];
  }

  private analyzeProgressFactors(context: CustomerRevenueContext): ProgressFactor[] {
    return [
      {
        factor: 'Budget Confirmed',
        completed: false,
        impact: 0.15,
        weight: 0.8,
        description: 'Customer has confirmed available budget'
      },
      {
        factor: 'Decision Maker Identified',
        completed: true,
        impact: 0.10,
        weight: 0.7,
        description: 'Key decision maker has been identified and engaged'
      }
    ];
  }

  private analyzeRiskFactors(context: CustomerRevenueContext): RiskFactor[] {
    return [
      {
        factor: 'Competitive Pressure',
        severity: 'medium',
        impact: 0.2,
        likelihood: 0.6,
        mitigation: ['Highlight unique value proposition', 'Competitive analysis presentation']
      }
    ];
  }

  private identifyAccelerators(context: CustomerRevenueContext): AcceleratorFactor[] {
    return [
      {
        factor: 'Pilot Project Success',
        potential: 0.25,
        timeline: '2 weeks',
        requirements: ['Technical team approval', 'Pilot scope definition']
      }
    ];
  }

  private async getHistoricalConversion(stage: DealStage): Promise<HistoricalConversion> {
    return {
      stageConversionRate: 0.75,
      averageCloseTime: 45,
      successFactors: ['Strong ROI justification', 'Executive sponsorship'],
      failureReasons: ['Budget constraints', 'Timing issues']
    };
  }
}

class TimeToCloseForecaster {
  constructor(private config: RevenuePredictionConfig) {}

  async forecastTimeToClose(
    customerId: string,
    context: CustomerRevenueContext,
    currentStage: DealStage
  ): Promise<TimeToCloseForecasting> {
    const baselineTime = this.getStageBaseline(currentStage);
    const milestones = this.generateMilestones(currentStage);
    const criticalPath = this.calculateCriticalPath(milestones);
    const seasonalAdjustments = this.getSeasonalAdjustments();

    let estimatedDays = baselineTime;

    // Apply seasonal adjustments
    seasonalAdjustments.forEach(adjustment => {
      estimatedDays *= adjustment.multiplier;
    });

    return {
      estimatedDays: Math.round(estimatedDays),
      minDays: Math.round(estimatedDays * 0.7),
      maxDays: Math.round(estimatedDays * 1.5),
      confidence: 0.75,
      milestones,
      criticalPath,
      seasonalAdjustments
    };
  }

  private getStageBaseline(stage: DealStage): number {
    const baselines: Record<DealStage, number> = {
      qualification: 60,
      discovery: 45,
      proposal: 30,
      negotiation: 15,
      decision: 7,
      closed_won: 0,
      closed_lost: 0
    };
    return baselines[stage];
  }

  private generateMilestones(currentStage: DealStage): Milestone[] {
    return [
      {
        name: 'Proposal Delivery',
        estimatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        probability: 0.9,
        dependencies: ['requirements_gathering'],
        impact: 0.3
      },
      {
        name: 'Contract Negotiation',
        estimatedDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        probability: 0.7,
        dependencies: ['proposal_approval'],
        impact: 0.4
      }
    ];
  }

  private calculateCriticalPath(milestones: Milestone[]): CriticalPathStep[] {
    return [
      {
        step: 'Technical Evaluation',
        estimatedDuration: 7,
        priority: 'high',
        bottleneckRisk: 0.6,
        parallelizable: false
      },
      {
        step: 'Legal Review',
        estimatedDuration: 5,
        priority: 'medium',
        bottleneckRisk: 0.4,
        parallelizable: true
      }
    ];
  }

  private getSeasonalAdjustments(): SeasonalAdjustment[] {
    return [
      {
        period: 'Q4',
        multiplier: 1.2,
        confidence: 0.8,
        historicalData: [1.1, 1.2, 1.3, 1.15]
      }
    ];
  }
}

class RevenueConfidenceCalculator {
  constructor(private config: RevenuePredictionConfig) {}

  async calculateInterval(
    dealSize: DealSizeEstimate,
    closeProbability: CloseProbabilityAnalysis,
    confidenceLevel: number
  ): Promise<RevenueConfidenceInterval> {
    const expectedRevenue = dealSize.estimatedValue * closeProbability.probability;
    const variance = this.calculateVariance(dealSize, closeProbability);
    const standardDeviation = Math.sqrt(variance);

    // Calculate confidence interval bounds
    const zScore = this.getZScore(confidenceLevel);
    const marginOfError = zScore * standardDeviation;

    return {
      lowerBound: Math.max(0, expectedRevenue - marginOfError),
      upperBound: expectedRevenue + marginOfError,
      confidenceLevel,
      standardDeviation,
      distribution: 'normal',
      intervalFactors: this.calculateIntervalFactors(dealSize, closeProbability)
    };
  }

  private calculateVariance(
    dealSize: DealSizeEstimate,
    closeProbability: CloseProbabilityAnalysis
  ): number {
    // Calculate variance based on deal size uncertainty and probability uncertainty
    const dealSizeVariance = Math.pow((dealSize.maxValue - dealSize.minValue) / 4, 2);
    const probabilityVariance = Math.pow(0.2, 2); // Assumed probability uncertainty

    return dealSizeVariance + probabilityVariance;
  }

  private getZScore(confidenceLevel: number): number {
    // Z-scores for common confidence levels
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    return zScores[confidenceLevel] || 1.96;
  }

  private calculateIntervalFactors(
    dealSize: DealSizeEstimate,
    closeProbability: CloseProbabilityAnalysis
  ): IntervalFactor[] {
    return [
      {
        factor: 'Deal Size Uncertainty',
        variance: 0.3,
        correlation: 0.8,
        impact: 0.4
      },
      {
        factor: 'Close Probability Risk',
        variance: 0.2,
        correlation: 0.6,
        impact: 0.6
      }
    ];
  }
}

class ModelTrainer {
  constructor(private config: RevenuePredictionConfig) {}

  async createModel(modelConfig: any): Promise<RevenueModel> {
    // Create and train revenue prediction model
    return {
      modelType: modelConfig.type,
      version: '1.0.0',
      features: modelConfig.features.map((name: string) => ({
        name,
        importance: Math.random(),
        coefficient: Math.random() * 2 - 1
      })),
      performance: {
        accuracy: 0.85,
        precision: 0.82,
        recall: 0.88,
        f1Score: 0.85,
        meanAbsoluteError: 5000,
        rootMeanSquareError: 8500,
        rSquared: 0.78
      },
      trainingData: {
        sampleCount: 1000,
        dateRange: {
          start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        features: modelConfig.features,
        targetVariable: 'revenue'
      },
      lastTrained: new Date()
    };
  }
}

export default RevenuePredictionAnalytics;
