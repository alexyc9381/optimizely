import { Request, Response, Router } from 'express';
import CompetitiveIntelligenceService, {
    CompetitiveContext,
    CompetitorProfile
} from '../services/competitive-intelligence-service';
import { LeadData } from '../services/ml-types';

const router = Router();
const competitiveService = new CompetitiveIntelligenceService();

/**
 * POST /analyze
 * Analyze competitive landscape for a lead
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { leadData, context }: { leadData: LeadData; context?: CompetitiveContext } = req.body;

    if (!leadData) {
      return res.status(400).json({
        error: 'Lead data is required',
        message: 'Please provide lead data for competitive analysis'
      });
    }

    const landscape = await competitiveService.analyzeCompetitiveLandscape(leadData, context);

    res.json({
      success: true,
      data: landscape,
      metadata: {
        timestamp: new Date().toISOString(),
        analysisType: 'competitive_landscape',
        leadId: 'unknown' // LeadData doesn't have an id property
      }
    });
  } catch (error) {
    console.error('Competitive analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: 'Failed to analyze competitive landscape'
    });
  }
});

/**
 * POST /scoring
 * Calculate competitive scoring adjustment for lead scoring
 */
router.post('/scoring', async (req: Request, res: Response) => {
  try {
    const {
      baseScore,
      leadData,
      context
    }: {
      baseScore: number;
      leadData: LeadData;
      context?: CompetitiveContext
    } = req.body;

    if (!baseScore || !leadData) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Base score and lead data are required'
      });
    }

    if (baseScore < 0 || baseScore > 100) {
      return res.status(400).json({
        error: 'Invalid base score',
        message: 'Base score must be between 0 and 100'
      });
    }

    const scoring = await competitiveService.calculateCompetitiveScoring(baseScore, leadData, context);

    res.json({
      success: true,
      data: scoring,
      metadata: {
        timestamp: new Date().toISOString(),
        originalScore: baseScore,
        adjustedScore: scoring.finalScore,
        adjustment: scoring.competitiveAdjustment
      }
    });
  } catch (error) {
    console.error('Competitive scoring error:', error);
    res.status(500).json({
      error: 'Scoring failed',
      message: 'Failed to calculate competitive scoring'
    });
  }
});

/**
 * POST /batch-scoring
 * Calculate competitive scoring for multiple leads
 */
