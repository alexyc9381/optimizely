import crypto from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimitCheck, validateApiKey } from '../../../lib/middleware/api-auth';

export interface WebhookConfig {
  id: string;
  clientId: string;
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastDelivery?: string;
  failureCount: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  nextRetry?: string;
  createdAt: string;
  deliveredAt?: string;
}

// In-memory webhook store (use database in production)
const webhookStore = new Map<string, WebhookConfig>();
const deliveryStore = new Map<string, WebhookDelivery>();

// Supported webhook events
const SUPPORTED_EVENTS = [
  'customer.analytics.updated',
  'customer.insights.generated',
  'customer.profile.updated',
  'customer.score.changed',
  'customer.segment.changed',
  'industry.benchmark.updated',
  'alert.threshold.exceeded'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Authentication and rate limiting
    const authResult = await validateApiKey(req);
    if (!authResult.valid) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const rateLimitResult = await rateLimitCheck(req, authResult.clientId);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        resetTime: rateLimitResult.resetTime
      });
    }

    switch (req.method) {
      case 'GET':
        return handleGetWebhooks(req, res, authResult.clientId);
      case 'POST':
        return handleCreateWebhook(req, res, authResult.clientId);
      case 'PUT':
        return handleUpdateWebhook(req, res, authResult.clientId);
      case 'DELETE':
        return handleDeleteWebhook(req, res, authResult.clientId);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Webhook API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetWebhooks(req: NextApiRequest, res: NextApiResponse, clientId: string) {
  try {
    const webhooks = Array.from(webhookStore.values())
      .filter(webhook => webhook.clientId === clientId);

    return res.status(200).json({
      webhooks,
      supportedEvents: SUPPORTED_EVENTS
    });
  } catch (error) {
    console.error('Error retrieving webhooks:', error);
    return res.status(500).json({ error: 'Failed to retrieve webhooks' });
  }
}

async function handleCreateWebhook(req: NextApiRequest, res: NextApiResponse, clientId: string) {
  try {
    const { url, events, secret, enabled = true } = req.body;

    // Validation
    if (!url || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        error: 'Invalid request: url and events array are required'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Validate events
    const invalidEvents = events.filter(event => !SUPPORTED_EVENTS.includes(event));
    if (invalidEvents.length > 0) {
      return res.status(400).json({
        error: `Unsupported events: ${invalidEvents.join(', ')}`,
        supportedEvents: SUPPORTED_EVENTS
      });
    }

    // Check for duplicate webhooks
    const existingWebhook = Array.from(webhookStore.values())
      .find(webhook => webhook.clientId === clientId && webhook.url === url);

    if (existingWebhook) {
      return res.status(409).json({
        error: 'Webhook with this URL already exists for your account'
      });
    }

    // Create webhook
    const webhookId = generateId();
    const webhook: WebhookConfig = {
      id: webhookId,
      clientId,
      url,
      events,
      secret: secret || generateSecret(),
      enabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      failureCount: 0
    };

    webhookStore.set(webhookId, webhook);

    // Test webhook delivery
    const testResult = await testWebhookDelivery(webhook);

    return res.status(201).json({
      webhook,
      testDelivery: testResult
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return res.status(500).json({ error: 'Failed to create webhook' });
  }
}

async function handleUpdateWebhook(req: NextApiRequest, res: NextApiResponse, clientId: string) {
  try {
    const { webhookId } = req.query;
    const { url, events, secret, enabled } = req.body;

    if (!webhookId) {
      return res.status(400).json({ error: 'Webhook ID is required' });
    }

    const webhook = webhookStore.get(webhookId as string);
    if (!webhook || webhook.clientId !== clientId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Update webhook
    const updatedWebhook: WebhookConfig = {
      ...webhook,
      ...(url && { url }),
      ...(events && { events }),
      ...(secret && { secret }),
      ...(enabled !== undefined && { enabled }),
      updatedAt: new Date().toISOString()
    };

    webhookStore.set(webhookId as string, updatedWebhook);

    return res.status(200).json({ webhook: updatedWebhook });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return res.status(500).json({ error: 'Failed to update webhook' });
  }
}

async function handleDeleteWebhook(req: NextApiRequest, res: NextApiResponse, clientId: string) {
  try {
    const { webhookId } = req.query;

    if (!webhookId) {
      return res.status(400).json({ error: 'Webhook ID is required' });
    }

    const webhook = webhookStore.get(webhookId as string);
    if (!webhook || webhook.clientId !== clientId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    webhookStore.delete(webhookId as string);

    // Clean up related deliveries
    for (const [deliveryId, delivery] of deliveryStore.entries()) {
      if (delivery.webhookId === webhookId) {
        deliveryStore.delete(deliveryId);
      }
    }

    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return res.status(500).json({ error: 'Failed to delete webhook' });
  }
}

/**
 * Webhook notification service
 */
export class WebhookNotificationService {
  /**
   * Trigger webhook notifications for an event
   */
  static async notifyWebhooks(eventType: string, payload: any, customerId?: string): Promise<void> {
    const relevantWebhooks = Array.from(webhookStore.values())
      .filter(webhook =>
        webhook.enabled &&
        webhook.events.includes(eventType)
      );

    const deliveryPromises = relevantWebhooks.map(webhook =>
      this.deliverWebhook(webhook, eventType, payload, customerId)
    );

    await Promise.allSettled(deliveryPromises);
  }

  /**
   * Deliver a single webhook
   */
  private static async deliverWebhook(
    webhook: WebhookConfig,
    eventType: string,
    payload: any,
    customerId?: string
  ): Promise<void> {
    const deliveryId = generateId();
    const delivery: WebhookDelivery = {
      id: deliveryId,
      webhookId: webhook.id,
      eventType,
      payload: {
        event: eventType,
        customerId,
        data: payload,
        timestamp: new Date().toISOString()
      },
      status: 'pending',
      attempts: 0,
      createdAt: new Date().toISOString()
    };

    deliveryStore.set(deliveryId, delivery);

    try {
      await this.attemptDelivery(webhook, delivery);
    } catch (error) {
      console.error(`Webhook delivery failed for ${webhook.id}:`, error);
      this.scheduleRetry(delivery);
    }
  }

  /**
   * Attempt webhook delivery with signature verification
   */
  private static async attemptDelivery(webhook: WebhookConfig, delivery: WebhookDelivery): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'optimizely-webhooks/1.0',
      'X-Optimizely-Event': delivery.eventType,
      'X-Optimizely-Delivery': delivery.id
    };

    if (webhook.secret) {
      const signature = this.generateSignature(JSON.stringify(delivery.payload), webhook.secret);
      headers['X-Optimizely-Signature'] = signature;
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(delivery.payload),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      delivery.attempts++;

      if (response.ok) {
        delivery.status = 'delivered';
        delivery.deliveredAt = new Date().toISOString();
        webhook.failureCount = 0; // Reset failure count on success
        webhook.lastDelivery = new Date().toISOString();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      delivery.status = 'failed';
      webhook.failureCount++;

      if (webhook.failureCount >= 5) {
        webhook.enabled = false; // Disable webhook after 5 consecutive failures
      }

      throw error;
    } finally {
      webhookStore.set(webhook.id, webhook);
      deliveryStore.set(delivery.id, delivery);
    }
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  private static generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Schedule retry for failed delivery
   */
  private static scheduleRetry(delivery: WebhookDelivery): void {
    if (delivery.attempts < 3) {
      const retryDelay = Math.pow(2, delivery.attempts) * 60 * 1000; // Exponential backoff
      delivery.nextRetry = new Date(Date.now() + retryDelay).toISOString();

      setTimeout(() => {
        this.retryDelivery(delivery.id);
      }, retryDelay);
    }
  }

  /**
   * Retry failed delivery
   */
  private static async retryDelivery(deliveryId: string): Promise<void> {
    const delivery = deliveryStore.get(deliveryId);
    const webhook = delivery ? webhookStore.get(delivery.webhookId) : null;

    if (!delivery || !webhook || !webhook.enabled) {
      return;
    }

    try {
      await this.attemptDelivery(webhook, delivery);
    } catch (error) {
      this.scheduleRetry(delivery);
    }
  }
}

/**
 * Test webhook delivery
 */
async function testWebhookDelivery(webhook: WebhookConfig): Promise<any> {
  try {
    const testPayload = {
      event: 'webhook.test',
      data: { message: 'This is a test webhook delivery' },
      timestamp: new Date().toISOString()
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'optimizely-webhooks/1.0',
      'X-Optimizely-Event': 'webhook.test'
    };

    if (webhook.secret) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(testPayload))
        .digest('hex');
      headers['X-Optimizely-Signature'] = signature;
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000)
    });

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Utility functions
 */
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

// WebhookNotificationService is exported inline above
