/**
 * Environment Configuration Management System
 * 
 * This module provides a centralized way to manage environment-specific configurations
 * across the entire monorepo. It supports development, staging, and production environments
 * with proper type safety and validation.
 */

export type Environment = 'development' | 'staging' | 'production';

export interface DatabaseConfig {
  url?: string;
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl: boolean;
  sslRejectUnauthorized?: boolean;
  poolMin: number;
  poolMax: number;
  connectionTimeout?: number;
  idleTimeout?: number;
  maxRetries?: number;
}

export interface RedisConfig {
  url?: string;
  host: string;
  port: number;
  password?: string;
  db: number;
  ttlDefault: number;
  clusterMode?: boolean;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiry: string;
  sessionSecret: string;
  bcryptRounds: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
}

export interface FeatureFlags {
  analyticsEnabled: boolean;
  abTestingEnabled: boolean;
  psychographicAnalysis: boolean;
  realTimeOptimization: boolean;
  crmIntegration: boolean;
  debugMode: boolean;
  mockData: boolean;
}

export interface MonitoringConfig {
  sentryDsn?: string;
  newRelicLicenseKey?: string;
  newRelicAppName: string;
  performanceMonitoring: boolean;
  metricsCollection: boolean;
  apmEnabled?: boolean;
}

export interface EmailConfig {
  host: string;
  port: number;
  user?: string;
  password?: string;
  fromEmail: string;
  fromName: string;
}

export interface UploadConfig {
  maxSize: number;
  allowedTypes: string[];
}

export interface CacheConfig {
  ttlShort: number;
  ttlMedium: number;
  ttlLong: number;
}

export interface CDNConfig {
  cdnUrl?: string;
  staticAssetsUrl?: string;
}

export interface SSLConfig {
  enabled: boolean;
  forceHttps: boolean;
  hstsEnabled?: boolean;
  hstsMaxAge?: number;
}

export interface SecurityHeadersConfig {
  enabled: boolean;
  cspEnabled: boolean;
  referrerPolicy: string;
}

export interface BackupConfig {
  enabled: boolean;
  retentionDays: number;
  encryption?: boolean;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format?: 'simple' | 'json';
  rotation?: 'daily' | 'weekly';
  retentionDays?: number;
}

export interface AutoScalingConfig {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  cpuThreshold: number;
  memoryThreshold: number;
}

export interface PrivacyConfig {
  gdprCompliance: boolean;
  cookieConsentRequired: boolean;
  dataRetentionDays: number;
  anonymizeIp: boolean;
}

export interface AppConfig {
  name: string;
  version: string;
  environment: Environment;
  debug: boolean;
  
  // Server
  apiPort: number;
  webPort: number;
  host: string;
  corsOrigin: string;
  
  // Database
  database: DatabaseConfig;
  
  // Redis
  redis: RedisConfig;
  
  // Security
  security: SecurityConfig;
  
  // Rate limiting
  rateLimit: RateLimitConfig;
  
  // Feature flags
  features: FeatureFlags;
  
  // External APIs
  anthropicApiKey?: string;
  openaiApiKey?: string;
  gaTrackingId?: string;
  
  // Monitoring
  monitoring: MonitoringConfig;
  
  // Email
  email: EmailConfig;
  
  // File uploads
  upload: UploadConfig;
  
  // Cache
  cache: CacheConfig;
  
  // CDN
  cdn: CDNConfig;
  
  // SSL
  ssl: SSLConfig;
  
  // Security headers
  securityHeaders: SecurityHeadersConfig;
  
  // Backup
  backup: BackupConfig;
  
  // Logging
  logging: LoggingConfig;
  
  // Auto-scaling
  autoScaling: AutoScalingConfig;
  
  // Privacy
  privacy: PrivacyConfig;
  
  // Development tools
  hotReload: boolean;
  sourceMaps: boolean;
  typescriptCheck: boolean;
  minifyAssets?: boolean;
  compressResponses?: boolean;
  
  // Health checks
  healthCheckEnabled: boolean;
  healthCheckInterval?: number;
}

