import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import morgan from 'morgan';
import AnalyticsService from './services/analytics-service';
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

// Initialize analytics service
let analyticsService: AnalyticsService;

// =============================================================================
// MIDDLEWARE CONFIGURATION - Universal Architecture Compliant
// =============================================================================

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Allow universal embedding
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", "'unsafe-inline'", 'https:'], // Universal script support
        'connect-src': ["'self'", 'https:', 'wss:'], // Universal API connections
      },
    },
  })
);

// CORS - Universal platform support
app.use(
  cors({
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, origin?: boolean) => void
    ) {
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
      'X-Session-ID',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    credentials: true,
  })
);

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
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
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
    else if (userAgent.includes('Squarespace'))
      detectedPlatform = 'squarespace';
    else if (userAgent.includes('React')) detectedPlatform = 'react';
    else if (userAgent.includes('Vue')) detectedPlatform = 'vue';
    else if (userAgent.includes('Angular')) detectedPlatform = 'angular';
    else detectedPlatform = 'generic-web';
  }

  req.platform = {
    type: detectedPlatform,
    version: (req.headers['x-platform-version'] as string) || 'unknown',
    userAgent: userAgent,
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
      eventManager.healthCheck(),
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
          type: 'postgresql',
        },
        redis: {
          status: redisHealth.status,
          latency: redisHealth.latency,
        },
        events: {
          status: eventHealth.status,
          isListening: eventHealth.isListening,
          activeSubscriptions: eventHealth.activeSubscriptions,
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Service health check failed',
      version: apiVersion,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Legacy root endpoint for compatibility
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is running!',
    version: apiVersion,
    documentation: `/api/${apiVersion}/docs`,
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

// Import and mount Real-Time Predictions routes
import { default as realTimePredictionsRoutes } from './routes/real-time-predictions';
app.use(`/api/${apiVersion}/real-time-predictions`, realTimePredictionsRoutes);

// Import and mount ML Scoring routes
import { default as mlScoringRoutes } from './routes/ml-scoring';
app.use(`/api/${apiVersion}/ml`, mlScoringRoutes);

// Import and mount Firmographic routes
import { default as firmographicRoutes } from './routes/firmographic';
app.use(`/api/${apiVersion}/firmographic`, firmographicRoutes);

// Import and mount Behavioral routes
import { default as behavioralRoutes } from './routes/behavioral';
app.use(`/api/${apiVersion}/behavioral`, behavioralRoutes);

// Import and mount Intent Detection routes
import { default as intentRoutes } from './routes/intent';
app.use(`/api/${apiVersion}/intent`, intentRoutes);

// Import and mount Timing Factor routes
import { default as timingRoutes } from './routes/timing';
app.use(`/api/${apiVersion}/timing`, timingRoutes);

// Import and mount Industry Model routes
import { default as industryModelRoutes } from './routes/industry-models';
app.use(`/api/${apiVersion}/industry-models`, industryModelRoutes);

// Import and mount Industry Metrics routes
import { default as industryMetricsRoutes } from './routes/industry-metrics';
app.use(`/api/${apiVersion}/industry-metrics`, industryMetricsRoutes);

// Import and mount Adaptive Layout routes
import { default as adaptiveLayoutRoutes } from './routes/adaptive-layout';
app.use(`/api/${apiVersion}/layouts`, adaptiveLayoutRoutes);

// Import and mount Smart Widget Recommendation routes
import { default as smartWidgetRecommendationRoutes } from './routes/smart-widget-recommendations';
app.use(`/api/${apiVersion}/widget-recommendations`, smartWidgetRecommendationRoutes);

// Import and mount Progressive Complexity Management routes
import { default as progressiveComplexityRoutes } from './routes/progressive-complexity';
app.use(`/api/${apiVersion}/complexity`, progressiveComplexityRoutes);

// Import and mount Buyer Profile routes
import { default as buyerProfileRoutes } from './routes/buyer-profiles';
app.use(`/api/${apiVersion}/buyer-profiles`, buyerProfileRoutes);

// Import and mount Competitive Intelligence routes
import { default as competitiveIntelligenceRoutes } from './routes/competitive-intelligence';
app.use(
  `/api/${apiVersion}/competitive-intelligence`,
  competitiveIntelligenceRoutes
);

// Import and mount Universal Competitive Intelligence routes
import { default as universalCompetitiveIntelligenceRoutes } from './routes/universal-competitive-intelligence';
app.use(
  `/api/${apiVersion}/competitive-intelligence`,
  universalCompetitiveIntelligenceRoutes
);

// Import and mount Campaign Attribution routes
import { default as campaignAttributionRoutes } from './routes/campaign-attribution';
app.use(
  `/api/${apiVersion}/campaign-attribution`,
  campaignAttributionRoutes
);

// Import and mount Outcome Tracking routes
import { default as outcomeTrackingRoutes } from './routes/outcome-tracking';
app.use(
  `/api/${apiVersion}/outcome-tracking`,
  outcomeTrackingRoutes
);

// Import and mount Model Refinement routes
import { default as modelRefinementRoutes } from './routes/model-refinement';
app.use(
  `/api/${apiVersion}/model-refinement`,
  modelRefinementRoutes
);

// Import and mount A/B Testing Framework routes
import { default as abTestingRoutes } from './routes/ab-testing';
app.use(`/api/${apiVersion}/ab-testing`, abTestingRoutes);

// Import and mount Confidence Scoring routes
import { default as confidenceScoringRoutes } from './routes/confidence-scoring';
app.use(`/api/${apiVersion}/confidence-scoring`, confidenceScoringRoutes);

// Import and mount Accuracy Tracking routes
import { default as accuracyTrackingRoutes } from './routes/accuracy-tracking';
app.use(`/api/${apiVersion}/accuracy`, accuracyTrackingRoutes);

// Import and mount Enterprise Infrastructure routes
import { default as enterpriseInfrastructureRoutes } from './routes/enterprise-infrastructure';
app.use(`/api/${apiVersion}/enterprise-infrastructure`, enterpriseInfrastructureRoutes);

// Import and mount Psychographic Profiling routes
import { default as psychographicProfilingRoutes } from './routes/psychographic-profiling';
app.use(`/api/${apiVersion}/psychographic`, psychographicProfilingRoutes);

// Import and mount Dynamic Personalization routes
import { default as dynamicPersonalizationRoutes } from './routes/dynamic-personalization';
app.use(`/api/${apiVersion}/personalization`, dynamicPersonalizationRoutes);

// Import and mount Autonomous A/B Testing routes
import { default as autonomousABTestingRoutes } from './routes/autonomous-ab-testing';
app.use(`/api/${apiVersion}/autonomous-ab-testing`, autonomousABTestingRoutes);

// Import and mount A/B Test Template routes
import { default as abTestTemplateRoutes } from './routes/ab-test-templates';
app.use(`/api/${apiVersion}/ab-test-templates`, abTestTemplateRoutes);

// Import and mount A/B Test Prioritization routes
import { default as abTestPrioritizationRoutes } from './routes/ab-test-prioritization';
app.use(`/api/${apiVersion}/ab-test-prioritization`, abTestPrioritizationRoutes);

// A/B Test Monitoring and Optimization Routes
import { default as abTestMonitoringRoutes } from './routes/ab-test-monitoring';
app.use(`/api/${apiVersion}/ab-test-monitoring`, abTestMonitoringRoutes);

// A/B Test Auto Configuration Routes
import { default as abTestAutoConfigurationRoutes } from './routes/ab-test-auto-configuration';
app.use(`/api/${apiVersion}/ab-test-auto-configuration`, abTestAutoConfigurationRoutes);

// Import and mount Multi-Dimensional Testing routes
import { default as multiDimensionalTestingRoutes } from './routes/multi-dimensional-testing';
import { default as statisticalMonitoringRoutes } from './routes/statistical-monitoring';
app.use(`/api/${apiVersion}/multi-dimensional-testing`, multiDimensionalTestingRoutes);
app.use(`/api/${apiVersion}/statistical-monitoring`, statisticalMonitoringRoutes);

// Import and mount Analytics routes
import analyticsRoutes, { initializeAnalyticsService } from './routes/analytics';
app.use(`/api/${apiVersion}/analytics`, analyticsRoutes);

// Import and mount Universal API routes
import universalAPIRoutes from './routes/universal-api';
app.use(`/api/${apiVersion}/universal`, universalAPIRoutes);

// Import and mount Pipeline Visualization routes
import pipelineVisualizationRoutes from './routes/pipeline-visualization';
app.use(`/api/${apiVersion}/pipeline`, pipelineVisualizationRoutes);

// Import and mount Revenue Forecasting routes
import revenueForecastingRoutes from './routes/revenue-forecasting';
app.use(`/api/${apiVersion}/forecast`, revenueForecastingRoutes);

// Import and mount Account Intelligence routes
import { default as accountIntelligenceRoutes } from './routes/account-intelligence';
app.use(`/api/${apiVersion}/accounts`, accountIntelligenceRoutes);

// Import and mount Executive KPI routes
import { default as executiveKPIRoutes } from './routes/executive-kpi';
app.use(`/api/${apiVersion}/executive-kpi`, executiveKPIRoutes);

// Import and mount Hot Accounts routes
import { default as hotAccountsRoutes } from './routes/hot-accounts';
app.use(`/api/${apiVersion}/hot-accounts`, hotAccountsRoutes);

// Import and mount Visitor Intelligence routes
import { default as visitorIntelligenceRoutes } from './routes/visitor-intelligence';
app.use(`/api/${apiVersion}/visitor-intelligence`, visitorIntelligenceRoutes);

// Import and mount Territory Management routes
import { default as territoryManagementRoutes } from './routes/territory-management';
app.use(`/api/${apiVersion}/territory-management`, territoryManagementRoutes);

// Import and mount Automated Lead Routing routes
import { default as automatedLeadRoutingRoutes } from './routes/automated-lead-routing';
app.use(`/api/${apiVersion}/lead-routing`, automatedLeadRoutingRoutes);

// Import and mount Real-time Notifications routes
import { default as realTimeNotificationsRoutes } from './routes/real-time-notifications';
app.use(`/api/${apiVersion}/notifications`, realTimeNotificationsRoutes);

// Import and mount Lead Qualification routes
import { default as leadQualificationRoutes } from './routes/lead-qualification';
app.use(`/api/${apiVersion}/qualification`, leadQualificationRoutes);

// Import and mount Sales Velocity routes
import { default as salesVelocityRoutes } from './routes/sales-velocity';
app.use(`/api/${apiVersion}/sales-velocity`, salesVelocityRoutes);

// Import and mount OAuth routes
import { default as oauthRoutes } from './routes/oauth';
app.use(`/api/${apiVersion}/oauth`, oauthRoutes);

// Import and mount Real-time Scoring routes
import { default as realtimeScoringRoutes } from './routes/realtime-scoring';
app.use(`/api/${apiVersion}/realtime-scoring`, realtimeScoringRoutes);

// Import and mount Contact Enrichment routes
import { default as contactEnrichmentRoutes } from './routes/contact-enrichment';
app.use(`/api/${apiVersion}/contact-enrichment`, contactEnrichmentRoutes);

// Import and mount Custom Field Mapping routes
import { default as customFieldMappingRoutes } from './routes/custom-field-mapping';
app.use(`/api/${apiVersion}/field-mapping`, customFieldMappingRoutes);

// Import and mount Sync Engine routes
import { default as syncEngineRoutes } from './routes/sync-engine';
app.use(`/api/${apiVersion}/sync-engine`, syncEngineRoutes);

// Import and mount Duplicate Detection routes
import { default as duplicateDetectionRoutes } from './routes/duplicate-detection';
app.use(`/api/${apiVersion}/duplicate-detection`, duplicateDetectionRoutes);

// Import and mount Webhook Processing routes
import { default as webhookProcessingRoutes } from './routes/webhook-processing';
app.use(`/api/${apiVersion}/webhook-processing`, webhookProcessingRoutes);

// Import and mount Universal Error Handling routes
import { default as universalErrorHandlingRoutes } from './routes/universal-error-handling';
app.use(`/api/${apiVersion}/error-handling`, universalErrorHandlingRoutes);

// Import and mount Universal Audit Logging routes
import { default as universalAuditLoggingRoutes } from './routes/universal-audit-logging';
app.use(`/api/${apiVersion}/audit`, universalAuditLoggingRoutes);

// Import and mount Enterprise Prospect Detection routes
import { createEnterpriseProspectDetectionRouter } from './routes/enterprise-prospect-detection';
app.use(`/api/${apiVersion}/prospects`, createEnterpriseProspectDetectionRouter(redisManager.getClient()));

// Import and mount Account-Based Marketing routes
import { default as accountBasedMarketingRoutes } from './routes/account-based-marketing';
app.use(`/api/${apiVersion}/abm`, accountBasedMarketingRoutes);

// Import and mount Universal Revenue Attribution routes
import { default as universalRevenueAttributionRoutes } from './routes/universal-revenue-attribution';
app.use(`/api/${apiVersion}/attribution`, universalRevenueAttributionRoutes);

// Import and mount Universal Marketing Platform Integration Hub routes
import { default as universalMarketingPlatformIntegrationHubRoutes } from './routes/universal-marketing-platform-integration-hub';
app.use(`/api/${apiVersion}/marketing-platform-hub`, universalMarketingPlatformIntegrationHubRoutes);

// Import and mount Universal Automated Email Sequence Engine routes
import { default as universalAutomatedEmailSequenceRoutes } from './routes/universal-automated-email-sequence';
app.use(`/api/${apiVersion}/email-automation`, universalAutomatedEmailSequenceRoutes);

// Import and mount Universal Sales Alert and Notification System routes
import { default as universalSalesAlertNotificationRoutes } from './routes/universal-sales-alert-notification';
app.use(`/api/${apiVersion}/alerts`, universalSalesAlertNotificationRoutes);

// Import and mount Universal Analytics Platform Integration routes
import { default as universalAnalyticsPlatformIntegrationRoutes } from './routes/universal-analytics-platform-integration';
app.use(`/api/${apiVersion}/analytics-platforms`, universalAnalyticsPlatformIntegrationRoutes);

// Import and mount Universal Audience Segmentation Engine routes
import { default as universalAudienceSegmentationRoutes } from './routes/universal-audience-segmentation';
app.use(`/api/${apiVersion}/audience-segmentation`, universalAudienceSegmentationRoutes);

// Import and mount Universal Attribution Modeling Framework routes
import { default as universalAttributionModelingRoutes } from './routes/universal-attribution-modeling';
app.use(`/api/${apiVersion}/attribution-modeling`, universalAttributionModelingRoutes);

// Import and mount Universal Full-Funnel Attribution Tracking routes
import { default as universalFullFunnelAttributionRoutes } from './routes/universal-full-funnel-attribution';
app.use(`/api/${apiVersion}/full-funnel-attribution`, universalFullFunnelAttributionRoutes);

// Import and mount Universal Content Performance Analysis routes
import { default as universalContentPerformanceRoutes } from './routes/universal-content-performance';
app.use(`/api/${apiVersion}/content-performance`, universalContentPerformanceRoutes);

// Import and mount Universal Performance Tracking and Analytics Dashboard routes
import { default as performanceDashboardRoutes } from './routes/performance-dashboard';
app.use(`/api/${apiVersion}/performance-dashboard`, performanceDashboardRoutes);

// Import and mount Cross-Industry Performance Analytics routes
import { default as crossIndustryPerformanceAnalyticsRoutes } from './routes/cross-industry-performance-analytics';
app.use(`/api/${apiVersion}/cross-industry-performance`, crossIndustryPerformanceAnalyticsRoutes);

// Import and mount Dashboard Management routes
import { default as dashboardManagementRoutes } from './routes/dashboard-management';
app.use(`/api/${apiVersion}/dashboards`, dashboardManagementRoutes);

// Import and mount Universal Rule Customization Engine routes
import { default as universalRuleCustomizationRoutes } from './routes/universal-rule-customization';
app.use(`/api/${apiVersion}/rule-customization`, universalRuleCustomizationRoutes);

// Import and mount Universal Marketing Reporting routes
import { default as universalMarketingReportingRoutes } from './routes/universal-marketing-reporting';
app.use(`/api/${apiVersion}/marketing-reporting`, universalMarketingReportingRoutes);

// Import and mount Smart Onboarding routes
import { default as smartOnboardingRoutes } from './routes/smart-onboarding';
app.use(`/api/${apiVersion}/smart-onboarding`, smartOnboardingRoutes);

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
        `GET /api/${apiVersion}/analytics/data`,
      ],
    });
  });

  // Global error handler

  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error('Error:', err);

      res.status(err.status || 500).json({
        error:
          process.env.NODE_ENV === 'production'
            ? 'Internal Server Error'
            : err.message,
        message: 'An error occurred processing your request',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    }
  );

  console.log('🔗 Error handlers applied after GraphQL middleware');
}

