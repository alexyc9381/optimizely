import { EventEmitter } from 'events';
import { FeatureEngineer } from './feature-engineer';
import { LeadData, ModelConfig, ModelInfo, ScoringResult, TrainingData } from './ml-types';

/**
 * Core ML Scoring Service
 * Main service class that orchestrates the ML pipeline for revenue prediction
 */
export class MLScoringService extends EventEmitter {
  private featureEngineer: FeatureEngineer;
  private isInitialized: boolean = false;
  private currentModel: ModelConfig | null = null;
  private modelVersion: string = '1.0.0';

  constructor() {
    super();
    this.featureEngineer = new FeatureEngineer();
  }

  /**
   * Initialize the ML service with training data
   */
  public async initialize(trainingData?: TrainingData): Promise<void> {
    try {
      this.emit('initialization_started');

      // If no training data provided, use mock data for development
      const data = trainingData || this.generateMockTrainingData();

      // Set up default model configuration
      this.currentModel = this.getDefaultModelConfig();

      this.isInitialized = true;
      this.emit('initialization_completed');

    } catch (error) {
      this.emit('initialization_failed', error);
      throw error;
    }
  }

  /**
   * Score a lead using the ensemble ML models
   */
  public async scoreLead(leadData: LeadData): Promise<ScoringResult> {
    if (!this.isInitialized) {
      throw new Error('ML Scoring Service not initialized');
    }

    try {
            // Extract features
      const features = this.featureEngineer.extractFeatures(leadData);
      const baseScore = features.reduce((sum, feature) => sum + feature, 0) / features.length;

      // Get predictions from ensemble models
      const predictions = await this.ensemblePredict(features, leadData);

      // Calculate breakdown scores
      const breakdown = this.calculateBreakdown(leadData);

      // Determine buyer profile
      const buyerProfile = this.classifyBuyerProfile(leadData);

      // Get industry-specific adjustments
      const industrySpecific = this.getIndustrySpecificScore(leadData);

      const result: ScoringResult = {
        totalScore: breakdown.firmographic + breakdown.behavioral + breakdown.intent + breakdown.timing,
        confidence: baseScore * 0.9 + 0.1,
        breakdown,
        predictions,
        buyerProfile,
        industrySpecific,
        metadata: {
          modelVersion: this.modelVersion,
          scoredAt: new Date(),
          dataQuality: this.assessDataQuality(leadData),
          featureCount: features.length
        }
      };

      this.emit('lead_scored', { leadData, result });
      return result;

    } catch (error) {
      this.emit('scoring_error', error);
      throw error;
    }
  }

  /**
   * Ensemble prediction combining multiple models
   */
  private async ensemblePredict(features: number[], leadData: LeadData): Promise<ScoringResult['predictions']> {
    if (!this.currentModel) {
      throw new Error('No model available for prediction');
    }

    // Mock ensemble predictions - in production would use actual trained models
    const baseScore = features.reduce((sum, feature) => sum + feature, 0) / features.length;

    // Generate deal size prediction
    const dealSize = this.predictDealSize(baseScore, leadData);

    // Generate close probability
    const closeProb = this.predictCloseProb(baseScore, leadData);

    // Generate time to close
    const timeToClose = this.predictTimeToClose(baseScore, leadData);

          return {
        dealSize,
        closeProb,
        timeToClose
      };
  }

  private predictDealSize(score: number, leadData: LeadData): ScoringResult['predictions']['dealSize'] {
    const baseSize = leadData.firmographic.companySize === 'enterprise' ? 100000 :
                    leadData.firmographic.companySize === 'mid_market' ? 50000 :
                    leadData.firmographic.companySize === 'smb' ? 25000 : 10000;

    const predicted = baseSize * (0.5 + score);
    const variance = predicted * 0.3;

    return {
      predicted: Math.round(predicted),
      range: {
        min: Math.round(predicted - variance),
        max: Math.round(predicted + variance)
      },
      confidence: Math.min(score + 0.1, 0.95)
    };
  }

  private predictCloseProb(score: number, leadData: LeadData): ScoringResult['predictions']['closeProb'] {
    const baseProb = score * 0.8 + 0.1;

    // Adjust based on intent signals
    const intentBoost = Object.values(leadData.intent.buyingStageSignals).reduce((a, b) => a + b, 0) / 4;
    const probability = Math.min(baseProb + intentBoost * 0.2, 0.95);

    const timeframe = probability > 0.7 ? '30d' :
                     probability > 0.5 ? '60d' :
                     probability > 0.3 ? '90d' : '180d';

    return {
      probability,
      timeframe,
      confidence: Math.min(score + 0.2, 0.9)
    };
  }

