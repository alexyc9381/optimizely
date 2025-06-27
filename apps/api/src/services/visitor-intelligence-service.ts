import { EventEmitter } from 'events';
import { RedisManager } from './redis-client';

// Core interfaces for visitor intelligence system
export interface Visitor {
  id: string;
  sessionId: string;
  anonymousId: string;
  identifiedEmail?: string;
  companyId?: string;
  companyName?: string;
  domain?: string;
  ipAddress: string;
  userAgent: string;
  location: {
    country: string;
    region: string;
    city: string;
    timezone: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  deviceInfo: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
    screenResolution: string;
    language: string;
  };
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  referrer: string;
  landingPage: string;
  currentPage: string;
  leadScore: number;
  intentScore: number;
  engagementScore: number;
  riskScore: number;
  status: 'anonymous' | 'identified' | 'qualified' | 'converted';
  firstSeen: Date;
  lastSeen: Date;
  totalSessions: number;
  totalPageViews: number;
  totalTimeSpent: number; // in seconds
  conversionEvents: ConversionEvent[];
  behaviorProfile: BehaviorProfile;
  companyEnrichment?: CompanyEnrichment;
  journey: VisitorJourney;
}

export interface VisitorSession {
  id: string;
  visitorId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  pageViews: PageView[];
  events: VisitorEvent[];
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  referrer: string;
  landingPage: string;
  exitPage?: string;
  bounced: boolean;
  converted: boolean;
  conversionValue: number;
  deviceInfo: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
  };
}

export interface PageView {
  id: string;
  sessionId: string;
  url: string;
  title: string;
  timestamp: Date;
  timeOnPage: number; // in seconds
  scrollDepth: number; // percentage
  exitPage: boolean;
  referrer: string;
  metadata: Record<string, any>;
}

export interface VisitorEvent {
  id: string;
  visitorId: string;
  sessionId: string;
  type: 'click' | 'form_submit' | 'download' | 'video_play' | 'scroll' | 'hover' | 'search' | 'custom';
  element: string;
  value?: string;
  url: string;
  timestamp: Date;
  properties: Record<string, any>;
}

export interface ConversionEvent {
  id: string;
  visitorId: string;
  sessionId: string;
  type: 'signup' | 'demo_request' | 'contact' | 'purchase' | 'download' | 'trial' | 'subscription';
  value: number;
  currency: string;
  properties: Record<string, any>;
  timestamp: Date;
}

export interface BehaviorProfile {
  interests: string[];
  categories: string[];
  contentPreferences: string[];
  engagementPattern: 'high' | 'medium' | 'low';
  visitingFrequency: 'frequent' | 'occasional' | 'rare';
  sessionDuration: 'long' | 'medium' | 'short';
  devicePreference: 'desktop' | 'mobile' | 'mixed';
  timeOfDayPattern: string[];
  dayOfWeekPattern: string[];
  conversionProbability: number;
  churnRisk: number;
}

export interface CompanyEnrichment {
  companyId: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  revenue: number;
  employees: number;
  location: {
    country: string;
    state: string;
    city: string;
  };
  technologies: string[];
  socialProfiles: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  confidence: number;
  lastUpdated: Date;
}

export interface VisitorJourney {
  stages: JourneyStage[];
  currentStage: string;
  touchpoints: Touchpoint[];
  milestones: Milestone[];
  progressScore: number;
  estimatedConversionTime: number; // in days
  nextBestAction: string;
}

export interface JourneyStage {
  id: string;
  name: string;
  description: string;
  entryTime?: Date;
  exitTime?: Date;
  completed: boolean;
  actions: string[];
  conversion: boolean;
}

export interface Touchpoint {
  id: string;
  type: 'organic' | 'paid' | 'social' | 'email' | 'direct' | 'referral';
  source: string;
  medium: string;
  campaign?: string;
  timestamp: Date;
  impact: number;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  timestamp: Date;
  value: number;
  properties: Record<string, any>;
}

export interface VisitorFilters {
  status?: string[];
  leadScoreRange?: {
    min: number;
    max: number;
  };
  intentScoreRange?: {
    min: number;
    max: number;
  };
  countries?: string[];
  companies?: string[];
  sources?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  deviceTypes?: string[];
  conversionTypes?: string[];
}

