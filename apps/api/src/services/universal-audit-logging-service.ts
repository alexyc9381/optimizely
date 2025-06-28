import crypto from 'crypto';
import { EventEmitter } from 'events';
import { redisManager } from './redis-client';

// =============================================================================
// CORE INTERFACES
// =============================================================================

export interface AuditRecord {
  id: string;
  timestamp: Date;
  category: 'sync' | 'webhook' | 'error' | 'authentication' | 'authorization' | 'data_access' | 'configuration' | 'system';
  action: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  sessionId?: string;
  serviceId: string;
  operationId?: string;
  source: AuditSource;
  target?: AuditTarget;
  changes?: AuditChange[];
  metadata: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'success' | 'failure' | 'partial';
  duration?: number;
  checksum: string;
  retentionPolicy: string;
  complianceFlags: string[];
}

export interface AuditSource {
  type: 'service' | 'user' | 'system' | 'external';
  id: string;
  name: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export interface AuditTarget {
  type: 'crm' | 'database' | 'cache' | 'file' | 'api' | 'webhook';
  id: string;
  name: string;
  endpoint?: string;
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  operation: 'create' | 'update' | 'delete' | 'read';
  dataType: string;
}

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  serviceId?: string;
  severity?: string;
  status?: string;
  complianceFlags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditQuery {
  filters: AuditFilter;
  searchTerm?: string;
  searchFields?: string[];
  aggregations?: AuditAggregation[];
}

export interface AuditAggregation {
  field: string;
  type: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'terms';
  interval?: string;
}

export interface RetentionPolicy {
  id: string;
  name: string;
  category: string;
  retentionDays: number;
  archiveAfterDays?: number;
  compressionEnabled: boolean;
  encryptionRequired: boolean;
  complianceRequirements: string[];
  autoCleanup: boolean;
}

export interface ComplianceReport {
  id: string;
  name: string;
  type: 'gdpr' | 'sox' | 'hipaa' | 'pci' | 'custom';
  period: {
    start: Date;
    end: Date;
  };
  filters: AuditFilter;
  metrics: ComplianceMetrics;
  violations: ComplianceViolation[];
  generatedAt: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface ComplianceMetrics {
  totalRecords: number;
  dataAccessEvents: number;
  authenticationEvents: number;
  dataModifications: number;
  errorEvents: number;
  securityViolations: number;
  averageResponseTime: number;
}

export interface ComplianceViolation {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  auditRecordId: string;
  detectedAt: Date;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
}

export interface AuditMetrics {
  totalRecords: number;
  recordsByCategory: Record<string, number>;
  recordsBySeverity: Record<string, number>;
  recordsByStatus: Record<string, number>;
  averageProcessingTime: number;
  storageUsed: number;
  retentionCompliance: number;
  lastCalculated: Date;
}

// =============================================================================
// UNIVERSAL AUDIT LOGGING SERVICE
// =============================================================================

export default class UniversalAuditLoggingService extends EventEmitter {
  private auditRecords: Map<string, AuditRecord> = new Map();
  private retentionPolicies: Map<string, RetentionPolicy> = new Map();
  private complianceReports: Map<string, ComplianceReport> = new Map();
  private auditMetrics: AuditMetrics | null = null;
  private isInitialized = false;
  private processingQueue: AuditRecord[] = [];
  private batchSize = 100;
  private flushInterval = 5000; // 5 seconds
  private processingInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.initializeService();
  }

  // =============================================================================
  // INITIALIZATION & SETUP
  // =============================================================================

  private async initializeService(): Promise<void> {
    try {
      await this.loadConfiguration();
      await this.initializeRetentionPolicies();
      await this.startProcessing();
      await this.startMetricsCollection();
      await this.startCleanupProcess();
      await this.generateMockData();

      this.isInitialized = true;
      this.emit('service_initialized', {
        timestamp: Date.now(),
        retentionPolicies: this.retentionPolicies.size
      });

      console.log('📋 Universal Audit Logging Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Universal Audit Logging Service:', error);
      throw error;
    }
  }

  private async loadConfiguration(): Promise<void> {
    const redis = redisManager.getClient();

    // Load audit records
    const recordsData = await redis.get('audit:records');
    if (recordsData) {
      const records = JSON.parse(recordsData);
      records.forEach((record: any) => {
        this.auditRecords.set(record.id, {
          ...record,
          timestamp: new Date(record.timestamp)
        });
      });
    }

    // Load retention policies
    const policiesData = await redis.get('audit:retention_policies');
    if (policiesData) {
      const policies = JSON.parse(policiesData);
      policies.forEach((policy: any) => {
        this.retentionPolicies.set(policy.id, policy);
      });
    }
  }

