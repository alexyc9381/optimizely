import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { AnalyticsService } from './analytics-service';
import { SDKManager } from './sdk-manager';
import { WebhookManager } from './webhook-manager';

export interface PlatformIntegration {
  platform: 'wordpress' | 'shopify' | 'react' | 'vue' | 'angular' | 'static' | 'custom';
  version?: string;
  configuration: {
    apiKey: string;
    baseUrl: string;
    endpoints: {
      personalization: string;
      analytics: string;
      experiments: string;
      config: string;
    };
    realtime?: {
      websocket?: string;
      polling?: {
        interval: number;
        endpoint: string;
      };
    };
  };
  features: {
    personalization: boolean;
    abTesting: boolean;
    analytics: boolean;
    realtime: boolean;
    caching: boolean;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    requestId: string;
    timestamp: string;
    version: string;
    rateLimit?: {
      remaining: number;
      reset: number;
      limit: number;
    };
  };
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  signature: string;
  source: string;
}

export interface SDKConfiguration {
  platform: string;
  version: string;
  features: string[];
  minified: boolean;
  bundle: 'esm' | 'umd' | 'cjs';
  customization?: {
    branding?: boolean;
    styling?: boolean;
    events?: string[];
  };
}

/**
 * Universal API Integration Architecture
 * Provides platform-agnostic API architecture for A/B testing system integration
 */
export class UniversalAPIService extends EventEmitter {
  private redis: Redis;
  private webhookManager: WebhookManager;
  private sdkManager: SDKManager;
  private analyticsService: AnalyticsService;
  private integrations: Map<string, PlatformIntegration> = new Map();
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();
  private apiKeys: Map<string, { clientId: string; permissions: string[]; platform: string }> = new Map();

  constructor(redis: Redis, analyticsService: AnalyticsService) {
    super();
    this.redis = redis;
    this.analyticsService = analyticsService;
    this.webhookManager = new WebhookManager(redis);
    this.sdkManager = new SDKManager();

    this.setupEventListeners();
  }

  /**
   * Register a new platform integration
   */
  async registerIntegration(clientId: string, integration: PlatformIntegration): Promise<APIResponse> {
    try {
      // Validate integration configuration
      if (!this.validateIntegration(integration)) {
        return {
          success: false,
          error: 'Invalid integration configuration',
          metadata: this.generateMetadata()
        };
      }

      // Generate API key
      const apiKey = this.generateAPIKey(clientId, integration.platform);
      integration.configuration.apiKey = apiKey;

      // Store integration
      this.integrations.set(clientId, integration);
      this.apiKeys.set(apiKey, {
        clientId,
        permissions: this.getPermissions(integration.features),
        platform: integration.platform
      });

      // Cache in Redis
      await this.redis.hset('integrations', clientId, JSON.stringify(integration));
      await this.redis.hset('api_keys', apiKey, JSON.stringify({
        clientId,
        permissions: this.getPermissions(integration.features),
        platform: integration.platform
      }));

      this.emit('integration_registered', { clientId, platform: integration.platform });

      return {
        success: true,
        data: {
          clientId,
          apiKey,
          endpoints: integration.configuration.endpoints,
          features: integration.features
        },
        metadata: this.generateMetadata()
      };
    } catch (error) {
      console.error('Error registering integration:', error);
      return {
        success: false,
        error: 'Failed to register integration',
        metadata: this.generateMetadata()
      };
    }
  }

  /**
   * Get personalization data for a visitor
   */
  async getPersonalization(apiKey: string, visitorId: string, pageData?: any): Promise<APIResponse> {
    try {
      // Validate API key and rate limiting
      const authResult = await this.authenticateRequest(apiKey, 'personalization');
      if (!authResult.success) {
        return authResult;
      }

      const { clientId } = authResult.data!;
      const integration = this.integrations.get(clientId);

      if (!integration?.features.personalization) {
        return {
          success: false,
          error: 'Personalization not enabled for this integration',
          metadata: this.generateMetadata()
        };
      }

      // Get personalization from analytics service
      const personalizationData = await this.analyticsService.getPersonalizationData(visitorId, pageData);

      // Track API usage
      this.trackAPIUsage(apiKey, 'personalization');

      return {
        success: true,
        data: personalizationData,
        metadata: this.generateMetadata()
      };
    } catch (error) {
      console.error('Error getting personalization:', error);
      return {
        success: false,
        error: 'Failed to get personalization data',
        metadata: this.generateMetadata()
      };
    }
  }

