import { EventEmitter } from 'events';
import { RedisManager } from './redis-client';

// Core interfaces for hot accounts system
export interface HotAccount {
  id: string;
  companyName: string;
  domain: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  location: {
    country: string;
    state?: string;
    city?: string;
  };
  revenue?: number;
  employees?: number;
  website: string;
  description?: string;
  technologies: string[];
  contacts: ContactInfo[];
  engagementScore: number;
  revenueScore: number;
  intentScore: number;
  overallScore: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'contacted' | 'engaged' | 'qualified' | 'opportunity' | 'closed';
  assignedSalesRep?: string;
  lastEngagement?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  department: string;
  phone?: string;
  linkedin?: string;
  role: 'decision_maker' | 'influencer' | 'user' | 'gatekeeper';
  engagementLevel: number;
  lastContactDate?: Date;
}

export interface EngagementActivity {
  id: string;
  accountId: string;
  contactId?: string;
  type: 'website_visit' | 'content_download' | 'email_open' | 'email_click' | 'demo_request' | 'pricing_view' | 'support_ticket' | 'social_engagement';
  description: string;
  timestamp: Date;
  value: number; // engagement weight
  source: string;
  metadata: Record<string, any>;
}

export interface AccountEngagementMetrics {
  accountId: string;
  totalEngagementScore: number;
  recentActivityCount: number;
  lastActivityDate: Date;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  activeDaysCount: number;
  averageDailyEngagement: number;
  topEngagementSources: string[];
  keyActivities: EngagementActivity[];
}

export interface ScoringFactors {
  company: {
    size: number;
    industry: number;
    revenue: number;
    technographics: number;
  };
  engagement: {
    frequency: number;
    recency: number;
    depth: number;
    quality: number;
  };
  intent: {
    pricingPageViews: number;
    demoRequests: number;
    contentDownloads: number;
    competitorResearch: number;
  };
  firmographics: {
    location: number;
    employeeCount: number;
    growthRate: number;
  };
}

export interface HotAccountsFilters {
  industries?: string[];
  sizes?: string[];
  priorities?: string[];
  statuses?: string[];
  scoreRange?: {
    min: number;
    max: number;
  };
  engagementTimeframe?: {
    start: Date;
    end: Date;
  };
  assignedReps?: string[];
  technologies?: string[];
  locations?: string[];
}

export interface HotAccountsData {
  accounts: HotAccount[];
  totalCount: number;
  filters: HotAccountsFilters;
  summary: {
    averageScore: number;
    highPriorityCount: number;
    recentEngagementCount: number;
    conversionRate: number;
    topIndustries: string[];
    topTechnologies: string[];
  };
  scoringFactors: ScoringFactors;
}

export class HotAccountsService extends EventEmitter {
  constructor(private redisManager: RedisManager) {
    super();
  }

  private readonly CACHE_TTL = 60 * 5; // 5 minutes
  private readonly CACHE_KEY_PREFIX = 'hot_accounts';

  async getHotAccountsData(filters: HotAccountsFilters = {}): Promise<HotAccountsData> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:data:${JSON.stringify(filters)}`;

    try {
      const cached = await this.redisManager.getClient().get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const accounts = await this.getFilteredAccounts(filters);
      const summary = await this.calculateSummaryMetrics(accounts);
      const scoringFactors = this.getScoringFactors();

      const data: HotAccountsData = {
        accounts,
        totalCount: accounts.length,
        filters,
        summary,
        scoringFactors
      };

      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Error getting hot accounts data:', error);
      return this.generateMockHotAccountsData(filters);
    }
  }

  async getHotAccounts(filters: HotAccountsFilters = {}): Promise<HotAccount[]> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:accounts:${JSON.stringify(filters)}`;

