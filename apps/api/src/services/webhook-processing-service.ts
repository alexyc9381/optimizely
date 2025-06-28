import crypto from 'crypto';
import { EventEmitter } from 'events';
import { redisManager } from './redis-client';
import SyncEngineService from './sync-engine-service';

// =============================================================================
// CORE INTERFACES
// =============================================================================

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  crmType: 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'custom';
  crmInstanceId: string;
  secret: string;
  events: string[];
  isActive: boolean;
  configuration: WebhookConfiguration;
  createdAt: Date;
  lastUsed?: Date;
  stats: WebhookStats;
}

export interface WebhookConfiguration {
  signatureHeader: string;
  signaturePrefix: string;
  timestampHeader?: string;
  timestampTolerance: number;
  retryPolicy: RetryPolicy;
  rateLimiting: RateLimitConfig;
  payloadTransformation?: PayloadTransformation;
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests: boolean;
}

export interface PayloadTransformation {
  enabled: boolean;
  rules: TransformationRule[];
}

export interface TransformationRule {
  field: string;
  operation: 'rename' | 'format' | 'extract' | 'calculate';
  parameters: Record<string, any>;
}

export interface WebhookStats {
  totalReceived: number;
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
  lastProcessedAt?: Date;
  errorRate: number;
}

export interface IncomingWebhook {
  id: string;
  endpointId: string;
  event: string;
  payload: any;
  headers: Record<string, string>;
  signature?: string;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  processingAttempts: number;
  processingTime?: number;
  error?: string;
  syncJobId?: string;
  enrichmentJobId?: string;
}

export interface WebhookProcessor {
  id: string;
  name: string;
  eventTypes: string[];
  crmTypes: string[];
  handler: (webhook: IncomingWebhook) => Promise<ProcessingResult>;
  priority: number;
  isActive: boolean;
}

export interface ProcessingResult {
  success: boolean;
  processingTime: number;
  actions: ProcessingAction[];
  error?: string;
  metadata?: Record<string, any>;
}

export interface ProcessingAction {
  type: 'sync' | 'enrich' | 'score' | 'notify' | 'custom';
  target: string;
  parameters: Record<string, any>;
  status: 'pending' | 'completed' | 'failed';
  result?: any;
}

export interface WebhookEvent {
  type: string;
  crmType: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete' | 'custom';
  data: Record<string, any>;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface WebhookQueue {
  pending: IncomingWebhook[];
  processing: IncomingWebhook[];
  failed: IncomingWebhook[];
  completed: IncomingWebhook[];
}

export interface WebhookMetrics {
  totalEndpoints: number;
  activeEndpoints: number;
  totalWebhooksReceived: number;
  totalWebhooksProcessed: number;
  totalWebhooksFailed: number;
  averageProcessingTime: number;
  errorRate: number;
  throughput: number;
  queueSize: number;
  processingCapacity: number;
  lastCalculated: Date;
}

// =============================================================================
// WEBHOOK PROCESSING SERVICE
// =============================================================================

export default class WebhookProcessingService extends EventEmitter {
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private processors: Map<string, WebhookProcessor> = new Map();
  private webhookQueue: WebhookQueue = {
    pending: [],
    processing: [],
    failed: [],
    completed: []
  };
  private rateLimiters: Map<string, Map<string, number>> = new Map();
  private metrics: WebhookMetrics | null = null;
  private syncEngineService: SyncEngineService;
  private isProcessing = false;
  private processingInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private maxConcurrentProcessing = 10;
  private maxQueueSize = 1000;

  constructor() {
    super();
    this.syncEngineService = new SyncEngineService();
    this.initializeService();
  }

  // =============================================================================
  // INITIALIZATION & SETUP
  // =============================================================================

  private async initializeService(): Promise<void> {
    try {
      await this.loadEndpoints();
      await this.initializeProcessors();
      await this.startProcessing();
      await this.startMetricsCollection();
      await this.generateMockData();

      this.emit('service_initialized', {
        endpointCount: this.endpoints.size,
        processorCount: this.processors.size,
        timestamp: Date.now()
      });

      console.log('🔗 Webhook Processing Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Webhook Processing Service:', error);
      throw error;
    }
  }

