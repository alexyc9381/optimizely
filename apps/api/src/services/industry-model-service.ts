import { EventEmitter } from 'events';
import { LeadData } from './ml-types';

// Industry Classification Types
export type IndustryType =
  | 'saas'
  | 'consulting'
  | 'manufacturing'
  | 'fintech'
  | 'healthcare'
  | 'ecommerce'
  | 'education'
  | 'real_estate'
  | 'automotive'
  | 'energy'
  | 'media'
  | 'nonprofit'
  | 'government'
  | 'retail'
  | 'construction'
  | 'agriculture'
  | 'transportation'
  | 'hospitality'
  | 'legal'
  | 'insurance';

export interface IndustryFeatureSet {
  firmographicWeights: {
    companySize: number;
    revenue: number;
    industry: number;
    location: number;
    growthRate: number;
    fundingStage: number;
    techStack: number;
    employeeGrowth: number;
  };
  behavioralWeights: {
    sessionCount: number;
    avgSessionDuration: number;
    pageViewsPerSession: number;
    contentEngagement: number;
    technicalDepth: number;
    timeOnSite: number;
    returnVisitorPattern: number;
  };
  intentWeights: {
    searchKeywords: number;
    competitorResearch: number;
    buyingStageSignals: number;
    contentTopicsEngaged: number;
    urgencyIndicators: number;
    socialProof: number;
  };
  timingWeights: {
    dayOfWeek: number;
    hourOfDay: number;
    seasonality: number;
    recentActivity: number;
    engagementVelocity: number;
    lastVisitDays: number;
    accountAge: number;
  };
}

export interface IndustryModel {
  id: string;
  industryType: IndustryType;
  version: string;
  featureSet: IndustryFeatureSet;
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
    confusionMatrix: number[][];
  };
  trainingData: {
    totalSamples: number;
    positiveExamples: number;
    trainingDate: Date;
    dataQuality: number;
    featureImportance: Record<string, number>;
  };
  deployment: {
    status: 'training' | 'testing' | 'deployed' | 'deprecated';
    deploymentDate?: Date;
    trafficAllocation: number; // For A/B testing
    performanceThresholds: {
      minAccuracy: number;
      maxLatency: number;
      minConfidence: number;
    };
  };
  metadata: {
    description: string;
    tags: string[];
    createdBy: string;
    lastModified: Date;
    notes: string;
  };
}

export interface IndustryClassification {
  primaryIndustry: IndustryType;
  confidence: number;
  alternativeIndustries: Array<{
    industry: IndustryType;
    confidence: number;
    reason: string;
  }>;
  classificationType: 'automatic' | 'manual' | 'hybrid';
  classificationDate: Date;
  signals: {
    domainIndicators: string[];
    companyDescriptors: string[];
    technographicSignals: string[];
    behavioralPatterns: string[];
    contentAnalysis: string[];
  };
}

export interface ABTestConfig {
  testId: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  variants: Array<{
    id: string;
    name: string;
    modelId: string;
    trafficAllocation: number;
    description: string;
  }>;
  successMetrics: Array<{
    name: string;
    type: 'accuracy' | 'conversion' | 'revenue' | 'engagement';
    targetValue: number;
    weight: number;
  }>;
  startDate: Date;
  endDate?: Date;
  results?: {
    winningVariant: string;
    confidenceLevel: number;
    significantImprovement: boolean;
    metrics: Record<string, any>;
  };
}

export interface IndustryPrediction {
  industryType: IndustryType;
  score: number;
  confidence: number;
  modelVersion: string;
  prediction: {
    dealSize: number;
    closeProbability: number;
    timeToClose: number;
    buyerProfile: string;
    nextBestAction: string;
  };
  breakdown: {
    firmographicScore: number;
    behavioralScore: number;
    intentScore: number;
    timingScore: number;
  };
  industrySpecificInsights: {
    industryBenchmarks: Record<string, number>;
    competitivePosition: string;
    marketTrends: string[];
    seasonalFactors: string[];
    industryRisks: string[];
  };
  recommendations: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: number;
    reasoning: string;
  }>;
}

export interface ModelTrainingConfig {
  industryType: IndustryType;
  algorithmType: 'gradient_boosting' | 'neural_network' | 'random_forest' | 'ensemble';
  hyperparameters: Record<string, any>;
  trainingParameters: {
    trainTestSplit: number;
    crossValidationFolds: number;
    maxIterations: number;
    earlyStoppingThreshold: number;
    regularizationStrength: number;
  };
  featureEngineering: {
    polynomialFeatures: boolean;
    interactionTerms: boolean;
    dimensionalityReduction: boolean;
    featureSelection: boolean;
    normalizationMethod: 'zscore' | 'minmax' | 'robust';
  };
  validationStrategy: {
    method: 'holdout' | 'temporal' | 'stratified';
    validationSize: number;
    shuffleData: boolean;
  };
}

