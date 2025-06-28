import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { CompetitiveAlert, CompetitiveIntelligenceService } from './competitive-intelligence-service';
import { UniversalWorkflowEngine } from './universal-workflow-engine';

// =============================================================================
// COMPETITIVE INTELLIGENCE WORKFLOW INTERFACES
// =============================================================================

export interface CompetitiveWorkflow {
  id: string;
  name: string;
  description: string;
  type: 'monitoring' | 'analysis' | 'alerting' | 'reporting' | 'battlecard_update';
  triggers: {
    competitors?: string[];
    alertTypes?: string[];
    schedule?: string; // cron expression
    thresholds?: {
      marketShareChange?: number;
      winRateChange?: number;
      threatLevelChange?: string;
    };
  };
  actions: Array<{
    type: 'data_collection' | 'analysis' | 'alert_generation' | 'report_creation' | 'notification';
    config: Record<string, any>;
    delay?: number; // seconds
  }>;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  platform?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompetitiveDataSource {
  id: string;
  name: string;
  type: 'website' | 'social_media' | 'news' | 'crm' | 'sales_data' | 'api' | 'manual';
  config: {
    url?: string;
    apiKey?: string;
    schedule?: string;
    selectors?: string[]; // CSS selectors for web scraping
    keywords?: string[];
    platform?: string;
  };
  competitors: string[];
  isActive: boolean;
  lastSync?: Date;
  errorCount: number;
}

export interface CompetitiveInsight {
  id: string;
  competitorId: string;
  type: 'pricing_change' | 'product_launch' | 'market_expansion' | 'partnership' | 'funding' | 'personnel_change';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  source: string;
  timestamp: Date;
  relatedData: Record<string, any>;
  actionItems?: string[];
  status: 'new' | 'reviewed' | 'acted_upon' | 'archived';
}

export interface CompetitiveReport {
  id: string;
  title: string;
  type: 'weekly' | 'monthly' | 'quarterly' | 'ad_hoc';
  competitors: string[];
  sections: Array<{
    title: string;
    content: string;
    charts?: any[];
    insights?: string[];
  }>;
  generatedAt: Date;
  generatedBy: 'automated' | 'manual';
  distribution: {
    emails?: string[];
    platforms?: string[];
    webhooks?: string[];
  };
  status: 'draft' | 'published' | 'archived';
}

export interface WorkflowMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  workflowsRun24h: number;
  alertsGenerated24h: number;
  insightsGenerated24h: number;
  reportsGenerated24h: number;
  averageExecutionTime: number;
  successRate: number;
}

// =============================================================================
// UNIVERSAL COMPETITIVE INTELLIGENCE WORKFLOW SERVICE
// =============================================================================

export class UniversalCompetitiveIntelligenceWorkflowService extends EventEmitter {
  private redis: Redis;
  private workflowEngine: UniversalWorkflowEngine;
  private competitiveService: CompetitiveIntelligenceService;
  private workflows: Map<string, CompetitiveWorkflow> = new Map();
  private dataSources: Map<string, CompetitiveDataSource> = new Map();
  private insights: Map<string, CompetitiveInsight> = new Map();
  private reports: Map<string, CompetitiveReport> = new Map();
  private isInitialized = false;
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor(redisClient: Redis, workflowEngine: UniversalWorkflowEngine) {
    super();
    this.redis = redisClient;
    this.workflowEngine = workflowEngine;
    this.competitiveService = new CompetitiveIntelligenceService(redisClient);
    this.setupEventListeners();
  }

  // =============================================================================
  // INITIALIZATION & SETUP
  // =============================================================================

