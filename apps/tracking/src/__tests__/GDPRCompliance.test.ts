// Mock the isBrowser function to return true in tests
jest.mock('../utils', () => {
  const originalUtils = jest.requireActual('../utils');
  return {
    ...originalUtils,
    isBrowser: () => true,
  };
});

import { GDPRCompliance } from '../modules/GDPRCompliance';
import {
    GDPRConfig,
    GDPRConsent,
    PrivacySettings
} from '../types';

// Mock browser environment
const mockStorage = {
  data: new Map<string, string>(),
  getItem: jest.fn((key: string) => mockStorage.data.get(key) || null),
  setItem: jest.fn((key: string, value: string) => { mockStorage.data.set(key, value); }),
  removeItem: jest.fn((key: string) => { mockStorage.data.delete(key); }),
  clear: jest.fn(() => { mockStorage.data.clear(); }),
  length: 0,
  key: jest.fn(),
};

// Mock DOM
const mockDocument = {
  createElement: jest.fn(() => ({
    innerHTML: '',
    style: {},
    classList: {
      contains: jest.fn(),
      add: jest.fn(),
      remove: jest.fn(),
    },
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    remove: jest.fn(),
  })),
  body: {
    appendChild: jest.fn(),
  },
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  cookie: '',
};

const mockWindow = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: { hostname: 'example.com' },
};

const mockNavigator = {
  doNotTrack: '0',
  userAgent: 'test-agent',
  language: 'en-US',
};

// Setup global mocks
(global as any).localStorage = mockStorage;
(global as any).document = mockDocument;
(global as any).window = mockWindow;
(global as any).navigator = mockNavigator;
(global as any).Intl = {
  DateTimeFormat: () => ({
    resolvedOptions: () => ({ timeZone: 'America/New_York' }),
  }),
};