export class IndustryModelService extends EventEmitter {
  private models: Map<string, IndustryModel> = new Map();
  private abTests: Map<string, ABTestConfig> = new Map();
  private industryFeatures: Map<IndustryType, IndustryFeatureSet> = new Map();
  private defaultFeatureSet: IndustryFeatureSet = {
    firmographicWeights: {
      companySize: 0.25,
      revenue: 0.30,
      industry: 0.15,
      location: 0.10,
      growthRate: 0.20,
      fundingStage: 0.15,
      techStack: 0.10,
      employeeGrowth: 0.15
    },
    behavioralWeights: {
      sessionCount: 0.15,
      avgSessionDuration: 0.20,
      pageViewsPerSession: 0.15,
      contentEngagement: 0.25,
      technicalDepth: 0.20,
      timeOnSite: 0.20,
      returnVisitorPattern: 0.15
    },
    intentWeights: {
      searchKeywords: 0.20,
      competitorResearch: 0.15,
      buyingStageSignals: 0.30,
      contentTopicsEngaged: 0.15,
      urgencyIndicators: 0.30,
      socialProof: 0.20
    },
    timingWeights: {
      dayOfWeek: 0.15,
      hourOfDay: 0.15,
      seasonality: 0.20,
      recentActivity: 0.25,
      engagementVelocity: 0.30,
      lastVisitDays: 0.20,
      accountAge: 0.15
    }
  };

  constructor() {
    super();
    this.initializeDefaultFeatures();
    this.initializeIndustryFeatures();
  }

  private initializeDefaultFeatures(): void {
    this.defaultFeatureSet = {
      firmographicWeights: {
        companySize: 0.25,
        revenue: 0.30,
        industry: 0.15,
        location: 0.10,
        growthRate: 0.20,
        fundingStage: 0.15,
        techStack: 0.10,
        employeeGrowth: 0.15
      },
      behavioralWeights: {
        sessionCount: 0.15,
        avgSessionDuration: 0.20,
        pageViewsPerSession: 0.15,
        contentEngagement: 0.25,
        technicalDepth: 0.20,
        timeOnSite: 0.20,
        returnVisitorPattern: 0.15
      },
      intentWeights: {
        searchKeywords: 0.20,
        competitorResearch: 0.15,
        buyingStageSignals: 0.30,
        contentTopicsEngaged: 0.15,
        urgencyIndicators: 0.30,
        socialProof: 0.20
      },
      timingWeights: {
        dayOfWeek: 0.15,
        hourOfDay: 0.15,
        seasonality: 0.20,
        recentActivity: 0.25,
        engagementVelocity: 0.30,
        lastVisitDays: 0.20,
        accountAge: 0.15
      }
    };
  }

