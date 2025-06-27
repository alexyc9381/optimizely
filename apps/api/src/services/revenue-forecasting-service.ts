import { EventEmitter } from 'events';
import { AnalyticsService } from './analytics-service';
import { PipelineVisualizationService } from './pipeline-visualization-service';
import { redisManager } from './redis-client';
import { ChartData, VisualizationService } from './visualization-service';

export interface ForecastModel {
  id: string;
  name: string;
  type: 'linear' | 'polynomial' | 'exponential' | 'seasonal' | 'ensemble';
  accuracy: number;
  confidence: number;
  lastTrained: Date;
  parameters: Record<string, any>;
}

export interface ForecastPrediction {
  date: string;
  predicted: number;
  lower_bound: number;
  upper_bound: number;
  confidence: number;
  contributing_factors: {
    factor: string;
    impact: number;
    weight: number;
  }[];
}

export interface HistoricalDataPoint {
  date: string;
  actual: number;
  predicted?: number;
  variance?: number;
  accuracy?: number;
}

export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  adjustments: {
    pipeline_velocity: number;
    conversion_rate: number;
    average_deal_size: number;
    market_growth: number;
    seasonal_factor: number;
    economic_factor: number;
  };
  probability: number;
  impact_timeline: string;
}

export interface ScenarioResult {
  scenario: ScenarioConfig;
  forecast: ForecastPrediction[];
  summary: {
    total_impact: number;
    peak_impact_date: string;
    roi_timeline: number;
    risk_assessment: 'low' | 'medium' | 'high';
  };
}

export interface ForecastMetrics {
  current_quarter: {
    target: number;
    predicted: number;
    achieved: number;
    confidence: number;
    days_remaining: number;
    required_daily_rate: number;
  };
  next_quarter: {
    target: number;
    predicted: number;
    confidence: number;
    growth_rate: number;
  };
  year_end: {
    target: number;
    predicted: number;
    confidence: number;
    growth_rate: number;
  };
  accuracy_metrics: {
    last_30_days: number;
    last_90_days: number;
    last_year: number;
    improving_trend: boolean;
  };
}

export interface ForecastingData {
  overview: ForecastMetrics;
  predictions: ForecastPrediction[];
  historical: HistoricalDataPoint[];
  models: ForecastModel[];
  scenarios: ScenarioResult[];
  charts: {
    primary_forecast: ChartData;
    confidence_bands: ChartData;
    historical_accuracy: ChartData;
    scenario_comparison: ChartData;
    contributing_factors: ChartData;
  };
  realtime_updates: {
    last_updated: string;
    next_update: string;
    model_retraining: string;
    pipeline_changes: number;
    forecast_adjustments: number;
  };
}

export interface ForecastFilters {
  dateRange?: { start: Date; end: Date };
  models?: string[];
  scenarios?: string[];
  confidence_threshold?: number;
  time_horizon?: 'monthly' | 'quarterly' | 'yearly';
  granularity?: 'daily' | 'weekly' | 'monthly';
}

export class RevenueForecastingService extends EventEmitter {
  private analyticsService: AnalyticsService;
  private pipelineService: PipelineVisualizationService;
  private visualizationService: VisualizationService;
  private redisClient: any;
  private cachePrefix = 'forecast:';
  private cacheTTL = 300;

  private models: ForecastModel[] = [
    {
      id: 'linear_trend',
      name: 'Linear Trend',
      type: 'linear',
      accuracy: 0.82,
      confidence: 0.75,
      lastTrained: new Date(),
      parameters: { slope: 0, intercept: 0, trend_strength: 0 }
    },
    {
      id: 'seasonal_decomposition',
      name: 'Seasonal Analysis',
      type: 'seasonal',
      accuracy: 0.87,
      confidence: 0.80,
      lastTrained: new Date(),
      parameters: { seasonality: [], trend: [], residual: [] }
    },
    {
      id: 'ensemble_model',
      name: 'Ensemble Prediction',
      type: 'ensemble',
      accuracy: 0.91,
      confidence: 0.85,
      lastTrained: new Date(),
      parameters: { weights: {}, component_models: [] }
    }
  ];

