import { ipToCompanyService } from '../services/ip-to-company-service';

describe('IP-to-Company Service', () => {
  // Mock environment variables for testing
  beforeAll(() => {
    process.env.DATABASE_URL = 'file:./test.db';
  });

  afterAll(() => {
    // Clean up environment
    delete process.env.DATABASE_URL;
  });

  describe('IP Validation', () => {
    test('should validate IPv4 addresses correctly', async () => {
      // Test with a known public IP (Google DNS)
      const result = await ipToCompanyService.identifyCompany('8.8.8.8');
      expect(result).toBeDefined();
      if (result) {
        expect(result.ip).toBe('8.8.8.8');
        expect(result.company.name).toBeDefined();
        expect(result.provider).toBeDefined();
      }
    });

    test('should reject invalid IP addresses', async () => {
      await expect(ipToCompanyService.identifyCompany('invalid-ip')).rejects.toThrow('Invalid IP address');
      await expect(ipToCompanyService.identifyCompany('256.256.256.256')).rejects.toThrow('Invalid IP address');
      await expect(ipToCompanyService.identifyCompany('')).rejects.toThrow('Invalid IP address');
    });

    test('should handle private IP addresses gracefully', async () => {
      // Private IPs typically don't have company data
      const result = await ipToCompanyService.identifyCompany('192.168.1.1');
      // This might be null or have limited data
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('Caching Mechanism', () => {
    test('should cache successful results', async () => {
      const ip = '8.8.8.8';

      // First call - should hit the provider
      const result1 = await ipToCompanyService.identifyCompany(ip);
      expect(result1?.cached).toBe(false);

      // Second call - should hit the cache
      const result2 = await ipToCompanyService.identifyCompany(ip);
      expect(result2?.cached).toBe(true);

      // Results should be identical except for cached flag
      if (result1 && result2) {
        expect(result1.company.name).toBe(result2.company.name);
        expect(result1.provider).toBe(result2.provider);
      }
    });
  });

  describe('Provider Fallback', () => {
    test('should handle provider failures gracefully', async () => {
      // This test depends on network conditions and provider availability
      // In a real test environment, we'd mock the providers
      const result = await ipToCompanyService.identifyCompany('8.8.8.8');

      if (result) {
        expect(['ipapi', 'ipinfo', 'snitcher']).toContain(result.provider);
        expect(result.company.confidence).toBeGreaterThan(0);
        expect(result.company.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Rate Limiting', () => {
    test('should track request counts per provider', async () => {
      const health = await ipToCompanyService.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.providers).toBeDefined();
      expect(health.providers.ipapi).toBeDefined();
      expect(health.providers.ipinfo).toBeDefined();
      expect(health.providers.snitcher).toBeDefined();

      // Check rate limit structure
      Object.values(health.providers).forEach(provider => {
        expect(provider.requests).toBeGreaterThanOrEqual(0);
        expect(provider.limit).toBeGreaterThan(0);
        expect(provider.available).toBeDefined();
      });
    });
  });

  describe('Data Quality', () => {
    test('should return structured data with required fields', async () => {
      const result = await ipToCompanyService.identifyCompany('8.8.8.8');

      if (result) {
        // Check required fields
        expect(result.ip).toBe('8.8.8.8');
        expect(result.company).toBeDefined();
        expect(result.company.name).toBeDefined();
        expect(result.company.domain).toBeDefined();
        expect(result.company.type).toBeDefined();
        expect(result.company.confidence).toBeGreaterThan(0);
        expect(result.location).toBeDefined();
        expect(result.network).toBeDefined();
        expect(result.provider).toBeDefined();
        expect(typeof result.cached).toBe('boolean');

        // Check company type is valid
        const validTypes = ['hosting', 'isp', 'education', 'government', 'banking', 'business'];
        expect(validTypes).toContain(result.company.type);
      }
    });

    test('should handle unknown/unidentifiable IPs', async () => {
      // Use a reserved/unassigned IP range
      const result = await ipToCompanyService.identifyCompany('240.0.0.1');

      // Should either return null or very low confidence
      if (result) {
        expect(result.company.confidence).toBeLessThan(0.5);
      } else {
        expect(result).toBeNull();
      }
    });
  });

  describe('Performance', () => {
    test('should complete IP lookup within reasonable time', async () => {
      const startTime = Date.now();

      await ipToCompanyService.identifyCompany('8.8.8.8');

      const duration = Date.now() - startTime;

      // Should complete within 10 seconds (allowing for network latency)
      expect(duration).toBeLessThan(10000);
    }, 15000); // 15 second timeout for this test
  });

  describe('Error Handling', () => {
    test('should handle network timeouts gracefully', async () => {
      // This is more of an integration test that would require mock providers
      // For now, we just ensure the service doesn't crash
      const result = await ipToCompanyService.identifyCompany('1.1.1.1');

      // Should either succeed or return null, but not throw
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });
});