  private async initializeProcessors(): Promise<void> {
    // CRM Data Sync Processor
    await this.registerProcessor({
      id: 'crm_sync_processor',
      name: 'CRM Data Sync Processor',
      eventTypes: ['contact.created', 'contact.updated', 'contact.deleted', 'company.created', 'company.updated', 'company.deleted', 'deal.created', 'deal.updated', 'deal.deleted'],
      crmTypes: ['salesforce', 'hubspot', 'pipedrive', 'zoho', 'custom'],
      handler: this.processCRMDataSync.bind(this),
      priority: 1,
      isActive: true
    });

    // Contact Enrichment Processor
    await this.registerProcessor({
      id: 'contact_enrichment_processor',
      name: 'Contact Enrichment Processor',
      eventTypes: ['contact.created', 'contact.updated'],
      crmTypes: ['salesforce', 'hubspot', 'pipedrive', 'zoho', 'custom'],
      handler: this.processContactEnrichment.bind(this),
      priority: 2,
      isActive: true
    });

    // Lead Scoring Processor
    await this.registerProcessor({
      id: 'lead_scoring_processor',
      name: 'Lead Scoring Processor',
      eventTypes: ['contact.created', 'contact.updated', 'deal.created', 'deal.updated'],
      crmTypes: ['salesforce', 'hubspot', 'pipedrive', 'zoho', 'custom'],
      handler: this.processLeadScoring.bind(this),
      priority: 3,
      isActive: true
    });

    // Duplicate Detection Processor
    await this.registerProcessor({
      id: 'duplicate_detection_processor',
      name: 'Duplicate Detection Processor',
      eventTypes: ['contact.created', 'company.created'],
      crmTypes: ['salesforce', 'hubspot', 'pipedrive', 'zoho', 'custom'],
      handler: this.processDuplicateDetection.bind(this),
      priority: 4,
      isActive: true
    });
  }

  // =============================================================================
  // WEBHOOK ENDPOINT MANAGEMENT
  // =============================================================================

  async createEndpoint(config: Partial<WebhookEndpoint>): Promise<string> {
    const endpointId = this.generateId();
    const secret = this.generateSecret();

    const endpoint: WebhookEndpoint = {
      id: endpointId,
      name: config.name || `Webhook Endpoint ${endpointId}`,
      url: `/api/v1/webhook-processing/receive/${endpointId}`,
      crmType: config.crmType || 'custom',
      crmInstanceId: config.crmInstanceId || 'default',
      secret,
      events: config.events || [],
      isActive: config.isActive !== undefined ? config.isActive : true,
      configuration: config.configuration || this.getDefaultConfiguration(config.crmType || 'custom'),
      createdAt: new Date(),
      stats: {
        totalReceived: 0,
        totalProcessed: 0,
        totalFailed: 0,
        averageProcessingTime: 0,
        errorRate: 0
      }
    };

    this.endpoints.set(endpointId, endpoint);
    await this.saveEndpoint(endpointId, endpoint);

    this.emit('endpoint_created', { endpointId, endpoint });
    console.log(`🔗 Webhook endpoint created: ${endpoint.url}`);

    return endpointId;
  }

  async updateEndpoint(endpointId: string, updates: Partial<WebhookEndpoint>): Promise<boolean> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return false;

    Object.assign(endpoint, updates);
    await this.saveEndpoint(endpointId, endpoint);

    this.emit('endpoint_updated', { endpointId, updates });
    return true;
  }

  async deleteEndpoint(endpointId: string): Promise<boolean> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return false;

    this.endpoints.delete(endpointId);
    await this.removeEndpoint(endpointId);

