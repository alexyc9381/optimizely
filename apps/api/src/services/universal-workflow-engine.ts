import { EventEmitter } from 'events';
import { Redis } from 'ioredis';

// =============================================================================
// UNIVERSAL WORKFLOW ENGINE INTERFACES
// =============================================================================

export interface WorkflowTrigger {
  id: string;
  type: 'event' | 'schedule' | 'webhook' | 'manual' | 'condition';
  name: string;
  description: string;
  config: {
    eventType?: string;
    schedule?: string; // cron expression
    webhookUrl?: string;
    conditions?: WorkflowCondition[];
    platform?: string; // universal platform support
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  id: string;
  type: 'api_call' | 'email' | 'webhook' | 'data_update' | 'notification' | 'custom';
  name: string;
  description: string;
  config: {
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    template?: string;
    recipients?: string[];
    platform?: string; // universal platform support
  };
  retryConfig: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    initialDelay: number;
  };
  timeout: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  action: WorkflowAction;
  conditions?: WorkflowCondition[];
  onSuccess?: string; // next step ID
  onFailure?: string; // next step ID or 'end'
  isParallel: boolean;
  delay?: number; // delay in milliseconds
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  startStepId: string;
  isActive: boolean;
  platform?: string; // universal platform support
  metadata: {
    category: string;
    tags: string[];
    author: string;
    createdAt: Date;
    updatedAt: Date;
  };
  analytics: {
    executionCount: number;
    successRate: number;
    averageExecutionTime: number;
    lastExecuted?: Date;
  };
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  triggerId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStepId?: string;
  context: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
  logs: WorkflowExecutionLog[];
  retryCount: number;
  platform?: string;
}

export interface WorkflowExecutionLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  stepId?: string;
  message: string;
  data?: any;
}

export interface WorkflowMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  executionsLast24h: number;
  topPerformingWorkflows: Array<{
    workflowId: string;
    name: string;
    executionCount: number;
    successRate: number;
  }>;
}

export interface EventBusMessage {
  id: string;
  type: string;
  source: string;
  data: any;
  timestamp: Date;
  correlationId?: string;
  platform?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// UNIVERSAL WORKFLOW ENGINE SERVICE
// =============================================================================

export class UniversalWorkflowEngine extends EventEmitter {
  private redis: Redis;
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private isInitialized = false;
  private eventBus: EventEmitter;
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor(redisClient: Redis) {
    super();
    this.redis = redisClient;
    this.eventBus = new EventEmitter();
    this.setupEventHandlers();
  }

  // =============================================================================
  // INITIALIZATION & SETUP
  // =============================================================================

