/**
 * Timing Factor Calculation Service
 * Predictive models for optimal sales engagement timing
 */

import { EventEmitter } from 'events';
import type { LeadData } from './ml-types';

// =============================================================================
// INTERFACES AND TYPES
// =============================================================================

export interface TimingData {
  userId: string;
  timestamp: Date;
  event: {
    type: 'page_view' | 'download' | 'form_submit' | 'email_open' | 'email_click' | 'demo_request' | 'pricing_view';
    category: 'engagement' | 'content' | 'intent' | 'communication';
    value?: number;
    metadata?: Record<string, any>;
  };
  context: {
    platform: string;
    sessionId?: string;
    source?: string;
    campaign?: string;
  };
}

export interface EngagementPattern {
  userId: string;
  timeframe: 'daily' | 'weekly' | 'monthly';
  pattern: {
    peakHours: number[]; // 0-23
    peakDays: number[]; // 0-6 (Sunday = 0)
    peakWeeks: number[]; // Week of month 1-4
    averageSessionGap: number; // Hours between sessions
    engagementVelocity: number; // Events per day
    consistencyScore: number; // 0-100
  };
  trends: {
    increasing: boolean;
    decreasing: boolean;
    stable: boolean;
    seasonality: 'high' | 'medium' | 'low';
  };
  lastUpdated: Date;
}

export interface SeasonalFactors {
  industry: string;
  month: number; // 1-12
  quarter: number; // 1-4
  dayOfWeek: number; // 0-6
  hourOfDay: number; // 0-23
  factors: {
    b2bMultiplier: number; // Business hours boost
    industryMultiplier: number; // Industry-specific timing
    seasonalMultiplier: number; // Seasonal trends
    weekdayMultiplier: number; // Weekday vs weekend
    timeOfDayMultiplier: number; // Hour-specific factors
  };
  confidence: number; // 0-100
}

export interface UrgencyIndicators {
  userId: string;
  indicators: {
    recentActivitySpike: {
      detected: boolean;
      magnitude: number; // Multiplier of normal activity
      timeframe: number; // Hours since spike started
    };
    competitiveSignals: {
      detected: boolean;
      competitorMentions: number;
      researchIntensity: number; // 0-100
    };
    buyingSignals: {
      pricingPageViews: number;
      demoRequests: number;
      trialSignups: number;
      contactFormSubmissions: number;
    };
    timeDecay: {
      daysSinceFirstVisit: number;
      daysSinceLastActivity: number;
      engagementTrend: 'increasing' | 'stable' | 'decreasing';
    };
  };
  urgencyScore: number; // 0-100
  recommendation: 'immediate' | 'within_hours' | 'within_days' | 'wait';
  confidence: number; // 0-100
}

export interface OptimalContactTiming {
  userId: string;
  recommendations: {
    immediate: {
      score: number; // 0-100
      reasons: string[];
      confidence: number;
    };
    nextBestTime: {
      timestamp: Date;
      score: number;
      reasons: string[];
      confidence: number;
    };
    weeklyOptimal: {
      dayOfWeek: number;
      hour: number;
      score: number;
      reasons: string[];
    };
  };
  factors: {
    engagementPattern: number; // 0-100
    seasonalFactors: number; // 0-100
    urgencyIndicators: number; // 0-100
    industryBenchmarks: number; // 0-100
  };
  metadata: {
    modelVersion: string;
    lastCalculated: Date;
    dataQuality: number; // 0-100
    sampleSize: number;
  };
}

export interface TimingProfile {
  userId: string;
  engagementPattern: EngagementPattern;
  seasonalFactors: SeasonalFactors;
  urgencyIndicators: UrgencyIndicators;
  optimalTiming: OptimalContactTiming;
  history: {
    contactAttempts: {
      timestamp: Date;
      method: 'email' | 'phone' | 'linkedin' | 'chat';
      response: boolean;
      responseTime?: number; // Minutes to response
    }[];
    conversionEvents: {
      timestamp: Date;
      event: 'demo_booked' | 'trial_started' | 'proposal_requested' | 'purchase';
      timingScore: number; // Timing score when event occurred
    }[];
  };
  lastUpdated: Date;
}

// =============================================================================
// TIMING FACTOR CALCULATION SERVICE
// =============================================================================

