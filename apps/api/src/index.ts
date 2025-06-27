import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import morgan from 'morgan';
import { analyticsService } from './services/analytics-service';
import { db } from './services/database';
import { eventManager } from './services/event-manager';
import { integrationService } from './services/integration-service';
import { redisManager } from './services/redis-client';
import { OptimizelyWebSocketServer } from './services/websocket-server';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.API_PORT || process.env.PORT || 4000;
const apiVersion = 'v1';

// =============================================================================
// MIDDLEWARE CONFIGURATION - Universal Architecture Compliant
// =============================================================================

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow universal embedding
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "https:"], // Universal script support
      "connect-src": ["'self'", "https:", "wss:"] // Universal API connections
    }
  }
}));

// CORS - Universal platform support
app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, origin?: boolean) => void) {
    // Allow all origins for universal platform compatibility
    // In production, implement dynamic origin validation
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Platform-Type',
    'X-Platform-Version',
    'X-Session-ID'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  credentials: true
}));

// Compression for performance
app.use(compression() as any); // eslint-disable-line @typescript-eslint/no-explicit-any

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting - Universal API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit requests
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter as any); // eslint-disable-line @typescript-eslint/no-explicit-any

// =============================================================================
// UNIVERSAL PLATFORM DETECTION MIDDLEWARE
// =============================================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((req: any, res: any, next: any) => {
  // Detect platform from headers or user agent
  const platformHeader = req.headers['x-platform-type'] as string;
  const userAgent = req.headers['user-agent'] as string;

  let detectedPlatform = 'unknown';
  if (platformHeader) {
    detectedPlatform = platformHeader;
  } else if (userAgent) {
    // Universal platform detection logic
    if (userAgent.includes('WordPress')) detectedPlatform = 'wordpress';
    else if (userAgent.includes('Shopify')) detectedPlatform = 'shopify';
    else if (userAgent.includes('Wix')) detectedPlatform = 'wix';
    else if (userAgent.includes('Squarespace')) detectedPlatform = 'squarespace';
    else if (userAgent.includes('React')) detectedPlatform = 'react';
    else if (userAgent.includes('Vue')) detectedPlatform = 'vue';
    else if (userAgent.includes('Angular')) detectedPlatform = 'angular';
    else detectedPlatform = 'generic-web';
  }

  req.platform = {
    type: detectedPlatform,
    version: req.headers['x-platform-version'] as string || 'unknown',
    userAgent: userAgent
  };

  next();
});

// =============================================================================
// API ROUTES - Universal Architecture
// =============================================================================

