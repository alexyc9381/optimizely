import { EventData, ModuleInterface, TrackerInstance } from '../types';
import { isBrowser, now, throttle } from '../utils';

export interface BehavioralConfig {
  enableClickTracking: boolean;
  enableScrollTracking: boolean;
  enableFormTracking: boolean;
  enableMouseTracking: boolean;
  enableVisibilityTracking: boolean;
  enablePerformanceTracking: boolean;
  scrollThreshold: number; // Percentage threshold for scroll events
  mouseSampleRate: number; // Sample rate for mouse tracking (ms)
  clickSelector: string; // CSS selector for trackable clicks
  formSelector: string; // CSS selector for trackable forms
  excludeSelectors: string[]; // Elements to exclude from tracking
  maxScrollEvents: number; // Maximum scroll events per session
  maxMouseEvents: number; // Maximum mouse events per session
}

export interface ScrollData {
  depth: number;
  maxDepth: number;
  direction: 'up' | 'down';
  speed: number;
  timestamp: number;
}

export interface ClickData {
  element: string;
  tagName: string;
  className: string;
  id: string;
  text: string;
  x: number;
  y: number;
  timestamp: number;
}

export interface FormData {
  formId: string;
  formName: string;
  field: string;
  fieldType: string;
  action: 'focus' | 'blur' | 'change' | 'submit';
  value?: string | undefined;
  timestamp: number;
}

export interface MouseData {
  x: number;
  y: number;
  type: 'move' | 'click' | 'hover';
  element?: string | undefined;
  timestamp: number;
}

export interface VisibilityData {
  element: string;
  visible: boolean;
  duration: number;
  timestamp: number;
}

export interface EngagementMetrics {
  timeOnPage: number;
  scrollDepth: number;
  clickCount: number;
  formInteractions: number;
  mouseMovements: number;
  idleTime: number;
  engagementScore: number;
}

/**
 * Universal Behavioral Tracker Module
 * Tracks user interactions and behavioral patterns across any web platform
 */
export class BehavioralTracker implements ModuleInterface {
  public name = 'behavioral';

  private _tracker: TrackerInstance | null = null;
  private _config: BehavioralConfig;
  private _isActive = false;
  private _startTime = 0;
  private _lastActivity = 0;
  private _scrollEvents = 0;
  private _mouseEvents = 0;
  private _maxScrollDepth = 0;
  private _clickCount = 0;
  private _formInteractions = 0;
  private _mouseMovements = 0;
  private _idleTimer?: number;
  private _visibilityObserver?: IntersectionObserver;
  private _performanceObserver?: PerformanceObserver;

  // Tracked elements for visibility
  private _trackedElements = new Set<Element>();
  private _visibilityTimers = new Map<Element, number>();

  // Event listeners for cleanup
  private _listeners: Array<() => void> = [];

  // Engagement tracking
  private _engagementInterval?: number;
  private _lastScrollTime = 0;

  constructor(config: Partial<BehavioralConfig> = {}) {
    this._config = {
      enableClickTracking: true,
      enableScrollTracking: true,
      enableFormTracking: true,
      enableMouseTracking: true,
      enableVisibilityTracking: true,
      enablePerformanceTracking: true,
      scrollThreshold: 25, // 25% increments
      mouseSampleRate: 100, // 100ms
      clickSelector: 'a, button, [role="button"], input[type="submit"], input[type="button"]',
      formSelector: 'form, input, textarea, select',
      excludeSelectors: ['.tracking-ignore', '[data-tracking="false"]'],
      maxScrollEvents: 100,
      maxMouseEvents: 500,
      ...config
    };
  }

  /**
   * Initialize the behavioral tracker
   */
  init(): void {
    if (!isBrowser()) return;

    this._isActive = true;
    this._startTime = now();
    this._lastActivity = now();

    this._setupEventListeners();
    this._startEngagementTracking();

    if (this._tracker?.config.debug) {
      console.log('BehavioralTracker initialized', this._config);
    }
  }

  /**
   * Set the tracker instance
   */
  setTracker(tracker: TrackerInstance): void {
    this._tracker = tracker;
  }

