import { EventEmitter } from 'events';
import { PlatformIntegration } from './universal-api-service';

export interface SDKConfiguration {
  platform: string;
  version: string;
  features: string[];
  minified: boolean;
  bundle: 'esm' | 'umd' | 'cjs';
  customization?: {
    branding?: boolean;
    styling?: boolean;
    events?: string[];
  };
}

export interface GeneratedSDK {
  code: string;
  version: string;
  downloadUrl: string;
  documentation: string;
  examples: { [key: string]: string };
}

/**
 * SDK Manager for generating platform-specific JavaScript SDKs
 */
export class SDKManager extends EventEmitter {
  private sdkTemplates: Map<string, string> = new Map();
  private generatedSDKs: Map<string, GeneratedSDK> = new Map();

  constructor() {
    super();
    this.initializeTemplates();
  }

  /**
   * Generate SDK for specific platform and configuration
   */
  async generateSDK(config: SDKConfiguration, integration: PlatformIntegration): Promise<GeneratedSDK> {
    const cacheKey = this.generateCacheKey(config, integration);

    // Check cache first
    if (this.generatedSDKs.has(cacheKey)) {
      return this.generatedSDKs.get(cacheKey)!;
    }

    const sdk = await this.buildSDK(config, integration);
    this.generatedSDKs.set(cacheKey, sdk);

    this.emit('sdk_generated', {
      platform: config.platform,
      version: config.version,
      features: config.features
    });

    return sdk;
  }

  /**
   * Build SDK code from templates and configuration
   */
  private async buildSDK(config: SDKConfiguration, integration: PlatformIntegration): Promise<GeneratedSDK> {
    const baseTemplate = this.getBaseTemplate(config.platform);
    const apiKey = integration.configuration.apiKey;
    const baseUrl = integration.configuration.baseUrl;

    let sdkCode = baseTemplate
      .replace(/{{API_KEY}}/g, apiKey)
      .replace(/{{BASE_URL}}/g, baseUrl)
      .replace(/{{VERSION}}/g, config.version);

    // Add feature modules
    const featureModules = this.generateFeatureModules(config.features, integration);
    sdkCode = sdkCode.replace('{{FEATURE_MODULES}}', featureModules);

    // Add initialization code
    const initCode = this.generateInitializationCode(config, integration);
    sdkCode = sdkCode.replace('{{INITIALIZATION}}', initCode);

    // Add utility functions
    const utilities = this.generateUtilities(config, integration);
    sdkCode = sdkCode.replace('{{UTILITIES}}', utilities);

    // Apply bundling format
    sdkCode = this.applyBundleFormat(sdkCode, config.bundle);

    // Apply customizations
    if (config.customization) {
      sdkCode = this.applyCustomizations(sdkCode, config.customization);
    }

    // Minify if requested
    if (config.minified) {
      sdkCode = this.minifyCode(sdkCode);
    }

    const downloadUrl = await this.storeSDK(sdkCode, config);
    const documentation = this.generateDocumentation(config, integration);
    const examples = this.generateExamples(config, integration);

    return {
      code: sdkCode,
      version: config.version,
      downloadUrl,
      documentation,
      examples
    };
  }

