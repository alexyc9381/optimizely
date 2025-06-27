/**
 * Core ML Types and Interfaces
 * Universal data structures for the AI Revenue Prediction Engine
 */

// Core data types for ML scoring
export interface LeadData {
  // Firmographic data (0-30 points)
  firmographic: {
    companySize: 'startup' | 'smb' | 'mid_market' | 'enterprise';
    industry: string;
    revenue: number | null;
    employees: number | null;
    techStack: string[];
    companyMaturity: 'seed' | 'growth' | 'mature';
    geolocation: {
      country: string;
      region: string;
      timezone: string;
    };
  };

  // Behavioral data (0-25 points)
  behavioral: {
    sessionCount: number;
    avgSessionDuration: number;
    pageViewsPerSession: number;
    contentEngagement: {
      documentsDownloaded: number;
      videosWatched: number;
      formsCompleted: number;
      pricingPageViews: number;
      featurePageViews: number;
    };
    technicalDepth: {
      integrationDocsViewed: boolean;
      apiDocsViewed: boolean;
      technicalResourcesAccessed: number;
    };
    timeOnSite: number;
    returnVisitorPattern: 'single' | 'occasional' | 'frequent' | 'power_user';
  };

  // Intent signals (0-25 points)
  intent: {
    searchKeywords: string[];
    competitorResearch: boolean;
    buyingStageSignals: {
      awareness: number;
      consideration: number;
      decision: number;
      purchase: number;
    };
    contentTopicsEngaged: string[];
    urgencyIndicators: {
      fastTrackRequests: boolean;
      demoRequests: number;
      contactFormSubmissions: number;
      salesInquiries: number;
    };
    socialProof: {
      testimonialViews: number;
      caseStudyDownloads: number;
      customerSuccessStories: number;
    };
  };

  // Timing factors (0-20 points)
  timing: {
    dayOfWeek: number; // 0-6 (Sunday = 0)
    hourOfDay: number; // 0-23
    monthOfYear: number; // 1-12
    quarterOfYear: number; // 1-4
    seasonality: 'high' | 'medium' | 'low';
    recentActivity: boolean;
    engagementVelocity: number; // Events per day
    lastVisitDays: number;
    accountAge: number; // Days since first visit
  };
}

export interface ScoringResult {
  totalScore: number; // 0-100
  confidence: number; // 0-1
  breakdown: {
    firmographic: number; // 0-30
    behavioral: number; // 0-25
    intent: number; // 0-25
    timing: number; // 0-20
  };
  predictions: {
    dealSize: {
      predicted: number;
      range: { min: number; max: number };
      confidence: number;
    };
    closeProb: {
      probability: number; // 0-1
      timeframe: string; // '30d', '60d', '90d', '180d'
      confidence: number;
    };
    timeToClose: {
      days: number;
      range: { min: number; max: number };
      confidence: number;
    };
  };
  buyerProfile: 'enterprise_decision_maker' | 'mid_market_evaluator' | 'smb_owner' | 'individual_user';
  industrySpecific: {
    modelUsed: string;
    industryScore: number;
    industryBenchmark: number;
  };
  metadata: {
    modelVersion: string;
    scoredAt: Date;
    dataQuality: number; // 0-1
    featureCount: number;
  };
}

export interface ModelConfig {
  gradientBoosting: {
    nEstimators: number;
    maxDepth: number;
    learningRate: number;
    subsample: number;
  };
  neuralNetwork: {
    hiddenLayers: number[];
    activation: 'relu' | 'tanh' | 'sigmoid';
    dropout: number;
    batchSize: number;
  };
  randomForest: {
    nEstimators: number;
    maxDepth: number;
    minSamplesSplit: number;
    minSamplesLeaf: number;
  };
  ensemble: {
    weights: {
      gradientBoosting: number;
      neuralNetwork: number;
      randomForest: number;
    };
    votingStrategy: 'soft' | 'hard' | 'weighted';
  };
}

export interface TrainingData {
  features: number[][];
  targets: number[];
}

export interface ModelInfo {
  isInitialized: boolean;
  modelVersion: string;
  currentConfig: ModelConfig | null;
  lastUpdated: Date | null;
}

export interface PredictionRequest {
  leadData: LeadData;
  includeBreakdown?: boolean;
  includePredictions?: boolean;
  industryOverride?: string;
}

export interface BatchPredictionRequest {
  leads: LeadData[];
  options?: {
    includeBreakdown?: boolean;
    includePredictions?: boolean;
    parallel?: boolean;
  };
}

export interface ModelPerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  lastEvaluated: Date;
  sampleSize: number;
}

export interface IndustryModel {
  name: string;
  version: string;
  industry: string;
  performance: ModelPerformanceMetrics;
  features: string[];
  lastTrained: Date;
}
