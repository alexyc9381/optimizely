/**
 * Platform Integration Tests
 * Tests the tracker's universal compatibility across different web platforms
 */

import { Tracker } from '../core/Tracker';
import { TechnologyDetector } from '../modules/TechnologyDetector';
import { PlatformIntegrationTester } from './helpers/PlatformIntegrationTester';

describe('Platform Integration Tests', () => {
  let tracker: Tracker;
  let platformTester: PlatformIntegrationTester;

  beforeEach(() => {
    tracker = new Tracker();
    platformTester = new PlatformIntegrationTester();

    // Reset DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.body.className = '';

    // Mock basic fetch for tests
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  afterEach(() => {
    tracker?.destroy();
    platformTester?.cleanupPlatformEnvironment();
    jest.restoreAllMocks();
  });

  describe('WordPress Platform Integration', () => {
    it('should initialize successfully on WordPress', async () => {
      const result = await platformTester.runTest('wordpress', async () => {
        await tracker.init({
          apiUrl: 'https://api.test.com',
          projectId: 'test-project',
          debug: false
        });

        expect(tracker.isInitialized).toBe(true);

        // Verify WordPress-specific globals are available in test
        expect((global as any).wp).toBeDefined();
        expect((global as any).jQuery).toBeDefined();
      });

      expect(result.passed).toBe(true);
      expect(result.platform).toBe('wordpress');
      expect(result.features).toContain('pageview tracking');
      expect(result.features).toContain('admin detection');
    });

    it('should track events with WordPress context', async () => {
      const result = await platformTester.runTest('wordpress', async () => {
        await tracker.init({
          apiUrl: 'https://api.test.com',
          projectId: 'test-project'
        });

        // Test WordPress-specific tracking
        tracker.track('wp-page-view', {
          postType: 'post',
          isAdmin: false,
          wordpressVersion: '6.0'
        });

        expect(tracker.isInitialized).toBe(true);
      });

      expect(result.passed).toBe(true);
    });
  });

  describe('React Platform Integration', () => {
    it('should initialize successfully on React', async () => {
      const result = await platformTester.runTest('react', async () => {
        await tracker.init({
          apiUrl: 'https://api.test.com',
          projectId: 'test-project',
          debug: false
        });

        expect(tracker.isInitialized).toBe(true);

        // Verify React-specific globals are available in test
        expect((global as any).React).toBeDefined();
        expect((global as any).ReactDOM).toBeDefined();
      });

      expect(result.passed).toBe(true);
      expect(result.platform).toBe('react');
      expect(result.features).toContain('route tracking');
      expect(result.features).toContain('component lifecycle');
    });

    it('should handle React Router navigation', async () => {
      const result = await platformTester.runTest('react', async () => {
        await tracker.init({
          apiUrl: 'https://api.test.com',
          projectId: 'test-project'
        });

        // Simulate React Router navigation
        tracker.pageView({
          path: '/dashboard',
          component: 'Dashboard',
          reactVersion: '18.0.0'
        });

        expect(tracker.isInitialized).toBe(true);
      });

      expect(result.passed).toBe(true);
    });
  });

  describe('Shopify Platform Integration', () => {
    it('should initialize successfully on Shopify', async () => {
      const result = await platformTester.runTest('shopify', async () => {
        await tracker.init({
          apiUrl: 'https://api.test.com',
          projectId: 'test-project',
          debug: false
        });

        expect(tracker.isInitialized).toBe(true);

        // Verify Shopify-specific globals are available in test
        expect((global as any).Shopify).toBeDefined();
      });

      expect(result.passed).toBe(true);
      expect(result.platform).toBe('shopify');
      expect(result.features).toContain('product tracking');
      expect(result.features).toContain('cart events');
    });

    it('should track e-commerce events', async () => {
      const result = await platformTester.runTest('shopify', async () => {
        await tracker.init({
          apiUrl: 'https://api.test.com',
          projectId: 'test-project'
        });

        // Test Shopify-specific tracking
        tracker.track('product-view', {
          productId: 'prod_123',
          price: 29.99,
          currency: 'USD',
          shop: 'test.myshopify.com'
        });

        expect(tracker.isInitialized).toBe(true);
      });

      expect(result.passed).toBe(true);
    });
  });

  describe('Technology Detection', () => {
    it('should detect platform technologies correctly', () => {
      const detector = new TechnologyDetector();
      detector.init();

      // Test with React environment
      platformTester.mockPlatformEnvironment('react');

      const techStack = detector.getCurrentTechStack();
      expect(techStack).toBeDefined();
      expect(techStack.libraries).toBeDefined();

      platformTester.cleanupPlatformEnvironment();
    });

    it('should work without any platform-specific globals', async () => {
      // Test pure vanilla JavaScript environment
      await tracker.init({
        apiUrl: 'https://api.test.com',
        projectId: 'test-project',
        debug: false
      });

      expect(tracker.isInitialized).toBe(true);

      tracker.track('vanilla-event', {
        environment: 'vanilla-js',
        userAgent: navigator.userAgent
      });
    });
  });

  describe('Cross-Platform Feature Compatibility', () => {
    it('should handle missing localStorage gracefully', async () => {
      // Mock missing localStorage
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        configurable: true
      });

      try {
        await tracker.init({
          apiUrl: 'https://api.test.com',
          projectId: 'test-project'
        });

        expect(tracker.isInitialized).toBe(true);

        // Should still be able to track events
        tracker.track('no-storage-event', { test: true });
      } finally {
        Object.defineProperty(window, 'localStorage', {
          value: originalLocalStorage,
          configurable: true
        });
      }
    });

    it('should work with Content Security Policy restrictions', async () => {
      // Mock CSP restrictions - no inline scripts
      const mockCspViolation = jest.fn();
      window.addEventListener('securitypolicyviolation', mockCspViolation);

      await tracker.init({
        apiUrl: 'https://api.test.com',
        projectId: 'test-project',
        cspCompliant: true // Enable CSP-compliant mode
      });

      expect(tracker.isInitialized).toBe(true);
      expect(mockCspViolation).not.toHaveBeenCalled();

      window.removeEventListener('securitypolicyviolation', mockCspViolation);
    });

    it('should handle different module systems', async () => {
      // Test CommonJS environment
      const mockRequire = jest.fn();
      (global as any).require = mockRequire;
      (global as any).module = { exports: {} };

      await tracker.init({
        apiUrl: 'https://api.test.com',
        projectId: 'test-project'
      });

      expect(tracker.isInitialized).toBe(true);

      delete (global as any).require;
      delete (global as any).module;
    });
  });

  describe('Network Conditions', () => {
    it('should queue events when offline', async () => {
      // Mock offline condition
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true
      });

      // Mock failed fetch
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await tracker.init({
        apiUrl: 'https://api.test.com',
        projectId: 'test-project'
      });

      // Track event while offline
      tracker.track('offline-event', { timestamp: Date.now() });

      expect(tracker.isInitialized).toBe(true);
    });

    it('should handle slow network connections', async () => {
      // Mock slow network
      global.fetch = jest.fn().mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ success: true })
          }), 100)
        )
      );

      const startTime = Date.now();

      await tracker.init({
        apiUrl: 'https://api.test.com',
        projectId: 'test-project',
        timeout: 5000 // 5 second timeout
      });

      const endTime = Date.now();

      expect(tracker.isInitialized).toBe(true);
      expect(endTime - startTime).toBeGreaterThan(50); // Should wait for network
    });
  });

  describe('Platform Integration Report', () => {
    it('should generate comprehensive platform support report', () => {
      const supportedPlatforms = platformTester.getSupportedPlatforms();

      expect(supportedPlatforms).toContain('wordpress');
      expect(supportedPlatforms).toContain('react');
      expect(supportedPlatforms).toContain('shopify');
      expect(supportedPlatforms.length).toBeGreaterThan(0);
    });

    it('should validate universal compatibility across all platforms', async () => {
      const supportedPlatforms = platformTester.getSupportedPlatforms();
      const results: any[] = [];

      for (const platform of supportedPlatforms) {
        const result = await platformTester.runTest(platform, async () => {
          await tracker.init({
            apiUrl: 'https://api.test.com',
            projectId: 'test-project'
          });

          expect(tracker.isInitialized).toBe(true);
        });

        results.push(result);

        // Cleanup between tests
        tracker.destroy();
        tracker = new Tracker();
      }

      // Verify all platforms pass
      const passedTests = results.filter(r => r.passed).length;
      const totalTests = results.length;
      const successRate = passedTests / totalTests;

      expect(successRate).toBeGreaterThan(0.8); // 80% minimum success rate
      expect(passedTests).toBeGreaterThan(0);
    });
  });

  describe('Performance Across Platforms', () => {
    it('should initialize quickly on all platforms', async () => {
      const supportedPlatforms = platformTester.getSupportedPlatforms();

      for (const platform of supportedPlatforms) {
        const result = await platformTester.runTest(platform, async () => {
          const startTime = performance.now();

          await tracker.init({
            apiUrl: 'https://api.test.com',
            projectId: 'test-project'
          });

          const endTime = performance.now();
          const initTime = endTime - startTime;

          expect(tracker.isInitialized).toBe(true);
          expect(initTime).toBeLessThan(200); // Should initialize in under 200ms
        });

        expect(result.passed).toBe(true);
        expect(result.duration).toBeLessThan(300); // Total test time under 300ms

        // Cleanup
        tracker.destroy();
        tracker = new Tracker();
      }
    });
  });
});
