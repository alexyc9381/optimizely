import { EventEmitter } from 'events';
import { LeadData } from './ml-types';

// =============================================================================
// INTENT SIGNAL TYPES - Universal Schema
// =============================================================================

export interface IntentSignal {
  id: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  type: 'content_engagement' | 'behavioral' | 'demographic' | 'temporal' | 'social' | 'technical' | 'competitive';
  category: 'awareness' | 'consideration' | 'evaluation' | 'purchase' | 'advocacy';
  signal: string;
  description: string;
  strength: number; // 0-100
  confidence: number; // 0-100
  decayRate: number; // daily decay percentage
  source: {
    platform: string;
    url?: string;
    feature?: string;
    integration?: string;
  };
  context: {
    content?: string;
    keywords?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    entities?: string[];
    intent_keywords?: string[];
  };
  metadata?: Record<string, any>;
}

export interface IntentProfile {
  userId: string;
  overallScore: number; // 0-100
  trend: 'increasing' | 'stable' | 'decreasing';
  lastUpdated: Date;
  signals: IntentSignal[];
  categories: {
    awareness: number;
    consideration: number;
    evaluation: number;
    purchase: number;
    advocacy: number;
  };
  timeline: {
    week: number;
    month: number;
    quarter: number;
  };
  predictors: {
    purchaseIntent: number; // 0-100
    timeToDecision: number; // days
    dealSize: 'small' | 'medium' | 'large' | 'enterprise';
    confidence: number;
  };
}

export interface IntentRule {
  id: string;
  name: string;
  description: string;
  type: IntentSignal['type'];
  category: IntentSignal['category'];
  conditions: {
    keywords?: string[];
    urlPatterns?: string[];
    behaviors?: string[];
    timeFrame?: number; // minutes
    frequency?: number;
  };
  scoring: {
    baseStrength: number;
    strengthMultiplier: number;
    confidence: number;
    decayRate: number;
  };
  enabled: boolean;
}

export interface ThirdPartyIntentData {
  provider: 'g2' | 'trustradius' | 'capterra' | 'linkedin' | 'bombora' | '6sense' | 'demandbase';
  userId?: string;
  companyDomain?: string;
  signals: {
    topicId: string;
    topicName: string;
    intent_strength: number;
    surge_indicator: boolean;
    weekly_trend: 'up' | 'down' | 'stable';
    company_size?: string;
    industry?: string;
  }[];
  timestamp: Date;
  confidence: number;
}

// =============================================================================
// INTENT DETECTION SERVICE - Advanced Signal Processing
// =============================================================================

export class IntentDetectionService extends EventEmitter {
  private static instance: IntentDetectionService;
  private intentSignals: Map<string, IntentSignal[]>; // userId -> signals
  private intentProfiles: Map<string, IntentProfile>; // userId -> profile
  private intentRules: Map<string, IntentRule>; // ruleId -> rule
  private thirdPartyData: Map<string, ThirdPartyIntentData[]>; // userId -> data
  private keywordMap: Map<string, { intent: string; strength: number }>;
  private competitorKeywords: Set<string>;

  constructor() {
    super();
    this.intentSignals = new Map();
    this.intentProfiles = new Map();
    this.intentRules = new Map();
    this.thirdPartyData = new Map();
    this.keywordMap = new Map();
    this.competitorKeywords = new Set();

    this.initializeRules();
    this.initializeKeywords();
  }

  static getInstance(): IntentDetectionService {
    if (!IntentDetectionService.instance) {
      IntentDetectionService.instance = new IntentDetectionService();
    }
    return IntentDetectionService.instance;
  }

  // =============================================================================
  // INTENT SIGNAL DETECTION - Core Processing
  // =============================================================================

