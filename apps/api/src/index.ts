import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { db } from './services/database';
import { eventManager } from './services/event-manager';
import { redisManager } from './services/redis-client';

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
app.use(compression());

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
app.use(limiter);

// =============================================================================
// UNIVERSAL PLATFORM DETECTION MIDDLEWARE
// =============================================================================
app.use((req, res, next) => {
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
app.get(`/api/${apiVersion}/docs`, (req, res) => {
  res.json({
    name: 'Optimizely Universal API',
    version: apiVersion,
    description: 'Universal, platform-agnostic API for website optimization and tracking',
    endpoints: {
      health: 'GET /health',
      tracking: {
        session: 'POST /api/v1/tracking/session',
        event: 'POST /api/v1/tracking/event'
      },
      analytics: {
        data: 'GET /api/v1/analytics/data'
      }
    },
    supportedPlatforms: [
      'WordPress', 'Shopify', 'Wix', 'Squarespace',
      'React', 'Vue', 'Angular', 'Static HTML', 'Universal'
    ]
  });
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /health',
      'GET /',
      `GET /api/${apiVersion}/docs`,
      `POST /api/${apiVersion}/tracking/session`,
      `POST /api/${apiVersion}/tracking/event`,
      `GET /api/${apiVersion}/analytics/data`
    ]
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    message: 'An error occurred processing your request',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown'
  });
});

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
    }

    const server = app.listen(port, () => {
      console.log(`🚀 Universal API server listening at http://localhost:${port}`);
      console.log(`📚 API documentation available at http://localhost:${port}/api/${apiVersion}/docs`);
      console.log(`🏥 Health check available at http://localhost:${port}/health`);
      console.log(`🌍 Platform-agnostic architecture enabled`);
    });

    return server;
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
    const server = await serverPromise;
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
declare global {
  namespace Express {
    interface Request {
      platform: {
        type: string;
        version: string;
        userAgent: string;
      };
    }
  }
}