// Health check endpoint with database and Redis status
app.get('/health', async (req, res) => {
  try {
    const [dbHealthy, redisHealth, eventHealth] = await Promise.all([
      db.healthCheck(),
      redisManager.healthCheck(),
      eventManager.healthCheck()
    ]);

    const overallHealthy = dbHealthy && redisHealth.status === 'healthy';

    res.json({
      status: overallHealthy ? 'ok' : 'degraded',
      message: 'Universal API is running!',
      version: apiVersion,
      timestamp: new Date().toISOString(),
      platform: 'universal',
      services: {
        database: {
          status: dbHealthy ? 'connected' : 'disconnected',
          type: 'postgresql'
        },
        redis: {
          status: redisHealth.status,
          latency: redisHealth.latency
        },
        events: {
          status: eventHealth.status,
          isListening: eventHealth.isListening,
          activeSubscriptions: eventHealth.activeSubscriptions
        }
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Service health check failed',
      version: apiVersion,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Legacy root endpoint for compatibility
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is running!',
    version: apiVersion,
    documentation: `/api/${apiVersion}/docs`
  });
});

// API versioning - Universal endpoints
app.use(`/api/${apiVersion}`, (req, res, next) => {
  // Add API version to response headers
  res.setHeader('X-API-Version', apiVersion);
  next();
});

// Import and mount Redis routes
import { default as redisRoutes } from './routes/redis';
app.use(`/api/${apiVersion}/redis`, redisRoutes);

// Import and mount Events routes
import { default as eventsRoutes } from './routes/events';
app.use(`/api/${apiVersion}/events`, eventsRoutes);

// Import and mount Charts routes
import { default as chartsRoutes } from './routes/charts';
app.use(`/api/${apiVersion}/charts`, chartsRoutes);

// Import and mount Integration routes
import { default as integrationsRoutes } from './routes/integrations';
app.use(`/api/${apiVersion}/integrations`, integrationsRoutes);

// Import and mount Documentation routes
import { default as docsRoutes } from './routes/docs';
app.use(`/api/${apiVersion}/docs`, docsRoutes);

// Import and mount ML Scoring routes
import { default as mlScoringRoutes } from './routes/ml-scoring';
app.use(`/api/${apiVersion}/ml`, mlScoringRoutes);

// Import and mount Firmographic routes
import { default as firmographicRoutes } from './routes/firmographic';
app.use(`/api/${apiVersion}/firmographic`, firmographicRoutes);

// =============================================================================
// GRAPHQL API SETUP
// =============================================================================

import { createGraphQLMiddleware, createGraphQLServer } from './graphql/server';

// Initialize GraphQL server variable
let graphQLServer: any = null;

// Function to setup GraphQL middleware
async function setupGraphQL() {
  console.log('🔄 Creating GraphQL server...');
  graphQLServer = createGraphQLServer();

  await graphQLServer.start();
  console.log('✅ GraphQL server started');

  // Create and apply GraphQL middleware
  const graphQLMiddleware = createGraphQLMiddleware(graphQLServer);
  app.use(`/api/${apiVersion}/graphql`, graphQLMiddleware);
  console.log(`🔗 GraphQL middleware applied to /api/${apiVersion}/graphql`);

  // Add error handlers AFTER GraphQL middleware

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Endpoint ${req.originalUrl} not found`,
      availableEndpoints: [
        'GET /health',
        'GET /',
        `GET /api/${apiVersion}/docs`,
        `POST /api/${apiVersion}/events`,
        `GET /api/${apiVersion}/events`,
        `POST /api/${apiVersion}/graphql`,
        `POST /api/${apiVersion}/tracking/session`,
        `POST /api/${apiVersion}/tracking/event`,
        `GET /api/${apiVersion}/analytics/data`
      ]
    });
  });

  // Global error handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
      message: 'An error occurred processing your request',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  });

  console.log('🔗 Error handlers applied after GraphQL middleware');
}

// Universal tracking endpoints (placeholder for future implementation)
app.post(`/api/${apiVersion}/tracking/session`, (req, res) => {
  res.json({
    success: true,
    message: 'Session tracking endpoint ready',
    platform: req.platform,
    sessionId: `session_${Date.now()}`
  });
});

app.post(`/api/${apiVersion}/tracking/event`, (req, res) => {
  res.json({
    success: true,
    message: 'Event tracking endpoint ready',
    platform: req.platform,
    eventId: `event_${Date.now()}`
  });
});

app.get(`/api/${apiVersion}/analytics/data`, (req, res) => {
  res.json({
    success: true,
    message: 'Analytics data endpoint ready',
    platform: req.platform,
    data: []
  });
});

// API documentation endpoint
app.get(`/api/${apiVersion}/docs-legacy`, (req, res) => {
  const endpoints: any = {
    health: 'GET /health',
    rest: {
      events: {
        track: 'POST /api/v1/events',
        list: 'GET /api/v1/events',
        get: 'GET /api/v1/events/:id',
        delete: 'DELETE /api/v1/events/:id',
        health: 'GET /api/v1/events/health'
      },
      charts: {
        timeseries: 'GET /api/v1/charts/timeseries',
        distribution: 'GET /api/v1/charts/distribution',
        funnel: 'GET /api/v1/charts/funnel',
        comparison: 'GET /api/v1/charts/comparison',
        widgets: 'GET /api/v1/charts/widgets/:type',
        dashboard: 'POST /api/v1/charts/dashboard',
        export: 'POST /api/v1/charts/export',
        health: 'GET /api/v1/charts/health',
        metrics: 'GET /api/v1/charts/metrics'
      },
      integrations: {
        list: 'GET /api/v1/integrations',
        create: 'POST /api/v1/integrations',
        get: 'GET /api/v1/integrations/:id',
        update: 'PUT /api/v1/integrations/:id',
        delete: 'DELETE /api/v1/integrations/:id',
        test: 'POST /api/v1/integrations/:id/test',
        types: 'GET /api/v1/integrations/types',
        health: 'GET /api/v1/integrations/health',
        webhooks: {
          create: 'POST /api/v1/integrations/webhooks',
          trigger: 'POST /api/v1/integrations/webhooks/:id/trigger'
        },
        syncJobs: {
          list: 'GET /api/v1/integrations/sync-jobs',
          create: 'POST /api/v1/integrations/sync-jobs',
          get: 'GET /api/v1/integrations/sync-jobs/:id',
          cancel: 'POST /api/v1/integrations/sync-jobs/:id/cancel'
        }
      }
    },
    tracking: {
      session: 'POST /api/v1/tracking/session',
      event: 'POST /api/v1/tracking/event'
    },
    analytics: {
      data: 'GET /api/v1/analytics/data'
    },
    websocket: {
      endpoint: `ws://localhost:${port}/api/v1/ws`,
      description: 'Real-time analytics and metrics streaming',
      authentication: 'URL params: ?token=JWT_TOKEN or ?apiKey=API_KEY',
      commands: [
        'subscribe - Subscribe to real-time data rooms',
        'unsubscribe - Unsubscribe from rooms',
        'setMetricsFrequency - Configure metrics update frequency',
        'ping - Keep connection alive'
      ],
      rooms: [
        'realtime-metrics - Live analytics metrics and visitor data'
      ]
    }
  };

  // Add GraphQL info if available
  if (graphQLServer) {
    endpoints.graphql = {
      endpoint: 'POST /api/v1/graphql',
      playground: 'GET /api/v1/graphql',
      description: 'Full GraphQL API with queries, mutations, and subscriptions'
    };
  }

  res.json({
    name: 'Optimizely Universal API',
    version: apiVersion,
    description: 'Universal, platform-agnostic API for website optimization and tracking',
    endpoints,
    supportedPlatforms: [
      'WordPress', 'Shopify', 'Wix', 'Squarespace',
      'React', 'Vue', 'Angular', 'Static HTML', 'Universal'
    ]
  });
});

