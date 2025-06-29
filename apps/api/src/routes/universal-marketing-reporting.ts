import express from 'express';
import rateLimit from 'express-rate-limit';
import { redisManager } from '../services/redis-client';
import createUniversalMarketingReportingService, {
    ReportFilters,
    ReportSchedule
} from '../services/universal-marketing-reporting-service';

const router = express.Router();

// Initialize service
const service = createUniversalMarketingReportingService(redisManager.getClient());

// Rate limiting
const reportingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many reporting requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

const dashboardRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Higher limit for dashboard updates
  message: 'Too many dashboard requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

// REPORT TEMPLATE MANAGEMENT

// Create new report template
router.post('/templates', reportingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const {
      name,
      description,
      type,
      schedule,
      format,
      filters,
      visualizations,
      recipients,
      isActive,
      metadata
    } = req.body;

    if (!name || !type || !format || !filters) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, format, filters'
      });
    }

    if (!['attribution', 'content', 'campaign', 'ab_test', 'audience', 'revenue', 'executive'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid report type'
      });
    }

    if (!['json', 'pdf', 'excel', 'csv'].includes(format)) {
      return res.status(400).json({
        error: 'Invalid report format'
      });
    }

    const templateId = await service.createTemplate({
      name,
      description,
      type,
      schedule,
      format,
      filters,
      visualizations: visualizations || [],
      recipients: recipients || [],
      isActive: isActive !== false
    });

    res.status(201).json({
      success: true,
      templateId,
      message: 'Report template created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create report template',
      details: error.message
    });
  }
});

// Get report template by ID
router.get('/templates/:id', reportingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const template = await service.getTemplate(req.params.id);

    if (!template) {
      return res.status(404).json({
        error: 'Report template not found'
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve report template',
      details: error.message
    });
  }
});

// List report templates with filtering
router.get('/templates', reportingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { type, owner, team } = req.query;

    const templates = await service.listTemplates({
      type: type as string,
      owner: owner as string,
      team: team as string
    });

    res.json({
      success: true,
      templates,
      count: templates.length
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve report templates',
      details: error.message
    });
  }
});

// REPORT GENERATION

// Generate report from template
router.post('/templates/:id/generate', reportingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const templateId = req.params.id;
    const overrideFilters = req.body.filters;

    const report = await service.generateReport(templateId, overrideFilters);

    res.json({
      success: true,
      report,
      message: 'Report generated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to generate report',
      details: error.message
    });
  }
});

// Generate ad-hoc report
router.post('/generate', reportingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const {
      type,
      format,
      filters,
      visualizations
    } = req.body;

    if (!type || !format || !filters) {
      return res.status(400).json({
        error: 'Missing required fields: type, format, filters'
      });
    }

    // Create temporary template for ad-hoc generation
    const tempTemplateId = await service.createTemplate({
      name: `Ad-hoc ${type} Report`,
      description: 'Temporary template for ad-hoc report generation',
      type,
      format,
      filters,
      visualizations: visualizations || [],
      recipients: [],
      isActive: false
    });

    const report = await service.generateReport(tempTemplateId);

    res.json({
      success: true,
      report,
      message: 'Ad-hoc report generated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to generate ad-hoc report',
      details: error.message
    });
  }
});

// SCHEDULING

// Schedule automated report
router.post('/templates/:id/schedule', reportingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const templateId = req.params.id;
    const schedule: ReportSchedule = req.body;

    if (!schedule.frequency || !schedule.timezone) {
      return res.status(400).json({
        error: 'Missing required schedule fields: frequency, timezone'
      });
    }

    if (!['realtime', 'hourly', 'daily', 'weekly', 'monthly'].includes(schedule.frequency)) {
      return res.status(400).json({
        error: 'Invalid schedule frequency'
      });
    }

    await service.scheduleReport(templateId, schedule);

    res.json({
      success: true,
      message: 'Report scheduled successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to schedule report',
      details: error.message
    });
  }
});

// Get scheduled reports
router.get('/scheduled', reportingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const scheduledReports = await service.getScheduledReports();

    res.json({
      success: true,
      scheduledReports,
      count: scheduledReports.length
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve scheduled reports',
      details: error.message
    });
  }
});

