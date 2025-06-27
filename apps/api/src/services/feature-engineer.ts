import { LeadData } from './ml-types';

/**
 * Feature Engineering Pipeline
 * Transforms raw lead data into ML-ready features for revenue prediction
 */
export class FeatureEngineer {

  /**
   * Extract and engineer features from lead data
   * @param leadData Raw lead data
   * @returns Normalized feature vector
   */
  public extractFeatures(leadData: LeadData): number[] {
    const features: number[] = [];

    // Firmographic features
    const sizeMapping = { startup: 0.2, smb: 0.4, mid_market: 0.7, enterprise: 1.0 };
    features.push(sizeMapping[leadData.firmographic.companySize]);
    features.push(leadData.firmographic.revenue ? Math.log10(leadData.firmographic.revenue + 1) / 10 : 0);
    features.push(leadData.firmographic.employees ? Math.min(leadData.firmographic.employees / 1000, 1) : 0);

    // Behavioral features
    features.push(Math.min(leadData.behavioral.sessionCount / 50, 1));
    features.push(Math.min(leadData.behavioral.avgSessionDuration / 1800, 1));
    features.push(Math.min(leadData.behavioral.contentEngagement.documentsDownloaded / 10, 1));

    // Intent features
    features.push(leadData.intent.buyingStageSignals.awareness);
    features.push(leadData.intent.buyingStageSignals.consideration);
    features.push(leadData.intent.buyingStageSignals.decision);
    features.push(leadData.intent.buyingStageSignals.purchase);

    // Timing features
    features.push(Math.sin(2 * Math.PI * leadData.timing.dayOfWeek / 7));
    features.push(Math.cos(2 * Math.PI * leadData.timing.dayOfWeek / 7));
    features.push(leadData.timing.recentActivity ? 1 : 0);

    return features;
  }

  /**
   * Get feature names for model interpretability
   */
  public getFeatureNames(): string[] {
    return [
      'company_size', 'revenue_log', 'employee_count',
      'session_count', 'session_duration', 'documents_downloaded',
      'awareness_score', 'consideration_score', 'decision_score', 'purchase_score',
      'day_of_week_sin', 'day_of_week_cos', 'recent_activity'
    ];
  }

  private extractFirmographicFeatures(firmographic: LeadData['firmographic']): number[] {
    const features: number[] = [];

    // Company size encoding (categorical to numerical)
    const sizeMapping = { startup: 0.2, smb: 0.4, mid_market: 0.7, enterprise: 1.0 };
    features.push(sizeMapping[firmographic.companySize]);

    // Revenue normalization (log scale to handle wide range)
    features.push(firmographic.revenue ? Math.log10(firmographic.revenue + 1) / 10 : 0);

    // Employee count normalization
    features.push(firmographic.employees ? Math.min(firmographic.employees / 1000, 1) : 0);

    // Tech stack sophistication (diversity and complexity)
    features.push(Math.min(firmographic.techStack.length / 10, 1));

    // Company maturity encoding
    const maturityMapping = { seed: 0.3, growth: 0.7, mature: 1.0 };
    features.push(maturityMapping[firmographic.companyMaturity]);

    // Geographic market tier
    features.push(this.encodeGeography(firmographic.geolocation));

    return features;
  }

  private extractBehavioralFeatures(behavioral: LeadData['behavioral']): number[] {
    const features: number[] = [];

    // Session patterns (engagement depth indicators)
    features.push(Math.min(behavioral.sessionCount / 50, 1));
    features.push(Math.min(behavioral.avgSessionDuration / 1800, 1)); // 30 min max
    features.push(Math.min(behavioral.pageViewsPerSession / 20, 1));

    // Content engagement depth
    const engagement = behavioral.contentEngagement;
    features.push(Math.min(engagement.documentsDownloaded / 10, 1));
    features.push(Math.min(engagement.videosWatched / 5, 1));
    features.push(Math.min(engagement.formsCompleted / 3, 1));
    features.push(Math.min(engagement.pricingPageViews / 10, 1));
    features.push(Math.min(engagement.featurePageViews / 15, 1));

    // Technical sophistication indicators
    const technical = behavioral.technicalDepth;
    features.push(technical.integrationDocsViewed ? 1 : 0);
    features.push(technical.apiDocsViewed ? 1 : 0);
    features.push(Math.min(technical.technicalResourcesAccessed / 5, 1));

    // Overall engagement metrics
    features.push(Math.min(behavioral.timeOnSite / 3600, 1)); // 1 hour max

    // Visitor pattern encoding (loyalty/commitment indicator)
    const patternMapping = { single: 0.2, occasional: 0.4, frequent: 0.7, power_user: 1.0 };
    features.push(patternMapping[behavioral.returnVisitorPattern]);

    return features;
  }

  private extractIntentFeatures(intent: LeadData['intent']): number[] {
    const features: number[] = [];

    // Search behavior analysis
    features.push(Math.min(intent.searchKeywords.length / 20, 1));
    features.push(intent.competitorResearch ? 1 : 0);

    // Buying stage progression (sales funnel position)
    const stages = intent.buyingStageSignals;
    features.push(stages.awareness);
    features.push(stages.consideration);
    features.push(stages.decision);
    features.push(stages.purchase);

    // Content topic diversity (breadth of interest)
    features.push(Math.min(intent.contentTopicsEngaged.length / 10, 1));

    // Urgency indicators (buying readiness signals)
    const urgency = intent.urgencyIndicators;
    features.push(urgency.fastTrackRequests ? 1 : 0);
    features.push(Math.min(urgency.demoRequests / 3, 1));
    features.push(Math.min(urgency.contactFormSubmissions / 2, 1));
    features.push(Math.min(urgency.salesInquiries / 2, 1));

    // Social proof engagement (trust building)
    const social = intent.socialProof;
    const socialEngagement = social.testimonialViews + social.caseStudyDownloads + social.customerSuccessStories;
    features.push(Math.min(socialEngagement / 10, 1));

    return features;
  }

