import { EventEmitter } from 'events';
import Redis from 'ioredis';

// =============================================================================
// CORE INTERFACES - Universal Notification System
// =============================================================================

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'webhook' | 'slack' | 'teams' | 'in_app' | 'custom';
  enabled: boolean;
  config: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  rateLimits: {
    maxPerMinute: number;
    maxPerHour: number;
    maxPerDay: number;
  };
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  deliveryWindows?: {
    timezone: string;
    allowedHours: { start: string; end: string }[];
    allowedDays: number[]; // 0-6 (Sunday-Saturday)
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  channel: string;
  subject?: string;
  content: string;
  variables: string[];
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationRecipient {
  id: string;
  type: 'user' | 'group' | 'role' | 'external';
  identifier: string; // email, phone, user_id, etc.
  preferences: {
    channels: string[];
    quietHours?: {
      start: string;
      end: string;
      timezone: string;
    };
    frequency: 'immediate' | 'batched' | 'daily_digest' | 'weekly_digest';
  };
  metadata: Record<string, any>;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    event: string;
    conditions: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
      value: any;
    }>;
  };
  actions: Array<{
    channel: string;
    template: string;
    recipients: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    delay?: number; // milliseconds
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationEvent {
  id: string;
  type: string;
  source: string;
  data: Record<string, any>;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metadata: Record<string, any>;
}

export interface NotificationMessage {
  id: string;
  eventId: string;
  ruleId: string;
  channel: string;
  template: string;
  recipient: NotificationRecipient;
  subject?: string;
  content: string;
  variables: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  attempts: number;
  scheduledAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  metadata: Record<string, any>;
}

export interface NotificationDeliveryResult {
  messageId: string;
  success: boolean;
  deliveredAt?: Date;
  error?: string;
  metadata: Record<string, any>;
}

export interface NotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  avgDeliveryTime: number;
  channelBreakdown: Record<string, {
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
  }>;
  priorityBreakdown: Record<string, {
    sent: number;
    delivered: number;
    failed: number;
  }>;
  recentActivity: Array<{
    timestamp: Date;
    type: string;
    count: number;
  }>;
  topFailureReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
}

export interface NotificationFilters {
  channels?: string[];
  statuses?: string[];
  priorities?: string[];
  recipients?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

// =============================================================================
// UNIVERSAL REAL-TIME NOTIFICATION SERVICE
// =============================================================================

export class RealTimeNotificationService extends EventEmitter {
  private redis: Redis;
  private channels: Map<string, NotificationChannel> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private rules: Map<string, NotificationRule> = new Map();
  private recipients: Map<string, NotificationRecipient> = new Map();
  private messageQueue: NotificationMessage[] = [];
  private processingInterval?: NodeJS.Timeout;
  private isProcessing = false;

  constructor(redis: Redis) {
    super();
    this.redis = redis;
    this.initializeDefaultChannels();
    this.initializeDefaultTemplates();
    this.startMessageProcessor();
  }

  // =============================================================================
  // INITIALIZATION METHODS
  // =============================================================================

  private initializeDefaultChannels(): void {
    const defaultChannels: NotificationChannel[] = [
      {
        id: 'email',
        name: 'Email Notifications',
        type: 'email',
        enabled: true,
        config: {
          smtp: {
            host: process.env.SMTP_HOST || 'localhost',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          },
          from: process.env.EMAIL_FROM || 'noreply@optimizely.com',
        },
        priority: 'medium',
        rateLimits: {
          maxPerMinute: 100,
          maxPerHour: 1000,
          maxPerDay: 10000,
        },
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelayMs: 1000,
        },
      },
      {
        id: 'sms',
        name: 'SMS Notifications',
        type: 'sms',
        enabled: true,
        config: {
          provider: 'twilio',
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          from: process.env.TWILIO_PHONE_NUMBER,
        },
        priority: 'high',
        rateLimits: {
          maxPerMinute: 50,
          maxPerHour: 500,
          maxPerDay: 2000,
        },
        retryPolicy: {
          maxRetries: 2,
          backoffMultiplier: 2,
          initialDelayMs: 2000,
        },
      },
      {
        id: 'webhook',
        name: 'Webhook Notifications',
        type: 'webhook',
        enabled: true,
        config: {},
        priority: 'medium',
        rateLimits: {
          maxPerMinute: 200,
          maxPerHour: 2000,
          maxPerDay: 20000,
        },
        retryPolicy: {
          maxRetries: 5,
          backoffMultiplier: 1.5,
          initialDelayMs: 500,
        },
      },
      {
        id: 'in_app',
        name: 'In-App Notifications',
        type: 'in_app',
        enabled: true,
        config: {},
        priority: 'low',
        rateLimits: {
          maxPerMinute: 500,
          maxPerHour: 5000,
          maxPerDay: 50000,
        },
        retryPolicy: {
          maxRetries: 1,
          backoffMultiplier: 1,
          initialDelayMs: 100,
        },
      },
    ];

