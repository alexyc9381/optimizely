/**
 * Cross-Industry Performance Analytics API Routes
 *
 * Provides REST API endpoints for:
 * - Recording and retrieving performance metrics across industries
 * - Performer profile management and analytics
 * - Industry benchmarking and comparisons
 * - Cross-industry insights and recommendations
 * - Performance tracking for College Consulting, SaaS, Manufacturing, Healthcare, FinTech
 *
 * All endpoints are platform-agnostic and support universal CORS headers
 */

import { Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import CrossIndustryPerformanceAnalyticsService, {
    Industry,
    PerformanceLevel,
    PerformanceMetricType
} from '../services/cross-industry-performance-analytics-service';

const router = Router();

// Initialize analytics service
const analyticsService = CrossIndustryPerformanceAnalyticsService.getInstance();

// Rate limiting for analytics endpoints
const analyticsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: {
    error: 'Too many analytics requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes
router.use(analyticsRateLimit as any);

// Universal CORS headers for platform compatibility
router.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('X-API-Version', '1.0');
  res.header('X-Service', 'Cross-Industry-Performance-Analytics');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// ================================
// PERFORMANCE METRICS ENDPOINTS
// ================================

/**
 * Record a new performance metric
 * POST /api/v1/cross-industry-performance/metrics
 */
router.post('/metrics',
  [
    body('performerId').isString().notEmpty().withMessage('Performer ID is required'),
    body('industry').isIn(Object.values(Industry)).withMessage('Valid industry is required'),
    body('metricType').isIn(Object.values(PerformanceMetricType)).withMessage('Valid metric type is required'),
    body('value').isNumeric().withMessage('Metric value must be numeric'),
    body('targetValue').isNumeric().withMessage('Target value must be numeric'),
    body('performerType').optional().isString().withMessage('Performer type must be a string'),
    body('period').optional().isObject().withMessage('Period must be an object'),
    body('context').optional().isObject().withMessage('Context must be an object'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const {
        performerId,
        industry,
        metricType,
        value,
        targetValue,
        performerType,
        period,
        context,
        metadata
      } = req.body;

      const metric = await analyticsService.recordPerformanceMetric(
        performerId,
        industry,
        metricType,
        parseFloat(value),
        parseFloat(targetValue),
        {
          performerType,
          period,
          context,
          metadata
        }
      );

      res.status(201).json({
        success: true,
        data: {
          metric,
          message: 'Performance metric recorded successfully'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to record performance metric',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get performance metrics with filters
 * GET /api/v1/cross-industry-performance/metrics
 */
router.get('/metrics',
  [
    query('industry').optional().isIn(Object.values(Industry)).withMessage('Invalid industry filter'),
    query('performerId').optional().isString().withMessage('Performer ID must be a string'),
    query('metricType').optional().isIn(Object.values(PerformanceMetricType)).withMessage('Invalid metric type'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601 date'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { industry, performerId, metricType, startDate, endDate, limit } = req.query;

      let metrics = analyticsService.getMetrics({
        industry: industry as Industry,
        performerId: performerId as string,
        metricType: metricType as PerformanceMetricType,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });

      // Apply limit
      if (limit) {
        metrics = metrics.slice(0, parseInt(limit as string));
      }

      res.json({
        success: true,
        data: {
          metrics,
          count: metrics.length,
          filters: { industry, performerId, metricType, startDate, endDate }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ================================
// PERFORMER ANALYTICS ENDPOINTS
// ================================

/**
 * Get performer profile and analytics
 * GET /api/v1/cross-industry-performance/performers/:performerId
 */
router.get('/performers/:performerId',
  [
    param('performerId').isString().notEmpty().withMessage('Performer ID is required'),
    query('includeMetrics').optional().isBoolean().withMessage('Include metrics must be boolean')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { performerId } = req.params;
      const { includeMetrics } = req.query;

      const profile = analyticsService.getPerformerProfile(performerId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Performer profile not found'
        });
      }

      let responseData: any = { profile };

      if (includeMetrics === 'true') {
        const metrics = analyticsService.getPerformerMetrics(performerId);
        responseData.metrics = metrics;
      }

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performer profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get top performers by industry
 * GET /api/v1/cross-industry-performance/performers/top/:industry
 */
router.get('/performers/top/:industry',
  [
    param('industry').isIn(Object.values(Industry)).withMessage('Valid industry is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { industry } = req.params;
      const limit = parseInt((req.query.limit as string) || '10');

      const topPerformers = analyticsService.getTopPerformers(industry as Industry, limit);

      res.json({
        success: true,
        data: {
          industry,
          topPerformers,
          count: topPerformers.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve top performers',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ================================
// INDUSTRY BENCHMARKING ENDPOINTS
// ================================

/**
 * Get industry benchmarks
 * GET /api/v1/cross-industry-performance/benchmarks/:industry
 */
router.get('/benchmarks/:industry',
  [
    param('industry').isIn(Object.values(Industry)).withMessage('Valid industry is required')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { industry } = req.params;

      const benchmarks = analyticsService.getIndustryBenchmarks(industry as Industry);

      if (!benchmarks) {
        return res.status(404).json({
          success: false,
          error: 'Benchmarks not found for industry'
        });
      }

      res.json({
        success: true,
        data: {
          industry,
          benchmarks
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve industry benchmarks',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get all industry benchmarks
 * GET /api/v1/cross-industry-performance/benchmarks
 */
router.get('/benchmarks',
  async (req: Request, res: Response) => {
    try {
      const allBenchmarks: any = {};

      Object.values(Industry).forEach(industry => {
        const benchmarks = analyticsService.getIndustryBenchmarks(industry);
        if (benchmarks) {
          allBenchmarks[industry] = benchmarks;
        }
      });

      res.json({
        success: true,
        data: {
          benchmarks: allBenchmarks,
          industries: Object.keys(allBenchmarks),
          count: Object.keys(allBenchmarks).length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve benchmarks',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ================================
// CROSS-INDUSTRY COMPARISON ENDPOINTS
// ================================

/**
 * Generate cross-industry comparison
 * GET /api/v1/cross-industry-performance/comparison
 */
router.get('/comparison',
  [
    query('industries').optional().isString().withMessage('Industries must be comma-separated string')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { industries } = req.query;

      let selectedIndustries: Industry[] | undefined;

      if (industries) {
        const industryList = (industries as string).split(',').map(i => i.trim());
        const validIndustries = industryList.filter(i => Object.values(Industry).includes(i as Industry));

        if (validIndustries.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No valid industries specified'
          });
        }

        selectedIndustries = validIndustries as Industry[];
      }

      const comparison = analyticsService.generateCrossIndustryComparison(selectedIndustries);

      res.json({
        success: true,
        data: comparison
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate cross-industry comparison',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ================================
// ANALYTICS DASHBOARD ENDPOINTS
// ================================

/**
 * Get comprehensive analytics dashboard data
 * GET /api/v1/cross-industry-performance/dashboard
 */
router.get('/dashboard',
  [
    query('industry').optional().isIn(Object.values(Industry)).withMessage('Invalid industry filter')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { industry } = req.query;

      // Get cross-industry comparison
      const crossIndustryComparison = analyticsService.generateCrossIndustryComparison();

      // Get industry-specific data if specified
      let industryData = null;
      if (industry) {
        const benchmarks = analyticsService.getIndustryBenchmarks(industry as Industry);
        const topPerformers = analyticsService.getTopPerformers(industry as Industry, 5);

        industryData = {
          industry,
          benchmarks,
          topPerformers
        };
      }

      // Get overall statistics
      const allProfiles = analyticsService.getAllPerformerProfiles();
      const overallStats = {
        totalPerformers: allProfiles.length,
        industriesTracked: Object.values(Industry).length,
        averagePerformanceScore: allProfiles.reduce((sum, p) => sum + p.overallScore, 0) / (allProfiles.length || 1),
        performanceLevelDistribution: {
          [PerformanceLevel.EXCEPTIONAL]: allProfiles.filter(p => p.performanceLevel === PerformanceLevel.EXCEPTIONAL).length,
          [PerformanceLevel.HIGH]: allProfiles.filter(p => p.performanceLevel === PerformanceLevel.HIGH).length,
          [PerformanceLevel.AVERAGE]: allProfiles.filter(p => p.performanceLevel === PerformanceLevel.AVERAGE).length,
          [PerformanceLevel.BELOW_AVERAGE]: allProfiles.filter(p => p.performanceLevel === PerformanceLevel.BELOW_AVERAGE).length,
          [PerformanceLevel.POOR]: allProfiles.filter(p => p.performanceLevel === PerformanceLevel.POOR).length
        }
      };

      res.json({
        success: true,
        data: {
          overallStats,
          crossIndustryComparison,
          industryData,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ================================
// UTILITY ENDPOINTS
// ================================

/**
 * Get available metric types by industry
 * GET /api/v1/cross-industry-performance/metric-types
 */
router.get('/metric-types',
  [
    query('industry').optional().isIn(Object.values(Industry)).withMessage('Invalid industry filter')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { industry } = req.query;

      const allMetricTypes = Object.values(PerformanceMetricType);
      let filteredMetricTypes = allMetricTypes;

      // Industry-specific metric filtering
      if (industry) {
        const industryMetricPrefixes: Record<Industry, string[]> = {
          [Industry.COLLEGE_CONSULTING]: ['student_', 'counselor_', 'application_', 'scholarship_', 'client_satisfaction', 'counseling_'],
          [Industry.SAAS]: ['sales_rep_', 'lead_', 'customer_', 'churn_', 'upsell_'],
          [Industry.MANUFACTURING]: ['account_manager_', 'production_', 'quality_', 'supplier_', 'order_', 'customer_retention'],
          [Industry.HEALTHCARE]: ['clinical_', 'patient_', 'provider_', 'treatment_', 'readmission_', 'cost_'],
          [Industry.FINTECH]: ['advisor_', 'investment_', 'compliance_', 'client_acquisition', 'risk_', 'regulatory_']
        };

        const prefixes = industryMetricPrefixes[industry as Industry];
        filteredMetricTypes = allMetricTypes.filter(metricType =>
          prefixes.some(prefix => metricType.startsWith(prefix))
        );
      }

      res.json({
        success: true,
        data: {
          metricTypes: filteredMetricTypes,
          industry: industry || 'all',
          count: filteredMetricTypes.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve metric types',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Health check endpoint
 * GET /api/v1/cross-industry-performance/health
 */
router.get('/health',
  async (req: Request, res: Response) => {
    try {
      const allProfiles = analyticsService.getAllPerformerProfiles();
      const totalMetrics = analyticsService.getTotalMetricsCount();

      res.json({
        success: true,
        data: {
          status: 'healthy',
          service: 'Cross-Industry Performance Analytics',
          totalPerformers: allProfiles.length,
          totalMetrics,
          supportedIndustries: Object.values(Industry).length,
          supportedMetricTypes: Object.values(PerformanceMetricType).length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Service health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
