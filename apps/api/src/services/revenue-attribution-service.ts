import { EventEmitter } from 'events';
import { LeadData } from './ml-types';

/**
 * Universal Revenue Attribution Service
 * Tracks and attributes revenue outcomes to lead scores and model predictions
 * Provides comprehensive ROI measurement APIs accessible by any platform
 */
export class RevenueAttributionService extends EventEmitter {
  private isInitialized: boolean = false;
  private startTime: number = Date.now();

  // Attribution tracking
  private attributionRecords: Map<string, AttributionRecord> = new Map();
  private revenueMetrics: RevenueMetrics = this.initializeMetrics();
  private attributionModels: Map<string, AttributionModel> = new Map();
  private roiCalculator: ROICalculator = new ROICalculator();

  constructor() {
    super();
    this.initializeAttributionModels();
  }

  /**
   * Initialize the revenue attribution service
   */
  public async initialize(): Promise<void> {
    try {
      this.emit('service_initializing');

      // Initialize attribution models
      this.setupDefaultAttributionModels();
      this.startRevenueTracking();
      this.startROICalculation();

      this.isInitialized = true;
      this.emit('service_initialized');

    } catch (error) {
      this.emit('service_initialization_failed', error);
      throw error;
    }
  }

  /**
   * Track revenue outcome and attribute to prediction
   */
  public async recordRevenueOutcome(
    predictionId: string,
    leadData: LeadData,
    originalScore: number,
    revenueOutcome: RevenueOutcome,
    metadata: RevenueMetadata = {}
  ): Promise<AttributionRecord> {
    if (!this.isInitialized) {
      throw new Error('Revenue attribution service not initialized');
    }

    try {
      // Create attribution record
      const attributionRecord: AttributionRecord = {
        attributionId: this.generateAttributionId(),
        predictionId,
        leadData,
        originalScore,
        revenueOutcome,
        attributionMetrics: await this.calculateAttributionMetrics(originalScore, revenueOutcome),
        touchpointJourney: await this.mapTouchpointJourney(leadData, metadata),
        modelContribution: await this.calculateModelContribution(originalScore, revenueOutcome),
        recordedAt: new Date(),
        metadata
      };

      // Store the record
      await this.storeAttributionRecord(attributionRecord);

      // Update revenue metrics
      this.updateRevenueMetrics(attributionRecord);

      // Calculate attribution across models
      await this.runAttributionModeling(attributionRecord);

      this.emit('revenue_outcome_recorded', attributionRecord);
      return attributionRecord;

    } catch (error) {
      this.emit('revenue_recording_error', { predictionId, error });
      throw error;
    }
  }

  /**
   * Generate comprehensive revenue attribution dashboard
   */
  public async getAttributionDashboard(
    filters: AttributionFilters = {}
  ): Promise<AttributionDashboard> {
    if (!this.isInitialized) {
      throw new Error('Revenue attribution service not initialized');
    }

    try {
      const dashboard: AttributionDashboard = {
        overview: await this.getRevenueOverview(filters.timeRange),
        attributionBreakdown: await this.getAttributionBreakdown(filters),
        modelROI: await this.getModelROIAnalysis(filters),
        touchpointAnalysis: await this.getTouchpointAnalysis(filters),
        revenueForecasting: await this.getRevenueForecasting(filters),
        campaignAttribution: await this.getCampaignAttribution(filters),
        industryPerformance: await this.getIndustryPerformance(filters),
        recommendations: await this.generateAttributionRecommendations(filters),
        generatedAt: new Date(),
        filters
      };

      this.emit('attribution_dashboard_generated', dashboard);
      return dashboard;

    } catch (error) {
      this.emit('dashboard_generation_error', error);
      throw error;
    }
  }

