import { EventEmitter } from 'events';
import { redisManager } from './redis-client';

// Core Rule Engine Interfaces
export interface RuleCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in' | 'exists' | 'not_exists' | 'regex';
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  id: string;
  type: 'webhook' | 'email' | 'sms' | 'update_field' | 'create_record' | 'delete_record' | 'trigger_workflow' | 'custom_function';
  parameters: Record<string, any>;
  priority: number;
  async: boolean;
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  category: string;
  tags: string[];
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  executionMode: 'sync' | 'async' | 'batch';
  triggers: string[];
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    lastExecuted?: Date;
    executionCount: number;
    successCount: number;
    failureCount: number;
  };
  schedule?: {
    enabled: boolean;
    cron: string;
    timezone: string;
  };
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  id: string;
  field: string;
  rule: 'required' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value: any;
  message: string;
}

export interface RuleExecution {
  id: string;
  ruleId: string;
  status: 'pending' | 'running' | 'success' | 'failure' | 'timeout';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  input: any;
  output?: any;
  error?: string;
  logs: ExecutionLog[];
  metadata: Record<string, any>;
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

export interface RuleTestCase {
  id: string;
  ruleId: string;
  name: string;
  description: string;
  input: any;
  expectedOutput: any;
  status: 'pass' | 'fail' | 'pending';
  lastRun?: Date;
  assertions: TestAssertion[];
}

export interface TestAssertion {
  field: string;
  operator: string;
  expected: any;
  actual?: any;
  passed?: boolean;
}

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: Partial<BusinessRule>;
  variables: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description: string;
}

// Rule Engine Configuration
export interface RuleEngineConfiguration {
  maxRulesPerCategory: number;
  maxConditionsPerRule: number;
  maxActionsPerRule: number;
  executionTimeout: number;
  retryPolicy: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
  };
  validation: {
    enabled: boolean;
    strictMode: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    retention: number;
  };
  performance: {
    cacheEnabled: boolean;
    cacheTTL: number;
    batchSize: number;
  };
}

// Supporting Classes
export class RuleValidator {
  validateRule(rule: BusinessRule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!rule.name || rule.name.trim().length === 0) {
      errors.push('Rule name is required');
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push('At least one condition is required');
    }

    if (!rule.actions || rule.actions.length === 0) {
      errors.push('At least one action is required');
    }

    // Validate conditions
    rule.conditions?.forEach((condition, index) => {
      if (!condition.field) {
        errors.push(`Condition ${index + 1}: Field is required`);
      }
      if (!condition.operator) {
        errors.push(`Condition ${index + 1}: Operator is required`);
      }
      if (condition.value === undefined || condition.value === null) {
        errors.push(`Condition ${index + 1}: Value is required`);
      }
    });

