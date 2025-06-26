import express from 'express';
import rateLimit from 'express-rate-limit';
import { ipToCompanyService } from '../services/ip-to-company-service';

const router = express.Router();

// =============================================================================
// RATE LIMITING - Protect IP lookup endpoints
// =============================================================================
const ipLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many IP lookup requests',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// =============================================================================
// IP-TO-COMPANY MAPPING ENDPOINTS
// =============================================================================

/**
 * POST /api/v1/ip-company/identify
 * Identify company from IP address
 */
router.post('/identify', ipLookupLimiter as any, async (req, res) => {
  try {
    const { ip } = req.body;

    // Validate input
    if (!ip) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'IP address is required',
        code: 'MISSING_IP'
      });
    }

    // Identify company
    const result = await ipToCompanyService.identifyCompany(ip);

    if (!result) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Company information not found for this IP address',
        code: 'COMPANY_NOT_FOUND',
        ip
      });
    }

    // Return successful result
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('IP company identification error:', error);

    if (error instanceof Error && error.message.includes('Invalid IP address')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message,
        code: 'INVALID_IP'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to identify company from IP address',
      code: 'IDENTIFICATION_FAILED'
    });
  }
});

/**
 * GET /api/v1/ip-company/identify/:ip
 * Identify company from IP address (GET method for convenience)
 */
router.get('/identify/:ip', ipLookupLimiter as any, async (req, res) => {
  try {
    const { ip } = req.params;

    // Identify company
    const result = await ipToCompanyService.identifyCompany(ip);

    if (!result) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Company information not found for this IP address',
        code: 'COMPANY_NOT_FOUND',
        ip
      });
    }

    // Return successful result
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('IP company identification error:', error);

    if (error instanceof Error && error.message.includes('Invalid IP address')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message,
        code: 'INVALID_IP'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to identify company from IP address',
      code: 'IDENTIFICATION_FAILED'
    });
  }
});

/**
 * POST /api/v1/ip-company/batch
 * Batch identify companies from multiple IP addresses
 */
router.post('/batch', ipLookupLimiter as any, async (req, res) => {
  try {
    const { ips } = req.body;

    // Validate input
    if (!ips || !Array.isArray(ips)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Array of IP addresses is required',
        code: 'MISSING_IPS'
      });
    }

    if (ips.length > 50) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Maximum 50 IP addresses allowed per batch request',
        code: 'BATCH_LIMIT_EXCEEDED'
      });
    }

    // Process all IPs in parallel
    const results = await Promise.allSettled(
      ips.map(async (ip: string) => {
        try {
          const result = await ipToCompanyService.identifyCompany(ip);
          return { ip, success: true, data: result };
        } catch (error) {
          return {
            ip,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    // Process results
    const successful = results
      .filter(result => result.status === 'fulfilled' && result.value.success)
      .map(result => (result as PromiseFulfilledResult<any>).value);

    const failed = results
      .filter(result => result.status === 'fulfilled' && !result.value.success)
      .map(result => (result as PromiseFulfilledResult<any>).value);

    const errors = results
      .filter(result => result.status === 'rejected')
      .map(result => ({
        error: (result as PromiseRejectedResult).reason
      }));

    res.json({
      success: true,
      data: {
        total: ips.length,
        successful: successful.length,
        failed: failed.length,
        results: {
          successful,
          failed,
          errors
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch IP company identification error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process batch IP identification',
      code: 'BATCH_IDENTIFICATION_FAILED'
    });
  }
});

/**
 * GET /api/v1/ip-company/health
 * Health check for IP-to-company service
 */
router.get('/health', async (req, res) => {
  try {
    const health = await ipToCompanyService.healthCheck();
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('IP company service health check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Health check failed',
      code: 'HEALTH_CHECK_FAILED'
    });
  }
});

/**
 * GET /api/v1/ip-company/stats
 * Get service statistics and performance metrics
 */
router.get('/stats', async (req, res) => {
  try {
    // This would be expanded with actual metrics
    const stats = {
      service: 'ip-to-company',
      version: '1.0.0',
      uptime: process.uptime(),
      endpoints: [
        'POST /identify',
        'GET /identify/:ip',
        'POST /batch',
        'GET /health',
        'GET /stats'
      ]
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('IP company service stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get service statistics',
      code: 'STATS_FAILED'
    });
  }
});

export default router;
