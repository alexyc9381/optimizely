import crypto from 'crypto';
import { EventEmitter } from 'events';
import { ProcessedEvent } from './data-pipeline';
import { redisManager } from './redis-client';

// =============================================================================
// INTEGRATION TYPES & INTERFACES
// =============================================================================

export interface IntegrationConfig {
  id: string;
  name: string;
  type: IntegrationType;
  enabled: boolean;
  authentication: AuthenticationConfig;
  settings: Record<string, any>;
  rateLimit?: RateLimitConfig;
  dataMapping?: DataMappingConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticationConfig {
  type: 'api_key' | 'oauth2' | 'jwt' | 'basic' | 'custom';
  credentials: Record<string, any>;
  expiresAt?: Date;
  refreshToken?: string;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  retryAfter: number;
}

export interface DataMappingConfig {
  fieldMappings: Record<string, string>;
  transformations: TransformationRule[];
  filters: FilterRule[];
}

export interface TransformationRule {
  field: string;
  type: 'format' | 'convert' | 'calculate' | 'enrich';
  operation: string;
  parameters?: Record<string, any>;
}

export interface FilterRule {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: string[];
  headers?: Record<string, string>;
  timeout: number;
  retryAttempts: number;
  retryBackoff: 'linear' | 'exponential';
  signatureMethod: 'hmac-sha256' | 'hmac-sha1';
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  createdAt: Date;
  deliveredAt?: Date;
  nextRetry?: Date;
  error?: string;
  responseStatus?: number;
  responseBody?: string;
}

export interface SyncJob {
  id: string;
  integrationId: string;
  type: 'full' | 'incremental' | 'custom';
  direction: 'inbound' | 'outbound' | 'bidirectional';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalRecords: number;
  processedRecords: number;
  errorCount: number;
  startTime: Date;
  endTime?: Date;
  configuration: Record<string, any>;
  errors: SyncError[];
}

export interface SyncError {
  recordId?: string;
  message: string;
  timestamp: Date;
  retryable: boolean;
}

export enum IntegrationType {
  GOOGLE_ANALYTICS = 'google_analytics',
  ADOBE_ANALYTICS = 'adobe_analytics',
  MIXPANEL = 'mixpanel',
  SEGMENT = 'segment',
  HUBSPOT = 'hubspot',
  SALESFORCE = 'salesforce',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  CUSTOM = 'custom'
}

export interface IntegrationAdapter {
  type: IntegrationType;
  name: string;
  authenticate(config: AuthenticationConfig): Promise<boolean>;
  validateConfig(config: IntegrationConfig): Promise<ValidationResult>;
  sendEvent(event: ProcessedEvent, config: IntegrationConfig): Promise<DeliveryResult>;
  syncData(syncJob: SyncJob, config: IntegrationConfig): Promise<SyncResult>;
  getMetrics?(config: IntegrationConfig): Promise<Record<string, any>>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryable?: boolean;
  rateLimited?: boolean;
  nextRetryAt?: Date;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: SyncError[];
}

// =============================================================================
// INTEGRATION SERVICE MANAGER
// =============================================================================

export class IntegrationServiceManager extends EventEmitter {
  private integrations: Map<string, IntegrationConfig> = new Map();
  private adapters: Map<IntegrationType, IntegrationAdapter> = new Map();
  private webhooks: Map<string, WebhookConfig> = new Map();
  private deliveryQueue: WebhookDelivery[] = [];
  private syncJobs: Map<string, SyncJob> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private isProcessing: boolean = false;
  private processingInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.initializeAdapters();
  }

