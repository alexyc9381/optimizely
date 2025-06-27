import { EventEmitter } from 'events';

// =============================================================================
// EXECUTIVE KPI INTERFACES
// =============================================================================

export interface ExecutiveKPI {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  target: number;
  unit: string;
  format: 'currency' | 'percentage' | 'number' | 'duration';
  category: 'revenue' | 'growth' | 'efficiency' | 'retention' | 'acquisition';
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  status: 'on-track' | 'at-risk' | 'off-track' | 'exceeded';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  lastUpdated: Date;
  confidence: number; // 0-100%
}

export interface GoalProgress {
  goalId: string;
  name: string;
  description: string;
  currentValue: number;
  targetValue: number;
  startValue: number;
  progress: number; // 0-100%
  status: 'not-started' | 'in-progress' | 'completed' | 'exceeded' | 'at-risk';
  deadline: Date;
  category: string;
  milestones: GoalMilestone[];
  owner: string;
  department: string;
  lastUpdated: Date;
}

export interface GoalMilestone {
  id: string;
  name: string;
  targetDate: Date;
  targetValue: number;
  completed: boolean;
  completedDate?: Date;
  completedValue?: number;
}

export interface PerformanceScorecard {
  period: string;
  department: string;
  overallScore: number; // 0-100
  kpiScores: {
    kpiId: string;
    name: string;
    score: number;
    weight: number;
    achievement: number;
    target: number;
  }[];
  trend: 'improving' | 'declining' | 'stable';
  strengths: string[];
  concerns: string[];
  recommendations: string[];
}

export interface TrendAnalysis {
  metric: string;
  timeframe: string;
  dataPoints: TrendDataPoint[];
  trendType: 'linear' | 'exponential' | 'seasonal' | 'volatile';
  direction: 'upward' | 'downward' | 'flat' | 'mixed';
  strength: number; // 0-100%
  forecast: ForecastPoint[];
  insights: string[];
  correlations: MetricCorrelation[];
}

export interface TrendDataPoint {
  date: Date;
  value: number;
  label?: string;
}

export interface ForecastPoint {
  date: Date;
  predicted: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

export interface MetricCorrelation {
  metric: string;
  correlation: number; // -1 to 1
  significance: number; // 0-100%
  description: string;
}

export interface StrategicInsight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'recommendation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: 'low' | 'medium' | 'high';
  confidence: number; // 0-100%
  affectedMetrics: string[];
  suggestedActions: string[];
  source: string;
  createdAt: Date;
  relevantUntil?: Date;
}

export interface ExecutiveSummary {
  period: string;
  overallHealthScore: number; // 0-100
  keyHighlights: string[];
  criticalAlerts: string[];
  topOpportunities: string[];
  riskFactors: string[];
  performanceSummary: {
    revenue: { current: number; target: number; achievement: number };
    growth: { current: number; target: number; achievement: number };
    efficiency: { current: number; target: number; achievement: number };
    retention: { current: number; target: number; achievement: number };
  };
  nextSteps: string[];
  executiveActions: string[];
}

export interface KPIFilters {
  categories?: string[];
  departments?: string[];
  periods?: string[];
  status?: string[];
  urgency?: string[];
  kpiIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

export interface ExecutiveKPIData {
  kpis: ExecutiveKPI[];
  goalProgress: GoalProgress[];
  performanceScorecards: PerformanceScorecard[];
  trendAnalyses: TrendAnalysis[];
  strategicInsights: StrategicInsight[];
  executiveSummary: ExecutiveSummary;
  benchmarks: { [key: string]: number };
  alerts: { level: string; message: string; timestamp: Date }[];
}

// =============================================================================
// EXECUTIVE KPI SERVICE
// =============================================================================

export class ExecutiveKPIService extends EventEmitter {
  private redis: any;
  private cacheTimeout = 1800; // 30 minutes

  constructor(redisClient: any) {
    super();
    this.redis = redisClient;
  }