export class TimingFactorService extends EventEmitter {
  private static instance: TimingFactorService;
  private timingData: Map<string, TimingData[]>; // userId -> timing data
  private engagementPatterns: Map<string, EngagementPattern>; // userId -> pattern
  private timingProfiles: Map<string, TimingProfile>; // userId -> profile
  private seasonalModels: Map<string, SeasonalFactors>; // industry -> factors
  private industryBenchmarks: Map<string, any>; // industry -> benchmarks

  constructor() {
    super();
    this.timingData = new Map();
    this.engagementPatterns = new Map();
    this.timingProfiles = new Map();
    this.seasonalModels = new Map();
    this.industryBenchmarks = new Map();

    this.initializeSeasonalModels();
    this.initializeIndustryBenchmarks();
  }

  static getInstance(): TimingFactorService {
    if (!TimingFactorService.instance) {
      TimingFactorService.instance = new TimingFactorService();
    }
    return TimingFactorService.instance;
  }

  // =============================================================================
  // DATA INGESTION AND PROCESSING
  // =============================================================================

  async recordTimingData(data: TimingData): Promise<void> {
    const userTimingData = this.timingData.get(data.userId) || [];
    userTimingData.push(data);

    // Keep only last 1000 data points per user for performance
    if (userTimingData.length > 1000) {
      userTimingData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      this.timingData.set(data.userId, userTimingData.slice(0, 1000));
    } else {
      this.timingData.set(data.userId, userTimingData);
    }

    // Trigger pattern analysis if we have enough data
    if (userTimingData.length >= 10) {
      await this.updateEngagementPattern(data.userId);
    }

    this.emit('timing:data_recorded', data);
  }

  async batchRecordTimingData(dataArray: TimingData[]): Promise<void> {
    const userUpdates = new Set<string>();

    for (const data of dataArray) {
      await this.recordTimingData(data);
      userUpdates.add(data.userId);
    }

    // Update timing profiles for all affected users
    for (const userId of userUpdates) {
      await this.updateTimingProfile(userId);
    }

    this.emit('timing:batch_recorded', { count: dataArray.length, users: userUpdates.size });
  }

  // =============================================================================
  // ENGAGEMENT PATTERN ANALYSIS
  // =============================================================================

  private async updateEngagementPattern(userId: string): Promise<EngagementPattern> {
    const userData = this.timingData.get(userId) || [];

    if (userData.length < 5) {
      throw new Error('Insufficient data for pattern analysis');
    }

    // Analyze daily patterns
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    const sessionGaps: number[] = [];

    let lastTimestamp: Date | null = null;
    let totalEvents = 0;

    for (const event of userData) {
      const hour = event.timestamp.getHours();
      const day = event.timestamp.getDay();

      hourCounts[hour]++;
      dayCounts[day]++;
      totalEvents++;

      if (lastTimestamp) {
        const gapHours = (event.timestamp.getTime() - lastTimestamp.getTime()) / (1000 * 60 * 60);
        if (gapHours > 0.5 && gapHours < 168) { // Between 30 minutes and 1 week
          sessionGaps.push(gapHours);
        }
      }
      lastTimestamp = event.timestamp;
    }

    // Calculate peak hours (top 3)
    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);

    // Calculate peak days (top 2)
    const peakDays = dayCounts
      .map((count, day) => ({ day, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .map(item => item.day);

    // Calculate metrics
    const averageSessionGap = sessionGaps.length > 0
      ? sessionGaps.reduce((sum, gap) => sum + gap, 0) / sessionGaps.length
      : 24;

    const firstEvent = userData[userData.length - 1];
    const lastEvent = userData[0];
    const daysDiff = (lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const engagementVelocity = daysDiff > 0 ? totalEvents / daysDiff : 0;

    // Calculate consistency score
    const consistencyScore = this.calculateConsistencyScore(userData);

    // Analyze trends
    const trends = this.analyzeTrends(userData);

    const pattern: EngagementPattern = {
      userId,
      timeframe: 'daily',
      pattern: {
        peakHours,
        peakDays,
        peakWeeks: [1, 2, 3, 4], // Default to all weeks
        averageSessionGap,
        engagementVelocity,
        consistencyScore
      },
      trends,
      lastUpdated: new Date()
    };

    this.engagementPatterns.set(userId, pattern);
    this.emit('timing:pattern_updated', pattern);

    return pattern;
  }

  private calculateConsistencyScore(userData: TimingData[]): number {
    if (userData.length < 7) return 50; // Default score for insufficient data

    // Group events by day
    const dayGroups = new Map<string, number>();

    for (const event of userData) {
      const dayKey = event.timestamp.toISOString().split('T')[0];
      dayGroups.set(dayKey, (dayGroups.get(dayKey) || 0) + 1);
    }

    // Calculate consistency based on daily event distribution
    const dailyCounts = Array.from(dayGroups.values());
    const avgDaily = dailyCounts.reduce((sum, count) => sum + count, 0) / dailyCounts.length;
    const variance = dailyCounts.reduce((sum, count) => sum + Math.pow(count - avgDaily, 2), 0) / dailyCounts.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher consistency
    const consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev / avgDaily) * 50));

    return Math.round(consistencyScore);
  }

