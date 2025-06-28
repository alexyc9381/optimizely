import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { redisManager } from './redis-client';

// =============================================================================
// CORE TYPES & INTERFACES
// =============================================================================

export enum ProviderType {
  MAILGUN = 'mailgun',
  SENDGRID = 'sendgrid',
  SES = 'ses',
  POSTMARK = 'postmark',
  SMTP = 'smtp'
}

export enum SubscriptionStatus {
  SUBSCRIBED = 'subscribed',
  UNSUBSCRIBED = 'unsubscribed',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained'
}

export enum TriggerType {
  EVENT = 'event',
  PROPERTY_CHANGE = 'property_change',
  DATE = 'date',
  MANUAL = 'manual',
  API = 'api',
  WEBHOOK = 'webhook'
}

export interface EmailTemplate {
  id: string;
  name: string;
  type: 'welcome' | 'follow_up' | 'promotional' | 'nurture' | 're_engagement' | 'conversion' | 'custom';
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: EmailVariable[];
  personalizationRules: PersonalizationRule[];
  version: number;
  status: 'draft' | 'active' | 'archived';
  isActive: boolean;
  tags: string[];
  metadata: {
    category?: string;
    description?: string;
    lastModified: Date;
    createdBy: string;
    approvedBy?: string;
    approvalDate?: Date;
  };
  performance: EmailTemplatePerformance;
  abTestVariants?: EmailTemplateVariant[];
}

export interface EmailTemplateVariant {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  trafficAllocation: number; // percentage
  performance: EmailTemplatePerformance;
  isWinner?: boolean;
  testStartDate: Date;
  testEndDate?: Date;
}

export interface EmailTemplatePerformance {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  unsubscribed: number;
  bounced: number;
  complained: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  unsubscribeRate: number;
  bounceRate: number;
  complaintRate: number;
  revenue: number;
  revenuePerEmail: number;
}

export interface EmailVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  defaultValue?: any;
  required: boolean;
  description?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    allowedValues?: any[];
  };
}

export interface PersonalizationRule {
  id: string;
  condition: string; // JavaScript expression
  replacements: { [variable: string]: string };
  priority: number;
  active: boolean;
}

export interface EmailSequence {
  id: string;
  name: string;
  description: string;
  type: 'drip' | 'behavioral' | 'date_based' | 'custom';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  isActive: boolean;
  steps: EmailSequenceStep[];
  triggers: SequenceTrigger[];
  settings: SequenceSettings;
  audience: SequenceAudience;
  performance: SequencePerformance;
  analytics: SequencePerformance;
  abTest?: SequenceABTest;
  metadata: {
    createdDate: Date;
    lastModified: Date;
    createdBy: string;
    tags: string[];
    category?: string;
  };
}

export interface EmailSequenceStep {
  id: string;
  order: number;
  name: string;
  templateId: string;
  delay: StepDelay;
  conditions: StepCondition[];
  actions: StepAction[];
  settings: StepSettings;
  performance: StepPerformance;
}

export interface StepDelay {
  type: 'immediate' | 'fixed' | 'relative' | 'optimal';
  value?: number; // minutes
  unit?: 'minutes' | 'hours' | 'days' | 'weeks';
  optimizeFor?: 'open_rate' | 'click_rate' | 'conversion_rate';
  businessHours?: boolean;
  timezone?: string;
}

export interface StepCondition {
  id: string;
  type: 'behavior' | 'property' | 'engagement' | 'time' | 'custom';
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: any;
  logic: 'and' | 'or';
}

export interface StepAction {
  id: string;
  type: 'send_email' | 'wait' | 'add_tag' | 'remove_tag' | 'update_property' | 'trigger_webhook' | 'move_to_sequence' | 'end_sequence';
  parameters: { [key: string]: any };
  conditions?: StepCondition[];
}

export interface StepSettings {
  sendTime?: 'immediate' | 'optimal' | 'scheduled';
  scheduledTime?: string; // HH:MM format
  timezone?: string;
  respectUnsubscribe: boolean;
  respectFrequencyCap: boolean;
  deliverabilityChecks: boolean;
}

export interface StepPerformance {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
  engagementScore: number;
}

export interface SequenceTrigger {
  id: string;
  type: 'event' | 'property_change' | 'date' | 'manual' | 'api' | 'webhook';
  name: string;
  active: boolean;
  conditions: TriggerCondition[];
  settings: TriggerSettings;
}

export interface TriggerCondition {
  field: string;
  operator: string;
  value: any;
  logic: 'and' | 'or';
}

export interface TriggerSettings {
  debounceMinutes?: number;
  maxExecutionsPerContact?: number;
  resetPeriod?: 'daily' | 'weekly' | 'monthly' | 'never';
  priority?: number;
}

export interface SequenceSettings {
  maxExecutions?: number;
  resetOnReEntry: boolean;
  allowReEntry: boolean;
  unsubscribeFromAll: boolean;
  respectGlobalFrequency: boolean;
  deliverabilityOptimization: boolean;
  timezone: string;
  businessHours?: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
    days: number[]; // 0-6, Sunday = 0
  };
}

export interface SequenceAudience {
  criteria: AudienceCriteria[];
  size: number;
  estimatedSize: number;
  lastCalculated: Date;
}

export interface AudienceCriteria {
  field: string;
  operator: string;
  value: any;
  logic: 'and' | 'or';
}

export interface SequencePerformance {
  enrolled: number;
  active: number;
  completed: number;
  unsubscribed: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  totalRevenue: number;
  averageEngagement: number;
  completionRate: number;
  conversionRate: number;
  revenuePerContact: number;
}

export interface SequenceABTest {
  id: string;
  name: string;
  variants: SequenceVariant[];
  trafficSplit: number[]; // percentages
  winnerCriteria: 'open_rate' | 'click_rate' | 'conversion_rate' | 'revenue';
  significanceLevel: number;
  minimumSampleSize: number;
  testDuration: number; // days
  status: 'running' | 'completed' | 'winner_selected';
  winner?: string; // variant id
  startDate: Date;
  endDate?: Date;
}

