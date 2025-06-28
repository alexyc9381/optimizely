import { EventEmitter } from 'events';
import { Redis } from 'ioredis';

// =============================================================================
// UNIVERSAL COMPETITIVE INTELLIGENCE INTERFACES
// =============================================================================

export interface Competitor {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  headquarters: {
    country: string;
    region: string;
    city?: string;
  };
  businessModel: string[];
  targetMarkets: string[];
  keyProducts: string[];
  fundingInfo: {
    stage?: string;
    totalFunding?: number;
    lastFundingDate?: Date;
    investors?: string[];
  };
  employeeCount?: number;
  revenue?: number;
  publiclyTraded: boolean;
  stockSymbol?: string;
  socialPresence: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    followers: Record<string, number>;
  };
  metadata: {
    addedDate: Date;
    lastUpdated: Date;
    confidence: number;
    platform?: string;
    source: string;
  };
}

export interface CompetitiveIntelligence {
  id: string;
  competitorId: string;
  category: 'product' | 'pricing' | 'marketing' | 'hiring' | 'funding' | 'partnerships' | 'technology' | 'strategy';
  type: 'product_launch' | 'price_change' | 'feature_update' | 'job_posting' | 'funding_round' | 'partnership' | 'acquisition' | 'patent' | 'press_release' | 'social_media' | 'website_change' | 'custom';
  title: string;
  description: string;
  content: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: {
    business: number; // 1-10 scale
    competitive: number; // 1-10 scale
    strategic: number; // 1-10 scale
  };
  source: {
    type: 'website' | 'social_media' | 'news' | 'job_board' | 'patent_office' | 'api' | 'manual' | 'third_party';
    url?: string;
    platform?: string;
    author?: string;
  };
  tags: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  actionItems: string[];
  relatedIntelligence: string[]; // IDs of related intelligence
  timestamp: Date;
  expiresAt?: Date;
  isProcessed: boolean;
  processingNotes?: string;
}

export interface MonitoringSource {
  id: string;
  name: string;
  type: 'website' | 'rss_feed' | 'social_media' | 'job_board' | 'news_api' | 'patent_api' | 'custom_api' | 'webhook';
  competitorIds: string[];
  config: {
    url?: string;
    apiKey?: string;
    headers?: Record<string, string>;
    keywords?: string[];
    schedule?: string; // cron expression
    platform?: string;
    filters?: Record<string, any>;
  };
  isActive: boolean;
  lastCheck?: Date;
  checkInterval: number; // minutes
  successCount: number;
  errorCount: number;
  lastError?: string;
}

export interface CompetitiveAnalysis {
  id: string;
  title: string;
  description: string;
  competitorIds: string[];
  analysisType: 'swot' | 'feature_comparison' | 'pricing_analysis' | 'market_positioning' | 'trend_analysis' | 'custom';
  metrics: Array<{
    name: string;
    competitors: Record<string, number | string>;
    benchmark?: number | string;
    trend?: 'improving' | 'declining' | 'stable';
  }>;
  insights: string[];
  recommendations: string[];
  threats: string[];
  opportunities: string[];
  dataPoints: Array<{
    competitorId: string;
    metric: string;
    value: any;
    timestamp: Date;
    source: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  platform?: string;
}

export interface BattleCard {
  id: string;
  competitorId: string;
  title: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  differentiators: string[];
  commonObjections: Array<{
    objection: string;
    response: string;
  }>;
  competitivePositioning: string;
  winningStrategies: string[];
  lossReasons: string[];
  keyMessages: string[];
  supportingEvidence: Array<{
    claim: string;
    evidence: string;
    source: string;
  }>;
  lastUpdated: Date;
  version: string;
  isActive: boolean;
  platform?: string;
}

export interface IntelligenceAlert {
  id: string;
  name: string;
  description: string;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'exists';
    value: any;
  }>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recipients: Array<{
    type: 'email' | 'slack' | 'teams' | 'webhook' | 'sms';
    address: string;
    platform?: string;
  }>;
  isActive: boolean;
  triggerCount: number;
  lastTriggered?: Date;
  platform?: string;
}

export interface CompetitiveMetrics {
  totalCompetitors: number;
  activeMonitoringSources: number;
  intelligenceItemsToday: number;
  criticalAlertsToday: number;
  averageResponseTime: number;
  topCategories: Array<{
    category: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  competitorActivity: Array<{
    competitorId: string;
    name: string;
    activityCount: number;
    lastActivity: Date;
  }>;
  alertEffectiveness: {
    totalAlerts: number;
    actionedAlerts: number;
    falsePositives: number;
  };
}

// =============================================================================
// UNIVERSAL COMPETITIVE INTELLIGENCE ENGINE
// =============================================================================

export class UniversalCompetitiveIntelligenceEngine extends EventEmitter {
  private redis: Redis;
  private competitors: Map<string, Competitor> = new Map();
  private intelligence: Map<string, CompetitiveIntelligence> = new Map();
  private monitoringSources: Map<string, MonitoringSource> = new Map();
  private analyses: Map<string, CompetitiveAnalysis> = new Map();
  private battleCards: Map<string, BattleCard> = new Map();
  private alerts: Map<string, IntelligenceAlert> = new Map();
  private isInitialized = false;
  private monitoringJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor(redisClient: Redis) {
    super();
    this.redis = redisClient;
    this.setupEventHandlers();
  }

  // =============================================================================
  // INITIALIZATION & SETUP
  // =============================================================================

