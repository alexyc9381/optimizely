import { EventEmitter } from 'events';

// =============================================================================
// ADVANCED BEHAVIORAL METRICS TYPES
// =============================================================================

export interface PageFlow {
  sessionId: string;
  userId?: string;
  path: string[];
  timestamps: Date[];
  durations: number[]; // time spent on each page in milliseconds
  bouncePoints: string[]; // pages where users commonly exit
  conversionPoints: string[]; // pages that lead to desired actions
  flowScore: number; // 0-100, how optimal this flow is
}

export interface ContentEngagementMetrics {
  contentId: string;
  contentType:
    | 'blog'
    | 'whitepaper'
    | 'case_study'
    | 'demo'
    | 'pricing'
    | 'features'
    | 'docs'
    | 'product'
    | 'landing';
  url: string;
  title: string;

  // Engagement depth metrics
  timeMetrics: {
    avgTimeOnPage: number;
    totalTimeSpent: number;
    readingTime: number; // estimated based on content length
    completionRate: number; // % of content consumed
  };

  // Interaction quality metrics
  interactionMetrics: {
    scrollDepth: number; // 0-100%
    clickThroughRate: number;
    shareRate: number;
    downloadRate: number;
    formCompletionRate: number;
    returnVisitRate: number;
  };

  // Content performance metrics
  performanceMetrics: {
    engagementScore: number; // 0-100 composite score
    conversionContribution: number; // how much this content contributes to conversions
    retentionImpact: number; // impact on user retention
    viralityScore: number; // social sharing potential
  };

  lastUpdated: Date;
}

export interface InteractionPattern {
  patternId: string;
  userId?: string;
  sessionId: string;

  // Pattern classification
  behaviorType:
    | 'explorer'
    | 'researcher'
    | 'evaluator'
    | 'buyer'
    | 'power_user'
    | 'casual'
    | 'technical'
    | 'business';
  intentLevel: 'low' | 'medium' | 'high' | 'purchase_ready';
  engagementStyle:
    | 'skimmer'
    | 'reader'
    | 'scanner'
    | 'methodical'
    | 'impulsive';

  // Pattern metrics
  metrics: {
    sessionDepth: number; // pages per session
    navigationSpeed: number; // pages per minute
    contentPreference: string[]; // preferred content types
    devicePreference: 'desktop' | 'mobile' | 'tablet';
    timePattern: 'morning' | 'afternoon' | 'evening' | 'night';
    dayPattern: 'weekday' | 'weekend';
  };

  // Pattern indicators
  indicators: {
    repeatVisitor: boolean;
    highIntent: boolean;
    technicalInterest: boolean;
    priceConsciousness: boolean;
    competitorComparison: boolean;
    integrationFocus: boolean;
  };

  confidence: number; // 0-100
  lastSeen: Date;
}

export interface SessionQualityMetrics {
  sessionId: string;
  userId?: string;

  // Quality indicators
  quality: {
    overall: number; // 0-100 composite quality score
    engagement: number; // depth of engagement
    intent: number; // purchase/conversion intent shown
    value: number; // business value of this session
    efficiency: number; // how efficiently user found what they needed
  };

  // Session characteristics
  characteristics: {
    duration: number;
    pageViews: number;
    uniquePages: number;
    bounceRate: number;
    conversionActions: number;
    technicalDepth: number; // level of technical content consumed
  };

  // Outcome metrics
  outcomes: {
    goalCompleted: boolean;
    conversionValue: number;
    leadQuality: 'hot' | 'warm' | 'cold' | 'unqualified';
    nextBestAction: string;
    retentionProbability: number; // 0-100
  };

  timestamp: Date;
}

export interface BehavioralAnomaly {
  anomalyId: string;
  sessionId: string;
  userId?: string;

  // Anomaly classification
  type:
    | 'unusual_navigation'
    | 'rapid_clicking'
    | 'extended_idle'
    | 'bot_behavior'
    | 'data_scraping'
    | 'security_concern'
    | 'performance_issue'
    | 'user_frustration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100

  // Anomaly details
  description: string;
  indicators: string[];
  affectedMetrics: string[];

  // Context
  context: {
    normalBehavior: Record<string, number>;
    anomalousBehavior: Record<string, number>;
    deviation: number; // standard deviations from normal
    timeWindow: string;
  };

  // Recommendations
  recommendations: {
    immediate: string[];
    longTerm: string[];
    investigation: string[];
  };

  timestamp: Date;
  resolved: boolean;
}

export interface AnalyticsReport {
  reportId: string;
  timeRange: {
    start: Date;
    end: Date;
  };

  // Summary metrics
  summary: {
    totalSessions: number;
    uniqueUsers: number;
    avgSessionQuality: number;
    conversionRate: number;
    anomaliesDetected: number;
  };

  // Detailed insights
  insights: {
    topPageFlows: PageFlow[];
    bestPerformingContent: ContentEngagementMetrics[];
    dominantPatterns: InteractionPattern[];
    qualityTrends: Array<{ date: Date; quality: number }>;
    anomalySummary: Array<{ type: string; count: number; avgSeverity: string }>;
  };

  // Recommendations
  recommendations: {
    contentOptimization: string[];
    userExperienceImprovements: string[];
    conversionOptimization: string[];
    technicalImprovements: string[];
  };

  generatedAt: Date;
}

// =============================================================================
// BEHAVIORAL METRICS ANALYTICS ENGINE
// =============================================================================

export class BehavioralMetricsAnalyticsEngine extends EventEmitter {
  private static instance: BehavioralMetricsAnalyticsEngine;

  // Data stores
  private pageFlows: Map<string, PageFlow[]>;
  private contentMetrics: Map<string, ContentEngagementMetrics>;
  private interactionPatterns: Map<string, InteractionPattern[]>;
  private sessionQualities: Map<string, SessionQualityMetrics>;
  private anomalies: Map<string, BehavioralAnomaly[]>;

  // Analytics state
  private isProcessing: boolean;
  private lastAnalysisTime: Date;
  private anomalyBaselines: Map<string, Record<string, number>>;
  private patternModels: Map<string, Record<string, unknown>>;

  constructor() {
    super();
    this.pageFlows = new Map();
    this.contentMetrics = new Map();
    this.interactionPatterns = new Map();
    this.sessionQualities = new Map();
    this.anomalies = new Map();
    this.isProcessing = false;
    this.lastAnalysisTime = new Date();
    this.anomalyBaselines = new Map();
    this.patternModels = new Map();

    this.initializeAnalytics();
  }

  static getInstance(): BehavioralMetricsAnalyticsEngine {
    if (!BehavioralMetricsAnalyticsEngine.instance) {
      BehavioralMetricsAnalyticsEngine.instance =
        new BehavioralMetricsAnalyticsEngine();
    }
    return BehavioralMetricsAnalyticsEngine.instance;
  }