  /**
   * Get active experiments for a visitor
   */
  async getExperiments(apiKey: string, visitorId: string, context?: any): Promise<APIResponse> {
    try {
      const authResult = await this.authenticateRequest(apiKey, 'abTesting');
      if (!authResult.success) {
        return authResult;
      }

      const { clientId } = authResult.data!;
      const integration = this.integrations.get(clientId);

      if (!integration?.features.abTesting) {
        return {
          success: false,
          error: 'A/B testing not enabled for this integration',
          metadata: this.generateMetadata()
        };
      }

      // Get experiments from analytics service
      const experiments = await this.analyticsService.getActiveExperiments(visitorId, context);

      this.trackAPIUsage(apiKey, 'experiments');

      return {
        success: true,
        data: experiments,
        metadata: this.generateMetadata()
      };
    } catch (error) {
      console.error('Error getting experiments:', error);
      return {
        success: false,
        error: 'Failed to get experiments',
        metadata: this.generateMetadata()
      };
    }
  }

  /**
   * Track conversion event
   */
  async trackConversion(apiKey: string, visitorId: string, event: any): Promise<APIResponse> {
    try {
      const authResult = await this.authenticateRequest(apiKey, 'analytics');
      if (!authResult.success) {
        return authResult;
      }

      const { clientId } = authResult.data!;
      const integration = this.integrations.get(clientId);

      if (!integration?.features.analytics) {
        return {
          success: false,
          error: 'Analytics not enabled for this integration',
          metadata: this.generateMetadata()
        };
      }

      // Track event via analytics service
      await this.analyticsService.trackEvent(visitorId, event, { clientId, platform: integration.platform });

      this.trackAPIUsage(apiKey, 'track');

      return {
        success: true,
        data: { tracked: true, eventId: event.id || `evt_${Date.now()}` },
        metadata: this.generateMetadata()
      };
    } catch (error) {
      console.error('Error tracking conversion:', error);
      return {
        success: false,
        error: 'Failed to track conversion',
        metadata: this.generateMetadata()
      };
    }
  }

  /**
   * Get configuration for client platform
   */
  async getConfiguration(apiKey: string): Promise<APIResponse> {
    try {
      const authResult = await this.authenticateRequest(apiKey, 'config');
      if (!authResult.success) {
        return authResult;
      }

      const { clientId } = authResult.data!;
      const integration = this.integrations.get(clientId);

      if (!integration) {
        return {
          success: false,
          error: 'Integration not found',
          metadata: this.generateMetadata()
        };
      }

      return {
        success: true,
        data: {
          platform: integration.platform,
          features: integration.features,
          endpoints: integration.configuration.endpoints,
          realtime: integration.configuration.realtime
        },
        metadata: this.generateMetadata()
      };
    } catch (error) {
      console.error('Error getting configuration:', error);
      return {
        success: false,
        error: 'Failed to get configuration',
        metadata: this.generateMetadata()
      };
    }
  }

  /**
   * Generate SDK for specific platform
   */
  async generateSDK(apiKey: string, config: SDKConfiguration): Promise<APIResponse> {
    try {
      const authResult = await this.authenticateRequest(apiKey, 'sdk');
      if (!authResult.success) {
        return authResult;
      }

      const { clientId } = authResult.data!;
      const integration = this.integrations.get(clientId);

      if (!integration) {
        return {
          success: false,
          error: 'Integration not found',
          metadata: this.generateMetadata()
        };
      }

      // Generate SDK via SDK manager
      const sdk = await this.sdkManager.generateSDK(config, integration);

      return {
        success: true,
        data: {
          sdk: sdk.code,
          version: sdk.version,
          bundle: config.bundle,
          platform: config.platform,
          downloadUrl: sdk.downloadUrl
        },
        metadata: this.generateMetadata()
      };
    } catch (error) {
      console.error('Error generating SDK:', error);
      return {
        success: false,
        error: 'Failed to generate SDK',
        metadata: this.generateMetadata()
      };
    }
  }

  /**
   * Register webhook endpoint
   */
  async registerWebhook(apiKey: string, endpoint: string, events: string[]): Promise<APIResponse> {
    try {
      const authResult = await this.authenticateRequest(apiKey, 'webhooks');
      if (!authResult.success) {
        return authResult;
      }

      const { clientId } = authResult.data!;

      const webhookId = await this.webhookManager.registerWebhook(clientId, endpoint, events);

      return {
        success: true,
        data: {
          webhookId,
          endpoint,
          events,
          secret: await this.webhookManager.getWebhookSecret(webhookId)
        },
        metadata: this.generateMetadata()
      };
    } catch (error) {
      console.error('Error registering webhook:', error);
      return {
        success: false,
        error: 'Failed to register webhook',
        metadata: this.generateMetadata()
      };
    }
  }

