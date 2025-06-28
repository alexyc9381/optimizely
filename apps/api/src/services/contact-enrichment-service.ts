import { EventEmitter } from 'events';
import { redisManager } from './redis-client';

// =============================================================================
// CORE INTERFACES - Universal Contact Enrichment System
// =============================================================================

export interface ContactEnrichmentRequest {
  id: string;
  contactId: string;
  email?: string;
  phone?: string;
  company?: string;
  domain?: string;
  firstName?: string;
  lastName?: string;
  linkedInUrl?: string;
  enrichmentTypes: EnrichmentType[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  sourceSystem: string;
  targetSystems: string[];
  metadata?: Record<string, any>;
}

export interface EnrichmentType {
  type: 'contact_info' | 'company_info' | 'social_profiles' | 'job_title' | 'skills' | 'education' | 'demographics' | 'technographics' | 'intent_data' | 'custom';
  provider: string;
  isRequired: boolean;
  fallbackProviders?: string[];
  confidence: number;
  weight: number;
}

export interface EnrichmentProvider {
  id: string;
  name: string;
  type: 'clearbit' | 'zoominfo' | 'apollo' | 'hunter' | 'pipl' | 'fullcontact' | 'custom';
  apiUrl: string;
  apiKey: string;
  isActive: boolean;
  rateLimit: number;
  costPerRequest: number;
  supportedTypes: string[];
  reliability: number;
  averageResponseTime: number;
  lastHealthCheck: Date;
  configuration: Record<string, any>;
}

export interface EnrichmentResult {
  id: string;
  requestId: string;
  providerId: string;
  enrichmentType: string;
  status: 'pending' | 'completed' | 'failed' | 'partial';
  confidence: number;
  dataQuality: number;
  data: Record<string, any>;
  sourceData: Record<string, any>;
  enrichedFields: string[];
  missingFields: string[];
  processingTime: number;
  cost: number;
  timestamp: Date;
  error?: string;
}

export interface EnrichmentWorkflow {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  executionCount: number;
  successRate: number;
}

export interface WorkflowTrigger {
  type: 'manual' | 'new_contact' | 'updated_contact' | 'missing_data' | 'scheduled' | 'webhook';
  conditions: TriggerCondition[];
  isActive: boolean;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'exists' | 'not_exists' | 'greater_than' | 'less_than';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'enrichment' | 'validation' | 'transformation' | 'distribution' | 'notification';
  configuration: Record<string, any>;
  isRequired: boolean;
  retryCount: number;
  timeout: number;
  onSuccess?: string; // next step id
  onFailure?: string; // next step id
}

export interface EnrichmentExecution {
  id: string;
  requestId: string;
  workflowId?: string;
  contactId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  results: EnrichmentResult[];
  errors: EnrichmentError[];
  cost: number;
  qualityScore: number;
  metadata: Record<string, any>;
}

export interface EnrichmentError {
  id: string;
  executionId: string;
  providerId: string;
  errorType: 'api_error' | 'rate_limit' | 'invalid_data' | 'network_error' | 'timeout' | 'quota_exceeded';
  errorMessage: string;
  timestamp: Date;
  isRetryable: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface DataQualityRule {
  id: string;
  name: string;
  field: string;
  validationType: 'format' | 'completeness' | 'accuracy' | 'consistency' | 'freshness';
  criteria: Record<string, any>;
  weight: number;
  isActive: boolean;
}

export interface QualityAssessment {
  contactId: string;
  overallScore: number;
  fieldScores: Record<string, number>;
  missingFields: string[];
  invalidFields: string[];
  lastAssessed: Date;
  recommendations: string[];
}

export interface EnrichmentMetrics {
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  averageQualityScore: number;
  totalCost: number;
  providerMetrics: Record<string, ProviderMetrics>;
  workflowMetrics: Record<string, WorkflowMetrics>;
  qualityTrends: QualityTrend[];
  lastCalculated: Date;
}

export interface ProviderMetrics {
  requests: number;
  successes: number;
  failures: number;
  averageResponseTime: number;
  averageQuality: number;
  totalCost: number;
  reliability: number;
}

export interface WorkflowMetrics {
  executions: number;
  successes: number;
  failures: number;
  averageExecutionTime: number;
  averageQualityScore: number;
  successRate: number;
}

export interface QualityTrend {
  date: Date;
  averageScore: number;
  completeness: number;
  accuracy: number;
  freshness: number;
}

export interface EnrichmentFilters {
  contactId?: string;
  status?: string;
  providerId?: string;
  enrichmentType?: string;
  startDate?: Date;
  endDate?: Date;
  minQuality?: number;
  maxCost?: number;
}

// =============================================================================
// UNIVERSAL CONTACT ENRICHMENT SERVICE
// =============================================================================

export class ContactEnrichmentService extends EventEmitter {
  private providers: Map<string, EnrichmentProvider> = new Map();
  private workflows: Map<string, EnrichmentWorkflow> = new Map();
  private executions: Map<string, EnrichmentExecution> = new Map();
  private qualityRules: Map<string, DataQualityRule> = new Map();
  private qualityAssessments: Map<string, QualityAssessment> = new Map();
  private metrics: EnrichmentMetrics | null = null;
  private metricsInterval?: NodeJS.Timeout;
  private isInitialized = false;