  async initialize(): Promise<void> {
    try {
      await this.loadWorkflows();
      await this.loadExecutions();
      await this.setupScheduledTriggers();
      this.isInitialized = true;
      this.emit('engine:initialized');
      console.log('🔧 Universal Workflow Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Universal Workflow Engine:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    // Listen for platform events
    this.eventBus.on('platform:event', this.handlePlatformEvent.bind(this));
    this.eventBus.on('workflow:trigger', this.handleWorkflowTrigger.bind(this));
    this.eventBus.on('execution:complete', this.handleExecutionComplete.bind(this));
  }

  // =============================================================================
  // WORKFLOW MANAGEMENT
  // =============================================================================

  async createWorkflow(workflow: Omit<Workflow, 'id' | 'analytics'>): Promise<Workflow> {
    const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newWorkflow: Workflow = {
      ...workflow,
      id,
      analytics: {
        executionCount: 0,
        successRate: 0,
        averageExecutionTime: 0,
      },
    };

    this.workflows.set(id, newWorkflow);
    await this.persistWorkflow(newWorkflow);

    // Setup triggers for the new workflow
    await this.setupWorkflowTriggers(newWorkflow);

    this.emit('workflow:created', newWorkflow);
    return newWorkflow;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    const updatedWorkflow = {
      ...workflow,
      ...updates,
      id, // Ensure ID doesn't change
      metadata: {
        ...workflow.metadata,
        ...updates.metadata,
        updatedAt: new Date(),
      },
    };

    this.workflows.set(id, updatedWorkflow);
    await this.persistWorkflow(updatedWorkflow);

    // Update triggers
    await this.setupWorkflowTriggers(updatedWorkflow);

    this.emit('workflow:updated', updatedWorkflow);
    return updatedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<void> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    // Cancel any scheduled triggers
    await this.cancelWorkflowTriggers(workflow);

    this.workflows.delete(id);
    await this.redis.del(`workflow:${id}`);

    this.emit('workflow:deleted', { workflowId: id });
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  getWorkflowsByPlatform(platform: string): Workflow[] {
    return Array.from(this.workflows.values()).filter(w => w.platform === platform);
  }

  // =============================================================================
  // WORKFLOW EXECUTION
  // =============================================================================

  async executeWorkflow(
    workflowId: string,
    triggerId: string,
    context: Record<string, any> = {},
    platform?: string
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (!workflow.isActive) {
      throw new Error(`Workflow ${workflowId} is not active`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      triggerId,
      status: 'pending',
      currentStepId: workflow.startStepId,
      context: {
        ...context,
        executionId,
        workflowId,
        triggerId,
        platform,
      },
      startTime: new Date(),
      logs: [],
      retryCount: 0,
      platform,
    };

    this.executions.set(executionId, execution);
    await this.persistExecution(execution);

    this.emit('execution:started', execution);

    // Start execution asynchronously
    setImmediate(() => this.runExecution(executionId));

    return execution;
  }

  private async runExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      console.error(`Execution ${executionId} not found`);
      return;
    }

    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) {
      await this.failExecution(executionId, 'Workflow not found');
      return;
    }

    try {
      execution.status = 'running';
      await this.persistExecution(execution);

      await this.executeStep(execution, workflow);

    } catch (error) {
      await this.failExecution(executionId, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async executeStep(execution: WorkflowExecution, workflow: Workflow): Promise<void> {
    if (!execution.currentStepId) {
      await this.completeExecution(execution.id);
      return;
    }

    const step = workflow.steps.find(s => s.id === execution.currentStepId);
    if (!step) {
      await this.failExecution(execution.id, `Step ${execution.currentStepId} not found`);
      return;
    }

    this.addExecutionLog(execution, 'info', step.id, `Executing step: ${step.name}`);

    // Check step conditions
    if (step.conditions && !this.evaluateConditions(step.conditions, execution.context)) {
      this.addExecutionLog(execution, 'info', step.id, 'Step conditions not met, skipping');
      execution.currentStepId = step.onSuccess || undefined;
      await this.executeStep(execution, workflow);
      return;
    }

    // Add delay if specified
    if (step.delay && step.delay > 0) {
      this.addExecutionLog(execution, 'info', step.id, `Delaying execution by ${step.delay}ms`);
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }

    try {
      // Execute the action
      const result = await this.executeAction(step.action, execution.context);

      this.addExecutionLog(execution, 'info', step.id, 'Step completed successfully', result);

      // Update context with result
      execution.context[`step_${step.id}_result`] = result;

      // Move to next step
      execution.currentStepId = step.onSuccess || undefined;
      await this.persistExecution(execution);

      // Continue execution
      await this.executeStep(execution, workflow);

    } catch (error) {
      this.addExecutionLog(execution, 'error', step.id, 'Step failed', { error: error instanceof Error ? error.message : error });

      // Handle failure
      if (step.onFailure) {
        if (step.onFailure === 'end') {
          await this.failExecution(execution.id, `Step ${step.id} failed: ${error instanceof Error ? error.message : error}`);
        } else {
          execution.currentStepId = step.onFailure;
          await this.executeStep(execution, workflow);
        }
      } else {
        await this.failExecution(execution.id, `Step ${step.id} failed: ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  private async executeAction(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    switch (action.type) {
      case 'api_call':
        return await this.executeApiCall(action, context);
      case 'webhook':
        return await this.executeWebhook(action, context);
      case 'email':
        return await this.executeEmail(action, context);
      case 'notification':
        return await this.executeNotification(action, context);
      case 'data_update':
        return await this.executeDataUpdate(action, context);
      case 'custom':
        return await this.executeCustomAction(action, context);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // =============================================================================
  // ACTION EXECUTORS
  // =============================================================================

  private async executeApiCall(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    const { url, method = 'POST', headers = {}, body } = action.config;

    if (!url) {
      throw new Error('API call action requires URL');
    }

    // Replace variables in URL and body
    const processedUrl = this.replaceVariables(url, context);
    const processedBody = body ? this.replaceVariables(JSON.stringify(body), context) : undefined;

    const response = await fetch(processedUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: processedBody,
      signal: AbortSignal.timeout(action.timeout || 30000),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async executeWebhook(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    return await this.executeApiCall(action, context);
  }

  private async executeEmail(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    const { recipients, template } = action.config;

    if (!recipients || !template) {
      throw new Error('Email action requires recipients and template');
    }

    // Process template with context variables
    const processedTemplate = this.replaceVariables(template, context);

    // Emit email event for email service to handle
    this.eventBus.emit('email:send', {
      recipients,
      template: processedTemplate,
      context,
    });

    return { sent: true, recipients: recipients.length };
  }

  private async executeNotification(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    const { template } = action.config;

    if (!template) {
      throw new Error('Notification action requires template');
    }

    const processedTemplate = this.replaceVariables(template, context);

    // Emit notification event
    this.eventBus.emit('notification:send', {
      message: processedTemplate,
      context,
    });

    return { sent: true };
  }

  private async executeDataUpdate(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    // Emit data update event for data services to handle
    this.eventBus.emit('data:update', {
      action: action.config,
      context,
    });

    return { updated: true };
  }

  private async executeCustomAction(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    // Emit custom action event for external handlers
    this.eventBus.emit('action:custom', {
      action,
      context,
    });

    return { executed: true };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private replaceVariables(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] !== undefined ? String(context[key]) : match;
    });
  }

  private evaluateConditions(conditions: WorkflowCondition[], context: Record<string, any>): boolean {
    let result = true;
    let currentLogical: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const fieldValue = context[condition.field];
      let conditionResult = false;

      switch (condition.operator) {
        case 'equals':
          conditionResult = fieldValue === condition.value;
          break;
        case 'not_equals':
          conditionResult = fieldValue !== condition.value;
          break;
        case 'greater_than':
          conditionResult = Number(fieldValue) > Number(condition.value);
          break;
        case 'less_than':
          conditionResult = Number(fieldValue) < Number(condition.value);
          break;
        case 'contains':
          conditionResult = String(fieldValue).includes(String(condition.value));
          break;
        case 'exists':
          conditionResult = fieldValue !== undefined && fieldValue !== null;
          break;
      }

      if (currentLogical === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      currentLogical = condition.logicalOperator || 'AND';
    }

    return result;
  }

  private addExecutionLog(
    execution: WorkflowExecution,
    level: 'info' | 'warn' | 'error' | 'debug',
    stepId: string | undefined,
    message: string,
    data?: any
  ): void {
    execution.logs.push({
      timestamp: new Date(),
      level,
      stepId,
      message,
      data,
    });
  }

  private async completeExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = 'completed';
    execution.endTime = new Date();
    execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

    await this.persistExecution(execution);
    await this.updateWorkflowAnalytics(execution.workflowId, true, execution.duration);

    this.emit('execution:completed', execution);
  }

  private async failExecution(executionId: string, error: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = 'failed';
    execution.endTime = new Date();
    execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
    execution.error = error;

    await this.persistExecution(execution);
    await this.updateWorkflowAnalytics(execution.workflowId, false, execution.duration);

    this.emit('execution:failed', execution);
  }

  // =============================================================================
  // PERSISTENCE METHODS
  // =============================================================================

  private async persistWorkflow(workflow: Workflow): Promise<void> {
    await this.redis.setex(
      `workflow:${workflow.id}`,
      86400 * 30, // 30 days TTL
      JSON.stringify(workflow)
    );
  }

  private async persistExecution(execution: WorkflowExecution): Promise<void> {
    await this.redis.setex(
      `execution:${execution.id}`,
      86400 * 7, // 7 days TTL
      JSON.stringify(execution)
    );
  }

  private async loadWorkflows(): Promise<void> {
    const keys = await this.redis.keys('workflow:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const workflow = JSON.parse(data) as Workflow;
        this.workflows.set(workflow.id, workflow);
      }
    }
  }

  private async loadExecutions(): Promise<void> {
    const keys = await this.redis.keys('execution:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const execution = JSON.parse(data) as WorkflowExecution;
        this.executions.set(execution.id, execution);
      }
    }
  }

  // =============================================================================
  // TRIGGER MANAGEMENT
  // =============================================================================

  private async setupWorkflowTriggers(workflow: Workflow): Promise<void> {
    // Cancel existing triggers
    await this.cancelWorkflowTriggers(workflow);

    for (const trigger of workflow.triggers) {
      if (!trigger.isActive) continue;

      switch (trigger.type) {
        case 'schedule':
          await this.setupScheduleTrigger(workflow, trigger);
          break;
        case 'event':
          await this.setupEventTrigger(workflow, trigger);
          break;
        case 'webhook':
          await this.setupWebhookTrigger(workflow, trigger);
          break;
      }
    }
  }

  private async cancelWorkflowTriggers(workflow: Workflow): Promise<void> {
    for (const trigger of workflow.triggers) {
      const jobKey = `${workflow.id}:${trigger.id}`;
      const job = this.scheduledJobs.get(jobKey);
      if (job) {
        clearTimeout(job);
        this.scheduledJobs.delete(jobKey);
      }
    }
  }

  private async setupScheduleTrigger(workflow: Workflow, trigger: WorkflowTrigger): Promise<void> {
    // Simplified schedule trigger - in production, use a proper cron library
    if (trigger.config.schedule) {
      // For demo, just set up a simple interval
      const interval = this.parseSchedule(trigger.config.schedule);
      if (interval > 0) {
        const jobKey = `${workflow.id}:${trigger.id}`;
        const job = setInterval(() => {
          this.executeWorkflow(workflow.id, trigger.id, {
            trigger: 'schedule',
            schedule: trigger.config.schedule,
          }, workflow.platform);
        }, interval);

        this.scheduledJobs.set(jobKey, job as any);
      }
    }
  }

  private async setupEventTrigger(workflow: Workflow, trigger: WorkflowTrigger): Promise<void> {
    if (trigger.config.eventType) {
      this.eventBus.on(trigger.config.eventType, (data: any) => {
        this.executeWorkflow(workflow.id, trigger.id, {
          trigger: 'event',
          eventType: trigger.config.eventType,
          eventData: data,
        }, workflow.platform);
      });
    }
  }

  private async setupWebhookTrigger(workflow: Workflow, trigger: WorkflowTrigger): Promise<void> {
    // Webhook triggers are handled by the webhook endpoint
    // Just register the trigger for reference
    this.emit('webhook:register', {
      workflowId: workflow.id,
      triggerId: trigger.id,
      url: trigger.config.webhookUrl,
    });
  }

  private parseSchedule(schedule: string): number {
    // Simplified schedule parser - in production, use a proper cron parser
    if (schedule.includes('minute')) {
      const minutes = parseInt(schedule.match(/\d+/)?.[0] || '1');
      return minutes * 60 * 1000;
    }
    if (schedule.includes('hour')) {
      const hours = parseInt(schedule.match(/\d+/)?.[0] || '1');
      return hours * 60 * 60 * 1000;
    }
    return 0;
  }

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  private async handlePlatformEvent(event: EventBusMessage): Promise<void> {
    // Find workflows that should be triggered by this event
    const triggeredWorkflows = Array.from(this.workflows.values()).filter(workflow =>
      workflow.isActive &&
      workflow.triggers.some(trigger =>
        trigger.isActive &&
        trigger.type === 'event' &&
        trigger.config.eventType === event.type &&
        (!trigger.config.platform || trigger.config.platform === event.platform)
      )
    );

    for (const workflow of triggeredWorkflows) {
      const trigger = workflow.triggers.find(t =>
        t.type === 'event' && t.config.eventType === event.type
      );

      if (trigger) {
        await this.executeWorkflow(workflow.id, trigger.id, {
          trigger: 'event',
          eventData: event.data,
          eventSource: event.source,
          platform: event.platform,
        }, event.platform);
      }
    }
  }

  private async handleWorkflowTrigger(data: { workflowId: string; triggerId: string; context?: any }): Promise<void> {
    await this.executeWorkflow(data.workflowId, data.triggerId, data.context || {});
  }

  private async handleExecutionComplete(execution: WorkflowExecution): Promise<void> {
    // Clean up old executions to prevent memory leaks
    if (this.executions.size > 1000) {
      const oldExecutions = Array.from(this.executions.values())
        .filter(e => e.status === 'completed' || e.status === 'failed')
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
        .slice(0, 100);

      for (const oldExec of oldExecutions) {
        this.executions.delete(oldExec.id);
      }
    }
  }

  // =============================================================================
  // ANALYTICS & METRICS
  // =============================================================================

  private async updateWorkflowAnalytics(workflowId: string, success: boolean, duration: number): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    workflow.analytics.executionCount++;
    workflow.analytics.lastExecuted = new Date();

    // Update success rate
    const successfulExecutions = Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId && e.status === 'completed').length;
    workflow.analytics.successRate = (successfulExecutions / workflow.analytics.executionCount) * 100;

    // Update average execution time
    const totalDuration = Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId && e.duration)
      .reduce((sum, e) => sum + (e.duration || 0), 0);
    workflow.analytics.averageExecutionTime = totalDuration / workflow.analytics.executionCount;

    await this.persistWorkflow(workflow);
  }

  async getMetrics(): Promise<WorkflowMetrics> {
    const workflows = Array.from(this.workflows.values());
    const executions = Array.from(this.executions.values());

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const executionsLast24h = executions.filter(e => e.startTime >= yesterday).length;
    const successfulExecutions = executions.filter(e => e.status === 'completed').length;
    const totalDuration = executions
      .filter(e => e.duration)
      .reduce((sum, e) => sum + (e.duration || 0), 0);

    const topPerformingWorkflows = workflows
      .map(w => ({
        workflowId: w.id,
        name: w.name,
        executionCount: w.analytics.executionCount,
        successRate: w.analytics.successRate,
      }))
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, 10);

    return {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.isActive).length,
      totalExecutions: executions.length,
      successfulExecutions,
      failedExecutions: executions.filter(e => e.status === 'failed').length,
      averageExecutionTime: executions.length > 0 ? totalDuration / executions.length : 0,
      executionsLast24h,
      topPerformingWorkflows,
    };
  }

  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================

  async triggerWorkflow(workflowId: string, context: Record<string, any> = {}): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Use manual trigger
    const manualTrigger = workflow.triggers.find(t => t.type === 'manual');
    const triggerId = manualTrigger?.id || 'manual';

    return await this.executeWorkflow(workflowId, triggerId, context);
  }

  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    if (execution.status === 'running' || execution.status === 'pending') {
      execution.status = 'cancelled';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

      await this.persistExecution(execution);
      this.emit('execution:cancelled', execution);
    }
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getExecutionsByWorkflow(workflowId: string): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter(e => e.workflowId === workflowId);
  }

  async setupScheduledTriggers(): Promise<void> {
    for (const workflow of this.workflows.values()) {
      if (workflow.isActive) {
        await this.setupWorkflowTriggers(workflow);
      }
    }
  }

  // =============================================================================
  // HEALTH CHECK
  // =============================================================================

  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const metrics = await this.getMetrics();
      return {
        status: 'healthy',
        details: {
          initialized: this.isInitialized,
          workflows: metrics.totalWorkflows,
          activeWorkflows: metrics.activeWorkflows,
          runningExecutions: Array.from(this.executions.values()).filter(e => e.status === 'running').length,
          scheduledJobs: this.scheduledJobs.size,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // =============================================================================
  // CLEANUP
  // =============================================================================

  async shutdown(): Promise<void> {
    // Cancel all scheduled jobs
    for (const job of this.scheduledJobs.values()) {
      clearTimeout(job);
    }
    this.scheduledJobs.clear();

    // Cancel running executions
    for (const execution of this.executions.values()) {
      if (execution.status === 'running' || execution.status === 'pending') {
        await this.cancelExecution(execution.id);
      }
    }

    this.removeAllListeners();
    this.eventBus.removeAllListeners();

    console.log('🔧 Universal Workflow Engine shut down');
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createUniversalWorkflowEngine(redisClient: Redis): UniversalWorkflowEngine {
  return new UniversalWorkflowEngine(redisClient);
}

export default UniversalWorkflowEngine;