  /**
   * Initialize SDK templates for different platforms
   */
  private initializeTemplates(): void {
    // Universal JavaScript template
    this.sdkTemplates.set('universal', `
(function(window, undefined) {
  'use strict';

  // Optimizely Universal SDK v{{VERSION}}
  var OptimizelySDK = function(config) {
    this.config = Object.assign({
      apiKey: '{{API_KEY}}',
      baseUrl: '{{BASE_URL}}',
      timeout: 5000,
      retries: 3,
      debug: false
    }, config || {});

    this.visitorId = this.getOrCreateVisitorId();
    this.experiments = new Map();
    this.eventQueue = [];
    this.isInitialized = false;

    this.init();
  };

  OptimizelySDK.prototype = {
    {{FEATURE_MODULES}}

    {{INITIALIZATION}}

    {{UTILITIES}}

    // Core API methods
    request: function(endpoint, options) {
      var self = this;
      options = options || {};

      return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        var url = self.config.baseUrl + endpoint;
        var method = options.method || 'GET';
        var timeout = setTimeout(function() {
          xhr.abort();
          reject(new Error('Request timeout'));
        }, self.config.timeout);

        xhr.open(method, url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-API-Key', self.config.apiKey);
        xhr.setRequestHeader('X-SDK-Version', '{{VERSION}}');

        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            clearTimeout(timeout);
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                var response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (e) {
                reject(new Error('Invalid JSON response'));
              }
            } else {
              reject(new Error('HTTP ' + xhr.status + ': ' + xhr.statusText));
            }
          }
        };

        xhr.onerror = function() {
          clearTimeout(timeout);
          reject(new Error('Network error'));
        };

        if (options.data) {
          xhr.send(JSON.stringify(options.data));
        } else {
          xhr.send();
        }
      });
    },

    // Error handling
    handleError: function(error, context) {
      if (this.config.debug) {
        console.error('[OptimizelySDK]', context, error);
      }
      this.emit('error', { error: error, context: context });
    },

    // Event system
    on: function(event, callback) {
      if (!this.events) this.events = {};
      if (!this.events[event]) this.events[event] = [];
      this.events[event].push(callback);
    },

    emit: function(event, data) {
      if (!this.events || !this.events[event]) return;
      this.events[event].forEach(function(callback) {
        try {
          callback(data);
        } catch (e) {
          console.error('[OptimizelySDK] Event callback error:', e);
        }
      });
    }
  };

  // Export for different module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptimizelySDK;
  } else if (typeof define === 'function' && define.amd) {
    define(function() { return OptimizelySDK; });
  } else {
    window.OptimizelySDK = OptimizelySDK;
  }

})(typeof window !== 'undefined' ? window : this);
    `);

    // React-specific template
    this.sdkTemplates.set('react', `
import React, { createContext, useContext, useEffect, useState } from 'react';

const OptimizelyContext = createContext(null);

export const OptimizelyProvider = ({ apiKey, baseUrl, children, config }) => {
  const [sdk, setSdk] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const optimizelySDK = new OptimizelySDK({
      apiKey: apiKey || '{{API_KEY}}',
      baseUrl: baseUrl || '{{BASE_URL}}',
      ...config
    });

    optimizelySDK.on('ready', () => {
      setIsReady(true);
      setSdk(optimizelySDK);
    });

    return () => {
      if (optimizelySDK && optimizelySDK.cleanup) {
        optimizelySDK.cleanup();
      }
    };
  }, [apiKey, baseUrl, config]);

  return (
    <OptimizelyContext.Provider value={{ sdk, isReady }}>
      {children}
    </OptimizelyContext.Provider>
  );
};

export const useOptimizely = () => {
  const context = useContext(OptimizelyContext);
  if (!context) {
    throw new Error('useOptimizely must be used within OptimizelyProvider');
  }
  return context;
};

export const useExperiment = (experimentKey) => {
  const { sdk, isReady } = useOptimizely();
  const [variation, setVariation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isReady || !sdk) return;

    sdk.getExperiment(experimentKey)
      .then(result => {
        setVariation(result);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error getting experiment:', error);
        setIsLoading(false);
      });
  }, [sdk, isReady, experimentKey]);

  return { variation, isLoading };
};

{{FEATURE_MODULES}}
    `);

    // Vue-specific template
    this.sdkTemplates.set('vue', `
import { ref, reactive, provide, inject, onMounted, onUnmounted } from 'vue';

const OPTIMIZELY_KEY = Symbol('optimizely');

export function createOptimizely(config) {
  const sdk = new OptimizelySDK({
    apiKey: config.apiKey || '{{API_KEY}}',
    baseUrl: config.baseUrl || '{{BASE_URL}}',
    ...config
  });

  const state = reactive({
    isReady: false,
    experiments: new Map(),
    error: null
  });

  sdk.on('ready', () => {
    state.isReady = true;
  });

  sdk.on('error', (error) => {
    state.error = error;
  });

  return {
    install(app) {
      app.provide(OPTIMIZELY_KEY, { sdk, state });
      app.config.globalProperties.$optimizely = sdk;
    },
    sdk,
    state
  };
}

export function useOptimizely() {
  const optimizely = inject(OPTIMIZELY_KEY);
  if (!optimizely) {
    throw new Error('useOptimizely must be used after installing the plugin');
  }
  return optimizely;
}

{{FEATURE_MODULES}}
    `);
  }