  async detectIntentFromContent(
    userId: string,
    content: string,
    context: {
      url?: string;
      platform?: string;
      sessionId?: string;
    }
  ): Promise<IntentSignal[]> {
    const signals: IntentSignal[] = [];
    const normalizedContent = content.toLowerCase();

    // Keyword-based intent detection
    const keywordSignals = this.detectKeywordIntent(normalizedContent, userId, context);
    signals.push(...keywordSignals);

    // URL pattern-based intent detection
    if (context.url) {
      const urlSignals = this.detectUrlPatternIntent(context.url, userId, context);
      signals.push(...urlSignals);
    }

    // NLP-based sentiment and entity detection
    const nlpSignals = await this.detectNLPIntent(content, userId, context);
    signals.push(...nlpSignals);

    // Store and emit signals
    for (const signal of signals) {
      await this.storeIntentSignal(signal);
      this.emit('intent:signal_detected', signal);
    }

    // Update user profile
    await this.updateIntentProfile(userId);

    return signals;
  }

  async detectIntentFromBehavior(
    userId: string,
    behavior: {
      action: string;
      duration?: number;
      frequency?: number;
      context?: Record<string, any>;
    },
    context: {
      sessionId?: string;
      platform?: string;
    }
  ): Promise<IntentSignal[]> {
    const signals: IntentSignal[] = [];

    // Apply behavioral intent rules
    for (const rule of this.intentRules.values()) {
      if (rule.type === 'behavioral' && rule.enabled) {
        const signal = this.evaluateBehavioralRule(rule, behavior, userId, context);
        if (signal) {
          signals.push(signal);
          await this.storeIntentSignal(signal);
          this.emit('intent:signal_detected', signal);
        }
      }
    }

    await this.updateIntentProfile(userId);
    return signals;
  }

  async processThirdPartyIntent(data: ThirdPartyIntentData): Promise<IntentSignal[]> {
    const signals: IntentSignal[] = [];
    const userId = data.userId || `company:${data.companyDomain}`;

    for (const topicSignal of data.signals) {
      const signal: IntentSignal = {
        id: this.generateSignalId(),
        userId,
        timestamp: data.timestamp,
        type: 'demographic',
        category: this.mapTopicToCategory(topicSignal.topicName),
        signal: `third_party_${data.provider}_${topicSignal.topicId}`,
        description: `${data.provider} intent signal for ${topicSignal.topicName}`,
        strength: topicSignal.intent_strength,
        confidence: data.confidence,
        decayRate: this.calculateDecayRate(data.provider),
        source: {
          platform: data.provider,
          integration: `${data.provider}_api`
        },
        context: {
          keywords: [topicSignal.topicName],
          entities: [topicSignal.company_size, topicSignal.industry].filter(Boolean) as string[]
        },
        metadata: {
          surge_indicator: topicSignal.surge_indicator,
          weekly_trend: topicSignal.weekly_trend,
          provider_topic_id: topicSignal.topicId
        }
      };

      signals.push(signal);
      await this.storeIntentSignal(signal);
      this.emit('intent:signal_detected', signal);
    }

    // Store third-party data
    const existingData = this.thirdPartyData.get(userId) || [];
    existingData.push(data);
    this.thirdPartyData.set(userId, existingData);

    await this.updateIntentProfile(userId);
    return signals;
  }

  // =============================================================================
  // KEYWORD AND PATTERN DETECTION
  // =============================================================================

