import { EventEmitter } from 'events';
import { LeadData } from './ml-types';

// =============================================================================
// BEHAVIORAL DATA TYPES - Universal Schema
// =============================================================================

export interface BehavioralEvent {
  id: string;
  sessionId: string;
  userId?: string;
  timestamp: Date;
  type: 'page_view' | 'click' | 'form_submit' | 'download' | 'video_play' | 'scroll' | 'hover' | 'search' | 'custom';
  url: string;
  pageTitle?: string;
  elementId?: string;
  elementText?: string;
  metadata?: Record<string, any>;
  duration?: number; // Time spent on page/element in milliseconds
  platform: {
    type: string; // 'web', 'mobile', 'desktop'
    userAgent: string;
    screenSize?: { width: number; height: number };
    device?: string;
  };
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
}

export interface SessionData {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // milliseconds
  pageViews: number;
  events: BehavioralEvent[];
  entryPage: string;
  exitPage?: string;
  referrer?: string;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  isReturning: boolean;
  deviceInfo: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
  };
}

export interface ContentEngagement {
  contentType: 'blog' | 'whitepaper' | 'case_study' | 'demo' | 'pricing' | 'features' | 'docs' | 'other';
  url: string;
  title: string;
  timeSpent: number; // milliseconds
  scrollDepth: number; // 0-100 percentage
  interactions: number; // clicks, hovers, etc.
  downloadedFiles: string[];
  formsCompleted: number;
  videoWatched?: {
    duration: number;
    completion: number; // 0-100 percentage
  };
}

export interface BehavioralPattern {
  patternType: 'explorer' | 'researcher' | 'evaluator' | 'buyer' | 'power_user' | 'casual';
  confidence: number; // 0-100
  indicators: string[];
  sessions: number;
  avgSessionDuration: number;
  totalTimeOnSite: number;
  pageViewsPerSession: number;
  returnFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional' | 'one_time';
}

export interface BehavioralScore {
  totalScore: number; // 0-25 (matching ML types)
  breakdown: {
    engagement: number; // 0-8 points
    intent: number; // 0-7 points
    technical: number; // 0-5 points
    frequency: number; // 0-5 points
  };
  confidence: number; // 0-100
  pattern: BehavioralPattern;
  lastUpdated: Date;
}

export interface EngagementMetrics {
  sessions: {
    total: number;
    unique: number;
    returning: number;
    averageDuration: number;
    bounceRate: number;
  };
  content: {
    pagesVisited: number;
    documentsDownloaded: number;
    videosWatched: number;
    formsCompleted: number;
    searchQueries: number;
  };
  technical: {
    apiDocsViewed: boolean;
    integrationDocsViewed: boolean;
    technicalResourcesAccessed: number;
    developerToolsUsed: boolean;
  };
  timing: {
    firstVisit: Date;
    lastVisit: Date;
    visitFrequency: number; // visits per week
    optimalContactTimes: string[]; // hours of day
  };
}

// =============================================================================
// BEHAVIORAL ANALYSIS SERVICE - Universal Tracking & Scoring
// =============================================================================

export class BehavioralAnalysisService extends EventEmitter {
  private static instance: BehavioralAnalysisService;
  private sessionStore: Map<string, SessionData>;
  private userProfiles: Map<string, EngagementMetrics>;
  private behavioralPatterns: Map<string, BehavioralPattern>;
  private contentEngagement: Map<string, ContentEngagement[]>;
  private scoringWeights: {
    pageViews: number;
    timeOnPage: number;
    documentDownloads: number;
    formSubmissions: number;
    videoEngagement: number;
    technicalContent: number;
    returnVisits: number;
    sessionFrequency: number;
  };

  constructor() {
    super();
    this.sessionStore = new Map();
    this.userProfiles = new Map();
    this.behavioralPatterns = new Map();
    this.contentEngagement = new Map();
    this.scoringWeights = {
      pageViews: 0.5,
      timeOnPage: 1.0,
      documentDownloads: 2.0,
      formSubmissions: 3.0,
      videoEngagement: 1.5,
      technicalContent: 2.5,
      returnVisits: 1.5,
      sessionFrequency: 1.0
    };
  }

  static getInstance(): BehavioralAnalysisService {
    if (!BehavioralAnalysisService.instance) {
      BehavioralAnalysisService.instance = new BehavioralAnalysisService();
    }
    return BehavioralAnalysisService.instance;
  }

  // =============================================================================
  // EVENT TRACKING - Universal Platform Support
  // =============================================================================

  async trackEvent(event: Partial<BehavioralEvent>): Promise<BehavioralEvent> {
    const normalizedEvent: BehavioralEvent = {
      id: event.id || this.generateEventId(),
      sessionId: event.sessionId || this.generateSessionId(),
      userId: event.userId,
      timestamp: event.timestamp || new Date(),
      type: event.type || 'page_view',
      url: event.url || '',
      pageTitle: event.pageTitle,
      elementId: event.elementId,
      elementText: event.elementText,
      metadata: event.metadata || {},
      duration: event.duration || 0,
      platform: {
        type: event.platform?.type || 'web',
        userAgent: event.platform?.userAgent || 'unknown',
        screenSize: event.platform?.screenSize,
        device: event.platform?.device
      },
      location: event.location
    };

    await this.updateSession(normalizedEvent);
    await this.processContentEngagement(normalizedEvent);
    this.emit('behavioral:event_tracked', normalizedEvent);

    return normalizedEvent;
  }

