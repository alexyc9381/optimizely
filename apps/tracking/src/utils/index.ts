// Utility Functions for Universal Tracking

/**
 * Generate a unique visitor ID
 */
export function generateVisitorId(): string {
  return 'v_' + generateRandomId(16);
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return 's_' + generateRandomId(12) + '_' + Date.now();
}

/**
 * Generate a random ID string
 */
function generateRandomId(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get current timestamp
 */
export function now(): number {
  return Date.now();
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check if code is running in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if code is running in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Safe JSON parsing
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Safe JSON stringifying
 */
export function safeJsonStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
}

/**
 * Get current page URL (normalized)
 */
export function getCurrentUrl(): string {
  if (!isBrowser()) return '';
  return window.location.href.split('#')[0].split('?')[0];
}

/**
 * Get current page title
 */
export function getCurrentTitle(): string {
  if (!isBrowser()) return '';
  return document.title || '';
}

/**
 * Get referrer URL
 */
export function getReferrer(): string {
  if (!isBrowser()) return '';
  return document.referrer || '';
}

/**
 * Get user agent string
 */
export function getUserAgent(): string {
  if (!isBrowser()) return '';
  return navigator.userAgent || '';
}

/**
 * Basic platform detection
 */
export function detectPlatform(): string {
  if (!isBrowser()) return 'server';

  const userAgent = getUserAgent().toLowerCase();

  // Mobile platforms
  if (/android/.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';

  // Desktop platforms
  if (/windows/.test(userAgent)) return 'windows';
  if (/mac/.test(userAgent)) return 'mac';
  if (/linux/.test(userAgent)) return 'linux';

  return 'unknown';
}

/**
 * Detect browser
 */
export function detectBrowser(): string {
  if (!isBrowser()) return 'unknown';

  const userAgent = getUserAgent().toLowerCase();

  if (/chrome/.test(userAgent) && !/edge/.test(userAgent)) return 'chrome';
  if (/firefox/.test(userAgent)) return 'firefox';
  if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) return 'safari';
  if (/edge/.test(userAgent)) return 'edge';
  if (/opera/.test(userAgent)) return 'opera';

  return 'unknown';
}

/**
 * Check if element is visible in viewport
 */
export function isElementVisible(element: Element): boolean {
  if (!isBrowser()) return false;

  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= windowHeight &&
    rect.right <= windowWidth
  );
}

/**
 * Get scroll depth percentage
 */
export function getScrollDepth(): number {
  if (!isBrowser()) return 0;

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.clientHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  );
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;

  if (documentHeight <= windowHeight) return 100;

  return Math.round((scrollTop + windowHeight) / documentHeight * 100);
}

/**
 * Wait for DOM to be ready
 */
export function domReady(callback: () => void): void {
  if (!isBrowser()) {
    callback();
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

/**
 * Add event listener with cleanup
 */
export function addEventListener(
  element: EventTarget,
  event: string,
  handler: EventListener,
  options?: boolean | AddEventListenerOptions
): () => void {
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}

/**
 * Create a simple hash from string
 */
export function simpleHash(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (isObject(sourceValue) && isObject(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue as any);
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[typeof key];
      }
    }
  }

  return result;
}

/**
 * Check if value is an object
 */
function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
