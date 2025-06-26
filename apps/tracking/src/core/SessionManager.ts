/**
 * Universal Session Management System
 * Provides robust session tracking with cross-tab synchronization,
 * fingerprinting, and validation for any web platform
 */

import { StorageInterface, VisitorSession } from '../types';
import {
    detectBrowser,
    detectPlatform,
    generateSessionId,
    generateVisitorId,
    getCurrentUrl,
    getReferrer,
    getUserAgent,
    isBrowser,
    now,
    safeJsonParse,
    safeJsonStringify
} from '../utils';

export interface SessionOptions {
  sessionTimeout: number;
  enableCrossTabs: boolean;
  enableFingerprinting: boolean;
  fingerprintElements: FingerprintElement;
  sessionValidation: boolean;
  storagePrefix: string;
  debug?: boolean;
}

export interface FingerprintElement {
  screen: boolean;
  timezone: boolean;
  language: boolean;
  platform: boolean;
  plugins: boolean;
  canvas: boolean;
}

export interface SessionFingerprint {
  screenResolution: string;
  timezone: number;
  language: string;
  platform: string;
  browser: string;
  pluginsHash: string;
  canvasHash?: string;
  hash: string;
}

export interface SessionValidation {
  isValid: boolean;
  reasons: string[];
  fingerprint: SessionFingerprint;
  lastValidated: number;
}

export interface SessionEvent {
  type: 'session:created' | 'session:restored' | 'session:expired' | 'session:invalid' | 'session:synchronized';
  session: VisitorSession;
  timestamp: number;
  tabId: string;
}

export class SessionManager {
  private _storage: StorageInterface;
  private _options: SessionOptions;
  private _currentSession: VisitorSession | null = null;
  private _tabId: string;
  private _fingerprint: SessionFingerprint | null = null;
  private _syncTimer?: number;
  private _heartbeatTimer?: number;
  private _listeners: Map<string, ((event: SessionEvent) => void)[]> = new Map();
  private _destroyed = false;

  // Storage keys
  private readonly SESSION_KEY = 'session';
  private readonly VISITOR_KEY = 'visitor';
  private readonly FINGERPRINT_KEY = 'fingerprint';
  private readonly TABS_KEY = 'active_tabs';
  private readonly HEARTBEAT_KEY = 'heartbeat';

  constructor(storage: StorageInterface, options: Partial<SessionOptions> = {}) {
    this._storage = storage;
    this._options = {
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      enableCrossTabs: true,
      enableFingerprinting: true,
      fingerprintElements: {
        screen: true,
        timezone: true,
        language: true,
        platform: true,
        plugins: true,
        canvas: false // Disabled by default due to privacy concerns
      },
      sessionValidation: true,
      storagePrefix: 'opt_session_',
      ...options
    };

    // Generate unique tab ID
    this._tabId = this._generateTabId();

    // Initialize fingerprinting if enabled
    if (this._options.enableFingerprinting) {
      this._generateFingerprint();
    }

    // Setup cross-tab synchronization
    if (this._options.enableCrossTabs && isBrowser()) {
      this._setupCrossTabSync();
      this._startHeartbeat();
    }
  }

