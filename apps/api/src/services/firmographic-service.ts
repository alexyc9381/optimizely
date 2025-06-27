import { EventEmitter } from 'events';
import { LeadData } from './ml-types';

// =============================================================================
// FIRMOGRAPHIC DATA TYPES - Universal Schema
// =============================================================================

export interface CompanyData {
  // Basic Company Information
  id?: string;
  name: string;
  domain: string;
  website?: string;
  description?: string;

  // Size & Scale Metrics
  employeeCount?: number;
  employeeRange?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  annualRevenue?: number;
  revenueRange?: 'unknown' | 'under_1m' | '1m_10m' | '10m_100m' | '100m_1b' | 'over_1b';

  // Location Data
  headquarters?: {
    country: string;
    state?: string;
    city?: string;
    timezone?: string;
  };
  locations?: Array<{
    country: string;
    state?: string;
    city?: string;
    type: 'headquarters' | 'office' | 'remote';
  }>;

  // Industry Classification
  industry: string;
  subIndustry?: string;
  sicCode?: string;
  naicsCode?: string;
  industryKeywords?: string[];

  // Technology Profile
  technologies?: {
    current: Array<{
      name: string;
      category: string;
      confidence: number;
    }>;
    stack?: string[];
    frameworks?: string[];
    platforms?: string[];
  };

  // Financial Data
  fundingStage?: 'bootstrap' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'ipo' | 'private';
  totalFunding?: number;
  lastFundingDate?: Date;
  investors?: string[];

  // Market Position
  marketCap?: number;
  isPublic?: boolean;
  stockTicker?: string;
  competitors?: string[];
  marketShare?: number;

  // Growth Indicators
  growthRate?: number;
  hiringTrend?: 'declining' | 'stable' | 'growing' | 'rapid_growth';
  newsScore?: number; // Recent positive/negative news sentiment
  socialPresence?: {
    linkedinFollowers?: number;
    twitterFollowers?: number;
    facebookFollowers?: number;
  };

  // Enrichment Metadata
  dataQuality: number; // 0-100 score
  lastEnriched: Date;
  enrichmentSources: string[];
  confidence: number; // Overall data confidence 0-100
}

export interface EnrichmentProvider {
  name: string;
  priority: number;
  enabled: boolean;
  apiKey?: string;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  cost: {
    costPerRequest: number;
    currency: 'USD';
  };
}

export interface DataValidationRule {
  field: string;
  required: boolean;
  minValue?: number;
  maxValue?: number;
  allowedValues?: string[];
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
}

export interface EnrichmentResult {
  success: boolean;
  provider: string;
  fieldsEnriched: string[];
  confidence: number;
  cost: number;
  duration: number;
  error?: string;
}

// =============================================================================
// FIRMOGRAPHIC DATA SERVICE - Universal ETL Pipeline
// =============================================================================

export class FirmographicService extends EventEmitter {
  private static instance: FirmographicService;
  private enrichmentProviders: Map<string, EnrichmentProvider>;
  private validationRules: DataValidationRule[];
  private cache: Map<string, CompanyData>;
  private rateLimitCounters: Map<string, { count: number; resetTime: number }>;

  constructor() {
    super();
    this.enrichmentProviders = new Map();
    this.validationRules = [];
    this.cache = new Map();
    this.rateLimitCounters = new Map();
    this.initializeDefaultProviders();
    this.initializeValidationRules();
  }

  static getInstance(): FirmographicService {
    if (!FirmographicService.instance) {
      FirmographicService.instance = new FirmographicService();
    }
    return FirmographicService.instance;
  }

  // =============================================================================
  // PROVIDER MANAGEMENT - Universal Data Source Integration
  // =============================================================================

  private initializeDefaultProviders(): void {
    // Mock enrichment providers - in production, integrate with real services
    const providers: EnrichmentProvider[] = [
      {
        name: 'clearbit',
        priority: 1,
        enabled: true,
        rateLimit: { requestsPerMinute: 600, requestsPerDay: 50000 },
        cost: { costPerRequest: 0.10, currency: 'USD' }
      },
      {
        name: 'zoominfo',
        priority: 2,
        enabled: true,
        rateLimit: { requestsPerMinute: 300, requestsPerDay: 25000 },
        cost: { costPerRequest: 0.15, currency: 'USD' }
      },
      {
        name: 'apollo',
        priority: 3,
        enabled: true,
        rateLimit: { requestsPerMinute: 200, requestsPerDay: 10000 },
        cost: { costPerRequest: 0.08, currency: 'USD' }
      },
      {
        name: 'builtwith',
        priority: 4,
        enabled: true,
        rateLimit: { requestsPerMinute: 100, requestsPerDay: 5000 },
        cost: { costPerRequest: 0.05, currency: 'USD' }
      }
    ];

    providers.forEach(provider => {
      this.enrichmentProviders.set(provider.name, provider);
    });
  }