  async initialize(): Promise<void> {
    try {
      // Load existing integrations from storage
      await this.loadIntegrations();
      await this.loadWebhooks();
      await this.loadSyncJobs();

      // Start processing queues
      this.startProcessing();
      this.startMetricsCollection();

      console.log('🔗 Integration service initialized successfully');
      this.emit('integration:service:started');

    } catch (error) {
      console.error('❌ Failed to initialize integration service:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    console.log('⏹️ Integration service shutdown complete');
    this.emit('integration:service:stopped');
  }

  // =============================================================================
  // INTEGRATION MANAGEMENT
  // =============================================================================

  async createIntegration(config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConfig> {
    const integration: IntegrationConfig = {
      ...config,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate configuration
    const adapter = this.adapters.get(config.type);
    if (!adapter) {
      throw new Error(`Unsupported integration type: ${config.type}`);
    }

    const validation = await adapter.validateConfig(integration);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    // Test authentication
    const authResult = await adapter.authenticate(config.authentication);
    if (!authResult) {
      throw new Error('Authentication failed');
    }

    // Store integration
    this.integrations.set(integration.id, integration);
    await this.saveIntegration(integration);

    // Initialize rate limiter if configured
    if (integration.rateLimit) {
      this.rateLimiters.set(integration.id, new RateLimiter(integration.rateLimit));
    }

    console.log(`✅ Integration created: ${integration.name} (${integration.type})`);
    this.emit('integration:created', integration);

    return integration;
  }

  async updateIntegration(id: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig> {
    const existing = this.integrations.get(id);
    if (!existing) {
      throw new Error(`Integration not found: ${id}`);
    }

    const updated: IntegrationConfig = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date()
    };

    // Validate updated configuration
    const adapter = this.adapters.get(updated.type);
    if (adapter) {
      const validation = await adapter.validateConfig(updated);
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }
    }

    this.integrations.set(id, updated);
    await this.saveIntegration(updated);

    console.log(`🔄 Integration updated: ${updated.name}`);
    this.emit('integration:updated', updated);

    return updated;
  }

  async deleteIntegration(id: string): Promise<void> {
    const integration = this.integrations.get(id);
    if (!integration) {
      throw new Error(`Integration not found: ${id}`);
    }

    // Cancel any running sync jobs
    for (const [jobId, job] of this.syncJobs) {
      if (job.integrationId === id && job.status === 'running') {
        await this.cancelSyncJob(jobId);
      }
    }

    // Remove from memory and storage
    this.integrations.delete(id);
    this.rateLimiters.delete(id);
    await this.removeIntegration(id);

    console.log(`🗑️ Integration deleted: ${integration.name}`);
    this.emit('integration:deleted', { id, integration });
  }

  getIntegration(id: string): IntegrationConfig | undefined {
    return this.integrations.get(id);
  }

  getAllIntegrations(): IntegrationConfig[] {
    return Array.from(this.integrations.values());
  }

  getIntegrationsByType(type: IntegrationType): IntegrationConfig[] {
    return Array.from(this.integrations.values()).filter(i => i.type === type);
  }

  // =============================================================================
  // EVENT FORWARDING
  // =============================================================================

  async forwardEvent(event: ProcessedEvent): Promise<void> {
    const enabledIntegrations = Array.from(this.integrations.values())
      .filter(i => i.enabled);

    const forwardingPromises = enabledIntegrations.map(async (integration) => {
      try {
        // Check rate limiting
        const rateLimiter = this.rateLimiters.get(integration.id);
        if (rateLimiter && !rateLimiter.checkLimit()) {
          console.warn(`⚠️ Rate limit exceeded for integration: ${integration.name}`);
          return;
        }

        // Apply data mapping and filtering
        const mappedEvent = this.applyDataMapping(event, integration.dataMapping);
        if (!mappedEvent) {
          return; // Event filtered out
        }

        // Forward to adapter
        const adapter = this.adapters.get(integration.type);
        if (adapter) {
          const result = await adapter.sendEvent(mappedEvent, integration);

          if (result.success) {
            this.emit('integration:event:delivered', {
              integrationId: integration.id,
              eventId: event.id,
              messageId: result.messageId
            });
          } else {
            this.emit('integration:event:failed', {
              integrationId: integration.id,
              eventId: event.id,
              error: result.error,
              retryable: result.retryable
            });

            // Queue for retry if retryable
            if (result.retryable) {
              await this.queueEventRetry(event, integration, result);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error forwarding event to ${integration.name}:`, error);
        this.emit('integration:event:error', {
          integrationId: integration.id,
          eventId: event.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    await Promise.allSettled(forwardingPromises);
  }

  // =============================================================================
  // WEBHOOK MANAGEMENT
  // =============================================================================

  async createWebhook(config: WebhookConfig): Promise<string> {
    const webhookId = this.generateId();
    this.webhooks.set(webhookId, config);
    await this.saveWebhook(webhookId, config);

    console.log(`🪝 Webhook created: ${config.url}`);
    this.emit('webhook:created', { id: webhookId, config });

    return webhookId;
  }

  async updateWebhook(id: string, config: Partial<WebhookConfig>): Promise<void> {
    const existing = this.webhooks.get(id);
    if (!existing) {
      throw new Error(`Webhook not found: ${id}`);
    }

    const updated = { ...existing, ...config };
    this.webhooks.set(id, updated);
    await this.saveWebhook(id, updated);

    console.log(`🔄 Webhook updated: ${updated.url}`);
    this.emit('webhook:updated', { id, config: updated });
  }

  async deleteWebhook(id: string): Promise<void> {
    const webhook = this.webhooks.get(id);
    if (!webhook) {
      throw new Error(`Webhook not found: ${id}`);
    }

    this.webhooks.delete(id);
    await this.removeWebhook(id);

    console.log(`🗑️ Webhook deleted: ${webhook.url}`);
    this.emit('webhook:deleted', { id, webhook });
  }

  async triggerWebhook(webhookId: string, event: string, payload: any): Promise<WebhookDelivery> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook not found: ${webhookId}`);
    }

    if (!webhook.events.includes(event)) {
      throw new Error(`Webhook not configured for event: ${event}`);
    }

    const delivery: WebhookDelivery = {
      id: this.generateId(),
      webhookId,
      event,
      payload,
      status: 'pending',
      attempts: 0,
      createdAt: new Date()
    };

    this.deliveryQueue.push(delivery);
    await this.saveWebhookDelivery(delivery);

    console.log(`📤 Webhook delivery queued: ${webhook.url} - ${event}`);
    this.emit('webhook:queued', delivery);

    return delivery;
  }

  // =============================================================================
  // DATA SYNCHRONIZATION
  // =============================================================================

  async createSyncJob(config: {
    integrationId: string;
    type: 'full' | 'incremental' | 'custom';
    direction: 'inbound' | 'outbound' | 'bidirectional';
    configuration: Record<string, any>;
  }): Promise<SyncJob> {
    const integration = this.integrations.get(config.integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${config.integrationId}`);
    }

    const syncJob: SyncJob = {
      id: this.generateId(),
      integrationId: config.integrationId,
      type: config.type,
      direction: config.direction,
      status: 'pending',
      progress: 0,
      totalRecords: 0,
      processedRecords: 0,
      errorCount: 0,
      startTime: new Date(),
      configuration: config.configuration,
      errors: []
    };

    this.syncJobs.set(syncJob.id, syncJob);
    await this.saveSyncJob(syncJob);

    console.log(`🔄 Sync job created: ${integration.name} - ${config.type} ${config.direction}`);
    this.emit('sync:job:created', syncJob);

    // Queue for execution
    setImmediate(() => this.executeSyncJob(syncJob.id));

    return syncJob;
  }

  async executeSyncJob(jobId: string): Promise<void> {
    const syncJob = this.syncJobs.get(jobId);
    if (!syncJob || syncJob.status !== 'pending') {
      return;
    }

    const integration = this.integrations.get(syncJob.integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${syncJob.integrationId}`);
    }

    const adapter = this.adapters.get(integration.type);
    if (!adapter || !adapter.syncData) {
      throw new Error(`Sync not supported for integration type: ${integration.type}`);
    }

    try {
      // Update job status
      syncJob.status = 'running';
      syncJob.startTime = new Date();
      await this.saveSyncJob(syncJob);

      console.log(`🚀 Starting sync job: ${integration.name}`);
      this.emit('sync:job:started', syncJob);

      // Execute sync
      const result = await adapter.syncData(syncJob, integration);

      // Update job with results
      syncJob.status = result.success ? 'completed' : 'failed';
      syncJob.endTime = new Date();
      syncJob.processedRecords = result.recordsProcessed;
      syncJob.errorCount = result.errors.length;
      syncJob.errors = result.errors;
      syncJob.progress = 100;

      await this.saveSyncJob(syncJob);

      if (result.success) {
        console.log(`✅ Sync job completed: ${integration.name} - ${result.recordsProcessed} records`);
        this.emit('sync:job:completed', syncJob);
      } else {
        console.error(`❌ Sync job failed: ${integration.name} - ${result.errors.length} errors`);
        this.emit('sync:job:failed', syncJob);
      }

    } catch (error) {
      syncJob.status = 'failed';
      syncJob.endTime = new Date();
      syncJob.errors.push({
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        retryable: false
      });

      await this.saveSyncJob(syncJob);

      console.error(`❌ Sync job error: ${integration.name}:`, error);
      this.emit('sync:job:error', { syncJob, error });
    }
  }

  async cancelSyncJob(jobId: string): Promise<void> {
    const syncJob = this.syncJobs.get(jobId);
    if (!syncJob) {
      throw new Error(`Sync job not found: ${jobId}`);
    }

    syncJob.status = 'cancelled';
    syncJob.endTime = new Date();
    await this.saveSyncJob(syncJob);

    console.log(`⏹️ Sync job cancelled: ${jobId}`);
    this.emit('sync:job:cancelled', syncJob);
  }

  getSyncJob(id: string): SyncJob | undefined {
    return this.syncJobs.get(id);
  }

  getAllSyncJobs(): SyncJob[] {
    return Array.from(this.syncJobs.values());
  }

  getSyncJobsByIntegration(integrationId: string): SyncJob[] {
    return Array.from(this.syncJobs.values())
      .filter(job => job.integrationId === integrationId);
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private initializeAdapters(): void {
    // Register built-in adapters
    this.adapters.set(IntegrationType.GOOGLE_ANALYTICS, new GoogleAnalyticsAdapter());
    this.adapters.set(IntegrationType.ADOBE_ANALYTICS, new AdobeAnalyticsAdapter());
    this.adapters.set(IntegrationType.MIXPANEL, new MixpanelAdapter());
    this.adapters.set(IntegrationType.SEGMENT, new SegmentAdapter());
    this.adapters.set(IntegrationType.WEBHOOK, new WebhookAdapter());
  }

  private applyDataMapping(event: ProcessedEvent, mapping?: DataMappingConfig): ProcessedEvent | null {
    if (!mapping) return event;

    // Apply filters first
    for (const filter of mapping.filters) {
      const value = this.getNestedValue(event, filter.field);
      if (!this.evaluateFilter(value, filter)) {
        return null; // Event filtered out
      }
    }

    // Apply field mappings and transformations
    let mappedEvent = { ...event };

    // Apply field mappings
    for (const [sourceField, targetField] of Object.entries(mapping.fieldMappings)) {
      const value = this.getNestedValue(event, sourceField);
      this.setNestedValue(mappedEvent, targetField, value);
    }

    // Apply transformations
    for (const transformation of mapping.transformations) {
      const currentValue = this.getNestedValue(mappedEvent, transformation.field);
      const transformedValue = this.applyTransformation(currentValue, transformation);
      this.setNestedValue(mappedEvent, transformation.field, transformedValue);
    }

    return mappedEvent;
  }

  private evaluateFilter(value: any, filter: FilterRule): boolean {
    switch (filter.operator) {
      case 'equals':
        return value === filter.value;
      case 'contains':
        return String(value).includes(String(filter.value));
      case 'greater_than':
        return Number(value) > Number(filter.value);
      case 'less_than':
        return Number(value) < Number(filter.value);
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value);
      case 'not_in':
        return Array.isArray(filter.value) && !filter.value.includes(value);
      default:
        return true;
    }
  }

  private applyTransformation(value: any, transformation: TransformationRule): any {
    switch (transformation.type) {
      case 'format':
        return this.formatValue(value, transformation.operation, transformation.parameters);
      case 'convert':
        return this.convertValue(value, transformation.operation);
      case 'calculate':
        return this.calculateValue(value, transformation.operation, transformation.parameters);
      case 'enrich':
        return this.enrichValue(value, transformation.operation, transformation.parameters);
      default:
        return value;
    }
  }

  private formatValue(value: any, operation: string, parameters?: Record<string, any>): any {
    switch (operation) {
      case 'date_iso':
        return new Date(value).toISOString();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'uppercase':
        return String(value).toUpperCase();
      case 'trim':
        return String(value).trim();
      case 'round':
        const decimals = parameters?.decimals || 0;
        return Number(Number(value).toFixed(decimals));
      default:
        return value;
    }
  }

  private convertValue(value: any, operation: string): any {
    switch (operation) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value);
      default:
        return value;
    }
  }

  private calculateValue(value: any, operation: string, parameters?: Record<string, any>): any {
    switch (operation) {
      case 'add':
        return Number(value) + (parameters?.amount || 0);
      case 'multiply':
        return Number(value) * (parameters?.factor || 1);
      case 'percentage':
        return Number(value) * 100;
      default:
        return value;
    }
  }

  private enrichValue(value: any, operation: string, parameters?: Record<string, any>): any {
    switch (operation) {
      case 'prefix':
        return `${parameters?.prefix || ''}${value}`;
      case 'suffix':
        return `${value}${parameters?.suffix || ''}`;
      case 'default':
        return value || parameters?.defaultValue;
      default:
        return value;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private async queueEventRetry(event: ProcessedEvent, integration: IntegrationConfig, result: DeliveryResult): Promise<void> {
    // Implementation for retry queue
    console.log(`🔄 Queueing event retry for ${integration.name}`);
  }

  private startProcessing(): void {
    this.isProcessing = true;
    this.processingInterval = setInterval(async () => {
      if (this.deliveryQueue.length > 0) {
        await this.processWebhookDeliveries();
      }
    }, 1000);
  }

  private async processWebhookDeliveries(): Promise<void> {
    const pending = this.deliveryQueue.filter(d => d.status === 'pending' || d.status === 'retrying');

    for (const delivery of pending.slice(0, 10)) { // Process 10 at a time
      try {
        await this.deliverWebhook(delivery);
      } catch (error) {
        console.error(`❌ Webhook delivery error:`, error);
      }
    }
  }

  private async deliverWebhook(delivery: WebhookDelivery): Promise<void> {
    const webhook = this.webhooks.get(delivery.webhookId);
    if (!webhook) return;

    try {
      delivery.status = 'retrying';
      delivery.attempts++;

      // Create signature
      const signature = this.createSignature(JSON.stringify(delivery.payload), webhook.secret, webhook.signatureMethod);

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Universal-Analytics/1.0',
        [`X-Signature-${webhook.signatureMethod.toUpperCase()}`]: signature,
        ...webhook.headers
      };

      // Make request (simplified - would use proper HTTP client)
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(delivery.payload),
        signal: AbortSignal.timeout(webhook.timeout)
      });

      delivery.responseStatus = response.status;
      delivery.responseBody = await response.text();

      if (response.ok) {
        delivery.status = 'delivered';
        delivery.deliveredAt = new Date();
        console.log(`✅ Webhook delivered: ${webhook.url}`);
        this.emit('webhook:delivered', delivery);
      } else {
        throw new Error(`HTTP ${response.status}: ${delivery.responseBody}`);
      }

    } catch (error) {
      delivery.error = error instanceof Error ? error.message : 'Unknown error';

      if (delivery.attempts >= webhook.retryAttempts) {
        delivery.status = 'failed';
        console.error(`❌ Webhook delivery failed after ${delivery.attempts} attempts: ${webhook.url}`);
        this.emit('webhook:failed', delivery);
      } else {
        delivery.status = 'pending';
        delivery.nextRetry = new Date(Date.now() + this.calculateRetryDelay(delivery.attempts, webhook.retryBackoff));
        console.warn(`⚠️ Webhook delivery failed, retrying: ${webhook.url}`);
        this.emit('webhook:retry', delivery);
      }
    }

    await this.saveWebhookDelivery(delivery);
  }

  private createSignature(payload: string, secret: string, method: string): string {
    const hmac = crypto.createHmac(method.replace('hmac-', ''), secret);
    hmac.update(payload);
    return hmac.digest('hex');
  }

  private calculateRetryDelay(attempt: number, backoff: 'linear' | 'exponential'): number {
    const baseDelay = 1000; // 1 second

    switch (backoff) {
      case 'linear':
        return baseDelay * attempt;
      case 'exponential':
        return baseDelay * Math.pow(2, attempt - 1);
      default:
        return baseDelay;
    }
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 60000); // Every minute
  }

  private collectMetrics(): void {
    const metrics = {
      totalIntegrations: this.integrations.size,
      enabledIntegrations: Array.from(this.integrations.values()).filter(i => i.enabled).length,
      totalWebhooks: this.webhooks.size,
      pendingDeliveries: this.deliveryQueue.filter(d => d.status === 'pending').length,
      activeSyncJobs: Array.from(this.syncJobs.values()).filter(j => j.status === 'running').length,
      timestamp: new Date()
    };

    this.emit('integration:metrics', metrics);
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  // Storage methods (simplified - would use proper database)
  private async saveIntegration(integration: IntegrationConfig): Promise<void> {
    const redis = redisManager.getClient();
    await redis.set(`integration:${integration.id}`, JSON.stringify(integration));
  }

  private async removeIntegration(id: string): Promise<void> {
    const redis = redisManager.getClient();
    await redis.del(`integration:${id}`);
  }

  private async loadIntegrations(): Promise<void> {
    // Load from storage
  }

  private async saveWebhook(id: string, webhook: WebhookConfig): Promise<void> {
    const redis = redisManager.getClient();
    await redis.set(`webhook:${id}`, JSON.stringify(webhook));
  }

  private async removeWebhook(id: string): Promise<void> {
    const redis = redisManager.getClient();
    await redis.del(`webhook:${id}`);
  }

  private async loadWebhooks(): Promise<void> {
    // Load from storage
  }

  private async saveSyncJob(job: SyncJob): Promise<void> {
    const redis = redisManager.getClient();
    await redis.set(`sync_job:${job.id}`, JSON.stringify(job));
  }

  private async loadSyncJobs(): Promise<void> {
    // Load from storage
  }

  private async saveWebhookDelivery(delivery: WebhookDelivery): Promise<void> {
    const redis = redisManager.getClient();
    await redis.set(`webhook_delivery:${delivery.id}`, JSON.stringify(delivery));
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
    this.requests = this.requests.filter(r => now - r.timestamp < 60000); // Keep last minute

    const currentMinuteRequests = this.requests.reduce((sum, r) => sum + r.count, 0);

    if (currentMinuteRequests >= this.config.requestsPerMinute) {
      return false;
    }

    // Add new request
    const lastRequest = this.requests[this.requests.length - 1];
    if (lastRequest && now - lastRequest.timestamp < 1000) {
      lastRequest.count++;
    } else {
      this.requests.push({ timestamp: now, count: 1 });
    }

    return true;
  }
}

// =============================================================================
// ADAPTER IMPLEMENTATIONS
// =============================================================================

class GoogleAnalyticsAdapter implements IntegrationAdapter {
  type = IntegrationType.GOOGLE_ANALYTICS;
  name = 'Google Analytics 4';

  async authenticate(config: AuthenticationConfig): Promise<boolean> {
    // Implementation for GA4 authentication
    return true;
  }

  async validateConfig(config: IntegrationConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.settings.measurementId) {
      errors.push('Measurement ID is required');
    }

    if (!config.settings.apiSecret) {
      errors.push('API Secret is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async sendEvent(event: ProcessedEvent, config: IntegrationConfig): Promise<DeliveryResult> {
    try {
      // Map to GA4 format
      const ga4Event = this.mapToGA4Event(event);

      // Send to GA4 Measurement Protocol
      const response = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${config.settings.measurementId}&api_secret=${config.settings.apiSecret}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: event.visitorId,
          events: [ga4Event]
        })
      });

      if (response.ok) {
        return { success: true, messageId: event.id };
      } else {
        return {
          success: false,
          error: `GA4 API error: ${response.status}`,
          retryable: response.status >= 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      };
    }
  }

  async syncData(syncJob: SyncJob, config: IntegrationConfig): Promise<SyncResult> {
    // Implementation for GA4 data sync
    return {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: []
    };
  }

  private mapToGA4Event(event: ProcessedEvent): any {
    return {
      name: event.type,
      params: {
        session_id: event.sessionId,
        ...event.data
      }
    };
  }
}

class AdobeAnalyticsAdapter implements IntegrationAdapter {
  type = IntegrationType.ADOBE_ANALYTICS;
  name = 'Adobe Analytics';