  private async initializeAnalytics(): Promise<void> {
    try {
      // Initialize baseline patterns and models
      await this.loadAnalyticsModels();

      // Set up periodic analysis
      this.setupPeriodicAnalysis();

      this.emit('analytics_initialized', {
        timestamp: new Date(),
        status: 'ready',
      });
    } catch (error) {
      this.emit('analytics_error', {
        error: 'Failed to initialize analytics engine',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    }
  }

  private async loadAnalyticsModels(): Promise<void> {
    // Initialize baseline behavioral patterns
    this.anomalyBaselines.set('default', {
      avgSessionDuration: 180000, // 3 minutes
      avgPagesPerSession: 4,
      avgTimePerPage: 45000, // 45 seconds
      typicalBounceRate: 0.4,
      normalClickRate: 0.1,
    });

    // Load pattern recognition models (simplified for now)
    this.patternModels.set('behavioral_classifier', {
      explorer_threshold: 5,
      researcher_threshold: 3,
      buyer_threshold: 2,
    });
  }

  private setupPeriodicAnalysis(): void {
    // Run comprehensive analysis every 5 minutes
    setInterval(
      () => {
        this.runPeriodicAnalysis();
      },
      5 * 60 * 1000
    );

    // Run anomaly detection every minute
    setInterval(() => {
      this.detectAnomalies();
    }, 60 * 1000);
  }

  private async runPeriodicAnalysis(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    try {
      await this.updateContentEngagementMetrics();
      await this.updateInteractionPatterns();
      await this.calculateSessionQualities();

      this.lastAnalysisTime = new Date();
      this.emit('periodic_analysis_complete', {
        timestamp: new Date(),
        metrics: {
          contentItems: this.contentMetrics.size,
          patterns: Array.from(this.interactionPatterns.values()).flat().length,
          sessions: this.sessionQualities.size,
        },
      });
    } catch (error) {
      this.emit('analysis_error', {
        error: 'Periodic analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    } finally {
      this.isProcessing = false;
    }
  }

  // =============================================================================
  // PAGE FLOW ANALYSIS
  // =============================================================================

  async analyzePageFlow(
    sessionId: string,
    pageViews: Array<{ url: string; timestamp: Date; duration: number }>
  ): Promise<PageFlow> {
    try {
      const flow: PageFlow = {
        sessionId,
        path: pageViews.map(pv => pv.url),
        timestamps: pageViews.map(pv => pv.timestamp),
        durations: pageViews.map(pv => pv.duration),
        bouncePoints: [],
        conversionPoints: [],
        flowScore: 0,
      };

      // Identify bounce points (pages with high exit rate)
      flow.bouncePoints = this.identifyBouncePoints(flow.path, flow.durations);

      // Identify conversion points (pages that lead to desired actions)
      flow.conversionPoints = this.identifyConversionPoints(flow.path);

      // Calculate flow optimization score
      flow.flowScore = this.calculateFlowScore(flow);

      // Store the flow
      if (!this.pageFlows.has(sessionId)) {
        this.pageFlows.set(sessionId, []);
      }
      this.pageFlows.get(sessionId)!.push(flow);

      this.emit('page_flow_analyzed', {
        sessionId,
        flow,
        timestamp: new Date(),
      });

      return flow;
    } catch (error) {
      this.emit('analysis_error', {
        error: 'Page flow analysis failed',
        sessionId,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
      throw error;
    }
  }

  private identifyBouncePoints(path: string[], durations: number[]): string[] {
    const bouncePoints: string[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const currentPage = path[i];
      const timeSpent = durations[i];

      // Consider it a bounce point if:
      // 1. Very short time on page (< 10 seconds)
      // 2. Last page in a short session
      // 3. Common exit patterns we've seen before
      if (timeSpent < 10000 || this.isCommonExitPage(currentPage)) {
        bouncePoints.push(currentPage);
      }
    }

    return Array.from(new Set(bouncePoints)); // Remove duplicates
  }

  private identifyConversionPoints(path: string[]): string[] {
    const conversionPages = [
      '/pricing',
      '/demo',
      '/signup',
      '/contact',
      '/trial',
      '/download',
      '/subscribe',
      '/buy',
      '/purchase',
      '/checkout',
    ];

    return path.filter(page =>
      conversionPages.some(conv => page.toLowerCase().includes(conv))
    );
  }

  private calculateFlowScore(flow: PageFlow): number {
    let score = 50; // Base score

    // Positive factors
    if (flow.conversionPoints.length > 0) score += 20;
    if (flow.path.length > 3) score += 10; // Good engagement depth
    if (flow.durations.some(d => d > 60000)) score += 15; // Deep content engagement

    // Negative factors
    score -= flow.bouncePoints.length * 5;
    if (flow.path.length === 1) score -= 20; // Single page session

    return Math.max(0, Math.min(100, score));
  }

  private isCommonExitPage(page: string): boolean {
    const commonExitPages = ['/404', '/error', '/maintenance'];
    return commonExitPages.some(exit => page.includes(exit));
  }

  // Get flow patterns for analysis
  async getFlowPatterns(timeRange?: { start: Date; end: Date }): Promise<{
    commonPaths: Array<{
      path: string[];
      frequency: number;
      conversionRate: number;
    }>;
    dropOffPoints: Array<{ page: string; dropOffRate: number }>;
    conversionFunnels: Array<{ funnel: string[]; conversionRate: number }>;
  }> {
    const allFlows = Array.from(this.pageFlows.values()).flat();

    // Filter by time range if provided
    const relevantFlows = timeRange
      ? allFlows.filter(
          flow =>
            flow.timestamps[0] >= timeRange.start &&
            flow.timestamps[0] <= timeRange.end
        )
      : allFlows;

    // Analyze common paths
    const pathCounts = new Map<string, number>();
    const pathConversions = new Map<string, number>();

    relevantFlows.forEach(flow => {
      const pathKey = flow.path.join(' → ');
      pathCounts.set(pathKey, (pathCounts.get(pathKey) || 0) + 1);

      if (flow.conversionPoints.length > 0) {
        pathConversions.set(pathKey, (pathConversions.get(pathKey) || 0) + 1);
      }
    });

    const commonPaths = Array.from(pathCounts.entries())
      .map(([pathKey, frequency]) => ({
        path: pathKey.split(' → '),
        frequency,
        conversionRate: ((pathConversions.get(pathKey) || 0) / frequency) * 100,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Calculate drop-off points
    const pageVisits = new Map<string, number>();
    const pageExits = new Map<string, number>();

    relevantFlows.forEach(flow => {
      flow.path.forEach((page, index) => {
        pageVisits.set(page, (pageVisits.get(page) || 0) + 1);

        // If this is the last page or next page shows significant bounce
        if (
          index === flow.path.length - 1 ||
          flow.bouncePoints.includes(page)
        ) {
          pageExits.set(page, (pageExits.get(page) || 0) + 1);
        }
      });
    });

    const dropOffPoints = Array.from(pageVisits.entries())
      .map(([page, visits]) => ({
        page,
        dropOffRate: ((pageExits.get(page) || 0) / visits) * 100,
      }))
      .filter(point => point.dropOffRate > 20) // Only significant drop-offs
      .sort((a, b) => b.dropOffRate - a.dropOffRate);

    // Identify conversion funnels
    const conversionFunnels = this.identifyConversionFunnels(relevantFlows);

    return {
      commonPaths,
      dropOffPoints,
      conversionFunnels,
    };
  }

  private identifyConversionFunnels(
    flows: PageFlow[]
  ): Array<{ funnel: string[]; conversionRate: number }> {
    // Define potential funnel patterns
    const funnelPatterns = [
      ['/home', '/features', '/pricing', '/signup'],
      ['/blog', '/resources', '/demo', '/contact'],
      ['/landing', '/features', '/trial'],
      ['/docs', '/integration', '/contact'],
    ];

    return funnelPatterns
      .map(pattern => {
        let matchingFlows = 0;
        let conversions = 0;

        flows.forEach(flow => {
          if (this.flowMatchesPattern(flow.path, pattern)) {
            matchingFlows++;
            if (flow.conversionPoints.length > 0) {
              conversions++;
            }
          }
        });

        return {
          funnel: pattern,
          conversionRate:
            matchingFlows > 0 ? (conversions / matchingFlows) * 100 : 0,
        };
      })
      .filter(funnel => funnel.conversionRate > 0);
  }

  private flowMatchesPattern(path: string[], pattern: string[]): boolean {
    let patternIndex = 0;

    for (const page of path) {
      if (
        patternIndex < pattern.length &&
        page.includes(pattern[patternIndex])
      ) {
        patternIndex++;
      }
    }

    return patternIndex === pattern.length;
  }

  // =============================================================================
  // CONTENT ENGAGEMENT SCORING
  // =============================================================================

  async analyzeContentEngagement(
    contentId: string,
    interactions: Array<{
      userId?: string;
      sessionId: string;
      timeOnPage: number;
      scrollDepth: number;
      clicks: number;
      shares: number;
      downloads: number;
      formSubmissions: number;
      returnVisit: boolean;
    }>
  ): Promise<ContentEngagementMetrics> {
    try {
      const contentData = await this.getContentData(contentId);

      // Calculate time metrics
      const timeMetrics = this.calculateTimeMetrics(interactions, contentData);

      // Calculate interaction metrics
      const interactionMetrics = this.calculateInteractionMetrics(interactions);

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(
        interactions,
        timeMetrics,
        interactionMetrics
      );

      const engagement: ContentEngagementMetrics = {
        contentId,
        contentType: contentData.type,
        url: contentData.url,
        title: contentData.title,
        timeMetrics,
        interactionMetrics,
        performanceMetrics,
        lastUpdated: new Date(),
      };

      this.contentMetrics.set(contentId, engagement);

      this.emit('content_engagement_analyzed', {
        contentId,
        engagement,
        timestamp: new Date(),
      });

      return engagement;
    } catch (error) {
      this.emit('analysis_error', {
        error: 'Content engagement analysis failed',
        contentId,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
      throw error;
    }
  }

  private async getContentData(contentId: string): Promise<{
    type: ContentEngagementMetrics['contentType'];
    url: string;
    title: string;
    wordCount?: number;
  }> {
    // In a real implementation, this would fetch from a content management system
    // For now, we'll infer from the contentId/URL
    const mockData = {
      type: this.inferContentType(
        contentId
      ) as ContentEngagementMetrics['contentType'],
      url: contentId,
      title: this.extractTitleFromUrl(contentId),
      wordCount: 800, // Default estimate
    };

    return mockData;
  }

  private inferContentType(contentId: string): string {
    const url = contentId.toLowerCase();
    if (url.includes('/blog')) return 'blog';
    if (url.includes('/whitepaper') || url.includes('/guide'))
      return 'whitepaper';
    if (url.includes('/case-study')) return 'case_study';
    if (url.includes('/demo')) return 'demo';
    if (url.includes('/pricing')) return 'pricing';
    if (url.includes('/features')) return 'features';
    if (url.includes('/docs')) return 'docs';
    if (url.includes('/product')) return 'product';
    return 'landing';
  }

  private extractTitleFromUrl(url: string): string {
    const parts = url.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1] || 'Unknown';
    return lastPart.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private calculateTimeMetrics(
    interactions: Array<{ timeOnPage: number; returnVisit: boolean }>,
    contentData: { wordCount?: number }
  ): ContentEngagementMetrics['timeMetrics'] {
    const times = interactions.map(i => i.timeOnPage).filter(t => t > 0);

    if (times.length === 0) {
      return {
        avgTimeOnPage: 0,
        totalTimeSpent: 0,
        readingTime: contentData.wordCount
          ? (contentData.wordCount / 200) * 60000
          : 240000, // 200 words per minute
        completionRate: 0,
      };
    }

    const avgTimeOnPage =
      times.reduce((sum, time) => sum + time, 0) / times.length;
    const totalTimeSpent = times.reduce((sum, time) => sum + time, 0);
    const readingTime = contentData.wordCount
      ? (contentData.wordCount / 200) * 60000
      : 240000;
    const completionRate = Math.min(100, (avgTimeOnPage / readingTime) * 100);

    return {
      avgTimeOnPage,
      totalTimeSpent,
      readingTime,
      completionRate,
    };
  }

  private calculateInteractionMetrics(
    interactions: any[]
  ): ContentEngagementMetrics['interactionMetrics'] {
    if (interactions.length === 0) {
      return {
        scrollDepth: 0,
        clickThroughRate: 0,
        shareRate: 0,
        downloadRate: 0,
        formCompletionRate: 0,
        returnVisitRate: 0,
      };
    }

    const totalInteractions = interactions.length;
    const avgScrollDepth =
      interactions.reduce((sum, i) => sum + i.scrollDepth, 0) /
      totalInteractions;
    const clickThroughRate =
      (interactions.filter(i => i.clicks > 0).length / totalInteractions) * 100;
    const shareRate =
      (interactions.filter(i => i.shares > 0).length / totalInteractions) * 100;
    const downloadRate =
      (interactions.filter(i => i.downloads > 0).length / totalInteractions) *
      100;
    const formCompletionRate =
      (interactions.filter(i => i.formSubmissions > 0).length /
        totalInteractions) *
      100;
    const returnVisitRate =
      (interactions.filter(i => i.returnVisit).length / totalInteractions) *
      100;

    return {
      scrollDepth: avgScrollDepth,
      clickThroughRate,
      shareRate,
      downloadRate,
      formCompletionRate,
      returnVisitRate,
    };
  }

  private calculatePerformanceMetrics(
    interactions: any[],
    timeMetrics: ContentEngagementMetrics['timeMetrics'],
    interactionMetrics: ContentEngagementMetrics['interactionMetrics']
  ): ContentEngagementMetrics['performanceMetrics'] {
    // Calculate composite engagement score (0-100)
    let engagementScore = 0;
    engagementScore += Math.min(30, timeMetrics.completionRate * 0.3); // 30 points max for completion
    engagementScore += Math.min(25, interactionMetrics.scrollDepth * 0.25); // 25 points max for scroll
    engagementScore += Math.min(20, interactionMetrics.clickThroughRate * 0.2); // 20 points max for clicks
    engagementScore += Math.min(15, interactionMetrics.returnVisitRate * 0.15); // 15 points max for returns
    engagementScore += Math.min(10, interactionMetrics.shareRate * 0.1); // 10 points max for shares

    // Calculate conversion contribution (simplified)
    const conversionContribution = Math.min(
      100,
      (interactionMetrics.formCompletionRate +
        interactionMetrics.downloadRate) *
        0.5
    );

    // Calculate retention impact based on return visits and time spent
    const retentionImpact = Math.min(
      100,
      (interactionMetrics.returnVisitRate +
        timeMetrics.avgTimeOnPage / 1000 / 60) *
        0.5
    );

    // Calculate virality score based on sharing
    const viralityScore = Math.min(100, interactionMetrics.shareRate * 2);

    return {
      engagementScore: Math.round(engagementScore),
      conversionContribution: Math.round(conversionContribution),
      retentionImpact: Math.round(retentionImpact),
      viralityScore: Math.round(viralityScore),
    };
  }

  // Get top performing content
  async getTopPerformingContent(
    limit: number = 10
  ): Promise<ContentEngagementMetrics[]> {
    return Array.from(this.contentMetrics.values())
      .sort(
        (a, b) =>
          b.performanceMetrics.engagementScore -
          a.performanceMetrics.engagementScore
      )
      .slice(0, limit);
  }

  // Get content performance comparison
  async compareContentPerformance(contentIds: string[]): Promise<{
    comparison: Array<{
      contentId: string;
      metrics: ContentEngagementMetrics;
      rank: number;
    }>;
    insights: string[];
  }> {
    const contentMetrics = contentIds
      .map(id => this.contentMetrics.get(id))
      .filter(Boolean) as ContentEngagementMetrics[];

    const sorted = contentMetrics.sort(
      (a, b) =>
        b.performanceMetrics.engagementScore -
        a.performanceMetrics.engagementScore
    );

    const comparison = sorted.map((metrics, index) => ({
      contentId: metrics.contentId,
      metrics,
      rank: index + 1,
    }));

    // Generate insights
    const insights = this.generateContentInsights(comparison);

    return { comparison, insights };
  }

  private generateContentInsights(comparison: any[]): string[] {
    const insights: string[] = [];

    if (comparison.length === 0) return insights;

    const best = comparison[0];
    const worst = comparison[comparison.length - 1];

    insights.push(
      `Top performing content: "${best.metrics.title}" with ${best.metrics.performanceMetrics.engagementScore}% engagement`
    );

    if (best.metrics.performanceMetrics.engagementScore > 70) {
      insights.push(
        'Strong content engagement detected - consider replicating successful elements'
      );
    }

    if (worst.metrics.performanceMetrics.engagementScore < 30) {
      insights.push(
        `Content "${worst.metrics.title}" needs optimization - low engagement detected`
      );
    }

    const avgCompletion =
      comparison.reduce(
        (sum, c) => sum + c.metrics.timeMetrics.completionRate,
        0
      ) / comparison.length;
    if (avgCompletion < 50) {
      insights.push(
        'Content completion rates are below average - consider shorter or more engaging content'
      );
    }

    return insights;
  }

  private async updateContentEngagementMetrics(): Promise<void> {
    // This would be called periodically to refresh engagement metrics
    // Implementation would involve fetching recent interaction data and updating metrics
  }

  // =============================================================================
  // INTERACTION PATTERN RECOGNITION
  // =============================================================================

  async analyzeInteractionPattern(sessionData: {
    userId?: string;
    sessionId: string;
    pageViews: Array<{ url: string; timestamp: Date; duration: number }>;
    interactions: Array<{ type: string; timestamp: Date; elementId?: string }>;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    timeOfDay: number; // 0-23
    dayOfWeek: number; // 0-6
  }): Promise<InteractionPattern> {
    try {
      const pattern: InteractionPattern = {
        patternId: this.generatePatternId(),
        userId: sessionData.userId,
        sessionId: sessionData.sessionId,
        behaviorType: this.classifyBehaviorType(sessionData),
        intentLevel: this.assessIntentLevel(sessionData),
        engagementStyle: this.identifyEngagementStyle(sessionData),
        metrics: this.calculatePatternMetrics(sessionData),
        indicators: this.extractPatternIndicators(sessionData),
        confidence: this.calculatePatternConfidence(sessionData),
        lastSeen: new Date(),
      };

      // Store pattern
      if (!this.interactionPatterns.has(sessionData.sessionId)) {
        this.interactionPatterns.set(sessionData.sessionId, []);
      }
      this.interactionPatterns.get(sessionData.sessionId)!.push(pattern);

      this.emit('interaction_pattern_identified', {
        sessionId: sessionData.sessionId,
        pattern,
        timestamp: new Date(),
      });

      return pattern;
    } catch (error) {
      this.emit('analysis_error', {
        error: 'Interaction pattern analysis failed',
        sessionId: sessionData.sessionId,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
      throw error;
    }
  }

  private classifyBehaviorType(
    sessionData: any
  ): InteractionPattern['behaviorType'] {
    const pageCount = sessionData.pageViews.length;
    const totalDuration = sessionData.pageViews.reduce(
      (sum: number, pv: any) => sum + pv.duration,
      0
    );
    const avgTimePerPage = totalDuration / pageCount;

    // Classify based on behavior patterns
    if (pageCount >= 8 && avgTimePerPage > 60000) return 'researcher';
    if (
      pageCount >= 5 &&
      sessionData.pageViews.some((pv: any) => pv.url.includes('/docs'))
    )
      return 'technical';
    if (
      sessionData.pageViews.some(
        (pv: any) => pv.url.includes('/pricing') || pv.url.includes('/demo')
      )
    )
      return 'evaluator';
    if (
      sessionData.pageViews.some(
        (pv: any) => pv.url.includes('/signup') || pv.url.includes('/trial')
      )
    )
      return 'buyer';
    if (pageCount >= 6) return 'explorer';
    if (avgTimePerPage > 120000) return 'power_user';
    if (sessionData.pageViews.some((pv: any) => pv.url.includes('/business')))
      return 'business';
    return 'casual';
  }

  private assessIntentLevel(
    sessionData: any
  ): InteractionPattern['intentLevel'] {
    let intentScore = 0;

    // High intent indicators
    if (sessionData.pageViews.some((pv: any) => pv.url.includes('/pricing')))
      intentScore += 30;
    if (sessionData.pageViews.some((pv: any) => pv.url.includes('/demo')))
      intentScore += 25;
    if (sessionData.pageViews.some((pv: any) => pv.url.includes('/contact')))
      intentScore += 20;
    if (sessionData.pageViews.some((pv: any) => pv.url.includes('/trial')))
      intentScore += 35;
    if (sessionData.interactions.some((i: any) => i.type === 'form_submit'))
      intentScore += 40;

    // Medium intent indicators
    if (sessionData.pageViews.some((pv: any) => pv.url.includes('/features')))
      intentScore += 10;
    if (sessionData.pageViews.some((pv: any) => pv.url.includes('/case-study')))
      intentScore += 15;
    if (sessionData.pageViews.length > 5) intentScore += 10;

    if (intentScore >= 70) return 'purchase_ready';
    if (intentScore >= 40) return 'high';
    if (intentScore >= 20) return 'medium';
    return 'low';
  }

  private identifyEngagementStyle(
    sessionData: any
  ): InteractionPattern['engagementStyle'] {
    const avgTimePerPage =
      sessionData.pageViews.reduce(
        (sum: number, pv: any) => sum + pv.duration,
        0
      ) / sessionData.pageViews.length;
    const navigationSpeed =
      sessionData.pageViews.length /
      (sessionData.pageViews.reduce(
        (sum: number, pv: any) => sum + pv.duration,
        0
      ) /
        60000);

    if (avgTimePerPage > 180000) return 'methodical'; // > 3 minutes per page
    if (avgTimePerPage < 30000) return 'skimmer'; // < 30 seconds per page
    if (navigationSpeed > 3) return 'scanner'; // Fast navigation
    if (avgTimePerPage > 120000) return 'reader'; // Good reading time
    return 'impulsive';
  }

  private calculatePatternMetrics(
    sessionData: any
  ): InteractionPattern['metrics'] {
    const totalDuration = sessionData.pageViews.reduce(
      (sum: number, pv: any) => sum + pv.duration,
      0
    );

    return {
      sessionDepth: sessionData.pageViews.length,
      navigationSpeed: sessionData.pageViews.length / (totalDuration / 60000), // pages per minute
      contentPreference: this.identifyContentPreferences(sessionData.pageViews),
      devicePreference: sessionData.deviceType,
      timePattern: this.identifyTimePattern(sessionData.timeOfDay),
      dayPattern: sessionData.dayOfWeek < 5 ? 'weekday' : 'weekend',
    };
  }

  private extractPatternIndicators(
    sessionData: any
  ): InteractionPattern['indicators'] {
    return {
      repeatVisitor: Boolean(sessionData.userId), // Simplified check
      highIntent:
        this.assessIntentLevel(sessionData) === 'high' ||
        this.assessIntentLevel(sessionData) === 'purchase_ready',
      technicalInterest: sessionData.pageViews.some(
        (pv: any) => pv.url.includes('/docs') || pv.url.includes('/api')
      ),
      priceConsciousness: sessionData.pageViews.some((pv: any) =>
        pv.url.includes('/pricing')
      ),
      competitorComparison: sessionData.pageViews.some(
        (pv: any) => pv.url.includes('/compare') || pv.url.includes('/vs')
      ),
      integrationFocus: sessionData.pageViews.some(
        (pv: any) =>
          pv.url.includes('/integration') || pv.url.includes('/connect')
      ),
    };
  }

  private calculatePatternConfidence(sessionData: any): number {
    let confidence = 50; // Base confidence

    // More data = higher confidence
    if (sessionData.pageViews.length > 5) confidence += 20;
    if (sessionData.interactions.length > 3) confidence += 15;
    if (sessionData.userId) confidence += 10; // Known user

    // Clear intent signals increase confidence
    if (this.assessIntentLevel(sessionData) !== 'low') confidence += 15;

    return Math.min(100, confidence);
  }

  private identifyContentPreferences(pageViews: any[]): string[] {
    const preferences: string[] = [];

    pageViews.forEach(pv => {
      if (pv.url.includes('/blog')) preferences.push('blog');
      if (pv.url.includes('/docs')) preferences.push('documentation');
      if (pv.url.includes('/case-study')) preferences.push('case_studies');
      if (pv.url.includes('/whitepaper')) preferences.push('whitepapers');
      if (pv.url.includes('/video')) preferences.push('videos');
      if (pv.url.includes('/webinar')) preferences.push('webinars');
    });

    return Array.from(new Set(preferences));
  }

  private identifyTimePattern(
    hour: number
  ): InteractionPattern['metrics']['timePattern'] {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  private generatePatternId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async updateInteractionPatterns(): Promise<void> {
    // This would analyze recent patterns and update the pattern models
    // Implementation would involve machine learning model updates
  }

  // =============================================================================
  // SESSION QUALITY METRICS
  // =============================================================================

  async calculateSessionQuality(sessionData: {
    sessionId: string;
    userId?: string;
    duration: number;
    pageViews: Array<{ url: string; duration: number }>;
    interactions: Array<{ type: string; value?: any }>;
    conversionEvents: string[];
    exitPage: string;
  }): Promise<SessionQualityMetrics> {
    try {
      const quality = this.calculateQualityScores(sessionData);
      const characteristics = this.calculateSessionCharacteristics(sessionData);
      const outcomes = this.calculateSessionOutcomes(sessionData, quality);

      const sessionQuality: SessionQualityMetrics = {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        quality,
        characteristics,
        outcomes,
        timestamp: new Date(),
      };

      this.sessionQualities.set(sessionData.sessionId, sessionQuality);

      this.emit('session_quality_calculated', {
        sessionId: sessionData.sessionId,
        quality: sessionQuality,
        timestamp: new Date(),
      });

      return sessionQuality;
    } catch (error) {
      this.emit('analysis_error', {
        error: 'Session quality calculation failed',
        sessionId: sessionData.sessionId,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
      throw error;
    }
  }

  private calculateQualityScores(
    sessionData: any
  ): SessionQualityMetrics['quality'] {
    // Engagement score (0-100)
    let engagement = 0;
    if (sessionData.duration > 180000) engagement += 25; // > 3 min
    if (sessionData.pageViews.length > 3) engagement += 25; // multiple pages
    if (sessionData.interactions.length > 5) engagement += 25; // good interaction
    if (sessionData.pageViews.some((pv: any) => pv.duration > 60000))
      engagement += 25; // deep reading

    // Intent score (0-100)
    let intent = 0;
    if (sessionData.conversionEvents.length > 0) intent += 40;
    if (sessionData.pageViews.some((pv: any) => pv.url.includes('/pricing')))
      intent += 20;
    if (sessionData.pageViews.some((pv: any) => pv.url.includes('/demo')))
      intent += 20;
    if (sessionData.interactions.some((i: any) => i.type === 'form_submit'))
      intent += 20;

    // Value score (0-100) - business value of this session
    let value = 0;
    value += Math.min(40, engagement * 0.4);
    value += Math.min(40, intent * 0.4);
    if (sessionData.userId) value += 10; // known user
    if (sessionData.pageViews.some((pv: any) => pv.url.includes('/enterprise')))
      value += 10;

    // Efficiency score (0-100) - how efficiently user found what they needed
    let efficiency = 50; // baseline
    if (sessionData.pageViews.length < 10) efficiency += 20; // not too many pages
    if (sessionData.duration < 600000) efficiency += 15; // not too long
    if (sessionData.conversionEvents.length > 0) efficiency += 15; // achieved goal

    const overall = Math.round((engagement + intent + value + efficiency) / 4);

    return {
      overall,
      engagement: Math.round(engagement),
      intent: Math.round(intent),
      value: Math.round(value),
      efficiency: Math.round(efficiency),
    };
  }

  private calculateSessionCharacteristics(
    sessionData: any
  ): SessionQualityMetrics['characteristics'] {
    const uniquePages = new Set(sessionData.pageViews.map((pv: any) => pv.url))
      .size;
    const bounceRate = sessionData.pageViews.length === 1 ? 1 : 0;
    const technicalDepth = sessionData.pageViews.filter(
      (pv: any) =>
        pv.url.includes('/docs') ||
        pv.url.includes('/api') ||
        pv.url.includes('/integration')
    ).length;

    return {
      duration: sessionData.duration,
      pageViews: sessionData.pageViews.length,
      uniquePages,
      bounceRate,
      conversionActions: sessionData.conversionEvents.length,
      technicalDepth,
    };
  }

  private calculateSessionOutcomes(
    sessionData: any,
    quality: SessionQualityMetrics['quality']
  ): SessionQualityMetrics['outcomes'] {
    const goalCompleted = sessionData.conversionEvents.length > 0;
    const conversionValue = this.estimateConversionValue(sessionData);
    const leadQuality = this.assessLeadQuality(quality, sessionData);
    const nextBestAction = this.recommendNextAction(sessionData, quality);
    const retentionProbability = this.calculateRetentionProbability(
      quality,
      sessionData
    );

    return {
      goalCompleted,
      conversionValue,
      leadQuality,
      nextBestAction,
      retentionProbability,
    };
  }

  private estimateConversionValue(sessionData: any): number {
    let value = 0;

    if (sessionData.conversionEvents.includes('demo_request')) value += 500;
    if (sessionData.conversionEvents.includes('trial_signup')) value += 300;
    if (sessionData.conversionEvents.includes('contact_form')) value += 200;
    if (sessionData.conversionEvents.includes('whitepaper_download'))
      value += 100;
    if (sessionData.conversionEvents.includes('newsletter_signup')) value += 50;

    return value;
  }

  private assessLeadQuality(
    quality: SessionQualityMetrics['quality'],
    _sessionData: Record<string, unknown>
  ): SessionQualityMetrics['outcomes']['leadQuality'] {
    if (quality.overall > 80 && quality.intent > 70) return 'hot';
    if (quality.overall > 60 && quality.intent > 50) return 'warm';
    if (quality.overall > 40) return 'cold';
    return 'unqualified';
  }

  private recommendNextAction(
    sessionData: any,
    quality: SessionQualityMetrics['quality']
  ): string {
    if (quality.intent > 70) return 'Schedule sales call';
    if (quality.engagement > 70) return 'Send targeted content';
    if (sessionData.pageViews.some((pv: any) => pv.url.includes('/pricing')))
      return 'Provide pricing information';
    if (sessionData.pageViews.some((pv: any) => pv.url.includes('/docs')))
      return 'Offer technical consultation';
    return 'Send nurturing email sequence';
  }

  private calculateRetentionProbability(
    quality: SessionQualityMetrics['quality'],
    sessionData: any
  ): number {
    let probability = quality.overall * 0.6; // Base on overall quality

    if (sessionData.userId) probability += 20; // Known user
    if (sessionData.conversionEvents.length > 0) probability += 15;
    if (quality.engagement > 70) probability += 10;

    return Math.min(100, Math.round(probability));
  }

  private async calculateSessionQualities(): Promise<void> {
    // This would be called periodically to update session quality metrics
    // Implementation would involve analyzing recent sessions
  }

  // =============================================================================
  // BEHAVIORAL ANOMALY DETECTION
  // =============================================================================

  private async detectAnomalies(): Promise<void> {
    try {
      const recentSessions = this.getRecentSessions();
      const anomalies: BehavioralAnomaly[] = [];

      for (const session of recentSessions) {
        const sessionAnomalies = this.detectSessionAnomalies(session);
        anomalies.push(...sessionAnomalies);
      }

      // Store detected anomalies
      anomalies.forEach(anomaly => {
        if (!this.anomalies.has(anomaly.sessionId)) {
          this.anomalies.set(anomaly.sessionId, []);
        }
        this.anomalies.get(anomaly.sessionId)!.push(anomaly);
      });

      if (anomalies.length > 0) {
        this.emit('anomalies_detected', {
          count: anomalies.length,
          anomalies,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.emit('analysis_error', {
        error: 'Anomaly detection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    }
  }

  private getRecentSessions(): any[] {
    // Return recent sessions for anomaly analysis
    // In a real implementation, this would fetch from a database
    return [];
  }

  private detectSessionAnomalies(session: any): BehavioralAnomaly[] {
    const anomalies: BehavioralAnomaly[] = [];
    const baseline = this.anomalyBaselines.get('default');

    if (!baseline) return anomalies;

    // Check for unusual navigation patterns
    if (
      session.pageViews &&
      session.pageViews.length > baseline.avgPagesPerSession * 3
    ) {
      anomalies.push(
        this.createAnomaly(
          session,
          'unusual_navigation',
          'Excessive page views detected',
          ['high_page_count'],
          'medium'
        )
      );
    }

    // Check for rapid clicking (potential bot)
    if (
      session.interactions &&
      this.detectRapidClicking(session.interactions)
    ) {
      anomalies.push(
        this.createAnomaly(
          session,
          'rapid_clicking',
          'Rapid clicking pattern detected',
          ['bot_like_behavior'],
          'high'
        )
      );
    }

    // Check for extended idle time
    if (session.duration > baseline.avgSessionDuration * 5) {
      anomalies.push(
        this.createAnomaly(
          session,
          'extended_idle',
          'Unusually long session duration',
          ['extended_session'],
          'low'
        )
      );
    }

    return anomalies;
  }

  private detectRapidClicking(interactions: any[]): boolean {
    const clickEvents = interactions.filter(i => i.type === 'click');
    if (clickEvents.length < 5) return false;

    // Check for clicks happening too quickly (< 100ms apart)
    for (let i = 1; i < clickEvents.length; i++) {
      const timeDiff =
        new Date(clickEvents[i].timestamp).getTime() -
        new Date(clickEvents[i - 1].timestamp).getTime();
      if (timeDiff < 100) return true;
    }

    return false;
  }

  private createAnomaly(
    session: any,
    type: BehavioralAnomaly['type'],
    description: string,
    indicators: string[],
    severity: BehavioralAnomaly['severity']
  ): BehavioralAnomaly {
    return {
      anomalyId: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: session.sessionId,
      userId: session.userId,
      type,
      severity,
      confidence: 80, // Default confidence
      description,
      indicators,
      affectedMetrics: ['session_quality', 'user_behavior'],
      context: {
        normalBehavior: this.anomalyBaselines.get('default') || {},
        anomalousBehavior: this.extractSessionMetrics(session),
        deviation: 2.5,
        timeWindow: '1hour',
      },
      recommendations: {
        immediate: ['Monitor session', 'Check for bot activity'],
        longTerm: ['Update anomaly detection models'],
        investigation: ['Analyze user agent', 'Check IP reputation'],
      },
      timestamp: new Date(),
      resolved: false,
    };
  }

  private extractSessionMetrics(session: any): Record<string, number> {
    return {
      duration: session.duration || 0,
      pageViews: session.pageViews?.length || 0,
      interactions: session.interactions?.length || 0,
    };
  }

  // =============================================================================
  // ANALYTICS REPORTING
  // =============================================================================

  async generateAnalyticsReport(timeRange: {
    start: Date;
    end: Date;
  }): Promise<AnalyticsReport> {
    try {
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Gather summary metrics
      const summary = await this.calculateSummaryMetrics(timeRange);

      // Gather detailed insights
      const insights = await this.gatherDetailedInsights(timeRange);

      // Generate recommendations
      const recommendations = this.generateRecommendations(summary, insights);

      const report: AnalyticsReport = {
        reportId,
        timeRange,
        summary,
        insights,
        recommendations,
        generatedAt: new Date(),
      };

      this.emit('analytics_report_generated', {
        reportId,
        timeRange,
        timestamp: new Date(),
      });

      return report;
    } catch (error) {
      this.emit('analysis_error', {
        error: 'Analytics report generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
      throw error;
    }
  }

  private async calculateSummaryMetrics(timeRange: {
    start: Date;
    end: Date;
  }): Promise<AnalyticsReport['summary']> {
    const flows = Array.from(this.pageFlows.values())
      .flat()
      .filter(
        flow =>
          flow.timestamps[0] >= timeRange.start &&
          flow.timestamps[0] <= timeRange.end
      );

    const sessions = Array.from(this.sessionQualities.values()).filter(
      session =>
        session.timestamp >= timeRange.start &&
        session.timestamp <= timeRange.end
    );

    const anomalies = Array.from(this.anomalies.values())
      .flat()
      .filter(
        anomaly =>
          anomaly.timestamp >= timeRange.start &&
          anomaly.timestamp <= timeRange.end
      );

    const uniqueUsers = new Set([
      ...flows.map(f => f.userId).filter(Boolean),
      ...sessions.map(s => s.userId).filter(Boolean),
    ]).size;

    const avgSessionQuality =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.quality.overall, 0) /
          sessions.length
        : 0;

    const conversionRate =
      sessions.length > 0
        ? (sessions.filter(s => s.outcomes.goalCompleted).length /
            sessions.length) *
          100
        : 0;

    return {
      totalSessions: sessions.length,
      uniqueUsers,
      avgSessionQuality: Math.round(avgSessionQuality),
      conversionRate: Math.round(conversionRate * 100) / 100,
      anomaliesDetected: anomalies.length,
    };
  }

  private async gatherDetailedInsights(timeRange: {
    start: Date;
    end: Date;
  }): Promise<AnalyticsReport['insights']> {
    // Get top page flows
    await this.getFlowPatterns(timeRange); // Update internal flow patterns
    const topPageFlows = Array.from(this.pageFlows.values())
      .flat()
      .filter(
        flow =>
          flow.timestamps[0] >= timeRange.start &&
          flow.timestamps[0] <= timeRange.end
      )
      .sort((a, b) => b.flowScore - a.flowScore)
      .slice(0, 5);

    // Get best performing content
    const bestPerformingContent = await this.getTopPerformingContent(5);

    // Get dominant interaction patterns
    const allPatterns = Array.from(this.interactionPatterns.values())
      .flat()
      .filter(
        pattern =>
          pattern.lastSeen >= timeRange.start &&
          pattern.lastSeen <= timeRange.end
      );

    const patternCounts = new Map<string, number>();
    allPatterns.forEach(pattern => {
      const key = `${pattern.behaviorType}_${pattern.intentLevel}`;
      patternCounts.set(key, (patternCounts.get(key) || 0) + 1);
    });

    const dominantPatterns = Array.from(patternCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(
        ([key]) =>
          allPatterns.find(p => `${p.behaviorType}_${p.intentLevel}` === key)!
      )
      .filter(Boolean);

    // Calculate quality trends (simplified)
    const qualityTrends = this.calculateQualityTrends(timeRange);

    // Summarize anomalies
    const anomalySummary = this.summarizeAnomalies(timeRange);

    return {
      topPageFlows,
      bestPerformingContent,
      dominantPatterns,
      qualityTrends,
      anomalySummary,
    };
  }

  private calculateQualityTrends(timeRange: {
    start: Date;
    end: Date;
  }): Array<{ date: Date; quality: number }> {
    // Simplified implementation - in real use, this would calculate daily averages
    const sessions = Array.from(this.sessionQualities.values()).filter(
      session =>
        session.timestamp >= timeRange.start &&
        session.timestamp <= timeRange.end
    );

    if (sessions.length === 0) return [];

    // Group by day and calculate average quality
    const dailyQuality = new Map<string, { total: number; count: number }>();

    sessions.forEach(session => {
      const dateKey = session.timestamp.toISOString().split('T')[0];
      const existing = dailyQuality.get(dateKey) || { total: 0, count: 0 };
      dailyQuality.set(dateKey, {
        total: existing.total + session.quality.overall,
        count: existing.count + 1,
      });
    });

    return Array.from(dailyQuality.entries())
      .map(([dateKey, data]) => ({
        date: new Date(dateKey),
        quality: Math.round(data.total / data.count),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private summarizeAnomalies(timeRange: {
    start: Date;
    end: Date;
  }): Array<{ type: string; count: number; avgSeverity: string }> {
    const anomalies = Array.from(this.anomalies.values())
      .flat()
      .filter(
        anomaly =>
          anomaly.timestamp >= timeRange.start &&
          anomaly.timestamp <= timeRange.end
      );

    const typeCounts = new Map<
      string,
      { count: number; severities: string[] }
    >();

    anomalies.forEach(anomaly => {
      const existing = typeCounts.get(anomaly.type) || {
        count: 0,
        severities: [],
      };
      typeCounts.set(anomaly.type, {
        count: existing.count + 1,
        severities: [...existing.severities, anomaly.severity],
      });
    });

    return Array.from(typeCounts.entries())
      .map(([type, data]) => {
        // Calculate average severity (simplified)
        const severityScores = data.severities.map(s => {
          switch (s) {
            case 'critical':
              return 4;
            case 'high':
              return 3;
            case 'medium':
              return 2;
            case 'low':
              return 1;
            default:
              return 1;
          }
        });
        const avgScore =
          severityScores.reduce((sum, score) => sum + score, 0) /
          severityScores.length;

        let avgSeverity = 'low';
        if (avgScore >= 3.5) avgSeverity = 'critical';
        else if (avgScore >= 2.5) avgSeverity = 'high';
        else if (avgScore >= 1.5) avgSeverity = 'medium';

        return {
          type,
          count: data.count,
          avgSeverity,
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  private generateRecommendations(
    summary: AnalyticsReport['summary'],
    insights: AnalyticsReport['insights']
  ): AnalyticsReport['recommendations'] {
    const recommendations: AnalyticsReport['recommendations'] = {
      contentOptimization: [],
      userExperienceImprovements: [],
      conversionOptimization: [],
      technicalImprovements: [],
    };

    // Content optimization recommendations
    if (insights.bestPerformingContent.length > 0) {
      const topContent = insights.bestPerformingContent[0];
      if (topContent.performanceMetrics.engagementScore > 80) {
        recommendations.contentOptimization.push(
          `Replicate successful elements from "${topContent.title}" in other content`
        );
      }
    }

    const lowPerformingContent = Array.from(
      this.contentMetrics.values()
    ).filter(content => content.performanceMetrics.engagementScore < 40);
    if (lowPerformingContent.length > 0) {
      recommendations.contentOptimization.push(
        `Optimize ${lowPerformingContent.length} low-performing content pieces`
      );
    }

    // User experience improvements
    if (summary.avgSessionQuality < 60) {
      recommendations.userExperienceImprovements.push(
        'Overall session quality is below average - focus on user experience improvements'
      );
    }

    if (insights.topPageFlows.length > 0) {
      const bounceProneFlows = insights.topPageFlows.filter(
        flow => flow.bouncePoints.length > 2
      );
      if (bounceProneFlows.length > 0) {
        recommendations.userExperienceImprovements.push(
          'Optimize high bounce-rate pages to improve user retention'
        );
      }
    }

    // Conversion optimization
    if (summary.conversionRate < 3) {
      recommendations.conversionOptimization.push(
        'Conversion rate is below industry average - implement conversion optimization strategies'
      );
    }

    const evaluatorPatterns = insights.dominantPatterns.filter(
      p => p.behaviorType === 'evaluator'
    );
    if (evaluatorPatterns.length > 0) {
      recommendations.conversionOptimization.push(
        'High evaluator activity detected - provide more comparison resources and trial opportunities'
      );
    }

    // Technical improvements
    if (summary.anomaliesDetected > 10) {
      recommendations.technicalImprovements.push(
        'High anomaly count detected - investigate potential technical issues or bot activity'
      );
    }

    const botAnomalies = insights.anomalySummary.filter(
      a => a.type.includes('bot') || a.type.includes('rapid')
    );
    if (botAnomalies.length > 0) {
      recommendations.technicalImprovements.push(
        'Implement bot detection and protection measures'
      );
    }

    return recommendations;
  }

  // =============================================================================
  // HEALTH MONITORING & UTILITIES
  // =============================================================================

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: {
      activeFlows: number;
      contentItems: number;
      patterns: number;
      sessions: number;
      anomalies: number;
    };
    issues: string[];
    lastAnalysis: Date;
  }> {
    const metrics = {
      activeFlows: Array.from(this.pageFlows.values()).flat().length,
      contentItems: this.contentMetrics.size,
      patterns: Array.from(this.interactionPatterns.values()).flat().length,
      sessions: this.sessionQualities.size,
      anomalies: Array.from(this.anomalies.values()).flat().length,
    };

    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check for issues
    if (
      this.isProcessing &&
      Date.now() - this.lastAnalysisTime.getTime() > 600000
    ) {
      // 10 minutes
      issues.push('Analysis appears stuck - last update over 10 minutes ago');
      status = 'degraded';
    }

    if (metrics.anomalies > 100) {
      issues.push('High anomaly count detected');
      status = 'degraded';
    }

    if (metrics.activeFlows === 0 && metrics.sessions === 0) {
      issues.push('No recent activity detected');
      status = 'unhealthy';
    }

    return {
      status,
      metrics,
      issues,
      lastAnalysis: this.lastAnalysisTime,
    };
  }

  // Clear all analytics data (for testing/development)
  clearAnalyticsData(): void {
    this.pageFlows.clear();
    this.contentMetrics.clear();
    this.interactionPatterns.clear();
    this.sessionQualities.clear();
    this.anomalies.clear();
    this.anomalyBaselines.clear();
    this.patternModels.clear();

    this.emit('analytics_data_cleared', {
      timestamp: new Date(),
    });
  }

  // Get analytics summary for dashboard
  async getAnalyticsSummary(): Promise<{
    totalSessions: number;
    avgSessionQuality: number;
    topContent: string[];
    recentAnomalies: number;
    dominantBehaviors: string[];
  }> {
    const sessions = Array.from(this.sessionQualities.values());
    const avgQuality =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.quality.overall, 0) /
          sessions.length
        : 0;

    const topContent = Array.from(this.contentMetrics.values())
      .sort(
        (a, b) =>
          b.performanceMetrics.engagementScore -
          a.performanceMetrics.engagementScore
      )
      .slice(0, 3)
      .map(content => content.title);

    const recentAnomalies = Array.from(this.anomalies.values())
      .flat()
      .filter(
        anomaly => Date.now() - anomaly.timestamp.getTime() < 86400000
      ).length; // 24 hours

    const allPatterns = Array.from(this.interactionPatterns.values()).flat();
    const behaviorCounts = new Map<string, number>();
    allPatterns.forEach(pattern => {
      behaviorCounts.set(
        pattern.behaviorType,
        (behaviorCounts.get(pattern.behaviorType) || 0) + 1
      );
    });

    const dominantBehaviors = Array.from(behaviorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([behavior]) => behavior);

    return {
      totalSessions: sessions.length,
      avgSessionQuality: Math.round(avgQuality),
      topContent,
      recentAnomalies,
      dominantBehaviors,
    };
  }
}
