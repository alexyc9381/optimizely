/* eslint-disable no-undef */
// API Client for Optimizely Universal AI A/B Testing Platform

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ABTest {
  id: string;
  name: string;
  status: 'Running' | 'Paused' | 'Completed' | 'Draft';
  industry: string;
  startDate: string;
  endDate?: string;
  visitors: number;
  conversionRate: {
    control: number;
    variant: number;
  };
  confidence: number;
  uplift: number;
}

export interface CreateABTestConfig {
  name: string;
  description: string;
  industry: string;
  targetUrl: string;
  hypothesis: string;
  primaryMetric: string;
  variants: {
    control: {
      name: string;
      description: string;
    };
    variant: {
      name: string;
      description: string;
      changes: string;
    };
  };
  trafficSplit: number;
  duration: number;
  minimumDetectableEffect: number;
  significanceLevel: number;
}

export interface AnalyticsData {
  totalVisitors: number;
  conversionRate: number;
  revenue: number;
  testsRunning: number;
  avgTestDuration: number;
  significantResults: number;
}

export interface AIModel {
  id: string;
  name: string;
  type: string;
  status: string;
  accuracy: number;
  industry: string;
  usage: number;
  version: string;
}

export interface Integration {
  name: string;
  logo: string;
  description: string;
  status: string;
  category: string;
}

export interface IndustryData {
  name: string;
  color: string;
  metrics: {
    conversionRate: number;
    avgTestDuration: number;
    topPerformingElement: string;
    improvement: string;
  };
  insights: string[];
  topTests: Array<{
    name: string;
    improvement: string;
    confidence: string;
  }>;
}

export interface ModelTrainingConfig {
  name: string;
  industry: string;
  type: string;
  dataSource: string;
  hyperparameters: {
    learningRate: number;
    epochs: number;
    batchSize: number;
  };
  validationSplit: number;
  description?: string;
}

export interface TrainingJob {
  id: string;
  modelName: string;
  status: 'Queued' | 'Training' | 'Completed' | 'Failed';
  progress: number;
  startTime: string;
  estimatedCompletion?: string;
  accuracy?: number;
}

export interface WebsiteScanResult {
  url: string;
  title: string;
  description: string;
  industry: string;
  elements: {
    buttons: Array<{
      text: string;
      location: string;
      type: 'cta' | 'navigation' | 'form';
      prominence: number;
    }>;
    headlines: Array<{
      text: string;
      level: number;
      location: string;
    }>;
    images: Array<{
      alt: string;
      src: string;
      location: string;
    }>;
    forms: Array<{
      type: string;
      fields: string[];
      location: string;
    }>;
  };
  metrics: {
    loadTime: number;
    mobileOptimized: boolean;
    conversionElements: number;
    trustSignals: number;
  };
  recommendations: string[];
}

