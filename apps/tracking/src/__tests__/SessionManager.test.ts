/**
 * SessionManager Tests
 * Testing the robust universal session management system
 */

import { SessionManager, SessionOptions } from '../core/SessionManager';
import { Storage } from '../core/Storage';

// Create a mock storage that actually persists data
const mockStorageData = new Map<string, string>();

// Mock browser environment
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn((key: string) => mockStorageData.get(key) || null),
    setItem: jest.fn((key: string, value: string) => mockStorageData.set(key, value)),
    removeItem: jest.fn((key: string) => mockStorageData.delete(key)),
    clear: jest.fn(() => mockStorageData.clear()),
  },
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn((key: string) => mockStorageData.get(key) || null),
    setItem: jest.fn((key: string, value: string) => mockStorageData.set(key, value)),
    removeItem: jest.fn((key: string) => mockStorageData.delete(key)),
    clear: jest.fn(() => mockStorageData.clear()),
  },
  writable: true,
});

// Mock screen and navigator
Object.defineProperty(window, 'screen', {
  value: { width: 1920, height: 1080 },
  writable: true,
});

Object.defineProperty(window, 'navigator', {
  value: {
    language: 'en-US',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    plugins: [],
  },
  writable: true,
});

describe('SessionManager', () => {
  let storage: Storage;
  let sessionManager: SessionManager;
  let sessionOptions: Partial<SessionOptions>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageData.clear();
    storage = new Storage('test_');
    sessionOptions = {
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      enableCrossTabs: true,
      enableFingerprinting: true,
      sessionValidation: true,
      storagePrefix: 'test_session_'
    };
    sessionManager = new SessionManager(storage, sessionOptions);
  });

  afterEach(() => {
    sessionManager.destroy();
  });

  describe('Session Creation', () => {
    it('should initialize a new session', async () => {
      const session = await sessionManager.initializeSession();

      expect(session).toBeDefined();
      expect(session.sessionId).toMatch(/^s_/);
      expect(session.visitorId).toMatch(/^v_/);
      expect(session.startTime).toBeGreaterThan(0);
      expect(session.lastActivity).toBeGreaterThan(0);
      expect(session.pageViews).toBe(0);
    });

    it('should create different session IDs for different instances', async () => {
      const session1 = await sessionManager.initializeSession();

      // Create a session manager with completely separate storage instance
      const storage2 = new Storage('test2_');
      const sessionManager2 = new SessionManager(storage2, sessionOptions);
      const session2 = await sessionManager2.initializeSession();

      expect(session1.sessionId).not.toBe(session2.sessionId);

      sessionManager2.destroy();
    });

    it('should emit session:created event', async () => {
      const eventSpy = jest.fn();
      sessionManager.on('session:created', eventSpy);

      await sessionManager.initializeSession();

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0]).toMatchObject({
        type: 'session:created',
        timestamp: expect.any(Number),
        tabId: expect.any(String)
      });
    });
  });

  describe('Session Restoration', () => {
    it('should restore a valid existing session', async () => {
      // First, create a session
      const originalSession = await sessionManager.initializeSession();

      // Create a new session manager with the same storage instance (simulating page reload)
      const newSessionManager = new SessionManager(storage, sessionOptions);
      const restoredSession = await newSessionManager.initializeSession();

      expect(restoredSession.sessionId).toBe(originalSession.sessionId);
      expect(restoredSession.visitorId).toBe(originalSession.visitorId);

      newSessionManager.destroy();
    });

    it('should emit session:restored event when restoring', async () => {
      // Create initial session
      await sessionManager.initializeSession();

      // Create new session manager with the same storage instance (simulating page reload)
      const newSessionManager = new SessionManager(storage, sessionOptions);
      const eventSpy = jest.fn();
      newSessionManager.on('session:restored', eventSpy);

      await newSessionManager.initializeSession();

      expect(eventSpy).toHaveBeenCalledTimes(1);

      newSessionManager.destroy();
    });
  });

  describe('Session Activity', () => {
    it('should update session activity', async () => {
      const session = await sessionManager.initializeSession();
      const originalLastActivity = session.lastActivity;
      const originalPageViews = session.pageViews;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      sessionManager.updateActivity();
      const updatedSession = sessionManager.getCurrentSession();

      expect(updatedSession?.lastActivity).toBeGreaterThan(originalLastActivity);
      expect(updatedSession?.pageViews).toBe(originalPageViews + 1);
    });
  });

  describe('Session Validation', () => {
    it('should validate a current session as valid', async () => {
      await sessionManager.initializeSession();
      const validation = await sessionManager.validateSession();

      expect(validation.isValid).toBe(true);
      expect(validation.reasons).toHaveLength(0);
      expect(validation.fingerprint).toBeDefined();
      expect(validation.lastValidated).toBeGreaterThan(0);
    });

    it('should invalidate expired sessions', async () => {
      // Create session with very short timeout
      const shortTimeoutOptions = {
        ...sessionOptions,
        sessionTimeout: 1 // 1 millisecond
      };

      const shortTimeoutManager = new SessionManager(storage, shortTimeoutOptions);
      await shortTimeoutManager.initializeSession();

      // Wait for session to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      const validation = await shortTimeoutManager.validateSession();

      expect(validation.isValid).toBe(false);
      expect(validation.reasons).toContain('Session timeout exceeded');

      shortTimeoutManager.destroy();
    });

    it('should handle validation when no session exists', async () => {
      const validation = await sessionManager.validateSession();

      expect(validation.isValid).toBe(false);
      expect(validation.reasons).toContain('No active session');
    });
  });

  describe('Session Fingerprinting', () => {
    it('should generate a browser fingerprint', async () => {
      await sessionManager.initializeSession();
      const fingerprint = sessionManager.getFingerprint();

      expect(fingerprint).toBeDefined();
      expect(fingerprint?.screenResolution).toBe('1920x1080');
      expect(fingerprint?.language).toBe('en-US');
      expect(fingerprint?.platform).toBeDefined();
      expect(fingerprint?.browser).toBeDefined();
      expect(fingerprint?.hash).toBeDefined();
    });

    it('should store fingerprint persistently', async () => {
      await sessionManager.initializeSession();
      const originalFingerprint = sessionManager.getFingerprint();

      // Create new session manager
      const newSessionManager = new SessionManager(storage, sessionOptions);
      await newSessionManager.initializeSession();
      const restoredFingerprint = newSessionManager.getFingerprint();

      expect(restoredFingerprint?.hash).toBe(originalFingerprint?.hash);

      newSessionManager.destroy();
    });
  });

  describe('Session Invalidation', () => {
    it('should invalidate current session', async () => {
      const session = await sessionManager.initializeSession();
      const eventSpy = jest.fn();
      sessionManager.on('session:invalid', eventSpy);

      sessionManager.invalidateSession();

      expect(sessionManager.getCurrentSession()).toBeNull();
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'session:invalid',
          session: session
        })
      );
    });
  });

  describe('Cross-Tab Synchronization', () => {
    it('should handle storage events for cross-tab sync', async () => {
      const session = await sessionManager.initializeSession();
      const eventSpy = jest.fn();
      sessionManager.on('session:synchronized', eventSpy);

      // Simulate storage event from another tab
      const storageEvent = new StorageEvent('storage', {
        key: 'test_session_session',
        newValue: JSON.stringify({
          ...session,
          sessionId: 'different_session_id'
        })
      });

      window.dispatchEvent(storageEvent);

      // Give some time for event processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock storage to throw errors
      const mockStorage = {
        get: jest.fn().mockImplementation(() => {
          throw new Error('Storage error');
        }),
        set: jest.fn(),
        remove: jest.fn(),
        clear: jest.fn()
      };

      const errorSessionManager = new SessionManager(mockStorage, sessionOptions);
      const session = await errorSessionManager.initializeSession();

      // Should still create a basic session
      expect(session).toBeDefined();
      expect(session.sessionId).toBeDefined();

      errorSessionManager.destroy();
    });

    it('should handle fingerprinting errors gracefully', async () => {
      // Mock canvas to throw errors
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn().mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          throw new Error('Canvas error');
        }
        return originalCreateElement.call(document, tagName);
      });

      const fingerprintOptions = {
        ...sessionOptions,
        fingerprintElements: {
          screen: true,
          timezone: true,
          language: true,
          platform: true,
          plugins: true,
          canvas: true // Enable canvas fingerprinting
        }
      };

      const canvasSessionManager = new SessionManager(storage, fingerprintOptions);
      await canvasSessionManager.initializeSession();
      const fingerprint = canvasSessionManager.getFingerprint();

      expect(fingerprint).toBeDefined();
      expect(fingerprint?.canvasHash).toBe('canvas-blocked');

      // Restore original createElement
      document.createElement = originalCreateElement;
      canvasSessionManager.destroy();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      sessionManager.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });

    it('should not crash when destroying twice', () => {
      expect(() => {
        sessionManager.destroy();
        sessionManager.destroy();
      }).not.toThrow();
    });
  });
});
