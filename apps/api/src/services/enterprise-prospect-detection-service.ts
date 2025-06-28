import { EventEmitter } from 'events';
import { Redis } from 'ioredis';

// =============================================================================
// UNIVERSAL PROSPECT DETECTION INTERFACES
// =============================================================================

export interface ProspectProfile {
  id: string;
  companyName: string;
  domain: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  revenue?: number;
  employeeCount?: number;
  location: {
    country: string;
    region: string;
    city?: string;
  };
  technographics: {
    technologies: string[];
    platforms: string[];
    integrations: string[];
  };
  firmographics: {
    foundedYear?: number;
    fundingStage?: string;
    fundingAmount?: number;
    publiclyTraded: boolean;
  };
  digitalPresence: {
    website: string;
    socialProfiles: Record<string, string>;
    contentActivity: number;
    seoRanking?: number;
  };
  contactInformation: {
    email?: string;
    phone?: string;
    address?: string;
  };
  metadata: {
    source: string;
    platform?: string;
    lastUpdated: Date;
    confidence: number;
  };
}

export interface ProspectScore {
  overall: number;
  breakdown: {
    fit: number;          // How well they match ICP
    intent: number;       // Buying intent signals
    engagement: number;   // Interaction with content
    timing: number;       // Timing indicators
    authority: number;    // Decision-making authority
  };
  factors: Array<{
    factor: string;
    impact: number;
    weight: number;
    description: string;
  }>;
  lastCalculated: Date;
}

export interface QualificationRule {
  id: string;
  name: string;
  description: string;
  category: 'inclusion' | 'exclusion' | 'scoring';
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'exists';
    value: any;
    weight?: number;
  }>;
  action: {
    type: 'qualify' | 'disqualify' | 'score' | 'tag' | 'route';
    value: any;
  };
  isActive: boolean;
  priority: number;
  platform?: string; // Universal platform support
}

export interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'csv' | 'database' | 'scraping' | 'integration';
  config: {
    url?: string;
    apiKey?: string;
    headers?: Record<string, string>;
    schedule?: string; // cron expression
    mapping?: Record<string, string>; // field mapping
    platform?: string;
  };
  isActive: boolean;
  lastSync?: Date;
  recordCount: number;
  errorCount: number;
}

export interface ProspectEnrichment {
  prospectId: string;
  enrichmentType: 'company' | 'contact' | 'technographic' | 'intent' | 'social';
  data: Record<string, any>;
  source: string;
  confidence: number;
  timestamp: Date;
  cost?: number;
}

export interface ProspectActivity {
  id: string;
  prospectId: string;
  type: 'website_visit' | 'content_download' | 'email_open' | 'demo_request' | 'trial_signup' | 'custom';
  details: Record<string, any>;
  timestamp: Date;
  source: string;
  platform?: string;
  score: number;
}

export interface DetectionMetrics {
  totalProspects: number;
  qualifiedProspects: number;
  newProspectsToday: number;
  averageScore: number;
  conversionRate: number;
  topSources: Array<{
    source: string;
    count: number;
    quality: number;
  }>;
  scoreDistribution: Record<string, number>;
  industryBreakdown: Record<string, number>;
}

// =============================================================================
// UNIVERSAL PROSPECT DETECTION ENGINE
// =============================================================================

export class UniversalProspectDetectionEngine extends EventEmitter {
  private redis: Redis;
  private prospects: Map<string, ProspectProfile> = new Map();
  private scores: Map<string, ProspectScore> = new Map();
  private rules: Map<string, QualificationRule> = new Map();
  private dataSources: Map<string, DataSource> = new Map();
  private activities: Map<string, ProspectActivity[]> = new Map();
  private isInitialized = false;
  private syncJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor(redisClient: Redis) {
    super();
    this.redis = redisClient;
    this.setupDefaultRules();
  }

  // =============================================================================
  // INITIALIZATION & SETUP
  // =============================================================================

