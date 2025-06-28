import crypto from 'crypto';
import { EventEmitter } from 'events';
import { redisManager } from './redis-client';

// =============================================================================
// CORE TYPES & INTERFACES
// =============================================================================

export interface MarketingPlatformConfig {
  id: string;
  name: string;
  type: MarketingPlatformType;
  category: PlatformCategory;
  enabled: boolean;
  authentication: PlatformAuthentication;
  settings: PlatformSettings;
  capabilities: PlatformCapabilities;
  rateLimit: RateLimitConfig;
  dataMapping: DataMappingConfig;
  healthCheck: HealthCheckConfig;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  status: 'active' | 'inactive' | 'error' | 'syncing';
}

export interface PlatformAuthentication {
  type: 'api_key' | 'oauth2' | 'jwt' | 'basic' | 'custom' | 'saml';
  credentials: Record<string, any>;
  expiresAt?: Date;
  refreshToken?: string;
  scopes?: string[];
  tokenUrl?: string;
  authUrl?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface PlatformSettings {
  baseUrl: string;
  version: string;
  timeout: number;
  retryAttempts: number;
  retryBackoff: 'linear' | 'exponential';
  batchSize: number;
  concurrency: number;
  customHeaders?: Record<string, string>;
  customParameters?: Record<string, any>;
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface PlatformCapabilities {
  supportsWebhooks: boolean;
  supportsBulkOperations: boolean;
  supportsRealTimeSync: boolean;
  supportsCustomFields: boolean;
  supportsFiltering: boolean;
  supportsPagination: boolean;
  supportsSearch: boolean;
  supportsAnalytics: boolean;
  maxBatchSize: number;
  rateLimitPerMinute: number;
  supportedOperations: PlatformOperation[];
  supportedDataTypes: DataType[];
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  retryAfter: number;
  backoffMultiplier: number;
}

export interface DataMappingConfig {
  fieldMappings: Record<string, FieldMapping>;
  transformations: TransformationRule[];
  filters: FilterRule[];
  validationRules: ValidationRule[];
  defaultValues: Record<string, any>;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  transformation?: string;
}

export interface TransformationRule {
  field: string;
  type: 'format' | 'convert' | 'calculate' | 'enrich' | 'normalize';
  operation: string;
  parameters?: Record<string, any>;
  condition?: string;
}

export interface FilterRule {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'regex';
  value: any;
  condition?: string;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  parameters?: Record<string, any>;
  errorMessage: string;
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  endpoint: string;
  expectedStatus: number;
  expectedResponse?: any;
  alertThreshold: number;
}

export enum MarketingPlatformType {
  // Email Marketing
  MAILCHIMP = 'mailchimp',
  CONSTANT_CONTACT = 'constant_contact',
  CAMPAIGN_MONITOR = 'campaign_monitor',
  AWEBER = 'aweber',
  CONVERTKIT = 'convertkit',
  KLAVIYO = 'klaviyo',

  // Marketing Automation
  HUBSPOT = 'hubspot',
  MARKETO = 'marketo',
  PARDOT = 'pardot',
  ELOQUA = 'eloqua',
  ACTIVECAMPAIGN = 'activecampaign',
  DRIP = 'drip',

  // CRM Systems
  SALESFORCE = 'salesforce',
  PIPEDRIVE = 'pipedrive',
  ZOHO_CRM = 'zoho_crm',
  FRESHSALES = 'freshsales',
  COPPER = 'copper',

  // Social Media
  FACEBOOK_ADS = 'facebook_ads',
  GOOGLE_ADS = 'google_ads',
  LINKEDIN_ADS = 'linkedin_ads',
  TWITTER_ADS = 'twitter_ads',
  TIKTOK_ADS = 'tiktok_ads',

  // Analytics
  GOOGLE_ANALYTICS = 'google_analytics',
  ADOBE_ANALYTICS = 'adobe_analytics',
  MIXPANEL = 'mixpanel',
  AMPLITUDE = 'amplitude',
  SEGMENT = 'segment',

  // Communication
  SLACK = 'slack',
  MICROSOFT_TEAMS = 'microsoft_teams',
  DISCORD = 'discord',
  TWILIO = 'twilio',

  // E-commerce
  SHOPIFY = 'shopify',
  WOOCOMMERCE = 'woocommerce',
  MAGENTO = 'magento',
  BIGCOMMERCE = 'bigcommerce',

  // Custom/Generic
  WEBHOOK = 'webhook',
  REST_API = 'rest_api',
  GRAPHQL = 'graphql',
  CUSTOM = 'custom'
}

export enum PlatformCategory {
  EMAIL_MARKETING = 'email_marketing',
  MARKETING_AUTOMATION = 'marketing_automation',
  CRM = 'crm',
  SOCIAL_MEDIA = 'social_media',
  ANALYTICS = 'analytics',
  COMMUNICATION = 'communication',
  ECOMMERCE = 'ecommerce',
  CUSTOM = 'custom'
}

export enum PlatformOperation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  BULK_CREATE = 'bulk_create',
  BULK_UPDATE = 'bulk_update',
  BULK_DELETE = 'bulk_delete',
  SEARCH = 'search',
  WEBHOOK = 'webhook',
  SYNC = 'sync'
}

export enum DataType {
  CONTACT = 'contact',
  LEAD = 'lead',
  ACCOUNT = 'account',
  OPPORTUNITY = 'opportunity',
  CAMPAIGN = 'campaign',
  EMAIL = 'email',
  EVENT = 'event',
  CUSTOM = 'custom'
}

export interface SyncConfiguration {
  id: string;
  platformId: string;
  name: string;
  enabled: boolean;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  dataType: DataType;
  schedule: SyncSchedule;
  mapping: DataMappingConfig;
  filters: FilterRule[];
  transformations: TransformationRule[];
  errorHandling: ErrorHandlingConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncSchedule {
  type: 'manual' | 'interval' | 'cron' | 'webhook';
  interval?: number;
  cronExpression?: string;
  timezone?: string;
  enabled: boolean;
}

export interface ErrorHandlingConfig {
  retryAttempts: number;
  retryBackoff: 'linear' | 'exponential';
  retryDelay: number;
  skipOnError: boolean;
  alertOnError: boolean;
  errorWebhook?: string;
}

export interface SyncJob {
  id: string;
  configurationId: string;
  platformId: string;
  type: 'full' | 'incremental' | 'custom';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  skipCount: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  errors: SyncError[];
  metrics: SyncMetrics;
  logs: SyncLog[];
}

export interface SyncError {
  recordId?: string;
  field?: string;
  message: string;
  errorCode?: string;
  timestamp: Date;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high';
}

export interface SyncMetrics {
  throughput: number;
  avgResponseTime: number;
  errorRate: number;
  successRate: number;
  dataVolume: number;
  apiCallsUsed: number;
  rateLimitHits: number;
}

export interface SyncLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: any;
}

export interface WebhookEvent {
  id: string;
  platformId: string;
  event: string;
  payload: any;
  headers: Record<string, string>;
  signature?: string;
  timestamp: Date;
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

export interface PlatformAdapter {
  type: MarketingPlatformType;
  name: string;
  category: PlatformCategory;
  version: string;

