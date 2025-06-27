import { EventEmitter } from 'events';
import { RedisManager } from './redis-client';

// Core Interfaces
export interface Territory {
  id: string;
  name: string;
  description: string;
  type: 'geographic' | 'industry' | 'account_size' | 'named_accounts' | 'hybrid';
  boundaries: TerritoryBoundary;
  assignedRep: string;
  accounts: string[];
  metrics: TerritoryMetrics;
  status: 'active' | 'inactive' | 'pending_assignment';
  createdAt: Date;
  updatedAt: Date;
  rules: TerritoryRule[];
  priority: 'high' | 'medium' | 'low';
}

export interface TerritoryBoundary {
  geographic?: {
    countries: string[];
    states: string[];
    cities: string[];
    zipCodes: string[];
    coordinates?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  industry?: string[];
  accountSize?: {
    minRevenue: number;
    maxRevenue: number;
    minEmployees: number;
    maxEmployees: number;
  };
  namedAccounts?: string[];
  customCriteria?: Record<string, any>;
}

export interface SalesRep {
  id: string;
  name: string;
  email: string;
  territories: string[];
  capacity: number;
  currentLoad: number;
  skills: string[];
  performance: RepPerformance;
  preferences: RepPreferences;
  status: 'active' | 'inactive' | 'vacation' | 'training';
}

export interface RepPerformance {
  quota: number;
  attainment: number;
  revenue: number;
  deals: number;
  conversionRate: number;
  averageDealSize: number;
  responseTime: number;
  customerSatisfaction: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface RepPreferences {
  industries: string[];
  accountSizes: string[];
  geographic: string[];
  workload: 'light' | 'moderate' | 'heavy';
}

export interface TerritoryMetrics {
  totalAccounts: number;
  activeAccounts: number;
  totalRevenue: number;
  potentialRevenue: number;
  coverage: number;
  penetration: number;
  competitiveWins: number;
  competitiveLosses: number;
  averageDealSize: number;
  salesCycle: number;
  conversionRate: number;
  activityMetrics: {
    calls: number;
    emails: number;
    meetings: number;
    demos: number;
  };
}

export interface TerritoryAssignment {
  id: string;
  territoryId: string;
  repId: string;
  accountIds: string[];
  assignedAt: Date;
  effectiveDate: Date;
  reason: string;
  confidence: number;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  metadata: Record<string, any>;
}

export interface TerritoryRule {
  id: string;
  name: string;
  condition: string;
  action: 'assign' | 'exclude' | 'prioritize' | 'flag';
  parameters: Record<string, any>;
  priority: number;
  isActive: boolean;
}

export interface OptimizationRecommendation {
  type: 'reassign' | 'split' | 'merge' | 'expand' | 'contract' | 'adjust_rules';
  priority: 'high' | 'medium' | 'low';
  description: string;
  affectedTerritories: string[];
  affectedReps: string[];
  expectedBenefit: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  reasoning: string[];
}

export interface TerritoryAnalytics {
  overview: {
    totalTerritories: number;
    totalReps: number;
    totalAccounts: number;
    averageLoad: number;
    coverageGaps: number;
    overlaps: number;
  };
  performance: {
    topPerformers: Territory[];
    underPerformers: Territory[];
    balanceScore: number;
    efficiencyScore: number;
  };
  optimization: {
    recommendations: OptimizationRecommendation[];
    potentialGains: number;
    riskFactors: string[];
  };
  trends: Array<{
    date: string;
    coverage: number;
    efficiency: number;
    revenue: number;
  }>;
}

export interface TerritoryFilters {
  status?: string[];
  assignedRep?: string;
  type?: string[];
  priority?: string[];
  minRevenue?: number;
  maxRevenue?: number;
}

export interface AnalyticsFilters {
  timeRange?: {
    start: Date;
    end: Date;
  };
  territoryIds?: string[];
  repIds?: string[];
  includeInactive?: boolean;
}

export class TerritoryManagementService extends EventEmitter {
  private readonly CACHE_TTL = 60 * 5; // 5 minutes
  private readonly CACHE_KEY_PREFIX = 'territory_management';