    try {
      const cached = await this.redisManager.getClient().get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const accounts = await this.getFilteredAccounts(filters);
      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(accounts));
      return accounts;
    } catch (error) {
      console.error('Error getting hot accounts:', error);
      return this.generateMockAccounts(50);
    }
  }

  async getAccountDetails(accountId: string): Promise<HotAccount | null> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:account:${accountId}`;

    try {
      const cached = await this.redisManager.getClient().get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // In real implementation, fetch from database
      const account = await this.fetchAccountFromDatabase(accountId);
      if (account) {
        await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(account));
      }
      return account;
    } catch (error) {
      console.error('Error getting account details:', error);
      return this.generateMockAccount(accountId);
    }
  }

  async getAccountEngagementMetrics(accountId: string): Promise<AccountEngagementMetrics> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:engagement:${accountId}`;

    try {
      const cached = await this.redisManager.getClient().get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const metrics = await this.calculateEngagementMetrics(accountId);
      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(metrics));
      return metrics;
    } catch (error) {
      console.error('Error getting engagement metrics:', error);
      return this.generateMockEngagementMetrics(accountId);
    }
  }

  async updateAccountScore(accountId: string): Promise<number> {
    try {
      const account = await this.getAccountDetails(accountId);
      if (!account) {
        throw new Error(`Account ${accountId} not found`);
      }

      const newScore = await this.calculateAccountScore(account);

      // Update account with new score
      account.overallScore = newScore;
      account.updatedAt = new Date();

      // Update priority based on score
      account.priority = this.determinePriority(newScore);

      // Cache updated account
      const cacheKey = `${this.CACHE_KEY_PREFIX}:account:${accountId}`;
      await this.redisManager.getClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(account));

      // Emit score update event
      this.emit('scoreUpdated', { accountId, newScore, priority: account.priority });

      return newScore;
    } catch (error) {
      console.error('Error updating account score:', error);
      throw error;
    }
  }

  async addEngagementActivity(activity: Omit<EngagementActivity, 'id'>): Promise<void> {
    try {
      const activityWithId: EngagementActivity = {
        ...activity,
        id: `engagement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Store the engagement activity
      await this.storeEngagementActivity(activityWithId);

      // Update account score
      await this.updateAccountScore(activity.accountId);

      // Clear related caches
      await this.clearAccountCaches(activity.accountId);

      // Emit engagement event
      this.emit('engagementAdded', activityWithId);
    } catch (error) {
      console.error('Error adding engagement activity:', error);
      throw error;
    }
  }

  private async getFilteredAccounts(filters: HotAccountsFilters): Promise<HotAccount[]> {
    // In real implementation, this would query the database
    // For now, use mock data and apply filters
    let accounts = this.generateMockAccounts(100);

    // Apply filters
    if (filters.industries && filters.industries.length > 0) {
      accounts = accounts.filter(account => filters.industries!.includes(account.industry));
    }

    if (filters.sizes && filters.sizes.length > 0) {
      accounts = accounts.filter(account => filters.sizes!.includes(account.size));
    }

    if (filters.priorities && filters.priorities.length > 0) {
      accounts = accounts.filter(account => filters.priorities!.includes(account.priority));
    }

    if (filters.statuses && filters.statuses.length > 0) {
      accounts = accounts.filter(account => filters.statuses!.includes(account.status));
    }

    if (filters.scoreRange) {
      accounts = accounts.filter(account =>
        account.overallScore >= filters.scoreRange!.min &&
        account.overallScore <= filters.scoreRange!.max
      );
    }

    return accounts;
  }

  private async calculateSummaryMetrics(accounts: HotAccount[]) {
    const totalAccounts = accounts.length;
    const averageScore = totalAccounts > 0 ?
      accounts.reduce((sum, account) => sum + account.overallScore, 0) / totalAccounts : 0;

    const highPriorityCount = accounts.filter(account =>
      account.priority === 'high' || account.priority === 'critical'
    ).length;

    const recentEngagementCount = accounts.filter(account => {
      if (!account.lastEngagement) return false;
      const daysDiff = (Date.now() - account.lastEngagement.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;

    const conversionRate = totalAccounts > 0 ?
      accounts.filter(account => account.status === 'opportunity' || account.status === 'closed').length / totalAccounts * 100 : 0;

    // Calculate top industries
    const industryCount: Record<string, number> = {};
    accounts.forEach(account => {
      industryCount[account.industry] = (industryCount[account.industry] || 0) + 1;
    });
    const topIndustries = Object.entries(industryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([industry]) => industry);

    // Calculate top technologies
    const techCount: Record<string, number> = {};
    accounts.forEach(account => {
      account.technologies.forEach(tech => {
        techCount[tech] = (techCount[tech] || 0) + 1;
      });
    });
    const topTechnologies = Object.entries(techCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tech]) => tech);

    return {
      averageScore,
      highPriorityCount,
      recentEngagementCount,
      conversionRate,
      topIndustries,
      topTechnologies
    };
  }

  private getScoringFactors(): ScoringFactors {
    return {
      company: {
        size: 0.30, // 30% weight
        industry: 0.15, // 15% weight
        revenue: 0.25, // 25% weight
        technographics: 0.10 // 10% weight
      },
      engagement: {
        frequency: 0.40, // 40% weight
        recency: 0.30, // 30% weight
        depth: 0.20, // 20% weight
        quality: 0.10 // 10% weight
      },
      intent: {
        pricingPageViews: 0.40, // 40% weight
        demoRequests: 0.30, // 30% weight
        contentDownloads: 0.20, // 20% weight
        competitorResearch: 0.10 // 10% weight
      },
      firmographics: {
        location: 0.30, // 30% weight
        employeeCount: 0.40, // 40% weight
        growthRate: 0.30 // 30% weight
      }
    };
  }

  private async calculateAccountScore(account: HotAccount): Promise<number> {
    const companyScore = this.calculateCompanyScore(account);
    const firmographicsScore = this.calculateFirmographicsScore(account);
    const engagementScore = account.engagementScore;
    const intentScore = account.intentScore;

    // Weighted calculation
    const totalScore = (companyScore * 0.30) + (engagementScore * 0.40) + (intentScore * 0.20) + (firmographicsScore * 0.10);

    return Math.min(100, Math.max(0, totalScore));
  }

  private calculateCompanyScore(account: HotAccount): number {
    let score = 0;

    // Size scoring
    const sizeScores = { startup: 20, small: 40, medium: 60, large: 80, enterprise: 100 };
    score += sizeScores[account.size] * 0.25;

    // Industry scoring (some industries are higher value)
    const industryScores: Record<string, number> = {
      'Technology': 90,
      'Financial Services': 85,
      'Healthcare': 80,
      'SaaS': 95,
      'E-commerce': 75,
      'Manufacturing': 70,
      'Education': 60,
      'Government': 50
    };
    score += (industryScores[account.industry] || 50) * 0.15;

    // Revenue scoring
    if (account.revenue) {
      const revenueScore = Math.min(100, account.revenue / 1000000 * 10); // $10M = 100 points
      score += revenueScore * 0.20;
    }

    // Technology stack scoring
    const techScore = Math.min(100, account.technologies.length * 10);
    score += techScore * 0.10;

    return score;
  }

  private calculateFirmographicsScore(account: HotAccount): number {
    let score = 0;

    // Employee count scoring
    if (account.employees) {
      const employeeScore = Math.min(100, account.employees / 1000 * 100); // 1000 employees = 100 points
      score += employeeScore * 0.40;
    }

    // Location scoring (prioritize certain regions)
    const locationScores: Record<string, number> = {
      'United States': 100,
      'Canada': 95,
      'United Kingdom': 90,
      'Germany': 85,
      'Australia': 80,
      'France': 75,
      'Netherlands': 70,
      'Singapore': 65
    };

    const locationScore = locationScores[account.location.country] || 50;
    score += locationScore * 0.30;

    // Growth indicators (mock calculation)
    const growthScore = Math.random() * 100; // In real implementation, calculate based on actual growth metrics
    score += growthScore * 0.30;

    return score;
  }

  private async calculateEngagementMetrics(accountId: string): Promise<AccountEngagementMetrics> {
    // In real implementation, fetch actual engagement data
    return this.generateMockEngagementMetrics(accountId);
  }

  private async fetchAccountFromDatabase(accountId: string): Promise<HotAccount | null> {
    // Mock implementation - in real system, query database
    return this.generateMockAccount(accountId);
  }

  private async storeEngagementActivity(activity: EngagementActivity): Promise<void> {
    // Mock implementation - in real system, store in database
    console.log('Storing engagement activity:', activity);
  }

  private determinePriority(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 85) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  private async clearAccountCaches(accountId: string): Promise<void> {
    const keys = [
      `${this.CACHE_KEY_PREFIX}:account:${accountId}`,
      `${this.CACHE_KEY_PREFIX}:engagement:${accountId}`,
      `${this.CACHE_KEY_PREFIX}:data:*`, // Clear all data caches as they may include this account
      `${this.CACHE_KEY_PREFIX}:accounts:*` // Clear all account list caches
    ];

    try {
      for (const key of keys) {
        if (key.includes('*')) {
          // For wildcard keys, we'd need to scan and delete in real Redis implementation
          continue;
        }
        await this.redisManager.getClient().del(key);
      }
    } catch (error) {
      console.error('Error clearing account caches:', error);
    }
  }

  private generateMockHotAccountsData(filters: HotAccountsFilters): HotAccountsData {
    const accounts = this.generateMockAccounts(50);

    return {
      accounts,
      totalCount: accounts.length,
      filters,
      summary: {
        averageScore: 73.5,
        highPriorityCount: 15,
        recentEngagementCount: 8,
        conversionRate: 12.5,
        topIndustries: ['Technology', 'SaaS', 'Financial Services', 'Healthcare', 'E-commerce'],
        topTechnologies: ['React', 'Node.js', 'AWS', 'Docker', 'PostgreSQL']
      },
      scoringFactors: this.getScoringFactors()
    };
  }

  private generateMockAccounts(count: number): HotAccount[] {
    const accounts: HotAccount[] = [];
    const industries = ['Technology', 'SaaS', 'Financial Services', 'Healthcare', 'E-commerce', 'Manufacturing', 'Education'];
    const sizes: Array<'startup' | 'small' | 'medium' | 'large' | 'enterprise'> = ['startup', 'small', 'medium', 'large', 'enterprise'];
    const statuses: Array<'new' | 'contacted' | 'engaged' | 'qualified' | 'opportunity' | 'closed'> = ['new', 'contacted', 'engaged', 'qualified', 'opportunity', 'closed'];
    const technologies = ['React', 'Node.js', 'AWS', 'Docker', 'PostgreSQL', 'Python', 'TypeScript', 'MongoDB', 'Redis', 'GraphQL'];

    for (let i = 1; i <= count; i++) {
      accounts.push(this.generateMockAccount(`account_${i}`));
    }

    return accounts;
  }

  private generateMockAccount(accountId: string): HotAccount {
    const companies = ['TechCorp Inc', 'DataFlow Solutions', 'CloudVision Systems', 'InnovateLab', 'ScaleUp Technologies', 'NextGen Analytics', 'DigitalEdge Corp', 'SmartTech Solutions'];
    const industries = ['Technology', 'SaaS', 'Financial Services', 'Healthcare', 'E-commerce', 'Manufacturing', 'Education'];
    const sizes: Array<'startup' | 'small' | 'medium' | 'large' | 'enterprise'> = ['startup', 'small', 'medium', 'large', 'enterprise'];
    const statuses: Array<'new' | 'contacted' | 'engaged' | 'qualified' | 'opportunity' | 'closed'> = ['new', 'contacted', 'engaged', 'qualified', 'opportunity', 'closed'];
    const technologies = ['React', 'Node.js', 'AWS', 'Docker', 'PostgreSQL', 'Python', 'TypeScript', 'MongoDB', 'Redis', 'GraphQL'];
    const locations = [
      { country: 'United States', state: 'California', city: 'San Francisco' },
      { country: 'United States', state: 'New York', city: 'New York' },
      { country: 'Canada', state: 'Ontario', city: 'Toronto' },
      { country: 'United Kingdom', city: 'London' },
      { country: 'Germany', city: 'Berlin' }
    ];

    const companyName = companies[Math.floor(Math.random() * companies.length)];
    const industry = industries[Math.floor(Math.random() * industries.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];

    const engagementScore = Math.floor(Math.random() * 100);
    const revenueScore = Math.floor(Math.random() * 100);
    const intentScore = Math.floor(Math.random() * 100);
    const overallScore = Math.floor((engagementScore + revenueScore + intentScore) / 3);

    return {
      id: accountId,
      companyName,
      domain: `${companyName.toLowerCase().replace(/\s/g, '')}.com`,
      industry,
      size,
      location,
      revenue: Math.floor(Math.random() * 50000000) + 1000000, // $1M - $50M
      employees: Math.floor(Math.random() * 5000) + 10,
      website: `https://${companyName.toLowerCase().replace(/\s/g, '')}.com`,
      description: `${companyName} is a leading ${industry.toLowerCase()} company focused on innovation and growth.`,
      technologies: technologies.slice(0, Math.floor(Math.random() * 5) + 2),
      contacts: this.generateMockContacts(Math.floor(Math.random() * 3) + 1),
      engagementScore,
      revenueScore,
      intentScore,
      overallScore,
      priority: this.determinePriority(overallScore),
      status,
      assignedSalesRep: `sales_rep_${Math.floor(Math.random() * 10) + 1}`,
      lastEngagement: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    };
  }

  private generateMockContacts(count: number): ContactInfo[] {
    const contacts: ContactInfo[] = [];
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily', 'James', 'Anna'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const titles = ['CEO', 'CTO', 'VP Engineering', 'Head of Sales', 'Marketing Director', 'Product Manager', 'Lead Developer', 'Business Analyst'];
    const departments = ['Executive', 'Engineering', 'Sales', 'Marketing', 'Product', 'Operations', 'Finance'];
    const roles: Array<'decision_maker' | 'influencer' | 'user' | 'gatekeeper'> = ['decision_maker', 'influencer', 'user', 'gatekeeper'];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const title = titles[Math.floor(Math.random() * titles.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const role = roles[Math.floor(Math.random() * roles.length)];

      contacts.push({
        id: `contact_${i + 1}`,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
        title,
        department,
        phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
        linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
        role,
        engagementLevel: Math.floor(Math.random() * 100),
        lastContactDate: Math.random() > 0.5 ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : undefined
      });
    }

    return contacts;
  }

  private generateMockEngagementMetrics(accountId: string): AccountEngagementMetrics {
    const activities: EngagementActivity[] = [];
    const activityTypes: Array<'website_visit' | 'content_download' | 'email_open' | 'email_click' | 'demo_request' | 'pricing_view' | 'support_ticket' | 'social_engagement'> =
      ['website_visit', 'content_download', 'email_open', 'email_click', 'demo_request', 'pricing_view', 'support_ticket', 'social_engagement'];

    const activityCount = Math.floor(Math.random() * 10) + 5;
    for (let i = 0; i < activityCount; i++) {
      activities.push({
        id: `activity_${i + 1}`,
        accountId,
        type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
        description: `Mock engagement activity ${i + 1}`,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        value: Math.floor(Math.random() * 100),
        source: 'website',
        metadata: {}
      });
    }

    return {
      accountId,
      totalEngagementScore: Math.floor(Math.random() * 100),
      recentActivityCount: activities.filter(a => (Date.now() - a.timestamp.getTime()) < 7 * 24 * 60 * 60 * 1000).length,
      lastActivityDate: new Date(Math.max(...activities.map(a => a.timestamp.getTime()))),
      engagementTrend: ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)] as 'increasing' | 'stable' | 'decreasing',
      activeDaysCount: Math.floor(Math.random() * 30),
      averageDailyEngagement: Math.floor(Math.random() * 50),
      topEngagementSources: ['website', 'email', 'social'],
      keyActivities: activities.slice(0, 3)
    };
  }
}
