import { EventEmitter } from 'events';
import Redis from 'ioredis';

// =============================================================================
// CORE INTERFACES - Universal Real-time Scoring System
// =============================================================================

export interface ScoringRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number; // 1-10, higher = more important
  category: 'demographic' | 'behavioral' | 'firmographic' | 'engagement' | 'intent' | 'custom';
  conditions: ScoringCondition[];
  scoreModifier: {
    type: 'add' | 'multiply' | 'set' | 'percentage';
    value: number;
    maxImpact?: number; // Maximum score change this rule can cause
  };
  triggers: ScoringTrigger[];
  crmMappings: CRMFieldMapping[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    lastTriggered?: Date;
    triggerCount: number;
  };
}

export interface ScoringCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: any;
  weight: number; // 0-1, how much this condition matters
  dataSource: 'crm' | 'website' | 'email' | 'social' | 'external';
}

export interface ScoringTrigger {
  type: 'event' | 'time' | 'data_change' | 'threshold' | 'manual';
  eventType?: string; // For event triggers
  schedule?: string; // For time triggers (cron format)
  field?: string; // For data change triggers
  threshold?: number; // For threshold triggers
  isActive: boolean;
  lastTriggered?: Date;
}

export interface ScoreCalculation {
  leadId: string;
  calculationId: string;
  previousScore: number;
  newScore: number;
  scoreChange: number;
  appliedRules: AppliedRule[];
  calculatedAt: Date;
  triggerSource: string;
  metadata: {
    calculationTimeMs: number;
    rulesEvaluated: number;
    crmUpdatesRequired: string[];
    dataQuality: number; // 0-1
  };
}

export interface AppliedRule {
  ruleId: string;
  ruleName: string;
  conditionsMet: boolean[];
  scoreImpact: number;
  confidence: number; // 0-1
  reasoning: string;
}

export interface ScoreUpdate {
  updateId: string;
  leadId: string;
  calculationId: string;
  crmUpdates: CRMScoreUpdate[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'partial';
  startedAt: Date;
  completedAt?: Date;
  errors: ScoreUpdateError[];
  retryCount: number;
  maxRetries: number;
}

export interface CRMScoreUpdate {
  crmType: string;
  crmId: string;
  leadId: string;
  fieldMappings: Record<string, any>;
  status: 'pending' | 'success' | 'failed';
  updatedAt?: Date;
  error?: string;
  responseTime?: number;
}

export interface ScoreUpdateError {
  crmType: string;
  error: string;
  timestamp: Date;
  retryable: boolean;
  context?: Record<string, any>;
}

export interface CRMFieldMapping {
  crmType: string;
  crmField: string;
  dataType: 'number' | 'string' | 'boolean' | 'date';
  transformation?: 'raw' | 'percentage' | 'rounded' | 'custom';
  customTransform?: string; // JavaScript function as string
}

export interface ScoringMetrics {
  totalCalculations: number;
  calculationsToday: number;
  averageCalculationTime: number;
  successfulUpdates: number;
  failedUpdates: number;
  crmUpdatesByType: Record<string, number>;
  rulePerformance: Record<string, {
    triggerCount: number;
    averageImpact: number;
    successRate: number;
  }>;
  realTimeMetrics: {
    calculationsPerMinute: number;
    updatesPerMinute: number;
    averageLatency: number;
    errorRate: number;
  };
}

export interface LeadScoreProfile {
  leadId: string;
  currentScore: number;
  scoreHistory: ScoreHistoryEntry[];
  breakdown: ScoreBreakdown;
  crmSyncStatus: Record<string, {
    lastSynced: Date;
    status: 'synced' | 'pending' | 'failed';
    score: number;
  }>;
  nextCalculation?: Date;
  metadata: {
    firstScored: Date;
    lastUpdated: Date;
    totalCalculations: number;
    dataQuality: number;
  };
}

export interface ScoreHistoryEntry {
  timestamp: Date;
  score: number;
  change: number;
  trigger: string;
  ruleIds: string[];
  calculationId: string;
}

export interface ScoreBreakdown {
  demographic: number;
  behavioral: number;
  firmographic: number;
  engagement: number;
  intent: number;
  custom: number;
  total: number;
}

export interface ScoringFilters {
  ruleId?: string;
  category?: string;
  isActive?: boolean;
  priority?: number;
  leadId?: string;
  crmType?: string;
  status?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// =============================================================================
// UNIVERSAL REAL-TIME SCORING SERVICE
// =============================================================================

export class RealtimeScoringService extends EventEmitter {
  private redis: Redis;
  private scoringRules: Map<string, ScoringRule> = new Map();
  private leadProfiles: Map<string, LeadScoreProfile> = new Map();
  private activeCalculations: Map<string, ScoreCalculation> = new Map();
  private pendingUpdates: Map<string, ScoreUpdate> = new Map();
  private metricsCache: ScoringMetrics | null = null;
  private metricsInterval?: NodeJS.Timeout;
  private triggerInterval?: NodeJS.Timeout;