describe('GDPRCompliance', () => {
  let gdprCompliance: GDPRCompliance;
  let mockConfig: Partial<GDPRConfig>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    mockStorage.data.clear();

    // Reset Do Not Track setting to default
    mockNavigator.doNotTrack = '0';
    (global as any).window.doNotTrack = '0';

    mockConfig = {
      enabled: true,
      consentBanner: {
        enabled: true,
        position: 'bottom',
        theme: 'light',
      },
      dataRetention: {
        defaultDays: 365,
        automaticDeletion: true,
      },
      userRights: {
        enableDataAccess: true,
        enableDataDeletion: true,
        enableDataPortability: true,
        enableOptOut: true,
      },
      privacyByDesign: {
        dataMinimization: true,
        purposeLimitation: true,
        storageMinimization: true,
        autoAnonymization: true,
      },
    };

    gdprCompliance = new GDPRCompliance(mockConfig, mockStorage as any);
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      const gdpr = new GDPRCompliance();
      expect(gdpr.name).toBe('GDPRCompliance');
    });

    test('should initialize with custom configuration', () => {
      expect(gdprCompliance.name).toBe('GDPRCompliance');
    });

    test('should load stored consent on init', () => {
      const storedConsent: GDPRConsent = {
        id: 'test-consent',
        hasConsent: true,
        timestamp: Date.now(),
        version: '1.0',
        method: 'banner',
        categories: { analytics: true, marketing: false },
        legalBasis: {},
        purposes: {
          analytics: true,
          marketing: false,
          functional: true,
        },
      };

      mockStorage.setItem('gdpr_consent', JSON.stringify(storedConsent));

      gdprCompliance.init();

      const consent = gdprCompliance.getConsent();
      expect(consent).toEqual(storedConsent);
    });

    test('should respect Do Not Track setting', () => {
      // Set Do Not Track BEFORE init
      mockNavigator.doNotTrack = '1';
      // Ensure global navigator reflects the change
      (global as any).navigator = mockNavigator;
      // Also set on window for good measure (some implementations check window.doNotTrack)
      (global as any).window.doNotTrack = '1';

      const eventSpy = jest.fn();
      gdprCompliance.on('consent:do_not_track', eventSpy);

      gdprCompliance.init();

      // Check that the event was emitted
      expect(eventSpy).toHaveBeenCalled();

      // Also check that consent was set appropriately
      const consent = gdprCompliance.getConsent();
      expect(consent?.hasConsent).toBe(false);
      expect(consent?.method).toBe('implied');
    });
  });

  describe('Consent Management', () => {
    beforeEach(() => {
      gdprCompliance.init();
    });

    test('should set consent with all required fields', () => {
      const consent: Partial<GDPRConsent> = {
        hasConsent: true,
        categories: {
          analytics: true,
          marketing: false,
          necessary: true,
        },
      };

      const eventSpy = jest.fn();
      gdprCompliance.on('consent:updated', eventSpy);

      gdprCompliance.setConsent(consent);

      const storedConsent = gdprCompliance.getConsent();
      expect(storedConsent).toMatchObject(consent);
      expect(storedConsent?.id).toBeDefined();
      expect(storedConsent?.timestamp).toBeDefined();
      expect(eventSpy).toHaveBeenCalledWith(storedConsent);
    });

    test('should withdraw consent completely', () => {
      // First set consent
      gdprCompliance.setConsent({
        hasConsent: true,
        categories: { analytics: true, marketing: true },
      });

      const eventSpy = jest.fn();
      gdprCompliance.on('consent:withdrawn', eventSpy);

      // Then withdraw it
      gdprCompliance.withdrawConsent();

      const consent = gdprCompliance.getConsent();
      expect(consent?.hasConsent).toBe(false);
      expect(consent?.withdrawalDate).toBeDefined();
      expect(consent?.purposes.analytics).toBe(false);
      expect(consent?.purposes.marketing).toBe(false);
      expect(consent?.purposes.functional).toBe(true); // Should remain true
      expect(eventSpy).toHaveBeenCalled();
    });

    test('should withdraw specific category consent', () => {
      // First set consent
      gdprCompliance.setConsent({
        hasConsent: true,
        categories: { analytics: true, marketing: true },
      });

      // Withdraw only marketing consent
      gdprCompliance.withdrawConsent('marketing');

      const consent = gdprCompliance.getConsent();
      expect(consent?.categories.marketing).toBe(false);
      expect(consent?.categories.analytics).toBe(true);
      expect(consent?.purposes.marketing).toBe(false);
      expect(consent?.purposes.analytics).toBe(true);
    });

    test('should renew consent when required', () => {
      gdprCompliance.setConsent({ hasConsent: true });

      const eventSpy = jest.fn();
      gdprCompliance.on('consent:renewal_required', eventSpy);

      gdprCompliance.renewConsent();

      const consent = gdprCompliance.getConsent();
      expect(consent?.renewalRequired).toBe(true);
      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('Cookie Management', () => {
    beforeEach(() => {
      gdprCompliance.init();
    });

    test('should get default cookie categories', () => {
      const categories = gdprCompliance.getCookieCategories();

      expect(categories).toHaveLength(3);
      expect(categories[0].id).toBe('necessary');
      expect(categories[0].required).toBe(true);
      expect(categories[1].id).toBe('analytics');
      expect(categories[1].required).toBe(false);
      expect(categories[2].id).toBe('marketing');
      expect(categories[2].required).toBe(false);
    });

    test('should enable/disable cookie categories', () => {
      const eventSpy = jest.fn();
      gdprCompliance.on('cookie:category_changed', eventSpy);

      gdprCompliance.setCookieCategory('analytics', true);

      const categories = gdprCompliance.getCookieCategories();
      const analyticsCategory = categories.find(c => c.id === 'analytics');
      expect(analyticsCategory?.enabled).toBe(true);
      expect(eventSpy).toHaveBeenCalledWith({
        categoryId: 'analytics',
        enabled: true,
      });
    });

    test('should not disable required categories', () => {
      gdprCompliance.setCookieCategory('necessary', false);

      const categories = gdprCompliance.getCookieCategories();
      const necessaryCategory = categories.find(c => c.id === 'necessary');
      expect(necessaryCategory?.enabled).toBe(true); // Should remain enabled
    });

    test('should clear cookies for specific categories', () => {
      const eventSpy = jest.fn();
      gdprCompliance.on('cookies:cleared', eventSpy);

      gdprCompliance.clearCookies('analytics');

      expect(eventSpy).toHaveBeenCalledWith({ category: 'analytics' });
    });
  });

  describe('Data Subject Rights', () => {
    beforeEach(() => {
      gdprCompliance.init();
    });

    test('should request data access', async () => {
      const eventSpy = jest.fn();
      gdprCompliance.on('data:access_requested', eventSpy);

      const request = await gdprCompliance.requestDataAccess('test@example.com');

      expect(request.type).toBe('access');
      expect(request.id).toBeDefined();
      expect(request.timestamp).toBeDefined();
      expect(request.status).toBe('pending');
      expect(request.expiresAt).toBeDefined();
      expect(eventSpy).toHaveBeenCalledWith(request);
    });

    test('should request data deletion', async () => {
      const eventSpy = jest.fn();
      gdprCompliance.on('data:deletion_requested', eventSpy);

      const request = await gdprCompliance.requestDataDeletion('test@example.com');

      expect(request.type).toBe('deletion');
      expect(request.status).toBe('pending');
      expect(eventSpy).toHaveBeenCalledWith(request);
    });

    test('should request data portability', async () => {
      const eventSpy = jest.fn();
      gdprCompliance.on('data:portability_requested', eventSpy);

      const request = await gdprCompliance.requestDataPortability('test@example.com');

      expect(request.type).toBe('portability');
      expect(request.status).toBe('pending');
      expect(eventSpy).toHaveBeenCalledWith(request);
    });

    test('should handle requests without email', async () => {
      const request = await gdprCompliance.requestDataAccess();
      expect(request.email).toBeUndefined();
    });

    test('should throw error when data rights are disabled', async () => {
      const gdpr = new GDPRCompliance({
        userRights: {
          enableDataAccess: false,
          enableDataDeletion: true,
          enableDataPortability: true,
          enableOptOut: true,
        },
      });

      await expect(gdpr.requestDataAccess()).rejects.toThrow(
        'Data access requests are not enabled'
      );
    });
  });

  describe('Privacy Settings', () => {
    beforeEach(() => {
      gdprCompliance.init();
    });

    test('should get default privacy settings', () => {
      const settings = gdprCompliance.getPrivacySettings();

      expect(settings.dataMinimization).toBe(true);
      expect(settings.anonymizeIPs).toBe(true);
      expect(settings.respectDoNotTrack).toBe(true);
      expect(settings.automaticDeletion).toBe(true);
    });

    test('should update privacy settings', () => {
      const eventSpy = jest.fn();
      gdprCompliance.on('privacy:settings_updated', eventSpy);

      const newSettings: Partial<PrivacySettings> = {
        dataMinimization: false,
        anonymizeIPs: false,
      };

      gdprCompliance.setPrivacySettings(newSettings);

      const settings = gdprCompliance.getPrivacySettings();
      expect(settings.dataMinimization).toBe(false);
      expect(settings.anonymizeIPs).toBe(false);
      expect(eventSpy).toHaveBeenCalledWith(settings);
    });

    test('should anonymize data when data minimization is enabled', () => {
      const testData = {
        email: 'test@example.com',
        ip: '192.168.1.1',
        name: 'John Doe',
        userId: '12345',
      };

      const anonymized = gdprCompliance.anonymizeData(testData);

      expect(anonymized.email).toBeUndefined();
      expect(anonymized.name).toBeUndefined();
      expect(anonymized.ip).toBe('192.168.1.0'); // IP should be anonymized
      expect(anonymized.userId).toBe('12345'); // Non-PII should remain
    });

    test('should not anonymize data when data minimization is disabled', () => {
      gdprCompliance.setPrivacySettings({ dataMinimization: false });

      const testData = {
        email: 'test@example.com',
        name: 'John Doe',
      };

      const result = gdprCompliance.anonymizeData(testData);
      expect(result).toEqual(testData);
    });
  });

  describe('Compliance Checking', () => {
    beforeEach(() => {
      gdprCompliance.init();
    });

    test('should be compliant with valid consent', () => {
      gdprCompliance.setConsent({
        hasConsent: true,
        categories: { analytics: true },
      });

      expect(gdprCompliance.isCompliant()).toBe(true);
    });

    test('should be non-compliant without consent when required', () => {
      expect(gdprCompliance.isCompliant()).toBe(false);
    });

    test('should generate compliance report', () => {
      gdprCompliance.setConsent({
        hasConsent: true,
        categories: {
          necessary: true,
          analytics: true,
          marketing: false,
        },
      });

      // Set cookie categories to match consent
      gdprCompliance.setCookieCategory('analytics', true);
      gdprCompliance.setCookieCategory('marketing', false);

      const report = gdprCompliance.getComplianceReport();

      expect(report.timestamp).toBeDefined();
      expect(report.consentStatus).toBe('valid');
      expect(report.dataRetentionCompliance).toBe(true);
      expect(report.cookieCompliance).toBe(true);
      expect(report.issues).toHaveLength(0);
    });

    test('should identify compliance issues', () => {
      const report = gdprCompliance.getComplianceReport();

      expect(report.consentStatus).toBe('missing');
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.issues).toContain('No consent record found');
    });
  });

  describe('Data Management', () => {
    beforeEach(() => {
      gdprCompliance.init();
    });

    test('should export user data', async () => {
      const export_data = await gdprCompliance.exportUserData('test-visitor-id');

      expect(export_data.visitorId).toBe('test-visitor-id');
      expect(export_data.exportDate).toBeDefined();
      expect(export_data.format).toBe('json');
      expect(Array.isArray(export_data.sessions)).toBe(true);
      expect(Array.isArray(export_data.events)).toBe(true);
      expect(Array.isArray(export_data.pageViews)).toBe(true);
      expect(Array.isArray(export_data.consent)).toBe(true);
    });

    test('should delete user data', async () => {
      const eventSpy = jest.fn();
      gdprCompliance.on('data:deleted', eventSpy);

      // Set some test data
      gdprCompliance.setConsent({ hasConsent: true });

      const result = await gdprCompliance.deleteUserData('test-visitor-id');

      expect(result).toBe(true);
      expect(eventSpy).toHaveBeenCalledWith({ visitorId: 'test-visitor-id' });
    });

    test('should handle deletion errors gracefully', async () => {
      const eventSpy = jest.fn();
      gdprCompliance.on('data:deletion_failed', eventSpy);

      // Mock storage error
      mockStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const result = await gdprCompliance.deleteUserData('test-visitor-id');

      expect(result).toBe(false);
      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('Banner Management', () => {
    beforeEach(() => {
      gdprCompliance.init();
    });

    test('should show consent banner', () => {
      const eventSpy = jest.fn();
      gdprCompliance.on('banner:shown', eventSpy);

      // Clear any existing banner element to test banner creation
      (gdprCompliance as any)._bannerElement = null;

      // Spy on document.createElement directly
      const createElementSpy = jest.spyOn(document, 'createElement');
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');

      gdprCompliance.showConsentBanner();

      expect(createElementSpy).toHaveBeenCalledWith('div');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(eventSpy).toHaveBeenCalled();

      // Clean up spies
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
    });

    test('should hide consent banner', () => {
      const eventSpy = jest.fn();
      gdprCompliance.on('banner:hidden', eventSpy);

      // First show the banner
      gdprCompliance.showConsentBanner();

      // Then hide it
      gdprCompliance.hideConsentBanner();

      expect(eventSpy).toHaveBeenCalled();
    });

    test('should not show banner if consent exists', () => {
      // Set valid consent first
      gdprCompliance.setConsent({ hasConsent: true });

      const createElementSpy = jest.spyOn(mockDocument, 'createElement');

      gdprCompliance.init(); // Re-init to trigger banner check

      expect(createElementSpy).not.toHaveBeenCalled();
    });

    test('should emit customize event when customize button is clicked', () => {
      const eventSpy = jest.fn();
      gdprCompliance.on('banner:customize_requested', eventSpy);

      // Mock the customize button click
      const mockElement = {
        querySelector: jest.fn((selector) => {
          if (selector === '.gdpr-btn-customize') {
            return {
              addEventListener: jest.fn((event, handler) => {
                if (event === 'click') {
                  // Simulate click
                  setTimeout(() => handler(), 0);
                }
              }),
            };
          }
          return null;
        }),
        innerHTML: '',
        style: {},
        classList: {
          contains: jest.fn(),
          add: jest.fn(),
          remove: jest.fn(),
        },
        querySelectorAll: jest.fn(() => []),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        remove: jest.fn(),
      };

      mockDocument.createElement.mockReturnValueOnce(mockElement);

      gdprCompliance.showConsentBanner();

      // Wait for async event
      setTimeout(() => {
        expect(eventSpy).toHaveBeenCalledWith(gdprCompliance.getCookieCategories());
      }, 10);
    });
  });

  describe('Module Lifecycle', () => {
    test('should initialize and emit events', () => {
      const eventSpy = jest.fn();
      gdprCompliance.on('gdpr:initialized', eventSpy);

      gdprCompliance.init();

      expect(eventSpy).toHaveBeenCalled();
    });

    test('should destroy cleanly', () => {
      const eventSpy = jest.fn();
      gdprCompliance.on('gdpr:destroyed', eventSpy);

      gdprCompliance.init();
      gdprCompliance.destroy();

      expect(eventSpy).toHaveBeenCalled();
    });

    test('should not initialize twice', () => {
      const eventSpy = jest.fn();
      gdprCompliance.on('gdpr:initialized', eventSpy);

      gdprCompliance.init();
      gdprCompliance.init(); // Second init should be ignored

      expect(eventSpy).toHaveBeenCalledTimes(1);
    });

    test('should skip initialization when disabled', () => {
      const gdpr = new GDPRCompliance({ enabled: false });
      const eventSpy = jest.fn();
      gdpr.on('gdpr:initialized', eventSpy);

      gdpr.init();

      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle malformed stored consent', () => {
      mockStorage.setItem('gdpr_consent', 'invalid-json');

      gdprCompliance.init();

      const consent = gdprCompliance.getConsent();
      expect(consent).toBeNull();
    });

    test('should handle consent expiry', () => {
      const expiredConsent: GDPRConsent = {
        id: 'expired-consent',
        hasConsent: true,
        timestamp: Date.now() - (366 * 24 * 60 * 60 * 1000), // Over 1 year ago
        version: '1.0',
        method: 'banner',
        categories: {},
        legalBasis: {},
        purposes: {
          analytics: true,
          marketing: false,
          functional: true,
        },
      };

      mockStorage.setItem('gdpr_consent', JSON.stringify(expiredConsent));
      gdprCompliance.init();

      const report = gdprCompliance.getComplianceReport();
      expect(report.consentStatus).toBe('expired');
    });

    test('should handle server-side environment gracefully', () => {
      // Mock server environment
      (global as any).window = undefined;
      (global as any).document = undefined;

      const gdpr = new GDPRCompliance();
      gdpr.init();
      gdpr.showConsentBanner(); // Should not throw

      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });
});