  private predictTimeToClose(score: number, leadData: LeadData): ScoringResult['predictions']['timeToClose'] {
    const urgencyFactor = leadData.intent.urgencyIndicators.fastTrackRequests ? 0.5 :
                         leadData.intent.urgencyIndicators.demoRequests > 0 ? 0.7 : 1.0;

    const baseDays = leadData.firmographic.companySize === 'enterprise' ? 120 :
                    leadData.firmographic.companySize === 'mid_market' ? 60 :
                    leadData.firmographic.companySize === 'smb' ? 30 : 14;

    const predicted = Math.round(baseDays * urgencyFactor * (1.5 - score));
    const variance = predicted * 0.4;

    return {
      days: predicted,
      range: {
        min: Math.max(Math.round(predicted - variance), 1),
        max: Math.round(predicted + variance)
      },
      confidence: score * 0.8 + 0.1
    };
  }

  private calculateBreakdown(leadData: LeadData): ScoringResult['breakdown'] {
    // Calculate component scores based on feature weights
    const firmographic = this.scoreFirmographic(leadData.firmographic);
    const behavioral = this.scoreBehavioral(leadData.behavioral);
    const intent = this.scoreIntent(leadData.intent);
    const timing = this.scoreTiming(leadData.timing);

    return { firmographic, behavioral, intent, timing };
  }

  private scoreFirmographic(firmographic: LeadData['firmographic']): number {
    let score = 0;

    // Company size (0-10 points)
    const sizePoints = { startup: 3, smb: 6, mid_market: 8, enterprise: 10 };
    score += sizePoints[firmographic.companySize];

    // Revenue (0-8 points)
    if (firmographic.revenue) {
      score += Math.min(Math.log10(firmographic.revenue / 1000000 + 1) * 2, 8);
    }

    // Employee count (0-6 points)
    if (firmographic.employees) {
      score += Math.min(firmographic.employees / 100, 6);
    }

    // Tech stack sophistication (0-4 points)
    score += Math.min(firmographic.techStack.length / 5 * 4, 4);

    // Company maturity (0-2 points)
    const maturityPoints = { seed: 0.5, growth: 1.5, mature: 2 };
    score += maturityPoints[firmographic.companyMaturity];

    return Math.min(score, 30);
  }

  private scoreBehavioral(behavioral: LeadData['behavioral']): number {
    let score = 0;

    // Session engagement (0-10 points)
    score += Math.min(behavioral.sessionCount / 20 * 5, 5);
    score += Math.min(behavioral.avgSessionDuration / 600 * 3, 3);
    score += Math.min(behavioral.pageViewsPerSession / 10 * 2, 2);

    // Content engagement (0-10 points)
    const engagement = behavioral.contentEngagement;
    score += Math.min(engagement.documentsDownloaded / 3 * 2, 2);
    score += Math.min(engagement.videosWatched / 2 * 2, 2);
    score += Math.min(engagement.formsCompleted * 2, 2);
    score += Math.min(engagement.pricingPageViews / 5 * 2, 2);
    score += Math.min(engagement.featurePageViews / 8 * 2, 2);

    // Technical depth (0-3 points)
    const technical = behavioral.technicalDepth;
    score += technical.integrationDocsViewed ? 1 : 0;
    score += technical.apiDocsViewed ? 1 : 0;
    score += Math.min(technical.technicalResourcesAccessed / 3, 1);

    // Return pattern (0-2 points)
    const patternPoints = { single: 0, occasional: 0.5, frequent: 1.5, power_user: 2 };
    score += patternPoints[behavioral.returnVisitorPattern];

    return Math.min(score, 25);
  }

  private scoreIntent(intent: LeadData['intent']): number {
    let score = 0;

    // Search behavior (0-5 points)
    score += Math.min(intent.searchKeywords.length / 10 * 3, 3);
    score += intent.competitorResearch ? 2 : 0;

    // Buying stage (0-10 points)
    const stages = intent.buyingStageSignals;
    score += stages.awareness * 1;
    score += stages.consideration * 2;
    score += stages.decision * 3;
    score += stages.purchase * 4;

    // Content topics (0-3 points)
    score += Math.min(intent.contentTopicsEngaged.length / 5 * 3, 3);

    // Urgency indicators (0-5 points)
    const urgency = intent.urgencyIndicators;
    score += urgency.fastTrackRequests ? 2 : 0;
    score += Math.min(urgency.demoRequests, 1);
    score += Math.min(urgency.contactFormSubmissions, 1);
    score += Math.min(urgency.salesInquiries, 1);

    // Social proof (0-2 points)
    const social = intent.socialProof;
    score += Math.min((social.testimonialViews + social.caseStudyDownloads + social.customerSuccessStories) / 5, 2);

    return Math.min(score, 25);
  }

  private scoreTiming(timing: LeadData['timing']): number {
    let score = 0;

    // Business hours (0-5 points)
    const isBusinessDay = timing.dayOfWeek >= 1 && timing.dayOfWeek <= 5;
    const isBusinessHour = timing.hourOfDay >= 9 && timing.hourOfDay <= 17;
    score += isBusinessDay ? 2 : 0;
    score += isBusinessHour ? 3 : 1;

    // Seasonality (0-5 points)
    const seasonPoints = { low: 2, medium: 3, high: 5 };
    score += seasonPoints[timing.seasonality];

    // Recency and velocity (0-7 points)
    score += timing.recentActivity ? 3 : 0;
    score += Math.min(timing.engagementVelocity / 5 * 2, 2);
    score += Math.max(2 - timing.lastVisitDays / 7, 0); // Decay over weeks

    // Account maturity (0-3 points)
    score += Math.min(timing.accountAge / 30, 3); // Build trust over time

    return Math.min(score, 20);
  }

