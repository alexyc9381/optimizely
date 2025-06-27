import { EventEmitter } from 'events';
import { RedisManager } from './redis-client';
import { TerritoryManagementService } from './territory-management-service';
import { VisitorIntelligenceService } from './visitor-intelligence-service';

// Core Interfaces
export interface Lead {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  source: string;
  campaign?: string;
  score: number;
  priority: 'hot' | 'warm' | 'cold';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  assignedRep?: string;
  territoryId?: string;
  metadata: LeadMetadata;
  createdAt: Date;
  updatedAt: Date;
  routedAt?: Date;
  contactedAt?: Date;
}

export interface LeadMetadata {
  visitorId?: string;
  sessionCount: number;
  pageViews: number;
  timeOnSite: number;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  device: 'desktop' | 'mobile' | 'tablet';
  location?: {
    country: string;
    state?: string;
    city?: string;
    zipCode?: string;
  };
  companyData?: {
    industry?: string;
    size?: string;
    revenue?: number;
    employees?: number;
  };
  behaviorScore: number;
  intentScore: number;
  engagementScore: number;
  customFields: Record<string, any>;
}

export interface RoutingRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
  conditions: RoutingCondition[];
  actions: RoutingAction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutingCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RoutingAction {
  type: 'assign_to_rep' | 'assign_to_territory' | 'assign_to_queue' | 'set_priority' | 'add_tag' | 'send_notification' | 'webhook';
  parameters: Record<string, any>;
}

export interface RoutingQueue {
  id: string;
  name: string;
  description: string;
  type: 'round_robin' | 'weighted' | 'skill_based' | 'load_balanced' | 'priority_based';
  members: QueueMember[];
  settings: QueueSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueMember {
  repId: string;
  weight: number;
  maxLeads: number;
  currentLeads: number;
  skills: string[];
  availability: 'available' | 'busy' | 'offline';
  lastAssigned?: Date;
}

export interface QueueSettings {
  maxWaitTime: number;
  escalationRules: EscalationRule[];
  businessHours: BusinessHours;
  fallbackQueue?: string;
  notificationSettings: NotificationSettings;
}

export interface EscalationRule {
  condition: 'wait_time_exceeded' | 'no_available_reps' | 'high_priority_lead';
  threshold: number;
  action: 'reassign' | 'notify_manager' | 'move_to_queue';
  parameters: Record<string, any>;
}

export interface BusinessHours {
  timezone: string;
  schedule: {
    [key: string]: {
      start: string;
      end: string;
      enabled: boolean;
    };
  };
  holidays: string[];
}

export interface NotificationSettings {
  email: boolean;
  slack: boolean;
  webhook: boolean;
  sms: boolean;
  channels: {
    email?: string[];
    slack?: string[];
    webhook?: string[];
    sms?: string[];
  };
}

export interface RoutingResult {
  leadId: string;
  assignedRep?: string;
  territoryId?: string;
  queueId?: string;
  routingReason: string;
  confidence: number;
  appliedRules: string[];
  fallbackUsed: boolean;
  routingTime: number;
  metadata: Record<string, any>;
}

export interface RoutingAnalytics {
  overview: {
    totalLeads: number;
    routedLeads: number;
    averageRoutingTime: number;
    routingSuccessRate: number;
    conversionRate: number;
  };
  performance: {
    topPerformingReps: Array<{
      repId: string;
      leadsAssigned: number;
      conversionRate: number;
      averageResponseTime: number;
    }>;
    queuePerformance: Array<{
      queueId: string;
      throughput: number;
      averageWaitTime: number;
      escalationRate: number;
    }>;
  };
  trends: Array<{
    date: string;
    leadsRouted: number;
    averageScore: number;
    conversionRate: number;
  }>;
}

export interface LeadFilters {
  status?: string[];
  priority?: string[];
  assignedRep?: string;
  territoryId?: string;
  source?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  scoreRange?: {
    min: number;
    max: number;
  };
}

export class AutomatedLeadRoutingService extends EventEmitter {
  private readonly CACHE_TTL = 60 * 10; // 10 minutes
  private readonly CACHE_KEY_PREFIX = 'lead_routing';