  private initializeIndustryFeatures(): void {
    // SaaS Industry Features
    this.industryFeatures.set('saas', {
      firmographicWeights: {
        companySize: 0.30,
        revenue: 0.25,
        industry: 0.20,
        location: 0.05,
        growthRate: 0.35,
        fundingStage: 0.25,
        techStack: 0.40,
        employeeGrowth: 0.30
      },
      behavioralWeights: {
        sessionCount: 0.20,
        avgSessionDuration: 0.25,
        pageViewsPerSession: 0.20,
        contentEngagement: 0.35,
        technicalDepth: 0.45,
        timeOnSite: 0.25,
        returnVisitorPattern: 0.30
      },
      intentWeights: {
        searchKeywords: 0.25,
        competitorResearch: 0.30,
        buyingStageSignals: 0.35,
        contentTopicsEngaged: 0.25,
        urgencyIndicators: 0.30,
        socialProof: 0.25
      },
      timingWeights: {
        dayOfWeek: 0.15,
        hourOfDay: 0.15,
        seasonality: 0.20,
        recentActivity: 0.30,
        engagementVelocity: 0.40,
        lastVisitDays: 0.25,
        accountAge: 0.20
      }
    });

    // Manufacturing Industry Features
    this.industryFeatures.set('manufacturing', {
      firmographicWeights: {
        companySize: 0.40,
        revenue: 0.45,
        industry: 0.25,
        location: 0.20,
        growthRate: 0.25,
        fundingStage: 0.15,
        techStack: 0.20,
        employeeGrowth: 0.25
      },
      behavioralWeights: {
        sessionCount: 0.15,
        avgSessionDuration: 0.30,
        pageViewsPerSession: 0.15,
        contentEngagement: 0.40,
        technicalDepth: 0.25,
        timeOnSite: 0.35,
        returnVisitorPattern: 0.25
      },
      intentWeights: {
        searchKeywords: 0.30,
        competitorResearch: 0.20,
        buyingStageSignals: 0.25,
        contentTopicsEngaged: 0.30,
        urgencyIndicators: 0.35,
        socialProof: 0.30
      },
      timingWeights: {
        dayOfWeek: 0.20,
        hourOfDay: 0.15,
        seasonality: 0.25,
        recentActivity: 0.20,
        engagementVelocity: 0.30,
        lastVisitDays: 0.30,
        accountAge: 0.35
      }
    });

    // Consulting Industry Features
    this.industryFeatures.set('consulting', {
      firmographicWeights: {
        companySize: 0.35,
        revenue: 0.30,
        industry: 0.30,
        location: 0.15,
        growthRate: 0.30,
        fundingStage: 0.10,
        techStack: 0.25,
        employeeGrowth: 0.20
      },
      behavioralWeights: {
        sessionCount: 0.25,
        avgSessionDuration: 0.35,
        pageViewsPerSession: 0.25,
        contentEngagement: 0.30,
        technicalDepth: 0.20,
        timeOnSite: 0.30,
        returnVisitorPattern: 0.35
      },
      intentWeights: {
        searchKeywords: 0.35,
        competitorResearch: 0.25,
        buyingStageSignals: 0.30,
        contentTopicsEngaged: 0.35,
        urgencyIndicators: 0.20,
        socialProof: 0.40
      },
      timingWeights: {
        dayOfWeek: 0.25,
        hourOfDay: 0.20,
        seasonality: 0.30,
        recentActivity: 0.25,
        engagementVelocity: 0.35,
        lastVisitDays: 0.35,
        accountAge: 0.40
      }
    });

    // Add more industries as needed...
  }

  // Industry Classification Methods
  async classifyIndustry(companyData: any): Promise<IndustryClassification> {
    const signals = await this.extractIndustrySignals(companyData);
    const scores = await this.calculateClassificationScores(signals);

    const sortedIndustries = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    const primaryIndustry = sortedIndustries[0][0] as IndustryType;
    const confidence = sortedIndustries[0][1];

    const alternativeIndustries = sortedIndustries.slice(1).map(([industry, score]) => ({
      industry: industry as IndustryType,
      confidence: score,
      reason: this.getClassificationReason(industry as IndustryType, signals)
    }));

    return {
      primaryIndustry,
      confidence,
      alternativeIndustries,
      classificationType: confidence > 0.8 ? 'automatic' : 'hybrid',
      classificationDate: new Date(),
      signals
    };
  }

  private async extractIndustrySignals(companyData: any): Promise<IndustryClassification['signals']> {
    return {
      domainIndicators: this.extractDomainIndicators(companyData.domain || ''),
      companyDescriptors: this.extractCompanyDescriptors(companyData.description || ''),
      technographicSignals: this.extractTechSignals(companyData.techStack || []),
      behavioralPatterns: this.extractBehavioralPatterns(companyData.behavior || {}),
      contentAnalysis: this.extractContentSignals(companyData.content || [])
    };
  }

  private extractDomainIndicators(domain: string): string[] {
    const indicators: string[] = [];

    // Domain-based industry hints
    if (domain.includes('health') || domain.includes('medical')) indicators.push('healthcare');
    if (domain.includes('bank') || domain.includes('finance')) indicators.push('fintech');
    if (domain.includes('shop') || domain.includes('store')) indicators.push('ecommerce');
    if (domain.includes('edu') || domain.includes('university')) indicators.push('education');
    if (domain.includes('gov') || domain.endsWith('.gov')) indicators.push('government');
    if (domain.includes('tech') || domain.includes('software')) indicators.push('saas');

    return indicators;
  }

  private extractCompanyDescriptors(description: string): string[] {
    const descriptors: string[] = [];
    const lowerDesc = description.toLowerCase();

    // Keyword-based classification
    if (lowerDesc.includes('software') || lowerDesc.includes('saas')) descriptors.push('saas');
    if (lowerDesc.includes('consulting') || lowerDesc.includes('advisory')) descriptors.push('consulting');
    if (lowerDesc.includes('manufacturing') || lowerDesc.includes('factory')) descriptors.push('manufacturing');
    if (lowerDesc.includes('finance') || lowerDesc.includes('investment')) descriptors.push('fintech');
    if (lowerDesc.includes('healthcare') || lowerDesc.includes('medical')) descriptors.push('healthcare');

    return descriptors;
  }