  private predefinedScenarios: ScenarioConfig[] = [
    {
      id: 'optimistic',
      name: 'Best Case',
      description: 'Optimal market conditions with increased demand',
      adjustments: {
        pipeline_velocity: 1.3,
        conversion_rate: 1.2,
        average_deal_size: 1.15,
        market_growth: 1.25,
        seasonal_factor: 1.1,
        economic_factor: 1.05
      },
      probability: 0.2,
      impact_timeline: 'gradual'
    },
    {
      id: 'realistic',
      name: 'Most Likely',
      description: 'Current trends continue with normal variations',
      adjustments: {
        pipeline_velocity: 1.0,
        conversion_rate: 1.0,
        average_deal_size: 1.0,
        market_growth: 1.0,
        seasonal_factor: 1.0,
        economic_factor: 1.0
      },
      probability: 0.6,
      impact_timeline: 'immediate'
    },
    {
      id: 'conservative',
      name: 'Worst Case',
      description: 'Economic downturn or increased competition',
      adjustments: {
        pipeline_velocity: 0.8,
        conversion_rate: 0.85,
        average_deal_size: 0.9,
        market_growth: 0.7,
        seasonal_factor: 0.95,
        economic_factor: 0.8
      },
      probability: 0.2,
      impact_timeline: 'immediate'
    }
  ];

  constructor(
    analyticsService: AnalyticsService,
    pipelineService: PipelineVisualizationService,
    visualizationService: VisualizationService
  ) {
    super();
    this.analyticsService = analyticsService;
    this.pipelineService = pipelineService;
    this.visualizationService = visualizationService;
    this.redisClient = redisManager.getClient();
  }