  private async initializeRetentionPolicies(): Promise<void> {
    const defaultPolicies: RetentionPolicy[] = [
      {
        id: 'sync_operations',
        name: 'CRM Sync Operations',
        category: 'sync',
        retentionDays: 2555, // 7 years for financial compliance
        archiveAfterDays: 365,
        compressionEnabled: true,
        encryptionRequired: true,
        complianceRequirements: ['SOX', 'GDPR'],
        autoCleanup: true
      },
      {
        id: 'webhook_events',
        name: 'Webhook Processing Events',
        category: 'webhook',
        retentionDays: 1095, // 3 years
        archiveAfterDays: 180,
        compressionEnabled: true,
        encryptionRequired: false,
        complianceRequirements: ['GDPR'],
        autoCleanup: true
      },
      {
        id: 'error_events',
        name: 'Error and Exception Events',
        category: 'error',
        retentionDays: 1825, // 5 years
        archiveAfterDays: 365,
        compressionEnabled: true,
        encryptionRequired: false,
        complianceRequirements: ['SOX'],
        autoCleanup: true
      },
      {
        id: 'authentication_events',
        name: 'Authentication and Authorization',
        category: 'authentication',
        retentionDays: 2190, // 6 years
        archiveAfterDays: 90,
        compressionEnabled: true,
        encryptionRequired: true,
        complianceRequirements: ['SOX', 'GDPR', 'HIPAA'],
        autoCleanup: true
      },
      {
        id: 'data_access_events',
        name: 'Data Access and Modifications',
        category: 'data_access',
        retentionDays: 2555, // 7 years
        archiveAfterDays: 365,
        compressionEnabled: true,
        encryptionRequired: true,
        complianceRequirements: ['SOX', 'GDPR', 'HIPAA'],
        autoCleanup: true
      }
    ];

    for (const policy of defaultPolicies) {
      if (!this.retentionPolicies.has(policy.id)) {
        this.retentionPolicies.set(policy.id, policy);
      }
    }

    await this.persistRetentionPolicies();
  }

  // =============================================================================
  // AUDIT RECORD MANAGEMENT
  // =============================================================================

  async logAuditEvent(eventData: Partial<AuditRecord>): Promise<string> {
    const auditRecord: AuditRecord = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      category: eventData.category || 'system',
      action: eventData.action || 'unknown',
      entityType: eventData.entityType,
      entityId: eventData.entityId,
      userId: eventData.userId,
      sessionId: eventData.sessionId,
      serviceId: eventData.serviceId || 'unknown',
      operationId: eventData.operationId,
      source: eventData.source || {
        type: 'system',
        id: 'universal-audit-service',
        name: 'Universal Audit Logging Service'
      },
      target: eventData.target,
      changes: eventData.changes || [],
      metadata: eventData.metadata || {},
      severity: eventData.severity || 'info',
      status: eventData.status || 'success',
      duration: eventData.duration,
      checksum: '',
      retentionPolicy: this.getRetentionPolicyId(eventData.category || 'system'),
      complianceFlags: eventData.complianceFlags || []
    };

    // Generate checksum for integrity
    auditRecord.checksum = this.generateChecksum(auditRecord);

    // Add to processing queue
    this.processingQueue.push(auditRecord);

    // Emit event for real-time subscribers
    this.emit('audit_event_logged', {
      auditRecordId: auditRecord.id,
      category: auditRecord.category,
      action: auditRecord.action,
      timestamp: auditRecord.timestamp
    });

    return auditRecord.id;
  }

