import { Request, Response, Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { redisManager } from '../services/redis-client';
import OAuthService, { 
  OAuthAuthorizationRequest, 
  OAuthTokenExchange, 
  OAuthRefreshRequest, 
  OAuthRevocationRequest,
  OAuthFilters 
} from '../services/oauth-service';

const router = Router();

// Initialize service
const oauthService = new OAuthService(redisManager.getClient());
oauthService.generateMockData();

// =============================================================================
// PROVIDER MANAGEMENT ROUTES
// =============================================================================

/**
 * GET /overview - OAuth system overview and dashboard
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const providers = oauthService.getProviders();
    const tokens = oauthService.getTokens();
    const activeSessions = oauthService.getSessions({ isComplete: false });
    const metrics = oauthService.getMetrics();
    const healthStatus = await oauthService.healthCheck();

    const overview = {
      system: {
        status: healthStatus.status,
        providersCount: providers.length,
        activeProvidersCount: providers.filter(p => p.isActive).length,
        tokensCount: tokens.length,
        activeTokensCount: tokens.filter(t => t.expiresAt > new Date()).length,
        activeSessionsCount: activeSessions.length
      },
      providers: providers.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        isActive: p.isActive,
        tokensCount: tokens.filter(t => t.providerId === p.id).length,
        activeTokensCount: tokens.filter(t => t.providerId === p.id && t.expiresAt > new Date()).length
      })),
      metrics,
      recentActivity: oauthService.getAuditLogs().slice(0, 10),
      recommendations: [
        {
          type: 'security',
          message: 'Consider enabling PKCE for all authorization flows',
          priority: 'medium'
        },
        {
          type: 'performance',
          message: 'Review token refresh patterns for optimization',
          priority: 'low'
        }
      ]
    };

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get OAuth overview'
    });
  }
});

/**
 * GET /providers - List all OAuth providers
 */
router.get('/providers', [
  query('type').optional().isIn(['salesforce', 'hubspot', 'pipedrive', 'custom']),
  query('isActive').optional().isBoolean()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { type, isActive } = req.query;
    const filters: any = {};
    
    if (type) filters.type = type;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const providers = oauthService.getProviders(filters);
    const tokens = oauthService.getTokens();

    const providersWithStats = providers.map(provider => {
      const providerTokens = tokens.filter(t => t.providerId === provider.id);
      const activeTokens = providerTokens.filter(t => t.expiresAt > new Date());

      return {
        ...provider,
        clientSecret: undefined, // Don't expose secrets
        stats: {
          totalTokens: providerTokens.length,
          activeTokens: activeTokens.length,
          expiredTokens: providerTokens.length - activeTokens.length
        }
      };
    });

    res.json({
      success: true,
      data: providersWithStats,
      total: providersWithStats.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get providers'
    });
  }
});

/**
 * POST /authorize - Generate authorization URL
 */
router.post('/authorize', [
  body('providerId').notEmpty().withMessage('Provider ID is required'),
  body('userId').notEmpty().withMessage('User ID is required'),
  body('scope').optional().isArray(),
  body('state').optional().isString(),
  body('usePKCE').optional().isBoolean(),
  body('customParams').optional().isObject()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const authRequest: OAuthAuthorizationRequest = req.body;
    const result = await oauthService.generateAuthorizationUrl(authRequest);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate authorization URL'
    });
  }
});

/**
 * POST /callback - Handle OAuth callback and exchange code for token
 */
router.post('/callback', [
  body('code').notEmpty().withMessage('Authorization code is required'),
  body('state').notEmpty().withMessage('State parameter is required'),
  body('sessionId').optional().isString(),
  body('codeVerifier').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const exchange: OAuthTokenExchange = req.body;
    const token = await oauthService.exchangeCodeForToken(exchange);

    res.json({
      success: true,
      data: {
        ...token,
        refreshToken: undefined // Don't expose refresh token in response for security
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to exchange code for token'
    });
  }
});

/**
 * GET /tokens - List tokens with filtering
 */
router.get('/tokens', [
  query('providerId').optional().isString(),
  query('userId').optional().isString(),
  query('organizationId').optional().isString(),
  query('isActive').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { providerId, userId, organizationId, isActive, page = 1, limit = 20 } = req.query;
    
    const filters: OAuthFilters = {};
    if (providerId) filters.providerId = providerId as string;
    if (userId) filters.userId = userId as string;
    if (organizationId) filters.organizationId = organizationId as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const allTokens = oauthService.getTokens(filters);
    
    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedTokens = allTokens.slice(startIndex, endIndex);

    // Remove sensitive data
    const safeTokens = paginatedTokens.map(token => ({
      ...token,
      accessToken: `${token.accessToken.substring(0, 8)}...`,
      refreshToken: undefined
    }));

    res.json({
      success: true,
      data: safeTokens,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: allTokens.length,
        totalPages: Math.ceil(allTokens.length / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tokens'
    });
  }
});

/**
 * POST /tokens/refresh - Refresh an access token
 */
router.post('/tokens/refresh', [
  body('providerId').notEmpty().withMessage('Provider ID is required'),
  body('userId').notEmpty().withMessage('User ID is required'),
  body('refreshToken').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const refreshRequest: OAuthRefreshRequest = req.body;
    const newToken = await oauthService.refreshToken(refreshRequest);

    res.json({
      success: true,
      data: {
        ...newToken,
        refreshToken: undefined // Don't expose refresh token in response
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh token'
    });
  }
});

/**
 * POST /tokens/validate - Validate a token
 */
router.post('/tokens/validate', [
  body('providerId').notEmpty().withMessage('Provider ID is required'),
  body('userId').notEmpty().withMessage('User ID is required'),
  body('accessToken').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { providerId, userId, accessToken } = req.body;
    const validation = await oauthService.validateToken(providerId, userId, accessToken);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate token'
    });
  }
});

/**
 * GET /health - OAuth service health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await oauthService.healthCheck();

    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 206 : 503;

    res.status(statusCode).json({
      success: health.status !== 'unhealthy',
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check health'
    });
  }
});

export default router;