  private analyzeTrends(userData: TimingData[]): EngagementPattern['trends'] {
    if (userData.length < 14) {
      return {
        increasing: false,
        decreasing: false,
        stable: true,
        seasonality: 'low'
      };
    }

    // Split data into first and second half
    const midpoint = Math.floor(userData.length / 2);
    const firstHalf = userData.slice(0, midpoint);
    const secondHalf = userData.slice(midpoint);

    const firstHalfRate = this.calculateEventRate(firstHalf);
    const secondHalfRate = this.calculateEventRate(secondHalf);

    const changePercent = ((secondHalfRate - firstHalfRate) / firstHalfRate) * 100;

    let increasing = false;
    let decreasing = false;
    let stable = false;

    if (changePercent > 20) {
      increasing = true;
    } else if (changePercent < -20) {
      decreasing = true;
    } else {
      stable = true;
    }

    // Simple seasonality detection based on variance
    const seasonality = this.detectSeasonality(userData);

    return {
      increasing,
      decreasing,
      stable,
      seasonality
    };
  }

  private calculateEventRate(data: TimingData[]): number {
    if (data.length < 2) return 0;

    const firstEvent = data[data.length - 1];
    const lastEvent = data[0];
    const hours = (lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime()) / (1000 * 60 * 60);

    return hours > 0 ? data.length / hours : 0;
  }

  private detectSeasonality(userData: TimingData[]): 'high' | 'medium' | 'low' {
    // Group by day of week
    const dayGroups = new Array(7).fill(0);

    for (const event of userData) {
      dayGroups[event.timestamp.getDay()]++;
    }

    // Calculate coefficient of variation
    const mean = dayGroups.reduce((sum, count) => sum + count, 0) / 7;
    const variance = dayGroups.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / 7;
    const cv = Math.sqrt(variance) / mean;

    if (cv > 0.5) return 'high';
    if (cv > 0.25) return 'medium';
    return 'low';
  }

  // =============================================================================
  // URGENCY INDICATORS CALCULATION
  // =============================================================================

  async calculateUrgencyIndicators(userId: string): Promise<UrgencyIndicators> {
    const userData = this.timingData.get(userId) || [];

    if (userData.length === 0) {
      return this.getDefaultUrgencyIndicators(userId);
    }

    // Analyze recent activity spike
    const recentActivitySpike = this.detectActivitySpike(userData);

    // Analyze competitive signals
    const competitiveSignals = this.analyzeCompetitiveSignals(userData);

    // Count buying signals
    const buyingSignals = this.countBuyingSignals(userData);

    // Calculate time decay factors
    const timeDecay = this.calculateTimeDecay(userData);

    // Calculate overall urgency score
    const urgencyScore = this.calculateUrgencyScore({
      recentActivitySpike,
      competitiveSignals,
      buyingSignals,
      timeDecay
    });

    // Determine recommendation
    const recommendation = this.determineUrgencyRecommendation(urgencyScore, recentActivitySpike, buyingSignals);

    // Calculate confidence based on data quality
    const confidence = Math.min(100, Math.max(20, userData.length * 5));

    const indicators: UrgencyIndicators = {
      userId,
      indicators: {
        recentActivitySpike,
        competitiveSignals,
        buyingSignals,
        timeDecay
      },
      urgencyScore,
      recommendation,
      confidence
    };

    this.emit('timing:urgency_calculated', indicators);
    return indicators;
  }

