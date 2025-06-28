import { EventEmitter } from 'events';
import { redisManager } from './redis-client';

// =============================================================================
// INTERFACES & TYPES
// =============================================================================

export interface ErrorClassification {
  category: 'network' | 'authentication' | 'authorization' | 'validation' | 'rate_limit' | 'quota' | 'timeout' | 'server_error' | 'client_error' | 'system' | 'integration' | 'data_quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRetryable: boolean;
  isTemporary: boolean;
  requiresUserAction: boolean;
  escalationLevel: number;
}

export interface ErrorContext {
  service: string;
  operation: string;
  entityType?: string;
  entityId?: string;
  crmType?: string;
  crmInstanceId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorRecord {
  id: string;
  errorCode: string;
  errorMessage: string;
  classification: ErrorClassification;
  context: ErrorContext;
  originalError?: Error;
  stackTrace?: string;
  timestamp: Date;
  resolvedAt?: Date;
  resolution?: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  status: 'active' | 'retrying' | 'resolved' | 'failed' | 'ignored';
  correlationId?: string;
  parentErrorId?: string;
  childErrorIds: string[];
}

export interface RetryStrategy {
  type: 'exponential' | 'linear' | 'fixed' | 'custom';
  baseDelay: number;
  maxDelay: number;
  multiplier: number;
  jitter: boolean;
  maxRetries: number;
  retryableCategories: string[];
  customBackoffFunction?: (attempt: number, baseDelay: number) => number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
}

export interface CircuitBreakerState {
  id: string;
  service: string;
  operation: string;
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  nextAttemptTime?: Date;
  config: CircuitBreakerConfig;
  statistics: CircuitBreakerStats;
}

export interface CircuitBreakerStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  circuitOpenings: number;
  averageResponseTime: number;
  lastCalculated: Date;
}

export interface FallbackStrategy {
  id: string;
  service: string;
  operation: string;
  type: 'cache' | 'default_value' | 'alternative_service' | 'queue_for_later' | 'graceful_degradation' | 'custom';
  config: FallbackConfig;
  isActive: boolean;
  priority: number;
}

export interface FallbackConfig {
  cacheKey?: string;
  cacheTtl?: number;
  defaultValue?: any;
  alternativeService?: string;
  queueName?: string;
  degradationLevel?: 'minimal' | 'partial' | 'full';
  customHandler?: string;
  parameters?: Record<string, any>;
}

export interface ErrorNotification {
  id: string;
  errorId: string;
  channel: 'email' | 'slack' | 'webhook' | 'sms' | 'dashboard';
  recipients: string[];
  template: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'failed' | 'ignored';
  sentAt?: Date;
  metadata?: Record<string, any>;
}

export interface RecoveryWorkflow {
  id: string;
  name: string;
  errorCategories: string[];
  steps: RecoveryStep[];
  isActive: boolean;
  autoExecute: boolean;
  priority: number;
}

export interface RecoveryStep {
  id: string;
  name: string;
  type: 'retry' | 'fallback' | 'notification' | 'escalation' | 'data_correction' | 'service_restart' | 'custom';
  condition?: string;
  parameters: Record<string, any>;
  timeout: number;
  onSuccess?: string; // Next step ID
  onFailure?: string; // Next step ID
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByService: Record<string, number>;
  resolvedErrors: number;
  activeErrors: number;
  averageResolutionTime: number;
  errorRate: number;
  mttr: number; // Mean Time To Recovery
  mtbf: number; // Mean Time Between Failures
  lastCalculated: Date;
}

// =============================================================================
// UNIVERSAL ERROR HANDLING SERVICE
// =============================================================================

export default class UniversalErrorHandlingService extends EventEmitter {
  private errorRecords: Map<string, ErrorRecord> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private fallbackStrategies: Map<string, FallbackStrategy> = new Map();
  private recoveryWorkflows: Map<string, RecoveryWorkflow> = new Map();
  private retryQueues: Map<string, ErrorRecord[]> = new Map();
  private errorMetrics: ErrorMetrics | null = null;
  private notificationQueue: ErrorNotification[] = [];
  private isInitialized = false;
  private processingInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  // Default configurations
  private defaultRetryStrategy: RetryStrategy = {
    type: 'exponential',
    baseDelay: 1000,
    maxDelay: 60000,
    multiplier: 2,
    jitter: true,
    maxRetries: 5,
    retryableCategories: ['network', 'timeout', 'server_error', 'rate_limit', 'system']
  };

