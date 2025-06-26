import { EventEmitter } from '../core/EventEmitter';
import {
  FallbackTransport,
  HeartbeatConfig,
  QueuedMessage,
  WebSocketConfig,
  WebSocketConnectionState,
  WebSocketManagerInterface,
  WebSocketMessage,
  WebSocketMetrics
} from '../types';
import { generateId, isBrowser, now } from '../utils';

/**
 * Universal WebSocket Manager
 * Provides real-time communication with reconnection, queuing, and fallback support
 */
export class WebSocketManager extends EventEmitter implements WebSocketManagerInterface {
  public readonly name: string = 'WebSocketManager';

  private _config: Required<WebSocketConfig>;
  private _socket: WebSocket | null = null;
  private _connectionState: WebSocketConnectionState;
  private _metrics: WebSocketMetrics;
  private _messageQueue: QueuedMessage[] = [];
  private _heartbeatConfig: HeartbeatConfig;
  private _fallbackTransport: FallbackTransport | null = null;

  // Timers and intervals
  private _heartbeatInterval: number | null = null;
  private _heartbeatTimeout: number | null = null;
  private _reconnectTimeout: number | null = null;
  private _queueProcessorInterval: number | null = null;

  // Session tracking
  private _sessionId?: string;
  private _visitorId?: string;
  private _heartbeatsMissed: number = 0;
  private _destroyed: boolean = false;

  // Ping/Pong tracking for latency
  private _pendingPings: Map<string, number> = new Map();

  constructor(config: Partial<WebSocketConfig> = {}) {
    super();

    // Default configuration
    this._config = {
      url: config.url || '',
      protocols: config.protocols || [],
      reconnect: config.reconnect !== false,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      messageQueueSize: config.messageQueueSize || 1000,
      enableCompression: config.enableCompression !== false,
      enableFallback: config.enableFallback !== false,
      fallbackUrl: config.fallbackUrl || '',
      timeout: config.timeout || 10000,
      debug: config.debug || false,
    };

    this._connectionState = {
      status: 'disconnected',
      url: this._config.url,
      reconnectAttempts: 0,
    };

    this._metrics = {
      messagesSet: 0,
      messagesReceived: 0,
      reconnections: 0,
      errors: 0,
      averageLatency: 0,
      uptime: 0,
      lastActivity: 0,
    };

    this._heartbeatConfig = {
      interval: this._config.heartbeatInterval,
      timeout: 5000,
      maxMissed: 3,
      enabled: true,
    };

    if (this._config.enableFallback && this._config.fallbackUrl) {
      this._fallbackTransport = {
        type: 'http',
        url: this._config.fallbackUrl,
        enabled: true,
        retryInterval: 10000,
      };
    }
  }

  /**
   * Initialize the WebSocket manager
   */
  init(): void {
    if (!isBrowser()) {
      if (this._config.debug) {
        console.warn('[WebSocketManager] Not in browser environment');
      }
      return;
    }

    // Start queue processor
    this._startQueueProcessor();

    if (this._config.debug) {
      console.log('[WebSocketManager] Initialized with config:', this._config);
    }
  }

