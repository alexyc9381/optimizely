import { EventEmitter } from 'events';
import { AnalyticsService } from './analytics-service';
import { redisManager } from './redis-client';

export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area' | 'scatter';
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter' | 'funnel' | 'heatmap';
  title: string;
  subtitle?: string;
  xAxis?: { title?: string; format?: string };
  yAxis?: { title?: string; format?: string };
  legend?: { position?: 'top' | 'bottom' | 'left' | 'right'; enabled?: boolean };
  colors?: string[];
  animation?: boolean;
  responsive?: boolean;
}

export interface ChartData {
  config: ChartConfig;
  series: ChartSeries[];
  metadata: {
    totalDataPoints: number;
    dateRange: { start: string; end: string };
    queryTime: number;
    cachedAt?: string;
  };
}

export interface WidgetData {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'progress' | 'gauge';
  title: string;
  data: any;
  config: Record<string, any>;
  lastUpdated: string;
  refreshInterval?: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  format: 'pdf' | 'html' | 'json';
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
}

export interface ReportSection {
  type: 'chart' | 'table' | 'text' | 'metrics' | 'image';
  title: string;
  config: Record<string, any>;
  query: Record<string, any>;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'excel' | 'pdf';
  includeMetadata: boolean;
  dateFormat?: string;
  locale?: string;
  template?: string;
}

export class VisualizationService extends EventEmitter {
  private analyticsService: AnalyticsService;
  private redisClient: any;
  private cachePrefix = 'viz:';
  private defaultCacheTTL = 300; // 5 minutes

  constructor(analyticsService: AnalyticsService) {
    super();
    this.analyticsService = analyticsService;
    this.redisClient = redisManager.getClient();
  }

  // ============================================================================
  // CHART DATA APIS
  // ============================================================================

  /**
   * Generate time series chart data
   */
  async getTimeSeriesData(
    metric: string,
    dateRange: { start: Date; end: Date },
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day',
    filters?: Record<string, any>
  ): Promise<ChartData> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey('timeseries', { metric, dateRange, granularity, filters });

    try {
      // Try cache first
      const cached = await this.getCachedData(cacheKey);
      if (cached) return cached;

      const query = {
        dateRange,
        metrics: [metric],
        dimensions: ['timestamp'],
        filters: filters || {},
        groupBy: [this.getTimeBucket(granularity)],
        orderBy: [{ field: 'timestamp', direction: 'asc' as const }]
      };

      const result = await this.analyticsService.query(query);

      const series: ChartSeries = {
        name: this.getMetricDisplayName(metric),
        data: result.data.map(item => ({
          label: this.formatTimestamp(item.timestamp, granularity),
          value: item[metric] || 0,
          timestamp: item.timestamp
        }))
      };

      const chartData: ChartData = {
        config: {
          type: 'line',
          title: `${this.getMetricDisplayName(metric)} Over Time`,
          xAxis: { title: 'Time', format: this.getTimeFormat(granularity) },
          yAxis: { title: this.getMetricDisplayName(metric) },
          animation: true,
          responsive: true
        },
        series: [series],
        metadata: {
          totalDataPoints: series.data.length,
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          },
          queryTime: Date.now() - startTime
        }
      };