  private defaultCircuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 60000,
    monitoringPeriod: 300000,
    halfOpenMaxCalls: 3
  };

  constructor() {
    super();
    this.initializeService();
  }

  // =============================================================================
  // INITIALIZATION & SETUP
  // =============================================================================

  private async initializeService(): Promise<void> {
    try {
      await this.loadConfiguration();
      await this.initializeDefaultStrategies();
      await this.startErrorProcessing();
      await this.startMetricsCollection();
      await this.generateMockData();

      this.isInitialized = true;
      this.emit('service_initialized', {
        circuitBreakers: this.circuitBreakers.size,
        fallbackStrategies: this.fallbackStrategies.size,
        recoveryWorkflows: this.recoveryWorkflows.size,
        timestamp: Date.now()
      });

      console.log('🛡️ Universal Error Handling Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Universal Error Handling Service:', error);
      throw error;
    }
  }

  // =============================================================================
  // ERROR RECORDING & CLASSIFICATION
  // =============================================================================

  async recordError(
    error: Error | string,
    context: ErrorContext,
    classification?: Partial<ErrorClassification>
  ): Promise<string> {
    const errorId = this.generateErrorId();
    const timestamp = new Date();

    // Classify the error
    const errorClassification = classification ?
      { ...this.classifyError(error, context), ...classification } :
      this.classifyError(error, context);

    // Create error record
    const errorRecord: ErrorRecord = {
      id: errorId,
      errorCode: this.extractErrorCode(error),
      errorMessage: error instanceof Error ? error.message : error,
      classification: errorClassification,
      context,
      originalError: error instanceof Error ? error : undefined,
      stackTrace: error instanceof Error ? error.stack : undefined,
      timestamp,
      retryCount: 0,
      maxRetries: this.getMaxRetries(errorClassification, context),
      status: 'active',
      childErrorIds: []
    };

    // Store error record
    this.errorRecords.set(errorId, errorRecord);
    await this.persistErrorRecord(errorRecord);

    // Update circuit breaker
    await this.updateCircuitBreaker(context.service, context.operation, false);

    // Trigger notifications if needed
    if (errorClassification.severity === 'high' || errorClassification.severity === 'critical') {
      await this.queueNotification(errorRecord);
    }

    // Schedule retry if applicable
    if (errorClassification.isRetryable && errorRecord.retryCount < errorRecord.maxRetries) {
      await this.scheduleRetry(errorRecord);
    }

    // Execute recovery workflow if available
    await this.executeRecoveryWorkflow(errorRecord);

    this.emit('error_recorded', errorRecord);

    return errorId;
  }

  private classifyError(error: Error | string, context: ErrorContext): ErrorClassification {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorCode = this.extractErrorCode(error);

    // Network errors
    if (this.isNetworkError(errorMessage, errorCode)) {
      return {
        category: 'network',
        severity: 'medium',
        isRetryable: true,
        isTemporary: true,
        requiresUserAction: false,
        escalationLevel: 1
      };
    }

    // Authentication errors
    if (this.isAuthenticationError(errorMessage, errorCode)) {
      return {
        category: 'authentication',
        severity: 'high',
        isRetryable: false,
        isTemporary: false,
        requiresUserAction: true,
        escalationLevel: 2
      };
    }

    // Rate limit errors
    if (this.isRateLimitError(errorMessage, errorCode)) {
      return {
        category: 'rate_limit',
        severity: 'medium',
        isRetryable: true,
        isTemporary: true,
        requiresUserAction: false,
        escalationLevel: 1
      };
    }

    // Server errors
    if (this.isServerError(errorMessage, errorCode)) {
      return {
        category: 'server_error',
        severity: 'high',
        isRetryable: true,
        isTemporary: true,
        requiresUserAction: false,
        escalationLevel: 2
      };
    }

    // Validation errors
    if (this.isValidationError(errorMessage, errorCode)) {
      return {
        category: 'validation',
        severity: 'medium',
        isRetryable: false,
        isTemporary: false,
        requiresUserAction: true,
        escalationLevel: 1
      };
    }

    // Default classification
    return {
      category: 'system',
      severity: 'medium',
      isRetryable: true,
      isTemporary: true,
      requiresUserAction: false,
      escalationLevel: 1
    };
  }

  // =============================================================================
  // CIRCUIT BREAKER IMPLEMENTATION
  // =============================================================================

  async executeWithCircuitBreaker<T>(
    service: string,
    operation: string,
    fn: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const breakerId = `${service}:${operation}`;
    let circuitBreaker = this.circuitBreakers.get(breakerId);

    if (!circuitBreaker) {
      circuitBreaker = this.createCircuitBreaker(service, operation, config);
      this.circuitBreakers.set(breakerId, circuitBreaker);
    }

    // Check circuit breaker state
    if (circuitBreaker.state === 'open') {
      if (Date.now() < (circuitBreaker.nextAttemptTime?.getTime() || 0)) {
        throw new Error(`Circuit breaker is OPEN for ${service}:${operation}`);
      } else {
        circuitBreaker.state = 'half_open';
        circuitBreaker.successCount = 0;
      }
    }

    if (circuitBreaker.state === 'half_open' && circuitBreaker.successCount >= circuitBreaker.config.halfOpenMaxCalls) {
      throw new Error(`Circuit breaker is HALF_OPEN and max calls exceeded for ${service}:${operation}`);
    }

    const startTime = Date.now();

    try {
      const result = await fn();
      const responseTime = Date.now() - startTime;

      // Update success metrics
      await this.updateCircuitBreaker(service, operation, true, responseTime);

      return result;
    } catch (error) {
      // Update failure metrics
      await this.updateCircuitBreaker(service, operation, false);
      throw error;
    }
  }

  private createCircuitBreaker(
    service: string,
    operation: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreakerState {
    const finalConfig = { ...this.defaultCircuitBreakerConfig, ...config };

    return {
      id: `${service}:${operation}`,
      service,
      operation,
      state: 'closed',
      failureCount: 0,
      successCount: 0,
      config: finalConfig,
      statistics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        circuitOpenings: 0,
        averageResponseTime: 0,
        lastCalculated: new Date()
      }
    };
  }

  private async updateCircuitBreaker(
    service: string,
    operation: string,
    success: boolean,
    responseTime?: number
  ): Promise<void> {
    const breakerId = `${service}:${operation}`;
    let circuitBreaker = this.circuitBreakers.get(breakerId);

    if (!circuitBreaker) {
      circuitBreaker = this.createCircuitBreaker(service, operation);
      this.circuitBreakers.set(breakerId, circuitBreaker);
    }

    const now = new Date();
    circuitBreaker.statistics.totalRequests++;

    if (success) {
      circuitBreaker.successCount++;
      circuitBreaker.failureCount = 0;
      circuitBreaker.lastSuccessTime = now;
      circuitBreaker.statistics.successfulRequests++;

      if (responseTime) {
        const total = circuitBreaker.statistics.averageResponseTime * (circuitBreaker.statistics.totalRequests - 1);
        circuitBreaker.statistics.averageResponseTime = (total + responseTime) / circuitBreaker.statistics.totalRequests;
      }

      // Transition from half-open to closed
      if (circuitBreaker.state === 'half_open' && circuitBreaker.successCount >= circuitBreaker.config.successThreshold) {
        circuitBreaker.state = 'closed';
        circuitBreaker.failureCount = 0;
        this.emit('circuit_breaker_closed', { service, operation, circuitBreaker });
      }
    } else {
      circuitBreaker.failureCount++;
      circuitBreaker.successCount = 0;
      circuitBreaker.lastFailureTime = now;
      circuitBreaker.statistics.failedRequests++;

      // Transition to open state
      if (circuitBreaker.state === 'closed' && circuitBreaker.failureCount >= circuitBreaker.config.failureThreshold) {
        circuitBreaker.state = 'open';
        circuitBreaker.nextAttemptTime = new Date(now.getTime() + circuitBreaker.config.timeout);
        circuitBreaker.statistics.circuitOpenings++;
        this.emit('circuit_breaker_opened', { service, operation, circuitBreaker });
      }
    }

    await this.persistCircuitBreakerState(circuitBreaker);
  }

  // =============================================================================
  // RETRY MECHANISMS
  // =============================================================================

  async scheduleRetry(errorRecord: ErrorRecord, customStrategy?: Partial<RetryStrategy>): Promise<void> {
    if (errorRecord.retryCount >= errorRecord.maxRetries) {
      errorRecord.status = 'failed';
      await this.persistErrorRecord(errorRecord);
      this.emit('error_max_retries_exceeded', errorRecord);
      return;
    }

    const strategy = { ...this.defaultRetryStrategy, ...customStrategy };
    const delay = this.calculateRetryDelay(errorRecord.retryCount, strategy);

    errorRecord.nextRetryAt = new Date(Date.now() + delay);
    errorRecord.status = 'retrying';
    await this.persistErrorRecord(errorRecord);

    // Add to retry queue
    const queueKey = `${errorRecord.context.service}:${errorRecord.context.operation}`;
    if (!this.retryQueues.has(queueKey)) {
      this.retryQueues.set(queueKey, []);
    }
    this.retryQueues.get(queueKey)!.push(errorRecord);

    this.emit('error_scheduled_for_retry', { errorRecord, delay });
  }

  private calculateRetryDelay(attempt: number, strategy: RetryStrategy): number {
    let delay: number;

    switch (strategy.type) {
      case 'exponential':
        delay = strategy.baseDelay * Math.pow(strategy.multiplier, attempt);
        break;
      case 'linear':
        delay = strategy.baseDelay * (attempt + 1);
        break;
      case 'fixed':
        delay = strategy.baseDelay;
        break;
      case 'custom':
        delay = strategy.customBackoffFunction ?
          strategy.customBackoffFunction(attempt, strategy.baseDelay) :
          strategy.baseDelay;
        break;
      default:
        delay = strategy.baseDelay;
    }

    // Apply jitter if enabled
    if (strategy.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    // Cap at max delay
    return Math.min(delay, strategy.maxDelay);
  }

  // =============================================================================
  // FALLBACK MECHANISMS
  // =============================================================================

  async executeFallback(
    service: string,
    operation: string,
    originalError: ErrorRecord,
    data?: any
  ): Promise<any> {
    const fallbackKey = `${service}:${operation}`;
    const fallbackStrategy = this.fallbackStrategies.get(fallbackKey);

    if (!fallbackStrategy || !fallbackStrategy.isActive) {
      throw new Error(`No fallback strategy available for ${service}:${operation}`);
    }

    this.emit('fallback_executing', { service, operation, strategy: fallbackStrategy.type });

    try {
      let result: any;

      switch (fallbackStrategy.type) {
        case 'cache':
          result = await this.executeCacheFallback(fallbackStrategy.config, data);
          break;
        case 'default_value':
          result = fallbackStrategy.config.defaultValue;
          break;
        case 'alternative_service':
          result = await this.executeAlternativeServiceFallback(fallbackStrategy.config, data);
          break;
        case 'queue_for_later':
          result = await this.executeQueueFallback(fallbackStrategy.config, data);
          break;
        case 'graceful_degradation':
          result = await this.executeGracefulDegradation(fallbackStrategy.config, data);
          break;
        default:
          throw new Error(`Unsupported fallback type: ${fallbackStrategy.type}`);
      }

      this.emit('fallback_succeeded', { service, operation, result });
      return result;
    } catch (fallbackError) {
      this.emit('fallback_failed', { service, operation, error: fallbackError });
      throw fallbackError;
    }
  }

  private async executeCacheFallback(config: FallbackConfig, data?: any): Promise<any> {
    if (!config.cacheKey) {
      throw new Error('Cache key not specified for cache fallback');
    }

    const redis = redisManager.getClient();
    const cached = await redis.get(config.cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    throw new Error('No cached data available for fallback');
  }

  private async executeAlternativeServiceFallback(config: FallbackConfig, data?: any): Promise<any> {
    if (!config.alternativeService) {
      throw new Error('Alternative service not specified');
    }

    // This would integrate with service discovery or load balancer
    // For now, return a mock response
    return {
      source: 'alternative_service',
      service: config.alternativeService,
      data: data || {},
      timestamp: new Date()
    };
  }

  private async executeQueueFallback(config: FallbackConfig, data?: any): Promise<any> {
    if (!config.queueName) {
      throw new Error('Queue name not specified for queue fallback');
    }

    const redis = redisManager.getClient();
    await redis.lpush(config.queueName, JSON.stringify({
      data,
      timestamp: new Date(),
      retryAfter: Date.now() + 300000 // 5 minutes
    }));

    return {
      queued: true,
      queue: config.queueName,
      estimatedProcessingTime: '5 minutes'
    };
  }

  private async executeGracefulDegradation(config: FallbackConfig, data?: any): Promise<any> {
    const degradationLevel = config.degradationLevel || 'partial';

    switch (degradationLevel) {
      case 'minimal':
        return { status: 'degraded', level: 'minimal', message: 'Service running with minimal functionality' };
      case 'partial':
        return { status: 'degraded', level: 'partial', message: 'Service running with reduced functionality' };
      case 'full':
        return { status: 'unavailable', message: 'Service temporarily unavailable' };
      default:
        return { status: 'unknown' };
    }
  }

  // =============================================================================
  // RECOVERY WORKFLOWS
  // =============================================================================

  async executeRecoveryWorkflow(errorRecord: ErrorRecord): Promise<void> {
    const applicableWorkflows = Array.from(this.recoveryWorkflows.values())
      .filter(workflow =>
        workflow.isActive &&
        workflow.errorCategories.includes(errorRecord.classification.category)
      )
      .sort((a, b) => a.priority - b.priority);

    for (const workflow of applicableWorkflows) {
      if (workflow.autoExecute) {
        try {
          await this.executeWorkflow(workflow, errorRecord);
          break; // Stop after first successful workflow
        } catch (workflowError) {
          console.error(`Recovery workflow ${workflow.name} failed:`, workflowError);
        }
      }
    }
  }

  private async executeWorkflow(workflow: RecoveryWorkflow, errorRecord: ErrorRecord): Promise<void> {
    this.emit('recovery_workflow_started', { workflow: workflow.name, errorId: errorRecord.id });

    for (const step of workflow.steps) {
      try {
        await this.executeRecoveryStep(step, errorRecord);
        this.emit('recovery_step_completed', { workflow: workflow.name, step: step.name, errorId: errorRecord.id });
      } catch (stepError) {
        this.emit('recovery_step_failed', { workflow: workflow.name, step: step.name, error: stepError });

        if (step.onFailure) {
          const nextStep = workflow.steps.find(s => s.id === step.onFailure);
          if (nextStep) {
            await this.executeRecoveryStep(nextStep, errorRecord);
          }
        }
        break;
      }
    }

    this.emit('recovery_workflow_completed', { workflow: workflow.name, errorId: errorRecord.id });
  }

  private async executeRecoveryStep(step: RecoveryStep, errorRecord: ErrorRecord): Promise<void> {
    switch (step.type) {
      case 'retry':
        await this.scheduleRetry(errorRecord);
        break;
      case 'fallback':
        await this.executeFallback(
          errorRecord.context.service,
          errorRecord.context.operation,
          errorRecord
        );
        break;
      case 'notification':
        await this.queueNotification(errorRecord);
        break;
      case 'escalation':
        await this.escalateError(errorRecord);
        break;
      default:
        console.warn(`Unsupported recovery step type: ${step.type}`);
    }
  }

  // =============================================================================
  // ERROR RESOLUTION & MONITORING
  // =============================================================================

  async resolveError(errorId: string, resolution: string): Promise<boolean> {
    const errorRecord = this.errorRecords.get(errorId);
    if (!errorRecord) {
      return false;
    }

    errorRecord.status = 'resolved';
    errorRecord.resolvedAt = new Date();
    errorRecord.resolution = resolution;

    await this.persistErrorRecord(errorRecord);
    this.emit('error_resolved', errorRecord);

    return true;
  }

  async escalateError(errorRecord: ErrorRecord): Promise<void> {
    // Increase escalation level
    errorRecord.classification.escalationLevel++;

    // Create escalation notification
    const notification: ErrorNotification = {
      id: this.generateNotificationId(),
      errorId: errorRecord.id,
      channel: 'email',
      recipients: this.getEscalationRecipients(errorRecord.classification.escalationLevel),
      template: 'error_escalation',
      priority: 'urgent',
      status: 'pending',
      metadata: {
        escalationLevel: errorRecord.classification.escalationLevel,
        originalTimestamp: errorRecord.timestamp
      }
    };

    this.notificationQueue.push(notification);
    this.emit('error_escalated', { errorRecord, notification });
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private isNetworkError(message: string, code: string): boolean {
    const networkPatterns = [
      /network/i, /connection/i, /timeout/i, /unreachable/i,
      /ECONNREFUSED/i, /ENOTFOUND/i, /ETIMEDOUT/i
    ];
    return networkPatterns.some(pattern => pattern.test(message) || pattern.test(code));
  }

  private isAuthenticationError(message: string, code: string): boolean {
    const authPatterns = [
      /unauthorized/i, /authentication/i, /invalid.*token/i,
      /401/, /403/
    ];
    return authPatterns.some(pattern => pattern.test(message) || pattern.test(code));
  }

  private isRateLimitError(message: string, code: string): boolean {
    const rateLimitPatterns = [
      /rate.*limit/i, /too.*many.*requests/i, /429/
    ];
    return rateLimitPatterns.some(pattern => pattern.test(message) || pattern.test(code));
  }

  private isServerError(message: string, code: string): boolean {
    const serverErrorPatterns = [
      /internal.*server/i, /server.*error/i, /5\d{2}/
    ];
    return serverErrorPatterns.some(pattern => pattern.test(message) || pattern.test(code));
  }

  private isValidationError(message: string, code: string): boolean {
    const validationPatterns = [
      /validation/i, /invalid.*data/i, /bad.*request/i, /400/
    ];
    return validationPatterns.some(pattern => pattern.test(message) || pattern.test(code));
  }

  private extractErrorCode(error: Error | string): string {
    if (typeof error === 'string') {
      return 'UNKNOWN_ERROR';
    }

    // Try to extract from error properties
    const errorAny = error as any;
    return errorAny.code || errorAny.status || errorAny.statusCode || 'UNKNOWN_ERROR';
  }

  private getMaxRetries(classification: ErrorClassification, context: ErrorContext): number {
    if (!classification.isRetryable) return 0;

    switch (classification.category) {
      case 'network':
      case 'timeout':
        return 5;
      case 'rate_limit':
        return 3;
      case 'server_error':
        return 4;
      default:
        return 3;
    }
  }

  private getEscalationRecipients(level: number): string[] {
    switch (level) {
      case 1:
        return ['support@company.com'];
      case 2:
        return ['support@company.com', 'engineering@company.com'];
      case 3:
        return ['support@company.com', 'engineering@company.com', 'management@company.com'];
      default:
        return ['critical@company.com'];
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // =============================================================================
  // PERSISTENCE & DATA MANAGEMENT
  // =============================================================================

  private async persistErrorRecord(errorRecord: ErrorRecord): Promise<void> {
    const redis = redisManager.getClient();
    await redis.hset('error_records', errorRecord.id, JSON.stringify(errorRecord));
    await redis.expire('error_records', 86400 * 30); // 30 days
  }

  private async persistCircuitBreakerState(circuitBreaker: CircuitBreakerState): Promise<void> {
    const redis = redisManager.getClient();
    await redis.hset('circuit_breakers', circuitBreaker.id, JSON.stringify(circuitBreaker));
  }

  private async loadConfiguration(): Promise<void> {
    const redis = redisManager.getClient();

    // Load error records
    const errorRecordsData = await redis.hgetall('error_records');
    if (errorRecordsData) {
      Object.entries(errorRecordsData).forEach(([id, data]) => {
        const record = JSON.parse(data);
        record.timestamp = new Date(record.timestamp);
        record.resolvedAt = record.resolvedAt ? new Date(record.resolvedAt) : undefined;
        record.nextRetryAt = record.nextRetryAt ? new Date(record.nextRetryAt) : undefined;
        this.errorRecords.set(id, record);
      });
    }

    // Load circuit breaker states
    const circuitBreakersData = await redis.hgetall('circuit_breakers');
    if (circuitBreakersData) {
      Object.entries(circuitBreakersData).forEach(([id, data]) => {
        const state = JSON.parse(data);
        state.lastFailureTime = state.lastFailureTime ? new Date(state.lastFailureTime) : undefined;
        state.lastSuccessTime = state.lastSuccessTime ? new Date(state.lastSuccessTime) : undefined;
        state.nextAttemptTime = state.nextAttemptTime ? new Date(state.nextAttemptTime) : undefined;
        state.statistics.lastCalculated = new Date(state.statistics.lastCalculated);
        this.circuitBreakers.set(id, state);
      });
    }
  }

  private async initializeDefaultStrategies(): Promise<void> {
    // Add default fallback strategies
    await this.addFallbackStrategy({
      id: 'crm_sync_cache_fallback',
      service: 'sync-engine',
      operation: 'sync_data',
      type: 'cache',
      config: {
        cacheKey: 'last_successful_sync',
        cacheTtl: 3600
      },
      isActive: true,
      priority: 1
    });

    await this.addFallbackStrategy({
      id: 'webhook_queue_fallback',
      service: 'webhook-processing',
      operation: 'process_webhook',
      type: 'queue_for_later',
      config: {
        queueName: 'failed_webhooks'
      },
      isActive: true,
      priority: 2
    });

    // Add default recovery workflows
    await this.addRecoveryWorkflow({
      id: 'network_error_recovery',
      name: 'Network Error Recovery',
      errorCategories: ['network', 'timeout'],
      steps: [
        {
          id: 'step_1',
          name: 'Retry with backoff',
          type: 'retry',
          parameters: { strategy: 'exponential' },
          timeout: 30000
        },
        {
          id: 'step_2',
          name: 'Use cache fallback',
          type: 'fallback',
          parameters: { type: 'cache' },
          timeout: 5000
        }
      ],
      isActive: true,
      autoExecute: true,
      priority: 1
    });
  }

  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================

  async addFallbackStrategy(strategy: FallbackStrategy): Promise<void> {
    this.fallbackStrategies.set(strategy.id, strategy);
    const redis = redisManager.getClient();
    await redis.hset('fallback_strategies', strategy.id, JSON.stringify(strategy));
  }

  async addRecoveryWorkflow(workflow: RecoveryWorkflow): Promise<void> {
    this.recoveryWorkflows.set(workflow.id, workflow);
    const redis = redisManager.getClient();
    await redis.hset('recovery_workflows', workflow.id, JSON.stringify(workflow));
  }

  async queueNotification(errorRecord: ErrorRecord): Promise<void> {
    const notification: ErrorNotification = {
      id: this.generateNotificationId(),
      errorId: errorRecord.id,
      channel: this.getNotificationChannel(errorRecord.classification.severity),
      recipients: this.getNotificationRecipients(errorRecord.classification.severity),
      template: 'error_notification',
      priority: this.mapSeverityToPriority(errorRecord.classification.severity),
      status: 'pending'
    };

    this.notificationQueue.push(notification);
    this.emit('notification_queued', notification);
  }

  private getNotificationChannel(severity: string): 'email' | 'slack' | 'webhook' | 'sms' | 'dashboard' {
    switch (severity) {
      case 'critical': return 'slack';
      case 'high': return 'email';
      default: return 'dashboard';
    }
  }

  private getNotificationRecipients(severity: string): string[] {
    switch (severity) {
      case 'critical': return ['critical-alerts@company.com'];
      case 'high': return ['alerts@company.com'];
      default: return ['monitoring@company.com'];
    }
  }

  private mapSeverityToPriority(severity: string): 'low' | 'medium' | 'high' | 'urgent' {
    switch (severity) {
      case 'critical': return 'urgent';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  getErrorRecords(filters?: { status?: string; category?: string; service?: string }): ErrorRecord[] {
    let records = Array.from(this.errorRecords.values());

    if (filters) {
      if (filters.status) {
        records = records.filter(r => r.status === filters.status);
      }
      if (filters.category) {
        records = records.filter(r => r.classification.category === filters.category);
      }
      if (filters.service) {
        records = records.filter(r => r.context.service === filters.service);
      }
    }

    return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getCircuitBreakerStates(): CircuitBreakerState[] {
    return Array.from(this.circuitBreakers.values());
  }

  async calculateMetrics(): Promise<ErrorMetrics> {
    const allErrors = Array.from(this.errorRecords.values());
    const activeErrors = allErrors.filter(e => e.status === 'active' || e.status === 'retrying');
    const resolvedErrors = allErrors.filter(e => e.status === 'resolved');

    // Calculate resolution times
    const resolutionTimes = resolvedErrors
      .filter(e => e.resolvedAt)
      .map(e => e.resolvedAt!.getTime() - e.timestamp.getTime());

    const averageResolutionTime = resolutionTimes.length > 0 ?
      resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length : 0;

    // Group by category
    const errorsByCategory: Record<string, number> = {};
    allErrors.forEach(error => {
      const category = error.classification.category;
      errorsByCategory[category] = (errorsByCategory[category] || 0) + 1;
    });

    // Group by severity
    const errorsBySeverity: Record<string, number> = {};
    allErrors.forEach(error => {
      const severity = error.classification.severity;
      errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + 1;
    });

    // Group by service
    const errorsByService: Record<string, number> = {};
    allErrors.forEach(error => {
      const service = error.context.service;
      errorsByService[service] = (errorsByService[service] || 0) + 1;
    });

    const metrics: ErrorMetrics = {
      totalErrors: allErrors.length,
      errorsByCategory,
      errorsBySeverity,
      errorsByService,
      resolvedErrors: resolvedErrors.length,
      activeErrors: activeErrors.length,
      averageResolutionTime,
      errorRate: allErrors.length > 0 ? (allErrors.length - resolvedErrors.length) / allErrors.length : 0,
      mttr: averageResolutionTime,
      mtbf: 0, // Would need historical data to calculate
      lastCalculated: new Date()
    };

    this.errorMetrics = metrics;
    return metrics;
  }

  getMetrics(): ErrorMetrics | null {
    return this.errorMetrics;
  }

  // =============================================================================
  // BACKGROUND PROCESSING
  // =============================================================================

  private async startErrorProcessing(): Promise<void> {
    this.processingInterval = setInterval(async () => {
      await this.processRetryQueue();
      await this.processNotificationQueue();
    }, 5000); // Process every 5 seconds
  }

  private async processRetryQueue(): Promise<void> {
    const now = Date.now();

    for (const [queueKey, errors] of this.retryQueues.entries()) {
      const readyToRetry = errors.filter(error =>
        error.nextRetryAt && error.nextRetryAt.getTime() <= now
      );

      for (const error of readyToRetry) {
        error.retryCount++;
        error.status = 'active';
        error.nextRetryAt = undefined;

        // Remove from retry queue
        const index = errors.indexOf(error);
        if (index > -1) {
          errors.splice(index, 1);
        }

        await this.persistErrorRecord(error);
        this.emit('error_retry_executed', error);
      }
    }
  }

  private async processNotificationQueue(): Promise<void> {
    const pendingNotifications = this.notificationQueue.filter(n => n.status === 'pending');

    for (const notification of pendingNotifications) {
      try {
        await this.sendNotification(notification);
        notification.status = 'sent';
        notification.sentAt = new Date();
      } catch (error) {
        notification.status = 'failed';
        console.error('Failed to send notification:', error);
      }
    }
  }

  private async sendNotification(notification: ErrorNotification): Promise<void> {
    // Mock notification sending
    console.log(`📧 Sending ${notification.channel} notification to ${notification.recipients.join(', ')}`);
    console.log(`   Priority: ${notification.priority}, Template: ${notification.template}`);
  }

  private async startMetricsCollection(): Promise<void> {
    // Calculate metrics every 30 seconds
    this.metricsInterval = setInterval(async () => {
      await this.calculateMetrics();
    }, 30000);
  }

  private async generateMockData(): Promise<void> {
    // Generate some mock error records for testing
    const mockErrors = [
      {
        error: new Error('Connection timeout'),
        context: { service: 'crm-sync', operation: 'sync_contacts', crmType: 'salesforce' }
      },
      {
        error: new Error('Rate limit exceeded'),
        context: { service: 'webhook-processing', operation: 'process_webhook', crmType: 'hubspot' }
      },
      {
        error: new Error('Invalid authentication token'),
        context: { service: 'oauth', operation: 'refresh_token', crmType: 'pipedrive' }
      }
    ];

    for (const mockError of mockErrors) {
      await this.recordError(mockError.error, mockError.context as ErrorContext);
    }
  }

  async getHealthStatus(): Promise<{ status: string; details: Record<string, any> }> {
    const metrics = await this.calculateMetrics();
    const circuitBreakers = this.getCircuitBreakerStates();
    const openCircuitBreakers = circuitBreakers.filter(cb => cb.state === 'open');

    let status = 'healthy';
    if (openCircuitBreakers.length > 0 || (metrics && metrics.errorRate > 0.1)) {
      status = 'degraded';
    }
    if (openCircuitBreakers.length > 3 || (metrics && metrics.errorRate > 0.3)) {
      status = 'unhealthy';
    }

    return {
      status,
      details: {
        totalErrors: metrics?.totalErrors || 0,
        activeErrors: metrics?.activeErrors || 0,
        errorRate: metrics?.errorRate || 0,
        circuitBreakers: {
          total: circuitBreakers.length,
          open: openCircuitBreakers.length,
          halfOpen: circuitBreakers.filter(cb => cb.state === 'half_open').length,
          closed: circuitBreakers.filter(cb => cb.state === 'closed').length
        },
        fallbackStrategies: this.fallbackStrategies.size,
        recoveryWorkflows: this.recoveryWorkflows.size,
        lastCalculated: metrics?.lastCalculated || new Date()
      }
    };
  }

  async shutdown(): Promise<void> {
    console.log('🛡️ Shutting down Universal Error Handling Service...');

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Final persistence
    for (const errorRecord of this.errorRecords.values()) {
      await this.persistErrorRecord(errorRecord);
    }
    for (const circuitBreaker of this.circuitBreakers.values()) {
      await this.persistCircuitBreakerState(circuitBreaker);
    }

    this.emit('service_shutdown');
  }
}