    this.emit('endpoint_deleted', { endpointId });
    return true;
  }

  getEndpoint(endpointId: string): WebhookEndpoint | null {
    return this.endpoints.get(endpointId) || null;
  }

  getEndpoints(crmType?: string): WebhookEndpoint[] {
    let endpoints = Array.from(this.endpoints.values());
    if (crmType) {
      endpoints = endpoints.filter(e => e.crmType === crmType);
    }
    return endpoints;
  }

  // =============================================================================
  // WEBHOOK PROCESSING
  // =============================================================================

  async processIncomingWebhook(endpointId: string, payload: any, headers: Record<string, string>): Promise<string> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      throw new Error(`Webhook endpoint not found: ${endpointId}`);
    }

    if (!endpoint.isActive) {
      throw new Error(`Webhook endpoint is inactive: ${endpointId}`);
    }

    // Rate limiting check
    if (!await this.checkRateLimit(endpointId, headers)) {
      throw new Error('Rate limit exceeded');
    }

    // Signature verification
    const signature = headers[endpoint.configuration.signatureHeader.toLowerCase()];
    if (!this.verifySignature(payload, signature, endpoint.secret, endpoint.configuration)) {
      throw new Error('Invalid webhook signature');
    }

    // Create webhook record
    const webhookId = this.generateId();
    const webhook: IncomingWebhook = {
      id: webhookId,
      endpointId,
      event: this.extractEventType(payload, endpoint.crmType),
      payload,
      headers,
      signature,
      timestamp: new Date(),
      status: 'pending',
      processingAttempts: 0
    };

    // Add to queue
    if (this.webhookQueue.pending.length >= this.maxQueueSize) {
      throw new Error('Webhook queue is full');
    }

    this.webhookQueue.pending.push(webhook);
    await this.saveWebhook(webhook);

    // Update endpoint stats
    endpoint.stats.totalReceived++;
    endpoint.lastUsed = new Date();
    await this.saveEndpoint(endpointId, endpoint);

    this.emit('webhook_received', { webhookId, endpointId, event: webhook.event });
    console.log(`📥 Webhook received: ${endpointId} - ${webhook.event}`);

    return webhookId;
  }

  async processWebhookQueue(): Promise<void> {
    if (this.isProcessing || this.webhookQueue.pending.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const maxConcurrent = Math.min(
        this.maxConcurrentProcessing,
        this.webhookQueue.pending.length
      );

      const processingPromises: Promise<void>[] = [];

      for (let i = 0; i < maxConcurrent; i++) {
        const webhook = this.webhookQueue.pending.shift();
        if (webhook) {
          this.webhookQueue.processing.push(webhook);
          processingPromises.push(this.processWebhook(webhook));
        }
      }

      await Promise.all(processingPromises);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processWebhook(webhook: IncomingWebhook): Promise<void> {
    const startTime = Date.now();
    webhook.status = 'processing';
    webhook.processingAttempts++;

    try {
      // Parse webhook event
      const event = this.parseWebhookEvent(webhook);

      // Find applicable processors
      const applicableProcessors = this.getApplicableProcessors(webhook, event);

      // Process with each applicable processor
      const results: ProcessingResult[] = [];
      for (const processor of applicableProcessors) {
        try {
          const result = await processor.handler(webhook);
          results.push(result);

          // Execute actions
          await this.executeProcessingActions(result.actions, webhook);
        } catch (error) {
          console.error(`Processor ${processor.name} failed:`, error);
          results.push({
            success: false,
            processingTime: Date.now() - startTime,
            actions: [],
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Determine overall success
      const allSuccessful = results.every(r => r.success);
      webhook.status = allSuccessful ? 'completed' : 'failed';
      webhook.processingTime = Date.now() - startTime;

      if (!allSuccessful) {
        const errors = results.filter(r => !r.success).map(r => r.error).join('; ');
        webhook.error = errors;
      }

      // Move to appropriate queue
      this.moveWebhookToQueue(webhook, webhook.status === 'completed' ? 'completed' : 'failed');

      // Update endpoint stats
      await this.updateEndpointStats(webhook.endpointId, webhook);

      this.emit('webhook_processed', {
        webhookId: webhook.id,
        status: webhook.status,
        processingTime: webhook.processingTime,
        results
      });

    } catch (error) {
      webhook.status = 'failed';
      webhook.error = error instanceof Error ? error.message : 'Unknown error';
      webhook.processingTime = Date.now() - startTime;

      this.moveWebhookToQueue(webhook, 'failed');
      await this.updateEndpointStats(webhook.endpointId, webhook);

      this.emit('webhook_failed', {
        webhookId: webhook.id,
        error: webhook.error,
        processingTime: webhook.processingTime
      });

      console.error(`❌ Webhook processing failed: ${webhook.id}`, error);
    }

    await this.saveWebhook(webhook);
  }

  // =============================================================================
  // WEBHOOK PROCESSORS
  // =============================================================================

  async registerProcessor(processor: WebhookProcessor): Promise<void> {
    this.processors.set(processor.id, processor);
    console.log(`🔧 Webhook processor registered: ${processor.name}`);
  }

  async unregisterProcessor(processorId: string): Promise<boolean> {
    return this.processors.delete(processorId);
  }

  private getApplicableProcessors(webhook: IncomingWebhook, event: WebhookEvent): WebhookProcessor[] {
    const endpoint = this.endpoints.get(webhook.endpointId);
    if (!endpoint) return [];

    return Array.from(this.processors.values())
      .filter(processor =>
        processor.isActive &&
        processor.crmTypes.includes(endpoint.crmType) &&
        processor.eventTypes.includes(event.type)
      )
      .sort((a, b) => a.priority - b.priority);
  }

  // =============================================================================
  // PROCESSOR IMPLEMENTATIONS
  // =============================================================================

  private async processCRMDataSync(webhook: IncomingWebhook): Promise<ProcessingResult> {
    const startTime = Date.now();
    const actions: ProcessingAction[] = [];

    try {
      const event = this.parseWebhookEvent(webhook);
      const endpoint = this.endpoints.get(webhook.endpointId)!;

      // Create sync job for the CRM data change
      const syncJobId = await this.createSyncJob(event, endpoint);
      webhook.syncJobId = syncJobId;

      actions.push({
        type: 'sync',
        target: 'sync_engine',
        parameters: {
          jobId: syncJobId,
          entityType: event.entityType,
          entityId: event.entityId,
          operation: event.operation
        },
        status: 'completed',
        result: { syncJobId }
      });

      return {
        success: true,
        processingTime: Date.now() - startTime,
        actions,
        metadata: { syncJobId }
      };
    } catch (error) {
      return {
        success: false,
        processingTime: Date.now() - startTime,
        actions,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async processContactEnrichment(webhook: IncomingWebhook): Promise<ProcessingResult> {
    const startTime = Date.now();
    const actions: ProcessingAction[] = [];

    try {
      const event = this.parseWebhookEvent(webhook);

      if (event.entityType === 'contact') {
        // Trigger contact enrichment
        const enrichmentJobId = this.generateId();
        webhook.enrichmentJobId = enrichmentJobId;

        actions.push({
          type: 'enrich',
          target: 'contact_enrichment',
          parameters: {
            contactId: event.entityId,
            contactData: event.data,
            jobId: enrichmentJobId
          },
          status: 'completed',
          result: { enrichmentJobId }
        });
      }

      return {
        success: true,
        processingTime: Date.now() - startTime,
        actions,
        metadata: { enrichmentJobId: webhook.enrichmentJobId }
      };
    } catch (error) {
      return {
        success: false,
        processingTime: Date.now() - startTime,
        actions,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async processLeadScoring(webhook: IncomingWebhook): Promise<ProcessingResult> {
    const startTime = Date.now();
    const actions: ProcessingAction[] = [];

    try {
      const event = this.parseWebhookEvent(webhook);

      if (['contact', 'deal'].includes(event.entityType)) {
        // Trigger lead scoring update
        const scoringJobId = this.generateId();

        actions.push({
          type: 'score',
          target: 'lead_scoring',
          parameters: {
            entityType: event.entityType,
            entityId: event.entityId,
            entityData: event.data,
            jobId: scoringJobId
          },
          status: 'completed',
          result: { scoringJobId }
        });
      }

      return {
        success: true,
        processingTime: Date.now() - startTime,
        actions,
        metadata: { scoringJobId: actions[0]?.result?.scoringJobId }
      };
    } catch (error) {
      return {
        success: false,
        processingTime: Date.now() - startTime,
        actions,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async processDuplicateDetection(webhook: IncomingWebhook): Promise<ProcessingResult> {
    const startTime = Date.now();
    const actions: ProcessingAction[] = [];

    try {
      const event = this.parseWebhookEvent(webhook);

      if (['contact', 'company'].includes(event.entityType) && event.operation === 'create') {
        // Trigger duplicate detection
        const detectionJobId = this.generateId();

        actions.push({
          type: 'custom',
          target: 'duplicate_detection',
          parameters: {
            entityType: event.entityType,
            entityId: event.entityId,
            entityData: event.data,
            jobId: detectionJobId
          },
          status: 'completed',
          result: { detectionJobId }
        });
      }

      return {
        success: true,
        processingTime: Date.now() - startTime,
        actions,
        metadata: { detectionJobId: actions[0]?.result?.detectionJobId }
      };
    } catch (error) {
      return {
        success: false,
        processingTime: Date.now() - startTime,
        actions,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private async executeProcessingActions(actions: ProcessingAction[], webhook: IncomingWebhook): Promise<void> {
    for (const action of actions) {
      try {
        // Execute action based on type
        switch (action.type) {
          case 'sync':
            // Integration with sync engine would happen here
            console.log(`🔄 Executing sync action for webhook ${webhook.id}`);
            break;
          case 'enrich':
            // Integration with enrichment service would happen here
            console.log(`🔍 Executing enrichment action for webhook ${webhook.id}`);
            break;
          case 'score':
            // Integration with scoring service would happen here
            console.log(`📊 Executing scoring action for webhook ${webhook.id}`);
            break;
          case 'notify':
            // Integration with notification service would happen here
            console.log(`📢 Executing notification action for webhook ${webhook.id}`);
            break;
          case 'custom':
            // Custom action processing
            console.log(`⚙️ Executing custom action for webhook ${webhook.id}`);
            break;
        }
        action.status = 'completed';
      } catch (error) {
        action.status = 'failed';
        console.error(`Action ${action.type} failed for webhook ${webhook.id}:`, error);
      }
    }
  }

  private parseWebhookEvent(webhook: IncomingWebhook): WebhookEvent {
    const endpoint = this.endpoints.get(webhook.endpointId)!;

    // Parse based on CRM type
    switch (endpoint.crmType) {
      case 'salesforce':
        return this.parseSalesforceEvent(webhook);
      case 'hubspot':
        return this.parseHubSpotEvent(webhook);
      case 'pipedrive':
        return this.parsePipedriveEvent(webhook);
      default:
        return this.parseGenericEvent(webhook);
    }
  }

  private parseSalesforceEvent(webhook: IncomingWebhook): WebhookEvent {
    const payload = webhook.payload;
    return {
      type: webhook.event,
      crmType: 'salesforce',
      entityType: this.extractSalesforceEntityType(payload),
      entityId: payload.sobject?.Id || payload.Id,
      operation: this.extractSalesforceOperation(payload),
      data: payload.sobject || payload,
      timestamp: new Date(payload.createdDate || Date.now()),
      metadata: {
        organizationId: payload.organizationId,
        userId: payload.userId
      }
    };
  }

  private parseHubSpotEvent(webhook: IncomingWebhook): WebhookEvent {
    const payload = webhook.payload;
    return {
      type: webhook.event,
      crmType: 'hubspot',
      entityType: this.extractHubSpotEntityType(payload),
      entityId: payload.objectId?.toString() || payload.vid?.toString(),
      operation: this.extractHubSpotOperation(payload),
      data: payload.properties || payload,
      timestamp: new Date(payload.occurredAt || Date.now()),
      metadata: {
        portalId: payload.portalId,
        subscriptionType: payload.subscriptionType
      }
    };
  }

  private parsePipedriveEvent(webhook: IncomingWebhook): WebhookEvent {
    const payload = webhook.payload;
    return {
      type: webhook.event,
      crmType: 'pipedrive',
      entityType: this.extractPipedriveEntityType(payload),
      entityId: payload.current?.id?.toString() || payload.previous?.id?.toString(),
      operation: this.extractPipedriveOperation(payload),
      data: payload.current || payload.previous || payload,
      timestamp: new Date(payload.timestamp || Date.now()),
      metadata: {
        companyId: payload.meta?.company_id,
        userId: payload.meta?.user_id
      }
    };
  }

  private parseGenericEvent(webhook: IncomingWebhook): WebhookEvent {
    const payload = webhook.payload;
    return {
      type: webhook.event,
      crmType: 'custom',
      entityType: payload.entityType || 'unknown',
      entityId: payload.entityId || payload.id,
      operation: payload.operation || 'update',
      data: payload.data || payload,
      timestamp: new Date(payload.timestamp || Date.now())
    };
  }

  private extractEventType(payload: any, crmType: string): string {
    switch (crmType) {
      case 'salesforce':
        return payload.eventType || 'unknown';
      case 'hubspot':
        return payload.subscriptionType || 'unknown';
      case 'pipedrive':
        return payload.event || 'unknown';
      default:
        return payload.event || payload.type || 'unknown';
    }
  }

  private extractSalesforceEntityType(payload: any): string {
    return payload.sobject?.attributes?.type || payload.sObjectType || 'unknown';
  }

  private extractSalesforceOperation(payload: any): 'create' | 'update' | 'delete' | 'custom' {
    const eventType = payload.eventType || '';
    if (eventType.includes('created')) return 'create';
    if (eventType.includes('updated')) return 'update';
    if (eventType.includes('deleted')) return 'delete';
    return 'custom';
  }

  private extractHubSpotEntityType(payload: any): string {
    const subscriptionType = payload.subscriptionType || '';
    if (subscriptionType.includes('contact')) return 'contact';
    if (subscriptionType.includes('company')) return 'company';
    if (subscriptionType.includes('deal')) return 'deal';
    return 'unknown';
  }

  private extractHubSpotOperation(payload: any): 'create' | 'update' | 'delete' | 'custom' {
    const subscriptionType = payload.subscriptionType || '';
    if (subscriptionType.includes('creation')) return 'create';
    if (subscriptionType.includes('property_change')) return 'update';
    if (subscriptionType.includes('deletion')) return 'delete';
    return 'custom';
  }

  private extractPipedriveEntityType(payload: any): string {
    const event = payload.event || '';
    if (event.includes('person')) return 'contact';
    if (event.includes('organization')) return 'company';
    if (event.includes('deal')) return 'deal';
    return 'unknown';
  }

  private extractPipedriveOperation(payload: any): 'create' | 'update' | 'delete' | 'custom' {
    const event = payload.event || '';
    if (event.includes('added')) return 'create';
    if (event.includes('updated')) return 'update';
    if (event.includes('deleted')) return 'delete';
    return 'custom';
  }

  private async createSyncJob(event: WebhookEvent, endpoint: WebhookEndpoint): Promise<string> {
    // Integration with sync engine service
    const syncJobConfig = {
      name: `Webhook Sync - ${event.type}`,
      sourceSystem: endpoint.crmType,
      targetSystem: 'internal',
      entityTypes: [event.entityType],
      syncMode: 'incremental' as const,
      direction: 'source_to_target' as const,
      isActive: true,
      status: 'idle' as const
    };

    const syncJob = await this.syncEngineService.createSyncJob(syncJobConfig);
    return syncJob.id;
  }

  private verifySignature(payload: any, signature: string | undefined, secret: string, config: WebhookConfiguration): boolean {
    if (!signature) return false;

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    const fullExpectedSignature = config.signaturePrefix + expectedSignature;
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(fullExpectedSignature)
    );
  }

  private async checkRateLimit(endpointId: string, headers: Record<string, string>): Promise<boolean> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return false;

    const config = endpoint.configuration.rateLimiting;
    const clientIp = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown';
    const key = `${endpointId}:${clientIp}`;

    if (!this.rateLimiters.has(endpointId)) {
      this.rateLimiters.set(endpointId, new Map());
    }

    const endpointLimiter = this.rateLimiters.get(endpointId)!;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean old entries
    for (const [k, timestamp] of endpointLimiter.entries()) {
      if (timestamp < windowStart) {
        endpointLimiter.delete(k);
      }
    }

    // Count requests in current window
    const requestCount = Array.from(endpointLimiter.values())
      .filter(timestamp => timestamp >= windowStart).length;

    if (requestCount >= config.maxRequests) {
      return false;
    }

    endpointLimiter.set(`${key}:${now}`, now);
    return true;
  }

  private moveWebhookToQueue(webhook: IncomingWebhook, targetQueue: keyof WebhookQueue): void {
    // Remove from current queues
    for (const queueName of ['pending', 'processing', 'failed', 'completed'] as const) {
      const index = this.webhookQueue[queueName].findIndex(w => w.id === webhook.id);
      if (index !== -1) {
        this.webhookQueue[queueName].splice(index, 1);
        break;
      }
    }

    // Add to target queue
    this.webhookQueue[targetQueue].push(webhook);

    // Maintain queue size limits
    if (this.webhookQueue[targetQueue].length > 1000) {
      this.webhookQueue[targetQueue] = this.webhookQueue[targetQueue]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 1000);
    }
  }

  private async updateEndpointStats(endpointId: string, webhook: IncomingWebhook): Promise<void> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return;

    const stats = endpoint.stats;

    if (webhook.status === 'completed') {
      stats.totalProcessed++;
    } else if (webhook.status === 'failed') {
      stats.totalFailed++;
    }

    if (webhook.processingTime) {
      stats.averageProcessingTime = (stats.averageProcessingTime * (stats.totalProcessed - 1) + webhook.processingTime) / stats.totalProcessed;
    }

    stats.errorRate = stats.totalFailed / stats.totalReceived;
    stats.lastProcessedAt = new Date();

    await this.saveEndpoint(endpointId, endpoint);
  }

  private getDefaultConfiguration(crmType: string): WebhookConfiguration {
    const baseConfig = {
      timestampTolerance: 300000, // 5 minutes
      retryPolicy: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        retryableErrors: ['timeout', 'network', 'server_error']
      },
      rateLimiting: {
        maxRequests: 100,
        windowMs: 60000, // 1 minute
        skipSuccessfulRequests: false
      }
    };

    switch (crmType) {
      case 'salesforce':
        return {
          ...baseConfig,
          signatureHeader: 'x-salesforce-signature',
          signaturePrefix: 'sha256='
        };
      case 'hubspot':
        return {
          ...baseConfig,
          signatureHeader: 'x-hubspot-signature',
          signaturePrefix: 'sha256='
        };
      case 'pipedrive':
        return {
          ...baseConfig,
          signatureHeader: 'x-pipedrive-signature',
          signaturePrefix: 'sha256='
        };
      default:
        return {
          ...baseConfig,
          signatureHeader: 'x-webhook-signature',
          signaturePrefix: 'sha256='
        };
    }
  }

  // =============================================================================
  // METRICS & MONITORING
  // =============================================================================

  async calculateMetrics(): Promise<WebhookMetrics> {
    const totalEndpoints = this.endpoints.size;
    const activeEndpoints = Array.from(this.endpoints.values()).filter(e => e.isActive).length;

    const allWebhooks = [
      ...this.webhookQueue.pending,
      ...this.webhookQueue.processing,
      ...this.webhookQueue.failed,
      ...this.webhookQueue.completed
    ];

    const totalReceived = allWebhooks.length;
    const totalProcessed = this.webhookQueue.completed.length;
    const totalFailed = this.webhookQueue.failed.length;

    const processingTimes = allWebhooks
      .filter(w => w.processingTime)
      .map(w => w.processingTime!);

    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0;

    const errorRate = totalReceived > 0 ? totalFailed / totalReceived : 0;
    const throughput = totalProcessed; // Simplified - would calculate per time period
    const queueSize = this.webhookQueue.pending.length + this.webhookQueue.processing.length;

    this.metrics = {
      totalEndpoints,
      activeEndpoints,
      totalWebhooksReceived: totalReceived,
      totalWebhooksProcessed: totalProcessed,
      totalWebhooksFailed: totalFailed,
      averageProcessingTime,
      errorRate,
      throughput,
      queueSize,
      processingCapacity: this.maxConcurrentProcessing,
      lastCalculated: new Date()
    };

    // Cache metrics in Redis
    const redis = redisManager.getClient();
    await redis.setex('webhook_processing_metrics', 300, JSON.stringify(this.metrics)); // 5 minute TTL

    return this.metrics;
  }

  getMetrics(): WebhookMetrics | null {
    return this.metrics;
  }

  getWebhookQueue(): WebhookQueue {
    return this.webhookQueue;
  }

  getWebhook(webhookId: string): IncomingWebhook | null {
    for (const queue of Object.values(this.webhookQueue)) {
      const webhook = queue.find((w: IncomingWebhook) => w.id === webhookId);
      if (webhook) return webhook;
    }
    return null;
  }

  // =============================================================================
  // HEALTH & STATUS
  // =============================================================================

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const metrics = await this.calculateMetrics();
    const queueHealth = this.webhookQueue.pending.length < this.maxQueueSize * 0.8;
    const errorRateHealth = metrics.errorRate < 0.1; // Less than 10% error rate
    const processingHealth = this.webhookQueue.processing.length < this.maxConcurrentProcessing;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (!queueHealth || !errorRateHealth || !processingHealth) {
      status = metrics.errorRate > 0.5 || this.webhookQueue.pending.length >= this.maxQueueSize
        ? 'unhealthy'
        : 'degraded';
    }

    return {
      status,
      details: {
        queueHealth,
        errorRateHealth,
        processingHealth,
        queueSize: this.webhookQueue.pending.length,
        maxQueueSize: this.maxQueueSize,
        errorRate: metrics.errorRate,
        activeProcessing: this.webhookQueue.processing.length,
        maxConcurrentProcessing: this.maxConcurrentProcessing,
        totalEndpoints: metrics.totalEndpoints,
        activeEndpoints: metrics.activeEndpoints
      }
    };
  }

  // =============================================================================
  // PERSISTENCE & STORAGE
  // =============================================================================

  private async saveEndpoint(endpointId: string, endpoint: WebhookEndpoint): Promise<void> {
    const redis = redisManager.getClient();
    await redis.hset('webhook_endpoints', endpointId, JSON.stringify(endpoint));
  }

  private async loadEndpoints(): Promise<void> {
    try {
      const redis = redisManager.getClient();
      const endpointData = await redis.hgetall('webhook_endpoints');

      for (const [endpointId, data] of Object.entries(endpointData)) {
        try {
          const endpoint = JSON.parse(data);
          endpoint.createdAt = new Date(endpoint.createdAt);
          if (endpoint.lastUsed) {
            endpoint.lastUsed = new Date(endpoint.lastUsed);
          }
          this.endpoints.set(endpointId, endpoint);
        } catch (error) {
          console.error(`Error parsing endpoint data for ${endpointId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading webhook endpoints:', error);
    }
  }

  private async removeEndpoint(endpointId: string): Promise<void> {
    const redis = redisManager.getClient();
    await redis.hdel('webhook_endpoints', endpointId);
  }

  private async saveWebhook(webhook: IncomingWebhook): Promise<void> {
    const redis = redisManager.getClient();
    await redis.setex(`webhook:${webhook.id}`, 86400, JSON.stringify(webhook)); // 24 hour TTL
  }

  private async startProcessing(): Promise<void> {
    this.processingInterval = setInterval(() => {
      this.processWebhookQueue().catch(error => {
        console.error('Error processing webhook queue:', error);
      });
    }, 1000); // Process every second
  }

  private async startMetricsCollection(): Promise<void> {
    this.metricsInterval = setInterval(() => {
      this.calculateMetrics().catch(error => {
        console.error('Error calculating webhook metrics:', error);
      });
    }, 30000); // Calculate metrics every 30 seconds
  }

  // =============================================================================
  // MOCK DATA GENERATION
  // =============================================================================

  private async generateMockData(): Promise<void> {
    // Create sample webhook endpoints
    const crmTypes: Array<'salesforce' | 'hubspot' | 'pipedrive' | 'zoho'> = ['salesforce', 'hubspot', 'pipedrive', 'zoho'];

    for (const crmType of crmTypes) {
      await this.createEndpoint({
        name: `${crmType.charAt(0).toUpperCase() + crmType.slice(1)} Webhook`,
        crmType,
        crmInstanceId: `${crmType}_prod`,
        events: ['contact.created', 'contact.updated', 'company.created', 'company.updated', 'deal.created', 'deal.updated'],
        isActive: true
      });
    }

    // Generate sample webhook processing history
    for (let i = 0; i < 10; i++) {
      const endpointId = Array.from(this.endpoints.keys())[i % this.endpoints.size];
      const webhook: IncomingWebhook = {
        id: this.generateId(),
        endpointId,
        event: ['contact.created', 'contact.updated', 'company.created', 'deal.updated'][i % 4],
        payload: this.generateMockPayload(),
        headers: {
          'content-type': 'application/json',
          'x-webhook-signature': 'sha256=mock_signature'
        },
        timestamp: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24 hours
        status: ['completed', 'failed', 'completed', 'completed'][i % 4] as any,
        processingAttempts: 1,
        processingTime: Math.floor(Math.random() * 1000) + 100
      };

      this.webhookQueue[webhook.status === 'completed' ? 'completed' : 'failed'].push(webhook);
      await this.saveWebhook(webhook);
    }

    console.log('📊 Generated mock webhook processing data');
  }

  private generateMockPayload(): any {
    return {
      id: `record_${Math.random().toString(36).substr(2, 9)}`,
      type: 'contact',
      properties: {
        email: `user${Math.floor(Math.random() * 1000)}@example.com`,
        firstName: `First${Math.floor(Math.random() * 100)}`,
        lastName: `Last${Math.floor(Math.random() * 100)}`,
        company: `Company ${Math.floor(Math.random() * 50)}`
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // =============================================================================
  // CLEANUP
  // =============================================================================

  async shutdown(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    console.log('🔗 Webhook Processing Service shut down');
  }
}
