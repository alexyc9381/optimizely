import { ModuleInterface, TechStackDetection } from '../types';
import { isBrowser } from '../utils';

/**
 * Technology Detection Signatures Database
 * Comprehensive signatures for identifying web technologies
 */
interface TechSignature {
  name: string;
  category:
    | 'cms'
    | 'framework'
    | 'analytics'
    | 'library'
    | 'server'
    | 'hosting'
    | 'ecommerce'
    | 'marketing';
  confidence: number;
  checks: {
    dom?: string[]; // CSS selectors to look for
    js?: string[]; // JavaScript objects/functions to detect
    headers?: string[]; // HTTP headers to check
    meta?: string[]; // Meta tag patterns
    text?: string[]; // Text content patterns
    url?: string[]; // URL patterns
    cookies?: string[]; // Cookie patterns
  };
  version?: {
    regex: string;
    group: number;
  };
}

/**
 * Universal Technology Detection Module
 * Identifies web technologies through multiple detection methods
 */
export class TechnologyDetector implements ModuleInterface {
  public name = 'TechnologyDetector';

  private _isEnabled = false;
  private _detectionCache: Map<string, TechStackDetection> = new Map();
  private _signatures: TechSignature[] = [];

  constructor() {
    this._initializeSignatures();
  }

  /**
   * Initialize the technology detector
   */
  init(): void {
    if (!isBrowser()) {
      return;
    }

    this._isEnabled = true;

    // Perform initial technology detection
    this._performDetection();
  }

  /**
   * Enable technology detection
   */
  enable(): void {
    this._isEnabled = true;
  }

  /**
   * Disable technology detection
   */
  disable(): void {
    this._isEnabled = false;
  }

  /**
   * Destroy the technology detector
   */
  destroy(): void {
    this._isEnabled = false;
    this._detectionCache.clear();
  }

  /**
   * Get current technology stack detection results
   */
  getCurrentTechStack(): TechStackDetection {
    const cached = this._detectionCache.get(window.location.hostname);
    return cached || this._performDetection();
  }

  /**
   * Force re-detection of technologies
   */
  redetect(): TechStackDetection {
    this._detectionCache.delete(window.location.hostname);
    return this._performDetection();
  }

  /**
   * Perform comprehensive technology detection
   */
  private _performDetection(): TechStackDetection {
    if (!isBrowser() || !this._isEnabled) {
      return {};
    }

    const detected: TechStackDetection = {
      analytics: [],
      libraries: [],
    };

    // Analyze each signature
    for (const signature of this._signatures) {
      const confidence = this._checkSignature(signature);

      if (confidence > 0.5) {
        // Minimum confidence threshold
        switch (signature.category) {
          case 'cms':
            detected.cms = signature.name;
            break;
          case 'framework':
            detected.framework = signature.name;
            break;
          case 'analytics':
            if (!detected.analytics?.includes(signature.name)) {
              detected.analytics?.push(signature.name);
            }
            break;
          case 'library':
            if (!detected.libraries?.includes(signature.name)) {
              detected.libraries?.push(signature.name);
            }
            break;
          case 'server':
            detected.server = signature.name;
            break;
          case 'hosting':
            detected.hosting = signature.name;
            break;
        }
      }
    }

    // Cache the results
    this._detectionCache.set(window.location.hostname, detected);

    return detected;
  }

