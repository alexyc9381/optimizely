/**
 * Universal Platform Integration Examples
 *
 * Demonstrates how the Customer Analytics SDK can be used across
 * different platforms, frameworks, and environments for universal integration.
 */

import React from 'react';
import { AnalyticsClient, createAnalyticsClient } from '../analytics-client';

// ==================================================================
// 1. BASIC USAGE - Any Platform
// ==================================================================

export async function basicUsageExample() {
  const client = createAnalyticsClient({
    apiKey: 'your_api_key_here',
    baseURL: 'https://api.optimizely.com/v1',
    debug: true
  });

  try {
    // Test connectivity
    const isHealthy = await client.healthCheck();
    console.log('API Health:', isHealthy);

    // Get customer analytics
    const analytics = await client.getCustomerAnalytics('customer_123', {
      industry: 'saas',
      metrics: 'all'
    });
    console.log('Customer Analytics:', analytics);

    // Track customer events
    const events = [
      {
        eventType: 'page_view',
        timestamp: new Date(),
        properties: { page: '/pricing', duration: 45 }
      },
      {
        eventType: 'button_click',
        timestamp: new Date(),
        properties: { button: 'request_demo', section: 'hero' }
      }
    ];

    const result = await client.trackEvents('customer_123', events, 'saas');
    console.log('Event Tracking Result:', result);

    // Get AI insights
    const insights = await client.getCustomerInsights('customer_123', 'engagement');
    console.log('AI Insights:', insights);

  } catch (error) {
    console.error('Analytics Error:', error);
  }
}

// ==================================================================
// 2. REACT/NEXT.JS INTEGRATION
// ==================================================================