  constructor(private redisManager: RedisManager) {
    super();
  }

  // Territory CRUD Operations
  async createTerritory(territoryData: Omit<Territory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Territory> {
    try {
      const territory: Territory = {
        ...territoryData,
        id: `territory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const cacheKey = `${this.CACHE_KEY_PREFIX}:territory:${territory.id}`;
      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(territory));

      await this.clearTerritoryListCache();
      this.emit('territoryCreated', territory);
      return territory;
    } catch (error) {
      console.error('Error creating territory:', error);
      throw error;
    }
  }

  async updateTerritory(territoryId: string, updates: Partial<Territory>): Promise<Territory> {
    try {
      const territory = await this.getTerritoryById(territoryId);
      if (!territory) {
        throw new Error(`Territory ${territoryId} not found`);
      }

      const updatedTerritory: Territory = {
        ...territory,
        ...updates,
        updatedAt: new Date()
      };

      // Store in cache
      const cacheKey = `${this.CACHE_KEY_PREFIX}:territory:${territoryId}`;
      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(updatedTerritory));

      // Clear related caches
      await this.clearTerritoryListCache();

      this.emit('territoryUpdated', { territoryId, updates, territory: updatedTerritory });
      return updatedTerritory;
    } catch (error) {
      console.error('Error updating territory:', error);
      throw error;
    }
  }

  async getTerritoryById(territoryId: string): Promise<Territory | null> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}:territory:${territoryId}`;
      const cached = await this.redisManager.getClient().get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const territory = await this.fetchTerritoryFromDatabase(territoryId);

      if (territory) {
        await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(territory));
      }

      return territory;
    } catch (error) {
      console.error('Error getting territory:', error);
      throw error;
    }
  }

  async getTerritories(filters: TerritoryFilters = {}): Promise<Territory[]> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}:territories:${JSON.stringify(filters)}`;
      const cached = await this.redisManager.getClient().get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const territories = this.generateMockTerritories(25);
      const filtered = this.applyTerritoryFilters(territories, filters);

      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(filtered));
      return filtered;
    } catch (error) {
      console.error('Error getting territories:', error);
      throw error;
    }
  }

  async getSalesReps(filters: { status?: string; territories?: string[] } = {}): Promise<SalesRep[]> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}:reps:${JSON.stringify(filters)}`;
      const cached = await this.redisManager.getClient().get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const reps = this.generateMockSalesReps(15);
      const filtered = this.applySalesRepFilters(reps, filters);

      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(filtered));
      return filtered;
    } catch (error) {
      console.error('Error getting sales reps:', error);
      throw error;
    }
  }

  // Assignment Operations
  async assignAccountToTerritory(accountId: string, territoryId: string, reason: string): Promise<TerritoryAssignment> {
    try {
      const territory = await this.getTerritoryById(territoryId);
      if (!territory) {
        throw new Error(`Territory ${territoryId} not found`);
      }

      const assignment: TerritoryAssignment = {
        id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        territoryId,
        repId: territory.assignedRep,
        accountIds: [accountId],
        assignedAt: new Date(),
        effectiveDate: new Date(),
        reason,
        confidence: this.calculateAssignmentConfidence(accountId, territoryId),
        status: 'active',
        metadata: {}
      };

      await this.updateTerritoryAccounts(territoryId, [...territory.accounts, accountId]);
      this.emit('accountAssigned', assignment);
      return assignment;
    } catch (error) {
      console.error('Error assigning account to territory:', error);
      throw error;
    }
  }

  async optimizeTerritories(): Promise<{ recommendations: OptimizationRecommendation[]; confidence: number }> {
    try {
      const territories = await this.getTerritories();
      const reps = await this.getSalesReps();

      const recommendations = await this.generateOptimizationRecommendations(territories, reps);
      const confidence = this.calculateOptimizationConfidence(recommendations);

      this.emit('territoryOptimizationGenerated', { recommendations, confidence });
      return { recommendations, confidence };
    } catch (error) {
      console.error('Error optimizing territories:', error);
      throw error;
    }
  }

  // Analytics
  async getTerritoryAnalytics(filters: AnalyticsFilters = {}): Promise<TerritoryAnalytics> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}:analytics:${JSON.stringify(filters)}`;
      const cached = await this.redisManager.getClient().get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const territories = await this.getTerritories();
      const reps = await this.getSalesReps();

      const analytics = await this.calculateTerritoryAnalytics(territories, reps, filters);

      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(analytics));
      return analytics;
    } catch (error) {
      console.error('Error getting territory analytics:', error);
      throw error;
    }
  }

  // Helper methods for mock data and implementation
  private generateMockTerritories(count: number): Territory[] {
    const territories: Territory[] = [];
    const types: Territory['type'][] = ['geographic', 'industry', 'account_size', 'named_accounts', 'hybrid'];
    const priorities: Territory['priority'][] = ['high', 'medium', 'low'];

    for (let i = 1; i <= count; i++) {
      territories.push({
        id: `territory_${i}`,
        name: `Territory ${i}`,
        description: `Sales territory covering key accounts in region ${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        boundaries: this.generateMockBoundary(),
        assignedRep: `rep_${Math.floor(Math.random() * 15) + 1}`,
        accounts: Array.from({ length: Math.floor(Math.random() * 30) + 10 }, (_, idx) => `account_${i}_${idx + 1}`),
        metrics: this.generateMockMetrics(),
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        rules: this.generateMockRules(),
        priority: priorities[Math.floor(Math.random() * priorities.length)]
      });
    }

    return territories;
  }

  private generateMockSalesReps(count: number): SalesRep[] {
    const reps: SalesRep[] = [];
    const statuses: SalesRep['status'][] = ['active', 'inactive', 'vacation', 'training'];

    for (let i = 1; i <= count; i++) {
      const capacity = Math.floor(Math.random() * 50) + 30;
      const currentLoad = Math.floor(Math.random() * capacity);

      reps.push({
        id: `rep_${i}`,
        name: `Sales Rep ${i}`,
        email: `rep${i}@company.com`,
        territories: [`territory_${i}`, `territory_${i + 1}`].filter(Boolean),
        capacity,
        currentLoad,
        skills: ['prospecting', 'closing', 'account_management'].slice(0, Math.floor(Math.random() * 3) + 1),
        performance: this.generateMockPerformance(),
        preferences: this.generateMockPreferences(),
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }

    return reps;
  }

  private generateMockBoundary(): TerritoryBoundary {
    return {
      geographic: {
        countries: ['United States'],
        states: ['California', 'Texas', 'New York'].slice(0, Math.floor(Math.random() * 3) + 1),
        cities: ['San Francisco', 'Austin', 'Boston'].slice(0, Math.floor(Math.random() * 3) + 1),
        zipCodes: ['94105', '78701', '02101']
      },
      industry: ['Technology', 'Healthcare', 'Finance'].slice(0, Math.floor(Math.random() * 3) + 1),
      accountSize: {
        minRevenue: 1000000,
        maxRevenue: 10000000,
        minEmployees: 100,
        maxEmployees: 1000
      }
    };
  }

  private generateMockMetrics(): TerritoryMetrics {
    const totalAccounts = Math.floor(Math.random() * 50) + 20;
    return {
      totalAccounts,
      activeAccounts: Math.floor(totalAccounts * 0.8),
      totalRevenue: Math.floor(Math.random() * 5000000) + 1000000,
      potentialRevenue: Math.floor(Math.random() * 2000000) + 500000,
      coverage: Math.random() * 40 + 60,
      penetration: Math.random() * 30 + 40,
      competitiveWins: Math.floor(Math.random() * 20) + 5,
      competitiveLosses: Math.floor(Math.random() * 10) + 2,
      averageDealSize: Math.floor(Math.random() * 100000) + 50000,
      salesCycle: Math.floor(Math.random() * 90) + 30,
      conversionRate: Math.random() * 0.2 + 0.05,
      activityMetrics: {
        calls: Math.floor(Math.random() * 200) + 50,
        emails: Math.floor(Math.random() * 300) + 100,
        meetings: Math.floor(Math.random() * 50) + 20,
        demos: Math.floor(Math.random() * 30) + 10
      }
    };
  }

  private generateMockPerformance(): RepPerformance {
    const quota = Math.floor(Math.random() * 2000000) + 1000000;
    return {
      quota,
      attainment: Math.random() * 1.5 + 0.5,
      revenue: Math.floor(quota * (Math.random() * 1.5 + 0.5)),
      deals: Math.floor(Math.random() * 50) + 10,
      conversionRate: Math.random() * 0.3 + 0.1,
      averageDealSize: Math.floor(Math.random() * 150000) + 50000,
      responseTime: Math.random() * 12 + 2,
      customerSatisfaction: Math.random() * 2 + 8,
      period: {
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date(new Date().getFullYear(), 11, 31)
      }
    };
  }

  private generateMockPreferences(): RepPreferences {
    return {
      industries: ['Technology', 'Healthcare'].slice(0, Math.floor(Math.random() * 2) + 1),
      accountSizes: ['Enterprise', 'Mid-Market'].slice(0, Math.floor(Math.random() * 2) + 1),
      geographic: ['West Coast', 'East Coast'].slice(0, Math.floor(Math.random() * 2) + 1),
      workload: ['moderate', 'heavy'][Math.floor(Math.random() * 2)] as 'moderate' | 'heavy'
    };
  }

  private generateMockRules(): TerritoryRule[] {
    return [
      {
        id: 'rule_1',
        name: 'Enterprise Account Assignment',
        condition: 'revenue > 1000000',
        action: 'assign',
        parameters: { priority: 'high' },
        priority: 1,
        isActive: true
      }
    ];
  }

  private async fetchTerritoryFromDatabase(territoryId: string): Promise<Territory | null> {
    // Mock implementation - in real app, this would query the database
    return null;
  }

  private async clearTerritoryListCache(): Promise<void> {
    const pattern = `${this.CACHE_KEY_PREFIX}:territories:*`;
    const keys = await this.redisManager.getClient().keys(pattern);
    if (keys.length > 0) {
      await this.redisManager.getClient().del(...keys);
    }
  }

  private calculateAssignmentConfidence(accountId: string, territoryId: string): number {
    // Simplified confidence calculation
    return Math.random() * 0.3 + 0.7; // 70-100%
  }

  private calculateOptimizationConfidence(recommendations: OptimizationRecommendation[]): number {
    return recommendations.length > 0 ? Math.random() * 0.2 + 0.8 : 1.0;
  }

  private async generateOptimizationRecommendations(territories: Territory[], reps: SalesRep[]): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze load balance
    const loadAnalysis = this.analyzeRepLoad(territories, reps);
    if (loadAnalysis.unbalanced.length > 0) {
      recommendations.push({
        type: 'reassign',
        priority: 'high',
        description: 'Rebalance territory assignments to optimize rep workload',
        affectedTerritories: loadAnalysis.unbalanced.map(r => r.territories).flat(),
        affectedReps: loadAnalysis.unbalanced.map(r => r.id),
        expectedBenefit: 'Improved rep productivity and customer coverage',
        effort: 'medium',
        timeline: '2-4 weeks',
        reasoning: ['Load imbalance detected', 'Performance optimization opportunity']
      });
    }

    // Analyze coverage gaps
    const coverageAnalysis = this.analyzeCoverageGaps(territories);
    if (coverageAnalysis.gaps.length > 0) {
      recommendations.push({
        type: 'expand',
        priority: 'medium',
        description: 'Expand territories to cover identified gaps',
        affectedTerritories: coverageAnalysis.affectedTerritories,
        affectedReps: coverageAnalysis.affectedReps,
        expectedBenefit: 'Increased market coverage and revenue potential',
        effort: 'high',
        timeline: '4-8 weeks',
        reasoning: ['Coverage gaps identified', 'Market opportunity']
      });
    }

    return recommendations;
  }

  private analyzeRepLoad(territories: Territory[], reps: SalesRep[]) {
    const unbalanced = reps.filter(rep => rep.currentLoad > rep.capacity * 0.9 || rep.currentLoad < rep.capacity * 0.6);
    return { unbalanced };
  }

  private analyzeCoverageGaps(territories: Territory[]) {
    // Simplified gap analysis
    const gaps = territories.filter(t => t.metrics.coverage < 80);
    return {
      gaps,
      affectedTerritories: gaps.map(g => g.id),
      affectedReps: gaps.map(g => g.assignedRep)
    };
  }

  private async calculateTerritoryAnalytics(territories: Territory[], reps: SalesRep[], filters: AnalyticsFilters): Promise<TerritoryAnalytics> {
    const totalAccounts = territories.reduce((sum, t) => sum + t.accounts.length, 0);
    const averageLoad = reps.reduce((sum, r) => sum + r.currentLoad, 0) / reps.length;

    const topPerformers = territories
      .filter(t => t.metrics.conversionRate > 0.15)
      .sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue)
      .slice(0, 5);

    const underPerformers = territories
      .filter(t => t.metrics.conversionRate < 0.05)
      .sort((a, b) => a.metrics.totalRevenue - b.metrics.totalRevenue)
      .slice(0, 5);

    return {
      overview: {
        totalTerritories: territories.length,
        totalReps: reps.length,
        totalAccounts,
        averageLoad,
        coverageGaps: territories.filter(t => t.metrics.coverage < 80).length,
        overlaps: Math.floor(territories.length * 0.1) // Mock overlap detection
      },
      performance: {
        topPerformers,
        underPerformers,
        balanceScore: Math.random() * 20 + 80,
        efficiencyScore: Math.random() * 15 + 85
      },
      optimization: {
        recommendations: await this.generateOptimizationRecommendations(territories, reps),
        potentialGains: Math.random() * 1000000 + 500000,
        riskFactors: ['Rep turnover', 'Market changes', 'Competition']
      },
      trends: this.generateMockTrends()
    };
  }

  private generateMockTrends() {
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        date: date.toISOString().split('T')[0],
        coverage: Math.random() * 20 + 80,
        efficiency: Math.random() * 15 + 85,
        revenue: Math.random() * 1000000 + 500000
      };
    }).reverse();
  }

  private applyTerritoryFilters(territories: Territory[], filters: TerritoryFilters): Territory[] {
    let filtered = territories;

    if (filters.status) {
      filtered = filtered.filter(t => filters.status!.includes(t.status));
    }

    if (filters.assignedRep) {
      filtered = filtered.filter(t => t.assignedRep === filters.assignedRep);
    }

    if (filters.type) {
      filtered = filtered.filter(t => filters.type!.includes(t.type));
    }

    if (filters.priority) {
      filtered = filtered.filter(t => filters.priority!.includes(t.priority));
    }

    if (filters.minRevenue) {
      filtered = filtered.filter(t => t.metrics.totalRevenue >= filters.minRevenue!);
    }

    if (filters.maxRevenue) {
      filtered = filtered.filter(t => t.metrics.totalRevenue <= filters.maxRevenue!);
    }

    return filtered;
  }

  private applySalesRepFilters(reps: SalesRep[], filters: { status?: string; territories?: string[] }): SalesRep[] {
    let filtered = reps;

    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    if (filters.territories) {
      filtered = filtered.filter(r => r.territories.some(t => filters.territories!.includes(t)));
    }

    return filtered;
  }

  private async updateTerritoryAccounts(territoryId: string, accounts: string[]): Promise<void> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:territory:${territoryId}`;
    const territory = await this.getTerritoryById(territoryId);

    if (territory) {
      territory.accounts = accounts;
      territory.updatedAt = new Date();
      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(territory));
    }
  }
}
