// @ts-nocheck

// Essential global setup for jsdom environment
if (typeof global !== 'undefined' && typeof window !== 'undefined') {
  // Ensure Promise is available globally in jsdom
  if (typeof Promise !== 'undefined' && !global.Promise) {
    global.Promise = Promise;
  }

  // Ensure window.Promise exists
  if (typeof Promise !== 'undefined' && !(window as any).Promise) {
    (window as any).Promise = Promise;
  }
}

import { UniversalPolyfills } from './utils/polyfills';

// Initialize polyfills for test environment
UniversalPolyfills.init();

// Essential polyfills for test environment

// Skip custom Promise polyfill in test environment since jsdom provides native Promise

// Mock basic browser globals for testing
if (typeof global !== 'undefined') {
  // Performance API mock
  global.performance = global.performance || {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByType: () => [],
    getEntriesByName: () => [],
    clearMarks: () => {},
    clearMeasures: () => {}
  };

  // Navigator mock with memory
  global.navigator = global.navigator || {
    userAgent: 'jest',
    language: 'en-US',
    doNotTrack: '0',
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024,
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 200 * 1024 * 1024
    }
  };

  // Process mock for Node.js memory info
  global.process = global.process || {
    memoryUsage: () => ({
      rss: 100 * 1024 * 1024,
      heapTotal: 100 * 1024 * 1024,
      heapUsed: 50 * 1024 * 1024,
      external: 50 * 1024 * 1024,
      arrayBuffers: 10 * 1024 * 1024
    })
  };

  // Basic observer mocks
  global.IntersectionObserver = global.IntersectionObserver || class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  global.PerformanceObserver = global.PerformanceObserver || class {
    observe() {}
    disconnect() {}
  };

  global.ResizeObserver = global.ResizeObserver || class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Ensure console is available
if (typeof console === 'undefined') {
  global.console = {
    log: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
    trace: () => {},
    group: () => {},
    groupEnd: () => {},
    time: () => {},
    timeEnd: () => {},
    assert: () => {},
    clear: () => {},
    count: () => {},
    countReset: () => {},
    dir: () => {},
    dirxml: () => {},
    table: () => {},
    profile: () => {},
    profileEnd: () => {},
    timeLog: () => {}
  } as Console;
}