  async getRevenueForecast(filters: ForecastFilters = {}): Promise<ForecastingData> {
    const cacheKey = this.generateCacheKey('complete', filters);

    try {
      const cached = await this.getCachedData(cacheKey);
      if (cached) return cached;

      const [overview, predictions, historical, scenarios, charts, realtime] = await Promise.all([
        this.getForecastMetrics(filters),
        this.generatePredictions(filters),
        this.getHistoricalData(filters),
        this.runScenarioAnalysis(filters),
        this.generateForecastCharts(filters),
        this.getRealTimeUpdates()
      ]);

      const result: ForecastingData = {
        overview,
        predictions,
        historical,
        models: this.models,
        scenarios,
        charts,
        realtime_updates: realtime
      };

      await this.cacheData(cacheKey, result);

      this.emit('forecastUpdated', {
        timestamp: new Date().toISOString(),
        metrics: overview,
        predictions: predictions.length,
        confidence: overview.current_quarter.confidence
      });

      return result;

    } catch (error) {
      console.error('Error generating revenue forecast:', error);
      throw new Error(`Failed to generate revenue forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getForecastMetrics(filters: ForecastFilters = {}): Promise<ForecastMetrics> {
    try {
      const dateRange = filters.dateRange || this.getDefaultDateRange();

      const query = {
        dateRange,
        metrics: ['revenue', 'deals_closed', 'conversion_rate'],
        dimensions: ['date', 'quarter'],
        filters: {}
      };

      const result = await this.analyticsService.query(query);
      const revenueData = result.data;

      const currentQuarter = this.getCurrentQuarter();
      const currentQuarterData = revenueData.filter(d => this.isInCurrentQuarter(d.date));
      const achieved = currentQuarterData.reduce((sum, d) => sum + (d.revenue || 0), 0);

      const daysRemaining = this.getDaysRemainingInQuarter();
      const dailyRate = achieved / (90 - daysRemaining);
      const predicted = achieved + (dailyRate * daysRemaining);

      const accuracy = await this.calculateHistoricalAccuracy();
      const confidence = Math.min(0.95, accuracy.last_90_days + 0.1);

      const nextQuarterPrediction = await this.predictNextQuarter(revenueData);
      const yearEndPrediction = await this.predictYearEnd(revenueData);

      return {
        current_quarter: {
          target: 1000000,
          predicted,
          achieved,
          confidence,
          days_remaining: daysRemaining,
          required_daily_rate: (1000000 - achieved) / Math.max(1, daysRemaining)
        },
        next_quarter: nextQuarterPrediction,
        year_end: yearEndPrediction,
        accuracy_metrics: accuracy
      };

    } catch (error) {
      console.error('Error calculating forecast metrics:', error);
      throw new Error('Failed to calculate forecast metrics');
    }
  }

  async generatePredictions(filters: ForecastFilters = {}): Promise<ForecastPrediction[]> {
    try {
      const timeHorizon = filters.time_horizon || 'quarterly';
      const predictionPeriod = this.getPredictionPeriod(timeHorizon);

      const historicalData = await this.getHistoricalRevenueData();

      const modelPredictions = await Promise.all(
        this.models.map(model => this.runModel(model, historicalData, predictionPeriod))
      );

      const ensemblePredictions = this.ensembleModels(modelPredictions, predictionPeriod);

      const predictionsWithFactors = await Promise.all(
        ensemblePredictions.map(async (pred) => ({
          ...pred,
          contributing_factors: await this.analyzeContributingFactors(pred.date)
        }))
      );

      return predictionsWithFactors;

    } catch (error) {
      console.error('Error generating predictions:', error);
      throw new Error('Failed to generate predictions');
    }
  }

  async runScenarioAnalysis(filters: ForecastFilters = {}): Promise<ScenarioResult[]> {
    try {
      const baselinePredictions = await this.generatePredictions(filters);

      const scenarioResults = await Promise.all(
        this.predefinedScenarios.map(async (scenario) => {
          const adjustedPredictions = this.applyScenarioAdjustments(baselinePredictions, scenario);
          const summary = this.calculateScenarioSummary(baselinePredictions, adjustedPredictions, scenario);

          return {
            scenario,
            forecast: adjustedPredictions,
            summary
          };
        })
      );

      return scenarioResults;

    } catch (error) {
      console.error('Error running scenario analysis:', error);
      throw new Error('Failed to run scenario analysis');
    }
  }

  async generateForecastCharts(filters: ForecastFilters = {}): Promise<ForecastingData['charts']> {
    try {
      const [predictions, historical, scenarios] = await Promise.all([
        this.generatePredictions(filters),
        this.getHistoricalData(filters),
        this.runScenarioAnalysis(filters)
      ]);

      const primaryForecast: ChartData = {
        config: {
          type: 'line',
          title: 'Revenue Forecast',
          xAxis: { title: 'Date', format: 'datetime' },
          yAxis: { title: 'Revenue ($)' },
          responsive: true,
          animation: true
        },
        series: [
          {
            name: 'Historical',
            data: historical.map(h => ({ label: h.date, value: h.actual })),
            color: '#6B7280',
            type: 'line'
          },
          {
            name: 'Predicted',
            data: predictions.map(p => ({ label: p.date, value: p.predicted })),
            color: '#3B82F6',
            type: 'line'
          }
        ],
        metadata: {
          totalDataPoints: historical.length + predictions.length,
          dateRange: {
            start: new Date().toISOString(),
            end: new Date().toISOString()
          },
          queryTime: 0
        }
      };

      const confidenceBands: ChartData = {
        config: {
          type: 'area',
          title: 'Confidence Intervals',
          xAxis: { title: 'Date', format: 'datetime' },
          yAxis: { title: 'Revenue ($)' },
          responsive: true,
          animation: true
        },
        series: [
          {
            name: 'Upper Bound',
            data: predictions.map(p => ({ label: p.date, value: p.upper_bound })),
            color: '#3B82F6',
            type: 'area'
          },
          {
            name: 'Lower Bound',
            data: predictions.map(p => ({ label: p.date, value: p.lower_bound })),
            color: '#3B82F6',
            type: 'area'
          }
        ],
        metadata: {
          totalDataPoints: predictions.length * 2,
          dateRange: {
            start: new Date().toISOString(),
            end: new Date().toISOString()
          },
          queryTime: 0
        }
      };

      const historicalAccuracy: ChartData = {
        config: {
          type: 'line',
          title: 'Forecast Accuracy Over Time',
          xAxis: { title: 'Date', format: 'datetime' },
          yAxis: { title: 'Accuracy (%)' },
          responsive: true,
          animation: true
        },
        series: [
          {
            name: 'Accuracy',
            data: historical
              .filter(h => h.accuracy !== undefined)
              .map(h => ({ label: h.date, value: h.accuracy! * 100 })),
            color: '#10B981',
            type: 'line'
          }
        ],
        metadata: {
          totalDataPoints: historical.filter(h => h.accuracy !== undefined).length,
          dateRange: {
            start: new Date().toISOString(),
            end: new Date().toISOString()
          },
          queryTime: 0
        }
      };

      const scenarioComparison: ChartData = {
        config: {
          type: 'line',
          title: 'Scenario Analysis',
          xAxis: { title: 'Date', format: 'datetime' },
          yAxis: { title: 'Revenue ($)' },
          responsive: true,
          animation: true
        },
        series: scenarios.map(s => ({
          name: s.scenario.name,
          data: s.forecast.map(f => ({ label: f.date, value: f.predicted })),
          color: this.getScenarioColor(s.scenario.id),
          type: 'line' as const
        })),
        metadata: {
          totalDataPoints: scenarios.reduce((sum, s) => sum + s.forecast.length, 0),
          dateRange: {
            start: new Date().toISOString(),
            end: new Date().toISOString()
          },
          queryTime: 0
        }
      };

      const latestFactors = predictions[0]?.contributing_factors || [];
      const contributingFactors: ChartData = {
        config: {
          type: 'bar',
          title: 'Contributing Factors',
          xAxis: { title: 'Factors' },
          yAxis: { title: 'Impact (%)' },
          responsive: true,
          animation: true
        },
        series: [
          {
            name: 'Impact',
            data: latestFactors.map(f => ({ label: f.factor, value: f.impact })),
            color: '#8B5CF6',
            type: 'bar'
          }
        ],
        metadata: {
          totalDataPoints: latestFactors.length,
          dateRange: {
            start: new Date().toISOString(),
            end: new Date().toISOString()
          },
          queryTime: 0
        }
      };

      return {
        primary_forecast: primaryForecast,
        confidence_bands: confidenceBands,
        historical_accuracy: historicalAccuracy,
        scenario_comparison: scenarioComparison,
        contributing_factors: contributingFactors
      };

    } catch (error) {
      console.error('Error generating forecast charts:', error);
      throw new Error('Failed to generate forecast charts');
    }
  }

  private async getHistoricalData(filters: ForecastFilters = {}): Promise<HistoricalDataPoint[]> {
    const dateRange = filters.dateRange || this.getDefaultDateRange();

    const query = {
      dateRange,
      metrics: ['revenue'],
      dimensions: ['date'],
      filters: {}
    };

    const result = await this.analyticsService.query(query);

    return result.data.map(d => ({
      date: d.date,
      actual: d.revenue || 0,
      predicted: undefined,
      variance: undefined,
      accuracy: undefined
    }));
  }

  private async getHistoricalRevenueData(): Promise<any[]> {
    const dateRange = {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      end: new Date()
    };

    const query = {
      dateRange,
      metrics: ['revenue', 'deals_closed', 'pipeline_value'],
      dimensions: ['date'],
      filters: {}
    };

    const result = await this.analyticsService.query(query);
    return result.data;
  }

  private runModel(model: ForecastModel, data: any[], period: number): Promise<ForecastPrediction[]> {
    switch (model.type) {
      case 'linear':
        return this.runLinearModel(data, period, model);
      case 'seasonal':
        return this.runSeasonalModel(data, period, model);
      case 'ensemble':
        return this.runEnsembleModel(data, period, model);
      default:
        return this.runLinearModel(data, period, model);
    }
  }

  private async runLinearModel(data: any[], period: number, model: ForecastModel): Promise<ForecastPrediction[]> {
    const predictions: ForecastPrediction[] = [];
    const values = data.map(d => d.revenue || 0);

    const n = values.length;
    const sumX = n * (n - 1) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumXX = n * (n - 1) * (2 * n - 1) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    for (let i = 0; i < period; i++) {
      const futureIndex = n + i;
      const predicted = slope * futureIndex + intercept;
      const variance = Math.abs(predicted * 0.15);

      predictions.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predicted: Math.max(0, predicted),
        lower_bound: Math.max(0, predicted - variance),
        upper_bound: predicted + variance,
        confidence: model.confidence,
        contributing_factors: []
      });
    }

    return predictions;
  }

  private async runSeasonalModel(data: any[], period: number, model: ForecastModel): Promise<ForecastPrediction[]> {
    const predictions: ForecastPrediction[] = [];
    const values = data.map(d => d.revenue || 0);

    const seasonalLength = Math.min(12, Math.floor(values.length / 4));
    const seasonal = this.calculateSeasonalPattern(values, seasonalLength);
    const trend = this.calculateTrend(values);

    for (let i = 0; i < period; i++) {
      const seasonalIndex = i % seasonalLength;
      const trendValue = trend + (i * trend * 0.01);
      const seasonalFactor = seasonal[seasonalIndex] || 1.0;
      const predicted = trendValue * seasonalFactor;
      const variance = Math.abs(predicted * 0.12);

      predictions.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predicted: Math.max(0, predicted),
        lower_bound: Math.max(0, predicted - variance),
        upper_bound: predicted + variance,
        confidence: model.confidence,
        contributing_factors: []
      });
    }

    return predictions;
  }

  private async runEnsembleModel(data: any[], period: number, model: ForecastModel): Promise<ForecastPrediction[]> {
    const [linearPreds, seasonalPreds] = await Promise.all([
      this.runLinearModel(data, period, { ...model, type: 'linear', confidence: 0.7 }),
      this.runSeasonalModel(data, period, { ...model, type: 'seasonal', confidence: 0.8 })
    ]);

    const predictions: ForecastPrediction[] = [];

    for (let i = 0; i < period; i++) {
      const linear = linearPreds[i];
      const seasonal = seasonalPreds[i];

      const predicted = seasonal.predicted * 0.7 + linear.predicted * 0.3;
      const lower_bound = seasonal.lower_bound * 0.7 + linear.lower_bound * 0.3;
      const upper_bound = seasonal.upper_bound * 0.7 + linear.upper_bound * 0.3;

      predictions.push({
        date: linear.date,
        predicted: Math.max(0, predicted),
        lower_bound: Math.max(0, lower_bound),
        upper_bound,
        confidence: model.confidence,
        contributing_factors: []
      });
    }

    return predictions;
  }

  private ensembleModels(modelPredictions: ForecastPrediction[][], period: number): ForecastPrediction[] {
    const ensembled: ForecastPrediction[] = [];

    for (let i = 0; i < period; i++) {
      const predictions = modelPredictions.map(mp => mp[i]).filter(Boolean);

      if (predictions.length === 0) continue;

      const totalWeight = this.models.reduce((sum, m) => sum + m.accuracy, 0);

      const predicted = predictions.reduce((sum, pred, idx) => {
        const weight = this.models[idx].accuracy / totalWeight;
        return sum + pred.predicted * weight;
      }, 0);

      const lower_bound = predictions.reduce((sum, pred, idx) => {
        const weight = this.models[idx].accuracy / totalWeight;
        return sum + pred.lower_bound * weight;
      }, 0);

      const upper_bound = predictions.reduce((sum, pred, idx) => {
        const weight = this.models[idx].accuracy / totalWeight;
        return sum + pred.upper_bound * weight;
      }, 0);

      const confidence = predictions.reduce((sum, pred, idx) => {
        const weight = this.models[idx].accuracy / totalWeight;
        return sum + pred.confidence * weight;
      }, 0);

      ensembled.push({
        date: predictions[0].date,
        predicted: Math.max(0, predicted),
        lower_bound: Math.max(0, lower_bound),
        upper_bound,
        confidence,
        contributing_factors: []
      });
    }

    return ensembled;
  }

  private applyScenarioAdjustments(predictions: ForecastPrediction[], scenario: ScenarioConfig): ForecastPrediction[] {
    return predictions.map((pred, index) => {
      const timeProgress = index / predictions.length;
      let adjustmentFactor = 1.0;

      Object.entries(scenario.adjustments).forEach(([factor, multiplier]) => {
        const weight = this.getFactorWeight(factor);
        const timeAdjustedMultiplier = this.applyTimelineAdjustment(
          multiplier,
          scenario.impact_timeline,
          timeProgress
        );
        adjustmentFactor *= Math.pow(timeAdjustedMultiplier, weight);
      });

      return {
        ...pred,
        predicted: pred.predicted * adjustmentFactor,
        lower_bound: pred.lower_bound * adjustmentFactor * 0.9,
        upper_bound: pred.upper_bound * adjustmentFactor * 1.1,
        confidence: pred.confidence * scenario.probability
      };
    });
  }

  private calculateScenarioSummary(baseline: ForecastPrediction[], adjusted: ForecastPrediction[], scenario: ScenarioConfig) {
    const baselineTotal = baseline.reduce((sum, p) => sum + p.predicted, 0);
    const adjustedTotal = adjusted.reduce((sum, p) => sum + p.predicted, 0);
    const totalImpact = adjustedTotal - baselineTotal;

    const impacts = adjusted.map((adj, i) => adj.predicted - baseline[i].predicted);
    const maxImpactIndex = impacts.indexOf(Math.max(...impacts.map(Math.abs)));
    const peakImpactDate = adjusted[maxImpactIndex]?.date || '';

    const roiTimeline = Math.abs(totalImpact) > 10000 ?
      Math.ceil(Math.abs(totalImpact) / 50000) : 12;

    const volatility = this.calculateVolatility(adjusted);
    const riskAssessment = volatility > 0.3 ? 'high' : volatility > 0.15 ? 'medium' : 'low';

    return {
      total_impact: totalImpact,
      peak_impact_date: peakImpactDate,
      roi_timeline: roiTimeline,
      risk_assessment: riskAssessment as 'low' | 'medium' | 'high'
    };
  }

  private async analyzeContributingFactors(date: string): Promise<{ factor: string; impact: number; weight: number; }[]> {
    return [
      { factor: 'Pipeline Velocity', impact: 25, weight: 0.3 },
      { factor: 'Conversion Rate', impact: 20, weight: 0.25 },
      { factor: 'Average Deal Size', impact: 18, weight: 0.2 },
      { factor: 'Market Conditions', impact: 15, weight: 0.15 },
      { factor: 'Seasonal Trends', impact: 12, weight: 0.1 }
    ];
  }

  private async getRealTimeUpdates(): Promise<ForecastingData['realtime_updates']> {
    try {
      return {
        last_updated: new Date().toISOString(),
        next_update: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        model_retraining: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        pipeline_changes: 3,
        forecast_adjustments: 1
      };
    } catch (error) {
      console.error('Error getting real-time updates:', error);
      return {
        last_updated: new Date().toISOString(),
        next_update: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        model_retraining: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        pipeline_changes: 0,
        forecast_adjustments: 0
      };
    }
  }

  private getCurrentQuarter(): { start: Date; end: Date; number: number } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const quarter = Math.floor(month / 3) + 1;

    const startMonth = (quarter - 1) * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0);

    return { start, end, number: quarter };
  }

  private isInCurrentQuarter(dateString: string): boolean {
    const date = new Date(dateString);
    const quarter = this.getCurrentQuarter();
    return date >= quarter.start && date <= quarter.end;
  }

  private getDaysRemainingInQuarter(): number {
    const quarter = this.getCurrentQuarter();
    const now = new Date();
    const remaining = Math.ceil((quarter.end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, remaining);
  }

  private async calculateHistoricalAccuracy(): Promise<ForecastMetrics['accuracy_metrics']> {
    return {
      last_30_days: 0.85,
      last_90_days: 0.82,
      last_year: 0.78,
      improving_trend: true
    };
  }

  private async predictNextQuarter(data: any[]): Promise<ForecastMetrics['next_quarter']> {
    const currentQuarterRevenue = data
      .filter(d => this.isInCurrentQuarter(d.date))
      .reduce((sum, d) => sum + (d.revenue || 0), 0);

    const predicted = currentQuarterRevenue * 1.15;

    return {
      target: 1200000,
      predicted,
      confidence: 0.78,
      growth_rate: 0.15
    };
  }

  private async predictYearEnd(data: any[]): Promise<ForecastMetrics['year_end']> {
    const yearToDateRevenue = data
      .filter(d => new Date(d.date).getFullYear() === new Date().getFullYear())
      .reduce((sum, d) => sum + (d.revenue || 0), 0);

    const predicted = yearToDateRevenue * 1.45;

    return {
      target: 4800000,
      predicted,
      confidence: 0.72,
      growth_rate: 0.18
    };
  }

  private getPredictionPeriod(timeHorizon: string): number {
    switch (timeHorizon) {
      case 'monthly': return 30;
      case 'quarterly': return 90;
      case 'yearly': return 365;
      default: return 90;
    }
  }

  private calculateSeasonalPattern(values: number[], length: number): number[] {
    const seasonal: number[] = [];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    for (let i = 0; i < length; i++) {
      const seasonalValues = values.filter((_, idx) => idx % length === i);
      const seasonalAvg = seasonalValues.reduce((a, b) => a + b, 0) / seasonalValues.length;
      seasonal.push(seasonalAvg / avg);
    }

    return seasonal;
  }

  private calculateTrend(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private getFactorWeight(factor: string): number {
    const weights: Record<string, number> = {
      pipeline_velocity: 0.3,
      conversion_rate: 0.25,
      average_deal_size: 0.2,
      market_growth: 0.15,
      seasonal_factor: 0.05,
      economic_factor: 0.05
    };
    return weights[factor] || 0.1;
  }

  private applyTimelineAdjustment(multiplier: number, timeline: string, progress: number): number {
    switch (timeline) {
      case 'immediate':
        return multiplier;
      case 'gradual':
        return 1 + (multiplier - 1) * progress;
      case 'delayed':
        return progress > 0.5 ? multiplier : 1;
      default:
        return multiplier;
    }
  }

  private calculateVolatility(predictions: ForecastPrediction[]): number {
    const values = predictions.map(p => p.predicted);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean;
  }

  private getScenarioColor(scenarioId: string): string {
    const colors: Record<string, string> = {
      optimistic: '#10B981',
      realistic: '#3B82F6',
      conservative: '#F59E0B'
    };
    return colors[scenarioId] || '#6B7280';
  }

  private getDefaultDateRange(): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  private generateCacheKey(type: string, filters: ForecastFilters): string {
    return `${this.cachePrefix}${type}:${JSON.stringify(filters)}`;
  }

  private async getCachedData(key: string): Promise<any | null> {
    try {
      const cached = await this.redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Cache retrieval error:', error);
      return null;
    }
  }

  private async cacheData(key: string, data: any): Promise<void> {
    try {
      await this.redisClient.setex(key, this.cacheTTL, JSON.stringify(data));
    } catch (error) {
      console.warn('Cache storage error:', error);
    }
  }
}

export const createRevenueForecastingService = (
  analyticsService: AnalyticsService,
  pipelineService: PipelineVisualizationService,
  visualizationService: VisualizationService
): RevenueForecastingService => {
  return new RevenueForecastingService(analyticsService, pipelineService, visualizationService);
};