  async initialize(): Promise<void> {
    try {
      await this.loadProspects();
      await this.loadScores();
      await this.loadRules();
      await this.loadDataSources();
      await this.setupDataSourceSync();
      this.isInitialized = true;
      this.emit('engine:initialized');
      console.log('🎯 Universal Prospect Detection Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Prospect Detection Engine:', error);
      throw error;
    }
  }

  private setupDefaultRules(): void {
    // Default qualification rules for universal prospect detection
    const defaultRules: QualificationRule[] = [
      {
        id: 'min_company_size',
        name: 'Minimum Company Size',
        description: 'Companies must have at least 10 employees',
        category: 'inclusion',
        conditions: [
          { field: 'employeeCount', operator: 'greater_than', value: 10 }
        ],
        action: { type: 'qualify', value: true },
        isActive: true,
        priority: 1,
      },
      {
        id: 'exclude_competitors',
        name: 'Exclude Competitors',
        description: 'Exclude direct competitors from prospect list',
        category: 'exclusion',
        conditions: [
          { field: 'industry', operator: 'in', value: ['Marketing Software', 'Analytics Platform'] }
        ],
        action: { type: 'disqualify', value: true },
        isActive: true,
        priority: 2,
      },
      {
        id: 'tech_stack_fit',
        name: 'Technology Stack Fit',
        description: 'Score based on technology stack compatibility',
        category: 'scoring',
        conditions: [
          { field: 'technographics.technologies', operator: 'contains', value: 'React', weight: 10 },
          { field: 'technographics.technologies', operator: 'contains', value: 'Node.js', weight: 8 },
          { field: 'technographics.platforms', operator: 'contains', value: 'AWS', weight: 5 },
        ],
        action: { type: 'score', value: 'add_weighted' },
        isActive: true,
        priority: 3,
      },
      {
        id: 'high_intent_signals',
        name: 'High Intent Signals',
        description: 'Boost score for high-intent activities',
        category: 'scoring',
        conditions: [
          { field: 'activities.demo_request', operator: 'exists', value: true, weight: 25 },
          { field: 'activities.trial_signup', operator: 'exists', value: true, weight: 20 },
          { field: 'activities.content_download', operator: 'greater_than', value: 3, weight: 15 },
        ],
        action: { type: 'score', value: 'add_weighted' },
        isActive: true,
        priority: 4,
      },
    ];

    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
  }

  // =============================================================================
  // PROSPECT MANAGEMENT
  // =============================================================================