  async initialize(): Promise<void> {
    try {
      await this.loadWorkflows();
      await this.loadDataSources();
      await this.loadInsights();
      await this.loadReports();
      await this.setupDefaultWorkflows();
      await this.scheduleWorkflows();
      this.isInitialized = true;
      this.emit('service:initialized');
      console.log('🏆 Universal Competitive Intelligence Workflow Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Competitive Intelligence Workflow Service:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Listen to competitive intelligence events
    this.competitiveService.on('competitiveIntelligenceUpdate', (data) => {
      this.handleCompetitiveUpdate(data);
    });

    // Listen to workflow engine events
    this.workflowEngine.on('workflow:completed', (data) => {
      this.handleWorkflowCompletion(data);
    });

    this.workflowEngine.on('workflow:failed', (data) => {
      this.handleWorkflowFailure(data);
    });
  }

  private async setupDefaultWorkflows(): Promise<void> {
    const defaultWorkflows: Omit<CompetitiveWorkflow, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Daily Competitor Monitoring',
        description: 'Automated daily monitoring of key competitors for changes and updates',
        type: 'monitoring',
        triggers: {
          schedule: '0 9 * * *', // Daily at 9 AM
        },
        actions: [
          {
            type: 'data_collection',
            config: {
              sources: ['website', 'social_media', 'news'],
              competitors: 'all',
            },
          },
          {
            type: 'analysis',
            config: {
              analysisType: 'change_detection',
              threshold: 0.1,
            },
            delay: 300, // 5 minutes after data collection
          },
          {
            type: 'alert_generation',
            config: {
              severity: 'medium',
              channels: ['email', 'slack'],
            },
            delay: 600, // 10 minutes after analysis
          },
        ],
        isActive: true,
      },
      {
        name: 'Weekly Competitive Report',
        description: 'Automated weekly competitive intelligence report generation',
        type: 'reporting',
        triggers: {
          schedule: '0 8 * * 1', // Weekly on Monday at 8 AM
        },
        actions: [
          {
            type: 'analysis',
            config: {
              analysisType: 'weekly_summary',
              includeCharts: true,
            },
          },
          {
            type: 'report_creation',
            config: {
              template: 'weekly_competitive_report',
              format: 'pdf',
            },
            delay: 900, // 15 minutes after analysis
          },
          {
            type: 'notification',
            config: {
              channels: ['email'],
              recipients: ['sales@company.com', 'marketing@company.com'],
            },
            delay: 1200, // 20 minutes after report creation
          },
        ],
        isActive: true,
      },
      {
        name: 'High-Impact Alert Workflow',
        description: 'Immediate response workflow for high-impact competitive changes',
        type: 'alerting',
        triggers: {
          alertTypes: ['pricing_change', 'product_launch', 'funding'],
          thresholds: {
            marketShareChange: 5.0,
            threatLevelChange: 'high',
          },
        },
        actions: [
          {
            type: 'analysis',
            config: {
              analysisType: 'impact_assessment',
              urgency: 'high',
            },
          },
          {
            type: 'alert_generation',
            config: {
              severity: 'critical',
              channels: ['email', 'slack', 'sms'],
              escalation: true,
            },
            delay: 60, // 1 minute after analysis
          },
          {
            type: 'notification',
            config: {
              channels: ['webhook'],
              endpoints: ['/api/v1/competitive-alerts/urgent'],
            },
            delay: 120, // 2 minutes after alert generation
          },
        ],
        isActive: true,
      },
      {
        name: 'Battlecard Update Workflow',
        description: 'Automated battlecard updates based on new competitive intelligence',
        type: 'battlecard_update',
        triggers: {
          schedule: '0 10 * * 3,5', // Wednesday and Friday at 10 AM
        },
        actions: [
          {
            type: 'data_collection',
            config: {
              sources: ['sales_data', 'crm'],
              dataType: 'win_loss_records',
            },
          },
          {
            type: 'analysis',
            config: {
              analysisType: 'battlecard_optimization',
              includeWinLossReasons: true,
            },
            delay: 600, // 10 minutes after data collection
          },
          {
            type: 'notification',
            config: {
              channels: ['email'],
              recipients: ['sales-enablement@company.com'],
              template: 'battlecard_update',
            },
            delay: 900, // 15 minutes after analysis
          },
        ],
        isActive: true,
      },
    ];

    for (const workflowData of defaultWorkflows) {
      const existingWorkflow = Array.from(this.workflows.values())
        .find(w => w.name === workflowData.name);

      if (!existingWorkflow) {
        await this.createWorkflow(workflowData);
      }
    }
  }