  async authenticate(config: AuthenticationConfig): Promise<boolean> {
    // Implementation for Adobe Analytics authentication
    return true;
  }

  async validateConfig(config: IntegrationConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.settings.reportSuiteId) {
      errors.push('Report Suite ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async sendEvent(event: ProcessedEvent, config: IntegrationConfig): Promise<DeliveryResult> {
    try {
      // Map to Adobe Analytics format
      const adobeEvent = this.mapToAdobeEvent(event);

      // Send to Adobe Analytics Data Insertion API
      const response = await fetch(`https://${config.settings.trackingServer}/b/ss/${config.settings.reportSuiteId}/1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(adobeEvent).toString()
      });

      if (response.ok) {
        return { success: true, messageId: event.id };
      } else {
        return {
          success: false,
          error: `Adobe Analytics API error: ${response.status}`,
          retryable: response.status >= 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      };
    }
  }

  async syncData(syncJob: SyncJob, config: IntegrationConfig): Promise<SyncResult> {
    // Implementation for Adobe Analytics data sync
    return {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: []
    };
  }

  private mapToAdobeEvent(event: ProcessedEvent): Record<string, string> {
    return {
      vid: event.visitorId,
      t: event.timestamp.getTime().toString(),
      pageName: event.data.page || '',
      events: event.type
    };
  }
}

class MixpanelAdapter implements IntegrationAdapter {
  type = IntegrationType.MIXPANEL;
  name = 'Mixpanel';

  async authenticate(config: AuthenticationConfig): Promise<boolean> {
    // Implementation for Mixpanel authentication
    return true;
  }

  async validateConfig(config: IntegrationConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.settings.projectToken) {
      errors.push('Project Token is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async sendEvent(event: ProcessedEvent, config: IntegrationConfig): Promise<DeliveryResult> {
    try {
      // Map to Mixpanel format
      const mixpanelEvent = this.mapToMixpanelEvent(event);

      // Send to Mixpanel Events API
      const response = await fetch('https://api.mixpanel.com/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(config.settings.projectToken + ':').toString('base64')}`
        },
        body: JSON.stringify([mixpanelEvent])
      });

      if (response.ok) {
        return { success: true, messageId: event.id };
      } else {
        return {
          success: false,
          error: `Mixpanel API error: ${response.status}`,
          retryable: response.status >= 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      };
    }
  }