/**
 * Environment-specific configuration factory
 */
export class ConfigFactory {
  private static getEnvironment(): Environment {
    const env = process.env.NODE_ENV || process.env.ENVIRONMENT || 'development';
    if (!['development', 'staging', 'production'].includes(env)) {
      console.warn(`Unknown environment: ${env}, defaulting to development`);
      return 'development';
    }
    return env as Environment;
  }

  private static getRequired(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue;
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  private static getOptional(key: string, defaultValue: string = ''): string {
    return process.env[key] || defaultValue;
  }

  private static getNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      console.warn(`Invalid number for ${key}: ${value}, using default: ${defaultValue}`);
      return defaultValue;
    }
    return parsed;
  }

  private static getBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  public static create(): AppConfig {
    const environment = this.getEnvironment();
    
    return {
      name: this.getOptional('APP_NAME', 'Optimizely AI'),
      version: this.getOptional('APP_VERSION', '0.1.0'),
      environment,
      debug: this.getBoolean('DEBUG', environment === 'development'),
      
      // Server
      apiPort: this.getNumber('API_PORT', 4000),
      webPort: this.getNumber('WEB_PORT', 3001),
      host: this.getOptional('HOST', environment === 'development' ? 'localhost' : '0.0.0.0'),
      corsOrigin: this.getOptional('CORS_ORIGIN', 
        environment === 'development' ? 'http://localhost:3001' : 
        environment === 'staging' ? 'https://staging.optimizely-ai.com' : 
        'https://optimizely-ai.com'
      ),
      
      // Database
      database: {
        url: this.getOptional('DATABASE_URL'),
        host: this.getOptional('DB_HOST', 'localhost'),
        port: this.getNumber('DB_PORT', 5432),
        name: this.getOptional('DB_NAME', `optimizely_${environment}`),
        user: this.getOptional('DB_USER', `${environment}_user`),
        password: this.getOptional('DB_PASSWORD', `${environment}_password`),
        ssl: this.getBoolean('DB_SSL', environment !== 'development'),
        sslRejectUnauthorized: this.getBoolean('DB_SSL_REJECT_UNAUTHORIZED', environment === 'production'),
        poolMin: this.getNumber('DB_POOL_MIN', environment === 'development' ? 2 : environment === 'staging' ? 5 : 10),
        poolMax: this.getNumber('DB_POOL_MAX', environment === 'development' ? 10 : environment === 'staging' ? 20 : 50),
        connectionTimeout: this.getNumber('DB_CONNECTION_TIMEOUT', 30000),
        idleTimeout: this.getNumber('DB_IDLE_TIMEOUT', 10000),
        maxRetries: this.getNumber('DB_MAX_RETRIES', 3),
      },
      
      // Redis
      redis: {
        url: this.getOptional('REDIS_URL', 'redis://localhost:6379'),
        host: this.getOptional('REDIS_HOST', 'localhost'),
        port: this.getNumber('REDIS_PORT', 6379),
        password: this.getOptional('REDIS_PASSWORD'),
        db: this.getNumber('REDIS_DB', 0),
        ttlDefault: this.getNumber('REDIS_TTL_DEFAULT', 3600),
        clusterMode: this.getBoolean('REDIS_CLUSTER_MODE', environment === 'production'),
      },
      
      // Security
      security: {
        jwtSecret: this.getRequired('JWT_SECRET', 
          environment === 'development' ? 'dev_jwt_secret_change_in_production_this_is_not_secure' : undefined
        ),
        jwtExpiry: this.getOptional('JWT_EXPIRY', environment === 'production' ? '24h' : '7d'),
        sessionSecret: this.getRequired('SESSION_SECRET',
          environment === 'development' ? 'dev_session_secret_change_in_production' : undefined
        ),
        bcryptRounds: this.getNumber('BCRYPT_ROUNDS', 
          environment === 'development' ? 10 : environment === 'staging' ? 12 : 14
        ),
      },
      
      // Rate limiting
      rateLimit: {
        windowMs: this.getNumber('RATE_LIMIT_WINDOW_MS', 60000),
        maxRequests: this.getNumber('RATE_LIMIT_MAX_REQUESTS', 
          environment === 'development' ? 1000 : environment === 'staging' ? 100 : 50
        ),
        skipSuccessfulRequests: this.getBoolean('RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS', 
          environment === 'development'
        ),
      },
      
      // Feature flags
      features: {
        analyticsEnabled: this.getBoolean('FEATURE_ANALYTICS_ENABLED', true),
        abTestingEnabled: this.getBoolean('FEATURE_AB_TESTING_ENABLED', true),
        psychographicAnalysis: this.getBoolean('FEATURE_PSYCHOGRAPHIC_ANALYSIS', true),
        realTimeOptimization: this.getBoolean('FEATURE_REAL_TIME_OPTIMIZATION', true),
        crmIntegration: this.getBoolean('FEATURE_CRM_INTEGRATION', true),
        debugMode: this.getBoolean('FEATURE_DEBUG_MODE', environment === 'development'),
        mockData: this.getBoolean('FEATURE_MOCK_DATA', environment === 'development'),
      },
      
      // External APIs
      anthropicApiKey: this.getOptional('ANTHROPIC_API_KEY'),
      openaiApiKey: this.getOptional('OPENAI_API_KEY'),
      gaTrackingId: this.getOptional('GA_MEASUREMENT_ID'),
      
      // Monitoring
      monitoring: {
        sentryDsn: this.getOptional('SENTRY_DSN'),
        newRelicLicenseKey: this.getOptional('NEW_RELIC_LICENSE_KEY'),
        newRelicAppName: this.getOptional('NEW_RELIC_APP_NAME', `Optimizely AI ${environment}`),
        performanceMonitoring: this.getBoolean('PERFORMANCE_MONITORING', environment !== 'development'),
        metricsCollection: this.getBoolean('METRICS_COLLECTION', environment !== 'development'),
        apmEnabled: this.getBoolean('APM_ENABLED', environment === 'production'),
      },
      
      // Email
      email: {
        host: this.getOptional('SMTP_HOST', 'localhost'),
        port: this.getNumber('SMTP_PORT', environment === 'development' ? 1025 : 587),
        user: this.getOptional('SMTP_USER'),
        password: this.getOptional('SMTP_PASSWORD'),
        fromEmail: this.getOptional('SMTP_FROM_EMAIL', `${environment}@optimizely-ai.local`),
        fromName: this.getOptional('SMTP_FROM_NAME', `Optimizely AI ${environment}`),
      },
      
      // File uploads
      upload: {
        maxSize: this.getNumber('UPLOAD_MAX_SIZE', environment === 'production' ? 5242880 : 10485760),
        allowedTypes: this.getOptional('UPLOAD_ALLOWED_TYPES', 
          'image/jpeg,image/png,image/gif,image/webp,text/csv,application/json'
        ).split(','),
      },
      
      // Cache
      cache: {
        ttlShort: this.getNumber('CACHE_TTL_SHORT', environment === 'production' ? 600 : 300),
        ttlMedium: this.getNumber('CACHE_TTL_MEDIUM', environment === 'production' ? 3600 : 1800),
        ttlLong: this.getNumber('CACHE_TTL_LONG', 86400),
      },
      
      // CDN
      cdn: {
        cdnUrl: this.getOptional('CDN_URL'),
        staticAssetsUrl: this.getOptional('STATIC_ASSETS_URL'),
      },
      
      // SSL
      ssl: {
        enabled: this.getBoolean('SSL_ENABLED', environment !== 'development'),
        forceHttps: this.getBoolean('FORCE_HTTPS', environment !== 'development'),
        hstsEnabled: this.getBoolean('HSTS_ENABLED', environment === 'production'),
        hstsMaxAge: this.getNumber('HSTS_MAX_AGE', 31536000),
      },
      
      // Security headers
      securityHeaders: {
        enabled: this.getBoolean('SECURITY_HEADERS_ENABLED', environment === 'production'),
        cspEnabled: this.getBoolean('CSP_ENABLED', environment === 'production'),
        referrerPolicy: this.getOptional('REFERRER_POLICY', 'strict-origin-when-cross-origin'),
      },
      
      // Backup
      backup: {
        enabled: this.getBoolean('BACKUP_ENABLED', environment !== 'development'),
        retentionDays: this.getNumber('BACKUP_RETENTION_DAYS', 
          environment === 'staging' ? 7 : 30
        ),
        encryption: this.getBoolean('BACKUP_ENCRYPTION', environment === 'production'),
      },
      
      // Logging
      logging: {
        level: this.getOptional('LOG_LEVEL', 
          environment === 'development' ? 'debug' : 
          environment === 'staging' ? 'info' : 'warn'
        ) as 'debug' | 'info' | 'warn' | 'error',
        format: this.getOptional('LOG_FORMAT', environment === 'production' ? 'json' : 'simple') as 'simple' | 'json',
        rotation: this.getOptional('LOG_ROTATION', 'daily') as 'daily' | 'weekly',
        retentionDays: this.getNumber('LOG_RETENTION_DAYS', 30),
      },
      
      // Auto-scaling
      autoScaling: {
        enabled: this.getBoolean('AUTO_SCALING_ENABLED', environment === 'production'),
        minInstances: this.getNumber('MIN_INSTANCES', 2),
        maxInstances: this.getNumber('MAX_INSTANCES', 20),
        cpuThreshold: this.getNumber('CPU_THRESHOLD', 70),
        memoryThreshold: this.getNumber('MEMORY_THRESHOLD', 80),
      },
      
      // Privacy
      privacy: {
        gdprCompliance: this.getBoolean('GDPR_COMPLIANCE', environment === 'production'),
        cookieConsentRequired: this.getBoolean('COOKIE_CONSENT_REQUIRED', environment === 'production'),
        dataRetentionDays: this.getNumber('DATA_RETENTION_DAYS', 365),
        anonymizeIp: this.getBoolean('ANONYMIZE_IP', environment === 'production'),
      },
      
      // Development tools
      hotReload: this.getBoolean('HOT_RELOAD', environment === 'development'),
      sourceMaps: this.getBoolean('SOURCE_MAPS', environment === 'development'),
      typescriptCheck: this.getBoolean('TYPESCRIPT_CHECK', environment === 'development'),
      minifyAssets: this.getBoolean('MINIFY_ASSETS', environment === 'production'),
      compressResponses: this.getBoolean('COMPRESS_RESPONSES', environment === 'production'),
      
      // Health checks
      healthCheckEnabled: this.getBoolean('HEALTH_CHECK_ENABLED', environment !== 'development'),
      healthCheckInterval: this.getNumber('HEALTH_CHECK_INTERVAL', 30000),
    };
  }

  /**
   * Validate configuration for required values based on environment
   */
  public static validate(config: AppConfig): void {
    const errors: string[] = [];

    // Production-specific validations
    if (config.environment === 'production') {
      if (config.security.jwtSecret.includes('dev_') || config.security.jwtSecret.length < 32) {
        errors.push('Production JWT secret must be properly configured and at least 32 characters');
      }
      if (config.security.sessionSecret.includes('dev_') || config.security.sessionSecret.length < 32) {
        errors.push('Production session secret must be properly configured and at least 32 characters');
      }
      if (!config.monitoring.sentryDsn) {
        errors.push('Sentry DSN is required for production monitoring');
      }
      if (config.database.password.includes('REPLACE_WITH_ACTUAL')) {
        errors.push('Database password must be configured for production');
      }
    }

    // General validations
    if (config.features.crmIntegration && !config.anthropicApiKey && !config.openaiApiKey) {
      errors.push('At least one AI API key is required when CRM integration is enabled');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }
}

// Export singleton instance
export const config = ConfigFactory.create();

// Validate configuration on load
try {
  ConfigFactory.validate(config);
} catch (error) {
  console.error('Configuration validation failed:', error);
  if (config.environment === 'production') {
    process.exit(1);
  }
}

export default config;