  /**
   * Get integration analytics
   */
  async getIntegrationAnalytics(apiKey: string, timeRange?: { start: Date; end: Date }): Promise<APIResponse> {
    try {
      const authResult = await this.authenticateRequest(apiKey, 'analytics');
      if (!authResult.success) {
        return authResult;
      }

      const { clientId } = authResult.data!;

      const analytics = await this.analyticsService.getIntegrationAnalytics(clientId, timeRange);

      return {
        success: true,
        data: analytics,
        metadata: this.generateMetadata()
      };
    } catch (error) {
      console.error('Error getting integration analytics:', error);
      return {
        success: false,
        error: 'Failed to get integration analytics',
        metadata: this.generateMetadata()
      };
    }
  }

  /**
   * Private helper methods
   */
  private setupEventListeners(): void {
    // Listen for analytics events
    this.analyticsService.on('experiment_started', (data) => {
      this.webhookManager.sendWebhook(data.clientId, 'experiment.started', data);
    });

    this.analyticsService.on('experiment_completed', (data) => {
      this.webhookManager.sendWebhook(data.clientId, 'experiment.completed', data);
    });

    this.analyticsService.on('conversion_tracked', (data) => {
      this.webhookManager.sendWebhook(data.clientId, 'conversion.tracked', data);
    });
  }

  private validateIntegration(integration: PlatformIntegration): boolean {
    return !!(
      integration.platform &&
      integration.configuration &&
      integration.configuration.baseUrl &&
      integration.features &&
      Object.keys(integration.features).length > 0
    );
  }

  private generateAPIKey(clientId: string, platform: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `ak_${platform}_${timestamp}_${random}`;
  }

  private getPermissions(features: PlatformIntegration['features']): string[] {
    const permissions: string[] = [];
    if (features.personalization) permissions.push('personalization');
    if (features.abTesting) permissions.push('experiments', 'abTesting');
    if (features.analytics) permissions.push('analytics', 'track');
    if (features.realtime) permissions.push('realtime', 'webhooks');
    permissions.push('config', 'sdk');
    return permissions;
  }

  private async authenticateRequest(apiKey: string, permission: string): Promise<APIResponse> {
    const keyData = this.apiKeys.get(apiKey);
    if (!keyData) {
      return {
        success: false,
        error: 'Invalid API key',
        metadata: this.generateMetadata()
      };
    }

    if (!keyData.permissions.includes(permission)) {
      return {
        success: false,
        error: `Permission '${permission}' not granted`,
        metadata: this.generateMetadata()
      };
    }

    // Check rate limiting
    const rateLimitResult = this.checkRateLimit(apiKey);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        metadata: {
          ...this.generateMetadata(),
          rateLimit: rateLimitResult
        }
      };
    }

    return {
      success: true,
      data: keyData
    };
  }

  private checkRateLimit(apiKey: string): { allowed: boolean; remaining: number; reset: number; limit: number } {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const limit = 1000; // 1000 requests per minute

    const current = this.rateLimits.get(apiKey);

    if (!current || now > current.resetTime) {
      // Reset or initialize
      this.rateLimits.set(apiKey, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: limit - 1, reset: now + windowMs, limit };
    }

    if (current.count >= limit) {
      return { allowed: false, remaining: 0, reset: current.resetTime, limit };
    }

    current.count++;
    return { allowed: true, remaining: limit - current.count, reset: current.resetTime, limit };
  }

  private trackAPIUsage(apiKey: string, endpoint: string): void {
    const keyData = this.apiKeys.get(apiKey);
    if (keyData) {
      this.emit('api_usage', {
        clientId: keyData.clientId,
        platform: keyData.platform,
        endpoint,
        timestamp: new Date()
      });
    }
  }

  private generateMetadata(): NonNullable<APIResponse['metadata']> {
    return {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Public utility methods
   */
  public async getActiveIntegrations(): Promise<PlatformIntegration[]> {
    return Array.from(this.integrations.values());
  }

  public async getIntegrationStats(): Promise<any> {
    const integrations = Array.from(this.integrations.values());
    return {
      total: integrations.length,
      byPlatform: integrations.reduce((acc, integration) => {
        acc[integration.platform] = (acc[integration.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      features: integrations.reduce((acc, integration) => {
        Object.entries(integration.features).forEach(([feature, enabled]) => {
          if (enabled) {
            acc[feature] = (acc[feature] || 0) + 1;
          }
        });
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export default UniversalAPIService;
