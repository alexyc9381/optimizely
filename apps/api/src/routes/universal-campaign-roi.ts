import express from 'express';
import rateLimit from 'express-rate-limit';
import { redisManager } from '../services/redis-client';
import createUniversalCampaignROIService from '../services/universal-campaign-roi-service';

const router = express.Router();

// Initialize service
const service = createUniversalCampaignROIService(redisManager.getClient());

// Rate limiting
const campaignROIRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many campaign ROI requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

const analyticsRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // limit analytics requests
  message: 'Too many analytics requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}) as any;

// CAMPAIGN MANAGEMENT ENDPOINTS

// Create new campaign
router.post('/campaigns', campaignROIRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const {
      name,
      type,
      channel,
      startDate,
      endDate,
      status,
      budget,
      targeting,
      metadata
    } = req.body;

    if (!name || !type || !channel || !startDate || !budget || !metadata?.owner) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, channel, startDate, budget, metadata.owner'
      });
    }

    const campaignId = await service.createCampaign({
      name,
      type,
      channel,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      status: status || 'draft',
      budget,
      targeting: targeting || {},
      metadata: {
        owner: metadata.owner,
        team: metadata.team,
        tags: metadata.tags || [],
        description: metadata.description,
        objectives: metadata.objectives || []
      }
    });

    res.status(201).json({
      success: true,
      campaignId,
      message: 'Campaign created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create campaign',
      details: error.message
    });
  }
});

// Get campaign by ID
router.get('/campaigns/:id', campaignROIRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const campaign = await service.getCampaign(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        error: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      campaign
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve campaign',
      details: error.message
    });
  }
});

// List campaigns with filtering
router.get('/campaigns', campaignROIRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { type, channel, status, team, startDate, endDate, limit, offset } = req.query;

    const campaigns = await service.getCampaignList({
      type: type as string,
      channel: channel as string,
      status: status as string,
      team: team as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      campaigns,
      count: campaigns.length
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve campaign list',
      details: error.message
    });
  }
});

// COST TRACKING ENDPOINTS

// Add cost entry to campaign
router.post('/campaigns/:id/costs', campaignROIRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const campaignId = req.params.id;
    const {
      date,
      costType,
      amount,
      currency,
      description,
      source,
      metadata
    } = req.body;

    if (!date || !costType || amount === undefined || !currency || !source) {
      return res.status(400).json({
        error: 'Missing required fields: date, costType, amount, currency, source'
      });
    }

    const costId = await service.addCostEntry({
      campaignId,
      date: new Date(date),
      costType,
      amount: parseFloat(amount),
      currency,
      description,
      source,
      metadata: metadata || {}
    });

    res.status(201).json({
      success: true,
      costId,
      message: 'Cost entry added successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to add cost entry',
      details: error.message
    });
  }
});

// Get campaign costs
router.get('/campaigns/:id/costs', campaignROIRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate } = req.query;

    const costs = await service.getCampaignCosts(
      req.params.id,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    const totalCost = costs.reduce((sum, cost) => sum + cost.amount, 0);
    const costBreakdown = costs.reduce((acc, cost) => {
      acc[cost.costType] = (acc[cost.costType] || 0) + cost.amount;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      costs,
      summary: {
        totalCost,
        costBreakdown,
        count: costs.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve campaign costs',
      details: error.message
    });
  }
});

// REVENUE TRACKING ENDPOINTS

// Add revenue event to campaign
router.post('/campaigns/:id/revenue', campaignROIRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const campaignId = req.params.id;
    const {
      userId,
      sessionId,
      timestamp,
      revenueType,
      amount,
      currency,
      attributionModel,
      attributionWeight,
      touchpointData,
      conversionData
    } = req.body;

    if (!sessionId || !revenueType || amount === undefined || !currency || !attributionModel || attributionWeight === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId, revenueType, amount, currency, attributionModel, attributionWeight'
      });
    }

    const revenueId = await service.addRevenueEvent({
      campaignId,
      userId,
      sessionId,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      revenueType,
      amount: parseFloat(amount),
      currency,
      attributionModel,
      attributionWeight: parseFloat(attributionWeight),
      touchpointData: touchpointData || {
        position: 1,
        totalTouchpoints: 1,
        timeSinceLastTouch: 0,
        touchpointType: 'direct'
      },
      conversionData: conversionData || { isNewCustomer: true }
    });

    res.status(201).json({
      success: true,
      revenueId,
      message: 'Revenue event added successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to add revenue event',
      details: error.message
    });
  }
});

// Get campaign revenue
router.get('/campaigns/:id/revenue', campaignROIRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate } = req.query;

    const revenues = await service.getCampaignRevenue(
      req.params.id,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    const totalRevenue = revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
    const revenueByType = revenues.reduce((acc, revenue) => {
      acc[revenue.revenueType] = (acc[revenue.revenueType] || 0) + revenue.amount;
      return acc;
    }, {} as Record<string, number>);

    const revenueByAttribution = revenues.reduce((acc, revenue) => {
      acc[revenue.attributionModel] = (acc[revenue.attributionModel] || 0) + revenue.amount;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      revenues,
      summary: {
        totalRevenue,
        revenueByType,
        revenueByAttribution,
        count: revenues.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve campaign revenue',
      details: error.message
    });
  }
});

// ROI CALCULATION ENDPOINTS