// Universal tracking endpoints (placeholder for future implementation)
app.post(`/api/${apiVersion}/tracking/session`, (req, res) => {
  res.json({
    success: true,
    message: 'Session tracking endpoint ready',
    platform: req.platform,
    sessionId: `session_${Date.now()}`,
  });
});

app.post(`/api/${apiVersion}/tracking/event`, (req, res) => {
  res.json({
    success: true,
    message: 'Event tracking endpoint ready',
    platform: req.platform,
    eventId: `event_${Date.now()}`,
  });
});

app.get(`/api/${apiVersion}/analytics/data`, (req, res) => {
  res.json({
    success: true,
    message: 'Analytics data endpoint ready',
    platform: req.platform,
    data: [],
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
        health: 'GET /api/v1/events/health',
      },
      charts: {
        timeseries: 'GET /api/v1/charts/timeseries',
        distribution: 'GET /api/v1/charts/distribution',
        funnel: 'GET /api/v1/charts/funnel',
        comparison: 'GET /api/v1/charts/comparison',
        widgets: 'GET /api/v1/charts/widgets/:type',
        dashboard: 'POST /api/v1/charts/dashboard',
    dashboards: {
      create: 'POST /api/v1/dashboards',
      list: 'GET /api/v1/dashboards',
      get: 'GET /api/v1/dashboards/:id',
      update: 'PUT /api/v1/dashboards/:id',
      delete: 'DELETE /api/v1/dashboards/:id',
      widgets: {
        add: 'POST /api/v1/dashboards/:id/widgets',
        update: 'PUT /api/v1/dashboards/:id/widgets/:widgetId',
        remove: 'DELETE /api/v1/dashboards/:id/widgets/:widgetId'
      },
      filters: {
        add: 'POST /api/v1/dashboards/:id/filters',
        apply: 'POST /api/v1/dashboards/:id/filters/apply'
      },
      templates: 'GET /api/v1/dashboard-templates',
      export: 'POST /api/v1/dashboards/:id/export'
    },
        export: 'POST /api/v1/charts/export',
        health: 'GET /api/v1/charts/health',
        metrics: 'GET /api/v1/charts/metrics',
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
          trigger: 'POST /api/v1/integrations/webhooks/:id/trigger',
        },
        syncJobs: {
          list: 'GET /api/v1/integrations/sync-jobs',
          create: 'POST /api/v1/integrations/sync-jobs',
          get: 'GET /api/v1/integrations/sync-jobs/:id',
          cancel: 'POST /api/v1/integrations/sync-jobs/:id/cancel',
        },
      },
    },
    tracking: {
      session: 'POST /api/v1/tracking/session',
      event: 'POST /api/v1/tracking/event',
    },
    analytics: {
      data: 'GET /api/v1/analytics/data',
    },
    websocket: {
      endpoint: `ws://localhost:${port}/api/v1/ws`,
      description: 'Real-time analytics and metrics streaming',
      authentication: 'URL params: ?token=JWT_TOKEN or ?apiKey=API_KEY',
      commands: [
        'subscribe - Subscribe to real-time data rooms',
        'unsubscribe - Unsubscribe from rooms',
        'setMetricsFrequency - Configure metrics update frequency',
        'ping - Keep connection alive',
      ],
      rooms: ['realtime-metrics - Live analytics metrics and visitor data'],
    },
  };

  // Add GraphQL info if available
  if (graphQLServer) {
    endpoints.graphql = {
      endpoint: 'POST /api/v1/graphql',
      playground: 'GET /api/v1/graphql',
      description:
        'Full GraphQL API with queries, mutations, and subscriptions',
    };
  }

  res.json({
    name: 'Optimizely Universal API',
    version: apiVersion,
    description:
      'Universal, platform-agnostic API for website optimization and tracking',
    endpoints,
    supportedPlatforms: [
      'WordPress',
      'Shopify',
      'Wix',
      'Squarespace',
      'React',
      'Vue',
      'Angular',
      'Static HTML',
      'Universal',
    ],
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
      console.log(
        '⚠️  Database connection failed, continuing without database (degraded mode)'
      );
      console.log(
        '   Database will be available once DATABASE_URL is configured'
      );
      // Database error is expected in development without configured DATABASE_URL
      console.debug('Database error details:', dbError);
    }

    // Initialize Analytics Service
    try {
      analyticsService = new AnalyticsService(redisManager.getClient());
      // Initialize the analytics routes service
      initializeAnalyticsService(redisManager.getClient());
      console.log('📊 Analytics service started');
    } catch (analyticsError) {
      console.log(
        '⚠️  Analytics service failed to start, continuing with limited functionality'
      );
      console.debug('Analytics error details:', analyticsError);
    }

    // Initialize Universal API Service
    try {
      const { initializeUniversalAPIService } = await import('./routes/universal-api');
      initializeUniversalAPIService(redisManager.getClient(), analyticsService);
      console.log('🌐 Universal API service started');
    } catch (universalAPIError) {
      console.log(
        '⚠️  Universal API service failed to start, continuing with limited functionality'
      );
      console.debug('Universal API error details:', universalAPIError);
    }

    // Initialize Pipeline Visualization Service
    try {
      const { initializePipelineVisualizationService } = await import('./routes/pipeline-visualization');
      initializePipelineVisualizationService(redisManager.getClient());
      console.log('📊 Pipeline Visualization service started');
    } catch (pipelineError) {
      console.log(
        '⚠️  Pipeline Visualization service failed to start, continuing with limited functionality'
      );
      console.debug('Pipeline error details:', pipelineError);
    }

    // Initialize Revenue Forecasting Service
    try {
            const { createRevenueForecastingService } = await import('./services/revenue-forecasting-service');
      const { VisualizationService } = await import('./services/visualization-service');
      const { PipelineVisualizationService } = await import('./services/pipeline-visualization-service');
      const { default: RevenueAttributionService } = await import('./services/revenue-attribution-service');

      // Create service dependencies
      const visualizationService = new VisualizationService(analyticsService);
      const revenueAttributionService = new RevenueAttributionService(redisManager.getClient());
      const pipelineService = new PipelineVisualizationService(
        visualizationService,
        analyticsService,
        revenueAttributionService
      );
      const forecastingService = createRevenueForecastingService(analyticsService, pipelineService, visualizationService);

      // Store service in app for routes to access
      app.set('forecastingService', forecastingService);

      console.log('📈 Revenue Forecasting service started');
    } catch (forecastError) {
      console.log(
        '⚠️  Revenue Forecasting service failed to start, continuing with limited functionality'
      );
      console.debug('Forecast error details:', forecastError);
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

      console.log(
        '🔗 Integration service started and connected to analytics pipeline'
      );
    } catch (integrationError) {
      console.log(
        '⚠️  Integration service failed to start, continuing without integrations'
      );
      console.debug('Integration error details:', integrationError);
    }

    // Initialize Enterprise Infrastructure Service
    try {
      const { enterpriseInfrastructure } = await import('./services/enterprise-infrastructure-service');
      await enterpriseInfrastructure.initialize();

      // Log infrastructure events
      enterpriseInfrastructure.on('infrastructure:initialized', () => {
        console.log('🏗️  Enterprise infrastructure monitoring activated');
      });

      enterpriseInfrastructure.on('scaling:up', (event: any) => {
        console.log(`🔼 Auto-scaled up to ${event.toInstances} instances`);
      });

      enterpriseInfrastructure.on('scaling:down', (event: any) => {
        console.log(`🔽 Auto-scaled down to ${event.toInstances} instances`);
      });

      console.log('🏗️  Enterprise Infrastructure Service started successfully');
    } catch (infrastructureError) {
      console.log(
        '⚠️  Enterprise Infrastructure service failed to start, continuing with basic monitoring'
      );
      console.debug('Infrastructure error details:', infrastructureError);
    }

    // Initialize Account Intelligence Service
    try {
      const { createAccountIntelligenceService } = await import('./services/account-intelligence-service');

      // Create account intelligence service
      const intelligenceService = createAccountIntelligenceService(analyticsService, redisManager);

      // Store service in app for routes to access
      app.set('intelligenceService', intelligenceService);

      // Log intelligence events
      intelligenceService.on('accountIntelligenceUpdate', (event: any) => {
        console.log(`🧠 Account intelligence updated for account ${event.accountId}`);
      });

      intelligenceService.on('forceCollection', () => {
        console.log('🔄 Account intelligence metrics collection forced');
      });

      console.log('🧠 Account Intelligence Service started successfully');
    } catch (intelligenceError) {
      console.log(
        '⚠️  Account Intelligence service failed to start, continuing with limited functionality'
      );
      console.debug('Intelligence error details:', intelligenceError);
    }

    // Initialize Executive KPI Service
    try {
      const { initializeExecutiveKPIService } = await import('./routes/executive-kpi');

      // Initialize executive KPI service
      initializeExecutiveKPIService(redisManager.getClient());

      console.log('🏆 Executive KPI Service started successfully');
    } catch (executiveKPIError) {
      console.log(
        '⚠️  Executive KPI service failed to start, continuing with limited functionality'
      );
      console.debug('Executive KPI error details:', executiveKPIError);
    }

    // Initialize Competitive Intelligence Service
    try {
      const { initializeCompetitiveIntelligenceService } = await import('./routes/competitive-intelligence');

      // Initialize competitive intelligence service
      initializeCompetitiveIntelligenceService(redisManager.getClient(), analyticsService);

      console.log('🏆 Competitive Intelligence Service started successfully');
    } catch (competitiveError) {
      console.log(
        '⚠️  Competitive Intelligence service failed to start, continuing with limited functionality'
      );
      console.debug('Competitive Intelligence error details:', competitiveError);
    }

    // Initialize Campaign Attribution Service
    try {
      const { initializeCampaignAttributionService } = await import('./routes/campaign-attribution');

      // Initialize campaign attribution service
      initializeCampaignAttributionService(redisManager.getClient());

      console.log('📊 Campaign Attribution Service started successfully');
    } catch (attributionError) {
      console.log(
        '⚠️  Campaign Attribution service failed to start, continuing with limited functionality'
      );
      console.debug('Campaign Attribution error details:', attributionError);
    }

    // Initialize GraphQL BEFORE starting the HTTP server
    await setupGraphQL();

    // Create HTTP server with WebSocket support
    const httpServer = createServer(app);

    // Initialize WebSocket server
    const wsServer = new OptimizelyWebSocketServer(analyticsService);

    // Handle WebSocket upgrade requests
    httpServer.on('upgrade', (request, socket, head) => {
      const pathname = new URL(
        request.url || '',
        `http://${request.headers.host}`
      ).pathname;

      if (pathname === `/api/${apiVersion}/ws`) {
        wsServer.handleUpgrade(request, socket, head);
      } else {
        socket.destroy();
      }
    });

    const server = httpServer.listen(port, () => {
      console.log(
        `🚀 Universal API server listening at http://localhost:${port}`
      );
      console.log(
        `📚 API documentation available at http://localhost:${port}/api/${apiVersion}/docs`
      );
      console.log(
        `🏥 Health check available at http://localhost:${port}/health`
      );
      console.log(`🌍 Platform-agnostic architecture enabled`);
      console.log(
        `📊 GraphQL API available at http://localhost:${port}/api/${apiVersion}/graphql`
      );
      console.log(`⚡ GraphQL queries, mutations, and subscriptions ready`);
      console.log(
        `🔌 WebSocket server available at ws://localhost:${port}/api/${apiVersion}/ws`
      );
      console.log(`📡 Real-time metrics streaming enabled`);
    });

    // Graceful WebSocket server shutdown
    const originalClose = server.close.bind(server);
    server.close = function (callback?: (err?: Error) => void) {
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
      analyticsService.destroy();
      console.log('📴 Analytics service stopped');
    } catch (error) {
      console.log('⚠️  Error stopping analytics service:', error);
    }

    // Stop Enterprise Infrastructure service
    try {
      const { enterpriseInfrastructure } = await import('./services/enterprise-infrastructure-service');
      await enterpriseInfrastructure.shutdown();
      console.log('📴 Enterprise Infrastructure service stopped');
    } catch (error) {
      console.log('⚠️  Error stopping enterprise infrastructure service:', error);
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


