import { Redis } from 'ioredis';

// Core interfaces for content performance analysis
export interface ContentItem {
  id: string;
  title: string;
  type: 'blog' | 'video' | 'infographic' | 'whitepaper' | 'case-study' | 'webinar' | 'email' | 'social' | 'landing-page' | 'pdf' | 'interactive' | 'other';
  url: string;
  publishedAt: Date;
  authorId: string;
  category: string;
  tags: string[];
  wordCount?: number;
  readTime?: number; // in minutes
  metadata: {
    channelId?: string;
    campaignId?: string;
    segmentId?: string;
    language?: string;
    contentSeries?: string;
    industryTarget?: string[];
    buyerPersona?: string[];
    funnelStage?: 'awareness' | 'consideration' | 'decision' | 'retention';
  };
}

export interface ContentEngagement {
  id?: string;
  contentId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  engagementType: 'view' | 'click' | 'share' | 'download' | 'comment' | 'like' | 'scroll' | 'time-spent' | 'conversion';
  value?: number; // for time-spent (seconds), conversions (revenue), etc.
  sourceChannel: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  location: {
    country?: string;
    region?: string;
    city?: string;
  };
  referrer?: string;
  campaignSource?: string;
}

export interface ContentPerformanceMetrics {
  contentId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  engagement: {
    totalViews: number;
    uniqueViews: number;
    averageTimeSpent: number;
    bounceRate: number;
    shareCount: number;
    commentCount: number;
    downloadCount: number;
    clickThroughRate: number;
  };
  attribution: {
    totalConversions: number;
    totalRevenue: number;
    averageOrderValue: number;
    conversionRate: number;
    revenuePerView: number;
    assistedConversions: number;
    firstTouchConversions: number;
    lastTouchConversions: number;
  };
  performance: {
    contentScore: number; // 0-100
    qualityScore: number;
    relevanceScore: number;
    engagementScore: number;
    conversionScore: number;
    trendingScore: number;
  };
  benchmarks: {
    industryAverage: number;
    contentTypeAverage: number;
    channelAverage: number;
    performancePercentile: number;
  };
}

export interface ContentRecommendation {
  type: 'optimize' | 'promote' | 'retire' | 'repurpose' | 'update';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  expectedROI: number;
  actionable: boolean;
  suggestion: string;
}

export interface ContentAnalytics {
  totalContent: number;
  activeContent: number;
  topPerformingContent: ContentPerformanceMetrics[];
  lowPerformingContent: ContentPerformanceMetrics[];
  contentByType: Record<string, number>;
  contentByStage: Record<string, number>;
  averagePerformanceScore: number;
  totalRevenue: number;
  totalConversions: number;
  recommendations: ContentRecommendation[];
}

class UniversalContentPerformanceService {
  private redis: Redis;
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly ANALYTICS_TTL = 86400; // 24 hours

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  // CONTENT MANAGEMENT
  async createContent(content: Omit<ContentItem, 'id'>): Promise<string> {
    const id = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullContent: ContentItem = {
      id,
      ...content,
      metadata: {
        ...content.metadata,
        language: content.metadata.language || 'en'
      }
    };

    await this.redis.setex(
      `content:${id}`,
      30 * 24 * 60 * 60, // 30 days
      JSON.stringify(fullContent)
    );

    // Add to content index
    await this.redis.sadd('content:all', id);
    await this.redis.sadd(`content:type:${content.type}`, id);
    await this.redis.sadd(`content:category:${content.category}`, id);

    if (content.metadata.funnelStage) {
      await this.redis.sadd(`content:funnel:${content.metadata.funnelStage}`, id);
    }

    return id;
  }

  async getContent(contentId: string): Promise<ContentItem | null> {
    const data = await this.redis.get(`content:${contentId}`);
    if (!data) return null;

    const content = JSON.parse(data);
    content.publishedAt = new Date(content.publishedAt);
    return content;
  }