  /**
   * Get comprehensive executive KPI data
   */
  async getExecutiveKPIData(filters: KPIFilters = {}): Promise<ExecutiveKPIData> {
    const cacheKey = `executive_kpi_data:${JSON.stringify(filters)}`;

    try {
      // Try to get from cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Generate fresh data
      const [
        kpis,
        goalProgress,
        performanceScorecards,
        trendAnalyses,
        strategicInsights,
        executiveSummary,
        benchmarks,
        alerts
      ] = await Promise.all([
        this.getExecutiveKPIs(filters),
        this.getGoalProgress(filters),
        this.getPerformanceScorecards(filters),
        this.getTrendAnalyses(filters),
        this.getStrategicInsights(filters),
        this.getExecutiveSummary(filters),
        this.getBenchmarks(),
        this.getAlerts(filters)
      ]);

      const data: ExecutiveKPIData = {
        kpis,
        goalProgress,
        performanceScorecards,
        trendAnalyses,
        strategicInsights,
        executiveSummary,
        benchmarks,
        alerts
      };

      // Cache the result
      await this.redis.setex(cacheKey, this.cacheTimeout, JSON.stringify(data));

      // Emit event
      this.emit('kpiDataGenerated', { filters, timestamp: new Date() });

      return data;
    } catch (error) {
      console.error('Error getting executive KPI data:', error);
      throw error;
    }
  }

  /**
   * Get executive-level KPIs
   */
  async getExecutiveKPIs(filters: KPIFilters = {}): Promise<ExecutiveKPI[]> {
    // Mock executive KPIs data
    const mockKPIs: ExecutiveKPI[] = [
      {
        id: 'revenue_growth',
        name: 'Revenue Growth Rate',
        value: 24.5,
        previousValue: 18.3,
        target: 25.0,
        unit: '%',
        format: 'percentage',
        category: 'revenue',
        trend: 'up',
        trendPercentage: 33.9,
        status: 'on-track',
        urgency: 'medium',
        description: 'Year-over-year revenue growth rate',
        lastUpdated: new Date(),
        confidence: 92
      },
      {
        id: 'annual_recurring_revenue',
        name: 'Annual Recurring Revenue',
        value: 12500000,
        previousValue: 10200000,
        target: 15000000,
        unit: 'USD',
        format: 'currency',
        category: 'revenue',
        trend: 'up',
        trendPercentage: 22.5,
        status: 'on-track',
        urgency: 'low',
        description: 'Total annual recurring revenue from subscriptions',
        lastUpdated: new Date(),
        confidence: 95
      },
      {
        id: 'customer_acquisition_cost',
        name: 'Customer Acquisition Cost',
        value: 245,
        previousValue: 289,
        target: 200,
        unit: 'USD',
        format: 'currency',
        category: 'acquisition',
        trend: 'down',
        trendPercentage: -15.2,
        status: 'at-risk',
        urgency: 'high',
        description: 'Average cost to acquire a new customer',
        lastUpdated: new Date(),
        confidence: 88
      },
      {
        id: 'customer_lifetime_value',
        name: 'Customer Lifetime Value',
        value: 3250,
        previousValue: 2890,
        target: 3500,
        unit: 'USD',
        format: 'currency',
        category: 'retention',
        trend: 'up',
        trendPercentage: 12.5,
        status: 'on-track',
        urgency: 'low',
        description: 'Average revenue generated per customer over their lifetime',
        lastUpdated: new Date(),
        confidence: 91
      },
      {
        id: 'net_revenue_retention',
        name: 'Net Revenue Retention',
        value: 118,
        previousValue: 112,
        target: 120,
        unit: '%',
        format: 'percentage',
        category: 'retention',
        trend: 'up',
        trendPercentage: 5.4,
        status: 'on-track',
        urgency: 'medium',
        description: 'Revenue retention including expansion and churn',
        lastUpdated: new Date(),
        confidence: 94
      },
      {
        id: 'gross_margin',
        name: 'Gross Margin',
        value: 78.5,
        previousValue: 76.2,
        target: 80.0,
        unit: '%',
        format: 'percentage',
        category: 'efficiency',
        trend: 'up',
        trendPercentage: 3.0,
        status: 'on-track',
        urgency: 'low',
        description: 'Gross profit margin percentage',
        lastUpdated: new Date(),
        confidence: 96
      },
      {
        id: 'sales_efficiency',
        name: 'Sales Efficiency Ratio',
        value: 1.8,
        previousValue: 1.6,
        target: 2.0,
        unit: 'ratio',
        format: 'number',
        category: 'efficiency',
        trend: 'up',
        trendPercentage: 12.5,
        status: 'on-track',
        urgency: 'medium',
        description: 'Revenue generated per dollar of sales investment',
        lastUpdated: new Date(),
        confidence: 87
      },
      {
        id: 'market_share',
        name: 'Market Share',
        value: 8.2,
        previousValue: 7.1,
        target: 10.0,
        unit: '%',
        format: 'percentage',
        category: 'growth',
        trend: 'up',
        trendPercentage: 15.5,
        status: 'on-track',
        urgency: 'medium',
        description: 'Share of total addressable market',
        lastUpdated: new Date(),
        confidence: 82
      }
    ];

    // Apply filters
    let filteredKPIs = mockKPIs;

    if (filters.categories?.length) {
      filteredKPIs = filteredKPIs.filter(kpi =>
        filters.categories!.includes(kpi.category)
      );
    }

    if (filters.status?.length) {
      filteredKPIs = filteredKPIs.filter(kpi =>
        filters.status!.includes(kpi.status)
      );
    }

    if (filters.urgency?.length) {
      filteredKPIs = filteredKPIs.filter(kpi =>
        filters.urgency!.includes(kpi.urgency)
      );
    }

    if (filters.kpiIds?.length) {
      filteredKPIs = filteredKPIs.filter(kpi =>
        filters.kpiIds!.includes(kpi.id)
      );
    }

    return filteredKPIs;
  }

