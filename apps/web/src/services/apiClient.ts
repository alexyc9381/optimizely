// API Client for Optimizely Universal AI A/B Testing Platform

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}/api/v1${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health Check
  async getHealth() {
    return this.request('/health');
  }

  // Analytics Services
  async getAnalytics(filters?: any) {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.request(`/analytics${query}`);
  }

  async getRevenuePrediction(timeframe: string = '7d') {
    return this.request(`/analytics/revenue-prediction?timeframe=${timeframe}`);
  }

  async getExecutiveKPIs() {
    return this.request('/executive-kpi/dashboard');
  }

  // Adaptive Recommendation Engine
  async getRecommendations(userId: string) {
    return this.request(`/adaptive-recommendation/recommendations/${userId}`);
  }

  async trackBehavior(behaviorData: any) {
    return this.request('/adaptive-recommendation/behavior', {
      method: 'POST',
      body: JSON.stringify(behaviorData),
    });
  }

  async getAdaptiveStats() {
    return this.request('/adaptive-recommendation/stats');
  }

  // A/B Testing Framework
  async getABTests(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/ab-testing/experiments${query}`);
  }

  async getABTestStats() {
    return this.request('/ab-testing/stats');
  }

  async getExperimentResults(experimentId: string) {
    return this.request(`/ab-testing/experiments/${experimentId}`);
  }

  // Model Refinement Engine
  async getModelPerformance() {
    return this.request('/model-refinement/models/performance');
  }

  async getRetrainingHistory() {
    return this.request('/model-refinement/retraining/history');
  }

  async getModelStats() {
    return this.request('/model-refinement/stats');
  }

  // Visitor Intelligence
  async getVisitorIntelligence(filters?: any) {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.request(`/visitor-intelligence${query}`);
  }

  async getHotProspects() {
    return this.request('/hot-accounts');
  }

  // Real-time Predictions
  async getRealTimePredictions() {
    return this.request('/real-time-predictions');
  }

  // Industry Analytics
  async getIndustryMetrics(industry: string) {
    return this.request(`/industry-metrics?industry=${industry}`);
  }

  // Behavioral Analytics
  async getBehavioralInsights(userId?: string) {
    const query = userId ? `?userId=${userId}` : '';
    return this.request(`/behavioral${query}`);
  }

  // Revenue Attribution
  async getRevenueAttribution() {
    return this.request('/revenue-attribution');
  }

  // Performance Dashboard
  async getPerformanceDashboard() {
    return this.request('/performance-dashboard');
  }

  // Cross-Industry Performance Analytics
  async getCrossIndustryAnalytics() {
    return this.request('/cross-industry-performance-analytics');
  }

  // Smart Widget Recommendations
  async getWidgetRecommendations(userId: string) {
    return this.request(`/smart-widget-recommendations/${userId}`);
  }

  // Outcome Tracking
  async getOutcomeTracking() {
    return this.request('/outcome-tracking');
  }

  // Progressive Complexity Analytics
  async getProgressiveComplexity() {
    return this.request('/progressive-complexity');
  }

  // Multi-Dimensional Testing
  async getMultiDimensionalTests() {
    return this.request('/multi-dimensional-testing');
  }

  // Statistical Monitoring
  async getStatisticalMonitoring() {
    return this.request('/statistical-monitoring');
  }

  // Dynamic Personalization
  async getPersonalizationResults() {
    return this.request('/dynamic-personalization');
  }

  // Enterprise Infrastructure Stats
  async getEnterpriseStats() {
    return this.request('/enterprise-infrastructure/stats');
  }

  // Pipeline Visualization
  async getPipelineVisualization() {
    return this.request('/pipeline-visualization');
  }

  // Psychographic Profiling
  async getPsychographicProfiles() {
    return this.request('/psychographic-profiling');
  }

  // Real-time Dashboard Data (Combined)
  async getDashboardData() {
    try {
      const [
        health,
        analytics,
        kpis,
        abTestStats,
        modelStats,
        hotProspects,
        realtimePredictions,
        outcomeTracking
      ] = await Promise.allSettled([
        this.getHealth(),
        this.getAnalytics(),
        this.getExecutiveKPIs(),
        this.getABTestStats(),
        this.getModelStats(),
        this.getHotProspects(),
        this.getRealTimePredictions(),
        this.getOutcomeTracking()
      ]);

      return {
        health: health.status === 'fulfilled' ? health.value : null,
        analytics: analytics.status === 'fulfilled' ? analytics.value : null,
        kpis: kpis.status === 'fulfilled' ? kpis.value : null,
        abTestStats: abTestStats.status === 'fulfilled' ? abTestStats.value : null,
        modelStats: modelStats.status === 'fulfilled' ? modelStats.value : null,
        hotProspects: hotProspects.status === 'fulfilled' ? hotProspects.value : null,
        realtimePredictions: realtimePredictions.status === 'fulfilled' ? realtimePredictions.value : null,
        outcomeTracking: outcomeTracking.status === 'fulfilled' ? outcomeTracking.value : null,
      };
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
export default ApiClient;
