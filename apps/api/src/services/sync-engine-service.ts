import { EventEmitter } from 'events';
import { redisManager } from './redis-client';

// =============================================================================
// CORE INTERFACES
// =============================================================================

export interface SyncEntity {
  id: string;
  type: 'contact' | 'company' | 'deal' | 'task' | 'note' | 'custom';
  sourceId: string;
  targetId?: string;
  sourceSystem: string;
  targetSystem: string;
  data: Record<string, any>;
  lastModified: Date;
  version: number;
  checksum: string;
  metadata?: Record<string, any>;
}

export interface SyncJob {
  id: string;
  name: string;
  sourceSystem: string;
  targetSystem: string;
  entityTypes: string[];
  syncMode: 'full' | 'incremental' | 'delta';
  direction: 'bidirectional' | 'source_to_target' | 'target_to_source';
  isActive: boolean;
  lastRun?: Date;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncExecution {
  id: string;
  jobId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  direction: 'bidirectional' | 'source_to_target' | 'target_to_source';
  syncMode: 'full' | 'incremental' | 'delta';
  statistics: SyncStatistics;
  errors: SyncError[];
  conflicts: string[];
  metadata: Record<string, any>;
}

export interface SyncStatistics {
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  skippedRecords: number;
  conflictRecords: number;
  createdRecords: number;
  updatedRecords: number;
  deletedRecords: number;
  processingTime: number;
  throughput: number;
}

export interface SyncError {
  id: string;
  entityId: string;
  entityType: string;
  errorType: 'validation' | 'transformation' | 'network' | 'permission' | 'system';
  errorCode: string;
  errorMessage: string;
  timestamp: Date;
  isRetryable: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface SyncConflict {
  id: string;
  entityId: string;
  entityType: string;
  sourceSystem: string;
  targetSystem: string;
  conflictType: 'field_mismatch' | 'version_conflict' | 'delete_conflict' | 'duplicate_record';
  sourceData: Record<string, any>;
  targetData: Record<string, any>;
  conflictFields: string[];
  detectedAt: Date;
  resolvedAt?: Date;
  status: 'pending' | 'resolved' | 'ignored';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface SyncMapping {
  id: string;
  sourceSystem: string;
  targetSystem: string;
  entityType: string;
  fieldMappings: FieldMapping[];
  transformations: DataTransformation[];
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  isRequired: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  defaultValue?: any;
}

export interface DataTransformation {
  id: string;
  name: string;
  type: 'format' | 'calculate' | 'lookup' | 'conditional' | 'custom';
  sourceFields: string[];
  targetField: string;
  rules: TransformationRule[];
  isActive: boolean;
}

export interface TransformationRule {
  condition?: string;
  operation: string;
  parameters: Record<string, any>;
  priority: number;
}

export interface SyncMetrics {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalConflicts: number;
  pendingConflicts: number;
  resolvedConflicts: number;
  averageExecutionTime: number;
  averageThroughput: number;
  systemHealth: number;
  lastCalculated: Date;
}

export interface SyncFilters {
  jobId?: string;
  status?: string;
  sourceSystem?: string;
  targetSystem?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  hasConflicts?: boolean;
  hasErrors?: boolean;
}

// =============================================================================
// SYNC ENGINE SERVICE
// =============================================================================

export default class SyncEngineService extends EventEmitter {
  private syncJobs: Map<string, SyncJob> = new Map();
  private syncMappings: Map<string, SyncMapping> = new Map();
  private activeExecutions: Map<string, SyncExecution> = new Map();
  private conflicts: Map<string, SyncConflict> = new Map();
  private metrics: SyncMetrics | null = null;
  private isInitialized = false;

  constructor() {
    super();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadConfiguration();
      await this.generateMockData();
      await this.calculateMetrics();
      this.startMetricsCalculation();
      this.isInitialized = true;
      this.emit('service_initialized');
    } catch (error) {
      console.error('Failed to initialize SyncEngineService:', error);
      throw error;
    }
  }

  private async loadConfiguration(): Promise<void> {
    const redis = redisManager.getClient();

    // Load sync jobs
    const jobsData = await redis.get('sync:jobs');
    if (jobsData) {
      const jobs = JSON.parse(jobsData);
      jobs.forEach((job: any) => {
        this.syncJobs.set(job.id, {
          ...job,
          createdAt: new Date(job.createdAt),
          updatedAt: new Date(job.updatedAt),
          lastRun: job.lastRun ? new Date(job.lastRun) : undefined
        });
      });
    }

    // Load sync mappings
    const mappingsData = await redis.get('sync:mappings');
    if (mappingsData) {
      const mappings = JSON.parse(mappingsData);
      mappings.forEach((mapping: any) => {
        this.syncMappings.set(mapping.id, {
          ...mapping,
          createdAt: new Date(mapping.createdAt),
          updatedAt: new Date(mapping.updatedAt)
        });
      });
    }

    // Load conflicts
    const conflictsData = await redis.get('sync:conflicts');
    if (conflictsData) {
      const conflicts = JSON.parse(conflictsData);
      conflicts.forEach((conflict: any) => {
        this.conflicts.set(conflict.id, {
          ...conflict,
          detectedAt: new Date(conflict.detectedAt),
          resolvedAt: conflict.resolvedAt ? new Date(conflict.resolvedAt) : undefined
        });
      });
    }
  }

  private async persistData(): Promise<void> {
    const redis = redisManager.getClient();

    // Persist sync jobs
    const jobs = Array.from(this.syncJobs.values());
    await redis.setex('sync:jobs', 3600, JSON.stringify(jobs));

    // Persist sync mappings
    const mappings = Array.from(this.syncMappings.values());
    await redis.setex('sync:mappings', 3600, JSON.stringify(mappings));

    // Persist conflicts
    const conflicts = Array.from(this.conflicts.values());
    await redis.setex('sync:conflicts', 3600, JSON.stringify(conflicts));
  }

  // =============================================================================
  // SYNC JOB MANAGEMENT
  // =============================================================================

  async createSyncJob(jobData: Omit<SyncJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<SyncJob> {
    const job: SyncJob = {
      ...jobData,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.syncJobs.set(job.id, job);
    await this.persistData();

    this.emit('job_created', job);
    return job;
  }

  async updateSyncJob(jobId: string, updates: Partial<SyncJob>): Promise<SyncJob | null> {
    const job = this.syncJobs.get(jobId);
    if (!job) return null;

    const updatedJob = {
      ...job,
      ...updates,
      updatedAt: new Date()
    };

    this.syncJobs.set(jobId, updatedJob);
    await this.persistData();

    this.emit('job_updated', updatedJob);
    return updatedJob;
  }

  getSyncJob(jobId: string): SyncJob | null {
    return this.syncJobs.get(jobId) || null;
  }

  getSyncJobs(filters?: SyncFilters): SyncJob[] {
    let jobs = Array.from(this.syncJobs.values());

    if (filters) {
      if (filters.status) {
        jobs = jobs.filter(job => job.status === filters.status);
      }
      if (filters.sourceSystem) {
        jobs = jobs.filter(job => job.sourceSystem === filters.sourceSystem);
      }
      if (filters.targetSystem) {
        jobs = jobs.filter(job => job.targetSystem === filters.targetSystem);
      }
    }

    return jobs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async deleteSyncJob(jobId: string): Promise<boolean> {
    const job = this.syncJobs.get(jobId);
    if (!job) return false;

    // Cancel any active executions
    const activeExecution = Array.from(this.activeExecutions.values())
      .find(exec => exec.jobId === jobId && exec.status === 'running');

    if (activeExecution) {
      await this.cancelExecution(activeExecution.id);
    }

    this.syncJobs.delete(jobId);
    await this.persistData();

    this.emit('job_deleted', { jobId });
    return true;
  }

  // =============================================================================
  // SYNC EXECUTION
  // =============================================================================

  async executeSyncJob(jobId: string, options?: {
    syncMode?: 'full' | 'incremental' | 'delta';
    direction?: 'bidirectional' | 'source_to_target' | 'target_to_source';
  }): Promise<SyncExecution> {
    const job = this.syncJobs.get(jobId);
    if (!job) {
      throw new Error(`Sync job ${jobId} not found`);
    }

    if (job.status === 'running') {
      throw new Error(`Sync job ${jobId} is already running`);
    }

    const execution: SyncExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      jobId,
      startTime: new Date(),
      status: 'running',
      direction: options?.direction || job.direction,
      syncMode: options?.syncMode || job.syncMode,
      statistics: {
        totalRecords: 0,
        processedRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        skippedRecords: 0,
        conflictRecords: 0,
        createdRecords: 0,
        updatedRecords: 0,
        deletedRecords: 0,
        processingTime: 0,
        throughput: 0
      },
      errors: [],
      conflicts: [],
      metadata: {}
    };

    this.activeExecutions.set(execution.id, execution);

    // Update job status
    await this.updateSyncJob(jobId, {
      status: 'running',
      lastRun: new Date()
    });

    this.emit('execution_started', execution);

    try {
      // Simulate sync execution
      await this.performSync(execution, job);

      execution.endTime = new Date();
      execution.status = 'completed';
      execution.statistics.processingTime = execution.endTime.getTime() - execution.startTime.getTime();
      execution.statistics.throughput = execution.statistics.totalRecords / (execution.statistics.processingTime / 1000);

      await this.updateSyncJob(jobId, { status: 'completed' });

      this.emit('execution_completed', execution);
    } catch (error) {
      execution.endTime = new Date();
      execution.status = 'failed';
      execution.errors.push({
        id: `error_${Date.now()}`,
        entityId: '',
        entityType: '',
        errorType: 'system',
        errorCode: 'EXECUTION_FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        isRetryable: true,
        retryCount: 0,
        maxRetries: 3
      });

      await this.updateSyncJob(jobId, { status: 'failed' });

      this.emit('execution_failed', execution);
    } finally {
      this.activeExecutions.delete(execution.id);
    }

    return execution;
  }

  private async performSync(execution: SyncExecution, job: SyncJob): Promise<void> {
    // Get relevant mappings
    const mappings = this.getSyncMappings(job.sourceSystem, job.targetSystem);

    // Simulate processing records for each entity type
    for (const entityType of job.entityTypes) {
      const entityMappings = mappings.filter(m => m.entityType === entityType);
      if (entityMappings.length === 0) continue;

      // Simulate fetching records from source system
      const sourceRecords = await this.fetchRecordsFromSystem(job.sourceSystem, entityType, execution.syncMode);
      execution.statistics.totalRecords += sourceRecords.length;

      for (const record of sourceRecords) {
        try {
          // Detect changes
          const hasChanges = await this.detectChanges(record, job.sourceSystem, job.targetSystem);

          if (!hasChanges && execution.syncMode === 'incremental') {
            execution.statistics.skippedRecords++;
            continue;
          }

          // Transform data
          const transformedData = await this.transformData(record, entityMappings[0]);

          // Check for conflicts
          const conflicts = await this.detectConflicts(record, transformedData, job.targetSystem);

          if (conflicts.length > 0) {
            execution.statistics.conflictRecords++;
            execution.conflicts.push(...conflicts.map(c => c.id));
            continue;
          }

          // Sync to target system
          await this.syncToTargetSystem(transformedData, job.targetSystem, entityType);

          execution.statistics.successfulRecords++;
          execution.statistics.processedRecords++;

          // Simulate bidirectional sync
          if (execution.direction === 'bidirectional') {
            await this.syncFromTargetToSource(record, job);
          }

        } catch (error) {
          execution.statistics.failedRecords++;
          execution.errors.push({
            id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            entityId: record.id,
            entityType,
            errorType: 'system',
            errorCode: 'SYNC_FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
            isRetryable: true,
            retryCount: 0,
            maxRetries: 3
          });
        }
      }
    }
  }

  private async fetchRecordsFromSystem(system: string, entityType: string, syncMode: string): Promise<SyncEntity[]> {
    // Simulate fetching records from external system
    const recordCount = Math.floor(Math.random() * 100) + 10;
    const records: SyncEntity[] = [];

    for (let i = 0; i < recordCount; i++) {
      records.push({
        id: `${system}_${entityType}_${i}`,
        type: entityType as any,
        sourceId: `${system}_${entityType}_${i}`,
        sourceSystem: system,
        targetSystem: '',
        data: this.generateMockEntityData(entityType),
        lastModified: new Date(Date.now() - Math.random() * 86400000),
        version: 1,
        checksum: `checksum_${Math.random().toString(36).substr(2, 16)}`
      });
    }

    return records;
  }

  private async detectChanges(entity: SyncEntity, sourceSystem: string, targetSystem: string): Promise<boolean> {
    // Simulate change detection
    return Math.random() > 0.3; // 70% chance of changes
  }

  private async transformData(entity: SyncEntity, mapping: SyncMapping): Promise<Record<string, any>> {
    const transformedData: Record<string, any> = {};

    // Apply field mappings
    for (const fieldMapping of mapping.fieldMappings) {
      let value = entity.data[fieldMapping.sourceField];

      // Apply default value if needed
      if (value === undefined || value === null) {
        value = fieldMapping.defaultValue;
      }

      // Validate data
      if (fieldMapping.isRequired && (value === undefined || value === null)) {
        throw new Error(`Required field ${fieldMapping.sourceField} is missing`);
      }

      transformedData[fieldMapping.targetField] = value;
    }

    // Apply transformations
    for (const transformation of mapping.transformations) {
      if (!transformation.isActive) continue;

      const sourceValues = transformation.sourceFields.map(field => entity.data[field]);
      const transformedValue = await this.applyTransformation(transformation, sourceValues);
      transformedData[transformation.targetField] = transformedValue;
    }

    return transformedData;
  }

  private async applyTransformation(transformation: DataTransformation, sourceValues: any[]): Promise<any> {
    // Apply transformation rules based on type
    switch (transformation.type) {
      case 'format':
        return this.formatValue(sourceValues[0], transformation.rules[0]);
      case 'calculate':
        return this.calculateValue(sourceValues, transformation.rules[0]);
      case 'lookup':
        return this.lookupValue(sourceValues[0], transformation.rules[0]);
      case 'conditional':
        return this.conditionalValue(sourceValues, transformation.rules);
      default:
        return sourceValues[0];
    }
  }

  private formatValue(value: any, rule: TransformationRule): any {
    switch (rule.operation) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      default:
        return value;
    }
  }

  private calculateValue(values: any[], rule: TransformationRule): any {
    switch (rule.operation) {
      case 'sum':
        return values.reduce((sum, val) => sum + (Number(val) || 0), 0);
      case 'average':
        const nums = values.filter(v => !isNaN(Number(v))).map(Number);
        return nums.length > 0 ? nums.reduce((sum, val) => sum + val, 0) / nums.length : 0;
      case 'concat':
        return values.join(rule.parameters.separator || ' ');
      default:
        return values[0];
    }
  }

  private lookupValue(value: any, rule: TransformationRule): any {
    const lookupTable = rule.parameters.lookupTable || {};
    return lookupTable[value] || rule.parameters.defaultValue || value;
  }

  private conditionalValue(values: any[], rules: TransformationRule[]): any {
    for (const rule of rules) {
      if (this.evaluateCondition(values, rule.condition)) {
        return rule.parameters.value;
      }
    }
    return values[0];
  }

  private evaluateCondition(values: any[], condition?: string): boolean {
    if (!condition) return true;

    // Simple condition evaluation (in real implementation, use a proper expression parser)
    return Math.random() > 0.5;
  }

  private async detectConflicts(sourceEntity: SyncEntity, transformedData: Record<string, any>, targetSystem: string): Promise<SyncConflict[]> {
    // Simulate conflict detection
    const hasConflict = Math.random() > 0.85; // 15% chance of conflict

    if (!hasConflict) return [];

    const conflict: SyncConflict = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityId: sourceEntity.id,
      entityType: sourceEntity.type,
      sourceSystem: sourceEntity.sourceSystem,
      targetSystem,
      conflictType: 'field_mismatch',
      sourceData: sourceEntity.data,
      targetData: transformedData,
      conflictFields: ['email', 'phone'],
      detectedAt: new Date(),
      status: 'pending',
      priority: 'medium'
    };

    this.conflicts.set(conflict.id, conflict);
    await this.persistData();

    this.emit('conflict_detected', conflict);
    return [conflict];
  }

  private async syncToTargetSystem(data: Record<string, any>, targetSystem: string, entityType: string): Promise<void> {
    // Simulate syncing to target system
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }

  private async syncFromTargetToSource(entity: SyncEntity, job: SyncJob): Promise<void> {
    // Simulate bidirectional sync
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    execution.status = 'cancelled';
    execution.endTime = new Date();

    this.activeExecutions.delete(executionId);
    this.emit('execution_cancelled', execution);

    return true;
  }

  // =============================================================================
  // SYNC MAPPING MANAGEMENT
  // =============================================================================

  async createSyncMapping(mappingData: Omit<SyncMapping, 'id' | 'createdAt' | 'updatedAt'>): Promise<SyncMapping> {
    const mapping: SyncMapping = {
      ...mappingData,
      id: `mapping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.syncMappings.set(mapping.id, mapping);
    await this.persistData();

    this.emit('mapping_created', mapping);
    return mapping;
  }

  getSyncMapping(mappingId: string): SyncMapping | null {
    return this.syncMappings.get(mappingId) || null;
  }

  getSyncMappings(sourceSystem?: string, targetSystem?: string, entityType?: string): SyncMapping[] {
    let mappings = Array.from(this.syncMappings.values());

    if (sourceSystem) {
      mappings = mappings.filter(m => m.sourceSystem === sourceSystem);
    }
    if (targetSystem) {
      mappings = mappings.filter(m => m.targetSystem === targetSystem);
    }
    if (entityType) {
      mappings = mappings.filter(m => m.entityType === entityType);
    }

    return mappings.sort((a, b) => b.priority - a.priority);
  }

  // =============================================================================
  // CONFLICT RESOLUTION
  // =============================================================================

  getConflicts(filters?: { status?: string; priority?: string; entityType?: string }): SyncConflict[] {
    let conflicts = Array.from(this.conflicts.values());

    if (filters) {
      if (filters.status) {
        conflicts = conflicts.filter(c => c.status === filters.status);
      }
      if (filters.priority) {
        conflicts = conflicts.filter(c => c.priority === filters.priority);
      }
      if (filters.entityType) {
        conflicts = conflicts.filter(c => c.entityType === filters.entityType);
      }
    }

    return conflicts.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  getConflict(conflictId: string): SyncConflict | null {
    return this.conflicts.get(conflictId) || null;
  }

  // =============================================================================
  // METRICS AND MONITORING
  // =============================================================================

  private async calculateMetrics(): Promise<void> {
    const jobs = Array.from(this.syncJobs.values());
    const conflicts = Array.from(this.conflicts.values());

    this.metrics = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.status === 'running').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      totalExecutions: jobs.length * 3, // Simulate multiple executions per job
      successfulExecutions: Math.floor(jobs.length * 2.5),
      failedExecutions: Math.floor(jobs.length * 0.5),
      totalConflicts: conflicts.length,
      pendingConflicts: conflicts.filter(c => c.status === 'pending').length,
      resolvedConflicts: conflicts.filter(c => c.status === 'resolved').length,
      averageExecutionTime: 45000, // 45 seconds
      averageThroughput: 125, // records per second
      systemHealth: this.calculateSystemHealth(),
      lastCalculated: new Date()
    };

    this.emit('metrics_updated', this.metrics);
  }

  private calculateSystemHealth(): number {
    const jobs = Array.from(this.syncJobs.values());
    const conflicts = Array.from(this.conflicts.values());

    let health = 100;

    // Reduce health based on failed jobs
    const failedJobs = jobs.filter(j => j.status === 'failed').length;
    health -= (failedJobs / Math.max(jobs.length, 1)) * 30;

    // Reduce health based on pending conflicts
    const pendingConflicts = conflicts.filter(c => c.status === 'pending').length;
    health -= (pendingConflicts / Math.max(conflicts.length, 1)) * 20;

    // Reduce health based on system errors
    health -= Math.random() * 10; // Simulate system variability

    return Math.max(0, Math.min(100, health));
  }

  private startMetricsCalculation(): void {
    // Calculate metrics every 30 minutes
    setInterval(async () => {
      try {
        await this.calculateMetrics();
      } catch (error) {
        console.error('Failed to calculate sync metrics:', error);
      }
    }, 30 * 60 * 1000);
  }

  getMetrics(): SyncMetrics | null {
    return this.metrics;
  }

  getExecutions(filters?: SyncFilters): SyncExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  getExecution(executionId: string): SyncExecution | null {
    return this.activeExecutions.get(executionId) || null;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private generateMockEntityData(entityType: string): Record<string, any> {
    const baseData = {
      id: `${entityType}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    switch (entityType) {
      case 'contact':
        return {
          ...baseData,
          firstName: `First${Math.floor(Math.random() * 1000)}`,
          lastName: `Last${Math.floor(Math.random() * 1000)}`,
          email: `user${Math.floor(Math.random() * 1000)}@example.com`,
          phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
          company: `Company ${Math.floor(Math.random() * 100)}`
        };
      case 'company':
        return {
          ...baseData,
          name: `Company ${Math.floor(Math.random() * 1000)}`,
          domain: `company${Math.floor(Math.random() * 1000)}.com`,
          industry: ['Technology', 'Healthcare', 'Finance', 'Manufacturing'][Math.floor(Math.random() * 4)],
          employees: Math.floor(Math.random() * 10000) + 10
        };
      case 'deal':
        return {
          ...baseData,
          title: `Deal ${Math.floor(Math.random() * 1000)}`,
          value: Math.floor(Math.random() * 100000) + 1000,
          stage: ['Prospecting', 'Qualification', 'Proposal', 'Closed Won'][Math.floor(Math.random() * 4)],
          closeDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000)
        };
      default:
        return baseData;
    }
  }

  private async generateMockData(): Promise<void> {
    // Generate mock sync jobs
    const systems = ['salesforce', 'hubspot', 'pipedrive'];
    const entityTypes = ['contact', 'company', 'deal'];

    for (let i = 0; i < 3; i++) {
      const sourceSystem = systems[i % systems.length];
      const targetSystem = systems[(i + 1) % systems.length];

      await this.createSyncJob({
        name: `${sourceSystem} to ${targetSystem} Sync`,
        sourceSystem,
        targetSystem,
        entityTypes: entityTypes.slice(0, Math.floor(Math.random() * 3) + 1),
        syncMode: ['full', 'incremental', 'delta'][Math.floor(Math.random() * 3)] as any,
        direction: ['bidirectional', 'source_to_target'][Math.floor(Math.random() * 2)] as any,
        isActive: Math.random() > 0.2,
        status: ['idle', 'completed', 'failed'][Math.floor(Math.random() * 3)] as any
      });
    }

    // Generate mock sync mappings
    for (const entityType of entityTypes) {
      for (let i = 0; i < systems.length - 1; i++) {
        const sourceSystem = systems[i];
        const targetSystem = systems[i + 1];

        await this.createSyncMapping({
          sourceSystem,
          targetSystem,
          entityType,
          fieldMappings: this.generateFieldMappings(entityType),
          transformations: this.generateTransformations(entityType),
          isActive: true,
          priority: Math.floor(Math.random() * 10) + 1
        });
      }
    }

    // Generate mock conflicts
    for (let i = 0; i < 5; i++) {
      const conflictTypes: Array<SyncConflict['conflictType']> = ['field_mismatch', 'version_conflict', 'delete_conflict', 'duplicate_record'];
      const priorities: Array<SyncConflict['priority']> = ['low', 'medium', 'high', 'critical'];

      const conflict: SyncConflict = {
        id: `conflict_${Date.now()}_${i}`,
        entityId: `entity_${i}`,
        entityType: entityTypes[Math.floor(Math.random() * entityTypes.length)],
        sourceSystem: systems[0],
        targetSystem: systems[1],
        conflictType: conflictTypes[Math.floor(Math.random() * conflictTypes.length)],
        sourceData: { name: 'Source Name', email: 'source@example.com' },
        targetData: { name: 'Target Name', email: 'target@example.com' },
        conflictFields: ['name', 'email'],
        detectedAt: new Date(Date.now() - Math.random() * 86400000),
        status: 'pending',
        priority: priorities[Math.floor(Math.random() * priorities.length)]
      };

      this.conflicts.set(conflict.id, conflict);
    }

    await this.persistData();
  }

  private generateFieldMappings(entityType: string): FieldMapping[] {
    const commonMappings: FieldMapping[] = [
      {
        sourceField: 'id',
        targetField: 'external_id',
        isRequired: true,
        dataType: 'string'
      },
      {
        sourceField: 'created_at',
        targetField: 'created_date',
        isRequired: false,
        dataType: 'date'
      },
      {
        sourceField: 'updated_at',
        targetField: 'modified_date',
        isRequired: false,
        dataType: 'date'
      }
    ];

    switch (entityType) {
      case 'contact':
        return [
          ...commonMappings,
          {
            sourceField: 'first_name',
            targetField: 'firstName',
            isRequired: true,
            dataType: 'string'
          },
          {
            sourceField: 'last_name',
            targetField: 'lastName',
            isRequired: true,
            dataType: 'string'
          },
          {
            sourceField: 'email',
            targetField: 'email',
            isRequired: true,
            dataType: 'string'
          },
          {
            sourceField: 'phone',
            targetField: 'phone',
            isRequired: false,
            dataType: 'string'
          }
        ];
      case 'company':
        return [
          ...commonMappings,
          {
            sourceField: 'name',
            targetField: 'company_name',
            isRequired: true,
            dataType: 'string'
          },
          {
            sourceField: 'domain',
            targetField: 'website',
            isRequired: false,
            dataType: 'string'
          },
          {
            sourceField: 'industry',
            targetField: 'industry',
            isRequired: false,
            dataType: 'string'
          }
        ];
      case 'deal':
        return [
          ...commonMappings,
          {
            sourceField: 'title',
            targetField: 'deal_name',
            isRequired: true,
            dataType: 'string'
          },
          {
            sourceField: 'value',
            targetField: 'amount',
            isRequired: true,
            dataType: 'number'
          },
          {
            sourceField: 'stage',
            targetField: 'deal_stage',
            isRequired: true,
            dataType: 'string'
          }
        ];
      default:
        return commonMappings;
    }
  }

  private generateTransformations(entityType: string): DataTransformation[] {
    const transformations: DataTransformation[] = [
      {
        id: `transform_${entityType}_fullname`,
        name: 'Full Name',
        type: 'calculate',
        sourceFields: ['first_name', 'last_name'],
        targetField: 'full_name',
        rules: [{
          operation: 'concat',
          parameters: { separator: ' ' },
          priority: 1
        }],
        isActive: true
      }
    ];

    if (entityType === 'contact') {
      transformations.push({
        id: `transform_${entityType}_email_domain`,
        name: 'Email Domain',
        type: 'format',
        sourceFields: ['email'],
        targetField: 'email_domain',
        rules: [{
          operation: 'extract_domain',
          parameters: {},
          priority: 1
        }],
        isActive: true
      });
    }

    return transformations;
  }

  async getHealthStatus(): Promise<{ status: string; details: Record<string, any> }> {
    const metrics = this.getMetrics();
    const health = metrics?.systemHealth || 0;

    return {
      status: health > 80 ? 'healthy' : health > 60 ? 'warning' : 'critical',
      details: {
        systemHealth: health,
        activeJobs: metrics?.activeJobs || 0,
        pendingConflicts: metrics?.pendingConflicts || 0,
        lastCalculated: metrics?.lastCalculated || new Date(),
        isInitialized: this.isInitialized
      }
    };
  }
}