  private extractTimingFeatures(timing: LeadData['timing']): number[] {
    const features: number[] = [];

    // Cyclical time encoding (preserves periodicity)
    // Day of week (business vs weekend patterns)
    features.push(Math.sin(2 * Math.PI * timing.dayOfWeek / 7));
    features.push(Math.cos(2 * Math.PI * timing.dayOfWeek / 7));

    // Hour of day (business hours vs off-hours)
    features.push(Math.sin(2 * Math.PI * timing.hourOfDay / 24));
    features.push(Math.cos(2 * Math.PI * timing.hourOfDay / 24));

    // Month of year (seasonal patterns)
    features.push(Math.sin(2 * Math.PI * timing.monthOfYear / 12));
    features.push(Math.cos(2 * Math.PI * timing.monthOfYear / 12));

    // Seasonality impact on buying behavior
    const seasonMapping = { low: 0.3, medium: 0.6, high: 1.0 };
    features.push(seasonMapping[timing.seasonality]);

    // Activity recency and engagement velocity
    features.push(timing.recentActivity ? 1 : 0);
    features.push(Math.min(timing.engagementVelocity / 10, 1));

    // Recency decay (more recent = higher score)
    features.push(Math.max(1 - timing.lastVisitDays / 30, 0));

    // Account maturity (relationship building over time)
    features.push(Math.min(timing.accountAge / 365, 1));

    return features;
  }

  private extractDerivedFeatures(leadData: LeadData): number[] {
    const features: number[] = [];

    // Cross-signal correlations
    const behavioralScore = leadData.behavioral.sessionCount * leadData.behavioral.avgSessionDuration;
    const intentScore = Object.values(leadData.intent.buyingStageSignals).reduce((a, b) => a + b, 0);

    // Behavioral-intent correlation
    features.push(Math.min(behavioralScore / 10000, 1));

    // Overall intent strength
    features.push(intentScore / 4); // Normalized by number of stages

    // Engagement consistency (behavioral + temporal alignment)
    const consistencyScore = (
      leadData.behavioral.returnVisitorPattern === 'power_user' &&
      leadData.timing.recentActivity
    ) ? 1 : 0;
    features.push(consistencyScore);

    // Technical alignment (tech interest + tech capacity)
    const techAlignment = (
      leadData.firmographic.techStack.length > 0 &&
      leadData.behavioral.technicalDepth.integrationDocsViewed
    ) ? 1 : 0;
    features.push(techAlignment);

    return features;
  }

  private encodeGeography(geo: LeadData['firmographic']['geolocation']): number {
    // Market tier classification based on economic indicators
    const tierOneCountries = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'NL', 'SE', 'NO', 'DK'];
    const tierTwoCountries = ['JP', 'ES', 'IT', 'BE', 'AT', 'CH', 'FI'];

    if (tierOneCountries.includes(geo.country)) return 1.0;
    if (tierTwoCountries.includes(geo.country)) return 0.8;
    return 0.6; // Tier three markets
  }

  /**
   * Normalize features to ensure consistent scale across all inputs
   */
  public normalizeFeatures(features: number[]): number[] {
    return features.map(feature => {
      // Ensure features are bounded between 0 and 1
      return Math.max(0, Math.min(1, feature));
    });
  }

  /**
   * Create feature importance weights for model interpretability
   */
  public getFeatureImportanceWeights(): { [key: string]: number } {
    const featureNames = this.getFeatureNames();
    const weights: { [key: string]: number } = {};

    // Assign importance weights based on business logic
    featureNames.forEach((name, index) => {
      if (name.includes('company_size') || name.includes('revenue')) {
        weights[name] = 0.15; // High importance - firmographic indicators
      } else if (name.includes('stage_score') || name.includes('demo_requests')) {
        weights[name] = 0.12; // High importance - intent signals
      } else if (name.includes('session') || name.includes('engagement')) {
        weights[name] = 0.10; // Medium-high importance - behavioral patterns
      } else if (name.includes('timing') || name.includes('seasonality')) {
        weights[name] = 0.08; // Medium importance - temporal factors
      } else {
        weights[name] = 0.05; // Base importance for other features
      }
    });

    return weights;
  }

  /**
   * Validate input data quality before feature extraction
   */
  public validateInputData(leadData: LeadData): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for required firmographic data
    if (!leadData.firmographic.industry) {
      issues.push('Missing industry information');
    }

    if (!leadData.firmographic.companySize) {
      issues.push('Missing company size information');
    }

    // Check for meaningful behavioral data
    if (leadData.behavioral.sessionCount === 0) {
      issues.push('No session data available');
    }

    // Check timing data validity
    if (leadData.timing.dayOfWeek < 0 || leadData.timing.dayOfWeek > 6) {
      issues.push('Invalid day of week');
    }

    if (leadData.timing.hourOfDay < 0 || leadData.timing.hourOfDay > 23) {
      issues.push('Invalid hour of day');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