    // Validate actions
    rule.actions?.forEach((action, index) => {
      if (!action.type) {
        errors.push(`Action ${index + 1}: Type is required`);
      }
      if (!action.parameters) {
        errors.push(`Action ${index + 1}: Parameters are required`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateCondition(condition: RuleCondition, data: any): boolean {
    const fieldValue = this.getFieldValue(data, condition.field);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'starts_with':
        return String(fieldValue).startsWith(String(condition.value));
      case 'ends_with':
        return String(fieldValue).endsWith(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      case 'regex':
        return new RegExp(condition.value).test(String(fieldValue));
      default:
        return false;
    }
  }

  private getFieldValue(data: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], data);
  }
}

export class RuleExecutor {
  private validator: RuleValidator;

  constructor() {
    this.validator = new RuleValidator();
  }

  async executeRule(rule: BusinessRule, data: any): Promise<RuleExecution> {
    const execution: RuleExecution = {
      id: this.generateExecutionId(),
      ruleId: rule.id,
      status: 'running',
      startTime: new Date(),
      input: data,
      logs: [],
      metadata: {}
    };

    try {
      // Validate rule
      const validation = this.validator.validateRule(rule);
      if (!validation.valid) {
        throw new Error(`Rule validation failed: ${validation.errors.join(', ')}`);
      }

      // Evaluate conditions
      const conditionsResult = this.evaluateConditions(rule.conditions, data);
      execution.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `Conditions evaluated: ${conditionsResult}`,
        data: { conditions: rule.conditions }
      });

      if (conditionsResult) {
        // Execute actions
        const actionResults = await this.executeActions(rule.actions, data, execution);
        execution.output = actionResults;
        execution.status = 'success';
      } else {
        execution.status = 'success';
        execution.output = { message: 'Conditions not met, no actions executed' };
      }

    } catch (error) {
      execution.status = 'failure';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: 'Rule execution failed',
        data: { error: execution.error }
      });
    } finally {
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
    }

    return execution;
  }

  private evaluateConditions(conditions: RuleCondition[], data: any): boolean {
    if (!conditions || conditions.length === 0) return true;

    let result = true;
    let currentOperator: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const conditionResult = this.validator.validateCondition(condition, data);

      if (currentOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      if (condition.logicalOperator) {
        currentOperator = condition.logicalOperator;
      }
    }

    return result;
  }

  private async executeActions(actions: RuleAction[], data: any, execution: RuleExecution): Promise<any[]> {
    const results: any[] = [];

    // Sort actions by priority
    const sortedActions = [...actions].sort((a, b) => a.priority - b.priority);

    for (const action of sortedActions) {
      try {
        const result = await this.executeAction(action, data);
        results.push(result);

        execution.logs.push({
          timestamp: new Date(),
          level: 'info',
          message: `Action executed: ${action.type}`,
          data: { action, result }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        execution.logs.push({
          timestamp: new Date(),
          level: 'error',
          message: `Action failed: ${action.type}`,
          data: { action, error: errorMessage }
        });

        if (!action.async) {
          throw error; // Stop execution for sync actions
        }
      }
    }

    return results;
  }

  private async executeAction(action: RuleAction, data: any): Promise<any> {
    switch (action.type) {
      case 'webhook':
        return await this.executeWebhookAction(action, data);
      case 'email':
        return await this.executeEmailAction(action, data);
      case 'sms':
        return await this.executeSmsAction(action, data);
      case 'update_field':
        return await this.executeUpdateFieldAction(action, data);
      case 'create_record':
        return await this.executeCreateRecordAction(action, data);
      case 'delete_record':
        return await this.executeDeleteRecordAction(action, data);
      case 'trigger_workflow':
        return await this.executeTriggerWorkflowAction(action, data);
      case 'custom_function':
        return await this.executeCustomFunctionAction(action, data);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeWebhookAction(action: RuleAction, data: any): Promise<any> {
    return { status: 'webhook_sent', url: action.parameters.url };
  }

  private async executeEmailAction(action: RuleAction, data: any): Promise<any> {
    return { status: 'email_sent', to: action.parameters.to };
  }

  private async executeSmsAction(action: RuleAction, data: any): Promise<any> {
    return { status: 'sms_sent', to: action.parameters.to };
  }

  private async executeUpdateFieldAction(action: RuleAction, data: any): Promise<any> {
    return { status: 'field_updated', field: action.parameters.field };
  }

  private async executeCreateRecordAction(action: RuleAction, data: any): Promise<any> {
    return { status: 'record_created', type: action.parameters.type };
  }

  private async executeDeleteRecordAction(action: RuleAction, data: any): Promise<any> {
    return { status: 'record_deleted', id: action.parameters.id };
  }

  private async executeTriggerWorkflowAction(action: RuleAction, data: any): Promise<any> {
    return { status: 'workflow_triggered', workflow: action.parameters.workflow };
  }

  private async executeCustomFunctionAction(action: RuleAction, data: any): Promise<any> {
    return { status: 'function_executed', function: action.parameters.function };
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Main Rule Customization Engine Service
export class UniversalRuleCustomizationEngine extends EventEmitter {
  private redis: typeof redisManager;
  private config: RuleEngineConfiguration;
  private validator: RuleValidator;
  private executor: RuleExecutor;
  private rules: Map<string, BusinessRule> = new Map();
  private templates: Map<string, RuleTemplate> = new Map();
  private executions: Map<string, RuleExecution> = new Map();
  private isInitialized: boolean = false;

  constructor(config?: Partial<RuleEngineConfiguration>) {
    super();
    this.redis = redisManager;
    this.config = this.mergeConfig(config);
    this.validator = new RuleValidator();
    this.executor = new RuleExecutor();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load existing rules from storage
      await this.loadRules();
      await this.loadTemplates();

      // Initialize default templates
      await this.initializeDefaultTemplates();

      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Rule Management
  async createRule(rule: Omit<BusinessRule, 'id' | 'metadata'>): Promise<BusinessRule> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const newRule: BusinessRule = {
      ...rule,
      id: this.generateRuleId(),
      metadata: {
        createdBy: 'system',
        createdAt: new Date(),
        updatedBy: 'system',
        updatedAt: new Date(),
        executionCount: 0,
        successCount: 0,
        failureCount: 0
      }
    };

    // Validate rule
    const validation = this.validator.validateRule(newRule);
    if (!validation.valid) {
      throw new Error(`Rule validation failed: ${validation.errors.join(', ')}`);
    }

    // Store rule
    this.rules.set(newRule.id, newRule);
    await this.saveRule(newRule);

    this.emit('ruleCreated', newRule);
    return newRule;
  }

  async getRule(id: string): Promise<BusinessRule | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.rules.get(id) || null;
  }

  async getRules(filters?: {
    status?: string;
    category?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<BusinessRule[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    let rules = Array.from(this.rules.values());

    // Apply filters
    if (filters?.status) {
      rules = rules.filter(rule => rule.status === filters.status);
    }

    if (filters?.category) {
      rules = rules.filter(rule => rule.category === filters.category);
    }

    if (filters?.tags && filters.tags.length > 0) {
      rules = rules.filter(rule =>
        filters.tags!.some(tag => rule.tags.includes(tag))
      );
    }

    // Apply pagination
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 100;

    return rules.slice(offset, offset + limit);
  }

  // Rule Execution
  async executeRule(ruleId: string, data: any): Promise<RuleExecution> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    if (rule.status !== 'active') {
      throw new Error(`Rule is not active: ${ruleId}`);
    }

    const execution = await this.executor.executeRule(rule, data);

    // Store execution
    this.executions.set(execution.id, execution);
    await this.saveExecution(execution);

    // Update rule metadata
    rule.metadata.executionCount++;
    rule.metadata.lastExecuted = new Date();

    if (execution.status === 'success') {
      rule.metadata.successCount++;
    } else {
      rule.metadata.failureCount++;
    }

    await this.saveRule(rule);

    this.emit('ruleExecuted', execution);
    return execution;
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    services: Record<string, boolean>;
    metrics: {
      totalRules: number;
      activeRules: number;
      totalExecutions: number;
      successRate: number;
    };
    lastUpdate: Date;
  }> {
    try {
      const redisHealth = await this.redis.healthCheck();
      const totalRules = this.rules.size;
      const activeRules = Array.from(this.rules.values()).filter(rule => rule.status === 'active').length;
      const totalExecutions = this.executions.size;
      const successfulExecutions = Array.from(this.executions.values()).filter(exec => exec.status === 'success').length;

      return {
        status: 'healthy',
        services: {
          redis: redisHealth.status === 'healthy',
          ruleEngine: this.isInitialized,
          validator: true,
          executor: true
        },
        metrics: {
          totalRules,
          activeRules,
          totalExecutions,
          successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0
        },
        lastUpdate: new Date()
      };
    } catch (error) {
      return {
        status: 'critical',
        services: {
          redis: false,
          ruleEngine: false,
          validator: false,
          executor: false
        },
        metrics: {
          totalRules: 0,
          activeRules: 0,
          totalExecutions: 0,
          successRate: 0
        },
        lastUpdate: new Date()
      };
    }
  }

  // Private Methods
  private mergeConfig(config?: Partial<RuleEngineConfiguration>): RuleEngineConfiguration {
    return {
      maxRulesPerCategory: 1000,
      maxConditionsPerRule: 50,
      maxActionsPerRule: 20,
      executionTimeout: 30000,
      retryPolicy: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000
      },
      validation: {
        enabled: true,
        strictMode: false
      },
      logging: {
        level: 'info',
        retention: 30
      },
      performance: {
        cacheEnabled: true,
        cacheTTL: 3600,
        batchSize: 100
      },
      ...config
    };
  }

  private async loadRules(): Promise<void> {
    try {
      const keys = await this.redis.getClient().keys('rule:*');
      for (const key of keys) {
        const ruleData = await this.redis.getClient().get(key);
        if (ruleData) {
          const rule = JSON.parse(ruleData) as BusinessRule;
          this.rules.set(rule.id, rule);
        }
      }
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  }

  private async loadTemplates(): Promise<void> {
    try {
      const keys = await this.redis.getClient().keys('template:*');
      for (const key of keys) {
        const templateData = await this.redis.getClient().get(key);
        if (templateData) {
          const template = JSON.parse(templateData) as RuleTemplate;
          this.templates.set(template.id, template);
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }

  private async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates: Omit<RuleTemplate, 'id'>[] = [
      {
        name: 'Lead Scoring Rule',
        description: 'Template for lead scoring automation',
        category: 'lead_management',
        template: {
          name: 'Lead Scoring Rule',
          description: 'Automatically score leads based on criteria',
          category: 'lead_management',
          tags: ['lead', 'scoring', 'automation'],
          conditions: [],
          actions: [],
          priority: 1,
          executionMode: 'sync',
          triggers: ['lead_created', 'lead_updated'],
          status: 'draft',
          version: '1.0.0',
          validationRules: []
        },
        variables: [
          { name: 'scoreField', type: 'string', required: true, description: 'Field to store the score' },
          { name: 'maxScore', type: 'number', required: true, defaultValue: 100, description: 'Maximum possible score' }
        ]
      }
    ];

    for (const template of defaultTemplates) {
      if (!this.templates.has(template.name)) {
        await this.createTemplate(template);
      }
    }
  }

  private async createTemplate(template: Omit<RuleTemplate, 'id'>): Promise<RuleTemplate> {
    const newTemplate: RuleTemplate = {
      ...template,
      id: this.generateTemplateId()
    };

    this.templates.set(newTemplate.id, newTemplate);
    await this.saveTemplate(newTemplate);

    return newTemplate;
  }

  private async saveRule(rule: BusinessRule): Promise<void> {
    await this.redis.getClient().set(`rule:${rule.id}`, JSON.stringify(rule));
  }

  private async saveExecution(execution: RuleExecution): Promise<void> {
    await this.redis.getClient().set(`execution:${execution.id}`, JSON.stringify(execution));
  }

  private async saveTemplate(template: RuleTemplate): Promise<void> {
    await this.redis.getClient().set(`template:${template.id}`, JSON.stringify(template));
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export the service instance
export const universalRuleCustomizationEngine = new UniversalRuleCustomizationEngine();
