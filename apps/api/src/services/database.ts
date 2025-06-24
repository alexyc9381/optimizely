import { PrismaClient } from '../generated/prisma';

// =============================================================================
// UNIVERSAL DATABASE SERVICE
// Platform-agnostic database operations for visitor tracking and optimization
// =============================================================================

class DatabaseService {
  private static instance: DatabaseService;
  public prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    });
    
    // Handle graceful shutdown
    process.on('beforeExit', async () => {
      await this.disconnect();
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('🔌 Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log('📴 Database disconnected');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }

  // =============================================================================
  // UNIVERSAL VISITOR TRACKING METHODS
  // =============================================================================

  public async createOrUpdateVisitor(data: {
    anonymousId: string;
    platformType?: string;
    platformVersion?: string;
    userAgent?: string;
    deviceType?: string;
    browserName?: string;
    browserVersion?: string;
    operatingSystem?: string;
    ipAddress?: string;
    country?: string;
    region?: string;
    city?: string;
  }) {
    try {
      return await this.prisma.visitor.upsert({
        where: { anonymousId: data.anonymousId },
        update: {
          lastSeen: new Date(),
          platformType: data.platformType || undefined,
          platformVersion: data.platformVersion || undefined,
          userAgent: data.userAgent || undefined,
          deviceType: data.deviceType || undefined,
          browserName: data.browserName || undefined,
          browserVersion: data.browserVersion || undefined,
          operatingSystem: data.operatingSystem || undefined,
          ipAddress: data.ipAddress || undefined,
          country: data.country || undefined,
          region: data.region || undefined,
          city: data.city || undefined,
        },
        create: {
          anonymousId: data.anonymousId,
          platformType: data.platformType,
          platformVersion: data.platformVersion,
          userAgent: data.userAgent,
          deviceType: data.deviceType,
          browserName: data.browserName,
          browserVersion: data.browserVersion,
          operatingSystem: data.operatingSystem,
          ipAddress: data.ipAddress,
          country: data.country,
          region: data.region,
          city: data.city,
        },
      });
    } catch (error) {
      console.error('❌ Error creating/updating visitor:', error);
      throw error;
    }
  }

  public async createSession(data: {
    visitorId: string;
    sessionId: string;
    platformType: string;
    platformVersion?: string;
    websiteUrl: string;
    referrerUrl?: string;
    deviceType?: string;
    browserName?: string;
    operatingSystem?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }) {
    try {
      return await this.prisma.session.create({
        data: {
          visitorId: data.visitorId,
          sessionId: data.sessionId,
          platformType: data.platformType,
          platformVersion: data.platformVersion,
          websiteUrl: data.websiteUrl,
          referrerUrl: data.referrerUrl,
          deviceType: data.deviceType,
          browserName: data.browserName,
          operatingSystem: data.operatingSystem,
          utmSource: data.utmSource,
          utmMedium: data.utmMedium,
          utmCampaign: data.utmCampaign,
        },
      });
    } catch (error) {
      console.error('❌ Error creating session:', error);
      throw error;
    }
  }

  public async trackPageView(data: {
    visitorId: string;
    sessionId: string;
    url: string;
    title?: string;
    platformType: string;
    platformVersion?: string;
    referrer?: string;
    loadTime?: number;
  }) {
    try {
      const path = new URL(data.url).pathname;
      
      return await this.prisma.pageView.create({
        data: {
          visitorId: data.visitorId,
          sessionId: data.sessionId,
          url: data.url,
          path,
          title: data.title,
          platformType: data.platformType,
          platformVersion: data.platformVersion,
          referrer: data.referrer,
          loadTime: data.loadTime,
        },
      });
    } catch (error) {
      console.error('❌ Error tracking page view:', error);
      throw error;
    }
  }

  public async trackEvent(data: {
    visitorId: string;
    sessionId?: string;
    pageViewId?: string;
    eventType: string;
    eventCategory?: string;
    eventAction: string;
    eventLabel?: string;
    eventValue?: number;
    platformType: string;
    platformVersion?: string;
    properties?: any;
    elementSelector?: string;
    elementText?: string;
    elementType?: string;
  }) {
    try {
      return await this.prisma.event.create({
        data: {
          visitorId: data.visitorId,
          sessionId: data.sessionId,
          pageViewId: data.pageViewId,
          eventType: data.eventType,
          eventCategory: data.eventCategory,
          eventAction: data.eventAction,
          eventLabel: data.eventLabel,
          eventValue: data.eventValue,
          platformType: data.platformType,
          platformVersion: data.platformVersion,
          properties: data.properties,
          elementSelector: data.elementSelector,
          elementText: data.elementText,
          elementType: data.elementType,
        },
      });
    } catch (error) {
      console.error('❌ Error tracking event:', error);
      throw error;
    }
  }

  // =============================================================================
  // UNIVERSAL ANALYTICS METHODS
  // =============================================================================

  public async getVisitorAnalytics(timeframe: 'day' | 'week' | 'month' = 'day') {
    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      const [totalVisitors, totalSessions, totalPageViews, totalEvents] = await Promise.all([
        this.prisma.visitor.count({
          where: { createdAt: { gte: startDate } }
        }),
        this.prisma.session.count({
          where: { createdAt: { gte: startDate } }
        }),
        this.prisma.pageView.count({
          where: { timestamp: { gte: startDate } }
        }),
        this.prisma.event.count({
          where: { timestamp: { gte: startDate } }
        })
      ]);

      // Platform breakdown
      const platformBreakdown = await this.prisma.visitor.groupBy({
        by: ['platformType'],
        where: { 
          createdAt: { gte: startDate },
          platformType: { not: null }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      });

      return {
        timeframe,
        metrics: {
          totalVisitors,
          totalSessions,
          totalPageViews,
          totalEvents,
        },
        platformBreakdown: platformBreakdown.map(p => ({
          platform: p.platformType,
          visitors: p._count.id
        }))
      };
    } catch (error) {
      console.error('❌ Error getting visitor analytics:', error);
      throw error;
    }
  }

  // =============================================================================
  // DATABASE UTILITY METHODS
  // =============================================================================

  public async runMigrations(): Promise<void> {
    try {
      // Note: In production, use proper migration tools
      console.log('📊 Database schema is ready (Prisma-managed)');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const db = DatabaseService.getInstance();
export default DatabaseService; 