  async addProspect(prospect: Omit<ProspectProfile, 'id' | 'metadata'>): Promise<ProspectProfile> {
    const id = `prospect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newProspect: ProspectProfile = {
      ...prospect,
      id,
      metadata: {
        source: 'manual',
        lastUpdated: new Date(),
        confidence: 0.8,
      },
    };

    this.prospects.set(id, newProspect);
    await this.persistProspect(newProspect);

    // Calculate initial score
    await this.calculateProspectScore(id);

    this.emit('prospect:added', newProspect);
    return newProspect;
  }

  async updateProspect(id: string, updates: Partial<ProspectProfile>): Promise<ProspectProfile> {
    const prospect = this.prospects.get(id);
    if (!prospect) {
      throw new Error(`Prospect ${id} not found`);
    }

    const updatedProspect = {
      ...prospect,
      ...updates,
      id, // Ensure ID doesn't change
      metadata: {
        ...prospect.metadata,
        ...updates.metadata,
        lastUpdated: new Date(),
      },
    };

    this.prospects.set(id, updatedProspect);
    await this.persistProspect(updatedProspect);

    // Recalculate score after update
    await this.calculateProspectScore(id);

    this.emit('prospect:updated', updatedProspect);
    return updatedProspect;
  }

  async deleteProspect(id: string): Promise<void> {
    const prospect = this.prospects.get(id);
    if (!prospect) {
      throw new Error(`Prospect ${id} not found`);
    }

    this.prospects.delete(id);
    this.scores.delete(id);
    this.activities.delete(id);

    await this.redis.del(`prospect:${id}`);
    await this.redis.del(`score:${id}`);
    await this.redis.del(`activities:${id}`);

    this.emit('prospect:deleted', { prospectId: id });
  }

  getProspect(id: string): ProspectProfile | undefined {
    return this.prospects.get(id);
  }

  getAllProspects(): ProspectProfile[] {
    return Array.from(this.prospects.values());
  }

  getProspectsByPlatform(platform: string): ProspectProfile[] {
    return Array.from(this.prospects.values())
      .filter(p => p.metadata.platform === platform);
  }

  // =============================================================================
  // PROSPECT SCORING
  // =============================================================================

  async calculateProspectScore(prospectId: string): Promise<ProspectScore> {
    const prospect = this.prospects.get(prospectId);
    if (!prospect) {
      throw new Error(`Prospect ${prospectId} not found`);
    }

    const activities = this.activities.get(prospectId) || [];
    const scoreFactors: Array<{ factor: string; impact: number; weight: number; description: string }> = [];

    // Initialize scores
    let fitScore = 0;
    let intentScore = 0;
    let engagementScore = 0;
    let timingScore = 0;
    let authorityScore = 0;

    // Apply qualification rules for scoring
    for (const rule of this.rules.values()) {
      if (!rule.isActive || rule.category !== 'scoring') continue;

      const ruleScore = this.evaluateRule(rule, prospect, activities);
      if (ruleScore > 0) {
        // Distribute score across categories based on rule type
        if (rule.name.toLowerCase().includes('tech') || rule.name.toLowerCase().includes('fit')) {
          fitScore += ruleScore;
        } else if (rule.name.toLowerCase().includes('intent')) {
          intentScore += ruleScore;
        } else if (rule.name.toLowerCase().includes('engagement')) {
          engagementScore += ruleScore;
        } else {
          fitScore += ruleScore * 0.5;
          intentScore += ruleScore * 0.5;
        }

        scoreFactors.push({
          factor: rule.name,
          impact: ruleScore,
          weight: rule.priority,
          description: rule.description,
        });
      }
    }

    // Calculate engagement score from activities
    const recentActivities = activities.filter(a =>
      new Date(a.timestamp).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );
    engagementScore += Math.min(recentActivities.length * 5, 50);

    // Calculate timing score based on recent activity
    const lastActivity = activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    if (lastActivity) {
      const daysSinceLastActivity = (Date.now() - new Date(lastActivity.timestamp).getTime()) / (24 * 60 * 60 * 1000);
      timingScore = Math.max(0, 50 - daysSinceLastActivity * 2);
    }

    // Calculate authority score based on company size and role indicators
    if (prospect.employeeCount) {
      if (prospect.employeeCount > 1000) authorityScore += 30;
      else if (prospect.employeeCount > 100) authorityScore += 20;
      else if (prospect.employeeCount > 10) authorityScore += 10;
    }

    // Normalize scores to 0-100 range
    fitScore = Math.min(fitScore, 100);
    intentScore = Math.min(intentScore, 100);
    engagementScore = Math.min(engagementScore, 100);
    timingScore = Math.min(timingScore, 100);
    authorityScore = Math.min(authorityScore, 100);

    // Calculate overall score with weights
    const overallScore = Math.round(
      (fitScore * 0.3) +
      (intentScore * 0.25) +
      (engagementScore * 0.2) +
      (timingScore * 0.15) +
      (authorityScore * 0.1)
    );

    const score: ProspectScore = {
      overall: overallScore,
      breakdown: {
        fit: fitScore,
        intent: intentScore,
        engagement: engagementScore,
        timing: timingScore,
        authority: authorityScore,
      },
      factors: scoreFactors,
      lastCalculated: new Date(),
    };

    this.scores.set(prospectId, score);
    await this.persistScore(prospectId, score);

    this.emit('prospect:scored', { prospectId, score });
    return score;
  }

  private evaluateRule(rule: QualificationRule, prospect: ProspectProfile, activities: ProspectActivity[]): number {
    let score = 0;

    for (const condition of rule.conditions) {
      const fieldValue = this.getFieldValue(condition.field, prospect, activities);
      let conditionMet = false;

      switch (condition.operator) {
        case 'equals':
          conditionMet = fieldValue === condition.value;
          break;
        case 'not_equals':
          conditionMet = fieldValue !== condition.value;
          break;
        case 'greater_than':
          conditionMet = Number(fieldValue) > Number(condition.value);
          break;
        case 'less_than':
          conditionMet = Number(fieldValue) < Number(condition.value);
          break;
        case 'contains':
          conditionMet = Array.isArray(fieldValue)
            ? fieldValue.includes(condition.value)
            : String(fieldValue).includes(String(condition.value));
          break;
        case 'in':
          conditionMet = Array.isArray(condition.value) && condition.value.includes(fieldValue);
          break;
        case 'exists':
          conditionMet = fieldValue !== undefined && fieldValue !== null;
          break;
      }

      if (conditionMet && condition.weight) {
        score += condition.weight;
      }
    }

    return score;
  }

  private getFieldValue(field: string, prospect: ProspectProfile, activities: ProspectActivity[]): any {
    // Handle nested field access
    const fieldParts = field.split('.');
    let value: any = prospect;

    for (const part of fieldParts) {
      if (part.startsWith('activities.')) {
        const activityType = part.replace('activities.', '');
        return activities.filter(a => a.type === activityType).length;
      }
      value = value?.[part];
    }

    return value;
  }

  getProspectScore(prospectId: string): ProspectScore | undefined {
    return this.scores.get(prospectId);
  }

  // =============================================================================
  // QUALIFICATION RULES
  // =============================================================================

  async addQualificationRule(rule: Omit<QualificationRule, 'id'>): Promise<QualificationRule> {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newRule: QualificationRule = {
      ...rule,
      id,
    };

    this.rules.set(id, newRule);
    await this.persistRule(newRule);

    // Recalculate scores for all prospects if this is a scoring rule
    if (newRule.category === 'scoring') {
      await this.recalculateAllScores();
    }

    this.emit('rule:added', newRule);
    return newRule;
  }

  async updateQualificationRule(id: string, updates: Partial<QualificationRule>): Promise<QualificationRule> {
    const rule = this.rules.get(id);
    if (!rule) {
      throw new Error(`Rule ${id} not found`);
    }

    const updatedRule = {
      ...rule,
      ...updates,
      id, // Ensure ID doesn't change
    };

    this.rules.set(id, updatedRule);
    await this.persistRule(updatedRule);

    // Recalculate scores if this affects scoring
    if (updatedRule.category === 'scoring') {
      await this.recalculateAllScores();
    }

    this.emit('rule:updated', updatedRule);
    return updatedRule;
  }

  async deleteQualificationRule(id: string): Promise<void> {
    const rule = this.rules.get(id);
    if (!rule) {
      throw new Error(`Rule ${id} not found`);
    }

    this.rules.delete(id);
    await this.redis.del(`rule:${id}`);

    // Recalculate scores if this was a scoring rule
    if (rule.category === 'scoring') {
      await this.recalculateAllScores();
    }

    this.emit('rule:deleted', { ruleId: id });
  }

  getQualificationRule(id: string): QualificationRule | undefined {
    return this.rules.get(id);
  }

  getAllQualificationRules(): QualificationRule[] {
    return Array.from(this.rules.values());
  }

  private async recalculateAllScores(): Promise<void> {
    for (const prospectId of this.prospects.keys()) {
      await this.calculateProspectScore(prospectId);
    }
  }

  // =============================================================================
  // DATA SOURCE MANAGEMENT
  // =============================================================================

  async addDataSource(dataSource: Omit<DataSource, 'id' | 'lastSync' | 'recordCount' | 'errorCount'>): Promise<DataSource> {
    const id = `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newDataSource: DataSource = {
      ...dataSource,
      id,
      recordCount: 0,
      errorCount: 0,
    };

    this.dataSources.set(id, newDataSource);
    await this.persistDataSource(newDataSource);

    // Setup sync job if active
    if (newDataSource.isActive && newDataSource.config.schedule) {
      await this.setupDataSourceSync(newDataSource);
    }

    this.emit('datasource:added', newDataSource);
    return newDataSource;
  }