  /**
   * Setup all event listeners
   */
  private _setupEventListeners(): void {
    if (this._config.enableClickTracking) {
      this._setupClickTracking();
    }

    if (this._config.enableScrollTracking) {
      this._setupScrollTracking();
    }

    if (this._config.enableFormTracking) {
      this._setupFormTracking();
    }

    if (this._config.enableMouseTracking) {
      this._setupMouseTracking();
    }

    if (this._config.enableVisibilityTracking) {
      this._setupVisibilityTracking();
    }

    if (this._config.enablePerformanceTracking) {
      this._setupPerformanceTracking();
    }

    // General activity tracking
    this._setupActivityTracking();
  }

  /**
   * Setup click tracking
   */
  private _setupClickTracking(): void {
    const handleClick = (event: MouseEvent) => {
      if (!this._isActive || !this._tracker) return;

      const target = event.target as Element;
      if (!target || this._isExcluded(target)) return;

      // Check if element matches our selector
      if (!target.matches(this._config.clickSelector)) {
        // Check parent elements up to 3 levels
        let parent = target.parentElement;
        let found = false;
        for (let i = 0; i < 3 && parent; i++) {
          if (parent.matches(this._config.clickSelector)) {
            found = true;
            break;
          }
          parent = parent.parentElement;
        }
        if (!found) return;
      }

      const clickData: ClickData = {
        element: this._getElementSelector(target),
        tagName: target.tagName.toLowerCase(),
        className: target.className,
        id: target.id || '',
        text: this._getElementText(target),
        x: event.clientX,
        y: event.clientY,
        timestamp: now()
      };

      this._trackEvent('click', clickData);
      this._clickCount++;
      this._updateActivity();

      if (this._tracker.config.debug) {
        console.log('Click tracked:', clickData);
      }
    };

    document.addEventListener('click', handleClick, { passive: true });
    this._listeners.push(() => document.removeEventListener('click', handleClick));
  }

  /**
   * Setup scroll tracking
   */
  private _setupScrollTracking(): void {
    let lastScrollTop = 0;

    const handleScroll = throttle(() => {
      if (!this._isActive || !this._tracker || this._scrollEvents >= this._config.maxScrollEvents) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentDepth = Math.round((scrollTop / scrollHeight) * 100);

      // Update max scroll depth
      this._maxScrollDepth = Math.max(this._maxScrollDepth, currentDepth);

      // Only track significant scroll changes
      const depthDifference = Math.abs(currentDepth - Math.round((lastScrollTop / scrollHeight) * 100));
      if (depthDifference < this._config.scrollThreshold) {
        lastScrollTop = scrollTop;
        return;
      }

      const currentTime = now();
      const direction = scrollTop > lastScrollTop ? 'down' : 'up';
      const speed = Math.abs(scrollTop - lastScrollTop) / (currentTime - this._lastScrollTime);

      const scrollData: ScrollData = {
        depth: currentDepth,
        maxDepth: this._maxScrollDepth,
        direction,
        speed,
        timestamp: currentTime
      };

      this._trackEvent('scroll', scrollData);
      this._scrollEvents++;
      this._updateActivity();

      lastScrollTop = scrollTop;
      this._lastScrollTime = currentTime;

      if (this._tracker.config.debug) {
        console.log('Scroll tracked:', scrollData);
      }
    }, 250) as EventListener;

    window.addEventListener('scroll', handleScroll, { passive: true });
    this._listeners.push(() => window.removeEventListener('scroll', handleScroll));
  }

