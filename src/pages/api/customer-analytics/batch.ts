import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimitCheck, validateApiKey } from '../../../lib/middleware/api-auth';
import { IndustrySpecificAnalytics } from '../../../lib/services/industry-specific-analytics';
import { WebhookNotificationService } from './webhooks';

export interface BatchRequest {
  customerId: string;
  events: CustomerEventBatch[];
  profile?: CustomerProfileUpdate;
  industry?: string;
  metadata?: Record<string, any>;
}

export interface CustomerEventBatch {
  eventType: string;
  timestamp: string | Date;
  properties: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface CustomerProfileUpdate {
  companyName?: string;
  industry?: string;
  companySize?: 'small' | 'medium' | 'large' | 'enterprise';
  customFields?: Record<string, any>;
}

export interface BatchProcessingResult {
  customerId: string;
  eventsProcessed: number;
  insights: any[];
  profileUpdated: boolean;
  errors: string[];
  processingTimeMs: number;
}

export interface BatchResponse {
  batchId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  results: BatchProcessingResult[];
  processingTimeMs: number;
  errors: string[];
}

const MAX_BATCH_SIZE = 100;
const MAX_EVENTS_PER_CUSTOMER = 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  try {
    // Authentication and rate limiting
    const authResult = await validateApiKey(req);
    if (!authResult.valid) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Special rate limiting for batch operations (higher limits)
    const rateLimitResult = await rateLimitCheck(req, authResult.clientId);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        resetTime: rateLimitResult.resetTime
      });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    return handleBatchProcessing(req, res, startTime);
  } catch (error) {
    console.error('Batch Processing API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleBatchProcessing(req: NextApiRequest, res: NextApiResponse, startTime: number) {
  try {
    const { batch } = req.body;

    // Validation
    if (!Array.isArray(batch)) {
      return res.status(400).json({
        error: 'Invalid request: batch must be an array'
      });
    }

    if (batch.length === 0) {
      return res.status(400).json({
        error: 'Invalid request: batch cannot be empty'
      });
    }

    if (batch.length > MAX_BATCH_SIZE) {
      return res.status(400).json({
        error: `Batch size too large: maximum ${MAX_BATCH_SIZE} requests allowed`,
        maxBatchSize: MAX_BATCH_SIZE
      });
    }

    // Validate each batch item
    const validationErrors = validateBatchItems(batch);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Batch validation failed',
        validationErrors
      });
    }

    const analytics = new IndustrySpecificAnalytics();
    const batchId = generateBatchId();
    const results: BatchProcessingResult[] = [];
    const globalErrors: string[] = [];

    // Process batch items in parallel (with concurrency limit)
    const concurrencyLimit = 10;
    const processingPromises: Promise<BatchProcessingResult>[] = [];

    for (let i = 0; i < batch.length; i += concurrencyLimit) {
      const chunk = batch.slice(i, i + concurrencyLimit);
      const chunkPromises = chunk.map((item: BatchRequest) =>
        processBatchItem(item, analytics)
      );

      const chunkResults = await Promise.allSettled(chunkPromises);

      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          globalErrors.push(`Item ${i + index}: ${result.reason.message}`);
          // Add failed result placeholder
          results.push({
            customerId: batch[i + index]?.customerId || 'unknown',
            eventsProcessed: 0,
            insights: [],
            profileUpdated: false,
            errors: [result.reason.message],
            processingTimeMs: 0
          });
        }
      });
    }

    // Calculate summary statistics
    const successfulRequests = results.filter(r => r.errors.length === 0).length;
    const failedRequests = results.length - successfulRequests;
    const totalProcessingTime = Date.now() - startTime;

    // Trigger webhook notifications for batch processing completion
    await WebhookNotificationService.notifyWebhooks(
      'batch.processing.completed',
      {
        batchId,
        totalRequests: batch.length,
        successfulRequests,
        failedRequests,
        processingTimeMs: totalProcessingTime
      }
    );

    const response: BatchResponse = {
      batchId,
      totalRequests: batch.length,
      successfulRequests,
      failedRequests,
      results,
      processingTimeMs: totalProcessingTime,
      errors: globalErrors
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error processing batch:', error);
    return res.status(500).json({ error: 'Failed to process batch' });
  }
}