  // =============================================================================
  // WORKFLOW MANAGEMENT
  // =============================================================================

  async createWorkflow(workflowData: Omit<CompetitiveWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompetitiveWorkflow> {
    const id = `ci_workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const workflow: CompetitiveWorkflow = {
      ...workflowData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.workflows.set(id, workflow);
    await this.persistWorkflow(workflow);

    // Schedule if active and has schedule trigger
    if (workflow.isActive && workflow.triggers.schedule) {
      await this.scheduleWorkflow(workflow);
    }

    this.emit('workflow:created', workflow);
    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<CompetitiveWorkflow>): Promise<CompetitiveWorkflow> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    const updatedWorkflow = {
      ...workflow,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    this.workflows.set(id, updatedWorkflow);
    await this.persistWorkflow(updatedWorkflow);

    // Reschedule if schedule changed
    if (updates.triggers?.schedule || updates.isActive !== undefined) {
      await this.rescheduleWorkflow(updatedWorkflow);
    }

    this.emit('workflow:updated', updatedWorkflow);
    return updatedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<void> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    this.workflows.delete(id);
    await this.redis.del(`ci_workflow:${id}`);

    // Cancel scheduled job
    const job = this.scheduledJobs.get(id);
    if (job) {
      clearInterval(job);
      this.scheduledJobs.delete(id);
    }

    this.emit('workflow:deleted', { workflowId: id });
  }

  async executeWorkflow(id: string, context: Record<string, any> = {}): Promise<void> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    if (!workflow.isActive) {
      throw new Error(`Workflow ${id} is not active`);
    }

    this.emit('workflow:started', { workflowId: id, context });

    try {
      // Update last run time
      workflow.lastRun = new Date();
      await this.persistWorkflow(workflow);

      // Execute actions sequentially with delays
      for (const action of workflow.actions) {
        if (action.delay) {
          await this.delay(action.delay * 1000); // Convert to milliseconds
        }

        await this.executeAction(workflow, action, context);
      }

      this.emit('workflow:completed', { workflowId: id, context });
    } catch (error) {
      this.emit('workflow:failed', { workflowId: id, error: error instanceof Error ? error.message : 'Unknown error', context });
      throw error;
    }
  }

  private async executeAction(workflow: CompetitiveWorkflow, action: any, context: Record<string, any>): Promise<void> {
    switch (action.type) {
      case 'data_collection':
        await this.executeDataCollection(workflow, action.config, context);
        break;
      case 'analysis':
        await this.executeAnalysis(workflow, action.config, context);
        break;
      case 'alert_generation':
        await this.executeAlertGeneration(workflow, action.config, context);
        break;
      case 'report_creation':
        await this.executeReportCreation(workflow, action.config, context);
        break;
      case 'notification':
        await this.executeNotification(workflow, action.config, context);
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  private async executeDataCollection(workflow: CompetitiveWorkflow, config: any, context: Record<string, any>): Promise<void> {
    // Collect data from specified sources
    const sources = config.sources || [];
    const competitors = config.competitors === 'all'
      ? await this.getAllCompetitorIds()
      : config.competitors || [];

    for (const source of sources) {
      for (const competitorId of competitors) {
        await this.collectCompetitorData(competitorId, source, config);
      }
    }

    context.dataCollected = true;
    this.emit('action:data_collection:completed', { workflowId: workflow.id, sources, competitors });
  }

  private async executeAnalysis(workflow: CompetitiveWorkflow, config: any, context: Record<string, any>): Promise<void> {
    const analysisType = config.analysisType || 'general';

    switch (analysisType) {
      case 'change_detection':
        context.analysisResults = await this.performChangeDetectionAnalysis(config);
        break;
      case 'weekly_summary':
        context.analysisResults = await this.performWeeklySummaryAnalysis(config);
        break;
      case 'impact_assessment':
        context.analysisResults = await this.performImpactAssessment(config);
        break;
      case 'battlecard_optimization':
        context.analysisResults = await this.performBattlecardOptimization(config);
        break;
      default:
        context.analysisResults = await this.performGeneralAnalysis(config);
    }

    this.emit('action:analysis:completed', { workflowId: workflow.id, analysisType, results: context.analysisResults });
  }

  private async executeAlertGeneration(workflow: CompetitiveWorkflow, config: any, context: Record<string, any>): Promise<void> {
    const severity = config.severity || 'medium';
    const channels = config.channels || ['email'];

    const alert: Omit<CompetitiveAlert, 'id'> = {
      competitorId: context.competitorId || 'unknown',
      type: context.alertType || 'win-loss',
      severity: severity as any,
      title: context.alertTitle || 'Competitive Intelligence Alert',
      description: context.alertDescription || 'Automated alert from competitive intelligence workflow',
      timestamp: new Date().toISOString(),
      acknowledged: false,
      actionRequired: severity === 'critical' || severity === 'high',
      relatedOpportunities: context.relatedOpportunities || [],
    };

    const alertId = await this.createAlert(alert);
    context.alertId = alertId;

    // Send notifications through specified channels
    for (const channel of channels) {
      await this.sendAlertNotification(alertId, channel, config);
    }

    this.emit('action:alert_generation:completed', { workflowId: workflow.id, alertId, channels });
  }

  private async executeReportCreation(workflow: CompetitiveWorkflow, config: any, context: Record<string, any>): Promise<void> {
    const template = config.template || 'default';
    const format = config.format || 'html';

    const report: Omit<CompetitiveReport, 'id'> = {
      title: `Competitive Intelligence Report - ${new Date().toLocaleDateString()}`,
      type: workflow.type === 'reporting' ? 'weekly' : 'ad_hoc',
      competitors: context.competitors || await this.getAllCompetitorIds(),
      sections: await this.generateReportSections(template, context.analysisResults),
      generatedAt: new Date(),
      generatedBy: 'automated',
      distribution: config.distribution || {},
      status: 'draft',
    };

    const reportId = await this.createReport(report);
    context.reportId = reportId;

    this.emit('action:report_creation:completed', { workflowId: workflow.id, reportId, format });
  }

  private async executeNotification(workflow: CompetitiveWorkflow, config: any, context: Record<string, any>): Promise<void> {
    const channels = config.channels || ['email'];
    const recipients = config.recipients || [];
    const template = config.template || 'default';

    for (const channel of channels) {
      switch (channel) {
        case 'email':
          await this.sendEmailNotification(recipients, template, context);
          break;
        case 'slack':
          await this.sendSlackNotification(config.slackChannel, template, context);
          break;
        case 'webhook':
          await this.sendWebhookNotification(config.endpoints, context);
          break;
        case 'sms':
          await this.sendSMSNotification(recipients, template, context);
          break;
      }
    }

    this.emit('action:notification:completed', { workflowId: workflow.id, channels, recipients });
  }

  // =============================================================================
  // DATA COLLECTION METHODS
  // =============================================================================

  private async collectCompetitorData(competitorId: string, source: string, config: any): Promise<void> {
    // Implement data collection logic for different sources
    switch (source) {
      case 'website':
        await this.collectWebsiteData(competitorId, config);
        break;
      case 'social_media':
        await this.collectSocialMediaData(competitorId, config);
        break;
      case 'news':
        await this.collectNewsData(competitorId, config);
        break;
      case 'crm':
        await this.collectCRMData(competitorId, config);
        break;
      case 'sales_data':
        await this.collectSalesData(competitorId, config);
        break;
    }
  }

  private async collectWebsiteData(competitorId: string, config: any): Promise<void> {
    // Mock implementation - in production, implement web scraping
    console.log(`Collecting website data for competitor ${competitorId}`);
  }

  private async collectSocialMediaData(competitorId: string, config: any): Promise<void> {
    // Mock implementation - in production, integrate with social media APIs
    console.log(`Collecting social media data for competitor ${competitorId}`);
  }

  private async collectNewsData(competitorId: string, config: any): Promise<void> {
    // Mock implementation - in production, integrate with news APIs
    console.log(`Collecting news data for competitor ${competitorId}`);
  }

  private async collectCRMData(competitorId: string, config: any): Promise<void> {
    // Mock implementation - in production, integrate with CRM systems
    console.log(`Collecting CRM data for competitor ${competitorId}`);
  }

  private async collectSalesData(competitorId: string, config: any): Promise<void> {
    // Mock implementation - in production, query sales databases
    console.log(`Collecting sales data for competitor ${competitorId}`);
  }

  // =============================================================================
  // ANALYSIS METHODS
  // =============================================================================

  private async performChangeDetectionAnalysis(config: any): Promise<any> {
    // Mock implementation - in production, implement sophisticated change detection
    return {
      type: 'change_detection',
      changesDetected: Math.floor(Math.random() * 5),
      significantChanges: Math.floor(Math.random() * 2),
      timestamp: new Date(),
    };
  }

  private async performWeeklySummaryAnalysis(config: any): Promise<any> {
    // Mock implementation - in production, generate comprehensive weekly summary
    return {
      type: 'weekly_summary',
      competitorsAnalyzed: 5,
      newInsights: 12,
      marketShareChanges: 3,
      timestamp: new Date(),
    };
  }

  private async performImpactAssessment(config: any): Promise<any> {
    // Mock implementation - in production, assess competitive impact
    return {
      type: 'impact_assessment',
      impactLevel: 'medium',
      affectedMarkets: ['enterprise', 'mid-market'],
      recommendedActions: ['monitor', 'analyze_pricing'],
      timestamp: new Date(),
    };
  }

  private async performBattlecardOptimization(config: any): Promise<any> {
    // Mock implementation - in production, optimize battlecards based on data
    return {
      type: 'battlecard_optimization',
      battlecardsUpdated: 3,
      newStrengths: 2,
      newWeaknesses: 1,
      timestamp: new Date(),
    };
  }

  private async performGeneralAnalysis(config: any): Promise<any> {
    // Mock implementation - in production, perform general competitive analysis
    return {
      type: 'general_analysis',
      insights: ['Market share stable', 'New product features detected'],
      timestamp: new Date(),
    };
  }

  // =============================================================================
  // NOTIFICATION METHODS
  // =============================================================================

  private async sendEmailNotification(recipients: string[], template: string, context: Record<string, any>): Promise<void> {
    // Mock implementation - in production, integrate with email service
    console.log(`Sending email notification to ${recipients.join(', ')} using template ${template}`);
  }

  private async sendSlackNotification(channel: string, template: string, context: Record<string, any>): Promise<void> {
    // Mock implementation - in production, integrate with Slack API
    console.log(`Sending Slack notification to ${channel} using template ${template}`);
  }

  private async sendWebhookNotification(endpoints: string[], context: Record<string, any>): Promise<void> {
    // Mock implementation - in production, send HTTP webhooks
    console.log(`Sending webhook notifications to ${endpoints.join(', ')}`);
  }

  private async sendSMSNotification(recipients: string[], template: string, context: Record<string, any>): Promise<void> {
    // Mock implementation - in production, integrate with SMS service
    console.log(`Sending SMS notification to ${recipients.join(', ')} using template ${template}`);
  }

  private async sendAlertNotification(alertId: string, channel: string, config: any): Promise<void> {
    // Mock implementation - in production, send alert through specified channel
    console.log(`Sending alert ${alertId} notification via ${channel}`);
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private async getAllCompetitorIds(): Promise<string[]> {
    const competitors = await this.competitiveService.getCompetitors();
    return competitors.map(c => c.id);
  }

  private async createAlert(alert: Omit<CompetitiveAlert, 'id'>): Promise<string> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Mock implementation - in production, persist alert
    return id;
  }

  private async createReport(report: Omit<CompetitiveReport, 'id'>): Promise<string> {
    const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.reports.set(id, { ...report, id });
    await this.persistReport({ ...report, id });
    return id;
  }

  private async generateReportSections(template: string, analysisResults: any): Promise<any[]> {
    // Mock implementation - in production, generate report sections based on template
    return [
      {
        title: 'Executive Summary',
        content: 'Competitive landscape analysis for the past week...',
        insights: ['Market share remains stable', 'New competitor entry detected'],
      },
      {
        title: 'Key Developments',
        content: 'Significant competitive developments identified...',
        insights: ['Product launch by TechRival Corp', 'Pricing changes in enterprise segment'],
      },
    ];
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =============================================================================
  // SCHEDULING
  // =============================================================================

  private async scheduleWorkflows(): Promise<void> {
    for (const workflow of this.workflows.values()) {
      if (workflow.isActive && workflow.triggers.schedule) {
        await this.scheduleWorkflow(workflow);
      }
    }
  }

  private async scheduleWorkflow(workflow: CompetitiveWorkflow): Promise<void> {
    if (!workflow.triggers.schedule) return;

    // Cancel existing job
    const existingJob = this.scheduledJobs.get(workflow.id);
    if (existingJob) {
      clearInterval(existingJob);
    }

    // Parse schedule (simplified - in production use a proper cron parser)
    const interval = this.parseSchedule(workflow.triggers.schedule);
    if (interval > 0) {
      const job = setInterval(() => {
        this.executeWorkflow(workflow.id).catch(error => {
          console.error(`Error executing scheduled workflow ${workflow.id}:`, error);
        });
      }, interval);

      this.scheduledJobs.set(workflow.id, job);

      // Calculate next run time
      workflow.nextRun = new Date(Date.now() + interval);
      await this.persistWorkflow(workflow);
    }
  }

  private async rescheduleWorkflow(workflow: CompetitiveWorkflow): Promise<void> {
    // Cancel existing job
    const existingJob = this.scheduledJobs.get(workflow.id);
    if (existingJob) {
      clearInterval(existingJob);
      this.scheduledJobs.delete(workflow.id);
    }

    // Schedule if active and has schedule
    if (workflow.isActive && workflow.triggers.schedule) {
      await this.scheduleWorkflow(workflow);
    }
  }

  private parseSchedule(schedule: string): number {
    // Simplified schedule parser - in production use a proper cron parser
    if (schedule.includes('* * *')) {
      if (schedule.startsWith('0 9')) return 24 * 60 * 60 * 1000; // Daily
      if (schedule.startsWith('0 8 * * 1')) return 7 * 24 * 60 * 60 * 1000; // Weekly
    }
    return 0;
  }

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  private async handleCompetitiveUpdate(data: any): Promise<void> {
    // Trigger relevant workflows based on competitive intelligence updates
    for (const workflow of this.workflows.values()) {
      if (workflow.isActive && workflow.type === 'monitoring') {
        await this.executeWorkflow(workflow.id, { updateData: data });
      }
    }
  }

  private async handleWorkflowCompletion(data: any): Promise<void> {
    console.log(`Workflow ${data.workflowId} completed successfully`);
  }

  private async handleWorkflowFailure(data: any): Promise<void> {
    console.error(`Workflow ${data.workflowId} failed:`, data.error);
  }

  // =============================================================================
  // METRICS & ANALYTICS
  // =============================================================================

  async getWorkflowMetrics(): Promise<WorkflowMetrics> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const totalWorkflows = this.workflows.size;
    const activeWorkflows = Array.from(this.workflows.values()).filter(w => w.isActive).length;

    // Mock metrics - in production, calculate from actual data
    return {
      totalWorkflows,
      activeWorkflows,
      workflowsRun24h: Math.floor(activeWorkflows * 0.8),
      alertsGenerated24h: Math.floor(Math.random() * 10),
      insightsGenerated24h: Math.floor(Math.random() * 15),
      reportsGenerated24h: Math.floor(Math.random() * 3),
      averageExecutionTime: 120, // seconds
      successRate: 0.95,
    };
  }

  // =============================================================================
  // PERSISTENCE METHODS
  // =============================================================================

  private async persistWorkflow(workflow: CompetitiveWorkflow): Promise<void> {
    await this.redis.setex(
      `ci_workflow:${workflow.id}`,
      86400 * 365, // 1 year TTL
      JSON.stringify(workflow)
    );
  }

  private async persistReport(report: CompetitiveReport): Promise<void> {
    await this.redis.setex(
      `ci_report:${report.id}`,
      86400 * 90, // 90 days TTL
      JSON.stringify(report)
    );
  }

  private async loadWorkflows(): Promise<void> {
    const keys = await this.redis.keys('ci_workflow:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const workflow = JSON.parse(data) as CompetitiveWorkflow;
        this.workflows.set(workflow.id, workflow);
      }
    }
  }

  private async loadDataSources(): Promise<void> {
    const keys = await this.redis.keys('ci_datasource:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const dataSource = JSON.parse(data) as CompetitiveDataSource;
        this.dataSources.set(dataSource.id, dataSource);
      }
    }
  }

  private async loadInsights(): Promise<void> {
    const keys = await this.redis.keys('ci_insight:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const insight = JSON.parse(data) as CompetitiveInsight;
        this.insights.set(insight.id, insight);
      }
    }
  }

  private async loadReports(): Promise<void> {
    const keys = await this.redis.keys('ci_report:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const report = JSON.parse(data) as CompetitiveReport;
        this.reports.set(report.id, report);
      }
    }
  }

  // =============================================================================
  // HEALTH CHECK & CLEANUP
  // =============================================================================

  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const metrics = await this.getWorkflowMetrics();
      return {
        status: 'healthy',
        details: {
          initialized: this.isInitialized,
          workflows: metrics.totalWorkflows,
          activeWorkflows: metrics.activeWorkflows,
          scheduledJobs: this.scheduledJobs.size,
          successRate: metrics.successRate,
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

  async shutdown(): Promise<void> {
    // Cancel all scheduled jobs
    for (const job of this.scheduledJobs.values()) {
      clearInterval(job);
    }
    this.scheduledJobs.clear();

    this.removeAllListeners();
    console.log('🏆 Universal Competitive Intelligence Workflow Service shut down');
  }

  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================

  getWorkflow(id: string): CompetitiveWorkflow | undefined {
    return this.workflows.get(id);
  }

  getAllWorkflows(): CompetitiveWorkflow[] {
    return Array.from(this.workflows.values());
  }

  getActiveWorkflows(): CompetitiveWorkflow[] {
    return Array.from(this.workflows.values()).filter(w => w.isActive);
  }

  getInsight(id: string): CompetitiveInsight | undefined {
    return this.insights.get(id);
  }

  getAllInsights(): CompetitiveInsight[] {
    return Array.from(this.insights.values());
  }

  getReport(id: string): CompetitiveReport | undefined {
    return this.reports.get(id);
  }

  getAllReports(): CompetitiveReport[] {
    return Array.from(this.reports.values());
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createUniversalCompetitiveIntelligenceWorkflowService(
  redisClient: Redis,
  workflowEngine: UniversalWorkflowEngine
): UniversalCompetitiveIntelligenceWorkflowService {
  return new UniversalCompetitiveIntelligenceWorkflowService(redisClient, workflowEngine);
}

export default UniversalCompetitiveIntelligenceWorkflowService;