  /**
   * Get goal progress tracking
   */
  async getGoalProgress(filters: KPIFilters = {}): Promise<GoalProgress[]> {
    const mockGoals: GoalProgress[] = [
      {
        goalId: 'annual_revenue_goal',
        name: 'Annual Revenue Target',
        description: 'Achieve $15M in annual recurring revenue',
        currentValue: 12500000,
        targetValue: 15000000,
        startValue: 10000000,
        progress: 50,
        status: 'in-progress',
        deadline: new Date('2024-12-31'),
        category: 'revenue',
        milestones: [
          {
            id: 'q1_milestone',
            name: 'Q1 Revenue Target',
            targetDate: new Date('2024-03-31'),
            targetValue: 11250000,
            completed: true,
            completedDate: new Date('2024-03-30'),
            completedValue: 11500000
          },
          {
            id: 'q2_milestone',
            name: 'Q2 Revenue Target',
            targetDate: new Date('2024-06-30'),
            targetValue: 12500000,
            completed: true,
            completedDate: new Date('2024-06-29'),
            completedValue: 12500000
          },
          {
            id: 'q3_milestone',
            name: 'Q3 Revenue Target',
            targetDate: new Date('2024-09-30'),
            targetValue: 13750000,
            completed: false
          }
        ],
        owner: 'CEO',
        department: 'Executive',
        lastUpdated: new Date()
      },
      {
        goalId: 'customer_growth_goal',
        name: 'Customer Base Expansion',
        description: 'Grow customer base to 5,000 active customers',
        currentValue: 3850,
        targetValue: 5000,
        startValue: 3200,
        progress: 36.1,
        status: 'in-progress',
        deadline: new Date('2024-12-31'),
        category: 'growth',
        milestones: [
          {
            id: 'customer_4000',
            name: '4,000 Customers',
            targetDate: new Date('2024-06-30'),
            targetValue: 4000,
            completed: false
          },
          {
            id: 'customer_4500',
            name: '4,500 Customers',
            targetDate: new Date('2024-09-30'),
            targetValue: 4500,
            completed: false
          }
        ],
        owner: 'VP Sales',
        department: 'Sales',
        lastUpdated: new Date()
      }
    ];

    return mockGoals;
  }

