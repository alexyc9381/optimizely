import { Redis } from 'ioredis';

// Reporting interfaces
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'attribution' | 'content' | 'campaign' | 'ab_test' | 'audience' | 'revenue' | 'executive';
  schedule?: ReportSchedule;
  format: 'json' | 'pdf' | 'excel' | 'csv';
  filters: ReportFilters;
  visualizations: ReportVisualization[];
  recipients: string[];
  isActive: boolean;
  metadata: {
    owner: string;
    team?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface ReportSchedule {
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  timezone: string;
  time?: string; // HH:mm format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  enabled: boolean;
}

export interface ReportFilters {
  dateRange: {
    start: Date;
    end: Date;
    relativePeriod?: string; // 'last_7_days', 'last_30_days', etc.
  };
  campaigns?: string[];
  channels?: string[];
  segments?: string[];
  experiments?: string[];
  contentTypes?: string[];
  metrics?: string[];
}

export interface ReportVisualization {
  id: string;
  type: 'line_chart' | 'bar_chart' | 'pie_chart' | 'table' | 'metric_card' | 'funnel' | 'heatmap';
  title: string;
  dataSource: string;
  config: Record<string, any>;
  position: { x: number; y: number; width: number; height: number };
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  type: string;
  format: string;
  data: ReportData;
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    dataTimeframe: { start: Date; end: Date };
    reportSize: number;
  };
  url?: string; // For file-based reports
}

export interface ReportData {
  summary: ReportSummary;
  sections: ReportSection[];
  charts: ChartData[];
  tables: TableData[];
  insights: ReportInsight[];
}

export interface ReportSummary {
  totalRevenue: number;
  totalConversions: number;
  conversionRate: number;
  averageOrderValue: number;
  returnOnAdSpend: number;
  topPerformingChannel: string;
  topPerformingCampaign: string;
  keyMetrics: { name: string; value: number; change: number }[];
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'attribution' | 'content' | 'campaigns' | 'segments' | 'experiments';
  data: any;
  insights: string[];
}

export interface ChartData {
  id: string;
  type: string;
  title: string;
  data: any[];
  config: Record<string, any>;
}

export interface TableData {
  id: string;
  title: string;
  headers: string[];
  rows: any[][];
  pagination?: { page: number; totalPages: number; totalRows: number };
}

export interface ReportInsight {
  type: 'positive' | 'negative' | 'neutral' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  actions?: string[];
}