  /**
   * Setup form tracking
   */
  private _setupFormTracking(): void {
    const handleFormEvent = (event: Event, action: FormData['action']) => {
      if (!this._isActive || !this._tracker) return;

      const target = event.target as HTMLElement;
      if (!target || this._isExcluded(target)) return;

      const form = target.closest('form');
      const formData: FormData = {
        formId: form?.id || '',
        formName: form?.getAttribute('name') || '',
        field: this._getElementSelector(target),
        fieldType: (target as HTMLInputElement).type || target.tagName.toLowerCase(),
        action,
        value: action === 'change' ? (target as HTMLInputElement).value?.slice(0, 50) : undefined,
        timestamp: now()
      };

      this._trackEvent('form_interaction', formData);
      this._formInteractions++;
      this._updateActivity();

      if (this._tracker.config.debug) {
        console.log('Form interaction tracked:', formData);
      }
    };

    // Form field events
    const events = ['focus', 'blur', 'change'];
    events.forEach(eventType => {
      const handler = (event: Event) => handleFormEvent(event, eventType as FormData['action']);
      document.addEventListener(eventType, handler, { passive: true });
      this._listeners.push(() => document.removeEventListener(eventType, handler));
    });

    // Form submission
    const handleSubmit = (event: Event) => handleFormEvent(event, 'submit');
    document.addEventListener('submit', handleSubmit, { passive: true });
    this._listeners.push(() => document.removeEventListener('submit', handleSubmit));
  }

  /**
   * Setup mouse tracking
   */
  private _setupMouseTracking(): void {
    const handleMouseMove = throttle((event: MouseEvent) => {
      if (!this._isActive || !this._tracker || this._mouseEvents >= this._config.maxMouseEvents) return;

      const target = event.target as Element;
      const mouseData: MouseData = {
        x: event.clientX,
        y: event.clientY,
        type: 'move',
        element: target ? this._getElementSelector(target) : 'document',
        timestamp: now()
      };

      this._trackEvent('mouse_move', mouseData);
      this._mouseEvents++;
      this._mouseMovements++;
      this._updateActivity();
    }, this._config.mouseSampleRate) as EventListener;

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    this._listeners.push(() => document.removeEventListener('mousemove', handleMouseMove));
  }

  /**
   * Setup visibility tracking using Intersection Observer
   */
  private _setupVisibilityTracking(): void {
    if (!('IntersectionObserver' in window)) return;

    this._visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const element = entry.target;
          const isVisible = entry.isIntersecting;
          const timestamp = now();

          if (isVisible) {
            // Element became visible
            this._visibilityTimers.set(element, timestamp);
          } else {
            // Element became hidden
            const startTime = this._visibilityTimers.get(element);
            if (startTime) {
              const duration = timestamp - startTime;
              const visibilityData: VisibilityData = {
                element: this._getElementSelector(element),
                visible: false,
                duration,
                timestamp
              };

              this._trackEvent('element_visibility', visibilityData);
              this._visibilityTimers.delete(element);

              if (this._tracker?.config.debug) {
                console.log('Element visibility tracked:', visibilityData);
              }
            }
          }
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    // Track important elements
    const importantElements = document.querySelectorAll('[data-track-visibility], .cta, .product, .pricing');
    importantElements.forEach(el => {
      this._visibilityObserver?.observe(el);
      this._trackedElements.add(el);
    });
  }