    defaultChannels.forEach(channel => {
      this.channels.set(channel.id, channel);
    });
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'hot_lead_alert',
        name: 'Hot Lead Alert',
        description: 'Alert for high-priority lead activity',
        channel: 'email',
        subject: '🔥 Hot Lead Alert: {{leadName}} - {{companyName}}',
        content: `
          <h2>Hot Lead Alert</h2>
          <p>A high-priority lead has been identified:</p>
          <ul>
            <li><strong>Lead:</strong> {{leadName}}</li>
            <li><strong>Company:</strong> {{companyName}}</li>
            <li><strong>Score:</strong> {{leadScore}}/100</li>
            <li><strong>Territory:</strong> {{territory}}</li>
            <li><strong>Source:</strong> {{source}}</li>
          </ul>
          <p><strong>Recent Activity:</strong></p>
          <p>{{recentActivity}}</p>
          <p><a href="{{leadUrl}}">View Lead Details</a></p>
        `,
        variables: ['leadName', 'companyName', 'leadScore', 'territory', 'source', 'recentActivity', 'leadUrl'],
        metadata: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'account_activity_alert',
        name: 'Account Activity Alert',
        description: 'Alert for significant account activity',
        channel: 'email',
        subject: '📊 Account Activity: {{accountName}}',
        content: `
          <h2>Account Activity Alert</h2>
          <p>Significant activity detected for account:</p>
          <ul>
            <li><strong>Account:</strong> {{accountName}}</li>
            <li><strong>Activity Type:</strong> {{activityType}}</li>
            <li><strong>Value:</strong> {{activityValue}}</li>
            <li><strong>Territory:</strong> {{territory}}</li>
          </ul>
          <p><strong>Details:</strong></p>
          <p>{{activityDetails}}</p>
          <p><a href="{{accountUrl}}">View Account Details</a></p>
        `,
        variables: ['accountName', 'activityType', 'activityValue', 'territory', 'activityDetails', 'accountUrl'],
        metadata: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'territory_alert',
        name: 'Territory Alert',
        description: 'Alert for territory-related events',
        channel: 'email',
        subject: '🎯 Territory Alert: {{territoryName}}',
        content: `
          <h2>Territory Alert</h2>
          <p>Important update for your territory:</p>
          <ul>
            <li><strong>Territory:</strong> {{territoryName}}</li>
            <li><strong>Alert Type:</strong> {{alertType}}</li>
            <li><strong>Priority:</strong> {{priority}}</li>
          </ul>
          <p><strong>Details:</strong></p>
          <p>{{alertDetails}}</p>
          <p><a href="{{territoryUrl}}">View Territory Dashboard</a></p>
        `,
        variables: ['territoryName', 'alertType', 'priority', 'alertDetails', 'territoryUrl'],
        metadata: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private startMessageProcessor(): void {
    this.processingInterval = setInterval(() => {
      this.processMessageQueue();
    }, 1000); // Process every second
  }

  // =============================================================================
  // CHANNEL MANAGEMENT
  // =============================================================================

