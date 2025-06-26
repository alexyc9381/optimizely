/**
 * Universal Polyfills for Cross-Platform Compatibility
 * Ensures tracker works across all web platforms and browsers
 */

export class UniversalPolyfills {
  private static initialized = false;

  /**
   * Initialize all necessary polyfills for universal compatibility
   */
  static init(): void {
    if (this.initialized) return;

    this.polyfillPromise();
    this.polyfillFetch();
    this.polyfillIntersectionObserver();
    this.polyfillPerformanceObserver();
    this.polyfillRequestIdleCallback();
    this.polyfillCustomEvent();
    this.polyfillAssign();
    this.polyfillArrayIncludes();
    this.polyfillStringIncludes();
    this.polyfillConsole();

    this.initialized = true;
  }

  /**
   * Promise polyfill for IE11 and older browsers
   */
  private static polyfillPromise(): void {
    if (typeof Promise === 'undefined') {
      (window as any).Promise = class PromisePolyfill {
        private state: 'pending' | 'fulfilled' | 'rejected' = 'pending';
        private value: any;
        private handlers: Array<{ onFulfilled?: (value: any) => any; onRejected?: (error: any) => any; resolve: (value: any) => void; reject: (error: any) => void }> = [];

        constructor(executor: (resolve: (value: any) => void, reject: (error: any) => void) => void) {
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

        private reject(error: any): void {
          if (this.state === 'pending') {
            this.state = 'rejected';
            this.value = error;
            this.handlers.forEach(handler => this.handle(handler));
            this.handlers = [];
          }
        }

        private handle(handler: any): void {
          if (this.state === 'pending') {
            this.handlers.push(handler);
          } else {
            if (this.state === 'fulfilled' && handler.onFulfilled) {
              try {
                const result = handler.onFulfilled(this.value);
                handler.resolve(result);
              } catch (error) {
                handler.reject(error);
              }
            } else if (this.state === 'rejected' && handler.onRejected) {
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

        then(onFulfilled?: (value: any) => any, onRejected?: (error: any) => any): PromisePolyfill {
          return new PromisePolyfill((resolve, reject) => {
            this.handle({
              onFulfilled,
              onRejected,
              resolve,
              reject
            });
          });
        }

        catch(onRejected?: (reason: any) => any): Promise<any> {
          return this.then(undefined, onRejected);
        }

        finally(onFinally?: (() => void) | null): Promise<any> {
          return this.then(
            (value: any) => {
              if (onFinally) onFinally();
              return value;
            },
            (reason: any) => {
              if (onFinally) onFinally();
              throw reason;
            }
          );
        }

        readonly [Symbol.toStringTag]: 'Promise' = 'Promise';

        static resolve(value: any): PromisePolyfill {
          return new PromisePolyfill(resolve => resolve(value));
        }

        static reject(error: any): PromisePolyfill {
          return new PromisePolyfill((_, reject) => reject(error));
        }

        static all(promises: PromisePolyfill[]): PromisePolyfill {
          return new PromisePolyfill((resolve, reject) => {
            if (promises.length === 0) {
              resolve([]);
              return;
            }

            let resolvedCount = 0;
            const results: any[] = new Array(promises.length);

            promises.forEach((promise, index) => {
              promise.then(
                value => {
                  results[index] = value;
                  resolvedCount++;
                  if (resolvedCount === promises.length) {
                    resolve(results);
                  }
                },
                reject
              );
            });
          });
        }
      };
    }
  }

  /**
   * Fetch polyfill for older browsers
   */
  private static polyfillFetch(): void {
    if (typeof fetch === 'undefined') {
      (window as any).fetch = function(url: string, options: any = {}): Promise<any> {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const method = options.method || 'GET';

          xhr.open(method, url);

          // Set headers
          if (options.headers) {
            Object.keys(options.headers).forEach(key => {
              xhr.setRequestHeader(key, options.headers[key]);
            });
          }

          xhr.onload = () => {
            const response = {
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Map(),
              json: () => Promise.resolve(JSON.parse(xhr.responseText)),
              text: () => Promise.resolve(xhr.responseText)
            };
            resolve(response);
          };

          xhr.onerror = () => reject(new Error('Network Error'));
          xhr.send(options.body || null);
        });
      };
    }
  }

  /**
   * IntersectionObserver polyfill
   */
  private static polyfillIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      (window as any).IntersectionObserver = class IntersectionObserverPolyfill {
        private callback: (entries: any[]) => void;
        private elements: Set<Element> = new Set();

        constructor(callback: (entries: any[]) => void) {
          this.callback = callback;
        }

        observe(element: Element): void {
          this.elements.add(element);
          // Trigger callback with mock entry
          setTimeout(() => {
            this.callback([{
              target: element,
              isIntersecting: true,
              intersectionRatio: 1
            }]);
          }, 0);
        }

        unobserve(element: Element): void {
          this.elements.delete(element);
        }

        disconnect(): void {
          this.elements.clear();
        }
      };
    }
  }