async function processBatchItem(item: BatchRequest, analytics: IndustrySpecificAnalytics): Promise<BatchProcessingResult> {
  const itemStartTime = Date.now();
  const errors: string[] = [];
  let eventsProcessed = 0;
  let insights: any[] = [];
  let profileUpdated = false;

  try {
    const { customerId, events, profile, industry } = item;

    // Create or update customer profile
    const customerProfile = {
      customerId,
      industryType: (industry || profile?.industry || 'saas') as any,
      companySize: profile?.companySize || 'medium' as const,
      customFields: profile?.customFields || {}
    };

    // Process events if provided
    if (events && events.length > 0) {
      if (events.length > MAX_EVENTS_PER_CUSTOMER) {
        errors.push(`Too many events: maximum ${MAX_EVENTS_PER_CUSTOMER} events per customer`);
      } else {
        // Convert events to behavior data for analytics
        const behaviorData = {
          pageViews: events.filter(e => e.eventType === 'page_view').length,
          sessionDuration: calculateAverageSessionDuration(events),
          engagementScore: calculateEngagementScore(events),
          conversionEvents: events.filter(e => e.eventType === 'conversion').length
        };

        // Run analytics
        insights = await analytics.analyzeCustomer(customerId, customerProfile, behaviorData);
        eventsProcessed = events.length;

        // Trigger individual customer analytics webhook
        await WebhookNotificationService.notifyWebhooks(
          'customer.analytics.updated',
          { insights: insights.slice(0, 3), behaviorData },
          customerId
        );
      }
    }

    // Update profile if provided
    if (profile) {
      profileUpdated = true;

      // Trigger profile update webhook
      await WebhookNotificationService.notifyWebhooks(
        'customer.profile.updated',
        { profile: customerProfile },
        customerId
      );
    }

    return {
      customerId,
      eventsProcessed,
      insights: insights.slice(0, 5), // Limit insights in batch response
      profileUpdated,
      errors,
      processingTimeMs: Date.now() - itemStartTime
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown processing error');

    return {
      customerId: item.customerId,
      eventsProcessed,
      insights: [],
      profileUpdated,
      errors,
      processingTimeMs: Date.now() - itemStartTime
    };
  }
}

function validateBatchItems(batch: BatchRequest[]): string[] {
  const errors: string[] = [];

  batch.forEach((item, index) => {
    if (!item.customerId) {
      errors.push(`Item ${index}: customerId is required`);
    }

    if (item.events) {
      if (!Array.isArray(item.events)) {
        errors.push(`Item ${index}: events must be an array`);
      } else if (item.events.length > MAX_EVENTS_PER_CUSTOMER) {
        errors.push(`Item ${index}: too many events (max ${MAX_EVENTS_PER_CUSTOMER})`);
      } else {
        item.events.forEach((event, eventIndex) => {
          if (!event.eventType) {
            errors.push(`Item ${index}, Event ${eventIndex}: eventType is required`);
          }
          if (!event.timestamp) {
            errors.push(`Item ${index}, Event ${eventIndex}: timestamp is required`);
          }
        });
      }
    }

    if (item.profile) {
      if (item.profile.companySize && !['small', 'medium', 'large', 'enterprise'].includes(item.profile.companySize)) {
        errors.push(`Item ${index}: invalid companySize value`);
      }
    }
  });

  return errors;
}

function calculateAverageSessionDuration(events: CustomerEventBatch[]): number {
  const sessionEvents = events.filter(e => e.sessionId);
  const sessionDurations = new Map<string, { start: number; end: number }>();

  sessionEvents.forEach(event => {
    const timestamp = new Date(event.timestamp).getTime();
    const sessionId = event.sessionId!;

    if (!sessionDurations.has(sessionId)) {
      sessionDurations.set(sessionId, { start: timestamp, end: timestamp });
    } else {
      const session = sessionDurations.get(sessionId)!;
      session.start = Math.min(session.start, timestamp);
      session.end = Math.max(session.end, timestamp);
    }
  });

  if (sessionDurations.size === 0) return 300; // Default 5 minutes

  const totalDuration = Array.from(sessionDurations.values())
    .reduce((sum, session) => sum + (session.end - session.start), 0);

  return Math.round(totalDuration / sessionDurations.size / 1000); // Convert to seconds
}

function calculateEngagementScore(events: CustomerEventBatch[]): number {
  let score = 0;
  const eventWeights: Record<string, number> = {
    'page_view': 1,
    'button_click': 2,
    'form_submit': 5,
    'download': 3,
    'video_play': 4,
    'pricing_view': 7,
    'demo_request': 10,
    'conversion': 15
  };

  events.forEach(event => {
    const weight = eventWeights[event.eventType] || 1;
    score += weight;
  });

  // Normalize to 0-1 scale (assuming max 100 weighted events = score of 1)
  return Math.min(score / 100, 1);
}

function generateBatchId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Types are exported inline above