  // Authentication
  authenticate(config: PlatformAuthentication): Promise<AuthResult>;
  refreshToken?(config: PlatformAuthentication): Promise<AuthResult>;
  validateAuth(config: PlatformAuthentication): Promise<boolean>;

  // Configuration
  validateConfig(config: MarketingPlatformConfig): Promise<ValidationResult>;
  getCapabilities(): PlatformCapabilities;
  getDefaultSettings(): Partial<PlatformSettings>;

  // Data Operations
  create(dataType: DataType, data: any, config: MarketingPlatformConfig): Promise<OperationResult>;
  read(dataType: DataType, id: string, config: MarketingPlatformConfig): Promise<OperationResult>;
  update(dataType: DataType, id: string, data: any, config: MarketingPlatformConfig): Promise<OperationResult>;
  delete(dataType: DataType, id: string, config: MarketingPlatformConfig): Promise<OperationResult>;

  // Bulk Operations
  bulkCreate?(dataType: DataType, data: any[], config: MarketingPlatformConfig): Promise<BulkOperationResult>;
  bulkUpdate?(dataType: DataType, data: any[], config: MarketingPlatformConfig): Promise<BulkOperationResult>;
  bulkDelete?(dataType: DataType, ids: string[], config: MarketingPlatformConfig): Promise<BulkOperationResult>;