  /**
   * Generate feature modules based on enabled features
   */
  private generateFeatureModules(features: string[], integration: PlatformIntegration): string {
    let modules = '';

    if (features.includes('personalization')) {
      modules += `
    // Personalization module
    getPersonalization: function(pageData) {
      var self = this;
      return this.request('/api/v1/universal/personalization', {
        method: 'POST',
        data: {
          visitorId: this.visitorId,
          pageData: pageData || {}
        }
      }).then(function(response) {
        if (response.success) {
          self.applyPersonalization(response.data);
          return response.data;
        }
        throw new Error(response.error || 'Personalization failed');
      });
    },

    applyPersonalization: function(data) {
      if (!data || !data.personalizations) return;

      data.personalizations.forEach(function(p) {
        var element = document.querySelector(p.selector);
        if (element) {
          if (p.type === 'text') {
            element.textContent = p.value;
          } else if (p.type === 'html') {
            element.innerHTML = p.value;
          } else if (p.type === 'attribute') {
            element.setAttribute(p.attribute, p.value);
          } else if (p.type === 'style') {
            Object.assign(element.style, p.styles);
          }
        }
      });

      this.emit('personalization_applied', data);
    },
      `;
    }

    if (features.includes('abTesting')) {
      modules += `
    // A/B Testing module
    getExperiments: function(context) {
      var self = this;
      return this.request('/api/v1/universal/experiments', {
        method: 'POST',
        data: {
          visitorId: this.visitorId,
          context: context || {}
        }
      }).then(function(response) {
        if (response.success) {
          self.updateExperiments(response.data);
          return response.data;
        }
        throw new Error(response.error || 'Failed to get experiments');
      });
    },

    updateExperiments: function(experiments) {
      var self = this;
      experiments.forEach(function(exp) {
        self.experiments.set(exp.id, exp);
        if (exp.variations && exp.variations.length > 0) {
          self.applyVariation(exp, exp.variations[0]);
        }
      });
      this.emit('experiments_updated', experiments);
    },

    applyVariation: function(experiment, variation) {
      if (!variation.elements) return;

      variation.elements.forEach(function(element) {
        var target = document.querySelector(element.selector);
        if (target) {
          target.setAttribute('data-experiment', experiment.id);
          target.setAttribute('data-variation', variation.id);

          if (element.changes) {
            element.changes.forEach(function(change) {
              if (change.type === 'text') {
                target.textContent = change.value;
              } else if (change.type === 'html') {
                target.innerHTML = change.value;
              } else if (change.type === 'attribute') {
                target.setAttribute(change.attribute, change.value);
              } else if (change.type === 'style') {
                Object.assign(target.style, change.styles);
              }
            });
          }
        }
      });

      this.emit('variation_applied', { experiment: experiment, variation: variation });
    },

    getExperiment: function(experimentId) {
      return this.experiments.get(experimentId) || null;
    },
      `;
    }

    if (features.includes('analytics')) {
      modules += `
    // Analytics module
    track: function(eventName, properties) {
      var event = {
        name: eventName,
        properties: properties || {},
        timestamp: new Date().toISOString(),
        visitorId: this.visitorId,
        sessionId: this.getSessionId(),
        url: window.location.href,
        referrer: document.referrer
      };

      this.eventQueue.push(event);

      return this.request('/api/v1/universal/track', {
        method: 'POST',
        data: event
      }).then(function(response) {
        if (response.success) {
          this.emit('event_tracked', event);
          return response.data;
        }
        throw new Error(response.error || 'Tracking failed');
      }.bind(this)).catch(function(error) {
        this.handleError(error, 'track');
        throw error;
      }.bind(this));
    },

    trackConversion: function(conversionData) {
      return this.track('conversion', Object.assign({
        value: 0,
        currency: 'USD'
      }, conversionData));
    },

    trackPageView: function(pageData) {
      return this.track('page_view', Object.assign({
        title: document.title,
        url: window.location.href,
        path: window.location.pathname
      }, pageData));
    },
      `;
    }

    return modules;
  }

