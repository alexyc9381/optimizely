import { redisManager } from './redis-client';
import { Redis } from 'ioredis';

interface BehaviorEvent {
  type: 'page_view' | 'click' | 'scroll' | 'form_interaction' | 'download' | 'video_play';
  timestamp: number;
  data: Record<string, any>;
  page?: string;
  element?: string;
}

interface VisitorSession {
  sessionId: string;
  companyId?: string;
  companyName?: string;
  ipAddress: string;
  userAgent: string;
  platform: string;
  firstSeen: number;
  lastSeen: number;
  pageViews: number;
  engagementScore: number;
  technologyStack: string[];
  behaviorData: BehaviorEvent[];
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  isB2B?: boolean;
  leadScore?: number;
}

/**
 * B2B Session Manager - Universal Visitor Tracking
 * Manages anonymous visitor sessions with company identification
 * and behavioral analytics for revenue intelligence
 */
class B2BSessionManager {
  private client: Redis;
  private readonly SESSION_TTL = 1800; // 30 minutes
  private readonly EXTENDED_TTL = 86400; // 24 hours for identified B2B visitors
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.client = redisManager.getClient();
    this.startCleanupTimer();
  }

  /**
   * Create a new visitor session
   */
  async createSession(
    sessionId: string, 
    ipAddress: string, 
    userAgent: string,
    platform: string = 'web'
  ): Promise<VisitorSession> {
    try {
      const session: VisitorSession = {
        sessionId,
        ipAddress,
        userAgent,
        platform,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        pageViews: 0,
        engagementScore: 0,
        technologyStack: [],
        behaviorData: []
      };

      const pipeline = this.client.pipeline();
      
      // Store session data
      pipeline.setex(
        `session:${sessionId}`, 
        this.SESSION_TTL, 
        JSON.stringify(session)
      );
      
      // Add to IP-based tracking for company identification
      pipeline.sadd(`ip:${ipAddress}`, sessionId);
      pipeline.expire(`ip:${ipAddress}`, this.SESSION_TTL);
      
      // Add to active sessions set for cleanup
      pipeline.zadd('sessions:active', Date.now(), sessionId);
      
      // Track session creation metrics
      pipeline.hincrby('metrics:sessions', 'total_created', 1);
      pipeline.hincrby('metrics:sessions', `platform:${platform}`, 1);
      
      await pipeline.exec();
      
      console.log(`🆔 Created new session: ${sessionId} from ${ipAddress}`);
      return session;
    } catch (error) {
      console.error('❌ Error creating session:', error);
      throw error;
    }
  }

  /**
   * Update an existing session with new data
   */
  async updateSession(
    sessionId: string, 
    updates: Partial<VisitorSession>
  ): Promise<VisitorSession | null> {
    try {
      const sessionKey = `session:${sessionId}`;
      const existingSession = await this.client.get(sessionKey);
      
      if (!existingSession) {
        console.warn(`⚠️ Session not found: ${sessionId}`);
        return null;
      }

      const session: VisitorSession = {
        ...JSON.parse(existingSession),
        ...updates,
        lastSeen: Date.now()
      };

      // Extend TTL for identified B2B visitors
      const ttl = session.companyId ? this.EXTENDED_TTL : this.SESSION_TTL;
      
      const pipeline = this.client.pipeline();
      pipeline.setex(sessionKey, ttl, JSON.stringify(session));
      
      // Update engagement tracking
      if (updates.engagementScore !== undefined) {
        pipeline.zincrby('engagement:scores', updates.engagementScore, sessionId);
      }
      
      // Update active sessions timestamp
      pipeline.zadd('sessions:active', Date.now(), sessionId);
      
      // Track B2B identification
      if (updates.companyId && !JSON.parse(existingSession).companyId) {
        pipeline.hincrby('metrics:sessions', 'b2b_identified', 1);
        pipeline.sadd('sessions:b2b', sessionId);
      }
      
      await pipeline.exec();
      
      return session;
    } catch (error) {
      console.error('❌ Error updating session:', error);
      throw error;
    }
  }

  /**
   * Add behavioral event to session
   */
  async addBehaviorEvent(
    sessionId: string, 
    event: Omit<BehaviorEvent, 'timestamp'>
  ): Promise<void> {
    try {
      const sessionKey = `session:${sessionId}`;
      const existingSession = await this.client.get(sessionKey);
      
      if (!existingSession) {
        console.warn(`⚠️ Session not found for behavior event: ${sessionId}`);
        return;
      }

      const session: VisitorSession = JSON.parse(existingSession);
      const behaviorEvent: BehaviorEvent = {
        ...event,
        timestamp: Date.now()
      };

      // Add event to behavior data (keep last 50 events)
      session.behaviorData.push(behaviorEvent);
      if (session.behaviorData.length > 50) {
        session.behaviorData = session.behaviorData.slice(-50);
      }

      // Update engagement score based on event type
      let scoreIncrease = 0;
      switch (event.type) {
        case 'page_view':
          scoreIncrease = 1;
          session.pageViews += 1;
          break;
        case 'click':
          scoreIncrease = 2;
          break;
        case 'form_interaction':
          scoreIncrease = 5;
          break;
        case 'download':
          scoreIncrease = 10;
          break;
        case 'video_play':
          scoreIncrease = 7;
          break;
        case 'scroll':
          scoreIncrease = 0.5;
          break;
      }

      session.engagementScore += scoreIncrease;
      session.lastSeen = Date.now();

      // Store updated session
      const ttl = session.companyId ? this.EXTENDED_TTL : this.SESSION_TTL;
      await this.client.setex(sessionKey, ttl, JSON.stringify(session));

      // Track behavior metrics
      const pipeline = this.client.pipeline();
      pipeline.hincrby('metrics:behavior', `event:${event.type}`, 1);
      pipeline.hincrby('metrics:behavior', 'total_events', 1);
      await pipeline.exec();

      console.log(`📊 Added ${event.type} event to session ${sessionId}`);
    } catch (error) {
      console.error('❌ Error adding behavior event:', error);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<VisitorSession | null> {
    try {
      const sessionData = await this.client.get(`session:${sessionId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('❌ Error getting session:', error);
      return null;
    }
  }

  /**
   * Get all sessions for an IP address (for company identification)
   */
  async getSessionsByIP(ipAddress: string): Promise<VisitorSession[]> {
    try {
      const sessionIds = await this.client.smembers(`ip:${ipAddress}`);
      const sessions: VisitorSession[] = [];

      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        if (session) {
          sessions.push(session);
        }
      }

      return sessions;
    } catch (error) {
      console.error('❌ Error getting sessions by IP:', error);
      return [];
    }
  }

  /**
   * Get active B2B sessions (for real-time monitoring)
   */
  async getActiveB2BSessions(limit: number = 100): Promise<VisitorSession[]> {
    try {
      const sessionIds = await this.client.srandmember('sessions:b2b', limit);
      const sessions: VisitorSession[] = [];

      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        if (session) {
          sessions.push(session);
        }
      }

      return sessions.sort((a, b) => b.lastSeen - a.lastSeen);
    } catch (error) {
      console.error('❌ Error getting active B2B sessions:', error);
      return [];
    }
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(): Promise<{
    totalSessions: number;
    b2bSessions: number;
    averageEngagement: number;
    topPlatforms: Array<{ platform: string; count: number }>;
    behaviorStats: Record<string, number>;
  }> {
    try {
      const [sessionMetrics, behaviorMetrics, activeSessions] = await Promise.all([
        this.client.hgetall('metrics:sessions'),
        this.client.hgetall('metrics:behavior'),
        this.client.zcard('sessions:active')
      ]);

      // Calculate average engagement
      const engagementScores = await this.client.zrange('engagement:scores', 0, -1, 'WITHSCORES');
      let totalEngagement = 0;
      let sessionCount = 0;

      for (let i = 1; i < engagementScores.length; i += 2) {
        totalEngagement += parseFloat(engagementScores[i]);
        sessionCount++;
      }

      const averageEngagement = sessionCount > 0 ? totalEngagement / sessionCount : 0;

      // Extract platform data
      const topPlatforms: Array<{ platform: string; count: number }> = [];
      Object.entries(sessionMetrics).forEach(([key, value]) => {
        if (key.startsWith('platform:')) {
          const platform = key.replace('platform:', '');
          topPlatforms.push({ platform, count: parseInt(value) });
        }
      });

      topPlatforms.sort((a, b) => b.count - a.count);

      return {
        totalSessions: parseInt(sessionMetrics.total_created || '0'),
        b2bSessions: parseInt(sessionMetrics.b2b_identified || '0'),
        averageEngagement,
        topPlatforms: topPlatforms.slice(0, 5),
        behaviorStats: Object.fromEntries(
          Object.entries(behaviorMetrics).map(([k, v]) => [k, parseInt(v)])
        )
      };
    } catch (error) {
      console.error('❌ Error getting session analytics:', error);
      return {
        totalSessions: 0,
        b2bSessions: 0,
        averageEngagement: 0,
        topPlatforms: [],
        behaviorStats: {}
      };
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const cutoff = Date.now() - (this.SESSION_TTL * 1000);
      const expiredSessions = await this.client.zrangebyscore(
        'sessions:active', 
        0, 
        cutoff
      );

      if (expiredSessions.length > 0) {
        const pipeline = this.client.pipeline();
        
        expiredSessions.forEach(sessionId => {
          pipeline.del(`session:${sessionId}`);
          pipeline.srem('sessions:b2b', sessionId);
          pipeline.zrem('engagement:scores', sessionId);
        });
        
        pipeline.zremrangebyscore('sessions:active', 0, cutoff);
        await pipeline.exec();
        
        console.log(`🗑️ Cleaned up ${expiredSessions.length} expired sessions`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up expired sessions:', error);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop cleanup timer
   */
  public stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}

export const sessionManager = new B2BSessionManager(); 