  private detectActivitySpike(userData: TimingData[]): UrgencyIndicators['indicators']['recentActivitySpike'] {
    const now = new Date();
    const last24Hours = userData.filter(
      event => (now.getTime() - event.timestamp.getTime()) / (1000 * 60 * 60) <= 24
    );
    const last7Days = userData.filter(
      event => (now.getTime() - event.timestamp.getTime()) / (1000 * 60 * 60 * 24) <= 7
    );

    const dailyAverage = last7Days.length / 7;
    const todayActivity = last24Hours.length;

    const magnitude = dailyAverage > 0 ? todayActivity / dailyAverage : 1;
    const detected = magnitude >= 2; // 2x normal activity

    return {
      detected,
      magnitude: Math.round(magnitude * 100) / 100,
      timeframe: 24
    };
  }

  private analyzeCompetitiveSignals(userData: TimingData[]): UrgencyIndicators['indicators']['competitiveSignals'] {
    const competitorEvents = userData.filter(
      event => event.event.metadata?.competitor ||
               event.event.metadata?.comparison ||
               event.context.source?.includes('competitor')
    );

    const researchIntensity = Math.min(100, competitorEvents.length * 10);

    return {
      detected: competitorEvents.length > 0,
      competitorMentions: competitorEvents.length,
      researchIntensity
    };
  }

  private countBuyingSignals(userData: TimingData[]): UrgencyIndicators['indicators']['buyingSignals'] {
    const signals = {
      pricingPageViews: 0,
      demoRequests: 0,
      trialSignups: 0,
      contactFormSubmissions: 0
    };

    for (const event of userData) {
      switch (event.event.type) {
        case 'pricing_view':
          signals.pricingPageViews++;
          break;
        case 'demo_request':
          signals.demoRequests++;
          break;
        case 'form_submit':
          if (event.event.metadata?.formType === 'trial') {
            signals.trialSignups++;
          } else if (event.event.metadata?.formType === 'contact') {
            signals.contactFormSubmissions++;
          }
          break;
      }
    }

    return signals;
  }