  private detectKeywordIntent(
    content: string,
    userId: string,
    context: any
  ): IntentSignal[] {
    const signals: IntentSignal[] = [];

    for (const [keyword, intentData] of this.keywordMap) {
      if (content.includes(keyword)) {
        const signal: IntentSignal = {
          id: this.generateSignalId(),
          userId,
          sessionId: context.sessionId,
          timestamp: new Date(),
          type: 'content_engagement',
          category: this.inferCategoryFromKeyword(keyword),
          signal: `keyword_match_${keyword.replace(/\s+/g, '_')}`,
          description: `Content contains intent keyword: ${keyword}`,
          strength: intentData.strength,
          confidence: 80,
          decayRate: 5, // 5% daily decay
          source: {
            platform: context.platform || 'web',
            url: context.url
          },
          context: {
            content: content.substring(0, 200),
            keywords: [keyword],
            intent_keywords: [keyword]
          }
        };

        signals.push(signal);
      }
    }

    // Competitor mention detection
    for (const competitor of this.competitorKeywords) {
      if (content.includes(competitor)) {
        const signal: IntentSignal = {
          id: this.generateSignalId(),
          userId,
          sessionId: context.sessionId,
          timestamp: new Date(),
          type: 'competitive',
          category: 'evaluation',
          signal: `competitor_mention_${competitor.replace(/\s+/g, '_')}`,
          description: `Mentioned competitor: ${competitor}`,
          strength: 75,
          confidence: 90,
          decayRate: 3,
          source: {
            platform: context.platform || 'web',
            url: context.url
          },
          context: {
            content: content.substring(0, 200),
            keywords: [competitor],
            entities: [competitor]
          }
        };

        signals.push(signal);
      }
    }

    return signals;
  }

  private detectUrlPatternIntent(
    url: string,
    userId: string,
    context: any
  ): IntentSignal[] {
    const signals: IntentSignal[] = [];
    const urlLower = url.toLowerCase();

    // High-intent URL patterns
    const urlPatterns = [
      { pattern: '/pricing', category: 'purchase', strength: 85, signal: 'pricing_page_visit' },
      { pattern: '/demo', category: 'evaluation', strength: 90, signal: 'demo_request' },
      { pattern: '/trial', category: 'evaluation', strength: 88, signal: 'trial_signup' },
      { pattern: '/contact', category: 'purchase', strength: 85, signal: 'contact_intent' },
      { pattern: '/enterprise', category: 'evaluation', strength: 80, signal: 'enterprise_interest' },
      { pattern: '/features', category: 'consideration', strength: 60, signal: 'feature_exploration' },
      { pattern: '/integration', category: 'evaluation', strength: 75, signal: 'integration_research' },
      { pattern: '/api', category: 'evaluation', strength: 85, signal: 'technical_evaluation' },
      { pattern: '/documentation', category: 'evaluation', strength: 70, signal: 'technical_research' },
      { pattern: '/case-study', category: 'consideration', strength: 65, signal: 'social_proof_seeking' },
      { pattern: '/security', category: 'evaluation', strength: 75, signal: 'security_evaluation' }
    ];

    for (const pattern of urlPatterns) {
      if (urlLower.includes(pattern.pattern)) {
        const signal: IntentSignal = {
          id: this.generateSignalId(),
          userId,
          sessionId: context.sessionId,
          timestamp: new Date(),
          type: 'behavioral',
          category: pattern.category as IntentSignal['category'],
          signal: pattern.signal,
          description: `Visited ${pattern.pattern} page`,
          strength: pattern.strength,
          confidence: 85,
          decayRate: 4,
          source: {
            platform: context.platform || 'web',
            url: url
          },
          context: {
            keywords: [pattern.pattern.replace('/', '')]
          }
        };

        signals.push(signal);
      }
    }

    return signals;
  }

  // =============================================================================
  // NLP PROCESSING - Advanced Content Analysis
  // =============================================================================

