import {
    ConsentData,
    EventData,
    ModuleInterface,
    PageViewData,
    TrackerConfig,
    TrackerInstance,
    VisitorSession
} from '../types';
import {
    deepMerge,
    detectPlatform,
    domReady,
    generateSessionId,
    generateVisitorId,
    getCurrentTitle,
    getCurrentUrl,
    getReferrer,
    getUserAgent,
    isBrowser,
    now
} from '../utils';
import { EventEmitter } from './EventEmitter';
import { Storage } from './Storage';

/**
 * Universal B2B Visitor Tracking System
 * Core tracker implementation with modular architecture
 */
export class Tracker extends EventEmitter implements TrackerInstance {
  public config: TrackerConfig;
  public session: VisitorSession;
  public isInitialized: boolean = false;

  private _storage: Storage;
  private _modules: Map<string, ModuleInterface> = new Map();
  private _eventQueue: EventData[] = [];
  private _flushTimer?: number;
  private _destroyed: boolean = false;

  constructor() {
    super();
    this._storage = new Storage();

    // Default configuration
    this.config = {
      apiUrl: '',
      projectId: '',
      debug: false,
      enableGDPR: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      platform: 'auto'
    };

    // Initialize empty session
    this.session = this._createEmptySession();
  }

  /**
   * Initialize the tracker with configuration
   */
  init(config: TrackerConfig): void {
    if (this.isInitialized) {
      if (this.config.debug) {
        console.warn('Tracker already initialized');
      }
      return;
    }

    // Merge configuration
    this.config = deepMerge(this.config, config);

    // Validate required config
    if (!this.config.apiUrl || !this.config.projectId) {
      throw new Error('apiUrl and projectId are required');
    }

    // Initialize storage with project-specific prefix
    this._storage = new Storage(`opt_${this.config.projectId}_`);

    // Check for existing session or create new one
    this._initializeSession();

    // Start automatic flushing
    this._startFlushTimer();

    // Track initial page view
    if (isBrowser()) {
      domReady(() => {
        this.pageView();
      });
    }

    this.isInitialized = true;
    this.emit('initialized', this.config);

    if (this.config.debug) {
      console.log('Tracker initialized', { config: this.config, session: this.session });
    }
  }

  /**
   * Track a custom event
   */
  track(event: string, data: any = {}): void {
    if (!this.isInitialized) {
      if (this.config.debug) {
        console.warn('Tracker not initialized');
      }
      return;
    }

    if (!this.hasConsent()) {
      if (this.config.debug) {
        console.warn('No consent for tracking');
      }
      return;
    }

    const eventData: EventData = {
      type: 'custom',
      element: event,
      value: data,
      timestamp: now(),
      sessionId: this.session.sessionId,
      visitorId: this.session.visitorId,
      metadata: data
    };

    this._queueEvent(eventData);
    this.emit('track', eventData);

    if (this.config.debug) {
      console.log('Event tracked', eventData);
    }
  }

  /**
   * Identify a visitor
   */
  identify(visitorId: string, traits: Record<string, any> = {}): void {
    if (!this.isInitialized) return;

    // Update session with new visitor ID
    this.session.visitorId = visitorId;
    this._saveSession();

    this.track('identify', { visitorId, traits });
    this.emit('identify', { visitorId, traits });
  }

  /**
   * Track a page view
   */
  pageView(data: Partial<PageViewData> = {}): void {
    if (!this.isInitialized) return;
    if (!this.hasConsent()) return;

    const pageViewData: PageViewData = {
      url: getCurrentUrl(),
      title: getCurrentTitle(),
      timestamp: now(),
      sessionId: this.session.sessionId,
      visitorId: this.session.visitorId,
      referrer: getReferrer(),
      ...data
    };

    // Update session
    this.session.pageViews++;
    this.session.lastActivity = now();
    this._saveSession();

    // Track the page view
    this._queueEvent({
      type: 'pageview' as any,
      element: pageViewData.url,
      value: pageViewData.title,
      timestamp: pageViewData.timestamp,
      sessionId: pageViewData.sessionId,
      visitorId: pageViewData.visitorId,
      metadata: pageViewData
    });

    this.emit('pageview', pageViewData);

    if (this.config.debug) {
      console.log('Page view tracked', pageViewData);
    }
  }

  /**
   * Use a module
   */
  use(module: ModuleInterface): void {
    if (this._modules.has(module.name)) {
      if (this.config.debug) {
        console.warn(`Module ${module.name} already registered`);
      }
      return;
    }

    this._modules.set(module.name, module);

    if (this.isInitialized) {
      module.init();
    }

    this.emit('module:added', module);
  }

