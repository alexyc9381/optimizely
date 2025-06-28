import { EventEmitter } from 'events';
import Redis from 'ioredis';

// =============================================================================
// CORE INTERFACES - Universal Custom Field Mapping System
// =============================================================================

export interface FieldMapping {
  id: string;
  name: string;
  description?: string;
  sourceSystem: string;
  targetSystem: string;
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  transformationRule?: TransformationRule;
  isActive: boolean;
  isBidirectional: boolean;
  priority: number;
  validationRules: ValidationRule[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TransformationRule {
  id: string;
  type: 'direct' | 'custom' | 'lookup' | 'conditional' | 'aggregation';
  function?: string; // JavaScript function as string for custom transformations
  parameters?: Record<string, any>;
  lookupTable?: Record<string, any>;
  conditions?: ConditionalMapping[];
  defaultValue?: any;
  errorHandling: 'ignore' | 'default' | 'error';
}

export interface ConditionalMapping {
  condition: string; // JavaScript expression
  value: any;
  targetField?: string;
}

export interface ValidationRule {
  id: string;
  type: 'required' | 'format' | 'range' | 'custom';
  parameters?: Record<string, any>;
  errorMessage: string;
  isActive: boolean;
}

export interface MappingExecution {
  id: string;
  mappingId: string;
  sourceData: any;
  transformedData: any;
  executionTime: number;
  status: 'success' | 'warning' | 'error';
  errors: MappingError[];
  warnings: string[];
  timestamp: Date;
  batchId?: string;
}

export interface MappingError {
  field: string;
  error: string;
  severity: 'low' | 'medium' | 'high';
  code: string;
}

export interface MappingValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  suggestions: string[];
  compatibility: 'full' | 'partial' | 'incompatible';
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface DataTypeMapping {
  sourceType: string;
  targetType: string;
  conversionFunction: string;
  preserveNulls: boolean;
  defaultValue?: any;
}

export interface MappingTemplate {
  id: string;
  name: string;
  description: string;
  sourceSystem: string;
  targetSystem: string;
  mappings: Omit<FieldMapping, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[];
  isPublic: boolean;
  category: string;
  tags: string[];
  usage: number;
}

export interface MappingMetrics {
  totalMappings: number;
  activeMappings: number;
  mappingsBySystem: Record<string, number>;
  executionsByStatus: Record<string, number>;
  averageExecutionTime: number;
  errorRate: number;
  mostUsedMappings: Array<{ mappingId: string; name: string; executions: number }>;
  systemCompatibility: Record<string, string[]>;
  performanceMetrics: {
    fastestMapping: { id: string; time: number };
    slowestMapping: { id: string; time: number };
    totalExecutions: number;
    successRate: number;
  };
}

export interface MappingFilters {
  sourceSystem?: string;
  targetSystem?: string;
  dataType?: string;
  isActive?: boolean;
  isBidirectional?: boolean;
  createdBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  hasErrors?: boolean;
}

export interface BulkMappingOperation {
  operation: 'create' | 'update' | 'delete' | 'execute';
  mappings: FieldMapping[] | string[];
  options?: {
    validateOnly?: boolean;
    continueOnError?: boolean;
    batchSize?: number;
  };
}

export interface BulkMappingResult {
  batchId: string;
  totalItems: number;
  successCount: number;
  errorCount: number;
  results: Array<{
    mappingId: string;
    status: 'success' | 'error';
    error?: string;
    data?: any;
  }>;
  executionTime: number;
}

// =============================================================================
// UNIVERSAL CUSTOM FIELD MAPPING SERVICE
// =============================================================================

export class CustomFieldMappingService extends EventEmitter {
  private redis: Redis;
  private mappings: Map<string, FieldMapping> = new Map();
  private transformationRules: Map<string, TransformationRule> = new Map();
  private templates: Map<string, MappingTemplate> = new Map();
  private executions: MappingExecution[] = [];
  private metricsCache: MappingMetrics | null = null;
  private metricsInterval?: NodeJS.Timeout;

  constructor(redis: Redis) {
    super();
    this.redis = redis;
    this.initializeDefaultMappings();
    this.initializeTransformationRules();
    this.startMetricsCalculation();
    this.generateMockData();
  }

  // =============================================================================
  // FIELD MAPPING MANAGEMENT
  // =============================================================================

  private initializeDefaultMappings(): void {
    const defaultMappings: FieldMapping[] = [
      {
        id: 'sf_email_mapping',
        name: 'Salesforce Email Mapping',
        description: 'Standard email field mapping for Salesforce',
        sourceSystem: 'optimizely',
        targetSystem: 'salesforce',
        sourceField: 'email',
        targetField: 'Email',
        dataType: 'string',
        isActive: true,
        isBidirectional: true,
        priority: 1,
        validationRules: [
          {
            id: 'email_format',
            type: 'format',
            parameters: { pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$' },
            errorMessage: 'Invalid email format',
            isActive: true
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'hs_company_mapping',
        name: 'HubSpot Company Mapping',
        description: 'Company name mapping for HubSpot',
        sourceSystem: 'optimizely',
        targetSystem: 'hubspot',
        sourceField: 'company',
        targetField: 'company',
        dataType: 'string',
        isActive: true,
        isBidirectional: true,
        priority: 2,
        validationRules: [
          {
            id: 'company_required',
            type: 'required',
            parameters: {},
            errorMessage: 'Company name is required',
            isActive: true
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      }
    ];

    defaultMappings.forEach(mapping => {
      this.mappings.set(mapping.id, mapping);
      if (mapping.transformationRule) {
        this.transformationRules.set(mapping.transformationRule.id, mapping.transformationRule);
      }
    });
  }

  private initializeTransformationRules(): void {
    const defaultRules: TransformationRule[] = [
      {
        id: 'phone_formatting',
        type: 'custom',
        function: 'value.replace(/\\D/g, "").replace(/(\\d{3})(\\d{3})(\\d{4})/, "($1) $2-$3")',
        parameters: {},
        defaultValue: '',
        errorHandling: 'default'
      },
      {
        id: 'date_iso_conversion',
        type: 'custom',
        function: 'new Date(value).toISOString()',
        parameters: {},
        defaultValue: null,
        errorHandling: 'default'
      }
    ];

    defaultRules.forEach(rule => {
      this.transformationRules.set(rule.id, rule);
    });
  }

  async createMapping(mappingData: Omit<FieldMapping, 'id' | 'createdAt' | 'updatedAt'>): Promise<FieldMapping> {
    const id = `mapping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mapping: FieldMapping = {
      id,
      ...mappingData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate mapping before creation
    const validation = await this.validateMapping(mapping);
    if (!validation.isValid) {
      throw new Error(`Invalid mapping: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.mappings.set(id, mapping);
    await this.persistMapping(mapping);

    this.emit('mappingCreated', mapping);
    return mapping;
  }

  async updateMapping(mappingId: string, updates: Partial<FieldMapping>): Promise<FieldMapping | null> {
    const existing = this.mappings.get(mappingId);
    if (!existing) return null;

    const updated: FieldMapping = {
      ...existing,
      ...updates,
      id: mappingId,
      updatedAt: new Date()
    };

    const validation = await this.validateMapping(updated);
    if (!validation.isValid) {
      throw new Error(`Invalid mapping update: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.mappings.set(mappingId, updated);
    await this.persistMapping(updated);

    this.emit('mappingUpdated', updated);
    return updated;
  }

  async deleteMapping(mappingId: string): Promise<boolean> {
    const mapping = this.mappings.get(mappingId);
    if (!mapping) return false;

    this.mappings.delete(mappingId);
    await this.redis.del(`mapping:${mappingId}`);

    this.emit('mappingDeleted', { mappingId, mapping });
    return true;
  }

  getMapping(mappingId: string): FieldMapping | null {
    return this.mappings.get(mappingId) || null;
  }

  getMappings(filters?: MappingFilters): FieldMapping[] {
    let mappings = Array.from(this.mappings.values());

    if (filters) {
      if (filters.sourceSystem) {
        mappings = mappings.filter(m => m.sourceSystem === filters.sourceSystem);
      }
      if (filters.targetSystem) {
        mappings = mappings.filter(m => m.targetSystem === filters.targetSystem);
      }
      if (filters.dataType) {
        mappings = mappings.filter(m => m.dataType === filters.dataType);
      }
      if (filters.isActive !== undefined) {
        mappings = mappings.filter(m => m.isActive === filters.isActive);
      }
      if (filters.isBidirectional !== undefined) {
        mappings = mappings.filter(m => m.isBidirectional === filters.isBidirectional);
      }
      if (filters.createdBy) {
        mappings = mappings.filter(m => m.createdBy === filters.createdBy);
      }
      if (filters.createdAfter) {
        mappings = mappings.filter(m => m.createdAt >= filters.createdAfter!);
      }
      if (filters.createdBefore) {
        mappings = mappings.filter(m => m.createdAt <= filters.createdBefore!);
      }
    }

    return mappings.sort((a, b) => a.priority - b.priority);
  }

  // =============================================================================
  // FIELD TRANSFORMATION & EXECUTION
  // =============================================================================

  async executeMapping(mappingId: string, sourceData: any, options?: {
    validateInput?: boolean;
    includeMetadata?: boolean
  }): Promise<MappingExecution> {
    const startTime = Date.now();
    const mapping = this.mappings.get(mappingId);

    if (!mapping) {
      throw new Error(`Mapping not found: ${mappingId}`);
    }

    if (!mapping.isActive) {
      throw new Error(`Mapping is inactive: ${mappingId}`);
    }

    const execution: MappingExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mappingId,
      sourceData,
      transformedData: null,
      executionTime: 0,
      status: 'success',
      errors: [],
      warnings: [],
      timestamp: new Date()
    };

    try {
      // Validate input data if requested
      if (options?.validateInput) {
        const validationErrors = await this.validateInputData(mapping, sourceData);
        if (validationErrors.length > 0) {
          execution.errors.push(...validationErrors);
          execution.status = 'error';
          return execution;
        }
      }

      // Extract source field value
      const sourceValue = this.extractFieldValue(sourceData, mapping.sourceField);

      // Apply transformation if defined
      let transformedValue = sourceValue;
      if (mapping.transformationRule) {
        transformedValue = await this.applyTransformation(
          sourceValue,
          mapping.transformationRule,
          execution
        );
      }

      // Create transformed data structure
      execution.transformedData = this.createTargetData(
        mapping.targetField,
        transformedValue,
        options?.includeMetadata ? {
          mappingId,
          transformedAt: new Date(),
          sourceField: mapping.sourceField
        } : undefined
      );

      execution.status = execution.errors.length > 0 ? 'warning' : 'success';

    } catch (error) {
      execution.status = 'error';
      execution.errors.push({
        field: mapping.sourceField,
        error: error instanceof Error ? error.message : 'Unknown transformation error',
        severity: 'high',
        code: 'TRANSFORMATION_ERROR'
      });
    }

    execution.executionTime = Date.now() - startTime;
    this.executions.push(execution);

    // Limit execution history
    if (this.executions.length > 1000) {
      this.executions = this.executions.slice(-500);
    }

    this.emit('mappingExecuted', execution);
    return execution;
  }

  private extractFieldValue(data: any, fieldPath: string): any {
    const parts = fieldPath.split('.');
    let current = data;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }

    return current;
  }

  private createTargetData(fieldPath: string, value: any, metadata?: any): any {
    const parts = fieldPath.split('.');
    const result: any = {};
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = {};
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;

    if (metadata) {
      result._metadata = metadata;
    }

    return result;
  }

  private async applyTransformation(
    value: any,
    rule: TransformationRule,
    execution: MappingExecution
  ): Promise<any> {
    try {
      switch (rule.type) {
        case 'direct':
          return value;

        case 'custom':
          if (!rule.function) return rule.defaultValue;
          const func = new Function('value', 'params', `return ${rule.function}`);
          return func(value, rule.parameters || {});

        case 'lookup':
          if (!rule.lookupTable) return rule.defaultValue;
          return rule.lookupTable[value] || rule.defaultValue;

        case 'conditional':
          if (!rule.conditions) return rule.defaultValue;
          for (const condition of rule.conditions) {
            const conditionFunc = new Function('value', `return ${condition.condition}`);
            if (conditionFunc(value)) {
              return condition.value;
            }
          }
          return rule.defaultValue;

        default:
          execution.warnings.push(`Unknown transformation type: ${rule.type}`);
          return value;
      }
    } catch (error) {
      if (rule.errorHandling === 'error') {
        throw error;
      } else if (rule.errorHandling === 'default') {
        execution.warnings.push(`Transformation failed, using default value: ${error}`);
        return rule.defaultValue;
      } else {
        execution.warnings.push(`Transformation failed, ignoring: ${error}`);
        return value;
      }
    }
  }

  // =============================================================================
  // VALIDATION
  // =============================================================================

  async validateMapping(mapping: FieldMapping): Promise<MappingValidationResult> {
    const result: MappingValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      compatibility: 'full'
    };

    // Validate required fields
    if (!mapping.sourceField) {
      result.errors.push({
        field: 'sourceField',
        rule: 'required',
        message: 'Source field is required',
        severity: 'error'
      });
    }

    if (!mapping.targetField) {
      result.errors.push({
        field: 'targetField',
        rule: 'required',
        message: 'Target field is required',
        severity: 'error'
      });
    }

    // Validate transformation rule if present
    if (mapping.transformationRule) {
      const ruleValidation = this.validateTransformationRule(mapping.transformationRule);
      result.errors.push(...ruleValidation.errors);
      result.warnings.push(...ruleValidation.warnings);
    }

    // Check for conflicts with existing mappings
    const conflicts = this.findMappingConflicts(mapping);
    if (conflicts.length > 0) {
      result.warnings.push(`Potential conflicts with existing mappings: ${conflicts.join(', ')}`);
      result.compatibility = 'partial';
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  private validateTransformationRule(rule: TransformationRule): {
    errors: ValidationError[];
    warnings: string[]
  } {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (rule.type === 'custom' && !rule.function) {
      errors.push({
        field: 'transformationRule.function',
        rule: 'required',
        message: 'Custom transformation requires a function',
        severity: 'error'
      });
    }

    if (rule.type === 'lookup' && !rule.lookupTable) {
      errors.push({
        field: 'transformationRule.lookupTable',
        rule: 'required',
        message: 'Lookup transformation requires a lookup table',
        severity: 'error'
      });
    }

    return { errors, warnings };
  }

  private findMappingConflicts(mapping: FieldMapping): string[] {
    const conflicts: string[] = [];

    for (const [id, existing] of this.mappings) {
      if (id === mapping.id) continue;

      if (existing.sourceSystem === mapping.sourceSystem &&
          existing.targetSystem === mapping.targetSystem &&
          existing.targetField === mapping.targetField &&
          existing.isActive && mapping.isActive) {
        conflicts.push(id);
      }
    }

    return conflicts;
  }

  private async validateInputData(mapping: FieldMapping, data: any): Promise<MappingError[]> {
    const errors: MappingError[] = [];
    const value = this.extractFieldValue(data, mapping.sourceField);

    for (const rule of mapping.validationRules) {
      if (!rule.isActive) continue;

      try {
        const isValid = await this.validateValue(value, rule);
        if (!isValid) {
          errors.push({
            field: mapping.sourceField,
            error: rule.errorMessage,
            severity: 'medium',
            code: `VALIDATION_${rule.type.toUpperCase()}`
          });
        }
      } catch (error) {
        errors.push({
          field: mapping.sourceField,
          error: `Validation error: ${error}`,
          severity: 'high',
          code: 'VALIDATION_ERROR'
        });
      }
    }

    return errors;
  }

  private async validateValue(value: any, rule: ValidationRule): Promise<boolean> {
    switch (rule.type) {
      case 'required':
        return value !== null && value !== undefined && value !== '';

      case 'format':
        if (!rule.parameters?.pattern) return true;
        const regex = new RegExp(rule.parameters.pattern);
        return regex.test(String(value));

      case 'range':
        const num = Number(value);
        if (isNaN(num)) return false;
        const min = rule.parameters?.min;
        const max = rule.parameters?.max;
        return (min === undefined || num >= min) && (max === undefined || num <= max);

      case 'custom':
        if (!rule.parameters?.function) return true;
        const func = new Function('value', `return ${rule.parameters.function}`);
        return func(value);

      default:
        return true;
    }
  }

  // =============================================================================
  // METRICS & MONITORING
  // =============================================================================

  private startMetricsCalculation(): void {
    this.calculateMetrics();
    this.metricsInterval = setInterval(() => {
      this.calculateMetrics();
    }, 30 * 60 * 1000);
  }

  private calculateMetrics(): void {
    const mappings = Array.from(this.mappings.values());
    const executions = this.executions;

    const mappingsBySystem: Record<string, number> = {};
    const executionsByStatus: Record<string, number> = {};

    mappings.forEach(mapping => {
      const key = `${mapping.sourceSystem}->${mapping.targetSystem}`;
      mappingsBySystem[key] = (mappingsBySystem[key] || 0) + 1;
    });

    executions.forEach(execution => {
      executionsByStatus[execution.status] = (executionsByStatus[execution.status] || 0) + 1;
    });

    const executionTimes = executions.map(e => e.executionTime);
    const averageExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      : 0;

    const errorCount = executions.filter(e => e.status === 'error').length;
    const errorRate = executions.length > 0 ? (errorCount / executions.length) * 100 : 0;

    const mappingExecutions: Record<string, number> = {};
    executions.forEach(execution => {
      mappingExecutions[execution.mappingId] = (mappingExecutions[execution.mappingId] || 0) + 1;
    });

    const mostUsedMappings = Object.entries(mappingExecutions)
      .map(([mappingId, count]) => {
        const mapping = this.mappings.get(mappingId);
        return {
          mappingId,
          name: mapping?.name || 'Unknown',
          executions: count
        };
      })
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 10);

    const systemCompatibility: Record<string, string[]> = {};
    mappings.forEach(mapping => {
      if (!systemCompatibility[mapping.sourceSystem]) {
        systemCompatibility[mapping.sourceSystem] = [];
      }
      if (!systemCompatibility[mapping.sourceSystem].includes(mapping.targetSystem)) {
        systemCompatibility[mapping.sourceSystem].push(mapping.targetSystem);
      }
    });

    const fastestMapping = executionTimes.length > 0
      ? executions.reduce((fastest, current) =>
          current.executionTime < fastest.executionTime ? current : fastest
        )
      : null;

    const slowestMapping = executionTimes.length > 0
      ? executions.reduce((slowest, current) =>
          current.executionTime > slowest.executionTime ? current : slowest
        )
      : null;

    this.metricsCache = {
      totalMappings: mappings.length,
      activeMappings: mappings.filter(m => m.isActive).length,
      mappingsBySystem,
      executionsByStatus,
      averageExecutionTime,
      errorRate,
      mostUsedMappings,
      systemCompatibility,
      performanceMetrics: {
        fastestMapping: fastestMapping ? { id: fastestMapping.mappingId, time: fastestMapping.executionTime } : { id: '', time: 0 },
        slowestMapping: slowestMapping ? { id: slowestMapping.mappingId, time: slowestMapping.executionTime } : { id: '', time: 0 },
        totalExecutions: executions.length,
        successRate: executions.length > 0 ? ((executions.length - errorCount) / executions.length) * 100 : 0
      }
    };

    this.emit('metricsCalculated', this.metricsCache);
  }

  getMetrics(): MappingMetrics | null {
    return this.metricsCache;
  }

  getExecutions(filters?: {
    mappingId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date
  }): MappingExecution[] {
    let executions = [...this.executions];

    if (filters) {
      if (filters.mappingId) {
        executions = executions.filter(e => e.mappingId === filters.mappingId);
      }
      if (filters.status) {
        executions = executions.filter(e => e.status === filters.status);
      }
      if (filters.startDate) {
        executions = executions.filter(e => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        executions = executions.filter(e => e.timestamp <= filters.endDate!);
      }
    }

    return executions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // =============================================================================
  // PERSISTENCE
  // =============================================================================

  private async persistMapping(mapping: FieldMapping): Promise<void> {
    try {
      await this.redis.setex(
        `mapping:${mapping.id}`,
        300,
        JSON.stringify(mapping)
      );
    } catch (error) {
      console.warn('Failed to persist mapping to Redis:', error);
    }
  }

  // =============================================================================
  // HEALTH & CLEANUP
  // =============================================================================

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    mappings: number;
    activeMappings: number;
    executions: number;
    metricsStatus: 'active' | 'inactive';
    errorRate: number;
  }> {
    const mappings = Array.from(this.mappings.values());
    const activeMappings = mappings.filter(m => m.isActive);
    const errorRate = this.metricsCache?.errorRate || 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (errorRate > 20) {
      status = 'unhealthy';
    } else if (errorRate > 10 || activeMappings.length === 0) {
      status = 'degraded';
    }

    return {
      status,
      mappings: mappings.length,
      activeMappings: activeMappings.length,
      executions: this.executions.length,
      metricsStatus: this.metricsInterval ? 'active' : 'inactive',
      errorRate
    };
  }

  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    this.removeAllListeners();
    this.mappings.clear();
    this.transformationRules.clear();
    this.executions = [];
  }

  // =============================================================================
  // MOCK DATA GENERATION
  // =============================================================================

  generateMockData(): void {
    const mockExecutions: MappingExecution[] = [
      {
        id: 'exec_1',
        mappingId: 'sf_email_mapping',
        sourceData: { email: 'test@example.com' },
        transformedData: { Email: 'test@example.com' },
        executionTime: 15,
        status: 'success',
        errors: [],
        warnings: [],
        timestamp: new Date(Date.now() - 1000 * 60 * 5)
      },
      {
        id: 'exec_2',
        mappingId: 'hs_company_mapping',
        sourceData: { company: 'Acme Corp' },
        transformedData: { company: 'Acme Corp' },
        executionTime: 12,
        status: 'success',
        errors: [],
        warnings: [],
        timestamp: new Date(Date.now() - 1000 * 60 * 10)
      }
    ];

    this.executions.push(...mockExecutions);
  }
}

export default CustomFieldMappingService;
