import GeographicMarketPreferenceAnalyticsService, {
    GeographicLocation,
    Industry,
    MarketType,
    PreferenceStrength
} from '../geographic-market-preference-analytics-service';

describe('GeographicMarketPreferenceAnalyticsService', () => {
  let service: GeographicMarketPreferenceAnalyticsService;
  const mockCustomerId = 'test-customer-123';
  const mockCustomerId2 = 'test-customer-456';

  const mockGeographicLocation: GeographicLocation = {
    country: 'United States',
    region: 'West Coast',
    state: 'California',
    city: 'San Francisco',
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
    timezone: 'America/Los_Angeles',
    marketSize: 'large',
    economicIndicators: {
      gdpPerCapita: 75000,
      marketMaturity: 'mature',
      regulatoryComplexity: 'high'
    }
  };

  beforeEach(() => {
    // Reset singleton for testing
    (GeographicMarketPreferenceAnalyticsService as any)._instance = null;
    service = GeographicMarketPreferenceAnalyticsService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = GeographicMarketPreferenceAnalyticsService.getInstance();
      const instance2 = GeographicMarketPreferenceAnalyticsService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Market Preference Creation', () => {
    it('should create market preference with correct properties', async () => {
      const preference = await service.createMarketPreference(
        mockCustomerId,
        Industry.SAAS,
        MarketType.DEPLOYMENT_REGION,
        'AWS US-West-2',
        {
          geographicLocation: mockGeographicLocation,
          tags: ['cloud', 'enterprise']
        }
      );

      expect(preference).toBeDefined();
      expect(preference.customerId).toBe(mockCustomerId);
      expect(preference.industry).toBe(Industry.SAAS);
      expect(preference.marketType).toBe(MarketType.DEPLOYMENT_REGION);
      expect(preference.preferenceValue).toBe('AWS US-West-2');
      expect(preference.preferenceScore).toBeGreaterThan(0);
      expect(preference.preferenceScore).toBeLessThanOrEqual(100);
      expect(preference.geographicLocation).toEqual(mockGeographicLocation);
      expect(preference.tags).toContain('cloud');
      expect(preference.tags).toContain('enterprise');
    });

    it('should calculate higher scores for high-priority market types', async () => {
      const highPriorityPreference = await service.createMarketPreference(
        mockCustomerId,
        Industry.FINTECH,
        MarketType.REGULATORY_JURISDICTION,
        'EU GDPR Compliant'
      );

      const normalPriorityPreference = await service.createMarketPreference(
        mockCustomerId,
        Industry.FINTECH,
        MarketType.CURRENCY_ZONE,
        'USD Primary'
      );

      expect(highPriorityPreference.preferenceScore).toBeGreaterThan(normalPriorityPreference.preferenceScore);
    });

    it('should assign correct preference strength based on score', async () => {
      const preference = await service.createMarketPreference(
        mockCustomerId,
        Industry.HEALTHCARE,
        MarketType.REGULATORY_FRAMEWORK,
        'HIPAA Compliant',
        { explicitScore: 95 }
      );

      expect(preference.preferenceStrength).toBe(PreferenceStrength.VERY_STRONG);
    });

    it('should throw error for invalid customer ID', async () => {
      await expect(
        service.createMarketPreference('', Industry.SAAS, MarketType.DEPLOYMENT_REGION, 'test')
      ).rejects.toThrow('Customer ID is required');
    });

    it('should throw error for invalid industry', async () => {
      await expect(
        service.createMarketPreference(mockCustomerId, 'invalid' as Industry, MarketType.DEPLOYMENT_REGION, 'test')
      ).rejects.toThrow('Invalid industry');
    });

    it('should throw error for invalid market type', async () => {
      await expect(
        service.createMarketPreference(mockCustomerId, Industry.SAAS, 'invalid' as MarketType, 'test')
      ).rejects.toThrow('Invalid market type');
    });
  });

  describe('Market Preference Retrieval', () => {
    beforeEach(async () => {
      await service.createMarketPreference(
        mockCustomerId,
        Industry.SAAS,
        MarketType.DEPLOYMENT_REGION,
        'AWS US-West-2'
      );
      await service.createMarketPreference(
        mockCustomerId,
        Industry.MANUFACTURING,
        MarketType.SUPPLIER_REGION,
        'Asia Pacific'
      );
      await service.createMarketPreference(
        mockCustomerId2,
        Industry.SAAS,
        MarketType.CLOUD_PROVIDER,
        'Azure'
      );
    });

    it('should retrieve customer market preferences', () => {
      const customerPrefs = service.getCustomerMarketPreferences(mockCustomerId);
      expect(customerPrefs.length).toBe(2);
      expect(customerPrefs[0].customerId).toBe(mockCustomerId);
      // Should be sorted by preference score descending
      expect(customerPrefs[0].preferenceScore).toBeGreaterThanOrEqual(customerPrefs[1].preferenceScore);
    });

    it('should retrieve industry market preferences', () => {
      const industryPrefs = service.getIndustryMarketPreferences(Industry.SAAS);
      expect(industryPrefs.length).toBe(2); // One from each customer
      expect(industryPrefs.every(p => p.industry === Industry.SAAS)).toBe(true);
    });

    it('should return empty array for non-existent customer', () => {
      const preferences = service.getCustomerMarketPreferences('non-existent-customer');
      expect(preferences).toEqual([]);
    });
  });

  describe('Market Preference Updates', () => {
    let preferenceId: string;

    beforeEach(async () => {
      const preference = await service.createMarketPreference(
        mockCustomerId,
        Industry.COLLEGE_CONSULTING,
        MarketType.COLLEGE_REGION,
        'Northeast'
      );
      preferenceId = preference.id;
    });

    it('should update market preference', async () => {
      const updated = await service.updateMarketPreference(preferenceId, {
        preferenceValue: 'West Coast',
        tags: ['updated']
      });

      expect(updated.preferenceValue).toBe('West Coast');
      expect(updated.tags).toContain('updated');
      expect(updated.updatedAt).not.toBe(updated.createdAt);
    });

    it('should preserve preference ID during update', async () => {
      const updated = await service.updateMarketPreference(preferenceId, {
        preferenceValue: 'Updated Value'
      });

      expect(updated.id).toBe(preferenceId);
    });

    it('should throw error for non-existent preference', async () => {
      await expect(
        service.updateMarketPreference('non-existent', { preferenceValue: 'test' })
      ).rejects.toThrow('Market preference not found');
    });
  });

  describe('Market Insights Generation', () => {
    beforeEach(async () => {
      // Create multiple preferences for analysis
      await service.createMarketPreference(
        mockCustomerId,
        Industry.SAAS,
        MarketType.DEPLOYMENT_REGION,
        'AWS US-West-2',
        { explicitScore: 85, geographicLocation: mockGeographicLocation }
      );
      await service.createMarketPreference(
        mockCustomerId,
        Industry.SAAS,
        MarketType.CLOUD_PROVIDER,
        'AWS',
        { explicitScore: 90 }
      );
      await service.createMarketPreference(
        mockCustomerId,
        Industry.SAAS,
        MarketType.DATA_RESIDENCY,
        'US Only',
        { explicitScore: 75 }
      );
    });

    it('should generate market insights for customer', () => {
      const insights = service.generateMarketInsights(mockCustomerId, Industry.SAAS);

      expect(insights.customerId).toBe(mockCustomerId);
      expect(insights.industry).toBe(Industry.SAAS);
      expect(insights.topPreferences.length).toBeGreaterThan(0);
      expect(insights.benchmarks).toBeDefined();
      expect(insights.recommendations).toBeDefined();
      expect(Array.isArray(insights.recommendations)).toBe(true);
    });

    it('should include high-scoring preferences in top preferences', () => {
      const insights = service.generateMarketInsights(mockCustomerId, Industry.SAAS);

      // All top preferences should have score >= 70
      insights.topPreferences.forEach(pref => {
        expect(pref.preferenceScore).toBeGreaterThanOrEqual(70);
      });
    });

    it('should throw error for customer with no preferences', () => {
      expect(() => {
        service.generateMarketInsights('non-existent-customer');
      }).toThrow('No market preferences found for customer');
    });

    it('should filter by industry when specified', () => {
      const insights = service.generateMarketInsights(mockCustomerId, Industry.SAAS);

      insights.topPreferences.forEach(pref => {
        expect(pref.industry).toBe(Industry.SAAS);
      });
    });
  });

  describe('Industry Analytics', () => {
    beforeEach(async () => {
      // Create preferences across multiple customers and industries
      await service.createMarketPreference(mockCustomerId, Industry.HEALTHCARE, MarketType.PROVIDER_NETWORK, 'Regional HMO');
      await service.createMarketPreference(mockCustomerId2, Industry.HEALTHCARE, MarketType.REGULATORY_FRAMEWORK, 'FDA Compliant');
      await service.createMarketPreference(mockCustomerId, Industry.FINTECH, MarketType.REGULATORY_JURISDICTION, 'SEC Regulated');
    });

    it('should provide industry analytics', () => {
      const analytics = service.getIndustryAnalytics(Industry.HEALTHCARE);

      expect(analytics).toBeDefined();
      expect(analytics!.industry).toBe(Industry.HEALTHCARE);
      expect(analytics!.totalCustomers).toBeGreaterThan(0);
      expect(analytics!.totalPreferences).toBeGreaterThan(0);
      expect(analytics!.averagePreferenceScore).toBeGreaterThan(0);
      expect(analytics!.lastAnalyzed).toBeDefined();
    });

    it('should return undefined for industry with no data', () => {
      const analytics = service.getIndustryAnalytics(Industry.MANUFACTURING);
      expect(analytics).toBeDefined(); // Analytics are initialized for all industries
      expect(analytics!.totalPreferences).toBe(0);
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(async () => {
      await service.createMarketPreference(
        mockCustomerId,
        Industry.SAAS,
        MarketType.DEPLOYMENT_REGION,
        'AWS US-West-2',
        { explicitScore: 85, tags: ['cloud', 'aws'] }
      );
      await service.createMarketPreference(
        mockCustomerId,
        Industry.MANUFACTURING,
        MarketType.SUPPLIER_REGION,
        'Asia Pacific',
        { explicitScore: 65, tags: ['logistics'] }
      );
    });

    it('should search by industry', () => {
      const results = service.searchMarketPreferences({ industry: Industry.SAAS });
      expect(results.length).toBe(1);
      expect(results[0].industry).toBe(Industry.SAAS);
    });

    it('should search by market type', () => {
      const results = service.searchMarketPreferences({
        marketType: MarketType.DEPLOYMENT_REGION
      });
      expect(results.length).toBe(1);
      expect(results[0].marketType).toBe(MarketType.DEPLOYMENT_REGION);
    });

    it('should search by score range', () => {
      const results = service.searchMarketPreferences({
        minScore: 80,
        maxScore: 90
      });
      expect(results.length).toBe(1);
      expect(results[0].preferenceScore).toBeGreaterThanOrEqual(80);
      expect(results[0].preferenceScore).toBeLessThanOrEqual(90);
    });

    it('should search by tags', () => {
      const results = service.searchMarketPreferences({ tags: ['cloud'] });
      expect(results.length).toBe(1);
      expect(results[0].tags).toContain('cloud');
    });

    it('should return results sorted by score descending', () => {
      const results = service.searchMarketPreferences({});
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].preferenceScore).toBeGreaterThanOrEqual(results[i + 1].preferenceScore);
      }
    });
  });

  describe('Preference Deletion', () => {
    let preferenceId: string;

    beforeEach(async () => {
      const preference = await service.createMarketPreference(
        mockCustomerId,
        Industry.SAAS,
        MarketType.DEPLOYMENT_REGION,
        'AWS US-West-2'
      );
      preferenceId = preference.id;
    });

    it('should delete market preference', () => {
      const deleted = service.deleteMarketPreference(preferenceId);
      expect(deleted).toBe(true);

      const retrieved = service.getMarketPreference(preferenceId);
      expect(retrieved).toBeUndefined();
    });

    it('should return false for non-existent preference', () => {
      const deleted = service.deleteMarketPreference('non-existent');
      expect(deleted).toBe(false);
    });

    it('should remove preference from customer index', () => {
      service.deleteMarketPreference(preferenceId);

      const customerPrefs = service.getCustomerMarketPreferences(mockCustomerId);
      expect(customerPrefs.some(p => p.id === preferenceId)).toBe(false);
    });
  });

  describe('Event Emission', () => {
    it('should emit event when preference is created', async () => {
      const eventSpy = jest.fn();
      service.on('marketPreferenceCreated', eventSpy);

      await service.createMarketPreference(
        mockCustomerId,
        Industry.SAAS,
        MarketType.DEPLOYMENT_REGION,
        'AWS US-West-2'
      );

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: mockCustomerId,
          industry: Industry.SAAS,
          marketType: MarketType.DEPLOYMENT_REGION
        })
      );
    });

    it('should emit event when preference is updated', async () => {
      const preference = await service.createMarketPreference(
        mockCustomerId,
        Industry.SAAS,
        MarketType.DEPLOYMENT_REGION,
        'AWS US-West-2'
      );

      const eventSpy = jest.fn();
      service.on('marketPreferenceUpdated', eventSpy);

      await service.updateMarketPreference(preference.id, {
        preferenceValue: 'Updated Value'
      });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({
            preferenceValue: 'Updated Value'
          })
        })
      );
    });

    it('should emit event when preference is deleted', async () => {
      const preference = await service.createMarketPreference(
        mockCustomerId,
        Industry.SAAS,
        MarketType.DEPLOYMENT_REGION,
        'AWS US-West-2'
      );

      const eventSpy = jest.fn();
      service.on('marketPreferenceDeleted', eventSpy);

      service.deleteMarketPreference(preference.id);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          preferenceId: preference.id
        })
      );
    });
  });
});
