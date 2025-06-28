import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import UniversalAuditLoggingService, { AuditFilter, AuditQuery } from '../services/universal-audit-logging-service';

const router = express.Router();
const auditService = new UniversalAuditLoggingService();

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// =============================================================================
// AUDIT RECORD ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/audit/records
 * @desc Get audit records with filtering, search, and aggregation capabilities
 * @access Public
 */
router.get('/records', [
  query('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be a valid ISO date'),
  query('category').optional().isIn(['sync', 'webhook', 'error', 'authentication', 'authorization', 'data_access', 'configuration', 'system']),
  query('action').optional().isString().trim(),
  query('entityType').optional().isString().trim(),
  query('entityId').optional().isString().trim(),
  query('userId').optional().isString().trim(),
  query('serviceId').optional().isString().trim(),
  query('severity').optional().isIn(['info', 'warning', 'error', 'critical']),
  query('status').optional().isIn(['success', 'failure', 'partial']),
  query('complianceFlags').optional().isString(),
  query('searchTerm').optional().isString().trim(),
  query('searchFields').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('limit must be between 1 and 1000'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset must be non-negative'),
  query('sortBy').optional().isString().trim(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('aggregate').optional().isString()
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const filters: AuditFilter = {};

    // Parse date filters
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    // Parse string filters
    if (req.query.category) filters.category = req.query.category as string;
    if (req.query.action) filters.action = req.query.action as string;
    if (req.query.entityType) filters.entityType = req.query.entityType as string;
    if (req.query.entityId) filters.entityId = req.query.entityId as string;
    if (req.query.userId) filters.userId = req.query.userId as string;
    if (req.query.serviceId) filters.serviceId = req.query.serviceId as string;
    if (req.query.severity) filters.severity = req.query.severity as string;
    if (req.query.status) filters.status = req.query.status as string;

    // Parse array filters
    if (req.query.complianceFlags) {
      filters.complianceFlags = (req.query.complianceFlags as string).split(',');
    }

    // Parse pagination
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
    if (req.query.offset) filters.offset = parseInt(req.query.offset as string);

    // Parse sorting
    if (req.query.sortBy) filters.sortBy = req.query.sortBy as string;
    if (req.query.sortOrder) filters.sortOrder = req.query.sortOrder as 'asc' | 'desc';

    // Build query object
    const query: AuditQuery = { filters };

    // Parse search parameters
    if (req.query.searchTerm) {
      query.searchTerm = req.query.searchTerm as string;
      query.searchFields = req.query.searchFields
        ? (req.query.searchFields as string).split(',')
        : ['action', 'entityType', 'entityId', 'metadata'];
    }

    // Parse aggregations
    if (req.query.aggregate) {
      const aggregateFields = (req.query.aggregate as string).split(',');
      query.aggregations = aggregateFields.map(field => ({
        field: field.trim(),
        type: 'terms' as const
      }));
    }

    const result = await auditService.getAuditRecords(query);

    res.json({
      success: true,
      data: {
        records: result.records,
        pagination: {
          total: result.total,
          limit: filters.limit || 100,
          offset: filters.offset || 0,
          hasMore: (filters.offset || 0) + (filters.limit || 100) < result.total
        },
        aggregations: result.aggregations,
        filters: filters
      }
    });
  } catch (error) {
    console.error('Error retrieving audit records:', error);
    res.status(500).json({
      error: 'Failed to retrieve audit records',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/audit/records
 * @desc Create a new audit record
 * @access Public
 */
router.post('/records', [
  body('category').isIn(['sync', 'webhook', 'error', 'authentication', 'authorization', 'data_access', 'configuration', 'system']),
  body('action').isString().trim().isLength({ min: 1 }).withMessage('action is required'),
  body('serviceId').isString().trim().isLength({ min: 1 }).withMessage('serviceId is required'),
  body('entityType').optional().isString().trim(),
  body('entityId').optional().isString().trim(),
  body('userId').optional().isString().trim(),
  body('sessionId').optional().isString().trim(),
  body('operationId').optional().isString().trim(),
  body('source').optional().isObject(),
  body('target').optional().isObject(),
  body('changes').optional().isArray(),
  body('metadata').optional().isObject(),
  body('severity').optional().isIn(['info', 'warning', 'error', 'critical']),
  body('status').optional().isIn(['success', 'failure', 'partial']),
  body('duration').optional().isNumeric(),
  body('complianceFlags').optional().isArray()
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const auditRecordId = await auditService.logAuditEvent(req.body);

    res.status(201).json({
      success: true,
      data: {
        auditRecordId,
        message: 'Audit record created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating audit record:', error);
    res.status(500).json({
      error: 'Failed to create audit record',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/audit/records/:id
 * @desc Get a specific audit record by ID
 * @access Public
 */
router.get('/records/:id', [
  param('id').isString().trim().isLength({ min: 1 }).withMessage('Valid audit record ID is required')
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const result = await auditService.getAuditRecords({
      filters: { limit: 1 },
      searchTerm: id,
      searchFields: ['id']
    });

    if (result.records.length === 0) {
      return res.status(404).json({
        error: 'Audit record not found',
        details: `No audit record found with ID: ${id}`
      });
    }

    res.json({
      success: true,
      data: result.records[0]
    });
  } catch (error) {
    console.error('Error retrieving audit record:', error);
    res.status(500).json({
      error: 'Failed to retrieve audit record',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// RETENTION POLICY ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/audit/retention-policies
 * @desc Get all retention policies
 * @access Public
 */
router.get('/retention-policies', async (req: express.Request, res: express.Response) => {
  try {
    const policies = auditService.getRetentionPolicies();

    res.json({
      success: true,
      data: {
        policies,
        total: policies.length
      }
    });
  } catch (error) {
    console.error('Error retrieving retention policies:', error);
    res.status(500).json({
      error: 'Failed to retrieve retention policies',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// COMPLIANCE ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/audit/compliance/summary
 * @desc Get compliance summary for different standards
 * @access Public
 */
router.get('/compliance/summary', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('standard').optional().isIn(['gdpr', 'sox', 'hipaa', 'pci', 'all'])
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const standard = req.query.standard as string || 'all';

    // Get records for the specified period
    const result = await auditService.getAuditRecords({
      filters: {
        startDate,
        endDate,
        limit: 10000 // Large limit to get comprehensive data
      },
      aggregations: [
        { field: 'category', type: 'terms' },
        { field: 'severity', type: 'terms' },
        { field: 'status', type: 'terms' },
        { field: 'serviceId', type: 'terms' }
      ]
    });

    // Calculate compliance-specific metrics
    const complianceMetrics = {
      totalRecords: result.total,
      period: { startDate, endDate },
      recordsByCategory: result.aggregations?.category_terms || {},
      recordsBySeverity: result.aggregations?.severity_terms || {},
      recordsByStatus: result.aggregations?.status_terms || {},
      recordsByService: result.aggregations?.serviceId_terms || {},
      dataAccessEvents: result.records.filter(r => r.category === 'data_access').length,
      authenticationEvents: result.records.filter(r => r.category === 'authentication').length,
      errorEvents: result.records.filter(r => r.category === 'error').length,
      securityViolations: result.records.filter(r => r.severity === 'critical' && r.status === 'failure').length,
      averageResponseTime: result.records.reduce((sum, r) => sum + (r.duration || 0), 0) / result.records.length || 0
    };

    // Filter by compliance standard if specified
    let filteredRecords = result.records;
    if (standard !== 'all') {
      filteredRecords = result.records.filter(record =>
        record.complianceFlags.includes(standard.toUpperCase())
      );
    }

    res.json({
      success: true,
      data: {
        standard,
        metrics: complianceMetrics,
        complianceRecords: filteredRecords.length,
        recommendations: generateComplianceRecommendations(complianceMetrics),
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Error generating compliance summary:', error);
    res.status(500).json({
      error: 'Failed to generate compliance summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/audit/compliance/violations
 * @desc Get potential compliance violations
 * @access Public
 */
router.get('/compliance/violations', [
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('standard').optional().isIn(['gdpr', 'sox', 'hipaa', 'pci']),
  query('limit').optional().isInt({ min: 1, max: 500 })
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const severity = req.query.severity as string;
    const standard = req.query.standard as string;
    const limit = parseInt(req.query.limit as string) || 100;

    // Get records that might indicate violations
    const violationFilters: AuditFilter = {
      status: 'failure',
      limit: limit * 2 // Get more records to filter
    };

    if (severity) {
      violationFilters.severity = severity;
    }

    const result = await auditService.getAuditRecords({
      filters: violationFilters
    });

    // Identify potential violations
    const violations = result.records
      .filter(record => {
        // Filter by compliance standard if specified
        if (standard && !record.complianceFlags.includes(standard.toUpperCase())) {
          return false;
        }

        // Check for violation indicators
        return (
          record.severity === 'critical' ||
          record.category === 'authentication' && record.status === 'failure' ||
          record.category === 'authorization' && record.status === 'failure' ||
          record.action.includes('unauthorized') ||
          record.action.includes('breach') ||
          record.action.includes('violation')
        );
      })
      .slice(0, limit)
      .map(record => ({
        id: `violation_${record.id}`,
        auditRecordId: record.id,
        type: determineViolationType(record),
        severity: record.severity,
        description: generateViolationDescription(record),
        detectedAt: record.timestamp,
        status: 'open',
        complianceStandards: record.complianceFlags,
        recommendedActions: getRecommendedActions(record)
      }));

    res.json({
      success: true,
      data: {
        violations,
        total: violations.length,
        summary: {
          critical: violations.filter(v => v.severity === 'critical').length,
          high: violations.filter(v => v.severity === 'error').length,
          medium: violations.filter(v => v.severity === 'warning').length,
          low: violations.filter(v => v.severity === 'info').length
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving compliance violations:', error);
    res.status(500).json({
      error: 'Failed to retrieve compliance violations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// ANALYTICS ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/audit/analytics/trends
 * @desc Get audit trends and patterns over time
 * @access Public
 */
router.get('/analytics/trends', [
  query('period').optional().isIn(['hour', 'day', 'week', 'month']),
  query('category').optional().isString(),
  query('days').optional().isInt({ min: 1, max: 365 })
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const period = req.query.period as string || 'day';
    const category = req.query.category as string;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const filters: AuditFilter = {
      startDate,
      endDate,
      limit: 10000
    };

    if (category) {
      filters.category = category;
    }

    const result = await auditService.getAuditRecords({ filters });

    // Group records by time period
    const trends = groupRecordsByTimePeriod(result.records, period);

    res.json({
      success: true,
      data: {
        period,
        days,
        category: category || 'all',
        trends,
        summary: {
          totalRecords: result.total,
          averagePerPeriod: trends.length > 0 ? result.total / trends.length : 0,
          peakPeriod: findPeakPeriod(trends),
          growth: calculateGrowthRate(trends)
        }
      }
    });
  } catch (error) {
    console.error('Error generating audit trends:', error);
    res.status(500).json({
      error: 'Failed to generate audit trends',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/audit/analytics/performance
 * @desc Get performance analytics for audit operations
 * @access Public
 */
router.get('/analytics/performance', async (req: express.Request, res: express.Response) => {
  try {
    const metrics = auditService.getMetrics();
    const healthStatus = await auditService.getHealthStatus();

    if (!metrics) {
      return res.status(503).json({
        error: 'Metrics not available',
        details: 'Audit service metrics are still being calculated'
      });
    }

    const performanceAnalytics = {
      currentMetrics: metrics,
      healthStatus,
      performance: {
        averageProcessingTime: metrics.averageProcessingTime,
        retentionCompliance: metrics.retentionCompliance,
        storageEfficiency: calculateStorageEfficiency(metrics),
        systemLoad: calculateSystemLoad(healthStatus.details)
      },
      recommendations: generatePerformanceRecommendations(metrics, healthStatus)
    };

    res.json({
      success: true,
      data: performanceAnalytics
    });
  } catch (error) {
    console.error('Error generating performance analytics:', error);
    res.status(500).json({
      error: 'Failed to generate performance analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// SYSTEM ENDPOINTS
// =============================================================================

/**
 * @route GET /api/v1/audit/health
 * @desc Get audit service health status
 * @access Public
 */
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const healthStatus = await auditService.getHealthStatus();

    res.status(healthStatus.status === 'healthy' ? 200 : 503).json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    console.error('Error checking audit service health:', error);
    res.status(500).json({
      error: 'Failed to check service health',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/audit/metrics
 * @desc Get current audit metrics
 * @access Public
 */
router.get('/metrics', async (req: express.Request, res: express.Response) => {
  try {
    const metrics = auditService.getMetrics();

    if (!metrics) {
      return res.status(503).json({
        error: 'Metrics not available',
        details: 'Audit metrics are still being calculated'
      });
    }

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error retrieving audit metrics:', error);
    res.status(500).json({
      error: 'Failed to retrieve audit metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// HELPER METHODS
// =============================================================================

function generateComplianceRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];

  if (metrics.securityViolations > 0) {
    recommendations.push('Review and address security violations immediately');
  }

  if (metrics.errorEvents > metrics.totalRecords * 0.1) {
    recommendations.push('High error rate detected - investigate system stability');
  }

  if (metrics.averageResponseTime > 5000) {
    recommendations.push('Performance optimization needed - response times are elevated');
  }

  recommendations.push('Regular compliance audits recommended');
  recommendations.push('Implement automated compliance monitoring');

  return recommendations;
}

function determineViolationType(record: any): string {
  if (record.category === 'authentication' && record.status === 'failure') {
    return 'Authentication Failure';
  }
  if (record.category === 'authorization' && record.status === 'failure') {
    return 'Authorization Violation';
  }
  if (record.severity === 'critical') {
    return 'Critical System Event';
  }
  if (record.action.includes('unauthorized')) {
    return 'Unauthorized Access Attempt';
  }
  return 'General Compliance Violation';
}

function generateViolationDescription(record: any): string {
  return `${record.action} in ${record.category} category with ${record.severity} severity at ${record.timestamp}`;
}

function getRecommendedActions(record: any): string[] {
  const actions: string[] = [];

  if (record.category === 'authentication') {
    actions.push('Review authentication logs');
    actions.push('Check for brute force attacks');
  }

  if (record.severity === 'critical') {
    actions.push('Immediate investigation required');
    actions.push('Notify security team');
  }

  actions.push('Document incident');
  actions.push('Review access controls');

  return actions;
}

function groupRecordsByTimePeriod(records: any[], period: string): any[] {
  const groups: Record<string, number> = {};

  records.forEach(record => {
    const date = new Date(record.timestamp);
    let key: string;

    switch (period) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        break;
      case 'week':
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${date.getMonth()}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    groups[key] = (groups[key] || 0) + 1;
  });

  return Object.entries(groups).map(([period, count]) => ({
    period,
    count
  }));
}

function findPeakPeriod(trends: any[]): any {
  return trends.reduce((peak, current) =>
    current.count > peak.count ? current : peak,
    { period: '', count: 0 }
  );
}

function calculateGrowthRate(trends: any[]): number {
  if (trends.length < 2) return 0;

  const first = trends[0].count;
  const last = trends[trends.length - 1].count;

  return first > 0 ? ((last - first) / first) * 100 : 0;
}

function calculateStorageEfficiency(metrics: any): number {
  // Simple efficiency calculation based on storage used vs records
  const avgStoragePerRecord = metrics.storageUsed / metrics.totalRecords;
  const idealStoragePerRecord = 1000; // 1KB per record ideal

  return Math.min(100, (idealStoragePerRecord / avgStoragePerRecord) * 100);
}

function calculateSystemLoad(details: any): number {
  const queueSize = details.queueSize || 0;
  const maxQueueSize = 1000;

  return (queueSize / maxQueueSize) * 100;
}

function generatePerformanceRecommendations(metrics: any, healthStatus: any): string[] {
  const recommendations: string[] = [];

  if (healthStatus.details.queueSize > 500) {
    recommendations.push('Consider increasing processing capacity');
  }

  if (metrics.averageProcessingTime > 1000) {
    recommendations.push('Optimize audit record processing');
  }

  if (metrics.retentionCompliance < 95) {
    recommendations.push('Review retention policy compliance');
  }

  recommendations.push('Monitor storage usage regularly');
  recommendations.push('Implement audit record archiving');

  return recommendations;
}

export default router;