  /**
   * PerformanceObserver polyfill
   */
  private static polyfillPerformanceObserver(): void {
    if (typeof PerformanceObserver === 'undefined') {
      (window as any).PerformanceObserver = class PerformanceObserverPolyfill {
        private callback: (list: any) => void;

        constructor(callback: (list: any) => void) {
          this.callback = callback;
        }

        observe(): void {
          // Mock implementation - just call callback with empty list
          setTimeout(() => {
            this.callback({ getEntries: () => [] });
          }, 0);
        }

        disconnect(): void {
          // No-op
        }
      };
    }
  }

  /**
   * requestIdleCallback polyfill
   */
  private static polyfillRequestIdleCallback(): void {
    if (typeof window !== 'undefined' && !window.requestIdleCallback) {
      (window as any).requestIdleCallback = function(callback: (deadline: IdleDeadline) => void, options?: { timeout?: number }): number {
        const start = Date.now();
        const timeout = options?.timeout || 0;

        return setTimeout(() => {
          const timeRemaining = Math.max(0, 50 - (Date.now() - start));
          const deadline: IdleDeadline = {
            didTimeout: timeout > 0 && (Date.now() - start) >= timeout,
            timeRemaining: () => timeRemaining
          };
          callback(deadline);
        }, 1) as unknown as number;
      };

      (window as any).cancelIdleCallback = function(id: number): void {
        clearTimeout(id);
      };
    }
  }

  /**
   * CustomEvent polyfill for IE
   */
  private static polyfillCustomEvent(): void {
    if (typeof CustomEvent === 'undefined') {
      (window as any).CustomEvent = function CustomEventPolyfill(event: string, params: any = {}) {
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles || false, params.cancelable || false, params.detail);
        return evt;
      };
    }
  }

  /**
   * Object.assign polyfill
   */
  private static polyfillAssign(): void {
    if (!Object.assign) {
      Object.assign = function(target: any, ...sources: any[]): any {
        if (target == null) {
          throw new TypeError('Cannot convert undefined or null to object');
        }

        const to = Object(target);

        for (let index = 0; index < sources.length; index++) {
          const nextSource = sources[index];

          if (nextSource != null) {
            for (const nextKey in nextSource) {
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }

        return to;
      };
    }
  }

  /**
   * Array.includes polyfill
   */
  private static polyfillArrayIncludes(): void {
    if (!Array.prototype.includes) {
      Array.prototype.includes = function(searchElement: any, fromIndex?: number): boolean {
        const n = parseInt(String(fromIndex || 0)) || 0;
        if (n >= this.length) return false;
        const start = n >= 0 ? n : Math.max(0, this.length + n);
        for (let i = start; i < this.length; i++) {
          if (this[i] === searchElement) return true;
        }
        return false;
      };
    }
  }

  /**
   * String.includes polyfill
   */
  private static polyfillStringIncludes(): void {
    if (!String.prototype.includes) {
      String.prototype.includes = function(search: string, start?: number): boolean {
        if (typeof start !== 'number') {
          start = 0;
        }

        if (start + search.length > this.length) {
          return false;
        } else {
          return this.indexOf(search, start) !== -1;
        }
      };
    }
  }

  /**
   * Console polyfill for environments without console
   */
  private static polyfillConsole(): void {
    if (typeof console === 'undefined') {
      (window as any).console = {
        log: () => {},
        warn: () => {},
        error: () => {},
        info: () => {},
        debug: () => {},
        trace: () => {},
        group: () => {},
        groupEnd: () => {},
        time: () => {},
        timeEnd: () => {}
      };
    }
  }

  /**
   * Check if all modern features are available
   */
  static isModernBrowser(): boolean {
    return !!(
      typeof Promise !== 'undefined' &&
      typeof fetch !== 'undefined' &&
      typeof IntersectionObserver !== 'undefined' &&
      typeof PerformanceObserver !== 'undefined' &&
      typeof CustomEvent !== 'undefined' &&
      typeof Object.assign === 'function' &&
      typeof Array.prototype.includes === 'function' &&
      typeof String.prototype.includes === 'function'
    );
  }

  /**
   * Get compatibility report
   */
  static getCompatibilityReport(): {
    isModern: boolean;
    features: Record<string, boolean>;
    polyfillsNeeded: string[];
  } {
    const features = {
      Promise: typeof Promise !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      IntersectionObserver: typeof IntersectionObserver !== 'undefined',
      PerformanceObserver: typeof PerformanceObserver !== 'undefined',
      requestIdleCallback: typeof window !== 'undefined' && typeof (window as any).requestIdleCallback !== 'undefined',
      CustomEvent: typeof CustomEvent !== 'undefined',
      ObjectAssign: !!Object.assign,
      ArrayIncludes: !!Array.prototype.includes,
      StringIncludes: !!String.prototype.includes,
      localStorage: typeof Storage !== 'undefined',
      sessionStorage: typeof Storage !== 'undefined'
    };

    const polyfillsNeeded = Object.keys(features).filter(key => !features[key as keyof typeof features]);

    return {
      isModern: this.isModernBrowser(),
      features,
      polyfillsNeeded
    };
  }
}