  constructor() {
    super();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.initializeProviders();
      await this.initializeQualityRules();
      await this.generateMockData();
      await this.calculateMetrics();
      this.startMetricsCalculation();
      this.isInitialized = true;
      this.emit('service_initialized');
    } catch (error) {
      console.error('Failed to initialize ContactEnrichmentService:', error);
      throw error;
    }
  }

  // =============================================================================
  // PROVIDER MANAGEMENT
  // =============================================================================

  private async initializeProviders(): Promise<void> {
    const defaultProviders: EnrichmentProvider[] = [
      {
        id: 'clearbit',
        name: 'Clearbit',
        type: 'clearbit',
        apiUrl: 'https://person.clearbit.com/v2/combined/find',
        apiKey: process.env.CLEARBIT_API_KEY || 'clearbit_api_key',
        isActive: true,
        rateLimit: 100,
        costPerRequest: 0.50,
        supportedTypes: ['contact_info', 'company_info', 'social_profiles', 'job_title'],
        reliability: 0.95,
        averageResponseTime: 850,
        lastHealthCheck: new Date(),
        configuration: {
          timeout: 5000,
          retries: 3,
          webhookSecret: 'clearbit_webhook_secret'
        }
      },
      {
        id: 'zoominfo',
        name: 'ZoomInfo',
        type: 'zoominfo',
        apiUrl: 'https://api.zoominfo.com/lookup/person',
        apiKey: process.env.ZOOMINFO_API_KEY || 'zoominfo_api_key',
        isActive: true,
        rateLimit: 200,
        costPerRequest: 0.75,
        supportedTypes: ['contact_info', 'company_info', 'job_title', 'education', 'technographics'],
        reliability: 0.92,
        averageResponseTime: 1200,
        lastHealthCheck: new Date(),
        configuration: {
          timeout: 8000,
          retries: 2
        }
      },
      {
        id: 'apollo',
        name: 'Apollo',
        type: 'apollo',
        apiUrl: 'https://api.apollo.io/v1/people/match',
        apiKey: process.env.APOLLO_API_KEY || 'apollo_api_key',
        isActive: true,
        rateLimit: 150,
        costPerRequest: 0.25,
        supportedTypes: ['contact_info', 'company_info', 'social_profiles', 'intent_data'],
        reliability: 0.88,
        averageResponseTime: 950,
        lastHealthCheck: new Date(),
        configuration: {
          timeout: 6000,
          retries: 3
        }
      },
      {
        id: 'hunter',
        name: 'Hunter',
        type: 'hunter',
        apiUrl: 'https://api.hunter.io/v2/email-finder',
        apiKey: process.env.HUNTER_API_KEY || 'hunter_api_key',
        isActive: true,
        rateLimit: 100,
        costPerRequest: 0.10,
        supportedTypes: ['contact_info'],
        reliability: 0.85,
        averageResponseTime: 650,
        lastHealthCheck: new Date(),
        configuration: {
          timeout: 4000,
          retries: 2
        }
      }
    ];

    defaultProviders.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
  }