export interface SequenceVariant {
  id: string;
  name: string;
  sequence: EmailSequence;
  performance: SequencePerformance;
}

export interface BehavioralTrigger {
  id: string;
  name: string;
  description: string;
  eventType: string;
  conditions: BehavioralCondition[];
  actions: BehavioralAction[];
  settings: BehavioralTriggerSettings;
  active: boolean;
  performance: BehavioralTriggerPerformance;
}

export interface BehavioralCondition {
  type: 'event_property' | 'user_property' | 'frequency' | 'recency' | 'custom';
  field: string;
  operator: string;
  value: any;
  timeWindow?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
}

export interface BehavioralAction {
  type: 'add_to_sequence' | 'send_email' | 'update_property' | 'add_tag' | 'trigger_webhook';
  parameters: { [key: string]: any };
  delay?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days';
  };
}

export interface BehavioralTriggerSettings {
  debounceMinutes: number;
  maxExecutionsPerUser: number;
  resetPeriod: 'daily' | 'weekly' | 'monthly' | 'never';
  priority: number;
}

export interface BehavioralTriggerPerformance {
  triggered: number;
  executed: number;
  errors: number;
  averageResponseTime: number;
  lastTriggered?: Date;
}

export interface DeliverabilitySettings {
  enableOptimization: boolean;
  reputationThreshold: number;
  throttling: {
    enabled: boolean;
    maxPerHour: number;
    maxPerDay: number;
  };
  warmup: {
    enabled: boolean;
    startVolume: number;
    increaseRate: number;
    targetVolume: number;
  };
  domainAuthentication: {
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
  };
  listHygiene: {
    enabled: boolean;
    bounceHandling: boolean;
    suppressionList: boolean;
    engagementFiltering: boolean;
  };
}

export interface DeliverabilityMetrics {
  reputation: number;
  deliveryRate: number;
  inboxPlacement: number;
  spamRate: number;
  bounceRate: number;
  complaintRate: number;
  unsubscribeRate: number;
  engagementRate: number;
  blacklistStatus: boolean;
  recommendations: string[];
}

export interface EmailAnalytics {
  timeframe: {
    start: Date;
    end: Date;
  };
  overview: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalConverted: number;
    totalRevenue: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    revenuePerEmail: number;
  };
  trends: {
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
  }[];
  topPerformers: {
    templates: EmailTemplate[];
    sequences: EmailSequence[];
  };
  segments: {
    name: string;
    performance: EmailTemplatePerformance;
  }[];
  devices: {
    device: string;
    percentage: number;
    performance: EmailTemplatePerformance;
  }[];
  clients: {
    client: string;
    percentage: number;
    performance: EmailTemplatePerformance;
  }[];
}

export interface EmailContact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  properties: { [key: string]: any };
  tags: string[];
  subscriptionStatus: 'subscribed' | 'unsubscribed' | 'bounced' | 'complained';
  preferences: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'never';
    categories: string[];
  };
  engagement: {
    totalOpens: number;
    totalClicks: number;
    lastOpened?: Date;
    lastClicked?: Date;
    engagementScore: number;
  };
  sequences: {
    sequenceId: string;
    status: 'active' | 'completed' | 'paused';
    currentStep: number;
    startDate: Date;
    completionDate?: Date;
  }[];
}

export interface EmailExecution {
  id: string;
  contactId: string;
  templateId: string;
  sequenceId?: string;
  stepId?: string;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'failed';
  scheduledTime: Date;
  sentTime?: Date;
  deliveredTime?: Date;
  openedTime?: Date;
  clickedTime?: Date;
  subject: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  metadata: {
    messageId?: string;
    campaignId?: string;
    abTestVariant?: string;
    sendingDomain?: string;
    ipAddress?: string;
  };
  events: EmailEvent[];
  deliverabilityData?: {
    reputationScore: number;
    spamScore: number;
    authentication: boolean;
  };
}

export interface EmailEvent {
  type: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed';
  timestamp: Date;
  data?: { [key: string]: any };
}

// =============================================================================
// MISSING TYPES & INTERFACES
// =============================================================================

export interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  properties: { [key: string]: any };
  customFields: { [key: string]: any };
  tags: string[];
  subscriptionStatus: 'subscribed' | 'unsubscribed' | 'bounced' | 'complained';
  preferences: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'never';
    categories: string[];
  };
  engagement: {
    totalOpens: number;
    totalClicks: number;
    lastOpened?: Date;
    lastClicked?: Date;
    engagementScore: number;
  };
  sequences: {
    sequenceId: string;
    status: 'active' | 'completed' | 'paused';
    currentStep: number;
    startDate: Date;
    completionDate?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  history: any[];
}

export interface SegmentationRules {
  rules: SegmentRule[];
  logic: 'and' | 'or';
}

export interface SegmentRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: any;
  logic: 'and' | 'or';
}

export interface EmailCampaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  templateId: string;
  audienceId: string;
  scheduledAt?: Date;
  sentAt?: Date;
  metadata: Record<string, any>;
}

export enum EmailCategory {
  WELCOME = 'welcome',
  FOLLOW_UP = 'follow_up',
  PROMOTIONAL = 'promotional',
  NURTURE = 'nurture',
  RE_ENGAGEMENT = 're_engagement',
  CONVERSION = 'conversion',
  CUSTOM = 'custom'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  CANCELLED = 'cancelled'
}

// =============================================================================
// UNIVERSAL AUTOMATED EMAIL SEQUENCE ENGINE
// =============================================================================

export class UniversalAutomatedEmailSequenceEngine extends EventEmitter {
  private redis: Redis;
  private isInitialized: boolean = false;

  // Class properties that were missing
  private templates: Map<string, EmailTemplate> = new Map();
  private sequences: Map<string, EmailSequence> = new Map();
  private contacts: Map<string, Contact> = new Map();
  private campaigns: Map<string, EmailCampaign> = new Map();
  private activeSequenceRuns: Map<string, SequenceRun> = new Map();