      await this.cacheData(cacheKey, chartData);
      return chartData;

    } catch (error) {
      console.error('Error generating time series data:', error);
      throw new Error(`Failed to generate time series data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate funnel chart data
   */
  async getFunnelData(
    steps: string[],
    dateRange: { start: Date; end: Date },
    filters?: Record<string, any>
  ): Promise<ChartData> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey('funnel', { steps, dateRange, filters });

    try {
      const cached = await this.getCachedData(cacheKey);
      if (cached) return cached;

      const funnelData: ChartDataPoint[] = [];
      let previousCount = 0;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const query = {
          dateRange,
          metrics: ['count'],
          filters: {
            ...filters,
            eventType: step
          }
        };

        const result = await this.analyticsService.query(query);
        const count = result.data[0]?.count || 0;
        const dropoffRate = i > 0 ? ((previousCount - count) / previousCount) * 100 : 0;

        funnelData.push({
          label: this.getStepDisplayName(step),
          value: count,
          metadata: {
            stepIndex: i,
            dropoffRate: dropoffRate.toFixed(1),
            conversionRate: i > 0 ? ((count / funnelData[0].value) * 100).toFixed(1) : '100.0'
          }
        });

        previousCount = count;
      }

      const chartData: ChartData = {
        config: {
          type: 'funnel',
          title: 'Conversion Funnel Analysis',
          legend: { enabled: false },
          animation: true,
          responsive: true
        },
        series: [{
          name: 'Funnel Steps',
          data: funnelData
        }],
        metadata: {
          totalDataPoints: funnelData.length,
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          },
          queryTime: Date.now() - startTime
        }
      };

      await this.cacheData(cacheKey, chartData);
      return chartData;

    } catch (error) {
      console.error('Error generating funnel data:', error);
      throw new Error(`Failed to generate funnel data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate distribution chart data (pie, donut)
   */
  async getDistributionData(
    dimension: string,
    metric: string,
    dateRange: { start: Date; end: Date },
    limit: number = 10,
    filters?: Record<string, any>
  ): Promise<ChartData> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey('distribution', { dimension, metric, dateRange, limit, filters });

    try {
      const cached = await this.getCachedData(cacheKey);
      if (cached) return cached;

      const query = {
        dateRange,
        metrics: [metric],
        dimensions: [dimension],
        filters: filters || {},
        groupBy: [dimension],
        orderBy: [{ field: metric, direction: 'desc' as const }],
        limit
      };

      const result = await this.analyticsService.query(query);
      const total = result.data.reduce((sum, item) => sum + (item[metric] || 0), 0);

      const series: ChartSeries = {
        name: this.getMetricDisplayName(metric),
        data: result.data.map(item => ({
          label: item[dimension] || 'Unknown',
          value: item[metric] || 0,
          metadata: {
            percentage: total > 0 ? ((item[metric] || 0) / total * 100).toFixed(1) : '0.0'
          }
        }))
      };

      const chartData: ChartData = {
        config: {
          type: 'pie',
          title: `${this.getMetricDisplayName(metric)} by ${this.getDimensionDisplayName(dimension)}`,
          legend: { position: 'right', enabled: true },
          animation: true,
          responsive: true
        },
        series: [series],
        metadata: {
          totalDataPoints: series.data.length,
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          },
          queryTime: Date.now() - startTime
        }
      };

      await this.cacheData(cacheKey, chartData);
      return chartData;

    } catch (error) {
      console.error('Error generating distribution data:', error);
      throw new Error(`Failed to generate distribution data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate comparison chart data (multiple series)
   */
  async getComparisonData(
    metrics: string[],
    dimension: string,
    dateRange: { start: Date; end: Date },
    filters?: Record<string, any>
  ): Promise<ChartData> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey('comparison', { metrics, dimension, dateRange, filters });

    try {
      const cached = await this.getCachedData(cacheKey);
      if (cached) return cached;

      const query = {
        dateRange,
        metrics,
        dimensions: [dimension],
        filters: filters || {},
        groupBy: [dimension],
        orderBy: [{ field: dimension, direction: 'asc' as const }]
      };

      const result = await this.analyticsService.query(query);

      const series: ChartSeries[] = metrics.map(metric => ({
        name: this.getMetricDisplayName(metric),
        data: result.data.map(item => ({
          label: item[dimension] || 'Unknown',
          value: item[metric] || 0
        })),
        type: 'bar'
      }));

      const chartData: ChartData = {
        config: {
          type: 'bar',
          title: `Metrics Comparison by ${this.getDimensionDisplayName(dimension)}`,
          xAxis: { title: this.getDimensionDisplayName(dimension) },
          yAxis: { title: 'Value' },
          legend: { position: 'top', enabled: true },
          animation: true,
          responsive: true
        },
        series,
        metadata: {
          totalDataPoints: series.reduce((sum, s) => sum + s.data.length, 0),
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          },
          queryTime: Date.now() - startTime
        }
      };

      await this.cacheData(cacheKey, chartData);
      return chartData;

    } catch (error) {
      console.error('Error generating comparison data:', error);
      throw new Error(`Failed to generate comparison data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // DASHBOARD WIDGET APIS
  // ============================================================================

  /**
   * Get widget data by type and configuration
   */
  async getWidgetData(
    type: string,
    config: Record<string, any>,
    dateRange?: { start: Date; end: Date }
  ): Promise<WidgetData> {
    const startTime = Date.now();

    try {
      let data: any;

      switch (type) {
        case 'metric':
          data = await this.getMetricWidgetData(config, dateRange);
          break;
        case 'chart':
          data = await this.getChartWidgetData(config, dateRange);
          break;
        case 'table':
          data = await this.getTableWidgetData(config, dateRange);
          break;
        case 'progress':
          data = await this.getProgressWidgetData(config, dateRange);
          break;
        case 'gauge':
          data = await this.getGaugeWidgetData(config, dateRange);
          break;
        default:
          throw new Error(`Unsupported widget type: ${type}`);
      }

      return {
        id: config.id || this.generateWidgetId(type, config),
        type: type as any,
        title: config.title || 'Untitled Widget',
        data,
        config,
        lastUpdated: new Date().toISOString(),
        refreshInterval: config.refreshInterval || 30000
      };

    } catch (error) {
      console.error('Error getting widget data:', error);
      throw new Error(`Failed to get widget data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get multiple widget data for dashboard
   */
  async getDashboardData(
    widgets: Array<{ type: string; config: Record<string, any> }>,
    dateRange?: { start: Date; end: Date }
  ): Promise<WidgetData[]> {
    const promises = widgets.map(widget =>
      this.getWidgetData(widget.type, widget.config, dateRange)
    );

    try {
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw new Error(`Failed to get dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // DATA EXPORT APIS
  // ============================================================================

  /**
   * Export chart data in various formats
   */
  async exportChartData(
    chartData: ChartData,
    options: ExportOptions
  ): Promise<{ data: string | Buffer; mimeType: string; filename: string }> {
    try {
      switch (options.format) {
        case 'csv':
          return this.exportToCSV(chartData, options);
        case 'json':
          return this.exportToJSON(chartData, options);
        case 'excel':
          return this.exportToExcel(chartData, options);
        case 'pdf':
          return this.exportToPDF(chartData, options);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      console.error('Error exporting chart data:', error);
      throw new Error(`Failed to export chart data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async getMetricWidgetData(config: Record<string, any>, dateRange?: { start: Date; end: Date }) {
    const metric = config.metric || 'totalVisitors';
    const query = {
      dateRange: dateRange || this.getDefaultDateRange(),
      metrics: [metric],
      filters: config.filters || {}
    };

    const result = await this.analyticsService.query(query);
    const currentValue = result.data[0]?.[metric] || 0;

    // Get previous period for comparison if requested
    let previousValue = 0;
    let change = 0;
    let changePercent = 0;

    if (config.showComparison && dateRange) {
      const previousDateRange = this.getPreviousPeriod(dateRange);
      const previousQuery = { ...query, dateRange: previousDateRange };
      const previousResult = await this.analyticsService.query(previousQuery);
      previousValue = previousResult.data[0]?.[metric] || 0;
      change = currentValue - previousValue;
      changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;
    }

    return {
      value: currentValue,
      formatted: this.formatMetricValue(currentValue, config.format),
      change,
      changePercent: changePercent.toFixed(1),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      previousValue,
      unit: config.unit || ''
    };
  }

  private async getChartWidgetData(config: Record<string, any>, dateRange?: { start: Date; end: Date }) {
    const chartType = config.chartType || 'line';
    const metric = config.metric || 'pageViews';
    const dimension = config.dimension || 'timestamp';

    switch (chartType) {
      case 'line':
      case 'area':
        return this.getTimeSeriesData(metric, dateRange || this.getDefaultDateRange(), config.granularity);
      case 'pie':
      case 'donut':
        return this.getDistributionData(dimension, metric, dateRange || this.getDefaultDateRange(), config.limit);
      case 'bar':
        return this.getComparisonData([metric], dimension, dateRange || this.getDefaultDateRange());
      default:
        throw new Error(`Unsupported chart type: ${chartType}`);
    }
  }

  private async getTableWidgetData(config: Record<string, any>, dateRange?: { start: Date; end: Date }) {
    const query = {
      dateRange: dateRange || this.getDefaultDateRange(),
      metrics: config.metrics || ['pageViews'],
      dimensions: config.dimensions || ['url'],
      filters: config.filters || {},
      groupBy: config.dimensions || ['url'],
      orderBy: config.orderBy || [{ field: 'pageViews', direction: 'desc' as const }],
      limit: config.limit || 10
    };

    const result = await this.analyticsService.query(query);
    return {
      columns: [...(config.dimensions || ['url']), ...(config.metrics || ['pageViews'])],
      rows: result.data,
      totalRows: result.metadata.totalCount
    };
  }

  private async getProgressWidgetData(config: Record<string, any>, dateRange?: { start: Date; end: Date }) {
    const currentMetric = config.currentMetric || 'sessionsToday';
    const targetValue = config.target || 1000;

    const query = {
      dateRange: dateRange || this.getDefaultDateRange(),
      metrics: [currentMetric],
      filters: config.filters || {}
    };

    const result = await this.analyticsService.query(query);
    const currentValue = result.data[0]?.[currentMetric] || 0;
    const progress = Math.min((currentValue / targetValue) * 100, 100);

    return {
      current: currentValue,
      target: targetValue,
      progress: progress.toFixed(1),
      remaining: Math.max(targetValue - currentValue, 0),
      isComplete: currentValue >= targetValue
    };
  }

  private async getGaugeWidgetData(config: Record<string, any>, dateRange?: { start: Date; end: Date }) {
    const metric = config.metric || 'bounceRate';
    const min = config.min || 0;
    const max = config.max || 100;

    const query = {
      dateRange: dateRange || this.getDefaultDateRange(),
      metrics: [metric],
      filters: config.filters || {}
    };

    const result = await this.analyticsService.query(query);
    const value = result.data[0]?.[metric] || 0;
    const percentage = ((value - min) / (max - min)) * 100;

    return {
      value,
      min,
      max,
      percentage: Math.max(0, Math.min(100, percentage)).toFixed(1),
      formatted: this.formatMetricValue(value, config.format),
      status: this.getGaugeStatus(percentage, config.thresholds)
    };
  }

  private exportToCSV(chartData: ChartData, options: ExportOptions): { data: string; mimeType: string; filename: string } {
    const headers = ['Label', 'Value'];
    if (chartData.series[0]?.data[0]?.timestamp) {
      headers.unshift('Timestamp');
    }

    let csvContent = headers.join(',') + '\n';

    chartData.series.forEach(series => {
      series.data.forEach(point => {
        const row = [
          point.timestamp || '',
          `"${point.label}"`,
          point.value
        ].filter(Boolean);
        csvContent += row.join(',') + '\n';
      });
    });

    return {
      data: csvContent,
      mimeType: 'text/csv',
      filename: `${chartData.config.title.replace(/\s+/g, '_').toLowerCase()}.csv`
    };
  }

  private exportToJSON(chartData: ChartData, options: ExportOptions): { data: string; mimeType: string; filename: string } {
    const jsonData = {
      chartConfig: chartData.config,
      series: chartData.series,
      metadata: {
        ...chartData.metadata,
        exportedAt: new Date().toISOString(),
        exportOptions: options
      }
    };

    return {
      data: JSON.stringify(jsonData, null, 2),
      mimeType: 'application/json',
      filename: `${chartData.config.title.replace(/\s+/g, '_').toLowerCase()}.json`
    };
  }

  private exportToExcel(chartData: ChartData, options: ExportOptions): { data: Buffer; mimeType: string; filename: string } {
    // For now, return CSV format as Buffer - full Excel implementation would require a library like xlsx
    const csvData = this.exportToCSV(chartData, options);
    return {
      data: Buffer.from(csvData.data),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `${chartData.config.title.replace(/\s+/g, '_').toLowerCase()}.xlsx`
    };
  }

  private exportToPDF(chartData: ChartData, options: ExportOptions): { data: Buffer; mimeType: string; filename: string } {
    // For now, return JSON as Buffer - full PDF implementation would require a library like puppeteer or pdfkit
    const jsonData = this.exportToJSON(chartData, options);
    return {
      data: Buffer.from(jsonData.data),
      mimeType: 'application/pdf',
      filename: `${chartData.config.title.replace(/\s+/g, '_').toLowerCase()}.pdf`
    };
  }

  private generateCacheKey(type: string, params: Record<string, any>): string {
    const hash = Buffer.from(JSON.stringify(params)).toString('base64').slice(0, 16);
    return `${this.cachePrefix}${type}:${hash}`;
  }

  private async getCachedData(key: string): Promise<ChartData | null> {
    try {
      const cached = await this.redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  private async cacheData(key: string, data: ChartData, ttl: number = this.defaultCacheTTL): Promise<void> {
    try {
      const cacheData = { ...data, metadata: { ...data.metadata, cachedAt: new Date().toISOString() } };
      await this.redisClient.setex(key, ttl, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  private getTimeBucket(granularity: string): string {
    const buckets: Record<string, string> = {
      hour: 'HOUR(timestamp)',
      day: 'DATE(timestamp)',
      week: 'YEARWEEK(timestamp)',
      month: 'YEAR(timestamp), MONTH(timestamp)'
    };
    return buckets[granularity] || buckets.day;
  }

  private formatTimestamp(timestamp: string, granularity: string): string {
    const date = new Date(timestamp);
    const formats: Record<string, string> = {
      hour: date.toLocaleString('en-US', { hour: 'numeric', hour12: true }),
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      week: `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
    return formats[granularity] || formats.day;
  }

  private getTimeFormat(granularity: string): string {
    const formats: Record<string, string> = {
      hour: 'HH:mm',
      day: 'MMM DD',
      week: 'MMM DD',
      month: 'MMM YYYY'
    };
    return formats[granularity] || formats.day;
  }

  private getMetricDisplayName(metric: string): string {
    const names: Record<string, string> = {
      pageViews: 'Page Views',
      sessions: 'Sessions',
      visitors: 'Visitors',
      events: 'Events',
      bounceRate: 'Bounce Rate',
      sessionDuration: 'Session Duration',
      conversionRate: 'Conversion Rate'
    };
    return names[metric] || metric.charAt(0).toUpperCase() + metric.slice(1);
  }

  private getDimensionDisplayName(dimension: string): string {
    const names: Record<string, string> = {
      url: 'Page URL',
      country: 'Country',
      device: 'Device Type',
      browser: 'Browser',
      referrer: 'Referrer',
      platform: 'Platform'
    };
    return names[dimension] || dimension.charAt(0).toUpperCase() + dimension.slice(1);
  }

  private getStepDisplayName(step: string): string {
    return step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private generateWidgetId(type: string, config: Record<string, any>): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultDateRange(): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // Last 30 days
    return { start, end };
  }

  private getPreviousPeriod(dateRange: { start: Date; end: Date }): { start: Date; end: Date } {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    const start = new Date(dateRange.start.getTime() - duration);
    const end = new Date(dateRange.end.getTime() - duration);
    return { start, end };
  }

  private formatMetricValue(value: number, format?: string): string {
    if (!format) return value.toString();

    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'duration':
        return `${Math.floor(value / 60)}m ${value % 60}s`;
      case 'compact':
        return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` :
               value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString();
      default:
        return value.toLocaleString();
    }
  }

  private getGaugeStatus(percentage: number, thresholds?: { good?: number; warning?: number }): string {
    if (!thresholds) return 'normal';

    const { good = 70, warning = 40 } = thresholds;
    if (percentage >= good) return 'good';
    if (percentage >= warning) return 'warning';
    return 'critical';
  }
}

export const createVisualizationService = (analyticsService: AnalyticsService): VisualizationService => {
  return new VisualizationService(analyticsService);
};
