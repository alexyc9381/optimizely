import { industryMetricMappingService } from '../services/industry-metric-mapping-service';

describe('IndustryMetricMappingService', () => {
  describe('getAllIndustries', () => {
    it('should return available industries', () => {
      const industries = industryMetricMappingService.getAllIndustries();
      expect(industries).toContain('saas');
      expect(industries).toContain('ecommerce');
      expect(industries.length).toBeGreaterThan(0);
    });
  });

  describe('getIndustryProfile', () => {
    it('should return SaaS industry profile', () => {
      const profile = industryMetricMappingService.getIndustryProfile('saas');
      expect(profile).toBeDefined();
      expect(profile?.industry).toBe('SaaS');
      expect(profile?.primaryMetrics).toBeDefined();
      expect(profile?.primaryMetrics.length).toBeGreaterThan(0);
    });

    it('should return E-commerce industry profile', () => {
      const profile = industryMetricMappingService.getIndustryProfile('ecommerce');
      expect(profile).toBeDefined();
      expect(profile?.industry).toBe('E-commerce');
      expect(profile?.primaryMetrics).toBeDefined();
      expect(profile?.primaryMetrics.length).toBeGreaterThan(0);
    });

    it('should return null for unknown industry', () => {
      const profile = industryMetricMappingService.getIndustryProfile('unknown');
      expect(profile).toBeNull();
    });

    it('should be case insensitive', () => {
      const profile1 = industryMetricMappingService.getIndustryProfile('SaaS');
      const profile2 = industryMetricMappingService.getIndustryProfile('saas');
      expect(profile1).toEqual(profile2);
    });
  });

  describe('getTopABTestMetrics', () => {
    it('should return top A/B test metrics for SaaS', () => {
      const metrics = industryMetricMappingService.getTopABTestMetrics('saas', 3);
      expect(metrics).toBeDefined();
      expect(metrics.length).toBeLessThanOrEqual(3);

      // Verify metrics are sorted by A/B test relevance (descending)
      for (let i = 0; i < metrics.length - 1; i++) {
        expect(metrics[i].abTestRelevance).toBeGreaterThanOrEqual(metrics[i + 1].abTestRelevance);
      }
    });

    it('should return empty array for unknown industry', () => {
      const metrics = industryMetricMappingService.getTopABTestMetrics('unknown');
      expect(metrics).toEqual([]);
    });

    it('should respect limit parameter', () => {
      const metricsLimit2 = industryMetricMappingService.getTopABTestMetrics('saas', 2);
      const metricsLimit5 = industryMetricMappingService.getTopABTestMetrics('saas', 5);

      expect(metricsLimit2.length).toBeLessThanOrEqual(2);
      expect(metricsLimit5.length).toBeLessThanOrEqual(5);
    });
  });

  describe('generateMetricRecommendations', () => {
    it('should generate metric recommendations for SaaS', () => {
      const recommendations = industryMetricMappingService.generateMetricRecommendations('saas');

      expect(recommendations).toBeDefined();
      expect(recommendations.critical).toBeDefined();
      expect(recommendations.recommended).toBeDefined();
      expect(recommendations.optional).toBeDefined();

      // SaaS should have critical metrics
      expect(recommendations.critical.length).toBeGreaterThan(0);
    });

    it('should return empty recommendations for unknown industry', () => {
      const recommendations = industryMetricMappingService.generateMetricRecommendations('unknown');

      expect(recommendations.critical).toEqual([]);
      expect(recommendations.recommended).toEqual([]);
      expect(recommendations.optional).toEqual([]);
    });
  });

  describe('metric data quality', () => {
    it('should have properly structured metric definitions', () => {
      const profile = industryMetricMappingService.getIndustryProfile('saas');
      expect(profile).toBeDefined();

      const allMetrics = [...profile!.primaryMetrics, ...profile!.secondaryMetrics];

      allMetrics.forEach(metric => {
        expect(metric.id).toBeDefined();
        expect(metric.name).toBeDefined();
        expect(metric.description).toBeDefined();
        expect(metric.type).toMatch(/^(conversion|revenue|engagement|efficiency|quality|satisfaction)$/);
        expect(metric.calculationMethod).toBeDefined();
        expect(metric.unit).toBeDefined();
        expect(metric.priority).toMatch(/^(critical|high|medium|low)$/);
        expect(metric.abTestRelevance).toBeGreaterThanOrEqual(1);
        expect(metric.abTestRelevance).toBeLessThanOrEqual(10);

        if (metric.benchmarkRange) {
          expect(metric.benchmarkRange.poor).toBeDefined();
          expect(metric.benchmarkRange.average).toBeDefined();
          expect(metric.benchmarkRange.good).toBeDefined();
          expect(metric.benchmarkRange.excellent).toBeDefined();
        }
      });
    });

    it('should have properly structured industry profiles', () => {
      const industries = industryMetricMappingService.getAllIndustries();

      industries.forEach(industryKey => {
        const profile = industryMetricMappingService.getIndustryProfile(industryKey);
        expect(profile).toBeDefined();

        expect(profile!.industry).toBeDefined();
        expect(profile!.subCategories).toBeDefined();
        expect(Array.isArray(profile!.subCategories)).toBe(true);
        expect(profile!.primaryMetrics).toBeDefined();
        expect(Array.isArray(profile!.primaryMetrics)).toBe(true);
        expect(profile!.secondaryMetrics).toBeDefined();
        expect(Array.isArray(profile!.secondaryMetrics)).toBe(true);
        expect(profile!.conversionGoals).toBeDefined();
        expect(Array.isArray(profile!.conversionGoals)).toBe(true);
        expect(profile!.typicalFunnels).toBeDefined();
        expect(Array.isArray(profile!.typicalFunnels)).toBe(true);
        expect(profile!.commonChallenges).toBeDefined();
        expect(Array.isArray(profile!.commonChallenges)).toBe(true);
        expect(profile!.abTestPriorities).toBeDefined();
        expect(Array.isArray(profile!.abTestPriorities)).toBe(true);
      });
    });
  });

  describe('business logic validation', () => {
    it('should have critical metrics with high A/B test relevance', () => {
      const industries = industryMetricMappingService.getAllIndustries();

      industries.forEach(industryKey => {
        const profile = industryMetricMappingService.getIndustryProfile(industryKey);
        const criticalMetrics = [...profile!.primaryMetrics, ...profile!.secondaryMetrics]
          .filter(m => m.priority === 'critical');

        // Critical metrics should generally have high A/B test relevance
        criticalMetrics.forEach(metric => {
          expect(metric.abTestRelevance).toBeGreaterThanOrEqual(7);
        });
      });
    });

    it('should have consistent conversion metrics across industries', () => {
      const saasProfile = industryMetricMappingService.getIndustryProfile('saas');
      const ecommerceProfile = industryMetricMappingService.getIndustryProfile('ecommerce');

      // Both should have conversion-type metrics
      const saasConversionMetrics = [...saasProfile!.primaryMetrics, ...saasProfile!.secondaryMetrics]
        .filter(m => m.type === 'conversion');
      const ecommerceConversionMetrics = [...ecommerceProfile!.primaryMetrics, ...ecommerceProfile!.secondaryMetrics]
        .filter(m => m.type === 'conversion');

      expect(saasConversionMetrics.length).toBeGreaterThan(0);
      expect(ecommerceConversionMetrics.length).toBeGreaterThan(0);
    });
  });
});