  /**
   * Check if a technology signature matches
   */
  private _checkSignature(signature: TechSignature): number {
    let confidence = 0;
    let totalChecks = 0;
    let passedChecks = 0;

    // DOM element checks
    if (signature.checks.dom) {
      totalChecks += signature.checks.dom.length;
      for (const selector of signature.checks.dom) {
        if (document.querySelector(selector)) {
          passedChecks++;
        }
      }
    }

    // JavaScript object checks
    if (signature.checks.js) {
      totalChecks += signature.checks.js.length;
      for (const jsPath of signature.checks.js) {
        if (this._checkJavaScriptObject(jsPath)) {
          passedChecks++;
        }
      }
    }

    // Meta tag checks
    if (signature.checks.meta) {
      totalChecks += signature.checks.meta.length;
      for (const metaPattern of signature.checks.meta) {
        if (this._checkMetaTag(metaPattern)) {
          passedChecks++;
        }
      }
    }

    // Text content checks
    if (signature.checks.text) {
      totalChecks += signature.checks.text.length;
      for (const textPattern of signature.checks.text) {
        if (document.documentElement.outerHTML.includes(textPattern)) {
          passedChecks++;
        }
      }
    }

    // URL pattern checks
    if (signature.checks.url) {
      totalChecks += signature.checks.url.length;
      for (const urlPattern of signature.checks.url) {
        if (this._checkUrlPattern(urlPattern)) {
          passedChecks++;
        }
      }
    }

    // Cookie checks
    if (signature.checks.cookies) {
      totalChecks += signature.checks.cookies.length;
      for (const cookiePattern of signature.checks.cookies) {
        if (this._checkCookie(cookiePattern)) {
          passedChecks++;
        }
      }
    }

    // Calculate confidence based on passed checks
    if (totalChecks > 0) {
      confidence = (passedChecks / totalChecks) * signature.confidence;
    }

    return confidence;
  }

  /**
   * Check if a JavaScript object/function exists
   */
  private _checkJavaScriptObject(path: string): boolean {
    try {
      const parts = path.split('.');
      let current: any = window;

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return false;
        }
      }