// REAL-TIME DASHBOARD

// Get dashboard data
router.get('/dashboard/:id', dashboardRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const dashboardData = await service.getDashboardData(req.params.id);

    res.json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve dashboard data',
      details: error.message
    });
  }
});

// Get real-time metrics
router.get('/realtime/metrics', dashboardRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { metrics } = req.query;
    const requestedMetrics = metrics ? (metrics as string).split(',') : ['all'];

    // This would integrate with real-time data sources
    const realtimeData = {
      timestamp: new Date(),
      visitors: {
        current: 234,
        change: '+12%',
        trend: 'up'
      },
      conversions: {
        current: 45,
        change: '+8%',
        trend: 'up'
      },
      revenue: {
        current: 2340,
        change: '+15%',
        trend: 'up'
      },
      channels: [
        { name: 'Organic Search', visitors: 145, percentage: 62 },
        { name: 'Email', visitors: 56, percentage: 24 },
        { name: 'Social Media', visitors: 33, percentage: 14 }
      ]
    };

    res.json({
      success: true,
      data: realtimeData,
      metrics: requestedMetrics
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve real-time metrics',
      details: error.message
    });
  }
});

// ANALYTICS ENDPOINTS

// Get attribution analysis
router.get('/analytics/attribution', reportingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate, channels, campaigns } = req.query;

    const filters: Partial<ReportFilters> = {
      dateRange: {
        start: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate as string) : new Date()
      }
    };

    if (channels) filters.channels = (channels as string).split(',');
    if (campaigns) filters.campaigns = (campaigns as string).split(',');

    // Generate attribution report
    const tempTemplateId = await service.createTemplate({
      name: 'Attribution Analysis',
      description: 'Attribution analysis report',
      type: 'attribution',
      format: 'json',
      filters: filters as ReportFilters,
      visualizations: [],
      recipients: [],
      isActive: false
    });

    const report = await service.generateReport(tempTemplateId);

    res.json({
      success: true,
      attribution: report.data.sections.find(s => s.type === 'attribution'),
      summary: report.data.summary
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve attribution analysis',
      details: error.message
    });
  }
});

// Get content performance analysis
router.get('/analytics/content', reportingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate, contentTypes } = req.query;

    const filters: Partial<ReportFilters> = {
      dateRange: {
        start: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate as string) : new Date()
      }
    };

    if (contentTypes) filters.contentTypes = (contentTypes as string).split(',');

    const tempTemplateId = await service.createTemplate({
      name: 'Content Performance Analysis',
      description: 'Content performance analysis report',
      type: 'content',
      format: 'json',
      filters: filters as ReportFilters,
      visualizations: [],
      recipients: [],
      isActive: false
    });

    const report = await service.generateReport(tempTemplateId);

    res.json({
      success: true,
      content: report.data.sections.find(s => s.type === 'content'),
      summary: report.data.summary
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve content performance analysis',
      details: error.message
    });
  }
});

// Get campaign ROI analysis
router.get('/analytics/campaigns', reportingRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate, campaigns } = req.query;

    const analysisData = {
      totalCampaigns: 12,
      activecampaigns: 8,
      totalSpend: 45000,
      totalRevenue: 189000,
      overallROAS: 4.2,
      topCampaigns: [
        { name: 'Holiday Sale 2024', spend: 12000, revenue: 58000, roas: 4.83 },
        { name: 'Spring Collection', spend: 8500, revenue: 33000, roas: 3.88 },
        { name: 'Brand Awareness', spend: 15000, revenue: 32000, roas: 2.13 }
      ],
      performanceByChannel: [
        { channel: 'Google Ads', campaigns: 5, roas: 4.2 },
        { channel: 'Facebook Ads', campaigns: 4, roas: 3.8 },
        { channel: 'Email Marketing', campaigns: 3, roas: 5.1 }
      ]
    };

    res.json({
      success: true,
      campaigns: analysisData
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve campaign analysis',
      details: error.message
    });
  }
});

// HEALTH CHECK
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const health = await service.getHealthStatus();
    res.json({
      service: 'Universal Marketing Reporting System',
      ...health
    });
  } catch (error: any) {
    res.status(500).json({
      service: 'Universal Marketing Reporting System',
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;