router.post('/batch-scoring', async (req: Request, res: Response) => {
  try {
    const {
      leads,
      context
    }: {
      leads: Array<{ baseScore: number; leadData: LeadData }>;
      context?: CompetitiveContext
    } = req.body;

    if (!leads || !Array.isArray(leads)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Leads array is required'
      });
    }

    if (leads.length > 100) {
      return res.status(400).json({
        error: 'Batch too large',
        message: 'Maximum 100 leads allowed per batch'
      });
    }

    const results = await Promise.all(
      leads.map(async ({ baseScore, leadData }) => {
        try {
          const scoring = await competitiveService.calculateCompetitiveScoring(baseScore, leadData, context);
          return {
            leadId: 'unknown', // LeadData doesn't have an id property
            success: true,
            scoring
          };
        } catch (error) {
          return {
            leadId: 'unknown', // LeadData doesn't have an id property
            success: false,
            error: 'Scoring failed for this lead'
          };
        }
      })
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      success: true,
      data: results,
      metadata: {
        timestamp: new Date().toISOString(),
        totalLeads: leads.length,
        successful,
        failed,
        batchId: `batch_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Batch competitive scoring error:', error);
    res.status(500).json({
      error: 'Batch scoring failed',
      message: 'Failed to process competitive scoring batch'
    });
  }
});

/**
 * GET /competitors
 * Get list of all competitors in database
 */
router.get('/competitors', async (req: Request, res: Response) => {
  try {
    const { industry, targetSegment, limit } = req.query;

    // Get all competitors from the service
    const allCompetitors = await competitiveService.getCompetitorIntelligence([]);

    let filteredCompetitors = allCompetitors;

    // Filter by industry if provided
    if (industry) {
      filteredCompetitors = filteredCompetitors.filter(comp =>
        comp.industry === industry
      );
    }

    // Filter by target segment if provided
    if (targetSegment) {
      filteredCompetitors = filteredCompetitors.filter(comp =>
        comp.targetSegments.includes(targetSegment as string)
      );
    }

    // Apply limit if provided
    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      if (limitNum > 0) {
        filteredCompetitors = filteredCompetitors.slice(0, limitNum);
      }
    }

    res.json({
      success: true,
      data: {
        competitors: filteredCompetitors,
        total: filteredCompetitors.length,
        available_industries: [...new Set(allCompetitors.map(c => c.industry))],
        available_segments: [...new Set(allCompetitors.flatMap(c => c.targetSegments))]
      },
      metadata: {
        timestamp: new Date().toISOString(),
        filters: { industry, targetSegment, limit }
      }
    });
  } catch (error) {
    console.error('Get competitors error:', error);
    res.status(500).json({
      error: 'Failed to retrieve competitors',
      message: 'Unable to fetch competitor data'
    });
  }
});

/**
 * GET /competitors/:id
 * Get detailed information about a specific competitor
 */
router.get('/competitors/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const competitors = await competitiveService.getCompetitorIntelligence([id]);

    if (competitors.length === 0) {
      return res.status(404).json({
        error: 'Competitor not found',
        message: `No competitor found with ID: ${id}`
      });
    }

    const competitor = competitors[0];

    res.json({
      success: true,
      data: competitor,
      metadata: {
        timestamp: new Date().toISOString(),
        competitorId: id
      }
    });
  } catch (error) {
    console.error('Get competitor error:', error);
    res.status(500).json({
      error: 'Failed to retrieve competitor',
      message: 'Unable to fetch competitor details'
    });
  }
});

/**
 * POST /competitors
 * Add a new competitor to the database
 */
router.post('/competitors', async (req: Request, res: Response) => {
  try {
    const competitor: CompetitorProfile = req.body;

    // Validate required fields
    const requiredFields = ['id', 'name', 'domain', 'industry', 'marketShare', 'pricingTier', 'targetSegments'];
    const missingFields = requiredFields.filter(field => !competitor[field as keyof CompetitorProfile]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: `The following fields are required: ${missingFields.join(', ')}`
      });
    }

    await competitiveService.addCompetitor(competitor);

    res.status(201).json({
      success: true,
      data: competitor,
      message: 'Competitor added successfully',
      metadata: {
        timestamp: new Date().toISOString(),
        competitorId: competitor.id
      }
    });
  } catch (error) {
    console.error('Add competitor error:', error);
    res.status(500).json({
      error: 'Failed to add competitor',
      message: 'Unable to add new competitor'
    });
  }
});

/**
 * PUT /competitors/:id
 * Update existing competitor information
 */
router.put('/competitors/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: Partial<CompetitorProfile> = req.body;

    // Verify competitor exists first
    const existingCompetitors = await competitiveService.getCompetitorIntelligence([id]);
    if (existingCompetitors.length === 0) {
      return res.status(404).json({
        error: 'Competitor not found',
        message: `No competitor found with ID: ${id}`
      });
    }

    await competitiveService.updateCompetitiveData(id, updates);

    // Get updated competitor data
    const updatedCompetitors = await competitiveService.getCompetitorIntelligence([id]);

    res.json({
      success: true,
      data: updatedCompetitors[0],
      message: 'Competitor updated successfully',
      metadata: {
        timestamp: new Date().toISOString(),
        competitorId: id,
        updatedFields: Object.keys(updates)
      }
    });
  } catch (error) {
    console.error('Update competitor error:', error);
    res.status(500).json({
      error: 'Failed to update competitor',
      message: 'Unable to update competitor information'
    });
  }
});

/**
 * GET /win-loss-analysis
 * Get win/loss analysis data
 */
router.get('/win-loss-analysis', async (req: Request, res: Response) => {
  try {
    const { industry, timeframe } = req.query;

    const analysis = await competitiveService.getWinLossAnalysis(
      industry as string,
      timeframe as string
    );

    res.json({
      success: true,
      data: analysis,
      metadata: {
        timestamp: new Date().toISOString(),
        filters: { industry, timeframe }
      }
    });
  } catch (error) {
    console.error('Win/loss analysis error:', error);
    res.status(500).json({
      error: 'Failed to retrieve win/loss analysis',
      message: 'Unable to fetch win/loss data'
    });
  }
});

/**
 * GET /news
 * Get competitor news and updates
 */
router.get('/news', async (req: Request, res: Response) => {
  try {
    const { competitorId, category, sentiment, limit } = req.query;

    let news = await competitiveService.monitorCompetitorNews();

    // Filter by competitor ID if provided
    if (competitorId) {
      news = news.filter(item => item.competitorId === competitorId);
    }

    // Filter by category if provided
    if (category) {
      news = news.filter(item => item.category === category);
    }

    // Filter by sentiment if provided
    if (sentiment) {
      news = news.filter(item => item.sentiment === sentiment);
    }

    // Apply limit if provided
    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      if (limitNum > 0) {
        news = news.slice(0, limitNum);
      }
    }

    // Sort by publish date (newest first)
    news.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    res.json({
      success: true,
      data: {
        news,
        total: news.length,
        available_categories: ['funding', 'product', 'leadership', 'partnership', 'acquisition', 'regulatory'],
        available_sentiments: ['positive', 'negative', 'neutral']
      },
      metadata: {
        timestamp: new Date().toISOString(),
        filters: { competitorId, category, sentiment, limit }
      }
    });
  } catch (error) {
    console.error('Competitor news error:', error);
    res.status(500).json({
      error: 'Failed to retrieve competitor news',
      message: 'Unable to fetch competitor news'
    });
  }
});

/**
 * POST /insights
 * Get competitive insights for a specific lead
 */
router.post('/insights', async (req: Request, res: Response) => {
  try {
    const { leadData }: { leadData: LeadData } = req.body;

    if (!leadData) {
      return res.status(400).json({
        error: 'Lead data is required',
        message: 'Please provide lead data for competitive insights'
      });
    }

    const insights = await competitiveService.getCompetitiveInsights(leadData);

    res.json({
      success: true,
      data: insights,
      metadata: {
        timestamp: new Date().toISOString(),
        leadId: 'unknown' // LeadData doesn't have an id property
      }
    });
  } catch (error) {
    console.error('Competitive insights error:', error);
    res.status(500).json({
      error: 'Failed to generate insights',
      message: 'Unable to generate competitive insights'
    });
  }
});

/**
 * GET /health
 * Health check endpoint for competitive intelligence service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Perform basic service health checks
    const competitors = await competitiveService.getCompetitorIntelligence([]);
    const competitorCount = competitors.length;

    res.json({
      success: true,
      status: 'healthy',
      data: {
        service: 'competitive-intelligence',
        version: '1.0.0',
        competitors_loaded: competitorCount,
        capabilities: [
          'landscape_analysis',
          'competitive_scoring',
          'win_loss_analysis',
          'competitor_intelligence',
          'market_positioning',
          'news_monitoring'
        ]
      },
      metadata: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Service health check failed'
    });
  }
});

/**
 * GET /market-trends
 * Get market trend analysis
 */
router.get('/market-trends', async (req: Request, res: Response) => {
  try {
    const { industry } = req.query;

    // Mock lead data for trend analysis
    const mockLeadData: LeadData = {
      firmographic: {
        industry: industry as string || 'technology',
        companySize: 'mid_market',
        employees: 250,
        revenue: 50000000,
        techStack: ['React', 'Node.js'],
        companyMaturity: 'growth',
        geolocation: {
          country: 'US',
          region: 'North America',
          timezone: 'America/New_York'
        }
      },
      behavioral: {
        sessionCount: 10,
        avgSessionDuration: 300,
        pageViewsPerSession: 3.5,
        contentEngagement: {
          documentsDownloaded: 2,
          videosWatched: 1,
          formsCompleted: 1,
          pricingPageViews: 3,
          featurePageViews: 5
        },
        technicalDepth: {
          integrationDocsViewed: true,
          apiDocsViewed: false,
          technicalResourcesAccessed: 2
        },
        timeOnSite: 300,
        returnVisitorPattern: 'frequent'
      },
      intent: {
        searchKeywords: ['analytics', 'business intelligence'],
        competitorResearch: true,
        buyingStageSignals: {
          awareness: 0.7,
          consideration: 0.8,
          decision: 0.6,
          purchase: 0.3
        },
        contentTopicsEngaged: ['analytics', 'optimization'],
        urgencyIndicators: {
          fastTrackRequests: false,
          demoRequests: 1,
          contactFormSubmissions: 2,
          salesInquiries: 1
        },
        socialProof: {
          testimonialViews: 3,
          caseStudyDownloads: 1,
          customerSuccessStories: 2
        }
      },
      timing: {
        dayOfWeek: 2,
        hourOfDay: 14,
        monthOfYear: 11,
        quarterOfYear: 4,
        seasonality: 'high',
        recentActivity: true,
        engagementVelocity: 1.1,
        lastVisitDays: 2,
        accountAge: 14
      }
    };

    const landscape = await competitiveService.analyzeCompetitiveLandscape(mockLeadData);

    res.json({
      success: true,
      data: {
        market_trends: landscape.marketTrends,
        industry: industry || 'technology',
        market_leader: landscape.marketLeader,
        emerging_threats: landscape.emergingThreats,
        total_competitors: landscape.totalCompetitors,
        direct_competitors: landscape.directCompetitors.length,
        indirect_competitors: landscape.indirectCompetitors.length
      },
      metadata: {
        timestamp: new Date().toISOString(),
        analysis_scope: industry || 'all_industries'
      }
    });
  } catch (error) {
    console.error('Market trends error:', error);
    res.status(500).json({
      error: 'Failed to retrieve market trends',
      message: 'Unable to fetch market trend analysis'
    });
  }
});

export default router;