  constructor(
    private redisManager: RedisManager,
    private visitorService: VisitorIntelligenceService,
    private territoryService: TerritoryManagementService
  ) {
    super();
  }

  // Lead Management
  async createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    try {
      const lead: Lead = {
        ...leadData,
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Enrich lead with visitor data if available
      if (lead.metadata.visitorId) {
        try {
          const visitorData = await this.visitorService.getVisitorDetails(lead.metadata.visitorId);
          if (visitorData) {
            lead.metadata.behaviorScore = visitorData.engagementScore;
            lead.metadata.intentScore = visitorData.intentScore;
            lead.metadata.engagementScore = visitorData.engagementScore;
          }
        } catch (error) {
          console.warn('Could not enrich lead with visitor data:', error);
        }
      }

      // Cache the lead
      const cacheKey = `${this.CACHE_KEY_PREFIX}:lead:${lead.id}`;
      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(lead));

      this.emit('leadCreated', lead);
      return lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  async routeLead(leadId: string, options: { forceReroute?: boolean; skipCache?: boolean } = {}): Promise<RoutingResult> {
    try {
      const startTime = Date.now();
      const lead = await this.getLeadById(leadId);

      if (!lead) {
        throw new Error(`Lead ${leadId} not found`);
      }

      // Check if already routed and not forcing reroute
      if (lead.assignedRep && !options.forceReroute) {
        return {
          leadId,
          assignedRep: lead.assignedRep,
          territoryId: lead.territoryId,
          routingReason: 'Already assigned',
          confidence: 1.0,
          appliedRules: [],
          fallbackUsed: false,
          routingTime: Date.now() - startTime,
          metadata: {}
        };
      }

      // Get active routing rules and apply them
      const rules = await this.getActiveRoutingRules();
      const appliedRules: string[] = [];
      let routingResult: Partial<RoutingResult> = {};

      // Apply routing rules in priority order
      for (const rule of rules) {
        if (await this.evaluateRoutingConditions(lead, rule.conditions)) {
          const actionResult = await this.executeRoutingActions(lead, rule.actions);
          if (actionResult.assignedRep || actionResult.queueId) {
            routingResult = { ...routingResult, ...actionResult };
            appliedRules.push(rule.id);
            break; // First matching rule wins
          }
        }
      }

      // Fallback routing if no rules matched
      if (!routingResult.assignedRep && !routingResult.queueId) {
        routingResult = await this.performFallbackRouting(lead);
        routingResult.fallbackUsed = true;
      }

      // Update lead with routing result
      if (routingResult.assignedRep) {
        await this.updateLeadAssignment(leadId, routingResult.assignedRep, routingResult.territoryId);
      }

      const finalResult: RoutingResult = {
        leadId,
        assignedRep: routingResult.assignedRep,
        territoryId: routingResult.territoryId,
        queueId: routingResult.queueId,
        routingReason: routingResult.routingReason || 'Automatic routing',
        confidence: routingResult.confidence || 0.8,
        appliedRules,
        fallbackUsed: routingResult.fallbackUsed || false,
        routingTime: Date.now() - startTime,
        metadata: routingResult.metadata || {}
      };

      this.emit('leadRouted', finalResult);
      return finalResult;
    } catch (error) {
      console.error('Error routing lead:', error);
      throw error;
    }
  }

  async getLeadById(leadId: string): Promise<Lead | null> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}:lead:${leadId}`;
      const cached = await this.redisManager.getClient().get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      // In real implementation, fetch from database
      return null;
    } catch (error) {
      console.error('Error getting lead:', error);
      throw error;
    }
  }

  async getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}:leads:${JSON.stringify(filters)}`;
      const cached = await this.redisManager.getClient().get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const leads = this.generateMockLeads(50);
      const filtered = this.applyLeadFilters(leads, filters);

      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(filtered));
      return filtered;
    } catch (error) {
      console.error('Error getting leads:', error);
      throw error;
    }
  }

  // Routing Rules Management
  async createRoutingRule(ruleData: Omit<RoutingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoutingRule> {
    try {
      const rule: RoutingRule = {
        ...ruleData,
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const cacheKey = `${this.CACHE_KEY_PREFIX}:rule:${rule.id}`;
      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(rule));

      await this.clearRoutingRulesCache();
      this.emit('routingRuleCreated', rule);
      return rule;
    } catch (error) {
      console.error('Error creating routing rule:', error);
      throw error;
    }
  }

  async getActiveRoutingRules(): Promise<RoutingRule[]> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}:active_rules`;
      const cached = await this.redisManager.getClient().get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const rules = this.generateMockRoutingRules()
        .filter(rule => rule.isActive)
        .sort((a, b) => a.priority - b.priority);

      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(rules));
      return rules;
    } catch (error) {
      console.error('Error getting active routing rules:', error);
      throw error;
    }
  }

  // Queue Management
  async createRoutingQueue(queueData: Omit<RoutingQueue, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoutingQueue> {
    try {
      const queue: RoutingQueue = {
        ...queueData,
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const cacheKey = `${this.CACHE_KEY_PREFIX}:queue:${queue.id}`;
      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(queue));

      this.emit('queueCreated', queue);
      return queue;
    } catch (error) {
      console.error('Error creating routing queue:', error);
      throw error;
    }
  }

  async getRoutingQueues(): Promise<RoutingQueue[]> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}:queues`;
      const cached = await this.redisManager.getClient().get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const queues = this.generateMockQueues();
      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(queues));
      return queues;
    } catch (error) {
      console.error('Error getting routing queues:', error);
      throw error;
    }
  }

  // Analytics and Reporting
  async getRoutingAnalytics(filters: { dateRange?: { start: Date; end: Date } } = {}): Promise<RoutingAnalytics> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}:analytics:${JSON.stringify(filters)}`;
      const cached = await this.redisManager.getClient().get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const analytics = await this.calculateRoutingAnalytics(filters);
      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(analytics));
      return analytics;
    } catch (error) {
      console.error('Error getting routing analytics:', error);
      throw error;
    }
  }

  // Private Helper Methods
  private async evaluateRoutingConditions(lead: Lead, conditions: RoutingCondition[]): Promise<boolean> {
    for (const condition of conditions) {
      const fieldValue = this.getLeadFieldValue(lead, condition.field);
      const matches = this.evaluateCondition(fieldValue, condition.operator, condition.value);

      if (!matches) {
        return false; // All conditions must match (AND logic)
      }
    }
    return true;
  }

  private getLeadFieldValue(lead: Lead, field: string): any {
    const fieldParts = field.split('.');
    let value: any = lead;

    for (const part of fieldParts) {
      value = value?.[part];
    }

    return value;
  }

  private evaluateCondition(fieldValue: any, operator: string, conditionValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      default:
        return false;
    }
  }

  private async executeRoutingActions(lead: Lead, actions: RoutingAction[]): Promise<Partial<RoutingResult>> {
    let result: Partial<RoutingResult> = {};

    for (const action of actions) {
      switch (action.type) {
        case 'assign_to_rep':
          result.assignedRep = action.parameters.repId;
          result.routingReason = 'Assigned to specific rep';
          result.confidence = 0.95;
          break;

        case 'assign_to_territory':
          try {
            const territory = await this.territoryService.getTerritoryById(action.parameters.territoryId);
            if (territory) {
              result.assignedRep = territory.assignedRep;
              result.territoryId = territory.id;
              result.routingReason = 'Assigned via territory';
              result.confidence = 0.85;
            }
          } catch (error) {
            console.warn('Could not assign to territory:', error);
          }
          break;

        case 'assign_to_queue':
          const queueAssignment = await this.assignToQueue(lead, action.parameters.queueId);
          result = { ...result, ...queueAssignment };
          break;

        case 'set_priority':
          // Update lead priority (would update in database)
          break;

        case 'send_notification':
          await this.sendNotification(action.parameters);
          break;
      }
    }

    return result;
  }

  private async assignToQueue(lead: Lead, queueId: string): Promise<Partial<RoutingResult>> {
    const queues = await this.getRoutingQueues();
    const queue = queues.find(q => q.id === queueId);

    if (!queue) {
      return { routingReason: 'Queue not found' };
    }

    // Implement queue assignment logic based on queue type
    let assignedMember: QueueMember | null = null;

    switch (queue.type) {
      case 'round_robin':
        assignedMember = this.getNextRoundRobinMember(queue);
        break;
      case 'weighted':
        assignedMember = this.getWeightedMember(queue);
        break;
      case 'skill_based':
        assignedMember = this.getSkillBasedMember(queue, lead);
        break;
      case 'load_balanced':
        assignedMember = this.getLoadBalancedMember(queue);
        break;
    }

    if (assignedMember) {
      return {
        assignedRep: assignedMember.repId,
        queueId,
        routingReason: `Assigned via ${queue.type} queue`,
        confidence: 0.8
      };
    }

    return {
      queueId,
      routingReason: 'Added to queue - no available reps',
      confidence: 0.6
    };
  }

  private getNextRoundRobinMember(queue: RoutingQueue): QueueMember | null {
    const availableMembers = queue.members.filter(m =>
      m.availability === 'available' && m.currentLeads < m.maxLeads
    );

    if (availableMembers.length === 0) return null;

    // Sort by last assigned time (oldest first)
    availableMembers.sort((a, b) => {
      const aTime = a.lastAssigned?.getTime() || 0;
      const bTime = b.lastAssigned?.getTime() || 0;
      return aTime - bTime;
    });

    return availableMembers[0];
  }

  private getWeightedMember(queue: RoutingQueue): QueueMember | null {
    const availableMembers = queue.members.filter(m =>
      m.availability === 'available' && m.currentLeads < m.maxLeads
    );

    if (availableMembers.length === 0) return null;

    const totalWeight = availableMembers.reduce((sum, m) => sum + m.weight, 0);
    const random = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const member of availableMembers) {
      currentWeight += member.weight;
      if (random <= currentWeight) {
        return member;
      }
    }

    return availableMembers[0];
  }

  private getSkillBasedMember(queue: RoutingQueue, lead: Lead): QueueMember | null {
    const requiredSkills = this.extractRequiredSkills(lead);

    const availableMembers = queue.members.filter(m =>
      m.availability === 'available' &&
      m.currentLeads < m.maxLeads &&
      this.hasRequiredSkills(m.skills, requiredSkills)
    );

    if (availableMembers.length === 0) return null;

    // Sort by skill match score
    availableMembers.sort((a, b) => {
      const aScore = this.calculateSkillMatchScore(a.skills, requiredSkills);
      const bScore = this.calculateSkillMatchScore(b.skills, requiredSkills);
      return bScore - aScore;
    });

    return availableMembers[0];
  }

  private getLoadBalancedMember(queue: RoutingQueue): QueueMember | null {
    const availableMembers = queue.members.filter(m =>
      m.availability === 'available' && m.currentLeads < m.maxLeads
    );

    if (availableMembers.length === 0) return null;

    // Sort by current load (lowest first)
    availableMembers.sort((a, b) => {
      const aLoad = a.currentLeads / a.maxLeads;
      const bLoad = b.currentLeads / b.maxLeads;
      return aLoad - bLoad;
    });

    return availableMembers[0];
  }

  private extractRequiredSkills(lead: Lead): string[] {
    const skills: string[] = [];

    if (lead.metadata.companyData?.industry) {
      skills.push(lead.metadata.companyData.industry.toLowerCase());
    }

    if (lead.score > 80) {
      skills.push('enterprise');
    }

    if (lead.priority === 'hot') {
      skills.push('high_priority');
    }

    return skills;
  }

  private hasRequiredSkills(memberSkills: string[], requiredSkills: string[]): boolean {
    return requiredSkills.every(skill => memberSkills.includes(skill));
  }

  private calculateSkillMatchScore(memberSkills: string[], requiredSkills: string[]): number {
    const matchCount = requiredSkills.filter(skill => memberSkills.includes(skill)).length;
    return requiredSkills.length > 0 ? matchCount / requiredSkills.length : 0;
  }

  private async performFallbackRouting(lead: Lead): Promise<Partial<RoutingResult>> {
    // Try territory-based routing as fallback
    try {
      const territories = await this.territoryService.getTerritories({ status: ['active'] });

      for (const territory of territories) {
        if (await this.leadMatchesTerritory(lead, territory)) {
          return {
            assignedRep: territory.assignedRep,
            territoryId: territory.id,
            routingReason: 'Fallback territory assignment',
            confidence: 0.6
          };
        }
      }
    } catch (error) {
      console.warn('Could not perform territory-based fallback routing:', error);
    }

    // Final fallback - assign to default queue or rep
    return {
      assignedRep: 'default_rep',
      routingReason: 'Default assignment',
      confidence: 0.3
    };
  }

  private async leadMatchesTerritory(lead: Lead, territory: any): Promise<boolean> {
    // Simplified territory matching logic
    if (territory.boundaries.geographic && lead.metadata.location) {
      const { geographic } = territory.boundaries;
      if (geographic.countries.includes(lead.metadata.location.country)) {
        return true;
      }
    }

    if (territory.boundaries.industry && lead.metadata.companyData?.industry) {
      if (territory.boundaries.industry.includes(lead.metadata.companyData.industry)) {
        return true;
      }
    }

    return false;
  }

  private async updateLeadAssignment(leadId: string, repId: string, territoryId?: string): Promise<void> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:lead:${leadId}`;
    const lead = await this.getLeadById(leadId);

    if (lead) {
      lead.assignedRep = repId;
      lead.territoryId = territoryId;
      lead.routedAt = new Date();
      lead.updatedAt = new Date();

      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(lead));
    }
  }

  private async sendNotification(parameters: Record<string, any>): Promise<void> {
    // Mock notification implementation
    console.log('Sending notification:', parameters);
  }

  private async calculateRoutingAnalytics(filters: { dateRange?: { start: Date; end: Date } }): Promise<RoutingAnalytics> {
    // Mock analytics calculation
    return {
      overview: {
        totalLeads: Math.floor(Math.random() * 1000) + 500,
        routedLeads: Math.floor(Math.random() * 800) + 400,
        averageRoutingTime: Math.random() * 5000 + 1000,
        routingSuccessRate: Math.random() * 0.2 + 0.8,
        conversionRate: Math.random() * 0.15 + 0.1
      },
      performance: {
        topPerformingReps: Array.from({ length: 5 }, (_, i) => ({
          repId: `rep_${i + 1}`,
          leadsAssigned: Math.floor(Math.random() * 50) + 20,
          conversionRate: Math.random() * 0.3 + 0.1,
          averageResponseTime: Math.random() * 24 + 1
        })),
        queuePerformance: Array.from({ length: 3 }, (_, i) => ({
          queueId: `queue_${i + 1}`,
          throughput: Math.floor(Math.random() * 100) + 50,
          averageWaitTime: Math.random() * 60 + 10,
          escalationRate: Math.random() * 0.1 + 0.02
        }))
      },
      trends: Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          leadsRouted: Math.floor(Math.random() * 50) + 20,
          averageScore: Math.random() * 40 + 60,
          conversionRate: Math.random() * 0.2 + 0.1
        };
      }).reverse()
    };
  }

  private applyLeadFilters(leads: Lead[], filters: LeadFilters): Lead[] {
    let filtered = leads;

    if (filters.status) {
      filtered = filtered.filter(l => filters.status!.includes(l.status));
    }

    if (filters.priority) {
      filtered = filtered.filter(l => filters.priority!.includes(l.priority));
    }

    if (filters.assignedRep) {
      filtered = filtered.filter(l => l.assignedRep === filters.assignedRep);
    }

    if (filters.territoryId) {
      filtered = filtered.filter(l => l.territoryId === filters.territoryId);
    }

    if (filters.source) {
      filtered = filtered.filter(l => filters.source!.includes(l.source));
    }

    if (filters.scoreRange) {
      filtered = filtered.filter(l =>
        l.score >= filters.scoreRange!.min && l.score <= filters.scoreRange!.max
      );
    }

    if (filters.dateRange) {
      filtered = filtered.filter(l =>
        l.createdAt >= filters.dateRange!.start && l.createdAt <= filters.dateRange!.end
      );
    }

    return filtered;
  }

  private generateMockLeads(count: number): Lead[] {
    const leads: Lead[] = [];
    const sources = ['website', 'linkedin', 'email', 'referral', 'advertisement'];
    const priorities: Lead['priority'][] = ['hot', 'warm', 'cold'];
    const statuses: Lead['status'][] = ['new', 'contacted', 'qualified', 'converted', 'lost'];

    for (let i = 1; i <= count; i++) {
      leads.push({
        id: `lead_${i}`,
        email: `lead${i}@company.com`,
        firstName: `First${i}`,
        lastName: `Last${i}`,
        company: `Company ${i}`,
        jobTitle: 'Manager',
        source: sources[Math.floor(Math.random() * sources.length)],
        score: Math.floor(Math.random() * 100),
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        assignedRep: Math.random() > 0.3 ? `rep_${Math.floor(Math.random() * 10) + 1}` : undefined,
        territoryId: Math.random() > 0.4 ? `territory_${Math.floor(Math.random() * 5) + 1}` : undefined,
        metadata: {
          sessionCount: Math.floor(Math.random() * 10) + 1,
          pageViews: Math.floor(Math.random() * 50) + 5,
          timeOnSite: Math.floor(Math.random() * 3600) + 300,
          device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)] as any,
          behaviorScore: Math.random() * 100,
          intentScore: Math.random() * 100,
          engagementScore: Math.random() * 100,
          customFields: {}
        },
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
    }

    return leads;
  }

  private generateMockRoutingRules(): RoutingRule[] {
    return [
      {
        id: 'rule_enterprise',
        name: 'Enterprise Leads',
        description: 'Route high-value enterprise leads to senior reps',
        priority: 1,
        isActive: true,
        conditions: [
          { field: 'score', operator: 'greater_than', value: 80 },
          { field: 'metadata.companyData.employees', operator: 'greater_than', value: 1000 }
        ],
        actions: [
          { type: 'assign_to_queue', parameters: { queueId: 'enterprise_queue' } }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'rule_geographic',
        name: 'Geographic Routing',
        description: 'Route leads based on geographic location',
        priority: 2,
        isActive: true,
        conditions: [
          { field: 'metadata.location.country', operator: 'equals', value: 'United States' }
        ],
        actions: [
          { type: 'assign_to_territory', parameters: { territoryId: 'territory_us' } }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private generateMockQueues(): RoutingQueue[] {
    return [
      {
        id: 'enterprise_queue',
        name: 'Enterprise Queue',
        description: 'High-value enterprise leads',
        type: 'skill_based',
        members: [
          {
            repId: 'rep_1',
            weight: 3,
            maxLeads: 20,
            currentLeads: 5,
            skills: ['enterprise', 'technology'],
            availability: 'available'
          },
          {
            repId: 'rep_2',
            weight: 2,
            maxLeads: 15,
            currentLeads: 8,
            skills: ['enterprise', 'healthcare'],
            availability: 'available'
          }
        ],
        settings: {
          maxWaitTime: 30,
          escalationRules: [],
          businessHours: {
            timezone: 'America/New_York',
            schedule: {
              monday: { start: '09:00', end: '17:00', enabled: true },
              tuesday: { start: '09:00', end: '17:00', enabled: true },
              wednesday: { start: '09:00', end: '17:00', enabled: true },
              thursday: { start: '09:00', end: '17:00', enabled: true },
              friday: { start: '09:00', end: '17:00', enabled: true },
              saturday: { start: '09:00', end: '17:00', enabled: false },
              sunday: { start: '09:00', end: '17:00', enabled: false }
            },
            holidays: []
          },
          notificationSettings: {
            email: true,
            slack: true,
            webhook: false,
            sms: false,
            channels: {}
          }
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private async clearRoutingRulesCache(): Promise<void> {
    const pattern = `${this.CACHE_KEY_PREFIX}:*rules*`;
    const keys = await this.redisManager.getClient().keys(pattern);
    if (keys.length > 0) {
      await this.redisManager.getClient().del(...keys);
    }
  }
}