  async getAuditRecords(query: AuditQuery): Promise<{
    records: AuditRecord[];
    total: number;
    aggregations?: Record<string, any>;
  }> {
    let filteredRecords = Array.from(this.auditRecords.values());

    // Apply filters
    if (query.filters.startDate) {
      filteredRecords = filteredRecords.filter(r => r.timestamp >= query.filters.startDate!);
    }
    if (query.filters.endDate) {
      filteredRecords = filteredRecords.filter(r => r.timestamp <= query.filters.endDate!);
    }
    if (query.filters.category) {
      filteredRecords = filteredRecords.filter(r => r.category === query.filters.category);
    }
    if (query.filters.action) {
      filteredRecords = filteredRecords.filter(r => r.action.includes(query.filters.action!));
    }
    if (query.filters.entityType) {
      filteredRecords = filteredRecords.filter(r => r.entityType === query.filters.entityType);
    }
    if (query.filters.entityId) {
      filteredRecords = filteredRecords.filter(r => r.entityId === query.filters.entityId);
    }
    if (query.filters.userId) {
      filteredRecords = filteredRecords.filter(r => r.userId === query.filters.userId);
    }
    if (query.filters.serviceId) {
      filteredRecords = filteredRecords.filter(r => r.serviceId === query.filters.serviceId);
    }
    if (query.filters.severity) {
      filteredRecords = filteredRecords.filter(r => r.severity === query.filters.severity);
    }
    if (query.filters.status) {
      filteredRecords = filteredRecords.filter(r => r.status === query.filters.status);
    }

    // Apply search term
    if (query.searchTerm && query.searchFields) {
      const searchTerm = query.searchTerm.toLowerCase();
      filteredRecords = filteredRecords.filter(record => {
        return query.searchFields!.some(field => {
          const value = this.getNestedProperty(record, field);
          return value && value.toString().toLowerCase().includes(searchTerm);
        });
      });
    }

    const total = filteredRecords.length;

    // Apply sorting
    if (query.filters.sortBy) {
      filteredRecords.sort((a, b) => {
        const aValue = this.getNestedProperty(a, query.filters.sortBy!);
        const bValue = this.getNestedProperty(b, query.filters.sortBy!);

        if (query.filters.sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });
    }

    // Apply pagination
    const offset = query.filters.offset || 0;
    const limit = query.filters.limit || 100;
    const paginatedRecords = filteredRecords.slice(offset, offset + limit);

    // Calculate aggregations if requested
    let aggregations: Record<string, any> = {};
    if (query.aggregations) {
      aggregations = this.calculateAggregations(filteredRecords, query.aggregations);
    }

    return {
      records: paginatedRecords,
      total,
      aggregations: Object.keys(aggregations).length > 0 ? aggregations : undefined
    };
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChecksum(record: AuditRecord): string {
    const data = {
      timestamp: record.timestamp.toISOString(),
      category: record.category,
      action: record.action,
      entityType: record.entityType,
      entityId: record.entityId,
      serviceId: record.serviceId,
      source: record.source,
      target: record.target,
      changes: record.changes,
      metadata: record.metadata
    };

    return crypto.createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  private getRetentionPolicyId(category: string): string {
    const policyMap: Record<string, string> = {
      sync: 'sync_operations',
      webhook: 'webhook_events',
      error: 'error_events',
      authentication: 'authentication_events',
      authorization: 'authentication_events',
      data_access: 'data_access_events',
      configuration: 'sync_operations',
      system: 'error_events'
    };

    return policyMap[category] || 'error_events';
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private calculateAggregations(records: AuditRecord[], aggregations: AuditAggregation[]): Record<string, any> {
    const results: Record<string, any> = {};

    for (const agg of aggregations) {
      if (agg.type === 'count') {
        results[`${agg.field}_count`] = records.length;
      } else if (agg.type === 'terms') {
        const terms: Record<string, number> = {};
        records.forEach(record => {
          const value = this.getNestedProperty(record, agg.field);
          if (value) {
            terms[value] = (terms[value] || 0) + 1;
          }
        });
        results[`${agg.field}_terms`] = terms;
      }
    }

    return results;
  }

  private async persistData(): Promise<void> {
    const redis = redisManager.getClient();

    // Persist audit records (only recent ones in memory)
    const recentRecords = Array.from(this.auditRecords.values())
      .filter(record => {
        const daysDiff = (Date.now() - record.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30; // Keep 30 days in memory
      });

    await redis.setex('audit:records', 3600, JSON.stringify(recentRecords));
  }

  private async persistRetentionPolicies(): Promise<void> {
    const redis = redisManager.getClient();
    const policies = Array.from(this.retentionPolicies.values());
    await redis.setex('audit:retention_policies', 3600, JSON.stringify(policies));
  }

  private async startProcessing(): Promise<void> {
    this.processingInterval = setInterval(async () => {
      await this.processBatch();
    }, this.flushInterval);
  }

  private async processBatch(): Promise<void> {
    if (this.processingQueue.length === 0) return;

    const batch = this.processingQueue.splice(0, this.batchSize);

    for (const record of batch) {
      this.auditRecords.set(record.id, record);
    }

    await this.persistData();

    this.emit('batch_processed', {
      count: batch.length,
      timestamp: Date.now()
    });
  }

  private async startMetricsCollection(): Promise<void> {
    this.metricsInterval = setInterval(async () => {
      await this.calculateMetrics();
    }, 30000); // Calculate every 30 seconds
  }

  private async calculateMetrics(): Promise<void> {
    const records = Array.from(this.auditRecords.values());

    const recordsByCategory: Record<string, number> = {};
    const recordsBySeverity: Record<string, number> = {};
    const recordsByStatus: Record<string, number> = {};
    let totalProcessingTime = 0;
    let recordsWithDuration = 0;

    records.forEach(record => {
      recordsByCategory[record.category] = (recordsByCategory[record.category] || 0) + 1;
      recordsBySeverity[record.severity] = (recordsBySeverity[record.severity] || 0) + 1;
      recordsByStatus[record.status] = (recordsByStatus[record.status] || 0) + 1;

      if (record.duration) {
        totalProcessingTime += record.duration;
        recordsWithDuration++;
      }
    });

    this.auditMetrics = {
      totalRecords: records.length,
      recordsByCategory,
      recordsBySeverity,
      recordsByStatus,
      averageProcessingTime: recordsWithDuration > 0 ? totalProcessingTime / recordsWithDuration : 0,
      storageUsed: JSON.stringify(records).length, // Approximate storage usage
      retentionCompliance: this.calculateRetentionCompliance(),
      lastCalculated: new Date()
    };

    const redis = redisManager.getClient();
    await redis.setex('audit:metrics', 300, JSON.stringify(this.auditMetrics));
  }

  private calculateRetentionCompliance(): number {
    const records = Array.from(this.auditRecords.values());
    let compliantRecords = 0;

    records.forEach(record => {
      const policy = this.retentionPolicies.get(record.retentionPolicy);
      if (policy) {
        const daysSinceCreation = (Date.now() - record.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation <= policy.retentionDays) {
          compliantRecords++;
        }
      }
    });

    return records.length > 0 ? (compliantRecords / records.length) * 100 : 100;
  }

  private async startCleanupProcess(): Promise<void> {
    this.cleanupInterval = setInterval(async () => {
      await this.performCleanup();
    }, 24 * 60 * 60 * 1000); // Run daily
  }

  private async performCleanup(): Promise<void> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [recordId, record] of this.auditRecords.entries()) {
      const policy = this.retentionPolicies.get(record.retentionPolicy);
      if (policy && policy.autoCleanup) {
        const daysSinceCreation = (now - record.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation > policy.retentionDays) {
          this.auditRecords.delete(recordId);
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      await this.persistData();
      this.emit('cleanup_completed', {
        cleanedRecords: cleanedCount,
        timestamp: now
      });
    }
  }

  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================

  getMetrics(): AuditMetrics | null {
    return this.auditMetrics;
  }

  getRetentionPolicies(): RetentionPolicy[] {
    return Array.from(this.retentionPolicies.values());
  }

  async getHealthStatus(): Promise<{ status: string; details: Record<string, any> }> {
    const queueSize = this.processingQueue.length;
    const totalRecords = this.auditRecords.size;
    const metrics = this.auditMetrics;

    const status = queueSize > 1000 ? 'unhealthy' : queueSize > 500 ? 'degraded' : 'healthy';

    return {
      status,
      details: {
        initialized: this.isInitialized,
        queueSize,
        totalRecords,
        retentionPolicies: this.retentionPolicies.size,
        metrics: metrics ? {
          totalRecords: metrics.totalRecords,
          averageProcessingTime: metrics.averageProcessingTime,
          retentionCompliance: metrics.retentionCompliance
        } : null,
        lastMetricsUpdate: metrics?.lastCalculated
      }
    };
  }

  private async generateMockData(): Promise<void> {
    // Generate sample audit records for testing
    const sampleEvents = [
      {
        category: 'sync' as const,
        action: 'crm_sync_completed',
        serviceId: 'sync-engine',
        entityType: 'contact',
        entityId: 'contact_123',
        severity: 'info' as const,
        status: 'success' as const,
        metadata: { recordsProcessed: 150, duration: 5000 }
      },
      {
        category: 'webhook' as const,
        action: 'webhook_received',
        serviceId: 'webhook-processor',
        entityType: 'deal',
        entityId: 'deal_456',
        severity: 'info' as const,
        status: 'success' as const,
        metadata: { crmType: 'salesforce', eventType: 'deal.updated' }
      },
      {
        category: 'error' as const,
        action: 'api_error_occurred',
        serviceId: 'universal-api',
        severity: 'error' as const,
        status: 'failure' as const,
        metadata: { errorCode: 'RATE_LIMIT_EXCEEDED', retryCount: 3 }
      }
    ];

    for (const event of sampleEvents) {
      await this.logAuditEvent(event);
    }

    // Process the queue immediately for mock data
    await this.processBatch();
  }

  async shutdown(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Process any remaining items in queue
    await this.processBatch();
    await this.persistData();
  }
}