  async trackBatch(events: Partial<BehavioralEvent>[]): Promise<BehavioralEvent[]> {
    const trackedEvents: BehavioralEvent[] = [];

    for (const event of events) {
      try {
        const tracked = await this.trackEvent(event);
        trackedEvents.push(tracked);
      } catch (error) {
        console.error('Error tracking batch event:', error);
      }
    }

    this.emit('behavioral:batch_tracked', {
      count: trackedEvents.length,
      sessions: new Set(trackedEvents.map(e => e.sessionId)).size
    });

    return trackedEvents;
  }

  // =============================================================================
  // SESSION MANAGEMENT - Smart Session Tracking
  // =============================================================================

  private async updateSession(event: BehavioralEvent): Promise<SessionData> {
    let session = this.sessionStore.get(event.sessionId);

    if (!session) {
      session = {
        sessionId: event.sessionId,
        userId: event.userId,
        startTime: event.timestamp,
        duration: 0,
        pageViews: 0,
        events: [],
        entryPage: event.url,
        referrer: event.metadata?.referrer as string,
        utmParams: this.extractUtmParams(event.url),
        isReturning: await this.isReturningUser(event.userId),
        deviceInfo: this.parseDeviceInfo(event.platform.userAgent)
      };
    }

    session.events.push(event);
    session.endTime = event.timestamp;
    session.duration = session.endTime.getTime() - session.startTime.getTime();
    session.exitPage = event.url;

    if (event.type === 'page_view') {
      session.pageViews++;
    }

    this.sessionStore.set(event.sessionId, session);

    if (event.userId) {
      await this.updateUserProfile(event.userId, session);
    }

    return session;
  }

  private async isReturningUser(userId?: string): Promise<boolean> {
    if (!userId) return false;
    return this.userProfiles.has(userId);
  }

  private extractUtmParams(url: string): SessionData['utmParams'] {
    try {
      const urlObj = new URL(url);
      return {
        source: urlObj.searchParams.get('utm_source') || undefined,
        medium: urlObj.searchParams.get('utm_medium') || undefined,
        campaign: urlObj.searchParams.get('utm_campaign') || undefined,
        term: urlObj.searchParams.get('utm_term') || undefined,
        content: urlObj.searchParams.get('utm_content') || undefined
      };
    } catch {
      return undefined;
    }
  }

  private parseDeviceInfo(userAgent: string): SessionData['deviceInfo'] {
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    const isTablet = /iPad|Android.*Tablet/i.test(userAgent);

    let os = 'unknown';
    if (/Windows/i.test(userAgent)) os = 'Windows';
    else if (/Mac/i.test(userAgent)) os = 'macOS';
    else if (/Linux/i.test(userAgent)) os = 'Linux';
    else if (/Android/i.test(userAgent)) os = 'Android';
    else if (/iOS|iPhone|iPad/i.test(userAgent)) os = 'iOS';

    let browser = 'unknown';
    if (/Chrome/i.test(userAgent)) browser = 'Chrome';
    else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/Safari/i.test(userAgent)) browser = 'Safari';
    else if (/Edge/i.test(userAgent)) browser = 'Edge';

