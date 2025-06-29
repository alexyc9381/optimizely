/**
 * Industry Metric Mapping Service
 * Maps industry categories to their most relevant metrics, KPIs, and optimization targets
 */

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  type: 'conversion' | 'revenue' | 'engagement' | 'efficiency' | 'quality' | 'satisfaction';
  calculationMethod: string;
  unit: string;
  benchmarkRange?: {
    poor: number;
    average: number;
    good: number;
    excellent: number;
  };
  priority: 'critical' | 'high' | 'medium' | 'low';
  abTestRelevance: number; // 1-10 scale for A/B testing importance
}

export interface IndustryProfile {
  industry: string;
  subCategories: string[];
  primaryMetrics: MetricDefinition[];
  secondaryMetrics: MetricDefinition[];
  conversionGoals: string[];
  typicalFunnels: string[];
  commonChallenges: string[];
  abTestPriorities: string[];
}

export class IndustryMetricMappingService {
  private industryProfiles: Map<string, IndustryProfile> = new Map();

  constructor() {
    this.initializeIndustryProfiles();
  }

  private initializeIndustryProfiles(): void {
    // SaaS Industry Profile
    this.industryProfiles.set('saas', {
      industry: 'SaaS',
      subCategories: ['B2B SaaS', 'B2C SaaS', 'Enterprise SaaS', 'SMB SaaS'],
      primaryMetrics: [
        {
          id: 'mrr',
          name: 'Monthly Recurring Revenue',
          description: 'Predictable monthly revenue from subscriptions',
          type: 'revenue',
          calculationMethod: 'Sum of monthly subscription values',
          unit: 'USD',
          benchmarkRange: { poor: 0, average: 10000, good: 50000, excellent: 200000 },
          priority: 'critical',
          abTestRelevance: 10
        },
        {
          id: 'churn_rate',
          name: 'Customer Churn Rate',
          description: 'Percentage of customers who cancel subscriptions',
          type: 'efficiency',
          calculationMethod: '(Churned customers / Total customers) * 100',
          unit: '%',
          benchmarkRange: { poor: 15, average: 8, good: 5, excellent: 2 },
          priority: 'critical',
          abTestRelevance: 9
        }
      ],
      secondaryMetrics: [
        {
          id: 'trial_conversion',
          name: 'Trial to Paid Conversion',
          description: 'Percentage of trial users who become paying customers',
          type: 'conversion',
          calculationMethod: '(Paid conversions / Trial signups) * 100',
          unit: '%',
          benchmarkRange: { poor: 5, average: 15, good: 25, excellent: 40 },
          priority: 'high',
          abTestRelevance: 10
        }
      ],
      conversionGoals: ['trial_signup', 'paid_conversion', 'upgrade'],
      typicalFunnels: ['awareness → trial → activation → paid → retention'],
      commonChallenges: ['trial conversion', 'churn reduction'],
      abTestPriorities: ['pricing pages', 'onboarding flow', 'trial experience']
    });

    // E-commerce Industry Profile
    this.industryProfiles.set('ecommerce', {
      industry: 'E-commerce',
      subCategories: ['B2C Retail', 'B2B Marketplace', 'Fashion'],
      primaryMetrics: [
        {
          id: 'conversion_rate',
          name: 'Conversion Rate',
          description: 'Percentage of visitors who make a purchase',
          type: 'conversion',
          calculationMethod: '(Orders / Sessions) * 100',
          unit: '%',
          benchmarkRange: { poor: 1, average: 2.5, good: 4, excellent: 8 },
          priority: 'critical',
          abTestRelevance: 10
        }
      ],
      secondaryMetrics: [],
      conversionGoals: ['purchase', 'add_to_cart'],
      typicalFunnels: ['awareness → product view → purchase'],
      commonChallenges: ['cart abandonment', 'checkout optimization'],
      abTestPriorities: ['product pages', 'checkout flow']
    });
  }

  getIndustryProfile(industry: string): IndustryProfile | null {
    return this.industryProfiles.get(industry.toLowerCase()) || null;
  }

  getAllIndustries(): string[] {
    return Array.from(this.industryProfiles.keys());
  }

  getTopABTestMetrics(industry: string, limit: number = 5): MetricDefinition[] {
    const profile = this.getIndustryProfile(industry);
    if (!profile) return [];

    const allMetrics = [...profile.primaryMetrics, ...profile.secondaryMetrics];
    return allMetrics
      .sort((a, b) => b.abTestRelevance - a.abTestRelevance)
      .slice(0, limit);
  }

  /**
   * Generate metric recommendations for an industry
   */
  generateMetricRecommendations(industry: string): {
    critical: MetricDefinition[];
    recommended: MetricDefinition[];
    optional: MetricDefinition[];
  } {
    const profile = this.getIndustryProfile(industry);
    if (!profile) {
      return { critical: [], recommended: [], optional: [] };
    }

    const allMetrics = [...profile.primaryMetrics, ...profile.secondaryMetrics];

    return {
      critical: allMetrics.filter(m => m.priority === 'critical'),
      recommended: allMetrics.filter(m => m.priority === 'high'),
      optional: allMetrics.filter(m => ['medium', 'low'].includes(m.priority))
    };
  }
}

export const industryMetricMappingService = new IndustryMetricMappingService();