  async syncDataSource(sourceId: string): Promise<void> {
    const dataSource = this.dataSources.get(sourceId);
    if (!dataSource) {
      throw new Error(`Data source ${sourceId} not found`);
    }

    try {
      this.emit('datasource:sync:started', { sourceId });

      let records: any[] = [];

      switch (dataSource.type) {
        case 'api':
          records = await this.syncApiDataSource(dataSource);
          break;
        case 'webhook':
          // Webhooks are handled separately
          break;
        case 'csv':
          records = await this.syncCsvDataSource(dataSource);
          break;
        case 'database':
          records = await this.syncDatabaseDataSource(dataSource);
          break;
        case 'integration':
          records = await this.syncIntegrationDataSource(dataSource);
          break;
      }

      // Process and add prospects
      for (const record of records) {
        try {
          const prospect = this.mapRecordToProspect(record, dataSource);
          if (prospect) {
            await this.addProspect(prospect);
          }
        } catch (error) {
          dataSource.errorCount++;
          console.error(`Error processing record from ${sourceId}:`, error);
        }
      }

      dataSource.lastSync = new Date();
      dataSource.recordCount += records.length;
      await this.persistDataSource(dataSource);

      this.emit('datasource:sync:completed', {
        sourceId,
        recordsProcessed: records.length,
        errors: dataSource.errorCount
      });

    } catch (error) {
      dataSource.errorCount++;
      await this.persistDataSource(dataSource);

      this.emit('datasource:sync:failed', {
        sourceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async syncApiDataSource(dataSource: DataSource): Promise<any[]> {
    const { url, apiKey, headers = {} } = dataSource.config;

    if (!url) {
      throw new Error('API data source requires URL');
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
        ...headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  }

  private async syncCsvDataSource(dataSource: DataSource): Promise<any[]> {
    // In a real implementation, you would parse CSV data
    // For now, return empty array
    return [];
  }

  private async syncDatabaseDataSource(dataSource: DataSource): Promise<any[]> {
    // In a real implementation, you would connect to database
    // For now, return empty array
    return [];
  }

  private async syncIntegrationDataSource(dataSource: DataSource): Promise<any[]> {
    // Handle platform-specific integrations
    const { platform } = dataSource.config;

    this.emit('integration:sync:request', {
      platform,
      dataSource,
    });

    // Return empty array for now - integration handlers will process separately
    return [];
  }

  private mapRecordToProspect(record: any, dataSource: DataSource): Omit<ProspectProfile, 'id' | 'metadata'> | null {
    const { mapping = {} } = dataSource.config;

    try {
      // Apply field mapping
      const mappedRecord: any = {};
      for (const [sourceField, targetField] of Object.entries(mapping)) {
        if (record[sourceField] !== undefined) {
          mappedRecord[targetField] = record[sourceField];
        }
      }

      // Create prospect profile with default values
      const prospect: Omit<ProspectProfile, 'id' | 'metadata'> = {
        companyName: mappedRecord.companyName || record.company || record.name || '',
        domain: mappedRecord.domain || record.domain || record.website || '',
        industry: mappedRecord.industry || record.industry || 'Unknown',
        size: this.determineCompanySize(mappedRecord.employeeCount || record.employees),
        revenue: mappedRecord.revenue || record.revenue,
        employeeCount: mappedRecord.employeeCount || record.employees || record.size,
        location: {
          country: mappedRecord.country || record.country || 'Unknown',
          region: mappedRecord.region || record.region || record.state || '',
          city: mappedRecord.city || record.city,
        },
        technographics: {
          technologies: mappedRecord.technologies || record.tech_stack || [],
          platforms: mappedRecord.platforms || record.platforms || [],
          integrations: mappedRecord.integrations || record.integrations || [],
        },
        firmographics: {
          foundedYear: mappedRecord.foundedYear || record.founded,
          fundingStage: mappedRecord.fundingStage || record.funding_stage,
          fundingAmount: mappedRecord.fundingAmount || record.funding_amount,
          publiclyTraded: mappedRecord.publiclyTraded || record.public || false,
        },
        digitalPresence: {
          website: mappedRecord.website || record.website || mappedRecord.domain || record.domain || '',
          socialProfiles: mappedRecord.socialProfiles || record.social || {},
          contentActivity: mappedRecord.contentActivity || record.content_score || 0,
          seoRanking: mappedRecord.seoRanking || record.seo_rank,
        },
        contactInformation: {
          email: mappedRecord.email || record.email,
          phone: mappedRecord.phone || record.phone,
          address: mappedRecord.address || record.address,
        },
      };

      // Validate required fields
      if (!prospect.companyName || !prospect.domain) {
        return null;
      }

      return prospect;

    } catch (error) {
      console.error('Error mapping record to prospect:', error);
      return null;
    }
  }

  private determineCompanySize(employeeCount?: number): 'startup' | 'small' | 'medium' | 'large' | 'enterprise' {
    if (!employeeCount) return 'startup';
    if (employeeCount < 10) return 'startup';
    if (employeeCount < 50) return 'small';
    if (employeeCount < 250) return 'medium';
    if (employeeCount < 1000) return 'large';
    return 'enterprise';
  }

  // =============================================================================
  // ACTIVITY TRACKING
  // =============================================================================

  async addProspectActivity(activity: Omit<ProspectActivity, 'id'>): Promise<ProspectActivity> {
    const id = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newActivity: ProspectActivity = {
      ...activity,
      id,
    };

    const activities = this.activities.get(activity.prospectId) || [];
    activities.push(newActivity);
    this.activities.set(activity.prospectId, activities);

    await this.persistActivity(activity.prospectId, newActivity);

    // Recalculate prospect score
    await this.calculateProspectScore(activity.prospectId);

    this.emit('activity:added', newActivity);
    return newActivity;
  }

  getProspectActivities(prospectId: string): ProspectActivity[] {
    return this.activities.get(prospectId) || [];
  }

  // =============================================================================
  // ANALYTICS & METRICS
  // =============================================================================

  async getMetrics(): Promise<DetectionMetrics> {
    const prospects = Array.from(this.prospects.values());
    const scores = Array.from(this.scores.values());

    const qualifiedProspects = scores.filter(s => s.overall >= 70).length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newProspectsToday = prospects.filter(p =>
      new Date(p.metadata.lastUpdated) >= today
    ).length;

    const averageScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s.overall, 0) / scores.length
      : 0;

    // Calculate conversion rate (mock for now)
    const conversionRate = qualifiedProspects > 0 ? (qualifiedProspects * 0.15) : 0;

    // Top sources
    const sourceCount: Record<string, { count: number; totalScore: number }> = {};
    prospects.forEach(p => {
      const source = p.metadata.source;
      if (!sourceCount[source]) {
        sourceCount[source] = { count: 0, totalScore: 0 };
      }
      sourceCount[source].count++;
      const score = this.scores.get(p.id);
      if (score) {
        sourceCount[source].totalScore += score.overall;
      }
    });

    const topSources = Object.entries(sourceCount)
      .map(([source, data]) => ({
        source,
        count: data.count,
        quality: data.count > 0 ? data.totalScore / data.count : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Score distribution
    const scoreDistribution: Record<string, number> = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    scores.forEach(score => {
      if (score.overall <= 20) scoreDistribution['0-20']++;
      else if (score.overall <= 40) scoreDistribution['21-40']++;
      else if (score.overall <= 60) scoreDistribution['41-60']++;
      else if (score.overall <= 80) scoreDistribution['61-80']++;
      else scoreDistribution['81-100']++;
    });

    // Industry breakdown
    const industryBreakdown: Record<string, number> = {};
    prospects.forEach(p => {
      industryBreakdown[p.industry] = (industryBreakdown[p.industry] || 0) + 1;
    });

    return {
      totalProspects: prospects.length,
      qualifiedProspects,
      newProspectsToday,
      averageScore,
      conversionRate,
      topSources,
      scoreDistribution,
      industryBreakdown,
    };
  }

  // =============================================================================
  // SEARCH & FILTERING
  // =============================================================================

  searchProspects(criteria: {
    industry?: string;
    size?: string;
    minScore?: number;
    maxScore?: number;
    technologies?: string[];
    location?: string;
    platform?: string;
    limit?: number;
  }): ProspectProfile[] {
    let results = Array.from(this.prospects.values());

    // Apply filters
    if (criteria.industry) {
      results = results.filter(p =>
        p.industry.toLowerCase().includes(criteria.industry!.toLowerCase())
      );
    }

    if (criteria.size) {
      results = results.filter(p => p.size === criteria.size);
    }

    if (criteria.technologies && criteria.technologies.length > 0) {
      results = results.filter(p =>
        criteria.technologies!.some(tech =>
          p.technographics.technologies.includes(tech)
        )
      );
    }

    if (criteria.location) {
      results = results.filter(p =>
        p.location.country.toLowerCase().includes(criteria.location!.toLowerCase()) ||
        p.location.region.toLowerCase().includes(criteria.location!.toLowerCase())
      );
    }

    if (criteria.platform) {
      results = results.filter(p => p.metadata.platform === criteria.platform);
    }

    // Apply score filters
    if (criteria.minScore !== undefined || criteria.maxScore !== undefined) {
      results = results.filter(p => {
        const score = this.scores.get(p.id);
        if (!score) return false;

        if (criteria.minScore !== undefined && score.overall < criteria.minScore) return false;
        if (criteria.maxScore !== undefined && score.overall > criteria.maxScore) return false;

        return true;
      });
    }

    // Sort by score (highest first)
    results.sort((a, b) => {
      const scoreA = this.scores.get(a.id)?.overall || 0;
      const scoreB = this.scores.get(b.id)?.overall || 0;
      return scoreB - scoreA;
    });

    // Apply limit
    if (criteria.limit) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  // =============================================================================
  // PERSISTENCE METHODS
  // =============================================================================

  private async persistProspect(prospect: ProspectProfile): Promise<void> {
    await this.redis.setex(
      `prospect:${prospect.id}`,
      86400 * 90, // 90 days TTL
      JSON.stringify(prospect)
    );
  }

  private async persistScore(prospectId: string, score: ProspectScore): Promise<void> {
    await this.redis.setex(
      `score:${prospectId}`,
      86400 * 30, // 30 days TTL
      JSON.stringify(score)
    );
  }

  private async persistRule(rule: QualificationRule): Promise<void> {
    await this.redis.setex(
      `rule:${rule.id}`,
      86400 * 365, // 1 year TTL
      JSON.stringify(rule)
    );
  }

  private async persistDataSource(dataSource: DataSource): Promise<void> {
    await this.redis.setex(
      `datasource:${dataSource.id}`,
      86400 * 365, // 1 year TTL
      JSON.stringify(dataSource)
    );
  }

  private async persistActivity(prospectId: string, activity: ProspectActivity): Promise<void> {
    const activities = this.activities.get(prospectId) || [];
    await this.redis.setex(
      `activities:${prospectId}`,
      86400 * 30, // 30 days TTL
      JSON.stringify(activities)
    );
  }

  private async loadProspects(): Promise<void> {
    const keys = await this.redis.keys('prospect:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const prospect = JSON.parse(data) as ProspectProfile;
        this.prospects.set(prospect.id, prospect);
      }
    }
  }

  private async loadScores(): Promise<void> {
    const keys = await this.redis.keys('score:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const prospectId = key.replace('score:', '');
        const score = JSON.parse(data) as ProspectScore;
        this.scores.set(prospectId, score);
      }
    }
  }

  private async loadRules(): Promise<void> {
    const keys = await this.redis.keys('rule:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const rule = JSON.parse(data) as QualificationRule;
        this.rules.set(rule.id, rule);
      }
    }
  }

  private async loadDataSources(): Promise<void> {
    const keys = await this.redis.keys('datasource:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const dataSource = JSON.parse(data) as DataSource;
        this.dataSources.set(dataSource.id, dataSource);
      }
    }
  }

  // =============================================================================
  // SYNC MANAGEMENT
  // =============================================================================

  private async setupDataSourceSync(dataSource?: DataSource): Promise<void> {
    if (dataSource) {
      await this.setupSingleDataSourceSync(dataSource);
    } else {
      // Setup sync for all active data sources
      for (const ds of this.dataSources.values()) {
        if (ds.isActive && ds.config.schedule) {
          await this.setupSingleDataSourceSync(ds);
        }
      }
    }
  }

  private async setupSingleDataSourceSync(dataSource: DataSource): Promise<void> {
    if (!dataSource.config.schedule) return;

    // Cancel existing job
    const existingJob = this.syncJobs.get(dataSource.id);
    if (existingJob) {
      clearInterval(existingJob);
    }

    // Parse schedule (simplified - in production use a proper cron parser)
    const interval = this.parseSchedule(dataSource.config.schedule);
    if (interval > 0) {
      const job = setInterval(() => {
        this.syncDataSource(dataSource.id).catch(error => {
          console.error(`Error syncing data source ${dataSource.id}:`, error);
        });
      }, interval);

      this.syncJobs.set(dataSource.id, job);
    }
  }

  private parseSchedule(schedule: string): number {
    // Simplified schedule parser
    if (schedule.includes('minute')) {
      const minutes = parseInt(schedule.match(/\d+/)?.[0] || '5');
      return minutes * 60 * 1000;
    }
    if (schedule.includes('hour')) {
      const hours = parseInt(schedule.match(/\d+/)?.[0] || '1');
      return hours * 60 * 60 * 1000;
    }
    if (schedule.includes('day')) {
      const days = parseInt(schedule.match(/\d+/)?.[0] || '1');
      return days * 24 * 60 * 60 * 1000;
    }
    return 0;
  }

  // =============================================================================
  // HEALTH CHECK
  // =============================================================================

  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const metrics = await this.getMetrics();
      return {
        status: 'healthy',
        details: {
          initialized: this.isInitialized,
          prospects: metrics.totalProspects,
          qualifiedProspects: metrics.qualifiedProspects,
          rules: this.rules.size,
          dataSources: this.dataSources.size,
          activeSyncJobs: this.syncJobs.size,
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

  // =============================================================================
  // CLEANUP
  // =============================================================================

  async shutdown(): Promise<void> {
    // Cancel all sync jobs
    for (const job of this.syncJobs.values()) {
      clearInterval(job);
    }
    this.syncJobs.clear();

    this.removeAllListeners();
    console.log('🎯 Universal Prospect Detection Engine shut down');
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createUniversalProspectDetectionEngine(redisClient: Redis): UniversalProspectDetectionEngine {
  return new UniversalProspectDetectionEngine(redisClient);
}

export default UniversalProspectDetectionEngine;