  /**
   * Get performance scorecards
   */
  async getPerformanceScorecards(filters: KPIFilters = {}): Promise<PerformanceScorecard[]> {
    const mockScorecards: PerformanceScorecard[] = [
      {
        period: 'Q2 2024',
        department: 'Overall',
        overallScore: 82,
        kpiScores: [
          { kpiId: 'revenue_growth', name: 'Revenue Growth', score: 85, weight: 30, achievement: 24.5, target: 25.0 },
          { kpiId: 'customer_acquisition_cost', name: 'CAC', score: 70, weight: 20, achievement: 245, target: 200 },
          { kpiId: 'net_revenue_retention', name: 'NRR', score: 90, weight: 25, achievement: 118, target: 120 },
          { kpiId: 'gross_margin', name: 'Gross Margin', score: 88, weight: 25, achievement: 78.5, target: 80.0 }
        ],
        trend: 'improving',
        strengths: [
          'Strong revenue growth momentum',
          'Excellent customer retention',
          'Improving gross margins'
        ],
        concerns: [
          'Customer acquisition costs above target',
          'Market competition increasing'
        ],
        recommendations: [
          'Optimize marketing channels to reduce CAC',
          'Focus on high-value customer segments',
          'Invest in retention programs'
        ]
      }
    ];

    return mockScorecards;
  }

  /**
   * Get trend analyses
   */
  async getTrendAnalyses(filters: KPIFilters = {}): Promise<TrendAnalysis[]> {
    const mockTrends: TrendAnalysis[] = [
      {
        metric: 'Annual Recurring Revenue',
        timeframe: 'Last 12 months',
        dataPoints: [
          { date: new Date('2023-07-01'), value: 10200000 },
          { date: new Date('2023-08-01'), value: 10450000 },
          { date: new Date('2023-09-01'), value: 10720000 },
          { date: new Date('2023-10-01'), value: 11000000 },
          { date: new Date('2023-11-01'), value: 11280000 },
          { date: new Date('2023-12-01'), value: 11580000 },
          { date: new Date('2024-01-01'), value: 11850000 },
          { date: new Date('2024-02-01'), value: 12120000 },
          { date: new Date('2024-03-01'), value: 12400000 },
          { date: new Date('2024-04-01'), value: 12680000 },
          { date: new Date('2024-05-01'), value: 12950000 },
          { date: new Date('2024-06-01'), value: 13250000 }
        ],
        trendType: 'linear',
        direction: 'upward',
        strength: 92,
        forecast: [
          { date: new Date('2024-07-01'), predicted: 13550000, confidence: 88, upperBound: 13750000, lowerBound: 13350000 },
          { date: new Date('2024-08-01'), predicted: 13850000, confidence: 85, upperBound: 14100000, lowerBound: 13600000 },
          { date: new Date('2024-09-01'), predicted: 14150000, confidence: 82, upperBound: 14450000, lowerBound: 13850000 }
        ],
        insights: [
          'Consistent month-over-month growth of ~$280K',
          'Growth rate accelerating in recent months',
          'Strong correlation with customer acquisition'
        ],
        correlations: [
          { metric: 'Customer Count', correlation: 0.94, significance: 96, description: 'Strong positive correlation with customer growth' },
          { metric: 'Marketing Spend', correlation: 0.76, significance: 82, description: 'Moderate correlation with marketing investment' }
        ]
      }
    ];

    return mockTrends;
  }

  /**
   * Get strategic insights
   */
  async getStrategicInsights(filters: KPIFilters = {}): Promise<StrategicInsight[]> {
    const mockInsights: StrategicInsight[] = [
      {
        id: 'insight_cac_optimization',
        title: 'Customer Acquisition Cost Optimization Opportunity',
        description: 'CAC has increased 15% while competitor analysis shows 20% lower average costs in the market.',
        type: 'opportunity',
        priority: 'high',
        impact: 'high',
        confidence: 87,
        affectedMetrics: ['customer_acquisition_cost', 'customer_lifetime_value'],
        suggestedActions: [
          'Audit marketing channel performance',
          'Implement attribution modeling',
          'Test new acquisition channels',
          'Optimize conversion funnel'
        ],
        source: 'Competitive Intelligence',
        createdAt: new Date(),
        relevantUntil: new Date('2024-09-30')
      },
      {
        id: 'insight_retention_strength',
        title: 'Exceptional Customer Retention Performance',
        description: 'Net Revenue Retention of 118% exceeds industry benchmark by 8%, indicating strong product-market fit.',
        type: 'trend',
        priority: 'medium',
        impact: 'high',
        confidence: 94,
        affectedMetrics: ['net_revenue_retention', 'customer_lifetime_value'],
        suggestedActions: [
          'Document retention best practices',
          'Expand successful programs',
          'Invest in customer success team',
          'Develop case studies'
        ],
        source: 'Performance Analysis',
        createdAt: new Date(),
        relevantUntil: new Date('2024-12-31')
      }
    ];

    return mockInsights;
  }

