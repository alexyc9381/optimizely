import express, { Request, Response } from 'express';
import { AnalyticsServiceManager } from '../services/analytics-service';
import { DataQualityManager } from '../services/data-quality';

const router = express.Router();
const analyticsService = new AnalyticsServiceManager();
const dataQuality = new DataQualityManager();

// Initialize services
let servicesInitialized = false;

async function ensureServicesInitialized() {
  if (!servicesInitialized) {
    await analyticsService.initialize();
    servicesInitialized = true;
  }
}

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================

interface AuthenticatedRequest extends Request {
  apiKey?: string;
  userId?: string;
  platform: {
    type: string;
    version: string;
    userAgent: string;
  };
}

const authenticateApiKey = (req: AuthenticatedRequest, res: Response, next: Function) => {
  const apiKey = req.headers['x-api-key'] as string;
  const bearerToken = req.headers.authorization?.replace('Bearer ', '');

  if (!apiKey && !bearerToken) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'API key or Bearer token required'
    });
  }

  // Store authentication info for downstream use
  req.apiKey = apiKey || bearerToken;

  // In production, validate against database/cache
  // For now, accept any non-empty key
  if (!req.apiKey) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid API key or token'
    });
  }

  next();
};

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

const validateEventRequest = (req: AuthenticatedRequest, res: Response, next: Function) => {
  const { type, sessionId, visitorId, timestamp } = req.body;

  // Required fields validation
  if (!type || !sessionId || !visitorId) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Missing required fields: type, sessionId, visitorId'
    });
  }

  // Event type validation
  const validEventTypes = ['page_view', 'click', 'form_submit', 'download', 'custom'];
  if (!validEventTypes.includes(type)) {
    return res.status(400).json({
      error: 'validation_error',
      message: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}`
    });
  }

  // Timestamp validation (if provided)
  if (timestamp && isNaN(Date.parse(timestamp))) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Invalid timestamp format. Use ISO 8601 format.'
    });
  }

  next();
};

// =============================================================================
// EVENTS ROUTES
// =============================================================================

/**
 * POST /events - Track analytics event
 * Implementation of OpenAPI specification for event tracking
 */
router.post('/', authenticateApiKey, validateEventRequest, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureServicesInitialized();

    const { type, sessionId, visitorId, timestamp, data } = req.body;

    // Create event object with metadata
    const event = {
      type,
      sessionId,
      visitorId,
      timestamp: timestamp || new Date().toISOString(),
      data: data || {},
      platform: req.platform,
      apiKey: req.apiKey,
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.ip || req.connection.remoteAddress || 'unknown'
    };

    // Validate data quality
    const qualityResult = await dataQuality.validateEvent(event);
    if (!qualityResult.isValid) {
      return res.status(400).json({
        error: 'quality_validation_failed',
        message: 'Event failed quality validation',
        violations: qualityResult.violations
      });
    }

    // Process event through analytics pipeline
    const result = await analyticsService.ingestEvent(event);

    if (result.success) {
      res.status(201).json({
        id: result.eventId,
        status: 'tracked',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        error: 'processing_failed',
        message: 'Failed to process event'
      });
    }

  } catch (error) {
    console.error('Event tracking error:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Internal server error occurred'
    });
  }
});

/**
 * GET /events - Retrieve events with filtering and pagination
 * Implementation of OpenAPI specification for event retrieval
 */
router.get('/', authenticateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureServicesInitialized();

    // Parse query parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const eventType = req.query.type as string;
    const sessionId = req.query.sessionId as string;
    const visitorId = req.query.visitorId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Build query filters
    const filters: Record<string, unknown> = {};
    if (eventType) filters.type = eventType;
    if (sessionId) filters.sessionId = sessionId;
    if (visitorId) filters.visitorId = visitorId;
    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) (filters.timestamp as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (filters.timestamp as Record<string, unknown>).lte = new Date(endDate);
    }

    // Query events through analytics service
    const queryResult = await analyticsService.queryEvents({
      filters,
      pagination: { limit, offset },
      apiKey: req.apiKey
    });

    if (queryResult.success) {
      // Set pagination headers
      res.setHeader('X-Total-Count', queryResult.totalCount || 0);
      res.setHeader('X-Page-Count', Math.ceil((queryResult.totalCount || 0) / limit));

      res.json({
        events: queryResult.events || [],
        pagination: {
          limit,
          offset,
          total: queryResult.totalCount || 0,
          hasMore: (offset + limit) < (queryResult.totalCount || 0)
        }
      });
    } else {
      res.status(500).json({
        error: 'query_failed',
        message: queryResult.error || 'Failed to retrieve events'
      });
    }

  } catch (error) {
    console.error('Event retrieval error:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Internal server error occurred'
    });
  }
});

/**
 * GET /events/health - Events service health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await analyticsService.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      service: 'events-api',
      ...health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      service: 'events-api',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /events/:id - Retrieve specific event by ID
 * Additional endpoint for single event retrieval
 */
router.get('/:id', authenticateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureServicesInitialized();

    const eventId = req.params.id;

    const result = await analyticsService.getEventById(eventId, req.apiKey);

    if (result.success && result.event) {
      res.json(result.event);
    } else if (result.success && !result.event) {
      res.status(404).json({
        error: 'not_found',
        message: 'Event not found'
      });
    } else {
      res.status(500).json({
        error: 'retrieval_failed',
        message: result.error || 'Failed to retrieve event'
      });
    }

  } catch (error) {
    console.error('Event retrieval by ID error:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Internal server error occurred'
    });
  }
});

/**
 * DELETE /events/:id - Delete specific event (admin operation)
 * Additional endpoint for event management
 */
router.delete('/:id', authenticateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureServicesInitialized();

    const eventId = req.params.id;

    // Note: In production, add admin role validation
    const result = await analyticsService.deleteEvent(eventId, req.apiKey);

    if (result.success) {
      res.status(204).send(); // No content
    } else {
      const statusCode = result.error?.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        error: 'deletion_failed',
        message: result.error || 'Failed to delete event'
      });
    }

  } catch (error) {
    console.error('Event deletion error:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Internal server error occurred'
    });
  }
});

export default router;