  private extractTechSignals(techStack: string[]): string[] {
    const signals: string[] = [];

    // Technology-based industry classification
    if (techStack.some(tech => ['salesforce', 'hubspot', 'marketo'].includes(tech.toLowerCase()))) {
      signals.push('saas');
    }
    if (techStack.some(tech => ['sap', 'oracle', 'plm'].includes(tech.toLowerCase()))) {
      signals.push('manufacturing');
    }
    if (techStack.some(tech => ['epic', 'cerner', 'athenahealth'].includes(tech.toLowerCase()))) {
      signals.push('healthcare');
    }

    return signals;
  }

  private extractBehavioralPatterns(behavior: any): string[] {
    const patterns: string[] = [];

    // Behavioral pattern analysis
    if (behavior.timeOnSite > 300) patterns.push('high_engagement');
    if (behavior.pricingPageViews > 3) patterns.push('price_conscious');
    if (behavior.downloadActivity > 2) patterns.push('research_intensive');

    return patterns;
  }

  private extractContentSignals(content: string[]): string[] {
    const signals: string[] = [];

    // Content-based signals
    content.forEach(item => {
      const lowerItem = item.toLowerCase();
      if (lowerItem.includes('roi') || lowerItem.includes('efficiency')) signals.push('business_focused');
      if (lowerItem.includes('compliance') || lowerItem.includes('regulation')) signals.push('regulated_industry');
      if (lowerItem.includes('innovation') || lowerItem.includes('disruption')) signals.push('tech_forward');
    });

    return signals;
  }

  private async calculateClassificationScores(signals: IndustryClassification['signals']): Promise<Record<string, number>> {
    const scores: Record<string, number> = {};

    // Initialize all industries with base scores
    const industries: IndustryType[] = ['saas', 'consulting', 'manufacturing', 'fintech', 'healthcare', 'ecommerce'];
    industries.forEach(industry => {
      scores[industry] = 0.1; // Base score
    });

    // Score based on signals
    signals.domainIndicators.forEach(indicator => {
      if (scores[indicator] !== undefined) scores[indicator] += 0.3;
    });

    signals.companyDescriptors.forEach(descriptor => {
      if (scores[descriptor] !== undefined) scores[descriptor] += 0.4;
    });

    signals.technographicSignals.forEach(signal => {
      if (scores[signal] !== undefined) scores[signal] += 0.2;
    });

    // Normalize scores
    const maxScore = Math.max(...Object.values(scores));
    Object.keys(scores).forEach(industry => {
      scores[industry] = scores[industry] / maxScore;
    });

    return scores;
  }

  private getClassificationReason(industry: IndustryType, signals: IndustryClassification['signals']): string {
    const reasons: string[] = [];

    if (signals.domainIndicators.includes(industry)) reasons.push('domain indicators');
    if (signals.companyDescriptors.includes(industry)) reasons.push('company description');
    if (signals.technographicSignals.includes(industry)) reasons.push('technology stack');

    return reasons.join(', ') || 'behavioral patterns';
  }

  // Model Training Methods
  async trainIndustryModel(config: ModelTrainingConfig): Promise<IndustryModel> {
    this.emit('training:started', { industryType: config.industryType });

    try {
      // Simulate model training process
      const modelId = this.generateModelId(config.industryType);
      const featureSet = this.industryFeatures.get(config.industryType) || this.defaultFeatureSet;

      // Simulate training with mock performance metrics
      await this.simulateTraining(config);

      const model: IndustryModel = {
        id: modelId,
        industryType: config.industryType,
        version: this.generateVersion(),
        featureSet,
        performance: await this.calculatePerformanceMetrics(config),
        trainingData: {
          totalSamples: 10000,
          positiveExamples: 3500,
          trainingDate: new Date(),
          dataQuality: 0.92,
          featureImportance: await this.calculateFeatureImportance(featureSet)
        },
        deployment: {
          status: 'testing',
          trafficAllocation: 0,
          performanceThresholds: {
            minAccuracy: 0.85,
            maxLatency: 100,
            minConfidence: 0.7
          }
        },
        metadata: {
          description: `Industry-specific model for ${config.industryType}`,
          tags: [config.industryType, config.algorithmType, 'v1'],
          createdBy: 'system',
          lastModified: new Date(),
          notes: `Trained with ${config.algorithmType} algorithm`
        }
      };

      this.models.set(modelId, model);
      this.emit('training:completed', { modelId, industryType: config.industryType });

      return model;
    } catch (error) {
      this.emit('training:failed', { industryType: config.industryType, error });
      throw error;
    }
  }

