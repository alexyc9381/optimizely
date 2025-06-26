import { BehavioralTracker } from '../modules/BehavioralTracker';
import { PerformanceOptimizer } from '../modules/PerformanceOptimizer';
import { TechnologyDetector } from '../modules/TechnologyDetector';
import { WebSocketManager } from '../modules/WebSocketManager';
import {
    ConsentData,
    CoreWebVitalsObserver,
    EventData,
    ModuleInterface,
    PageViewData,
    PerformanceConfig,
    PerformanceMetrics,
    PerformanceOptimizationReport,
    TechStackDetection,
    TrackerConfig,
    TrackerInstance,
    VisitorSession,
    WebSocketConfig,
    WebSocketConnectionState,
    WebSocketMetrics
} from '../types';
import {
    deepMerge,
    domReady,
    getCurrentTitle,
    getCurrentUrl,
    getReferrer,
    isBrowser,
    now
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

    // Initialize and register performance optimization module
    const performanceOptimizer = new PerformanceOptimizer(this.config.performance);
    this.use(performanceOptimizer);

    // Start performance monitoring if enabled
    if (this.config.performance?.enabled !== false) {
      performanceOptimizer.startMonitoring();

      if (this.config.debug) {
        console.log('Performance monitoring started');
      }
    }

    // Initialize and register WebSocket manager if enabled
    if (this.config.websocket?.enabled && isBrowser()) {
      const wsConfig = this.config.websocket;
      const cleanConfig: Partial<WebSocketConfig> = {
        url: wsConfig.url || '',
      };

      // Only add non-undefined values
      if (this.config.debug !== undefined) cleanConfig.debug = this.config.debug;
      if (wsConfig.protocols) cleanConfig.protocols = wsConfig.protocols;
      if (wsConfig.reconnect !== undefined) cleanConfig.reconnect = wsConfig.reconnect;
      if (wsConfig.reconnectInterval) cleanConfig.reconnectInterval = wsConfig.reconnectInterval;
      if (wsConfig.maxReconnectAttempts) cleanConfig.maxReconnectAttempts = wsConfig.maxReconnectAttempts;
      if (wsConfig.heartbeatInterval) cleanConfig.heartbeatInterval = wsConfig.heartbeatInterval;
      if (wsConfig.messageQueueSize) cleanConfig.messageQueueSize = wsConfig.messageQueueSize;
      if (wsConfig.enableCompression !== undefined) cleanConfig.enableCompression = wsConfig.enableCompression;
      if (wsConfig.enableFallback !== undefined) cleanConfig.enableFallback = wsConfig.enableFallback;
      if (wsConfig.fallbackUrl) cleanConfig.fallbackUrl = wsConfig.fallbackUrl;
      if (wsConfig.timeout) cleanConfig.timeout = wsConfig.timeout;

      const webSocketManager = new WebSocketManager(cleanConfig);

      // Set session context for WebSocket messages
      webSocketManager.setSessionContext(this.session.sessionId, this.session.visitorId);

      // Register the module
      this.use(webSocketManager);

      // Auto-connect if enabled
      if (wsConfig.autoConnect && wsConfig.url) {
        try {
          await webSocketManager.connect();
          if (this.config.debug) {
            console.log('WebSocket auto-connected');
          }
        } catch (error) {
          if (this.config.debug) {
            console.warn('WebSocket auto-connect failed:', error);
          }
        }
      }
    }

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
   * Connect to WebSocket server
   */
  async connectWebSocket(): Promise<void> {
    const webSocketManager = this.getModule<WebSocketManager>('WebSocketManager');
    if (!webSocketManager) {
      throw new Error('WebSocket module not initialized');
    }
    return webSocketManager.connect();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnectWebSocket(): void {
    const webSocketManager = this.getModule<WebSocketManager>('WebSocketManager');
    if (webSocketManager) {
      webSocketManager.disconnect();
    }
  }

  /**
   * Send an event via WebSocket
   */
  async sendWebSocketEvent(event: string, data?: any, priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'): Promise<boolean> {
    const webSocketManager = this.getModule<WebSocketManager>('WebSocketManager');
    if (!webSocketManager) {
      return false;
    }
    return webSocketManager.sendEvent(event, data, priority);
  }

  /**
   * Get WebSocket connection state
   */
  getWebSocketState(): WebSocketConnectionState | null {
    const webSocketManager = this.getModule<WebSocketManager>('WebSocketManager');
    return webSocketManager ? webSocketManager.getConnectionState() : null;
  }

  /**
   * Get WebSocket metrics
   */
  getWebSocketMetrics(): WebSocketMetrics | null {
    const wsModule = this.getModule<WebSocketManager>('WebSocketManager');
    if (wsModule) {
      return wsModule.getMetrics();
    }
    return null;
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

  // Enhanced GDPR Methods

  /**
   * Show consent banner
   */
  showConsentBanner(): void {
    const gdprModule = this.getModule<any>('GDPRCompliance');
    if (gdprModule) {
      gdprModule.showConsentBanner();
    } else if (this.config.debug) {
      console.warn('GDPR Compliance module not found');
    }
  }

  /**
   * Hide consent banner
   */
  hideConsentBanner(): void {
    const gdprModule = this.getModule<any>('GDPRCompliance');
    if (gdprModule) {
      gdprModule.hideConsentBanner();
    } else if (this.config.debug) {
      console.warn('GDPR Compliance module not found');
    }
  }

  /**
   * Get GDPR consent details
   */
  getGDPRConsent(): any {
    const gdprModule = this.getModule<any>('GDPRCompliance');
    if (gdprModule) {
      return gdprModule.getConsent();
    }
    return null;
  }

  /**
   * Set GDPR consent
   */
  setGDPRConsent(consent: any): void {
    const gdprModule = this.getModule<any>('GDPRCompliance');
    if (gdprModule) {
      gdprModule.setConsent(consent);
    } else if (this.config.debug) {
      console.warn('GDPR Compliance module not found');
    }
  }

  /**
   * Withdraw consent
   */
  withdrawConsent(category?: string): void {
    const gdprModule = this.getModule<any>('GDPRCompliance');
    if (gdprModule) {
      gdprModule.withdrawConsent(category);
    } else if (this.config.debug) {
      console.warn('GDPR Compliance module not found');
    }
  }

  /**
   * Request data access
   */
  async requestDataAccess(email?: string): Promise<any> {
    const gdprModule = this.getModule<any>('GDPRCompliance');
    if (gdprModule) {
      return gdprModule.requestDataAccess(email);
    }
    throw new Error('GDPR Compliance module not found');
  }

  /**
   * Request data deletion
   */
  async requestDataDeletion(email?: string): Promise<any> {
    const gdprModule = this.getModule<any>('GDPRCompliance');
    if (gdprModule) {
      return gdprModule.requestDataDeletion(email);
    }
    throw new Error('GDPR Compliance module not found');
  }

  /**
   * Request data portability
   */
  async requestDataPortability(email?: string): Promise<any> {
    const gdprModule = this.getModule<any>('GDPRCompliance');
    if (gdprModule) {
      return gdprModule.requestDataPortability(email);
    }
    throw new Error('GDPR Compliance module not found');
  }

  /**
   * Get privacy settings
   */
  getPrivacySettings(): any {
    const gdprModule = this.getModule<any>('GDPRCompliance');
    if (gdprModule) {
      return gdprModule.getPrivacySettings();
    }
    return null;
  }

  /**
   * Set privacy settings
   */
  setPrivacySettings(settings: any): void {
    const gdprModule = this.getModule<any>('GDPRCompliance');
    if (gdprModule) {
      gdprModule.setPrivacySettings(settings);
    } else if (this.config.debug) {
      console.warn('GDPR Compliance module not found');
    }
  }

  /**
   * Check if GDPR compliant
   */
  isGDPRCompliant(): boolean {
    const gdprModule = this.getModule<any>('GDPRCompliance');
    if (gdprModule) {
      return gdprModule.isCompliant();
    }
    return !this.config.enableGDPR; // Compliant if GDPR is disabled
  }

  /**
   * Export user data
   */
  async exportUserData(visitorId?: string): Promise<any> {
    const gdprModule = this.getModule<any>('GDPRCompliance');
    if (gdprModule) {
      return gdprModule.exportUserData(visitorId || this.session.visitorId);
    }
    throw new Error('GDPR Compliance module not found');
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

  // Performance Optimization methods
  configurePerformance(config: Partial<PerformanceConfig>): void {
    const perfModule = this.getModule<PerformanceOptimizer>('PerformanceOptimizer');
    if (perfModule) {
      perfModule.configure(config);
    } else if (this.config.debug) {
      console.warn('PerformanceOptimizer module not found');
    }
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const perfModule = this.getModule<PerformanceOptimizer>('PerformanceOptimizer');
    if (perfModule) {
      return perfModule.getMetrics();
    }
    // Return default metrics if module not found
    return {
      loadTime: 0,
      domReady: 0,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      totalBlockingTime: 0,
      timeToInteractive: 0,
      memoryUsage: {
        used: 0,
        total: 0,
        limit: 0,
      },
      cpuUsage: 0,
      networkStats: {
        requests: 0,
        bytesTransferred: 0,
        averageLatency: 0,
      },
      scriptPerformance: {
        initTime: 0,
        executionTime: 0,
        moduleLoadTimes: {},
      },
    };
  }

  getPerformanceReport(): PerformanceOptimizationReport {
    const perfModule = this.getModule<PerformanceOptimizer>('PerformanceOptimizer');
    if (perfModule) {
      return perfModule.getOptimizationReport();
    }
    // Return default report if module not found
    return {
      timestamp: Date.now(),
      metrics: this.getPerformanceMetrics(),
      thresholds: {
        memory: { warning: 80, critical: 100 },
        cpu: { warning: 70, critical: 90 },
        network: { latency: 500, bandwidth: 1024 * 1024 },
        coreWebVitals: { lcp: 2500, fid: 100, cls: 0.1 },
      },
      violations: [],
      optimizations: [],
      score: 100,
      grade: 'A',
    };
  }

  startPerformanceMonitoring(): void {
    const perfModule = this.getModule<PerformanceOptimizer>('PerformanceOptimizer');
    if (perfModule) {
      perfModule.startMonitoring();
    } else if (this.config.debug) {
      console.warn('PerformanceOptimizer module not found');
    }
  }

  stopPerformanceMonitoring(): void {
    const perfModule = this.getModule<PerformanceOptimizer>('PerformanceOptimizer');
    if (perfModule) {
      perfModule.stopMonitoring();
    } else if (this.config.debug) {
      console.warn('PerformanceOptimizer module not found');
    }
  }

  optimizePerformance(): void {
    const perfModule = this.getModule<PerformanceOptimizer>('PerformanceOptimizer');
    if (perfModule) {
      perfModule.optimizeCoreWebVitals();
    } else if (this.config.debug) {
      console.warn('PerformanceOptimizer module not found');
    }
  }

  async preloadCriticalResources(): Promise<void> {
    const perfModule = this.getModule<PerformanceOptimizer>('PerformanceOptimizer');
    if (perfModule) {
      await perfModule.preloadCriticalResources();
    } else if (this.config.debug) {
      console.warn('PerformanceOptimizer module not found');
    }
  }

  enableLazyLoading(): void {
    const perfModule = this.getModule<PerformanceOptimizer>('PerformanceOptimizer');
    if (perfModule) {
      // Enable lazy loading (already enabled by default in config)
      perfModule.configure({
        lazyLoading: {
          enabled: true,
          threshold: 50 * 1024, // 50KB
          modules: [],
          chunkSize: 100 * 1024, // 100KB
        }
      });
    } else if (this.config.debug) {
      console.warn('PerformanceOptimizer module not found');
    }
  }

  enableCodeSplitting(): void {
    const perfModule = this.getModule<PerformanceOptimizer>('PerformanceOptimizer');
    if (perfModule) {
      // Enable code splitting (already enabled by default in config)
      perfModule.configure({
        codesplitting: {
          enabled: true,
          splitPoints: [],
          dynamicImports: true,
          preloadCritical: true,
        }
      });
    } else if (this.config.debug) {
      console.warn('PerformanceOptimizer module not found');
    }
  }

  async measureCoreWebVitals(): Promise<CoreWebVitalsObserver> {
    const perfModule = this.getModule<PerformanceOptimizer>('PerformanceOptimizer');
    if (perfModule) {
      return await perfModule.measureCoreWebVitals();
    }
    // Return default values if module not found
    return {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
      tbt: 0,
      tti: 0,
    };
  }
}