  /**
   * Get executive summary
   */
  async getExecutiveSummary(filters: KPIFilters = {}): Promise<ExecutiveSummary> {
    return {
      period: 'Q2 2024',
      overallHealthScore: 82,
      keyHighlights: [
        'Revenue growth rate of 24.5% exceeds industry average',
        'Net Revenue Retention at 118% demonstrates strong customer value',
        'Market share increased 15.5% quarter-over-quarter',
        'Gross margin improved to 78.5%, approaching 80% target'
      ],
      criticalAlerts: [
        'Customer Acquisition Cost 22% above target - requires immediate attention',
        'Sales cycle length increasing by average 8 days'
      ],
      topOpportunities: [
        'Market expansion opportunity with current growth momentum',
        'Optimize marketing channels to reduce CAC by estimated 15%',
        'Upselling potential with high retention customers'
      ],
      riskFactors: [
        'Increasing competitive pressure on pricing',
        'Dependency on key customer segments',
        'Rising acquisition costs impacting unit economics'
      ],
      performanceSummary: {
        revenue: { current: 12500000, target: 15000000, achievement: 83.3 },
        growth: { current: 24.5, target: 25.0, achievement: 98.0 },
        efficiency: { current: 78.5, target: 80.0, achievement: 98.1 },
        retention: { current: 118, target: 120, achievement: 98.3 }
      },
      nextSteps: [
        'Implement CAC optimization initiative within 30 days',
        'Expand sales team to capitalize on market opportunity',
        'Develop retention program playbook for new segments'
      ],
      executiveActions: [
        'Approve additional marketing budget for channel optimization',
        'Review competitive positioning strategy',
        'Consider strategic partnerships for market expansion'
      ]
    };
  }

  /**
   * Get industry benchmarks
   */
  async getBenchmarks(): Promise<{ [key: string]: number }> {
    return {
      revenue_growth_industry: 18.2,
      cac_industry: 195,
      ltv_industry: 2850,
      nrr_industry: 110,
      gross_margin_industry: 75.5,
      market_share_industry: 5.8
    };
  }

  /**
   * Get alerts and notifications
   */
  async getAlerts(filters: KPIFilters = {}): Promise<{ level: string; message: string; timestamp: Date }[]> {
    return [
      {
        level: 'warning',
        message: 'Customer Acquisition Cost exceeded target by 22%',
        timestamp: new Date()
      },
      {
        level: 'info',
        message: 'Net Revenue Retention reached 118%, exceeding industry benchmark',
        timestamp: new Date()
      },
      {
        level: 'critical',
        message: 'Sales pipeline velocity decreased 8% compared to last quarter',
        timestamp: new Date()
      }
    ];
  }

  /**
   * Real-time KPI updates
   */
  async updateKPI(kpiId: string, value: number): Promise<void> {
    try {
      // Update KPI value
      const updateEvent = {
        kpiId,
        value,
        timestamp: new Date(),
        source: 'real-time-update'
      };

      // Emit update event
      this.emit('kpiUpdated', updateEvent);

      // Invalidate related caches
      const pattern = 'executive_kpi_data:*';
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      console.log(`KPI ${kpiId} updated to ${value}`);
    } catch (error) {
      console.error('Error updating KPI:', error);
      throw error;
    }
  }
}

export function createExecutiveKPIService(redisClient: any): ExecutiveKPIService {
  return new ExecutiveKPIService(redisClient);
}
