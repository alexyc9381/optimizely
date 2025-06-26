import { Context, requireAuth } from '../context';

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
  }
};
