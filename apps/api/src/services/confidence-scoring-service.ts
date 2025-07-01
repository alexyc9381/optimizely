import { PrismaClient } from '../generated/prisma';
import { LeadData, ModelPerformanceMetrics, ScoringResult } from './ml-types';

// Core Confidence Scoring Types
export interface ConfidenceMetrics {
  overallConfidence: number; // 0-1 overall prediction confidence
  componentConfidences: {
    firmographic: number; // 0-1 confidence in firmographic scoring
    behavioral: number; // 0-1 confidence in behavioral scoring
    intent: number; // 0-1 confidence in intent scoring
    timing: number; // 0-1 confidence in timing scoring
  };
  dataQuality: {
    score: number; // 0-1 overall data quality score
    completeness: number; // 0-1 data completeness ratio
    consistency: number; // 0-1 data consistency score
    recency: number; // 0-1 data freshness score
    reliability: number; // 0-1 data source reliability
  };
  uncertaintyBounds: {
    scoreRange: { min: number; max: number }; // Score prediction interval
    dealSizeRange: { min: number; max: number }; // Deal size confidence interval
    closeProbRange: { min: number; max: number }; // Close probability interval
    timeToCloseRange: { min: number; max: number }; // Time to close interval
  };
  recommendationLevel: 'high' | 'medium' | 'low' | 'insufficient'; // Action confidence
  metadata: {
    calculatedAt: Date;
    modelVersion: string;
    samplesUsed: number;
    validationScore: number;
  };
}

export interface ConfidenceThresholds {
  highConfidence: number; // Threshold for high confidence (e.g., 0.8)
  mediumConfidence: number; // Threshold for medium confidence (e.g., 0.6)
  lowConfidence: number; // Threshold for low confidence (e.g., 0.4)
  dataQualityMinimum: number; // Minimum data quality required (e.g., 0.5)
  uncertaintyTolerance: number; // Maximum acceptable uncertainty (e.g., 0.3)
}

export interface UncertaintyQuantification {
  aleatoricUncertainty: number; // Inherent data noise uncertainty
  epistemicUncertainty: number; // Model knowledge uncertainty
  totalUncertainty: number; // Combined uncertainty measure
  confidenceInterval: { lower: number; upper: number }; // Statistical CI
  predictionStability: number; // Consistency across model ensemble
}

export interface DataQualityAssessment {
  missingDataPenalty: number; // Impact of missing fields
  outlierDetection: {
    score: number; // Outlier likelihood (0-1)
    suspiciousFields: string[]; // Fields with potential outliers
  };
  temporalConsistency: number; // Consistency over time
  crossValidationScore: number; // Model validation performance
  sourceReliability: {
    firmographic: number; // Reliability of firmographic data
    behavioral: number; // Reliability of behavioral data
    intent: number; // Reliability of intent data
    timing: number; // Reliability of timing data
  };
}

export interface ConfidenceBasedRecommendation {
  action: 'engage' | 'nurture' | 'research' | 'disqualify';
  priority: 'immediate' | 'high' | 'medium' | 'low';
  confidence: number; // Confidence in the recommendation
  reasoning: string[]; // Explanatory factors
  riskLevel: 'low' | 'medium' | 'high'; // Risk of false positive/negative
  followUpActions: string[]; // Suggested next steps
}

export interface ConfidenceCalibration {
  calibrationCurve: Array<{ predictedConfidence: number; actualAccuracy: number }>;
  reliabilityIndex: number; // How well-calibrated the model is
  overconfidenceRatio: number; // Tendency to overestimate confidence
  underconfidenceRatio: number; // Tendency to underestimate confidence
  lastCalibrationDate: Date;
}

export default class ConfidenceScoringService {
  private prisma: PrismaClient;
  private defaultThresholds: ConfidenceThresholds;
  private calibrationData: ConfidenceCalibration | null = null;

  constructor() {
    this.prisma = new PrismaClient();
    this.defaultThresholds = {
      highConfidence: 0.8,
      mediumConfidence: 0.6,
      lowConfidence: 0.4,
      dataQualityMinimum: 0.5,
      uncertaintyTolerance: 0.3
    };
  }

