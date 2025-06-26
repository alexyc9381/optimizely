import { Context } from '../context';

export const typeResolvers = {
  // Event type resolvers
  Event: {
    session: async (parent: any, _: any, context: Context) => {
      // Mock session resolution - would query actual session data
      return {
        id: parent.sessionId,
        visitorId: parent.visitorId,
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        endTime: null,
        duration: null,
        pageViews: 3,
        eventCount: 5,
        userAgent: 'Mozilla/5.0...',
        referrer: 'https://google.com',
        initialUrl: 'https://example.com',
        platform: { type: 'GENERIC_WEB', version: '1.0' }
      };
    },

    visitor: async (parent: any, _: any, context: Context) => {
      // Mock visitor resolution - would query actual visitor data
      return {
        id: parent.visitorId,
        firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastSeen: new Date().toISOString(),
        totalSessions: 5,
        totalPageViews: 25,
        totalEvents: 50,
        customAttributes: {},
        tags: []
      };
    }
  },

  // Session type resolvers
  Session: {
    visitor: async (parent: any, _: any, context: Context) => {
      // Mock visitor resolution for session
      return {
        id: parent.visitorId,
        firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastSeen: new Date().toISOString(),
        totalSessions: 5,
        totalPageViews: 25,
        totalEvents: 50,
        customAttributes: {},
        tags: []
      };
    },

    events: async (
      parent: any,
      { first = 50, after, type }: { first?: number; after?: string; type?: string },
      context: Context
    ) => {
      // Mock events for session - would query actual event data
      const mockEvents = [
        {
          id: `event_1_${parent.id}`,
          type: type || 'PAGE_VIEW',
          sessionId: parent.id,
          visitorId: parent.visitorId,
          timestamp: new Date().toISOString(),
          data: { url: 'https://example.com' },
          createdAt: new Date().toISOString()
        }
      ];

      const edges = mockEvents.map((event, index) => ({
        node: event,
        cursor: Buffer.from(index.toString()).toString('base64'),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
        totalCount: mockEvents.length,
      };
    }
  },

  // Visitor type resolvers
  Visitor: {
    company: async (parent: any, _: any, context: Context) => {
      // Mock company resolution - would use IP-to-company service
      return {
        name: 'Example Corp',
        domain: 'example.com',
        industry: 'Technology',
        size: 'MEDIUM',
        confidence: 0.85,
        visitorCount: 15,
        sessionCount: 25,
        firstSeen: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastSeen: new Date().toISOString()
      };
    },

    location: async (parent: any, _: any, context: Context) => {
      // Mock location resolution - would use IP geolocation
      return {
        country: 'United States',
        countryCode: 'US',
        region: 'California',
        city: 'San Francisco',
        latitude: 37.7749,
        longitude: -122.4194
      };
    },

    technology: async (parent: any, _: any, context: Context) => {
      // Mock technology detection - would parse user agent
      return {
        browser: 'Chrome',
        os: 'macOS',
        device: 'DESKTOP',
        screenResolution: '1920x1080',
        platform: { type: 'GENERIC_WEB', version: '1.0' }
      };
    },

    sessions: async (
      parent: any,
      { first = 50, after }: { first?: number; after?: string },
      context: Context
    ) => {
      // Mock sessions for visitor
      const mockSessions = [
        {
          id: `session_1_${parent.id}`,
          visitorId: parent.id,
          startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          endTime: new Date().toISOString(),
          duration: 3600,
          pageViews: 5,
          eventCount: 12,
          userAgent: 'Mozilla/5.0...',
          referrer: 'https://google.com',
          initialUrl: 'https://example.com',
          platform: { type: 'GENERIC_WEB', version: '1.0' }
        }
      ];

      const edges = mockSessions.map((session, index) => ({
        node: session,
        cursor: Buffer.from(index.toString()).toString('base64'),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
        totalCount: mockSessions.length,
      };
    },

    events: async (
      parent: any,
      { first = 50, after, type }: { first?: number; after?: string; type?: string },
      context: Context
    ) => {
      // Mock events for visitor
      const mockEvents = [
        {
          id: `event_1_${parent.id}`,
          type: type || 'PAGE_VIEW',
          sessionId: `session_1_${parent.id}`,
          visitorId: parent.id,
          timestamp: new Date().toISOString(),
          data: { url: 'https://example.com' },
          createdAt: new Date().toISOString()
        }
      ];

      const edges = mockEvents.map((event, index) => ({
        node: event,
        cursor: Buffer.from(index.toString()).toString('base64'),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
        totalCount: mockEvents.length,
      };
    },

    recentActivity: async (
      parent: any,
      { limit = 10 }: { limit?: number },
      context: Context
    ) => {
      // Mock recent activity
      return [
        {
          id: `recent_event_${parent.id}`,
          type: 'CLICK',
          sessionId: `session_1_${parent.id}`,
          visitorId: parent.id,
          timestamp: new Date().toISOString(),
          data: { element: 'button', text: 'Subscribe' },
          createdAt: new Date().toISOString()
        }
      ];
    }
  }
};
