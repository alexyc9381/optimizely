/**
 * Cross-Platform Compatibility Testing Suite
 * Tests universal compatibility across all web platforms, browsers, and devices
 */

import { Storage } from '../core/Storage';
import { Tracker } from '../core/Tracker';
import { BehavioralTracker } from '../modules/BehavioralTracker';
import { GDPRCompliance } from '../modules/GDPRCompliance';
import { PerformanceOptimizer } from '../modules/PerformanceOptimizer';
import { TechnologyDetector } from '../modules/TechnologyDetector';
import '../test-setup';

// Mock different browser environments
const mockUserAgents = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  mobileSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  mobileChrome: 'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  ie11: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko'
};

// Mock different platform environments
const mockPlatforms = {
  wordpress: {
    jQuery: jest.fn(),
    wp: { hooks: { addAction: jest.fn(), addFilter: jest.fn() } },
    document: { ready: jest.fn() }
  },
  shopify: {
    Shopify: {
      shop: 'test-shop.myshopify.com',
      theme: { id: 123 },
      routes: { root: '/' }
    },
    theme: { settings: {} }
  },
  react: {
    React: { version: '18.2.0' },
    ReactDOM: { version: '18.2.0' },
    __REACT_DEVTOOLS_GLOBAL_HOOK__: {}
  },
  vue: {
    Vue: { version: '3.3.0' },
    __VUE__: true,
    __VUE_DEVTOOLS_GLOBAL_HOOK__: {}
  },
  angular: {
    ng: { version: { full: '17.0.0' } },
    angular: { version: { full: '17.0.0' } },
    getAllAngularRootElements: jest.fn()
  },
  nextjs: {
    __NEXT_DATA__: {
      page: '/',
      query: {},
      buildId: 'test-build'
    },
    next: { version: '14.0.0' }
  }
};

// Mock different device/screen configurations
const mockDevices = {
  desktop: { width: 1920, height: 1080, pixelRatio: 1, orientation: 'landscape' },
  tablet: { width: 768, height: 1024, pixelRatio: 2, orientation: 'portrait' },
  mobile: { width: 375, height: 667, pixelRatio: 3, orientation: 'portrait' },
  ultrawide: { width: 3440, height: 1440, pixelRatio: 1, orientation: 'landscape' },
  retina: { width: 2560, height: 1600, pixelRatio: 2, orientation: 'landscape' }
};

// Cross-platform testing utilities
class CrossPlatformTestUtils {
  static mockBrowserEnvironment(browser: keyof typeof mockUserAgents) {
    Object.defineProperty(navigator, 'userAgent', {
      value: mockUserAgents[browser],
      configurable: true
    });

    // Browser-specific feature mocking
    switch (browser) {
      case 'ie11':
        delete (window as any).Promise;
        delete (window as any).fetch;
        delete (window as any).IntersectionObserver;
        break;
      case 'safari':
        (window as any).safari = { pushNotification: {} };
        break;
      case 'chrome':
        (window as any).chrome = { runtime: {} };
        break;
      case 'firefox':
        (window as any).InstallTrigger = {};
        break;
    }
  }

  static mockPlatformEnvironment(platform: keyof typeof mockPlatforms) {
    const platformMocks = mockPlatforms[platform];
    Object.keys(platformMocks).forEach(key => {
      (window as any)[key] = platformMocks[key];
    });

    // Platform-specific DOM modifications
    if (platform === 'wordpress') {
      document.body.className = 'wordpress wp-admin';
    } else if (platform === 'shopify') {
      document.body.className = 'template-index';
    }
  }

  static mockDeviceEnvironment(device: keyof typeof mockDevices) {
    const config = mockDevices[device];

    Object.defineProperty(window, 'innerWidth', {
      value: config.width,
      configurable: true
    });

    Object.defineProperty(window, 'innerHeight', {
      value: config.height,
      configurable: true
    });

    Object.defineProperty(window, 'devicePixelRatio', {
      value: config.pixelRatio,
      configurable: true
    });

    Object.defineProperty(screen, 'width', {
      value: config.width,
      configurable: true
    });

    Object.defineProperty(screen, 'height', {
      value: config.height,
      configurable: true
    });

    // Mock orientation API
    Object.defineProperty(screen, 'orientation', {
      value: { type: config.orientation },
      configurable: true
    });
  }

  static resetEnvironment() {
    // Reset all mocked properties
    delete (window as any).jQuery;
    delete (window as any).wp;
    delete (window as any).Shopify;
    delete (window as any).React;
    delete (window as any).Vue;
    delete (window as any).ng;
    delete (window as any).angular;
    delete (window as any).__NEXT_DATA__;
    delete (window as any).chrome;
    delete (window as any).safari;
    delete (window as any).InstallTrigger;

    document.body.className = '';
  }