  // Interval properties for background processing
  private processingInterval?: NodeJS.Timeout;
  private analyticsInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private deliverabilityInterval?: NodeJS.Timeout;

  constructor(redis?: Redis) {
    super();
    this.redis = redis || redisManager.getClient();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Redis keys
      await this.initializeRedisKeys();

      // Load existing data
      await this.loadTemplates();
      await this.loadSequences();
      await this.loadContacts();

      // Start background processors
      this.startSequenceProcessor();
      this.startDeliverabilityOptimizer();
      this.startPerformanceTracker();

      this.isInitialized = true;
      this.emit('engine:initialized');
      console.log('✅ Email Sequence Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email sequence engine:', error);
      throw new Error(`Failed to initialize email sequence engine: ${error}`);
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.isInitialized = false;

      // Stop all intervals
      if (this.processingInterval) {
        clearInterval(this.processingInterval);
      }
      if (this.analyticsInterval) {
        clearInterval(this.analyticsInterval);
      }
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      if (this.deliverabilityInterval) {
        clearInterval(this.deliverabilityInterval);
      }

      // Cancel active campaigns
      for (const campaign of this.campaigns.values()) {
        if (campaign.status === CampaignStatus.SCHEDULED || campaign.status === CampaignStatus.SENDING) {
          campaign.status = CampaignStatus.CANCELLED;
          await this.saveCampaign(campaign);
        }
      }

      console.log('📧 Email Sequence Engine shutdown complete');
      this.emit('engine:shutdown');

    } catch (error) {
      console.error('❌ Error during email engine shutdown:', error);
      throw error;
    }
  }

  // =============================================================================
  // TEMPLATE MANAGEMENT
  // =============================================================================

  async createTemplate(template: Omit<EmailTemplate, 'id' | 'performance'>): Promise<EmailTemplate> {
    try {
      const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newTemplate: EmailTemplate = {
        ...template,
        id: templateId,
        performance: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          unsubscribed: 0,
          bounced: 0,
          complained: 0,
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
          conversionRate: 0,
          unsubscribeRate: 0,
          bounceRate: 0,
          complaintRate: 0,
          revenue: 0,
          revenuePerEmail: 0
        }
      };

      // Store in memory and Redis
      this.templates.set(templateId, newTemplate);
      await this.saveTemplate(newTemplate);

      this.emit('template:created', { templateId, template: newTemplate });
      return newTemplate;
    } catch (error) {
      console.error('❌ Error creating template:', error);
      throw new Error(`Failed to create template: ${error}`);
    }
  }

  async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    try {
      // Check memory first
      const template = this.templates.get(templateId);
      if (template) return template;

      // Load from Redis
      const templateData = await this.redis.hget('email:templates', templateId);
      if (!templateData) return null;

      const parsedTemplate = JSON.parse(templateData);
      this.templates.set(templateId, parsedTemplate);
      return parsedTemplate;
    } catch (error) {
      console.error('❌ Error getting template:', error);
      throw new Error(`Failed to get template: ${error}`);
    }
  }

  async updateTemplate(templateId: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    try {
      const existingTemplate = await this.getTemplate(templateId);
      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      const updatedTemplate: EmailTemplate = {
        ...existingTemplate,
        ...updates,
        metadata: {
          ...existingTemplate.metadata,
          ...updates.metadata,
          lastModified: new Date()
        }
      };

      this.templates.set(templateId, updatedTemplate);
      await this.saveTemplate(updatedTemplate);

      this.emit('template:updated', { templateId, template: updatedTemplate });
      return updatedTemplate;
    } catch (error) {
      console.error('❌ Error updating template:', error);
      throw new Error(`Failed to update template: ${error}`);
    }
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      this.templates.delete(templateId);
      await this.removeTemplate(templateId);

      this.emit('template:deleted', { templateId });
      return true;
    } catch (error) {
      console.error('❌ Error deleting template:', error);
      return false;
    }
  }

  getAllTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: EmailCategory): EmailTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.metadata.category === category);
  }

  async cloneTemplate(id: string, name: string): Promise<EmailTemplate> {
    try {
      const originalTemplate = this.templates.get(id);
      if (!originalTemplate) {
        throw new Error('Template not found');
      }

      const clonedTemplate = await this.createTemplate({
        ...originalTemplate,
        name,
        status: 'draft' // Reset to draft for cloned template
      });

      console.log(`✅ Cloned template: ${originalTemplate.name} → ${name}`);
      return clonedTemplate;

    } catch (error) {
      console.error('❌ Error cloning template:', error);
      throw error;
    }
  }

  // =============================================================================
  // SEQUENCE MANAGEMENT
  // =============================================================================

  async createSequence(sequence: Omit<EmailSequence, 'id' | 'performance'>): Promise<EmailSequence> {
    try {
      const sequenceId = `sequence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newSequence: EmailSequence = {
        ...sequence,
        id: sequenceId,
        performance: {
          enrolled: 0,
          active: 0,
          completed: 0,
          unsubscribed: 0,
          totalSent: 0,
          totalDelivered: 0,
          totalOpened: 0,
          totalClicked: 0,
          totalConverted: 0,
          totalRevenue: 0,
          averageEngagement: 0,
          completionRate: 0,
          conversionRate: 0,
          revenuePerContact: 0
        },
        analytics: {
          enrolled: 0,
          active: 0,
          completed: 0,
          unsubscribed: 0,
          totalSent: 0,
          totalDelivered: 0,
          totalOpened: 0,
          totalClicked: 0,
          totalConverted: 0,
          totalRevenue: 0,
          averageEngagement: 0,
          completionRate: 0,
          conversionRate: 0,
          revenuePerContact: 0
        }
      };

      this.sequences.set(sequenceId, newSequence);
      await this.saveSequence(newSequence);

      this.emit('sequence:created', { sequenceId, sequence: newSequence });
      return newSequence;
    } catch (error) {
      console.error('❌ Error creating sequence:', error);
      throw new Error(`Failed to create sequence: ${error}`);
    }
  }

  async getSequence(sequenceId: string): Promise<EmailSequence | null> {
    try {
      const sequence = this.sequences.get(sequenceId);
      if (sequence) return sequence;

      const sequenceData = await this.redis.hget('email:sequences', sequenceId);
      if (!sequenceData) return null;

      const parsedSequence = JSON.parse(sequenceData);
      this.sequences.set(sequenceId, parsedSequence);
      return parsedSequence;
    } catch (error) {
      console.error('❌ Error getting sequence:', error);
      throw new Error(`Failed to get sequence: ${error}`);
    }
  }

  async updateSequence(sequenceId: string, updates: Partial<EmailSequence>): Promise<EmailSequence> {
    try {
      const existingSequence = await this.getSequence(sequenceId);
      if (!existingSequence) {
        throw new Error('Sequence not found');
      }

      const updatedSequence: EmailSequence = {
        ...existingSequence,
        ...updates,
        metadata: {
          ...existingSequence.metadata,
          ...updates.metadata,
          lastModified: new Date()
        }
      };

      this.sequences.set(sequenceId, updatedSequence);
      await this.saveSequence(updatedSequence);

      this.emit('sequence:updated', { sequenceId, sequence: updatedSequence });
      return updatedSequence;
    } catch (error) {
      console.error('❌ Error updating sequence:', error);
      throw new Error(`Failed to update sequence: ${error}`);
    }
  }

  async deleteSequence(sequenceId: string): Promise<boolean> {
    try {
      this.sequences.delete(sequenceId);
      await this.removeSequence(sequenceId);

      this.emit('sequence:deleted', { sequenceId });
      return true;
    } catch (error) {
      console.error('❌ Error deleting sequence:', error);
      return false;
    }
  }

  getAllSequences(): EmailSequence[] {
    return Array.from(this.sequences.values());
  }

  getActiveSequences(): EmailSequence[] {
    return Array.from(this.sequences.values()).filter(s => s.status === 'active');
  }

  // =============================================================================
  // CONTACT MANAGEMENT
  // =============================================================================

  async addContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'engagementScore' | 'history'>): Promise<Contact> {
    try {
      const contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newContact: Contact = {
        ...contact,
        id: contactId,
        createdAt: new Date(),
        updatedAt: new Date(),
        history: [],
        engagement: {
          ...contact.engagement,
          engagementScore: contact.engagement?.engagementScore || 0
        }
      };

      this.contacts.set(newContact.id, newContact);
      await this.saveContact(newContact);

      this.emit('contact:added', { contactId, contact: newContact });
      return newContact;
    } catch (error) {
      console.error('❌ Error adding contact:', error);
      throw new Error(`Failed to add contact: ${error}`);
    }
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    try {
      const contact = this.contacts.get(id);
      if (!contact) {
        throw new Error('Contact not found');
      }

      const updatedContact: Contact = {
        ...contact,
        ...updates,
        updatedAt: new Date()
      };

      this.contacts.set(id, updatedContact);
      await this.saveContact(updatedContact);

      this.emit('contact:updated', { contactId: id, contact: updatedContact });
      return updatedContact;
    } catch (error) {
      console.error('❌ Error updating contact:', error);
      throw new Error(`Failed to update contact: ${error}`);
    }
  }

  getContact(id: string): Contact | undefined {
    return this.contacts.get(id);
  }

  getContactByEmail(email: string): Contact | undefined {
    return Array.from(this.contacts.values()).find(c => c.email === email);
  }

  getAllContacts(): Contact[] {
    return Array.from(this.contacts.values());
  }

  getContactsBySegment(segmentRules: SegmentationRules): Contact[] {
    return Array.from(this.contacts.values()).filter(contact => {
      return this.evaluateSegmentRules(contact, segmentRules.rules);
    });
  }

  // =============================================================================
  // SEQUENCE EXECUTION
  // =============================================================================

  async triggerSequence(sequenceId: string, contactId: string, triggerData?: Record<string, any>): Promise<SequenceRun> {
    try {
      const sequence = this.sequences.get(sequenceId);
      const contact = this.contacts.get(contactId);

      if (!sequence || !contact) {
        throw new Error('Sequence or contact not found');
      }

      if (sequence.status !== 'active') {
        throw new Error('Sequence is not active');
      }

      // Validate sequence
      await this.validateSequence(sequence);

      const runId = this.generateId();
      const sequenceRun: SequenceRun = {
        id: runId,
        sequenceId,
        contactId,
        currentStepIndex: 0,
        status: 'active',
        triggerData: triggerData || {},
        startedAt: new Date(),
        metadata: {}
      };

      // Handle A/B testing if configured
      if (sequence.abTest) {
        sequenceRun.abVariant = this.selectABVariant(sequence.abTest);
      }

      this.activeSequenceRuns.set(sequenceRun.id, sequenceRun);
      await this.saveSequenceRun(sequenceRun);

      // Schedule first step
      await this.scheduleNextStep(sequenceRun);

      this.emit('sequence:triggered', {
        sequenceId,
        contactId,
        runId: sequenceRun.id,
        triggerData
      });

      return sequenceRun;
    } catch (error) {
      console.error('❌ Error triggering sequence:', error);
      throw new Error(`Failed to trigger sequence: ${error}`);
    }
  }

  async cancelSequenceRun(runId: string): Promise<void> {
    try {
      const sequenceRun = this.activeSequenceRuns.get(runId);
      if (!sequenceRun) {
        throw new Error('Sequence run not found');
      }

      sequenceRun.status = 'cancelled';
      sequenceRun.completedAt = new Date();

      this.activeSequenceRuns.delete(runId);
      await this.saveSequenceRun(sequenceRun);

      this.emit('sequence:cancelled', { runId, sequenceRun });

      console.log(`✅ Cancelled sequence run: ${runId}`);
    } catch (error) {
      console.error('❌ Error cancelling sequence run:', error);
      throw error;
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async validateTemplate(template: EmailTemplate): Promise<void> {
    if (!template.name || !template.subject) {
      throw new Error('Template name and subject are required');
    }

    if (!template.htmlContent && !template.textContent) {
      throw new Error('Template must have either HTML or text content');
    }

    // Validate variables
    for (const variable of template.variables) {
      if (!variable.name || !variable.type) {
        throw new Error('Template variables must have name and type');
      }
    }
  }

  private async validateSequence(sequence: EmailSequence): Promise<void> {
    if (!sequence.name || !sequence.steps || sequence.steps.length === 0) {
      throw new Error('Sequence must have name and at least one step');
    }

    // Validate each step
    for (const step of sequence.steps) {
      const template = this.templates.get(step.templateId);
      if (!template) {
        throw new Error(`Template not found for step: ${step.name}`);
      }

      if (template.status !== 'active') {
        throw new Error(`Template is not active for step: ${step.name}`);
      }
    }

    // Validate triggers
    if (!sequence.triggers || sequence.triggers.length === 0) {
      throw new Error('Sequence must have at least one trigger');
    }
  }

  private evaluateSegmentRules(contact: Contact, rules: SegmentRule[]): boolean {
    if (!rules || rules.length === 0) return true;

    let result = this.evaluateRule(contact, rules[0]);

    for (let i = 1; i < rules.length; i++) {
      const rule = rules[i];
      const ruleResult = this.evaluateRule(contact, rule);

      if (rule.logic === 'and') {
        result = result && ruleResult;
      } else {
        result = result || ruleResult;
      }
    }

    return result;
  }

  private evaluateRule(contact: Contact, rule: SegmentRule): boolean {
    const value = this.getContactFieldValue(contact, rule.field);

    switch (rule.operator) {
      case 'equals':
        return value === rule.value;
      case 'not_equals':
        return value !== rule.value;
      case 'contains':
        return String(value).includes(String(rule.value));
      case 'not_contains':
        return !String(value).includes(String(rule.value));
      case 'greater_than':
        return Number(value) > Number(rule.value);
      case 'less_than':
        return Number(value) < Number(rule.value);
      case 'exists':
        return value !== undefined && value !== null;
      case 'not_exists':
        return value === undefined || value === null;
      default:
        return false;
    }
  }

  private getContactFieldValue(contact: Contact, field: string): any {
    // Handle nested field access
    if (field.includes('.')) {
      const [parent, child] = field.split('.', 2);
      switch (parent) {
        case 'properties':
          return contact.properties[child];
        case 'engagement':
          return (contact.engagement as any)[child];
        case 'preferences':
          return (contact.preferences as any)[child];
        default:
          return undefined;
      }
    }

    return (contact as any)[field];
  }

  private selectABVariant(config: SequenceABTest): string {
    const variants = config.variants.filter(v => v.sequence.status === 'active');
    return variants[Math.floor(Math.random() * variants.length)]?.id || config.variants[0]?.id || '';
  }

  private async scheduleNextStep(sequenceRun: SequenceRun): Promise<void> {
    // Implementation for scheduling the next step in the sequence
    console.log(`Scheduling next step for sequence run: ${sequenceRun.id}`);
  }

  private startSequenceProcessor(): void {
    this.processingInterval = setInterval(async () => {
      try {
        await this.processSequenceQueue();
      } catch (error) {
        console.error('❌ Error in sequence processor:', error);
        this.emit('sequence_processor:error', { error: (error as Error).message });
      }
    }, 60000); // Process every minute
  }

  private startDeliverabilityOptimizer(): void {
    this.deliverabilityInterval = setInterval(async () => {
      try {
        await this.optimizeDeliverability();
      } catch (error) {
        console.error('❌ Error in deliverability optimizer:', error);
        this.emit('deliverability_optimizer:error', { error: (error as Error).message });
      }
    }, 300000); // Check every 5 minutes
  }

  private startPerformanceTracker(): void {
    this.analyticsInterval = setInterval(async () => {
      try {
        await this.updatePerformanceMetrics();
      } catch (error) {
        console.error('❌ Error in performance tracker:', error);
        this.emit('performance_tracker:error', { error: (error as Error).message });
      }
    }, 900000); // Update every 15 minutes
  }

  private async processSequenceQueue(): Promise<void> {
    // Implementation for processing sequence queue
  }

  private async optimizeDeliverability(): Promise<void> {
    // Implementation for deliverability optimization
  }

  private async updatePerformanceMetrics(): Promise<void> {
    // Implementation for performance metrics update
  }

  private async generateAnalytics(timeframe: { start: Date; end: Date }): Promise<EmailAnalytics> {
    // Generate comprehensive analytics
    const analytics: EmailAnalytics = {
      timeframe,
      overview: {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalConverted: 0,
        totalRevenue: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
        revenuePerEmail: 0
      },
      trends: [],
      topPerformers: {
        templates: [],
        sequences: []
      },
      segments: [],
      devices: [],
      clients: []
    };

    return analytics;
  }

  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
      redis: 'healthy' | 'unhealthy';
      sequenceProcessor: 'healthy' | 'unhealthy';
      deliverabilityOptimizer: 'healthy' | 'unhealthy';
      performanceTracker: 'healthy' | 'unhealthy';
    };
    metrics: {
      templatesCount: number;
      sequencesCount: number;
      activeSequences: number;
      queuedEmails: number;
      processingLatency: number;
    };
    uptime: number;
  }> {
    try {
      const redisHealth = await this.redis.ping() === 'PONG' ? 'healthy' : 'unhealthy';

      return {
        status: redisHealth === 'healthy' && this.isInitialized ? 'healthy' : 'degraded',
        components: {
          redis: redisHealth,
          sequenceProcessor: this.processingInterval ? 'healthy' : 'unhealthy',
          deliverabilityOptimizer: this.deliverabilityInterval ? 'healthy' : 'unhealthy',
          performanceTracker: this.analyticsInterval ? 'healthy' : 'unhealthy'
        },
        metrics: {
          templatesCount: this.templates.size,
          sequencesCount: this.sequences.size,
          activeSequences: this.getActiveSequences().length,
          queuedEmails: 0,
          processingLatency: 0
        },
        uptime: process.uptime()
      };
    } catch (error) {
      console.error('❌ Error checking email engine health:', error);
      return {
        status: 'unhealthy',
        components: {
          redis: 'unhealthy',
          sequenceProcessor: 'unhealthy',
          deliverabilityOptimizer: 'unhealthy',
          performanceTracker: 'unhealthy'
        },
        metrics: {
          templatesCount: 0,
          sequencesCount: 0,
          activeSequences: 0,
          queuedEmails: 0,
          processingLatency: 0
        },
        uptime: 0
      };
    }
  }

  // =============================================================================
  // REDIS PERSISTENCE METHODS
  // =============================================================================

  private async saveTemplate(template: EmailTemplate): Promise<void> {
    await this.redis.hset('email:templates', template.id, JSON.stringify(template));
    await this.updateTemplateCacheExpiry(template.id);
  }

  private async removeTemplate(id: string): Promise<void> {
    await this.redis.hdel('email:templates', id);
  }

  private async saveSequence(sequence: EmailSequence): Promise<void> {
    await this.redis.hset('email:sequences', sequence.id, JSON.stringify(sequence));
    await this.updateSequenceCacheExpiry(sequence.id);
  }

  private async removeSequence(id: string): Promise<void> {
    await this.redis.hdel('email:sequences', id);
  }

  private async saveCampaign(campaign: EmailCampaign): Promise<void> {
    await this.redis.hset('email:campaigns', campaign.id, JSON.stringify(campaign));
  }

  private async saveContact(contact: Contact): Promise<void> {
    await this.redis.hset('email:contacts', contact.id, JSON.stringify(contact));
  }

  private async saveSequenceRun(run: SequenceRun): Promise<void> {
    await this.redis.hset('email:sequence:runs', run.id, JSON.stringify(run));
  }

  private async loadTemplates(): Promise<void> {
    try {
      const templatesData = await this.redis.hgetall('email:templates');
      for (const [id, data] of Object.entries(templatesData)) {
        this.templates.set(id, JSON.parse(data));
      }
    } catch (error) {
      console.warn('Warning: Could not load templates from Redis:', error);
    }
  }

  private async loadSequences(): Promise<void> {
    try {
      const sequencesData = await this.redis.hgetall('email:sequences');
      for (const [id, data] of Object.entries(sequencesData)) {
        this.sequences.set(id, JSON.parse(data));
      }
    } catch (error) {
      console.warn('Warning: Could not load sequences from Redis:', error);
    }
  }

  private async loadContacts(): Promise<void> {
    try {
      const contactsData = await this.redis.hgetall('email:contacts');
      for (const [id, data] of Object.entries(contactsData)) {
        this.contacts.set(id, JSON.parse(data));
      }
    } catch (error) {
      console.warn('Warning: Could not load contacts from Redis:', error);
    }
  }

  private async initializeRedisKeys(): Promise<void> {
    try {
      // Ensure hash keys exist
      const keys = [
        'email:templates',
        'email:sequences',
        'email:contacts',
        'email:campaigns',
        'email:sequence:runs'
      ];

      for (const key of keys) {
        const exists = await this.redis.exists(key);
        if (!exists) {
          await this.redis.hset(key, 'initialized', 'true');
          await this.redis.hdel(key, 'initialized');
        }
      }
    } catch (error) {
      console.error('❌ Error initializing Redis keys:', error);
      throw error;
    }
  }

  private async updateTemplateCacheExpiry(templateId: string): Promise<void> {
    // Set cache expiry if needed
  }

  private async updateSequenceCacheExpiry(sequenceId: string): Promise<void> {
    // Set cache expiry if needed
  }

  private async evaluateBehavioralConditions(conditions: BehavioralCondition[], eventData: any, contactId: string): Promise<boolean> {
    // Implementation for evaluating behavioral conditions
    return true;
  }

  private async executeBehavioralActions(actions: BehavioralAction[], contactId: string, eventData: any): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'add_to_sequence':
            await this.addContactToSequence(contactId, action.parameters.sequenceId);
            break;
          case 'send_email':
            // Implementation for sending email
            break;
          case 'update_property':
            // Implementation for updating contact property
            break;
          case 'add_tag':
            // Implementation for adding tag
            break;
          case 'trigger_webhook':
            // Implementation for triggering webhook
            break;
        }
      } catch (error) {
        console.error('❌ Error executing behavioral action:', error);
        this.emit('behavioral_action:error', { action, error: (error as Error).message });
      }
    }
  }

  // Add the missing addContactToSequence method
  public async addContactToSequence(contactId: string, sequenceId: string): Promise<void> {
    try {
      const contact = this.contacts.get(contactId);
      const sequence = this.sequences.get(sequenceId);

      if (!contact || !sequence) {
        throw new Error('Contact or sequence not found');
      }

      // Check if contact is already in this sequence
      const existingEntry = contact.sequences.find(s => s.sequenceId === sequenceId);
      if (existingEntry) {
        console.log(`Contact ${contactId} is already in sequence ${sequenceId}`);
        return;
      }

      // Add contact to sequence
      contact.sequences.push({
        sequenceId,
        status: 'active',
        currentStep: 0,
        startDate: new Date()
      });

      await this.saveContact(contact);
      this.emit('contact:added_to_sequence', { contactId, sequenceId });
    } catch (error) {
      console.error('❌ Error adding contact to sequence:', error);
      throw error;
    }
  }

  // =============================================================================
  // MISSING METHODS FOR ROUTE COMPATIBILITY
  // =============================================================================

  /**
   * List templates with filtering options
   */
  public async listTemplates(filters?: {
    type?: string;
    status?: string;
    tags?: string[];
    search?: string;
  }): Promise<EmailTemplate[]> {
    try {
      let templates = this.getAllTemplates();

      if (filters) {
        if (filters.type) {
          templates = templates.filter(t => t.type === filters.type);
        }

        if (filters.status) {
          templates = templates.filter(t => t.status === filters.status);
        }

        if (filters.tags && filters.tags.length > 0) {
          templates = templates.filter(t =>
            filters.tags!.some(tag => t.tags.includes(tag))
          );
        }

        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          templates = templates.filter(t =>
            t.name.toLowerCase().includes(searchTerm) ||
            t.subject.toLowerCase().includes(searchTerm) ||
            (t.metadata.description && t.metadata.description.toLowerCase().includes(searchTerm))
          );
        }
      }

      return templates;
    } catch (error) {
      console.error('Error listing templates:', error);
      throw error;
    }
  }

  /**
   * Create A/B test variants for a template
   */
  public async createTemplateABTest(templateId: string, variants: Omit<EmailTemplateVariant, 'id' | 'performance' | 'testStartDate'>[]): Promise<EmailTemplateVariant[]> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const abTestVariants: EmailTemplateVariant[] = variants.map(variant => ({
        ...variant,
        id: this.generateId(),
        performance: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          unsubscribed: 0,
          bounced: 0,
          complained: 0,
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
          conversionRate: 0,
          unsubscribeRate: 0,
          bounceRate: 0,
          complaintRate: 0,
          revenue: 0,
          revenuePerEmail: 0
        },
        testStartDate: new Date()
      }));

      // Update template with A/B test variants
      template.abTestVariants = abTestVariants;
      await this.updateTemplate(templateId, { abTestVariants });

      return abTestVariants;
    } catch (error) {
      console.error('Error creating template A/B test:', error);
      throw error;
    }
  }

  /**
   * Remove contact from sequence
   */
  public async removeContactFromSequence(contactId: string, sequenceId: string): Promise<boolean> {
    try {
      const contact = this.contacts.get(contactId);
      if (!contact) {
        return false;
      }

      const sequenceIndex = contact.sequences.findIndex(s => s.sequenceId === sequenceId);
      if (sequenceIndex === -1) {
        return false;
      }

      // Remove from contact's sequences
      contact.sequences.splice(sequenceIndex, 1);
      await this.updateContact(contactId, { sequences: contact.sequences });

      // Cancel any active sequence runs
      const activeRun = Array.from(this.activeSequenceRuns.values())
        .find(run => run.contactId === contactId && run.sequenceId === sequenceId);

      if (activeRun) {
        await this.cancelSequenceRun(activeRun.id);
      }

      this.emit('contact:removed_from_sequence', { contactId, sequenceId });
      return true;
    } catch (error) {
      console.error('Error removing contact from sequence:', error);
      throw error;
    }
  }

  /**
   * Create behavioral trigger
   */
  public async createBehavioralTrigger(triggerData: Omit<BehavioralTrigger, 'id' | 'performance'>): Promise<BehavioralTrigger> {
    try {
      const trigger: BehavioralTrigger = {
        ...triggerData,
        id: this.generateId(),
        performance: {
          triggered: 0,
          executed: 0,
          errors: 0,
          averageResponseTime: 0
        }
      };

      // Save to Redis
      await this.redis.hset(
        'behavioral_triggers',
        trigger.id,
        JSON.stringify(trigger)
      );

      return trigger;
    } catch (error) {
      console.error('Error creating behavioral trigger:', error);
      throw error;
    }
  }

  /**
   * Process behavioral event
   */
  public async processBehavioralEvent(eventType: string, eventData: any, contactId: string): Promise<void> {
    try {
      const contact = this.contacts.get(contactId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      // Get all active behavioral triggers for this event type
      const triggerKeys = await this.redis.hkeys('behavioral_triggers');
      const triggers: BehavioralTrigger[] = [];

      for (const key of triggerKeys) {
        const triggerData = await this.redis.hget('behavioral_triggers', key);
        if (triggerData) {
          const trigger = JSON.parse(triggerData) as BehavioralTrigger;
          if (trigger.active && trigger.eventType === eventType) {
            triggers.push(trigger);
          }
        }
      }

      // Process each matching trigger
      for (const trigger of triggers) {
        try {
          const conditionsMet = await this.evaluateBehavioralConditions(trigger.conditions, eventData, contactId);

          if (conditionsMet) {
            await this.executeBehavioralActions(trigger.actions, contactId, eventData);

            // Update trigger performance
            trigger.performance.triggered++;
            trigger.performance.executed++;
            trigger.performance.lastTriggered = new Date();

            await this.redis.hset(
              'behavioral_triggers',
              trigger.id,
              JSON.stringify(trigger)
            );
          }
        } catch (error) {
          console.error(`Error processing trigger ${trigger.id}:`, error);

          // Update error metrics
          trigger.performance.errors++;
          await this.redis.hset(
            'behavioral_triggers',
            trigger.id,
            JSON.stringify(trigger)
          );
        }
      }
    } catch (error) {
      console.error('Error processing behavioral event:', error);
      throw error;
    }
  }

  /**
   * Send individual email
   */
  public async sendEmail(emailData: {
    templateId: string;
    contactId: string;
    variables?: Record<string, any>;
    scheduledTime?: Date;
  }): Promise<EmailExecution> {
    try {
      const template = await this.getTemplate(emailData.templateId);
      const contact = this.contacts.get(emailData.contactId);

      if (!template) {
        throw new Error('Template not found');
      }

      if (!contact) {
        throw new Error('Contact not found');
      }

      const execution: EmailExecution = {
        id: this.generateId(),
        contactId: emailData.contactId,
        templateId: emailData.templateId,
        status: 'queued',
        scheduledTime: emailData.scheduledTime || new Date(),
        subject: template.subject,
        fromEmail: 'noreply@example.com', // Should be configurable
        fromName: 'Email Automation',
        toEmail: contact.email,
        metadata: {
          messageId: this.generateId(),
          campaignId: 'manual_send'
        },
        events: [{
          type: 'queued',
          timestamp: new Date()
        }]
      };

      // Save execution to Redis
      await this.redis.hset(
        'email_executions',
        execution.id,
        JSON.stringify(execution)
      );

      // Queue for processing (simplified - would integrate with actual email service)
      setTimeout(async () => {
        execution.status = 'sent';
        execution.sentTime = new Date();
        execution.events.push({
          type: 'sent',
          timestamp: new Date()
        });

        await this.redis.hset(
          'email_executions',
          execution.id,
          JSON.stringify(execution)
        );
      }, 1000);

      return execution;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Update deliverability settings
   */
  public async updateDeliverabilitySettings(settings: Partial<DeliverabilitySettings>): Promise<void> {
    try {
      const currentSettings = await this.getDeliverabilitySettings();
      const updatedSettings = { ...currentSettings, ...settings };

      await this.redis.set(
        'deliverability_settings',
        JSON.stringify(updatedSettings)
      );
    } catch (error) {
      console.error('Error updating deliverability settings:', error);
      throw error;
    }
  }

  /**
   * Get deliverability settings
   */
  private async getDeliverabilitySettings(): Promise<DeliverabilitySettings> {
    try {
      const settingsData = await this.redis.get('deliverability_settings');

      if (settingsData) {
        return JSON.parse(settingsData);
      }

      // Return default settings
      const defaultSettings: DeliverabilitySettings = {
        enableOptimization: true,
        reputationThreshold: 80,
        throttling: {
          enabled: true,
          maxPerHour: 1000,
          maxPerDay: 10000
        },
        warmup: {
          enabled: false,
          startVolume: 100,
          increaseRate: 20,
          targetVolume: 1000
        },
        domainAuthentication: {
          spf: true,
          dkim: true,
          dmarc: true
        },
        listHygiene: {
          enabled: true,
          bounceHandling: true,
          suppressionList: true,
          engagementFiltering: true
        }
      };

      // Save default settings
      await this.redis.set('deliverability_settings', JSON.stringify(defaultSettings));
      return defaultSettings;
    } catch (error) {
      console.error('Error getting deliverability settings:', error);
      throw error;
    }
  }

  /**
   * Get deliverability metrics
   */
  public async getDeliverabilityMetrics(): Promise<DeliverabilityMetrics> {
    try {
      const metricsData = await this.redis.get('deliverability_metrics');

      if (metricsData) {
        return JSON.parse(metricsData);
      }

      // Calculate metrics from stored data
      const executions = await this.getRecentExecutions();
      const metrics = this.calculateDeliverabilityMetrics(executions);

      // Cache metrics
      await this.redis.setex('deliverability_metrics', 300, JSON.stringify(metrics)); // Cache for 5 minutes

      return metrics;
    } catch (error) {
      console.error('Error getting deliverability metrics:', error);
      throw error;
    }
  }

  /**
   * Get email analytics
   */
  public async getEmailAnalytics(timeframe: { start: Date; end: Date }): Promise<EmailAnalytics> {
    try {
      return await this.generateAnalytics(timeframe);
    } catch (error) {
      console.error('Error getting email analytics:', error);
      throw error;
    }
  }

  /**
   * Helper method to get recent email executions
   */
  private async getRecentExecutions(): Promise<EmailExecution[]> {
    try {
      const executionKeys = await this.redis.hkeys('email_executions');
      const executions: EmailExecution[] = [];

      for (const key of executionKeys) {
        const executionData = await this.redis.hget('email_executions', key);
        if (executionData) {
          executions.push(JSON.parse(executionData));
        }
      }

      return executions;
    } catch (error) {
      console.error('Error getting recent executions:', error);
      return [];
    }
  }

  /**
   * Helper method to calculate deliverability metrics
   */
  private calculateDeliverabilityMetrics(executions: EmailExecution[]): DeliverabilityMetrics {
    const total = executions.length;

    if (total === 0) {
      return {
        reputation: 100,
        deliveryRate: 0,
        inboxPlacement: 0,
        spamRate: 0,
        bounceRate: 0,
        complaintRate: 0,
        unsubscribeRate: 0,
        engagementRate: 0,
        blacklistStatus: false,
        recommendations: []
      };
    }

    const delivered = executions.filter(e => e.status === 'delivered').length;
    const bounced = executions.filter(e => e.status === 'bounced').length;
    const complained = executions.filter(e => e.status === 'complained').length;
    const opened = executions.filter(e => e.openedTime).length;
    const clicked = executions.filter(e => e.clickedTime).length;

    const deliveryRate = (delivered / total) * 100;
    const bounceRate = (bounced / total) * 100;
    const complaintRate = (complained / total) * 100;
    const engagementRate = delivered > 0 ? ((opened + clicked) / delivered) * 100 : 0;

    return {
      reputation: Math.max(0, 100 - (bounceRate * 2) - (complaintRate * 5)),
      deliveryRate,
      inboxPlacement: Math.max(0, 100 - complaintRate * 10),
      spamRate: complaintRate,
      bounceRate,
      complaintRate,
      unsubscribeRate: 0, // Would need unsubscribe tracking
      engagementRate,
      blacklistStatus: complaintRate > 1 || bounceRate > 10,
      recommendations: [
        ...(bounceRate > 5 ? ['Improve list hygiene to reduce bounce rate'] : []),
        ...(complaintRate > 0.5 ? ['Review content to reduce spam complaints'] : []),
        ...(engagementRate < 20 ? ['Improve subject lines and content to increase engagement'] : [])
      ]
    };
  }
}

// Export singleton instance
export const emailSequenceEngine = new UniversalAutomatedEmailSequenceEngine();

// Default export for backward compatibility
export default UniversalAutomatedEmailSequenceEngine;

export interface SequenceRun {
  id: string;
  sequenceId: string;
  contactId: string;
  currentStepIndex: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled' | 'failed';
  triggerData: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  metadata: Record<string, any>;
  abVariant?: string;
}
