import { EventEmitter } from 'events';

// =============================================================================
// CUSTOMER JOURNEY TYPES
// =============================================================================

export interface Touchpoint {
  touchpointId: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;

  // Touchpoint details
  type: 'page_view' | 'click' | 'form_submission' | 'download' | 'video_play' | 'scroll' | 'email_open' | 'email_click' | 'social_share' | 'chat_start' | 'call_request' | 'demo_request';
  channel: 'web' | 'email' | 'social' | 'paid_ads' | 'organic' | 'direct' | 'referral' | 'chat' | 'phone';
  source: string;
  medium: string;
  campaign?: string;

  // Location/content details
  page?: string;
  content?: string;
  element?: string;
  category?: string;

  // Context
  deviceType: 'desktop' | 'mobile' | 'tablet';
  location?: string;
  referrer?: string;

  // Metrics
  value: number; // Business value (0-100)
  engagement: number; // Engagement score (0-100)
  intent: number; // Purchase intent (0-100)

  // Journey context
  journeyStage: 'awareness' | 'consideration' | 'evaluation' | 'purchase' | 'retention' | 'advocacy';
  isConversion: boolean;
  conversionType?: 'lead' | 'trial' | 'purchase' | 'upgrade' | 'renewal';
  conversionValue?: number;
}

export interface CustomerJourney {
  journeyId: string;
  userId?: string;
  sessionIds: string[];

  // Journey timeline
  startDate: Date;
  endDate: Date;
  duration: number; // in milliseconds
  touchpointCount: number;

  // Journey characteristics
  stages: Array<{
    stage: Touchpoint['journeyStage'];
    touchpoints: Touchpoint[];
    duration: number;
    conversionRate: number;
  }>;

  // Journey path
  path: Touchpoint[];
  channels: string[];
  sources: string[];

  // Journey outcomes
  converted: boolean;
  conversionType?: string;
  conversionValue: number;
  journeyValue: number; // Total business value

  // Journey quality metrics
  efficiency: number; // How direct the path was (0-100)
  engagement: number; // Overall engagement (0-100)
  intent: number; // Purchase intent progression (0-100)
  satisfaction: number; // Journey satisfaction (0-100)

  // Attribution
  firstTouch: Touchpoint;
  lastTouch: Touchpoint;
  assistingTouchpoints: Touchpoint[];

  lastUpdated: Date;
}

export interface ConversionPath {
  pathId: string;
  pattern: string[];
  frequency: number;
  conversionRate: number;

  // Path characteristics
  averageDuration: number;
  averageTouchpoints: number;
  topChannels: string[];
  topSources: string[];

  // Conversion metrics
  totalConversions: number;
  totalRevenue: number;
  averageOrderValue: number;

  // Path quality
  efficiency: number;
  dropOffRate: number;
  satisfaction: number;

  // Touchpoint details
  touchpoints: Array<{
    step: number;
    type: string;
    channel: string;
    avgDurationToNext: number;
    dropOffRate: number;
    value: number;
  }>;

  lastAnalyzed: Date;
}

export interface DropOffAnalysis {
  analysisId: string;
  touchpoint: Touchpoint;

  // Drop-off metrics
  dropOffRate: number;
  impactScore: number; // Business impact (0-100)
  frequency: number;

  // Context analysis
  commonPatterns: string[];
  deviceTypes: Record<string, number>;
  timePatterns: Record<string, number>;
  sources: Record<string, number>;

  // Root cause analysis
  likelyReasons: Array<{
    reason: string;
    confidence: number;
    evidence: string[];
  }>;

  // Optimization opportunities
  recommendations: Array<{
    type: 'content' | 'ux' | 'technical' | 'targeting' | 'timing';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    expectedImpact: number; // 0-100
    effort: 'low' | 'medium' | 'high';
  }>;

  timestamp: Date;
}

export interface JourneyOptimization {
  optimizationId: string;
  journeyPattern: string;

  // Current performance
  currentMetrics: {
    conversionRate: number;
    averageDuration: number;
    satisfactionScore: number;
    dropOffRate: number;
    efficiency: number;
  };