  async addProvider(provider: Omit<EnrichmentProvider, 'id' | 'lastHealthCheck'>): Promise<EnrichmentProvider> {
    const id = `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newProvider: EnrichmentProvider = {
      id,
      lastHealthCheck: new Date(),
      ...provider
    };

    this.providers.set(id, newProvider);
    await this.persistProviders();
    this.emit('provider_added', newProvider);
    return newProvider;
  }

  async updateProvider(providerId: string, updates: Partial<EnrichmentProvider>): Promise<EnrichmentProvider | null> {
    const provider = this.providers.get(providerId);
    if (!provider) return null;

    const updatedProvider = { ...provider, ...updates };
    this.providers.set(providerId, updatedProvider);
    await this.persistProviders();
    this.emit('provider_updated', updatedProvider);
    return updatedProvider;
  }

  getProvider(providerId: string): EnrichmentProvider | null {
    return this.providers.get(providerId) || null;
  }

  getProviders(filters?: { type?: string; isActive?: boolean }): EnrichmentProvider[] {
    let providers = Array.from(this.providers.values());

    if (filters?.type) {
      providers = providers.filter(p => p.type === filters.type);
    }

    if (filters?.isActive !== undefined) {
      providers = providers.filter(p => p.isActive === filters.isActive);
    }

    return providers.sort((a, b) => b.reliability - a.reliability);
  }

  // =============================================================================
  // ENRICHMENT PROCESSING
  // =============================================================================

  async enrichContact(request: ContactEnrichmentRequest): Promise<EnrichmentExecution> {
    const execution: EnrichmentExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestId: request.id,
      contactId: request.contactId,
      status: 'queued',
      startTime: new Date(),
      totalSteps: request.enrichmentTypes.length,
      completedSteps: 0,
      failedSteps: 0,
      results: [],
      errors: [],
      cost: 0,
      qualityScore: 0,
      metadata: { ...request.metadata }
    };

    this.executions.set(execution.id, execution);
    this.emit('enrichment_started', execution);

    // Process enrichment asynchronously
    this.processEnrichment(execution, request).catch(error => {
      console.error('Enrichment processing failed:', error);
      execution.status = 'failed';
      execution.endTime = new Date();
      this.emit('enrichment_failed', execution, error);
    });

    return execution;
  }

  private async processEnrichment(execution: EnrichmentExecution, request: ContactEnrichmentRequest): Promise<void> {
    execution.status = 'processing';
    this.emit('enrichment_processing', execution);

    try {
      for (const enrichmentType of request.enrichmentTypes) {
        const result = await this.performEnrichment(execution, request, enrichmentType);
        execution.results.push(result);

        if (result.status === 'completed') {
          execution.completedSteps++;
        } else {
          execution.failedSteps++;
        }

        execution.cost += result.cost;
      }

      // Calculate quality score
      execution.qualityScore = this.calculateQualityScore(execution.results);

      // Distribute enriched data to target systems
      await this.distributeEnrichedData(execution, request);

      execution.status = 'completed';
      execution.endTime = new Date();
      this.emit('enrichment_completed', execution);

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      this.emit('enrichment_failed', execution, error);
    }
  }

  private async performEnrichment(
    execution: EnrichmentExecution,
    request: ContactEnrichmentRequest,
    enrichmentType: EnrichmentType
  ): Promise<EnrichmentResult> {
    const provider = this.providers.get(enrichmentType.provider);
    if (!provider || !provider.isActive) {
      throw new Error(`Provider ${enrichmentType.provider} not found or inactive`);
    }

    const result: EnrichmentResult = {
      id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestId: request.id,
      providerId: provider.id,
      enrichmentType: enrichmentType.type,
      status: 'pending',
      confidence: 0,
      dataQuality: 0,
      data: {},
      sourceData: {},
      enrichedFields: [],
      missingFields: [],
      processingTime: 0,
      cost: provider.costPerRequest,
      timestamp: new Date()
    };

    const startTime = Date.now();

    try {
      // Simulate API call to enrichment provider
      const enrichedData = await this.callEnrichmentProvider(provider, request, enrichmentType);

      result.data = enrichedData.data;
      result.sourceData = enrichedData.sourceData;
      result.confidence = enrichedData.confidence;
      result.dataQuality = enrichedData.quality;
      result.enrichedFields = enrichedData.enrichedFields;
      result.missingFields = enrichedData.missingFields;
      result.status = 'completed';

    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';

      const enrichmentError: EnrichmentError = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        executionId: execution.id,
        providerId: provider.id,
        errorType: 'api_error',
        errorMessage: result.error,
        timestamp: new Date(),
        isRetryable: true,
        retryCount: 0,
        maxRetries: 3
      };

      execution.errors.push(enrichmentError);
    }

    result.processingTime = Date.now() - startTime;
    return result;
  }

  private async callEnrichmentProvider(
    provider: EnrichmentProvider,
    request: ContactEnrichmentRequest,
    enrichmentType: EnrichmentType
  ): Promise<any> {
    // Simulate API call with realistic data based on provider type
    await new Promise(resolve => setTimeout(resolve, provider.averageResponseTime));

    const mockData = this.generateMockEnrichmentData(provider, request, enrichmentType);

    // Simulate occasional failures based on provider reliability
    if (Math.random() > provider.reliability) {
      throw new Error(`Provider ${provider.name} API error`);
    }

    return mockData;
  }

  private generateMockEnrichmentData(
    provider: EnrichmentProvider,
    request: ContactEnrichmentRequest,
    enrichmentType: EnrichmentType
  ): any {
    const baseData = {
      confidence: 0.7 + Math.random() * 0.3,
      quality: 0.6 + Math.random() * 0.4,
      enrichedFields: [],
      missingFields: [],
      sourceData: {
        email: request.email,
        firstName: request.firstName,
        lastName: request.lastName,
        company: request.company
      }
    };

    switch (enrichmentType.type) {
      case 'contact_info':
        return {
          ...baseData,
          data: {
            email: request.email || `${request.firstName?.toLowerCase()}.${request.lastName?.toLowerCase()}@${request.company?.toLowerCase().replace(/\s+/g, '')}.com`,
            phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            mobilePhone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            address: {
              street: `${Math.floor(Math.random() * 9999) + 1} Main St`,
              city: ['New York', 'San Francisco', 'Chicago', 'Austin', 'Seattle'][Math.floor(Math.random() * 5)],
              state: ['NY', 'CA', 'IL', 'TX', 'WA'][Math.floor(Math.random() * 5)],
              zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
              country: 'United States'
            }
          },
          enrichedFields: ['email', 'phone', 'mobilePhone', 'address']
        };

      case 'company_info':
        return {
          ...baseData,
          data: {
            company: request.company,
            domain: request.domain || `${request.company?.toLowerCase().replace(/\s+/g, '')}.com`,
            industry: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing'][Math.floor(Math.random() * 5)],
            size: ['1-10', '11-50', '51-200', '201-1000', '1000+'][Math.floor(Math.random() * 5)],
            revenue: `$${Math.floor(Math.random() * 100) + 1}M`,
            headquarters: ['New York, NY', 'San Francisco, CA', 'Chicago, IL', 'Austin, TX'][Math.floor(Math.random() * 4)],
            founded: Math.floor(Math.random() * 30) + 1990,
            website: request.domain || `https://${request.company?.toLowerCase().replace(/\s+/g, '')}.com`
          },
          enrichedFields: ['company', 'domain', 'industry', 'size', 'revenue', 'headquarters']
        };

