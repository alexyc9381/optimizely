import express, { Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import type { AccountIntelligenceService } from '../services/account-intelligence-service';

const router = express.Router();

// Middleware for request validation
const handleValidationErrors = (req: Request, res: Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date().toISOString(),
      platform: 'universal-ai-platform'
    });
  }
  next();
};

// Authentication middleware (placeholder - integrate with your auth system)
const authenticateRequest = (req: Request, res: Response, next: express.NextFunction) => {
  // In a real implementation, verify JWT token, API key, or session
  // For now, we'll assume authentication is handled by upstream middleware
  next();
};

// Validation rules
const validateAccountId = [
  param('accountId')
    .isString()
    .notEmpty()
    .withMessage('Account ID is required')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Account ID must be alphanumeric with optional hyphens and underscores')
];

// Add universal CORS headers for cross-platform compatibility
router.use((req: Request, res: Response, next: express.NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-platform, x-integration');
  res.header('X-Platform-Support', 'React,Vue,Angular,WordPress,Shopify,Webflow,Universal');
  res.header('X-API-Version', '1.0');
  res.header('X-Service', 'Account-Intelligence');
  next();
});

/**
 * GET /api/v1/accounts/intelligence/:accountId
 * Get comprehensive account intelligence data
 */
router.get('/intelligence/:accountId',
  authenticateRequest,
  validateAccountId,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const intelligenceService = req.app.get('intelligenceService') as AccountIntelligenceService;

      if (!intelligenceService) {
        return res.status(503).json({
          success: false,
          error: 'Account Intelligence service not available',
          timestamp: new Date().toISOString(),
          platform: 'universal-ai-platform'
        });
      }

      const { accountId } = req.params;
      const includeTimeline = req.query.includeTimeline === 'true';
      const timelineLimit = req.query.timelineLimit ? parseInt(req.query.timelineLimit as string) : 50;

      const intelligence = await intelligenceService.getAccountIntelligence(accountId, {
        includeTimeline,
        timelineLimit
      });

      res.json({
        success: true,
        data: intelligence,
        timestamp: new Date().toISOString(),
        platform: 'universal-ai-platform',
        requestId: `acc_intel_${Date.now()}_${Math.random().toString(36).substring(7)}`
      });

    } catch (error) {
      console.error('Error getting account intelligence:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve account intelligence',
        timestamp: new Date().toISOString(),
        platform: 'universal-ai-platform'
      });
    }
  }
);

/**
 * GET /api/v1/accounts/health/:accountId
 * Get account health metrics
 */
router.get('/health/:accountId',
  authenticateRequest,
  validateAccountId,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const intelligenceService = req.app.get('intelligenceService') as AccountIntelligenceService;

      if (!intelligenceService) {
        return res.status(503).json({
          success: false,
          error: 'Account Intelligence service not available',
          timestamp: new Date().toISOString(),
          platform: 'universal-ai-platform'
        });
      }

      const { accountId } = req.params;
      const healthMetrics = await intelligenceService.calculateAccountHealth(accountId);

      res.json({
        success: true,
        data: healthMetrics,
        timestamp: new Date().toISOString(),
        platform: 'universal-ai-platform',
        requestId: `acc_health_${Date.now()}_${Math.random().toString(36).substring(7)}`
      });

    } catch (error) {
      console.error('Error getting account health:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve account health metrics',
        timestamp: new Date().toISOString(),
        platform: 'universal-ai-platform'
      });
    }
  }
);

/**
 * GET /api/v1/accounts/overview
 * Get accounts overview with filtering
 */
router.get('/overview',
  authenticateRequest,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const intelligenceService = req.app.get('intelligenceService') as AccountIntelligenceService;

      if (!intelligenceService) {
        return res.status(503).json({
          success: false,
          error: 'Account Intelligence service not available',
          timestamp: new Date().toISOString(),
          platform: 'universal-ai-platform'
        });
      }

      const overview = await intelligenceService.getAccountsOverview();

      res.json({
        success: true,
        data: overview,
        timestamp: new Date().toISOString(),
        platform: 'universal-ai-platform',
        requestId: `acc_overview_${Date.now()}_${Math.random().toString(36).substring(7)}`
      });

    } catch (error) {
      console.error('Error getting accounts overview:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve accounts overview',
        timestamp: new Date().toISOString(),
        platform: 'universal-ai-platform'
      });
    }
  }
);

export default router;