  /**
   * Calculate comprehensive confidence metrics for a prediction
   */
  async calculateConfidenceMetrics(
    leadData: LeadData,
    scoringResult: ScoringResult,
    modelPerformance?: ModelPerformanceMetrics
  ): Promise<ConfidenceMetrics> {
    // Calculate component-wise confidence scores
    const componentConfidences = await this.calculateComponentConfidences(leadData, scoringResult);

    // Assess data quality impact
    const dataQuality = await this.assessDataQuality(leadData);

    // Quantify uncertainty bounds
    const uncertaintyBounds = await this.calculateUncertaintyBounds(leadData, scoringResult);

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(
      componentConfidences,
      dataQuality,
      modelPerformance
    );

    // Determine recommendation level
    const recommendationLevel = this.determineRecommendationLevel(overallConfidence, dataQuality);

    return {
      overallConfidence,
      componentConfidences,
      dataQuality,
      uncertaintyBounds,
      recommendationLevel,
      metadata: {
        calculatedAt: new Date(),
        modelVersion: scoringResult.metadata.modelVersion,
        samplesUsed: modelPerformance?.sampleSize || 1000,
        validationScore: modelPerformance?.accuracy || 0.9
      }
    };
  }

  /**
   * Calculate confidence for each scoring component
   */
  private async calculateComponentConfidences(
    leadData: LeadData,
    scoringResult: ScoringResult
  ): Promise<ConfidenceMetrics['componentConfidences']> {
    const { firmographic, behavioral, intent, timing } = leadData;
    const { breakdown } = scoringResult;

    // Firmographic confidence based on data completeness and quality
    const firmographicConfidence = this.calculateFirmographicConfidence(firmographic, breakdown.firmographic);

    // Behavioral confidence based on data richness and patterns
    const behavioralConfidence = this.calculateBehavioralConfidence(behavioral, breakdown.behavioral);

    // Intent confidence based on signal strength and consistency
    const intentConfidence = this.calculateIntentConfidence(intent, breakdown.intent);

    // Timing confidence based on temporal patterns and recency
    const timingConfidence = this.calculateTimingConfidence(timing, breakdown.timing);

    return {
      firmographic: firmographicConfidence,
      behavioral: behavioralConfidence,
      intent: intentConfidence,
      timing: timingConfidence
    };
  }

