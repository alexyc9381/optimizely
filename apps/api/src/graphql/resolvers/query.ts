import { createVisualizationService } from '../../services/visualization-service';
import { Context, requireAuth } from '../context';

// Create visualization service instance
let visualizationService: any = null;

export const queryResolvers = {
  // Event queries
  event: async (_: any, { id }: { id: string }, context: Context) => {
    requireAuth(context);

    const result = await context.analyticsService.getEventById(id);
    if (!result.success) {
      throw new Error(result.error || 'Event not found');
    }
    return result.event;
  },

  events: async (
    _: any,
    { first = 50, after, filters }: { first?: number; after?: string; filters?: any },
    context: Context
  ) => {
    requireAuth(context);

    const result = await context.analyticsService.queryEvents({
      filters: filters || {},
      pagination: {
        limit: Math.min(first, 100), // Cap at 100
        offset: after ? parseInt(Buffer.from(after, 'base64').toString()) : 0
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to query events');
    }

    const events = result.events || [];
    const totalCount = result.totalCount || 0;

    // Create connection edges
    const edges = events.map((event, index) => ({
      node: event,
      cursor: Buffer.from((index).toString()).toString('base64'),
    }));

    // Create page info
    const hasNextPage = totalCount > (events.length + (after ? parseInt(Buffer.from(after, 'base64').toString()) : 0));
    const hasPreviousPage = after ? parseInt(Buffer.from(after, 'base64').toString()) > 0 : false;

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: edges.length > 0 ? edges[0].cursor : null,
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
      },
      totalCount,
    };
  },

  // Analytics queries with mock data for demonstration
  overviewMetrics: async (
    _: any,
    { dateRange }: { dateRange: { startDate: string; endDate: string } },
    context: Context
  ) => {
    requireAuth(context);

    return {
      dateRange,
      totalVisitors: 1250,
      totalSessions: 2100,
      totalPageViews: 8500,
      totalEvents: 15000,
      averageSessionDuration: 245.5,
      bounceRate: 0.35,
      visitorTrend: [
        { date: dateRange.startDate, value: 50 },
        { date: dateRange.endDate, value: 75 }
      ],
      sessionTrend: [
        { date: dateRange.startDate, value: 80 },
        { date: dateRange.endDate, value: 120 }
      ],
      eventTrend: [
        { date: dateRange.startDate, value: 200 },
        { date: dateRange.endDate, value: 300 }
      ]
    };
  },

  realTimeMetrics: async (_: any, __: any, context: Context) => {
    requireAuth(context);

    return {
      timestamp: new Date().toISOString(),
      activeVisitors: 42,
      sessionsInLast30Min: 25,
      eventsInLast30Min: 150,
      sessionsToday: 340,
      eventsLastHour: 89,
      topPages: [
        {
          url: 'https://example.com/',
          title: 'Home Page',
          activeVisitors: 15,
          totalViews: 125
        }
      ],
      recentEvents: [],
      activeCountries: [
        {
          country: 'United States',
          countryCode: 'US',
          activeVisitors: 25
        }
      ]
    };
  },

  // Visualization queries
  chartData: async (
    _: any,
    { input }: { input: any },
    context: Context
  ) => {
    requireAuth(context);

    // Initialize visualization service if not already done
    if (!visualizationService) {
      visualizationService = createVisualizationService(context.analyticsService);
    }

    try {
      const dateRange = {
        start: new Date(input.dateRange.startDate),
        end: new Date(input.dateRange.endDate)
      };

      let chartData;

      switch (input.type) {
        case 'LINE':
        case 'AREA':
          if (!input.metric) {
            throw new Error('Metric is required for line/area charts');
          }
          chartData = await visualizationService.getTimeSeriesData(
            input.metric,
            dateRange,
            input.granularity?.toLowerCase() || 'day',
            input.filters
          );
          break;

        case 'PIE':
        case 'DONUT':
          if (!input.dimension || !input.metric) {
            throw new Error('Dimension and metric are required for pie/donut charts');
          }
          chartData = await visualizationService.getDistributionData(
            input.dimension,
            input.metric,
            dateRange,
            input.limit || 10,
            input.filters
          );
          break;

        case 'BAR':
          if (!input.metrics || !input.dimension) {
            throw new Error('Metrics and dimension are required for bar charts');
          }
          chartData = await visualizationService.getComparisonData(
            input.metrics,
            input.dimension,
            dateRange,
            input.filters
          );
          break;

        case 'FUNNEL':
          if (!input.steps) {
            throw new Error('Steps are required for funnel charts');
          }
          chartData = await visualizationService.getFunnelData(
            input.steps,
            dateRange,
            input.filters
          );
          break;

        default:
          throw new Error(`Unsupported chart type: ${input.type}`);
      }

      return chartData;

    } catch (error) {
      console.error('Chart data error:', error);
      throw new Error(`Failed to generate chart data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  widgetData: async (
    _: any,
    { type, config, dateRange }: { type: string; config: any; dateRange?: any },
    context: Context
  ) => {
    requireAuth(context);

    // Initialize visualization service if not already done
    if (!visualizationService) {
      visualizationService = createVisualizationService(context.analyticsService);
    }

    try {
      let parsedDateRange;
      if (dateRange) {
        parsedDateRange = {
          start: new Date(dateRange.startDate),
          end: new Date(dateRange.endDate)
        };
      }

      const widgetData = await visualizationService.getWidgetData(
        type.toLowerCase(),
        config,
        parsedDateRange
      );

      return widgetData;

    } catch (error) {
      console.error('Widget data error:', error);
      throw new Error(`Failed to generate widget data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  dashboardData: async (
    _: any,
    { widgets, dateRange }: { widgets: any[]; dateRange?: any },
    context: Context
  ) => {
    requireAuth(context);

    // Initialize visualization service if not already done
    if (!visualizationService) {
      visualizationService = createVisualizationService(context.analyticsService);
    }

    try {
      let parsedDateRange;
      if (dateRange) {
        parsedDateRange = {
          start: new Date(dateRange.startDate),
          end: new Date(dateRange.endDate)
        };
      }

      const mappedWidgets = widgets.map(widget => ({
        type: widget.type.toLowerCase(),
        config: widget.config
      }));

      const dashboardData = await visualizationService.getDashboardData(
        mappedWidgets,
        parsedDateRange
      );

      return dashboardData;

    } catch (error) {
      console.error('Dashboard data error:', error);
      throw new Error(`Failed to generate dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};
