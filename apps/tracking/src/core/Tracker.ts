import { BehavioralTracker } from '../modules/BehavioralTracker';
import { TechnologyDetector } from '../modules/TechnologyDetector';
import {
  ConsentData,
  EventData,
  ModuleInterface,
  PageViewData,
  TechStackDetection,
  TrackerConfig,
  TrackerInstance,
  VisitorSession,
} from '../types';
import {
  deepMerge,
  domReady,
  getCurrentTitle,
  getCurrentUrl,
  getReferrer,
  isBrowser,
  now,
} from '../utils';
import { EventEmitter } from './EventEmitter';
import { SessionManager, SessionOptions } from './SessionManager';
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
  private _sessionManager: SessionManager;
  private _modules: Map<string, ModuleInterface> = new Map();
  private _eventQueue: EventData[] = [];
  private _flushTimer?: number;
  private _destroyed: boolean = false;

  constructor() {
    super();
    this._storage = new Storage();
    this._sessionManager = new SessionManager(this._storage);

    // Default configuration
    this.config = {
      apiUrl: '',
      projectId: '',
      debug: false,
      enableGDPR: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      platform: 'auto',
    };

    // Initialize empty session
    this.session = this._createEmptySession();
  }

  /**
   * Initialize the tracker with configuration
   */
  async init(config: TrackerConfig): Promise<void> {
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

    // Initialize session manager with enhanced options
    const sessionOptions: Partial<SessionOptions> = {
      sessionTimeout: this.config.sessionTimeout || 30 * 60 * 1000,
      enableCrossTabs: true,
      enableFingerprinting: true,
      sessionValidation: true,
      storagePrefix: `opt_${this.config.projectId}_session_`,
    };

    this._sessionManager = new SessionManager(this._storage, sessionOptions);

    // Setup session event listeners
    this._sessionManager.on('session:created', event => {
      this.session = event.session;
      this.emit('session:created', event);
      if (this.config.debug) {
        console.log('New session created:', event);
      }
    });

    this._sessionManager.on('session:restored', event => {
      this.session = event.session;
      this.emit('session:restored', event);
      if (this.config.debug) {
        console.log('Session restored:', event);
      }
    });

    this._sessionManager.on('session:synchronized', event => {
      this.session = event.session;
      this.emit('session:synchronized', event);
      if (this.config.debug) {
        console.log('Session synchronized across tabs:', event);
      }
    });

    this._sessionManager.on('session:invalid', event => {
      this.emit('session:invalid', event);
      if (this.config.debug) {
        console.log('Session invalidated:', event);
      }
    });

    // Initialize session using the new session manager
    this.session = await this._sessionManager.initializeSession();

    // Initialize and register behavioral tracking module
    const behavioralTracker = new BehavioralTracker({
      enableClickTracking: true,
      enableScrollTracking: true,
      enableFormTracking: true,
      enableMouseTracking: !!this.config.debug, // Only enable mouse tracking in debug mode
      enableVisibilityTracking: true,
      enablePerformanceTracking: true,
    });

    // Set tracker reference for behavioral tracker
    (behavioralTracker as any).setTracker(this);

    // Register the module
    this.use(behavioralTracker);

    // Initialize and register technology detection module
    const technologyDetector = new TechnologyDetector();
    this.use(technologyDetector);

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
      console.log('Tracker initialized', {
        config: this.config,
        session: this.session,
        fingerprint: this._sessionManager.getFingerprint(),
        modules: Array.from(this._modules.keys()),
      });
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
      metadata: data,
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
    // Session will be automatically saved by SessionManager on next activity update

    this.track('identify', { visitorId, traits });
    this.emit('identify', { visitorId, traits });
  }

  /**
   * Track a page view
   */
  pageView(data: Partial<PageViewData> = {}): void {
    if (!this.isInitialized) return;
    if (!this.hasConsent()) return;

    // Get technology stack for this page
    const techStack = this.getTechnologyStack();

    const pageViewData: PageViewData = {
      url: getCurrentUrl(),
      title: getCurrentTitle(),
      timestamp: now(),
      sessionId: this.session.sessionId,
      visitorId: this.session.visitorId,
      referrer: getReferrer(),
      ...data,
    };

    // Update session activity using session manager
    this._sessionManager.updateActivity();

    // Get updated session after activity update
    this.session = this._sessionManager.getCurrentSession() || this.session;

    // Track the page view with technology stack information
    this._queueEvent({
      type: 'pageview' as any,
      element: pageViewData.url,
      value: pageViewData.title,
      timestamp: pageViewData.timestamp,
      sessionId: pageViewData.sessionId,
      visitorId: pageViewData.visitorId,
      metadata: {
        ...pageViewData,
        techStack,
      },
    });

    this.emit('pageview', { ...pageViewData, techStack });

    if (this.config.debug) {
      console.log('Page view tracked', { ...pageViewData, techStack });
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
   * Get detected technology stack for the current site
   */
  getTechnologyStack(): TechStackDetection {
    const techModule = this.getModule<TechnologyDetector>('TechnologyDetector');
    return techModule ? techModule.getCurrentTechStack() : {};
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

    // Destroy session manager
    this._sessionManager.destroy();

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
      landingPage: '',
    };
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