  /**
   * Initialize or restore session
   */
  async initializeSession(): Promise<VisitorSession> {
    try {
      // Try to restore existing session
      const restored = await this._restoreSession();
      if (restored) {
        this._currentSession = restored;
        this._emit('session:restored', restored);
        return restored;
      }

      // Create new session
      const newSession = await this._createNewSession();
      this._currentSession = newSession;
      this._saveSession(newSession);
      this._emit('session:created', newSession);

      return newSession;
    } catch (error) {
      console.error('Session initialization failed:', error);
      // Fallback to basic session
      const fallback = this._createBasicSession();
      this._currentSession = fallback;
      return fallback;
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): VisitorSession | null {
    return this._currentSession;
  }

  /**
   * Update session activity
   */
  updateActivity(): void {
    if (!this._currentSession) return;

    this._currentSession.lastActivity = now();
    this._currentSession.pageViews++;
    this._saveSession(this._currentSession);
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<SessionValidation> {
    if (!this._currentSession) {
      return {
        isValid: false,
        reasons: ['No active session'],
        fingerprint: this._fingerprint!,
        lastValidated: now()
      };
    }

    const reasons: string[] = [];
    let isValid = true;

    // Check session timeout
    const timeSinceActivity = now() - this._currentSession.lastActivity;
    if (timeSinceActivity > this._options.sessionTimeout) {
      isValid = false;
      reasons.push('Session timeout exceeded');
    }

    // Validate fingerprint if enabled
    if (this._options.enableFingerprinting && this._options.sessionValidation) {
      const currentFingerprint = await this._generateFingerprint();
      const storedFingerprint = this._getStoredFingerprint();

      if (storedFingerprint && currentFingerprint.hash !== storedFingerprint.hash) {
        // Allow some flexibility for minor changes
        const criticalMismatch = this._checkCriticalFingerprintMismatch(
          currentFingerprint,
          storedFingerprint
        );

        if (criticalMismatch) {
          isValid = false;
          reasons.push('Session fingerprint validation failed');
        }
      }
    }

    return {
      isValid,
      reasons,
      fingerprint: this._fingerprint!,
      lastValidated: now()
    };
  }

  /**
   * Invalidate current session
   */
  invalidateSession(): void {
    if (this._currentSession) {
      this._emit('session:invalid', this._currentSession);
      this._currentSession = null;
      this._storage.remove(this.SESSION_KEY);
    }
  }

  /**
   * Get session fingerprint
   */
  getFingerprint(): SessionFingerprint | null {
    return this._fingerprint;
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (event: SessionEvent) => void): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (event: SessionEvent) => void): void {
    const listeners = this._listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Destroy session manager
   */
  destroy(): void {
    if (this._destroyed) return;

    // Clear timers
    if (this._syncTimer) {
      clearInterval(this._syncTimer);
    }
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
    }

    // Remove from active tabs
    try {
      this._removeFromActiveTabs();
    } catch (error) {
      // Ignore errors during cleanup
    }

    // Clear listeners
    this._listeners.clear();

    this._destroyed = true;
  }

  // Private methods

  private async _restoreSession(): Promise<VisitorSession | null> {
    try {
      const sessionData = this._storage.get(this.SESSION_KEY);
      if (!sessionData) return null;

      const session = safeJsonParse<VisitorSession | null>(sessionData, null);
      if (!session) return null;

      // Validate session
      const validation = await this._validateStoredSession(session);
      if (!validation.isValid) {
        this._storage.remove(this.SESSION_KEY);
        return null;
      }

      return session;
    } catch (error) {
      // If there's an error reading the session, return null to create a new one
      return null;
    }
  }

  private async _createNewSession(): Promise<VisitorSession> {
    // Get or create visitor ID
    let visitorId: string;
    try {
      visitorId = this._storage.get(this.VISITOR_KEY) || generateVisitorId();
      this._storage.set(this.VISITOR_KEY, visitorId);
    } catch (error) {
      // If storage fails, generate a new visitor ID
      visitorId = generateVisitorId();
    }

    const session: VisitorSession = {
      sessionId: generateSessionId(),
      visitorId,
      startTime: now(),
      lastActivity: now(),
      pageViews: 0,
      platform: detectPlatform(),
      userAgent: getUserAgent(),
      referrer: getReferrer(),
      landingPage: getCurrentUrl()
    };

    // Add to active tabs
    try {
      this._addToActiveTabs();
    } catch (error) {
      // Ignore tab tracking errors
    }

    return session;
  }

  private _createBasicSession(): VisitorSession {
    return {
      sessionId: generateSessionId(),
      visitorId: generateVisitorId(),
      startTime: now(),
      lastActivity: now(),
      pageViews: 0,
      platform: detectPlatform(),
      userAgent: getUserAgent(),
      referrer: getReferrer(),
      landingPage: getCurrentUrl()
    };
  }

  private _saveSession(session: VisitorSession): void {
    try {
      this._storage.set(this.SESSION_KEY, safeJsonStringify(session));
    } catch (error) {
      // If storage fails, continue without saving
      if (this._options.debug) {
        console.warn('Failed to save session:', error);
      }
    }
  }

  private async _generateFingerprint(): Promise<SessionFingerprint> {
    if (!isBrowser()) {
      this._fingerprint = {
        screenResolution: 'unknown',
        timezone: 0,
        language: 'unknown',
        platform: 'server',
        browser: 'unknown',
        pluginsHash: 'unknown',
        hash: 'server-side'
      };
      return this._fingerprint;
    }

    const elements = this._options.fingerprintElements;
    const fingerprint: Partial<SessionFingerprint> = {};

    if (elements.screen) {
      fingerprint.screenResolution = `${screen.width}x${screen.height}`;
    }

    if (elements.timezone) {
      fingerprint.timezone = new Date().getTimezoneOffset();
    }

    if (elements.language) {
      fingerprint.language = navigator.language || 'unknown';
    }

    if (elements.platform) {
      fingerprint.platform = detectPlatform();
      fingerprint.browser = detectBrowser();
    }

    if (elements.plugins) {
      fingerprint.pluginsHash = this._hashPlugins();
    }

    if (elements.canvas) {
      fingerprint.canvasHash = await this._generateCanvasFingerprint();
    }

    // Generate hash from all elements
    const hashString = Object.values(fingerprint).join('|');
    fingerprint.hash = this._simpleHash(hashString).toString();

    this._fingerprint = fingerprint as SessionFingerprint;

    // Store fingerprint
    this._storage.set(this.FINGERPRINT_KEY, safeJsonStringify(this._fingerprint));

    return this._fingerprint;
  }

  private _getStoredFingerprint(): SessionFingerprint | null {
    const stored = this._storage.get(this.FINGERPRINT_KEY);
    return stored ? safeJsonParse<SessionFingerprint | null>(stored, null) : null;
  }

  private _checkCriticalFingerprintMismatch(
    current: SessionFingerprint,
    stored: SessionFingerprint
  ): boolean {
    // Only consider critical mismatches (platform, browser, screen resolution)
    return (
      current.platform !== stored.platform ||
      current.browser !== stored.browser ||
      current.screenResolution !== stored.screenResolution
    );
  }

  private async _validateStoredSession(session: VisitorSession): Promise<SessionValidation> {
    const timeSinceActivity = now() - session.lastActivity;
    const reasons: string[] = [];
    let isValid = true;

    if (timeSinceActivity > this._options.sessionTimeout) {
      isValid = false;
      reasons.push('Session expired');
    }

    return {
      isValid,
      reasons,
      fingerprint: this._fingerprint!,
      lastValidated: now()
    };
  }

  private _setupCrossTabSync(): void {
    if (!isBrowser()) return;

    // Listen for storage changes (cross-tab communication)
    window.addEventListener('storage', (event) => {
      if (event.key === this._getStorageKey(this.SESSION_KEY)) {
        // Session updated in another tab
        this._handleSessionSync(event.newValue);
      }
    });

    // Setup periodic sync check
    this._syncTimer = window.setInterval(() => {
      this._checkTabSync();
    }, 5000); // Check every 5 seconds
  }

  private _startHeartbeat(): void {
    if (!isBrowser()) return;

    this._heartbeatTimer = window.setInterval(() => {
      this._updateHeartbeat();
      this._cleanupInactiveTabs();
    }, 10000); // Heartbeat every 10 seconds
  }

  private _handleSessionSync(newSessionData: string | null): void {
    if (!newSessionData) return;

    const session = safeJsonParse<VisitorSession | null>(newSessionData, null);
    if (session && session.sessionId !== this._currentSession?.sessionId) {
      this._currentSession = session;
      this._emit('session:synchronized', session);
    }
  }

  private _checkTabSync(): void {
    const activeTabs = this._getActiveTabs();
    const currentTime = now();

    // Check if this tab is still the active one
    const thisTab = activeTabs[this._tabId];
    if (!thisTab || currentTime - thisTab.lastHeartbeat > 30000) {
      // This tab might be inactive, refresh session
      this._addToActiveTabs();
    }
  }

  private _updateHeartbeat(): void {
    const heartbeat = {
      tabId: this._tabId,
      timestamp: now(),
      sessionId: this._currentSession?.sessionId || 'unknown'
    };

    this._storage.set(this.HEARTBEAT_KEY, safeJsonStringify(heartbeat));
  }

  private _getActiveTabs(): Record<string, any> {
    try {
      const stored = this._storage.get(this.TABS_KEY);
      return stored ? safeJsonParse(stored, {}) : {};
    } catch (error) {
      // Return empty object if storage fails
      return {};
    }
  }

  private _addToActiveTabs(): void {
    try {
      const activeTabs = this._getActiveTabs();
      activeTabs[this._tabId] = {
        startTime: now(),
        lastHeartbeat: now(),
        sessionId: this._currentSession?.sessionId || 'pending'
      };

      this._storage.set(this.TABS_KEY, safeJsonStringify(activeTabs));
    } catch (error) {
      // Ignore tab tracking errors
    }
  }

  private _removeFromActiveTabs(): void {
    try {
      const activeTabs = this._getActiveTabs();
      delete activeTabs[this._tabId];
      this._storage.set(this.TABS_KEY, safeJsonStringify(activeTabs));
    } catch (error) {
      // Ignore tab cleanup errors
    }
  }

  private _cleanupInactiveTabs(): void {
    const activeTabs = this._getActiveTabs();
    const currentTime = now();
    let hasChanges = false;

    for (const [tabId, tabData] of Object.entries(activeTabs)) {
      if (currentTime - (tabData as any).lastHeartbeat > 60000) { // 1 minute timeout
        delete activeTabs[tabId];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this._storage.set(this.TABS_KEY, safeJsonStringify(activeTabs));
    }
  }

  private _generateTabId(): string {
    return 'tab_' + Math.random().toString(36).substr(2, 9) + '_' + now();
  }

  private _getStorageKey(key: string): string {
    return this._options.storagePrefix + key;
  }

  private _hashPlugins(): string {
    if (!isBrowser() || !navigator.plugins) return 'unknown';

    const plugins = Array.from(navigator.plugins)
      .map(plugin => plugin.name)
      .sort()
      .join('|');

    return this._simpleHash(plugins).toString();
  }

  private async _generateCanvasFingerprint(): Promise<string> {
    if (!isBrowser()) return 'unknown';

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'unknown';

      // Draw a simple pattern
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Fingerprint test 🎨', 2, 2);

      return this._simpleHash(canvas.toDataURL()).toString();
    } catch {
      return 'canvas-blocked';
    }
  }

  private _simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private _emit(type: SessionEvent['type'], session: VisitorSession): void {
    const event: SessionEvent = {
      type,
      session,
      timestamp: now(),
      tabId: this._tabId
    };

    const listeners = this._listeners.get(type) || [];
    listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Session event listener error:', error);
      }
    });
  }
}