export interface TestSuggestion {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number;
  confidence: number;
  category: 'cta' | 'layout' | 'copy' | 'form' | 'pricing' | 'social-proof';
  variants: {
    control: {
      name: string;
      description: string;
    };
    variant: {
      name: string;
      description: string;
      changes: string;
    };
  };
  recommendedMetric: string;
  recommendedDuration: number;
  trafficSplit: number;
}

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const jsonResponse = await response.json();

    // Handle wrapped API responses { success: true, data: ... }
    if (jsonResponse.success && jsonResponse.data) {
      return jsonResponse.data;
    }

    // Handle error responses { success: false, error: ... }
    if (jsonResponse.success === false) {
      throw new Error(jsonResponse.error || 'API request failed');
    }

    // Return direct response for other endpoints
    return jsonResponse;
  }

  // A/B Testing API
  async getABTests(): Promise<ABTest[]> {
    return this.request<ABTest[]>('/ab-testing');
  }

  async createABTest(data: Partial<ABTest>): Promise<ABTest> {
    return this.request<ABTest>('/ab-testing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateABTest(id: string, data: Partial<ABTest>): Promise<ABTest> {
    return this.request<ABTest>(`/ab-testing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteABTest(id: string): Promise<void> {
    return this.request<void>(`/ab-testing/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics API
  async getAnalytics(timeRange: string = '30d'): Promise<AnalyticsData> {
    return this.request<AnalyticsData>(`/analytics?timeRange=${timeRange}`);
  }

  async getIndustryBreakdown(timeRange: string = '30d'): Promise<any[]> {
    return this.request<any[]>(`/analytics/industry-breakdown?timeRange=${timeRange}`);
  }

  async getTopPerformingTests(): Promise<any[]> {
    return this.request<any[]>('/analytics/top-tests');
  }

  // AI Models API
  async getModels(): Promise<AIModel[]> {
    return this.request<AIModel[]>('/models');
  }

  async createModel(data: Partial<AIModel>): Promise<AIModel> {
    return this.request<AIModel>('/models', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateModel(id: string, data: Partial<AIModel>): Promise<AIModel> {
    return this.request<AIModel>(`/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteModel(id: string): Promise<void> {
    return this.request<void>(`/models/${id}`, {
      method: 'DELETE',
    });
  }

  async trainModel(config: ModelTrainingConfig): Promise<TrainingJob> {
    return this.request<TrainingJob>('/models/train', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async scanWebsite(url: string): Promise<WebsiteScanResult> {
    return this.request<WebsiteScanResult>('/website/scan', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async getTestSuggestions(scanData?: WebsiteScanResult): Promise<TestSuggestion[]> {
    return this.request<TestSuggestion[]>('/ab-testing/suggestions', {
      method: 'POST',
      body: JSON.stringify({ scanData }),
    });
  }

  // AI Generation API
  async generateVariants(data: {
    elementType: string;
    originalContent: string;
    hypothesis?: string;
    targetUrl?: string;
    industry?: string;
    context?: string;
    count?: number;
  }): Promise<Array<{
    name: string;
    description: string;
    changes: string;
    rationale: string;
  }>> {
    return this.request('/ai/generate-variants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateHypothesis(data: {
    elementType: string;
    originalContent: string;
    targetUrl?: string;
    industry?: string;
    context?: string;
  }): Promise<{ hypothesis: string }> {
    return this.request('/ai/generate-hypothesis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateDescription(data: {
    elementType: string;
    originalContent: string;
    hypothesis: string;
    targetUrl?: string;
    industry?: string;
  }): Promise<{ description: string }> {
    return this.request('/ai/generate-description', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Industry Insights API
  async getIndustryData(industry: string): Promise<IndustryData> {
    return this.request<IndustryData>(`/industry-insights/${industry}`);
  }

  async getAllIndustries(): Promise<IndustryData[]> {
    return this.request<IndustryData[]>('/industry-insights');
  }

  // Integrations API
  async getIntegrations(): Promise<Integration[]> {
    return this.request<Integration[]>('/integrations');
  }

  async installIntegration(name: string): Promise<void> {
    return this.request<void>(`/integrations/${name}/install`, {
      method: 'POST',
    });
  }

  async uninstallIntegration(name: string): Promise<void> {
    return this.request<void>(`/integrations/${name}/uninstall`, {
      method: 'DELETE',
    });
  }

  // Dashboard API
  async getDashboardMetrics(): Promise<any> {
    return this.request<any>('/dashboard/metrics');
  }

  async getRecentActivity(): Promise<any[]> {
    return this.request<any[]>('/dashboard/recent-activity');
  }

  // Settings API
  async getSettings(): Promise<any> {
    return this.request<any>('/settings');
  }

  async updateSettings(data: any): Promise<any> {
    return this.request<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Events API
  async trackEvent(event: any): Promise<void> {
    return this.request<void>('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  // Health check
  async health(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }

  // Convenience methods for testing compatibility
  async fetchAnalytics(timeRange: string = '30d'): Promise<AnalyticsData> {
    return this.getAnalytics(timeRange);
  }

  async fetchMetrics(): Promise<any> {
    return this.getDashboardMetrics();
  }
}

export const apiClient = new ApiClient();
export default apiClient;