  private classifyBuyerProfile(leadData: LeadData): ScoringResult['buyerProfile'] {
    const { firmographic, behavioral, intent } = leadData;

    if (firmographic.companySize === 'enterprise' &&
        behavioral.technicalDepth.integrationDocsViewed &&
        intent.buyingStageSignals.decision > 0.5) {
      return 'enterprise_decision_maker';
    }

    if (firmographic.companySize === 'mid_market' &&
        behavioral.contentEngagement.documentsDownloaded > 0) {
      return 'mid_market_evaluator';
    }

    if (firmographic.companySize === 'smb' &&
        intent.urgencyIndicators.fastTrackRequests) {
      return 'smb_owner';
    }

    return 'individual_user';
  }

  private getIndustrySpecificScore(leadData: LeadData): ScoringResult['industrySpecific'] {
    const industry = leadData.firmographic.industry;

    // Mock industry-specific adjustments
    const industryModels = {
      'saas': { model: 'saas_v2.1', boost: 0.1, benchmark: 65 },
      'consulting': { model: 'consulting_v1.8', boost: 0.05, benchmark: 58 },
      'manufacturing': { model: 'manufacturing_v1.5', boost: -0.05, benchmark: 52 },
      'default': { model: 'general_v1.0', boost: 0, benchmark: 60 }
    };

    const config = industryModels[industry as keyof typeof industryModels] || industryModels.default;
    const baseScore = this.calculateBreakdown(leadData);
    const totalScore = baseScore.firmographic + baseScore.behavioral + baseScore.intent + baseScore.timing;

    return {
      modelUsed: config.model,
      industryScore: Math.min(totalScore * (1 + config.boost), 100),
      industryBenchmark: config.benchmark
    };
  }

  private assessDataQuality(leadData: LeadData): number {
    let quality = 0;
    let maxPoints = 0;

    // Firmographic completeness
    maxPoints += 10;
    quality += leadData.firmographic.revenue ? 3 : 0;
    quality += leadData.firmographic.employees ? 3 : 0;
    quality += leadData.firmographic.techStack.length > 0 ? 2 : 0;
    quality += leadData.firmographic.industry ? 2 : 0;

    // Behavioral data richness
    maxPoints += 10;
    quality += leadData.behavioral.sessionCount > 1 ? 3 : 0;
    quality += leadData.behavioral.contentEngagement.documentsDownloaded > 0 ? 2 : 0;
    quality += leadData.behavioral.contentEngagement.formsCompleted > 0 ? 3 : 0;
    quality += leadData.behavioral.technicalDepth.integrationDocsViewed ? 2 : 0;

    // Intent signal strength
    maxPoints += 10;
    quality += leadData.intent.searchKeywords.length > 0 ? 3 : 0;
    quality += Object.values(leadData.intent.buyingStageSignals).some(s => s > 0) ? 4 : 0;
    quality += leadData.intent.urgencyIndicators.demoRequests > 0 ? 3 : 0;

    return quality / maxPoints;
  }

  private generateMockTrainingData(): TrainingData {
    // Generate mock training data for development
    const samples = 1000;
    const features: number[][] = [];
    const targets: number[] = [];

    for (let i = 0; i < samples; i++) {
      const mockFeatures = Array.from({ length: 13 }, () => Math.random());
      const target = mockFeatures.reduce((sum, f) => sum + f, 0) / mockFeatures.length;

      features.push(mockFeatures);
      targets.push(target);
    }

    return { features, targets };
  }

  private getDefaultModelConfig(): ModelConfig {
    return {
      gradientBoosting: {
        nEstimators: 100,
        maxDepth: 6,
        learningRate: 0.1,
        subsample: 0.8
      },
      neuralNetwork: {
        hiddenLayers: [128, 64, 32],
        activation: 'relu',
        dropout: 0.3,
        batchSize: 32
      },
      randomForest: {
        nEstimators: 100,
        maxDepth: 10,
        minSamplesSplit: 5,
        minSamplesLeaf: 2
      },
      ensemble: {
        weights: { gradientBoosting: 0.4, neuralNetwork: 0.3, randomForest: 0.3 },
        votingStrategy: 'weighted'
      }
    };
  }

  /**
   * Get model information and health status
   */
  public getModelInfo(): ModelInfo {
    return {
      isInitialized: this.isInitialized,
      modelVersion: this.modelVersion,
      currentConfig: this.currentModel,
      lastUpdated: this.isInitialized ? new Date() : null
    };
  }

  /**
   * Batch scoring for multiple leads
   */
  public async scoreLeads(leads: LeadData[]): Promise<ScoringResult[]> {
    const results = await Promise.all(
      leads.map(lead => this.scoreLead(lead))
    );
    return results;
  }
}

// Singleton instance for global access
export const mlScoringService = new MLScoringService();