// Calculate campaign ROI
router.get('/campaigns/:id/roi', analyticsRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate, attributionModel } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required query parameters: startDate, endDate'
      });
    }

    const roi = await service.calculateROI(
      req.params.id,
      new Date(startDate as string),
      new Date(endDate as string),
      attributionModel as string
    );

    if (!roi) {
      return res.status(404).json({
        error: 'Campaign not found or no data available'
      });
    }

    res.json({
      success: true,
      roi
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to calculate ROI',
      details: error.message
    });
  }
});

// Compare ROI across multiple campaigns
router.post('/roi/compare', analyticsRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { campaignIds, startDate, endDate, includeIndustryBenchmarks } = req.body;

    if (!Array.isArray(campaignIds) || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required fields: campaignIds (array), startDate, endDate'
      });
    }

    const comparison = await service.compareROI(
      campaignIds,
      new Date(startDate),
      new Date(endDate),
      { includeIndustryBenchmarks }
    );

    res.json({
      success: true,
      comparison
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to compare ROI',
      details: error.message
    });
  }
});

// Get ROI analytics summary
router.get('/analytics/roi-summary', analyticsRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate, campaignType, channel } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required query parameters: startDate, endDate'
      });
    }

    // Get campaigns based on filters
    const campaigns = await service.getCampaignList({
      type: campaignType as string,
      channel: channel as string,
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      limit: 100
    });

    const campaignIds = campaigns.map(c => c.id);

    if (campaignIds.length === 0) {
      return res.json({
        success: true,
        summary: {
          totalCampaigns: 0,
          totalCost: 0,
          totalRevenue: 0,
          averageROI: 0,
          averageROAS: 0,
          topPerformers: [],
          worstPerformers: []
        }
      });
    }

    const comparison = await service.compareROI(
      campaignIds,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    const totalCost = comparison.campaigns.reduce((sum, c) => sum + c.costs.totalCost, 0);
    const totalRevenue = comparison.campaigns.reduce((sum, c) => sum + c.revenue.totalRevenue, 0);
    const averageROI = comparison.campaigns.reduce((sum, c) => sum + c.roi.roi, 0) / comparison.campaigns.length;
    const averageROAS = comparison.campaigns.reduce((sum, c) => sum + c.roi.roas, 0) / comparison.campaigns.length;

    const sortedByROI = comparison.campaigns.sort((a, b) => b.roi.roi - a.roi.roi);

    res.json({
      success: true,
      summary: {
        totalCampaigns: campaigns.length,
        totalCost,
        totalRevenue,
        averageROI,
        averageROAS,
        topPerformers: sortedByROI.slice(0, 5).map(c => ({
          campaignId: c.campaignId,
          roi: c.roi.roi,
          roas: c.roi.roas,
          netProfit: c.roi.netProfit
        })),
        worstPerformers: sortedByROI.slice(-5).map(c => ({
          campaignId: c.campaignId,
          roi: c.roi.roi,
          roas: c.roi.roas,
          netProfit: c.roi.netProfit
        }))
      },
      insights: comparison.insights
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve ROI analytics summary',
      details: error.message
    });
  }
});

// Get cost attribution analysis
router.post('/analytics/cost-attribution', analyticsRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { campaignIds, sharedCosts, allocationMethod } = req.body;

    if (!Array.isArray(campaignIds) || !Array.isArray(sharedCosts)) {
      return res.status(400).json({
        error: 'Missing required fields: campaignIds (array), sharedCosts (array)'
      });
    }

    const attribution = await service.calculateCostAttribution(
      campaignIds,
      sharedCosts.map((cost: any) => ({
        ...cost,
        date: new Date(cost.date)
      })),
      allocationMethod || 'revenue_based'
    );

    res.json({
      success: true,
      attribution
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to calculate cost attribution',
      details: error.message
    });
  }
});

// BULK OPERATIONS

// Bulk add costs
router.post('/costs/bulk', campaignROIRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { costs } = req.body;

    if (!Array.isArray(costs)) {
      return res.status(400).json({
        error: 'Costs must be an array'
      });
    }

    const results = [];
    for (const cost of costs) {
      try {
        const costId = await service.addCostEntry({
          ...cost,
          date: new Date(cost.date)
        });
        results.push({ success: true, costId });
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `Processed ${costs.length} cost entries, ${successCount} successful`,
      results,
      successCount,
      totalCount: costs.length
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to process bulk costs',
      details: error.message
    });
  }
});

// Bulk add revenue events
router.post('/revenue/bulk', campaignROIRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { revenues } = req.body;

    if (!Array.isArray(revenues)) {
      return res.status(400).json({
        error: 'Revenues must be an array'
      });
    }

    const results = [];
    for (const revenue of revenues) {
      try {
        const revenueId = await service.addRevenueEvent({
          ...revenue,
          timestamp: new Date(revenue.timestamp || Date.now())
        });
        results.push({ success: true, revenueId });
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `Processed ${revenues.length} revenue events, ${successCount} successful`,
      results,
      successCount,
      totalCount: revenues.length
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to process bulk revenue events',
      details: error.message
    });
  }
});

// HEALTH CHECK

// Service health check
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const health = await service.getHealthStatus();

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      service: 'Universal Campaign ROI Measurement',
      status: health.status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      health
    });
  } catch (error: any) {
    res.status(503).json({
      service: 'Universal Campaign ROI Measurement',
      status: 'error',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: error.message
    });
  }
});

export default router;