export interface VisitorIntelligenceData {
  visitors: Visitor[];
  totalCount: number;
  filters: VisitorFilters;
  analytics: {
    totalVisitors: number;
    identifiedVisitors: number;
    qualifiedLeads: number;
    conversionRate: number;
    averageSessionDuration: number;
    bounceRate: number;
    topSources: { source: string; count: number; }[];
    topPages: { url: string; views: number; }[];
    topCountries: { country: string; count: number; }[];
    deviceBreakdown: { type: string; count: number; }[];
    hourlyActivity: { hour: number; activity: number; }[];
    dailyActivity: { date: string; visitors: number; }[];
  };
  leaderboard: {
    highestScored: Visitor[];
    mostEngaged: Visitor[];
    recentlyConverted: Visitor[];
    atRisk: Visitor[];
  };
}

export class VisitorIntelligenceService extends EventEmitter {
  constructor(private redisManager: RedisManager) {
    super();
  }

  private readonly CACHE_TTL = 60 * 3; // 3 minutes
  private readonly CACHE_KEY_PREFIX = 'visitor_intelligence';

  async getVisitorIntelligenceData(filters: VisitorFilters = {}): Promise<VisitorIntelligenceData> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:data:${JSON.stringify(filters)}`;

    try {
      const cached = await this.redisManager.getClient().get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const visitors = await this.getFilteredVisitors(filters);
      const analytics = await this.calculateAnalytics(visitors);
      const leaderboard = await this.generateLeaderboard(visitors);

      const data: VisitorIntelligenceData = {
        visitors,
        totalCount: visitors.length,
        filters,
        analytics,
        leaderboard
      };

      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Error getting visitor intelligence data:', error);
      return this.generateMockVisitorIntelligenceData(filters);
    }
  }

  async getVisitors(filters: VisitorFilters = {}): Promise<Visitor[]> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:visitors:${JSON.stringify(filters)}`;