  async initialize(): Promise<void> {
    try {
      await this.loadCompetitors();
      await this.loadIntelligence();
      await this.loadMonitoringSources();
      await this.loadAnalyses();
      await this.loadBattleCards();
      await this.loadAlerts();
      await this.setupMonitoring();
      this.isInitialized = true;
      this.emit('engine:initialized');
      console.log('🎯 Universal Competitive Intelligence Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Competitive Intelligence Engine:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    this.on('intelligence:new', this.processNewIntelligence.bind(this));
    this.on('alert:triggered', this.handleAlert.bind(this));
    this.on('competitor:updated', this.updateRelatedAnalyses.bind(this));
  }

  // =============================================================================
  // COMPETITOR MANAGEMENT
  // =============================================================================

  async addCompetitor(competitor: Omit<Competitor, 'id' | 'metadata'>): Promise<Competitor> {
    const id = `competitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newCompetitor: Competitor = {
      ...competitor,
      id,
      metadata: {
        addedDate: new Date(),
        lastUpdated: new Date(),
        confidence: 0.8,
        source: 'manual',
      },
    };

    this.competitors.set(id, newCompetitor);
    await this.persistCompetitor(newCompetitor);
    this.emit('competitor:added', newCompetitor);

    return newCompetitor;
  }

  async updateCompetitor(id: string, updates: Partial<Competitor>): Promise<Competitor> {
    const competitor = this.competitors.get(id);
    if (!competitor) {
      throw new Error(`Competitor with ID ${id} not found`);
    }

    const updatedCompetitor: Competitor = {
      ...competitor,
      ...updates,
      id,
      metadata: {
        ...competitor.metadata,
        ...updates.metadata,
        lastUpdated: new Date(),
      },
    };

    this.competitors.set(id, updatedCompetitor);
    await this.persistCompetitor(updatedCompetitor);
    this.emit('competitor:updated', updatedCompetitor);

    return updatedCompetitor;
  }

  async deleteCompetitor(id: string): Promise<void> {
    const competitor = this.competitors.get(id);
    if (!competitor) {
      throw new Error(`Competitor with ID ${id} not found`);
    }

    // Remove from monitoring sources
    for (const [sourceId, source] of this.monitoringSources) {
      if (source.competitorIds.includes(id)) {
        const updatedCompetitorIds = source.competitorIds.filter(cId => cId !== id);
        await this.updateMonitoringSource(sourceId, { competitorIds: updatedCompetitorIds });
      }
    }

    this.competitors.delete(id);
    await this.redis.del(`competitor:${id}`);
    this.emit('competitor:deleted', { id, name: competitor.name });
  }

  getCompetitor(id: string): Competitor | undefined {
    return this.competitors.get(id);
  }

  getAllCompetitors(): Competitor[] {
    return Array.from(this.competitors.values());
  }

  getCompetitorsByPlatform(platform: string): Competitor[] {
    return this.getAllCompetitors().filter(c => c.metadata.platform === platform);
  }

  searchCompetitors(criteria: {
    industry?: string;
    size?: string;
    location?: string;
    platform?: string;
    keywords?: string[];
  }): Competitor[] {
    return this.getAllCompetitors().filter(competitor => {
      if (criteria.industry && competitor.industry !== criteria.industry) return false;
      if (criteria.size && competitor.size !== criteria.size) return false;
      if (criteria.location && !competitor.headquarters.country.toLowerCase().includes(criteria.location.toLowerCase())) return false;
      if (criteria.platform && competitor.metadata.platform !== criteria.platform) return false;
      if (criteria.keywords) {
        const searchText = `${competitor.name} ${competitor.keyProducts.join(' ')} ${competitor.businessModel.join(' ')}`.toLowerCase();
        const hasKeyword = criteria.keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
        if (!hasKeyword) return false;
      }
      return true;
    });
  }

  // Route-compatible methods
  async listCompetitors(filters?: Record<string, any>): Promise<Competitor[]> {
    if (!filters || Object.keys(filters).length === 0) {
      return this.getAllCompetitors();
    }
    return this.searchCompetitors(filters);
  }

  async createCompetitor(competitorData: Omit<Competitor, 'id' | 'metadata'>): Promise<Competitor> {
    return this.addCompetitor(competitorData);
  }

  // =============================================================================
  // INTELLIGENCE MANAGEMENT
  // =============================================================================

  async addIntelligence(intelligence: Omit<CompetitiveIntelligence, 'id' | 'isProcessed'>): Promise<CompetitiveIntelligence> {
    const id = `intel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newIntelligence: CompetitiveIntelligence = {
      ...intelligence,
      id,
      isProcessed: false,
    };

    this.intelligence.set(id, newIntelligence);
    await this.persistIntelligence(newIntelligence);
    this.emit('intelligence:new', newIntelligence);

    return newIntelligence;
  }

  async updateIntelligence(id: string, updates: Partial<CompetitiveIntelligence>): Promise<CompetitiveIntelligence> {
    const intelligence = this.intelligence.get(id);
    if (!intelligence) {
      throw new Error(`Intelligence with ID ${id} not found`);
    }

    const updatedIntelligence: CompetitiveIntelligence = {
      ...intelligence,
      ...updates,
      id,
    };

    this.intelligence.set(id, updatedIntelligence);
    await this.persistIntelligence(updatedIntelligence);
    this.emit('intelligence:updated', updatedIntelligence);

    return updatedIntelligence;
  }

  async deleteIntelligence(id: string): Promise<void> {
    const intelligence = this.intelligence.get(id);
    if (!intelligence) {
      throw new Error(`Intelligence with ID ${id} not found`);
    }

    this.intelligence.delete(id);
    await this.redis.del(`intelligence:${id}`);
    this.emit('intelligence:deleted', { id, title: intelligence.title });
  }

  getIntelligence(id: string): CompetitiveIntelligence | undefined {
    return this.intelligence.get(id);
  }

  getAllIntelligence(): CompetitiveIntelligence[] {
    return Array.from(this.intelligence.values());
  }

  getIntelligenceByCompetitor(competitorId: string): CompetitiveIntelligence[] {
    return this.getAllIntelligence().filter(intel => intel.competitorId === competitorId);
  }

  searchIntelligence(criteria: {
    competitorId?: string;
    category?: string;
    type?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    tags?: string[];
    platform?: string;
    limit?: number;
  }): CompetitiveIntelligence[] {
    let results = this.getAllIntelligence();

    if (criteria.competitorId) {
      results = results.filter(intel => intel.competitorId === criteria.competitorId);
    }
    if (criteria.category) {
      results = results.filter(intel => intel.category === criteria.category);
    }
    if (criteria.type) {
      results = results.filter(intel => intel.type === criteria.type);
    }
    if (criteria.severity) {
      results = results.filter(intel => intel.severity === criteria.severity);
    }
    if (criteria.startDate) {
      results = results.filter(intel => intel.timestamp >= criteria.startDate!);
    }
    if (criteria.endDate) {
      results = results.filter(intel => intel.timestamp <= criteria.endDate!);
    }
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(intel =>
        criteria.tags!.some(tag => intel.tags.includes(tag))
      );
    }
    if (criteria.platform) {
      results = results.filter(intel => intel.source.platform === criteria.platform);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (criteria.limit) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  // Route-compatible intelligence methods
  async queryIntelligence(query: Record<string, any>): Promise<CompetitiveIntelligence[]> {
    return this.searchIntelligence(query);
  }

  async getIntelligenceData(id: string): Promise<CompetitiveIntelligence | null> {
    return this.getIntelligence(id) || null;
  }

  async addIntelligenceData(intelligenceData: Omit<CompetitiveIntelligence, 'id' | 'isProcessed'>): Promise<CompetitiveIntelligence> {
    return this.addIntelligence(intelligenceData);
  }

  // Competitive scoring methods
  async calculateCompetitiveScore(competitorId: string): Promise<number> {
    const competitor = this.getCompetitor(competitorId);
    if (!competitor) {
      throw new Error(`Competitor with ID ${competitorId} not found`);
    }

    const intelligence = this.getIntelligenceByCompetitor(competitorId);
    const recentIntelligence = intelligence.filter(intel => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return intel.timestamp >= thirtyDaysAgo;
    });

    // Calculate score based on various factors
    let score = 50; // Base score

    // Activity score (0-25 points)
    const activityScore = Math.min(recentIntelligence.length * 2, 25);
    score += activityScore;

    // Impact score (0-15 points)
    const avgImpact = recentIntelligence.length > 0
      ? recentIntelligence.reduce((sum, intel) => sum + intel.impact.competitive, 0) / recentIntelligence.length
      : 0;
    score += Math.round(avgImpact * 1.5);

    // Severity score (0-10 points)
    const criticalCount = recentIntelligence.filter(intel => intel.severity === 'critical').length;
    const highCount = recentIntelligence.filter(intel => intel.severity === 'high').length;
    score += criticalCount * 5 + highCount * 2;

    return Math.min(Math.max(score, 0), 100);
  }

  async getCompetitiveScore(competitorId: string): Promise<number> {
    // Check if we have a cached score
    const cachedScore = await this.redis.get(`competitive_score:${competitorId}`);
    if (cachedScore) {
      return parseFloat(cachedScore);
    }

    // Calculate and cache the score
    const score = await this.calculateCompetitiveScore(competitorId);
    await this.redis.setex(`competitive_score:${competitorId}`, 3600, score.toString()); // Cache for 1 hour
    return score;
  }

  // =============================================================================
  // MONITORING SOURCES MANAGEMENT
  // =============================================================================

  async addMonitoringSource(source: Omit<MonitoringSource, 'id' | 'lastCheck' | 'successCount' | 'errorCount'>): Promise<MonitoringSource> {
    const id = `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newSource: MonitoringSource = {
      ...source,
      id,
      successCount: 0,
      errorCount: 0,
    };

    this.monitoringSources.set(id, newSource);
    await this.persistMonitoringSource(newSource);

    if (newSource.isActive) {
      await this.setupSourceMonitoring(newSource);
    }

    this.emit('source:added', newSource);
    return newSource;
  }

  async updateMonitoringSource(id: string, updates: Partial<MonitoringSource>): Promise<MonitoringSource> {
    const source = this.monitoringSources.get(id);
    if (!source) {
      throw new Error(`Monitoring source with ID ${id} not found`);
    }

    const updatedSource: MonitoringSource = {
      ...source,
      ...updates,
      id,
    };

    this.monitoringSources.set(id, updatedSource);
    await this.persistMonitoringSource(updatedSource);

    // Update monitoring if active status changed
    if (source.isActive !== updatedSource.isActive) {
      if (updatedSource.isActive) {
        await this.setupSourceMonitoring(updatedSource);
      } else {
        await this.stopSourceMonitoring(id);
      }
    }

    this.emit('source:updated', updatedSource);
    return updatedSource;
  }

  async deleteMonitoringSource(id: string): Promise<void> {
    const source = this.monitoringSources.get(id);
    if (!source) {
      throw new Error(`Monitoring source with ID ${id} not found`);
    }

    await this.stopSourceMonitoring(id);
    this.monitoringSources.delete(id);
    await this.redis.del(`monitoring_source:${id}`);
    this.emit('source:deleted', { id, name: source.name });
  }

  getMonitoringSource(id: string): MonitoringSource | undefined {
    return this.monitoringSources.get(id);
  }

  getAllMonitoringSources(): MonitoringSource[] {
    return Array.from(this.monitoringSources.values());
  }

  getActiveMonitoringSources(): MonitoringSource[] {
    return this.getAllMonitoringSources().filter(source => source.isActive);
  }

  // Route-compatible data source methods
  async listDataSources(active?: boolean): Promise<MonitoringSource[]> {
    if (active === true) {
      return this.getActiveMonitoringSources();
    } else if (active === false) {
      return this.getAllMonitoringSources().filter(source => !source.isActive);
    }
    return this.getAllMonitoringSources();
  }

  async getDataSource(id: string): Promise<MonitoringSource | null> {
    return this.getMonitoringSource(id) || null;
  }

  async createDataSource(sourceData: Omit<MonitoringSource, 'id' | 'lastCheck' | 'successCount' | 'errorCount'>): Promise<MonitoringSource> {
    return this.addMonitoringSource(sourceData);
  }

  // =============================================================================
  // COMPETITIVE ANALYSIS MANAGEMENT
  // =============================================================================

  async createAnalysis(analysis: Omit<CompetitiveAnalysis, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompetitiveAnalysis> {
    const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newAnalysis: CompetitiveAnalysis = {
      ...analysis,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.analyses.set(id, newAnalysis);
    await this.persistAnalysis(newAnalysis);
    this.emit('analysis:created', newAnalysis);

    return newAnalysis;
  }

  async updateAnalysis(id: string, updates: Partial<CompetitiveAnalysis>): Promise<CompetitiveAnalysis> {
    const analysis = this.analyses.get(id);
    if (!analysis) {
      throw new Error(`Analysis with ID ${id} not found`);
    }

    const updatedAnalysis: CompetitiveAnalysis = {
      ...analysis,
      ...updates,
      id,
      updatedAt: new Date(),
    };

    this.analyses.set(id, updatedAnalysis);
    await this.persistAnalysis(updatedAnalysis);
    this.emit('analysis:updated', updatedAnalysis);

    return updatedAnalysis;
  }

  async deleteAnalysis(id: string): Promise<void> {
    const analysis = this.analyses.get(id);
    if (!analysis) {
      throw new Error(`Analysis with ID ${id} not found`);
    }

    this.analyses.delete(id);
    await this.redis.del(`analysis:${id}`);
    this.emit('analysis:deleted', { id, title: analysis.title });
  }

  getAnalysis(id: string): CompetitiveAnalysis | undefined {
    return this.analyses.get(id);
  }

  getAllAnalyses(): CompetitiveAnalysis[] {
    return Array.from(this.analyses.values());
  }

  getAnalysesByType(analysisType: string): CompetitiveAnalysis[] {
    return this.getAllAnalyses().filter(analysis => analysis.analysisType === analysisType);
  }

  // =============================================================================
  // BATTLE CARDS MANAGEMENT
  // =============================================================================

  async createBattleCard(battleCard: Omit<BattleCard, 'id' | 'lastUpdated' | 'version'>): Promise<BattleCard> {
    const id = `battlecard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newBattleCard: BattleCard = {
      ...battleCard,
      id,
      lastUpdated: new Date(),
      version: '1.0',
    };

    this.battleCards.set(id, newBattleCard);
    await this.persistBattleCard(newBattleCard);
    this.emit('battlecard:created', newBattleCard);

    return newBattleCard;
  }

  async updateBattleCard(id: string, updates: Partial<BattleCard>): Promise<BattleCard> {
    const battleCard = this.battleCards.get(id);
    if (!battleCard) {
      throw new Error(`Battle card with ID ${id} not found`);
    }

    // Increment version if content changed
    const contentFields = ['strengths', 'weaknesses', 'differentiators', 'commonObjections', 'competitivePositioning', 'winningStrategies', 'lossReasons', 'keyMessages', 'supportingEvidence'];
    const hasContentChanges = contentFields.some(field => updates[field as keyof BattleCard] !== undefined);

    const updatedBattleCard: BattleCard = {
      ...battleCard,
      ...updates,
      id,
      lastUpdated: new Date(),
      version: hasContentChanges ? this.incrementVersion(battleCard.version) : battleCard.version,
    };

    this.battleCards.set(id, updatedBattleCard);
    await this.persistBattleCard(updatedBattleCard);
    this.emit('battlecard:updated', updatedBattleCard);

    return updatedBattleCard;
  }

  async deleteBattleCard(id: string): Promise<void> {
    const battleCard = this.battleCards.get(id);
    if (!battleCard) {
      throw new Error(`Battle card with ID ${id} not found`);
    }

    this.battleCards.delete(id);
    await this.redis.del(`battlecard:${id}`);
    this.emit('battlecard:deleted', { id, title: battleCard.title });
  }

  getBattleCard(id: string): BattleCard | undefined {
    return this.battleCards.get(id);
  }

  getAllBattleCards(): BattleCard[] {
    return Array.from(this.battleCards.values());
  }

  getBattleCardsByCompetitor(competitorId: string): BattleCard[] {
    return this.getAllBattleCards().filter(card => card.competitorId === competitorId);
  }

  getActiveBattleCards(): BattleCard[] {
    return this.getAllBattleCards().filter(card => card.isActive);
  }

  // =============================================================================
  // ALERT MANAGEMENT
  // =============================================================================

  async createAlert(alert: Omit<IntelligenceAlert, 'id' | 'triggerCount' | 'lastTriggered'>): Promise<IntelligenceAlert> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newAlert: IntelligenceAlert = {
      ...alert,
      id,
      triggerCount: 0,
    };

    this.alerts.set(id, newAlert);
    await this.persistAlert(newAlert);
    this.emit('alert:created', newAlert);

    return newAlert;
  }

  async updateAlert(id: string, updates: Partial<IntelligenceAlert>): Promise<IntelligenceAlert> {
    const alert = this.alerts.get(id);
    if (!alert) {
      throw new Error(`Alert with ID ${id} not found`);
    }

    const updatedAlert: IntelligenceAlert = {
      ...alert,
      ...updates,
      id,
    };

    this.alerts.set(id, updatedAlert);
    await this.persistAlert(updatedAlert);
    this.emit('alert:updated', updatedAlert);

    return updatedAlert;
  }

  async deleteAlert(id: string): Promise<void> {
    const alert = this.alerts.get(id);
    if (!alert) {
      throw new Error(`Alert with ID ${id} not found`);
    }

    this.alerts.delete(id);
    await this.redis.del(`alert:${id}`);
    this.emit('alert:deleted', { id, name: alert.name });
  }

  getAlert(id: string): IntelligenceAlert | undefined {
    return this.alerts.get(id);
  }

  getAllAlerts(): IntelligenceAlert[] {
    return Array.from(this.alerts.values());
  }

  getActiveAlerts(): IntelligenceAlert[] {
    return this.getAllAlerts().filter(alert => alert.isActive);
  }

  // Route-compatible alert methods
  async listAlerts(active?: boolean): Promise<IntelligenceAlert[]> {
    if (active === true) {
      return this.getActiveAlerts();
    } else if (active === false) {
      return this.getAllAlerts().filter(alert => !alert.isActive);
    }
    return this.getAllAlerts();
  }

  // =============================================================================
  // MONITORING & PROCESSING
  // =============================================================================

  private async setupMonitoring(): Promise<void> {
    const activeSources = this.getActiveMonitoringSources();
    for (const source of activeSources) {
      await this.setupSourceMonitoring(source);
    }
  }

  private async setupSourceMonitoring(source: MonitoringSource): Promise<void> {
    // Clear existing job if any
    if (this.monitoringJobs.has(source.id)) {
      clearInterval(this.monitoringJobs.get(source.id)!);
    }

    const intervalMs = source.checkInterval * 60 * 1000; // Convert minutes to milliseconds
    const job = setInterval(async () => {
      await this.checkMonitoringSource(source.id);
    }, intervalMs);

    this.monitoringJobs.set(source.id, job);
    console.log(`📡 Set up monitoring for source: ${source.name} (every ${source.checkInterval} minutes)`);
  }

  private async stopSourceMonitoring(sourceId: string): Promise<void> {
    if (this.monitoringJobs.has(sourceId)) {
      clearInterval(this.monitoringJobs.get(sourceId)!);
      this.monitoringJobs.delete(sourceId);
      console.log(`🛑 Stopped monitoring for source: ${sourceId}`);
    }
  }

  private async checkMonitoringSource(sourceId: string): Promise<void> {
    const source = this.monitoringSources.get(sourceId);
    if (!source || !source.isActive) {
      return;
    }

    try {
      console.log(`🔍 Checking monitoring source: ${source.name}`);

      let newIntelligence: CompetitiveIntelligence[] = [];

      switch (source.type) {
        case 'website':
          newIntelligence = await this.checkWebsiteSource(source);
          break;
        case 'rss_feed':
          newIntelligence = await this.checkRSSFeedSource(source);
          break;
        case 'social_media':
          newIntelligence = await this.checkSocialMediaSource(source);
          break;
        case 'job_board':
          newIntelligence = await this.checkJobBoardSource(source);
          break;
        case 'news_api':
          newIntelligence = await this.checkNewsAPISource(source);
          break;
        case 'custom_api':
          newIntelligence = await this.checkCustomAPISource(source);
          break;
      }

      // Process and store new intelligence
      for (const intel of newIntelligence) {
        await this.addIntelligence(intel);
      }

      // Update source metrics
      await this.updateMonitoringSource(sourceId, {
        lastCheck: new Date(),
        successCount: source.successCount + 1,
        lastError: undefined,
      });

      this.emit('source:checked', { sourceId, newIntelligenceCount: newIntelligence.length });

    } catch (error) {
      console.error(`❌ Error checking monitoring source ${source.name}:`, error);

      await this.updateMonitoringSource(sourceId, {
        lastCheck: new Date(),
        errorCount: source.errorCount + 1,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      });

      this.emit('source:error', { sourceId, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async checkWebsiteSource(source: MonitoringSource): Promise<CompetitiveIntelligence[]> {
    // Placeholder for website monitoring logic
    // In a real implementation, this would scrape websites for changes
    return [];
  }

  private async checkRSSFeedSource(source: MonitoringSource): Promise<CompetitiveIntelligence[]> {
    // Placeholder for RSS feed monitoring logic
    return [];
  }

  private async checkSocialMediaSource(source: MonitoringSource): Promise<CompetitiveIntelligence[]> {
    // Placeholder for social media monitoring logic
    return [];
  }

  private async checkJobBoardSource(source: MonitoringSource): Promise<CompetitiveIntelligence[]> {
    // Placeholder for job board monitoring logic
    return [];
  }

  private async checkNewsAPISource(source: MonitoringSource): Promise<CompetitiveIntelligence[]> {
    // Placeholder for news API monitoring logic
    return [];
  }

  private async checkCustomAPISource(source: MonitoringSource): Promise<CompetitiveIntelligence[]> {
    // Placeholder for custom API monitoring logic
    return [];
  }

  private async processNewIntelligence(intelligence: CompetitiveIntelligence): Promise<void> {
    // Check if intelligence triggers any alerts
    const activeAlerts = this.getActiveAlerts();
    for (const alert of activeAlerts) {
      if (this.evaluateAlertConditions(alert, intelligence)) {
        await this.triggerAlert(alert, intelligence);
      }
    }

    // Auto-tag intelligence based on content
    const autoTags = this.generateAutoTags(intelligence);
    if (autoTags.length > 0) {
      await this.updateIntelligence(intelligence.id, {
        tags: [...intelligence.tags, ...autoTags],
      });
    }

    // Update related battle cards if applicable
    await this.updateRelatedBattleCards(intelligence);

    this.emit('intelligence:processed', intelligence);
  }

  private evaluateAlertConditions(alert: IntelligenceAlert, intelligence: CompetitiveIntelligence): boolean {
    return alert.conditions.every(condition => {
      const fieldValue = this.getIntelligenceFieldValue(intelligence, condition.field);

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'contains':
          return typeof fieldValue === 'string' && fieldValue.toLowerCase().includes(condition.value.toLowerCase());
        case 'greater_than':
          return typeof fieldValue === 'number' && fieldValue > condition.value;
        case 'less_than':
          return typeof fieldValue === 'number' && fieldValue < condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        case 'exists':
          return fieldValue !== undefined && fieldValue !== null;
        default:
          return false;
      }
    });
  }

  private getIntelligenceFieldValue(intelligence: CompetitiveIntelligence, field: string): any {
    const fieldMap: Record<string, any> = {
      'category': intelligence.category,
      'type': intelligence.type,
      'severity': intelligence.severity,
      'competitorId': intelligence.competitorId,
      'impact.business': intelligence.impact.business,
      'impact.competitive': intelligence.impact.competitive,
      'impact.strategic': intelligence.impact.strategic,
      'source.type': intelligence.source.type,
      'source.platform': intelligence.source.platform,
      'sentiment': intelligence.sentiment,
      'tags': intelligence.tags,
    };

    return fieldMap[field];
  }

  private async triggerAlert(alert: IntelligenceAlert, intelligence: CompetitiveIntelligence): Promise<void> {
    try {
      // Send notifications to all recipients
      for (const recipient of alert.recipients) {
        await this.sendAlertNotification(recipient, alert, intelligence);
      }

      // Update alert metrics
      await this.updateAlert(alert.id, {
        triggerCount: alert.triggerCount + 1,
        lastTriggered: new Date(),
      });

      this.emit('alert:triggered', { alert, intelligence });

    } catch (error) {
      console.error(`❌ Error triggering alert ${alert.name}:`, error);
      this.emit('alert:error', { alertId: alert.id, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async sendAlertNotification(recipient: any, alert: IntelligenceAlert, intelligence: CompetitiveIntelligence): Promise<void> {
    // Placeholder for notification sending logic
    // In a real implementation, this would send emails, Slack messages, etc.
    console.log(`📧 Sending ${recipient.type} notification to ${recipient.address} for alert: ${alert.name}`);
  }

  private async handleAlert(data: { alert: IntelligenceAlert; intelligence: CompetitiveIntelligence }): Promise<void> {
    try {
      // Log the alert
      console.log(`Alert triggered: ${data.alert.name} for intelligence: ${data.intelligence.title}`);

      // Update related battle cards if needed
      await this.updateRelatedBattleCards(data.intelligence);

      // Store alert history for analytics
      await this.redis.lpush(
        'alert:history',
        JSON.stringify({
          alertId: data.alert.id,
          intelligenceId: data.intelligence.id,
          timestamp: new Date(),
          severity: data.alert.severity
        })
      );

      // Keep only last 1000 alert history entries
      await this.redis.ltrim('alert:history', 0, 999);
    } catch (error) {
      console.error('Error handling alert:', error);
    }
  }

  private generateAutoTags(intelligence: CompetitiveIntelligence): string[] {
    const tags: string[] = [];

    // Add category-based tags
    tags.push(`category:${intelligence.category}`);

    // Add severity-based tags
    if (intelligence.severity === 'critical' || intelligence.severity === 'high') {
      tags.push('urgent');
    }

    // Add type-based tags
    if (intelligence.type === 'funding_round') {
      tags.push('funding');
    }

    // Add content-based tags
    const content = intelligence.content.toLowerCase();
    if (content.includes('acquisition')) tags.push('m&a');
    if (content.includes('partnership')) tags.push('partnerships');
    if (content.includes('patent')) tags.push('ip');
    if (content.includes('hire') || content.includes('hiring')) tags.push('talent');

    return tags.filter(tag => !intelligence.tags.includes(tag));
  }

  private async updateRelatedBattleCards(intelligence: CompetitiveIntelligence): Promise<void> {
    const battleCards = this.getBattleCardsByCompetitor(intelligence.competitorId);

    for (const battleCard of battleCards) {
      // Add intelligence as supporting evidence if relevant
      if (intelligence.severity === 'high' || intelligence.severity === 'critical') {
        const newEvidence = {
          claim: intelligence.title,
          evidence: intelligence.description,
          source: intelligence.source.url || intelligence.source.type,
        };

        await this.updateBattleCard(battleCard.id, {
          supportingEvidence: [...battleCard.supportingEvidence, newEvidence],
        });
      }
    }
  }

  private async updateRelatedAnalyses(competitor: Competitor): Promise<void> {
    const analyses = this.getAllAnalyses().filter(analysis =>
      analysis.competitorIds.includes(competitor.id)
    );

    for (const analysis of analyses) {
      // Update analysis timestamp to indicate it needs refresh
      await this.updateAnalysis(analysis.id, {
        updatedAt: new Date(),
      });
    }
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const minor = parseInt(parts[1] || '0') + 1;
    return `${parts[0]}.${minor}`;
  }

  // =============================================================================
  // METRICS & ANALYTICS
  // =============================================================================

  async getMetrics(): Promise<CompetitiveMetrics> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const allIntelligence = this.getAllIntelligence();
    const todayIntelligence = allIntelligence.filter(intel => intel.timestamp >= today);
    const criticalToday = todayIntelligence.filter(intel => intel.severity === 'critical');

    // Calculate category distribution
    const categoryCount: Record<string, number> = {};
    allIntelligence.forEach(intel => {
      categoryCount[intel.category] = (categoryCount[intel.category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        count,
        trend: 'stable' as const, // Simplified for now
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate competitor activity
    const competitorActivity = this.getAllCompetitors().map(competitor => {
      const intelligence = this.getIntelligenceByCompetitor(competitor.id);
      const lastIntel = intelligence.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

      return {
        competitorId: competitor.id,
        name: competitor.name,
        activityCount: intelligence.length,
        lastActivity: lastIntel?.timestamp || new Date(0),
      };
    }).sort((a, b) => b.activityCount - a.activityCount);

    // Calculate alert effectiveness
    const allAlerts = this.getAllAlerts();
    const totalTriggers = allAlerts.reduce((sum, alert) => sum + alert.triggerCount, 0);

    return {
      totalCompetitors: this.competitors.size,
      activeMonitoringSources: this.getActiveMonitoringSources().length,
      intelligenceItemsToday: todayIntelligence.length,
      criticalAlertsToday: criticalToday.length,
      averageResponseTime: 0, // Placeholder
      topCategories,
      competitorActivity,
      alertEffectiveness: {
        totalAlerts: allAlerts.length,
        actionedAlerts: totalTriggers,
        falsePositives: 0, // Placeholder
      },
    };
  }

  // =============================================================================
  // PERSISTENCE METHODS
  // =============================================================================

  private async persistCompetitor(competitor: Competitor): Promise<void> {
    await this.redis.setex(`competitor:${competitor.id}`, 86400, JSON.stringify(competitor));
  }

  private async persistIntelligence(intelligence: CompetitiveIntelligence): Promise<void> {
    await this.redis.setex(`intelligence:${intelligence.id}`, 86400, JSON.stringify(intelligence));
  }

  private async persistMonitoringSource(source: MonitoringSource): Promise<void> {
    await this.redis.setex(`monitoring_source:${source.id}`, 86400, JSON.stringify(source));
  }

  private async persistAnalysis(analysis: CompetitiveAnalysis): Promise<void> {
    await this.redis.setex(`analysis:${analysis.id}`, 86400, JSON.stringify(analysis));
  }

  private async persistBattleCard(battleCard: BattleCard): Promise<void> {
    await this.redis.setex(`battlecard:${battleCard.id}`, 86400, JSON.stringify(battleCard));
  }

  private async persistAlert(alert: IntelligenceAlert): Promise<void> {
    await this.redis.setex(`alert:${alert.id}`, 86400, JSON.stringify(alert));
  }

  // =============================================================================
  // LOADING METHODS
  // =============================================================================

  private async loadCompetitors(): Promise<void> {
    const keys = await this.redis.keys('competitor:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const competitor: Competitor = JSON.parse(data);
        this.competitors.set(competitor.id, competitor);
      }
    }
  }

  private async loadIntelligence(): Promise<void> {
    const keys = await this.redis.keys('intelligence:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const intelligence: CompetitiveIntelligence = JSON.parse(data);
        this.intelligence.set(intelligence.id, intelligence);
      }
    }
  }

  private async loadMonitoringSources(): Promise<void> {
    const keys = await this.redis.keys('monitoring_source:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const source: MonitoringSource = JSON.parse(data);
        this.monitoringSources.set(source.id, source);
      }
    }
  }

  private async loadAnalyses(): Promise<void> {
    const keys = await this.redis.keys('analysis:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const analysis: CompetitiveAnalysis = JSON.parse(data);
        this.analyses.set(analysis.id, analysis);
      }
    }
  }

  private async loadBattleCards(): Promise<void> {
    const keys = await this.redis.keys('battlecard:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const battleCard: BattleCard = JSON.parse(data);
        this.battleCards.set(battleCard.id, battleCard);
      }
    }
  }

  private async loadAlerts(): Promise<void> {
    const keys = await this.redis.keys('alert:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const alert: IntelligenceAlert = JSON.parse(data);
        this.alerts.set(alert.id, alert);
      }
    }
  }

  // =============================================================================
  // HEALTH CHECK & SHUTDOWN
  // =============================================================================

  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const redisStatus = await this.redis.ping();
      const activeJobs = this.monitoringJobs.size;
      const metrics = await this.getMetrics();

      return {
        status: 'healthy',
        details: {
          redis: redisStatus === 'PONG' ? 'connected' : 'disconnected',
          initialized: this.isInitialized,
          activeMonitoringJobs: activeJobs,
          totalCompetitors: metrics.totalCompetitors,
          activeSources: metrics.activeMonitoringSources,
          intelligenceToday: metrics.intelligenceItemsToday,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // Route-compatible health method
  async getHealthStatus(): Promise<{ status: string; details: any }> {
    return this.healthCheck();
  }

  // Additional missing methods for route compatibility
  async getTrends(options: {
    timeframe?: string;
    competitorIds?: string[];
    categories?: string[];
    limit?: number
  }): Promise<any> {
    const timeframeDays = options.timeframe === 'week' ? 7 : options.timeframe === 'month' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframeDays);

    let intelligence = this.getAllIntelligence().filter(intel => intel.timestamp >= startDate);

    if (options.competitorIds && options.competitorIds.length > 0) {
      intelligence = intelligence.filter(intel => options.competitorIds!.includes(intel.competitorId));
    }

    if (options.categories && options.categories.length > 0) {
      intelligence = intelligence.filter(intel => options.categories!.includes(intel.category));
    }

    // Group by category and calculate trends
    const trends = intelligence.reduce((acc, intel) => {
      const category = intel.category;
      if (!acc[category]) {
        acc[category] = { count: 0, items: [] };
      }
      acc[category].count++;
      acc[category].items.push(intel);
      return acc;
    }, {} as Record<string, { count: number; items: CompetitiveIntelligence[] }>);

    const result = Object.entries(trends).map(([category, data]) => ({
      category,
      count: data.count,
      trend: data.count > 5 ? 'increasing' : data.count > 2 ? 'stable' : 'decreasing',
      recentItems: data.items.slice(0, 5)
    }));

    return options.limit ? result.slice(0, options.limit) : result;
  }

  async generateInsights(query: any): Promise<any> {
    const intelligence = this.getAllIntelligence();
    const competitors = this.getAllCompetitors();

    const insights = {
      summary: {
        totalIntelligence: intelligence.length,
        totalCompetitors: competitors.length,
        recentActivity: intelligence.filter(i => {
          const lastWeek = new Date();
          lastWeek.setDate(lastWeek.getDate() - 7);
          return i.timestamp >= lastWeek;
        }).length
      },
      topCompetitors: competitors.slice(0, 10).map(c => ({
        id: c.id,
        name: c.name,
        domain: c.domain,
        activityCount: intelligence.filter(i => i.competitorId === c.id).length
      })),
      categoryBreakdown: intelligence.reduce((acc, intel) => {
        acc[intel.category] = (acc[intel.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      severityDistribution: intelligence.reduce((acc, intel) => {
        acc[intel.severity] = (acc[intel.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentHighImpact: intelligence
        .filter(i => i.impact.competitive >= 8)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10)
    };

    return insights;
  }

  async generateReport(config: {
    competitorIds?: string[];
    dateRange?: { start: Date; end: Date };
    categories?: string[];
    format?: 'summary' | 'detailed';
    includeCharts?: boolean;
  }): Promise<any> {
    let intelligence = this.getAllIntelligence();

    // Apply filters
    if (config.competitorIds && config.competitorIds.length > 0) {
      intelligence = intelligence.filter(i => config.competitorIds!.includes(i.competitorId));
    }

    if (config.dateRange) {
      intelligence = intelligence.filter(i =>
        i.timestamp >= config.dateRange!.start && i.timestamp <= config.dateRange!.end
      );
    }

    if (config.categories && config.categories.length > 0) {
      intelligence = intelligence.filter(i => config.categories!.includes(i.category));
    }

    const competitors = this.getAllCompetitors().filter(c =>
      !config.competitorIds || config.competitorIds.includes(c.id)
    );

    const report = {
      metadata: {
        generatedAt: new Date(),
        timeframe: config.dateRange ? {
          start: config.dateRange.start,
          end: config.dateRange.end
        } : 'all_time',
        competitorsAnalyzed: competitors.length,
        intelligenceItemsAnalyzed: intelligence.length
      },
      executiveSummary: {
        keyFindings: [
          `Analyzed ${intelligence.length} intelligence items across ${competitors.length} competitors`,
          `Most active competitor: ${competitors.reduce((max, c) => {
            const count = intelligence.filter(i => i.competitorId === c.id).length;
            const maxCount = intelligence.filter(i => i.competitorId === max.id).length;
            return count > maxCount ? c : max;
          }, competitors[0])?.name || 'N/A'}`,
          `Primary activity category: ${Object.entries(intelligence.reduce((acc, i) => {
            acc[i.category] = (acc[i.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}`
        ],
        riskLevel: intelligence.filter(i => i.severity === 'critical').length > 5 ? 'high' :
                  intelligence.filter(i => i.severity === 'high').length > 10 ? 'medium' : 'low'
      },
      competitorProfiles: competitors.map(c => ({
        ...c,
        activityLevel: intelligence.filter(i => i.competitorId === c.id).length,
        lastActivity: intelligence
          .filter(i => i.competitorId === c.id)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.timestamp
      })),
      intelligenceHighlights: intelligence
        .filter(i => i.impact.competitive >= 7)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 20),
      recommendations: [
        'Monitor high-activity competitors more closely',
        'Focus on critical and high-severity intelligence items',
        'Develop counter-strategies for competitive threats',
        'Leverage identified opportunities in the market'
      ]
    };

    return report;
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Universal Competitive Intelligence Engine...');

    // Clear all monitoring jobs
    for (const [sourceId, job] of this.monitoringJobs) {
      clearInterval(job);
    }
    this.monitoringJobs.clear();

    // Clear data
    this.competitors.clear();
    this.intelligence.clear();
    this.monitoringSources.clear();
    this.analyses.clear();
    this.battleCards.clear();
    this.alerts.clear();

    this.isInitialized = false;
    this.emit('engine:shutdown');
    console.log('✅ Universal Competitive Intelligence Engine shut down successfully');
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createUniversalCompetitiveIntelligenceEngine(redisClient: Redis): UniversalCompetitiveIntelligenceEngine {
  return new UniversalCompetitiveIntelligenceEngine(redisClient);
}

// Default export for backward compatibility
export default UniversalCompetitiveIntelligenceEngine;