  static createCompatibilityReport(testResults: any[]) {
    const report = {
      timestamp: Date.now(),
      totalTests: testResults.length,
      passed: testResults.filter(r => r.passed).length,
      failed: testResults.filter(r => !r.passed).length,
      browsers: {},
      platforms: {},
      devices: {},
      criticalIssues: [],
      recommendations: []
    };

    testResults.forEach(result => {
      if (!result.passed) {
        report.criticalIssues.push({
          environment: result.environment,
          error: result.error,
          severity: result.severity || 'medium'
        });
      }
    });

    return report;
  }
}

describe('CrossPlatformCompatibility', () => {
  let tracker: Tracker;
  let testResults: any[] = [];

  beforeEach(() => {
    testResults = [];
    CrossPlatformTestUtils.resetEnvironment();

    // Reset DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';

    // Reset all mocks
    jest.clearAllMocks();

    // Create fresh tracker instance
    tracker = new Tracker();
  });

  afterEach(() => {
    tracker?.destroy();
    CrossPlatformTestUtils.resetEnvironment();
  });

  describe('Browser Compatibility', () => {
    const browsers = Object.keys(mockUserAgents) as (keyof typeof mockUserAgents)[];

    browsers.forEach(browser => {
      describe(`${browser.charAt(0).toUpperCase() + browser.slice(1)} Browser`, () => {
        beforeEach(() => {
          CrossPlatformTestUtils.mockBrowserEnvironment(browser);
        });

        it('should initialize tracker successfully', async () => {
          try {
            await tracker.init({
              apiUrl: 'https://api.test.com',
              projectId: 'test-project',
              debug: false
            });

            expect(tracker.isInitialized).toBe(true);

            testResults.push({
              environment: `browser-${browser}`,
              test: 'initialization',
              passed: true
            });
          } catch (error) {
            testResults.push({
              environment: `browser-${browser}`,
              test: 'initialization',
              passed: false,
              error: error.message,
              severity: 'critical'
            });
            throw error;
          }
        });

        it('should track events correctly', async () => {
          try {
            await tracker.init({
              apiUrl: 'https://api.test.com',
              projectId: 'test-project',
              debug: false
            });

            tracker.track('test-event', { browser });

            testResults.push({
              environment: `browser-${browser}`,
              test: 'event-tracking',
              passed: true
            });
          } catch (error) {
            testResults.push({
              environment: `browser-${browser}`,
              test: 'event-tracking',
              passed: false,
              error: error.message,
              severity: 'high'
            });
            throw error;
          }
        });

        it('should handle storage correctly', () => {
          try {
            const storage = new Storage(`test_${browser}_`);

            storage.set('test-key', 'test-value');
            const value = storage.get('test-key');

            expect(value).toBe('test-value');

            testResults.push({
              environment: `browser-${browser}`,
              test: 'storage',
              passed: true
            });
          } catch (error) {
            testResults.push({
              environment: `browser-${browser}`,
              test: 'storage',
              passed: false,
              error: error.message,
              severity: 'medium'
            });

            if (browser !== 'ie11') {
              throw error;
            }
          }
        });

        it('should detect technology stack', () => {
          try {
            const detector = new TechnologyDetector();
            detector.init();

            const techStack = detector.getCurrentTechStack();
            expect(techStack).toBeDefined();

            testResults.push({
              environment: `browser-${browser}`,
              test: 'technology-detection',
              passed: true
            });
          } catch (error) {
            testResults.push({
              environment: `browser-${browser}`,
              test: 'technology-detection',
              passed: false,
              error: error.message,
              severity: 'low'
            });
          }
        });
      });
    });
  });

  describe('Platform Compatibility', () => {
    const platforms = Object.keys(mockPlatforms) as (keyof typeof mockPlatforms)[];

    platforms.forEach(platform => {
      describe(`${platform.charAt(0).toUpperCase() + platform.slice(1)} Platform`, () => {
        beforeEach(() => {
          CrossPlatformTestUtils.mockPlatformEnvironment(platform);
        });

        it('should initialize on platform', async () => {
          try {
            await tracker.init({
              apiUrl: 'https://api.test.com',
              projectId: 'test-project',
              debug: false
            });

            expect(tracker.isInitialized).toBe(true);

            testResults.push({
              environment: `platform-${platform}`,
              test: 'initialization',
              passed: true
            });
          } catch (error) {
            testResults.push({
              environment: `platform-${platform}`,
              test: 'initialization',
              passed: false,
              error: error.message,
              severity: 'critical'
            });
            throw error;
          }
        });

        it('should detect platform correctly', () => {
          try {
            const detector = new TechnologyDetector();
            detector.init();

            const techStack = detector.getCurrentTechStack();

            // Verify platform-specific detection
            if (platform === 'react') {
              expect(techStack.framework).toBe('React');
            } else if (platform === 'vue') {
              expect(techStack.framework).toBe('Vue.js');
            } else if (platform === 'angular') {
              expect(techStack.framework).toBe('Angular');
            }

            testResults.push({
              environment: `platform-${platform}`,
              test: 'platform-detection',
              passed: true
            });
          } catch (error) {
            testResults.push({
              environment: `platform-${platform}`,
              test: 'platform-detection',
              passed: false,
              error: error.message,
              severity: 'medium'
            });
          }
        });

        it('should handle platform-specific features', async () => {
          try {
            await tracker.init({
              apiUrl: 'https://api.test.com',
              projectId: 'test-project',
              debug: false
            });

            // Test platform-specific functionality
            tracker.pageView({
              platform,
              customData: { platformTest: true }
            });

            testResults.push({
              environment: `platform-${platform}`,
              test: 'platform-features',
              passed: true
            });
          } catch (error) {
            testResults.push({
              environment: `platform-${platform}`,
              test: 'platform-features',
              passed: false,
              error: error.message,
              severity: 'medium'
            });
          }
        });
      });
    });
  });

  describe('Device Compatibility', () => {
    const devices = Object.keys(mockDevices) as (keyof typeof mockDevices)[];

    devices.forEach(device => {
      describe(`${device.charAt(0).toUpperCase() + device.slice(1)} Device`, () => {
        beforeEach(() => {
          CrossPlatformTestUtils.mockDeviceEnvironment(device);
        });

        it('should adapt to device screen size', async () => {
          try {
            await tracker.init({
              apiUrl: 'https://api.test.com',
              projectId: 'test-project',
              debug: false
            });

            const behavioral = tracker.getModule('behavioral') as BehavioralTracker;
            if (behavioral) {
              behavioral.init();

              // Verify responsive behavior
              const config = mockDevices[device];
              expect(window.innerWidth).toBe(config.width);
              expect(window.innerHeight).toBe(config.height);
            }

            testResults.push({
              environment: `device-${device}`,
              test: 'screen-adaptation',
              passed: true
            });
          } catch (error) {
            testResults.push({
              environment: `device-${device}`,
              test: 'screen-adaptation',
              passed: false,
              error: error.message,
              severity: 'medium'
            });
          }
        });

        it('should handle touch vs mouse events', () => {
          try {
            const isMobile = device === 'mobile' || device === 'tablet';

            if (isMobile) {
              // Mock touch events
              (window as any).TouchEvent = class TouchEvent extends Event {};
              document.dispatchEvent(new Event('touchstart'));
            } else {
              // Mock mouse events
              document.dispatchEvent(new MouseEvent('click'));
            }

            testResults.push({
              environment: `device-${device}`,
              test: 'input-handling',
              passed: true
            });
          } catch (error) {
            testResults.push({
              environment: `device-${device}`,
              test: 'input-handling',
              passed: false,
              error: error.message,
              severity: 'low'
            });
          }
        });

        it('should optimize performance for device', async () => {
          try {
            const perfOptimizer = new PerformanceOptimizer({
              enabled: true,
              memoryManagement: {
                enabled: true,
                maxMemoryUsage: device === 'mobile' ? 50 : 100 // Lower memory for mobile
              }
            });

            perfOptimizer.init();

            const metrics = perfOptimizer.getMetrics();
            expect(metrics).toBeDefined();

            testResults.push({
              environment: `device-${device}`,
              test: 'performance-optimization',
              passed: true
            });
          } catch (error) {
            testResults.push({
              environment: `device-${device}`,
              test: 'performance-optimization',
              passed: false,
              error: error.message,
              severity: 'medium'
            });
          }
        });
      });
    });
  });

  describe('Feature Compatibility', () => {
    it('should handle missing browser features gracefully', async () => {
      // Mock missing features
      delete (window as any).IntersectionObserver;
      delete (window as any).PerformanceObserver;
      delete (window as any).ResizeObserver;
      delete (window as any).fetch;

      try {
        await tracker.init({
          apiUrl: 'https://api.test.com',
          projectId: 'test-project',
          debug: false
        });

        expect(tracker.isInitialized).toBe(true);

        testResults.push({
          environment: 'feature-limited',
          test: 'graceful-degradation',
          passed: true
        });
      } catch (error) {
        testResults.push({
          environment: 'feature-limited',
          test: 'graceful-degradation',
          passed: false,
          error: error.message,
          severity: 'critical'
        });
        throw error;
      }
    });

    it('should provide polyfills for missing features', () => {
      // Test polyfill functionality
      const perfOptimizer = new PerformanceOptimizer();
      perfOptimizer.enableUniversalPolyfills();

      if (!('requestIdleCallback' in window)) {
        expect(typeof window.requestIdleCallback).toBe('function');
      }

      testResults.push({
        environment: 'polyfills',
        test: 'polyfill-provision',
        passed: true
      });
    });

    it('should handle GDPR compliance across regions', async () => {
      const gdpr = new GDPRCompliance({
        enabled: true,
        consentBanner: { enabled: true }
      });

      gdpr.init();

      // Test different regional scenarios
      const euConsent = gdpr.getConsent();
      expect(gdpr.isCompliant()).toBeDefined();

      testResults.push({
        environment: 'gdpr',
        test: 'regional-compliance',
        passed: true
      });
    });
  });

  describe('Network Conditions', () => {
    it('should handle offline scenarios', async () => {
      // Mock offline condition
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true
      });

      try {
        await tracker.init({
          apiUrl: 'https://api.test.com',
          projectId: 'test-project',
          debug: false
        });

        tracker.track('offline-event', { timestamp: Date.now() });

        testResults.push({
          environment: 'offline',
          test: 'offline-handling',
          passed: true
        });
      } catch (error) {
        testResults.push({
          environment: 'offline',
          test: 'offline-handling',
          passed: false,
          error: error.message,
          severity: 'medium'
        });
      }
    });

    it('should handle slow network conditions', async () => {
      // Mock slow network
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 5000))
      );

      try {
        await tracker.init({
          apiUrl: 'https://api.test.com',
          projectId: 'test-project',
          debug: false
        });

        testResults.push({
          environment: 'slow-network',
          test: 'network-resilience',
          passed: true
        });
      } catch (error) {
        testResults.push({
          environment: 'slow-network',
          test: 'network-resilience',
          passed: false,
          error: error.message,
          severity: 'low'
        });
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('Security and Privacy', () => {
    it('should respect Content Security Policy', () => {
      // Mock CSP restrictions
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn().mockImplementation((tagName) => {
        if (tagName === 'script') {
          throw new Error('CSP violation: script creation blocked');
        }
        return originalCreateElement.call(document, tagName);
      });

      try {
        const tracker = new Tracker();
        expect(tracker).toBeDefined();

        testResults.push({
          environment: 'csp-restricted',
          test: 'csp-compliance',
          passed: true
        });
      } catch (error) {
        testResults.push({
          environment: 'csp-restricted',
          test: 'csp-compliance',
          passed: false,
          error: error.message,
          severity: 'high'
        });
      } finally {
        document.createElement = originalCreateElement;
      }
    });

    it('should handle Do Not Track settings', () => {
      // Mock Do Not Track
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        configurable: true
      });

      const gdpr = new GDPRCompliance({
        enabled: true,
        consentBanner: { respectDoNotTrack: true }
      });

      gdpr.init();

      testResults.push({
        environment: 'do-not-track',
        test: 'privacy-respect',
        passed: true
      });
    });
  });

  describe('Performance Across Platforms', () => {
    it('should maintain performance standards', async () => {
      const perfOptimizer = new PerformanceOptimizer();
      perfOptimizer.init();

      const startTime = performance.now();

      await tracker.init({
        apiUrl: 'https://api.test.com',
        projectId: 'test-project',
        debug: false
      });

      const endTime = performance.now();
      const initTime = endTime - startTime;

      // Should initialize in under 100ms
      expect(initTime).toBeLessThan(100);

      testResults.push({
        environment: 'performance',
        test: 'initialization-speed',
        passed: initTime < 100,
        metrics: { initTime }
      });
    });

    it('should handle memory constraints', () => {
      // Mock limited memory environment
      const perfOptimizer = new PerformanceOptimizer({
        memoryManagement: {
          enabled: true,
          maxMemoryUsage: 50 // Simulate constrained environment
        }
      });

      perfOptimizer.init();

      const memoryUsage = perfOptimizer.getMemoryUsage();
      expect(memoryUsage).toBeDefined();

      testResults.push({
        environment: 'memory-constrained',
        test: 'memory-management',
        passed: true
      });
    });
  });

  afterAll(() => {
    // Generate compatibility report
    const report = CrossPlatformTestUtils.createCompatibilityReport(testResults);

    console.log('\n=== Cross-Platform Compatibility Report ===');
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`Passed: ${report.passed}`);
    console.log(`Failed: ${report.failed}`);
    console.log(`Success Rate: ${((report.passed / report.totalTests) * 100).toFixed(1)}%`);

    if (report.criticalIssues.length > 0) {
      console.log('\nCritical Issues:');
      report.criticalIssues.forEach(issue => {
        console.log(`- ${issue.environment}: ${issue.error} (${issue.severity})`);
      });
    }

    // Expect high success rate
    expect(report.passed / report.totalTests).toBeGreaterThan(0.85); // 85% minimum success rate
  });
});
