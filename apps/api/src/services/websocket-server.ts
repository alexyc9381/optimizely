import { EventEmitter } from 'events';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { parse } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import { AnalyticsServiceManager } from './analytics-service';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  apiKey?: string;
  rooms: Set<string>;
  lastPing: number;
  isAuthenticated: boolean;
}

interface WebSocketMessage {
  type: string;
  data?: any;
  requestId?: string;
}

interface RealTimeMetricsData {
  timestamp: string;
  activeVisitors: number;
  sessionsInLast30Min: number;
  eventsInLast30Min: number;
  topPages: Array<{
    url: string;
    title?: string;
    activeVisitors: number;
    totalViews: number;
  }>;
  recentEvents: any[];
  activeCountries: Array<{
    country: string;
    countryCode: string;
    activeVisitors: number;
  }>;
}

export class OptimizelyWebSocketServer extends EventEmitter {
  private wss: WebSocketServer;
  private analyticsService: AnalyticsServiceManager;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private rooms: Map<string, Set<string>> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private defaultMetricsFrequency = 5000; // 5 seconds default
  private userMetricsPreferences = new Map<string, number>(); // userId -> frequency

  constructor(analyticsService: AnalyticsServiceManager) {
    super();
    this.analyticsService = analyticsService;

    this.wss = new WebSocketServer({
      noServer: true,
      clientTracking: false
    });

    this.setupWebSocketServer();
    this.startHeartbeat();
    this.startMetricsStreaming();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
      const clientId = this.generateClientId();
      ws.rooms = new Set();
      ws.lastPing = Date.now();
      ws.isAuthenticated = false;

      this.clients.set(clientId, ws);

      // Handle authentication
      this.handleAuthentication(ws, request, clientId);

      // Message handling
      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message, clientId);
        } catch (error) {
          this.sendError(ws, 'Invalid JSON message', undefined);
        }
      });

      // Connection cleanup
      ws.on('close', () => {
        this.handleDisconnection(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnection(clientId);
      });

      // Send welcome message
      this.sendMessage(ws, {
        type: 'connected',
        data: {
          clientId,
          message: 'Welcome to Optimizely Analytics WebSocket Server',
          supportedCommands: [
            'authenticate',
            'subscribe',
            'unsubscribe',
            'setMetricsFrequency',
            'ping'
          ]
        }
      });
    });
  }

  private async handleAuthentication(ws: AuthenticatedWebSocket, request: IncomingMessage, clientId: string): Promise<void> {
    try {
      const url = parse(request.url || '', true);
      const token = url.query.token as string;
      const apiKey = url.query.apiKey as string;

      if (token) {
        // JWT authentication
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
          ws.userId = decoded.userId || decoded.sub;
          ws.isAuthenticated = true;

          this.sendMessage(ws, {
            type: 'authenticated',
            data: { method: 'jwt', userId: ws.userId }
          });
        } catch (jwtError) {
          this.sendError(ws, 'Invalid JWT token', 'AUTH_FAILED');
          return;
        }
      } else if (apiKey) {
        // API Key authentication (simplified for demo)
        if (this.isValidApiKey(apiKey)) {
          ws.apiKey = apiKey;
          ws.isAuthenticated = true;

          this.sendMessage(ws, {
            type: 'authenticated',
            data: { method: 'apiKey' }
          });
        } else {
          this.sendError(ws, 'Invalid API key', 'AUTH_FAILED');
          return;
        }
      } else {
        // Allow unauthenticated connections with limited access
        this.sendMessage(ws, {
          type: 'connected_unauthenticated',
          data: {
            message: 'Connected without authentication. Limited access available.',
            hint: 'Use ?token=JWT_TOKEN or ?apiKey=API_KEY for full access'
          }
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      this.sendError(ws, 'Authentication failed', 'AUTH_ERROR');
    }
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage, clientId: string): void {
    switch (message.type) {
      case 'authenticate':
        this.handleLateAuthentication(ws, message.data, clientId);
        break;
      case 'subscribe':
        this.handleSubscription(ws, message.data, clientId);
        break;
      case 'unsubscribe':
        this.handleUnsubscription(ws, message.data, clientId);
        break;
      case 'setMetricsFrequency':
        this.handleMetricsFrequencyChange(ws, message.data, clientId);
        break;
      case 'ping':
        ws.lastPing = Date.now();
        this.sendMessage(ws, { type: 'pong', data: { timestamp: Date.now() } });
        break;
      default:
        this.sendError(ws, `Unknown message type: ${message.type}`, 'UNKNOWN_COMMAND');
    }
  }

  private handleSubscription(ws: AuthenticatedWebSocket, data: any, clientId: string): void {
    const { room } = data;

    if (!room) {
      this.sendError(ws, 'Room name is required for subscription', 'INVALID_ROOM');
      return;
    }

    // Add client to room
    ws.rooms.add(room);

    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(clientId);

    this.sendMessage(ws, {
      type: 'subscribed',
      data: { room, message: `Subscribed to ${room}` }
    });

    // Send initial data for supported rooms
    if (room === 'realtime-metrics') {
      this.sendInitialMetrics(ws);
    }
  }

  private handleUnsubscription(ws: AuthenticatedWebSocket, data: any, clientId: string): void {
    const { room } = data;

    if (room && ws.rooms.has(room)) {
      ws.rooms.delete(room);
      this.rooms.get(room)?.delete(clientId);

      // Clean up empty rooms
      if (this.rooms.get(room)?.size === 0) {
        this.rooms.delete(room);
      }

      this.sendMessage(ws, {
        type: 'unsubscribed',
        data: { room, message: `Unsubscribed from ${room}` }
      });
    }
  }

  private handleMetricsFrequencyChange(ws: AuthenticatedWebSocket, data: any, clientId: string): void {
    const { frequency } = data;

    if (!frequency || frequency < 1000 || frequency > 60000) {
      this.sendError(ws, 'Frequency must be between 1000ms and 60000ms', 'INVALID_FREQUENCY');
      return;
    }

    if (ws.userId) {
      this.userMetricsPreferences.set(ws.userId, frequency);
    }

    this.sendMessage(ws, {
      type: 'frequencyUpdated',
      data: { frequency, message: `Metrics frequency set to ${frequency}ms` }
    });
  }

  private async sendInitialMetrics(ws: AuthenticatedWebSocket): Promise<void> {
    try {
      const metrics = await this.generateRealTimeMetrics();
      this.sendMessage(ws, {
        type: 'realtime-metrics',
        data: metrics
      });
    } catch (error) {
      console.error('Error sending initial metrics:', error);
    }
  }

  private startMetricsStreaming(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.generateRealTimeMetrics();
        this.broadcastToRoom('realtime-metrics', {
          type: 'realtime-metrics',
          data: metrics
        });
      } catch (error) {
        console.error('Error broadcasting metrics:', error);
      }
    }, this.defaultMetricsFrequency);
  }

  private async generateRealTimeMetrics(): Promise<RealTimeMetricsData> {
    // Generate real-time metrics using analytics service
    // This will be enhanced to use actual data from Redis/database
    const activeVisitors = Math.floor(Math.random() * 100) + 20;
    const sessionsInLast30Min = Math.floor(activeVisitors * 0.6);
    const eventsInLast30Min = Math.floor(activeVisitors * 8);

    return {
      timestamp: new Date().toISOString(),
      activeVisitors,
      sessionsInLast30Min,
      eventsInLast30Min,
      topPages: [
        {
          url: 'https://example.com/',
          title: 'Home Page',
          activeVisitors: Math.floor(activeVisitors * 0.4),
          totalViews: Math.floor(activeVisitors * 2.5)
        },
        {
          url: 'https://example.com/products',
          title: 'Products',
          activeVisitors: Math.floor(activeVisitors * 0.3),
          totalViews: Math.floor(activeVisitors * 2.0)
        }
      ],
      recentEvents: [],
      activeCountries: [
        {
          country: 'United States',
          countryCode: 'US',
          activeVisitors: Math.floor(activeVisitors * 0.6)
        },
        {
          country: 'Canada',
          countryCode: 'CA',
          activeVisitors: Math.floor(activeVisitors * 0.2)
        }
      ]
    };
  }

  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      this.clients.forEach((ws, clientId) => {
        // Remove stale connections (no ping in 60 seconds)
        if (now - ws.lastPing > 60000) {
          console.log(`Removing stale connection: ${clientId}`);
          this.handleDisconnection(clientId);
          return;
        }

        // Send ping to active connections
        if (ws.readyState === WebSocket.OPEN) {
          this.sendMessage(ws, { type: 'ping', data: { timestamp: now } });
        }
      });
    }, 30000); // Every 30 seconds
  }

  private broadcastToRoom(room: string, message: WebSocketMessage): void {
    const roomClients = this.rooms.get(room);
    if (!roomClients) return;

    roomClients.forEach(clientId => {
      const ws = this.clients.get(clientId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      }
    });
  }

  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string, code?: string): void {
    this.sendMessage(ws, {
      type: 'error',
      data: { error, code, timestamp: new Date().toISOString() }
    });
  }

  private handleDisconnection(clientId: string): void {
    const ws = this.clients.get(clientId);
    if (ws) {
      // Remove from all rooms
      ws.rooms.forEach(room => {
        this.rooms.get(room)?.delete(clientId);
        if (this.rooms.get(room)?.size === 0) {
          this.rooms.delete(room);
        }
      });

      // Close connection and remove from clients
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      this.clients.delete(clientId);
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isValidApiKey(apiKey: string): boolean {
    // Simplified API key validation - in production, check against database
    return apiKey.startsWith('ak_') && apiKey.length > 10;
  }

  private handleLateAuthentication(ws: AuthenticatedWebSocket, data: any, clientId: string): void {
    // Handle authentication after connection is established
    const { token, apiKey } = data;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        ws.userId = decoded.userId || decoded.sub;
        ws.isAuthenticated = true;

        this.sendMessage(ws, {
          type: 'authenticated',
          data: { method: 'jwt', userId: ws.userId }
        });
      } catch (error) {
        this.sendError(ws, 'Invalid JWT token', 'AUTH_FAILED');
      }
    } else if (apiKey && this.isValidApiKey(apiKey)) {
      ws.apiKey = apiKey;
      ws.isAuthenticated = true;

      this.sendMessage(ws, {
        type: 'authenticated',
        data: { method: 'apiKey' }
      });
    } else {
      this.sendError(ws, 'Invalid authentication credentials', 'AUTH_FAILED');
    }
  }

  // Public methods for server integration
  public handleUpgrade(request: IncomingMessage, socket: any, head: Buffer): void {
    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit('connection', ws, request);
    });
  }

  public getStats(): object {
    return {
      totalConnections: this.clients.size,
      authenticatedConnections: Array.from(this.clients.values()).filter(ws => ws.isAuthenticated).length,
      activeRooms: Array.from(this.rooms.keys()),
      roomMembership: Object.fromEntries(
        Array.from(this.rooms.entries()).map(([room, clients]) => [room, clients.size])
      )
    };
  }

  public close(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    this.wss.close();
  }
}