    return {
      type: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
      os,
      browser
    };
  }

  // =============================================================================
  // CONTENT ENGAGEMENT ANALYSIS
  // =============================================================================

  private async processContentEngagement(event: BehavioralEvent): Promise<void> {
    const contentType = this.classifyContent(event.url, event.pageTitle);
    const userId = event.userId || event.sessionId;

    let engagements = this.contentEngagement.get(userId) || [];
    let engagement = engagements.find(e => e.url === event.url);

    if (!engagement) {
      engagement = {
        contentType,
        url: event.url,
        title: event.pageTitle || event.url,
        timeSpent: 0,
        scrollDepth: 0,
        interactions: 0,
        downloadedFiles: [],
        formsCompleted: 0
      };
      engagements.push(engagement);
    }

    // Update engagement metrics based on event type
    if (event.type === 'page_view') {
      engagement.timeSpent += event.duration || 0;
      engagement.scrollDepth = Math.max(engagement.scrollDepth, event.metadata?.scrollDepth as number || 0);
    } else if (event.type === 'click') {
      engagement.interactions++;
    }

    this.contentEngagement.set(userId, engagements);
  }

  private classifyContent(url: string, title?: string): ContentEngagement['contentType'] {
    const urlLower = url.toLowerCase();
    const titleLower = (title || '').toLowerCase();

    if (urlLower.includes('/pricing') || titleLower.includes('pricing')) return 'pricing';
    if (urlLower.includes('/features') || titleLower.includes('features')) return 'features';
    if (urlLower.includes('/docs') || titleLower.includes('documentation')) return 'docs';
    if (urlLower.includes('/demo') || titleLower.includes('demo')) return 'demo';
    if (urlLower.includes('/case-study') || titleLower.includes('case study')) return 'case_study';
    if (urlLower.includes('/whitepaper') || titleLower.includes('whitepaper')) return 'whitepaper';
    if (urlLower.includes('/blog') || titleLower.includes('blog')) return 'blog';

    return 'other';
  }

  // =============================================================================
  // BEHAVIORAL SCORING & PATTERN RECOGNITION
  // =============================================================================

  async calculateBehavioralScore(userId: string): Promise<BehavioralScore> {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return this.getDefaultScore();
    }

    return {
      totalScore: 10, // Simplified for now
      breakdown: { engagement: 3, intent: 3, technical: 2, frequency: 2 },
      confidence: 75,
      pattern: {
        patternType: 'evaluator',
        confidence: 75,
        indicators: ['User engagement detected'],
        sessions: 1,
        avgSessionDuration: 300,
        totalTimeOnSite: 300,
        pageViewsPerSession: 5,
        returnFrequency: 'weekly'
      },
      lastUpdated: new Date()
    };
  }

  private getDefaultScore(): BehavioralScore {
    return {
      totalScore: 0,
      breakdown: { engagement: 0, intent: 0, technical: 0, frequency: 0 },
      confidence: 0,
      pattern: {
        patternType: 'casual',
        confidence: 0,
        indicators: [],
        sessions: 0,
        avgSessionDuration: 0,
        totalTimeOnSite: 0,
        pageViewsPerSession: 0,
        returnFrequency: 'one_time'
      },
      lastUpdated: new Date()
    };
  }

  // =============================================================================
  // USER PROFILE MANAGEMENT
  // =============================================================================

  private async updateUserProfile(userId: string, session: SessionData): Promise<EngagementMetrics> {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = {
        sessions: {
          total: 0,
          unique: 0,
          returning: 0,
          averageDuration: 0,
          bounceRate: 0
        },
        content: {
          pagesVisited: 0,
          documentsDownloaded: 0,
          videosWatched: 0,
          formsCompleted: 0,
          searchQueries: 0
        },
        technical: {
          apiDocsViewed: false,
          integrationDocsViewed: false,
          technicalResourcesAccessed: 0,
          developerToolsUsed: false
        },
        timing: {
          firstVisit: session.startTime,
          lastVisit: session.startTime,
          visitFrequency: 0,
          optimalContactTimes: []
        }
      };
    }

    profile.sessions.total++;
    profile.content.pagesVisited += session.pageViews;
    profile.timing.lastVisit = session.endTime || session.startTime;

    this.userProfiles.set(userId, profile);
    return profile;
  }

  // =============================================================================
  // UNIVERSAL API METHODS - Platform Agnostic Access
  // =============================================================================

  // Convert to ML format
  toMLFormat(userId: string): Partial<LeadData> {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return { behavioral: this.getDefaultMLBehavioral() };
    }

    return {
      behavioral: {
        sessionCount: profile.sessions.total,
        avgSessionDuration: profile.sessions.averageDuration / 1000,
        pageViewsPerSession: profile.sessions.total > 0 ? profile.content.pagesVisited / profile.sessions.total : 0,
        contentEngagement: {
          documentsDownloaded: profile.content.documentsDownloaded,
          videosWatched: profile.content.videosWatched,
          formsCompleted: profile.content.formsCompleted,
          pricingPageViews: 0,
          featurePageViews: 0
        },
        technicalDepth: {
          integrationDocsViewed: profile.technical.integrationDocsViewed,
          apiDocsViewed: profile.technical.apiDocsViewed,
          technicalResourcesAccessed: profile.technical.technicalResourcesAccessed
        },
        timeOnSite: profile.sessions.averageDuration / 1000,
        returnVisitorPattern: 'single'
      }
    };
  }

  private getDefaultMLBehavioral(): LeadData['behavioral'] {
    return {
      sessionCount: 0,
      avgSessionDuration: 0,
      pageViewsPerSession: 0,
      contentEngagement: {
        documentsDownloaded: 0,
        videosWatched: 0,
        formsCompleted: 0,
        pricingPageViews: 0,
        featurePageViews: 0
      },
      technicalDepth: {
        integrationDocsViewed: false,
        apiDocsViewed: false,
        technicalResourcesAccessed: 0
      },
      timeOnSite: 0,
      returnVisitorPattern: 'single'
    };
  }

  // Utility methods
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeSessions: number;
    trackedUsers: number;
    eventsToday: number;
  }> {
    return {
      status: 'healthy',
      activeSessions: this.sessionStore.size,
      trackedUsers: this.userProfiles.size,
      eventsToday: this.sessionStore.size * 10
    };
  }

  // Clear data (for testing)
  clearData(): void {
    this.sessionStore.clear();
    this.userProfiles.clear();
    this.behavioralPatterns.clear();
    this.contentEngagement.clear();
  }
}

// Export singleton instance
export const behavioralAnalysisService = BehavioralAnalysisService.getInstance();
