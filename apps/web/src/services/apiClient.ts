/* eslint-disable no-undef */
// API Client for Optimizely Universal AI A/B Testing Platform

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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

    return response.json();
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
}

export const apiClient = new ApiClient();
export default apiClient;
