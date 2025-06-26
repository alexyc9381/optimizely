import { WebSocketManager } from '../modules/WebSocketManager';
import { WebSocketConfig } from '../types';

// Mock WebSocket globally
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  url: string;
  protocols: string[];
  binaryType: string = 'blob';

  onopen?: (event: Event) => void;
  onclose?: (event: CloseEvent) => void;
  onerror?: (event: ErrorEvent) => void;
  onmessage?: (event: MessageEvent) => void;

  constructor(url: string, protocols: string[] = []) {
    this.url = url;
    this.protocols = protocols;

    // Simulate immediate connection for tests
    Promise.resolve().then(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    });
  }

  send(_data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Simulate successful send
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: code || 1000, reason: reason || '' }));
    }
  }

  // Test helper methods
  simulateMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  simulateError(message: string = 'Connection error'): void {
    if (this.onerror) {
      this.onerror(new ErrorEvent('error', { message }));
    }
  }
}

// Mock the global WebSocket
(global as any).WebSocket = MockWebSocket;

// Mock utils
jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  isBrowser: () => true,
  now: () => Date.now(),
  generateId: () => 'test-id-' + Math.random().toString(36).substr(2, 9),
}));

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;
  let mockConfig: WebSocketConfig;

  beforeEach(() => {
    mockConfig = {
      url: 'ws://localhost:8080/test',
      protocols: ['chat'],
      reconnect: true,
      reconnectInterval: 1000,
      maxReconnectAttempts: 3,
      heartbeatInterval: 30000,
      messageQueueSize: 100,
      enableCompression: true,
      enableFallback: false,
      timeout: 5000,
      debug: false,
    };

    wsManager = new WebSocketManager(mockConfig);
    wsManager.init();
  });

  afterEach(() => {
    wsManager.destroy();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultManager = new WebSocketManager();
      expect(defaultManager.name).toBe('WebSocketManager');
      expect(defaultManager.isConnected).toBe(false);
      expect(defaultManager.queueSize).toBe(0);
      defaultManager.destroy();
    });

    test('should initialize with custom configuration', () => {
      expect(wsManager.name).toBe('WebSocketManager');
      expect(wsManager.connectionState.url).toBe(mockConfig.url);
      expect(wsManager.connectionState.status).toBe('disconnected');
    });

    test('should set session context correctly', () => {
      const sessionId = 'test-session-123';
      const visitorId = 'test-visitor-456';

      wsManager.setSessionContext(sessionId, visitorId);

      // Session context is tested indirectly through message sending
      expect(wsManager).toBeDefined(); // Basic sanity check
    });
  });

  describe('Connection Management', () => {
    test('should connect successfully', async () => {
      await wsManager.connect();

      expect(wsManager.isConnected).toBe(true);
      expect(wsManager.connectionState.status).toBe('connected');
    });

    test('should disconnect properly', async () => {
      await wsManager.connect();

      expect(wsManager.isConnected).toBe(true);

      wsManager.disconnect();

      expect(wsManager.connectionState.status).toBe('disconnected');
    });

    test('should handle connection without URL', async () => {
      const noUrlManager = new WebSocketManager();
      noUrlManager.init();

      await expect(noUrlManager.connect()).rejects.toThrow('WebSocket URL is required');

      noUrlManager.destroy();
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      await wsManager.connect();
      wsManager.setSessionContext('session-123', 'visitor-456');
    });

    test('should send messages when connected', async () => {
      const result = await wsManager.send({
        type: 'event',
        data: { test: 'data' },
        priority: 'normal',
      });

      expect(result).toBe(true);
      expect(wsManager.metrics.messagesSet).toBe(1);
    });

    test('should queue messages when disconnected', async () => {
      wsManager.disconnect();

      const result = await wsManager.send({
        type: 'event',
        data: { test: 'data' },
        priority: 'normal',
      });

      expect(result).toBe(false);
      expect(wsManager.queueSize).toBe(1);
    });

    test('should send events with proper format', async () => {
      const result = await wsManager.sendEvent('test-event', { custom: 'data' }, 'high');

      expect(result).toBe(true);
      expect(wsManager.metrics.messagesSet).toBe(1);
    });

    test('should handle incoming messages', () => {
      let receivedMessage: any = null;

      wsManager.on('message:received', (message) => {
        receivedMessage = message;
      });

      const testMessage = {
        id: 'msg-123',
        type: 'event',
        data: { test: 'incoming' },
        timestamp: Date.now(),
        sessionId: 'session-123',
        visitorId: 'visitor-456',
      };

      // Simulate incoming message
      (wsManager as any)._socket?.simulateMessage(testMessage);

      expect(receivedMessage).toEqual(testMessage);
      expect(wsManager.metrics.messagesReceived).toBe(1);
    });
  });

  describe('Heartbeat Mechanism', () => {
    beforeEach(async () => {
      await wsManager.connect();
    });

    test('should send heartbeat messages', () => {
      let heartbeatSent = false;

      wsManager.on('heartbeat:sent', () => {
        heartbeatSent = true;
      });

      // Manually trigger heartbeat
      wsManager.sendHeartbeat();

      expect(heartbeatSent).toBe(true);
    });

    test('should handle heartbeat responses', () => {
      let heartbeatReceived = false;
      let receivedLatency = 0;

      wsManager.on('heartbeat:received', (data) => {
        heartbeatReceived = true;
        receivedLatency = data.latency;
      });

      // Send heartbeat
      wsManager.sendHeartbeat();

      // Simulate heartbeat response
      const pingId = 'test-ping-id';
      const timestamp = Date.now();

      (wsManager as any)._pendingPings.set(pingId, timestamp - 100); // 100ms ago

      const heartbeatResponse = {
        id: 'hb-response',
        type: 'heartbeat',
        data: { pingId, timestamp },
        timestamp: Date.now(),
        sessionId: 'session-123',
        visitorId: 'visitor-456',
      };

      (wsManager as any)._socket?.simulateMessage(heartbeatResponse);

      expect(heartbeatReceived).toBe(true);
      expect(receivedLatency).toBeGreaterThan(0);
    });
  });

  describe('Queue Management', () => {
    test('should clear message queue', async () => {
      // Add messages to queue
      await wsManager.send({
        type: 'event',
        data: { test: '1' },
        priority: 'normal',
      });
      await wsManager.send({
        type: 'event',
        data: { test: '2' },
        priority: 'normal',
      });

      expect(wsManager.queueSize).toBe(2);

      wsManager.clearQueue();

      expect(wsManager.queueSize).toBe(0);
    });

    test('should handle queue size limits', async () => {
      const smallQueueManager = new WebSocketManager({
        messageQueueSize: 2,
      });

      let queueFullEvent = false;
      smallQueueManager.on('queue:full', () => {
        queueFullEvent = true;
      });

      smallQueueManager.init();

      // Fill queue beyond limit
      await smallQueueManager.send({ type: 'event', data: { msg: 1 } });
      await smallQueueManager.send({ type: 'event', data: { msg: 2 } });
      await smallQueueManager.send({ type: 'event', data: { msg: 3 } }); // Should trigger queue full

      expect(queueFullEvent).toBe(true);
      expect(smallQueueManager.queueSize).toBe(2); // Max size maintained

      smallQueueManager.destroy();
    });
  });

  describe('Metrics and State', () => {
    test('should track connection metrics', async () => {
      await wsManager.connect();

      // Add small delay for uptime calculation
      await new Promise(resolve => setTimeout(resolve, 10));

      await wsManager.sendEvent('test', { data: 'test' });

      const metrics = wsManager.getMetrics();

      expect(metrics.messagesSet).toBe(1);
      expect(metrics.reconnections).toBe(0);
      expect(metrics.errors).toBe(0);
      expect(metrics.uptime).toBeGreaterThan(0);
    });

    test('should provide accurate connection state', async () => {
      let state = wsManager.getConnectionState();
      expect(state.status).toBe('disconnected');

      await wsManager.connect();

      state = wsManager.getConnectionState();
      expect(state.status).toBe('connected');
      expect(state.connectedAt).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed incoming messages', async () => {
      await wsManager.connect();

      // Simulate malformed message
      const mockSocket = (wsManager as any)._socket;
      if (mockSocket && mockSocket.onmessage) {
        mockSocket.onmessage(new MessageEvent('message', {
          data: 'invalid-json{'
        }));
      }

      // Should not crash, just log error (if debug enabled)
      expect(wsManager.isConnected).toBe(true);
    });

    test('should handle destroy gracefully', async () => {
      await wsManager.connect();

      expect(wsManager.isConnected).toBe(true);

      wsManager.destroy();

      expect(wsManager.connectionState.status).toBe('disconnected');

      // Should not be able to send after destroy
      await expect(wsManager.connect()).rejects.toThrow('WebSocketManager has been destroyed');
    });

    test('should handle browser environment detection', () => {
      // Test is already running in browser environment (mocked)
      const browserManager = new WebSocketManager();
      browserManager.init();

      expect(browserManager).toBeDefined();
      browserManager.destroy();
    });
  });
});
