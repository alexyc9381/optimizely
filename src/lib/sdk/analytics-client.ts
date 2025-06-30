import axios, { AxiosInstance } from 'axios';

export interface AnalyticsClientConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export interface CustomerProfile {
  customerId: string;
  industryType: string;
  companySize: 'small' | 'medium' | 'large' | 'enterprise';
  customFields: Record<string, any>;
}

export interface BehaviorData {
  pageViews: number;
  sessionDuration: number;
  engagementScore: number;
  conversionEvents: number;
}

export interface CustomerEvent {
  eventType: string;
  timestamp: Date | string;
  properties: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface AnalyticsInsight {
  id: string;
  type: string;
  category: string;
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  recommendations: string[];
}

export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
}

/**
 * Universal Customer Analytics SDK Client
 * Provides seamless integration with the Customer Analytics API across any platform
 */
export class AnalyticsClient {
  private httpClient: AxiosInstance;
  private config: AnalyticsClientConfig;
  private rateLimitRemaining = 100;
  private rateLimitReset = Date.now();

  constructor(config: AnalyticsClientConfig) {
    this.config = {
      baseURL: 'http://localhost:3000/api',
      timeout: 30000,
      retries: 3,
      debug: false,
      ...config
    };

    this.httpClient = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'optimizely-analytics-sdk/1.0.0'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for debugging and rate limiting
    this.httpClient.interceptors.request.use(
      (config) => {
        if (this.config.debug) {
          console.log(`[AnalyticsSDK] Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for rate limiting and error handling
    this.httpClient.interceptors.response.use(
      (response) => {
        // Track rate limiting
        const remaining = response.headers['x-ratelimit-remaining'];
        const reset = response.headers['x-ratelimit-reset'];

        if (remaining) this.rateLimitRemaining = parseInt(remaining);
        if (reset) this.rateLimitReset = parseInt(reset);

        if (this.config.debug) {
          console.log(`[AnalyticsSDK] Response: ${response.status}`, response.data);
        }

        return response;
      },
      async (error) => {
        if (error.response?.status === 429 && this.config.retries! > 0) {
          const retryAfter = error.response.headers['retry-after'] || 60;
          if (this.config.debug) {
            console.log(`[AnalyticsSDK] Rate limited, retrying after ${retryAfter}s`);
          }
          await this.delay(retryAfter * 1000);
          return this.httpClient.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get comprehensive customer analytics
   */
  async getCustomerAnalytics(
    customerId: string,
    options: { industry?: string; metrics?: string } = {}
  ): Promise<any> {
    try {
      const response = await this.httpClient.get('/customer-analytics', {
        params: {
          customerId,
          ...options
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Submit customer events for real-time analytics processing
   */
  async trackEvents(customerId: string, events: CustomerEvent[], industry?: string): Promise<any> {
    try {
      const response = await this.httpClient.post('/customer-analytics', {
        customerId,
        events,
        industry
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Track a single event
   */
  async trackEvent(customerId: string, event: CustomerEvent): Promise<any> {
    return this.trackEvents(customerId, [event]);
  }

  /**
   * Get customer insights
   */
  async getCustomerInsights(customerId: string, category?: string): Promise<AnalyticsInsight[]> {
    try {
      const response = await this.httpClient.get(`/customer-analytics/insights/${customerId}`, {
        params: category ? { category } : {}
      });
      return response.data.insights;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get customer profile
   */
  async getCustomerProfile(customerId: string): Promise<CustomerProfile> {
    try {
      const response = await this.httpClient.get(`/customer-analytics/profile`, {
        params: { customerId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update customer profile
   */
  async updateCustomerProfile(customerId: string, profile: Partial<CustomerProfile>): Promise<CustomerProfile> {
    try {
      const response = await this.httpClient.put(`/customer-analytics/profile`, {
        customerId,
        ...profile
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get industry benchmarks
   */
  async getIndustryBenchmarks(industry: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/customer-analytics/industry/${industry}/benchmarks`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get industry-specific metrics for a customer
   */
  async getIndustryMetrics(customerId: string, industry: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/customer-analytics/industry/${industry}/metrics/${customerId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Batch process multiple customer events
   */
  async batchProcessEvents(batch: Array<{customerId: string; events: CustomerEvent[]}>): Promise<any> {
    try {
      const response = await this.httpClient.post('/customer-analytics/batch', {
        batch
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * GraphQL query execution
   */
  async graphql(query: string, variables?: Record<string, any>): Promise<any> {
    try {
      const response = await this.httpClient.post('/graphql', {
        query,
        variables
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Webhook management
   */
  async configureWebhook(config: WebhookConfig): Promise<any> {
    try {
      const response = await this.httpClient.post('/customer-analytics/webhooks', config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getWebhooks(): Promise<WebhookConfig[]> {
    try {
      const response = await this.httpClient.get('/customer-analytics/webhooks');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      await this.httpClient.delete(`/customer-analytics/webhooks/${webhookId}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Rate limiting information
   */
  getRateLimitStatus(): { remaining: number; reset: number } {
    return {
      remaining: this.rateLimitRemaining,
      reset: this.rateLimitReset
    };
  }

  /**
   * Test API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.error || `HTTP ${status}`;

      switch (status) {
        case 401:
          return new Error(`Authentication failed: ${message}`);
        case 403:
          return new Error(`Access forbidden: ${message}`);
        case 429:
          return new Error(`Rate limit exceeded: ${message}`);
        case 500:
          return new Error(`Server error: ${message}`);
        default:
          return new Error(`API error (${status}): ${message}`);
      }
    } else if (error.request) {
      return new Error('Network error: Unable to reach the API');
    } else {
      return new Error(`Request error: ${error.message}`);
    }
  }
}

/**
 * Factory function for creating analytics client instances
 */
export function createAnalyticsClient(config: AnalyticsClientConfig): AnalyticsClient {
  return new AnalyticsClient(config);
}

/**
 * Default export for easier imports
 */
export default AnalyticsClient;