  // Search & Query
  search?(dataType: DataType, query: SearchQuery, config: MarketingPlatformConfig): Promise<SearchResult>;
  list?(dataType: DataType, options: ListOptions, config: MarketingPlatformConfig): Promise<ListResult>;

  // Sync Operations
  sync(job: SyncJob, config: MarketingPlatformConfig): Promise<SyncResult>;

  // Webhook Support
  validateWebhook?(event: WebhookEvent, config: MarketingPlatformConfig): Promise<boolean>;
  processWebhook?(event: WebhookEvent, config: MarketingPlatformConfig): Promise<ProcessResult>;

  // Health Check
  healthCheck(config: MarketingPlatformConfig): Promise<HealthResult>;

  // Metrics
  getMetrics?(config: MarketingPlatformConfig): Promise<PlatformMetrics>;
}

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface OperationResult {
  success: boolean;
  data?: any;
  id?: string;
  error?: string;
  rateLimited?: boolean;
  nextRetryAt?: Date;
}

export interface BulkOperationResult {
  success: boolean;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  results: OperationResult[];
  errors: SyncError[];
}

export interface SearchQuery {
  query: string;
  filters?: FilterRule[];
  sort?: SortOption[];
  limit?: number;
  offset?: number;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ListOptions {
  filters?: FilterRule[];
  sort?: SortOption[];
  limit?: number;
  offset?: number;
  fields?: string[];
}

export interface SearchResult {
  success: boolean;
  data: any[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
  error?: string;
}

export interface ListResult {
  success: boolean;
  data: any[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: SyncError[];
  metrics: SyncMetrics;
}

export interface ProcessResult {
  success: boolean;
  processed: boolean;
  actions?: string[];
  error?: string;
}

export interface HealthResult {
  healthy: boolean;
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
  details?: any;
  error?: string;
}

export interface PlatformMetrics {
  apiCallsUsed: number;
  apiCallsRemaining: number;
  rateLimitReset: Date;
  avgResponseTime: number;
  errorRate: number;
  uptime: number;
}

// =============================================================================
// UNIVERSAL MARKETING PLATFORM INTEGRATION HUB
// =============================================================================

export class UniversalMarketingPlatformIntegrationHub extends EventEmitter {
  private platforms: Map<string, MarketingPlatformConfig> = new Map();
  private adapters: Map<MarketingPlatformType, PlatformAdapter> = new Map();
  private syncConfigurations: Map<string, SyncConfiguration> = new Map();
  private activeSyncJobs: Map<string, SyncJob> = new Map();
  private webhookEvents: Map<string, WebhookEvent> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private healthCheckers: Map<string, NodeJS.Timeout> = new Map();

  private isInitialized: boolean = false;
  private processingInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.initializeAdapters();
  }

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('🔗 Marketing Platform Integration Hub already initialized');
        return;
      }

      // Load existing configurations
      await this.loadPlatforms();
      await this.loadSyncConfigurations();
      await this.loadActiveSyncJobs();

      // Start background processes
      this.startProcessing();
      this.startMetricsCollection();
      this.startCleanupProcess();
      this.startHealthChecks();

      this.isInitialized = true;
      console.log('🔗 Universal Marketing Platform Integration Hub initialized successfully');
      this.emit('hub:initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Marketing Platform Integration Hub:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.isInitialized = false;

      // Stop all intervals
      if (this.processingInterval) {
        clearInterval(this.processingInterval);
      }
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }

      // Stop health checks
      this.healthCheckers.forEach(timer => clearInterval(timer));
      this.healthCheckers.clear();

      // Cancel active sync jobs
      for (const job of this.activeSyncJobs.values()) {
        if (job.status === 'running') {
          await this.cancelSyncJob(job.id);
        }
      }