  constructor(redis: Redis) {
    super();
    this.redis = redis;
    this.initializeDefaultRules();
    this.startMetricsCalculation();
    this.startTriggerProcessor();
    this.generateMockData();
  }

  // =============================================================================
  // SCORING RULE MANAGEMENT
  // =============================================================================

  private initializeDefaultRules(): void {
    const defaultRules: ScoringRule[] = [
      {
        id: 'demographic_company_size',
        name: 'Company Size Scoring',
        description: 'Score based on company size and employee count',
        isActive: true,
        priority: 8,
        category: 'demographic',
        conditions: [
          {
            field: 'companySize',
            operator: 'in',
            value: ['enterprise', 'mid_market'],
            weight: 1.0,
            dataSource: 'crm'
          }
        ],
        scoreModifier: {
          type: 'add',
          value: 25,
          maxImpact: 25
        },
        triggers: [
          {
            type: 'data_change',
            field: 'companySize',
            isActive: true
          }
        ],
        crmMappings: [
          {
            crmType: 'salesforce',
            crmField: 'Lead_Score__c',
            dataType: 'number',
            transformation: 'raw'
          },
          {
            crmType: 'hubspot',
            crmField: 'lead_score',
            dataType: 'number',
            transformation: 'raw'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          triggerCount: 0
        }
      },
      {
        id: 'behavioral_website_engagement',
        name: 'Website Engagement Scoring',
        description: 'Score based on website activity and engagement',
        isActive: true,
        priority: 7,
        category: 'behavioral',
        conditions: [
          {
            field: 'pageViews',
            operator: 'greater_than',
            value: 5,
            weight: 0.6,
            dataSource: 'website'
          },
          {
            field: 'timeOnSite',
            operator: 'greater_than',
            value: 300, // 5 minutes
            weight: 0.4,
            dataSource: 'website'
          }
        ],
        scoreModifier: {
          type: 'add',
          value: 15,
          maxImpact: 30
        },
        triggers: [
          {
            type: 'event',
            eventType: 'page_view',
            isActive: true
          },
          {
            type: 'event',
            eventType: 'session_end',
            isActive: true
          }
        ],
        crmMappings: [
          {
            crmType: 'salesforce',
            crmField: 'Website_Score__c',
            dataType: 'number',
            transformation: 'raw'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          triggerCount: 0
        }
      },
      {
        id: 'intent_demo_request',
        name: 'Demo Request Intent',
        description: 'High intent signal from demo requests',
        isActive: true,
        priority: 10,
        category: 'intent',
        conditions: [
          {
            field: 'demoRequested',
            operator: 'equals',
            value: true,
            weight: 1.0,
            dataSource: 'crm'
          }
        ],
        scoreModifier: {
          type: 'add',
          value: 40,
          maxImpact: 40
        },
        triggers: [
          {
            type: 'data_change',
            field: 'demoRequested',
            isActive: true
          }
        ],
        crmMappings: [
          {
            crmType: 'salesforce',
            crmField: 'Intent_Score__c',
            dataType: 'number',
            transformation: 'raw'
          },
          {
            crmType: 'hubspot',
            crmField: 'intent_score',
            dataType: 'number',
            transformation: 'raw'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          triggerCount: 0
        }
      }
    ];

    defaultRules.forEach(rule => {
      this.scoringRules.set(rule.id, rule);
    });
  }

  async createScoringRule(rule: Omit<ScoringRule, 'id' | 'metadata'>): Promise<ScoringRule> {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRule: ScoringRule = {
      id,
      ...rule,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user',
        triggerCount: 0
      }
    };

    this.scoringRules.set(id, newRule);
    await this.persistRule(newRule);

    this.emit('ruleCreated', newRule);
    return newRule;
  }

  async updateScoringRule(ruleId: string, updates: Partial<ScoringRule>): Promise<ScoringRule | null> {
    const rule = this.scoringRules.get(ruleId);
    if (!rule) return null;

    const updatedRule = {
      ...rule,
      ...updates,
      id: ruleId, // Ensure ID doesn't change
      metadata: {
        ...rule.metadata,
        updatedAt: new Date()
      }
    };

    this.scoringRules.set(ruleId, updatedRule);
    await this.persistRule(updatedRule);

    this.emit('ruleUpdated', updatedRule);
    return updatedRule;
  }

  async deleteScoringRule(ruleId: string): Promise<boolean> {
    const rule = this.scoringRules.get(ruleId);
    if (!rule) return false;

    this.scoringRules.delete(ruleId);
    await this.redis.del(`scoring:rule:${ruleId}`);

    this.emit('ruleDeleted', { ruleId, rule });
    return true;
  }

  getScoringRule(ruleId: string): ScoringRule | null {
    return this.scoringRules.get(ruleId) || null;
  }

  getScoringRules(filters?: ScoringFilters): ScoringRule[] {
    let rules = Array.from(this.scoringRules.values());

    if (filters) {
      if (filters.category) {
        rules = rules.filter(r => r.category === filters.category);
      }
      if (filters.isActive !== undefined) {
        rules = rules.filter(r => r.isActive === filters.isActive);
      }
      if (filters.priority) {
        rules = rules.filter(r => r.priority >= filters.priority!);
      }
    }

    return rules.sort((a, b) => b.priority - a.priority);
  }

  // =============================================================================
  // REAL-TIME SCORE CALCULATION
  // =============================================================================

  async calculateScore(leadId: string, triggerSource: string = 'manual', leadData?: any): Promise<ScoreCalculation> {
    const startTime = Date.now();
    const calculationId = `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get current lead profile
      let profile = this.leadProfiles.get(leadId);
      if (!profile) {
        profile = await this.createLeadProfile(leadId);
      }

      const previousScore = profile.currentScore;

      // Get lead data if not provided
      const data = leadData || await this.getLeadData(leadId);

      // Evaluate all active rules
      const activeRules = this.getScoringRules({ isActive: true });
      const appliedRules: AppliedRule[] = [];
      let scoreChange = 0;

      for (const rule of activeRules) {
        const ruleResult = await this.evaluateRule(rule, data);
        if (ruleResult.conditionsMet.some(met => met)) {
          appliedRules.push(ruleResult);
          scoreChange += ruleResult.scoreImpact;

          // Update rule trigger count
          rule.metadata.triggerCount++;
          rule.metadata.lastTriggered = new Date();
        }
      }

      const newScore = Math.max(0, Math.min(100, previousScore + scoreChange));

      // Create calculation result
      const calculation: ScoreCalculation = {
        leadId,
        calculationId,
        previousScore,
        newScore,
        scoreChange,
        appliedRules,
        calculatedAt: new Date(),
        triggerSource,
        metadata: {
          calculationTimeMs: Date.now() - startTime,
          rulesEvaluated: activeRules.length,
          crmUpdatesRequired: this.getCRMUpdatesRequired(appliedRules),
          dataQuality: this.assessDataQuality(data)
        }
      };

      // Update lead profile
      await this.updateLeadProfile(leadId, calculation);

      // Store calculation
      this.activeCalculations.set(calculationId, calculation);

      // Trigger CRM updates if score changed
      if (scoreChange !== 0) {
        await this.triggerCRMUpdates(calculation);
      }

      this.emit('scoreCalculated', calculation);
      return calculation;

    } catch (error) {
      this.emit('calculationError', { leadId, calculationId, error });
      throw error;
    }
  }

  private async evaluateRule(rule: ScoringRule, leadData: any): Promise<AppliedRule> {
    const conditionsMet: boolean[] = [];
    let confidence = 1.0;
    let reasoning = '';

    for (const condition of rule.conditions) {
      const fieldValue = this.getFieldValue(leadData, condition.field, condition.dataSource);
      const conditionMet = this.evaluateCondition(condition, fieldValue);
      conditionsMet.push(conditionMet);

      if (conditionMet) {
        confidence *= condition.weight;
        reasoning += `${condition.field} ${condition.operator} ${condition.value}; `;
      } else {
        confidence *= (1 - condition.weight * 0.5); // Partial penalty for unmet conditions
      }
    }

    const anyConditionMet = conditionsMet.some(met => met);
    const scoreImpact = anyConditionMet ? this.calculateScoreImpact(rule, confidence) : 0;

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      conditionsMet,
      scoreImpact,
      confidence,
      reasoning: reasoning.trim()
    };
  }

  private evaluateCondition(condition: ScoringCondition, fieldValue: any): boolean {
    if (fieldValue === undefined || fieldValue === null) {
      return condition.operator === 'not_exists';
    }

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'exists':
        return true; // Already checked for null/undefined above
      case 'not_exists':
        return false; // Already checked for null/undefined above
      default:
        return false;
    }
  }

  private calculateScoreImpact(rule: ScoringRule, confidence: number): number {
    const baseImpact = rule.scoreModifier.value * confidence;
    const maxImpact = rule.scoreModifier.maxImpact || rule.scoreModifier.value;

    switch (rule.scoreModifier.type) {
      case 'add':
        return Math.min(baseImpact, maxImpact);
      case 'multiply':
        return baseImpact;
      case 'set':
        return rule.scoreModifier.value;
      case 'percentage':
        return baseImpact / 100;
      default:
        return baseImpact;
    }
  }

  private getFieldValue(leadData: any, field: string, dataSource: string): any {
    // Navigate nested object paths (e.g., 'company.size')
    const fieldParts = field.split('.');
    let value = leadData;

    for (const part of fieldParts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  // =============================================================================
  // CRM INTEGRATION & UPDATES
  // =============================================================================

  private async triggerCRMUpdates(calculation: ScoreCalculation): Promise<void> {
    const updateId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const crmUpdates: CRMScoreUpdate[] = [];

    // Collect all CRM mappings from applied rules
    const allMappings = new Map<string, CRMFieldMapping>();

    for (const appliedRule of calculation.appliedRules) {
      const rule = this.scoringRules.get(appliedRule.ruleId);
      if (rule) {
        rule.crmMappings.forEach(mapping => {
          const key = `${mapping.crmType}:${mapping.crmField}`;
          allMappings.set(key, mapping);
        });
      }
    }

    // Create CRM updates for each mapping
    for (const mapping of allMappings.values()) {
      const crmUpdate: CRMScoreUpdate = {
        crmType: mapping.crmType,
        crmId: `${mapping.crmType}_instance`,
        leadId: calculation.leadId,
        fieldMappings: {
          [mapping.crmField]: this.transformScoreValue(calculation.newScore, mapping)
        },
        status: 'pending'
      };
      crmUpdates.push(crmUpdate);
    }

    const scoreUpdate: ScoreUpdate = {
      updateId,
      leadId: calculation.leadId,
      calculationId: calculation.calculationId,
      crmUpdates,
      status: 'pending',
      startedAt: new Date(),
      errors: [],
      retryCount: 0,
      maxRetries: 3
    };

    this.pendingUpdates.set(updateId, scoreUpdate);

    // Process updates asynchronously
    this.processCRMUpdates(scoreUpdate);
  }

  private async processCRMUpdates(scoreUpdate: ScoreUpdate): Promise<void> {
    scoreUpdate.status = 'in_progress';

    try {
      const updatePromises = scoreUpdate.crmUpdates.map(crmUpdate =>
        this.updateCRMScore(crmUpdate)
      );

      await Promise.allSettled(updatePromises);

      // Check overall status
      const successfulUpdates = scoreUpdate.crmUpdates.filter(u => u.status === 'success').length;
      const failedUpdates = scoreUpdate.crmUpdates.filter(u => u.status === 'failed').length;

      if (failedUpdates === 0) {
        scoreUpdate.status = 'completed';
      } else if (successfulUpdates > 0) {
        scoreUpdate.status = 'partial';
      } else {
        scoreUpdate.status = 'failed';
      }

      scoreUpdate.completedAt = new Date();
      this.emit('crmUpdatesCompleted', scoreUpdate);

    } catch (error) {
      scoreUpdate.status = 'failed';
      scoreUpdate.completedAt = new Date();
      scoreUpdate.errors.push({
        crmType: 'system',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        retryable: true
      });
      this.emit('crmUpdatesFailed', scoreUpdate);
    }
  }

  private async updateCRMScore(crmUpdate: CRMScoreUpdate): Promise<void> {
    const startTime = Date.now();

    try {
      // Simulate CRM API call - in production, use actual CRM APIs
      await this.simulateCRMUpdate(crmUpdate);

      crmUpdate.status = 'success';
      crmUpdate.updatedAt = new Date();
      crmUpdate.responseTime = Date.now() - startTime;

    } catch (error) {
      crmUpdate.status = 'failed';
      crmUpdate.error = error instanceof Error ? error.message : 'Unknown error';
      crmUpdate.responseTime = Date.now() - startTime;
    }
  }

  private async simulateCRMUpdate(crmUpdate: CRMScoreUpdate): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`CRM ${crmUpdate.crmType} API temporarily unavailable`);
    }

    // Log successful update
    console.log(`Updated ${crmUpdate.crmType} lead ${crmUpdate.leadId} with score:`, crmUpdate.fieldMappings);
  }

  private transformScoreValue(score: number, mapping: CRMFieldMapping): any {
    switch (mapping.transformation) {
      case 'percentage':
        return score / 100;
      case 'rounded':
        return Math.round(score);
      case 'custom':
        // In production, evaluate custom transformation function
        return score;
      case 'raw':
      default:
        return score;
    }
  }

  private getCRMUpdatesRequired(appliedRules: AppliedRule[]): string[] {
    const crmTypes = new Set<string>();

    for (const appliedRule of appliedRules) {
      const rule = this.scoringRules.get(appliedRule.ruleId);
      if (rule) {
        rule.crmMappings.forEach(mapping => {
          crmTypes.add(mapping.crmType);
        });
      }
    }

    return Array.from(crmTypes);
  }

  // =============================================================================
  // LEAD PROFILE MANAGEMENT
  // =============================================================================

  private async createLeadProfile(leadId: string): Promise<LeadScoreProfile> {
    const profile: LeadScoreProfile = {
      leadId,
      currentScore: 0,
      scoreHistory: [],
      breakdown: {
        demographic: 0,
        behavioral: 0,
        firmographic: 0,
        engagement: 0,
        intent: 0,
        custom: 0,
        total: 0
      },
      crmSyncStatus: {},
      metadata: {
        firstScored: new Date(),
        lastUpdated: new Date(),
        totalCalculations: 0,
        dataQuality: 0.8
      }
    };

    this.leadProfiles.set(leadId, profile);
    await this.persistLeadProfile(profile);
    return profile;
  }

  private async updateLeadProfile(leadId: string, calculation: ScoreCalculation): Promise<void> {
    const profile = this.leadProfiles.get(leadId);
    if (!profile) return;

    // Update current score
    profile.currentScore = calculation.newScore;

    // Add to history
    profile.scoreHistory.push({
      timestamp: calculation.calculatedAt,
      score: calculation.newScore,
      change: calculation.scoreChange,
      trigger: calculation.triggerSource,
      ruleIds: calculation.appliedRules.map(r => r.ruleId),
      calculationId: calculation.calculationId
    });

    // Keep only last 100 history entries
    if (profile.scoreHistory.length > 100) {
      profile.scoreHistory = profile.scoreHistory.slice(-100);
    }

    // Update breakdown by category
    this.updateScoreBreakdown(profile, calculation.appliedRules);

    // Update metadata
    profile.metadata.lastUpdated = new Date();
    profile.metadata.totalCalculations++;

    await this.persistLeadProfile(profile);
  }

  private updateScoreBreakdown(profile: LeadScoreProfile, appliedRules: AppliedRule[]): void {
    // Reset breakdown
    profile.breakdown = {
      demographic: 0,
      behavioral: 0,
      firmographic: 0,
      engagement: 0,
      intent: 0,
      custom: 0,
      total: profile.currentScore
    };

    // Distribute score based on applied rules
    for (const appliedRule of appliedRules) {
      const rule = this.scoringRules.get(appliedRule.ruleId);
      if (rule && appliedRule.scoreImpact > 0) {
        profile.breakdown[rule.category] += appliedRule.scoreImpact;
      }
    }
  }

  getLeadProfile(leadId: string): LeadScoreProfile | null {
    return this.leadProfiles.get(leadId) || null;
  }

  getLeadProfiles(filters?: ScoringFilters): LeadScoreProfile[] {
    let profiles = Array.from(this.leadProfiles.values());

    if (filters?.leadId) {
      profiles = profiles.filter(p => p.leadId === filters.leadId);
    }

    return profiles.sort((a, b) => b.currentScore - a.currentScore);
  }

  // =============================================================================
  // TRIGGER PROCESSING
  // =============================================================================

  private startTriggerProcessor(): void {
    // Process triggers every 30 seconds
    this.triggerInterval = setInterval(() => {
      this.processTriggers();
    }, 30000);
  }

  private async processTriggers(): Promise<void> {
    const activeRules = this.getScoringRules({ isActive: true });

    for (const rule of activeRules) {
      for (const trigger of rule.triggers) {
        if (!trigger.isActive) continue;

        try {
          await this.processTrigger(rule, trigger);
        } catch (error) {
          this.emit('triggerError', { rule, trigger, error });
        }
      }
    }
  }

  private async processTrigger(rule: ScoringRule, trigger: ScoringTrigger): Promise<void> {
    switch (trigger.type) {
      case 'time':
        if (trigger.schedule) {
          // In production, implement cron-based scheduling
          console.log(`Processing time trigger for rule ${rule.id}`);
        }
        break;
      case 'threshold':
        // Check if any leads meet threshold criteria
        console.log(`Processing threshold trigger for rule ${rule.id}`);
        break;
      case 'event':
        // Events are processed in real-time via emit/listen
        break;
      case 'data_change':
        // Data changes are detected via webhooks or polling
        console.log(`Processing data change trigger for rule ${rule.id}`);
        break;
    }

    trigger.lastTriggered = new Date();
  }

  // =============================================================================
  // METRICS & ANALYTICS
  // =============================================================================

  private startMetricsCalculation(): void {
    // Calculate metrics every 30 minutes
    this.metricsInterval = setInterval(() => {
      this.calculateMetrics();
    }, 30 * 60 * 1000);

    // Initial calculation
    this.calculateMetrics();
  }

  private calculateMetrics(): void {
    const calculations = Array.from(this.activeCalculations.values());
    const updates = Array.from(this.pendingUpdates.values());
    const rules = Array.from(this.scoringRules.values());

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const calculationsToday = calculations.filter(c => c.calculatedAt >= today).length;
    const successfulUpdates = updates.filter(u => u.status === 'completed').length;
    const failedUpdates = updates.filter(u => u.status === 'failed').length;

    // Calculate CRM updates by type
    const crmUpdatesByType: Record<string, number> = {};
    updates.forEach(update => {
      update.crmUpdates.forEach(crmUpdate => {
        crmUpdatesByType[crmUpdate.crmType] = (crmUpdatesByType[crmUpdate.crmType] || 0) + 1;
      });
    });

    // Calculate rule performance
    const rulePerformance: Record<string, any> = {};
    rules.forEach(rule => {
      const ruleCalculations = calculations.filter(c =>
        c.appliedRules.some(ar => ar.ruleId === rule.id)
      );

      rulePerformance[rule.id] = {
        triggerCount: rule.metadata.triggerCount,
        averageImpact: ruleCalculations.length > 0
          ? ruleCalculations.reduce((sum, c) => {
              const appliedRule = c.appliedRules.find(ar => ar.ruleId === rule.id);
              return sum + (appliedRule?.scoreImpact || 0);
            }, 0) / ruleCalculations.length
          : 0,
        successRate: ruleCalculations.length > 0 ? 1.0 : 0.0
      };
    });

    // Calculate real-time metrics
    const recentCalculations = calculations.filter(c =>
      c.calculatedAt >= new Date(now.getTime() - 60000) // Last minute
    );

    this.metricsCache = {
      totalCalculations: calculations.length,
      calculationsToday,
      averageCalculationTime: calculations.length > 0
        ? calculations.reduce((sum, c) => sum + c.metadata.calculationTimeMs, 0) / calculations.length
        : 0,
      successfulUpdates,
      failedUpdates,
      crmUpdatesByType,
      rulePerformance,
      realTimeMetrics: {
        calculationsPerMinute: recentCalculations.length,
        updatesPerMinute: updates.filter(u =>
          u.startedAt >= new Date(now.getTime() - 60000)
        ).length,
        averageLatency: recentCalculations.length > 0
          ? recentCalculations.reduce((sum, c) => sum + c.metadata.calculationTimeMs, 0) / recentCalculations.length
          : 0,
        errorRate: calculations.length > 0
          ? failedUpdates / (successfulUpdates + failedUpdates)
          : 0
      }
    };

    this.emit('metricsUpdated', this.metricsCache);
  }

  getMetrics(): ScoringMetrics | null {
    return this.metricsCache;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private async getLeadData(leadId: string): Promise<any> {
    // In production, fetch from CRM APIs or database
    // For now, return mock data
    return {
      id: leadId,
      companySize: 'mid_market',
      pageViews: 8,
      timeOnSite: 420,
      demoRequested: Math.random() > 0.7,
      email: `lead${leadId}@company.com`,
      industry: 'technology'
    };
  }

  private assessDataQuality(data: any): number {
    const fields = Object.keys(data);
    const nonNullFields = fields.filter(field => data[field] !== null && data[field] !== undefined);
    return nonNullFields.length / Math.max(fields.length, 1);
  }

  private async persistRule(rule: ScoringRule): Promise<void> {
    await this.redis.setex(`scoring:rule:${rule.id}`, 86400, JSON.stringify(rule));
  }

  private async persistLeadProfile(profile: LeadScoreProfile): Promise<void> {
    await this.redis.setex(`scoring:profile:${profile.leadId}`, 86400, JSON.stringify(profile));
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    rules: number;
    activeRules: number;
    leadProfiles: number;
    activeCalculations: number;
    pendingUpdates: number;
    metricsStatus: 'active' | 'inactive';
  }> {
    const activeRules = this.getScoringRules({ isActive: true }).length;
    const pendingUpdates = Array.from(this.pendingUpdates.values())
      .filter(u => u.status === 'pending' || u.status === 'in_progress').length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (pendingUpdates > 100) {
      status = 'degraded';
    }
    if (pendingUpdates > 500 || activeRules === 0) {
      status = 'unhealthy';
    }

    return {
      status,
      rules: this.scoringRules.size,
      activeRules,
      leadProfiles: this.leadProfiles.size,
      activeCalculations: this.activeCalculations.size,
      pendingUpdates,
      metricsStatus: this.metricsInterval ? 'active' : 'inactive'
    };
  }

  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.triggerInterval) {
      clearInterval(this.triggerInterval);
    }
    this.removeAllListeners();
  }

  // =============================================================================
  // MOCK DATA GENERATION
  // =============================================================================

  generateMockData(): void {
    // Generate mock lead profiles
    const mockLeadIds = ['lead_001', 'lead_002', 'lead_003'];

    mockLeadIds.forEach(async (leadId, index) => {
      const profile: LeadScoreProfile = {
        leadId,
        currentScore: 25 + (index * 20) + Math.random() * 20,
        scoreHistory: [
          {
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
            score: 20 + (index * 15),
            change: 20 + (index * 15),
            trigger: 'initial',
            ruleIds: ['demographic_company_size'],
            calculationId: `calc_${Date.now() - 86400000}_${index}`
          }
        ],
        breakdown: {
          demographic: 15 + (index * 5),
          behavioral: 10 + (index * 3),
          firmographic: 5 + (index * 2),
          engagement: 8 + (index * 4),
          intent: 12 + (index * 6),
          custom: 0,
          total: 50 + (index * 20)
        },
        crmSyncStatus: {
          salesforce: {
            lastSynced: new Date(Date.now() - 3600000), // 1 hour ago
            status: 'synced',
            score: 50 + (index * 20)
          },
          hubspot: {
            lastSynced: new Date(Date.now() - 1800000), // 30 minutes ago
            status: 'pending',
            score: 48 + (index * 20)
          }
        },
        metadata: {
          firstScored: new Date(Date.now() - 86400000 * 7), // 1 week ago
          lastUpdated: new Date(Date.now() - 3600000), // 1 hour ago
          totalCalculations: 5 + index,
          dataQuality: 0.8 + (index * 0.05)
        }
      };

      this.leadProfiles.set(leadId, profile);
    });

    console.log('Generated mock real-time scoring data for 3 leads');
  }
}

export default RealtimeScoringService;