  private async detectNLPIntent(
    content: string,
    userId: string,
    context: any
  ): Promise<IntentSignal[]> {
    const signals: IntentSignal[] = [];

    // Simplified NLP analysis (in production, integrate with proper NLP services)
    const sentiment = this.analyzeSentiment(content);
    const entities = this.extractEntities(content);
    const intentKeywords = this.extractIntentKeywords(content);

    // Create signals based on NLP analysis
    if (intentKeywords.length > 0) {
      const signal: IntentSignal = {
        id: this.generateSignalId(),
        userId,
        sessionId: context.sessionId,
        timestamp: new Date(),
        type: 'content_engagement',
        category: this.inferCategoryFromContent(content),
        signal: 'nlp_intent_detected',
        description: `NLP detected intent keywords: ${intentKeywords.join(', ')}`,
        strength: Math.min(90, intentKeywords.length * 20),
        confidence: 75,
        decayRate: 6,
        source: {
          platform: context.platform || 'web',
          url: context.url
        },
        context: {
          content: content.substring(0, 300),
          keywords: intentKeywords,
          sentiment,
          entities,
          intent_keywords: intentKeywords
        }
      };

      signals.push(signal);
    }

    return signals;
  }

  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'love', 'awesome', 'amazing', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'worst'];

    const contentLower = content.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (contentLower.includes(word)) positiveCount++;
    }

    for (const word of negativeWords) {
      if (contentLower.includes(word)) negativeCount++;
    }

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractEntities(content: string): string[] {
    // Simplified entity extraction
    const commonEntities = [
      'company', 'business', 'enterprise', 'startup', 'organization',
      'software', 'platform', 'solution', 'tool', 'service',
      'integration', 'api', 'analytics', 'dashboard', 'automation'
    ];

    const contentLower = content.toLowerCase();
    return commonEntities.filter(entity => contentLower.includes(entity));
  }

  private extractIntentKeywords(content: string): string[] {
    const intentKeywords = [
      'buy', 'purchase', 'price', 'cost', 'budget', 'invest',
      'evaluate', 'compare', 'demo', 'trial', 'test',
      'implement', 'deploy', 'integrate', 'migrate',
      'contract', 'agreement', 'proposal', 'quote'
    ];

    const contentLower = content.toLowerCase();
    return intentKeywords.filter(keyword => contentLower.includes(keyword));
  }

  // =============================================================================
  // RULE EVALUATION AND SCORING
  // =============================================================================

  private evaluateBehavioralRule(
    rule: IntentRule,
    behavior: any,
    userId: string,
    context: any
  ): IntentSignal | null {
    // Simplified rule evaluation
    if (rule.conditions.behaviors?.includes(behavior.action)) {
      return {
        id: this.generateSignalId(),
        userId,
        sessionId: context.sessionId,
        timestamp: new Date(),
        type: rule.type,
        category: rule.category,
        signal: `rule_${rule.id}`,
        description: rule.description,
        strength: rule.scoring.baseStrength,
        confidence: rule.scoring.confidence,
        decayRate: rule.scoring.decayRate,
        source: {
          platform: context.platform || 'web'
        },
        context: {
          keywords: [behavior.action]
        },
        metadata: {
          rule_id: rule.id,
          rule_name: rule.name
        }
      };
    }

    return null;
  }

  // =============================================================================
  // PROFILE MANAGEMENT AND SCORING
  // =============================================================================

  private async updateIntentProfile(userId: string): Promise<IntentProfile> {
    const signals = this.intentSignals.get(userId) || [];
    const now = new Date();

    // Apply decay to signals
    const activeSignals = signals.map(signal => ({
      ...signal,
      strength: this.applyDecay(signal.strength, signal.decayRate, signal.timestamp, now)
    })).filter(signal => signal.strength > 10); // Filter out weak signals

    // Calculate category scores
    const categories = {
      awareness: this.calculateCategoryScore(activeSignals, 'awareness'),
      consideration: this.calculateCategoryScore(activeSignals, 'consideration'),
      evaluation: this.calculateCategoryScore(activeSignals, 'evaluation'),
      purchase: this.calculateCategoryScore(activeSignals, 'purchase'),
      advocacy: this.calculateCategoryScore(activeSignals, 'advocacy')
    };

    // Calculate overall score
    const overallScore = Math.round(
      (categories.awareness * 0.1 +
       categories.consideration * 0.2 +
       categories.evaluation * 0.3 +
       categories.purchase * 0.4) *
      Math.min(1, activeSignals.length / 10) // Signal volume multiplier
    );

    // Determine trend
    const recentSignals = activeSignals.filter(s =>
      now.getTime() - s.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );
    const olderSignals = activeSignals.filter(s =>
      now.getTime() - s.timestamp.getTime() >= 7 * 24 * 60 * 60 * 1000
    );

    const recentAvg = recentSignals.length > 0 ?
      recentSignals.reduce((sum, s) => sum + s.strength, 0) / recentSignals.length : 0;
    const olderAvg = olderSignals.length > 0 ?
      olderSignals.reduce((sum, s) => sum + s.strength, 0) / olderSignals.length : 0;

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentAvg > olderAvg * 1.2) trend = 'increasing';
    else if (recentAvg < olderAvg * 0.8) trend = 'decreasing';

    const profile: IntentProfile = {
      userId,
      overallScore,
      trend,
      lastUpdated: now,
      signals: activeSignals,
      categories,
      timeline: {
        week: this.calculateTimelineScore(activeSignals, 7),
        month: this.calculateTimelineScore(activeSignals, 30),
        quarter: this.calculateTimelineScore(activeSignals, 90)
      },
      predictors: {
        purchaseIntent: Math.min(100, categories.purchase + categories.evaluation * 0.5),
        timeToDecision: this.estimateTimeToDecision(categories, trend),
        dealSize: this.estimateDealSize(activeSignals),
        confidence: Math.min(100, activeSignals.length * 5)
      }
    };

    this.intentProfiles.set(userId, profile);
    this.emit('intent:profile_updated', profile);

    return profile;
  }

  private calculateCategoryScore(signals: IntentSignal[], category: string): number {
    const categorySignals = signals.filter(s => s.category === category);
    if (categorySignals.length === 0) return 0;

    const weightedSum = categorySignals.reduce((sum, signal) =>
      sum + (signal.strength * signal.confidence / 100), 0
    );

    return Math.min(100, weightedSum / categorySignals.length);
  }

  private applyDecay(
    originalStrength: number,
    decayRate: number,
    signalTime: Date,
    currentTime: Date
  ): number {
    const daysPassed = (currentTime.getTime() - signalTime.getTime()) / (1000 * 60 * 60 * 24);
    const decayFactor = Math.pow(1 - decayRate / 100, daysPassed);
    return Math.max(0, originalStrength * decayFactor);
  }

  private calculateTimelineScore(signals: IntentSignal[], days: number): number {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const timelineSignals = signals.filter(s => s.timestamp >= cutoff);

    if (timelineSignals.length === 0) return 0;

    return Math.min(100,
      timelineSignals.reduce((sum, s) => sum + s.strength, 0) / timelineSignals.length
    );
  }

  private estimateTimeToDecision(
    categories: IntentProfile['categories'],
    trend: IntentProfile['trend']
  ): number {
    let baseDays = 60; // Default 60 days

    // Adjust based on category scores
    if (categories.purchase > 70) baseDays = 14;
    else if (categories.evaluation > 60) baseDays = 30;
    else if (categories.consideration > 50) baseDays = 45;

    // Adjust based on trend
    if (trend === 'increasing') baseDays *= 0.7;
    else if (trend === 'decreasing') baseDays *= 1.5;

    return Math.round(baseDays);
  }

  private estimateDealSize(signals: IntentSignal[]): 'small' | 'medium' | 'large' | 'enterprise' {
    const enterpriseSignals = signals.filter(s =>
      s.signal.includes('enterprise') ||
      s.context?.keywords?.some(k => k.includes('enterprise'))
    );

    const technicalSignals = signals.filter(s =>
      s.type === 'technical' ||
      s.signal.includes('api') ||
      s.signal.includes('integration')
    );

    if (enterpriseSignals.length > 0) return 'enterprise';
    if (technicalSignals.length > 2) return 'large';
    if (signals.length > 10) return 'medium';
    return 'small';
  }

  // =============================================================================
  // UTILITY AND INITIALIZATION METHODS
  // =============================================================================

  private initializeRules(): void {
    const defaultRules: IntentRule[] = [
      {
        id: 'pricing_page_visit',
        name: 'Pricing Page Visit',
        description: 'User visited pricing page',
        type: 'behavioral',
        category: 'purchase',
        conditions: { urlPatterns: ['/pricing'] },
        scoring: { baseStrength: 85, strengthMultiplier: 1.0, confidence: 90, decayRate: 3 },
        enabled: true
      },
      {
        id: 'demo_request',
        name: 'Demo Request',
        description: 'User requested a demo',
        type: 'behavioral',
        category: 'evaluation',
        conditions: { behaviors: ['demo_request'] },
        scoring: { baseStrength: 95, strengthMultiplier: 1.2, confidence: 95, decayRate: 2 },
        enabled: true
      },
      {
        id: 'trial_signup',
        name: 'Trial Signup',
        description: 'User signed up for trial',
        type: 'behavioral',
        category: 'evaluation',
        conditions: { behaviors: ['trial_signup'] },
        scoring: { baseStrength: 90, strengthMultiplier: 1.1, confidence: 95, decayRate: 1 },
        enabled: true
      }
    ];

    for (const rule of defaultRules) {
      this.intentRules.set(rule.id, rule);
    }
  }

  private initializeKeywords(): void {
    const intentKeywords = [
      { keyword: 'price', intent: 'purchase', strength: 75 },
      { keyword: 'cost', intent: 'purchase', strength: 70 },
      { keyword: 'budget', intent: 'purchase', strength: 80 },
      { keyword: 'buy', intent: 'purchase', strength: 90 },
      { keyword: 'purchase', intent: 'purchase', strength: 95 },
      { keyword: 'demo', intent: 'evaluation', strength: 85 },
      { keyword: 'trial', intent: 'evaluation', strength: 85 },
      { keyword: 'evaluate', intent: 'evaluation', strength: 80 },
      { keyword: 'compare', intent: 'consideration', strength: 70 },
      { keyword: 'alternative', intent: 'consideration', strength: 75 },
      { keyword: 'integration', intent: 'evaluation', strength: 85 },
      { keyword: 'implement', intent: 'evaluation', strength: 80 }
    ];

    for (const item of intentKeywords) {
      this.keywordMap.set(item.keyword, { intent: item.intent, strength: item.strength });
    }

    // Initialize competitor keywords
    const competitors = [
      'salesforce', 'hubspot', 'marketo', 'pardot', 'eloqua',
      'adobe campaign', 'mailchimp', 'constant contact'
    ];

    for (const competitor of competitors) {
      this.competitorKeywords.add(competitor);
    }
  }

  private inferCategoryFromKeyword(keyword: string): IntentSignal['category'] {
    const keywordData = this.keywordMap.get(keyword);
    if (keywordData) {
      switch (keywordData.intent) {
        case 'purchase': return 'purchase';
        case 'evaluation': return 'evaluation';
        case 'consideration': return 'consideration';
        default: return 'awareness';
      }
    }
    return 'awareness';
  }

  private inferCategoryFromContent(content: string): IntentSignal['category'] {
    const contentLower = content.toLowerCase();

    if (contentLower.includes('buy') || contentLower.includes('price')) return 'purchase';
    if (contentLower.includes('demo') || contentLower.includes('trial')) return 'evaluation';
    if (contentLower.includes('compare') || contentLower.includes('feature')) return 'consideration';

    return 'awareness';
  }

  private mapTopicToCategory(topicName: string): IntentSignal['category'] {
    const topicLower = topicName.toLowerCase();

    if (topicLower.includes('pricing') || topicLower.includes('purchase')) return 'purchase';
    if (topicLower.includes('evaluation') || topicLower.includes('demo')) return 'evaluation';
    if (topicLower.includes('comparison') || topicLower.includes('research')) return 'consideration';

    return 'awareness';
  }

  private calculateDecayRate(provider: string): number {
    // Different providers have different signal persistence
    switch (provider) {
      case 'bombora': return 2; // High persistence
      case '6sense': return 3;
      case 'demandbase': return 3;
      case 'linkedin': return 5;
      case 'g2': return 7;
      default: return 5;
    }
  }

  private async storeIntentSignal(signal: IntentSignal): Promise<void> {
    const userSignals = this.intentSignals.get(signal.userId || '') || [];
    userSignals.push(signal);
    this.intentSignals.set(signal.userId || '', userSignals);

    // Keep only last 100 signals per user to manage memory
    if (userSignals.length > 100) {
      userSignals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      this.intentSignals.set(signal.userId || '', userSignals.slice(0, 100));
    }
  }

  private generateSignalId(): string {
    return `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // =============================================================================
  // PUBLIC API METHODS - Universal Access
  // =============================================================================

  async getIntentProfile(userId: string): Promise<IntentProfile | null> {
    return this.intentProfiles.get(userId) || null;
  }

  async getIntentSignals(
    userId: string,
    options: {
      category?: IntentSignal['category'];
      type?: IntentSignal['type'];
      limit?: number;
      minStrength?: number;
    } = {}
  ): Promise<IntentSignal[]> {
    let signals = this.intentSignals.get(userId) || [];

    // Apply filters
    if (options.category) {
      signals = signals.filter(s => s.category === options.category);
    }
    if (options.type) {
      signals = signals.filter(s => s.type === options.type);
    }
    if (options.minStrength !== undefined) {
      signals = signals.filter(s => s.strength >= options.minStrength!);
    }

    // Sort by timestamp (newest first) and limit
    signals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options.limit) {
      signals = signals.slice(0, options.limit);
    }

    return signals;
  }

  // Convert to ML format
  toMLFormat(userId: string): Partial<LeadData> {
    const profile = this.intentProfiles.get(userId);

    if (!profile) {
      return { intent: this.getDefaultMLIntent() };
    }

    return {
      intent: {
        searchKeywords: [],
        competitorResearch: this.countCompetitorSignals(profile.signals) > 0,
        buyingStageSignals: {
          awareness: profile.categories.awareness,
          consideration: profile.categories.consideration,
          decision: profile.categories.evaluation,
          purchase: profile.categories.purchase
        },
        contentTopicsEngaged: [],
        urgencyIndicators: {
          fastTrackRequests: profile.predictors.purchaseIntent > 80,
          demoRequests: 0,
          contactFormSubmissions: 0,
          salesInquiries: 0
        },
        socialProof: {
          testimonialViews: 0,
          caseStudyDownloads: 0,
          customerSuccessStories: 0
        }
      }
    };
  }

  private getDefaultMLIntent(): LeadData['intent'] {
    return {
      searchKeywords: [],
      competitorResearch: false,
      buyingStageSignals: {
        awareness: 0,
        consideration: 0,
        decision: 0,
        purchase: 0
      },
      contentTopicsEngaged: [],
      urgencyIndicators: {
        fastTrackRequests: false,
        demoRequests: 0,
        contactFormSubmissions: 0,
        salesInquiries: 0
      },
      socialProof: {
        testimonialViews: 0,
        caseStudyDownloads: 0,
        customerSuccessStories: 0
      }
    };
  }

  private countCompetitorSignals(signals: IntentSignal[]): number {
    return signals.filter(s => s.type === 'competitive').length;
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeProfiles: number;
    totalSignals: number;
    rulesEnabled: number;
    thirdPartyConnections: number;
  }> {
    let totalSignals = 0;
    for (const signals of this.intentSignals.values()) {
      totalSignals += signals.length;
    }

    const rulesEnabled = Array.from(this.intentRules.values())
      .filter(rule => rule.enabled).length;

    const thirdPartyConnections = this.thirdPartyData.size;

    return {
      status: 'healthy',
      activeProfiles: this.intentProfiles.size,
      totalSignals,
      rulesEnabled,
      thirdPartyConnections
    };
  }

  // Clear data (for testing)
  clearData(): void {
    this.intentSignals.clear();
    this.intentProfiles.clear();
    this.thirdPartyData.clear();
  }
}

// Export singleton instance
export const intentDetectionService = IntentDetectionService.getInstance();