  /**
   * Generate initialization code
   */
  private generateInitializationCode(config: SDKConfiguration, integration: PlatformIntegration): string {
    return `
    init: function() {
      var self = this;

      // Set up visitor tracking
      this.setupVisitorTracking();

      // Initialize features
      ${config.features.includes('personalization') ? 'this.initPersonalization();' : ''}
      ${config.features.includes('abTesting') ? 'this.initABTesting();' : ''}
      ${config.features.includes('analytics') ? 'this.initAnalytics();' : ''}

      // Mark as initialized
      this.isInitialized = true;
      this.emit('ready');

      return Promise.resolve(this);
    },

    setupVisitorTracking: function() {
      // Initialize session tracking
      this.sessionId = this.getOrCreateSessionId();

      // Set up page visibility tracking
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', function() {
          if (document.visibilityState === 'hidden') {
            this.flushEvents();
          }
        }.bind(this));

        window.addEventListener('beforeunload', function() {
          this.flushEvents();
        }.bind(this));
      }
    },

    ${config.features.includes('personalization') ? `
    initPersonalization: function() {
      // Auto-load personalization if enabled
      if (typeof document !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          this.getPersonalization();
        }.bind(this));
      } else {
        this.getPersonalization();
      }
    },` : ''}

    ${config.features.includes('abTesting') ? `
    initABTesting: function() {
      // Auto-load experiments if enabled
      if (typeof document !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          this.getExperiments();
        }.bind(this));
      } else {
        this.getExperiments();
      }
    },` : ''}

    ${config.features.includes('analytics') ? `
    initAnalytics: function() {
      // Auto-track page view
      this.trackPageView();

      // Set up automatic form tracking
      if (typeof document !== 'undefined') {
        document.addEventListener('submit', function(e) {
          this.track('form_submit', {
            form: e.target.id || e.target.className,
            url: window.location.href
          });
        }.bind(this));
      }
    },` : ''}
    `;
  }

  /**
   * Generate utility functions
   */
  private generateUtilities(config: SDKConfiguration, integration: PlatformIntegration): string {
    return `
    // Utility functions
    getOrCreateVisitorId: function() {
      var key = 'optimizely_visitor_id';
      var visitorId = this.getStorage(key);
      if (!visitorId) {
        visitorId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substring(2);
        this.setStorage(key, visitorId);
      }
      return visitorId;
    },

    getOrCreateSessionId: function() {
      var key = 'optimizely_session_id';
      var sessionId = this.getSessionStorage(key);
      if (!sessionId) {
        sessionId = 'ses_' + Date.now() + '_' + Math.random().toString(36).substring(2);
        this.setSessionStorage(key, sessionId);
      }
      return sessionId;
    },

    getSessionId: function() {
      return this.sessionId;
    },

    getStorage: function(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },

    setStorage: function(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        // Ignore storage errors
      }
    },

    getSessionStorage: function(key) {
      try {
        return sessionStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },

    setSessionStorage: function(key, value) {
      try {
        sessionStorage.setItem(key, value);
      } catch (e) {
        // Ignore storage errors
      }
    },

    flushEvents: function() {
      if (this.eventQueue.length > 0) {
        // Send any pending events
        var events = this.eventQueue.splice(0);
        return this.request('/api/v1/universal/events/batch', {
          method: 'POST',
          data: { events: events }
        });
      }
      return Promise.resolve();
    },

    cleanup: function() {
      this.flushEvents();
      this.experiments.clear();
      this.eventQueue.length = 0;
      this.isInitialized = false;
    }
    `;
  }

  /**
   * Apply bundle format (ESM, UMD, CJS)
   */
  private applyBundleFormat(code: string, bundle: string): string {
    switch (bundle) {
      case 'esm':
        return code.replace(
          /\/\/ Export for different module systems[\s\S]*?\}\)\(typeof window[^;]+;/,
          'export default OptimizelySDK;'
        );

      case 'cjs':
        return code.replace(
          /\/\/ Export for different module systems[\s\S]*?\}\)\(typeof window[^;]+;/,
          'module.exports = OptimizelySDK;'
        );

      case 'umd':
      default:
        return code; // UMD is the default format
    }
  }

  /**
   * Apply customizations
   */
  private applyCustomizations(code: string, customization: SDKConfiguration['customization']): string {
    if (customization?.branding) {
      code = code.replace(/OptimizelySDK/g, 'CustomSDK');
      code = code.replace(/\[OptimizelySDK\]/g, '[CustomSDK]');
    }

    if (customization?.styling) {
      // Add custom CSS injection capabilities
      const cssInjection = `
      injectCSS: function(css) {
        if (typeof document === 'undefined') return;
        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
      },
      `;
      code = code.replace('{{UTILITIES}}', cssInjection + '{{UTILITIES}}');
    }

    return code;
  }

  /**
   * Minify code (basic minification)
   */
  private minifyCode(code: string): string {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
      .trim();
  }

  /**
   * Store SDK and return download URL
   */
  private async storeSDK(code: string, config: SDKConfiguration): Promise<string> {
    // In a real implementation, this would upload to CDN/S3
    const filename = `optimizely-sdk-${config.platform}-${config.version}.js`;
    return `https://cdn.optimizely.com/sdks/${filename}`;
  }

  /**
   * Generate documentation
   */
  private generateDocumentation(config: SDKConfiguration, integration: PlatformIntegration): string {
    const features = config.features;

    return `
# Optimizely SDK for ${config.platform}

## Installation

### Via CDN
\`\`\`html
<script src="https://cdn.optimizely.com/sdks/optimizely-sdk-${config.platform}-${config.version}.js"></script>
\`\`\`

### Via NPM
\`\`\`bash
npm install @optimizely/sdk-${config.platform}
\`\`\`

## Quick Start

\`\`\`javascript
const optimizely = new OptimizelySDK({
  apiKey: '${integration.configuration.apiKey}',
  baseUrl: '${integration.configuration.baseUrl}'
});

optimizely.on('ready', function() {
  console.log('Optimizely SDK is ready!');
});
\`\`\`

## Features

${features.includes('personalization') ? `
### Personalization
\`\`\`javascript
optimizely.getPersonalization({
  page: 'homepage',
  category: 'electronics'
}).then(function(personalizations) {
  console.log('Personalizations applied:', personalizations);
});
\`\`\`
` : ''}