  async createChannel(channelData: Omit<NotificationChannel, 'id'>): Promise<NotificationChannel> {
    const channel: NotificationChannel = {
      id: `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...channelData,
    };

    this.channels.set(channel.id, channel);
    await this.redis.setex(`notification:channel:${channel.id}`, 3600, JSON.stringify(channel));

    this.emit('channel_created', channel);
    return channel;
  }

  async updateChannel(channelId: string, updates: Partial<NotificationChannel>): Promise<NotificationChannel | null> {
    const channel = this.channels.get(channelId);
    if (!channel) return null;

    const updatedChannel = { ...channel, ...updates };
    this.channels.set(channelId, updatedChannel);
    await this.redis.setex(`notification:channel:${channelId}`, 3600, JSON.stringify(updatedChannel));

    this.emit('channel_updated', updatedChannel);
    return updatedChannel;
  }

  getChannels(filters?: { type?: string; enabled?: boolean }): NotificationChannel[] {
    let channels = Array.from(this.channels.values());

    if (filters?.type) {
      channels = channels.filter(c => c.type === filters.type);
    }

    if (filters?.enabled !== undefined) {
      channels = channels.filter(c => c.enabled === filters.enabled);
    }

    return channels;
  }

  getChannel(channelId: string): NotificationChannel | null {
    return this.channels.get(channelId) || null;
  }

  // =============================================================================
  // TEMPLATE MANAGEMENT
  // =============================================================================

  async createTemplate(templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    const template: NotificationTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(template.id, template);
    await this.redis.setex(`notification:template:${template.id}`, 3600, JSON.stringify(template));

    this.emit('template_created', template);
    return template;
  }

  async updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const updatedTemplate = { ...template, ...updates, updatedAt: new Date() };
    this.templates.set(templateId, updatedTemplate);
    await this.redis.setex(`notification:template:${templateId}`, 3600, JSON.stringify(updatedTemplate));

    this.emit('template_updated', updatedTemplate);
    return updatedTemplate;
  }

  getTemplates(filters?: { channel?: string; isActive?: boolean }): NotificationTemplate[] {
    let templates = Array.from(this.templates.values());

    if (filters?.channel) {
      templates = templates.filter(t => t.channel === filters.channel);
    }

    if (filters?.isActive !== undefined) {
      templates = templates.filter(t => t.isActive === filters.isActive);
    }

    return templates;
  }

  getTemplate(templateId: string): NotificationTemplate | null {
    return this.templates.get(templateId) || null;
  }

  // =============================================================================
  // RULE MANAGEMENT
  // =============================================================================

  async createRule(ruleData: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationRule> {
    const rule: NotificationRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...ruleData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.rules.set(rule.id, rule);
    await this.redis.setex(`notification:rule:${rule.id}`, 3600, JSON.stringify(rule));

    this.emit('rule_created', rule);
    return rule;
  }

  async updateRule(ruleId: string, updates: Partial<NotificationRule>): Promise<NotificationRule | null> {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    const updatedRule = { ...rule, ...updates, updatedAt: new Date() };
    this.rules.set(ruleId, updatedRule);
    await this.redis.setex(`notification:rule:${ruleId}`, 3600, JSON.stringify(updatedRule));

    this.emit('rule_updated', updatedRule);
    return updatedRule;
  }

  getRules(filters?: { isActive?: boolean; event?: string }): NotificationRule[] {
    let rules = Array.from(this.rules.values());

    if (filters?.isActive !== undefined) {
      rules = rules.filter(r => r.isActive === filters.isActive);
    }

    if (filters?.event) {
      rules = rules.filter(r => r.trigger.event === filters.event);
    }

    return rules;
  }

  getRule(ruleId: string): NotificationRule | null {
    return this.rules.get(ruleId) || null;
  }

  // =============================================================================
  // RECIPIENT MANAGEMENT
  // =============================================================================

  async createRecipient(recipientData: Omit<NotificationRecipient, 'id'>): Promise<NotificationRecipient> {
    const recipient: NotificationRecipient = {
      id: `recipient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...recipientData,
    };

    this.recipients.set(recipient.id, recipient);
    await this.redis.setex(`notification:recipient:${recipient.id}`, 3600, JSON.stringify(recipient));

    this.emit('recipient_created', recipient);
    return recipient;
  }

  async updateRecipient(recipientId: string, updates: Partial<NotificationRecipient>): Promise<NotificationRecipient | null> {
    const recipient = this.recipients.get(recipientId);
    if (!recipient) return null;

    const updatedRecipient = { ...recipient, ...updates };
    this.recipients.set(recipientId, updatedRecipient);
    await this.redis.setex(`notification:recipient:${recipientId}`, 3600, JSON.stringify(updatedRecipient));

    this.emit('recipient_updated', updatedRecipient);
    return updatedRecipient;
  }

  getRecipients(filters?: { type?: string }): NotificationRecipient[] {
    let recipients = Array.from(this.recipients.values());

    if (filters?.type) {
      recipients = recipients.filter(r => r.type === filters.type);
    }

    return recipients;
  }

  getRecipient(recipientId: string): NotificationRecipient | null {
    return this.recipients.get(recipientId) || null;
  }

  // =============================================================================
  // EVENT PROCESSING AND NOTIFICATION TRIGGERING
  // =============================================================================