    try {
      const cached = await this.redisManager.getClient().get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const visitors = await this.getFilteredVisitors(filters);
      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(visitors));
      return visitors;
    } catch (error) {
      console.error('Error getting visitors:', error);
      return this.generateMockVisitors(50);
    }
  }

  async getVisitorDetails(visitorId: string): Promise<Visitor | null> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:visitor:${visitorId}`;

    try {
      const cached = await this.redisManager.getClient().get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // In real implementation, fetch from database
      const visitor = await this.fetchVisitorFromDatabase(visitorId);
      if (visitor) {
        await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(visitor));
      }
      return visitor;
    } catch (error) {
      console.error('Error getting visitor details:', error);
      return this.generateMockVisitor(visitorId);
    }
  }

  async getVisitorSessions(visitorId: string): Promise<VisitorSession[]> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:sessions:${visitorId}`;

    try {
      const cached = await this.redisManager.getClient().get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const sessions = await this.fetchVisitorSessionsFromDatabase(visitorId);
      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(sessions));
      return sessions;
    } catch (error) {
      console.error('Error getting visitor sessions:', error);
      return this.generateMockSessions(visitorId, 3);
    }
  }

  async trackVisitorEvent(event: Omit<VisitorEvent, 'id'>): Promise<void> {
    try {
      const eventWithId: VisitorEvent = {
        ...event,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Store the event
      await this.storeVisitorEvent(eventWithId);

      // Update visitor scores
      await this.updateVisitorScores(event.visitorId, event.type);

      // Clear related caches
      await this.clearVisitorCaches(event.visitorId);

      // Emit event for real-time processing
      this.emit('eventTracked', eventWithId);
    } catch (error) {
      console.error('Error tracking visitor event:', error);
      throw error;
    }
  }

  async identifyVisitor(visitorId: string, email: string, additionalData?: Record<string, any>): Promise<void> {
    try {
      const visitor = await this.getVisitorDetails(visitorId);
      if (!visitor) {
        throw new Error(`Visitor ${visitorId} not found`);
      }

      // Update visitor with identification
      visitor.identifiedEmail = email;
      visitor.status = 'identified';
      visitor.lastSeen = new Date();

      // Perform company enrichment
      if (email) {
        const domain = email.split('@')[1];
        visitor.companyEnrichment = (await this.enrichCompanyData(domain)) || undefined;
        visitor.companyId = visitor.companyEnrichment?.companyId;
        visitor.companyName = visitor.companyEnrichment?.name;
        visitor.domain = domain;
      }

      // Recalculate scores with identification data
      await this.recalculateVisitorScores(visitor);

      // Update cache
      const cacheKey = `${this.CACHE_KEY_PREFIX}:visitor:${visitorId}`;
      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(visitor));

      // Clear related caches
      await this.clearVisitorCaches(visitorId);

      // Emit identification event
      this.emit('visitorIdentified', { visitorId, email, visitor });
    } catch (error) {
      console.error('Error identifying visitor:', error);
      throw error;
    }
  }

  async generateLeadReport(visitorId: string): Promise<{
    visitor: Visitor;
    sessions: VisitorSession[];
    leadInsights: {
      score: number;
      reasons: string[];
      nextActions: string[];
      risk: string;
      opportunity: string;
    };
  }> {
    try {
      const visitor = await this.getVisitorDetails(visitorId);
      if (!visitor) {
        throw new Error(`Visitor ${visitorId} not found`);
      }

      const sessions = await this.getVisitorSessions(visitorId);
      const leadInsights = await this.generateLeadInsights(visitor, sessions);

      return {
        visitor,
        sessions,
        leadInsights
      };
    } catch (error) {
      console.error('Error generating lead report:', error);
      throw error;
    }
  }

  private async getFilteredVisitors(filters: VisitorFilters): Promise<Visitor[]> {
    // In real implementation, this would query the database
    // For now, use mock data and apply filters
    let visitors = this.generateMockVisitors(100);

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      visitors = visitors.filter(visitor => filters.status!.includes(visitor.status));
    }

    if (filters.leadScoreRange) {
      visitors = visitors.filter(visitor =>
        visitor.leadScore >= filters.leadScoreRange!.min &&
        visitor.leadScore <= filters.leadScoreRange!.max
      );
    }

    if (filters.intentScoreRange) {
      visitors = visitors.filter(visitor =>
        visitor.intentScore >= filters.intentScoreRange!.min &&
        visitor.intentScore <= filters.intentScoreRange!.max
      );
    }

    if (filters.countries && filters.countries.length > 0) {
      visitors = visitors.filter(visitor => filters.countries!.includes(visitor.location.country));
    }

    if (filters.companies && filters.companies.length > 0) {
      visitors = visitors.filter(visitor =>
        visitor.companyName && filters.companies!.includes(visitor.companyName)
      );
    }

    if (filters.deviceTypes && filters.deviceTypes.length > 0) {
      visitors = visitors.filter(visitor => filters.deviceTypes!.includes(visitor.deviceInfo.type));
    }

    return visitors;
  }

  private async calculateAnalytics(visitors: Visitor[]) {
    const totalVisitors = visitors.length;
    const identifiedVisitors = visitors.filter(v => v.status !== 'anonymous').length;
    const qualifiedLeads = visitors.filter(v => v.status === 'qualified' || v.status === 'converted').length;
    const convertedVisitors = visitors.filter(v => v.status === 'converted').length;

    const conversionRate = totalVisitors > 0 ? (convertedVisitors / totalVisitors) * 100 : 0;
    const averageSessionDuration = visitors.reduce((sum, v) => sum + (v.totalTimeSpent / v.totalSessions || 0), 0) / totalVisitors || 0;
    const bounceRate = visitors.filter(v => v.totalPageViews === 1).length / totalVisitors * 100 || 0;

    // Calculate top sources
    const sourceCount: Record<string, number> = {};
    visitors.forEach(visitor => {
      const source = visitor.utm.source || 'direct';
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    });
    const topSources = Object.entries(sourceCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));

    // Calculate top pages
    const pageCount: Record<string, number> = {};
    visitors.forEach(visitor => {
      pageCount[visitor.landingPage] = (pageCount[visitor.landingPage] || 0) + visitor.totalPageViews;
    });
    const topPages = Object.entries(pageCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([url, views]) => ({ url, views }));

    // Calculate top countries
    const countryCount: Record<string, number> = {};
    visitors.forEach(visitor => {
      countryCount[visitor.location.country] = (countryCount[visitor.location.country] || 0) + 1;
    });
    const topCountries = Object.entries(countryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    // Calculate device breakdown
    const deviceCount: Record<string, number> = {};
    visitors.forEach(visitor => {
      deviceCount[visitor.deviceInfo.type] = (deviceCount[visitor.deviceInfo.type] || 0) + 1;
    });
    const deviceBreakdown = Object.entries(deviceCount)
      .map(([type, count]) => ({ type, count }));

    // Generate hourly activity (mock data)
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      activity: Math.floor(Math.random() * 100) + 20
    }));

    // Generate daily activity (mock data)
    const dailyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        visitors: Math.floor(Math.random() * 200) + 50
      };
    }).reverse();

    return {
      totalVisitors,
      identifiedVisitors,
      qualifiedLeads,
      conversionRate,
      averageSessionDuration,
      bounceRate,
      topSources,
      topPages,
      topCountries,
      deviceBreakdown,
      hourlyActivity,
      dailyActivity
    };
  }

  private async generateLeaderboard(visitors: Visitor[]) {
    return {
      highestScored: visitors
        .sort((a, b) => b.leadScore - a.leadScore)
        .slice(0, 10),
      mostEngaged: visitors
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 10),
      recentlyConverted: visitors
        .filter(v => v.status === 'converted')
        .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
        .slice(0, 10),
      atRisk: visitors
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10)
    };
  }

  private async updateVisitorScores(visitorId: string, eventType: string): Promise<void> {
    // Mock implementation - in real system, implement scoring algorithms
    console.log(`Updating scores for visitor ${visitorId} after ${eventType} event`);
  }

  private async recalculateVisitorScores(visitor: Visitor): Promise<void> {
    // Mock implementation - in real system, recalculate based on identification data
    visitor.leadScore = Math.min(100, visitor.leadScore + 15); // Boost score on identification
    visitor.intentScore = Math.min(100, visitor.intentScore + 10);
  }

  private async enrichCompanyData(domain: string): Promise<CompanyEnrichment | null> {
    // Mock implementation - in real system, call company enrichment API
    return {
      companyId: `company_${domain.replace('.', '_')}`,
      name: `${domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)} Inc`,
      domain,
      industry: 'Technology',
      size: 'Medium',
      revenue: 5000000,
      employees: 150,
      location: {
        country: 'United States',
        state: 'California',
        city: 'San Francisco'
      },
      technologies: ['React', 'Node.js', 'AWS'],
      socialProfiles: {
        linkedin: `https://linkedin.com/company/${domain.split('.')[0]}`
      },
      confidence: 0.85,
      lastUpdated: new Date()
    };
  }

  private async generateLeadInsights(visitor: Visitor, sessions: VisitorSession[]) {
    const totalValue = sessions.reduce((sum, session) => sum + session.conversionValue, 0);
    const avgSessionDuration = sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length;

    const reasons = [
      visitor.leadScore > 70 ? 'High lead score indicates strong interest' : null,
      visitor.intentScore > 60 ? 'Demonstrated purchase intent' : null,
      visitor.totalSessions > 3 ? 'Multiple return visits show engagement' : null,
      visitor.companyEnrichment ? 'Identified company provides context' : null,
      totalValue > 0 ? 'Previous conversions indicate value' : null
    ].filter(Boolean) as string[];

    const nextActions = [
      visitor.leadScore > 80 ? 'Schedule sales call immediately' : null,
      visitor.intentScore > 70 ? 'Send targeted product demo' : null,
      !visitor.identifiedEmail ? 'Deploy lead capture campaign' : null,
      avgSessionDuration > 300 ? 'Engage with personalized content' : null,
      visitor.riskScore > 60 ? 'Implement retention strategy' : null
    ].filter(Boolean) as string[];

    return {
      score: visitor.leadScore,
      reasons,
      nextActions,
      risk: visitor.riskScore > 70 ? 'High' : visitor.riskScore > 40 ? 'Medium' : 'Low',
      opportunity: visitor.leadScore > 80 ? 'High' : visitor.leadScore > 50 ? 'Medium' : 'Low'
    };
  }

  private async clearVisitorCaches(visitorId: string): Promise<void> {
    const keys = [
      `${this.CACHE_KEY_PREFIX}:visitor:${visitorId}`,
      `${this.CACHE_KEY_PREFIX}:sessions:${visitorId}`,
      `${this.CACHE_KEY_PREFIX}:data:*`,
      `${this.CACHE_KEY_PREFIX}:visitors:*`
    ];

    try {
      for (const key of keys) {
        if (key.includes('*')) {
          continue; // Handle wildcard keys separately in real implementation
        }
        await this.redisManager.getClient().del(key);
      }
    } catch (error) {
      console.error('Error clearing visitor caches:', error);
    }
  }

  // Mock data generation methods
  private async fetchVisitorFromDatabase(visitorId: string): Promise<Visitor | null> {
    return this.generateMockVisitor(visitorId);
  }

  private async fetchVisitorSessionsFromDatabase(visitorId: string): Promise<VisitorSession[]> {
    return this.generateMockSessions(visitorId, 3);
  }

  private async storeVisitorEvent(event: VisitorEvent): Promise<void> {
    console.log('Storing visitor event:', event);
  }

  private generateMockVisitorIntelligenceData(filters: VisitorFilters): VisitorIntelligenceData {
    const visitors = this.generateMockVisitors(50);

    return {
      visitors,
      totalCount: visitors.length,
      filters,
      analytics: {
        totalVisitors: 1250,
        identifiedVisitors: 387,
        qualifiedLeads: 156,
        conversionRate: 8.2,
        averageSessionDuration: 245,
        bounceRate: 42.3,
        topSources: [
          { source: 'google', count: 435 },
          { source: 'direct', count: 298 },
          { source: 'linkedin', count: 187 },
          { source: 'facebook', count: 142 },
          { source: 'twitter', count: 98 }
        ],
        topPages: [
          { url: '/pricing', views: 834 },
          { url: '/features', views: 729 },
          { url: '/demo', views: 567 },
          { url: '/contact', views: 432 },
          { url: '/blog', views: 398 }
        ],
        topCountries: [
          { country: 'United States', count: 542 },
          { country: 'United Kingdom', count: 234 },
          { country: 'Canada', count: 187 },
          { country: 'Germany', count: 145 },
          { country: 'Australia', count: 98 }
        ],
        deviceBreakdown: [
          { type: 'desktop', count: 723 },
          { type: 'mobile', count: 398 },
          { type: 'tablet', count: 129 }
        ],
        hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          activity: Math.floor(Math.random() * 100) + 20
        })),
        dailyActivity: Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return {
            date: date.toISOString().split('T')[0],
            visitors: Math.floor(Math.random() * 200) + 50
          };
        }).reverse()
      },
      leaderboard: {
        highestScored: visitors.sort((a, b) => b.leadScore - a.leadScore).slice(0, 5),
        mostEngaged: visitors.sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 5),
        recentlyConverted: visitors.filter(v => v.status === 'converted').slice(0, 5),
        atRisk: visitors.sort((a, b) => b.riskScore - a.riskScore).slice(0, 5)
      }
    };
  }

  private generateMockVisitors(count: number): Visitor[] {
    const visitors: Visitor[] = [];

    for (let i = 1; i <= count; i++) {
      visitors.push(this.generateMockVisitor(`visitor_${i}`));
    }

    return visitors;
  }

  private generateMockVisitor(visitorId: string): Visitor {
    const companies = ['TechCorp', 'DataFlow', 'CloudVision', 'InnovateLab', 'ScaleUp'];
    const countries = ['United States', 'United Kingdom', 'Canada', 'Germany', 'Australia'];
    const sources = ['google', 'direct', 'linkedin', 'facebook', 'twitter'];
    const statuses: Array<'anonymous' | 'identified' | 'qualified' | 'converted'> = ['anonymous', 'identified', 'qualified', 'converted'];
    const deviceTypes: Array<'desktop' | 'mobile' | 'tablet'> = ['desktop', 'mobile', 'tablet'];

    const isIdentified = Math.random() > 0.7;
    const company = companies[Math.floor(Math.random() * companies.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];

    return {
      id: visitorId,
      sessionId: `session_${visitorId}_${Date.now()}`,
      anonymousId: `anon_${Math.random().toString(36).substr(2, 9)}`,
      identifiedEmail: isIdentified ? `user@${company.toLowerCase()}.com` : undefined,
      companyId: isIdentified ? `company_${company.toLowerCase()}` : undefined,
      companyName: isIdentified ? `${company} Inc` : undefined,
      domain: isIdentified ? `${company.toLowerCase()}.com` : undefined,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (compatible browser)',
      location: {
        country,
        region: 'California',
        city: 'San Francisco',
        timezone: 'America/Los_Angeles'
      },
      deviceInfo: {
        type: deviceType,
        os: 'Windows 10',
        browser: 'Chrome',
        screenResolution: '1920x1080',
        language: 'en-US'
      },
      utm: {
        source,
        medium: 'cpc',
        campaign: 'q4-growth'
      },
      referrer: `https://${source}.com`,
      landingPage: '/pricing',
      currentPage: '/features',
      leadScore: Math.floor(Math.random() * 100),
      intentScore: Math.floor(Math.random() * 100),
      engagementScore: Math.floor(Math.random() * 100),
      riskScore: Math.floor(Math.random() * 100),
      status,
      firstSeen: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      lastSeen: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
      totalSessions: Math.floor(Math.random() * 10) + 1,
      totalPageViews: Math.floor(Math.random() * 50) + 1,
      totalTimeSpent: Math.floor(Math.random() * 3600) + 300,
      conversionEvents: [],
      behaviorProfile: {
        interests: ['technology', 'saas', 'productivity'],
        categories: ['software', 'business'],
        contentPreferences: ['blog', 'whitepaper', 'demo'],
        engagementPattern: Math.random() > 0.66 ? 'high' : Math.random() > 0.33 ? 'medium' : 'low',
        visitingFrequency: Math.random() > 0.66 ? 'frequent' : Math.random() > 0.33 ? 'occasional' : 'rare',
        sessionDuration: Math.random() > 0.66 ? 'long' : Math.random() > 0.33 ? 'medium' : 'short',
        devicePreference: deviceType === 'tablet' ? 'mobile' : deviceType,
        timeOfDayPattern: ['morning', 'afternoon'],
        dayOfWeekPattern: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        conversionProbability: Math.random(),
        churnRisk: Math.random()
      },
      companyEnrichment: isIdentified ? {
        companyId: `company_${company.toLowerCase()}`,
        name: `${company} Inc`,
        domain: `${company.toLowerCase()}.com`,
        industry: 'Technology',
        size: 'Medium',
        revenue: 5000000,
        employees: 150,
        location: {
          country,
          state: 'California',
          city: 'San Francisco'
        },
        technologies: ['React', 'Node.js', 'AWS'],
        socialProfiles: {
          linkedin: `https://linkedin.com/company/${company.toLowerCase()}`
        },
        confidence: 0.85,
        lastUpdated: new Date()
      } : undefined,
      journey: {
        stages: [
          {
            id: 'awareness',
            name: 'Awareness',
            description: 'Initial discovery',
            entryTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            exitTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            completed: true,
            actions: ['visited landing page'],
            conversion: false
          },
          {
            id: 'consideration',
            name: 'Consideration',
            description: 'Evaluating solution',
            entryTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            completed: status !== 'anonymous',
            actions: ['viewed pricing', 'read documentation'],
            conversion: false
          }
        ],
        currentStage: status === 'anonymous' ? 'awareness' : 'consideration',
        touchpoints: [
          {
            id: 'touchpoint_1',
            type: 'organic',
            source,
            medium: 'search',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            impact: 0.8
          }
        ],
        milestones: [],
        progressScore: Math.floor(Math.random() * 100),
        estimatedConversionTime: Math.floor(Math.random() * 30) + 1,
        nextBestAction: 'Send targeted demo invitation'
      }
    };
  }

  private generateMockSessions(visitorId: string, count: number): VisitorSession[] {
    const sessions: VisitorSession[] = [];

    for (let i = 1; i <= count; i++) {
      const startTime = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const duration = Math.floor(Math.random() * 1800) + 300; // 5-35 minutes
      const endTime = new Date(startTime.getTime() + duration * 1000);

      sessions.push({
        id: `session_${visitorId}_${i}`,
        visitorId,
        startTime,
        endTime,
        duration,
        pageViews: this.generateMockPageViews(`session_${visitorId}_${i}`, Math.floor(Math.random() * 8) + 1),
        events: [],
        utm: {
          source: 'google',
          medium: 'cpc'
        },
        referrer: 'https://google.com',
        landingPage: '/pricing',
        exitPage: '/contact',
        bounced: Math.random() < 0.3,
        converted: Math.random() < 0.1,
        conversionValue: Math.random() < 0.1 ? Math.floor(Math.random() * 1000) + 100 : 0,
        deviceInfo: {
          type: 'desktop',
          os: 'Windows 10',
          browser: 'Chrome'
        }
      });
    }

    return sessions;
  }

  private generateMockPageViews(sessionId: string, count: number): PageView[] {
    const pages = ['/pricing', '/features', '/demo', '/contact', '/blog', '/about'];
    const pageViews: PageView[] = [];

    for (let i = 1; i <= count; i++) {
      const page = pages[Math.floor(Math.random() * pages.length)];
      pageViews.push({
        id: `pageview_${sessionId}_${i}`,
        sessionId,
        url: page,
        title: `Page ${page}`,
        timestamp: new Date(Date.now() - (count - i) * 60 * 1000),
        timeOnPage: Math.floor(Math.random() * 300) + 30,
        scrollDepth: Math.floor(Math.random() * 100),
        exitPage: i === count,
        referrer: i === 1 ? 'https://google.com' : pages[Math.floor(Math.random() * pages.length)],
        metadata: {}
      });
    }

    return pageViews;
  }
}