  /**
   * Set session context for messages
   */
  setSessionContext(sessionId: string, visitorId: string): void {
    this._sessionId = sessionId;
    this._visitorId = visitorId;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(url?: string): Promise<void> {
    if (this._destroyed) {
      throw new Error('WebSocketManager has been destroyed');
    }

    const connectUrl = url || this._config.url;
    if (!connectUrl) {
      throw new Error('WebSocket URL is required');
    }

    // Already connected to same URL
    if (this._socket?.readyState === WebSocket.OPEN && this._connectionState.url === connectUrl) {
      return;
    }

    // Close existing connection
    if (this._socket) {
      this._cleanupConnection();
    }

    return new Promise((resolve, reject) => {
      try {
        this._connectionState = {
          ...this._connectionState,
          status: 'connecting',
          url: connectUrl,
        };
        delete this._connectionState.lastError;

        // Create WebSocket connection
        this._socket = new WebSocket(connectUrl, this._config.protocols);

        // Configure binary type for potential binary data
        this._socket.binaryType = 'arraybuffer';

        // Setup event handlers
        this._socket.onopen = (event) => {
          this._onOpen(event);
          resolve();
        };

        this._socket.onclose = (event) => {
          this._onClose(event);
        };

        this._socket.onerror = (event) => {
          this._onError(event as ErrorEvent);
          reject(new Error('WebSocket connection failed'));
        };

        this._socket.onmessage = (event) => {
          this._onMessage(event);
        };

        // Connection timeout
        setTimeout(() => {
          if (this._socket?.readyState === WebSocket.CONNECTING) {
            this._socket.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, this._config.timeout);

      } catch (error) {
        this._connectionState.status = 'error';
        this._connectionState.lastError = error as Error;
        reject(error);
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this._socket) {
      this._socket.close(1000, 'Normal closure');
    }
    this._cleanupConnection();
    this._connectionState.status = 'disconnected';
  }

  /**
   * Reconnect to WebSocket
   */
  async reconnect(): Promise<void> {
    if (this._connectionState.reconnectAttempts >= this._config.maxReconnectAttempts) {
      if (this._config.debug) {
        console.warn('[WebSocketManager] Max reconnect attempts reached');
      }

      // Try fallback if available
      if (this._config.enableFallback && this._fallbackTransport) {
        this._activateFallback('Max reconnection attempts reached');
        return;
      }

      throw new Error('Max reconnection attempts reached');
    }

    this._connectionState.status = 'reconnecting';
    this._connectionState.reconnectAttempts++;
    this._metrics.reconnections++;

    this.emit('connection:reconnecting', this._connectionState);

    try {
      await this.connect();
      this._connectionState.reconnectAttempts = 0; // Reset on successful reconnection
      this.emit('connection:reconnected', this._connectionState);
    } catch (error) {
      if (this._config.debug) {
        console.error('[WebSocketManager] Reconnection failed:', error);
      }

      // Schedule next reconnection attempt
      this._scheduleReconnection();
      throw error;
    }
  }

  /**
   * Send a WebSocket message
   */
  async send(message: Omit<WebSocketMessage, 'id' | 'timestamp' | 'sessionId' | 'visitorId'>): Promise<boolean> {
    const fullMessage: WebSocketMessage = {
      ...message,
      id: generateId(),
      timestamp: now(),
      sessionId: this._sessionId || 'unknown',
      visitorId: this._visitorId || 'unknown',
    };

    // Add to queue if not connected
    if (!this.isConnected) {
      this._queueMessage(fullMessage);
      return false;
    }

    try {
      this._socket!.send(JSON.stringify(fullMessage));
      this._metrics.messagesSet++;
      this._metrics.lastActivity = now();

      this.emit('message:sent', fullMessage);
      return true;
    } catch (error) {
      if (this._config.debug) {
        console.error('[WebSocketManager] Send failed:', error);
      }

      this._queueMessage(fullMessage);
      this.emit('message:failed', { message: fullMessage, error: error as Error });
      return false;
    }
  }

  /**
   * Send an event message
   */
  async sendEvent(event: string, data?: any, priority: WebSocketMessage['priority'] = 'normal'): Promise<boolean> {
    return this.send({
      type: 'event',
      data: { event, ...data },
      priority,
      retry: priority !== 'low',
    });
  }

  /**
   * Send heartbeat message
   */
  sendHeartbeat(): void {
    if (!this.isConnected) return;

    const pingId = generateId();
    const timestamp = now();

    this._pendingPings.set(pingId, timestamp);

    this.send({
      type: 'heartbeat',
      data: { pingId, timestamp },
      priority: 'critical',
      retry: false,
    });

    this._heartbeatsMissed = 0;
    this.emit('heartbeat:sent', { timestamp });
  }

  /**
   * Get current connection state
   */
  getConnectionState(): WebSocketConnectionState {
    return { ...this._connectionState };
  }

  /**
   * Get connection metrics
   */
  getMetrics(): WebSocketMetrics {
    const uptime = this._connectionState.connectedAt ?
      now() - this._connectionState.connectedAt : 0;

    return {
      ...this._metrics,
      uptime,
    };
  }

  /**
   * Clear message queue
   */
  clearQueue(): void {
    this._messageQueue = [];
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this._socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  get connectionState(): WebSocketConnectionState {
    return this._connectionState;
  }

  /**
   * Get metrics
   */
  get metrics(): WebSocketMetrics {
    return this.getMetrics();
  }

  /**
   * Get queue size
   */
  get queueSize(): number {
    return this._messageQueue.length;
  }

  /**
   * Destroy WebSocket manager
   */
  destroy(): void {
    this._destroyed = true;

    // Close connection
    this.disconnect();

    // Clear all timers
    this._clearTimers();

    // Clear queue
    this.clearQueue();

    // Clear event listeners
    this.removeAllListeners();

    if (this._config.debug) {
      console.log('[WebSocketManager] Destroyed');
    }
  }

  /**
   * Handle WebSocket open event
   */
  private _onOpen(_event: Event): void {
    this._connectionState = {
      ...this._connectionState,
      status: 'connected',
      connectedAt: now(),
    };
    delete this._connectionState.disconnectedAt;
    delete this._connectionState.lastError;

    // Start heartbeat
    if (this._heartbeatConfig.enabled) {
      this._startHeartbeat();
    }

    // Process queued messages
    this._processQueue();

    this.emit('connection:open', this._connectionState);

    if (this._config.debug) {
      console.log('[WebSocketManager] Connected to:', this._connectionState.url);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private _onClose(event: CloseEvent): void {
    const wasConnected = this._connectionState.status === 'connected';

    this._connectionState = {
      ...this._connectionState,
      status: 'disconnected',
      disconnectedAt: now(),
    };

    this._cleanupConnection();

    this.emit('connection:close', this._connectionState);

    if (this._config.debug) {
      console.log('[WebSocketManager] Disconnected:', event.code, event.reason);
    }

    // Auto-reconnect if enabled and was previously connected
    if (this._config.reconnect && wasConnected && !this._destroyed) {
      this._scheduleReconnection();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private _onError(event: ErrorEvent): void {
    const error = new Error(event.message || 'WebSocket error');

    this._connectionState.lastError = error;
    this._connectionState.status = 'error';
    this._metrics.errors++;

    this.emit('connection:error', { error, state: this._connectionState });

    if (this._config.debug) {
      console.error('[WebSocketManager] Error:', error);
    }
  }

  /**
   * Handle WebSocket message event
   */
  private _onMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      this._metrics.messagesReceived++;
      this._metrics.lastActivity = now();

      // Handle heartbeat response
      if (message.type === 'heartbeat' && message.data?.pingId) {
        this._handleHeartbeatResponse(message);
        return;
      }

      // Handle acknowledgment
      if (message.type === 'ack') {
        this._handleAcknowledgment(message);
        return;
      }

      this.emit('message:received', message);

      if (this._config.debug) {
        console.log('[WebSocketManager] Message received:', message);
      }

    } catch (error) {
      if (this._config.debug) {
        console.error('[WebSocketManager] Failed to parse message:', error);
      }
    }
  }

  /**
   * Handle heartbeat response
   */
  private _handleHeartbeatResponse(message: WebSocketMessage): void {
    const { pingId, timestamp } = message.data;

    if (this._pendingPings.has(pingId)) {
      const sendTime = this._pendingPings.get(pingId)!;
      const latency = now() - sendTime;

      // Update average latency
      this._connectionState.latency = latency;
      this._metrics.averageLatency =
        (this._metrics.averageLatency + latency) / 2;

      this._pendingPings.delete(pingId);
      this._heartbeatsMissed = 0;

      this.emit('heartbeat:received', { timestamp, latency });
    }
  }

  /**
   * Handle message acknowledgment
   */
  private _handleAcknowledgment(message: WebSocketMessage): void {
    // Remove acknowledged message from queue if it exists
    const messageId = message.data?.messageId;
    if (messageId) {
      this._messageQueue = this._messageQueue.filter(msg => msg.id !== messageId);
    }
  }

  /**
   * Queue a message for later sending
   */
  private _queueMessage(message: WebSocketMessage): void {
    // Check queue size limit
    if (this._messageQueue.length >= this._config.messageQueueSize) {
      const dropped = this._messageQueue.shift()!;
      this.emit('queue:full', { size: this._messageQueue.length, dropped });
    }

    const queuedMessage: QueuedMessage = {
      ...message,
      attempts: 0,
      nextRetry: now(),
      maxRetries: message.priority === 'critical' ? 5 : 3,
    };

    this._messageQueue.push(queuedMessage);
    this.emit('message:queued', message);
  }

  /**
   * Process queued messages
   */
  private _processQueue(): void {
    if (!this.isConnected || this._messageQueue.length === 0) {
      return;
    }

    const messagesToSend = this._messageQueue.filter(msg =>
      msg.nextRetry <= now() && msg.attempts < msg.maxRetries
    );

    for (const message of messagesToSend) {
      try {
        this._socket!.send(JSON.stringify(message));

        // Remove from queue on successful send
        this._messageQueue = this._messageQueue.filter(msg => msg.id !== message.id);

        this._metrics.messagesSet++;
        this.emit('message:sent', message);

      } catch (error) {
        // Update retry info
        message.attempts++;
        message.nextRetry = now() + (message.attempts * 1000);

        if (message.attempts >= message.maxRetries) {
          // Remove failed message
          this._messageQueue = this._messageQueue.filter(msg => msg.id !== message.id);
          this.emit('message:failed', { message, error: error as Error });
        }
      }
    }
  }

  /**
   * Start queue processor
   */
  private _startQueueProcessor(): void {
    if (this._queueProcessorInterval) {
      clearInterval(this._queueProcessorInterval);
    }

    this._queueProcessorInterval = window.setInterval(() => {
      this._processQueue();
    }, 1000);
  }

  /**
   * Start heartbeat mechanism
   */
  private _startHeartbeat(): void {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
    }

    this._heartbeatInterval = window.setInterval(() => {
      if (this.isConnected) {
        this.sendHeartbeat();

        // Check for missed heartbeats
        this._heartbeatTimeout = window.setTimeout(() => {
          this._heartbeatsMissed++;

          if (this._heartbeatsMissed >= this._heartbeatConfig.maxMissed) {
            if (this._config.debug) {
              console.warn('[WebSocketManager] Too many missed heartbeats, reconnecting');
            }
            this.reconnect().catch(() => {
              // Reconnection will be handled by the close event
            });
          }
        }, this._heartbeatConfig.timeout);
      }
    }, this._heartbeatConfig.interval);
  }

  /**
   * Schedule reconnection attempt
   */
  private _scheduleReconnection(): void {
    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout);
    }

    const delay = this._config.reconnectInterval *
      Math.pow(1.5, this._connectionState.reconnectAttempts);

    this._reconnectTimeout = window.setTimeout(() => {
      if (!this._destroyed && this._connectionState.status !== 'connected') {
        this.reconnect().catch(() => {
          // Will schedule next attempt automatically
        });
      }
    }, delay);
  }

  /**
   * Activate fallback transport
   */
  private _activateFallback(reason: string): void {
    if (!this._fallbackTransport) return;

    this.emit('fallback:activated', {
      reason,
      url: this._fallbackTransport.url
    });

    if (this._config.debug) {
      console.log('[WebSocketManager] Fallback activated:', reason);
    }

    // Implementation would depend on fallback type
    // For now, we'll just emit the event
  }

  /**
   * Clean up connection resources
   */
  private _cleanupConnection(): void {
    this._clearTimers();
    this._pendingPings.clear();
    this._heartbeatsMissed = 0;
  }

  /**
   * Clear all timers
   */
  private _clearTimers(): void {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }

    if (this._heartbeatTimeout) {
      clearTimeout(this._heartbeatTimeout);
      this._heartbeatTimeout = null;
    }

    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout);
      this._reconnectTimeout = null;
    }

    if (this._queueProcessorInterval) {
      clearInterval(this._queueProcessorInterval);
      this._queueProcessorInterval = null;
    }
  }
}