  private generateModelId(industryType: IndustryType): string {
    const timestamp = Date.now();
    return `${industryType}_model_${timestamp}`;
  }

  private generateVersion(): string {
    const date = new Date();
    return `v${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
  }

  private async simulateTraining(config: ModelTrainingConfig): Promise<void> {
    // Simulate training time based on algorithm complexity
    const trainingTime = config.algorithmType === 'neural_network' ? 2000 : 1000;
    await new Promise(resolve => setTimeout(resolve, trainingTime));
  }

  private async calculatePerformanceMetrics(config: ModelTrainingConfig): Promise<IndustryModel['performance']> {
    // Simulate performance based on algorithm type and parameters
    const baseAccuracy = config.algorithmType === 'neural_network' ? 0.94 : 0.91;
    const accuracy = Math.min(baseAccuracy + Math.random() * 0.03, 0.98);

    return {
      accuracy,
      precision: accuracy * 0.98,
      recall: accuracy * 0.96,
      f1Score: accuracy * 0.97,
      auc: accuracy * 1.02,
      confusionMatrix: [
        [850, 50],
        [75, 925]
      ]
    };
  }

  private async calculateFeatureImportance(featureSet: IndustryFeatureSet): Promise<Record<string, number>> {
    const importance: Record<string, number> = {};

    // Calculate feature importance based on weights
    Object.entries(featureSet.firmographicWeights).forEach(([feature, weight]) => {
      importance[`firmographic_${feature}`] = weight * 0.3;
    });

    Object.entries(featureSet.behavioralWeights).forEach(([feature, weight]) => {
      importance[`behavioral_${feature}`] = weight * 0.25;
    });

    Object.entries(featureSet.intentWeights).forEach(([feature, weight]) => {
      importance[`intent_${feature}`] = weight * 0.25;
    });

    Object.entries(featureSet.timingWeights).forEach(([feature, weight]) => {
      importance[`timing_${feature}`] = weight * 0.2;
    });

    return importance;
  }

  // A/B Testing Methods
  async createABTest(config: ABTestConfig): Promise<ABTestConfig> {
    // Validate traffic allocation adds up to 100%
    const totalAllocation = config.variants.reduce((sum, variant) => sum + variant.trafficAllocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Traffic allocation must add up to 100%');
    }

    config.status = 'draft';
    this.abTests.set(config.testId, config);

    this.emit('abtest:created', { testId: config.testId });
    return config;
  }

  async startABTest(testId: string): Promise<void> {
    const test = this.abTests.get(testId);
    if (!test) throw new Error('A/B test not found');

    test.status = 'running';
    test.startDate = new Date();

    // Update model traffic allocations
    for (const variant of test.variants) {
      const model = this.models.get(variant.modelId);
      if (model) {
        model.deployment.trafficAllocation = variant.trafficAllocation;
        model.deployment.status = 'deployed';
      }
    }

    this.emit('abtest:started', { testId });
  }

  async completeABTest(testId: string): Promise<ABTestConfig> {
    const test = this.abTests.get(testId);
    if (!test) throw new Error('A/B test not found');

    test.status = 'completed';
    test.endDate = new Date();

    // Calculate test results
    test.results = await this.calculateABTestResults(test);

    // Update winning model
    if (test.results && test.results.winningVariant) {
      const winningVariant = test.variants.find(v => v.id === test.results?.winningVariant);
      if (winningVariant) {
        const winningModel = this.models.get(winningVariant.modelId);
        if (winningModel) {
          winningModel.deployment.trafficAllocation = 100;
          // Set other models to 0 traffic
          test.variants.forEach(variant => {
            if (variant.id !== test.results?.winningVariant) {
              const model = this.models.get(variant.modelId);
              if (model) model.deployment.trafficAllocation = 0;
            }
          });
        }
      }
    }

    this.emit('abtest:completed', { testId, results: test.results });
    return test;
  }

  private async calculateABTestResults(test: ABTestConfig): Promise<ABTestConfig['results']> {
    // Simulate A/B test result calculation
    const variants = test.variants;
    const winningVariant = variants[Math.floor(Math.random() * variants.length)];

    return {
      winningVariant: winningVariant.id,
      confidenceLevel: 0.95 + Math.random() * 0.04,
      significantImprovement: Math.random() > 0.3,
      metrics: {
        accuracy_improvement: Math.random() * 0.05,
        conversion_rate_lift: Math.random() * 0.15,
        revenue_impact: Math.random() * 0.20
      }
    };
  }

  // Prediction Methods
  async generateIndustryPrediction(leadData: LeadData): Promise<IndustryPrediction> {
    // Classify industry first
    const classification = await this.classifyIndustry(leadData);
    const industryType = classification.primaryIndustry;

    // Get appropriate model
    const model = await this.getActiveModel(industryType);
    if (!model) {
      throw new Error(`No active model found for industry: ${industryType}`);
    }

    // Calculate industry-specific scores
    const scores = await this.calculatePredictionScores(leadData, model);
    const totalScore = Math.min(100, Math.max(0,
      scores.firmographicScore + scores.behavioralScore + scores.intentScore + scores.timingScore
    ));

    // Generate predictions
    const prediction = await this.generatePredictionDetails(leadData, model, totalScore);
    const insights = await this.generateIndustryInsights(leadData, industryType);
    const recommendations = await this.generateRecommendations(leadData, model, totalScore);

    return {
      industryType,
      score: totalScore,
      confidence: classification.confidence,
      modelVersion: model.version,
      prediction,
      breakdown: scores,
      industrySpecificInsights: insights,
      recommendations
    };
  }

  private async getActiveModel(industryType: IndustryType): Promise<IndustryModel | null> {
    // Find the deployed model with highest traffic allocation
    const industryModels = Array.from(this.models.values())
      .filter(model =>
        model.industryType === industryType &&
        model.deployment.status === 'deployed' &&
        model.deployment.trafficAllocation > 0
      )
      .sort((a, b) => b.deployment.trafficAllocation - a.deployment.trafficAllocation);

    return industryModels[0] || null;
  }

  private async calculatePredictionScores(leadData: LeadData, model: IndustryModel): Promise<IndustryPrediction['breakdown']> {
    const featureSet = model.featureSet;

    // Calculate weighted scores based on industry-specific features
    const firmographicScore = this.calculateFirmographicScore(leadData, featureSet.firmographicWeights);
    const behavioralScore = this.calculateBehavioralScore(leadData, featureSet.behavioralWeights);
    const intentScore = this.calculateIntentScore(leadData, featureSet.intentWeights);
    const timingScore = this.calculateTimingScore(leadData, featureSet.timingWeights);

    return {
      firmographicScore: Math.min(30, firmographicScore),
      behavioralScore: Math.min(25, behavioralScore),
      intentScore: Math.min(25, intentScore),
      timingScore: Math.min(20, timingScore)
    };
  }

  private calculateFirmographicScore(leadData: LeadData, weights: IndustryFeatureSet['firmographicWeights']): number {
    const firmographic = leadData.firmographic;
    let score = 0;

    // Company size scoring
    if (firmographic.companySize) {
      score += this.normalizeCompanySize(firmographic.companySize) * weights.companySize * 30;
    }

    // Revenue scoring
    if (firmographic.revenue !== null) {
      score += this.normalizeRevenue(firmographic.revenue) * weights.revenue * 30;
    }

    // Industry alignment scoring
    if (firmographic.industry) {
      score += this.calculateIndustryAlignment(firmographic.industry) * weights.industry * 30;
    }

    // Add other firmographic factors...

    return score;
  }

  private calculateBehavioralScore(leadData: LeadData, weights: IndustryFeatureSet['behavioralWeights']): number {
    const behavioral = leadData.behavioral;
    let score = 0;

    // Session count scoring
    score += Math.min(1, behavioral.sessionCount / 10) * weights.sessionCount * 25;

    // Time on site scoring
    score += Math.min(1, behavioral.timeOnSite / 300) * weights.timeOnSite * 25;

    // Content engagement scoring
    const avgEngagement = Object.values(behavioral.contentEngagement).reduce((a, b) => a + b, 0) / 5;
    score += Math.min(1, avgEngagement / 5) * weights.contentEngagement * 25;

    // Add other behavioral factors...

    return score;
  }

  private calculateIntentScore(leadData: LeadData, weights: IndustryFeatureSet['intentWeights']): number {
    const intent = leadData.intent;
    let score = 0;

    // Search keywords scoring
    score += Math.min(1, intent.searchKeywords.length / 10) * weights.searchKeywords * 25;

    // Buying stage signals scoring
    const avgBuyingStage = Object.values(intent.buyingStageSignals).reduce((a, b) => a + b, 0) / 4;
    score += avgBuyingStage * weights.buyingStageSignals * 25;

    // Urgency indicators scoring
    const urgencyValues = [
      intent.urgencyIndicators.fastTrackRequests ? 1 : 0,
      Math.min(1, intent.urgencyIndicators.demoRequests / 5),
      Math.min(1, intent.urgencyIndicators.contactFormSubmissions / 3),
      Math.min(1, intent.urgencyIndicators.salesInquiries / 2)
    ];
    const urgencyScore = urgencyValues.reduce((a, b) => a + b, 0) / 4;
    score += urgencyScore * weights.urgencyIndicators * 25;

    // Add other intent factors...

    return score;
  }

  private calculateTimingScore(leadData: LeadData, weights: IndustryFeatureSet['timingWeights']): number {
    const timing = leadData.timing;
    let score = 0;

    // Recent activity scoring
    score += (timing.recentActivity ? 1 : 0) * weights.recentActivity * 20;

    // Engagement velocity scoring
    score += Math.min(1, timing.engagementVelocity / 10) * weights.engagementVelocity * 20;

    // Seasonality scoring
    const seasonalityScore = timing.seasonality === 'high' ? 1 : timing.seasonality === 'medium' ? 0.6 : 0.3;
    score += seasonalityScore * weights.seasonality * 20;

    // Add other timing factors...

    return score;
  }

  private normalizeCompanySize(size: string): number {
    const sizeMap: Record<string, number> = {
      'startup': 0.3,
      'smb': 0.5,
      'mid_market': 0.7,
      'enterprise': 1.0
    };
    return sizeMap[size.toLowerCase()] || 0.5;
  }

  private normalizeRevenue(revenue: number): number {
    if (revenue < 1000000) return 0.3;
    if (revenue < 10000000) return 0.5;
    if (revenue < 100000000) return 0.7;
    if (revenue < 1000000000) return 0.9;
    return 1.0;
  }

  private calculateIndustryAlignment(industry: string): number {
    // Simplified industry alignment scoring
    return Math.random() * 0.5 + 0.5; // 0.5 to 1.0
  }

  private async generatePredictionDetails(leadData: LeadData, model: IndustryModel, totalScore: number): Promise<IndustryPrediction['prediction']> {
    return {
      dealSize: this.calculateDealSize(leadData, model, totalScore),
      closeProbability: this.calculateCloseProbability(totalScore),
      timeToClose: this.calculateTimeToClose(leadData, model),
      buyerProfile: this.determineBuyerProfile(leadData),
      nextBestAction: this.determineNextAction(leadData, totalScore)
    };
  }

  private calculateDealSize(leadData: LeadData, model: IndustryModel, score: number): number {
    // Industry-specific deal size calculation
    const industryMultipliers: Record<IndustryType, number> = {
      'saas': 1.2,
      'manufacturing': 2.5,
      'consulting': 1.8,
      'fintech': 2.0,
      'healthcare': 2.2,
      'ecommerce': 1.1,
      'education': 0.8,
      'real_estate': 1.5,
      'automotive': 2.0,
      'energy': 3.0,
      'media': 1.3,
      'nonprofit': 0.6,
      'government': 1.7,
      'retail': 1.2,
      'construction': 1.8,
      'agriculture': 1.4,
      'transportation': 1.9,
      'hospitality': 1.1,
      'legal': 1.6,
      'insurance': 1.7
    };

    const baseSize = 50000; // Base deal size
    const scoreMultiplier = Math.pow(score / 100, 1.5);
    const industryMultiplier = industryMultipliers[model.industryType] || 1.0;

    return Math.round(baseSize * scoreMultiplier * industryMultiplier);
  }

  private calculateCloseProbability(score: number): number {
    // Sigmoid function for close probability
    return Math.round(((1 / (1 + Math.exp(-(score - 50) / 15))) * 100)) / 100;
  }

  private calculateTimeToClose(leadData: LeadData, model: IndustryModel): number {
    // Industry-specific time to close (in days)
    const industryDays: Record<IndustryType, number> = {
      'saas': 45,
      'manufacturing': 120,
      'consulting': 75,
      'fintech': 90,
      'healthcare': 180,
      'ecommerce': 30,
      'education': 150,
      'real_estate': 60,
      'automotive': 90,
      'energy': 200,
      'media': 60,
      'nonprofit': 120,
      'government': 240,
      'retail': 45,
      'construction': 100,
      'agriculture': 90,
      'transportation': 85,
      'hospitality': 50,
      'legal': 110,
      'insurance': 95
    };

    return industryDays[model.industryType] || 90;
  }

  private determineBuyerProfile(leadData: LeadData): string {
    // Simplified buyer profile determination
    const profiles = ['enterprise_decision_maker', 'mid_market_evaluator', 'smb_owner', 'individual_user'];
    return profiles[Math.floor(Math.random() * profiles.length)];
  }

  private determineNextAction(leadData: LeadData, score: number): string {
    if (score >= 80) return 'Schedule demo immediately';
    if (score >= 60) return 'Send personalized proposal';
    if (score >= 40) return 'Nurture with targeted content';
    return 'Continue engagement and education';
  }

  private async generateIndustryInsights(leadData: LeadData, industryType: IndustryType): Promise<IndustryPrediction['industrySpecificInsights']> {
    return {
      industryBenchmarks: {
        averageScore: 65,
        topQuartileScore: 85,
        conversionRate: 0.15,
        averageDealSize: 75000
      },
      competitivePosition: 'Above average',
      marketTrends: [
        'Digital transformation acceleration',
        'Increased automation adoption',
        'Focus on cost optimization'
      ],
      seasonalFactors: [
        'Q4 budget cycles',
        'End of fiscal year urgency',
        'Holiday slow periods'
      ],
      industryRisks: [
        'Economic uncertainty',
        'Regulatory changes',
        'Technology disruption'
      ]
    };
  }

  private async generateRecommendations(leadData: LeadData, model: IndustryModel, score: number): Promise<IndustryPrediction['recommendations']> {
    const recommendations: IndustryPrediction['recommendations'] = [];

    if (score >= 80) {
      recommendations.push({
        action: 'Schedule immediate sales call',
        priority: 'high',
        expectedImpact: 0.8,
        reasoning: 'High score indicates strong buying intent and fit'
      });
    }

    if (score >= 60) {
      recommendations.push({
        action: 'Send personalized case study',
        priority: 'high',
        expectedImpact: 0.6,
        reasoning: 'Industry-specific success stories will resonate'
      });
    }

    recommendations.push({
      action: 'Track competitive mentions',
      priority: 'medium',
      expectedImpact: 0.4,
      reasoning: 'Monitor for competitive threats and opportunities'
    });

    return recommendations;
  }

  // Management Methods
  async getModel(modelId: string): Promise<IndustryModel | null> {
    return this.models.get(modelId) || null;
  }

  async getAllModels(industryType?: IndustryType): Promise<IndustryModel[]> {
    const models = Array.from(this.models.values());
    return industryType ? models.filter(m => m.industryType === industryType) : models;
  }

  async deployModel(modelId: string, trafficAllocation: number = 100): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) throw new Error('Model not found');

    model.deployment.status = 'deployed';
    model.deployment.trafficAllocation = trafficAllocation;
    model.deployment.deploymentDate = new Date();

    this.emit('model:deployed', { modelId, trafficAllocation });
  }

  async retireModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) throw new Error('Model not found');

    model.deployment.status = 'deprecated';
    model.deployment.trafficAllocation = 0;

    this.emit('model:retired', { modelId });
  }

  async getABTest(testId: string): Promise<ABTestConfig | null> {
    return this.abTests.get(testId) || null;
  }

  async getAllABTests(): Promise<ABTestConfig[]> {
    return Array.from(this.abTests.values());
  }

  // Utility Methods
  toMLFormat(prediction: IndustryPrediction): any {
    return {
      industryType: prediction.industryType,
      totalScore: prediction.score,
      confidence: prediction.confidence,
      dealSize: prediction.prediction.dealSize,
      closeProbability: prediction.prediction.closeProbability,
      timeToClose: prediction.prediction.timeToClose,
      buyerProfile: prediction.prediction.buyerProfile,
      firmographicScore: prediction.breakdown.firmographicScore,
      behavioralScore: prediction.breakdown.behavioralScore,
      intentScore: prediction.breakdown.intentScore,
      timingScore: prediction.breakdown.timingScore,
      modelVersion: prediction.modelVersion,
      timestamp: new Date().toISOString()
    };
  }

  getServiceHealth(): any {
    return {
      status: 'healthy',
      totalModels: this.models.size,
      deployedModels: Array.from(this.models.values()).filter(m => m.deployment.status === 'deployed').length,
      activeABTests: Array.from(this.abTests.values()).filter(t => t.status === 'running').length,
      lastUpdate: new Date().toISOString(),
      supportedIndustries: Array.from(this.industryFeatures.keys())
    };
  }

  async clearData(): Promise<void> {
    this.models.clear();
    this.abTests.clear();
    this.emit('data:cleared');
  }
}