      console.log('🔗 Marketing Platform Integration Hub shutdown complete');
      this.emit('hub:shutdown');

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }

  // =============================================================================
  // PLATFORM MANAGEMENT
  // =============================================================================

  async createPlatform(config: Omit<MarketingPlatformConfig, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<MarketingPlatformConfig> {
    try {
      const adapter = this.adapters.get(config.type);
      if (!adapter) {
        throw new Error(`Unsupported platform type: ${config.type}`);
      }

      // Validate configuration
      const validation = await adapter.validateConfig(config as MarketingPlatformConfig);
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      // Test authentication
      const authResult = await adapter.authenticate(config.authentication);
      if (!authResult.success) {
        throw new Error(`Authentication failed: ${authResult.error}`);
      }

      const platform: MarketingPlatformConfig = {
        ...config,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      // Update auth credentials if new tokens were issued
      if (authResult.accessToken) {
        platform.authentication.credentials.accessToken = authResult.accessToken;
      }
      if (authResult.refreshToken) {
        platform.authentication.refreshToken = authResult.refreshToken;
      }
      if (authResult.expiresAt) {
        platform.authentication.expiresAt = authResult.expiresAt;
      }

      this.platforms.set(platform.id, platform);
      await this.savePlatform(platform);

      // Initialize rate limiter
      this.rateLimiters.set(platform.id, new RateLimiter(platform.rateLimit));

      // Start health check if enabled
      if (platform.healthCheck.enabled) {
        this.startPlatformHealthCheck(platform.id);
      }

      console.log(`✅ Created platform integration: ${platform.name} (${platform.type})`);
      this.emit('platform:created', platform);

      return platform;

    } catch (error) {
      console.error('❌ Error creating platform:', error);
      throw error;
    }
  }

  async updatePlatform(id: string, updates: Partial<MarketingPlatformConfig>): Promise<MarketingPlatformConfig> {
    try {
      const platform = this.platforms.get(id);
      if (!platform) {
        throw new Error('Platform not found');
      }

      const updatedPlatform: MarketingPlatformConfig = {
        ...platform,
        ...updates,
        id: platform.id, // Prevent ID changes
        updatedAt: new Date()
      };

      // Validate updated configuration
      const adapter = this.adapters.get(updatedPlatform.type);
      if (adapter) {
        const validation = await adapter.validateConfig(updatedPlatform);
        if (!validation.isValid) {
          throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
        }

        // Test authentication if credentials changed
        if (updates.authentication) {
          const authResult = await adapter.authenticate(updatedPlatform.authentication);
          if (!authResult.success) {
            throw new Error(`Authentication failed: ${authResult.error}`);
          }

          // Update auth credentials
          if (authResult.accessToken) {
            updatedPlatform.authentication.credentials.accessToken = authResult.accessToken;
          }
          if (authResult.refreshToken) {
            updatedPlatform.authentication.refreshToken = authResult.refreshToken;
          }
          if (authResult.expiresAt) {
            updatedPlatform.authentication.expiresAt = authResult.expiresAt;
          }
        }
      }

      this.platforms.set(id, updatedPlatform);
      await this.savePlatform(updatedPlatform);

      // Update rate limiter if config changed
      if (updates.rateLimit) {
        this.rateLimiters.set(id, new RateLimiter(updatedPlatform.rateLimit));
      }

      // Update health check
      if (updates.healthCheck !== undefined) {
        this.stopPlatformHealthCheck(id);
        if (updatedPlatform.healthCheck.enabled) {
          this.startPlatformHealthCheck(id);
        }
      }

      console.log(`✅ Updated platform integration: ${updatedPlatform.name}`);
      this.emit('platform:updated', updatedPlatform);

      return updatedPlatform;

    } catch (error) {
      console.error('❌ Error updating platform:', error);
      throw error;
    }
  }

  async deletePlatform(id: string): Promise<void> {
    try {
      const platform = this.platforms.get(id);
      if (!platform) {
        throw new Error('Platform not found');
      }

      // Cancel any active sync jobs for this platform
      const platformSyncJobs = Array.from(this.activeSyncJobs.values())
        .filter(job => job.platformId === id && job.status === 'running');

      for (const job of platformSyncJobs) {
        await this.cancelSyncJob(job.id);
      }

      // Remove sync configurations for this platform
      const platformSyncConfigs = Array.from(this.syncConfigurations.values())
        .filter(config => config.platformId === id);

      for (const config of platformSyncConfigs) {
        await this.deleteSyncConfiguration(config.id);
      }

      // Stop health check
      this.stopPlatformHealthCheck(id);

      // Remove from maps
      this.platforms.delete(id);
      this.rateLimiters.delete(id);

      // Remove from storage
      await this.removePlatform(id);

      console.log(`✅ Deleted platform integration: ${platform.name}`);
      this.emit('platform:deleted', { id, platform });

    } catch (error) {
      console.error('❌ Error deleting platform:', error);
      throw error;
    }
  }

  getPlatform(id: string): MarketingPlatformConfig | undefined {
    return this.platforms.get(id);
  }

  getAllPlatforms(): MarketingPlatformConfig[] {
    return Array.from(this.platforms.values());
  }

  getPlatformsByType(type: MarketingPlatformType): MarketingPlatformConfig[] {
    return Array.from(this.platforms.values()).filter(p => p.type === type);
  }

  getPlatformsByCategory(category: PlatformCategory): MarketingPlatformConfig[] {
    return Array.from(this.platforms.values()).filter(p => p.category === category);
  }

  getActivePlatforms(): MarketingPlatformConfig[] {
    return Array.from(this.platforms.values()).filter(p => p.enabled && p.status === 'active');
  }

  // =============================================================================
  // ADAPTER MANAGEMENT
  // =============================================================================

  registerAdapter(adapter: PlatformAdapter): void {
    this.adapters.set(adapter.type, adapter);
    console.log(`📦 Registered adapter: ${adapter.name} (${adapter.type})`);
    this.emit('adapter:registered', adapter);
  }

  getAdapter(type: MarketingPlatformType): PlatformAdapter | undefined {
    return this.adapters.get(type);
  }

  getAllAdapters(): PlatformAdapter[] {
    return Array.from(this.adapters.values());
  }

  getSupportedPlatformTypes(): MarketingPlatformType[] {
    return Array.from(this.adapters.keys());
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private initializeAdapters(): void {
    // Initialize built-in adapters
    // Note: In a real implementation, these would be separate classes
    console.log('📦 Initializing built-in platform adapters...');

    // For now, we'll register placeholder adapters
    // In production, each adapter would be a full implementation
    this.emit('adapters:initialized');
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private async savePlatform(platform: MarketingPlatformConfig): Promise<void> {
    await redisManager.setHash(
      `marketing:platform:${platform.id}`,
      platform,
      3600 * 24 * 30 // 30 days
    );
  }

  private async removePlatform(id: string): Promise<void> {
    await redisManager.delete(`marketing:platform:${id}`);
  }

  private async loadPlatforms(): Promise<void> {
    // Implementation would load from Redis/database
    console.log('📂 Loading platform configurations...');
  }

  private async loadSyncConfigurations(): Promise<void> {
    // Implementation would load from Redis/database
    console.log('📂 Loading sync configurations...');
  }

  private async loadActiveSyncJobs(): Promise<void> {
    // Implementation would load from Redis/database
    console.log('📂 Loading active sync jobs...');
  }

  private startProcessing(): void {
    this.processingInterval = setInterval(async () => {
      try {
        await this.processScheduledSyncs();
        await this.processWebhookEvents();
        await this.processRetries();
      } catch (error) {
        console.error('❌ Error in processing loop:', error);
      }
    }, 10000); // Every 10 seconds
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      try {
        this.collectPlatformMetrics();
      } catch (error) {
        console.error('❌ Error collecting metrics:', error);
      }
    }, 60000); // Every minute
  }

  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupOldJobs();
        await this.cleanupOldEvents();
        await this.cleanupExpiredTokens();
      } catch (error) {
        console.error('❌ Error in cleanup process:', error);
      }
    }, 3600000); // Every hour
  }

