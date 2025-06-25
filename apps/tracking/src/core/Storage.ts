import { StorageInterface } from '../types';
import { isBrowser, safeJsonParse, safeJsonStringify } from '../utils';

/**
 * Universal storage abstraction with fallbacks
 * Handles localStorage, sessionStorage, and cookies
 */
export class Storage implements StorageInterface {
  private _prefix: string;
  private _fallback: Map<string, string> = new Map();

  constructor(prefix: string = 'opt_') {
    this._prefix = prefix;
  }

  /**
   * Get value from storage
   */
  get(key: string): string | null {
    const prefixedKey = this._prefix + key;

    // Try localStorage first
    try {
      if (isBrowser() && window.localStorage) {
        const value = localStorage.getItem(prefixedKey);
        if (value !== null) {
          const parsed = safeJsonParse<{ value: string; expiry?: number } | null>(value, null);
          if (parsed && this._isNotExpired(parsed.expiry)) {
            return parsed.value;
          } else if (parsed) {
            // Remove expired item
            localStorage.removeItem(prefixedKey);
          }
        }
      }
    } catch (e) {
      // localStorage not available or quota exceeded
    }

    // Try sessionStorage
    try {
      if (isBrowser() && window.sessionStorage) {
        const value = sessionStorage.getItem(prefixedKey);
        if (value !== null) {
          const parsed = safeJsonParse<{ value: string; expiry?: number } | null>(value, null);
          if (parsed && this._isNotExpired(parsed.expiry)) {
            return parsed.value;
          }
        }
      }
    } catch (e) {
      // sessionStorage not available
    }

    // Try cookies
    try {
      if (isBrowser()) {
        const cookieValue = this._getCookie(prefixedKey);
        if (cookieValue) {
          return cookieValue;
        }
      }
    } catch (e) {
      // Cookies not available
    }

    // Fallback to memory storage
    return this._fallback.get(prefixedKey) || null;
  }

  /**
   * Set value in storage
   */
  set(key: string, value: string, expiry?: number): void {
    const prefixedKey = this._prefix + key;
    const storageValue = safeJsonStringify({ value, expiry });

    // Try localStorage first
    try {
      if (isBrowser() && window.localStorage) {
        localStorage.setItem(prefixedKey, storageValue);
        return;
      }
    } catch (e) {
      // localStorage not available or quota exceeded
    }

    // Try sessionStorage
    try {
      if (isBrowser() && window.sessionStorage) {
        sessionStorage.setItem(prefixedKey, storageValue);
        return;
      }
    } catch (e) {
      // sessionStorage not available
    }

    // Try cookies (with size limit)
    try {
      if (isBrowser() && value.length < 4000) { // Cookie size limit
        this._setCookie(prefixedKey, value, expiry);
        return;
      }
    } catch (e) {
      // Cookies not available
    }

    // Fallback to memory storage
    this._fallback.set(prefixedKey, value);

    // Clean up memory storage if it gets too large
    if (this._fallback.size > 100) {
      const entries = Array.from(this._fallback.entries());
      entries.slice(0, 20).forEach(([k]) => this._fallback.delete(k));
    }
  }

  /**
   * Remove value from storage
   */
  remove(key: string): void {
    const prefixedKey = this._prefix + key;

    // Remove from localStorage
    try {
      if (isBrowser() && window.localStorage) {
        localStorage.removeItem(prefixedKey);
      }
    } catch (e) {
      // localStorage not available
    }

    // Remove from sessionStorage
    try {
      if (isBrowser() && window.sessionStorage) {
        sessionStorage.removeItem(prefixedKey);
      }
    } catch (e) {
      // sessionStorage not available
    }

    // Remove from cookies
    try {
      if (isBrowser()) {
        this._deleteCookie(prefixedKey);
      }
    } catch (e) {
      // Cookies not available
    }

    // Remove from memory fallback
    this._fallback.delete(prefixedKey);
  }

  /**
   * Clear all storage for this tracker
   */
  clear(): void {
    const keys = this._getAllKeys();
    keys.forEach(key => this.remove(key.replace(this._prefix, '')));
    this._fallback.clear();
  }

  /**
   * Check if storage item is not expired
   */
  private _isNotExpired(expiry?: number): boolean {
    if (!expiry) return true;
    return Date.now() < expiry;
  }

  /**
   * Get all keys for this tracker
   */
  private _getAllKeys(): string[] {
    const keys: string[] = [];

    // Get localStorage keys
    try {
      if (isBrowser() && window.localStorage) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this._prefix)) {
            keys.push(key);
          }
        }
      }
    } catch (e) {
      // localStorage not available
    }

    // Get sessionStorage keys
    try {
      if (isBrowser() && window.sessionStorage) {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(this._prefix)) {
            keys.push(key);
          }
        }
      }
    } catch (e) {
      // sessionStorage not available
    }

    // Get memory storage keys
    this._fallback.forEach((_, key) => {
      if (key.startsWith(this._prefix)) {
        keys.push(key);
      }
    });

    return Array.from(new Set(keys)); // Remove duplicates
  }

  /**
   * Get cookie value
   */
  private _getCookie(name: string): string | null {
    if (!isBrowser()) return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue ? decodeURIComponent(cookieValue) : null;
    }
    return null;
  }

  /**
   * Set cookie value
   */
  private _setCookie(name: string, value: string, expiry?: number): void {
    if (!isBrowser()) return;

    let cookieString = `${name}=${encodeURIComponent(value)}; path=/`;

    if (expiry) {
      const expiryDate = new Date(expiry);
      cookieString += `; expires=${expiryDate.toUTCString()}`;
    }

    // Add security attributes
    if (location.protocol === 'https:') {
      cookieString += '; secure';
    }
    cookieString += '; samesite=lax';

    document.cookie = cookieString;
  }

  /**
   * Delete cookie
   */
  private _deleteCookie(name: string): void {
    if (!isBrowser()) return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}
