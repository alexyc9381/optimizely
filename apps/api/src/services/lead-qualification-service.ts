import { EventEmitter } from 'events';
import Redis from 'ioredis';

// =============================================================================
// CORE INTERFACES - Universal Lead Qualification System
// =============================================================================

export interface QualificationCriteria {
  id: string;
  name: string;
  description: string;
  type: 'score_threshold' | 'demographic' | 'behavioral' | 'firmographic' | 'engagement' | 'custom';
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'in' | 'not_in';
    value: any;
    weight?: number;
  }>;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QualificationStage {
  id: string;
  name: string;
  description: string;
  order: number;
  criteria: string[]; // IDs of qualification criteria
  requiredScore: number;
  actions: Array<{
    type: 'notification' | 'assignment' | 'tag' | 'score_update' | 'workflow_trigger' | 'email' | 'webhook';
    config: Record<string, any>;
    delay?: number; // milliseconds
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QualificationWorkflow {
  id: string;
  name: string;
  description: string;
  stages: string[]; // IDs of qualification stages in order
  triggerEvents: string[];
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadScore {
  leadId: string;
  totalScore: number;
  scoreBreakdown: Record<string, {
    score: number;
    weight: number;
    reason: string;
  }>;
  qualificationLevel: 'unqualified' | 'marketing_qualified' | 'sales_qualified' | 'opportunity' | 'customer';
  lastUpdated: Date;
  history: Array<{
    timestamp: Date;
    score: number;
    reason: string;
    changes: Record<string, any>;
  }>;
}

export interface QualificationResult {
  leadId: string;
  workflowId: string;
  currentStage: string;
  stageHistory: Array<{
    stageId: string;
    enteredAt: Date;
    exitedAt?: Date;
    score: number;
    actions: Array<{
      type: 'notification' | 'assignment' | 'tag' | 'score_update' | 'workflow_trigger' | 'email' | 'webhook';
      executedAt: Date;
      success: boolean;
      result?: any;
    }>;
  }>;
  isQualified: boolean;
  qualificationDate?: Date;
  disqualificationReason?: string;
  metadata: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  leadId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStage?: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata: Record<string, any>;
}

export interface QualificationAnalytics {
  totalLeads: number;
  qualifiedLeads: number;
  qualificationRate: number;
  averageQualificationTime: number;
  stageConversionRates: Record<string, {
    entered: number;
    converted: number;
    conversionRate: number;
    averageTimeInStage: number;
  }>;
  workflowPerformance: Record<string, {
    executions: number;
    completions: number;
    completionRate: number;
    averageExecutionTime: number;
  }>;
  scoreDistribution: Record<string, number>;
  topDisqualificationReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
}

export interface QualificationFilters {
  workflowIds?: string[];
  stages?: string[];
  qualificationLevels?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  isQualified?: boolean;
  search?: string;
}

// =============================================================================
// UNIVERSAL LEAD QUALIFICATION SERVICE
// =============================================================================

export class LeadQualificationService extends EventEmitter {
  private redis: Redis;
  private criteria: Map<string, QualificationCriteria> = new Map();
  private stages: Map<string, QualificationStage> = new Map();
  private workflows: Map<string, QualificationWorkflow> = new Map();
  private leadScores: Map<string, LeadScore> = new Map();
  private qualificationResults: Map<string, QualificationResult> = new Map();
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private processingInterval?: NodeJS.Timeout;

  constructor(redis: Redis) {
    super();
    this.redis = redis;
    this.initializeDefaultCriteria();
    this.initializeDefaultStages();
    this.initializeDefaultWorkflows();
    this.startProcessingEngine();
  }

  // =============================================================================
  // INITIALIZATION METHODS
  // =============================================================================

  private initializeDefaultCriteria(): void {
    const defaultCriteria: QualificationCriteria[] = [
      {
        id: 'lead_score_threshold',
        name: 'Lead Score Threshold',
        description: 'Minimum lead score required for qualification',
        type: 'score_threshold',
        conditions: [
          { field: 'leadScore', operator: 'greater_than', value: 70, weight: 1.0 }
        ],
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'company_size',
        name: 'Company Size',
        description: 'Target company employee count',
        type: 'firmographic',
        conditions: [
          { field: 'companySize', operator: 'greater_than', value: 50, weight: 0.8 }
        ],
        isActive: true,
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'engagement_level',
        name: 'Engagement Level',
        description: 'Recent engagement activity threshold',
        type: 'behavioral',
        conditions: [
          { field: 'pageViews', operator: 'greater_than', value: 5, weight: 0.6 },
          { field: 'emailOpens', operator: 'greater_than', value: 3, weight: 0.4 }
        ],
        isActive: true,
        priority: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'budget_authority',
        name: 'Budget Authority',
        description: 'Decision-making authority and budget availability',
        type: 'demographic',
        conditions: [
          { field: 'jobTitle', operator: 'contains', value: 'director|manager|vp|ceo|cto|cmo', weight: 0.9 }
        ],
        isActive: true,
        priority: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultCriteria.forEach(criteria => {
      this.criteria.set(criteria.id, criteria);
    });
  }

  private initializeDefaultStages(): void {
    const defaultStages: QualificationStage[] = [
      {
        id: 'initial_scoring',
        name: 'Initial Scoring',
        description: 'Basic lead scoring and initial qualification',
        order: 1,
        criteria: ['lead_score_threshold'],
        requiredScore: 50,
        actions: [
          {
            type: 'score_update',
            config: { reason: 'Initial qualification scoring' }
          },
          {
            type: 'tag',
            config: { tags: ['mql_candidate'] }
          }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'demographic_qualification',
        name: 'Demographic Qualification',
        description: 'Evaluate demographic and firmographic fit',
        order: 2,
        criteria: ['company_size', 'budget_authority'],
        requiredScore: 70,
        actions: [
          {
            type: 'notification',
            config: {
              channel: 'email',
              template: 'mql_alert',
              recipients: ['sales_team']
            }
          },
          {
            type: 'tag',
            config: { tags: ['marketing_qualified'] }
          }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'behavioral_assessment',
        name: 'Behavioral Assessment',
        description: 'Assess engagement and buying intent',
        order: 3,
        criteria: ['engagement_level'],
        requiredScore: 80,
        actions: [
          {
            type: 'assignment',
            config: { assignTo: 'sales_rep', method: 'round_robin' }
          },
          {
            type: 'notification',
            config: {
              channel: 'sms',
              template: 'hot_lead_alert',
              recipients: ['assigned_rep']
            }
          },
          {
            type: 'tag',
            config: { tags: ['sales_qualified'] }
          }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'sales_ready',
        name: 'Sales Ready',
        description: 'Final qualification for sales handoff',
        order: 4,
        criteria: ['lead_score_threshold', 'company_size', 'engagement_level'],
        requiredScore: 90,
        actions: [
          {
            type: 'workflow_trigger',
            config: { workflowId: 'sales_handoff_sequence' }
          },
          {
            type: 'webhook',
            config: {
              url: '/api/v1/crm/create-opportunity',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }
          }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultStages.forEach(stage => {
      this.stages.set(stage.id, stage);
    });
  }

  private initializeDefaultWorkflows(): void {
    const defaultWorkflows: QualificationWorkflow[] = [
      {
        id: 'standard_b2b_qualification',
        name: 'Standard B2B Lead Qualification',
        description: 'Complete B2B lead qualification workflow from MQL to SQL',
        stages: ['initial_scoring', 'demographic_qualification', 'behavioral_assessment', 'sales_ready'],
        triggerEvents: ['lead_created', 'lead_scored', 'visitor_identified'],
        isActive: true,
        metadata: {
          industry: 'b2b_saas',
          targetMarket: 'enterprise',
          averageConversionTime: '7 days'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'high_value_enterprise',
        name: 'High-Value Enterprise Qualification',
        description: 'Accelerated qualification for high-value enterprise prospects',
        stages: ['demographic_qualification', 'sales_ready'],
        triggerEvents: ['high_value_lead_identified', 'enterprise_signup'],
        isActive: true,
        metadata: {
          industry: 'enterprise',
          targetMarket: 'fortune_500',
          averageConversionTime: '3 days'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultWorkflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }

  private startProcessingEngine(): void {
    this.processingInterval = setInterval(() => {
      this.processActiveExecutions();
    }, 5000); // Process every 5 seconds
  }

  // =============================================================================
  // CRITERIA MANAGEMENT
  // =============================================================================

  async createCriteria(criteriaData: Omit<QualificationCriteria, 'id' | 'createdAt' | 'updatedAt'>): Promise<QualificationCriteria> {
    const criteria: QualificationCriteria = {
      id: `criteria_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...criteriaData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.criteria.set(criteria.id, criteria);
    await this.redis.setex(`qualification:criteria:${criteria.id}`, 3600, JSON.stringify(criteria));

    this.emit('criteria_created', criteria);
    return criteria;
  }

  async updateCriteria(criteriaId: string, updates: Partial<QualificationCriteria>): Promise<QualificationCriteria | null> {
    const criteria = this.criteria.get(criteriaId);
    if (!criteria) return null;

    const updatedCriteria = { ...criteria, ...updates, updatedAt: new Date() };
    this.criteria.set(criteriaId, updatedCriteria);
    await this.redis.setex(`qualification:criteria:${criteriaId}`, 3600, JSON.stringify(updatedCriteria));

    this.emit('criteria_updated', updatedCriteria);
    return updatedCriteria;
  }

  getCriteria(filters?: { type?: string; isActive?: boolean }): QualificationCriteria[] {
    let criteria = Array.from(this.criteria.values());

    if (filters?.type) {
      criteria = criteria.filter(c => c.type === filters.type);
    }

    if (filters?.isActive !== undefined) {
      criteria = criteria.filter(c => c.isActive === filters.isActive);
    }

    return criteria.sort((a, b) => a.priority - b.priority);
  }

  getCriteriaById(criteriaId: string): QualificationCriteria | null {
    return this.criteria.get(criteriaId) || null;
  }

  // =============================================================================
  // STAGE MANAGEMENT
  // =============================================================================

  async createStage(stageData: Omit<QualificationStage, 'id' | 'createdAt' | 'updatedAt'>): Promise<QualificationStage> {
    const stage: QualificationStage = {
      id: `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...stageData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.stages.set(stage.id, stage);
    await this.redis.setex(`qualification:stage:${stage.id}`, 3600, JSON.stringify(stage));

    this.emit('stage_created', stage);
    return stage;
  }

  async updateStage(stageId: string, updates: Partial<QualificationStage>): Promise<QualificationStage | null> {
    const stage = this.stages.get(stageId);
    if (!stage) return null;

    const updatedStage = { ...stage, ...updates, updatedAt: new Date() };
    this.stages.set(stageId, updatedStage);
    await this.redis.setex(`qualification:stage:${stageId}`, 3600, JSON.stringify(updatedStage));

    this.emit('stage_updated', updatedStage);
    return updatedStage;
  }

  getStages(filters?: { isActive?: boolean }): QualificationStage[] {
    let stages = Array.from(this.stages.values());

    if (filters?.isActive !== undefined) {
      stages = stages.filter(s => s.isActive === filters.isActive);
    }

    return stages.sort((a, b) => a.order - b.order);
  }

  getStageById(stageId: string): QualificationStage | null {
    return this.stages.get(stageId) || null;
  }

  // =============================================================================
  // WORKFLOW MANAGEMENT
  // =============================================================================

  async createWorkflow(workflowData: Omit<QualificationWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<QualificationWorkflow> {
    const workflow: QualificationWorkflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...workflowData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.workflows.set(workflow.id, workflow);
    await this.redis.setex(`qualification:workflow:${workflow.id}`, 3600, JSON.stringify(workflow));

    this.emit('workflow_created', workflow);
    return workflow;
  }

  async updateWorkflow(workflowId: string, updates: Partial<QualificationWorkflow>): Promise<QualificationWorkflow | null> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const updatedWorkflow = { ...workflow, ...updates, updatedAt: new Date() };
    this.workflows.set(workflowId, updatedWorkflow);
    await this.redis.setex(`qualification:workflow:${workflowId}`, 3600, JSON.stringify(updatedWorkflow));

    this.emit('workflow_updated', updatedWorkflow);
    return updatedWorkflow;
  }

  getWorkflows(filters?: { isActive?: boolean }): QualificationWorkflow[] {
    let workflows = Array.from(this.workflows.values());

    if (filters?.isActive !== undefined) {
      workflows = workflows.filter(w => w.isActive === filters.isActive);
    }

    return workflows;
  }

  getWorkflowById(workflowId: string): QualificationWorkflow | null {
    return this.workflows.get(workflowId) || null;
  }

  // =============================================================================
  // LEAD SCORING AND QUALIFICATION
  // =============================================================================

  async scoreLead(leadId: string, leadData: Record<string, any>): Promise<LeadScore> {
    const scoreBreakdown: Record<string, { score: number; weight: number; reason: string }> = {};
    let totalScore = 0;

    // Evaluate against all active criteria
    const activeCriteria = this.getCriteria({ isActive: true });

    for (const criteria of activeCriteria) {
      const criteriaScore = this.evaluateCriteria(criteria, leadData);
      if (criteriaScore > 0) {
        scoreBreakdown[criteria.id] = {
          score: criteriaScore,
          weight: 1.0, // Could be configurable per criteria
          reason: criteria.description
        };
        totalScore += criteriaScore;
      }
    }

    // Determine qualification level
    const qualificationLevel = this.determineQualificationLevel(totalScore);

    const existingScore = this.leadScores.get(leadId);
    const leadScore: LeadScore = {
      leadId,
      totalScore,
      scoreBreakdown,
      qualificationLevel,
      lastUpdated: new Date(),
      history: [
        ...(existingScore?.history || []),
        {
          timestamp: new Date(),
          score: totalScore,
          reason: 'Lead scoring update',
          changes: leadData
        }
      ]
    };

    this.leadScores.set(leadId, leadScore);
    await this.redis.setex(`qualification:score:${leadId}`, 3600, JSON.stringify(leadScore));

    this.emit('lead_scored', { leadId, score: leadScore });
    return leadScore;
  }

  private evaluateCriteria(criteria: QualificationCriteria, leadData: Record<string, any>): number {
    let score = 0;

    for (const condition of criteria.conditions) {
      const fieldValue = this.getNestedValue(leadData, condition.field);
      const conditionMet = this.evaluateCondition(fieldValue, condition.operator, condition.value);

      if (conditionMet) {
        score += (condition.weight || 1.0) * 10; // Base score of 10 per condition
      }
    }

    return score;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateCondition(fieldValue: any, operator: string, conditionValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      default:
        return false;
    }
  }

  private determineQualificationLevel(score: number): LeadScore['qualificationLevel'] {
    if (score >= 90) return 'opportunity';
    if (score >= 80) return 'sales_qualified';
    if (score >= 60) return 'marketing_qualified';
    return 'unqualified';
  }

  // =============================================================================
  // WORKFLOW EXECUTION
  // =============================================================================

  async executeWorkflow(leadId: string, workflowId: string, triggerEvent?: string): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || !workflow.isActive) {
      throw new Error(`Workflow ${workflowId} not found or inactive`);
    }

    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      leadId,
      workflowId,
      status: 'pending',
      startedAt: new Date(),
      metadata: {
        triggerEvent: triggerEvent || 'manual',
        stagesCompleted: 0,
        totalStages: workflow.stages.length
      }
    };

    this.activeExecutions.set(execution.id, execution);

    // Initialize qualification result
    const qualificationResult: QualificationResult = {
      leadId,
      workflowId,
      currentStage: workflow.stages[0],
      stageHistory: [],
      isQualified: false,
      metadata: {
        executionId: execution.id,
        startedAt: execution.startedAt
      }
    };

    this.qualificationResults.set(leadId, qualificationResult);

    this.emit('workflow_started', { execution, qualificationResult });
    return execution;
  }

  private async processActiveExecutions(): Promise<void> {
    for (const execution of this.activeExecutions.values()) {
      if (execution.status === 'pending' || execution.status === 'running') {
        await this.processExecution(execution);
      }
    }
  }

  private async processExecution(execution: WorkflowExecution): Promise<void> {
    try {
      execution.status = 'running';

      const workflow = this.workflows.get(execution.workflowId);
      const qualificationResult = this.qualificationResults.get(execution.leadId);

      if (!workflow || !qualificationResult) {
        execution.status = 'failed';
        execution.error = 'Workflow or qualification result not found';
        return;
      }

      const currentStageIndex = workflow.stages.indexOf(qualificationResult.currentStage);
      if (currentStageIndex === -1) {
        execution.status = 'failed';
        execution.error = 'Current stage not found in workflow';
        return;
      }

      const stage = this.stages.get(qualificationResult.currentStage);
      if (!stage) {
        execution.status = 'failed';
        execution.error = 'Stage configuration not found';
        return;
      }

      // Get lead score
      const leadScore = this.leadScores.get(execution.leadId);
      if (!leadScore) {
        execution.status = 'failed';
        execution.error = 'Lead score not found';
        return;
      }

      // Check if stage requirements are met
      const stageQualified = await this.evaluateStage(stage, leadScore);

      if (stageQualified) {
        // Execute stage actions
        const stageEntry: {
          stageId: string;
          enteredAt: Date;
          score: number;
          actions: Array<{
            type: 'notification' | 'assignment' | 'tag' | 'score_update' | 'workflow_trigger' | 'email' | 'webhook';
            executedAt: Date;
            success: boolean;
            result?: any;
          }>;
        } = {
          stageId: stage.id,
          enteredAt: new Date(),
          score: leadScore.totalScore,
          actions: []
        };

        for (const action of stage.actions) {
          const actionResult = await this.executeAction(action, execution.leadId, leadScore);
          stageEntry.actions.push({
            type: action.type,
            executedAt: new Date(),
            success: actionResult.success,
            result: actionResult.result
          });
        }

        qualificationResult.stageHistory.push(stageEntry);

        // Move to next stage or complete
        if (currentStageIndex < workflow.stages.length - 1) {
          qualificationResult.currentStage = workflow.stages[currentStageIndex + 1];
          execution.metadata.stagesCompleted = currentStageIndex + 1;
        } else {
          // Workflow completed
          qualificationResult.isQualified = true;
          qualificationResult.qualificationDate = new Date();
          execution.status = 'completed';
          execution.completedAt = new Date();
          execution.metadata.stagesCompleted = workflow.stages.length;

          this.activeExecutions.delete(execution.id);
          this.emit('workflow_completed', { execution, qualificationResult });
        }
      } else {
        // Stage not qualified, check for disqualification
        if (leadScore.totalScore < stage.requiredScore) {
          qualificationResult.isQualified = false;
          qualificationResult.disqualificationReason = `Failed to meet stage requirements: ${stage.name}`;
          execution.status = 'completed';
          execution.completedAt = new Date();

          this.activeExecutions.delete(execution.id);
          this.emit('workflow_disqualified', { execution, qualificationResult });
        }
      }

      // Update stored data
      await this.redis.setex(`qualification:execution:${execution.id}`, 3600, JSON.stringify(execution));
      await this.redis.setex(`qualification:result:${execution.leadId}`, 3600, JSON.stringify(qualificationResult));

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.completedAt = new Date();

      this.activeExecutions.delete(execution.id);
      this.emit('workflow_failed', { execution, error });
    }
  }

  private async evaluateStage(stage: QualificationStage, leadScore: LeadScore): Promise<boolean> {
    // Check if lead score meets stage requirements
    if (leadScore.totalScore < stage.requiredScore) {
      return false;
    }

    // Check if all stage criteria are met
    for (const criteriaId of stage.criteria) {
      if (!leadScore.scoreBreakdown[criteriaId] || leadScore.scoreBreakdown[criteriaId].score <= 0) {
        return false;
      }
    }

    return true;
  }

  private async executeAction(action: QualificationStage['actions'][0], leadId: string, leadScore: LeadScore): Promise<{ success: boolean; result?: any }> {
    try {
      switch (action.type) {
        case 'notification':
          // Trigger notification (integrate with notification service)
          return { success: true, result: 'Notification sent' };

        case 'assignment':
          // Assign lead to sales rep (integrate with territory management)
          return { success: true, result: 'Lead assigned' };

        case 'tag':
          // Add tags to lead
          return { success: true, result: 'Tags added' };

        case 'score_update':
          // Update lead score
          return { success: true, result: 'Score updated' };

        case 'workflow_trigger':
          // Trigger another workflow
          return { success: true, result: 'Workflow triggered' };

        case 'email':
          // Send email
          return { success: true, result: 'Email sent' };

        case 'webhook':
          // Call webhook
          return { success: true, result: 'Webhook called' };

        default:
          return { success: false, result: 'Unknown action type' };
      }
    } catch (error) {
      return { success: false, result: error instanceof Error ? error.message : 'Action failed' };
    }
  }

  // =============================================================================
  // ANALYTICS AND REPORTING
  // =============================================================================

  async getAnalytics(filters?: {
    workflowIds?: string[];
    dateRange?: { start: Date; end: Date };
  }): Promise<QualificationAnalytics> {
    // Implementation would query stored data for analytics
    // For now, return mock analytics
    return {
      totalLeads: 1500,
      qualifiedLeads: 450,
      qualificationRate: 30.0,
      averageQualificationTime: 5.2, // days
      stageConversionRates: {
        initial_scoring: { entered: 1500, converted: 1200, conversionRate: 80.0, averageTimeInStage: 0.5 },
        demographic_qualification: { entered: 1200, converted: 800, conversionRate: 66.7, averageTimeInStage: 1.5 },
        behavioral_assessment: { entered: 800, converted: 600, conversionRate: 75.0, averageTimeInStage: 2.0 },
        sales_ready: { entered: 600, converted: 450, conversionRate: 75.0, averageTimeInStage: 1.2 }
      },
      workflowPerformance: {
        standard_b2b_qualification: { executions: 1200, completions: 400, completionRate: 33.3, averageExecutionTime: 5.2 },
        high_value_enterprise: { executions: 300, completions: 50, completionRate: 16.7, averageExecutionTime: 3.1 }
      },
      scoreDistribution: {
        '0-20': 300,
        '21-40': 400,
        '41-60': 350,
        '61-80': 300,
        '81-100': 150
      },
      topDisqualificationReasons: [
        { reason: 'Low engagement score', count: 250, percentage: 35.7 },
        { reason: 'Company size too small', count: 180, percentage: 25.7 },
        { reason: 'No budget authority', count: 120, percentage: 17.1 },
        { reason: 'Wrong industry', count: 80, percentage: 11.4 },
        { reason: 'Geographic mismatch', count: 70, percentage: 10.0 }
      ]
    };
  }

  getQualificationResults(filters?: QualificationFilters): QualificationResult[] {
    let results = Array.from(this.qualificationResults.values());

    if (filters?.workflowIds) {
      results = results.filter(r => filters.workflowIds!.includes(r.workflowId));
    }

    if (filters?.isQualified !== undefined) {
      results = results.filter(r => r.isQualified === filters.isQualified);
    }

    return results;
  }

  getLeadScores(leadIds?: string[]): LeadScore[] {
    if (leadIds) {
      return leadIds.map(id => this.leadScores.get(id)).filter(Boolean) as LeadScore[];
    }
    return Array.from(this.leadScores.values());
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    criteria: number;
    stages: number;
    workflows: number;
    activeExecutions: number;
    processingStatus: 'active' | 'inactive';
  }> {
    return {
      status: 'healthy',
      criteria: this.criteria.size,
      stages: this.stages.size,
      workflows: this.workflows.size,
      activeExecutions: this.activeExecutions.size,
      processingStatus: this.processingInterval ? 'active' : 'inactive',
    };
  }

  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    this.removeAllListeners();
  }

  // =============================================================================
  // MOCK DATA GENERATION
  // =============================================================================

  generateMockData(): void {
    // Generate mock lead scores
    const mockLeadIds = ['lead_001', 'lead_002', 'lead_003', 'lead_004', 'lead_005'];

    mockLeadIds.forEach((leadId, index) => {
      const score = 50 + (index * 10) + Math.random() * 20;
      const leadScore: LeadScore = {
        leadId,
        totalScore: score,
        scoreBreakdown: {
          lead_score_threshold: { score: score * 0.4, weight: 1.0, reason: 'Base lead score' },
          company_size: { score: score * 0.3, weight: 0.8, reason: 'Company size evaluation' },
          engagement_level: { score: score * 0.3, weight: 0.6, reason: 'Engagement activity' }
        },
        qualificationLevel: this.determineQualificationLevel(score),
        lastUpdated: new Date(),
        history: [
          {
            timestamp: new Date(),
            score,
            reason: 'Initial scoring',
            changes: { leadCreated: true }
          }
        ]
      };

      this.leadScores.set(leadId, leadScore);

      // Create qualification result
      const qualificationResult: QualificationResult = {
        leadId,
        workflowId: 'standard_b2b_qualification',
        currentStage: score >= 80 ? 'sales_ready' : score >= 60 ? 'behavioral_assessment' : 'initial_scoring',
        stageHistory: [],
        isQualified: score >= 80,
        qualificationDate: score >= 80 ? new Date() : undefined,
        metadata: { mockData: true }
      };

      this.qualificationResults.set(leadId, qualificationResult);
    });
  }
}

export default LeadQualificationService;