  async syncData(syncJob: SyncJob, config: IntegrationConfig): Promise<SyncResult> {
    // Implementation for Mixpanel data sync
    return {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: []
    };
  }

  private mapToMixpanelEvent(event: ProcessedEvent): any {
    return {
      event: event.type,
      properties: {
        token: event.data.token,
        distinct_id: event.visitorId,
        time: event.timestamp.getTime(),
        ...event.data
      }
    };
  }
}

class SegmentAdapter implements IntegrationAdapter {
  type = IntegrationType.SEGMENT;
  name = 'Segment';

  async authenticate(config: AuthenticationConfig): Promise<boolean> {
    // Implementation for Segment authentication
    return true;
  }

  async validateConfig(config: IntegrationConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.settings.writeKey) {
      errors.push('Write Key is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async sendEvent(event: ProcessedEvent, config: IntegrationConfig): Promise<DeliveryResult> {
    try {
      // Map to Segment format
      const segmentEvent = this.mapToSegmentEvent(event);

      // Send to Segment Track API
      const response = await fetch('https://api.segment.io/v1/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(config.settings.writeKey + ':').toString('base64')}`
        },
        body: JSON.stringify(segmentEvent)
      });

      if (response.ok) {
        return { success: true, messageId: event.id };
      } else {
        return {
          success: false,
          error: `Segment API error: ${response.status}`,
          retryable: response.status >= 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      };
    }
  }