class UniversalMarketingReportingService {
  private redis: Redis;
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  // TEMPLATE MANAGEMENT
  async createTemplate(template: Omit<ReportTemplate, 'id' | 'metadata'>): Promise<string> {
    const id = `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullTemplate: ReportTemplate = {
      id,
      ...template,
      metadata: {
        owner: 'system',
        team: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    await this.redis.setex(
      `report_template:${id}`,
      365 * 24 * 60 * 60, // 1 year
      JSON.stringify(fullTemplate)
    );

    await this.redis.sadd('report_templates:all', id);
    await this.redis.sadd(`report_templates:type:${template.type}`, id);

    if (template.schedule?.enabled) {
      await this.redis.sadd('report_templates:scheduled', id);
    }

    return id;
  }

  async getTemplate(templateId: string): Promise<ReportTemplate | null> {
    const template = await this.redis.get(`report_template:${templateId}`);
    return template ? JSON.parse(template) : null;
  }

  async listTemplates(filters: { type?: string; owner?: string; team?: string } = {}): Promise<ReportTemplate[]> {
    let templateIds: string[];

    if (filters.type) {
      templateIds = await this.redis.smembers(`report_templates:type:${filters.type}`);
    } else {
      templateIds = await this.redis.smembers('report_templates:all');
    }

    const templates = await Promise.all(
      templateIds.map(id => this.getTemplate(id))
    );

    return templates
      .filter((t): t is ReportTemplate => t !== null)
      .filter(t => {
        if (filters.owner && t.metadata.owner !== filters.owner) return false;
        if (filters.team && t.metadata.team !== filters.team) return false;
        return true;
      });
  }

  // REPORT GENERATION
  async generateReport(templateId: string, overrideFilters?: Partial<ReportFilters>): Promise<GeneratedReport> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Report template not found');
    }

    const filters = { ...template.filters, ...overrideFilters };
    const reportId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate report data based on type
    const data = await this.generateReportData(template.type, filters);

    const report: GeneratedReport = {
      id: reportId,
      templateId,
      type: template.type,
      format: template.format,
      data,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'system',
        dataTimeframe: filters.dateRange,
        reportSize: JSON.stringify(data).length
      }
    };

    // Cache the report
    await this.redis.setex(
      `generated_report:${reportId}`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify(report)
    );

    return report;
  }

  private async generateReportData(type: string, filters: ReportFilters): Promise<ReportData> {
    const summary = await this.generateSummary(filters);
    const sections = await this.generateSections(type, filters);
    const charts = await this.generateCharts(type, filters);
    const tables = await this.generateTables(type, filters);
    const insights = await this.generateInsights(type, filters);

    return { summary, sections, charts, tables, insights };
  }

  private async generateSummary(filters: ReportFilters): Promise<ReportSummary> {
    // This would integrate with attribution, content, and campaign services
    return {
      totalRevenue: 125000,
      totalConversions: 2400,
      conversionRate: 0.035,
      averageOrderValue: 52.08,
      returnOnAdSpend: 4.2,
      topPerformingChannel: 'Organic Search',
      topPerformingCampaign: 'Holiday Sale 2024',
      keyMetrics: [
        { name: 'Conversion Rate', value: 3.5, change: 0.3 },
        { name: 'Revenue', value: 125000, change: 8.2 },
        { name: 'Traffic', value: 68500, change: 12.1 }
      ]
    };
  }

  private async generateSections(type: string, filters: ReportFilters): Promise<ReportSection[]> {
    const sections: ReportSection[] = [];

    if (type === 'attribution' || type === 'executive') {
      sections.push({
        id: 'attribution',
        title: 'Attribution Analysis',
        type: 'attribution',
        data: await this.getAttributionData(filters),
        insights: ['Email marketing shows 23% higher conversion rates', 'Social media attribution increased 15%']
      });
    }

    if (type === 'content' || type === 'executive') {
      sections.push({
        id: 'content',
        title: 'Content Performance',
        type: 'content',
        data: await this.getContentData(filters),
        insights: ['Blog posts drive 34% of organic traffic', 'Video content has 2.3x engagement rate']
      });
    }

    return sections;
  }

  private async generateCharts(type: string, filters: ReportFilters): Promise<ChartData[]> {
    const charts: ChartData[] = [];

    // Attribution funnel chart
    charts.push({
      id: 'attribution_funnel',
      type: 'funnel',
      title: 'Marketing Attribution Funnel',
      data: [
        { stage: 'Awareness', value: 10000, conversion: 100 },
        { stage: 'Interest', value: 3500, conversion: 35 },
        { stage: 'Consideration', value: 1800, conversion: 18 },
        { stage: 'Purchase', value: 450, conversion: 4.5 }
      ],
      config: { colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'] }
    });

    // Revenue by channel
    charts.push({
      id: 'revenue_by_channel',
      type: 'bar_chart',
      title: 'Revenue by Marketing Channel',
      data: [
        { channel: 'Organic Search', revenue: 45000, percentage: 36 },
        { channel: 'Paid Search', revenue: 32000, percentage: 25.6 },
        { channel: 'Email', revenue: 28000, percentage: 22.4 },
        { channel: 'Social Media', revenue: 20000, percentage: 16 }
      ],
      config: { xAxis: 'channel', yAxis: 'revenue' }
    });

    return charts;
  }

  private async generateTables(type: string, filters: ReportFilters): Promise<TableData[]> {
    return [
      {
        id: 'campaign_performance',
        title: 'Campaign Performance Summary',
        headers: ['Campaign', 'Impressions', 'Clicks', 'Conversions', 'Revenue', 'ROAS'],
        rows: [
          ['Holiday Sale 2024', '125,000', '4,200', '186', '$9,730', '4.8x'],
          ['Spring Collection', '98,000', '3,100', '142', '$7,410', '3.9x'],
          ['Brand Awareness', '156,000', '2,800', '98', '$5,125', '2.1x']
        ],
        pagination: { page: 1, totalPages: 1, totalRows: 3 }
      }
    ];
  }

  private async generateInsights(type: string, filters: ReportFilters): Promise<ReportInsight[]> {
    return [
      {
        type: 'positive',
        title: 'Strong Email Performance',
        description: 'Email campaigns are outperforming expectations with 23% higher conversion rates',
        confidence: 0.92,
        actions: ['Increase email campaign budget by 20%', 'Test additional email sequences']
      },
      {
        type: 'recommendation',
        title: 'Optimize Mobile Experience',
        description: 'Mobile traffic accounts for 65% of visits but only 45% of conversions',
        confidence: 0.88,
        actions: ['Implement mobile-first checkout', 'A/B test mobile landing pages']
      }
    ];
  }

  private async getAttributionData(filters: ReportFilters): Promise<any> {
    // Integration with attribution service
    return {
      touchpoints: [
        { channel: 'Organic Search', touches: 4500, revenue: 45000, weight: 0.3 },
        { channel: 'Email', touches: 3200, revenue: 28000, weight: 0.25 },
        { channel: 'Social Media', touches: 2800, revenue: 20000, weight: 0.2 }
      ]
    };
  }

  private async getContentData(filters: ReportFilters): Promise<any> {
    // Integration with content performance service
    return {
      topContent: [
        { title: 'How to Guide', views: 15000, conversions: 234, score: 8.9 },
        { title: 'Product Demo Video', views: 12000, conversions: 189, score: 7.8 }
      ]
    };
  }

  // SCHEDULING AND AUTOMATION
  async scheduleReport(templateId: string, schedule: ReportSchedule): Promise<void> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    template.schedule = { ...schedule, enabled: true };
    template.metadata.updatedAt = new Date();

    await this.redis.setex(
      `report_template:${templateId}`,
      365 * 24 * 60 * 60,
      JSON.stringify(template)
    );

    await this.redis.sadd('report_templates:scheduled', templateId);
  }

  async getScheduledReports(): Promise<ReportTemplate[]> {
    const scheduledIds = await this.redis.smembers('report_templates:scheduled');
    const templates = await Promise.all(
      scheduledIds.map(id => this.getTemplate(id))
    );
    return templates.filter((t): t is ReportTemplate => t !== null && t.schedule?.enabled === true);
  }

  // REAL-TIME DASHBOARD
  async getDashboardData(dashboardId: string): Promise<any> {
    const cacheKey = `dashboard:${dashboardId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const data = {
      timestamp: new Date(),
      metrics: {
        realTimeVisitors: 234,
        conversionsToday: 45,
        revenueToday: 2340,
        topChannels: ['Organic Search', 'Email', 'Social Media']
      },
      alerts: [],
      trends: {
        conversionRate: { current: 3.2, trend: 'up', change: 0.3 },
        revenue: { current: 125000, trend: 'up', change: 8.2 }
      }
    };

    await this.redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 min cache
    return data;
  }

  async getHealthStatus() {
    try {
      const templatesCount = await this.redis.scard('report_templates:all');
      const scheduledCount = await this.redis.scard('report_templates:scheduled');

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics: {
          totalTemplates: templatesCount,
          scheduledReports: scheduledCount,
          redisConnected: true
        },
        version: '1.0.0'
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        version: '1.0.0'
      };
    }
  }
}

export function createUniversalMarketingReportingService(redisClient: Redis): UniversalMarketingReportingService {
  return new UniversalMarketingReportingService(redisClient);
}

export default createUniversalMarketingReportingService;
