import express from 'express';
import { CompanyData, firmographicService } from '../services/firmographic-service';

const router = express.Router();

// =============================================================================
// COMPANY DATA ENRICHMENT ENDPOINTS - Universal API Access
// =============================================================================

/**
 * POST /api/v1/firmographic/enrich
 * Enrich company data by domain or identifier
 */
router.post('/enrich', async (req, res) => {
  try {
    const { identifier, existingData } = req.body;

    if (!identifier) {
      return res.status(400).json({
        error: 'Missing required field: identifier'
      });
    }

    const enrichedData = await firmographicService.enrichCompanyData(identifier, existingData);

    res.json({
      success: true,
      data: enrichedData
    });
  } catch (error) {
    res.status(500).json({
      error: 'Enrichment failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/firmographic/batch-enrich
 * Enrich multiple companies in a single request
 */
router.post('/batch-enrich', async (req, res) => {
  try {
    const { identifiers } = req.body;

    if (!Array.isArray(identifiers) || identifiers.length === 0) {
      return res.status(400).json({
        error: 'Invalid identifiers'
      });
    }

    const enrichedData = await firmographicService.processCompanyBatch(identifiers);

    res.json({
      success: true,
      data: enrichedData,
      count: enrichedData.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Batch enrichment failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/firmographic/validate
 * Validate company data against quality rules
 */
router.post('/validate', async (req, res) => {
  try {
    const { companyData } = req.body;

    if (!companyData) {
      return res.status(400).json({
        error: 'Company data required'
      });
    }

    const validation = firmographicService.validateCompanyData(companyData);

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    res.status(500).json({
      error: 'Validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/firmographic/search
 * Search for companies based on criteria
 */
router.post('/search', async (req, res) => {
  try {
    const {
      industry,
      employeeRange,
      revenueRange,
      location,
      technologies,
      limit = 10
    } = req.body;

    if (limit > 100) {
      return res.status(400).json({
        error: 'Limit too high',
        message: 'Maximum limit is 100 companies'
      });
    }

    const results = await firmographicService.searchCompanies({
      industry,
      employeeRange,
      revenueRange,
      location,
      technologies,
      limit
    });

    res.json({
      success: true,
      data: results,
      count: results.length,
      message: 'Company search completed successfully'
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/v1/firmographic/to-ml-format
 * Convert company data to ML scoring format
 */
router.post('/to-ml-format', async (req, res) => {
  try {
    const { companyData } = req.body;

    if (!companyData || typeof companyData !== 'object') {
      return res.status(400).json({
        error: 'Invalid company data',
        message: 'Company data object is required'
      });
    }

    const mlFormat = firmographicService.toMLFormat(companyData as CompanyData);

    res.json({
      success: true,
      data: mlFormat,
      message: 'Company data converted to ML format successfully'
    });
  } catch (error) {
    console.error('ML format conversion error:', error);
    res.status(500).json({
      error: 'Conversion failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// =============================================================================
// SERVICE MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * GET /api/v1/firmographic/health
 * Check service health and status
 */
router.get('/health', async (req, res) => {
  try {
    const health = await firmographicService.healthCheck();
    res.json({ success: true, health });
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/v1/firmographic/cache
 * Clear the enrichment cache (admin endpoint)
 */
router.delete('/cache', async (req, res) => {
  try {
    // In production, add authentication/authorization here
    firmographicService.clearCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      error: 'Cache clear failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/v1/firmographic/providers
 * Get information about enrichment providers
 */
router.get('/providers', async (req, res) => {
  try {
    // Mock provider info - in production, return actual provider status
    const providers = [
      {
        name: 'clearbit',
        priority: 1,
        enabled: true,
        status: 'active',
        costPerRequest: 0.10,
        rateLimit: { requestsPerMinute: 600, requestsPerDay: 50000 }
      },
      {
        name: 'zoominfo',
        priority: 2,
        enabled: true,
        status: 'active',
        costPerRequest: 0.15,
        rateLimit: { requestsPerMinute: 300, requestsPerDay: 25000 }
      },
      {
        name: 'apollo',
        priority: 3,
        enabled: true,
        status: 'active',
        costPerRequest: 0.08,
        rateLimit: { requestsPerMinute: 200, requestsPerDay: 10000 }
      },
      {
        name: 'builtwith',
        priority: 4,
        enabled: true,
        status: 'active',
        costPerRequest: 0.05,
        rateLimit: { requestsPerMinute: 100, requestsPerDay: 5000 }
      }
    ];

    res.json({
      success: true,
      providers,
      count: providers.length,
      message: 'Provider information retrieved successfully'
    });
  } catch (error) {
    console.error('Provider info error:', error);
    res.status(500).json({
      error: 'Provider info retrieval failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// =============================================================================
// ANALYTICS & REPORTING ENDPOINTS
// =============================================================================

/**
 * GET /api/v1/firmographic/stats
 * Get enrichment statistics and usage metrics
 */
router.get('/stats', async (req, res) => {
  try {
    const health = await firmographicService.healthCheck();

    // Mock stats - in production, track actual usage
    const stats = {
      cacheSize: health.cacheSize,
      providersEnabled: health.providersEnabled,
      enrichmentsToday: Math.floor(Math.random() * 1000) + 100,
      enrichmentsThisMonth: Math.floor(Math.random() * 10000) + 1000,
      averageEnrichmentTime: Math.floor(Math.random() * 1000) + 200, // milliseconds
      averageDataQuality: Math.floor(Math.random() * 20) + 80, // 80-100%
      totalCostToday: (Math.random() * 50 + 10).toFixed(2), // $10-60
      totalCostThisMonth: (Math.random() * 500 + 100).toFixed(2), // $100-600
      topIndustries: [
        { industry: 'technology', count: Math.floor(Math.random() * 100) + 50 },
        { industry: 'healthcare', count: Math.floor(Math.random() * 80) + 30 },
        { industry: 'finance', count: Math.floor(Math.random() * 70) + 25 },
        { industry: 'manufacturing', count: Math.floor(Math.random() * 60) + 20 },
        { industry: 'consulting', count: Math.floor(Math.random() * 50) + 15 }
      ]
    };

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
      message: 'Enrichment statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Stats retrieval failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// =============================================================================
// ERROR HANDLING & MIDDLEWARE
// =============================================================================

// Global error handler for this router
router.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Firmographic API error:', error);

  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred in the firmographic service',
      timestamp: new Date().toISOString()
    });
  }

  next(error);
});

export default router;