// =============================================================================
// GRAPHQL MIDDLEWARE PLACEHOLDER (will be applied in startServer function)
// =============================================================================
// GraphQL middleware will be applied here before error handlers

// Error handlers will be added after GraphQL middleware in startServer()

// =============================================================================
// SERVER STARTUP WITH DATABASE INITIALIZATION
// =============================================================================

async function startServer() {
  try {
    // Try to initialize database connection, but don't fail if it's not available
    try {
      await db.connect();
      await db.runMigrations();
      console.log(`🔌 Database connection established`);
    } catch (dbError) {
      console.log('⚠️  Database connection failed, continuing without database (degraded mode)');
      console.log('   Database will be available once DATABASE_URL is configured');
      // Database error is expected in development without configured DATABASE_URL
      console.debug('Database error details:', dbError);
    }

    // Initialize Analytics Service
    try {
      await analyticsService.start();
      console.log('📊 Analytics service started');
    } catch (analyticsError) {
      console.log('⚠️  Analytics service failed to start, continuing with limited functionality');
      console.debug('Analytics error details:', analyticsError);
    }

    // Initialize Integration Service
    try {
      await integrationService.initialize();

      // Connect analytics events to integration forwarding
      analyticsService.on('analytics:event:processed', async (event: any) => {
        try {
          await integrationService.forwardEvent(event);
        } catch (error) {
          console.error('Error forwarding event to integrations:', error);
        }
      });

      console.log('🔗 Integration service started and connected to analytics pipeline');
    } catch (integrationError) {
      console.log('⚠️  Integration service failed to start, continuing without integrations');
      console.debug('Integration error details:', integrationError);
    }

    // Initialize GraphQL BEFORE starting the HTTP server
    await setupGraphQL();

    // Create HTTP server with WebSocket support
    const httpServer = createServer(app);

    // Initialize WebSocket server
    const wsServer = new OptimizelyWebSocketServer(analyticsService);

    // Handle WebSocket upgrade requests
    httpServer.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

      if (pathname === `/api/${apiVersion}/ws`) {
        wsServer.handleUpgrade(request, socket, head);
      } else {
        socket.destroy();
      }
    });

    const server = httpServer.listen(port, () => {
      console.log(`🚀 Universal API server listening at http://localhost:${port}`);
      console.log(`📚 API documentation available at http://localhost:${port}/api/${apiVersion}/docs`);
      console.log(`🏥 Health check available at http://localhost:${port}/health`);
      console.log(`🌍 Platform-agnostic architecture enabled`);
      console.log(`📊 GraphQL API available at http://localhost:${port}/api/${apiVersion}/graphql`);
      console.log(`⚡ GraphQL queries, mutations, and subscriptions ready`);
      console.log(`🔌 WebSocket server available at ws://localhost:${port}/api/${apiVersion}/ws`);
      console.log(`📡 Real-time metrics streaming enabled`);
    });

    // Graceful WebSocket server shutdown
    const originalClose = server.close.bind(server);
    server.close = function(callback?: (err?: Error) => void) {
      console.log('🔄 Shutting down WebSocket server...');
      wsServer.close();
      console.log('📴 WebSocket server stopped');
      return originalClose(callback);
    };

    return { server, wsServer };
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    throw error;
  }
}

// Start the server
const serverPromise = startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    const serverResult = await serverPromise;
    const { server, wsServer } = serverResult;

    // Stop GraphQL server first
    await graphQLServer.stop();
    console.log('📴 GraphQL server stopped');

    // Stop WebSocket server
    wsServer.close();
    console.log('📴 WebSocket server stopped');

    // Stop Analytics service
    try {
      await analyticsService.stop();
      console.log('📴 Analytics service stopped');
    } catch (error) {
      console.log('⚠️  Error stopping analytics service:', error);
    }

    server.close(() => {
      console.log('Process terminated');
    });
    await db.disconnect();
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Add platform detection to Express Request type
declare module 'express-serve-static-core' {
  interface Request {
    platform: {
      type: string;
      version: string;
      userAgent: string;
    };
  }
}