  async getContentList(options: {
    type?: string;
    category?: string;
    funnelStage?: string;
    authorId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ContentItem[]> {
    let contentIds: string[] = [];

    if (options.type) {
      contentIds = await this.redis.smembers(`content:type:${options.type}`);
    } else if (options.category) {
      contentIds = await this.redis.smembers(`content:category:${options.category}`);
    } else if (options.funnelStage) {
      contentIds = await this.redis.smembers(`content:funnel:${options.funnelStage}`);
    } else {
      contentIds = await this.redis.smembers('content:all');
    }

    const contents: ContentItem[] = [];
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    for (let i = offset; i < Math.min(offset + limit, contentIds.length); i++) {
      const content = await this.getContent(contentIds[i]);
      if (content && (!options.authorId || content.authorId === options.authorId)) {
        contents.push(content);
      }
    }

    return contents.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  // ENGAGEMENT TRACKING
  async trackEngagement(engagement: Omit<ContentEngagement, 'timestamp'>): Promise<string> {
    const id = `engagement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullEngagement: ContentEngagement = {
      id,
      timestamp: new Date(),
      ...engagement
    };

    // Store engagement event
    await this.redis.setex(
      `engagement:${id}`,
      90 * 24 * 60 * 60, // 90 days
      JSON.stringify(fullEngagement)
    );

    // Add to content engagement index
    await this.redis.sadd(`content:${engagement.contentId}:engagements`, id);

    // Update real-time metrics
    await this.updateRealTimeMetrics(engagement.contentId, fullEngagement);

    return id;
  }

  private async updateRealTimeMetrics(contentId: string, engagement: ContentEngagement): Promise<void> {
    const key = `metrics:realtime:${contentId}`;
    const today = new Date().toISOString().split('T')[0];

    // Update daily counters
    await this.redis.hincrby(`${key}:${today}`, `${engagement.engagementType}:count`, 1);

    if (engagement.value) {
      await this.redis.hincrbyfloat(`${key}:${today}`, `${engagement.engagementType}:value`, engagement.value);
    }

    // Update unique views if userId provided
    if (engagement.userId && engagement.engagementType === 'view') {
      await this.redis.sadd(`${key}:${today}:unique_users`, engagement.userId);
    }

    // Set expiration for daily metrics
    await this.redis.expire(`${key}:${today}`, 7 * 24 * 60 * 60); // 7 days
  }

  // PERFORMANCE CALCULATION
  async calculateContentPerformance(
    contentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ContentPerformanceMetrics | null> {
    const content = await this.getContent(contentId);
    if (!content) return null;

    const cacheKey = `performance:${contentId}:${startDate.getTime()}:${endDate.getTime()}`;

    // Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const metrics = JSON.parse(cached);
      metrics.period.startDate = new Date(metrics.period.startDate);
      metrics.period.endDate = new Date(metrics.period.endDate);
      return metrics;
    }

    // Calculate metrics
    const engagementMetrics = await this.calculateEngagementMetrics(contentId, startDate, endDate);
    const attributionMetrics = await this.calculateAttributionMetrics(contentId, startDate, endDate);
    const performanceScores = await this.calculatePerformanceScores(contentId, engagementMetrics, attributionMetrics);
    const benchmarks = await this.calculateBenchmarks(content, performanceScores.contentScore);

    const metrics: ContentPerformanceMetrics = {
      contentId,
      period: { startDate, endDate },
      engagement: engagementMetrics,
      attribution: attributionMetrics,
      performance: performanceScores,
      benchmarks
    };

    // Cache for 1 hour
    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(metrics));

    return metrics;
  }

  private async calculateEngagementMetrics(contentId: string, startDate: Date, endDate: Date) {
    const engagements = await this.getContentEngagements(contentId, startDate, endDate);

    const totalViews = engagements.filter(e => e.engagementType === 'view').length;
    const uniqueUsers = new Set(engagements.filter(e => e.userId).map(e => e.userId)).size;
    const timeSpentEvents = engagements.filter(e => e.engagementType === 'time-spent');
    const totalTimeSpent = timeSpentEvents.reduce((sum, e) => sum + (e.value || 0), 0);
    const shares = engagements.filter(e => e.engagementType === 'share').length;
    const comments = engagements.filter(e => e.engagementType === 'comment').length;
    const downloads = engagements.filter(e => e.engagementType === 'download').length;
    const clicks = engagements.filter(e => e.engagementType === 'click').length;

    // Calculate bounce rate (users who viewed but had no other engagement)
    const viewUsers = new Set(engagements.filter(e => e.engagementType === 'view' && e.userId).map(e => e.userId));
    const engagedUsers = new Set(engagements.filter(e => e.engagementType !== 'view' && e.userId).map(e => e.userId));
    const bounceRate = viewUsers.size > 0 ? (viewUsers.size - engagedUsers.size) / viewUsers.size : 0;

    return {
      totalViews,
      uniqueViews: uniqueUsers,
      averageTimeSpent: totalViews > 0 ? totalTimeSpent / totalViews : 0,
      bounceRate,
      shareCount: shares,
      commentCount: comments,
      downloadCount: downloads,
      clickThroughRate: totalViews > 0 ? clicks / totalViews : 0
    };
  }

  private async calculateAttributionMetrics(contentId: string, startDate: Date, endDate: Date) {
    const engagements = await this.getContentEngagements(contentId, startDate, endDate);
    const conversions = engagements.filter(e => e.engagementType === 'conversion');

    const totalConversions = conversions.length;
    const totalRevenue = conversions.reduce((sum, c) => sum + (c.value || 0), 0);
    const totalViews = engagements.filter(e => e.engagementType === 'view').length;

    return {
      totalConversions,
      totalRevenue,
      averageOrderValue: totalConversions > 0 ? totalRevenue / totalConversions : 0,
      conversionRate: totalViews > 0 ? totalConversions / totalViews : 0,
      revenuePerView: totalViews > 0 ? totalRevenue / totalViews : 0,
      assistedConversions: Math.floor(totalConversions * 0.3), // Simplified calculation
      firstTouchConversions: Math.floor(totalConversions * 0.4),
      lastTouchConversions: Math.floor(totalConversions * 0.6)
    };
  }

  private async calculatePerformanceScores(contentId: string, engagement: any, attribution: any) {
    // Quality score based on engagement depth
    const qualityScore = Math.min(100,
      (engagement.averageTimeSpent / 60) * 20 + // Time spent weight
      (1 - engagement.bounceRate) * 30 + // Low bounce rate weight
      (engagement.shareCount / Math.max(1, engagement.totalViews)) * 100 * 25 + // Share rate weight
      (engagement.commentCount / Math.max(1, engagement.totalViews)) * 100 * 25 // Comment rate weight
    );

    // Relevance score based on CTR and engagement
    const relevanceScore = Math.min(100,
      engagement.clickThroughRate * 100 * 40 + // CTR weight
      (engagement.downloadCount / Math.max(1, engagement.totalViews)) * 100 * 30 + // Download rate
      (engagement.uniqueViews / Math.max(1, engagement.totalViews)) * 100 * 30 // Unique view ratio
    );

    // Engagement score based on interactions
    const engagementScore = Math.min(100,
      (engagement.shareCount + engagement.commentCount) / Math.max(1, engagement.totalViews) * 100 * 50 +
      (1 - engagement.bounceRate) * 50
    );

    // Conversion score based on revenue impact
    const conversionScore = Math.min(100,
      attribution.conversionRate * 100 * 60 + // Conversion rate weight
      (attribution.revenuePerView * 1000) * 40 // Revenue per view weight (scaled)
    );

    // Trending score (simplified - would use time-series analysis in production)
    const trendingScore = Math.min(100, qualityScore * 0.4 + engagementScore * 0.6);

    // Overall content score
    const contentScore = (qualityScore * 0.25 + relevanceScore * 0.20 + engagementScore * 0.25 + conversionScore * 0.30);

    return {
      contentScore: Math.round(contentScore),
      qualityScore: Math.round(qualityScore),
      relevanceScore: Math.round(relevanceScore),
      engagementScore: Math.round(engagementScore),
      conversionScore: Math.round(conversionScore),
      trendingScore: Math.round(trendingScore)
    };
  }

  private async calculateBenchmarks(content: ContentItem, contentScore: number) {
    // In production, these would be calculated from actual data
    const industryBenchmarks = {
      'blog': 65,
      'video': 72,
      'infographic': 68,
      'whitepaper': 58,
      'case-study': 70,
      'webinar': 78,
      'email': 45,
      'social': 55,
      'landing-page': 62,
      'pdf': 50,
      'interactive': 75,
      'other': 60
    };

    const industryAverage = industryBenchmarks[content.type] || 60;
    const contentTypeAverage = industryAverage;
    const channelAverage = industryAverage * 1.1; // Slightly higher for targeted channels

    // Calculate percentile
    const performancePercentile = Math.min(100, (contentScore / industryAverage) * 50);

    return {
      industryAverage,
      contentTypeAverage,
      channelAverage,
      performancePercentile: Math.round(performancePercentile)
    };
  }

  private async getContentEngagements(contentId: string, startDate: Date, endDate: Date): Promise<ContentEngagement[]> {
    const engagementIds = await this.redis.smembers(`content:${contentId}:engagements`);
    const engagements: ContentEngagement[] = [];

    for (const id of engagementIds) {
      const data = await this.redis.get(`engagement:${id}`);
      if (data) {
        const engagement = JSON.parse(data);
        engagement.timestamp = new Date(engagement.timestamp);

        if (engagement.timestamp >= startDate && engagement.timestamp <= endDate) {
          engagements.push(engagement);
        }
      }
    }

    return engagements;
  }

  // ANALYTICS AND INSIGHTS
  async getContentAnalytics(options: {
    startDate?: Date;
    endDate?: Date;
    contentType?: string;
    category?: string;
    limit?: number;
  } = {}): Promise<ContentAnalytics> {
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = options.endDate || new Date();

    const cacheKey = `analytics:${JSON.stringify(options)}:${startDate.getTime()}:${endDate.getTime()}`;

    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const contents = await this.getContentList({
      type: options.contentType,
      category: options.category,
      limit: options.limit || 100
    });

    const performanceMetrics = await Promise.all(
      contents.map(content => this.calculateContentPerformance(content.id, startDate, endDate))
    );

    const validMetrics = performanceMetrics.filter(m => m !== null) as ContentPerformanceMetrics[];

    const analytics: ContentAnalytics = {
      totalContent: contents.length,
      activeContent: validMetrics.filter(m => m.engagement.totalViews > 0).length,
      topPerformingContent: validMetrics
        .sort((a, b) => b.performance.contentScore - a.performance.contentScore)
        .slice(0, 10),
      lowPerformingContent: validMetrics
        .sort((a, b) => a.performance.contentScore - b.performance.contentScore)
        .slice(0, 5),
      contentByType: this.aggregateByType(contents),
      contentByStage: this.aggregateByStage(contents),
      averagePerformanceScore: validMetrics.length > 0
        ? validMetrics.reduce((sum, m) => sum + m.performance.contentScore, 0) / validMetrics.length
        : 0,
      totalRevenue: validMetrics.reduce((sum, m) => sum + m.attribution.totalRevenue, 0),
      totalConversions: validMetrics.reduce((sum, m) => sum + m.attribution.totalConversions, 0),
      recommendations: await this.generateContentRecommendations(validMetrics)
    };

    // Cache for 24 hours
    await this.redis.setex(cacheKey, this.ANALYTICS_TTL, JSON.stringify(analytics));

    return analytics;
  }

  private aggregateByType(contents: ContentItem[]): Record<string, number> {
    return contents.reduce((acc, content) => {
      acc[content.type] = (acc[content.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private aggregateByStage(contents: ContentItem[]): Record<string, number> {
    return contents.reduce((acc, content) => {
      const stage = content.metadata.funnelStage || 'unknown';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private async generateContentRecommendations(metrics: ContentPerformanceMetrics[]): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];

    // Find top performers to promote
    const topPerformers = metrics
      .filter(m => m.performance.contentScore > 80 && m.engagement.totalViews < 1000)
      .slice(0, 3);

    for (const metric of topPerformers) {
      recommendations.push({
        type: 'promote',
        title: 'Promote High-Performing Content',
        description: `Content ${metric.contentId} has excellent performance scores but low visibility`,
        impact: 'high',
        effort: 'low',
        expectedROI: metric.attribution.revenuePerView * 500, // Estimated additional views
        actionable: true,
        suggestion: 'Increase marketing budget allocation and cross-promote on high-traffic channels'
      });
    }

    // Find low performers to optimize
    const lowPerformers = metrics
      .filter(m => m.performance.contentScore < 40 && m.engagement.totalViews > 100)
      .slice(0, 2);

    for (const metric of lowPerformers) {
      recommendations.push({
        type: 'optimize',
        title: 'Optimize Underperforming Content',
        description: `Content ${metric.contentId} has low engagement despite visibility`,
        impact: 'medium',
        effort: 'medium',
        expectedROI: metric.attribution.totalRevenue * 0.5, // Estimated improvement
        actionable: true,
        suggestion: 'Review content quality, update information, and improve call-to-action placement'
      });
    }

    // Find old content to update
    const outdatedContent = metrics.filter(m => {
      const daysSincePublish = (Date.now() - new Date(m.contentId).getTime()) / (1000 * 60 * 60 * 24);
      return daysSincePublish > 365 && m.performance.contentScore > 60;
    }).slice(0, 2);

    for (const metric of outdatedContent) {
      recommendations.push({
        type: 'update',
        title: 'Update Evergreen Content',
        description: `Content ${metric.contentId} is performing well but may need refreshing`,
        impact: 'medium',
        effort: 'low',
        expectedROI: metric.attribution.totalRevenue * 0.2,
        actionable: true,
        suggestion: 'Update statistics, add recent examples, and refresh design elements'
      });
    }

    return recommendations;
  }

  // HEALTH AND STATUS
  async getHealthStatus() {
    const startTime = Date.now();

    try {
      await this.redis.ping();
      const redisLatency = Date.now() - startTime;

      const totalContent = await this.redis.scard('content:all');
      const totalEngagements = await this.redis.keys('engagement:*');

      return {
        status: 'healthy',
        uptime: process.uptime(),
        contentTracking: {
          totalContent,
          totalEngagements: totalEngagements.length,
          contentTypes: await this.getContentTypeCounts(),
          activeContent: await this.getActiveContentCount()
        },
        performance: {
          averageProcessingTime: 0,
          cacheHitRate: 0.85
        },
        redis: {
          connected: true,
          latency: redisLatency
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        uptime: process.uptime(),
        contentTracking: {
          totalContent: 0,
          totalEngagements: 0,
          contentTypes: {},
          activeContent: 0
        },
        performance: {
          averageProcessingTime: 0,
          cacheHitRate: 0
        },
        redis: {
          connected: false,
          latency: -1
        }
      };
    }
  }

  private async getContentTypeCounts(): Promise<Record<string, number>> {
    const types = ['blog', 'video', 'whitepaper', 'webinar', 'email', 'landing-page'];
    const counts: Record<string, number> = {};

    for (const type of types) {
      counts[type] = await this.redis.scard(`content:type:${type}`);
    }

    return counts;
  }

  private async getActiveContentCount(): Promise<number> {
    // Content that has had engagement in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const contentIds = await this.redis.smembers('content:all');
    let activeCount = 0;

    for (const contentId of contentIds.slice(0, 100)) { // Sample for performance
      const engagements = await this.getContentEngagements(contentId, thirtyDaysAgo, new Date());
      if (engagements.length > 0) {
        activeCount++;
      }
    }

    return activeCount;
  }
}

// Export service factory
export function createUniversalContentPerformanceService(redisClient: Redis): UniversalContentPerformanceService {
  return new UniversalContentPerformanceService(redisClient);
}

export default createUniversalContentPerformanceService;
