import crypto from 'crypto';
import { EventEmitter } from 'events';
import { Redis } from 'ioredis';

export interface WebhookEndpoint {
  id: string;
  clientId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: Date;
  lastUsed?: Date;
  failureCount: number;
  maxRetries: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  createdAt: Date;
  deliveredAt?: Date;
  error?: string;
}

/**
 * Webhook Manager for real-time event delivery
 */
export class WebhookManager extends EventEmitter {
  private redis: Redis;
  private webhooks: Map<string, WebhookEndpoint> = new Map();
  private deliveryQueue: WebhookDelivery[] = [];
  private retryInterval: NodeJS.Timeout | null = null;

  constructor(redis: Redis) {
    super();
    this.redis = redis;
    this.loadWebhooks();
    this.startRetryProcessor();
  }

  /**
   * Register a new webhook endpoint
   */
  async registerWebhook(clientId: string, url: string, events: string[]): Promise<string> {
    const webhookId = this.generateWebhookId();
    const secret = this.generateSecret();

    const webhook: WebhookEndpoint = {
      id: webhookId,
      clientId,
      url,
      events,
      secret,
      active: true,
      createdAt: new Date(),
      failureCount: 0,
      maxRetries: 3
    };

    this.webhooks.set(webhookId, webhook);
    await this.redis.hset('webhooks', webhookId, JSON.stringify(webhook));

    this.emit('webhook_registered', { webhookId, clientId, url, events });

    return webhookId;
  }

  /**
   * Send webhook payload to registered endpoints
   */
  async sendWebhook(clientId: string, event: string, payload: any): Promise<void> {
    const clientWebhooks = Array.from(this.webhooks.values())
      .filter(webhook => webhook.clientId === clientId && webhook.active && webhook.events.includes(event));

    for (const webhook of clientWebhooks) {
      const delivery: WebhookDelivery = {
        id: this.generateDeliveryId(),
        webhookId: webhook.id,
        event,
        payload,
        status: 'pending',
        attempts: 0,
        createdAt: new Date()
      };

      this.deliveryQueue.push(delivery);
      await this.attemptDelivery(delivery);
    }
  }

  /**
   * Get webhook secret for signature verification
   */
  async getWebhookSecret(webhookId: string): Promise<string | null> {
    const webhook = this.webhooks.get(webhookId);
    return webhook ? webhook.secret : null;
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(webhookId: string, updates: Partial<WebhookEndpoint>): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return false;
    }

    Object.assign(webhook, updates);
    await this.redis.hset('webhooks', webhookId, JSON.stringify(webhook));

    this.emit('webhook_updated', { webhookId, updates });

    return true;
  }

  /**
   * Delete webhook endpoint
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return false;
    }

    this.webhooks.delete(webhookId);
    await this.redis.hdel('webhooks', webhookId);

    this.emit('webhook_deleted', { webhookId, clientId: webhook.clientId });

    return true;
  }

  /**
   * Get webhooks for a client
   */
  getClientWebhooks(clientId: string): WebhookEndpoint[] {
    return Array.from(this.webhooks.values())
      .filter(webhook => webhook.clientId === clientId);
  }

  /**
   * Get delivery history
   */
  async getDeliveryHistory(webhookId?: string, limit: number = 100): Promise<WebhookDelivery[]> {
    let deliveries = this.deliveryQueue;

    if (webhookId) {
      deliveries = deliveries.filter(delivery => delivery.webhookId === webhookId);
    }

    return deliveries
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${computedSignature}`)
    );
  }

  /**
   * Private helper methods
   */
  private async loadWebhooks(): Promise<void> {
    try {
      const webhookData = await this.redis.hgetall('webhooks');

      for (const [webhookId, data] of Object.entries(webhookData)) {
        try {
          const webhook = JSON.parse(data);
          webhook.createdAt = new Date(webhook.createdAt);
          if (webhook.lastUsed) {
            webhook.lastUsed = new Date(webhook.lastUsed);
          }
          this.webhooks.set(webhookId, webhook);
        } catch (error) {
          console.error(`Error parsing webhook data for ${webhookId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading webhooks:', error);
    }
  }

  private async attemptDelivery(delivery: WebhookDelivery): Promise<void> {
    const webhook = this.webhooks.get(delivery.webhookId);
    if (!webhook || !webhook.active) {
      delivery.status = 'failed';
      delivery.error = 'Webhook not found or inactive';
      return;
    }

    delivery.attempts++;
    delivery.status = 'pending';

    try {
      const payload = JSON.stringify({
        id: delivery.id,
        event: delivery.event,
        data: delivery.payload,
        timestamp: delivery.createdAt.toISOString(),
        webhook: {
          id: webhook.id,
          clientId: webhook.clientId
        }
      });

      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(payload)
        .digest('hex');

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': delivery.event,
          'X-Webhook-ID': delivery.id,
          'User-Agent': 'OptimizelyWebhook/1.0'
        },
        body: payload,
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (response.ok) {
        delivery.status = 'success';
        delivery.deliveredAt = new Date();
        webhook.lastUsed = new Date();
        webhook.failureCount = 0;

        this.emit('webhook_delivered', {
          webhookId: webhook.id,
          deliveryId: delivery.id,
          event: delivery.event
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Webhook delivery failed for ${delivery.id}:`, error);

      delivery.error = error instanceof Error ? error.message : 'Unknown error';
      webhook.failureCount++;

      if (delivery.attempts < webhook.maxRetries) {
        delivery.status = 'retrying';
        // Schedule retry with exponential backoff
        setTimeout(() => {
          this.attemptDelivery(delivery);
        }, Math.pow(2, delivery.attempts) * 1000);
      } else {
        delivery.status = 'failed';

        // Disable webhook if too many failures
        if (webhook.failureCount >= 10) {
          webhook.active = false;
          await this.redis.hset('webhooks', webhook.id, JSON.stringify(webhook));

          this.emit('webhook_disabled', {
            webhookId: webhook.id,
            clientId: webhook.clientId,
            reason: 'Too many failures'
          });
        }
      }

      this.emit('webhook_failed', {
        webhookId: webhook.id,
        deliveryId: delivery.id,
        event: delivery.event,
        error: delivery.error,
        attempts: delivery.attempts
      });
    }

    // Update webhook data
    await this.redis.hset('webhooks', webhook.id, JSON.stringify(webhook));
  }

  private startRetryProcessor(): void {
    this.retryInterval = setInterval(() => {
      const pendingRetries = this.deliveryQueue.filter(
        delivery => delivery.status === 'retrying' &&
        delivery.attempts < (this.webhooks.get(delivery.webhookId)?.maxRetries || 3)
      );

      pendingRetries.forEach(delivery => {
        this.attemptDelivery(delivery);
      });

      // Clean up old deliveries (keep last 1000)
      if (this.deliveryQueue.length > 1000) {
        this.deliveryQueue = this.deliveryQueue
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 1000);
      }
    }, 60000); // Every minute
  }

  private generateWebhookId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateDeliveryId(): string {
    return `wd_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Cleanup and shutdown
   */
  public async shutdown(): Promise<void> {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }
}

export default WebhookManager;