${features.includes('abTesting') ? `
### A/B Testing
\`\`\`javascript
optimizely.getExperiments().then(function(experiments) {
  experiments.forEach(function(experiment) {
    console.log('Active experiment:', experiment.name);
  });
});
\`\`\`
` : ''}

${features.includes('analytics') ? `
### Analytics
\`\`\`javascript
// Track custom events
optimizely.track('button_click', {
  button: 'cta-primary',
  page: 'homepage'
});

// Track conversions
optimizely.trackConversion({
  value: 99.99,
  currency: 'USD',
  orderId: '12345'
});
\`\`\`
` : ''}

## API Reference

See the full API documentation at: https://docs.optimizely.com/sdk/${config.platform}
    `;
  }

  /**
   * Generate usage examples
   */
  private generateExamples(config: SDKConfiguration, integration: PlatformIntegration): { [key: string]: string } {
    const examples: { [key: string]: string } = {};

    if (config.platform === 'react') {
      examples.react = `
import React from 'react';
import { OptimizelyProvider, useExperiment } from '@optimizely/sdk-react';

function App() {
  return (
    <OptimizelyProvider apiKey="${integration.configuration.apiKey}">
      <HomePage />
    </OptimizelyProvider>
  );
}

function HomePage() {
  const { variation, isLoading } = useExperiment('homepage_cta');

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome!</h1>
      <button style={{ backgroundColor: variation?.color || 'blue' }}>
        {variation?.text || 'Click Me'}
      </button>
    </div>
  );
}
      `;
    }

    if (config.platform === 'vue') {
      examples.vue = `
<template>
  <div>
    <h1>Welcome!</h1>
    <button
      :style="{ backgroundColor: variation?.color || 'blue' }"
      @click="trackClick"
    >
      {{ variation?.text || 'Click Me' }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useOptimizely } from '@optimizely/sdk-vue';

const { sdk, state } = useOptimizely();
const variation = ref(null);

onMounted(async () => {
  if (state.isReady) {
    const experiment = await sdk.getExperiment('homepage_cta');
    variation.value = experiment?.variation;
  }
});

const trackClick = () => {
  sdk.track('button_click', { button: 'cta-primary' });
};
</script>
      `;
    }

    examples.vanilla = `
<!DOCTYPE html>
<html>
<head>
  <title>Optimizely Example</title>
  <script src="https://cdn.optimizely.com/sdks/optimizely-sdk-${config.platform}-${config.version}.js"></script>
</head>
<body>
  <h1>Welcome!</h1>
  <button id="cta-button">Click Me</button>

  <script>
    const optimizely = new OptimizelySDK({
      apiKey: '${integration.configuration.apiKey}',
      baseUrl: '${integration.configuration.baseUrl}'
    });

    optimizely.on('ready', function() {
      // Get personalization
      optimizely.getPersonalization();

      // Get experiments
      optimizely.getExperiments();
    });

    // Track button clicks
    document.getElementById('cta-button').addEventListener('click', function() {
      optimizely.track('button_click', {
        button: 'cta-primary',
        page: 'homepage'
      });
    });
  </script>
</body>
</html>
    `;

    return examples;
  }

  /**
   * Get base template for platform
   */
  private getBaseTemplate(platform: string): string {
    return this.sdkTemplates.get(platform) || this.sdkTemplates.get('universal')!;
  }

  /**
   * Generate cache key for SDK
   */
  private generateCacheKey(config: SDKConfiguration, integration: PlatformIntegration): string {
    return `${config.platform}_${config.version}_${config.features.join(',')}_${config.bundle}_${integration.platform}`;
  }

  /**
   * Get cached SDK
   */
  public getCachedSDK(cacheKey: string): GeneratedSDK | null {
    return this.generatedSDKs.get(cacheKey) || null;
  }

  /**
   * Clear SDK cache
   */
  public clearCache(): void {
    this.generatedSDKs.clear();
  }
}

export default SDKManager;
