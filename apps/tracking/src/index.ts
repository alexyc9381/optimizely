import { Tracker } from './core/Tracker';
import { TrackerConfig } from './types';
import { isBrowser } from './utils';

// Export all types and classes
export { EventEmitter } from './core/EventEmitter';
export { Storage } from './core/Storage';
export { Tracker } from './core/Tracker';
export * from './types';
export * from './utils';

// Create global tracker instance
let globalTracker: Tracker | null = null;

/**
 * Initialize the global tracker instance
 */
export function init(config: TrackerConfig): Tracker {
  if (!globalTracker) {
    globalTracker = new Tracker();
  }

  globalTracker.init(config);
  return globalTracker;
}

/**
 * Get the global tracker instance
 */
export function getTracker(): Tracker | null {
  return globalTracker;
}

/**
 * Track an event using the global tracker
 */
export function track(event: string, data?: any): void {
  if (globalTracker) {
    globalTracker.track(event, data);
  }
}

/**
 * Track a page view using the global tracker
 */
export function pageView(data?: any): void {
  if (globalTracker) {
    globalTracker.pageView(data);
  }
}

/**
 * Identify a visitor using the global tracker
 */
export function identify(visitorId: string, traits?: Record<string, any>): void {
  if (globalTracker) {
    globalTracker.identify(visitorId, traits);
  }
}

/**
 * Set GDPR consent using the global tracker
 */
export function setConsent(consent: any): void {
  if (globalTracker) {
    globalTracker.setConsent(consent);
  }
}

/**
 * Create a new tracker instance (for advanced use cases)
 */
export function createTracker(): Tracker {
  return new Tracker();
}

// Auto-initialization for script tag usage
if (isBrowser()) {
  // Check for configuration in global window object
  const globalWindow = window as any;

  if (globalWindow.optimizelyConfig) {
    init(globalWindow.optimizelyConfig);
  }

  // Make tracker available globally for script tag usage
  globalWindow.Optimizely = {
    init,
    getTracker,
    track,
    pageView,
    identify,
    setConsent,
    createTracker,
    Tracker
  };
}

// Default export for convenience
export default {
  init,
  getTracker,
  track,
  pageView,
  identify,
  setConsent,
  createTracker,
  Tracker
};
