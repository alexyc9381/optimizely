import { EventEmitter } from 'events';
import {
    BoxPlotDataPoint,
    ChartConfig,
    ChartContext,
    ChartDataPoint,
    ChartEvents,
    ChartSeries,
    ChartState,
    ChartType,
    CohortDataPoint,
    FunnelDataPoint,
    HeatmapDataPoint,
    StatisticalAnalysis
} from './types';

export class StatisticalChartEngine extends EventEmitter {
  private static instance: StatisticalChartEngine;
  private charts: Map<string, ChartContext> = new Map();
  private renderQueue: Set<string> = new Set();
  private animationFrameId: number | null = null;
  private performanceMonitor: PerformanceObserver | null = null;
  private defaultColors: string[] = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
  ];

  private constructor() {
    super();
    this.initializePerformanceMonitoring();
    this.startRenderLoop();
  }

  public static getInstance(): StatisticalChartEngine {
    if (!StatisticalChartEngine.instance) {
      StatisticalChartEngine.instance = new StatisticalChartEngine();
    }
    return StatisticalChartEngine.instance;
  }

  // Main Chart Creation and Management

  public async createChart(
    id: string,
    data: ChartSeries[],
    config: ChartConfig,
    events?: ChartEvents
  ): Promise<ChartContext> {
    const startTime = performance.now();

    // Validate and process data
    const processedData = await this.preprocessData(data, config.type);

    // Create chart context
    const context: ChartContext = {
      id,
      data: processedData,
      config: this.mergeWithDefaults(config),
      events,
      state: this.getInitialState(),
      performance: {
        renderTime: 0,
        dataPoints: this.countDataPoints(processedData),
        memoryUsage: 0,
        isOptimized: processedData.length > 1000
      }
    };

    // Apply performance optimizations if needed
    if (context.performance.isOptimized) {
      context.data = await this.optimizeData(context.data, config.type);
    }

    // Store context
    this.charts.set(id, context);

    // Queue for rendering
    this.queueRender(id);

    const endTime = performance.now();
    context.performance.renderTime = endTime - startTime;

    this.emit('chart:created', context);
    return context;
  }

  public updateChart(id: string, data?: ChartSeries[], config?: Partial<ChartConfig>): boolean {
    const context = this.charts.get(id);
    if (!context) {
      return false;
    }

    const startTime = performance.now();

    if (data) {
      context.data = data;
      context.performance.dataPoints = this.countDataPoints(data);
    }

    if (config) {
      context.config = { ...context.config, ...config };
    }

    context.state.lastUpdated = new Date();
    this.queueRender(id);

    const endTime = performance.now();
    context.performance.renderTime = endTime - startTime;

    this.emit('chart:updated', context);
    return true;
  }

  public destroyChart(id: string): boolean {
    const context = this.charts.get(id);
    if (!context) {
      return false;
    }

    this.renderQueue.delete(id);
    this.charts.delete(id);

    this.emit('chart:destroyed', { id, context });
    return true;
  }

  public getChart(id: string): ChartContext | undefined {
    return this.charts.get(id);
  }

  public getAllCharts(): ChartContext[] {
    return Array.from(this.charts.values());
  }

  // Data Processing and Optimization

  private async preprocessData(data: ChartSeries[], chartType: ChartType): Promise<ChartSeries[]> {
    const processedData: ChartSeries[] = [];

    for (const series of data) {
      const processedSeries: ChartSeries = {
        ...series,
        data: await this.processDataPoints(series.data, chartType)
      };
      processedData.push(processedSeries);
    }

    return processedData;
  }

  private async processDataPoints(data: ChartDataPoint[], chartType: ChartType): Promise<ChartDataPoint[]> {
    switch (chartType) {
      case ChartType.LINE:
      case ChartType.AREA:
        return this.sortDataByX(data);

      case ChartType.BAR:
      case ChartType.COLUMN:
        return this.validateBarData(data);

      case ChartType.HISTOGRAM:
        return this.processHistogramData(data);

      case ChartType.BOX_PLOT:
        return this.processBoxPlotData(data);

      default:
        return data;
    }
  }

  private sortDataByX(data: ChartDataPoint[]): ChartDataPoint[] {
    return data.sort((a, b) => {
      if (typeof a.x === 'number' && typeof b.x === 'number') {
        return a.x - b.x;
      }
      if (a.x instanceof Date && b.x instanceof Date) {
        return a.x.getTime() - b.x.getTime();
      }
      return String(a.x).localeCompare(String(b.x));
    });
  }

  private validateBarData(data: ChartDataPoint[]): ChartDataPoint[] {
    return data.filter(point => typeof point.y === 'number' && !isNaN(point.y));
  }

  private processHistogramData(data: ChartDataPoint[]): ChartDataPoint[] {
    const values = data.map(d => d.y).sort((a, b) => a - b);
    const binCount = Math.ceil(Math.sqrt(values.length));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / binCount;

    const bins: ChartDataPoint[] = [];
    for (let i = 0; i < binCount; i++) {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = values.filter(v => v >= binStart && (i === binCount - 1 ? v <= binEnd : v < binEnd)).length;

      bins.push({
        x: binStart + binWidth / 2,
        y: count,
        label: `${binStart.toFixed(2)} - ${binEnd.toFixed(2)}`
      });
    }

    return bins;
  }

  private processBoxPlotData(data: ChartDataPoint[]): ChartDataPoint[] {
    // Group data by x value for box plot calculations
    const groups = new Map<string, number[]>();

    data.forEach(point => {
      const key = String(point.x);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(point.y);
    });

    const boxData: ChartDataPoint[] = [];
    groups.forEach((values, key) => {
      const stats = this.calculateBoxPlotStatistics(values);
      boxData.push({
        x: key,
        y: stats.median,
        metadata: {
          boxPlot: stats
        }
      });
    });

    return boxData;
  }

  private calculateBoxPlotStatistics(values: number[]): BoxPlotDataPoint {
    const sorted = values.sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const medianIndex = Math.floor(sorted.length * 0.5);

    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const median = sorted[medianIndex];
    const iqr = q3 - q1;

    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;

    const low = Math.max(sorted[0], lowerFence);
    const high = Math.min(sorted[sorted.length - 1], upperFence);

    const outliers = sorted.filter(v => v < lowerFence || v > upperFence);

    return {
      x: 0, // Will be set by caller
      low,
      q1,
      median,
      q3,
      high,
      outliers
    };
  }

  private async optimizeData(data: ChartSeries[], chartType: ChartType): Promise<ChartSeries[]> {
    const optimizedData: ChartSeries[] = [];

    for (const series of data) {
      if (series.data.length > 10000) {
        // Apply data sampling for large datasets
        const sampledData = await this.sampleData(series.data, 5000);
        optimizedData.push({
          ...series,
          data: sampledData
        });
      } else {
        optimizedData.push(series);
      }
    }

    return optimizedData;
  }

  private async sampleData(data: ChartDataPoint[], targetSize: number): Promise<ChartDataPoint[]> {
    if (data.length <= targetSize) {
      return data;
    }

    const step = Math.floor(data.length / targetSize);
    const sampled: ChartDataPoint[] = [];

    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i]);
    }

    return sampled;
  }

  // Statistical Analysis

  public calculateStatistics(data: number[]): StatisticalAnalysis {
    const sorted = data.sort((a, b) => a - b);
    const n = data.length;

    // Basic statistics
    const mean = data.reduce((sum, val) => sum + val, 0) / n;
    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

    // Mode calculation
    const frequency = new Map<number, number>();
    data.forEach(val => frequency.set(val, (frequency.get(val) || 0) + 1));
    const maxFreq = Math.max(...frequency.values());
    const mode = Array.from(frequency.entries())
      .filter(([_, freq]) => freq === maxFreq)
      .map(([val]) => val);

    // Variance and standard deviation
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const standardDeviation = Math.sqrt(variance);

    // Skewness and kurtosis
    const skewness = data.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 3), 0) / n;
    const kurtosis = data.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 4), 0) / n - 3;

    // Quartiles
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const quartiles = {
      q1: sorted[q1Index],
      q2: median,
      q3: sorted[q3Index]
    };

    // Percentiles
    const percentiles: Record<number, number> = {};
    [5, 10, 25, 50, 75, 90, 95].forEach(p => {
      const index = Math.floor(n * p / 100);
      percentiles[p] = sorted[Math.min(index, n - 1)];
    });

    // Outlier detection using IQR method
    const iqr = quartiles.q3 - quartiles.q1;
    const lowerFence = quartiles.q1 - 1.5 * iqr;
    const upperFence = quartiles.q3 + 1.5 * iqr;
    const outliers = data.filter(val => val < lowerFence || val > upperFence);

    return {
      mean,
      median,
      mode,
      standardDeviation,
      variance,
      skewness,
      kurtosis,
      min: Math.min(...data),
      max: Math.max(...data),
      range: Math.max(...data) - Math.min(...data),
      quartiles,
      percentiles,
      outliers
    };
  }

  public calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      return 0;
    }

    const n = x.length;
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;

    for (let i = 0; i < n; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = y[i] - meanY;
      numerator += deltaX * deltaY;
      sumXSquared += deltaX * deltaX;
      sumYSquared += deltaY * deltaY;
    }

    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  public calculateLinearRegression(x: number[], y: number[]): {
    slope: number;
    intercept: number;
    rSquared: number;
    equation: string;
  } {
    if (x.length !== y.length || x.length === 0) {
      return { slope: 0, intercept: 0, rSquared: 0, equation: 'y = 0' };
    }

    const n = x.length;
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (y[i] - meanY);
      denominator += (x[i] - meanX) * (x[i] - meanX);
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = meanY - slope * meanX;

    // Calculate R-squared
    let totalSumSquares = 0;
    let residualSumSquares = 0;

    for (let i = 0; i < n; i++) {
      const predicted = slope * x[i] + intercept;
      totalSumSquares += (y[i] - meanY) * (y[i] - meanY);
      residualSumSquares += (y[i] - predicted) * (y[i] - predicted);
    }

    const rSquared = totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);

    const equation = `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`;

    return { slope, intercept, rSquared, equation };
  }

  // Specialized Chart Data Processors

  public processHeatmapData(data: HeatmapDataPoint[]): HeatmapDataPoint[] {
    // Normalize values for better color mapping
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    return data.map(point => ({
      ...point,
      value: range === 0 ? 0.5 : (point.value - min) / range
    }));
  }

  public processFunnelData(data: FunnelDataPoint[]): FunnelDataPoint[] {
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return data.map((point, index) => {
      const percentage = (point.value / total) * 100;
      const dropoff = index > 0 ? data[index - 1].value - point.value : 0;

      return {
        ...point,
        percentage,
        dropoff
      };
    });
  }

  public processCohortData(data: CohortDataPoint[]): CohortDataPoint[] {
    // Group by cohort and calculate retention rates
    const cohorts = new Map<string, CohortDataPoint[]>();

    data.forEach(point => {
      if (!cohorts.has(point.cohort)) {
        cohorts.set(point.cohort, []);
      }
      cohorts.get(point.cohort)!.push(point);
    });

    const processedData: CohortDataPoint[] = [];

    cohorts.forEach((cohortData, cohortName) => {
      const sortedData = cohortData.sort((a, b) => a.period - b.period);
      const initialValue = sortedData[0]?.value || 0;

      sortedData.forEach(point => {
        const retention = initialValue === 0 ? 0 : (point.value / initialValue) * 100;
        processedData.push({
          ...point,
          retention
        });
      });
    });

    return processedData;
  }

  // Rendering and Performance

  private queueRender(chartId: string): void {
    this.renderQueue.add(chartId);

    if (!this.animationFrameId) {
      this.animationFrameId = requestAnimationFrame(() => {
        this.processRenderQueue();
        this.animationFrameId = null;
      });
    }
  }

  private processRenderQueue(): void {
    const chartsToRender = Array.from(this.renderQueue);
    this.renderQueue.clear();

    chartsToRender.forEach(chartId => {
      const context = this.charts.get(chartId);
      if (context) {
        this.renderChart(context);
      }
    });
  }

  private renderChart(context: ChartContext): void {
    const startTime = performance.now();

    try {
      context.state.isLoading = true;
      context.state.hasError = false;

      // Emit render event for external renderers
      this.emit('chart:render', context);

      context.state.isLoading = false;
      context.state.lastUpdated = new Date();

      const endTime = performance.now();
      context.performance.renderTime = endTime - startTime;

      this.emit('chart:rendered', context);
    } catch (error) {
      context.state.isLoading = false;
      context.state.hasError = true;
      context.state.errorMessage = error instanceof Error ? error.message : 'Unknown render error';

      this.emit('chart:error', { context, error });
    }
  }

  private startRenderLoop(): void {
    const loop = () => {
      this.updatePerformanceMetrics();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private updatePerformanceMetrics(): void {
    this.charts.forEach(context => {
      if (context.state.isLoading) {
        return;
      }

      // Update memory usage estimate
      const dataSize = JSON.stringify(context.data).length;
      context.performance.memoryUsage = dataSize;

      // Update optimization status
      context.performance.isOptimized = context.performance.dataPoints > 1000;
    });
  }

  private initializePerformanceMonitoring(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceMonitor = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name.startsWith('chart-render')) {
            this.emit('performance:measure', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        });
      });

      this.performanceMonitor.observe({ entryTypes: ['measure'] });
    }
  }

  // Utility Methods

  private mergeWithDefaults(config: ChartConfig): ChartConfig {
    return {
      type: config.type,
      title: config.title || { text: '' },
      legend: { enabled: true, position: 'bottom', ...config.legend },
      tooltip: { enabled: true, ...config.tooltip },
      colors: { palette: this.defaultColors, ...config.colors },
      responsive: { enabled: true, ...config.responsive },
      animations: { enabled: true, duration: 1000, ...config.animations },
      interactions: { enabled: true, ...config.interactions },
      performance: { lazy: false, ...config.performance },
      ...config
    };
  }

  private getInitialState(): ChartState {
    return {
      isLoading: false,
      hasError: false,
      selectedPoints: [],
      selectedSeries: [],
      zoomLevel: 1,
      panPosition: { x: 0, y: 0 },
      lastUpdated: new Date()
    };
  }

  private countDataPoints(data: ChartSeries[]): number {
    return data.reduce((total, series) => total + series.data.length, 0);
  }

  // Export and Utility

  public exportChart(id: string, format: 'svg' | 'png' | 'pdf' | 'json'): Promise<Blob | string> {
    return new Promise((resolve, reject) => {
      const context = this.charts.get(id);
      if (!context) {
        reject(new Error(`Chart with id ${id} not found`));
        return;
      }

      switch (format) {
        case 'json':
          resolve(JSON.stringify(context, null, 2));
          break;
        case 'svg':
        case 'png':
        case 'pdf':
          this.emit('chart:export', { context, format, resolve, reject });
          break;
        default:
          reject(new Error(`Unsupported export format: ${format}`));
      }
    });
  }

  public dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.performanceMonitor) {
      this.performanceMonitor.disconnect();
    }

    this.charts.clear();
    this.renderQueue.clear();
    this.removeAllListeners();
  }
}
