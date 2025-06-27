import { integrationService } from '../../services/integration-service';
import { createVisualizationService } from '../../services/visualization-service';
import { Context, requireAuth } from '../context';
import { IResolvers } from '@graphql-tools/utils';
import { GraphQLContext } from '../context';

// Create visualization service instance
let visualizationService: any = null;

export const queryResolvers: IResolvers<any, GraphQLContext> = {
  Query: {
    getEvent: async (_, { id }, context) => {
      if (!context.analyticsService) {
        throw new Error('Analytics service not available');
      }
      const result = await context.analyticsService.getEventById(id);
      return result;
    },

    searchEvents: async (_, { query, filters, sort, limit, offset }, context) => {
      if (!context.analyticsService) {
        throw new Error('Analytics service not available');
      }

      const eventQuery = {
        query,
        filters,
        sort,
        limit: limit || 100,
        offset: offset || 0
      };

      const result = await context.analyticsService.queryEvents(eventQuery);
      return result;
    },

  // Event queries
  event: async (_: any, { id }: { id: string }, context: Context) => {
    requireAuth(context);

    if (!context.analyticsService) {
      throw new Error('Analytics service not available');
    }

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

    if (!context.analyticsService) {
      throw new Error('Analytics service not available');
    }

    const result = await context.analyticsService.queryEvents({
      filters: filters || {},
      limit: Math.min(first, 100), // Cap at 100
      offset: after ? parseInt(Buffer.from(after, 'base64').toString()) : 0
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
      if (!context.analyticsService) {
        throw new Error('Analytics service not available');
      }
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
        case 'COLUMN':
          if (!input.dimension || !input.metric) {
            throw new Error('Dimension and metric are required for bar/column charts');
          }
          chartData = await visualizationService.getCategoryData(
            input.dimension,
            input.metric,
            dateRange,
            input.limit || 20,
            input.filters
          );
          break;

        case 'SCATTER':
          if (!input.xMetric || !input.yMetric) {
            throw new Error('X and Y metrics are required for scatter charts');
          }
          chartData = await visualizationService.getScatterData(
            input.xMetric,
            input.yMetric,
            dateRange,
            input.limit || 100,
            input.filters
          );
          break;

        case 'HEATMAP':
          if (!input.xDimension || !input.yDimension || !input.metric) {
            throw new Error('X dimension, Y dimension, and metric are required for heatmap');
          }
          chartData = await visualizationService.getHeatmapData(
            input.xDimension,
            input.yDimension,
            input.metric,
            dateRange,
            input.filters
          );
          break;

        default:
          throw new Error(`Unsupported chart type: ${input.type}`);
      }

      return {
        success: true,
        type: input.type,
        config: input,
        data: chartData,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        type: input.type,
        config: input,
        data: null,
        error: errorMessage,
        generatedAt: new Date().toISOString()
      };
    }
  },

  dashboard: async (
    _: any,
    { input }: { input: any },
    context: Context
  ) => {
    requireAuth(context);

    // Initialize visualization service if not already done
    if (!visualizationService) {
      if (!context.analyticsService) {
        throw new Error('Analytics service not available');
      }
      visualizationService = createVisualizationService(context.analyticsService);
    }

    try {
      const dateRange = {
        start: new Date(input.dateRange.startDate),
        end: new Date(input.dateRange.endDate)
      };

      const dashboardData = await visualizationService.generateDashboard(
        input.widgets || [],
        dateRange,
        input.filters
      );

      return {
        success: true,
        config: input,
        widgets: dashboardData,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        config: input,
        widgets: [],
        error: errorMessage,
        generatedAt: new Date().toISOString()
      };
    }
  },

  exportData: async (
    _: any,
    { input }: { input: any },
    context: Context
  ) => {
    requireAuth(context);

    // Initialize visualization service if not already done
    if (!visualizationService) {
      if (!context.analyticsService) {
        throw new Error('Analytics service not available');
      }
      visualizationService = createVisualizationService(context.analyticsService);
    }

    try {
      const dateRange = {
        start: new Date(input.dateRange.startDate),
        end: new Date(input.dateRange.endDate)
      };

      const exportData = await visualizationService.exportData(
        input.type,
        input.format || 'JSON',
        dateRange,
        input.filters
      );

      return {
        success: true,
        format: input.format || 'JSON',
        data: exportData,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        format: input.format || 'JSON',
        data: null,
        error: errorMessage,
        generatedAt: new Date().toISOString()
      };
    }
  },

  // =============================================================================
  // INTEGRATION RESOLVERS
  // =============================================================================

  integrations: async (_: any, __: any, context: Context) => {
    requireAuth(context);

    try {
      const integrations = await integrationService.listIntegrations();
      return integrations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch integrations';
      throw new Error(errorMessage);
    }
  },

  integration: async (_: any, { id }: { id: string }, context: Context) => {
    requireAuth(context);

    try {
      const integration = await integrationService.getIntegration(id);
      if (!integration) {
        throw new Error('Integration not found');
      }
      return integration;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch integration';
      throw new Error(errorMessage);
    }
  },

  integrationStatus: async (_: any, { id }: { id: string }, context: Context) => {
    requireAuth(context);

    try {
      const status = await integrationService.getIntegrationStatus(id);
      return status;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch integration status';
      throw new Error(errorMessage);
    }
  },

  sdkCode: async (
    _: any,
    { platform, config }: { platform: string; config?: any },
    context: Context
  ) => {
    requireAuth(context);

    try {
      const sdkCode = await integrationService.generateSDK(platform, config);
      return sdkCode;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate SDK code';
      throw new Error(errorMessage);
    }
  },

  integrationTypes: async (_: any, __: any, context: Context) => {
    requireAuth(context);

    return [
      {
        type: 'GOOGLE_ANALYTICS',
        name: 'Google Analytics 4',
        category: 'analytics',
        description: 'Send events to Google Analytics 4 using Measurement Protocol',
        configurationSchema: {
          measurementId: { type: 'string', required: true },
          apiSecret: { type: 'string', required: true }
        }
      },
      {
        type: 'ADOBE_ANALYTICS',
        name: 'Adobe Analytics',
        category: 'analytics',
        description: 'Send events to Adobe Analytics via Data Insertion API',
        configurationSchema: {
          reportSuiteId: { type: 'string', required: true },
          trackingServer: { type: 'string', required: true }
        }
      },
      {
        type: 'MIXPANEL',
        name: 'Mixpanel',
        category: 'analytics',
        description: 'Send events to Mixpanel via Events API',
        configurationSchema: {
          projectToken: { type: 'string', required: true }
        }
      },
      {
        type: 'SEGMENT',
        name: 'Segment',
        category: 'analytics',
        description: 'Send events to Segment via Track API',
        configurationSchema: {
          writeKey: { type: 'string', required: true }
        }
      },
      {
        type: 'WEBHOOK',
        name: 'Generic Webhook',
        category: 'webhook',
        description: 'Send events to any HTTP endpoint',
        configurationSchema: {
          url: { type: 'string', required: true },
          headers: { type: 'object', required: false }
        }
      }
    ];
  },

  syncJobs: async (_: any, { integrationId, status }: any, context: Context) => {
    requireAuth(context);

    let syncJobs = integrationService.getAllSyncJobs();

    if (integrationId) {
      syncJobs = syncJobs.filter(job => job.integrationId === integrationId);
    }

    if (status) {
      syncJobs = syncJobs.filter(job => job.status === status);
    }

    return syncJobs.map(job => ({
      ...job,
      integration: integrationService.getIntegration(job.integrationId)
    }));
  },

  syncJob: async (_: any, { id }: any, context: Context) => {
    requireAuth(context);

    const syncJob = integrationService.getSyncJob(id);
    if (!syncJob) {
      throw new Error('Sync job not found');
    }

    return {
      ...syncJob,
      integration: integrationService.getIntegration(syncJob.integrationId)
    };
  }
};