  private calculateTimeDecay(userData: TimingData[]): UrgencyIndicators['indicators']['timeDecay'] {
    if (userData.length === 0) {
      return {
        daysSinceFirstVisit: 0,
        daysSinceLastActivity: 0,
        engagementTrend: 'stable'
      };
    }

    const now = new Date();
    const firstEvent = userData[userData.length - 1];
    const lastEvent = userData[0];

    const daysSinceFirstVisit = Math.floor(
      (now.getTime() - firstEvent.timestamp.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysSinceLastActivity = Math.floor(
      (now.getTime() - lastEvent.timestamp.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Analyze engagement trend
    const recentEvents = userData.filter(
      event => (now.getTime() - event.timestamp.getTime()) / (1000 * 60 * 60 * 24) <= 7
    );
    const olderEvents = userData.filter(
      event => {
        const days = (now.getTime() - event.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        return days > 7 && days <= 14;
      }
    );

    let engagementTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';

    if (olderEvents.length > 0) {
      const recentRate = recentEvents.length / 7;
      const olderRate = olderEvents.length / 7;

      if (recentRate > olderRate * 1.2) {
        engagementTrend = 'increasing';
      } else if (recentRate < olderRate * 0.8) {
        engagementTrend = 'decreasing';
      }
    }

    return {
      daysSinceFirstVisit,
      daysSinceLastActivity,
      engagementTrend
    };
  }

  private calculateUrgencyScore(indicators: UrgencyIndicators['indicators']): number {
    let score = 0;

    // Activity spike contributes 0-30 points
    if (indicators.recentActivitySpike.detected) {
      score += Math.min(30, indicators.recentActivitySpike.magnitude * 10);
    }

    // Competitive signals contribute 0-20 points
    score += Math.min(20, indicators.competitiveSignals.researchIntensity * 0.2);

    // Buying signals contribute 0-40 points
    const buyingScore =
      indicators.buyingSignals.pricingPageViews * 2 +
      indicators.buyingSignals.demoRequests * 10 +
      indicators.buyingSignals.trialSignups * 15 +
      indicators.buyingSignals.contactFormSubmissions * 8;
    score += Math.min(40, buyingScore);

    // Time decay affects scoring
    if (indicators.timeDecay.daysSinceLastActivity > 7) {
      score *= 0.7; // Reduce score for inactive users
    }
    if (indicators.timeDecay.engagementTrend === 'increasing') {
      score *= 1.2; // Boost score for increasing engagement
    } else if (indicators.timeDecay.engagementTrend === 'decreasing') {
      score *= 0.8; // Reduce score for decreasing engagement
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private determineUrgencyRecommendation(
    urgencyScore: number,
    activitySpike: UrgencyIndicators['indicators']['recentActivitySpike'],
    buyingSignals: UrgencyIndicators['indicators']['buyingSignals']
  ): UrgencyIndicators['recommendation'] {
    // Immediate contact recommended
    if (urgencyScore >= 80 ||
        activitySpike.magnitude >= 3 ||
        buyingSignals.demoRequests > 0 ||
        buyingSignals.contactFormSubmissions > 0) {
      return 'immediate';
    }

    // Contact within hours
    if (urgencyScore >= 60 ||
        activitySpike.detected ||
        buyingSignals.pricingPageViews >= 3) {
      return 'within_hours';
    }

    // Contact within days
    if (urgencyScore >= 30) {
      return 'within_days';
    }

    // Wait for more signals
    return 'wait';
  }

  private getDefaultUrgencyIndicators(userId: string): UrgencyIndicators {
    return {
      userId,
      indicators: {
        recentActivitySpike: {
          detected: false,
          magnitude: 1,
          timeframe: 24
        },
        competitiveSignals: {
          detected: false,
          competitorMentions: 0,
          researchIntensity: 0
        },
        buyingSignals: {
          pricingPageViews: 0,
          demoRequests: 0,
          trialSignups: 0,
          contactFormSubmissions: 0
        },
        timeDecay: {
          daysSinceFirstVisit: 0,
          daysSinceLastActivity: 0,
          engagementTrend: 'stable'
        }
      },
      urgencyScore: 0,
      recommendation: 'wait',
      confidence: 20
    };
  }

  // =============================================================================
  // OPTIMAL TIMING CALCULATION
  // =============================================================================

  async calculateOptimalTiming(userId: string, industry?: string): Promise<OptimalContactTiming> {
    const [pattern, urgency] = await Promise.all([
      this.getEngagementPattern(userId),
      this.calculateUrgencyIndicators(userId)
    ]);

    const seasonalFactors = this.getSeasonalFactors(industry || 'technology');
    const currentTime = new Date();

    // Calculate immediate contact score
    const immediateScore = this.calculateImmediateScore(urgency, pattern, seasonalFactors, currentTime);

    // Calculate next best time
    const nextBestTime = this.calculateNextBestTime(pattern, seasonalFactors, currentTime);

    // Calculate weekly optimal time
    const weeklyOptimal = this.calculateWeeklyOptimal(pattern, seasonalFactors);

    // Calculate contributing factors
    const factors = {
      engagementPattern: this.scoreEngagementPattern(pattern),
      seasonalFactors: this.scoreSeasonalFactors(seasonalFactors, currentTime),
      urgencyIndicators: urgency.urgencyScore,
      industryBenchmarks: this.scoreIndustryBenchmarks(industry || 'technology', currentTime)
    };

    const recommendations: OptimalContactTiming = {
      userId,
      recommendations: {
        immediate: immediateScore,
        nextBestTime,
        weeklyOptimal
      },
      factors,
      metadata: {
        modelVersion: '1.0.0',
        lastCalculated: new Date(),
        dataQuality: Math.min(100, (this.timingData.get(userId)?.length || 0) * 2),
        sampleSize: this.timingData.get(userId)?.length || 0
      }
    };

    this.emit('timing:optimal_calculated', recommendations);
    return recommendations;
  }

  private calculateImmediateScore(
    urgency: UrgencyIndicators,
    pattern: EngagementPattern | null,
    seasonal: SeasonalFactors,
    currentTime: Date
  ): OptimalContactTiming['recommendations']['immediate'] {
    const reasons: string[] = [];
    let score = 0;

    // Base urgency contribution (0-50 points)
    score += urgency.urgencyScore * 0.5;
    if (urgency.urgencyScore > 70) {
      reasons.push('High urgency score detected');
    }

    // Pattern matching (0-25 points)
    if (pattern) {
      const currentHour = currentTime.getHours();
      const currentDay = currentTime.getDay();

      if (pattern.pattern.peakHours.includes(currentHour)) {
        score += 15;
        reasons.push('Current time matches peak engagement hours');
      }

      if (pattern.pattern.peakDays.includes(currentDay)) {
        score += 10;
        reasons.push('Current day matches peak engagement pattern');
      }
    }

    // Seasonal factors (0-25 points)
    const seasonalScore =
      seasonal.factors.b2bMultiplier *
      seasonal.factors.timeOfDayMultiplier *
      seasonal.factors.weekdayMultiplier * 25;
    score += seasonalScore;

    if (seasonal.factors.b2bMultiplier > 1.2) {
      reasons.push('Optimal business hours timing');
    }

    // Confidence based on data quality and seasonal confidence
    const confidence = Math.min(100, (urgency.confidence + seasonal.confidence) / 2);

    return {
      score: Math.min(100, Math.round(score)),
      reasons,
      confidence: Math.round(confidence)
    };
  }

  private calculateNextBestTime(
    pattern: EngagementPattern | null,
    seasonal: SeasonalFactors,
    currentTime: Date
  ): OptimalContactTiming['recommendations']['nextBestTime'] {
    const reasons: string[] = [];

    // Default to next business day at 10 AM if no pattern
    if (!pattern) {
      const nextBusinessDay = this.getNextBusinessDay(currentTime);
      nextBusinessDay.setHours(10, 0, 0, 0);

      return {
        timestamp: nextBusinessDay,
        score: 70,
        reasons: ['Default business hours timing'],
        confidence: 60
      };
    }

    // Find next peak time based on engagement pattern
    const peakHour = pattern.pattern.peakHours[0]; // Primary peak hour
    const peakDay = pattern.pattern.peakDays[0]; // Primary peak day

    let nextOptimalTime = new Date(currentTime);

    // If we're past today's peak hour, move to tomorrow
    if (currentTime.getHours() >= peakHour) {
      nextOptimalTime.setDate(nextOptimalTime.getDate() + 1);
    }

    nextOptimalTime.setHours(peakHour, 0, 0, 0);

    // Adjust for peak day if necessary
    const dayDiff = (peakDay - nextOptimalTime.getDay() + 7) % 7;
    if (dayDiff > 0 && dayDiff < 4) { // Within next 3 days
      nextOptimalTime.setDate(nextOptimalTime.getDate() + dayDiff);
      reasons.push(`Scheduled for peak engagement day (${this.getDayName(peakDay)})`);
    }

    reasons.push(`Scheduled for peak engagement hour (${peakHour}:00)`);

    // Calculate score based on pattern strength
    const score = Math.min(100, 60 + pattern.pattern.consistencyScore * 0.4);

    return {
      timestamp: nextOptimalTime,
      score: Math.round(score),
      reasons,
      confidence: Math.round(pattern.pattern.consistencyScore)
    };
  }

  private calculateWeeklyOptimal(
    pattern: EngagementPattern | null,
    seasonal: SeasonalFactors
  ): OptimalContactTiming['recommendations']['weeklyOptimal'] {
    const reasons: string[] = [];

    if (!pattern) {
      // Default to Tuesday 10 AM for B2B
      return {
        dayOfWeek: 2, // Tuesday
        hour: 10,
        score: 75,
        reasons: ['Industry standard B2B timing (Tuesday 10 AM)']
      };
    }

    const optimalDay = pattern.pattern.peakDays[0];
    const optimalHour = pattern.pattern.peakHours[0];

    // Apply seasonal adjustments
    const adjustedHour = Math.min(23, Math.max(0,
      Math.round(optimalHour * seasonal.factors.timeOfDayMultiplier)
    ));

    reasons.push(`Based on engagement pattern: ${this.getDayName(optimalDay)} at ${adjustedHour}:00`);
    reasons.push(`Consistency score: ${pattern.pattern.consistencyScore}%`);

    const score = Math.min(100, 50 + pattern.pattern.consistencyScore * 0.5);

    return {
      dayOfWeek: optimalDay,
      hour: adjustedHour,
      score: Math.round(score),
      reasons
    };
  }

  // =============================================================================
  // TIMING PROFILE MANAGEMENT
  // =============================================================================

  private async updateTimingProfile(userId: string): Promise<TimingProfile> {
    const [pattern, urgency, optimal] = await Promise.all([
      this.getEngagementPattern(userId),
      this.calculateUrgencyIndicators(userId),
      this.calculateOptimalTiming(userId)
    ]);

    const industry = 'technology'; // This would come from user data
    const seasonalFactors = this.getSeasonalFactors(industry);

    const profile: TimingProfile = {
      userId,
      engagementPattern: pattern || this.getDefaultEngagementPattern(userId),
      seasonalFactors,
      urgencyIndicators: urgency,
      optimalTiming: optimal,
      history: {
        contactAttempts: [],
        conversionEvents: []
      },
      lastUpdated: new Date()
    };

    this.timingProfiles.set(userId, profile);
    this.emit('timing:profile_updated', profile);

    return profile;
  }

  async getTimingProfile(userId: string): Promise<TimingProfile | null> {
    return this.timingProfiles.get(userId) || null;
  }

  async getEngagementPattern(userId: string): Promise<EngagementPattern | null> {
    let pattern = this.engagementPatterns.get(userId);

    if (!pattern) {
      try {
        pattern = await this.updateEngagementPattern(userId);
      } catch (error) {
        return null;
      }
    }

    return pattern;
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private initializeSeasonalModels(): void {
    // Industry-specific seasonal models
    const industries = ['technology', 'healthcare', 'finance', 'manufacturing', 'retail'];

    for (const industry of industries) {
      // This would typically be loaded from historical data
      this.seasonalModels.set(industry, this.createDefaultSeasonalFactors(industry));
    }
  }

  private initializeIndustryBenchmarks(): void {
    // Industry benchmarks for timing
    this.industryBenchmarks.set('technology', {
      peakDays: [1, 2, 3], // Mon, Tue, Wed
      peakHours: [9, 10, 14, 15],
      responseRates: { morning: 0.18, afternoon: 0.15, evening: 0.08 }
    });

    this.industryBenchmarks.set('healthcare', {
      peakDays: [1, 2, 4], // Mon, Tue, Thu
      peakHours: [8, 9, 13, 14],
      responseRates: { morning: 0.22, afternoon: 0.12, evening: 0.05 }
    });
  }

  private createDefaultSeasonalFactors(industry: string): SeasonalFactors {
    const now = new Date();

    return {
      industry,
      month: now.getMonth() + 1,
      quarter: Math.ceil((now.getMonth() + 1) / 3),
      dayOfWeek: now.getDay(),
      hourOfDay: now.getHours(),
      factors: {
        b2bMultiplier: this.getB2BMultiplier(now),
        industryMultiplier: 1.0,
        seasonalMultiplier: this.getSeasonalMultiplier(now),
        weekdayMultiplier: this.getWeekdayMultiplier(now),
        timeOfDayMultiplier: this.getTimeOfDayMultiplier(now)
      },
      confidence: 75
    };
  }

  private getB2BMultiplier(date: Date): number {
    const hour = date.getHours();
    const day = date.getDay();

    // Business hours boost
    if (day >= 1 && day <= 5 && hour >= 9 && hour <= 17) {
      return 1.5;
    }

    return 0.8;
  }

  private getSeasonalMultiplier(date: Date): number {
    const month = date.getMonth() + 1;

    // Q4 and Q1 typically better for B2B
    if (month >= 10 || month <= 3) {
      return 1.2;
    }

    // Summer months typically slower
    if (month >= 6 && month <= 8) {
      return 0.9;
    }

    return 1.0;
  }

  private getWeekdayMultiplier(date: Date): number {
    const day = date.getDay();

    // Tuesday-Thursday optimal
    if (day >= 2 && day <= 4) {
      return 1.3;
    }

    // Monday and Friday good
    if (day === 1 || day === 5) {
      return 1.1;
    }

    // Weekends poor for B2B
    return 0.6;
  }

  private getTimeOfDayMultiplier(date: Date): number {
    const hour = date.getHours();

    // Peak morning hours
    if (hour >= 9 && hour <= 11) {
      return 1.4;
    }

    // Good afternoon hours
    if (hour >= 14 && hour <= 16) {
      return 1.2;
    }

    // Decent early morning/late afternoon
    if (hour === 8 || hour === 17) {
      return 1.0;
    }

    // Poor timing
    return 0.7;
  }

  private getSeasonalFactors(industry: string): SeasonalFactors {
    return this.seasonalModels.get(industry) || this.createDefaultSeasonalFactors(industry);
  }

  private scoreEngagementPattern(pattern: EngagementPattern | null): number {
    if (!pattern) return 30;

    return Math.min(100, pattern.pattern.consistencyScore * 0.7 + pattern.pattern.engagementVelocity * 10);
  }

  private scoreSeasonalFactors(factors: SeasonalFactors, currentTime: Date): number {
    const totalMultiplier =
      factors.factors.b2bMultiplier *
      factors.factors.weekdayMultiplier *
      factors.factors.timeOfDayMultiplier;

    return Math.min(100, totalMultiplier * 50);
  }

  private scoreIndustryBenchmarks(industry: string, currentTime: Date): number {
    const benchmarks = this.industryBenchmarks.get(industry);
    if (!benchmarks) return 50;

    const hour = currentTime.getHours();
    const day = currentTime.getDay();

    let score = 50;

    if (benchmarks.peakDays.includes(day)) score += 20;
    if (benchmarks.peakHours.includes(hour)) score += 30;

    return Math.min(100, score);
  }

  private getDefaultEngagementPattern(userId: string): EngagementPattern {
    return {
      userId,
      timeframe: 'daily',
      pattern: {
        peakHours: [10, 14],
        peakDays: [2, 3], // Tue, Wed
        peakWeeks: [1, 2, 3, 4],
        averageSessionGap: 24,
        engagementVelocity: 1,
        consistencyScore: 50
      },
      trends: {
        increasing: false,
        decreasing: false,
        stable: true,
        seasonality: 'medium'
      },
      lastUpdated: new Date()
    };
  }

  private getNextBusinessDay(date: Date): Date {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // Skip weekends
    while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    return nextDay;
  }

  private getDayName(dayIndex: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Unknown';
  }

  // =============================================================================
  // ML FORMAT CONVERSION
  // =============================================================================

  toMLFormat(userId: string): Partial<LeadData> {
    const profile = this.timingProfiles.get(userId);

    if (!profile) {
      return { timing: this.getDefaultMLTiming() };
    }

    const currentTime = new Date();

    return {
      timing: {
        dayOfWeek: currentTime.getDay(),
        hourOfDay: currentTime.getHours(),
        monthOfYear: currentTime.getMonth() + 1,
        quarterOfYear: Math.ceil((currentTime.getMonth() + 1) / 3),
        seasonality: profile.engagementPattern.trends.seasonality,
        recentActivity: profile.urgencyIndicators.indicators.timeDecay.daysSinceLastActivity <= 1,
        engagementVelocity: profile.engagementPattern.pattern.engagementVelocity,
        lastVisitDays: profile.urgencyIndicators.indicators.timeDecay.daysSinceLastActivity,
        accountAge: profile.urgencyIndicators.indicators.timeDecay.daysSinceFirstVisit
      }
    };
  }

  private getDefaultMLTiming(): LeadData['timing'] {
    const now = new Date();

    return {
      dayOfWeek: now.getDay(),
      hourOfDay: now.getHours(),
      monthOfYear: now.getMonth() + 1,
      quarterOfYear: Math.ceil((now.getMonth() + 1) / 3),
      seasonality: 'medium',
      recentActivity: false,
      engagementVelocity: 0,
      lastVisitDays: 0,
      accountAge: 0
    };
  }

  // =============================================================================
  // HEALTH CHECK AND UTILITIES
  // =============================================================================

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeProfiles: number;
    totalTimingData: number;
    avgDataPerUser: number;
    seasonalModels: number;
  }> {
    let totalDataPoints = 0;
    for (const userData of this.timingData.values()) {
      totalDataPoints += userData.length;
    }

    const avgDataPerUser = this.timingData.size > 0 ? totalDataPoints / this.timingData.size : 0;

    return {
      status: 'healthy',
      activeProfiles: this.timingProfiles.size,
      totalTimingData: totalDataPoints,
      avgDataPerUser: Math.round(avgDataPerUser * 100) / 100,
      seasonalModels: this.seasonalModels.size
    };
  }

  clearData(): void {
    this.timingData.clear();
    this.engagementPatterns.clear();
    this.timingProfiles.clear();
  }
}

// Export singleton instance
export const timingFactorService = TimingFactorService.getInstance();