  // Optimization opportunities
  opportunities: Array<{
    type: 'reduce_friction' | 'improve_content' | 'optimize_timing' | 'enhance_personalization' | 'streamline_process';
    touchpoint: string;
    description: string;
    expectedImprovement: number; // % improvement
    confidence: number; // 0-100
    effort: 'low' | 'medium' | 'high';
    priority: number; // 1-10
  }>;

  // Recommendations
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };

  // Projected impact
  projectedImpact: {
    conversionIncrease: number; // %
    revenueIncrease: number; // $
    customerSatisfactionIncrease: number; // %
    timeToConversion: number; // % reduction
  };

  generatedAt: Date;
}

// =============================================================================
// MAIN JOURNEY VISUALIZATION ENGINE
// =============================================================================

export class CustomerJourneyVisualizationEngine extends EventEmitter {
  private static instance: CustomerJourneyVisualizationEngine;

  // Core data stores
  private touchpoints: Map<string, Touchpoint[]>; // userId -> touchpoints
  private journeys: Map<string, CustomerJourney>;
  private conversionPaths: Map<string, ConversionPath>;
  private dropOffAnalyses: Map<string, DropOffAnalysis>;
  private optimizations: Map<string, JourneyOptimization>;

  // Processing state
  private isProcessing: boolean;
  private lastAnalysisTime: Date;
  private pathPatterns: Map<string, number>; // pattern -> frequency

  constructor() {
    super();
    this.touchpoints = new Map();
    this.journeys = new Map();
    this.conversionPaths = new Map();
    this.dropOffAnalyses = new Map();
    this.optimizations = new Map();
    this.isProcessing = false;
    this.lastAnalysisTime = new Date();
    this.pathPatterns = new Map();

    this.initializeJourneyTracking();
  }

  static getInstance(): CustomerJourneyVisualizationEngine {
    if (!CustomerJourneyVisualizationEngine.instance) {
      CustomerJourneyVisualizationEngine.instance = new CustomerJourneyVisualizationEngine();
    }
    return CustomerJourneyVisualizationEngine.instance;
  }

