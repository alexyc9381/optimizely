/**
 * Smart Widget Recommendation Engine Tests
 * Comprehensive test suite for intelligent widget suggestion system
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import {
    CompanyProfile,
    SmartWidgetRecommendationEngine
} from '../services/smart-widget-recommendation-engine';

// Mock dependencies
jest.mock('../services/industry-metric-mapping-service', () => ({
  industryMetricMappingService: {
    getIndustryProfile: jest.fn().mockReturnValue({
      id: 'saas',
      name: 'Software as a Service',
      primaryMetrics: [
        { id: 'mrr', name: 'Monthly Recurring Revenue' },
        { id: 'churn_rate', name: 'Churn Rate' },
        { id: 'conversion_rate', name: 'Conversion Rate' }
      ]
    })
  }
}));

jest.mock('../services/adaptive-layout-engine', () => ({
  adaptiveLayoutEngine: {
    getAvailableWidgets: jest.fn().mockImplementation((...args: any[]) => {
      const [industry, businessModel, userRole] = args as [string, string?, string?];

      // Mock widgets library with different widgets for different industries
      const allWidgets = [
        {
          id: 'mrr-kpi',
          type: 'kpi',
          title: 'Monthly Recurring Revenue',
          component: 'MRRWidget',
          size: 'medium',
          priority: 10,
          industry: ['saas'],
          businessModel: ['saas'],
          userRole: ['executive', 'manager']
        },
        {
          id: 'churn-analysis',
          type: 'chart',
          title: 'Churn Analysis',
          component: 'ChurnChart',
          size: 'large',
          priority: 9,
          industry: ['saas'],
          businessModel: ['saas'],
          userRole: ['executive', 'analyst']
        },
        {
          id: 'conversion-rate-chart',
          type: 'chart',
          title: 'Conversion Rate Chart',
          component: 'ConversionChart',
          size: 'medium',
          priority: 8,
          industry: ['saas', 'ecommerce'],
          businessModel: ['saas', 'ecommerce'],
          userRole: ['marketing', 'growth']
        },
        {
          id: 'cohort-analysis',
          type: 'chart',
          title: 'Cohort Analysis',
          component: 'CohortChart',
          size: 'xlarge',
          priority: 7,
          industry: ['saas'],
          businessModel: ['saas'],
          userRole: ['analyst', 'executive']
        },
        {
          id: 'support-tickets-table',
          type: 'table',
          title: 'Support Tickets',
          component: 'SupportTable',
          size: 'large',
          priority: 6,
          industry: ['saas'],
          businessModel: ['saas'],
          userRole: ['support', 'manager']
        },
        {
          id: 'sales-chart',
          type: 'chart',
          title: 'Sales Performance',
          component: 'SalesChart',
          size: 'large',
          priority: 8,
          industry: ['ecommerce'],
          businessModel: ['ecommerce'],
          userRole: ['sales', 'manager']
        },
        {
          id: 'inventory-kpi',
          type: 'kpi',
          title: 'Inventory Status',
          component: 'InventoryWidget',
          size: 'medium',
          priority: 7,
          industry: ['ecommerce'],
          businessModel: ['ecommerce'],
          userRole: ['operations', 'manager']
        },
        {
          id: 'compliance-table',
          type: 'table',
          title: 'Compliance Status',
          component: 'ComplianceTable',
          size: 'large',
          priority: 9,
          industry: ['finance'],
          businessModel: ['b2b'],
          userRole: ['compliance', 'executive']
        }
      ];

      // Filter widgets based on parameters
      return allWidgets.filter(widget => {
        if (industry && widget.industry && !widget.industry.includes(industry)) {
          return false;
        }
        if (businessModel && widget.businessModel && !widget.businessModel.includes(businessModel)) {
          return false;
        }
        if (userRole && userRole !== 'all' && widget.userRole && !widget.userRole.includes(userRole)) {
          return false;
        }
        return true;
      });
    })
  }
}));

describe('SmartWidgetRecommendationEngine', () => {
  let engine: SmartWidgetRecommendationEngine;
  let mockSaaSProfile: CompanyProfile;
  let mockEcommerceProfile: CompanyProfile;
  let mockStartupProfile: CompanyProfile;
  let mockEnterpriseProfile: CompanyProfile;

  beforeEach(() => {
    engine = new SmartWidgetRecommendationEngine();

    mockSaaSProfile = {
      id: 'saas-test-company',
      name: 'Test SaaS Company',
      industry: 'saas',
      businessModel: 'saas',
      size: 'medium',
      technicalSophistication: 'intermediate',
      primaryGoals: ['growth', 'retention'],
      currentTools: ['analytics', 'crm'],
      teamSize: 25,
      monthlyRevenue: 50000,
      geography: 'US',
      compliance: ['gdpr'],
      dataVolume: 'medium'
    };

    mockEcommerceProfile = {
      id: 'ecom-test-company',
      name: 'Test E-commerce Company',
      industry: 'ecommerce',
      businessModel: 'ecommerce',
      size: 'small',
      technicalSophistication: 'basic',
      primaryGoals: ['sales', 'conversion'],
      currentTools: ['shopify', 'google-analytics'],
      teamSize: 8,
      monthlyRevenue: 25000,
      geography: 'US',
      dataVolume: 'low'
    };

    mockStartupProfile = {
      id: 'startup-test-company',
      name: 'Test Startup',
      industry: 'saas',
      businessModel: 'saas',
      size: 'startup',
      technicalSophistication: 'basic',
      primaryGoals: ['growth'],
      currentTools: ['slack'],
      teamSize: 5,
      monthlyRevenue: 5000,
      geography: 'US',
      dataVolume: 'low'
    };

    mockEnterpriseProfile = {
      id: 'enterprise-test-company',
      name: 'Test Enterprise',
      industry: 'finance',
      businessModel: 'b2b',
      size: 'enterprise',
      technicalSophistication: 'expert',
      primaryGoals: ['compliance', 'efficiency'],
      currentTools: ['sql', 'python', 'tableau', 'salesforce'],
      teamSize: 500,
      monthlyRevenue: 1000000,
      geography: 'Global',
      compliance: ['sox', 'gdpr', 'ccpa'],
      dataVolume: 'enterprise'
    };
  });

  describe('Company Profile Analysis', () => {
    test('should analyze SaaS company profile correctly', () => {
      const analysis = engine.analyzeCompanyProfile(mockSaaSProfile);

      expect(analysis.sophisticationScore).toBeGreaterThan(0);
      expect(analysis.primaryNeeds).toContain('conversion optimization');
      expect(analysis.primaryNeeds).toContain('retention analysis');
      expect(analysis.opportunities).toBeInstanceOf(Array);
      expect(analysis.riskFactors).toBeInstanceOf(Array);
    });

    test('should adjust sophistication score based on company size', () => {
      const startupAnalysis = engine.analyzeCompanyProfile(mockStartupProfile);
      const enterpriseAnalysis = engine.analyzeCompanyProfile(mockEnterpriseProfile);

      expect(enterpriseAnalysis.sophisticationScore).toBeGreaterThan(startupAnalysis.sophisticationScore);
    });

    test('should identify high-revenue opportunities', () => {
      const highRevenueProfile = {
        ...mockSaaSProfile,
        monthlyRevenue: 150000,
        technicalSophistication: 'basic' as const
      };

      const analysis = engine.analyzeCompanyProfile(highRevenueProfile);
      expect(analysis.opportunities).toContain('High revenue opportunity for advanced analytics');
    });

    test('should identify risk factors', () => {
      const riskProfile = {
        ...mockSaaSProfile,
        dataVolume: 'high' as const,
        technicalSophistication: 'basic' as const
      };

      const analysis = engine.analyzeCompanyProfile(riskProfile);
      expect(analysis.riskFactors).toContain('Complex data needs vs. basic technical capability');
    });

    test('should boost sophistication score for advanced tools', () => {
      const basicProfile = {
        ...mockSaaSProfile,
        currentTools: ['email'],
        technicalSophistication: 'basic' as const
      };

      const advancedProfile = {
        ...mockSaaSProfile,
        currentTools: ['sql', 'python', 'tableau'],
        technicalSophistication: 'basic' as const
      };

      const basicAnalysis = engine.analyzeCompanyProfile(basicProfile);
      const advancedAnalysis = engine.analyzeCompanyProfile(advancedProfile);

      expect(advancedAnalysis.sophisticationScore).toBeGreaterThan(basicAnalysis.sophisticationScore);
    });
  });

  describe('Widget Recommendations', () => {
    test('should generate recommendations for SaaS company', () => {
      const recommendations = engine.generateRecommendations(mockSaaSProfile);

      expect(recommendations).toHaveProperty('companyId', mockSaaSProfile.id);
      expect(recommendations).toHaveProperty('industry', mockSaaSProfile.industry);
      expect(recommendations).toHaveProperty('recommendations');
      expect(recommendations.recommendations).toBeInstanceOf(Array);
      expect(recommendations.recommendations.length).toBeGreaterThan(0);
    });

    test('should prioritize essential widgets', () => {
      const recommendations = engine.generateRecommendations(mockSaaSProfile);

      const essentialWidgets = recommendations.recommendations.filter(r => r.category === 'essential');
      const otherWidgets = recommendations.recommendations.filter(r => r.category !== 'essential');

      expect(essentialWidgets.length).toBeGreaterThan(0);

      if (essentialWidgets.length > 0 && otherWidgets.length > 0) {
        expect(essentialWidgets[0].score).toBeGreaterThanOrEqual(otherWidgets[0].score);
      }
    });

    test('should limit recommendations based on technical sophistication', () => {
      const basicRecommendations = engine.generateRecommendations(mockStartupProfile);
      const expertRecommendations = engine.generateRecommendations(mockEnterpriseProfile);

      // Basic companies should get fewer recommendations
      expect(basicRecommendations.recommendations.length).toBeLessThanOrEqual(10);
      // Expert companies can handle more
      expect(expertRecommendations.recommendations.length).toBeGreaterThanOrEqual(basicRecommendations.recommendations.length);
    });

    test('should include implementation phases', () => {
      const recommendations = engine.generateRecommendations(mockSaaSProfile);

      expect(recommendations.implementation).toHaveProperty('phase1');
      expect(recommendations.implementation).toHaveProperty('phase2');
      expect(recommendations.implementation).toHaveProperty('phase3');

      expect(recommendations.implementation.phase1).toBeInstanceOf(Array);
      expect(recommendations.implementation.phase2).toBeInstanceOf(Array);
      expect(recommendations.implementation.phase3).toBeInstanceOf(Array);
    });

    test('should generate different recommendations for different industries', () => {
      const saasRecommendations = engine.generateRecommendations(mockSaaSProfile);
      const ecommerceRecommendations = engine.generateRecommendations(mockEcommerceProfile);

      expect(saasRecommendations.industry).toBe('saas');
      expect(ecommerceRecommendations.industry).toBe('ecommerce');

      // Should have different recommendation sets
      const saasWidgetIds = saasRecommendations.recommendations.map(r => r.widget.id);
      const ecommerceWidgetIds = ecommerceRecommendations.recommendations.map(r => r.widget.id);

      expect(saasWidgetIds).not.toEqual(ecommerceWidgetIds);
    });

    test('should include business impact assessment', () => {
      const recommendations = engine.generateRecommendations(mockSaaSProfile);

      recommendations.recommendations.forEach(recommendation => {
        expect(recommendation.businessImpact).toHaveProperty('roi');
        expect(recommendation.businessImpact).toHaveProperty('kpis');
        expect(recommendation.businessImpact).toHaveProperty('useCases');
        expect(recommendation.businessImpact.kpis).toBeInstanceOf(Array);
        expect(recommendation.businessImpact.useCases).toBeInstanceOf(Array);
      });
    });

    test('should include implementation guidance', () => {
      const recommendations = engine.generateRecommendations(mockSaaSProfile);

      recommendations.recommendations.forEach(recommendation => {
        expect(recommendation.implementation).toHaveProperty('difficulty');
        expect(recommendation.implementation).toHaveProperty('timeToValue');
        expect(recommendation.implementation).toHaveProperty('dependencies');
        expect(['easy', 'medium', 'hard']).toContain(recommendation.implementation.difficulty);
        expect(['immediate', 'short', 'medium', 'long']).toContain(recommendation.implementation.timeToValue);
      });
    });
  });

  describe('Customizations', () => {
    test('should generate industry-appropriate customizations', () => {
      const saasRecommendations = engine.generateRecommendations(mockSaaSProfile);
      const ecommerceRecommendations = engine.generateRecommendations(mockEcommerceProfile);

      expect(saasRecommendations.customizations).toHaveProperty('colorScheme');
      expect(ecommerceRecommendations.customizations).toHaveProperty('colorScheme');

      // Different industries should get different color schemes
      expect(saasRecommendations.customizations.colorScheme).not.toBe(ecommerceRecommendations.customizations.colorScheme);
    });

    test('should adapt layout based on sophistication', () => {
      const basicRecommendations = engine.generateRecommendations(mockStartupProfile);
      const expertRecommendations = engine.generateRecommendations(mockEnterpriseProfile);

      expect(basicRecommendations.customizations.layout).toBe('simple');
      expect(expertRecommendations.customizations.layout).toBe('dense');
    });

    test('should include branding considerations', () => {
      const recommendations = engine.generateRecommendations(mockSaaSProfile);

      expect(recommendations.customizations).toHaveProperty('branding');
      expect(recommendations.customizations.branding).toHaveProperty('companySize');
      expect(recommendations.customizations.branding).toHaveProperty('industry');
      expect(recommendations.customizations.branding).toHaveProperty('complexity');
    });
  });

  describe('Recommendation Explanation', () => {
    test('should provide detailed explanation for widget recommendations', () => {
      const explanation = engine.getRecommendationExplanation('test-company', 'mrr-kpi');

      expect(explanation).toHaveProperty('reasoning');
      expect(explanation).toHaveProperty('alternatives');
      expect(explanation).toHaveProperty('implementationSteps');
      expect(explanation).toHaveProperty('expectedBenefits');

      expect(explanation.alternatives).toBeInstanceOf(Array);
      expect(explanation.implementationSteps).toBeInstanceOf(Array);
      expect(explanation.expectedBenefits).toBeInstanceOf(Array);
    });

    test('should include implementation steps', () => {
      const explanation = engine.getRecommendationExplanation('test-company', 'mrr-kpi');

      expect(explanation.implementationSteps).toContain('Configure data sources');
      expect(explanation.implementationSteps).toContain('Set up widget parameters');
      expect(explanation.implementationSteps).toContain('Test with sample data');
      expect(explanation.implementationSteps).toContain('Deploy to dashboard');
    });
  });

  describe('Feedback Tracking', () => {
    test('should track recommendation feedback', () => {
      const feedback = {
        implemented: true,
        useful: true,
        rating: 9,
        comments: 'Very helpful widget!'
      };

      // Should not throw an error
      expect(() => {
        engine.trackRecommendationFeedback('test-company', 'mrr-kpi', feedback);
      }).not.toThrow();
    });

    test('should handle feedback without comments', () => {
      const feedback = {
        implemented: false,
        useful: true,
        rating: 7
      };

      expect(() => {
        engine.trackRecommendationFeedback('test-company', 'churn-analysis', feedback);
      }).not.toThrow();
    });
  });

  describe('Industry Benchmarks', () => {
    test('should return benchmarks for known industries', () => {
      const saasBenchmarks = engine.getIndustryBenchmarks('saas');

      expect(saasBenchmarks).toHaveProperty('avgWidgetsPerDashboard');
      expect(saasBenchmarks).toHaveProperty('commonWidgets');
      expect(saasBenchmarks).toHaveProperty('implementationTimeline');
      expect(saasBenchmarks).toHaveProperty('successMetrics');

      expect(saasBenchmarks.avgWidgetsPerDashboard).toBeGreaterThan(0);
      expect(saasBenchmarks.commonWidgets).toBeInstanceOf(Array);
      expect(saasBenchmarks.successMetrics).toBeInstanceOf(Array);
    });

    test('should return default benchmarks for unknown industries', () => {
      const unknownBenchmarks = engine.getIndustryBenchmarks('unknown');

      expect(unknownBenchmarks).toHaveProperty('avgWidgetsPerDashboard');
      expect(unknownBenchmarks.avgWidgetsPerDashboard).toBe(8);
      expect(unknownBenchmarks.commonWidgets).toEqual([]);
    });

    test('should include implementation timeline', () => {
      const benchmarks = engine.getIndustryBenchmarks('saas');

      expect(benchmarks.implementationTimeline).toHaveProperty('Phase 1 (Week 1-2)');
      expect(benchmarks.implementationTimeline).toHaveProperty('Phase 2 (Week 3-4)');
      expect(benchmarks.implementationTimeline).toHaveProperty('Phase 3 (Month 2+)');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty primary goals', () => {
      const profileWithEmptyGoals = {
        ...mockSaaSProfile,
        primaryGoals: []
      };

      expect(() => {
        engine.generateRecommendations(profileWithEmptyGoals);
      }).not.toThrow();
    });

    test('should handle minimal company profile', () => {
      const minimalProfile: CompanyProfile = {
        id: 'minimal-test',
        name: 'Minimal Company',
        industry: 'saas',
        businessModel: 'saas',
        size: 'startup',
        technicalSophistication: 'basic',
        primaryGoals: ['growth'],
        currentTools: [],
        teamSize: 1,
        geography: 'US',
        dataVolume: 'low'
      };

      const recommendations = engine.generateRecommendations(minimalProfile);
      expect(recommendations).toHaveProperty('recommendations');
      expect(recommendations.recommendations).toBeInstanceOf(Array);
    });

    test('should handle extremely high sophistication scores', () => {
      const highSophisticationProfile = {
        ...mockEnterpriseProfile,
        currentTools: ['sql', 'python', 'r', 'tableau', 'powerbi', 'spark', 'kubernetes'],
        technicalSophistication: 'expert' as const
      };

      expect(() => {
        engine.analyzeCompanyProfile(highSophisticationProfile);
      }).not.toThrow();
    });

    test('should handle companies with no revenue data', () => {
      const noRevenueProfile = {
        ...mockSaaSProfile,
        monthlyRevenue: undefined
      };

      const recommendations = engine.generateRecommendations(noRevenueProfile);
      expect(recommendations).toHaveProperty('recommendations');
    });
  });

  describe('Performance and Scalability', () => {
    test('should generate recommendations quickly', () => {
      const startTime = Date.now();
      engine.generateRecommendations(mockSaaSProfile);
      const endTime = Date.now();

      // Should complete in under 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should handle batch processing', () => {
      const profiles = [mockSaaSProfile, mockEcommerceProfile, mockStartupProfile];
      const startTime = Date.now();

      profiles.forEach(profile => {
        engine.generateRecommendations(profile);
      });

      const endTime = Date.now();
      // Should complete all in under 300ms
      expect(endTime - startTime).toBeLessThan(300);
    });
  });

  describe('Consistency and Determinism', () => {
    test('should generate consistent recommendations for same profile', () => {
      const recommendations1 = engine.generateRecommendations(mockSaaSProfile);
      const recommendations2 = engine.generateRecommendations(mockSaaSProfile);

      expect(recommendations1.recommendations.length).toBe(recommendations2.recommendations.length);
      expect(recommendations1.totalScore).toBe(recommendations2.totalScore);
    });

    test('should maintain recommendation order consistency', () => {
      const recommendations1 = engine.generateRecommendations(mockSaaSProfile);
      const recommendations2 = engine.generateRecommendations(mockSaaSProfile);

      const widgetIds1 = recommendations1.recommendations.map(r => r.widget.id);
      const widgetIds2 = recommendations2.recommendations.map(r => r.widget.id);

      expect(widgetIds1).toEqual(widgetIds2);
    });
  });
});