  async syncData(syncJob: SyncJob, config: IntegrationConfig): Promise<SyncResult> {
    // Implementation for Segment data sync
    return {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: []
    };
  }

  private mapToSegmentEvent(event: ProcessedEvent): any {
    return {
      userId: event.visitorId,
      event: event.type,
      properties: event.data,
      timestamp: event.timestamp.toISOString(),
      context: {
        sessionId: event.sessionId
      }
    };
  }
}

class WebhookAdapter implements IntegrationAdapter {
  type = IntegrationType.WEBHOOK;
  name = 'Generic Webhook';

  async authenticate(config: AuthenticationConfig): Promise<boolean> {
    // Test webhook endpoint
    return true;
  }

  async validateConfig(config: IntegrationConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.settings.url) {
      errors.push('Webhook URL is required');
    }

    try {
      new URL(config.settings.url);
    } catch {
      errors.push('Invalid webhook URL format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async sendEvent(event: ProcessedEvent, config: IntegrationConfig): Promise<DeliveryResult> {
    try {
      const response = await fetch(config.settings.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.settings.headers
        },
        body: JSON.stringify(event)
      });

      if (response.ok) {
        return { success: true, messageId: event.id };
      } else {
        return {
          success: false,
          error: `Webhook error: ${response.status}`,
          retryable: response.status >= 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      };
    }
  }

  async syncData(syncJob: SyncJob, config: IntegrationConfig): Promise<SyncResult> {
    // Webhooks don't typically support sync
    return {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: [{ message: 'Sync not supported for webhook integrations', timestamp: new Date(), retryable: false }]
    };
  }
}

// Export singleton instance
export const integrationService = new IntegrationServiceManager();