  /**
   * Calculate firmographic data confidence
   */
  private calculateFirmographicConfidence(firmographic: LeadData['firmographic'], score: number): number {
    let confidence = 0.5; // Base confidence

    // Company size confidence
    if (firmographic.companySize && firmographic.companySize !== 'startup') {
      confidence += 0.15;
    }

    // Industry confidence
    if (firmographic.industry && firmographic.industry.length > 0) {
      confidence += 0.1;
    }

    // Revenue data confidence
    if (firmographic.revenue && firmographic.revenue > 0) {
      confidence += 0.15;
    }

    // Employee count confidence
    if (firmographic.employees && firmographic.employees > 0) {
      confidence += 0.1;
    }

    // Tech stack confidence
    if (firmographic.techStack && firmographic.techStack.length > 0) {
      confidence += 0.05;
    }

    // Location data confidence
    if (firmographic.geolocation?.country && firmographic.geolocation?.region) {
      confidence += 0.05;
    }

    // Score consistency check
    const expectedScore = this.estimateExpectedFirmographicScore(firmographic);
    const scoreDifference = Math.abs(score - expectedScore) / 30; // Normalize by max score
    confidence -= scoreDifference * 0.2; // Penalty for inconsistency

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate behavioral data confidence
   */
  private calculateBehavioralConfidence(behavioral: LeadData['behavioral'], score: number): number {
    let confidence = 0.4; // Base confidence

    // Session data richness
    if (behavioral.sessionCount > 3) {
      confidence += 0.15;
    } else if (behavioral.sessionCount > 1) {
      confidence += 0.1;
    }

    // Engagement depth
    if (behavioral.avgSessionDuration > 120) { // 2 minutes
      confidence += 0.1;
    }

    // Content engagement
    const contentEngagement = behavioral.contentEngagement;
    if (contentEngagement.documentsDownloaded > 0) confidence += 0.05;
    if (contentEngagement.videosWatched > 0) confidence += 0.05;
    if (contentEngagement.formsCompleted > 0) confidence += 0.1;
    if (contentEngagement.pricingPageViews > 0) confidence += 0.1;

    // Technical depth
    const technicalDepth = behavioral.technicalDepth;
    if (technicalDepth.integrationDocsViewed) confidence += 0.05;
    if (technicalDepth.apiDocsViewed) confidence += 0.05;
    if (technicalDepth.technicalResourcesAccessed > 0) confidence += 0.05;

    // Return visitor pattern
    if (behavioral.returnVisitorPattern === 'power_user') {
      confidence += 0.15;
    } else if (behavioral.returnVisitorPattern === 'frequent') {
      confidence += 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate intent signal confidence
   */
  private calculateIntentConfidence(intent: LeadData['intent'], score: number): number {
    let confidence = 0.3; // Base confidence

    // Search keywords confidence
    if (intent.searchKeywords && intent.searchKeywords.length > 0) {
      confidence += 0.1 + (intent.searchKeywords.length * 0.02);
    }

    // Competitor research signal
    if (intent.competitorResearch) {
      confidence += 0.15;
    }

    // Buying stage signals
    const buyingStage = intent.buyingStageSignals;
    const totalBuyingSignals = buyingStage.awareness + buyingStage.consideration +
                              buyingStage.decision + buyingStage.purchase;
    if (totalBuyingSignals > 2) {
      confidence += 0.2;
    } else if (totalBuyingSignals > 1) {
      confidence += 0.1;
    }

    // Content engagement
    if (intent.contentTopicsEngaged && intent.contentTopicsEngaged.length > 0) {
      confidence += 0.05 + (intent.contentTopicsEngaged.length * 0.02);
    }

    // Urgency indicators
    const urgency = intent.urgencyIndicators;
    if (urgency.fastTrackRequests) confidence += 0.1;
    if (urgency.demoRequests > 0) confidence += 0.1;
    if (urgency.contactFormSubmissions > 0) confidence += 0.08;
    if (urgency.salesInquiries > 0) confidence += 0.12;

    // Social proof engagement
    const socialProof = intent.socialProof;
    if (socialProof.testimonialViews > 0) confidence += 0.03;
    if (socialProof.caseStudyDownloads > 0) confidence += 0.05;
    if (socialProof.customerSuccessStories > 0) confidence += 0.04;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate timing factor confidence
   */
  private calculateTimingConfidence(timing: LeadData['timing'], score: number): number {
    let confidence = 0.5; // Base confidence

    // Recent activity boost
    if (timing.recentActivity) {
      confidence += 0.2;
    }

    // Engagement velocity
    if (timing.engagementVelocity > 1) {
      confidence += 0.15;
    } else if (timing.engagementVelocity > 0.5) {
      confidence += 0.1;
    }

    // Account age appropriateness
    if (timing.accountAge > 7 && timing.accountAge < 90) { // Sweet spot
      confidence += 0.1;
    } else if (timing.accountAge > 1) {
      confidence += 0.05;
    }

    // Seasonality considerations
    if (timing.seasonality === 'high') {
      confidence += 0.1;
    } else if (timing.seasonality === 'medium') {
      confidence += 0.05;
    }

    // Last visit recency
    if (timing.lastVisitDays <= 3) {
      confidence += 0.1;
    } else if (timing.lastVisitDays <= 7) {
      confidence += 0.05;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Assess overall data quality
   */
  private async assessDataQuality(leadData: LeadData): Promise<ConfidenceMetrics['dataQuality']> {
    // Calculate completeness score
    const completeness = this.calculateDataCompleteness(leadData);

    // Calculate consistency score
    const consistency = this.calculateDataConsistency(leadData);

    // Calculate recency score
    const recency = this.calculateDataRecency(leadData);

    // Calculate reliability score
    const reliability = this.calculateDataReliability(leadData);

    // Overall data quality score
    const score = (completeness * 0.3) + (consistency * 0.25) + (recency * 0.25) + (reliability * 0.2);

    return {
      score,
      completeness,
      consistency,
      recency,
      reliability
    };
  }

  /**
   * Calculate data completeness ratio
   */
  private calculateDataCompleteness(leadData: LeadData): number {
    let totalFields = 0;
    let completedFields = 0;

    // Firmographic completeness
    totalFields += 7; // companySize, industry, revenue, employees, techStack, companyMaturity, geolocation
    if (leadData.firmographic.companySize) completedFields++;
    if (leadData.firmographic.industry) completedFields++;
    if (leadData.firmographic.revenue !== null) completedFields++;
    if (leadData.firmographic.employees !== null) completedFields++;
    if (leadData.firmographic.techStack?.length > 0) completedFields++;
    if (leadData.firmographic.companyMaturity) completedFields++;
    if (leadData.firmographic.geolocation?.country) completedFields++;

    // Behavioral completeness
    totalFields += 6; // sessionCount, avgSessionDuration, pageViewsPerSession, contentEngagement, technicalDepth, returnVisitorPattern
    if (leadData.behavioral.sessionCount > 0) completedFields++;
    if (leadData.behavioral.avgSessionDuration > 0) completedFields++;
    if (leadData.behavioral.pageViewsPerSession > 0) completedFields++;
    if (leadData.behavioral.contentEngagement) completedFields++;
    if (leadData.behavioral.technicalDepth) completedFields++;
    if (leadData.behavioral.returnVisitorPattern) completedFields++;

    // Intent completeness
    totalFields += 6; // searchKeywords, competitorResearch, buyingStageSignals, contentTopicsEngaged, urgencyIndicators, socialProof
    if (leadData.intent.searchKeywords?.length > 0) completedFields++;
    if (typeof leadData.intent.competitorResearch === 'boolean') completedFields++;
    if (leadData.intent.buyingStageSignals) completedFields++;
    if (leadData.intent.contentTopicsEngaged?.length > 0) completedFields++;
    if (leadData.intent.urgencyIndicators) completedFields++;
    if (leadData.intent.socialProof) completedFields++;

    // Timing completeness
    totalFields += 8; // All timing fields
    if (typeof leadData.timing.dayOfWeek === 'number') completedFields++;
    if (typeof leadData.timing.hourOfDay === 'number') completedFields++;
    if (typeof leadData.timing.monthOfYear === 'number') completedFields++;
    if (typeof leadData.timing.quarterOfYear === 'number') completedFields++;
    if (leadData.timing.seasonality) completedFields++;
    if (typeof leadData.timing.recentActivity === 'boolean') completedFields++;
    if (typeof leadData.timing.engagementVelocity === 'number') completedFields++;
    if (typeof leadData.timing.lastVisitDays === 'number') completedFields++;

    return completedFields / totalFields;
  }

  /**
   * Calculate data consistency score
   */
  private calculateDataConsistency(leadData: LeadData): number {
    let consistencyScore = 1.0;

    // Check firmographic consistency
    if (leadData.firmographic.companySize === 'startup' && leadData.firmographic.employees && leadData.firmographic.employees > 500) {
      consistencyScore -= 0.2; // Inconsistent startup with many employees
    }

    if (leadData.firmographic.revenue && leadData.firmographic.employees) {
      const revenuePerEmployee = leadData.firmographic.revenue / leadData.firmographic.employees;
      if (revenuePerEmployee > 1000000 || revenuePerEmployee < 10000) { // Unusual ratios
        consistencyScore -= 0.1;
      }
    }

    // Check behavioral consistency
    if (leadData.behavioral.sessionCount > 0 && leadData.behavioral.avgSessionDuration === 0) {
      consistencyScore -= 0.15; // Sessions without duration
    }

    if (leadData.behavioral.pageViewsPerSession > 20) { // Unusually high page views
      consistencyScore -= 0.1;
    }

    // Check intent consistency
    const totalBuyingSignals = Object.values(leadData.intent.buyingStageSignals).reduce((sum, val) => sum + val, 0);
    if (totalBuyingSignals > 4) { // Impossible total
      consistencyScore -= 0.15;
    }

    // Check timing consistency
    if (leadData.timing.engagementVelocity > 10) { // Unrealistic velocity
      consistencyScore -= 0.1;
    }

    if (leadData.timing.accountAge < 0) { // Invalid account age
      consistencyScore -= 0.2;
    }

    return Math.max(0, consistencyScore);
  }

  /**
   * Calculate data recency score
   */
  private calculateDataRecency(leadData: LeadData): number {
    // For this implementation, we'll use timing data as a proxy for recency
    let recencyScore = 0.5; // Base score

    if (leadData.timing.recentActivity) {
      recencyScore += 0.3;
    }

    if (leadData.timing.lastVisitDays <= 1) {
      recencyScore += 0.2;
    } else if (leadData.timing.lastVisitDays <= 7) {
      recencyScore += 0.1;
    } else if (leadData.timing.lastVisitDays > 30) {
      recencyScore -= 0.2;
    }

    return Math.max(0, Math.min(1, recencyScore));
  }

  /**
   * Calculate data source reliability
   */
  private calculateDataReliability(leadData: LeadData): number {
    // In a real implementation, this would assess the reliability of data sources
    // For now, we'll provide a reasonable default based on data quality indicators
    let reliability = 0.7; // Base reliability

    // Higher reliability for complete profiles
    const completeness = this.calculateDataCompleteness(leadData);
    reliability += completeness * 0.2;

    // Higher reliability for consistent data
    const consistency = this.calculateDataConsistency(leadData);
    reliability += consistency * 0.1;

    return Math.max(0, Math.min(1, reliability));
  }

  /**
   * Calculate uncertainty bounds for predictions
   */
  private async calculateUncertaintyBounds(
    leadData: LeadData,
    scoringResult: ScoringResult
  ): Promise<ConfidenceMetrics['uncertaintyBounds']> {
    // Calculate score uncertainty (simplified approach)
    const scoreVariance = this.calculateScoreVariance(leadData, scoringResult);
    const scoreStdDev = Math.sqrt(scoreVariance);

    // 95% confidence interval for score
    const scoreRange = {
      min: Math.max(0, scoringResult.totalScore - (1.96 * scoreStdDev)),
      max: Math.min(100, scoringResult.totalScore + (1.96 * scoreStdDev))
    };

    // Deal size confidence interval
    const dealSizeStdDev = scoringResult.predictions.dealSize.predicted * 0.3; // 30% uncertainty
    const dealSizeRange = {
      min: Math.max(0, scoringResult.predictions.dealSize.predicted - (1.96 * dealSizeStdDev)),
      max: scoringResult.predictions.dealSize.predicted + (1.96 * dealSizeStdDev)
    };

    // Close probability confidence interval
    const closeProbStdDev = 0.1; // 10% uncertainty
    const closeProbRange = {
      min: Math.max(0, scoringResult.predictions.closeProb.probability - (1.96 * closeProbStdDev)),
      max: Math.min(1, scoringResult.predictions.closeProb.probability + (1.96 * closeProbStdDev))
    };

    // Time to close confidence interval
    const timeToCloseStdDev = scoringResult.predictions.timeToClose.days * 0.4; // 40% uncertainty
    const timeToCloseRange = {
      min: Math.max(0, scoringResult.predictions.timeToClose.days - (1.96 * timeToCloseStdDev)),
      max: scoringResult.predictions.timeToClose.days + (1.96 * timeToCloseStdDev)
    };

    return {
      scoreRange,
      dealSizeRange,
      closeProbRange,
      timeToCloseRange
    };
  }

  /**
   * Calculate overall confidence from component scores
   */
  private calculateOverallConfidence(
    componentConfidences: ConfidenceMetrics['componentConfidences'],
    dataQuality: ConfidenceMetrics['dataQuality'],
    modelPerformance?: ModelPerformanceMetrics
  ): number {
    // Weighted average of component confidences
    const componentWeights = {
      firmographic: 0.3,
      behavioral: 0.25,
      intent: 0.25,
      timing: 0.2
    };

    const weightedComponentConfidence =
      (componentConfidences.firmographic * componentWeights.firmographic) +
      (componentConfidences.behavioral * componentWeights.behavioral) +
      (componentConfidences.intent * componentWeights.intent) +
      (componentConfidences.timing * componentWeights.timing);

    // Combine with data quality (70% component confidence, 20% data quality, 10% model performance)
    const modelConfidence = modelPerformance?.accuracy || 0.9;

    const overallConfidence =
      (weightedComponentConfidence * 0.7) +
      (dataQuality.score * 0.2) +
      (modelConfidence * 0.1);

    return Math.max(0, Math.min(1, overallConfidence));
  }

  /**
   * Determine recommendation level based on confidence and data quality
   */
  private determineRecommendationLevel(
    overallConfidence: number,
    dataQuality: ConfidenceMetrics['dataQuality']
  ): ConfidenceMetrics['recommendationLevel'] {
    // Minimum data quality check
    if (dataQuality.score < this.defaultThresholds.dataQualityMinimum) {
      return 'insufficient';
    }

    // Confidence-based levels
    if (overallConfidence >= this.defaultThresholds.highConfidence) {
      return 'high';
    } else if (overallConfidence >= this.defaultThresholds.mediumConfidence) {
      return 'medium';
    } else if (overallConfidence >= this.defaultThresholds.lowConfidence) {
      return 'low';
    } else {
      return 'insufficient';
    }
  }

  /**
   * Generate confidence-based recommendations
   */
  async generateConfidenceBasedRecommendations(
    leadData: LeadData,
    scoringResult: ScoringResult,
    confidenceMetrics: ConfidenceMetrics
  ): Promise<ConfidenceBasedRecommendation> {
    const { overallConfidence, recommendationLevel, dataQuality } = confidenceMetrics;
    const score = scoringResult.totalScore;

    let action: ConfidenceBasedRecommendation['action'];
    let priority: ConfidenceBasedRecommendation['priority'];
    let riskLevel: ConfidenceBasedRecommendation['riskLevel'];
    const reasoning: string[] = [];
    const followUpActions: string[] = [];

    // Determine action based on score and confidence
    if (recommendationLevel === 'insufficient') {
      action = 'research';
      priority = 'low';
      riskLevel = 'high';
      reasoning.push('Insufficient data quality or confidence for reliable prediction');
      followUpActions.push('Gather additional data points');
      followUpActions.push('Improve data collection mechanisms');
    } else if (score >= 80 && overallConfidence >= 0.7) {
      action = 'engage';
      priority = overallConfidence >= 0.9 ? 'immediate' : 'high';
      riskLevel = 'low';
      reasoning.push(`High score (${score}) with strong confidence (${(overallConfidence * 100).toFixed(1)}%)`);
      followUpActions.push('Schedule immediate sales outreach');
      followUpActions.push('Prepare personalized demo');
    } else if (score >= 60 && overallConfidence >= 0.6) {
      action = 'nurture';
      priority = 'medium';
      riskLevel = 'medium';
      reasoning.push(`Medium score (${score}) with moderate confidence`);
      followUpActions.push('Add to nurture campaign');
      followUpActions.push('Monitor engagement patterns');
    } else if (score >= 40) {
      action = 'nurture';
      priority = 'low';
      riskLevel = 'medium';
      reasoning.push(`Lower score (${score}) but potential for improvement`);
      followUpActions.push('Long-term nurture sequence');
      followUpActions.push('Educational content delivery');
    } else {
      action = 'disqualify';
      priority = 'low';
      riskLevel = overallConfidence >= 0.7 ? 'low' : 'medium';
      reasoning.push(`Low score (${score}) with limited potential`);
      followUpActions.push('Archive or remove from active campaigns');
    }

    // Add data quality reasoning
    if (dataQuality.score < 0.7) {
      reasoning.push(`Data quality concerns (${(dataQuality.score * 100).toFixed(1)}%)`);
      followUpActions.push('Improve data collection');
    }

    // Add component-specific reasoning
    if (confidenceMetrics.componentConfidences.intent < 0.5) {
      reasoning.push('Weak intent signals detected');
      followUpActions.push('Focus on intent signal collection');
    }

    if (confidenceMetrics.componentConfidences.behavioral < 0.5) {
      reasoning.push('Limited behavioral data available');
      followUpActions.push('Enhance behavioral tracking');
    }

    return {
      action,
      priority,
      confidence: overallConfidence,
      reasoning,
      riskLevel,
      followUpActions
    };
  }

  // Helper methods for uncertainty quantification and detailed assessments
  private estimateExpectedFirmographicScore(firmographic: LeadData['firmographic']): number {
    let score = 0;

    // Company size scoring
    switch (firmographic.companySize) {
      case 'enterprise': score += 25; break;
      case 'mid_market': score += 20; break;
      case 'smb': score += 15; break;
      case 'startup': score += 10; break;
    }

    // Industry bonus (simplified)
    if (firmographic.industry === 'technology') score += 5;

    return Math.min(30, score); // Max firmographic score is 30
  }

  private calculateScoreVariance(leadData: LeadData, scoringResult: ScoringResult): number {
    // Simplified variance calculation based on data quality and model uncertainty
    const dataQualityVariance = (1 - scoringResult.metadata.dataQuality) * 100;
    const modelVariance = (1 - scoringResult.confidence) * 50;
    return dataQualityVariance + modelVariance;
  }

  private calculateEpistemicUncertainty(leadData: LeadData, scoringResult: ScoringResult): number {
    // Model uncertainty based on prediction confidence and feature coverage
    const baseUncertainty = 1 - scoringResult.confidence;
    const featureCoverage = this.calculateDataCompleteness(leadData);
    return baseUncertainty * (1 - featureCoverage);
  }
}