  private initializeValidationRules(): void {
    this.validationRules = [
      {
        field: 'name',
        required: true,
        pattern: /^[a-zA-Z0-9\s\-&.'()]+$/
      },
      {
        field: 'domain',
        required: true,
        pattern: /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
      },
      {
        field: 'employeeCount',
        required: false,
        minValue: 1,
        maxValue: 10000000
      },
      {
        field: 'annualRevenue',
        required: false,
        minValue: 0,
        maxValue: 1000000000000
      },
      {
        field: 'industry',
        required: true,
        allowedValues: [
          'technology', 'healthcare', 'finance', 'manufacturing',
          'retail', 'education', 'consulting', 'real_estate',
          'media', 'transportation', 'energy', 'government',
          'nonprofit', 'other'
        ]
      },
      {
        field: 'employeeRange',
        required: false,
        allowedValues: ['startup', 'small', 'medium', 'large', 'enterprise']
      },
      {
        field: 'revenueRange',
        required: false,
        allowedValues: ['unknown', 'under_1m', '1m_10m', '10m_100m', '100m_1b', 'over_1b']
      },
      {
        field: 'fundingStage',
        required: false,
        allowedValues: ['bootstrap', 'seed', 'series_a', 'series_b', 'series_c', 'ipo', 'private']
      }
    ];
  }

  // =============================================================================
  // DATA VALIDATION - Universal Quality Assurance
  // =============================================================================

  validateCompanyData(data: Partial<CompanyData>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    qualityScore: number;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let qualityScore = 100;

    // Required field validation
    const requiredRules = this.validationRules.filter(rule => rule.required);
    for (const rule of requiredRules) {
      if (!data[rule.field as keyof CompanyData]) {
        errors.push(`Required field '${rule.field}' is missing`);
        qualityScore -= 20;
      }
    }

    // Field-specific validation
    for (const rule of this.validationRules) {
      const value = data[rule.field as keyof CompanyData];
      if (value !== undefined && value !== null) {

        // Pattern validation
        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
          errors.push(`Field '${rule.field}' does not match required pattern`);
          qualityScore -= 10;
        }

        // Range validation
        if (typeof value === 'number') {
          if (rule.minValue !== undefined && value < rule.minValue) {
            errors.push(`Field '${rule.field}' is below minimum value ${rule.minValue}`);
            qualityScore -= 5;
          }
          if (rule.maxValue !== undefined && value > rule.maxValue) {
            errors.push(`Field '${rule.field}' exceeds maximum value ${rule.maxValue}`);
            qualityScore -= 5;
          }
        }

        // Allowed values validation
        if (rule.allowedValues && !rule.allowedValues.includes(value as string)) {
          errors.push(`Field '${rule.field}' has invalid value. Allowed: ${rule.allowedValues.join(', ')}`);
          qualityScore -= 15;
        }

        // Custom validation
        if (rule.customValidator && !rule.customValidator(value)) {
          errors.push(`Field '${rule.field}' failed custom validation`);
          qualityScore -= 10;
        }
      }
    }

    // Data completeness warnings
    const optionalFields = ['description', 'website', 'employeeCount', 'annualRevenue'];
    optionalFields.forEach(field => {
      if (!data[field as keyof CompanyData]) {
        warnings.push(`Optional field '${field}' is missing - consider enrichment`);
        qualityScore -= 2;
      }
    });

    // Ensure quality score doesn't go below 0
    qualityScore = Math.max(0, qualityScore);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qualityScore
    };
  }

  // =============================================================================
  // DATA ENRICHMENT - Multi-Provider Intelligence
  // =============================================================================

  async enrichCompanyData(
    companyIdentifier: string,
    existingData?: Partial<CompanyData>
  ): Promise<CompanyData> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.generateCacheKey(companyIdentifier);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      // Return cached data if it's less than 24 hours old
      if (Date.now() - cached.lastEnriched.getTime() < 86400000) {
        this.emit('enrichment:cache_hit', { identifier: companyIdentifier, data: cached });
        return cached;
      }
    }

    // Initialize company data
    let companyData: CompanyData = {
      name: '',
      domain: companyIdentifier,
      industry: 'other',
      dataQuality: 0,
      lastEnriched: new Date(),
      enrichmentSources: [],
      confidence: 0,
      ...existingData
    };

    const enrichmentResults: EnrichmentResult[] = [];

    // Get enabled providers sorted by priority
    const enabledProviders = Array.from(this.enrichmentProviders.values())
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);

    // Attempt enrichment from each provider
    for (const provider of enabledProviders) {
      try {
        if (this.isRateLimited(provider.name)) {
          continue;
        }

        const result = await this.enrichFromProvider(provider, companyIdentifier, companyData);
        enrichmentResults.push(result);

        if (result.success) {
          companyData.enrichmentSources.push(provider.name);
          this.updateRateLimit(provider.name);
        }

        // Stop if we have enough data (quality score > 80)
        if (companyData.dataQuality > 80) {
          break;
        }
      } catch (error) {
        enrichmentResults.push({
          success: false,
          provider: provider.name,
          fieldsEnriched: [],
          confidence: 0,
          cost: 0,
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Calculate final data quality and confidence
    const validation = this.validateCompanyData(companyData);
    companyData.dataQuality = validation.qualityScore;
    companyData.confidence = this.calculateConfidence(enrichmentResults, companyData);

    // Cache the enriched data
    this.cache.set(cacheKey, companyData);

    // Emit enrichment completed event
    this.emit('enrichment:completed', {
      identifier: companyIdentifier,
      data: companyData,
      results: enrichmentResults,
      duration: Date.now() - startTime
    });

    return companyData;
  }

  private async enrichFromProvider(
    provider: EnrichmentProvider,
    identifier: string,
    currentData: CompanyData
  ): Promise<EnrichmentResult> {
    const startTime = Date.now();

    // Mock enrichment - in production, call actual provider APIs
    const mockData = this.generateMockEnrichmentData(provider.name, identifier);

    // Merge enriched data
    Object.assign(currentData, mockData);

    return {
      success: true,
      provider: provider.name,
      fieldsEnriched: Object.keys(mockData),
      confidence: 85 + Math.random() * 10, // 85-95% confidence
      cost: provider.cost.costPerRequest,
      duration: Date.now() - startTime
    };
  }

  private generateMockEnrichmentData(provider: string, identifier: string): Partial<CompanyData> {
    // Generate realistic mock data based on provider specialties
    const companies = [
      'TechCorp Inc.', 'InnovateNow LLC', 'Digital Solutions Group',
      'FutureTech Systems', 'CloudFirst Technologies', 'DataDriven Analytics'
    ];

    const industries = [
      'technology', 'healthcare', 'finance', 'manufacturing',
      'consulting', 'retail', 'education'
    ];

    const baseData: Partial<CompanyData> = {
      name: companies[Math.floor(Math.random() * companies.length)],
      description: `Leading provider of innovative solutions in the ${identifier} sector`,
      industry: industries[Math.floor(Math.random() * industries.length)],
      employeeCount: Math.floor(Math.random() * 10000) + 10,
      annualRevenue: Math.floor(Math.random() * 100000000) + 1000000,
      website: `https://www.${identifier}`,
      headquarters: {
        country: 'United States',
        state: 'California',
        city: 'San Francisco',
        timezone: 'America/Los_Angeles'
      }
    };

    // Provider-specific enhancements
    switch (provider) {
      case 'clearbit':
        return {
          ...baseData,
          technologies: {
            current: [
              { name: 'React', category: 'frontend', confidence: 95 },
              { name: 'Node.js', category: 'backend', confidence: 90 },
              { name: 'AWS', category: 'infrastructure', confidence: 85 }
            ]
          }
        };

      case 'zoominfo':
        return {
          ...baseData,
          fundingStage: 'series_b' as const,
          totalFunding: Math.floor(Math.random() * 50000000) + 5000000,
          hiringTrend: 'growing' as const
        };

      case 'apollo':
        return {
          ...baseData,
          socialPresence: {
            linkedinFollowers: Math.floor(Math.random() * 50000) + 1000,
            twitterFollowers: Math.floor(Math.random() * 25000) + 500
          }
        };

      default:
        return baseData;
    }
  }

  // =============================================================================
  // RATE LIMITING & CACHING - Efficiency Management
  // =============================================================================

  private isRateLimited(providerName: string): boolean {
    const provider = this.enrichmentProviders.get(providerName);
    if (!provider) return true;

    const counter = this.rateLimitCounters.get(providerName);
    if (!counter) return false;

    const now = Date.now();
    if (now > counter.resetTime) {
      // Reset counter
      this.rateLimitCounters.set(providerName, { count: 0, resetTime: now + 60000 });
      return false;
    }

    return counter.count >= provider.rateLimit.requestsPerMinute;
  }

  private updateRateLimit(providerName: string): void {
    const counter = this.rateLimitCounters.get(providerName);
    if (counter) {
      counter.count++;
    } else {
      this.rateLimitCounters.set(providerName, {
        count: 1,
        resetTime: Date.now() + 60000
      });
    }
  }

  private generateCacheKey(identifier: string): string {
    return `company:${identifier.toLowerCase()}`;
  }

  private calculateConfidence(results: EnrichmentResult[], data: CompanyData): number {
    if (results.length === 0) return 0;

    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length === 0) return 0;

    const avgConfidence = successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length;
    const sourceBonus = Math.min(successfulResults.length * 5, 20); // Up to 20% bonus for multiple sources
    const qualityBonus = data.dataQuality * 0.3; // 30% weight from data quality

    return Math.min(100, avgConfidence + sourceBonus + qualityBonus);
  }

  // =============================================================================
  // UNIVERSAL API METHODS - Platform Agnostic Access
  // =============================================================================

  async processCompanyBatch(identifiers: string[]): Promise<CompanyData[]> {
    const maxBatchSize = 50;
    if (identifiers.length > maxBatchSize) {
      throw new Error(`Batch size ${identifiers.length} exceeds maximum ${maxBatchSize}`);
    }

    const promises = identifiers.map(id => this.enrichCompanyData(id));
    return Promise.all(promises);
  }

  async searchCompanies(criteria: {
    industry?: string;
    employeeRange?: string;
    revenueRange?: string;
    location?: string;
    technologies?: string[];
    limit?: number;
  }): Promise<CompanyData[]> {
    // Mock search - in production, integrate with search providers
    const mockResults: CompanyData[] = [];
    const limit = criteria.limit || 10;

    for (let i = 0; i < limit; i++) {
      const mockCompany = await this.enrichCompanyData(`example${i}.com`);
      if (criteria.industry && mockCompany.industry !== criteria.industry) continue;
      mockResults.push(mockCompany);
    }

    return mockResults;
  }

  // Convert to format compatible with ML scoring
  toMLFormat(companyData: CompanyData): Partial<LeadData> {
    // Convert employee count to company size category
    const getCompanySize = (employeeCount?: number): 'startup' | 'smb' | 'mid_market' | 'enterprise' => {
      if (!employeeCount) return 'startup';
      if (employeeCount < 50) return 'startup';
      if (employeeCount < 200) return 'smb';
      if (employeeCount < 1000) return 'mid_market';
      return 'enterprise';
    };

    // Convert funding stage to company maturity
    const getCompanyMaturity = (fundingStage?: string): 'seed' | 'growth' | 'mature' => {
      if (!fundingStage || fundingStage === 'bootstrap' || fundingStage === 'seed') return 'seed';
      if (fundingStage === 'series_a' || fundingStage === 'series_b') return 'growth';
      return 'mature';
    };

    return {
      firmographic: {
        companySize: getCompanySize(companyData.employeeCount),
        industry: companyData.industry,
        revenue: companyData.annualRevenue || null,
        employees: companyData.employeeCount || null,
        techStack: companyData.technologies?.stack || [],
        companyMaturity: getCompanyMaturity(companyData.fundingStage),
        geolocation: {
          country: companyData.headquarters?.country || 'unknown',
          region: companyData.headquarters?.state || 'unknown',
          timezone: companyData.headquarters?.timezone || 'UTC'
        }
      }
    };
  }

  // Health check for monitoring
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    cacheSize: number;
    providersEnabled: number;
    lastEnrichment?: Date;
  }> {
    const enabledProviders = Array.from(this.enrichmentProviders.values())
      .filter(p => p.enabled).length;

    return {
      status: enabledProviders > 0 ? 'healthy' : 'degraded',
      cacheSize: this.cache.size,
      providersEnabled: enabledProviders,
      lastEnrichment: new Date()
    };
  }

  // Clear cache (for testing/maintenance)
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const firmographicService = FirmographicService.getInstance();