  async processEvent(event: NotificationEvent): Promise<void> {
    try {
      // Find matching rules
      const matchingRules = this.findMatchingRules(event);

      for (const rule of matchingRules) {
        if (!rule.isActive) continue;

        // Process each action in the rule
        for (const action of rule.actions) {
          await this.createNotificationMessage(event, rule, action);
        }
      }

      this.emit('event_processed', { event, rulesMatched: matchingRules.length });
    } catch (error) {
      console.error('Error processing notification event:', error);
      this.emit('event_processing_error', { event, error });
    }
  }

  private findMatchingRules(event: NotificationEvent): NotificationRule[] {
    return Array.from(this.rules.values()).filter(rule => {
      if (!rule.isActive) return false;
      if (rule.trigger.event !== event.type) return false;

      // Check conditions
      return rule.trigger.conditions.every(condition => {
        const eventValue = this.getNestedValue(event.data, condition.field);
        return this.evaluateCondition(eventValue, condition.operator, condition.value);
      });
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateCondition(eventValue: any, operator: string, conditionValue: any): boolean {
    switch (operator) {
      case 'equals':
        return eventValue === conditionValue;
      case 'not_equals':
        return eventValue !== conditionValue;
      case 'greater_than':
        return Number(eventValue) > Number(conditionValue);
      case 'less_than':
        return Number(eventValue) < Number(conditionValue);
      case 'contains':
        return String(eventValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'not_contains':
        return !String(eventValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      default:
        return false;
    }
  }

  private async createNotificationMessage(
    event: NotificationEvent,
    rule: NotificationRule,
    action: NotificationRule['actions'][0]
  ): Promise<void> {
    const channel = this.channels.get(action.channel);
    const template = this.templates.get(action.template);

    if (!channel || !template) {
      console.warn(`Missing channel (${action.channel}) or template (${action.template})`);
      return;
    }

    // Get recipients
    for (const recipientId of action.recipients) {
      const recipient = this.recipients.get(recipientId);
      if (!recipient) continue;

      // Check if recipient allows this channel
      if (!recipient.preferences.channels.includes(action.channel)) continue;

      // Create message
      const message: NotificationMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventId: event.id,
        ruleId: rule.id,
        channel: action.channel,
        template: action.template,
        recipient,
        subject: this.processTemplate(template.subject || '', event.data),
        content: this.processTemplate(template.content, event.data),
        variables: event.data,
        priority: action.priority,
        status: 'pending',
        attempts: 0,
        scheduledAt: new Date(Date.now() + (action.delay || 0)),
        metadata: {
          eventType: event.type,
          eventSource: event.source,
          ruleId: rule.id,
          channelId: action.channel,
          templateId: action.template,
        },
      };

      this.messageQueue.push(message);
      await this.redis.lpush('notification:queue', JSON.stringify(message));

      this.emit('message_queued', message);
    }
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, String(value || ''));
    });

    return processed;
  }

  // =============================================================================
  // MESSAGE QUEUE PROCESSING
  // =============================================================================

  private async processMessageQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) return;

    this.isProcessing = true;