  /**
   * Get a module by name
   */
  getModule<T extends ModuleInterface>(name: string): T | null {
    return (this._modules.get(name) as T) || null;
  }

  /**
   * Set GDPR consent
   */
  setConsent(consent: ConsentData): void {
    this._storage.set('consent', JSON.stringify(consent));
    this.emit('consent:changed', consent);

    if (this.config.debug) {
      console.log('Consent updated', consent);
    }
  }

  /**
   * Check if user has given consent
   */
  hasConsent(): boolean {
    if (!this.config.enableGDPR) return true;

    const consentData = this._storage.get('consent');
    if (!consentData) return false;

    try {
      const consent: ConsentData = JSON.parse(consentData);
      return consent.hasConsent && consent.purposes.analytics;
    } catch {
      return false;
    }
  }

  /**
   * Flush queued events immediately
   */
  async flush(): Promise<void> {
    if (this._eventQueue.length === 0) return;

    const events = [...this._eventQueue];
    this._eventQueue = [];

    try {
      // Send events to API (placeholder - will be implemented in network module)
      await this._sendEvents(events);
      this.emit('events:sent', events);
    } catch (error) {
      // Re-queue events on failure
      this._eventQueue.unshift(...events);
      this.emit('events:failed', error);

      if (this.config.debug) {
        console.error('Failed to send events', error);
      }
    }
  }

  /**
   * Destroy the tracker and clean up
   */
  destroy(): void {
    if (this._destroyed) return;

    // Stop flush timer
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
    }

    // Flush remaining events
    this.flush().catch(() => {
      // Ignore errors during destruction
    });

    // Destroy modules
    this._modules.forEach(module => {
      if (module.destroy) {
        module.destroy();
      }
    });
    this._modules.clear();

    // Clear event listeners
    this.removeAllListeners();

    this._destroyed = true;
    this.isInitialized = false;
  }

  /**
   * Initialize or restore session
   */
  private _initializeSession(): void {
    const existingSession = this._storage.get('session');

    if (existingSession) {
      try {
        const sessionData: VisitorSession = JSON.parse(existingSession);

        // Check if session is still valid
        if (now() - sessionData.lastActivity < this.config.sessionTimeout!) {
          this.session = sessionData;
          this.session.lastActivity = now();
          this._saveSession();
          return;
        }
      } catch {
        // Invalid session data, create new session
      }
    }

    // Create new session
    this.session = this._createNewSession();
    this._saveSession();
  }

  /**
   * Create a new session
   */
  private _createNewSession(): VisitorSession {
    const visitorId = this._storage.get('visitorId') || generateVisitorId();
    this._storage.set('visitorId', visitorId);

    return {
      sessionId: generateSessionId(),
      visitorId,
      startTime: now(),
      lastActivity: now(),
      pageViews: 0,
      platform: this.config.platform === 'auto' ? detectPlatform() : this.config.platform!,
      userAgent: getUserAgent(),
      referrer: getReferrer(),
      landingPage: getCurrentUrl()
    };
  }

  /**
   * Create empty session for initialization
   */
  private _createEmptySession(): VisitorSession {
    return {
      sessionId: '',
      visitorId: '',
      startTime: 0,
      lastActivity: 0,
      pageViews: 0,
      platform: '',
      userAgent: '',
      landingPage: ''
    };
  }

  /**
   * Save session to storage
   */
  private _saveSession(): void {
    this._storage.set('session', JSON.stringify(this.session));
  }

  /**
   * Queue an event for sending
   */
  private _queueEvent(event: EventData): void {
    this._eventQueue.push(event);

    // Auto-flush if queue is full
    if (this._eventQueue.length >= this.config.batchSize!) {
      this.flush().catch(() => {
        // Handled in flush method
      });
    }
  }

  /**
   * Start automatic flush timer
   */
  private _startFlushTimer(): void {
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
    }

    this._flushTimer = window.setInterval(() => {
      if (this._eventQueue.length > 0) {
        this.flush().catch(() => {
          // Handled in flush method
        });
      }
    }, this.config.flushInterval);
  }

  /**
   * Send events to API (placeholder)
   */
  private async _sendEvents(events: EventData[]): Promise<void> {
    // This will be implemented by the Network module
    // For now, just simulate success
    if (this.config.debug) {
      console.log('Sending events', events);
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
