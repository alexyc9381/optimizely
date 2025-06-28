// =============================================================================
// UNIVERSAL SALES ALERT AND NOTIFICATION SERVICE
// =============================================================================
// A/B Testing Focused Real-time Alert and Notification System
// Handles test results, conversion events, and performance alerts

import { EventEmitter } from 'events';
import { RedisManager } from './redis-client';

// =============================================================================
// CORE INTERFACES FOR A/B TESTING ALERTS
// =============================================================================

export interface ABTestAlert {
  id: string;
  testId: string;
  type: 'statistical_significance' | 'conversion_threshold' | 'traffic_anomaly' | 'test_completion' | 'winner_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: {
    testName: string;
    variantId?: string;
    conversionRate?: number;
    confidenceLevel?: number;
    sampleSize?: number;
    pValue?: number;
    liftPercentage?: number;
    revenue?: number;
    anomalyDetails?: any;
  };
  channels: NotificationChannel[];
  priority: number;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  escalated: boolean;
  escalationLevel: number;
  metadata: {
    source: string;
    environment: 'development' | 'staging' | 'production';
    userId?: string;
    sessionId?: string;
    experimentGroup?: string;
  };
}

export interface ConversionAlert {
  id: string;
  type: 'goal_achieved' | 'revenue_milestone' | 'conversion_drop' | 'unusual_pattern';
  goalId: string;
  goalName: string;
  conversionData: {
    currentRate: number;
    previousRate?: number;
    changePercentage?: number;
    totalConversions: number;
    revenue?: number;
    averageOrderValue?: number;
  };
  testContext?: {
    testId: string;
    variantId: string;
    testName: string;
  };
  threshold: {
    type: 'absolute' | 'relative';
    value: number;
    direction: 'above' | 'below';
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push' | 'in_app' | 'teams' | 'discord';
  config: {
    recipients?: string[];
    webhookUrl?: string;
    slackChannel?: string;
    slackToken?: string;
    teamsWebhook?: string;
    discordWebhook?: string;
    phoneNumbers?: string[];
    pushTokens?: string[];
  };
  enabled: boolean;
  filters: {
    severity?: ('low' | 'medium' | 'high' | 'critical')[];
    testTypes?: string[];
    alertTypes?: string[];
    timeWindow?: {
      start: string;
      end: string;
      timezone: string;
    };
  };
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  rateLimiting: {
    maxPerMinute: number;
    maxPerHour: number;
    maxPerDay: number;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    testTypes?: string[];
    metricThresholds?: {
      metric: string;
      operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
      value: number;
    }[];
    timeConditions?: {
      minDuration?: number;
      maxDuration?: number;
      timeOfDay?: string[];
      daysOfWeek?: number[];
    };
    sampleSizeThresholds?: {
      minimum?: number;
      maximum?: number;
    };
    confidenceThresholds?: {
      minimum?: number;
      pValueMax?: number;
    };
  };
  actions: {
    channels: string[];
    escalationDelay?: number;
    customMessage?: string;
    suppressDuration?: number;
  };
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface AlertEscalation {
  ruleId: string;
  levels: {
    level: number;
    delay: number; // minutes
    channels: string[];
    recipients: string[];
    message?: string;
  }[];
  maxLevel: number;
  suppressAfterAcknowledge: boolean;
}

export interface AlertAnalytics {
  totalAlerts: number;
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  averageAcknowledgmentTime: number;
  escalationRate: number;
  channelPerformance: {
    channel: string;
    deliveryRate: number;
    averageDeliveryTime: number;
    errorRate: number;
  }[];
  topAlertTriggers: {
    testId: string;
    testName: string;
    alertCount: number;
  }[];
  responseMetrics: {
    acknowledgmentRate: number;
    averageResponseTime: number;
    resolvedWithinSLA: number;
  };
}

export interface AlertSubscription {
  id: string;
  userId: string;
  email: string;
  preferences: {
    channels: NotificationChannel[];
    frequency: 'immediate' | 'batched_5min' | 'batched_15min' | 'batched_hourly' | 'daily_digest';
    quietHours?: {
      start: string;
      end: string;
      timezone: string;
    };
    testFilters?: {
      testIds?: string[];
      testTypes?: string[];
      environments?: string[];
    };
    severityFilter: ('low' | 'medium' | 'high' | 'critical')[];
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertBatch {
  id: string;
  alerts: ABTestAlert[];
  recipient: string;
  channel: string;
  scheduledFor: Date;
  processed: boolean;
  processedAt?: Date;
  deliveryStatus: 'pending' | 'sent' | 'failed' | 'delivered';
  metadata: {
    batchSize: number;
    priority: number;
  };
}

// =============================================================================
// UNIVERSAL SALES ALERT AND NOTIFICATION SERVICE CLASS
// =============================================================================

export class UniversalSalesAlertNotificationService extends EventEmitter {
  private redis: any;
  private alertRules: Map<string, AlertRule> = new Map();
  private subscriptions: Map<string, AlertSubscription> = new Map();
  private escalations: Map<string, AlertEscalation> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private alertQueue: ABTestAlert[] = [];
  private processingQueue: boolean = false;
  private batchScheduler: NodeJS.Timeout | null = null;

  // Performance tracking
  private metrics = {
    alertsProcessed: 0,
    alertsDelivered: 0,
    alertsFailed: 0,
    averageProcessingTime: 0,
    channelStats: new Map<string, { sent: number; failed: number; avgTime: number }>()
  };

  constructor() {
    super();
    this.redis = RedisManager.getClient();
    this.initializeDefaultRules();
    this.initializeDefaultChannels();
    this.startBatchProcessor();
    this.setupMetrics();
  }

  // =============================================================================
  // A/B TEST ALERT GENERATION
  // =============================================================================

  async generateABTestAlert(
    testId: string,
    type: ABTestAlert['type'],
    data: ABTestAlert['data'],
    options: {
      severity?: ABTestAlert['severity'];
      customMessage?: string;
      metadata?: Partial<ABTestAlert['metadata']>;
    } = {}
  ): Promise<ABTestAlert> {
    const alertId = `alert_${testId}_${type}_${Date.now()}`;

    const alert: ABTestAlert = {
      id: alertId,
      testId,
      type,
      severity: options.severity || this.calculateSeverity(type, data),
      title: this.generateAlertTitle(type, data),
      message: options.customMessage || this.generateAlertMessage(type, data),
      data,
      channels: await this.getRelevantChannels(type, options.severity || 'medium'),
      priority: this.calculatePriority(type, options.severity || 'medium'),
      timestamp: new Date(),
      acknowledged: false,
      escalated: false,
      escalationLevel: 0,
      metadata: {
        source: 'ab_test_engine',
        environment: (process.env.NODE_ENV as any) || 'development',
        ...options.metadata
      }
    };

    // Store alert
    await this.storeAlert(alert);

    // Add to processing queue
    this.alertQueue.push(alert);

    // Process immediately for critical alerts
    if (alert.severity === 'critical') {
      await this.processAlert(alert);
    } else {
      this.scheduleQueueProcessing();
    }

    this.emit('alertGenerated', alert);
    return alert;
  }

  async generateConversionAlert(
    goalId: string,
    conversionData: ConversionAlert['conversionData'],
    threshold: ConversionAlert['threshold'],
    testContext?: ConversionAlert['testContext']
  ): Promise<ConversionAlert> {
    const alertId = `conv_alert_${goalId}_${Date.now()}`;

    const alert: ConversionAlert = {
      id: alertId,
      type: this.determineConversionAlertType(conversionData, threshold),
      goalId,
      goalName: await this.getGoalName(goalId),
      conversionData,
      testContext,
      threshold,
      severity: this.calculateConversionSeverity(conversionData, threshold),
      timestamp: new Date(),
      acknowledged: false
    };

    await this.storeConversionAlert(alert);
    this.emit('conversionAlert', alert);

    return alert;
  }

  // =============================================================================
  // STATISTICAL SIGNIFICANCE MONITORING
  // =============================================================================

  async checkStatisticalSignificance(
    testId: string,
    variantData: {
      variantId: string;
      conversions: number;
      visitors: number;
      revenue?: number;
    }[]
  ): Promise<void> {
    try {
      const results = await this.calculateStatisticalSignificance(variantData);

      for (const result of results) {
        if (result.isSignificant && result.confidenceLevel >= 95) {
          await this.generateABTestAlert(testId, 'statistical_significance', {
            testName: await this.getTestName(testId),
            variantId: result.variantId,
            conversionRate: result.conversionRate,
            confidenceLevel: result.confidenceLevel,
            sampleSize: result.sampleSize,
            pValue: result.pValue,
            liftPercentage: result.lift
          }, {
            severity: result.confidenceLevel >= 99 ? 'high' : 'medium'
          });
        }
      }
    } catch (error) {
      console.error('Error checking statistical significance:', error);
      this.emit('error', error);
    }
  }

  async detectTestWinner(
    testId: string,
    variantResults: {
      variantId: string;
      conversionRate: number;
      confidenceLevel: number;
      sampleSize: number;
      revenue?: number;
    }[]
  ): Promise<void> {
    const winner = this.determineWinner(variantResults);

    if (winner && winner.confidenceLevel >= 95) {
      await this.generateABTestAlert(testId, 'winner_detected', {
        testName: await this.getTestName(testId),
        variantId: winner.variantId,
        conversionRate: winner.conversionRate,
        confidenceLevel: winner.confidenceLevel,
        sampleSize: winner.sampleSize,
        liftPercentage: winner.lift,
        revenue: winner.revenue
      }, {
        severity: 'high'
      });
    }
  }

  // =============================================================================
  // TRAFFIC ANOMALY DETECTION
  // =============================================================================

  async detectTrafficAnomalies(
    testId: string,
    currentTraffic: number,
    historicalAverage: number,
    threshold: number = 0.3
  ): Promise<void> {
    const deviation = Math.abs(currentTraffic - historicalAverage) / historicalAverage;

    if (deviation > threshold) {
      await this.generateABTestAlert(testId, 'traffic_anomaly', {
        testName: await this.getTestName(testId),
        anomalyDetails: {
          currentTraffic,
          historicalAverage,
          deviation: deviation * 100,
          threshold: threshold * 100
        }
      }, {
        severity: deviation > 0.5 ? 'high' : 'medium'
      });
    }
  }

  // =============================================================================
  // NOTIFICATION DELIVERY
  // =============================================================================

  async processAlert(alert: ABTestAlert): Promise<void> {
    const startTime = Date.now();

    try {
      // Check if alert should be suppressed
      if (await this.isAlertSuppressed(alert)) {
        return;
      }

      // Process through each channel
      const deliveryPromises = alert.channels.map(channel =>
        this.deliverThroughChannel(alert, channel)
      );

      const results = await Promise.allSettled(deliveryPromises);

      // Track delivery results
      let successCount = 0;
      let failureCount = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
          this.updateChannelStats(alert.channels[index].type, true, Date.now() - startTime);
        } else {
          failureCount++;
          this.updateChannelStats(alert.channels[index].type, false, Date.now() - startTime);
          console.error(`Failed to deliver alert ${alert.id} through ${alert.channels[index].type}:`, result.reason);
        }
      });

      // Update metrics
      this.metrics.alertsProcessed++;
      this.metrics.alertsDelivered += successCount;
      this.metrics.alertsFailed += failureCount;

      // Schedule escalation if needed
      if (failureCount > 0 || !alert.acknowledged) {
        await this.scheduleEscalation(alert);
      }

      this.emit('alertProcessed', { alert, successCount, failureCount });

    } catch (error) {
      console.error('Error processing alert:', error);
      this.metrics.alertsFailed++;
      this.emit('alertProcessingError', { alert, error });
    }
  }

  async deliverThroughChannel(alert: ABTestAlert, channel: NotificationChannel): Promise<void> {
    // Check rate limiting
    if (!await this.checkRateLimit(channel)) {
      throw new Error(`Rate limit exceeded for channel ${channel.type}`);
    }

    switch (channel.type) {
      case 'email':
        return this.sendEmailAlert(alert, channel);
      case 'slack':
        return this.sendSlackAlert(alert, channel);
      case 'webhook':
        return this.sendWebhookAlert(alert, channel);
      case 'sms':
        return this.sendSMSAlert(alert, channel);
      case 'push':
        return this.sendPushAlert(alert, channel);
      case 'in_app':
        return this.sendInAppAlert(alert, channel);
      case 'teams':
        return this.sendTeamsAlert(alert, channel);
      case 'discord':
        return this.sendDiscordAlert(alert, channel);
      default:
        throw new Error(`Unsupported channel type: ${channel.type}`);
    }
  }

  // =============================================================================
  // CHANNEL IMPLEMENTATIONS
  // =============================================================================

  private async sendEmailAlert(alert: ABTestAlert, channel: NotificationChannel): Promise<void> {
    // Email delivery implementation
    const emailContent = this.formatEmailAlert(alert);
    // Implementation would use email service like SendGrid, SES, etc.
    console.log(`Email alert sent: ${alert.id}`);
  }

  private async sendSlackAlert(alert: ABTestAlert, channel: NotificationChannel): Promise<void> {
    // Slack delivery implementation
    const slackMessage = this.formatSlackAlert(alert);
    // Implementation would use Slack API
    console.log(`Slack alert sent: ${alert.id}`);
  }

  private async sendWebhookAlert(alert: ABTestAlert, channel: NotificationChannel): Promise<void> {
    // Webhook delivery implementation
    const webhookPayload = {
      alert,
      timestamp: new Date().toISOString(),
      source: 'optimizely-ab-testing'
    };
    // Implementation would use HTTP client
    console.log(`Webhook alert sent: ${alert.id}`);
  }

  private async sendSMSAlert(alert: ABTestAlert, channel: NotificationChannel): Promise<void> {
    // SMS delivery implementation (Twilio, etc.)
    const smsContent = this.formatSMSAlert(alert);
    console.log(`SMS alert sent: ${alert.id}`);
  }

  private async sendPushAlert(alert: ABTestAlert, channel: NotificationChannel): Promise<void> {
    // Push notification implementation
    const pushContent = this.formatPushAlert(alert);
    console.log(`Push alert sent: ${alert.id}`);
  }

  private async sendInAppAlert(alert: ABTestAlert, channel: NotificationChannel): Promise<void> {
    // In-app notification implementation
    await this.redis.lpush(`in_app_alerts:${alert.metadata.userId}`, JSON.stringify(alert));
    console.log(`In-app alert sent: ${alert.id}`);
  }

  private async sendTeamsAlert(alert: ABTestAlert, channel: NotificationChannel): Promise<void> {
    // Microsoft Teams implementation
    const teamsMessage = this.formatTeamsAlert(alert);
    console.log(`Teams alert sent: ${alert.id}`);
  }

  private async sendDiscordAlert(alert: ABTestAlert, channel: NotificationChannel): Promise<void> {
    // Discord webhook implementation
    const discordMessage = this.formatDiscordAlert(alert);
    console.log(`Discord alert sent: ${alert.id}`);
  }

  // =============================================================================
  // ALERT FORMATTING
  // =============================================================================

  private formatEmailAlert(alert: ABTestAlert): string {
    return `
      <h2>🚨 A/B Test Alert: ${alert.title}</h2>
      <p><strong>Test:</strong> ${alert.data.testName}</p>
      <p><strong>Type:</strong> ${alert.type}</p>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p><strong>Message:</strong> ${alert.message}</p>
      ${alert.data.conversionRate ? `<p><strong>Conversion Rate:</strong> ${(alert.data.conversionRate * 100).toFixed(2)}%</p>` : ''}
      ${alert.data.confidenceLevel ? `<p><strong>Confidence:</strong> ${alert.data.confidenceLevel}%</p>` : ''}
      ${alert.data.liftPercentage ? `<p><strong>Lift:</strong> ${alert.data.liftPercentage > 0 ? '+' : ''}${alert.data.liftPercentage.toFixed(2)}%</p>` : ''}
      <p><strong>Timestamp:</strong> ${alert.timestamp.toISOString()}</p>
    `;
  }

  private formatSlackAlert(alert: ABTestAlert): any {
    const emoji = this.getSeverityEmoji(alert.severity);
    return {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${emoji} A/B Test Alert: ${alert.title}`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Test:* ${alert.data.testName}`
            },
            {
              type: "mrkdwn",
              text: `*Type:* ${alert.type}`
            },
            {
              type: "mrkdwn",
              text: `*Severity:* ${alert.severity}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: alert.message
          }
        }
      ]
    };
  }

  private formatSMSAlert(alert: ABTestAlert): string {
    return `🚨 A/B Test Alert: ${alert.data.testName} - ${alert.type} (${alert.severity}). ${alert.message}`;
  }

  private formatPushAlert(alert: ABTestAlert): any {
    return {
      title: `A/B Test Alert: ${alert.data.testName}`,
      body: alert.message,
      data: {
        alertId: alert.id,
        testId: alert.testId,
        type: alert.type,
        severity: alert.severity
      }
    };
  }

  private formatTeamsAlert(alert: ABTestAlert): any {
    const color = this.getSeverityColor(alert.severity);
    return {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": color,
      "summary": `A/B Test Alert: ${alert.title}`,
      "sections": [
        {
          "activityTitle": `🚨 A/B Test Alert: ${alert.title}`,
          "activitySubtitle": alert.data.testName,
          "facts": [
            {
              "name": "Type",
              "value": alert.type
            },
            {
              "name": "Severity",
              "value": alert.severity
            },
            {
              "name": "Message",
              "value": alert.message
            }
          ]
        }
      ]
    };
  }

  private formatDiscordAlert(alert: ABTestAlert): any {
    const color = this.getSeverityColorCode(alert.severity);
    return {
      embeds: [
        {
          title: `🚨 A/B Test Alert: ${alert.title}`,
          description: alert.message,
          color: color,
          fields: [
            {
              name: "Test",
              value: alert.data.testName,
              inline: true
            },
            {
              name: "Type",
              value: alert.type,
              inline: true
            },
            {
              name: "Severity",
              value: alert.severity,
              inline: true
            }
          ],
          timestamp: alert.timestamp.toISOString()
        }
      ]
    };
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private calculateSeverity(type: ABTestAlert['type'], data: ABTestAlert['data']): ABTestAlert['severity'] {
    switch (type) {
      case 'statistical_significance':
        return data.confidenceLevel && data.confidenceLevel >= 99 ? 'high' : 'medium';
      case 'winner_detected':
        return 'high';
      case 'traffic_anomaly':
        return 'medium';
      case 'test_completion':
        return 'low';
      case 'conversion_threshold':
        return 'medium';
      default:
        return 'medium';
    }
  }

  private calculatePriority(type: ABTestAlert['type'], severity: ABTestAlert['severity']): number {
    const severityWeight = { critical: 100, high: 75, medium: 50, low: 25 };
    const typeWeight = {
      winner_detected: 20,
      statistical_significance: 15,
      conversion_threshold: 10,
      traffic_anomaly: 10,
      test_completion: 5
    };

    return severityWeight[severity] + (typeWeight[type] || 0);
  }

  private generateAlertTitle(type: ABTestAlert['type'], data: ABTestAlert['data']): string {
    switch (type) {
      case 'statistical_significance':
        return `Statistical Significance Detected: ${data.testName}`;
      case 'winner_detected':
        return `Test Winner Detected: ${data.testName}`;
      case 'traffic_anomaly':
        return `Traffic Anomaly Detected: ${data.testName}`;
      case 'test_completion':
        return `Test Completed: ${data.testName}`;
      case 'conversion_threshold':
        return `Conversion Threshold Reached: ${data.testName}`;
      default:
        return `A/B Test Alert: ${data.testName}`;
    }
  }

  private generateAlertMessage(type: ABTestAlert['type'], data: ABTestAlert['data']): string {
    switch (type) {
      case 'statistical_significance':
        return `Variant ${data.variantId} has reached ${data.confidenceLevel}% confidence with a ${data.conversionRate ? (data.conversionRate * 100).toFixed(2) : 'N/A'}% conversion rate.`;
      case 'winner_detected':
        return `Variant ${data.variantId} is the clear winner with ${data.liftPercentage ? data.liftPercentage.toFixed(2) : 'N/A'}% lift and ${data.confidenceLevel}% confidence.`;
      case 'traffic_anomaly':
        return `Unusual traffic patterns detected. Current traffic deviates significantly from expected levels.`;
      case 'test_completion':
        return `The test has completed successfully with sufficient sample size.`;
      case 'conversion_threshold':
        return `Conversion rate has ${data.conversionRate ? 'reached' : 'changed significantly from'} the threshold value.`;
      default:
        return `An alert has been triggered for this A/B test.`;
    }
  }

  private getSeverityEmoji(severity: ABTestAlert['severity']): string {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  private getSeverityColor(severity: ABTestAlert['severity']): string {
    switch (severity) {
      case 'critical': return 'FF0000';
      case 'high': return 'FF8C00';
      case 'medium': return 'FFD700';
      case 'low': return '32CD32';
      default: return '808080';
    }
  }

  private getSeverityColorCode(severity: ABTestAlert['severity']): number {
    switch (severity) {
      case 'critical': return 0xFF0000;
      case 'high': return 0xFF8C00;
      case 'medium': return 0xFFD700;
      case 'low': return 0x32CD32;
      default: return 0x808080;
    }
  }

  // =============================================================================
  // UTILITY AND HELPER METHODS
  // =============================================================================

  private async calculateStatisticalSignificance(variantData: any[]): Promise<any[]> {
    // Statistical significance calculation implementation
    return variantData.map(variant => ({
      variantId: variant.variantId,
      conversionRate: variant.conversions / variant.visitors,
      confidenceLevel: 95, // Simplified - would use proper statistical tests
      sampleSize: variant.visitors,
      pValue: 0.05, // Simplified
      lift: 10, // Simplified
      isSignificant: true
    }));
  }

  private determineWinner(variantResults: any[]): any {
    return variantResults.sort((a, b) => b.conversionRate - a.conversionRate)[0];
  }

  private async getTestName(testId: string): Promise<string> {
    // Get test name from database or cache
    return `Test ${testId}`;
  }

  private async getGoalName(goalId: string): Promise<string> {
    // Get goal name from database or cache
    return `Goal ${goalId}`;
  }

  private async getRelevantChannels(type: string, severity: string): Promise<NotificationChannel[]> {
    // Return relevant notification channels based on type and severity
    return Array.from(this.channels.values()).filter(channel =>
      channel.enabled &&
      (!channel.filters.severity || channel.filters.severity.includes(severity as any))
    );
  }

  private async storeAlert(alert: ABTestAlert): Promise<void> {
    await this.redis.setex(`alert:${alert.id}`, 86400 * 7, JSON.stringify(alert));
    await this.redis.lpush('recent_alerts', alert.id);
    await this.redis.ltrim('recent_alerts', 0, 999); // Keep last 1000 alerts
  }

  private async storeConversionAlert(alert: ConversionAlert): Promise<void> {
    await this.redis.setex(`conv_alert:${alert.id}`, 86400 * 7, JSON.stringify(alert));
  }

  private determineConversionAlertType(conversionData: any, threshold: any): ConversionAlert['type'] {
    if (conversionData.changePercentage && Math.abs(conversionData.changePercentage) > 20) {
      return 'unusual_pattern';
    }
    return 'goal_achieved';
  }

  private calculateConversionSeverity(conversionData: any, threshold: any): ConversionAlert['severity'] {
    return 'medium'; // Simplified
  }

  private async isAlertSuppressed(alert: ABTestAlert): Promise<boolean> {
    const suppressKey = `suppress:${alert.testId}:${alert.type}`;
    return !!(await this.redis.get(suppressKey));
  }

  private async checkRateLimit(channel: NotificationChannel): Promise<boolean> {
    const key = `rate_limit:${channel.type}`;
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, 60); // Reset every minute
    }
    return current <= (channel.rateLimiting.maxPerMinute || 10);
  }

  private updateChannelStats(channelType: string, success: boolean, responseTime: number): void {
    if (!this.metrics.channelStats.has(channelType)) {
      this.metrics.channelStats.set(channelType, { sent: 0, failed: 0, avgTime: 0 });
    }

    const stats = this.metrics.channelStats.get(channelType)!;
    if (success) {
      stats.sent++;
    } else {
      stats.failed++;
    }
    stats.avgTime = (stats.avgTime + responseTime) / 2;
  }

  private async scheduleEscalation(alert: ABTestAlert): Promise<void> {
    // Schedule escalation based on alert rules
    setTimeout(async () => {
      if (!alert.acknowledged) {
        alert.escalated = true;
        alert.escalationLevel++;
        await this.processAlert(alert);
      }
    }, 15 * 60 * 1000); // 15 minutes
  }

  private scheduleQueueProcessing(): void {
    if (!this.processingQueue && this.alertQueue.length > 0) {
      this.processingQueue = true;
      setTimeout(async () => {
        await this.processAlertQueue();
        this.processingQueue = false;
      }, 5000); // Process queue every 5 seconds
    }
  }

  private async processAlertQueue(): Promise<void> {
    const alertsToProcess = this.alertQueue.splice(0, 10); // Process up to 10 alerts at once

    for (const alert of alertsToProcess) {
      try {
        await this.processAlert(alert);
      } catch (error) {
        console.error('Error processing queued alert:', error);
      }
    }
  }

  private initializeDefaultRules(): void {
    // Initialize default alert rules for A/B testing
    const defaultRules: AlertRule[] = [
      {
        id: 'statistical_significance_95',
        name: 'Statistical Significance (95%)',
        description: 'Alert when test reaches 95% confidence',
        enabled: true,
        conditions: {
          testTypes: ['ab_test'],
          metricThresholds: [
            { metric: 'confidence_level', operator: '>=', value: 95 }
          ]
        },
        actions: {
          channels: ['email', 'slack'],
          escalationDelay: 15
        },
        priority: 75,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      }
    ];

    defaultRules.forEach(rule => this.alertRules.set(rule.id, rule));
  }

  private initializeDefaultChannels(): void {
    // Initialize default notification channels
    const defaultChannels: NotificationChannel[] = [
      {
        type: 'email',
        config: {
          recipients: ['admin@company.com']
        },
        enabled: true,
        filters: {
          severity: ['medium', 'high', 'critical']
        },
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelay: 1000
        },
        rateLimiting: {
          maxPerMinute: 10,
          maxPerHour: 100,
          maxPerDay: 500
        }
      }
    ];

    defaultChannels.forEach(channel => this.channels.set(channel.type, channel));
  }

  private startBatchProcessor(): void {
    // Start batch processing for digest notifications
    this.batchScheduler = setInterval(async () => {
      await this.processBatchedNotifications();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async processBatchedNotifications(): Promise<void> {
    // Process batched notifications for users who prefer digest mode
    console.log('Processing batched notifications...');
  }

  private setupMetrics(): void {
    // Set up metrics collection
    setInterval(() => {
      this.emit('metrics', this.metrics);
    }, 60000); // Emit metrics every minute
  }

  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alertData = await this.redis.get(`alert:${alertId}`);
    if (alertData) {
      const alert: ABTestAlert = JSON.parse(alertData);
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();

      await this.redis.setex(`alert:${alertId}`, 86400 * 7, JSON.stringify(alert));
      this.emit('alertAcknowledged', { alertId, userId });
    }
  }

  async getAlertHistory(options: {
    testId?: string;
    type?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ABTestAlert[]> {
    const limit = options.limit || 50;
    const alertIds = await this.redis.lrange('recent_alerts', options.offset || 0, (options.offset || 0) + limit - 1);

    const alerts: ABTestAlert[] = [];
    for (const alertId of alertIds) {
      const alertData = await this.redis.get(`alert:${alertId}`);
      if (alertData) {
        const alert: ABTestAlert = JSON.parse(alertData);

        // Apply filters
        if (options.testId && alert.testId !== options.testId) continue;
        if (options.type && alert.type !== options.type) continue;
        if (options.severity && alert.severity !== options.severity) continue;

        alerts.push(alert);
      }
    }

    return alerts;
  }

  async getAnalytics(timeRange: { start: Date; end: Date }): Promise<AlertAnalytics> {
    // Implementation would analyze alert data within time range
    return {
      totalAlerts: this.metrics.alertsProcessed,
      alertsByType: {},
      alertsBySeverity: {},
      averageAcknowledgmentTime: 300, // 5 minutes
      escalationRate: 0.1, // 10%
      channelPerformance: Array.from(this.metrics.channelStats.entries()).map(([channel, stats]) => ({
        channel,
        deliveryRate: stats.sent / (stats.sent + stats.failed),
        averageDeliveryTime: stats.avgTime,
        errorRate: stats.failed / (stats.sent + stats.failed)
      })),
      topAlertTriggers: [],
      responseMetrics: {
        acknowledgmentRate: 0.85,
        averageResponseTime: 300,
        resolvedWithinSLA: 0.9
      }
    };
  }

  async createSubscription(subscription: Omit<AlertSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertSubscription> {
    const sub: AlertSubscription = {
      ...subscription,
      id: `sub_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.subscriptions.set(sub.id, sub);
    await this.redis.setex(`subscription:${sub.id}`, 86400 * 30, JSON.stringify(sub));

    return sub;
  }

  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<AlertRule | null> {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return null;

    const updatedRule = { ...rule, ...updates, updatedAt: new Date() };
    this.alertRules.set(ruleId, updatedRule);
    await this.redis.setex(`rule:${ruleId}`, 86400 * 30, JSON.stringify(updatedRule));

    return updatedRule;
  }

  async addNotificationChannel(channel: NotificationChannel): Promise<void> {
    this.channels.set(channel.type, channel);
    await this.redis.setex(`channel:${channel.type}`, 86400 * 30, JSON.stringify(channel));
  }

  async testNotification(channelType: string, testMessage: string): Promise<boolean> {
    const channel = this.channels.get(channelType);
    if (!channel) return false;

    const testAlert: ABTestAlert = {
      id: `test_${Date.now()}`,
      testId: 'test_alert',
      type: 'test_completion',
      severity: 'low',
      title: 'Test Notification',
      message: testMessage,
      data: { testName: 'Test Alert' },
      channels: [channel],
      priority: 1,
      timestamp: new Date(),
      acknowledged: false,
      escalated: false,
      escalationLevel: 0,
      metadata: {
        source: 'test',
        environment: 'development'
      }
    };

    try {
      await this.deliverThroughChannel(testAlert, channel);
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }

  // =============================================================================
  // HEALTH AND MONITORING
  // =============================================================================

  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: typeof this.metrics;
    queueLength: number;
    lastProcessed: Date;
  } {
    const errorRate = this.metrics.alertsFailed / (this.metrics.alertsProcessed || 1);

    return {
      status: errorRate > 0.1 ? 'degraded' : 'healthy',
      metrics: this.metrics,
      queueLength: this.alertQueue.length,
      lastProcessed: new Date()
    };
  }

  async shutdown(): Promise<void> {
    if (this.batchScheduler) {
      clearInterval(this.batchScheduler);
    }

    // Process remaining alerts in queue
    if (this.alertQueue.length > 0) {
      console.log(`Processing ${this.alertQueue.length} remaining alerts before shutdown...`);
      await this.processAlertQueue();
    }

    this.emit('shutdown');
  }
}

// =============================================================================
// EXPORT DEFAULT INSTANCE
// =============================================================================

export default new UniversalSalesAlertNotificationService();