      return current !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Check meta tag patterns
   */
  private _checkMetaTag(pattern: string): boolean {
    const metaTags = Array.from(document.querySelectorAll('meta'));
    for (const meta of metaTags) {
      const name =
        meta.getAttribute('name') || meta.getAttribute('property') || '';
      const content = meta.getAttribute('content') || '';
      if (name.includes(pattern) || content.includes(pattern)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check URL patterns (scripts, stylesheets, etc.)
   */
  private _checkUrlPattern(pattern: string): boolean {
    // Check script sources
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    for (const script of scripts) {
      const src = script.getAttribute('src') || '';
      if (src.includes(pattern)) {
        return true;
      }
    }

    // Check stylesheet sources
    const links = Array.from(document.querySelectorAll('link[href]'));
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      if (href.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check cookie patterns
   */
  private _checkCookie(pattern: string): boolean {
    return document.cookie.includes(pattern);
  }

  /**
   * Initialize technology signatures database
   */
  private _initializeSignatures(): void {
    this._signatures = [
      // CMS Platforms
      {
        name: 'WordPress',
        category: 'cms',
        confidence: 1.0,
        checks: {
          meta: ['generator'],
          text: ['wp-content', 'wp-includes'],
          js: ['wp'],
        },
      },
      {
        name: 'Shopify',
        category: 'cms',
        confidence: 1.0,
        checks: {
          js: ['Shopify'],
          text: ['shopify'],
          meta: ['shopify'],
        },
      },
      {
        name: 'Drupal',
        category: 'cms',
        confidence: 1.0,
        checks: {
          meta: ['generator'],
          text: ['/sites/default/', 'Drupal.settings'],
          js: ['Drupal'],
        },
      },
      {
        name: 'Squarespace',
        category: 'cms',
        confidence: 1.0,
        checks: {
          text: ['squarespace'],
          url: ['squarespace'],
        },
      },
      {
        name: 'Webflow',
        category: 'cms',
        confidence: 1.0,
        checks: {
          text: ['webflow'],
          url: ['webflow'],
        },
      },

      // JavaScript Frameworks
      {
        name: 'React',
        category: 'framework',
        confidence: 0.9,
        checks: {
          js: ['React', 'ReactDOM'],
          text: ['react', 'data-reactroot'],
        },
      },
      {
        name: 'Vue.js',
        category: 'framework',
        confidence: 0.9,
        checks: {
          js: ['Vue'],
          text: ['vue'],
        },
      },
      {
        name: 'Angular',
        category: 'framework',
        confidence: 0.9,
        checks: {
          js: ['ng', 'angular'],
          text: ['ng-app', 'ng-controller'],
        },
      },
      {
        name: 'Next.js',
        category: 'framework',
        confidence: 1.0,
        checks: {
          js: ['__NEXT_DATA__'],
          text: ['_next/static'],
        },
      },
      {
        name: 'Nuxt.js',
        category: 'framework',
        confidence: 1.0,
        checks: {
          js: ['__NUXT__'],
          text: ['_nuxt/'],
        },
      },
      {
        name: 'Svelte',
        category: 'framework',
        confidence: 0.9,
        checks: {
          text: ['svelte'],
        },
      },

      // Analytics Platforms
      {
        name: 'Google Analytics',
        category: 'analytics',
        confidence: 1.0,
        checks: {
          js: ['gtag', 'ga', 'GoogleAnalyticsObject'],
          url: ['google-analytics.com', 'googletagmanager.com'],
        },
      },
      {
        name: 'Google Tag Manager',
        category: 'analytics',
        confidence: 1.0,
        checks: {
          js: ['dataLayer'],
          url: ['googletagmanager.com'],
        },
      },
      {
        name: 'Mixpanel',
        category: 'analytics',
        confidence: 1.0,
        checks: {
          js: ['mixpanel'],
          url: ['mixpanel.com'],
        },
      },
      {
        name: 'Amplitude',
        category: 'analytics',
        confidence: 1.0,
        checks: {
          js: ['amplitude'],
          url: ['amplitude.com'],
        },
      },
      {
        name: 'Segment',
        category: 'analytics',
        confidence: 1.0,
        checks: {
          js: ['analytics'],
          url: ['segment.com', 'segment.io'],
        },
      },
      {
        name: 'Adobe Analytics',
        category: 'analytics',
        confidence: 1.0,
        checks: {
          js: ['s_account', '_satellite'],
          url: ['omtrdc.net', 'demdex.net'],
        },
      },
      {
        name: 'Hotjar',
        category: 'analytics',
        confidence: 1.0,
        checks: {
          js: ['hj'],
          url: ['hotjar.com'],
        },
      },
      {
        name: 'Facebook Pixel',
        category: 'analytics',
        confidence: 1.0,
        checks: {
          js: ['fbq'],
          url: ['facebook.net'],
        },
      },

      // JavaScript Libraries
      {
        name: 'jQuery',
        category: 'library',
        confidence: 1.0,
        checks: {
          js: ['jQuery', '$'],
        },
      },
      {
        name: 'Lodash',
        category: 'library',
        confidence: 1.0,
        checks: {
          js: ['_'],
        },
      },
      {
        name: 'D3.js',
        category: 'library',
        confidence: 1.0,
        checks: {
          js: ['d3'],
        },
      },
      {
        name: 'Chart.js',
        category: 'library',
        confidence: 1.0,
        checks: {
          js: ['Chart'],
        },
      },
      {
        name: 'Bootstrap',
        category: 'library',
        confidence: 0.8,
        checks: {
          dom: ['.container', '.row', '.col'],
          text: ['bootstrap'],
        },
      },
      {
        name: 'Tailwind CSS',
        category: 'library',
        confidence: 0.8,
        checks: {
          dom: ['[class*="tw-"]', '[class*="bg-"]', '[class*="text-"]'],
          text: ['tailwind'],
        },
      },

      // E-commerce Platforms
      {
        name: 'WooCommerce',
        category: 'ecommerce',
        confidence: 1.0,
        checks: {
          text: ['woocommerce', 'wc-'],
          dom: ['.woocommerce'],
        },
      },
      {
        name: 'Magento',
        category: 'ecommerce',
        confidence: 1.0,
        checks: {
          text: ['magento', 'Mage.'],
          js: ['Mage'],
        },
      },

      // Hosting/CDN
      {
        name: 'Cloudflare',
        category: 'hosting',
        confidence: 0.7,
        checks: {
          text: ['cloudflare'],
          url: ['cloudflare'],
        },
      },
      {
        name: 'AWS CloudFront',
        category: 'hosting',
        confidence: 0.7,
        checks: {
          url: ['cloudfront.net'],
        },
      },
      {
        name: 'Netlify',
        category: 'hosting',
        confidence: 1.0,
        checks: {
          text: ['netlify'],
          url: ['netlify'],
        },
      },
      {
        name: 'Vercel',
        category: 'hosting',
        confidence: 1.0,
        checks: {
          text: ['vercel'],
          url: ['vercel'],
        },
      },
    ];
  }
}