// React Hook for Customer Analytics
export function useCustomerAnalytics(customerId: string) {
  const [analytics, setAnalytics] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const client = React.useMemo(() => createAnalyticsClient({
    apiKey: process.env.NEXT_PUBLIC_OPTIMIZELY_API_KEY!,
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'
  }), []);

  React.useEffect(() => {
    let mounted = true;

    async function fetchAnalytics() {
      try {
        setLoading(true);
        const data = await client.getCustomerAnalytics(customerId);
        if (mounted) {
          setAnalytics(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (customerId) {
      fetchAnalytics();
    }

    return () => { mounted = false; };
  }, [customerId, client]);

  const trackEvent = React.useCallback(async (eventType: string, properties: any) => {
    try {
      await client.trackEvent(customerId, {
        eventType,
        timestamp: new Date(),
        properties
      });
    } catch (error) {
      console.error('Event tracking failed:', error);
    }
  }, [client, customerId]);

  return { analytics, loading, error, trackEvent };
}

// React Component Example
export function CustomerDashboard({ customerId }: { customerId: string }) {
  const { analytics, loading, error, trackEvent } = useCustomerAnalytics(customerId);

  const handleDemoRequest = () => {
    trackEvent('demo_request', { source: 'dashboard', timestamp: Date.now() });
  };

  if (loading) return <div>Loading customer analytics...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Customer Analytics Dashboard</h2>
      <div>Engagement Score: {analytics?.behaviorData?.engagementScore}</div>
      <div>Total Sessions: {analytics?.behaviorData?.pageViews}</div>
      <button onClick={handleDemoRequest}>Request Demo</button>
    </div>
  );
}

// ==================================================================
// 3. WEBHOOK INTEGRATION
// ==================================================================

export async function webhookIntegrationExample() {
  const client = createAnalyticsClient({
    apiKey: 'your_api_key_here'
  });

  // Configure webhook for real-time notifications
  const webhook = await client.configureWebhook({
    url: 'https://your-app.com/webhooks/analytics',
    events: [
      'customer.analytics.updated',
      'customer.insights.generated',
      'customer.profile.updated'
    ],
    enabled: true
  });

  console.log('Webhook configured:', webhook);

  // Get all configured webhooks
  const webhooks = await client.getWebhooks();
  console.log('All webhooks:', webhooks);
}

// Express.js webhook handler example
export function createWebhookHandler() {
  return async (req: any, res: any) => {
    try {
      const signature = req.headers['x-optimizely-signature'];
      const payload = JSON.stringify(req.body);

      // In production, validate the signature with your webhook secret
      // const isValid = validateWebhookSignature(payload, signature, webhookSecret);

      const { event, customerId, data } = req.body;

      switch (event) {
        case 'customer.analytics.updated':
          console.log(`Analytics updated for customer ${customerId}:`, data);
          // Update your internal systems
          break;

        case 'customer.insights.generated':
          console.log(`New insights for customer ${customerId}:`, data);
          // Trigger notifications or update UI
          break;

        case 'customer.profile.updated':
          console.log(`Profile updated for customer ${customerId}:`, data);
          // Sync with CRM
          break;
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  };
}

// ==================================================================
// 4. BATCH PROCESSING INTEGRATION
// ==================================================================

export async function batchProcessingExample() {
  const client = createAnalyticsClient({
    apiKey: 'your_api_key_here'
  });

  // Prepare batch data for multiple customers
  const batchData = [
    {
      customerId: 'customer_001',
      events: [
        {
          eventType: 'page_view',
          timestamp: new Date().toISOString(),
          properties: { page: '/pricing', utm_source: 'google' }
        },
        {
          eventType: 'form_submit',
          timestamp: new Date().toISOString(),
          properties: { form: 'contact', lead_score: 85 }
        }
      ],
      profile: {
        companySize: 'medium',
        industry: 'saas'
      }
    },
    {
      customerId: 'customer_002',
      events: [
        {
          eventType: 'demo_request',
          timestamp: new Date().toISOString(),
          properties: { product: 'enterprise', urgency: 'high' }
        }
      ],
      industry: 'ecommerce'
    }
  ];

  try {
    const batchResult = await client.batchProcessEvents(batchData);
    console.log('Batch processing result:', batchResult);
    console.log(`Processed ${batchResult.successfulRequests}/${batchResult.totalRequests} requests`);

    // Handle individual results
    batchResult.results.forEach((result, index) => {
      if (result.errors.length > 0) {
        console.error(`Customer ${result.customerId} processing errors:`, result.errors);
      } else {
        console.log(`Customer ${result.customerId}: ${result.eventsProcessed} events processed`);
      }
    });
  } catch (error) {
    console.error('Batch processing failed:', error);
  }
}

// ==================================================================
// 5. GRAPHQL INTEGRATION
// ==================================================================

export async function graphqlIntegrationExample() {
  const client = createAnalyticsClient({
    apiKey: 'your_api_key_here'
  });

  // GraphQL query for customer analytics
  const query = `
    query GetCustomerAnalytics($customerId: ID!, $industry: IndustryType) {
      customer(id: $customerId) {
        profile {
          industryType
          companySize
          engagementScore
        }
        analytics(industry: $industry) {
          insights {
            type
            category
            confidence
            description
          }
          behaviorData {
            pageViews
            sessionDuration
            conversionEvents
          }
        }
        industryBenchmarks {
          averageEngagement
          conversionRate
          timeToConversion
        }
      }
    }
  `;

  try {
    const result = await client.graphql(query, {
      customerId: 'customer_123',
      industry: 'SAAS'
    });

    console.log('GraphQL result:', result);
  } catch (error) {
    console.error('GraphQL query failed:', error);
  }
}

// ==================================================================
// 6. INDUSTRY-SPECIFIC INTEGRATION
// ==================================================================

export async function industrySpecificExample() {
  const client = createAnalyticsClient({
    apiKey: 'your_api_key_here'
  });

  // SaaS industry example
  const saasAnalytics = await client.getIndustryMetrics('customer_123', 'saas');
  console.log('SaaS-specific metrics:', saasAnalytics);

  // E-commerce industry example
  const ecommerceAnalytics = await client.getIndustryMetrics('customer_456', 'ecommerce');
  console.log('E-commerce-specific metrics:', ecommerceAnalytics);

  // Get industry benchmarks
  const saasBenchmarks = await client.getIndustryBenchmarks('saas');
  console.log('SaaS industry benchmarks:', saasBenchmarks);
}

// ==================================================================
// 7. ERROR HANDLING & RESILIENCE
// ==================================================================

export async function resilientIntegrationExample() {
  const client = createAnalyticsClient({
    apiKey: 'your_api_key_here',
    retries: 3,
    timeout: 30000
  });

  try {
    // Check rate limit before making requests
    const rateLimitStatus = client.getRateLimitStatus();
    console.log('Rate limit status:', rateLimitStatus);

    if (rateLimitStatus.remaining < 10) {
      console.warn('Approaching rate limit, consider throttling requests');
    }

    // Make analytics request with error handling
    const analytics = await client.getCustomerAnalytics('customer_123');

    // Success handling
    console.log('Analytics retrieved successfully:', analytics);

  } catch (error: any) {
    // Specific error handling
    if (error.message.includes('Authentication failed')) {
      console.error('API key is invalid or expired');
    } else if (error.message.includes('Rate limit exceeded')) {
      console.error('Rate limit exceeded, implement backoff strategy');
    } else if (error.message.includes('Network error')) {
      console.error('Network connectivity issue, retry later');
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// ==================================================================
// 8. PERFORMANCE OPTIMIZATION
// ==================================================================

export class OptimizedAnalyticsService {
  private client: AnalyticsClient;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(apiKey: string) {
    this.client = createAnalyticsClient({
      apiKey,
      timeout: 10000 // Shorter timeout for better UX
    });
  }

  async getCachedAnalytics(customerId: string): Promise<any> {
    const cacheKey = `analytics_${customerId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const data = await this.client.getCustomerAnalytics(customerId);
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      // Return cached data if available, even if expired
      if (cached) {
        console.warn('Using expired cache due to API error');
        return cached.data;
      }
      throw error;
    }
  }

  // Batch events for efficiency
  private eventQueue: Array<{ customerId: string; event: any }> = [];
  private flushTimer: NodeJS.Timeout | null = null;

  queueEvent(customerId: string, event: any) {
    this.eventQueue.push({ customerId, event });

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flushEvents(), 1000);
    }
  }

  private async flushEvents() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];
    this.flushTimer = null;

    try {
      // Group events by customer and send in batches
      const groupedEvents = events.reduce((acc, { customerId, event }) => {
        if (!acc[customerId]) acc[customerId] = [];
        acc[customerId].push(event);
        return acc;
      }, {} as Record<string, any[]>);

      const batchPromises = Object.entries(groupedEvents).map(([customerId, customerEvents]) =>
        this.client.trackEvents(customerId, customerEvents)
      );

      await Promise.allSettled(batchPromises);
    } catch (error) {
      console.error('Batch event flush failed:', error);
    }
  }
}

// ==================================================================
// 9. MULTI-ENVIRONMENT CONFIGURATION
// ==================================================================

export function createEnvironmentAwareClient() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return createAnalyticsClient({
    apiKey: isProduction
      ? process.env.OPTIMIZELY_PROD_API_KEY!
      : process.env.OPTIMIZELY_DEV_API_KEY!,
    baseURL: isProduction
      ? 'https://api.optimizely.com/v1'
      : 'http://localhost:3000/api',
    debug: isDevelopment,
    timeout: isProduction ? 30000 : 10000,
    retries: isProduction ? 3 : 1
  });
}

// ==================================================================
// EXPORT ALL EXAMPLES
// ==================================================================

export const examples = {
  basicUsage: basicUsageExample,
  webhookIntegration: webhookIntegrationExample,
  batchProcessing: batchProcessingExample,
  graphqlIntegration: graphqlIntegrationExample,
  industrySpecific: industrySpecificExample,
  resilientIntegration: resilientIntegrationExample,
  OptimizedAnalyticsService,
  createEnvironmentAwareClient
};

// Export for documentation
export default examples;