  /**
   * Setup performance tracking
   */
  private _setupPerformanceTracking(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      this._performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'largest-contentful-paint') {
            this._trackEvent('performance', {
              metric: 'lcp',
              value: entry.startTime,
              timestamp: now()
            });
          } else if (entry.entryType === 'first-input') {
            this._trackEvent('performance', {
              metric: 'fid',
              value: (entry as any).processingStart - entry.startTime,
              timestamp: now()
            });
          } else if (entry.entryType === 'layout-shift') {
            this._trackEvent('performance', {
              metric: 'cls',
              value: (entry as any).value,
              timestamp: now()
            });
          }
        });
      });

      this._performanceObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      if (this._tracker?.config.debug) {
        console.warn('Performance tracking not supported:', error);
      }
    }
  }

  /**
   * Setup general activity tracking
   */
  private _setupActivityTracking(): void {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    const resetIdleTimer = () => {
      if (this._idleTimer) {
        clearTimeout(this._idleTimer);
      }

      this._idleTimer = window.setTimeout(() => {
        this._trackEvent('user_idle', {
          duration: 30000, // 30 seconds
          timestamp: now()
        });
      }, 30000);
    };

    activityEvents.forEach(eventType => {
      document.addEventListener(eventType, resetIdleTimer, { passive: true });
      this._listeners.push(() => document.removeEventListener(eventType, resetIdleTimer));
    });

    resetIdleTimer();
  }

  /**
   * Start engagement tracking
   */
  private _startEngagementTracking(): void {
    this._engagementInterval = window.setInterval(() => {
      if (!this._isActive || !this._tracker) return;

      const metrics = this._calculateEngagementMetrics();
      this._trackEvent('engagement_metrics', metrics);

      if (this._tracker.config.debug) {
        console.log('Engagement metrics:', metrics);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Calculate engagement metrics
   */
  private _calculateEngagementMetrics(): EngagementMetrics {
    const currentTime = now();
    const timeOnPage = currentTime - this._startTime;
    const idleTime = currentTime - this._lastActivity;

    // Calculate engagement score (0-100)
    const scrollWeight = Math.min(this._maxScrollDepth / 100, 1) * 25;
    const clickWeight = Math.min(this._clickCount / 5, 1) * 25;
    const formWeight = Math.min(this._formInteractions / 3, 1) * 25;
    const timeWeight = Math.min(timeOnPage / 60000, 1) * 25; // Time in minutes

    const engagementScore = Math.round(scrollWeight + clickWeight + formWeight + timeWeight);

    return {
      timeOnPage,
      scrollDepth: this._maxScrollDepth,
      clickCount: this._clickCount,
      formInteractions: this._formInteractions,
      mouseMovements: this._mouseMovements,
      idleTime,
      engagementScore
    };
  }

  /**
   * Track an event using the main tracker
   */
  private _trackEvent(type: string, data: any): void {
    if (!this._tracker) return;

    const eventData: EventData = {
      type: type as any,
      element: data.element || type,
      value: data.value || JSON.stringify(data),
      timestamp: data.timestamp || now(),
      sessionId: this._tracker.session.sessionId,
      visitorId: this._tracker.session.visitorId,
      metadata: data
    };

    this._tracker.track(`behavioral:${type}`, eventData);
  }

  /**
   * Update last activity timestamp
   */
  private _updateActivity(): void {
    this._lastActivity = now();
  }

  /**
   * Check if element should be excluded from tracking
   */
  private _isExcluded(element: Element): boolean {
    return this._config.excludeSelectors.some(selector => element.matches(selector));
  }

  /**
   * Get a CSS selector for an element
   */
  private _getElementSelector(element: Element): string {
    if (!element) {
      return 'unknown';
    }

    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }

    if (element.tagName) {
      return element.tagName.toLowerCase();
    }

    return 'unknown';
  }

  /**
   * Get text content of an element
   */
  private _getElementText(element: Element): string {
    const text = element.textContent || (element as HTMLInputElement).value || '';
    return text.trim().slice(0, 100); // Limit to 100 characters
  }

  /**
   * Enable the tracker
   */
  enable(): void {
    this._isActive = true;
  }

  /**
   * Disable the tracker
   */
  disable(): void {
    this._isActive = false;
  }

  /**
   * Destroy the tracker and clean up
   */
  destroy(): void {
    this._isActive = false;

    // Clear timers
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
    }
    if (this._engagementInterval) {
      clearInterval(this._engagementInterval);
    }

    // Disconnect observers
    if (this._visibilityObserver) {
      this._visibilityObserver.disconnect();
    }
    if (this._performanceObserver) {
      this._performanceObserver.disconnect();
    }

    // Remove all event listeners
    this._listeners.forEach(removeListener => removeListener());
    this._listeners = [];

    // Clear tracking data
    this._trackedElements.clear();
    this._visibilityTimers.clear();

    if (this._tracker?.config.debug) {
      console.log('BehavioralTracker destroyed');
    }
  }

  /**
   * Get current engagement metrics
   */
  getEngagementMetrics(): EngagementMetrics {
    return this._calculateEngagementMetrics();
  }

  /**
   * Track a custom behavioral event
   */
  trackCustomEvent(type: string, data: any): void {
    this._trackEvent(type, data);
  }
}