      case 'social_profiles':
        return {
          ...baseData,
          data: {
            linkedin: request.linkedInUrl || `https://linkedin.com/in/${request.firstName?.toLowerCase()}-${request.lastName?.toLowerCase()}`,
            twitter: `https://twitter.com/${request.firstName?.toLowerCase()}_${request.lastName?.toLowerCase()}`,
            github: `https://github.com/${request.firstName?.toLowerCase()}${request.lastName?.toLowerCase()}`,
            facebook: `https://facebook.com/${request.firstName?.toLowerCase()}.${request.lastName?.toLowerCase()}`
          },
          enrichedFields: ['linkedin', 'twitter', 'github', 'facebook']
        };

      case 'job_title':
        return {
          ...baseData,
          data: {
            title: ['Software Engineer', 'Product Manager', 'Sales Director', 'Marketing Manager', 'VP Engineering'][Math.floor(Math.random() * 5)],
            level: ['Individual Contributor', 'Manager', 'Director', 'VP', 'C-Level'][Math.floor(Math.random() * 5)],
            department: ['Engineering', 'Product', 'Sales', 'Marketing', 'Operations'][Math.floor(Math.random() * 5)],
            seniority: Math.floor(Math.random() * 15) + 1
          },
          enrichedFields: ['title', 'level', 'department', 'seniority']
        };

