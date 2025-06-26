import { UniversalPolyfills } from './utils/polyfills';

// Initialize polyfills for test environment
UniversalPolyfills.init();

// Essential polyfills for test environment

// Promise polyfill for IE11+ compatibility
if (typeof global !== 'undefined' && !global.Promise) {
  class PromisePolyfill {
    private state: 'pending' | 'fulfilled' | 'rejected' = 'pending';
    private value: any;
    private handlers: Array<{ onFulfilled?: (value: any) => any; onRejected?: (reason: any) => any; resolve: (value: any) => void; reject: (reason: any) => void }> = [];

    constructor(executor: (resolve: (value: any) => void, reject: (reason: any) => void) => void) {
      try {
        executor(this.resolve.bind(this), this.reject.bind(this));
      } catch (error) {
        this.reject(error);
      }
    }

    private resolve(value: any): void {
      if (this.state === 'pending') {
        this.state = 'fulfilled';
        this.value = value;
        this.handlers.forEach(handler => this.handle(handler));
        this.handlers = [];
      }
    }

    private reject(reason: any): void {
      if (this.state === 'pending') {
        this.state = 'rejected';
        this.value = reason;
        this.handlers.forEach(handler => this.handle(handler));
        this.handlers = [];
      }
    }

    private handle(handler: any): void {
      if (this.state === 'pending') {
        this.handlers.push(handler);
      } else {
        if (this.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
          try {
            const result = handler.onFulfilled(this.value);
            handler.resolve(result);
          } catch (error) {
            handler.reject(error);
          }
        } else if (this.state === 'rejected' && typeof handler.onRejected === 'function') {
          try {
            const result = handler.onRejected(this.value);
            handler.resolve(result);
          } catch (error) {
            handler.reject(error);
          }
        } else if (this.state === 'fulfilled') {
          handler.resolve(this.value);
        } else {
          handler.reject(this.value);
        }
      }
    }

    then(onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any): PromisePolyfill {
      return new PromisePolyfill((resolve, reject) => {
        this.handle({ onFulfilled, onRejected, resolve, reject });
      });
    }

    catch(onRejected?: (reason: any) => any): PromisePolyfill {
      return this.then(undefined, onRejected);
    }

    static resolve(value: any): PromisePolyfill {
      return new PromisePolyfill(resolve => resolve(value));
    }

    static reject(reason: any): PromisePolyfill {
      return new PromisePolyfill((_, reject) => reject(reason));
    }

    static all(promises: any[]): PromisePolyfill {
      return new PromisePolyfill((resolve, reject) => {
        if (!promises.length) {
          resolve([]);
          return;
        }

        const results: any[] = [];
        let completed = 0;

        promises.forEach((promise, index) => {
          PromisePolyfill.resolve(promise).then(
            (value: any) => {
              results[index] = value;
              completed++;
              if (completed === promises.length) {
                resolve(results);
              }
            },
            reject
          );
        });
      });
    }
  }

  global.Promise = PromisePolyfill as any;
}

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
    timeEnd: () => {}
  };
}