  private startHealthChecks(): void {
    for (const platform of this.platforms.values()) {
      if (platform.healthCheck.enabled) {
        this.startPlatformHealthCheck(platform.id);
      }
    }
  }

  private startPlatformHealthCheck(platformId: string): void {
    const platform = this.platforms.get(platformId);
    if (!platform || !platform.healthCheck.enabled) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        await this.performHealthCheck(platformId);
      } catch (error) {
        console.error(`❌ Health check failed for platform ${platformId}:`, error);
      }
    }, platform.healthCheck.interval);

    this.healthCheckers.set(platformId, timer);
  }

  private stopPlatformHealthCheck(platformId: string): void {
    const timer = this.healthCheckers.get(platformId);
    if (timer) {
      clearInterval(timer);
      this.healthCheckers.delete(platformId);
    }
  }

  private async performHealthCheck(platformId: string): Promise<void> {
    const platform = this.platforms.get(platformId);
    const adapter = platform ? this.adapters.get(platform.type) : undefined;

    if (!platform || !adapter) {
      return;
    }

    try {
      const result = await adapter.healthCheck(platform);

      if (!result.healthy && platform.status === 'active') {
        platform.status = 'error';
        await this.savePlatform(platform);
        this.emit('platform:health:failed', { platformId, result });
      } else if (result.healthy && platform.status === 'error') {
        platform.status = 'active';
        await this.savePlatform(platform);
        this.emit('platform:health:recovered', { platformId, result });
      }

    } catch (error) {
      console.error(`❌ Health check error for platform ${platformId}:`, error);
      if (platform.status === 'active') {
        platform.status = 'error';
        await this.savePlatform(platform);
        this.emit('platform:health:failed', { platformId, error: error.message });
      }
    }
  }

  private async processScheduledSyncs(): Promise<void> {
    // Implementation for processing scheduled sync jobs
  }

  private async processWebhookEvents(): Promise<void> {
    // Implementation for processing webhook events
  }

  private async processRetries(): Promise<void> {
    // Implementation for processing retries
  }

  private collectPlatformMetrics(): void {
    // Implementation for collecting platform metrics
  }

  private async cleanupOldJobs(): Promise<void> {
    // Implementation for cleaning up old sync jobs
  }

  private async cleanupOldEvents(): Promise<void> {
    // Implementation for cleaning up old webhook events
  }

  private async cleanupExpiredTokens(): Promise<void> {
    // Implementation for cleaning up expired authentication tokens
  }

  private async cancelSyncJob(jobId: string): Promise<void> {
    // Implementation for canceling sync jobs
  }

  private async deleteSyncConfiguration(configId: string): Promise<void> {
    // Implementation for deleting sync configurations
  }
}

// =============================================================================
// RATE LIMITER
// =============================================================================

class RateLimiter {
  private config: RateLimitConfig;
  private requests: { timestamp: number; count: number }[] = [];

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  checkLimit(): boolean {
    const now = Date.now();

    // Clean old requests
    this.requests = this.requests.filter(req =>
      now - req.timestamp < 60000 // Keep requests from last minute
    );

    // Check current usage
    const currentMinuteRequests = this.requests.reduce((sum, req) =>
      now - req.timestamp < 60000 ? sum + req.count : sum, 0
    );

    if (currentMinuteRequests >= this.config.requestsPerMinute) {
      return false;
    }

    // Add current request
    this.requests.push({ timestamp: now, count: 1 });
    return true;
  }

  getRetryAfter(): number {
    return this.config.retryAfter;
  }

  getUsage(): { used: number; limit: number; resetAt: Date } {
    const now = Date.now();
    const currentMinuteRequests = this.requests.reduce((sum, req) =>
      now - req.timestamp < 60000 ? sum + req.count : sum, 0
    );

    return {
      used: currentMinuteRequests,
      limit: this.config.requestsPerMinute,
      resetAt: new Date(now + 60000)
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const marketingPlatformHub = new UniversalMarketingPlatformIntegrationHub();