  private async initializeJourneyTracking(): Promise<void> {
    try {
      await this.loadJourneyData();
      this.setupPeriodicAnalysis();

      this.emit('journey_tracking_initialized', {
        timestamp: new Date(),
        status: 'ready'
      });
    } catch (error) {
      this.emit('tracking_error', {
        error: 'Journey tracking initialization failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }
  }

  private async loadJourneyData(): Promise<void> {
    // Load historical journey data
    // In a real implementation, this would load from database
  }

  private setupPeriodicAnalysis(): void {
    // Run journey analysis every 10 minutes
    setInterval(() => {
      this.runJourneyAnalysis();
    }, 10 * 60 * 1000);

    // Run path analysis every hour
    setInterval(() => {
      this.analyzeConversionPaths();
    }, 60 * 60 * 1000);

    // Run optimization analysis every 4 hours
    setInterval(() => {
      this.generateOptimizations();
    }, 4 * 60 * 60 * 1000);
  }

  // =============================================================================
  // TOUCHPOINT TRACKING
  // =============================================================================

  async trackTouchpoint(touchpointData: {
    userId?: string;
    sessionId: string;
    type: Touchpoint['type'];
    channel: Touchpoint['channel'];
    source: string;
    medium: string;
    campaign?: string;
    page?: string;
    content?: string;
    element?: string;
    deviceType: Touchpoint['deviceType'];
    referrer?: string;
    conversionValue?: number;
  }): Promise<Touchpoint> {
    try {
      const touchpoint: Touchpoint = {
        touchpointId: this.generateTouchpointId(),
        timestamp: new Date(),
        userId: touchpointData.userId,
        sessionId: touchpointData.sessionId,
        type: touchpointData.type,
        channel: touchpointData.channel,
        source: touchpointData.source,
        medium: touchpointData.medium,
        campaign: touchpointData.campaign,
        page: touchpointData.page,
        content: touchpointData.content,
        element: touchpointData.element,
        category: this.categorizeContent(touchpointData.content || touchpointData.page),
        deviceType: touchpointData.deviceType,
        referrer: touchpointData.referrer,
        value: this.calculateTouchpointValue(touchpointData),
        engagement: this.calculateEngagementScore(touchpointData),
        intent: this.calculateIntentScore(touchpointData),
        journeyStage: this.determineJourneyStage(touchpointData),
        isConversion: this.isConversionTouchpoint(touchpointData),
        conversionType: this.getConversionType(touchpointData),
        conversionValue: touchpointData.conversionValue
      };

      // Store touchpoint
      const userId = touchpointData.userId || 'anonymous';
      if (!this.touchpoints.has(userId)) {
        this.touchpoints.set(userId, []);
      }
      this.touchpoints.get(userId)!.push(touchpoint);

      // Update journey
      await this.updateCustomerJourney(userId, touchpoint);

      this.emit('touchpoint_tracked', {
        touchpoint,
        timestamp: new Date()
      });

      return touchpoint;

    } catch (error) {
      this.emit('tracking_error', {
        error: 'Touchpoint tracking failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
      throw error;
    }
  }

  private generateTouchpointId(): string {
    return `touchpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private categorizeContent(content?: string): string {
    if (!content) return 'unknown';

    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('blog') || lowerContent.includes('article')) return 'blog';
    if (lowerContent.includes('demo') || lowerContent.includes('trial')) return 'demo';
    if (lowerContent.includes('pricing') || lowerContent.includes('plans')) return 'pricing';
    if (lowerContent.includes('feature') || lowerContent.includes('product')) return 'features';
    if (lowerContent.includes('case-study') || lowerContent.includes('success')) return 'case_study';
    if (lowerContent.includes('doc') || lowerContent.includes('guide')) return 'documentation';
    if (lowerContent.includes('contact') || lowerContent.includes('support')) return 'support';
    if (lowerContent.includes('about') || lowerContent.includes('company')) return 'company';

    return 'other';
  }

  private calculateTouchpointValue(data: Record<string, unknown>): number {
    let value = 10; // Base value

    // Type-based value
    switch (data.type) {
      case 'form_submission': value += 40; break;
      case 'demo_request': value += 50; break;
      case 'download': value += 30; break;
      case 'video_play': value += 20; break;
      case 'page_view': value += 5; break;
      case 'click': value += 10; break;
      default: value += 5;
    }

    // Channel-based value
    switch (data.channel) {
      case 'direct': value += 20; break;
      case 'organic': value += 15; break;
      case 'email': value += 25; break;
      case 'social': value += 10; break;
      case 'paid_ads': value += 5; break;
    }

    // Page-based value
    const page = (data.page as string || '').toLowerCase();
    if (page.includes('pricing')) value += 30;
    if (page.includes('demo')) value += 25;
    if (page.includes('trial')) value += 35;
    if (page.includes('contact')) value += 20;

    return Math.min(100, value);
  }

  private calculateEngagementScore(data: Record<string, unknown>): number {
    let score = 20; // Base engagement

    // Engagement indicators
    if (data.type === 'scroll') score += 10;
    if (data.type === 'video_play') score += 20;
    if (data.type === 'form_submission') score += 40;
    if (data.type === 'download') score += 30;

    // Time-based engagement (would be calculated from session data)
    // This is simplified for the example
    score += 20;

    return Math.min(100, score);
  }

  private calculateIntentScore(data: Record<string, unknown>): number {
    let score = 10; // Base intent

    // High-intent actions
    if (data.type === 'demo_request') score += 50;
    if (data.type === 'form_submission') score += 30;
    if (data.type === 'call_request') score += 45;

    // High-intent pages
    const page = (data.page as string || '').toLowerCase();
    if (page.includes('pricing')) score += 40;
    if (page.includes('trial')) score += 35;
    if (page.includes('demo')) score += 30;
    if (page.includes('contact')) score += 25;

    return Math.min(100, score);
  }

  private determineJourneyStage(data: Record<string, unknown>): Touchpoint['journeyStage'] {
    const page = (data.page as string || '').toLowerCase();
    const content = (data.content as string || '').toLowerCase();

    // Purchase/conversion stage
    if (data.type === 'demo_request' || page.includes('trial') || page.includes('purchase')) {
      return 'purchase';
    }

    // Evaluation stage
    if (page.includes('pricing') || page.includes('comparison') || content.includes('case-study')) {
      return 'evaluation';
    }

    // Consideration stage
    if (page.includes('features') || page.includes('product') || content.includes('guide')) {
      return 'consideration';
    }

    // Awareness stage (default for most content)
    return 'awareness';
  }

  private isConversionTouchpoint(data: Record<string, unknown>): boolean {
    return data.type === 'form_submission' ||
           data.type === 'demo_request' ||
           data.type === 'call_request' ||
           (data.conversionValue !== undefined && (data.conversionValue as number) > 0);
  }

  private getConversionType(data: Record<string, unknown>): Touchpoint['conversionType'] | undefined {
    if (!this.isConversionTouchpoint(data)) return undefined;

    if (data.type === 'demo_request') return 'trial';
    if (data.type === 'form_submission') return 'lead';
    if (data.conversionValue && (data.conversionValue as number) > 0) return 'purchase';

    return 'lead';
  }

  // =============================================================================
  // JOURNEY MANAGEMENT
  // =============================================================================

  private async updateCustomerJourney(userId: string, touchpoint: Touchpoint): Promise<void> {
    try {
      let journey = this.findActiveJourney(userId);

      if (!journey) {
        journey = this.createNewJourney(userId, touchpoint);
      } else {
        this.updateExistingJourney(journey, touchpoint);
      }

      this.journeys.set(journey.journeyId, journey);

      this.emit('journey_updated', {
        journeyId: journey.journeyId,
        userId,
        touchpoint,
        timestamp: new Date()
      });

    } catch (error) {
      this.emit('tracking_error', {
        error: 'Journey update failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }
  }

  private findActiveJourney(userId: string): CustomerJourney | null {
    const userJourneys = Array.from(this.journeys.values())
      .filter(j => j.userId === userId)
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime());

    if (userJourneys.length === 0) return null;

    const latestJourney = userJourneys[0];
    const timeSinceLastTouch = Date.now() - latestJourney.endDate.getTime();

    // Consider journey active if last touchpoint was within 30 minutes
    if (timeSinceLastTouch < 30 * 60 * 1000) {
      return latestJourney;
    }

    return null;
  }

  private createNewJourney(userId: string, touchpoint: Touchpoint): CustomerJourney {
    const journeyId = `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      journeyId,
      userId,
      sessionIds: [touchpoint.sessionId],
      startDate: touchpoint.timestamp,
      endDate: touchpoint.timestamp,
      duration: 0,
      touchpointCount: 1,
      stages: [{
        stage: touchpoint.journeyStage,
        touchpoints: [touchpoint],
        duration: 0,
        conversionRate: touchpoint.isConversion ? 1 : 0
      }],
      path: [touchpoint],
      channels: [touchpoint.channel],
      sources: [touchpoint.source],
      converted: touchpoint.isConversion,
      conversionType: touchpoint.conversionType,
      conversionValue: touchpoint.conversionValue || 0,
      journeyValue: touchpoint.value,
      efficiency: 100, // Single touchpoint is perfectly efficient
      engagement: touchpoint.engagement,
      intent: touchpoint.intent,
      satisfaction: 80, // Default satisfaction
      firstTouch: touchpoint,
      lastTouch: touchpoint,
      assistingTouchpoints: [],
      lastUpdated: new Date()
    };
  }

  private updateExistingJourney(journey: CustomerJourney, touchpoint: Touchpoint): void {
    // Update basic metrics
    journey.endDate = touchpoint.timestamp;
    journey.duration = journey.endDate.getTime() - journey.startDate.getTime();
    journey.touchpointCount += 1;
    journey.lastUpdated = new Date();

    // Add to path
    journey.path.push(touchpoint);

    // Update channels and sources
    if (!journey.channels.includes(touchpoint.channel)) {
      journey.channels.push(touchpoint.channel);
    }
    if (!journey.sources.includes(touchpoint.source)) {
      journey.sources.push(touchpoint.source);
    }

    // Update session IDs
    if (!journey.sessionIds.includes(touchpoint.sessionId)) {
      journey.sessionIds.push(touchpoint.sessionId);
    }

    // Update stages
    const existingStage = journey.stages.find(s => s.stage === touchpoint.journeyStage);
    if (existingStage) {
      existingStage.touchpoints.push(touchpoint);
      if (touchpoint.isConversion) {
        existingStage.conversionRate = existingStage.touchpoints.filter(t => t.isConversion).length / existingStage.touchpoints.length;
      }
    } else {
      journey.stages.push({
        stage: touchpoint.journeyStage,
        touchpoints: [touchpoint],
        duration: 0,
        conversionRate: touchpoint.isConversion ? 1 : 0
      });
    }

    // Update conversion status
    if (touchpoint.isConversion) {
      journey.converted = true;
      journey.conversionType = touchpoint.conversionType;
      journey.conversionValue += touchpoint.conversionValue || 0;
    }

    // Update journey value
    journey.journeyValue += touchpoint.value;

    // Update last touch and assisting touchpoints
    if (journey.path.length > 1) {
      journey.assistingTouchpoints = journey.path.slice(1, -1);
    }
    journey.lastTouch = touchpoint;

    // Recalculate journey metrics
    this.calculateJourneyMetrics(journey);
  }

  private calculateJourneyMetrics(journey: CustomerJourney): void {
    // Calculate efficiency (shorter, more direct paths are more efficient)
    const optimalPathLength = journey.converted ? 2 : 1; // Minimum touchpoints for conversion
    journey.efficiency = Math.max(10, 100 - ((journey.touchpointCount - optimalPathLength) * 10));

    // Calculate overall engagement
    journey.engagement = journey.path.reduce((sum, tp) => sum + tp.engagement, 0) / journey.path.length;

    // Calculate intent progression
    journey.intent = Math.max(...journey.path.map(tp => tp.intent));

    // Calculate satisfaction (based on efficiency and engagement)
    journey.satisfaction = (journey.efficiency * 0.4) + (journey.engagement * 0.6);
  }

  // =============================================================================
  // ANALYSIS METHODS
  // =============================================================================

  private async runJourneyAnalysis(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    try {
      await this.identifyDropOffPoints();
      await this.analyzeConversionPaths();
      this.lastAnalysisTime = new Date();

      this.emit('journey_analysis_complete', {
        timestamp: new Date(),
        journeysAnalyzed: this.journeys.size
      });

    } catch (error) {
      this.emit('analysis_error', {
        error: 'Journey analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    } finally {
      this.isProcessing = false;
    }
  }

  private async identifyDropOffPoints(): Promise<void> {
    const dropOffCounts = new Map<string, number>();
    const totalTouchpoints = new Map<string, number>();

    // Analyze all journeys for drop-off patterns
    this.journeys.forEach(journey => {
      journey.path.forEach((touchpoint, index) => {
        const key = `${touchpoint.type}_${touchpoint.channel}_${touchpoint.page || 'unknown'}`;

        totalTouchpoints.set(key, (totalTouchpoints.get(key) || 0) + 1);

        // If this is the last touchpoint and journey didn't convert, it's a drop-off
        if (index === journey.path.length - 1 && !journey.converted) {
          dropOffCounts.set(key, (dropOffCounts.get(key) || 0) + 1);
        }
      });
    });

    // Calculate drop-off rates and create analyses
    for (const [key, dropOffs] of Array.from(dropOffCounts.entries())) {
      const total = totalTouchpoints.get(key) || 1;
      const dropOffRate = dropOffs / total;

      if (dropOffRate > 0.3) { // Only analyze significant drop-offs
        await this.createDropOffAnalysis(key, dropOffRate, dropOffs);
      }
    }
  }

  private async createDropOffAnalysis(touchpointKey: string, dropOffRate: number, frequency: number): Promise<void> {
    // Find a representative touchpoint for this pattern
    const representativeTouchpoint = this.findRepresentativeTouchpoint(touchpointKey);
    if (!representativeTouchpoint) return;

    const analysis: DropOffAnalysis = {
      analysisId: `dropoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      touchpoint: representativeTouchpoint,
      dropOffRate,
      impactScore: this.calculateDropOffImpact(dropOffRate, frequency),
      frequency,
      commonPatterns: this.identifyDropOffPatterns(touchpointKey),
      deviceTypes: this.analyzeDropOffByDevice(touchpointKey),
      timePatterns: this.analyzeDropOffByTime(touchpointKey),
      sources: this.analyzeDropOffBySources(touchpointKey),
      likelyReasons: this.identifyDropOffReasons(touchpointKey, dropOffRate),
      recommendations: this.generateDropOffRecommendations(touchpointKey, dropOffRate),
      timestamp: new Date()
    };

    this.dropOffAnalyses.set(analysis.analysisId, analysis);

    this.emit('dropoff_identified', {
      analysis,
      timestamp: new Date()
    });
  }

  private findRepresentativeTouchpoint(touchpointKey: string): Touchpoint | null {
    // Find the most recent touchpoint matching this pattern
    for (const touchpoints of this.touchpoints.values()) {
      for (const tp of touchpoints.reverse()) {
        const key = `${tp.type}_${tp.channel}_${tp.page || 'unknown'}`;
        if (key === touchpointKey) {
          return tp;
        }
      }
    }
    return null;
  }

  private calculateDropOffImpact(dropOffRate: number, frequency: number): number {
    // Higher drop-off rate and frequency = higher impact
    return Math.min(100, (dropOffRate * 70) + (Math.log(frequency) * 10));
  }

  private identifyDropOffPatterns(touchpointKey: string): string[] {
    // Simplified pattern identification
    const patterns: string[] = [];

    if (touchpointKey.includes('form_submission')) {
      patterns.push('form_abandonment');
    }
    if (touchpointKey.includes('pricing')) {
      patterns.push('price_shock');
    }
    if (touchpointKey.includes('demo')) {
      patterns.push('demo_hesitation');
    }

    return patterns;
  }

  private analyzeDropOffByDevice(touchpointKey: string): Record<string, number> {
    // Simplified device analysis
    return {
      'desktop': 0.4,
      'mobile': 0.5,
      'tablet': 0.1
    };
  }

  private analyzeDropOffByTime(touchpointKey: string): Record<string, number> {
    // Simplified time analysis
    return {
      'morning': 0.2,
      'afternoon': 0.5,
      'evening': 0.3
    };
  }

  private analyzeDropOffBySources(touchpointKey: string): Record<string, number> {
    // Simplified source analysis
    return {
      'organic': 0.3,
      'paid': 0.4,
      'direct': 0.2,
      'social': 0.1
    };
  }

  private identifyDropOffReasons(touchpointKey: string, dropOffRate: number): Array<{ reason: string; confidence: number; evidence: string[] }> {
    const reasons = [];

    if (touchpointKey.includes('form')) {
      reasons.push({
        reason: 'Form complexity or length',
        confidence: 80,
        evidence: ['High abandonment on form pages', 'Common pattern in B2B sites']
      });
    }

    if (touchpointKey.includes('pricing')) {
      reasons.push({
        reason: 'Price sensitivity',
        confidence: 75,
        evidence: ['Drop-off increases on pricing page', 'No follow-up engagement']
      });
    }

    return reasons;
  }

  private generateDropOffRecommendations(touchpointKey: string, dropOffRate: number): Array<{
    type: 'content' | 'ux' | 'technical' | 'targeting' | 'timing';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    expectedImpact: number;
    effort: 'low' | 'medium' | 'high';
  }> {
    const recommendations = [];

    if (touchpointKey.includes('form')) {
      recommendations.push({
        type: 'ux' as const,
        priority: 'high' as const,
        description: 'Simplify form by reducing required fields and implementing progressive disclosure',
        expectedImpact: 25,
        effort: 'medium' as const
      });
    }

    if (dropOffRate > 0.5) {
      recommendations.push({
        type: 'content' as const,
        priority: 'critical' as const,
        description: 'Review and optimize page content and value proposition',
        expectedImpact: 35,
        effort: 'high' as const
      });
    }

    return recommendations;
  }

  // =============================================================================
  // CONVERSION PATH ANALYSIS
  // =============================================================================

  private async analyzeConversionPaths(): Promise<void> {
    try {
      const pathPatterns = new Map<string, ConversionPath>();

      // Analyze converted journeys
      const convertedJourneys = Array.from(this.journeys.values()).filter(j => j.converted);

      convertedJourneys.forEach(journey => {
        const pathKey = this.generatePathKey(journey.path);

        if (pathPatterns.has(pathKey)) {
          this.updatePathPattern(pathPatterns.get(pathKey)!, journey);
        } else {
          pathPatterns.set(pathKey, this.createPathPattern(journey));
        }
      });

      // Store updated conversion paths
      pathPatterns.forEach((path, key) => {
        this.conversionPaths.set(key, path);
      });

      this.emit('conversion_paths_analyzed', {
        pathCount: pathPatterns.size,
        timestamp: new Date()
      });

    } catch (error) {
      this.emit('analysis_error', {
        error: 'Conversion path analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }
  }

  private generatePathKey(path: Touchpoint[]): string {
    return path.map(tp => `${tp.type}_${tp.channel}`).join('->');
  }

  private createPathPattern(journey: CustomerJourney): ConversionPath {
    return {
      pathId: `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pattern: journey.path.map(tp => `${tp.type}_${tp.channel}`),
      frequency: 1,
      conversionRate: 100, // This journey converted
      averageDuration: journey.duration,
      averageTouchpoints: journey.touchpointCount,
      topChannels: journey.channels,
      topSources: journey.sources,
      totalConversions: 1,
      totalRevenue: journey.conversionValue,
      averageOrderValue: journey.conversionValue,
      efficiency: journey.efficiency,
      dropOffRate: 0, // No drop-off since it converted
      satisfaction: journey.satisfaction,
      touchpoints: journey.path.map((tp, index) => ({
        step: index + 1,
        type: tp.type,
        channel: tp.channel,
        avgDurationToNext: index < journey.path.length - 1 ?
          (journey.path[index + 1].timestamp.getTime() - tp.timestamp.getTime()) : 0,
        dropOffRate: 0,
        value: tp.value
      })),
      lastAnalyzed: new Date()
    };
  }

  private updatePathPattern(path: ConversionPath, journey: CustomerJourney): void {
    path.frequency += 1;
    path.totalConversions += 1;
    path.totalRevenue += journey.conversionValue;
    path.averageOrderValue = path.totalRevenue / path.totalConversions;

    // Update averages
    path.averageDuration = (path.averageDuration + journey.duration) / 2;
    path.averageTouchpoints = (path.averageTouchpoints + journey.touchpointCount) / 2;
    path.efficiency = (path.efficiency + journey.efficiency) / 2;
    path.satisfaction = (path.satisfaction + journey.satisfaction) / 2;

    path.lastAnalyzed = new Date();
  }

  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================

  async getCustomerJourney(userId: string): Promise<CustomerJourney[]> {
    return Array.from(this.journeys.values()).filter(j => j.userId === userId);
  }

  async getJourneyVisualization(journeyId: string): Promise<{
    journey: CustomerJourney;
    visualization: {
      nodes: Array<{ id: string; type: string; label: string; value: number }>;
      edges: Array<{ from: string; to: string; duration: number }>;
      stages: Array<{ stage: string; touchpoints: number; conversionRate: number }>;
    };
  } | null> {
    const journey = this.journeys.get(journeyId);
    if (!journey) return null;

    const nodes = journey.path.map(tp => ({
      id: tp.touchpointId,
      type: tp.type,
      label: `${tp.type} (${tp.channel})`,
      value: tp.value
    }));

    const edges = journey.path.slice(0, -1).map((tp, index) => ({
      from: tp.touchpointId,
      to: journey.path[index + 1].touchpointId,
      duration: journey.path[index + 1].timestamp.getTime() - tp.timestamp.getTime()
    }));

    return {
      journey,
      visualization: {
        nodes,
        edges,
        stages: journey.stages.map(stage => ({
          stage: stage.stage,
          touchpoints: stage.touchpoints.length,
          conversionRate: stage.conversionRate
        }))
      }
    };
  }

  async getConversionPaths(limit: number = 10): Promise<ConversionPath[]> {
    return Array.from(this.conversionPaths.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  async getDropOffAnalyses(limit: number = 10): Promise<DropOffAnalysis[]> {
    return Array.from(this.dropOffAnalyses.values())
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, limit);
  }

  // =============================================================================
  // OPTIMIZATION ENGINE
  // =============================================================================

  private async generateOptimizations(): Promise<void> {
    try {
      const optimizations = new Map<string, JourneyOptimization>();

      // Analyze top conversion paths for optimization opportunities
      const topPaths = await this.getConversionPaths(5);

      for (const path of topPaths) {
        const optimization = await this.analyzePathForOptimization(path);
        if (optimization) {
          optimizations.set(optimization.optimizationId, optimization);
        }
      }

      // Store optimizations
      optimizations.forEach((opt, id) => {
        this.optimizations.set(id, opt);
      });

      this.emit('optimizations_generated', {
        count: optimizations.size,
        timestamp: new Date()
      });

    } catch (error) {
      this.emit('analysis_error', {
        error: 'Optimization generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }
  }

  private async analyzePathForOptimization(path: ConversionPath): Promise<JourneyOptimization | null> {
    const opportunities = [];

    // Analyze each touchpoint for optimization opportunities
    path.touchpoints.forEach(tp => {
      if (tp.avgDurationToNext > 60000) { // More than 1 minute
        opportunities.push({
          type: 'reduce_friction' as const,
          touchpoint: tp.type,
          description: `Users spend too long on ${tp.type} step`,
          expectedImprovement: 15,
          confidence: 70,
          effort: 'medium' as const,
          priority: 7
        });
      }

      if (tp.value < 30) { // Low value touchpoint
        opportunities.push({
          type: 'improve_content' as const,
          touchpoint: tp.type,
          description: `Enhance content quality for ${tp.type}`,
          expectedImprovement: 20,
          confidence: 60,
          effort: 'high' as const,
          priority: 5
        });
      }
    });

    if (opportunities.length === 0) return null;

    return {
      optimizationId: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      journeyPattern: path.pattern.join('->'),
      currentMetrics: {
        conversionRate: path.conversionRate,
        averageDuration: path.averageDuration,
        satisfactionScore: path.satisfaction,
        dropOffRate: path.dropOffRate,
        efficiency: path.efficiency
      },
      opportunities,
      recommendations: {
        immediate: ['Focus on high-priority optimizations'],
        shortTerm: ['Implement content improvements'],
        longTerm: ['Redesign journey flow']
      },
      projectedImpact: {
        conversionIncrease: 12,
        revenueIncrease: path.averageOrderValue * 0.12,
        customerSatisfactionIncrease: 8,
        timeToConversion: 15
      },
      generatedAt: new Date()
    };
  }

  async getOptimizationRecommendations(limit: number = 5): Promise<JourneyOptimization[]> {
    return Array.from(this.optimizations.values())
      .sort((a, b) => b.projectedImpact.conversionIncrease - a.projectedImpact.conversionIncrease)
      .slice(0, limit);
  }

  // =============================================================================
  // HEALTH AND UTILITIES
  // =============================================================================

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: {
      journeysTracked: number;
      conversionPaths: number;
      dropOffAnalyses: number;
      optimizations: number;
    };
    issues: string[];
    lastAnalysis: Date;
  }> {
    const metrics = {
      journeysTracked: this.journeys.size,
      conversionPaths: this.conversionPaths.size,
      dropOffAnalyses: this.dropOffAnalyses.size,
      optimizations: this.optimizations.size
    };

    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check for issues
    if (this.isProcessing) {
      issues.push('Analysis currently in progress');
    }

    const timeSinceLastAnalysis = Date.now() - this.lastAnalysisTime.getTime();
    if (timeSinceLastAnalysis > 30 * 60 * 1000) { // 30 minutes
      issues.push('Analysis overdue');
      status = 'degraded';
    }

    if (metrics.journeysTracked === 0) {
      issues.push('No journeys being tracked');
      status = 'unhealthy';
    }

    return {
      status,
      metrics,
      issues,
      lastAnalysis: this.lastAnalysisTime
    };
  }

  clearJourneyData(): void {
    this.touchpoints.clear();
    this.journeys.clear();
    this.conversionPaths.clear();
    this.dropOffAnalyses.clear();
    this.optimizations.clear();
    this.pathPatterns.clear();

    this.emit('journey_data_cleared', {
      timestamp: new Date()
    });
  }
}