    try {
      const now = new Date();
      const readyMessages = this.messageQueue.filter(msg =>
        msg.status === 'pending' && msg.scheduledAt <= now
      );

      for (const message of readyMessages.slice(0, 10)) { // Process up to 10 messages at a time
        await this.deliverMessage(message);
      }
    } catch (error) {
      console.error('Error processing message queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async deliverMessage(message: NotificationMessage): Promise<void> {
    try {
      const channel = this.channels.get(message.channel);
      if (!channel || !channel.enabled) {
        message.status = 'failed';
        message.failureReason = 'Channel not available or disabled';
        return;
      }

      // Check rate limits
      if (await this.isRateLimited(channel)) {
        // Reschedule for later
        message.scheduledAt = new Date(Date.now() + 60000); // 1 minute delay
        return;
      }

      // Deliver based on channel type
      const result = await this.deliverToChannel(channel, message);

      if (result.success) {
        message.status = 'sent';
        message.sentAt = new Date();
        if (result.deliveredAt) {
          message.status = 'delivered';
          message.deliveredAt = result.deliveredAt;
        }
      } else {
        message.attempts++;
        if (message.attempts >= channel.retryPolicy.maxRetries) {
          message.status = 'failed';
          message.failureReason = result.error;
        } else {
          // Schedule retry
          const delay = channel.retryPolicy.initialDelayMs *
            Math.pow(channel.retryPolicy.backoffMultiplier, message.attempts - 1);
          message.scheduledAt = new Date(Date.now() + delay);
        }
      }

      // Update message in queue
      const index = this.messageQueue.findIndex(m => m.id === message.id);
      if (index !== -1) {
        if (message.status === 'sent' || message.status === 'delivered' || message.status === 'failed') {
          this.messageQueue.splice(index, 1);
        }
      }

      // Store delivery result
      await this.redis.setex(
        `notification:delivery:${message.id}`,
        86400, // 24 hours
        JSON.stringify({ message, result })
      );

      this.emit('message_delivered', { message, result });

    } catch (error) {
      console.error('Error delivering message:', error);
      message.status = 'failed';
      message.failureReason = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  private async isRateLimited(channel: NotificationChannel): Promise<boolean> {
    const now = Date.now();
    const minuteKey = `rate_limit:${channel.id}:minute:${Math.floor(now / 60000)}`;
    const hourKey = `rate_limit:${channel.id}:hour:${Math.floor(now / 3600000)}`;
    const dayKey = `rate_limit:${channel.id}:day:${Math.floor(now / 86400000)}`;

    const [minuteCount, hourCount, dayCount] = await Promise.all([
      this.redis.incr(minuteKey),
      this.redis.incr(hourKey),
      this.redis.incr(dayKey),
    ]);

    // Set expiration on first increment
    if (minuteCount === 1) await this.redis.expire(minuteKey, 60);
    if (hourCount === 1) await this.redis.expire(hourKey, 3600);
    if (dayCount === 1) await this.redis.expire(dayKey, 86400);

    return (
      minuteCount > channel.rateLimits.maxPerMinute ||
      hourCount > channel.rateLimits.maxPerHour ||
      dayCount > channel.rateLimits.maxPerDay
    );
  }

  private async deliverToChannel(
    channel: NotificationChannel,
    message: NotificationMessage
  ): Promise<NotificationDeliveryResult> {
    const result: NotificationDeliveryResult = {
      messageId: message.id,
      success: false,
      metadata: {},
    };

    try {
      switch (channel.type) {
        case 'email':
          result.success = await this.deliverEmail(channel, message);
          break;
        case 'sms':
          result.success = await this.deliverSMS(channel, message);
          break;
        case 'webhook':
          result.success = await this.deliverWebhook(channel, message);
          break;
        case 'in_app':
          result.success = await this.deliverInApp(channel, message);
          break;
        default:
          result.success = await this.deliverCustom(channel, message);
      }

      if (result.success) {
        result.deliveredAt = new Date();
      }
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  private async deliverEmail(channel: NotificationChannel, message: NotificationMessage): Promise<boolean> {
    // Email delivery implementation would go here
    // For now, simulate delivery
    console.log(`📧 Email delivered to ${message.recipient.identifier}: ${message.subject}`);
    return true;
  }

  private async deliverSMS(channel: NotificationChannel, message: NotificationMessage): Promise<boolean> {
    // SMS delivery implementation would go here
    // For now, simulate delivery
    console.log(`📱 SMS delivered to ${message.recipient.identifier}: ${message.content.substring(0, 50)}...`);
    return true;
  }

  private async deliverWebhook(channel: NotificationChannel, message: NotificationMessage): Promise<boolean> {
    // Webhook delivery implementation would go here
    // For now, simulate delivery
    console.log(`🔗 Webhook delivered to ${message.recipient.identifier}`);
    return true;
  }

  private async deliverInApp(channel: NotificationChannel, message: NotificationMessage): Promise<boolean> {
    // In-app notification delivery implementation would go here
    // Store in Redis for real-time retrieval
    await this.redis.lpush(
      `notifications:user:${message.recipient.identifier}`,
      JSON.stringify({
        id: message.id,
        subject: message.subject,
        content: message.content,
        priority: message.priority,
        timestamp: new Date(),
        read: false,
      })
    );

    console.log(`🔔 In-app notification delivered to ${message.recipient.identifier}`);
    return true;
  }

  private async deliverCustom(channel: NotificationChannel, message: NotificationMessage): Promise<boolean> {
    // Custom channel delivery implementation would go here
    // For now, simulate delivery
    console.log(`🔧 Custom notification delivered via ${channel.name} to ${message.recipient.identifier}`);
    return true;
  }

  // =============================================================================
  // ANALYTICS AND REPORTING
  // =============================================================================

  async getAnalytics(filters?: {
    dateRange?: { start: Date; end: Date };
    channels?: string[];
  }): Promise<NotificationAnalytics> {
    // Implementation would query Redis/database for delivery statistics
    // For now, return mock analytics
    return {
      totalSent: 1250,
      totalDelivered: 1180,
      totalFailed: 70,
      deliveryRate: 94.4,
      avgDeliveryTime: 2.3,
      channelBreakdown: {
        email: { sent: 800, delivered: 760, failed: 40, deliveryRate: 95.0 },
        sms: { sent: 200, delivered: 190, failed: 10, deliveryRate: 95.0 },
        webhook: { sent: 150, delivered: 140, failed: 10, deliveryRate: 93.3 },
        in_app: { sent: 100, delivered: 90, failed: 10, deliveryRate: 90.0 },
      },
      priorityBreakdown: {
        critical: { sent: 50, delivered: 50, failed: 0 },
        high: { sent: 300, delivered: 290, failed: 10 },
        medium: { sent: 600, delivered: 570, failed: 30 },
        low: { sent: 300, delivered: 270, failed: 30 },
      },
      recentActivity: [
        { timestamp: new Date(), type: 'sent', count: 45 },
        { timestamp: new Date(Date.now() - 3600000), type: 'delivered', count: 42 },
        { timestamp: new Date(Date.now() - 7200000), type: 'failed', count: 3 },
      ],
      topFailureReasons: [
        { reason: 'Invalid email address', count: 25, percentage: 35.7 },
        { reason: 'Rate limit exceeded', count: 20, percentage: 28.6 },
        { reason: 'Channel unavailable', count: 15, percentage: 21.4 },
        { reason: 'Template error', count: 10, percentage: 14.3 },
      ],
    };
  }

  async getMessages(filters?: NotificationFilters): Promise<NotificationMessage[]> {
    // Implementation would query stored messages
    // For now, return current queue
    let messages = [...this.messageQueue];

    if (filters?.channels) {
      messages = messages.filter(m => filters.channels!.includes(m.channel));
    }

    if (filters?.statuses) {
      messages = messages.filter(m => filters.statuses!.includes(m.status));
    }

    if (filters?.priorities) {
      messages = messages.filter(m => filters.priorities!.includes(m.priority));
    }

    return messages;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    channels: number;
    templates: number;
    rules: number;
    queueSize: number;
    processingStatus: 'active' | 'inactive';
  }> {
    return {
      status: 'healthy',
      channels: this.channels.size,
      templates: this.templates.size,
      rules: this.rules.size,
      queueSize: this.messageQueue.length,
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
    // Create mock recipients
    const mockRecipients = [
      {
        type: 'user' as const,
        identifier: 'sales@optimizely.com',
        preferences: {
          channels: ['email', 'in_app'],
          frequency: 'immediate' as const,
        },
        metadata: { name: 'Sales Team', role: 'sales' },
      },
      {
        type: 'user' as const,
        identifier: '+1234567890',
        preferences: {
          channels: ['sms', 'email'],
          frequency: 'immediate' as const,
        },
        metadata: { name: 'Sales Manager', role: 'manager' },
      },
    ];

    mockRecipients.forEach(async (recipient) => {
      await this.createRecipient(recipient);
    });

    // Create mock rules
    const mockRules = [
      {
        name: 'Hot Lead Alert Rule',
        description: 'Alert when a high-score lead is identified',
        trigger: {
          event: 'lead_scored',
          conditions: [
            { field: 'score', operator: 'greater_than' as const, value: 80 },
          ],
        },
        actions: [
          {
            channel: 'email',
            template: 'hot_lead_alert',
            recipients: Array.from(this.recipients.keys()),
            priority: 'high' as const,
          },
        ],
        isActive: true,
      },
      {
        name: 'Account Activity Rule',
        description: 'Alert on significant account activity',
        trigger: {
          event: 'account_activity',
          conditions: [
            { field: 'value', operator: 'greater_than' as const, value: 10000 },
          ],
        },
        actions: [
          {
            channel: 'email',
            template: 'account_activity_alert',
            recipients: Array.from(this.recipients.keys()),
            priority: 'medium' as const,
          },
        ],
        isActive: true,
      },
    ];

    mockRules.forEach(async (rule) => {
      await this.createRule(rule);
    });
  }
}

export default RealTimeNotificationService;
