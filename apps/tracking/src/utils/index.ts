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
 * Generate a unique ID (general purpose)
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
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
export function debounce(func: Function, wait: number): Function {
  let timeout: NodeJS.Timeout | null = null;

  return function(this: any, ...args: any[]) {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle(func: Function, limit: number): Function {
  let inThrottle: boolean = false;

  return function(this: any, ...args: any[]) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
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
export function safeJsonParse<T = any>(json: string, fallback: T = null as any): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Safe JSON stringifying
 */
export function safeJsonStringify(obj: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
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
  if (!isBrowser()) return 'server';
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
export function deepMerge(target: any, source: any): any {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

/**
 * Check if value is an object
 */


/**
 * Get platform information
 */
export function getPlatform(): string {
  if (!isBrowser()) return 'server';
  return navigator.platform;
}

/**
 * Get language information
 */
export function getLanguage(): string {
  if (!isBrowser()) return 'en';
  return navigator.language || (navigator as any).userLanguage || 'en';
}

/**
 * Get timezone offset
 */
export function getTimezoneOffset(): number {
  if (!isBrowser()) return 0;
  return new Date().getTimezoneOffset();
}

/**
 * GDPR Utilities
 */

/**
 * Check if IP address needs anonymization
 */
export function shouldAnonymizeIP(ip: string, settings: { anonymizeIPs: boolean }): boolean {
  return settings.anonymizeIPs && Boolean(ip) && ip !== '127.0.0.1' && ip !== '::1';
}

/**
 * Anonymize IPv4 address
 */
export function anonymizeIPv4(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  return ip;
}

/**
 * Anonymize IPv6 address
 */
export function anonymizeIPv6(ip: string): string {
  const parts = ip.split(':');
  if (parts.length >= 4) {
    return `${parts.slice(0, 4).join(':')}::`;
  }
  return ip;
}

/**
 * Anonymize IP address (auto-detect IPv4/IPv6)
 */
export function anonymizeIP(ip: string): string {
  if (!ip) return ip;

  if (ip.includes(':')) {
    return anonymizeIPv6(ip);
  } else {
    return anonymizeIPv4(ip);
  }
}

/**
 * Check if data should be minimized
 */
export function shouldMinimizeData(settings: { dataMinimization: boolean }): boolean {
  return settings.dataMinimization;
}

/**
 * Remove PII from data object
 */
export function removePII(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const piiFields = [
    'email', 'phone', 'name', 'firstName', 'lastName', 'fullName',
    'address', 'street', 'city', 'zipCode', 'postalCode',
    'ssn', 'socialSecurityNumber', 'creditCard', 'bankAccount',
    'passport', 'driverLicense', 'taxId'
  ];

  const cleaned = { ...data };

  piiFields.forEach(field => {
    if (cleaned[field]) {
      delete cleaned[field];
    }
  });

  return cleaned;
}

/**
 * Hash sensitive data for privacy
 */
export function hashSensitiveData(data: string): string {
  if (!data) return data;

  // Simple hash function for privacy (in production, use a proper crypto library)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Check if consent is required based on user location (simple heuristic)
 */
export function isConsentRequired(): boolean {
  if (!isBrowser()) return true; // Default to requiring consent on server

  // Check timezone for EU countries (rough heuristic)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const euTimezones = [
    'Europe/', 'Atlantic/Azores', 'Atlantic/Madeira', 'Atlantic/Canary'
  ];

  return euTimezones.some(tz => timezone.startsWith(tz));
}

/**
 * Get Do Not Track status
 */
export function getDoNotTrackStatus(): boolean {
  if (!isBrowser()) return false;

  return navigator.doNotTrack === '1' ||
         (window as any).doNotTrack === '1' ||
         (navigator as any).msDoNotTrack === '1';
}

/**
 * Check if cookies are enabled
 */
export function areCookiesEnabled(): boolean {
  if (!isBrowser()) return false;

  try {
    document.cookie = 'test_cookie=1';
    const enabled = document.cookie.indexOf('test_cookie=') !== -1;
    document.cookie = 'test_cookie=1; expires=Thu, 01-Jan-1970 00:00:01 GMT';
    return enabled;
  } catch {
    return false;
  }
}

/**
 * Clear all cookies for domain
 */
export function clearAllCookies(domain?: string): void {
  if (!isBrowser()) return;

  const cookies = document.cookie.split(';');

  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

    if (name) {
      // Clear for current domain
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;

      // Clear for specified domain
      if (domain) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
      }

      // Clear for parent domain
      const hostname = window.location.hostname;
      if (hostname.includes('.')) {
        const parentDomain = '.' + hostname.split('.').slice(-2).join('.');
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${parentDomain}`;
      }
    }
  });
}

/**
 * Validate email format (basic)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format date for GDPR compliance display
 */
export function formatGDPRDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate data retention expiry
 */
export function calculateRetentionExpiry(timestamp: number, retentionDays: number): number {
  return timestamp + (retentionDays * 24 * 60 * 60 * 1000);
}

/**
 * Check if data has expired based on retention policy
 */
export function isDataExpired(timestamp: number, retentionDays: number): boolean {
  const expiry = calculateRetentionExpiry(timestamp, retentionDays);
  return now() > expiry;
}