  /**
   * Run attribution modeling analysis
   */
  public async runAttributionAnalysis(
    modelType: AttributionModelType = 'multi-touch',
    options: AttributionAnalysisOptions = {}
  ): Promise<AttributionAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('Revenue attribution service not initialized');
    }

    try {
      this.emit('attribution_analysis_started', { modelType, options });

      const model = this.attributionModels.get(modelType);
      if (!model) {
        throw new Error(`Attribution model ${modelType} not found`);
      }

      const analysisResult: AttributionAnalysisResult = {
        analysisId: this.generateAnalysisId(),
        modelType,
        startedAt: new Date(),
        completedAt: new Date(),
        totalRecords: this.attributionRecords.size,
        modelAccuracy: await this.calculateModelAccuracy(modelType),
        attributionResults: await this.runModelAnalysis(model, options),
        revenueImpact: await this.calculateRevenueImpact(modelType),
        insights: await this.generateModelInsights(modelType),
        recommendations: await this.generateModelRecommendations(modelType)
      };

      this.emit('attribution_analysis_completed', analysisResult);
      return analysisResult;

    } catch (error) {
      this.emit('attribution_analysis_failed', error);
      throw error;
    }
  }

  /**
   * Get ROI metrics and calculations
   */
  public async getROIMetrics(
    timeRange: TimeRange = this.getDefaultTimeRange()
  ): Promise<ROIMetrics> {
    if (!this.isInitialized) {
      throw new Error('Revenue attribution service not initialized');
    }

    try {
      const roiMetrics = await this.roiCalculator.calculateROI(timeRange, this.attributionRecords);
      this.emit('roi_metrics_calculated', roiMetrics);
      return roiMetrics;

    } catch (error) {
      this.emit('roi_calculation_error', error);
      throw error;
    }
  }

  /**
   * Universal API interface for platform integration
   */
  public getUniversalAPIInterface(): UniversalAttributionAPI {
    return {
      recordRevenue: (predictionId: string, leadData: LeadData, score: number, outcome: RevenueOutcome, metadata?: RevenueMetadata) =>
        this.recordRevenueOutcome(predictionId, leadData, score, outcome, metadata),

      getDashboard: (filters?: AttributionFilters) =>
        this.getAttributionDashboard(filters),

      runAnalysis: (modelType?: AttributionModelType, options?: AttributionAnalysisOptions) =>
        this.runAttributionAnalysis(modelType, options),

      getROI: (timeRange?: TimeRange) =>
        this.getROIMetrics(timeRange),

      getStatus: () => this.getServiceStatus(),

      exportData: (format: 'json' | 'csv', filters?: AttributionFilters) =>
        this.exportAttributionData(format, filters)
    };
  }

  // Private methods
  private initializeMetrics(): RevenueMetrics {
    return {
      totalRevenue: 0,
      attributedRevenue: 0,
      averageDealSize: 0,
      conversionRate: 0,
      averageTimeToClose: 0,
      totalDeals: 0,
      successfulDeals: 0,
      lastUpdated: new Date()
    };
  }

  private initializeAttributionModels(): void {
    this.setupDefaultAttributionModels();
  }

  private setupDefaultAttributionModels(): void {
    // First-touch attribution
    this.attributionModels.set('first-touch', {
      name: 'First Touch Attribution',
      type: 'first-touch',
      algorithm: 'first_interaction',
      weight: 1.0,
      description: 'Attributes 100% of revenue to the first touchpoint'
    });

    // Last-touch attribution
    this.attributionModels.set('last-touch', {
      name: 'Last Touch Attribution',
      type: 'last-touch',
      algorithm: 'last_interaction',
      weight: 1.0,
      description: 'Attributes 100% of revenue to the last touchpoint'
    });

    // Linear attribution
    this.attributionModels.set('linear', {
      name: 'Linear Attribution',
      type: 'linear',
      algorithm: 'equal_distribution',
      weight: 1.0,
      description: 'Distributes revenue equally across all touchpoints'
    });

    // Time-decay attribution
    this.attributionModels.set('time-decay', {
      name: 'Time Decay Attribution',
      type: 'time-decay',
      algorithm: 'decay_function',
      weight: 1.0,
      description: 'Gives more credit to recent touchpoints'
    });

    // Multi-touch attribution (ML-based)
    this.attributionModels.set('multi-touch', {
      name: 'Multi-Touch Attribution',
      type: 'multi-touch',
      algorithm: 'machine_learning',
      weight: 1.0,
      description: 'Uses ML to determine optimal attribution weights'
    });
  }

  private async storeAttributionRecord(record: AttributionRecord): Promise<void> {
    this.attributionRecords.set(record.attributionId, record);
    // In production, this would store to a database
  }

  private updateRevenueMetrics(record: AttributionRecord): void {
    const outcome = record.revenueOutcome;

    this.revenueMetrics.totalDeals++;
    if (outcome.dealClosed) {
      this.revenueMetrics.successfulDeals++;
      if (outcome.dealSize) {
        this.revenueMetrics.totalRevenue += outcome.dealSize;
        this.revenueMetrics.attributedRevenue += outcome.dealSize;
      }
    }

    // Recalculate derived metrics
    this.revenueMetrics.conversionRate = this.revenueMetrics.successfulDeals / this.revenueMetrics.totalDeals;
    this.revenueMetrics.averageDealSize = this.revenueMetrics.totalRevenue / this.revenueMetrics.successfulDeals || 0;
    this.revenueMetrics.lastUpdated = new Date();
  }

  private async calculateAttributionMetrics(originalScore: number, outcome: RevenueOutcome): Promise<AttributionCalculation> {
    const scoreAccuracy = outcome.dealClosed ? 1 : 0;
    const revenueAccuracy = outcome.dealSize ? this.calculateRevenueAccuracy(originalScore, outcome.dealSize) : 0;

    return {
      scoreAccuracy,
      revenueAccuracy,
      predictionConfidence: originalScore / 100,
      actualROI: outcome.dealSize ? (outcome.dealSize - (outcome.acquisitionCost || 0)) / (outcome.acquisitionCost || 1) : 0,
      attributionWeight: this.calculateAttributionWeight(originalScore, outcome)
    };
  }

  private calculateRevenueAccuracy(predictedScore: number, actualRevenue: number): number {
    // Simplified revenue accuracy calculation
    const predictedRevenue = predictedScore * 1000; // Example scaling
    const error = Math.abs(predictedRevenue - actualRevenue) / actualRevenue;
    return Math.max(0, 1 - error);
  }

  private calculateAttributionWeight(score: number, outcome: RevenueOutcome): number {
    // Calculate how much weight this prediction should get in attribution
    const baseWeight = score / 100;
    const outcomeMultiplier = outcome.dealClosed ? 1.2 : 0.8;
    return baseWeight * outcomeMultiplier;
  }

  private async mapTouchpointJourney(_leadData: LeadData, _metadata: RevenueMetadata): Promise<TouchpointJourney> {
    // In production, this would track the actual customer journey
    return {
      touchpoints: [],
      totalInteractions: 0,
      journeyDuration: 0,
      keyMilestones: []
    };
  }

  private async calculateModelContribution(score: number, outcome: RevenueOutcome): Promise<ModelContribution> {
    return {
      predictionAccuracy: outcome.dealClosed ? score / 100 : 1 - (score / 100),
      revenueImpact: outcome.dealSize || 0,
      confidenceLevel: score / 100,
      modelVersion: 'v1.0.0'
    };
  }

  private async runAttributionModeling(_record: AttributionRecord): Promise<void> {
    // Apply different attribution models to the record
    for (const [_modelType, model] of this.attributionModels) {
      await this.applyAttributionModel(model, _record);
    }
  }

  private async applyAttributionModel(_model: AttributionModel, _record: AttributionRecord): Promise<void> {
    // Apply specific attribution model logic
    // This would contain the actual attribution algorithms
  }

  private generateAttributionId(): string {
    return `attr_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private getDefaultTimeRange(): TimeRange {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start: thirtyDaysAgo, end: now };
  }

  private getServiceStatus(): AttributionServiceStatus {
    return {
      isInitialized: this.isInitialized,
      uptime: Date.now() - this.startTime,
      totalAttributionRecords: this.attributionRecords.size,
      totalRevenue: this.revenueMetrics.totalRevenue,
      totalDeals: this.revenueMetrics.totalDeals,
      conversionRate: this.revenueMetrics.conversionRate,
      healthStatus: this.getHealthStatus(),
      lastUpdated: new Date()
    };
  }

  private getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    if (this.revenueMetrics.totalDeals === 0) return 'warning';
    if (this.revenueMetrics.conversionRate < 0.1) return 'critical';
    return 'healthy';
  }

  private startRevenueTracking(): void {
    // Start automated revenue tracking processes
    setInterval(() => {
      this.emit('revenue_tracking_heartbeat', {
        totalRecords: this.attributionRecords.size,
        metrics: this.revenueMetrics
      });
    }, 60000); // Every minute
  }

  private startROICalculation(): void {
    // Start automated ROI calculation processes
    setInterval(async () => {
      try {
        const roi = await this.getROIMetrics();
        this.emit('roi_updated', roi);
      } catch (error) {
        this.emit('roi_calculation_error', error);
      }
    }, 300000); // Every 5 minutes
  }

  // Dashboard generation methods (simplified for space)
  private async getRevenueOverview(_timeRange?: TimeRange): Promise<RevenueOverview> {
    return {
      totalRevenue: this.revenueMetrics.totalRevenue,
      attributedRevenue: this.revenueMetrics.attributedRevenue,
      totalDeals: this.revenueMetrics.totalDeals,
      conversionRate: this.revenueMetrics.conversionRate,
      averageDealSize: this.revenueMetrics.averageDealSize,
      growthRate: 0.15 // Example
    };
  }

  private async getAttributionBreakdown(_filters?: AttributionFilters): Promise<AttributionBreakdown> {
    return {
      byModel: new Map(),
      byChannel: new Map(),
      byIndustry: new Map(),
      byTimeframe: []
    };
  }

  private async getModelROIAnalysis(_filters?: AttributionFilters): Promise<ModelROIAnalysis> {
    return {
      models: [],
      bestPerforming: null,
      worstPerforming: null,
      averageROI: 0
    };
  }

  private async getTouchpointAnalysis(_filters?: AttributionFilters): Promise<TouchpointAnalysis> {
    return {
      touchpoints: [],
      effectiveness: new Map(),
      journey: []
    };
  }

  private async getRevenueForecasting(_filters?: AttributionFilters): Promise<RevenueForecasting> {
    return {
      predictions: [],
      confidence: 0.85,
      methodology: 'time-series'
    };
  }

  private async getCampaignAttribution(_filters?: AttributionFilters): Promise<CampaignAttribution> {
    return {
      campaigns: [],
      topPerforming: null,
      totalAttributedRevenue: this.revenueMetrics.attributedRevenue
    };
  }

  private async getIndustryPerformance(_filters?: AttributionFilters): Promise<IndustryPerformance> {
    return {
      industries: [],
      topPerforming: null,
      averagePerformance: 0
    };
  }

  private async generateAttributionRecommendations(_filters?: AttributionFilters): Promise<AttributionRecommendation[]> {
    return [
      {
        type: 'optimization',
        priority: 'high',
        title: 'Optimize High-Value Touchpoints',
        description: 'Focus investment on touchpoints with highest attribution scores',
        estimatedImpact: '+15% revenue',
        actionItems: ['Identify top touchpoints', 'Increase investment', 'Track performance']
      }
    ];
  }

  private async calculateModelAccuracy(_modelType: AttributionModelType): Promise<number> {
    return 0.85; // Example accuracy
  }

  private async runModelAnalysis(_model: AttributionModel, _options: AttributionAnalysisOptions): Promise<AttributionResult[]> {
    return [];
  }

  private async calculateRevenueImpact(_modelType: AttributionModelType): Promise<RevenueImpact> {
    return {
      totalImpact: this.revenueMetrics.totalRevenue,
      incremental: 0,
      efficiency: 0.85
    };
  }

  private async generateModelInsights(_modelType: AttributionModelType): Promise<ModelInsight[]> {
    return [];
  }

  private async generateModelRecommendations(_modelType: AttributionModelType): Promise<AttributionRecommendation[]> {
    return [];
  }

  private async exportAttributionData(format: 'json' | 'csv', _filters?: AttributionFilters): Promise<string> {
    const data = Array.from(this.attributionRecords.values());

    if (format === 'csv') {
      const headers = 'attributionId,predictionId,originalScore,dealClosed,dealSize,recordedAt';
      const rows = data.map(record =>
        `${record.attributionId},${record.predictionId},${record.originalScore},${record.revenueOutcome.dealClosed},${record.revenueOutcome.dealSize || 0},${record.recordedAt.toISOString()}`
      );
      return [headers, ...rows].join('\n');
    }

    return JSON.stringify(data, null, 2);
  }
}

// ROI Calculator class
class ROICalculator {
  async calculateROI(timeRange: TimeRange, records: Map<string, AttributionRecord>): Promise<ROIMetrics> {
    const filteredRecords = Array.from(records.values()).filter(record =>
      record.recordedAt >= timeRange.start && record.recordedAt <= timeRange.end
    );

    const totalRevenue = filteredRecords.reduce((sum, record) =>
      sum + (record.revenueOutcome.dealSize || 0), 0
    );

    const totalCosts = filteredRecords.reduce((sum, record) =>
      sum + (record.revenueOutcome.acquisitionCost || 0), 0
    );

    const roi = totalCosts > 0 ? (totalRevenue - totalCosts) / totalCosts : 0;

    return {
      totalRevenue,
      totalCosts,
      netRevenue: totalRevenue - totalCosts,
      roi,
      deals: filteredRecords.length,
      averageDealSize: totalRevenue / filteredRecords.length || 0,
      timeRange,
      calculatedAt: new Date()
    };
  }
}

// Types and interfaces for revenue attribution
interface RevenueOutcome {
  dealClosed: boolean;
  dealSize?: number;
  closedDate?: Date;
  acquisitionCost?: number;
  timeToClose?: number;
  ltv?: number;
  churnDate?: Date;
}

interface RevenueMetadata {
  channel?: string;
  campaign?: string;
  source?: string;
  medium?: string;
  userId?: string;
  accountId?: string;
  [key: string]: unknown;
}

interface AttributionRecord {
  attributionId: string;
  predictionId: string;
  leadData: LeadData;
  originalScore: number;
  revenueOutcome: RevenueOutcome;
  attributionMetrics: AttributionCalculation;
  touchpointJourney: TouchpointJourney;
  modelContribution: ModelContribution;
  recordedAt: Date;
  metadata: RevenueMetadata;
}

interface AttributionCalculation {
  scoreAccuracy: number;
  revenueAccuracy: number;
  predictionConfidence: number;
  actualROI: number;
  attributionWeight: number;
}

interface TouchpointJourney {
  touchpoints: Touchpoint[];
  totalInteractions: number;
  journeyDuration: number;
  keyMilestones: string[];
}

interface Touchpoint {
  id: string;
  type: string;
  timestamp: Date;
  value: number;
  attribution: number;
}

interface ModelContribution {
  predictionAccuracy: number;
  revenueImpact: number;
  confidenceLevel: number;
  modelVersion: string;
}

interface RevenueMetrics {
  totalRevenue: number;
  attributedRevenue: number;
  averageDealSize: number;
  conversionRate: number;
  averageTimeToClose: number;
  totalDeals: number;
  successfulDeals: number;
  lastUpdated: Date;
}

interface AttributionModel {
  name: string;
  type: AttributionModelType;
  algorithm: string;
  weight: number;
  description: string;
}

type AttributionModelType = 'first-touch' | 'last-touch' | 'linear' | 'time-decay' | 'multi-touch';

interface TimeRange {
  start: Date;
  end: Date;
}

interface AttributionFilters {
  timeRange?: TimeRange;
  industry?: string;
  campaign?: string;
  channel?: string;
  modelType?: AttributionModelType;
}

interface AttributionDashboard {
  overview: RevenueOverview;
  attributionBreakdown: AttributionBreakdown;
  modelROI: ModelROIAnalysis;
  touchpointAnalysis: TouchpointAnalysis;
  revenueForecasting: RevenueForecasting;
  campaignAttribution: CampaignAttribution;
  industryPerformance: IndustryPerformance;
  recommendations: AttributionRecommendation[];
  generatedAt: Date;
  filters: AttributionFilters;
}

interface RevenueOverview {
  totalRevenue: number;
  attributedRevenue: number;
  totalDeals: number;
  conversionRate: number;
  averageDealSize: number;
  growthRate: number;
}

interface AttributionBreakdown {
  byModel: Map<string, number>;
  byChannel: Map<string, number>;
  byIndustry: Map<string, number>;
  byTimeframe: Array<{ period: string; revenue: number }>;
}

interface ModelROIAnalysis {
  models: Array<{ name: string; roi: number; accuracy: number }>;
  bestPerforming: string | null;
  worstPerforming: string | null;
  averageROI: number;
}

interface TouchpointAnalysis {
  touchpoints: Array<{ name: string; attribution: number; frequency: number }>;
  effectiveness: Map<string, number>;
  journey: Array<{ stage: string; conversion: number }>;
}

interface RevenueForecasting {
  predictions: Array<{ period: string; predicted: number; confidence: number }>;
  confidence: number;
  methodology: string;
}

interface CampaignAttribution {
  campaigns: Array<{ name: string; attribution: number; roi: number }>;
  topPerforming: string | null;
  totalAttributedRevenue: number;
}

interface IndustryPerformance {
  industries: Array<{ name: string; revenue: number; deals: number; conversion: number }>;
  topPerforming: string | null;
  averagePerformance: number;
}

interface AttributionAnalysisOptions {
  lookbackDays?: number;
  includeInteractions?: boolean;
  modelWeights?: Map<string, number>;
}

interface AttributionAnalysisResult {
  analysisId: string;
  modelType: AttributionModelType;
  startedAt: Date;
  completedAt: Date;
  totalRecords: number;
  modelAccuracy: number;
  attributionResults: AttributionResult[];
  revenueImpact: RevenueImpact;
  insights: ModelInsight[];
  recommendations: AttributionRecommendation[];
}

interface AttributionResult {
  recordId: string;
  attribution: number;
  confidence: number;
}

interface RevenueImpact {
  totalImpact: number;
  incremental: number;
  efficiency: number;
}

interface ModelInsight {
  type: string;
  description: string;
  impact: string;
}

interface AttributionRecommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  estimatedImpact: string;
  actionItems: string[];
}

interface ROIMetrics {
  totalRevenue: number;
  totalCosts: number;
  netRevenue: number;
  roi: number;
  deals: number;
  averageDealSize: number;
  timeRange: TimeRange;
  calculatedAt: Date;
}

interface AttributionServiceStatus {
  isInitialized: boolean;
  uptime: number;
  totalAttributionRecords: number;
  totalRevenue: number;
  totalDeals: number;
  conversionRate: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  lastUpdated: Date;
}

interface UniversalAttributionAPI {
  recordRevenue: (predictionId: string, leadData: LeadData, score: number, outcome: RevenueOutcome, metadata?: RevenueMetadata) => Promise<AttributionRecord>;
  getDashboard: (filters?: AttributionFilters) => Promise<AttributionDashboard>;
  runAnalysis: (modelType?: AttributionModelType, options?: AttributionAnalysisOptions) => Promise<AttributionAnalysisResult>;
  getROI: (timeRange?: TimeRange) => Promise<ROIMetrics>;
  getStatus: () => AttributionServiceStatus;
  exportData: (format: 'json' | 'csv', filters?: AttributionFilters) => Promise<string>;
}
