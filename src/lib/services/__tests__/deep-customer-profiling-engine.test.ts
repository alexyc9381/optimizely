import { DeepCustomerProfilingEngine } from '../deep-customer-profiling-engine';
import {
  CustomerProfile,
  BehavioralEvent,
  EventType,
  EventPriority
} from '../../types/customer-analytics';

describe('DeepCustomerProfilingEngine', () => {
  let engine: DeepCustomerProfilingEngine;

  beforeEach(() => {
    // Reset singleton instance for testing
    (DeepCustomerProfilingEngine as any)._instance = null;
    engine = DeepCustomerProfilingEngine.getInstance();
  });

  describe('Basic Functionality', () => {
    it('should return singleton instance', () => {
      const instance1 = DeepCustomerProfilingEngine.getInstance();
      const instance2 = DeepCustomerProfilingEngine.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should build customer profile with basic info', async () => {
      const customerId = 'test-customer-1';
      const basicInfo = {
        customerId,
        companyName: 'Test Company',
        email: 'test@example.com',
        industry: 'Technology'
      };

      const profile = await engine.getCustomerProfile(customerId, basicInfo as any);
      
      expect(profile.customerId).toBe(customerId);
      expect(profile.basicInfo.companyName).toBe('Test Company');
      expect(profile.profileConfidence.overallScore).toBeGreaterThan(0);
    });

    it('should process behavioral events', async () => {
      const customerId = 'event-customer';
      const event: BehavioralEvent = {
        customerId,
        sessionId: 'session_123',
        eventType: EventType.PAGE_VIEW,
        timestamp: new Date().toISOString(),
        page: '/dashboard',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        ipAddress: '192.168.1.1',
        deviceInfo: {
          type: 'desktop',
          os: 'macOS',
          browser: 'Chrome',
          screenResolution: '1920x1080',
          viewportSize: '1600x900'
        },
        priority: EventPriority.MEDIUM,
        properties: {},
        contentEngagement: {
          timeOnPage: 30000,
          scrollDepth: 75,
          clickEvents: 2,
          formInteractions: 0
        }
      };

      await engine.processEvent(event);
      const profile = await engine.getCustomerProfile(customerId);
      
      expect(profile.behavioralProfile.sessionAnalytics.totalSessions).toBeGreaterThan(0);
    });

    it('should calculate intent scores', async () => {
      const customerId = 'intent-customer';
      const highIntentEvent: BehavioralEvent = {
        customerId,
        sessionId: 'session_456',
        eventType: EventType.PRICING_VIEW,
        timestamp: new Date().toISOString(),
        page: '/pricing',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        deviceInfo: {
          type: 'desktop',
          os: 'macOS',
          browser: 'Chrome',
          screenResolution: '1920x1080',
          viewportSize: '1600x900'
        },
        priority: EventPriority.HIGH,
        properties: {},
        contentEngagement: {
          timeOnPage: 120000,
          scrollDepth: 100,
          clickEvents: 5,
          formInteractions: 1
        }
      };

      await engine.processEvent(highIntentEvent);
      const profile = await engine.getCustomerProfile(customerId);
      
      expect(profile.intentSignals.buyingIntent.score).toBeGreaterThan(0.5);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid customer IDs', async () => {
      await expect(engine.getCustomerProfile('')).rejects.toThrow('Customer ID is required');
    });

    it('should handle malformed events', async () => {
      const malformedEvent = {} as BehavioralEvent;
      await expect(engine.processEvent(malformedEvent)).rejects.toThrow();
    });
  });
});