      default:
        return {
          ...baseData,
          data: {},
          enrichedFields: []
        };
    }
  }

  private calculateQualityScore(results: EnrichmentResult[]): number {
    if (results.length === 0) return 0;

    const totalQuality = results.reduce((sum, result) => sum + result.dataQuality, 0);
    return totalQuality / results.length;
  }

  private async distributeEnrichedData(execution: EnrichmentExecution, request: ContactEnrichmentRequest): Promise<void> {
    // Simulate distribution to target CRM systems
    for (const targetSystem of request.targetSystems) {
      try {
        await this.syncToTargetSystem(execution, targetSystem);
        this.emit('data_distributed', { executionId: execution.id, targetSystem });
      } catch (error) {
        console.error(`Failed to distribute data to ${targetSystem}:`, error);
      }
    }
  }

  private async syncToTargetSystem(execution: EnrichmentExecution, targetSystem: string): Promise<void> {
    // Simulate API call to target CRM system
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Log the sync operation
    console.log(`Synced enriched data for contact ${execution.contactId} to ${targetSystem}`);
  }

  // =============================================================================
  // WORKFLOW MANAGEMENT
  // =============================================================================

  async createWorkflow(workflowData: Omit<EnrichmentWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successRate'>): Promise<EnrichmentWorkflow> {
    const workflow: EnrichmentWorkflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      successRate: 0,
      ...workflowData
    };

    this.workflows.set(workflow.id, workflow);
    await this.persistWorkflows();
    this.emit('workflow_created', workflow);
    return workflow;
  }

  async updateWorkflow(workflowId: string, updates: Partial<EnrichmentWorkflow>): Promise<EnrichmentWorkflow | null> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const updatedWorkflow = { ...workflow, ...updates, updatedAt: new Date() };
    this.workflows.set(workflowId, updatedWorkflow);
    await this.persistWorkflows();
    this.emit('workflow_updated', updatedWorkflow);
    return updatedWorkflow;
  }

  getWorkflow(workflowId: string): EnrichmentWorkflow | null {
    return this.workflows.get(workflowId) || null;
  }

  getWorkflows(filters?: { isActive?: boolean }): EnrichmentWorkflow[] {
    let workflows = Array.from(this.workflows.values());

    if (filters?.isActive !== undefined) {
      workflows = workflows.filter(w => w.isActive === filters.isActive);
    }

    return workflows.sort((a, b) => b.priority - a.priority);
  }

  async executeWorkflow(workflowId: string, contactId: string, triggerData?: Record<string, any>): Promise<EnrichmentExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || !workflow.isActive) {
      throw new Error(`Workflow ${workflowId} not found or inactive`);
    }

    // Create enrichment request based on workflow configuration
    const request: ContactEnrichmentRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contactId,
      enrichmentTypes: this.extractEnrichmentTypesFromWorkflow(workflow),
      priority: 'medium',
      sourceSystem: 'workflow',
      targetSystems: ['salesforce', 'hubspot'], // Default target systems
      metadata: { workflowId, triggerData }
    };

    const execution = await this.enrichContact(request);
    execution.workflowId = workflowId;

    // Update workflow metrics
    workflow.executionCount++;
    await this.updateWorkflow(workflowId, { executionCount: workflow.executionCount });

    return execution;
  }

  private extractEnrichmentTypesFromWorkflow(workflow: EnrichmentWorkflow): EnrichmentType[] {
    // Extract enrichment types from workflow steps
    return workflow.steps
      .filter(step => step.type === 'enrichment')
      .map(step => ({
        type: step.configuration.enrichmentType || 'contact_info',
        provider: step.configuration.provider || 'clearbit',
        isRequired: step.isRequired,
        confidence: 0.8,
        weight: 1.0
      }));
  }

  // =============================================================================
  // QUALITY MANAGEMENT
  // =============================================================================

  private async initializeQualityRules(): Promise<void> {
    const defaultRules: DataQualityRule[] = [
      {
        id: 'email_format',
        name: 'Email Format Validation',
        field: 'email',
        validationType: 'format',
        criteria: { regex: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$' },
        weight: 0.2,
        isActive: true
      },
      {
        id: 'phone_format',
        name: 'Phone Format Validation',
        field: 'phone',
        validationType: 'format',
        criteria: { regex: '^\\+?[1-9]\\d{1,14}$' },
        weight: 0.15,
        isActive: true
      },
      {
        id: 'name_completeness',
        name: 'Name Completeness',
        field: 'fullName',
        validationType: 'completeness',
        criteria: { requiredFields: ['firstName', 'lastName'] },
        weight: 0.25,
        isActive: true
      },
      {
        id: 'company_accuracy',
        name: 'Company Information Accuracy',
        field: 'company',
        validationType: 'accuracy',
        criteria: { minLength: 2, maxLength: 100 },
        weight: 0.2,
        isActive: true
      },
      {
        id: 'data_freshness',
        name: 'Data Freshness',
        field: 'lastUpdated',
        validationType: 'freshness',
        criteria: { maxAgeInDays: 90 },
        weight: 0.2,
        isActive: true
      }
    ];

    defaultRules.forEach(rule => {
      this.qualityRules.set(rule.id, rule);
    });
  }

  async assessDataQuality(contactId: string, contactData: Record<string, any>): Promise<QualityAssessment> {
    const fieldScores: Record<string, number> = {};
    const missingFields: string[] = [];
    const invalidFields: string[] = [];
    const recommendations: string[] = [];

    let totalScore = 0;
    let totalWeight = 0;

    for (const rule of this.qualityRules.values()) {
      if (!rule.isActive) continue;

      const score = this.evaluateQualityRule(rule, contactData);
      fieldScores[rule.field] = score;
      totalScore += score * rule.weight;
      totalWeight += rule.weight;

      if (score < 0.5) {
        invalidFields.push(rule.field);
        recommendations.push(`Improve ${rule.name}: ${rule.field} quality is below threshold`);
      }

      if (score === 0 && rule.validationType === 'completeness') {
        missingFields.push(rule.field);
      }
    }

    const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    const assessment: QualityAssessment = {
      contactId,
      overallScore,
      fieldScores,
      missingFields,
      invalidFields,
      lastAssessed: new Date(),
      recommendations
    };

    this.qualityAssessments.set(contactId, assessment);
    return assessment;
  }

  private evaluateQualityRule(rule: DataQualityRule, data: Record<string, any>): number {
    const fieldValue = data[rule.field];

    switch (rule.validationType) {
      case 'format':
        if (!fieldValue) return 0;
        const regex = new RegExp(rule.criteria.regex);
        return regex.test(fieldValue.toString()) ? 1 : 0;

      case 'completeness':
        if (rule.criteria.requiredFields) {
          const requiredFields = rule.criteria.requiredFields as string[];
          const presentFields = requiredFields.filter(field => data[field]);
          return presentFields.length / requiredFields.length;
        }
        return fieldValue ? 1 : 0;

      case 'accuracy':
        if (!fieldValue) return 0;
        const value = fieldValue.toString();
        const minLength = rule.criteria.minLength || 0;
        const maxLength = rule.criteria.maxLength || Infinity;
        return value.length >= minLength && value.length <= maxLength ? 1 : 0;

      case 'freshness':
        if (!fieldValue) return 0;
        const date = new Date(fieldValue);
        const maxAge = rule.criteria.maxAgeInDays * 24 * 60 * 60 * 1000;
        const age = Date.now() - date.getTime();
        return age <= maxAge ? 1 : Math.max(0, 1 - (age - maxAge) / maxAge);

      case 'consistency':
        // Implement consistency checks based on criteria
        return 0.8; // Default score

      default:
        return 0;
    }
  }

  // =============================================================================
  // METRICS & MONITORING
  // =============================================================================

  private async calculateMetrics(): Promise<void> {
    const executions = Array.from(this.executions.values());
    const completedExecutions = executions.filter(e => e.status === 'completed');
    const failedExecutions = executions.filter(e => e.status === 'failed');

    const providerMetrics: Record<string, ProviderMetrics> = {};
    const workflowMetrics: Record<string, WorkflowMetrics> = {};

    // Calculate provider metrics
    for (const provider of this.providers.values()) {
      const providerExecutions = executions.filter(e =>
        e.results.some(r => r.providerId === provider.id)
      );

      providerMetrics[provider.id] = {
        requests: providerExecutions.length,
        successes: providerExecutions.filter(e => e.status === 'completed').length,
        failures: providerExecutions.filter(e => e.status === 'failed').length,
        averageResponseTime: provider.averageResponseTime,
        averageQuality: providerExecutions.reduce((sum, e) => sum + e.qualityScore, 0) / Math.max(providerExecutions.length, 1),
        totalCost: providerExecutions.reduce((sum, e) => sum + e.cost, 0),
        reliability: provider.reliability
      };
    }

    // Calculate workflow metrics
    for (const workflow of this.workflows.values()) {
      const workflowExecutions = executions.filter(e => e.workflowId === workflow.id);

      workflowMetrics[workflow.id] = {
        executions: workflowExecutions.length,
        successes: workflowExecutions.filter(e => e.status === 'completed').length,
        failures: workflowExecutions.filter(e => e.status === 'failed').length,
        averageExecutionTime: workflowExecutions.reduce((sum, e) => {
          const duration = e.endTime ? e.endTime.getTime() - e.startTime.getTime() : 0;
          return sum + duration;
        }, 0) / Math.max(workflowExecutions.length, 1),
        averageQualityScore: workflowExecutions.reduce((sum, e) => sum + e.qualityScore, 0) / Math.max(workflowExecutions.length, 1),
        successRate: workflowExecutions.length > 0 ? workflowExecutions.filter(e => e.status === 'completed').length / workflowExecutions.length : 0
      };
    }

    this.metrics = {
      totalRequests: executions.length,
      completedRequests: completedExecutions.length,
      failedRequests: failedExecutions.length,
      averageProcessingTime: executions.reduce((sum, e) => {
        const duration = e.endTime ? e.endTime.getTime() - e.startTime.getTime() : 0;
        return sum + duration;
      }, 0) / Math.max(executions.length, 1),
      averageQualityScore: executions.reduce((sum, e) => sum + e.qualityScore, 0) / Math.max(executions.length, 1),
      totalCost: executions.reduce((sum, e) => sum + e.cost, 0),
      providerMetrics,
      workflowMetrics,
      qualityTrends: this.generateQualityTrends(),
      lastCalculated: new Date()
    };

    this.emit('metrics_calculated', this.metrics);
  }

  private generateQualityTrends(): QualityTrend[] {
    const trends: QualityTrend[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      trends.push({
        date,
        averageScore: 0.7 + Math.random() * 0.2,
        completeness: 0.8 + Math.random() * 0.15,
        accuracy: 0.75 + Math.random() * 0.2,
        freshness: 0.6 + Math.random() * 0.3
      });
    }

    return trends;
  }

  private startMetricsCalculation(): void {
    this.metricsInterval = setInterval(() => {
      this.calculateMetrics().catch(error => {
        console.error('Failed to calculate metrics:', error);
      });
    }, 30 * 60 * 1000); // Calculate every 30 minutes
  }

  getMetrics(): EnrichmentMetrics | null {
    return this.metrics;
  }

  // =============================================================================
  // DATA ACCESS & MANAGEMENT
  // =============================================================================

  getExecution(executionId: string): EnrichmentExecution | null {
    return this.executions.get(executionId) || null;
  }

  getExecutions(filters?: EnrichmentFilters): EnrichmentExecution[] {
    let executions = Array.from(this.executions.values());

    if (filters?.contactId) {
      executions = executions.filter(e => e.contactId === filters.contactId);
    }

    if (filters?.status) {
      executions = executions.filter(e => e.status === filters.status);
    }

    if (filters?.startDate) {
      executions = executions.filter(e => e.startTime >= filters.startDate!);
    }

    if (filters?.endDate) {
      executions = executions.filter(e => e.startTime <= filters.endDate!);
    }

    if (filters?.minQuality) {
      executions = executions.filter(e => e.qualityScore >= filters.minQuality!);
    }

    if (filters?.maxCost) {
      executions = executions.filter(e => e.cost <= filters.maxCost!);
    }

    return executions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  getQualityAssessment(contactId: string): QualityAssessment | null {
    return this.qualityAssessments.get(contactId) || null;
  }

  getQualityAssessments(): QualityAssessment[] {
    return Array.from(this.qualityAssessments.values())
      .sort((a, b) => b.lastAssessed.getTime() - a.lastAssessed.getTime());
  }

  // =============================================================================
  // PERSISTENCE
  // =============================================================================

  private async persistProviders(): Promise<void> {
    const redis = redisManager.getClient();
    const providersData = Array.from(this.providers.values());
    await redis.setex('enrichment:providers', 300, JSON.stringify(providersData)); // 5 minute cache
  }

  private async persistWorkflows(): Promise<void> {
    const redis = redisManager.getClient();
    const workflowsData = Array.from(this.workflows.values());
    await redis.setex('enrichment:workflows', 300, JSON.stringify(workflowsData)); // 5 minute cache
  }

  // =============================================================================
  // HEALTH & MONITORING
  // =============================================================================

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    providers: number;
    activeProviders: number;
    workflows: number;
    activeWorkflows: number;
    executions: number;
    activeExecutions: number;
    metricsStatus: 'active' | 'inactive';
  }> {
    const activeProviders = Array.from(this.providers.values()).filter(p => p.isActive).length;
    const activeWorkflows = Array.from(this.workflows.values()).filter(w => w.isActive).length;
    const activeExecutions = Array.from(this.executions.values()).filter(e => e.status === 'processing').length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (activeProviders === 0) {
      status = 'unhealthy';
    } else if (activeProviders < this.providers.size * 0.5) {
      status = 'degraded';
    }

    return {
      status,
      providers: this.providers.size,
      activeProviders,
      workflows: this.workflows.size,
      activeWorkflows,
      executions: this.executions.size,
      activeExecutions,
      metricsStatus: this.metricsInterval ? 'active' : 'inactive'
    };
  }

  // =============================================================================
  // CLEANUP & DESTRUCTION
  // =============================================================================

  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }

    this.providers.clear();
    this.workflows.clear();
    this.executions.clear();
    this.qualityRules.clear();
    this.qualityAssessments.clear();
    this.removeAllListeners();
  }

  // =============================================================================
  // MOCK DATA GENERATION
  // =============================================================================

  private async generateMockData(): Promise<void> {
    // Generate mock workflows
    const mockWorkflows = [
      {
        name: 'New Contact Enrichment',
        description: 'Automatically enrich new contacts with basic information',
        triggers: [{
          type: 'new_contact' as const,
          conditions: [{ field: 'email', operator: 'exists' as const, value: true }],
          isActive: true
        }],
        steps: [
          {
            id: 'step1',
            name: 'Basic Contact Info',
            type: 'enrichment' as const,
            configuration: { enrichmentType: 'contact_info', provider: 'clearbit' },
            isRequired: true,
            retryCount: 3,
            timeout: 30000
          },
          {
            id: 'step2',
            name: 'Company Information',
            type: 'enrichment' as const,
            configuration: { enrichmentType: 'company_info', provider: 'zoominfo' },
            isRequired: false,
            retryCount: 2,
            timeout: 45000
          }
        ],
        isActive: true,
        priority: 1
      },
      {
        name: 'Lead Qualification Enrichment',
        description: 'Enrich high-value leads with comprehensive data',
        triggers: [{
          type: 'updated_contact' as const,
          conditions: [
            { field: 'leadScore', operator: 'greater_than' as const, value: 80 },
            { field: 'company', operator: 'exists' as const, value: true, logicalOperator: 'and' as const }
          ],
          isActive: true
        }],
        steps: [
          {
            id: 'step1',
            name: 'Social Profiles',
            type: 'enrichment' as const,
            configuration: { enrichmentType: 'social_profiles', provider: 'apollo' },
            isRequired: false,
            retryCount: 2,
            timeout: 20000
          },
          {
            id: 'step2',
            name: 'Job Title Details',
            type: 'enrichment' as const,
            configuration: { enrichmentType: 'job_title', provider: 'zoominfo' },
            isRequired: true,
            retryCount: 3,
            timeout: 30000
          }
        ],
        isActive: true,
        priority: 2
      }
    ];

    for (const workflowData of mockWorkflows) {
      await this.createWorkflow(workflowData);
    }

    // Generate mock executions
    const mockContacts = [
      { id: 'contact_1', email: 'john.doe@techcorp.com', firstName: 'John', lastName: 'Doe', company: 'TechCorp' },
      { id: 'contact_2', email: 'jane.smith@innovate.io', firstName: 'Jane', lastName: 'Smith', company: 'Innovate Solutions' },
      { id: 'contact_3', email: 'mike.wilson@startup.co', firstName: 'Mike', lastName: 'Wilson', company: 'Startup Co' }
    ];

    for (const contact of mockContacts) {
      const request: ContactEnrichmentRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contactId: contact.id,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        company: contact.company,
        enrichmentTypes: [
          { type: 'contact_info', provider: 'clearbit', isRequired: true, confidence: 0.8, weight: 1.0 },
          { type: 'company_info', provider: 'zoominfo', isRequired: false, confidence: 0.7, weight: 0.8 }
        ],
        priority: 'medium',
        sourceSystem: 'salesforce',
        targetSystems: ['salesforce', 'hubspot']
      };

      // Don't await to allow concurrent processing
      this.enrichContact(request);
    }
  }
}

export default ContactEnrichmentService;
